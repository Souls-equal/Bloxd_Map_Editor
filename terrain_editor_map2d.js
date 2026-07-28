/* ============================================================
   Bloxd Terrain Editor — terrain_editor_map2d.js
   Carte 2D éditable (canvas) : zoom/pan, relief, grille, pinceaux et tampons.
   Chargement : 5/8 — après terrain_editor_generator.js (voir <script> dans terrain_editor.html)
   ============================================================ */

            /**
 * GIGA PROMPT - Bloxd Terrain Editor
 * Module : terrain_editor_map2d.js
 * Rôle : Gestion du rendu Canvas 2D top-down, zoom/pan, preview du brush et peinture interactive
 */

class Map2D {
    constructor(canvasId, generator, onTerrainModified) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.generator = generator;
        this.onTerrainModified = onTerrainModified;

        // Vue (Caméra 2D) : translation et zoom
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1.0;

        // État de la souris et outils
        this.isDragging = false;
        this.isPainting = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.mousePos = { x: 0, y: 0, gx: -1, gz: -1, worldX: 0, worldZ: 0 };
        this.spacePressed = false;

        // Outil actif (venant de ui.js)
        this.activeTab = 'settings'; // 'settings' | 'editor'
        this.activeTool = 'biome'; // 'biome', 'raise', 'lower', 'smooth', 'flatten', 'eraser'
        this.brushRadius = 4;
        this.brushIntensity = 15;
        this.activeBiome = 'plain';
        this.firstClickH = null;

        // PERF : cache des couleurs finales par cellule (mélange de biomes + ombrage),
        // invalidé automatiquement à chaque mutation de la grille (generator._rev) ou
        // changement d'ombrage. Supprime tout parsing hex et tout calcul de mélange
        // dans la boucle de rendu (pan / zoom / survol / peinture).
        this._cellColorCache = new Map();
        this._cellColorRev = -2;
        this._hsKey = -1;
        this._biomeRGBCache = Object.create(null); // hex -> [r,g,b]

        this.initEvents();
        this.resize();

