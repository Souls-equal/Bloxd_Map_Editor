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
        this.autoTerraform = false;
        this._foundationMesh = null;

        this.mesh = this._createRenderableMesh(sourceMesh, `asset_clone_${id}`);
        // Recentre la géométrie → la rotation se fait autour du CENTRE du schem.
        this._centerOffset = (window.recenterMeshHorizontal ? window.recenterMeshHorizontal(this.mesh) : { x: 0, z: 0 });
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

    // === Auto-terraform : ajoute un socle de terrain sous le schem (matériau du sol). ===
    _getGroundBlockId() {
        const tm = window.appTerrainManager;
        if (tm && typeof tm.getSurfaceBlockAtWorld === 'function') {
            const id = tm.getSurfaceBlockAtWorld(Math.round(this._position.x), Math.round(this._position.z));
            if (id) return id;
        }
        return 2; // dirt par défaut
    }
    setAutoTerraform(on) {
        this.autoTerraform = on;
        if (on && !this._foundationMesh) {
            this._foundationMesh = this._createFoundationMesh();
        } else if (!on && this._foundationMesh) {
            this._foundationMesh.dispose(); this._foundationMesh = null;
        }
    }
    _createFoundationMesh() {
        const schem = this.sourceMesh && this.sourceMesh.schemData;
        const sx = (schem && schem.size && schem.size.x) || 4;
        const sz = (schem && schem.size && schem.size.z) || 4;
        const depth = 5;
        const box = BABYLON.MeshBuilder.CreateBox('foundation_' + this.id, { size: 1 }, this.scene);
        box.scaling.set(sx, depth, sz);
        box.position.set(0, -depth / 2, 0);
        box.parent = this.mesh;          // hérite position + rotation de l'asset
        box.isPickable = false;
        const gid = this._getGroundBlockId();
        const c = (window.BlockColors && window.BlockColors.getBlockColor(gid)) || 0x6e4b2a;
        const mat = new BABYLON.StandardMaterial('foundationMat_' + this.id, this.scene);
        mat.diffuseColor = new BABYLON.Color3(((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255);
        mat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        box.material = mat;
        box.metadata = { isFoundation: true };
        return box;
    }

    updateTransform() {
        this.mesh.position.copyFrom(this._position);
        this.mesh.rotation.y = BABYLON.Tools.ToRadians(this._rotationY);
        this.mesh.computeWorldMatrix(true);
    }

    dispose() {
        if (this._foundationMesh) { this._foundationMesh.dispose(); this._foundationMesh = null; }
        if (this.mesh) { this.mesh.dispose(); this.mesh = null; }
    }
};
