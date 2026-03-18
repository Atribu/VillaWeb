"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { authenticateUser, type LoginFormState } from "@/lib/auth/actions";

const initialState: LoginFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-[var(--color-teal)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:rgba(15,118,110,0.9)] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Giris yapiliyor..." : "Panele Gir"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(authenticateUser, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium text-slate-700">
          Kullanici Adi
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          placeholder="admin"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--color-aqua)] focus:bg-white"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Sifre
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

      <SubmitButton />
    </form>
  );
}
