/**
 * schem_converter.js — UI du 5ᵉ outil : Minecraft schem → .bloxdschem
 * Déposez un .schem (Sponge), .schematic (MCEdit) ou .litematic (Litematica),
 * l'outil le convertit en .bloxdschem (découpe automatique en ZIP si > 160 chunks).
 *
 * Logique de conversion : schem_converter-core.js (basé sur M2B & hansdiewurst).
 * Bilingue+ (lit bloxdTools.lang), clavier ZQSD/WASD partagé (bloxdTools.keyboard).
 */
(function () {
'use strict';

// ─── i18n ───
const LANG_KEY = 'bloxdTools.lang';
const KB_KEY = 'bloxdTools.keyboard';
const MC_MAP_KEY = 'bloxdTools.mcMap';   // correspondances manuelles { mc_name: bloxd_name }

const T = {
    en: {
        import: 'Import Minecraft schem', mappings: 'Mappings', download: 'Download',
        drop: 'Drop .schem / .schematic / .litematic here',
        dims: 'Dimensions', blocks: 'blocks', chunks: 'chunks',
        single_file: '1 .bloxdschem file', parts_zip: 'part(s) → ZIP (Bloxd 160-chunk limit)',
        unmapped: 'block type(s) without Bloxd equivalent → Dirt', adjust: 'Adjust mappings',
        map_title: 'Block mappings',
        map_note: 'These Minecraft blocks have no Bloxd equivalent and were replaced with Dirt. Choose a Bloxd block for each (the choice is remembered), then re-convert.',
        map_placeholder: 'Bloxd block name…', reset: 'Reset', close: 'Close', save_reconvert: 'Save & re-convert',
        no_unknown: 'No unmapped block — everything has a Bloxd equivalent. ✔',
        err_read: 'Unreadable file', err_format: 'Unrecognized format (expected .schem, .schematic or .litematic)',
        err_toobig: 'Too large for Bloxd: {n} chunks (max ~160 per file, Y/Z cannot be split)',
        converted: 'converted', nothing: 'Nothing loaded',
        preview_too_big: 'Preview hidden (too many faces)',
        attribution: 'Conversion logic & block mappings from M2B (RealSlothuLT3) and hansdiewurst/converter',
        guide: 'Schem parts exported by Schem Converter. Import them all at once in Schem Placer: they are re-merged automatically using the _x…_z… offsets in the file names.',
    },
    fr: {
        import: 'Importer schem Minecraft', mappings: 'Correspondances', download: 'Télécharger',
        drop: 'Déposez votre .schem / .schematic / .litematic ici',
        dims: 'Dimensions', blocks: 'blocs', chunks: 'chunks',
        single_file: '1 fichier .bloxdschem', parts_zip: 'partie(s) → ZIP (limite de 160 chunks Bloxd)',
        unmapped: 'type(s) de bloc sans équivalent Bloxd → Dirt', adjust: 'Ajuster les correspondances',
        map_title: 'Correspondances de blocs',
        map_note: 'Ces blocs Minecraft n\'ont pas d\'équivalent Bloxd et ont été remplacés par de la Dirt. Choisissez un bloc Bloxd pour chacun (le choix est mémorisé), puis re-convertissez.',
        map_placeholder: 'Nom du bloc Bloxd…', reset: 'Réinitialiser', close: 'Fermer', save_reconvert: 'Enregistrer & re-convertir',
        no_unknown: 'Aucun bloc sans équivalent — tout est converti. ✔',
        err_read: 'Fichier illisible', err_format: 'Format non reconnu (attendu .schem, .schematic ou .litematic)',
        err_toobig: 'Trop grand pour Bloxd : {n} chunks (max ~160 par fichier, Y/Z non fractionnables)',
        converted: 'converti', nothing: 'Rien de chargé',
        preview_too_big: 'Aperçu masqué (trop de faces)',
        attribution: 'Logique de conversion et tables de blocs issues de M2B (RealSlothuLT3) et hansdiewurst/converter',
        guide: 'Parties de schem exportées par Schem Converter. Importez-les toutes en même temps dans Schem Placer : elles sont refusionnées automatiquement grâce aux offsets _x…_z… des noms de fichiers.',
    },
    ja: {
        import: 'Minecraft スケマをインポート', mappings: 'ブロック対応', download: 'ダウンロード',
        drop: '.schem / .schematic / .litematic をドロップ',
        dims: 'サイズ', blocks: 'ブロック', chunks: 'チャンク',
        single_file: '.bloxdschem 1ファイル', parts_zip: '分割 → ZIP（Bloxdの160チャンク制限）',
        unmapped: '対応するBloxdブロックがないタイプ → Dirt', adjust: '対応を調整',
        map_title: 'ブロック対応',
        map_note: 'これらのMinecraftブロックにはBloxdでの対応がなくDirtに置き換えられました。それぞれBloxdブロックを選択（保存されます）して再変換してください。',
        map_placeholder: 'Bloxdブロック名…', reset: 'リセット', close: '閉じる', save_reconvert: '保存して再変換',
        no_unknown: '未対応ブロックなし — すべて変換済み ✔',
        err_read: '読み込み失敗', err_format: '未対応の形式（.schem / .schematic / .litematic のみ）',
        err_toobig: 'Bloxdには大きすぎます：{n}チャンク（1ファイル最大約160、Y/Z分割不可）',
        converted: '変換済み', nothing: '未読込',
        preview_too_big: 'プレビュー非表示（面が多すぎ）',
        attribution: '変換ロジック・ブロック表：M2B (RealSlothuLT3) と hansdiewurst/converter より',
        guide: 'Schem Converterが分割出力したパーツ。Schem Placerにまとめてインポートすると、ファイル名の _x…_z… オフセットで自動再結合されます。',
    },
    ko: {
        import: '마인크래프트 스케매 가져오기', mappings: '블록 매핑', download: '내려받기',
        drop: '.schem / .schematic / .litematic 파일을 드롭',
        dims: '크기', blocks: '블록', chunks: '청크',
        single_file: '.bloxdschem 1개 파일', parts_zip: '분할 → ZIP (Bloxd 160청크 제한)',
        unmapped: 'Bloxd 대응 블록 없는 유형 → Dirt', adjust: '매핑 조정',
        map_title: '블록 매핑',
        map_note: '이 마인크래프트 블록들은 Bloxd 대응이 없어 Dirt로 대체되었습니다. 각각 Bloxd 블록을 선택(저장됨)한 뒤 다시 변환하세요.',
        map_placeholder: 'Bloxd 블록 이름…', reset: '초기화', close: '닫기', save_reconvert: '저장 후 다시 변환',
        no_unknown: '매핑 안 된 블록 없음 — 모두 변환됨 ✔',
        err_read: '읽을 수 없는 파일', err_format: '인식할 수 없는 형식 (.schem / .schematic / .litematic 필요)',
        err_toobig: 'Bloxd에 너무 큼: {n}청크 (파일당 최대 약 160, Y/Z 분할 불가)',
        converted: '변환됨', nothing: '로드 없음',
        preview_too_big: '미리보기 숨김 (면이 너무 많음)',
        attribution: '변환 로직·블록 표: M2B (RealSlothuLT3) 및 hansdiewurst/converter',
        guide: 'Schem Converter가 분할 출력한 파트입니다. Schem Placer에 모두 가져오면 파일명의 _x…_z… 오프셋으로 자동 병합됩니다.',
    },
    th: {
        import: 'นำเข้าสเคม Minecraft', mappings: 'การจับคู่บล็อก', download: 'ดาวน์โหลด',
        drop: 'วางไฟล์ .schem / .schematic / .litematic ที่นี่',
        dims: 'ขนาด', blocks: 'บล็อก', chunks: 'ชังก์',
        single_file: 'ไฟล์ .bloxdschem 1 ไฟล์', parts_zip: 'ส่วน → ZIP (จำกัด 160 ชังก์ต่อไฟล์)',
        unmapped: 'ชนิดบล็อกที่ไม่มีตัวเทียบใน Bloxd → Dirt', adjust: 'ปรับการจับคู่',
        map_title: 'การจับคู่บล็อก',
        map_note: 'บล็อก Minecraft เหล่านี้ไม่มีตัวเทียบใน Bloxd จึงถูกแทนด้วย Dirt เลือกบล็อก Bloxd สำหรับแต่ละอัน (จะจดจำไว้) แล้วแปลงใหม่',
        map_placeholder: 'ชื่อบล็อก Bloxd…', reset: 'รีเซ็ต', close: 'ปิด', save_reconvert: 'บันทึก & แปลงใหม่',
        no_unknown: 'ไม่มีบล็อกที่ไม่ถูกแมป — แปลงครบแล้ว ✔',
        err_read: 'อ่านไฟล์ไม่ได้', err_format: 'รูปแบบไม่รู้จัก (ต้องเป็น .schem, .schematic หรือ .litematic)',
        err_toobig: 'ใหญ่เกินไปสำหรับ Bloxd: {n} ชังก์ (สูงสุด ~160 ต่อไฟล์, แยก Y/Z ไม่ได้)',
        converted: 'แปลงแล้ว', nothing: 'ยังไม่โหลด',
        preview_too_big: 'ซ่อนพรีวิว (หน้าเยอะเกิน)',
        attribution: 'ตรรกะการแปลงและตารางบล็อกจาก M2B (RealSlothuLT3) และ hansdiewurst/converter',
        guide: 'ชิ้นส่วนสเคมที่ Schem Converter แยกออก นำเข้าทั้งหมดใน Schem Placer จะรวมกลับอัตโนมัติด้วยออฟเซ็ต _x…_z… ในชื่อไฟล์',
    },
};
function t(k) {
    const l = (typeof localStorage !== 'undefined' && localStorage.getItem(LANG_KEY)) || 'en';
    return (T[l] || T.en)[k] || (T.en[k] || k);
}
function fmt(s, vars) {
    return String(s).replace(/\{(\w+)\}/g, (_, n) => vars[n] !== undefined ? vars[n] : '{' + n + '}');
}

// ─── État ───
let RESULTS = [];        // [{ name, format, result, parts, error }]
let selected = -1;       // index du résultat affiché dans l'aperçu
let NAME_TO_ID = null, ID_TO_NAME = {};
let USER_MAP = {};
let mapsReady = false;

const $ = id => document.getElementById(id);
const panel = () => $('info-panel');

function loadUserMap() {
    try { USER_MAP = JSON.parse(localStorage.getItem(MC_MAP_KEY) || '{}') || {}; }
    catch (e) { USER_MAP = {}; }
}
function saveUserMap() {
    try { localStorage.setItem(MC_MAP_KEY, JSON.stringify(USER_MAP)); } catch (e) {}
}

// ─── Couleurs de blocs (aperçu 3D) ───
// Palette partagée avec le Schem Placer (block_colors.js) ; repli heuristique
// si le module n'a pas pu être chargé.
const _hasSharedColors = typeof BloxdBlockColors !== 'undefined';
function blockColorHex(id) {
    if (_hasSharedColors) return BloxdBlockColors.hex(id);
    // repli minimal (ne devrait pas arriver : block_colors.js est local)
    const name = (ID_TO_NAME[id] || '').toLowerCase();
    if (name.includes('grass') || name.includes('leaves')) return '#4ea64e';
    if (name.includes('dirt')) return '#6e4b2a';
    if (name.includes('stone')) return '#7d7d7d';
    if (name.includes('sand')) return '#e0d190';
    if (name.includes('glass')) return '#bcd8e8';
    if (name.includes('water')) return '#3d6edb';
    let h = id; h = ((h >>> 16) ^ h) * 0x45d9f3b; h = ((h >>> 16) ^ h) * 0x45d9f3b; h = (h >>> 16) ^ h;
    const v = 0x60 + (h & 0x3f);
    return '#' + [v, v, v].map(x => x.toString(16).padStart(2, '0')).join('');
}
function hexToRGB(hex) {
    return [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];
}

// ─── Aperçu 3D (Babylon) ───
let engine, scene, camera, previewMesh = null;
const FACES = [
    { d: [1, 0, 0], c: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], n: [1, 0, 0] },
    { d: [-1, 0, 0], c: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]], n: [-1, 0, 0] },
    { d: [0, 1, 0], c: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]], n: [0, 1, 0] },
    { d: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], n: [0, -1, 0] },
    { d: [0, 0, 1], c: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]], n: [0, 0, 1] },
    { d: [0, 0, -1], c: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]], n: [0, 0, -1] },
];
const FACE_CAP = 1600000;
let buildJob = null;

