import "server-only";
import { readFile } from "node:fs";
import { mkdir, writeFile, rename } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import * as path from "node:path";

type LocalFile = "platform-config" | "portfolio-shares" | "second-factor" | "funnel-visits";
function target(name: LocalFile) {
  if (process.env.NODE_ENV === "production") throw new Error("Local platform storage is disabled in production.");
  return path.join(process.env.DEV_DATA_DIRECTORY || path.join(process.cwd(), "data"), `${name}.json`);
}
export async function readPlatformLocal<T>(name: LocalFile): Promise<T[]> {
  let rows: T[] = [];
  await new Promise<void>((resolve, reject) => readFile(target(name), "utf8", (error, raw) => {
    if (error) { if (error.code === "ENOENT") resolve(); else reject(error); return; }
    try { rows = JSON.parse(raw); if (!Array.isArray(rows)) throw new Error("Invalid local store."); resolve(); } catch (error) { reject(error); }
  }));
  return rows;
}
const queues = new Map<string, Promise<unknown>>();
export function mutatePlatformLocal<T, R>(name: LocalFile, change: (rows: T[]) => Promise<R> | R): Promise<R> {
  const key = target(name);
  const operation = (queues.get(key) ?? Promise.resolve()).then(async () => {
    const rows = await readPlatformLocal<T>(name); const result = await change(rows);
    await mkdir(path.dirname(key), { recursive: true }); const temp = `${key}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(rows), { mode: 0o600 }); await rename(temp, key); return result;
  });
  queues.set(key, operation.catch(() => {})); return operation;
}
