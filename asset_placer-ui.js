/**
 * asset_placer-ui.js — INTERFACE & APPLICATION (fusionné)
 * Contient: schematiclibraryloader, libraryui, uimanager, explorerui, exporter, scenemanager, app
 */

/* ═══════════════════════════════════════════════════════════════ */
/*  schematiclibraryloader  */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * asset_placer-schematiclibraryloader.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Remplit la bibliothèque d'assets de l'Asset Placer.
 *
 * ⚡ STRATÉGIE 1 — INDEX (par défaut)
 *   `schems/index.json` (généré par `tools/build-asset-index.mjs`) contient la
 *   liste complète des assets avec, pour chacun, son fichier, sa catégorie, ses
 *   dimensions et son nombre de blocs. La bibliothèque est donc affichée et
 *   filtrable en UNE requête (~12 Ko gzippé), sans rien télécharger d'autre.
 *   Le .bloxdschem d'un asset n'est téléchargé + parsé qu'au moment où on le
 *   pose (ou au survol, en préchargement).
 *
 * 🐢 STRATÉGIE 2 — BALAYAGE DU MANIFEST (repli)
 *   Si l'index est absent (fork, dépôt sans build), on retombe sur l'ancien
 *   comportement : essai des fichiers `prefix001…999`. Mais en parallèle
 *   (12 requêtes à la fois) et avec le cache HTTP, au lieu de ~1000 requêtes
 *   séquentielles `no-store` — c'est ce balayage séquentiel qui mettait
 *   l'éditeur à genoux.
 *
 * Mémoire : avant, les 922 assets étaient tous décodés en objets {x,y,z,id}
 * (~1,9 M d'objets, plus de 100 Mio) dès l'ouverture de l'onglet. Maintenant :
 * uniquement ceux qui sont réellement posés.
 */

window.SchematicLibraryLoader = class SchematicLibraryLoader {
    constructor(scene, assetManager, libraryUI) {
        this.scene = scene;
        this.assetManager = assetManager;
        this.libraryUI = libraryUI;
        this.supportedExtensions = ['.bloxdschem', '.json', '.schem'];
        this.maxPreviewBlocks = 120000;
        this.manifestPath = 'manifest.json';
        this.schemsDir = 'schems/';
        this.indexPath = 'schems/index.json';
        this.maxConsecutiveMisses = 8; // repli : stop après 8 trous consécutifs
        this.concurrency = 12;         // requêtes réseau simultanées max
        this.useCache = true;          // laisse le navigateur (et le Service Worker) recycler

        this._entries = new Map();     // nom d'affichage -> enregistrement d'index
        this._inflight = new Map();    // nom -> Promise de chargement en vol
        this._active = 0;              // requêtes en cours
        this._waiters = [];            // file d'attente de slots réseau
        this._uiTimer = 0;
        this._uiPending = null;        // Set de noms à annoncer à l'UI
        this.usedFallbackScan = false;
    }

    /* ══════════════════════ Point d'entrée ══════════════════════ */

    /** @returns {Promise<number>} nombre d'assets rendus disponibles */
    async loadFromProjectFolder() {
        const indexed = await this.loadFromIndex();
        if (indexed > 0) return indexed;
        this.usedFallbackScan = true;
        return await this.loadFromManifestScan();
    }

    /**
     * Chemin rapide : un seul fetch, aucune géométrie décodée.
     * Les entrées sont marquées `pending` ; `ensureTemplateLoaded()` les
     * complétera à la demande.
     */
    async loadFromIndex() {
        let data = null;
        try {
            const res = await fetch(this.indexPath, { cache: this.useCache ? 'default' : 'no-store' });
            if (!res || !res.ok) return 0;
            data = await res.json();
        } catch (e) { return 0; }
        // Un index d'un autre schéma ne doit jamais être mal interprété : on
        // ignore alors proprement et le balayage du manifest prend le relais.
        if (data.schema !== undefined && data.schema !== 1) {
            console.warn(`[Bloxd Tools] schems/index.json : schéma ${data.schema} non reconnu (attendu 1) — balayage du manifest utilisé à la place.`);
            return 0;
        }
        const list = data && Array.isArray(data.assets) ? data.assets : null;
        if (!list || !list.length) return 0;

        let n = 0;
        for (const e of list) {
            if (!e || !e.n || !e.f) continue;
            const name = this._makeUniqueTemplateName(e.n);
            const type = typeof e.t === 'string' ? e.t.split(/\s+/).filter(Boolean) : (Array.isArray(e.t) ? e.t : []);
            this._entries.set(name, e);
            this.assetManager.registerTemplateMeta(name, {
                sourcePath: this.schemsDir + e.f,
                type,
                biome: [],
                size: { x: e.x | 0, y: e.y | 0, z: e.z | 0 },
                blockCount: e.b | 0,
                bytes: e.s | 0,
                categories: type.map(v => `type:${v}`),
                author: '', description: '', tags: [],
                pending: true
            });
            n++;
        }
        this._flushUi(true);
        console.log(`🗂️ ${n} assets listés depuis l'index (aucun fichier téléchargé, ${Date.now() - (this._t0 || (this._t0 = Date.now()))} ms).`);
        return n;
    }

    /**
     * REPLI (pas d'index) : balaye les plages du manifest, en parallèle.
     * Un lot complet de `concurrency` 404 consécutifs arrête le groupe.
     */
    async loadFromManifestScan() {
        const entries = await this._loadManifestEntries();
        if (!entries.length) return 0;
        let total = 0;
        for (const group of entries) {
            if (group._isPattern) total += await this._loadPatternGroup(group);
            else total += await this._loadSingleEntry(group);
            this._flushUi(true);
        }
        return total;
    }

    /** Construit la liste des candidats d'un groupe, puis les charge en parallèle. */
    async _loadPatternGroup(group) {
        const { prefix, from, to, pad = 3, type } = group;
        const ext = '.bloxdschem';
        const candidates = [];
        for (let n = from; n <= to; n++) {
            const numStr = String(n).padStart(pad, '0');
            candidates.push({ n, name: `${prefix}${numStr}`, file: `${this.schemsDir}${prefix}${numStr}${ext}` });
        }
        const batchSize = Math.max(this.concurrency, 8);
        let loaded = 0, missRun = 0, stopped = false;
        const transient = [];        // trous causés par un hoquet réseau → réessayés une fois

        for (let i = 0; i < candidates.length && !stopped; i += batchSize) {
            const batch = candidates.slice(i, i + batchSize);
            // Les téléchargements partent ensemble (limités par le sémaphore) ;
            // le décodage, lui, reste séquentiel pour ne pas saturer le thread
            // principal — c'est lui qui doit aussi peindre l'interface.
            const fetched = await Promise.all(batch.map(c => this._fetch(c.file, 2)));
            let confirmed404 = 0;
            for (let j = 0; j < batch.length; j++) {
                const res = fetched[j], c = batch[j];
                if (!res) { transient.push(c); continue; }          // échec réseau : à retenter
                if (!res.ok) {                                       // 404 confirmé : absent
                    if (res.status === 404) { confirmed404++; missRun++; }
                    else transient.push(c);
                    continue;
                }
                try {
                    const buffer = await res.arrayBuffer();
                    const schem = this._parseBuffer(buffer, c.file);
                    if (!schem || !schem.blocks || !schem.blocks.length) { missRun++; continue; }
                    missRun = 0;
                    const uniqueName = this._makeUniqueTemplateName(c.name);
                    const meta = this._normalizeMetadata({ type, file: c.file }, c.file, schem);
                    this.assetManager.registerTemplate(uniqueName, null, schem, meta);
                    loaded++;
                    this._uiAnnounce(uniqueName);
                } catch (e) { missRun++; }
            }
            this._flushUi();
            // Arrêt anticipé : une pleine fournée de trous confirmés = fin de la plage.
            if (confirmed404 >= batch.length || missRun >= this.maxConsecutiveMisses * 2) stopped = true;
        }

        // Filet de sécurité : un hoquet réseau ne doit pas faire disparaître un
        // asset de la bibliothèque (comportement hérité de l'ancien chargeur).
        for (let i = 0; i < transient.length; i += batchSize) {
            const batch = transient.slice(i, i + batchSize);
            const fetched = await Promise.all(batch.map(c => this._fetch(c.file, 2)));
            for (let j = 0; j < batch.length; j++) {
                const res = fetched[j];
                if (!res || !res.ok) continue;
                try {
                    const schem = this._parseBuffer(await res.arrayBuffer(), batch[j].file);
                    if (!schem || !schem.blocks || !schem.blocks.length) continue;
                    const uniqueName = this._makeUniqueTemplateName(batch[j].name);
                    const meta = this._normalizeMetadata({ type, file: batch[j].file }, batch[j].file, schem);
                    this.assetManager.registerTemplate(uniqueName, null, schem, meta);
                    loaded++;
                    this._uiAnnounce(uniqueName);
                } catch (e) { /* fichier définitivement inexploitable */ }
            }
        }
        this._flushUi(true);
        this._logGroupSummary(prefix, type, loaded);
        return loaded;
    }

    async _loadSingleEntry(entry) {
        try {
            const fileName = entry.file || entry.path || entry.url || entry.src;
            if (!fileName || !this._isSupported(fileName)) return 0;
            const schem = await this._loadSchematic(fileName);
            if (!schem || !schem.blocks || !schem.blocks.length) return 0;
            const baseName = entry.name || this._nameFromPath(fileName);
            const uniqueName = this._makeUniqueTemplateName(baseName);
            const meta = this._normalizeMetadata(entry, fileName, schem);
            this.assetManager.registerTemplate(uniqueName, null, schem, meta);
            this._uiAnnounce(uniqueName);
            return 1;
        } catch (err) { return 0; }
    }

    async _loadManifestEntries() {
        try {
            const res = await fetch(this.manifestPath, { cache: 'default' });
            if (!res.ok) return [];
            const data = await res.json();
            const raw = Array.isArray(data) ? data : (data.schematics || data.files || []);
            return raw.map(item => {
                if (typeof item === 'string') return { file: item };
                if (item.prefix !== undefined) return { ...item, _isPattern: true };
                return item;
            }).filter(Boolean);
        } catch { return []; }
    }

    _logGroupSummary(prefix, type, loaded) {
        console.log(`📦 ${type || prefix}s: ${loaded} chargé(s) par balayage du manifest — régénérez l'index (\`node tools/build-asset-index.mjs\`) pour un démarrage instantané.`);
    }

    /* ══════════════════ Chargement à la demande ══════════════════ */

    /**
     * S'assure qu'UN asset est réellement utilisable (blocs décodés).
     * Idempotent et déduppliqué : deux appels simultanés ne déclenchent
     * qu'un seul téléchargement. Renvoie true si l'asset est prêt.
     */
    async ensureTemplateLoaded(name) {
        if (!name) return false;
        if (this.assetManager.hasTemplateData && this.assetManager.hasTemplateData(name)) return true;
        if (this.assetManager.hasTemplate(name)) return true;
        const running = this._inflight.get(name);
        if (running) return running;
        const p = this._loadTemplateNow(name)
            .catch(() => false)
            .finally(() => this._inflight.delete(name));
        this._inflight.set(name, p);
        return p;
    }

    /** Charge plusieurs assets en parallèle (restauration de session…). */
    async ensureTemplatesLoaded(names) {
        const uniq = [...new Set(names.filter(Boolean))].filter(n => !this.assetManager.hasTemplate(n));
        if (!uniq.length) return 0;
        const results = await Promise.all(uniq.map(n => this.ensureTemplateLoaded(n)));
        return results.filter(Boolean).length;
    }

    /**
     * Téléchargement discret d'avance (survol d'une carte de la bibliothèque) :
     * ne bloque jamais l'appelant, ne lève jamais d'erreur.
     */
    prefetch(name) {
        if (!name || this.assetManager.hasTemplate(name) || this._inflight.has(name)) return;
        this.ensureTemplateLoaded(name).catch(() => {});
    }

    async _loadTemplateNow(name) {
        const entry = this._entries.get(name);
        const candidates = [];
        if (entry && entry.f) candidates.push(this.schemsDir + entry.f);
        // Filet de sécurité pour les noms absents de l'index (session sauvegardée
        // avec un nom dé-doublonné « base 2 », fork au schéma d'index différent…) :
        // on retente le nom exact, le nom sans suffixe, puis les extensions.
        const baseNames = [name];
        const dedup = /^(.*\S)\s+(\d+)$/.exec(name);
        if (dedup) baseNames.push(dedup[1]);
        for (const base of baseNames) {
            if (/\.(bloxdschem|json|schem)$/i.test(base)) {
                const p = `${this.schemsDir}${base}`;
                if (!candidates.includes(p)) candidates.push(p);
            } else {
                for (const ext of this.supportedExtensions) {
                    const p = `${this.schemsDir}${base}${ext}`;
                    if (!candidates.includes(p)) candidates.push(p);
                }
            }
        }

        for (const fullPath of candidates) {
            try {
                const res = await this._fetch(fullPath, 2);
                if (!res || !res.ok) continue;                    // 404 → candidat suivant
                const buffer = await res.arrayBuffer();
                const schem = this._parseBuffer(buffer, fullPath);
                if (!schem || !schem.blocks || !schem.blocks.length) continue;
                // Enregistre SOUS LE NOM EXACT demandé pour que hasTemplate(name) matche.
                const meta = this._normalizeMetadata(
                    entry ? { type: entry.t || '', file: fullPath } : { file: fullPath },
                    fullPath, schem
                );
                this.assetManager.registerTemplate(name, null, schem, meta);
                this._uiAnnounce(name);
                return true;
            } catch (e) { /* essaie le candidat suivant */ }
        }
        return false;
    }

    /* ══════════════════ Réseau (sémaphore + cache) ══════════════════ */

    /**
     * fetch limité en parallélisme. Seule la partie réseau occupe un slot :
     * le décodage, lui, reste sur le thread principal sans emboliser les
     * autres téléchargements.
     */
    async _fetch(url, attempts = 2) {
        await this._acquireSlot();
        try {
            return await this._fetchWithRetry(url, attempts);
        } finally {
            this._releaseSlot();
        }
    }

    async _acquireSlot() {
        if (this._active < this.concurrency) { this._active++; return; }
        await new Promise(resolve => this._waiters.push(resolve));
        this._active++;
    }

    _releaseSlot() {
        this._active--;
        const next = this._waiters.shift();
        if (next) next();
    }

    /**
     * fetch robuste : distingue un vrai 404 (fichier absent) d'un échec
     * TRANSITOIRE (erreur réseau, 429, 5xx) que l'on réessaie avec un petit
     * backoff. Un 404 est renvoyé tel quel (pas de retry, c'est définitif).
     * Renvoie la Response, ou null si toutes les tentatives réseau ont échoué.
     */
    async _fetchWithRetry(url, attempts = 2) {
        let lastRes = null;
        const opts = this.useCache ? { cache: 'default' } : { cache: 'no-store' };
        for (let i = 0; i < attempts; i++) {
            try {
                const res = await fetch(url, opts);
                if (res.status === 404) return res;              // absence confirmée
                if (res.ok) return res;                           // succès
                lastRes = res;                                    // 5xx/429 → retry
            } catch (e) {
                lastRes = null;                                   // erreur réseau → retry
            }
            if (i < attempts - 1) await new Promise(r => setTimeout(r, 120 * (i + 1)));
        }
        return lastRes;
    }

    async _loadSchematic(path) {
        const fullPath = path.startsWith(this.schemsDir) ? path : this.schemsDir + path;
        const res = await this._fetchWithRetry(fullPath);
        if (!res || !res.ok) throw new Error(res ? `${res.status}` : 'network');
        const buffer = await res.arrayBuffer();
        return this._parseBuffer(buffer, path);
    }

    /* ══════════════════ Décodage & métadonnées ══════════════════ */

    _parseBuffer(buffer, path) {
        const lower = String(path).toLowerCase();
        let schem;
        if (lower.endsWith('.bloxdschem')) {
            if (!window.BloxdIO) throw new Error('BloxdIO not loaded');
            // Une seule passe, sans Map intermédiaire ni liste temporaire :
            // ~20× moins de travail que parseSchem + conversion.
            schem = window.BloxdIO.parseSchemToBlockList
                ? window.BloxdIO.parseSchemToBlockList(buffer)
                : this._convertBloxdSchemToBlockList(window.BloxdIO.parseSchem(buffer));
        } else {
            schem = window.parseSchem(new TextDecoder().decode(buffer));
        }
        // 🧹 Retire automatiquement les socles (couches pleines) sous les assets.
        return this._stripBottomPlatforms(schem);
    }

    // Convertit le format BloxdIO (Map<chunkKey, Int32Array>) en liste de blocs
    // [{x,y,z,id}, ...] attendue par createMeshFromSchem / l'export. No-op si déjà une liste.
    _convertBloxdSchemToBlockList(parsed) {
        if (!parsed || !parsed.blocks) return parsed;
        if (Array.isArray(parsed.blocks)) return parsed;             // déjà liste (JSON)
        if (typeof parsed.blocks.forEach !== 'function') return parsed;
        const CHUNK = 32;
        const out = [];
        parsed.blocks.forEach((arr, key) => {
            if (!arr) return;
            const p = key.split(',');
            const bX = (+p[0]) * CHUNK, bY = (+p[1]) * CHUNK, bZ = (+p[2]) * CHUNK;
            for (let lx = 0; lx < CHUNK; lx++)
                for (let ly = 0; ly < CHUNK; ly++)
                    for (let lz = 0; lz < CHUNK; lz++) {
                        const id = arr[lx * 1024 + ly * 32 + lz];
                        if (id !== 0) out.push({ x: bX + lx, y: bY + ly, z: bZ + lz, id });
                    }
        });
        return Object.assign({}, parsed, { blocks: out });
    }

    _nameFromPath(path) {
        return path.split('/').pop().replace(/\.(bloxdschem|json|schem)$/i, '').replace(/[_-]+/g, ' ').trim() || 'Schematic';
    }

    _makeUniqueTemplateName(baseName) {
        const has = this.assetManager.hasEntry || this.assetManager.hasTemplate;
        let name = baseName, i = 2;
        while (has.call(this.assetManager, name)) name = `${baseName} ${i++}`;
        return name;
    }

    _isSupported(path) {
        const lower = String(path).toLowerCase();
        return this.supportedExtensions.some(ext => lower.endsWith(ext));
    }

    _normalizeMetadata(entry, sourcePath, schem) {
        const asArray = v => !v ? [] : (Array.isArray(v) ? v.map(String) : String(v).split(/\s+/).filter(Boolean));
        const type = asArray(entry.type || entry.types);
        const size = (schem && schem.size) ? { x: schem.size.x | 0, y: schem.size.y | 0, z: schem.size.z | 0 } : { x: 0, y: 0, z: 0 };
        const blockCount = (schem && schem.totalBlocks) ? schem.totalBlocks | 0 : 0;
        return {
            sourcePath,
            type, biome: [],                       // biomes retirés (tri trop compliqué)
            size, blockCount,                      // TAILLE réelle du schem
            categories: [...asArray(entry.category), ...type.map(v => `type:${v}`)],
            author: entry.author || '', description: entry.description || '', tags: asArray(entry.tags)
        };
    }

    /* ══════════════════ Rafraîchissement de l'interface ══════════════════ */

    /** Accumule les noms à afficher puis rafraîchit au plus 1× par tick. */
    _uiAnnounce(name) {
        if (!this.libraryUI) return;
        if (typeof this.libraryUI.invalidateNames === 'function') this.libraryUI.invalidateNames();
        if (!this._uiPending) this._uiPending = new Set();
        this._uiPending.add(name);
        if (this._uiTimer) return;
        this._uiTimer = setTimeout(() => { this._uiTimer = 0; this._flushUi(); }, 120);
    }

    _flushUi(now = false) {
        if (this._uiTimer) { clearTimeout(this._uiTimer); this._uiTimer = 0; }
        if (!this.libraryUI) { this._uiPending = null; return; }
        const names = this._uiPending;
        this._uiPending = null;
        if (names && names.size && !now && typeof this.libraryUI.appendAssets === 'function') {
            this.libraryUI.appendAssets(Array.from(names));
        } else if (typeof this.libraryUI.populateLibrary === 'function') {
            this.libraryUI.populateLibrary();
        }
    }

    /**
     * 🧹 Retire automatiquement les "sols" / gros cubes sous les assets.
     * Une couche est un socle si elle est quasi-pleine (≥ FILL de sa propre
     * bbox XZ) ET couvre ≥ FOOT de l'empreinte globale de l'asset.
     * On retire les couches consécutives depuis le bas, puis on décale le
     * reste vers le bas (minY conservé → l'asset reste posé au sol).
     */
    _stripBottomPlatforms(schem) {
        const blocks = schem && schem.blocks;
        if (!Array.isArray(blocks) || blocks.length === 0) return schem;

        const FILL = 0.90;   // densité minimale dans la bbox de la couche
        const FOOT = 0.50;   // couverture minimale vs empreinte globale
        const UNIFORM = 0.90; // matériau dominant ≥ 90% de la couche
        const MAX_STRIP_RATIO = 0.50; // ne retire jamais > 50% de la hauteur

        // Empreinte globale (union colonnes x,z) + colonnes par couche Y
        // + compte de matériaux par couche (pour détecter le "même matériau")
        const globalCols = new Set();
        const colsByY = new Map();      // Y -> Set("x,z")
        const idCountsByY = new Map();  // Y -> Map(id -> count)
        let minY = Infinity, maxY = -Infinity;
        for (const b of blocks) {
            if (b.id === 0) continue;
            const k = b.x + ',' + b.z;
            globalCols.add(k);
            let s = colsByY.get(b.y);
            if (!s) { s = new Set(); colsByY.set(b.y, s); }
            s.add(k);
            let idc = idCountsByY.get(b.y);
            if (!idc) { idc = new Map(); idCountsByY.set(b.y, idc); }
            idc.set(b.id, (idc.get(b.id) || 0) + 1);
            if (b.y < minY) minY = b.y;
            if (b.y > maxY) maxY = b.y;
        }
        const totalFootprint = globalCols.size;
        const totalHeight = maxY - minY + 1;
        if (totalFootprint < 9 || totalHeight < 2) return schem; // trop petit

        // Détecte les couches-socles consécutives depuis le bas.
        // Conditions : quasi-pleine (FILL) + assez grande (FOOT)
        //              + matériau dominant (UNIFORM) identique sur tout le socle.
        const platformYs = new Set();
        let platformMat = null; // matériau de référence (celui de la 1ère couche-socle)
        const maxStrip = Math.max(1, Math.floor(totalHeight * MAX_STRIP_RATIO));
        for (let y = minY; y <= maxY; y++) {
            if (platformYs.size >= maxStrip) break;
            const s = colsByY.get(y);
            const idc = idCountsByY.get(y);
            if (!s || !idc) break;
            // Bbox XZ de cette couche
            let mnx = Infinity, mxx = -Infinity, mnz = Infinity, mxz = -Infinity;
            for (const k of s) {
                const p = k.split(','); const x = +p[0], z = +p[1];
                if (x < mnx) mnx = x; if (x > mxx) mxx = x;
                if (z < mnz) mnz = z; if (z > mxz) mxz = z;
            }
            const layerArea = (mxx - mnx + 1) * (mxz - mnz + 1);
            const fillRatio = s.size / layerArea;        // densité dans sa bbox
            const footRatio = s.size / totalFootprint;   // taille vs empreinte globale
            if (fillRatio < FILL || footRatio < FOOT) break;
            // Matériau dominant de la couche
            let domId = 0, domCount = 0;
            for (const [id, c] of idc) if (c > domCount) { domCount = c; domId = id; }
            const matRatio = domCount / s.size;
            if (matRatio < UNIFORM) break;               // couche multi-matériaux → stop
            if (platformMat === null) platformMat = domId; // 1ère couche : référence
            else if (domId !== platformMat) break;         // matériau différent → stop
            platformYs.add(y);
        }
        if (platformYs.size === 0) return schem; // aucun socle détecté

        // Retire les blocs des socles + décale Y vers le bas
        const shift = platformYs.size;
        const kept = [];
        for (const b of blocks) {
            if (b.id === 0) { kept.push(b); continue; }
            if (platformYs.has(b.y)) continue;          // retire le socle
            kept.push({ x: b.x, y: b.y - shift, z: b.z, id: b.id, data: b.data || 0 });
        }

        // Recalcule la taille réelle + le compte de blocs
        let mnx = Infinity, mny = Infinity, mnz = Infinity;
        let mxx = -Infinity, mxy = -Infinity, mxz = -Infinity, count = 0;
        for (const b of kept) {
            if (b.id === 0) continue;
            count++;
            if (b.x < mnx) mnx = b.x; if (b.x > mxx) mxx = b.x;
            if (b.y < mny) mny = b.y; if (b.y > mxy) mxy = b.y;
            if (b.z < mnz) mnz = b.z; if (b.z > mxz) mxz = b.z;
        }
        if (count === 0) return schem; // sécurité : ne vide jamais l'asset

        schem.blocks = kept;
        schem.size = { x: mxx - mnx + 1, y: mxy - mny + 1, z: mxz - mnz + 1 };
        schem.totalBlocks = count;
        if (schem.aabb) schem.aabb = { minX: 0, minY: 0, minZ: 0, maxX: mxx - mnx, maxY: mxy - mny, maxZ: mxz - mnz };
        return schem;
    }

    _yieldToBrowser() { return new Promise(r => setTimeout(r, 0)); }
};

/* ═══════════════════════════════════════════════════════════════ */
/*  libraryui  */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * asset_placer-libraryui.js
 * Left asset library sidebar.
 * Filtres : recherche par nom + catégories (tree/rock/house/stand) en chips
 *           + filtre de TAILLE (≤ N blocs, et ≤ W×H×D).
 */

window.LibraryUI = class LibraryUI {
    constructor(assetManager, dragDropManager, terrainManager) {
        this.assetManager = assetManager;
        this.dragDropManager = dragDropManager;
        this.terrainManager = terrainManager;
        this.selectedTagKeys = new Set();   // catégories sélectionnées (tree/rock/house/stand)
        this.tagSearchTerm = '';
        this._namesCache = null;             // tri des noms d'assets (mutualisé)
        this._namesDirty = true;
        this._shownNames = null;             // cartes actuellement affichées
        this._tagFilterSig = null;           // puces de catégories : on ne les recrée que si besoin
        // Filtres de taille (null = pas de filtre)
        this.maxBlocks = null;
        this.maxW = null; this.maxH = null; this.maxD = null;
        this._createUI();
    }

    // Icône par catégorie (fallback 📦)
    _categoryIcon(type) {
        return ({ tree: '🌳', rock: '🪨', house: '🏠', stand: '🎪' })[type] || '📦';
    }

    _createUI() {
        const overlay = document.getElementById('ui-overlay') || document.body;

        const uiContainer = document.createElement('div');
        uiContainer.id = 'editor-ui';
        uiContainer.innerHTML = `
            <div id="top-toolbar">
                <div class="toolbar-left">
                    <button id="btn-import-terrain" class="ui-btn" data-i18n-title="importTerrainTitle" title="Load a .bloxdschem as the ground"><span data-i18n="importTerrain">🌄 Terrain (.bloxdschem)</span></button>
                    <input id="input-import-terrain" type="file" accept=".bloxdschem,.json,.schem" style="display:none">
                    <span class="toolbar-sep"></span>
                    <div id="scene-menu-wrap" class="toolbar-dropdown">
                        <button id="btn-scene-menu" class="ui-btn"><span data-i18n="sessionMenu">💾 Session</span> <span class="caret">▾</span></button>
                        <div id="scene-dropdown" class="toolbar-dropdown-menu">
                            <button class="dd-item" data-action="save"><span class="dd-ico">💾</span><span data-i18n="saveSession">Save (browser)</span></button>
                            <button class="dd-item" data-action="load"><span class="dd-ico">📂</span><span data-i18n="loadSession">Load (browser)</span></button>
                            <div class="dd-sep"></div>
                            <button class="dd-item" data-action="export"><span class="dd-ico">⬇️</span><span data-i18n="exportScene">Export scene (.json)</span></button>
                            <button class="dd-item" data-action="import"><span class="dd-ico">⬆️</span><span data-i18n="importScene">Import scene (.json)</span></button>
                            <div class="dd-sep"></div>
                            <button class="dd-item danger" data-action="clear-all"><span class="dd-ico">🗑️</span><span data-i18n="clearAllAssets">Clear all assets</span></button>
                            <button class="dd-item danger" data-action="delete-save"><span class="dd-ico">🧹</span><span data-i18n="deleteSave">Delete saved session</span></button>
                        </div>
                    </div>
                    <input id="input-import-scene" type="file" accept=".json,application/json" style="display:none">
                    <span class="toolbar-sep"></span>
                    <button id="btn-export-single" class="ui-btn primary" data-i18n-title="exportTitle" title="Download a .bloxdschem for the game"><span data-i18n="export">📤 Export for Bloxd</span></button>
                </div>
                <div class="toolbar-right">
                    <a href="index.html?view=home" target="_top" class="home-corner-btn" title="⌂ Menu principal" onclick="try{localStorage.setItem('bloxdTools.lastView','home'); if(window.top && window.top.localStorage) window.top.localStorage.setItem('bloxdTools.lastView','home'); if(window.top && window.top.BloxdToolsHub && window.top.BloxdToolsHub.goHome){event.preventDefault(); window.top.BloxdToolsHub.goHome();} else if(window.top){try{window.top.postMessage({type:'bloxdTools:goHome'},'*');}catch(e){}}}catch(e){}">🏠</a>
                </div>
            </div>
        `;
        overlay.appendChild(uiContainer);

        const leftSidebar = document.createElement('div');
        leftSidebar.id = 'library-sidebar';
        leftSidebar.className = 'left-sidebar';
        leftSidebar.innerHTML = `
            <div class="sidebar-header">
                <h3 data-i18n="library">📚 Asset Library</h3>
                <button id="toggle-sidebar" class="collapse-btn">◀</button>
            </div>
            <p class="format-hint" data-i18n="formatHint">.bloxdschem = game file · .json = session save · Minecraft .schem → Converter first</p>
            <div class="asset-filter-panel">
                <div class="asset-filter-title-row">
                    <span class="asset-filter-title" data-i18n="filterTitle">Filter</span>
                    <button id="asset-filter-clear" class="asset-filter-clear" data-i18n="clear">Clear</button>
                </div>
                <input id="asset-tag-search" class="asset-tag-search" type="search" placeholder="Search name...">
                <div class="asset-filter-label" data-i18n="categories">Categories</div>
                <div id="asset-tag-filter-list" class="asset-tag-filter-list"></div>
                <div class="asset-filter-label" data-i18n="sizeFilter">Size</div>
                <div class="size-filter-row">
                    <span class="size-filter-key" data-i18n="maxBlocks">Max blocks</span>
                    <input id="size-max-blocks" type="number" min="0" placeholder="—" class="size-num">
                </div>
                <div class="size-filter-row">
                    <span class="size-filter-key">≤ W×H×D</span>
                    <span class="size-dims">
                        <input id="size-max-w" type="number" min="0" placeholder="W" class="size-num sm" title="Width">
                        <input id="size-max-h" type="number" min="0" placeholder="H" class="size-num sm" title="Height">
                        <input id="size-max-d" type="number" min="0" placeholder="D" class="size-num sm" title="Depth">
                    </span>
                </div>
                <div class="size-filter-hint" data-i18n="sizeHint">Y rotation allowed (W↔D)</div>
                <div id="asset-filter-count" class="asset-filter-count"></div>
            </div>
            <div class="asset-grid-sidebar" id="asset-grid-sidebar"></div>
        `;
        overlay.appendChild(leftSidebar);

        const reopenTab = document.createElement('button');
        reopenTab.id = 'library-reopen-tab';
        reopenTab.textContent = '▶';
        overlay.appendChild(reopenTab);

        this._bindEvents();
        this.updateTexts();
    }

    _bindEvents() {
        const sidebar = document.getElementById('library-sidebar');
        const toggleBtn = document.getElementById('toggle-sidebar');
        const reopenTab = document.getElementById('library-reopen-tab');

        toggleBtn.addEventListener('click', () => {
            const collapsed = sidebar.classList.toggle('collapsed');
            if (collapsed) this._hidePreview();
            toggleBtn.textContent = collapsed ? '▶' : '◀';
            reopenTab.classList.toggle('visible', collapsed);
            if (window.appResize) window.appResize();
        });
        reopenTab.addEventListener('click', () => {
            sidebar.classList.remove('collapsed');
            toggleBtn.textContent = '◀';
            reopenTab.classList.remove('visible');
            if (window.appResize) window.appResize();
        });

        document.getElementById('btn-import-terrain').addEventListener('click', () => {
            document.getElementById('input-import-terrain').click();
        });
        document.getElementById('input-import-terrain').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file && this.terrainManager) {
                try { await this.terrainManager.importTerrainFile(file); } catch (err) { alert(err); }
            }
        });
        document.getElementById('btn-export-single').addEventListener('click', () => {
            if (window.appExporter) window.appExporter.openExportModal();
        });

        // === Menu Session : sauvegarde / restauration des positions d'assets ===
        this._bindSessionMenu();

        // Recherche par nom
        const tagSearch = document.getElementById('asset-tag-search');
        // Le filtrage reconstruit la liste : on attend la fin de la frappe
        // (sinon une carte recréée par lettre saisie).
        tagSearch.addEventListener('input', () => {
            if (this._searchTimer) clearTimeout(this._searchTimer);
            this._searchTimer = setTimeout(() => {
                this._searchTimer = 0;
                this.tagSearchTerm = tagSearch.value.trim().toLowerCase();
                this.populateLibrary();
            }, 140);
        });

        // Filtres de taille
        const smb = document.getElementById('size-max-blocks');
        const sw = document.getElementById('size-max-w');
        const sh = document.getElementById('size-max-h');
        const sd = document.getElementById('size-max-d');
        const numVal = el => { const v = parseInt(el.value, 10); return (Number.isFinite(v) && v >= 0) ? v : null; };
        const onSize = () => {
            this.maxBlocks = numVal(smb);
            this.maxW = numVal(sw); this.maxH = numVal(sh); this.maxD = numVal(sd);
            if (this._sizeTimer) clearTimeout(this._sizeTimer);
            this._sizeTimer = setTimeout(() => { this._sizeTimer = 0; this.populateLibrary(); }, 140);
        };
        [smb, sw, sh, sd].forEach(el => el && el.addEventListener('input', onSize));

        // Clear
        document.getElementById('asset-filter-clear').addEventListener('click', () => {
            this.selectedTagKeys.clear();
            this.tagSearchTerm = '';
            this.maxBlocks = this.maxW = this.maxH = this.maxD = null;
            tagSearch.value = '';
            if (smb) smb.value = ''; if (sw) sw.value = ''; if (sh) sh.value = ''; if (sd) sd.value = '';
            this.populateLibrary();
        });
    }

    // Texte traduit avec remplacement de paramètres {n}, {total}…
    _t(key, params) {
        let s = window.I18N.t(key);
        if (params) for (const k in params) s = s.split('{' + k + '}').join(params[k]);
        return s;
    }

    _bindSessionMenu() {
        const sceneMenu = document.getElementById('btn-scene-menu');
        const sceneDropdown = document.getElementById('scene-dropdown');
        const setOpen = (open) => sceneDropdown.classList.toggle('open', open);
        if (!sceneMenu || !sceneDropdown) return;

        sceneMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            setOpen(!sceneDropdown.classList.contains('open'));
        });
        document.addEventListener('click', () => setOpen(false));
        sceneDropdown.addEventListener('click', (e) => e.stopPropagation());

        const SM = window.SceneManager;
        const mgr = () => window.appSceneManager;

        sceneDropdown.addEventListener('click', async (e) => {
            const item = e.target.closest('.dd-item');
            if (!item) return;
            const action = item.getAttribute('data-action');
            setOpen(false);
            const m = mgr();
            if (!m) return;

            if (action === 'save') {
                const n = m.serialize().instances.length;
                if (n === 0) { SM.toast(this._t('noAssetsToSave'), 'error'); return; }
                m.saveToLocal();
                SM.toast(this._t('sessionSaved', { n }), 'success');
            } else if (action === 'load') {
                if (m.countLocalSave() === 0) { SM.toast(this._t('noSavedSession'), 'error'); return; }
                if (m.assetManager.instances.length > 0 && !confirm(this._t('confirmLoad'))) return;
                SM.toast(this._t('loading'), 'info');
                const n = await m.loadFromLocal();
                SM.toast(this._t('sessionLoaded', { n }), 'success');
            } else if (action === 'export') {
                m.exportFile();
            } else if (action === 'import') {
                document.getElementById('input-import-scene').click();
            } else if (action === 'clear-all') {
                if (m.assetManager.instances.length === 0) { SM.toast(this._t('noAssetsToSave'), 'error'); return; }
                if (!confirm(this._t('confirmClearAll'))) return;
                m.clearInstances();
                m.saveToLocal();
                SM.toast(this._t('sceneCleared'), 'success');
            } else if (action === 'delete-save') {
                if (!confirm(this._t('confirmDeleteSave'))) return;
                m.clearLocal();
                SM.toast(this._t('saveDeleted'), 'success');
            }
        });

        document.getElementById('input-import-scene').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            e.target.value = '';
            if (!file) return;
            const m = mgr();
            if (!m) return;
            try {
                if (m.assetManager.instances.length > 0 && !confirm(this._t('confirmLoad'))) return;
                const n = await m.importFile(file);
                SM.toast(this._t('sceneImported', { n }), 'success');
            } catch (err) {
                console.error('[SceneManager] import error:', err);
                SM.toast(this._t('sceneImportError'), 'error');
            }
        });
    }

    updateTexts() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = window.I18N.t(key);
        });
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            el.title = window.I18N.t(el.getAttribute('data-i18n-title'));
        });
        const setSearchPH = (id, key) => { const el = document.getElementById(id); if (el) el.placeholder = window.I18N.t(key); };
        setSearchPH('asset-tag-search', 'searchName');
    }

    // ─── Catégories ───
    _getAssetCategory(name) {
        const meta = this.assetManager.getTemplateMeta(name) || {};
        return Array.isArray(meta.type) ? (meta.type[0] || '') : (meta.type || '');
    }
    _collectAllCategories() {
        const set = new Set();
        for (const name of this._allNames()) {
            const c = this._getAssetCategory(name);
            if (c) set.add(c);
        }
        const order = ['tree', 'rock', 'house', 'stand'];
        return Array.from(set).sort((a, b) => {
            const ia = order.indexOf(a), ib = order.indexOf(b);
            return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
        });
    }

    /**
     * Tous les noms d'assets connus, index (squelette) compris. Tri mutualisé :
     * `populateLibrary()` était appelé une fois par lot de 10 téléchargements
     * et refaisait le tri complet de ~900 noms à chaque fois.
     */
    _allNames() {
        if (this._namesCache && !this._namesDirty) return this._namesCache;
        this._namesCache = this.assetManager.getTemplateNames
            ? this.assetManager.getTemplateNames().slice()
            : Object.keys(this.assetManager.templateSchem).sort();
        this._namesDirty = false;
        return this._namesCache;
    }

    /** Un asset de plus dans la bibliothèque : le tri est à refaire. */
    invalidateNames() { this._namesDirty = true; }

    _renderTagFilters() {
        const list = document.getElementById('asset-tag-filter-list');
        if (!list) return;
        const cats = this._collectAllCategories();
        const sig = cats.join('|');
        // Les catégories ne changent quasiment jamais : on ne recrée pas les
        // puces (et leurs écouteurs) à chaque rafraîchissement de la liste.
        if (sig === this._tagFilterSig && list.childElementCount) return;
        this._tagFilterSig = sig;
        list.innerHTML = '';
        cats.forEach(cat => {
            const chip = document.createElement('button');
            chip.className = 'tag-filter-chip' + (this.selectedTagKeys.has(cat) ? ' active' : '');
            chip.innerHTML = `<span class="chip-icon">${this._categoryIcon(cat)}</span><span>${cat}</span>`;
            chip.addEventListener('click', () => {
                if (this.selectedTagKeys.has(cat)) this.selectedTagKeys.delete(cat);
                else this.selectedTagKeys.add(cat);
                this._renderTagFilters();
                this.populateLibrary();
            });
            list.appendChild(chip);
        });
    }

    // ─── Filtrage ───
    _assetMatchesFilters(name) {
        if (this.selectedTagKeys.size > 0 && !this.selectedTagKeys.has(this._getAssetCategory(name))) return false;
        if (this.tagSearchTerm && !name.toLowerCase().includes(this.tagSearchTerm)) return false;
        const meta = this.assetManager.getTemplateMeta(name) || {};
        const bc = meta.blockCount || 0;
        const sz = meta.size || { x: 0, y: 0, z: 0 };
        if (this.maxBlocks !== null && bc > this.maxBlocks) return false;
        // Rotation = Y uniquement (gauche/droite) → la hauteur H est FIXE.
        // L'empreinte X×Z peut être (x,z) OU (z,x) selon l'angle (0/90/180/270°).
        if (this.maxH !== null && sz.y > this.maxH) return false;
        if (this.maxW !== null || this.maxD !== null) {
            const fitA = (this.maxW === null || sz.x <= this.maxW) && (this.maxD === null || sz.z <= this.maxD);
            const fitB = (this.maxW === null || sz.z <= this.maxW) && (this.maxD === null || sz.x <= this.maxD);
            if (!fitA && !fitB) return false; // ne tient dans aucune des 2 orientations
        }
        return true;
    }

    populateLibrary() {
        this._renderTagFilters();
        const grid = this._grid();
        if (!grid) return;
        this._hidePreview();
        this._ensureGridDelegation(grid);
        const names = this._allNames();
        const filtered = names.filter(n => this._assetMatchesFilters(n));
        this._shownNames = new Set(filtered);

        // Une seule écriture du DOM (DocumentFragment) : insérer ~900 cartes
        // une par une provoquait ~900 reflows sur la barre latérale.
        const frag = document.createDocumentFragment();
        for (const name of filtered) frag.appendChild(this._buildCard(name));
        grid.replaceChildren(frag);

        const cnt = document.getElementById('asset-filter-count');
        if (cnt) cnt.textContent = filtered.length
            ? `${filtered.length} / ${names.length} ${window.I18N.t('assetsShort')}`
            : window.I18N.t('noAssets');
    }

    _grid() {
        if (!this._gridEl || !document.body.contains(this._gridEl)) {
            this._gridEl = document.getElementById('asset-grid-sidebar');
        }
        return this._gridEl;
    }

    _buildCard(name) {
        const meta = this.assetManager.getTemplateMeta(name) || {};
        const cat = this._getAssetCategory(name);
        const bc = meta.blockCount || 0;
        const sz = meta.size || { x: 0, y: 0, z: 0 };
        const card = document.createElement('div');
        card.className = 'asset-card-small cat-' + cat + (meta.pending ? ' is-pending' : '');
        card.dataset.asset = name;
        const sizeTxt = `${bc.toLocaleString('fr-FR')} · ${sz.x}×${sz.y}×${sz.z}`;
        card.innerHTML =
            `<div class="asset-icon">${this._categoryIcon(cat)}</div>` +
            `<div class="asset-name"></div>` +
            `<div class="asset-size"></div>`;
        card.querySelector('.asset-name').textContent = name;
        card.querySelector('.asset-size').textContent = sizeTxt;
        card.setAttribute('aria-label', `${name} — ${bc} ${window.I18N.t('blocksShort')} · ${sz.x}×${sz.y}×${sz.z}`);
        return card;
    }

    /**
     * Ajout incrémental (balayage de repli) : une carte par nouveau nom, au
     * lieu de reconstruire les ~900 déjà visibles à chaque lot reçu.
     */
    appendAssets(names) {
        const grid = this._grid();
        if (!grid || !names || !names.length) return;
        this._ensureGridDelegation(grid);
        this._allNames();                       // (re)charge le cache de noms si périmé
        const frag = document.createDocumentFragment();
        let added = 0;
        for (const name of names) {
            if (!this._assetMatchesFilters(name)) continue;
            if (this._shownNames && this._shownNames.has(name)) {
                // Déjà affichée (entrée squelette) : on remet à jour la taille
                // affichée, qui vient d'être corrigée par le décodage réel.
                this.refreshCard(name);
                continue;
            }
            frag.appendChild(this._buildCard(name));
            (this._shownNames || (this._shownNames = new Set())).add(name);
            added++;
        }
        if (added) {
            const empty = grid.querySelector('.asset-grid-empty');
            if (empty) empty.remove();
            grid.appendChild(frag);
        }
        const cnt = document.getElementById('asset-filter-count');
        if (cnt) {
            const total = this._allNames().length;
            const shown = grid.querySelectorAll('.asset-card-small').length;
            cnt.textContent = `${shown} / ${total} ${window.I18N.t('assetsShort')}`;
        }
    }

    /** Met une carte à jour après décodage réel de son asset (fin de « pending »). */
    refreshCard(name) {
        const grid = this._grid();
        if (!grid) return;
        const card = grid.querySelector(`.asset-card-small[data-asset=\"${(window.CSS && CSS.escape) ? CSS.escape(name) : name}\"]`);
        if (!card) return;
        const meta = this.assetManager.getTemplateMeta(name) || {};
        const bc = meta.blockCount || 0;
        const sz = meta.size || { x: 0, y: 0, z: 0 };
        card.classList.toggle('is-pending', !!meta.pending);
        const sizeEl = card.querySelector('.asset-size');
        if (sizeEl) sizeEl.textContent = `${bc.toLocaleString('fr-FR')} · ${sz.x}×${sz.y}×${sz.z}`;
        card.setAttribute('aria-label', `${name} — ${bc} ${window.I18N.t('blocksShort')} · ${sz.x}×${sz.y}×${sz.z}`);
    }

    /**
     * Évènement unique sur la grille (délégation) : 922 écouteurs posés un à un
     * sur chaque carte coûtent cher à la construction et à la destruction.
     */
    _ensureGridDelegation(grid) {
        if (grid._bloxdDelegated) return;
        grid._bloxdDelegated = true;
        const cardOf = (e) => e.target.closest ? e.target.closest('.asset-card-small') : null;
        grid.addEventListener('click', (e) => {
            const card = cardOf(e);
            if (card && card.dataset.asset) { this._hidePreview(); this._activateAsset(card.dataset.asset, card); }
        });
        // Une seule infobulle pour toute la grille ; aucun rendu ni chargement
        // supplémentaire tant que la souris ne s'arrête pas sur une carte.
        grid.addEventListener('pointerover', (e) => {
            if (e.pointerType === 'touch') return;
            const card = cardOf(e);
            if (!card || !card.dataset.asset || card.contains(e.relatedTarget)) return;
            this._hidePreview();
            this._previewCard = card;
            this._previewTimer = setTimeout(() => this._showPreview(card), 180);
        }, { passive: true });
        grid.addEventListener('pointerout', (e) => {
            const card = cardOf(e);
            if (card && card === this._previewCard && !card.contains(e.relatedTarget)) this._hidePreview();
        }, { passive: true });
        grid.addEventListener('scroll', () => this._hidePreview(), { passive: true });
        window.addEventListener('resize', () => this._hidePreview());
        window.addEventListener('blur', () => this._hidePreview());
    }

    _hidePreview() {
        clearTimeout(this._previewTimer);
        this._previewTimer = null;
        this._previewCard = null;
        if (this._previewEl) this._previewEl.hidden = true;
    }

    async _showPreview(card) {
        if (this._previewCard !== card || !card.isConnected) return;
        if (!this._previewEl) {
            const preview = document.createElement('div');
            preview.className = 'asset-hover-preview';
            preview.setAttribute('aria-hidden', 'true');
            preview.innerHTML = '<div class="asset-preview-name"></div><canvas width="440" height="340"></canvas><div class="asset-preview-status"></div>';
            document.body.appendChild(preview);
            this._previewEl = preview;
        }
        const preview = this._previewEl;
        const name = card.dataset.asset;
        const canvas = preview.querySelector('canvas');
        const status = preview.querySelector('.asset-preview-status');
        preview.querySelector('.asset-preview-name').textContent = name;
        canvas.hidden = true;
        status.hidden = false;
        status.textContent = window.I18N.t('previewLoading');
        preview.hidden = false;
        // Sortir de la zone défilante, sans jamais déborder de la fenêtre.
        const rect = card.getBoundingClientRect();
        const width = preview.offsetWidth, height = preview.offsetHeight;
        const sidebar = document.getElementById('library-sidebar');
        const right = (sidebar ? sidebar.getBoundingClientRect().right : rect.right) + 10;
        const left = right + width <= window.innerWidth ? right : rect.left - width - 10;
        preview.style.left = Math.max(4, Math.min(left, window.innerWidth - width - 4)) + 'px';
        preview.style.top = Math.max(4, Math.min(rect.top, window.innerHeight - height - 4)) + 'px';

        const loader = window.appSchematicLibraryLoader;
        try {
            if (!this.assetManager.getTemplateSchem(name) && loader) await loader.ensureTemplateLoaded(name);
            // Un téléchargement peut finir après le départ de la souris ou un filtrage.
            if (this._previewCard !== card || !card.isConnected) return;
            const schem = this.assetManager.getTemplateSchem(name);
            if (!schem || !this._drawPreview(canvas, schem)) throw new Error('Empty schematic');
            status.hidden = true;
            canvas.hidden = false;
        } catch (err) {
            if (this._previewCard !== card || !card.isConnected) return;
            status.textContent = window.I18N.t('assetLoadError');
        }
    }

    // Projection isométrique fixe (+X, +Y, +Z), indépendante de la caméra
    // de l'éditeur. Seules les faces exposées sont dessinées, du fond vers l'avant.
    _drawPreview(canvas, schem) {
        const blocks = (schem.blocks || []).filter(b => b && b.id !== 0);
        if (!blocks.length) return false;
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        for (const b of blocks) {
            minX = Math.min(minX, b.x); maxX = Math.max(maxX, b.x);
            minY = Math.min(minY, b.y); maxY = Math.max(maxY, b.y);
            minZ = Math.min(minZ, b.z); maxZ = Math.max(maxZ, b.z);
        }
        const sx = maxX - minX + 1, sy = maxY - minY + 1, sz = maxZ - minZ + 1;
        const key = (x, y, z) => `${x},${y},${z}`;
        const occupied = new Set(blocks.map(b => key(b.x, b.y, b.z)));
        blocks.sort((a, b) => (a.x + a.y + a.z) - (b.x + b.y + b.z));
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Les sommets du volume projeté donnent un cadrage constant pour tout asset.
        const project = (x, y, z) => [(x - z) * Math.sqrt(3) / 2, (x + z) / 2 - y];
        const projWidth = (sx + sz) * Math.sqrt(3) / 2;
        const projHeight = (sx + sz) / 2 + sy;
        const scale = Math.min((canvas.width - 36) / projWidth, (canvas.height - 36) / projHeight);
        const centerX = canvas.width / 2 - (sx - sz) * Math.sqrt(3) / 4 * scale;
        const centerY = canvas.height / 2 - ((sx + sz) / 4 - sy / 2) * scale;
        const point = (x, y, z) => {
            const p = project(x, y, z);
            return [centerX + p[0] * scale, centerY + p[1] * scale];
        };
        const face = (corners, color, shade) => {
            const r = Math.round(((color >> 16) & 255) * shade);
            const g = Math.round(((color >> 8) & 255) * shade);
            const b = Math.round((color & 255) * shade);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.beginPath();
            corners.forEach((v, i) => { const p = point(...v); if (i) ctx.lineTo(...p); else ctx.moveTo(...p); });
            ctx.closePath();
            ctx.fill();
        };
        for (const b of blocks) {
            const x = b.x - minX, y = b.y - minY, z = b.z - minZ;
            const color = window.BlockColors ? window.BlockColors.getBlockColor(b.id) : 0x808080;
            if (!occupied.has(key(b.x, b.y, b.z + 1)))
                face([[x,y,z+1],[x+1,y,z+1],[x+1,y+1,z+1],[x,y+1,z+1]], color, 0.72);
            if (!occupied.has(key(b.x + 1, b.y, b.z)))
                face([[x+1,y,z],[x+1,y,z+1],[x+1,y+1,z+1],[x+1,y+1,z]], color, 0.86);
            if (!occupied.has(key(b.x, b.y + 1, b.z)))
                face([[x,y+1,z],[x+1,y+1,z],[x+1,y+1,z+1],[x,y+1,z+1]], color, 1);
        }
        return true;
    }

    /**
     * Clic sur une carte : pose l'asset. Si ses blocs ne sont pas encore
     * téléchargés (mode index), on les charge à la volée — l'attente se
     * compte en dizaines de millisecondes pour un fichier, plus en minutes.
     */
    async _activateAsset(name, card) {
        const ready = this.assetManager.hasTemplateData
            ? this.assetManager.hasTemplateData(name)
            : this.assetManager.hasTemplate(name);
        if (ready) {
            const schemData = this.assetManager.getTemplateSchem(name);
            if (schemData) { this.dragDropManager.startPlacement(name, schemData); return; }
        }
        const loader = window.appSchematicLibraryLoader;
        if (!loader || typeof loader.ensureTemplateLoaded !== 'function') {
            const schemData = this.assetManager.getTemplateSchem(name) || { size: { x: 4, y: 4, z: 4 }, blocks: [] };
            this.dragDropManager.startPlacement(name, schemData);
            return;
        }
        if (card) card.classList.add('is-loading');
        const t = (window.I18N && window.I18N.t) ? window.I18N.t('loadingAsset') : '';
        const msg = (t && t !== 'loadingAsset') ? t.split('{n}').join(name) : `${name}…`;
        if (window.SceneManager && window.SceneManager.toast) window.SceneManager.toast(msg, 'info');
        let ok = false;
        try { ok = await loader.ensureTemplateLoaded(name); } catch (e) { ok = false; }
        if (card) card.classList.remove('is-loading');
        if (!ok) {
            const err = (window.I18N && window.I18N.t) ? window.I18N.t('assetLoadError') : '';
            if (window.SceneManager && window.SceneManager.toast) {
                window.SceneManager.toast(err && err !== 'assetLoadError' ? err : 'Asset introuvable', 'error');
            }
            return;
        }
        const schemData = this.assetManager.getTemplateSchem(name);
        if (schemData) this.dragDropManager.startPlacement(name, schemData);
    }
};

