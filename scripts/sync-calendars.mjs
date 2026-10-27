const secret = process.env.CALENDAR_SYNC_SECRET;
const origin = process.env.CALENDAR_SYNC_APP_URL || process.env.APP_URL;
if (!secret || secret.length < 32 || !origin) {
  console.error("APP_URL (veya CALENDAR_SYNC_APP_URL) ve en az 32 karakter CALENDAR_SYNC_SECRET gerekli.");
  process.exit(1);
}
try {
  const url = new URL("/api/internal/calendar-sync", origin);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Invalid scheduler URL");
  const response = await fetch(url, { method: "POST", redirect: "error", headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(290000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const result = await response.json();
  console.log(`Calendar sync: ${result.processed} kaynak, ${result.failed} hata.`);
  if (result.failed) process.exitCode = 1;
} catch (error) {
  console.error("Calendar sync request failed:", error instanceof Error ? error.name : "UnknownError");
  process.exitCode = 1;
}
