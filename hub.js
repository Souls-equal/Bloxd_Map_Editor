/* Bloxd Tools — Hub principal : i18n partagé + clavier (ZQSD/WASD) + menu Paramètres */
(function () {
'use strict';

const LANG_KEY = 'bloxdTools.lang';
const KB_KEY   = 'bloxdTools.keyboard';

const I18N = {
    fr: {
        brand_sub: "Suite d'éditeurs",
        settings: "Paramètres",
        hero_title: "Choisissez un éditeur",
        hero_sub: "Une suite d'outils 3D pour créer, assembler et exporter vos schematics Bloxd.io. Sélectionnez l'éditeur avec lequel vous souhaitez travailler.",
        schem_tag: "Assemblage",
        schem_desc: "Chargez, déplacez, découpez et fusionnez vos .bloxdschem, puis ré-exportez le tout. Placement précis avec snap magnétique.",
        open: "Ouvrir",
        soon: "Bientôt",
        terrain_tag: "Relief",
        terrain_desc: "Sculptez et peignez le terrain de votre monde en 3D : élévation, pinceaux, biomes et import/export.",
        asset_tag: "Décoration",
        asset_desc: "Placez des objets, constructions et assets personnalisés sur votre terrain avec une bibliothèque organisée.",
        footer: "Bloxd Tools v6.8.1 — Langue et clavier partagés entre tous les éditeurs via le menu",
        lang_label: "Langue / Language",
        lang_note: "Appliqué à tous les éditeurs. Garde le choix d'une visite à l'autre.",
        kb_label: "Disposition clavier",
        kb_note: "Contrôle les touches de déplacement (ZQSD/WASD) dans tous les éditeurs.",
        close: "Fermer",
        help_schem: [
            "🖱️ <b>Clic gauche + glisser</b> : tourner la caméra",
            "🖱️ <b>Clic droit + glisser</b> : déplacer la vue (pan)",
            "🖥️ <b>Molette</b> : zoomer",
            "🎮 <b>ZQSD/WASD</b> : voler · <b>Espace/Ctrl</b> : monter/descendre · <b>Maj</b> : ×10",
            "🖱️ <b>V</b> : mode Souris · <b>G</b> : Déplacer · <b>T</b> : Séparer · <b>M</b> : Multi",
            "📂 <b>Ctrl+O</b> : ouvrir · 💾 <b>Ctrl+E</b> : exporter · 📑 <b>Ctrl+D</b> : dupliquer",
            "🎯 <b>F</b> : recentrer · 🔒 <b>L</b> : verrouiller · 🗑️ <b>Suppr</b> : supprimer",
            "⬆️ <b>R</b> : monter · <b>C</b> : descendre (hauteur du schem) · <b>Échap</b> : annuler",
            "🔄 <b>Flèches</b> : déplacer au sol · <b>Maj</b> : pas ×10",
            "<b>Mode Souris</b> : clic = sélectionner · glisser = déplacer · Ctrl+glisser = dupliquer",
            "<b>Mode Déplacer</b> : tirez les flèches colorées pour déplacer sur un axe",
            "<b>Mode Séparer</b> : X/Y/Z choix face · ←→↑↓ ajuster · Couper ou Dupliquer",
            "<b>Mode Multi</b> : sélectionner plusieurs schems · Unir / Désunir / Exporter",
        ],
        splitter_tag: "Preparation",
        splitter_desc: "Chargez un gros schem, detectez chaque unite, exportez en ZIP.",
        help_splitter: [
            "📂 <b>Import</b>: chargez un .bloxdschem contenant plusieurs assets",
            "✂️ <b>Detect & Split</b>: détecte chaque unité (composantes connexes)",
            "🏢 <b>Plateforme auto-retirée</b>: les couches pleinières (> 85%) sont supprimées",
            "📦 <b>Download ZIP</b>: chaque unité = 1 .bloxdschem (unit001, unit002...)",
            "🖱️ <b>Clic gauche + glisser</b>: orbiter · <b>Clic droit</b>: déplacer (pan)",
            "🖥️ <b>Molette</b>: zoom",
            "🎮 <b>ZQSD/WASD</b>: voler · <b>Espace/Ctrl</b>: monter/descendre · <b>Maj</b>: ×10",
        ],
        help_terrain: [
            "🖱️ <b>Clic gauche + glisser</b> : orbiter la caméra 3D",
            "🖱️ <b>Clic droit + glisser</b> : déplacer la vue",
            "🖥️ <b>Molette</b> : zoom",
            "🎮 <b>ZQSD/WASD + Espace/Ctrl</b> : voler en 3D · <b>Maj</b> : ×3 vitesse",
            "🎥 Bouton <b>Caméra</b> : recentrer la vue 3D",
            "🗺️ <b>Carte 2D</b> : clic gauche = peindre · glisser = déplacer",
            "🎨 <b>Outils</b> : Brush biome, Élever, Creuser, Lisser, Aplatir, Gomme",
            "⭕ <b>Sphère</b> / 📦 <b>Pavé</b> : poser des formes de terrain",
            "↶ <b>Ctrl+Z</b> : annuler · ↷ <b>Ctrl+Y</b> : rétablir",
            "🏔️ Onglet <b>Paramètres</b> : dimensions, graine, relief, biomes, presets",
            "💾 <b>Exporter</b> : génère un .bloxdschem prêt pour Bloxd.io",
        ],
        help_asset: [
            "🖱️ <b>Clic gauche</b> : sélectionner un asset placé",
            "🖱️ <b>Glisser</b> : déplacer l'asset sur le terrain",
            "🖥️ <b>Molette</b> : zoom",
            "🎮 <b>ZQSD/WASD + Espace/Ctrl</b> : voler",
            "🗑️ Bouton <b>Supprimer</b> : supprimer l'asset · 📋 <b>Dupliquer</b> : cloner",
            "📂 <b>Importer (Terrain)</b> : charge un .bloxdschem comme terrain",
            "📤 <b>Exporter</b> : génère un schematic avec les assets placés",
            "🏠 <b>Menu</b> : retour au hub · 🔒 <b>Verrouiller</b> : bloque la sélection",
        ],
    },
    en: {
        brand_sub: "Editor suite",
        settings: "Settings",
        hero_title: "Choose an editor",
        hero_sub: "A suite of 3D tools to build, assemble and export your Bloxd.io schematics. Pick the editor you want to work with.",
        schem_tag: "Assembly",
        schem_desc: "Load, move, slice and merge your .bloxdschem files, then re-export everything. Precise placement with magnetic snapping.",
        open: "Open",
        soon: "Soon",
        terrain_tag: "Terrain",
        terrain_desc: "Sculpt and paint your world's terrain in 3D: elevation, brushes, biomes and import/export.",
        asset_tag: "Props",
        asset_desc: "Place objects, builds and custom assets on your terrain with an organized library.",
        footer: "Bloxd Tools v6.8.1 — Language and keyboard shared across all editors via the",
        lang_note: "Applied to all editors. Remembered between visits.",
        kb_label: "Keyboard layout",
        kb_note: "Controls camera movement keys (ZQSD/WASD) in all editors.",
        close: "Close",
        help_schem: [
            "🖱️ <b>Left-click + drag</b>: orbit camera",
            "🖱️ <b>Right-click + drag</b>: pan view",
            "🖥️ <b>Wheel</b>: zoom",
            "🎮 <b>WASD/ZQSD</b>: fly · <b>Space/Ctrl</b>: up/down · <b>Shift</b>: ×10",
            "🖱️ <b>V</b>: Mouse · <b>G</b>: Move · <b>T</b>: Separate · <b>M</b>: Multi",
            "📂 <b>Ctrl+O</b>: open · 💾 <b>Ctrl+E</b>: export · 📑 <b>Ctrl+D</b>: duplicate",
            "🎯 <b>F</b>: recenter · 🔒 <b>L</b>: lock · 🗑️ <b>Del</b>: delete",
            "⬆️ <b>R</b>: up · <b>C</b>: down (schem height) · <b>Esc</b>: cancel",
            "🔄 <b>Arrow keys</b>: move on ground · <b>Shift</b>: step ×10",
            "<b>Mouse mode</b>: click = select · drag = move · Ctrl+drag = duplicate",
            "<b>Move mode</b>: drag colored arrows to move along an axis",
            "<b>Separate mode</b>: X/Y/Z pick face · arrows adjust · Cut/Duplicate",
            "<b>Multi mode</b>: select multiple schems · Union / Split / Export",
        ],
        help_terrain: [
            "🖱️ <b>Left-click + drag</b>: orbit 3D camera",
            "🖱️ <b>Right-click + drag</b>: pan view",
            "🖥️ <b>Wheel</b>: zoom",
            "🎮 <b>WASD/ZQSD + Space/Ctrl</b>: fly in 3D · <b>Shift</b>: ×3",
            "🎥 <b>Camera</b> button: reset 3D view",
            "🗺️ <b>2D map</b>: left-click = paint · drag = pan",
            "🎨 <b>Tools</b>: Biome brush, Raise, Lower, Smooth, Flatten, Eraser",
            "⭕ <b>Sphere</b> / 📦 <b>Box</b>: stamp terrain shapes",
            "↶ <b>Ctrl+Z</b>: undo · ↷ <b>Ctrl+Y</b>: redo",
            "🏔️ <b>Settings</b> tab: dimensions, seed, relief, biomes, presets",
            "💾 <b>Export</b>: generates a .bloxdschem for Bloxd.io",
        ],
        help_asset: [
            "🖱️ <b>Left-click</b>: select a placed asset",
            "🖱️ <b>Drag</b>: move asset on the terrain",
            "🖥️ <b>Wheel</b>: zoom",
            "🎮 <b>WASD/ZQSD + Space/Ctrl</b>: fly",
            "🗑️ <b>Delete</b> button: remove asset · 📋 <b>Duplicate</b>: clone",
            "📂 <b>Import (Terrain)</b>: load .bloxdschem as base terrain",
            "📤 <b>Export</b>: generate schematic with placed assets",
            "🏠 <b>Menu</b>: back to hub · 🔒 <b>Lock</b>: blocks selection",
        ],
        splitter_tag: "Preparation",
        splitter_desc: "Load a big schem, auto-detect each unit, export as ZIP.",
        help_splitter: [
            "📂 <b>Import</b>: load a .bloxdschem containing multiple assets",
            "✂️ <b>Detect & Split</b>: finds each unit (connected components)",
            "🏢 <b>Auto platform removal</b>: full-area layers (> 85%) are stripped",
            "📦 <b>Download ZIP</b>: each unit = 1 .bloxdschem (unit001, unit002...)",
            "🖱️ <b>Left-click + drag</b>: orbit · <b>Right-click</b>: pan",
            "🖥️ <b>Wheel</b>: zoom",
            "🎮 <b>WASD/ZQSD</b>: fly · <b>Space/Ctrl</b>: up/down · <b>Shift</b>: ×10",
        ],
    },
    ja: {
        brand_sub: "エディタスイート", settings: "設定",
        hero_title: "エディタを選択",
        hero_sub: "Bloxd.ioのスケマティックを作成、組み立て、エクスポートする3Dツールスイートです。使いたいエディタを選んでください。",
        schem_tag: "アセンブリ", schem_desc: ".bloxdschemを読み込み、移動、分割、結合して再エクスポート。正確な配置。",
        open: "開く", soon: "近日",
        terrain_tag: "地形", terrain_desc: "3Dで地形を彫刻・ペイント：標高、ブラシ、バイオーム、インポート/エクスポート。",
        asset_tag: "配置", asset_desc: "整理されたライブラリでオブジェクトや建物を地形に配置。",
        footer: "Bloxd Tools v6.8.1 — すべてのエディタで言語・キーボード共有",
        lang_label: "言語", lang_note: "すべてのエディタに適用。記憶されます。",
        kb_label: "キーボード配列", kb_note: "移動キー（ZQSD/WASD）を制御。",
        close: "閉じる",
        splitter_tag: "準備", splitter_desc: "大きなスケマを読み込み、各ユニットを検出、ZIPエクスポート。",
        help_schem: ["🖱️ <b>左クリック+ドラッグ</b>: カメラ回転","🖱️ <b>右クリック+ドラッグ</b>: パン","🖥️ <b>ホイール</b>: ズーム","🎮 <b>WASD/ZQSD</b>: 飛行 · <b>Space/Ctrl</b>: 上昇/下降 · <b>Shift</b>: ×10","🖱️ <b>V</b>: マウス · <b>G</b>: 移動 · <b>T</b>: 分離 · <b>M</b>: マルチ","📂 <b>Ctrl+O</b>: 開く · 💾 <b>Ctrl+E</b>: エクスポート · 📑 <b>Ctrl+D</b>: 複製","🎯 <b>F</b>: 中央へ · 🔒 <b>L</b>: ロック · 🗑️ <b>Del</b>: 削除","⬆️ <b>R</b>: 上 · <b>C</b>: 下 · <b>Esc</b>: キャンセル","🔄 <b>矢印</b>: 地上移動 · <b>Shift</b>: ×10","<b>マウス</b>: クリック=選択 · ドラッグ=移動 · Ctrl+ドラッグ=複製","<b>移動</b>: 色付き矢印をドラッグ","<b>分離</b>: X/Y/Z 面選択 · 切断/複製","<b>マルチ</b>: 複数選択 · 結合/分割/エクスポート"],
        help_terrain: ["🖱️ <b>左クリック+ドラッグ</b>: 3Dカメラ回転","🖱️ <b>右クリック+ドラッグ</b>: パン","🖥️ <b>ホイール</b>: ズーム","🎮 <b>WASD/ZQSD + Space/Ctrl</b>: 3D飛行 · <b>Shift</b>: ×3","🎥 <b>カメラ</b>ボタン: 3Dリセット","🗺️ <b>2D地図</b>: 左クリック=ペイント · ドラッグ=パン","🎨 <b>ツール</b>: バイオーム, 上昇, 下降, スムーズ, 平坦化, 消去","⭕ <b>球</b> / 📦 <b>箱</b>: 地形スタンプ","↶ <b>Ctrl+Z</b>: 元に戻す · ↷ <b>Ctrl+Y</b>: やり直し","🏔️ <b>設定</b>: 寸法, シード, バイオーム, プリセット","💾 <b>エクスポート</b>: .bloxdschem生成"],
        help_asset: ["🖱️ <b>左クリック</b>: アセット選択","🖱️ <b>ドラッグ</b>: 地形上で移動","🖥️ <b>ホイール</b>: ズーム","🎮 <b>WASD/ZQSD + Space/Ctrl</b>: 飛行","🗑️ <b>削除</b>: アセット除去 · 📋 <b>複製</b>: クローン","📂 <b>インポート</b>: .bloxdschemを地形として読込","📤 <b>エクスポート</b>: 配置済みアセット付きスケマ生成","🏠 <b>メニュー</b>: ハブへ戻る · 🔒 <b>ロック</b>: 選択ブロック"],
        help_splitter: ["📂 <b>インポート</b>: 複数アセットを含む.bloxdschemを読込","✂️ <b>検出&分割</b>: 各ユニットを検出","🏢 <b>プラットフォーム自動削除</b>: 全面層(>85%)を除去","📦 <b>ZIP保存</b>: 各ユニット=1ファイル","🖱️ <b>左クリック+ドラッグ</b>: 回転 · <b>右クリック</b>: パン","🖥️ <b>ホイール</b>: ズーム","🎮 <b>WASD/ZQSD</b>: 飛行 · <b>Space/Ctrl</b>: 上昇/下降 · <b>Shift</b>: ×10"],
    },
    ko: {
        brand_sub: "에디터 모음", settings: "설정",
        hero_title: "에디터 선택",
        hero_sub: "Bloxd.io 스케매틱을 제작, 조립 및 내보내기하는 3D 도구 모음입니다. 원하는 에디터를 선택하세요.",
        schem_tag: "조립", schem_desc: ".bloxdschem 불러오기, 이동, 분할, 병합 후 다시 내보내기. 정밀 배치.",
        open: "열기", soon: "준비 중",
        terrain_tag: "지형", terrain_desc: "3D로 지형 조각 및 페인트: 고도, 브러시, 바이옴, 가져오기/내보내기.",
        asset_tag: "소품", asset_desc: "정리된 라이브러리로 지형에 오브젝트와 건물 배치.",
        footer: "Bloxd Tools v6.8.1 — 모든 에디터에서 언어·키보드 공유",
        lang_label: "언어", lang_note: "모든 에디터에 적용됩니다.",
        kb_label: "키보드 배치", kb_note: "이동 키(ZQSD/WASD)를 제어합니다.",
        close: "닫기",
        splitter_tag: "준비", splitter_desc: "큰 스케매 불러오기, 각 유닛 감지, ZIP 내보내기.",
        help_schem: ["🖱️ <b>좌클릭+드래그</b>: 카메라 회전","🖱️ <b>우클릭+드래그</b>: 팬","🖥️ <b>휠</b>: 줌","🎮 <b>WASD/ZQSD</b>: 비행 · <b>Space/Ctrl</b>: 상승/하강 · <b>Shift</b>: ×10","🖱️ <b>V</b>: 마우스 · <b>G</b>: 이동 · <b>T</b>: 분리 · <b>M</b>: 멀티","📂 <b>Ctrl+O</b>: 열기 · 💾 <b>Ctrl+E</b>: 내보내기 · 📑 <b>Ctrl+D</b>: 복제","🎯 <b>F</b>: 중앙 · 🔒 <b>L</b>: 잠금 · 🗑️ <b>Del</b>: 삭제","⬆️ <b>R</b>: 위 · <b>C</b>: 아래 · <b>Esc</b>: 취소","🔄 <b>방향키</b>: 지상 이동 · <b>Shift</b>: ×10","<b>마우스</b>: 클릭=선택 · 드래그=이동 · Ctrl+드래그=복제","<b>이동</b>: 화살표 드래그","<b>분리</b>: X/Y/Z 면 선택 · 잘라내기/복제","<b>멀티</b>: 다중 선택 · 결합/분할/내보내기"],
        help_terrain: ["🖱️ <b>좌클릭+드래그</b>: 3D 카메라 회전","🖱️ <b>우클릭+드래그</b>: 팬","🖥️ <b>휠</b>: 줌","🎮 <b>WASD/ZQSD + Space/Ctrl</b>: 3D 비행 · <b>Shift</b>: ×3","🎥 <b>카메라</b> 버튼: 3D 리셋","🗺️ <b>2D 지도</b>: 좌클릭=페인트 · 드래그=팬","🎨 <b>도구</b>: 바이옴, 올리기, 내리기, 평탄화, 지우개","⭕ <b>구</b> / 📦 <b>상자</b>: 지형 스탬프","↶ <b>Ctrl+Z</b>: 실행 취소 · ↷ <b>Ctrl+Y</b>: 다시 실행","🏔️ <b>설정</b>: 크기, 시드, 바이옴, 프리셋","💾 <b>내보내기</b>: .bloxdschem 생성"],
        help_asset: ["🖱️ <b>좌클릭</b>: 에셋 선택","🖱️ <b>드래그</b>: 지형 위 이동","🖥️ <b>휠</b>: 줌","🎮 <b>WASD/ZQSD + Space/Ctrl</b>: 비행","🗑️ <b>삭제</b>: 에셋 제거 · 📋 <b>복제</b>: 클론","📂 <b>가져오기</b>: .bloxdschem 지형 로드","📤 <b>내보내기</b>: 배치된 에셋 포함 스케매틱 생성","🏠 <b>메뉴</b>: 허브로 · 🔒 <b>잠금</b>: 선택 차단"],
        help_splitter: ["📂 <b>가져오기</b>: 여러 에셋이 포함된 .bloxdschem 로드","✂️ <b>감지&분할</b>: 각 유닛 감지","🏢 <b>플랫폼 자동 제거</b>: 전면 층(>85%) 제거","📦 <b>ZIP 저장</b>: 각 유닛=1 파일","🖱️ <b>좌클릭+드래그</b>: 회전 · <b>우클릭</b>: 팬","🖥️ <b>휠</b>: 줌","🎮 <b>WASD/ZQSD</b>: 비행 · <b>Space/Ctrl</b>: 상승/하강 · <b>Shift</b>: ×10"],
    },
    th: {
        brand_sub: "ชุดเครื่องมือแก้ไข", settings: "ตั้งค่า",
        hero_title: "เลือกเครื่องมือ",
        hero_sub: "ชุดเครื่องมือ 3D สำหรับสร้าง ประกอบ และส่งออกสเคมาติก Bloxd.io เลือกเครื่องมือที่ต้องการใช้",
        schem_tag: "ประกอบ", schem_desc: "โหลด ย้าย ตัด และรวมไฟล์ .bloxdschem แล้วส่งออกใหม่ จัดวางอย่างแม่นยำ",
        open: "เปิด", soon: "เร็วๆ นี้",
        terrain_tag: "ภูมิประเทศ", terrain_desc: "แกะสลักและวาดภูมิประเทศใน 3D: ความสูง แปรง ไบโอม นำเข้า/ส่งออก",
        asset_tag: "อุปกรณ์", asset_desc: "วางวัตถุและอาคารบนภูมิประเทศด้วยไลบรารีที่จัดระเบียบ",
        footer: "Bloxd Tools v6.8.1 — แชร์ภาษาและคีย์บอร์ดระหว่างเครื่องมือทั้งหมด",
        lang_label: "ภาษา", lang_note: "ใช้กับเครื่องมือทั้งหมด จดจำไว้สำหรับครั้งต่อไป",
        kb_label: "เลย์เอาต์คีย์บอร์ด", kb_note: "ควบคุมปุ่มเคลื่อนที่ (ZQSD/WASD)",
        close: "ปิด",
        splitter_tag: "เตรียม", splitter_desc: "โหลดสเคมาใหญ่ ตรวจจับแต่ละยูนิต ส่งออกเป็น ZIP",
        help_schem: ["🖱️ <b>คลิกซ้าย+ลาก</b>: หมุนกล้อง","🖱️ <b>คลิกขวา+ลาก</b>: เลื่อนมุมมอง","🖥️ <b>ล้อ</b>: ซูม","🎮 <b>WASD/ZQSD</b>: บิน · <b>Space/Ctrl</b>: ขึ้น/ลง · <b>Shift</b>: ×10","🖱️ <b>V</b>: เมาส์ · <b>G</b>: ย้าย · <b>T</b>: แยก · <b>M</b>: หลายตัว","📂 <b>Ctrl+O</b>: เปิด · 💾 <b>Ctrl+E</b>: ส่งออก · 📑 <b>Ctrl+D</b>: ทำซ้ำ","🎯 <b>F</b>: กึ่งกลาง · 🔒 <b>L</b>: ล็อก · 🗑️ <b>Del</b>: ลบ","⬆️ <b>R</b>: ขึ้น · <b>C</b>: ลง · <b>Esc</b>: ยกเลิก","🔄 <b>ลูกศร</b>: เคลื่อนที่ · <b>Shift</b>: ×10","<b>โหมดเมาส์</b>: คลิก=เลือก · ลาก=ย้าย · Ctrl+ลาก=ทำซ้ำ","<b>โหมดย้าย</b>: ลากลูกศรสี","<b>โหมดแยก</b>: เลือกแกน X/Y/Z · ตัด/ทำซ้ำ","<b>โหมดหลายตัว</b>: เลือกหลายสเคมา · รวม/แยก/ส่งออก"],
        help_terrain: ["🖱️ <b>คลิกซ้าย+ลาก</b>: หมุนกล้อง 3D","🖱️ <b>คลิกขวา+ลาก</b>: เลื่อนมุมมอง","🖥️ <b>ล้อ</b>: ซูม","🎮 <b>WASD/ZQSD + Space/Ctrl</b>: บิน 3D · <b>Shift</b>: ×3","🎥 ปุ่ม <b>กล้อง</b>: รีเซ็ต 3D","🗺️ <b>แผนที่ 2D</b>: คลิกซ้าย=วาด · ลาก=เลื่อน","🎨 <b>เครื่องมือ</b>: ไบโอม, ยก, ลด, เรียบ, ราบ, ยางลบ","⭕ <b>ทรงกลม</b> / 📦 <b>กล่อง</b>: ปั้นภูมิประเทศ","↶ <b>Ctrl+Z</b>: ยกเลิก · ↷ <b>Ctrl+Y</b>: ทำซ้ำ","🏔️ <b>ตั้งค่า</b>: ขนาด, ซีด, ไบโอม, พรีเซ็ต","💾 <b>ส่งออก</b>: สร้าง .bloxdschem"],
        help_asset: ["🖱️ <b>คลิกซ้าย</b>: เลือกอุปกรณ์","🖱️ <b>ลาก</b>: ย้ายบนภูมิประเทศ","🖥️ <b>ล้อ</b>: ซูม","🎮 <b>WASD/ZQSD + Space/Ctrl</b>: บิน","🗑️ <b>ลบ</b>: ลบอุปกรณ์ · 📋 <b>ทำซ้ำ</b>: โคลน","📂 <b>นำเข้า</b>: โหลด .bloxdschem เป็นภูมิประเทศ","📤 <b>ส่งออก</b>: สร้างสเคมาติก","🏠 <b>เมนู</b>: กลับหน้าหลัก · 🔒 <b>ล็อก</b>: บล็อกการเลือก"],
        help_splitter: ["📂 <b>นำเข้า</b>: โหลด .bloxdschem ที่มีหลายอุปกรณ์","✂️ <b>ตรวจจับ&แยก</b>: ค้นหาแต่ละยูนิต","🏢 <b>ลบแพลตฟอร์ม</b>: ชั้นเต็ม (>85%) ถูกลบ","📦 <b>บันทึก ZIP</b>: แต่ละยูนิต=1 ไฟล์","🖱️ <b>คลิกซ้าย+ลาก</b>: หมุน · <b>คลิกขวา</b>: เลื่อน","🖥️ <b>ล้อ</b>: ซูม","🎮 <b>WASD/ZQSD</b>: บิน · <b>Space/Ctrl</b>: ขึ้น/ลง · <b>Shift</b>: ×10"],
    }
};
function getLang() {
    const l = localStorage.getItem(LANG_KEY) || 'en';
    return I18N[l] ? l : 'en';
}
function applyLang(lang) {
    if (!I18N[lang]) lang = 'en';
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
    const dict = I18N[lang];
    const fb = I18N.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key] !== undefined) el.textContent = dict[key];
        else if (fb[key] !== undefined) el.textContent = fb[key];
    });
    const pill = document.getElementById('lang-pill');
    if (pill) pill.textContent = lang.toUpperCase();
    document.querySelectorAll('.lang-toggle button[data-lang]').forEach(b => {
        b.classList.toggle('active', b.dataset.lang === lang);
    });
}

