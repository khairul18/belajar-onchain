import "server-only";
import { Redis } from "@upstash/redis";

/**
 * Penyimpanan ringan: Upstash Redis (lewat Vercel Marketplace) bila env-nya ada,
 * selain itu memori lokal (hanya untuk development, hilang saat server restart).
 */
const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

const mem = {
  sets: new Map<string, Set<string>>(),
  counters: new Map<string, { n: number; exp: number }>(),
};

if (!redis && process.env.VERCEL) {
  console.warn("[store] Redis belum dikonfigurasi: data streak tidak akan tersimpan permanen.");
}

const passesKey = (address: string) => `passes:${address.toLowerCase()}`;

export async function recordPass(address: string, date: string): Promise<void> {
  if (redis) {
    await redis.sadd(passesKey(address), date);
    await redis.sadd(`day:${date}`, address.toLowerCase());
    return;
  }
  const key = passesKey(address);
  if (!mem.sets.has(key)) mem.sets.set(key, new Set());
  mem.sets.get(key)!.add(date);
}

export async function getPasses(address: string): Promise<string[]> {
  if (redis) return (await redis.smembers(passesKey(address))) as string[];
  return [...(mem.sets.get(passesKey(address)) ?? [])];
}

/** Menaikkan penghitung dan mengembalikan nilainya; kedaluwarsa setelah `ttlSeconds`. */
export async function hit(key: string, ttlSeconds: number): Promise<number> {
  if (redis) {
    const n = await redis.incr(`rl:${key}`);
    if (n === 1) await redis.expire(`rl:${key}`, ttlSeconds);
    return n;
  }
  const now = Date.now();
  const cur = mem.counters.get(key);
  if (!cur || cur.exp < now) {
    mem.counters.set(key, { n: 1, exp: now + ttlSeconds * 1000 });
    return 1;
  }
  cur.n += 1;
  return cur.n;
}

/** Jumlah hari berturut-turut lulus kuis, berakhir hari ini (atau kemarin bila hari ini belum). */
export function streakFrom(dates: string[], today: string): number {
  const set = new Set(dates);
  const day = new Date(`${today}T00:00:00Z`);
  if (!set.has(today)) day.setUTCDate(day.getUTCDate() - 1);
  let n = 0;
  while (set.has(day.toISOString().slice(0, 10))) {
    n += 1;
    day.setUTCDate(day.getUTCDate() - 1);
  }
  return n;
}
