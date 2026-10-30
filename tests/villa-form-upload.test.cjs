const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');
const { uploadVillaForm } = loadTs('src/lib/villa-form-upload.ts');

function mockRequest(t) {
  const previous = global.XMLHttpRequest;
  let request;
  global.XMLHttpRequest = class {
    constructor() { this.upload = {}; request = this; }
    open(method, url) { this.method = method; this.url = url; }
    send(body) { this.body = body; }
  };
  t.after(() => { if (previous) global.XMLHttpRequest = previous; else delete global.XMLHttpRequest; });
  return () => request;
}

test('multipart upload preserves fields and reports actual byte progress', async (t) => {
  const get = mockRequest(t);
  const values = [];
  const form = new FormData(); form.set('title', 'Test');
  const pending = uploadVillaForm('/api/demo/villas', 'POST', form, (v) => values.push(v));
  const request = get();
  assert.equal(request.method, 'POST'); assert.equal(request.body, form);
  request.upload.onprogress({ lengthComputable: true, loaded: 20, total: 100 });
  request.upload.onprogress({ lengthComputable: true, loaded: 100, total: 100 });
  request.status = 201; request.statusText = 'Created'; request.responseText = '{"villa":{"title":"Test"}}'; request.onload();
  const response = await pending;
  assert.equal(response.status, 201); assert.equal((await response.json()).villa.title, 'Test');
  assert.deepEqual(values, [20, 100]);
});

test('upload preserves API errors and rejects network failures', async (t) => {
  const get = mockRequest(t);
  const pending = uploadVillaForm('/api/demo/villas/test', 'PUT', new FormData(), () => {});
  const request = get(); request.status = 500; request.statusText = ''; request.responseText = '{"error":"failed"}'; request.onload();
  const response = await pending; assert.equal(response.ok, false); assert.equal((await response.json()).error, 'failed');
  const failed = uploadVillaForm('/api/demo/villas', 'POST', new FormData(), () => {});
  get().onerror(); await assert.rejects(failed, /connection/);
});
