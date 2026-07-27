/**
 * asset_placer-inputmanager.js
 * Keyboard controls for selected objects.
 */

window.InputManager = class InputManager {
    constructor(scene, selectionManager) {
        this.scene = scene;
        this.selectionManager = selectionManager;
        this.gridSize = 1;

        window.addEventListener('keydown', (evt) => {
            const inst = this.selectionManager.selectedInstance;
            if (!inst) return;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

            const code = typeof evt.code === 'string' ? evt.code : '';
            const key = typeof evt.key === 'string' ? evt.key.toLowerCase() : '';

            if (key === 'l') {
                evt.preventDefault();
                if (inst.isTerrainSelection) return;
                inst.locked = !inst.locked;
                if (this.selectionManager.assetManager && typeof this.selectionManager.assetManager._notifyChanged === 'function') {
                    this.selectionManager.assetManager._notifyChanged();
                }
                this.selectionManager.selectInstance(inst, true);
                if (this.selectionManager.onSelectionChanged) this.selectionManager.onSelectionChanged(inst);
                return;
            }

            if (code === 'Delete' || code === 'Backspace' || key === 'delete') {
                evt.preventDefault();
                if (inst.isTerrainSelection || inst.locked) return;
                const id = inst.id;
                this.selectionManager.deselect();
                if (this.selectionManager.assetManager) {
                    this.selectionManager.assetManager.removeInstance(id);
                }
                return;
            }

            if (inst.locked) return;

            const isQwerty = window.I18N && window.I18N.keyboard === 'qwerty';
            const rotateLeftKey = isQwerty ? 'q' : 'a';

            if (key === rotateLeftKey) {
                evt.preventDefault();
                inst.setRotation(inst.rotationY - 90);
                if (this.selectionManager.onSelectionChanged) this.selectionManager.onSelectionChanged(inst);
            } else if (key === 'e') {
                evt.preventDefault();
                inst.setRotation(inst.rotationY + 90);
                if (this.selectionManager.onSelectionChanged) this.selectionManager.onSelectionChanged(inst);
            }

            let dx = 0, dz = 0;
            if (code === 'ArrowUp') dz = this.gridSize;
            else if (code === 'ArrowDown') dz = -this.gridSize;
            else if (code === 'ArrowLeft') dx = -this.gridSize;
            else if (code === 'ArrowRight') dx = this.gridSize;

            if (dx !== 0 || dz !== 0) {
                const pos = inst.position;
                const newX = Math.round((pos.x + dx) / this.gridSize) * this.gridSize;
                const newZ = Math.round((pos.z + dz) / this.gridSize) * this.gridSize;
                inst.setPosition(newX, pos.y, newZ);
                if (this.selectionManager.gizmoManager) {
                    this.selectionManager.gizmoManager.attachToMesh(inst.mesh);
                }
                if (this.selectionManager.onSelectionChanged) this.selectionManager.onSelectionChanged(inst);
            }
        });
    }
};