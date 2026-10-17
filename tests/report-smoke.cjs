/* End-to-end checks run against isolated JSON fixtures and a local development server. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { createHmac } = require('node:crypto');
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
    'demo-invoices.json': [], 'demo-payments.json': [], 'demo-operation-tasks.json': [], 'demo-region-airports.json': [] };
  for (const [name, value] of Object.entries(files)) await fs.writeFile(path.join(directory, name), JSON.stringify(value));
  const port = process.env.SMOKE_PORT || '3012';
  const base = `http://localhost:${port}`;
  const secret = 'isolated-report-smoke-secret';
  function cookie(role = 'SUPER_ADMIN', id = companyId) {
    const body = Buffer.from(JSON.stringify({ id: 'test-user', username: 'test', displayName: 'Test Yoneticisi', role,
      companyId: id, companyName: 'Test Firma', expiresAt: Date.now() + 3600000 })).toString('base64url');
    return `villaweb_session=${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
  }
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--port', port], {
    cwd: path.resolve(__dirname, '..'), env: { ...process.env, DEV_FALLBACK_MODE: 'true', DEV_DATA_DIRECTORY: directory,
      SESSION_SECRET: secret, ICAL_SIGNING_SECRET: secret }, stdio: ['ignore', 'pipe', 'pipe'],
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
  try {
    for (let i = 0; i < 120 && !log.includes('Ready in'); i++) {
      if (server.exitCode !== null) throw new Error(`Server exited: ${log.slice(-2000)}`);
      await new Promise((resolve) => setTimeout(resolve, 250));
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
    assert.equal((await call('/api/demo/requests', { ...inquiry, termsVersion: 'old' }, 'POST', '')).status, 400);
    assert.equal((await call('/api/demo/requests', { ...inquiry, termsAccepted: false }, 'POST', '')).status, 400);
    assert.equal((await call('/api/demo/requests', { ...inquiry, checkIn: '2027-08-10', checkOut: '2027-08-12' }, 'POST', '')).status, 400);
    assert.equal((await call('/api/demo/requests', { ...inquiry, villaSlug: other.slug }, 'POST', '')).status, 400);
    response = await call('/api/demo/requests', inquiry, 'POST', '');
    assert.equal(response.status, 200, response.text);
    const booking = response.json.request;
    assert.equal(booking.pricing.grandTotal, 7600);
    assert.ok(booking.termsAcceptedAt);
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
    assert.match(confirmation.text, /rezervasyonun onaylandi/);
    const payments = JSON.parse(await fs.readFile(path.join(directory, 'demo-payments.json'), 'utf8'));
    response = await call(`/api/demo/finance/payments/${payments[0].id}`, { status: 'PENDING' }, 'PATCH');
    assert.equal(response.status, 200, response.text);
    assert.doesNotMatch((await call(`/rezervasyon/${booking.confirmationToken}`, undefined, 'GET', '')).text, /rezervasyonun onaylandi/);
    await call(`/api/demo/finance/invoices/${invoice.id}`, { status: 'PAID' }, 'PATCH');
    response = await call(`/api/demo/requests/${booking.id}`, { status: 'CANCELLED' }, 'PATCH');
    assert.equal(response.status, 200, response.text);
    assert.match((await call(`/rezervasyon/${booking.confirmationToken}`, undefined, 'GET', '')).text, /Rezervasyon iptal edildi/);
    console.log('PASS approval -> invoice -> payment -> confirmation -> reversal -> cancellation');

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
