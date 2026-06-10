"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDemoCompanySiteHref, type DemoCompanyRecord, type DemoCompanyStatus } from "@/lib/demo-companies";
import {
  getRoleLabel,
  getTeamUserStatusLabel,
  getTeamUserStatusTone,
  type DemoBranchRecord,
  type DemoRoleId,
  type DemoTeamUserRecord,
  type DemoTeamUserStatus,
} from "@/lib/demo-users-messages";

type CompanyManagementManagerProps = {
  companies: DemoCompanyRecord[];
  users: DemoTeamUserRecord[];
  branches: DemoBranchRecord[];
};

type CompanyDraftState = {
  publicName: string;
  legalName: string;
  shortName: string;
  panelName: string;
  primaryEmail: string;
  primaryPhone: string;
  whatsappNumber: string;
  primaryDomain: string;
  address: string;
  taxNumber: string;
  status: DemoCompanyStatus;
};

type CreateCompanyFormState = CompanyDraftState;

type UserDraftState = {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  roleId: DemoRoleId;
  status: DemoTeamUserStatus;
  branchId: string;
  responsibility: string;
};

const COMPANY_STATUSES: DemoCompanyStatus[] = ["ACTIVE", "PAUSED", "ARCHIVED"];
const USER_STATUSES: DemoTeamUserStatus[] = ["ACTIVE", "INVITED", "PASSIVE"];
const USER_ROLES: DemoRoleId[] = ["ADMIN", "SALES", "OPERATIONS", "FINANCE", "CRM", "CONTENT"];

const INITIAL_CREATE_FORM: CreateCompanyFormState = {
  publicName: "",
  legalName: "",
  shortName: "",
  panelName: "",
  primaryEmail: "",
  primaryPhone: "",
  whatsappNumber: "",
  primaryDomain: "",
  address: "",
  taxNumber: "",
  status: "ACTIVE",
};

function sanitizeEditableValue(value: string) {
  return value === "-" ? "" : value;
}

function buildCompanyDrafts(companies: DemoCompanyRecord[]) {
  return Object.fromEntries(
    companies.map((company) => [
      company.id,
      {
        publicName: company.name,
        legalName: company.legalName,
        shortName: company.shortName,
        panelName: company.panelLabel,
        primaryEmail: sanitizeEditableValue(company.email),
        primaryPhone: sanitizeEditableValue(company.phone),
        whatsappNumber: sanitizeEditableValue(company.whatsapp),
        primaryDomain: sanitizeEditableValue(company.primaryDomain),
        address: company.address,
        taxNumber: company.taxNumber,
        status: company.status,
      } satisfies CompanyDraftState,
    ]),
  ) as Record<string, CompanyDraftState>;
}

function buildUserDrafts(users: DemoTeamUserRecord[]) {
  return Object.fromEntries(
    users.map((user) => [
      user.id,
      {
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phone: sanitizeEditableValue(user.phone),
        roleId: user.roleId,
        status: user.status,
        branchId: user.branchId,
        responsibility: user.responsibility,
      } satisfies UserDraftState,
    ]),
  ) as Record<string, UserDraftState>;
}

function getCompanyStatusLabel(status: DemoCompanyStatus) {
  switch (status) {
    case "PAUSED":
      return "Duraklatildi";
    case "ARCHIVED":
      return "Arsivlendi";
    default:
      return "Aktif";
  }
}

