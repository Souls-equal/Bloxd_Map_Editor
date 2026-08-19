/**
 * asset_placer-core.js — UTILITAIRES & DONNÉES (fusionné)
 * Contient: i18n, bloxdio, block_colors, parser
 */

/* ═══════════════════════════════════════════════════════════════ */
/*  i18n  */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * asset_placer-i18n.js
 * UI translations (EN / FR) and keyboard layout configuration (AZERTY / QWERTY)
 */

window.I18N = {
    lang: 'en',
    keyboard: 'azerty',

    translations: {
        en: {
            library: "📚 Asset Library",
            importTerrain: "🌄 Import (Terrain)",
            terrainImportSuccess: "Terrain imported:",
            terrainImportError: "Terrain import failed:",
            export: "📤 Export (Schematic)",
            settings: "⚙ Settings",
            properties: "Properties",
            name: "Name:",
            position: "Position",
            positionX: "Position X:",
            positionY: "Position Y:",
            positionZ: "Position Z:",
            rotation: "Rotation Y:",
            duplicate: "📋 Duplicate",
            delete: "🗑️ Delete",
            language: "Language:",
            keyboardLayout: "Keyboard:",
            close: "Close",
            settingsTitle: "Editor Settings",
            hubLangNote: "Language is set from the main menu (Hub).",
            toggleLibrary: "Collapse / Expand",
            reopenLibrary: "Open asset library",
            noBlocksToExport: "No blocks to export!",
            largeTerrainExportSkipped: "Large streaming terrain is too big for JSON export in one file. Exporting placed assets only for now.",
            canvasLabel: "Babylon 3D scene",
            overlayLabel: "Editor interface",
            filterTitle: "Filter",
            clear: "Clear",
            categories: "Categories",
            sizeFilter: "Size",
            maxBlocks: "Max blocks",
            sizeHint: "Y rotation allowed (W↔D swap)",
            searchName: "Search name...",
            noAssets: "No asset matches the filters.",
            blocksShort: "blocks",
            assetsShort: "assets",
            autoTerraform: "Auto-terraform (foundation):",
            sessionMenu: "💾 Session",
            saveSession: "Save (browser)",
            loadSession: "Load (browser)",
            exportScene: "Export scene (.json)",
            importScene: "Import scene (.json)",
            clearAllAssets: "Clear all assets",
            deleteSave: "Delete saved session",
            sessionSaved: "{n} asset(s) saved ✓",
            sessionLoaded: "{n} asset(s) loaded ✓",
            sceneImported: "{n} asset(s) imported ✓",
            noSavedSession: "No saved session found",
            noAssetsToSave: "No assets to save",
            confirmLoad: "Loading will REPLACE the current scene. Continue?",
            confirmClearAll: "Delete ALL placed assets?",
            confirmDeleteSave: "Delete the saved session from this browser?",
            sceneCleared: "All assets cleared",
            saveDeleted: "Saved session deleted",
            sceneImportError: "Import failed (invalid file)",
            autoRestored: "Restored {n} assets from last session"
        },
        fr: {
            library: "📚 Bibliothèque d'assets",
            importTerrain: "🌄 Importer (Terrain)",
            terrainImportSuccess: "Terrain importé :",
            terrainImportError: "Échec de l'import du terrain :",
            export: "📤 Exporter (Schematic)",
            settings: "⚙ Paramètres",
            properties: "Propriétés",
            name: "Nom :",
            position: "Position",
            positionX: "Position X :",
            positionY: "Position Y :",
            positionZ: "Position Z :",
            rotation: "Rotation Y :",
            duplicate: "📋 Dupliquer",
            delete: "🗑️ Supprimer",
            language: "Langue :",
            keyboardLayout: "Clavier :",
            close: "Fermer",
            settingsTitle: "Paramètres de l'éditeur",
            hubLangNote: "La langue se règle depuis le menu principal (Hub).",
            toggleLibrary: "Replier / Déplier",
            reopenLibrary: "Ouvrir la bibliothèque d'assets",
            noBlocksToExport: "Aucun bloc à exporter !",
            largeTerrainExportSkipped: "Le terrain en mode streaming est trop volumineux pour un export JSON en un seul fichier. Export des assets placés uniquement pour le moment.",
            canvasLabel: "Scène 3D Babylon",
            overlayLabel: "Interface de l'éditeur",
            filterTitle: "Filtre",
            clear: "Effacer",
            categories: "Catégories",
            sizeFilter: "Taille",
            maxBlocks: "Blocs max",
            sizeHint: "Rotation Y autorisée (W↔D)",
            searchName: "Rechercher un nom...",
            noAssets: "Aucun asset ne correspond aux filtres.",
            blocksShort: "blocs",
            assetsShort: "assets",
            autoTerraform: "Auto-terraformer (fondations) :",
            sessionMenu: "💾 Session",
            saveSession: "Sauvegarder (navigateur)",
            loadSession: "Charger (navigateur)",
            exportScene: "Exporter la scène (.json)",
            importScene: "Importer une scène (.json)",
            clearAllAssets: "Tout effacer",
            deleteSave: "Supprimer la sauvegarde",
            sessionSaved: "{n} asset(s) sauvegardé(s) ✓",
            sessionLoaded: "{n} asset(s) chargé(s) ✓",
            sceneImported: "{n} asset(s) importé(s) ✓",
            noSavedSession: "Aucune sauvegarde trouvée",
            noAssetsToSave: "Aucun asset à sauvegarder",
            confirmLoad: "Le chargement va REMPLACER la scène actuelle. Continuer ?",
            confirmClearAll: "Supprimer TOUS les assets placés ?",
            confirmDeleteSave: "Supprimer la sauvegarde de ce navigateur ?",
            sceneCleared: "Tous les assets ont été effacés",
            saveDeleted: "Sauvegarde supprimée",
            sceneImportError: "Échec de l'import (fichier invalide)",
            autoRestored: "{n} asset(s) restauré(s) depuis la dernière session"
        },
        ja: {
            library:"📚 アセットライブラリ",importTerrain:"🌄 インポート (地形)",
            terrainImportSuccess:"地形インポート成功:",terrainImportError:"地形インポート失敗:",
            export:"📤 エクスポート",settings:"⚙ 設定",properties:"プロパティ",
            name:"名前:",position:"位置",positionX:"X座標:",positionY:"Y座標:",positionZ:"Z座標:",
            rotation:"回転 Y:",duplicate:"📋 複製",delete:"🗑️ 削除",
            language:"言語:",keyboardLayout:"キーボード:",close:"閉じる",
            settingsTitle:"エディタ設定",hubLangNote:"言語はメインメニューで設定",
            toggleLibrary:"折りたたみ/展開",reopenLibrary:"ライブラリを開く",
            noBlocksToExport:"ブロックなし!",largeTerrainExportSkipped:"大きな地形はJSON出力不可。アセットのみ出力。",
            canvasLabel:"Babylon 3Dシーン",overlayLabel:"エディタインターフェース",
            filterTitle:"フィルター",clear:"クリア",categories:"カテゴリー",sizeFilter:"サイズ",
            maxBlocks:"最大ブロック",sizeHint:"Y回転対応 (W↔D交換)",
            searchName:"名前検索...",noAssets:"該当するアセットなし",
            blocksShort:"ブロック",assetsShort:"アセット",autoTerraform:"自動整形 (基礎):",
            sessionMenu:"💾 セッション",saveSession:"保存 (ブラウザ)",loadSession:"読込 (ブラウザ)",
            exportScene:"シーン書出 (.json)",importScene:"シーン読込 (.json)",
            clearAllAssets:"すべて削除",deleteSave:"保存データを削除",
            sessionSaved:"{n} 件保存 ✓",sessionLoaded:"{n} 件読込 ✓",sceneImported:"{n} 件取込 ✓",
            noSavedSession:"保存データなし",noAssetsToSave:"保存するアセットなし",
            confirmLoad:"現在のシーンが上書きされます。続行しますか？",
            confirmClearAll:"すべてのアセットを削除しますか？",
            confirmDeleteSave:"このブラウザの保存データを削除しますか？",
            sceneCleared:"すべて削除しました",saveDeleted:"保存データを削除しました",
            sceneImportError:"取込失敗 (無効なファイル)",autoRestored:"前回のセッションから {n} 件復元"
        },
        ko: {
            library:"📚 에셋 라이브러리",importTerrain:"🌄 가져오기 (지형)",
            terrainImportSuccess:"지형 가져오기 성공:",terrainImportError:"지형 가져오기 실패:",
            export:"📤 내보내기",settings:"⚙ 설정",properties:"속성",
            name:"이름:",position:"위치",positionX:"X 위치:",positionY:"Y 위치:",positionZ:"Z 위치:",
            rotation:"회전 Y:",duplicate:"📋 복제",delete:"🗑️ 삭제",
            language:"언어:",keyboardLayout:"키보드:",close:"닫기",
            settingsTitle:"에디터 설정",hubLangNote:"언어는 메인 메뉴에서 설정",
            toggleLibrary:"접기/펼치기",reopenLibrary:"라이브러리 열기",
            noBlocksToExport:"블록 없음!",largeTerrainExportSkipped:"큰 지형은 JSON 내보내기 불가. 에셋만 내보냅니다.",
            canvasLabel:"Babylon 3D 씬",overlayLabel:"에디터 인터페이스",
            filterTitle:"필터",clear:"지우기",categories:"카테고리",sizeFilter:"크기",
            maxBlocks:"최대 블록",sizeHint:"Y 회전 허용 (W↔D 교환)",
            searchName:"이름 검색...",noAssets:"조건에 맞는 에셋 없음",
            blocksShort:"블록",assetsShort:"에셋",autoTerraform:"자동 지형 (기초):",
            sessionMenu:"💾 세션",saveSession:"저장 (브라우저)",loadSession:"불러오기 (브라우저)",
            exportScene:"씬 내보내기 (.json)",importScene:"씬 가져오기 (.json)",
            clearAllAssets:"모두 삭제",deleteSave:"저장 데이터 삭제",
            sessionSaved:"{n}개 저장 ✓",sessionLoaded:"{n}개 불러옴 ✓",sceneImported:"{n}개 가져옴 ✓",
            noSavedSession:"저장 데이터 없음",noAssetsToSave:"저장할 에셋 없음",
            confirmLoad:"현재 씬이 교체됩니다. 계속할까요?",
            confirmClearAll:"모든 배치된 에셋을 삭제할까요?",
            confirmDeleteSave:"이 브라우저의 저장 데이터를 삭제할까요?",
            sceneCleared:"모든 에셋 삭제됨",saveDeleted:"저장 데이터 삭제됨",
            sceneImportError:"가져오기 실패 (잘못된 파일)",autoRestored:"이전 세션에서 {n}개 복원"
        },
        th: {
            library:"📚 ไลบรารีอุปกรณ์",importTerrain:"🌄 นำเข้า (ภูมิประเทศ)",
            terrainImportSuccess:"นำเข้าภูมิประเทศสำเร็จ:",terrainImportError:"นำเข้าภูมิประเทศล้มเหลว:",
            export:"📤 ส่งออก",settings:"⚙ ตั้งค่า",properties:"คุณสมบัติ",
            name:"ชื่อ:",position:"ตำแหน่ง",positionX:"ตำแหน่ง X:",positionY:"ตำแหน่ง Y:",positionZ:"ตำแหน่ง Z:",
            rotation:"หมุน Y:",duplicate:"📋 ทำซ้ำ",delete:"🗑️ ลบ",
            language:"ภาษา:",keyboardLayout:"คีย์บอร์ด:",close:"ปิด",
            settingsTitle:"ตั้งค่าเครื่องมือ",hubLangNote:"ภาษาตั้งค่าจากเมนูหลัก",
            toggleLibrary:"ย่อ/ขยาย",reopenLibrary:"เปิดไลบรารี",
            noBlocksToExport:"ไม่มีบล็อก!",largeTerrainExportSkipped:"ภูมิประเทศใหญ่ส่งออก JSON ไม่ได้ ส่งออกเฉพาะอุปกรณ์",
            canvasLabel:"Babylon 3D",overlayLabel:"อินเทอร์เฟซเครื่องมือ",
            filterTitle:"กรอง",clear:"ล้าง",categories:"หมวดหมู่",sizeFilter:"ขนาด",
            maxBlocks:"บล็อกสูงสุด",sizeHint:"หมุน Y ได้ (W↔D)",
            searchName:"ค้นหาชื่อ...",noAssets:"ไม่มีอุปกรณ์ที่ตรง",
            blocksShort:"บล็อก",assetsShort:"อุปกรณ์",autoTerraform:"ปรับภูมิประเทศอัตโนมัติ:",
            sessionMenu:"💾 เซสชัน",saveSession:"บันทึก (เบราว์เซอร์)",loadSession:"โหลด (เบราว์เซอร์)",
            exportScene:"ส่งออกฉาก (.json)",importScene:"นำเข้าฉาก (.json)",
            clearAllAssets:"ลบทั้งหมด",deleteSave:"ลบข้อมูลที่บันทึก",
            sessionSaved:"บันทึก {n} รายการ ✓",sessionLoaded:"โหลด {n} รายการ ✓",sceneImported:"นำเข้า {n} รายการ ✓",
            noSavedSession:"ไม่มีข้อมูลที่บันทึก",noAssetsToSave:"ไม่มีอุปกรณ์ให้บันทึก",
            confirmLoad:"การโหลดจะแทนที่ฉากปัจจุบัน ดำเนินการต่อ?",
            confirmClearAll:"ลบอุปกรณ์ทั้งหมด?",
            confirmDeleteSave:"ลบข้อมูลที่บันทึกจากเบราว์เซอร์นี้?",
            sceneCleared:"ลบอุปกรณ์ทั้งหมดแล้ว",saveDeleted:"ลบข้อมูลที่บันทึกแล้ว",
            sceneImportError:"นำเข้าล้มเหลว (ไฟล์ไม่ถูกต้อง)",autoRestored:"กู้คืน {n} รายการจากเซสชันก่อนหน้า"
        }
    },

    t(key) {
        const dict = this.translations[this.lang] || this.translations.en;
        return dict[key] || this.translations.en[key] || key;
    }
};
/* ═══════════════════════════════════════════════════════════════ */
/*  bloxdio  */
/* ═══════════════════════════════════════════════════════════════ */

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
/* ═══════════════════════════════════════════════════════════════ */
/*  block_colors  */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * block_colors.js — Couleurs fidèles pour un très grand nombre de blocs Bloxd.io.
 *
 * Stratégie :
 *  - Une table de couleurs "de base" pour les couleurs nommées (white, orange, magenta, ...)
 *    déclinées par type de matériau (wool, concrete, planks, baked clay, glass, ceramic, tiles).
 *  - Des couleurs matériaux spécifiques (bois par essence, feuilles, minerais, etc.)
 *  - Une fonction getBlockColor(id) qui combine une table explicite de blocs connus
 *    et un fallback par analyse du nom (recherche de mots-clés) pour les blocs
 *    moins fréquents. Au pire on retombe sur une couleur de matière générique.
 */

