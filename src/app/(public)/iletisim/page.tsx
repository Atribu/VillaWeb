import type { Metadata } from "next";
import Link from "next/link";
import { EditorialBreadcrumbs, PlanningCta } from "@/components/site-templates/editorial-parts";
import { SiteIcon } from "@/components/site-templates/site-icon";
import s from "@/components/site-templates/editorial-pages.module.css";
import { demoCompanies, getDemoCompanySiteHref, getLocalizedDemoCompanyRecord } from "@/lib/demo-companies";
import { pickLocalized } from "@/lib/i18n";
import { buildPublicMetadata } from "@/lib/public-metadata";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getCurrentPublicCompany } from "@/lib/server/demo-company-context";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  return buildPublicMetadata({
    locale,
    title: { tr: "İletişim", en: "Contact" },
    description: {
      tr: `Villa seçimi ve tatil planınız için ${company.shortName} ekibiyle iletişime geçin. Telefon, e-posta ve WhatsApp iletişim bilgileri.`,
      en: `Contact the ${company.shortName} team to discuss your villa choice and holiday plans. Find our phone, email and WhatsApp details.`,
    },
    canonical: "/iletisim",
  });
}

export default async function ContactPage() {
  const locale = await getCurrentLocale();
  const company = await getCurrentPublicCompany();
  const t = (tr: string, en: string) => pickLocalized(locale, tr, en);
  const href = (path: string) => getDemoCompanySiteHref(company.slug, path);
  const phone = company.phone.replace(/[^\d+]/g, "");
  const whatsapp = company.whatsapp.replace(/\D/g, "");
  const email = company.email.trim();
  // Translate seeded hours only; never replace a company's customized schedule.
  const seededHours = demoCompanies.find((item) => item.slug === company.slug)?.supportHours;
  const supportHours = company.supportHours === seededHours
    ? getLocalizedDemoCompanyRecord(company, locale).supportHours
    : company.supportHours;
  const contacts = [
    { icon: "phone" as const, label: t("BİZİ ARAYIN", "GIVE US A CALL"), value: company.phone, href: /\d/.test(phone) ? `tel:${phone}` : "", description: t("Villa seçiminizi ve tatil planınızı konuşalım.", "Let’s talk about your villa and holiday plans.") },
    { icon: "message" as const, label: "WHATSAPP", value: company.whatsapp, href: whatsapp ? `https://wa.me/${whatsapp}` : "", description: t("Tarihlerinizi ve merak ettiklerinizi bize yazın.", "Send us your dates and any questions.") },
    { icon: "mail" as const, label: t("BİZE YAZIN", "SEND US AN EMAIL"), value: email, href: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : "", description: t("Detaylı sorularınız için e-posta ile ulaşın.", "Get in touch by email for detailed questions.") },
  ].filter((contact) => contact.href);
  const questions = [
    { question: t("Hangi villanın bana uygun olduğunu bilmiyorum.", "I’m not sure which villa is right for me."), answer: t("Gitmek istediğiniz bölgeyi, tarihleri, misafir sayısını ve sizin için önemli olan özellikleri paylaşın. Seçenekleri değerlendirmenize yardımcı olalım.", "Tell us your preferred destination, dates, guest count and what matters to you. We can help you explore the options.") },
    { question: t("Talep göndermek rezervasyonumu kesinleştirir mi?", "Does sending an inquiry confirm my booking?"), answer: t("Hayır. Talebinizden sonra uygunluk ve konaklama detayları kontrol edilir. Rezervasyonunuz, size iletilen teklifin onay ve ödeme koşulları tamamlandığında kesinleşir.", "No. Availability and stay details are checked after your inquiry. Your booking is confirmed once the confirmation and payment terms in your offer are completed.") },
    { question: t("Mevcut talebim hakkında nasıl bilgi alabilirim?", "How can I ask about an existing inquiry?"), answer: t("Bizimle iletişime geçerken adınızı, villa adını veya kısa kodunu ve konaklama tarihlerinizi paylaşmanız yeterli. Talebinizin detaylarını birlikte kontrol edelim.", "When contacting us, share your name, villa name or short code and stay dates. We can then look into your inquiry together.") },
  ];

  return <div className={s.page}>
    <EditorialBreadcrumbs companySlug={company.slug} locale={locale} label={t("İletişim", "Contact")} />
    <section className={s.contactHero}>
      <div>
        <p className={s.eyebrow}>{company.shortName} / {t("BİR MERHABA İLE BAŞLAR", "IT STARTS WITH HELLO")}</p>
        <h1 className={s.title}>{t("Birlikte", "Let’s plan")}<br /><em>{t("planlayalım.", "your escape.")}</em></h1>
        <p className={s.intro}>{t("Aklınızda bir villa, bir tarih ya da sadece bir tatil hayali mi var? Sorularınızı dinlemek ve detayları birlikte netleştirmek için buradayız.", "A villa in mind, a date on the calendar or simply a holiday you’re dreaming of? We’re here to listen and help work out the details.")}</p>
        <div className={s.contactNote}><SiteIcon name="calendar" /><p>{t("Villanızı seçtiyseniz tarihlerinizi belirleyerek doğrudan konaklama talebi gönderebilirsiniz.", "Already found your villa? Choose your dates and send a stay inquiry directly.")}</p></div>
        <Link className={s.textLink} href={href("/talep")}>{t("Konaklama talebi oluştur", "Send a stay inquiry")}<SiteIcon name="arrow" /></Link>
      </div>
      <div>
        <div className={s.contactList}>{contacts.map((contact) => <a key={contact.icon} className={s.contactLink} href={contact.href} {...(contact.icon === "message" ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          <SiteIcon name={contact.icon} /><div><small>{contact.label}</small><strong>{contact.value}</strong><p>{contact.description}</p></div><SiteIcon name="arrow" />
        </a>)}</div>
        {!contacts.length && <p className={s.body}>{t("İletişim bilgilerimiz güncelleniyor. Konaklama talep sayfasından bize ulaşabilirsiniz.", "Our contact details are being updated. You can reach us through the stay inquiry page.")}</p>}
        <div className={s.contactDetails}>
          {company.address && <div><h2>{t("Adres", "Address")}</h2><address>{company.address}</address></div>}
          {supportHours && supportHours !== "-" && <div><h2>{t("İletişim saatleri", "Contact hours")}</h2><p>{supportHours}</p></div>}
          {company.legalName && <div><h2>{t("Firma bilgisi", "Company")}</h2><p>{company.legalName}</p></div>}
        </div>
      </div>
    </section>
    <PlanningCta companySlug={company.slug} locale={locale} />
    <section className={s.faq}>
      <div><p className={s.eyebrow}>{t("AKLINIZDA KALMASIN", "GOOD TO KNOW")}</p><h2 className={s.sectionTitle}>{t("Sormadan", "Before you")}<br /><em>{t("geçmeyin.", "say hello.")}</em></h2></div>
      <div>{questions.map((item) => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div>
    </section>
  </div>;
}
