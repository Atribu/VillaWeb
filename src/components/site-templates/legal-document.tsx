import Link from "next/link";
import { getDemoCompanySiteHref } from "@/lib/demo-companies";
import { pickLocalized, type AppLocale } from "@/lib/i18n";
import { EditorialBreadcrumbs } from "./editorial-parts";
import { SiteIcon } from "./site-icon";
import e from "./editorial-pages.module.css";
import s from "./support-pages.module.css";

export function LegalDocument({ locale, companySlug, companyName, title, intro, sections, pending = false, version }: {
  locale: AppLocale; companySlug: string; companyName: string; title: string; intro: string;
  sections: { title: string; text?: string }[]; pending?: boolean; version?: string;
}) {
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  const href = (path: string) => getDemoCompanySiteHref(companySlug, path);
  return <div className={e.page}>
    <EditorialBreadcrumbs companySlug={companySlug} locale={locale} label={title} />
    <article>
      <header className={s.heading}>
        <p className={e.eyebrow}>{companyName} / {t("BİLGİLENDİRME", "INFORMATION")}</p>
        <h1 className={e.title}>{title}</h1><p className={e.intro}>{intro}</p>
        {version && <p className={s.documentVersion}>{t("Metin sürümü", "Document version")}: {version}</p>}
      </header>
      {pending && <div className={s.pendingNotice}><SiteIcon name="calendar" /><p>{t("Bu sayfada henüz yalnızca içerik başlıkları bulunuyor; tam metin yayımlanmamıştır. Aşağıdaki başlıklar tamamlanmış bir hukuki metin değildir. Ayrıntılı bilgi için firmayla iletişime geçebilirsiniz.", "Only section headings are currently available; the full text has not been published. The headings below are not a completed legal document. Please contact the company for further information.")}</p></div>}
      <div className={s.documentLayout}>
        <aside className={s.contents}><p>{t("İÇİNDEKİLER", "CONTENTS")}</p><nav aria-label={t("Belge içindekiler", "Document contents")}>{sections.map((section, index) => <a href={`#madde-${index + 1}`} key={section.title}>0{index + 1}. {section.title}</a>)}</nav></aside>
        <div className={s.reading}>{sections.map((section, index) => <section key={section.title} id={`madde-${index + 1}`}>
          <h2>{index + 1}. {section.title}</h2>{section.text ? <p>{section.text}</p> : <p>{t("Ayrıntılı metin henüz yayımlanmadı.", "The full section text has not yet been published.")}</p>}
        </section>)}</div>
      </div>
    </article>
    <nav className={s.documentLinks} aria-label={t("İlgili sayfalar", "Related pages")}>
      {[["/kvkk", t("KVKK", "Data protection")], ["/gizlilik", t("Gizlilik politikası", "Privacy policy")], ["/kullanim-kosullari", t("Kullanım koşulları", "Terms of use")], ["/iletisim", t("Bize ulaşın", "Contact us")]].map(([path, label]) => <Link key={path} href={href(path)} className={e.textLink}>{label}<SiteIcon name="arrow" /></Link>)}
    </nav>
  </div>;
}