function getKb() {
    const k = localStorage.getItem(KB_KEY) || 'azerty';
    return k === 'qwerty' ? 'qwerty' : 'azerty';
}

function applyKb(kb) {
    kb = (kb === 'qwerty') ? 'qwerty' : 'azerty';
    localStorage.setItem(KB_KEY, kb);
    document.querySelectorAll('.lang-toggle button[data-kb]').forEach(b => {
        b.classList.toggle('active', b.dataset.kb === kb);
    });
}

// Empêche Ctrl/Cmd+S de déclencher la sauvegarde de la page (très gênant en édition).
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&(e.key==='s'||e.key==='S'))e.preventDefault();});
document.addEventListener('DOMContentLoaded', () => {
    applyLang(getLang());
    applyKb(getKb());

    const modal = document.getElementById('settings-modal');
    document.getElementById('btn-settings').addEventListener('click', () => { applyLang(getLang()); applyKb(getKb()); modal.classList.add('active'); });
    document.getElementById('btn-settings-close').addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });

    document.querySelectorAll('.lang-toggle button[data-lang]').forEach(b => {
        b.addEventListener('click', () => applyLang(b.dataset.lang));
    });
    document.querySelectorAll('.lang-toggle button[data-kb]').forEach(b => {
        b.addEventListener('click', () => applyKb(b.dataset.kb));
    });

    document.querySelectorAll('.editor-card.disabled').forEach(card => {
        card.addEventListener('click', e => e.preventDefault());
    });

    // Help modal (contrôles par éditeur)
    const helpModal = document.getElementById('help-modal');
    const helpList = document.getElementById('help-modal-list');
    const helpTitle = document.getElementById('help-modal-title');
    const editorNames = { schem: 'Schem Placer', terrain: 'Terrain Editor', asset: 'Asset Placer', splitter: 'Schem Splitter' };
    document.querySelectorAll('.card-help').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            const ed = btn.dataset.help;
            const dict = I18N[getLang()];
            const items = dict['help_' + ed] || I18N.en['help_' + ed];
            if (items) {
                helpTitle.textContent = '❓ ' + (editorNames[ed] || ed);
                helpList.innerHTML = items.map(t => '<li style="padding:3px 0;">' + t + '</li>').join('');
                helpModal.classList.add('active');
            }
        });
    });
    document.getElementById('btn-help-close').addEventListener('click', () => helpModal.classList.remove('active'));
    helpModal.addEventListener('click', e => { if (e.target === helpModal) helpModal.classList.remove('active'); });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { modal.classList.remove('active'); helpModal.classList.remove('active'); }
    });
});

window.BloxdTools = {
    LANG_KEY, KB_KEY,
    getLang: () => localStorage.getItem(LANG_KEY) || 'en',
    getKb:   () => { const k = localStorage.getItem(KB_KEY) || 'azerty'; return k === 'qwerty' ? 'qwerty' : 'azerty'; },
};
})();
