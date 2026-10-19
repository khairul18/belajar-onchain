import { connection, type NextRequest } from "next/server";
import { getAddress, isAddress } from "viem";
import { claimStatus } from "@/lib/claims";
import { bad, clientIp, rateLimit } from "@/lib/http";

export async function GET(req: NextRequest) {
  await connection();
  const address = req.nextUrl.searchParams.get("address");
  if (!address || !isAddress(address)) return bad("invalid_address");

  const limited = await rateLimit(`profile:${clientIp(req)}`, 120, 3600);
  if (limited) return limited;

  return Response.json(await claimStatus(getAddress(address)));
}
