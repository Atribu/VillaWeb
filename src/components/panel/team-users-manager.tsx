"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getRoleLabel,
  getTeamUserStatusLabel,
  getTeamUserStatusTone,
  type DemoBranchRecord,
  type DemoRoleId,
  type DemoTeamUserRecord,
  type DemoTeamUserStatus,
} from "@/lib/demo-users-messages";
import { formatShortDate } from "@/lib/villa-catalog";

type TeamUsersManagerProps = {
  users: DemoTeamUserRecord[];
  branches: DemoBranchRecord[];
};

type CreateUserFormState = {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  roleId: DemoRoleId;
  status: DemoTeamUserStatus;
  branchId: string;
  responsibility: string;
};

type UserDraftState = {
  roleId: DemoRoleId;
  status: DemoTeamUserStatus;
  branchId: string;
  responsibility: string;
};

const USER_STATUSES: DemoTeamUserStatus[] = ["ACTIVE", "INVITED", "PASSIVE"];
const USER_ROLES: DemoRoleId[] = ["ADMIN", "SALES", "OPERATIONS", "FINANCE", "CRM", "CONTENT"];

const INITIAL_CREATE_FORM: CreateUserFormState = {
  fullName: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  roleId: "CONTENT",
  status: "INVITED",
  branchId: "",
  responsibility: "",
};

function buildUserDrafts(users: DemoTeamUserRecord[]) {
  return Object.fromEntries(
    users.map((user) => [
      user.id,
      {
        roleId: user.roleId,
        status: user.status,
        branchId: user.branchId,
        responsibility: user.responsibility,
      } satisfies UserDraftState,
    ]),
  ) as Record<string, UserDraftState>;
}

