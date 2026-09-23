interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

/**
 * Basic in-memory rate limiter for serverless environment / API routes.
 * @param ip Client IP address or key
 * @param limit Max allowed attempts in window
 * @param windowMs Window duration in milliseconds (e.g., 15 mins = 900,000 ms)
 */
export function checkRateLimit(ip: string, limit = 5, windowMs = 15 * 60 * 1000): { allowed: boolean; remaining: number; resetSeconds: number } {
  const now = Date.now();
  const record = store[ip];

  if (!record || now > record.resetTime) {
    store[ip] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return { allowed: true, remaining: limit - 1, resetSeconds: Math.ceil(windowMs / 1000) };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetSeconds: Math.ceil((record.resetTime - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetSeconds: Math.ceil((record.resetTime - now) / 1000),
  };
}
