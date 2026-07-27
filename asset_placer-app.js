/**
 * asset_placer-app.js
 * Main Application Entry Point
 */

// Empêche Ctrl/Cmd+S de déclencher la sauvegarde de la page (très gênant en édition).
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&(e.key==='s'||e.key==='S'))e.preventDefault();});
window.addEventListener('DOMContentLoaded', () => {
    // Langue pilotée par le hub (clé partagée bloxdTools.lang)
    try { window.I18N.lang = localStorage.getItem('bloxdTools.lang') || 'en'; } catch(e) {}
    // Clavier piloté par le hub (clé partagée bloxdTools.keyboard)
    try { window.I18N.keyboard = localStorage.getItem('bloxdTools.keyboard') || 'azerty'; } catch(e) {}

    // Couleurs fidèles des blocs : on initialise la palette BlockColors avec la
    // table nom→id (→ chaque bloc retrouve sa vraie couleur, eau comprise).
    if (window.BlockColors && typeof window.BlockColors.initFromNameMap === 'function') {
        fetch('nameToId.json', { cache: 'force-cache' })
            .then(r => r.ok ? r.json() : null)
            .then(map => { if (map) window.BlockColors.initFromNameMap(map); })
            .catch(() => {});
    }

    const canvas = document.getElementById('renderCanvas');
    const canvasContainer = document.getElementById('canvas-container');

    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true }, true);
    window.appEngine = engine;

    const resizeBabylon = () => {
        if (!engine || engine.isDisposed) return;
        requestAnimationFrame(() => engine.resize());
    };
    window.appResize = resizeBabylon;

    const createScene = function () {
        const scene = new BABYLON.Scene(engine);
        window.appScene = scene;
        scene.clearColor = new BABYLON.Color4(0.12, 0.12, 0.12, 1);

        const camera = window.setupCamera(scene, canvas);

        scene.ambientColor = new BABYLON.Color3(0.55, 0.55, 0.55);

        const hemi = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
        hemi.intensity = 1.15;
        hemi.diffuse = new BABYLON.Color3(1, 1, 1);
        hemi.groundColor = new BABYLON.Color3(0.65, 0.65, 0.65);

        const dir = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene);
        dir.intensity = 0.25;

        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 300, height: 300 }, scene);
        const gMat = new BABYLON.StandardMaterial("groundMat", scene);
        gMat.diffuseColor = new BABYLON.Color3(0.18, 0.18, 0.18);
        gMat.specularColor = new BABYLON.Color3(0, 0, 0);
        ground.material = gMat;
        ground.isPickable = true;

        const grid = BABYLON.MeshBuilder.CreateGround("grid", { width: 300, height: 300, subdivisions: 300 }, scene);
        const gridMat = new BABYLON.StandardMaterial("gridMat", scene);
        gridMat.wireframe = true;
        gridMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        grid.material = gridMat;
        grid.position.y = 0.01;
        grid.isPickable = false;

        const assetManager = new window.AssetManager(scene);
        const terrainManager = new window.TerrainManager(scene, ground, grid);
        window.appTerrainManager = terrainManager;

        const selectionManager = new window.SelectionManager(scene, assetManager);
        window.appSelectionManager = selectionManager;

        new window.InputManager(scene, selectionManager);
        const dragDropManager = new window.DragDropManager(scene, assetManager, selectionManager, canvas);
        const libraryUI = new window.LibraryUI(assetManager, dragDropManager, terrainManager);
        new window.ExplorerUI(assetManager, terrainManager, selectionManager);
        new window.UIManager(scene, assetManager, selectionManager, dragDropManager);

        window.appExporter = new window.Exporter(assetManager, terrainManager);

        libraryUI.populateLibrary();

        if (window.SchematicLibraryLoader) {
            const loader = new window.SchematicLibraryLoader(scene, assetManager, libraryUI);
            window.appSchematicLibraryLoader = loader;
            loader.loadFromProjectFolder().then(count => {
                if (count > 0) libraryUI.populateLibrary();
            });
        }

        return scene;
    };

    const scene = createScene();

    engine.runRenderLoop(() => scene.render());

    window.addEventListener('resize', resizeBabylon, { passive: true });
    window.addEventListener('orientationchange', resizeBabylon, { passive: true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) resizeBabylon(); });

    if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(resizeBabylon);
        if (canvasContainer) ro.observe(canvasContainer);
        ro.observe(canvas);
    }

    resizeBabylon();
    requestAnimationFrame(resizeBabylon);
});
