/* Aperçu isométrique des schems chargés dans Schem Placer. */
(function (global) {
    'use strict';
    const CHUNK = 32;
    const delay = () => new Promise(resolve => setTimeout(resolve, 0));

    // Les gros schems sont agrégés en voxels plus grands pour limiter le coût
    // de l'image. Chaque bloc est néanmoins considéré, y compris les détails fins.
    async function collectVoxels(schem, isCurrent) {
        const box = schem.aabb;
        const sx = box.maxX - box.minX + 1, sy = box.maxY - box.minY + 1, sz = box.maxZ - box.minZ + 1;
        const step = Math.max(1, Math.ceil(Math.max(sx, sy, sz) / 64), Math.ceil(Math.cbrt((schem.totalBlocks || 0) / 50000)));
        const dx = Math.ceil(sx / step), dy = Math.ceil(sy / step), dz = Math.ceil(sz / step);
        const key = (x, y, z) => (x * dy + y) * dz + z;
        const cells = new Map();
        let deadline = performance.now() + 8;
        for (const [chunkKey, arr] of schem.blocks) {
            const [cx, cy, cz] = chunkKey.split(',').map(Number);
            for (let i = 0; i < arr.length; i++) {
                const id = arr[i];
                if (!id) continue;
                const wx = cx * CHUNK + (i >> 10), wy = cy * CHUNK + ((i >> 5) & 31), wz = cz * CHUNK + (i & 31);
                const x = Math.floor((wx - box.minX) / step), y = Math.floor((wy - box.minY) / step), z = Math.floor((wz - box.minZ) / step);
                if (x < 0 || x >= dx || y < 0 || y >= dy || z < 0 || z >= dz) continue;
                const k = key(x, y, z), depth = wx + wy + wz;
                const old = cells.get(k);
                if (!old || depth > old.depth) cells.set(k, { x, y, z, id, depth });
            }
            if (performance.now() >= deadline) {
                await delay();
                if (!isCurrent()) return null;
                deadline = performance.now() + 8;
            }
        }
        return { cells, key, dx, dy, dz };
    }

    async function draw(canvas, schem, isCurrent) {
        const data = await collectVoxels(schem, isCurrent);
        if (!data || !isCurrent()) return false;
        const { cells, key, dx, dy, dz } = data;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!cells.size) return false;
        const scale = Math.min((canvas.width - 36) / ((dx + dz) * Math.sqrt(3) / 2), (canvas.height - 36) / ((dx + dz) / 2 + dy));
        const centerX = canvas.width / 2 - (dx - dz) * Math.sqrt(3) / 4 * scale;
        const centerY = canvas.height / 2 - ((dx + dz) / 4 - dy / 2) * scale;
        const face = (corners, color, shade) => {
            ctx.fillStyle = `rgb(${Math.round(((color >> 16) & 255) * shade)},${Math.round(((color >> 8) & 255) * shade)},${Math.round((color & 255) * shade)})`;
            ctx.beginPath();
            corners.forEach(([x, y, z], i) => {
                const px = centerX + (x - z) * Math.sqrt(3) / 2 * scale;
                const py = centerY + ((x + z) / 2 - y) * scale;
                if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
            });
            ctx.closePath(); ctx.fill();
        };
        const voxels = Array.from(cells.values()).sort((a, b) => a.x + a.y + a.z - b.x - b.y - b.z);
        let deadline = performance.now() + 8;
        for (const b of voxels) {
            const { x, y, z } = b;
            const color = global.BloxdBlockColors ? global.BloxdBlockColors.hex(b.id) : 0x808080;
            if (z + 1 >= dz || !cells.has(key(x, y, z + 1))) face([[x,y,z+1],[x+1,y,z+1],[x+1,y+1,z+1],[x,y+1,z+1]], color, 0.72);
            if (x + 1 >= dx || !cells.has(key(x + 1, y, z))) face([[x+1,y,z],[x+1,y,z+1],[x+1,y+1,z+1],[x+1,y+1,z]], color, 0.86);
            if (y + 1 >= dy || !cells.has(key(x, y + 1, z))) face([[x,y+1,z],[x+1,y+1,z],[x+1,y+1,z+1],[x,y+1,z+1]], color, 1);
            if (performance.now() >= deadline) {
                await delay();
                if (!isCurrent()) return false;
                deadline = performance.now() + 8;
            }
        }
        return isCurrent();
    }

    class SchemHoverPreview {
        constructor(list, panel, translate) {
            this.list = list; this.panel = panel; this.translate = translate;
            this.token = 0; this.timer = null; this.instance = null;
            list.addEventListener('scroll', () => this.hide(), { passive: true });
            global.addEventListener('resize', () => this.hide());
            global.addEventListener('blur', () => this.hide());
        }
        attach(item, instance) {
            item.addEventListener('pointerenter', e => {
                if (e.pointerType === 'touch') return;
                this.hide();
                this.instance = instance;
                const token = this.token;
                this.timer = setTimeout(() => this.show(item, instance, token), 180);
            });
            item.addEventListener('pointerleave', () => { if (this.instance === instance) this.hide(); });
            item.addEventListener('pointerdown', () => this.hide());
        }
        hide() {
            clearTimeout(this.timer); this.timer = null;
            this.token++; this.instance = null;
            if (this.element) this.element.hidden = true;
        }
        async show(item, instance, token) {
            if (this.token !== token || !item.isConnected) return;
            if (!this.element) {
                this.element = document.createElement('div');
                this.element.className = 'schem-hover-preview';
                this.element.setAttribute('aria-hidden', 'true');
                this.element.innerHTML = '<div class="schem-preview-name"></div><canvas width="440" height="340"></canvas><div class="schem-preview-status"></div>';
                document.body.appendChild(this.element);
            }
            const el = this.element, canvas = el.querySelector('canvas'), status = el.querySelector('.schem-preview-status');
            el.querySelector('.schem-preview-name').textContent = instance.name;
            canvas.hidden = true; status.hidden = false; status.textContent = this.translate('preview_loading');
            el.hidden = false;
            const rect = item.getBoundingClientRect(), panel = this.panel.getBoundingClientRect();
            const right = panel.right + 10;
            const left = right + el.offsetWidth <= global.innerWidth ? right : panel.left - el.offsetWidth - 10;
            el.style.left = Math.max(4, Math.min(left, global.innerWidth - el.offsetWidth - 4)) + 'px';
            el.style.top = Math.max(4, Math.min(rect.top, global.innerHeight - el.offsetHeight - 4)) + 'px';
            const isCurrent = () => this.token === token && item.isConnected;
            try {
                const ok = await draw(canvas, instance.schem, isCurrent);
                if (!isCurrent()) return;
                if (ok) { status.hidden = true; canvas.hidden = false; }
                else status.textContent = this.translate('preview_empty');
            } catch (e) {
                if (isCurrent()) status.textContent = this.translate('preview_empty');
                console.error('Schematic preview:', e);
            }
        }
    }
    global.SchemHoverPreview = SchemHoverPreview;
    // Exposé aussi pour les tests, sans dépendance au moteur 3D.
    SchemHoverPreview.draw = draw;
})(window);
