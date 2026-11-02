const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { loadTs } = require('./load-ts.cjs');
module.exports = async ({ call, cookie, base, directory, companyId, other, villa }) => {
  const api = (feature, body, role = 'ADMIN', company = companyId) => call(`/api/panel/platform/${feature}`, body, 'POST', cookie(role, company));
  const configs = async () => JSON.parse(await fs.readFile(path.join(directory, 'platform-config.json'), 'utf8'));
  let config = (await configs()).find(row => row.companyId === companyId);
  const content = { ...config.siteDraft, themeKey: 'rota', heroTitle: 'DRAFT_ONLY_MARKER', heroTitleEn: 'ENGLISH_DRAFT_MARKER', phone: '5550000000', email: 'hello@example.test', address: 'Test address' };
  assert.equal((await api('site', { companyId: other.companyId, action: 'save', content, version: 0 })).status, 403);
  assert.equal((await api('site', { companyId, action: 'save', content, version: config.version }, 'STAFF')).status, 403);
  let response = await api('site', { companyId, action: 'save', content, version: config.version });
  assert.equal(response.status, 200, response.text); config = response.json;
  assert.doesNotMatch((await call('/?company=villavera', undefined, 'GET', '')).text, /DRAFT_ONLY_MARKER/);
  assert.doesNotMatch((await call('/?company=villavera&preview=1', undefined, 'GET', cookie('ADMIN', other.companyId))).text, /DRAFT_ONLY_MARKER/);
  assert.match((await call('/?company=villavera&preview=1', undefined, 'GET', cookie('ADMIN'))).text, /DRAFT_ONLY_MARKER/);
  assert.equal((await api('site', { companyId, action: 'publish', version: config.version - 1 })).status, 409);
  response = await api('site', { companyId, action: 'publish', version: config.version }); assert.equal(response.status, 200, response.text); config = response.json;
  assert.match((await call('/?company=villavera', undefined, 'GET', '')).text, /DRAFT_ONLY_MARKER/);
  assert.doesNotMatch((await call('/?company=sahil-collection', undefined, 'GET', '')).text, /DRAFT_ONLY_MARKER/);

  const pkg = { ...config.package, modules: config.package.modules.filter(module => module !== 'pricing') };
  assert.equal((await api('package', { companyId, version: config.version, package: pkg })).status, 403);
  response = await api('package', { companyId, version: config.version, package: pkg }, 'SUPER_ADMIN'); assert.equal(response.status, 200, response.text); config = response.json;
  assert.equal((await api('pricing', { companyId })).status, 403);
  assert.equal((await call('/panel/fiyat-takvimi', undefined, 'GET', cookie('ADMIN'))).status, 403);
  const { DEFAULT_PACKAGE } = loadTs('src/lib/platform-features.ts');
  response = await api('package', { companyId, version: config.version, package: DEFAULT_PACKAGE }, 'SUPER_ADMIN'); assert.equal(response.status, 200, response.text);
  const period = { title: 'Advanced summer', startDate: '2098-09-01', endDate: '2098-09-30', nightlyPrice: 1000, minNightCount: 2, weekendPercent: 20, earlyBookingDays: 30, earlyBookingPercent: 10 };
  response = await api('pricing', { companyId, ids: [villa.id], period, preview: true }); assert.equal(response.status, 200, response.text);
  assert.equal((await api('pricing', { companyId, ids: [other.id], period, preview: false })).status, 403);
  response = await api('pricing', { companyId, ids: [villa.id], period, preview: false }); assert.equal(response.status, 200, response.text);
  assert.equal((await api('pricing', { companyId, ids: [villa.id], period, preview: false })).status, 400);
  let stored = JSON.parse(await fs.readFile(path.join(directory, 'demo-villas.json'), 'utf8')).find(v => v.id === villa.id);
  assert.equal(stored.pricingPeriods.find(p => p.title === period.title).weekendPercent, 20);

  response = await api('sharing', { companyId, action: 'offer', villaId: villa.id, recipientSlug: 'sahil-collection', nightlyPrice: 1500, commissionPercent: 10 });
  assert.equal(response.status, 200, response.text); let share = response.json;
  const sharedSlug = `ortak-${share.id}`;
  assert.equal((await call(`/villalar/${sharedSlug}?company=sahil-collection`, undefined, 'GET', '')).status, 404);
  assert.equal((await api('sharing', { companyId, id: share.id, version: share.version, action: 'accept' })).status, 403);
  response = await api('sharing', { companyId: other.companyId, id: share.id, version: share.version, action: 'accept' }, 'ADMIN', other.companyId);
  assert.equal(response.status, 200, response.text); share = response.json;
  const sharedPage = await call(`/villalar/${sharedSlug}?company=sahil-collection`, undefined, 'GET', '');
  assert.equal(sharedPage.status, 200); assert.doesNotMatch(sharedPage.text, /PRIVATE_OWNER_MARKER|PRIVATE_SUPPLIER_MARKER/);
  const { BOOKING_TERMS_VERSION } = loadTs('src/lib/booking-terms.ts');
  response = await call('/api/demo/requests?company=sahil-collection', { villaSlug: sharedSlug, checkIn: '2098-08-10', checkOut: '2098-08-13', guestCount: 2,
    fullName: 'PARTNER_GUEST_PRIVATE', phone: '5550000000', email: 'partner@test.invalid', termsAccepted: true, termsVersion: BOOKING_TERMS_VERSION, channelLabel: 'EMAIL' }, 'POST', '');
  assert.equal(response.status, 200, response.text); const booking = response.json.request;
  assert.equal(booking.portfolioCommission, undefined); assert.equal(booking.sourceCompanyId, undefined);
  const savedBooking = JSON.parse(await fs.readFile(path.join(directory, 'demo-requests.json'), 'utf8')).find(row => row.id === booking.id);
  assert.equal(savedBooking.companyId, other.companyId); assert.equal(savedBooking.portfolioCommission, 450);
  response = await call('/api/demo/requests?company=sahil-collection', { villaSlug: sharedSlug, checkIn: '2098-08-20', checkOut: '2098-08-23', guestCount: 2,
    fullName: 'Pending partner', phone: '5550000000', email: 'pending@test.invalid', termsAccepted: true, termsVersion: BOOKING_TERMS_VERSION }, 'POST', '');
  assert.equal(response.status, 200, response.text); const pending = response.json.request;
  assert.equal((await call(`/api/demo/requests/${booking.id}`, { status: 'APPROVED' }, 'PATCH', cookie('ADMIN'))).status, 400);
  response = await call(`/api/demo/requests/${booking.id}`, { status: 'APPROVED' }, 'PATCH', cookie('ADMIN', other.companyId)); assert.equal(response.status, 200, response.text);
  const ownerPanel = (await call('/panel/talepler', undefined, 'GET', cookie('ADMIN'))).text;
  assert.doesNotMatch(ownerPanel, /PARTNER_GUEST_PRIVATE/);
  stored = JSON.parse(await fs.readFile(path.join(directory, 'demo-villas.json'), 'utf8')).find(v => v.id === villa.id);
  assert.ok(stored.availabilityRanges.some(range => range.sourceRequestId === booking.id));
  assert.doesNotMatch(JSON.stringify(stored.availabilityRanges), /PARTNER_GUEST_PRIVATE/);
  response = await api('sharing', { companyId, id: share.id, version: share.version, action: 'revoke' }); assert.equal(response.status, 200, response.text);
  assert.equal((await call(`/villalar/${sharedSlug}?company=sahil-collection`, undefined, 'GET', '')).status, 404);
  assert.equal((JSON.parse(await fs.readFile(path.join(directory, 'demo-requests.json'), 'utf8'))).find(row => row.id === booking.id).status, 'APPROVED');
  assert.equal((await call(`/api/demo/requests/${pending.id}`, { status: 'APPROVED' }, 'PATCH', cookie('ADMIN', other.companyId))).status, 409);
  response = await api('sharing', { companyId, action: 'offer', villaId: villa.id, recipientSlug: 'sahil-collection', nightlyPrice: 2000, commissionPercent: 12 });
  assert.equal(response.status, 200, response.text); share = response.json;
  response = await api('sharing', { companyId: other.companyId, id: share.id, version: share.version, action: 'accept' }, 'ADMIN', other.companyId);
  assert.equal(response.status, 200, response.text); share = response.json;
  assert.equal((await call(`/api/demo/requests/${pending.id}`, { status: 'APPROVED' }, 'PATCH', cookie('ADMIN', other.companyId))).status, 400, 'Old terms cannot be approved after re-offering at a new price');
  assert.equal((await api('sharing', { companyId, id: share.id, version: share.version, action: 'revoke' })).status, 200);
  response = await call(`/api/demo/villas/${villa.slug}`, undefined, 'DELETE', cookie('ADMIN'));
  assert.equal(response.status, 400); assert.match(response.text, /silinemez/);

  const visit = () => fetch(`${base}/api/public/visit?company=villavera`, { method: 'POST', headers: { Origin: base, Cookie: 'villa_visit=00000000-0000-4000-8000-000000000000', 'Content-Type': 'application/json' }, body: JSON.stringify({ villaSlug: villa.slug, source: 'SEARCH' }) });
  assert.equal((await visit()).status, 204); assert.equal((await visit()).status, 204);
  const visits = JSON.parse(await fs.readFile(path.join(directory, 'funnel-visits.json'), 'utf8'));
  assert.equal(visits.filter(row => row.companyId === companyId && row.villaId === villa.id).length, 1);
  assert.ok(!JSON.stringify(visits).includes('00000000-0000-4000-8000-000000000000'));
  for (const page of ['kurulum', 'paketler', 'guvenlik', 'fiyat-takvimi', 'portfoy-paylasimi', 'donusum']) assert.equal((await call(`/panel/${page}`, undefined, 'GET')).status, 200, page);
  console.log('PASS platform draft/preview/publish, package enforcement, advanced pricing, authorized portfolio sales/privacy/revocation, visit dedupe and new pages');
  response = await api('security', { action: 'begin', password: 'test-password-only' }, 'SUPER_ADMIN');
  assert.equal(response.status, 200, response.text);
  const { totp } = loadTs('src/lib/auth/totp.ts');
  const code = totp(response.json.secret, Math.floor(Date.now() / 30000));
  response = await api('security', { action: 'confirm', password: 'test-password-only', code }, 'SUPER_ADMIN');
  assert.equal(response.status, 200, response.text); const recovery = response.json.recoveryCodes[0];
  assert.equal((await api('security', { action: 'begin', password: 'test-password-only' }, 'SUPER_ADMIN')).status, 401, 'Enrollment revokes old sessions');
  async function login(verificationCode) {
    const html = (await call('/panel/giris', undefined, 'GET', '')).text;
    const form = new FormData();
    const decode = value => value.replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>');
    for (const [input] of html.matchAll(/<input\b[^>]*type="hidden"[^>]*>/g)) {
      const name = input.match(/name="([^"]+)"/)?.[1];
      if (name?.startsWith('$ACTION')) form.set(decode(name), decode(input.match(/value="([^"]*)"/)?.[1] ?? ''));
    }
    form.set('username', `test-SUPER_ADMIN-${companyId}`); form.set('password', 'test-password-only'); form.set('verificationCode', verificationCode);
    return fetch(base + '/panel/giris', { method: 'POST', headers: { Origin: base }, body: form, redirect: 'manual' });
  }
  assert.equal((await login('')).status, 200, 'Password alone cannot create a session');
  response = await login(recovery); assert.equal(response.status, 303);
  const verifiedCookie = response.headers.getSetCookie().find(value => value.startsWith('villaweb_session='))?.split(';')[0];
  assert.ok(verifiedCookie); assert.equal((await call('/panel/guvenlik', undefined, 'GET', verifiedCookie)).status, 200);
  assert.equal((await login(recovery)).status, 200, 'Recovery code is single-use');
  console.log('PASS real MFA enrollment, old-session rejection, password-only denial, recovery login and replay denial');
};
