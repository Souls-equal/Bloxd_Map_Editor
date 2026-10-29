const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function loadWorker(fetch, cache) {
    const context = {
        self: { addEventListener() {}, location: { origin: 'https://example.test' } },
        caches: { open: async () => cache }, fetch, Request, URL, console
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8'), context);
    return context;
}

test('code requests revalidate the HTTP cache instead of serving a fresh stale script', async () => {
    let request, written;
    const response = { ok: true, type: 'basic', clone() { return this; } };
    const worker = loadWorker(async req => { request = req; return response; }, {
        put: async (req, res) => { written = { req, res }; }
    });
    const original = new Request('https://example.test/asset_placer-ui.js');
    assert.equal(await worker.networkFirst(original), response);
    assert.equal(request.cache, 'no-cache');
    assert.equal(request.url, original.url);
    assert.equal(written.req, original);
});

test('code still falls back to the service worker cache when offline', async () => {
    const cached = { body: 'offline copy' };
    const worker = loadWorker(async () => { throw new Error('offline'); }, { match: async () => cached });
    assert.equal(await worker.networkFirst(new Request('https://example.test/asset_placer-ui.js')), cached);
});
