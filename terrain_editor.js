/* ============================================================
   Bloxd Terrain Editor — terrain_editor.js
   ------------------------------------------------------------
   PERF — JSZip n'est plus embarqué dans ce fichier.
   La bibliothèque (95 Ko minifiée) ne servait qu'à UN seul endroit :
   l'export .zip des mondes découpés en parties. Elle était pourtant
   téléchargée, analysée et compilée à CHAQUE ouverture de l'éditeur,
   ce qui retarde le premier affichage — surtout sur un portable modeste,
   où la compilation de 95 Ko de JS coûte plus cher que le reste du boot.
   Elle est donc devenue un fichier à part (vendor/jszip.min.js), chargé
   à la demande par ensureJsZip() uniquement quand on clique sur « zip ».
   ============================================================ */

/**
 * Charge JSZip à la demande (une seule fois, mis en cache).
 * @returns {Promise<Function>} le constructeur JSZip
 */
window.ensureJsZip = (function () {
    let promise = null;
    return function ensureJsZip() {
        if (typeof window.JSZip !== 'undefined') return Promise.resolve(window.JSZip);
        if (promise) return promise;
        promise = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'vendor/jszip.min.js';
            s.async = true;
            s.onload = () => (typeof window.JSZip !== 'undefined')
                ? resolve(window.JSZip)
                : reject(new Error('JSZip chargé mais indisponible'));
            s.onerror = () => {
                promise = null;
                reject(new Error("JSZip n’a pas pu être chargé (réseau ?) — réessayez l’export."));
            };
            document.head.appendChild(s);
        });
        return promise;
    };
})();

/* ═══ code propre terrain editor (fusionné) ═══ */

/**
 * terrain_editor.js — CODE PROPRE COMPLET (fusionné)
 * Contient: i18n, generator, map2d, map3d, ui, main
 */

/* ──── core ──── */

/**
 * terrain_editor_core.js — DONNÉES & GÉNÉRATION (fusionné)
 * Contient: i18n, generator
 */

/* ═══════════════════════════════════════════════════════════════ */
/*  i18n  */
/* ═══════════════════════════════════════════════════════════════ */

/* ============================================================
   Bloxd Terrain Editor — terrain_editor_i18n.js
   Internationalisation FR/EN (dictionnaires, window.t, applyLanguage, toggleLanguage).
   Chargement : 3/8 — avant l'UI et le générateur (voir <script> dans terrain_editor.html)
   ============================================================ */

            window.safeStorage = window.safeStorage || {
    _data: {},
    getItem(k) {
        try { return window.localStorage.getItem(k); }
        catch (e) { return this._data[k] || null; }
    },
    setItem(k, v) {
        try { window.localStorage.setItem(k, v); }
        catch (e) { this._data[k] = v; }
    },
    removeItem(k) {
        try { window.localStorage.removeItem(k); }
        catch (e) { delete this._data[k]; }
    }
};

/**
 * GIGA PROMPT - Bloxd Terrain Editor
 * Module : terrain_editor_i18n.js
 * Rôle : Système de traduction en direct (Français <-> Anglais)
 */

window.I18N = {
    lang: window.safeStorage.getItem('bloxdTools.lang') || window.safeStorage.getItem('bloxd_lang') || 'en',
    dict: {
        fr: {
            appTitle: "Bloxd Terrain Editor",
            langToggleTitle: "Switch to English / Changer en Anglais",
            langToggleFlag: "🇬🇧",
            langToggleText: "EN",
            loadingTitle: "Génération de l'univers Bloxd...",
            loadingSub: "Initialisation des moteurs 2D & 3D Voxel",
            errLoadingTitle: "Erreur de chargement",
            
            tabSettings: "<i class=\"fas fa-sliders-h\"></i> Paramètres",
            tabEditor: "<i class=\"fas fa-paint-brush\"></i> Éditeur",
            
            secDimensions: "Dimensions du Monde",
            labelWidthX: "Largeur X",
            labelLengthZ: "Longueur Z",
            labelSeed: "Graine (Seed)",
            labelGroundDetail: "Détail du sol",
            labelFlatTerrain: "🏜️ Terrain 100% plat (ignorer la graine)",
            titleFlatTerrain: "Le terrain de base est entièrement plat (la graine n'a plus d'effet sur le relief). Astuce : mets aussi 'Détail du sol' sur Lisse pour un sol parfaitement plan.",
            labelIslandMode: "🏝️ Mode île (entouré d'eau)",
            titleIslandMode: "Le terrain plonge sous l'eau aux bords pour créer une île entourée d'océan.",
            labelFlattenExact: "Aplatir à 100% (niveau exact)",
            titleFlattenExact: "Tout le cercle est mis exactement au niveau du premier clic (pas de fondu sur les bords).",
            titleGroundDetail: "Micro-relief ajouté au sol en vue rapprochée et à l'export (bosses de ±1 bloc). 0 = sol lisse.",
            optGdNone: "⬜ Lisse (aucun)",
            optGdLight: "🌿 Léger",
            optGdNormal: "🌾 Normal",
            optGdRough: "🪨 Accidenté",
            titleRandomSeed: "Graine aléatoire",
            
            
            labelBaseY: "Base Y",
            labelSeaLevel: "Niveau Eau",
            
            secRelief: "Relief Procédural",
            labelMinH: "Hauteur Min",
            labelMaxH: "Hauteur Max",
            labelNoiseScale: "Échelle Bruit",
            labelIntensity: "Intensité",
            labelRoughness: "Rugosité Crêtes",
            
            secPresets: "Presets & Actions",
            presetDefault: "-- Choisir un Preset --",
            btnUndo: "Annuler",
            btnRedo: "Rétablir",
            toastUndo: "↩️ Action annulée (Ctrl+Z)",
            toastRedo: "↪️ Action rétablie (Ctrl+Y)",
            btnReset: "<i class=\"fas fa-trash-alt\"></i> Reset",
            btnSavePreset: "<i class=\"fas fa-save\"></i> Sauver Preset",
            secTeamShare: "Reprendre plus tard",
            btnExportProjectJson: "Sauver le projet (.json)",
            btnImportProjectJson: "Reprendre un .json",
            btnImportBloxdschem: "Importer un terrain (.bloxdschem)",
            titleExportJson: "Sauvegarde pour rééditer ici ou la partager. Ce n'est pas un fichier que Bloxd peut charger.",
            titleImportJson: "Rouvre un projet .json enregistré avec le bouton du dessus.",
            titleImportSchem: "Reconstruit le relief à partir d'un .bloxdschem (pas les bâtiments). Un .schem Minecraft doit d'abord passer par Schem Converter.",
            coachTitle: "3 étapes pour ne pas se perdre",
            coachStep1: "Cet onglet règle la taille, la graine et les biomes.",
            coachStep2: "Onglet Éditeur : clic gauche sur la carte 2D pour peindre ou sculpter. La vue 3D sert à regarder.",
            coachStep3: "En bas, choisis le bon fichier : .bloxdschem pour le jeu, .json pour reprendre plus tard.",
            coachMore: "Guide des formats",
            formatTitle: "Quel fichier pour quoi ?",
            formatLead: "Trois formats différents. Les mélanger est la cause n°1 des erreurs.",
            formatBloxd: "fichier du jeu. Charge-le avec //schematic load nom (sans l'extension).",
            formatZip: "seulement si le monde est trop grand : plusieurs .bloxdschem + un guide. Charge chaque partie au même Y.",
            formatJson: "sauvegarde pour rééditer ici. Bloxd ne charge pas ce fichier.",
            formatMc: "Minecraft (.schem, .schematic, .litematic) : d'abord Schem Converter, qui produit un .bloxdschem.",
            formatDownloadHint: "Petit monde → 1 .bloxdschem. Monde trop grand → un .zip. Le .json n'est pas inclus : c'est le bouton en dessous.",
            guideTitle: "Guide — Terrain Editor",
            guideUseTitle: "Utiliser l'éditeur",
            guideStep3d: "ZQSD ou WASD + Espace/Ctrl pour voler en 3D. Les touches se changent dans ⚙️ Paramètres.",
            guideFmtTitle: "Échanger des schémas",
            guideKeys: "Langue et touches : 🏠 puis ⚙️ Paramètres. Une fenêtre le rappelle au premier lancement.",
            guideClose: "Fermer",
            modalIngameTitle: "En jeu",
            modalIngame1: "Place le .bloxdschem dans le dossier schématiques de Bloxd.",
            modalIngame2: "Ouvre le tchat et tape //schematic load nomdufichier (sans .bloxdschem).",
            modalIngame3: "Si tu as un .zip : ouvre-le, lis le guide, et charge chaque partie en restant à la même hauteur Y. Sinon les morceaux se décalent.",
            
            secBiomes: "Biomes (cliquer pour défaut)",
            secZones: "Zones du terrain", zoneHint: "Créez des zones adjacentes pour construire un grand monde sans faire laguer. Seule la zone active est chargée.",
            btnDeleteZone: "Suppr. zone", modalExportScope: "Périmètre d'export",
            modalExportActive: "Zone active uniquement", modalExportAll: "Toutes les zones (fusionnées)",
            
            secPalette: "Palette Biomes (Peinture)",
            secTools: "Outils Peinture & Sculpture",
            toolBiome: "<i class=\"fas fa-paint-brush\"></i><span>Brush Biome</span>",
            toolBiomeTitle: "Peindre le biome",
            toolRaise: "<i class=\"fas fa-chevron-up\"></i><span>Élever (+)</span>",
            toolRaiseTitle: "Élever",
            toolLower: "<i class=\"fas fa-chevron-down\"></i><span>Creuser (-)</span>",
            toolLowerTitle: "Creuser",
            toolSmooth: "<i class=\"fas fa-water\"></i><span>Lisser</span>",
            toolSmoothTitle: "Lisser",
            toolFlatten: "<i class=\"fas fa-layer-group\"></i><span>Aplatir</span>",
            toolFlattenTitle: "Aplatir",
            toolEraser: "<i class=\"fas fa-eraser\"></i><span>Gomme</span>",
            toolEraserTitle: "Gomme",
            
            secBrushParams: "Paramètres du Brush",
            labelBrushSize: "Taille Pinceau",
            brushSizeVal: " cases",
            labelBrushIntensity: "Intensité",
            
            btnDownloadZip: "<i class=\"fas fa-file-export\"></i> 👉 Télécharger pour Bloxd (.bloxdschem)",
            
            statMin: "Min: ",
            statAvg: "Moy: ",
            statMax: "Max: ",
            
            title2D: "Carte 2D Éditable",
            btn2dReset: "<i class=\"fas fa-compress-arrows-alt\"></i> Recadrer",
            btn2dRelief: "<i class=\"fas fa-mountain\"></i> Relief",
            btn2dGrid: "<i class=\"fas fa-th\"></i> Grille",
            infoHover: "Survolez la carte pour voir les coordonnées",
            outOfBounds: "Hors carte",
            
            title3D: "Visualisation 3D",
            btn3dReset: "<i class=\"fas fa-video\"></i> Caméra",
            btn3dMeshVoxel: "🧱 Voxel",
            btn3dMeshSmooth: "🟢 Lisse",
            btn3dWater: "<i class=\"fas fa-water\"></i> Eau",
            flyHint: "🎮 ZQSD ou WASD + Espace/Ctrl · touches dans ⚙️ Paramètres",
            secShape: "Forme de la carte",
            shapeSquare: "⬜ Rectangle",
            shapeCircle: "⭕ Cercle / Ovale",
            shapeCustom: "✏️ Personnalisé (dessiner)",
        shapeHexagon: "⬡ Hexagon",
        shapePentagon: "⬠ Pentagon",
        shapeTriangle: "▲ Triangle",
        shapeOctagon: "⬣ Octagon",
            toolShape: "<i class=\"fas fa-shapes\"></i><span>Forme</span>",
            toolShapeTitle: "Peindre la forme (mode Custom)",
            
            modalTitle: "Télécharger pour Bloxd.io",
            modalDesc: "Tu obtiens un <strong>.bloxdschem</strong> prêt pour le jeu. S'il dépasse ~200 chunks, il est découpé en plusieurs fichiers dans un <strong>.zip</strong>, avec un guide. Le .json de sauvegarde n'est pas créé ici.",
            modalFilenameLabel: "Nom du fichier (si un seul .bloxdschem)",
            modalFoldernameLabel: "Nom du dossier dans le .zip (si plusieurs parties)",
            modalFolderDesc: "Chaque partie s'appelle numéro_[posX,posY,posZ] (ex. 1_[0,0,0]). Ce sont les coordonnées où te placer avant //schematic load.",
            modalAnchorLabel: "Coin de collage en jeu (où tu te tiens pour charger la 1re partie)",
            modalDownloadBtn: "<i class=\"fas fa-download\"></i> Télécharger le fichier .bloxdschem",
            modalGenerating: "<i class=\"fas fa-cog fa-spin\"></i> Génération directe du schématique...",
            
            biomePlain: "Plaines (Plain)",
            biomeForest: "Forêt (Forest)",
            biomeSand: "Sable / Plage (Sand)",
            biomeMountain: "Montagne (Mountain)",
            biomeSnow: "Neige (Snow)",
            biomeDesert: "Mesa (Mesa)",
            biomeVolcano: "Volcan (Volcano)",
            ruleActive: "Actif (règle de hauteur)",
            ruleYMinTip: "Couche basse : altitude minimale où ce biome apparaît toujours",
            ruleYMaxTip: "Couche haute : altitude maximale où ce biome apparaît toujours",
            ruleLocked: "Prioritaire (bloque la peinture)",
            maxHWarning: "⚠️ Au-delà de 400, l'export sera plus lourd et plus lent en jeu (déconseillé).",
            modalSingleFile: "📄 Forcer un seul .bloxdschem (sans découpe)",
            modalSingleFileDesc: "Tout le monde dans un seul fichier. Utile pour un autre site. Bloxd.io refusera le fichier s'il dépasse ~200 chunks : laisse décoché pour jouer.",
            toolSphere: "<i class=\"fas fa-globe\"></i><span>Sphère</span>",
            toolSphereTitle: "Poser une sphère (dôme) de terrain — taille réglable ci-dessous",
            toolBox: "<i class=\"fas fa-cube\"></i><span>Pavé</span>",
            toolBoxTitle: "Poser un pavé (plateau) de terrain — taille réglable ci-dessous",
            secStampParams: "Taille de la Forme",
            labelStampW: "Largeur (X, en blocs)",
            labelStampD: "Profondeur (Z, en blocs)",
            labelStampH: "Hauteur (+bosse / -creux)",
            labelStampBiome: "Appliquer aussi le biome sélectionné",
            btnAddPalette: "➕ Ajouter ma palette de couleurs",
            secPaletteForm: "Ma Palette Personnalisée",
            labelPaletteName: "Nom de la palette",
            labelPaletteColor: "Couleur (aperçu carte)",
            labelPaletteBlocks: "Blocs Bloxd (séparés par des virgules)",
            paletteBlocksHint: "Noms exacts des blocs (ex : Grass Block, Red Sand, Magma). Un bloc inconnu devient Grass Block à l'export.",
            btnSavePalette: "💾 Enregistrer",
            btnCancelPalette: "Annuler",
            errPaletteName: "Donne un nom à ta palette !",
            errPaletteExists: "Une palette porte déjà ce nom.",
            delPaletteTip: "Supprimer cette palette",
            confirmDelPalette: "Supprimer cette palette ? Les zones peintes reviendront au biome par défaut.",
            errPaletteBlocks: "Ajoute au moins 1 bloc !",
            editPaletteTip: "Modifier cette palette (nom, couleur, blocs)",
            secPaletteEdit: "Modifier la palette",
            btnResetPalette: "↩️ Restaurer la palette d'origine",
            confirmResetPalette: "Restaurer les blocs et la couleur d'origine de cette palette ?",
            paletteSaved: "Palette enregistrée !",
            paletteReset: "Palette d'origine restaurée",
            modifiedTag: "modifiée",
            modalPixelated: "🧊 Style pixelisé (gros blocs texturés)",
            modalPixelatedDesc: "Conserve l'effet \"marches géantes\" : le terrain est exporté en gros plateaux cubiques stylés. Décoché = pentes lissées (interpolation).",
            
            presetClassic: "🟢 Plaines Bloxd Classique",
            presetArchipelago: "🏝️ Archipel Tropical & Plages",
            presetAlpine: "🏔️ Hauts Sommets Glacés",
            
            promptPresetName: "Nom du Preset personnalisé :",
            defaultPresetVal: "Mon Univers Bloxd",
            presetSaved: "Preset sauvegardé avec succès : ",
            errSchemGen: "Erreur lors de la création du fichier .bloxdschem.",
            
            guideSplitHeader: "============================================================\n📦 MONDE DÉCOUPÉ EN PARTIES (<200 CHUNKS/FICHIER)\n============================================================\n\nCe monde étant volumineux, il a été découpé en plusieurs fichiers pour respecter\nla limite technique de Bloxd.io (~200 chunks maximum par commande //schematic load).\n\n⚠️ IMPORTANT : Bloxd.io ne repositionne PAS automatiquement chaque partie à sa\nplace dans le monde (comme le fait aussi l'outil officiel M2B pour ses schematics\ndécoupés) : c'est à VOUS de vous déplacer entre deux chargements, sinon toutes\nles parties se superposent au même endroit.\n\nINSTRUCTIONS D'IMPORTATION :\n1. Placez tous les fichiers .bloxdschem du dossier dans le répertoire schématiques de Bloxd.\n2. En jeu, rendez-vous à la position de l'angle de collage indiquée dans le nom du 1er fichier.\n3. Pour chaque fichier ci-dessous, déplacez-vous à la position [posX,posY,posZ] indiquée dans\n   son nom, PUIS chargez-le :\n\n",
            readmeHeader: "# 📦 Projet Terrain Bloxd.io Personnalisé\nGénéré depuis l'application **Bloxd Terrain Editor**\n\n## 🚀 Contenu de l'archive\n- `generate_terrain.py` : Script de génération configuré avec vos paramètres exacts et biomes.\n- `bloxd_format.py` : Moteur d'écriture binaire Avro (.bloxdschem).\n- `nameToId.json` : Table de mapping des ID de blocs Bloxd.io.\n\n## 🛠️ Comment générer votre carte sur votre ordinateur\n1. Assurez-vous d'avoir Python 3 installé avec `numpy` :\n   ```bash\n   pip install numpy\n   ```\n2. Exécutez le générateur :\n   ```bash\n   python generate_terrain.py\n   ```\n3. Un fichier **`custom_terrain.bloxdschem`** sera généré en quelques secondes.\n\n## 🎮 Comment importer dans Bloxd.io\n1. Lancez Bloxd.io dans votre navigateur (mode Créatif ou serveur Worlds avec permissions).\n2. Placez le fichier `custom_terrain.bloxdschem` dans vos schématiques.\n3. Chargez le schématique en jeu via la commande :\n   `//schematic load custom_terrain`\n\nProfitez de votre nouveau monde Bloxd ! 🌟\n",
            directGuideContent: "============================================================\n📦 GUIDE D'IMPORTATION DIRECTE DANS BLOXD.IO\n============================================================\n\nFélicitations ! Votre monde a été généré en direct par Bloxd Terrain Editor sans avoir besoin de code Python.\nLe fichier schématique prêt à l'emploi est situé dans le dossier \"schematics\" :\n👉 monde_personnalise.bloxdschem\n\nMODE D'EMPLOI EN 3 ÉTAPES SIMPLES :\n1. Lancez Bloxd.io dans votre navigateur internet.\n2. Placez le fichier \"monde_personnalise.bloxdschem\" dans votre dossier de schématiques Bloxd (ou utilisez un proxy/mod compatible).\n3. Ouvrez le tchat en jeu et tapez la commande :\n   //schematic load monde_personnalise\n\nEt voilà ! Votre terrain apparaîtra instantanément dans le jeu.\n============================================================\nNote pour les développeurs : Si vous préférez exécuter les scripts manuellement, \nils sont conservés dans le dossier \"options_avancees_python/\".\n"
        },
        en: {
            appTitle: "Bloxd Terrain Editor",
            langToggleTitle: "Passer en Français / Switch to French",
            langToggleFlag: "🇫🇷",
            langToggleText: "FR",
            loadingTitle: "Generating Bloxd world...",
            loadingSub: "Initializing 2D & 3D Voxel engines",
            errLoadingTitle: "Loading Error",
            
            tabSettings: "<i class=\"fas fa-sliders-h\"></i> Settings",
            tabEditor: "<i class=\"fas fa-paint-brush\"></i> Editor",
            
            secDimensions: "World Dimensions",
            labelWidthX: "Width X",
            labelLengthZ: "Length Z",
            labelSeed: "Seed",
            labelGroundDetail: "Ground detail",
            labelFlatTerrain: "🏜️ 100% flat terrain (ignore seed)",
            titleFlatTerrain: "The base terrain is fully flat (the seed no longer affects the relief). Tip: also set 'Ground detail' to Smooth for a perfectly level floor.",
            labelIslandMode: "🏝️ Island mode (surrounded by water)",
            titleIslandMode: "Terrain dips below water at the edges to create an island surrounded by ocean.",
            labelFlattenExact: "Flatten to 100% (exact level)",
            titleFlattenExact: "The whole circle is set to the exact level of the first click (no edge falloff).",
            titleGroundDetail: "Micro-relief added to the ground up close and at export (±1 block bumps). 0 = smooth ground.",
            optGdNone: "⬜ Smooth (none)",
            optGdLight: "🌿 Light",
            optGdNormal: "🌾 Normal",
            optGdRough: "🪨 Rugged",
            titleRandomSeed: "Random seed",
            
            
            labelBaseY: "Base Y",
            labelSeaLevel: "Sea Level",
            
            secRelief: "Procedural Relief",
            labelMinH: "Min Height",
            labelMaxH: "Max Height",
            labelNoiseScale: "Noise Scale",
            labelIntensity: "Intensity",
            labelRoughness: "Ridge Roughness",
            
            secPresets: "Presets & Actions",
            presetDefault: "-- Choose a Preset --",
            btnUndo: "Undo",
            btnRedo: "Redo",
            toastUndo: "↩️ Action undone (Ctrl+Z)",
            toastRedo: "↪️ Action redone (Ctrl+Y)",
            btnReset: "<i class=\"fas fa-trash-alt\"></i> Reset",
            btnSavePreset: "<i class=\"fas fa-save\"></i> Save Preset",
            secTeamShare: "Continue later",
            btnExportProjectJson: "Save project (.json)",
            btnImportProjectJson: "Resume a .json",
            btnImportBloxdschem: "Import a terrain (.bloxdschem)",
            titleExportJson: "Save to keep editing here or share the work. Bloxd cannot load this file.",
            titleImportJson: "Reopens a .json project saved with the button above.",
            titleImportSchem: "Rebuilds the relief from a .bloxdschem (not buildings). A Minecraft .schem must go through Schem Converter first.",
            coachTitle: "3 steps so you don't get lost",
            coachStep1: "This tab sets the size, the seed and the biomes.",
            coachStep2: "Editor tab: left-click the 2D map to paint or sculpt. The 3D view is for looking around.",
            coachStep3: "At the bottom, pick the right file: .bloxdschem for the game, .json to resume later.",
            coachMore: "Format guide",
            formatTitle: "Which file is which?",
            formatLead: "Three different formats. Mixing them up is the #1 reason imports fail.",
            formatBloxd: "the game file. Load it with //schematic load name (no extension).",
            formatZip: "only when the world is too big: several .bloxdschem files plus a guide. Load each part at the same Y.",
            formatJson: "a save so you can edit again here. Bloxd cannot load this file.",
            formatMc: "Minecraft (.schem, .schematic, .litematic): use Schem Converter first. It outputs a .bloxdschem.",
            formatDownloadHint: "Small world → 1 .bloxdschem. Too big → a .zip. The .json is not included: that's the button below.",
            guideTitle: "Guide — Terrain Editor",
            guideUseTitle: "Using the editor",
            guideStep3d: "ZQSD or WASD + Space/Ctrl to fly in 3D. Keys are changed in ⚙️ Settings.",
            guideFmtTitle: "Exchanging schematics",
            guideKeys: "Language and keys: 🏠 then ⚙️ Settings. A window reminds you of this on the first launch.",
            guideClose: "Close",
            modalIngameTitle: "In game",
            modalIngame1: "Put the .bloxdschem in Bloxd's schematics folder.",
            modalIngame2: "Open chat and type //schematic load filename (without .bloxdschem).",
            modalIngame3: "If you got a .zip: open it, read the guide, and load each part while staying at the same Y. Otherwise the pieces shift.",
            
            secBiomes: "Biomes (click for default)",
            secZones: "Terrain zones", zoneHint: "Create adjacent zones to build a large world without lag. Only the active zone is loaded.",
            btnDeleteZone: "Delete zone", modalExportScope: "Export scope",
            modalExportActive: "Active zone only", modalExportAll: "All zones (merged)",
            
            secPalette: "Biome Palette (Painting)",
            secTools: "Painting & Sculpting Tools",
            toolBiome: "<i class=\"fas fa-paint-brush\"></i><span>Biome Brush</span>",
            toolBiomeTitle: "Paint biome",
            toolRaise: "<i class=\"fas fa-chevron-up\"></i><span>Raise (+)</span>",
            toolRaiseTitle: "Raise height",
            toolLower: "<i class=\"fas fa-chevron-down\"></i><span>Lower (-)</span>",
            toolLowerTitle: "Lower height",
            toolSmooth: "<i class=\"fas fa-water\"></i><span>Smooth</span>",
            toolSmoothTitle: "Smooth terrain",
            toolFlatten: "<i class=\"fas fa-layer-group\"></i><span>Flatten</span>",
            toolFlattenTitle: "Flatten terrain",
            toolEraser: "<i class=\"fas fa-eraser\"></i><span>Eraser</span>",
            toolEraserTitle: "Eraser tool",
            
            secBrushParams: "Brush Settings",
            labelBrushSize: "Brush Size",
            brushSizeVal: " blocks",
            labelBrushIntensity: "Intensity",
            
            btnDownloadZip: "<i class=\"fas fa-file-export\"></i> 👉 Download for Bloxd (.bloxdschem)",
            
            statMin: "Min: ",
            statAvg: "Avg: ",
            statMax: "Max: ",
            
            title2D: "Editable 2D Map",
            btn2dReset: "<i class=\"fas fa-compress-arrows-alt\"></i> Center View",
            btn2dRelief: "<i class=\"fas fa-mountain\"></i> Relief",
            btn2dGrid: "<i class=\"fas fa-th\"></i> Grid",
            infoHover: "Hover over map to view coordinates",
            outOfBounds: "Out of bounds",
            
            title3D: "3D Visualization",
            btn3dReset: "<i class=\"fas fa-video\"></i> Camera",
            btn3dMeshVoxel: "🧱 Voxel",
            btn3dMeshSmooth: "🟢 Smooth",
            btn3dWater: "<i class=\"fas fa-water\"></i> Water",
            flyHint: "🎮 WASD or ZQSD + Space/Ctrl · keys in ⚙️ Settings",
            secShape: "Map shape",
            toolShape: "<i class=\"fas fa-shapes\"></i><span>Shape</span>",
            toolShapeTitle: "Paint shape (Custom mode)",
            
            modalTitle: "Download for Bloxd.io",
            modalDesc: "You get a <strong>.bloxdschem</strong> ready for the game. If it exceeds ~200 chunks, it is split into several files inside a <strong>.zip</strong>, with a guide. The .json save is not created here.",
            modalFilenameLabel: "File name (if a single .bloxdschem)",
            modalFoldernameLabel: "Folder name inside the .zip (if several parts)",
            modalFolderDesc: "Each part is named number_[posX,posY,posZ] (e.g. 1_[0,0,0]). Those are the coordinates to stand on before //schematic load.",
            modalAnchorLabel: "In-game paste corner (where you stand to load the 1st part)",
            modalDownloadBtn: "<i class=\"fas fa-download\"></i> Download .bloxdschem file",
            modalGenerating: "<i class=\"fas fa-cog fa-spin\"></i> Generating schematic directly...",
            
            biomePlain: "Plains",
            biomeForest: "Forest",
            biomeSand: "Sand / Beach",
            biomeMountain: "Mountain",
            biomeSnow: "Snow",
            biomeDesert: "Mesa",
            biomeVolcano: "Volcano",
            ruleActive: "Active (height rule)",
            ruleYMinTip: "Lower layer: minimum altitude where this biome always appears",
            ruleYMaxTip: "Upper layer: maximum altitude where this biome always appears",
            ruleLocked: "Priority (blocks painting)",
            maxHWarning: "⚠️ Above 400, the export gets heavier and slower in game (not recommended).",
            modalSingleFile: "📄 Force a single .bloxdschem (no split)",
            modalSingleFileDesc: "The whole world in one file. Useful for another website. Bloxd.io will reject it above ~200 chunks: leave unchecked to play.",
            toolSphere: "<i class=\"fas fa-globe\"></i><span>Sphere</span>",
            toolSphereTitle: "Place a terrain sphere (dome) — size adjustable below",
            toolBox: "<i class=\"fas fa-cube\"></i><span>Box</span>",
            toolBoxTitle: "Place a terrain box (plateau) — size adjustable below",
            secStampParams: "Shape Size",
            labelStampW: "Width (X, in blocks)",
            labelStampD: "Depth (Z, in blocks)",
            labelStampH: "Height (+bump / -hole)",
            labelStampBiome: "Also apply the selected biome",
            btnAddPalette: "➕ Add my color palette",
            secPaletteForm: "My Custom Palette",
            labelPaletteName: "Palette name",
            labelPaletteColor: "Color (map preview)",
            labelPaletteBlocks: "Bloxd blocks (comma separated)",
            paletteBlocksHint: "Exact block names (e.g. Grass Block, Red Sand, Magma). Unknown blocks fall back to Grass Block on export.",
            btnSavePalette: "💾 Save",
            btnCancelPalette: "Cancel",
            errPaletteName: "Give your palette a name!",
            errPaletteExists: "A palette with this name already exists.",
            delPaletteTip: "Delete this palette",
            confirmDelPalette: "Delete this palette? Painted areas will revert to the default biome.",
            errPaletteBlocks: "Add at least 1 block!",
            editPaletteTip: "Edit this palette (name, color, blocks)",
            secPaletteEdit: "Edit palette",
            btnResetPalette: "↩️ Restore original palette",
            confirmResetPalette: "Restore this palette's original blocks and color?",
            paletteSaved: "Palette saved!",
            paletteReset: "Original palette restored",
            modifiedTag: "modified",
            modalPixelated: "🧊 Pixelated style (big textured blocks)",
            modalPixelatedDesc: "Keeps the \"giant steps\" effect: terrain is exported as big stylish cubic plateaus. Unchecked = smooth slopes (interpolation).",
            
            presetClassic: "🟢 Classic Bloxd Plains",
            presetArchipelago: "🏝️ Tropical Archipelago & Beaches",
            presetAlpine: "🏔️ Icy Alpine Peaks",
            
            promptPresetName: "Custom Preset Name:",
            defaultPresetVal: "My Bloxd World",
            presetSaved: "Preset saved successfully: ",
            errSchemGen: "Error generating .bloxdschem file.",
            
            guideSplitHeader: "============================================================\n📦 SPLIT WORLD SCHEMATICS (<200 CHUNKS/FILE)\n============================================================\n\nBecause this world is large, it was split into multiple files to comply with\nBloxd.io technical limits (~200 chunks maximum per //schematic load command).\n\n⚠️ IMPORTANT: Bloxd.io does NOT automatically reposition each schematic file\nto its coordinates in the world: YOU must move your character between loads,\notherwise all parts will overlap at the same location.\n\nIMPORT INSTRUCTIONS:\n1. Place all .bloxdschem files from the folder into Bloxd schematic directory.\n2. In game, go to the paste anchor position indicated in the name of file #1.\n3. For each file below, move your character to the [posX,posY,posZ] indicated in\n   its name, THEN load it:\n\n🚨 GOLDEN RULE — CONSTANT Y ALTITUDE:\nBloxd pastes each schematic RELATIVE TO YOUR POSITION, INCLUDING YOUR HEIGHT!\nLoad ALL parts from EXACTLY the same Y altitude.\nIf you walk on already-generated terrain (dunes, hills...), your Y changes and\nthe next part will be VERTICALLY SHIFTED (stone cliffs, raised sand level).\n👉 Tip: use fly mode, position yourself at the exact Y shown on screen,\n   and check that Y before EVERY //schematic load.\n\n",
            readmeHeader: "# 📦 Custom Bloxd.io Terrain Project\nGenerated from **Bloxd Terrain Editor**\n\n## 🚀 Archive Contents\n- `generate_terrain.py`: Generation script configured with your exact parameters and biomes.\n- `bloxd_format.py`: Avro (.bloxdschem) binary schematic writer.\n- `nameToId.json`: Block mapping table for Bloxd.io block IDs.\n\n## 🛠️ How to generate the map locally on your computer\n1. Make sure Python 3 is installed along with `numpy`:\n   ```bash\n   pip install numpy\n   ```\n2. Run the generator script:\n   ```bash\n   python generate_terrain.py\n   ```\n3. A **`custom_terrain.bloxdschem`** file will be generated in seconds.\n\n## 🎮 How to import into Bloxd.io\n1. Launch Bloxd.io in your web browser (Creative mode or Worlds with build permissions).\n2. Place `custom_terrain.bloxdschem` into your schematic folder.\n3. Load the schematic in game using the chat command:\n   `//schematic load custom_terrain`\n\nEnjoy your new Bloxd world! 🌟\n",
            directGuideContent: "============================================================\n📦 DIRECT BLOXD.IO IMPORT GUIDE\n============================================================\n\nCongratulations! Your world was generated live by Bloxd Terrain Editor without needing Python code.\nThe ready-to-use schematic file is located inside the \"schematics\" folder:\n👉 monde_personnalise.bloxdschem\n\nSIMPLE 3-STEP USER GUIDE:\n1. Launch Bloxd.io in your web browser.\n2. Place the file \"monde_personnalise.bloxdschem\" into your Bloxd schematics folder (or use a compatible proxy/mod).\n3. Open chat in game and type the command:\n   //schematic load monde_personnalise\n\nThat's it! Your terrain will appear immediately in game.\n============================================================\nNote for developers: If you prefer running Python scripts manually,\nthey are preserved inside the \"options_avancees_python/\" folder.\n"
        },
        ja: {
            appTitle:"Bloxd Terrain Editor",langToggleTitle:"言語切替",langToggleFlag:"🌐",langToggleText:"LANG",
            loadingTitle:"Bloxdワールド生成中...",loadingSub:"2D・3D Voxelエンジン初期化",errLoadingTitle:"読込エラー",
            tabSettings:"<i class=\"fas fa-sliders-h\"></i> 設定",tabEditor:"<i class=\"fas fa-paint-brush\"></i> エディタ",
            secDimensions:"ワールド寸法",labelWidthX:"幅 X",labelLengthZ:"奥行 Z",labelSeed:"シード",
            labelGroundDetail:"地面ディテール",labelFlatTerrain:"🏜️ 完全に平らな地形",titleFlatTerrain:"地形が完全に平らになります。",
            labelIslandMode:"🏝️ 島モード（周囲が水）",titleIslandMode:"縁が水中に沈んで島を作ります。",
            labelFlattenExact:"100%平坦化（正確なレベル）",titleFlattenExact:"円全体が最初のクリック位置と同じ高さになります。",
            titleGroundDetail:"近距離とエクスポート時の微地形（±1ブロック）。0=滑らか。",
            optGdNone:"⬜ スムーズ（なし）",optGdLight:"🌿 軽い",optGdNormal:"🌾 標準",optGdRough:"🪨 荒い",titleRandomSeed:"ランダムシード",
            labelBaseY:"ベース Y",labelSeaLevel:"海面",
            secRelief:"プロシージャル地形",labelMinH:"最低高度",labelMaxH:"最高高度",labelNoiseScale:"ノイズスケール",labelIntensity:"強度",labelRoughness:"尾根の粗さ",
            secPresets:"プリセット & アクション",presetDefault:"-- プリセット選択 --",
            btnUndo:"元に戻す",btnRedo:"やり直し",toastUndo:"↩️ 操作を元に戻しました (Ctrl+Z)",toastRedo:"↪️ 操作をやり直しました (Ctrl+Y)",
            btnReset:"<i class=\"fas fa-trash-alt\"></i> リセット",btnSavePreset:"<i class=\"fas fa-save\"></i> プリセット保存",
            secBiomes:"バイオーム（クリックでデフォルト）",secPalette:"バイオームパレット（ペイント）",
            secTools:"ペイント & 彫刻ツール",
            toolBiome:"<i class=\"fas fa-paint-brush\"></i><span>バイオームブラシ</span>",toolBiomeTitle:"バイオームをペイント",
            toolRaise:"<i class=\"fas fa-chevron-up\"></i><span>隆起 (+)</span>",toolRaiseTitle:"隆起",
            toolLower:"<i class=\"fas fa-chevron-down\"></i><span>掘削 (-)</span>",toolLowerTitle:"掘削",
            toolSmooth:"<i class=\"fas fa-water\"></i><span>平滑化</span>",toolSmoothTitle:"平滑化",
            toolFlatten:"<i class=\"fas fa-layer-group\"></i><span>平坦化</span>",toolFlattenTitle:"平坦化",
            toolEraser:"<i class=\"fas fa-eraser\"></i><span>消去</span>",toolEraserTitle:"消去ツール",
            secBrushParams:"ブラシ設定",labelBrushSize:"ブラシサイズ",brushSizeVal:" ブロック",labelBrushIntensity:"強度",
            btnDownloadZip:"<i class=\"fas fa-file-export\"></i> 👉 Bloxd用にダウンロード (.bloxdschem)",
            statMin:"最小: ",statAvg:"平均: ",statMax:"最大: ",
            title2D:"編集可能な2Dマップ",btn2dReset:"<i class=\"fas fa-compress-arrows-alt\"></i> 中央表示",
            btn2dRelief:"<i class=\"fas fa-mountain\"></i> 地形",btn2dGrid:"<i class=\"fas fa-th\"></i> グリッド",
            infoHover:"マップ上にカーソルを合わせて座標を確認",outOfBounds:"マップ外",
            title3D:"3Dビジュアル",btn3dReset:"<i class=\"fas fa-video\"></i> カメラ",
            btn3dMeshVoxel:"🧱 ボクセル",btn3dMeshSmooth:"🟢 スムーズ",btn3dWater:"<i class=\"fas fa-water\"></i> 水",
            flyHint:"🎮 WASD/ZQSD + Space/Ctrl で飛行 · キーは ⚙️ 設定",secShape:"マップ形状",
            shapeSquare:"⬜ 長方形",shapeCircle:"⭕ 円/楕円",shapeCustom:"✏️ カスタム（描画）",
            shapeHexagon:"⬡ 六角形",shapePentagon:"⬠ 五角形",shapeTriangle:"▲ 三角形",shapeOctagon:"⬣ 八角形",
            toolShape:"<i class=\"fas fa-shapes\"></i><span>形状</span>",toolShapeTitle:"形状をペイント",
            modalTitle:"Bloxd.io用にダウンロード",
            modalDesc:"ゲーム用の <strong>.bloxdschem</strong> をダウンロードします。約200チャンクを超えると <strong>.zip</strong>（複数ファイル＋ガイド）になります。.json の保存はここでは作られません。",
            modalFilenameLabel:"ファイル名（.bloxdschem が1つのとき）",modalFoldernameLabel:".zip内のフォルダ名（分割されたとき）",modalFolderDesc:"各パーツは 番号_[posX,posY,posZ]（例 1_[0,0,0]）。//schematic load の前に立つ座標です。",
            modalAnchorLabel:"ゲーム内の貼り付け位置（1つ目を読み込む場所）",modalDownloadBtn:"<i class=\"fas fa-download\"></i> .bloxdschemダウンロード",
            modalGenerating:"<i class=\"fas fa-cog fa-spin\"></i> スケマティック生成中...",
            biomePlain:"平原",biomeForest:"森林",biomeSand:"砂浜",biomeMountain:"山地",biomeSnow:"雪",biomeDesert:"メサ",biomeVolcano:"火山",
            ruleActive:"有効（高度ルール）",ruleYMinTip:"下層：最低高度",ruleYMaxTip:"上層：最高高度",ruleLocked:"優先（ペイント禁止）",
            maxHWarning:"⚠️ 400を超えるとエクスポートが重く遅くなります。",
            modalSingleFile:"📄 .bloxdschem を1ファイルに強制（分割しない）",modalSingleFileDesc:"ワールド全体を1ファイルに。他サイト向け。約200チャンク超は Bloxd が拒否します。ゲーム用はオフのまま。",
            toolSphere:"<i class=\"fas fa-globe\"></i><span>球</span>",toolSphereTitle:"地形の球を配置",
            toolBox:"<i class=\"fas fa-cube\"></i><span>箱</span>",toolBoxTitle:"地形の箱を配置",
            secStampParams:"形状サイズ",labelStampW:"幅 (X)",labelStampD:"奥行 (Z)",labelStampH:"高さ (+/-)",
            labelStampBiome:"選択中のバイオームも適用",btnAddPalette:"➕ カラーパレット追加",
            secPaletteForm:"カスタムパレット",labelPaletteName:"パレット名",labelPaletteColor:"色",
            labelPaletteBlocks:"Bloxdブロック（カンマ区切り）",paletteBlocksHint:"正確なブロック名を入力。",
            btnSavePalette:"💾 保存",btnCancelPalette:"キャンセル",errPaletteName:"パレット名を入力！",errPaletteExists:"同名のパレットが存在します。",
            delPaletteTip:"パレットを削除",confirmDelPalette:"パレットを削除？",
            errPaletteBlocks:"ブロックを1つ以上追加してください！",editPaletteTip:"このパレットを編集（名前、色、ブロック）",
            secPaletteEdit:"パレットを編集",btnResetPalette:"↩️ 元のパレットに復元",
            confirmResetPalette:"このパレットのブロックと色を元に戻しますか？",paletteSaved:"パレットを保存しました！",
            paletteReset:"元のパレットを復元しました",modifiedTag:"変更済み",
            modalPixelated:"🧊 ピクセルアート風",modalPixelatedDesc:"「巨大階段」効果を維持。",
            presetClassic:"🟢 クラシック平原",presetArchipelago:"🏝️ 熱帯群島",presetAlpine:"🏔️ 氷河アルプス",
            promptPresetName:"プリセット名：",defaultPresetVal:"Bloxdワールド",presetSaved:"プリセット保存成功： ",
            secTeamShare:"あとで続きから",btnExportProjectJson:"プロジェクトを保存 (.json)",btnImportProjectJson:".json を再開",btnImportBloxdschem:"地形をインポート (.bloxdschem)",
            titleExportJson:"ここで編集を続けるための保存です。Bloxd はこのファイルを読めません。",
            titleImportJson:"上のボタンで保存した .json を開き直します。",
            titleImportSchem:".bloxdschem から起伏だけを復元します（建物は含みません）。Minecraft の .schem は先に Schem Converter へ。",
            coachTitle:"迷わないための3ステップ",coachMore:"形式ガイド",
            coachStep1:"このタブでサイズ、シード、バイオームを決めます。",
            coachStep2:"エディタタブ：2D地図を左クリックして塗る・削る。3Dは見るためです。",
            coachStep3:"下でファイルを選ぶ：ゲーム用は .bloxdschem、続きは .json。",
            formatTitle:"どのファイル？",formatLead:"3つの形式があります。混ぜると失敗します。",
            formatBloxd:"ゲーム用ファイル。//schematic load 名前（拡張子なし）で読み込みます。",
            formatZip:"ワールドが大きすぎるときだけ。複数の .bloxdschem とガイド。各パーツは同じ Y で読み込みます。",
            formatJson:"ここで編集を再開するための保存。Bloxd は読めません。",
            formatMc:"Minecraft（.schem / .schematic / .litematic）は先に Schem Converter。.bloxdschem が出力されます。",
            formatDownloadHint:"小さいワールド → .bloxdschem 1つ。大きすぎる → .zip。.json は下のボタンです。",
            guideTitle:"ガイド — Terrain Editor",guideUseTitle:"使い方",guideFmtTitle:"スケマの受け渡し",guideClose:"閉じる",
            guideStep3d:"3D飛行は ZQSD または WASD + Space/Ctrl。キーは ⚙️ 設定で変更。",
            guideKeys:"言語とキー：🏠 のあと ⚙️ 設定。初回に案内が出ます。",
            modalIngameTitle:"ゲーム内",
            modalIngame1:".bloxdschem を Bloxd のスケマフォルダに置きます。",
            modalIngame2:"チャットで //schematic load ファイル名（.bloxdschem なし）。",
            modalIngame3:".zip の場合はガイドを読み、同じ高さ Y のまま各パーツを読み込みます。Y が変わるとずれます。",
            errSchemGen:".bloxdschem生成エラー。"
        },
        ko: {
            appTitle:"Bloxd Terrain Editor",langToggleTitle:"언어 전환",langToggleFlag:"🌐",langToggleText:"언어",
            loadingTitle:"Bloxd 월드 생성 중...",loadingSub:"2D·3D Voxel 엔진 초기화",errLoadingTitle:"로딩 오류",
            tabSettings:"<i class=\"fas fa-sliders-h\"></i> 설정",tabEditor:"<i class=\"fas fa-paint-brush\"></i> 에디터",
            secDimensions:"월드 크기",labelWidthX:"너비 X",labelLengthZ:"길이 Z",labelSeed:"시드",
            labelGroundDetail:"지면 디테일",labelFlatTerrain:"🏜️ 100% 평평한 지형",titleFlatTerrain:"지형이 완전히 평평해집니다.",
            labelIslandMode:"🏝️ 섬 모드 (물로 둘러싸임)",titleIslandMode:"가장자리가 물 아래로 가라앉아 섬을 만듭니다.",
            labelFlattenExact:"100% 평탄화 (정확한 레벨)",titleFlattenExact:"전체 원이 첫 클릭 높이로 설정됩니다.",
            titleGroundDetail:"근거리 및 내보내기 시 미세 지형 (±1블록). 0=평활.",
            optGdNone:"⬜ 평활 (없음)",optGdLight:"🌿 약간",optGdNormal:"🌾 보통",optGdRough:"🪨 험준",titleRandomSeed:"랜덤 시드",
            labelBaseY:"기준 Y",labelSeaLevel:"해수면",
            secRelief:"프로시저럴 지형",labelMinH:"최소 높이",labelMaxH:"최대 높이",labelNoiseScale:"노이즈 스케일",labelIntensity:"강도",labelRoughness:"능선 거칠기",
            secPresets:"프리셋 & 액션",presetDefault:"-- 프리셋 선택 --",
            btnUndo:"실행 취소",btnRedo:"다시 실행",toastUndo:"↩️ 실행 취소 (Ctrl+Z)",toastRedo:"↪️ 다시 실행 (Ctrl+Y)",
            btnReset:"<i class=\"fas fa-trash-alt\"></i> 리셋",btnSavePreset:"<i class=\"fas fa-save\"></i> 프리셋 저장",
            secBiomes:"바이옴 (클릭하여 기본 설정)",secPalette:"바이옴 팔레트 (페인트)",
            secTools:"페인트 & 조각 도구",
            toolBiome:"<i class=\"fas fa-paint-brush\"></i><span>바이옴 브러시</span>",toolBiomeTitle:"바이옴 페인트",
            toolRaise:"<i class=\"fas fa-chevron-up\"></i><span>올리기 (+)</span>",toolRaiseTitle:"높이 올리기",
            toolLower:"<i class=\"fas fa-chevron-down\"></i><span>내리기 (-)</span>",toolLowerTitle:"높이 내리기",
            toolSmooth:"<i class=\"fas fa-water\"></i><span>평탄화</span>",toolSmoothTitle:"지형 평탄화",
            toolFlatten:"<i class=\"fas fa-layer-group\"></i><span>고르게</span>",toolFlattenTitle:"지형 고르게",
            toolEraser:"<i class=\"fas fa-eraser\"></i><span>지우개</span>",toolEraserTitle:"지우개 도구",
            secBrushParams:"브러시 설정",labelBrushSize:"브러시 크기",brushSizeVal:" 블록",labelBrushIntensity:"강도",
            btnDownloadZip:"<i class=\"fas fa-file-export\"></i> 👉 Bloxd용 다운로드 (.bloxdschem)",
            statMin:"최소: ",statAvg:"평균: ",statMax:"최대: ",
            title2D:"편집 가능 2D 지도",btn2dReset:"<i class=\"fas fa-compress-arrows-alt\"></i> 중앙 보기",
            btn2dRelief:"<i class=\"fas fa-mountain\"></i> 지형",btn2dGrid:"<i class=\"fas fa-th\"></i> 격자",
            infoHover:"지도 위에 커서를 올려 좌표 확인",outOfBounds:"지도 영역 밖",
            title3D:"3D 시각화",btn3dReset:"<i class=\"fas fa-video\"></i> 카메라",
            btn3dMeshVoxel:"🧱 복셀",btn3dMeshSmooth:"🟢 부드럽게",btn3dWater:"<i class=\"fas fa-water\"></i> 물",
            flyHint:"🎮 WASD/ZQSD + Space/Ctrl 비행 · 키는 ⚙️ 설정",secShape:"지도 모양",
            shapeSquare:"⬜ 사각형",shapeCircle:"⭕ 원/타원",shapeCustom:"✏️ 사용자 정의 (그리기)",
            shapeHexagon:"⬡ 육각형",shapePentagon:"⬠ 오각형",shapeTriangle:"▲ 삼각형",shapeOctagon:"⬣ 팔각형",
            toolShape:"<i class=\"fas fa-shapes\"></i><span>모양</span>",toolShapeTitle:"모양 페인트",
            modalTitle:"Bloxd.io용 다운로드",
            modalDesc:"게임용 <strong>.bloxdschem</strong>을 받습니다. 약 200청크를 넘으면 <strong>.zip</strong>(여러 파일+안내)이 됩니다. .json 저장은 여기서 만들지 않습니다.",
            modalFilenameLabel:"파일 이름 (.bloxdschem 1개일 때)",modalFoldernameLabel:".zip 안 폴더 이름 (여러 파트일 때)",modalFolderDesc:"각 파트 이름은 번호_[posX,posY,posZ] (예 1_[0,0,0]). //schematic load 전에 설 좌표입니다.",
            modalAnchorLabel:"게임 안 붙여넣기 위치 (첫 파트를 불러올 자리)",modalDownloadBtn:"<i class=\"fas fa-download\"></i> .bloxdschem 다운로드",
            modalGenerating:"<i class=\"fas fa-cog fa-spin\"></i> 스케매틱 생성 중...",
            biomePlain:"평원",biomeForest:"숲",biomeSand:"모래/해변",biomeMountain:"산악",biomeSnow:"눈",biomeDesert:"메사",biomeVolcano:"화산",
            ruleActive:"활성 (높이 규칙)",ruleYMinTip:"하층: 최소 고도",ruleYMaxTip:"상층: 최대 고도",ruleLocked:"우선 (페인트 차단)",
            maxHWarning:"⚠️ 400 초과 시 내보내기가 느려집니다.",
            modalSingleFile:"📄 .bloxdschem 1개로 강제 (분할 안 함)",modalSingleFileDesc:"월드 전체를 1개 파일로. 다른 사이트용. 약 200청크를 넘으면 Bloxd가 거부합니다. 게임용은 끄세요.",
            toolSphere:"<i class=\"fas fa-globe\"></i><span>구</span>",toolSphereTitle:"지형 구 배치",
            toolBox:"<i class=\"fas fa-cube\"></i><span>상자</span>",toolBoxTitle:"지형 상자 배치",
            secStampParams:"모양 크기",labelStampW:"너비 (X)",labelStampD:"깊이 (Z)",labelStampH:"높이 (+/-)",
            labelStampBiome:"선택된 바이옴도 적용",btnAddPalette:"➕ 색상 팔레트 추가",
            secPaletteForm:"내 커스텀 팔레트",labelPaletteName:"팔레트 이름",labelPaletteColor:"색상",
            labelPaletteBlocks:"Bloxd 블록 (쉼표로 구분)",paletteBlocksHint:"정확한 블록 이름 입력.",
            btnSavePalette:"💾 저장",btnCancelPalette:"취소",errPaletteName:"팔레트 이름 입력!",errPaletteExists:"같은 이름이 이미 존재합니다.",
            delPaletteTip:"팔레트 삭제",confirmDelPalette:"팔레트 삭제?",
            errPaletteBlocks:"블록을 1개 이상 추가하세요!",editPaletteTip:"이 팔레트 수정 (이름, 색상, 블록)",
            secPaletteEdit:"팔레트 수정",btnResetPalette:"↩️ 원래 팔레트로 복원",
            confirmResetPalette:"이 팔레트의 블록과 색상을 원래대로 되돌릴까요?",paletteSaved:"팔레트가 저장되었습니다!",
            paletteReset:"원래 팔레트를 복원했습니다",modifiedTag:"수정됨",
            modalPixelated:"🧊 픽셀 아트 스타일",modalPixelatedDesc:"\"거대 계단\" 효과 유지.",
            presetClassic:"🟢 클래식 평원",presetArchipelago:"🏝️ 열대 군도",presetAlpine:"🏔️ 빙하 알프스",
            promptPresetName:"프리셋 이름:",defaultPresetVal:"Bloxd 월드",presetSaved:"프리셋 저장 성공: ",
            secTeamShare:"나중에 이어하기",btnExportProjectJson:"프로젝트 저장 (.json)",btnImportProjectJson:".json 이어하기",btnImportBloxdschem:"지형 가져오기 (.bloxdschem)",
            titleExportJson:"여기서 편집을 이어가는 저장입니다. Bloxd는 이 파일을 읽지 못합니다.",
            titleImportJson:"위 버튼으로 저장한 .json을 다시 엽니다.",
            titleImportSchem:".bloxdschem에서 지형만 복원합니다(건물은 아님). 마인크래프트 .schem은 먼저 Schem Converter로.",
            coachTitle:"헤매지 않는 3단계",coachMore:"형식 안내",
            coachStep1:"이 탭에서 크기, 시드, 바이옴을 정합니다.",
            coachStep2:"에디터 탭: 2D 지도를 좌클릭해 칠하거나 깎습니다. 3D는 둘러보기용입니다.",
            coachStep3:"아래에서 파일을 고르세요. 게임용은 .bloxdschem, 이어하기는 .json.",
            formatTitle:"어떤 파일인가요?",formatLead:"형식이 세 가지입니다. 섞으면 실패합니다.",
            formatBloxd:"게임 파일입니다. //schematic load 이름 (확장자 없이)으로 불러옵니다.",
            formatZip:"월드가 너무 클 때만. 여러 .bloxdschem과 안내. 각 파트는 같은 Y에서 불러오세요.",
            formatJson:"여기서 다시 편집하는 저장입니다. Bloxd는 읽지 못합니다.",
            formatMc:"마인크래프트(.schem / .schematic / .litematic)는 먼저 Schem Converter. .bloxdschem이 나옵니다.",
            formatDownloadHint:"작은 월드 → .bloxdschem 1개. 너무 크면 → .zip. .json은 아래 버튼입니다.",
            guideTitle:"안내 — Terrain Editor",guideUseTitle:"사용법",guideFmtTitle:"스케매 주고받기",guideClose:"닫기",
            guideStep3d:"3D 비행은 ZQSD 또는 WASD + Space/Ctrl. 키는 ⚙️ 설정에서 바꿉니다.",
            guideKeys:"언어와 키: 🏠 다음 ⚙️ 설정. 첫 실행 때 안내가 뜹니다.",
            modalIngameTitle:"게임 안에서",
            modalIngame1:".bloxdschem을 Bloxd 스케매 폴더에 넣으세요.",
            modalIngame2:"채팅에 //schematic load 파일이름 (.bloxdschem 없이).",
            modalIngame3:".zip이면 안내를 읽고, 같은 높이 Y에서 각 파트를 불러오세요. Y가 바뀌면 어긋납니다.",
            errSchemGen:".bloxdschem 생성 오류."
        },
        th: {
            appTitle:"Bloxd Terrain Editor",langToggleTitle:"เปลี่ยนภาษา",langToggleFlag:"🌐",langToggleText:"ภาษา",
            loadingTitle:"กำลังสร้างโลก Bloxd...",loadingSub:"กำลังเริ่มต้นเอนจิ้น 2D & 3D Voxel",errLoadingTitle:"ข้อผิดพลาดในการโหลด",
            tabSettings:"<i class=\"fas fa-sliders-h\"></i> ตั้งค่า",tabEditor:"<i class=\"fas fa-paint-brush\"></i> แก้ไข",
            secDimensions:"ขนาดโลก",labelWidthX:"ความกว้าง X",labelLengthZ:"ความยาว Z",labelSeed:"ซีด",
            labelGroundDetail:"รายละเอียดพื้นดิน",labelFlatTerrain:"🏜️ พื้นที่ราบ 100%",titleFlatTerrain:"พื้นที่จะราบเรียบทั้งหมด",
            labelIslandMode:"🏝️ โหมดเกาะ (ล้อมรอบด้วยน้ำ)",titleIslandMode:"ขอบต่างจมลงใต้น้ำเป็นเกาะ",
            labelFlattenExact:"ทำให้ราบ 100% (ระดับเที่ยงตรง)",titleFlattenExact:"ทั้งวงจะตั้งเป็นระดับเดียวกับคลิกแรก",
            titleGroundDetail:"พื้นผิวดินละเอียด ±1 บล็อก 0=เรียบ",
            optGdNone:"⬜ เรียบ (ไม่มี)",optGdLight:"🌿 เบา",optGdNormal:"🌾 ปกติ",optGdRough:"🪨 ขรุขระ",titleRandomSeed:"สุ่มซีด",
            labelBaseY:"ฐาน Y",labelSeaLevel:"ระดับน้ำทะเล",
            secRelief:"ภูมิประเทศอัตโนมัติ",labelMinH:"ความสูงต่ำสุด",labelMaxH:"ความสูงสูงสุด",labelNoiseScale:"สเกลนอยส์",labelIntensity:"ความเข้ม",labelRoughness:"ความขรุขระ",
            secPresets:"พรีเซ็ต & การกระทำ",presetDefault:"-- เลือกพรีเซ็ต --",
            btnUndo:"ยกเลิก",btnRedo:"ทำซ้ำ",toastUndo:"↩️ ยกเลิกการกระทำ (Ctrl+Z)",toastRedo:"↪️ ทำซ้ำการกระทำ (Ctrl+Y)",
            btnReset:"<i class=\"fas fa-trash-alt\"></i> รีเซ็ต",btnSavePreset:"<i class=\"fas fa-save\"></i> บันทึกพรีเซ็ต",
            secBiomes:"ไบโอม (คลิกเพื่อตั้งค่าเริ่มต้น)",secPalette:"จานไบโอม (วาดสี)",
            secTools:"เครื่องมือวาด & แกะสลัก",
            toolBiome:"<i class=\"fas fa-paint-brush\"></i><span>แปรงไบโอม</span>",toolBiomeTitle:"วาดไบโอม",
            toolRaise:"<i class=\"fas fa-chevron-up\"></i><span>ยก (+)</span>",toolRaiseTitle:"ยกพื้นที่",
            toolLower:"<i class=\"fas fa-chevron-down\"></i><span>ลด (-)</span>",toolLowerTitle:"ลดพื้นที่",
            toolSmooth:"<i class=\"fas fa-water\"></i><span>เรียบ</span>",toolSmoothTitle:"ทำให้พื้นที่เรียบ",
            toolFlatten:"<i class=\"fas fa-layer-group\"></i><span>ราบ</span>",toolFlattenTitle:"ทำให้พื้นที่ราบ",
            toolEraser:"<i class=\"fas fa-eraser\"></i><span>ยางลบ</span>",toolEraserTitle:"เครื่องมือยางลบ",
            secBrushParams:"ตั้งค่าแปรง",labelBrushSize:"ขนาดแปรง",brushSizeVal:" บล็อก",labelBrushIntensity:"ความเข้ม",
            btnDownloadZip:"<i class=\"fas fa-file-export\"></i> 👉 ดาวน์โหลดสำหรับ Bloxd (.bloxdschem)",
            statMin:"ต่ำสุด: ",statAvg:"เฉลี่ย: ",statMax:"สูงสุด: ",
            title2D:"แผนที่ 2D แก้ไขได้",btn2dReset:"<i class=\"fas fa-compress-arrows-alt\"></i> มุมกลาง",
            btn2dRelief:"<i class=\"fas fa-mountain\"></i> ภูมิประเทศ",btn2dGrid:"<i class=\"fas fa-th\"></i> ตาราง",
            infoHover:"เลื่อนเมาส์เหนือแผนที่เพื่อดูพิกัด",outOfBounds:"นอกขอบเขตแผนที่",
            title3D:"มุมมอง 3D",btn3dReset:"<i class=\"fas fa-video\"></i> กล้อง",
            btn3dMeshVoxel:"🧱 วอกเซล",btn3dMeshSmooth:"🟢 เรียบ",btn3dWater:"<i class=\"fas fa-water\"></i> น้ำ",
            flyHint:"🎮 WASD/ZQSD + Space/Ctrl บิน · ปุ่มอยู่ที่ ⚙️ ตั้งค่า",secShape:"รูปร่างแผนที่",
            shapeSquare:"⬜ สี่เหลี่ยม",shapeCircle:"⭕ วงกลม/รี",shapeCustom:"✏️ กำหนดเอง (วาด)",
            shapeHexagon:"⬡ หกเหลี่ยม",shapePentagon:"⬠ ห้าเหลี่ยม",shapeTriangle:"▲ สามเหลี่ยม",shapeOctagon:"⬣ แปดเหลี่ยม",
            toolShape:"<i class=\"fas fa-shapes\"></i><span>รูปร่าง</span>",toolShapeTitle:"วาดรูปร่าง",
            modalTitle:"ดาวน์โหลดสำหรับ Bloxd.io",
            modalDesc:"ได้ไฟล์ <strong>.bloxdschem</strong> สำหรับเล่นในเกม ถ้าเกิน ~200 ชังก์ จะถูกแบ่งใน <strong>.zip</strong> พร้อมคู่มือ ไฟล์ .json ไม่ถูกสร้างที่นี่",
            modalFilenameLabel:"ชื่อไฟล์ (ถ้ามี .bloxdschem ไฟล์เดียว)",modalFoldernameLabel:"ชื่อโฟลเดอร์ใน .zip (ถ้ามีหลายส่วน)",modalFolderDesc:"แต่ละส่วนชื่อ หมายเลข_[posX,posY,posZ] (เช่น 1_[0,0,0]) คือจุดที่ยืนอยู่ก่อน //schematic load",
            modalAnchorLabel:"มุมวางในเกม (จุดที่ยืนเพื่อโหลดส่วนแรก)",modalDownloadBtn:"<i class=\"fas fa-download\"></i> ดาวน์โหลด .bloxdschem",
            modalGenerating:"<i class=\"fas fa-cog fa-spin\"></i> กำลังสร้างสเคมาติก...",
            biomePlain:"ทุ่งราบ",biomeForest:"ป่า",biomeSand:"หาดทราย",biomeMountain:"ภูเขา",biomeSnow:"หิมะ",biomeDesert:"เมซา",biomeVolcano:"ภูเขาไฟ",
            ruleActive:"ใช้งาน (กฎความสูง)",ruleYMinTip:"ชั้นล่าง: ความสูงต่ำสุด",ruleYMaxTip:"ชั้นบน: ความสูงสูงสุด",ruleLocked:"ลำดับความสำคัญ (บล็อกการวาด)",
            maxHWarning:"⚠️ เกิน 400 จะทำให้การส่งออกช้าลง",
            modalSingleFile:"📄 บังคับ .bloxdschem ไฟล์เดียว (ไม่แบ่ง)",modalSingleFileDesc:"ทั้งโลกในไฟล์เดียว เหมาะกับเว็บอื่น Bloxd จะปฏิเสธถ้าเกิน ~200 ชังก์ — อย่าติ๊กถ้าจะเล่นในเกม",
            toolSphere:"<i class=\"fas fa-globe\"></i><span>ทรงกลม</span>",toolSphereTitle:"วางทรงกลมภูมิประเทศ",
            toolBox:"<i class=\"fas fa-cube\"></i><span>กล่อง</span>",toolBoxTitle:"วางกล่องภูมิประเทศ",
            secStampParams:"ขนาดรูปร่าง",labelStampW:"ความกว้าง (X)",labelStampD:"ความลึก (Z)",labelStampH:"ความสูง (+/-)",
            labelStampBiome:"ใช้ไบโอมที่เลือกด้วย",btnAddPalette:"➕ เพิ่มจานสี",
            secPaletteForm:"จานสีของฉัน",labelPaletteName:"ชื่อจานสี",labelPaletteColor:"สี",
            labelPaletteBlocks:"บล็อก Bloxd (คั่นด้วยจุลภาค)",paletteBlocksHint:"ใส่ชื่อบล็อกที่ถูกต้อง",
            btnSavePalette:"💾 บันทึก",btnCancelPalette:"ยกเลิก",errPaletteName:"ตั้งชื่อจานสี!",errPaletteExists:"มีชื่อนี้แล้ว",
            delPaletteTip:"ลบจานสีนี้",confirmDelPalette:"ลบจานสี?",
            errPaletteBlocks:"เพิ่มบล็อกอย่างน้อย 1 บล็อก!",editPaletteTip:"แก้ไขพาเลทนี้ (ชื่อ, สี, บล็อก)",
            secPaletteEdit:"แก้ไขพาเลท",btnResetPalette:"↩️ กู้คืนพาเลทเดิม",
            confirmResetPalette:"กู้คืนบล็อกและสีของพาเลทนี้เป็นค่าเดิมหรือไม่?",paletteSaved:"บันทึกพาเลทแล้ว!",
            paletteReset:"กู้คืนพาเลทเดิมแล้ว",modifiedTag:"แก้ไขแล้ว",
            modalPixelated:"🧊 สไตล์พิกเซล",modalPixelatedDesc:"คงเอฟเฟกต์ \"บันไดยักษ์\"",
            presetClassic:"🟢 ทุ่งราบคลาสสิก",presetArchipelago:"🏝️ หมู่เกาะเขตร้อน",presetAlpine:"🏔️ ยอดเขาน้ำแข็ง",
            promptPresetName:"ชื่อพรีเซ็ต:",defaultPresetVal:"โลก Bloxd ของฉัน",presetSaved:"บันทึกพรีเซ็ตสำเร็จ: ",
            secTeamShare:"ทำต่อภายหลัง",btnExportProjectJson:"บันทึกโปรเจกต์ (.json)",btnImportProjectJson:"เปิด .json ต่อ",btnImportBloxdschem:"นำเข้าภูมิประเทศ (.bloxdschem)",
            titleExportJson:"บันทึกเพื่อแก้ต่อที่นี่ Bloxd โหลดไฟล์นี้ไม่ได้",
            titleImportJson:"เปิด .json ที่บันทึกด้วยปุ่มด้านบน",
            titleImportSchem:"สร้างความสูงใหม่จาก .bloxdschem (ไม่ใช่สิ่งปลูกสร้าง) ไฟล์ .schem ของ Minecraft ต้องผ่าน Schem Converter ก่อน",
            coachTitle:"3 ขั้น ไม่ให้หลง",coachMore:"คู่มือรูปแบบไฟล์",
            coachStep1:"แท็บนี้ตั้งขนาด ซีด และไบโอม",
            coachStep2:"แท็บแก้ไข: คลิกซ้ายบนแผนที่ 2D เพื่อวาดหรือปั้น มุม 3D ใช้ดู",
            coachStep3:"ด้านล่าง เลือกไฟล์ให้ถูก: .bloxdschem สำหรับเกม, .json เพื่อทำต่อ",
            formatTitle:"ไฟล์ไหนใช้ทำอะไร?",formatLead:"มี 3 รูปแบบ อย่าปนกัน ไม่งั้นใช้ไม่ได้",
            formatBloxd:"ไฟล์ของเกม โหลดด้วย //schematic load ชื่อ (ไม่ใส่นามสกุล)",
            formatZip:"เฉพาะเมื่อโลกใหญ่เกิน: หลายไฟล์ .bloxdschem พร้อมคู่มือ โหลดแต่ละส่วนที่ความสูง Y เดิม",
            formatJson:"ไฟล์เซฟเพื่อแก้ต่อที่นี่ Bloxd โหลดไม่ได้",
            formatMc:"Minecraft (.schem / .schematic / .litematic): ใช้ Schem Converter ก่อน จะได้ .bloxdschem",
            formatDownloadHint:"โลกเล็ก → .bloxdschem 1 ไฟล์ ใหญ่เกิน → .zip ส่วน .json คือปุ่มด้านล่าง",
            guideTitle:"คู่มือ — Terrain Editor",guideUseTitle:"วิธีใช้",guideFmtTitle:"แลกเปลี่ยนสเคมา",guideClose:"ปิด",
            guideStep3d:"บินใน 3D ด้วย ZQSD หรือ WASD + Space/Ctrl เปลี่ยนปุ่มได้ที่ ⚙️ ตั้งค่า",
            guideKeys:"ภาษาและปุ่ม: กด 🏠 แล้ว ⚙️ ตั้งค่า มีหน้าต่างเตือนครั้งแรก",
            modalIngameTitle:"ในเกม",
            modalIngame1:"วางไฟล์ .bloxdschem ในโฟลเดอร์สเคมาของ Bloxd",
            modalIngame2:"เปิดแชทแล้วพิมพ์ //schematic load ชื่อไฟล์ (ไม่ใส่ .bloxdschem)",
            modalIngame3:"ถ้าได้ .zip: เปิดอ่านคู่มือ แล้วโหลดแต่ละส่วนโดยอยู่ที่ความสูง Y เดิม ไม่งั้นชิ้นส่วนจะเหลื่อม",
            errSchemGen:"ข้อผิดพลาดในการสร้าง .bloxdschem"
        }
    }
};

window.t = function(key) {
    const lang = window.I18N.lang || 'en';
    const d = window.I18N.dict[lang] || window.I18N.dict['en'];
    if (d[key] !== undefined) return d[key];
    const e = window.I18N.dict['en'];
    return e[key] !== undefined ? e[key] : key;
};

window.getBiomeName = function(bKey, defaultObj) {
    // v4.4 : les palettes personnalisées OU modifiées (nom changé) affichent leur nom
    // utilisateur, même quand le biome n'est pas passé en paramètre (registry global)
    const b = defaultObj || (window._biomeRegistry ? window._biomeRegistry[bKey] : null);
    if (b && (b.custom || b.modified) && b.name) return b.name;
    const mapKey = 'biome' + bKey.charAt(0).toUpperCase() + bKey.slice(1);
    const translated = window.t(mapKey);
    if (translated && translated !== mapKey) return translated;
    return b ? b.name : bKey;
};

window.getPresetName = function(pKey, defaultObj) {
    const mapKey = 'preset' + pKey.charAt(0).toUpperCase() + pKey.slice(1);
    const translated = window.t(mapKey);
    if (translated && translated !== mapKey) return translated;
    return defaultObj ? defaultObj.name : pKey;
};

window.applyLanguage = function(lang) {
    if (lang) {
        window.I18N.lang = lang;
        window.safeStorage.setItem('bloxdTools.lang', lang);
        window.safeStorage.setItem('bloxd_lang', lang);
    }
    const currentLang = window.I18N.lang;

    // Update toggle button text & flag
    const flagEl = document.getElementById('lang-flag');
    const textEl = document.getElementById('lang-label');
    const btnEl = document.getElementById('btn-lang-toggle');
    if (flagEl) flagEl.textContent = window.t('langToggleFlag');
    if (textEl) textEl.textContent = window.t('langToggleText');
    if (btnEl) btnEl.title = window.t('langToggleTitle');

    // Scan all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.innerHTML = window.t(key);
    });

    // Scan all data-i18n-title elements
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        el.title = window.t(key);
    });

    // Scan all data-i18n-placeholder elements
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = window.t(key);
    });

    // Update select #cfg-ground-detail options
    const gdSelect = document.getElementById('cfg-ground-detail');
    if (gdSelect) {
        Array.from(gdSelect.options).forEach(opt => {
            const v = opt.value;
            if (v === '0') opt.textContent = window.t('optGdNone');
            if (v === '0.5') opt.textContent = window.t('optGdLight');
            if (v === '1') opt.textContent = window.t('optGdNormal');
            if (v === '2') opt.textContent = window.t('optGdRough');
        });
    }

    // Update dynamic UI components if UI manager exists
    if (window.uiManagerInstance) {
        window.uiManagerInstance.initPresetsAndActions();
        if (typeof window.uiManagerInstance.renderSettingsBiomes === 'function') window.uiManagerInstance.renderSettingsBiomes();
        if (typeof window.uiManagerInstance.renderEditorBiomes === 'function') window.uiManagerInstance.renderEditorBiomes();
        // v4.4 : le scan data-i18n ci-dessus a réécrit le titre du formulaire de palette
        // → on réapplique le titre dynamique (mode édition « Modifier la palette : X »)
        if (typeof window.uiManagerInstance.refreshPaletteFormTitle === 'function') window.uiManagerInstance.refreshPaletteFormTitle();
        if (typeof window.uiManagerInstance.update3dMeshBtn === 'function') window.uiManagerInstance.update3dMeshBtn();
        window.uiManagerInstance.updateStatsBar();
    }
    if (window.map2dInstance) {
        window.map2dInstance.updateMouseOverlay();
    }
};

window.toggleLanguage = function() {
    const nextLang = window.I18N.lang === 'fr' ? 'en' : 'fr';
    window.applyLanguage(nextLang);
};

/* ═══════════════════════════════════════════════════════════════ */
/*  generator  */
/* ═══════════════════════════════════════════════════════════════ */

/* ============================================================
   Bloxd Terrain Editor — terrain_editor_generator.js
   Moteur de terrain : bruit procédural seedé, grille hauteurs/biomes, biomes persos, undo/redo, export .bloxdschem (Avro/RLE), découpage <200 chunks.
   Chargement : 4/8 — après terrain_editor_i18n.js (voir <script> dans terrain_editor.html)
   ============================================================ */

            window.safeStorage = window.safeStorage || {
    _data: {},
    getItem(k) {
        try { return window.localStorage.getItem(k); }
        catch (e) { return this._data[k] || null; }
    },
    setItem(k, v) {
        try { window.localStorage.setItem(k, v); }
        catch (e) { this._data[k] = v; }
    },
    removeItem(k) {
        try { window.localStorage.removeItem(k); }
        catch (e) { delete this._data[k]; }
    }
};

/**
 * GIGA PROMPT - Bloxd Terrain Editor
 * Module : terrain_editor_generator.js
 * Rôle : Générateur procédural de terrain (bruit 2D, biomes, gestion de la grille, outils de peinture/édition)
 * Adapté de generate_terrain.py (M2B / Bloxd.io Format)
 */

/* =====================================================
   PARSAGE .bloxdschem (format Avro, identique M2B/Bloxd.io)
   — repris du même décodeur que Schem Placer / Schem Splitter,
   utilisé ici uniquement pour importer un terrain (voir plus bas
   TerrainGenerator.importFromBloxdschemBlocks).
   ===================================================== */
function teReadUvarint(buf, off) {
    let x = 0, s = 0, b;
    for (let i = 0; i < 10; i++) {
        if (off.value >= buf.length) break;
        b = buf[off.value++];
        if (b < 0x80) return x | (b << s);
        x |= (b & 0x7f) << s;
        s += 7;
    }
    return x;
}
function teReadAvroInt(buf, off) {
    const zz = teReadUvarint(buf, off);
    return (zz >>> 1) ^ -(zz & 1);
}
function teReadAvroBytes(buf, off) {
    const len = teReadAvroInt(buf, off);
    if (len < 0 || off.value + len > buf.length) return new Uint8Array(0);
    const bytes = buf.slice(off.value, off.value + len);
    off.value += len;
    return bytes;
}
function teDecodeChunkRLE(rleBytes, CHUNK_VOL) {
    const blocks = new Int32Array(CHUNK_VOL);
    const pos = { value: 0 };
    let i = 0;
    while (i < CHUNK_VOL && pos.value < rleBytes.length) {
        const count = teReadUvarint(rleBytes, pos);
        const bid = teReadUvarint(rleBytes, pos);
        for (let k = 0; k < count && i < CHUNK_VOL; k++) blocks[i++] = bid;
    }
    return blocks;
}
// Parse un .bloxdschem et rend directement les chunks BRUTS (pas de
// normalisation de position ici : le centrage est géré à l'import terrain).
function teParseBloxdschem(buffer) {
    const CHUNK = 32, CHUNK_VOL = 32768, AIR_ID = 0;
    const buf = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    if (!buf || buf.length < 4) throw new Error('Fichier vide ou tronqué (pas un .bloxdschem).');
    for (let i = 0; i < 4; i++) {
        if (buf[i] !== 0) throw new Error("Header .bloxdschem invalide — fichier non reconnu.");
    }
    const off = { value: 4 };
    const name = (() => { const len = teReadAvroInt(buf, off); if (len < 0 || off.value + len > buf.length) return ''; const bytes = buf.subarray(off.value, off.value + len); off.value += len; return new TextDecoder('utf-8').decode(bytes); })();
    const px = teReadAvroInt(buf, off), py = teReadAvroInt(buf, off), pz = teReadAvroInt(buf, off);
    const sx = teReadAvroInt(buf, off), sy = teReadAvroInt(buf, off), sz = teReadAvroInt(buf, off);
    if ([sx, sy, sz].some(v => v <= 0 || v > 65536) || [px, py, pz].some(v => Math.abs(v) > 1000000)) {
        throw new Error('Tailles/position incohérentes dans le header (fichier corrompu ?).');
    }
    const blocks = new Map();
    let totalBlocks = 0;
    while (off.value < buf.length) {
        let blockCount = teReadAvroInt(buf, off);
        if (blockCount === 0) break;
        if (blockCount < 0) { blockCount = -blockCount; teReadAvroInt(buf, off); }
        for (let i = 0; i < blockCount; i++) {
            const cx = teReadAvroInt(buf, off), cy = teReadAvroInt(buf, off), cz = teReadAvroInt(buf, off);
            const rle = teReadAvroBytes(buf, off);
            const arr = teDecodeChunkRLE(rle, CHUNK_VOL);
            let nonAir = 0;
            for (let k = 0; k < arr.length; k++) if (arr[k] !== AIR_ID) nonAir++;
            if (nonAir === 0) continue;
            blocks.set((px + cx * CHUNK) + ',' + (py + cy * CHUNK) + ',' + (pz + cz * CHUNK), arr);
            totalBlocks += nonAir;
            if (blocks.size > 100000) throw new Error('Fichier anormalement volumineux (>100000 chunks) — refusé.');
        }
    }
    // Bbox réelle (les clés du Map ci-dessus sont déjà en coordonnées MONDE du chunk).
    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
    blocks.forEach((arr, key) => {
        const [bx0, , bz0] = key.split(',').map(Number);
        for (let lx = 0; lx < CHUNK; lx += CHUNK - 1) for (let lz = 0; lz < CHUNK; lz += CHUNK - 1) {
            const wx = bx0 + lx, wz = bz0 + lz;
            if (wx < minX) minX = wx; if (wx > maxX) maxX = wx;
            if (wz < minZ) minZ = wz; if (wz > maxZ) maxZ = wz;
        }
    });
    if (!isFinite(minX)) { minX = px; maxX = px; minZ = pz; maxZ = pz; }
    return { name, blocks, totalBlocks, AIR_ID, CHUNK, sizeX: maxX - minX + 1, sizeZ: maxZ - minZ + 1, minX, minZ };
}


class TerrainGenerator {
    constructor() {
        // Configuration par défaut inspirée de generate_terrain.py
        this.config = {
            worldSizeX: 4000,
            worldSizeZ: 4000,
            shapeMode: 'square',
            gridResolution: 256, // Résolution de la grille globale (96/128/256)
            pixelatedExport: false, // Export en gros blocs texturés (effet pixelisé) au lieu du lissage bilinéaire
            forceSingleSchem: false, // Forcer l'export en un seul .bloxdschem (pour outils externes, dépasse la limite Bloxd)
            viewportMode: 'global', // Mode unique : grille globale (le "Focus Écran Dynamique" a été retiré ;
            // le détail au zoom est désormais assuré par les chunks 16x16 chargés à la demande, cf. getDetailChunk)
            seed: 54321,
            baseY: 70,
            seaLevel: 88,
            minHeight: 1,
            maxHeight: 400,
            noiseScale: 0.008,
            terrainIntensity: 15,
            roughness: 0.65,
            groundDetail: 1, // Micro-relief du sol au 1:1 (0=lisse, 0.5=léger, 1=normal, 2=fort)
            flatTerrain: false, // Terrain de base 100% plat (ignore le bruit de la graine)
            islandMode: false, // Génère une île : le terrain plonge sous l'eau aux bords
            flattenExact: false, // Outil Aplatir : niveau EXACT sur tout le cercle (pas de fondu)
            defaultBiome: 'plain',
            hillshading: true,
            showGrid: false,
            showWater: true,
            meshType: 'voxel' // 'voxel' | 'smooth'
        };

        // Stockage spatial persistant des modifications "Edit" (pinceau/hauteur/biome) : clé `${worldX},${worldZ}`
        this.customEdits = new Map();
        // Fenêtre active du viewport à l'écran (+ un peu plus / marge)
        this.viewport = { minX: -350, maxX: 350, minZ: -350, maxZ: 350, active: true };
        // Piles d'historique Undo / Redo (Ctrl+Z / Ctrl+Y)
        this.undoStack = [];
        this.redoStack = [];
        // Catalogue des biomes avec leurs blocs Bloxd par défaut et couleurs associées
        this.biomes = {
            plain: {
                name: 'Plaines (Plain)',
                color: '#4ade80', // Vert prairie clair
                blocks: ['Lime Concrete', 'Grass Block', 'Lime Wool', 'Lime Planks'],
                minHeight: 0,
                maxHeight: 110
            },
            forest: {
                name: 'Forêt (Forest)',
                color: '#15803d', // Vert forêt profond
                blocks: ['Lime Baked Clay', 'Green Wool', 'Green Planks', 'Green Concrete', 'Green Baked Clay'],
                minHeight: 60,
                maxHeight: 130
            },
            sand: {
                name: 'Sable / Plage (Sand)',
                color: '#e0cda9', // Beige sable
                blocks: ['Sand', 'Smooth Sandstone'],
                minHeight: 0,
                maxHeight: 93 // Proche du sea level
            },
            mountain: {
                name: 'Montagne (Mountain)',
                color: '#64748b', // Gris rocheux
                blocks: ['Smooth Stone', 'Stone', 'Stone Bricks', 'Cracked Stone Bricks'],
                minHeight: 105,
                maxHeight: 250
            },
            snow: {
                name: 'Neige (Snow)',
                color: '#f8fafc', // Blanc neigeux
                blocks: ['Snow', 'Packed Snow', 'White Concrete'],
                minHeight: 140,
                maxHeight: 400
            },
            desert: {
                name: 'Mesa (Mesa)',
                color: '#ea580c', // Orange terre cuite
                blocks: ['Orange Baked Clay', 'Baked Clay', 'Smooth Red Sandstone', 'Red Sand'],
                minHeight: 65,
                maxHeight: 150
            },
            volcano: {
                name: 'Volcan (Volcano)',
                color: '#dc2626', // Rouge magma / basalte
                blocks: ['Cherry Log', 'Dark Red Brick', 'Dark Red Stone', 'Red Baked Clay', 'Magma'],
                minHeight: 120,
                maxHeight: 350
            }
        };

        // v4.4 : snapshot des palettes d'origine (biomes intégrés) — permet de restaurer
        // les blocs/couleurs/nom si l'utilisateur a modifié une palette par défaut
        this.builtinBiomes = JSON.parse(JSON.stringify(this.biomes));
        // Registre global des biomes (consulté par window.getBiomeName pour les palettes modifiées)
        window._biomeRegistry = this.biomes;

        // REGLES DE HAUTEUR PAR BIOME : { active, yMin, yMax, locked }
        // - active : la règle force ce biome entre yMin et yMax à la génération
        // - locked : "prioritaire" = le pinceau biome ne peut pas peindre par-dessus
        this.initBiomeRules();
        // Presets prédéfinis pour charger rapidement des univers intéressants
        this.presets = {
            classic: {
                name: "🟢 Plaines Bloxd Classique",
                config: { worldSizeX: 4000, worldSizeZ: 4000, seed: 54321, baseY: 70, seaLevel: 88, minHeight: 1, maxHeight: 250, noiseScale: 0.008, terrainIntensity: 15, roughness: 0.65 }
            },
            archipelago: {
                name: "🏝️ Archipel Tropical & Plages",
                config: { worldSizeX: 4000, worldSizeZ: 4000, seed: 88412, baseY: 65, seaLevel: 92, minHeight: 10, maxHeight: 180, noiseScale: 0.012, terrainIntensity: 22, roughness: 0.4 }
            },
            alpine: {
                name: "🏔️ Hauts Sommets Glacés",
                config: { worldSizeX: 4000, worldSizeZ: 4000, seed: 99123, baseY: 90, seaLevel: 80, minHeight: 40, maxHeight: 380, noiseScale: 0.006, terrainIntensity: 35, roughness: 0.85 }
            },
            canyon: {
                name: "🏜️ Canyons du Désert Aride",
                config: { worldSizeX: 4000, worldSizeZ: 4000, seed: 33214, baseY: 80, seaLevel: 60, minHeight: 20, maxHeight: 220, noiseScale: 0.015, terrainIntensity: 28, roughness: 0.9 }
            }
        };

        // Table de hash pour le bruit pseudo-aléatoire
        this.perm = new Uint8Array(512);
        this.initPermutationTable(this.config.seed);

        // Grille de données 2D : grid[gx][gz] = { height, biome, isCustomHeight, isCustomBiome }
        this.grid = [];
        this.stats = {
            minHeight: 0,
            maxHeight: 0,
            avgHeight: 0,
            biomeCounts: {}
        };
        this._rev = 0; // compteur de version de la grille (invalidation du cache couleur 2D)
        this.shapeMask = null;
    }

    /**
     * Initialise la table de permutation pour le bruit de Perlin/Value selon une graine
     */
    initPermutationTable(seed) {
        let p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) p[i] = i;
        
        // Mélange pseudo-aléatoire basé sur seed
        let s = seed % 2147483647;
        if (s <= 0) s += 2147483646;
        for (let i = 255; i > 0; i--) {
            s = (s * 16807) % 2147483647;
            let j = s % (i + 1);
            let temp = p[i];
            p[i] = p[j];
            p[j] = temp;
        }
        for (let i = 0; i < 512; i++) {
            this.perm[i] = p[i & 255];
        }
    }

    /**
     * Fonction de bruit 2D lisse (Value Noise bicubique)
     */
    valueNoise2D(x, z) {
        let xi = Math.floor(x) & 255;
        let zi = Math.floor(z) & 255;
        let xf = x - Math.floor(x);
        let zf = z - Math.floor(z);

        // Courbe d'interpolation lissée (smoothstep)
        let u = xf * xf * (3.0 - 2.0 * xf);
        let v = zf * zf * (3.0 - 2.0 * zf);

        let aa = this.perm[this.perm[xi] + zi] / 255.0;
        let ab = this.perm[this.perm[xi] + zi + 1] / 255.0;
        let ba = this.perm[this.perm[xi + 1] + zi] / 255.0;
        let bb = this.perm[this.perm[xi + 1] + zi + 1] / 255.0;

        let x1 = aa + u * (ba - aa);
        let x2 = ab + u * (bb - ab);
        return x1 + v * (x2 - x1);
    }

    /**
     * Bruit fractal multi-octaves avec gestion des crêtes (ridges)
     */
    fbmTerrain(worldX, worldZ) {
        // v3.1 TERRAIN PLAT : sol constant, aucun bruit de la graine.
        // Posé au-dessus de l'eau (sinon baseY 70 < mer 88 = océan partout).
        if (this.config.flatTerrain) {
            return Math.max(this.config.baseY, this.config.seaLevel + 2);
        }
        let scale = this.config.noiseScale;
        let intensity = this.config.terrainIntensity;
        let roughness = this.config.roughness;

        // Bruit de base 1 (ondulations douces)
        let n1 = this.valueNoise2D(worldX * scale, worldZ * scale);
        
        // Bruit de base 2 pour les crêtes rocheuses (ridges)
        let n2 = this.valueNoise2D(worldX * scale * 2.3 + 19.7, worldZ * scale * 2.3 - 41.2);
        let ridges = 1.0 - Math.abs(2.0 * n2 - 1.0);

        // Bruit octave 3 de détail
        let n3 = this.valueNoise2D(worldX * scale * 5.1, worldZ * scale * 5.1);

        let h = this.config.baseY;
        h += (n1 - 0.5) * intensity * 2.5;
        h += ridges * intensity * roughness * 1.8;
        h += (n3 - 0.5) * intensity * 0.4;

        // MODE ÎLE : falloff radial → le terrain plonge sous l'eau aux bords
        if (this.config.islandMode) {
            const meta = this.currentGridMeta;
            if (meta) {
                const dx = (worldX - (meta.startWorldX + meta.resX * meta.stepX * 0.5)) / (meta.resX * meta.stepX * 0.5);
                const dz = (worldZ - (meta.startWorldZ + meta.resZ * meta.stepZ * 0.5)) / (meta.resZ * meta.stepZ * 0.5);
                const distFromCenter = Math.min(1, Math.sqrt(dx * dx + dz * dz));
                const falloff = Math.max(0, 1 - distFromCenter * distFromCenter * 1.3);
                h = this.config.seaLevel - 10 + (h - (this.config.seaLevel - 10)) * falloff;
            }
        }

        return h;
    }

    /**
     * Détermine le biome approprié selon la hauteur et le niveau de la mer
     */

    initBiomeRules() {
        this.loadCustomBiomes();
        for (let key in this.biomes) {
            const b = this.biomes[key];
            if (!b.rule) {
                b.rule = {
                    active: false,
                    yMin: (b.minHeight !== undefined) ? b.minHeight : 0,
                    yMax: (b.maxHeight !== undefined) ? b.maxHeight : 400,
                    locked: false
                };
            }
        }
    }

    /**
     * Retourne le biome imposé par une règle active à cette hauteur, ou null.
     * Si plusieurs règles se chevauchent, la plus spécifique (intervalle le plus étroit) gagne.
     */
    getRuleBiomeForHeight(h) {
        let best = null, bestSpan = Infinity;
        for (let key in this.biomes) {
            const r = this.biomes[key].rule;
            if (r && r.active && h >= r.yMin && h <= r.yMax) {
                const span = r.yMax - r.yMin;
                if (span < bestSpan) { bestSpan = span; best = key; }
            }
        }
        return best;
    }

    /**
     * Retourne la clé du biome dont la règle "prioritaire" (locked) protège cette hauteur, ou null.
     */
    isBiomePaintBlocked(h) {
        for (let key in this.biomes) {
            const r = this.biomes[key].rule;
            if (r && r.active && r.locked && h >= r.yMin && h <= r.yMax) return key;
        }
        return null;
    }

    assignBiomeProcedural(height, worldX, worldZ) {
        // 1) REGLES DE HAUTEUR PAR BIOME (prioritaires sur la logique procédurale)
        const ruleBiome = this.getRuleBiomeForHeight(height);
        if (ruleBiome) return ruleBiome;

        // SOUS L'EAU → toujours sable (hauteur RÉELLE, avant le warp qui raterait la zone inondée)
        if (height <= this.config.seaLevel) return 'sand';

        // 2) Distorsion légère des biomes (biome warp)
        let warp = (this.valueNoise2D(worldX * 0.01, worldZ * 0.01) - 0.5) * 15;
        let effH = height + warp;

        if (effH <= this.config.seaLevel + 3) {
            return 'sand';
        } else if (effH >= 135) {
            return 'snow';
        } else if (effH >= 100) {
            return 'mountain';
        } else {
            // Alternance entre plain et forest
            let biomeNoise = this.valueNoise2D(worldX * 0.005 + 100, worldZ * 0.005 + 100);
            return biomeNoise > 0.55 ? 'forest' : 'plain';
        }
    }

    /**
     * Synchronise les cellules modifiées de la grille courante vers le stockage spatial persistant (customEdits)
     */
    syncGridToCustomEdits() {
        if (!this.grid || !this.customEdits) return;
        for (let gx = 0; gx < this.grid.length; gx++) {
            for (let gz = 0; gz < (this.grid[gx] ? this.grid[gx].length : 0); gz++) {
                const c = this.grid[gx][gz];
                if (c && (c.isCustomHeight || c.isCustomBiome)) {
                    // FIX v2.5 (trous après tampons / presets décimés) : si un
                    // point de peinture COUVRE déjà la cellule, il est la source
                    // de vérité (pinceau/tampon écrivent déjà leurs points).
                    // Réécrire ici avec l'empreinte GROSSIERE de la cellule
                    // déclenchait le balayage de setCustomEdit qui supprimait
                    // les points fins voisins : le preset Royal Continent
                    // passait de 196 512 à 65 536 points au premier snapshot
                    // undo -> gros cubes et trous visibles dans la carte !
                    if (this.getCustomEdit(c.worldX, c.worldZ, 0.01)) continue;
                    this.setCustomEdit(c.worldX, c.worldZ, c.isCustomHeight ? c.height : null, c.isCustomBiome ? c.biome : null);
                }
            }
        }
    }

    /**
     * Index spatial des édits (buckets) pour la recherche par empreinte.
     * FIX "pointillés" : la peinture couvre la surface de la cellule d'origine,
     * pas seulement son point central, même après un changement de qualité.
     */
    _rebuildEditIndex() {
        const B = 64;
        this._editIndex = new Map();
        this._maxEditHalf = 0.5;
        if (this.customEdits) {
            this.customEdits.forEach((val, key) => {
                const c = key.split(',');
                const x = parseInt(c[0], 10), z = parseInt(c[1], 10);
                const half = (val.half !== undefined) ? val.half : 0.5;
                if (half > this._maxEditHalf) this._maxEditHalf = half;
                const bkey = Math.floor(x / B) + ',' + Math.floor(z / B);
                let arr = this._editIndex.get(bkey);
                if (!arr) { arr = []; this._editIndex.set(bkey, arr); }
                arr.push({ x: x, z: z, half: half, edit: val });
            });
        }
        this._editIndexDirty = false;
    }

    getCustomEdit(wx, wz, searchHalf = 0) {
        if (!this.customEdits || this.customEdits.size === 0) return null;
        const exact = this.customEdits.get(`${Math.round(wx)},${Math.round(wz)}`);
        if (exact) return exact;
        // Recherche spatiale : un édit peint sur une cellule plus grossière
        // couvre toute la surface de cette cellule (empreinte "half")
        if (this._editIndexDirty !== false || !this._editIndex) this._rebuildEditIndex();
        const B = 64;
        const r = searchHalf + this._maxEditHalf;
        let best = null, bestD = Infinity;
        const bx0 = Math.floor((wx - r) / B), bx1 = Math.floor((wx + r) / B);
        const bz0 = Math.floor((wz - r) / B), bz1 = Math.floor((wz + r) / B);
        for (let bx = bx0; bx <= bx1; bx++) {
            for (let bz = bz0; bz <= bz1; bz++) {
                const arr = this._editIndex.get(bx + ',' + bz);
                if (!arr) continue;
                for (let i = 0; i < arr.length; i++) {
                    const e = arr[i];
                    const reach = searchHalf + e.half;
                    const dx = Math.abs(wx - e.x), dz = Math.abs(wz - e.z);
                    if (dx <= reach && dz <= reach) {
                        const d = dx * dx + dz * dz;
                        if (d < bestD) { bestD = d; best = e.edit; }
                    }
                }
            }
        }
        return best;
    }


    /**
     * Hauteur INTERPOLÉE entre les points de peinture voisins (IDW).
     * FIX "marches nettes" : l'export et la grille lissent les pentes entre
     * les points de peinture au lieu de prendre le plus proche (falaises).
     */
    getInterpolatedEditHeight(wx, wz, fallbackH) {
        if (this._editIndexDirty !== false || !this._editIndex) this._rebuildEditIndex();
        const B = 64;
        // R doit couvrir PLUSIEURS points de peinture (pas 2*half entre points),
        // sinon l'IDW dégénère en "plus proche voisin" -> plateaux carrés
        const R = Math.max(8, this._maxEditHalf * 4);
        let num = 0, den = 0;
        const bx0 = Math.floor((wx - R) / B), bx1 = Math.floor((wx + R) / B);
        const bz0 = Math.floor((wz - R) / B), bz1 = Math.floor((wz + R) / B);
        for (let bx = bx0; bx <= bx1; bx++) {
            for (let bz = bz0; bz <= bz1; bz++) {
                const arr = this._editIndex.get(bx + ',' + bz);
                if (!arr) continue;
                for (let i = 0; i < arr.length; i++) {
                    const e = arr[i];
                    if (e.edit.height === undefined) continue;
                    const dx = wx - e.x, dz = wz - e.z;
                    const d2 = dx * dx + dz * dz;
                    if (d2 > R * R) continue;
                    // + half² : dé-singularise le noyau au voisinage du point
                    // (sans ça, poids ~50x supérieur aux voisins -> gros plateaux
                    // de la taille de l'empreinte au lieu de pentes continues)
                    const w = 1 / (d2 + e.half * e.half + 0.5);
                    num += e.edit.height * w; den += w;
                }
            }
        }
        return den > 0 ? num / den : fallbackH;
    }

    setCustomEdit(wx, wz, height, biome, half) {
        if (!this.customEdits) this.customEdits = new Map();
        const key = `${Math.round(wx)},${Math.round(wz)}`;
        const existing = this.customEdits.get(key) || {};
        if (height !== null && height !== undefined) existing.height = Math.round(height);
        if (biome !== null && biome !== undefined) existing.biome = biome;
        // Empreinte : demi-taille de la cellule au moment de la peinture.
        // v2.5 : un half EXPLICITE remplace l'ancien (les tampons 1:1 doivent
        // pouvoir affiner un point grossier, sinon le point garde son empreinte
        // géante et son balayage supprimerait les points fins voisins).
        if (half === undefined || half === null) {
            const m = this.currentGridMeta;
            half = m ? Math.max(m.stepX, m.stepZ) / 2 : 0.5;
            existing.half = Math.max(existing.half || 0, half);
        } else {
            existing.half = half;
        }
        this.customEdits.set(key, existing);

        // Un coup de pinceau REMPLACE les anciens points de peinture qu'il
        // recouvre (sinon d'anciens points "fantômes" restaient stockés entre
        // les nouveaux et dominaient l'export : aplanir ne changeait rien !)
        const kx = Math.round(wx), kz = Math.round(wz);
        if (this._editIndexDirty !== false || !this._editIndex) this._rebuildEditIndex();
        const B = 64;
        // FIX v2.9 "la peinture disparaît au rechargement 1:1" : les clés des
        // points sont ARRONDIES au bloc, donc deux empreintes de cellules
        // voisines laissent un interstice pouvant atteindre ~1 bloc. Les vieux
        // points fins (presets/tampons) y survivaient et, plus proches que le
        // nouveau point, regagnaient au rechargement des chunks détaillés ->
        // quadrillage de l'ancien biome/hauteur dans la zone pourtant peinte.
        // Marge de 0.75 bloc dès que l'empreinte est "grossière" (half >= 1) ;
        // les empreintes fines (tampons 1:1, half < 1) restent sans marge pour
        // ne pas s'entre-supprimer.
        const r = existing.half + (existing.half >= 1 ? 0.75 : 0);
        const bx0 = Math.floor((kx - r) / B), bx1 = Math.floor((kx + r) / B);
        const bz0 = Math.floor((kz - r) / B), bz1 = Math.floor((kz + r) / B);
        for (let bx = bx0; bx <= bx1; bx++) {
            for (let bz = bz0; bz <= bz1; bz++) {
                const arr = this._editIndex.get(bx + ',' + bz);
                if (!arr) continue;
                for (let i = arr.length - 1; i >= 0; i--) {
                    const e = arr[i];
                    if (e.x === kx && e.z === kz) continue;
                    if (Math.abs(e.x - kx) <= r && Math.abs(e.z - kz) <= r) {
                        this.customEdits.delete(e.x + ',' + e.z);
                        arr.splice(i, 1);
                    }
                }
            }
        }
        // Mise à jour incrémentale de l'index (pas de reconstruction complète)
        const obk = Math.floor(kx / B) + ',' + Math.floor(kz / B);
        let oarr = this._editIndex.get(obk);
        if (!oarr) { oarr = []; this._editIndex.set(obk, oarr); }
        let found = null;
        for (let i = 0; i < oarr.length; i++) { if (oarr[i].x === kx && oarr[i].z === kz) { found = oarr[i]; break; } }
        if (found) { found.half = existing.half; found.edit = existing; }
        else oarr.push({ x: kx, z: kz, half: existing.half, edit: existing });
        if (existing.half > this._maxEditHalf) this._maxEditHalf = existing.half;
        this._editIndexDirty = false;
    }

    removeCustomEdit(wx, wz, half) {
        if (!this.customEdits) return;
        if (half === undefined || half === null) {
            const m = this.currentGridMeta;
            half = m ? Math.max(m.stepX, m.stepZ) / 2 : 0.5;
        }
        // Efface tout point de peinture dont l'empreinte touche la zone gommée
        const toDelete = [];
        this.customEdits.forEach((val, key) => {
            const c = key.split(',');
            const ex = parseInt(c[0], 10), ez = parseInt(c[1], 10);
            const reach = half + ((val.half !== undefined) ? val.half : 0.5);
            if (Math.abs(wx - ex) <= reach && Math.abs(wz - ez) <= reach) toDelete.push(key);
        });
        for (let i = 0; i < toDelete.length; i++) this.customEdits.delete(toDelete[i]);
        this._editIndexDirty = true;
    }

    getSerializedCustomEdits() {
        this.syncGridToCustomEdits();
        const obj = {};
        if (this.customEdits) {
            this.customEdits.forEach((val, key) => {
                // Copie (pas une référence !) sinon les snapshots undo/redo
                // sont corrompus par les modifications ultérieures des cellules
                obj[key] = Object.assign({}, val);
            });
        }
        return obj;
    }

    /**
     * Sauvegarde l'état actuel (config + modifications pinceau) pour Ctrl+Z
     */
    saveStateForUndo() {
        if (!this.undoStack) this.undoStack = [];
        const snapshot = {
            customEdits: this.getSerializedCustomEdits(),
            config: JSON.parse(JSON.stringify(this.config)),
            biomeRules: this.getSerializedBiomeRules()
        };
        this.undoStack.push(snapshot);
        if (this.undoStack.length > 50) this.undoStack.shift();
        this.redoStack = []; // Efface la pile Redo sur une nouvelle action
    }

    undo() {
        if (!this.undoStack || this.undoStack.length === 0) return false;
        if (!this.redoStack) this.redoStack = [];

        const currentSnapshot = {
            biomeRules: this.getSerializedBiomeRules(),
            customEdits: this.getSerializedCustomEdits(),
            config: JSON.parse(JSON.stringify(this.config))
        };
        this.redoStack.push(currentSnapshot);

        const prevSnapshot = this.undoStack.pop();
        this.restoreSnapshot(prevSnapshot);
        return true;
    }

    redo() {
        if (!this.redoStack || this.redoStack.length === 0) return false;
        if (!this.undoStack) this.undoStack = [];

        const currentSnapshot = {
            biomeRules: this.getSerializedBiomeRules(),
            customEdits: this.getSerializedCustomEdits(),
            config: JSON.parse(JSON.stringify(this.config))
        };
        this.undoStack.push(currentSnapshot);

        const nextSnapshot = this.redoStack.pop();
        this.restoreSnapshot(nextSnapshot);
        return true;
    }


    getSerializedBiomeRules() {
        const out = {};
        for (let key in this.biomes) {
            if (this.biomes[key].rule) out[key] = JSON.parse(JSON.stringify(this.biomes[key].rule));
        }
        return out;
    }

    restoreSnapshot(snapshot) {
        if (!snapshot) return;
        Object.assign(this.config, snapshot.config);
        if (snapshot.biomeRules) {
            for (let key in snapshot.biomeRules) {
                if (this.biomes[key]) this.biomes[key].rule = JSON.parse(JSON.stringify(snapshot.biomeRules[key]));
            }
            if (window.uiManagerInstance && typeof window.uiManagerInstance.renderSettingsBiomes === 'function') {
                window.uiManagerInstance.renderSettingsBiomes();
            }
        }
        if (!this.customEdits) this.customEdits = new Map();
        this.customEdits.clear();
        if (snapshot.customEdits) {
            for (let key in snapshot.customEdits) {
                this.customEdits.set(key, snapshot.customEdits[key]);
            }
        }
        this._editIndexDirty = true;
        this.generateGrid(false); // MUST be false so old grid doesn't sync back and overwrite restored customEdits!
    }

    /**
     * Met à jour la fenêtre de chargement en fonction de ce qui est à l'écran (+ marge)
     */
    updateViewportFromScreen(minWX, maxWX, minWZ, maxWZ, forceUpdate = false) {
        // DEPRECIE : le mode "Focus Écran Dynamique" a été retiré. La grille est
        // toujours globale ; le détail à fort zoom vient des chunks 16x16 (2D).
        return false;
        // eslint-disable-next-line no-unreachable
        if (this.config.viewportMode !== 'dynamic') return false;
        if (!this.viewport) this.viewport = { minX: -350, maxX: 350, minZ: -350, maxZ: 350, active: true };
        
        // Marge ("un peu plus" que l'écran) pour un scrolling fluide sans rechargement constant
        const marginX = Math.max(50, (maxWX - minWX) * 0.25);
        const marginZ = Math.max(50, (maxWZ - minWZ) * 0.25);
        
        const newMinX = Math.max(-this.config.worldSizeX / 2, Math.floor(minWX - marginX));
        const newMaxX = Math.min(this.config.worldSizeX / 2, Math.ceil(maxWX + marginX));
        const newMinZ = Math.max(-this.config.worldSizeZ / 2, Math.floor(minWZ - marginZ));
        const newMaxZ = Math.min(this.config.worldSizeZ / 2, Math.ceil(maxWZ + marginZ));

        const currentCovered = (minWX >= this.viewport.minX && maxWX <= this.viewport.maxX && minWZ >= this.viewport.minZ && maxWZ <= this.viewport.maxZ);
        if (!forceUpdate && currentCovered && this.grid && this.grid.length > 0) {
            return false;
        }

        this.viewport.minX = newMinX;
        this.viewport.maxX = newMaxX;
        this.viewport.minZ = newMinZ;
        this.viewport.maxZ = newMaxZ;
        this.viewport.active = true;

        this.generateGrid(true);
        return true;
    }

    /**
     * Régénère la grille 2D (soit la zone visible écran + marge à résolution max 1:1, soit la grille globale)
     */
    generateGrid(preserveCustom = false) {
        this.initPermutationTable(this.config.seed);
        if (!this.customEdits) this.customEdits = new Map();
        if (!this.viewport) this.viewport = { minX: -350, maxX: 350, minZ: -350, maxZ: 350, active: true };

        if (preserveCustom) {
            this.syncGridToCustomEdits();
        }

        let startWorldX, startWorldZ, stepX, stepZ, resX, resZ;

        // MODE UNIQUE : grille globale. Migration silencieuse des anciens
        // presets/snapshots qui portaient encore viewportMode: 'dynamic'.
        if (this.config.viewportMode !== 'global') this.config.viewportMode = 'global';
        // v2.5 : qualité UNIQUE maximale (sélecteur "Grille de Prévisu" retiré)
        if (!this.config.gridResolution || this.config.gridResolution < 256) this.config.gridResolution = 256;
        {
            const res = this.config.gridResolution || 256;
            resX = res;
            resZ = res;
            stepX = this.config.worldSizeX / res;
            stepZ = this.config.worldSizeZ / res;
            startWorldX = -this.config.worldSizeX / 2;
            startWorldZ = -this.config.worldSizeZ / 2;
        }

        // La grille change (seed/config/édits) : les chunks de détail sont périmés
        this.invalidateDetailChunks();

        this.currentGridMeta = { startWorldX, startWorldZ, stepX, stepZ, resX, resZ };

        let newGrid = [];
        let minH = Infinity;
        let maxH = -Infinity;
        let totalH = 0;
        let counts = {};
        for (let k in this.biomes) counts[k] = 0;

        for (let gx = 0; gx < resX; gx++) {
            newGrid[gx] = [];
            let worldX = startWorldX + (gx + 0.5) * stepX;

            for (let gz = 0; gz < resZ; gz++) {
                let worldZ = startWorldZ + (gz + 0.5) * stepZ;

                let height, biome, isCustomHeight = false, isCustomBiome = false;

                const edit = this.getCustomEdit(worldX, worldZ, Math.max(stepX, stepZ) / 2);
                if (edit) {
                    height = edit.height !== undefined ? Math.round(this.getInterpolatedEditHeight(worldX, worldZ, edit.height)) : Math.round(this.fbmTerrain(worldX, worldZ));
                    biome = edit.biome || this.assignBiomeProcedural(height, worldX, worldZ);
                    isCustomHeight = edit.height !== undefined;
                    isCustomBiome = edit.biome !== undefined;
                    // REGLE PRIORITAIRE : une règle verrouillée écrase même la peinture existante
                    const lockedBy = this.isBiomePaintBlocked(height);
                    if (lockedBy && biome !== lockedBy) { biome = lockedBy; isCustomBiome = false; }
                } else {
                    height = Math.round(this.fbmTerrain(worldX, worldZ));
                    height = Math.max(this.config.minHeight, Math.min(this.config.maxHeight, height));
                    biome = this.assignBiomeProcedural(height, worldX, worldZ);
                    if (!this.biomes[biome]) biome = this.config.defaultBiome || 'plain';
                }

                newGrid[gx][gz] = {
                    height: height,
                    biome: biome,
                    worldX: worldX,
                    worldZ: worldZ,
                    isCustomHeight: isCustomHeight,
                    isCustomBiome: isCustomBiome
                };

                if (height < minH) minH = height;
                if (height > maxH) maxH = height;
                totalH += height;
                counts[biome] = (counts[biome] || 0) + 1;
            }
        }

        this.grid = newGrid;
        this.stats = {
            minHeight: minH === Infinity ? 0 : minH,
            maxHeight: maxH === -Infinity ? 0 : maxH,
            avgHeight: Math.round(totalH / Math.max(1, (resX * resZ))),
            biomeCounts: counts
        };
        this._rev = (this._rev || 0) + 1;
        this.rebuildShapeMask();
    }

    // ============ MASQUE DE FORME (Shape) ============
    rebuildShapeMask() {
        const resX = this.grid.length, resZ = (this.grid[0] && this.grid[0].length) || 0;
        if (!resX || !resZ) { this.shapeMask = null; return; }
        const mode = this.config.shapeMode || 'square';
        if (mode === 'custom') {
            if (!this.shapeMask || this.shapeMask.length !== resX || (this.shapeMask[0] && this.shapeMask[0].length) !== resZ) {
                this.shapeMask = [];
                for (let gx = 0; gx < resX; gx++) this.shapeMask.push(new Uint8Array(resZ));
            }
            return;
        }
        if (mode === 'square') { this.shapeMask = null; return; }
        // Toutes les formes géométriques : polygone régulier dans un cercle inscrit
        this.shapeMask = [];
        const cx = (resX - 1) / 2, cz = (resZ - 1) / 2;
        const rx = resX / 2, rz = resZ / 2;
        let sides = 0; // 0 = cercle/ovale
        if (mode === 'circle') sides = 0;
        else if (mode === 'triangle') sides = 3;
        else if (mode === 'pentagon') sides = 5;
        else if (mode === 'hexagon') sides = 6;
        else if (mode === 'octagon') sides = 8;
        else { this.shapeMask = null; return; }

        for (let gx = 0; gx < resX; gx++) {
            const row = new Uint8Array(resZ);
            for (let gz = 0; gz < resZ; gz++) {
                if (sides === 0) {
                    // Cercle/Ovale
                    row[gz] = (((gx - cx) / rx) ** 2 + ((gz - cz) / rz) ** 2 <= 1.0) ? 1 : 0;
                } else {
                    // Polygone régulier : teste si le point est dans le polygone inscrit
                    const nx = (gx - cx) / rx, nz = (gz - cz) / rz;
                    const angle = Math.atan2(nz, nx);
                    const sectorAngle = (Math.PI * 2) / sides;
                    const distToEdge = Math.cos(sectorAngle / 2) / Math.cos(((angle % sectorAngle) + sectorAngle) % sectorAngle - sectorAngle / 2);
                    const dist = Math.hypot(nx, nz);
                    row[gz] = (dist <= distToEdge) ? 1 : 0;
                }
            }
            this.shapeMask.push(row);
        }
        this._rev = (this._rev || 0) + 1; // invalide les caches 2D/3D
    }
    isInShape(gx, gz) {
        if (!this.shapeMask) return true;
        if (gx < 0 || gx >= this.shapeMask.length) return false;
        if (gz < 0 || gz >= this.shapeMask[gx].length) return false;
        return this.shapeMask[gx][gz] === 1;
    }
    paintShapeMask(cx, cz, radius, inside) {
        if (!this.shapeMask) return false;
        let changed = false;
        for (let dx = -radius; dx <= radius; dx++)
            for (let dz = -radius; dz <= radius; dz++) {
                if (dx * dx + dz * dz > radius * radius) continue;
                const nx = cx + dx, nz = cz + dz;
                if (nx < 0 || nx >= this.shapeMask.length || nz < 0 || nz >= this.shapeMask[nx].length) continue;
                const v = inside ? 1 : 0;
                if (this.shapeMask[nx][nz] !== v) { this.shapeMask[nx][nz] = v; changed = true; }
            }
        if (changed) this._rev = (this._rev || 0) + 1;
        return changed;
    }


    /* ============================================================
       CHUNKS DE DÉTAIL 16x16 (remplaçant du "Focus Écran Dynamique")
       Quand le monde est grand (>= ~500 blocs), la grille globale est
       grossière (1 cellule = plusieurs blocs). Au zoom, la carte 2D
       demande des chunks de 16x16 BLOCS calculés à la vraie résolution
       1:1 via getDetailChunk(). Seuls les chunks visibles à l'écran
       sont calculés, et un cache LRU évite de recalculer en pan/zoom.
       ============================================================ */
    detailChunkSize() { return 16; }

    /** Détail utile seulement si une cellule de grille couvre > 1.5 bloc */
    needsDetailChunks() {
        const m = this.currentGridMeta;
        return !!(m && Math.max(m.stepX, m.stepZ) > 1.5);
    }

    invalidateDetailChunks() {
        this._detailChunks = new Map();
        this._detailOrder = [];
    }

    /**
     * Retourne le chunk 16x16 couvrant les blocs [cx*16, cx*16+15] x [cz*16, ...]
     * en coordonnées MONDE (origine du monde = -worldSize/2).
     * { heights: Float32Array(256), biomes: Array(256), x0, z0 } ou null si hors monde.
     */
    getDetailChunk(cx, cz) {
        const S = this.detailChunkSize();
        const halfX = this.config.worldSizeX / 2, halfZ = this.config.worldSizeZ / 2;
        const x0 = cx * S, z0 = cz * S;
        if (x0 >= halfX || z0 >= halfZ || x0 + S <= -halfX || z0 + S <= -halfZ) return null;

        if (!this._detailChunks) this.invalidateDetailChunks();
        const key = cx + ',' + cz;
        const cached = this._detailChunks.get(key);
        if (cached) return cached;

        const heights = new Float32Array(S * S);
        const biomes = new Array(S * S);
        const m = this.currentGridMeta;
        for (let lz = 0; lz < S; lz++) {
            for (let lx = 0; lx < S; lx++) {
                const wx = x0 + lx + 0.5, wz = z0 + lz + 0.5;
                let h, bkey;
                const edit = this.getCustomEdit(wx, wz, 0.5);
                if (edit) {
                    const hFb = edit.height !== undefined ? edit.height : Math.round(this.fbmTerrain(wx, wz));
                    // FIX v2.7 "traits dans les pentes" : hauteur FLOTTANTE.
                    // L'arrondi au bloc entier créait des terrasses de 1 bloc
                    // que le hillshading 2D transformait en anneaux/traits
                    // sombres sur les grosses formes. L'arrondi n'est plus fait
                    // qu'aux endroits qui l'exigent (rendu voxel 3D, export).
                    // v3.0 : + micro-bruit * "Détail du sol", comme l'export
                    // (chemin édits) : la preview montre le vrai sol exporté et
                    // le réglage agit ENFIN sur les cartes peintes (presets).
                    const gdP = (this.config.groundDetail === undefined) ? 1 : this.config.groundDetail;
                    h = this.getInterpolatedEditHeight(wx, wz, hFb) +
                        (this.valueNoise2D(wx * 0.35 + 7.3, wz * 0.35 + 2.1) - 0.5) * 1.6 * gdP;
                    bkey = edit.biome || this.assignBiomeProcedural(h, wx, wz);
                    const lockedBy = this.isBiomePaintBlocked(h);
                    if (lockedBy) bkey = lockedBy;
                } else if (m && this.grid && this.grid.length) {
                    // Même échantillonnage bilinéaire + micro-bruit que l'export :
                    // le chunk zoomé montre EXACTEMENT ce qui sera exporté.
                    // BIOME : dithering spatial identique à l'export (rayon 3 blocs)
                    // pour des frontières organiques 1:1 au lieu de pavés grossiers
                    const hashB = Math.abs((((wx * 374761393 + wz * 668265263) | 0) ^ (((wx * 374761393 + wz * 668265263) | 0) >> 13)) | 0);
                    const jx = (hashB % 7) - 3;
                    const jz = (((hashB / 31) | 0) % 7) - 3;
                    const gx = Math.max(0, Math.min(m.resX - 1, Math.floor((wx + jx - m.startWorldX) / m.stepX)));
                    const gz = Math.max(0, Math.min(m.resZ - 1, Math.floor((wz + jz - m.startWorldZ) / m.stepZ)));
                    const fx = (wx - m.startWorldX) / m.stepX - 0.5;
                    const fz = (wz - m.startWorldZ) / m.stepZ - 0.5;
                    const x0i = Math.max(0, Math.min(m.resX - 1, Math.floor(fx)));
                    const z0i = Math.max(0, Math.min(m.resZ - 1, Math.floor(fz)));
                    const x1i = Math.min(m.resX - 1, x0i + 1);
                    const z1i = Math.min(m.resZ - 1, z0i + 1);
                    const tx = Math.max(0, Math.min(1, fx - x0i));
                    const tz = Math.max(0, Math.min(1, fz - z0i));
                    const hInterp =
                        this.grid[x0i][z0i].height * (1 - tx) * (1 - tz) + this.grid[x1i][z0i].height * tx * (1 - tz) +
                        this.grid[x0i][z1i].height * (1 - tx) * tz + this.grid[x1i][z1i].height * tx * tz;
                    const gd = (this.config.groundDetail === undefined) ? 1 : this.config.groundDetail;
                    const hDetail = (this.valueNoise2D(wx * 0.35 + 7.3, wz * 0.35 + 2.1) - 0.5) * 1.6 * gd;
                    h = hInterp + hDetail; // v2.7 : flottant (voir fix ci-dessus)
                    bkey = this.grid[gx][gz].biome || 'plain';
                } else {
                    h = this.fbmTerrain(wx, wz); // v2.7 : flottant
                    h = Math.max(this.config.minHeight, Math.min(this.config.maxHeight, h));
                    bkey = this.assignBiomeProcedural(h, wx, wz);
                }
                const i = lz * S + lx;
                heights[i] = h;
                biomes[i] = bkey;
            }
        }
        const chunk = { heights, biomes, x0, z0 };
        this._detailChunks.set(key, chunk);
        this._detailOrder.push(key);
        // LRU : le cap doit DÉPASSER le pire rayon de chargement 3D
        // ((2*17+1)^2 = 1225 chunks), sinon les chunks visibles s'évincent
        // mutuellement en boucle et des zones ne se remplissent jamais.
        // v2.5 : élargi pour la fenêtre 2D 1:1 (seuil 1 px/bloc)
        while (this._detailOrder.length > 8192) {
            const oldKey = this._detailOrder.shift();
            this._detailChunks.delete(oldKey);
        }
        return chunk;
    }

    /** Invalidation ciblée après un coup de pinceau (zone monde en blocs) */
    invalidateDetailChunksInRegion(wxMin, wxMax, wzMin, wzMax) {
        if (!this._detailChunks || this._detailChunks.size === 0) return;
        const S = this.detailChunkSize();
        const cx0 = Math.floor(wxMin / S), cx1 = Math.floor(wxMax / S);
        const cz0 = Math.floor(wzMin / S), cz1 = Math.floor(wzMax / S);
        for (let cx = cx0; cx <= cx1; cx++) {
            for (let cz = cz0; cz <= cz1; cz++) {
                const key = cx + ',' + cz;
                if (this._detailChunks.delete(key)) {
                    const idx = this._detailOrder.indexOf(key);
                    if (idx !== -1) this._detailOrder.splice(idx, 1);
                }
            }
        }
    }


    /* ============================================================
       TAMPONS DE TERRAIN : sphère (dôme/cratère) et pavé (plateau).
       - shape : 'sphere' | 'box'
       - sizeX/sizeZ : demi-largeurs en cellules ; heightAmp : hauteur
         (+ = bosse, - = creux) ; biome optionnel appliqué sur l'empreinte.
       ============================================================ */
    applyStamp(centerGx, centerGz, shape, sizeX, sizeZ, heightAmp, biome) {
        if (!this.grid || !this.grid.length) return false;
        const resX = this.grid.length;
        const resZ = this.grid[0] ? this.grid[0].length : 0;
        if (centerGx < 0 || centerGx >= resX || centerGz < 0 || centerGz >= resZ) return false;
        const meta = this.currentGridMeta;
        const stepX0 = meta ? meta.stepX : 1;
        const stepZ0 = meta ? meta.stepZ : 1;

        // v2.5 : TAMPONS 1:1. La forme est écrite en points de peinture à la
        // résolution des BLOCS (1 point / 1-2 blocs), plus par cellules de
        // grille. Avant : l'empreinte était arrondie à la cellule (15.6 blocs
        // sur un monde 4000) -> mesas géantes, tours isolées et falaises à
        // trous quand on changeait la taille de la forme.
        const cell0 = this.grid[centerGx][centerGz];
        const wcx = Math.round(cell0.worldX), wcz = Math.round(cell0.worldZ);
        const rx = Math.max(1, Math.round(sizeX));
        const rz = Math.max(1, Math.round(sizeZ));
        const sp = Math.max(rx, rz) > 40 ? 2 : 1; // espacement des points 1:1
        const half = sp / 2;
        const minWx = meta ? meta.startWorldX : -Infinity;
        const maxWx = meta ? meta.startWorldX + meta.resX * meta.stepX : Infinity;
        const minWz = meta ? meta.startWorldZ : -Infinity;
        const maxWz = meta ? meta.startWorldZ + meta.resZ * meta.stepZ : Infinity;
        const shapeF = (nx, nz) => {
            if (shape === 'sphere') {
                const d2 = nx * nx + nz * nz;
                return d2 > 1 ? -1 : Math.sqrt(1 - d2); // calotte sphérique
            }
            // pavé : plateau plein avec bord adouci sur ~15%
            const edge = Math.max(Math.abs(nx), Math.abs(nz));
            return edge > 1 ? -1 : (edge < 0.85 ? 1 : (1 - edge) / 0.15);
        };

        // Passe 1 : forme + hauteur de base de chaque point AVANT toute écriture
        // (écrire en échantillonnant au fil de l'eau fausserait les points suivants)
        const pts = [];
        for (let dx = -rx; dx <= rx; dx += sp) {
            for (let dz = -rz; dz <= rz; dz += sp) {
                const f = shapeF(dx / rx, dz / rz);
                if (f < 0) continue;
                const wx = wcx + dx, wz = wcz + dz;
                if (wx < minWx || wx > maxWx || wz < minWz || wz > maxWz) continue;
                pts.push({ wx: wx, wz: wz, f: f, h0: this.sampleWorldHeight(wx, wz) });
            }
        }
        if (!pts.length) return false;

        // Passe 2 : balayage des ANCIENS points recouverts par l'empreinte
        // (sinon ils resteraient mélangés aux nouveaux points 1:1 et l'IDW
        // créerait des creux/bosses parasites dans la forme)
        const toDelete = [];
        this.customEdits.forEach((v, k) => {
            const ci = k.indexOf(',');
            const ex = +k.slice(0, ci), ez = +k.slice(ci + 1);
            if (shapeF((ex - wcx) / rx, (ez - wcz) / rz) >= 0) toDelete.push(k);
        });
        for (let i = 0; i < toDelete.length; i++) this.customEdits.delete(toDelete[i]);
        if (toDelete.length) this._editIndexDirty = true;

        // Passe 3 : écriture des points 1:1
        let modified = false;
        for (let i = 0; i < pts.length; i++) {
            const p = pts[i];
            let hNew = null;
            if (heightAmp) {
                hNew = Math.max(this.config.minHeight,
                    Math.min(this.config.maxHeight, p.h0 + heightAmp * p.f));
            }
            let bNew = null;
            if (biome && this.biomes[biome]) {
                const lockedBy = this.isBiomePaintBlocked(hNew !== null ? hNew : p.h0);
                if (!lockedBy || lockedBy === biome) bNew = biome;
            }
            if (hNew === null && bNew === null) continue;
            this.setCustomEdit(p.wx, p.wz, hNew, bNew, half);
            modified = true;
        }
        if (!modified) return false;

        // Passe 4 : refléter la forme sur la grille grossière (aperçu 2D/3D).
        // IMPORTANT : PAS de flag isCustomHeight/isCustomBiome ici — le tampon
        // vit entièrement dans customEdits (points 1:1). Marquer les cellules
        // les ferait re-synchroniser en points GROSSIERS (empreinte 15.6 blocs)
        // par syncGridToCustomEdits, qui balaieraient les points fins -> trous.
        const cgxMin = Math.max(0, centerGx - Math.ceil(rx / stepX0) - 1);
        const cgxMax = Math.min(resX - 1, centerGx + Math.ceil(rx / stepX0) + 1);
        const cgzMin = Math.max(0, centerGz - Math.ceil(rz / stepZ0) - 1);
        const cgzMax = Math.min(resZ - 1, centerGz + Math.ceil(rz / stepZ0) + 1);
        for (let gx = cgxMin; gx <= cgxMax; gx++) {
            for (let gz = cgzMin; gz <= cgzMax; gz++) {
                const cell = this.grid[gx][gz];
                const f = shapeF((cell.worldX - wcx) / rx, (cell.worldZ - wcz) / rz);
                if (f < 0) continue;
                // La cellule est désormais pilotée par les points 1:1 du tampon :
                // ses anciens flags custom (peinture recouverte) sont périmés.
                cell.isCustomHeight = false;
                cell.isCustomBiome = false;
                if (heightAmp) {
                    cell.height = Math.round(this.sampleWorldHeight(cell.worldX, cell.worldZ));
                }
                if (biome && this.biomes[biome]) {
                    const lockedBy = this.isBiomePaintBlocked(cell.height);
                    if (!lockedBy || lockedBy === biome) cell.biome = biome;
                }
            }
        }

        this._statsDirty = true;
        this.lastBrushRegion = { gxMin: cgxMin, gxMax: cgxMax, gzMin: cgzMin, gzMax: cgzMax };
        if (this._detailChunks && this._detailChunks.size) {
            this.invalidateDetailChunksInRegion(wcx - rx - 2, wcx + rx + 2, wcz - rz - 2, wcz + rz + 2);
        }
        this._rev = (this._rev || 0) + 1;
        return true;
    }

    /**
     * Hauteur 1:1 du monde en (wx, wz) : IDW des points de peinture si la
     * zone est peinte, sinon interpolation bilinéaire de la grille (même
     * logique que getDetailChunk et l'export).
     */
    sampleWorldHeight(wx, wz) {
        const edit = this.getCustomEdit(wx, wz, 0.5);
        if (edit) {
            const hFb = edit.height !== undefined ? edit.height : Math.round(this.fbmTerrain(wx, wz));
            return this.getInterpolatedEditHeight(wx, wz, hFb);
        }
        const m = this.currentGridMeta;
        if (m && this.grid && this.grid.length) {
            const fx = (wx - m.startWorldX) / m.stepX - 0.5;
            const fz = (wz - m.startWorldZ) / m.stepZ - 0.5;
            const x0i = Math.max(0, Math.min(m.resX - 1, Math.floor(fx)));
            const z0i = Math.max(0, Math.min(m.resZ - 1, Math.floor(fz)));
            const x1i = Math.min(m.resX - 1, x0i + 1);
            const z1i = Math.min(m.resZ - 1, z0i + 1);
            const tx = Math.max(0, Math.min(1, fx - x0i));
            const tz = Math.max(0, Math.min(1, fz - z0i));
            return this.grid[x0i][z0i].height * (1 - tx) * (1 - tz) + this.grid[x1i][z0i].height * tx * (1 - tz) +
                   this.grid[x0i][z1i].height * (1 - tx) * tz + this.grid[x1i][z1i].height * tx * tz;
        }
        return this.fbmTerrain(wx, wz);
    }

    /* ============================================================
       BIOMES PERSONNALISÉS (palettes de l'utilisateur)
       Ajout/édition/suppression + persistance localStorage.
       ============================================================ */
    addCustomBiome(key, name, color, blocks) {
        if (!key || this.biomes[key]) return false;
        this.biomes[key] = {
            name: name || key, color: color || '#ffffff',
            blocks: (blocks && blocks.length) ? blocks : ['Grass Block'],
            minHeight: 0, maxHeight: 400, custom: true,
            rule: { active: false, yMin: 0, yMax: 400, locked: false }
        };
        this.saveCustomBiomes();
        return true;
    }

    /**
     * v4.4 : Édition d'une palette quelconque (biomes intégrés ET personnalisés) :
     * nom, couleur et liste des blocs Bloxd. Les biomes intégrés modifiés sont
     * marqués `modified` et persistés (restaurables via resetBiome).
     */
    updateBiome(key, name, color, blocks) {
        const b = this.biomes[key];
        if (!b) return false;
        if (name) b.name = name;
        if (color) b.color = color;
        if (blocks && blocks.length) b.blocks = blocks.slice();
        if (!b.custom) b.modified = true;
        this.saveCustomBiomes();
        this.invalidateDetailChunks();
        return true;
    }

    updateCustomBiome(key, name, color, blocks) {
        return this.updateBiome(key, name, color, blocks);
    }

    /**
     * v4.4 : remplace le catalogue de biomes (chargement preset / import projet)
     * ET resynchronise le registre global (window._biomeRegistry) utilisé
     * par window.getBiomeName pour afficher les noms de palettes modifiées.
     */
    setBiomesCatalog(biomes) {
        this.biomes = biomes;
        window._biomeRegistry = this.biomes;
    }

    /**
     * v4.4 : Restaure une palette intégrée (non personnalisée) à ses blocs/couleur/nom d'origine.
     * Les règles de hauteur du biome sont conservées.
     */
    resetBiome(key) {
        const b = this.biomes[key];
        const orig = this.builtinBiomes ? this.builtinBiomes[key] : null;
        if (!b || !orig) return false;
        b.name = orig.name;
        b.color = orig.color;
        b.blocks = orig.blocks.slice();
        delete b.modified;
        this.saveCustomBiomes();
        this.invalidateDetailChunks();
        return true;
    }

    removeCustomBiome(key) {
        const b = this.biomes[key];
        if (!b || !b.custom) return false; // seuls les biomes utilisateur sont supprimables
        delete this.biomes[key];
        // Les cellules peintes avec ce biome retombent sur le biome par défaut
        if (this.grid) {
            for (let gx = 0; gx < this.grid.length; gx++) {
                for (let gz = 0; gz < this.grid[gx].length; gz++) {
                    if (this.grid[gx][gz].biome === key) this.grid[gx][gz].biome = this.config.defaultBiome || 'plain';
                }
            }
        }
        if (this.customEdits) {
            this.customEdits.forEach((val) => { if (val.biome === key) delete val.biome; });
            this._editIndexDirty = true;
        }
        this.invalidateDetailChunks();
        this.saveCustomBiomes();
        return true;
    }

    saveCustomBiomes() {
        try {
            const out = {};
            for (let k in this.biomes) {
                const b = this.biomes[k];
                if (b.custom) {
                    // Palette 100% utilisateur : on sauvegarde l'objet complet
                    out[k] = JSON.parse(JSON.stringify(b));
                } else if (b.modified) {
                    // v4.4 : palette intégrée modifiée (nom/couleur/blocs) — on n'enregistre
                    // que les champs modifiés, le reste reste géré par le code
                    out[k] = { name: b.name, color: b.color, blocks: b.blocks.slice() };
                }
            }
            window.safeStorage.setItem('bloxd_custom_biomes', JSON.stringify(out));
        } catch (e) {}
    }

    loadCustomBiomes() {
        try {
            const saved = JSON.parse(window.safeStorage.getItem('bloxd_custom_biomes') || '{}');
            for (let k in saved) {
                const s = saved[k];
                if (!this.biomes[k]) {
                    // Palette utilisateur (créée avant une mise à jour) : adoption complète
                    s.custom = true; this.biomes[k] = s;
                } else if (!s.custom) {
                    // v4.4 : palette INTÉGRÉE modifiée par l'utilisateur → on réapplique les
                    // champs sauvegardés (les règles de hauteur sont rattachées juste après).
                    // (Les entrées custom déjà en mémoire sont ignorées : le stockage n'en
                    // est qu'un miroir, et reloadCustomBiomes est appelé à chaque re-render
                    // des cartes — il ne faut surtout pas y marquer `modified`.)
                    const b = this.biomes[k];
                    if (s.name) b.name = s.name;
                    if (s.color) b.color = s.color;
                    if (s.blocks && s.blocks.length) b.blocks = s.blocks;
                    b.modified = true;
                }
            }
        } catch (e) {}
    }

    /**
     * Applique l'outil d'édition pinceau sur une position grille (centerGx, centerGz)
     */
    applyBrush(centerGx, centerGz, tool, radius, intensity, activeBiome, firstClickH = null) {
        if (!this.grid || !this.grid.length) return false;
        const resX = this.grid.length;
        const resZ = this.grid[0] ? this.grid[0].length : 0;
        let modified = false;

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                let dist = Math.sqrt(dx * dx + dz * dz);
                if (dist > radius) continue;

                let gx = centerGx + dx;
                let gz = centerGz + dz;
                if (gx < 0 || gx >= resX || gz < 0 || gz >= resZ) continue;

                let cell = this.grid[gx][gz];
                let falloff = 1.0 - (dist / (radius + 1));
                let step = intensity * falloff * 0.5;

                if (tool === 'biome') {
                    // REGLE PRIORITAIRE : si une règle "locked" protège cette hauteur,
                    // le pinceau biome ne peut pas peindre par-dessus
                    const lockedBy = this.isBiomePaintBlocked(cell.height);
                    if (lockedBy && lockedBy !== activeBiome) continue;
                    cell.biome = activeBiome;
                    cell.isCustomBiome = true;
                    modified = true;
                } else if (tool === 'raise') {
                    cell.height = Math.min(this.config.maxHeight, cell.height + step);
                    cell.isCustomHeight = true;
                    modified = true;
                } else if (tool === 'lower') {
                    cell.height = Math.max(this.config.minHeight, cell.height - step);
                    cell.isCustomHeight = true;
                    modified = true;
                } else if (tool === 'flatten' && firstClickH !== null) {
                    // v3.1 : mode 100% = niveau EXACT sur tout le cercle
                    // (sans fondu falloff vers les bords)
                    cell.height = this.config.flattenExact
                        ? Math.round(firstClickH)
                        : cell.height + (firstClickH - cell.height) * falloff;
                    cell.isCustomHeight = true;
                    modified = true;
                } else if (tool === 'eraser') {
                    let procH = this.fbmTerrain(cell.worldX, cell.worldZ);
                    procH = Math.round(Math.max(this.config.minHeight, Math.min(this.config.maxHeight, procH)));
                    cell.height = procH;
                    cell.biome = this.assignBiomeProcedural(procH, cell.worldX, cell.worldZ);
                    cell.isCustomHeight = false;
                    cell.isCustomBiome = false;
                    modified = true;
                    this.removeCustomEdit(cell.worldX, cell.worldZ);
                }

                if (tool !== 'eraser' && modified) {
                    this.setCustomEdit(cell.worldX, cell.worldZ, cell.isCustomHeight ? cell.height : null, cell.isCustomBiome ? cell.biome : null);
                }
            }
        }

        // Cas spécial : Lissage (smooth)
        if (tool === 'smooth') {
            let tempH = [];
            for (let gx = Math.max(0, centerGx - radius); gx <= Math.min(resX - 1, centerGx + radius); gx++) {
                tempH[gx] = [];
                for (let gz = Math.max(0, centerGz - radius); gz <= Math.min(resZ - 1, centerGz + radius); gz++) {
                    let sum = 0, cnt = 0;
                    for (let nx = -1; nx <= 1; nx++) {
                        for (let nz = -1; nz <= 1; nz++) {
                            let mx = gx + nx, mz = gz + nz;
                            if (mx >= 0 && mx < resX && mz >= 0 && mz < resZ) {
                                sum += this.grid[mx][mz].height;
                                cnt++;
                            }
                        }
                    }
                    tempH[gx][gz] = sum / cnt;
                }
            }
            for (let gx = Math.max(0, centerGx - radius); gx <= Math.min(resX - 1, centerGx + radius); gx++) {
                for (let gz = Math.max(0, centerGz - radius); gz <= Math.min(resZ - 1, centerGz + radius); gz++) {
                    let dist = Math.sqrt((gx - centerGx) ** 2 + (gz - centerGz) ** 2);
                    if (dist <= radius) {
                        let cell = this.grid[gx][gz];
                        cell.height = Math.round(tempH[gx][gz]);
                        cell.isCustomHeight = true;
                        modified = true;
                        this.setCustomEdit(cell.worldX, cell.worldZ, cell.height, cell.isCustomBiome ? cell.biome : null);
                    }
                }
            }
        }

        if (modified) {
            // PERF DESSIN : updateStats parcourt toute la grille (65k cellules en 256x256)
            // -> différé et throttlé au lieu d'être exécuté à chaque événement souris
            this._statsDirty = true;
            if (!this._lastStatsTime || Date.now() - this._lastStatsTime > 300) {
                this._lastStatsTime = Date.now();
                this._statsDirty = false;
                this.updateStats();
            }
            // TACHE 2 : bounding box de la zone réellement touchée par ce coup de
            // pinceau (en coordonnées grille), consommée par Map3D.updateTerrainRegion
            // pour ne recalculer que les vertices concernés au lieu de tout le mesh.
            this.lastBrushRegion = {
                gxMin: Math.max(0, centerGx - radius),
                gxMax: Math.min(resX - 1, centerGx + radius),
                gzMin: Math.max(0, centerGz - radius),
                gzMax: Math.min(resZ - 1, centerGz + radius)
            };
            // Invalide les chunks de détail couvrant la zone peinte (coords monde)
            const mMeta = this.currentGridMeta;
            if (mMeta && this._detailChunks && this._detailChunks.size) {
                const wx0 = mMeta.startWorldX + this.lastBrushRegion.gxMin * mMeta.stepX;
                const wx1 = mMeta.startWorldX + (this.lastBrushRegion.gxMax + 1) * mMeta.stepX;
                const wz0 = mMeta.startWorldZ + this.lastBrushRegion.gzMin * mMeta.stepZ;
                const wz1 = mMeta.startWorldZ + (this.lastBrushRegion.gzMax + 1) * mMeta.stepZ;
                this.invalidateDetailChunksInRegion(wx0 - 2, wx1 + 2, wz0 - 2, wz1 + 2);
            }
        }
        if (modified) this._rev = (this._rev || 0) + 1;
        return modified;
    }

    /**
     * Recalcule les statistiques à la suite d'une modification
     */
    updateStats() {
        let minH = Infinity, maxH = -Infinity, totalH = 0;
        let counts = {};
        for (let k in this.biomes) counts[k] = 0;
        const resX = this.grid && this.grid.length ? this.grid.length : 0;
        const resZ = resX && this.grid[0] ? this.grid[0].length : 0;

        for (let gx = 0; gx < resX; gx++) {
            for (let gz = 0; gz < resZ; gz++) {
                let cell = this.grid[gx][gz];
                if (cell.height < minH) minH = cell.height;
                if (cell.height > maxH) maxH = cell.height;
                totalH += cell.height;
                counts[cell.biome] = (counts[cell.biome] || 0) + 1;
            }
        }
        this.stats.minHeight = Math.round(minH);
        this.stats.maxHeight = Math.round(maxH);
        this.stats.avgHeight = Math.round(totalH / Math.max(1, resX * resZ));
        this.stats.biomeCounts = counts;
    }

    /**
     * Charge un preset de configuration
     */
    loadPreset(presetKey) {
        const p = this.presets[presetKey];
        if (!p) return;
        Object.assign(this.config, p.config);
        if (p.biomes) {
            // v4.4 : setBiomesCatalog() maintient window._biomeRegistry à jour
            this.setBiomesCatalog(JSON.parse(JSON.stringify(p.biomes)));
        }
        if (!this.customEdits) this.customEdits = new Map();
        this.customEdits.clear();
        if (p.customEdits) {
            if (typeof p.customEdits === 'object') {
                for (let key in p.customEdits) {
                    this.customEdits.set(key, p.customEdits[key]);
                }
            }
        }
        this._editIndexDirty = true;
        // false : ne PAS resynchroniser l'ancienne grille par-dessus les édits du preset !
        this.generateGrid(false);
    }

    /**
     * PROJET JSON — sauvegarde/chargement complet pour le partage en équipe.
     * On ne sauvegarde PAS la grille entière (potentiellement lourde et 100%
     * déterministe de toute façon) : config + biomes + customEdits suffisent à
     * reconstruire un terrain IDENTIQUE via generateGrid() (même principe que
     * loadPreset ci-dessus), donc le fichier reste léger et facile à partager.
     */
    exportProjectData() {
        this.syncGridToCustomEdits();
        const customEditsObj = {};
        if (this.customEdits) this.customEdits.forEach((v, k) => { customEditsObj[k] = v; });
        return {
            type: 'bloxd-terrain-project',
            version: 1,
            savedAt: new Date().toISOString(),
            config: JSON.parse(JSON.stringify(this.config)),
            biomes: JSON.parse(JSON.stringify(this.biomes)),
            customEdits: customEditsObj
        };
    }

    importProjectData(data) {
        if (!data || data.type !== 'bloxd-terrain-project' || !data.config) {
            throw new Error('Fichier de projet invalide (type inattendu).');
        }
        Object.assign(this.config, data.config);
        if (data.biomes) {
            // v4.4 : setBiomesCatalog() maintient window._biomeRegistry à jour
            this.setBiomesCatalog(JSON.parse(JSON.stringify(data.biomes)));
        }
        this.initBiomeRules();
        if (!this.customEdits) this.customEdits = new Map();
        this.customEdits.clear();
        if (data.customEdits) {
            for (let key in data.customEdits) this.customEdits.set(key, data.customEdits[key]);
        }
        this.initPermutationTable(this.config.seed);
        this._editIndexDirty = true;
        this.generateGrid(false);
    }

    /**
     * IMPORT D'UN TERRAIN DEPUIS UN .bloxdschem — reconstruit un relief (heightmap)
     * à partir d'un schematic Bloxd.io existant, pour continuer à l'éditer ici.
     * LIMITE INHÉRENTE : ce logiciel modélise un terrain en 2D (une hauteur +
     * un biome par colonne x/z), donc surplombs, grottes et structures
     * suspendues d'un schem 3D quelconque ne peuvent pas survivre à l'import :
     * seul le bloc solide le plus haut de chaque colonne est conservé.
     * Les colonnes sont regroupées ("binning") à la résolution de la grille
     * actuelle pour rester rapide et léger, même sur un très gros fichier.
     */
    importFromBloxdschemBlocks(parsed) {
        const blocksMap = parsed.blocks, AIR_ID = parsed.AIR_ID;
        if (!blocksMap || blocksMap.size === 0) return { columns: 0 };
        const stepX = this.config.worldSizeX / (this.config.gridResolution || 256);
        const stepZ = this.config.worldSizeZ / (this.config.gridResolution || 256);
        const CH = parsed.CHUNK || 32;
        // Centre l'empreinte importée sur l'origine (0,0), comme le monde généré.
        const offX = -(parsed.minX + parsed.sizeX / 2);
        const offZ = -(parsed.minZ + parsed.sizeZ / 2);
        // buckets: 'bx,bz' -> { height, blockId }  (on garde le point culminant du bucket)
        const buckets = new Map();
        blocksMap.forEach((arr, key) => {
            const [baseX, baseY, baseZ] = key.split(',').map(Number);
            for (let lx = 0; lx < CH; lx++) for (let ly = 0; ly < CH; ly++) for (let lz = 0; lz < CH; lz++) {
                const bid = arr[lx * 1024 + ly * 32 + lz];
                if (bid === AIR_ID) continue;
                const wx = baseX + lx + offX, wy = baseY + ly, wz = baseZ + lz + offZ;
                const bx = Math.round(wx / stepX) * stepX;
                const bz = Math.round(wz / stepZ) * stepZ;
                const bkey = bx + ',' + bz;
                const cur = buckets.get(bkey);
                if (!cur || wy > cur.height) buckets.set(bkey, { height: wy, blockId: bid, bx, bz });
            }
        });
        if (buckets.size === 0) return { columns: 0 };

        // Table ID Bloxd -> biome (via les blocs déclarés sur chaque biome). Si le
        // bloc du schem importé n'est pas reconnu, on retombe sur la sélection par
        // hauteur habituelle du générateur (assignBiomeProcedural).
        const idToBiome = new Map();
        for (const key in this.biomes) {
            const b = this.biomes[key];
            if (!b.blocks) continue;
            for (const name of b.blocks) idToBiome.set(this.getBlockId(name), key);
        }

        // Élargit le monde si besoin pour ne rien perdre de l'empreinte importée.
        this.config.worldSizeX = Math.max(this.config.worldSizeX, Math.ceil(parsed.sizeX / 10) * 10 + 20);
        this.config.worldSizeZ = Math.max(this.config.worldSizeZ, Math.ceil(parsed.sizeZ / 10) * 10 + 20);

        if (!this.customEdits) this.customEdits = new Map();
        this.customEdits.clear();
        let minH = Infinity, maxH = -Infinity;
        buckets.forEach(({ height, blockId, bx, bz }) => {
            const biome = idToBiome.get(blockId) || this.assignBiomeProcedural(height, bx, bz);
            this.setCustomEdit(bx, bz, height, biome, Math.max(stepX, stepZ) / 2);
            if (height < minH) minH = height;
            if (height > maxH) maxH = height;
        });
        this.config.minHeight = Math.min(this.config.minHeight, Math.floor(minH));
        this.config.maxHeight = Math.max(this.config.maxHeight, Math.ceil(maxH));
        this._editIndexDirty = true;
        this.generateGrid(false);
        return { columns: buckets.size, minHeight: minH, maxHeight: maxH };
    }

    /**
     * Génère un script Python sur-mesure pour créer le fichier .bloxdschem autonome
     */
    exportPythonScript() {
        this.syncGridToCustomEdits();
        let editsPyStr = '{\n';
        let count = 0;
        if (this.customEdits) {
            this.customEdits.forEach((val, key) => {
                if (count < 25000) {
                    editsPyStr += `    "${key}": (${Math.round(val.height)}, "${val.biome || 'plain'}"),\n`;
                    count++;
                }
            });
        }
        editsPyStr += '}';

        // Collecte les biomes actifs
        let biomesPyStr = '{\n';
        for (let key in this.biomes) {
            let b = this.biomes[key];
            let blocksStr = b.blocks.map(bl => `"${bl}"`).join(', ');
            biomesPyStr += `    "${key}": [${blocksStr}],\n`;
        }
        biomesPyStr += '}';

        return `#!/usr/bin/env python3
"""
Générateur de terrain Bloxd.io personnalisé (.bloxdschem)
Généré par Bloxd Terrain Editor (Web App)
Date: ${new Date().toISOString().split('T')[0]}

Ce script utilise numpy et la spécification Avro M2B pour générer un fichier .bloxdschem
compatible avec Bloxd.io via la commande en jeu //schematic load.
"""

import os
import sys
import json
import math
import numpy as np
from bloxd_format import BloxdSchemWriter

# ============================================================
# PARAMÈTRES DU MONDE CONFIGURÉS
# ============================================================
SEED = ${this.config.seed}
WORLD_SIZE_X = ${this.config.worldSizeX}
WORLD_SIZE_Z = ${this.config.worldSizeZ}
WORLD_MIN_X = -WORLD_SIZE_X // 2
WORLD_MIN_Z = -WORLD_SIZE_Z // 2

BASE_Y = ${this.config.baseY}
SEA_Y = ${this.config.seaLevel}
MIN_HEIGHT = ${this.config.minHeight}
MAX_HEIGHT = ${this.config.maxHeight}

NOISE_SCALE = ${this.config.noiseScale}
TERRAIN_INTENSITY = ${this.config.terrainIntensity}
ROUGHNESS = ${this.config.roughness}

FILL_WATER = ${this.config.showWater ? 'True' : 'False'}
WATER_BLOCK = "Water"
CHUNK = 32
SCHEM_NAME = "Custom Bloxd World"
OUTPUT_PATH = "custom_terrain.bloxdschem"

# ============================================================
# CHARGEMENT TABLE DES BLOCS BLOXD
# ============================================================
try:
    with open("nameToId.json", "r", encoding="utf-8") as fp:
        NAME_TO_ID = json.load(fp)
except FileNotFoundError:
    print("⚠️  Warning: nameToId.json not found. Using fallback block mappings.")
    NAME_TO_ID = {
        "Air": 0, "Unloaded": 1, "Dirt": 2, "Messy Dirt": 3, "Grass Block": 4, "Sand": 5, "Clay": 6, "Gravel": 7, "Snow": 8,
        "Maple Log": 9, "Pine Log": 10, "Plum Log": 11, "Cedar Log": 12, "Aspen Log": 13, "Elm Log": 14,
        "Stone": 28, "Messy Stone": 29, "Smooth Stone": 31, "Diorite": 32, "Smooth Diorite": 33, "Andesite": 34, "Smooth Andesite": 35,
        "Granite": 36, "Smooth Granite": 37, "Sandstone": 38, "Yellowstone": 39,
        "White Wool": 51, "Orange Wool": 52, "Magenta Wool": 53, "Light Blue Wool": 54, "Yellow Wool": 55, "Lime Wool": 56,
        "Pink Wool": 57, "Gray Wool": 58, "Light Gray Wool": 59, "Cyan Wool": 60, "Purple Wool": 61, "Blue Wool": 62, "Brown Wool": 63,
        "Green Wool": 64, "Red Wool": 65, "Black Wool": 66,
        "Baked Clay": 67, "White Baked Clay": 68, "Orange Baked Clay": 69, "Magenta Baked Clay": 70, "Light Blue Baked Clay": 71,
        "Yellow Baked Clay": 72, "Lime Baked Clay": 73, "Pink Baked Clay": 74, "Gray Baked Clay": 75, "Light Gray Baked Clay": 76,
        "Cyan Baked Clay": 77, "Purple Baked Clay": 78, "Blue Baked Clay": 79, "Brown Baked Clay": 80, "Green Baked Clay": 81,
        "Red Baked Clay": 82, "Black Baked Clay": 83,
        "Gray Concrete": 84, "Light Gray Concrete": 85, "Black Concrete": 86, "Blue Concrete": 87, "Brown Concrete": 88,
        "Cyan Concrete": 89, "Light Blue Concrete": 90, "Lime Concrete": 91, "Magenta Concrete": 92, "Orange Concrete": 93,
        "Pink Concrete": 94, "Purple Concrete": 95, "Red Concrete": 96, "White Concrete": 97, "Green Concrete": 98, "Yellow Concrete": 99,
        "Water": 126, "Bricks": 128, "Stone Bricks": 129, "Block of Quartz": 132, "Mossy Stone Bricks": 135, "Cracked Stone Bricks": 136,
        "Smooth Sandstone": 137, "Ice": 139, "Obsidian": 140, "Bedrock": 147, "Lime Planks": 233, "Green Planks": 241,
        "Dark Red Brick": 130, "Dark Red Stone": 131, "Smooth Red Sandstone": 475, "Red Sand": 650, "Magma": 471, "Cherry Log": 1222,
        "Packed Snow": 8, "Overgrown Jungle Grass Block": 4, "White Chalk": 97
    }

_SUBSTITUTIONS = {
    "Overgrown Jungle Grass Block": "Grass Block",
    "Packed Snow": "Snow",
    "White Chalk": "White Concrete",
}

def block_id(name: str) -> int:
    if name in NAME_TO_ID: return NAME_TO_ID[name]
    sub = _SUBSTITUTIONS.get(name)
    if sub and sub in NAME_TO_ID: return NAME_TO_ID[sub]
    return NAME_TO_ID.get("Grass Block", 4)

biomes = ${biomesPyStr}
CUSTOM_EDITS = ${editsPyStr}

def _init_biome_globals():
    global biome_names, biome_index, biome_blocks_ids
    biome_names = list(biomes.keys())
    biome_index = {name: idx for idx, name in enumerate(biome_names)}
    biome_blocks_ids = {b: [block_id(n) for n in lst] for b, lst in biomes.items()}

_init_biome_globals()

# ============================================================
# FONCTIONS DE BRUIT ET HAUTEUR
# ============================================================
def rand01_from_xz(x, z):
    h = x * 374761393 + z * 668265263
    h = (h ^ (h >> 13)) * 1274126177
    return ((h ^ (h >> 16)) & 0x7fffffff) / 2147483648.0

def value_noise2d(x, z):
    xi = np.floor(x).astype(np.int64) & 255
    zi = np.floor(z).astype(np.int64) & 255
    xf = x - np.floor(x)
    zf = z - np.floor(z)
    u = xf * xf * (3.0 - 2.0 * xf)
    v = zf * zf * (3.0 - 2.0 * zf)
    
    global _PERM_TABLE
    if '_PERM_TABLE' not in globals():
        rng = np.random.RandomState(SEED)
        p = rng.permutation(256).astype(np.int64)
        _PERM_TABLE = np.concatenate([p, p])
    
    perm = _PERM_TABLE
    aa = perm[perm[xi] + zi] / 255.0
    ab = perm[perm[xi] + zi + 1] / 255.0
    ba = perm[perm[xi + 1] + zi] / 255.0
    bb = perm[perm[xi + 1] + zi + 1] / 255.0
    
    x1 = aa + u * (ba - aa)
    x2 = ab + u * (bb - ab)
    return x1 + v * (x2 - x1)

def get_terrain_height(X, Z):
    n1 = value_noise2d(X * NOISE_SCALE, Z * NOISE_SCALE)
    n2 = value_noise2d(X * NOISE_SCALE * 2.3 + 19.7, Z * NOISE_SCALE * 2.3 - 41.2)
    ridges = 1 - np.abs(2 * n2 - 1)
    
    h = BASE_Y + (n1 - 0.5) * TERRAIN_INTENSITY * 2.5
    h = h + ridges * TERRAIN_INTENSITY * ROUGHNESS * 1.8
    h = np.round(np.clip(h, MIN_HEIGHT, MAX_HEIGHT))
    return h.astype(np.int32)

def build_grid(x0, x1, z0, z1):
    xs = np.arange(x0, x1, dtype=np.float64)
    zs = np.arange(z0, z1, dtype=np.float64)
    return np.meshgrid(xs, zs, indexing="ij")

def pick_block(biome_id_arr, x_int, z_int, offx=0, offz=0):
    r = rand01_from_xz(x_int + offx, z_int + offz)
    out = np.zeros(biome_id_arr.shape, dtype=np.int32)
    for bname, bidx in biome_index.items():
        if bname not in biome_blocks_ids: continue
        ids = np.array(biome_blocks_ids[bname], dtype=np.int32)
        mask = biome_id_arr == bidx
        if not mask.any(): continue
        sel = np.floor(r[mask] * len(ids)).astype(np.int64) % len(ids)
        out[mask] = ids[sel]
    return out

def get_filler_block(main_biome_arr, top_block_arr, x_int, z_int):
    out = np.zeros(main_biome_arr.shape, dtype=np.int32)
    dirt_id = block_id("Dirt")
    sand_filler_id = block_id("Smooth Sandstone")
    for bname, bidx in biome_index.items():
        mask = main_biome_arr == bidx
        if not mask.any(): continue
        if bname in ("plain", "forest"): out[mask] = dirt_id
        elif bname == "sand": out[mask] = sand_filler_id
        else: out[mask] = top_block_arr[mask]
    return out

def rle_encode_vectorized(arr_1d):
    n = len(arr_1d)
    if n == 0: return b""
    change = np.nonzero(np.diff(arr_1d))[0] + 1
    starts = np.concatenate(([0], change))
    ends = np.concatenate((change, [n]))
    lengths = (ends - starts).tolist()
    values = arr_1d[starts].tolist()
    out = bytearray()
    from bloxd_format import _uvarint
    for length, val in zip(lengths, values):
        out += _uvarint(length)
        out += _uvarint(int(val))
    return bytes(out)

# ============================================================
# GÉNÉRATION SCHEMATIC
# ============================================================
def main():
    import time
    t_start = time.time()
    tiles_x = WORLD_SIZE_X // CHUNK
    tiles_z = WORLD_SIZE_Z // CHUNK
    water_id = block_id(WATER_BLOCK)
    
    y_lo = min(BASE_Y, MIN_HEIGHT, SEA_Y)
    y_hi = max(BASE_Y, MAX_HEIGHT, SEA_Y)
    chunk_y_lo = (y_lo // CHUNK) - 1
    chunk_y_hi = (y_hi // CHUNK) + 1
    n_y_chunks = chunk_y_hi - chunk_y_lo + 1
    total_chunks = tiles_x * tiles_z * n_y_chunks

    print(f"🚀 Génération du monde {WORLD_SIZE_X}x{WORLD_SIZE_Z} ({tiles_x}x{tiles_z} tuiles, {n_y_chunks} couches Y = {total_chunks} chunks)...")

    with open(OUTPUT_PATH, "wb") as f:
        writer = BloxdSchemWriter(f, SCHEM_NAME, WORLD_SIZE_X, n_y_chunks * CHUNK, WORLD_SIZE_Z, pos=(WORLD_MIN_X, 0, WORLD_MIN_Z))
        chunks_done = 0

        for tx in range(tiles_x):
            x0 = WORLD_MIN_X + tx * CHUNK
            for tz in range(tiles_z):
                z0 = WORLD_MIN_Z + tz * CHUNK
                X, Z = build_grid(x0, x0 + CHUNK, z0, z0 + CHUNK)
                Xi = X.astype(np.int64)
                Zi = Z.astype(np.int64)

                H = get_terrain_height(X, Z)
                topY = (BASE_Y + H).astype(np.int64)

                main_biome = np.zeros_like(Xi, dtype=np.int32)
                main_biome = np.where(topY <= SEA_Y + 3, 2 if len(biome_names)>2 else 0, main_biome)
                main_biome = np.where((topY > SEA_Y + 3) & (topY < 95), 0, main_biome)
                main_biome = np.where(topY >= 95, 3 if len(biome_names)>3 else 0, main_biome)

                for lx in range(CHUNK):
                    for lz in range(CHUNK):
                        kstr = f"{int(Xi[lx,lz])},{int(Zi[lx,lz])}"
                        if kstr in CUSTOM_EDITS:
                            topY[lx, lz] = int(CUSTOM_EDITS[kstr][0])
                            bname = CUSTOM_EDITS[kstr][1]
                            if bname in biome_index:
                                main_biome[lx, lz] = biome_index[bname]

                top_block = pick_block(main_biome, Xi, Zi)
                filler_block = get_filler_block(main_biome, top_block, Xi, Zi)
                underwater = FILL_WATER & (topY < SEA_Y)

                for cy in range(chunk_y_lo, chunk_y_hi + 1):
                    y_base = cy * CHUNK
                    ly = np.arange(CHUNK)
                    wy = (y_base + ly)[np.newaxis, np.newaxis, :]
                    topY3 = topY[:, :, np.newaxis]
                    filler3 = filler_block[:, :, np.newaxis]
                    top3 = top_block[:, :, np.newaxis]
                    underwater3 = underwater[:, :, np.newaxis]

                    is_top = wy == topY3
                    is_filler = (wy < topY3) & (wy >= BASE_Y)
                    is_water = underwater3 & (wy > topY3) & (wy <= SEA_Y)

                    block_arr = np.zeros((CHUNK, CHUNK, CHUNK), dtype=np.int32)
                    block_arr = np.where(is_filler, filler3, block_arr)
                    block_arr = np.where(is_top, top3, block_arr)
                    block_arr = np.where(is_water, water_id, block_arr)

                    if not block_arr.any():
                        rle = rle_encode_vectorized(np.zeros(CHUNK * CHUNK * CHUNK, dtype=np.int32))
                        writer.add_chunk(tx, cy - chunk_y_lo, tz, rle)
                        chunks_done += 1
                        continue

                    flat = np.transpose(block_arr, (0, 2, 1)).reshape(-1)
                    rle = rle_encode_vectorized(flat)
                    writer.add_chunk(tx, cy - chunk_y_lo, tz, rle)
                    chunks_done += 1

            if (tx + 1) % 15 == 0 or tx == tiles_x - 1:
                pct = 100.0 * chunks_done / total_chunks
                print(f"  ... {chunks_done}/{total_chunks} chunks ({pct:.1f}%), {time.time() - t_start:.1f}s écoulées", flush=True)

        writer.finish()

    dt = time.time() - t_start
    size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"✅ Terminé en {dt:.1f}s ! Fichier créé : {OUTPUT_PATH} ({size_mb:.2f} Mo, {chunks_done} chunks écrits)")

if __name__ == "__main__":
    main()
`;
    }

    getBlockId(name) {
        if (!this.nameToIdMap) {
            this.nameToIdMap = {
                "Air": 0, "Unloaded": 1, "Dirt": 2, "Messy Dirt": 3, "Grass Block": 4, "Sand": 5, "Clay": 6, "Gravel": 7, "Snow": 8,
                "Maple Log": 9, "Pine Log": 10, "Plum Log": 11, "Cedar Log": 12, "Aspen Log": 13, "Elm Log": 14,
                "Stone": 28, "Messy Stone": 29, "Smooth Stone": 31, "Diorite": 32, "Smooth Diorite": 33, "Andesite": 34, "Smooth Andesite": 35,
                "Granite": 36, "Smooth Granite": 37, "Sandstone": 38, "Yellowstone": 39,
                "White Wool": 51, "Orange Wool": 52, "Magenta Wool": 53, "Light Blue Wool": 54, "Yellow Wool": 55, "Lime Wool": 56,
                "Pink Wool": 57, "Gray Wool": 58, "Light Gray Wool": 59, "Cyan Wool": 60, "Purple Wool": 61, "Blue Wool": 62, "Brown Wool": 63,
                "Green Wool": 64, "Red Wool": 65, "Black Wool": 66,
                "Baked Clay": 67, "White Baked Clay": 68, "Orange Baked Clay": 69, "Magenta Baked Clay": 70, "Light Blue Baked Clay": 71,
                "Yellow Baked Clay": 72, "Lime Baked Clay": 73, "Pink Baked Clay": 74, "Gray Baked Clay": 75, "Light Gray Baked Clay": 76,
                "Cyan Baked Clay": 77, "Purple Baked Clay": 78, "Blue Baked Clay": 79, "Brown Baked Clay": 80, "Green Baked Clay": 81,
                "Red Baked Clay": 82, "Black Baked Clay": 83,
                "Gray Concrete": 84, "Light Gray Concrete": 85, "Black Concrete": 86, "Blue Concrete": 87, "Brown Concrete": 88,
                "Cyan Concrete": 89, "Light Blue Concrete": 90, "Lime Concrete": 91, "Magenta Concrete": 92, "Orange Concrete": 93,
                "Pink Concrete": 94, "Purple Concrete": 95, "Red Concrete": 96, "White Concrete": 97, "Green Concrete": 98, "Yellow Concrete": 99,
                "Water": 126, "Bricks": 128, "Stone Bricks": 129, "Block of Quartz": 132, "Mossy Stone Bricks": 135, "Cracked Stone Bricks": 136,
                "Smooth Sandstone": 137, "Ice": 139, "Obsidian": 140, "Bedrock": 147, "Lime Planks": 233, "Green Planks": 241,
        "Dark Red Brick": 130, "Dark Red Stone": 131, "Smooth Red Sandstone": 475, "Red Sand": 650, "Magma": 471, "Cherry Log": 1222,
                "Packed Snow": 8, "Overgrown Jungle Grass Block": 4, "White Chalk": 97
            };
        }
        if (this.nameToIdMap[name] !== undefined) return this.nameToIdMap[name];
        return 4; // Grass Block fallback
    }

    exportSchematicBinary() {
        const uvarint = (n) => { let out = []; n = Math.floor(n); while (true) { let b = n & 0x7F; n = Math.floor(n / 128); if (n > 0) out.push(b | 0x80); else { out.push(b); break; } } return new Uint8Array(out); };
        const avroInt = (n) => { n = Math.floor(n); let zz = (n << 1) ^ (n >> 31); if (n >= 0) zz = n * 2; else zz = (-n * 2) - 1; return uvarint(zz); };
        const avroString = (s) => { const enc = new TextEncoder().encode(s); const lenBuf = avroInt(enc.length); let res = new Uint8Array(lenBuf.length + enc.length); res.set(lenBuf, 0); res.set(enc, lenBuf.length); return res; };
        const avroBytes = (b) => { const lenBuf = avroInt(b.length); let res = new Uint8Array(lenBuf.length + b.length); res.set(lenBuf, 0); res.set(b, lenBuf.length); return res; };
        const rleEncodeBlocks = (arr) => {
            const n = arr.length; if (n === 0) return new Uint8Array(0);
            let out = []; let currId = arr[0]; let currAmt = 1;
            for (let i = 1; i <= n; i++) {
                let bid = (i < n) ? arr[i] : null;
                if (bid === currId) currAmt++;
                else {
                    let ab = uvarint(currAmt); for (let k = 0; k < ab.length; k++) out.push(ab[k]);
                    let ib = uvarint(currId); for (let k = 0; k < ib.length; k++) out.push(ib[k]);
                    currAmt = 1; currId = bid;
                }
            }
            return new Uint8Array(out);
        };

        class BloxdSchemWriterJS {
            constructor(name, sizeX, sizeY, sizeZ, posX = 0, posY = 0, posZ = 0) {
                this.buffers = []; this.chunkCount = 0; this.blockBuffer = []; this.flushEvery = 512;
                this.buffers.push(new Uint8Array([0, 0, 0, 0])); this.buffers.push(avroString(name));
                this.buffers.push(avroInt(posX)); this.buffers.push(avroInt(posY)); this.buffers.push(avroInt(posZ));
                this.buffers.push(avroInt(sizeX)); this.buffers.push(avroInt(sizeY)); this.buffers.push(avroInt(sizeZ));
            }
            addChunk(cx, cy, cz, rleBytes) {
                this.blockBuffer.push(avroInt(cx)); this.blockBuffer.push(avroInt(cy)); this.blockBuffer.push(avroInt(cz));
                this.blockBuffer.push(avroBytes(rleBytes)); this.chunkCount++;
                if (this.chunkCount >= this.flushEvery) this.flushBlock();
            }
            flushBlock() {
                if (this.chunkCount === 0) return;
                this.buffers.push(avroInt(this.chunkCount));
                for (let b of this.blockBuffer) this.buffers.push(b);
                this.blockBuffer = []; this.chunkCount = 0;
            }
            finish() {
                this.flushBlock(); this.buffers.push(avroInt(0));
                let totalLen = 0; for (let b of this.buffers) totalLen += b.length;
                let res = new Uint8Array(totalLen); let offset = 0;
                for (let b of this.buffers) { res.set(b, offset); offset += b.length; }
                return res;
            }
        }

        const CHUNK = 32;
        const exportSizeX = Math.min(this.config.worldSizeX || 640, 2048);
        const exportSizeZ = Math.min(this.config.worldSizeZ || 640, 2048);
        const tilesX = Math.max(1, Math.floor(exportSizeX / CHUNK));
        const tilesZ = Math.max(1, Math.floor(exportSizeZ / CHUNK));
        // IMPORTANT : Bloxd.io ignore/coupe silencieusement tout ce qui est en coordonnées
        // négatives lors du //schematic load. Centrer le terrain sur l'origine (0,0) faisait
        // qu'environ la moitié de la zone (tout le côté négatif) disparaissait au chargement
        // (c'est la cause exacte du "seulement 48x48" puis "64x64" au lieu de la zone complète).
        // On place donc tout le terrain en coordonnées positives, à partir de (0, 0).
        const minX = 0;
        const minZ = 0;
        const airRle = rleEncodeBlocks(new Int32Array(32768));

        const gridRes = this.config.gridResolution || 96;
        const cellW = (this.config.worldSizeX || 4000) / gridRes;
        const cellZ = (this.config.worldSizeZ || 4000) / gridRes;
        const halfWorldX = (this.config.worldSizeX || 4000) / 2;
        const halfWorldZ = (this.config.worldSizeZ || 4000) / 2;

        const stoneBlockId = this.getBlockId("Stone");
        const dirtBlockId = this.getBlockId("Dirt");
        const waterBlockId = this.getBlockId("Water");

        // Hachage 3D rapide pour le texturing des pentes et profondeurs
        const get3DHash = (x, y, z) => {
            let h = (x * 374761393 + y * 1274126177 + z * 668265263) ^ ((x * 374761393 + y * 1274126177 + z * 668265263) >> 13);
            return Math.abs((h * 2147483647) ^ (h >> 16));
        };

        const getSubsurfaceId = (biomeKey, wx, wy, wz) => {
            if (biomeKey === "plain" || biomeKey === "forest") return dirtBlockId; // "Mais on garde la terre sous les herbes"
            const h = get3DHash(wx, wy, wz);
            if (biomeKey === "sand") {
                const pal = ["Sand", "Smooth Sandstone"];
                return this.getBlockId(pal[h % pal.length]);
            }
            if (biomeKey === "snow") {
                const pal = ["Stone", "Smooth Stone", "Diorite", "Andesite"];
                return this.getBlockId(pal[h % pal.length]);
            }
            if (biomeKey === "mountain") {
                const pal = ["Smooth Stone", "Stone", "Stone Bricks", "Cracked Stone Bricks"];
                return this.getBlockId(pal[h % pal.length]);
            }
            if (biomeKey === "desert") {
                const pal = ["Baked Clay", "Orange Baked Clay", "Smooth Red Sandstone", "Red Sand"];
                return this.getBlockId(pal[h % pal.length]);
            }
            if (biomeKey === "volcano") {
                const pal = ["Dark Red Stone", "Dark Red Brick", "Magma"];
                return this.getBlockId(pal[h % pal.length]);
            }
            return dirtBlockId;
        };

        // Passe 1 : Prcalcul des hauteurs et biomes pour trouver les bornes exactes (élagage vertical)
        let minTopY = 999999, maxTopY = -999999;
        const colHeights = new Int32Array(tilesX * CHUNK * tilesZ * CHUNK);
        const colBiomes = [];
        for (let tx = 0; tx < tilesX; tx++) {
            const worldX0 = minX + tx * CHUNK;
            for (let tz = 0; tz < tilesZ; tz++) {
                const worldZ0 = minZ + tz * CHUNK;
                for (let lx = 0; lx < CHUNK; lx++) {
                    for (let lz = 0; lz < CHUNK; lz++) {
                        let wx = worldX0 + lx, wz = worldZ0 + lz;
                        // MASQUE DE FORME : ignore les blocs hors-forme à l'export
                        if (this.shapeMask) {
                            const m = this.currentGridMeta;
                            if (m) {
                                const cgx = Math.floor((wx - halfWorldX - m.startWorldX) / m.stepX);
                                const cgz = Math.floor((wz - halfWorldZ - m.startWorldZ) / m.stepZ);
                                if (!this.isInShape(cgx, cgz)) continue;
                            }
                        }
                        // FIX DÉCALAGE Y ENTRE PARTIES : l'export écrit ses blocs en
                        // coordonnées POSITIVES (0..taille, car Bloxd coupe le négatif),
                        // mais la grille/peinture vivent en coordonnées CENTRÉES
                        // (-moitié..+moitié). Sans cette conversion, la moitié du monde
                        // ne trouvait aucun édit et retombait sur le terrain procédural
                        // à une hauteur différente (murs de roche au milieu des parties).
                        const wxS = wx - halfWorldX, wzS = wz - halfWorldZ;
                        let h = 0, bkey = "plain";
                        const customEdit = this.getCustomEdit(wxS, wzS, 0.5);
                        if (customEdit) {
                            const hFb = customEdit.height !== undefined ? customEdit.height : Math.round(this.fbmTerrain(wxS, wzS));
                            // MODE PIXELISE (case cochée) : point le plus proche = gros blocs
                            // MODE LISSE (défaut) : interpolation IDW entre points de peinture
                            // + micro-bruit (comme le chemin grille) : casse les dernières
                            // terrasses alignées sur le quadrillage des points de peinture
                            if (this.config.pixelatedExport) {
                                h = Math.round(hFb);
                            } else {
                                const hIdw = this.getInterpolatedEditHeight(wxS, wzS, hFb);
                                const gdE = (this.config.groundDetail === undefined) ? 1 : this.config.groundDetail;
                                const hDet = (this.valueNoise2D(wxS * 0.35 + 7.3, wzS * 0.35 + 2.1) - 0.5) * 1.6 * gdE;
                                h = Math.round(hIdw + hDet);
                            }
                            bkey = customEdit.biome || this.assignBiomeProcedural(h, wxS, wzS);
                            // REGLE PRIORITAIRE : la règle verrouillée gagne sur la peinture
                            const lockedBy = this.isBiomePaintBlocked(h);
                            if (lockedBy) bkey = lockedBy;
                        } else if (this.config.viewportMode === 'global' && this.grid && this.currentGridMeta) {
                            const meta = this.currentGridMeta;
                            let gx = Math.floor((wxS - meta.startWorldX) / meta.stepX);
                            let gz = Math.floor((wzS - meta.startWorldZ) / meta.stepZ);
                            if (gx >= 0 && gx < meta.resX && gz >= 0 && gz < meta.resZ && this.grid[gx] && this.grid[gx][gz]) {
                                if (this.config.pixelatedExport) {
                                    // MODE PIXELISE (feature) : plus proche voisin -> gros blocs texturés
                                    h = Math.round(this.grid[gx][gz].height);
                                } else {
                                    // MODE LISSE (défaut) : interpolation bilinéaire entre les
                                    // 4 cellules voisines -> pentes continues, plus de "marches" géantes
                                    const fx = (wxS - meta.startWorldX) / meta.stepX - 0.5;
                                    const fz = (wzS - meta.startWorldZ) / meta.stepZ - 0.5;
                                    const x0 = Math.max(0, Math.min(meta.resX - 1, Math.floor(fx)));
                                    const z0 = Math.max(0, Math.min(meta.resZ - 1, Math.floor(fz)));
                                    const x1 = Math.min(meta.resX - 1, x0 + 1);
                                    const z1 = Math.min(meta.resZ - 1, z0 + 1);
                                    const tx2 = Math.max(0, Math.min(1, fx - x0));
                                    const tz2 = Math.max(0, Math.min(1, fz - z0));
                                    const h00 = this.grid[x0][z0].height, h10 = this.grid[x1][z0].height;
                                    const h01 = this.grid[x0][z1].height, h11 = this.grid[x1][z1].height;
                                    const hInterp =
                                        h00 * (1 - tx2) * (1 - tz2) + h10 * tx2 * (1 - tz2) +
                                        h01 * (1 - tx2) * tz2 + h11 * tx2 * tz2;
                                    // Micro-bruit organique (±0.8 bloc) : casse l'alignement
                                    // des bords de terrasses sur la grille (effet "rectangles 4x5")
                                    const gdG = (this.config.groundDetail === undefined) ? 1 : this.config.groundDetail;
                                    const hDetail = (this.valueNoise2D(wxS * 0.35 + 7.3, wzS * 0.35 + 2.1) - 0.5) * 1.6 * gdG;
                                    h = Math.round(hInterp + hDetail);
                                }
                                bkey = this.grid[gx][gz].biome || "plain";
                            } else {
                                h = Math.round(this.fbmTerrain(wxS, wzS));
                                h = Math.max(this.config.minHeight, Math.min(this.config.maxHeight, h));
                                bkey = this.assignBiomeProcedural(h, wxS, wzS);
                            }
                        } else {
                            h = Math.round(this.fbmTerrain(wxS, wzS));
                            h = Math.max(this.config.minHeight, Math.min(this.config.maxHeight, h));
                            bkey = this.assignBiomeProcedural(h, wxS, wzS);
                        }
                        const idx = (tx * CHUNK + lx) * (tilesZ * CHUNK) + (tz * CHUNK + lz);
                        colHeights[idx] = h;
                        colBiomes[idx] = bkey;
                        if (h < minTopY) minTopY = h;
                        if (h > maxTopY) maxTopY = h;
                    }
                }
            }
        }

        // Bornes verticales réelles = hauteur de terrain effectivement calculée (Passe 1),
        // PAS les bornes théoriques minHeight/maxHeight de la config (qui gonflaient
        // artificiellement le nombre de chunks Y à exporter, la plupart vides).
        const yLo = Math.min(minTopY, this.config.baseY, this.config.seaLevel);
        const yHi = Math.max(maxTopY, this.config.seaLevel);

        // FIX ERREUR 400 : comme posX/posZ, le champ posY du header DOIT rester à 0,
        // sinon le serveur Bloxd rejette le fichier (HTTP 400). On écrit donc toujours
        // les chunks depuis Y=0 (pas d'élagage du bas — de toute façon le sous-sol
        // est rempli de pierre jusqu'à Y=0, ces chunks ne sont pas vides).
        const chunkYLo = 0;
        const chunkYHi = Math.floor(yHi / CHUNK) + 1;
        const nYChunks = chunkYHi - chunkYLo + 1;

        // ============================================================
        // GRADIENT DE BIOMES aux frontières (dithering spatial) :
        // pour chaque colonne, on échantillonne le biome d'une colonne
        // voisine choisie pseudo-aléatoirement dans un rayon BLEND_R.
        // Au coeur d'un biome cela ne change rien ; près d'une frontière
        // les blocs des deux biomes s'entremêlent progressivement,
        // créant une transition de textures naturelle (~6 blocs de large).
        // ============================================================
        const colsX = tilesX * CHUNK, colsZ = tilesZ * CHUNK;
        const BLEND_R = 3;
        const sampleBiomeBlended = (cx, cz, h) => {
            const dx = (h % (2 * BLEND_R + 1)) - BLEND_R;
            const dz = (((h / 31) | 0) % (2 * BLEND_R + 1)) - BLEND_R;
            const nx = Math.max(0, Math.min(colsX - 1, cx + dx));
            const nz = Math.max(0, Math.min(colsZ - 1, cz + dz));
            return colBiomes[nx * colsZ + nz];
        };

        const generateRegion = (startTx, endTx, startTz, endTz, partName) => {
            const regTilesX = endTx - startTx;
            const regTilesZ = endTz - startTz;
            const regMinX = minX + startTx * CHUNK;
            const regMinZ = minZ + startTz * CHUNK;
            // FIX BUG "HTTP 400 sur les parties 2+" : Bloxd.io n'utilise PAS le champ position
            // (x, z) du header pour placer automatiquement chaque partie ailleurs dans le monde.
            // Comme le fait l'outil officiel M2B (Quentin-X/M2B) pour ses schematics découpés,
            // seule la position Y garde un sens ; X et Z doivent rester à 0 dans CHAQUE fichier
            // (c'est au joueur de se déplacer manuellement de regMinX/regMinZ blocs entre deux
            // //schematic load). Écrire regMinX/regMinZ dans le header faisait que seule la
            // partie 1 (où regMinX = regMinZ = 0) était acceptée par le serveur ; toutes les
            // autres étaient rejetées avec une erreur 400.
            const writer = new BloxdSchemWriterJS(partName, regTilesX * CHUNK, nYChunks * CHUNK, regTilesZ * CHUNK, 0, chunkYLo * CHUNK, 0);
            let chunksWritten = 0;

            for (let tx = startTx; tx < endTx; tx++) {
                const worldX0 = minX + tx * CHUNK;
                for (let tz = startTz; tz < endTz; tz++) {
                    const worldZ0 = minZ + tz * CHUNK;
                    for (let cy = chunkYLo; cy <= chunkYHi; cy++) {
                        let yBase = cy * CHUNK;
                        let blocks = new Int32Array(32768);
                        let hasBlocks = false;

                        for (let lx = 0; lx < CHUNK; lx++) {
                            for (let lz = 0; lz < CHUNK; lz++) {
                                let wx = worldX0 + lx, wz = worldZ0 + lz;
                                const colIdx = (tx * CHUNK + lx) * (tilesZ * CHUNK) + (tz * CHUNK + lz);
                                let topY = colHeights[colIdx];
                                let bkey = colBiomes[colIdx];
                                // GRADIENT DE BIOMES : dithering de textures a la frontiere.
                                // FIX GLITCH EAU : jamais sous le niveau de la mer, sinon des
                                // blocs de plaine/foret se melangent au fond marin pres des cotes
                                if (topY > this.config.seaLevel) {
                                    const hMix = get3DHash(wx, topY, wz);
                                    const bkeyMix = sampleBiomeBlended(tx * CHUNK + lx, tz * CHUNK + lz, hMix);
                                    if (bkeyMix && bkeyMix !== bkey && this.biomes[bkeyMix]) bkey = bkeyMix;
                                }
                                const biomeObj = this.biomes[bkey] || this.biomes["plain"];
                                const blockList = (biomeObj && biomeObj.blocks && biomeObj.blocks.length > 0) ? biomeObj.blocks : ["Grass Block"];

                                for (let ly = 0; ly < CHUNK; ly++) {
                                    let wy = yBase + ly;
                                    let idx = lx * 1024 + ly * 32 + lz;

                                    let terrBid = 0;
                                    if (wy === topY) {
                                        const h3 = get3DHash(wx, wy, wz);
                                        terrBid = this.getBlockId(blockList[h3 % blockList.length]);
                                    } else if (wy < topY && wy >= this.config.baseY) {
                                        if (topY - wy <= 5) {
                                            terrBid = getSubsurfaceId(bkey, wx, wy, wz);
                                        } else {
                                            terrBid = stoneBlockId;
                                        }
                                    } else if (wy < topY && wy < this.config.baseY) {
                                        terrBid = stoneBlockId;
                                    } else if (this.config.showWater && wy > topY && wy <= this.config.seaLevel) {
                                        terrBid = waterBlockId;
                                    }

                                    if (terrBid > 0) {
                                        blocks[idx] = terrBid;
                                        hasBlocks = true;
                                    }
                                }
                            }
                        }

                        if (!hasBlocks) {
                            writer.addChunk(tx - startTx, cy - chunkYLo, tz - startTz, airRle);
                            chunksWritten++;
                        } else {
                            writer.addChunk(tx - startTx, cy - chunkYLo, tz - startTz, rleEncodeBlocks(blocks));
                            chunksWritten++;
                        }
                    }
                }
            }
            return { bytes: writer.finish(), chunks: chunksWritten, offsetX: regMinX, offsetZ: regMinZ };
        };

        const mainRes = generateRegion(0, tilesX, 0, tilesZ, "Monde Bloxd");

        // EXPORT MONO-FICHIER FORCÉ : ignore la limite ~200 chunks de Bloxd.
        // Utile pour les outils externes (autres sites/convertisseurs) qui
        // lisent le .bloxdschem entier ; Bloxd lui-même refusera probablement
        // un fichier aussi gros via //schematic load.
        if (this.config.forceSingleSchem) {
            const outBytes = mainRes.bytes;
            outBytes.splitFiles = [{ name: "monde_personnalise.bloxdschem", bytes: mainRes.bytes }];
            return outBytes;
        }

        if (mainRes.chunks <= 180) {
            const outBytes = mainRes.bytes;
            outBytes.splitFiles = [{ name: "monde_personnalise.bloxdschem", bytes: mainRes.bytes }];
            return outBytes;
        } else {
            const maxTilesPerAxis = Math.max(1, Math.floor(Math.sqrt(160 / nYChunks)));
            const files = [];
            let partNum = 1;
            for (let stx = 0; stx < tilesX; stx += maxTilesPerAxis) {
                const etx = Math.min(tilesX, stx + maxTilesPerAxis);
                for (let stz = 0; stz < tilesZ; stz += maxTilesPerAxis) {
                    const etz = Math.min(tilesZ, stz + maxTilesPerAxis);
                    const res = generateRegion(stx, etx, stz, etz, `Partie ${partNum}`);
                    if (res.chunks > 0) {
                        // Le décalage réel (offsetX/offsetZ) est gardé dans le nom du fichier ET
                        // dans l'objet retourné, pour que le guide généré côté UI (ui.js) puisse
                        // dire exactement de combien de blocs se déplacer avant chaque
                        // //schematic load (voir note dans generateRegion plus haut).
                        files.push({
                            name: `monde_partie_${partNum}_x${res.offsetX}_z${res.offsetZ}.bloxdschem`,
                            bytes: res.bytes,
                            offsetX: res.offsetX,
                            offsetZ: res.offsetZ
                        });
                        partNum++;
                    }
                }
            }
            const firstValidBytes = files.length > 0 ? files[0].bytes : mainRes.bytes;
            firstValidBytes.splitFiles = files;
            return firstValidBytes;
        }
    }

}
window.TerrainGenerator = TerrainGenerator;

/* ──── map ──── */

/**
 * terrain_editor_map.js — RENDU 2D & 3D (fusionné)
 * Contient: map2d, map3d
 */

/* ═══════════════════════════════════════════════════════════════ */
/*  map2d  */
/* ═══════════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════════ */
/*  map3d  */
/* ═══════════════════════════════════════════════════════════════ */

/* ============================================================
   Bloxd Terrain Editor — terrain_editor_map3d.js
   TOUT le rendu 3D : Babylon.js, terrain CHUNKISÉ (32×32 cellules),
   mesh voxel/lisse, eau, chunks de détail 1:1, caméra ArcRotateCamera.
   Chargement : 6/8 — nécessite terrain_editor_babylon.min.js + generator.js (voir <script> dans terrain_editor.html)
   ============================================================ */

            window.safeStorage = window.safeStorage || {
    _data: {},
    getItem(k) {
        try { return window.localStorage.getItem(k); }
        catch (e) { return this._data[k] || null; }
    },
    setItem(k, v) {
        try { window.localStorage.setItem(k, v); }
        catch (e) { this._data[k] = v; }
    },
    removeItem(k) {
        try { window.localStorage.removeItem(k); }
        catch (e) { delete this._data[k]; }
    }
};

/**
 * GIGA PROMPT - Bloxd Terrain Editor
 * Module : terrain_editor_map3d.js
 * Rôle : Visualisation 3D interactive du terrain avec Babylon.js
 *
 * NOTE v3.5 : portage complet Three.js -> Babylon.js (fusion des éditeurs).
 * NOTE v3.6 — GROS PASSAGE PERFORMANCE :
 *  1) TERRAIN DÉCOUPÉ EN CHUNKS (32×32 cellules -> 8×8 = 64 chunks en 256²)
 *     - chaque chunk possède SA bounding box -> FRUSTUM CULLING automatique de
 *       Babylon : zoomé sur un coin, les chunks hors-champ ne sont pas dessinés
 *     - PICKING accéléré : le rayon n'est testé en triangles que contre les
 *       chunks dont la bbox est traversée (≈2k tris au lieu de 260k)
 *     - MISES À JOUR LOCALES : un coup de pinceau ne reconstruit que les chunks
 *       touchés — en mode VOXEL aussi (avant : rebuild complet de la carte !)
 *  2) BUILD PROGRESSIF : chunks construits par budget (~7 ms/frame), triés par
 *     proximité du point regardé -> la carte apparaît autour du regard, sans gel.
 *  3) OMBRES RENDUES UNE SEULE FOIS (refreshRate RENDER_ONCE + ré-armement à
 *     chaque changement de géométrie) : en orbite caméra, la passe d'ombre
 *     (toute la géométrie re-rasterisée) disparaît des frames sans édition.
 *  4) MATÉRIAUX PARTAGÉS FIGÉS (material.freeze()) + meshes statiques
 *     (freezeWorldMatrix()) : zéro recalcul CPU par frame pour la géométrie fixe.
 *  5) COULEURS SANS ALLOCATION : cache hex->RGB + objets scratch (avant : 2 à 4
 *     NEW Color3 PAR sommet à chaque rebuild -> pics de GC).
 *  6) FACES VISIBLES SEULEMENT : un chunk grossier 100% couvert par la
 *     surcouche 1:1 est purement DÉSACTIVÉ (zéro pixel rasterisé, zéro
 *     z-fighting) au lieu d'être simplement enfoncé sous la carte.
 *  7) Indices 16 bits choisis automatiquement par Babylon (< 65536 sommets par
 *     chunk) -> buffers 2× plus légers, transferts GPU réduits.
 * L'API publique consommée par ui.js / main.js est INCHANGÉE :
 * updateTerrain, updateTerrainRegion, resize, resetCamera, clearDetailOverlay,
 * clearDetailOverlayInRegion, _needsRender, _terrainDirty, _cellRanges,
 * _geomMeta, _sunkCells, _detailMeshes, detailGroup, brushCursor3D, isPainting3D.
 */

class Map3D {
    constructor(containerId, generator) {
        this.container = document.getElementById(containerId);
        this.generator = generator;

        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.canvas = null;

        // ---- Terrain chunkisé (v3.6) ----
        this._chunkCells = 32;              // taille d'un chunk en cellules de grille
        this._terrainChunks = [];           // entries {cx,cz,x0,x1,z0,z1,mesh,wire,positions,...,built}
        this._chunkIndex = new Map();       // 'cx,cz' -> entry
        this._chunkBuildQueue = [];         // file de construction progressive
        this._terrainMaterial = null;       // matériau PARTAGÉ de tous les chunks (figé)
        this._cellRanges = new Map();       // 'gx,gz' -> {entry, s, e} (voxel : sink par cellule)
        this._sunkCells = new Map();        // 'gx,gz' -> {cx, cz, saved:Float32Array(ys)}
        this._geomMeta = null;              // layout courant {resX,resZ,scale,halfSizeX,halfSizeZ,meshType}
        this._dbg = { chunkBuilds: 0 };     // instrumentation (tests / perf)

        this.waterMesh = null;

        this.showWireframe = false;
        this.animFrameId = null;

        // TACHE 1 : rendu à la demande (dirty flag) + pause quand invisible
        this._needsRender = true;   // au moins un rendu au démarrage
        this._wasHidden = false;    // détecte la transition invisible -> visible

        // Caches couleur (v3.6) : hex string -> {r,g,b} (auto-invalide quand
        // la couleur du biome change, car la CLÉ c'est la couleur elle-même)
        this._biomeRGBCache = new Map();
        this._colScratch = { r: 0, g: 0, b: 0 };
        this._sideScratch = { r: 0, g: 0, b: 0 };

        this.init();
    }

    /**
     * Initialisation du moteur Babylon.js, scène, caméra, lumières et contrôles
     */
    init() {
        if (!this.container || typeof BABYLON === 'undefined') {
            console.error("Babylon.js non disponible ou conteneur introuvable !");
            return;
        }

        const width = this.container.clientWidth || 600;
        const height = this.container.clientHeight || 400;

        // 0. Canvas dédié + moteur Babylon
        this.canvas = document.createElement('canvas');
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.display = 'block';
        this.canvas.style.outline = 'none';
        this.canvas.style.touchAction = 'none';
        this.container.innerHTML = '';
        this.container.appendChild(this.canvas);

        this.engine = new BABYLON.Engine(this.canvas, true, { powerPreference: 'high-performance' }, true);
        // PERF : plafonne le pixel-ratio effectif à 1.5 (au lieu de 2). Sur les écrans
        // Retina/hi-DPI, la scène était rendue jusqu'à 4× les pixels CSS (coût GPU
        // énorme en orbite/édition). À 1.5 : ~44 % de pixels en moins, rendu net.
        this.engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 1.5));

        // 1. Scène (fond sombre + brouillard)
        this.scene = new BABYLON.Scene(this.engine);
        // Repère droitier (fix v3.5.1) : winding natif Babylon + vue identique à Three.
        this.scene.useRightHandedSystem = true;
        this.scene.clearColor = BABYLON.Color4.FromHexString('#0f111aFF');
        this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        // Brouillard fortement réduit (était 0.0012 -> voile gênant dès ~800 unités,
        // donc visible sur la plupart des grands terrains). Sert uniquement à masquer
        // la limite de la distance de rendu (camera.maxZ), plus le pop-in des chunks.
        this.scene.fogDensity = 0.00015;
        this.scene.fogColor = BABYLON.Color3.FromHexString('#0f111a');
        // Groupe de rendu 1 = « toujours au-dessus » (depth buffer effacé avant),
        // utilisé par le curseur pinceau (≈ depthTest:false + renderOrder de Three).
        this.scene.setRenderingAutoClearDepthStencil(1, true);

        // 2. Caméra ArcRotate (≈ PerspectiveCamera + OrbitControls fusionnés)
        this.camera = new BABYLON.ArcRotateCamera('map3dCamera', Math.PI / 2, 0.9, 500, new BABYLON.Vector3(0, 80, 0), this.scene);
        this.camera.fov = 50 * Math.PI / 180; // 50° comme la PerspectiveCamera d'origine
        this.camera.minZ = 0.1;
        this.camera.maxZ = 10000;
        this.camera.upperBetaLimit = Math.PI / 2 - 0.02; // ≈ maxPolarAngle : ne jamais passer sous le sol
        this.camera.lowerRadiusLimit = 1;                // zoom très proche autorisé (le « zoom traversant » pousse ensuite la cible)
        this.camera.inertia = 0.92;                      // ≈ enableDamping + dampingFactor 0.08
        this.camera.panningInertia = 0.92;
        this.camera.attachControl(this.canvas, true);
        // Position initiale identique à la version Three (0, 350, 450) visant (0, 80, 0)
        this.camera.setTarget(new BABYLON.Vector3(0, 80, 0));
        this.camera.setPosition(new BABYLON.Vector3(0, 350, 450));
        // TACHE 1 : tout changement de la vue (drag, inertie, zoom) => un seul rendu.
        // L'observable se déclenche PENDANT scene.render() -> la chaîne « dirty -> render ->
        // dirty (inertie restante) » s'auto-entretient jusqu'à l'arrêt complet de la caméra.
        this.camera.onViewMatrixChangedObservable.add(() => { this._needsRender = true; });

        // 3. Lumières
        // ≈ AmbientLight(0xffffff, 0.45) : hémisphérique uniforme (ciel = sol)
        const ambientLight = new BABYLON.HemisphericLight('ambientLight', new BABYLON.Vector3(0, 1, 0), this.scene);
        ambientLight.diffuse = new BABYLON.Color3(1, 1, 1);
        ambientLight.groundColor = new BABYLON.Color3(1, 1, 1);
        ambientLight.specular = new BABYLON.Color3(0, 0, 0);
        ambientLight.intensity = 0.45;

        // ≈ DirectionalLight(0xfffaed, 0.9) avec ombres adoucies
        const sunLight = new BABYLON.DirectionalLight('sunLight', new BABYLON.Vector3(-300, -600, -400).normalize(), this.scene);
        sunLight.position = new BABYLON.Vector3(300, 600, 400);
        sunLight.diffuse = BABYLON.Color3.FromHexString('#fffaed');
        sunLight.intensity = 0.9;
        // Ombres : ortho caméra ±500 comme la version Three (mapSize 1024, near 50, far 1500)
        sunLight.orthoLeft = -500;
        sunLight.orthoRight = 500;
        sunLight.orthoTop = 500;
        sunLight.orthoBottom = -500;
        sunLight.shadowMinZ = 50;
        sunLight.shadowMaxZ = 1500;
        this._shadowGen = new BABYLON.ShadowGenerator(1024, sunLight);
        this._shadowGen.usePoissonSampling = true; // adoucissement des ombres (≈ PCFSoftShadowMap)
        // v3.6 PERF : la shadow map n'est re-rasterisée QUE quand la géométrie
        // émettrice change (édition, génération, sink). Entre deux éditions,
        // l'orbite caméra ne rejoue plus la passe d'ombre (elle coûtait une
        // rasterisation complète du terrain à 60 FPS).
        {
            const sm = this._shadowGen.getShadowMap();
            if (sm && BABYLON.RenderTargetTexture &&
                BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE !== undefined) {
                sm.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
            }
        }

        // Lumière d'appoint d'horizon (bleutée) ≈ HemisphereLight(0x38bdf8, 0x1e293b, 0.35)
        const hemiLight = new BABYLON.HemisphericLight('hemiLight', new BABYLON.Vector3(0, 1, 0), this.scene);
        hemiLight.diffuse = BABYLON.Color3.FromHexString('#38bdf8');
        hemiLight.groundColor = BABYLON.Color3.FromHexString('#1e293b');
        hemiLight.specular = new BABYLON.Color3(0, 0, 0);
        hemiLight.intensity = 0.35;

        // 4. ZOOM TRAVERSANT (fix "impossible de continuer à zoomer") :
        // le dolly est multiplicatif autour d'une cible FIXE : près de la cible,
        // chaque cran de molette n'avance presque plus. Ici, quand on zoome en
        // étant déjà proche (radius < 30), on POUSSE la cible vers l'avant le
        // long du regard -> zoom sans fin, identique à la version Three.
        this.canvas.addEventListener('wheel', (e) => {
            if (!this.camera) return;
            this._needsRender = true; // la molette change toujours la vue
            if (e.deltaY >= 0) return; // on ne traite que le zoom AVANT
            const dist = this.camera.radius;
            if (dist < 30) {
                // Avance la cible de ~40% de la distance restante (borné)
                const step = Math.max(2, dist * 0.4);
                const dir = this.camera.target.subtract(this.camera.position).normalize();
                this.camera.target.x += dir.x * step;
                this.camera.target.y += dir.y * step;
                this.camera.target.z += dir.z * step;
                this._needsRender = true;
            }
        }, { passive: true });

        // 5. Curseur Pinceau 3D penché selon la pente (anneau + liseré)
        // VISIBILITE : rendu en groupe 1 (depth effacé => toujours visible,
        // ≈ depthTest:false de Three) + depthWrite désactivé + liseré noir.
        this.brushCursor3D = this._buildRingMesh('brushCursor', 0.72, 1.0, 48, '#10b981', 0.95, 2);
        const ringOutline = this._buildRingMesh('brushCursorOutline', 1.0, 1.12, 48, '#000000', 0.7, 1);
        ringOutline.parent = this.brushCursor3D; // hérite position/orientation/échelle
        this.brushCursor3D.isVisible = false;
        this._cursorHex = '#10b981';

        this.init3DInteractiveEvents();

        // NAVIGATION VOL "classique" (ZQSD/WASD + Espace/Ctrl + Maj) sur la caméra orbite
        this._flyKeys = {};
        this._initFlyControls();

        // 6. Gestion du redimensionnement
        window.addEventListener('resize', () => this.resize());

        this.animate();
    }

    /**
     * Construit un anneau plat (XZ, normales +Y) — équivalent de THREE.RingGeometry
     * pivotée de -90°. alphaIndex = ordre de dessin entre transparents (≈ renderOrder).
     */
    _buildRingMesh(name, inner, outer, segments, colorHex, alpha, alphaIndex) {
        const positions = [];
        const indices = [];
        const normals = [];
        for (let i = 0; i < segments; i++) {
            const a0 = (i / segments) * Math.PI * 2;
            const a1 = ((i + 1) / segments) * Math.PI * 2;
            const c0 = Math.cos(a0), s0 = Math.sin(a0);
            const c1 = Math.cos(a1), s1 = Math.sin(a1);
            const base = positions.length / 3;
            positions.push(inner * c0, 0, inner * s0,
                           outer * c0, 0, outer * s0,
                           inner * c1, 0, inner * s1,
                           outer * c1, 0, outer * s1);
            indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
            for (let k = 0; k < 4; k++) normals.push(0, 1, 0);
        }
        const mesh = new BABYLON.Mesh(name, this.scene);
        const vd = new BABYLON.VertexData();
        vd.positions = positions;
        vd.normals = normals;
        vd.indices = indices;
        vd.applyToMesh(mesh);
        const mat = new BABYLON.StandardMaterial(name + 'Mat', this.scene);
        mat.disableLighting = true;                 // ≈ MeshBasicMaterial (non éclairé)
        mat.emissiveColor = BABYLON.Color3.FromHexString(colorHex);
        mat.alpha = alpha;
        mat.disableDepthWrite = true;               // ≈ depthWrite:false
        mat.backFaceCulling = false;                // ≈ THREE.DoubleSide
        mesh.material = mat;
        mesh.renderingGroupId = 1;                  // toujours par-dessus le terrain
        mesh.alphaIndex = alphaIndex || 0;
        mesh.isPickable = false;                    // jamais dans le picking du pinceau
        return mesh;
    }

    /** Terrain présent sous la caméra ? (au moins un chunk construit) */
    _hasTerrain() {
        return !!(this._terrainChunks && this._terrainChunks.length);
    }

    /**
     * Prédicat de picking : uniquement les chunks du terrain (+ la surcouche 1:1).
     * v3.6 : Babylon teste d'abord la BOUNDING BOX de chaque mesh candidat — le
     * rayon n'est donc comparé aux triangles que des 1-2 chunks traversés
     * (≈2-8k triangles à tester au lieu de ~260k sur l'ancien mesh unique).
     */
    _pickPredicate(mesh) {
        const md = mesh.metadata;
        if (!md || mesh.isEnabled() === false) return false;
        return md.terrainChunk === true || md.detail === true;
    }

    _pickTerrain(px, py) {
        if (!this.scene || !this.camera || !this._hasTerrain()) return null;
        const pick = this.scene.pick(px, py, (m) => this._pickPredicate(m), false, this.camera);
        if (pick && pick.hit) return pick;
        return null;
    }

    init3DInteractiveEvents() {
        const dom = this.canvas;

        dom.addEventListener('mousemove', (e) => {
            // Un drag (tout bouton) peut changer la vue même hors éditeur (pan/rotate)
            if (e.buttons !== 0) this._needsRender = true;

            if (!window.map2dInstance || window.map2dInstance.activeTab !== 'editor') {
                if (this.brushCursor3D && this.brushCursor3D.isVisible) {
                    this.brushCursor3D.isVisible = false;
                    this._needsRender = true;
                }
                return;
            }

            const rect = dom.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            this._lastPointerPx = { x: mx, y: my };

            if (!this._hasTerrain()) return;
            const hit = this._pickTerrain(mx, my);

            if (hit) {
                const point = hit.pickedPoint;
                // Normale de face en monde (≈ hit.face.normal de Three)
                let normal = hit.getNormal(true, false);
                if (!normal) normal = new BABYLON.Vector3(0, 1, 0);
                else normal.normalize();

                this.brushCursor3D.isVisible = true;
                const radiusBlocks = window.map2dInstance.brushRadius || 4;
                const scale = 3.5;
                const worldRadius = radiusBlocks * scale;
                this.brushCursor3D.scaling.copyFromFloats(worldRadius, worldRadius, worldRadius);

                // Position : point + normale * 0.6 (évite le z-fighting avec la surface)
                this.brushCursor3D.position.copyFromFloats(
                    point.x + normal.x * 0.6,
                    point.y + normal.y * 0.6,
                    point.z + normal.z * 0.6
                );
                // Orientation : rotation de +Y vers la normale
                // (≈ quaternion.setFromUnitVectors(up, normal) de Three)
                const dot = Math.max(-1, Math.min(1, normal.y)); // up·normal = normal.y
                if (dot > 0.99999) {
                    this.brushCursor3D.rotationQuaternion = BABYLON.Quaternion.Identity();
                } else if (dot < -0.99999) {
                    this.brushCursor3D.rotationQuaternion = BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(1, 0, 0), Math.PI);
                } else {
                    const axis = BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), normal).normalize();
                    this.brushCursor3D.rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, Math.acos(dot));
                }
                this._needsRender = true;

                const tool = window.map2dInstance.activeTool;
                let hexColor = '#ffffff';
                if (tool === 'raise') hexColor = '#10b981';
                else if (tool === 'lower') hexColor = '#ef4444';
                else if (tool === 'smooth') hexColor = '#f59e0b';
                else if (tool === 'flatten') hexColor = '#8b5cf6';
                else if (tool === 'sphere' || tool === 'box') hexColor = '#a78bfa';
                else if (tool === 'eraser') hexColor = '#ec4899';
                else if (tool === 'biome') {
                    const bKey = window.map2dInstance.activeBiome || 'plain';
                    hexColor = this.generator.biomes[bKey]?.color || '#ffffff';
                }
                if (hexColor !== this._cursorHex) {
                    this._cursorHex = hexColor;
                    this.brushCursor3D.material.emissiveColor.copyFrom(BABYLON.Color3.FromHexString(hexColor));
                }

                if (this.isPainting3D) {
                    this.applyBrush3D(point, normal, tool, radiusBlocks, window.map2dInstance.brushIntensity || 15, window.map2dInstance.activeBiome || 'plain');
                }
            } else {
                if (this.brushCursor3D.isVisible) this._needsRender = true;
                this.brushCursor3D.isVisible = false;
            }
        });

        const handleDown = (e) => {
            if (e.button === 0 && window.map2dInstance && window.map2dInstance.activeTab === 'editor' && !e.shiftKey && !e.ctrlKey) {
                // La caméra est déjà « muette » en mode éditeur (updateControlsMode :
                // buttons = []) ; on stoppe quand même la propagation par sécurité
                // (≈ EMPÊCHE ORBITCONTROLS DE TOURNER LA CAMÉRA LORS DU CLIC GAUCHE EN ÉDITEUR)
                e.stopPropagation();
                this.isPainting3D = true;
                this.firstClickH3D = null; // capturé au 1er point touché (outil Aplatir)
                this._stampDone3D = false; // nouvelle pose de forme autorisée
                if (this.generator && typeof this.generator.saveStateForUndo === 'function') {
                    this.generator.saveStateForUndo();
                }
                if (this.brushCursor3D && this.brushCursor3D.isVisible && this._lastPointerPx) {
                    const hit = this._pickTerrain(this._lastPointerPx.x, this._lastPointerPx.y);
                    if (hit) {
                        let n = hit.getNormal(true, false);
                        if (!n) n = new BABYLON.Vector3(0, 1, 0); else n.normalize();
                        this.applyBrush3D(hit.pickedPoint, n, window.map2dInstance.activeTool, window.map2dInstance.brushRadius || 4, window.map2dInstance.brushIntensity || 15, window.map2dInstance.activeBiome || 'plain');
                    }
                }
            }
        };
        dom.addEventListener('pointerdown', handleDown, { capture: true });
        dom.addEventListener('mousedown', handleDown, { capture: true });

        const handleUp = (e) => {
            if (this.isPainting3D) {
                this.isPainting3D = false;
                this.firstClickH3D = null;
                this.updateTerrain();
                if (window.map2dInstance) window.map2dInstance.render();
                if (window.uiManagerInstance) window.uiManagerInstance.updateStatsBar();
            }
        };
        window.addEventListener('pointerup', handleUp, { capture: true });
        window.addEventListener('mouseup', handleUp, { capture: true });
    }

    applyBrush3D(point, normal, tool, radius, intensity, activeBiome) {
        if (!this.generator || !this.generator.grid || !this.generator.grid.length) return;
        const grid = this.generator.grid;
        const resX = grid.length;
        const resZ = grid[0] ? grid[0].length : 0;
        const scale = 3.5;
        const halfSizeX = (resX * scale) / 2;
        const halfSizeZ = (resZ * scale) / 2;

        const centerGx = Math.floor((point.x + halfSizeX) / scale);
        const centerGz = Math.floor((point.z + halfSizeZ) / scale);

        // TAMPONS 3D : sphère / pavé posés une fois par clic
        if (tool === 'sphere' || tool === 'box') {
            if (this._stampDone3D) return;
            this._stampDone3D = true;
            const p = (window.uiManagerInstance && window.uiManagerInstance.stampParams) || { w: 16, d: 16, h: 20, paintBiome: true };
            const ok = this.generator.applyStamp(centerGx, centerGz, tool, p.w, p.d, p.h, p.paintBiome ? activeBiome : null);
            if (ok) {
                // p.w/p.d sont en blocs : la zone modifiée réelle est lastBrushRegion (cellules)
                const reg = this.generator.lastBrushRegion || { gxMin: centerGx - 2, gxMax: centerGx + 2, gzMin: centerGz - 2, gzMax: centerGz + 2 };
                this.updateTerrainRegion(reg.gxMin - 1, reg.gxMax + 1, reg.gzMin - 1, reg.gzMax + 1);
                if (window.map2dInstance) {
                    if (typeof window.map2dInstance.requestRender === 'function') window.map2dInstance.requestRender();
                    else window.map2dInstance.render();
                }
            }
            return;
        }

        // Outil Aplatir : mémorise la hauteur du tout premier point touché du geste
        if (tool === 'flatten' && (this.firstClickH3D === null || this.firstClickH3D === undefined)) {
            if (centerGx >= 0 && centerGx < resX && centerGz >= 0 && centerGz < resZ && grid[centerGx] && grid[centerGx][centerGz]) {
                this.firstClickH3D = grid[centerGx][centerGz].height;
            }
        }

        let modified = false;

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                let dist = Math.sqrt(dx * dx + dz * dz);
                if (dist > radius) continue;

                let gx = centerGx + dx;
                let gz = centerGz + dz;
                if (gx < 0 || gx >= resX || gz < 0 || gz >= resZ) continue;

                let cell = grid[gx][gz];
                let falloff = 1.0 - (dist / (radius + 1));

                let slopeBonus = 1.0;
                if (radius > 0 && normal) {
                    slopeBonus = 1.0 + ((dx * normal.x + dz * normal.z) / radius) * 0.75;
                }
                let step = intensity * falloff * 0.5 * Math.max(0.3, slopeBonus);

                if (tool === 'raise') {
                    cell.height = Math.min(this.generator.config.maxHeight, cell.height + step);
                    cell.isCustomHeight = true;
                    modified = true;
                } else if (tool === 'lower') {
                    cell.height = Math.max(this.generator.config.minHeight, cell.height - step);
                    cell.isCustomHeight = true;
                    modified = true;
                } else if (tool === 'flatten' && this.firstClickH3D !== null && this.firstClickH3D !== undefined) {
                    // v3.1 : mode 100% = niveau exact (voir generator.applyBrush)
                    cell.height = this.generator.config.flattenExact
                        ? Math.round(this.firstClickH3D)
                        : cell.height + (this.firstClickH3D - cell.height) * falloff;
                    cell.isCustomHeight = true;
                    modified = true;
                } else if (tool === 'biome') {
                    // REGLE PRIORITAIRE : respecter les règles de hauteur verrouillées
                    const lockedBy = this.generator.isBiomePaintBlocked ? this.generator.isBiomePaintBlocked(cell.height) : null;
                    if (lockedBy && lockedBy !== activeBiome) continue;
                    cell.biome = activeBiome;
                    cell.isCustomBiome = true;
                    modified = true;
                } else if (tool === 'eraser') {
                    let procH = this.generator.fbmTerrain(cell.worldX, cell.worldZ);
                    procH = Math.round(Math.max(this.generator.config.minHeight, Math.min(this.generator.config.maxHeight, procH)));
                    cell.height = procH;
                    cell.biome = this.generator.assignBiomeProcedural(procH, cell.worldX, cell.worldZ);
                    cell.isCustomHeight = false;
                    cell.isCustomBiome = false;
                    modified = true;
                    if (this.generator.removeCustomEdit) this.generator.removeCustomEdit(cell.worldX, cell.worldZ);
                }

                if (tool !== 'eraser' && modified) {
                    if (this.generator.setCustomEdit) this.generator.setCustomEdit(cell.worldX, cell.worldZ, cell.isCustomHeight ? cell.height : null, cell.isCustomBiome ? cell.biome : null);
                }
            }
        }

        if (tool === 'smooth') {
            let tempH = [];
            for (let gx = Math.max(0, centerGx - radius); gx <= Math.min(resX - 1, centerGx + radius); gx++) {
                tempH[gx] = [];
                for (let gz = Math.max(0, centerGz - radius); gz <= Math.min(resZ - 1, centerGz + radius); gz++) {
                    let sum = 0, cnt = 0;
                    for (let nx = -1; nx <= 1; nx++) {
                        for (let nz = -1; nz <= 1; nz++) {
                            let mx = gx + nx, mz = gz + nz;
                            if (mx >= 0 && mx < resX && mz >= 0 && mz < resZ) {
                                sum += grid[mx][mz].height;
                                cnt++;
                            }
                        }
                    }
                    tempH[gx][gz] = sum / cnt;
                }
            }
            for (let gx = Math.max(0, centerGx - radius); gx <= Math.min(resX - 1, centerGx + radius); gx++) {
                for (let gz = Math.max(0, centerGz - radius); gz <= Math.min(resZ - 1, centerGz + radius); gz++) {
                    let dist = Math.sqrt((gx - centerGx) ** 2 + (gz - centerGz) ** 2);
                    if (dist <= radius) {
                        let cell = grid[gx][gz];
                        cell.height = Math.round(tempH[gx][gz]);
                        cell.isCustomHeight = true;
                        modified = true;
                        if (this.generator.setCustomEdit) this.generator.setCustomEdit(cell.worldX, cell.worldZ, cell.height, cell.isCustomBiome ? cell.biome : null);
                    }
                }
            }
        }

        if (modified) {
            // FIX v3.0 : le pinceau 3D invalide le cache des chunks 1:1 (comme
            // le pinceau 2D), sinon la surcouche se rechargeait depuis le cache périmé.
            const metaW = this.generator.currentGridMeta;
            if (metaW && this.generator.invalidateDetailChunksInRegion &&
                this.generator._detailChunks && this.generator._detailChunks.size) {
                const wx0 = metaW.startWorldX + (centerGx - radius) * metaW.stepX;
                const wx1 = metaW.startWorldX + (centerGx + radius + 1) * metaW.stepX;
                const wz0 = metaW.startWorldZ + (centerGz - radius) * metaW.stepZ;
                const wz1 = metaW.startWorldZ + (centerGz + radius + 1) * metaW.stepZ;
                this.generator.invalidateDetailChunksInRegion(wx0 - 2, wx1 + 2, wz0 - 2, wz1 + 2);
                if (this.clearDetailOverlayInRegion) this.clearDetailOverlayInRegion(wx0 - 2, wx1 + 2, wz0 - 2, wz1 + 2);
            }
            if (!this._lastPaint3DTime || Date.now() - this._lastPaint3DTime > 45) {
                this._lastPaint3DTime = Date.now();
                // v3.6 : chemin chunkisé (rebuild des seuls chunks touchés,
                // smooth ET voxel — plus de fallback « rebuild complet »).
                // +1 : l'outil smooth lit les voisins immédiats de la zone.
                this.updateTerrainRegion(centerGx - radius - 1, centerGx + radius + 1,
                                         centerGz - radius - 1, centerGz + radius + 1);
                if (window.map2dInstance) {
                    if (typeof window.map2dInstance.requestRender === 'function') window.map2dInstance.requestRender();
                    else window.map2dInstance.render();
                }
            }
        }
    }

    /**
     * Gère le redimensionnement du conteneur parent (≈ renderer.setSize + camera.aspect)
     */
    resize() {
        if (!this.container || !this.engine || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        if (width === 0 || height === 0) return;

        this.engine.resize(); // Babylon recalcule taille du buffer + ratio caméra
        this._needsRender = true;
    }

    /**
     * Réinitialise la caméra 3D vers une vue isométrique globale
     */
    resetCamera() {
        if (!this.camera) return;
        const extent = this.generator.config.gridResolution * 2.5;
        this.camera.setTarget(new BABYLON.Vector3(0, this.generator.config.baseY || 80, 0));
        // ArcRotateCamera.setPosition : recalcule alpha/beta/radius depuis la position voulue
        this.camera.setPosition(new BABYLON.Vector3(0, extent * 0.95, extent * 1.1));
        this._needsRender = true;
    }

    /* ============================================================
       COULEURS (v3.6 : zéro allocation au hot-path)
       _biomeRGB : cache hex -> {r,g,b} ; getCellColor écrit dans `out`.
       Avant : 2 à 4 « new BABYLON.Color3 » PAR SOMMET à chaque rebuild
       (65 536 sommets → ~200 000 objets temporaires -> pics de GC).
       ============================================================ */
    _biomeRGB(hex) {
        let c = this._biomeRGBCache.get(hex);
        if (c) return c;
        let r = 0x4a / 255, g = 0xde / 255, b = 0x80 / 255; // '#4ade80' par défaut
        if (typeof hex === 'string' && hex.length === 7 && hex.charCodeAt(0) === 35) {
            const n = parseInt(hex.slice(1), 16);
            if (!isNaN(n)) {
                r = ((n >> 16) & 255) / 255;
                g = ((n >> 8) & 255) / 255;
                b = (n & 255) / 255;
            }
        }
        c = { r: r, g: g, b: b };
        this._biomeRGBCache.set(hex, c);
        return c;
    }

    /**
     * Couleur du biome d'une cellule (avec ombrage selon la hauteur), écrite
     * dans `out` {r,g,b} (ou dans un nouvel objet si non fourni — compat API).
     * GRADIENT DE BIOMES : si grid/gx/gz sont fournis et qu'un voisin (rayon 2)
     * a un biome différent, les couleurs sont mélangées (moyenne pondérée par
     * la distance) — transition progressive identique à la carte 2D.
     */
    getCellColor(cell, grid, gx, gz, out) {
        out = out || { r: 0, g: 0, b: 0 };
        const sea = (this.generator && this.generator.config) ? this.generator.config.seaLevel : -Infinity;
        const biomeObj = (this.generator && this.generator.biomes && this.generator.biomes[cell.biome]) || null;
        const base = this._biomeRGB(biomeObj ? biomeObj.color : '#4ade80');
        out.r = base.r; out.g = base.g; out.b = base.b;

        // Pas de mélange de biomes sous l'eau → sable pur (pas de vert qui bave).
        if (cell.height > sea && grid && gx !== undefined && gz !== undefined) {
            const resX = grid.length, resZ = grid[0] ? grid[0].length : 0;
            let hasDiff = false;
            for (let dx = -1; dx <= 1 && !hasDiff; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const nx = gx + dx, nz = gz + dz;
                    if (nx < 0 || nx >= resX || nz < 0 || nz >= resZ) continue;
                    if (grid[nx][nz].biome !== cell.biome) { hasDiff = true; break; }
                }
            }
            if (hasDiff) {
                const R = 2;
                let r = 0, g = 0, b = 0, wSum = 0;
                for (let dx = -R; dx <= R; dx++) {
                    for (let dz = -R; dz <= R; dz++) {
                        const nx = gx + dx, nz = gz + dz;
                        if (nx < 0 || nx >= resX || nz < 0 || nz >= resZ) continue;
                        const d = Math.sqrt(dx * dx + dz * dz);
                        if (d > R) continue;
                        const w = 1 / (1 + d * d);
                        const nc = this._biomeRGB((this.generator.biomes[grid[nx][nz].biome] || {}).color || '#4ade80');
                        r += nc.r * w; g += nc.g * w; b += nc.b * w; wSum += w;
                    }
                }
                out.r = r / wSum; out.g = g / wSum; out.b = b / wSum;
            }
        }

        const maxH = Math.max(1, (this.generator && this.generator.config && this.generator.config.maxHeight) || 400);
        const shade = 0.72 + 0.28 * Math.min(1, Math.max(0, cell.height / maxH));
        out.r *= shade; out.g *= shade; out.b *= shade;
        // MASQUE DE FORME : les cellules hors-forme ne sont pas dessinées
        if (this.generator && this.generator.shapeMask && !this.generator.isInShape(gx, gz)) {
            out.r = -1; out.g = -1; out.b = -1; // signal "skip"
        }
        return out;
    }

    /* ============================================================
       TERRAIN CHUNKISÉ (v3.6)
       Le terrain de base est découpé en chunks de _chunkCells² cellules,
       chacun = 1 mesh Babylon avec sa propre bounding box :
       - frustum culling par chunk (automatique)
       - picking précis accéléré par les bbox
       - updateTerrainRegion = rebuild des seuls chunks intersectés
       Ratio connu (surcoût mémoire négligeable) : les sommets de bordure
       sont dupliqués entre chunks voisins en mode lisse (quads, eux, ne
       sont JAMAIS dupliqués -> aucune surface n'est dessinée deux fois,
       donc aucun z-fighting introduit).
       ============================================================ */

    _getTerrainMaterial() {
        if (!this._terrainMaterial) {
            const material = new BABYLON.StandardMaterial('terrainMat', this.scene);
            material.specularColor = new BABYLON.Color3(0.03, 0.03, 0.03); // ≈ roughness 0.8 (quasi mat)
            material.specularPower = 64;
            // v3.6 : matériau jamais modifié après création -> figé (Babylon saute
            // toutes les vérifications de dirty-check par frame et par mesh).
            material.freeze();
            this._terrainMaterial = material;
        }
        return this._terrainMaterial;
    }

    /**
     * Géométrie LISSE d'un chunk : sous-grille de sommets partagés.
     * entry.x0..x1 / z0..z1 = plage de SOMMETS (incluse) ; les quads couverts
     * sont [x0..x1-1] × [z0..z1-1] et partitionnent exactement la carte.
     * Les NORMALES sont calculées avec un « anneau fantôme » d'1 cellule tout
     * autour (mêmes contributions de faces que sur le mesh global) -> aucune
     * couture d'éclairage aux frontières de chunks.
     */
    _buildSmoothChunkGeometry(entry, grid, resX, resZ, scale, halfSizeX, halfSizeZ) {
        const x0 = entry.x0, x1 = entry.x1, z0 = entry.z0, z1 = entry.z1;
        const nx = x1 - x0 + 1, nz = z1 - z0 + 1;
        const positions = new Float32Array(nx * nz * 3);
        const colors = new Float32Array(nx * nz * 3);
        // (resX-1)² quads au global ; ici ceux du chunk
        const indices = new Uint32Array((x1 - x0) * (z1 - z0) * 6);
        const col = this._colScratch;

        for (let vx = x0; vx <= x1; vx++) {
            const row = grid[vx];
            const lx = vx - x0;
            for (let vz = z0; vz <= z1; vz++) {
                const cell = row[vz];
                const i = (lx * nz + (vz - z0)) * 3;
                positions[i] = vx * scale - halfSizeX;
                positions[i + 1] = cell.height;
                positions[i + 2] = vz * scale - halfSizeZ;
                this.getCellColor(cell, grid, vx, vz, col);
                if (col.r < 0) { positions[i+1] = -99999; } // hors forme → sous le sol
                colors[i] = Math.max(0, col.r); colors[i + 1] = Math.max(0, col.g); colors[i + 2] = Math.max(0, col.b);
            }
        }

        let ii = 0;
        for (let qx = x0; qx < x1; qx++) {
            for (let qz = z0; qz < z1; qz++) {
                const a = (qx - x0) * nz + (qz - z0);
                const b = (qx + 1 - x0) * nz + (qz - z0);
                const c = (qx + 1 - x0) * nz + (qz + 1 - z0);
                const d = (qx - x0) * nz + (qz + 1 - z0);
                // FIX v3.5.2 : winding natif Babylon (CW)
                indices[ii++] = a; indices[ii++] = b; indices[ii++] = d;
                indices[ii++] = b; indices[ii++] = c; indices[ii++] = d;
            }
        }

        // ---- Normales AVEC anneau fantôme (bordures identiques au mesh global) ----
        const ex0 = Math.max(0, x0 - 1), ex1 = Math.min(resX - 1, x1 + 1);
        const ez0 = Math.max(0, z0 - 1), ez1 = Math.min(resZ - 1, z1 + 1);
        const enx = ex1 - ex0 + 1, enz = ez1 - ez0 + 1;
        const extPos = new Float32Array(enx * enz * 3);
        for (let vx = ex0; vx <= ex1; vx++) {
            const row = grid[vx];
            const lx = vx - ex0;
            for (let vz = ez0; vz <= ez1; vz++) {
                const i = (lx * enz + (vz - ez0)) * 3;
                extPos[i] = vx * scale - halfSizeX;
                extPos[i + 1] = row[vz].height;
                extPos[i + 2] = vz * scale - halfSizeZ;
            }
        }
        // quads fantômes : tous ceux ayant ≥1 sommet dans le chunk = [ex0..ex1-1]×[ez0..ez1-1]
        const extIdx = new Uint32Array((ex1 - ex0) * (ez1 - ez0) * 6);
        let ei = 0;
        for (let qx = ex0; qx < ex1; qx++) {
            for (let qz = ez0; qz < ez1; qz++) {
                const a = (qx - ex0) * enz + (qz - ez0);
                const b = (qx + 1 - ex0) * enz + (qz - ez0);
                const c = (qx + 1 - ex0) * enz + (qz + 1 - ez0);
                const d = (qx - ex0) * enz + (qz + 1 - ez0);
                extIdx[ei++] = a; extIdx[ei++] = b; extIdx[ei++] = d;
                extIdx[ei++] = b; extIdx[ei++] = c; extIdx[ei++] = d;
            }
        }
        const extN = this._computeVertexNormals(extPos, extIdx, null);
        // copie des normales des VRAIS sommets depuis la grille étendue
        const normals = new Float32Array(nx * nz * 3);
        for (let vx = x0; vx <= x1; vx++) {
            for (let vz = z0; vz <= z1; vz++) {
                const dst = ((vx - x0) * nz + (vz - z0)) * 3;
                const src = ((vx - ex0) * enz + (vz - ez0)) * 3;
                normals[dst] = extN[src]; normals[dst + 1] = extN[src + 1]; normals[dst + 2] = extN[src + 2];
            }
        }

        return { positions, colors, indices, normals };
    }

    /**
     * Géométrie VOXEL d'un chunk : dessus plat par cellule + jupes verticales
     * vers les voisins plus bas (lues dans la grille GLOBALE -> aucune jupe
     * manquante aux frontières de chunks, aucune face interne inutile émise).
     *
     * v3.6 PERF — ce builder a été mesuré comme le point chaud du pinceau voxel :
     *  1) DEUX PASSES : la 1re compte exactement les quads -> Float32Array
     *     dimensionnés pile (avant : ~500 000 push() + conversions par rebuild) ;
     *  2) NORMALES ANALYTIQUES écrites à l'émission (plateau = +Y, jupes =
     *     ±X/±Z, vérifié par le calcul du produit vectoriel miroir) : on saute
     *     complètement l'accumulation _computeVertexNormals sur ~30k sommets ;
     *  3) indices DÉTERMINISTES (chaque quad émet 6 sommets non partagés dans
     *     le même ordre) remplis en O(n) sans lecture de géométrie.
     * Le résultat binaire est strictement identique à l'ancien chemin.
     */
    _buildVoxelChunkGeometry(entry, grid, resX, resZ, scale, halfSizeX, halfSizeZ) {
        const col = this._colScratch, side = this._sideScratch;

        // ---- PASSE 1 : comptage exact (mêmes conditions qu'à l'émission) ----
        let quadCount = 0;
        for (let gx = entry.x0; gx < entry.x1; gx++) {
            const row = grid[gx];
            for (let gz = entry.z0; gz < entry.z1; gz++) {
                const h = row[gz].height;
                quadCount++; // dessus
                if (gx + 1 < resX && grid[gx + 1][gz].height < h) quadCount++;
                if (gx - 1 >= 0 && grid[gx - 1][gz].height < h) quadCount++;
                if (gz + 1 < resZ && grid[gx][gz + 1].height < h) quadCount++;
                if (gz - 1 >= 0 && grid[gx][gz - 1].height < h) quadCount++;
            }
        }
        const positions = new Float32Array(quadCount * 18);
        const colors = new Float32Array(quadCount * 18);
        const normals = new Float32Array(quadCount * 18);
        const indices = new Uint32Array(quadCount * 6);
        const cellRanges = new Map(); // 'gx,gz' -> {s, e} (offsets float locaux, pour le sink)

        // Indices déterministes : quad q -> triangles (v0,v2,v1) et (v0,v3,v2)
        // (FIX v3.5.2 : winding natif Babylon), base = 6q.
        for (let q = 0, o = 0; q < quadCount; q++) {
            const base = q * 6;
            indices[o++] = base;     indices[o++] = base + 2; indices[o++] = base + 1;
            indices[o++] = base + 3; indices[o++] = base + 5; indices[o++] = base + 4;
        }

        let p = 0; // curseur float (positions/colors/normales partagent le même layout)
        const emitQuad = (v0, v1, v2, v3, nx, ny, nz, cr, cg, cb) => {
            let o = p;
            positions[o]     = v0[0]; positions[o + 1]  = v0[1]; positions[o + 2]  = v0[2];
            positions[o + 3] = v1[0]; positions[o + 4]  = v1[1]; positions[o + 5]  = v1[2];
            positions[o + 6] = v2[0]; positions[o + 7]  = v2[1]; positions[o + 8]  = v2[2];
            positions[o + 9]  = v0[0]; positions[o + 10] = v0[1]; positions[o + 11] = v0[2];
            positions[o + 12] = v2[0]; positions[o + 13] = v2[1]; positions[o + 14] = v2[2];
            positions[o + 15] = v3[0]; positions[o + 16] = v3[1]; positions[o + 17] = v3[2];
            for (let k = 0; k < 6; k++) {
                const n3 = o + k * 3;
                normals[n3] = nx; normals[n3 + 1] = ny; normals[n3 + 2] = nz;
                colors[n3] = cr; colors[n3 + 1] = cg; colors[n3 + 2] = cb;
            }
            p += 18;
        };

        for (let gx = entry.x0; gx < entry.x1; gx++) {
            const row = grid[gx];
            for (let gz = entry.z0; gz < entry.z1; gz++) {
                const cell = row[gz];
                const _cellStart = p;
                const h = cell.height;
                const x0w = gx * scale - halfSizeX;
                const x1w = x0w + scale;
                const z0w = gz * scale - halfSizeZ;
                const z1w = z0w + scale;
                this.getCellColor(cell, grid, gx, gz, col);
                if (col.r < 0) continue; // hors forme → cellule invisible
                side.r = col.r * 0.78; side.g = col.g * 0.78; side.b = col.b * 0.78;

                // Face du dessus (plateau plat) — normale analytique +Y
                emitQuad([x0w, h, z0w], [x0w, h, z1w], [x1w, h, z1w], [x1w, h, z0w],
                         0, 1, 0, col.r, col.g, col.b);

                // Jupes verticales UNIQUEMENT vers un voisin PLUS BAS
                // (faces cachées entre cellules = jamais générées)
                if (gx + 1 < resX) {
                    const nh = grid[gx + 1][gz].height;
                    if (nh < h) emitQuad([x1w, h, z0w], [x1w, h, z1w], [x1w, nh, z1w], [x1w, nh, z0w],
                                         1, 0, 0, side.r, side.g, side.b); // normale +X (vérifié)
                }
                if (gx - 1 >= 0) {
                    const nh = grid[gx - 1][gz].height;
                    if (nh < h) emitQuad([x0w, h, z1w], [x0w, h, z0w], [x0w, nh, z0w], [x0w, nh, z1w],
                                         -1, 0, 0, side.r, side.g, side.b); // normale -X (vérifié)
                }
                if (gz + 1 < resZ) {
                    const nh = grid[gx][gz + 1].height;
                    if (nh < h) emitQuad([x1w, h, z1w], [x0w, h, z1w], [x0w, nh, z1w], [x1w, nh, z1w],
                                         0, 0, 1, side.r, side.g, side.b); // normale +Z (vérifié)
                }
                if (gz - 1 >= 0) {
                    const nh = grid[gx][gz - 1].height;
                    if (nh < h) emitQuad([x0w, h, z0w], [x1w, h, z0w], [x1w, nh, z0w], [x0w, nh, z0w],
                                         0, 0, -1, side.r, side.g, side.b); // normale -Z (vérifié)
                }
                cellRanges.set(gx + ',' + gz, { s: _cellStart, e: p });
            }
        }

        return { positions, colors, indices, normals, cellRanges };
    }

    /**
     * Calcul des normales par accumulation de faces avec le produit vectoriel
     * MIROIR (adapté au winding natif Babylon depuis le fix v3.5.2).
     * Résultat numérique IDENTIQUE à la version Three pour les mêmes sommets.
     */
    _computeVertexNormals(positions, indices, normals) {
        const n = normals || new Float32Array(positions.length);
        for (let i = 0; i < n.length; i++) n[i] = 0;
        for (let t = 0; t < indices.length; t += 3) {
            const i0 = indices[t] * 3, i1 = indices[t + 1] * 3, i2 = indices[t + 2] * 3;
            const ax = positions[i0], ay = positions[i0 + 1], az = positions[i0 + 2];
            const bx = positions[i1], by = positions[i1 + 1], bz = positions[i1 + 2];
            const cx = positions[i2], cy = positions[i2 + 1], cz = positions[i2 + 2];
            const cbx = cx - bx, cby = cy - by, cbz = cz - bz;
            const abx = ax - bx, aby = ay - by, abz = az - bz;
            const nx = aby * cbz - abz * cby;   // n = ab × cb (miroir du cb × ab de Three)
            const ny = abz * cbx - abx * cbz;
            const nz = abx * cby - aby * cbx;
            n[i0] += nx; n[i0 + 1] += ny; n[i0 + 2] += nz;
            n[i1] += nx; n[i1 + 1] += ny; n[i1 + 2] += nz;
            n[i2] += nx; n[i2 + 1] += ny; n[i2 + 2] += nz;
        }
        for (let i = 0; i < n.length; i += 3) {
            const l = Math.sqrt(n[i] * n[i] + n[i + 1] * n[i + 1] + n[i + 2] * n[i + 2]) || 1;
            n[i] /= l; n[i + 1] /= l; n[i + 2] /= l;
        }
        return n;
    }

    /** Ré-arme la passe d'ombre (render-once) après un changement de géométrie. */
    _requestShadowRefresh() {
        if (!this._shadowGen) return;
        const sm = this._shadowGen.getShadowMap();
        if (sm && typeof sm.resetRefreshCounter === 'function') sm.resetRefreshCounter();
    }

    /** Construit (ou reconstruit) LE mesh d'un chunk à partir de la grille vivante. */
    _buildChunkEntry(entry) {
        const grid = this.generator.grid;
        const meta = this._geomMeta;
        const isVoxel = meta.meshType === 'voxel';

        // 1. Géométrie CPU
        const data = isVoxel
            ? this._buildVoxelChunkGeometry(entry, grid, meta.resX, meta.resZ, meta.scale, meta.halfSizeX, meta.halfSizeZ)
            : this._buildSmoothChunkGeometry(entry, grid, meta.resX, meta.resZ, meta.scale, meta.halfSizeX, meta.halfSizeZ);
        entry.positions = data.positions;
        entry.colors = data.colors;
        entry.indices = data.indices;
        entry.normals = data.normals;

        // 2. Ancien mesh -> poubelle
        this._disposeChunkMeshEntry(entry, true);

        // 3. Mesh Babylon (buffers updatable : le sink voxel réécrit les Y en place)
        const mesh = new BABYLON.Mesh('terrainChunk_' + entry.cx + '_' + entry.cz, this.scene);
        const vd = new BABYLON.VertexData();
        vd.positions = data.positions;
        vd.colors = data.colors;
        vd.indices = data.indices;
        vd.normals = data.normals;
        vd.applyToMesh(mesh, true);
        mesh.material = this._getTerrainMaterial(); // partagé + figé
        mesh.receiveShadows = true;
        mesh.isPickable = true;
        mesh.metadata = { terrainChunk: true };
        mesh.refreshBoundingInfo(true);             // picking précis dès maintenant
        mesh.freezeWorldMatrix();                   // transform identité à tout jamais
        if (this._shadowGen) this._shadowGen.getShadowMap().renderList.push(mesh);
        entry.mesh = mesh;
        entry.built = true;
        this._dbg.chunkBuilds++;

        // 4. Wireframe optionnel (arrays partagées comme avant)
        if (this.showWireframe) {
            const wire = new BABYLON.Mesh('terrainChunkWire_' + entry.cx + '_' + entry.cz, this.scene);
            const wvd = new BABYLON.VertexData();
            wvd.positions = data.positions;
            wvd.indices = data.indices;
            wvd.normals = data.normals;
            wvd.applyToMesh(wire, true);
            if (!this._wireMaterial) {
                const wireMat = new BABYLON.StandardMaterial('terrainWireMat', this.scene);
                wireMat.wireframe = true;
                wireMat.disableLighting = true;
                wireMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
                wireMat.alpha = 0.15;
                wireMat.freeze();
                this._wireMaterial = wireMat;
            }
            wire.material = this._wireMaterial;
            wire.isPickable = false;
            wire.freezeWorldMatrix();
            entry.wire = wire;
        }

        // 5. Sink (voxel) : les buffers neufs ont des hauteurs FRAÎCHES -> les
        // entrées sunk de ce chunk sont périmées, on les purge (re-synchronisé
        // juste après par _syncCoarseSink si la surcouche est toujours active).
        if (this._sunkCells && this._sunkCells.size) {
            const dead = [];
            this._sunkCells.forEach((v, k) => { if (v.cx === entry.cx && v.cz === entry.cz) dead.push(k); });
            for (let i = 0; i < dead.length; i++) this._sunkCells.delete(dead[i]);
        }
        if (entry.sunkFull) { entry.sunkFull = false; mesh.setEnabled(true); }

        // 6. Plages de cellules voxel (sink par cellule) -> fusion dans la Map globale
        if (isVoxel && data.cellRanges) {
            if (entry.rangeKeys) {
                for (let i = 0; i < entry.rangeKeys.length; i++) this._cellRanges.delete(entry.rangeKeys[i]);
            }
            const keys = [];
            data.cellRanges.forEach((range, key) => {
                this._cellRanges.set(key, { entry: entry, s: range.s, e: range.e });
                keys.push(key);
            });
            entry.rangeKeys = keys;
        }

        this._requestShadowRefresh();
        this._needsRender = true;
    }

    /** Détruit le mesh d'un chunk (géométrie comprise) + son wireframe éventuel. */
    _disposeChunkMeshEntry(entry, keepBuffers) {
        if (entry.wire) { entry.wire.dispose(); entry.wire = null; }
        if (entry.mesh) {
            if (this._shadowGen) {
                const rl = this._shadowGen.getShadowMap().renderList;
                const i = rl.indexOf(entry.mesh);
                if (i >= 0) rl.splice(i, 1);
            }
            entry.mesh.dispose(); // dispose aussi la géométrie
            entry.mesh = null;
        }
        if (!keepBuffers) {
            entry.positions = entry.colors = entry.indices = entry.normals = null;
        }
    }

    _disposeTerrainMeshes() {
        this._chunkBuildQueue = [];
        if (this._terrainChunks) {
            for (let i = 0; i < this._terrainChunks.length; i++) {
                this._disposeChunkMeshEntry(this._terrainChunks[i], false);
            }
        }
        this._terrainChunks = [];
        this._chunkIndex = new Map();
        this._cellRanges = new Map();
        this._sunkCells = new Map();
        // la surcouche 1:1 est bâtie au-dessus du terrain -> périmée elle aussi
        this.clearDetailOverlay();
    }

    /**
     * Budget de construction par frame (~7 ms par défaut) : les chunks de la
     * file sont construits progressivement, sans jamais geler l'interface.
     */
    _processChunkBuildQueue(budgetMs) {
        if (!this._chunkBuildQueue || this._chunkBuildQueue.length === 0) return;
        const budget = budgetMs === undefined ? 7 : budgetMs;
        const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        const now = () => ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now());
        let built = 0;
        while (this._chunkBuildQueue.length) {
            const entry = this._chunkBuildQueue[0];
            // obsolète (re-génération entre-temps) ou déjà construit -> on saute
            if (!entry || entry.built || this._chunkIndex.get(entry.cx + ',' + entry.cz) !== entry) {
                this._chunkBuildQueue.shift();
                continue;
            }
            if (built > 0 && now() - t0 >= budget) break;
            this._chunkBuildQueue.shift();
            this._buildChunkEntry(entry);
            built++;
            if (now() - t0 >= 16) break; // garde-fou absolu, même si chaque chunk est lent
        }
        if (this._chunkBuildQueue.length === 0) this._syncCoarseSink();
        this._needsRender = true;
    }

    /** Vide la file immédiatement (tests headless, exports synchrones). */
    _flushChunkBuilds() {
        let guard = 100000;
        while (this._chunkBuildQueue && this._chunkBuildQueue.length && guard-- > 0) {
            this._processChunkBuildQueue(1e12);
        }
    }

    updateTerrain() {
        if (!this.scene || !this.generator.grid || this.generator.grid.length === 0) return;
        // VUE UNIQUE : ne pas reconstruire un mesh invisible (vue 2D affichée).
        // Le rebuild est rattrapé au basculement vers la 3D (voir ui.js switchView).
        if (this.container && this.container.offsetParent === null) {
            this._terrainDirty = true;
            return;
        }
        this._terrainDirty = false;

        // Nettoyage de l'ancien terrain chunkisé
        this._disposeTerrainMeshes();
        if (this.waterMesh) {
            this.waterMesh.material.dispose();
            this.waterMesh.dispose();
            this.waterMesh = null;
        }

        const grid = this.generator.grid;
        const resX = grid.length;
        const resZ = grid[0] ? grid[0].length : 0;
        const scale = 3.5; // Facteur d'échelle pour un bon rendu dans l'espace 3D
        const halfSizeX = (resX * scale) / 2;
        const halfSizeZ = (resZ * scale) / 2;
        const isVoxel = this.generator.config.meshType === 'voxel';

        // Meta de layout : invalide la maj partielle si la grille change
        this._geomMeta = {
            resX: resX, resZ: resZ, scale: scale,
            halfSizeX: halfSizeX, halfSizeZ: halfSizeZ,
            meshType: this.generator.config.meshType
        };

        // ---- Découpage en chunks ----
        // lisse : les chunks partitionnent les QUADS (resX-1) avec sommets de bord
        // partagés (plage inclusive x0..x1) ; voxel : les chunks partitionnent les
        // CELLULES (resX), jupes lues dans la grille globale.
        const CS = this._chunkCells | 0 || 32;
        const spanX = isVoxel ? resX : resX - 1;
        const spanZ = isVoxel ? resZ : resZ - 1;
        const ncx = Math.max(1, Math.ceil(spanX / CS));
        const ncz = Math.max(1, Math.ceil(spanZ / CS));
        const entries = [];
        for (let cx = 0; cx < ncx; cx++) {
            for (let cz = 0; cz < ncz; cz++) {
                const x0 = cx * CS, z0 = cz * CS;
                const x1 = isVoxel ? Math.min((cx + 1) * CS, resX) : Math.min((cx + 1) * CS, resX - 1);
                const z1 = isVoxel ? Math.min((cz + 1) * CS, resZ) : Math.min((cz + 1) * CS, resZ - 1);
                if (x1 <= x0 || z1 <= z0) continue;
                const entry = {
                    cx: cx, cz: cz, x0: x0, x1: x1, z0: z0, z1: z1,
                    mesh: null, wire: null, built: false, sunkFull: false,
                    positions: null, colors: null, indices: null, normals: null
                };
                entries.push(entry);
                this._chunkIndex.set(cx + ',' + cz, entry);
            }
        }
        this._terrainChunks = entries;

        // PRIORITÉ AU POINT REGARDÉ : construction triée par distance chunk -> cible
        // caméra (« charger autour du regard/du curseur »). La file est ensuite
        // consommée par budget de ~7 ms/frame dans animate().
        {
            const cam = this.camera;
            const tx = cam ? cam.target.x : 0, tz = cam ? cam.target.z : 0;
            for (let i = 0; i < entries.length; i++) {
                const e = entries[i];
                const wx = ((e.x0 + e.x1) / 2) * scale - halfSizeX;
                const wz = ((e.z0 + e.z1) / 2) * scale - halfSizeZ;
                e._prio = (wx - tx) * (wx - tx) + (wz - tz) * (wz - tz);
            }
            entries.sort((a, b) => a._prio - b._prio);
        }
        this._chunkBuildQueue = entries.slice();
        // Burst synchrone initial (~8 ms) : le centre de l'écran apparaît
        // immédiatement, la périphérie suit en quelques frames.
        this._processChunkBuildQueue(8);

        // Plan d'eau (CreateGround, déjà à plat en XZ)
        if (this.generator.config.showWater) {
            const waterGeom = BABYLON.MeshBuilder.CreateGround('water', {
                width: resX * scale,
                height: resZ * scale,
                subdivisions: 1,
                updatable: false
            }, this.scene);
            const waterMat = new BABYLON.StandardMaterial('waterMat', this.scene);
            waterMat.diffuseColor = BABYLON.Color3.FromHexString('#0ea5e9');
            waterMat.specularColor = new BABYLON.Color3(0.25, 0.25, 0.25); // reflets légers
            waterMat.alpha = 0.65; // ≈ transparent+opacity (blending auto quand alpha < 1)
            // Plan natif Babylon : double-face par sécurité (coût nul, 2 triangles).
            waterMat.backFaceCulling = false;
            waterMat.freeze(); // jamais modifié ensuite
            waterGeom.material = waterMat;
            // +0.35 : évite le z-fighting avec le terrain qui affleure exactement
            // au niveau de la mer
            waterGeom.position.y = this.generator.config.seaLevel + 0.35;
            waterGeom.receiveShadows = true;
            waterGeom.isPickable = false; // le picking du pinceau ne vise que le terrain
            waterGeom.freezeWorldMatrix(); // plan statique
            this.waterMesh = waterGeom;
        }

        this._needsRender = true;
    }

    /**
     * Mise à jour PARTIELLE du terrain 3D (coups de pinceau localisés).
     * v3.6 : reconstruit UNIQUEMENT les chunks intersectant la zone élargie,
     * en SMOOTH comme en VOXEL (avant : updateVerticesData global en smooth,
     * rebuild COMPLET de la carte en voxel à chaque coup de pinceau).
     * Zone élargie de +2 cellules (mélange de couleurs de biomes) — identique à avant.
     */
    updateTerrainRegion(gxMin, gxMax, gzMin, gzMax) {
        // VUE UNIQUE : section 3D cachée -> on note juste que le mesh est périmé
        if (this.container && this.container.offsetParent === null) {
            this._terrainDirty = true;
            return;
        }
        const grid = this.generator && this.generator.grid;
        const meta = this._geomMeta;
        // Garde-fous : pas de terrain, meta absent/obsolète, grille redimensionnée
        // ou type de mesh changé -> rebuild complet classique.
        if (!grid || !grid.length || !meta || !this._terrainChunks.length ||
            meta.meshType !== this.generator.config.meshType ||
            grid.length !== meta.resX || (grid[0] ? grid[0].length : 0) !== meta.resZ) {
            this.updateTerrain();
            return;
        }

        // Marge de 2 cellules pour le mélange de couleurs aux frontières de biomes
        const M = 2;
        const x0 = Math.max(0, Math.floor(gxMin) - M);
        const x1 = Math.min(meta.resX - 1, Math.ceil(gxMax) + M);
        const z0 = Math.max(0, Math.floor(gzMin) - M);
        const z1 = Math.min(meta.resZ - 1, Math.ceil(gzMax) + M);
        if (x0 > x1 || z0 > z1) return;

        const isVoxel = meta.meshType === 'voxel';
        let touched = 0;
        for (let i = 0; i < this._terrainChunks.length; i++) {
            const entry = this._terrainChunks[i];
            // voxel : plage de cellules [x0,x1) ; lisse : plage de sommets [x0..x1]
            const hit = isVoxel
                ? (x0 < entry.x1 && x1 >= entry.x0 && z0 < entry.z1 && z1 >= entry.z0)
                : (x1 >= entry.x0 && x0 <= entry.x1 && z1 >= entry.z0 && z0 <= entry.z1);
            if (!hit) continue;
            touched++;
            // chunk encore en file de construction ? _buildChunkEntry le marque
            // 'built', la file le sautera (processeur protégé contre les obsolètes).
            this._buildChunkEntry(entry);
        }
        if (!touched) return;

        // Invalide la surcouche de détail 3D sur la zone peinte (coords monde)
        {
            const gMeta = this.generator.currentGridMeta;
            if (gMeta) {
                const wx0 = gMeta.startWorldX + x0 * gMeta.stepX;
                const wx1 = gMeta.startWorldX + (x1 + 1) * gMeta.stepX;
                const wz0 = gMeta.startWorldZ + z0 * gMeta.stepZ;
                const wz1 = gMeta.startWorldZ + (z1 + 1) * gMeta.stepZ;
                this.clearDetailOverlayInRegion(wx0 - 2, wx1 + 2, wz0 - 2, wz1 + 2);
            }
        }
        // Sink voxel : réappliqué depuis l'état courant (buffers fraîchement reconstruits)
        if (isVoxel) this._syncCoarseSink();
        this._needsRender = true;
    }


    /* ============================================================
       SURCOUCHE DE DÉTAIL 3D (grands mondes, ex. 4000x4000)
       Quand la caméra est proche, des chunks 16x16 blocs à la vraie
       résolution 1:1 (mêmes données que la 2D et l'export, via
       generator.getDetailChunk) sont affichés PAR-DESSUS le mesh
       grossier, UNIQUEMENT dans le rayon visible autour du point
       regardé. Un mesh par chunk -> le frustum culling de Babylon
       ignore automatiquement ce qui sort de l'écran, et rien n'est
       calculé hors du rayon visible. Cache LRU + budget par tick.
       ============================================================ */
    _maybeUpdateDetailOverlay() {
        const now = Date.now();
        if (this._lastDetailCheck && now - this._lastDetailCheck < 120) return;
        this._lastDetailCheck = now;

        const gen = this.generator;
        if (!gen || !gen.needsDetailChunks || !gen.needsDetailChunks() ||
            !this._hasTerrain() || !this.camera || !this._geomMeta) {
            if (this.detailGroup) this.detailGroup.setEnabled(false);
            this._restoreAllSunk();
            return;
        }
        const meta = gen.currentGridMeta;
        if (!meta) return;
        const scale = this._geomMeta.scale || 3.5;
        const halfSizeX = this._geomMeta.halfSizeX, halfSizeZ = this._geomMeta.halfSizeZ;

        // Rayon visible approx. en blocs : distance caméra -> cible, ouverture fov
        // (ArcRotateCamera.radius = distance caméra/cible exacte ; fov déjà en radians)
        const dist = this.camera.radius || this.camera.position.subtract(this.camera.target).length();
        const fov = this.camera.fov || (60 * Math.PI / 180);
        const radiusScene = Math.tan(fov / 2) * dist * 1.7;
        const blocksPerUnit = meta.stepX / scale;
        const radiusBlocks = radiusScene * blocksPerUnit;

        // Deux seuils distincts :
        // - OFF_RADIUS : au-delà, le détail 1:1 serait imperceptible (~<2px/bloc)
        //   -> surcouche masquée, zéro calcul
        // - MAX_RADIUS : rayon de CHARGEMENT clampé (les grands mondes couvrent
        //   vite des centaines de blocs, on détaille en priorité autour de la cible)
        const OFF_RADIUS_BLOCKS = 700;
        const MAX_RADIUS_BLOCKS = 260;
        if (!this.detailGroup) {
            this.detailGroup = new BABYLON.TransformNode('detailGroup', this.scene); // ≈ THREE.Group
            this._detailMeshes = new Map();
            this._detailMeshOrder = [];
        }
        if (radiusBlocks > OFF_RADIUS_BLOCKS) {
            if (this.detailGroup.isEnabled()) { this.detailGroup.setEnabled(false); this._needsRender = true; }
            this._restoreAllSunk();
            return;
        }

        // POINT REGARDÉ (pick) : le rayon central de la caméra est intersecté
        // avec le terrain ; c'est LE point que le joueur regarde. Fallback : la
        // cible caméra si le rayon sort du terrain.
        let lookX, lookZ;
        if (this.canvas) {
            const rect = this.canvas.getBoundingClientRect();
            const pick = this._pickTerrain(rect.width / 2, rect.height / 2);
            if (pick) { lookX = pick.pickedPoint.x; lookZ = pick.pickedPoint.z; }
        }
        if (lookX === undefined) { lookX = this.camera.target.x; lookZ = this.camera.target.z; }
        const wcx = (lookX + halfSizeX) / scale * meta.stepX + meta.startWorldX;
        const wcz = (lookZ + halfSizeZ) / scale * meta.stepZ + meta.startWorldZ;

        // FIX : le terrain grossier (coarse) se construit lui aussi par file
        // budgetée (_chunkBuildQueue). Avant, TOUT chunk coarse encore en file
        // -- même à l'autre bout de la carte -- désactivait la surcouche de
        // détail PARTOUT, y compris pile sous la caméra une fois celle-ci
        // rapprochée. Symptôme rapporté : caméra déplacée puis zoomée -> pas
        // de détail tant qu'un chunk lointain traînait encore en file. On ne
        // bloque plus que si le chunk coarse *sous le point regardé* n'est
        // lui-même pas encore construit (le détail en a besoin comme base).
        if (this._chunkBuildQueue && this._chunkBuildQueue.length > 0) {
            const CS = this._chunkCells | 0 || 32;
            const gx = (wcx - meta.startWorldX) / meta.stepX;
            const gz = (wcz - meta.startWorldZ) / meta.stepZ;
            const localCx = Math.floor(gx / CS), localCz = Math.floor(gz / CS);
            const localEntry = this._chunkIndex.get(localCx + ',' + localCz);
            if (!localEntry || !localEntry.built) {
                if (this.detailGroup) this.detailGroup.setEnabled(false);
                this._restoreAllSunk();
                return;
            }
        }
        this.detailGroup.setEnabled(true);

        const S = gen.detailChunkSize();
        const r = Math.min(radiusBlocks, MAX_RADIUS_BLOCKS);
        const rc = Math.max(1, Math.ceil(r / S)); // rayon en chunks
        const ccx = Math.floor(wcx / S), ccz = Math.floor(wcz / S);

        // PARCOURS EN SPIRALE : le chunk regardé d'abord, puis anneaux concentriques
        // (droite, bas, gauche, haut) -> le détail apparaît là où le joueur regarde
        // et s'étend autour, au lieu d'un balayage ligne par ligne.
        let budget = 32;
        const tryChunk = (cx, cz) => {
            if (budget <= 0) return;
            const key = cx + ',' + cz;
            if (this._detailMeshes.has(key)) return;
            const mesh = this._buildDetailChunkMesh(cx, cz, meta, scale, halfSizeX, halfSizeZ);
            if (!mesh) { this._detailMeshes.set(key, null); this._detailMeshOrder.push(key); return; }
            mesh.parent = this.detailGroup;
            this._detailMeshes.set(key, mesh);
            this._detailMeshOrder.push(key);
            budget--;
            this._needsRender = true;
        };
        tryChunk(ccx, ccz); // centre = point regardé
        for (let ring = 1; ring <= rc && budget > 0; ring++) {
            // bord haut et bas de l'anneau
            for (let dx = -ring; dx <= ring && budget > 0; dx++) {
                tryChunk(ccx + dx, ccz - ring);
                tryChunk(ccx + dx, ccz + ring);
            }
            // bords gauche/droite (sans les coins déjà faits)
            for (let dz = -ring + 1; dz <= ring - 1 && budget > 0; dz++) {
                tryChunk(ccx - ring, ccz + dz);
                tryChunk(ccx + ring, ccz + dz);
            }
        }
        // LRU "spatial" : on n'évince JAMAIS un chunk encore dans le rayon
        // visible (sinon les chunks à l'écran se chassent mutuellement et des
        // gros carrés grossiers ne se remplissent jamais). Le cap s'adapte au
        // rayon courant, et l'éviction ne touche que les chunks hors-zone.
        const cap = Math.max(600, (2 * rc + 3) * (2 * rc + 3));
        if (this._detailMeshOrder.length > cap) {
            let toEvict = this._detailMeshOrder.length - cap;
            const keep = [];
            for (const key of this._detailMeshOrder) {
                const parts = key.split(',');
                const kx = parseInt(parts[0], 10), kz = parseInt(parts[1], 10);
                const inView = Math.max(Math.abs(kx - ccx), Math.abs(kz - ccz)) <= rc + 1;
                if (!inView && toEvict > 0) {
                    toEvict--;
                    const m = this._detailMeshes.get(key);
                    this._detailMeshes.delete(key);
                    if (m) m.dispose(); // dispose mesh + géométrie (matériau partagé conservé)
                } else {
                    keep.push(key);
                }
            }
            this._detailMeshOrder = keep;
        }

        // Enfonce (ou désactive) le terrain grossier sous les chunks 1:1 chargés
        this._syncCoarseSink();
    }

    _buildDetailChunkMesh(cx, cz, meta, scale, halfSizeX, halfSizeZ) {
        const gen = this.generator;
        const chunk = gen.getDetailChunk(cx, cz);
        if (!chunk) return null;
        const S = gen.detailChunkSize();
        const chunkXp = gen.getDetailChunk(cx + 1, cz);
        const chunkZp = gen.getDetailChunk(cx, cz + 1);
        const chunkXZp = gen.getDetailChunk(cx + 1, cz + 1);
        // Voisins OUEST/NORD : nécessaires pour ne PAS dessiner de murs de jupe
        // aux frontières internes de chunks (traits noirs vus en parallèle X/Z)
        const chunkXm = gen.getDetailChunk(cx - 1, cz);
        const chunkZm = gen.getDetailChunk(cx, cz - 1);
        const hAt = (lx, lz) => {
            if (lx < S && lz < S) return chunk.heights[lz * S + lx];
            if (lx >= S && lz < S) return chunkXp ? chunkXp.heights[lz * S + (lx - S)] : chunk.heights[lz * S + (S - 1)];
            if (lx < S && lz >= S) return chunkZp ? chunkZp.heights[(lz - S) * S + lx] : chunk.heights[(S - 1) * S + lx];
            return chunkXZp ? chunkXZp.heights[(lz - S) * S + (lx - S)] : chunk.heights[S * S - 1];
        };
        const bAt = (lx, lz) => {
            const cxx = Math.min(S - 1, lx), czz = Math.min(S - 1, lz);
            return chunk.biomes[czz * S + cxx];
        };
        // Le chunk 1:1 est rendu SOLIDE et OPAQUE au-dessus du mesh grossier
        // (même style que le meshType courant, +LIFT, jupe périphérique).
        // La scène compresse X/Z (1 bloc = scale/stepX unités) mais pas Y :
        // projection du relief à l'échelle CUBIQUE, ancrée sur la surface
        // grossière (bilinéaire, continue entre chunks).
        const LIFT = 0.25;
        const isVoxel = this.generator.config.meshType === 'voxel';
        const maxH = Math.max(1, this.generator.config.maxHeight || 400);
        const pxOf = (wx) => (wx - meta.startWorldX) / meta.stepX * scale - halfSizeX;
        const pzOf = (wz) => (wz - meta.startWorldZ) / meta.stepZ * scale - halfSizeZ;
        const sBlock = scale / meta.stepX; // taille scène d'UN bloc (horizontale = verticale voulue)
        const grid = this.generator.grid;
        const baseAt = (wx, wz) => {
            // hauteur de la surface grossière (bilinéaire)
            const fx = (wx - meta.startWorldX) / meta.stepX - 0.5;
            const fz = (wz - meta.startWorldZ) / meta.stepZ - 0.5;
            const x0i = Math.max(0, Math.min(meta.resX - 1, Math.floor(fx)));
            const z0i = Math.max(0, Math.min(meta.resZ - 1, Math.floor(fz)));
            const x1i = Math.min(meta.resX - 1, x0i + 1);
            const z1i = Math.min(meta.resZ - 1, z0i + 1);
            const tx = Math.max(0, Math.min(1, fx - x0i));
            const tz = Math.max(0, Math.min(1, fz - z0i));
            return grid[x0i][z0i].height * (1 - tx) * (1 - tz) + grid[x1i][z0i].height * tx * (1 - tz) +
                   grid[x0i][z1i].height * (1 - tx) * tz + grid[x1i][z1i].height * tx * tz;
        };
        const yScene = (h, wx, wz) => {
            const b = baseAt(wx, wz);
            return b + (h - b) * sBlock + LIFT;
        };
        // v3.6 : couleurs sans allocation (cache _biomeRGB + scratchs)
        const colS = { r: 0, g: 0, b: 0 }, sideS = { r: 0, g: 0, b: 0 };
        const colorInto = (lx, lz, out) => {
            const base = this._biomeRGB((gen.biomes[bAt(lx, lz)] || {}).color || '#4ade80');
            const shade = 0.72 + 0.28 * Math.min(1, Math.max(0, hAt(lx, lz) / maxH));
            out.r = base.r * shade; out.g = base.g * shade; out.b = base.b * shade;
            return out;
        };

        const positions = [];
        const colors = [];
        const indices = [];
        const pushTri = (ax, ay, az, bx, by, bz, cx2, cy2, cz2, c) => {
            const base = positions.length / 3;
            positions.push(ax, ay, az, bx, by, bz, cx2, cy2, cz2);
            // FIX v3.5.2 : winding natif Babylon (faces cullées sinon)
            indices.push(base, base + 2, base + 1);
            for (let k = 0; k < 3; k++) colors.push(c.r, c.g, c.b);
        };
        const pushQuad = (v0, v1, v2, v3, c) => {
            pushTri(v0[0], v0[1], v0[2], v1[0], v1[1], v1[2], v2[0], v2[1], v2[2], c);
            pushTri(v0[0], v0[1], v0[2], v2[0], v2[1], v2[2], v3[0], v3[1], v3[2], c);
        };

        if (isVoxel) {
            // Style voxel 1:1 : un plateau par BLOC + jupes vers les voisins,
            // hauteurs re-projetées à l'échelle cubique (yScene)
            const stepPx = scale / meta.stepX, stepPz = scale / meta.stepZ;
            // Les hauteurs des chunks sont FLOTTANTES ; le style voxel arrondit
            // localement pour garder de vrais cubes 1:1 alignés, comme l'export.
            const hVox = (lx, lz) => Math.round(hAt(lx, lz));
            for (let lz = 0; lz < S; lz++) {
                for (let lx = 0; lx < S; lx++) {
                    const wx = chunk.x0 + lx, wz = chunk.z0 + lz;
                    const wcx = wx + 0.5, wcz = wz + 0.5;
                    const h = yScene(hVox(lx, lz), wcx, wcz);
                    const x0 = pxOf(wx), x1 = x0 + stepPx;
                    const z0 = pzOf(wz), z1 = z0 + stepPz;
                    const c = colorInto(lx, lz, colS);
                    pushQuad([x0, h, z0], [x0, h, z1], [x1, h, z1], [x1, h, z0], c);
                    const sideC = { r: c.r * 0.78, g: c.g * 0.78, b: c.b * 0.78 };
                    // jupes : hauteurs voisines projetées avec la MEME colonne de base
                    // (continuité assurée par baseAt bilinéaire). La jupe descend
                    // JUSQU'AU voisin réel ; "bottom" ne sert qu'en bord de monde.
                    const bottom = h - Math.max(2.5 * sBlock, LIFT + 2);
                    const nE = lx + 1 <= S ? yScene(hVox(lx + 1, lz), wcx + 1, wcz) : bottom;
                    if (nE < h) pushQuad([x1, h, z0], [x1, h, z1], [x1, nE, z1], [x1, nE, z0], sideC);
                    // OUEST : hauteur réelle du chunk voisin (plus de mur artificiel)
                    const hW = lx - 1 >= 0 ? hVox(lx - 1, lz) : (chunkXm ? Math.round(chunkXm.heights[lz * S + (S - 1)]) : null);
                    const nW = hW === null ? bottom : yScene(hW, wcx - 1, wcz);
                    if (nW < h) pushQuad([x0, h, z1], [x0, h, z0], [x0, nW, z0], [x0, nW, z1], sideC);
                    const nS2 = lz + 1 <= S ? yScene(hVox(lx, lz + 1), wcx, wcz + 1) : bottom;
                    if (nS2 < h) pushQuad([x1, h, z1], [x0, h, z1], [x0, nS2, z1], [x1, nS2, z1], sideC);
                    // NORD : idem
                    const hN = lz - 1 >= 0 ? hVox(lx, lz - 1) : (chunkZm ? Math.round(chunkZm.heights[(S - 1) * S + lx]) : null);
                    const nN = hN === null ? bottom : yScene(hN, wcx, wcz - 1);
                    if (nN < h) pushQuad([x0, h, z0], [x1, h, z0], [x1, nN, z0], [x0, nN, z0], sideC);
                }
            }
        } else {
            // Style lisse 1:1 : grille de quads sur sommets 17x17 (échelle cubique)
            const yV = (lx, lz) => yScene(hAt(lx, lz), chunk.x0 + lx, chunk.z0 + lz);
            for (let lz = 0; lz < S; lz++) {
                for (let lx = 0; lx < S; lx++) {
                    const wx = chunk.x0 + lx, wz = chunk.z0 + lz;
                    const c = colorInto(lx, lz, colS);
                    pushQuad(
                        [pxOf(wx), yV(lx, lz), pzOf(wz)],
                        [pxOf(wx), yV(lx, lz + 1), pzOf(wz + 1)],
                        [pxOf(wx + 1), yV(lx + 1, lz + 1), pzOf(wz + 1)],
                        [pxOf(wx + 1), yV(lx + 1, lz), pzOf(wz)], c);
                }
            }
            // Jupe périphérique UNIQUEMENT en bord de monde : entre chunks
            // adjacents, les sommets de bord sont identiques (cache partagé +
            // base bilinéaire continue), donc aucune jupe n'est nécessaire.
            const drop = 4 + LIFT;
            if (!chunkZm) for (let lx = 0; lx < S; lx++) {
                const wx = chunk.x0 + lx;
                const cN = colorInto(lx, 0, colS);
                sideS.r = cN.r * 0.75; sideS.g = cN.g * 0.75; sideS.b = cN.b * 0.75;
                pushQuad([pxOf(wx), yV(lx, 0), pzOf(chunk.z0)], [pxOf(wx + 1), yV(lx + 1, 0), pzOf(chunk.z0)],
                         [pxOf(wx + 1), yV(lx + 1, 0) - drop, pzOf(chunk.z0)], [pxOf(wx), yV(lx, 0) - drop, pzOf(chunk.z0)], sideS);
            }
            if (!chunkZp) for (let lx = 0; lx < S; lx++) {
                const wx = chunk.x0 + lx;
                const cS = colorInto(lx, S - 1, colS);
                sideS.r = cS.r * 0.75; sideS.g = cS.g * 0.75; sideS.b = cS.b * 0.75;
                pushQuad([pxOf(wx + 1), yV(lx + 1, S), pzOf(chunk.z0 + S)], [pxOf(wx), yV(lx, S), pzOf(chunk.z0 + S)],
                         [pxOf(wx), yV(lx, S) - drop, pzOf(chunk.z0 + S)], [pxOf(wx + 1), yV(lx + 1, S) - drop, pzOf(chunk.z0 + S)], sideS);
            }
            if (!chunkXm) for (let lz = 0; lz < S; lz++) {
                const wz = chunk.z0 + lz;
                const cW = colorInto(0, lz, colS);
                sideS.r = cW.r * 0.75; sideS.g = cW.g * 0.75; sideS.b = cW.b * 0.75;
                pushQuad([pxOf(chunk.x0), yV(0, lz + 1), pzOf(wz + 1)], [pxOf(chunk.x0), yV(0, lz), pzOf(wz)],
                         [pxOf(chunk.x0), yV(0, lz) - drop, pzOf(wz)], [pxOf(chunk.x0), yV(0, lz + 1) - drop, pzOf(wz + 1)], sideS);
            }
            if (!chunkXp) for (let lz = 0; lz < S; lz++) {
                const wz = chunk.z0 + lz;
                const cE = colorInto(S - 1, lz, colS);
                sideS.r = cE.r * 0.75; sideS.g = cE.g * 0.75; sideS.b = cE.b * 0.75;
                pushQuad([pxOf(chunk.x0 + S), yV(S, lz), pzOf(wz)], [pxOf(chunk.x0 + S), yV(S, lz + 1), pzOf(wz + 1)],
                         [pxOf(chunk.x0 + S), yV(S, lz + 1) - drop, pzOf(wz + 1)], [pxOf(chunk.x0 + S), yV(S, lz) - drop, pzOf(wz)], sideS);
            }
        }

        const geom = new BABYLON.VertexData();
        const normals = this._computeVertexNormals(positions, indices, null);
        geom.positions = positions;
        geom.colors = colors;
        geom.normals = normals;
        geom.indices = indices;
        if (!this._detailMaterial) {
            this._detailMaterial = new BABYLON.StandardMaterial('detailMat', this.scene);
            this._detailMaterial.specularColor = new BABYLON.Color3(0.02, 0.02, 0.02); // ≈ roughness 0.85
            this._detailMaterial.specularPower = 64;
            // ≈ polygonOffset -2 : tire le détail vers la caméra, évite le z-fighting
            this._detailMaterial.zOffset = -2;
            this._detailMaterial.zOffsetUnits = -2;
            this._detailMaterial.freeze(); // partagé, jamais modifié ensuite
        }
        const mesh = new BABYLON.Mesh('detailChunk_' + cx + '_' + cz, this.scene);
        geom.applyToMesh(mesh);
        mesh.material = this._detailMaterial;
        mesh.metadata = { detail: true }; // reconnu par le prédicat de picking
        mesh.isPickable = true;
        mesh.freezeWorldMatrix(); // chunk 1:1 statique (disposé/recréé à l'invalidation)
        return mesh;
    }

    clearDetailOverlay() {
        this._restoreAllSunk();
        if (!this.detailGroup) { this._detailMeshes = this._detailMeshes || new Map(); this._detailMeshOrder = this._detailMeshOrder || []; return; }
        for (const [, m] of this._detailMeshes || []) {
            if (m) m.dispose();
        }
        this._detailMeshes = new Map();
        this._detailMeshOrder = [];
        this._needsRender = true;
    }

    /** Invalidation ciblée (coup de pinceau) : zone en coordonnées MONDE (blocs) */
    clearDetailOverlayInRegion(wx0, wx1, wz0, wz1) {
        if (!this._detailMeshes || this._detailMeshes.size === 0) return;
        const S = this.generator.detailChunkSize();
        const cx0 = Math.floor(wx0 / S), cx1 = Math.floor(wx1 / S);
        const cz0 = Math.floor(wz0 / S), cz1 = Math.floor(wz1 / S);
        for (let cx = cx0; cx <= cx1; cx++) {
            for (let cz = cz0; cz <= cz1; cz++) {
                const key = cx + ',' + cz;
                const m = this._detailMeshes.get(key);
                if (m !== undefined) {
                    this._detailMeshes.delete(key);
                    const idx = this._detailMeshOrder.indexOf(key);
                    if (idx !== -1) this._detailMeshOrder.splice(idx, 1);
                    if (m) m.dispose();
                }
            }
        }
        this._syncCoarseSink();
        this._needsRender = true;
    }


    /* ============================================================
       SINK DU TERRAIN GROSSIER (fix "gros cubes au zoom"), v3.6 chunkisé :
       - cellule ENTIÈREMENT couverte par des chunks 1:1 -> y = -10000
         dans le buffer de SON chunk (comme avant, mais buffers locaux) ;
       - NOUVEAU : chunk grossier 100% couvert -> mesh purement DÉSACTIVÉ
         (zéro rasterisation, zéro z-fighting possible).
       Restauration exacte à l'éviction / au dézoom / au clear.
       ============================================================ */
    _syncCoarseSink() {
        if (!this._sunkCells) this._sunkCells = new Map();
        const voxelOk = this._geomMeta && this._geomMeta.meshType === 'voxel' &&
                        this._terrainChunks && this._terrainChunks.length;
        if (!voxelOk || !this._detailMeshes || !this.detailGroup || !this.detailGroup.isEnabled()) {
            this._restoreAllSunk();
            return;
        }
        const gen = this.generator;
        const meta = gen.currentGridMeta;
        if (!meta) { this._restoreAllSunk(); return; }
        const S = gen.detailChunkSize();
        const loaded = new Set();
        this._detailMeshes.forEach((m, key) => { if (m) loaded.add(key); });

        // Cellules dont TOUS les chunks couvrants sont chargés (algorithme inchangé)
        const desired = new Set();
        const seen = new Set();
        loaded.forEach((key) => {
            const p = key.split(',');
            const cx = parseInt(p[0], 10), cz = parseInt(p[1], 10);
            const wx0 = cx * S, wz0 = cz * S;
            const gx0 = Math.floor((wx0 - meta.startWorldX) / meta.stepX);
            const gx1 = Math.floor((wx0 + S - 0.001 - meta.startWorldX) / meta.stepX);
            const gz0 = Math.floor((wz0 - meta.startWorldZ) / meta.stepZ);
            const gz1 = Math.floor((wz0 + S - 0.001 - meta.startWorldZ) / meta.stepZ);
            for (let gx = Math.max(0, gx0); gx <= Math.min(meta.resX - 1, gx1); gx++) {
                for (let gz = Math.max(0, gz0); gz <= Math.min(meta.resZ - 1, gz1); gz++) {
                    const ck = gx + ',' + gz;
                    if (seen.has(ck)) continue;
                    seen.add(ck);
                    const cwx0 = meta.startWorldX + gx * meta.stepX;
                    const cwx1 = meta.startWorldX + (gx + 1) * meta.stepX - 0.001;
                    const cwz0 = meta.startWorldZ + gz * meta.stepZ;
                    const cwz1 = meta.startWorldZ + (gz + 1) * meta.stepZ - 0.001;
                    let full = true;
                    for (let qx = Math.floor(cwx0 / S); qx <= Math.floor(cwx1 / S) && full; qx++) {
                        for (let qz = Math.floor(cwz0 / S); qz <= Math.floor(cwz1 / S); qz++) {
                            if (!loaded.has(qx + ',' + qz)) { full = false; break; }
                        }
                    }
                    if (full) desired.add(ck);
                }
            }
        });

        // Réconciliation PAR CHUNK de base
        for (let e = 0; e < this._terrainChunks.length; e++) {
            const entry = this._terrainChunks[e];
            if (!entry.built || !entry.mesh || !entry.positions) continue;
            const total = (entry.x1 - entry.x0) * (entry.z1 - entry.z0);
            if (total <= 0) continue;

            // Passe 1 : comptage des cellules couvertes dans ce chunk
            let covCount = 0;
            for (let gx = entry.x0; gx < entry.x1; gx++) {
                for (let gz = entry.z0; gz < entry.z1; gz++) {
                    if (desired.has(gx + ',' + gz)) covCount++;
                }
            }

            // Chunk 100% couvert -> DÉSACTIVATION COMPLÈTE (perf + jamais de
            // percement). Les entrées sunk partielles sont CONSERVÉES : elles
            // serviront de sauvegarde à la réactivation partielle.
            if (covCount === total) {
                if (!entry.sunkFull) {
                    entry.sunkFull = true;
                    entry.mesh.setEnabled(false);
                    this._requestShadowRefresh();
                    this._needsRender = true;
                }
                continue;
            }

            if (entry.sunkFull) { entry.sunkFull = false; entry.mesh.setEnabled(true); }

            // Passe 2 : sink / restauration cellule par cellule dans le buffer du chunk
            let changed = false;
            const pos = entry.positions;
            for (let gx = entry.x0; gx < entry.x1; gx++) {
                for (let gz = entry.z0; gz < entry.z1; gz++) {
                    const ck = gx + ',' + gz;
                    if (desired.has(ck)) {
                        if (this._sunkCells.has(ck)) continue;
                        const range = this._cellRanges.get(ck);
                        if (!range || range.entry !== entry) continue;
                        const saved = new Float32Array(Math.ceil((range.e - range.s) / 3));
                        let si = 0;
                        for (let i = range.s + 1; i < range.e; i += 3) { saved[si++] = pos[i]; pos[i] = -10000; }
                        this._sunkCells.set(ck, { cx: entry.cx, cz: entry.cz, saved: saved });
                        changed = true;
                    } else if (this._sunkCells.has(ck)) {
                        this._restoreCell(ck);
                        changed = true;
                    }
                }
            }
            if (changed) {
                entry.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, pos);
                this._requestShadowRefresh();
                this._needsRender = true;
            }
        }
    }

    _restoreCell(ck) {
        const savedEntry = this._sunkCells.get(ck);
        const range = this._cellRanges && this._cellRanges.get(ck);
        if (savedEntry && range && range.entry && range.entry.positions) {
            const pos = range.entry.positions;
            const saved = savedEntry.saved;
            let si = 0;
            for (let i = range.s + 1; i < range.e; i += 3) pos[i] = saved[si++];
        }
        this._sunkCells.delete(ck);
    }

    _restoreAllSunk() {
        // Ré-active les chunks désactivés pour couverture totale
        let anyChange = false;
        if (this._terrainChunks) {
            for (let e = 0; e < this._terrainChunks.length; e++) {
                const entry = this._terrainChunks[e];
                if (entry.sunkFull) {
                    entry.sunkFull = false;
                    if (entry.mesh) entry.mesh.setEnabled(true);
                    anyChange = true;
                }
            }
        }
        if (!this._sunkCells || this._sunkCells.size === 0) {
            if (anyChange) { this._requestShadowRefresh(); this._needsRender = true; }
            return;
        }
        // Restauration groupée par chunk (1 updateVerticesData par chunk touché)
        const touchedEntries = new Set();
        const keys = Array.from(this._sunkCells.keys());
        for (let i = 0; i < keys.length; i++) {
            const ck = keys[i];
            const range = this._cellRanges && this._cellRanges.get(ck);
            this._restoreCell(ck);
            if (range && range.entry && range.entry.mesh) touchedEntries.add(range.entry);
        }
        touchedEntries.forEach((entry) => {
            if (entry.positions) entry.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, entry.positions);
        });
        if (keys.length || anyChange) { this._requestShadowRefresh(); this._needsRender = true; }
    }

        updateControlsMode() {
        if (!this.camera || typeof BABYLON === 'undefined') return;
        const ptrInput = this.camera.inputs && this.camera.inputs.attached
            ? this.camera.inputs.attached.pointers : null;
        if (!ptrInput) return;
        const editorMode = !!(window.map2dInstance && window.map2dInstance.activeTab === 'editor');
        const mode = editorMode ? 'editor' : 'settings';
        if (this._ctrlMode === mode) return; // évite de réallouer les tableaux à chaque frame
        this._ctrlMode = mode;
        if (editorMode) {
            // Éditeur : Bloque totalement le drag caméra (boutons souris désactivés) ;
            // la molette reste active (le wheel input est indépendant de `buttons`).
            ptrInput.buttons = [];
        } else {
            // Paramètres : gauche = rotation, droite = pan (défauts ArcRotateCamera,
            // identiques aux OrbitControls d'origine), molette = zoom.
            ptrInput.buttons = [0, 1, 2];
        }
        this._needsRender = true;
    }

    /* ============================================================
       NAVIGATION VOL CLASSIQUE (v4.3) — ZQSD/WASD + Espace/Ctrl + Maj
       La caméra orbite (ArcRotateCamera) est TRANSLATÉE en déplaçant sa
       cible (le centre d'orbite) : le point de vue avance/recule/strafe/
       monte/descend comme une caméra fly, tout en gardant l'orbite souris.
       Ctrl = descente (et désactive la translation horizontale pour ne pas
       parasiter les raccourcis Ctrl+Z/Y d'annulation).
       ============================================================ */
    _is3DVisible() {
        return !!(this.container && this.container.offsetParent !== null &&
                  this.container.clientWidth > 8 && this.container.clientHeight > 8);
    }
    _normFlyKey(e) {
        // Utilise e.key (caractère réel) comme le Schem Placer — pas e.code
        const k = typeof e.key === 'string' ? e.key.toLowerCase() : '';
        const kb = (typeof localStorage !== 'undefined' && localStorage.getItem('bloxdTools.keyboard')) || 'azerty';
        if (kb === 'qwerty') {
            if (k === 'w') return 'fwd';
            if (k === 'a') return 'left';
        } else {
            if (k === 'z') return 'fwd';
            if (k === 'q') return 'left';
        }
        if (k === 's') return 'back';
        if (k === 'd') return 'right';
        if (e.code === 'Space') return 'up';
        if (e.code === 'ControlLeft' || e.code === 'ControlRight') return 'down';
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') return 'fast';
        return null;
    }
    _initFlyControls() {
        window.addEventListener('keydown', (e) => {
            const tag = (e.target && e.target.tagName) || '';
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            const k = this._normFlyKey(e);
            if (!k) return;
            this._flyKeys[k] = true;
            // évite le scroll de la page quand on vole (Espace) en vue 3D
            if ((k === 'up' || k === 'down') && this._is3DVisible()) e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            const k = this._normFlyKey(e);
            if (k) this._flyKeys[k] = false;
        });
        window.addEventListener('blur', () => { this._flyKeys = {}; });
    }
    _updateFly() {
        if (!this.camera || !this._is3DVisible()) return;
        const k = this._flyKeys || {};
        const ctrl = !!k.down;
        // Ctrl maintenu = descente pure (pas de translation horizontale -> évite
        // d'interférer avec Ctrl+Z/Y pour annuler/rétablir)
        const f = ctrl ? 0 : ((k.fwd ? 1 : 0) - (k.back ? 1 : 0));
        const r = ctrl ? 0 : ((k.right ? 1 : 0) - (k.left ? 1 : 0));
        const u = (k.up ? 1 : 0) - (ctrl ? 1 : 0);
        if (!f && !r && !u) return;

        const radius = this.camera.radius || 100;
        const speed = Math.max(1.5, Math.min(80, radius * 0.015)) * ((k.fast && !ctrl) ? 2.5 : 1);

        // Direction avant (caméra -> cible) projetée sur le plan XZ
        let fx = this.camera.target.x - this.camera.position.x;
        let fz = this.camera.target.z - this.camera.position.z;
        const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
        const rx = -fz, rz = fx; // vecteur droite (right-handed Babylon)

        const dx = fx * f * speed + rx * r * speed;
        const dz = fz * f * speed + rz * r * speed;
        const dy = u * speed;

        // On déplace uniquement la CIBLE : la position de la caméra orbite
        // suit automatiquement (offset radius/alpha/beta conservé).
        const t = this.camera.target;
        t.x += dx; t.y += dy; t.z += dz;

        this._needsRender = true;
    }

    animate() {
        this.animFrameId = requestAnimationFrame(() => this.animate());

        // TACHE 1 : ne consommer NI GPU NI CPU quand le canvas 3D ne peut pas être vu
        // (onglet navigateur caché, section 3D repliée via le splitter, display:none).
        // La boucle rAF reste vivante pour reprendre instantanément au retour.
        const hidden = (typeof document !== 'undefined' && document.hidden) ||
            !this.container || this.container.offsetParent === null ||
            this.container.clientWidth < 8 || this.container.clientHeight < 8;
        if (hidden) {
            this._wasHidden = true;
            return;
        }
        if (this._wasHidden) {
            this._wasHidden = false;
            this._needsRender = true; // premier rendu forcé au retour de visibilité
        }

        this.updateControlsMode();
        this._updateFly();
        // Pas de controls.update() à appeler avec Babylon : l'inertie de la caméra
        // est traitée pendant scene.render() et signale ses changements via
        // onViewMatrixChangedObservable -> _needsRender (chaîne auto-entretenue).
        // v3.6 : construction progressive des chunks de terrain (budget ~7 ms)
        this._processChunkBuildQueue();
        // DETAIL AU ZOOM (grands mondes) : chargement progressif des chunks visibles
        this._maybeUpdateDetailOverlay();

        if ((this._needsRender || this._alwaysRender) && this.scene && this.camera) {
            this._needsRender = false;
            this.scene.render();
        }
    }
}
window.Map3D = Map3D;

/* ──── app ──── */

/**
 * terrain_editor_app.js — INTERFACE & APPLICATION (fusionné)
 * Contient: ui, main
 */

/* ═══════════════════════════════════════════════════════════════ */
/*  ui  */
/* ═══════════════════════════════════════════════════════════════ */

/* ============================================================
   Bloxd Terrain Editor — terrain_editor_ui.js
   Interface : onglets, sliders, presets, palettes, splitters, modale d'export, gabarit Python.
   Chargement : 7/8 — après generator + map2d + map3d (voir <script> dans terrain_editor.html)
   ============================================================ */

            window.safeStorage = window.safeStorage || {
    _data: {},
    getItem(k) {
        try { return window.localStorage.getItem(k); }
        catch (e) { return this._data[k] || null; }
    },
    setItem(k, v) {
        try { window.localStorage.setItem(k, v); }
        catch (e) { this._data[k] = v; }
    },
    removeItem(k) {
        try { window.localStorage.removeItem(k); }
        catch (e) { delete this._data[k]; }
    }
};

/**
 * GIGA PROMPT - Bloxd Terrain Editor
 * Module : terrain_editor_ui.js
 * Rôle : Gestion des événements UI, onglets, séparateurs redimensionnables (splitters), contrôles du formulaire, et export ZIP/Python
 */

class UIManager {
    constructor(generator, map2d, map3d) {
        this.generator = generator;
        this.map2d = map2d;
        this.map3d = map3d;

        this.initTabs();
        this.initSplitters();
        this.initFormControls();
        this.initEditorControls();
        this.initPaletteForm();
        this.initBiomesGrid();
        this.initPresetsAndActions();
        this.initExportModal();
        this.initTeamShareControls();
    }

    /**
     * Gestion de la navigation par onglets (Paramètres / Éditeur)
     */
    initTabs() {
        const btnSettings = document.getElementById('tab-btn-settings');
        const btnEditor = document.getElementById('tab-btn-editor');
        const panelSettings = document.getElementById('panel-settings');
        const panelEditor = document.getElementById('panel-editor');

        const switchTab = (tabName) => {
            if (btnSettings) btnSettings.classList.toggle('active', tabName === 'settings');
            if (btnEditor) btnEditor.classList.toggle('active', tabName === 'editor');
            if (panelSettings) panelSettings.classList.toggle('active', tabName === 'settings');
            if (panelEditor) panelEditor.classList.toggle('active', tabName === 'editor');
            this.map2d.activeTab = tabName;
            if (tabName === 'editor' && typeof this.renderEditorBiomes === 'function') {
                this.renderEditorBiomes();
            }
        };

        if (btnSettings) btnSettings.addEventListener('click', () => switchTab('settings'));
        if (btnEditor) btnEditor.addEventListener('click', () => switchTab('editor'));
        // v4.4 : exposé pour openPaletteForm (passage automatique à l'onglet Éditeur)
        this._switchTab = switchTab;
    }

    /**
     * Séparateurs DRAGGABLE entre les zones (Panel gauche vs Cartes droite, et Map 2D vs Map 3D)
     */
    initSplitters() {
        const mapsArea = document.getElementById('app-maps');
        // 1. Séparateur vertical (Horizontal drag X) entre Panel (gauche) et Maps (droite)
        const vSplitter = document.getElementById('splitter-vertical');
        const panel = document.getElementById('app-panel');

        if (vSplitter && panel && mapsArea) {
            let isResizingX = false;
            vSplitter.addEventListener('mousedown', (e) => {
                isResizingX = true;
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
            });

            window.addEventListener('mousemove', (e) => {
                if (!isResizingX) return;
                const totalWidth = window.innerWidth;
                let newPanelWidth = (e.clientX / totalWidth) * 100;
                newPanelWidth = Math.max(20, Math.min(65, newPanelWidth)); // Clamp entre 20% et 65%

                panel.style.width = `${newPanelWidth}%`;
                mapsArea.style.width = `${100 - newPanelWidth}%`;

                this.map2d.resize();
                this.map3d.resize();
            });

            window.addEventListener('mouseup', () => {
                if (isResizingX) {
                    isResizingX = false;
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                    this.map2d.resize();
                    this.map3d.resize();
                }
            });
        }

        // 2. Séparateur horizontal (Vertical drag Y) entre Map 2D (haut) et Map 3D (bas)
        // TOGGLE VUE 2D/3D : une seule visualisation à la fois dans la zone droite.
        // (Le splitter horizontal a été retiré avec le mode "Focus Écran Dynamique".)
        const map2dSec = document.getElementById('map2d-section');
        const map3dSec = document.getElementById('map3d-section');
        const switchView = (view) => {
            if (!map2dSec || !map3dSec) return;
            const to3d = view === '3d';
            map2dSec.classList.toggle('view-hidden', to3d);
            map3dSec.classList.toggle('view-hidden', !to3d);
            // Resize après le reflow : le canvas caché avait une taille nulle.
            // + rattrapage : si des modifications ont eu lieu pendant que la vue
            // était masquée (_terrainDirty), reconstruire maintenant.
            requestAnimationFrame(() => {
                if (to3d) {
                    this.map3d.resize();
                    if (this.map3d._terrainDirty) this.map3d.updateTerrain();
                } else {
                    this.map2d.resize();
                    this.map2d.render();
                }
            });
        };
        ['btn-view-3d', 'btn-view-3d-b'].forEach(id => {
            const b = document.getElementById(id);
            if (b) b.addEventListener('click', () => switchView('3d'));
        });
        ['btn-view-2d', 'btn-view-2d-b'].forEach(id => {
            const b = document.getElementById(id);
            if (b) b.addEventListener('click', () => switchView('2d'));
        });

        const hSplitter = null; // splitter horizontal supprimé
        if (hSplitter && map2dSec && map3dSec) {
            let isResizingY = false;
            hSplitter.addEventListener('mousedown', (e) => {
                isResizingY = true;
                document.body.style.cursor = 'row-resize';
                document.body.style.userSelect = 'none';
            });

            window.addEventListener('mousemove', (e) => {
                if (!isResizingY || !mapsArea) return;
                const rect = mapsArea.getBoundingClientRect();
                let relY = e.clientY - rect.top;
                let new2DHeight = (relY / rect.height) * 100;
                new2DHeight = Math.max(20, Math.min(80, new2DHeight)); // Clamp entre 20% et 80%

                map2dSec.style.height = `${new2DHeight}%`;
                map3dSec.style.height = `${100 - new2DHeight}%`;

                this.map2d.resize();
                this.map3d.resize();
            });

            window.addEventListener('mouseup', () => {
                if (isResizingY) {
                    isResizingY = false;
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                    this.map2d.resize();
                    this.map3d.resize();
                }
            });
        }
    }

    /**
     * Synchronise les contrôles du formulaire avec generator.config
     */
    initFormControls() {
        const cfg = this.generator.config;

        // Monde
        const inpWidth = document.getElementById('cfg-world-x');
        const inpLength = document.getElementById('cfg-world-z');
        const inpSeed = document.getElementById('cfg-seed');
        const btnRandomSeed = document.getElementById('btn-random-seed');
        const inpBaseY = document.getElementById('cfg-base-y');
        const inpSeaLevel = document.getElementById('cfg-sea-level');

        if (inpWidth) inpWidth.addEventListener('change', (e) => { cfg.worldSizeX = parseInt(e.target.value) || 4000; this.triggerRegeneration(); });
        if (inpLength) inpLength.addEventListener('change', (e) => { cfg.worldSizeZ = parseInt(e.target.value) || 4000; this.triggerRegeneration(); });
        if (inpSeed) inpSeed.addEventListener('change', (e) => { cfg.seed = parseInt(e.target.value) || 1; this.triggerRegeneration(); });
        const chkFlatTerrain = document.getElementById('cfg-flat-terrain');
        if (chkFlatTerrain) chkFlatTerrain.addEventListener('change', () => {
            cfg.flatTerrain = chkFlatTerrain.checked;
            this.triggerRegeneration(true);
        });
        const chkIsland = document.getElementById('cfg-island-mode');
        if (chkIsland) chkIsland.addEventListener('change', () => {
            cfg.islandMode = chkIsland.checked;
            this.triggerRegeneration(true);
        });
        const inpGroundDetail = document.getElementById('cfg-ground-detail');
        if (inpGroundDetail) inpGroundDetail.addEventListener('change', (e) => {
            cfg.groundDetail = parseFloat(e.target.value);
            if (isNaN(cfg.groundDetail)) cfg.groundDetail = 1;
            // Le micro-relief ne touche que les chunks 1:1 et l'export : pas
            // besoin de régénérer la grille, juste d'invalider le détail.
            this.generator.invalidateDetailChunks && this.generator.invalidateDetailChunks();
            if (this.map2d) (this.map2d.requestRender ? this.map2d.requestRender() : this.map2d.render());
            if (this.map3d && this.map3d.clearDetailOverlay) { this.map3d.clearDetailOverlay(); this.map3d._needsRender = true; }
        });
        if (btnRandomSeed) btnRandomSeed.addEventListener('click', () => {
            cfg.seed = Math.floor(Math.random() * 900000) + 10000;
            if (inpSeed) inpSeed.value = cfg.seed;
            this.triggerRegeneration();
        });
        if (inpBaseY) inpBaseY.addEventListener('change', (e) => { cfg.baseY = parseInt(e.target.value) || 70; this.triggerRegeneration(); });
        if (inpSeaLevel) inpSeaLevel.addEventListener('change', (e) => { cfg.seaLevel = parseInt(e.target.value) || 88; this.triggerRegeneration(); });

        // Terrain sliders
        const bindSlider = (id, valId, configKey, isFloat = false) => {
            const slider = document.getElementById(id);
            const valSpan = document.getElementById(valId);
            if (!slider) return;
            slider.addEventListener('input', (e) => {
                const val = isFloat ? parseFloat(e.target.value) : parseInt(e.target.value);
                cfg[configKey] = val;
                if (valSpan) valSpan.textContent = val;
            });
            slider.addEventListener('change', () => this.triggerRegeneration());
        };

        bindSlider('cfg-min-h', 'val-min-h', 'minHeight');
        bindSlider('cfg-max-h', 'val-max-h', 'maxHeight');
        // Avertissement au-delà de 400 (limite conseillée) : export plus lourd
        const maxHSlider = document.getElementById('cfg-max-h');
        const maxHWarn = document.getElementById('max-h-warning');
        if (maxHSlider && maxHWarn) {
            const updWarn = () => { maxHWarn.style.display = parseInt(maxHSlider.value) > 400 ? 'block' : 'none'; };
            maxHSlider.addEventListener('input', updWarn);
            updWarn();
        }
        bindSlider('cfg-noise-scale', 'val-noise-scale', 'noiseScale', true);
        bindSlider('cfg-intensity', 'val-intensity', 'terrainIntensity');
        bindSlider('cfg-roughness', 'val-roughness', 'roughness', true);

        // Boutons overlay 2D
        const btn2dRecadrer = document.getElementById('btn-2d-reset');
        const btn2dRelief = document.getElementById('btn-2d-relief');
        const btn2dGrid = document.getElementById('btn-2d-grid');

        if (btn2dRecadrer) btn2dRecadrer.addEventListener('click', () => this.map2d.resetView());
        if (btn2dRelief) btn2dRelief.addEventListener('click', () => {
            cfg.hillshading = !cfg.hillshading;
            btn2dRelief.classList.toggle('active', cfg.hillshading);
            this.map2d.render();
        });
        if (btn2dGrid) btn2dGrid.addEventListener('click', () => {
            cfg.showGrid = !cfg.showGrid;
            btn2dGrid.classList.toggle('active', cfg.showGrid);
            this.map2d.render();
        });

        // Shape selector
        const selShape = document.getElementById('cfg-shape-mode');
        if (selShape) selShape.addEventListener('change', (e) => {
            cfg.shapeMode = e.target.value;
            if (e.target.value === 'custom') {
                this._openShapePopup();
            } else {
                this.generator.rebuildShapeMask();
                this.map2d.render();
                this.map3d.updateTerrain();
            }
        });

        // Boutons overlay 3D
        const btn3dReset = document.getElementById('btn-3d-reset');
        const btn3dMesh = document.getElementById('btn-3d-mesh');
        const btn3dWater = document.getElementById('btn-3d-water');

        if (btn3dReset) btn3dReset.addEventListener('click', () => this.map3d.resetCamera());
        if (btn3dMesh) btn3dMesh.addEventListener('click', () => {
            cfg.meshType = cfg.meshType === 'voxel' ? 'smooth' : 'voxel';
            this.update3dMeshBtn();
            this.map3d.updateTerrain();
        });
        if (btn3dWater) btn3dWater.addEventListener('click', () => {
            cfg.showWater = !cfg.showWater;
            btn3dWater.classList.toggle('active', cfg.showWater);
            this.map2d.render();
            this.map3d.updateTerrain();
        });
    }

    /**
     * Éléments de contrôle de l'Éditeur (Pinceaux et Sliders)
     */
    initEditorControls() {
        const tools = ['biome', 'raise', 'lower', 'smooth', 'flatten', 'eraser', 'sphere', 'box'];
        tools.forEach((t) => {
            const btn = document.getElementById(`tool-${t}`);
            if (!btn) return;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.map2d.activeTool = t;
                // Panneau tailles visible uniquement pour les formes
                const stampPanel = document.getElementById('stamp-params');
                if (stampPanel) stampPanel.style.display = (t === 'sphere' || t === 'box') ? 'block' : 'none';
                // Panneau Aplatir visible uniquement pour l'outil Aplatir
                const flattenPanel = document.getElementById('flatten-params');
                if (flattenPanel) flattenPanel.style.display = (t === 'flatten') ? 'block' : 'none';
            });
        });

        // Curseurs de taille des formes (sphère / pavé)
        this.stampParams = { w: 16, d: 16, h: 20, paintBiome: true }; // w/d en BLOCS réels
        const bindStamp = (id, valId, key) => {
            const el = document.getElementById(id), val = document.getElementById(valId);
            if (!el) return;
            el.addEventListener('input', (e) => {
                this.stampParams[key] = parseInt(e.target.value);
                if (val) val.textContent = e.target.value;
            });
        };
        bindStamp('stamp-w', 'val-stamp-w', 'w');
        bindStamp('stamp-d', 'val-stamp-d', 'd');
        bindStamp('stamp-h', 'val-stamp-h', 'h');
        const chkFlattenExact = document.getElementById('flatten-exact');
        if (chkFlattenExact) chkFlattenExact.addEventListener('change', () => {
            this.generator.config.flattenExact = chkFlattenExact.checked;
        });
        const chkStampBiome = document.getElementById('stamp-paint-biome');
        if (chkStampBiome) chkStampBiome.addEventListener('change', () => { this.stampParams.paintBiome = chkStampBiome.checked; });

        const sliderRadius = document.getElementById('brush-size');
        const valRadius = document.getElementById('val-brush-size');
        if (sliderRadius) sliderRadius.addEventListener('input', (e) => {
            this.map2d.brushRadius = parseInt(e.target.value);
            if (valRadius) valRadius.textContent = `${e.target.value}${window.t ? window.t('brushSizeVal') : ' cases'}`;
        });

        const sliderIntensity = document.getElementById('brush-intensity');
        const valIntensity = document.getElementById('val-brush-intensity');
        if (sliderIntensity) sliderIntensity.addEventListener('input', (e) => {
            this.map2d.brushIntensity = parseInt(e.target.value);
            if (valIntensity) valIntensity.textContent = e.target.value;
        });
    }

    /**
     * Initialise et rend la grille des biomes
     */
    initBiomesGrid() {
        this.renderSettingsBiomes();
        this.renderEditorBiomes();
    }

    renderSettingsBiomes() {
        const container = document.getElementById('biomes-grid');
        if (!container) return;
        container.innerHTML = '';
        if (this.generator.initBiomeRules) this.generator.initBiomeRules();

        for (let key in this.generator.biomes) {
            const b = this.generator.biomes[key];
            const bName = window.getBiomeName ? window.getBiomeName(key, b) : b.name;
            const rule = b.rule || { active: false, yMin: 0, yMax: 400, locked: false };
            // v4.4 : badge si la palette intégrée a été modifiée par l'utilisateur
            const modBadge = (!b.custom && b.modified)
                ? ` <span class="biome-modified-badge" title="${window.t ? window.t('modifiedTag') : 'modifiée'}">✎</span>`
                : '';
            const card = document.createElement('div');
            card.className = `biome-card ${this.generator.config.defaultBiome === key ? 'active' : ''}`;
            card.innerHTML = `
                <div class="biome-card-header">
                    <span class="biome-color-dot" style="background-color: ${b.color}"></span>
                    <span class="biome-name">${bName}${modBadge}</span>
                    <button type="button" class="biome-edit-btn" title="${window.t ? window.t('editPaletteTip') : 'Modifier cette palette (nom, couleur, blocs)'}">✎</button>
                </div>
                <div class="biome-blocks">
                    ${b.blocks.map(bl => `<span class="block-tag">${bl}</span>`).join('')}
                </div>
                <div class="biome-rule" data-biome="${key}" style="margin-top: 8px; border-top: 1px dashed var(--border-color); padding-top: 6px;">
                    <label style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--text-muted); cursor: pointer;">
                        <input type="checkbox" class="rule-active" ${rule.active ? 'checked' : ''}>
                        <span>${window.t ? window.t('ruleActive') : 'Actif (règle de hauteur)'}</span>
                    </label>
                    <div class="rule-details" style="display: ${rule.active ? 'block' : 'none'}; margin-top: 6px;">
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 5px;">
                            <label style="font-size: 0.75rem; color: var(--text-muted); width: 24px;">Y-</label>
                            <input type="number" class="input-text rule-ymin" value="${rule.yMin}" min="0" max="1000" style="width: 64px; padding: 3px 6px; font-size: 0.8rem;" title="${window.t ? window.t('ruleYMinTip') : 'Couche basse : altitude minimale du biome'}">
                            <label style="font-size: 0.75rem; color: var(--text-muted); width: 24px; margin-left: 8px;">Y+</label>
                            <input type="number" class="input-text rule-ymax" value="${rule.yMax}" min="0" max="1000" style="width: 64px; padding: 3px 6px; font-size: 0.8rem;" title="${window.t ? window.t('ruleYMaxTip') : 'Couche haute : altitude maximale du biome'}">
                        </div>
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--text-muted); cursor: pointer;">
                            <input type="checkbox" class="rule-locked" ${rule.locked ? 'checked' : ''}>
                            <span>🔒 ${window.t ? window.t('ruleLocked') : 'Prioritaire (bloque la peinture)'}</span>
                        </label>
                    </div>
                </div>
            `;

            // Clic sur la carte = choisir le biome par défaut (mais pas sur les contrôles de règle)
            card.addEventListener('click', (e) => {
                if (e.target.closest('.biome-rule')) return;
                document.querySelectorAll('#biomes-grid .biome-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.generator.config.defaultBiome = key;
                this.triggerRegeneration();
            });

            // v4.4 : bouton ✎ = ouvrir le formulaire d'édition de la palette (intégrée ou perso)
            const editBtn = card.querySelector('.biome-edit-btn');
            if (editBtn) editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openPaletteForm(key);
            });

            // ---- Contrôles de la règle ----
            const chkActive = card.querySelector('.rule-active');
            const chkLocked = card.querySelector('.rule-locked');
            const inpMin = card.querySelector('.rule-ymin');
            const inpMax = card.querySelector('.rule-ymax');
            const details = card.querySelector('.rule-details');

            chkActive.addEventListener('change', () => {
                if (this.generator.saveStateForUndo) this.generator.saveStateForUndo();
                b.rule.active = chkActive.checked;
                details.style.display = chkActive.checked ? 'block' : 'none';
                this.triggerRegeneration();
            });
            chkLocked.addEventListener('change', () => {
                b.rule.locked = chkLocked.checked;
            });
            const applyRange = () => {
                let yMin = parseInt(inpMin.value, 10);
                let yMax = parseInt(inpMax.value, 10);
                if (isNaN(yMin)) yMin = 0;
                if (isNaN(yMax)) yMax = 400;
                if (yMin > yMax) { [yMin, yMax] = [yMax, yMin]; inpMin.value = yMin; inpMax.value = yMax; }
                if (this.generator.saveStateForUndo) this.generator.saveStateForUndo();
                b.rule.yMin = yMin;
                b.rule.yMax = yMax;
                this.triggerRegeneration();
            };
            inpMin.addEventListener('change', applyRange);
            inpMax.addEventListener('change', applyRange);

            container.appendChild(card);
        }
    }

    renderEditorBiomes() {
        const container = document.getElementById('editor-biomes-grid');
        if (!container) return;
        container.innerHTML = '';

        for (let key in this.generator.biomes) {
            const b = this.generator.biomes[key];
            const bName = window.getBiomeName ? window.getBiomeName(key, b) : b.name;
            const btn = document.createElement('button');
            btn.className = `editor-biome-btn ${this.map2d.activeBiome === key ? 'active' : ''}`;
            btn.style.borderColor = b.color;
            btn.innerHTML = `
                <span class="color-preview" style="background-color: ${b.color}"></span>
                <span class="name">${bName}</span>
            `;
            btn.addEventListener('click', () => {
                document.querySelectorAll('#editor-biomes-grid .editor-biome-btn').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                this.map2d.activeBiome = key;
            });
            // v4.4 : crayon d'édition de la palette (toutes les palettes, intégrées incluses)
            btn.style.position = 'relative';
            const edit = document.createElement('span');
            edit.textContent = '✎';
            edit.title = window.t ? window.t('editPaletteTip') : 'Modifier cette palette (nom, couleur, blocs)';
            edit.style.cssText = 'position:absolute;top:2px;right:5px;color:#9aa7c7;font-size:0.7rem;cursor:pointer;font-weight:700;';
            edit.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openPaletteForm(key);
            });
            btn.appendChild(edit);
            // Palette personnalisée : croix de suppression
            if (b.custom) {
                const del = document.createElement('span');
                del.textContent = '✕';
                del.title = window.t ? window.t('delPaletteTip') : 'Supprimer cette palette';
                del.style.cssText = 'position:absolute;top:2px;right:18px;color:#ef4444;font-size:0.7rem;cursor:pointer;font-weight:700;';
                del.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!confirm(window.t ? window.t('confirmDelPalette') : 'Supprimer cette palette ? Les zones peintes reviendront au biome par défaut.')) return;
                    if (this.generator.saveStateForUndo) this.generator.saveStateForUndo();
                    this.generator.removeCustomBiome(key);
                    if (this.map2d.activeBiome === key) this.map2d.activeBiome = this.generator.config.defaultBiome || 'plain';
                    // v4.4 : si le formulaire d'édition était ouvert sur cette palette, on le referme
                    if (this._paletteEditKey === key) {
                        this._paletteEditKey = null;
                        this.refreshPaletteFormTitle();
                        const pf = document.getElementById('palette-form');
                        if (pf) pf.style.display = 'none';
                    }
                    this.renderEditorBiomes();
                    this.renderSettingsBiomes();
                    this.triggerRegeneration();
                });
                btn.appendChild(del);
            }
            container.appendChild(btn);
        }
    }

    /**
     * PALETTES : formulaire d'ajout / d'édition (nom, couleur, blocs)
     * v4.4 : sert aussi à éditer les palettes EXISTANTES — intégrées (Plaines, Forêt,
     * Sable…) ou personnalisées — et à restaurer les palettes d'origine.
     */
    initPaletteForm() {
        const btnAdd = document.getElementById('btn-add-palette');
        const form = document.getElementById('palette-form');
        const inpName = document.getElementById('palette-name');
        const inpColor = document.getElementById('palette-color');
        const inpHex = document.getElementById('palette-color-hex');
        const inpBlocks = document.getElementById('palette-blocks');
        const btnSave = document.getElementById('btn-save-palette');
        const btnCancel = document.getElementById('btn-cancel-palette');
        const btnReset = document.getElementById('btn-reset-palette');
        if (!btnAdd || !form) return;

        this._paletteEditKey = null;

        // "🎨 Ajouter ma palette de couleurs" : bascule le formulaire en mode CRÉATION
        btnAdd.addEventListener('click', () => {
            if (form.style.display === 'none') {
                this._paletteEditKey = null;
                this.refreshPaletteFormTitle();
                if (btnReset) btnReset.style.display = 'none';
                if (inpName) inpName.value = '';
                if (inpColor) inpColor.value = '#cc5de8';
                if (inpHex) inpHex.value = '#cc5de8';
                if (inpBlocks) inpBlocks.value = '';
                form.style.display = 'block';
                form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                form.style.display = 'none';
            }
        });
        if (btnCancel) btnCancel.addEventListener('click', () => { form.style.display = 'none'; });
        // Synchronisation pipette <-> champ hexa
        if (inpColor && inpHex) {
            inpColor.addEventListener('input', () => { inpHex.value = inpColor.value; });
            inpHex.addEventListener('change', () => {
                let v = inpHex.value.trim();
                if (!v.startsWith('#')) v = '#' + v;
                if (/^#[0-9a-fA-F]{6}$/.test(v)) inpColor.value = v.toLowerCase();
                inpHex.value = inpColor.value;
            });
        }

        // v4.4 : restaurer les blocs/couleur d'origine d'une palette intégrée
        if (btnReset) btnReset.addEventListener('click', () => {
            if (!this._paletteEditKey) return;
            const b = this.generator.biomes[this._paletteEditKey];
            if (!b || b.custom) return;
            if (!confirm(window.t ? window.t('confirmResetPalette') : "Restaurer les blocs et la couleur d'origine de cette palette ?")) return;
            if (this.generator.resetBiome(this._paletteEditKey)) {
                form.style.display = 'none';
                this.renderEditorBiomes();
                this.renderSettingsBiomes();
                this.triggerRegeneration();
                window.showToast && window.showToast('♻️ ' + (window.t ? window.t('paletteReset') : "Palette d'origine restaurée"));
            }
        });

        if (btnSave) btnSave.addEventListener('click', () => {
            const name = (inpName && inpName.value.trim()) || '';
            if (!name) { alert(window.t ? window.t('errPaletteName') : 'Donne un nom à ta palette !'); return; }
            const color = inpColor ? inpColor.value : '#a78bfa';
            const blocks = (inpBlocks && inpBlocks.value.trim())
                ? inpBlocks.value.split(',').map(s => s.trim()).filter(Boolean)
                : null;
            if (!blocks || !blocks.length) { alert(window.t ? window.t('errPaletteBlocks') : 'Ajoute au moins 1 bloc !'); return; }

            // Nom unique (on exclut la palette en cours d'édition)
            for (let k in this.generator.biomes) {
                if (k === this._paletteEditKey) continue;
                const other = this.generator.biomes[k];
                if (other.name && other.name.toLowerCase() === name.toLowerCase()) {
                    alert(window.t ? window.t('errPaletteExists') : 'Une palette porte déjà ce nom.');
                    return;
                }
            }

            if (this._paletteEditKey) {
                // v4.4 : mode ÉDITION — palette intégrée ou personnalisée
                const key = this._paletteEditKey;
                if (this.generator.saveStateForUndo) this.generator.saveStateForUndo();
                if (!this.generator.updateBiome(key, name, color, blocks)) {
                    alert(window.t ? window.t('errPaletteExists') : 'Palette inconnue.');
                    return;
                }
                form.style.display = 'none';
                this.renderEditorBiomes();
                this.renderSettingsBiomes();
                this.triggerRegeneration();
                window.showToast && window.showToast('✅ ' + (window.t ? window.t('paletteSaved') : 'Palette enregistrée !'));
                return;
            }

            // Mode CRÉATION (comportement d'origine)
            const key = 'custom_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
            if (this.generator.biomes[key]) { alert(window.t ? window.t('errPaletteExists') : 'Une palette porte déjà ce nom.'); return; }
            if (this.generator.saveStateForUndo) this.generator.saveStateForUndo();
            this.generator.addCustomBiome(key, name, color, blocks);
            form.style.display = 'none';
            if (inpName) inpName.value = '';
            if (inpBlocks) inpBlocks.value = '';
            this.renderEditorBiomes();
            this.renderSettingsBiomes();
            this.map2d.activeBiome = key;
            this.renderEditorBiomes();
            window.showToast && window.showToast('🎨 ' + name + (window.t && window.I18N && window.I18N.lang === 'en' ? ' palette added!' : ' ajoutée à tes palettes !'));
        });
    }

    /**
     * v4.4 : ouvre le formulaire de palette en mode ÉDITION pour la palette donnée.
     * Fonctionne pour les biomes intégrés (plain, forest, sand…) ET les biomes personnalisés.
     */
    openPaletteForm(biomeKey) {
        const b = this.generator.biomes[biomeKey];
        const form = document.getElementById('palette-form');
        const inpName = document.getElementById('palette-name');
        const inpColor = document.getElementById('palette-color');
        const inpHex = document.getElementById('palette-color-hex');
        const inpBlocks = document.getElementById('palette-blocks');
        const btnReset = document.getElementById('btn-reset-palette');
        if (!b || !form) return;

        this._paletteEditKey = biomeKey;
        if (inpName) inpName.value = b.name || '';
        if (inpColor) inpColor.value = b.color || '#888888';
        if (inpHex) inpHex.value = b.color || '#888888';
        if (inpBlocks) inpBlocks.value = (b.blocks || []).join(', ');
        this.refreshPaletteFormTitle();
        // Le bouton « restaurer » n'existe que pour les palettes intégrées
        if (btnReset) btnReset.style.display = b.custom ? 'none' : 'inline-block';

        // Le formulaire vit dans l'onglet Éditeur : on y bascule si nécessaire
        if (typeof this._switchTab === 'function' && this.map2d && this.map2d.activeTab !== 'editor') {
            this._switchTab('editor');
        }
        form.style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * v4.4 : titre du formulaire de palette (« Ma palette personnalisée »
     * ou « Modifier la palette : <nom> »)
     */
    refreshPaletteFormTitle() {
        const titleEl = document.getElementById('palette-form-title');
        if (!titleEl) return;
        if (this._paletteEditKey && this.generator.biomes[this._paletteEditKey]) {
            const b = this.generator.biomes[this._paletteEditKey];
            titleEl.textContent = (window.t ? window.t('secPaletteEdit') : 'Modifier la palette') + ' : ' + b.name;
        } else {
            titleEl.textContent = window.t ? window.t('secPaletteForm') : 'Ma palette personnalisée';
        }
    }

    /**
     * Presets et actions rapides (Reset, Save preset)
     */
    initPresetsAndActions() {
        const selectPreset = document.getElementById('select-preset');
        if (selectPreset) {
            selectPreset.innerHTML = `<option value="">${window.t ? window.t('presetDefault') : '-- Choisir un Preset --'}</option>`;
            for (let k in this.generator.presets) {
                const pName = window.getPresetName ? window.getPresetName(k, this.generator.presets[k]) : this.generator.presets[k].name;
                selectPreset.innerHTML += `<option value="${k}">${pName}</option>`;
            }

            // Charger presets depuis localStorage s'il y en a
            const saved = window.safeStorage.getItem('bloxd_custom_presets');
            if (saved) {
                try {
                    const custom = JSON.parse(saved);
                    for (let k in custom) {
                        this.generator.presets[k] = custom[k];
                        selectPreset.innerHTML += `<option value="${k}">⭐ ${custom[k].name}</option>`;
                    }
                } catch (e) {}
            }

            selectPreset.addEventListener('change', (e) => {
                if (e.target.value) {
                    if (this.generator && typeof this.generator.saveStateForUndo === 'function') this.generator.saveStateForUndo();
                    this.generator.loadPreset(e.target.value);
                    this.syncUIWithConfig();
                    if (typeof this.renderBiomesList === 'function') this.renderBiomesList();
                    this.map2d.render();
                    this.map3d.updateTerrain();
                    this.updateStatsBar();
                }
            });
        }

        const btnUndo = document.getElementById('btn-undo');
        const btnRedo = document.getElementById('btn-redo');
        if (btnUndo) btnUndo.addEventListener('click', () => window.triggerUndo());
        if (btnRedo) btnRedo.addEventListener('click', () => window.triggerRedo());

        const btnReset = document.getElementById('btn-reset');
        if (btnReset) btnReset.addEventListener('click', () => {
            if (this.generator && typeof this.generator.saveStateForUndo === 'function') this.generator.saveStateForUndo();
            if (this.generator.customEdits) this.generator.customEdits.clear();
            this.generator.generateGrid(false);
            this.map2d.render();
            this.map3d.updateTerrain();
            this.updateStatsBar();
        });

        const btnSavePreset = document.getElementById('btn-save-preset');
        if (btnSavePreset) btnSavePreset.addEventListener('click', () => {
            const name = prompt(window.t ? window.t('promptPresetName') : "Nom du Preset personnalisé :", window.t ? window.t('defaultPresetVal') : "Mon Univers Bloxd");
            if (!name) return;
            
            // Force synchronize UI values into config before saving
            const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : null; };
            const cfg = this.generator.config;
            if (getVal('cfg-world-x')) cfg.worldSizeX = parseInt(getVal('cfg-world-x')) || cfg.worldSizeX;
            if (getVal('cfg-world-z')) cfg.worldSizeZ = parseInt(getVal('cfg-world-z')) || cfg.worldSizeZ;
            if (getVal('cfg-seed')) cfg.seed = parseInt(getVal('cfg-seed')) || cfg.seed;
            if (getVal('cfg-ground-detail') !== null) { const gdv = parseFloat(getVal('cfg-ground-detail')); if (!isNaN(gdv)) cfg.groundDetail = gdv; }
            { const cft = document.getElementById('cfg-flat-terrain'); if (cft) cfg.flatTerrain = cft.checked; }
            if (getVal('cfg-base-y')) cfg.baseY = parseInt(getVal('cfg-base-y')) || cfg.baseY;
            if (getVal('cfg-sea-level')) cfg.seaLevel = parseInt(getVal('cfg-sea-level')) || cfg.seaLevel;
            if (getVal('cfg-min-h')) cfg.minHeight = parseInt(getVal('cfg-min-h')) || cfg.minHeight;
            if (getVal('cfg-max-h')) cfg.maxHeight = parseInt(getVal('cfg-max-h')) || cfg.maxHeight;
            if (getVal('cfg-noise-scale')) cfg.noiseScale = parseFloat(getVal('cfg-noise-scale')) || cfg.noiseScale;
            if (getVal('cfg-intensity')) cfg.terrainIntensity = parseInt(getVal('cfg-intensity')) || cfg.terrainIntensity;
            if (getVal('cfg-roughness')) cfg.roughness = parseFloat(getVal('cfg-roughness')) || cfg.roughness;

            const key = 'custom_' + Date.now();
            this.generator.presets[key] = {
                name: name,
                config: JSON.parse(JSON.stringify(this.generator.config)),
                biomes: JSON.parse(JSON.stringify(this.generator.biomes)),
                customEdits: this.generator.getSerializedCustomEdits()
            };

            // Save to localStorage
            let saved = JSON.parse(window.safeStorage.getItem('bloxd_custom_presets') || '{}');
            saved[key] = this.generator.presets[key];
            window.safeStorage.setItem('bloxd_custom_presets', JSON.stringify(saved));

            if (selectPreset) {
                selectPreset.innerHTML += `<option value="${key}" selected>⭐ ${name}</option>`;
            }
            alert(`${window.t ? window.t('presetSaved') : 'Preset sauvegardé avec succès : '}${name}`);
        });
    }

    /**
     * Synchronise les contrôles visuels du formulaire avec l'objet config actuel
     */
    update3dMeshBtn() {
        const btn3dMesh = document.getElementById('btn-3d-mesh');
        if (btn3dMesh) {
            btn3dMesh.textContent = this.generator.config.meshType === 'voxel' ? (window.t ? window.t('btn3dMeshVoxel') : '🧱 Voxel') : (window.t ? window.t('btn3dMeshSmooth') : '🟢 Lisse');
        }
    }
    
    syncUIWithConfig() {
        const cfg = this.generator.config;
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };

        setVal('cfg-world-x', cfg.worldSizeX);
        setVal('cfg-world-z', cfg.worldSizeZ);
        setVal('cfg-seed', cfg.seed);
        setVal('cfg-ground-detail', (cfg.groundDetail === undefined ? 1 : cfg.groundDetail));
        { const cft = document.getElementById('cfg-flat-terrain'); if (cft) cft.checked = !!cfg.flatTerrain; }
        { const cim = document.getElementById('cfg-island-mode'); if (cim) cim.checked = !!cfg.islandMode; }
        { const cfe = document.getElementById('flatten-exact'); if (cfe) cfe.checked = !!cfg.flattenExact; }
        setVal('cfg-base-y', cfg.baseY);
        setVal('cfg-sea-level', cfg.seaLevel);

        setVal('cfg-min-h', cfg.minHeight); setText('val-min-h', cfg.minHeight);
        this.update3dMeshBtn();
        setVal('cfg-max-h', cfg.maxHeight); setText('val-max-h', cfg.maxHeight);
        { const w = document.getElementById('max-h-warning'); if (w) w.style.display = cfg.maxHeight > 400 ? 'block' : 'none'; }
        setVal('cfg-noise-scale', cfg.noiseScale); setText('val-noise-scale', cfg.noiseScale);
        setVal('cfg-intensity', cfg.terrainIntensity); setText('val-intensity', cfg.terrainIntensity);
        setVal('cfg-roughness', cfg.roughness); setText('val-roughness', cfg.roughness);
    }

    /**
     * Déclenche la régénération du terrain et met à jour les 2 cartes
     */
    triggerRegeneration(preserveCustom = true) {
        this.generator.generateGrid(preserveCustom);
        this.generator.rebuildShapeMask();
        this.map2d.render();
        this.map3d.updateTerrain();
        this.updateStatsBar();
    }

    /**
     * Popup de dessin de forme personnalisée (grille 64×64, upscale vers la grille réelle)
     */
    _openShapePopup() {
        const POPUP_SIZE = 64;
        // Supprime un popup existant
        const old = document.getElementById('shape-popup-overlay');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'shape-popup-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:200;display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML = `
            <div style="background:#222633;border:1px solid #3b435b;border-radius:12px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,0.6);">
                <h3 style="color:#4aa8ff;margin-bottom:12px;">✏️ ${window.t ? window.t('shapeCustom') : 'Custom shape'}</h3>
                <p style="color:#8c95ac;font-size:12px;margin-bottom:12px;">${window.t ? (window.I18N.lang==='en' ? 'Draw the shape to keep. Click=paint, Right-click=erase.' : 'Dessinez la forme à garder. Clic=peindre, Clic droit=gommer.') : ''}</p>
                <canvas id="shape-popup-canvas" width="${POPUP_SIZE*6}" height="${POPUP_SIZE*6}" style="border:2px solid #3b435b;border-radius:6px;cursor:crosshair;background:#0b0d13;image-rendering:pixelated;"></canvas>
                <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end;">
                    <button id="shape-popup-clear" class="ui-btn" style="background:#2c3244;border:1px solid #3b435b;color:#eef2f8;padding:8px 14px;border-radius:6px;cursor:pointer;">Clear</button>
                    <button id="shape-popup-cancel" class="ui-btn" style="background:#2c3244;border:1px solid #3b435b;color:#eef2f8;padding:8px 14px;border-radius:6px;cursor:pointer;">Cancel</button>
                    <button id="shape-popup-ok" class="ui-btn" style="background:#4aa8ff;border:none;color:#061018;padding:8px 14px;border-radius:6px;cursor:pointer;font-weight:600;">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const cv = document.getElementById('shape-popup-canvas');
        const ctx2 = cv.getContext('2d');
        const CELL_PX = cv.width / POPUP_SIZE;
        const mask = new Uint8Array(POPUP_SIZE * POPUP_SIZE); // 0=outside, 1=inside
        let painting = false, erasing = false;

        function drawGrid() {
            ctx2.fillStyle = '#0b0d13';
            ctx2.fillRect(0, 0, cv.width, cv.height);
            for (let y = 0; y < POPUP_SIZE; y++) {
                for (let x = 0; x < POPUP_SIZE; x++) {
                    if (mask[y * POPUP_SIZE + x]) {
                        ctx2.fillStyle = '#4aa8ff';
                        ctx2.fillRect(x * CELL_PX, y * CELL_PX, CELL_PX + 0.5, CELL_PX + 0.5);
                    }
                }
            }
        }
        function paintAt(cx, cy, erase) {
            const gx = Math.floor(cx / CELL_PX), gy = Math.floor(cy / CELL_PX);
            const r = 2;
            for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
                if (dx*dx + dy*dy > r*r) continue;
                const nx = gx + dx, ny = gy + dy;
                if (nx < 0 || nx >= POPUP_SIZE || ny < 0 || ny >= POPUP_SIZE) continue;
                mask[ny * POPUP_SIZE + nx] = erase ? 0 : 1;
            }
            drawGrid();
        }

        cv.addEventListener('mousedown', e => {
            const rect = cv.getBoundingClientRect();
            const sx = cv.width / rect.width, sy = cv.height / rect.height;
            painting = true; erasing = e.button === 2;
            paintAt((e.clientX - rect.left) * sx, (e.clientY - rect.top) * sy, erasing);
        });
        cv.addEventListener('mousemove', e => {
            if (!painting) return;
            const rect = cv.getBoundingClientRect();
            const sx = cv.width / rect.width, sy = cv.height / rect.height;
            paintAt((e.clientX - rect.left) * sx, (e.clientY - rect.top) * sy, erasing);
        });
        window.addEventListener('mouseup', () => { painting = false; });
        cv.addEventListener('contextmenu', e => e.preventDefault());

        document.getElementById('shape-popup-clear').addEventListener('click', () => {
            mask.fill(0); drawGrid();
        });
        document.getElementById('shape-popup-cancel').addEventListener('click', () => {
            overlay.remove();
            selShape.value = this.generator.config.shapeMode !== 'custom' ? this.generator.config.shapeMode : 'square';
        });
        document.getElementById('shape-popup-ok').addEventListener('click', () => {
            // Upscale 64×64 → grille réelle
            const grid = this.generator.grid;
            const resX = grid.length, resZ = grid[0] ? grid[0].length : 0;
            this.generator.shapeMask = [];
            for (let gx = 0; gx < resX; gx++) {
                const row = new Uint8Array(resZ);
                for (let gz = 0; gz < resZ; gz++) {
                    const px = Math.floor(gx / resX * POPUP_SIZE);
                    const pz = Math.floor(gz / resZ * POPUP_SIZE);
                    row[gz] = mask[pz * POPUP_SIZE + px] || 0;
                }
                this.generator.shapeMask.push(row);
            }
            overlay.remove();
            this.map2d.render();
            this.map3d.updateTerrain();
        });

        drawGrid();
        // Remplissage par défaut : tout à 1 (forme pleine)
        mask.fill(1);
        drawGrid();
    }

    /**
     * Met à jour la barre de statistiques (hauteurs min/max et compteurs de biomes)
     */
    updateStatsBar() {
        const stMin = document.getElementById('stat-min-h');
        const stMax = document.getElementById('stat-max-h');
        const stAvg = document.getElementById('stat-avg-h');
        if (stMin) stMin.textContent = `${this.generator.stats.minHeight}m`;
        if (stMax) stMax.textContent = `${this.generator.stats.maxHeight}m`;
        if (stAvg) stAvg.textContent = `${this.generator.stats.avgHeight}m`;
    }

    /**
     * Initialisation de la modale d'export (Télécharger le projet en ZIP / Script Python)
     */
    initExportModal() {
        const btnOpen = document.getElementById('btn-download-project');
        const modal = document.getElementById('export-modal');
        const btnClose = document.getElementById('btn-close-modal');
        const btnDownloadZip = document.getElementById('btn-do-download-zip');
        const inputFilename = document.getElementById('export-filename');
        const inputFoldername = document.getElementById('export-foldername');
        const inputAnchorX = document.getElementById('export-anchor-x');
        const inputAnchorY = document.getElementById('export-anchor-y');
        const inputAnchorZ = document.getElementById('export-anchor-z');

        if (!btnOpen || !modal) return;

        // Nettoie un nom de fichier/dossier saisi par l'utilisateur (retire l'extension
        // éventuelle et les caractères invalides sur la plupart des systèmes de fichiers)
        const sanitizeName = (raw, fallback) => {
            let n = (raw || "").trim().replace(/\.bloxdschem$/i, "").replace(/[\\/:*?"<>|]/g, "");
            return n.length > 0 ? n : fallback;
        };

        btnOpen.addEventListener('click', () => {
            modal.classList.add('active');
        });

        if (btnClose) btnClose.addEventListener('click', () => modal.classList.remove('active'));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

        if (btnDownloadZip) btnDownloadZip.addEventListener('click', async () => {
            btnDownloadZip.disabled = true;
            btnDownloadZip.innerHTML = '<i class="fas fa-cog fa-spin"></i> Génération directe du schématique...';

            try {
                // PÉRIMÈTRE D'EXPORT : zone active ou toutes les zones
                const scopeRadio = document.querySelector('input[name="export-scope"]:checked');
                const exportAll = scopeRadio && scopeRadio.value === 'all' && window.zoneManager && window.zoneManager.zones.length > 1;
                if (exportAll) {
                    await this._exportAllZones(btnDownloadZip, sanitizeName, inputFilename, inputFoldername, inputAnchorX, inputAnchorY, inputAnchorZ);
                    return;
                }

                // STYLE PIXELISE : lit la case à cocher de la modale
                const chkPix = document.getElementById('export-pixelated');
                this.generator.config.pixelatedExport = !!(chkPix && chkPix.checked);
                // MONO-FICHIER FORCÉ : pour outils externes hors Bloxd
                const chkSingle = document.getElementById('export-single-file');
                this.generator.config.forceSingleSchem = !!(chkSingle && chkSingle.checked);
                const schemBytes = this.generator.exportSchematicBinary();
                const anchorX = parseInt(inputAnchorX?.value, 10) || 0;
                const anchorY = parseInt(inputAnchorY?.value, 10) || 0;
                const anchorZ = parseInt(inputAnchorZ?.value, 10) || 0;

                if (!schemBytes.splitFiles || schemBytes.splitFiles.length <= 1) {
                    // Téléchargement direct et unique du fichier .bloxdschem sans rien d'autre
                    const filename = sanitizeName(inputFilename?.value, "monde_personnalise");
                    const blob = new Blob([schemBytes], { type: "application/octet-stream" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${filename}.bloxdschem`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } else {
                    // Si le monde est grand (>180 chunks), on regroupe les parties dans un ZIP
                    const foldername = sanitizeName(inputFoldername?.value, "schematics_decoupes");
                    const JSZipLib = await window.ensureJsZip();
                    const zip = new JSZipLib();
                    const schemFolder = zip.folder(foldername);
                    let guideTxt = (window.t && window.I18N && window.I18N.lang === 'en') ? window.t('guideSplitHeader') : "============================================================\n📦 MONDE DÉCOUPÉ EN PARTIES (<200 CHUNKS/FICHIER)\n";
                    guideTxt += "============================================================\n\n";
                    guideTxt += "Ce monde étant volumineux, il a été découpé en plusieurs fichiers pour respecter\n";
                    guideTxt += "la limite technique de Bloxd.io (~200 chunks maximum par commande //schematic load).\n\n";
                    guideTxt += "⚠️ IMPORTANT : Bloxd.io ne repositionne PAS automatiquement chaque partie à sa\n";
                    guideTxt += "place dans le monde (comme le fait aussi l'outil officiel M2B pour ses schematics\n";
                    guideTxt += "découpés) : c'est à VOUS de vous déplacer entre deux chargements, sinon toutes\n";
                    guideTxt += "les parties se superposent au même endroit.\n\n";
                    guideTxt += "Chaque fichier est nommé numéro_[posX,posY,posZ], où posX/posY/posZ correspond à\n";
                    guideTxt += "la position (dans le monde Bloxd) de l'angle où poser ce schéma, calculée à partir\n";
                    guideTxt += `de la position d'ancrage que vous avez choisie (${anchorX}, ${anchorY}, ${anchorZ}).\n\n`;
                    guideTxt += "INSTRUCTIONS D'IMPORTATION :\n";
                    guideTxt += `1. Placez tous les fichiers .bloxdschem du dossier "${foldername}" dans le répertoire schématiques de Bloxd.\n`;
                    guideTxt += "2. En jeu, rendez-vous à la position de l'angle de collage indiquée dans le nom du 1er fichier.\n";
                    guideTxt += "3. Pour chaque fichier ci-dessous, déplacez-vous à la position [posX,posY,posZ] indiquée dans\n";
                    guideTxt += "   son nom, PUIS chargez-le :\n\n";
                    guideTxt += "🚨 RÈGLE D'OR — ALTITUDE Y CONSTANTE :\n";
                    guideTxt += "Bloxd colle chaque schéma PAR RAPPORT À VOTRE POSITION, Y COMPRIS VOTRE HAUTEUR !\n";
                    guideTxt += `Chargez TOUTES les parties depuis EXACTEMENT la même altitude Y=${anchorY}.\n`;
                    guideTxt += "Si vous marchez sur le terrain déjà généré (dunes, collines...), votre Y varie et\n";
                    guideTxt += "la partie suivante sera DÉCALÉE VERTICALEMENT (falaises de roche, sable surélevé).\n";
                    guideTxt += "👉 Astuce : passez en vol (/fly ou mode créatif), placez-vous à Y exact affiché\n";
                    guideTxt += "   à l'écran, et vérifiez ce Y avant CHAQUE //schematic load.\n\n";

                    schemBytes.splitFiles.forEach((file, idx) => {
                        const posX = anchorX + (file.offsetX || 0);
                        const posY = anchorY;
                        const posZ = anchorZ + (file.offsetZ || 0);
                        const schemName = `${idx + 1}_[${posX},${posY},${posZ}]`;
                        schemFolder.file(`${schemName}.bloxdschem`, file.bytes);
                        guideTxt += `   [${schemName}] Position : X=${posX}, Y=${posY}, Z=${posZ}\n`;
                        guideTxt += `   //schematic load ${schemName}\n\n`;
                    });

                    zip.file("GUIDE_CHARGEMENT_PARTIES.txt", guideTxt);
                    const blob = await zip.generateAsync({ type: "blob" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${foldername}.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            } catch (err) {
                console.error("Erreur lors de la génération du fichier .bloxdschem:", err);
                alert(window.t ? window.t('errSchemGen') : "Erreur lors de la création du fichier .bloxdschem.");
            } finally {
                btnDownloadZip.disabled = false;
                btnDownloadZip.innerHTML = '<i class="fas fa-download"></i> Télécharger le fichier .bloxdschem';
            }
        });
    }

    /**
    /**
     * Export combiné de toutes les zones en un seul .bloxdschem.
     * Chaque zone est générée avec son propre seed/config/édits, puis
     * positionnée dans l'espace monde selon son offset (offsetX, offsetZ).
     */
    async _exportAllZones(btn, sanitizeName, inputFilename, inputFoldername, inputAnchorX, inputAnchorY, inputAnchorZ) {
        const zm = window.zoneManager;
        if (!zm) return;
        btn.innerHTML = '<i class="fas fa-cog fa-spin"></i> Export de toutes les zones...';
        try {
            const chkPix = document.getElementById('export-pixelated');
            this.generator.config.pixelatedExport = !!(chkPix && chkPix.checked);
            const chkSingle = document.getElementById('export-single-file');
            this.generator.config.forceSingleSchem = !!(chkSingle && chkSingle.checked);
            const anchorX = parseInt(inputAnchorX?.value, 10) || 0;
            const anchorY = parseInt(inputAnchorY?.value, 10) || 0;
            const anchorZ = parseInt(inputAnchorZ?.value, 10) || 0;

            // Sauvegarder la zone active
            zm.saveCurrent();
            const savedActive = zm.activeIdx;
            const allFiles = [];
            for (let i = 0; i < zm.zones.length; i++) {
                const z = zm.zones[i];
                // Restaurer temporairement cette zone
                if (z.state) {
                    this.generator.restoreSnapshot(z.state);
                } else {
                    this.generator.config.worldSizeX = z.worldSizeX;
                    this.generator.config.worldSizeZ = z.worldSizeZ;
                    this.generator.config.seed = z.seed;
                    this.generator.customEdits = new Map();
                    this.generator.initPermutationTable(z.seed);
                    this.generator.generateGrid(false);
                }
                const bytes = this.generator.exportSchematicBinary();
                const offX = anchorX + z.offsetX;
                const offZ = anchorZ + z.offsetZ;
                if (bytes.splitFiles && bytes.splitFiles.length > 1) {
                    bytes.splitFiles.forEach((f, idx) => {
                        allFiles.push({ name: `${z.name}_${f.name}`, bytes: f.bytes, zone: z, partIdx: idx, offX, offZ });
                    });
                } else {
                    allFiles.push({ name: `${z.name}.bloxdschem`, bytes, zone: z, partIdx: 0, offX, offZ });
                }
            }
            // Restaurer la zone active
            const activeZ = zm.zones[savedActive];
            if (activeZ.state) this.generator.restoreSnapshot(activeZ.state);
            zm.activeIdx = savedActive;

            if (allFiles.length === 1) {
                const blob = new Blob([allFiles[0].bytes], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = allFiles[0].name;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                const JSZipLib = await window.ensureJsZip();
                const zip = new JSZipLib();
                const foldername = sanitizeName(inputFoldername?.value, 'zones_terrain');
                const folder = zip.folder(foldername);
                let guide = '=== EXPORT MULTI-ZONES ===\n\n';
                guide += `${zm.zones.length} zones exportées.\n`;
                guide += 'Chargez chaque fichier avec //schematic load en vous plaçant aux coordonnées indiquées.\n\n';
                for (const f of allFiles) {
                    folder.file(f.name, f.bytes);
                    guide += `- ${f.name} → position [${f.offX}, ${anchorY}, ${f.offZ}]\n`;
                }
                folder.file('GUIDE.txt', guide);
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = foldername + '.zip';
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Erreur export multi-zones:', err);
            alert('Erreur lors de l\'export multi-zones : ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-download"></i> Télécharger le fichier .bloxdschem';
        }
    }

    /**
     * Partage d'équipe : export/import d'un projet complet en JSON (config +
     * biomes + modifications), et import d'un terrain depuis un .bloxdschem
     * existant (reconstruction en heightmap — voir importFromBloxdschemBlocks).
     */
    initTeamShareControls() {
        const btnExportJson = document.getElementById('btn-export-project-json');
        const btnImportJson = document.getElementById('btn-import-project-json');
        const inputJson = document.getElementById('input-import-project-json');
        const btnImportSchem = document.getElementById('btn-import-bloxdschem');
        const inputSchem = document.getElementById('input-import-bloxdschem');

        const refreshAfterLoad = () => {
            this.syncUIWithConfig();
            if (typeof this.renderBiomesList === 'function') this.renderBiomesList();
            this.generator.rebuildShapeMask();
            this.map2d.render();
            this.map3d.updateTerrain();
            this.updateStatsBar();
        };

        if (btnExportJson) btnExportJson.addEventListener('click', () => {
            try {
                const data = this.generator.exportProjectData();
                // Inclure les données multi-zones si le zone manager est actif
                if (window.zoneManager) {
                    data.zones = window.zoneManager.serialize();
                }
                const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'terrain_project.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            } catch (err) {
                console.error('Erreur export projet JSON:', err);
                alert('Erreur lors de l\'export du projet.');
            }
        });

        if (btnImportJson && inputJson) {
            btnImportJson.addEventListener('click', () => inputJson.click());
            inputJson.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const data = JSON.parse(ev.target.result);
                        if (this.generator.saveStateForUndo) this.generator.saveStateForUndo();
                        this.generator.importProjectData(data);
                        // Restaurer les zones si présentes dans le fichier
                        if (data.zones && window.zoneManager) {
                            window.zoneManager.deserialize(data.zones);
                        }
                        refreshAfterLoad();
                    } catch (err) {
                        console.error('Erreur import projet JSON:', err);
                        alert('Fichier de projet invalide ou corrompu.');
                    } finally {
                        inputJson.value = '';
                    }
                };
                reader.readAsText(file);
            });
        }

        if (btnImportSchem && inputSchem) {
            btnImportSchem.addEventListener('click', () => inputSchem.click());
            inputSchem.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const ok = confirm(
                    "Importer ce .bloxdschem comme terrain va REMPLACER le relief et les modifications actuelles.\n\n" +
                    "⚠️ Limite : seul le bloc le plus haut de chaque colonne est conservé (pas de surplombs, grottes ou structures suspendues — ce logiciel modélise un terrain en 2D).\n\n" +
                    "Continuer ?"
                );
                if (!ok) { inputSchem.value = ''; return; }
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const parsed = teParseBloxdschem(ev.target.result);
                        if (this.generator.saveStateForUndo) this.generator.saveStateForUndo();
                        const res = this.generator.importFromBloxdschemBlocks(parsed);
                        refreshAfterLoad();
                        if (!res || !res.columns) alert('Aucun bloc solide trouvé dans ce fichier.');
                    } catch (err) {
                        console.error('Erreur import .bloxdschem:', err);
                        alert('Fichier .bloxdschem invalide ou corrompu : ' + err.message);
                    } finally {
                        inputSchem.value = '';
                    }
                };
                reader.readAsArrayBuffer(file);
            });
        }
    }

    getDirectGuideContent() {
        if (window.t && window.I18N && window.I18N.lang === 'en') return window.t('directGuideContent');
        return `============================================================
📦 GUIDE D'IMPORTATION DIRECTE DANS BLOXD.IO
============================================================

Félicitations ! Votre monde a été généré en direct par Bloxd Terrain Editor sans avoir besoin de code Python.
Le fichier schématique prêt à l'emploi est situé dans le dossier "schematics" :
👉 monde_personnalise.bloxdschem

MODE D'EMPLOI EN 3 ÉTAPES SIMPLES :
1. Lancez Bloxd.io dans votre navigateur internet.
2. Placez le fichier "monde_personnalise.bloxdschem" dans votre dossier de schématiques Bloxd (ou utilisez un proxy/mod compatible).
3. Ouvrez le tchat en jeu et tapez la commande :
   //schematic load monde_personnalise

Et voilà ! Votre terrain apparaîtra instantanément dans le jeu.
============================================================
Note pour les développeurs : Si vous préférez exécuter les scripts manuellement, 
ils sont conservés dans le dossier "options_avancees_python/".
`;
    }

    getReadmeContent() {
        if (window.t && window.I18N && window.I18N.lang === 'en') return window.t('readmeHeader');
        return `# 📦 Projet Terrain Bloxd.io Personnalisé
Généré depuis l'application **Bloxd Terrain Editor**

## 🚀 Contenu de l'archive
- \`generate_terrain.py\` : Script de génération configuré avec vos paramètres exacts et biomes.
- \`bloxd_format.py\` : Moteur d'écriture binaire Avro (.bloxdschem).
- \`nameToId.json\` : Table de mapping des ID de blocs Bloxd.io.

## 🛠️ Comment générer votre carte sur votre ordinateur
1. Assurez-vous d'avoir Python 3 installé avec \`numpy\` :
   \`\`\`bash
   pip install numpy
   \`\`\`
2. Exécutez le générateur :
   \`\`\`bash
   python generate_terrain.py
   \`\`\`
3. Un fichier **\`custom_terrain.bloxdschem\`** sera généré en quelques secondes.

## 🎮 Comment importer dans Bloxd.io
1. Lancez Bloxd.io dans votre navigateur (mode Créatif ou serveur Worlds avec permissions).
2. Placez le fichier \`custom_terrain.bloxdschem\` ou utilisez un mod/proxy compatible avec les commandes de schématiques de Bloxd.
3. Chargez le schématique en jeu via la commande :
   \`//schematic load custom_terrain\`

Profitez de votre nouveau monde Bloxd ! 🌟
`;
    }

    getBloxdFormatPyContent() {
        return `"""
Low-level .bloxdschem (Avro-based) binary writer.
Reverse engineered from Bloxd.io schematic converter.
"""
import struct

def _uvarint(n: int) -> bytes:
    out = bytearray()
    n = int(n)
    while True:
        b = n & 0x7F
        n >>= 7
        if n:
            out.append(b | 0x80)
        else:
            out.append(b)
            break
    return bytes(out)

def avro_int(n: int) -> bytes:
    n = int(n)
    zz = (n << 1) if n >= 0 else ((-n << 1) - 1)
    return _uvarint(zz)

def avro_string(s: str) -> bytes:
    b = s.encode("utf-8")
    return avro_int(len(b)) + b

def avro_bytes(b: bytes) -> bytes:
    return avro_int(len(b)) + b

class BloxdSchemWriter:
    def __init__(self, f, name: str, size_x: int, size_y: int, size_z: int, pos=(0, 0, 0)):
        self.f = f
        self._chunk_count = 0
        self._buffer = bytearray()
        self._flush_every = 512
        self.f.write(b"\\x00\\x00\\x00\\x00")
        self.f.write(avro_string(name))
        self.f.write(avro_int(pos[0]))
        self.f.write(avro_int(pos[1]))
        self.f.write(avro_int(pos[2]))
        self.f.write(avro_int(size_x))
        self.f.write(avro_int(size_y))
        self.f.write(avro_int(size_z))

    def add_chunk(self, cx: int, cy: int, cz: int, rle_bytes: bytes):
        self._buffer += avro_int(cx)
        self._buffer += avro_int(cy)
        self._buffer += avro_int(cz)
        self._buffer += avro_bytes(rle_bytes)
        self._chunk_count += 1
        if self._chunk_count >= self._flush_every:
            self._flush_block()

    def _flush_block(self):
        if self._chunk_count == 0: return
        self.f.write(avro_int(self._chunk_count))
        self.f.write(bytes(self._buffer))
        self._buffer = bytearray()
        self._chunk_count = 0

    def finish(self):
        self._flush_block()
        self.f.write(avro_int(0))
`;
    }

    getFallbackNameToId() {
        return {
            "Air": 0, "Dirt": 2, "Grass Block": 4, "Sand": 5, "Clay": 6, "Snow": 8,
            "Stone": 28, "Smooth Stone": 31, "Lime Wool": 56, "Green Wool": 64,
            "Lime Baked Clay": 73, "Green Baked Clay": 81, "Orange Baked Clay": 69,
            "Lime Concrete": 91, "Green Concrete": 98, "White Concrete": 97,
            "Yellow Concrete": 99, "Black Concrete": 86, "Water": 126,
            "Stone Bricks": 129, "Cracked Stone Bricks": 136, "Smooth Sandstone": 137,
            "Obsidian": 140, "Packed Snow": 8, "Sandstone": 38,
            "Baked Clay": 67, "Red Baked Clay": 82, "Dark Red Brick": 130, "Dark Red Stone": 131,
            "Smooth Red Sandstone": 475, "Red Sand": 650, "Magma": 471, "Cherry Log": 1222
        };
    }
}
window.UIManager = UIManager;

/* ═══════════════════════════════════════════════════════════════ */
/*  main  */
/* ═══════════════════════════════════════════════════════════════ */

/* ============================================================
   Bloxd Terrain Editor — terrain_editor_main.js
   Point d'entrée : toasts, undo/redo (Ctrl+Z/Y), initApp(), démarrage au DOMContentLoaded.
   Chargement : 8/8 — chargé en DERNIER (voir <script> dans terrain_editor.html)
   ============================================================ */

window.showToast = function(msg) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        toast.style.cssText = "position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: rgba(15, 23, 42, 0.95); color: #38bdf8; border: 1px solid #38bdf8; padding: 10px 22px; border-radius: 30px; font-weight: 600; font-size: 0.95rem; z-index: 10000; box-shadow: 0 4px 15px rgba(0,0,0,0.5); transition: opacity 0.3s ease; pointer-events: none;";
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    if (window._toastTimer) clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 1500);
};

window.triggerUndo = function() {
    if (!window.generatorInstance || typeof window.generatorInstance.undo !== 'function') return;
    const success = window.generatorInstance.undo();
    if (!success) return;
    if (window.uiManagerInstance) window.uiManagerInstance.syncUIWithConfig();
    if (window.map2dInstance) window.map2dInstance.render();
    if (window.map3dInstance) window.map3dInstance.updateTerrain();
    if (window.uiManagerInstance) window.uiManagerInstance.updateStatsBar();
    window.showToast(window.t ? window.t('toastUndo') : "↩️ Action annulée (Undo)");
};

window.triggerRedo = function() {
    if (!window.generatorInstance || typeof window.generatorInstance.redo !== 'function') return;
    const success = window.generatorInstance.redo();
    if (!success) return;
    if (window.uiManagerInstance) window.uiManagerInstance.syncUIWithConfig();
    if (window.map2dInstance) window.map2dInstance.render();
    if (window.map3dInstance) window.map3dInstance.updateTerrain();
    if (window.uiManagerInstance) window.uiManagerInstance.updateStatsBar();
    window.showToast(window.t ? window.t('toastRedo') : "↪️ Action rétablie (Redo)");
};

if (!window._undoShortcutsBound) {
    window._undoShortcutsBound = true;
    window.addEventListener('keydown', (e) => {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
            return;
        }
        // Ces raccourcis ne s'appliquent qu'à l'Éditeur, pas aux Paramètres (Settings) !
        if (!window.map2dInstance || window.map2dInstance.activeTab === 'settings') {
            return;
        }
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z' || e.code === 'KeyZ')) {
            e.preventDefault();
            window.triggerUndo();
        } else if (((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y' || e.code === 'KeyY')) ||
                   ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z' || e.code === 'KeyZ'))) {
            e.preventDefault();
            window.triggerRedo();
        }
    });
}
            // ════════════════════════════════════════════════════════════════
//  ZoneManager — Gestionnaire de zones multiples pour le terrain
// ════════════════════════════════════════════════════════════════
class ZoneManager {
    constructor(generator, map2d, map3d, ui) {
        this.gen = generator;
        this.map2d = map2d;
        this.map3d = map3d;
        this.ui = ui;
        this.zones = [];
        this.activeIdx = 0;
        this._canvas = null;
        this._ctx = null;
        // Zone par défaut (terrain existant)
        this.zones.push({
            id: 'zone_0', col: 0, row: 0,
            offsetX: 0, offsetZ: 0,
            name: 'Zone 1',
            worldSizeX: generator.config.worldSizeX,
            worldSizeZ: generator.config.worldSizeZ,
            seed: generator.config.seed,
            state: null // état courant = dans le generator
        });
        this._bindUI();
        this._renderGrid();
    }

    // ── Sauvegarde l'état du generator dans la zone active ──
    saveCurrent() {
        const z = this.zones[this.activeIdx];
        if (!z) return;
        z.state = {
            config: JSON.parse(JSON.stringify(this.gen.config)),
            customEdits: this.gen.getSerializedCustomEdits(),
            biomeRules: this.gen.getSerializedBiomeRules()
        };
        z.worldSizeX = this.gen.config.worldSizeX;
        z.worldSizeZ = this.gen.config.worldSizeZ;
        z.seed = this.gen.config.seed;
    }

    // ── Restaure une zone dans le generator et rafraîchit les vues ──
    loadZone(idx) {
        if (idx < 0 || idx >= this.zones.length || idx === this.activeIdx) return;
        this.saveCurrent();
        this.activeIdx = idx;
        const z = this.zones[idx];
        if (z.state) {
            // Zone déjà visitée : restaurer son état
            this.gen.restoreSnapshot(z.state);
        } else {
            // Nouvelle zone : configurer depuis les métadonnées
            this.gen.config.worldSizeX = z.worldSizeX;
            this.gen.config.worldSizeZ = z.worldSizeZ;
            this.gen.config.seed = z.seed;
            if (!this.gen.customEdits) this.gen.customEdits = new Map();
            this.gen.customEdits.clear();
            this.gen.undoStack = [];
            this.gen.redoStack = [];
            this.gen.initPermutationTable(z.seed);
            this.gen.generateGrid(false);
        }
        // Rafraîchir les vues
        if (this.ui) this.ui.syncUIWithConfig();
        if (this.map2d) this.map2d.render();
        if (this.map3d) this.map3d.updateTerrain();
        if (this.ui) this.ui.updateStatsBar();
        this._renderGrid();
        this._updateActiveLabel();
    }

    // ── Créer une nouvelle zone adjacente ──
    createZone(dc, dr) {
        const ref = this.zones[this.activeIdx];
        const newCol = ref.col + dc;
        const newRow = ref.row + dr;
        // Vérifier que la cellule est libre
        if (this.zones.some(z => z.col === newCol && z.row === newRow)) {
            if (window.showToast) window.showToast('⚠️ Une zone existe déjà ici.');
            return;
        }
        this.saveCurrent();
        const id = 'zone_' + Date.now();
        const idx = this.zones.length + 1;
        const newZone = {
            id, col: newCol, row: newRow,
            offsetX: ref.offsetX + dc * ref.worldSizeX,
            offsetZ: ref.offsetZ + dr * ref.worldSizeZ,
            name: 'Zone ' + idx,
            worldSizeX: ref.worldSizeX,
            worldSizeZ: ref.worldSizeZ,
            seed: Math.floor(Math.random() * 999999),
            state: null
        };
        this.zones.push(newZone);
        // Activer immédiatement la nouvelle zone
        this.activeIdx = this.zones.length - 1;
        const z = this.zones[this.activeIdx];
        this.gen.config.worldSizeX = z.worldSizeX;
        this.gen.config.worldSizeZ = z.worldSizeZ;
        this.gen.config.seed = z.seed;
        this.gen.customEdits = new Map();
        this.gen.undoStack = [];
        this.gen.redoStack = [];
        this.gen.initPermutationTable(z.seed);
        this.gen.generateGrid(false);
        if (this.ui) this.ui.syncUIWithConfig();
        if (this.map2d) this.map2d.render();
        if (this.map3d) this.map3d.updateTerrain();
        if (this.ui) this.ui.updateStatsBar();
        this._renderGrid();
        this._updateActiveLabel();
        if (window.showToast) window.showToast('✅ ' + z.name + ' créée.');
    }

    // ── Supprimer la zone active (sauf si c'est la dernière) ──
    deleteActive() {
        if (this.zones.length <= 1) {
            if (window.showToast) window.showToast('⚠️ Impossible de supprimer la dernière zone.');
            return;
        }
        const name = this.zones[this.activeIdx].name;
        this.zones.splice(this.activeIdx, 1);
        this.activeIdx = Math.min(this.activeIdx, this.zones.length - 1);
        const z = this.zones[this.activeIdx];
        if (z.state) {
            this.gen.restoreSnapshot(z.state);
        } else {
            this.gen.config.worldSizeX = z.worldSizeX;
            this.gen.config.worldSizeZ = z.worldSizeZ;
            this.gen.config.seed = z.seed;
            this.gen.customEdits = new Map();
            this.gen.undoStack = [];
            this.gen.redoStack = [];
            this.gen.initPermutationTable(z.seed);
            this.gen.generateGrid(false);
        }
        if (this.ui) this.ui.syncUIWithConfig();
        if (this.map2d) this.map2d.render();
        if (this.map3d) this.map3d.updateTerrain();
        if (this.ui) this.ui.updateStatsBar();
        this._renderGrid();
        this._updateActiveLabel();
        if (window.showToast) window.showToast('🗑️ ' + name + ' supprimée.');
    }

    // ── Obtenir la position monde d'une zone (pour l'export combiné) ──
    getZoneWorldOffset(idx) {
        const z = this.zones[idx];
        return { x: z.offsetX, z: z.offsetZ };
    }

    // ── Export combiné de toutes les zones ──
    exportAllZones(exportFn) {
        this.saveCurrent();
        const results = [];
        for (let i = 0; i < this.zones.length; i++) {
            const z = this.zones[i];
            // Restaurer temporairement cette zone
            if (z.state) {
                this.gen.restoreSnapshot(z.state);
            } else {
                this.gen.config.worldSizeX = z.worldSizeX;
                this.gen.config.worldSizeZ = z.worldSizeZ;
                this.gen.config.seed = z.seed;
                this.gen.customEdits = new Map();
                this.gen.initPermutationTable(z.seed);
                this.gen.generateGrid(false);
            }
            const bytes = exportFn();
            results.push({ zone: z, bytes, offset: { x: z.offsetX, z: z.offsetZ } });
        }
        // Restaurer la zone active
        const active = this.zones[this.activeIdx];
        if (active.state) {
            this.gen.restoreSnapshot(active.state);
        }
        return results;
    }

    // ── Serialisation pour le .json projet ──
    serialize() {
        this.saveCurrent();
        return {
            version: 2,
            zones: this.zones.map(z => ({
                id: z.id, col: z.col, row: z.row,
                offsetX: z.offsetX, offsetZ: z.offsetZ,
                name: z.name,
                worldSizeX: z.worldSizeX, worldSizeZ: z.worldSizeZ,
                seed: z.seed,
                state: z.state
            })),
            activeIdx: this.activeIdx
        };
    }

    // ── Restauration depuis un .json projet ──
    deserialize(data) {
        if (!data || !data.zones || !data.zones.length) return false;
        this.zones = data.zones.map(z => ({
            id: z.id, col: z.col, row: z.row,
            offsetX: z.offsetX || 0, offsetZ: z.offsetZ || 0,
            name: z.name || 'Zone',
            worldSizeX: z.worldSizeX || 4000,
            worldSizeZ: z.worldSizeZ || 4000,
            seed: z.seed || 54321,
            state: z.state || null
        }));
        this.activeIdx = Math.min(data.activeIdx || 0, this.zones.length - 1);
        const z = this.zones[this.activeIdx];
        if (z.state) {
            this.gen.restoreSnapshot(z.state);
        } else {
            this.gen.config.worldSizeX = z.worldSizeX;
            this.gen.config.worldSizeZ = z.worldSizeZ;
            this.gen.config.seed = z.seed;
            this.gen.customEdits = new Map();
            this.gen.initPermutationTable(z.seed);
            this.gen.generateGrid(false);
        }
        if (this.ui) this.ui.syncUIWithConfig();
        if (this.map2d) this.map2d.render();
        if (this.map3d) this.map3d.updateTerrain();
        if (this.ui) this.ui.updateStatsBar();
        this._renderGrid();
        this._updateActiveLabel();
        return true;
    }

    // ── Liaison avec l'UI ──
    _bindUI() {
        const self = this;
        // Grille cliquable
        this._canvas = document.getElementById('zone-grid-canvas');
        if (this._canvas) {
            this._ctx = this._canvas.getContext('2d');
            this._canvas.addEventListener('click', (e) => self._onGridClick(e));
        }
        // Boutons d'ajout de zone
        ['zone-add-right', 'zone-add-bottom', 'zone-add-left', 'zone-add-top'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', () => {
                if (id === 'zone-add-right') self.createZone(1, 0);
                else if (id === 'zone-add-bottom') self.createZone(0, 1);
                else if (id === 'zone-add-left') self.createZone(-1, 0);
                else if (id === 'zone-add-top') self.createZone(0, -1);
            });
        });
        const delBtn = document.getElementById('zone-delete');
        if (delBtn) delBtn.addEventListener('click', () => self.deleteActive());
    }

    _updateActiveLabel() {
        const lbl = document.getElementById('zone-active-label');
        if (lbl) {
            const z = this.zones[this.activeIdx];
            lbl.textContent = z ? (z.name + ' (' + z.worldSizeX + '×' + z.worldSizeZ + ')') : '';
        }
    }

    // ── Rendu de la mini-grille des zones ──
    _renderGrid() {
        if (!this._canvas || !this._ctx) return;
        const c = this._canvas, ctx = this._ctx;
        // Calculer les bornes
        let minC = Infinity, maxC = -Infinity, minR = Infinity, maxR = -Infinity;
        this.zones.forEach(z => {
            if (z.col < minC) minC = z.col;
            if (z.col > maxC) maxC = z.col;
            if (z.row < minR) minR = z.row;
            if (z.row > maxR) maxR = z.row;
        });
        // Ajouter une marge pour les boutons "+" potentiels
        minC--; maxC++; minR--; maxR++;
        const cols = maxC - minC + 1, rows = maxR - minR + 1;
        const cellW = Math.max(64, Math.floor(280 / cols));
        const cellH = Math.max(48, Math.floor(180 / rows));
        const pad = 4;
        c.width = cols * cellW + pad * 2;
        c.height = rows * cellH + pad * 2;
        ctx.clearRect(0, 0, c.width, c.height);
        // Dessiner les cellules
        for (let r = minR; r <= maxR; r++) {
            for (let cl = minC; cl <= maxC; cl++) {
                const x = (cl - minC) * cellW + pad;
                const y = (r - minR) * cellH + pad;
                const z = this.zones.find(zz => zz.col === cl && zz.row === r);
                const isActive = z && this.zones.indexOf(z) === this.activeIdx;
                if (z) {
                    // Zone existante
                    ctx.fillStyle = isActive ? '#3b82f6' : '#1e293b';
                    ctx.strokeStyle = isActive ? '#60a5fa' : '#475569';
                    ctx.lineWidth = isActive ? 2 : 1;
                    ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
                    ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
                    ctx.fillStyle = isActive ? '#fff' : '#94a3b8';
                    ctx.font = 'bold 11px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(z.name, x + cellW / 2, y + cellH / 2 - 4);
                    ctx.font = '9px sans-serif';
                    ctx.fillStyle = isActive ? '#bfdbfe' : '#64748b';
                    ctx.fillText(z.worldSizeX + '×' + z.worldSizeZ, x + cellW / 2, y + cellH / 2 + 10);
                } else {
                    // Cellule vide (potentielle zone)
                    ctx.strokeStyle = '#1e293b';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([4, 4]);
                    ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
                    ctx.setLineDash([]);
                    ctx.fillStyle = '#334155';
                    ctx.font = '16px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('+', x + cellW / 2, y + cellH / 2 + 5);
                }
            }
        }
        this._cellW = cellW;
        this._cellH = cellH;
        this._minC = minC;
        this._minR = minR;
        this._pad = pad;
        this._updateActiveLabel();
    }

    _onGridClick(e) {
        const rect = this._canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const cl = Math.floor((mx - this._pad) / this._cellW) + this._minC;
        const r = Math.floor((my - this._pad) / this._cellH) + this._minR;
        const z = this.zones.find(zz => zz.col === cl && zz.row === r);
        if (z) {
            this.loadZone(this.zones.indexOf(z));
        } else {
            // Cellule vide : créer une zone si adjacente à une existante
            const adjacent = this.zones.some(zz =>
                (Math.abs(zz.col - cl) + Math.abs(zz.row - r)) === 1
            );
            if (adjacent) {
                this.createZone(cl - this.zones[this.activeIdx].col, r - this.zones[this.activeIdx].row);
            }
        }
    }
}
window.ZoneManager = ZoneManager;

/**
 * GIGA PROMPT - Bloxd Terrain Editor
 * Fichier principal : terrain_editor_main.js
 * Rôle : Point d'entrée de l'application, initialisation des modules et coordination
 */

function initApp() {
    try {
        console.log("🚀 Lancement de Bloxd Terrain Editor...");

        if (typeof window.TerrainGenerator === 'undefined') {
            console.error("Les modules JS n'ont pas été chargés !");
            return;
        }

        // 1. Initialisation du Générateur
        const generator = new window.TerrainGenerator();
        generator.generateGrid();

        // 2. Initialisation de la vue 3D (Babylon.js)
        const map3d = new window.Map3D('map3d-container', generator);

        // 3. Initialisation de la vue 2D (Canvas) avec callback de modification
        const map2d = new window.Map2D('map2d-canvas', generator, (region) => {
            // Callback appelé à chaque coup de pinceau sur la carte 2D.
            // TACHE 2 : si la zone modifiée est connue, mise à jour 3D PARTIELLE
            // (seuls les vertices touchés sont réécrits) ; sinon rebuild complet.
            if (region && typeof map3d.updateTerrainRegion === 'function') {
                map3d.updateTerrainRegion(region.gxMin, region.gxMax, region.gzMin, region.gzMax);
            } else {
                map3d.updateTerrain();
            }
        });

        // 4. Initialisation du gestionnaire UI et des contrôles
        const ui = new window.UIManager(generator, map2d, map3d);

        window.generatorInstance = generator;
        window.map2dInstance = map2d;
        window.map3dInstance = map3d;
        window.uiManagerInstance = ui;

        // 5. Zone Manager (multi-terrain)
        const zoneManager = new window.ZoneManager(generator, map2d, map3d, ui);
        window.zoneManager = zoneManager;

        // Synchronisation initiale et premier affichage
        ui.syncUIWithConfig();
        map2d.render();
        map3d.updateTerrain();
        ui.updateStatsBar();

        if (window.applyLanguage && window.I18N) {
            window.applyLanguage(window.I18N.lang || 'fr');
        }

        // Masquer l'écran de chargement s'il est présent
        const loader = document.getElementById('app-loading');
        if (loader) {
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 400);
            }, 300);
        }

        console.log("✅ Bloxd Terrain Editor initialisé avec succès !");
    } catch (err) {
        console.error("Erreur lors de l'initialisation de l'application:", err);
        const loader = document.getElementById('app-loading');
        if (loader) {
            loader.innerHTML = `<div style="color: #ef4444; font-size: 2rem; margin-bottom: 16px;"><i class="fas fa-exclamation-triangle"></i></div>
            <h2 style="color: #fff; font-size: 1.2rem;">Erreur de chargement</h2>
            <p style="color: #f87171; margin-top: 8px; max-width: 500px; text-align: center;">${err.message}</p>`;
        }
    }
}

if (document.readyState === 'loading') {
// Empêche Ctrl/Cmd+S de déclencher la sauvegarde de la page (très gênant en édition).
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&(e.key==='s'||e.key==='S'))e.preventDefault();});
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // Si le document est déjà chargé
    setTimeout(initApp, 50);
}