/* ═══════════════════════════════════════════════════════════════ */
/*  uimanager  */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * asset_placer-uimanager.js
 * Docked Properties panel
 */

window.UIManager = class UIManager {
    constructor(scene, assetManager, selectionManager, dragDropManager) {
        this.scene = scene;
        this.assetManager = assetManager;
        this.selectionManager = selectionManager;
        this.dragDropManager = dragDropManager;
        this._createSidebar();
        this._bindSelectionCallback();
    }

    _createSidebar() {
        const sidebar = document.createElement('div');
        sidebar.id = 'properties-sidebar';
        sidebar.className = 'properties-docked hidden';
        sidebar.innerHTML = `
            <div class="sidebar-body properties-docked-body">
                <div class="prop-group"><label data-i18n="name">Name:</label><span id="prop-name">-</span></div>
                <div class="prop-group"><label data-i18n="positionX">Position X:</label><input type="number" id="prop-x" step="1"></div>
                <div class="prop-group"><label data-i18n="positionY">Position Y:</label><input type="number" id="prop-y" step="1"></div>
                <div class="prop-group"><label data-i18n="positionZ">Position Z:</label><input type="number" id="prop-z" step="1"></div>
                <div class="prop-group"><label data-i18n="rotation">Rotation Y:</label>
                    <select id="prop-rot">
                        <option value="0">0°</option><option value="90">90°</option>
                        <option value="180">180°</option><option value="270">270°</option>
                    </select>
                </div>
                <div class="prop-group prop-check-group">
                    <label for="prop-locked">Locked:</label>
                    <input type="checkbox" id="prop-locked">
                </div>
                <div class="prop-group prop-check-group">
                    <label for="prop-priority-terrain">Priority over terrain:</label>
                    <input type="checkbox" id="prop-priority-terrain">
                </div>
                <div class="prop-group prop-check-group">
                    <label for="prop-priority-assets">Priority over assets:</label>
                    <input type="checkbox" id="prop-priority-assets">
                </div>
                <div class="prop-group prop-check-group">
                    <label for="prop-autoterraform" data-i18n="autoTerraform">Auto-terraform:</label>
                    <input type="checkbox" id="prop-autoterraform">
                </div>
                <div class="prop-actions">
                    <button id="btn-duplicate" class="ui-btn" data-i18n="duplicate">📋 Duplicate</button>
                    <button id="btn-delete" class="ui-btn danger" data-i18n="delete">🗑️ Delete</button>
                </div>
            </div>
        `;

        const dockSlot = document.getElementById('explorer-properties-content');
        const overlay = document.getElementById('ui-overlay') || document.body;
        (dockSlot || overlay).appendChild(sidebar);

        this.updateTexts();
        this._bindSidebarEvents();
    }

    updateTexts() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = window.I18N.t(el.getAttribute('data-i18n'));
        });
    }

    _bindSelectionCallback() {
        this.selectionManager.onSelectionChanged = (instance) => {
            const sidebar = document.getElementById('properties-sidebar');
            if (instance) {
                sidebar.classList.remove('hidden');
                this.updatePropertiesValues(instance);
            } else {
                sidebar.classList.add('hidden');
            }
        };
    }

    updatePropertiesValues(instance) {
        if (!instance) return;
        document.getElementById('prop-name').textContent = instance.name;
        document.getElementById('prop-x').value = Math.round(instance.position.x);
        document.getElementById('prop-y').value = Math.round(instance.position.y);
        document.getElementById('prop-z').value = Math.round(instance.position.z);
        document.getElementById('prop-rot').value = instance.rotationY || 0;

        const isTerrain = !!instance.isTerrainSelection;
        document.getElementById('prop-locked').checked = isTerrain || instance.locked;
        document.getElementById('prop-locked').disabled = isTerrain;
        document.getElementById('prop-priority-terrain').checked = !!instance.priorityOverTerrain;
        document.getElementById('prop-priority-assets').checked = !!instance.priorityOverAssets;
        const at = document.getElementById('prop-autoterraform');
        if (at) {
            at.checked = !!instance.autoTerraform;
            at.disabled = isTerrain;
        }
        document.getElementById('btn-duplicate').disabled = isTerrain;
        document.getElementById('btn-delete').disabled = isTerrain || instance.locked;
    }

    _bindSidebarEvents() {
        const inst = () => this.selectionManager.selectedInstance;
        const refresh = (i) => {
            if (this.selectionManager.gizmoManager && i && i.mesh) this.selectionManager.gizmoManager.attachToMesh(i.mesh);
            if (this.selectionManager.onSelectionChanged) this.selectionManager.onSelectionChanged(i);
        };
        document.getElementById('btn-delete').addEventListener('click', () => {
            const i = inst();
            if (i && !i.isTerrainSelection && !i.locked) {
                this.assetManager.removeInstance(i.id);
                this.selectionManager.deselect();
            }
        });
        document.getElementById('btn-duplicate').addEventListener('click', () => {
            const i = inst();
            if (i && !i.isTerrainSelection) {
                const np = i.position.clone().add(new BABYLON.Vector3(2,0,2));
                const ni = this.assetManager.addInstance(i.name, np, i.rotationY);
                if (ni) this.selectionManager.selectInstance(ni);
            }
        });

        // Position X/Y/Z
        const onPos = () => {
            const i = inst(); if (!i || i.isTerrainSelection || i.locked) return;
            const x = Math.round(parseFloat(document.getElementById('prop-x').value) || 0);
            const y = Math.round(parseFloat(document.getElementById('prop-y').value) || 0);
            const z = Math.round(parseFloat(document.getElementById('prop-z').value) || 0);
            i.setPosition(x, y, z);
            refresh(i);
        };
        ['prop-x', 'prop-y', 'prop-z'].forEach(id => document.getElementById(id).addEventListener('input', onPos));

        // Rotation (select 0/90/180/270)
        document.getElementById('prop-rot').addEventListener('change', () => {
            const i = inst(); if (!i || i.isTerrainSelection || i.locked) return;
            const deg = parseInt(document.getElementById('prop-rot').value, 10) || 0;
            i.setRotation(deg);
            refresh(i);
        });

        // Locked
        document.getElementById('prop-locked').addEventListener('change', () => {
            const i = inst(); if (!i || i.isTerrainSelection) return;
            i.locked = document.getElementById('prop-locked').checked;
            this.selectionManager.selectInstance(i, true);
        });
        // Priorités
        document.getElementById('prop-priority-terrain').addEventListener('change', () => {
            const i = inst(); if (i) i.priorityOverTerrain = document.getElementById('prop-priority-terrain').checked;
        });
        document.getElementById('prop-priority-assets').addEventListener('change', () => {
            const i = inst(); if (i) i.priorityOverAssets = document.getElementById('prop-priority-assets').checked;
        });
        // Auto-terraform (socle de terrain sous le schem)
        document.getElementById('prop-autoterraform').addEventListener('change', () => {
            const i = inst(); if (!i || i.isTerrainSelection) return;
            i.setAutoTerraform(document.getElementById('prop-autoterraform').checked);
        });
    }
};
/* ═══════════════════════════════════════════════════════════════ */
/*  explorerui  */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * asset_placer-explorerui.js
 * Roblox Studio-like Explorer dock.
 */

