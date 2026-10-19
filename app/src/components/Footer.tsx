"use client";

import { BADGE_ADDRESS, explorerUrl } from "@/lib/config";
import { useLang } from "@/lib/i18n";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="mx-auto max-w-xl space-y-1 px-4 pb-8 text-center text-xs text-muted">
      <p>{t.disclaimer}</p>
      <p>
        <a className="underline" href={`${explorerUrl}/address/${BADGE_ADDRESS}`} target="_blank" rel="noreferrer">
          Smart contract
        </a>{" "}
        ·{" "}
        <a className="underline" href="https://github.com/khairul18/belajar-onchain" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </p>
    </footer>
  );
}
