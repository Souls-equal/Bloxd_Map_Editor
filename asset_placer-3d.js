/**
 * asset_placer-3d.js — MOTEUR 3D & ASSETS (fusionné)
 * Contient: renderer, assetinstance, assetmanager, camera
 */

/* ═══════════════════════════════════════════════════════════════ */
/*  renderer  */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * asset_placer-renderer.js
 * Optimized VertexData rendering for schematic assets (Babylon)
 */

const ASSET_BLOCK_COLORS = {
    1:  0x8a8a8a, 2:  0x6b4423, 3:  0x7a5434, 4:  0x4ea64e,
    5:  0xe8d98a, 6:  0x9aa3a8, 7:  0x8c8c8c, 8:  0xf5f9fc,
    28: 0x7d7d7d, 29: 0x6e6e6e, 31: 0x949494,
    9:  0x7a4d2a, 10: 0x6a4a2f, 11: 0x765036, 12: 0x725033,
    13: 0xb9b7aa, 14: 0x7d5a38, 21: 0x9a6b3c, 22: 0xd4c8a7,
    23: 0x9b6f45, 24: 0x9a6d40, 25: 0x8a663d, 26: 0x91643f,
    15: 0xa7773f, 16: 0xd6c79b, 17: 0x9e6745, 18: 0x9b7448,
    19: 0x8b693f, 20: 0x936743,
    100: 0x2f6f2d, 101: 0x8fb35a, 102: 0x3f8f35, 103: 0x4f8a3a,
    208: 0x2f6f2d, 209: 0x8fb35a, 210: 0x3f8f35, 211: 0x4f8a3a,
    491: 0x6b8f35, 492: 0x3b7a34, 493: 0x5b9f3a, 494: 0x6b8f35,
    495: 0x3b7a34, 496: 0x5b9f3a, 653: 0xc7772d, 654: 0xc7772d,
    911: 0x6ea84f, 938: 0x6ea84f, 1226: 0xe8a0b8, 1259: 0xe8a0b8,
    497: 0x6a4a2f, 498: 0x765036, 499: 0x725033, 500: 0xb9b7aa,
    501: 0x7d5a38, 502: 0x8a633b, 503: 0x8a633b, 504: 0xb07a44,
    909: 0x8c5f35, 910: 0xb9854c, 937: 0x8c5f35, 1222: 0x8b4a3c,
    1223: 0xa86b55, 1224: 0xa86b55, 1225: 0xc58a72, 1258: 0x8b4a3c,
    150: 0x56a832, 223: 0x6b4b2e, 1109: 0x4aa133, 1110: 0x5bb943
};

function colorFromHex(hex) {
    return {
        r: ((hex >> 16) & 255) / 255,
        g: ((hex >> 8) & 255) / 255,
        b: (hex & 255) / 255
    };
}

function getBlockColor(id) {
    // Palette fidèle BlockColors (identique au Terrain Editor) en priorité.
    if (window.BlockColors && typeof window.BlockColors.getBlockColor === 'function') {
        return colorFromHex(window.BlockColors.getBlockColor(id));
    }
    if (ASSET_BLOCK_COLORS[id] !== undefined) {
        return colorFromHex(ASSET_BLOCK_COLORS[id]);
    }
    // Fallback : couleur déterministe variée.
    const r = ((id * 37) % 90 + 90) / 255;
    const g = ((id * 73) % 90 + 85) / 255;
    const b = ((id * 109) % 70 + 70) / 255;
    return { r, g, b };
}
window.assetGetBlockColor = getBlockColor;

// Recentre la géométrie d'un mesh horizontalement (XZ) pour que la rotation se fasse
// autour du CENTRE du schem, pas d'un coin. Retourne l'offset appliqué {x, z}.
window.recenterMeshHorizontal = function (mesh) {
    try {
        if (typeof mesh.makeGeometryUnique === 'function') mesh.makeGeometryUnique();
        mesh.computeWorldMatrix(true);
        const bb = mesh.getBoundingInfo().boundingBox;
        const cx = (bb.minimum.x + bb.maximum.x) / 2;
        const cz = (bb.minimum.z + bb.maximum.z) / 2;
        mesh.position.x = -cx;
        mesh.position.z = -cz;
        if (typeof mesh.bakeCurrentTransformIntoVertices === 'function') mesh.bakeCurrentTransformIntoVertices();
        mesh.refreshBoundingInfo(true);
        return { x: cx, z: cz };
    } catch (e) { return { x: 0, z: 0 }; }
};

