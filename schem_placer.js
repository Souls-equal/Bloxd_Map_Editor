/**
 * Schem Placer - Main Application (Babylon.js)
 * Parsage, instances, UI, export, presets, i18n
 */

(function() {
'use strict';

/* =====================================================
   CONSTANTES
   ===================================================== */
const CHUNK = 32;
const CHUNK_VOL = CHUNK * CHUNK * CHUNK;
const AIR_ID = 0;
const SNAP_THRESHOLD = 2;

/* =====================================================
   HELPERS DOM
   ===================================================== */
function $(sel, ctx) { return (ctx || document).querySelector(sel); }
function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

/* =====================================================
   i18n
   ===================================================== */
const i18nMap = {
    fr: {
        ready: 'Prêt.',
        locked_msg: 'Schem verrouillé.',
        no_sel: 'Aucune sélection.',
        no_union: 'Sélectionnez au moins 2 schems pour unir.',
        no_split: 'Aucune union à défaire.',
        no_export_sel: 'Aucun schem sélectionné pour l\'export.',
        export_fail: 'Aucun schem à exporter.',
        export_done: 'Exporté : {0} ({1} schem(s)).',
        export_parts: '{0} partie(s) exportée(s).',
        union_done: 'Unis en "{0}".',
        split_done: 'Désunion. Il reste {0} union(s) à défaire.',
        schem_loaded: '{0} schem(s) chargé(s).',
        del_fail: '{0} fichier(s) non reconnu(s).',
        clear_done: 'Scène vidée.',
        loaded_saved: 'Preset chargé : {0} schem(s).',
        preset_saved: 'Preset "{0}" sauvegardé.',
        preset_empty: 'Aucun preset.',
        delete: 'Supprimer',
        save_prompt: 'Nom du preset :',
        confirm_clear: 'Vider la scène ?',
        snap: 'Déplacement — clic pour valider',
        drag_dupe: 'Dupliqué : ',
        cut_done: 'Coupe effectuée.',
        copy_done: 'Partie copiée.',
        open:'Ouvrir', export:'Exporter', mode_select:'Souris', mode_move:'Déplacer', mode_scale:'Séparer', mode_multi:'Multi', clear:'Vider',
        dim:'Dimensions', pos:'Position', blocks:'Blocs', color:'Couleur', step:'Pas :', blocks_unit:'bloc(s)', shift_hint:'Maintenir Maj pour ×10', rename:'Renommer',
        schems:'Schems', no_schem:'Aucun schem. Glissez-déposez ou', open_hint:'cliquez sur Ouvrir',
        cut_title:'✂️ Séparer', cut_extract:'✂️ Couper', cut_copy:'📑 Dupliquer',
        multi_title:'🔲 Multi-sélection —', schems_word:'schem(s)', multi_union:'🔗 Unir', multi_split:'✂️ Désunir', multi_export:'💾 Exporter',
        drop_msg:'📥 Déposez vos .bloxdschem ou un .zip ici',
        export_title:'💾 Exporter', export_base:'Nom de base', export_folder:'Dossier dans le zip', export_coords:'Ajouter les coordonnées _x…_z… dans les noms', export_single:'Forcer un seul fichier', cancel:'Annuler', download:'📦 Télécharger',
        me_title:'💾 Exporter la sélection', me_single:'📄 Un seul schem', me_single_sub:'Tous les schems fusionnes en UN seul .bloxdschem (jamais decoupe)', me_separate:'📑 Plusieurs schems (separe)', me_separate_sub:'Chaque schem telecharge separement dans un .zip', me_autosplit:'✂️ Fusion + decoupe auto', me_autosplit_sub:'Fusionne tout, puis decoupe en ZIP si > 160 chunks (limite Bloxd)',
        cam_label:'Cam:', step_label:'Pas:',
        help_title:'Guide rapide', help_start:'Commencer',
        prompt_export_name:"Nom de l'export :", prompt_new_name:'Nouveau nom :',
        help_items:[
            '<b>Clic gauche + glisser</b> : tourner la caméra',
            '<b>Molette</b> : zoomer / dézoomer',
            '<b>Clic droit + glisser</b> : déplacer la vue (pan)',
            '<b>ZQSD/WASD</b> : voler — <b>Espace</b>/<b>Ctrl</b> : monter/descendre',
            '<b>Glisser-déposer</b> : charger des .bloxdschem ou un .zip',
            '<b>Mode 🖱️ Souris</b> (V) : cliquez sur un schem pour le <b>sélectionner</b> ; maintenez et tirez pour <b>déplacer au sol</b> ; <kbd>Ctrl</kbd> + clic-glisser pour <b>dupliquer</b>',
            '<b>Mode ↔️ Déplacer</b> (G) : tirez les <b>flèches colorées</b> ou utilisez <kbd>ZQSD/WASD</kbd> (plan), <kbd>R</kbd>/<kbd>C</kbd> (haut/bas)',
            '<b>Mode ✂️ Séparer</b> (T) : <b>X/Y/Z</b> pour choisir la face, <b>←→↑↓</b> pour ajuster, puis <b>Couper</b> ou <b>Dupliquer</b>',
            'Bouton <b>🔓</b> / <kbd>L</kbd> : <b>verrouille</b> un schem (plus léger pour les gros schems)',
            '<b>🔲 Multi</b> (M) : ajoutez des schems à la sélection. <b>Unir</b> les fusionne, <b>Désunir</b> annule',
            '<kbd>Suppr</kbd> : supprimer · <kbd>F</kbd> : recentrer · <kbd>H</kbd> : aide · <kbd>Maj</kbd> : ×10 · <kbd>Échap</kbd> : annuler',
        ],
    },
    en: {
        ready: 'Ready.',
        locked_msg: 'Schem is locked.',
        no_sel: 'Nothing selected.',
        no_union: 'Select at least 2 schems to merge.',
        no_split: 'No union to undo.',
        no_export_sel: 'No schem selected for export.',
        export_fail: 'No schem to export.',
        export_done: 'Exported: {0} ({1} schem(s)).',
        export_parts: '{0} part(s) exported.',
        union_done: 'Merged into "{0}".',
        split_done: 'Split done. {0} union(s) remaining.',
        schem_loaded: '{0} schem(s) loaded.',
        del_fail: '{0} file(s) not recognized.',
        clear_done: 'Scene cleared.',
        loaded_saved: 'Preset loaded: {0} schem(s).',
        preset_saved: 'Preset "{0}" saved.',
        preset_empty: 'No preset.',
        delete: 'Delete',
        save_prompt: 'Preset name:',
        confirm_clear: 'Clear the scene?',
        snap: 'Move — click to validate',
        drag_dupe: 'Duplicated: ',
        cut_done: 'Cut done.',
        copy_done: 'Part copied.',
        open:'Open', export:'Export', mode_select:'Mouse', mode_move:'Move', mode_scale:'Separate', mode_multi:'Multi', clear:'Clear',
        dim:'Dimensions', pos:'Position', blocks:'Blocks', color:'Color', step:'Step:', blocks_unit:'block(s)', shift_hint:'Hold Shift for ×10', rename:'Rename',
        schems:'Schems', no_schem:'No schems. Drag & drop or', open_hint:'click Open',
        cut_title:'✂️ Separate', cut_extract:'✂️ Cut', cut_copy:'📑 Duplicate',
        multi_title:'🔲 Multi-select —', schems_word:'schem(s)', multi_union:'🔗 Union', multi_split:'✂️ Split', multi_export:'💾 Export',
        drop_msg:'📥 Drop your .bloxdschem or a .zip here',
        export_title:'💾 Export', export_base:'Base name', export_folder:'Folder in the zip', export_coords:'Add _x…_z… coordinates to filenames', export_single:'Force a single file', cancel:'Cancel', download:'📦 Download',
        me_title:'💾 Export selection', me_single:'📄 One schem', me_single_sub:'All schems merged into ONE .bloxdschem (never split)', me_separate:'📑 Multiple schems (separate)', me_separate_sub:'Each schem downloaded separately in a .zip', me_autosplit:'✂️ Merge + auto-split', me_autosplit_sub:'Merges everything, then splits into ZIP if > 160 chunks (Bloxd limit)',
        cam_label:'Cam:', step_label:'Step:',
        help_title:'Quick guide', help_start:'Start',
        prompt_export_name:'Export name:', prompt_new_name:'New name:',
        help_items:[
            '<b>Left-click + drag</b>: orbit the camera',
            '<b>Wheel</b>: zoom in / out',
            '<b>Right-click + drag</b>: pan the view',
            '<b>WASD/ZQSD</b>: fly — <b>Space</b>/<b>Ctrl</b>: up/down',
            '<b>Drag & drop</b>: load .bloxdschem files or a .zip',
            '<b>Mouse mode</b> (V): click a schem to <b>select</b> it; drag to <b>move on the ground</b>; <kbd>Ctrl</kbd> + drag to <b>duplicate</b>',
            '<b>Move mode</b> (G): drag the <b>colored arrows</b> or use <kbd>WASD/ZQSD</kbd> (ground), <kbd>R</kbd>/<kbd>C</kbd> (up/down)',
            '<b>Separate mode</b> (T): <b>X/Y/Z</b> to pick a face, <b>arrow keys</b> to adjust, then <b>Cut</b> or <b>Duplicate</b>',
            'Lock button <b>🔓</b> / <kbd>L</kbd>: <b>lock</b> a schem (lighter for large schems)',
            '<b>Multi</b> (M): add schems to the selection. <b>Union</b> merges them, <b>Split</b> undoes',
            '<kbd>Del</kbd>: delete · <kbd>F</kbd>: recenter · <kbd>H</kbd>: help · <kbd>Shift</kbd>: ×10 · <kbd>Esc</kbd>: cancel',
        ],
    }
};

function i18n(key, ...args) {
    const txt = (i18nMap[state.lang]?.[key] || i18nMap['fr'][key] || key);
    return args.reduce((s, a, i) => s.replace('{'+i+'}', a), txt);
}

function setLang(lang) {
    state.lang = (lang === 'en') ? 'en' : 'fr';
    localStorage.setItem('bloxdTools.lang', state.lang);
    const btn = document.getElementById('btn-lang');
    if (btn) btn.textContent = state.lang.toUpperCase();
    applyStaticI18n();
}

function applyStaticI18n() {
    const dict = i18nMap[state.lang] || i18nMap.fr;
    document.documentElement.lang = state.lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n');
        const v = dict[k];
        if (typeof v === 'string') el.textContent = v;
    });
    const list = document.getElementById('help-list');
    if (list && Array.isArray(dict.help_items)) list.innerHTML = dict.help_items.map(h => '<li>' + h + '</li>').join('');
}

/* =====================================================
   ÉTAT GLOBAL
   ===================================================== */
const state = {
    mode: 'select', selected: null, selection: new Set(), instances: [],
    nextId: 1, step: 1, lang: 'fr',
    locked: {}, selectDragging: null, gizmoDragging: null,
    cutBoxData: null, snap: null, unionStack: [], blockNameMap: {},
    shiftDown: false, cutFace: null,
};

