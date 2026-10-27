const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');
const { filterVillas, readVillaFilters, villaFilterHref } = loadTs('src/lib/villa-filters.ts');
const { getDemoCompanySiteHref } = loadTs('src/lib/demo-companies.ts');
const today = '2027-01-01';
const base = { title:'Kas Evi', titleEn:'Coast House', city:'Kaş', district:'Kalkan', locationLabel:'Kalkan, Kaş', shortCode:'SV-1', category:'Balayı', categoryEn:'Honeymoon', poolType:'Özel havuz', poolTypeEn:'Private pool', capacity:4, nightlyPrice:2000, minNightCount:2, featured:true, availabilityRanges:[], pricingPeriods:[] };
const villas = [{...base,id:'a',discountedNightlyPrice:1500}, {...base,id:'b',shortCode:'SV-2',capacity:8,nightlyPrice:1000,featured:false,poolType:'Ortak havuz',poolTypeEn:'Shared pool',category:'Aile',categoryEn:'Family'}];
const run = (params, catalog=villas) => filterVillas(catalog,readVillaFilters(params),today);
test('filters combine multilingual location, capacity, pool, category and effective price', () => {
  assert.deepEqual(run({location:'kas',guests:'4',pool:'private pool',category:'honeymoon',minPrice:'1500',maxPrice:'1500'}).villas.map(v=>v.id),['a']);
  assert.equal(run({location:'SV-2',guests:'8'}).villas[0].id,'b');
  assert.equal(run({location:'Coast',guests:'9'}).villas.length,0);
  assert.equal(run({maxPrice:'0'}).villas.length,0);
});
test('sorting does not mutate the catalogue and malformed inputs are normalized', () => {
  assert.deepEqual(run({sort:'price-asc'}).villas.map(v=>v.id),['b','a']);
  assert.deepEqual(run({sort:'capacity'}).villas.map(v=>v.id),['b','a']);
  assert.deepEqual(villas.map(v=>v.id),['a','b']);
  assert.equal(readVillaFilters({location:['Kas','Bodrum'],guests:'-3',minPrice:'NaN',sort:'bad'}).location,'Kas');
  assert.equal(readVillaFilters({guests:'-3'}).guests,'');
  assert.equal(run({minPrice:'3000',maxPrice:'1000'}).invalidBudget,true);
});
test('invalid dates never silently return unfiltered villas', () => {
  for(const [checkIn,checkOut] of [['2027-02-30','2027-03-05'],['2027-03-01',''],['2026-12-31','2027-01-05'],['2027-03-03','2027-03-01']]) {
    const result=run({checkIn,checkOut}); assert.equal(result.invalidDates,true); assert.equal(result.villas.length,0);
  }
});
test('availability and seasonal minimum stays determine date search results', () => {
  const catalog=[{...base,id:'a',availabilityRanges:[{startDate:'2027-07-10',endDate:'2027-07-13',status:'BOOKED'}],pricingPeriods:[{active:true,startDate:'2027-07-01',endDate:'2027-07-31',minNightCount:5}]}];
  assert.equal(run({checkIn:'2027-07-01',checkOut:'2027-07-04'},catalog).villas.length,0);
  assert.equal(run({checkIn:'2027-07-01',checkOut:'2027-07-06'},catalog).villas.length,1);
  assert.equal(run({checkIn:'2027-07-08',checkOut:'2027-07-15'},catalog).villas.length,0);
  assert.equal(run({checkIn:'2027-07-13',checkOut:'2027-07-18'},catalog).villas.length,1);
});
test('filter removal and company links preserve unrelated dates, query and anchors', () => {
  const url=new URL(villaFilterHref('firma-a',readVillaFilters({location:'Kaş',checkIn:'2027-03-01',checkOut:'2027-03-04',pool:'Özel havuz'}),['checkIn','checkOut']),'https://example.test');
  assert.equal(url.searchParams.get('company'),'firma-a'); assert.equal(url.searchParams.get('pool'),'Özel havuz'); assert.equal(url.searchParams.has('checkIn'),false);
  const inquiry=new URL(getDemoCompanySiteHref('firma a','/talep?villa=coast&checkIn=2027-03-01#form'),'https://example.test');
  assert.equal(inquiry.searchParams.get('company'),'firma a'); assert.equal(inquiry.searchParams.get('villa'),'coast'); assert.equal(inquiry.hash,'#form');
});
