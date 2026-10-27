const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTsWithMocks } = require('./load-ts.cjs');

test('database sessions recheck live identity, revoke logout/role changes, and fail closed on database outage', async () => {
  const oldEnv = process.env.NODE_ENV, oldSecret = process.env.SESSION_SECRET;
  process.env.NODE_ENV = 'production';
  process.env.SESSION_SECRET = 'isolated-production-session-secret-123456789';
  const records = new Map();
  const member = { companyId: 'company-a', role: 'COMPANY_ADMIN', status: 'ACTIVE', company: { status: 'ACTIVE', slug: 'a', publicName: 'A' } };
  const user = { id: 'user-a', username: 'admin-a', name: 'A Admin', platformRole: 'COMPANY_USER', isActive: true, memberships: [member] };
  let unavailable = false;
  const db = { authSession: {
    async create({ data }) { records.set(data.token, data); return data; },
    async findUnique({ where }) { if (unavailable) throw Object.assign(new Error('Connection failed'), { code: 'P1001' }); const stored = records.get(where.token); return stored ? { ...stored, user } : null; },
    async deleteMany({ where }) { return { count: records.delete(where.token) ? 1 : 0 }; },
  } };
  const auth = loadTsWithMocks('src/lib/auth/session-store.ts', {
    '@/lib/db': { db },
    '@/lib/auth/development-auth': { getDevelopmentIdentity() { throw new Error('Must not use fallback in production'); } },
  });
  const identity = { id: user.id, username: user.username, displayName: user.name, role: 'ADMIN', companyId: 'company-a' };
  try {
    let session = await auth.registerSession(identity);
    assert.equal((await auth.resolveSession(session.token)).companyId, 'company-a');
    assert.ok(!records.has(session.token), 'Only token hashes are persisted');
    await auth.revokeSession(session.token);
    assert.equal(await auth.resolveSession(session.token), null);
    session = await auth.registerSession(identity);
    member.role = 'FINANCE';
    assert.equal(await auth.resolveSession(session.token), null);
    member.role = 'COMPANY_ADMIN';
    assert.equal(await auth.resolveSession(session.token), null, 'Restoring the old role does not restore the session');
    session = await auth.registerSession(identity);
    member.status = 'SUSPENDED';
    assert.equal(await auth.resolveSession(session.token), null);
    member.status = 'ACTIVE';
    session = await auth.registerSession(identity);
    member.company.status = 'PAUSED';
    assert.equal(await auth.resolveSession(session.token), null);
    member.company.status = 'ACTIVE';
    session = await auth.registerSession(identity);
    user.isActive = false;
    assert.equal(await auth.resolveSession(session.token), null);
    user.isActive = true;
    session = await auth.registerSession(identity);
    unavailable = true;
    await assert.rejects(auth.resolveSession(session.token), /Connection failed/);
  } finally {
    if (oldEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldEnv;
    if (oldSecret === undefined) delete process.env.SESSION_SECRET; else process.env.SESSION_SECRET = oldSecret;
  }
});