/* =====================================================
   MODE HINTS
   ===================================================== */
const MODE_HINTS = {
    fr: {
        select: 'Clic sur un schem pour le <b>sélectionner</b>. Maintenez et tirez pour <b>déplacer au sol</b>. Ctrl pour <b>dupliquer</b>.',
        move: 'Tirez les <b>flèches colorées</b> pour déplacer sur un axe, ou <kbd>↑↓←→</kbd> (plan) + <kbd>R</kbd>/<kbd>C</kbd> (hauteur).',
        scale: '<b>X/Y/Z</b> pour choisir la face, <b>←→↑↓</b> pour l\'ajuster. Puis Couper/Dupliquer.',
        multi: 'Clic sur les schems pour les <b>ajouter à la sélection</b>.'
    },
    en: {
        select: 'Click on a schem to <b>select</b>. Hold and drag to <b>move on ground</b>. Ctrl to <b>duplicate</b>.',
        move: 'Drag the <b>colored arrows</b> to move along an axis, or <kbd>↑↓←→</kbd> (plan) + <kbd>R</kbd>/<kbd>C</kbd> (height).',
        scale: 'Click <b>orange spheres</b> to adjust cut zone.',
        multi: 'Click schems to <b>add to selection</b>.'
    }
};

function setModeHint() {
    const el = document.getElementById('mode-indicator');
    if (!el) return;
    const hints = MODE_HINTS[state.lang] || MODE_HINTS['fr'];
    const modeIcons = { select: '🖱️', move: '↔️', scale: '✂️', multi: '🔲' };
    el.innerHTML = `<b>${modeIcons[state.mode]} ${state.mode.toUpperCase()}</b> — ` + (hints[state.mode] || '');
}

/* =====================================================
   PARSAGE SCHEM — format Avro v0 (identique M2B/Bloxd.io)
   ===================================================== */

// LEB128 / Avro varints
function readUvarint(buf, off) {
    let x = 0, s = 0, b;
    for (let i = 0; i < 10; i++) {
        if (off.value >= buf.length) break;
        b = buf[off.value++];
        if (b < 0x80) return x | (b << s);
        x |= (b & 0x7f) << s;
        s += 7;
    }
    return x;
}

function readAvroInt(buf, off) {
    const zz = readUvarint(buf, off);
    return (zz >>> 1) ^ -(zz & 1);
}

function writeUvarint(n) {
    n = Math.floor(n);
    const out = [];
    while (n >= 0x80) { out.push((n & 0x7f) | 0x80); n = Math.floor(n / 128); }
    out.push(n & 0x7f);
    return new Uint8Array(out);
}

function writeAvroInt(n) {
    n = Math.floor(n);
    const zz = n < 0 ? ((-n) * 2 - 1) : (n * 2);
    return writeUvarint(zz);
}

function readAvroString(buf, off) {
    const len = readAvroInt(buf, off);
    if (len < 0 || off.value + len > buf.length) return '';
    const bytes = buf.subarray(off.value, off.value + len);
    off.value += len;
    return new TextDecoder("utf-8").decode(bytes);
}

function readAvroBytes(buf, off) {
    const len = readAvroInt(buf, off);
    if (len < 0 || off.value + len > buf.length) return new Uint8Array(0);
    const bytes = buf.slice(off.value, off.value + len);
    off.value += len;
    return bytes;
}

function writeAvroString(s) {
    const enc = new TextEncoder().encode(s);
    const lenBuf = writeAvroInt(enc.length);
    const res = new Uint8Array(lenBuf.length + enc.length);
    res.set(lenBuf, 0); res.set(enc, lenBuf.length);
    return res;
}

function writeAvroBytes(b) {
    const lenBuf = writeAvroInt(b.length);
    const res = new Uint8Array(lenBuf.length + b.length);
    res.set(lenBuf, 0); res.set(b, lenBuf.length);
    return res;
}

function concatBytes(parts) {
    let total = 0;
    for (const p of parts) total += p.length;
    const res = new Uint8Array(total);
    let o = 0;
    for (const p of parts) { res.set(p, o); o += p.length; }
    return res;
}

// Décode RLE d'un chunk → Int32Array(32768), idx = lx*1024 + ly*32 + lz
function decodeChunkRLE(rleBytes) {
    const blocks = new Int32Array(CHUNK_VOL);
    const pos = { value: 0 };
    let i = 0;
    while (i < CHUNK_VOL && pos.value < rleBytes.length) {
        const count = readUvarint(rleBytes, pos);
        const bid = readUvarint(rleBytes, pos);
        for (let k = 0; k < count && i < CHUNK_VOL; k++) blocks[i++] = bid;
    }
    return blocks;
}

function encodeChunkRLE(blocks) {
    const parts = [];
    let i = 0;
    while (i < blocks.length) {
        let curr = blocks[i], run = 1;
        while (i + run < blocks.length && blocks[i + run] === curr && run < 0x7fffffff) run++;
        parts.push(writeUvarint(run));
        parts.push(writeUvarint(curr));
        i += run;
    }
    return concatBytes(parts);
}

function parseSchem(buffer) {
    const buf = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const off = { value: 0 };

    // Header magic 00 00 00 00
    for (let i = 0; i < 4; i++) {
        if (buf[off.value] === 0) { off.value++; continue; }
        console.warn("BloxdSchem: header non nul à l'octet", i);
        break;
    }

    const name = readAvroString(buf, off);
    const px = readAvroInt(buf, off);
    const py = readAvroInt(buf, off);
    const pz = readAvroInt(buf, off);
    const sx = readAvroInt(buf, off);
    const sy = readAvroInt(buf, off);
    const sz = readAvroInt(buf, off);

    const blocks = new Map();
    let totalBlocks = 0;

    // Lecture du tableau Avro (blocs de chunks)
    while (off.value < buf.length) {
        let blockCount = readAvroInt(buf, off);
        if (blockCount === 0) break;
        if (blockCount < 0) {
            blockCount = -blockCount;
            readAvroInt(buf, off); // skip byte count
        }
        for (let i = 0; i < blockCount; i++) {
            const cx = readAvroInt(buf, off);
            const cy = readAvroInt(buf, off);
            const cz = readAvroInt(buf, off);
            const rle = readAvroBytes(buf, off);
            const arr = decodeChunkRLE(rle);
            let nonAir = 0;
            for (let k = 0; k < arr.length; k++) if (arr[k] !== AIR_ID) nonAir++;
            if (nonAir === 0) continue;
            blocks.set(cx + "," + cy + "," + cz, arr);
            totalBlocks += nonAir;
        }
    }

    // Bbox réelle
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    blocks.forEach((arr, key) => {
        const [cx, cy, cz] = key.split(",").map(Number);
        const bx0 = px + cx * CHUNK, by0 = py + cy * CHUNK, bz0 = pz + cz * CHUNK;
        for (let lx = 0; lx < CHUNK; lx++)
            for (let ly = 0; ly < CHUNK; ly++)
                for (let lz = 0; lz < CHUNK; lz++) {
                    const bid = arr[lx * 1024 + ly * 32 + lz];
                    if (bid === AIR_ID) continue;
                    const wx = bx0 + lx, wy = by0 + ly, wz = bz0 + lz;
                    if (wx < minX) minX = wx; if (wy < minY) minY = wy; if (wz < minZ) minZ = wz;
                    if (wx > maxX) maxX = wx; if (wy > maxY) maxY = wy; if (wz > maxZ) maxZ = wz;
                }
    });

    if (!isFinite(minX)) { minX = px; minY = py; minZ = pz; maxX = px; maxY = py; maxZ = pz; }

    // Normalisation : min → (0,0,0)
    const normBlocks = new Map();
    blocks.forEach((arr, key) => {
        const [scx, scy, scz] = key.split(",").map(Number);
        const chunkWX0 = px + scx * CHUNK, chunkWY0 = py + scy * CHUNK, chunkWZ0 = pz + scz * CHUNK;
        for (let lx = 0; lx < CHUNK; lx++)
            for (let ly = 0; ly < CHUNK; ly++)
                for (let lz = 0; lz < CHUNK; lz++) {
                    const bid = arr[lx * 1024 + ly * 32 + lz];
                    if (bid === AIR_ID) continue;
                    const wx = chunkWX0 + lx, wy = chunkWY0 + ly, wz = chunkWZ0 + lz;
                    const nx = wx - minX, ny = wy - minY, nz = wz - minZ;
                    const ncx = Math.floor(nx / CHUNK), ncy = Math.floor(ny / CHUNK), ncz = Math.floor(nz / CHUNK);
                    const nkey = ncx + "," + ncy + "," + ncz;
                    let nArr = normBlocks.get(nkey);
                    if (!nArr) { nArr = new Int32Array(CHUNK_VOL); normBlocks.set(nkey, nArr); }
                    const nlx = nx - ncx * CHUNK, nly = ny - ncy * CHUNK, nlz = nz - ncz * CHUNK;
                    nArr[nlx * 1024 + nly * 32 + nlz] = bid;
                }
    });

    const sizeX = maxX - minX + 1, sizeY = maxY - minY + 1, sizeZ = maxZ - minZ + 1;

    return {
        name, version: 0,
        rawPos: { x: px, y: py, z: pz }, rawSize: { x: sx, y: sy, z: sz },
        blocks: normBlocks, nonEmptyChunks: normBlocks.size, totalBlocks,
        aabb: { minX: 0, minY: 0, minZ: 0, maxX: sizeX - 1, maxY: sizeY - 1, maxZ: sizeZ - 1 },
        size: { x: sizeX, y: sizeY, z: sizeZ }
    };
}

async function parseSchemAsync(buffer, baseName) {
    return new Promise(resolve => {
        try { resolve(parseSchem(buffer)); }
        catch(e) { console.error('parseSchem error:', e); resolve(null); }
    });
}

/* =====================================================
   EXTRACTION SUB-SCHEM
   ===================================================== */
