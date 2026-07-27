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

        for (let n = from; n <= to; n++) {
            const numStr = String(n).padStart(pad, '0');
            const fileName = `${this.schemsDir}${prefix}${numStr}${ext}`;
            const name = `${prefix}${numStr}`;

            try {
                const res = await fetch(fileName, { cache: 'no-store' });
                if (!res.ok) throw new Error(`${res.status}`);

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
                // Fichier manquant (404 ou invalide)
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
        const res = await fetch(fullPath, { cache: 'no-store' });
        if (!res.ok) throw new Error(`${res.status}`);
        const buffer = await res.arrayBuffer();
        return this._parseBuffer(buffer, path);
    }

    _parseBuffer(buffer, path) {
        const lower = String(path).toLowerCase();
        if (lower.endsWith('.bloxdschem')) {
            if (!window.BloxdIO) throw new Error('BloxdIO not loaded');
            return this._convertBloxdSchemToBlockList(window.BloxdIO.parseSchem(buffer));
        }
        return window.parseSchem(new TextDecoder().decode(buffer));
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
};
