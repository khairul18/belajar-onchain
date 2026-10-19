import { getQuiz, todayWIB } from "@/lib/quiz";
import { bad, clientIp, rateLimit } from "@/lib/http";

/** Cek satu jawaban dan kembalikan penjelasannya (setelah pengguna memilih). */
export async function POST(req: Request) {
  const limited = await rateLimit(`check:${clientIp(req)}`, 300, 3600);
  if (limited) return limited;

  const { index, choice } = (await req.json().catch(() => ({}))) as {
    index?: unknown;
    choice?: unknown;
  };
  const quiz = await getQuiz(todayWIB());
  if (!quiz) return bad("no_quiz", 404);
  if (!Number.isInteger(index) || !Number.isInteger(choice)) return bad("invalid_input");
  const q = quiz.questions[index as number];
  if (!q) return bad("invalid_index");

  return Response.json({
    correct: q.answer === choice,
    answer: q.answer,
    explanation: q.explanation,
  });
}