function extractSubSchem(schem, bbox, remove) {
    const bx0 = Math.floor(bbox.minX), by0 = Math.floor(bbox.minY), bz0 = Math.floor(bbox.minZ);
    const bx1 = Math.floor(bbox.maxX), by1 = Math.floor(bbox.maxY), bz1 = Math.floor(bbox.maxZ);
    const newBlocks = new Map();
    let newTotal = 0;
    const getNewChunk = (cx, cy, cz) => {
        const k = cx + "," + cy + "," + cz;
        let arr = newBlocks.get(k);
        if (!arr) { arr = new Int32Array(CHUNK_VOL); newBlocks.set(k, arr); }
        return arr;
    };
    schem.blocks.forEach((arr, key) => {
        const [cx, cy, cz] = key.split(",").map(Number);
        const cbx0 = cx * CHUNK, cby0 = cy * CHUNK, cbz0 = cz * CHUNK;
        const cbx1 = cbx0 + CHUNK - 1, cby1 = cby0 + CHUNK - 1, cbz1 = cbz0 + CHUNK - 1;
        if (cbx1 < bx0 || cbx0 > bx1 || cby1 < by0 || cby0 > by1 || cbz1 < bz0 || cbz0 > bz1) return;
        for (let lx = 0; lx < CHUNK; lx++) {
            const nx = cbx0 + lx; if (nx < bx0 || nx > bx1) continue;
            for (let ly = 0; ly < CHUNK; ly++) {
                const ny = cby0 + ly; if (ny < by0 || ny > by1) continue;
                for (let lz = 0; lz < CHUNK; lz++) {
                    const nz = cbz0 + lz; if (nz < bz0 || nz > bz1) continue;
                    const idx = lx * 1024 + ly * 32 + lz;
                    const bid = arr[idx];
                    if (bid === AIR_ID) continue;
                    const tnx = nx - bx0, tny = ny - by0, tnz = nz - bz0;
                    const tcx = Math.floor(tnx / CHUNK), tcy = Math.floor(tny / CHUNK), tcz = Math.floor(tnz / CHUNK);
                    const tArr = getNewChunk(tcx, tcy, tcz);
                    const tlx = tnx - tcx * CHUNK, tly = tny - tcy * CHUNK, tlz = tnz - tcz * CHUNK;
                    tArr[tlx * 1024 + tly * 32 + tlz] = bid;
                    newTotal++;
                    if (remove) arr[idx] = AIR_ID;
                }
            }
        }
    });
    if (newTotal === 0) return null;
    return {
        name: schem.name + '_part',
        blocks: newBlocks, nonEmptyChunks: newBlocks.size, totalBlocks: newTotal,
        aabb: { minX: 0, minY: 0, minZ: 0, maxX: bx1 - bx0, maxY: by1 - by0, maxZ: bz1 - bz0 },
        size: { x: bx1 - bx0 + 1, y: by1 - by0 + 1, z: bz1 - bz0 + 1 }
    };
}

/* Recalcule la bbox réelle d'un schem (après coupe) et re-normalise les blocs
   pour que le coin min revienne à (0,0,0). Retourne l'offset {x,y,z} du décalage
   appliqué (à ajouter à inst.pos pour conserver la position monde). */
function renormalizeSchem(schem) {
    let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
    schem.blocks.forEach((arr,key)=>{
        const[cx,cy,cz]=key.split(',').map(Number);
        const bX=cx*CHUNK,bY=cy*CHUNK,bZ=cz*CHUNK;
        for(let lx=0;lx<CHUNK;lx++)for(let ly=0;ly<CHUNK;ly++)for(let lz=0;lz<CHUNK;lz++){
            if(arr[lx*1024+ly*32+lz]===AIR_ID)continue;
            const wx=bX+lx,wy=bY+ly,wz=bZ+lz;
            if(wx<minX)minX=wx;if(wy<minY)minY=wy;if(wz<minZ)minZ=wz;
            if(wx>maxX)maxX=wx;if(wy>maxY)maxY=wy;if(wz>maxZ)maxZ=wz;
        }
    });
    if(!isFinite(minX))return{x:0,y:0,z:0};
    const newBlocks=new Map();
    schem.blocks.forEach((arr,key)=>{
        const[cx,cy,cz]=key.split(',').map(Number);
        const bX=cx*CHUNK,bY=cy*CHUNK,bZ=cz*CHUNK;
        for(let lx=0;lx<CHUNK;lx++)for(let ly=0;ly<CHUNK;ly++)for(let lz=0;lz<CHUNK;lz++){
            const bid=arr[lx*1024+ly*32+lz];
            if(bid===AIR_ID)continue;
            const nx=bX+lx-minX,ny=bY+ly-minY,nz=bZ+lz-minZ;
            const ncx=Math.floor(nx/CHUNK),ncy=Math.floor(ny/CHUNK),ncz=Math.floor(nz/CHUNK);
            const nkey=ncx+','+ncy+','+ncz;
            let nArr=newBlocks.get(nkey);
            if(!nArr){nArr=new Int32Array(CHUNK_VOL);newBlocks.set(nkey,nArr);}
            nArr[(nx-ncx*CHUNK)*1024+(ny-ncy*CHUNK)*32+(nz-ncz*CHUNK)]=bid;
        }
    });
    const sizeX=maxX-minX+1,sizeY=maxY-minY+1,sizeZ=maxZ-minZ+1;
    schem.blocks=newBlocks;
    schem.size={x:sizeX,y:sizeY,z:sizeZ};
    schem.aabb={minX:0,minY:0,minZ:0,maxX:sizeX-1,maxY:sizeY-1,maxZ:sizeZ-1};
    schem.nonEmptyChunks=newBlocks.size;
    return{x:minX,y:minY,z:minZ};
}

/* =====================================================
   INSTANCE MANAGEMENT
   ===================================================== */
const PALETTE = [
    0x4aa8ff, 0xff6b6b, 0x51cf66, 0xffd43b, 0xcc5de8, 0x20c997, 0xfd7e14, 0x868e96,
    0x339af0, 0xe64980, 0x2f9e44, 0xfab005, 0xbe4bdb, 0x12b886, 0xe8590c, 0x495057,
];

function addInstance(name, schem, forcedPos) {
    const { group, totalBlocks, width, height, depth } = SchemPlacerBabylon.buildSchemMesh(schem);
    const id = state.nextId++;
    group.getChildMeshes().forEach(mesh => { mesh.metadata = { instanceId: id }; });
    group.metadata = { instanceId: id };
    let pos;
    if (forcedPos) {
        pos = { x: forcedPos.x || 0, y: forcedPos.y || 0, z: forcedPos.z || 0 };
    } else {
        pos = findFreeSpot();
    }
    group.position.set(pos.x, pos.y, pos.z);
    const inst = {
        id, name: name || schem.name,
        schem, pos, group, color: PALETTE[(id-1) % PALETTE.length],
        aabb: { minX: 0, minY: 0, minZ: 0, maxX: width-1, maxY: height-1, maxZ: depth-1 },
        size: { x: width, y: height, z: depth }, totalBlocks, locked: false
    };
    state.instances.push(inst);
    renderList();
    select(inst);
    return inst;
}

function findFreeSpot() {
    let x = 0, y = 0, z = 0;
    const step = 10;
    let tries = 0;
    while (tries < 1000) {
        let free = true;
        for (const i of state.instances) {
            const b = i.aabb;
            if (!(i.pos.x + b.maxX < x || i.pos.x > x + step ||
                  i.pos.y + b.maxY < y || i.pos.y > y + step ||
                  i.pos.z + b.maxZ < z || i.pos.z > z + step)) {
                free = false; break;
            }
        }
        if (free) return { x, y, z };
        x += step; if (x > 500) { x = 0; z += step; }
        if (z > 500) { z = 0; y += step; }
        tries++;
    }
    return { x: 0, y: 0, z: 0 };
}

function removeInstance(inst) {
    if (!inst) return;
    if (state.selected === inst) { state.selected = null; updateInspector(); }
    state.selection.delete(inst);
    SchemPlacerBabylon.removeInstanceFromScene(inst);
    const idx = state.instances.indexOf(inst);
    if (idx >= 0) state.instances.splice(idx, 1);
    SchemPlacerBabylon.updateOutline();
    SchemPlacerBabylon.updateMultiOutlines();
    renderList(); updateInspector();
}

function duplicateInstance(inst, offset) {
    if (!inst) return null;
    const o = offset || { x: inst.size.x + 2, y: 0, z: 0 };
    const newSchem = deepCloneSchem(inst.schem);
    const newInst = addInstance(inst.name + '_copy', newSchem, {
        x: inst.pos.x + o.x, y: inst.pos.y + o.y, z: inst.pos.z + o.z
    });
    newInst.color = inst.color;
    SchemPlacerBabylon.updateOutline();
    renderList(); updateInspector();
    return newInst;
}

function deepCloneSchem(schem) {
    const blocks = new Map();
    schem.blocks.forEach((arr, key) => blocks.set(key, new Int32Array(arr)));
    return { ...schem, blocks, aabb: { ...schem.aabb }, size: { ...schem.size } };
}

function select(inst) {
    state.selected = inst;
    SchemPlacerBabylon.updateOutline();
    updateInspector();
    // If in scale mode, restart cut on the new selection
    if (state.mode === 'scale' && inst && !inst.locked) startCut();
}

function clearMultiSelection() {
    state.selection.clear();
    $$('.schem-item').forEach(el => el.classList.remove('selected-multi', 'selected'));
    SchemPlacerBabylon.updateMultiOutlines();
    updateMultiCount();
}

function toggleMultiSelect(inst) {
    if (state.selection.has(inst)) state.selection.delete(inst);
    else state.selection.add(inst);
    const el = document.querySelector(`.schem-item[data-id="${inst.id}"]`);
    if (el) el.classList.toggle('selected-multi', state.selection.has(inst));
    SchemPlacerBabylon.updateMultiOutlines();
    updateMultiCount();
}

function updateMultiCount() {
    const el = document.getElementById('multi-count');
    if (el) el.textContent = state.selection.size;
}

/* =====================================================
   INSPECTOR
   ===================================================== */
function updateInspector() {
    const sel = state.selected;
    const insp = document.getElementById('inspector');
    if (!insp) return;
    if (!sel) { insp.style.display = 'none'; return; }
    insp.style.display = 'block';
    document.getElementById('sel-name').textContent = sel.name;
    document.getElementById('sel-size').textContent = `${sel.size.x}×${sel.size.y}×${sel.size.z}`;
    document.getElementById('sel-pos').textContent = `${sel.pos.x}, ${sel.pos.y}, ${sel.pos.z}`;
    document.getElementById('sel-blocks').textContent = sel.totalBlocks.toLocaleString();
    const colorInput = document.getElementById('sel-color');
    if (colorInput) colorInput.value = '#' + sel.color.toString(16).padStart(6, '0');
}

/* =====================================================
   LIST RENDER
   ===================================================== */
function renderList() {
    const list = document.getElementById('schem-list-inner');
    if (!list) return;
    const noMsg = document.getElementById('no-schem-msg');
    const countEl = document.getElementById('schem-count');
    if (countEl) countEl.textContent = state.instances.length;
    if (state.instances.length === 0) {
        if (noMsg) noMsg.style.display = '';
        list.innerHTML = '';
        list.appendChild(noMsg || createNoMsg());
        return;
    }
    if (noMsg) noMsg.style.display = 'none';
    const currentIds = new Set(state.instances.map(i => String(i.id)));
    $$('.schem-item', list).forEach(el => {
        if (!currentIds.has(el.dataset.id)) el.remove();
    });
    for (const inst of state.instances) {
        let el = list.querySelector(`.schem-item[data-id="${inst.id}"]`);
        if (!el) { el = createSchemItem(inst); list.appendChild(el); }
        updateSchemItem(el, inst);
    }
}

function createNoMsg() {
    const div = document.createElement('div');
    div.id = 'no-schem-msg'; div.className = 'muted';
    div.textContent = 'Aucun schem. Glissez-déposez ou ';
    const span = document.createElement('span');
    span.style.color = 'var(--accent)'; span.style.cursor = 'pointer';
    span.textContent = 'cliquez sur Ouvrir';
    span.addEventListener('click', () => document.getElementById('file-input').click());
    div.appendChild(span); div.appendChild(document.createTextNode('.'));
    return div;
}

