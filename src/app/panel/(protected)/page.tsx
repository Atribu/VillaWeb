import Link from "next/link";
import type { ReactNode } from "react";
import {
  getCustomerSegmentLabel,
  getCustomerSegmentTone,
  getReviewStatusLabel,
  getReviewStatusTone,
  type DemoCustomerRecord,
  type DemoReviewRecord,
} from "@/lib/demo-crm";
import {
  getPaymentDisplayStatus,
  getPaymentStatusLabel,
  getPaymentStatusTone,
  type DemoPaymentDisplayStatus,
  type DemoPaymentRecord,
  type DemoFinanceOverview,
} from "@/lib/demo-finance";
import {
  REQUEST_STATUS_OPTIONS,
  getRequestStatusLabel,
  getRequestStatusTone,
  type DemoRequest,
} from "@/lib/demo-operations";
import {
  getOperationTaskStatusLabel,
  getOperationTaskStatusTone,
  getOperationTaskTypeLabel,
  type DemoOperationTask,
} from "@/lib/demo-operations-workflow";
import {
  getCacheGroupStatusLabel,
  getCacheGroupStatusTone,
  type DemoCacheGroupRecord,
} from "@/lib/demo-settings";
import {
  getSyncOutcomeLabel,
  getSyncOutcomeTone,
  type DemoSyncLogRecord,
} from "@/lib/demo-calendar-sync";
import {
  getMessagePriorityLabel,
  getMessageStatusLabel,
  getMessageStatusTone,
  type DemoInternalMessageRecord,
} from "@/lib/demo-users-messages";
import {
  getLandingStatusLabel,
  getLandingStatusTone,
  getSeoContentStatusLabel,
  getSeoContentStatusTone,
  getWebsiteStatusLabel,
  getWebsiteStatusTone,
  type DemoLandingPageRecord,
  type DemoSeoContentRecord,
  type DemoWebsiteRecord,
} from "@/lib/demo-websites";
import { getDemoCrmOverview, getDemoReviews } from "@/lib/server/demo-crm-store";
import { getDemoSyncLogs } from "@/lib/server/demo-calendar-sync-store";
import { getDemoFinanceOverview, getDemoPayments } from "@/lib/server/demo-finance-store";
import { getDemoOperationTasks, getDemoRequests } from "@/lib/server/demo-operations-store";
import { getDemoCacheGroups } from "@/lib/server/demo-settings-store";
import {
  getDemoInternalMessages,
  getDemoUsersMessagesOverview,
} from "@/lib/server/demo-users-messages-store";
import { getDemoVillas } from "@/lib/server/demo-villa-store";
import {
  getDemoLandingPages,
  getDemoSeoContents,
  getDemoWebsites,
} from "@/lib/server/demo-websites-store";
import { formatCurrency, type CatalogVilla } from "@/lib/villa-catalog";

export const dynamic = "force-dynamic";

type DashboardSearchParams = {
  reservationSearch?: string | string[];
  operationSearch?: string | string[];
  requestStatus?: string | string[];
  taskStatus?: string | string[];
  dateFrom?: string | string[];
  dateTo?: string | string[];
  onlyActionable?: string | string[];
  financeStatus?: string | string[];
  crmFocus?: string | string[];
};

type FilterField = {
  name: string;
  value: string;
};

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    weekday: "short",
  }).format(new Date(value));
}

function formatShortDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStayRange(request: DemoRequest) {
  const formatter = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
  });

  return `${formatter.format(new Date(request.checkIn))} - ${formatter.format(new Date(request.checkOut))}`;
}

function getDateKey(value: string) {
  return value.slice(0, 10);
}

function normalizeDateRange(dateFrom: string, dateTo: string) {
  if (dateFrom && dateTo && dateFrom > dateTo) {
    return {
      dateFrom: dateTo,
      dateTo: dateFrom,
    };
  }

  return {
    dateFrom,
    dateTo,
  };
}

function matchesDateRange(value: string | undefined, dateFrom: string, dateTo: string) {
  if (!value) {
    return !dateFrom && !dateTo;
  }

  const dateKey = getDateKey(value);

  if (dateFrom && dateKey < dateFrom) {
    return false;
  }

  if (dateTo && dateKey > dateTo) {
    return false;
  }

  return true;
}

function getSearchParamValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeForSearch(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function includesSearchTerm(values: Array<string | number | undefined>, query: string) {
  if (!query.trim()) {
    return true;
  }

  const normalizedQuery = normalizeForSearch(query);

  return values.some((value) => normalizeForSearch(String(value ?? "")).includes(normalizedQuery));
}

function buildPreservedFields(current: Record<string, string>, omit: string[]) {
  return Object.entries(current)
    .filter(([key, value]) => !omit.includes(key) && value.trim().length > 0)
    .map(([name, value]) => ({ name, value }));
}

function getAttentionToneClasses(tone: "warning" | "success" | "neutral") {
  switch (tone) {
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    default:
      return "border-sky-200 bg-sky-50 text-sky-900";
  }
}

function QuickActionTile({
  href,
  label,
  icon,
  tone,
}: {
  href: string;
  label: string;
  icon: string;
  tone?: "green" | "blue";
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-w-[154px] items-center justify-center gap-2 rounded-md border border-[#cfd6dd] bg-white px-5 py-5 text-center text-[15px] font-medium text-[#444f5f] shadow-[0_3px_8px_rgba(15,23,42,0.1)] transition hover:-translate-y-0.5 hover:border-[#9ec1d8]"
    >
      <span className={tone === "green" ? "text-[#57a83f]" : "text-[#2b78ad]"}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function SearchPanel({
  title,
  accent,
  placeholder,
  searchName,
  searchValue,
  hiddenFields,
  resultLabel,
  secondaryHref,
}: {
  title: string;
  accent: "green" | "blue";
  placeholder: string;
  searchName: string;
  searchValue: string;
  hiddenFields: FilterField[];
  resultLabel: string;
  secondaryHref: string;
}) {
  return (
    <section className="rounded-sm bg-white px-6 py-7 shadow-[0_6px_20px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div
            className={`text-[15px] font-medium ${
              accent === "green" ? "text-[#4d9a39]" : "text-[#2b78ad]"
            }`}
          >
            {title}
          </div>
          <p className="text-xs text-slate-500">{resultLabel}</p>
        </div>

        <form action="/panel" method="get" className="flex w-full max-w-[430px] items-center overflow-hidden rounded-sm border border-[#cad3dc] bg-white">
          {hiddenFields.map((field) => (
            <input key={`${searchName}-${field.name}`} type="hidden" name={field.name} value={field.value} />
          ))}
          <input
            type="text"
            name={searchName}
            defaultValue={searchValue}
            placeholder={placeholder}
            className="min-w-0 flex-1 border-0 px-4 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            className="border-l border-[#d7dde5] bg-white px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-[#2b78ad]"
          >
            Ara
          </button>
          <Link
            href={secondaryHref}
            className="bg-[#59b7d1] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4da6bf]"
          >
            Liste
          </Link>
        </form>
      </div>
    </section>
  );
}

function DashboardFilterBar({
  reservationSearch,
  operationSearch,
  requestStatus,
  taskStatus,
  dateFrom,
  dateTo,
  onlyActionable,
  financeStatus,
  crmFocus,
}: {
  reservationSearch: string;
  operationSearch: string;
  requestStatus: string;
  taskStatus: string;
  dateFrom: string;
  dateTo: string;
  onlyActionable: boolean;
  financeStatus: string;
  crmFocus: string;
}) {
  return (
    <section className="rounded-sm bg-white px-5 py-5 shadow-[0_6px_20px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-700">Dashboard filtreleri</p>
          <p className="mt-1 text-sm text-slate-500">
            Bu alan talep, operasyon, finans ve CRM bloklarini ayni ekranda hizli sekilde tarar.
          </p>
        </div>

        <form action="/panel" method="get" className="grid gap-4 2xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
          {reservationSearch ? (
            <input type="hidden" name="reservationSearch" value={reservationSearch} />
          ) : null}
          {operationSearch ? (
            <input type="hidden" name="operationSearch" value={operationSearch} />
          ) : null}

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Baslangic tarihi
            </span>
            <input
              type="date"
              name="dateFrom"
              defaultValue={dateFrom}
              className="w-full rounded-sm border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#59b7d1]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Bitis tarihi
            </span>
            <input
              type="date"
              name="dateTo"
              defaultValue={dateTo}
              className="w-full rounded-sm border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#59b7d1]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Talep durumu
            </span>
            <select
              name="requestStatus"
              defaultValue={requestStatus}
              className="w-full rounded-sm border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#59b7d1]"
            >
              <option value="">Tum talepler</option>
              {REQUEST_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Gorev durumu
            </span>
            <select
              name="taskStatus"
              defaultValue={taskStatus}
              className="w-full rounded-sm border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#59b7d1]"
            >
              <option value="">Tum gorevler</option>
              <option value="PENDING">Bekliyor</option>
              <option value="READY">Hazir</option>
              <option value="IN_PROGRESS">Islemde</option>
              <option value="DONE">Tamamlandi</option>
              <option value="CANCELLED">Iptal</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Finans durumu
            </span>
            <select
              name="financeStatus"
              defaultValue={financeStatus}
              className="w-full rounded-sm border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#59b7d1]"
            >
              <option value="">Tum finans kalemleri</option>
              <option value="PENDING">Beklemede</option>
              <option value="OVERDUE">Vadesi gecti</option>
              <option value="PAID">Tahsil edildi</option>
              <option value="CANCELLED">Iptal edildi</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              CRM odagi
            </span>
            <select
              name="crmFocus"
              defaultValue={crmFocus}
              className="w-full rounded-sm border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#59b7d1]"
            >
              <option value="">Tum CRM akisları</option>
              <option value="PIPELINE">Pipeline musteri</option>
              <option value="VIP">VIP musteri</option>
              <option value="NEW_MESSAGES">Yeni mesajlar</option>
              <option value="PENDING_REVIEWS">Bekleyen yorumlar</option>
            </select>
          </label>

          <div className="flex flex-col items-start justify-end gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                name="onlyActionable"
                value="1"
                defaultChecked={onlyActionable}
                className="h-4 w-4 rounded border-slate-300 text-[#2b78ad] focus:ring-[#2b78ad]"
              />
              Sadece aksiyon gerekenler
            </label>
            <button
              type="submit"
              className="inline-flex h-[42px] items-center justify-center rounded-sm bg-[#2b78ad] px-5 text-sm font-semibold text-white transition hover:bg-[#215d86]"
            >
              Filtreyi uygula
            </button>
            <Link
              href="/panel"
              className="inline-flex h-[42px] items-center justify-center rounded-sm border border-slate-200 px-5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Temizle
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}

function ActiveFiltersBar({
  items,
}: {
  items: string[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-sm border border-sky-100 bg-sky-50 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          Aktif filtreler
        </span>
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-medium text-sky-700"
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: string;
  detail: string;
  href?: string;
}) {
  const body = (
    <article className="rounded-sm bg-white px-5 py-4 shadow-[0_6px_20px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </article>
  );

  if (!href) {
    return body;
  }

  return (
    <Link href={href} className="block">
      {body}
    </Link>
  );
}

function AttentionCard({
  title,
  detail,
  tone,
  href,
  actionLabel,
}: {
  title: string;
  detail: string;
  tone: "warning" | "success" | "neutral";
  href: string;
  actionLabel: string;
}) {
  return (
    <article
      className={`rounded-sm border px-4 py-4 shadow-[0_4px_14px_rgba(15,23,42,0.05)] ${getAttentionToneClasses(
        tone,
      )}`}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 opacity-90">{detail}</p>
      <Link href={href} className="mt-3 inline-flex text-sm font-semibold underline underline-offset-4">
        {actionLabel}
      </Link>
    </article>
  );
}

function PanelSection({
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-sm bg-white shadow-[0_6px_20px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#4f6074]">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <Link href={actionHref} className="text-sm font-medium text-[#2b78ad] transition hover:text-[#215d86]">
          {actionLabel}
        </Link>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function RecentRequestsPanel({ requests }: { requests: DemoRequest[] }) {
  return (
    <PanelSection
      title="Son Talepler"
      description="Public form ve panel uzerinden acilan son kayitlar."
      actionHref="/panel/talepler"
      actionLabel="Talepleri ac"
    >
      {requests.length === 0 ? (
        <p className="text-sm text-slate-500">Secili filtrelerle eslesen talep kaydi bulunamadi.</p>
      ) : null}

      <div className="space-y-4">
        {requests.map((request, index) => (
          <article
            key={request.id}
            className={`${index === 0 ? "" : "border-t border-dashed border-[#d9dee5]"} py-4`}
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-medium text-[#2b78ad]">{request.fullName}</p>
                  <span
                    className={`rounded px-2 py-0.5 text-[11px] font-semibold ${getRequestStatusTone(
                      request.status,
                    )}`}
                  >
                    {getRequestStatusLabel(request.status)}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{request.villaTitle}</p>
                <p className="text-sm text-slate-500">
                  {formatStayRange(request)} / {request.guestCount} misafir
                </p>
                <p className="text-sm text-slate-500">{request.email}</p>
              </div>

              <div className="space-y-2 text-right">
                <p className="text-sm font-semibold text-slate-700">
                  {formatCurrency(request.pricing.grandTotal)}
                </p>
                <p className="text-xs text-slate-500">{formatShortDate(request.createdAt)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </PanelSection>
  );
}

function RecentReservationsPanel({
  requests,
  villas,
}: {
  requests: DemoRequest[];
  villas: CatalogVilla[];
}) {
  return (
    <PanelSection
      title="Son Rezervasyonlar"
      description="Teklif ve onay surecine gecmis son rezervasyonlar."
      actionHref="/panel/rezervasyonlar/ev-rezervasyonlari"
      actionLabel="Rezervasyon listesi"
    >
      {requests.length === 0 ? (
        <p className="text-sm text-slate-500">Henuz onaylanmis rezervasyon bulunmuyor.</p>
      ) : null}

      <div className="space-y-4">
        {requests.map((request, index) => {
          const villa = villas.find((item) => item.slug === request.villaSlug);

          return (
            <article
              key={request.id}
              className={`${index === 0 ? "" : "border-t border-dashed border-[#d9dee5]"} py-4`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-semibold text-[#2b78ad]">
                      {request.id.replace("request-", "RZ-")}
                    </span>
                    <span className="rounded-full bg-[#ffeb99] px-2 py-0.5 text-[11px] font-semibold text-[#6d5200]">
                      {request.status === "APPROVED" ? "Onaylandi" : "Teklif surecinde"}
                    </span>
                  </div>

                  <p className="max-w-[380px] text-sm font-medium leading-6 text-slate-700">
                    {request.villaTitle}
                    {villa ? ` (${villa.city} / ${villa.district})` : ""}
                  </p>
                  <p className="text-sm text-slate-500">{formatStayRange(request)}</p>
                  <p className="text-sm text-slate-500">{request.fullName}</p>
                </div>

                <div className="space-y-2 text-right">
                  <p className="text-sm font-semibold text-slate-700">
                    {formatCurrency(request.pricing.grandTotal)}
                  </p>
                  <p className="text-xs text-slate-500">Rez tarihi: {formatShortDate(request.createdAt)}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </PanelSection>
  );
}

function OperationsFocusPanel({
  tasks,
  openTaskCount,
  urgentTaskCount,
}: {
  tasks: DemoOperationTask[];
  openTaskCount: number;
  urgentTaskCount: number;
}) {
  const readyCount = tasks.filter((task) => task.status === "READY").length;
  const inProgressCount = tasks.filter((task) => task.status === "IN_PROGRESS").length;

  return (
    <PanelSection
      title="Operasyon Odagi"
      description="Takip, karsilama, temizlik ve cikis ajandasindaki aktif gorevler."
      actionHref="/panel/takip-operasyon/ev-takip"
      actionLabel="Operasyonu ac"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Acik gorev", value: String(openTaskCount) },
          { label: "Bugun/geride", value: String(urgentTaskCount) },
          { label: "Islemde", value: String(inProgressCount + readyCount) },
        ].map((item) => (
          <div key={item.label} className="rounded-sm border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-500">Acil operasyon gorevi bulunmuyor.</p>
        ) : null}

        {tasks.map((task) => (
          <article key={task.id} className="rounded-sm border border-slate-200 px-4 py-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{task.title}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getOperationTaskStatusTone(
                      task.status,
                    )}`}
                  >
                    {getOperationTaskStatusLabel(task.status)}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{task.villaTitle}</p>
                <p className="text-sm text-slate-500">{getOperationTaskTypeLabel(task.taskType)}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-sm font-medium text-slate-700">{formatShortDate(task.scheduledDate)}</p>
                <p className="text-xs text-slate-500">{task.scheduledTimeLabel}</p>
                <p className="text-xs text-slate-500">{task.assignee}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </PanelSection>
  );
}

function FinancePulsePanel({
  overview,
  payments,
  resultLabel,
}: {
  overview: DemoFinanceOverview;
  payments: Array<DemoPaymentRecord & { displayStatus: DemoPaymentDisplayStatus }>;
  resultLabel: string;
}) {
  return (
    <PanelSection
      title="Finans Nabzi"
      description="Tahsilat, acik bakiye ve son odeme hareketlerinin ozet gorunumu."
      actionHref="/panel/muhasebe"
      actionLabel="Muhasebeyi ac"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {overview.summaryCards.map((item) => (
          <div key={item.label} className="rounded-sm border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{item.value}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        {resultLabel}
      </p>

      <div className="mt-3 space-y-3">
        {payments.length === 0 ? (
          <p className="text-sm text-slate-500">Secili filtrelerle eslesen finans kaydi bulunamadi.</p>
        ) : null}

        {payments.slice(0, 4).map((payment) => (
          <article key={payment.id} className="rounded-sm border border-slate-200 px-4 py-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">{payment.title}</p>
                <p className="text-sm text-slate-500">{payment.villaTitle}</p>
                <p className="text-xs text-slate-500">{payment.guestName}</p>
              </div>
              <div className="space-y-1 text-right">
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getPaymentStatusTone(
                    payment.displayStatus,
                  )}`}
                >
                  {getPaymentStatusLabel(payment.displayStatus)}
                </span>
                <p className="text-sm font-semibold text-slate-700">{formatCurrency(payment.amount)}</p>
                <p className="text-xs text-slate-500">Vade: {formatShortDate(payment.dueDate)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </PanelSection>
  );
}

function CommunicationCrmPanel({
  customers,
  reviews,
  messages,
  activeUsersValue,
  resultLabel,
}: {
  customers: DemoCustomerRecord[];
  reviews: DemoReviewRecord[];
  messages: DemoInternalMessageRecord[];
  activeUsersValue: string;
  resultLabel: string;
}) {
  const pendingReviews = reviews.filter((review) => review.status === "PENDING");

  return (
    <PanelSection
      title="Iletisim ve CRM"
      description="Musteri segmentleri, ekip mesajlari ve yorum akisinin hizli ozeti."
      actionHref="/panel/crm/musteriler"
      actionLabel="CRM ekranini ac"
    >
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Toplam musteri", value: String(customers.length) },
          { label: "Aktif kullanici", value: activeUsersValue },
          { label: "Yeni mesaj", value: String(messages.filter((item) => item.status === "NEW").length) },
          { label: "Bekleyen yorum", value: String(pendingReviews.length) },
        ].map((item) => (
          <div key={item.label} className="rounded-sm border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        {resultLabel}
      </p>

      <div className="mt-3 grid gap-4 xl:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">Son ekip mesajlari</p>
          {messages.length === 0 ? (
            <p className="text-sm text-slate-500">Secili filtrelerle eslesen mesaj kaydi bulunamadi.</p>
          ) : null}
          {messages.slice(0, 3).map((message) => (
            <article key={message.id} className="rounded-sm border border-slate-200 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getMessageStatusTone(
                    message.status,
                  )}`}
                >
                  {getMessageStatusLabel(message.status)}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {getMessagePriorityLabel(message.priority)}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">{message.subject}</p>
              <p className="mt-1 text-sm text-slate-500">
                {message.senderName} / {message.relatedModule}
              </p>
              <p className="mt-1 text-xs text-slate-500">{formatShortDateTime(message.createdAt)}</p>
            </article>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">One cikan musteri ve yorumlar</p>
          {customers.length === 0 && pendingReviews.length === 0 ? (
            <p className="text-sm text-slate-500">Secili filtrelerle eslesen CRM kaydi bulunamadi.</p>
          ) : null}
          {customers.slice(0, 2).map((customer) => (
            <article key={customer.id} className="rounded-sm border border-slate-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{customer.fullName}</p>
                  <p className="text-xs text-slate-500">{customer.preferredVillaTitle}</p>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getCustomerSegmentTone(
                    customer.segment,
                  )}`}
                >
                  {getCustomerSegmentLabel(customer.segment)}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Pipeline: {formatCurrency(customer.pipelineValue)} / Onayli gelir:{" "}
                {formatCurrency(customer.totalRevenue)}
              </p>
            </article>
          ))}

          {pendingReviews.slice(0, 2).map((review) => (
            <article key={review.id} className="rounded-sm border border-slate-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{review.guestName}</p>
                  <p className="text-xs text-slate-500">{review.villaTitle}</p>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getReviewStatusTone(
                    review.status,
                  )}`}
                >
                  {getReviewStatusLabel(review.status)}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{review.comment}</p>
            </article>
          ))}
        </div>
      </div>
    </PanelSection>
  );
}

function DigitalHealthPanel({
  websites,
  landings,
  seoContents,
  syncLogs,
  cacheGroups,
  resultLabel,
}: {
  websites: DemoWebsiteRecord[];
  landings: DemoLandingPageRecord[];
  seoContents: DemoSeoContentRecord[];
  syncLogs: DemoSyncLogRecord[];
  cacheGroups: DemoCacheGroupRecord[];
  resultLabel: string;
}) {
  const liveWebsiteCount = websites.filter((website) => website.status === "LIVE").length;
  const liveLandingCount = landings.filter((landing) => landing.status === "LIVE").length;
  const seoAverage = Math.round(
    seoContents.reduce((sum, item) => sum + item.seoScore, 0) / Math.max(seoContents.length, 1),
  );
  const syncWarningCount = syncLogs.filter((log) => log.outcome !== "SUCCESS").length;

  return (
    <PanelSection
      title="Dijital Saglik"
      description="Web siteleri, SEO icerikleri, cache gruplari ve kanal senkron durumlari."
      actionHref="/panel/web-siteleri"
      actionLabel="Dijital ekranlari ac"
    >
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Canli site", value: String(liveWebsiteCount) },
          { label: "Canli landing", value: String(liveLandingCount) },
          { label: "Ortalama SEO", value: `${seoAverage}` },
          { label: "Sync uyarisi", value: String(syncWarningCount) },
        ].map((item) => (
          <div key={item.label} className="rounded-sm border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        {resultLabel}
      </p>

      <div className="mt-3 grid gap-4 xl:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">Site ve icerik akisi</p>
          {websites.length === 0 && landings.length === 0 && seoContents.length === 0 ? (
            <p className="text-sm text-slate-500">Secili filtrelerle eslesen web/SEO kaydi bulunamadi.</p>
          ) : null}
          {websites.slice(0, 2).map((website) => (
            <article key={website.id} className="rounded-sm border border-slate-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{website.name}</p>
                  <p className="text-xs text-slate-500">{website.domain}</p>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getWebsiteStatusTone(
                    website.status,
                  )}`}
                >
                  {getWebsiteStatusLabel(website.status)}
                </span>
              </div>
            </article>
          ))}

          {landings.slice(0, 2).map((landing) => (
            <article key={landing.id} className="rounded-sm border border-slate-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{landing.title}</p>
                  <p className="text-xs text-slate-500">{landing.focusKeyword}</p>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getLandingStatusTone(
                    landing.status,
                  )}`}
                >
                  {getLandingStatusLabel(landing.status)}
                </span>
              </div>
            </article>
          ))}

          {seoContents.slice(0, 2).map((content) => (
            <article key={content.id} className="rounded-sm border border-slate-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{content.title}</p>
                  <p className="text-xs text-slate-500">{content.primaryKeyword}</p>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getSeoContentStatusTone(
                    content.status,
                  )}`}
                >
                  {getSeoContentStatusLabel(content.status)}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">SEO skoru: {content.seoScore}</p>
            </article>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">Sync ve cache loglari</p>
          {syncLogs.length === 0 && cacheGroups.length === 0 ? (
            <p className="text-sm text-slate-500">Secili filtrelerle eslesen sync/cache kaydi bulunamadi.</p>
          ) : null}
          {syncLogs.slice(0, 3).map((log) => (
            <article key={log.id} className="rounded-sm border border-slate-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{log.channelName}</p>
                  <p className="text-xs text-slate-500">{log.villaTitle}</p>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getSyncOutcomeTone(
                    log.outcome,
                  )}`}
                >
                  {getSyncOutcomeLabel(log.outcome)}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{log.message}</p>
            </article>
          ))}

          {cacheGroups.map((group) => (
            <article key={group.id} className="rounded-sm border border-slate-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{group.label}</p>
                  <p className="text-xs text-slate-500">{group.target}</p>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getCacheGroupStatusTone(
                    group.status,
                  )}`}
                >
                  {getCacheGroupStatusLabel(group.status)}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </PanelSection>
  );
}

export default async function PanelDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<DashboardSearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const reservationSearch = getSearchParamValue(resolvedSearchParams.reservationSearch).trim();
  const operationSearch = getSearchParamValue(resolvedSearchParams.operationSearch).trim();
  const requestStatus = getSearchParamValue(resolvedSearchParams.requestStatus).trim();
  const taskStatus = getSearchParamValue(resolvedSearchParams.taskStatus).trim();
  const rawDateFrom = getSearchParamValue(resolvedSearchParams.dateFrom).trim();
  const rawDateTo = getSearchParamValue(resolvedSearchParams.dateTo).trim();
  const onlyActionable = getSearchParamValue(resolvedSearchParams.onlyActionable).trim() === "1";
  const financeStatus = getSearchParamValue(resolvedSearchParams.financeStatus).trim();
  const crmFocus = getSearchParamValue(resolvedSearchParams.crmFocus).trim();
  const { dateFrom, dateTo } = normalizeDateRange(rawDateFrom, rawDateTo);

  const [
    requests,
    villas,
    operationTasks,
    financeOverview,
    payments,
    crmOverview,
    reviews,
    usersOverview,
    messages,
    syncLogs,
    websites,
    landings,
    seoContents,
    cacheGroups,
  ] = await Promise.all([
    getDemoRequests(),
    getDemoVillas(),
    getDemoOperationTasks(),
    getDemoFinanceOverview(),
    getDemoPayments(),
    getDemoCrmOverview(),
    getDemoReviews(),
    getDemoUsersMessagesOverview(),
    getDemoInternalMessages(),
    getDemoSyncLogs(),
    getDemoWebsites(),
    getDemoLandingPages(),
    getDemoSeoContents(),
    getDemoCacheGroups(),
  ]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const actionableRequestStatuses = new Set<DemoRequest["status"]>(["NEW", "CONTACTED", "QUOTE_SENT"]);
  const filteredRequests = requests.filter((request) => {
    const matchesStatus = !requestStatus || request.status === requestStatus;
    const matchesDate = matchesDateRange(request.createdAt, dateFrom, dateTo);
    const matchesSearch = includesSearchTerm(
      [
        request.id,
        request.fullName,
        request.email,
        request.phone,
        request.villaTitle,
        request.villaSlug,
      ],
      reservationSearch,
    );

    const matchesActionable = !onlyActionable || actionableRequestStatuses.has(request.status);

    return matchesStatus && matchesDate && matchesSearch && matchesActionable;
  });
  const recentRequests = filteredRequests.slice(0, 3);
  const recentReservations = filteredRequests
    .filter((request) => request.status === "APPROVED" || request.status === "QUOTE_SENT")
    .slice(0, 3);

  const filteredOperationTasks = operationTasks.filter((task) => {
    const matchesStatus = !taskStatus || task.status === taskStatus;
    const matchesDate = matchesDateRange(task.scheduledDate, dateFrom, dateTo);
    const matchesSearch = includesSearchTerm(
      [
        task.id,
        task.title,
        task.villaTitle,
        task.guestName,
        task.assignee,
        task.supplierName,
      ],
      operationSearch,
    );
    const matchesActionable =
      !onlyActionable ||
      task.status === "READY" ||
      task.status === "IN_PROGRESS" ||
      (task.status === "PENDING" && task.scheduledDate <= todayKey);

    return matchesStatus && matchesDate && matchesSearch && matchesActionable;
  });

  const openTasks = filteredOperationTasks.filter(
    (task) => task.status !== "DONE" && task.status !== "CANCELLED",
  );
  const urgentTasks = openTasks.filter((task) => task.scheduledDate <= todayKey);
  const operationsFocus = [...openTasks]
    .sort((left, right) => {
      if (left.scheduledDate === right.scheduledDate) {
        return left.createdAt.localeCompare(right.createdAt);
      }

      return left.scheduledDate.localeCompare(right.scheduledDate);
    })
    .slice(0, 5);

  const villaSearchTerm = reservationSearch || operationSearch;
  const visibleVillas = villaSearchTerm
    ? villas.filter((villa) =>
        includesSearchTerm(
          [villa.title, villa.slug, villa.city, villa.district, villa.locationLabel],
          villaSearchTerm,
        ),
      )
    : villas;

  const filteredPayments = payments
    .map((payment) => ({
      ...payment,
      displayStatus: getPaymentDisplayStatus(payment),
    }))
    .filter((payment) => {
      const matchesDate = matchesDateRange(payment.dueDate, dateFrom, dateTo);
      const matchesFinanceStatus = !financeStatus || payment.displayStatus === financeStatus;
      const matchesActionable =
        !onlyActionable || payment.displayStatus === "PENDING" || payment.displayStatus === "OVERDUE";

      return matchesDate && matchesFinanceStatus && matchesActionable;
    })
    .sort((left, right) => {
      if (left.dueDate === right.dueDate) {
        return right.createdAt.localeCompare(left.createdAt);
      }

      return right.dueDate.localeCompare(left.dueDate);
    });

  const baseCrmCustomers = crmOverview.customers.filter((customer) => {
    const matchesDate = matchesDateRange(customer.lastRequestAt, dateFrom, dateTo);
    const matchesActionable =
      !onlyActionable ||
      customer.segment === "LEAD" ||
      customer.segment === "ACTIVE" ||
      customer.pipelineValue > 0;

    return matchesDate && matchesActionable;
  });

  const baseCrmMessages = messages.filter((message) => {
    const matchesDate = matchesDateRange(message.createdAt, dateFrom, dateTo);
    const matchesActionable = !onlyActionable || message.status === "NEW";

    return matchesDate && matchesActionable;
  });

  const baseCrmReviews = reviews.filter((review) => {
    const matchesDate = matchesDateRange(review.createdAt, dateFrom, dateTo);
    const matchesActionable = !onlyActionable || review.status === "PENDING";

    return matchesDate && matchesActionable;
  });

  const filteredCustomers = baseCrmCustomers.filter((customer) => {
    switch (crmFocus) {
      case "VIP":
        return customer.segment === "VIP";
      case "PIPELINE":
        return customer.pipelineValue > 0 || customer.segment === "LEAD" || customer.segment === "ACTIVE";
      default:
        return true;
    }
  });

  const filteredMessages = baseCrmMessages.filter((message) =>
    crmFocus === "NEW_MESSAGES" ? message.status === "NEW" : true,
  );

  const filteredReviews = baseCrmReviews.filter((review) =>
    crmFocus === "PENDING_REVIEWS" ? review.status === "PENDING" : true,
  );

  const filteredWebsites = websites.filter((website) => {
    const matchesDate = matchesDateRange(website.updatedAt, dateFrom, dateTo);
    const matchesActionable = !onlyActionable || website.status !== "LIVE";
    return matchesDate && matchesActionable;
  });

  const filteredLandings = landings.filter((landing) => {
    const matchesDate = matchesDateRange(landing.updatedAt, dateFrom, dateTo);
    const matchesActionable = !onlyActionable || landing.status !== "LIVE";
    return matchesDate && matchesActionable;
  });

  const filteredSeoContents = seoContents.filter((content) => {
    const matchesDate = matchesDateRange(content.updatedAt, dateFrom, dateTo);
    const matchesActionable = !onlyActionable || content.status !== "PUBLISHED";
    return matchesDate && matchesActionable;
  });

  const filteredSyncLogs = syncLogs.filter((log) => {
    const matchesDate = matchesDateRange(log.createdAt, dateFrom, dateTo);
    const matchesActionable = !onlyActionable || log.outcome !== "SUCCESS";
    return matchesDate && matchesActionable;
  });

  const filteredCacheGroups = cacheGroups.filter((group) => {
    const matchesDate = matchesDateRange(group.lastWarmedAt, dateFrom, dateTo);
    const matchesActionable = !onlyActionable || group.status !== "HEALTHY";
    return matchesDate && matchesActionable;
  });

  const activeVillaCount = visibleVillas.length;
  const newRequestCount = filteredRequests.filter((request) => request.status === "NEW").length;
  const approvedCount = filteredRequests.filter((request) => request.status === "APPROVED").length;
  const unreadMessageCount = baseCrmMessages.filter((message) => message.status === "NEW").length;
  const pendingReviewCount = baseCrmReviews.filter((review) => review.status === "PENDING").length;
  const syncWarningCount = filteredSyncLogs.filter((log) => log.outcome !== "SUCCESS").length;
  const staleCacheCount = filteredCacheGroups.filter((group) => group.status === "STALE").length;
  const reservationHiddenFields = buildPreservedFields(
    {
      reservationSearch,
      operationSearch,
      requestStatus,
      taskStatus,
      dateFrom,
      dateTo,
      financeStatus,
      crmFocus,
      onlyActionable: onlyActionable ? "1" : "",
    },
    ["reservationSearch"],
  );
  const operationHiddenFields = buildPreservedFields(
    {
      reservationSearch,
      operationSearch,
      requestStatus,
      taskStatus,
      dateFrom,
      dateTo,
      financeStatus,
      crmFocus,
      onlyActionable: onlyActionable ? "1" : "",
    },
    ["operationSearch"],
  );
  const activeFilterLabels = [
    dateFrom ? `Baslangic: ${dateFrom}` : "",
    dateTo ? `Bitis: ${dateTo}` : "",
    reservationSearch ? `Rezervasyon aramasi: ${reservationSearch}` : "",
    requestStatus ? `Talep durumu: ${getRequestStatusLabel(requestStatus as DemoRequest["status"])}` : "",
    operationSearch ? `Operasyon aramasi: ${operationSearch}` : "",
    taskStatus
      ? `Gorev durumu: ${getOperationTaskStatusLabel(taskStatus as DemoOperationTask["status"])}`
      : "",
    financeStatus
      ? `Finans: ${getPaymentStatusLabel(financeStatus as DemoPaymentDisplayStatus)}`
      : "",
    crmFocus
      ? `CRM odagi: ${
          crmFocus === "PIPELINE"
            ? "Pipeline"
            : crmFocus === "VIP"
              ? "VIP"
              : crmFocus === "NEW_MESSAGES"
                ? "Yeni mesajlar"
                : "Bekleyen yorumlar"
        }`
      : "",
    onlyActionable ? "Sadece aksiyon gerekenler" : "",
  ].filter(Boolean);

  const metricCards = [
    {
      label: "Aktif Villa",
      value: `${activeVillaCount}`,
      detail: "Yayinda ve panelde yonetilen aktif portfoy.",
      href: "/panel/villalar",
    },
    {
      label: "Yeni Talep",
      value: `${newRequestCount}`,
      detail: "Filtreye gore donus ve teklif bekleyen taze lead akisi.",
      href: "/panel/talepler",
    },
    {
      label: "Onayli Rezervasyon",
      value: `${approvedCount}`,
      detail: "Filtreye gore operasyon ve muhasebeye aktariilan kayitlar.",
      href: "/panel/rezervasyonlar/ev-rezervasyonlari",
    },
    {
      label: "Acik Operasyon",
      value: `${openTasks.length}`,
      detail: `${urgentTasks.length} gorev bugun ya da gecikmis durumda.`,
      href: "/panel/takip-operasyon/ev-takip",
    },
    {
      label: "Acik Bakiye",
      value: formatCurrency(financeOverview.totalOutstanding),
      detail: `${financeOverview.paymentStatusCounts.OVERDUE} vadesi gecmis odeme kalemi var.`,
      href: "/panel/muhasebe/odeme-takip",
    },
    {
      label: "Yeni Mesaj",
      value: `${unreadMessageCount}`,
      detail: "Ekip ici okunmayi bekleyen iletisim kayitlari.",
      href: "/panel/kullanicilar-mesajlar/mesajlar",
    },
    {
      label: "Bekleyen Yorum",
      value: `${pendingReviewCount}`,
      detail: "CRM tarafinda yayina alinmayi bekleyen misafir yorumlari.",
      href: "/panel/crm/yorum-sistemi",
    },
    {
      label: "Dijital Uyari",
      value: `${syncWarningCount + staleCacheCount}`,
      detail: `${syncWarningCount} sync logu ve ${staleCacheCount} stale cache grubu var.`,
      href: "/panel/takvim-senkronizasyon/senkron-loglari",
    },
  ];

  const attentionItems = [
    {
      title: "Tahsilat takip istiyor",
      detail:
        financeOverview.paymentStatusCounts.OVERDUE > 0
          ? `${financeOverview.paymentStatusCounts.OVERDUE} odeme kalemi vade asmis durumda.`
          : "Vadesi gecmis odeme yok, kasa akisi kontrollu ilerliyor.",
      tone: financeOverview.paymentStatusCounts.OVERDUE > 0 ? ("warning" as const) : ("success" as const),
      href: "/panel/muhasebe/odeme-takip",
      actionLabel: "Tahsilat ekranina git",
    },
    {
      title: "Operasyon ajandasi acik",
      detail:
        urgentTasks.length > 0
          ? `${urgentTasks.length} gorev bugun ekip aksiyonu bekliyor.`
          : "Bugun icin kritik operasyon birikimi gorunmuyor.",
      tone: urgentTasks.length > 0 ? ("warning" as const) : ("success" as const),
      href: "/panel/takip-operasyon/ev-takip",
      actionLabel: "Gorevleri ac",
    },
    {
      title: "CRM ve iletisim hattinda akis var",
      detail:
        unreadMessageCount + pendingReviewCount > 0
          ? `${unreadMessageCount} yeni mesaj ve ${pendingReviewCount} yorum kaydi bekliyor.`
          : "Mesaj ve yorum tarafinda bekleyen kayit kalmadi.",
      tone: unreadMessageCount + pendingReviewCount > 0 ? ("neutral" as const) : ("success" as const),
      href: "/panel/crm/yorum-sistemi",
      actionLabel: "CRM ekranlarini ac",
    },
    {
      title: "Dijital saglik kontrolu",
      detail:
        syncWarningCount + staleCacheCount > 0
          ? `${syncWarningCount} sync uyarisi ve ${staleCacheCount} stale cache grubu izlenmeli.`
          : "Sync ve cache tarafinda canli bir sorun gorunmuyor.",
      tone: syncWarningCount + staleCacheCount > 0 ? ("warning" as const) : ("success" as const),
      href: "/panel/web-siteleri/seo-icerikleri",
      actionLabel: "Dijital tarafa git",
    },
  ];

  return (
    <div className="space-y-7">
      <section className="rounded-sm border border-[#d8dde4] bg-[#f9fafb] p-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-700">Gunluk operasyon merkezi</p>
            <p className="text-sm text-slate-500">
              Rezervasyon, operasyon, muhasebe, CRM ve dijital kanallar ayni panelden takip ediliyor.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-5">
            <QuickActionTile
              href="/panel/rezervasyonlar/yeni-rezervasyon"
              label="Yeni Rezervasyon"
              icon="🛒"
              tone="green"
            />
            <QuickActionTile
              href="/panel/rezervasyonlar/ev-rezervasyonlari"
              label="Rezervasyon Listesi"
              icon="☰"
            />
            <QuickActionTile href="/panel/villalar" label="Evlerim" icon="🏠" />
            <QuickActionTile href="/panel/villalar/yeni" label="Hizli Villa Ekleme" icon="🪄" />
            <QuickActionTile
              href="/panel/takip-operasyon/ev-karsilama"
              label="Girisler Cikislar"
              icon="🗝️"
            />
          </div>
        </div>
      </section>

      <DashboardFilterBar
        reservationSearch={reservationSearch}
        operationSearch={operationSearch}
        requestStatus={requestStatus}
        taskStatus={taskStatus}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onlyActionable={onlyActionable}
        financeStatus={financeStatus}
        crmFocus={crmFocus}
      />

      <ActiveFiltersBar items={activeFilterLabels} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <SearchPanel
          title="Eve Rezervasyon Yap"
          accent="green"
          placeholder="Villa ismi"
          searchName="reservationSearch"
          searchValue={reservationSearch}
          hiddenFields={reservationHiddenFields}
          resultLabel={`${filteredRequests.length} talep / rezervasyon kaydi bulundu`}
          secondaryHref="/panel/rezervasyonlar/ev-rezervasyonlari"
        />
        <SearchPanel
          title="Ev Takip Ekrani"
          accent="blue"
          placeholder="Villa ismi"
          searchName="operationSearch"
          searchValue={operationSearch}
          hiddenFields={operationHiddenFields}
          resultLabel={`${filteredOperationTasks.length} operasyon gorevi eslesti`}
          secondaryHref="/panel/takip-operasyon/ev-takip"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {attentionItems.map((item) => (
          <AttentionCard key={item.title} {...item} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.98fr]">
        <RecentRequestsPanel requests={recentRequests} />
        <RecentReservationsPanel requests={recentReservations} villas={villas} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <OperationsFocusPanel
          tasks={operationsFocus}
          openTaskCount={openTasks.length}
          urgentTaskCount={urgentTasks.length}
        />
        <FinancePulsePanel
          overview={financeOverview}
          payments={filteredPayments}
          resultLabel={`${filteredPayments.length} finans kalemi eslesti`}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <CommunicationCrmPanel
          customers={filteredCustomers}
          reviews={filteredReviews}
          messages={filteredMessages}
          activeUsersValue={usersOverview.summaryCards[2]?.value ?? "0"}
          resultLabel={`${filteredCustomers.length} musteri / ${filteredMessages.length} mesaj / ${filteredReviews.length} yorum eslesti`}
        />
        <DigitalHealthPanel
          websites={filteredWebsites}
          landings={filteredLandings}
          seoContents={filteredSeoContents}
          syncLogs={filteredSyncLogs}
          cacheGroups={filteredCacheGroups}
          resultLabel={`${filteredWebsites.length} site / ${filteredLandings.length} landing / ${filteredSyncLogs.length} sync kaydi eslesti`}
        />
      </section>
    </div>
  );
}
