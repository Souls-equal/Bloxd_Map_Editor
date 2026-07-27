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