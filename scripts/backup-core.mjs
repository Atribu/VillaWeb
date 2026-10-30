import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

export function postgresEnvironment(connection, base = process.env) {
  const url = new URL(connection);
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || !url.pathname.slice(1)) throw new Error("Invalid PostgreSQL URL");
  const env = { ...base, PGHOST: url.hostname, PGPORT: url.port || "5432", PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password), PGDATABASE: decodeURIComponent(url.pathname.slice(1)), PGCONNECT_TIMEOUT: "15" };
  if (url.searchParams.has("sslmode")) env.PGSSLMODE = url.searchParams.get("sslmode");
  return env;
}
export function privateBackupDirectory(value, cwd) {
  if (!value || !path.isAbsolute(value)) throw new Error("BACKUP_DIRECTORY must be an absolute private directory.");
  const resolved = path.resolve(value), publicRoot = path.resolve(cwd, "public");
  if (resolved === publicRoot || resolved.startsWith(publicRoot + path.sep)) throw new Error("Backups must not be under public/.");
  return resolved;
}
export function run(command, args, env = process.env, capture = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", data => { if (capture) output += data.toString(); });
    // CLI errors may contain connection information. Do not copy them into panel/log artifacts.
    child.stderr.resume();
    child.on("error", () => reject(new Error(`${command} could not start. Check installation and permissions.`)));
    child.on("close", code => code === 0 ? resolve(output) : reject(new Error(`${command} failed (${code}). Check server configuration.`)));
  });
}
export async function sha256(file) { const hash = createHash("sha256"); for await (const chunk of createReadStream(file)) hash.update(chunk); return hash.digest("hex"); }
export function safeArchiveEntries(output) {
  const entries = output.split("\n").filter(Boolean).map(entry => entry.replace(/^\.\//, ""));
  if (entries.some(entry => entry.startsWith("/") || entry.split("/").includes("..") || (entry !== "villas/" && !entry.startsWith("villas/")))) throw new Error("Unsafe upload archive paths.");
  return new Set(entries);
}