function createSchemItem(inst) {
    const div = document.createElement('div');
    div.className = 'schem-item'; div.dataset.id = inst.id;
    const color = document.createElement('div'); color.className = 'schem-color';
    const info = document.createElement('div'); info.className = 'schem-info';
    const name = document.createElement('div'); name.className = 'schem-name';
    const meta = document.createElement('div'); meta.className = 'schem-meta';
    info.appendChild(name); info.appendChild(meta);
    const lock = document.createElement('button');
    lock.className = 'schem-lock'; lock.title = 'Verrouiller/Déverrouiller'; lock.textContent = '🔓';
    const del = document.createElement('button');
    del.className = 'schem-del'; del.title = 'Supprimer'; del.textContent = '✕';
    div.appendChild(color); div.appendChild(info); div.appendChild(lock); div.appendChild(del);

    div.addEventListener('click', e => {
        e.stopPropagation();
        if (state.mode === 'multi') toggleMultiSelect(inst); else select(inst);
    });

    lock.addEventListener('click', e => {
        e.stopPropagation();
        inst.locked = !inst.locked;
        if (inst.locked) {
            SchemPlacerBabylon.removeInstanceFromScene(inst);
            inst.group = SchemPlacerBabylon.buildLockedMesh(inst);
        } else {
            SchemPlacerBabylon.removeInstanceFromScene(inst);
            inst.group = SchemPlacerBabylon.buildSchemMesh(inst.schem).group;
        }
        inst.group.getChildMeshes().forEach(m => { m.metadata = { instanceId: inst.id }; });
        inst.group.position.set(inst.pos.x, inst.pos.y, inst.pos.z);
        SchemPlacerBabylon.updateOutline(); renderList();
    });

    del.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm(`Supprimer "${inst.name}" ?`)) removeInstance(inst);
    });
    return div;
}

function updateSchemItem(el, inst) {
    const color = el.querySelector('.schem-color');
    const name = el.querySelector('.schem-name');
    const meta = el.querySelector('.schem-meta');
    const lock = el.querySelector('.schem-lock');
    if (color) color.style.background = '#' + inst.color.toString(16).padStart(6, '0');
    if (name) name.textContent = inst.name;
    if (meta) meta.textContent = `${inst.size.x}×${inst.size.y}×${inst.size.z} · ${inst.totalBlocks.toLocaleString()} blocs`;
    if (lock) lock.textContent = inst.locked ? '🔒' : '🔓';
    el.classList.toggle('locked', inst.locked);
    el.classList.toggle('selected', state.selected === inst && state.mode !== 'multi');
}

/* =====================================================
   SNAP DETECTION
   ===================================================== */
function findSnap(inst) {
    let best = null, bestDist = SNAP_THRESHOLD;
    const imin = { x: inst.pos.x + inst.aabb.minX, y: inst.pos.y + inst.aabb.minY, z: inst.pos.z + inst.aabb.minZ };
    const imax = { x: inst.pos.x + inst.aabb.maxX, y: inst.pos.y + inst.aabb.maxY, z: inst.pos.z + inst.aabb.maxZ };
    const faces = [
        { axis:'x', face:'min', c1:'y', c2:'z', p: imin.x, n: -1 },
        { axis:'x', face:'max', c1:'y', c2:'z', p: imax.x, n:  1 },
        { axis:'y', face:'min', c1:'x', c2:'z', p: imin.y, n: -1 },
        { axis:'y', face:'max', c1:'x', c2:'z', p: imax.y, n:  1 },
        { axis:'z', face:'min', c1:'x', c2:'y', p: imin.z, n: -1 },
        { axis:'z', face:'max', c1:'x', c2:'y', p: imax.z, n:  1 },
    ];
    for (const f of faces) {
        for (const other of state.instances) {
            if (other === inst) continue;
            const omin = { x: other.pos.x, y: other.pos.y, z: other.pos.z };
            const omax = { x: other.pos.x+other.size.x, y: other.pos.y+other.size.y, z: other.pos.z+other.size.z };
            const oFaceP = f.n === -1 ? omax[f.axis] : omin[f.axis];
            const dist = Math.abs(f.p - oFaceP);
            if (dist >= bestDist) continue;
            const i1Min = imin[f.c1], i1Max = imax[f.c1];
            const i2Min = imin[f.c2], i2Max = imax[f.c2];
            const o1Min = omin[f.c1], o1Max = omax[f.c1];
            const o2Min = omin[f.c2], o2Max = omax[f.c2];
            const overlap1 = Math.min(i1Max, o1Max) - Math.max(i1Min, o1Min);
            const overlap2 = Math.min(i2Max, o2Max) - Math.max(i2Min, o2Min);
            if (overlap1 <= 0 || overlap2 <= 0) continue;
            bestDist = dist;
            const newInstMin = { ...inst.pos };
            if (f.face === 'min') newInstMin[f.axis] = oFaceP;
            else newInstMin[f.axis] = oFaceP - inst.size[f.axis];
            const fc1 = Math.max(i1Min, o1Min) + overlap1*0.5;
            const fc2 = Math.max(i2Min, o2Min) + overlap2*0.5;
            let cx, cy, cz, nx, ny, nz, w, h;
            if (f.axis === 'x') { cx = newInstMin.x + (f.face==='min'?0:inst.size.x); cy = fc1; cz = fc2; nx = f.n; ny = 0; nz = 0; w = overlap2; h = overlap1; }
            else if (f.axis === 'y') { cy = newInstMin.y + (f.face==='min'?0:inst.size.y); cx = fc1; cz = fc2; nx = 0; ny = f.n; nz = 0; w = overlap2; h = overlap1; }
            else { cz = newInstMin.z + (f.face==='min'?0:inst.size.z); cx = fc1; cy = fc2; nx = 0; ny = 0; nz = f.n; w = overlap1; h = overlap2; }
            best = { axis:f.axis, face:f.face, newPos:newInstMin,
                faceCenter: new BABYLON.Vector3(cx, cy, cz),
                faceNormal: new BABYLON.Vector3(nx, ny, nz), faceSize:[w,h] };
        }
    }
    return best;
}

/* =====================================================
   MODE / UI
   ===================================================== */
