# Panel workflows

## Photos

Open a villa editor and choose **Galeri yonetimi**. Drag saved photos or use the arrow buttons to reorder them. Choose a cover independently of the gallery order. Preview opens a modal; removal requires confirmation. Nothing is applied until **Galeriyi kaydet**. At least one image must remain. Removed images are detached from the gallery, not physically deleted from disk.

New files are still uploaded through the main villa form. Their order can be changed before upload. Existing format conversion and watermark behavior is unchanged. Gallery saves use an expected snapshot and reject stale editors with HTTP 409. PostgreSQL commits photo rows, cover and audit together in a serializable transaction.

## Draft recovery

Villa text/select/checkbox fields are stored in browser localStorage after edits, scoped to the authenticated user, company and villa. New-record drafts use the same target company as villa creation. Drafts expire after seven days and are offered for explicit restoration; they never publish or update a server record automatically.

Photo/PDF file contents are NOT stored. The form clearly requests reselection after recovery. Successful submission clears this browser's draft. Storage failures and conflicting changes from another tab are reported instead of silently replacing the other draft. Closing/navigating away flushes pending text edits. Shared-device users should remove unused drafts; clearing browser storage also removes them.

## Request workspace

Use **Talep detayi ve ekip notlari** from the request list. `/panel/talepler/[id]` combines guest contact, stay dates, recorded price breakdown, booking confirmation controls, status changes, internal notes and history. Status changes retain existing availability/finance workflows. Internal notes are limited to 2000 characters and remain panel-only.

## Bulk operations

Select villas on the current list page, then choose pause or archive. The confirmation lists all affected villas and warns super admins about multi-company selections. This does not delete villas or existing bookings. Every ID is authorized before writing; invalid mixed-scope batches write nothing. Stale status selections return HTTP 409. Production batches and audit rows commit in one database transaction. Selection resets on filter/page changes.

## History and deployment

The existing Prisma `AuditLog` model records actor, company, entity ID, action, summary and timestamp. Tracked operations: villa form edits, status changes, base/seasonal prices, galleries, bulk status changes, request status changes and internal notes. History is available inside the corresponding villa/request; the latest 200 events are shown. Older actions cannot be retroactively attributed. Existing request events are retained as legacy history.

No schema migration or new package is introduced by these features. Deploy the normal production build against an already migrated database; do not copy local JSON data. Local fallback uses ignored `data/panel-audit.json` (or `DEV_DATA_DIRECTORY`) for history. JSON fallback remains a development-only single-process mode, not a transactional production database.

Checks: `npm test`, `npm run build`, and `npm run test:smoke` in an isolated checkout. The smoke suite uses separate fixtures and must not run alongside a dev server using the same `.next` directory. Production transaction behavior also has mocked unit tests; these do not replace a deployment check against an actual PostgreSQL instance.
