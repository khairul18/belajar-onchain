import { getAddress, isAddress } from "viem";
import { PASS_SCORE } from "@/lib/config";
import { getQuiz, score, todayWIB } from "@/lib/quiz";
import { recordPass } from "@/lib/store";
import { claimStatus } from "@/lib/claims";
import { bad, clientIp, rateLimit } from "@/lib/http";

/** Nilai semua jawaban di server. Bila lulus: catat streak dan beri tanda tangan claim. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { address?: string; answers?: unknown };
  const today = todayWIB();
  const quiz = await getQuiz(today);
  if (!quiz) return bad("no_quiz", 404);

  if (!body.address || !isAddress(body.address)) return bad("invalid_address");
  const answers = body.answers;
  if (
    !Array.isArray(answers) ||
    answers.length !== quiz.questions.length ||
    !answers.every((a) => Number.isInteger(a))
  ) {
    return bad("invalid_answers");
  }
  const address = getAddress(body.address);

  const limited =
    (await rateLimit(`submit:${address}:${today}`, 10, 86400)) ??
    (await rateLimit(`submit-ip:${clientIp(req)}:${today}`, 60, 86400));
  if (limited) return limited;

  const correct = score(quiz, answers as number[]);
  const passed = correct >= PASS_SCORE;
  if (passed) await recordPass(address, today);

  return Response.json({
    score: correct,
    total: quiz.questions.length,
    passed,
    ...(await claimStatus(address)),
  });
}
