/* End-to-end checks run against isolated JSON fixtures and a local development server. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { createHmac, createHash, randomUUID, scryptSync } = require('node:crypto');
const http = require('node:http');
const { loadTs } = require('./load-ts.cjs');

async function main() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'villaweb-report-'));
  const { seedVillaCatalog } = loadTs('src/lib/villa-catalog.ts');
  const { demoCompanies } = loadTs('src/lib/demo-companies.ts');
  const companyId = 'seed-company-villavera';
  const villa = { ...seedVillaCatalog[0], companyId, shortCode: 'TEST-REPORT', status: 'ACTIVE',
    ownerVillaName: 'PRIVATE_OWNER_MARKER', supplierNotes: 'PRIVATE_SUPPLIER_MARKER',
    availabilityRanges: [], pricingPeriods: [], minNightCount: 1, cleaningFee: 0, nightlyPrice: 1000,
    discountedNightlyPrice: undefined };
  const other = { ...seedVillaCatalog[1], companyId: 'seed-company-sahil', slug: 'other-company-test', status: 'ACTIVE', availabilityRanges: [] };
  const files = { 'demo-villas.json': [villa, other], 'demo-companies.json': demoCompanies,
    'demo-pricing.json': [], 'demo-discounts.json': [], 'demo-coupons.json': [], 'demo-requests.json': [],
    'demo-invoices.json': [], 'demo-payments.json': [], 'demo-operation-tasks.json': [], 'demo-region-airports.json': [],
    'demo-websites.json': [
      { id: 'test-site-a', companyId, name: 'Test A', domain: 'a.test', locale: 'tr-TR', status: 'LIVE', default: true, primaryChannel: 'Direct', themeKey: 'marketplace-core', updatedAt: new Date().toISOString() },
      { id: 'test-site-a-micro', companyId, name: 'Test A Collection', domain: 'collection.a.test', locale: 'tr-TR', status: 'LIVE', default: false, primaryChannel: 'Direct', themeKey: 'kiyi', updatedAt: new Date().toISOString() },
      { id: 'test-site-b', companyId: other.companyId, name: 'Test B', domain: 'b.test', locale: 'tr-TR', status: 'LIVE', default: true, primaryChannel: 'Direct', themeKey: 'rota', updatedAt: new Date().toISOString() },
    ] };
  for (const [name, value] of Object.entries(files)) await fs.writeFile(path.join(directory, name), JSON.stringify(value));
  const port = process.env.SMOKE_PORT || '3012';
  const base = `http://localhost:${port}`;
  const secret = 'isolated-report-smoke-secret';
  const authData = { users: [], sessions: [] };
  const members = [];
  const cookies = new Map();
  for (const role of ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'FINANCE', 'SALES', 'OPERATIONS', 'CRM', 'CONTENT', 'OWNER']) {
    for (const id of [companyId, other.companyId]) {
      const userId = `test-${role}-${id}`;
      const company = role === 'SUPER_ADMIN' ? undefined : id;
      const expiresAt = Date.now() + 3600000;
      const body = Buffer.from(JSON.stringify({ id: userId, username: userId, displayName: 'Test Yoneticisi', role,
        companyId: company, companyName: 'Test Firma', sessionId: randomUUID(), expiresAt })).toString('base64url');
      const token = `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
      cookies.set(`${role}:${id}`, `villaweb_session=${token}`);
      authData.users.push({ id: userId, username: userId, email: `${userId}@test.invalid`, displayName: 'Test Yoneticisi',
        passwordHash: `scrypt:test:${scryptSync('test-password-only', 'test', 64).toString('hex')}`, isOwner: role === 'SUPER_ADMIN' });
      authData.sessions.push({ token: createHash('sha256').update(token).digest('hex'), userId, companyId: company, expiresAt });
      if (company) members.push({ id: userId, username: userId, email: `${userId}@test.invalid`, fullName: 'Test Yoneticisi',
        companyId: company, status: 'ACTIVE', roleId: role, branchId: 'branch-central-desk', agencyId: 'agency-merkez-rezervasyon', phone: '5550000000' });
    }
  }
  await fs.writeFile(path.join(directory, 'development-auth.json'), JSON.stringify(authData));
  await fs.writeFile(path.join(directory, 'demo-team-users.json'), JSON.stringify(members));
  function cookie(role = 'SUPER_ADMIN', id = companyId) {
    return cookies.get(`${role}:${id}`);
  }
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--port', port], {
    cwd: path.resolve(__dirname, '..'), env: { ...process.env, DEV_FALLBACK_MODE: 'true', DEV_DATA_DIRECTORY: directory, VILLA_RUNTIME_DIRECTORY: path.join(directory, 'runtime'),
      SESSION_SECRET: secret, ICAL_SIGNING_SECRET: secret,
      CALENDAR_SYNC_SECRET: 'isolated-calendar-scheduler-secret-1234567890',
      DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test?connect_timeout=1' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  server.stdout.on('data', (value) => { log += value; });
  server.stderr.on('data', (value) => { log += value; });
  async function call(route, body, method = 'POST', auth = cookie()) {
    const response = await fetch(base + route, { method, headers: { ...(auth ? { Cookie: auth } : {}),
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }) },
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body) });
    const text = await response.text();
    let json; try { json = JSON.parse(text); } catch { json = null; }
    return { status: response.status, json, text };
  }
  function hostedPage(host, route = '/') {
    // Node fetch normalizes Host; use a raw HTTP request for virtual-host routing tests.
    return new Promise((resolve, reject) => {
      http.get(base + route, { headers: { Host: host } }, (response) => {
        let html = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => { html += chunk; });
        response.on('end', () => resolve(html));
      }).on('error', reject);
    });
  }
  try {
    for (let i = 0; i < 120 && !log.includes('Ready in'); i++) {
      if (server.exitCode !== null) throw new Error(`Server exited: ${log.slice(-2000)}`);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    await require('./security-smoke.cjs')({ call, cookie, base, directory, companyId, other, villa, secret });
    await require('./fallback-mutations-smoke.cjs')({ call, cookie, base, directory, companyId, other, villa });
    await require('./calendar-api-smoke.cjs')({ call, cookie, base, directory, companyId, other, villa, secret });
    {
      const siteRoute = '/api/demo/websites/sites/test-site-a';
      assert.equal((await call(siteRoute, { themeKey: 'kiyi' }, 'PATCH', '')).status, 401);
      assert.equal((await call(siteRoute, { themeKey: 'kiyi' }, 'PATCH', cookie('STAFF'))).status, 403);
      assert.equal((await call(siteRoute, { themeKey: 'kiyi' }, 'PATCH', cookie('ADMIN', other.companyId))).status, 403);
      assert.equal((await call(siteRoute, { themeKey: 'invalid' }, 'PATCH')).status, 400);
      assert.equal((await call(siteRoute, { companyId: other.companyId }, 'PATCH')).status, 400);
      assert.match((await call('/?company=villavera', undefined, 'GET', '')).text, /data-site-theme="secki"/);
      for (const themeKey of ['kiyi', 'rota', 'secki']) {
        const updated = await call(siteRoute, { themeKey }, 'PATCH', cookie('ADMIN'));
        assert.equal(updated.status, 200, updated.text);
        assert.equal(updated.json.website.themeKey, themeKey);
        const home = await call('/?company=villavera', undefined, 'GET', '');
        assert.equal(home.status, 200, home.text.slice(0, 300));
        assert.match(home.text, new RegExp(`data-site-theme="${themeKey}"`));
        assert.doesNotMatch(home.text, /PRIVATE_OWNER_MARKER|PRIVATE_SUPPLIER_MARKER/);
      }
      const savedSites = JSON.parse(await fs.readFile(path.join(directory, 'demo-websites.json'), 'utf8'));
      assert.equal(savedSites.find(site => site.id === 'test-site-a').themeKey, 'secki');
      assert.equal(savedSites.find(site => site.id === 'test-site-b').themeKey, 'rota');
      const otherHome = await call('/?company=sahil-collection', undefined, 'GET', '');
      assert.match(otherHome.text, /data-site-theme="rota"/);
      const hostedText = await hostedPage('b.test', '/?company=villavera');
      assert.match(hostedText, /data-site-theme="rota"/);
      assert.match(hostedText, /Sahil Collection/);
      assert.match(await hostedPage('collection.a.test'), /data-site-theme="kiyi"/);
      assert.match(await hostedPage('a.test', '/villalar'), /rel="canonical" href="https:\/\/a.test\/villalar"/);
      const sitemap = await hostedPage('b.test', '/sitemap.xml');
      assert.match(sitemap, /https:\/\/b.test\/villalar\/other-company-test/);
      assert.doesNotMatch(sitemap, new RegExp(villa.slug));
      assert.match(await hostedPage('b.test', '/robots.txt'), /Disallow: \/panel/);
      const english = await call('/?company=villavera', undefined, 'GET', 'villaweb-locale=en');
      assert.match(english.text, /Beyond the/);
      assert.doesNotMatch(english.text, /Olağanın/);
      const panel = await call('/panel/web-siteleri/site-yonetimi', undefined, 'GET', cookie('ADMIN'));
      assert.equal(panel.status, 200);
      assert.match(panel.text, /Seçili tasarımı uygula/);
      // Next dev includes raw filesystem reads in RSC debug traces, not in rendered UI.
      const panelMarkup = panel.text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
      assert.doesNotMatch(panelMarkup, /Test B/);
      console.log('PASS templates: persistence, three renderers, role/tenant isolation, domain routing, English and panel picker');
    }
    {
      const markup = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
      for (const route of ['/hakkimizda', '/iletisim', '/kampanyalar']) {
        const page = await call(`${route}?company=villavera`, undefined, 'GET', '');
        assert.equal(page.status, 200, page.text.slice(0, 300));
        const visible = markup(page.text);
        assert.match(visible, /data-site-theme="secki"/);
        assert.doesNotMatch(visible, /SEO ve Donusum|Iletisim Formu Yapisi|PRIVATE_OWNER_MARKER|PRIVATE_SUPPLIER_MARKER/);
        const english = await call(`${route}?company=villavera`, undefined, 'GET', 'villaweb-locale=en');
        assert.equal(english.status, 200);
        assert.match(markup(english.text), /Explore the villa collection/);
        const otherPage = await hostedPage('b.test', `${route}?company=villavera`);
        assert.match(markup(otherPage), /Sahil Collection/);
        assert.doesNotMatch(markup(otherPage), /merhaba@villavera.com|VillaVera villa koleksiyonundan/);
      }
      const contact = markup((await call('/iletisim?company=villavera', undefined, 'GET', '')).text);
      assert.match(contact, /href="tel:\+908500000000"/);
      assert.match(contact, /href="mailto:merhaba@villavera.com"/);
      assert.match(contact, /href="https:\/\/wa.me\/905550000000"/);
      assert.match(contact, /href="\/talep\?company=villavera"/);
      assert.match(markup((await call('/kampanyalar?company=villavera', undefined, 'GET', '')).text), /Yeni fırsatlara yer açıyoruz/);
      const offer = { id: 'public-offer', companyId, title: 'PUBLIC_OFFER', villaScope: villa.slug,
        percentOff: 15, startDate: '2099-06-01', endDate: '2099-06-30', active: true,
        note: 'PRIVATE_OFFER_NOTE', createdAt: new Date().toISOString() };
      await fs.writeFile(path.join(directory, 'demo-discounts.json'), JSON.stringify([
        offer, { ...offer, id: 'other-offer', companyId: other.companyId, title: 'FOREIGN_OFFER', villaScope: 'ALL' },
        { ...offer, id: 'expired-offer', title: 'EXPIRED_OFFER', startDate: '2000-01-01', endDate: '2000-01-31' },
        { ...offer, id: 'inactive-offer', title: 'INACTIVE_OFFER', active: false },
      ]));
      const offers = markup((await call('/kampanyalar?company=villavera', undefined, 'GET', '')).text);
      assert.match(offers, /PUBLIC_OFFER/);
      assert.match(offers, /2099-06-01/);
      assert.match(offers, new RegExp(`/villalar/${villa.slug}\\?company=villavera`));
      assert.doesNotMatch(offers, /PRIVATE_OFFER_NOTE|FOREIGN_OFFER|EXPIRED_OFFER|INACTIVE_OFFER/);
      const foreign = markup(await hostedPage('b.test', '/kampanyalar?company=villavera'));
      assert.match(foreign, /FOREIGN_OFFER/);
      assert.doesNotMatch(foreign, /PUBLIC_OFFER|PRIVATE_OFFER_NOTE/);
      await fs.writeFile(path.join(directory, 'demo-discounts.json'), '[]');
      console.log('PASS editorial pages: Secki, bilingual copy, contact links, live offers, empty state and tenant privacy');
    }
    {
      const markup = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
      const { travelGuides } = loadTs('src/lib/travel-journal.ts');
      const routes = ['/blog', '/sss', '/kvkk', '/gizlilik', '/kullanim-kosullari', ...travelGuides.map(guide => `/blog/${guide.slug}`)];
      for (const route of routes) {
        for (const locale of ['tr', 'en']) {
          const page = await call(`${route}?company=villavera`, undefined, 'GET', `villaweb-locale=${locale}`);
          assert.equal(page.status, 200, route);
          const visible = markup(page.text);
          assert.equal((visible.match(/data-site-theme="secki"/g) || []).length, 1, route);
          assert.equal((visible.match(/<h1\b/g) || []).length, 1, route);
          assert.doesNotMatch(visible, /Organik trafik|SEO omurgasi|SEO'yu destekleyen|ikinci fazda/);
        }
        assert.match(markup(await hostedPage('b.test', `${route}?company=villavera`)), /data-site-theme="rota"/);
      }
      const faq = await call('/sss?company=villavera', undefined, 'GET', '');
      const structured = JSON.parse(faq.text.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
      assert.equal(structured.mainEntity.length, 9);
      assert.match(markup(faq.text), /Sorular içinde ara/);
      for (const route of ['/kvkk', '/gizlilik']) {
        assert.match(markup((await call(route, undefined, 'GET', '')).text), /tam metin yayımlanmamıştır/);
      }
      const terms = markup((await call('/kullanim-kosullari?company=villavera', undefined, 'GET', '')).text);
      assert.match(terms, /2026-10/);
      assert.match(terms, /href="\/kvkk\?company=villavera"/);
      const missing = await call('/olmayan-bir-sayfa?company=villavera', undefined, 'GET', '');
      assert.equal(missing.status, 404);
      assert.match(markup(missing.text), /Bu yol burada/);
      assert.equal((markup(missing.text).match(/data-site-theme="secki"/g) || []).length, 1);
      const missingArticle = await call('/blog/olmayan-yazi?company=villavera', undefined, 'GET', '');
      assert.equal(missingArticle.status, 404);
      // Next can deliver a nested not-found boundary in its streamed RSC payload.
      assert.match(missingArticle.text, /Bu yol burada/);
      console.log('PASS remaining public pages: bilingual guides, FAQ schema, legal notice, tenant links and themed 404');
    }
    const periodRoute = `/api/demo/villas/${villa.slug}/pricing-periods`;
    const period = { title: 'Test sezon', startDate: '2027-07-01', endDate: '2027-07-31', nightlyPrice: 2500, cleaningFee: 100, minNightCount: 2 };
    assert.equal((await call(periodRoute, period, 'POST', '')).status, 401);
    assert.equal((await call(periodRoute, period, 'POST', cookie('FINANCE'))).status, 403);
    let response = await call(periodRoute, period);
    assert.equal(response.status, 200, response.text);
    const id = response.json.villa.pricingPeriods[0].id;
    assert.equal((await call(periodRoute, period)).status, 400);
    response = await call(periodRoute, { ...period, id, nightlyPrice: 3000 });
    assert.equal(response.status, 200, response.text);
    assert.equal(response.json.villa.pricingPeriods[0].nightlyPrice, 3000);
    response = await call(periodRoute, { ...period, id, active: false });
    assert.equal(response.json.villa.pricingPeriods[0].active, false);
    response = await call(periodRoute, { pricingPeriodId: id }, 'DELETE');
    assert.equal(response.json.villa.pricingPeriods.length, 0);
    await call(periodRoute, period);
    console.log('PASS seasonal create/edit/disable/overlap and authentication');

    const form = new FormData();
    for (const [key, value] of Object.entries(villa)) if (typeof value === 'string' || typeof value === 'number') form.set(key, String(value));
    for (const key of ['title', 'badge', 'category', 'shortDescription', 'description', 'seoTitle', 'seoDescription', 'focusKeyword', 'coverAlt', 'poolType']) form.set(`${key}En`, `English ${villa[key] || key}`);
    form.set('airportDistanceKm', '55.5'); form.set('latitude', '36.2'); form.set('longitude', '29.4');
    form.set('checkInTime', '16:30'); form.set('checkOutTime', '10:30');
    form.set('electricityFee', '100'); form.set('damageDeposit', '2000');
    form.set('waterFee', '50'); form.set('extraGuestFee', '500'); form.set('extraFeeNotes', 'Test ucret aciklamasi');
    form.set('marketDistanceMeters', '100'); form.set('beachDistanceMeters', '250'); form.set('centerDistanceMeters', '1000');
    form.append('amenities', 'oven'); form.append('amenities', 'wifi');
    form.append('houseRulePresets', 'no-parties'); form.append('suitabilityTags', 'family');
    response = await call(`/api/demo/villas/${villa.slug}`, form, 'PUT');
    assert.equal(response.status, 200, response.text);
    assert.equal(response.json.villa.airportDistanceKm, 55.5);
    assert.equal(response.json.villa.damageDeposit, 2000);
    assert.equal(response.json.villa.marketDistanceMeters, 100);
    assert.equal(response.json.villa.waterFee, 50);
    assert.ok(response.json.villa.houseRulesEn.includes('No parties or events.'));
    form.set('extraFeeNotes', '');
    response = await call(`/api/demo/villas/${villa.slug}`, form, 'PUT');
    assert.equal(response.status, 200, response.text);
    assert.ok(!response.json.villa.extraFeeNotes);
    const publicPage = await call(`/villalar/${villa.slug}`, undefined, 'GET', '');
    assert.equal(publicPage.status, 200);
    assert.doesNotMatch(publicPage.text, /PRIVATE_OWNER_MARKER|PRIVATE_SUPPLIER_MARKER/);
    assert.match(publicPage.text, /55[.,]5/);
    assert.match(publicPage.text, /iframe/);
    assert.match(publicPage.text, /16:30/);
    console.log('PASS villa fields, decimal distance, amenities, bilingual rules and private data boundary');

    const blockRoute = `/api/demo/villas/${villa.slug}/availability`;
    const removable = await call(blockRoute, { startDate: '2027-09-01', endDate: '2027-09-01', status: 'UNAVAILABLE' });
    response = await call(blockRoute, { rangeId: removable.json.villa.availabilityRanges[0].id }, 'DELETE');
    assert.equal(response.status, 200, response.text);
    assert.equal(response.json.villa.availabilityRanges.length, 0);
    response = await call(blockRoute, { startDate: '2027-08-10', endDate: '2027-08-10', status: 'MAINTENANCE', label: 'PRIVATE_CALENDAR_NOTE' });
    assert.equal(response.status, 200, response.text);
    const block = response.json.villa.availabilityRanges[0];
    assert.equal(block.endDate, '2027-08-11');
    const token = createHmac('sha256', secret).update(`${companyId}:${villa.slug}`).digest('base64url');
    const ical = await call(`/api/ical/${companyId}/${villa.slug}?token=${token}`, undefined, 'GET', '');
    assert.equal(ical.status, 200, ical.text);
    assert.match(ical.text, /DTEND;VALUE=DATE:20270811/);
    assert.doesNotMatch(ical.text, /PRIVATE_CALENDAR_NOTE/);
    assert.equal((await call(`/api/ical/${companyId}/${villa.slug}?token=wrong`, undefined, 'GET', '')).status, 403);
    const inquiry = { villaSlug: villa.slug, checkIn: '2027-07-10', checkOut: '2027-07-13', guestCount: 2,
      fullName: 'Smoke Test Guest', phone: '05000000000', email: 'smoke@example.test', termsAccepted: true, termsVersion: '2026-10' };
    {
      const requestUrl = `/talep?company=villavera&villa=${villa.slug}`;
      const markup = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
      const valid = await call(`${requestUrl}&checkIn=2027-07-10&checkOut=2027-07-13`, undefined, 'GET', '');
      assert.equal(valid.status, 200);
      assert.match(markup(valid.text), /name="fullName"/);
      assert.match(markup(valid.text), /KONAKLAMA ÖZETİNİZ/);
      assert.doesNotMatch(valid.text, /PRIVATE_OWNER_MARKER|PRIVATE_SUPPLIER_MARKER/);
      for (const query of ['', '&checkIn=2020-01-01&checkOut=2020-01-04', '&checkIn=2027-08-10&checkOut=2027-08-12', '&checkIn=2027-07-10&checkOut=2027-07-11']) {
        const invalid = await call(requestUrl + query, undefined, 'GET', '');
        assert.equal(invalid.status, 200);
        assert.doesNotMatch(markup(invalid.text), /name="fullName"/);
      }
      const englishRequest = await call(`${requestUrl}&checkIn=2027-07-10&checkOut=2027-07-13`, undefined, 'GET', 'villaweb-locale=en');
      assert.match(markup(englishRequest.text), /YOUR STAY AT A GLANCE/);
      const listing = await call('/villalar?company=villavera&location=TEST-REPORT&checkIn=2027-07-10&checkOut=2027-07-13', undefined, 'GET', '');
      assert.equal(listing.status, 200);
      assert.match(markup(listing.text), /checkIn=2027-07-10/);
      assert.doesNotMatch(markup(listing.text), /other-company-test/);
      const impossible = await call('/villalar?company=villavera&maxPrice=0', undefined, 'GET', '');
      assert.match(markup(impossible.text), /Bu seçimlerle bir villa bulamadık/);
      console.log('PASS Secki stay pages: dates, pricing summary, English, filter results and tenant scope');
    }
    assert.equal((await call('/api/demo/requests', { ...inquiry, termsVersion: 'old' }, 'POST', '')).status, 400);
    assert.equal((await call('/api/demo/requests', { ...inquiry, termsAccepted: false }, 'POST', '')).status, 400);
    assert.equal((await call('/api/demo/requests', { ...inquiry, checkIn: '2027-08-10', checkOut: '2027-08-12' }, 'POST', '')).status, 400);
    assert.equal((await call('/api/demo/requests', { ...inquiry, villaSlug: other.slug }, 'POST', '')).status, 400);
    response = await call('/api/demo/requests', inquiry, 'POST', '');
    assert.equal(response.status, 200, response.text);
    const booking = response.json.request;
    assert.equal(booking.pricing.grandTotal, 7600);
    assert.ok(booking.termsAcceptedAt);
    const pendingBooking = await call(`/rezervasyon/${booking.confirmationToken}`, undefined, 'GET', '');
    assert.equal(pendingBooking.status, 200);
    assert.match(pendingBooking.text, /data-status="pending"/);
    assert.match(pendingBooking.text, /name="robots" content="noindex, nofollow"/);
    assert.match(pendingBooking.text, /name="referrer" content="no-referrer"/);
    console.log('PASS single-day closure, signed iCal, consent, tenant isolation and seasonal quote');

    response = await call(`/api/demo/requests/${booking.id}`, { status: 'APPROVED' }, 'PATCH');
    assert.equal(response.status, 200, response.text);
    const invoices = JSON.parse(await fs.readFile(path.join(directory, 'demo-invoices.json'), 'utf8'));
    const invoice = invoices.find((item) => item.requestId === booking.id);
    assert.ok(invoice);
    assert.equal((await call(`/api/demo/finance/invoices/${invoice.id}`, { status: 'PAID' }, 'PATCH', cookie('STAFF'))).status, 403);
    response = await call(`/api/demo/finance/invoices/${invoice.id}`, { status: 'PAID' }, 'PATCH');
    assert.equal(response.status, 200, response.text);
    const confirmation = await call(`/rezervasyon/${booking.confirmationToken}`, undefined, 'GET', '');
    assert.equal(confirmation.status, 200);
    assert.match(confirmation.text, /data-status="confirmed"/);
    assert.match(confirmation.text, /href="\/iletisim\?company=villavera"/);
    const englishBooking = await call(`/rezervasyon/${booking.confirmationToken}`, undefined, 'GET', 'villaweb-locale=en');
    assert.match(englishBooking.text, /Payment and booking confirmed/);
    assert.match(englishBooking.text, /Print \/ Save PDF/);
    const payments = JSON.parse(await fs.readFile(path.join(directory, 'demo-payments.json'), 'utf8'));
    response = await call(`/api/demo/finance/payments/${payments[0].id}`, { status: 'PENDING' }, 'PATCH');
    assert.equal(response.status, 200, response.text);
    assert.match((await call(`/rezervasyon/${booking.confirmationToken}`, undefined, 'GET', '')).text, /data-status="pending"/);
    await call(`/api/demo/finance/invoices/${invoice.id}`, { status: 'PAID' }, 'PATCH');
    response = await call(`/api/demo/requests/${booking.id}`, { status: 'CANCELLED' }, 'PATCH');
    assert.equal(response.status, 200, response.text);
    assert.match((await call(`/rezervasyon/${booking.confirmationToken}`, undefined, 'GET', '')).text, /Rezervasyon iptal edildi/);
    assert.match((await call(`/rezervasyon/${booking.confirmationToken}`, undefined, 'GET', '')).text, /data-status="cancelled"/);
    console.log('PASS approval -> invoice -> payment -> confirmation -> reversal -> cancellation');
    await require('./panel-tools-smoke.cjs')({ call, cookie, base, directory, companyId, other, villa, booking });
    await require('./workspace-smoke.cjs')({ call, cookie, base, directory, companyId, other, villa, booking });

    if (process.env.PLAYWRIGHT_MODULE) {
      const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
      const browser = await chromium.launch({ headless: true,
        ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
      });
      try {
        const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
        await context.addCookies([{ name: 'villaweb_session', value: cookie().slice('villaweb_session='.length), url: base }]);
        const page = await context.newPage();
        const errors = []; page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
        await page.goto(`${base}/panel`);
        await page.screenshot({ path: path.join(directory, 'dashboard-desktop.png'), caret: 'initial' });
        await page.goto(`${base}/panel/villalar`); await page.screenshot({ path: path.join(directory, 'panel-desktop.png'), fullPage: true, caret: 'initial' });
        assert.equal(await page.locator('h1').innerText(), 'Villalar');
        await page.goto(`${base}/panel/villalar/${villa.slug}/duzenle`);
        await page.screenshot({ path: path.join(directory, 'editor-desktop.png'), caret: 'initial' });
        assert.equal(await page.locator('#villa-periods').count(), 1);
        assert.equal(await page.locator('#villa-calendar').count(), 1);
        await page.goto(`${base}/rezervasyon/${booking.confirmationToken}`);
        await page.emulateMedia({ media: 'print' });
        await page.screenshot({ path: path.join(directory, 'confirmation-print.png'), fullPage: true, caret: 'initial' });
        await page.emulateMedia({ media: 'screen' });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(`${base}/panel/villalar/${villa.slug}/duzenle`);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
        await page.goto(`${base}/panel/villalar`);
        await page.getByRole('button', { name: 'Panel menusu' }).click();
        assert.ok(await page.locator('#panel-navigation-links').isVisible());
        await page.getByRole('button', { name: 'Panel menusu' }).click();
        await page.screenshot({ path: path.join(directory, 'panel-mobile.png'), fullPage: true, caret: 'initial' });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
        await fs.writeFile(path.join(directory, 'browser-errors.json'), JSON.stringify(errors, null, 2));
        assert.equal(errors.length, 0, `Browser errors: ${directory}/browser-errors.json`);
        console.log('PASS desktop/mobile layout, navigation and browser runtime');
      } finally { await browser.close(); }
    }
    console.log(`Smoke checks passed. Artifacts: ${directory}`);
  } finally {
    server.kill('SIGTERM');
    await fs.writeFile(path.join(directory, 'server.log'), log);
    console.log(`Test log: ${directory}/server.log`);
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
