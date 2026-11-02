/* Destructive only to its own generated fixtures; refuses non-local/non-test databases. */
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('node:crypto');
const { loadTsWithMocks } = require('./load-ts.cjs');
const url = new URL(process.env.DATABASE_URL || 'http://invalid');
if (!['localhost', '127.0.0.1', 'postgres'].includes(url.hostname) || !url.pathname.endsWith('_test')) throw new Error('test:postgres requires a local *_test database.');
process.env.DEV_FALLBACK_MODE = 'false';
process.env.NODE_ENV = 'production';
const db = new PrismaClient();
const prefix = `integration-${randomUUID()}`;
const a = `${prefix}-a`, b = `${prefix}-b`;
let actor = { id: `${prefix}-admin`, role: 'SUPER_ADMIN' };
const mocks = {
  '@/lib/db': { db }, '@/lib/auth/server-session': { getUserSession: async () => actor },
  '@/lib/server/demo-company-context': { assertPanelCompanyAccess: async id => { if (actor.role !== 'SUPER_ADMIN' && actor.companyId !== id) throw new Error('Forbidden company'); }, assertSuperAdminPanelAccess: async () => { if (actor.role !== 'SUPER_ADMIN') throw new Error('Forbidden'); } },
  '@/lib/server/panel-work-records': { requirePanelPermission: async () => actor },
  '@/lib/server/panel-audit': { writePanelAudit: async () => {} },
};
const platform = loadTsWithMocks('src/lib/server/company-platform.ts', mocks);
const workflow = loadTsWithMocks('src/lib/server/booking-workflow.ts', mocks);
async function main() {
  try {
    await db.company.createMany({ data: [{ id: a, slug: a, legalName: 'Test A', publicName: 'Test A' }, { id: b, slug: b, legalName: 'Test B', publicName: 'Test B' }] });
    await platform.saveCompanyPackage(a, 0, { name: 'Test limit', users: 1, activeVillas: 1, modules: ['reservations', 'sharing'] });
    const create = id => db.$transaction(async tx => {
      await platform.assertCompanyCapacity(a, 'activeVillas', tx);
      return tx.villa.create({ data: { id, companyId: a, slug: id, title: id, description: 'Test', city: 'Test', capacity: 4, bedroomCount: 2, bathroomCount: 1, nightlyBasePrice: 1000, status: 'ACTIVE' } });
    });
    const results = await Promise.allSettled([create(`${prefix}-v1`), create(`${prefix}-v2`)]);
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1, 'Concurrent publication cannot exceed quota');
    const villa = results.find(r => r.status === 'fulfilled').value;
    actor = { id: 'member-a', role: 'ADMIN', companyId: a };
    await assert.rejects(platform.changePlatformConfig(b, 0, async current => current));
    actor = { id: 'platform-owner', role: 'SUPER_ADMIN' };
    const share = await db.villaShare.create({ data: { sourceCompanyId: a, recipientCompanyId: b, villaId: villa.id, state: 'ACTIVE', nightlyPrice: 1200, commissionPercent: 10, acceptedAt: new Date() } });
    const pricing = { nightCount: 3, subtotal: 3600, activeDiscountTotal: 0, couponDiscountTotal: 0, cleaningFee: 0, grandTotal: 3600 };
    const requests = [];
    for (const companyId of [a, b]) {
      const row = await db.bookingRequest.create({ data: { companyId, villaId: villa.id, fullName: `Private ${companyId}`, phone: '5550000000', guestCount: 2, checkIn: new Date('2030-06-01'), checkOut: new Date('2030-06-04'),
        quotedTotalAmount: 3600, pricingSnapshot: pricing, ...(companyId === b ? { portfolioShareId: share.id, portfolioShareVersion: share.version, portfolioCommission: 360 } : {}) } });
      requests.push({ ...row, villaSlug: villa.slug, villaTitle: villa.title, checkIn: '2030-06-01', checkOut: '2030-06-04', pricing });
    }
    const approvals = await Promise.allSettled(requests.map(request => db.$transaction(tx => workflow.applyBookingStatus(tx, request, 'APPROVED'), { timeout: 15000 })));
    assert.equal(approvals.filter(r => r.status === 'fulfilled').length, 1, 'Owner and partner cannot double-book a villa');
    assert.equal(await db.villaAvailabilityBlock.count({ where: { villaId: villa.id } }), 1);
    assert.equal(await db.bookingRequest.count({ where: { companyId: a } }), 1);
    assert.equal(await db.bookingRequest.count({ where: { companyId: b } }), 1);
    await db.funnelVisit.createMany({ skipDuplicates: true, data: Array.from({ length: 2 }, () => ({ companyId: a, villaId: villa.id, sessionHash: 'same', day: '2030-01-01', source: 'DIRECT' })) });
    assert.equal(await db.funnelVisit.count({ where: { companyId: a } }), 1);
    console.log('PASS PostgreSQL migrations, tenant denial, concurrent package quota, owner/partner booking overlap and visit deduplication');
  } finally {
    await db.bookingRequest.deleteMany({ where: { companyId: { in: [a, b] } } });
    await db.villaShare.deleteMany({ where: { sourceCompanyId: a } });
    await db.funnelVisit.deleteMany({ where: { companyId: { in: [a, b] } } });
    await db.company.deleteMany({ where: { id: { in: [a, b] } } });
    await db.$disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