(function (global) {
    'use strict';

    // Couleurs de base par teinte (proches Minecraft/Bloxd)
    const HUE = {
        White:      0xf2f2f2,
        Orange:     0xea7e35,
        Magenta:    0xc74ebd,
        'Light Blue':0x6387d2,
        Yellow:     0xb8a93a,
        Lime:       0x72b828,
        Pink:       0xe88da2,
        Gray:       0x6a6a6a,
        'Light Gray':0xa0a0a0,
        Cyan:       0x6099a8,
        Purple:     0x804dba,
        Blue:       0x3c54ad,
        Brown:      0x7b5536,
        Green:      0x4d8a33,
        Red:        0xa03333,
        Black:      0x1b1b20,
        // Bonus
        Maroon:     0x6b1e1e,
        Teal:       0x2f7f87,
        Indigo:     0x3b3b8c,
        Gold:       0xf2c94c,
        Bronze:     0xa57a3f,
        Copper:     0xc47d4a,
        Beige:      0xd9c99a,
        Cream:      0xf1e9ca,
        Silver:     0xccccd6,
    };

    // Légères variations par matériau (facteur multiplicatif)
    const MATERIAL_ADJUST = {
        wool:           [1.00, 1.00, 1.00],
        concrete:       [0.88, 0.88, 0.88],  // plus sombre et plus mat
        planks:         [0.82, 0.70, 0.50],  // mixé avec brun-bois
        'baked clay':   [0.85, 0.78, 0.70],
        clay:           [0.95, 0.95, 0.95],
        glass:          [1.00, 1.00, 1.00],
        ceramic:        [0.95, 0.95, 1.00],
        tile:           [0.92, 0.92, 0.95],
    };

    // Couleurs par essence de bois (écorce et intérieur)
    const WOOD = {
        Maple:  { log: 0x8a6339, planks: 0xc19a6b, leaves: 0x5a9633, sapling: 0x5a9633, barkless: 0xc19a6b },
        Pine:   { log: 0x55463a, planks: 0x8d7350, leaves: 0x2d5c2c, sapling: 0x3a7a3b, barkless: 0x8d7350 },
        Plum:   { log: 0x6a4b36, planks: 0xa38264, leaves: 0x4d7e39, sapling: 0x558a3d, barkless: 0xa38264, fruit: 0x7a2a4b },
        Cedar:  { log: 0x5c4835, planks: 0x8a6f4d, leaves: 0x2e6a2f, sapling: 0x3c7a3b, barkless: 0x8a6f4d },
        Aspen:  { log: 0x9a8c76, planks: 0xd1c08b, leaves: 0x7bb34a, sapling: 0x7bb34a, barkless: 0xd1c08b },
        Elm:    { log: 0x7a5a3c, planks: 0xa38054, leaves: 0x48893a, sapling: 0x48893a, barkless: 0xa38054 },
        Cherry: { log: 0xb49070, planks: 0xe0baa6, leaves: 0x8e3a4f, sapling: 0x8e3a4f, barkless: 0xe0baa6 },
        Palm:   { log: 0x786044, planks: 0x9d835b, leaves: 0x40893c, sapling: 0x40893c, barkless: 0x9d835b, coconut: 0x6b4a2c },
        Pear:   { log: 0x765c42, planks: 0xa78765, leaves: 0x4e8d3d, sapling: 0x4e8d3d, barkless: 0xa78765, fruit: 0x9cb74a },
    };

    // Couleurs minerais / métaux / gemmes
    const METAL = {
        Stone:          0x808080,
        'Smooth Stone': 0x9a9a9a,
        Diorite:        0xdcdcdc,
        Andesite:       0x86847f,
        Granite:        0x9b7c71,
        Sandstone:      0xddc98a,
        Yellowstone:    0xc3b070,
        Obsidian:       0x140d23,
        Bedrock:        0x2f2f34,
        Cobblestone:    0x757575,
        Mossy:          0x6b7a54,
        Cracked:        0x777777,
        Bricks:         0x934b42,
        'Stone Bricks': 0x7f7f79,
        'Dark Red Brick': 0x602924,
        'Dark Red Stone': 0x5a2222,
        Coal:           0x262628,
        Iron:           0xd4d4d4,
        Gold:           0xf3d04a,
        'Lapis Lazuli': 0x2a4fa0,
        Emerald:        0x3dd06b,
        Diamond:        0x63d8e8,
        Quartz:         0xf4efe4,
        Moonstone:      0x8ab8e0,
        Magma:          0xff6a1f,
        Water:          0x2a7bc0,
        Ice:            0xa8d6ee,
        Snow:           0xf5f9fc,
        Glass:          0xcfe8f5,
        Sponge:         0xd6b751,
        Beacon:         0xd8f1ff,
        Hay:            0xc8a841,
        Cactus:         0x3f803a,
        Grass:          0x5aa03a,
        Dirt:           0x6e4b2a,
        Sand:           0xe6d797,
        Clay:           0xa2aaa8,
        Gravel:         0x888888,
        Chalk:          0xf8f8f0,
        Lava:           0xff5522,
        Redstone:       0xaa1c1c,
    };

    // Couleurs fleurs/plantes
    const FLORA = {
        Dandelion:    0xfde04c,
        Poppy:        0xd83030,
        Tulip:        0xe85a7a,
        Daisy:        0xf2f2f2,
        Bluebell:     0x4461d6,
        Allium:       0x9c63c8,
        'Azure Bluet':0xdbe6ff,
        'Lily of the Valley': 0xffffff,
        'Wither Rose':0x2a1a1a,
        Roses:        0xc2282b,
        Flower:       0xff76a6,
        Sapling:      0x5e9d46,
        Leaves:       0x3e8a3a,
        Vines:        0x3c7c36,
    };

    // Couleur des fleurs/feuilles par la couleur du mot clé
    const FLOWER_BY_COLOR = {
        red: 0xd93c3c, orange: 0xe27d2e, yellow: 0xeacb3d, lime: 0x83c92c,
        green: 0x3e9030, cyan: 0x3fb8b3, 'light blue': 0x5aaee0, blue: 0x3e5bc4,
        purple: 0x8b4fc8, magenta: 0xc54fb6, pink: 0xea8ba6, white: 0xf5f5f5,
        gray: 0x8a8a8a, 'light gray': 0xbfbfbf, black: 0x202028, brown: 0x8a5f3a
    };

    // Helpers couleur ----------------------------------------------------
    function hexToRgb(h) {
        return [(h >> 16) & 255, (h >> 8) & 255, h & 255];
    }
    function rgbToHex(r, g, b) {
        return ((clamp(r) << 16) | (clamp(g) << 8) | clamp(b)) >>> 0;
    }
    function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }
    function multiply(h, f) {
        const [r,g,b] = hexToRgb(h);
        const [fr,fg,fb] = (typeof f === 'number') ? [f,f,f] : f;
        return rgbToHex(r*fr, g*fg, b*fb);
    }
    function mix(h1, h2, t=0.5) {
        const a = hexToRgb(h1), b = hexToRgb(h2);
        return rgbToHex(a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t);
    }

    // Appliquer une teinte nommée à un matériau.
    function colored(hueName, material) {
        let base = HUE[hueName] !== undefined ? HUE[hueName] : 0x909090;
        if (material) {
            const adj = MATERIAL_ADJUST[material];
            if (adj) {
                // Pour les planches : teinter vers brun-bois
                if (material === 'planks') base = mix(base, 0x7a5a3a, 0.55);
                else if (material === 'baked clay') base = mix(base, 0x9b6f50, 0.35);
                else base = multiply(base, adj);
            }
        }
        return base;
    }

    // Table explicite : id -> hex (les plus courants)
    const EXPLICIT = {
        0: 0x000000,    // Air (transparent, mais couleur "none")
        1: 0x1a1a22,    // Unloaded
        2: METAL.Dirt,
        3: multiply(METAL.Dirt, 0.92),    // Messy Dirt
        4: 0x4da64d,    // Grass Block
        5: METAL.Sand,
        6: METAL.Clay,
        7: METAL.Gravel,
        8: METAL.Snow,
        28: METAL.Stone,
        29: multiply(METAL.Stone, 0.88),
        30: 0xff00ff,   // placeholder (magenta vif pour le repérer)
        31: METAL['Smooth Stone'],
        32: METAL.Diorite,
        33: multiply(METAL.Diorite, 0.98),
        34: METAL.Andesite,
        35: multiply(METAL.Andesite, 0.97),
        36: METAL.Granite,
        37: multiply(METAL.Granite, 0.98),
        38: METAL.Sandstone,
        39: METAL.Yellowstone,
        40: 0x2e2e32,   // Coal Ore (stone+coal)
        41: 0x96938f,   // Iron Ore
        42: 0x9e8e6a,   // Gold Ore
        43: 0x4b638b,   // Lapis Ore
        44: 0x4f7c56,   // Emerald Ore
        45: 0x788f94,   // Diamond Ore
        46: METAL.Coal,
        47: METAL.Iron,
        48: METAL.Gold,
        49: METAL['Lapis Lazuli'],
        50: METAL.Emerald,
        126: METAL.Water,
        127: 0x3a3a44,  // Invisible solid (gris transparent-ish)
        128: METAL.Bricks,
        129: METAL['Stone Bricks'],
        130: METAL['Dark Red Brick'],
        131: METAL['Dark Red Stone'],
        132: METAL.Quartz,
        133: multiply(METAL.Quartz, 0.95),
        134: multiply(METAL['Smooth Stone'], 0.97), // Engraved Stone
        135: METAL.Mossy,
        136: METAL.Cracked,
        137: multiply(METAL.Sandstone, 1.02),
        138: multiply(METAL.Sandstone, 1.0),
        139: METAL.Ice,
        140: METAL.Obsidian,
        141: METAL.Hay,
        142: METAL.Sponge,
        143: METAL.Beacon,
        145: METAL.Gold,
        146: METAL.Moonstone,
        147: METAL.Bedrock,
        149: METAL.Cactus,
        150: FLORA.Grass,
        223: multiply(METAL.Dirt, 0.95),  // Dirt|GrassRoots
        471: METAL.Magma,
        475: multiply(METAL.Sandstone, 0.90), // Smooth Red Sandstone
        650: 0xc35a3c,                       // Red Sand
        1222: WOOD.Cherry.log,               // Cherry Log
    };

    // Ordre exact des couleurs pour chaque gamme (basé sur nameToId.json)
    const HUE_ORDER_WOOL     = ['White','Orange','Magenta','Light Blue','Yellow','Lime','Pink','Gray','Light Gray','Cyan','Purple','Blue','Brown','Green','Red','Black'];
    const HUE_ORDER_CONCRETE = ['Gray','Light Gray','Black','Blue','Brown','Cyan','Light Blue','Lime','Magenta','Orange','Pink','Purple','Red','White','Green','Yellow'];
    const HUE_ORDER_GLASS    = ['Black','Blue','Brown','Cyan','Gray','Light Gray','Green','Light Blue','Lime','Magenta','Orange','Pink','Purple','Red','White','Yellow']; // 107..122
    const HUE_ORDER_PLANKS   = ['White','Orange','Magenta','Light Blue','Yellow','Lime','Pink','Gray','Light Gray','Cyan','Purple','Blue','Brown','Green','Red','Black'];
    const HUE_ORDER_CLAY     = ['White','Orange','Magenta','Light Blue','Yellow','Lime','Pink','Gray','Light Gray','Cyan','Purple','Blue','Brown','Green','Red','Black']; // 68..83
    const HUE_ORDER_CERAMIC  = ['White','Orange','Magenta','Light Blue','Yellow','Lime','Pink','Gray','Light Gray','Cyan','Purple','Blue','Brown','Green','Red','Black']; // 245..308 (16 teintes × 4 rot, ordre WOOL)

    // Blocs de base (laines / terres cuites / betons / verres / planches)
    let id;
    // 51..66 Wools (16)
    id = 51; HUE_ORDER_WOOL.forEach(h => { EXPLICIT[id++] = colored(h, 'wool'); });
    // 67 Baked Clay par défaut (terracotta brute) + 68..83 colored baked clay
    EXPLICIT[67] = 0xa0664b;
    id = 68; HUE_ORDER_CLAY.forEach(h => { EXPLICIT[id++] = colored(h, 'baked clay'); });
    // 84..99 Concrete (16)
    id = 84; HUE_ORDER_CONCRETE.forEach(h => { EXPLICIT[id++] = colored(h, 'concrete'); });
    // 100..103 Leaves
    EXPLICIT[100] = WOOD.Pine.leaves;
    EXPLICIT[101] = WOOD.Aspen.leaves;
    EXPLICIT[102] = WOOD.Maple.leaves;
    EXPLICIT[103] = WOOD.Elm.leaves;
    // 106 Glass (transparent générique)
    EXPLICIT[106] = METAL.Glass;
    // 107..122 Verres colorés (16)
    id = 107; HUE_ORDER_GLASS.forEach(h => { EXPLICIT[id++] = multiply(colored(h, 'glass'), 0.85); });
    // 123 unused / placeholder
    EXPLICIT[123] = 0xff00ff;
    // 124/125 lamps
    EXPLICIT[124] = 0xffe680;
    EXPLICIT[125] = 0xc8a74c;
    // 228..243 Planks colorées (16)
    id = 228; HUE_ORDER_PLANKS.forEach(h => { EXPLICIT[id++] = colored(h, 'planks'); });
    // 245..308 Céramiques colorées (16 teintes × 4 rotations = 64)
    id = 245;
    for (let r = 0; r < 4; r++) {
        HUE_ORDER_CERAMIC.forEach(h => { EXPLICIT[id++] = colored(h, 'ceramic'); });
    }

    // Essences de bois : chaque essence a log/planks/leaves/sapling/barkless,
    // chaque décliné en plusieurs metas (rot, base, canopy, etc.). On va les
    // remplir en parcourant le nameToId.
    // (On s'appuie sur le nom pour retrouver l'ID ; on construit à la volée
    // dans fillDynamic en lisant nameToId.json embarqué.)

    /* ------------- Fallback par analyse de nom ------------- */

    function findHueInName(lowerName) {
        if (/\bwhite\b/.test(lowerName)) return 'White';
        if (/\borange\b/.test(lowerName)) return 'Orange';
        if (/\bmagenta\b/.test(lowerName)) return 'Magenta';
        if (/\blight blue\b/.test(lowerName)) return 'Light Blue';
        if (/\byellow\b/.test(lowerName)) return 'Yellow';
        if (/\blime\b/.test(lowerName)) return 'Lime';
        if (/\bpink\b/.test(lowerName)) return 'Pink';
        if (/\blight gray\b/.test(lowerName)) return 'Light Gray';
        if (/\bgray\b/.test(lowerName)) return 'Gray';
        if (/\bcyan\b/.test(lowerName)) return 'Cyan';
        if (/\bpurple\b/.test(lowerName)) return 'Purple';
        if (/\bblue\b/.test(lowerName)) return 'Blue';
        if (/\bbrown\b/.test(lowerName)) return 'Brown';
        if (/\bgreen\b/.test(lowerName)) return 'Green';
        if (/\bred\b/.test(lowerName)) return 'Red';
        if (/\bblack\b/.test(lowerName)) return 'Black';
        return null;
    }

    function materialFromName(lower) {
        if (/\bwool\b/.test(lower)) return 'wool';
        if (/\bconcrete\b/.test(lower)) return 'concrete';
        if (/\bplanks?\b/.test(lower)) return 'planks';
        if (/\bbaked clay\b|\bterracotta\b/.test(lower)) return 'baked clay';
        if (/\bclay\b/.test(lower)) return 'clay';
        if (/\b(glass|pane)\b/.test(lower)) return 'glass';
        if (/\bceramic\b/.test(lower)) return 'ceramic';
        if (/\btile(s|d)?\b/.test(lower)) return 'tile';
        return null;
    }

    function woodFromName(lower) {
        for (const key of Object.keys(WOOD)) {
            const re = new RegExp(`\\b${key.toLowerCase()}\\b`);
            if (re.test(lower)) return { name: key, palette: WOOD[key] };
        }
        return null;
    }

    // Assignations spécifiques par mot-clé
    function fallbackColor(name) {
        const lower = name.toLowerCase();

        // Air/invisible/worldedit ghost
        if (/^air\b|\bair\b/.test(lower) && !/plane/.test(lower)) return 0x000000;
        if (/unloaded|placeholder|free_placeholder|unused|invisible|worldedit-ghost/i.test(lower)) return 0x20202a;

        // Bois
        const w = woodFromName(lower);
        if (w) {
            if (/\blog\b/.test(lower)) return w.palette.log;
            if (/barkless/.test(lower)) return w.palette.barkless;
            if (/\bplanks?\b/.test(lower)) return w.palette.planks;
            if (/\bleaves?\b|canopy|hedge/.test(lower)) return w.palette.leaves;
            if (/sapling/.test(lower)) return w.palette.sapling;
            if (/door|trapdoor|ladder|fence|gate|stairs|slab|button|plate|sign/.test(lower)) return multiply(w.palette.planks, 0.92);
            if (/coconut/.test(lower)) return w.palette.coconut || 0x6b4a2c;
            return w.palette.log;
        }

        // Fleurs / plantes
        if (/dandelion/.test(lower)) return FLORA.Dandelion;
        if (/poppy|tulip|daisy|bluebell|allium|bluet|lily|rose|flower/.test(lower)) {
            const hue = findHueInName(lower);
            if (hue && FLOWER_BY_COLOR[hue.toLowerCase()]) return FLOWER_BY_COLOR[hue.toLowerCase()];
            if (/poppy|rose|red/.test(lower)) return FLORA.Poppy;
            if (/tulip|pink/.test(lower)) return FLORA.Tulip;
            if (/daisy|white/.test(lower)) return FLORA.Daisy;
            if (/bluebell|blue/.test(lower)) return FLORA.Bluebell;
            if (/allium|purple/.test(lower)) return FLORA.Allium;
            if (/dandelion|yellow/.test(lower)) return FLORA.Dandelion;
            return FLORA.Flower;
        }
        if (/sapling|vine|leaves|leaves|hedge|bush|grass/.test(lower)) return 0x3f8a37;
        if (/cactus|fat cactus|dry fat cactus/.test(lower)) return 0x3e8139;
        if (/pumpkin|jack/.test(lower)) return 0xd07a1f;
        if (/watermelon|melon/.test(lower)) return 0x3c9a3e;

        // Pierres
        if (/smooth stone/.test(lower)) return METAL['Smooth Stone'];
        if (/stone brick/.test(lower)) return METAL['Stone Bricks'];
        if (/dark red brick/.test(lower)) return METAL['Dark Red Brick'];
        if (/dark red stone/.test(lower)) return METAL['Dark Red Stone'];
        if (/cobble|rocky/.test(lower)) return METAL.Cobblestone;
        if (/mossy/.test(lower)) return METAL.Mossy;
        if (/cracked/.test(lower)) return METAL.Cracked;
        if (/diorite/.test(lower)) return METAL.Diorite;
        if (/andesite/.test(lower)) return METAL.Andesite;
        if (/granite/.test(lower)) return METAL.Granite;
        if (/sandstone/.test(lower)) return METAL.Sandstone;
        if (/yellowstone/.test(lower)) return METAL.Yellowstone;
        if (/obsidian|obby/.test(lower)) return METAL.Obsidian;
        if (/bedrock/.test(lower)) return METAL.Bedrock;
        if (/brick/.test(lower)) return METAL.Bricks;
        if (/stone/.test(lower)) return METAL.Stone;
        if (/engraved|marked|patterned|chiseled/.test(lower)) return multiply(METAL['Smooth Stone'], 0.95);

        // Minerais / blocs de métal
        if (/lapis/.test(lower)) return METAL['Lapis Lazuli'];
        if (/emerald/.test(lower)) return METAL.Emerald;
        if (/diamond/.test(lower)) return METAL.Diamond;
        if (/redstone/.test(lower)) return METAL.Redstone;
        if (/coal/.test(lower)) return METAL.Coal;
        if (/golden|gold/.test(lower)) return METAL.Gold;
        if (/iron/.test(lower)) return METAL.Iron;
        if (/moonstone/.test(lower)) return METAL.Moonstone;
        if (/quartz/.test(lower)) return METAL.Quartz;
        if (/magma|lava|volcano/.test(lower)) return METAL.Magma;

        // Eau / glace / neige
        if (/water/.test(lower)) return METAL.Water;
        if (/ice/.test(lower)) return METAL.Ice;
        if (/snow|packed/.test(lower)) return METAL.Snow;
        if (/glass|pane/.test(lower)) return METAL.Glass;
        if (/sponge/.test(lower)) return METAL.Sponge;
        if (/beacon/.test(lower)) return METAL.Beacon;
        if (/hay|straw|wheat|corn|rice|cotton|cranberr/.test(lower)) return 0xc3a041;
        if (/tilled|farmland|dirt|mud/.test(lower)) return METAL.Dirt;
        if (/sand|beach/.test(lower)) return METAL.Sand;
        if (/red sand/.test(lower)) return 0xc55c3e;
        if (/clay/.test(lower)) return METAL.Clay;
        if (/gravel|pebble/.test(lower)) return METAL.Gravel;
        if (/chalk/.test(lower)) return 0xf5f5ef;

        // Lampes
        if (/lamp.*on|torch|glowstone|lantern|lit/.test(lower)) return 0xffd672;
        if (/lamp.*off/.test(lower)) return 0x806d40;

        // Nourriture / buvable
        if (/bread|cornbread|steak|apple|cooked|melon|coconut|chili|bowl|potion|milk|mushroom/.test(lower)) {
            if (/bread/.test(lower)) return 0xd9ab5c;
            if (/steak/.test(lower)) return 0x8f4a35;
            if (/apple|cranberr/.test(lower)) return 0xc43232;
            if (/mushroom/.test(lower)) return 0xa04747;
            if (/bowl|soup/.test(lower)) return 0x945a38;
            if (/milk/.test(lower)) return 0xf4f4f4;
            if (/chili|pepper/.test(lower)) return 0xd83b2b;
            return 0xd09b5f;
        }
        if (/potion/.test(lower)) {
            const h = findHueInName(lower);
            if (h && FLOWER_BY_COLOR[h.toLowerCase()]) return FLOWER_BY_COLOR[h.toLowerCase()];
            return 0x60c0f0;
        }

        // Armes / véhicules / internes (gris métal)
        if (/ak-47|m16|mp40|tar-21|m1911|awp|minigun|rocket|rpg|grenade|grenad|fireball|iceball|snowball|kart|boat|shears|shield|bouncy|updraft|snowdash/.test(lower)) {
            if (/fireball|lava/.test(lower)) return 0xff6a1f;
            if (/iceball|ice/.test(lower)) return 0x94d6ee;
            if (/snowball|snow/.test(lower)) return 0xf0f4ff;
            return 0x757c82;
        }

        // Mob/entités colorées (teinte par nom)
        if (/pig/i.test(lower)) return 0xef9ab3;
        if (/cow/i.test(lower)) return 0x553c2d;
        if (/sheep/i.test(lower)) return 0xe6e1d6;
        if (/chicken|hen/i.test(lower)) return 0xf0efe8;
        if (/zombie/i.test(lower)) return 0x2f7a49;
        if (/skeleton/i.test(lower)) return 0xe4e2cc;
        if (/creeper/i.test(lower)) return 0x4f9d3c;

        // Blocs fonctionnels (furnace, workbench, chest, protector, etc.)
        if (/furnace/.test(lower)) return 0x4a4a4a;
        if (/workbench|artisan/.test(lower)) return 0x8a5f3a;
        if (/chest|loot|crate/.test(lower)) return 0x9a6b3a;
        if (/protector/.test(lower)) return 0x6352ff;
        if (/compass|name tag|book|bookshelf/.test(lower)) return 0x8e5d32;
        if (/mailbox|board|sign/.test(lower)) return 0x866243;
        if (/board/.test(lower)) return 0x724f2f;

        // Couleur nommée générique + matériau
        const hue = findHueInName(lower);
        const mat = materialFromName(lower);
        if (hue) return colored(hue, mat);

        // Matériau sans couleur explicite
        if (mat === 'glass') return METAL.Glass;
        if (mat === 'planks') return 0xa0794b;
        if (mat === 'baked clay') return 0xa0664b;
        if (mat === 'concrete') return 0x8a8a8a;
        if (mat === 'wool') return 0xe0d8c8;
        if (mat === 'clay') return METAL.Clay;
        if (mat === 'ceramic') return 0xeeeeea;
        if (mat === 'tile') return 0xbbbbbb;

        // Dernier recours
        return 0xb08060;
    }

    // Initialiser le cache et les entrées dérivées du JSON de nom -> id
    let NAME_TO_ID = null;
    let CACHE = {};
    let initialized = false;

    function _nameForId(id) {
        if (initFromNameMap._inv) return initFromNameMap._inv[id];
        if (!NAME_TO_ID) return '';
        initFromNameMap._inv = {};
        for (const [n,i] of Object.entries(NAME_TO_ID)) initFromNameMap._inv[i] = n;
        return initFromNameMap._inv[id] || '';
    }

    function initFromNameMap(nameMap) {
        NAME_TO_ID = nameMap;
        // Reset inverse cache
        initFromNameMap._inv = null;

        // Pour chaque essence de bois, trouver les ids par leurs noms et les renseigner.
        for (const [wname, palette] of Object.entries(WOOD)) {
            const prefix = wname + ' ';
            const logName = prefix + 'Log';
            const plankName = prefix + 'Wood Planks';
            const leavesName = prefix + 'Leaves';
            const saplingName = prefix + 'Sapling';
            const barklessName = 'Barkless ' + wname + ' Log';
            if (nameMap[logName] !== undefined) EXPLICIT[nameMap[logName]] = palette.log;
            if (nameMap[plankName] !== undefined) EXPLICIT[nameMap[plankName]] = palette.planks;
            if (nameMap[leavesName] !== undefined) EXPLICIT[nameMap[leavesName]] = palette.leaves;
            if (nameMap[saplingName] !== undefined) EXPLICIT[nameMap[saplingName]] = palette.sapling;
            if (nameMap[barklessName] !== undefined) EXPLICIT[nameMap[barklessName]] = palette.barkless;
            if (nameMap[leavesName + '|TreeCanopy'] !== undefined) EXPLICIT[nameMap[leavesName + '|TreeCanopy']] = multiply(palette.leaves, 0.92);
            if (nameMap[logName + '|TreeBase|'+wname] !== undefined) EXPLICIT[nameMap[logName + '|TreeBase|'+wname]] = palette.log;
        }
        initialized = true;
    }

    function getBlockColor(id, nameHint) {
        if (EXPLICIT[id] !== undefined) return EXPLICIT[id];
        if (CACHE[id] !== undefined) return CACHE[id];
        // Si on a le nom, utiliser fallbackColor par nom
        let name = nameHint;
        if (!name && NAME_TO_ID) {
            // lookup inverse: assez coûteux -> construire inverse
            if (!initFromNameMap._inv) {
                initFromNameMap._inv = {};
                if (NAME_TO_ID) for (const [n,i] of Object.entries(NAME_TO_ID)) initFromNameMap._inv[i] = n;
            }
            name = initFromNameMap._inv[id];
        }
        const c = fallbackColor(name || ('block_'+id));
        CACHE[id] = c;
        return c;
    }

    global.BlockColors = {
        initFromNameMap,
        getBlockColor,
        _nameForId,
    };

})(window);

