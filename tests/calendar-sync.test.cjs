const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { loadTs, loadTsWithMocks } = require('./load-ts.cjs');
const calendar = (...events) => ['BEGIN:VCALENDAR', 'VERSION:2.0', ...events, 'END:VCALENDAR'].join('\r\n');
const event = (uid, start = '20270810', end = '20270813', extra = '') => `BEGIN:VEVENT\r\nUID:${uid}\r\nDTSTART;VALUE=DATE:${start}\r\nDTEND;VALUE=DATE:${end}\r\n${extra}\r\nEND:VEVENT`;

test('real fallback sync is idempotent, persists occupancy, updates cancellations and preserves other sources/manual reservations', async () => {
  const oldEnv = { NODE_ENV: process.env.NODE_ENV, DEV_FALLBACK_MODE: process.env.DEV_FALLBACK_MODE, DEV_DATA_DIRECTORY: process.env.DEV_DATA_DIRECTORY };
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'villaweb-calendar-'));
  process.env.NODE_ENV = 'development'; process.env.DEV_FALLBACK_MODE = 'true'; process.env.DEV_DATA_DIRECTORY = directory;
  const companyId = 'seed-company-villavera';
  const { demoCompanies } = loadTs('src/lib/demo-companies.ts');
  const { seedVillaCatalog } = loadTs('src/lib/villa-catalog.ts');
  const villa = { ...seedVillaCatalog[0], companyId, availabilityRanges: [
    { id: 'manual', startDate: '2027-09-01', endDate: '2027-09-03', status: 'UNAVAILABLE', label: 'Manual' },
    { id: 'booking', startDate: '2027-09-10', endDate: '2027-09-13', status: 'RESERVED', label: 'Booking', sourceRequestId: 'request-1' },
  ] };
  const sources = ['a', 'b'].map(id => ({ id, companyId, villaSlug: villa.slug, villaTitle: villa.title,
    channelName: `Channel ${id}`, sourceUrl: `https://calendar.example.org/${id}`, direction: 'IMPORT', active: true, status: 'WARNING', lastSyncedAt: '' }));
  const modules = new Map();
  let feed = calendar(event('stay'));
  let beforeFetch = async () => {};
  const mocks = { 'node:path': { default: path }, 'ical.js': { default: require('ical.js') }, '@/lib/db': { db: {} },
    '@/lib/server/calendar-fetch': { fetchRentalCalendar: async () => { await beforeFetch(); return feed; } },
  };
  try {
    for (const [name, value] of Object.entries({ 'demo-villas.json': [villa], 'demo-companies.json': demoCompanies, 'demo-ical-sources.json': sources, 'demo-sync-logs.json': [], 'demo-pricing.json': [] })) await fs.writeFile(path.join(directory, name), JSON.stringify(value));
    const sync = loadTsWithMocks('src/lib/server/calendar-sync.ts', mocks, modules);
    const data = loadTsWithMocks('src/lib/server/development-fallback-data.ts', mocks, modules);
    const local = loadTsWithMocks('src/lib/server/calendar-local-state.ts', mocks, modules);
    let result = await sync.synchronizeCalendarSource('a');
    assert.equal(result.added, 1); assert.equal(result.outcome, 'SUCCESS');
    let current = (await data.getFallbackVillas(companyId))[0];
    const imported = current.availabilityRanges.find(item => item.calendarSourceId === 'a');
    assert.equal(imported.endDate, '2027-08-13');
    result = await sync.synchronizeCalendarSource('a');
    assert.equal(result.added, 0); assert.equal(result.updated, 0); assert.equal(result.removed, 0);
    assert.equal((await data.getFallbackVillas(companyId))[0].availabilityRanges.filter(item => item.calendarSourceId).length, 1);
    feed = calendar(event('stay', '20270811', '20270815'), event('second', '20270820', '20270822'));
    result = await sync.synchronizeCalendarSource('a');
    assert.equal(result.updated, 1); assert.equal(result.added, 1);
    assert.equal((await data.getFallbackVillas(companyId))[0].availabilityRanges.find(item => item.externalEventId === imported.externalEventId).id, imported.id);
    feed = calendar(event('other-channel', '20270901', '20270904'));
    result = await sync.synchronizeCalendarSource('b');
    assert.equal(result.conflicts, 1); assert.equal(result.outcome, 'WARNING');
    // Saving the villa must never copy imported blocks into the manual data file.
    current = (await data.getFallbackVillas(companyId))[0];
    await data.saveFallbackVilla({ ...current, title: 'Updated villa' });
    assert.ok(JSON.parse(await fs.readFile(path.join(directory, 'demo-villas.json')))[0].availabilityRanges.every(item => !item.calendarSourceId));
    const beforeFailure = JSON.stringify((await data.getFallbackVillas(companyId))[0].availabilityRanges);
    const lastSuccess = (await local.readLocalCalendarState()).sources.a.lastSyncedAt;
    feed = '<html>Login required</html>';
    await assert.rejects(sync.synchronizeCalendarSource('a'), /iCal/);
    assert.equal(JSON.stringify((await data.getFallbackVillas(companyId))[0].availabilityRanges), beforeFailure);
    assert.equal((await local.readLocalCalendarState()).sources.a.lastSyncedAt, lastSuccess);
    assert.equal((await data.getFallbackIcalSources()).find(item => item.id === 'a').status, 'ERROR');
    feed = calendar(event('stay', '20270811', '20270815', 'STATUS:CANCELLED'));
    result = await sync.synchronizeCalendarSource('a');
    assert.equal(result.removed, 2);
    current = (await data.getFallbackVillas(companyId))[0];
    assert.deepEqual(current.availabilityRanges.filter(item => !item.calendarSourceId).map(item => item.id), ['manual', 'booking']);
    assert.equal(current.availabilityRanges.filter(item => item.calendarSourceId === 'b').length, 1);
    feed = calendar();
    result = await sync.synchronizeCalendarSource('b');
    assert.equal(result.removed, 1);
    assert.equal((await data.getFallbackVillas(companyId))[0].availabilityRanges.length, 2);
    assert.equal((await sync.runDueCalendarSyncs()).processed, 0, 'Manual success postpones scheduled polling');
    await local.invalidateLocalCalendarSync('a');
    assert.equal((await sync.runDueCalendarSyncs()).processed, 1);
    // A simultaneous attempt cannot download or apply a second snapshot.
    let release; const gate = new Promise(resolve => { release = resolve; });
    let entered; const entry = new Promise(resolve => { entered = resolve; });
    beforeFetch = async () => { entered(); await gate; };
    const first = sync.synchronizeCalendarSource('a');
    await entry;
    await assert.rejects(sync.synchronizeCalendarSource('a'), /zaten senkronize/);
    // Editing a source while the old feed is in flight invalidates that result.
    await data.updateFallbackIcalSource('a', { active: false });
    release();
    await assert.rejects(first, /Pasif/);
    beforeFetch = async () => {};
    assert.equal((await data.getFallbackVillas(companyId))[0].availabilityRanges.length, 2);
    assert.equal((await sync.runDueCalendarSyncs()).processed, 0);
    assert.ok((await data.getFallbackSyncLogs(companyId)).some(item => item.outcome === 'ERROR'));
    assert.equal((await data.getFallbackVillas('seed-company-sahil')).length, 0);
  } finally {
    for (const [key, value] of Object.entries(oldEnv)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('PostgreSQL sync path scopes writes, leases attempts, serializes with bookings and rolls back failed snapshots', async () => {
  const oldEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  let source = { id: 'a', companyId: 'company-a', villaId: 'villa-a', channelName: 'Channel', sourceUrl: 'https://calendar.example.org/a', direction: 'IMPORT', active: true,
    company: { status: 'ACTIVE' }, villa: { companyId: 'company-a', slug: 'villa-a', title: 'Villa' }, syncLeaseUntil: null, syncLeaseToken: null, nextSyncAt: new Date(0) };
  let blocks = [{ id: 'manual', villaId: 'villa-a', startsAt: new Date('2027-09-01'), endsAt: new Date('2027-09-03'), calendarSourceId: null, note: 'Keep me' },
    { id: 'other-source', villaId: 'villa-a', startsAt: new Date('2027-10-01'), endsAt: new Date('2027-10-03'), calendarSourceId: 'b', externalEventId: 'b-id', note: 'Keep B' }];
  let logs = [];
  let locks = [];
  let failInsert = false;
  let feed = calendar(event('stay'));
  const db = {
    calendarSyncSource: {
      async findUnique() { return source; },
      async updateMany({ where, data }) {
        assert.equal(where.id, 'a');
        if (where.syncLeaseToken && source.syncLeaseToken !== where.syncLeaseToken) return { count: 0 };
        if (where.OR && source.syncLeaseUntil > new Date()) return { count: 0 };
        Object.assign(source, data); return { count: 1 };
      },
      async update({ where, data }) { assert.equal(where.id, 'a'); Object.assign(source, data); return source; },
    },
    villaAvailabilityBlock: {
      async findMany({ where }) { assert.equal(where.villaId, 'villa-a'); return blocks; },
      async deleteMany({ where }) {
        assert.equal(where.villaId, 'villa-a'); assert.equal(where.calendarSourceId, 'a');
        blocks = blocks.filter(item => item.calendarSourceId !== 'a' || where.externalEventId?.notIn.includes(item.externalEventId));
      },
      async createMany({ data }) { if (failInsert) throw new Error('Simulated write failure'); assert.ok(data.every(item => item.villaId === 'villa-a' && item.calendarSourceId === 'a')); blocks.push(...data); },
      async update({ where, data }) { Object.assign(blocks.find(item => item.id === where.id), data); },
    },
    calendarSyncLog: { async create({ data }) { assert.equal(data.companyId, 'company-a'); logs.push(data); } },
    async $queryRaw(strings) { locks.push(strings.join('?')); },
    async $transaction(callback) {
      const snapshot = structuredClone({ source, blocks, logs });
      try { return await callback(db); } catch (error) { ({ source, blocks, logs } = snapshot); throw error; }
    },
  };
  try {
    const sync = loadTsWithMocks('src/lib/server/calendar-sync.ts', { 'node:path': { default: path }, 'ical.js': { default: require('ical.js') }, '@/lib/db': { db },
      '@/lib/server/calendar-fetch': { fetchRentalCalendar: async () => feed },
      '@/lib/server/development-fallback-data': {}, '@/lib/server/calendar-local-state': {},
    });
    let result = await sync.synchronizeCalendarSource('a');
    assert.equal(result.added, 1); assert.equal(blocks.length, 3);
    assert.match(locks[0], /Villa.*FOR UPDATE/); assert.match(locks[1], /CalendarSyncSource.*FOR UPDATE/);
    result = await sync.synchronizeCalendarSource('a'); assert.equal(result.added, 0); assert.equal(blocks.length, 3);
    feed = calendar(event('new'));
    failInsert = true;
    await assert.rejects(sync.synchronizeCalendarSource('a'), /kaydedilemedi/);
    assert.equal(blocks.length, 3); assert.ok(blocks.some(item => item.externalEventId === sync.importedEventKey('stay')));
    assert.equal(source.status, 'ERROR'); assert.equal(source.syncLeaseToken, null);
    failInsert = false;
    feed = calendar();
    result = await sync.synchronizeCalendarSource('a'); assert.equal(result.removed, 1);
    assert.deepEqual(blocks.map(item => item.id), ['manual', 'other-source']);
    source.company.status = 'SUSPENDED';
    await assert.rejects(sync.synchronizeCalendarSource('a'), /Pasif/);
  } finally { if (oldEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldEnv; }
});