window.ExplorerUI = class ExplorerUI {
    constructor(assetManager, terrainManager, selectionManager) {
        this.assetManager = assetManager;
        this.terrainManager = terrainManager;
        this.selectionManager = selectionManager;
        this.root = null;
        this.list = null;
        this._renderQueued = false;
        this._createUI();
        this._bindEvents();
        this.render();
    }

    _createUI() {
        const overlay = document.getElementById('ui-overlay') || document.body;
        const panel = document.createElement('div');
        panel.id = 'explorer-sidebar';
        panel.className = 'explorer-sidebar';
        panel.innerHTML = `
            <div class="explorer-header">
                <h3>Explorer</h3>
                <button id="toggle-explorer" class="collapse-btn">▶</button>
            </div>
            <div id="explorer-list" class="explorer-list"></div>
            <div id="explorer-properties-dock" class="explorer-properties-dock collapsed">
                <button id="explorer-properties-toggle" class="explorer-properties-toggle">
                    <span class="explorer-properties-title">Properties</span>
                    <span id="explorer-properties-arrow" class="explorer-properties-arrow">▲</span>
                </button>
                <div id="explorer-properties-content" class="explorer-properties-content"></div>
            </div>
        `;
        overlay.appendChild(panel);

        const reopenTab = document.createElement('button');
        reopenTab.id = 'explorer-reopen-tab';
        reopenTab.textContent = '◀';
        overlay.appendChild(reopenTab);

        this.root = panel;
        this.list = panel.querySelector('#explorer-list');
    }

    _bindEvents() {
        const rerender = () => this.requestRender();
        if (this.assetManager) this.assetManager.onChanged = rerender;
        if (this.terrainManager) this.terrainManager.onChanged = rerender;

        document.getElementById('toggle-explorer').addEventListener('click', () => this.setExplorerCollapsed(true));
        document.getElementById('explorer-reopen-tab').addEventListener('click', () => this.setExplorerCollapsed(false));
        document.getElementById('explorer-properties-toggle').addEventListener('click', () => {
            const dock = document.getElementById('explorer-properties-dock');
            dock.classList.toggle('collapsed');
        });
    }

    setExplorerCollapsed(collapsed) {
        this.root.classList.toggle('collapsed', collapsed);
        document.getElementById('explorer-reopen-tab').classList.toggle('visible', collapsed);
        if (window.appResize) window.appResize();
    }

    requestRender() {
        if (this._renderQueued) return;
        this._renderQueued = true;
        requestAnimationFrame(() => {
            this._renderQueued = false;
            this.render();
        });
    }

    render() {
        if (!this.list) return;
        this.list.innerHTML = '';

        // Ground / Terrain row
        const terrainData = this.terrainManager?.terrainData;
        const row = document.createElement('div');
        row.className = 'explorer-row';
        row.innerHTML = `
            <span class="explorer-icon">${terrainData ? '🌄' : '🟩'}</span>
            <span class="explorer-text">
                <span class="explorer-title">${terrainData ? 'Terrain' : 'Ground'}</span>
                <span class="explorer-meta">Default surface</span>
            </span>
        `;
        row.addEventListener('click', () => {
            const sel = this.terrainManager?.getSelectionObject();
            if (sel) this.selectionManager.selectInstance(sel);
        });
        this.list.appendChild(row);

        const instances = this.assetManager?.instances || [];
        if (instances.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'explorer-empty';
            empty.textContent = 'No assets placed';
            this.list.appendChild(empty);
            return;
        }

        instances.forEach((inst, i) => {
            const r = document.createElement('div');
            r.className = 'explorer-row';
            r.innerHTML = `
                <span class="explorer-icon">📦</span>
                <span class="explorer-text">
                    <span class="explorer-title">${inst.name}</span>
                    <span class="explorer-meta">#${i+1} · (${Math.round(inst.position.x)}, ${Math.round(inst.position.y)}, ${Math.round(inst.position.z)})</span>
                </span>
                <button class="explorer-lock-btn">${inst.locked ? '🔒' : '🔓'}</button>
            `;
            r.addEventListener('click', (e) => {
                if (!e.target.classList.contains('explorer-lock-btn')) {
                    this.selectionManager.selectInstance(inst);
                }
            });
            r.querySelector('.explorer-lock-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                inst.locked = !inst.locked;
                this.selectionManager.selectInstance(inst, true);
            });
            this.list.appendChild(r);
        });
    }
};
/**
 * Exporter — export de la scène COMPLÈTE (terrain + tous les assets placés)
 * en VRAI binaire .bloxdschem (comme le Terrain Editor).
 *
 * Mémoire : comme le Terrain Editor et le Schem Placer, la scène n'est JAMAIS
 * stockée sous forme d'objets par-bloc. L'accumulation se fait au NIVEAU CHUNK
 * (32×32×32, Int32Array) — l'ancienne implémentation mettait chaque bloc dans
 * une Map d'objets et dépassait la limite V8 (~16,7M entrées) sur les grandes
 * maps : "RangeError: Map maximum size exceeded".
 *
 * Pipeline : bornes monde → passe unique d'accumulation en Map de chunks →
 * si > MAX_CHUNKS_PER_FILE chunks, découpage en régions (mêmes formules que
 * le Terrain Editor / Schem Placer) + .zip avec guide de chargement.
 */

