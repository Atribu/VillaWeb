const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');
const { getPublicCampaigns } = loadTs('src/lib/public-campaigns.ts');

const villas = [
  { slug: 'published', companyId: 'a', status: 'ACTIVE' },
  { slug: 'draft', companyId: 'a', status: 'DRAFT' },
  { slug: 'foreign', companyId: 'b', status: 'ACTIVE' },
];
const offer = { id: 'offer', companyId: 'a', title: 'Summer offer', villaScope: 'ALL', percentOff: 15,
  startDate: '2027-06-01', endDate: '2027-06-30', active: true, note: 'PRIVATE_NOTE', createdAt: '2026-01-01' };
const select = (offers, company = 'a', today = '2027-05-01') => getPublicCampaigns(offers, villas, company, today);

test('public offers include future stay periods and omit internal fields', () => {
  const results = select([offer]);
  assert.equal(results.length, 1);
  assert.equal(results[0].percentOff, 15);
  assert.equal(results[0].note, undefined);
  assert.equal(results[0].companyId, undefined);
  assert.equal(results[0].createdAt, undefined);
  assert.equal(select([offer], 'a', '2027-06-15').length, 1);
  assert.equal(select([offer], 'a', '2027-06-30').length, 0);
});

test('public offers stay scoped to the company and active villas', () => {
  assert.equal(select([{ ...offer, companyId: 'b' }]).length, 0);
  assert.equal(select([{ ...offer, villaScope: 'foreign' }]).length, 0);
  assert.equal(select([{ ...offer, villaScope: 'draft' }]).length, 0);
  assert.equal(select([{ ...offer, villaScope: 'missing' }]).length, 0);
  assert.equal(select([{ ...offer, villaScope: 'published' }]).length, 1);
  assert.equal(getPublicCampaigns([offer], [], 'a', '2027-05-01').length, 0);
});

test('public offers reject expired, inactive and malformed campaign data', () => {
  for (const overrides of [
    { active: false }, { startDate: '2026-01-01', endDate: '2026-12-31' },
    { startDate: 'bad' }, { endDate: '2027-02-30' }, { endDate: '2027-05-01' },
    { endDate: '2027-06-01' }, { percentOff: 0 }, { percentOff: -10 },
    { percentOff: 101 }, { percentOff: NaN },
  ]) assert.equal(select([{ ...offer, ...overrides }]).length, 0, JSON.stringify(overrides));
  assert.equal(select([offer], '').length, 0);
  assert.equal(select([offer], 'a', 'invalid').length, 0);
});

test('public offers sort by stay period then discount without mutating input', () => {
  const input = [{ ...offer, id: 'later', startDate: '2027-06-10' }, offer, { ...offer, id: 'larger', percentOff: 20 }];
  assert.deepEqual(select(input).map(item => item.id), ['larger', 'offer', 'later']);
  assert.equal(input[0].id, 'later');
});