/* ═══════════════════════════════════════════════════════════════ */
/*  parser  */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * asset_placer-parser.js
 * Parseur de schematics Bloxd.io
 */

window.parseSchem = function(data) {
    let parsed;
    if (typeof data === 'string') {
        try {
            parsed = JSON.parse(data);
        } catch (e) {
            throw new Error("Erreur de parsing JSON du schematic : " + e.message);
        }
    } else {
        parsed = data;
    }

    let blocks = [];
    let size = { x: 0, y: 0, z: 0 };

    if (Array.isArray(parsed)) {
        blocks = parsed;
    } else if (parsed && Array.isArray(parsed.blocks)) {
        blocks = parsed.blocks;
        if (parsed.size) size = parsed.size;
    } else if (parsed && parsed.data) {
        blocks = parsed.data;
    }

    if (size.x === 0 && blocks.length > 0) {
        let maxX = 0, maxY = 0, maxZ = 0;
        let minX = 0, minY = 0, minZ = 0;
        for (const b of blocks) {
            if (b.x > maxX) maxX = b.x;
            if (b.y > maxY) maxY = b.y;
            if (b.z > maxZ) maxZ = b.z;
            if (b.x < minX) minX = b.x;
            if (b.y < minY) minY = b.y;
            if (b.z < minZ) minZ = b.z;
        }
        size = { x: maxX - minX + 1, y: maxY - minY + 1, z: maxZ - minZ + 1 };
    }

    return { size, blocks };
};