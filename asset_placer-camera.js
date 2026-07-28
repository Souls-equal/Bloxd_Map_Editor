/**
 * asset_placer-camera.js
 * Configuration FreeCamera (ZQSD/WASD)
 */

window.setupCamera = function(scene, canvas) {
    const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 15, -20), scene);
    camera.setTarget(BABYLON.Vector3.Zero());

    window.updateCameraKeys = function() {
        if (window.I18N && window.I18N.keyboard === 'qwerty') {
            camera.keysUp = [87];
            camera.keysDown = [83];
            camera.keysLeft = [65];
            camera.keysRight = [68];
        } else {
            camera.keysUp = [90, 87];
            camera.keysDown = [83];
            camera.keysLeft = [81];
            camera.keysRight = [68];
        }
    };
    window.updateCameraKeys();

    camera.inputs.removeByType("FreeCameraKeyboardInput");

    const inputMap = {};

    const getEventKey = (evt) => (typeof evt.key === 'string' ? evt.key.toLowerCase() : '');
    const getEventCode = (evt) => (typeof evt.code === 'string' ? evt.code : '');

    const focusSelected = () => {
        const selectionManager = window.appSelectionManager;
        const selected = selectionManager && selectionManager.selectedInstance;
        if (!selected || !selected.mesh) return;

        selected.mesh.computeWorldMatrix(true);
        let center = selected.mesh.getAbsolutePosition ? selected.mesh.getAbsolutePosition().clone() : selected.mesh.position.clone();
        let radius = 8;

        try {
            const bb = selected.mesh.getBoundingInfo().boundingBox;
            center = bb.centerWorld.clone();
            radius = Math.max(4, bb.extendSizeWorld.length());
        } catch (err) {}

        if (selected.isTerrainSelection && window.appTerrainManager && typeof window.appTerrainManager.getTerrainFocusInfo === 'function') {
            const info = window.appTerrainManager.getTerrainFocusInfo();
            const size = info.size || { x: 300, y: 1, z: 300 };
            const maxXZ = Math.max(size.x || 300, size.z || 300);
            const height = Math.max(1, size.y || 1);

            const target = info.topCenter.clone();
            target.y = info.maxY - Math.min(height * 0.35, 40);

            const distance = Math.min(900, Math.max(90, maxXZ * 0.18));
            const above = Math.min(650, Math.max(55, height * 1.8 + maxXZ * 0.04));
            camera.position.set(info.topCenter.x, info.maxY + above, info.topCenter.z - distance);
            camera.setTarget(target);
            return;
        }

        const forward = camera.getDirection(BABYLON.Axis.Z).normalize();
        const distance = Math.max(12, radius * 2.2);
        const targetPosition = center.subtract(forward.scale(distance));
        targetPosition.y = center.y + Math.max(8, radius * 0.55);

        camera.position.copyFrom(targetPosition);
        camera.setTarget(center);
    };

    // Cadre le terrain (son milieu) — utilisé par 'F' quand aucun asset n'est sélectionné.
    const focusTerrain = () => {
        const tm = window.appTerrainManager;
        if (!tm || !tm.hasTerrain()) return;
        const info = tm.getTerrainFocusInfo();
        const size = info.size || { x: 300, y: 1, z: 300 };
        const maxXZ = Math.max(size.x || 300, size.z || 300);
        const target = info.center.clone();
        const distance = Math.min(4000, Math.max(120, maxXZ * 0.9));
        const above = Math.min(3000, Math.max(80, maxXZ * 0.6));
        camera.position.set(info.center.x, (info.maxY || 0) + above, info.center.z - distance);
        camera.setTarget(target);
    };

    window.addEventListener('keydown', (evt) => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
        const key = getEventKey(evt);
        const code = getEventCode(evt);
        if (key) inputMap[key] = true;
        if (code) inputMap[code] = true;

        if (key === 'f') {
            evt.preventDefault();
            const sm = window.appSelectionManager;
            const sel = sm && sm.selectedInstance;
            // Asset sélectionné → on le cadre ; sinon → on cadre le terrain (son milieu).
            if (sel && sel.mesh && !sel.isTerrainSelection) focusSelected();
            else focusTerrain();
        }
        if (code === 'Space') evt.preventDefault();
    });

    window.addEventListener('keyup', (evt) => {
        const key = getEventKey(evt);
        const code = getEventCode(evt);
        if (key) inputMap[key] = false;
        if (code) inputMap[code] = false;
    });

    window.addEventListener('blur', () => {
        for (let key in inputMap) inputMap[key] = false;
    });

    scene.onBeforeRenderObservable.add(() => {
        const speed = 1.25;  // vitesse de base ×2.5 (était 0.5)
        const sprint = (inputMap['shift'] || inputMap['ShiftLeft'] || inputMap['ShiftRight']) ? 3 : 1;
        const sp = speed * sprint;
        const forward = camera.getDirection(BABYLON.Axis.Z);
        const right = camera.getDirection(BABYLON.Axis.X);
        forward.normalize();
        right.normalize();

        const isQwerty = window.I18N && window.I18N.keyboard === 'qwerty';

        if (inputMap['z'] || inputMap['w']) camera.position.addInPlace(forward.scale(sp));
        if (inputMap['s']) camera.position.addInPlace(forward.scale(-sp));
        if ((!isQwerty && inputMap['q']) || (isQwerty && inputMap['a'])) camera.position.addInPlace(right.scale(-sp));
        if (inputMap['d']) camera.position.addInPlace(right.scale(sp));

        if (inputMap['Space'] || inputMap[' ']) camera.position.y += sp;
        if (inputMap['ControlLeft'] || inputMap['ControlRight'] || inputMap['control']) camera.position.y -= sp;
    });

    camera.speed = 0.5;
    camera.angularSensibility = 500;
    camera.inertia = 0.6;

    let isLeftMouseDown = false;
    let isRightMouseDown = false;
    let previousMousePosition = { x: 0, y: 0 };

    canvas.addEventListener("pointerdown", (evt) => {
        if (window.isDraggingGizmo) return;
        if (evt.button === 0) isLeftMouseDown = true;
        if (evt.button === 2) isRightMouseDown = true;
        previousMousePosition = { x: evt.clientX, y: evt.clientY };
    });

    canvas.addEventListener("pointerup", (evt) => {
        if (evt.button === 0) isLeftMouseDown = false;
        if (evt.button === 2) isRightMouseDown = false;
    });

    canvas.addEventListener("contextmenu", (evt) => evt.preventDefault());

    canvas.addEventListener("pointermove", (evt) => {
        if (window.isDraggingGizmo) return;
        const deltaX = evt.clientX - previousMousePosition.x;
        const deltaY = evt.clientY - previousMousePosition.y;

        if (isLeftMouseDown) {
            const ROTATE_SENSITIVITY = 0.0009;
            camera.cameraRotation.y += deltaX * ROTATE_SENSITIVITY;
            camera.cameraRotation.x += deltaY * ROTATE_SENSITIVITY;
        } else if (isRightMouseDown) {
            const panSpeed = 0.05 * 0.75;
            const camRight = camera.getDirection(BABYLON.Axis.X);
            const camUp = camera.getDirection(BABYLON.Axis.Y);
            camera.position.addInPlace(camRight.scale(-deltaX * panSpeed));
            camera.position.addInPlace(camUp.scale(deltaY * panSpeed));
        }
        previousMousePosition = { x: evt.clientX, y: evt.clientY };
    });

    canvas.addEventListener("wheel", (evt) => {
        evt.preventDefault();
        const zoomSpeed = 2.5;
        const fwd = camera.getDirection(BABYLON.Axis.Z);
        camera.position.addInPlace(fwd.scale(Math.sign(evt.deltaY) * -zoomSpeed));
    }, { passive: false });

    return camera;
};
