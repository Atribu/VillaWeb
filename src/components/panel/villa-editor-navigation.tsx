"use client";

import { useEffect, useRef, useState } from "react";

export function VillaEditorNavigation({ editing = false }: { editing?: boolean }) {
  const [active, setActive] = useState("villa-basics");
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const ids = Array.from(nav.current?.querySelectorAll("a") ?? []).map((a) => a.hash.slice(1));
    let frame = 0;
    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const section = ids.filter((id) => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= 180).at(-1);
        setActive(section ?? ids[0]);
      });
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [editing]);
  const sections = [
    ["villa-basics", "Genel bilgiler"], ["villa-documents", "Belgeler"], ["villa-content-en", "İngilizce içerik"], ["villa-operations", "Operasyon"],
    ["villa-location", "Konum"], ["villa-amenities", "Olanaklar"],
    ["villa-fees", "Ucretler"], ["villa-rules", "Kurallar"],
    ["villa-images", "Fotograflar"], ["villa-seo", "SEO"],
    ...(editing ? [["villa-gallery-manage", "Galeri yönetimi"], ["villa-periods", "Fiyat donemleri"], ["villa-calendar", "Takvim"], ["villa-ical", "iCal"], ["villa-history", "Değişiklik geçmişi"]] : []),
  ];
  return <nav ref={nav} aria-label="Villa bolumleri" className="panel-editor-nav">
    <p className="panel-editor-caption">Villa düzenleyici</p>
    {sections.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined}>{label}</a>)}
  </nav>;
}