function initPreview() {
    const canvas = $('converter-canvas');
    if (typeof BABYLON === 'undefined') return;
    engine = new BABYLON.Engine(canvas, true, { powerPreference: 'high-performance' }, true);
    engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 1.5));
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.07, 0.08, 0.1, 1);
    camera = new BABYLON.ArcRotateCamera('cam', -Math.PI / 3, Math.PI / 3.2, 30, new BABYLON.Vector3(4, 2, 4), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 2; camera.upperRadiusLimit = 900;
    camera.wheelPrecision = 12; camera.panningSensibility = 40;
    const light = new BABYLON.HemisphericLight('l1', new BABYLON.Vector3(0.3, 1, 0.2), scene);
    light.intensity = 1.05;
    const l2 = new BABYLON.HemisphericLight('l2', new BABYLON.Vector3(-0.4, -0.5, -0.3), scene);
    l2.intensity = 0.35;
    engine.runRenderLoop(() => {
        applyFlyKeys();
        if (buildJob) processBuildJob();
        scene.render();
    });
    window.addEventListener('resize', () => engine.resize());
}

function clearPreview() {
    if (previewMesh) { previewMesh.dispose(); previewMesh = null; }
    buildJob = null;
}

function showPreview(result) {
    clearPreview();
    if (!scene || !result || result.error) return;
    const grid = result.grid;
    const isSolid = (x, y, z) => {
        if (x < 0 || y < 0 || z < 0 || x >= grid.width || y >= grid.height || z >= grid.length) return false;
        const cx = x >> 5, cy = y >> 5, cz = z >> 5;
        const a = grid.chunks[cx + ',' + cy + ',' + cz];
        if (!a) return false;
        return a[((x & 31) << 10) + ((y & 31) << 5) + (z & 31)] !== 0;
    };
    const keys = Object.keys(grid.chunks);
    buildJob = { grid, isSolid, keys, ki: 0, pos: [], nor: [], col: [], idx: [], base: 0, faces: 0, tooBig: false, done: false };
    // cadre caméra
    const cxm = grid.width / 2, cym = grid.height / 2, czm = grid.length / 2;
    camera.target.set(cxm, cym, czm);
    camera.radius = Math.max(grid.width, grid.height, grid.length) * 1.35 + 4;
}

