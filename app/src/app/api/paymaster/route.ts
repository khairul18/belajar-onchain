import { numberToHex } from "viem";
import { BADGE_ADDRESS, chain } from "@/lib/config";
import { clientIp, rateLimit } from "@/lib/http";

/**
 * Proxy ERC-7677 ke CDP Paymaster. URL paymaster (berisi API key) hanya ada di server.
 * Hanya mensponsori operasi yang memanggil kontrak BelajarBadge di jaringan aktif.
 * Batas biaya utama tetap diatur di policy CDP (allowlist kontrak, limit per user, batas global).
 */
const ALLOWED = new Set(["pm_getPaymasterStubData", "pm_getPaymasterData"]);

// Wallet (mis. popup keys.coinbase.com) memanggil endpoint ini lintas-origin → perlu CORS.
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400",
};

const deny = (error: string, status: number) =>
  Response.json({ jsonrpc: "2.0", id: null, error: { code: -32001, message: error } }, { status, headers: CORS });

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req: Request) {
  const upstream = process.env.PAYMASTER_URL;
  if (!upstream) return deny("paymaster_disabled", 503);

  const limited = await rateLimit(`pm:${clientIp(req)}`, 60, 3600);
  if (limited) return deny("rate_limited", 429);

  const rpc = (await req.json().catch(() => null)) as {
    method?: string;
    params?: [{ callData?: string }, string, string, unknown];
  } | null;
  if (!rpc?.method || !ALLOWED.has(rpc.method) || !Array.isArray(rpc.params)) {
    return deny("method_not_allowed", 403);
  }
  const [userOp, , chainId] = rpc.params;
  if (chainId?.toLowerCase() !== numberToHex(chain.id)) {
    console.warn("[paymaster] wrong_chain", chainId);
    return deny("wrong_chain", 403);
  }
  const target = BADGE_ADDRESS.slice(2).toLowerCase();
  if (!userOp?.callData?.toLowerCase().includes(target)) {
    console.warn("[paymaster] target_not_allowed", rpc.method);
    return deny("target_not_allowed", 403);
  }

  const res = await fetch(upstream, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(rpc),
  });
  const text = await res.text();
  console.log("[paymaster]", rpc.method, res.status, text.includes('"error"') ? text.slice(0, 300) : "ok");
  return new Response(text, {
    status: res.status,
    headers: { "content-type": "application/json", ...CORS },
  });
}
