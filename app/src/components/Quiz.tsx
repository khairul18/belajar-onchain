"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useLang, type Lang } from "@/lib/i18n";
import { PASS_SCORE } from "@/lib/config";
import { ClaimButton, type Claim } from "./ClaimButton";
import { WalletButton } from "./Header";

type PublicQuiz = {
  date: string;
  questions: { question: Record<Lang, string>; options: Record<Lang, string[]> }[];
};
type Feedback = { correct: boolean; answer: number; explanation: Record<Lang, string> };
type Result = {
  score: number;
  total: number;
  passed: boolean;
  streak: number;
  passedToday: boolean;
  claims: Claim[];
};
type Status = { streak: number; passedToday: boolean; claims: Claim[] };

export function Quiz() {
  const { t, lang } = useLang();
  const { address } = useAccount();

  const [quiz, setQuiz] = useState<PublicQuiz | null | "none">(null);
  const [idx, setIdx] = useState(0);
  const [choices, setChoices] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [finished, setFinished] = useState(false);
  // Hasil penilaian terikat ke alamat; ganti akun di wallet → dinilai ulang untuk akun itu.
  const [rawResult, setResult] = useState<(Result & { for: string }) | null>(null);
  const result = rawResult && rawResult.for === address ? rawResult : null;
  const [rawStatus, setStatus] = useState<Status | null>(null);
  const status = address ? rawStatus : null;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/quiz")
      .then((r) => (r.ok ? r.json() : "none"))
      .then(setQuiz)
      .catch(() => setQuiz("none"));
  }, []);

  const loadStatus = useCallback(() => {
    if (!address) return;
    fetch(`/api/profile?address=${address}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => {});
  }, [address]);

  useEffect(loadStatus, [loadStatus]);

  // Setelah selesai menjawab dan wallet terhubung → kirim jawaban untuk dinilai server.
  useEffect(() => {
    if (!finished || !address || result) return;
    fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address, answers: choices }),
    })
      .then(async (r) => {
        if (r.status === 429) throw new Error(t.rateLimited);
        if (!r.ok) throw new Error(t.claimError);
        setResult({ ...(await r.json()), for: address });
      })
      .catch((e: Error) => setError(e.message));
  }, [finished, address, result, choices, t]);

  if (quiz === null) return <Card>{t.loading}</Card>;
  if (quiz === "none") return <Card>{t.noQuiz}</Card>;

  // Sudah lulus hari ini (mis. membuka ulang halaman) → tampilkan status & badge yang belum di-claim.
  if (status?.passedToday && !finished) {
    return (
      <Card>
        <p className="font-semibold">{t.alreadyToday}</p>
        <StreakPill streak={status.streak} />
        <Claims claims={status.claims} onClaimed={loadStatus} />
        {status.claims.length === 0 && <AllOwned />}
      </Card>
    );
  }

  const total = quiz.questions.length;

  if (finished) {
    const localScore = feedback.filter((f) => f.correct).length;
    const s = result?.score ?? localScore;
    const passed = result?.passed ?? s >= PASS_SCORE;
    return (
      <Card>
        <p className="text-sm text-muted">{t.score}</p>
        <p className="text-5xl font-bold">
          {s}/{total}
        </p>
        <p className="font-semibold">{passed ? t.passed : t.failed}</p>
        {!address && passed && (
          <div className="space-y-2 pt-2">
            <p className="text-sm text-muted">{t.connectToSave}</p>
            <WalletButton block />
          </div>
        )}
        {result && <StreakPill streak={result.streak} />}
        {result && <Claims claims={result.claims} onClaimed={loadStatus} />}
        {result?.passed && result.claims.length === 0 && <AllOwned />}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </Card>
    );
  }

  const q = quiz.questions[idx];
  const fb = feedback[idx];
  const chosen = choices[idx];

  async function choose(i: number) {
    if (fb) return;
    setChoices((c) => Object.assign([...c], { [idx]: i }));
    const r = await fetch("/api/quiz/check", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ index: idx, choice: i }),
    });
    if (!r.ok) return setError(r.status === 429 ? t.rateLimited : t.claimError);
    const f: Feedback = await r.json();
    setFeedback((arr) => Object.assign([...arr], { [idx]: f }));
  }

  return (
    <Card>
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          {t.question} {idx + 1} {t.of} {total}
        </span>
        {status && <StreakPill streak={status.streak} />}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
        <div className="h-full bg-brand transition-all" style={{ width: `${((idx + (fb ? 1 : 0)) / total) * 100}%` }} />
      </div>
      <h2 className="text-lg font-semibold leading-snug">{q.question[lang]}</h2>
      <div className="space-y-2">
        {q.options[lang].map((opt, i) => {
          const isAnswer = fb && i === fb.answer;
          const isWrongPick = fb && i === chosen && !fb.correct;
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={!!fb || chosen !== undefined}
              className={`w-full rounded-xl border p-3 text-left transition ${
                isAnswer
                  ? "border-green-500 bg-green-500/10"
                  : isWrongPick
                    ? "border-red-500 bg-red-500/10"
                    : chosen === i
                      ? "border-brand"
                      : "border-line hover:bg-surface"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {fb && (
        <div className="space-y-3">
          <p className={`rounded-xl p-3 text-sm ${fb.correct ? "bg-green-500/10" : "bg-amber-500/10"}`}>
            <b>{fb.correct ? t.correct : t.wrong}</b> {fb.explanation[lang]}
          </p>
          <button
            onClick={() => (idx + 1 < total ? setIdx(idx + 1) : setFinished(true))}
            className="w-full rounded-xl bg-foreground px-4 py-3 font-semibold text-background"
          >
            {idx + 1 < total ? t.next : t.finish}
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </Card>
  );
}

function Claims({ claims, onClaimed }: { claims: Claim[]; onClaimed: () => void }) {
  if (!claims.length) return null;
  return (
    <div className="space-y-2 pt-2">
      {claims.map((c) => (
        <ClaimButton key={c.tokenId} claim={c} onClaimed={onClaimed} />
      ))}
    </div>
  );
}

function AllOwned() {
  const { t } = useLang();
  return (
    <p className="text-sm text-muted">
      {t.allOwned}{" "}
      <Link href="/profil" className="font-medium text-brand underline">
        {t.seeProfile}
      </Link>
    </p>
  );
}

export function StreakPill({ streak }: { streak: number }) {
  const { t } = useLang();
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-sm font-medium">
      🔥 {t.streak}: {streak} {t.days}
    </span>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <section className="space-y-4 rounded-2xl border border-line bg-background p-5 shadow-sm">{children}</section>;
}
