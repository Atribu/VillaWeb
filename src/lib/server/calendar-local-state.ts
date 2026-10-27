import "server-only";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { readFile } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { AvailabilityRange } from "@/lib/villa-catalog";
import type { DemoSyncLogRecord } from "@/lib/demo-calendar-sync";

export type LocalCalendarState = {
  sources: Record<string, {
    companyId: string;
    villaId: string;
    status: "HEALTHY" | "WARNING" | "ERROR";
    lastSyncedAt?: string;
    lastAttemptAt?: string;
    nextSyncAt?: string;
    leaseToken?: string;
    leaseUntil?: string;
    blocks: AvailabilityRange[];
  }>;
  logs: DemoSyncLogRecord[];
};

function statePath() {
  if (process.env.NODE_ENV === "production") throw new Error("Local calendar storage is disabled in production.");
  return path.join(process.env.DEV_DATA_DIRECTORY || path.join(process.cwd(), "data"), "development-calendar-sync.json");
}

export async function readLocalCalendarState(): Promise<LocalCalendarState> {
  let result: LocalCalendarState = { sources: {}, logs: [] };
  const target = statePath();
  // Do not return raw file content in development-mode React IO traces.
  await new Promise<void>((resolve, reject) => {
    readFile(target, "utf8", (error, raw) => {
      if (error) { if (error.code === "ENOENT") resolve(); else reject(error); return; }
      try { result = JSON.parse(raw); resolve(); } catch (parseError) { reject(parseError); }
    });
  });
  return result;
}

let pending: Promise<unknown> = Promise.resolve();
export function updateLocalCalendarState<T>(mutate: (state: LocalCalendarState) => Promise<T> | T): Promise<T> {
  const operation = pending.then(async () => {
    const state = await readLocalCalendarState();
    const result = await mutate(state);
    state.logs = state.logs.slice(-1000);
    const target = statePath();
    await mkdir(path.dirname(target), { recursive: true });
    const temporary = `${target}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(state), { mode: 0o600 });
    await rename(temporary, target);
    return result;
  });
  pending = operation.catch(() => undefined);
  return operation;
}

export async function invalidateLocalCalendarSync(sourceId: string) {
  await updateLocalCalendarState((state) => {
    const source = state.sources[sourceId];
    if (source) {
      source.leaseToken = undefined;
      source.leaseUntil = undefined;
      source.nextSyncAt = new Date().toISOString();
      source.status = "WARNING";
    }
  });
}
