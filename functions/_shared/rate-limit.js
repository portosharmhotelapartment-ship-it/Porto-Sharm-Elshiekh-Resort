// Small fixed-window limiter backed by D1. Only a one-way hash of the client IP is stored.
export async function allowRequest(db, scope, request, limit, windowSeconds) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(scope + ":" + ip));
  const key = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSeconds) * windowSeconds;
  await db.prepare("CREATE TABLE IF NOT EXISTS request_limits (limit_key TEXT PRIMARY KEY, window_start INTEGER NOT NULL, request_count INTEGER NOT NULL)").run();
  await db.prepare(
    "INSERT INTO request_limits(limit_key,window_start,request_count) VALUES(?,?,1) " +
    "ON CONFLICT(limit_key) DO UPDATE SET " +
    "request_count=CASE WHEN request_limits.window_start<=? THEN 1 ELSE request_limits.request_count+1 END, " +
    "window_start=CASE WHEN request_limits.window_start<=? THEN excluded.window_start ELSE request_limits.window_start END"
  ).bind(key, windowStart, windowStart, windowStart).run();
  const row = await db.prepare("SELECT request_count FROM request_limits WHERE limit_key=?").bind(key).first();
  // Opportunistic cleanup keeps the table small.
  if (Math.random() < 0.02) {
    await db.prepare("DELETE FROM request_limits WHERE window_start<?").bind(now - 86400).run();
  }
  return { allowed: Number(row?.request_count || 0) <= limit, retryAfter: Math.max(1, windowStart + windowSeconds - now) };
}
