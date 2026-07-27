/* ============================================================
   Bloxd Terrain Editor — terrain_editor_map3d.js
   TOUT le rendu 3D : Babylon.js, terrain CHUNKISÉ (32×32 cellules),
   mesh voxel/lisse, eau, chunks de détail 1:1, caméra ArcRotateCamera.
   Chargement : 6/8 — nécessite terrain_editor_babylon.min.js + generator.js (voir <script> dans terrain_editor.html)
   ============================================================ */

            window.safeStorage = window.safeStorage || {
    _data: {},
    getItem(k) {
        try { return window.localStorage.getItem(k); }
        catch (e) { return this._data[k] || null; }
    },
    setItem(k, v) {
        try { window.localStorage.setItem(k, v); }
        catch (e) { this._data[k] = v; }
    },
    removeItem(k) {
        try { window.localStorage.removeItem(k); }
        catch (e) { delete this._data[k]; }
    }
};

/**
 * GIGA PROMPT - Bloxd Terrain Editor
 * Module : terrain_editor_map3d.js
 * Rôle : Visualisation 3D interactive du terrain avec Babylon.js
 *
 * NOTE v3.5 : portage complet Three.js -> Babylon.js (fusion des éditeurs).
 * NOTE v3.6 — GROS PASSAGE PERFORMANCE :
 *  1) TERRAIN DÉCOUPÉ EN CHUNKS (32×32 cellules -> 8×8 = 64 chunks en 256²)
 *     - chaque chunk possède SA bounding box -> FRUSTUM CULLING automatique de
 *       Babylon : zoomé sur un coin, les chunks hors-champ ne sont pas dessinés
 *     - PICKING accéléré : le rayon n'est testé en triangles que contre les
 *       chunks dont la bbox est traversée (≈2k tris au lieu de 260k)
 *     - MISES À JOUR LOCALES : un coup de pinceau ne reconstruit que les chunks
 *       touchés — en mode VOXEL aussi (avant : rebuild complet de la carte !)
 *  2) BUILD PROGRESSIF : chunks construits par budget (~7 ms/frame), triés par
 *     proximité du point regardé -> la carte apparaît autour du regard, sans gel.
 *  3) OMBRES RENDUES UNE SEULE FOIS (refreshRate RENDER_ONCE + ré-armement à
 *     chaque changement de géométrie) : en orbite caméra, la passe d'ombre
 *     (toute la géométrie re-rasterisée) disparaît des frames sans édition.
 *  4) MATÉRIAUX PARTAGÉS FIGÉS (material.freeze()) + meshes statiques
 *     (freezeWorldMatrix()) : zéro recalcul CPU par frame pour la géométrie fixe.
 *  5) COULEURS SANS ALLOCATION : cache hex->RGB + objets scratch (avant : 2 à 4
 *     NEW Color3 PAR sommet à chaque rebuild -> pics de GC).
 *  6) FACES VISIBLES SEULEMENT : un chunk grossier 100% couvert par la
 *     surcouche 1:1 est purement DÉSACTIVÉ (zéro pixel rasterisé, zéro
 *     z-fighting) au lieu d'être simplement enfoncé sous la carte.
 *  7) Indices 16 bits choisis automatiquement par Babylon (< 65536 sommets par
 *     chunk) -> buffers 2× plus légers, transferts GPU réduits.
 * L'API publique consommée par ui.js / main.js est INCHANGÉE :
 * updateTerrain, updateTerrainRegion, resize, resetCamera, clearDetailOverlay,
 * clearDetailOverlayInRegion, _needsRender, _terrainDirty, _cellRanges,
 * _geomMeta, _sunkCells, _detailMeshes, detailGroup, brushCursor3D, isPainting3D.
 */

class Map3D {
    constructor(containerId, generator) {
        this.container = document.getElementById(containerId);
        this.generator = generator;

        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.canvas = null;

        // ---- Terrain chunkisé (v3.6) ----
        this._chunkCells = 32;              // taille d'un chunk en cellules de grille
        this._terrainChunks = [];           // entries {cx,cz,x0,x1,z0,z1,mesh,wire,positions,...,built}
        this._chunkIndex = new Map();       // 'cx,cz' -> entry
        this._chunkBuildQueue = [];         // file de construction progressive
        this._terrainMaterial = null;       // matériau PARTAGÉ de tous les chunks (figé)
        this._cellRanges = new Map();       // 'gx,gz' -> {entry, s, e} (voxel : sink par cellule)
        this._sunkCells = new Map();        // 'gx,gz' -> {cx, cz, saved:Float32Array(ys)}
        this._geomMeta = null;              // layout courant {resX,resZ,scale,halfSizeX,halfSizeZ,meshType}
        this._dbg = { chunkBuilds: 0 };     // instrumentation (tests / perf)

        this.waterMesh = null;

        this.showWireframe = false;
        this.animFrameId = null;

        // TACHE 1 : rendu à la demande (dirty flag) + pause quand invisible
        this._needsRender = true;   // au moins un rendu au démarrage
        this._wasHidden = false;    // détecte la transition invisible -> visible

        // Caches couleur (v3.6) : hex string -> {r,g,b} (auto-invalide quand
        // la couleur du biome change, car la CLÉ c'est la couleur elle-même)
        this._biomeRGBCache = new Map();
        this._colScratch = { r: 0, g: 0, b: 0 };
        this._sideScratch = { r: 0, g: 0, b: 0 };

        this.init();
    }

