"use client";

import { useId, useState } from "react";
import { pickLocalized, type AppLocale } from "@/lib/i18n";
import { getPublicFaqGroups, normalizeFaqSearch } from "@/lib/public-faq";
import { SiteIcon } from "./site-icon";
import s from "./support-pages.module.css";

export function FaqExplorer({ locale }: { locale: AppLocale }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const searchId = useId();
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  const groups = getPublicFaqGroups(locale);
  const normalized = normalizeFaqSearch(query);
  const visible = groups.filter((group) => category === "all" || group.id === category).map((group) => ({
    ...group, items: group.items.filter((item) => normalizeFaqSearch(`${item.question} ${item.answer}`).includes(normalized)),
  })).filter((group) => group.items.length);
  const count = visible.reduce((total, group) => total + group.items.length, 0);

  return <div className={s.helpLayout}>
    <aside className={s.helpSidebar}>
      <label htmlFor={searchId}>{t("Sorular içinde ara", "Search questions")}</label>
      <div className={s.search}><SiteIcon name="search" /><input id={searchId} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Örn. ödeme, tarih…", "e.g. payment, dates…")} />{query && <button type="button" onClick={() => setQuery("")} aria-label={t("Aramayı temizle", "Clear search")}><SiteIcon name="close" /></button>}</div>
      <nav className={s.categoryNav} aria-label={t("Soru kategorileri", "Question categories")}>
        {[{ id: "all", title: t("Tüm sorular", "All questions"), items: groups.flatMap((group) => group.items) }, ...groups].map((group) => <button type="button" key={group.id} aria-pressed={category === group.id} onClick={() => setCategory(group.id)}>{group.title}<span>{group.items.length}</span></button>)}
      </nav>
    </aside>
    <div className={s.helpContent}>
      <p role="status" className={s.resultCount}>{t(`${count} soru gösteriliyor`, `${count} questions shown`)}</p>
      {visible.length ? visible.map((group) => <section className={s.faqGroup} key={group.id}>
        <h2>{group.title}</h2>
        {group.items.map((item) => <details key={item.id}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}
      </section>) : <div className={s.noResults}><SiteIcon name="search" /><h2>{t("Bu soruyu bulamadık.", "We couldn’t find that question.")}</h2><p>{t("Başka bir kelime deneyin veya tüm sorulara geri dönün.", "Try another word or return to all questions.")}</p><button type="button" onClick={() => { setQuery(""); setCategory("all"); }}>{t("Tüm soruları göster", "Show all questions")}</button></div>}
    </div>
  </div>;
}
