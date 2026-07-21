// In-memory, per-serverless-instance rate limiting. Not a distributed
// limiter -- there's no shared store (Redis/KV) wired up, and adding one
// means a new external credential the project doesn't have yet (see
// HANDOFF.md's env var audit). This still blunts a single script hammering
// an endpoint from one instance, which is the realistic threat here (login
// brute force, magic-link spam, webhook secret guessing) -- a distributed
// attacker spreading requests across many concurrent Vercel instances
// isn't fully stopped by this. Swapping in a shared store later only means
// rewriting this module's internals; checkRateLimit()'s signature doesn't
// need to change.
//
// Same "survive HMR/module reuse across invocations" pattern already used
// by lib/db/client.ts's connection pool.
declare global {
  var __pbRateLimitBuckets: Map<string, { count: number; resetAt: number }> | undefined;
}

const buckets = globalThis.__pbRateLimitBuckets ?? new Map<string, { count: number; resetAt: number }>();
globalThis.__pbRateLimitBuckets = buckets;

// Occasional cleanup so the map doesn't grow unbounded on a long-lived
// instance -- piggybacks on real calls instead of a separate timer
// (serverless functions shouldn't run background timers).
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

// Fixed-window limiter: at most `limit` calls per `windowSeconds`, per `key`.
export function checkRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true };
  }

  if (existing.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }

  existing.count += 1;
  return { allowed: true };
}
