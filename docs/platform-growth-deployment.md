# Platform growth release

This release implements the seven approved improvements. It does not deploy itself,
enroll a real account in MFA, share existing portfolios, alter existing packages or
publish existing site drafts. The previously excluded proposal/PDF feature remains excluded.

## Operator checklist

1. Back up PostgreSQL and `public/uploads/villas` together using the existing backup procedure.
2. Rehearse the release against an isolated staging database and uploads directory. Never
   copy local fallback JSON files, production customer data or production credentials there.
3. Check the baseline instructions in [the workspace release guide](panel-workspace-deployment.md).
   If production originated from `db push`, reconcile the baseline with the actual schema first.
   Do not blindly mark migrations applied. Never use reset, destructive db push or seed on an existing installation.
4. Provision a separate `MFA_ENCRYPTION_KEY` with `openssl rand -hex 32`. Store it in the
   protected service environment, not Git. Keep an encrypted off-server copy alongside
   secret-management backups. Losing or rotating it without a migration prevents enrolled users from signing in.
5. Set `APP_ENV=production` (or `staging`), HTTPS `APP_URL`, `DEV_FALLBACK_MODE=false`,
   strong distinct `SESSION_SECRET` and `ICAL_SIGNING_SECRET`, and the PostgreSQL connection.
   Do not replace an existing session/iCal secret during a routine release.
6. Run these commands from the release directory with the service environment loaded:

```sh
npm ci
npm run release:check
npm run prisma:migrate:deploy
npm run build
```

Restart using the existing reviewed process manager configuration. The new migration
`20261030180000_platform_growth` adds tables, pricing fields and constraints. It does not
rewrite existing villa, company or customer records. All existing firms default to their
current unrestricted package until a super admin assigns limits. Keep uploads persistent.
Validate migration status, login, an existing villa, a new inquiry, image upload and
approval/cancellation on staging before moving to production.

## New screens

- `/panel/kurulum`: company-scoped checklist, logo upload, Turkish/English hero copy,
  contacts, requested domain, template and first administrator. Logo files are converted
  to WebP (10 MB / 16 MP logo-only limit); existing villa upload limits are unchanged.
- `/panel/paketler`: super-admin-only package name, user/active-owned-villa quotas and modules.
  Active and invited members count; suspended members do not. Limits cannot be set below
  current usage. Quotas are checked under a company lock in PostgreSQL. Module and role
  authorization both apply; disabled modules are removed from navigation and blocked at their routes/APIs.
- `/panel/portfoy-paylasimi`: source firm offers an active villa to an exact recipient firm
  code; the recipient explicitly accepts the quoted nightly price and commission percentage.
  Pending/revoked offers do not appear on the recipient website. Either firm can revoke.
- `/panel/fiyat-takvimi`: select up to 100 owned villas, validate/preview a new period, then
  confirm bulk application. Existing periods are never overwritten. A conflict aborts the
  entire PostgreSQL transaction. Individual villa pricing screens edit or remove periods.
- `/panel/donusum`: date/source-filtered views, inquiries and currently approved inquiries,
  per villa. Historical requests are retained; missing historical view counts are not invented.
- `/panel/guvenlik`: super-admin-only authenticator setup, verification, recovery codes,
  recovery-code renewal and disable. Changes require the current password and, once enabled,
  a valid second factor. No real account is enrolled automatically.

## Publication and domains

Saving a site draft does not change the public website. Authenticated own-company admins
and super admins can preview it; preview responses are private/no-store and noindex.
Publishing uses the saved draft, with a version check to reject stale edits. Phone, email
and address must be completed. This workflow covers the branding/contact/hero/template
fields in the wizard; existing independent landing-page/SEO record editors retain their own workflows.
Non-primary microsites retain their separate template picker, with an explicit immediate-publish
confirmation. They do not use the primary site's draft workflow.

A requested domain is not automatically bound: verify ownership, configure DNS/TLS and
the existing company/website domain record on the server. Do not claim another firm's host.
Registered hosts remain authoritative for ordinary visits. Authenticated preview is the
only explicit company override. Primary-site drafts do not replace other existing microsite templates.

## Portfolio boundaries

