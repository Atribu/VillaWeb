const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');
const { SITE_TEMPLATES, resolveSiteTemplate, normalizeSiteHost, selectCompanyWebsite, canManageWebsite, parseWebsiteUpdate } = loadTs('src/lib/site-templates.ts');
const { validSearchStay } = loadTs('src/lib/public-search.ts');

test('three reusable templates and a safe Secki default for legacy records', () => {
  assert.deepEqual(SITE_TEMPLATES.map(t => t.id), ['secki', 'kiyi', 'rota']);
  for (const value of [null, undefined, '', 'marketplace-core', 'unknown', '__proto__']) assert.equal(resolveSiteTemplate(value), 'secki');
  for (const {id} of SITE_TEMPLATES) assert.equal(resolveSiteTemplate(id), id);
});

test('website resolution is scoped to the company and prefers the exact domain', () => {
  const sites = [
    {id:'a-main',companyId:'a',domain:'a.example',default:true,themeKey:'secki'},
    {id:'a-micro',companyId:'a',domain:'https://collection.a.example/',default:false,themeKey:'kiyi'},
    {id:'b-main',companyId:'b',domain:'b.example',default:true,themeKey:'rota'},
  ];
  assert.equal(selectCompanyWebsite(sites, 'a', 'collection.a.example:3000').id, 'a-micro');
  assert.equal(selectCompanyWebsite(sites, 'a', 'b.example').id, 'a-main');
  assert.equal(selectCompanyWebsite(sites, 'b', 'localhost:3000').themeKey, 'rota');
  assert.equal(selectCompanyWebsite(sites, 'unknown', 'a.example'), null);
  assert.equal(normalizeSiteHost('https://EXAMPLE.com/'), 'example.com');
  assert.equal(normalizeSiteHost('example.com,evil.example'), '');
  assert.equal(normalizeSiteHost('user@example.com'), '');
});

test('only super admin or the owning company admin may change a template', () => {
  assert.equal(canManageWebsite('SUPER_ADMIN', undefined, 'a'), true);
  assert.equal(canManageWebsite('ADMIN', 'a', 'a'), true);
  assert.equal(canManageWebsite('ADMIN', 'b', 'a'), false);
  assert.equal(canManageWebsite('ADMIN', undefined, 'a'), false);
  for (const role of ['STAFF', 'FINANCE', 'AGENT', 'VISITOR']) assert.equal(canManageWebsite(role, 'a', 'a'), false);
});

test('website patches validate types and reject unknown fields and theme injection', () => {
  assert.deepEqual(parseWebsiteUpdate({themeKey:'rota'}), {themeKey:'rota'});
  assert.deepEqual(parseWebsiteUpdate({default:true,status:'LIVE'}), {default:true,status:'LIVE'});
  for (const input of [null, [], {}, {themeKey:null}, {themeKey:'../../private'}, {themeKey:['secki']}, {status:['LIVE']}, {default:'true'}, {companyId:'other'}, {themeKey:'secki', id:'other'}]) {
    assert.throws(() => parseWebsiteUpdate(input));
  }
});

test('public home search permits browsing without dates, not partial or invalid stays', () => {
  assert.equal(validSearchStay('', '', '2027-01-01'), true);
  assert.equal(validSearchStay('2027-03-01', '2027-03-03', '2027-01-01'), true);
  for (const [start, end] of [['2027-03-01',''], ['', '2027-03-02'], ['2027-03-01','2027-03-01'], ['2027-02-30','2027-03-05'], ['2026-12-31','2027-01-05']]) {
    assert.equal(validSearchStay(start,end,'2027-01-01'), false);
  }
});
