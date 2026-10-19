import "server-only";
import { createPublicClient, http, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { badgeAbi } from "./abi";
import { BADGE_ADDRESS, chain } from "./config";

export const publicClient = createPublicClient({
  chain,
  transport: http(process.env.RPC_URL),
});

function signerAccount() {
  const key = process.env.SIGNER_PRIVATE_KEY;
  if (!key) throw new Error("SIGNER_PRIVATE_KEY belum diset");
  return privateKeyToAccount(key as Hex);
}

/** Tanda tangan EIP-712 yang cocok dengan BelajarBadge.claim(). Berlaku 30 menit. */
export async function signClaim(account: Address, tokenId: number) {
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 60);
  const signature = await signerAccount().signTypedData({
    domain: { name: "BelajarBadge", version: "1", chainId: chain.id, verifyingContract: BADGE_ADDRESS },
    types: {
      Claim: [
        { name: "account", type: "address" },
        { name: "tokenId", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Claim",
    message: { account, tokenId: BigInt(tokenId), deadline },
  });
  return { tokenId, deadline: deadline.toString(), signature };
}

export async function claimedMap(account: Address, tokenIds: number[]) {
  const results = await publicClient.multicall({
    contracts: tokenIds.map((id) => ({
      address: BADGE_ADDRESS,
      abi: badgeAbi,
      functionName: "hasClaimed" as const,
      args: [account, BigInt(id)] as const,
    })),
    allowFailure: false,
  });
  return Object.fromEntries(tokenIds.map((id, i) => [id, results[i] as boolean]));
}
