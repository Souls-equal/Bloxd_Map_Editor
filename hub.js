/* Bloxd Tools — Hub principal : i18n partagé + clavier (ZQSD/WASD) + menu Paramètres */
(function () {
'use strict';

const LANG_KEY = 'bloxdTools.lang';
const KB_KEY   = 'bloxdTools.keyboard';

const I18N = {
    fr: {
        brand_sub: "Suite d'éditeurs",
        settings: "Paramètres",
        tab_home: "Accueil",
        hero_title: "Choisissez un éditeur",
        hero_sub: "Chaque outil lit et écrit des fichiers différents. Commence par le Terrain Editor : il produit un .bloxdschem pour Bloxd.io.",
        schem_tag: "Assemblage",
        schem_desc: "Assemble des .bloxdschem (ou un .zip de parties _x…_z…). Déplace, découpe, fusionne, puis ré-exporte un .bloxdschem. Un .schem Minecraft passe d'abord par le Converter.",
        open: "Ouvrir",
        soon: "Bientôt",
        terrain_tag: "Relief",
        terrain_desc: "Premier outil à ouvrir. Sculpte le relief, puis télécharge un .bloxdschem pour le jeu — ou un .json pour reprendre l'édition. Ce ne sont pas le même fichier.",
        asset_tag: "Décoration",
        asset_desc: "Pose des constructions sur un terrain .bloxdschem, puis exporte un .bloxdschem pour Bloxd. Le .json ne sert qu'à sauver la session.",
        footer: "Bloxd Tools v6.11.0 — Langue et clavier partagés entre tous les éditeurs via le menu",
        lang_label: "Langue / Language",
        lang_note: "Appliqué à tous les éditeurs. Garde le choix d'une visite à l'autre.",
        kb_label: "Disposition clavier",
        kb_note: "Contrôle les touches de déplacement (ZQSD/WASD) dans tous les éditeurs.",
        close: "Fermer",
        formats_title: "Quel outil pour quel fichier ?",
        formats_lead: "Le bon fichier au bon endroit. Les mélanger est la raison la plus fréquente d'un import qui échoue.",
        fmt_bloxd_t: ".bloxdschem",
        fmt_bloxd: "Fichier du jeu. Terrain Editor, Schem Placer et Asset Placer le produisent. En jeu : //schematic load nom (sans l'extension).",
        fmt_zip_t: ".zip",
        fmt_zip: "Plusieurs .bloxdschem : monde trop grand, ou un bâtiment par fichier (Splitter). Schem Placer recolle les parties nommées _x…_z….",
        fmt_json_t: ".json",
        fmt_json: "Sauvegarde pour rééditer (Terrain ou Asset). Bloxd ne charge pas ce fichier.",
        fmt_mc_t: ".schem · .schematic · .litematic",
        fmt_mc: "Formats Minecraft. Uniquement Schem Converter, qui les transforme en .bloxdschem.",
        help_schem: [
            "📂 <b>Formats</b> : .bloxdschem, .bin, ou .zip de parties. Minecraft (.schem / .litematic) → d'abord Schem Converter.",
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
        splitter_desc: "Un .bloxdschem qui contient plusieurs bâtiments → un .bloxdschem par bâtiment, dans un .zip. Pas pour les fichiers Minecraft.",
        help_splitter: [
            "📂 <b>Entrée</b> : un .bloxdschem avec plusieurs objets. Pas un .schem Minecraft (passe par le Converter).",
            "📦 <b>Sortie</b> : un .zip, un .bloxdschem par objet (unit001, unit002…).",
            "📂 <b>Import</b>: chargez un .bloxdschem contenant plusieurs assets",
            "✂️ <b>Detect & Split</b>: détecte chaque unité (composantes connexes)",
            "🏢 <b>Plateforme auto-retirée</b>: les couches pleinières (> 85%) sont supprimées",
            "📦 <b>Download ZIP</b>: chaque unité = 1 .bloxdschem (unit001, unit002...)",
            "🖱️ <b>Clic gauche + glisser</b>: orbiter · <b>Clic droit</b>: déplacer (pan)",
            "🖥️ <b>Molette</b>: zoom",
            "🎮 <b>ZQSD/WASD</b>: voler · <b>Espace/Ctrl</b>: monter/descendre · <b>Maj</b>: ×10",
        ],
        converter_tag: "Conversion",
        converter_desc: "Minecraft (.schem, .schematic, .litematic) → .bloxdschem pour Bloxd. Trop grand : un .zip de parties, recollées par Schem Placer.",
        help_converter: [
            "🔄 <b>Sens unique</b> : Minecraft → Bloxd. Entrée .schem / .schematic / .litematic, sortie .bloxdschem (ou .zip si trop grand).",
            "📂 <b>Import</b>: déposez un .schem (Sponge), .schematic (MCEdit) ou .litematic (Litematica)",
            "🔄 <b>Conversion</b>: automatique à l'import — l'axe Z est adapté à Bloxd",
            "🧱 <b>Blocs sans équivalent</b>: remplacés par de la Dirt — ajustables via Mappings (choix mémorisé)",
            "📦 <b>Découpe auto</b>: si le schem dépasse 160 chunks (limite Bloxd), il est découpé en ZIP",
            "📄 <b>Parties _x…_z…</b>: refusionnées automatiquement par Schem Placer à l'import",
            "🖱️ <b>Clic gauche + glisser</b>: orbiter · <b>Clic droit</b>: déplacer (pan)",
            "🖥️ <b>Molette</b>: zoom",
            "🎮 <b>ZQSD/WASD</b>: voler · <b>Espace/Ctrl</b>: monter/descendre · <b>Maj</b>: ×2",
        ],
        help_terrain: [
            "📦 <b>.bloxdschem</b> = fichier du jeu (//schematic load). <b>.json</b> = reprendre l'édition, Bloxd ne le charge pas.",
            "🔄 <b>.schem / .litematic</b> Minecraft : d'abord Schem Converter, puis importe le .bloxdschem ici.",
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
            "📂 <b>Terrain</b> : importe un .bloxdschem. <b>Export</b> : un .bloxdschem pour le jeu. Le .json de session n'est pas un fichier de jeu.",
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
        tab_home: "Home",
        hero_title: "Choose an editor",
        hero_sub: "Each tool reads and writes different files. Start with the Terrain Editor: it produces a .bloxdschem for Bloxd.io.",
        schem_tag: "Assembly",
        schem_desc: "Assemble .bloxdschem files (or a .zip of _x…_z… parts). Move, slice, merge, then re-export a .bloxdschem. A Minecraft .schem goes through the Converter first.",
        open: "Open",
        soon: "Soon",
        terrain_tag: "Terrain",
        terrain_desc: "The first tool to open. Sculpt the relief, then download a .bloxdschem for the game — or a .json to resume editing. They are not the same file.",
        asset_tag: "Props",
        asset_desc: "Place builds on a .bloxdschem terrain, then export a .bloxdschem for Bloxd. The .json only saves the session.",
        footer: "Bloxd Tools v6.11.0 — Language and keyboard shared across all editors via the",
        lang_note: "Applied to all editors. Remembered between visits.",
        kb_label: "Keyboard layout",
        kb_note: "Controls camera movement keys (ZQSD/WASD) in all editors.",
        close: "Close",
        formats_title: "Which tool for which file?",
        formats_lead: "The right file in the right place. Mixing them up is the most common reason an import fails.",
        fmt_bloxd_t: ".bloxdschem",
        fmt_bloxd: "The game file. Terrain Editor, Schem Placer and Asset Placer produce it. In game: //schematic load name (no extension).",
        fmt_zip_t: ".zip",
        fmt_zip: "Several .bloxdschem files: world too big, or one building per file (Splitter). Schem Placer re-merges parts named _x…_z….",
        fmt_json_t: ".json",
        fmt_json: "A save so you can edit again (Terrain or Asset). Bloxd cannot load this file.",
        fmt_mc_t: ".schem · .schematic · .litematic",
        fmt_mc: "Minecraft formats. Schem Converter only — it turns them into a .bloxdschem.",
        help_schem: [
            "📂 <b>Formats</b>: .bloxdschem, .bin, or a .zip of parts. Minecraft (.schem / .litematic) → Schem Converter first.",
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
            "📦 <b>.bloxdschem</b> = game file (//schematic load). <b>.json</b> = resume editing, Bloxd cannot load it.",
            "🔄 <b>.schem / .litematic</b> from Minecraft: Schem Converter first, then import the .bloxdschem here.",
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
            "📂 <b>Terrain</b>: import a .bloxdschem. <b>Export</b>: a .bloxdschem for the game. The session .json is not a game file.",
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
        splitter_desc: "One .bloxdschem that holds several buildings → one .bloxdschem per building, in a .zip. Not for Minecraft files.",
        help_splitter: [
            "📂 <b>Input</b>: a .bloxdschem with several objects. Not a Minecraft .schem (use the Converter).",
            "📦 <b>Output</b>: a .zip, one .bloxdschem per object (unit001, unit002…).",
            "📂 <b>Import</b>: load a .bloxdschem containing multiple assets",
            "✂️ <b>Detect & Split</b>: finds each unit (connected components)",
            "🏢 <b>Auto platform removal</b>: full-area layers (> 85%) are stripped",
            "📦 <b>Download ZIP</b>: each unit = 1 .bloxdschem (unit001, unit002...)",
            "🖱️ <b>Left-click + drag</b>: orbit · <b>Right-click</b>: pan",
            "🖥️ <b>Wheel</b>: zoom",
            "🎮 <b>WASD/ZQSD</b>: fly · <b>Space/Ctrl</b>: up/down · <b>Shift</b>: ×10",
        ],
        converter_tag: "Conversion",
        converter_desc: "Minecraft (.schem, .schematic, .litematic) → .bloxdschem for Bloxd. Too big: a .zip of parts, re-merged by Schem Placer.",
        help_converter: [
            "🔄 <b>One way</b>: Minecraft → Bloxd. In: .schem / .schematic / .litematic. Out: .bloxdschem (or a .zip if too big).",
            "📂 <b>Import</b>: drop a .schem (Sponge), .schematic (MCEdit) or .litematic (Litematica)",
            "🔄 <b>Conversion</b>: automatic on import — the Z axis is adapted to Bloxd",
            "🧱 <b>Blocks with no equivalent</b>: replaced with Dirt — adjustable via Mappings (choice remembered)",
            "📦 <b>Auto-split</b>: schems over 160 chunks (Bloxd limit) are split into a ZIP",
            "📄 <b>_x…_z… parts</b>: automatically re-merged by Schem Placer on import",
            "🖱️ <b>Left-click + drag</b>: orbit · <b>Right-click</b>: pan",
            "🖥️ <b>Wheel</b>: zoom",
            "🎮 <b>WASD/ZQSD</b>: fly · <b>Space/Ctrl</b>: up/down · <b>Shift</b>: ×2",
        ],
    },
    ja: {
        brand_sub: "エディタスイート", settings: "設定", tab_home: "ホーム",
        hero_title: "エディタを選択",
        hero_sub: "ツールごとに読むファイルが違います。まずは Terrain Editor：Bloxd.io 用の .bloxdschem を作ります。",
        schem_tag: "アセンブリ", schem_desc: ".bloxdschem（または _x…_z… の .zip）を組み立てて再書き出し。Minecraft の .schem は先に Converter。",
        open: "開く", soon: "近日",
        terrain_tag: "地形", terrain_desc: "最初に開くツール。地形を作り、ゲーム用は .bloxdschem、続きは .json。別のファイルです。",
        asset_tag: "配置", asset_desc: ".bloxdschem の地形に建物を置き、ゲーム用 .bloxdschem を書き出します。.json はセッション保存だけ。",
        footer: "Bloxd Tools v6.11.0 — すべてのエディタで言語・キーボード共有",
        lang_label: "言語", lang_note: "すべてのエディタに適用。記憶されます。",
        kb_label: "キーボード配列", kb_note: "移動キー（ZQSD/WASD）を制御。",
        close: "閉じる",
        splitter_tag: "準備", splitter_desc: "複数の建物が入った .bloxdschem → 建物ごとに1ファイル、ZIPで保存。Minecraft 形式は不可。",
        help_schem: ["📂 <b>形式</b>: .bloxdschem / .bin / パーツの .zip。Minecraft は先に Converter。","🖱️ <b>左クリック+ドラッグ</b>: カメラ回転","🖱️ <b>右クリック+ドラッグ</b>: パン","🖥️ <b>ホイール</b>: ズーム","🎮 <b>WASD/ZQSD</b>: 飛行 · <b>Space/Ctrl</b>: 上昇/下降 · <b>Shift</b>: ×10","🖱️ <b>V</b>: マウス · <b>G</b>: 移動 · <b>T</b>: 分離 · <b>M</b>: マルチ","📂 <b>Ctrl+O</b>: 開く · 💾 <b>Ctrl+E</b>: エクスポート · 📑 <b>Ctrl+D</b>: 複製","🎯 <b>F</b>: 中央へ · 🔒 <b>L</b>: ロック · 🗑️ <b>Del</b>: 削除","⬆️ <b>R</b>: 上 · <b>C</b>: 下 · <b>Esc</b>: キャンセル","🔄 <b>矢印</b>: 地上移動 · <b>Shift</b>: ×10","<b>マウス</b>: クリック=選択 · ドラッグ=移動 · Ctrl+ドラッグ=複製","<b>移動</b>: 色付き矢印をドラッグ","<b>分離</b>: X/Y/Z 面選択 · 切断/複製","<b>マルチ</b>: 複数選択 · 結合/分割/エクスポート"],
        help_terrain: ["📦 <b>.bloxdschem</b> = ゲーム用。<b>.json</b> = 編集の続き（Bloxd は読めない）。","🔄 Minecraft の .schem は先に Converter。","🖱️ <b>左クリック+ドラッグ</b>: 3Dカメラ回転","🖱️ <b>右クリック+ドラッグ</b>: パン","🖥️ <b>ホイール</b>: ズーム","🎮 <b>WASD/ZQSD + Space/Ctrl</b>: 3D飛行 · <b>Shift</b>: ×3","🎥 <b>カメラ</b>ボタン: 3Dリセット","🗺️ <b>2D地図</b>: 左クリック=ペイント · ドラッグ=パン","🎨 <b>ツール</b>: バイオーム, 上昇, 下降, スムーズ, 平坦化, 消去","⭕ <b>球</b> / 📦 <b>箱</b>: 地形スタンプ","↶ <b>Ctrl+Z</b>: 元に戻す · ↷ <b>Ctrl+Y</b>: やり直し","🏔️ <b>設定</b>: 寸法, シード, バイオーム, プリセット","💾 <b>エクスポート</b>: .bloxdschem生成"],
        help_asset: ["📂 地形は .bloxdschem。書き出しも .bloxdschem。セッション .json はゲーム用ではない。","🖱️ <b>左クリック</b>: アセット選択","🖱️ <b>ドラッグ</b>: 地形上で移動","🖥️ <b>ホイール</b>: ズーム","🎮 <b>WASD/ZQSD + Space/Ctrl</b>: 飛行","🗑️ <b>削除</b>: アセット除去 · 📋 <b>複製</b>: クローン","📂 <b>インポート</b>: .bloxdschemを地形として読込","📤 <b>エクスポート</b>: 配置済みアセット付きスケマ生成","🏠 <b>メニュー</b>: ハブへ戻る · 🔒 <b>ロック</b>: 選択ブロック"],
        help_splitter: ["📂 <b>入力</b>: 複数オブジェクトの .bloxdschem。Minecraft 形式は不可。","📦 <b>出力</b>: オブジェクトごとに1ファイルの ZIP。","📂 <b>インポート</b>: 複数アセットを含む.bloxdschemを読込","✂️ <b>検出&分割</b>: 各ユニットを検出","🏢 <b>プラットフォーム自動削除</b>: 全面層(>85%)を除去","📦 <b>ZIP保存</b>: 各ユニット=1ファイル","🖱️ <b>左クリック+ドラッグ</b>: 回転 · <b>右クリック</b>: パン","🖥️ <b>ホイール</b>: ズーム","🎮 <b>WASD/ZQSD</b>: 飛行 · <b>Space/Ctrl</b>: 上昇/下降 · <b>Shift</b>: ×10"],
        converter_tag: "変換",
        formats_title: "どのツールにどのファイル？",
        formats_lead: "ファイルを間違えると読み込めません。",
        fmt_bloxd_t: ".bloxdschem",
        fmt_bloxd: "ゲーム用ファイル。Terrain / Placer / Asset が出力します。ゲーム内は //schematic load 名前（拡張子なし）。",
        fmt_zip_t: ".zip",
        fmt_zip: "大きすぎるワールド、または建物ごとのファイル。_x…_z… のパーツは Schem Placer が再結合します。",
        fmt_json_t: ".json",
        fmt_json: "編集を再開するための保存。Bloxd は読めません。",
        fmt_mc_t: ".schem · .schematic · .litematic",
        fmt_mc: "Minecraft 形式。Schem Converter だけが .bloxdschem に変換します。",
        converter_desc: "Minecraft（.schem / .schematic / .litematic）→ Bloxd 用 .bloxdschem。大きすぎると ZIP。",
        help_converter: ["🔄 <b>一方通行</b>: Minecraft → Bloxd。.bloxdschem（大きすぎると ZIP）。","📂 <b>インポート</b>: .schem（Sponge）/ .schematic（MCEdit）/ .litematic（Litematica）をドロップ","🔄 <b>変換</b>: 読み込み時に自動 — Z軸はBloxd向けに調整","🧱 <b>対応なしブロック</b>: Dirtに置換 — 「ブロック対応」で調整可（保存される）","📦 <b>自動分割</b>: 160チャンク超（Bloxd制限）はZIPに分割","📄 <b>_x…_z… パーツ</b>: Schem Placerがインポート時に自動再結合","🖱️ <b>左クリック+ドラッグ</b>: 回転 · <b>右クリック</b>: パン","🖥️ <b>ホイール</b>: ズーム","🎮 <b>WASD/ZQSD</b>: 飛行 · <b>Space/Ctrl</b>: 上昇/下降 · <b>Shift</b>: ×2"],
    },
    ko: {
        brand_sub: "에디터 모음", settings: "설정", tab_home: "홈",
        hero_title: "에디터 선택",
        hero_sub: "도구마다 읽는 파일이 다릅니다. 먼저 Terrain Editor: Bloxd.io용 .bloxdschem을 만듭니다.",
        schem_tag: "조립", schem_desc: ".bloxdschem(또는 _x…_z… .zip)을 조립해 다시 내보냅니다. 마인크래프트 .schem은 먼저 Converter.",
        open: "열기", soon: "준비 중",
        terrain_tag: "지형", terrain_desc: "가장 먼저 여는 도구. 지형을 만든 뒤 게임용은 .bloxdschem, 이어하기는 .json. 다른 파일입니다.",
        asset_tag: "소품", asset_desc: ".bloxdschem 지형 위에 건물을 놓고 게임용 .bloxdschem을 내보냅니다. .json은 세션 저장만.",
        footer: "Bloxd Tools v6.11.0 — 모든 에디터에서 언어·키보드 공유",
        lang_label: "언어", lang_note: "모든 에디터에 적용됩니다.",
        kb_label: "키보드 배치", kb_note: "이동 키(ZQSD/WASD)를 제어합니다.",
        close: "닫기",
        splitter_tag: "준비", splitter_desc: "건물이 여러 개인 .bloxdschem → 건물마다 1파일, ZIP. 마인크래프트 형식은 안 됩니다.",
        help_schem: ["📂 <b>형식</b>: .bloxdschem / .bin / 파트 .zip. 마인크래프트는 먼저 Converter.","🖱️ <b>좌클릭+드래그</b>: 카메라 회전","🖱️ <b>우클릭+드래그</b>: 팬","🖥️ <b>휠</b>: 줌","🎮 <b>WASD/ZQSD</b>: 비행 · <b>Space/Ctrl</b>: 상승/하강 · <b>Shift</b>: ×10","🖱️ <b>V</b>: 마우스 · <b>G</b>: 이동 · <b>T</b>: 분리 · <b>M</b>: 멀티","📂 <b>Ctrl+O</b>: 열기 · 💾 <b>Ctrl+E</b>: 내보내기 · 📑 <b>Ctrl+D</b>: 복제","🎯 <b>F</b>: 중앙 · 🔒 <b>L</b>: 잠금 · 🗑️ <b>Del</b>: 삭제","⬆️ <b>R</b>: 위 · <b>C</b>: 아래 · <b>Esc</b>: 취소","🔄 <b>방향키</b>: 지상 이동 · <b>Shift</b>: ×10","<b>마우스</b>: 클릭=선택 · 드래그=이동 · Ctrl+드래그=복제","<b>이동</b>: 화살표 드래그","<b>분리</b>: X/Y/Z 면 선택 · 잘라내기/복제","<b>멀티</b>: 다중 선택 · 결합/분할/내보내기"],
        help_terrain: ["📦 <b>.bloxdschem</b> = 게임용. <b>.json</b> = 편집 이어하기 (Bloxd는 못 읽음).","🔄 마인크래프트 .schem은 먼저 Converter.","🖱️ <b>좌클릭+드래그</b>: 3D 카메라 회전","🖱️ <b>우클릭+드래그</b>: 팬","🖥️ <b>휠</b>: 줌","🎮 <b>WASD/ZQSD + Space/Ctrl</b>: 3D 비행 · <b>Shift</b>: ×3","🎥 <b>카메라</b> 버튼: 3D 리셋","🗺️ <b>2D 지도</b>: 좌클릭=페인트 · 드래그=팬","🎨 <b>도구</b>: 바이옴, 올리기, 내리기, 평탄화, 지우개","⭕ <b>구</b> / 📦 <b>상자</b>: 지형 스탬프","↶ <b>Ctrl+Z</b>: 실행 취소 · ↷ <b>Ctrl+Y</b>: 다시 실행","🏔️ <b>설정</b>: 크기, 시드, 바이옴, 프리셋","💾 <b>내보내기</b>: .bloxdschem 생성"],
        help_asset: ["📂 지형은 .bloxdschem. 내보내기도 .bloxdschem. 세션 .json은 게임 파일이 아님.","🖱️ <b>좌클릭</b>: 에셋 선택","🖱️ <b>드래그</b>: 지형 위 이동","🖥️ <b>휠</b>: 줌","🎮 <b>WASD/ZQSD + Space/Ctrl</b>: 비행","🗑️ <b>삭제</b>: 에셋 제거 · 📋 <b>복제</b>: 클론","📂 <b>가져오기</b>: .bloxdschem 지형 로드","📤 <b>내보내기</b>: 배치된 에셋 포함 스케매틱 생성","🏠 <b>메뉴</b>: 허브로 · 🔒 <b>잠금</b>: 선택 차단"],
        help_splitter: ["📂 <b>입력</b>: 오브젝트가 여러 개인 .bloxdschem. 마인크래프트 형식 불가.","📦 <b>출력</b>: 오브젝트마다 1파일인 ZIP.","📂 <b>가져오기</b>: 여러 에셋이 포함된 .bloxdschem 로드","✂️ <b>감지&분할</b>: 각 유닛 감지","🏢 <b>플랫폼 자동 제거</b>: 전면 층(>85%) 제거","📦 <b>ZIP 저장</b>: 각 유닛=1 파일","🖱️ <b>좌클릭+드래그</b>: 회전 · <b>우클릭</b>: 팬","🖥️ <b>휠</b>: 줌","🎮 <b>WASD/ZQSD</b>: 비행 · <b>Space/Ctrl</b>: 상승/하강 · <b>Shift</b>: ×10"],
        converter_tag: "변환",
        formats_title: "어떤 도구에 어떤 파일?",
        formats_lead: "파일을 섞으면 가져오기가 실패합니다.",
        fmt_bloxd_t: ".bloxdschem",
        fmt_bloxd: "게임 파일. Terrain / Placer / Asset이 만듭니다. 게임에서 //schematic load 이름 (확장자 없이).",
        fmt_zip_t: ".zip",
        fmt_zip: "너무 큰 월드, 또는 건물마다 1파일. _x…_z… 파트는 Schem Placer가 다시 합칩니다.",
        fmt_json_t: ".json",
        fmt_json: "편집을 이어가는 저장. Bloxd는 읽지 못합니다.",
        fmt_mc_t: ".schem · .schematic · .litematic",
        fmt_mc: "마인크래프트 형식. Schem Converter만 .bloxdschem으로 바꿉니다.",
        converter_desc: "마인크래프트(.schem / .schematic / .litematic) → Bloxd용 .bloxdschem. 너무 크면 ZIP.",
        help_converter: ["🔄 <b>한 방향</b>: 마인크래프트 → Bloxd. .bloxdschem (너무 크면 ZIP).","📂 <b>가져오기</b>: .schem(Sponge) / .schematic(MCEdit) / .litematic(Litematica) 드롭","🔄 <b>변환</b>: 가져오기 시 자동 — Z축이 Bloxd에 맞게 조정됨","🧱 <b>대응 없는 블록</b>: Dirt로 대체 — 「블록 매핑」에서 조정(저장됨)","📦 <b>자동 분할</b>: 160청록 초과(Bloxd 제한) 시 ZIP으로 분할","📄 <b>_x…_z… 파트</b>: Schem Placer에서 가져오면 자동 병합","🖱️ <b>좌클릭+드래그</b>: 회전 · <b>우클릭</b>: 팬","🖥️ <b>휠</b>: 줌","🎮 <b>WASD/ZQSD</b>: 비행 · <b>Space/Ctrl</b>: 상승/하강 · <b>Shift</b>: ×2"],
    },
    th: {
        brand_sub: "ชุดเครื่องมือแก้ไข", settings: "ตั้งค่า", tab_home: "หน้าแรก",
        hero_title: "เลือกเครื่องมือ",
        hero_sub: "แต่ละเครื่องมืออ่านคนละไฟล์ เริ่มที่ Terrain Editor: สร้าง .bloxdschem สำหรับ Bloxd.io",
        schem_tag: "ประกอบ", schem_desc: "ประกอบ .bloxdschem (หรือ .zip ของชิ้นส่วน _x…_z…) แล้วส่งออกใหม่ ไฟล์ .schem ของ Minecraft ต้องผ่าน Converter ก่อน",
        open: "เปิด", soon: "เร็วๆ นี้",
        terrain_tag: "ภูมิประเทศ", terrain_desc: "เครื่องมือแรกที่ควรเปิด ปั้นภูมิประเทศ แล้วดาวน์โหลด .bloxdschem สำหรับเกม — หรือ .json เพื่อทำต่อ คนละไฟล์",
        asset_tag: "อุปกรณ์", asset_desc: "วางสิ่งปลูกสร้างบนภูมิประเทศ .bloxdschem แล้วส่งออก .bloxdschem .json ใช้เซฟเซสชันเท่านั้น",
        footer: "Bloxd Tools v6.11.0 — แชร์ภาษาและคีย์บอร์ดระหว่างเครื่องมือทั้งหมด",
        lang_label: "ภาษา", lang_note: "ใช้กับเครื่องมือทั้งหมด จดจำไว้สำหรับครั้งต่อไป",
        kb_label: "เลย์เอาต์คีย์บอร์ด", kb_note: "ควบคุมปุ่มเคลื่อนที่ (ZQSD/WASD)",
        close: "ปิด",
        splitter_tag: "เตรียม", splitter_desc: ".bloxdschem ที่มีหลายอาคาร → หนึ่งไฟล์ต่ออาคาร ใน .zip ไม่รองรับไฟล์ Minecraft",
        help_schem: ["📂 <b>รูปแบบ</b>: .bloxdschem / .bin / .zip ของชิ้นส่วน Minecraft ต้องผ่าน Converter ก่อน","🖱️ <b>คลิกซ้าย+ลาก</b>: หมุนกล้อง","🖱️ <b>คลิกขวา+ลาก</b>: เลื่อนมุมมอง","🖥️ <b>ล้อ</b>: ซูม","🎮 <b>WASD/ZQSD</b>: บิน · <b>Space/Ctrl</b>: ขึ้น/ลง · <b>Shift</b>: ×10","🖱️ <b>V</b>: เมาส์ · <b>G</b>: ย้าย · <b>T</b>: แยก · <b>M</b>: หลายตัว","📂 <b>Ctrl+O</b>: เปิด · 💾 <b>Ctrl+E</b>: ส่งออก · 📑 <b>Ctrl+D</b>: ทำซ้ำ","🎯 <b>F</b>: กึ่งกลาง · 🔒 <b>L</b>: ล็อก · 🗑️ <b>Del</b>: ลบ","⬆️ <b>R</b>: ขึ้น · <b>C</b>: ลง · <b>Esc</b>: ยกเลิก","🔄 <b>ลูกศร</b>: เคลื่อนที่ · <b>Shift</b>: ×10","<b>โหมดเมาส์</b>: คลิก=เลือก · ลาก=ย้าย · Ctrl+ลาก=ทำซ้ำ","<b>โหมดย้าย</b>: ลากลูกศรสี","<b>โหมดแยก</b>: เลือกแกน X/Y/Z · ตัด/ทำซ้ำ","<b>โหมดหลายตัว</b>: เลือกหลายสเคมา · รวม/แยก/ส่งออก"],
        help_terrain: ["📦 <b>.bloxdschem</b> = ไฟล์เกม <b>.json</b> = ทำต่อ (Bloxd โหลดไม่ได้)","🔄 .schem ของ Minecraft ต้องผ่าน Converter ก่อน","🖱️ <b>คลิกซ้าย+ลาก</b>: หมุนกล้อง 3D","🖱️ <b>คลิกขวา+ลาก</b>: เลื่อนมุมมอง","🖥️ <b>ล้อ</b>: ซูม","🎮 <b>WASD/ZQSD + Space/Ctrl</b>: บิน 3D · <b>Shift</b>: ×3","🎥 ปุ่ม <b>กล้อง</b>: รีเซ็ต 3D","🗺️ <b>แผนที่ 2D</b>: คลิกซ้าย=วาด · ลาก=เลื่อน","🎨 <b>เครื่องมือ</b>: ไบโอม, ยก, ลด, เรียบ, ราบ, ยางลบ","⭕ <b>ทรงกลม</b> / 📦 <b>กล่อง</b>: ปั้นภูมิประเทศ","↶ <b>Ctrl+Z</b>: ยกเลิก · ↷ <b>Ctrl+Y</b>: ทำซ้ำ","🏔️ <b>ตั้งค่า</b>: ขนาด, ซีด, ไบโอม, พรีเซ็ต","💾 <b>ส่งออก</b>: สร้าง .bloxdschem"],
        help_asset: ["📂 ภูมิประเทศเป็น .bloxdschem ส่งออกก็ .bloxdschem .json ของเซสชันไม่ใช่ไฟล์เกม","🖱️ <b>คลิกซ้าย</b>: เลือกอุปกรณ์","🖱️ <b>ลาก</b>: ย้ายบนภูมิประเทศ","🖥️ <b>ล้อ</b>: ซูม","🎮 <b>WASD/ZQSD + Space/Ctrl</b>: บิน","🗑️ <b>ลบ</b>: ลบอุปกรณ์ · 📋 <b>ทำซ้ำ</b>: โคลน","📂 <b>นำเข้า</b>: โหลด .bloxdschem เป็นภูมิประเทศ","📤 <b>ส่งออก</b>: สร้างสเคมาติก","🏠 <b>เมนู</b>: กลับหน้าหลัก · 🔒 <b>ล็อก</b>: บล็อกการเลือก"],
        help_splitter: ["📂 <b>นำเข้า</b>: .bloxdschem ที่มีหลายวัตถุ ไม่ใช่ไฟล์ Minecraft","📦 <b>ส่งออก</b>: ZIP หนึ่งไฟล์ต่อวัตถุ","📂 <b>นำเข้า</b>: โหลด .bloxdschem ที่มีหลายอุปกรณ์","✂️ <b>ตรวจจับ&แยก</b>: ค้นหาแต่ละยูนิต","🏢 <b>ลบแพลตฟอร์ม</b>: ชั้นเต็ม (>85%) ถูกลบ","📦 <b>บันทึก ZIP</b>: แต่ละยูนิต=1 ไฟล์","🖱️ <b>คลิกซ้าย+ลาก</b>: หมุน · <b>คลิกขวา</b>: เลื่อน","🖥️ <b>ล้อ</b>: ซูม","🎮 <b>WASD/ZQSD</b>: บิน · <b>Space/Ctrl</b>: ขึ้น/ลง · <b>Shift</b>: ×10"],
        converter_tag: "แปลง",
        formats_title: "เครื่องมือไหนสำหรับไฟล์ไหน?",
        formats_lead: "ใส่ไฟล์ผิดที่ แล้วจะนำเข้าไม่สำเร็จ",
        fmt_bloxd_t: ".bloxdschem",
        fmt_bloxd: "ไฟล์ของเกม Terrain / Placer / Asset สร้างไฟล์นี้ ในเกม: //schematic load ชื่อ (ไม่ใส่นามสกุล)",
        fmt_zip_t: ".zip",
        fmt_zip: "หลายไฟล์ .bloxdschem: โลกใหญ่เกิน หรือหนึ่งอาคารต่อไฟล์ Schem Placer รวมชิ้นส่วน _x…_z… กลับ",
        fmt_json_t: ".json",
        fmt_json: "เซฟเพื่อแก้ต่อ Bloxd โหลดไม่ได้",
        fmt_mc_t: ".schem · .schematic · .litematic",
        fmt_mc: "รูปแบบ Minecraft ใช้ได้แค่ Schem Converter ซึ่งแปลงเป็น .bloxdschem",
        converter_desc: "Minecraft (.schem / .schematic / .litematic) → .bloxdschem ใหญ่เกินจะได้ .zip",
        help_converter: ["🔄 <b>ทางเดียว</b>: Minecraft → Bloxd ได้ .bloxdschem (ใหญ่เกินเป็น ZIP)","📂 <b>นำเข้า</b>: วางไฟล์ .schem (Sponge) / .schematic (MCEdit) / .litematic (Litematica)","🔄 <b>แปลง</b>: อัตโนมัติเมื่อนำเข้า — แกน Z ปรับให้เข้ากับ Bloxd","🧱 <b>บล็อกไม่มีตัวเทียบ</b>: แทนด้วย Dirt — ปรับได้ที่「การจับคู่บล็อก」(จดจำไว้)","📦 <b>แยกอัตโนมัติ</b>: เกิน 160 ชังก์ (ขีดจำกัด Bloxd) จะแยกเป็น ZIP","📄 <b>ชิ้นส่วน _x…_z…</b>: Schem Placer รวมกลับอัตโนมัติเมื่อนำเข้า","🖱️ <b>คลิกซ้าย+ลาก</b>: หมุน · <b>คลิกขวา</b>: เลื่อน","🖥️ <b>ล้อ</b>: ซูม","🎮 <b>WASD/ZQSD</b>: บิน · <b>Space/Ctrl</b>: ขึ้น/ลง · <b>Shift</b>: ×2"],
    }
};
function detectLang() {
    try {
        const nav = (navigator.language || 'en').toLowerCase();
        const code = nav.slice(0, 2);
        if (I18N[code]) return code;
    } catch (e) {}
    return 'en';
}
function getLang() {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && I18N[stored]) return stored;
    return detectLang();
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
    const k = localStorage.getItem(KB_KEY);
    if (k === 'qwerty' || k === 'azerty') return k;
    return getLang() === 'fr' ? 'azerty' : 'qwerty';
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
    const editorNames = { schem: 'Schem Placer', terrain: 'Terrain Editor', asset: 'Asset Placer', splitter: 'Schem Splitter', converter: 'Schem Converter' };
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

    window.addEventListener('message', (event) => {
        const data = event.data;
        if (!data || typeof data !== 'object') return;
        if (data.type === 'bloxdTools:openSettings') window.BloxdTools.openSettings();
    });
});

window.BloxdTools = {
    LANG_KEY, KB_KEY,
    getLang, getKb, applyLang, applyKb,
    openSettings() {
        const modal = document.getElementById('settings-modal');
        if (!modal) return;
        applyLang(getLang());
        applyKb(getKb());
        modal.classList.add('active');
    },
};
})();