function setMode(mode) {
    state.mode = mode;
    $$('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    if (mode !== 'scale') cancelCut();
    else if (state.selected && !state.selected.locked) startCut();
    if (mode !== 'multi') clearMultiSelection();
    setModeHint();
    SchemPlacerBabylon.updateCutHandlesVisibility();
    updateMultiToolbar();
    SchemPlacerBabylon.updateMultiOutlines();
    // Show/hide cut toolbar
    const tb = document.getElementById('cut-toolbar');
    if (tb) tb.classList.toggle('active', mode === 'scale' && state.selected && state.cutBoxData);
    renderList();
}

function updateMultiToolbar() {
    const toolbar = document.getElementById('multi-toolbar');
    if (toolbar) toolbar.classList.toggle('active', state.mode === 'multi');
    updateMultiCount();
}

/* =====================================================
   CUT / SPLIT
   ===================================================== */
function startCut() {
    const inst = state.selected; if (!inst) return;
    if (inst.locked) { setStatus(i18n('locked_msg')); return; }
    state.cutBoxData = { inst, x0:0, y0:0, z0:0, x1:inst.size.x-1, y1:inst.size.y-1, z1:inst.size.z-1 };
    state.cutFace = 'x1';
    SchemPlacerBabylon.updateCutHandlesVisibility();
    updateCutFaceLabel();
}

function updateCutFaceLabel() {
    const el = document.getElementById('cut-face-label');
    if (!el) return;
    if (!state.cutBoxData || !state.cutFace) { el.textContent = ''; return; }
    const d = state.cutBoxData;
    const names = { x0: 'X min', x1: 'X max', y0: 'Y min', y1: 'Y max', z0: 'Z min', z1: 'Z max' };
    const plane = state.cutFace;
    const val = d[plane] !== undefined ? d[plane] : 0;
    el.textContent = `✂️ Face: ${names[plane] || plane} = ${val}  (X/Y/Z pour changer de face, ←→↑↓ pour ajuster)`;
}

function cancelCut() {
    state.cutBoxData = null;
    state.cutFace = null;
    SchemPlacerBabylon.updateCutHandlesVisibility();
    const tb = document.getElementById('cut-toolbar');
    if (tb) tb.classList.remove('active');
}

function performCut(remove) {
    const d = state.cutBoxData; if (!d) return;
    const inst = d.inst;
    if (d.x1 - d.x0 < 0 || d.y1 - d.y0 < 0 || d.z1 - d.z0 < 0) { alert('Sélection invalide.'); return; }
    const sub = extractSubSchem(inst.schem, {minX:d.x0,minY:d.y0,minZ:d.z0,maxX:d.x1,maxY:d.y1,maxZ:d.z1}, remove);
    if (!sub) { alert('Aucun bloc dans la sélection.'); return; }
    // Position monde de la partie extraite (calculée AVANT que le schem principal ne rétrécisse)
    const subPos = { x: inst.pos.x + d.x0, y: inst.pos.y + d.y0, z: inst.pos.z + d.z0 };
    if (remove) {
        let remaining = 0;
        inst.schem.blocks.forEach(a => { for(let i=0;i<a.length;i++) if (a[i]!==AIR_ID) remaining++; });
        inst.schem.totalBlocks = remaining;
        if (remaining === 0) { removeInstance(inst); }
        else {
            // Rétrécit le schem principal à sa bbox réelle (ne garde PAS la zone coupée)
            const offset = renormalizeSchem(inst.schem);
            inst.pos.x += offset.x; inst.pos.y += offset.y; inst.pos.z += offset.z;
            SchemPlacerBabylon.rebuildInstanceMesh(inst);
        }
    }
    addInstance(sub.name, sub, subPos);
    cancelCut();
    // Restart cut on the same schem so the user can keep cutting
    if (state.selected && !state.selected.locked) startCut();
}

/* =====================================================
   UNION / SPLIT / EXPORT MULTI
   ===================================================== */
function unionSelected() {
    const sel = Array.from(state.selection).filter(i => !i.locked);
    if (sel.length < 2) { setStatus(i18n('no_union')); return; }
    const insts = sel.map(i => ({ schem: i.schem, pos: { ...i.pos } }));
    let unionName = sel.map(s=>s.name).join('+');
    if (unionName.length > 80) unionName = unionName.slice(0,77) + '...';
    // PERF: fusion directe en memoire (pas d'encode/decode binaire)
    const merged = mergeSchemsInMemory(insts, unionName);
    const pos = { x: Math.min(...sel.map(i=>i.pos.x)), y: Math.min(...sel.map(i=>i.pos.y)), z: Math.min(...sel.map(i=>i.pos.z)) };
    const removed = sel.slice();
    removed.forEach(r => {
        if (state.selected === r) state.selected = null;
        state.selection.delete(r);
        SchemPlacerBabylon.removeInstanceFromScene(r);
        const idx = state.instances.indexOf(r);
        if (idx >= 0) state.instances.splice(idx, 1);
    });
    const { group, totalBlocks, width, height, depth } = SchemPlacerBabylon.buildSchemMesh(merged);
    const newId = state.nextId++, newColor = PALETTE[(newId-1) % PALETTE.length];
    group.metadata = { instanceId: newId };
    group.getChildMeshes().forEach(m => { m.metadata = { instanceId: newId }; });
    group.position.set(pos.x, pos.y, pos.z);
    const newInst = { id: newId, name: unionName, schem: merged, pos, group, color: newColor,
        aabb: { minX:0,minY:0,minZ:0, maxX:width-1,maxY:height-1,maxZ:depth-1 },
        size: { x:width, y:height, z:depth }, totalBlocks, locked: false };
    state.instances.push(newInst);
    state.unionStack.push({ added: newInst, removed });
    cancelCut(); select(newInst); clearMultiSelection();
    renderList(); SchemPlacerBabylon.updateOutline(); SchemPlacerBabylon.updateMultiOutlines(); updateInspector();
    setStatus(i18n('union_done', unionName));
}

function splitLastUnion() {
    if (state.unionStack.length === 0) { setStatus(i18n('no_split')); return; }
    const entry = state.unionStack.pop();
    const a = entry.added;
    SchemPlacerBabylon.removeInstanceFromScene(a);
    const ai = state.instances.indexOf(a);
    if (ai >= 0) state.instances.splice(ai, 1);
    if (state.selected === a) state.selected = null;
    entry.removed.forEach(r => {
        const { group } = SchemPlacerBabylon.buildSchemMesh(r.schem);
        group.metadata = { instanceId: r.id };
        group.getChildMeshes().forEach(m => { m.metadata = { instanceId: r.id }; });
        group.position.set(r.pos.x, r.pos.y, r.pos.z);
        r.group = group; state.instances.push(r);
    });
    cancelCut(); clearMultiSelection();
    renderList(); SchemPlacerBabylon.updateOutline(); SchemPlacerBabylon.updateMultiOutlines(); updateInspector();
    setStatus(i18n('split_done', state.unionStack.length));
}

function exportSelected() {
    const sel = Array.from(state.selection);
    if (sel.length === 0) { setStatus(i18n('no_export_sel')); return; }
    let name = sel.length === 1 ? sel[0].name : 'selection';
    name = (prompt(i18n('prompt_export_name'), name) || name).trim().replace(/[^\w\-]+/g,'_') || 'selection';
    const insts = sel.map(i => ({ schem: i.schem, pos: { ...i.pos } }));
    let mnx=Infinity,mny=Infinity,mnz=Infinity,mxx=-Infinity,mxy=-Infinity,mxz=-Infinity;
    for (const it of insts) {
        const b = it.schem.aabb;
        mnx=Math.min(mnx,it.pos.x); mny=Math.min(mny,it.pos.y); mnz=Math.min(mnz,it.pos.z);
        mxx=Math.max(mxx,it.pos.x+b.maxX); mxy=Math.max(mxy,it.pos.y+b.maxY); mxz=Math.max(mxz,it.pos.z+b.maxZ);
    }
    const LIM = 160;
    const nCY = Math.ceil((mxy+1)/CHUNK);
    const mt = Math.max(1, Math.floor(Math.sqrt(LIM/Math.max(1,nCY))));
    const wmx = Math.floor(mnx/CHUNK)*CHUNK, wmz = Math.floor(mnz/CHUNK)*CHUNK,
          WMx = Math.ceil((mxx+1)/CHUNK)*CHUNK, WMz = Math.ceil((mxz+1)/CHUNK)*CHUNK;
    const nCX = Math.round((WMx-wmx)/CHUNK), nCZ = Math.round((WMz-wmz)/CHUNK);
    const totalChunksEst = nCX*nCY*nCZ;
    if (totalChunksEst <= LIM) {
        const { bytes } = buildMergedSchem(insts, name);
        const fn = name + '.bloxdschem';
        download(new Blob([bytes], {type:'application/octet-stream'}), fn);
        setStatus(i18n('export_done', fn, sel.length)); return;
    }
    const parts=[]; let num=1;
    for(let stx=Math.floor(mnx/CHUNK); stx<=Math.floor(mxx/CHUNK); stx+=mt) {
        const etx=Math.min(Math.floor(mxx/CHUNK),stx+mt-1);
        for(let stz=Math.floor(mnz/CHUNK); stz<=Math.floor(mxz/CHUNK); stz+=mt){
            const etz=Math.min(Math.floor(mxz/CHUNK),stz+mt-1);
            const res=buildRegion(insts,stx*CHUNK,(etx+1)*CHUNK-1,0,mxy,stz*CHUNK,(etz+1)*CHUNK-1, name+' part'+num);
            if(!res||!res.totalChunks) continue;
            const ox=stx*CHUNK,oz=stz*CHUNK;
            parts.push({bytes:res.bytes,name:`${name}_partie_${num}_x${ox}_z${oz}.bloxdschem`,ox,oz});num++;
        }
    }
    if (parts.length===1) { download(new Blob([parts[0].bytes]), parts[0].name); setStatus(i18n('export_done', parts[0].name, sel.length)); return; }
    const zip=new JSZip(); const folder=zip.folder(name); const lines=[];
    for (const p of parts){ folder.file(p.name,p.bytes); lines.push(`  • ${p.name} → placer en (${p.ox},0,${p.oz})`); }
    folder.file('GUIDE.txt',[`Export multi-schems : ${sel.length} schem(s), ${parts.length} partie(s).`,'', ...lines].join('\n'));
    zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}}).then(blob=>{
        download(blob, name+'.zip'); setStatus(i18n('export_parts', parts.length));
    });
}

/* Export multi : 3 modes */

// Mode 1 : UN seul schem, jamais decoupe, jamais zip
function exportMergedSingle() {
    const sel = Array.from(state.selection);
    if (sel.length === 0) { setStatus(i18n('no_export_sel')); return; }
    closeMultiExportModal();
    const insts = sel.map(i => ({ schem: i.schem, pos: { ...i.pos } }));
    let name = (prompt(i18n('prompt_export_name'), sel.length === 1 ? sel[0].name : 'selection') || 'selection').trim().replace(/[^\w\-]+/g,'_') || 'selection';
    const { bytes } = buildMergedSchem(insts, name);
    const fn = name + '.bloxdschem';
    download(new Blob([bytes], {type:'application/octet-stream'}), fn);
    setStatus(i18n('export_done', fn, sel.length));
}

/* Choix d'export multi : un seul schem (fusion) ou plusieurs (séparés) */
function openMultiExportModal() {
    if (Array.from(state.selection).length === 0) { setStatus(i18n('no_export_sel')); return; }
    document.getElementById('multi-export-modal').classList.add('active');
}
function closeMultiExportModal(){ document.getElementById('multi-export-modal').classList.remove('active'); }
function exportSeparateSelected() {
    const sel = Array.from(state.selection);
    if (sel.length === 0) { setStatus(i18n('no_export_sel')); return; }
    closeMultiExportModal();
    const parts = []; const used = {};
    for (const inst of sel) {
        const { bytes } = buildMergedSchem([{schem: inst.schem, pos:{x:0,y:0,z:0}}], inst.name);
        let base = (inst.name||'schem').replace(/[^\w\-]+/g,'_') || 'schem';
        let nm = base + '.bloxdschem', k = 1;
        while (used[nm]) { nm = base + '_' + (k++) + '.bloxdschem'; }
        used[nm] = true;
        parts.push({name:nm, bytes});
    }
    if (parts.length === 1) {
        download(new Blob([parts[0].bytes], {type:'application/octet-stream'}), parts[0].name);
        setStatus(i18n('export_done', parts[0].name, 1));
        return;
    }
    const zip = new JSZip(); const folder = zip.folder('schems');
    for (const p of parts) folder.file(p.name, p.bytes);
    zip.generateAsync({type:'blob', compression:'DEFLATE', compressionOptions:{level:6}}).then(blob => {
        download(blob, 'schems.zip');
        setStatus(i18n('export_parts', parts.length));
    });
}

/* =====================================================
   BUILD MERGED SCHEM (export)
   ===================================================== */
function mergeSchemsInMemory(insts, name) {
    // Fusionne les Maps de chunks directement en memoire (sans encoder/decoder du binaire)
    let mnx=Infinity,mny=Infinity,mnz=Infinity,mxx=-Infinity,mxy=-Infinity,mxz=-Infinity;
    for (const i of insts) {
        const b = i.schem.aabb;
        mnx=Math.min(mnx,i.pos.x); mny=Math.min(mny,i.pos.y); mnz=Math.min(mnz,i.pos.z);
        mxx=Math.max(mxx,i.pos.x+b.maxX); mxy=Math.max(mxy,i.pos.y+b.maxY); mxz=Math.max(mxz,i.pos.z+b.maxZ);
    }
    const wmx=Math.floor(mnx/CHUNK)*CHUNK, wmy=0, wmz=Math.floor(mnz/CHUNK)*CHUNK;
    const WMx=Math.ceil((mxx+1)/CHUNK)*CHUNK, WMy=Math.ceil((mxy+1)/CHUNK)*CHUNK, WMz=Math.ceil((mxz+1)/CHUNK)*CHUNK;
    const chunks = new Map();
    const arrGet = (cx,cy,cz) => {
        const k = cx+','+cy+','+cz;
        let a = chunks.get(k);
        if (!a) { a = new Int32Array(CHUNK_VOL); chunks.set(k,a); }
        return a;
    };
    let totalBlocks = 0;
    for (const inst of insts) {
        const s = inst.schem, ox = inst.pos.x, oy = inst.pos.y, oz = inst.pos.z;
        s.blocks.forEach((arr, key) => {
            const [ncx, ncy, ncz] = key.split(',').map(Number);
            for (let lx = 0; lx < CHUNK; lx++) {
                for (let ly = 0; ly < CHUNK; ly++) {
                    for (let lz = 0; lz < CHUNK; lz++) {
                        const bid = arr[lx*1024+ly*32+lz];
                        if (bid === AIR_ID) continue;
                        const nx = ncx*CHUNK+lx, ny = ncy*CHUNK+ly, nz = ncz*CHUNK+lz;
                        const wx = ox+nx, wy = oy+ny, wz = oz+nz;
                        const cx = Math.floor((wx-wmx)/CHUNK);
                        const cy = Math.floor((wy-wmy)/CHUNK);
                        const cz = Math.floor((wz-wmz)/CHUNK);
                        const clx = ((wx-wmx)%CHUNK+CHUNK)%CHUNK;
                        const cly = ((wy-wmy)%CHUNK+CHUNK)%CHUNK;
                        const clz = ((wz-wmz)%CHUNK+CHUNK)%CHUNK;
                        arrGet(cx,cy,cz)[clx*1024+cly*32+clz] = bid;
                        totalBlocks++;
                    }
                }
            }
        });
    }
    const sizeX = mxx-mnx+1, sizeY = mxy-mny+1, sizeZ = mxz-mnz+1;
    return {
        name, version: 0,
        rawPos: { x:0, y:0, z:0 }, rawSize: { x:sizeX, y:sizeY, z:sizeZ },
        blocks: chunks, nonEmptyChunks: chunks.size, totalBlocks,
        aabb: { minX:0, minY:0, minZ:0, maxX:sizeX-1, maxY:sizeY-1, maxZ:sizeZ-1 },
        size: { x:sizeX, y:sizeY, z:sizeZ }
    };
}

