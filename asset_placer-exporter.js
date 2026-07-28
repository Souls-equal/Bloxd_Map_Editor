/**
 * asset_placer-exporter.js
 * Unified export for terrain + placed assets.
 */

window.Exporter = class Exporter {
    constructor(assetManager, terrainManager = null) {
        this.assetManager = assetManager;
        this.terrainManager = terrainManager;
    }

    exportSingleSchem() {
        const blockMap = new Map();

        const putBlock = (block, source, instance = null) => {
            if (!block || block.id === 0) return;
            const key = `${block.x},${block.y},${block.z}`;
            const existing = blockMap.get(key);
            if (source === 'asset' && existing) {
                if (existing.source === 'terrain' && instance && !instance.priorityOverTerrain) return;
                if (existing.source === 'asset' && instance && !instance.priorityOverAssets) return;
            }
            blockMap.set(key, { ...block, source, instanceId: instance ? instance.id : null });
        };

        let terrainSkipped = false;
        if (this.terrainManager?.hasTerrain()) {
            const data = this.terrainManager.terrainData;
            if (data?.mode === 'heightmap-streaming' && data.totalColumns > 1000000) {
                terrainSkipped = true;
                alert(window.I18N.t('largeTerrainExportSkipped'));
            } else {
                for (const b of this.terrainManager.getExportBlocks()) putBlock(b, 'terrain');
            }
        }

        for (const inst of this.assetManager.instances) {
            const schem = this.assetManager.getTemplateSchem(inst.name);
            if (!schem?.blocks) continue;

            const co = inst._centerOffset || { x: 0, z: 0 };
            inst.mesh.computeWorldMatrix(true);
            const wm = inst.mesh.getWorldMatrix();
            const tmp = new BABYLON.Vector3();
            const footprint = inst.autoTerraform ? new Map() : null; // "wx,wz" -> min wy
            for (const block of schem.blocks) {
                if (!block || block.id === 0) continue;
                tmp.set(block.x - co.x, block.y, block.z - co.z);
                BABYLON.Vector3.TransformToRef(tmp, wm, tmp);
                const wx = Math.round(tmp.x), wy = Math.round(tmp.y), wz = Math.round(tmp.z);
                putBlock({ x: wx, y: wy, z: wz, id: block.id, data: block.data || 0 }, 'asset', inst);
                if (footprint) {
                    const k = wx + ',' + wz;
                    const prev = footprint.get(k);
                    if (prev === undefined || wy < prev) footprint.set(k, wy);
                }
            }
            // Auto-terraform : socle NATUREL — pente au bord (3 anneaux) + matériau du sol par colonne.
            if (footprint) {
                const tm = this.terrainManager;
                let baseY = Infinity; for (const y of footprint.values()) if (y < baseY) baseY = y;
                const floorY = baseY - 6;
                const filled = new Set();
                const fillCol = (wx, wz, topY) => {
                    let gid = (tm && tm.getSurfaceBlockAtWorld) ? tm.getSurfaceBlockAtWorld(wx, wz) : null;
                    if (!gid) gid = 2;
                    for (let y = Math.round(topY); y >= Math.round(floorY); y--) putBlock({ x: wx, y, z: wz, id: gid, data: 0 }, 'asset', inst);
                };
                for (const [k, by] of footprint) { const p = k.split(','); fillCol(+p[0], +p[1], by - 1); filled.add(k); }
                // anneaux de bordure en pente (1 bloc de moins par anneau)
                let frontier = Array.from(footprint.keys()).map(k => k.split(',').map(Number));
                for (let ring = 1; ring <= 3; ring++) {
                    const next = [];
                    for (const [x, z] of frontier) {
                        for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                            const nk = (x+dx) + ',' + (z+dz);
                            if (filled.has(nk)) continue; filled.add(nk);
                            fillCol(x+dx, z+dz, baseY - 1 - ring);
                            next.push([x+dx, z+dz]);
                        }
                    }
                    frontier = next;
                }
            }
        }

        const all = Array.from(blockMap.values());
        if (all.length === 0) {
            alert(window.I18N.t('noBlocksToExport'));
            return;
        }

        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        all.forEach(b => {
            minX = Math.min(minX, b.x); minY = Math.min(minY, b.y); minZ = Math.min(minZ, b.z);
            maxX = Math.max(maxX, b.x); maxY = Math.max(maxY, b.y); maxZ = Math.max(maxZ, b.z);
        });

        const normalized = all.map(b => ({
            x: b.x - minX, y: b.y - minY, z: b.z - minZ,
            id: b.id, data: b.data || 0
        }));

        const exportObj = {
            size: { x: maxX - minX + 1, y: maxY - minY + 1, z: maxZ - minZ + 1 },
            origin: { x: minX, y: minY, z: minZ },
            includesTerrain: !!(this.terrainManager?.hasTerrain() && !terrainSkipped),
            terrainExportSkipped: terrainSkipped,
            blocks: normalized
        };

        this._download(JSON.stringify(exportObj, null, 2), "bloxd_scene_export.json", "application/json");
    }

    _download(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
