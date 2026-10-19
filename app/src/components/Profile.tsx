"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { badgeAbi } from "@/lib/abi";
import { BADGE_ADDRESS, BADGES, chain } from "@/lib/config";
import { useLang } from "@/lib/i18n";
import { ClaimButton, type Claim } from "./ClaimButton";
import { WalletButton } from "./Header";
import { Card, StreakPill } from "./Quiz";

type Status = { streak: number; totalPasses: number; claims: Claim[] };

export function Profile() {
  const { t, lang } = useLang();
  const { address } = useAccount();
  const [status, setStatus] = useState<Status | null>(null);

  const balances = useReadContracts({
    contracts: BADGES.map((b) => ({
      address: BADGE_ADDRESS,
      abi: badgeAbi,
      functionName: "balanceOf" as const,
      args: [address!, BigInt(b.id)] as const,
      chainId: chain.id,
    })),
    query: { enabled: !!address },
  });

  const load = useCallback(() => {
    if (!address) return;
    fetch(`/api/profile?address=${address}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => {});
    balances.refetch();
  }, [address, balances]);

  useEffect(() => {
    if (!address) return;
    fetch(`/api/profile?address=${address}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => {});
  }, [address]);

  if (!address) {
    return (
      <Card>
        <p>{t.connectToSave}</p>
        <WalletButton block />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <StreakPill streak={status?.streak ?? 0} />
          <span className="text-sm text-muted">
            {t.totalPasses}: {status?.totalPasses ?? 0}
          </span>
        </div>
        {!!status?.claims.length && (
          <div className="space-y-2">
            <p className="font-semibold">{t.pendingClaims}</p>
            {status.claims.map((c) => (
              <ClaimButton key={c.tokenId} claim={c} onClaimed={load} />
            ))}
          </div>
        )}
      </Card>
      <Card>
        <h2 className="font-bold">{t.myBadges}</h2>
        <div className="grid grid-cols-3 gap-3">
          {BADGES.map((b, i) => {
            const owned = (balances.data?.[i]?.result ?? 0n) > 0n;
            return (
              <div key={b.id} className="space-y-1 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/badges/${b.id}.svg`}
                  alt={b.name[lang]}
                  className={`aspect-square w-full rounded-xl ${owned ? "" : "opacity-30 grayscale"}`}
                />
                <p className="text-xs font-semibold">{b.name[lang]}</p>
                <p className="text-[11px] text-muted">
                  {owned ? t.owned : `${t.needStreak} ${b.minStreak}`}
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
