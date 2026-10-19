import "server-only";
import type { Address } from "viem";
import { BADGES } from "./config";
import { claimedMap, signClaim } from "./signer";
import { getPasses, streakFrom } from "./store";
import { todayWIB } from "./quiz";

/** Status streak + tanda tangan untuk setiap badge yang sudah layak tapi belum di-claim. */
export async function claimStatus(address: Address) {
  const today = todayWIB();
  const passes = await getPasses(address);
  const streak = streakFrom(passes, today);
  const eligible = BADGES.filter((b) => streak >= b.minStreak).map((b) => b.id);

  const claimed = eligible.length ? await claimedMap(address, eligible) : {};
  const claims = await Promise.all(
    eligible.filter((id) => !claimed[id]).map((id) => signClaim(address, id)),
  );

  return {
    streak,
    totalPasses: passes.length,
    passedToday: passes.includes(today),
    claims,
  };
}
