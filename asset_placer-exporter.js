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
            // Auto-terraform : remplit du terrain (matériau du sol) sous chaque colonne du schem.
            if (footprint) {
                const tm = this.terrainManager;
                for (const [k, baseY] of footprint) {
                    const p = k.split(','); const wx = +p[0], wz = +p[1];
                    let gid = (tm && tm.getSurfaceBlockAtWorld) ? tm.getSurfaceBlockAtWorld(wx, wz) : null;
                    if (!gid) gid = 2; // dirt
                    for (let y = baseY - 1; y >= baseY - 5; y--) {
                        putBlock({ x: wx, y, z: wz, id: gid, data: 0 }, 'asset', inst);
                    }
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
