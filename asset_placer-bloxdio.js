/**
 * asset_placer-bloxdio.js
 * Lecture & écriture du format binaire .bloxdschem (Avro v0, RLE LEB128).
 */

(function (global) {
    'use strict';

    function readUvarint(buf, off) {
        let x = 0, s = 0, b;
        for (let i = 0; i < 10; i++) {
            if (off.value >= buf.length) throw new Error("uvarint: fin de buffer prématurée");
            b = buf[off.value++];
            if (b < 0x80) return x | (b << s);
            x |= (b & 0x7f) << s;
            s += 7;
        }
        throw new Error("uvarint: trop long");
    }

    function writeUvarint(n) {
        n = Math.floor(n);
        const out = [];
        while (n >= 0x80) {
            out.push((n & 0x7f) | 0x80);
            n = Math.floor(n / 128);
        }
        out.push(n & 0x7f);
        return new Uint8Array(out);
    }

    function readAvroInt(buf, off) {
        const zz = readUvarint(buf, off);
        return (zz >>> 1) ^ -(zz & 1);
    }

    function writeAvroInt(n) {
        n = Math.floor(n);
        const zz = n < 0 ? ((-n) * 2 - 1) : (n * 2);
        return writeUvarint(zz);
    }

    function readAvroString(buf, off) {
        const len = readAvroInt(buf, off);
        if (len < 0) throw new Error("avro string: longueur négative");
        if (off.value + len > buf.length) throw new Error("avro string: dépasse la fin");
        const bytes = buf.subarray(off.value, off.value + len);
        off.value += len;
        return new TextDecoder("utf-8").decode(bytes);
    }

    function writeAvroString(s) {
        const enc = new TextEncoder().encode(s);
        const lenBuf = writeAvroInt(enc.length);
        const res = new Uint8Array(lenBuf.length + enc.length);
        res.set(lenBuf, 0);
        res.set(enc, lenBuf.length);
        return res;
    }

    function readAvroBytes(buf, off) {
        const len = readAvroInt(buf, off);
        if (len < 0) throw new Error("avro bytes: longueur négative");
        if (off.value + len > buf.length) throw new Error("avro bytes: dépasse la fin");
        const bytes = buf.slice(off.value, off.value + len);
        off.value += len;
        return bytes;
    }

    function writeAvroBytes(b) {
        const lenBuf = writeAvroInt(b.length);
        const res = new Uint8Array(lenBuf.length + b.length);
        res.set(lenBuf, 0);
        res.set(b, lenBuf.length);
        return res;
    }

    function concatBytes(parts) {
        let total = 0;
        for (const p of parts) total += p.length;
        const res = new Uint8Array(total);
        let o = 0;
        for (const p of parts) { res.set(p, o); o += p.length; }
        return res;
    }

    const CHUNK = 32;
    const CHUNK_VOL = CHUNK * CHUNK * CHUNK;

    function decodeChunkRLE(rleBytes) {
        const blocks = new Int32Array(CHUNK_VOL);
        let pos = { value: 0 };
        let i = 0;
        while (i < CHUNK_VOL) {
            const count = readUvarint(rleBytes, pos);
            const bid = readUvarint(rleBytes, pos);
            for (let k = 0; k < count && i < CHUNK_VOL; k++) blocks[i++] = bid;
        }
        return blocks;
    }

    function encodeChunkRLE(blocks) {
        const parts = [];
        let i = 0;
        while (i < blocks.length) {
            let curr = blocks[i];
            let run = 1;
            while (i + run < blocks.length && blocks[i + run] === curr && run < 0x7fffffff) run++;
            parts.push(writeUvarint(run));
            parts.push(writeUvarint(curr));
            i += run;
        }
        return concatBytes(parts);
    }

    const AIR_ID = 0;

    function parseSchem(buffer) {
        const buf = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        const off = { value: 0 };

        for (let i = 0; i < 4; i++) {
            if (buf[off.value++] !== 0) {
                console.warn("BloxdSchem: header non nul à l'octet", i);
                break;
            }
        }

        const name = readAvroString(buf, off);
        const px = readAvroInt(buf, off);
        const py = readAvroInt(buf, off);
        const pz = readAvroInt(buf, off);
        const sx = readAvroInt(buf, off);
        const sy = readAvroInt(buf, off);
        const sz = readAvroInt(buf, off);

        const blocks = new Map();
        let totalBlocks = 0;

        while (true) {
            let blockCount = readAvroInt(buf, off);
            if (blockCount === 0) break;
            if (blockCount < 0) {
                blockCount = -blockCount;
                readAvroInt(buf, off);
            }
            for (let i = 0; i < blockCount; i++) {
                const cx = readAvroInt(buf, off);
                const cy = readAvroInt(buf, off);
                const cz = readAvroInt(buf, off);
                const rle = readAvroBytes(buf, off);
                const arr = decodeChunkRLE(rle);

                let nonAir = 0;
                for (let k = 0; k < arr.length; k++) if (arr[k] !== AIR_ID) nonAir++;
                if (nonAir === 0) continue;

                blocks.set(cx + "," + cy + "," + cz, arr);
                totalBlocks += nonAir;
            }
        }

        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        blocks.forEach((arr, key) => {
            const [cx, cy, cz] = key.split(",").map(Number);
            const bx0 = px + cx * CHUNK;
            const by0 = py + cy * CHUNK;
            const bz0 = pz + cz * CHUNK;
            for (let lx = 0; lx < CHUNK; lx++) {
                for (let ly = 0; ly < CHUNK; ly++) {
                    for (let lz = 0; lz < CHUNK; lz++) {
                        const bid = arr[lx * 1024 + ly * 32 + lz];
                        if (bid === AIR_ID) continue;
                        const wx = bx0 + lx, wy = by0 + ly, wz = bz0 + lz;
                        minX = Math.min(minX, wx);
                        minY = Math.min(minY, wy);
                        minZ = Math.min(minZ, wz);
                        maxX = Math.max(maxX, wx);
                        maxY = Math.max(maxY, wy);
                        maxZ = Math.max(maxZ, wz);
                    }
                }
            }
        });

        if (!isFinite(minX)) { minX = px; minY = py; minZ = pz; maxX = px; maxY = py; maxZ = pz; }

        const normBlocks = new Map();
        blocks.forEach((arr, key) => {
            const [scx, scy, scz] = key.split(",").map(Number);
            const chunkWX0 = px + scx * CHUNK;
            const chunkWY0 = py + scy * CHUNK;
            const chunkWZ0 = pz + scz * CHUNK;
            for (let lx = 0; lx < CHUNK; lx++) {
                for (let ly = 0; ly < CHUNK; ly++) {
                    for (let lz = 0; lz < CHUNK; lz++) {
                        const bid = arr[lx * 1024 + ly * 32 + lz];
                        if (bid === AIR_ID) continue;
                        const wx = chunkWX0 + lx;
                        const wy = chunkWY0 + ly;
                        const wz = chunkWZ0 + lz;
                        const nx = wx - minX;
                        const ny = wy - minY;
                        const nz = wz - minZ;
                        const ncx = Math.floor(nx / CHUNK);
                        const ncy = Math.floor(ny / CHUNK);
                        const ncz = Math.floor(nz / CHUNK);
                        const nkey = ncx + "," + ncy + "," + ncz;
                        let nArr = normBlocks.get(nkey);
                        if (!nArr) { nArr = new Int32Array(CHUNK_VOL); normBlocks.set(nkey, nArr); }
                        const nlx = nx - ncx * CHUNK;
                        const nly = ny - ncy * CHUNK;
                        const nlz = nz - ncz * CHUNK;
                        nArr[nlx * 1024 + nly * 32 + nlz] = bid;
                    }
                }
            }
        });

        const sizeX = maxX - minX + 1;
        const sizeY = maxY - minY + 1;
        const sizeZ = maxZ - minZ + 1;

        return {
            name,
            rawPos: { x: px, y: py, z: pz },
            rawSize: { x: sx, y: sy, z: sz },
            blocks: normBlocks,
            nonEmptyChunks: normBlocks.size,
            totalBlocks,
            aabb: { minX: 0, minY: 0, minZ: 0, maxX: sizeX - 1, maxY: sizeY - 1, maxZ: sizeZ - 1 },
            size: { x: sizeX, y: sizeY, z: sizeZ }
        };
    }

    function buildMergedSchem(instances, name = "Merged Schem") {
        let gMinX = Infinity, gMinY = Infinity, gMinZ = Infinity;
        let gMaxX = -Infinity, gMaxY = -Infinity, gMaxZ = -Infinity;

        for (const inst of instances) {
            const s = inst.schem;
            const b = s.aabb;
            const x0 = inst.pos.x, y0 = inst.pos.y, z0 = inst.pos.z;
            const x1 = x0 + (b.maxX - b.minX);
            const y1 = y0 + (b.maxY - b.minY);
            const z1 = z0 + (b.maxZ - b.minZ);
            gMinX = Math.min(gMinX, x0);
            gMinY = Math.min(gMinY, y0);
            gMinZ = Math.min(gMinZ, z0);
            gMaxX = Math.max(gMaxX, x1);
            gMaxY = Math.max(gMaxY, y1);
            gMaxZ = Math.max(gMaxZ, z1);
        }

        if (!isFinite(gMinX)) {
            gMinX = 0; gMinY = 0; gMinZ = 0; gMaxX = 31; gMaxY = 31; gMaxZ = 31;
        }

        const worldMinX = Math.floor(gMinX / CHUNK) * CHUNK;
        const worldMinY = 0;
        const worldMinZ = Math.floor(gMinZ / CHUNK) * CHUNK;
        const worldMaxX = Math.ceil((gMaxX + 1) / CHUNK) * CHUNK;
        const worldMaxY = Math.ceil((gMaxY + 1) / CHUNK) * CHUNK;
        const worldMaxZ = Math.ceil((gMaxZ + 1) / CHUNK) * CHUNK;

        const sizeX = worldMaxX - worldMinX;
        const sizeY = worldMaxY - worldMinY;
        const sizeZ = worldMaxZ - worldMinZ;

        const worldChunks = new Map();
        const getChunkArr = (cx, cy, cz) => {
            const key = cx + "," + cy + "," + cz;
            let arr = worldChunks.get(key);
            if (!arr) { arr = new Int32Array(CHUNK_VOL); worldChunks.set(key, arr); }
            return arr;
        };

        for (const inst of instances) {
            const s = inst.schem;
            const ox = inst.pos.x;
            const oy = inst.pos.y;
            const oz = inst.pos.z;
            s.blocks.forEach((arr, key) => {
                const [ncx, ncy, ncz] = key.split(",").map(Number);
                for (let lx = 0; lx < CHUNK; lx++) {
                    for (let ly = 0; ly < CHUNK; ly++) {
                        for (let lz = 0; lz < CHUNK; lz++) {
                            const bid = arr[lx * 1024 + ly * 32 + lz];
                            if (bid === AIR_ID) continue;
                            const nx = ncx * CHUNK + lx;
                            const ny = ncy * CHUNK + ly;
                            const nz = ncz * CHUNK + lz;
                            const wx = ox + nx;
                            const wy = oy + ny;
                            const wz = oz + nz;
                            const cx = Math.floor((wx - worldMinX) / CHUNK);
                            const cy = Math.floor((wy - worldMinY) / CHUNK);
                            const cz = Math.floor((wz - worldMinZ) / CHUNK);
                            const clx = ((wx - worldMinX) % CHUNK + CHUNK) % CHUNK;
                            const cly = ((wy - worldMinY) % CHUNK + CHUNK) % CHUNK;
                            const clz = ((wz - worldMinZ) % CHUNK + CHUNK) % CHUNK;
                            const cArr = getChunkArr(cx, cy, cz);
                            cArr[clx * 1024 + cly * 32 + clz] = bid;
                        }
                    }
                }
            });
        }

        const parts = [];
        parts.push(new Uint8Array([0, 0, 0, 0]));
        parts.push(writeAvroString(name));
        parts.push(writeAvroInt(0));
        parts.push(writeAvroInt(0));
        parts.push(writeAvroInt(0));
        parts.push(writeAvroInt(sizeX));
        parts.push(writeAvroInt(sizeY));
        parts.push(writeAvroInt(sizeZ));

        const nCX = Math.round(sizeX / CHUNK);
        const nCY = Math.round(sizeY / CHUNK);
        const nCZ = Math.round(sizeZ / CHUNK);
        const airRle = encodeChunkRLE(new Int32Array(CHUNK_VOL));
        const allChunkKeys = [];
        for (let cx = 0; cx < nCX; cx++) {
            for (let cy = 0; cy < nCY; cy++) {
                for (let cz = 0; cz < nCZ; cz++) {
                    allChunkKeys.push(cx + "," + cy + "," + cz);
                }
            }
        }
        const totalChunks = allChunkKeys.length;
        parts.push(writeAvroInt(totalChunks));
        for (const key of allChunkKeys) {
            const [cx, cy, cz] = key.split(",").map(Number);
            parts.push(writeAvroInt(cx));
            parts.push(writeAvroInt(cy));
            parts.push(writeAvroInt(cz));
            const cArr = worldChunks.get(key);
            parts.push(writeAvroBytes(cArr ? encodeChunkRLE(cArr) : airRle));
        }
        parts.push(writeAvroInt(0));

        const bytes = concatBytes(parts);
        return {
            bytes,
            origin: { x: worldMinX, y: worldMinY, z: worldMinZ },
            size: { x: sizeX, y: sizeY, z: sizeZ },
            totalChunks
        };
    }

    const BLOCK_COLORS = { /* ... same as before ... */ 
        0: 0x000000, 1: 0x111111, 2: 0x6b4423, 3: 0x7a5434, 4: 0x4ea64e,
        /* (full palette omitted for brevity but identical to previous) */
    };

    function getBlockColor(id) {
        return BLOCK_COLORS[id] !== undefined ? BLOCK_COLORS[id] : 0xb08060;
    }

    global.BloxdIO = {
        parseSchem,
        buildMergedSchem,
        getBlockColor,
        CHUNK,
        CHUNK_VOL,
        AIR_ID
    };

})(window);