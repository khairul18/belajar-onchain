import { base, baseSepolia } from "viem/chains";
import type { Address } from "viem";

/** Jaringan aktif. Default testnet; ubah NEXT_PUBLIC_CHAIN=base hanya setelah "lanjut mainnet". */
export const chain = process.env.NEXT_PUBLIC_CHAIN === "base" ? base : baseSepolia;

export const BADGE_ADDRESS = (process.env.NEXT_PUBLIC_BADGE_ADDRESS ??
  "0x8A67CF07d95d49f019FC3572A198A61De1818895") as Address;

/** Builder Code dari Base Dashboard (kosong = tidak dipasang). */
export const BUILDER_CODE = process.env.NEXT_PUBLIC_BUILDER_CODE ?? "";

/** true bila server punya PAYMASTER_URL; diset saat build lewat env publik. */
export const PAYMASTER_ENABLED = process.env.NEXT_PUBLIC_PAYMASTER_ENABLED === "true";

export const PASS_SCORE = 4;
export const QUESTIONS_PER_DAY = 5;

export const BADGES = [
  { id: 1, minStreak: 1, name: { id: "Pemula Onchain", en: "Onchain Beginner" } },
  { id: 2, minStreak: 7, name: { id: "7 Hari Beruntun", en: "7-Day Streak" } },
  { id: 3, minStreak: 30, name: { id: "30 Hari Beruntun", en: "30-Day Streak" } },
] as const;

export const explorerUrl = chain.blockExplorers.default.url;
