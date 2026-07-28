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
        if (!schem || !schem.blocks) return null;
        const co = this._centerOffset || { x: 0, z: 0 };
        // Empreinte locale (bx,bz) -> base Y locale
        const fp = new Map();
        for (const b of schem.blocks) { if (b.id === 0) continue; const k = b.x + ',' + b.z; const p = fp.get(k); if (p === undefined || b.y < p) fp.set(k, b.y); }
        if (!fp.size) return null;
        let baseY = Infinity; for (const y of fp.values()) if (y < baseY) baseY = y;
        const floorY = baseY - 6;
        // Échantillonne la couleur du matériau du sol à chaque colonne (world).
        this.mesh.computeWorldMatrix(true);
        const wm = this.mesh.getWorldMatrix();
        const tm = window.appTerrainManager;
        const tmpV = new BABYLON.Vector3();
        const groundCol = (bx, bz) => {
            tmpV.set(bx - co.x, baseY, bz - co.z);
            BABYLON.Vector3.TransformToRef(tmpV, wm, tmpV);
            let gid = (tm && tm.getSurfaceBlockAtWorld) ? tm.getSurfaceBlockAtWorld(Math.round(tmpV.x), Math.round(tmpV.z)) : null;
            if (!gid) gid = 2;
            const c = (window.BlockColors && window.BlockColors.getBlockColor(gid)) || 0x6e4b2a;
            return [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
        };
        // Colonnes : "bx,bz" -> { topY, col }. Empreinte = baseY, bordure = pente (baseY - ring).
        const cols = new Map();
        const keyOf = (x, z) => x + ',' + z;
        for (const k of fp.keys()) { const p = k.split(','); cols.set(k, { topY: baseY, col: groundCol(+p[0], +p[1]) }); }
        let frontier = Array.from(fp.keys()).map(k => k.split(',').map(Number));
        for (let ring = 1; ring <= 3; ring++) {
            const next = []; const seen = new Set(cols.keys());
            for (const [x, z] of frontier) {
                for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                    const nk = keyOf(x + dx, z + dz);
                    if (seen.has(nk)) continue; seen.add(nk);
                    cols.set(nk, { topY: baseY - ring, col: groundCol(x + dx, z + dz) });
                    next.push([x + dx, z + dz]);
                }
            }
            frontier = next;
        }
        // Construit le mesh : dessus + jupes jusqu'au sol (floorY), couleur par colonne.
        const positions = [], indices = [], normals = [], colors = [];
        let vi = 0;
        const addQuad = (a, b, c, d, n, col) => {
            for (const p of [a, b, c, d]) positions.push(p[0], p[1], p[2]);
            for (let v = 0; v < 4; v++) { normals.push(n[0], n[1], n[2]); colors.push(col[0], col[1], col[2], 1); }
            indices.push(vi, vi + 2, vi + 1, vi, vi + 3, vi + 2); vi += 4;
        };
        for (const [k, info] of cols) {
            const p = k.split(','); const bx = +p[0], bz = +p[1];
            const x0 = bx - co.x, z0 = bz - co.z, ty = info.topY, fy = floorY;
            const c = info.col, cd = [c[0] * 0.8, c[1] * 0.8, c[2] * 0.8];
            addQuad([x0, ty, z0], [x0 + 1, ty, z0], [x0 + 1, ty, z0 + 1], [x0, ty, z0 + 1], [0, 1, 0], c);
            addQuad([x0 + 1, ty, z0], [x0 + 1, ty, z0 + 1], [x0 + 1, fy, z0 + 1], [x0 + 1, fy, z0], [1, 0, 0], cd);
            addQuad([x0, ty, z0 + 1], [x0, ty, z0], [x0, fy, z0], [x0, fy, z0 + 1], [-1, 0, 0], cd);
            addQuad([x0 + 1, ty, z0 + 1], [x0, ty, z0 + 1], [x0, fy, z0 + 1], [x0 + 1, fy, z0 + 1], [0, 0, 1], cd);
            addQuad([x0, ty, z0], [x0 + 1, ty, z0], [x0 + 1, fy, z0], [x0, fy, z0], [0, 0, -1], cd);
        }
        const vd = new BABYLON.VertexData();
        vd.positions = new Float32Array(positions);
        vd.indices = positions.length / 3 > 65535 ? new Uint32Array(indices) : new Uint16Array(indices);
        vd.normals = new Float32Array(normals);
        vd.colors = new Float32Array(colors);
        const mesh = new BABYLON.Mesh('foundation_' + this.id, this.scene);
        vd.applyToMesh(mesh);
        mesh.parent = this.mesh;
        mesh.isPickable = false;
        const mat = new BABYLON.StandardMaterial('foundationMat_' + this.id, this.scene);
        mat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        mat.useVertexColors = true;
        mat.backFaceCulling = false;
        mesh.material = mat;
        mesh.metadata = { isFoundation: true };
        return mesh;
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