function buildMergedSchem(insts, name) {
    let mnx=Infinity,mny=Infinity,mnz=Infinity,mxx=-Infinity,mxy=-Infinity,mxz=-Infinity;
    for (const i of insts) {
        const b = i.schem.aabb;
        mnx=Math.min(mnx,i.pos.x); mny=Math.min(mny,i.pos.y); mnz=Math.min(mnz,i.pos.z);
        mxx=Math.max(mxx,i.pos.x+b.maxX); mxy=Math.max(mxy,i.pos.y+b.maxY); mxz=Math.max(mxz,i.pos.z+b.maxZ);
    }
    return buildRegion(insts, mnx, mxx, 0, mxy, mnz, mxz, name);
}

function buildRegion(instances, mnx, mxx, mny, mxy, mnz, mxz, name) {
    const wmx=Math.floor(mnx/CHUNK)*CHUNK, wmy=0, wmz=Math.floor(mnz/CHUNK)*CHUNK;
    const WMx=Math.ceil((mxx+1)/CHUNK)*CHUNK, WMy=Math.ceil((mxy+1)/CHUNK)*CHUNK, WMz=Math.ceil((mxz+1)/CHUNK)*CHUNK;
    const sx=WMx-wmx,sy=WMy-wmy,sz=WMz-wmz;
    const chunks = new Map();
    const arrGet = (cx,cy,cz)=>{const k=cx+','+cy+','+cz;let a=chunks.get(k);if(!a){a=new Int32Array(CHUNK_VOL);chunks.set(k,a);}return a;};
    for (const inst of instances) {
        const s=inst.schem,ox=inst.pos.x,oy=inst.pos.y,oz=inst.pos.z;
        if (ox+s.size.x-1<mnx||ox>mxx||oy+s.size.y-1<mny||oy>mxy||oz+s.size.z-1<mnz||oz>mxz) continue;
        s.blocks.forEach((arr,key)=>{
            const [ncx,ncy,ncz]=key.split(',').map(Number);
            for(let lx=0;lx<CHUNK;lx++)for(let ly=0;ly<CHUNK;ly++)for(let lz=0;lz<CHUNK;lz++){
                const bid=arr[lx*1024+ly*32+lz]; if(bid===AIR_ID) continue;
                const nx=ncx*CHUNK+lx, ny=ncy*CHUNK+ly, nz=ncz*CHUNK+lz;
                const wx=ox+nx,wy=oy+ny,wz=oz+nz;
                if(wx<mnx||wx>mxx||wy<mny||wy>mxy||wz<mnz||wz>mxz) continue;
                const cx=Math.floor((wx-wmx)/CHUNK),cy=Math.floor((wy-wmy)/CHUNK),cz=Math.floor((wz-wmz)/CHUNK);
                const clx=((wx-wmx)%CHUNK+CHUNK)%CHUNK,cly=((wy-wmy)%CHUNK+CHUNK)%CHUNK,clz=((wz-wmz)%CHUNK+CHUNK)%CHUNK;
                arrGet(cx,cy,cz)[clx*1024+cly*32+clz]=bid;
            }
        });
    }
    if(!chunks.size) return null;
    const airRle = encodeChunkRLE(new Int32Array(CHUNK_VOL));
    const nCX=Math.round(sx/CHUNK),nCY=Math.round(sy/CHUNK),nCZ=Math.round(sz/CHUNK);
    const ps=[new Uint8Array([0,0,0,0]),writeAvroString(name)];
    ps.push(writeAvroInt(0)); ps.push(writeAvroInt(0)); ps.push(writeAvroInt(0));
    ps.push(writeAvroInt(sx)); ps.push(writeAvroInt(sy)); ps.push(writeAvroInt(sz));
    const totalChunks = nCX*nCY*nCZ;
    ps.push(writeAvroInt(totalChunks));
    for(let cx=0;cx<nCX;cx++)for(let cy=0;cy<nCY;cy++)for(let cz=0;cz<nCZ;cz++){
        ps.push(writeAvroInt(cx)); ps.push(writeAvroInt(cy)); ps.push(writeAvroInt(cz));
        const arr=chunks.get(cx+','+cy+','+cz);
        ps.push(writeAvroBytes(arr?encodeChunkRLE(arr):airRle));
    }
    ps.push(writeAvroInt(0));
    return {bytes:concatBytes(ps),totalChunks};
}

/* =====================================================
   EXPORT
   ===================================================== */
function instancesForBuild() {
    return state.instances.map(i => ({ schem: i.schem, pos: { ...i.pos } }));
}

function computeExtent() {
    const insts = instancesForBuild();
    if (!insts.length) return null;
    let mnx=Infinity,mny=Infinity,mnz=Infinity,mxx=-Infinity,mxy=-Infinity,mxz=-Infinity;
    for (const i of insts) {
        mnx=Math.min(mnx,i.pos.x); mny=Math.min(mny,i.pos.y); mnz=Math.min(mnz,i.pos.z);
        mxx=Math.max(mxx,i.pos.x+i.schem.aabb.maxX); mxy=Math.max(mxy,i.pos.y+i.schem.aabb.maxY); mxz=Math.max(mxz,i.pos.z+i.schem.aabb.maxZ);
    }
    function rdn(v){return Math.floor(v/CHUNK)*CHUNK;}
    function rup(v){return Math.ceil((v+1)/CHUNK)*CHUNK;}
    const wmx=rdn(mnx),wmy=0,wmz=rdn(mnz),WMx=rup(mxx),WMy=rup(mxy),WMz=rup(mxz);
    return { gMinX:wmx,gMinY:wmy,gMinZ:wmz, gMaxX:WMx-1,gMaxY:WMy-1,gMaxZ:WMz-1,
             nCX:Math.round((WMx-wmx)/CHUNK), nCY:Math.round((WMy-wmy)/CHUNK), nCZ:Math.round((WMz-wmz)/CHUNK) };
}

function openExportModal() {
    if (!state.instances.length) { alert(i18n('export_fail')); return; }
    const ext = computeExtent();
    document.getElementById('export-info').innerHTML =
        `<div>Étendue : <b>${ext.gMaxX-ext.gMinX+1}×${ext.gMaxY-ext.gMinY+1}×${ext.gMaxZ-ext.gMinZ+1}</b> blocs</div><div>Chunks : <b>${ext.nCX*ext.nCY*ext.nCZ}</b></div><div id="export-hint2" style="margin-top:6px;"></div>`;
    document.getElementById('export-modal').classList.add('active'); updateExportHint();
}

function closeExportModal(){ document.getElementById('export-modal').classList.remove('active'); }

function updateExportHint() {
    const ext = computeExtent(); if(!ext) return;
    const total=ext.nCX*ext.nCY*ext.nCZ, LIM=160;
    const forced=document.getElementById('export-single').checked;
    let txt;
    if(forced) txt = total>LIM ? `⚠️ Un seul fichier (${total} chunks) : risque de rejet par Bloxd.` : `Un seul fichier (${total} chunks) : OK.`;
    else { const mt=Math.max(1,Math.floor(Math.sqrt(LIM/Math.max(1,ext.nCY)))); const np=Math.ceil(ext.nCX/mt)*Math.ceil(ext.nCZ/mt);
        txt = np===1 ? `Détection : 1 seul fichier (${total} chunks).` : `Détection : ${np} parties dans un zip.`; }
    document.getElementById('export-mode-hint').textContent = txt;
}

function doExport() {
    const base=(document.getElementById('export-name').value||'monde').trim().replace(/[^\w\-]+/g,'_')||'monde';
    const folder=(document.getElementById('export-folder').value||'schematics').trim()||'schematics';
    const coords=document.getElementById('export-coords').checked, forced=document.getElementById('export-single').checked;
    const insts=instancesForBuild(), ext=computeExtent(), LIM=160;
    if (!ext) { alert(i18n('export_fail')); return; }
    const mt=Math.max(1,Math.floor(Math.sqrt(LIM/Math.max(1,ext.nCY))));
    const np=Math.ceil(ext.nCX/mt)*Math.ceil(ext.nCZ/mt);
    const ts=new Date().toISOString().replace(/[:.]/g,'-').slice(0,19);
    if(!forced && np<=1){
        const {bytes}=buildMergedSchem(insts,base);
        const fn=coords?`${base}_x0_z0.bloxdschem`:`${base}.bloxdschem`;
        download(new Blob([bytes],{type:'application/octet-stream'}),fn);
        setStatus(i18n('export_done', fn, state.instances.length)); closeExportModal(); return;
    }
    if(forced){
        // Forcer un seul fichier : pas de découpage, pas de zip
        const {bytes}=buildMergedSchem(insts,base);
        const fn=coords?`${base}_x0_z0.bloxdschem`:`${base}.bloxdschem`;
        download(new Blob([bytes],{type:'application/octet-stream'}),fn);
        setStatus(i18n('export_done', fn, state.instances.length)); closeExportModal(); return;
    }
    const parts=[]; let num=1;
    for(let stx=Math.floor(ext.gMinX/CHUNK); stx<=Math.floor(ext.gMaxX/CHUNK); stx+=mt){
        const etx=Math.min(Math.floor(ext.gMaxX/CHUNK),stx+mt-1);
        for(let stz=Math.floor(ext.gMinZ/CHUNK); stz<=Math.floor(ext.gMaxZ/CHUNK); stz+=mt){
            const etz=Math.min(Math.floor(ext.gMaxZ/CHUNK),stz+mt-1);
            const res=buildRegion(insts,stx*CHUNK,(etx+1)*CHUNK-1,ext.gMinY,ext.gMaxY,stz*CHUNK,(etz+1)*CHUNK-1, base+' part'+num);
            if(!res||!res.totalChunks) continue;
            const ox=stx*CHUNK, oz=stz*CHUNK;
            const fn=coords?`${base}_partie_${num}_x${ox}_z${oz}.bloxdschem`:`${base}_partie_${num}.bloxdschem`;
            parts.push({bytes:res.bytes,name:fn,ox,oz}); num++;
        }
    }
    if(parts.length===1){ download(new Blob([parts[0].bytes]), parts[0].name); setStatus(i18n('export_done', parts[0].name, state.instances.length)); closeExportModal(); return; }
    const zip=new JSZip(); const f=zip.folder(folder); const lines=[];
    for(const p of parts){ f.file(p.name,p.bytes); lines.push(`  • ${p.name} → placer en (${p.ox},0,${p.oz}) avant //schematic load`); }
    f.file('GUIDE_IMPORTATION.txt',['============================================================','📦 GUIDE D\'IMPORTATION DANS BLOXD.IO','============================================================','',parts.length+' partie(s) à charger.','','Parties :', ...lines, '','Astuce : glissez-déposez ce zip dans le Schem Placer pour recharger la disposition.'].join('\n'));
    zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}}).then(blob=>{
        download(blob,`${base}_${ts}.zip`); setStatus(i18n('export_parts', parts.length)); closeExportModal();
    });
}

