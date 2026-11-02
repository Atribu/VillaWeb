const { test } = require('node:test');
const assert = require('node:assert/strict');

test('release preflight rejects placeholders, shared secrets, fallback and live database in staging', async () => {
  const { validateRelease } = await import('../scripts/check-release.mjs');
  const env = { APP_ENV: 'staging', APP_URL: 'https://staging.example.test', DATABASE_URL: 'postgresql://test:test@localhost/villaweb_staging',
    SESSION_SECRET: '1'.repeat(64), ICAL_SIGNING_SECRET: '2'.repeat(64), MFA_ENCRYPTION_KEY: '3'.repeat(64), DEV_FALLBACK_MODE: 'false' };
  assert.equal(validateRelease(env).length, 0);
  for (const patch of [{ APP_ENV: 'development' }, { APP_URL: 'http://localhost' }, { DATABASE_URL: 'postgresql://test:test@localhost/villaweb' },
    { SESSION_SECRET: 'REPLACE_WITH_SEPARATE_RANDOM_SECRET' }, { MFA_ENCRYPTION_KEY: env.SESSION_SECRET }, { MFA_ENCRYPTION_KEY: '' }, { DEV_FALLBACK_MODE: 'true' }]) assert.ok(validateRelease({ ...env, ...patch }).length);
});
