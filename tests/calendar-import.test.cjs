const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { Readable } = require('node:stream');
const { loadTsWithMocks } = require('./load-ts.cjs');
const mocks = { 'ical.js': { default: require('ical.js') } };
const { parseRentalCalendar, CalendarImportError, MAX_CALENDAR_BYTES } = loadTsWithMocks('src/lib/calendar-import.ts', mocks);
const calendar = (...events) => ['BEGIN:VCALENDAR', 'VERSION:2.0', ...events, 'END:VCALENDAR'].join('\r\n');
const event = (uid, start = '20270810', end = '20270813', extra = '') => `BEGIN:VEVENT\r\nUID:${uid}\r\nDTSTART;VALUE=DATE:${start}\r\nDTEND;VALUE=DATE:${end}\r\n${extra}\r\nEND:VEVENT`;

test('rental iCal preserves exclusive checkout, unfolded UIDs and omits cancelled/transparent events', () => {
  assert.deepEqual(parseRentalCalendar(calendar(event('folded-\r\n uid'), event('cancelled', '20270810', '20270813', 'STATUS:CANCELLED'), event('free', '20270810', '20270813', 'TRANSP:TRANSPARENT'))), [
    { uid: 'folded-uid', startDate: '2027-08-10', endDate: '2027-08-13' },
  ]);
  assert.deepEqual(parseRentalCalendar(calendar()), []);
  assert.deepEqual(parseRentalCalendar(calendar('BEGIN:VEVENT\r\nUID:day\r\nDTSTART;VALUE=DATE:20270810\r\nEND:VEVENT')), [{ uid: 'day', startDate: '2027-08-10', endDate: '2027-08-11' }]);
});

test('rental timestamps use Istanbul dates for UTC and IANA zones, with no server-timezone dependence', () => {
  const timed = (start, end) => calendar(`BEGIN:VEVENT\r\nUID:time\r\nDTSTART${start}\r\nDTEND${end}\r\nEND:VEVENT`);
  assert.equal(parseRentalCalendar(timed(':20270810T220000Z', ':20270813T080000Z'))[0].startDate, '2027-08-11');
  assert.equal(parseRentalCalendar(timed(';TZID=America/New_York:20270810T220000', ';TZID=America/New_York:20270813T080000'))[0].startDate, '2027-08-11');
  assert.equal(parseRentalCalendar(timed(':20270810T150000', ':20270813T100000'))[0].startDate, '2027-08-10');
  assert.throws(() => parseRentalCalendar(timed(';TZID=Not/AZone:20270810T150000', ';TZID=Not/AZone:20270813T100000')), CalendarImportError);
});

test('invalid/partial/delta/recurring/oversized feeds fail as a whole instead of clearing old occupancy', () => {
  for (const input of ['<html>login</html>', calendar(event('one')).replace('END:VCALENDAR', ''), calendar(event('one', '20270230')), calendar(event('one', '20270810', '20270809')),
    calendar(event('one'), event('one')), calendar(event('one', '20270810', '20270813', 'RRULE:FREQ=DAILY')), calendar(event('one')).replace('UID:one', 'SUMMARY:Missing UID'),
    calendar(event('one')).replace('VERSION:2.0', 'VERSION:2.0\r\nMETHOD:CANCEL'), 'x'.repeat(MAX_CALENDAR_BYTES + 1)]) {
    assert.throws(() => parseRentalCalendar(input), CalendarImportError);
  }
  assert.throws(() => parseRentalCalendar(calendar(event('one', '20270810', '20270813', 'UID:second\r\nSTATUS:CANCELLED'))), CalendarImportError);
});

