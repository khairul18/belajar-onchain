"use client";

import { Quiz } from "@/components/Quiz";
import { useLang } from "@/lib/i18n";

export default function Home() {
  const { t } = useLang();
  return (
    <div className="space-y-4">
      <div className="space-y-1 pt-2">
        <h1 className="text-2xl font-bold">{t.todayQuiz}</h1>
        <p className="text-muted">{t.tagline}</p>
      </div>
      <Quiz />
    </div>
  );
}