function download(blob,name){
    const url=URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url; a.download=name; document.body.appendChild(a); a.click();
    document.body.removeChild(a); setTimeout(()=>URL.revokeObjectURL(url),1000);
}

/* =====================================================
   PRESETS
   ===================================================== */
const PRESET_KEY = 'schemPlacer.presets.v1';
const AUTOSAVE_KEY = 'schemPlacer.autosave.v1';

function schemToJSON(schem) {
    const blocks = {};
    schem.blocks.forEach((arr, key) => { blocks[key] = Array.from(arr); });
    return { name: schem.name, totalBlocks: schem.totalBlocks, aabb: { ...schem.aabb }, size: { ...schem.size }, blocks };
}

function schemFromJSON(j) {
    const blocks = new Map();
    for (const k of Object.keys(j.blocks)) blocks.set(k, new Int32Array(j.blocks[k]));
    return { name: j.name || 'schem', rawPos: { x:0, y:0, z:0 }, rawSize: { ...j.size }, blocks, nonEmptyChunks: blocks.size, totalBlocks: j.totalBlocks || 0, aabb: { ...j.aabb }, size: { ...j.size } };
}

function serializeToJSON() {
    return { version: 1, savedAt: new Date().toISOString(), nextId: state.nextId, step: state.step,
        instances: state.instances.map(i => ({ id: i.id, name: i.name, pos: { ...i.pos }, color: i.color, locked: !!i.locked, schem: schemToJSON(i.schem) })),
        unionStack: state.unionStack.map(u => ({ addedId: u.added.id, removedIds: u.removed.map(r => r.id) })) };
}

function deserializeFromJSON(data) {
    if (!data || data.version !== 1) throw new Error('Version de preset incompatible');
    clearScene(true);
    state.nextId = data.nextId || 1; state.step = data.step || 1;
    const sl = document.getElementById('step-slider'), sv = document.getElementById('step-val');
    if (sl) { sl.value = state.step; if (sv) sv.textContent = state.step; }
    const instById = new Map();
    for (const ij of data.instances) {
        const schem = schemFromJSON(ij.schem);
        const isLocked = !!ij.locked;
        const inst = { id: ij.id, name: ij.name, schem, pos: { x: ij.pos.x|0, y: ij.pos.y|0, z: ij.pos.z|0 }, color: ij.color || PALETTE[ij.id % PALETTE.length], aabb: { ...schem.aabb }, size: { ...schem.size }, totalBlocks: schem.totalBlocks, locked: isLocked };
        if (isLocked) inst.group = SchemPlacerBabylon.buildLockedMesh(inst);
        else { inst.group = SchemPlacerBabylon.buildSchemMesh(schem).group; }
        inst.group.metadata = { instanceId: inst.id };
        inst.group.getChildMeshes().forEach(mesh => { mesh.metadata = { instanceId: inst.id }; });
        inst.group.position.set(inst.pos.x, inst.pos.y, inst.pos.z);
        state.instances.push(inst); instById.set(inst.id, inst);
    }
    state.unionStack = (data.unionStack || []).map(u => ({ added: instById.get(u.addedId), removed: (u.removedIds || []).map(rid => instById.get(rid)).filter(Boolean) })).filter(u => u.added);
    cancelCut(); clearMultiSelection();
    if (state.instances.length > 0) select(state.instances[0]); else select(null);
    renderList(); SchemPlacerBabylon.updateOutline(); updateInspector();
    setStatus(i18n('loaded_saved', state.instances.length));
}

function savePreset(silent) {
    const name = (prompt(i18n('save_prompt'), 'mon_preset') || '').trim();
    if (!name) return false;
    const key = name.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const presets = loadPresetsMap();
    presets[key] = { name, savedAt: new Date().toISOString(), data: serializeToJSON() };
    localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
    refreshPresetMenu();
    if (!silent) setStatus(i18n('preset_saved', name));
    return true;
}

function loadPresetsMap() {
    try { return JSON.parse(localStorage.getItem(PRESET_KEY) || '{}'); }
    catch(e) { return {}; }
}

function loadPreset(key) {
    const presets = loadPresetsMap(); const entry = presets[key]; if (!entry) return false;
    try { deserializeFromJSON(entry.data); setStatus(`📂 Preset "${entry.name}" chargé.`); return true; }
    catch(e) { alert('Échec du chargement : ' + e.message); return false; }
}

function deletePreset(key) {
    const presets = loadPresetsMap(); if (!presets[key]) return;
    if (!confirm(`Supprimer le preset "${presets[key].name}" ?`)) return;
    delete presets[key]; localStorage.setItem(PRESET_KEY, JSON.stringify(presets)); refreshPresetMenu();
}

function refreshPresetMenu() {
    const menu = document.getElementById('preset-menu'); if (!menu) return;
    menu.innerHTML = '';
    const presets = loadPresetsMap();
    const keys = Object.keys(presets).sort((a,b) => (presets[b].savedAt||'').localeCompare(presets[a].savedAt||''));
    if (keys.length === 0) { const it = document.createElement('div'); it.className = 'preset-empty'; it.textContent = i18n('preset_empty'); menu.appendChild(it); return; }
    keys.forEach(k => {
        const row = document.createElement('div'); row.className = 'preset-row';
        const d = new Date(presets[k].savedAt);
        const date = d.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
        const safeName = presets[k].name.replace(/[<>&"]/g, c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
        row.innerHTML = `<span class="preset-name" title="${safeName}">${safeName}</span><span class="preset-date">${date}</span><button class="preset-del" title="${i18n('delete')}">✕</button>`;
        row.addEventListener('click', e => { if (e.target.closest('.preset-del')) return; e.stopPropagation(); menu.classList.remove('open'); loadPreset(k); });
        row.querySelector('.preset-del').addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); deletePreset(k); });
        menu.appendChild(row);
    });
}

function autosave() { try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(serializeToJSON())); } catch(e) {} }

function tryRestoreAutosave() {
    try {
        const raw = localStorage.getItem(AUTOSAVE_KEY); if (!raw) return false;
        const data = JSON.parse(raw); if (!data.instances || !data.instances.length) return false;
        deserializeFromJSON(data); return true;
    } catch(e) { console.warn('Autosave corrompu :', e); return false; }
}

function clearScene(skipConfirm) {
    if (!skipConfirm && state.instances.length) { if (!confirm(i18n('confirm_clear'))) return false; }
    [...state.instances].forEach(i => { SchemPlacerBabylon.removeInstanceFromScene(i); });
    state.instances = []; state.selected = null; state.nextId = 1; state.unionStack = [];
    cancelCut(); clearMultiSelection();
    const mo = SchemPlacerBabylon.multiOutlines; if (mo) { mo.forEach(o => { if (o && o.dispose) o.dispose(); }); mo.length = 0; }
    SchemPlacerBabylon.updateOutline(); renderList(); updateInspector();
    if (!skipConfirm) setStatus(i18n('clear_done'));
    return true;
}

/* =====================================================
   STATUS / KEYBOARD
   ===================================================== */
function setStatus(t){ document.getElementById('status-text').textContent = t; }
function updateStatusBar() {
    const cam = SchemPlacerBabylon.getCamera();
    if (cam) { const p = cam.position; document.getElementById('cam-coord').textContent = `${Math.round(p.x)},${Math.round(p.y)},${Math.round(p.z)}`; }
    document.getElementById('step-readout').textContent = state.step;
}

function onKeyDown(e) {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { state.shiftDown = true; return; }
    if (e.code === 'Escape') { cancelCut(); clearMultiSelection(); select(null); e.preventDefault(); return; }
    if (e.code === 'KeyV') { setMode('select'); e.preventDefault(); return; }
    if (e.code === 'KeyG') { setMode('move'); e.preventDefault(); return; }
    if (e.code === 'KeyT') { setMode('scale'); e.preventDefault(); return; }
    if (e.code === 'KeyM') { setMode('multi'); e.preventDefault(); return; }
    if (e.code === 'Delete' || e.code === 'Backspace') { if (state.selected && !state.selected.locked) { removeInstance(state.selected); e.preventDefault(); } return; }
    if (e.code === 'KeyD' && (e.ctrlKey||e.metaKey)) { e.preventDefault(); if (state.selected) duplicateInstance(state.selected); else setStatus(i18n('no_sel')); return; }
    if (e.code === 'KeyO' && (e.ctrlKey||e.metaKey)) { document.getElementById('file-input').click(); e.preventDefault(); return; }
    if (e.code === 'KeyE' && (e.ctrlKey||e.metaKey)) { openExportModal(); e.preventDefault(); return; }
    if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey && state.selected) { SchemPlacerBabylon.focusOnInstance(state.selected); e.preventDefault(); return; }
    if (e.code === 'KeyL' && state.selected) { e.preventDefault(); toggleLock(state.selected); return; }

    // === SCALE MODE: keyboard cut plane adjustment ===
    if (state.mode === 'scale' && state.selected && state.cutBoxData) {
        const s = state.step * (state.shiftDown ? 10 : 1);
        let moved = false;
        // Select which face to adjust
        if (e.code === 'KeyX') { state.cutFace = (state.cutFace==='x1'?'x0':'x1'); moved = true; }
        else if (e.code === 'KeyY') { state.cutFace = (state.cutFace==='y1'?'y0':'y1'); moved = true; }
        else if (e.code === 'KeyZ') { state.cutFace = (state.cutFace==='z1'?'z0':'z1'); moved = true; }
        // Adjust selected face
        else if (state.cutFace) {
            if (e.code === 'ArrowUp' || e.code === 'ArrowRight') { SchemPlacerBabylon.adjustCutPlane(state.cutFace, s); moved = true; }
            else if (e.code === 'ArrowDown' || e.code === 'ArrowLeft') { SchemPlacerBabylon.adjustCutPlane(state.cutFace, -s); moved = true; }
        }
        if (moved) { e.preventDefault(); updateCutFaceLabel(); return; }
        return;
    }

    // Flèches + R/C = déplacer le schem (mode select/move)
    if (state.selected && !state.selected.locked && !state.gizmoDragging && !(e.ctrlKey||e.metaKey)) {
        const s = state.step * (state.shiftDown ? 10 : 1); let moved = true;
        switch (e.code) {
            case 'ArrowUp':    moveSelected(0,0,-s); break;
            case 'ArrowDown':  moveSelected(0,0, s); break;
            case 'ArrowLeft':  moveSelected(-s,0,0); break;
            case 'ArrowRight': moveSelected( s,0,0); break;
            case 'KeyR': case 'PageUp':     moveSelected(0, s,0); break;
            case 'KeyC': case 'PageDown':   moveSelected(0,-s,0); break;
            default: moved = false;
        }
        if (moved) { e.preventDefault(); return; }
    }
}

