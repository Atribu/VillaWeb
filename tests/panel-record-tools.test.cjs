const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');
const { galleryVersion, validateGalleryChange, validateBulkSelection, moveItem } = loadTs('src/lib/panel-record-tools.ts');
const { villaDraftKey, parseVillaDraft, DRAFT_TTL } = loadTs('src/lib/villa-draft.ts');

test('gallery accepts only owned unique images and a retained cover; rejects stale edits', () => {
  const current = { urls: ['/a.webp', '/b.webp', '/c.webp'], cover: '/a.webp' };
  const input = { urls: ['/c.webp', '/b.webp'], cover: '/b.webp', version: galleryVersion(current) };
  assert.deepEqual(validateGalleryChange(current, input), { urls: input.urls, cover: input.cover });
  for (const bad of [{ urls: [] }, { urls: ['/a.webp', '/a.webp'] }, { urls: ['/foreign.webp'] }, { cover: '/a.webp' }, { version: 'old' }]) {
    assert.throws(() => validateGalleryChange(current, { ...input, ...bad }));
  }
  assert.throws(() => validateGalleryChange(current, null));
});
test('bulk operations cannot delete, publish, accept empty/duplicate or oversized selections', () => {
  const selection = [{ id: 'villa-a', status: 'ACTIVE' }];
  assert.equal(validateBulkSelection({ selection, status: 'PAUSED' }).status, 'PAUSED');
  for (const input of [null, { selection, status: 'DELETE' }, { selection, status: 'ACTIVE' }, { selection: [], status: 'PAUSED' }, { selection: [...selection, ...selection], status: 'PAUSED' }, { selection: Array.from({ length: 101 }, (_, i) => ({ id: String(i), status: 'ACTIVE' })), status: 'ARCHIVED' }]) assert.throws(() => validateBulkSelection(input));
});
test('photo reordering is immutable and supports keyboard boundary checks', () => {
  const items = ['a', 'b', 'c'];
  assert.deepEqual(moveItem(items, 2, 0), ['c', 'a', 'b']);
  assert.deepEqual(items, ['a', 'b', 'c']);
  assert.deepEqual(moveItem(items, 0, -1), items);
});
test('draft identity includes user, company and villa; stale or corrupt drafts are ignored', () => {
  assert.notEqual(villaDraftKey('a', 'b', 'c'), villaDraftKey('b', 'b', 'c'));
  assert.notEqual(villaDraftKey('a', 'b', 'c'), villaDraftKey('a', 'c', 'c'));
  assert.notEqual(villaDraftKey('a', 'b', 'c'), villaDraftKey('a', 'b', 'd'));
  const now = Date.now();
  const draft = { version: 1, savedAt: now, baseline: '{}', fields: { title: ['Test'], amenities: ['wifi'] }, hasFiles: true };
  assert.deepEqual(parseVillaDraft(JSON.stringify(draft), now), draft);
  assert.equal(parseVillaDraft(JSON.stringify(draft), now + DRAFT_TTL + 1), null);
  assert.equal(parseVillaDraft(JSON.stringify({ ...draft, fields: { title: [123] } }), now), null);
  assert.equal(parseVillaDraft('bad JSON'), null);
});
