const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHmac, randomUUID } = require('node:crypto');

module.exports = async function securitySmoke({ call, cookie, base, companyId, other, villa, secret }) {
  async function walk(dir) { const results = []; for (const entry of await fs.readdir(dir, { withFileTypes: true })) { const file = path.join(dir, entry.name); results.push(...(entry.isDirectory() ? await walk(file) : [file])); } return results; }
  let checked = 0;
  for (const file of (await walk(path.join(__dirname, '../src/app/api/demo'))).filter(file => file.endsWith('/route.ts'))) {
    const route = '/api/demo/' + path.relative(path.join(__dirname, '../src/app/api/demo'), file).replace(/\/route.ts$/, '').replace(/^route.ts$/, '').replace(/\[[^\]]+\]/g, 'missing');
    if (route === '/api/demo/requests' || route === '/api/demo/coupons/validate') continue;
    const source = await fs.readFile(file, 'utf8');
    for (const [, method] of source.matchAll(/export async function (POST|PUT|PATCH|DELETE)\(/g)) {
      const response = await call(route, {}, method, '');
      assert.equal(response.status, 401, `${method} ${route}: ${response.text}`);
      if (!route.startsWith('/api/demo/villas')) assert.equal((await call(route, {}, method, cookie('STAFF'))).status, 403, `${method} ${route}`);
      checked++;
    }
  }
  const route = '/api/demo/settings/payment-methods';
  const login = await call('/panel/giris', undefined, 'GET', '');
  assert.equal(login.status, 200);
  // Development RSC debug traces contain server function source; production is checked separately.
  assert.doesNotMatch(login.text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ''), /VillaAdmin2026|SahilAdmin2026|taxNumber|"passwordHash"/);
  assert.equal((await call(route, {}, 'POST', 'villaweb_session=malformed.bad.token')).status, 401);
  const body = Buffer.from(JSON.stringify({ id: `test-ADMIN-${companyId}`, username: 'test', displayName: 'Test', role: 'ADMIN', companyId,
    sessionId: randomUUID(), expiresAt: Date.now() + 3600000 })).toString('base64url');
  const unregistered = `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
  assert.equal((await call(route, {}, 'POST', `villaweb_session=${unregistered}`)).status, 401);
  assert.equal((await fetch(base + route, { method: 'POST', headers: { Cookie: cookie('ADMIN'), Origin: 'https://untrusted.invalid', 'Content-Type': 'application/json' }, body: '{}' })).status, 403);
  assert.equal((await call('/api/demo/requests', { origin: 'MANUAL_PANEL' }, 'POST', '')).status, 401);

  const staffPath = `/api/demo/users-messages/users/test-STAFF-${companyId}`;
  assert.equal((await call(staffPath, { roleId: 'ADMIN' }, 'PATCH', cookie('STAFF'))).status, 403);
  const contentId = `test-CONTENT-${companyId}`;
  const contentPath = `/api/demo/users-messages/users/${contentId}`;
  assert.equal((await call(contentPath, { roleId: 'ADMIN' }, 'PATCH', cookie('ADMIN', other.companyId))).status, 403);
  assert.equal((await call(contentPath, { status: 'PASSIVE' }, 'PATCH', cookie('ADMIN'))).status, 200);
  assert.equal((await call(`/api/demo/villas/${villa.slug}`, {}, 'PATCH', cookie('CONTENT'))).status, 401);
  assert.equal((await call(contentPath, { status: 'ACTIVE' }, 'PATCH', cookie('ADMIN'))).status, 200);
  assert.equal((await call(`/api/demo/villas/${villa.slug}`, {}, 'PATCH', cookie('CONTENT'))).status, 401, 'Reactivation must not resurrect revoked sessions');
  const crmPath = `/api/demo/users-messages/users/test-CRM-${companyId}`;
  assert.equal((await call(crmPath, { roleId: 'SALES' }, 'PATCH', cookie('ADMIN'))).status, 200);
  assert.equal((await call('/api/demo/coupons', {}, 'POST', cookie('CRM'))).status, 401);
  for (const [role, pathname] of [['FINANCE', '/panel/muhasebe'], ['SALES', '/panel/talepler'], ['OPERATIONS', '/panel/takip-operasyon/ev-operasyon']]) {
    assert.equal((await fetch(base + pathname, { headers: { Cookie: cookie(role) }, redirect: 'manual' })).status, 200, role);
  }
  assert.equal((await fetch(base + '/panel/personel', { headers: { Cookie: cookie('STAFF') }, redirect: 'manual' })).status, 307);
  const visible = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const publicPage = await call('/villalar?company=sahil-collection', undefined, 'GET', cookie('ADMIN'));
  assert.match(visible(publicPage.text), /other-company-test/);
  assert.doesNotMatch(visible(publicPage.text), new RegExp(`/villalar/${villa.slug}`));
  const detail = await call(`/villalar/${other.slug}?company=sahil-collection`, undefined, 'GET', cookie('ADMIN'));
  assert.equal(detail.status, 200);
  const pastRequest = await call('/api/demo/requests?company=villavera', { villaSlug: villa.slug, checkIn: '2000-01-01', checkOut: '2000-01-08' }, 'POST', '');
  assert.equal(pastRequest.status, 400);
  assert.match(pastRequest.json.error, /Gecmis/);
  console.log(`PASS security: ${checked} guarded handlers, CSRF, role escalation, tenant isolation, session revocation, public scope and past dates`);
};
