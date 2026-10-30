"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function useUnsavedChanges(dirty: boolean, saving: boolean) {
  const leaving = useRef(false);
  const router = useRouter();
  const [pendingDestination, setPendingDestination] = useState<string | null>(null);
  const shouldWarn = useEffectEvent(() => !leaving.current && (dirty || saving));

  useEffect(() => {
    if (!dirty && !saving) return;
    function beforeUnload(event: BeforeUnloadEvent) {
      if (shouldWarn()) { event.preventDefault(); event.returnValue = ""; }
    }
    function click(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (!["http:", "https:"].includes(url.protocol)) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.origin === window.location.origin) return;
      if (shouldWarn()) { event.preventDefault(); event.stopPropagation(); setPendingDestination(url.href); }
    }
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", click, true);
    };
  }, [dirty, saving]);

  return {
    allowNavigation: () => { leaving.current = true; },
    resetNavigationGuard: () => { leaving.current = false; },
    pendingDestination,
    cancelNavigation: () => setPendingDestination(null),
    confirmNavigation: () => {
      if (!pendingDestination) return;
      leaving.current = true;
      setPendingDestination(null);
      const destination = new URL(pendingDestination);
      if (destination.origin === window.location.origin) router.push(`${destination.pathname}${destination.search}${destination.hash}`);
      else window.location.assign(pendingDestination);
    },
  };
}
