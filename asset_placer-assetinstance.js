/**
 * asset_placer-assetinstance.js
 * Instance d'asset (Babylon)
 */

window.AssetInstance = class AssetInstance {
    constructor(id, name, sourceMesh, scene) {
        this.id = id;
        this.name = name;
        this.sourceMesh = sourceMesh;
        this.scene = scene;

        this._position = new BABYLON.Vector3(0, 0, 0);
        this._rotationY = 0;

        this.locked = false;
        this.priorityOverTerrain = true;
        this.priorityOverAssets = true;

        this.mesh = this._createRenderableMesh(sourceMesh, `asset_clone_${id}`);
        this.mesh.metadata = Object.assign({}, this.mesh.metadata, {
            isAssetTemplate: false,
            isGhost: false,
            assetInstanceId: id,
            assetName: name
        });

        this.updateTransform();
    }

    _createRenderableMesh(sourceMesh, cloneName) {
        let mesh = null;
        if (sourceMesh && typeof sourceMesh.clone === 'function') {
            mesh = sourceMesh.clone(cloneName);
        }
        if (!mesh) throw new Error(`Impossible de créer le mesh pour l'asset ${this.name}`);

        mesh.name = cloneName;
        mesh.id = cloneName;
        mesh.setEnabled(true);
        mesh.isVisible = true;
        mesh.visibility = 1;
        mesh.isPickable = true;
        mesh.checkCollisions = false;

        if (sourceMesh.material) mesh.material = sourceMesh.material;
        mesh.computeWorldMatrix(true);
        return mesh;
    }

    get position() { return this._position; }
    set position(pos) { this._position.copyFrom(pos); this.mesh.position.copyFrom(this._position); }

    get rotationY() { return this._rotationY; }
    set rotationY(deg) {
        this._rotationY = (deg % 360 + 360) % 360;
        this.mesh.rotation.y = BABYLON.Tools.ToRadians(this._rotationY);
    }

    setPosition(x, y, z) { this._position.set(x, y, z); this.mesh.position.copyFrom(this._position); }
    setRotation(deg) { this.rotationY = deg; }

    updateTransform() {
        this.mesh.position.copyFrom(this._position);
        this.mesh.rotation.y = BABYLON.Tools.ToRadians(this._rotationY);
        this.mesh.computeWorldMatrix(true);
    }

    dispose() {
        if (this.mesh) { this.mesh.dispose(); this.mesh = null; }
    }
};