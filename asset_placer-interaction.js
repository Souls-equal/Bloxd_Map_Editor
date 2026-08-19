/**
 * asset_placer-interaction.js — INTERACTION (fusionné)
 * Contient: selectionmanager, inputmanager, dragdropmanager
 */

/* ═══════════════════════════════════════════════════════════════ */
/*  selectionmanager  */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * asset_placer-selectionmanager.js
 * Sélection + déplacements snapés façon éditeur 3D
 */

window.SelectionManager = class SelectionManager {
    constructor(scene, assetManager) {
        this.scene = scene;
        this.assetManager = assetManager;
        this.selectedInstance = null;
        this.onSelectionChanged = null;

        this.gridSize = 1;
        this.dragStartThresholdPx = 5;

        this.gizmoManager = new BABYLON.GizmoManager(scene);
        this.gizmoManager.usePointerToAttachGizmos = false;
        this.gizmoManager.clearGizmoOnEmptyPointerEvent = false;
        this.gizmoManager.positionGizmoEnabled = false;
        this.gizmoManager.rotationGizmoEnabled = false;
        this.gizmoManager.scaleGizmoEnabled = false;
        this.gizmoManager.boundingBoxGizmoEnabled = false;

        this.selectionBox = null;
        this.selectionBoxMaterial = new BABYLON.StandardMaterial('selectionBoundsMat', scene);
        this.selectionBoxMaterial.diffuseColor = new BABYLON.Color3(1.0, 0.9, 0.15);
        this.selectionBoxMaterial.emissiveColor = new BABYLON.Color3(1.0, 0.9, 0.15);
        this.selectionBoxMaterial.alpha = 0.95;
        this.selectionBoxMaterial.wireframe = true;
        this.selectionBoxMaterial.disableLighting = true;

        this._pendingDrag = null;
        this._isDragging = false;
        this._isUsingGizmo = false;
        this._dragFootOffset = 0;
        this._dragAnchorOffset = new BABYLON.Vector3(0, 0, 0);
        this._dragTargetPos = null;
        this._dragCurrentPos = null;
        this._observedPositionGizmo = null;
        this._nativeGizmoSnappingEnabled = false;

        this._setupPointerEvents();
        this._setupRenderLoop();
        this._setupGlobalReleaseGuards();
    }

    _roundToGrid(value) {
        return Math.round(value / this.gridSize) * this.gridSize;
    }

    _isOverUI(evt) {
        return !!(evt.target && (
            evt.target.closest('#editor-ui') ||
            evt.target.closest('#properties-sidebar') ||
            evt.target.closest('#explorer-sidebar') ||
            evt.target.closest('#explorer-reopen-tab') ||
            evt.target.closest('.modal') ||
            evt.target.closest('#library-sidebar') ||
            evt.target.closest('#library-reopen-tab')
        ));
    }

    _isPointerOnGizmo() {
        const utilityLayer = BABYLON.UtilityLayerRenderer.DefaultUtilityLayer;
        if (!utilityLayer || !utilityLayer.utilityLayerScene) return false;
        try {
            const pickGizmo = utilityLayer.utilityLayerScene.pick(this.scene.pointerX, this.scene.pointerY);
            return !!(pickGizmo && pickGizmo.hit && pickGizmo.pickedMesh);
        } catch (err) { return false; }
    }

    _isRealAssetMesh(mesh) {
        if (!mesh) return false;
        if (!mesh.isEnabled() || !mesh.isVisible || mesh.isPickable === false) return false;
        return !!this.assetManager.getInstanceByMesh(mesh);
    }

    _pickAssetUnderPointerDetails() {
        const pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => this._isRealAssetMesh(mesh));
        if (!pick || !pick.hit || !pick.pickedMesh) return null;
        const instance = this.assetManager.getInstanceByMesh(pick.pickedMesh);
        if (!instance) return null;
        return { instance, pick };
    }

    _isGroundUnderPointer() {
        const pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => {
            return !!(mesh && (mesh.name === 'ground' || (mesh.metadata && mesh.metadata.isTerrain)));
        });
        return !!(pick && pick.hit);
    }

    _highlightMesh(mesh) {
        if (!mesh) return;
        try {
            if (typeof mesh.enableEdgesRendering === 'function') {
                mesh.enableEdgesRendering();
                mesh.edgesWidth = 4.0;
                mesh.edgesColor = new BABYLON.Color4(0.3, 1.0, 0.3, 1.0);
            }
        } catch (err) {}
    }

    _clearHighlight(mesh) {
        if (!mesh) return;
        try {
            if (typeof mesh.disableEdgesRendering === 'function') {
                mesh.disableEdgesRendering();
            }
        } catch (err) {}
    }

    _updateSelectionBounds() {
        const inst = this.selectedInstance;
        if (!inst || !inst.mesh || inst.isTerrainSelection) {
            this._hideSelectionBounds();
            return;
        }
        const mesh = inst.mesh;
        mesh.computeWorldMatrix(true);
        const bb = mesh.getBoundingInfo().boundingBox;
        const min = bb.minimumWorld;
        const max = bb.maximumWorld;
        const size = max.subtract(min);
        const center = min.add(size.scale(0.5));

        if (!this.selectionBox) {
            this.selectionBox = BABYLON.MeshBuilder.CreateBox('selection_bounds_box', { size: 1 }, this.scene);
            this.selectionBox.isPickable = false;
            this.selectionBox.metadata = { isSelectionBounds: true };
            this.selectionBox.material = this.selectionBoxMaterial;
        }
        this.selectionBox.setEnabled(true);
        this.selectionBox.position.copyFrom(center);
        this.selectionBox.scaling.set(
            Math.max(0.02, size.x + 0.04),
            Math.max(0.02, size.y + 0.04),
            Math.max(0.02, size.z + 0.04)
        );
        this.selectionBox.computeWorldMatrix(true);
    }

    _hideSelectionBounds() {
        if (this.selectionBox) this.selectionBox.setEnabled(false);
    }

    _syncSelectedInstanceFromMesh(notify = false) {
        if (!this.selectedInstance || !this.selectedInstance.mesh) return;
        const mesh = this.selectedInstance.mesh;
        mesh.computeWorldMatrix(true);
        this.selectedInstance._position.copyFrom(mesh.position);
        this.selectedInstance._rotationY = (Math.round(BABYLON.Tools.ToDegrees(mesh.rotation.y)) % 360 + 360) % 360;
        this._updateSelectionBounds();
        if (notify && this.onSelectionChanged) this.onSelectionChanged(this.selectedInstance);
    }

    _snapSelectedToGrid(notify = true) {
        if (!this.selectedInstance || !this.selectedInstance.mesh) return;
        const mesh = this.selectedInstance.mesh;
        const x = this._roundToGrid(mesh.position.x);
        const y = this._roundToGrid(mesh.position.y);
        const z = this._roundToGrid(mesh.position.z);
        if (this.selectedInstance.locked) return;
        this.selectedInstance.setPosition(x, y, z);
        if (this.gizmoManager) this.gizmoManager.attachToMesh(this.selectedInstance.mesh);
        this._updateSelectionBounds();
        if (notify && this.onSelectionChanged) this.onSelectionChanged(this.selectedInstance);
    }

    _snapSelectedDuringGizmo(notify = false) {
        if (!this.selectedInstance || !this.selectedInstance.mesh || this.selectedInstance.locked) return;
        const mesh = this.selectedInstance.mesh;
        if (this._nativeGizmoSnappingEnabled) {
            this._syncSelectedInstanceFromMesh(notify);
            return;
        }
        const snapped = new BABYLON.Vector3(
            this._roundToGrid(mesh.position.x),
            this._roundToGrid(mesh.position.y),
            this._roundToGrid(mesh.position.z)
        );
        mesh.position.copyFrom(snapped);
        this.selectedInstance._position.copyFrom(snapped);
        if (notify && this.onSelectionChanged) this.onSelectionChanged(this.selectedInstance);
    }

    _configureGizmoSnapping(positionGizmo) {
        if (!positionGizmo) return;
        const gizmoParts = [positionGizmo.xGizmo, positionGizmo.yGizmo, positionGizmo.zGizmo,
            positionGizmo.xPlaneGizmo, positionGizmo.yPlaneGizmo, positionGizmo.zPlaneGizmo].filter(Boolean);
        this._nativeGizmoSnappingEnabled = false;
        gizmoParts.forEach((part) => {
            try { part.snapDistance = this.gridSize; this._nativeGizmoSnappingEnabled = true; } catch (err) {}
        });
    }

    _bindPositionGizmoObservers() {
        const positionGizmo = this.gizmoManager && this.gizmoManager.gizmos ? this.gizmoManager.gizmos.positionGizmo : null;
        if (!positionGizmo) return;
        this._configureGizmoSnapping(positionGizmo);
        if (this._observedPositionGizmo === positionGizmo) return;
        this._observedPositionGizmo = positionGizmo;

        const gizmoParts = [positionGizmo.xGizmo, positionGizmo.yGizmo, positionGizmo.zGizmo,
            positionGizmo.xPlaneGizmo, positionGizmo.yPlaneGizmo, positionGizmo.zPlaneGizmo].filter(Boolean);

        gizmoParts.forEach((part) => {
            const dragBehavior = part.dragBehavior;
            if (!dragBehavior) return;
            dragBehavior.onDragStartObservable.add(() => {
                if (this.selectedInstance && this.selectedInstance.locked) return;
                this._pendingDrag = null; this._isUsingGizmo = true; this._isDragging = false;
                window.isDraggingGizmo = true;
                this._syncSelectedInstanceFromMesh(false);
                this._snapSelectedDuringGizmo(false);
            });
            dragBehavior.onDragObservable.add(() => {
                if (this.selectedInstance) this._snapSelectedDuringGizmo(false);
            });
            dragBehavior.onDragEndObservable.add(() => {
                if (this.selectedInstance) {
                    this._isUsingGizmo = false; window.isDraggingGizmo = false;
                    this._snapSelectedToGrid(true);
                }
            });
        });
    }

    _pickSurfaceUnderPointer() {
        const excludeMesh = this.selectedInstance ? this.selectedInstance.mesh : null;
        const surfacePredicate = (m) => {
            if (!m || m === excludeMesh) return false;
            if (!m.isEnabled() || !m.isVisible) return false;
            if (m.metadata && (m.metadata.isAssetTemplate || m.metadata.isGhost)) return false;
            if (m.name === 'grid') return false;
            return true;
        };
        const camPick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, surfacePredicate);
        if (!camPick.hit || !camPick.pickedPoint) return null;
        return camPick.pickedPoint;
    }

    _preparePendingDrag(evt, instance, pick) {
        if (instance && instance.locked) return;
        const pickedPoint = pick && pick.pickedPoint ? pick.pickedPoint.clone() : instance.mesh.position.clone();
        this._dragAnchorOffset.set(instance.position.x - pickedPoint.x, 0, instance.position.z - pickedPoint.z);
        instance.mesh.computeWorldMatrix(true);
        const bb = instance.mesh.getBoundingInfo().boundingBox;
        this._dragFootOffset = instance.mesh.position.y - bb.minimumWorld.y;
        this._pendingDrag = { instance, startClientX: evt.clientX, startClientY: evt.clientY };
    }

    _maybeStartPendingDrag(evt) {
        if (!this._pendingDrag || this._isDragging || this._isUsingGizmo) return false;
        const distance = Math.hypot(evt.clientX - this._pendingDrag.startClientX, evt.clientY - this._pendingDrag.startClientY);
        if (distance < this.dragStartThresholdPx) return false;
        this._startSceneDrag(this._pendingDrag.instance);
        this._pendingDrag = null;
        return true;
    }

    _startSceneDrag(instance) {
        if (!instance || !instance.mesh || instance.locked) return;
        this._isDragging = true; this._isUsingGizmo = false;
        window.isDraggingGizmo = true;
        this._dragTargetPos = instance.position.clone();
        this._dragCurrentPos = instance.position.clone();
    }

    _finishSceneDrag() {
        this._pendingDrag = null;
        if (!this._isDragging) return;
        this._isDragging = false; window.isDraggingGizmo = false;
        if (this.selectedInstance && this._dragCurrentPos && !this.selectedInstance.locked) {
            const p = this._dragCurrentPos;
            this.selectedInstance.setPosition(this._roundToGrid(p.x), this._roundToGrid(p.y), this._roundToGrid(p.z));
            if (this.gizmoManager) this.gizmoManager.attachToMesh(this.selectedInstance.mesh);
            if (this.onSelectionChanged) this.onSelectionChanged(this.selectedInstance);
        }
    }

    _setupPointerEvents() {
        this.scene.onPointerDown = (evt) => {
            if (evt.button !== 0) return;
            if (this._isOverUI(evt)) return;
            if (this._isPointerOnGizmo()) { this._pendingDrag = null; this._isUsingGizmo = true; window.isDraggingGizmo = true; return; }
            const details = this._pickAssetUnderPointerDetails();
            if (details && details.instance) {
                this.selectInstance(details.instance);
                this._preparePendingDrag(evt, details.instance, details.pick);
                return;
            }
            if (this._isGroundUnderPointer()) { this._pendingDrag = null; this.deselect(); }
        };

        this.scene.onPointerMove = (evt) => {
            if (this._isUsingGizmo) { this._snapSelectedDuringGizmo(false); return; }
            this._maybeStartPendingDrag(evt);
            if (!this._isDragging || !this.selectedInstance) return;
            window.isDraggingGizmo = true;
            const surfacePoint = this._pickSurfaceUnderPointer();
            if (!surfacePoint) return;
            const targetX = this._roundToGrid(surfacePoint.x + this._dragAnchorOffset.x);
            const targetZ = this._roundToGrid(surfacePoint.z + this._dragAnchorOffset.z);
            const targetY = this._roundToGrid(surfacePoint.y + this._dragFootOffset);
            this._dragTargetPos.set(targetX, targetY, targetZ);
            this._dragCurrentPos.copyFrom(this._dragTargetPos);
        };

        this.scene.onPointerUp = () => {
            if (this._isUsingGizmo) this._snapSelectedDuringGizmo(false);
            this._finishSceneDrag();
        };
    }

    _setupGlobalReleaseGuards() {
        const finish = () => {
            if (this._isUsingGizmo) { this._isUsingGizmo = false; window.isDraggingGizmo = false; this._snapSelectedToGrid(true); }
            this._finishSceneDrag();
            this._pendingDrag = null;
        };
        window.addEventListener('pointerup', finish);
        window.addEventListener('mouseup', finish);
        window.addEventListener('blur', finish);
    }

    _setupRenderLoop() {
        this.scene.onBeforeRenderObservable.add(() => {
            if (this._isUsingGizmo) { this._snapSelectedDuringGizmo(false); return; }
            if (this._isDragging && this.selectedInstance && this._dragTargetPos && this._dragCurrentPos) {
                this.selectedInstance.mesh.position.copyFrom(this._dragCurrentPos);
                this.selectedInstance._position.copyFrom(this._dragCurrentPos);
                if (this.gizmoManager) this.gizmoManager.attachToMesh(this.selectedInstance.mesh);
                this._updateSelectionBounds();
                return;
            }
            if (this.selectedInstance) this._syncSelectedInstanceFromMesh(false);
        });
    }

    selectInstance(instance, forceRefresh = false) {
        if (!instance || !instance.mesh) return;
        const canTransform = !instance.locked;
        if (this.selectedInstance === instance && !forceRefresh) {
            this.gizmoManager.attachToMesh(instance.mesh);
            this.gizmoManager.positionGizmoEnabled = canTransform;
            this.gizmoManager.rotationGizmoEnabled = false;
            this._bindPositionGizmoObservers();
            this._updateSelectionBounds();
            return;
        }
        if (this.selectedInstance && this.selectedInstance !== instance) this._clearHighlight(this.selectedInstance.mesh);
        this.selectedInstance = instance;
        this._pendingDrag = null; this._isDragging = false; this._isUsingGizmo = false; window.isDraggingGizmo = false;
        this.gizmoManager.attachToMesh(instance.mesh);
        this.gizmoManager.positionGizmoEnabled = canTransform;
        this.gizmoManager.rotationGizmoEnabled = false;
        this._bindPositionGizmoObservers();
        this._highlightMesh(instance.mesh);
        this._updateSelectionBounds();
        if (this.onSelectionChanged) this.onSelectionChanged(instance);
    }

    deselect() {
        if (!this.selectedInstance) return;
        this._clearHighlight(this.selectedInstance.mesh);
        this._hideSelectionBounds();
        this._pendingDrag = null; this._isDragging = false; this._isUsingGizmo = false; window.isDraggingGizmo = false;
        this.selectedInstance = null;
        this.gizmoManager.attachToMesh(null);
        this.gizmoManager.positionGizmoEnabled = false;
        this.gizmoManager.rotationGizmoEnabled = false;
        if (this.onSelectionChanged) this.onSelectionChanged(null);
    }
};
/* ═══════════════════════════════════════════════════════════════ */
/*  inputmanager  */
/* ═══════════════════════════════════════════════════════════════ */

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
/* ═══════════════════════════════════════════════════════════════ */
/*  dragdropmanager  */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * asset_placer-dragdropmanager.js
 * Drag & Drop et ghost preview (Babylon)
 */

