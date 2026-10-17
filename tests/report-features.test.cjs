const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');
const { seedVillaCatalog } = loadTs('src/lib/villa-catalog.ts');
const { getResolvedStayPricing, getMinimumNightCountForStay } = loadTs('src/lib/demo-operations.ts');
const { validatePricingPeriod } = loadTs('src/lib/villa-pricing-periods.ts');
const { findBlockedRange, isBlockedStayDate } = loadTs('src/lib/villa-availability.ts');
const { buildCalendar } = loadTs('src/lib/ical-calendar.ts');
const { toPublicVilla } = loadTs('src/lib/public-villa.ts');
const villa = { ...seedVillaCatalog[0], nightlyPrice: 1000, cleaningFee: 250, minNightCount: 7,
  pricingPeriods: [{ id: 'summer', title: 'Summer', startDate: '2027-07-01', endDate: '2027-07-31', nightlyPrice: 2000, cleaningFee: 0, minNightCount: 2, active: true }] };

test('season boundaries charge occupied nights and preserve explicit zero cleaning fees', () => {
  const { pricing } = getResolvedStayPricing({ villa, pricingRecords: [], discounts: [], coupons: [], checkIn: '2027-07-30', checkOut: '2027-08-02' });
  assert.equal(pricing.subtotal, 5000);
  assert.equal(pricing.cleaningFee, 0);
  assert.equal(pricing.grandTotal, 5000);
});
test('season minimum replaces base minimum; mixed stays enforce the strongest applicable minimum', () => {
  assert.equal(getMinimumNightCountForStay(villa, '2027-07-10', '2027-07-12'), 2);
  assert.equal(getMinimumNightCountForStay(villa, '2027-07-30', '2027-08-02'), 7);
});
test('pricing periods reject overlap and impossible dates but allow editing oneself and disabling a period', () => {
  const period = villa.pricingPeriods[0];
  assert.doesNotThrow(() => validatePricingPeriod(period, [period]));
  assert.throws(() => validatePricingPeriod({ ...period, id: undefined }, [period]), /cakismasi/);
  assert.doesNotThrow(() => validatePricingPeriod({ ...period, id: undefined, active: false }, [period]));
  assert.throws(() => validatePricingPeriod({ ...period, startDate: '2027-02-30' }, [period]), /tarih/);
  assert.throws(() => validatePricingPeriod({ ...period, minNightCount: 1.5 }, [period]), /tam sayi/);
});
test('availability blocks occupied nights, permits checkout boundary and next arrival', () => {
  const ranges = [{ id: 'block', startDate: '2027-07-01', endDate: '2027-07-04', status: 'RESERVED', label: 'Private' }];
  assert.ok(isBlockedStayDate('2027-07-03', ranges));
  assert.equal(isBlockedStayDate('2027-07-04', ranges), false);
  assert.ok(findBlockedRange('2027-07-03', '2027-07-05', ranges));
  assert.equal(findBlockedRange('2027-07-04', '2027-07-05', ranges), null);
  assert.equal(findBlockedRange('2027-06-30', '2027-07-01', ranges), null);
});
test('iCal uses UTC timestamps, exclusive end and UTF-8-safe folding', () => {
  const calendar = buildCalendar({ companyId: 'test', title: 'Şirin villa '.repeat(20), events: [{ id: '1', startDate: '2027-07-01', endDate: '2027-07-04', summary: 'Dolu', updatedAt: new Date('2026-10-17T12:30:20.123Z') }] });
  assert.match(calendar, /DTSTAMP:20261017T123020Z/);
  assert.match(calendar, /DTEND;VALUE=DATE:20270704/);
  for (const line of calendar.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75);
  assert.ok(calendar.replace(/\r\n /g, '').includes('Şirin villa '.repeat(20)));
});
test('public data excludes supplier contacts, internal notes and booking identity', () => {
  const record = { ...villa, supplierName: 'Private Supplier', supplierPhone: '555', supplierEmail: 'private@example.test', supplierNotes: 'Secret', ownerVillaName: 'Private home', availabilityRanges: [{ id: 'x', startDate: '2027-01-01', endDate: '2027-01-03', status: 'RESERVED', label: 'Guest Private', sourceRequestId: 'request-secret' }] };
  const value = JSON.stringify(toPublicVilla(record));
  assert.doesNotMatch(value, /Private|private@example|Secret|request-secret|supplierName|ownerVillaName/);
  assert.equal(record.supplierName, 'Private Supplier');
});
