import "server-only";
import { hit } from "./store";

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** Mengembalikan Response 429 bila batas terlampaui, atau null bila masih boleh. */
export async function rateLimit(key: string, max: number, ttlSeconds: number) {
  const n = await hit(key, ttlSeconds);
  return n > max ? Response.json({ error: "rate_limited" }, { status: 429 }) : null;
}

export const bad = (error: string, status = 400) => Response.json({ error }, { status });
