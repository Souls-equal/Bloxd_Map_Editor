/**
 * schem_converter-core.js — Convertit des schematics Minecraft en .bloxdschem (Bloxd.io)
 * ─────────────────────────────────────────────────────────────────────────────────────
 * Formats d'entrée supportés :
 *   • .schem     — Sponge Schematic v1 / v2 / v3 (WorldEdit, Amulet, litematica→schem…)
 *   • .schematic — MCEdit / WorldEdit legacy (IDs numériques + Data values + AddBlocks)
 *   • .litematic — Litematica (multi-régions, bit-packed BlockStates)
 *
 * La logique de conversion et les tables de correspondance de blocs sont basées sur les
 * projets open-source existants qui faisaient déjà ce travail :
 *   • M2B — RealSlothuLT3 / Quentin-X  (https://github.com/Quentin-X/M2B) — licence ISC
 *   • Converter — hansdiewurst         (https://github.com/hansdiewurst/converter)
 *   • Convention d'indexage Litematica vérifiée contre le mod lui-même (masa/litematica)
 *     et la lib Python litemapy (SmylerMC/litemapy).
 *
 * L'encodage .bloxdschem (Avro + RLE par chunks 32³) est identique à celui utilisé par
 * le reste de la suite (voir schem_splitter.js / schem_placer.js) :
 *   [4 octets 0][nom zigzag-string][x,y,z zigzag][sizeX,Y,Z zigzag][nb chunks zigzag]
 *   puis par chunk : [cx,cy,cz zigzag][RLE zigzag-non-signé : (count,id)*][0]
 *   Index bloc dans un chunk : lx*1024 + ly*32 + lz.
 *
 * Conversion MC → Bloxd : l'axe Z est inversé (z_bloxd = L-1-z_mc), X et Y inchangés
 * (Bloxd et Minecraft n'ont pas la même main ; même comportement que M2B/hansdiewurst).
 *
 * Fichier sans dépendance DOM : utilisable dans le navigateur (window.BloxdSchemConverter)
 * ou sous Node pour les tests (module.exports).
 */
