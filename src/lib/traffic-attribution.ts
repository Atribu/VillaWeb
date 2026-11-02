import { trafficSource, type TrafficSource } from "@/lib/platform-features";
export function inferTrafficSource(search: string, referrer: string, origin: string): TrafficSource {
  const query = new URLSearchParams(search);
  const medium = (query.get("utm_medium") ?? "").toLowerCase();
  if (["email", "newsletter"].includes(medium)) return "EMAIL";
  if (["social", "paid_social"].includes(medium)) return "SOCIAL";
  if (["organic", "cpc", "ppc", "paid_search"].includes(medium)) return "SEARCH";
  try {
    const url = new URL(referrer);
    if (url.origin === origin) return "DIRECT";
    if (/(^|\.)(google\.(?:com|com\.tr|co\.uk|de|fr|nl)|bing\.com|yahoo\.com|duckduckgo\.com)$/.test(url.hostname)) return "SEARCH";
    if (/(^|\.)(instagram\.com|facebook\.com|t\.co|x\.com|linkedin\.com)$/.test(url.hostname)) return "SOCIAL";
    return "REFERRAL";
  } catch { return "DIRECT"; }
}
export function clientTrafficSource(companySlug: string): TrafficSource {
  if (typeof window === "undefined") return "DIRECT";
  try {
    const key = `villa-source:${companySlug}`;
    const current = sessionStorage.getItem(key);
    if (current) return trafficSource(current);
    const source = inferTrafficSource(location.search, document.referrer, location.origin);
    sessionStorage.setItem(key, source); return source;
  } catch { return "DIRECT"; }
}