    /**
     * Initialisation du moteur Babylon.js, scène, caméra, lumières et contrôles
     */
    init() {
        if (!this.container || typeof BABYLON === 'undefined') {
            console.error("Babylon.js non disponible ou conteneur introuvable !");
            return;
        }

        const width = this.container.clientWidth || 600;
        const height = this.container.clientHeight || 400;

        // 0. Canvas dédié + moteur Babylon
        this.canvas = document.createElement('canvas');
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.display = 'block';
        this.canvas.style.outline = 'none';
        this.canvas.style.touchAction = 'none';
        this.container.innerHTML = '';
        this.container.appendChild(this.canvas);

        this.engine = new BABYLON.Engine(this.canvas, true, { powerPreference: 'high-performance' }, true);
        // PERF : plafonne le pixel-ratio effectif à 1.5 (au lieu de 2). Sur les écrans
        // Retina/hi-DPI, la scène était rendue jusqu'à 4× les pixels CSS (coût GPU
        // énorme en orbite/édition). À 1.5 : ~44 % de pixels en moins, rendu net.
        this.engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 1.5));

        // 1. Scène (fond sombre + brouillard)
        this.scene = new BABYLON.Scene(this.engine);
        // Repère droitier (fix v3.5.1) : winding natif Babylon + vue identique à Three.
        this.scene.useRightHandedSystem = true;
        this.scene.clearColor = BABYLON.Color4.FromHexString('#0f111aFF');
        this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        this.scene.fogDensity = 0.0012;
        this.scene.fogColor = BABYLON.Color3.FromHexString('#0f111a');
        // Groupe de rendu 1 = « toujours au-dessus » (depth buffer effacé avant),
        // utilisé par le curseur pinceau (≈ depthTest:false + renderOrder de Three).
        this.scene.setRenderingAutoClearDepthStencil(1, true);

        // 2. Caméra ArcRotate (≈ PerspectiveCamera + OrbitControls fusionnés)
        this.camera = new BABYLON.ArcRotateCamera('map3dCamera', Math.PI / 2, 0.9, 500, new BABYLON.Vector3(0, 80, 0), this.scene);
        this.camera.fov = 50 * Math.PI / 180; // 50° comme la PerspectiveCamera d'origine
        this.camera.minZ = 0.1;
        this.camera.maxZ = 10000;
        this.camera.upperBetaLimit = Math.PI / 2 - 0.02; // ≈ maxPolarAngle : ne jamais passer sous le sol
        this.camera.lowerRadiusLimit = 1;                // zoom très proche autorisé (le « zoom traversant » pousse ensuite la cible)
        this.camera.inertia = 0.92;                      // ≈ enableDamping + dampingFactor 0.08
        this.camera.panningInertia = 0.92;
        this.camera.attachControl(this.canvas, true);
        // Position initiale identique à la version Three (0, 350, 450) visant (0, 80, 0)
        this.camera.setTarget(new BABYLON.Vector3(0, 80, 0));
        this.camera.setPosition(new BABYLON.Vector3(0, 350, 450));
        // TACHE 1 : tout changement de la vue (drag, inertie, zoom) => un seul rendu.
        // L'observable se déclenche PENDANT scene.render() -> la chaîne « dirty -> render ->
        // dirty (inertie restante) » s'auto-entretient jusqu'à l'arrêt complet de la caméra.
        this.camera.onViewMatrixChangedObservable.add(() => { this._needsRender = true; });

        // 3. Lumières
        // ≈ AmbientLight(0xffffff, 0.45) : hémisphérique uniforme (ciel = sol)
        const ambientLight = new BABYLON.HemisphericLight('ambientLight', new BABYLON.Vector3(0, 1, 0), this.scene);
        ambientLight.diffuse = new BABYLON.Color3(1, 1, 1);
        ambientLight.groundColor = new BABYLON.Color3(1, 1, 1);
        ambientLight.specular = new BABYLON.Color3(0, 0, 0);
        ambientLight.intensity = 0.45;

        // ≈ DirectionalLight(0xfffaed, 0.9) avec ombres adoucies
        const sunLight = new BABYLON.DirectionalLight('sunLight', new BABYLON.Vector3(-300, -600, -400).normalize(), this.scene);
        sunLight.position = new BABYLON.Vector3(300, 600, 400);
        sunLight.diffuse = BABYLON.Color3.FromHexString('#fffaed');
        sunLight.intensity = 0.9;
        // Ombres : ortho caméra ±500 comme la version Three (mapSize 1024, near 50, far 1500)
        sunLight.orthoLeft = -500;
        sunLight.orthoRight = 500;
        sunLight.orthoTop = 500;
        sunLight.orthoBottom = -500;
        sunLight.shadowMinZ = 50;
        sunLight.shadowMaxZ = 1500;
        this._shadowGen = new BABYLON.ShadowGenerator(1024, sunLight);
        this._shadowGen.usePoissonSampling = true; // adoucissement des ombres (≈ PCFSoftShadowMap)
        // v3.6 PERF : la shadow map n'est re-rasterisée QUE quand la géométrie
        // émettrice change (édition, génération, sink). Entre deux éditions,
        // l'orbite caméra ne rejoue plus la passe d'ombre (elle coûtait une
        // rasterisation complète du terrain à 60 FPS).
        {
            const sm = this._shadowGen.getShadowMap();
            if (sm && BABYLON.RenderTargetTexture &&
                BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE !== undefined) {
                sm.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
            }
        }

        // Lumière d'appoint d'horizon (bleutée) ≈ HemisphereLight(0x38bdf8, 0x1e293b, 0.35)
        const hemiLight = new BABYLON.HemisphericLight('hemiLight', new BABYLON.Vector3(0, 1, 0), this.scene);
        hemiLight.diffuse = BABYLON.Color3.FromHexString('#38bdf8');
        hemiLight.groundColor = BABYLON.Color3.FromHexString('#1e293b');
        hemiLight.specular = new BABYLON.Color3(0, 0, 0);
        hemiLight.intensity = 0.35;

        // 4. ZOOM TRAVERSANT (fix "impossible de continuer à zoomer") :
        // le dolly est multiplicatif autour d'une cible FIXE : près de la cible,
        // chaque cran de molette n'avance presque plus. Ici, quand on zoome en
        // étant déjà proche (radius < 30), on POUSSE la cible vers l'avant le
        // long du regard -> zoom sans fin, identique à la version Three.
        this.canvas.addEventListener('wheel', (e) => {
            if (!this.camera) return;
            this._needsRender = true; // la molette change toujours la vue
            if (e.deltaY >= 0) return; // on ne traite que le zoom AVANT
            const dist = this.camera.radius;
            if (dist < 30) {
                // Avance la cible de ~40% de la distance restante (borné)
                const step = Math.max(2, dist * 0.4);
                const dir = this.camera.target.subtract(this.camera.position).normalize();
                this.camera.target.x += dir.x * step;
                this.camera.target.y += dir.y * step;
                this.camera.target.z += dir.z * step;
                this._needsRender = true;
            }
        }, { passive: true });

        // 5. Curseur Pinceau 3D penché selon la pente (anneau + liseré)
        // VISIBILITE : rendu en groupe 1 (depth effacé => toujours visible,
        // ≈ depthTest:false de Three) + depthWrite désactivé + liseré noir.
        this.brushCursor3D = this._buildRingMesh('brushCursor', 0.72, 1.0, 48, '#10b981', 0.95, 2);
        const ringOutline = this._buildRingMesh('brushCursorOutline', 1.0, 1.12, 48, '#000000', 0.7, 1);
        ringOutline.parent = this.brushCursor3D; // hérite position/orientation/échelle
        this.brushCursor3D.isVisible = false;
        this._cursorHex = '#10b981';

        this.init3DInteractiveEvents();

        // NAVIGATION VOL "classique" (ZQSD/WASD + Espace/Ctrl + Maj) sur la caméra orbite
        this._flyKeys = {};
        this._initFlyControls();

        // 6. Gestion du redimensionnement
        window.addEventListener('resize', () => this.resize());

        this.animate();
    }

    /**
     * Construit un anneau plat (XZ, normales +Y) — équivalent de THREE.RingGeometry
     * pivotée de -90°. alphaIndex = ordre de dessin entre transparents (≈ renderOrder).
     */
    _buildRingMesh(name, inner, outer, segments, colorHex, alpha, alphaIndex) {
        const positions = [];
        const indices = [];
        const normals = [];
        for (let i = 0; i < segments; i++) {
            const a0 = (i / segments) * Math.PI * 2;
            const a1 = ((i + 1) / segments) * Math.PI * 2;
            const c0 = Math.cos(a0), s0 = Math.sin(a0);
            const c1 = Math.cos(a1), s1 = Math.sin(a1);
            const base = positions.length / 3;
            positions.push(inner * c0, 0, inner * s0,
                           outer * c0, 0, outer * s0,
                           inner * c1, 0, inner * s1,
                           outer * c1, 0, outer * s1);
            indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
            for (let k = 0; k < 4; k++) normals.push(0, 1, 0);
        }
        const mesh = new BABYLON.Mesh(name, this.scene);
        const vd = new BABYLON.VertexData();
        vd.positions = positions;
        vd.normals = normals;
        vd.indices = indices;
        vd.applyToMesh(mesh);
        const mat = new BABYLON.StandardMaterial(name + 'Mat', this.scene);
        mat.disableLighting = true;                 // ≈ MeshBasicMaterial (non éclairé)
        mat.emissiveColor = BABYLON.Color3.FromHexString(colorHex);
        mat.alpha = alpha;
        mat.disableDepthWrite = true;               // ≈ depthWrite:false
        mat.backFaceCulling = false;                // ≈ THREE.DoubleSide
        mesh.material = mat;
        mesh.renderingGroupId = 1;                  // toujours par-dessus le terrain
        mesh.alphaIndex = alphaIndex || 0;
        mesh.isPickable = false;                    // jamais dans le picking du pinceau
        return mesh;
    }

    /** Terrain présent sous la caméra ? (au moins un chunk construit) */
    _hasTerrain() {
        return !!(this._terrainChunks && this._terrainChunks.length);
    }

    /**
     * Prédicat de picking : uniquement les chunks du terrain (+ la surcouche 1:1).
     * v3.6 : Babylon teste d'abord la BOUNDING BOX de chaque mesh candidat — le
     * rayon n'est donc comparé aux triangles que des 1-2 chunks traversés
     * (≈2-8k triangles à tester au lieu de ~260k sur l'ancien mesh unique).
     */
    _pickPredicate(mesh) {
        const md = mesh.metadata;
        if (!md || mesh.isEnabled() === false) return false;
        return md.terrainChunk === true || md.detail === true;
    }

    _pickTerrain(px, py) {
        if (!this.scene || !this.camera || !this._hasTerrain()) return null;
        const pick = this.scene.pick(px, py, (m) => this._pickPredicate(m), false, this.camera);
        if (pick && pick.hit) return pick;
        return null;
    }

    init3DInteractiveEvents() {
        const dom = this.canvas;

        dom.addEventListener('mousemove', (e) => {
            // Un drag (tout bouton) peut changer la vue même hors éditeur (pan/rotate)
            if (e.buttons !== 0) this._needsRender = true;

            if (!window.map2dInstance || window.map2dInstance.activeTab !== 'editor') {
                if (this.brushCursor3D && this.brushCursor3D.isVisible) {
                    this.brushCursor3D.isVisible = false;
                    this._needsRender = true;
                }
                return;
            }

            const rect = dom.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            this._lastPointerPx = { x: mx, y: my };

            if (!this._hasTerrain()) return;
            const hit = this._pickTerrain(mx, my);

            if (hit) {
                const point = hit.pickedPoint;
                // Normale de face en monde (≈ hit.face.normal de Three)
                let normal = hit.getNormal(true, false);
                if (!normal) normal = new BABYLON.Vector3(0, 1, 0);
                else normal.normalize();

                this.brushCursor3D.isVisible = true;
                const radiusBlocks = window.map2dInstance.brushRadius || 4;
                const scale = 3.5;
                const worldRadius = radiusBlocks * scale;
                this.brushCursor3D.scaling.copyFromFloats(worldRadius, worldRadius, worldRadius);

                // Position : point + normale * 0.6 (évite le z-fighting avec la surface)
                this.brushCursor3D.position.copyFromFloats(
                    point.x + normal.x * 0.6,
                    point.y + normal.y * 0.6,
                    point.z + normal.z * 0.6
                );
                // Orientation : rotation de +Y vers la normale
                // (≈ quaternion.setFromUnitVectors(up, normal) de Three)
                const dot = Math.max(-1, Math.min(1, normal.y)); // up·normal = normal.y
                if (dot > 0.99999) {
                    this.brushCursor3D.rotationQuaternion = BABYLON.Quaternion.Identity();
                } else if (dot < -0.99999) {
                    this.brushCursor3D.rotationQuaternion = BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(1, 0, 0), Math.PI);
                } else {
                    const axis = BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), normal).normalize();
                    this.brushCursor3D.rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, Math.acos(dot));
                }
                this._needsRender = true;

                const tool = window.map2dInstance.activeTool;
                let hexColor = '#ffffff';
                if (tool === 'raise') hexColor = '#10b981';
                else if (tool === 'lower') hexColor = '#ef4444';
                else if (tool === 'smooth') hexColor = '#f59e0b';
                else if (tool === 'flatten') hexColor = '#8b5cf6';
                else if (tool === 'sphere' || tool === 'box') hexColor = '#a78bfa';
                else if (tool === 'eraser') hexColor = '#ec4899';
                else if (tool === 'biome') {
                    const bKey = window.map2dInstance.activeBiome || 'plain';
                    hexColor = this.generator.biomes[bKey]?.color || '#ffffff';
                }
                if (hexColor !== this._cursorHex) {
                    this._cursorHex = hexColor;
                    this.brushCursor3D.material.emissiveColor.copyFrom(BABYLON.Color3.FromHexString(hexColor));
                }

                if (this.isPainting3D) {
                    this.applyBrush3D(point, normal, tool, radiusBlocks, window.map2dInstance.brushIntensity || 15, window.map2dInstance.activeBiome || 'plain');
                }
            } else {
                if (this.brushCursor3D.isVisible) this._needsRender = true;
                this.brushCursor3D.isVisible = false;
            }
        });

        const handleDown = (e) => {
            if (e.button === 0 && window.map2dInstance && window.map2dInstance.activeTab === 'editor' && !e.shiftKey && !e.ctrlKey) {
                // La caméra est déjà « muette » en mode éditeur (updateControlsMode :
                // buttons = []) ; on stoppe quand même la propagation par sécurité
                // (≈ EMPÊCHE ORBITCONTROLS DE TOURNER LA CAMÉRA LORS DU CLIC GAUCHE EN ÉDITEUR)
                e.stopPropagation();
                this.isPainting3D = true;
                this.firstClickH3D = null; // capturé au 1er point touché (outil Aplatir)
                this._stampDone3D = false; // nouvelle pose de forme autorisée
                if (this.generator && typeof this.generator.saveStateForUndo === 'function') {
                    this.generator.saveStateForUndo();
                }
                if (this.brushCursor3D && this.brushCursor3D.isVisible && this._lastPointerPx) {
                    const hit = this._pickTerrain(this._lastPointerPx.x, this._lastPointerPx.y);
                    if (hit) {
                        let n = hit.getNormal(true, false);
                        if (!n) n = new BABYLON.Vector3(0, 1, 0); else n.normalize();
                        this.applyBrush3D(hit.pickedPoint, n, window.map2dInstance.activeTool, window.map2dInstance.brushRadius || 4, window.map2dInstance.brushIntensity || 15, window.map2dInstance.activeBiome || 'plain');
                    }
                }
            }
        };
        dom.addEventListener('pointerdown', handleDown, { capture: true });
        dom.addEventListener('mousedown', handleDown, { capture: true });

        const handleUp = (e) => {
            if (this.isPainting3D) {
                this.isPainting3D = false;
                this.firstClickH3D = null;
                this.updateTerrain();
                if (window.map2dInstance) window.map2dInstance.render();
                if (window.uiManagerInstance) window.uiManagerInstance.updateStatsBar();
            }
        };
        window.addEventListener('pointerup', handleUp, { capture: true });
        window.addEventListener('mouseup', handleUp, { capture: true });
    }

    applyBrush3D(point, normal, tool, radius, intensity, activeBiome) {
        if (!this.generator || !this.generator.grid || !this.generator.grid.length) return;
        const grid = this.generator.grid;
        const resX = grid.length;
        const resZ = grid[0] ? grid[0].length : 0;
        const scale = 3.5;
        const halfSizeX = (resX * scale) / 2;
        const halfSizeZ = (resZ * scale) / 2;

        const centerGx = Math.floor((point.x + halfSizeX) / scale);
        const centerGz = Math.floor((point.z + halfSizeZ) / scale);

        // TAMPONS 3D : sphère / pavé posés une fois par clic
        if (tool === 'sphere' || tool === 'box') {
            if (this._stampDone3D) return;
            this._stampDone3D = true;
            const p = (window.uiManagerInstance && window.uiManagerInstance.stampParams) || { w: 16, d: 16, h: 20, paintBiome: true };
            const ok = this.generator.applyStamp(centerGx, centerGz, tool, p.w, p.d, p.h, p.paintBiome ? activeBiome : null);
            if (ok) {
                // p.w/p.d sont en blocs : la zone modifiée réelle est lastBrushRegion (cellules)
                const reg = this.generator.lastBrushRegion || { gxMin: centerGx - 2, gxMax: centerGx + 2, gzMin: centerGz - 2, gzMax: centerGz + 2 };
                this.updateTerrainRegion(reg.gxMin - 1, reg.gxMax + 1, reg.gzMin - 1, reg.gzMax + 1);
                if (window.map2dInstance) {
                    if (typeof window.map2dInstance.requestRender === 'function') window.map2dInstance.requestRender();
                    else window.map2dInstance.render();
                }
            }
            return;
        }

        // Outil Aplatir : mémorise la hauteur du tout premier point touché du geste
        if (tool === 'flatten' && (this.firstClickH3D === null || this.firstClickH3D === undefined)) {
            if (centerGx >= 0 && centerGx < resX && centerGz >= 0 && centerGz < resZ && grid[centerGx] && grid[centerGx][centerGz]) {
                this.firstClickH3D = grid[centerGx][centerGz].height;
            }
        }

        let modified = false;

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                let dist = Math.sqrt(dx * dx + dz * dz);
                if (dist > radius) continue;

                let gx = centerGx + dx;
                let gz = centerGz + dz;
                if (gx < 0 || gx >= resX || gz < 0 || gz >= resZ) continue;

                let cell = grid[gx][gz];
                let falloff = 1.0 - (dist / (radius + 1));

                let slopeBonus = 1.0;
                if (radius > 0 && normal) {
                    slopeBonus = 1.0 + ((dx * normal.x + dz * normal.z) / radius) * 0.75;
                }
                let step = intensity * falloff * 0.5 * Math.max(0.3, slopeBonus);

                if (tool === 'raise') {
                    cell.height = Math.min(this.generator.config.maxHeight, cell.height + step);
                    cell.isCustomHeight = true;
                    modified = true;
                } else if (tool === 'lower') {
                    cell.height = Math.max(this.generator.config.minHeight, cell.height - step);
                    cell.isCustomHeight = true;
                    modified = true;
                } else if (tool === 'flatten' && this.firstClickH3D !== null && this.firstClickH3D !== undefined) {
                    // v3.1 : mode 100% = niveau exact (voir generator.applyBrush)
                    cell.height = this.generator.config.flattenExact
                        ? Math.round(this.firstClickH3D)
                        : cell.height + (this.firstClickH3D - cell.height) * falloff;
                    cell.isCustomHeight = true;
                    modified = true;
                } else if (tool === 'biome') {
                    // REGLE PRIORITAIRE : respecter les règles de hauteur verrouillées
                    const lockedBy = this.generator.isBiomePaintBlocked ? this.generator.isBiomePaintBlocked(cell.height) : null;
                    if (lockedBy && lockedBy !== activeBiome) continue;
                    cell.biome = activeBiome;
                    cell.isCustomBiome = true;
                    modified = true;
                } else if (tool === 'eraser') {
                    let procH = this.generator.fbmTerrain(cell.worldX, cell.worldZ);
                    procH = Math.round(Math.max(this.generator.config.minHeight, Math.min(this.generator.config.maxHeight, procH)));
                    cell.height = procH;
                    cell.biome = this.generator.assignBiomeProcedural(procH, cell.worldX, cell.worldZ);
                    cell.isCustomHeight = false;
                    cell.isCustomBiome = false;
                    modified = true;
                    if (this.generator.removeCustomEdit) this.generator.removeCustomEdit(cell.worldX, cell.worldZ);
                }

                if (tool !== 'eraser' && modified) {
                    if (this.generator.setCustomEdit) this.generator.setCustomEdit(cell.worldX, cell.worldZ, cell.isCustomHeight ? cell.height : null, cell.isCustomBiome ? cell.biome : null);
                }
            }
        }

        if (tool === 'smooth') {
            let tempH = [];
            for (let gx = Math.max(0, centerGx - radius); gx <= Math.min(resX - 1, centerGx + radius); gx++) {
                tempH[gx] = [];
                for (let gz = Math.max(0, centerGz - radius); gz <= Math.min(resZ - 1, centerGz + radius); gz++) {
                    let sum = 0, cnt = 0;
                    for (let nx = -1; nx <= 1; nx++) {
                        for (let nz = -1; nz <= 1; nz++) {
                            let mx = gx + nx, mz = gz + nz;
                            if (mx >= 0 && mx < resX && mz >= 0 && mz < resZ) {
                                sum += grid[mx][mz].height;
                                cnt++;
                            }
                        }
                    }
                    tempH[gx][gz] = sum / cnt;
                }
            }
            for (let gx = Math.max(0, centerGx - radius); gx <= Math.min(resX - 1, centerGx + radius); gx++) {
                for (let gz = Math.max(0, centerGz - radius); gz <= Math.min(resZ - 1, centerGz + radius); gz++) {
                    let dist = Math.sqrt((gx - centerGx) ** 2 + (gz - centerGz) ** 2);
                    if (dist <= radius) {
                        let cell = grid[gx][gz];
                        cell.height = Math.round(tempH[gx][gz]);
                        cell.isCustomHeight = true;
                        modified = true;
                        if (this.generator.setCustomEdit) this.generator.setCustomEdit(cell.worldX, cell.worldZ, cell.height, cell.isCustomBiome ? cell.biome : null);
                    }
                }
            }
        }

        if (modified) {
            // FIX v3.0 : le pinceau 3D invalide le cache des chunks 1:1 (comme
            // le pinceau 2D), sinon la surcouche se rechargeait depuis le cache périmé.
            const metaW = this.generator.currentGridMeta;
            if (metaW && this.generator.invalidateDetailChunksInRegion &&
                this.generator._detailChunks && this.generator._detailChunks.size) {
                const wx0 = metaW.startWorldX + (centerGx - radius) * metaW.stepX;
                const wx1 = metaW.startWorldX + (centerGx + radius + 1) * metaW.stepX;
                const wz0 = metaW.startWorldZ + (centerGz - radius) * metaW.stepZ;
                const wz1 = metaW.startWorldZ + (centerGz + radius + 1) * metaW.stepZ;
                this.generator.invalidateDetailChunksInRegion(wx0 - 2, wx1 + 2, wz0 - 2, wz1 + 2);
                if (this.clearDetailOverlayInRegion) this.clearDetailOverlayInRegion(wx0 - 2, wx1 + 2, wz0 - 2, wz1 + 2);
            }
            if (!this._lastPaint3DTime || Date.now() - this._lastPaint3DTime > 45) {
                this._lastPaint3DTime = Date.now();
                // v3.6 : chemin chunkisé (rebuild des seuls chunks touchés,
                // smooth ET voxel — plus de fallback « rebuild complet »).
                // +1 : l'outil smooth lit les voisins immédiats de la zone.
                this.updateTerrainRegion(centerGx - radius - 1, centerGx + radius + 1,
                                         centerGz - radius - 1, centerGz + radius + 1);
                if (window.map2dInstance) {
                    if (typeof window.map2dInstance.requestRender === 'function') window.map2dInstance.requestRender();
                    else window.map2dInstance.render();
                }
            }
        }
    }

    /**
     * Gère le redimensionnement du conteneur parent (≈ renderer.setSize + camera.aspect)
     */
    resize() {
        if (!this.container || !this.engine || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        if (width === 0 || height === 0) return;

        this.engine.resize(); // Babylon recalcule taille du buffer + ratio caméra
        this._needsRender = true;
    }

    /**
     * Réinitialise la caméra 3D vers une vue isométrique globale
     */
    resetCamera() {
        if (!this.camera) return;
        const extent = this.generator.config.gridResolution * 2.5;
        this.camera.setTarget(new BABYLON.Vector3(0, this.generator.config.baseY || 80, 0));
        // ArcRotateCamera.setPosition : recalcule alpha/beta/radius depuis la position voulue
        this.camera.setPosition(new BABYLON.Vector3(0, extent * 0.95, extent * 1.1));
        this._needsRender = true;
    }

    /* ============================================================
       COULEURS (v3.6 : zéro allocation au hot-path)
       _biomeRGB : cache hex -> {r,g,b} ; getCellColor écrit dans `out`.
       Avant : 2 à 4 « new BABYLON.Color3 » PAR SOMMET à chaque rebuild
       (65 536 sommets → ~200 000 objets temporaires -> pics de GC).
       ============================================================ */
    _biomeRGB(hex) {
        let c = this._biomeRGBCache.get(hex);
        if (c) return c;
        let r = 0x4a / 255, g = 0xde / 255, b = 0x80 / 255; // '#4ade80' par défaut
        if (typeof hex === 'string' && hex.length === 7 && hex.charCodeAt(0) === 35) {
            const n = parseInt(hex.slice(1), 16);
            if (!isNaN(n)) {
                r = ((n >> 16) & 255) / 255;
                g = ((n >> 8) & 255) / 255;
                b = (n & 255) / 255;
            }
        }
        c = { r: r, g: g, b: b };
        this._biomeRGBCache.set(hex, c);
        return c;
    }

    /**
     * Couleur du biome d'une cellule (avec ombrage selon la hauteur), écrite
     * dans `out` {r,g,b} (ou dans un nouvel objet si non fourni — compat API).
     * GRADIENT DE BIOMES : si grid/gx/gz sont fournis et qu'un voisin (rayon 2)
     * a un biome différent, les couleurs sont mélangées (moyenne pondérée par
     * la distance) — transition progressive identique à la carte 2D.
     */
    getCellColor(cell, grid, gx, gz, out) {
        out = out || { r: 0, g: 0, b: 0 };
        const biomeObj = (this.generator && this.generator.biomes && this.generator.biomes[cell.biome]) || null;
        const base = this._biomeRGB(biomeObj ? biomeObj.color : '#4ade80');
        out.r = base.r; out.g = base.g; out.b = base.b;

        if (grid && gx !== undefined && gz !== undefined) {
            const resX = grid.length, resZ = grid[0] ? grid[0].length : 0;
            let hasDiff = false;
            for (let dx = -1; dx <= 1 && !hasDiff; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const nx = gx + dx, nz = gz + dz;
                    if (nx < 0 || nx >= resX || nz < 0 || nz >= resZ) continue;
                    if (grid[nx][nz].biome !== cell.biome) { hasDiff = true; break; }
                }
            }
            if (hasDiff) {
                const R = 2;
                let r = 0, g = 0, b = 0, wSum = 0;
                for (let dx = -R; dx <= R; dx++) {
                    for (let dz = -R; dz <= R; dz++) {
                        const nx = gx + dx, nz = gz + dz;
                        if (nx < 0 || nx >= resX || nz < 0 || nz >= resZ) continue;
                        const d = Math.sqrt(dx * dx + dz * dz);
                        if (d > R) continue;
                        const w = 1 / (1 + d * d);
                        const nc = this._biomeRGB((this.generator.biomes[grid[nx][nz].biome] || {}).color || '#4ade80');
                        r += nc.r * w; g += nc.g * w; b += nc.b * w; wSum += w;
                    }
                }
                out.r = r / wSum; out.g = g / wSum; out.b = b / wSum;
            }
        }

        const maxH = Math.max(1, (this.generator && this.generator.config && this.generator.config.maxHeight) || 400);
        const shade = 0.72 + 0.28 * Math.min(1, Math.max(0, cell.height / maxH));
        out.r *= shade; out.g *= shade; out.b *= shade;
        // MASQUE DE FORME : les cellules hors-forme ne sont pas dessinées
        if (this.generator && this.generator.shapeMask && !this.generator.isInShape(gx, gz)) {
            out.r = -1; out.g = -1; out.b = -1; // signal "skip"
        }
        return out;
    }

    /* ============================================================
       TERRAIN CHUNKISÉ (v3.6)
       Le terrain de base est découpé en chunks de _chunkCells² cellules,
       chacun = 1 mesh Babylon avec sa propre bounding box :
       - frustum culling par chunk (automatique)
       - picking précis accéléré par les bbox
       - updateTerrainRegion = rebuild des seuls chunks intersectés
       Ratio connu (surcoût mémoire négligeable) : les sommets de bordure
       sont dupliqués entre chunks voisins en mode lisse (quads, eux, ne
       sont JAMAIS dupliqués -> aucune surface n'est dessinée deux fois,
       donc aucun z-fighting introduit).
       ============================================================ */

    _getTerrainMaterial() {
        if (!this._terrainMaterial) {
            const material = new BABYLON.StandardMaterial('terrainMat', this.scene);
            material.specularColor = new BABYLON.Color3(0.03, 0.03, 0.03); // ≈ roughness 0.8 (quasi mat)
            material.specularPower = 64;
            // v3.6 : matériau jamais modifié après création -> figé (Babylon saute
            // toutes les vérifications de dirty-check par frame et par mesh).
            material.freeze();
            this._terrainMaterial = material;
        }
        return this._terrainMaterial;
    }

    /**
     * Géométrie LISSE d'un chunk : sous-grille de sommets partagés.
     * entry.x0..x1 / z0..z1 = plage de SOMMETS (incluse) ; les quads couverts
     * sont [x0..x1-1] × [z0..z1-1] et partitionnent exactement la carte.
     * Les NORMALES sont calculées avec un « anneau fantôme » d'1 cellule tout
     * autour (mêmes contributions de faces que sur le mesh global) -> aucune
     * couture d'éclairage aux frontières de chunks.
     */
    _buildSmoothChunkGeometry(entry, grid, resX, resZ, scale, halfSizeX, halfSizeZ) {
        const x0 = entry.x0, x1 = entry.x1, z0 = entry.z0, z1 = entry.z1;
        const nx = x1 - x0 + 1, nz = z1 - z0 + 1;
        const positions = new Float32Array(nx * nz * 3);
        const colors = new Float32Array(nx * nz * 3);
        // (resX-1)² quads au global ; ici ceux du chunk
        const indices = new Uint32Array((x1 - x0) * (z1 - z0) * 6);
        const col = this._colScratch;

        for (let vx = x0; vx <= x1; vx++) {
            const row = grid[vx];
            const lx = vx - x0;
            for (let vz = z0; vz <= z1; vz++) {
                const cell = row[vz];
                const i = (lx * nz + (vz - z0)) * 3;
                positions[i] = vx * scale - halfSizeX;
                positions[i + 1] = cell.height;
                positions[i + 2] = vz * scale - halfSizeZ;
                this.getCellColor(cell, grid, vx, vz, col);
                if (col.r < 0) { positions[i+1] = -99999; } // hors forme → sous le sol
                colors[i] = Math.max(0, col.r); colors[i + 1] = Math.max(0, col.g); colors[i + 2] = Math.max(0, col.b);
            }
        }

        let ii = 0;
        for (let qx = x0; qx < x1; qx++) {
            for (let qz = z0; qz < z1; qz++) {
                const a = (qx - x0) * nz + (qz - z0);
                const b = (qx + 1 - x0) * nz + (qz - z0);
                const c = (qx + 1 - x0) * nz + (qz + 1 - z0);
                const d = (qx - x0) * nz + (qz + 1 - z0);
                // FIX v3.5.2 : winding natif Babylon (CW)
                indices[ii++] = a; indices[ii++] = b; indices[ii++] = d;
                indices[ii++] = b; indices[ii++] = c; indices[ii++] = d;
            }
        }

        // ---- Normales AVEC anneau fantôme (bordures identiques au mesh global) ----
        const ex0 = Math.max(0, x0 - 1), ex1 = Math.min(resX - 1, x1 + 1);
        const ez0 = Math.max(0, z0 - 1), ez1 = Math.min(resZ - 1, z1 + 1);
        const enx = ex1 - ex0 + 1, enz = ez1 - ez0 + 1;
        const extPos = new Float32Array(enx * enz * 3);
        for (let vx = ex0; vx <= ex1; vx++) {
            const row = grid[vx];
            const lx = vx - ex0;
            for (let vz = ez0; vz <= ez1; vz++) {
                const i = (lx * enz + (vz - ez0)) * 3;
                extPos[i] = vx * scale - halfSizeX;
                extPos[i + 1] = row[vz].height;
                extPos[i + 2] = vz * scale - halfSizeZ;
            }
        }
        // quads fantômes : tous ceux ayant ≥1 sommet dans le chunk = [ex0..ex1-1]×[ez0..ez1-1]
        const extIdx = new Uint32Array((ex1 - ex0) * (ez1 - ez0) * 6);
        let ei = 0;
        for (let qx = ex0; qx < ex1; qx++) {
            for (let qz = ez0; qz < ez1; qz++) {
                const a = (qx - ex0) * enz + (qz - ez0);
                const b = (qx + 1 - ex0) * enz + (qz - ez0);
                const c = (qx + 1 - ex0) * enz + (qz + 1 - ez0);
                const d = (qx - ex0) * enz + (qz + 1 - ez0);
                extIdx[ei++] = a; extIdx[ei++] = b; extIdx[ei++] = d;
                extIdx[ei++] = b; extIdx[ei++] = c; extIdx[ei++] = d;
            }
        }
        const extN = this._computeVertexNormals(extPos, extIdx, null);
        // copie des normales des VRAIS sommets depuis la grille étendue
        const normals = new Float32Array(nx * nz * 3);
        for (let vx = x0; vx <= x1; vx++) {
            for (let vz = z0; vz <= z1; vz++) {
                const dst = ((vx - x0) * nz + (vz - z0)) * 3;
                const src = ((vx - ex0) * enz + (vz - ez0)) * 3;
                normals[dst] = extN[src]; normals[dst + 1] = extN[src + 1]; normals[dst + 2] = extN[src + 2];
            }
        }

        return { positions, colors, indices, normals };
    }

    /**
     * Géométrie VOXEL d'un chunk : dessus plat par cellule + jupes verticales
     * vers les voisins plus bas (lues dans la grille GLOBALE -> aucune jupe
     * manquante aux frontières de chunks, aucune face interne inutile émise).
     *
     * v3.6 PERF — ce builder a été mesuré comme le point chaud du pinceau voxel :
     *  1) DEUX PASSES : la 1re compte exactement les quads -> Float32Array
     *     dimensionnés pile (avant : ~500 000 push() + conversions par rebuild) ;
     *  2) NORMALES ANALYTIQUES écrites à l'émission (plateau = +Y, jupes =
     *     ±X/±Z, vérifié par le calcul du produit vectoriel miroir) : on saute
     *     complètement l'accumulation _computeVertexNormals sur ~30k sommets ;
     *  3) indices DÉTERMINISTES (chaque quad émet 6 sommets non partagés dans
     *     le même ordre) remplis en O(n) sans lecture de géométrie.
     * Le résultat binaire est strictement identique à l'ancien chemin.
     */
    _buildVoxelChunkGeometry(entry, grid, resX, resZ, scale, halfSizeX, halfSizeZ) {
        const col = this._colScratch, side = this._sideScratch;

        // ---- PASSE 1 : comptage exact (mêmes conditions qu'à l'émission) ----
        let quadCount = 0;
        for (let gx = entry.x0; gx < entry.x1; gx++) {
            const row = grid[gx];
            for (let gz = entry.z0; gz < entry.z1; gz++) {
                const h = row[gz].height;
                quadCount++; // dessus
                if (gx + 1 < resX && grid[gx + 1][gz].height < h) quadCount++;
                if (gx - 1 >= 0 && grid[gx - 1][gz].height < h) quadCount++;
                if (gz + 1 < resZ && grid[gx][gz + 1].height < h) quadCount++;
                if (gz - 1 >= 0 && grid[gx][gz - 1].height < h) quadCount++;
            }
        }
        const positions = new Float32Array(quadCount * 18);
        const colors = new Float32Array(quadCount * 18);
        const normals = new Float32Array(quadCount * 18);
        const indices = new Uint32Array(quadCount * 6);
        const cellRanges = new Map(); // 'gx,gz' -> {s, e} (offsets float locaux, pour le sink)

        // Indices déterministes : quad q -> triangles (v0,v2,v1) et (v0,v3,v2)
        // (FIX v3.5.2 : winding natif Babylon), base = 6q.
        for (let q = 0, o = 0; q < quadCount; q++) {
            const base = q * 6;
            indices[o++] = base;     indices[o++] = base + 2; indices[o++] = base + 1;
            indices[o++] = base + 3; indices[o++] = base + 5; indices[o++] = base + 4;
        }

        let p = 0; // curseur float (positions/colors/normales partagent le même layout)
        const emitQuad = (v0, v1, v2, v3, nx, ny, nz, cr, cg, cb) => {
            let o = p;
            positions[o]     = v0[0]; positions[o + 1]  = v0[1]; positions[o + 2]  = v0[2];
            positions[o + 3] = v1[0]; positions[o + 4]  = v1[1]; positions[o + 5]  = v1[2];
            positions[o + 6] = v2[0]; positions[o + 7]  = v2[1]; positions[o + 8]  = v2[2];
            positions[o + 9]  = v0[0]; positions[o + 10] = v0[1]; positions[o + 11] = v0[2];
            positions[o + 12] = v2[0]; positions[o + 13] = v2[1]; positions[o + 14] = v2[2];
            positions[o + 15] = v3[0]; positions[o + 16] = v3[1]; positions[o + 17] = v3[2];
            for (let k = 0; k < 6; k++) {
                const n3 = o + k * 3;
                normals[n3] = nx; normals[n3 + 1] = ny; normals[n3 + 2] = nz;
                colors[n3] = cr; colors[n3 + 1] = cg; colors[n3 + 2] = cb;
            }
            p += 18;
        };

        for (let gx = entry.x0; gx < entry.x1; gx++) {
            const row = grid[gx];
            for (let gz = entry.z0; gz < entry.z1; gz++) {
                const cell = row[gz];
                const _cellStart = p;
                const h = cell.height;
                const x0w = gx * scale - halfSizeX;
                const x1w = x0w + scale;
                const z0w = gz * scale - halfSizeZ;
                const z1w = z0w + scale;
                this.getCellColor(cell, grid, gx, gz, col);
                if (col.r < 0) continue; // hors forme → cellule invisible
                side.r = col.r * 0.78; side.g = col.g * 0.78; side.b = col.b * 0.78;

                // Face du dessus (plateau plat) — normale analytique +Y
                emitQuad([x0w, h, z0w], [x0w, h, z1w], [x1w, h, z1w], [x1w, h, z0w],
                         0, 1, 0, col.r, col.g, col.b);

                // Jupes verticales UNIQUEMENT vers un voisin PLUS BAS
                // (faces cachées entre cellules = jamais générées)
                if (gx + 1 < resX) {
                    const nh = grid[gx + 1][gz].height;
                    if (nh < h) emitQuad([x1w, h, z0w], [x1w, h, z1w], [x1w, nh, z1w], [x1w, nh, z0w],
                                         1, 0, 0, side.r, side.g, side.b); // normale +X (vérifié)
                }
                if (gx - 1 >= 0) {
                    const nh = grid[gx - 1][gz].height;
                    if (nh < h) emitQuad([x0w, h, z1w], [x0w, h, z0w], [x0w, nh, z0w], [x0w, nh, z1w],
                                         -1, 0, 0, side.r, side.g, side.b); // normale -X (vérifié)
                }
                if (gz + 1 < resZ) {
                    const nh = grid[gx][gz + 1].height;
                    if (nh < h) emitQuad([x1w, h, z1w], [x0w, h, z1w], [x0w, nh, z1w], [x1w, nh, z1w],
                                         0, 0, 1, side.r, side.g, side.b); // normale +Z (vérifié)
                }
                if (gz - 1 >= 0) {
                    const nh = grid[gx][gz - 1].height;
                    if (nh < h) emitQuad([x0w, h, z0w], [x1w, h, z0w], [x1w, nh, z0w], [x0w, nh, z0w],
                                         0, 0, -1, side.r, side.g, side.b); // normale -Z (vérifié)
                }
                cellRanges.set(gx + ',' + gz, { s: _cellStart, e: p });
            }
        }

        return { positions, colors, indices, normals, cellRanges };
    }

    /**
     * Calcul des normales par accumulation de faces avec le produit vectoriel
     * MIROIR (adapté au winding natif Babylon depuis le fix v3.5.2).
     * Résultat numérique IDENTIQUE à la version Three pour les mêmes sommets.
     */
    _computeVertexNormals(positions, indices, normals) {
        const n = normals || new Float32Array(positions.length);
        for (let i = 0; i < n.length; i++) n[i] = 0;
        for (let t = 0; t < indices.length; t += 3) {
            const i0 = indices[t] * 3, i1 = indices[t + 1] * 3, i2 = indices[t + 2] * 3;
            const ax = positions[i0], ay = positions[i0 + 1], az = positions[i0 + 2];
            const bx = positions[i1], by = positions[i1 + 1], bz = positions[i1 + 2];
            const cx = positions[i2], cy = positions[i2 + 1], cz = positions[i2 + 2];
            const cbx = cx - bx, cby = cy - by, cbz = cz - bz;
            const abx = ax - bx, aby = ay - by, abz = az - bz;
            const nx = aby * cbz - abz * cby;   // n = ab × cb (miroir du cb × ab de Three)
            const ny = abz * cbx - abx * cbz;
            const nz = abx * cby - aby * cbx;
            n[i0] += nx; n[i0 + 1] += ny; n[i0 + 2] += nz;
            n[i1] += nx; n[i1 + 1] += ny; n[i1 + 2] += nz;
            n[i2] += nx; n[i2 + 1] += ny; n[i2 + 2] += nz;
        }
        for (let i = 0; i < n.length; i += 3) {
            const l = Math.sqrt(n[i] * n[i] + n[i + 1] * n[i + 1] + n[i + 2] * n[i + 2]) || 1;
            n[i] /= l; n[i + 1] /= l; n[i + 2] /= l;
        }
        return n;
    }

    /** Ré-arme la passe d'ombre (render-once) après un changement de géométrie. */
    _requestShadowRefresh() {
        if (!this._shadowGen) return;
        const sm = this._shadowGen.getShadowMap();
        if (sm && typeof sm.resetRefreshCounter === 'function') sm.resetRefreshCounter();
    }

    /** Construit (ou reconstruit) LE mesh d'un chunk à partir de la grille vivante. */
    _buildChunkEntry(entry) {
        const grid = this.generator.grid;
        const meta = this._geomMeta;
        const isVoxel = meta.meshType === 'voxel';

        // 1. Géométrie CPU
        const data = isVoxel
            ? this._buildVoxelChunkGeometry(entry, grid, meta.resX, meta.resZ, meta.scale, meta.halfSizeX, meta.halfSizeZ)
            : this._buildSmoothChunkGeometry(entry, grid, meta.resX, meta.resZ, meta.scale, meta.halfSizeX, meta.halfSizeZ);
        entry.positions = data.positions;
        entry.colors = data.colors;
        entry.indices = data.indices;
        entry.normals = data.normals;

        // 2. Ancien mesh -> poubelle
        this._disposeChunkMeshEntry(entry, true);

        // 3. Mesh Babylon (buffers updatable : le sink voxel réécrit les Y en place)
        const mesh = new BABYLON.Mesh('terrainChunk_' + entry.cx + '_' + entry.cz, this.scene);
        const vd = new BABYLON.VertexData();
        vd.positions = data.positions;
        vd.colors = data.colors;
        vd.indices = data.indices;
        vd.normals = data.normals;
        vd.applyToMesh(mesh, true);
        mesh.material = this._getTerrainMaterial(); // partagé + figé
        mesh.receiveShadows = true;
        mesh.isPickable = true;
        mesh.metadata = { terrainChunk: true };
        mesh.refreshBoundingInfo(true);             // picking précis dès maintenant
        mesh.freezeWorldMatrix();                   // transform identité à tout jamais
        if (this._shadowGen) this._shadowGen.getShadowMap().renderList.push(mesh);
        entry.mesh = mesh;
        entry.built = true;
        this._dbg.chunkBuilds++;

        // 4. Wireframe optionnel (arrays partagées comme avant)
        if (this.showWireframe) {
            const wire = new BABYLON.Mesh('terrainChunkWire_' + entry.cx + '_' + entry.cz, this.scene);
            const wvd = new BABYLON.VertexData();
            wvd.positions = data.positions;
            wvd.indices = data.indices;
            wvd.normals = data.normals;
            wvd.applyToMesh(wire, true);
            if (!this._wireMaterial) {
                const wireMat = new BABYLON.StandardMaterial('terrainWireMat', this.scene);
                wireMat.wireframe = true;
                wireMat.disableLighting = true;
                wireMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
                wireMat.alpha = 0.15;
                wireMat.freeze();
                this._wireMaterial = wireMat;
            }
            wire.material = this._wireMaterial;
            wire.isPickable = false;
            wire.freezeWorldMatrix();
            entry.wire = wire;
        }

        // 5. Sink (voxel) : les buffers neufs ont des hauteurs FRAÎCHES -> les
        // entrées sunk de ce chunk sont périmées, on les purge (re-synchronisé
        // juste après par _syncCoarseSink si la surcouche est toujours active).
        if (this._sunkCells && this._sunkCells.size) {
            const dead = [];
            this._sunkCells.forEach((v, k) => { if (v.cx === entry.cx && v.cz === entry.cz) dead.push(k); });
            for (let i = 0; i < dead.length; i++) this._sunkCells.delete(dead[i]);
        }
        if (entry.sunkFull) { entry.sunkFull = false; mesh.setEnabled(true); }

        // 6. Plages de cellules voxel (sink par cellule) -> fusion dans la Map globale
        if (isVoxel && data.cellRanges) {
            if (entry.rangeKeys) {
                for (let i = 0; i < entry.rangeKeys.length; i++) this._cellRanges.delete(entry.rangeKeys[i]);
            }
            const keys = [];
            data.cellRanges.forEach((range, key) => {
                this._cellRanges.set(key, { entry: entry, s: range.s, e: range.e });
                keys.push(key);
            });
            entry.rangeKeys = keys;
        }

        this._requestShadowRefresh();
        this._needsRender = true;
    }

    /** Détruit le mesh d'un chunk (géométrie comprise) + son wireframe éventuel. */
    _disposeChunkMeshEntry(entry, keepBuffers) {
        if (entry.wire) { entry.wire.dispose(); entry.wire = null; }
        if (entry.mesh) {
            if (this._shadowGen) {
                const rl = this._shadowGen.getShadowMap().renderList;
                const i = rl.indexOf(entry.mesh);
                if (i >= 0) rl.splice(i, 1);
            }
            entry.mesh.dispose(); // dispose aussi la géométrie
            entry.mesh = null;
        }
        if (!keepBuffers) {
            entry.positions = entry.colors = entry.indices = entry.normals = null;
        }
    }

    _disposeTerrainMeshes() {
        this._chunkBuildQueue = [];
        if (this._terrainChunks) {
            for (let i = 0; i < this._terrainChunks.length; i++) {
                this._disposeChunkMeshEntry(this._terrainChunks[i], false);
            }
        }
        this._terrainChunks = [];
        this._chunkIndex = new Map();
        this._cellRanges = new Map();
        this._sunkCells = new Map();
        // la surcouche 1:1 est bâtie au-dessus du terrain -> périmée elle aussi
        this.clearDetailOverlay();
    }

    /**
     * Budget de construction par frame (~7 ms par défaut) : les chunks de la
     * file sont construits progressivement, sans jamais geler l'interface.
     */
    _processChunkBuildQueue(budgetMs) {
        if (!this._chunkBuildQueue || this._chunkBuildQueue.length === 0) return;
        const budget = budgetMs === undefined ? 7 : budgetMs;
        const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        const now = () => ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now());
        let built = 0;
        while (this._chunkBuildQueue.length) {
            const entry = this._chunkBuildQueue[0];
            // obsolète (re-génération entre-temps) ou déjà construit -> on saute
            if (!entry || entry.built || this._chunkIndex.get(entry.cx + ',' + entry.cz) !== entry) {
                this._chunkBuildQueue.shift();
                continue;
            }
            if (built > 0 && now() - t0 >= budget) break;
            this._chunkBuildQueue.shift();
            this._buildChunkEntry(entry);
            built++;
            if (now() - t0 >= 16) break; // garde-fou absolu, même si chaque chunk est lent
        }
        if (this._chunkBuildQueue.length === 0) this._syncCoarseSink();
        this._needsRender = true;
    }

    /** Vide la file immédiatement (tests headless, exports synchrones). */
    _flushChunkBuilds() {
        let guard = 100000;
        while (this._chunkBuildQueue && this._chunkBuildQueue.length && guard-- > 0) {
            this._processChunkBuildQueue(1e12);
        }
    }

    updateTerrain() {
        if (!this.scene || !this.generator.grid || this.generator.grid.length === 0) return;
        // VUE UNIQUE : ne pas reconstruire un mesh invisible (vue 2D affichée).
        // Le rebuild est rattrapé au basculement vers la 3D (voir ui.js switchView).
        if (this.container && this.container.offsetParent === null) {
            this._terrainDirty = true;
            return;
        }
        this._terrainDirty = false;

        // Nettoyage de l'ancien terrain chunkisé
        this._disposeTerrainMeshes();
        if (this.waterMesh) {
            this.waterMesh.material.dispose();
            this.waterMesh.dispose();
            this.waterMesh = null;
        }

        const grid = this.generator.grid;
        const resX = grid.length;
        const resZ = grid[0] ? grid[0].length : 0;
        const scale = 3.5; // Facteur d'échelle pour un bon rendu dans l'espace 3D
        const halfSizeX = (resX * scale) / 2;
        const halfSizeZ = (resZ * scale) / 2;
        const isVoxel = this.generator.config.meshType === 'voxel';

        // Meta de layout : invalide la maj partielle si la grille change
        this._geomMeta = {
            resX: resX, resZ: resZ, scale: scale,
            halfSizeX: halfSizeX, halfSizeZ: halfSizeZ,
            meshType: this.generator.config.meshType
        };

        // ---- Découpage en chunks ----
        // lisse : les chunks partitionnent les QUADS (resX-1) avec sommets de bord
        // partagés (plage inclusive x0..x1) ; voxel : les chunks partitionnent les
        // CELLULES (resX), jupes lues dans la grille globale.
        const CS = this._chunkCells | 0 || 32;
        const spanX = isVoxel ? resX : resX - 1;
        const spanZ = isVoxel ? resZ : resZ - 1;
        const ncx = Math.max(1, Math.ceil(spanX / CS));
        const ncz = Math.max(1, Math.ceil(spanZ / CS));
        const entries = [];
        for (let cx = 0; cx < ncx; cx++) {
            for (let cz = 0; cz < ncz; cz++) {
                const x0 = cx * CS, z0 = cz * CS;
                const x1 = isVoxel ? Math.min((cx + 1) * CS, resX) : Math.min((cx + 1) * CS, resX - 1);
                const z1 = isVoxel ? Math.min((cz + 1) * CS, resZ) : Math.min((cz + 1) * CS, resZ - 1);
                if (x1 <= x0 || z1 <= z0) continue;
                const entry = {
                    cx: cx, cz: cz, x0: x0, x1: x1, z0: z0, z1: z1,
                    mesh: null, wire: null, built: false, sunkFull: false,
                    positions: null, colors: null, indices: null, normals: null
                };
                entries.push(entry);
                this._chunkIndex.set(cx + ',' + cz, entry);
            }
        }
        this._terrainChunks = entries;

        // PRIORITÉ AU POINT REGARDÉ : construction triée par distance chunk -> cible
        // caméra (« charger autour du regard/du curseur »). La file est ensuite
        // consommée par budget de ~7 ms/frame dans animate().
        {
            const cam = this.camera;
            const tx = cam ? cam.target.x : 0, tz = cam ? cam.target.z : 0;
            for (let i = 0; i < entries.length; i++) {
                const e = entries[i];
                const wx = ((e.x0 + e.x1) / 2) * scale - halfSizeX;
                const wz = ((e.z0 + e.z1) / 2) * scale - halfSizeZ;
                e._prio = (wx - tx) * (wx - tx) + (wz - tz) * (wz - tz);
            }
            entries.sort((a, b) => a._prio - b._prio);
        }
        this._chunkBuildQueue = entries.slice();
        // Burst synchrone initial (~8 ms) : le centre de l'écran apparaît
        // immédiatement, la périphérie suit en quelques frames.
        this._processChunkBuildQueue(8);

        // Plan d'eau (CreateGround, déjà à plat en XZ)
        if (this.generator.config.showWater) {
            const waterGeom = BABYLON.MeshBuilder.CreateGround('water', {
                width: resX * scale,
                height: resZ * scale,
                subdivisions: 1,
                updatable: false
            }, this.scene);
            const waterMat = new BABYLON.StandardMaterial('waterMat', this.scene);
            waterMat.diffuseColor = BABYLON.Color3.FromHexString('#0ea5e9');
            waterMat.specularColor = new BABYLON.Color3(0.25, 0.25, 0.25); // reflets légers
            waterMat.alpha = 0.65; // ≈ transparent+opacity (blending auto quand alpha < 1)
            // Plan natif Babylon : double-face par sécurité (coût nul, 2 triangles).
            waterMat.backFaceCulling = false;
            waterMat.freeze(); // jamais modifié ensuite
            waterGeom.material = waterMat;
            // +0.35 : évite le z-fighting avec le terrain qui affleure exactement
            // au niveau de la mer
            waterGeom.position.y = this.generator.config.seaLevel + 0.35;
            waterGeom.receiveShadows = true;
            waterGeom.isPickable = false; // le picking du pinceau ne vise que le terrain
            waterGeom.freezeWorldMatrix(); // plan statique
            this.waterMesh = waterGeom;
        }

        this._needsRender = true;
    }

    /**
     * Mise à jour PARTIELLE du terrain 3D (coups de pinceau localisés).
     * v3.6 : reconstruit UNIQUEMENT les chunks intersectant la zone élargie,
     * en SMOOTH comme en VOXEL (avant : updateVerticesData global en smooth,
     * rebuild COMPLET de la carte en voxel à chaque coup de pinceau).
     * Zone élargie de +2 cellules (mélange de couleurs de biomes) — identique à avant.
     */
    updateTerrainRegion(gxMin, gxMax, gzMin, gzMax) {
        // VUE UNIQUE : section 3D cachée -> on note juste que le mesh est périmé
        if (this.container && this.container.offsetParent === null) {
            this._terrainDirty = true;
            return;
        }
        const grid = this.generator && this.generator.grid;
        const meta = this._geomMeta;
        // Garde-fous : pas de terrain, meta absent/obsolète, grille redimensionnée
        // ou type de mesh changé -> rebuild complet classique.
        if (!grid || !grid.length || !meta || !this._terrainChunks.length ||
            meta.meshType !== this.generator.config.meshType ||
            grid.length !== meta.resX || (grid[0] ? grid[0].length : 0) !== meta.resZ) {
            this.updateTerrain();
            return;
        }

        // Marge de 2 cellules pour le mélange de couleurs aux frontières de biomes
        const M = 2;
        const x0 = Math.max(0, Math.floor(gxMin) - M);
        const x1 = Math.min(meta.resX - 1, Math.ceil(gxMax) + M);
        const z0 = Math.max(0, Math.floor(gzMin) - M);
        const z1 = Math.min(meta.resZ - 1, Math.ceil(gzMax) + M);
        if (x0 > x1 || z0 > z1) return;

        const isVoxel = meta.meshType === 'voxel';
        let touched = 0;
        for (let i = 0; i < this._terrainChunks.length; i++) {
            const entry = this._terrainChunks[i];
            // voxel : plage de cellules [x0,x1) ; lisse : plage de sommets [x0..x1]
            const hit = isVoxel
                ? (x0 < entry.x1 && x1 >= entry.x0 && z0 < entry.z1 && z1 >= entry.z0)
                : (x1 >= entry.x0 && x0 <= entry.x1 && z1 >= entry.z0 && z0 <= entry.z1);
            if (!hit) continue;
            touched++;
            // chunk encore en file de construction ? _buildChunkEntry le marque
            // 'built', la file le sautera (processeur protégé contre les obsolètes).
            this._buildChunkEntry(entry);
        }
        if (!touched) return;

        // Invalide la surcouche de détail 3D sur la zone peinte (coords monde)
        {
            const gMeta = this.generator.currentGridMeta;
            if (gMeta) {
                const wx0 = gMeta.startWorldX + x0 * gMeta.stepX;
                const wx1 = gMeta.startWorldX + (x1 + 1) * gMeta.stepX;
                const wz0 = gMeta.startWorldZ + z0 * gMeta.stepZ;
                const wz1 = gMeta.startWorldZ + (z1 + 1) * gMeta.stepZ;
                this.clearDetailOverlayInRegion(wx0 - 2, wx1 + 2, wz0 - 2, wz1 + 2);
            }
        }
        // Sink voxel : réappliqué depuis l'état courant (buffers fraîchement reconstruits)
        if (isVoxel) this._syncCoarseSink();
        this._needsRender = true;
    }


    /* ============================================================
       SURCOUCHE DE DÉTAIL 3D (grands mondes, ex. 4000x4000)
       Quand la caméra est proche, des chunks 16x16 blocs à la vraie
       résolution 1:1 (mêmes données que la 2D et l'export, via
       generator.getDetailChunk) sont affichés PAR-DESSUS le mesh
       grossier, UNIQUEMENT dans le rayon visible autour du point
       regardé. Un mesh par chunk -> le frustum culling de Babylon
       ignore automatiquement ce qui sort de l'écran, et rien n'est
       calculé hors du rayon visible. Cache LRU + budget par tick.
       ============================================================ */
    _maybeUpdateDetailOverlay() {
        const now = Date.now();
        if (this._lastDetailCheck && now - this._lastDetailCheck < 120) return;
        this._lastDetailCheck = now;

        const gen = this.generator;
        if (!gen || !gen.needsDetailChunks || !gen.needsDetailChunks() ||
            !this._hasTerrain() || !this.camera || !this._geomMeta ||
            (this._chunkBuildQueue && this._chunkBuildQueue.length > 0)) {
            if (this.detailGroup) this.detailGroup.setEnabled(false);
            this._restoreAllSunk();
            return;
        }
        const meta = gen.currentGridMeta;
        if (!meta) return;
        const scale = this._geomMeta.scale || 3.5;
        const halfSizeX = this._geomMeta.halfSizeX, halfSizeZ = this._geomMeta.halfSizeZ;

        // Rayon visible approx. en blocs : distance caméra -> cible, ouverture fov
        // (ArcRotateCamera.radius = distance caméra/cible exacte ; fov déjà en radians)
        const dist = this.camera.radius || this.camera.position.subtract(this.camera.target).length();
        const fov = this.camera.fov || (60 * Math.PI / 180);
        const radiusScene = Math.tan(fov / 2) * dist * 1.7;
        const blocksPerUnit = meta.stepX / scale;
        const radiusBlocks = radiusScene * blocksPerUnit;

        // Deux seuils distincts :
        // - OFF_RADIUS : au-delà, le détail 1:1 serait imperceptible (~<2px/bloc)
        //   -> surcouche masquée, zéro calcul
        // - MAX_RADIUS : rayon de CHARGEMENT clampé (les grands mondes couvrent
        //   vite des centaines de blocs, on détaille en priorité autour de la cible)
        const OFF_RADIUS_BLOCKS = 700;
        const MAX_RADIUS_BLOCKS = 260;
        if (!this.detailGroup) {
            this.detailGroup = new BABYLON.TransformNode('detailGroup', this.scene); // ≈ THREE.Group
            this._detailMeshes = new Map();
            this._detailMeshOrder = [];
        }
        if (radiusBlocks > OFF_RADIUS_BLOCKS) {
            if (this.detailGroup.isEnabled()) { this.detailGroup.setEnabled(false); this._needsRender = true; }
            this._restoreAllSunk();
            return;
        }
        this.detailGroup.setEnabled(true);

        // POINT REGARDÉ (pick) : le rayon central de la caméra est intersecté
        // avec le terrain ; c'est LE point que le joueur regarde. Fallback : la
        // cible caméra si le rayon sort du terrain.
        let lookX, lookZ;
        if (this.canvas) {
            const rect = this.canvas.getBoundingClientRect();
            const pick = this._pickTerrain(rect.width / 2, rect.height / 2);
            if (pick) { lookX = pick.pickedPoint.x; lookZ = pick.pickedPoint.z; }
        }
        if (lookX === undefined) { lookX = this.camera.target.x; lookZ = this.camera.target.z; }
        const wcx = (lookX + halfSizeX) / scale * meta.stepX + meta.startWorldX;
        const wcz = (lookZ + halfSizeZ) / scale * meta.stepZ + meta.startWorldZ;

        const S = gen.detailChunkSize();
        const r = Math.min(radiusBlocks, MAX_RADIUS_BLOCKS);
        const rc = Math.max(1, Math.ceil(r / S)); // rayon en chunks
        const ccx = Math.floor(wcx / S), ccz = Math.floor(wcz / S);

        // PARCOURS EN SPIRALE : le chunk regardé d'abord, puis anneaux concentriques
        // (droite, bas, gauche, haut) -> le détail apparaît là où le joueur regarde
        // et s'étend autour, au lieu d'un balayage ligne par ligne.
        let budget = 32;
        const tryChunk = (cx, cz) => {
            if (budget <= 0) return;
            const key = cx + ',' + cz;
            if (this._detailMeshes.has(key)) return;
            const mesh = this._buildDetailChunkMesh(cx, cz, meta, scale, halfSizeX, halfSizeZ);
            if (!mesh) { this._detailMeshes.set(key, null); this._detailMeshOrder.push(key); return; }
            mesh.parent = this.detailGroup;
            this._detailMeshes.set(key, mesh);
            this._detailMeshOrder.push(key);
            budget--;
            this._needsRender = true;
        };
        tryChunk(ccx, ccz); // centre = point regardé
        for (let ring = 1; ring <= rc && budget > 0; ring++) {
            // bord haut et bas de l'anneau
            for (let dx = -ring; dx <= ring && budget > 0; dx++) {
                tryChunk(ccx + dx, ccz - ring);
                tryChunk(ccx + dx, ccz + ring);
            }
            // bords gauche/droite (sans les coins déjà faits)
            for (let dz = -ring + 1; dz <= ring - 1 && budget > 0; dz++) {
                tryChunk(ccx - ring, ccz + dz);
                tryChunk(ccx + ring, ccz + dz);
            }
        }
        // LRU "spatial" : on n'évince JAMAIS un chunk encore dans le rayon
        // visible (sinon les chunks à l'écran se chassent mutuellement et des
        // gros carrés grossiers ne se remplissent jamais). Le cap s'adapte au
        // rayon courant, et l'éviction ne touche que les chunks hors-zone.
        const cap = Math.max(600, (2 * rc + 3) * (2 * rc + 3));
        if (this._detailMeshOrder.length > cap) {
            let toEvict = this._detailMeshOrder.length - cap;
            const keep = [];
            for (const key of this._detailMeshOrder) {
                const parts = key.split(',');
                const kx = parseInt(parts[0], 10), kz = parseInt(parts[1], 10);
                const inView = Math.max(Math.abs(kx - ccx), Math.abs(kz - ccz)) <= rc + 1;
                if (!inView && toEvict > 0) {
                    toEvict--;
                    const m = this._detailMeshes.get(key);
                    this._detailMeshes.delete(key);
                    if (m) m.dispose(); // dispose mesh + géométrie (matériau partagé conservé)
                } else {
                    keep.push(key);
                }
            }
            this._detailMeshOrder = keep;
        }

        // Enfonce (ou désactive) le terrain grossier sous les chunks 1:1 chargés
        this._syncCoarseSink();
    }

    _buildDetailChunkMesh(cx, cz, meta, scale, halfSizeX, halfSizeZ) {
        const gen = this.generator;
        const chunk = gen.getDetailChunk(cx, cz);
        if (!chunk) return null;
        const S = gen.detailChunkSize();
        const chunkXp = gen.getDetailChunk(cx + 1, cz);
        const chunkZp = gen.getDetailChunk(cx, cz + 1);
        const chunkXZp = gen.getDetailChunk(cx + 1, cz + 1);
        // Voisins OUEST/NORD : nécessaires pour ne PAS dessiner de murs de jupe
        // aux frontières internes de chunks (traits noirs vus en parallèle X/Z)
        const chunkXm = gen.getDetailChunk(cx - 1, cz);
        const chunkZm = gen.getDetailChunk(cx, cz - 1);
        const hAt = (lx, lz) => {
            if (lx < S && lz < S) return chunk.heights[lz * S + lx];
            if (lx >= S && lz < S) return chunkXp ? chunkXp.heights[lz * S + (lx - S)] : chunk.heights[lz * S + (S - 1)];
            if (lx < S && lz >= S) return chunkZp ? chunkZp.heights[(lz - S) * S + lx] : chunk.heights[(S - 1) * S + lx];
            return chunkXZp ? chunkXZp.heights[(lz - S) * S + (lx - S)] : chunk.heights[S * S - 1];
        };
        const bAt = (lx, lz) => {
            const cxx = Math.min(S - 1, lx), czz = Math.min(S - 1, lz);
            return chunk.biomes[czz * S + cxx];
        };
        // Le chunk 1:1 est rendu SOLIDE et OPAQUE au-dessus du mesh grossier
        // (même style que le meshType courant, +LIFT, jupe périphérique).
        // La scène compresse X/Z (1 bloc = scale/stepX unités) mais pas Y :
        // projection du relief à l'échelle CUBIQUE, ancrée sur la surface
        // grossière (bilinéaire, continue entre chunks).
        const LIFT = 0.25;
        const isVoxel = this.generator.config.meshType === 'voxel';
        const maxH = Math.max(1, this.generator.config.maxHeight || 400);
        const pxOf = (wx) => (wx - meta.startWorldX) / meta.stepX * scale - halfSizeX;
        const pzOf = (wz) => (wz - meta.startWorldZ) / meta.stepZ * scale - halfSizeZ;
        const sBlock = scale / meta.stepX; // taille scène d'UN bloc (horizontale = verticale voulue)
        const grid = this.generator.grid;
        const baseAt = (wx, wz) => {
            // hauteur de la surface grossière (bilinéaire)
            const fx = (wx - meta.startWorldX) / meta.stepX - 0.5;
            const fz = (wz - meta.startWorldZ) / meta.stepZ - 0.5;
            const x0i = Math.max(0, Math.min(meta.resX - 1, Math.floor(fx)));
            const z0i = Math.max(0, Math.min(meta.resZ - 1, Math.floor(fz)));
            const x1i = Math.min(meta.resX - 1, x0i + 1);
            const z1i = Math.min(meta.resZ - 1, z0i + 1);
            const tx = Math.max(0, Math.min(1, fx - x0i));
            const tz = Math.max(0, Math.min(1, fz - z0i));
            return grid[x0i][z0i].height * (1 - tx) * (1 - tz) + grid[x1i][z0i].height * tx * (1 - tz) +
                   grid[x0i][z1i].height * (1 - tx) * tz + grid[x1i][z1i].height * tx * tz;
        };
        const yScene = (h, wx, wz) => {
            const b = baseAt(wx, wz);
            return b + (h - b) * sBlock + LIFT;
        };
        // v3.6 : couleurs sans allocation (cache _biomeRGB + scratchs)
        const colS = { r: 0, g: 0, b: 0 }, sideS = { r: 0, g: 0, b: 0 };
        const colorInto = (lx, lz, out) => {
            const base = this._biomeRGB((gen.biomes[bAt(lx, lz)] || {}).color || '#4ade80');
            const shade = 0.72 + 0.28 * Math.min(1, Math.max(0, hAt(lx, lz) / maxH));
            out.r = base.r * shade; out.g = base.g * shade; out.b = base.b * shade;
            return out;
        };

        const positions = [];
        const colors = [];
        const indices = [];
        const pushTri = (ax, ay, az, bx, by, bz, cx2, cy2, cz2, c) => {
            const base = positions.length / 3;
            positions.push(ax, ay, az, bx, by, bz, cx2, cy2, cz2);
            // FIX v3.5.2 : winding natif Babylon (faces cullées sinon)
            indices.push(base, base + 2, base + 1);
            for (let k = 0; k < 3; k++) colors.push(c.r, c.g, c.b);
        };
        const pushQuad = (v0, v1, v2, v3, c) => {
            pushTri(v0[0], v0[1], v0[2], v1[0], v1[1], v1[2], v2[0], v2[1], v2[2], c);
            pushTri(v0[0], v0[1], v0[2], v2[0], v2[1], v2[2], v3[0], v3[1], v3[2], c);
        };

        if (isVoxel) {
            // Style voxel 1:1 : un plateau par BLOC + jupes vers les voisins,
            // hauteurs re-projetées à l'échelle cubique (yScene)
            const stepPx = scale / meta.stepX, stepPz = scale / meta.stepZ;
            // Les hauteurs des chunks sont FLOTTANTES ; le style voxel arrondit
            // localement pour garder de vrais cubes 1:1 alignés, comme l'export.
            const hVox = (lx, lz) => Math.round(hAt(lx, lz));
            for (let lz = 0; lz < S; lz++) {
                for (let lx = 0; lx < S; lx++) {
                    const wx = chunk.x0 + lx, wz = chunk.z0 + lz;
                    const wcx = wx + 0.5, wcz = wz + 0.5;
                    const h = yScene(hVox(lx, lz), wcx, wcz);
                    const x0 = pxOf(wx), x1 = x0 + stepPx;
                    const z0 = pzOf(wz), z1 = z0 + stepPz;
                    const c = colorInto(lx, lz, colS);
                    pushQuad([x0, h, z0], [x0, h, z1], [x1, h, z1], [x1, h, z0], c);
                    const sideC = { r: c.r * 0.78, g: c.g * 0.78, b: c.b * 0.78 };
                    // jupes : hauteurs voisines projetées avec la MEME colonne de base
                    // (continuité assurée par baseAt bilinéaire). La jupe descend
                    // JUSQU'AU voisin réel ; "bottom" ne sert qu'en bord de monde.
                    const bottom = h - Math.max(2.5 * sBlock, LIFT + 2);
                    const nE = lx + 1 <= S ? yScene(hVox(lx + 1, lz), wcx + 1, wcz) : bottom;
                    if (nE < h) pushQuad([x1, h, z0], [x1, h, z1], [x1, nE, z1], [x1, nE, z0], sideC);
                    // OUEST : hauteur réelle du chunk voisin (plus de mur artificiel)
                    const hW = lx - 1 >= 0 ? hVox(lx - 1, lz) : (chunkXm ? Math.round(chunkXm.heights[lz * S + (S - 1)]) : null);
                    const nW = hW === null ? bottom : yScene(hW, wcx - 1, wcz);
                    if (nW < h) pushQuad([x0, h, z1], [x0, h, z0], [x0, nW, z0], [x0, nW, z1], sideC);
                    const nS2 = lz + 1 <= S ? yScene(hVox(lx, lz + 1), wcx, wcz + 1) : bottom;
                    if (nS2 < h) pushQuad([x1, h, z1], [x0, h, z1], [x0, nS2, z1], [x1, nS2, z1], sideC);
                    // NORD : idem
                    const hN = lz - 1 >= 0 ? hVox(lx, lz - 1) : (chunkZm ? Math.round(chunkZm.heights[(S - 1) * S + lx]) : null);
                    const nN = hN === null ? bottom : yScene(hN, wcx, wcz - 1);
                    if (nN < h) pushQuad([x0, h, z0], [x1, h, z0], [x1, nN, z0], [x0, nN, z0], sideC);
                }
            }
        } else {
            // Style lisse 1:1 : grille de quads sur sommets 17x17 (échelle cubique)
            const yV = (lx, lz) => yScene(hAt(lx, lz), chunk.x0 + lx, chunk.z0 + lz);
            for (let lz = 0; lz < S; lz++) {
                for (let lx = 0; lx < S; lx++) {
                    const wx = chunk.x0 + lx, wz = chunk.z0 + lz;
                    const c = colorInto(lx, lz, colS);
                    pushQuad(
                        [pxOf(wx), yV(lx, lz), pzOf(wz)],
                        [pxOf(wx), yV(lx, lz + 1), pzOf(wz + 1)],
                        [pxOf(wx + 1), yV(lx + 1, lz + 1), pzOf(wz + 1)],
                        [pxOf(wx + 1), yV(lx + 1, lz), pzOf(wz)], c);
                }
            }
            // Jupe périphérique UNIQUEMENT en bord de monde : entre chunks
            // adjacents, les sommets de bord sont identiques (cache partagé +
            // base bilinéaire continue), donc aucune jupe n'est nécessaire.
            const drop = 4 + LIFT;
            if (!chunkZm) for (let lx = 0; lx < S; lx++) {
                const wx = chunk.x0 + lx;
                const cN = colorInto(lx, 0, colS);
                sideS.r = cN.r * 0.75; sideS.g = cN.g * 0.75; sideS.b = cN.b * 0.75;
                pushQuad([pxOf(wx), yV(lx, 0), pzOf(chunk.z0)], [pxOf(wx + 1), yV(lx + 1, 0), pzOf(chunk.z0)],
                         [pxOf(wx + 1), yV(lx + 1, 0) - drop, pzOf(chunk.z0)], [pxOf(wx), yV(lx, 0) - drop, pzOf(chunk.z0)], sideS);
            }
            if (!chunkZp) for (let lx = 0; lx < S; lx++) {
                const wx = chunk.x0 + lx;
                const cS = colorInto(lx, S - 1, colS);
                sideS.r = cS.r * 0.75; sideS.g = cS.g * 0.75; sideS.b = cS.b * 0.75;
                pushQuad([pxOf(wx + 1), yV(lx + 1, S), pzOf(chunk.z0 + S)], [pxOf(wx), yV(lx, S), pzOf(chunk.z0 + S)],
                         [pxOf(wx), yV(lx, S) - drop, pzOf(chunk.z0 + S)], [pxOf(wx + 1), yV(lx + 1, S) - drop, pzOf(chunk.z0 + S)], sideS);
            }
            if (!chunkXm) for (let lz = 0; lz < S; lz++) {
                const wz = chunk.z0 + lz;
                const cW = colorInto(0, lz, colS);
                sideS.r = cW.r * 0.75; sideS.g = cW.g * 0.75; sideS.b = cW.b * 0.75;
                pushQuad([pxOf(chunk.x0), yV(0, lz + 1), pzOf(wz + 1)], [pxOf(chunk.x0), yV(0, lz), pzOf(wz)],
                         [pxOf(chunk.x0), yV(0, lz) - drop, pzOf(wz)], [pxOf(chunk.x0), yV(0, lz + 1) - drop, pzOf(wz + 1)], sideS);
            }
            if (!chunkXp) for (let lz = 0; lz < S; lz++) {
                const wz = chunk.z0 + lz;
                const cE = colorInto(S - 1, lz, colS);
                sideS.r = cE.r * 0.75; sideS.g = cE.g * 0.75; sideS.b = cE.b * 0.75;
                pushQuad([pxOf(chunk.x0 + S), yV(S, lz), pzOf(wz)], [pxOf(chunk.x0 + S), yV(S, lz + 1), pzOf(wz + 1)],
                         [pxOf(chunk.x0 + S), yV(S, lz + 1) - drop, pzOf(wz + 1)], [pxOf(chunk.x0 + S), yV(S, lz) - drop, pzOf(wz)], sideS);
            }
        }

        const geom = new BABYLON.VertexData();
        const normals = this._computeVertexNormals(positions, indices, null);
        geom.positions = positions;
        geom.colors = colors;
        geom.normals = normals;
        geom.indices = indices;
        if (!this._detailMaterial) {
            this._detailMaterial = new BABYLON.StandardMaterial('detailMat', this.scene);
            this._detailMaterial.specularColor = new BABYLON.Color3(0.02, 0.02, 0.02); // ≈ roughness 0.85
            this._detailMaterial.specularPower = 64;
            // ≈ polygonOffset -2 : tire le détail vers la caméra, évite le z-fighting
            this._detailMaterial.zOffset = -2;
            this._detailMaterial.zOffsetUnits = -2;
            this._detailMaterial.freeze(); // partagé, jamais modifié ensuite
        }
        const mesh = new BABYLON.Mesh('detailChunk_' + cx + '_' + cz, this.scene);
        geom.applyToMesh(mesh);
        mesh.material = this._detailMaterial;
        mesh.metadata = { detail: true }; // reconnu par le prédicat de picking
        mesh.isPickable = true;
        mesh.freezeWorldMatrix(); // chunk 1:1 statique (disposé/recréé à l'invalidation)
        return mesh;
    }

    clearDetailOverlay() {
        this._restoreAllSunk();
        if (!this.detailGroup) { this._detailMeshes = this._detailMeshes || new Map(); this._detailMeshOrder = this._detailMeshOrder || []; return; }
        for (const [, m] of this._detailMeshes || []) {
            if (m) m.dispose();
        }
        this._detailMeshes = new Map();
        this._detailMeshOrder = [];
        this._needsRender = true;
    }

    /** Invalidation ciblée (coup de pinceau) : zone en coordonnées MONDE (blocs) */
    clearDetailOverlayInRegion(wx0, wx1, wz0, wz1) {
        if (!this._detailMeshes || this._detailMeshes.size === 0) return;
        const S = this.generator.detailChunkSize();
        const cx0 = Math.floor(wx0 / S), cx1 = Math.floor(wx1 / S);
        const cz0 = Math.floor(wz0 / S), cz1 = Math.floor(wz1 / S);
        for (let cx = cx0; cx <= cx1; cx++) {
            for (let cz = cz0; cz <= cz1; cz++) {
                const key = cx + ',' + cz;
                const m = this._detailMeshes.get(key);
                if (m !== undefined) {
                    this._detailMeshes.delete(key);
                    const idx = this._detailMeshOrder.indexOf(key);
                    if (idx !== -1) this._detailMeshOrder.splice(idx, 1);
                    if (m) m.dispose();
                }
            }
        }
        this._syncCoarseSink();
        this._needsRender = true;
    }


    /* ============================================================
       SINK DU TERRAIN GROSSIER (fix "gros cubes au zoom"), v3.6 chunkisé :
       - cellule ENTIÈREMENT couverte par des chunks 1:1 -> y = -10000
         dans le buffer de SON chunk (comme avant, mais buffers locaux) ;
       - NOUVEAU : chunk grossier 100% couvert -> mesh purement DÉSACTIVÉ
         (zéro rasterisation, zéro z-fighting possible).
       Restauration exacte à l'éviction / au dézoom / au clear.
       ============================================================ */
    _syncCoarseSink() {
        if (!this._sunkCells) this._sunkCells = new Map();
        const voxelOk = this._geomMeta && this._geomMeta.meshType === 'voxel' &&
                        this._terrainChunks && this._terrainChunks.length;
        if (!voxelOk || !this._detailMeshes || !this.detailGroup || !this.detailGroup.isEnabled()) {
            this._restoreAllSunk();
            return;
        }
        const gen = this.generator;
        const meta = gen.currentGridMeta;
        if (!meta) { this._restoreAllSunk(); return; }
        const S = gen.detailChunkSize();
        const loaded = new Set();
        this._detailMeshes.forEach((m, key) => { if (m) loaded.add(key); });

        // Cellules dont TOUS les chunks couvrants sont chargés (algorithme inchangé)
        const desired = new Set();
        const seen = new Set();
        loaded.forEach((key) => {
            const p = key.split(',');
            const cx = parseInt(p[0], 10), cz = parseInt(p[1], 10);
            const wx0 = cx * S, wz0 = cz * S;
            const gx0 = Math.floor((wx0 - meta.startWorldX) / meta.stepX);
            const gx1 = Math.floor((wx0 + S - 0.001 - meta.startWorldX) / meta.stepX);
            const gz0 = Math.floor((wz0 - meta.startWorldZ) / meta.stepZ);
            const gz1 = Math.floor((wz0 + S - 0.001 - meta.startWorldZ) / meta.stepZ);
            for (let gx = Math.max(0, gx0); gx <= Math.min(meta.resX - 1, gx1); gx++) {
                for (let gz = Math.max(0, gz0); gz <= Math.min(meta.resZ - 1, gz1); gz++) {
                    const ck = gx + ',' + gz;
                    if (seen.has(ck)) continue;
                    seen.add(ck);
                    const cwx0 = meta.startWorldX + gx * meta.stepX;
                    const cwx1 = meta.startWorldX + (gx + 1) * meta.stepX - 0.001;
                    const cwz0 = meta.startWorldZ + gz * meta.stepZ;
                    const cwz1 = meta.startWorldZ + (gz + 1) * meta.stepZ - 0.001;
                    let full = true;
                    for (let qx = Math.floor(cwx0 / S); qx <= Math.floor(cwx1 / S) && full; qx++) {
                        for (let qz = Math.floor(cwz0 / S); qz <= Math.floor(cwz1 / S); qz++) {
                            if (!loaded.has(qx + ',' + qz)) { full = false; break; }
                        }
                    }
                    if (full) desired.add(ck);
                }
            }
        });

        // Réconciliation PAR CHUNK de base
        for (let e = 0; e < this._terrainChunks.length; e++) {
            const entry = this._terrainChunks[e];
            if (!entry.built || !entry.mesh || !entry.positions) continue;
            const total = (entry.x1 - entry.x0) * (entry.z1 - entry.z0);
            if (total <= 0) continue;

            // Passe 1 : comptage des cellules couvertes dans ce chunk
            let covCount = 0;
            for (let gx = entry.x0; gx < entry.x1; gx++) {
                for (let gz = entry.z0; gz < entry.z1; gz++) {
                    if (desired.has(gx + ',' + gz)) covCount++;
                }
            }

            // Chunk 100% couvert -> DÉSACTIVATION COMPLÈTE (perf + jamais de
            // percement). Les entrées sunk partielles sont CONSERVÉES : elles
            // serviront de sauvegarde à la réactivation partielle.
            if (covCount === total) {
                if (!entry.sunkFull) {
                    entry.sunkFull = true;
                    entry.mesh.setEnabled(false);
                    this._requestShadowRefresh();
                    this._needsRender = true;
                }
                continue;
            }

            if (entry.sunkFull) { entry.sunkFull = false; entry.mesh.setEnabled(true); }

            // Passe 2 : sink / restauration cellule par cellule dans le buffer du chunk
            let changed = false;
            const pos = entry.positions;
            for (let gx = entry.x0; gx < entry.x1; gx++) {
                for (let gz = entry.z0; gz < entry.z1; gz++) {
                    const ck = gx + ',' + gz;
                    if (desired.has(ck)) {
                        if (this._sunkCells.has(ck)) continue;
                        const range = this._cellRanges.get(ck);
                        if (!range || range.entry !== entry) continue;
                        const saved = new Float32Array(Math.ceil((range.e - range.s) / 3));
                        let si = 0;
                        for (let i = range.s + 1; i < range.e; i += 3) { saved[si++] = pos[i]; pos[i] = -10000; }
                        this._sunkCells.set(ck, { cx: entry.cx, cz: entry.cz, saved: saved });
                        changed = true;
                    } else if (this._sunkCells.has(ck)) {
                        this._restoreCell(ck);
                        changed = true;
                    }
                }
            }
            if (changed) {
                entry.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, pos);
                this._requestShadowRefresh();
                this._needsRender = true;
            }
        }
    }

    _restoreCell(ck) {
        const savedEntry = this._sunkCells.get(ck);
        const range = this._cellRanges && this._cellRanges.get(ck);
        if (savedEntry && range && range.entry && range.entry.positions) {
            const pos = range.entry.positions;
            const saved = savedEntry.saved;
            let si = 0;
            for (let i = range.s + 1; i < range.e; i += 3) pos[i] = saved[si++];
        }
        this._sunkCells.delete(ck);
    }

    _restoreAllSunk() {
        // Ré-active les chunks désactivés pour couverture totale
        let anyChange = false;
        if (this._terrainChunks) {
            for (let e = 0; e < this._terrainChunks.length; e++) {
                const entry = this._terrainChunks[e];
                if (entry.sunkFull) {
                    entry.sunkFull = false;
                    if (entry.mesh) entry.mesh.setEnabled(true);
                    anyChange = true;
                }
            }
        }
        if (!this._sunkCells || this._sunkCells.size === 0) {
            if (anyChange) { this._requestShadowRefresh(); this._needsRender = true; }
            return;
        }
        // Restauration groupée par chunk (1 updateVerticesData par chunk touché)
        const touchedEntries = new Set();
        const keys = Array.from(this._sunkCells.keys());
        for (let i = 0; i < keys.length; i++) {
            const ck = keys[i];
            const range = this._cellRanges && this._cellRanges.get(ck);
            this._restoreCell(ck);
            if (range && range.entry && range.entry.mesh) touchedEntries.add(range.entry);
        }
        touchedEntries.forEach((entry) => {
            if (entry.positions) entry.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, entry.positions);
        });
        if (keys.length || anyChange) { this._requestShadowRefresh(); this._needsRender = true; }
    }

        updateControlsMode() {
        if (!this.camera || typeof BABYLON === 'undefined') return;
        const ptrInput = this.camera.inputs && this.camera.inputs.attached
            ? this.camera.inputs.attached.pointers : null;
        if (!ptrInput) return;
        const editorMode = !!(window.map2dInstance && window.map2dInstance.activeTab === 'editor');
        const mode = editorMode ? 'editor' : 'settings';
        if (this._ctrlMode === mode) return; // évite de réallouer les tableaux à chaque frame
        this._ctrlMode = mode;
        if (editorMode) {
            // Éditeur : Bloque totalement le drag caméra (boutons souris désactivés) ;
            // la molette reste active (le wheel input est indépendant de `buttons`).
            ptrInput.buttons = [];
        } else {
            // Paramètres : gauche = rotation, droite = pan (défauts ArcRotateCamera,
            // identiques aux OrbitControls d'origine), molette = zoom.
            ptrInput.buttons = [0, 1, 2];
        }
        this._needsRender = true;
    }

    /* ============================================================
       NAVIGATION VOL CLASSIQUE (v4.3) — ZQSD/WASD + Espace/Ctrl + Maj
       La caméra orbite (ArcRotateCamera) est TRANSLATÉE en déplaçant sa
       cible (le centre d'orbite) : le point de vue avance/recule/strafe/
       monte/descend comme une caméra fly, tout en gardant l'orbite souris.
       Ctrl = descente (et désactive la translation horizontale pour ne pas
       parasiter les raccourcis Ctrl+Z/Y d'annulation).
       ============================================================ */
    _is3DVisible() {
        return !!(this.container && this.container.offsetParent !== null &&
                  this.container.clientWidth > 8 && this.container.clientHeight > 8);
    }
    _normFlyKey(e) {
        // Utilise e.key (caractère réel) comme le Schem Placer — pas e.code
        const k = typeof e.key === 'string' ? e.key.toLowerCase() : '';
        const kb = (typeof localStorage !== 'undefined' && localStorage.getItem('bloxdTools.keyboard')) || 'azerty';
        if (kb === 'qwerty') {
            if (k === 'w') return 'fwd';
            if (k === 'a') return 'left';
        } else {
            if (k === 'z') return 'fwd';
            if (k === 'q') return 'left';
        }
        if (k === 's') return 'back';
        if (k === 'd') return 'right';
        if (e.code === 'Space') return 'up';
        if (e.code === 'ControlLeft' || e.code === 'ControlRight') return 'down';
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') return 'fast';
        return null;
    }
    _initFlyControls() {
        window.addEventListener('keydown', (e) => {
            const tag = (e.target && e.target.tagName) || '';
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            const k = this._normFlyKey(e);
            if (!k) return;
            this._flyKeys[k] = true;
            // évite le scroll de la page quand on vole (Espace) en vue 3D
            if ((k === 'up' || k === 'down') && this._is3DVisible()) e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            const k = this._normFlyKey(e);
            if (k) this._flyKeys[k] = false;
        });
        window.addEventListener('blur', () => { this._flyKeys = {}; });
    }
    _updateFly() {
        if (!this.camera || !this._is3DVisible()) return;
        const k = this._flyKeys || {};
        const ctrl = !!k.down;
        // Ctrl maintenu = descente pure (pas de translation horizontale -> évite
        // d'interférer avec Ctrl+Z/Y pour annuler/rétablir)
        const f = ctrl ? 0 : ((k.fwd ? 1 : 0) - (k.back ? 1 : 0));
        const r = ctrl ? 0 : ((k.right ? 1 : 0) - (k.left ? 1 : 0));
        const u = (k.up ? 1 : 0) - (ctrl ? 1 : 0);
        if (!f && !r && !u) return;

        const radius = this.camera.radius || 100;
        const speed = Math.max(1.5, Math.min(80, radius * 0.015)) * ((k.fast && !ctrl) ? 2.5 : 1);

        // Direction avant (caméra -> cible) projetée sur le plan XZ
        let fx = this.camera.target.x - this.camera.position.x;
        let fz = this.camera.target.z - this.camera.position.z;
        const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
        const rx = -fz, rz = fx; // vecteur droite (right-handed Babylon)

        const dx = fx * f * speed + rx * r * speed;
        const dz = fz * f * speed + rz * r * speed;
        const dy = u * speed;

        // On déplace uniquement la CIBLE : la position de la caméra orbite
        // suit automatiquement (offset radius/alpha/beta conservé).
        const t = this.camera.target;
        t.x += dx; t.y += dy; t.z += dz;

        this._needsRender = true;
    }

    animate() {
        this.animFrameId = requestAnimationFrame(() => this.animate());

        // TACHE 1 : ne consommer NI GPU NI CPU quand le canvas 3D ne peut pas être vu
        // (onglet navigateur caché, section 3D repliée via le splitter, display:none).
        // La boucle rAF reste vivante pour reprendre instantanément au retour.
        const hidden = (typeof document !== 'undefined' && document.hidden) ||
            !this.container || this.container.offsetParent === null ||
            this.container.clientWidth < 8 || this.container.clientHeight < 8;
        if (hidden) {
            this._wasHidden = true;
            return;
        }
        if (this._wasHidden) {
            this._wasHidden = false;
            this._needsRender = true; // premier rendu forcé au retour de visibilité
        }

        this.updateControlsMode();
        this._updateFly();
        // Pas de controls.update() à appeler avec Babylon : l'inertie de la caméra
        // est traitée pendant scene.render() et signale ses changements via
        // onViewMatrixChangedObservable -> _needsRender (chaîne auto-entretenue).
        // v3.6 : construction progressive des chunks de terrain (budget ~7 ms)
        this._processChunkBuildQueue();
        // DETAIL AU ZOOM (grands mondes) : chargement progressif des chunks visibles
        this._maybeUpdateDetailOverlay();

        if ((this._needsRender || this._alwaysRender) && this.scene && this.camera) {
            this._needsRender = false;
            this.scene.render();
        }
    }
}
window.Map3D = Map3D;
