const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { loadTs } = require('./load-ts.cjs');

module.exports = async function fallbackMutationSmoke({ call, cookie, base, directory, companyId, other, villa }) {
  const cases = [
    ['settings', 'seedDemoCurrencyRates', 'demo-currency-rates.json', 'settings/currencies', { sellRate: 99 }],
    ['settings', 'seedDemoCacheGroups', 'demo-cache-groups.json', 'settings/cache-groups', { ttlMinutes: 44 }],
    ['settings', 'seedDemoDocuments', 'demo-documents.json', 'settings/documents', { status: 'DRAFT' }],
    ['definitions', 'seedDemoRegionAirportRecords', 'demo-region-airports.json', 'definitions/regions', { status: 'PASSIVE' }],
    ['definitions', 'seedDemoParameterGroups', 'demo-parameter-groups.json', 'definitions/parameter-groups', { status: 'PASSIVE' }],
    ['websites', 'seedDemoLandingPages', 'demo-landing-pages.json', 'websites/landings', { status: 'REVISION' }],
    ['websites', 'seedDemoSeoContents', 'demo-seo-contents.json', 'websites/seo-content', { status: 'IN_PROGRESS', seoScore: 84 }],
    ['users-messages', 'seedDemoAgencies', 'demo-agencies.json', 'users-messages/agencies', { status: 'PAUSED' }],
    ['users-messages', 'seedDemoBranches', 'demo-branches.json', 'users-messages/branches', { status: 'PAUSED' }],
    ['users-messages', 'seedDemoInternalMessages', 'demo-internal-messages.json', 'users-messages/messages', { status: 'READ' }],
    ['users-messages', 'seedDemoCommissionRates', 'demo-commission-rates.json', 'users-messages/commissions', { percent: 17 }],
    ['crm', 'seedDemoReviews', 'demo-reviews.json', 'crm/reviews', { status: 'HIDDEN' }],
    ['external-links', 'seedDemoShortcuts', 'demo-shortcuts.json', 'external-links/shortcuts', { status: 'HIDDEN' }],
    ['external-links', 'seedDemoExternalServices', 'demo-external-services.json', 'external-links/services', { status: 'OFFLINE' }],
    ['external-links', 'seedDemoDocumentLinks', 'demo-document-links.json', 'external-links/document-links', { status: 'ARCHIVED' }],
  ];
  for (const [module, seed, filename, route, patch] of cases) {
    const records = loadTs(`src/lib/demo-${module}.ts`)[seed].map(record => ({ ...record, companyId }));
    await fs.writeFile(path.join(directory, filename), JSON.stringify(records));
    const id = records[0].id;
    const response = await call(`/api/demo/${route}/${id}`, patch, 'PATCH', cookie('ADMIN'));
    assert.equal(response.status, 200, `${route}: ${response.text}`);
    const saved = JSON.parse(await fs.readFile(path.join(directory, filename), 'utf8')).find(record => record.id === id);
    for (const [key, value] of Object.entries(patch)) assert.equal(saved[key], value, `${route}.${key}`);
    if (module !== 'settings') assert.equal((await call(`/api/demo/${route}/${id}`, patch, 'PATCH', cookie('ADMIN', other.companyId))).status, 403, route);
  }
  let response = await call('/api/demo/settings/defaults', { leadResponseMinutes: 33, supportEmail: 'test@a.invalid' }, 'PATCH', cookie('ADMIN'));
  assert.equal(response.status, 200, response.text);
  assert.equal(response.json.defaults.leadResponseMinutes, 33);
  response = await call('/api/demo/settings/defaults', { leadResponseMinutes: 51 }, 'PATCH', cookie('ADMIN', other.companyId));
  assert.equal(response.status, 200, response.text);
  const defaults = JSON.parse(await fs.readFile(path.join(directory, 'demo-system-defaults.json'), 'utf8'));
  assert.equal(defaults[companyId].leadResponseMinutes, 33);
  assert.equal(defaults[other.companyId].leadResponseMinutes, 51);
  const branches = JSON.parse(await fs.readFile(path.join(directory, 'demo-branches.json'), 'utf8'));
  response = await call('/api/demo/users-messages/users', { fullName: 'Login Test', username: 'login-test', email: 'login-test@test.invalid',
    phone: '5551112233', password: 'isolated-password-123', roleId: 'SALES', status: 'ACTIVE', branchId: branches[0].id }, 'POST', cookie('ADMIN'));
  assert.equal(response.status, 200, response.text);
  const loginHtml = (await call('/panel/giris', undefined, 'GET', '')).text;
  const loginForm = new FormData();
  const decode = value => value.replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>');
  for (const [input] of loginHtml.matchAll(/<input\b[^>]*type="hidden"[^>]*>/g)) {
    const name = input.match(/name="([^"]+)"/)?.[1];
    if (name?.startsWith('$ACTION')) loginForm.set(decode(name), decode(input.match(/value="([^"]*)"/)?.[1] ?? ''));
  }
  loginForm.set('companyName', 'villavera'); loginForm.set('username', 'login-test'); loginForm.set('password', 'isolated-password-123');
  const signedIn = await fetch(base + '/panel/giris', { method: 'POST', headers: { Origin: base }, body: loginForm, redirect: 'manual' });
  assert.equal(signedIn.status, 303, (await signedIn.text()).slice(0, 500));
  const sessionCookie = signedIn.headers.getSetCookie().find(value => value.startsWith('villaweb_session='))?.split(';')[0];
  assert.ok(sessionCookie, 'Successful login persists a registered session');
  const panel = await call('/panel/talepler', undefined, 'GET', sessionCookie);
  assert.equal(panel.status, 200);
  const logoutAction = panel.text.match(/name="(\$ACTION_ID_[^"]+)"/)?.[1];
  assert.ok(logoutAction);
  const logoutForm = new FormData(); logoutForm.set(logoutAction, '');
  const signedOut = await fetch(base + '/panel/talepler', { method: 'POST', headers: { Origin: base, Cookie: sessionCookie }, body: logoutForm, redirect: 'manual' });
  assert.equal(signedOut.status, 303);
  assert.equal((await call('/api/demo/requests/missing', {}, 'PATCH', sessionCookie)).status, 401, 'Logout invalidates replayed cookies on the server');
  response = await call('/api/demo/pricing', { villaSlug: villa.slug, baseNightlyPrice: 1500, cleaningFee: 50, minNightCount: 2 }, 'POST', cookie('ADMIN'));
  assert.equal(response.status, 200, response.text);
  const offer = { title: 'CRUD test', villaScope: villa.slug, percentOff: 10, startDate: '2099-01-01', endDate: '2099-12-31', active: true, note: 'Test', code: 'CRUDTEST', usageLimit: 5 };
  for (const kind of ['discounts', 'coupons']) {
    response = await call(`/api/demo/${kind}`, offer, 'POST', cookie('ADMIN'));
    assert.equal(response.status, 200, response.text);
    const records = JSON.parse(await fs.readFile(path.join(directory, `demo-${kind}.json`), 'utf8'));
    const record = records.find(item => item.title === offer.title);
    assert.ok(record);
    assert.equal((await call(`/api/demo/${kind}/${record.id}`, { active: false }, 'PATCH', cookie('ADMIN'))).status, 200);
    assert.equal((await call(`/api/demo/${kind}/${record.id}`, { villaScope: villa.slug }, 'DELETE', cookie('ADMIN'))).status, 200);
    assert.ok(!JSON.parse(await fs.readFile(path.join(directory, `demo-${kind}.json`), 'utf8')).some(item => item.id === record.id));
  }
  response = await call('/api/demo/finance/cashbook', { direction: 'INCOME', category: 'Test', title: 'CRUD cash', amount: 500, date: '2026-10-27' }, 'POST', cookie('FINANCE'));
  assert.equal(response.status, 200, response.text);
  assert.equal((await call(`/api/demo/finance/cashbook/${response.json.entry.id}`, undefined, 'DELETE', cookie('FINANCE'))).status, 200);
  response = await call('/api/demo/calendar-sync/sources', { villaId: villa.id, channelName: 'Network protection', direction: 'IMPORT', sourceUrl: 'https://calendar.example.org/test.ics' }, 'POST');
  assert.equal(response.status, 200, response.text);
  const sourceId = response.json.source.id;
  const sources = JSON.parse(await fs.readFile(path.join(directory, 'demo-ical-sources.json')));
  sources.find(source => source.id === sourceId).sourceUrl = 'http://127.0.0.1/legacy-unsafe-feed';
  await fs.writeFile(path.join(directory, 'demo-ical-sources.json'), JSON.stringify(sources));
  response = await call(`/api/demo/calendar-sync/sources/${sourceId}/sync`, undefined, 'POST');
  assert.equal(response.status, 400, response.text);
  assert.match(response.json.error, /Yerel adresler/);
  assert.equal((await call(`/api/demo/calendar-sync/sources/${sourceId}`, { status: 'HEALTHY' }, 'PATCH')).status, 400);
  await fs.writeFile(path.join(directory, 'demo-pricing.json'), '[]');
  console.log('PASS local writes: settings, content, definitions, users/messages, real login/logout, reviews, links, prices, coupons, campaigns, cashbook and honest sync status');
};