Only the accepted villa's public catalogue fields, photos, price and occupied dates are
shared. Supplier contacts, owner labels, internal notes, guest contacts and source-company
reports are not exposed. Requests, invoices and operations belong to the selling firm;
the source firm receives only occupied dates with a generic partner-reservation label.
Both firms must be active with sharing enabled; the source villa must be active.

The agreed nightly price replaces source seasonal nightly prices; seasonal minimum nights
and cleaning fees remain applicable. The seller's eligible campaigns/coupons can apply.
Commission is snapshotted from discounted accommodation revenue, excluding cleaning,
when the inquiry is created. It is displayed internally, not returned to the public form.
This is accounting visibility, NOT an automatic payout or payment-provider integration.

Approvals use the original villa's availability lock, including owner and other partner
requests, to prevent overlapping approvals. Revocation stops new sales/approvals but does
not cancel existing approved bookings. Any villa with a sharing history cannot be permanently
deleted; use passive/archive instead. Price changes require revoke + a newly accepted offer.
Pending inquiries retain the original offer version and cannot be approved after its terms change;
create a new inquiry with the accepted current conditions instead.

## Pricing and reports

Friday/Saturday occupied nights receive the configured percentage difference. Early-booking
eligibility compares the booking date and arrival date. The better of early-booking savings
and campaign savings applies, not both; a valid coupon applies afterwards. Amounts are
rounded to cents and saved in the request pricing snapshot.

Views are deduplicated by company/villa/day using a one-day anonymous cookie hashed with
company and date. No IP, full referrer URL or arbitrary UTM value is stored. DNT/GPC and
obvious bots are excluded. Source is a category: direct/search/social/email/referral/panel;
older unattributed inquiries are unknown. Visit retention is 90 days. Blocking cookies or
analytics reduces measurement accuracy. Include this behavior in the site's privacy/consent review.

Ratios are period activity ratios, not unique-person/cohort conversion rates. Manual panel
inquiries do not count toward view-to-inquiry ratio. Approved counts use current status of
inquiries created in the selected period; cancelled inquiries no longer count as approved.

## MFA enrollment

Sign in as super admin, open Security, verify your password, add the displayed secret to an
authenticator as time-based SHA1 / 6 digits / 30 seconds, and confirm a current code.
Store the eight single-use recovery codes offline when shown. Enrollment, disabling and
recovery-code renewal invalidate existing sessions. Sign in again with password + current
authenticator code or one unused recovery code. A used time step cannot be replayed.
Five invalid factor attempts impose a 15-minute cooldown. Synchronize the server clock.

Secrets are encrypted with AES-256-GCM and bound to the user. Recovery codes are hashed.
The development-only fallback key is never accepted in production. There is deliberately
no unauthenticated reset endpoint. Loss of the device AND recovery codes requires a
verified operator recovery procedure and revocation of the affected user's sessions.
See [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238) and
[OWASP MFA guidance](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html).

## Automated checks and staging

`.github/workflows/verify.yml` provisions disposable PostgreSQL 16 on GitHub Actions and
runs migrations, unit tests, PostgreSQL quota/concurrency/tenant tests, isolated full-flow
tests, production build and production authentication checks. It does not deploy or require
production secrets. Configure the `verify` job as a required branch check if desired.

`npm run test:postgres` refuses non-local databases or database names not ending `_test`.
It creates generated fixtures and cleans only those fixtures. `npm run test:smoke` uses a
temporary fallback data directory and port 3012; use an isolated checkout so `.next` does
not conflict with your running development server. `SMOKE_WEBPACK=true` supports symlinked
node_modules in local test checkouts. Local fallback tests do not prove live PostgreSQL behavior.

The staging examples in `deploy/` are templates, not installed services. Review user, paths,
Node binary, TLS and Nginx includes. Staging uses port 3100, a separate service account and
database ending `_staging`, private runtime/uploads, Basic Auth and noindex. Calendar sync
is disabled unless explicitly configured with staging sources. Never reuse production
database credentials, writable volumes, schedules or MFA/session keys. `release:check`
validates configuration only; it does not verify DNS, backups or perform MFA enrollment.
