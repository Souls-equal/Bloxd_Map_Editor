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