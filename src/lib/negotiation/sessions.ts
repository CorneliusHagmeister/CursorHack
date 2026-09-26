import { Redis } from "@upstash/redis";
import type { Negotiation } from "./types";

export const SESSION_TTL_SECONDS = 60 * 60 * 24;
const MAX_TRANSCRIPT = 40;

/**
 * Upstash Redis when configured (Vercel Marketplace sets KV_REST_API_* or
 * UPSTASH_REDIS_REST_*), otherwise an in-process map for local dev.
 */
const hasRedis = Boolean(
  (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
    (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
);
const redis = hasRedis ? Redis.fromEnv() : null;

// Survives Next dev hot reloads
const g = globalThis as unknown as { __negotiations?: Map<string, Negotiation> };
const memory = (g.__negotiations ??= new Map<string, Negotiation>());

const key = (id: string) => `negotiation:${id}`;

export async function getNegotiation(id: string): Promise<Negotiation | null> {
  const neg = redis
    ? await redis.get<Negotiation>(key(id))
    : (memory.get(id) ?? null);
  if (!neg) return null;
  if (new Date(neg.expiresAt).getTime() < Date.now()) return null;
  return neg;
}

export async function saveNegotiation(neg: Negotiation): Promise<void> {
  const trimmed: Negotiation = {
    ...neg,
    transcript: neg.transcript.slice(-MAX_TRANSCRIPT),
  };
  if (redis) {
    await redis.set(key(neg.id), trimmed, { ex: SESSION_TTL_SECONDS });
  } else {
    memory.set(neg.id, trimmed);
  }
}