export function TeamUsersManager({ users, branches }: TeamUsersManagerProps) {
  const router = useRouter();
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [createForm, setCreateForm] = useState<CreateUserFormState>({
    ...INITIAL_CREATE_FORM,
    branchId: branches[0]?.id ?? "",
  });
  const [userDrafts, setUserDrafts] = useState<Record<string, UserDraftState>>(
    buildUserDrafts(users),
  );

  async function updateUser(
    userId: string,
    payload: {
      status?: DemoTeamUserStatus;
      roleId?: DemoRoleId;
      branchId?: string;
      responsibility?: string;
    },
  ) {
    setBusyUserId(userId);
    setMessage("");

    try {
      const response = await fetch(`/api/demo/users-messages/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? "Kullanici guncellenemedi.");
        return;
      }

      setMessageTone("success");
      setMessage("Kullanici bilgisi guncellendi.");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Kullanici guncellemesi sirasinda baglanti hatasi olustu.");
    } finally {
      setBusyUserId(null);
    }
  }

  async function createUser() {
    setIsCreating(true);
    setMessage("");

    try {
      const response = await fetch("/api/demo/users-messages/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error ?? "Kullanici olusturulamadi.");
        return;
      }

      setMessageTone("success");
      setMessage("Yeni ekip kullanicisi olusturuldu.");
      setCreateForm({
        ...INITIAL_CREATE_FORM,
        branchId: branches[0]?.id ?? "",
      });
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("Kullanici olusturulurken baglanti hatasi olustu.");
    } finally {
      setIsCreating(false);
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
              Yeni Personel
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-900">
              Panel kullanicisini ve firma icindeki rolunu ayni yerden olustur
            </h3>
          </div>
          <button
            type="button"
            disabled={isCreating}
            onClick={createUser}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? "Olusturuluyor..." : "Personel Kaydini Ac"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={createForm.fullName}
            onChange={(event) => setCreateForm((current) => ({ ...current, fullName: event.target.value }))}
            placeholder="Ad soyad"
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          />
          <input
            value={createForm.username}
            onChange={(event) => setCreateForm((current) => ({ ...current, username: event.target.value }))}
            placeholder="Kullanici adi"
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          />
          <input
            value={createForm.email}
            onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="E-posta"
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          />
          <input
            value={createForm.phone}
            onChange={(event) => setCreateForm((current) => ({ ...current, phone: event.target.value }))}
            placeholder="Telefon"
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          />
          <input
            type="password"
            value={createForm.password}
            onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="Gecici sifre"
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          />
          <select
            value={createForm.roleId}
            onChange={(event) =>
              setCreateForm((current) => ({
                ...current,
                roleId: event.target.value as DemoRoleId,
              }))
            }
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          >
            {USER_ROLES.map((roleId) => (
              <option key={roleId} value={roleId}>
                {getRoleLabel(roleId)}
              </option>
            ))}
          </select>
          <select
            value={createForm.status}
            onChange={(event) =>
              setCreateForm((current) => ({
                ...current,
                status: event.target.value as DemoTeamUserStatus,
              }))
            }
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          >
            {USER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getTeamUserStatusLabel(status)}
              </option>
            ))}
          </select>
          <select
            value={createForm.branchId}
            onChange={(event) => setCreateForm((current) => ({ ...current, branchId: event.target.value }))}
            className="rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
          >
            <option value="">Sube sec</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name} · {branch.agencyName}
              </option>
            ))}
          </select>
        </div>

        <textarea
          value={createForm.responsibility}
          onChange={(event) => setCreateForm((current) => ({ ...current, responsibility: event.target.value }))}
          placeholder="Kullanici sorumlulugu ve ekip notu"
          className="mt-4 min-h-[110px] w-full rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad] focus:bg-white"
        />
      </section>

      <div className="space-y-4">
        {users.map((user) => {
          const draft = userDrafts[user.id] ?? {
            roleId: user.roleId,
            status: user.status,
            branchId: user.branchId,
            responsibility: user.responsibility,
          };

          return (
            <article
              key={user.id}
              className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getTeamUserStatusTone(
                        user.status,
                      )}`}
                    >
                      {getTeamUserStatusLabel(user.status)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      {getRoleLabel(user.roleId)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold text-slate-900">{user.fullName}</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      @{user.username} · {user.email} · {user.phone}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      ["Acenta", user.agencyName],
                      ["Sube", user.branchName],
                      ["Sorumluluk", user.responsibility],
                      ["Son aktivite", formatShortDate(user.lastActiveAt.slice(0, 10))],
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

                <div className="grid w-full max-w-[360px] gap-4 rounded-[1.5rem] bg-[#f8fafc] p-5">
                  <select
                    value={draft.status}
                    disabled={busyUserId === user.id}
                    onChange={(event) =>
                      setUserDrafts((current) => ({
                        ...current,
                        [user.id]: {
                          ...draft,
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
                    value={draft.roleId}
                    disabled={busyUserId === user.id}
                    onChange={(event) =>
                      setUserDrafts((current) => ({
                        ...current,
                        [user.id]: {
                          ...draft,
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
                    value={draft.branchId}
                    disabled={busyUserId === user.id}
                    onChange={(event) =>
                      setUserDrafts((current) => ({
                        ...current,
                        [user.id]: {
                          ...draft,
                          branchId: event.target.value,
                        },
                      }))
                    }
                    className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                  >
                    <option value="">Sube atama</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} · {branch.agencyName}
                      </option>
                    ))}
                  </select>

                  <textarea
                    value={draft.responsibility}
                    disabled={busyUserId === user.id}
                    onChange={(event) =>
                      setUserDrafts((current) => ({
                        ...current,
                        [user.id]: {
                          ...draft,
                          responsibility: event.target.value,
                        },
                      }))
                    }
                    placeholder="Sorumluluk notu"
                    className="min-h-[100px] rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                  />

                  <button
                    type="button"
                    disabled={busyUserId === user.id}
                    onClick={() =>
                      updateUser(user.id, {
                        status: draft.status,
                        roleId: draft.roleId,
                        branchId: draft.branchId,
                        responsibility: draft.responsibility,
                      })
                    }
                    className="rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyUserId === user.id ? "Kaydediliyor..." : "Kullaniciyi Kaydet"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
