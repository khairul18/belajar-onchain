import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export type Lang = "id" | "en";
type Localized = Record<Lang, string>;

export type Question = {
  question: Localized;
  options: Record<Lang, string[]>;
  answer: number;
  explanation: Localized;
};

export type Quiz = { date: string; status?: string; questions: Question[] };

/** Versi untuk browser: tanpa kunci jawaban & penjelasan. */
export type PublicQuiz = {
  date: string;
  questions: { question: Localized; options: Record<Lang, string[]> }[];
};

const CONTENT_DIR = path.join(process.cwd(), "..", "content");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Tanggal hari ini di zona Asia/Jakarta (WIB), format YYYY-MM-DD. */
export function todayWIB(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(now);
}

async function availableDates(): Promise<string[]> {
  const files = await readdir(CONTENT_DIR);
  return files
    .filter((f) => f.endsWith(".json") && DATE_RE.test(f.slice(0, -5)))
    .map((f) => f.slice(0, -5))
    .sort();
}

async function readQuiz(date: string): Promise<Quiz> {
  return JSON.parse(await readFile(path.join(CONTENT_DIR, `${date}.json`), "utf8"));
}

/**
 * Kuis untuk tanggal tertentu. Bila file tanggal itu belum ada, pakai kuis terbaru
 * sebelum tanggal tersebut agar app tidak pernah kosong.
 */
export async function getQuiz(date: string): Promise<Quiz | null> {
  if (!DATE_RE.test(date)) return null;
  const dates = (await availableDates()).filter((d) => d <= date);
  const pick = dates.at(-1);
  if (!pick) return null;
  return { ...(await readQuiz(pick)), date };
}

export function toPublic(quiz: Quiz): PublicQuiz {
  return {
    date: quiz.date,
    questions: quiz.questions.map(({ question, options }) => ({ question, options })),
  };
}

export function score(quiz: Quiz, answers: number[]): number {
  return quiz.questions.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);
}
