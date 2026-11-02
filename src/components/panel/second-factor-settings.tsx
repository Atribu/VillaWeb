"use client";
import { useState } from "react";
import Link from "next/link";
import { Field, usePlatformAction } from "./platform-controls";
export function SecondFactorSettings({ enabled }: { enabled: boolean }) {
  const action = usePlatformAction(); const [password, setPassword] = useState(""); const [code, setCode] = useState("");
  const [secret, setSecret] = useState(""); const [codes, setCodes] = useState<string[] | null>(null);
  async function submit(operation: string) {
    const result = await action.run<{ secret?: string; recoveryCodes?: string[]; signInAgain?: boolean }>("security", { action: operation, password, code });
    if (result?.secret) setSecret(result.secret);
    if (result?.signInAgain) { setCodes(result.recoveryCodes ?? []); setPassword(""); setCode(""); setSecret(""); }
  }
  if (codes) return <section className="work-card"><h2 className="font-semibold">Doğrulama ayarı güncellendi</h2><p className="my-3 text-sm">Tüm eski oturumlar kapatıldı. Kurtarma kodları yalnızca bu ekranda gösterilir; her biri bir kez kullanılabilir. Güvenli bir parola yöneticisinde saklayın.</p><pre className="rounded-lg bg-slate-50 p-4">{codes.join("\n")}</pre><Link className="panel-button-primary mt-5" href="/panel/giris">Yeniden giriş yap</Link></section>;
  return <form className="work-card max-w-2xl space-y-5" onSubmit={e => { e.preventDefault(); void submit(secret ? "confirm" : "begin"); }}>
    <p className="text-sm">Durum: <strong>{enabled ? "Etkin" : "Henüz etkin değil"}</strong>. Telefonunuzdaki doğrulama uygulamasıyla 30 saniyelik kod kullanılır.</p>
    {action.feedback}<Field label="Mevcut şifreniz"><input className="panel-input" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></Field>
    {secret && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm"><p>Doğrulama uygulamanıza yeni hesap ekleyin. Tür: zamana dayalı, 6 hane. Anahtar 10 dakika geçerlidir:</p><code className="my-3 block break-all select-all">{secret}</code><p>Uygulamanın ürettiği kodu aşağıya girince etkinleşir. Bu anahtarı paylaşmayın.</p></div>}
    {(secret || enabled) && <Field label="Doğrulama kodu veya tek kullanımlık kurtarma kodu"><input className="panel-input" value={code} onChange={e => setCode(e.target.value)} autoComplete="one-time-code" maxLength={32} /></Field>}
    <div className="flex flex-wrap gap-3">{!enabled && <button className="panel-button-primary" disabled={action.busy}>{secret ? "Kodu doğrula ve etkinleştir" : "Kuruluma başla"}</button>}
      {enabled && <><button type="button" className="panel-button-secondary" disabled={action.busy} onClick={() => { if (window.confirm("Eski kurtarma kodları iptal edilip yenileri oluşturulsun mu?")) void submit("recovery"); }}>Kurtarma kodlarını yenile</button><button type="button" className="panel-button-secondary" disabled={action.busy} onClick={() => { if (window.confirm("İki aşamalı doğrulamayı kapatmak istediğinizden emin misiniz?")) void submit("disable"); }}>Doğrulamayla kapat</button></>}
    </div><p className="text-xs leading-6 text-slate-500">Kurulum veya değişiklikten sonra yeniden giriş gerekir. Aynı doğrulama kodu ikinci kez kullanılamaz. Canlı sunucuda ayrı MFA_ENCRYPTION_KEY tanımlanmalıdır; anahtar güvenli yedekte tutulmalıdır.</p>
  </form>;
}