function toggleLock(inst) {
    inst.locked = !inst.locked;
    if (inst.locked) {
        SchemPlacerBabylon.removeInstanceFromScene(inst);
        inst.group = SchemPlacerBabylon.buildLockedMesh(inst);
    } else {
        SchemPlacerBabylon.removeInstanceFromScene(inst);
        inst.group = SchemPlacerBabylon.buildSchemMesh(inst.schem).group;
    }
    inst.group.getChildMeshes().forEach(m => { m.metadata = { instanceId: inst.id }; });
    inst.group.position.set(inst.pos.x, inst.pos.y, inst.pos.z);
    SchemPlacerBabylon.updateOutline(); renderList();
}

function onKeyUp(e) {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { state.shiftDown = false; }
}

function moveSelected(dx,dy,dz){
    const i=state.selected; if(!i)return; if (i.locked) return;
    i.pos.x+=dx;i.pos.y+=dy;i.pos.z+=dz;
    i.group.position.set(i.pos.x,i.pos.y,i.pos.z);
    const snap = findSnap(i);
    if (snap) { i.pos.x = snap.newPos.x; i.pos.y = snap.newPos.y; i.pos.z = snap.newPos.z; i.group.position.set(i.pos.x,i.pos.y,i.pos.z); SchemPlacerBabylon.showSnapIndicator(snap); }
    else { SchemPlacerBabylon.showSnapIndicator(null); }
    SchemPlacerBabylon.updateOutline(); updateInspector(); renderList();
}

/* =====================================================
   DRAG & DROP / FILE LOADING
   ===================================================== */
function initDragDrop() {
    const vp = document.getElementById('viewport'), ov = document.getElementById('drop-overlay'); let c=0;
    vp.addEventListener('dragenter', e=>{e.preventDefault();c++;ov.classList.add('active');});
    vp.addEventListener('dragover', e=>e.preventDefault());
    vp.addEventListener('dragleave', e=>{e.preventDefault();c--;if(c<=0){c=0;ov.classList.remove('active');}});
    vp.addEventListener('drop', async e=>{ e.preventDefault(); c=0; ov.classList.remove('active');
        const files = []; if(e.dataTransfer?.files?.length) for(let i=0;i<e.dataTransfer.files.length;i++) files.push(e.dataTransfer.files[i]);
        if(files.length) await loadFiles(files);
    });
}

function parseOffsetFromName(filename) {
    const mx = filename.match(/_x(-?\d+)/i), mz = filename.match(/_z(-?\d+)/i);
    if (mx && mz) return { x: parseInt(mx[1],10), z: parseInt(mz[1],10) };
    return null;
}

async function addFromBytes(buf, filename, forcedPos) {
    const base = (filename||'schem').replace(/\.(bloxdschem|schem|bin)$/i,'');
    let schem;
    try { schem = await parseSchemAsync(buf, base); }
    catch(e) { console.error(e); schem = null; }
    if (!schem) { console.warn('Impossible de parser : ' + base); return null; }
    if (!schem.name || !schem.name.length) schem.name = base;
    addInstance(base, schem, forcedPos || null);
    return schem;
}

async function loadFiles(files) {
    let ok = 0, fail = 0;
    for (const f of files) {
        try {
            const low = f.name.toLowerCase();
            if (low.endsWith('.zip')) { ok += await loadZip(f); }
            else { const buf = await f.arrayBuffer(); const off = parseOffsetFromName(f.name);
                const result = await addFromBytes(buf, f.name, off ? { x:off.x, y:0, z:off.z } : null);
                if (result) ok++; else fail++; }
        } catch (e) { console.error(e); fail++; }
    }
    if (fail) alert(i18n('del_fail', fail));
    if (ok) setStatus(i18n('schem_loaded', ok));
}

async function loadZip(file) {
    if (typeof JSZip === 'undefined') { alert('JSZip manquant'); return 0; }
    const zip = await JSZip.loadAsync(file);
    let count = 0; const entries = [];
    zip.forEach((rel, entry) => { if (entry.dir) return; const l = rel.toLowerCase();
        if (l.endsWith('.bloxdschem')||l.endsWith('.schem')||l.endsWith('.bin')) entries.push({ name: rel.split('/').pop(), entry });
    });
    for (const {name, entry} of entries) {
        try { const buf = await entry.async('arraybuffer'); const off = parseOffsetFromName(name);
            const result = await addFromBytes(buf, name, off ? { x:off.x, y:0, z:off.z } : null); if (result) count++; }
        catch(e) { console.warn('Échec',name,e); }
    }
    return count;
}

/* =====================================================
   BLOCK COLORS STUB
   ===================================================== */
window.BlockColors = { blockNameMap: {}, initFromNameMap: function(map) { this.blockNameMap = map; } };

/* =====================================================
   INIT UI
   ===================================================== */
function initUI() {
    document.getElementById('file-input').addEventListener('change', e => { if(e.target.files?.length){ loadFiles(e.target.files); e.target.value=''; } });
    document.getElementById('btn-open').addEventListener('click', ()=>document.getElementById('file-input').click());
    const hint = document.getElementById('open-hint'); if (hint) hint.addEventListener('click', ()=>document.getElementById('file-input').click());
    document.getElementById('btn-export').addEventListener('click', openExportModal);
    document.getElementById('btn-export-cancel').addEventListener('click', closeExportModal);
    document.getElementById('btn-export-go').addEventListener('click', doExport);
    document.getElementById('export-single').addEventListener('change', updateExportHint);
    document.getElementById('btn-clear').addEventListener('click', ()=>{ clearScene(); });
    document.getElementById('btn-save-preset').addEventListener('click', () => { if (!state.instances.length) { setStatus('—'); return; }
        const name = (prompt(i18n('save_prompt'), 'mon_preset') || '').trim(); if (!name) return;
        const key = name.replace(/[^a-zA-Z0-9_\-]/g, '_'); const presets = loadPresetsMap();
        presets[key] = { name, savedAt: new Date().toISOString(), data: serializeToJSON() };
        localStorage.setItem(PRESET_KEY, JSON.stringify(presets)); refreshPresetMenu(); setStatus(i18n('preset_saved', name));
    });
    document.getElementById('btn-load-preset').addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); refreshPresetMenu(); document.getElementById('preset-menu').classList.toggle('open'); });
    document.addEventListener('mousedown', (e) => { const menu = document.getElementById('preset-menu'); if (menu && !e.target.closest('#preset-wrap')) menu.classList.remove('open'); });
    refreshPresetMenu();
    const btnLang = document.getElementById('btn-lang');
    if (btnLang) { btnLang.addEventListener('click', () => { setLang(state.lang === 'fr' ? 'en' : 'fr'); setModeHint(); }); }
    setLang(localStorage.getItem('bloxdTools.lang') || localStorage.getItem('schemPlacer.lang') || 'en');
    $$('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
    document.getElementById('btn-duplicate').addEventListener('click',()=>{ if (!state.selected) { setStatus(i18n('no_sel')); return; } const n = duplicateInstance(state.selected); if (n) setStatus(i18n('drag_dupe') + n.name); });
    document.getElementById('btn-delete').addEventListener('click',()=>state.selected&&removeInstance(state.selected));
    document.getElementById('btn-focus').addEventListener('click',()=>state.selected&&SchemPlacerBabylon.focusOnInstance(state.selected));
    document.getElementById('btn-rename').addEventListener('click',()=>{ const i=state.selected; if(!i)return; const n=prompt(i18n('prompt_new_name'),i.name); if(n&&n.trim()){i.name=n.trim();renderList();updateInspector();} });
    document.getElementById('sel-color').addEventListener('input',e=>{ const i=state.selected; if(!i)return; i.color=parseInt(e.target.value.slice(1),16); renderList(); SchemPlacerBabylon.updateOutline(); });
    const sl=document.getElementById('step-slider'), sv=document.getElementById('step-val');
    sl.addEventListener('input',()=>{state.step=parseInt(sl.value,10);sv.textContent=state.step;updateStatusBar();});
    document.getElementById('schem-header').addEventListener('click',()=>document.getElementById('schem-panel').classList.toggle('collapsed'));
    document.getElementById('btn-cut-cancel').addEventListener('click',()=>{cancelCut(); setMode('select');});
    document.getElementById('btn-cut-extract').addEventListener('click',()=>performCut(true));
    document.getElementById('btn-cut-copy').addEventListener('click',()=>performCut(false));
    document.getElementById('btn-multi-union').addEventListener('click', unionSelected);
    document.getElementById('btn-multi-split').addEventListener('click', splitLastUnion);
    document.getElementById('btn-multi-export').addEventListener('click', openMultiExportModal);
    document.getElementById('btn-multi-cancel').addEventListener('click', () => { clearMultiSelection(); setMode('select'); });
    document.getElementById('btn-me-single').addEventListener('click', exportMergedSingle);
    document.getElementById('btn-me-autosplit').addEventListener('click', () => { closeMultiExportModal(); exportSelected(); });
    document.getElementById('btn-me-separate').addEventListener('click', exportSeparateSelected);
    document.getElementById('btn-me-cancel').addEventListener('click', closeMultiExportModal);
    document.getElementById('multi-export-modal').addEventListener('click', e => { if(e.target.id==='multi-export-modal') closeMultiExportModal(); });
    document.getElementById('export-modal').addEventListener('click', e => { if(e.target.id==='export-modal') closeExportModal(); });
}

/* =====================================================
   BOOT
   ===================================================== */
// Empêche Ctrl/Cmd+S de déclencher la sauvegarde de la page (très gênant en édition).
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&(e.key==='s'||e.key==='S'))e.preventDefault();});
document.addEventListener('DOMContentLoaded', async () => {
    try {
    SchemPlacerBabylon.init(state);
    state.i18n = i18n; state.setStatus = setStatus; state.findSnap = findSnap;
    state.updateInspector = updateInspector; state.renderList = renderList;
    state.select = select; state.duplicateInstance = duplicateInstance;
    state.toggleMultiSelect = toggleMultiSelect;
    state.updateCutFaceLabel = updateCutFaceLabel;
    initUI(); initDragDrop();
    // Charge la table nom→id des blocs pour des couleurs fidèles (best effort ; ignoré en file://)
    fetch('nameToId.json').then(r => r.ok ? r.json() : null).then(map => {
        if (map && SchemPlacerBabylon.initBlockNameMap) {
            SchemPlacerBabylon.initBlockNameMap(map);
            if (state.instances.length) SchemPlacerBabylon.rebuildAllInstances();
        }
    }).catch(() => {});
    setMode('select');
    if (!tryRestoreAutosave()) { renderList(); setStatus(i18n('ready')); }
    refreshPresetMenu(); setModeHint();
    setInterval(autosave, 5000);
    setInterval(updateStatusBar, 500);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    } catch(e) { console.error('BOOT ERROR:', e); alert('Erreur au démarrage: ' + e.message); }
});

})();
