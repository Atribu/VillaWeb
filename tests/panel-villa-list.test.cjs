const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');
const { seedVillaCatalog } = loadTs('src/lib/villa-catalog.ts');
const { selectPanelVillas, getVillaPublicationWarnings } = loadTs('src/lib/panel-villa-list.ts');
const make = (values = {}) => ({ ...seedVillaCatalog[0], title: 'Villa Bir', shortCode: 'KISA-1', city: 'Bodrum', district: 'Yalikavak', nightlyPrice: 1000, discountedNightlyPrice: undefined, status: 'ACTIVE', ...values });

test('panel search combines name/code, location, status and review without mutating the catalog', () => {
  const villas = [make(), make({ shortCode: 'KISA-2', status: 'PAUSED', nightlyPrice: 300 }), make({ city: 'Kas', district: 'Merkez' })];
  const snapshot = JSON.stringify(villas);
  assert.equal(selectPanelVillas(villas, { q: 'kısa-2', location: 'Bodrum', status: 'PAUSED' }).total, 1);
  assert.equal(selectPanelVillas(villas, { location: 'Yalikavak', status: 'ACTIVE' }).total, 1);
  assert.equal(selectPanelVillas(villas, { q: 'nonexistent' }).total, 0);
  assert.equal(selectPanelVillas(villas, { sort: 'price-asc' }).visible[0].nightlyPrice, 300);
  assert.equal(JSON.stringify(villas), snapshot);
});

test('sorting uses discounted prices and safely clamps invalid pages', () => {
  const villas = Array.from({ length: 26 }, (_, i) => make({ title: `Villa ${i}`, nightlyPrice: i + 100 }));
  villas[25].discountedNightlyPrice = 50;
  assert.equal(selectPanelVillas(villas, { sort: 'price-asc' }).visible[0].title, 'Villa 25');
  assert.equal(selectPanelVillas(villas, { page: '99' }).visible.length, 2);
  for (const page of ['NaN', '-10', 'Infinity', '0', '']) assert.equal(selectPanelVillas(villas, { page }).page, 1);
  assert.equal(selectPanelVillas([], { page: '99' }).pageCount, 1);
});

test('publication reminders are advisory and match the review filter', () => {
  const complete = make({ imageCount: 2, titleEn: 'Villa One', descriptionEn: 'Details', tourismLicenseNumber: '48-100' });
  assert.deepEqual(getVillaPublicationWarnings(complete), []);
  const missing = make({ imageCount: 0, nightlyPrice: 0, titleEn: '', tourismLicenseNumber: '' });
  assert.equal(getVillaPublicationWarnings(missing).length, 4);
  assert.equal(selectPanelVillas([complete, missing], { review: '1' }).total, 1);
  assert.equal(missing.status, 'ACTIVE');
});
