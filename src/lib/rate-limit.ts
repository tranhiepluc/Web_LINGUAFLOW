/** Rate limiter đơn giản (in-memory) — đủ cho single-instance dev/small prod. */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  { limit = 10, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {},
): { success: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    buckets.set(key, bucket);
    return { success: false, remaining: 0 };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { success: true, remaining: limit - bucket.timestamps.length };
}

/** Dọn dẹp định kỳ để tránh rò rỉ bộ nhớ. */
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, bucket] of buckets) {
        if (bucket.timestamps.every((t) => now - t > 300_000)) buckets.delete(key);
      }
    },
    5 * 60_000,
  );
}
