"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";

export type Lang = "id" | "en";

const dict = {
  id: {
    tagline: "Kuis kripto harian, 5 soal. Lulus = badge gratis.",
    connect: "Hubungkan wallet",
    disconnect: "Putuskan",
    chooseWallet: "Pilih wallet",
    coinbaseHint: "Coinbase Wallet / Smart Wallet: claim tanpa biaya gas",
    otherHint: "Wallet lain (Rabby, MetaMask): biaya gas sangat kecil",
    todayQuiz: "Kuis hari ini",
    question: "Soal",
    of: "dari",
    next: "Lanjut",
    finish: "Lihat hasil",
    correct: "Benar!",
    wrong: "Kurang tepat.",
    loading: "Memuat…",
    noQuiz: "Belum ada kuis untuk hari ini. Coba lagi nanti.",
    score: "Skor kamu",
    passed: "Selamat, kamu lulus! 🎉",
    failed: "Belum lulus. Butuh minimal 4 benar. Coba lagi besok, ya!",
    connectToSave: "Hubungkan wallet untuk menyimpan streak dan claim badge.",
    streak: "Streak",
    days: "hari",
    claim: "Claim badge",
    claimFree: "Claim badge (gratis gas)",
    claiming: "Memproses…",
    claimed: "Badge berhasil di-claim!",
    viewTx: "Lihat transaksi",
    claimError: "Claim gagal. Coba lagi.",
    alreadyToday: "Kamu sudah lulus kuis hari ini. Sampai besok!",
    profile: "Profil",
    home: "Kuis",
    myBadges: "Badge saya",
    notOwned: "Belum dimiliki",
    owned: "Dimiliki",
    needStreak: "Butuh streak",
    pendingClaims: "Badge siap di-claim",
    totalPasses: "Total lulus",
    disclaimer: "Edukasi saja, bukan nasihat keuangan.",
    allOwned: "Kamu sudah memiliki semua badge yang tersedia saat ini. Pertahankan streak untuk badge berikutnya!",
    seeProfile: "Lihat badge di Profil",
    retry: "Coba lagi",
    rateLimited: "Terlalu banyak percobaan. Coba lagi nanti.",
  },
  en: {
    tagline: "Daily crypto quiz, 5 questions. Pass = free badge.",
    connect: "Connect wallet",
    disconnect: "Disconnect",
    chooseWallet: "Choose a wallet",
    coinbaseHint: "Coinbase Wallet / Smart Wallet: gas-free claims",
    otherHint: "Other wallets (Rabby, MetaMask): tiny gas fee",
    todayQuiz: "Today's quiz",
    question: "Question",
    of: "of",
    next: "Next",
    finish: "See results",
    correct: "Correct!",
    wrong: "Not quite.",
    loading: "Loading…",
    noQuiz: "No quiz for today yet. Please check back later.",
    score: "Your score",
    passed: "Congrats, you passed! 🎉",
    failed: "Not passed yet. You need at least 4 correct. Try again tomorrow!",
    connectToSave: "Connect a wallet to save your streak and claim badges.",
    streak: "Streak",
    days: "days",
    claim: "Claim badge",
    claimFree: "Claim badge (gas-free)",
    claiming: "Processing…",
    claimed: "Badge claimed!",
    viewTx: "View transaction",
    claimError: "Claim failed. Please try again.",
    alreadyToday: "You already passed today's quiz. See you tomorrow!",
    profile: "Profile",
    home: "Quiz",
    myBadges: "My badges",
    notOwned: "Not owned",
    owned: "Owned",
    needStreak: "Needs streak",
    pendingClaims: "Badges ready to claim",
    totalPasses: "Total passes",
    disclaimer: "Education only, not financial advice.",
    allOwned: "You already own every badge available right now. Keep your streak for the next one!",
    seeProfile: "See badges in Profile",
    retry: "Try again",
    rateLimited: "Too many attempts. Please try again later.",
  },
} as const;

export type Dict = Record<keyof (typeof dict)["id"], string>;

const LangContext = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void }>({
  lang: "id",
  t: dict.id,
  setLang: () => {},
});

// Pilihan bahasa disimpan di localStorage (bila tersedia), dengan cadangan di memori.
let memLang: Lang = "id";
const listeners = new Set<() => void>();

function readLang(): Lang {
  try {
    const saved = localStorage.getItem("lang");
    if (saved === "en" || saved === "id") return saved;
  } catch {}
  return memLang;
}

function writeLang(l: Lang) {
  memLang = l;
  try {
    localStorage.setItem("lang", l);
  } catch {}
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function LangProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, readLang, () => "id" as Lang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return <LangContext value={{ lang, t: dict[lang], setLang: writeLang }}>{children}</LangContext>;
}

export const useLang = () => useContext(LangContext);
