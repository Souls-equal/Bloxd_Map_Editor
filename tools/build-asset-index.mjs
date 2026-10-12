#!/usr/bin/env node
/**
 * tools/build-asset-index.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Génère `schems/index.json` : l'index de la bibliothèque d'assets de
 * l'Asset Placer (nom, fichier, catégorie, taille en blocs, dimensions).
 *
 * POURQUOI ?
 *   Sans index, l'Asset Placer doit deviner quels fichiers existent : il
 *   télécharge ~1000 petits .bloxdschem un par un (séquentiel) et parse
 *   chacun d'eux sur le thread principal AVANT d'afficher la liste. Sur une
 *   connexion lente et un portable modeste, cela prend des dizaines de
 *   secondes et sature la mémoire (≈ 2 millions d'objets {x,y,z,id}).
 *   Avec l'index : 1 seule requête (~15 Ko gzippé) → bibliothèque affichée
 *   instantanément ; le fichier d'un asset n'est téléchargé + parsé qu'au
 *   moment où on le pose réellement.
 *
 * LE MÊME CODE QUE LE NAVIGATEUR
 *   Les dimensions/nombres de blocs stockés ici sont calculés en exécutant
 *   VRAIMENT le pipeline applicatif (BloxdIO.parseSchem → conversion en liste
 *   → _stripBottomPlatforms → _normalizeMetadata, dans asset_placer-*.js).
 *   L'index ne peut donc pas diverger de ce que voit l'utilisateur ; c'est
 *   aussi pour ça qu'il faut le régénérer quand un schem change.
 *
 * USAGE
 *   node tools/build-asset-index.mjs            # (ré)écrit schems/index.json
 *   node tools/build-asset-index.mjs --check    # ne change rien, exit 1 si périmé
 *   node tools/build-asset-index.mjs --quiet
 *
 * QUAND LE RÉGÉNÉRER ? Quand vous ajoutez/retirez/modifiez un fichier de
 * `schems/`, ou quand vous changez `manifest.json`, ou quand vous modifiez
 * `_stripBottomPlatforms()` (les dimensions affichées en dépendent).
 * Le workflow GitHub Actions `.github/workflows/asset-index.yml` vérifie
 * automatiquement que l'index est à jour dans les Pull Requests.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import * as vm from 'node:vm';

const ROOT = path.resolve(import.meta.dirname, '..');
const SCHEMS_DIR = path.join(ROOT, 'schems');
const MANIFEST = path.join(ROOT, 'manifest.json');
const OUT = path.join(SCHEMS_DIR, 'index.json');
const CORE = path.join(ROOT, 'asset_placer-core.js');
const UI = path.join(ROOT, 'asset_placer-ui.js');

const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const QUIET = argv.includes('--quiet');

const SCHEMA = 1;
const SUPPORTED_EXT = ['.bloxdschem', '.json', '.schem'];
const log = (...a) => { if (!QUIET) console.log(...a); };
const die = (msg) => { console.error('✖ ' + msg); process.exit(1); };

/* ──────────────────────────────────────────────────────────────────────────
 * 1. Chargement du pipeline réel de l'application dans un contexte Node.
 *    Les deux fichiers sont des scripts « classic » (IIFE + window.*), sans
 *    DOM au niveau top-level : on peut donc les évaluer avec de simples
 *    stubs et réutiliser leurs méthodes telles quelles.
 * ──────────────────────────────────────────────────────────────────────── */
