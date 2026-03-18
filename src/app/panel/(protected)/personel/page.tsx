export default function PanelStaffPage() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-teal)]">
        Personel Yonetimi
      </p>
      <h2 className="mt-4 text-3xl font-semibold text-[var(--color-ink)]">
        Admin tarafindan eklenip cikarilan villa personelleri burada listelenecek
      </h2>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
        Ilk faz sonrasinda rol, aktiflik ve sifre yenileme aksiyonlari bu ekrana eklenecek.
      </p>
    </div>
  );
}
