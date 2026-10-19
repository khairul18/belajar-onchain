import { numberToHex } from "viem";
import { BADGE_ADDRESS, chain } from "@/lib/config";
import { bad, clientIp, rateLimit } from "@/lib/http";

/**
 * Proxy ERC-7677 ke CDP Paymaster. URL paymaster (berisi API key) hanya ada di server.
 * Hanya mensponsori operasi yang memanggil kontrak BelajarBadge di jaringan aktif.
 * Batas biaya utama tetap diatur di policy CDP (allowlist kontrak, limit per user, batas global).
 */
const ALLOWED = new Set(["pm_getPaymasterStubData", "pm_getPaymasterData"]);

export async function POST(req: Request) {
  const upstream = process.env.PAYMASTER_URL;
  if (!upstream) return bad("paymaster_disabled", 503);

  const limited = await rateLimit(`pm:${clientIp(req)}`, 60, 3600);
  if (limited) return limited;

  const rpc = (await req.json().catch(() => null)) as {
    method?: string;
    params?: [{ callData?: string }, string, string, unknown];
  } | null;
  if (!rpc?.method || !ALLOWED.has(rpc.method) || !Array.isArray(rpc.params)) {
    return bad("method_not_allowed", 403);
  }
  const [userOp, , chainId] = rpc.params;
  if (chainId?.toLowerCase() !== numberToHex(chain.id)) return bad("wrong_chain", 403);
  const target = BADGE_ADDRESS.slice(2).toLowerCase();
  if (!userOp?.callData?.toLowerCase().includes(target)) return bad("target_not_allowed", 403);

  const res = await fetch(upstream, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(rpc),
  });
  return new Response(res.body, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}
