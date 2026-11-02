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
const setStatus = (request, status) => db.$transaction(tx => workflow.applyBookingStatus(tx, request, status), { timeout: 15000 });

async function assertApprovedBooking(request) {
  const saved = await db.bookingRequest.findUniqueOrThrow({ where: { id: request.id } });
  assert.equal(saved.status, 'APPROVED');
  const blocks = await db.villaAvailabilityBlock.findMany({ where: { sourceRequestId: request.id } });
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].startsAt.toISOString().slice(0, 10), request.checkIn);
  assert.equal(blocks[0].endsAt.toISOString().slice(0, 10), request.checkOut);
  if (request.portfolioShareId) assert.equal(blocks[0].note, 'İş ortağı rezervasyonu');
  const tasks = await db.operationTask.findMany({ where: { bookingRequestId: request.id } });
  assert.equal(tasks.length, 6, 'Approval creates each operation task exactly once');
  assert.ok(tasks.every(task => task.companyId === request.companyId));
  assert.equal(tasks.find(task => task.taskType === 'RESERVATION_TRACK').scheduledAt.toISOString().slice(0, 10), request.createdAt.slice(0, 10));
  const invoice = await db.invoice.findUniqueOrThrow({ where: { bookingRequestId: request.id }, include: { payments: true } });
  assert.equal(invoice.companyId, request.companyId);
  assert.equal(Number(invoice.totalAmount), request.pricing.grandTotal);
  assert.equal(invoice.payments.length, 1);
  assert.equal(invoice.payments[0].companyId, request.companyId);
  assert.equal(Number(invoice.payments[0].amount), request.pricing.grandTotal);
  assert.equal(await db.bookingRequestStatusHistory.count({ where: { bookingRequestId: request.id } }), 1);
}

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
      // Match the application's Prisma-to-DemoRequest date serialization.
      requests.push({ ...row, createdAt: row.createdAt.toISOString(), villaSlug: villa.slug, villaTitle: villa.title, checkIn: '2030-06-01', checkOut: '2030-06-04', pricing });
    }
    const approvals = await Promise.allSettled(requests.map(request => setStatus(request, 'APPROVED')));
    // A failed transaction is not necessarily the expected availability conflict.
    const unexpectedFailures = approvals.flatMap(result => result.status === 'rejected'
      && !(result.reason instanceof workflow.BookingWorkflowError) ? [result.reason] : []);
    if (unexpectedFailures.length) throw new AggregateError(unexpectedFailures, 'Unexpected booking approval failures');
    assert.equal(approvals.filter(r => r.status === 'fulfilled').length, 1, 'Owner and partner cannot double-book a villa');
    assert.equal(approvals.find(r => r.status === 'rejected').reason.message, 'Secilen tarihler dolu. Rezervasyon onaylanamadi.');
    assert.equal(await db.villaAvailabilityBlock.count({ where: { villaId: villa.id } }), 1);
    assert.equal(await db.bookingRequest.count({ where: { companyId: a } }), 1);
    assert.equal(await db.bookingRequest.count({ where: { companyId: b } }), 1);
    const winner = requests[approvals.findIndex(result => result.status === 'fulfilled')];
    const loser = requests[approvals.findIndex(result => result.status === 'rejected')];
    await assertApprovedBooking(winner);
    assert.equal((await db.bookingRequest.findUniqueOrThrow({ where: { id: loser.id } })).status, 'NEW');
    for (const model of [db.operationTask, db.invoice, db.payment, db.bookingRequestStatusHistory]) {
      assert.equal(await model.count({ where: { bookingRequestId: loser.id } }), 0, 'Rejected approval leaves no partial records');
    }
    await setStatus(winner, 'APPROVED');
    await assertApprovedBooking(winner);
    // Exercise both owner and partner success paths, regardless of who won the race.
    await setStatus(winner, 'CANCELLED');
    assert.equal(await db.villaAvailabilityBlock.count({ where: { villaId: villa.id } }), 0);
    assert.equal(await db.operationTask.count({ where: { bookingRequestId: winner.id } }), 0);
    await setStatus(loser, 'APPROVED');
    await assertApprovedBooking(loser);
    assert.equal(await db.villaAvailabilityBlock.count({ where: { villaId: villa.id } }), 1);
    await db.funnelVisit.createMany({ skipDuplicates: true, data: Array.from({ length: 2 }, () => ({ companyId: a, villaId: villa.id, sessionHash: 'same', day: '2030-01-01', source: 'DIRECT' })) });
    assert.equal(await db.funnelVisit.count({ where: { companyId: a } }), 1);
    console.log('PASS PostgreSQL tenant denial, concurrent package quota, owner/partner approval, overlap rejection, atomic side effects, idempotency, cancellation and visit deduplication');
  } finally {
    await db.bookingRequest.deleteMany({ where: { companyId: { in: [a, b] } } });
    await db.villaShare.deleteMany({ where: { sourceCompanyId: a } });
    await db.funnelVisit.deleteMany({ where: { companyId: { in: [a, b] } } });
    await db.company.deleteMany({ where: { id: { in: [a, b] } } });
    await db.$disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
