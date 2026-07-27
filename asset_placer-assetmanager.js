/**
 * asset_placer-assetmanager.js
 * Asset manager (Babylon)
 *
 * Chargement LAZY : à l'inscription on stocke uniquement le schem + les métadonnées
 * (pas de mesh). Le mesh source n'est créé (et caché) qu'au 1er placement.
 * → permet de charger des centaines d'assets sans exploser la mémoire GPU.
 */

window.AssetManager = class AssetManager {
    constructor(scene) {
        this.scene = scene;
        this.templates = {};        // name -> sourceMesh (null tant que non créé à la demande)
        this.templateMeta = {};     // name -> metadata (catégorie, taille…)
        this.templateSchem = {};    // name -> schem (blocks[], size, totalBlocks)
        this.instances = [];
        this._nextId = 1;
        this.onChanged = null;
    }

    _notifyChanged() {
        if (typeof this.onChanged === 'function') this.onChanged(this.instances);
    }

    registerTemplate(name, sourceMesh, schemData = null, metadata = {}) {
        this.templateMeta[name] = metadata || {};
        if (schemData) this.templateSchem[name] = schemData;
        this.templates[name] = sourceMesh || null;  // null = mesh créé à la demande (lazy)

        if (sourceMesh) {
            if (schemData) sourceMesh.schemData = schemData;
            sourceMesh.name = `template_${name}`;
            sourceMesh.id = `template_${name}`;
            sourceMesh.isVisible = false;
            sourceMesh.visibility = 0;
            sourceMesh.isPickable = false;
            sourceMesh.metadata = Object.assign({}, sourceMesh.metadata, {
                isAssetTemplate: true,
                assetName: name,
                assetLibraryMeta: metadata || {}
            });
        }
    }

    getTemplateMeta(name) {
        return this.templateMeta[name] || {};
    }

    getTemplateSchem(name) {
        return this.templateSchem[name] || (this.templates[name] && this.templates[name].schemData) || null;
    }

    hasTemplate(name) {
        return Object.prototype.hasOwnProperty.call(this.templateSchem, name) || (this.templates[name] != null);
    }

    // Crée (et met en cache) le mesh source au 1er usage.
    _ensureSourceMesh(name) {
        if (this.templates[name]) return this.templates[name];
        const schem = this.templateSchem[name];
        if (!schem || !window.createMeshFromSchem) return null;
        const mesh = window.createMeshFromSchem(this.scene, schem);
        if (!mesh) return null;
        mesh.schemData = schem;
        mesh.name = `template_${name}`;
        mesh.id = `template_${name}`;
        mesh.isVisible = false;
        mesh.visibility = 0;
        mesh.isPickable = false;
        mesh.metadata = { isAssetTemplate: true, assetName: name, assetLibraryMeta: this.templateMeta[name] || {} };
        this.templates[name] = mesh;
        return mesh;
    }

    addInstance(name, position = new BABYLON.Vector3(0, 0, 0), rotationY = 0) {
        const sourceMesh = this._ensureSourceMesh(name);  // création lazy au 1er placement
        if (!sourceMesh) {
            console.error(`Template not found: ${name}`);
            return null;
        }
        const instance = new window.AssetInstance(this._nextId++, name, sourceMesh, this.scene);
        instance.position = position;
        instance.setRotation(rotationY);
        this.instances.push(instance);
        this._notifyChanged();
        return instance;
    }

    removeInstance(instanceId) {
        const index = this.instances.findIndex(inst => inst.id === instanceId);
        if (index !== -1) {
            this.instances[index].dispose();
            this.instances.splice(index, 1);
            this._notifyChanged();
            return true;
        }
        return false;
    }

    getInstanceByMesh(mesh) {
        if (!mesh) return null;
        const direct = this.instances.find(inst => inst.mesh === mesh);
        if (direct) return direct;
        const id = mesh.metadata && mesh.metadata.assetInstanceId;
        if (id !== undefined && id !== null) {
            return this.instances.find(inst => inst.id === id) || null;
        }
        return null;
    }
};
