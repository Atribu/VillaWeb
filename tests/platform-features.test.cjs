const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { loadTs, loadTsWithMocks } = require('./load-ts.cjs');
const { parsePackage, parseSiteContent, DEFAULT_PACKAGE, rate } = loadTs('src/lib/platform-features.ts');
const { nightlyPeriodPrice, validatePricingPeriod } = loadTs('src/lib/villa-pricing-periods.ts');
const { getResolvedStayPricing } = loadTs('src/lib/demo-operations.ts');
const { seedVillaCatalog } = loadTs('src/lib/villa-catalog.ts');
const otp = loadTs('src/lib/auth/totp.ts');

test('package limits validate finite integers and known modules without granting role permissions', () => {
  assert.equal(parsePackage(DEFAULT_PACKAGE).users, null);
  for (const users of [0, -1, 1.5, Infinity, NaN, '4', undefined]) assert.throws(() => parsePackage({ ...DEFAULT_PACKAGE, users }));
  assert.throws(() => parsePackage({ ...DEFAULT_PACKAGE, modules: ['super-admin'] }));
  assert.equal(rate(1, 0), null); assert.equal(rate(1, 4), 25);
});
test('site drafts reject script URLs, protocol-relative logos and invalid domains', () => {
  const site = { themeKey: 'secki', heroTitle: 'Hello', logoUrl: '', domain: 'example.com', email: 'test@example.com' };
  assert.equal(parseSiteContent(site).heroTitle, 'Hello');
  for (const logoUrl of ['javascript:alert(1)', '//evil.test/x.png', '/uploads/a.svg']) assert.throws(() => parseSiteContent({ ...site, logoUrl }));
  for (const domain of ['https://example.com', 'a.test/path', 'a.test@evil.test']) assert.throws(() => parseSiteContent({ ...site, domain }));
});
test('advanced pricing uses Fri/Sat nights, lead time, cents and best-of campaign without stacking', () => {
  const period = { id: 'p', title: 'season', active: true, startDate: '2030-01-01', endDate: '2030-12-31', nightlyPrice: 1000, weekendPercent: 20, earlyBookingDays: 30, earlyBookingPercent: 10, minNightCount: 4 };
  const friday = '2030-06-07';
  assert.equal(nightlyPeriodPrice(period, 500, friday, friday, '2030-01-01').price, 1080);
  assert.equal(nightlyPeriodPrice(period, 500, '2030-06-09', friday, friday).price, 1000);
  const villa = { ...seedVillaCatalog[0], nightlyPrice: 1000, cleaningFee: 0, pricingPeriods: [period] };
  const pricing = getResolvedStayPricing({ villa, pricingRecords: [], discounts: [], coupons: [], checkIn: friday, checkOut: '2030-06-09', bookingDate: '2030-01-01' }).pricing;
  assert.equal(pricing.subtotal, 2400); assert.equal(pricing.grandTotal, 2160); assert.equal(pricing.discountedNightlyPrice, 1080);
  assert.throws(() => validatePricingPeriod({ ...period, earlyBookingDays: 0 }, []));
  assert.throws(() => validatePricingPeriod({ ...period, weekendPercent: -100 }, []));
});
test('TOTP matches RFC6238 vectors, rejects replay, malformed input and older windows', () => {
  const secret = otp.base32(Buffer.from('12345678901234567890'));
  assert.equal(otp.totp(secret, Math.floor(59 / 30), 8), '94287082');
  assert.equal(otp.totp(secret, Math.floor(1111111109 / 30), 8), '07081804');
  const now = 1800000000000, step = Math.floor(now / 30000), code = otp.totp(secret, step);
  assert.equal(otp.matchTotp(secret, code, step - 1, now), step);
  assert.equal(otp.matchTotp(secret, code, step, now), null);
  assert.equal(otp.matchTotp(secret, code, -1, now + 90000), null);
  assert.equal(otp.matchTotp(secret, '12345', -1, now), null);
});
test('MFA encryption binds secrets to the user and rejects tampering', () => {
  process.env.MFA_ENCRYPTION_KEY = '12'.repeat(32);
  const ciphertext = otp.sealSecret('PRIVATE_SECRET', 'user-a');
  assert.equal(otp.openSecret(ciphertext, 'user-a'), 'PRIVATE_SECRET');
  assert.throws(() => otp.openSecret(ciphertext, 'user-b'));
  assert.throws(() => otp.openSecret(ciphertext.slice(0, -4) + 'AAAA', 'user-a'));
  assert.notEqual(otp.recoveryHash('a', 'code'), otp.recoveryHash('b', 'code'));
});
test('traffic attribution persists only categories, never arbitrary URLs or campaign text', () => {
  const { inferTrafficSource } = loadTs('src/lib/traffic-attribution.ts');
  assert.equal(inferTrafficSource('?utm_medium=email&email=private@example.com', '', 'https://a.test'), 'EMAIL');
  assert.equal(inferTrafficSource('', 'https://www.google.com/search?q=private', 'https://a.test'), 'SEARCH');
  assert.equal(inferTrafficSource('', 'https://a.test/private', 'https://a.test'), 'DIRECT');
  assert.equal(inferTrafficSource('', 'https://google.com.evil.test', 'https://a.test'), 'REFERRAL');
});
test('MFA enrollment verifies password/code, stores encrypted state, persists lockouts and single-use recovery', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'villa-mfa-'));
  const before = { mode: process.env.DEV_FALLBACK_MODE, data: process.env.DEV_DATA_DIRECTORY };
  process.env.DEV_FALLBACK_MODE = 'true'; process.env.DEV_DATA_DIRECTORY = directory;
  const actor = { id: 'mfa-owner', username: 'mfa-owner', role: 'SUPER_ADMIN' };
  let revocations = 0;
  const service = loadTsWithMocks('src/lib/server/second-factor.ts', {
    '@/lib/db': { db: {} }, '@/lib/auth/server-session': { getUserSession: async () => actor },
    '@/lib/auth/users': { validateUser: async (_u, password) => password === 'correct' ? { ok: true, user: actor } : { ok: false } },
    '@/lib/auth/development-auth': { updateDevelopmentAuth: async update => { const data = { sessions: [{ userId: actor.id }] }; update(data); revocations += data.sessions.length === 0 ? 1 : 0; } },
  });
  try {
    await assert.rejects(service.manageFactor('begin', 'wrong'));
    const enrollment = await service.manageFactor('begin', 'correct');
    assert.equal(await service.factorEnabled(actor.id), false);
    const step = Math.floor(Date.now() / 30000);
    const result = await service.manageFactor('confirm', 'correct', otp.totp(enrollment.secret, step));
    assert.equal(result.recoveryCodes.length, 8); assert.equal(revocations, 1);
    assert.equal(await service.factorEnabled(actor.id), true);
    assert.equal(await service.verifyLoginFactor(actor.id, otp.totp(enrollment.secret, step)), false);
    assert.equal(await service.verifyLoginFactor(actor.id, result.recoveryCodes[0]), true);
    assert.equal(await service.verifyLoginFactor(actor.id, result.recoveryCodes[0]), false);
    for (let i = 0; i < 5; i++) assert.equal(await service.verifyLoginFactor(actor.id, 'invalid'), false);
    assert.equal(await service.verifyLoginFactor(actor.id, result.recoveryCodes[1]), false, 'recovery must not bypass lockout');
    const saved = await fs.readFile(path.join(directory, 'second-factor.json'), 'utf8');
    assert.ok(!saved.includes(enrollment.secret)); assert.ok(!saved.includes(result.recoveryCodes[0]));
  } finally {
    if (before.mode === undefined) delete process.env.DEV_FALLBACK_MODE; else process.env.DEV_FALLBACK_MODE = before.mode;
    if (before.data === undefined) delete process.env.DEV_DATA_DIRECTORY; else process.env.DEV_DATA_DIRECTORY = before.data;
    await fs.rm(directory, { recursive: true });
  }
});
