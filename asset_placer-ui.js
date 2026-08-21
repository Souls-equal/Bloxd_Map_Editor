/**
 * asset_placer-ui.js — INTERFACE & APPLICATION (fusionné)
 * Contient: schematiclibraryloader, libraryui, uimanager, explorerui, exporter, scenemanager, app
 */

/* ═══════════════════════════════════════════════════════════════ */
/*  schematiclibraryloader  */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * asset_placer-schematiclibraryloader.js
 * Charge les schematics depuis manifest.json avec détection automatique
 * des fichiers manquants (pattern tree001-999, house001-999, rock001-999).
 * Les fichiers absents sont ignorés sans erreur ; un résumé compressé
 * est loggé à la fin (ex: "Missing trees: 121-999").
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
        this.maxConsecutiveMisses = 8; // stop après 8 404 consécutifs
    }

    async loadFromProjectFolder() {
        const entries = await this._loadManifestEntries();
        if (!entries.length) return 0;

        let totalLoaded = 0;

        // Traite chaque "groupe" (pattern ou fichier unique) séparément
        for (const group of entries) {
            if (group._isPattern) {
                totalLoaded += await this._loadPatternGroup(group);
            } else {
                totalLoaded += await this._loadSingleEntry(group);
            }
        }
        return totalLoaded;
    }

    /**
     * Charge un groupe pattern (ex: tree001 → tree999).
     * Essaie séquentiellement, s'arrête après maxConsecutiveMisses 404.
     * Logge les fichiers manquants de façon compressée.
     */
    async _loadPatternGroup(group) {
        const { prefix, from, to, pad = 3, type } = group;
        const ext = '.bloxdschem';
        let loaded = 0;
        let consecutiveMisses = 0;
        let firstMissing = -1;
        let lastMissing = -1;
        const missingRanges = []; // [{start, end}]
        const loadedNums = [];
        const pending = [];       // n° sautés pour échec transitoire (à réessayer)

        for (let n = from; n <= to; n++) {
            const numStr = String(n).padStart(pad, '0');
            const fileName = `${this.schemsDir}${prefix}${numStr}${ext}`;
            const name = `${prefix}${numStr}`;

            try {
                const res = await this._fetchWithRetry(fileName);
                // Vrai 404 = fichier réellement absent → compte vers l'arrêt anticipé.
                if (res && res.status === 404) throw new Error('404');
                // Toute autre réponse non-ok après retries = échec TRANSITOIRE :
                // on saute ce fichier SANS le compter comme un trou (sinon une série
                // de hoquets réseau ferait abandonner tout le reste de la plage alors
                // que les fichiers existent bel et bien).
                if (!res || !res.ok) { pending.push(n); continue; }

                const buffer = await res.arrayBuffer();
                const schem = this._parseBuffer(buffer, fileName);
                if (!schem || !schem.blocks || !schem.blocks.length) throw new Error('empty');

                const uniqueName = this._makeUniqueTemplateName(name);
                // Chargement LAZY : on stocke le schem + métadonnées SANS créer le mesh
                // (le mesh est créé au 1er placement via AssetManager._ensureSourceMesh).
                const meta = this._normalizeMetadata({ type, file: fileName }, fileName, schem);
                this.assetManager.registerTemplate(uniqueName, null, schem, meta);
                loaded++;
                loadedNums.push(n);
                consecutiveMisses = 0;

                // Met à jour la population de la bibliothèque de temps en temps
                if (loaded % 10 === 0 && this.libraryUI) this.libraryUI.populateLibrary();
                await this._yieldToBrowser();
            } catch (err) {
                // Fichier manquant (404 confirmé) ou invalide → compte vers l'arrêt.
                consecutiveMisses++;
                if (firstMissing < 0) firstMissing = n;
                lastMissing = n;

                // Stop après trop de 404 consécutifs
                if (consecutiveMisses >= this.maxConsecutiveMisses) {
                    // Le reste est considéré manquant
                    missingRanges.push({ start: firstMissing, end: to });
                    break;
                }
            }
        }

        // 2ᵉ passe : réessaie les fichiers sautés pour échec TRANSITOIRE (jamais
        // comptés comme trous). Se produit rarement, mais garantit qu'un hoquet
        // réseau ne laisse pas un asset absent de la bibliothèque.
        if (pending.length) {
            for (const n of pending) {
                const numStr = String(n).padStart(pad, '0');
                const fileName = `${this.schemsDir}${prefix}${numStr}${ext}`;
                const name = `${prefix}${numStr}`;
                try {
                    const res = await this._fetchWithRetry(fileName, 3);
                    if (!res || !res.ok) continue;
                    const buffer = await res.arrayBuffer();
                    const schem = this._parseBuffer(buffer, fileName);
                    if (!schem || !schem.blocks || !schem.blocks.length) continue;
                    const uniqueName = this._makeUniqueTemplateName(name);
                    const meta = this._normalizeMetadata({ type, file: fileName }, fileName, schem);
                    this.assetManager.registerTemplate(uniqueName, null, schem, meta);
                    loaded++;
                    loadedNums.push(n);
                } catch (e) { /* définitivement absent */ }
                await this._yieldToBrowser();
            }
        }

        // Si on a eu des manquants dispersés (pas en fin de liste), les compresser
        if (consecutiveMisses > 0 && consecutiveMisses < this.maxConsecutiveMisses) {
            missingRanges.push({ start: firstMissing, end: lastMissing });
        }

        // Log compressé
        this._logGroupSummary(prefix, type, loaded, from, to, missingRanges, loadedNums);

        if (this.libraryUI) this.libraryUI.populateLibrary();
        return loaded;
    }

    /**
     * Affiche un résumé compressé pour un groupe.
     * Ex: "📦 trees: 120 loaded, missing: 121-999"
     *     "📦 rocks: 98 loaded, missing: 3, 15, 101-999"
     */
    _logGroupSummary(prefix, type, loaded, from, to, missingRanges, loadedNums) {
        if (loaded === 0 && missingRanges.length === 0) {
            console.log(`📦 ${type}s: 0 found (none in manifest range ${from}-${to})`);
            return;
        }

        // Calcule les ranges manquants à partir des numéros chargés
        const loadedSet = new Set(loadedNums);
        const gaps = [];
        let gapStart = -1;

        for (let n = from; n <= to; n++) {
            if (!loadedSet.has(n)) {
                if (gapStart < 0) gapStart = n;
            } else {
                if (gapStart >= 0) {
                    gaps.push({ start: gapStart, end: n - 1 });
                    gapStart = -1;
                }
            }
        }
        // Si on s'est arrêté tôt (consecutiveMisses), le reste est manquant
        if (gapStart >= 0) gaps.push({ start: gapStart, end: to });

        // Compacte les ranges en texte
        const gapStr = gaps.length === 0
            ? 'none'
            : gaps.map(g => g.start === g.end ? `${g.start}` : `${g.start}-${g.end}`).join(', ');

        console.log(`📦 ${type}s: ${loaded} loaded, missing: ${gapStr}`);
    }

    /** Charge une entrée unique (non-pattern) du manifest. */
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
            if (this.libraryUI) this.libraryUI.populateLibrary();
            return 1;
        } catch (err) {
            return 0;
        }
    }

    async _loadManifestEntries() {
        try {
            const res = await fetch(this.manifestPath, { cache: 'no-store' });
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

    _normalizeMetadata(entry, sourcePath, schem) {
        const asArray = v => !v ? [] : (Array.isArray(v) ? v.map(String) : [String(v)]);
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

    _isSupported(path) {
        const lower = String(path).toLowerCase();
        return this.supportedExtensions.some(ext => lower.endsWith(ext));
    }

    async _loadSchematic(path) {
        const fullPath = path.startsWith(this.schemsDir) ? path : this.schemsDir + path;
        const res = await this._fetchWithRetry(fullPath);
        if (!res || !res.ok) throw new Error(res ? `${res.status}` : 'network');
        const buffer = await res.arrayBuffer();
        return this._parseBuffer(buffer, path);
    }

    /**
     * fetch robuste : distingue un vrai 404 (fichier absent) d'un échec
     * TRANSITOIRE (erreur réseau, 429, 5xx) que l'on réessaie avec un petit
     * backoff. Un 404 est renvoyé tel quel (pas de retry, c'est définitif).
     * Renvoie la Response, ou null si toutes les tentatives réseau ont échoué.
     */
    async _fetchWithRetry(url, attempts = 2) {
        let lastRes = null;
        for (let i = 0; i < attempts; i++) {
            try {
                const res = await fetch(url, { cache: 'no-store' });
                if (res.status === 404) return res;              // absence confirmée
                if (res.ok) return res;                          // succès
                lastRes = res;                                   // 5xx/429 → retry
            } catch (e) {
                lastRes = null;                                  // erreur réseau → retry
            }
            // Petit backoff avant de réessayer (sauf après la dernière tentative)
            if (i < attempts - 1) await new Promise(r => setTimeout(r, 120 * (i + 1)));
        }
        return lastRes;
    }

    _parseBuffer(buffer, path) {
        const lower = String(path).toLowerCase();
        let schem;
        if (lower.endsWith('.bloxdschem')) {
            if (!window.BloxdIO) throw new Error('BloxdIO not loaded');
            schem = this._convertBloxdSchemToBlockList(window.BloxdIO.parseSchem(buffer));
        } else {
            schem = window.parseSchem(new TextDecoder().decode(buffer));
        }
        // 🧹 Retire automatiquement les socles (couches pleines) sous les assets.
        return this._stripBottomPlatforms(schem);
    }

    /**
     * Détecte et retire les "sols" / gros cubes sous les assets.
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
        console.log(`🧹 ${schem.name || 'schem'}: ${shift} couche(s)-socle retirée(s) du bas (${count} blocs restants)`);
        return schem;
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
        let name = baseName, i = 2;
        while (this.assetManager.hasTemplate(name)) name = `${baseName} ${i++}`;
        return name;
    }

    _yieldToBrowser() { return new Promise(r => setTimeout(r, 0)); }

    /**
     * Charge à la demande UN template précis par son nom (ex: "house087"),
     * en tentant de récupérer directement schems/<name>.bloxdschem.
     * Sert de filet de sécurité à la restauration de session : si un asset
     * sauvegardé n'a pas été chargé par le balayage de manifest (hoquet réseau,
     * arrêt anticipé…), on va chercher son fichier exact. Renvoie true si le
     * template est disponible après l'appel.
     *
     * Gère aussi les noms *dé-doublonnés* par _makeUniqueTemplateName() : quand
     * deux entrées du manifest produisent le même nom de base, la seconde est
     * enregistrée « <base> 2 », « <base> 3 »… Or la session sauvegarde ce nom
     * suffixé, alors qu'aucun fichier « <base> 2.bloxdschem » n'existe sur le
     * disque. On retombe donc sur le fichier de base, tout en enregistrant le
     * template sous le nom suffixé exact attendu par la sauvegarde.
     */
    async ensureTemplateLoaded(name) {
        if (!name) return false;
        if (this.assetManager.hasTemplate(name)) return true;

        // Noms de fichiers à tenter, dans l'ordre de préférence :
        //  1. le nom exact (couvre un vrai fichier nommé « maison 2.bloxdschem ») ;
        //  2. le nom sans suffixe de dé-doublonnage « <base> N » ajouté au chargement.
        const baseNames = [name];
        const dedup = /^(.*\S)\s+(\d+)$/.exec(name);
        if (dedup) baseNames.push(dedup[1]);

        // Candidats de chemins : nom tel quel + variantes d'extension supportées.
        const candidates = [];
        for (const base of baseNames) {
            if (/\.(bloxdschem|json|schem)$/i.test(base)) {
                candidates.push(`${this.schemsDir}${base}`);
            } else {
                for (const ext of this.supportedExtensions) candidates.push(`${this.schemsDir}${base}${ext}`);
            }
        }

        for (const fullPath of candidates) {
            try {
                const res = await this._fetchWithRetry(fullPath, 3);
                if (!res || !res.ok) continue;               // 404 → essaie l'extension suivante
                const buffer = await res.arrayBuffer();
                const schem = this._parseBuffer(buffer, fullPath);
                if (!schem || !schem.blocks || !schem.blocks.length) continue;
                // Enregistre SOUS LE NOM EXACT demandé pour que hasTemplate(name) matche.
                const meta = this._normalizeMetadata({ file: fullPath }, fullPath, schem);
                this.assetManager.registerTemplate(name, null, schem, meta);
                if (this.libraryUI) this.libraryUI.populateLibrary();
                return true;
            } catch (e) { /* essaie le candidat suivant */ }
        }
        return false;
    }
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
                    <button id="btn-import-terrain" class="ui-btn"><span data-i18n="importTerrain">🌄 Import (Terrain)</span></button>
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
                    <button id="btn-export-single" class="ui-btn primary"><span data-i18n="export">📤 Export (Schematic)</span></button>
                </div>
                <div class="toolbar-right">
                    <a href="index.html" class="ui-btn" title="⌂ Menu principal">🏠</a>
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
        tagSearch.addEventListener('input', () => {
            this.tagSearchTerm = tagSearch.value.trim().toLowerCase();
            this.populateLibrary();
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
            this.populateLibrary();
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
        for (const name in this.assetManager.templateSchem) {
            const c = this._getAssetCategory(name);
            if (c) set.add(c);
        }
        const order = ['tree', 'rock', 'house', 'stand'];
        return Array.from(set).sort((a, b) => {
            const ia = order.indexOf(a), ib = order.indexOf(b);
            return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
        });
    }
    _renderTagFilters() {
        const list = document.getElementById('asset-tag-filter-list');
        if (!list) return;
        const cats = this._collectAllCategories();
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
        const grid = document.getElementById('asset-grid-sidebar');
        if (!grid) return;
        const names = Object.keys(this.assetManager.templateSchem).sort();
        const filtered = names.filter(n => this._assetMatchesFilters(n));
        grid.innerHTML = '';

        if (!filtered.length) {
            const empty = document.createElement('div');
            empty.className = 'asset-grid-empty';
            empty.textContent = window.I18N.t('noAssets');
            grid.appendChild(empty);
        } else {
            for (const name of filtered) {
                const meta = this.assetManager.getTemplateMeta(name) || {};
                const cat = this._getAssetCategory(name);
                const bc = meta.blockCount || 0;
                const sz = meta.size || { x: 0, y: 0, z: 0 };
                const card = document.createElement('div');
                card.className = 'asset-card-small cat-' + cat;
                card.innerHTML =
                    `<div class="asset-icon">${this._categoryIcon(cat)}</div>` +
                    `<div class="asset-name">${name}</div>` +
                    `<div class="asset-size">${bc} · ${sz.x}×${sz.y}×${sz.z}</div>`;
                card.title = `${name} — ${bc} ${window.I18N.t('blocksShort')} · ${sz.x}×${sz.y}×${sz.z}`;
                card.addEventListener('click', () => {
                    const schemData = this.assetManager.getTemplateSchem(name) || { size: { x: 4, y: 4, z: 4 }, blocks: [] };
                    this.dragDropManager.startPlacement(name, schemData);
                });
                grid.appendChild(card);
            }
        }

        const cnt = document.getElementById('asset-filter-count');
        if (cnt) cnt.textContent = `${filtered.length} / ${names.length} ${window.I18N.t('assetsShort')}`;
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

        const totalChunks = chunks.size;
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
            files.push({
                name: `${partNum}_[${posX},${posY},${posZ}].bloxdschem`,
                bytes, posX, posY, posZ, chunkCount: regionChunks.size
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

    /** Sérialise une map de chunks (clés "cx,cy,cz" relatives) en binaire .bloxdschem (Avro + RLE). */
    _writeBinaryFromChunks(chunks, sizeX, sizeY, sizeZ) {
        const parts = [];
        parts.push(new Uint8Array([0, 0, 0, 0])); // header
        parts.push(this._writeAvroString('BloxdExport'));
        parts.push(this._writeAvroInt(0)); // px
        parts.push(this._writeAvroInt(0)); // py
        parts.push(this._writeAvroInt(0)); // pz
        parts.push(this._writeAvroInt(sizeX));
        parts.push(this._writeAvroInt(sizeY));
        parts.push(this._writeAvroInt(sizeZ));

        // Collect all chunk keys in a deterministic order
        const chunkKeys = Array.from(chunks.keys()).sort();
        const totalChunks = chunkKeys.length;

        // Write chunk count
        parts.push(this._writeAvroInt(totalChunks));

        for (const key of chunkKeys) {
            const [cx, cy, cz] = key.split(',').map(Number);
            parts.push(this._writeAvroInt(cx));
            parts.push(this._writeAvroInt(cy));
            parts.push(this._writeAvroInt(cz));

            const arr = chunks.get(key);
            const rle = this._encodeChunkRLE(arr);
            // Write length + bytes (as avro bytes)
            parts.push(this._writeAvroInt(rle.length));
            parts.push(rle);
        }

        // End marker
        parts.push(this._writeAvroInt(0));

        // Concatenate
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
                    for (const nm of uniqueNames) {
                        try { await loader.ensureTemplateLoaded(nm); } catch (e) {}
                    }
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

    // Couleurs fidèles des blocs : on initialise la palette BlockColors avec la
    // table nom→id (→ chaque bloc retrouve sa vraie couleur, eau comprise).
    if (window.BlockColors && typeof window.BlockColors.initFromNameMap === 'function') {
        fetch('nameToId.json', { cache: 'force-cache' })
            .then(r => r.ok ? r.json() : null)
            .then(map => { if (map) window.BlockColors.initFromNameMap(map); })
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
                .then((count) => { if (count > 0) libraryUI.populateLibrary(); })
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

    engine.runRenderLoop(() => scene.render());

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