function loadAppPipeline() {
    const noop = () => {};
    const el = new Proxy({}, {
        get: (_t, p) => {
            if (p === 'style' || p === 'dataset') return {};
            if (p === 'classList') return { add: noop, remove: noop, toggle: noop, contains: () => false };
            if (p === 'innerHTML' || p === 'textContent' || p === 'value') return '';
            return noop;
        },
        set: () => true,
    });
    const document = {
        createElement: () => el,
        createElementNS: () => el,
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: noop,
        removeEventListener: noop,
        body: el,
        documentElement: el,
        readyState: 'complete',
    };
    const storage = { getItem: () => null, setItem: noop, removeItem: noop, key: () => null, length: 0 };
    const ctx = {
        document,
        navigator: { language: 'fr', userAgent: 'node', clipboard: {} },
        localStorage: storage,
        sessionStorage: storage,
        addEventListener: noop,
        removeEventListener: noop,
        setTimeout, clearTimeout, setInterval, clearInterval,
        requestAnimationFrame: (cb) => setTimeout(cb, 0),
        cancelAnimationFrame: clearTimeout,
        console, TextEncoder, TextDecoder, URL, Promise, JSON, Math, Date, performance,
        fetch: () => Promise.reject(new Error('fetch indisponible dans le générateur d’index')),
        Blob: class Blob {},
        // Stubs suffisants pour que la définition des classes s'exécute :
        // aucun de ces symboles n'est appelé pendant la construction de l'index.
        BABYLON: new Proxy({}, { get: () => function () {} }),
    };
    ctx.globalThis = ctx; ctx.self = ctx; ctx.window = ctx; ctx.global = ctx;
    vm.createContext(ctx);
    for (const file of [CORE, UI]) {
        if (!fs.existsSync(file)) die(`fichier requis introuvable : ${path.relative(ROOT, file)}`);
        vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: path.basename(file) });
    }
    if (!ctx.BloxdIO?.parseSchem) die('window.BloxdIO.parseSchem introuvable — asset_placer-core.js a changé ?');
    if (!ctx.SchematicLibraryLoader) die('window.SchematicLibraryLoader introuvable — asset_placer-ui.js a changé ?');
    return ctx;
}

/** Fabrique un « faux » SchematicLibraryLoader : uniquement le pipeline
 *  fetch/parse, sans UI ni scène 3D (les méthodes utilisées n'ont pas de `this` d'état). */
function makeParser(ctx) {
    const loader = Object.create(ctx.SchematicLibraryLoader.prototype);
    const registered = new Map();
    loader.schemsDir = 'schems/';
    loader.supportedExtensions = SUPPORTED_EXT;
    loader.manifestPath = 'manifest.json';
    loader.libraryUI = null;
    loader.assetManager = {
        hasTemplate: (n) => registered.has(n),
        registerTemplate: (n, mesh, schem, meta) => { registered.set(n, { schem, meta }); },
        getTemplateMeta: (n) => registered.get(n)?.meta || {},
    };
    return loader;
}

/* ──────────────────────────────────────────────────────────────────────────
 * 2. Construction des entrées
 * ──────────────────────────────────────────────────────────────────────── */
function readManifestGroups() {
    if (!fs.existsSync(MANIFEST)) return [];
    let data;
    try { data = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); }
    catch (e) { die(`manifest.json illisible : ${e.message}`); }
    const raw = Array.isArray(data) ? data : (data.schematics || data.files || []);
    return raw.map(item => (typeof item === 'string' ? { file: item } : item)).filter(Boolean);
}

function patternFile(prefix, n, pad) {
    return `${prefix}${String(n).padStart(pad || 3, '0')}.bloxdschem`;
}

