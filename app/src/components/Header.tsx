"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAccount, useConnect, useConnectors, useDisconnect } from "wagmi";
import { useLang } from "@/lib/i18n";

/** Nama yang lebih jelas untuk connector bawaan. */
function walletName(c: { id: string; name: string }) {
  if (c.id === "baseAccount") return "Coinbase Wallet / Base Account";
  if (c.id === "injected") return "Browser Wallet";
  return c.name;
}

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function Header() {
  const { t, lang, setLang } = useLang();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid size-8 place-items-center rounded-full bg-brand text-sm text-white">
            B
          </span>
          <span className="hidden sm:inline">BelajarOnchain</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <NavLink href="/" active={pathname === "/"}>
            {t.home}
          </NavLink>
          <NavLink href="/profil" active={pathname === "/profil"}>
            {t.profile}
          </NavLink>
          <button
            onClick={() => setLang(lang === "id" ? "en" : "id")}
            className="rounded-md px-2 py-1 font-medium text-muted hover:bg-surface"
            aria-label="Ganti bahasa / Switch language"
          >
            {lang === "id" ? "EN" : "ID"}
          </button>
          <WalletButton />
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: string }) {
  return (
    <Link
      href={href}
      className={`rounded-md px-2 py-1 ${active ? "bg-surface font-semibold" : "text-muted hover:bg-surface"}`}
    >
      {children}
    </Link>
  );
}

export function WalletButton({ block = false }: { block?: boolean }) {
  const { t } = useLang();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        title={t.disconnect}
        className="rounded-md border border-line px-2 py-1 font-mono text-xs hover:bg-surface"
      >
        {short(address)}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`rounded-md bg-brand px-3 py-1.5 font-semibold text-white hover:opacity-90 ${block ? "w-full py-3" : "text-xs"}`}
      >
        {t.connect}
      </button>
      {open && <ConnectDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function ConnectDialog({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  const connectors = useConnectors();
  const { connect, isPending } = useConnect({ mutation: { onSuccess: onClose } });
  // Sembunyikan connector "Injected" generik bila wallet sudah terdeteksi lewat EIP-6963.
  const list = connectors.filter((c) => c.id !== "injected" || connectors.length <= 2);

  return (
    <div
      className="fixed inset-0 z-20 grid place-items-end bg-black/40 sm:place-items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm space-y-3 rounded-t-2xl bg-background p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold">{t.chooseWallet}</h2>
        {list.map((c) => (
          <button
            key={c.uid}
            disabled={isPending}
            onClick={() => connect({ connector: c })}
            className="flex w-full items-center gap-3 rounded-xl border border-line p-3 text-left hover:bg-surface disabled:opacity-50"
          >
            {c.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.icon} alt="" className="size-8 rounded-md" />
            ) : (
              <span className="grid size-8 place-items-center rounded-md bg-brand text-white">◎</span>
            )}
            <span>
              <span className="block font-semibold">{walletName(c)}</span>
              <span className="block text-xs text-muted">
                {c.id === "baseAccount" ? t.coinbaseHint : t.otherHint}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
