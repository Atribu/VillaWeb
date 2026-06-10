import type { Metadata } from "next";
import { LoginForm } from "@/components/panel/login-form";
import { loginCredentials } from "@/lib/auth/users";
import { pickLocalized } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/server/app-locale";
import { getAllCompanyRecords } from "@/lib/server/company-store";

export const metadata: Metadata = {
  title: "Panel Giris",
  description: "Super admin, firma admini ve firma personeli icin panel giris ekrani.",
};

export default async function PanelLoginPage() {
  const [locale, companies] = await Promise.all([getCurrentLocale(), getAllCompanyRecords()]);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[2rem] bg-ocean-panel p-8 text-white shadow-2xl shadow-teal-950/20 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-100">
            {pickLocalized(locale, "Yetkili Girisi", "Authorized Access")}
          </p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-tight">
            {pickLocalized(
              locale,
              "Admin tum paneli gorur, villa personeli sadece villa alanlarina erisir.",
              "Admins see the whole panel, while villa staff only access villa-related modules.",
            )}
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-teal-50/85">
            {pickLocalized(
              locale,
              "Demo artik cok firmali calisiyor. Super admin tum firmalari gorur; firma adminleri ve personeller ise sadece kendi sirket verilerini ve kendi web sitesini yonetir.",
              "The demo now works in a multi-tenant model. Super admins see all companies, while company admins and staff manage only their own data and website.",
            )}
          </p>

          <div className="mt-10 grid gap-4">
            {loginCredentials.map((credential) => (
              <div
                key={credential.username}
                className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-100">
                  {credential.role === "SUPER_ADMIN"
                    ? pickLocalized(locale, "Platform Yetkilisi", "Platform Owner")
                    : credential.role === "ADMIN"
                      ? pickLocalized(locale, "Firma Admini", "Company Admin")
                      : pickLocalized(locale, "Firma Personeli", "Company Staff")}
                </p>
                <h2 className="mt-3 text-2xl font-semibold">{credential.displayName}</h2>
                {credential.companyName ? (
                  <p className="mt-3 text-sm text-teal-50/90">{credential.companyName}</p>
                ) : null}
                <p className="mt-4 text-sm">
                  <span className="font-semibold">{pickLocalized(locale, "Firma:", "Company:")}</span>{" "}
                  {credential.companyName ?? pickLocalized(locale, "Bos birak", "Leave blank")}
                </p>
                <p className="mt-1 text-sm">
                  <span className="font-semibold">
                    {pickLocalized(locale, "Kullanici adi:", "Username:")}
                  </span>{" "}
                  {credential.username}
                </p>
                <p className="mt-1 text-sm">
                  <span className="font-semibold">{pickLocalized(locale, "Sifre:", "Password:")}</span>{" "}
                  {credential.password}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
            {pickLocalized(locale, "Panel Formu", "Panel Login")}
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-[var(--color-ink)]">
            {pickLocalized(locale, "Kullanici adi ve sifre ile giris yap", "Sign in with your username and password")}
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {pickLocalized(
              locale,
              "Super admin tum firmalari gorur. Firma admini kendi panelini ve kendi sitesini yonetir, personel ise sadece yetkili oldugu villa alanlarini kullanir.",
              "Super admins see all companies. Company admins manage only their own panel and website, while staff use only the villa modules they are allowed to access.",
            )}
          </p>

          <LoginForm locale={locale} companies={companies} />

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
            {pickLocalized(
              locale,
              "Super admin disindaki butun hesaplarda once firma adini, sonra kullanici adi ve sifreyi yazman gerekir. Boyleyce her firma sadece kendi verisini gorur.",
              "For every account except super admin, you must enter the company name first, then the username and password. This keeps each company limited to its own data.",
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