function build({ loader }) {
    const onDisk = new Set(
        fs.existsSync(SCHEMS_DIR)
            ? fs.readdirSync(SCHEMS_DIR).filter(f => SUPPORTED_EXT.some(e => f.toLowerCase().endsWith(e)))
            : die(`dossier schems/ introuvable : ${SCHEMS_DIR}`)
    );
    const entries = [];
    const seenFiles = new Set();
    const groups = readManifestGroups();

    const pushEntry = (fileName, name, type) => {
        const abs = path.join(SCHEMS_DIR, fileName);
        if (!fs.existsSync(abs)) return false;
        const buf = fs.readFileSync(abs);
        const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        let schem;
        try { schem = loader._parseBuffer(ab, 'schems/' + fileName); }
        catch (e) { console.warn(`⚠ ${fileName}: ignoré (${e.message})`); return false; }
        if (!schem || !schem.blocks || !schem.blocks.length) return false;
        const meta = loader._normalizeMetadata(type ? { type, file: 'schems/' + fileName } : { file: 'schems/' + fileName }, 'schems/' + fileName, schem);
        seenFiles.add(fileName);
        entries.push({
            n: name,
            f: fileName,
            t: meta.type.length ? meta.type.join(' ') : (type || ''),
            x: meta.size.x, y: meta.size.y, z: meta.size.z,
            b: meta.blockCount,
            s: buf.length,
        });
        return true;
    };

    // a) Groupes « pattern » du manifest (prefix + plage) : on teste directement
    //    le système de fichiers, sans bornes hautes arbitraires.
    for (const g of groups) {
        if (g.prefix === undefined) continue;
        const filesOnDisk = [...onDisk]
            .filter(f => f.startsWith(g.prefix) && f.endsWith('.bloxdschem'))
            .sort();
        for (const f of filesOnDisk) pushEntry(f, f.replace(/\.bloxdschem$/i, ''), g.type);
        if (filesOnDisk.length === 0) console.warn(`⚠ manifest: aucun fichier pour le préfixe « ${g.prefix} » — ce groupe sera vide.`);
    }

    // b) Entrées explicites du manifest (un fichier nommé).
    for (const g of groups) {
        if (g.prefix !== undefined) continue;
        const file = g.file || g.path || g.url || g.src;
        if (!file) continue;
        const fileName = String(file).replace(/^schems\//, '');
        pushEntry(fileName, g.name || fileName.replace(/\.[^.]+$/, ''), g.type);
    }

    // c) Fichiers présents mais couverts par aucune règle du manifest :
    //    ils doivent quand même apparaître dans la bibliothèque.
    const orphans = [...onDisk].filter(f => !seenFiles.has(f)).sort();
    for (const f of orphans) {
        pushEntry(f, f.replace(/\.[^.]+$/, ''), null);
    }

    entries.sort((a, b) => (a.n < b.n ? -1 : a.n > b.n ? 1 : 0));
    return { entries, orphans };
}

/* ──────────────────────────────────────────────────────────────────────────
 * 3. Main
 * ──────────────────────────────────────────────────────────────────────── */
const t0 = Date.now();
const ctx = loadAppPipeline();
const loader = makeParser(ctx);
const { entries, orphans } = build({ loader });

if (!entries.length) die('aucun asset trouvé dans schems/ — index non écrit.');

const buckets = {};
let totalBlocks = 0;
for (const e of entries) {
    const k = e.t || 'divers';
    buckets[k] = (buckets[k] || 0) + 1;
    totalBlocks += e.b;
}

const index = {
    schema: SCHEMA,
    generatedAt: new Date().toISOString(),
    generator: 'tools/build-asset-index.mjs',
    dir: 'schems/',
    count: entries.length,
    assets: entries,
};
const json = JSON.stringify(index);

if (CHECK) {
    let current = null;
    try { current = fs.readFileSync(OUT, 'utf8'); } catch { die(`index absent : ${path.relative(ROOT, OUT)} — lancez \`node tools/build-asset-index.mjs\`.`); }
    let same = false;
    try {
        const prev = JSON.parse(current);
        same = prev.schema === SCHEMA && prev.count === index.count
            && JSON.stringify(prev.assets) === JSON.stringify(index.assets);
    } catch { same = false; }
    if (!same) die(`${path.relative(ROOT, OUT)} est périmé (${entries.length} assets détectés) — relancez \`node tools/build-asset-index.mjs\`.`);
    log(`✔ ${path.relative(ROOT, OUT)} est à jour (${entries.length} assets).`);
    process.exit(0);
}

fs.writeFileSync(OUT, json + '\n', 'utf8');
const kb = (json.length / 1024).toFixed(1);
log(`✔ ${path.relative(ROOT, OUT)} : ${entries.length} assets, ${kb} Ko, ${totalBlocks.toLocaleString('fr-FR')} blocs au total (${Date.now() - t0} ms)`);
log('  ' + Object.entries(buckets).map(([k, v]) => `${k}: ${v}`).join(', '));
if (orphans.length) {
    log(`ℹ ${orphans.length} fichier(s) absent(s) du manifest, inclus quand même (catégorie vide) : ${orphans.slice(0, 6).join(', ')}${orphans.length > 6 ? '…' : ''}`);
}
