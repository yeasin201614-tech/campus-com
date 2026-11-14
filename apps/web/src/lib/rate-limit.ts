const memoryBuckets = new Map<string, number[]>();

/**
 * Sliding-window in-memory rate limiter for Next.js Route Handlers.
 * Returns { allowed, remaining, resetAfterMs }.
 */
export function checkRateLimit(key: string, maxRequests = 30, windowMs = 60_000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (memoryBuckets.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= maxRequests) {
    const oldest = timestamps[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      resetAfterMs: Math.max(0, oldest + windowMs - now),
    };
  }

  timestamps.push(now);
  memoryBuckets.set(key, timestamps);

  return {
    allowed: true,
    remaining: maxRequests - timestamps.length,
    resetAfterMs: windowMs,
  };
}