(function (global) {
'use strict';

var CHUNK = 32, CHUNK_VOL = 32 * 32 * 32;
var AIR = 0, DIRT = 2;                 // ids Bloxd
var MAX_CHUNKS_PER_FILE = 160;         // limite Bloxd (même seuil que Schem Placer)

// ═══════════════════════════════════════════════════════════════════════════
//  Varint / zigzag (identique au reste de la suite)
// ═══════════════════════════════════════════════════════════════════════════
function wuv(n) { n = Math.floor(n); var o = []; while (n >= 128) { o.push((n & 127) | 128); n = Math.floor(n / 128); } o.push(n & 127); return new Uint8Array(o); }
function wai(n) { n = Math.floor(n); return wuv(n < 0 ? ((-n) * 2 - 1) : (n * 2)); }
function was(s) { var e = new TextEncoder().encode(s), l = wai(e.length), r = new Uint8Array(l.length + e.length); r.set(l, 0); r.set(e, l.length); return r; }
function wab(b) { var l = wai(b.length), r = new Uint8Array(l.length + b.length); r.set(l, 0); r.set(b, l.length); return r; }
function cat(parts) { var t = 0, i; for (i = 0; i < parts.length; i++) t += parts[i].length; var r = new Uint8Array(t), o = 0; for (i = 0; i < parts.length; i++) { r.set(parts[i], o); o += parts[i].length; } return r; }
function ruv(b, o) { var x = 0, s = 0, i, c; for (i = 0; i < 10; i++) { if (o.v >= b.length) break; c = b[o.v++]; if (c < 128) return x | (c << s); x |= (c & 127) << s; s += 7; } return x; }
function rai(b, o) { var z = ruv(b, o); return (z >>> 1) ^ -(z & 1); }

// ═══════════════════════════════════════════════════════════════════════════
//  Données (injectées via init()) : tables extraites de M2B + nameToId du dépôt
// ═══════════════════════════════════════════════════════════════════════════
var MAP = null;        // { m2b, legacy, stairs }
var NAME_TO_ID = null; // { "Nom Bloxd": id }
var ID_TO_NAME = null; // inverse de NAME_TO_ID
var USER_MAP = {};     // correspondances manuelles { "mc_base_name": "Nom Bloxd" }

function init(data) {
    MAP = data.map || null;
    NAME_TO_ID = data.nameToId || null;
    ID_TO_NAME = {};
    if (NAME_TO_ID) for (var k in NAME_TO_ID) if (ID_TO_NAME[NAME_TO_ID[k]] === undefined) ID_TO_NAME[NAME_TO_ID[k]] = k;
    USER_MAP = data.userMap || {};
}

// ═══════════════════════════════════════════════════════════════════════════
//  NBT (big-endian) — lecture gzip via DecompressionStream, sinon NBT brut
// ═══════════════════════════════════════════════════════════════════════════
var TAG = { END: 0, BYTE: 1, SHORT: 2, INT: 3, LONG: 4, FLOAT: 5, DOUBLE: 6, BYTE_ARRAY: 7, STRING: 8, LIST: 9, COMPOUND: 10, INT_ARRAY: 11, LONG_ARRAY: 12 };

async function gunzip(u8) {
    if (typeof DecompressionStream === 'undefined')
        throw new Error('DecompressionStream non disponible (navigateur trop ancien)');
    var ds = new DecompressionStream('gzip');
    var stream = new Blob([u8]).stream().pipeThrough(ds);
    var buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
}

function NBTReader(buf) {
    this.b = buf; this.v = 0;
    this.dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
}
NBTReader.prototype = {
    u8: function () { return this.b[this.v++]; },
    i16: function () { var r = this.dv.getInt16(this.v); this.v += 2; return r; },
    i32: function () { var r = this.dv.getInt32(this.v); this.v += 4; return r; },
    i64: function () { var r = this.dv.getBigInt64(this.v); this.v += 8; return r; },
    f32: function () { var r = this.dv.getFloat32(this.v); this.v += 4; return r; },
    f64: function () { var r = this.dv.getFloat64(this.v); this.v += 8; return r; },
    str: function () { var l = this.dv.getUint16(this.v); this.v += 2; var s = new TextDecoder('utf-8').decode(this.b.subarray(this.v, this.v + l)); this.v += l; return s; },
    byteArray: function () { var l = this.i32(); var r = new Uint8Array(this.b.subarray(this.v, this.v + l)); this.v += l; return r; },
    intArray: function () { var l = this.i32(), r = new Int32Array(l), i; for (i = 0; i < l; i++) r[i] = this.i32(); return r; },
    longArray: function () { var l = this.i32(); var r = new BigInt64Array(l), i; for (i = 0; i < l; i++) r[i] = this.i64(); return r; },
    payload: function (t) {
        var r, i, n, id;
        switch (t) {
            case TAG.BYTE: return this.u8() << 24 >> 24; // signé
            case TAG.SHORT: return this.i16();
            case TAG.INT: return this.i32();
            case TAG.LONG: return this.i64();
            case TAG.FLOAT: return this.f32();
            case TAG.DOUBLE: return this.f64();
            case TAG.BYTE_ARRAY: return this.byteArray();
            case TAG.STRING: return this.str();
            case TAG.LIST:
                id = this.u8(); n = this.i32(); r = [];
                if (id === TAG.END) { if (n !== 0) throw new Error('Liste NBT END non vide'); return r; }
                for (i = 0; i < n; i++) r.push(this.payload(id));
                return r;
            case TAG.COMPOUND:
                r = {};
                while (true) {
                    id = this.u8();
                    if (id === TAG.END) return r;
                    var name = this.str();
                    r[name] = this.payload(id);
                }
            case TAG.INT_ARRAY: return this.intArray();
            case TAG.LONG_ARRAY: return this.longArray();
        }
        throw new Error('Tag NBT inconnu : ' + t);
    }
};

async function parseNBT(bytes) {
    var u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    // gzip (1f 8b) → décompresser ; sinon NBT brut (certains exports ne sont pas compressés)
    if (u8.length > 2 && u8[0] === 0x1f && u8[1] === 0x8b) u8 = await gunzip(u8);
    if (u8.length < 3 || u8[0] !== TAG.COMPOUND) throw new Error('Pas un fichier NBT valide');
    var rd = new NBTReader(u8);
    rd.u8();           // TAG_Compound racine
    rd.str();          // nom de la racine (souvent "Schematic" ou "")
    return rd.payload(TAG.COMPOUND);
}

// ═══════════════════════════════════════════════════════════════════════════
//  Conversion d'identifiants de blocs (portage de M2B block-conversion.js)
// ═══════════════════════════════════════════════════════════════════════════
function getBlockstates(name) {
    if (name.indexOf('[') === -1) return {};
    var states = {}, s = name.split('[')[1].replace(']', '');
    var pairs = s.split(','), i, p;
    for (i = 0; i < pairs.length; i++) { p = pairs[i].split('='); states[p[0]] = p[1]; }
    return states;
}

// mcId : "minecraft:oak_log[axis=y]", "stone", "minecraft:wool", …
// Retourne l'id numérique Bloxd (0 = air, 2 = dirt par défaut si inconnu).
var _m2bCache = {};
function mcToBloxdId(mcId, unknownSink) {
    if (!MAP || !NAME_TO_ID) throw new Error('BloxdSchemConverter.init() non appelé');

    var baseRaw = mcId.split('[')[0].replace(/^minecraft:/, '');

    // 1) correspondance manuelle de l'utilisateur (clé = nom de base, sans états)
    if (USER_MAP[baseRaw] !== undefined) {
        var uid = NAME_TO_ID[USER_MAP[baseRaw]];
        if (uid !== undefined) return uid;
    }

    var cached = _m2bCache[mcId];
    if (cached !== undefined) return cached;

    var id = mcId
        .replace(/minecraft:|potted_|flowing_|infested_|_pane|(_gate|_wall)(?=$|\[)|_powder|.*(?=sign(?=$|\[))/g, '')
        .replace('fence', 'planks')
        .replace(/brick(?=$|\[)/g, 'bricks');

    // Blocs sans équivalent Bloxd → air (comme M2B)
    if (id.match(/_(button|head|skull|pot|banner)|candle|cake|rail|torch(?=$|\[)|pressure_plate|coral(?!_block)/)) {
        _m2bCache[mcId] = AIR; return AIR;
    }

    var states = getBlockstates(id);

    // Escaliers et dalles doubles → bloc plein
    if (id.indexOf('stairs') !== -1 || (id.indexOf('slab') !== -1 && states.type === 'double')) {
        var full = id.split('[')[0].replace(/_(stairs|slab)/g, '');
        id = MAP.stairs[full] || full;
        states = {};
    }

    var bloxdId = MAP.m2b[id.split('[')[0]];
    var baseName = ID_TO_NAME[bloxdId];
    var metaStr = '';

    if (!baseName) {
        // pas d'équivalent → dirt (comme M2B). Non mis en cache pour que le
        // "unknownSink" (et un éventuel mapping utilisateur) soient re-consultés.
        if (unknownSink) unknownSink[baseRaw] = (unknownSink[baseRaw] || 0) + 1;
        return DIRT;
    }

    var sides = { north: 1, east: 2, south: 3, west: 4, up: 3 };
    var invertedSides = { north: 3, east: 4, south: 1, west: 2, up: 1 };
    var useInverted = false;

    if (id.indexOf('vine') !== -1) {
        for (var sn in states) {
            if (sides.hasOwnProperty(sn) && states[sn] === 'true') {
                useInverted = true; states = { facing: sn }; break;
            }
        }
    }

    if (states.half === 'upper') {
        if (id.indexOf('door') !== -1) baseName = '_' + baseName + ' Top';
        else if (baseName === 'Tall Grass') metaStr = '|Top';
    } else if (states.part) {
        if (states.part === 'head') baseName = '_' + baseName + ' Head';
        useInverted = true;
    }

    if (id.indexOf('slab') !== -1 && states.type === 'top') {
        metaStr = '|meta|rot1|top';
    } else if (states.facing) {
        var rot = useInverted ? invertedSides[states.facing] : sides[states.facing];
        metaStr = '|meta|rot' + rot;
        if (states.hasOwnProperty('open')) metaStr += states.open === 'true' ? '|open' : '|closed';
    }
    metaStr = metaStr.replace(/\|meta\|rot1(?=$)/, '');

    var result = NAME_TO_ID[baseName + metaStr] !== undefined ? NAME_TO_ID[baseName + metaStr]
        : (NAME_TO_ID[baseName] !== undefined ? NAME_TO_ID[baseName] : DIRT);
    _m2bCache[mcId] = result;
    return result;
}

// IDs numériques legacy (MCEdit .schematic) → id alphanumérique Minecraft (portage M2B)
var _FACINGS = ['south', 'west', 'north', 'east'];
var _FACINGS2 = ['north', 'south', 'west', 'east'];
var _WOOD = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak'];
var _COLORS = ['white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray', 'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black'];
function mcNumToStr(block, data) {
    var name = MAP.legacy[block + ':' + data] !== undefined ? MAP.legacy[block + ':' + data]
        : (MAP.legacy[block] !== undefined ? MAP.legacy[block] : 'minecraft:dirt');

    // Les valeurs sans préfixe "minecraft:" demandent une décoration via la data value
    if (name.indexOf('minecraft:') === 0) return name;

    if (name === 'farmland') name += '[age=' + data + ']';
    else if (name === 'anvil' || name.indexOf('_glazed_terracotta') !== -1 || name === 'pumpkin' || name === 'jack_o_lantern') {
        name += '[facing=' + _FACINGS[data % 4] + ']';
    } else if (name === 'command_block' || name === 'observer' || name === 'ladder' || name === 'furnace' || name.indexOf('chest') !== -1) {
        data %= 8;
        if (data >= 2 && data <= 5) name += '[facing=' + _FACINGS2[data - 2] + ']';
    } else if (name === 'bed') {
        name = 'red_bed[facing=' + _FACINGS[data % 8] + ',part=' + (data >= 8 ? 'head' : 'foot') + ']';
    } else if (name === 'oak_trapdoor' || name === 'iron_trapdoor') {
        data %= 8;
        name += '[facing=' + _FACINGS[data % 4] + ',open=' + (data >= 4) + ']';
    } else if (name === 'wool' || name === 'stained_glass' || name === 'stained_glass_pane' || name === 'terracotta' || name === 'carpet' || name === 'concrete' || name === 'concrete powder') {
        name = _COLORS[data] + '_' + name;
    } else if (name === 'double_plant') {
        if (data <= 5) name = ['sunflower', 'lilac', 'tall_grass', 'large_fern', 'rose_bush', 'peony'][data];
    } else if (name === 'planks' || name === 'sapling') {
        name = _WOOD[data % 8] + '_' + name;
    } else if (name === 'wooden_slab' || name === 'double_wooden_slab') {
        name = _WOOD[data % 8] + '_slab[type=' + (name.indexOf('double_') === 0 ? 'double' : (data >= 8 ? 'top' : 'bottom')) + ']';
    } else if (name === 'stone_slab' || name === 'double_stone_slab') {
        data %= 8;
        var stoneSlabs = ['stone', 'sandstone', 'petrified_oak', 'cobblestone', 'brick', 'stone_brick', 'nether_brick', 'quartz'];
        if (name.indexOf('2') !== -1) { data += 8; name = name.substring(0, name.length - 1); }
        name = stoneSlabs[data] + '_slab[type=' + (name.indexOf('double_') === 0 ? 'double' : (data >= 8 ? 'top' : 'bottom')) + ']';
    } else if (name === 'purpur_slab') {
        name = 'purpur_slab[type=' + (data === 8 ? 'top' : 'bottom') + ']';
    } else if (name.indexOf('leaves') === 0 || name.indexOf('log') === 0) {
        data %= 4;
        if (name.indexOf('2') === name.length - 1) { data += 4; name = name.substring(0, name.length - 1); }
        name = _WOOD[data] + '_' + name;
    } else if (name === 'vines' || name.indexOf('_mushroom_block') !== -1) {
        /* TODO — comme M2B : laissé tel quel */
    } else if (name.indexOf('sandstone') === name.length - 'sandstone'.length && name.length > 0) {
        var ssPre = ['', 'chiseled_', 'smooth_'];
        name = (ssPre[data] || '') + name;
    } else if (name.indexOf('_door') === name.length - '_door'.length && name.indexOf('_door') !== -1) {
        name += '[half=' + (data >= 8 ? 'upper' : 'lower') + ']';
    }

    return 'minecraft:' + (name || 'dirt');
}

// ═══════════════════════════════════════════════════════════════════════════
//  Grille de sortie : Map de chunks 32³ (structure native de la suite)
//  setBlock(x,y,z,id) — coordonnées BLOXD (Z déjà inversée)
// ═══════════════════════════════════════════════════════════════════════════
function BloxdGrid(width, height, length) {
    this.width = width; this.height = height; this.length = length;
    this.chunks = {};          // "cx,cy,cz" -> Int32Array(32768)
    this.total = 0;
    this.mcCount = {};         // stats : "mc:block_name" -> nombre
}
BloxdGrid.prototype.chunk = function (cx, cy, cz) {
    var k = cx + ',' + cy + ',' + cz, a = this.chunks[k];
    if (!a) { a = new Int32Array(CHUNK_VOL); this.chunks[k] = a; }
    return a;
};
BloxdGrid.prototype.setBlock = function (x, y, z, id, mcName) {
    if (x < 0 || y < 0 || z < 0 || x >= this.width || y >= this.height || z >= this.length) return;
    if (id === AIR) { if (mcName) this.mcCount[mcName] = (this.mcCount[mcName] || 0) + 1; return; }
    var cx = Math.floor(x / CHUNK), cy = Math.floor(y / CHUNK), cz = Math.floor(z / CHUNK);
    var a = this.chunk(cx, cy, cz);
    var i = (x - cx * CHUNK) * 1024 + (y - cy * CHUNK) * 32 + (z - cz * CHUNK);
    if (a[i] === AIR) this.total++;
    a[i] = id;
    if (mcName) this.mcCount[mcName] = (this.mcCount[mcName] || 0) + 1;
};

// ═══════════════════════════════════════════════════════════════════════════
//  Parseur Sponge .schem (v1/2/3)
// ═══════════════════════════════════════════════════════════════════════════
function decodeVarints(u8) {
    var out = new Uint32Array(u8.length + 1), n = 0, i = 0, val, shift, b;
    while (i < u8.length) {
        val = 0; shift = 0;
        while (true) {
            if (i >= u8.length) throw new Error('VarInt tronqué (données corrompues)');
            b = u8[i++];
            val |= (b & 127) << shift;
            shift += 7;
            if (shift > 35) throw new Error('VarInt trop grand (données corrompues ?)');
            if ((b & 128) !== 128) break;
        }
        out[n++] = val >>> 0;
    }
    return out.subarray(0, n);
}

function parseSponge(nbt, name, opts) {
    var schem = nbt.Schematic || nbt;   // parfois encapsulé, parfois aplati
    var W = schem.Width, H = schem.Height, L = schem.Length;
    if (typeof W !== 'number' || typeof H !== 'number' || typeof L !== 'number')
        throw new Error('.schem invalide (dimensions manquantes)');
    var varintBlocks, paletteNbt;
    var v = schem.Version;
    if (v === 1 || v === 2) {
        if (!schem.Palette) throw new Error('.schem sans palette');
        varintBlocks = schem.BlockData; paletteNbt = schem.Palette;
    } else if (v === 3) {
        if (!schem.Blocks || !schem.Blocks.Palette) throw new Error('.schem v3 sans Blocks.Palette');
        varintBlocks = schem.Blocks.Data; paletteNbt = schem.Blocks.Palette;
    } else {
        throw new Error('Version de schematic Sponge non supportée : ' + v);
    }
    if (!(varintBlocks instanceof Uint8Array)) throw new Error('.schem sans BlockData');

    // palette : idx → id Bloxd
    var maxIdx = 0, k;
    for (k in paletteNbt) { var pi = paletteNbt[k]; if (pi > maxIdx) maxIdx = pi; }
    var palette = new Int32Array(maxIdx + 1);
    for (k in paletteNbt) palette[paletteNbt[k]] = mcToBloxdId(k, opts.unknown);

    var blocks = decodeVarints(varintBlocks);
    if (blocks.length < W * H * L) throw new Error('BlockData plus court que les dimensions annoncées');

    var grid = new BloxdGrid(W, H, L);
    var i = 0, x, y, z;
    for (y = 0; y < H; y++) {
        for (z = 0; z < L; z++) {
            for (x = 0; x < W; x++) {
                var id = palette[blocks[i++]];
                if (id !== AIR) grid.setBlock(x, y, L - 1 - z, id);   // inversion Z MC→Bloxd
            }
        }
    }
    return grid;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Parseur MCEdit .schematic legacy (IDs numériques)
// ═══════════════════════════════════════════════════════════════════════════
function parseLegacy(nbt, name, opts) {
    var schem = nbt.Schematic || nbt;
    var W = schem.Width, H = schem.Height, L = schem.Length;
    if (typeof W !== 'number' || typeof H !== 'number' || typeof L !== 'number' || !(schem.Blocks instanceof Uint8Array))
        throw new Error('.schematic invalide');
    var data = schem.Data instanceof Uint8Array ? schem.Data : null;

    // AddBlocks : quartets pour les IDs > 255
    var ids = new Uint16Array(schem.Blocks.length);
    var add = schem.AddBlocks instanceof Uint8Array ? schem.AddBlocks : null;
    var i;
    for (i = 0; i < schem.Blocks.length; i++) {
        ids[i] = schem.Blocks[i] & 0xff;
        if (add) {
            var nib = (i & 1) ? (add[i >> 1] & 0x0f) : (add[i >> 1] >> 4);
            ids[i] |= nib << 8;
        }
    }

    // cache (id:data) → id Bloxd
    var cache = {}, grid = new BloxdGrid(W, H, L);
    var idx = 0, x, y, z;
    for (y = 0; y < H; y++) {
        for (z = 0; z < L; z++) {
            for (x = 0; x < W; x++) {
                var id = ids[idx], dv = data ? data[idx] & 0xff : 0;
                idx++;
                if (id === 0) continue;
                var key = id + ':' + dv;
                var bid = cache[key];
                if (bid === undefined) {
                    var mcId = mcNumToStr(id, dv);
                    bid = mcToBloxdId(mcId, opts.unknown);
                    cache[key] = bid;
                }
                if (bid !== AIR) grid.setBlock(x, y, L - 1 - z, bid, 'legacy:' + key);
            }
        }
    }
    return grid;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Parseur Litematica .litematic
//  Indexage vérifié contre LitematicaBlockStateContainer (masa/litematica) :
//    index = y*(sizeX*sizeZ) + z*sizeX + x  (x local au coin MIN de la région)
//  Région : Position P, Size S (signé). Coin min = S>=0 ? P : P+S+1 ; |S| blocs.
// ═══════════════════════════════════════════════════════════════════════════
function litematicReadIndex(longs, bits, index) {
    var startOffset = BigInt(index) * BigInt(bits);
    var startArr = Number(startOffset >> 6n);
    var startBit = startOffset & 63n;
    var endArr = Number((startOffset + BigInt(bits) - 1n) >> 6n);
    var mask = (1n << BigInt(bits)) - 1n;
    var val = longs[startArr] >> startBit;
    if (startArr !== endArr) val |= longs[endArr] << (64n - startBit);
    return Number(val & mask);
}

function parseLitematic(nbt, name, opts) {
    if (!nbt.Metadata || !nbt.Metadata.EnclosingSize || !nbt.Regions)
        throw new Error('.litematic invalide');
    var es = nbt.Metadata.EnclosingSize;
    var W = Math.abs(es.x), H = Math.abs(es.y), L = Math.abs(es.z);
    var grid = new BloxdGrid(W, H, L);

    // 1er passage : coin min de chaque région (gère les tailles négatives,
    // cf. Litematica : coin min = S>=0 ? P : P+S+1) puis origine globale =
    // coin min de TOUTES les régions (les positions peuvent être négatives,
    // l'enclosing box ne démarre pas forcément en (0,0,0) — cf. Lite.litematic).
    var rn, region, P, S;
    var totMinX = Infinity, totMinY = Infinity, totMinZ = Infinity;
    var regions = [];
    for (rn in nbt.Regions) {
        region = nbt.Regions[rn];
        if (!region.Position || !region.Size || !region.BlockStatePalette || !(region.BlockStates instanceof BigInt64Array))
            throw new Error('Région litematic incomplète : ' + rn);
        P = region.Position; S = region.Size;
        var mnX = S.x >= 0 ? P.x : P.x + S.x + 1;
        var mnY = S.y >= 0 ? P.y : P.y + S.y + 1;
        var mnZ = S.z >= 0 ? P.z : P.z + S.z + 1;
        if (mnX < totMinX) totMinX = mnX;
        if (mnY < totMinY) totMinY = mnY;
        if (mnZ < totMinZ) totMinZ = mnZ;
        regions.push({ name: rn, minX: mnX, minY: mnY, minZ: mnZ, raw: region });
    }
    if (!isFinite(totMinX)) { totMinX = totMinY = totMinZ = 0; }

    for (var ri = 0; ri < regions.length; ri++) {
        var info = regions[ri];
        region = info.raw;
        var sx = Math.abs(region.Size.x), sy = Math.abs(region.Size.y), sz = Math.abs(region.Size.z);
        var palette = region.BlockStatePalette;
        var bits = Math.max(2, Math.ceil(Math.log2(Math.max(2, palette.length))));
        var layerSize = sx * sz;
        var expectedLongs = Math.ceil(sx * sy * sz * bits / 64);
        if (region.BlockStates.length < expectedLongs)
            throw new Error('BlockStates trop court pour la région ' + info.name);

        // palette locale → ids Bloxd
        var bloxdPal = new Int32Array(palette.length), p;
        for (p = 0; p < palette.length; p++) {
            var entry = palette[p];
            var mcId = entry.Name || 'minecraft:air';
            if (entry.Properties) {
                var parts = [];
                for (var pk in entry.Properties) parts.push(pk + '=' + entry.Properties[pk]);
                if (parts.length) mcId += '[' + parts.join(',') + ']';
            }
            bloxdPal[p] = mcToBloxdId(mcId, opts.unknown);
        }

        for (var y = 0; y < sy; y++) {
            for (var z = 0; z < sz; z++) {
                for (var x = 0; x < sx; x++) {
                    var li = y * layerSize + z * sx + x;
                    var id = bloxdPal[litematicReadIndex(region.BlockStates, bits, li)];
                    if (id === AIR) continue;
                    var gx = info.minX - totMinX + x;
                    var gy = info.minY - totMinY + y;
                    var gz = info.minZ - totMinZ + z;
                    grid.setBlock(gx, gy, L - 1 - gz, id);   // inversion Z MC→Bloxd
                }
            }
        }
    }
    return grid;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Détection du format + conversion complète
// ═══════════════════════════════════════════════════════════════════════════
async function convertBytes(bytes, name, opts) {
    opts = opts || {};
    var unknown = {};
    var nbt = await parseNBT(bytes);
    var root = nbt.Schematic || nbt;

    var format;
    if (root.Regions && root.Metadata && root.Metadata.EnclosingSize) format = 'litematic';
    else if (root.BlockData || (root.Blocks && root.Blocks.Palette)) format = 'schem';
    else if (root.Blocks instanceof Uint8Array) format = 'schematic';
    else throw new Error('Format non reconnu (ni .schem, ni .schematic, ni .litematic)');

    var grid = format === 'litematic' ? parseLitematic(nbt, name, { unknown: unknown })
        : format === 'schem' ? parseSponge(nbt, name, { unknown: unknown })
        : parseLegacy(nbt, name, { unknown: unknown });

    return {
        name: name, format: format, grid: grid,
        width: grid.width, height: grid.height, length: grid.length,
        totalBlocks: grid.total,
        unknown: unknown,            // { mc_name: count } remplacés par dirt (ou mapping utilisateur)
        mcCount: grid.mcCount
    };
}

// ═══════════════════════════════════════════════════════════════════════════
//  Encodage .bloxdschem (identique à schem_splitter.js / M2B schema0)
// ═══════════════════════════════════════════════════════════════════════════
function encodeRLE(arr) {
    var parts = [], i = 0;
    while (i < arr.length) {
        var c = arr[i], r = 1;
        while (i + r < arr.length && arr[i + r] === c && r < 0x7fffffff) r++;
        parts.push(wuv(r), wuv(c));
        i += r;
    }
    return cat(parts);
}
function encodeSchem(name, chunksMap, sX, sY, sZ) {
    var airRle = encodeRLE(new Int32Array(CHUNK_VOL));
    var nCX = Math.ceil(sX / CHUNK), nCY = Math.ceil(sY / CHUNK), nCZ = Math.ceil(sZ / CHUNK);
    var total = nCX * nCY * nCZ;
    var ps = [new Uint8Array([0, 0, 0, 0]), was(name), wai(0), wai(0), wai(0), wai(sX), wai(sY), wai(sZ), wai(total)];
    for (var cx = 0; cx < nCX; cx++) for (var cy = 0; cy < nCY; cy++) for (var cz = 0; cz < nCZ; cz++) {
        ps.push(wai(cx), wai(cy), wai(cz));
        var a = chunksMap[cx + ',' + cy + ',' + cz];
        ps.push(wab(a ? encodeRLE(a) : airRle));
    }
    ps.push(wai(0));
    return cat(ps);
}

function gridToChunks(grid, ox, oz) {
    // extrait la grille en map de chunks (avec offset optionnel en blocs)
    var m = {};
    for (var k in grid.chunks) {
        var p = k.split(','), cx = +p[0], cy = +p[1], cz = +p[2];
        m[(cx - Math.floor(ox / CHUNK)) + ',' + cy + ',' + (cz - Math.floor(oz / CHUNK))] = grid.chunks[k];
    }
    return m;
}

// Découpe automatique si > MAX_CHUNKS_PER_FILE chunks (limite Bloxd, cf. Schem Placer).
// Retourne [{ filename, bytes, ox, oz, chunks }] — les noms contiennent _x…_z… en
// blocs pour que Schem Placer / Schem Splitter refusionnent les parties automatiquement.
function buildOutputs(result) {
    var grid = result.grid, name = result.name || 'schematic';
    var nCX = Math.ceil(grid.width / CHUNK), nCY = Math.ceil(grid.height / CHUNK), nCZ = Math.ceil(grid.length / CHUNK);
    var totalChunks = nCX * nCY * nCZ;

    if (totalChunks <= MAX_CHUNKS_PER_FILE) {
        return [{
            filename: name + '.bloxdschem',
            bytes: encodeSchem(name, gridToChunks(grid, 0, 0), grid.width, grid.height, grid.length),
            ox: 0, oz: 0, chunks: totalChunks
        }];
    }

    // découpe en grille XZ (comme l'export Schem Placer) : parts de ~LIM chunks
    var mt = Math.max(1, Math.floor(Math.sqrt(MAX_CHUNKS_PER_FILE / Math.max(1, nCY))));
    var parts = [], num = 1;
    for (var stx = 0; stx < nCX; stx += mt) {
        var etx = Math.min(nCX - 1, stx + mt - 1);
        for (var stz = 0; stz < nCZ; stz += mt) {
            var etz = Math.min(nCZ - 1, stz + mt - 1);
            var ox = stx * CHUNK, oz = stz * CHUNK;
            var pw = Math.min(grid.width, (etx + 1) * CHUNK) - ox;
            var pl = Math.min(grid.length, (etz + 1) * CHUNK) - oz;
            // sous-grille
            var sub = {}, hasBlocks = false;
            for (var k in grid.chunks) {
                var q = k.split(','), cx = +q[0], cy = +q[1], cz = +q[2];
                if (cx < stx || cx > etx || cz < stz || cz > etz) continue;
                sub[(cx - stx) + ',' + cy + ',' + (cz - stz)] = grid.chunks[k];
                hasBlocks = true;
            }
            if (!hasBlocks) continue;   // partie vide : ignorée (les offsets portés par les noms restent corrects)
            var partName = name + '_part' + num;
            parts.push({
                filename: name + '_x' + ox + '_z' + oz + '.bloxdschem',
                bytes: encodeSchem(partName, sub, pw, grid.height, pl),
                ox: ox, oz: oz, chunks: (etx - stx + 1) * nCY * (etz - stz + 1)
            });
            num++;
        }
    }
    if (!parts.length) {
        // aucun bloc nulle part (schem d'air) → un fichier unique
        return [{
            filename: name + '.bloxdschem',
            bytes: encodeSchem(name, gridToChunks(grid, 0, 0), grid.width, grid.height, grid.length),
            ox: 0, oz: 0, chunks: totalChunks
        }];
    }
    return parts;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Décodeur .bloxdschem (pour tests / vérification — portage schem_splitter.js)
// ═══════════════════════════════════════════════════════════════════════════
function decodeRLE(rle) {
    var a = new Int32Array(CHUNK_VOL), o = { v: 0 }, i = 0;
    while (i < CHUNK_VOL && o.v < rle.length) {
        var c = ruv(rle, o), id = ruv(rle, o);
        for (var k = 0; k < c && i < CHUNK_VOL; k++) a[i++] = id;
    }
    return a;
}
function parseBloxdschem(buf) {
    var b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    var o = { v: 0 }, i;
    for (i = 0; i < 4; i++) { if (b[o.v] === 0) o.v++; else break; }
    var name = (function () { var l = rai(b, o); var s = b.subarray(o.v, o.v + l); o.v += l; return new TextDecoder().decode(s); })();
    var px = rai(b, o), py = rai(b, o), pz = rai(b, o);
    var sx = rai(b, o), sy = rai(b, o), sz = rai(b, o);
    var blocks = new Map(), total = 0;
    var mnX = Infinity, mnY = Infinity, mnZ = Infinity, mxX = -Infinity, mxY = -Infinity, mxZ = -Infinity;
    while (o.v < b.length) {
        var bc = rai(b, o); if (bc === 0) break;
        if (bc < 0) { bc = -bc; rai(b, o); }
        for (i = 0; i < bc; i++) {
            var cx = rai(b, o), cy = rai(b, o), cz = rai(b, o);
            var l = rai(b, o);
            var rle = b.slice(o.v, o.v + l); o.v += l;
            var arr = decodeRLE(rle);
            var bX = cx * CHUNK, bY = cy * CHUNK, bZ = cz * CHUNK;
            for (var lx = 0; lx < CHUNK; lx++) for (var ly = 0; ly < CHUNK; ly++) for (var lz = 0; lz < CHUNK; lz++) {
                var id = arr[lx * 1024 + ly * 32 + lz];
                if (id === AIR) continue;
                var wx = bX + lx, wy = bY + ly, wz = bZ + lz;
                if (wx < mnX) mnX = wx; if (wy < mnY) mnY = wy; if (wz < mnZ) mnZ = wz;
                if (wx > mxX) mxX = wx; if (wy > mxY) mxY = wy; if (wz > mxZ) mxZ = wz;
                total++;
                var key = wx + ',' + wy + ',' + wz;
                blocks.set(key, id);
            }
        }
    }
    return { name: name, pos: { x: px, y: py, z: pz }, size: { x: sx, y: sy, z: sz }, blocks: blocks, totalBlocks: total };
}

// ═══════════════════════════════════════════════════════════════════════════
//  API publique
// ═══════════════════════════════════════════════════════════════════════════
var API = {
    CHUNK: CHUNK,
    MAX_CHUNKS_PER_FILE: MAX_CHUNKS_PER_FILE,
    init: init,
    setUserMap: function (m) { USER_MAP = m || {}; _m2bCache = {}; },
    parseNBT: parseNBT,
    convertBytes: convertBytes,
    mcToBloxdId: function (mcId, unknownSink) { return mcToBloxdId(mcId, unknownSink); },
    mcNumToStr: mcNumToStr,
    buildOutputs: buildOutputs,
    encodeSchem: encodeSchem,
    parseBloxdschem: parseBloxdschem,
    BloxdGrid: BloxdGrid
};

if (typeof module !== 'undefined' && module.exports) module.exports = API;
global.BloxdSchemConverter = API;

})(typeof window !== 'undefined' ? window : globalThis);
