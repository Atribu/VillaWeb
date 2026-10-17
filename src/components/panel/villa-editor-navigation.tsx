export function VillaEditorNavigation({ editing = false }: { editing?: boolean }) {
  const sections = [
    ["villa-basics", "Genel bilgiler"], ["villa-operations", "Operasyon"],
    ["villa-location", "Konum"], ["villa-amenities", "Olanaklar"],
    ["villa-fees", "Ucretler"], ["villa-rules", "Kurallar"],
    ["villa-images", "Fotograflar"], ["villa-seo", "SEO"],
    ...(editing ? [["villa-periods", "Fiyat donemleri"], ["villa-calendar", "Takvim"], ["villa-ical", "iCal"]] : []),
  ];
  return <nav aria-label="Villa bolumleri" className="panel-editor-nav">
    {sections.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
  </nav>;
}