test('calendar SSRF guard blocks private, metadata, reserved, mapped, credential and alternate-port addresses', () => {
  const { normalizeCalendarUrl, isPublicCalendarAddress } = loadTsWithMocks('src/lib/server/calendar-fetch.ts', mocks);
  for (const address of ['127.0.0.1', '10.1.1.1', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1', '192.0.2.1', '198.18.0.1', '::1', 'fc00::1', 'fe80::1', '::ffff:127.0.0.1', '2001:db8::1', '64:ff9b::7f00:1', '2002:7f00:1::']) assert.equal(isPublicCalendarAddress(address), false, address);
  for (const url of ['http://localhost/x', 'http://127.1/x', 'http://0x7f000001/x', 'https://[::ffff:127.0.0.1]/x', 'http://169.254.169.254/x', 'file:///etc/passwd', 'https://user:pass@example.com/x', 'https://example.com:8080/x']) assert.throws(() => normalizeCalendarUrl(url), /adres|URL/);
  assert.equal(normalizeCalendarUrl('webcal://calendar.google.com/test.ics'), 'https://calendar.google.com/test.ics');
  assert.equal(isPublicCalendarAddress('8.8.8.8'), true);
  assert.equal(isPublicCalendarAddress('2606:4700:4700::1111'), true);
});

test('calendar downloader pins DNS, checks every redirect, and rejects large/truncated responses', async () => {
  let addresses = [{ address: '2606:4700:4700::1111', family: 6 }, { address: '93.184.216.34', family: 4 }];
  let responses = [];
  let calls = 0;
  let lookups = 0;
  const request = (_url, options, callback) => {
    calls++;
    const req = new EventEmitter();
    req.end = () => process.nextTick(() => {
      options.lookup('calendar.example.org', { all: false }, (error, address) => {
        assert.ifError(error); assert.equal(address, '93.184.216.34');
      });
      const definition = responses.shift();
      const response = Readable.from(definition.chunks || [Buffer.from(definition.body || '')]);
      response.statusCode = definition.status || 200;
      response.headers = definition.headers || {};
      callback(response);
      if (definition.abort) response.destroy(new Error('Truncated HTTP response'));
    });
    return req;
  };
  const { fetchRentalCalendar } = loadTsWithMocks('src/lib/server/calendar-fetch.ts', { ...mocks,
    'node:dns/promises': { lookup: async () => { lookups++; return addresses; } }, 'node:http': { request }, 'node:https': { request },
  });
  responses = [{ body: calendar(event('a')) }];
  assert.match(await fetchRentalCalendar('https://calendar.example.org/feed'), /BEGIN:VCALENDAR/);
  assert.equal(lookups, 1);
  responses = [{ status: 302, headers: { location: 'https://127.0.0.1/private' } }];
  await assert.rejects(fetchRentalCalendar('https://calendar.example.org/feed'), /adres|URL/);
  assert.equal(calls, 2);
  responses = [{ status: 302, headers: { location: 'https://second.example.org/feed' } }, { body: calendar() }];
  assert.equal(await fetchRentalCalendar('https://calendar.example.org/feed'), calendar());
  assert.equal(lookups, 4);
  addresses = [{ address: '93.184.216.34', family: 4 }, { address: '10.0.0.1', family: 4 }];
  await assert.rejects(fetchRentalCalendar('https://calendar.example.org/feed'), /genel IP/);
  addresses = [{ address: '93.184.216.34', family: 4 }];
  responses = [{ chunks: [Buffer.alloc(MAX_CALENDAR_BYTES), Buffer.from('x')] }];
  await assert.rejects(fetchRentalCalendar('https://calendar.example.org/feed'), /2 MB/);
  responses = [{ status: 404 }];
  await assert.rejects(fetchRentalCalendar('https://calendar.example.org/feed'), /HTTP 404/);
  responses = [{ body: 'BEGIN:VCALENDAR', abort: true }];
  await assert.rejects(fetchRentalCalendar('https://calendar.example.org/feed'), /indirilemedi/);
  responses = [{ status: 302, headers: { location: 'http://second.example.org/feed' } }];
  await assert.rejects(fetchRentalCalendar('https://calendar.example.org/feed'), /guvensiz HTTP/);
  responses = Array.from({ length: 4 }, () => ({ status: 302, headers: { location: 'https://calendar.example.org/again' } }));
  await assert.rejects(fetchRentalCalendar('https://calendar.example.org/feed'), /cok fazla yonlendirme/);
});

test('scheduler authorization requires a separate strong bearer secret, not a panel session', () => {
  const { authorizeCalendarCron } = loadTsWithMocks('src/lib/server/calendar-cron-auth.ts', {});
  const previous = process.env.CALENDAR_SYNC_SECRET;
  try {
    delete process.env.CALENDAR_SYNC_SECRET;
    assert.equal(authorizeCalendarCron(new Request('http://local')), 'unconfigured');
    process.env.CALENDAR_SYNC_SECRET = 'calendar-test-secret-at-least-32-characters';
    assert.equal(authorizeCalendarCron(new Request('http://local', { headers: { cookie: 'villaweb-session=fake' } })), 'denied');
    assert.equal(authorizeCalendarCron(new Request('http://local', { headers: { authorization: `Bearer ${process.env.CALENDAR_SYNC_SECRET}` } })), 'allowed');
  } finally { if (previous === undefined) delete process.env.CALENDAR_SYNC_SECRET; else process.env.CALENDAR_SYNC_SECRET = previous; }
});

module.exports = { calendar, event };
