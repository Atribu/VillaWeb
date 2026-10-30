import { mkdir, readFile, writeFile, rename, readdir, stat, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresEnvironment, privateBackupDirectory, run, sha256, safeArchiveEntries } from "./backup-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtime = process.env.VILLA_RUNTIME_DIRECTORY || path.join(root, ".villa-runtime");
const command = process.argv[2] || "create";
const argument = process.argv[3];
async function report(update) {
  await mkdir(runtime, { recursive: true, mode: 0o700 });
  let previous = {}; try { previous = JSON.parse(await readFile(path.join(runtime, "backup-status.json"), "utf8")); } catch { /* First run. */ }
  const temporary = path.join(runtime, `backup-status.${randomUUID()}.tmp`);
  await writeFile(temporary, JSON.stringify({ ...previous, ...update }), { mode: 0o600 }); await rename(temporary, path.join(runtime, "backup-status.json"));
}
async function verify(directory) {
  const manifest = JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8"));
  if (manifest.version !== 1 || !manifest.files || !manifest.tableCounts) throw new Error("Invalid backup manifest.");
  for (const name of ["database.dump", "uploads.tar"]) {
    if (await sha256(path.join(directory, name)) !== manifest.files[name]) throw new Error(`Checksum mismatch: ${name}`);
  }
  await run("pg_restore", ["--list", path.join(directory, "database.dump")]);
  const entries = safeArchiveEntries(await run("tar", ["-tf", path.join(directory, "uploads.tar")], process.env, true));
  return { manifest, entries };
}
async function tableCounts(env) {
  const text = await run("psql", ["-X", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", 'SELECT json_build_object(\'companies\',(SELECT count(*) FROM "Company"),\'villas\',(SELECT count(*) FROM "Villa"),\'images\',(SELECT count(*) FROM "VillaImage"),\'requests\',(SELECT count(*) FROM "BookingRequest"))'], env, true);
  return JSON.parse(text.trim());
}
async function create() {
  if (process.env.BACKUP_WRITES_PAUSED !== "1") throw new Error("Pause application writes first, then set BACKUP_WRITES_PAUSED=1. This script does not stop the application.");
  const env = postgresEnvironment(process.env.DATABASE_URL);
  const backupRoot = privateBackupDirectory(process.env.BACKUP_DIRECTORY, root);
  await mkdir(backupRoot, { recursive: true, mode: 0o700 });
  const lock = path.join(backupRoot, ".backup-lock");
  try { await mkdir(lock, { mode: 0o700 }); }
  catch (error) { if (error.code === "EEXIST") throw new Error("Backup lock exists. Check for an active process before removing a stale lock."); throw error; }
  try {
  const id = `${new Date().toISOString().replaceAll(":", "-")}-${randomUUID().slice(0, 8)}`;
  const temporary = path.join(backupRoot, `${id}.partial`), destination = path.join(backupRoot, id);
  await mkdir(temporary, { recursive: true, mode: 0o700 });
  const counts = await tableCounts(env);
  await run("pg_dump", ["--format=custom", "--no-owner", "--no-privileges", "--file", path.join(temporary, "database.dump")], env);
  await run("tar", ["-cf", path.join(temporary, "uploads.tar"), "-C", path.join(root, "public", "uploads"), "villas"]);
  const manifest = { version: 1, createdAt: new Date().toISOString(), tableCounts: counts, files: {
    "database.dump": await sha256(path.join(temporary, "database.dump")), "uploads.tar": await sha256(path.join(temporary, "uploads.tar")),
  } };
  await writeFile(path.join(temporary, "manifest.json"), JSON.stringify(manifest, null, 2), { mode: 0o600 });
  await verify(temporary); await rename(temporary, destination);
  await report({ status: "ok", finishedAt: new Date().toISOString(), verifiedAt: new Date().toISOString() });
  console.log(`Backup verified: ${destination}`);
  } finally { await rm(lock, { recursive: true }); }
}
async function restoreTest(directory) {
  const { manifest, entries } = await verify(directory);
  if (!process.env.BACKUP_RESTORE_DATABASE_URL) throw new Error("BACKUP_RESTORE_DATABASE_URL is required for a separate restore-test connection.");
  const env = postgresEnvironment(process.env.BACKUP_RESTORE_DATABASE_URL);
  const database = `villaweb_restore_test_${randomUUID().replaceAll("-", "")}`;
  let created = false;
  try {
    await run("createdb", [database], env); created = true;
    const target = { ...env, PGDATABASE: database };
    await run("pg_restore", ["--exit-on-error", "--no-owner", "--no-privileges", "--dbname", database, path.join(directory, "database.dump")], target);
    const counts = await tableCounts(target);
    for (const [key, count] of Object.entries(manifest.tableCounts)) if (counts[key] !== count) throw new Error(`Restore count mismatch: ${key}`);
    const urls = await run("psql", ["-X", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", 'SELECT url FROM "VillaImage" UNION SELECT "tourismLicensePdfUrl" FROM "Villa" WHERE "tourismLicensePdfUrl" IS NOT NULL'], target, true);
    for (const url of urls.split("\n").filter(value => value.startsWith("/uploads/villas/"))) {
      if (!entries.has(url.replace(/^\/uploads\//, ""))) throw new Error("A database image/document is missing from the upload archive.");
    }
    await report({ lastRestoreTestAt: new Date().toISOString() }); console.log("Restore test passed: table counts and uploaded file references verified.");
  } finally {
    // The destination is generated by this process, never supplied by a user or manifest.
    if (created) await run("dropdb", [database], env);
  }
}
async function cleanup() {
  // Only expiring temporary images and bounded health logs, never real villa uploads/backups.
  for (const [directory, age, pattern] of [["staged", 48 * 3600000, /^[0-9a-f-]{36}\.webp$/], ["events", 30 * 86400000, /^\d+-[0-9a-f-]+\.json$/]]) {
    const folder = path.join(runtime, directory);
    const names = await readdir(folder).catch(() => []);
    for (const name of names) if (pattern.test(name)) {
      const file = path.join(folder, name); const info = await stat(file);
      if (info.isFile() && Date.now() - info.mtimeMs > age) await rm(file);
    }
  }
  console.log("Expired staging images and old health events cleaned.");
}
try {
  process.umask(0o077);
  if (command === "create") await create();
  else if (command === "verify" && argument) { await verify(path.resolve(argument)); console.log("Archive checksums and contents verified. This is not a restore test."); }
  else if (command === "restore-test" && argument) await restoreTest(path.resolve(argument));
  else if (command === "cleanup") await cleanup();
  else throw new Error("Usage: backup.mjs create | verify <directory> | restore-test <directory> | cleanup");
} catch (error) {
  if (command === "create") await report({ status: "error", lastFailureAt: new Date().toISOString() }).catch(() => {});
  console.error(error instanceof Error ? error.message : "Backup operation failed."); process.exitCode = 1;
}
