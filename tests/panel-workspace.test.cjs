const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { loadTs, loadTsWithMocks } = require('./load-ts.cjs');
const { publicationChecks, validStay, calendarDays, validDateTime } = loadTs('src/lib/panel-workspace.ts');
const { hasPermission, panelPathPermission } = loadTs('src/lib/auth/permissions.ts');
const { prepareImageQueue } = loadTs('src/lib/image-upload-queue.ts');

test('publication checks enforce basic rules and only selected optional requirements', () => {
  const villa = { imageCount: 1, nightlyPrice: 1500, city: 'Bodrum', district: 'Yalikavak', titleEn: '', descriptionEn: '' };
  assert.equal(publicationChecks(villa, []).filter(x => x.required && !x.passed).length, 0);
  assert.deepEqual(publicationChecks(villa, ['english', 'license']).filter(x => x.required && !x.passed).map(x => x.key), ['license', 'english']);
  assert.equal(publicationChecks({ ...villa, nightlyPrice: NaN, imageCount: 0, city: '' }, []).filter(x => x.required && !x.passed).length, 3);
});
test('calendar and owner stays validate real dates, leap years and exclusive end', () => {
  assert.equal(calendarDays('2028-02').length, 29); assert.equal(calendarDays('2027-02').length, 28);
  assert.throws(() => calendarDays('2027-13')); assert.throws(() => validStay('2027-02-30', '2027-03-05'));
  assert.throws(() => validStay('2027-05-01', '2027-05-01'));
  assert.deepEqual(validStay('2027-05-01', '2027-05-02'), { startDate: '2027-05-01', endDate: '2027-05-02' });
  assert.throws(() => validDateTime('2027-05-01T12:00')); assert.equal(validDateTime('2027-05-01T12:00:00+03:00'), '2027-05-01T09:00:00.000Z');
  assert.throws(() => validDateTime('2027-02-30T12:00:00Z'));
  assert.throws(() => validDateTime('2027-05-01T24:00:00Z'));
  assert.equal(panelPathPermission('/panel/takvim'), 'calendar');
});
test('owner role cannot reach general catalog, finance, customers, settings or tasks', () => {
  assert.equal(hasPermission('OWNER', 'owner'), true);
  for (const permission of ['villas', 'users', 'calendar', 'reservations', 'finance', 'crm', 'settings', 'workspace', 'companies']) assert.equal(hasPermission('OWNER', permission), false, permission);
});
test('image queue is sequential and retries only failed/expired files without changing order', async () => {
  const files = [{ id: 'a' }, { id: 'b' }, { id: 'c' }], receipts = new Map(), calls = [], states = [];
  let inflight = 0, fail = true;
  const upload = async (file, progress) => { assert.equal(++inflight, 1); calls.push(file.id); progress(50); await new Promise(r => setTimeout(r, 1)); inflight--; if (file.id === 'b' && fail) throw new Error('network'); return { token: file.id, expiresAt: Date.now() + 100000 }; };
  const report = (file, state) => states.push([file.id, state.status]);
  await assert.rejects(prepareImageQueue(files, receipts, upload, report), /Başarılı/);
  fail = false; assert.deepEqual(await prepareImageQueue([files[2], files[1], files[0]], receipts, upload, report), ['c', 'b', 'a']);
  assert.deepEqual(calls, ['a', 'b', 'c', 'b']);
  receipts.set(files[0], { token: 'old', expiresAt: 0 }); await prepareImageQueue(files, receipts, upload, report); assert.equal(calls.at(-1), 'a');
});
test('workflow fallback serializes edits, rejects stale writes, and scopes every company', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'panel-record-test-')); const previous = process.env.DEV_DATA_DIRECTORY; process.env.DEV_DATA_DIRECTORY = dir;
  let actor = { id: 'user', role: 'ADMIN', companyId: 'a' };
  const records = loadTsWithMocks('src/lib/server/panel-work-records.ts', {
    'node:path': { default: path, ...path },
    '@/lib/db': { db: {} }, '@/lib/auth/server-session': { getUserSession: async () => actor },
    '@/lib/server/demo-company-context': { assertPanelCompanyAccess: async id => { if (actor.role !== 'SUPER_ADMIN' && id !== actor.companyId) throw new Error('Forbidden company'); } },
    '@/lib/server/development-fallback': { withDevelopmentFallback: (_primary, fallback) => fallback() },
  });
  try {
    const input = { kind: 'TASK', companyId: 'a', subjectId: 't', version: 0 };
    await records.changeWorkRecord(input, async () => ({ data: { title: 'one' }, userId: 'user' }));
    await assert.rejects(records.changeWorkRecord(input, async () => ({ data: {} })), error => error.status === 409);
    await assert.rejects(records.changeWorkRecord({ ...input, companyId: 'b' }, async () => ({ data: {} })), /Forbidden/);
    const concurrent = await Promise.allSettled([1, 2].map(n => records.changeWorkRecord({ ...input, version: 1 }, async () => ({ data: { title: String(n) } }))));
    assert.equal(concurrent.filter(r => r.status === 'fulfilled').length, 1);
    const unassigned = await records.changeWorkRecord({ ...input, version: 2 }, async current => ({ data: current.data, userId: null }));
    assert.equal(unassigned.userId, null);
    actor = { ...actor, companyId: 'b' }; assert.equal((await records.listWorkRecords('TASK')).length, 0);
    await assert.rejects(records.listWorkRecords('TASK', 'a'), /Forbidden/);
    actor = null; await assert.rejects(records.listWorkRecords('TASK'));
  } finally { if (previous === undefined) delete process.env.DEV_DATA_DIRECTORY; else process.env.DEV_DATA_DIRECTORY = previous; await fs.rm(dir, { recursive: true, force: true }); }
});
test('backup helpers keep credentials out of arguments and reject public/traversal paths', async () => {
  const { postgresEnvironment, privateBackupDirectory, safeArchiveEntries } = await import('../scripts/backup-core.mjs');
  const env = postgresEnvironment('postgresql://test:p%40ss@localhost:5432/villa?schema=public&sslmode=require', {});
  assert.equal(env.PGPASSWORD, 'p@ss'); assert.equal(env.PGDATABASE, 'villa'); assert.equal(env.PGSSLMODE, 'require');
  assert.throws(() => postgresEnvironment('https://host/db'));
  assert.throws(() => privateBackupDirectory('/repo/public/backups', '/repo'));
  assert.throws(() => privateBackupDirectory('backups', '/repo'));
  assert.throws(() => safeArchiveEntries('villas/../../secret'));
  assert.throws(() => safeArchiveEntries('/etc/passwd'));
  assert.ok(safeArchiveEntries('villas/\nvillas/example/image.webp\n').has('villas/example/image.webp'));
});
test('staged images are signed, private to actor/company, expiring and hash verified', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'staged-image-test-'));
  const previous = process.env.VILLA_RUNTIME_DIRECTORY; process.env.VILLA_RUNTIME_DIRECTORY = dir;
  let actor = { id: 'one', role: 'ADMIN', companyId: 'a' };
  const staged = loadTsWithMocks('src/lib/server/staged-villa-images.ts', {
    'node:path': { default: path, ...path },
    '@/lib/auth/server-session': { getUserSession: async () => actor },
    '@/lib/server/demo-company-context': { assertPanelCompanyAccess: async id => { if (actor.companyId !== id) throw new Error('Forbidden company'); } },
  });
  const formFor = token => { const form = new FormData(); form.set('stagedImages', token); return form; };
  try {
    const bytes = Buffer.from('test-converted-image');
    const receipt = await staged.stageConvertedImage('a', 'image.jpg', bytes);
    const images = await staged.readStagedImages(formFor(receipt.token), 'a');
    assert.equal(images[0].size, bytes.length);
    assert.deepEqual(Buffer.from(await images[0].arrayBuffer()), bytes);
    await assert.rejects(staged.readStagedImages(formFor(receipt.token + 'x'), 'a'));
    actor = { ...actor, id: 'two' }; await assert.rejects(staged.readStagedImages(formFor(receipt.token), 'a'));
    actor = { ...actor, id: 'one', companyId: 'b' }; await assert.rejects(staged.readStagedImages(formFor(receipt.token), 'b'));
    actor = { ...actor, companyId: 'a' };
    const duplicate = formFor(receipt.token); duplicate.append('stagedImages', receipt.token);
    await assert.rejects(staged.readStagedImages(duplicate, 'a'));
    const clock = Date.now; Date.now = () => receipt.expiresAt + 1;
    try { await assert.rejects(staged.readStagedImages(formFor(receipt.token), 'a')); } finally { Date.now = clock; }
    const id = JSON.parse(Buffer.from(receipt.token.split('.')[0], 'base64url').toString()).id;
    await fs.writeFile(path.join(dir, 'staged', `${id}.webp`), 'modified');
    await assert.rejects(images[0].arrayBuffer());
  } finally { if (previous === undefined) delete process.env.VILLA_RUNTIME_DIRECTORY; else process.env.VILLA_RUNTIME_DIRECTORY = previous; await fs.rm(dir, { recursive: true, force: true }); }
});