window.Exporter = class Exporter {
    constructor(assetManager, terrainManager = null, selectionManager = null) {
        this.assetManager = assetManager;
        this.terrainManager = terrainManager;
        this.selectionManager = selectionManager;

        // Exact same as TerrainManager
        this.largeAreaThreshold = 512 * 512;
        this.largeBlockThreshold = 350000;

        // Garde-fou anti-OOM (jamais atteint en pratique, l'export est borné par
        // chunks) : au-delà de ce nombre de BLOCS écrits, on stoppe et on avertit.
        this.HARD_MAX_BLOCKS = 80000000;

        // Minimal BloxdIO writers (inlined for self-contained .bloxdschem export)
        this.CHUNK = 32;
        this.CHUNK_VOL = 32 * 32 * 32;

        // Au-delà de ce nombre de chunks, on découpe en plusieurs fichiers .bloxdschem
        // (même limite que le Terrain Editor : Bloxd.io refuse ~200+ chunks par //schematic load)
        this.MAX_CHUNKS_PER_FILE = 180;

        // Épaisseur de remplissage sous la surface d'un terrain heightmap à l'export —
        // DOIT rester identique à TerrainManager.getExportBlocks() (FILL_DEPTH = 4),
        // sinon l'export divergerait de la surface visible dans l'éditeur.
        this.TERRAIN_FILL_DEPTH = 4;
    }

    _writeUvarint(n) {
        n = Math.floor(n);
        const out = [];
        while (n >= 0x80) {
            out.push((n & 0x7f) | 0x80);
            n = Math.floor(n / 128);
        }
        out.push(n & 0x7f);
        return new Uint8Array(out);
    }

    _writeAvroInt(n) {
        n = Math.floor(n);
        const zz = n < 0 ? ((-n) * 2 - 1) : (n * 2);
        return this._writeUvarint(zz);
    }

    _writeAvroString(s) {
        const enc = new TextEncoder().encode(s);
        const lenBuf = this._writeAvroInt(enc.length);
        const res = new Uint8Array(lenBuf.length + enc.length);
        res.set(lenBuf, 0);
        res.set(enc, lenBuf.length);
        return res;
    }

    _encodeChunkRLE(blocks) {
        const parts = [];
        let i = 0;
        while (i < blocks.length) {
            let curr = blocks[i];
            let run = 1;
            while (i + run < blocks.length && blocks[i + run] === curr && run < 0x7fffffff) run++;
            parts.push(this._writeUvarint(run));
            parts.push(this._writeUvarint(curr));
            i += run;
        }
        let total = 0;
        for (const p of parts) total += p.length;
        const res = new Uint8Array(total);
        let o = 0;
        for (const p of parts) { res.set(p, o); o += p.length; }
        return res;
    }

    // === Modale d'export (nom de fichier / dossier / ancre / mode / mono-fichier forcé) ===
    _ensureModal() {
        if (document.getElementById('ap-export-modal')) return;
        const overlay = document.getElementById('ui-overlay') || document.body;
        const modal = document.createElement('div');
        modal.id = 'ap-export-modal';
        modal.className = 'modal hidden';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><span data-i18n="exportModalTitle">📤 Export schematic</span></h3>
                    <button class="close-btn" id="ap-export-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="modal-desc" data-i18n="exportModalDesc"></p>

                    <div class="form-group">
                        <span class="form-label" data-i18n="exportModeLabel">What to export</span>
                        <label class="export-mode-row">
                            <input type="radio" name="ap-export-mode" value="all" checked>
                            <span data-i18n="exportModeAll">Entire scene</span>
                        </label>
                        <label class="export-mode-row">
                            <input type="radio" name="ap-export-mode" value="selected" id="ap-export-mode-selected-radio">
                            <span data-i18n="exportModeSelected">Selected asset only</span>
                        </label>
                        <p class="hint-text" id="ap-export-mode-hint" data-i18n="exportModeSelectedHint"></p>
                    </div>

                    <div class="form-group">
                        <label data-i18n="exportFilenameLabel">File name (if single schem)</label>
                        <input type="text" id="ap-export-filename" class="input-text" placeholder="bloxd_export" value="bloxd_export">
                    </div>

                    <div class="form-group">
                        <label data-i18n="exportFoldernameLabel">Folder name (if split into multiple schems)</label>
                        <input type="text" id="ap-export-foldername" class="input-text" placeholder="schematics_decoupes" value="schematics_decoupes">
                        <p class="sub-desc" data-i18n="exportFolderDesc"></p>
                    </div>

                    <div class="form-group">
                        <label data-i18n="exportAnchorLabel">Paste anchor position</label>
                        <div class="form-grid-3">
                            <input type="number" class="input-text" id="ap-export-anchor-x" placeholder="X" value="0" step="1">
                            <input type="number" class="input-text" id="ap-export-anchor-y" placeholder="Y" value="0" step="1">
                            <input type="number" class="input-text" id="ap-export-anchor-z" placeholder="Z" value="0" step="1">
                        </div>
                    </div>

                    <div class="form-group toggle-box">
                        <label class="toggle-row">
                            <input type="checkbox" id="ap-export-force-single">
                            <span data-i18n="exportForceSingleLabel">📄 Force a single .bloxdschem file</span>
                        </label>
                        <p class="sub-desc" data-i18n="exportForceSingleDesc" style="margin-left:24px;"></p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="ap-export-confirm" class="ui-btn primary" data-i18n="exportConfirmBtn">⬇️ Download</button>
                </div>
            </div>
        `;
        overlay.appendChild(modal);

        const close = () => modal.classList.add('hidden');
        document.getElementById('ap-export-close').addEventListener('click', close);
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

        const confirmBtn = document.getElementById('ap-export-confirm');
        const confirmLabel = confirmBtn.innerHTML;

        confirmBtn.addEventListener('click', async () => {
            const t = (key, fallback) => (window.I18N && window.I18N.t) ? window.I18N.t(key) : fallback;

            const sanitize = (raw, fallback) => {
                const n = (raw || '').trim().replace(/\.bloxdschem$/i, '').replace(/[\\/:*?"<>|]/g, '');
                return n.length > 0 ? n : fallback;
            };

            const mode = modal.querySelector('input[name="ap-export-mode"]:checked')?.value || 'all';
            let onlySelectedInstance = null;
            if (mode === 'selected') {
                const sel = this.selectionManager && this.selectionManager.selectedInstance;
                if (!sel || sel.isTerrainSelection) {
                    alert(t('exportNoSelectionAlert', 'Select an asset first.'));
                    return;
                }
                onlySelectedInstance = sel;
            }

            const filename = sanitize(document.getElementById('ap-export-filename').value, 'bloxd_export');
            const foldername = sanitize(document.getElementById('ap-export-foldername').value, 'schematics_decoupes');
            const anchor = {
                x: parseInt(document.getElementById('ap-export-anchor-x').value, 10) || 0,
                y: parseInt(document.getElementById('ap-export-anchor-y').value, 10) || 0,
                z: parseInt(document.getElementById('ap-export-anchor-z').value, 10) || 0
            };
            const forceSingleSchem = !!document.getElementById('ap-export-force-single').checked;

            confirmBtn.disabled = true;
            const genLabel = t('exportGenerating', '⏳ Generating schematic...');
            confirmBtn.innerHTML = genLabel;
            try {
                await this.exportSingleSchem({
                    filename, foldername, anchor, forceSingleSchem, onlySelectedInstance,
                    // Progression visible pendant les gros exports (parties i/n…).
                    onProgress: (phase, i, n) => {
                        if (n > 1) confirmBtn.innerHTML = `${genLabel} <span class="hint-text">${i}/${n}</span>`;
                    }
                });
                close();
            } finally {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = confirmLabel;
            }
        });

        if (window.I18N && window.I18N.t) {
            modal.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                const txt = window.I18N.t(key);
                if (txt && txt !== key) el.innerHTML = txt;
            });
        }
    }

    openExportModal() {
        this._ensureModal();
        const modal = document.getElementById('ap-export-modal');
        const radio = document.getElementById('ap-export-mode-selected-radio');
        const hint = document.getElementById('ap-export-mode-hint');
        const sel = this.selectionManager && this.selectionManager.selectedInstance;
        const hasSelection = !!(sel && !sel.isTerrainSelection);

        radio.disabled = !hasSelection;
        if (!hasSelection) {
            radio.checked = false;
            modal.querySelector('input[name="ap-export-mode"][value="all"]').checked = true;
        }
        hint.style.display = hasSelection ? 'none' : 'block';
        modal.classList.remove('hidden');
    }

    /**
     * Export public (bouton « 📤 Export (Schematic) » / modale).
     *
     * Pipeline (même politique que le Terrain Editor et le Schem Placer) :
     *   1. bornes monde de la scène (terrain + AABB des assets) ;
     *   2. passe UNIQUE d'accumulation au niveau CHUNK 32³ (Map "cx,cy,cz" →
     *      Int32Array(32768)) — le terrain est streamé directement depuis les
     *      structures compactes du TerrainManager et les assets sont transformés
     *      bloc par bloc. Aucun objet par bloc n'est stocké : l'ancien code
     *      mettait CHAQUE bloc dans une Map d'objets et dépassait la limite V8
     *      (~16,7M entrées) → "RangeError: Map maximum size exceeded" ;
     *   3. si la scène dépasse MAX_CHUNKS_PER_FILE chunks, elle est découpée en
     *      régions X/Z (formule identique aux deux autres outils :
     *      tilesParAxe = floor(sqrt(MAX/nYChunks))), chaque région devient un
     *      .bloxdschem, regroupés dans un .zip avec un guide de chargement.
     */
    async exportSingleSchem(options = {}) {
        try {
            const result = await this._generateExport({
                filename: options.filename,
                foldername: options.foldername,
                targetInstance: options.onlySelectedInstance || null,
                anchor: options.anchor || { x: 0, y: 0, z: 0 },
                forceSingle: !!options.forceSingleSchem,
                onProgress: typeof options.onProgress === 'function' ? options.onProgress : null
            });
            if (result) await this._deliverExport(result, options);
        } catch (error) {
            console.error('=== Asset Placer Export Crash ===', error);
            alert('Export failed: ' + (error && error.message ? error.message : error) + '. Check console.');
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Pipeline d'export par chunks (streaming, mémoire bornée)
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Source du terrain : bornes monde + itérateur de streaming.
     *
     * Ne matérialise JAMAIS tous les blocs :
     *   • mode 'heightmap' (grande map streamée) : itération directe de la
     *     colonne par colonne de heightSurface (1 sommet + FILL sous la surface
     *     + colonnes d'eau) — EXACTEMENT la même surface que
     *     TerrainManager.getExportBlocks(), sans array d'objets intermédiaire ;
     *   • mode 'full' : itération de terrainBlocks (liste compacte) ;
     *   • fallback : getExportBlocks() (modes inconnus / terrains minuscules).
     */
    _terrainSource() {
        const tm = this.terrainManager;
        const FILL = this.TERRAIN_FILL_DEPTH;
        const WATER = 126; // id de l'eau (identique à TerrainManager.getExportBlocks)
        const toNum = (val, def = 0) => { const n = Number(val); return (isFinite(n) && !isNaN(n)) ? n : def; };
        const ox = Math.round(tm.terrainPosition ? tm.terrainPosition.x : 0);
        const oy = Math.round(tm.terrainPosition ? tm.terrainPosition.y : 0);
        const oz = Math.round(tm.terrainPosition ? tm.terrainPosition.z : 0);

        if (tm.mode === 'heightmap' && tm.heightSurface) {
            const o = tm.heightOrigin || { x: 0, y: 0, z: 0 };
            const tData = tm.terrainData || {};
            const sx = Math.max(1, toNum(tData.size && tData.size.x, 1));
            const sy = Math.max(1, toNum(tData.size && tData.size.y, 1));
            const sz = Math.max(1, toNum(tData.size && tData.size.z, 1));
            const bounds = {
                minX: ox, maxX: ox + sx - 1,
                minY: oy - FILL,                       // le remplissage descend sous la surface
                maxY: oy + sy - 1,
                minZ: oz, maxZ: oz + sz - 1
            };
            // L'eau peut culminer/creuser au-delà des sommets solides : on la borne aussi.
            if (tm.heightWater && tm.heightWater.size > 0) {
                let wMin = Infinity, wMax = -Infinity;
                for (const wy of tm.heightWater.values()) {
                    const w = wy - o.y + oy;
                    if (w < wMin) wMin = w;
                    if (w > wMax) wMax = w;
                }
                if (isFinite(wMin)) {
                    if (wMin < bounds.minY) bounds.minY = wMin;
                    if (wMax > bounds.maxY) bounds.maxY = wMax;
                }
            }
            return {
                bounds,
                iterate: async (putBlock, onYield) => {
                    let n = 0;
                    for (const [key, c] of tm.heightSurface) {
                        if (!c) continue;
                        const p = key.split(',');
                        const wx = (+p[0]) - o.x + ox;
                        const wz = (+p[1]) - o.z + oz;
                        const topY = c.y - o.y + oy;
                        putBlock(wx, topY, wz, c.id, 'terrain', null);
                        for (let d = 1; d <= FILL; d++) putBlock(wx, topY - d, wz, c.id, 'terrain', null);
                        // Garde l'UI vivante sur les très grandes maps.
                        if ((++n & 0x1fffff) === 0 && onYield) await onYield();
                    }
                    for (const [key, wy] of tm.heightWater) {
                        const p = key.split(',');
                        putBlock((+p[0]) - o.x + ox, wy - o.y + oy, (+p[1]) - o.z + oz, WATER, 'terrain', null);
                    }
                }
            };
        }

        if (tm.mode === 'full' && Array.isArray(tm.terrainBlocks) && tm.terrainBlocks.length > 0) {
            const tData = tm.terrainData || {};
            const s = tData.size || { x: 1, y: 1, z: 1 };
            return {
                bounds: {
                    minX: ox, maxX: ox + toNum(s.x, 1) - 1,
                    minY: oy, maxY: oy + toNum(s.y, 1) - 1,
                    minZ: oz, maxZ: oz + toNum(s.z, 1) - 1
                },
                iterate: async (putBlock) => {
                    for (const b of tm.terrainBlocks) putBlock(b.x + ox, b.y + oy, b.z + oz, b.id, 'terrain', null);
                }
            };
        }

        // Fallback (mode inattendu) : la surface compacte du manager.
        const list = (typeof tm.getExportBlocks === 'function') ? tm.getExportBlocks() : [];
        let bMinX = Infinity, bMinY = Infinity, bMinZ = Infinity;
        let bMaxX = -Infinity, bMaxY = -Infinity, bMaxZ = -Infinity;
        for (const b of list) {
            if (b.x < bMinX) bMinX = b.x; if (b.y < bMinY) bMinY = b.y; if (b.z < bMinZ) bMinZ = b.z;
            if (b.x > bMaxX) bMaxX = b.x; if (b.y > bMaxY) bMaxY = b.y; if (b.z > bMaxZ) bMaxZ = b.z;
        }
        return {
            bounds: isFinite(bMinX)
                ? { minX: bMinX, minY: bMinY, minZ: bMinZ, maxX: bMaxX, maxY: bMaxY, maxZ: bMaxZ }
                : null,
            iterate: async (putBlock) => {
                for (const b of list) putBlock(b.x, b.y, b.z, b.id, 'terrain', null);
            }
        };
    }

    /**
     * AABB monde (conservatif) d'une instance : position + empreinte du template
     * (rotation Y 90°/270° échange W↔D) + marge (arrondis de la matrice monde,
     * auto-terraform = 3 anneaux).
     */
    _instanceWorldAABB(inst) {
        let schem = null;
        try { schem = this.assetManager && this.assetManager.getTemplateSchem(inst.name); } catch (e) { /* null */ }
        let w = 1, h = 1, d = 1;
        if (schem && schem.size) {
            w = Math.max(1, Number(schem.size.x) || 1);
            h = Math.max(1, Number(schem.size.y) || 1);
            d = Math.max(1, Number(schem.size.z) || 1);
        }
        const rot = (((Number(inst.rotationY) || 0) % 360) + 360) % 360;
        if (rot % 180 === 90) { const t = w; w = d; d = t; }
        const M = 6; // marge de sécurité
        const p = inst.position || { x: 0, y: 0, z: 0 };
        return {
            minX: p.x - w / 2 - M, maxX: p.x + w / 2 + M,
            minY: p.y - h - M,    maxY: p.y + h + M,
            minZ: p.z - d / 2 - M, maxZ: p.z + d / 2 + M
        };
    }

    /**
     * Génère l'export complet (terrain + assets) et retourne :
     *   { mode: 'single'|'split', files: [{name, bytes, posX, posY, posZ, chunkCount}],
     *     totalChunks, stats, elapsedMs }
     * ou null (rien à exporter — alert déjà affichée).
     */
    async _generateExport({ targetInstance, anchor, forceSingle, onProgress }) {
        const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        const CHUNK = this.CHUNK;
        const toNum = (val, def = 0) => { const n = Number(val); return (isFinite(n) && !isNaN(n)) ? n : def; };
        const t = (key, fallback) => (window.I18N && window.I18N.t) ? window.I18N.t(key) : fallback;
        const progress = (phase, i, n) => { if (onProgress) { try { onProgress(phase, i, n); } catch (e) { /* UI only */ } } };

        // ── 1) Sources de la scène ──
        const instances = targetInstance
            ? [targetInstance]
            : ((this.assetManager && Array.isArray(this.assetManager.instances)) ? this.assetManager.instances : []);
        const includeTerrain = !targetInstance && this.terrainManager
            && typeof this.terrainManager.hasTerrain === 'function' && this.terrainManager.hasTerrain();

        // ── 2) Bornes monde (terrain + AABB des assets) ──
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        const extend = (bb) => {
            if (!bb) return;
            if (bb.minX < minX) minX = bb.minX;
            if (bb.minY < minY) minY = bb.minY;
            if (bb.minZ < minZ) minZ = bb.minZ;
            if (bb.maxX > maxX) maxX = bb.maxX;
            if (bb.maxY > maxY) maxY = bb.maxY;
            if (bb.maxZ > maxZ) maxZ = bb.maxZ;
        };
        let terrainSrc = null;
        if (includeTerrain) {
            terrainSrc = this._terrainSource();
            extend(terrainSrc.bounds);
        }
        for (const inst of instances) {
            if (!inst || typeof inst.name !== 'string') continue;
            extend(this._instanceWorldAABB(inst));
        }
        if (!isFinite(minX) || !isFinite(maxX)) {
            alert(t('noBlocksToExport', 'No blocks to export!'));
            return null;
        }

        // Origine X/Z alignée sur les frontières de chunk (comme le Schem Placer :
        // wmx = floor(minX/CHUNK)*CHUNK) → les parties se rejoignent parfaitement.
        // L'origine Y reste le Y min EXACT de la scène (comportement d'origine :
        // le bas de la scène se colle à l'ancre Y, toutes parties confondues).
        const gMinX = Math.floor(minX / CHUNK) * CHUNK;
        const gMaxX = Math.ceil((maxX + 1) / CHUNK) * CHUNK;
        const gMinZ = Math.floor(minZ / CHUNK) * CHUNK;
        const gMaxZ = Math.ceil((maxZ + 1) / CHUNK) * CHUNK;
        const yMin = Math.round(minY);
        const yMax = Math.round(maxY);
        const sizeY = Math.max(1, yMax - yMin + 1);
        const nCX = Math.max(1, Math.round((gMaxX - gMinX) / CHUNK));
        const nCZ = Math.max(1, Math.round((gMaxZ - gMinZ) / CHUNK));
        const nCY = Math.max(1, Math.ceil(sizeY / CHUNK));

        // ── 3) Accumulation au niveau CHUNK (la seule structure stockée) ──
        // "cx,cy,cz" -> Int32Array(32768). 4 Ko par chunk occupé, quel que soit
        // le nombre de blocs de la scène (l'ancienne Map d'objets par bloc coûtait
        // ~100× plus et cassait au-delà de ~16,7M blocs).
        const chunks = new Map();
        // "cx,cy,cz" -> Set(indices locaux) des cellules écrites par un ASSET :
        // nécessaire à la règle de priorité (terrain vs asset vs asset).
        const assetCells = new Map();
        const stats = { terrainBlocks: 0, assetBlocks: 0, autoTerraformBlocks: 0, truncated: false };
        let writtenBlocks = 0;

        const putBlock = (wx, wy, wz, id, source, instance) => {
            if (id === 0) return;
            if (writtenBlocks >= this.HARD_MAX_BLOCKS) { stats.truncated = true; return; }
            wx = Math.round(wx); wy = Math.round(wy); wz = Math.round(wz);
            const nx = wx - gMinX, ny = wy - yMin, nz = wz - gMinZ;
            if (nx < 0 || ny < 0 || nz < 0) return; // hors bornes calculées (ne devrait pas arriver)
            const cx = nx >> 5, cy = ny >> 5, cz = nz >> 5;
            const key = cx + ',' + cy + ',' + cz;
            let arr = chunks.get(key);
            if (!arr) { arr = new Int32Array(this.CHUNK_VOL); chunks.set(key, arr); }
            const idx = (nx & 31) * 1024 + (ny & 31) * 32 + (nz & 31);
            if (source === 'asset') {
                if (arr[idx] !== 0) {
                    const cells = assetCells.get(key);
                    const existingIsAsset = !!cells && cells.has(idx);
                    // Mêmes règles de priorité que l'ancien export :
                    if (existingIsAsset ? (instance && instance.priorityOverAssets === false)
                                        : (instance && instance.priorityOverTerrain === false)) return;
                }
                let cells = assetCells.get(key);
                if (!cells) { cells = new Set(); assetCells.set(key, cells); }
                cells.add(idx);
            }
            arr[idx] = id;
            writtenBlocks++;
            if (source === 'terrain') stats.terrainBlocks++;
            else stats.assetBlocks++;
        };

        progress('building', 0, 1);

        // ── 4) Terrain : streamé depuis les structures compactes du manager ──
        if (terrainSrc) {
            await terrainSrc.iterate(putBlock, () => this._yieldToBrowser());
        }

        // ── 5) Assets placés (mêmes transformations monde + auto-terraform) ──
        const nInst = instances.length;
        for (let i = 0; i < nInst; i++) {
            const inst = instances[i];
            if (!inst || typeof inst.name !== 'string') continue;
            if (writtenBlocks >= this.HARD_MAX_BLOCKS) { stats.truncated = true; break; }

            let schem = null;
            try { schem = this.assetManager.getTemplateSchem(inst.name); } catch (e) { continue; }
            if (!schem || !Array.isArray(schem.blocks) || schem.blocks.length === 0) continue;

            const co = (inst._centerOffset && typeof inst._centerOffset === 'object') ?
                inst._centerOffset : { x: 0, z: 0 };

            let hasMesh = false;
            let wm = null;
            let tmp = null;
            try {
                if (inst.mesh && typeof inst.mesh.computeWorldMatrix === 'function' && window.BABYLON) {
                    inst.mesh.computeWorldMatrix(true);
                    wm = inst.mesh.getWorldMatrix();
                    tmp = new BABYLON.Vector3();
                    hasMesh = true;
                }
            } catch (e) { /* fallback translation simple */ }

            const footprint = inst.autoTerraform ? new Map() : null;

            for (const block of schem.blocks) {
                if (!block || block.id === 0) continue;
                if (writtenBlocks >= this.HARD_MAX_BLOCKS) { stats.truncated = true; break; }

                let wx, wy, wz;
                if (hasMesh && wm && tmp) {
                    try {
                        tmp.set(
                            toNum(block.x) - toNum(co.x),
                            toNum(block.y),
                            toNum(block.z) - toNum(co.z)
                        );
                        BABYLON.Vector3.TransformCoordinatesToRef(tmp, wm, tmp);
                        wx = Math.round(tmp.x);
                        wy = Math.round(tmp.y);
                        wz = Math.round(tmp.z);
                    } catch (e) {
                        wx = toNum(inst.position ? inst.position.x : 0) + toNum(block.x);
                        wy = toNum(inst.position ? inst.position.y : 0) + toNum(block.y);
                        wz = toNum(inst.position ? inst.position.z : 0) + toNum(block.z);
                    }
                } else {
                    wx = toNum(inst.position ? inst.position.x : 0) + toNum(block.x);
                    wy = toNum(inst.position ? inst.position.y : 0) + toNum(block.y);
                    wz = toNum(inst.position ? inst.position.z : 0) + toNum(block.z);
                }

                putBlock(wx, wy, wz, toNum(block.id), 'asset', inst);

                if (footprint && writtenBlocks < this.HARD_MAX_BLOCKS) {
                    const k = wx + ',' + wz;
                    const prev = footprint.get(k);
                    if (prev === undefined || wy < prev) footprint.set(k, wy);
                }
            }

            // Auto-terraform (socle : empreinte + 3 anneaux) — même algorithme
            // que l'ancien export, écrit dans les chunks via putBlock (priorités
            // comprises). NB : l'ancien garde-fou « taille totale < 8% de
            // HARD_MAX » désactivait silencieusement le socle sur les grandes
            // maps ; ici c'est le compteur HARD_MAX_BLOCKS (vérifié bloc par
            // bloc dans fillCol) qui borne le remplissage, donc le socle est
            // toujours exporté, quelle que soit la taille du terrain.
            if (footprint && footprint.size > 0) {
                let baseY = Infinity;
                for (const y of footprint.values()) if (y < baseY) baseY = y;
                if (!isFinite(baseY)) baseY = 0;
                const floorY = baseY - 3;
                const filled = new Set();

                const fillCol = (fx, fz, topY) => {
                    let gid = 2;
                    try {
                        if (this.terrainManager && typeof this.terrainManager.getSurfaceBlockAtWorld === 'function') {
                            const g = this.terrainManager.getSurfaceBlockAtWorld(fx, fz);
                            if (g) gid = g;
                        }
                    } catch (e) { /* id par défaut */ }
                    for (let y = Math.round(topY); y >= Math.round(floorY); y--) {
                        if (writtenBlocks >= this.HARD_MAX_BLOCKS) { stats.truncated = true; return; }
                        putBlock(fx, y, fz, gid, 'asset', inst);
                        stats.autoTerraformBlocks++;
                    }
                };

                for (const [k, by] of footprint) {
                    if (writtenBlocks >= this.HARD_MAX_BLOCKS) break;
                    const p = k.split(',');
                    fillCol(+p[0], +p[1], by - 1);
                    filled.add(k);
                }

                let frontier = Array.from(footprint.keys()).map(k => k.split(',').map(Number));
                for (let ring = 1; ring <= 3; ring++) {
                    if (writtenBlocks >= this.HARD_MAX_BLOCKS) break;
                    const next = [];
                    for (const [x, z] of frontier) {
                        if (writtenBlocks >= this.HARD_MAX_BLOCKS) break;
                        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                            if (writtenBlocks >= this.HARD_MAX_BLOCKS) break;
                            const nk = (x + dx) + ',' + (z + dz);
                            if (filled.has(nk)) continue;
                            filled.add(nk);
                            fillCol(x + dx, z + dz, baseY - 1 - ring);
                            next.push([x + dx, z + dz]);
                        }
                    }
                    frontier = next;
                }
            }

            // Garde l'UI vivante pendant les scènes à beaucoup d'assets.
            if (nInst > 50 && (i % 50 === 49 || i === nInst - 1)) {
                progress('assets', i + 1, nInst);
                await this._yieldToBrowser();
            }
        }

        // ── 6) Bilan, puis découpage en régions (politique Terrain Editor /
        //        Schem Placer : régions de floor(sqrt(MAX/nYChunks)) tiles/axe) ──
        if (chunks.size === 0) {
            alert(t('noBlocksToExport', 'No blocks to export!'));
            return null;
        }
        if (stats.truncated) {
            alert(t('exportSplitTruncated',
                'Export truncated at safety limit. For larger scenes export sections separately.'));
        }
        assetCells.clear(); // priorités déjà résolues dans les chunks

        // Le format Bloxd ne sérialise pas une liste « sparse » de chunks : le
        // nombre de chunks annoncé doit correspondre à toute la grille définie
        // par sizeX × sizeY × sizeZ. Les fichiers produits par l'éditeur de
        // terrain et les schems fournis remplissent les trous avec un chunk AIR.
        // Compter seulement chunks.size créait un fichier lisible par notre
        // prévisualiseur, mais incomplet pour le décodeur serveur de Bloxd (HTTP
        // 400 lors du //schematic load).
        const totalChunks = nCX * nCY * nCZ;
        const elapsedMs = Math.round(
            ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0
        );
        console.log(`[Exporter] Scène accumulée : ${totalChunks} chunks, ${stats.terrainBlocks} blocs terrain, ` +
            `${stats.assetBlocks} blocs assets (dont ${stats.autoTerraformBlocks} auto-terraform) — ${elapsedMs} ms`);

        const doSplit = !forceSingle && totalChunks > this.MAX_CHUNKS_PER_FILE;

        if (!doSplit) {
            // === UN SEUL FICHIER .bloxdschem ===
            progress('writing', 1, 1);
            const bytes = this._writeBinaryFromChunks(chunks, gMaxX - gMinX, sizeY, gMaxZ - gMinZ);
            const file = { name: 'full.bloxdschem', bytes, posX: anchor.x, posY: anchor.y, posZ: anchor.z, chunkCount: totalChunks };
            console.log(`[Exporter] Export mono-fichier : ${file.bytes.length} octets, ${totalChunks} chunks` +
                (forceSingle ? ` (forcé, au-delà de la limite ${this.MAX_CHUNKS_PER_FILE} chunks)` : ''));
            return { mode: 'single', anchor, files: [file], totalChunks, stats, elapsedMs: Math.round(
                ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0
            ) };
        }

        // === Découpage en régions X/Z (mêmes formules que les 2 autres outils) ===
        const mt = Math.max(1, Math.floor(Math.sqrt(this.MAX_CHUNKS_PER_FILE / nCY)));
        // Répartit les chunks par région (une seule passe).
        const buckets = new Map(); // "rx,rz" -> Map<chunkKey, Int32Array>
        for (const [key, arr] of chunks) {
            const c = key.split(',');
            const bk = Math.floor((+c[0]) / mt) + ',' + Math.floor((+c[2]) / mt);
            let m = buckets.get(bk);
            if (!m) { m = new Map(); buckets.set(bk, m); }
            m.set(key, arr);
        }
        const regions = [];
        for (const bk of buckets.keys()) {
            const p = bk.split(',');
            regions.push([+p[0], +p[1]]);
        }
        regions.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

        const files = [];
        let partNum = 1;
        for (let ri = 0; ri < regions.length; ri++) {
            const [rx, rz] = regions[ri];
            const stx = rx * mt, etx = Math.min(nCX, stx + mt);
            const stz = rz * mt, etz = Math.min(nCZ, stz + mt);

            const regionMap = buckets.get(rx + ',' + rz);
            // Clés relocalisées dans la région (X/Z locaux, Y global → toutes les
            // parties partagent la même étendue Y, donc se superposent correctement).
            const regionChunks = new Map();
            for (const [key, arr] of regionMap) {
                const c = key.split(',').map(Number);
                regionChunks.set((c[0] - stx) + ',' + c[1] + ',' + (c[2] - stz), arr);
            }
            const bytes = this._writeBinaryFromChunks(regionChunks, (etx - stx) * CHUNK, sizeY, (etz - stz) * CHUNK);

            // Libère les chunks de la région dès que sa partie est écrite.
            for (const key of regionMap.keys()) chunks.delete(key);
            buckets.delete(rx + ',' + rz);

            const posX = anchor.x + stx * CHUNK;
            const posY = anchor.y;
            const posZ = anchor.z + stz * CHUNK;
            // _writeBinaryFromChunks complète les trous de la grille avec de
            // l'air. Le compteur affiché doit donc refléter la grille réellement
            // présente dans le fichier, et non uniquement ses chunks non vides.
            const regionChunkCount = (etx - stx) * nCY * (etz - stz);
            files.push({
                name: `${partNum}_[${posX},${posY},${posZ}].bloxdschem`,
                bytes, posX, posY, posZ, chunkCount: regionChunkCount
            });
            partNum++;
            progress('splitting', ri + 1, regions.length);
            await this._yieldToBrowser();
        }

        console.log(`[Exporter] Scène découpée en ${files.length} parties (${totalChunks} chunks) — ` +
            `total ${Math.round(files.reduce((s, f) => s + f.bytes.length, 0) / 1048576, 1)} Mo de .bloxdschem`);
        return {
            mode: 'split', anchor, files, totalChunks, stats,
            elapsedMs: Math.round(((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0)
        };
    }

    /**
     * Livrable : téléchargement direct (fichier unique) ou .zip avec guide de
     * chargement (mêmes consignes que le Terrain Editor : se déplacer entre les
     * parties, Y constante, etc.).
     */
    async _deliverExport(result, options = {}) {
        const filename = options.filename || 'bloxd_export';
        const foldername = options.foldername || 'schematics_decoupes';

        if (result.mode === 'single') {
            this._downloadBinary(result.files[0].bytes, `${filename}.bloxdschem`, 'application/octet-stream');
            return;
        }

        if (!window.JSZip) {
            const t = (window.I18N && window.I18N.t) ? window.I18N.t('exportZipMissing') : null;
            alert(t || 'JSZip is missing: add the JSZip script tag to asset_placer.html to enable multi-file export.');
            return;
        }

        const anchor = result.anchor;
        const files = result.files;

        const zip = new window.JSZip();
        const schemFolder = zip.folder(foldername);

        let guideTxt = "============================================================\n";
        guideTxt += "📦 SCÈNE DÉCOUPÉE EN PARTIES (<200 CHUNKS/FICHIER)\n";
        guideTxt += "============================================================\n\n";
        guideTxt += "Cette scène (terrain + assets) étant volumineuse, elle a été découpée en\n";
        guideTxt += "plusieurs fichiers pour respecter la limite technique de Bloxd.io\n";
        guideTxt += "(~200 chunks maximum par commande //schematic load).\n\n";
        guideTxt += "⚠️ IMPORTANT : Bloxd.io ne repositionne PAS automatiquement chaque partie à sa\n";
        guideTxt += "place dans le monde : c'est à VOUS de vous déplacer entre deux chargements,\n";
        guideTxt += "sinon toutes les parties se superposent au même endroit.\n\n";
        guideTxt += "INSTRUCTIONS D'IMPORTATION :\n";
        guideTxt += `1. Placez tous les fichiers .bloxdschem du dossier "${foldername}" dans le répertoire schématiques de Bloxd.\n`;
        guideTxt += "2. En jeu, rendez-vous à la position de l'angle de collage indiqué dans le nom du 1er fichier.\n";
        guideTxt += "3. Pour chaque fichier ci-dessous, déplacez-vous à la position [posX,posY,posZ] indiquée dans\n";
        guideTxt += "   son nom, PUIS chargez-le :\n\n";
        guideTxt += "🚨 RÈGLE D'OR — ALTITUDE Y CONSTANTE :\n";
        guideTxt += "Bloxd colle chaque schéma PAR RAPPORT À VOTRE POSITION, Y COMPRIS VOTRE HAUTEUR !\n";
        guideTxt += `Chargez TOUTES les parties depuis EXACTEMENT la même altitude Y=${anchor.y}.\n`;
        guideTxt += "Si vous marchez sur du terrain déjà généré (dunes, collines...), votre Y varie et\n";
        guideTxt += "la partie suivante sera DÉCALÉE VERTICALEMENT.\n";
        guideTxt += "👉 Astuce : passez en vol (/fly ou mode créatif), placez-vous à Y exact affiché\n";
        guideTxt += "   à l'écran, et vérifiez ce Y avant CHAQUE //schematic load.\n\n";

        files.forEach(f => {
            schemFolder.file(f.name, f.bytes);
            const short = f.name.replace(/\.bloxdschem$/i, '');
            guideTxt += `   [${short}] Position : X=${f.posX}, Y=${f.posY}, Z=${f.posZ} (${f.chunkCount} chunks)\n`;
            guideTxt += `   //schematic load ${short}\n\n`;
        });

        schemFolder.file("GUIDE_CHARGEMENT_PARTIES.txt", guideTxt);

        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${foldername}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    _yieldToBrowser() { return new Promise(r => setTimeout(r, 0)); }

    /**
     * Sérialise une grille complète de chunks en binaire .bloxdschem (Avro + RLE).
     *
     * Bloxd attend un enregistrement pour CHAQUE cellule de la grille annoncée
     * dans l'en-tête, y compris celles qui ne contiennent que de l'air. Une map
     * sparse est pratique en mémoire, mais ne constitue pas un .bloxdschem
     * valide côté jeu : les chunks suivants sont alors lus à un mauvais offset.
     */
    _writeBinaryFromChunks(chunks, sizeX, sizeY, sizeZ) {
        const parts = [];
        const nCX = Math.max(1, Math.ceil(sizeX / this.CHUNK));
        const nCY = Math.max(1, Math.ceil(sizeY / this.CHUNK));
        const nCZ = Math.max(1, Math.ceil(sizeZ / this.CHUNK));
        const totalChunks = nCX * nCY * nCZ;
        const airRle = this._encodeChunkRLE(new Int32Array(this.CHUNK_VOL));
        const MAX_AVRO_BLOCK_ENTRIES = 512; // même découpage que Terrain Editor

        parts.push(new Uint8Array([0, 0, 0, 0])); // header Avro v0
        parts.push(this._writeAvroString('BloxdExport'));
        parts.push(this._writeAvroInt(0)); // px
        parts.push(this._writeAvroInt(0)); // py
        parts.push(this._writeAvroInt(0)); // pz
        parts.push(this._writeAvroInt(sizeX));
        parts.push(this._writeAvroInt(sizeY));
        parts.push(this._writeAvroInt(sizeZ));

        // Un tableau Avro peut être découpé en plusieurs blocs. Cette forme est
        // celle produite par les autres exporteurs du projet et évite un bloc
        // Avro géant pour les grandes scènes.
        let inAvroBlock = 0;
        const startAvroBlock = (count) => parts.push(this._writeAvroInt(count));
        for (let cx = 0; cx < nCX; cx++) {
            for (let cy = 0; cy < nCY; cy++) {
                for (let cz = 0; cz < nCZ; cz++) {
                    if (inAvroBlock === 0) {
                        startAvroBlock(Math.min(MAX_AVRO_BLOCK_ENTRIES, totalChunks - (cx * nCY * nCZ + cy * nCZ + cz)));
                    }
                    const key = cx + ',' + cy + ',' + cz;
                    const arr = chunks.get(key);
                    const rle = arr ? this._encodeChunkRLE(arr) : airRle;
                    parts.push(this._writeAvroInt(cx));
                    parts.push(this._writeAvroInt(cy));
                    parts.push(this._writeAvroInt(cz));
                    parts.push(this._writeAvroInt(rle.length)); // avro bytes
                    parts.push(rle);
                    inAvroBlock = (inAvroBlock + 1) % MAX_AVRO_BLOCK_ENTRIES;
                }
            }
        }

        parts.push(this._writeAvroInt(0)); // fin du tableau Avro

        let totalLen = 0;
        for (const p of parts) totalLen += p.length;
        const result = new Uint8Array(totalLen);
        let offset = 0;
        for (const p of parts) {
            result.set(p, offset);
            offset += p.length;
        }
        return result;
    }

    _downloadBinary(bytes, filename, mime) {
        try {
            const blob = new Blob([bytes], { type: mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => { try { URL.revokeObjectURL(url); } catch (e) {} }, 80);
        } catch (e) {
            // Fallback
            console.error('Binary download failed, falling back to data URL (may be slow for large files)');
            const b64 = btoa(String.fromCharCode.apply(null, new Uint8Array(bytes)));
            const dataUrl = 'data:application/octet-stream;base64,' + b64;
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }
};
/* ═══════════════════════════════════════════════════════════════ */
/*  scenemanager  */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * asset_placer-scenemanager.js
 * Sauvegarde / restauration des positions des assets placés.
 *
 *  • Sauvegarde automatique dans le localStorage (clé bloxdTools.assetScene)
 *    → les assets placés survivent à un rafraîchissement / fermeture de page.
 *  • Menu « 💾 Session » (boutons Save / Load navigateur + Export / Import .json).
 *
 *  Format JSON :
 *    { version, app, savedAt, instances: [{ name, x, y, z, rot, locked,
 *                                            priorityTerrain, priorityAssets,
 *                                            autoTerraform }] }
 */
window.SceneManager = class SceneManager {
    constructor(assetManager, selectionManager) {
        this.assetManager = assetManager;
        this.selectionManager = selectionManager;
        this.storageKey = 'bloxdTools.assetScene';
        this._saveVersion = 1;
        this._autoTimer = null;
        this._saveTimer = null;
        this._restoring = false;
    }

    // ─── Sérialisation : instances → objet JSON simple ───
    serialize() {
        return {
            version: this._saveVersion,
            app: 'bloxd-tools-asset-placer',
            savedAt: new Date().toISOString(),
            instances: this.assetManager.instances.map(inst => ({
                name: inst.name,
                x: +(+inst.position.x).toFixed(3),
                y: +(+inst.position.y).toFixed(3),
                z: +(+inst.position.z).toFixed(3),
                rot: inst.rotationY || 0,
                locked: !!inst.locked,
                priorityTerrain: inst.priorityOverTerrain !== false,
                priorityAssets: inst.priorityOverAssets !== false,
                autoTerraform: !!inst.autoTerraform
            }))
        };
    }

    // ─── Restauration : objet JSON → instances (remplace ou fusionne) ───
    // ASYNCHRONE : si des templates ne sont pas encore chargés (schems en cours
    // de téléchargement), on attend la fin du chargeur puis on réessaie.
    // → corrige le bug "import partiel" (race condition au démarrage).
    async restore(data, replace = true) {
        if (!data || !Array.isArray(data.instances)) return 0;
        this._restoring = true;
        try {
            if (replace) this.clearInstances();
            // 1er essai : place tout ce dont le template est déjà disponible
            let res = this._tryPlace(data.instances);
            // S'il en manque et que le chargeur de schems tourne encore → on attend puis on réessaie
            if (res.pending.length > 0 && window.appSchematicLoadDone) {
                // try/catch : si le chargeur a rejeté, on NE propage PAS l'erreur —
                // sinon restore() s'interromprait ici et le filet de sécurité
                // ensureTemplateLoaded() ci-dessous ne s'exécuterait jamais.
                try {
                    await window.appSchematicLoadDone;
                } catch (e) {
                    console.warn('[SceneManager] Chargeur de schems en échec ; tentative de récupération à la demande.', e);
                }
                const res2 = this._tryPlace(res.pending);
                res.count += res2.count;
                res.pending = res2.pending;
            }
            // FILET DE SÉCURITÉ : pour les assets encore introuvables, on tente de
            // charger leur fichier exact à la demande (schems/<name>.bloxdschem).
            // Corrige le bug "N asset(s) introuvable(s)" quand un hoquet réseau ou
            // l'arrêt anticipé du balayage manifest avait empêché leur chargement.
            if (res.pending.length > 0) {
                const loader = window.appSchematicLibraryLoader;
                if (loader && typeof loader.ensureTemplateLoaded === 'function') {
                    const uniqueNames = [...new Set(res.pending.map(p => p.name))];
                    // En parallèle (limité par le sémaphore du chargeur) : ces
                    // assets-là sont tous nécessaires, les attendre l'un après
                    // l'autre coûtait N × aller-retour réseau.
                    try {
                        if (typeof loader.ensureTemplatesLoaded === 'function') await loader.ensureTemplatesLoaded(uniqueNames);
                        else for (const nm of uniqueNames) await loader.ensureTemplateLoaded(nm);
                    } catch (e) {}
                    const res3 = this._tryPlace(res.pending);
                    res.count += res3.count;
                    res.pending = res3.pending;
                }
            }
            if (res.pending.length > 0) {
                const names = res.pending.map(p => p.name);
                console.warn(`[SceneManager] ${res.pending.length} asset(s) introuvable(s) dans la bibliothèque: ${[...new Set(names)].slice(0, 12).join(', ')}${names.length > 12 ? '…' : ''}`);
            }
            return res.count;
        } finally {
            this._restoring = false;
        }
    }

    // Tente de placer une liste d'items. Retourne { count, pending }.
    // pending = items dont le template manque ou dont la création a échoué.
    _tryPlace(items) {
        let count = 0;
        const pending = [];
        for (const item of items) {
            if (!item || !item.name) continue;
            if (!this.assetManager.hasTemplate(item.name)) { pending.push(item); continue; }
            const pos = new BABYLON.Vector3(item.x || 0, item.y || 0, item.z || 0);
            const inst = this.assetManager.addInstance(item.name, pos, item.rot || 0);
            if (!inst) { pending.push(item); continue; }
            inst.locked = !!item.locked;
            inst.priorityOverTerrain = item.priorityTerrain !== false;
            inst.priorityOverAssets = item.priorityAssets !== false;
            if (item.autoTerraform) inst.setAutoTerraform(true);
            count++;
        }
        return { count, pending };
    }

    clearInstances() {
        const ids = this.assetManager.instances.map(i => i.id);
        ids.forEach(id => this.assetManager.removeInstance(id));
        if (this.selectionManager && this.selectionManager.deselect) this.selectionManager.deselect();
    }

    // ─── localStorage (session navigateur) ───
    saveToLocal() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.serialize()));
            return true;
        } catch (e) {
            console.error('[SceneManager] save error:', e);
            return false;
        }
    }

    async loadFromLocal() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return 0;
            return await this.restore(JSON.parse(raw), true);
        } catch (e) {
            console.error('[SceneManager] load error:', e);
            return 0;
        }
    }

    hasLocalSave() {
        try { return !!localStorage.getItem(this.storageKey); } catch (e) { return false; }
    }

    countLocalSave() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return 0;
            const d = JSON.parse(raw);
            return Array.isArray(d.instances) ? d.instances.length : 0;
        } catch (e) { return 0; }
    }

    clearLocal() {
        try { localStorage.removeItem(this.storageKey); } catch (e) {}
    }

    // ─── Fichier .json (partageable / sauvegarde externe) ───
    exportFile() {
        const data = this.serialize();
        if (!data.instances.length) {
            SceneManager.toast(window.I18N ? window.I18N.t('noAssetsToSave') : 'No assets to save', 'error');
            return;
        }
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        a.download = `bloxd_scene_${stamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const data = JSON.parse(reader.result);
                    resolve(await this.restore(data, true));
                }
                catch (e) { reject(e); }
            };
            reader.onerror = () => reject(new Error('read error'));
            reader.readAsText(file);
        });
    }

    // ─── Auto-save ───
    // Chaîne le onChanged existant (ExplorerUI) SANS l'écraser, puis :
    //   • sauvegarde différée sur ajout/suppression/duplication
    //   • sauvegarde périodique (capte aussi déplacements & rotations)
    //   • sauvegarde finale au beforeunload
    attachAutoSave(intervalMs = 4000) {
        const prev = this.assetManager.onChanged;
        this.assetManager.onChanged = (inst) => {
            if (typeof prev === 'function') prev.call(this.assetManager, inst);
            if (!this._restoring) this._scheduleSave();
        };
        this._autoTimer = setInterval(() => {
            if (this.assetManager.instances.length > 0) this.saveToLocal();
        }, intervalMs);
        window.addEventListener('beforeunload', () => this.saveToLocal());
    }

    _scheduleSave() {
        if (this._saveTimer) return;
        this._saveTimer = setTimeout(() => { this._saveTimer = null; this.saveToLocal(); }, 600);
    }

    // ─── Toast (notification temporaire en bas d'écran) ───
    static toast(msg, type = 'info') {
        let host = document.getElementById('scene-toast');
        if (!host) {
            host = document.createElement('div');
            host.id = 'scene-toast';
            document.body.appendChild(host);
        }
        host.className = 'scene-toast ' + type;
        host.textContent = msg;
        // reflow pour relancer l'animation
        void host.offsetWidth;
        host.classList.add('show');
        clearTimeout(SceneManager._toastTimer);
        SceneManager._toastTimer = setTimeout(() => host.classList.remove('show'), 2800);
    }
};

/* ═══════════════════════════════════════════════════════════════ */
/*  app  */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * asset_placer-app.js
 * Main Application Entry Point
 */

// Empêche Ctrl/Cmd+S de déclencher la sauvegarde de la page (très gênant en édition).
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&(e.key==='s'||e.key==='S'))e.preventDefault();});
window.addEventListener('DOMContentLoaded', () => {
    // Langue pilotée par le hub (clé partagée bloxdTools.lang)
    try { window.I18N.lang = localStorage.getItem('bloxdTools.lang') || 'en'; } catch(e) {}
    // Clavier piloté par le hub (clé partagée bloxdTools.keyboard)
    try { window.I18N.keyboard = localStorage.getItem('bloxdTools.keyboard') || 'azerty'; } catch(e) {}

    // Palette unifiée (block_colors.js — BloxdBlockColors)
    if (typeof BloxdBlockColors !== 'undefined') {
        fetch('nameToId.json', { cache: 'force-cache' })
            .then(r => r.ok ? r.json() : null)
            .then(map => { if (map) BloxdBlockColors.init(map); })
            .catch(() => {});
    }

    const canvas = document.getElementById('renderCanvas');
    const canvasContainer = document.getElementById('canvas-container');

    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true }, true);
    window.appEngine = engine;

    const resizeBabylon = () => {
        if (!engine || engine.isDisposed) return;
        requestAnimationFrame(() => engine.resize());
    };
    window.appResize = resizeBabylon;

    const createScene = function () {
        const scene = new BABYLON.Scene(engine);
        window.appScene = scene;
        scene.clearColor = new BABYLON.Color4(0.12, 0.12, 0.12, 1);

        const camera = window.setupCamera(scene, canvas);

        scene.ambientColor = new BABYLON.Color3(0.55, 0.55, 0.55);

        const hemi = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
        hemi.intensity = 1.15;
        hemi.diffuse = new BABYLON.Color3(1, 1, 1);
        hemi.groundColor = new BABYLON.Color3(0.65, 0.65, 0.65);

        const dir = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene);
        dir.intensity = 0.25;

        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 300, height: 300 }, scene);
        const gMat = new BABYLON.StandardMaterial("groundMat", scene);
        gMat.diffuseColor = new BABYLON.Color3(0.18, 0.18, 0.18);
        gMat.specularColor = new BABYLON.Color3(0, 0, 0);
        ground.material = gMat;
        ground.isPickable = true;

        const grid = BABYLON.MeshBuilder.CreateGround("grid", { width: 300, height: 300, subdivisions: 300 }, scene);
        const gridMat = new BABYLON.StandardMaterial("gridMat", scene);
        gridMat.wireframe = true;
        gridMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        grid.material = gridMat;
        grid.position.y = 0.01;
        grid.isPickable = false;

        const assetManager = new window.AssetManager(scene);
        const terrainManager = new window.TerrainManager(scene, ground, grid);
        window.appTerrainManager = terrainManager;

        const selectionManager = new window.SelectionManager(scene, assetManager);
        window.appSelectionManager = selectionManager;

        new window.InputManager(scene, selectionManager);
        const dragDropManager = new window.DragDropManager(scene, assetManager, selectionManager, canvas);
        const libraryUI = new window.LibraryUI(assetManager, dragDropManager, terrainManager);
        window.appLibraryUI = libraryUI;
        new window.ExplorerUI(assetManager, terrainManager, selectionManager);
        new window.UIManager(scene, assetManager, selectionManager, dragDropManager);

        window.appExporter = new window.Exporter(assetManager, terrainManager, selectionManager);

        // === Sauvegarde / restauration des positions d'assets ===
        // Créé APRÈS ExplorerUI pour chaîner son onChanged sans l'écraser.
        if (window.SceneManager) {
            window.appSceneManager = new window.SceneManager(assetManager, selectionManager);
            window.appSceneManager.attachAutoSave();
        }

        libraryUI.populateLibrary();

        if (window.SchematicLibraryLoader) {
            const loader = new window.SchematicLibraryLoader(scene, assetManager, libraryUI);
            window.appSchematicLibraryLoader = loader;
            // On stocke la promesse de chargement pour que le SceneManager puisse
            // l'attendre lors d'un import (fix race condition "import partiel").
            window.appSchematicLoadDone = loader.loadFromProjectFolder();

            // Restaure la session sauvegardée. Extrait dans une fonction pour être
            // appelé QUE le chargeur de schems ait réussi OU échoué : sans cela, un
            // rejet de loadFromProjectFolder() court-circuitait le .then() et la
            // session n'était JAMAIS restaurée (aucun asset replacé, silencieusement).
            const restoreSavedSession = async () => {
                if (!window.appSceneManager || !window.appSceneManager.hasLocalSave()) return;
                try {
                    const n = await window.appSceneManager.loadFromLocal();
                    if (n > 0) {
                        const msg = (window.I18N.t('autoRestored') || 'Restored {n} assets').split('{n}').join(n);
                        window.SceneManager.toast(msg, 'success');
                    }
                } catch (e) {
                    console.error('[AssetPlacer] Échec de la restauration de session :', e);
                }
            };

            window.appSchematicLoadDone
                .then((count) => {
                    if (count > 0) {
                        libraryUI.invalidateNames();
                        libraryUI.populateLibrary();
                        // En mode index, les fichiers ne sont PAS encore téléchargés :
                        // on l'explique une fois, pour que la liste ne paraisse pas « vide ».
                        if (!loader.usedFallbackScan && window.SceneManager && window.SceneManager.toast) {
                            const txt = window.I18N.t('libraryReady');
                            if (txt && txt !== 'libraryReady') window.SceneManager.toast(txt.split('{n}').join(count), 'info');
                        }
                    }
                })
                .catch((err) => {
                    // Le chargeur a échoué globalement : on log et on continue quand même.
                    // Le filet de sécurité ensureTemplateLoaded() de restore() pourra
                    // encore récupérer les assets un par un.
                    console.error('[AssetPlacer] Le chargeur de schems a échoué ; restauration de session tentée malgré tout :', err);
                })
                .then(restoreSavedSession);
        } else if (window.appSceneManager && window.appSceneManager.hasLocalSave()) {
            // Pas de loader asynchrone : restauration immédiate.
            window.appSceneManager.loadFromLocal();
        }

        return scene;
    };

    const scene = createScene();

    // --- Perf : ne pas rendre à plein régime pour rien -------------------------
    // Avant : engine.runRenderLoop(() => scene.render()) tournait à 60 FPS en
    // continu, même caméra totalement immobile et rien à l'écran qui change.
    // Ce travail GPU/CPU permanent vole du temps au thread principal pendant
    // le chargement des assets/chunks, ce qui se ressent comme des lags.
    // Ici : rendu plein régime pendant toute interaction (souris/clavier/
    // molette) ou inertie de caméra, puis ralenti (~15 FPS) après une courte
    // inactivité. La moindre interaction repasse instantanément à 60 FPS.
    let _apLastActivity = performance.now();
    const _apMarkActive = () => { _apLastActivity = performance.now(); };
    ['pointerdown', 'pointermove', 'pointerup', 'wheel'].forEach(evt => {
        canvas.addEventListener(evt, _apMarkActive, { passive: true });
    });
    window.addEventListener('keydown', _apMarkActive, { passive: true });
    if (scene.activeCamera && scene.activeCamera.onViewMatrixChangedObservable) {
        scene.activeCamera.onViewMatrixChangedObservable.add(_apMarkActive);
    }
    let _apFrameSkip = 0;
    engine.runRenderLoop(() => {
        const hidden = document.hidden || !canvas.offsetParent || canvas.clientWidth < 8 || canvas.clientHeight < 8;
        if (hidden) return;
        if (performance.now() - _apLastActivity > 400) {
            _apFrameSkip = (_apFrameSkip + 1) % 4;
            if (_apFrameSkip !== 0) return;
        } else {
            _apFrameSkip = 0;
        }
        scene.render();
    });

    window.addEventListener('resize', resizeBabylon, { passive: true });
    window.addEventListener('orientationchange', resizeBabylon, { passive: true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) resizeBabylon(); });

    if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(resizeBabylon);
        if (canvasContainer) ro.observe(canvasContainer);
        ro.observe(canvas);
    }

    resizeBabylon();
    requestAnimationFrame(resizeBabylon);
});
