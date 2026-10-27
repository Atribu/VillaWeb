const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createHmac, randomUUID } = require('node:crypto');
const path = require('node:path');

async function main() {
  const port = process.env.PRODUCTION_SMOKE_PORT || '3013';
  const base = `http://localhost:${port}`;
  const secret = 'isolated-production-auth-secret-more-than-32';
  const calendarSecret = 'isolated-production-calendar-secret-more-than-32';
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', port], {
    cwd: path.resolve(__dirname, '..'), env: { ...process.env, NODE_ENV: 'production', SESSION_SECRET: secret, CALENDAR_SYNC_SECRET: calendarSecret,
      DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test?connect_timeout=1', DEV_FALLBACK_MODE: 'true', SHOW_DEMO_LOGIN_HINTS: 'true',
      SEED_VILLAVERA_ADMIN_USERNAME: 'PRIVATE_LOGIN_MARKER', SEED_VILLAVERA_ADMIN_PASSWORD: 'PRIVATE_PASSWORD_MARKER' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  server.stdout.on('data', chunk => { output += chunk; });
  server.stderr.on('data', chunk => { output += chunk; });
  try {
    for (let i = 0; i < 80 && !output.includes('Ready in'); i++) {
      if (server.exitCode !== null) throw new Error('Production server failed to start.');
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    const login = await fetch(base + '/panel/giris');
    assert.equal(login.status, 200);
    const html = await login.text();
    assert.doesNotMatch(html, /PRIVATE_LOGIN_MARKER|PRIVATE_PASSWORD_MARKER|taxNumber|passwordHash|VillaAdmin2026|SahilAdmin2026/);
    assert.match(html, /noindex/);
    assert.equal((await fetch(base + '/api/demo/settings/defaults', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401);
    const body = Buffer.from(JSON.stringify({ id: 'test', username: 'test', displayName: 'Test', role: 'ADMIN', companyId: 'test-company',
      sessionId: randomUUID(), expiresAt: Date.now() + 3600000 })).toString('base64url');
    const token = `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
    const unavailable = await fetch(base + '/api/demo/settings/defaults', { method: 'PATCH', headers: { Cookie: `villaweb_session=${token}`, 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(unavailable.status, 503, 'Production must not fall back to demo identities on database failure');
    assert.doesNotMatch(await unavailable.text(), /DATABASE_URL|postgresql:|Prisma|stack/);
    assert.equal((await fetch(base + '/api/internal/calendar-sync', { method: 'POST' })).status, 401);
    const cron = await fetch(base + '/api/internal/calendar-sync', { method: 'POST', headers: { Authorization: `Bearer ${calendarSecret}` } });
    assert.equal(cron.status, 503, 'A production scheduler must not import into JSON on database failure');
    assert.doesNotMatch(await cron.text(), /DATABASE_URL|postgresql:|Prisma|stack/);
    console.log('PASS production auth: no credentials/company data in HTML, anonymous writes denied, database failure fails closed despite fallback flags');
  } finally {
    server.kill('SIGTERM');
    await new Promise(resolve => { if (server.exitCode !== null) return resolve(); server.once('exit', resolve); });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