window.createMeshFromSchem = function(scene, schem) {
    const blocks = schem.blocks;
    if (!blocks || blocks.length === 0) return null;

    let allPositions = [], allIndices = [], allNormals = [], allColors = [];
    let vertexOffset = 0;

    const cubeData = BABYLON.VertexData.CreateBox({ size: 1 });
    const basePositions = cubeData.positions;
    const baseIndices = cubeData.indices;
    const baseNormals = cubeData.normals;

    for (const block of blocks) {
        if (!block || block.id === 0) continue;

        const bx = block.x || 0, by = block.y || 0, bz = block.z || 0;
        const color = getBlockColor(block.id);

        for (let i = 0; i < basePositions.length; i += 3) {
            allPositions.push(basePositions[i] + bx + 0.5);
            allPositions.push(basePositions[i+1] + by + 0.5);
            allPositions.push(basePositions[i+2] + bz + 0.5);
        }
        for (let i = 0; i < baseNormals.length; i++) allNormals.push(baseNormals[i]);
        for (let i = 0; i < baseIndices.length; i++) allIndices.push(baseIndices[i] + vertexOffset);

        const num = basePositions.length / 3;
        for (let v = 0; v < num; v++) {
            allColors.push(color.r, color.g, color.b, 1.0);
        }
        vertexOffset += num;
    }

    if (allPositions.length === 0) return null;

    const vertexData = new BABYLON.VertexData();
    vertexData.positions = new Float32Array(allPositions);
    vertexData.indices = allPositions.length / 3 > 65535 ? new Uint32Array(allIndices) : new Uint16Array(allIndices);
    vertexData.normals = new Float32Array(allNormals);
    vertexData.colors = new Float32Array(allColors);

    const mesh = new BABYLON.Mesh("schemMesh", scene);
    vertexData.applyToMesh(mesh);

    const material = new BABYLON.StandardMaterial("schemMat", scene);
    material.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
    material.useVertexColors = true;
    material.backFaceCulling = true;
    mesh.material = material;

    return mesh;
};
/* ═══════════════════════════════════════════════════════════════ */
/*  assetinstance  */
/* ═══════════════════════════════════════════════════════════════ */

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
            BABYLON.Vector3.TransformCoordinatesToRef(tmpV, wm, tmpV);
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
/* ═══════════════════════════════════════════════════════════════ */
/*  assetmanager  */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * asset_placer-assetmanager.js
 * Asset manager (Babylon)
 *
 * Chargement LAZY : à l'inscription on stocke uniquement le schem + les métadonnées
 * (pas de mesh). Le mesh source n'est créé (et caché) qu'au 1er placement.
 * → permet de charger des centaines d'assets sans exploser la mémoire GPU.
 */

window.AssetManager = class AssetManager {
    constructor(scene) {
        this.scene = scene;
        this.templates = {};        // name -> sourceMesh (null tant que non créé à la demande)
        this.templateMeta = {};     // name -> metadata (catégorie, taille…)
        this.templateSchem = {};    // name -> schem (blocks[], size, totalBlocks)
        this.instances = [];
        this._nextId = 1;
        this.onChanged = null;
    }

    _notifyChanged() {
        if (typeof this.onChanged === 'function') this.onChanged(this.instances);
    }

    registerTemplate(name, sourceMesh, schemData = null, metadata = {}) {
        this.templateMeta[name] = metadata || {};
        if (schemData) this.templateSchem[name] = schemData;
        this.templates[name] = sourceMesh || null;  // null = mesh créé à la demande (lazy)

        if (sourceMesh) {
            if (schemData) sourceMesh.schemData = schemData;
            sourceMesh.name = `template_${name}`;
            sourceMesh.id = `template_${name}`;
            sourceMesh.isVisible = false;
            sourceMesh.visibility = 0;
            sourceMesh.isPickable = false;
            sourceMesh.metadata = Object.assign({}, sourceMesh.metadata, {
                isAssetTemplate: true,
                assetName: name,
                assetLibraryMeta: metadata || {}
            });
        }
    }

    getTemplateMeta(name) {
        return this.templateMeta[name] || {};
    }

    getTemplateSchem(name) {
        return this.templateSchem[name] || (this.templates[name] && this.templates[name].schemData) || null;
    }

    hasTemplate(name) {
        return Object.prototype.hasOwnProperty.call(this.templateSchem, name) || (this.templates[name] != null);
    }

    // Crée (et met en cache) le mesh source au 1er usage.
    _ensureSourceMesh(name) {
        if (this.templates[name]) return this.templates[name];
        const schem = this.templateSchem[name];
        if (!schem || !window.createMeshFromSchem) return null;
        const mesh = window.createMeshFromSchem(this.scene, schem);
        if (!mesh) return null;
        mesh.schemData = schem;
        mesh.name = `template_${name}`;
        mesh.id = `template_${name}`;
        mesh.isVisible = false;
        mesh.visibility = 0;
        mesh.isPickable = false;
        mesh.metadata = { isAssetTemplate: true, assetName: name, assetLibraryMeta: this.templateMeta[name] || {} };
        this.templates[name] = mesh;
        return mesh;
    }

    addInstance(name, position = new BABYLON.Vector3(0, 0, 0), rotationY = 0) {
        const sourceMesh = this._ensureSourceMesh(name);  // création lazy au 1er placement
        if (!sourceMesh) {
            console.error(`Template not found: ${name}`);
            return null;
        }
        const instance = new window.AssetInstance(this._nextId++, name, sourceMesh, this.scene);
        instance.position = position;
        instance.setRotation(rotationY);
        this.instances.push(instance);
        this._notifyChanged();
        return instance;
    }

    removeInstance(instanceId) {
        const index = this.instances.findIndex(inst => inst.id === instanceId);
        if (index !== -1) {
            this.instances[index].dispose();
            this.instances.splice(index, 1);
            this._notifyChanged();
            return true;
        }
        return false;
    }

    getInstanceByMesh(mesh) {
        if (!mesh) return null;
        const direct = this.instances.find(inst => inst.mesh === mesh);
        if (direct) return direct;
        const id = mesh.metadata && mesh.metadata.assetInstanceId;
        if (id !== undefined && id !== null) {
            return this.instances.find(inst => inst.id === id) || null;
        }
        return null;
    }
};

