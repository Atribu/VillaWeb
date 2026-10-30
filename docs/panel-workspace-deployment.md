# Panel workspace release

Implemented scope: shared calendar, work/notification center, sales tracking, publication checks, owner portal, sequential image uploads, health and backup tools. Professional proposal/PDF generation is deliberately excluded.

## Before deployment

1. Back up the current PostgreSQL database and `public/uploads/villas` together. Do not copy local `data/*.json` to production, reset the database, or reseed existing customer records.
2. This release adds the `OWNER` membership role and the `PanelWorkRecord` table. Existing company records are not rewritten. Apply schema changes before restarting with the new build.
3. The repository previously had no migration history. `20261030000000_baseline` is generated from the pre-release schema, not from an empty/minimal example. If production was created with `db push`, an operator must first compare its schema with this baseline and resolve any drift. Only if the existing schema matches, mark the baseline as already applied:

```sh
npx prisma migrate resolve --applied 20261030000000_baseline
```

Do NOT mark the baseline applied on an empty database. For a fresh database, `migrate deploy` creates both the baseline and new table. If the server already has its own migration history, reconcile that history first rather than blindly resolving or replacing it. Reference: [Prisma baselining](https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining).

Then:

```sh
npm ci
npm run prisma:migrate:deploy
npm run build
```

Restart using the server's existing process manager. Do not run `db push --accept-data-loss`, `migrate reset`, or the seed command on production.

## Environment and storage

Fonts are now bundled under `src/assets/fonts` with licenses. Include that directory in Git/deployment; builds no longer require a Google Fonts request. Existing font families and CSS variables are preserved.

- `SESSION_SECRET`: at least 32 random characters in production. Also signs temporary upload receipts. Rotating it invalidates old receipts and sessions.
- `VILLA_RUNTIME_DIRECTORY`: absolute, private, persistent, app-writable directory, e.g. `/var/lib/villaweb/runtime`. Never expose this directory through Nginx. The app and backup commands must use the SAME value.
- The existing `public/uploads/villas` directory must remain writable and survive releases. Receipts are private; finalized WebP/PDF files still use the existing public serving path.
- Stage receipts last 24 hours and are bound to the authenticated user and company. Images are converted and watermarked once per successful upload. The form keeps successes in memory; browser reloads require reselection. Switching roles/accounts invalidates use of another user's receipts.
- `storage:cleanup` removes only staged images older than 48 hours and health events older than 30 days. It never deletes real villa images, PDF files or backups.
- There is no new file-byte/count limit in the app. Proxy request limits, disk capacity, image decoder pixel protection and timeouts still apply to each individual file.

## Feature usage

- **Takvim Senkronizasyon > Ortak Takvim:** month navigation, villa/location/company search, 25 villas per page, click a night for details. End dates are exclusive; checkout day is available unless another block begins. Reservation links require reservation permission.
- **Bildirimler ve Gorevler:** role-scoped live alerts for requests, arrivals, overdue payments, iCal failures, operations and follow-ups. Read state is per user. There is no outbound email/SMS sending and no polling storm; refresh to see changes. Create tasks with active-company assignees, deadline and status. Only creator, assignee or admin can edit a task.
- **Rezervasyonlar > Satis Takibi:** search, overdue filter, last/next contact, assignee, internal note. Status changes reuse the reservation/finance workflow and require confirmation. Existing QUOTE_SENT status is retained; this does not create a new proposal document.
- **Ayarlar > Yayin Kontrolu:** photos, positive price and location are basic requirements; license number/PDF and English content are configurable publication blockers. Existing active records are not silently unpublished. Validation runs for create, edit and activating a villa; old records can be saved as drafts while missing requirements are completed.
- **Kullanicilar > Villa Sahipleri:** first create an OWNER user in Personel, then explicitly assign villas from the same company. The owner signs in using company name + credentials. The portal only returns assigned villas' minimal information, occupied dates and the owner's requests. No guest contacts, prices, team notes or supplier data. Revoking a grant takes effect on the next request. Pending date requests do not change availability. Admin approval rechecks overlap and writes the block; rejection leaves availability unchanged. Existing approved blocks survive access revocation and can be removed through normal villa availability management.
- **Ayarlar > Sistem Sagligi:** super-admin only. Database/table access, storage space/permissions, process RSS/uptime, backup timestamps and last 50 sanitized upload events. iCal environment presence alone does not prove a scheduler is running.
- New workflows are in PostgreSQL. Development fallback uses ignored `panel-work-records.json`, serialized and atomically replaced. Fallback is single-process and is not a production database substitute.

