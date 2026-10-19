"use client";

import { Attribution } from "ox/erc8021";
import { useEffect } from "react";
import { encodeFunctionData, type Hex } from "viem";
import {
  useAccount,
  useCapabilities,
  useSendCalls,
  useSwitchChain,
  useWaitForCallsStatus,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { badgeAbi } from "@/lib/abi";
import { BADGE_ADDRESS, BADGES, BUILDER_CODE, PAYMASTER_ENABLED, chain, explorerUrl } from "@/lib/config";
import { useLang } from "@/lib/i18n";

export type Claim = { tokenId: number; deadline: string; signature: Hex };

const DATA_SUFFIX = BUILDER_CODE ? Attribution.toDataSuffix({ codes: [BUILDER_CODE] }) : undefined;

/**
 * Claim badge. Wallet yang mendukung paymaster (Coinbase Smart Wallet) → gratis gas lewat
 * wallet_sendCalls + paymasterService. Wallet lain → transaksi biasa (gas sangat kecil).
 */
export function ClaimButton({ claim, onClaimed }: { claim: Claim; onClaimed?: () => void }) {
  const { t, lang } = useLang();
  const { address, chainId, connector } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { data: caps } = useCapabilities({ query: { enabled: !!address } });
  // Base Account (Coinbase Smart Wallet) selalu mendukung paymaster; wallet lain dicek lewat EIP-5792.
  const sponsored =
    PAYMASTER_ENABLED &&
    (connector?.id === "baseAccount" || !!caps?.[chain.id]?.paymasterService?.supported);

  const calls = useSendCalls();
  const write = useWriteContract();
  const callsStatus = useWaitForCallsStatus({ id: calls.data?.id });
  const receipt = useWaitForTransactionReceipt({ hash: write.data, chainId: chain.id });

  const txHash = write.data ?? callsStatus.data?.receipts?.[0]?.transactionHash;
  const done =
    receipt.data?.status === "success" || callsStatus.data?.status === "success";
  const failed =
    calls.isError || write.isError || receipt.data?.status === "reverted" ||
    callsStatus.data?.status === "failure";
  const err = (calls.error ?? write.error) as { shortMessage?: string; message?: string } | null;
  const errorDetail =
    err?.shortMessage ?? err?.message?.split("\n")[0] ??
    (receipt.data?.status === "reverted" || callsStatus.data?.status === "failure" ? "Transaction reverted" : "");
  const busy =
    calls.isPending || write.isPending || callsStatus.isFetching || receipt.isFetching ||
    (!!calls.data && !callsStatus.data) || (!!write.data && !receipt.data);

  useEffect(() => {
    if (done) onClaimed?.();
  }, [done, onClaimed]);

  const badge = BADGES.find((b) => b.id === claim.tokenId);
  const args = [BigInt(claim.tokenId), BigInt(claim.deadline), claim.signature] as const;

  async function onClick() {
    calls.reset();
    write.reset();
    if (chainId !== chain.id) await switchChainAsync({ chainId: chain.id });
    if (sponsored) {
      calls.sendCalls({
        chainId: chain.id,
        calls: [
          { to: BADGE_ADDRESS, data: encodeFunctionData({ abi: badgeAbi, functionName: "claim", args }) },
        ],
        capabilities: {
          paymasterService: { url: `${window.location.origin}/api/paymaster` },
          ...(DATA_SUFFIX && { dataSuffix: { value: DATA_SUFFIX, optional: true } }),
        },
      });
    } else {
      write.writeContract({
        address: BADGE_ADDRESS,
        abi: badgeAbi,
        functionName: "claim",
        args,
        chainId: chain.id,
        ...(DATA_SUFFIX && { dataSuffix: DATA_SUFFIX }),
      });
    }
  }

  if (done) {
    return (
      <div className="rounded-xl bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
        ✅ {t.claimed}{" "}
        {txHash && (
          <a className="underline" href={`${explorerUrl}/tx/${txHash}`} target="_blank" rel="noreferrer">
            {t.viewTx}
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={onClick}
        disabled={busy}
        className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {busy ? t.claiming : `${sponsored ? t.claimFree : t.claim}: ${badge?.name[lang] ?? `#${claim.tokenId}`}`}
      </button>
      {failed && (
        <p className="text-sm text-red-600">
          {t.claimError}
          {errorDetail && <span className="block text-xs opacity-80">{errorDetail}</span>}
        </p>
      )}
    </div>
  );
}
