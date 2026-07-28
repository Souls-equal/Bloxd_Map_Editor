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
    }
};
