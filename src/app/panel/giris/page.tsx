import type { Metadata } from "next";
import { LoginForm } from "@/components/panel/login-form";
import { loginCredentials } from "@/lib/auth/users";

export const metadata: Metadata = {
  title: "Panel Giris",
  description: "Admin ve staff kullanicilari icin panel giris ekrani.",
};

export default function PanelLoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[2rem] bg-ocean-panel p-8 text-white shadow-2xl shadow-teal-950/20 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-100">
            Yetkili Girisi
          </p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-tight">
            Admin tum paneli gorur, villa personeli sadece villa alanlarina erisir.
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-teal-50/85">
            Bu ilk surumde iki sabit hesap tanimlandi. Sonraki adimda bunlari veritabanina
            tasiyip adminin panelden personel ekleyebildigi yapaya gecirebiliriz.
          </p>

          <div className="mt-10 grid gap-4">
            {loginCredentials.map((credential) => (
              <div
                key={credential.role}
                className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-100">
                  {credential.role === "ADMIN" ? "Admin Hesabi" : "Villa Personeli"}
                </p>
                <h2 className="mt-3 text-2xl font-semibold">{credential.displayName}</h2>
                <p className="mt-4 text-sm">
                  <span className="font-semibold">Kullanici adi:</span> {credential.username}
                </p>
                <p className="mt-1 text-sm">
                  <span className="font-semibold">Sifre:</span> {credential.password}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
            Panel Formu
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-[var(--color-ink)]">
            Kullanici adi ve sifre ile giris yap
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Admin girisinde tum menuler, personel girisinde ise sadece villa ekleme ve villa
            yonetimi alanlari gorunur.
          </p>

          <LoginForm />

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
            Bu hesaplar gelistirme amacli sabit tanimlandi. Istersen bir sonraki adimda adminin
            panelden yeni personel olusturabildigi yapayi da baglayayim.
          </div>
        </div>
      </div>
    </div>
  );
}