window.DragDropManager = class DragDropManager {
    constructor(scene, assetManager, selectionManager, canvas) {
        this.scene = scene;
        this.assetManager = assetManager;
        this.selectionManager = selectionManager;
        this.canvas = canvas;

        this.ghostMesh = null;
        this.activeSchemData = null;
        this.activeAssetName = null;
        this.isPlacing = false;

        this._setupDragAndDrop();
        this._setupPlacement();
    }

    _setupDragAndDrop() {
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length === 0) return;
            const file = e.dataTransfer.files[0];
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const parsed = window.parseSchem(evt.target.result);
                    const name = file.name.replace(/\.[^/.]+$/, "");
                    this.startPlacement(name, parsed);
                } catch (err) {
                    console.error("Erreur lecture schematic :", err);
                }
            };
            reader.readAsText(file);
        });
    }

    _createGhostMesh(sourceMesh) {
        let ghost = null;
        if (sourceMesh && typeof sourceMesh.clone === 'function') {
            ghost = sourceMesh.clone("ghost_mesh");
        }
        if (!ghost) return null;
        // Même recentrage que les instances → l'aperçu correspond au placement centré.
        if (window.recenterMeshHorizontal) window.recenterMeshHorizontal(ghost);

        ghost.setEnabled(true);
        ghost.isVisible = true;
        ghost.visibility = 1;
        ghost.isPickable = false;
        ghost.metadata = Object.assign({}, ghost.metadata, {
            isAssetTemplate: false,
            isGhost: true
        });

        if (sourceMesh.material && typeof sourceMesh.material.clone === 'function') {
            const ghostMat = sourceMesh.material.clone("ghost_material");
            ghostMat.alpha = 0.45;
            ghostMat.needDepthPrePass = true;
            ghostMat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
            ghost.material = ghostMat;
        } else if (ghost.material) {
            ghost.material.alpha = 0.45;
            ghost.material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
        }
        return ghost;
    }

    startPlacement(name, schemData) {
        this.cancelPlacement();
        this.activeSchemData = schemData;
        this.activeAssetName = name;
        this.isPlacing = true;

        let sourceMesh = this.assetManager.templates[name];
        if (!sourceMesh) {
            sourceMesh = window.createMeshFromSchem(this.scene, schemData);
            if (sourceMesh) this.assetManager.registerTemplate(name, sourceMesh, schemData);
        }
        if (!sourceMesh) return;

        this.ghostMesh = this._createGhostMesh(sourceMesh);
        if (!this.ghostMesh) {
            this.cancelPlacement();
            return;
        }
    }

    _setupPlacement() {
        const origMove = this.scene.onPointerMove;
        this.scene.onPointerMove = (evt, pickResult) => {
            if (origMove) origMove(evt, pickResult);
            if (!this.isPlacing || !this.ghostMesh) return;
            const groundPick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (m) => m.name === "ground" || m.name === "grid" || (m.metadata && m.metadata.isTerrain));
            if (groundPick.hit && groundPick.pickedPoint) {
                this.ghostMesh.position.set(
                    Math.round(groundPick.pickedPoint.x),
                    Math.round(groundPick.pickedPoint.y),
                    Math.round(groundPick.pickedPoint.z)
                );
            }
        };

        const origDown = this.scene.onPointerDown;
        this.scene.onPointerDown = (evt, pickResult) => {
            if (this.isPlacing) {
                if (evt.button !== 0) return;
                const groundPick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (m) => m.name === "ground" || m.name === "grid" || (m.metadata && m.metadata.isTerrain));
                if (groundPick.hit && groundPick.pickedPoint) {
                    const x = Math.round(this.ghostMesh.position.x);
                    const y = Math.round(this.ghostMesh.position.y);
                    const z = Math.round(this.ghostMesh.position.z);
                    const rotY = Math.round(this.ghostMesh.rotation.y * (180 / Math.PI));
                    const inst = this.assetManager.addInstance(this.activeAssetName, new BABYLON.Vector3(x, y, z), rotY);
                    if (inst) this.selectionManager.selectInstance(inst);
                    this.cancelPlacement();
                }
                return;
            }
            if (origDown) origDown(evt, pickResult);
        };

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && this.isPlacing) this.cancelPlacement();
        });
    }

    cancelPlacement() {
        if (this.ghostMesh) {
            if (this.ghostMesh.material && this.ghostMesh.material.name === "ghost_material") {
                this.ghostMesh.material.dispose();
            }
            this.ghostMesh.dispose();
            this.ghostMesh = null;
        }
        this.isPlacing = false;
        this.activeSchemData = null;
        this.activeAssetName = null;
    }
};