"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getRoleLabel,
  getTeamUserStatusLabel,
  getTeamUserStatusTone,
  type DemoRoleId,
  type DemoTeamUserRecord,
  type DemoTeamUserStatus,
} from "@/lib/demo-users-messages";
import { formatShortDate } from "@/lib/villa-catalog";

type TeamUsersManagerProps = {
  users: DemoTeamUserRecord[];
};

const USER_STATUSES: DemoTeamUserStatus[] = ["ACTIVE", "INVITED", "PASSIVE"];
const USER_ROLES: DemoRoleId[] = ["ADMIN", "SALES", "OPERATIONS", "FINANCE", "CRM", "CONTENT"];

export function TeamUsersManager({ users }: TeamUsersManagerProps) {
  const router = useRouter();
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  async function updateUser(userId: string, payload: { status?: DemoTeamUserStatus; roleId?: DemoRoleId }) {
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

      <div className="space-y-4">
        {users.map((user) => (
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

              <div className="grid w-full max-w-[320px] gap-4 rounded-[1.5rem] bg-[#f8fafc] p-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Durum
                  </p>
                  <select
                    value={user.status}
                    disabled={busyUserId === user.id}
                    onChange={(event) =>
                      updateUser(user.id, { status: event.target.value as DemoTeamUserStatus })
                    }
                    className="mt-3 w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                  >
                    {USER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {getTeamUserStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Rol
                  </p>
                  <select
                    value={user.roleId}
                    disabled={busyUserId === user.id}
                    onChange={(event) =>
                      updateUser(user.id, { roleId: event.target.value as DemoRoleId })
                    }
                    className="mt-3 w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2b78ad]"
                  >
                    {USER_ROLES.map((roleId) => (
                      <option key={roleId} value={roleId}>
                        {getRoleLabel(roleId)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
