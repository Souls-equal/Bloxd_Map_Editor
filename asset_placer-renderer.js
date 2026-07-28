/**
 * asset_placer-renderer.js
 * Optimized VertexData rendering for schematic assets (Babylon)
 */

const ASSET_BLOCK_COLORS = {
    1:  0x8a8a8a, 2:  0x6b4423, 3:  0x7a5434, 4:  0x4ea64e,
    5:  0xe8d98a, 6:  0x9aa3a8, 7:  0x8c8c8c, 8:  0xf5f9fc,
    28: 0x7d7d7d, 29: 0x6e6e6e, 31: 0x949494,
    9:  0x7a4d2a, 10: 0x6a4a2f, 11: 0x765036, 12: 0x725033,
    13: 0xb9b7aa, 14: 0x7d5a38, 21: 0x9a6b3c, 22: 0xd4c8a7,
    23: 0x9b6f45, 24: 0x9a6d40, 25: 0x8a663d, 26: 0x91643f,
    15: 0xa7773f, 16: 0xd6c79b, 17: 0x9e6745, 18: 0x9b7448,
    19: 0x8b693f, 20: 0x936743,
    100: 0x2f6f2d, 101: 0x8fb35a, 102: 0x3f8f35, 103: 0x4f8a3a,
    208: 0x2f6f2d, 209: 0x8fb35a, 210: 0x3f8f35, 211: 0x4f8a3a,
    491: 0x6b8f35, 492: 0x3b7a34, 493: 0x5b9f3a, 494: 0x6b8f35,
    495: 0x3b7a34, 496: 0x5b9f3a, 653: 0xc7772d, 654: 0xc7772d,
    911: 0x6ea84f, 938: 0x6ea84f, 1226: 0xe8a0b8, 1259: 0xe8a0b8,
    497: 0x6a4a2f, 498: 0x765036, 499: 0x725033, 500: 0xb9b7aa,
    501: 0x7d5a38, 502: 0x8a633b, 503: 0x8a633b, 504: 0xb07a44,
    909: 0x8c5f35, 910: 0xb9854c, 937: 0x8c5f35, 1222: 0x8b4a3c,
    1223: 0xa86b55, 1224: 0xa86b55, 1225: 0xc58a72, 1258: 0x8b4a3c,
    150: 0x56a832, 223: 0x6b4b2e, 1109: 0x4aa133, 1110: 0x5bb943
};

function colorFromHex(hex) {
    return {
        r: ((hex >> 16) & 255) / 255,
        g: ((hex >> 8) & 255) / 255,
        b: (hex & 255) / 255
    };
}

function getBlockColor(id) {
    // Palette fidèle BlockColors (identique au Terrain Editor) en priorité.
    if (window.BlockColors && typeof window.BlockColors.getBlockColor === 'function') {
        return colorFromHex(window.BlockColors.getBlockColor(id));
    }
    if (ASSET_BLOCK_COLORS[id] !== undefined) {
        return colorFromHex(ASSET_BLOCK_COLORS[id]);
    }
    // Fallback : couleur déterministe variée.
    const r = ((id * 37) % 90 + 90) / 255;
    const g = ((id * 73) % 90 + 85) / 255;
    const b = ((id * 109) % 70 + 70) / 255;
    return { r, g, b };
}
window.assetGetBlockColor = getBlockColor;

// Recentre la géométrie d'un mesh horizontalement (XZ) pour que la rotation se fasse
// autour du CENTRE du schem, pas d'un coin. Retourne l'offset appliqué {x, z}.
window.recenterMeshHorizontal = function (mesh) {
    try {
        if (typeof mesh.makeGeometryUnique === 'function') mesh.makeGeometryUnique();
        mesh.computeWorldMatrix(true);
        const bb = mesh.getBoundingInfo().boundingBox;
        const cx = (bb.minimum.x + bb.maximum.x) / 2;
        const cz = (bb.minimum.z + bb.maximum.z) / 2;
        mesh.position.x = -cx;
        mesh.position.z = -cz;
        if (typeof mesh.bakeCurrentTransformIntoVertices === 'function') mesh.bakeCurrentTransformIntoVertices();
        mesh.refreshBoundingInfo(true);
        return { x: cx, z: cz };
    } catch (e) { return { x: 0, z: 0 }; }
};

window.createMeshFromSchem = function(scene, schem) {
    const blocks = schem.blocks;
    if (!blocks || blocks.length === 0) return null;

    let allPositions = [], allIndices = [], allNormals = [], allColors = [];
    let vertexOffset = 0;

    const cubeData = BABYLON.VertexData.CreateBox({ size: 1 });
    const basePositions = cubeData.positions;
    const baseIndices = cubeData.indices;
    const baseNormals = cubeData.normals;

    for (const block of blocks) {
        if (!block || block.id === 0) continue;

        const bx = block.x || 0, by = block.y || 0, bz = block.z || 0;
        const color = getBlockColor(block.id);

        for (let i = 0; i < basePositions.length; i += 3) {
            allPositions.push(basePositions[i] + bx + 0.5);
            allPositions.push(basePositions[i+1] + by + 0.5);
            allPositions.push(basePositions[i+2] + bz + 0.5);
        }
        for (let i = 0; i < baseNormals.length; i++) allNormals.push(baseNormals[i]);
        for (let i = 0; i < baseIndices.length; i++) allIndices.push(baseIndices[i] + vertexOffset);

        const num = basePositions.length / 3;
        for (let v = 0; v < num; v++) {
            allColors.push(color.r, color.g, color.b, 1.0);
        }
        vertexOffset += num;
    }

    if (allPositions.length === 0) return null;

    const vertexData = new BABYLON.VertexData();
    vertexData.positions = new Float32Array(allPositions);
    vertexData.indices = allPositions.length / 3 > 65535 ? new Uint32Array(allIndices) : new Uint16Array(allIndices);
    vertexData.normals = new Float32Array(allNormals);
    vertexData.colors = new Float32Array(allColors);

    const mesh = new BABYLON.Mesh("schemMesh", scene);
    vertexData.applyToMesh(mesh);

    const material = new BABYLON.StandardMaterial("schemMat", scene);
    material.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
    material.useVertexColors = true;
    material.backFaceCulling = true;
    mesh.material = material;

    return mesh;
};
