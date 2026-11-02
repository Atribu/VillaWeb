"use client";
import { useEffect } from "react";
import { clientTrafficSource } from "@/lib/traffic-attribution";
export function FunnelTracker({ companySlug, villaSlug }: { companySlug: string; villaSlug?: string }) {
  useEffect(() => {
    if (navigator.doNotTrack === "1" || location.search.includes("preview=1")) return;
    const source = clientTrafficSource(companySlug);
    if (!villaSlug) return;
    void fetch(`/api/public/visit?company=${encodeURIComponent(companySlug)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ villaSlug, source }), keepalive: true }).catch(() => {});
  }, [companySlug, villaSlug]);
  return null;
}
