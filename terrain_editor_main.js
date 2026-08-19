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