function getCompanyStatusTone(status: DemoCompanyStatus) {
  switch (status) {
    case "PAUSED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "ARCHIVED":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}

function formatActivity(value: string) {
  if (!value) {
    return "Henuz giris yok";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function CompanyManagementManager({
  companies,
  users,
  branches,
}: CompanyManagementManagerProps) {
  const router = useRouter();
  const [busyCompanyId, setBusyCompanyId] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [createForm, setCreateForm] = useState<CreateCompanyFormState>(INITIAL_CREATE_FORM);
  const [companyDrafts, setCompanyDrafts] = useState<Record<string, CompanyDraftState>>(
    buildCompanyDrafts(companies),
  );
  const [userDrafts, setUserDrafts] = useState<Record<string, UserDraftState>>(
    buildUserDrafts(users),
  );

  useEffect(() => {
    setCompanyDrafts(buildCompanyDrafts(companies));
  }, [companies]);

  useEffect(() => {
    setUserDrafts(buildUserDrafts(users));
  }, [users]);

  async function createCompany() {
    setIsCreating(true);
    setMessage("");

    try {
      const response = await fetch("/api/demo/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? "Firma olusturulamadi.");
        return;
      }

      setMessageTone("success");
      setMessage("Yeni firma, varsayilan site ve ana sube ile birlikte olusturuldu.");
      setCreateForm(INITIAL_CREATE_FORM);
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Firma olusturulurken baglanti hatasi olustu.");
    } finally {
      setIsCreating(false);
    }
  }

  async function updateCompany(companyId: string) {
    const draft = companyDrafts[companyId];

    if (!draft) {
      return;
    }

    setBusyCompanyId(companyId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? "Firma guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Firma bilgileri kaydedildi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Firma guncellenirken baglanti hatasi olustu.");
    } finally {
      setBusyCompanyId(null);
    }
  }

  async function updateUser(userId: string) {
    const draft = userDrafts[userId];

    if (!draft) {
      return;
    }

    setBusyUserId(userId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/users-messages/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? "Kullanici kaydi guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Firma kullanicisi guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Kullanici guncellenirken baglanti hatasi olustu.");
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div className="space-y-6">
      {message ? (
        <div
          className={`rounded-[1.2rem] border px-4 py-3 text-sm ${
            messageTone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message}
        </div>
      ) : null}

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#2b78ad]">
              Yeni Firma
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-900">
              Sadece super adminin gorecegi yeni firma kaydini panelden ac
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Yeni firma olusturuldugunda varsayilan bir ana site, merkez operasyon acentasi ve
              ana sube otomatik eklenir. Ardindan bu firmanin kullanicilarini ayni sayfadan
              duzenlemeye devam edebiliriz.
            </p>
          </div>
          <button
            type="button"
            disabled={isCreating}
            onClick={createCompany}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? "Firma Aciliyor..." : "Firma Kaydini Olustur"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={createForm.publicName}
            onChange={(event) =>
              setCreateForm((current) => ({ ...current, publicName: event.target.value }))
            }
            placeholder="Firma adi"
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          />
          <input
            value={createForm.legalName}
            onChange={(event) =>
              setCreateForm((current) => ({ ...current, legalName: event.target.value }))
            }
            placeholder="Firma unvani"
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          />
          <input
            value={createForm.shortName}
            onChange={(event) =>
              setCreateForm((current) => ({ ...current, shortName: event.target.value }))
            }
            placeholder="Kisa ad"
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          />
          <input
            value={createForm.panelName}
            onChange={(event) =>
              setCreateForm((current) => ({ ...current, panelName: event.target.value }))
            }
            placeholder="Panel adi"
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          />
          <input
            value={createForm.primaryPhone}
            onChange={(event) =>
              setCreateForm((current) => ({ ...current, primaryPhone: event.target.value }))
            }
            placeholder="Telefon numarasi"
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          />
          <input
            value={createForm.whatsappNumber}
            onChange={(event) =>
              setCreateForm((current) => ({ ...current, whatsappNumber: event.target.value }))
            }
            placeholder="WhatsApp numarasi"
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          />
          <input
            value={createForm.primaryEmail}
            onChange={(event) =>
              setCreateForm((current) => ({ ...current, primaryEmail: event.target.value }))
            }
            placeholder="Kurumsal e-posta"
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          />
          <input
            value={createForm.primaryDomain}
            onChange={(event) =>
              setCreateForm((current) => ({ ...current, primaryDomain: event.target.value }))
            }
            placeholder="Domain"
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          />
          <input
            value={createForm.taxNumber}
            onChange={(event) =>
              setCreateForm((current) => ({ ...current, taxNumber: event.target.value }))
            }
            placeholder="Vergi numarasi"
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          />
          <select
            value={createForm.status}
            onChange={(event) =>
              setCreateForm((current) => ({
                ...current,
                status: event.target.value as DemoCompanyStatus,
              }))
            }
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          >
            {COMPANY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getCompanyStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <textarea
          value={createForm.address}
          onChange={(event) =>
            setCreateForm((current) => ({ ...current, address: event.target.value }))
          }
          placeholder="Firma adresi"
          className="mt-4 min-h-[110px] w-full rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
        />
      </section>

      <div className="space-y-6">
        {companies.map((company) => {
          const draft = companyDrafts[company.id];
          const companyUsers = users
            .filter((user) => user.companyId === company.id)
            .sort((left, right) => left.fullName.localeCompare(right.fullName));
          const companyBranches = branches
            .filter((branch) => branch.companyId === company.id)
            .sort((left, right) => left.name.localeCompare(right.name));

          if (!draft) {
            return null;
          }

          return (
            <article
              key={company.id}
              className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
            >
              <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getCompanyStatusTone(
                        company.status,
                      )}`}
                    >
                      {getCompanyStatusLabel(company.status)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      {company.slug}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold text-slate-900">{company.name}</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {company.legalName} · {company.primaryDomain || "Domain yok"}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      ["Kullanicilar", String(companyUsers.length)],
                      ["Subeler", String(companyBranches.length)],
                      ["Telefon", company.phone || "-"],
                      ["Vergi No", company.taxNumber || "-"],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-[1.2rem] bg-[#f8fafc] px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                          {label}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={getDemoCompanySiteHref(company.slug)}
                    className="rounded-full bg-[#2b78ad] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#23638f]"
                  >
                    Siteyi Onizle
                  </Link>
                  <button
                    type="button"
                    disabled={busyCompanyId === company.id}
                    onClick={() => updateCompany(company.id)}
                    className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyCompanyId === company.id ? "Kaydediliyor..." : "Firma Bilgilerini Kaydet"}
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <input
                  value={draft.publicName}
                  disabled={busyCompanyId === company.id}
                  onChange={(event) =>
                    setCompanyDrafts((current) => ({
                      ...current,
                      [company.id]: { ...draft, publicName: event.target.value },
                    }))
                  }
                  placeholder="Firma adi"
                  className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
                />
                <input
                  value={draft.legalName}
                  disabled={busyCompanyId === company.id}
                  onChange={(event) =>
                    setCompanyDrafts((current) => ({
                      ...current,
                      [company.id]: { ...draft, legalName: event.target.value },
                    }))
                  }
                  placeholder="Firma unvani"
                  className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
                />
                <input
                  value={draft.shortName}
                  disabled={busyCompanyId === company.id}
                  onChange={(event) =>
                    setCompanyDrafts((current) => ({
                      ...current,
                      [company.id]: { ...draft, shortName: event.target.value },
                    }))
                  }
                  placeholder="Kisa ad"
                  className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
                />
                <input
                  value={draft.panelName}
                  disabled={busyCompanyId === company.id}
                  onChange={(event) =>
                    setCompanyDrafts((current) => ({
                      ...current,
                      [company.id]: { ...draft, panelName: event.target.value },
                    }))
                  }
                  placeholder="Panel adi"
                  className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
                />
                <input
                  value={draft.primaryPhone}
                  disabled={busyCompanyId === company.id}
                  onChange={(event) =>
                    setCompanyDrafts((current) => ({
                      ...current,
                      [company.id]: { ...draft, primaryPhone: event.target.value },
                    }))
                  }
                  placeholder="Telefon"
                  className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
                />
                <input
                  value={draft.whatsappNumber}
                  disabled={busyCompanyId === company.id}
                  onChange={(event) =>
                    setCompanyDrafts((current) => ({
                      ...current,
                      [company.id]: { ...draft, whatsappNumber: event.target.value },
                    }))
                  }
                  placeholder="WhatsApp"
                  className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
                />
                <input
                  value={draft.primaryEmail}
                  disabled={busyCompanyId === company.id}
                  onChange={(event) =>
                    setCompanyDrafts((current) => ({
                      ...current,
                      [company.id]: { ...draft, primaryEmail: event.target.value },
                    }))
                  }
                  placeholder="E-posta"
                  className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
                />
                <input
                  value={draft.primaryDomain}
                  disabled={busyCompanyId === company.id}
                  onChange={(event) =>
                    setCompanyDrafts((current) => ({
                      ...current,
                      [company.id]: { ...draft, primaryDomain: event.target.value },
                    }))
                  }
                  placeholder="Domain"
                  className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
                />
                <input
                  value={draft.taxNumber}
                  disabled={busyCompanyId === company.id}
                  onChange={(event) =>
                    setCompanyDrafts((current) => ({
                      ...current,
                      [company.id]: { ...draft, taxNumber: event.target.value },
                    }))
                  }
                  placeholder="Vergi numarasi"
                  className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
                />
                <select
                  value={draft.status}
                  disabled={busyCompanyId === company.id}
                  onChange={(event) =>
                    setCompanyDrafts((current) => ({
                      ...current,
                      [company.id]: {
                        ...draft,
                        status: event.target.value as DemoCompanyStatus,
                      },
                    }))
                  }
                  className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
                >
                  {COMPANY_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getCompanyStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={draft.address}
                disabled={busyCompanyId === company.id}
                onChange={(event) =>
                  setCompanyDrafts((current) => ({
                    ...current,
                    [company.id]: { ...draft, address: event.target.value },
                  }))
                }
                placeholder="Firma adresi"
                className="mt-4 min-h-[96px] w-full rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
              />

              <div className="mt-8 border-t border-slate-200 pt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2b78ad]">
                      Firma Kullanicilari
                    </p>
                    <h4 className="mt-2 text-xl font-semibold text-slate-900">
                      Super admin bu firmanin kullanicilarini gorup duzenleyebilir
                    </h4>
                  </div>
                  <p className="text-sm text-slate-500">
                    Toplam {companyUsers.length} kullanici · {companyBranches.length} sube
                  </p>
                </div>

                {companyUsers.length === 0 ? (
                  <div className="mt-4 rounded-[1.2rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    Bu firma icin henuz kullanici kaydi yok. Varsayilan ana sube olusturuldu;
                    istenirse personel modulu ya da sonraki adimlarda kullanici ekleme aksiyonunu
                    da bu sayfaya tasiyabiliriz.
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {companyUsers.map((user) => {
                      const userDraft = userDrafts[user.id];

                      if (!userDraft) {
                        return null;
                      }

                      return (
                        <div
                          key={user.id}
                          className="rounded-[1.5rem] border border-slate-200 bg-[#f8fafc] p-5"
                        >
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-3">
                                <span
                                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getTeamUserStatusTone(
                                    user.status,
                                  )}`}
                                >
                                  {getTeamUserStatusLabel(user.status)}
                                </span>
                                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                                  {getRoleLabel(user.roleId)}
                                </span>
                              </div>

                              <div>
                                <h5 className="text-lg font-semibold text-slate-900">
                                  {user.fullName}
                                </h5>
                                <p className="mt-1 text-sm text-slate-500">
                                  @{user.username} · Son aktivite {formatActivity(user.lastActiveAt)}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={busyUserId === user.id}
                              onClick={() => updateUser(user.id)}
                              className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {busyUserId === user.id ? "Kaydediliyor..." : "Kullaniciyi Kaydet"}
                            </button>
                          </div>

                          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <input
                              value={userDraft.fullName}
                              disabled={busyUserId === user.id}
                              onChange={(event) =>
                                setUserDrafts((current) => ({
                                  ...current,
                                  [user.id]: { ...userDraft, fullName: event.target.value },
                                }))
                              }
                              placeholder="Ad soyad"
                              className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                            />
                            <input
                              value={userDraft.username}
                              disabled={busyUserId === user.id}
                              onChange={(event) =>
                                setUserDrafts((current) => ({
                                  ...current,
                                  [user.id]: { ...userDraft, username: event.target.value },
                                }))
                              }
                              placeholder="Kullanici adi"
                              className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                            />
                            <input
                              value={userDraft.email}
                              disabled={busyUserId === user.id}
                              onChange={(event) =>
                                setUserDrafts((current) => ({
                                  ...current,
                                  [user.id]: { ...userDraft, email: event.target.value },
                                }))
                              }
                              placeholder="E-posta"
                              className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                            />
                            <input
                              value={userDraft.phone}
                              disabled={busyUserId === user.id}
                              onChange={(event) =>
                                setUserDrafts((current) => ({
                                  ...current,
                                  [user.id]: { ...userDraft, phone: event.target.value },
                                }))
                              }
                              placeholder="Telefon"
                              className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                            />
                            <select
                              value={userDraft.roleId}
                              disabled={busyUserId === user.id}
                              onChange={(event) =>
                                setUserDrafts((current) => ({
                                  ...current,
                                  [user.id]: {
                                    ...userDraft,
                                    roleId: event.target.value as DemoRoleId,
                                  },
                                }))
                              }
                              className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                            >
                              {USER_ROLES.map((roleId) => (
                                <option key={roleId} value={roleId}>
                                  {getRoleLabel(roleId)}
                                </option>
                              ))}
                            </select>
                            <select
                              value={userDraft.status}
                              disabled={busyUserId === user.id}
                              onChange={(event) =>
                                setUserDrafts((current) => ({
                                  ...current,
                                  [user.id]: {
                                    ...userDraft,
                                    status: event.target.value as DemoTeamUserStatus,
                                  },
                                }))
                              }
                              className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                            >
                              {USER_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {getTeamUserStatusLabel(status)}
                                </option>
                              ))}
                            </select>
                            <select
                              value={userDraft.branchId}
                              disabled={busyUserId === user.id}
                              onChange={(event) =>
                                setUserDrafts((current) => ({
                                  ...current,
                                  [user.id]: { ...userDraft, branchId: event.target.value },
                                }))
                              }
                              className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                            >
                              <option value="">Sube atama</option>
                              {companyBranches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                  {branch.name} · {branch.agencyName}
                                </option>
                              ))}
                            </select>
                          </div>

                          <textarea
                            value={userDraft.responsibility}
                            disabled={busyUserId === user.id}
                            onChange={(event) =>
                              setUserDrafts((current) => ({
                                ...current,
                                [user.id]: {
                                  ...userDraft,
                                  responsibility: event.target.value,
                                },
                              }))
                            }
                            placeholder="Sorumluluk notu"
                            className="mt-4 min-h-[88px] w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
