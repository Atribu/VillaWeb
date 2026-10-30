const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTsWithMocks } = require('./load-ts.cjs');

function fixture() {
  let state = { villas: [
    { id: 'a', companyId: 'one', slug: 'a', status: 'ACTIVE', coverImageUrl: '/a.webp', images: [{ url: '/a.webp', isCover: true, sortOrder: 1 }, { url: '/b.webp', isCover: false, sortOrder: 2 }] },
    { id: 'b', companyId: 'two', slug: 'b', status: 'ACTIVE', images: [] },
  ], logs: [] };
  let failAudit = false;
  const db = { $transaction: async (work, options) => {
    assert.equal(options.isolationLevel, 'Serializable');
    const draft = structuredClone(state);
    const tx = {
      villa: {
        findFirst: async ({ where }) => draft.villas.find(v => v.id === where.id && (!where.companyId || v.companyId === where.companyId)),
        findMany: async ({ where }) => draft.villas.filter(v => where.id.in.includes(v.id) && (!where.companyId || v.companyId === where.companyId)),
        updateMany: async ({ where, data }) => { draft.villas.filter(v => where.id.in.includes(v.id)).forEach(v => Object.assign(v, data)); },
        update: async ({ where, data }) => Object.assign(draft.villas.find(v => v.id === where.id), data),
      },
      villaImage: {
        deleteMany: async ({ where }) => { const v = draft.villas.find(v => v.id === where.villaId); v.images = v.images.filter(image => where.url.notIn.includes(image.url)); },
        updateMany: async ({ where, data }) => { draft.villas.find(v => v.id === where.villaId).images.filter(image => image.url === where.url).forEach(image => Object.assign(image, data)); },
      },
      audit: data => { if (failAudit) throw new Error('audit write failed'); draft.logs.push(data); },
      $executeRaw: async (_sql, cover, ordering, id) => {
        const villa = draft.villas.find(v => v.id === id);
        for (const { url, sort_index } of JSON.parse(ordering)) Object.assign(villa.images.find(image => image.url === url), { sortOrder: sort_index, isCover: url === cover });
      },
    };
    const result = await work(tx);
    state = draft;
    return result;
  } };
  const tools = loadTsWithMocks('src/lib/server/panel-villa-tools.ts', {
    '@/lib/db': { db },
    '@/lib/server/demo-company-context': { resolvePanelCompanyId: async () => 'one', assertPanelCompanyAccess: async company => { assert.equal(company, 'one'); } },
    '@/lib/server/development-fallback': { withDevelopmentFallback: primary => primary() },
    '@/lib/server/development-fallback-data': {},
    '@/lib/server/fallback-booking-workflow': {},
    '@/lib/server/panel-audit': { writePanelAudit: async (input, tx) => tx.audit(input) },
  });
  return { tools, read: () => state, failAudit: () => { failAudit = true; } };
}

test('PostgreSQL bulk mutations scope every row and commit audit in the same transaction', async () => {
  const f = fixture();
  await assert.rejects(f.tools.bulkUpdateVillaStatus({ selection: [{ id: 'a', status: 'ACTIVE' }, { id: 'b', status: 'ACTIVE' }], status: 'PAUSED' }), error => error.status === 403);
  assert.equal(f.read().villas[0].status, 'ACTIVE');
  await f.tools.bulkUpdateVillaStatus({ selection: [{ id: 'a', status: 'ACTIVE' }], status: 'PAUSED' });
  assert.equal(f.read().villas[0].status, 'PAUSED');
  assert.equal(f.read().villas[1].status, 'ACTIVE');
  assert.equal(f.read().logs[0].companyId, 'one');
  f.failAudit();
  await assert.rejects(f.tools.bulkUpdateVillaStatus({ selection: [{ id: 'a', status: 'PAUSED' }], status: 'ARCHIVED' }));
  assert.equal(f.read().villas[0].status, 'PAUSED', 'Audit failure rolls back all changes');
});

test('PostgreSQL gallery rejects foreign rows and commits cover/order/removal together', async () => {
  const f = fixture();
  const change = { urls: ['/b.webp'], cover: '/b.webp', version: JSON.stringify([['/a.webp', '/b.webp'], '/a.webp']) };
  await assert.rejects(f.tools.updateVillaGallery('b', change), error => error.status === 404);
  f.failAudit();
  await assert.rejects(f.tools.updateVillaGallery('a', change));
  assert.equal(f.read().villas[0].images.length, 2);
  const good = fixture();
  await good.tools.updateVillaGallery('a', change);
  assert.deepEqual(good.read().villas[0].images, [{ url: '/b.webp', isCover: true, sortOrder: 1 }]);
  assert.equal(good.read().villas[0].coverImageUrl, '/b.webp');
  assert.equal(good.read().logs[0].action, 'GALLERY_UPDATED');
  await assert.rejects(good.tools.updateVillaGallery('a', change), error => error.status === 409);
});