/* ═══════════════════════════════════════════════════════════════ */
/*  camera  */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * asset_placer-camera.js
 * Configuration FreeCamera (ZQSD/WASD)
 */

window.setupCamera = function(scene, canvas) {
    const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 15, -20), scene);
    camera.setTarget(BABYLON.Vector3.Zero());

    window.updateCameraKeys = function() {
        if (window.I18N && window.I18N.keyboard === 'qwerty') {
            camera.keysUp = [87];
            camera.keysDown = [83];
            camera.keysLeft = [65];
            camera.keysRight = [68];
        } else {
            camera.keysUp = [90, 87];
            camera.keysDown = [83];
            camera.keysLeft = [81];
            camera.keysRight = [68];
        }
    };
    window.updateCameraKeys();

    camera.inputs.removeByType("FreeCameraKeyboardInput");

    const inputMap = {};

    const getEventKey = (evt) => (typeof evt.key === 'string' ? evt.key.toLowerCase() : '');
    const getEventCode = (evt) => (typeof evt.code === 'string' ? evt.code : '');

    const focusSelected = () => {
        const selectionManager = window.appSelectionManager;
        const selected = selectionManager && selectionManager.selectedInstance;
        if (!selected || !selected.mesh) return;

        selected.mesh.computeWorldMatrix(true);
        let center = selected.mesh.getAbsolutePosition ? selected.mesh.getAbsolutePosition().clone() : selected.mesh.position.clone();
        let radius = 8;

        try {
            const bb = selected.mesh.getBoundingInfo().boundingBox;
            center = bb.centerWorld.clone();
            radius = Math.max(4, bb.extendSizeWorld.length());
        } catch (err) {}

        if (selected.isTerrainSelection && window.appTerrainManager && typeof window.appTerrainManager.getTerrainFocusInfo === 'function') {
            const info = window.appTerrainManager.getTerrainFocusInfo();
            const size = info.size || { x: 300, y: 1, z: 300 };
            const maxXZ = Math.max(size.x || 300, size.z || 300);
            const height = Math.max(1, size.y || 1);

            const target = info.topCenter.clone();
            target.y = info.maxY - Math.min(height * 0.35, 40);

            const distance = Math.min(900, Math.max(90, maxXZ * 0.18));
            const above = Math.min(650, Math.max(55, height * 1.8 + maxXZ * 0.04));
            camera.position.set(info.topCenter.x, info.maxY + above, info.topCenter.z - distance);
            camera.setTarget(target);
            return;
        }

        const forward = camera.getDirection(BABYLON.Axis.Z).normalize();
        const distance = Math.max(12, radius * 2.2);
        const targetPosition = center.subtract(forward.scale(distance));
        targetPosition.y = center.y + Math.max(8, radius * 0.55);

        camera.position.copyFrom(targetPosition);
        camera.setTarget(center);
    };

    // Cadre le terrain (son milieu) — utilisé par 'F' quand aucun asset n'est sélectionné.
    const focusTerrain = () => {
        const tm = window.appTerrainManager;
        if (!tm || !tm.hasTerrain()) return;
        const info = tm.getTerrainFocusInfo();
        const size = info.size || { x: 300, y: 1, z: 300 };
        const maxXZ = Math.max(size.x || 300, size.z || 300);
        const target = info.center.clone();
        const distance = Math.min(4000, Math.max(120, maxXZ * 0.9));
        const above = Math.min(3000, Math.max(80, maxXZ * 0.6));
        camera.position.set(info.center.x, (info.maxY || 0) + above, info.center.z - distance);
        camera.setTarget(target);
    };

    window.addEventListener('keydown', (evt) => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
        const key = getEventKey(evt);
        const code = getEventCode(evt);
        if (key) inputMap[key] = true;
        if (code) inputMap[code] = true;

        if (key === 'f') {
            evt.preventDefault();
            const sm = window.appSelectionManager;
            const sel = sm && sm.selectedInstance;
            // Asset sélectionné → on le cadre ; sinon → on cadre le terrain (son milieu).
            if (sel && sel.mesh && !sel.isTerrainSelection) focusSelected();
            else focusTerrain();
        }
        if (code === 'Space') evt.preventDefault();
    });

    window.addEventListener('keyup', (evt) => {
        const key = getEventKey(evt);
        const code = getEventCode(evt);
        if (key) inputMap[key] = false;
        if (code) inputMap[code] = false;
    });

    window.addEventListener('blur', () => {
        for (let key in inputMap) inputMap[key] = false;
    });

    scene.onBeforeRenderObservable.add(() => {
        const speed = 3.0;  // vitesse de base (×6 vs l'originale 0.5)
        const sprint = (inputMap['shift'] || inputMap['ShiftLeft'] || inputMap['ShiftRight']) ? 3 : 1;
        const sp = speed * sprint;
        const forward = camera.getDirection(BABYLON.Axis.Z);
        const right = camera.getDirection(BABYLON.Axis.X);
        forward.normalize();
        right.normalize();

        const isQwerty = window.I18N && window.I18N.keyboard === 'qwerty';

        if (inputMap['z'] || inputMap['w']) camera.position.addInPlace(forward.scale(sp));
        if (inputMap['s']) camera.position.addInPlace(forward.scale(-sp));
        if ((!isQwerty && inputMap['q']) || (isQwerty && inputMap['a'])) camera.position.addInPlace(right.scale(-sp));
        if (inputMap['d']) camera.position.addInPlace(right.scale(sp));

        if (inputMap['Space'] || inputMap[' ']) camera.position.y += sp;
        if (inputMap['ControlLeft'] || inputMap['ControlRight'] || inputMap['control']) camera.position.y -= sp;
    });

    camera.speed = 0.5;
    camera.angularSensibility = 500;
    camera.inertia = 0.6;

    let isLeftMouseDown = false;
    let isRightMouseDown = false;
    let previousMousePosition = { x: 0, y: 0 };

    canvas.addEventListener("pointerdown", (evt) => {
        if (window.isDraggingGizmo) return;
        if (evt.button === 0) isLeftMouseDown = true;
        if (evt.button === 2) isRightMouseDown = true;
        previousMousePosition = { x: evt.clientX, y: evt.clientY };
    });

    canvas.addEventListener("pointerup", (evt) => {
        if (evt.button === 0) isLeftMouseDown = false;
        if (evt.button === 2) isRightMouseDown = false;
    });

    canvas.addEventListener("contextmenu", (evt) => evt.preventDefault());

    canvas.addEventListener("pointermove", (evt) => {
        if (window.isDraggingGizmo) return;
        const deltaX = evt.clientX - previousMousePosition.x;
        const deltaY = evt.clientY - previousMousePosition.y;

        if (isLeftMouseDown) {
            const ROTATE_SENSITIVITY = 0.0009;
            camera.cameraRotation.y += deltaX * ROTATE_SENSITIVITY;
            camera.cameraRotation.x += deltaY * ROTATE_SENSITIVITY;
        } else if (isRightMouseDown) {
            const panSpeed = 0.05 * 0.75;
            const camRight = camera.getDirection(BABYLON.Axis.X);
            const camUp = camera.getDirection(BABYLON.Axis.Y);
            camera.position.addInPlace(camRight.scale(-deltaX * panSpeed));
            camera.position.addInPlace(camUp.scale(deltaY * panSpeed));
        }
        previousMousePosition = { x: evt.clientX, y: evt.clientY };
    });

    canvas.addEventListener("wheel", (evt) => {
        evt.preventDefault();
        const zoomSpeed = 2.5;
        const fwd = camera.getDirection(BABYLON.Axis.Z);
        camera.position.addInPlace(fwd.scale(Math.sign(evt.deltaY) * -zoomSpeed));
    }, { passive: false });

    return camera;
};