## Backup and restore test

Install PostgreSQL client tools (`pg_dump`, `pg_restore`, `psql`, `createdb`, `dropdb`) compatible with the server version, plus `tar`. No new npm package is needed.

Set `DATABASE_URL`, `BACKUP_DIRECTORY` (absolute, outside public, e.g. `/var/backups/villaweb`) and `VILLA_RUNTIME_DIRECTORY` in the process environment. Commands do not auto-source `.env`; use the process manager's protected EnvironmentFile or the operator's environment. Credentials are passed to child processes via environment, never command arguments or the manifest.

For a consistent database-and-file snapshot, pause ALL application writers, including external workers, while creating the backup. `BACKUP_WRITES_PAUSED=1` is an operator assertion, not a maintenance switch. The command refuses to create a backup without it:

```sh
BACKUP_WRITES_PAUSED=1 npm run backup:create
npm run backup:verify -- /var/backups/villaweb/EXACT_BACKUP_DIRECTORY
```

Each completed directory contains a custom-format PostgreSQL dump, upload archive and SHA-256 manifest. Failed runs remain `.partial` and are not reported successful. Verify checks archive readability and checksums, not full restoration.

For the full test, set `BACKUP_RESTORE_DATABASE_URL` to a connection with permission to create/drop a disposable database, preferably on a separate staging server:

```sh
npm run backup:restore-test -- /var/backups/villaweb/EXACT_BACKUP_DIRECTORY
```

The test creates a NEW randomly named `villaweb_restore_test_*` database, restores the dump, compares company/villa/image/request counts and checks local image/PDF references against the upload archive. Only the generated test database is dropped in cleanup. It never uses the production database as the restore destination. Failure to clean up is reported. Run at least monthly and after schema/storage changes. This verifies data restoration, not a complete UI/business acceptance test.

Backups contain personal data. Restrict access, encrypt the backup volume/offsite storage and configure a separately secured off-server copy and retention policy. This release does not invent an offsite destination, automatically delete backups or claim remote disaster recovery is configured. Monitor disk usage.

## Scheduling examples

The `deploy/*.example` units are NOT installed automatically. Edit username, paths, Node binary, timezone and actual app service name before installation. The backup example briefly STOPS `villaweb.service`, runs the backup under the app user, then restarts the app even after failure via `ExecStopPost`. Configure a maintenance response at the reverse proxy and an approved low-traffic window. If production uses PM2 or multiple writers, use an equivalent reviewed stop/backup/restart wrapper; do not install the sample unchanged. The privileged `+` prefix is limited to systemctl lines, following [systemd service command prefixes](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html).

Install reviewed copies without `.example` in `/etc/systemd/system`. Create `/etc/villaweb/backup.env` readable only by root, including database connection, backup directory and the same runtime directory as the app. Provision both directories for the app user. Then an operator can enable `villaweb-backup.timer` and `villaweb-storage-cleanup.timer` with `systemctl enable --now`. Check `systemctl list-timers` and `journalctl -u villaweb-backup.service`, and run one restore test before treating backups as operational.

## Release checks

- `npm test`, `npm run build`, `npm run test:smoke` in an isolated checkout (separate `.next` and fixtures).
- Production: verify migration, company isolation, owner assignment/revocation, request approval overlap, image receipt upload/finalization and a real PostgreSQL restore test.
- The local fallback tests do not replace a real PostgreSQL deployment check. This machine currently has no PostgreSQL client/server or Docker, so live backup/restore must be validated on the server.
