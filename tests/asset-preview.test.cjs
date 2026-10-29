const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
const noop = () => {};
const context = { console, setTimeout, clearTimeout, TextDecoder, TextEncoder, addEventListener: noop };
context.window = context;
context.document = { addEventListener: noop };
vm.createContext(context);
for (const file of ['asset_placer-core.js', 'asset_placer-ui.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

function canvas() {
    const fills = [];
    let points = [];
    const ctx = {
        clearRect: noop, beginPath() { points = []; },
        moveTo(x, y) { points.push([x, y]); }, lineTo(x, y) { points.push([x, y]); },
        closePath: noop, fill() { fills.push({ points, color: this.fillStyle }); }
    };
    return { width: 440, height: 340, getContext: () => ctx, fills };
}

test('isometric preview draws only exposed faces, in block colors, without mutating the schematic', () => {
    const ui = Object.create(context.LibraryUI.prototype);
    context.BlockColors.getBlockColor = () => 0x804020;
    const blocks = [{x: 0, y: 0, z: 0, id: 1}, {x: 1, y: 0, z: 0, id: 1}];
    const output = canvas();
    assert.equal(ui._drawPreview(output, { blocks }), true);
    assert.equal(output.fills.length, 5);
    assert.deepEqual(blocks.map(b => b.x), [0, 1]);
    assert.ok(output.fills.every(f => f.points.every(([x, y]) => x >= 0 && x <= 440 && y >= 0 && y <= 340)));
    assert.equal(new Set(output.fills.map(f => f.color)).size, 3);
    assert.equal(ui._drawPreview(canvas(), { blocks: [] }), false);
});

test('real schematic parses and fits in preview', () => {
    const ui = Object.create(context.LibraryUI.prototype);
    const buf = fs.readFileSync(path.join(root, 'schems/house001.bloxdschem'));
    const bytes = new Uint8Array(buf);
    const schem = context.BloxdIO.parseSchemToBlockList(bytes.buffer);
    const output = canvas();
    assert.ok(schem.blocks.length > 0);
    assert.equal(ui._drawPreview(output, schem), true);
    assert.ok(output.fills.length > 0);
    assert.ok(output.fills.every(f => f.points.every(([x, y]) => x >= 0 && x <= 440 && y >= 0 && y <= 340)));
});

test('hover starts a delayed preview, leaving, scrolling and touching do not show it', async () => {
    const handlers = {};
    const grid = { addEventListener(type, cb) { handlers[type] = cb; } };
    const ui = Object.create(context.LibraryUI.prototype);
    let shown = 0;
    ui._showPreview = () => { shown++; };
    const card = { dataset: { asset: 'house001' }, contains: () => false, closest: () => card };
    ui._ensureGridDelegation(grid);
    handlers.pointerover({ target: card, pointerType: 'touch' });
    assert.equal(ui._previewCard, undefined);
    handlers.pointerover({ target: card, pointerType: 'mouse' });
    handlers.pointerout({ target: card, relatedTarget: null });
    await new Promise(r => setTimeout(r, 200));
    assert.equal(shown, 0);
    handlers.pointerover({ target: card, pointerType: 'mouse' });
    await new Promise(r => setTimeout(r, 200));
    assert.equal(shown, 1);
    handlers.scroll();
    assert.equal(ui._previewCard, null);
});

test('a load finishing after the pointer leaves cannot reopen the preview', async () => {
    const nameEl = {};
    const status = {};
    const image = canvas();
    const preview = {
        hidden: true, style: {}, offsetWidth: 240, offsetHeight: 200,
        querySelector(selector) {
            return selector === 'canvas' ? image : selector === '.asset-preview-status' ? status : nameEl;
        }
    };
    context.document.getElementById = () => null;
    context.innerWidth = 900;
    context.innerHeight = 700;
    context.I18N = { t: key => key };
    let resolveLoad;
    context.appSchematicLibraryLoader = { ensureTemplateLoaded: () => new Promise(resolve => { resolveLoad = resolve; }) };
    const ui = Object.create(context.LibraryUI.prototype);
    ui._previewEl = preview;
    ui.assetManager = { getTemplateSchem: () => ({ blocks: [{ x: 0, y: 0, z: 0, id: 1 }] }) };
    const card = { dataset: { asset: 'house001' }, isConnected: true, getBoundingClientRect: () => ({right: 200, left: 100, top: 80}) };
    // Initial lookup reports no data; after loading the data exists.
    let loaded = false;
    ui.assetManager.getTemplateSchem = () => loaded ? { blocks: [{ x: 0, y: 0, z: 0, id: 1 }] } : null;
    ui._previewCard = card;
    const pending = ui._showPreview(card);
    assert.equal(preview.hidden, false);
    ui._hidePreview();
    loaded = true;
    resolveLoad(true);
    await pending;
    assert.equal(preview.hidden, true);
    assert.equal(image.fills.length, 0);
});
