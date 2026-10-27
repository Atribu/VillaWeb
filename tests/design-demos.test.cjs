const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');
const { filterDemoVillas, isValidStay, isConcept, villas } = loadTs('src/components/design-demos/demo-data.ts');
const all = { location: '', guests: 1, category: 'Tüm villalar', savedOnly: false };

test('design demos expose exactly the three known concepts', () => {
  for (const concept of ['kiyi', 'rota', 'secki']) assert.equal(isConcept(concept), true);
  assert.equal(isConcept('unknown'), false);
});

test('demo filters combine location, capacity, collection and favorites', () => {
  assert.equal(filterDemoVillas(all, []).length, villas.length);
  assert.deepEqual(filterDemoVillas({ ...all, location: 'Bodrum', guests: 8 }, []).map(v => v.id), ['luma']);
  assert.equal(filterDemoVillas({ ...all, location: 'Fethiye', guests: 8 }, []).length, 0);
  assert.deepEqual(filterDemoVillas({ ...all, category: 'Balayı' }, []).map(v => v.id), ['oliva']);
  assert.deepEqual(filterDemoVillas({ ...all, savedOnly: true }, ['mavi']).map(v => v.id), ['mavi']);
  assert.equal(filterDemoVillas({ ...all, savedOnly: true }, []).length, 0);
});

test('demo stay validation rejects missing, past, reversed and impossible dates', () => {
  const today = '2027-01-01';
  assert.equal(isValidStay('2027-01-01', '2027-01-03', today), true);
  for (const [start, end] of [['', ''], ['2026-12-31', '2027-01-03'], ['2027-01-03', '2027-01-03'], ['2027-01-04', '2027-01-03'], ['2027-02-30', '2027-03-05'], ['2027-01-01', '2027-02-30']]) {
    assert.equal(isValidStay(start, end, today), false);
  }
});
