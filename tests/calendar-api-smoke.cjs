const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHmac } = require('node:crypto');
const { loadTsWithMocks } = require('./load-ts.cjs');

module.exports = async function calendarApiSmoke({ call, cookie, directory, companyId, other, villa, secret, base }) {
  const response = await call('/api/demo/calendar-sync/sources', { villaId: villa.id, channelName: 'Integration fixture', direction: 'IMPORT', sourceUrl: 'https://calendar.example.org/fixture.ics' }, 'POST', cookie('OPERATIONS'));
  assert.equal(response.status, 200, response.text);
  const id = response.json.source.id;
  assert.equal((await call(`/api/demo/calendar-sync/sources/${id}/sync`, undefined, 'POST', cookie('ADMIN', other.companyId))).status, 400);
  assert.equal((await call(`/api/demo/calendar-sync/sources/${id}/sync`, undefined, 'POST', cookie('STAFF'))).status, 403);
  const old = { NODE_ENV: process.env.NODE_ENV, DEV_FALLBACK_MODE: process.env.DEV_FALLBACK_MODE, DEV_DATA_DIRECTORY: process.env.DEV_DATA_DIRECTORY };
  process.env.NODE_ENV = 'development'; process.env.DEV_FALLBACK_MODE = 'true'; process.env.DEV_DATA_DIRECTORY = directory;
  let body = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:PRIVATE_PROVIDER_UID\r\nDTSTART;VALUE=DATE:20271110\r\nDTEND;VALUE=DATE:20271113\r\nSUMMARY:PRIVATE_GUEST_NAME\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
  const sync = loadTsWithMocks('src/lib/server/calendar-sync.ts', { 'node:path': { default: path }, 'ical.js': { default: require('ical.js') }, '@/lib/db': { db: {} },
    '@/lib/server/calendar-fetch': { fetchRentalCalendar: async () => body },
  });
  try {
    const result = await sync.synchronizeCalendarSource(id);
    assert.equal(result.added, 1);
    const markup = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    const form = `/talep?company=villavera&villa=${villa.slug}&checkIn=2027-11-10&checkOut=2027-11-12`;
    const blocked = await call(form, undefined, 'GET', '');
    assert.equal(blocked.status, 200);
    assert.doesNotMatch(markup(blocked.text), /name="fullName"/);
    assert.doesNotMatch(blocked.text, /PRIVATE_PROVIDER_UID|PRIVATE_GUEST_NAME/);
    const blockedRequest = await call('/api/demo/requests', { villaSlug: villa.slug, checkIn: '2027-11-10', checkOut: '2027-11-12', guestCount: 2, fullName: 'Calendar test', phone: '05000000000', email: 'test@example.test', termsAccepted: true, termsVersion: '2026-10' }, 'POST', '');
    assert.equal(blockedRequest.status, 400, blockedRequest.text);
    const available = await call(`/talep?company=villavera&villa=${villa.slug}&checkIn=2027-11-13&checkOut=2027-11-16`, undefined, 'GET', '');
    assert.match(markup(available.text), /name="fullName"/);
    const state = JSON.parse(await fs.readFile(path.join(directory, 'development-calendar-sync.json')));
    const blockId = state.sources[id].blocks[0].id;
    const removal = await call(`/api/demo/villas/${villa.slug}/availability`, { rangeId: blockId }, 'DELETE');
    assert.equal(removal.status, 400); assert.match(removal.json.error, /iCal/);
    const token = createHmac('sha256', secret).update(`${companyId}:${villa.slug}`).digest('base64url');
    const exported = await call(`/api/ical/${companyId}/${villa.slug}?token=${token}`, undefined, 'GET', '');
    assert.equal(exported.status, 200); assert.doesNotMatch(exported.text, /20271110|PRIVATE_/);
    body = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n';
    assert.equal((await sync.synchronizeCalendarSource(id)).removed, 1);
    assert.match(markup((await call(form, undefined, 'GET', '')).text), /name="fullName"/);
    const timer = await fetch(`${base}/api/internal/calendar-sync`, { method: 'POST' });
    assert.equal(timer.status, 401);
    // Exercise authenticated scheduling without polling any external provider.
    const sourceFile = path.join(directory, 'demo-ical-sources.json');
    const saved = JSON.parse(await fs.readFile(sourceFile));
    await fs.writeFile(sourceFile, JSON.stringify(saved.map(source => ({ ...source, active: false }))));
    const scheduled = await fetch(`${base}/api/internal/calendar-sync`, { method: 'POST', headers: { Authorization: 'Bearer isolated-calendar-scheduler-secret-1234567890' } });
    assert.equal(scheduled.status, 200); assert.equal((await scheduled.json()).processed, 0);
    await fs.writeFile(sourceFile, JSON.stringify(saved));
    console.log('PASS calendar: real imported occupancy blocks requests, checkout stays free, cancellation reopens dates, source blocks protected, exports prevent mirror loops, scheduler authenticated');
  } finally {
    for (const [key, value] of Object.entries(old)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
};
