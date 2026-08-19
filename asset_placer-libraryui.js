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
            if (window.appExporter) window.appExporter.exportSingleSchem();
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

        sceneDropdown.addEventListener('click', (e) => {
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
                const n = m.loadFromLocal();
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