const COLOR_CACHE = {};
function colorFor(id) {
    let c = COLOR_CACHE[id];
    if (!c) {
        // IMPORTANT : couleurs de sommets Babylon = RGBA (4 composantes, alpha=1)
        const rgb = _hasSharedColors ? BloxdBlockColors.rgb(id) : hexToRGB(blockColorHex(id));
        c = [rgb[0], rgb[1], rgb[2], 1];
        COLOR_CACHE[id] = c;
    }
    return c;
}

function processBuildJob() {
    const j = buildJob;
    const t0 = performance.now();
    while (j.ki < j.keys.length && performance.now() - t0 < 12) {
        const key = j.keys[j.ki++];
        const p = key.split(','), cx = +p[0], cy = +p[1], cz = +p[2];
        const arr = j.grid.chunks[key];
        for (let lx = 0; lx < 32; lx++) for (let ly = 0; ly < 32; ly++) for (let lz = 0; lz < 32; lz++) {
            const id = arr[(lx << 10) + (ly << 5) + lz];
            if (id === 0) continue;
            const x = cx * 32 + lx, y = cy * 32 + ly, z = cz * 32 + lz;
            const col = colorFor(id);
            for (const f of FACES) {
                if (j.isSolid(x + f.d[0], y + f.d[1], z + f.d[2])) continue;
                if (j.faces >= FACE_CAP) { j.tooBig = true; j.done = true; finalizeMesh(j); return; }
                const P = j.pos, N = j.nor, C = j.col, I = j.idx, b = j.base;
                for (const corner of f.c) { P.push(x + corner[0], y + corner[1], z + corner[2]); N.push(f.n[0], f.n[1], f.n[2]); C.push(col[0], col[1], col[2], col[3]); }
                I.push(b, b + 1, b + 2, b, b + 2, b + 3);
                j.base += 4; j.faces += 2;
            }
        }
    }
    if (j.ki >= j.keys.length) { j.done = true; finalizeMesh(j); }
}

