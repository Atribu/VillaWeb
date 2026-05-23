import Link from "next/link";
import {
  getDemoAgencies,
  getDemoInternalMessages,
  getDemoTeamUsers,
  getDemoUsersMessagesOverview,
} from "@/lib/server/demo-users-messages-store";

export const dynamic = "force-dynamic";

export default async function PanelUsersMessagesOverviewPage() {
  const [overview, agencies, users, messages] = await Promise.all([
    getDemoUsersMessagesOverview(),
    getDemoAgencies(),
    getDemoTeamUsers(),
    getDemoInternalMessages(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2b78ad]">
          Kullanicilar & Mesajlar
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Acenta, ekip ve ic iletisim akislarini tek merkezden yonet
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Bu alan partner yapisi, ekip rolleri, mesaj akislari ve komisyon kurallarini ayni
          backoffice omurgasi uzerinde toplar. Durum guncellemeleri tum listelerde canli akar.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {overview.summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {card.label}
            </p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-3 text-sm leading-7 text-slate-500">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                Acenta Ozet
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                Kanal bazli canli durum
              </h3>
            </div>
            <Link
              href="/panel/kullanicilar-mesajlar/acentalar"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Acentalar
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {agencies.slice(0, 3).map((agency) => (
              <div key={agency.id} className="rounded-[1.35rem] bg-[#f8fafc] px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{agency.name}</p>
                    <p className="mt-2 text-sm text-slate-500">{agency.ownerName}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{agency.requestCount} talep</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
                Ekip Durumu
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                Son aktif kullanicilar
              </h3>
            </div>
            <Link
              href="/panel/personel"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Personel
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {users.slice(0, 4).map((user) => (
              <div key={user.id} className="rounded-[1.35rem] bg-[#f8fafc] px-5 py-5">
                <p className="font-semibold text-slate-900">{user.fullName}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {user.branchName} · {user.agencyName}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[2rem] border border-black/6 bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-coral)]">
              Son Mesajlar
            </p>
            <h3 className="mt-4 text-2xl font-semibold text-slate-900">
              Ic aksiyon akisini hizli takip et
            </h3>
          </div>
          <Link
            href="/panel/kullanicilar-mesajlar/mesajlar"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Mesajlar
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          {messages.slice(0, 3).map((item) => (
            <div key={item.id} className="rounded-[1.35rem] bg-[#f8fafc] px-5 py-5">
              <p className="font-semibold text-slate-900">{item.subject}</p>
              <p className="mt-2 text-sm text-slate-500">
                {item.senderName} → {item.recipientLabel}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
