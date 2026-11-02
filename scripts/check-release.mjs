import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd());

export function validateRelease(env) {
  const errors = [];
  if (!['staging', 'production'].includes(env.APP_ENV)) errors.push('APP_ENV must be staging or production.');
  if (['true', '1', 'yes', 'on'].includes((env.DEV_FALLBACK_MODE || '').toLowerCase())) errors.push('Disable DEV_FALLBACK_MODE.');
  for (const name of ['SESSION_SECRET', 'ICAL_SIGNING_SECRET']) if (!env[name] || env[name].length < 32 || /change-me|local-secret|example|replace/i.test(env[name])) errors.push(`${name} must be a unique secret of at least 32 characters.`);
  if (!/^[a-f0-9]{64}$/i.test(env.MFA_ENCRYPTION_KEY || '')) errors.push('MFA_ENCRYPTION_KEY must be a separate 32-byte hex key.');
  if (env.MFA_ENCRYPTION_KEY === env.SESSION_SECRET || env.MFA_ENCRYPTION_KEY === env.ICAL_SIGNING_SECRET || env.SESSION_SECRET === env.ICAL_SIGNING_SECRET) errors.push('Use distinct session, iCal and MFA secrets.');
  try {
    const url = new URL(env.DATABASE_URL);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.pathname.slice(1)) errors.push('Use a named PostgreSQL database.');
    if (env.APP_ENV === 'staging' && !decodeURIComponent(url.pathname).endsWith('_staging')) errors.push('Staging database name must end with _staging. Never use the live database.');
  } catch { errors.push('DATABASE_URL is missing or invalid.'); }
  try { if (new URL(env.APP_URL).protocol !== 'https:') errors.push('APP_URL must use HTTPS.'); } catch { errors.push('APP_URL is invalid.'); }
  return errors;
}
if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  const errors = validateRelease(process.env);
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('Release configuration checks passed. DNS, TLS, backups and MFA enrollment still require operator verification.');
}
