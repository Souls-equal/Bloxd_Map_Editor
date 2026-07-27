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
            const template = this.assetManager.templates[inst.name];
            const schem = template?.schemData;
            if (!schem?.blocks) continue;

            const posX = Math.round(inst.position.x);
            const posY = Math.round(inst.position.y);
            const posZ = Math.round(inst.position.z);
            const rot = inst.rotationY;
            const sx = schem.size?.x || 4;
            const sz = schem.size?.z || 4;

            for (const block of schem.blocks) {
                if (!block || block.id === 0) continue;
                let rx = block.x, rz = block.z;
                if (rot === 90) { rx = -block.z + (sz - 1); rz = block.x; }
                else if (rot === 180) { rx = -block.x + (sx - 1); rz = -block.z + (sz - 1); }
                else if (rot === 270) { rx = block.z; rz = -block.x + (sx - 1); }
                putBlock({
                    x: posX + rx, y: posY + block.y, z: posZ + rz,
                    id: block.id, data: block.data || 0
                }, 'asset', inst);
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