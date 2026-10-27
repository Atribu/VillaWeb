export function publicOrigin(domain?: string | null) {
  if (!domain || domain === "-") return null;
  try {
    const url = new URL(domain.includes("://") ? domain : `https://${domain}`);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    return url.origin;
  } catch { return null; }
}
