const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');
const root = path.join(__dirname, '..');
const noop = () => {};
const context = { console, performance, setTimeout, clearTimeout, TextDecoder, TextEncoder, addEventListener: noop };
context.BABYLON = { VertexData: { CreateBox: () => ({ positions: [], indices: [], normals: [] }) } };
context.window = context;
context.document = { addEventListener: noop };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'schem_placer-preview.js'), 'utf8'), context);
// Accès au parseur réel dans son IIFE, sans lancer le navigateur ni Babylon.
let placer = fs.readFileSync(path.join(root, 'schem_placer.js'), 'utf8');
const last = placer.lastIndexOf('})();');
placer = placer.slice(0, last) + 'window.__parseSchemForTest = parseSchem;\n' + placer.slice(last);
vm.runInContext(placer, context);

function canvas() {
    const fills = [];
    let points = [];
    const ctx = { clearRect: noop, beginPath() { points = []; },
        moveTo(x,y) { points.push([x,y]); }, lineTo(x,y) { points.push([x,y]); }, closePath: noop,
        fill() { fills.push({ points, color: this.fillStyle }); } };
    return { width: 440, height: 340, fills, getContext: () => ctx };
}
function schematic(blocks) {
    const chunks = new Map();
    for (const [x,y,z,id] of blocks) {
        const cx = Math.floor(x / 32), cy = Math.floor(y / 32), cz = Math.floor(z / 32);
        const key = `${cx},${cy},${cz}`;
        if (!chunks.has(key)) chunks.set(key, new Int32Array(32768));
        chunks.get(key)[(x - cx*32)*1024 + (y - cy*32)*32 + z - cz*32] = id;
    }
    return { blocks: chunks, totalBlocks: blocks.length, aabb: {
        minX: Math.min(...blocks.map(b => b[0])), maxX: Math.max(...blocks.map(b => b[0])),
        minY: Math.min(...blocks.map(b => b[1])), maxY: Math.max(...blocks.map(b => b[1])),
        minZ: Math.min(...blocks.map(b => b[2])), maxZ: Math.max(...blocks.map(b => b[2]))
    } };
}

test('fixed-angle preview respects block colors and occlusion across chunk boundaries', async () => {
    context.BloxdBlockColors = { hex: () => 0x804020 };
    const output = canvas();
    assert.equal(await context.SchemHoverPreview.draw(output, schematic([[31,0,0,1],[32,0,0,1]]), () => true), true);
    assert.equal(output.fills.length, 5);
    assert.equal(new Set(output.fills.map(f => f.color)).size, 3);
    assert.ok(output.fills.every(f => f.points.every(([x,y]) => x >= 0 && x <= 440 && y >= 0 && y <= 340)));
});

test('renders a real imported bloxdschem, independent of the editor camera', async () => {
    const bytes = fs.readFileSync(path.join(root, 'schems/house001.bloxdschem'));
    const schem = context.__parseSchemForTest(new Uint8Array(bytes));
    const a = canvas(), b = canvas();
    assert.equal(await context.SchemHoverPreview.draw(a, schem, () => true), true);
    assert.equal(await context.SchemHoverPreview.draw(b, schem, () => true), true);
    assert.ok(a.fills.length > 0);
    assert.deepEqual(a.fills, b.fills);
});

test('large sparse schematics retain isolated blocks when aggregated', async () => {
    const output = canvas();
    assert.equal(await context.SchemHoverPreview.draw(output, schematic([[0,0,0,1],[1000,0,1000,2]]), () => true), true);
    assert.equal(output.fills.length, 6);
});

test('hover is delayed, touch does not activate it and leaving cancels it', async () => {
    const handlers = {};
    const list = { addEventListener: noop };
    const item = { addEventListener(type, fn) { handlers[type] = fn; } };
    const hover = new context.SchemHoverPreview(list, {}, key => key);
    let shown = 0;
    hover.show = () => { shown++; };
    hover.attach(item, {});
    handlers.pointerenter({ pointerType: 'touch' });
    assert.equal(hover.instance, null);
    handlers.pointerenter({ pointerType: 'mouse' });
    handlers.pointerleave();
    await new Promise(r => setTimeout(r, 210));
    assert.equal(shown, 0);
    handlers.pointerenter({ pointerType: 'mouse' });
    await new Promise(r => setTimeout(r, 210));
    assert.equal(shown, 1);
    handlers.pointerleave();
    assert.equal(hover.instance, null);
});

test('cancelled render does not display an image', async () => {
    const output = canvas();
    assert.equal(await context.SchemHoverPreview.draw(output, schematic([[0,0,0,1]]), () => false), false);
    assert.equal(output.fills.length, 0);
});
