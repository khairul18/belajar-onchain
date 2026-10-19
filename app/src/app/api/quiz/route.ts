import { connection } from "next/server";
import { getQuiz, toPublic, todayWIB } from "@/lib/quiz";
import { bad } from "@/lib/http";

export async function GET() {
  await connection();
  const quiz = await getQuiz(todayWIB());
  if (!quiz) return bad("no_quiz", 404);
  return Response.json(toPublic(quiz));
}
