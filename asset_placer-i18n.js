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
            autoTerraform: "Auto-terraform (foundation):"
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
            autoTerraform: "Auto-terraformer (fondations) :"
        }
    },

    t(key) {
        const dict = this.translations[this.lang] || this.translations.en;
        return dict[key] || this.translations.en[key] || key;
    }
};