        if (typeof ResizeObserver !== 'undefined' && this.canvas.parentElement) {
            this.resizeObserver = new ResizeObserver(() => this.resize());
            this.resizeObserver.observe(this.canvas.parentElement);
        }
        window.addEventListener('resize', () => this.resize());
    }

    getCanvasCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = rect.width > 0 ? this.canvas.width / rect.width : 1;
        const scaleY = rect.height > 0 ? this.canvas.height / rect.height : 1;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    /**
     * Ajuste la taille du canvas à son conteneur parent
     */
    resize() {
        if (!this.canvas.parentElement) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            if (this.canvas.width !== rect.width || this.canvas.height !== rect.height) {
                this.canvas.width = rect.width;
                this.canvas.height = rect.height;
                this.render();
            }
        }
    }

    /**
     * Réinitialise la caméra 2D pour centrer toute la carte
     */
    resetView() {
        const grid = this.generator.grid;
        const resX = grid && grid.length ? grid.length : (this.generator.config.gridResolution || 96);
        const resZ = grid && grid[0] && grid[0].length ? grid[0].length : resX;
        const minDim = Math.min(this.canvas.width, this.canvas.height);
        this.zoom = (minDim * 0.85) / Math.max(resX, resZ);
        this.panX = (this.canvas.width - resX * this.zoom) / 2;
        this.panY = (this.canvas.height - resZ * this.zoom) / 2;
        this.render();
    }

    screenToWorld(px, py) {
        const meta = this.generator.currentGridMeta;
        const gx = (px - this.panX) / this.zoom;
        const gz = (py - this.panY) / this.zoom;
        if (!meta) {
            return { worldX: gx * 40, worldZ: gz * 40 };
        }
        return {
            worldX: meta.startWorldX + gx * meta.stepX,
            worldZ: meta.startWorldZ + gz * meta.stepZ
        };
    }

    checkViewportUpdate() {
        // DEPRECIE : plus de "Focus Écran Dynamique". Le détail au zoom est rendu
        // par les chunks 16x16 à la demande (voir render / renderDetailChunks).
        return;
        // eslint-disable-next-line no-unreachable
        if (this.generator.config.viewportMode !== 'dynamic') return;
        if (!this.generator.currentGridMeta) return;

        const topLeft = this.screenToWorld(0, 0);
        const bottomRight = this.screenToWorld(this.canvas.width, this.canvas.height);

        const updated = this.generator.updateViewportFromScreen(topLeft.worldX, bottomRight.worldX, topLeft.worldZ, bottomRight.worldZ);
        if (updated) {
            const meta = this.generator.currentGridMeta;
            const newGx_top = (topLeft.worldX - meta.startWorldX) / meta.stepX;
            const newGz_top = (topLeft.worldZ - meta.startWorldZ) / meta.stepZ;
            const newGx_bottom = (bottomRight.worldX - meta.startWorldX) / meta.stepX;
            
            const spanX = newGx_bottom - newGx_top;
            if (spanX > 0) {
                this.zoom = this.canvas.width / spanX;
                this.panX = -newGx_top * this.zoom;
                this.panY = -newGz_top * this.zoom;
            }
            this.render();
            if (this.onTerrainModified) this.onTerrainModified();
        }
    }

    /**
     * Convertit les coordonnées pixel souris (px, py) en coordonnées de grille (gx, gz)
     */
    screenToGrid(px, py) {
        const gx = Math.floor((px - this.panX) / this.zoom);
        const gz = Math.floor((py - this.panY) / this.zoom);
        return { gx, gz };
    }

    /**
     * Configure les écouteurs d'événements souris et clavier
     */
    initEvents() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') this.spacePressed = true;
        });
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') this.spacePressed = false;
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const { x: mouseX, y: mouseY } = this.getCanvasCoords(e);

            const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
            const newZoom = Math.max(0.5, Math.min(40.0, this.zoom * zoomFactor));

            // Zoom centré sur le pointeur souris
            this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
            this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
            this.zoom = newZoom;

            this.render();
            if (this._wheelTimeout) clearTimeout(this._wheelTimeout);
            this._wheelTimeout = setTimeout(() => this.checkViewportUpdate(), 120);
        }, { passive: false });

        this.canvas.addEventListener('mousedown', (e) => {
            const { x: mx, y: my } = this.getCanvasCoords(e);

            // Clic droit ou bouton milieu ou Espace maintenu -> Déplacement (pan)
            if (e.button === 2 || e.button === 1 || this.spacePressed || this.activeTab === 'settings') {
                this.isDragging = true;
                this.dragStartX = mx - this.panX;
                this.dragStartY = my - this.panY;
                this.canvas.style.cursor = 'grabbing';
            } else if (e.button === 0 && this.activeTab === 'editor') {
                if (this.generator && typeof this.generator.saveStateForUndo === 'function') this.generator.saveStateForUndo();
                // Peinture au pinceau
                this.isPainting = true;
                this._stampDone = false; // nouvelle pose de forme autorisée à chaque clic
                const gridPos = this.screenToGrid(mx, my);
                // FIX APLATIR : borner sur la taille REELLE de la grille (mode
                // dynamique = taille variable), pas sur config.gridResolution,
                // sinon firstClickH restait null et l'outil Aplatir ne faisait rien
                const gridRef = this.generator.grid;
                const gridResX = gridRef && gridRef.length ? gridRef.length : 0;
                const gridResZ = gridRef && gridRef[0] ? gridRef[0].length : 0;
                if (gridPos.gx >= 0 && gridPos.gx < gridResX &&
                    gridPos.gz >= 0 && gridPos.gz < gridResZ) {
                    this.firstClickH = gridRef[gridPos.gx][gridPos.gz].height;
                    this.applyToolAt(gridPos.gx, gridPos.gz);
                }
            }
        });

        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Seulement si sur ou proche du canvas 2D
            if (e.target !== this.canvas && !this.isDragging && !this.isPainting) return;
            const { x: mx, y: my } = this.getCanvasCoords(e);

            this.mousePos.x = mx;
            this.mousePos.y = my;

            const gridPos = this.screenToGrid(mx, my);
            this.mousePos.gx = gridPos.gx;
            this.mousePos.gz = gridPos.gz;

            const grid = this.generator.grid;
            const resX = grid && grid.length ? grid.length : 0;
            const resZ = grid && grid[0] ? grid[0].length : 0;

            if (gridPos.gx >= 0 && gridPos.gx < resX &&
                gridPos.gz >= 0 && gridPos.gz < resZ &&
                grid[gridPos.gx] && grid[gridPos.gx][gridPos.gz]) {
                const cell = this.generator.grid[gridPos.gx][gridPos.gz];
                this.mousePos.worldX = Math.round(cell.worldX);
                this.mousePos.worldZ = Math.round(cell.worldZ);
                this.mousePos.height = Math.round(cell.height);
                const bObj = this.generator.biomes[cell.biome];
                this.mousePos.biomeName = window.getBiomeName ? window.getBiomeName(cell.biome, bObj) : (bObj ? bObj.name : cell.biome);
            } else {
                this.mousePos.height = null;
            }

            if (this.isDragging) {
                this.panX = mx - this.dragStartX;
                this.panY = my - this.dragStartY;
                this.requestRender();
            } else if (this.isPainting) {
                // PERF DESSIN : la souris émet ~120 événements/s ; on mémorise la
                // dernière position et on applique le pinceau au plus 1x par frame
                // (le rendu est déclenché par applyToolAt via requestRender)
                this._pendingPaint = { gx: gridPos.gx, gz: gridPos.gz };
                if (!this._paintRaf) {
                    this._paintRaf = requestAnimationFrame(() => {
                        this._paintRaf = null;
                        if (this._pendingPaint && this.isPainting) {
                            this.applyToolAt(this._pendingPaint.gx, this._pendingPaint.gz);
                            this._pendingPaint = null;
                        }
                    });
                }
            } else {
                // Simple survol : seul l'anneau du pinceau bouge -> render coalescé
                this.requestRender();
            }

            this.updateMouseOverlay();
        });

        window.addEventListener('mouseup', (e) => {
            if (this.isDragging) {
                this.isDragging = false;
                this.canvas.style.cursor = 'default';
                this.checkViewportUpdate();
            }
            if (this.isPainting) {
                this.isPainting = false;
                this.firstClickH = null;
                this._pendingPaint = null;
                // Fin de geste : stats recalculées une seule fois
                if (this.generator._statsDirty) {
                    this.generator._statsDirty = false;
                    this.generator.updateStats();
                    if (window.uiManagerInstance) window.uiManagerInstance.updateStatsBar();
                }
            }
        });

        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Applique l'outil actif sur la position spécifiée et déclenche la synchro 3D
     */
    applyToolAt(gx, gz) {
        const grid = this.generator.grid;
        if (!grid || gx < 0 || gx >= grid.length || !grid[0] || gz < 0 || gz >= grid[0].length) return;

        // Outil FORME (custom draw) : peint le masque de forme
        if (this.activeTool === 'shape') {
            if (this.generator.shapeMask) {
                this.generator.paintShapeMask(gx, gz, this.brushRadius, true);
                this.requestRender();
            }
            return;
        }
        
        let modified;
        if (this.activeTool === 'sphere' || this.activeTool === 'box') {
            // TAMPONS : posés une seule fois par clic (pas en continu au glisser)
            if (this._stampDone) return;
            this._stampDone = true;
            const p = (window.uiManagerInstance && window.uiManagerInstance.stampParams) || { w: 10, d: 10, h: 20, paintBiome: true };
            modified = this.generator.applyStamp(
                gx, gz,
                this.activeTool === 'sphere' ? 'sphere' : 'box',
                p.w, p.d, p.h,
                p.paintBiome ? this.activeBiome : null
            );
        } else {
            modified = this.generator.applyBrush(
                gx, gz,
                this.activeTool,
                this.brushRadius,
                this.brushIntensity,
                this.activeBiome,
                this.firstClickH
            );
        }

        if (modified) {
            this.requestRender();
            if (this.onTerrainModified) {
                // TACHE 2 : transmet la zone modifiée (bounding box grille) pour
                // permettre une mise à jour 3D partielle ; les autres appels du
                // callback (sans argument) déclenchent le rebuild complet.
                this.onTerrainModified(this.generator.lastBrushRegion || null);
            }
        }
    }

    /**
     * Met à jour le badge d'informations souris en superposition du canvas 2D
     */
    updateMouseOverlay() {
        const infoEl = document.getElementById('map2d-info');
        if (!infoEl) return;
        if (this.mousePos.height !== null && this.mousePos.height !== undefined && this.generator.grid && this.generator.grid[this.mousePos.gx] && this.generator.grid[this.mousePos.gx][this.mousePos.gz]) {
            const bKey = this.generator.grid[this.mousePos.gx][this.mousePos.gz].biome;
            const bObj = this.generator.biomes[bKey];
            const bName = window.getBiomeName ? window.getBiomeName(bKey, bObj) : (bObj ? bObj.name : bKey);
            infoEl.innerHTML = `
                <span class="info-badge"><i class="fas fa-map-marker-alt"></i> X: ${this.mousePos.worldX}, Z: ${this.mousePos.worldZ}</span>
                <span class="info-badge"><i class="fas fa-mountain"></i> Y: ${this.mousePos.height}</span>
                <span class="info-badge biome-badge" style="border-left: 3px solid ${bObj?.color || '#fff'}">
                    ${bName}
                </span>
            `;
        } else {
            infoEl.innerHTML = `<span class="info-badge">${window.t ? window.t('outOfBounds') : 'Hors carte'}</span>`;
        }
    }


    /**
     * PERF : rendu coalescé (au plus 1 par frame) et suspendu quand la section
     * 2D est masquée (toggle vue 3D). Le rendu manqué est rattrapé au retour.
     */
    requestRender() {
        if (this.canvas && this.canvas.offsetParent === null) {
            this._pendingHiddenRender = true;
            return;
        }
        if (this._renderRaf) return;
        this._renderRaf = requestAnimationFrame(() => {
            this._renderRaf = null;
            this.render();
        });
    }

    _biomeRGB(hex){
        let c=this._biomeRGBCache[hex];
        if(c)return c;
        let hx=hex.replace(/^\s*#|\s*$/g,'');
        if(hx.length===3)hx=hx.replace(/(.)/g,'$1$1');
        c=[parseInt(hx.substr(0,2),16)||0,parseInt(hx.substr(2,2),16)||0,parseInt(hx.substr(4,2),16)||0];
        this._biomeRGBCache[hex]=c;
        return c;
    }
    /** Couleur finale (mélange de biomes + ombrage) d'une cellule, mise en cache. */
    _cellFinalHex(gx,gz,resX,resZ,grid){
        const key=gx+','+gz;
        const cached=this._cellColorCache.get(key);
        if(cached!==undefined)return cached;
        const cell=grid[gx][gz];
        const cellBiome=cell.biome;
        const baseHex=(this.generator.biomes[cellBiome]||{color:'#888888'}).color;
        const base=this._biomeRGB(baseHex);
        let r,g,b;
        let hasDiff=false;
        // Sous l'eau → pas de mélange de biomes (sable pur, pas de vert qui bave)
        if(cell.height>this.generator.config.seaLevel){
        for(let dx=-1;dx<=1&&!hasDiff;dx++){for(let dz=-1;dz<=1;dz++){const nx=gx+dx,nz=gz+dz;if(nx<0||nx>=resX||nz<0||nz>=resZ)continue;if(grid[nx][nz].biome!==cellBiome){hasDiff=true;break;}}}
        }
        if(!hasDiff){r=base[0];g=base[1];b=base[2];}
        else{
            const R=2;let rr=0,gg=0,bb=0,wSum=0;
            for(let dx=-R;dx<=R;dx++){for(let dz=-R;dz<=R;dz++){const nx=gx+dx,nz=gz+dz;if(nx<0||nx>=resX||nz<0||nz>=resZ)continue;const d=Math.sqrt(dx*dx+dz*dz);if(d>R)continue;const w=1/(1+d*d);const cc=this._biomeRGB((this.generator.biomes[grid[nx][nz].biome]||{color:baseHex}).color);rr+=cc[0]*w;gg+=cc[1]*w;bb+=cc[2]*w;wSum+=w;}}
            r=rr/wSum;g=gg/wSum;b=bb/wSum;
        }
        if(this.generator.config.hillshading){
            const leftH=gx>0?grid[gx-1][gz].height:cell.height;
            const topH=gz>0?grid[gx][gz-1].height:cell.height;
            const dlt=Math.round(((leftH-cell.height)+(topH-cell.height))*2.2);
            r+=dlt;g+=dlt;b+=dlt;
        }
        if(r<0)r=0;else if(r>255)r=255;if(g<0)g=0;else if(g>255)g=255;if(b<0)b=0;else if(b>255)b=255;
        // MASQUE DE FORME : les cellules hors-forme sont complètement masquées
        if (this.generator.shapeMask && !this.generator.isInShape(gx, gz)) return null;
        const hex='#'+((1<<24)+((r|0)<<16)+((g|0)<<8)+(b|0)).toString(16).slice(1);
        this._cellColorCache.set(key,hex);
        return hex;
    }

    _renderTile(grid, resX, resZ, tx, tz, TILE) {
        const z = this.zoom;
        const cw = Math.ceil(z) + 0.5;
        const cv = document.createElement('canvas');
        cv.width = Math.ceil(TILE * z) + 1;
        cv.height = Math.ceil(TILE * z) + 1;
        const c = cv.getContext('2d');
        const sea = this.generator.config.seaLevel;
        const showWater = this.generator.config.showWater;
        const showGrid = this.generator.config.showGrid && z > 8;
        const x0 = tx * TILE, z0 = tz * TILE;
        for (let lx = 0; lx < TILE; lx++) {
            const gx = x0 + lx;
            if (gx >= resX) break;
            for (let lz = 0; lz < TILE; lz++) {
                const gz = z0 + lz;
                if (gz >= resZ) break;
                const cell = grid[gx][gz];
                const px = lx * z, py = lz * z;
                const hex = this._cellFinalHex(gx, gz, resX, resZ, grid);
                if (!hex) continue; // hors forme → invisible
                c.fillStyle = hex; c.fillRect(Math.floor(px), Math.floor(py), cw, cw);
                if (showWater && cell.height <= sea) {
                    c.fillStyle = 'rgba(14, 116, 144, 0.55)';
                    c.fillRect(Math.floor(px), Math.floor(py), cw, cw);
                }
                if (showGrid) {
                    c.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                    c.lineWidth = 1;
                    c.strokeRect(Math.floor(px), Math.floor(py), Math.ceil(z), Math.ceil(z));
                }
            }
        }
        return cv;
    }

    /**
     * Boucle de rendu de la carte 2D
     */
    render() {
        const ctx = this.ctx;
        const grid = this.generator.grid;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (!grid || grid.length === 0) return;
        const resX = grid.length;
        const resZ = grid[0] ? grid[0].length : 0;

        // Limites visibles du canvas en coordonnées de grille pour optimiser le dessin
        const startGx = Math.max(0, Math.floor(-this.panX / this.zoom));
        const startGz = Math.max(0, Math.floor(-this.panY / this.zoom));
        const endGx = Math.min(resX - 1, Math.ceil((this.canvas.width - this.panX) / this.zoom));
        const endGz = Math.min(resZ - 1, Math.ceil((this.canvas.height - this.panY) / this.zoom));

        // PERF : invalide le cache des couleurs si la grille a changé (generator._rev)
        // ou si l'ombrage a été basculé.
        const _gen = this.generator;
        const _hs = _gen.config.hillshading ? 1 : 0;
        if (_gen._rev !== this._cellColorRev || this._hsKey !== _hs) {
            this._cellColorCache.clear();
            this._cellColorRev = _gen._rev;
            this._hsKey = _hs;
            if (this._tileCache) this._tileCache.clear(); // force le redraw des tuiles
        }

        // ── SYSTÈME DE TUILES (chunk-based 2D rendering) ──
        // La grille est divisée en tuiles de 32×32 cellules. Chaque tuile est
        // rendue UNE FOIS dans un canvas hors-écran puis BLITTÉE (drawImage)
        // au lieu de faire 1024 fillRect par tuile à chaque frame.
        const TILE = 32;
        const tileSX = Math.floor(startGx / TILE);
        const tileEX = Math.floor(endGx / TILE);
        const tileSZ = Math.floor(startGz / TILE);
        const tileEZ = Math.floor(endGz / TILE);

        for (let tx = tileSX; tx <= tileEX; tx++) {
            for (let tz = tileSZ; tz <= tileEZ; tz++) {
                const tKey = tx + ',' + tz + ',' + Math.ceil(this.zoom);
                let tile = this._tileCache ? this._tileCache.get(tKey) : null;
                if (!tile) {
                    if (!this._tileCache) this._tileCache = new Map();
                    tile = this._renderTile(grid, resX, resZ, tx, tz, TILE);
                    this._tileCache.set(tKey, tile);
                    // LRU: garde au max 400 tuiles
                    if (this._tileCache.size > 400) {
                        const firstKey = this._tileCache.keys().next().value;
                        this._tileCache.delete(firstKey);
                    }
                }
                // Blit la tuile à sa position écran — taille exacte pour éviter les gaps
                const px = this.panX + tx * TILE * this.zoom;
                const py = this.panY + tz * TILE * this.zoom;
                const nextPx = this.panX + (tx + 1) * TILE * this.zoom;
                const nextPy = this.panY + (tz + 1) * TILE * this.zoom;
                ctx.drawImage(tile, Math.floor(px), Math.floor(py), Math.ceil(nextPx) - Math.floor(px), Math.ceil(nextPy) - Math.floor(py));
            }
        }

        // CHUNKS DE DÉTAIL 16x16 : quand une cellule de grille couvre plusieurs
        // blocs (grands mondes) ET que le zoom rend ce détail visible, on dessine
        // par-dessus la vraie résolution 1:1, chunk par chunk, uniquement pour
        // les chunks présents à l'écran (calcul à la demande + cache LRU).
        this.renderDetailChunks(ctx, resX, resZ);

        // Contour de toute la carte
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.panX, this.panY, resX * this.zoom, resZ * this.zoom);

        // Preview du brush sous le pointeur souris si en mode Editeur
        if (this.activeTab === 'editor' && this.mousePos.gx >= 0 && this.mousePos.gx < resX && this.mousePos.gz >= 0 && this.mousePos.gz < resZ) {
            this.renderBrushPreview(ctx);
        }
    }


    /**
     * Surcouche "chunks de détail" : ne calcule et ne dessine QUE les chunks
     * 16x16 blocs visibles dans le canvas. px/bloc = zoom / stepX.
     */
    renderDetailChunks(ctx, resX, resZ) {
        const gen = this.generator;
        if (!gen.needsDetailChunks || !gen.needsDetailChunks()) return;
        const meta = gen.currentGridMeta;
        if (!meta) return;
        const pxPerBlockX = this.zoom / meta.stepX;
        const pxPerBlockZ = this.zoom / meta.stepZ;
        // v2.5 : 1:1 dès qu'un bloc >= 1 px (comme la 3D : le max possible, sur
        // toute la zone visible). En-dessous d'1 px, plusieurs blocs partagent
        // le même pixel : le 1:1 est invisible -> grille grossière suffisante.
        if (pxPerBlockX < 1) return;

        const S = gen.detailChunkSize();
        // Fenêtre visible en coordonnées MONDE
        const wxMin = meta.startWorldX + (-this.panX / this.zoom) * meta.stepX;
        const wxMax = meta.startWorldX + ((this.canvas.width - this.panX) / this.zoom) * meta.stepX;
        const wzMin = meta.startWorldZ + (-this.panY / this.zoom) * meta.stepZ;
        const wzMax = meta.startWorldZ + ((this.canvas.height - this.panY) / this.zoom) * meta.stepZ;

        const cx0 = Math.floor(wxMin / S), cx1 = Math.floor(wxMax / S);
        const cz0 = Math.floor(wzMin / S), cz1 = Math.floor(wzMax / S);

        // v2.5 : chaque chunk est rasterisé UNE FOIS dans un petit canvas 16x16
        // (WeakMap : l'invalidation du chunk côté générateur régénère l'image
        // automatiquement) puis affiché en UN drawImage au lieu de 256 fillRect.
        // C'est ce qui permet le plein écran 1:1 (~8000 chunks) sans ramer.
        if (!this._chunkImgCache) this._chunkImgCache = new WeakMap();
        const prevSmooth = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = false; // blocs nets (nearest neighbor)

        // Budget par frame : les chunks manquants seront calculés aux frames
        // suivantes (chargement progressif, comme la 3D)
        let budget = 2000;
        let missing = 0;
        for (let cz = cz0; cz <= cz1; cz++) {
            for (let cx = cx0; cx <= cx1; cx++) {
                const cached = gen._detailChunks && gen._detailChunks.get(cx + ',' + cz);
                let chunk = cached;
                if (!chunk) {
                    if (budget <= 0) { missing++; continue; }
                    budget--;
                    chunk = gen.getDetailChunk(cx, cz);
                    if (!chunk) continue;
                }
                let img = this._chunkImgCache.get(chunk);
                if (!img) {
                    img = this._buildChunkImage(chunk, S, gen);
                    this._chunkImgCache.set(chunk, img);
                }
                // Bords arrondis au pixel pour des chunks jointifs sans couture
                const fx0 = this.panX + ((chunk.x0 - meta.startWorldX) / meta.stepX) * this.zoom;
                const fy0 = this.panY + ((chunk.z0 - meta.startWorldZ) / meta.stepZ) * this.zoom;
                const fx1 = this.panX + ((chunk.x0 + S - meta.startWorldX) / meta.stepX) * this.zoom;
                const fy1 = this.panY + ((chunk.z0 + S - meta.startWorldZ) / meta.stepZ) * this.zoom;
                const px = Math.round(fx0), py = Math.round(fy0);
                if (px > this.canvas.width || py > this.canvas.height || fx1 < 0 || fy1 < 0) continue;
                ctx.drawImage(img, px, py, Math.round(fx1) - px, Math.round(fy1) - py);
            }
        }
        ctx.imageSmoothingEnabled = prevSmooth;
        // S'il reste des chunks non calculés (budget épuisé), replanifier un rendu
        if (missing > 0 && !this._detailRaf) {
            this._detailRaf = requestAnimationFrame(() => { this._detailRaf = null; this.render(); });
        }
    }

    /**
     * Rasterise un chunk de détail 16x16 dans un canvas hors écran :
     * couleur de biome + hillshading + voile d'eau, 1 pixel = 1 bloc.
     */
    _buildChunkImage(chunk, S, gen) {
        const cv = document.createElement('canvas');
        cv.width = S; cv.height = S;
        const c2 = cv.getContext('2d');
        const im = c2.createImageData(S, S);
        const data = im.data;
        if (!this._biomeRgbCache) this._biomeRgbCache = {};
        const sea = gen.config.seaLevel;
        const shading = gen.config.hillshading;
        const showWater = gen.config.showWater;
        for (let lz = 0; lz < S; lz++) {
            for (let lx = 0; lx < S; lx++) {
                const i = lz * S + lx;
                const bkey = chunk.biomes[i];
                let rgb = this._biomeRgbCache[bkey];
                if (!rgb) {
                    const bio = gen.biomes[bkey] || { color: '#888888' };
                    let hx = bio.color.replace(/^\s*#|\s*$/g, '');
                    if (hx.length === 3) hx = hx.replace(/(.)/g, '$1$1');
                    rgb = [parseInt(hx.substr(0, 2), 16), parseInt(hx.substr(2, 2), 16), parseInt(hx.substr(4, 2), 16)];
                    this._biomeRgbCache[bkey] = rgb;
                }
                const h = chunk.heights[i];
                let r = rgb[0], g = rgb[1], b = rgb[2];
                if (shading) {
                    // FIX v2.7 "traits dans les pentes" : sur la 1re colonne/ligne
                    // du chunk, le voisin ouest/nord est dans le chunk d'à côté.
                    // Avant : hl = h (ombrage nul) -> trait clair tous les 16
                    // blocs dans les pentes. On extrapole le gradient interne
                    // (2h - voisin est/sud) : ombrage continu entre chunks,
                    // sans dépendre du cache des chunks voisins.
                    const hl = lx > 0 ? chunk.heights[i - 1] : (lx + 1 < S ? 2 * h - chunk.heights[i + 1] : h);
                    const ht = lz > 0 ? chunk.heights[i - S] : (lz + 1 < S ? 2 * h - chunk.heights[i + S] : h);
                    const d = ((hl - h) + (ht - h)) * 2.2;
                    r += d; g += d; b += d;
                }
                if (showWater && h <= sea) {
                    // mélange rgba(14, 116, 144, 0.55)
                    r = r * 0.45 + 14 * 0.55;
                    g = g * 0.45 + 116 * 0.55;
                    b = b * 0.45 + 144 * 0.55;
                }
                const o = i * 4;
                data[o] = Math.max(0, Math.min(255, r));
                data[o + 1] = Math.max(0, Math.min(255, g));
                data[o + 2] = Math.max(0, Math.min(255, b));
                data[o + 3] = 255;
            }
        }
        c2.putImageData(im, 0, 0);
        return cv;
    }

    /**
     * Dessine le cercle de prévisualisation du pinceau
     */
    renderBrushPreview(ctx) {
        const centerPx = this.panX + (this.mousePos.gx + 0.5) * this.zoom;
        const centerPy = this.panY + (this.mousePos.gz + 0.5) * this.zoom;
        const radiusPx = (this.brushRadius + 0.5) * this.zoom;

        // Aperçu des FORMES : ellipse (sphère) ou rectangle (pavé) aux dimensions réelles
        if (this.activeTool === 'sphere' || this.activeTool === 'box') {
            const p = (window.uiManagerInstance && window.uiManagerInstance.stampParams) || { w: 16, d: 16, h: 20 };
            // p.w / p.d sont en BLOCS : conversion en cellules d'aperçu via le pas de grille
            const meta = this.generator.currentGridMeta;
            const cw = meta ? Math.max(1, p.w / meta.stepX) : p.w;
            const cd = meta ? Math.max(1, p.d / meta.stepZ) : p.d;
            const rxPx = cw * this.zoom, rzPx = cd * this.zoom;
            const col = p.h >= 0 ? '#8b5cf6' : '#ef4444';
            ctx.save();
            ctx.beginPath();
            if (this.activeTool === 'sphere') ctx.ellipse(centerPx, centerPy, rxPx, rzPx, 0, 0, Math.PI * 2);
            else ctx.rect(centerPx - rxPx, centerPy - rzPx, rxPx * 2, rzPx * 2);
            ctx.fillStyle = col + '26';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.85)';
            ctx.lineWidth = 4.5;
            ctx.stroke();
            ctx.strokeStyle = col;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
            return;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerPx, centerPy, radiusPx, 0, Math.PI * 2);
        
        let brushColor = '#ffffff';
        if (this.activeTool === 'biome') brushColor = this.generator.biomes[this.activeBiome]?.color || '#ffffff';
        if (this.activeTool === 'raise') brushColor = '#10b981';
        if (this.activeTool === 'lower') brushColor = '#ef4444';
        if (this.activeTool === 'smooth') brushColor = '#f59e0b';
        if (this.activeTool === 'eraser') brushColor = '#ec4899';

        ctx.fillStyle = brushColor + '33'; // 20% alpha
        ctx.fill();
        // VISIBILITE : double trait (halo noir épais + trait couleur clair) pour
        // rester lisible sur tous les biomes (neige comme forêt sombre)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = 4.5;
        ctx.stroke();
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        // Point central (repère exact du pinceau)
        ctx.beginPath();
        ctx.arc(centerPx, centerPy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerPx, centerPy, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
    }

    /**
     * Utilitaire pour assombrir ou éclaircir une couleur hex en fonction d'une pente
     */

    /**
     * GRADIENT DE BIOMES (2D) : si des voisins (rayon 2) ont un biome different,
     * la couleur de la cellule est melangee avec les leurs (moyenne ponderee par
     * la distance). Loin des frontieres, aucun voisin different -> couleur pure.
     */
    getBlendedBiomeColor(grid, gx, gz, resX, resZ, baseHex) {
        const cellBiome = grid[gx][gz].biome;
        const R = 2;
        // Detection rapide : bords immediats identiques -> pas de melange
        let hasDiff = false;
        for (let dx = -1; dx <= 1 && !hasDiff; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                const nx = gx + dx, nz = gz + dz;
                if (nx < 0 || nx >= resX || nz < 0 || nz >= resZ) continue;
                if (grid[nx][nz].biome !== cellBiome) { hasDiff = true; break; }
            }
        }
        if (!hasDiff) return baseHex;

        // Moyenne ponderee des couleurs dans le rayon R
        const parse = (hex) => {
            hex = hex.replace('#', '');
            if (hex.length === 3) hex = hex.replace(/(.)/g, '$1$1');
            return [parseInt(hex.substr(0, 2), 16), parseInt(hex.substr(2, 2), 16), parseInt(hex.substr(4, 2), 16)];
        };
        let r = 0, g = 0, b = 0, wSum = 0;
        for (let dx = -R; dx <= R; dx++) {
            for (let dz = -R; dz <= R; dz++) {
                const nx = gx + dx, nz = gz + dz;
                if (nx < 0 || nx >= resX || nz < 0 || nz >= resZ) continue;
                const d = Math.sqrt(dx * dx + dz * dz);
                if (d > R) continue;
                const w = 1 / (1 + d * d); // poids decroissant avec la distance
                const bio = this.generator.biomes[grid[nx][nz].biome];
                const c = parse(bio ? bio.color : baseHex);
                r += c[0] * w; g += c[1] * w; b += c[2] * w; wSum += w;
            }
        }
        r = Math.round(r / wSum); g = Math.round(g / wSum); b = Math.round(b / wSum);
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    adjustBrightness(hex, percent) {
        hex = hex.replace(/^\s*#|\s*$/g, '');
        if (hex.length === 3) hex = hex.replace(/(.)/g, '$1$1');
        
        let r = parseInt(hex.substr(0, 2), 16);
        let g = parseInt(hex.substr(2, 2), 16);
        let b = parseInt(hex.substr(4, 2), 16);

        r = Math.max(0, Math.min(255, r + percent));
        g = Math.max(0, Math.min(255, g + percent));
        b = Math.max(0, Math.min(255, b + percent));

        return '#' + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
    }
}
window.Map2D = Map2D;