function finalizeMesh(j) {
    buildJob = null;
    if (j.faces === 0) return;
    const mesh = new BABYLON.Mesh('preview', scene);
    const vd = new BABYLON.VertexData();
    vd.positions = j.pos; vd.normals = j.nor; vd.colors = j.col; vd.indices = j.idx;
    BABYLON.VertexData.ComputeNormals(vd.positions, vd.indices, vd.normals);
    vd.applyToMesh(mesh);
    const mat = new BABYLON.StandardMaterial('m', scene);
    mat.specularColor = new BABYLON.Color3(0.04, 0.04, 0.04);
    mat.backFaceCulling = false;
    mat.useVertexColors = true;      // comme le Schem Splitter
    mesh.material = mat;
    previewMesh = mesh;
    if (j.tooBig) consoleWarn(t('preview_too_big'));
}

// ─── Caméra : vol clavier (ZQSD/WASD selon le réglage partagé) ───
const keysDown = {};
function isTyping() {
    const el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');
}
window.addEventListener('keydown', e => {
    if (isTyping()) return;
    keysDown[e.key.toLowerCase()] = true;
    if (e.key === ' ') e.preventDefault();
});
window.addEventListener('keyup', e => { keysDown[e.key.toLowerCase()] = false; });
window.addEventListener('blur', () => { for (const k in keysDown) keysDown[k] = false; });

