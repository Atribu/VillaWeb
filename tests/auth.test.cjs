const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHmac, scryptSync } = require('node:crypto');
const { loadTs } = require('./load-ts.cjs');
const { hashPassword, verifyPassword } = loadTs('src/lib/auth/password.ts');
const { hasPermission, appRoles } = loadTs('src/lib/auth/permissions.ts');
const { canAccessPanelPath, getPanelNavigation, getPanelHomePath } = loadTs('src/lib/auth/panel-access.ts');
const { createSessionToken, readSessionToken } = loadTs('src/lib/auth/session.ts');

test('password verification accepts old colon-containing salts and new hashes', () => {
  const password = 'only-a-test-password';
  const salt = 'old-username:abcd';
  assert.equal(verifyPassword(`scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`, password), true);
  const hash = hashPassword(password);
  assert.equal(verifyPassword(hash, password), true);
  assert.equal(verifyPassword(hash, 'wrong'), false);
  assert.equal(verifyPassword('scrypt:bad:invalid', password), false);
  assert.notEqual(hash, hashPassword(password));
});

test('permissions, navigation and landing pages use the same least-privilege matrix', () => {
  assert.equal(canAccessPanelPath('ADMIN', '/panel/firmalar'), false);
  assert.equal(canAccessPanelPath('ADMIN', '/panel/unknown-module'), false);
  assert.equal(hasPermission('STAFF', 'users'), false);
  assert.equal(hasPermission('FINANCE', 'finance'), true);
  assert.equal(hasPermission('FINANCE', 'villas'), false);
  assert.equal(hasPermission('OPERATIONS', 'operations'), true);
  for (const role of appRoles) {
    assert.equal(canAccessPanelPath(role, getPanelHomePath(role)), true, role);
    for (const entry of getPanelNavigation(role)) {
      for (const link of entry.type === 'link' ? [entry] : entry.items) assert.equal(canAccessPanelPath(role, link.href), true);
    }
  }
});

test('tokens reject corruption, expired/malformed claims and legacy cookies; production needs a secret', async () => {
  const previousSecret = process.env.SESSION_SECRET;
  const previousEnv = process.env.NODE_ENV;
  process.env.SESSION_SECRET = 'test-secret-with-more-than-thirty-two-characters';
  try {
    const user = { id: 'test-user', username: 'test', displayName: 'Test', role: 'ADMIN', companyId: 'company-a' };
    const token = await createSessionToken(user);
    assert.equal((await readSessionToken(token)).id, user.id);
    assert.notEqual(token, await createSessionToken(user));
    for (const bad of ['', '!', 'a.b.c', 'a.b', token + '.extra', 'x'.repeat(5000)]) assert.equal(await readSessionToken(bad), null);
    function sign(value) { const body = Buffer.from(JSON.stringify(value)).toString('base64url'); return `${body}.${createHmac('sha256', process.env.SESSION_SECRET).update(body).digest('base64url')}`; }
    for (const invalid of [{ ...user, expiresAt: Date.now() + 10000 }, { ...user, sessionId: 'a', expiresAt: 1 }, { ...user, sessionId: 'a', expiresAt: Date.now() + 10000, role: 'OTHER' }]) {
      assert.equal(await readSessionToken(sign(invalid)), null);
    }
    process.env.NODE_ENV = 'production';
    delete process.env.SESSION_SECRET;
    await assert.rejects(createSessionToken(user), /SESSION_SECRET/);
    process.env.SESSION_SECRET = 'short';
    await assert.rejects(createSessionToken(user), /SESSION_SECRET/);
  } finally {
    if (previousSecret === undefined) delete process.env.SESSION_SECRET; else process.env.SESSION_SECRET = previousSecret;
    if (previousEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousEnv;
  }
});

test('every management API handler has an authorization guard before parsing input', () => {
  function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]); }
  for (const file of ['demo', 'panel'].flatMap(root => walk(path.join(__dirname, '../src/app/api', root))).filter(file => file.endsWith('route.ts'))) {
    if (file.endsWith('/requests/route.ts') || file.endsWith('/coupons/validate/route.ts')) continue;
    const source = fs.readFileSync(file, 'utf8');
    const handlers = source.split(/export async function (?:POST|PUT|PATCH|DELETE)\([^\n]+\{/).slice(1);
    for (const handler of handlers) assert.match(handler, /^\s*const denied = await authorizePanelApi\([^\n]+\);\s*if \(denied\) return denied;/, file);
  }
});

test('finance uses the current Istanbul day, not the demo reference date', () => {
  const { todayInTurkey } = loadTs('src/lib/booking-dates.ts');
  const { getPaymentDisplayStatus } = loadTs('src/lib/demo-finance.ts');
  assert.equal(todayInTurkey(new Date('2026-10-26T22:00:00Z')), '2026-10-27');
  assert.equal(getPaymentDisplayStatus({ status: 'PENDING', dueDate: '2000-01-01' }), 'OVERDUE');
  assert.equal(getPaymentDisplayStatus({ status: 'PENDING', dueDate: todayInTurkey() }), 'PENDING');
  assert.equal(getPaymentDisplayStatus({ status: 'PAID', dueDate: '2000-01-01' }), 'PAID');
});
