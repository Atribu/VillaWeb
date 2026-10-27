const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');
const { getPublicFaqGroups, normalizeFaqSearch } = loadTs('src/lib/public-faq.ts');
const { travelGuides, getTravelGuide } = loadTs('src/lib/travel-journal.ts');

test('FAQ categories and questions have stable unique IDs in both languages', () => {
  const tr = getPublicFaqGroups('tr');
  const en = getPublicFaqGroups('en');
  assert.deepEqual(tr.map(group => group.id), en.map(group => group.id));
  for (const locale of ['tr', 'en']) {
    const groups = getPublicFaqGroups(locale);
    const items = groups.flatMap(group => group.items);
    assert.equal(items.length, 9);
    assert.equal(new Set(items.map(item => item.id)).size, items.length);
    assert.ok(items.every(item => item.question && item.answer));
  }
  assert.notEqual(tr[0].items[0].question, en[0].items[0].question);
});

test('FAQ search tolerates Turkish characters, capitalization and whitespace', () => {
  for (const query of ['ÖDEME', 'odeme', '  ödeme  ']) assert.equal(normalizeFaqSearch(query), 'odeme');
  assert.equal(normalizeFaqSearch('GİRİŞ'), 'giris');
  assert.equal(normalizeFaqSearch('INQUIRY'), 'inquiry');
  const questions = getPublicFaqGroups('tr').flatMap(group => group.items);
  assert.ok(questions.some(item => normalizeFaqSearch(item.question).includes(normalizeFaqSearch('ODeme'))));
});

test('every journal link resolves to a bilingual article with full sections', () => {
  assert.equal(travelGuides.length, 3);
  assert.equal(new Set(travelGuides.map(guide => guide.slug)).size, travelGuides.length);
  for (const guide of travelGuides) {
    assert.match(guide.slug, /^[a-z0-9-]+$/);
    assert.equal(getTravelGuide(guide.slug), guide);
    for (const locale of ['tr', 'en']) {
      assert.ok(guide.title[locale] && guide.intro[locale] && guide.category[locale]);
      assert.equal(guide.sections.length, 3);
      assert.ok(guide.sections.every(section => section.title[locale] && section.text[locale].length > 80));
    }
  }
  assert.equal(getTravelGuide('unknown-guide'), undefined);
});