function applyFlyKeys() {
    if (!camera) return;
    const kb = (localStorage.getItem(KB_KEY) || 'azerty') === 'qwerty' ? 'qwerty' : 'azerty';
    const fwd = kb === 'qwerty' ? 'w' : 'z';
    const left = kb === 'qwerty' ? 'a' : 'q';
    const back = 's', right = 'd';
    const speed = (keysDown['shift'] ? 1.6 : 0.55) * Math.max(2, camera.radius * 0.12);
    let mx = 0, mz = 0;
    if (keysDown[fwd] || keysDown['arrowup']) mz += 1;
    if (keysDown[back] || keysDown['arrowdown']) mz -= 1;
    if (keysDown[left] || keysDown['arrowleft']) mx -= 1;
    if (keysDown[right] || keysDown['arrowright']) mx += 1;
    let my = 0;
    if (keysDown[' ']) my += 1;
    if (keysDown['control'] || keysDown['c']) my -= 1;
    if (!mx && !my && !mz) return;
    const dir = camera.getDirection(new BABYLON.Vector3(0, 0, 1));
    const dirXZ = new BABYLON.Vector3(dir.x, 0, dir.z).normalize();
    const rightXZ = new BABYLON.Vector3(dirXZ.z, 0, -dirXZ.x);
    camera.target.addInPlace(dirXZ.scale(mz * speed));
    camera.target.addInPlace(rightXZ.scale(-mx * speed));
    camera.target.y += my * speed;
}

