"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { authenticateUser, type LoginFormState } from "@/lib/auth/actions";
import type { DemoCompanyRecord } from "@/lib/demo-companies";
import type { AppLocale } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n";

const initialState: LoginFormState = {};

function SubmitButton({ locale }: { locale: AppLocale }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-[var(--color-teal)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:rgba(15,118,110,0.9)] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending
        ? pickLocalized(locale, "Giris yapiliyor...", "Signing in...")
        : pickLocalized(locale, "Panele Gir", "Enter Panel")}
    </button>
  );
}

export function LoginForm({
  locale,
  companies,
}: {
  locale: AppLocale;
  companies: DemoCompanyRecord[];
}) {
  const [state, formAction] = useActionState(authenticateUser, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div className="space-y-2">
        <label htmlFor="companyName" className="text-sm font-medium text-slate-700">
          {pickLocalized(locale, "Firma Adi", "Company Name")}
        </label>
        <input
          id="companyName"
          name="companyName"
          type="text"
          list="panel-company-options"
          autoComplete="organization"
          defaultValue={state.companyName}
          placeholder={pickLocalized(locale, "VillaVera Collection", "VillaVera Collection")}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
        />
        <p className="text-xs leading-6 text-slate-500">
          {pickLocalized(
            locale,
            "Firma admini ve personel firma adini yazmalidir. Super admin girisinde bu alani bos birakabilirsin.",
            "Company admins and staff must enter their company name. You can leave this blank only for super admin login.",
          )}
        </p>
        <datalist id="panel-company-options">
          {companies.map((company) => (
            <option key={company.id} value={company.name}>
              {company.shortName} - {company.slug}
            </option>
          ))}
        </datalist>
      </div>

      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium text-slate-700">
          {pickLocalized(locale, "Kullanici Adi", "Username")}
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          defaultValue={state.username}
          placeholder={pickLocalized(locale, "admin", "admin")}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          {pickLocalized(locale, "Sifre", "Password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
        />
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      <SubmitButton locale={locale} />
    </form>
  );
}