// ─── Conversion ───
async function convertFile(file) {
    const base = file.name.replace(/\.[^.]+$/, '');
    try {
        const buf = new Uint8Array(await file.arrayBuffer());
        const result = await BloxdSchemConverter.convertBytes(buf, base, { userMap: USER_MAP });
        // garde-fou taille (comme Schem Placer : > 100 000 chunks refusé)
        const nCX = Math.ceil(result.width / 32), nCY = Math.ceil(result.height / 32), nCZ = Math.ceil(result.length / 32);
        if (nCX * nCY * nCZ > 100000) throw new Error(fmt(t('err_toobig'), { n: nCX * nCY * nCZ }));
        // Y/Z trop grands pour être découpés : erreur claire
        if (nCY * nCZ > 160) throw new Error(fmt(t('err_toobig'), { n: nCX * nCY * nCZ }));
        const parts = BloxdSchemConverter.buildOutputs(result);
        // enlève des "unknown" ceux qui ont un mapping utilisateur
        for (const k in result.unknown) if (USER_MAP[k]) delete result.unknown[k];
        RESULTS.push({ name: base, displayName: file.name, file, result, parts });
        selected = RESULTS.length - 1;
        showPreview(result);
    } catch (e) {
        console.error(e);
        let msg = (e && e.message) || String(e);
        if (/Format non reconnu|not a valid|Pas un fichier NBT/i.test(msg)) msg = t('err_format');
        RESULTS.push({ name: base, displayName: file.name, error: true, message: msg });
    }
    renderPanel();
}

function reconvertAll() {
    const files = RESULTS.filter(r => !r.error).map(r => r.file);
    RESULTS = [];
    selected = -1;
    clearPreview();
    let chain = Promise.resolve();
    for (const f of files) chain = chain.then(() => convertFile(f));
}

// ─── Panneau d'infos ───
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function renderPanel() {
    const p = panel();
    if (!RESULTS.length) { p.innerHTML = ''; p.style.display = 'none'; $('btn-download').disabled = true; return; }
    let html = '';
    RESULTS.forEach((r, i) => {
        if (r.error) {
            html += `<div class="file-block"><div class="file-name">📁 ${esc(r.displayName || r.name)}</div>
                <div class="file-meta" style="color:var(--danger)">✗ ${esc(r.message)}</div></div>`;
            return;
        }
        const res = r.result, parts = r.parts;
        const nChunks = Math.ceil(res.width / 32) * Math.ceil(res.height / 32) * Math.ceil(res.length / 32);
        const nUnknown = Object.keys(res.unknown).length;
        const active = i === selected ? ' style="outline:1px solid var(--accent)"' : '';
        html += `<div class="file-block" data-sel="${i}" style="cursor:pointer"${active}>
            <div class="file-name">📁 ${esc(r.displayName || r.name)}<span class="badge ok">${res.format}</span></div>
            <div class="file-meta"><b>${t('dims')}:</b> ${res.width} × ${res.height} × ${res.length} · 🧱 <b>${res.totalBlocks.toLocaleString()}</b> ${t('blocks')} · ${nChunks} ${t('chunks')}</div>
            <div class="file-meta">${parts.length === 1 ? '📄 ' + t('single_file') : '📦 <b>' + parts.length + '</b> ' + t('parts_zip')}</div>`;
        if (nUnknown > 0) {
            html += `<div class="warn-line">⚠ <b>${nUnknown}</b> ${t('unmapped')} — <a data-adjust="1">${t('adjust')}</a></div>`;
        }
        html += `</div>`;
    });
    html += `<div class="attribution">${t('attribution')}<br>
        <a href="https://github.com/Quentin-X/M2B" target="_blank" rel="noopener">Quentin-X/M2B</a> ·
        <a href="https://github.com/hansdiewurst/converter" target="_blank" rel="noopener">hansdiewurst/converter</a></div>`;
    p.innerHTML = html;
    p.style.display = 'block';

    p.querySelectorAll('[data-sel]').forEach(el => {
        el.addEventListener('click', () => {
            const r = RESULTS[+el.dataset.sel];
            if (r && !r.error) { selected = +el.dataset.sel; showPreview(r.result); renderPanel(); }
        });
    });
    p.querySelectorAll('[data-adjust]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); openMappingModal(); }));

    const hasOutput = RESULTS.some(r => !r.error);
    $('btn-download').disabled = !hasOutput;
    const dlCount = RESULTS.filter(r => !r.error).length;
    $('lbl-download').textContent = t('download') + (dlCount > 1 || (RESULTS[0] && RESULTS[0].parts && RESULTS[0].parts.length > 1) ? ' (ZIP)' : '');
}

function consoleWarn(msg) {
    // simple : dans le panneau s'il existe
    const p = panel();
    if (p) {
        const d = document.createElement('div');
        d.className = 'warn-line';
        d.textContent = '⚠ ' + msg;
        p.prepend(d);
        setTimeout(() => d.remove(), 6000);
    }
}

// ─── Téléchargement ───
function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function downloadAll() {
    const ok = RESULTS.filter(r => !r.error);
    if (!ok.length) return;
    const allParts = [];
    for (const r of ok) for (const p of r.parts) allParts.push(p);
    if (ok.length === 1 && allParts.length === 1) {
        downloadBlob(new Blob([allParts[0].bytes], { type: 'application/octet-stream' }), allParts[0].filename);
        return;
    }
    if (typeof JSZip === 'undefined') { alert('JSZip indisponible (CDN)'); return; }
    const zip = new JSZip();
    const lines = [t('guide'), ''];
    const used = {};
    for (const p of allParts) {
        let fn = p.filename;
        if (used[fn]) { const m = fn.match(/^(.*?)(\.bloxdschem)$/); fn = m[1] + '_' + (used[fn] + 1) + m[2]; }
        used[p.filename] = (used[p.filename] || 0) + 1;
        zip.file(fn, p.bytes);
        if (allParts.length > 1) lines.push('  • ' + fn + ' → offset (' + p.ox + ', 0, ' + p.oz + ')');
    }
    if (allParts.length > 1) zip.file('GUIDE.txt', lines.join('\n'));
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    downloadBlob(blob, (ok.length === 1 ? ok[0].name : 'bloxd_schems') + '.zip');
}

// ─── Modale mappings ───
let datalistBuilt = false;
function buildDatalist() {
    if (datalistBuilt) return;
    const dl = document.createElement('datalist');
    dl.id = 'bloxd-names';
    const names = Object.keys(NAME_TO_ID).sort((a, b) => a.localeCompare(b));
    for (const n of names) {
        const o = document.createElement('option');
        o.value = n;
        dl.appendChild(o);
    }
    document.body.appendChild(dl);
    datalistBuilt = true;
}

function currentUnknown() {
    const merged = {};
    for (const r of RESULTS) {
        if (r.error) continue;
        for (const k in r.result.unknown) merged[k] = (merged[k] || 0) + r.result.unknown[k];
    }
    return merged;
}

function openMappingModal() {
    buildDatalist();
    const unknown = currentUnknown();
    const list = $('map-list');
    const entries = Object.entries(unknown).sort((a, b) => b[1] - a[1]);
    if (!entries.length) {
        list.innerHTML = '<div class="map-note" style="color:var(--accent-2)">' + t('no_unknown') + '</div>';
    } else {
        list.innerHTML = entries.map(([mc, n]) => `
            <div class="map-row">
                <span class="mc" title="${esc(mc)}">${esc(mc)}</span>
                <span class="cnt">×${n}</span>
                <span class="arrow">→</span>
                <input data-mc="${esc(mc)}" list="bloxd-names" value="${esc(USER_MAP[mc] || 'Dirt')}" placeholder="${t('map_placeholder')}">
            </div>`).join('');
    }
    $('lbl-map-note').textContent = t('map_note');
    $('mapping-modal').classList.add('active');
}

function saveMappings() {
    $('map-list').querySelectorAll('input[data-mc]').forEach(inp => {
        const mc = inp.dataset.mc, v = inp.value.trim();
        if (v && NAME_TO_ID[v] !== undefined) USER_MAP[mc] = v;
        else delete USER_MAP[mc];
    });
    saveUserMap();
    BloxdSchemConverter.setUserMap(USER_MAP);
    $('mapping-modal').classList.remove('active');
    reconvertAll();
}

// ─── Boot ───
async function boot() {
    // libellés i18n
    $('lbl-import').textContent = t('import');
    $('lbl-mappings').textContent = t('mappings');
    $('lbl-download').textContent = t('download');
    $('drop-msg').textContent = '📥 ' + t('drop');
    $('lbl-map-title').textContent = t('map_title');
    $('lbl-map-reset').textContent = t('reset');
    $('lbl-map-close').textContent = t('close');
    $('lbl-map-save').textContent = t('save_reconvert');

    loadUserMap();

    // charge les tables (mappings M2B + blocs Bloxd)
    try {
        const [mapRes, ntiRes] = await Promise.all([
            fetch('schem_converter-map.json', { cache: 'force-cache' }),
            fetch('nameToId.json', { cache: 'force-cache' })
        ]);
        if (!mapRes.ok || !ntiRes.ok) throw new Error('HTTP');
        const map = await mapRes.json();
        NAME_TO_ID = await ntiRes.json();
        for (const k in NAME_TO_ID) if (ID_TO_NAME[NAME_TO_ID[k]] === undefined) ID_TO_NAME[NAME_TO_ID[k]] = k;
        // palette de couleurs partagée avec le Schem Placer (aperçu 3D identique)
        if (typeof BloxdBlockColors !== 'undefined') BloxdBlockColors.init(NAME_TO_ID);
        BloxdSchemConverter.init({ map, nameToId: NAME_TO_ID, userMap: USER_MAP });
        mapsReady = true;
    } catch (e) {
        console.error(e);
        panel().innerHTML = '<div class="warn-line" style="color:var(--danger)">⚠ schem_converter-map.json / nameToId.json introuvables — ' + esc(e.message) + '</div>';
        panel().style.display = 'block';
    }

    initPreview();

    // import : bouton
    $('btn-import').addEventListener('click', () => $('file-input').click());
    $('file-input').addEventListener('change', e => {
        for (const f of e.target.files) convertFile(f);
        e.target.value = '';
    });

    // import : glisser-déposer
    const overlay = $('drop-overlay');
    let dragCount = 0;
    window.addEventListener('dragenter', e => { e.preventDefault(); dragCount++; overlay.classList.add('active'); });
    window.addEventListener('dragleave', e => { e.preventDefault(); if (--dragCount <= 0) { dragCount = 0; overlay.classList.remove('active'); } });
    window.addEventListener('dragover', e => e.preventDefault());
    window.addEventListener('drop', e => {
        e.preventDefault(); dragCount = 0; overlay.classList.remove('active');
        if (!mapsReady) return;
        for (const f of e.dataTransfer.files) convertFile(f);
    });

    $('btn-download').addEventListener('click', downloadAll);
    $('btn-mappings').addEventListener('click', openMappingModal);
    $('btn-map-close').addEventListener('click', () => $('mapping-modal').classList.remove('active'));
    $('btn-map-save').addEventListener('click', saveMappings);
    $('btn-map-reset').addEventListener('click', () => {
        USER_MAP = {}; saveUserMap(); BloxdSchemConverter.setUserMap({});
        $('mapping-modal').classList.remove('active');
        reconvertAll();
    });
    $('mapping-modal').addEventListener('click', e => { if (e.target === $('mapping-modal')) $('mapping-modal').classList.remove('active'); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') $('mapping-modal').classList.remove('active'); });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();
