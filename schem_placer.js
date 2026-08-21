/* ═══ babylon (isolé en IIFE pour éviter les collisions de globaux) ═══ */
(function(){
/**
 * Schem Placer - Babylon.js Module v4.0.0
 * FreeCamera fly, VertexData rendering, gizmo (Move) + sphere handles (Separate)
 */
(function() {
'use strict';

const CHUNK = 32, CHUNK_VOL = 32768, AIR_ID = 0;

/* Block colors — porté de block_colors.js (Three.js) : table EXPLICIT générée
   (laines/terres cuites/bétons/verres/planches/céramiques/pierres/minerais/...)
   + fallback par analyse du nom via nameToId.json. Corrige les couleurs et
   couvre un très grand nombre de blocs. */
const BC_HUE = {
    White:0xf2f2f2, Orange:0xea7e35, Magenta:0xc74ebd, 'Light Blue':0x6387d2,
    Yellow:0xb8a93a, Lime:0x72b828, Pink:0xe88da2, Gray:0x6a6a6a, 'Light Gray':0xa0a0a0,
    Cyan:0x6099a8, Purple:0x804dba, Blue:0x3c54ad, Brown:0x7b5536, Green:0x4d8a33,
    Red:0xa03333, Black:0x1b1b20, Maroon:0x6b1e1e, Teal:0x2f7f87, Indigo:0x3b3b8c,
    Gold:0xf2c94c, Bronze:0xa57a3f, Copper:0xc47d4a, Beige:0xd9c99a, Cream:0xf1e9ca, Silver:0xccccd6,
};
const BC_MAT = {
    wool:[1,1,1], concrete:[0.88,0.88,0.88], planks:[0.82,0.70,0.50],
    'baked clay':[0.85,0.78,0.70], clay:[0.95,0.95,0.95], glass:[1,1,1],
    ceramic:[0.95,0.95,1], tile:[0.92,0.92,0.95],
};
const BC_WOOD = {
    Maple:{log:0x8a6339,planks:0xc19a6b,leaves:0x5a9633,sapling:0x5a9633,barkless:0xc19a6b},
    Pine:{log:0x55463a,planks:0x8d7350,leaves:0x2d5c2c,sapling:0x3a7a3b,barkless:0x8d7350},
    Plum:{log:0x6a4b36,planks:0xa38264,leaves:0x4d7e39,sapling:0x558a3d,barkless:0xa38264,fruit:0x7a2a4b},
    Cedar:{log:0x5c4835,planks:0x8a6f4d,leaves:0x2e6a2f,sapling:0x3c7a3b,barkless:0x8a6f4d},
    Aspen:{log:0x9a8c76,planks:0xd1c08b,leaves:0x7bb34a,sapling:0x7bb34a,barkless:0xd1c08b},
    Elm:{log:0x7a5a3c,planks:0xa38054,leaves:0x48893a,sapling:0x48893a,barkless:0xa38054},
    Cherry:{log:0xb49070,planks:0xe0baa6,leaves:0x8e3a4f,sapling:0x8e3a4f,barkless:0xe0baa6},
    Palm:{log:0x786044,planks:0x9d835b,leaves:0x40893c,sapling:0x40893c,barkless:0x9d835b,coconut:0x6b4a2c},
    Pear:{log:0x765c42,planks:0xa78765,leaves:0x4e8d3d,sapling:0x4e8d3d,barkless:0xa78765,fruit:0x9cb74a},
};
const BC_METAL = {
    Stone:0x808080,'Smooth Stone':0x9a9a9a,Diorite:0xdcdcdc,Andesite:0x86847f,Granite:0x9b7c71,
    Sandstone:0xddc98a,Yellowstone:0xc3b070,Obsidian:0x140d23,Bedrock:0x2f2f34,Cobblestone:0x757575,
    Mossy:0x6b7a54,Cracked:0x777777,Bricks:0x934b42,'Stone Bricks':0x7f7f79,'Dark Red Brick':0x602924,
    'Dark Red Stone':0x5a2222,Coal:0x262628,Iron:0xd4d4d4,Gold:0xf3d04a,'Lapis Lazuli':0x2a4fa0,
    Emerald:0x3dd06b,Diamond:0x63d8e8,Quartz:0xf4efe4,Moonstone:0x8ab8e0,Magma:0xff6a1f,
    Water:0x2a7bc0,Ice:0xa8d6ee,Snow:0xf5f9fc,Glass:0xcfe8f5,Sponge:0xd6b751,Beacon:0xd8f1ff,
    Hay:0xc8a841,Cactus:0x3f803a,Grass:0x5aa03a,Dirt:0x6e4b2a,Sand:0xe6d797,Clay:0xa2aaa8,
    Gravel:0x888888,Chalk:0xf8f8f0,Lava:0xff5522,Redstone:0xaa1c1c,
};
const BC_FLOWER_BY_COLOR = {
    red:0xd93c3c, orange:0xe27d2e, yellow:0xeacb3d, lime:0x83c92c, green:0x3e9030,
    cyan:0x3fb8b3, 'light blue':0x5aaee0, blue:0x3e5bc4, purple:0x8b4fc8, magenta:0xc54fb6,
    pink:0xea8ba6, white:0xf5f5f5, gray:0x8a8a8a, 'light gray':0xbfbfbf, black:0x202028, brown:0x8a5f3a,
};
function _bcHexToRgb(h){return[(h>>16)&255,(h>>8)&255,h&255];}
function _bcClamp(v){return Math.max(0,Math.min(255,Math.round(v)));}
function _bcRgbToHex(r,g,b){return((_bcClamp(r)<<16)|(_bcClamp(g)<<8)|_bcClamp(b))>>>0;}
function _bcMultiply(h,f){const[r,g,b]=_bcHexToRgb(h);const[fr,fg,fb]=typeof f==='number'?[f,f,f]:f;return _bcRgbToHex(r*fr,g*fg,b*fb);}
function _bcMix(h1,h2,t){const a=_bcHexToRgb(h1),b=_bcHexToRgb(h2);return _bcRgbToHex(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t);}
function _bcColored(hueName,material){let base=BC_HUE[hueName]!==undefined?BC_HUE[hueName]:0x909090;if(material){if(material==='planks')base=_bcMix(base,0x7a5a3a,0.55);else if(material==='baked clay')base=_bcMix(base,0x9b6f50,0.35);else{const adj=BC_MAT[material];if(adj)base=_bcMultiply(base,adj);}}return base;}
function _bcFindHue(n){
    if(/\blight blue\b/.test(n))return'Light Blue';if(/\blight gray\b/.test(n))return'Light Gray';
    if(/\bwhite\b/.test(n))return'White';if(/\borange\b/.test(n))return'Orange';if(/\bmagenta\b/.test(n))return'Magenta';
    if(/\byellow\b/.test(n))return'Yellow';if(/\blime\b/.test(n))return'Lime';if(/\bpink\b/.test(n))return'Pink';
    if(/\bgray\b/.test(n))return'Gray';if(/\bcyan\b/.test(n))return'Cyan';if(/\bpurple\b/.test(n))return'Purple';
    if(/\bblue\b/.test(n))return'Blue';if(/\bbrown\b/.test(n))return'Brown';if(/\bgreen\b/.test(n))return'Green';
    if(/\bred\b/.test(n))return'Red';if(/\bblack\b/.test(n))return'Black';return null;
}
function _bcWood(n){for(const k of Object.keys(BC_WOOD)){if(new RegExp('\\b'+k.toLowerCase()+'\\b').test(n))return BC_WOOD[k];}return null;}
function _bcFallbackColor(name){
    const l=name.toLowerCase();
    if(/^air\b|\bair\b/.test(l)&&!/plane/.test(l))return 0x000000;
    if(/unloaded|placeholder|unused|invisible|ghost/i.test(l))return 0x20202a;
    const w=_bcWood(l);
    if(w){if(/\blog\b/.test(l))return w.log;if(/barkless/.test(l))return w.barkless;if(/\bplanks?\b/.test(l))return w.planks;if(/\bleaves?\b|canopy|hedge/.test(l))return w.leaves;if(/sapling/.test(l))return w.sapling;if(/door|trapdoor|ladder|fence|gate|stairs|slab|button|plate|sign/.test(l))return _bcMultiply(w.planks,0.92);if(/coconut/.test(l))return w.coconut||0x6b4a2c;return w.log;}
    if(/dandelion/.test(l))return 0xfde04c;
    if(/poppy|tulip|daisy|bluebell|allium|bluet|lily|rose|flower/.test(l)){const h=_bcFindHue(l);if(h&&BC_FLOWER_BY_COLOR[h.toLowerCase()])return BC_FLOWER_BY_COLOR[h.toLowerCase()];if(/poppy|rose|red/.test(l))return 0xd83030;if(/tulip|pink/.test(l))return 0xe85a7a;if(/daisy|white/.test(l))return 0xf2f2f2;if(/bluebell|blue/.test(l))return 0x4461d6;if(/allium|purple/.test(l))return 0x9c63c8;return 0xff76a6;}
    if(/sapling|vine|leaves|hedge|bush|grass/.test(l))return 0x3f8a37;
    if(/cactus/.test(l))return 0x3e8139;if(/pumpkin|jack/.test(l))return 0xd07a1f;if(/watermelon|melon/.test(l))return 0x3c9a3e;
    if(/smooth stone/.test(l))return BC_METAL['Smooth Stone'];if(/stone brick/.test(l))return BC_METAL['Stone Bricks'];
    if(/dark red brick/.test(l))return BC_METAL['Dark Red Brick'];if(/dark red stone/.test(l))return BC_METAL['Dark Red Stone'];
    if(/cobble|rocky/.test(l))return BC_METAL.Cobblestone;if(/mossy/.test(l))return BC_METAL.Mossy;if(/cracked/.test(l))return BC_METAL.Cracked;
    if(/diorite/.test(l))return BC_METAL.Diorite;if(/andesite/.test(l))return BC_METAL.Andesite;if(/granite/.test(l))return BC_METAL.Granite;
    if(/sandstone/.test(l))return BC_METAL.Sandstone;if(/yellowstone/.test(l))return BC_METAL.Yellowstone;if(/obsidian|obby/.test(l))return BC_METAL.Obsidian;
    if(/bedrock/.test(l))return BC_METAL.Bedrock;if(/brick/.test(l))return BC_METAL.Bricks;if(/stone/.test(l))return BC_METAL.Stone;
    if(/engraved|marked|patterned|chiseled/.test(l))return _bcMultiply(BC_METAL['Smooth Stone'],0.95);
    if(/lapis/.test(l))return BC_METAL['Lapis Lazuli'];if(/emerald/.test(l))return BC_METAL.Emerald;if(/diamond/.test(l))return BC_METAL.Diamond;
    if(/redstone/.test(l))return BC_METAL.Redstone;if(/coal/.test(l))return BC_METAL.Coal;if(/gold/.test(l))return BC_METAL.Gold;if(/iron/.test(l))return BC_METAL.Iron;
    if(/moonstone/.test(l))return BC_METAL.Moonstone;if(/quartz/.test(l))return BC_METAL.Quartz;if(/magma|lava|volcano/.test(l))return BC_METAL.Magma;
    if(/water/.test(l))return BC_METAL.Water;if(/ice/.test(l))return BC_METAL.Ice;if(/snow|packed/.test(l))return BC_METAL.Snow;
    if(/glass|pane/.test(l))return BC_METAL.Glass;if(/sponge/.test(l))return BC_METAL.Sponge;if(/beacon/.test(l))return BC_METAL.Beacon;
    if(/hay|straw|wheat|corn|rice|cotton|cranberr/.test(l))return 0xc3a041;if(/tilled|farmland|dirt|mud/.test(l))return BC_METAL.Dirt;
    if(/red sand/.test(l))return 0xc55c3e;if(/sand|beach/.test(l))return BC_METAL.Sand;if(/clay/.test(l))return BC_METAL.Clay;if(/gravel|pebble/.test(l))return BC_METAL.Gravel;if(/chalk/.test(l))return 0xf5f5ef;
    if(/lamp.*on|torch|glowstone|lantern|lit/.test(l))return 0xffd672;if(/lamp.*off/.test(l))return 0x806d40;
    if(/furnace/.test(l))return 0x4a4a4a;if(/workbench|artisan/.test(l))return 0x8a5f3a;if(/chest|loot|crate/.test(l))return 0x9a6b3a;if(/protector/.test(l))return 0x6352ff;if(/bookshelf|book/.test(l))return 0x8e5d32;
    const hue=_bcFindHue(l);const mat=/\bwool\b/.test(l)?'wool':/\bconcrete\b/.test(l)?'concrete':/\bplanks?\b/.test(l)?'planks':/\bbaked clay\b|\bterracotta\b/.test(l)?'baked clay':/\b(glass|pane)\b/.test(l)?'glass':/\bceramic\b/.test(l)?'ceramic':/\btile/.test(l)?'tile':null;
    if(hue)return _bcColored(hue,mat);
    if(mat==='planks')return 0xa0794b;if(mat==='baked clay')return 0xa0664b;
    let h=(name.length*2654435761^(name.charCodeAt(0)||0)*2246822519)>>>0;
    return _bcRgbToHex(60+((h>>16)&127),60+((h>>8)&127),60+(h&127));
}
const BC_EXPLICIT = {
    0:0x000000,1:0x1a1a22,2:BC_METAL.Dirt,3:_bcMultiply(BC_METAL.Dirt,0.92),4:0x4da64d,5:BC_METAL.Sand,6:BC_METAL.Clay,7:BC_METAL.Gravel,8:BC_METAL.Snow,
    28:BC_METAL.Stone,29:_bcMultiply(BC_METAL.Stone,0.88),31:BC_METAL['Smooth Stone'],32:BC_METAL.Diorite,33:_bcMultiply(BC_METAL.Diorite,0.98),
    34:BC_METAL.Andesite,35:_bcMultiply(BC_METAL.Andesite,0.97),36:BC_METAL.Granite,37:_bcMultiply(BC_METAL.Granite,0.98),38:BC_METAL.Sandstone,39:BC_METAL.Yellowstone,
    40:0x2e2e32,41:0x96938f,42:0x9e8e6a,43:0x4b638b,44:0x4f7c56,45:0x788f94,46:BC_METAL.Coal,47:BC_METAL.Iron,48:BC_METAL.Gold,49:BC_METAL['Lapis Lazuli'],50:BC_METAL.Emerald,
    126:BC_METAL.Water,127:0x3a3a44,128:BC_METAL.Bricks,129:BC_METAL['Stone Bricks'],130:BC_METAL['Dark Red Brick'],131:BC_METAL['Dark Red Stone'],
    132:BC_METAL.Quartz,133:_bcMultiply(BC_METAL.Quartz,0.95),134:_bcMultiply(BC_METAL['Smooth Stone'],0.97),135:BC_METAL.Mossy,136:BC_METAL.Cracked,
    137:_bcMultiply(BC_METAL.Sandstone,1.02),138:BC_METAL.Sandstone,139:BC_METAL.Ice,140:BC_METAL.Obsidian,141:BC_METAL.Hay,142:BC_METAL.Sponge,143:BC_METAL.Beacon,
    145:BC_METAL.Gold,146:BC_METAL.Moonstone,147:BC_METAL.Bedrock,149:BC_METAL.Cactus,150:0x5aa03a,223:_bcMultiply(BC_METAL.Dirt,0.95),471:BC_METAL.Magma,475:_bcMultiply(BC_METAL.Sandstone,0.90),650:0xc35a3c,1222:BC_WOOD.Cherry.log,
};
(function(){
    const W=['White','Orange','Magenta','Light Blue','Yellow','Lime','Pink','Gray','Light Gray','Cyan','Purple','Blue','Brown','Green','Red','Black'];
    const CONC=['Gray','Light Gray','Black','Blue','Brown','Cyan','Light Blue','Lime','Magenta','Orange','Pink','Purple','Red','White','Green','Yellow'];
    const GLASS=['Black','Blue','Brown','Cyan','Gray','Light Gray','Green','Light Blue','Lime','Magenta','Orange','Pink','Purple','Red','White','Yellow'];
    let id;
    id=51;W.forEach(h=>{BC_EXPLICIT[id++]=_bcColored(h,'wool');});
    BC_EXPLICIT[67]=0xa0664b;id=68;W.forEach(h=>{BC_EXPLICIT[id++]=_bcColored(h,'baked clay');});
    id=84;CONC.forEach(h=>{BC_EXPLICIT[id++]=_bcColored(h,'concrete');});
    BC_EXPLICIT[100]=BC_WOOD.Pine.leaves;BC_EXPLICIT[101]=BC_WOOD.Aspen.leaves;BC_EXPLICIT[102]=BC_WOOD.Maple.leaves;BC_EXPLICIT[103]=BC_WOOD.Elm.leaves;
    BC_EXPLICIT[106]=BC_METAL.Glass;id=107;GLASS.forEach(h=>{BC_EXPLICIT[id++]=_bcMultiply(_bcColored(h,'glass'),0.85);});
    BC_EXPLICIT[123]=0xff00ff;BC_EXPLICIT[124]=0xffe680;BC_EXPLICIT[125]=0xc8a74c;
    id=228;W.forEach(h=>{BC_EXPLICIT[id++]=_bcColored(h,'planks');});
    id=245;for(let r=0;r<4;r++){W.forEach(h=>{BC_EXPLICIT[id++]=_bcColored(h,'ceramic');});}
})();
let BC_ID_TO_NAME={};const BC_CACHE={};
function initBlockNameMap(nameToId){
    BC_ID_TO_NAME={};
    if(nameToId)for(const n in nameToId){const i=nameToId[n];if(BC_ID_TO_NAME[i]===undefined)BC_ID_TO_NAME[i]=n;}
    // wood species by name
    if(nameToId)for(const wname in BC_WOOD){const p=BC_WOOD[wname];
        const L=wname+' Log',P=wname+' Wood Planks',LV=wname+' Leaves',S=wname+' Sapling',B='Barkless '+wname+' Log';
        if(nameToId[L]!==undefined)BC_EXPLICIT[nameToId[L]]=p.log;
        if(nameToId[P]!==undefined)BC_EXPLICIT[nameToId[P]]=p.planks;
        if(nameToId[LV]!==undefined)BC_EXPLICIT[nameToId[LV]]=p.leaves;
        if(nameToId[S]!==undefined)BC_EXPLICIT[nameToId[S]]=p.sapling;
        if(nameToId[B]!==undefined)BC_EXPLICIT[nameToId[B]]=p.barkless;
    }
    for(const k in BC_CACHE)delete BC_CACHE[k];
}
function _blockColorHex(id){
    if(BC_EXPLICIT[id]!==undefined)return BC_EXPLICIT[id];
    if(BC_CACHE[id]!==undefined)return BC_CACHE[id];
    let c;
    const name=BC_ID_TO_NAME[id];
    if(name)c=_bcFallbackColor(name);
    else{let h=(id*2654435761)>>>0;c=_bcRgbToHex(60+((h>>16)&127),60+((h>>8)&127),60+(h&127));}
    BC_CACHE[id]=c;return c;
}
function getBlockColor(id){return hexToColor3(_blockColorHex(id));}
function hexToColor3(h){return new BABYLON.Color3(((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255);}

/* References */
let state=null,scene=null,engine=null,camera=null,canvas=null;
let outlineMesh=null,outlineMaterial=null;
let snapPlane=null,cutBox=null,cutHandles={};
let multiOutlines=[];
let gizmoEl=null;
let ptrX=0,ptrY=0;

/* =========================================
   INIT
   ========================================= */
function initBabylon(){
    canvas=document.getElementById('babylon-canvas');
    if(!canvas){console.error('Canvas not found');return;}
    engine=new BABYLON.Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true},true);
    scene=new BABYLON.Scene(engine);
    scene.clearColor=new BABYLON.Color4(0.12,0.12,0.12,1);

    // FreeCamera fly
    camera=new BABYLON.FreeCamera("cam",new BABYLON.Vector3(80,50,-80),scene);
    camera.setTarget(new BABYLON.Vector3(30,10,30));
    camera.inputs.removeByType("FreeCameraKeyboardInput");
    camera.speed=2.0;camera.inertia=0.6;

    let isLM=false,isRM=false,prevMouse={x:0,y:0};
    canvas.addEventListener("pointerdown",evt=>{
        if(state.gizmoDragging)return;
        if(evt.button===0)isLM=true;
        if(evt.button===2)isRM=true;
        prevMouse={x:evt.clientX,y:evt.clientY};
    });
    canvas.addEventListener("pointerup",evt=>{
        if(evt.button===0)isLM=false;
        if(evt.button===2)isRM=false;
    });
    canvas.addEventListener("contextmenu",evt=>evt.preventDefault());
    canvas.addEventListener("pointermove",evt=>{
        if(state.gizmoDragging)return;
        const dx=evt.clientX-prevMouse.x,dy=evt.clientY-prevMouse.y;
        if(isLM){camera.cameraRotation.y+=dx*0.0009;camera.cameraRotation.x+=dy*0.0009;}
        else if(isRM){
            const r=camera.getDirection(BABYLON.Axis.X),u=camera.getDirection(BABYLON.Axis.Y);
            camera.position.addInPlace(r.scale(-dx*0.0375));camera.position.addInPlace(u.scale(dy*0.0375));
        }
        prevMouse={x:evt.clientX,y:evt.clientY};
    });
    canvas.addEventListener("wheel",evt=>{
        evt.preventDefault();
        const f=camera.getDirection(BABYLON.Axis.Z);
        camera.position.addInPlace(f.scale(Math.sign(evt.deltaY)*-2.5));
    },{passive:false});

    // Fly keyboard
    const inputMap={};
    window.addEventListener('keydown',evt=>{
        if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;
        const k=typeof evt.key==='string'?evt.key.toLowerCase():'';
        if(k)inputMap[k]=true;
        if(evt.code==='Space')evt.preventDefault();
    });
    window.addEventListener('keyup',evt=>{
        const k=typeof evt.key==='string'?evt.key.toLowerCase():'';
        if(k)inputMap[k]=false;
    });
    window.addEventListener('blur',()=>{for(let k in inputMap)inputMap[k]=false;});
    scene.onBeforeRenderObservable.add(()=>{
        if(state.gizmoDragging)return;
        const sp=camera.speed*(state.shiftDown?10:1);
        const fw=camera.getDirection(BABYLON.Axis.Z).normalize();
        const rt=camera.getDirection(BABYLON.Axis.X).normalize();
        const kb=(localStorage.getItem('bloxdTools.keyboard')||'azerty');
        const fwdKey=kb==='qwerty'?'w':'z';
        const leftKey=kb==='qwerty'?'a':'q';
        if(inputMap[fwdKey])camera.position.addInPlace(fw.scale(sp));
        if(inputMap['s'])camera.position.addInPlace(fw.scale(-sp));
        if(inputMap[leftKey])camera.position.addInPlace(rt.scale(-sp));
        if(inputMap['d'])camera.position.addInPlace(rt.scale(sp));
        if(inputMap[' '])camera.position.y+=sp;
        if(inputMap['control'])camera.position.y-=sp;
    });

    // Lighting
    scene.ambientColor=new BABYLON.Color3(0.55,0.55,0.55);
    const hemi=new BABYLON.HemisphericLight("hl",new BABYLON.Vector3(0,1,0),scene);
    hemi.intensity=1.15;hemi.diffuse=new BABYLON.Color3(1,1,1);hemi.groundColor=new BABYLON.Color3(0.65,0.65,0.65);
    const dir=new BABYLON.DirectionalLight("dl",new BABYLON.Vector3(-1,-2,-1),scene);dir.intensity=0.25;

    // Ground + grid
    const gnd=BABYLON.MeshBuilder.CreateGround("ground",{width:300,height:300},scene);
    const gm=new BABYLON.StandardMaterial("gm",scene);gm.diffuseColor=new BABYLON.Color3(0.18,0.18,0.18);gm.specularColor=BABYLON.Color3.Black();gnd.material=gm;gnd.isPickable=true;
    const grid=BABYLON.MeshBuilder.CreateGround("grid",{width:300,height:300,subdivisions:300},scene);
    const gridm=new BABYLON.StandardMaterial("gridm",scene);gridm.wireframe=true;gridm.diffuseColor=new BABYLON.Color3(0.3,0.3,0.3);grid.material=gridm;grid.position.y=0.01;grid.isPickable=false;

    // Outline
    outlineMaterial=new BABYLON.StandardMaterial('ol',scene);
    outlineMaterial.diffuseColor=new BABYLON.Color3(0.29,0.66,1);outlineMaterial.emissiveColor=outlineMaterial.diffuseColor.scale(0.15);
    outlineMaterial.alpha=0.15;outlineMaterial.backFaceCulling=false;outlineMaterial.disableLighting=true;

    // Snap
    snapPlane=BABYLON.MeshBuilder.CreatePlane('sp',{size:1},scene);
    snapPlane.isVisible=false;snapPlane.isPickable=false;snapPlane.renderingGroupId=1;
    const sm=new BABYLON.StandardMaterial('sm',scene);
    sm.diffuseColor=new BABYLON.Color3(0.24,0.83,0.54);sm.emissiveColor=sm.diffuseColor.scale(0.5);
    sm.alpha=0.5;sm.backFaceCulling=false;sm.disableLighting=true;sm.sideOrientation=BABYLON.Mesh.DOUBLESIDE;snapPlane.material=sm;

    // Cut box (created ONCE, unit size — scaled/positioned in syncCutBoxFromData)
    cutBox=BABYLON.MeshBuilder.CreateBox('cutBox',{size:1},scene);
    cutBox.isVisible=false;cutBox.isPickable=false;cutBox.renderingGroupId=1;
    const cm=new BABYLON.StandardMaterial('cbm',scene);
    cm.diffuseColor=new BABYLON.Color3(1,0.69,0.13);cm.emissiveColor=cm.diffuseColor.scale(0.08);
    cm.alpha=0.3;cm.backFaceCulling=false;cm.disableLighting=true;
    cutBox.material=cm;cutBox.enableEdgesRendering();cutBox.edgesWidth=2.0;cutBox.edgesColor=new BABYLON.Color4(1,0.69,0.13,1);
    cutBox.scaling.set(1,1,1);

    // Cut handles: 6 colored spheres (mode Séparer), x=red y=green z=blue
    cutHandles={};
    const handleColors={x:0xff4b5c,y:0x4ade80,z:0x4a9fff};
    ['x0','x1','y0','y1','z0','z1'].forEach(name=>{
        const cc=handleColors[name[0]];
        const sph=BABYLON.MeshBuilder.CreateSphere('cutH_'+name,{diameter:1.8,segments:12},scene);
        const hm=new BABYLON.StandardMaterial('cutHm_'+name,scene);
        hm.diffuseColor=hexToColor3(cc);hm.emissiveColor=hexToColor3(cc).scale(0.5);
        hm.specularColor=BABYLON.Color3.Black();hm.disableLighting=true;
        sph.material=hm;sph.isVisible=false;sph.isPickable=false;sph.renderingGroupId=2;
        sph.metadata={cutHandle:name};
        cutHandles[name]=sph;
    });

    // Gizmo DOM reference
    gizmoEl=document.getElementById('gizmo');

    // Events — pointermove/up on window so drags continue even off-canvas (gizmo handles live outside the canvas)
    window.addEventListener('pointermove',onPointerMove);
    canvas.addEventListener('pointerdown',onCanvasPointerDown);
    window.addEventListener('pointerup',onPointerUp);
    if(gizmoEl)gizmoEl.addEventListener('pointerdown',onGizmoPointerDown,true);
    window.addEventListener('resize',()=>{if(engine)engine.resize();});

    // Render
    engine.runRenderLoop(()=>{updateGizmo();syncCutHandlesScale();scene.render();});
}

/* =========================================
   PROJECTION HELPERS (world <-> screen)
   ========================================= */
function pointerToRender(e){
    const r=canvas.getBoundingClientRect();
    const w=engine.getRenderWidth(),h=engine.getRenderHeight();
    return{x:(e.clientX-r.left)*(w/r.width),y:(e.clientY-r.top)*(h/r.height),w,h};
}
function worldToScreen(pos){
    const r=canvas.getBoundingClientRect();
    const w=engine.getRenderWidth(),h=engine.getRenderHeight();
    const vp=camera.viewport.toGlobal(w,h);
    const viewProj=camera.getViewMatrix().multiply(camera.getProjectionMatrix());
    const v=BABYLON.Vector3.Project(pos,BABYLON.Matrix.Identity(),viewProj,vp);
    return{x:v.x*(r.width/w),y:v.y*(r.height/h),z:v.z,visible:v.z>=0&&v.z<=1};
}
function raycastMouseToPlane(e,plane){
    const{x:px,y:py,w,h}=pointerToRender(e);
    const viewMatrix=camera.getViewMatrix(),projMatrix=camera.getProjectionMatrix();
    const near=BABYLON.Vector3.Unproject(new BABYLON.Vector3(px,py,0),w,h,BABYLON.Matrix.Identity(),viewMatrix,projMatrix);
    const far=BABYLON.Vector3.Unproject(new BABYLON.Vector3(px,py,1),w,h,BABYLON.Matrix.Identity(),viewMatrix,projMatrix);
    const dir=far.subtract(near).normalize();
    const denom=BABYLON.Vector3.Dot(dir,plane.normal);
    if(Math.abs(denom)<1e-5)return null;
    const t=-(BABYLON.Vector3.Dot(near,plane.normal)+plane.d)/denom;
    if(!isFinite(t)||t<0)return null;
    return near.add(dir.scale(t));
}
// Plane containing `axisVec`, facing the camera (used for axis-constrained drags)
function axisDragPlane(axisVec,centerPoint){
    const absX=Math.abs(axisVec.x),absY=Math.abs(axisVec.y),absZ=Math.abs(axisVec.z);
    let u;
    if(absX<=absY&&absX<=absZ)u=new BABYLON.Vector3(1,0,0);
    else if(absY<=absX&&absY<=absZ)u=new BABYLON.Vector3(0,1,0);
    else u=new BABYLON.Vector3(0,0,1);
    const v1=BABYLON.Vector3.Cross(axisVec,u).normalize();
    const v2=BABYLON.Vector3.Cross(axisVec,v1).normalize();
    const camDir=camera.getDirection(BABYLON.Axis.Z);
    let n=Math.abs(BABYLON.Vector3.Dot(v1,camDir))>=Math.abs(BABYLON.Vector3.Dot(v2,camDir))?v1:v2;
    if(BABYLON.Vector3.Dot(n,camDir)>0)n=n.scale(-1);
    return BABYLON.Plane.FromPositionAndNormal(centerPoint,n);
}
// Fallback: project mouse pixel motion onto an axis' screen direction (world units)
function screenProjectAxisDrag(axisWorld,e,startClient){
    let center;
    const g=state.gizmoDragging;
    if(g&&g.startPoint)center=g.startPoint;
    else if(g&&g.startHit)center=g.startHit;
    else if(state.selected){
        const b=state.selected.aabb;
        center=new BABYLON.Vector3(state.selected.pos.x+(b.minX+b.maxX)*0.5,state.selected.pos.y+(b.minY+b.maxY)*0.5,state.selected.pos.z+(b.minZ+b.maxZ)*0.5);
    }else{
        center=camera.position.add(camera.getDirection(BABYLON.Axis.Z).scale(80));
    }
    const p0=worldToScreen(center);
    const p1=worldToScreen(center.add(axisWorld));
    if(!p0.visible||!p1.visible)return 0;
    const dxPx=p1.x-p0.x,dyPx=p1.y-p0.y;
    const lenPx=Math.hypot(dxPx,dyPx);
    if(lenPx<0.01)return 0;
    const sdx=e.clientX-startClient.x,sdy=e.clientY-startClient.y;
    return(sdx*dxPx+sdy*dyPx)/(lenPx*lenPx);
}
// Fallback for planar (ground) drag → {x,z} world units
function screenProjectPlanarDrag(e,startClient){
    const inst=state.selected;if(!inst)return{x:0,z:0};
    const b=inst.aabb;
    const center=new BABYLON.Vector3(inst.pos.x+(b.minX+b.maxX)*0.5,inst.pos.y,inst.pos.z+(b.minZ+b.maxZ)*0.5);
    const p0=worldToScreen(center);
    const px=worldToScreen(center.add(new BABYLON.Vector3(1,0,0)));
    const pz=worldToScreen(center.add(new BABYLON.Vector3(0,0,1)));
    if(!p0.visible||!px.visible||!pz.visible)return{x:0,z:0};
    const sdx=e.clientX-startClient.x,sdy=e.clientY-startClient.y;
    const ax=px.x-p0.x,ay=px.y-p0.y,bx=pz.x-p0.x,by=pz.y-p0.y;
    const det=ax*by-ay*bx;
    if(Math.abs(det)<1e-4)return{x:0,z:0};
    return{x:(sdx*by-sdy*bx)/det,z:(ax*sdy-ay*sdx)/det};
}

/* =========================================
   GIZMO 2D (écran) — mode Déplacer
   ========================================= */
function gizmoPixelLength(){
    const inst=state.selected;if(!inst)return 55;
    const b=inst.aabb;
    const center=new BABYLON.Vector3(inst.pos.x+(b.minX+b.maxX)*0.5,inst.pos.y+(b.minY+b.maxY)*0.5,inst.pos.z+(b.minZ+b.maxZ)*0.5);
    const dist=BABYLON.Vector3.Distance(camera.position,center);
    return Math.max(28,Math.min(110,55*(dist/80)));
}
function updateGizmo(){
    if(!gizmoEl)return;
    const inst=state.selected;
    const svg=gizmoEl.querySelector('#gizmo-svg');
    const showArrows=state.mode==='move'&&inst&&!inst.locked;
    gizmoEl.style.display=showArrows?'block':'none';
    if(!showArrows||!svg)return;
    const b=inst.aabb;
    // ancre = angle min du schem (bounding box)
    const corner3=new BABYLON.Vector3(inst.pos.x+b.minX,inst.pos.y+b.minY,inst.pos.z+b.minZ);
    const O=worldToScreen(corner3);
    if(!O.visible){gizmoEl.style.display='none';return;}
    const L=gizmoPixelLength();
    const rect=canvas.getBoundingClientRect();
    gizmoEl.style.left=rect.left+'px';gizmoEl.style.top=rect.top+'px';
    gizmoEl.style.width=rect.width+'px';gizmoEl.style.height=rect.height+'px';
    svg.setAttribute('width',rect.width);svg.setAttribute('height',rect.height);
    svg.setAttribute('viewBox','0 0 '+rect.width+' '+rect.height);
    function screenDir(v){
        const p1=worldToScreen(corner3);
        const p2=worldToScreen(corner3.add(v));
        const dx=p2.x-p1.x,dy=p2.y-p1.y;const len=Math.hypot(dx,dy)||1;
        return{dx:dx/len,dy:dy/len};
    }
    const worldOffset=Math.max(4,(L/55)*6);
    const dirs={x:screenDir(new BABYLON.Vector3(worldOffset,0,0)),y:screenDir(new BABYLON.Vector3(0,worldOffset,0)),z:screenDir(new BABYLON.Vector3(0,0,worldOffset))};
    const headLen=Math.max(11,L*0.3),headW=Math.max(5,L*0.14);
    ['x','y','z'].forEach(axis=>{
        const grp=svg.querySelector('.gaxis[data-axis="'+axis+'"]');if(!grp)return;
        const d=dirs[axis];const ox=O.x,oy=O.y;
        const tx=ox+d.dx*L,ty=oy+d.dy*L;
        const hit=grp.querySelector('.ghit'),shaft=grp.querySelector('.gshaft');
        hit.setAttribute('x1',ox);hit.setAttribute('y1',oy);hit.setAttribute('x2',tx);hit.setAttribute('y2',ty);
        shaft.setAttribute('x1',ox);shaft.setAttribute('y1',oy);shaft.setAttribute('x2',tx);shaft.setAttribute('y2',ty);
        const bx=tx-d.dx*headLen,by=ty-d.dy*headLen,px=-d.dy,py=d.dx;
        const p2x=bx+px*headW,p2y=by+py*headW,p3x=bx-px*headW,p3y=by-py*headW;
        grp.querySelector('.ghead').setAttribute('points',tx+','+ty+' '+p2x+','+p2y+' '+p3x+','+p3y);
    });
}

/* =========================================
   POINTER
   ========================================= */
function onPointerMove(e){
    const r=canvas.getBoundingClientRect();ptrX=e.clientX-r.left;ptrY=e.clientY-r.top;
    // Promote a click-drag (select mode) into a real planar move
    if(state.selectDragging&&!state.gizmoDragging){
        const dx=e.clientX-state.selectDragging.startClient.x,dy=e.clientY-state.selectDragging.startClient.y;
        if(dx*dx+dy*dy>9){
            let inst=state.selectDragging.inst;
            const startHit=state.selectDragging.startHit.clone();
            if(state.selectDragging.duplicate){
                inst=state.duplicateInstance(inst);
                state.selectDragging.inst=inst;
                state.selectDragging.startPos={...inst.pos};
                state.selected=inst;
            }
            const plane=BABYLON.Plane.FromPositionAndNormal(startHit,BABYLON.Vector3.Up());
            state.gizmoDragging={type:'select-move',inst,plane,startHit,startPos:{...state.selectDragging.startPos},startClient:{x:state.selectDragging.startClient.x,y:state.selectDragging.startClient.y}};
        }
    }
    // Gizmo hover (yellow recoloring handled by CSS :hover on .gaxis)
    let overGizmo=false;
    if(state.mode==='move'&&state.selected&&!state.selected.locked&&!state.gizmoDragging&&gizmoEl){
        overGizmo=!!(e.target.closest&&e.target.closest('.gaxis'));
    }
    // Cut-handle hover (3D raycast)
    let overCut=false;
    if(state.mode==='scale'&&state.selected&&state.cutBoxData&&!state.gizmoDragging){
        const p=scene.pick(e.clientX-r.left,e.clientY-r.top,m=>m.metadata&&m.metadata.cutHandle);
        const hover=p&&p.hit?p.pickedMesh.metadata.cutHandle:null;
        Object.keys(cutHandles).forEach(name=>{
            const mesh=cutHandles[name];
            if(mesh.metadata)mesh.metadata._hovering=(name===hover);
        });
        if(hover)overCut=true;
    }
    canvas.style.cursor=(overGizmo||overCut)?'pointer':'default';
    if(state.gizmoDragging)updateDrag(e);
}
function onGizmoPointerDown(e){
    if(e.button!==0)return;
    const el=e.target.closest&&e.target.closest('.gaxis');
    if(!el||!el.dataset.axis)return;
    if(!state.selected||state.mode!=='move')return;
    e.stopPropagation();e.preventDefault();
    startGizmoDrag(el.dataset.axis,1,e);
}
function onCanvasPointerDown(e){
    if(e.button!==0)return;
    const r=canvas.getBoundingClientRect();
    // 1) Cut handles (scale mode) — tested before schems
    if(state.mode==='scale'&&state.selected&&state.cutBoxData){
        const p=scene.pick(e.clientX-r.left,e.clientY-r.top,m=>m.metadata&&m.metadata.cutHandle);
        if(p&&p.hit){e.stopPropagation();e.preventDefault();startCutDrag(p.pickedMesh.metadata.cutHandle,e);return;}
    }
    // 2) Schem picking
    const hit=pickInstance(e.clientX,e.clientY);
    if(hit){
        if(state.mode==='multi'){state.toggleMultiSelect(hit.instance);e.stopPropagation();}
        else{
            state.select(hit.instance);
            if(state.mode==='select'&&!hit.instance.locked){
                e.stopPropagation();
                state.selectDragging={inst:hit.instance,startHit:hit.point.clone(),startPos:{...hit.instance.pos},startClient:{x:e.clientX,y:e.clientY},duplicate:e.ctrlKey||e.metaKey};
            }else if(hit.instance.locked)state.setStatus(state.i18n('locked_msg'));
        }
        return;
    }
    // 3) Click on empty space
    if(!state.selectDragging&&!state.gizmoDragging)state.select(null);
}
function onPointerUp(e){if(state.gizmoDragging)endDrag();state.selectDragging=null;canvas.style.cursor='default';}
function pickInstance(cx,cy){
    const r=canvas.getBoundingClientRect();
    const p=scene.pick(cx-r.left,cy-r.top,m=>m.metadata&&m.metadata.instanceId!==undefined);
    if(!p||!p.hit)return null;
    const inst=state.instances.find(i=>i.id===p.pickedMesh.metadata.instanceId);
    return inst?{instance:inst,point:p.pickedPoint.clone(),distance:p.distance}:null;
}

/* =========================================
   DRAG STARTERS
   ========================================= */
function startGizmoDrag(axis,dir,e){
    const inst=state.selected;
    if(!inst||inst.locked){if(state.setStatus)state.setStatus(state.i18n('locked_msg'));return;}
    const b=inst.aabb;
    const cx=inst.pos.x+(b.minX+b.maxX)*0.5,cy=inst.pos.y+(b.minY+b.maxY)*0.5,cz=inst.pos.z+(b.minZ+b.maxZ)*0.5;
    const center=new BABYLON.Vector3(cx,cy,cz);
    const axisVec={x:new BABYLON.Vector3(1,0,0),y:new BABYLON.Vector3(0,1,0),z:new BABYLON.Vector3(0,0,1)}[axis];
    const plane=axisDragPlane(axisVec,center);
    const startHit=raycastMouseToPlane(e,plane)||center.clone();
    state.gizmoDragging={type:'move',axis,dir,plane,startHit,startPos:{...inst.pos},inst,axisVec:axisVec.clone(),startClient:{x:e.clientX,y:e.clientY}};
}
function startCutDrag(handle,e){
    const d=state.cutBoxData;if(!d)return;const inst=d.inst;if(!inst||inst.locked)return;
    const axName=handle[0];const dir=handle===axName+'1'?1:-1;
    const axisVec={x:new BABYLON.Vector3(1,0,0),y:new BABYLON.Vector3(0,1,0),z:new BABYLON.Vector3(0,0,1)}[axName];
    const handleMesh=cutHandles[handle];
    const handleWorld=handleMesh.position.clone();
    const o=1.2;
    const faceCenter=handleWorld.add(axisVec.scale(-dir*o));
    const plane=axisDragPlane(axisVec,faceCenter);
    state.gizmoDragging={type:'cut',handle,axis:axName,dir,plane,axisVec:axisVec.clone(),startPoint:faceCenter.clone(),startClient:{x:e.clientX,y:e.clientY},startBox:{x0:d.x0,y0:d.y0,z0:d.z0,x1:d.x1,y1:d.y1,z1:d.z1},inst};
    state.cutFace=handle;
    if(state.updateCutFaceLabel)state.updateCutFaceLabel();
    if(state.setStatus)state.setStatus(state.i18n('snap'));
}

/* =========================================
   DRAG UPDATE (move / select-move / cut)
   ========================================= */
function updateDrag(e){
    const g=state.gizmoDragging;if(!g)return;
    const plane=g.plane;
    const hit=raycastMouseToPlane(e,plane);
    const refPoint=g.startHit||g.startPoint;
    let ok=hit&&isFinite(hit.x)&&refPoint&&BABYLON.Vector3.Distance(hit,refPoint)<5000;
    const stepMul=(e.shiftKey?10:1)*state.step;

    if(g.type==='move'){
        const inst=g.inst||state.selected;if(!inst)return;
        let dv;
        if(ok){const delta=hit.subtract(g.startHit);dv=g.axis==='x'?delta.x:g.axis==='y'?delta.y:delta.z;}
        else{dv=screenProjectAxisDrag(g.axisVec,e,g.startClient);}
        dv=Math.round(dv/stepMul)*stepMul;
        inst.pos[g.axis]=g.startPos[g.axis]+dv;
        inst.group.position.set(inst.pos.x,inst.pos.y,inst.pos.z);
        const snap=state.findSnap(inst);
        if(snap){inst.pos.x=snap.newPos.x;inst.pos.y=snap.newPos.y;inst.pos.z=snap.newPos.z;inst.group.position.set(inst.pos.x,inst.pos.y,inst.pos.z);showSnapIndicator(snap);}
        else showSnapIndicator(null);
        updateOutline();state.updateInspector();state.renderList();
    }else if(g.type==='select-move'){
        const inst=g.inst;if(!inst)return;
        let dx,dz;
        if(ok){const delta=hit.subtract(g.startHit);dx=delta.x;dz=delta.z;}
        else{const d2=screenProjectPlanarDrag(e,g.startClient);dx=d2.x;dz=d2.z;}
        inst.pos.x=g.startPos.x+Math.round(dx/stepMul)*stepMul;
        inst.pos.z=g.startPos.z+Math.round(dz/stepMul)*stepMul;
        inst.pos.y=g.startPos.y;
        const snap=state.findSnap(inst);
        if(snap){inst.pos.x=snap.newPos.x;inst.pos.y=snap.newPos.y;inst.pos.z=snap.newPos.z;inst.group.position.set(inst.pos.x,inst.pos.y,inst.pos.z);showSnapIndicator(snap);}
        else{inst.group.position.set(inst.pos.x,inst.pos.y,inst.pos.z);showSnapIndicator(null);}
        updateOutline();state.updateInspector();state.renderList();
    }else if(g.type==='cut'){
        const d=state.cutBoxData;if(!d||!d.inst)return;
        const inst=d.inst;
        let along;
        if(ok){const moveVec=hit.subtract(g.startPoint);along=BABYLON.Vector3.Dot(moveVec,g.axisVec);}
        else{along=screenProjectAxisDrag(g.axisVec,e,g.startClient);}
        const snapStep=e.shiftKey?Math.max(1,Math.min(state.step*10,16)):1;
        along=Math.round(along/snapStep)*snapStep;
        const startVal=g.dir===1?g.startBox[g.axis+'1']:g.startBox[g.axis+'0'];
        const newVal=startVal+along;
        const a=g.axis;
        if(g.dir===1){const maxV=inst.size[a]-1;d[a+'1']=Math.max(d[a+'0']+1,Math.min(maxV,newVal));}
        else{d[a+'0']=Math.max(0,Math.min(d[a+'1']-1,newVal));}
        syncCutBoxFromData();
        if(state.updateCutFaceLabel)state.updateCutFaceLabel();
    }
}
function endDrag(){showSnapIndicator(null);state.gizmoDragging=null;updateOutline();state.updateInspector();state.renderList();}

/* =========================================
   OUTLINE
   ========================================= */
function updateOutline(){
    if(outlineMesh){outlineMesh.dispose();outlineMesh=null;}
    const sel=state.selected;if(!sel)return;
    const b=sel.aabb;
    outlineMesh=BABYLON.MeshBuilder.CreateBox('ol',{width:b.maxX-b.minX+1.12,height:b.maxY-b.minY+1.12,depth:b.maxZ-b.minZ+1.12},scene);
    outlineMesh.position.set(sel.pos.x+(b.minX+b.maxX)*0.5,sel.pos.y+(b.minY+b.maxY)*0.5,sel.pos.z+(b.minZ+b.maxZ)*0.5);
    outlineMesh.isPickable=false;outlineMesh.renderingGroupId=1;outlineMesh.material=outlineMaterial;
    outlineMesh.enableEdgesRendering();outlineMesh.edgesWidth=2.0;outlineMesh.edgesColor=new BABYLON.Color4(0.29,0.66,1,1);
}
function updateMultiOutlines(){
    multiOutlines.forEach(o=>o.dispose());multiOutlines=[];
    for(const inst of Array.from(state.selection)){
        const b=inst.aabb;
        const m=BABYLON.MeshBuilder.CreateBox('mo'+inst.id,{width:b.maxX-b.minX+1,height:b.maxY-b.minY+1,depth:b.maxZ-b.minZ+1},scene);
        m.position.set(inst.pos.x+(b.minX+b.maxX)*0.5,inst.pos.y+(b.minY+b.maxY)*0.5,inst.pos.z+(b.minZ+b.maxZ)*0.5);
        m.isPickable=false;m.renderingGroupId=1;
        const mat=new BABYLON.StandardMaterial('mom'+inst.id,scene);
        mat.diffuseColor=new BABYLON.Color3(0.29,0.66,1);mat.emissiveColor=mat.diffuseColor.scale(0.1);
        mat.alpha=0.12;mat.backFaceCulling=false;mat.disableLighting=true;m.material=mat;
        multiOutlines.push(m);
    }
}

/* =========================================
   SNAP
   ========================================= */
function showSnapIndicator(snap){
    if(!snap){if(snapPlane)snapPlane.isVisible=false;state.snap=null;return;}
    state.snap=snap;const[w,h]=snap.faceSize;snapPlane.dispose();
    snapPlane=BABYLON.MeshBuilder.CreatePlane('sp',{width:w,height:h},scene);
    snapPlane.isVisible=true;snapPlane.isPickable=false;snapPlane.renderingGroupId=1;snapPlane.position=snap.faceCenter;
    if(snap.axis==='x')snapPlane.rotation.z=Math.PI/2;else if(snap.axis==='z')snapPlane.rotation.x=-Math.PI/2;
    const sm=new BABYLON.StandardMaterial('smi',scene);
    sm.diffuseColor=new BABYLON.Color3(0.24,0.83,0.54);sm.emissiveColor=sm.diffuseColor.scale(0.5);
    sm.alpha=0.5;sm.backFaceCulling=false;sm.disableLighting=true;sm.sideOrientation=BABYLON.Mesh.DOUBLESIDE;snapPlane.material=sm;
}

/* =========================================
   CUT BOX + HANDLES (mode Séparer)
   ========================================= */
function syncCutBoxFromData(){
    const d=state.cutBoxData;if(!d)return;const inst=d.inst;if(!inst)return;
    const sx=d.x1-d.x0+1,sy=d.y1-d.y0+1,sz=d.z1-d.z0+1;
    const cx=inst.pos.x+(d.x0+d.x1)*0.5,cy=inst.pos.y+(d.y0+d.y1)*0.5,cz=inst.pos.z+(d.z0+d.z1)*0.5;
    if(cutBox){cutBox.scaling.set(sx,sy,sz);cutBox.position.set(cx,cy,cz);}
    const o=1.2; // offset so spheres sit just outside the box face
    if(cutHandles.x0){
        cutHandles.x0.position.set(inst.pos.x+d.x0-o,cy,cz);
        cutHandles.x1.position.set(inst.pos.x+d.x1+o,cy,cz);
        cutHandles.y0.position.set(cx,inst.pos.y+d.y0-o,cz);
        cutHandles.y1.position.set(cx,inst.pos.y+d.y1+o,cz);
        cutHandles.z0.position.set(cx,cy,inst.pos.z+d.z0-o);
        cutHandles.z1.position.set(cx,cy,inst.pos.z+d.z1+o);
    }
}
function updateCutHandlesVisibility(){
    const show=state.mode==='scale'&&state.selected&&state.cutBoxData;
    if(cutBox)cutBox.isVisible=!!show;
    Object.keys(cutHandles).forEach(name=>{
        const h=cutHandles[name];if(h){h.isVisible=!!show;h.isPickable=!!show;}
    });
    if(show)syncCutBoxFromData();
}
function syncCutHandlesScale(){
    if(!state.cutBoxData||!state.selected)return;
    const inst=state.selected;const b=inst.aabb;
    const center=new BABYLON.Vector3(inst.pos.x+(b.minX+b.maxX)*0.5,inst.pos.y+(b.minY+b.maxY)*0.5,inst.pos.z+(b.minZ+b.maxZ)*0.5);
    const dist=BABYLON.Vector3.Distance(camera.position,center);
    const s=Math.max(0.5,Math.min(2.5,dist/80));
    Object.keys(cutHandles).forEach(name=>{
        const h=cutHandles[name];if(!h)return;
        const hover=h.metadata&&h.metadata._hovering?1.5:1;
        const sc=s*hover;
        h.scaling.set(sc,sc,sc);
    });
}

/* Called from schem_placer.js to move cut plane (keyboard) */
function adjustCutPlane(axis,delta){
    const d=state.cutBoxData;if(!d||!d.inst)return;
    const s=state.step*(state.shiftDown?10:1);
    const dv=delta*s;
    if(axis==='x0')d.x0=Math.max(0,Math.min(d.x1-1,d.x0+dv));
    else if(axis==='x1')d.x1=Math.max(d.x0+1,Math.min(d.inst.size.x-1,d.x1+dv));
    else if(axis==='y0')d.y0=Math.max(0,Math.min(d.y1-1,d.y0+dv));
    else if(axis==='y1')d.y1=Math.max(d.y0+1,Math.min(d.inst.size.y-1,d.y1+dv));
    else if(axis==='z0')d.z0=Math.max(0,Math.min(d.z1-1,d.z0+dv));
    else if(axis==='z1')d.z1=Math.max(d.z0+1,Math.min(d.inst.size.z-1,d.z1+dv));
    syncCutBoxFromData();
}

/* =========================================
   BUILD MESHES (VertexData)
   ========================================= */
function buildSchemMesh(schem){
    const blocks=schem.blocks;
    if(!blocks||blocks.size===0)return{group:new BABYLON.TransformNode('se',scene),totalBlocks:0,width:0,height:0,depth:0};
    const w=schem.size.x,h=schem.size.y,d=schem.size.z;
    const group=new BABYLON.TransformNode('sm'+Math.random().toString(36).slice(2,8),scene);
    const cubeData=BABYLON.VertexData.CreateBox({size:1});
    const bp=cubeData.positions,bi=cubeData.indices,bn=cubeData.normals;
    let allP=[],allI=[],allN=[],allC=[];
    let vo=0,tb=0;
    blocks.forEach((arr,key)=>{
        const[ncx,ncy,ncz]=key.split(',').map(Number);
        const bX=ncx*CHUNK,bY=ncy*CHUNK,bZ=ncz*CHUNK;
        for(let lx=0;lx<CHUNK;lx++)for(let ly=0;ly<CHUNK;ly++)for(let lz=0;lz<CHUNK;lz++){
            const bid=arr[lx*1024+ly*32+lz];if(bid===AIR_ID)continue;tb++;
            const c=getBlockColor(bid);const bx=bX+lx+0.5,by=bY+ly+0.5,bz=bZ+lz+0.5;
            for(let i=0;i<bp.length;i+=3){allP.push(bp[i]+bx,bp[i+1]+by,bp[i+2]+bz);}
            for(let i=0;i<bn.length;i++)allN.push(bn[i]);
            for(let i=0;i<bi.length;i++)allI.push(bi[i]+vo);
            const nv=bp.length/3;for(let v=0;v<nv;v++)allC.push(c.r,c.g,c.b,1.0);
            vo+=nv;
        }
    });
    if(allP.length===0)return{group,totalBlocks:0,width:w,height:h,depth:d};
    const vd=new BABYLON.VertexData();
    vd.positions=new Float32Array(allP);vd.indices=vo>65535/24?new Uint32Array(allI):new Uint32Array(allI);
    vd.normals=new Float32Array(allN);vd.colors=new Float32Array(allC);
    const mesh=new BABYLON.Mesh('sch'+Math.random().toString(36).slice(2,8),scene);vd.applyToMesh(mesh);
    const mat=new BABYLON.StandardMaterial('sm'+mesh.name,scene);
    mat.specularColor=new BABYLON.Color3(0.05,0.05,0.05);mat.backFaceCulling=true;mat.useVertexColors=true;mesh.material=mat;
    mesh.isPickable=true;mesh.metadata={instanceId:null};mesh.parent=group;
    console.log('Mesh:',tb,'blocks,',w+'x'+h+'x'+d);
    return{group,totalBlocks:tb,width:w,height:h,depth:d};
}

function buildLockedMesh(inst){
    const s=inst.schem,blocks=s.blocks;
    if(!blocks||blocks.size===0)return new BABYLON.TransformNode('le',scene);
    const col=hexToColor3(inst.color);
    let allP=[],allI=[],allC=[];let vo=0;
    const cubeData=BABYLON.VertexData.CreateBox({size:1});
    const bp=cubeData.positions,bi=cubeData.indices;
    blocks.forEach((arr,key)=>{
        const[ncx,ncy,ncz]=key.split(',').map(Number);
        const bX=ncx*CHUNK,bY=ncy*CHUNK,bZ=ncz*CHUNK;
        for(let lx=0;lx<CHUNK;lx++)for(let ly=0;ly<CHUNK;ly++)for(let lz=0;lz<CHUNK;lz++){
            if(arr[lx*1024+ly*32+lz]===AIR_ID)continue;
            const bx=bX+lx+0.5,by=bY+ly+0.5,bz=bZ+lz+0.5;
            for(let i=0;i<bp.length;i+=3){allP.push(bp[i]+bx,bp[i+1]+by,bp[i+2]+bz);}
            for(let i=0;i<bi.length;i++)allI.push(bi[i]+vo);
            const nv=bp.length/3;for(let v=0;v<nv;v++)allC.push(col.r,col.g,col.b,1);
            vo+=nv;
        }
    });
    if(allP.length===0)return new BABYLON.TransformNode('le',scene);
    const vd=new BABYLON.VertexData();
    vd.positions=new Float32Array(allP);vd.indices=new Uint32Array(allI);vd.colors=new Float32Array(allC);
    const mesh=new BABYLON.Mesh('lm'+inst.id,scene);vd.applyToMesh(mesh);
    const mat=new BABYLON.StandardMaterial('lmm'+inst.id,scene);
    mat.specularColor=new BABYLON.Color3(0.05,0.05,0.05);mat.backFaceCulling=true;mat.useVertexColors=true;mesh.material=mat;
    const group=new BABYLON.TransformNode('lg'+inst.id,scene);mesh.parent=group;return group;
}

/* =========================================
   REBUILD / ADD / REMOVE
   ========================================= */
function rebuildInstanceMesh(inst){
    if(inst.group){inst.group.getChildMeshes().forEach(m=>m.dispose(false,false));inst.group.dispose();}
    const{group,totalBlocks,width,height,depth}=buildSchemMesh(inst.schem);
    group.position.set(inst.pos.x,inst.pos.y,inst.pos.z);
    inst.group=group;inst.totalBlocks=totalBlocks;
    inst.aabb={minX:0,minY:0,minZ:0,maxX:width-1,maxY:height-1,maxZ:depth-1};
    inst.size={x:width,y:height,z:depth};
    group.getChildMeshes().forEach(m=>{m.metadata={instanceId:inst.id};});group.metadata={instanceId:inst.id};
}
function addInstanceToScene(inst){
    if(inst&&inst.group&&inst.group.getChildMeshes)inst.group.getChildMeshes().forEach(m=>{m.metadata=m.metadata||{};m.metadata.instanceId=inst.group.metadata?inst.group.metadata.instanceId:null;});
}
function removeInstanceFromScene(inst){
    if(!inst||!inst.group)return;
    inst.group.getChildMeshes().forEach(m=>m.dispose(false,false));inst.group.dispose();inst.group=null;
}

function rebuildAllInstances(){
    if(!state||!state.instances)return;
    for(const inst of state.instances){
        if(inst.locked){ // locked meshes use single color; no need to rebuild for colors
            if(inst.group){inst.group.getChildMeshes().forEach(m=>m.dispose(false,false));inst.group.dispose();}
            inst.group=buildLockedMesh(inst);
            inst.group.getChildMeshes().forEach(m=>{m.metadata={instanceId:inst.id};});
            inst.group.position.set(inst.pos.x,inst.pos.y,inst.pos.z);
        } else {
            rebuildInstanceMesh(inst);
        }
    }
    updateOutline();updateMultiOutlines();
}
function focusOnInstance(inst){
    if(!inst||!camera)return;
    const b=inst.aabb;
    const cx=inst.pos.x+(b.minX+b.maxX)*0.5,cy=inst.pos.y+(b.minY+b.maxY)*0.5,cz=inst.pos.z+(b.minZ+b.maxZ)*0.5;
    const size=Math.max(b.maxX-b.minX,b.maxY-b.minY,b.maxZ-b.minZ)+4;
    const fw=camera.getDirection(BABYLON.Axis.Z).normalize();
    const target=new BABYLON.Vector3(cx,cy,cz);
    camera.position.set(target.x-fw.x*size*1.8,target.y+size*0.55,target.z-fw.z*size*1.8);
    camera.setTarget(target);
}

/* =========================================
   EXPORT
   ========================================= */
window.SchemPlacerBabylon={
    get state(){return state;},set state(v){state=v;},
    init:function(ms){state=ms;initBabylon();state.scene=scene;state.camera=camera;state.engine=engine;},
    getScene:()=>scene,getCamera:()=>camera,getEngine:()=>engine,
    buildSchemMesh,buildLockedMesh,rebuildInstanceMesh,
    addInstanceToScene,removeInstanceFromScene,
    updateOutline,updateMultiOutlines,
    updateCutHandlesVisibility,syncCutBoxFromData,syncCutHandlesScale,
    adjustCutPlane,
    pickInstance,focusOnInstance,
    showSnapIndicator,getBlockColor,initBlockNameMap,rebuildAllInstances,
    getCutBoxData:()=>state?state.cutBoxData:null,
    getCutBox:()=>cutBox,getCutHandles:()=>cutHandles,
    getSnapIndicator:()=>snapPlane,getSnap:()=>state?state.snap:null,
    get multiOutlines(){return multiOutlines;},set multiOutlines(v){multiOutlines=v;},
};
})();

})();

/* ═══ main schem placer ═══ */

/**
 * Schem Placer - Main Application (Babylon.js)
 * Parsage, instances, UI, export, presets, i18n
 */

(function() {
'use strict';

/* =====================================================
   CONSTANTES
   ===================================================== */
const CHUNK = 32;
const CHUNK_VOL = CHUNK * CHUNK * CHUNK;
const AIR_ID = 0;
const SNAP_THRESHOLD = 2;

/* =====================================================
   HELPERS DOM
   ===================================================== */
function $(sel, ctx) { return (ctx || document).querySelector(sel); }
function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

/* =====================================================
   i18n
   ===================================================== */
const i18nMap = {
    fr: {
        ready: 'Prêt.',
        locked_msg: 'Schem verrouillé.',
        no_sel: 'Aucune sélection.',
        no_union: 'Sélectionnez au moins 2 schems pour unir.',
        no_split: 'Aucune union à défaire.',
        no_export_sel: 'Aucun schem sélectionné pour l\'export.',
        export_fail: 'Aucun schem à exporter.',
        export_done: 'Exporté : {0} ({1} schem(s)).',
        export_parts: '{0} partie(s) exportée(s).',
        union_done: 'Unis en "{0}".',
        split_done: 'Désunion. Il reste {0} union(s) à défaire.',
        schem_loaded: '{0} schem(s) chargé(s).',
        del_fail: '{0} fichier(s) non reconnu(s).',
        json_converted: '{0} : fichier JSON converti en schématique',
        format_bad: '{0} : fichier non reconnu (ni .bloxdschem binaire, ni .schem JSON valide).',
        clear_done: 'Scène vidée.',
        loaded_saved: 'Preset chargé : {0} schem(s).',
        preset_saved: 'Preset "{0}" sauvegardé.',
        preset_empty: 'Aucun preset.',
        delete: 'Supprimer',
        save_prompt: 'Nom du preset :',
        confirm_clear: 'Vider la scène ?',
        snap: 'Déplacement — clic pour valider',
        drag_dupe: 'Dupliqué : ',
        cut_done: 'Coupe effectuée.',
        copy_done: 'Partie copiée.',
        open:'Ouvrir', export:'Exporter', mode_select:'Souris', mode_move:'Déplacer', mode_scale:'Séparer', mode_multi:'Multi', clear:'Vider',
        dim:'Dimensions', pos:'Position', blocks:'Blocs', color:'Couleur', step:'Pas :', blocks_unit:'bloc(s)', shift_hint:'Maintenir Maj pour ×10', rename:'Renommer',
        schems:'Schems', no_schem:'Aucun schem. Glissez-déposez ou', open_hint:'cliquez sur Ouvrir',
        cut_title:'✂️ Séparer', cut_extract:'✂️ Couper', cut_copy:'📑 Dupliquer',
        multi_title:'🔲 Multi-sélection —', schems_word:'schem(s)', multi_union:'🔗 Unir', multi_split:'✂️ Désunir', multi_export:'💾 Exporter',
        drop_msg:'📥 Déposez vos .bloxdschem ou un .zip ici',
        export_title:'💾 Exporter', export_base:'Nom de base', export_folder:'Dossier dans le zip', export_coords:'Ajouter les coordonnées _x…_z… dans les noms', export_single:'Forcer un seul fichier', cancel:'Annuler', download:'📦 Télécharger',
        me_title:'💾 Exporter la sélection', me_single:'📄 Un seul schem', me_single_sub:'Tous les schems fusionnes en UN seul .bloxdschem (jamais decoupe)', me_separate:'📑 Plusieurs schems (separe)', me_separate_sub:'Chaque schem telecharge separement dans un .zip', me_autosplit:'✂️ Fusion + decoupe auto', me_autosplit_sub:'Fusionne tout, puis decoupe en ZIP si > 160 chunks (limite Bloxd)',
        cam_label:'Cam:', step_label:'Pas:',
        help_title:'Guide rapide', help_start:'Commencer',
        prompt_export_name:"Nom de l'export :", prompt_new_name:'Nouveau nom :',
        help_items:[
            '<b>Clic gauche + glisser</b> : tourner la caméra',
            '<b>Molette</b> : zoomer / dézoomer',
            '<b>Clic droit + glisser</b> : déplacer la vue (pan)',
            '<b>ZQSD/WASD</b> : voler — <b>Espace</b>/<b>Ctrl</b> : monter/descendre',
            '<b>Glisser-déposer</b> : charger des .bloxdschem ou un .zip',
            '<b>Mode 🖱️ Souris</b> (V) : cliquez sur un schem pour le <b>sélectionner</b> ; maintenez et tirez pour <b>déplacer au sol</b> ; <kbd>Ctrl</kbd> + clic-glisser pour <b>dupliquer</b>',
            '<b>Mode ↔️ Déplacer</b> (G) : tirez les <b>flèches colorées</b> ou utilisez <kbd>ZQSD/WASD</kbd> (plan), <kbd>R</kbd>/<kbd>C</kbd> (haut/bas)',
            '<b>Mode ✂️ Séparer</b> (T) : <b>X/Y/Z</b> pour choisir la face, <b>←→↑↓</b> pour ajuster, puis <b>Couper</b> ou <b>Dupliquer</b>',
            'Bouton <b>🔓</b> / <kbd>L</kbd> : <b>verrouille</b> un schem (plus léger pour les gros schems)',
            '<b>🔲 Multi</b> (M) : ajoutez des schems à la sélection. <b>Unir</b> les fusionne, <b>Désunir</b> annule',
            '<kbd>Suppr</kbd> : supprimer · <kbd>F</kbd> : recentrer · <kbd>H</kbd> : aide · <kbd>Maj</kbd> : ×10 · <kbd>Échap</kbd> : annuler',
        ],
    },
    en: {
        ready: 'Ready.',
        locked_msg: 'Schem is locked.',
        no_sel: 'Nothing selected.',
        no_union: 'Select at least 2 schems to merge.',
        no_split: 'No union to undo.',
        no_export_sel: 'No schem selected for export.',
        export_fail: 'No schem to export.',
        export_done: 'Exported: {0} ({1} schem(s)).',
        export_parts: '{0} part(s) exported.',
        union_done: 'Merged into "{0}".',
        split_done: 'Split done. {0} union(s) remaining.',
        schem_loaded: '{0} schem(s) loaded.',
        del_fail: '{0} file(s) not recognized.',
        json_converted: '{0}: JSON file converted to schematic',
        format_bad: '{0}: unrecognized file (neither a binary .bloxdschem nor a valid JSON .schem).',
        clear_done: 'Scene cleared.',
        loaded_saved: 'Preset loaded: {0} schem(s).',
        preset_saved: 'Preset "{0}" saved.',
        preset_empty: 'No preset.',
        delete: 'Delete',
        save_prompt: 'Preset name:',
        confirm_clear: 'Clear the scene?',
        snap: 'Move — click to validate',
        drag_dupe: 'Duplicated: ',
        cut_done: 'Cut done.',
        copy_done: 'Part copied.',
        open:'Open', export:'Export', mode_select:'Mouse', mode_move:'Move', mode_scale:'Separate', mode_multi:'Multi', clear:'Clear',
        dim:'Dimensions', pos:'Position', blocks:'Blocks', color:'Color', step:'Step:', blocks_unit:'block(s)', shift_hint:'Hold Shift for ×10', rename:'Rename',
        schems:'Schems', no_schem:'No schems. Drag & drop or', open_hint:'click Open',
        cut_title:'✂️ Separate', cut_extract:'✂️ Cut', cut_copy:'📑 Duplicate',
        multi_title:'🔲 Multi-select —', schems_word:'schem(s)', multi_union:'🔗 Union', multi_split:'✂️ Split', multi_export:'💾 Export',
        drop_msg:'📥 Drop your .bloxdschem or a .zip here',
        export_title:'💾 Export', export_base:'Base name', export_folder:'Folder in the zip', export_coords:'Add _x…_z… coordinates to filenames', export_single:'Force a single file', cancel:'Cancel', download:'📦 Download',
        me_title:'💾 Export selection', me_single:'📄 One schem', me_single_sub:'All schems merged into ONE .bloxdschem (never split)', me_separate:'📑 Multiple schems (separate)', me_separate_sub:'Each schem downloaded separately in a .zip', me_autosplit:'✂️ Merge + auto-split', me_autosplit_sub:'Merges everything, then splits into ZIP if > 160 chunks (Bloxd limit)',
        cam_label:'Cam:', step_label:'Step:',
        help_title:'Quick guide', help_start:'Start',
        prompt_export_name:'Export name:', prompt_new_name:'New name:',
        help_items:[
            '<b>Left-click + drag</b>: orbit the camera',
            '<b>Wheel</b>: zoom in / out',
            '<b>Right-click + drag</b>: pan the view',
            '<b>WASD/ZQSD</b>: fly — <b>Space</b>/<b>Ctrl</b>: up/down',
            '<b>Drag & drop</b>: load .bloxdschem files or a .zip',
            '<b>Mouse mode</b> (V): click a schem to <b>select</b> it; drag to <b>move on the ground</b>; <kbd>Ctrl</kbd> + drag to <b>duplicate</b>',
            '<b>Move mode</b> (G): drag the <b>colored arrows</b> or use <kbd>WASD/ZQSD</kbd> (ground), <kbd>R</kbd>/<kbd>C</kbd> (up/down)',
            '<b>Separate mode</b> (T): <b>X/Y/Z</b> to pick a face, <b>arrow keys</b> to adjust, then <b>Cut</b> or <b>Duplicate</b>',
            'Lock button <b>🔓</b> / <kbd>L</kbd>: <b>lock</b> a schem (lighter for large schems)',
            '<b>Multi</b> (M): add schems to the selection. <b>Union</b> merges them, <b>Split</b> undoes',
            '<kbd>Del</kbd>: delete · <kbd>F</kbd>: recenter · <kbd>H</kbd>: help · <kbd>Shift</kbd>: ×10 · <kbd>Esc</kbd>: cancel',
        ],
    },
    ja: {
        ready:'準備完了.',locked_msg:'ロック中.',no_sel:'選択なし.',no_union:'2つ以上選択して結合.',no_split:'結合なし.',no_export_sel:'エクスポート対象なし.',export_fail:'エクスポート対象なし.',export_done:'エクスポート: {0} ({1} schem).',export_parts:'{0} パート.',union_done:'"{0}" に結合.',split_done:'分離完了. 残り {0}.',schem_loaded:'{0} schem ロード.',del_fail:'{0} ファイル認識不可.',json_converted:'{0} : JSONをスケーマに変換しました',format_bad:'{0} : 認識できないファイル（.bloxdschemバイナリでもJSON .schemでもない）.',clear_done:'シーンクリア.',loaded_saved:'プリセット: {0} schem.',preset_saved:'"{0}" 保存.',preset_empty:'プリセットなし.',delete:'削除',save_prompt:'プリセット名:',confirm_clear:'シーンをクリア?',snap:'移動 — クリックで確定',drag_dupe:'複製: ',cut_done:'切断完了.',copy_done:'コピー完了.',
        open:'開く',export:'エクスポート',mode_select:'マウス',mode_move:'移動',mode_scale:'分離',mode_multi:'マルチ',clear:'クリア',
        dim:'寸法',pos:'位置',blocks:'ブロック',color:'色',step:'ステップ:',blocks_unit:'ブロック',shift_hint:'Shiftで×10',rename:'リネーム',
        schems:'Schems',no_schem:'Schemなし. ドラッグまたは',open_hint:'開くをクリック',
        cut_title:'✂️ 分離',cut_extract:'✂️ 切断',cut_copy:'📑 複製',
        multi_title:'🔲 マルチ選択 —',schems_word:'schem',multi_union:'🔗 結合',multi_split:'✂️ 分離',multi_export:'💾 エクスポート',
        drop_msg:'📥 .bloxdschemまたは.zipをドロップ',
        export_title:'💾 エクスポート',export_base:'ベース名',export_folder:'ZIPフォルダ名',export_coords:'座標 _x…_z… を追加',export_single:'単一ファイル',cancel:'キャンセル',download:'📦 ダウンロード',
        me_title:'💾 選択をエクスポート',me_single:'📄 1ファイル',me_single_sub:'全schemを1つの.bloxdschemに結合',me_separate:'📑 個別(schem毎)',me_separate_sub:'各schemを.zipに個別ダウンロード',me_autosplit:'✂️ 結合+自動分割',me_autosplit_sub:'結合後>160 chunks ならZIP分割',
        cam_label:'カメラ:',step_label:'ステップ:',help_title:'クイックガイド',help_start:'開始',
        prompt_export_name:'エクスポート名:',prompt_new_name:'新しい名前:',
        help_items:['<b>左クリック+ドラッグ</b>: カメラ回転','<b>ホイール</b>: ズーム','<b>右クリック+ドラッグ</b>: パン','<b>WASD/ZQSD</b>: 飛行 — <b>Space/Ctrl</b>: 上昇/下降','<b>ドラッグ&ドロップ</b>: .bloxdschem読込','<b>マウスモード</b> (V): クリック=選択 · ドラッグ=移動 · Ctrl+ドラッグ=複製','<b>移動モード</b> (G): 矢印ドラッグ or WASD(地上) R/C(上下)','<b>分離モード</b> (T): X/Y/Z で面選択 · 矢印で調整 · 切断/複製','🔒ボタン / <kbd>L</kbd>: ロック','<b>マルチ</b> (M): 選択追加 · 結合/分離','<kbd>Del</kbd>: 削除 · <kbd>F</kbd>: 中央 · <kbd>H</kbd>: ヘルプ · <kbd>Shift</kbd>: ×10 · <kbd>Esc</kbd>: キャンセル'],
    },
    ko: {
        ready:'준비됨.',locked_msg:'잠겨 있음.',no_sel:'선택 없음.',no_union:'2개 이상 선택하여 병합.',no_split:'병합 없음.',no_export_sel:'내보낼 스케맨 없음.',export_fail:'내보낼 스케맨 없음.',export_done:'내보냄: {0} ({1}개).',export_parts:'{0}개 파트.',union_done:'"{0}"로 병합.',split_done:'분할 완료. {0}개 남음.',schem_loaded:'{0}개 로드.',del_fail:'{0}개 파일 인식 불가.',json_converted:'{0} : JSON 파일을 스케맨으로 변환했습니다',format_bad:'{0} : 인식할 수 없는 파일(바이너리 .bloxdschem이 아니거나 유효하지 않은 JSON .schem).',clear_done:'씬 비움.',loaded_saved:'프리셋: {0}개.',preset_saved:'"{0}" 저장.',preset_empty:'프리셋 없음.',delete:'삭제',save_prompt:'프리셋 이름:',confirm_clear:'씬을 비우시겠습니까?',snap:'이동 — 클릭하여 확정',drag_dupe:'복제: ',cut_done:'잘라내기 완료.',copy_done:'복사 완료.',
        open:'열기',export:'내보내기',mode_select:'마우스',mode_move:'이동',mode_scale:'분할',mode_multi:'멀티',clear:'비우기',
        dim:'크기',pos:'위치',blocks:'블록',color:'색상',step:'단계:',blocks_unit:'블록',shift_hint:'Shift로 ×10',rename:'이름 변경',
        schems:'스케맨',no_schem:'스케맨 없음. 드래그하거나',open_hint:'열기 클릭',
        cut_title:'✂️ 분할',cut_extract:'✂️ 잘라내기',cut_copy:'📑 복제',
        multi_title:'🔲 다중 선택 —',schems_word:'스케맨',multi_union:'🔗 병합',multi_split:'✂️ 분할',multi_export:'💾 내보내기',
        drop_msg:'📥 .bloxdschem 또는 .zip 드롭',
        export_title:'💾 내보내기',export_base:'기본 이름',export_folder:'ZIP 폴더명',export_coords:'좌표 _x…_z… 추가',export_single:'단일 파일',cancel:'취소',download:'📦 다운로드',
        me_title:'💾 선택 내보내기',me_single:'📄 1개 파일',me_single_sub:'모든 스케맨을 1개로 병합',me_separate:'📑 개별',me_separate_sub:'각 스케맨을 .zip에 개별 다운로드',me_autosplit:'✂️ 병합+자동 분할',me_autosplit_sub:'병합 후 >160 chunks면 ZIP 분할',
        cam_label:'카메라:',step_label:'단계:',help_title:'빠른 가이드',help_start:'시작',
        prompt_export_name:'내보내기 이름:',prompt_new_name:'새 이름:',
        help_items:['<b>좌클릭+드래그</b>: 카메라 회전','<b>휠</b>: 줌','<b>우클릭+드래그</b>: 팬','<b>WASD/ZQSD</b>: 비행 — <b>Space/Ctrl</b>: 상승/하강','<b>드래그&드롭</b>: .bloxdschem 로드','<b>마우스 모드</b> (V): 클릭=선택 · 드래그=이동 · Ctrl+드래그=복제','<b>이동 모드</b> (G): 화살표 드래그 or WASD(지상) R/C(상하)','<b>분할 모드</b> (T): X/Y/Z 면 선택 · 화살표 조정 · 잘라내기/복제','🔒버튼 / <kbd>L</kbd>: 잠금','<b>멀티</b> (M): 선택 추가 · 병합/분할','<kbd>Del</kbd>: 삭제 · <kbd>F</kbd>: 중앙 · <kbd>H</kbd>: 도움말 · <kbd>Shift</kbd>: ×10 · <kbd>Esc</kbd>: 취소'],
    },
    th: {
        ready:'พร้อม.',locked_msg:'ล็อคอยู่.',no_sel:'ไม่ได้เลือก.',no_union:'เลือกอย่างน้อย 2 อันเพื่อรวม.',no_split:'ไม่มีการรวม.',no_export_sel:'ไม่ได้เลือกสเคมา.',export_fail:'ไม่มีสเคมาส่งออก.',export_done:'ส่งออก: {0} ({1} อัน).',export_parts:'{0} ส่วน.',union_done:'รวมเป็น "{0}".',split_done:'แยกสำเร็จ. เหลือ {0}.',schem_loaded:'โหลด {0} อัน.',del_fail:'{0} ไฟล์ไม่รู้จัก.',json_converted:'{0} : แปลงไฟล์ JSON เป็นสเคมาแล้ว',format_bad:'{0} : ไฟล์ไม่รู้จัก (ไม่ใช่ .bloxdschem ไบนารีหรือ JSON .schem ที่ถูกต้อง).',clear_done:'ล้างซีน.',loaded_saved:'โหลดพรีเซ็ต: {0} อัน.',preset_saved:'บันทึก "{0}".',preset_empty:'ไม่มีพรีเซ็ต.',delete:'ลบ',save_prompt:'ชื่อพรีเซ็ต:',confirm_clear:'ล้างซีน?',snap:'เคลื่อนย้าย — คลิกเพื่อยืนยัน',drag_dupe:'สำเนา: ',cut_done:'ตัดสำเร็จ.',copy_done:'คัดลอกสำเร็จ.',
        open:'เปิด',export:'ส่งออก',mode_select:'เมาส์',mode_move:'ย้าย',mode_scale:'แยก',mode_multi:'หลายตัว',clear:'ล้าง',
        dim:'ขนาด',pos:'ตำแหน่ง',blocks:'บล็อก',color:'สี',step:'ขั้น:',blocks_unit:'บล็อก',shift_hint:'กด Shift สำหรับ ×10',rename:'เปลี่ยนชื่อ',
        schems:'สเคมา',no_schem:'ไม่มีสเคมา. ลากหรือ',open_hint:'คลิกเปิด',
        cut_title:'✂️ แยก',cut_extract:'✂️ ตัด',cut_copy:'📑 ทำซ้ำ',
        multi_title:'🔲 เลือกหลายตัว —',schems_word:'อัน',multi_union:'🔗 รวม',multi_split:'✂️ แยก',multi_export:'💾 ส่งออก',
        drop_msg:'📥 วาง .bloxdschem หรือ .zip ที่นี่',
        export_title:'💾 ส่งออก',export_base:'ชื่อหลัก',export_folder:'ชื่อโฟลเดอร์ ZIP',export_coords:'เพิ่มพิกัด _x…_z…',export_single:'ไฟล์เดียว',cancel:'ยกเลิก',download:'📦 ดาวน์โหลด',
        me_title:'💾 ส่งออกที่เลือก',me_single:'📄 1 ไฟล์',me_single_sub:'รวมทั้งหมดเป็น 1 ไฟล์',me_separate:'📑 แยก',me_separate_sub:'ดาวน์โหลดแยกใน .zip',me_autosplit:'✂️ รวม+แยกอัตโนมัติ',me_autosplit_sub:'รวมแล้วแยก ZIP ถ้า > 160 chunks',
        cam_label:'กล้อง:',step_label:'ขั้น:',help_title:'คู่มือด่วน',help_start:'เริ่ม',
        prompt_export_name:'ชื่อส่งออก:',prompt_new_name:'ชื่อใหม่:',
        help_items:['<b>คลิกซ้าย+ลาก</b>: หมุนกล้อง','<b>ล้อ</b>: ซูม','<b>คลิกขวา+ลาก</b>: เลื่อน','<b>WASD/ZQSD</b>: บิน — <b>Space/Ctrl</b>: ขึ้น/ลง','<b>ลาก&วาง</b>: โหลด .bloxdschem','<b>โหมดเมาส์</b> (V): คลิก=เลือก · ลาก=ย้าย · Ctrl+ลาก=ทำซ้ำ','<b>โหมดย้าย</b> (G): ลากลูกศร or WASD(พื้น) R/C(บน/ล่าง)','<b>โหมดแยก</b> (T): X/Y/Z เลือก · ปรับ · ตัด/ทำซ้ำ','🔒ปุ่ม / <kbd>L</kbd>: ล็อก','<b>หลายตัว</b> (M): เพิ่ม · รวม/แยก','<kbd>Del</kbd>: ลบ · <kbd>F</kbd>: กึ่งกลาง · <kbd>H</kbd>: ช่วยเหลือ · <kbd>Shift</kbd>: ×10 · <kbd>Esc</kbd>: ยกเลิก'],
    }
};

function i18n(key, ...args) {
    const txt = (i18nMap[state.lang]?.[key] || i18nMap['en']?.[key] || key);
    return args.reduce((s, a, i) => s.replace('{'+i+'}', a), txt);
}

function setLang(lang) {
    state.lang = i18nMap[lang] ? lang : 'en';
    localStorage.setItem('bloxdTools.lang', state.lang);
    const btn = document.getElementById('btn-lang');
    if (btn) btn.textContent = state.lang.toUpperCase();
    applyStaticI18n();
}

function applyStaticI18n() {
    const dict = i18nMap[state.lang] || i18nMap.fr;
    document.documentElement.lang = state.lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n');
        const v = dict[k];
        if (typeof v === 'string') el.textContent = v;
    });
    const list = document.getElementById('help-list');
    if (list && Array.isArray(dict.help_items)) list.innerHTML = dict.help_items.map(h => '<li>' + h + '</li>').join('');
}

/* =====================================================
   ÉTAT GLOBAL
   ===================================================== */
const state = {
    mode: 'select', selected: null, selection: new Set(), instances: [],
    nextId: 1, step: 1, lang: 'fr',
    locked: {}, selectDragging: null, gizmoDragging: null,
    cutBoxData: null, snap: null, unionStack: [], blockNameMap: {},
    shiftDown: false, cutFace: null,
};

/* =====================================================
   MODE HINTS
   ===================================================== */
const MODE_HINTS = {
    fr: {
        select: 'Clic sur un schem pour le <b>sélectionner</b>. Maintenez et tirez pour <b>déplacer au sol</b>. Ctrl pour <b>dupliquer</b>.',
        move: 'Tirez les <b>flèches colorées</b> pour déplacer sur un axe, ou <kbd>↑↓←→</kbd> (plan) + <kbd>R</kbd>/<kbd>C</kbd> (hauteur).',
        scale: '<b>X/Y/Z</b> pour choisir la face, <b>←→↑↓</b> pour l\'ajuster. Puis Couper/Dupliquer.',
        multi: 'Clic sur les schems pour les <b>ajouter à la sélection</b>.'
    },
    en: {
        select: 'Click on a schem to <b>select</b>. Hold and drag to <b>move on ground</b>. Ctrl to <b>duplicate</b>.',
        move: 'Drag the <b>colored arrows</b> to move along an axis, or <kbd>↑↓←→</kbd> (plan) + <kbd>R</kbd>/<kbd>C</kbd> (height).',
        scale: 'Click <b>orange spheres</b> to adjust cut zone.',
        multi: 'Click schems to <b>add to selection</b>.'
    },
    ja: {
        select: 'クリックで<b>選択</b>. ドラッグで<b>移動</b>. Ctrlで<b>複製</b>.',
        move: '<b>矢印</b>をドラッグ、または <kbd>↑↓←→</kbd> + <kbd>R</kbd>/<kbd>C</kbd>.',
        scale: '<b>X/Y/Z</b> で面選択, <b>←→↑↓</b> で調整. 切断/複製.',
        multi: 'クリックで<b>選択に追加</b>.'
    },
    ko: {
        select: '클릭으로 <b>선택</b>. 드래그로 <b>이동</b>. Ctrl로 <b>복제</b>.',
        move: '<b>화살표</b> 드래그, 또는 <kbd>↑↓←→</kbd> + <kbd>R</kbd>/<kbd>C</kbd>.',
        scale: '<b>X/Y/Z</b> 면 선택, <b>←→↑↓</b> 조정. 잘라내기/복제.',
        multi: '클릭으로 <b>선택 추가</b>.'
    },
    th: {
        select: 'คลิกเพื่อ<b>เลือก</b>. ลากเพื่อ<b>ย้าย</b>. Ctrl เพื่อ<b>ทำซ้ำ</b>.',
        move: 'ลาก<b>ลูกศร</b> หรือ <kbd>↑↓←→</kbd> + <kbd>R</kbd>/<kbd>C</kbd>.',
        scale: '<b>X/Y/Z</b> เลือก, <b>←→↑↓</b> ปรับ. ตัด/ทำซ้ำ.',
        multi: 'คลิกเพื่อ<b>เพิ่มเข้าเลือก</b>.'
    }
};

function setModeHint() {
    const el = document.getElementById('mode-indicator');
    if (!el) return;
    const hints = MODE_HINTS[state.lang] || MODE_HINTS['en'];
    const modeIcons = { select: '🖱️', move: '↔️', scale: '✂️', multi: '🔲' };
    el.innerHTML = `<b>${modeIcons[state.mode]} ${state.mode.toUpperCase()}</b> — ` + (hints[state.mode] || '');
}

/* =====================================================
   PARSAGE SCHEM — format Avro v0 (identique M2B/Bloxd.io)
   ===================================================== */

// LEB128 / Avro varints
function readUvarint(buf, off) {
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

function readAvroInt(buf, off) {
    const zz = readUvarint(buf, off);
    return (zz >>> 1) ^ -(zz & 1);
}

function writeUvarint(n) {
    n = Math.floor(n);
    const out = [];
    while (n >= 0x80) { out.push((n & 0x7f) | 0x80); n = Math.floor(n / 128); }
    out.push(n & 0x7f);
    return new Uint8Array(out);
}

function writeAvroInt(n) {
    n = Math.floor(n);
    const zz = n < 0 ? ((-n) * 2 - 1) : (n * 2);
    return writeUvarint(zz);
}

function readAvroString(buf, off) {
    const len = readAvroInt(buf, off);
    if (len < 0 || off.value + len > buf.length) return '';
    const bytes = buf.subarray(off.value, off.value + len);
    off.value += len;
    return new TextDecoder("utf-8").decode(bytes);
}

function readAvroBytes(buf, off) {
    const len = readAvroInt(buf, off);
    if (len < 0 || off.value + len > buf.length) return new Uint8Array(0);
    const bytes = buf.slice(off.value, off.value + len);
    off.value += len;
    return bytes;
}

function writeAvroString(s) {
    const enc = new TextEncoder().encode(s);
    const lenBuf = writeAvroInt(enc.length);
    const res = new Uint8Array(lenBuf.length + enc.length);
    res.set(lenBuf, 0); res.set(enc, lenBuf.length);
    return res;
}

function writeAvroBytes(b) {
    const lenBuf = writeAvroInt(b.length);
    const res = new Uint8Array(lenBuf.length + b.length);
    res.set(lenBuf, 0); res.set(b, lenBuf.length);
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

// Décode RLE d'un chunk → Int32Array(32768), idx = lx*1024 + ly*32 + lz
function decodeChunkRLE(rleBytes) {
    const blocks = new Int32Array(CHUNK_VOL);
    const pos = { value: 0 };
    let i = 0;
    while (i < CHUNK_VOL && pos.value < rleBytes.length) {
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
        let curr = blocks[i], run = 1;
        while (i + run < blocks.length && blocks[i + run] === curr && run < 0x7fffffff) run++;
        parts.push(writeUvarint(run));
        parts.push(writeUvarint(curr));
        i += run;
    }
    return concatBytes(parts);
}

function parseSchem(buffer) {
    const buf = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    if (!buf || buf.length < 4) throw new Error('Fichier vide ou tronqué (pas un .bloxdschem).');

    // Header magic : QUATRE octets 00 00 00 00 (format binaire .bloxdschem / M2B).
    // Tout autre début = un AUTRE format (fichier .schem JSON, archive zip,
    // fichier corrompu…) : on rejette proprement au lieu de parser la
    // « poubelle » (l'ancien code continuait et produisait un faux schématique
    // géant qui rendait toute la scène inexploitable).
    for (let i = 0; i < 4; i++) {
        if (buf[i] !== 0) throw new Error("Header .bloxdschem invalide (octet " + i + " non nul) — fichier non reconnu.");
    }
    const off = { value: 4 };

    const name = readAvroString(buf, off);
    const px = readAvroInt(buf, off);
    const py = readAvroInt(buf, off);
    const pz = readAvroInt(buf, off);
    const sx = readAvroInt(buf, off);
    const sy = readAvroInt(buf, off);
    const sz = readAvroInt(buf, off);

    // Plausibilité du header (fichier corrompu ou mal formé) : un schématique
    // légitime reste dans ces bornes (le plus gros export du Terrain Editor est
    // 2048×2048×~256 ; on laisse une marge très large).
    if ([sx, sy, sz].some(v => v <= 0 || v > 65536) ||
        [px, py, pz].some(v => Math.abs(v) > 1000000)) {
        throw new Error('Tailles/position incohérentes dans le header (fichier corrompu ?).');
    }

    const blocks = new Map();
    let totalBlocks = 0;

    // Lecture du tableau Avro (blocs de chunks)
    while (off.value < buf.length) {
        let blockCount = readAvroInt(buf, off);
        if (blockCount === 0) break;
        if (blockCount < 0) {
            blockCount = -blockCount;
            readAvroInt(buf, off); // skip byte count
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
            if (blocks.size > 100000) throw new Error('Fichier anormalement volumineux (>100000 chunks) — refusé.');
        }
    }

    // Bbox réelle
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    blocks.forEach((arr, key) => {
        const [cx, cy, cz] = key.split(",").map(Number);
        const bx0 = px + cx * CHUNK, by0 = py + cy * CHUNK, bz0 = pz + cz * CHUNK;
        for (let lx = 0; lx < CHUNK; lx++)
            for (let ly = 0; ly < CHUNK; ly++)
                for (let lz = 0; lz < CHUNK; lz++) {
                    const bid = arr[lx * 1024 + ly * 32 + lz];
                    if (bid === AIR_ID) continue;
                    const wx = bx0 + lx, wy = by0 + ly, wz = bz0 + lz;
                    if (wx < minX) minX = wx; if (wy < minY) minY = wy; if (wz < minZ) minZ = wz;
                    if (wx > maxX) maxX = wx; if (wy > maxY) maxY = wy; if (wz > maxZ) maxZ = wz;
                }
    });

    if (!isFinite(minX)) { minX = px; minY = py; minZ = pz; maxX = px; maxY = py; maxZ = pz; }

    // Normalisation : min → (0,0,0)
    const normBlocks = new Map();
    blocks.forEach((arr, key) => {
        const [scx, scy, scz] = key.split(",").map(Number);
        const chunkWX0 = px + scx * CHUNK, chunkWY0 = py + scy * CHUNK, chunkWZ0 = pz + scz * CHUNK;
        for (let lx = 0; lx < CHUNK; lx++)
            for (let ly = 0; ly < CHUNK; ly++)
                for (let lz = 0; lz < CHUNK; lz++) {
                    const bid = arr[lx * 1024 + ly * 32 + lz];
                    if (bid === AIR_ID) continue;
                    const wx = chunkWX0 + lx, wy = chunkWY0 + ly, wz = chunkWZ0 + lz;
                    const nx = wx - minX, ny = wy - minY, nz = wz - minZ;
                    const ncx = Math.floor(nx / CHUNK), ncy = Math.floor(ny / CHUNK), ncz = Math.floor(nz / CHUNK);
                    const nkey = ncx + "," + ncy + "," + ncz;
                    let nArr = normBlocks.get(nkey);
                    if (!nArr) { nArr = new Int32Array(CHUNK_VOL); normBlocks.set(nkey, nArr); }
                    const nlx = nx - ncx * CHUNK, nly = ny - ncy * CHUNK, nlz = nz - ncz * CHUNK;
                    nArr[nlx * 1024 + nly * 32 + nlz] = bid;
                }
    });

    const sizeX = maxX - minX + 1, sizeY = maxY - minY + 1, sizeZ = maxZ - minZ + 1;

    return {
        name, version: 0,
        rawPos: { x: px, y: py, z: pz }, rawSize: { x: sx, y: sy, z: sz },
        blocks: normBlocks, nonEmptyChunks: normBlocks.size, totalBlocks,
        aabb: { minX: 0, minY: 0, minZ: 0, maxX: sizeX - 1, maxY: sizeY - 1, maxZ: sizeZ - 1 },
        size: { x: sizeX, y: sizeY, z: sizeZ }
    };
}

async function parseSchemAsync(buffer, baseName) {
    return new Promise(resolve => {
        try { resolve(parseSchem(buffer)); }
        catch(e) { console.error('parseSchem error:', e); resolve(null); }
    });
}

/* =====================================================
   EXTRACTION SUB-SCHEM
   ===================================================== */
function extractSubSchem(schem, bbox, remove) {
    const bx0 = Math.floor(bbox.minX), by0 = Math.floor(bbox.minY), bz0 = Math.floor(bbox.minZ);
    const bx1 = Math.floor(bbox.maxX), by1 = Math.floor(bbox.maxY), bz1 = Math.floor(bbox.maxZ);
    const newBlocks = new Map();
    let newTotal = 0;
    const getNewChunk = (cx, cy, cz) => {
        const k = cx + "," + cy + "," + cz;
        let arr = newBlocks.get(k);
        if (!arr) { arr = new Int32Array(CHUNK_VOL); newBlocks.set(k, arr); }
        return arr;
    };
    schem.blocks.forEach((arr, key) => {
        const [cx, cy, cz] = key.split(",").map(Number);
        const cbx0 = cx * CHUNK, cby0 = cy * CHUNK, cbz0 = cz * CHUNK;
        const cbx1 = cbx0 + CHUNK - 1, cby1 = cby0 + CHUNK - 1, cbz1 = cbz0 + CHUNK - 1;
        if (cbx1 < bx0 || cbx0 > bx1 || cby1 < by0 || cby0 > by1 || cbz1 < bz0 || cbz0 > bz1) return;
        for (let lx = 0; lx < CHUNK; lx++) {
            const nx = cbx0 + lx; if (nx < bx0 || nx > bx1) continue;
            for (let ly = 0; ly < CHUNK; ly++) {
                const ny = cby0 + ly; if (ny < by0 || ny > by1) continue;
                for (let lz = 0; lz < CHUNK; lz++) {
                    const nz = cbz0 + lz; if (nz < bz0 || nz > bz1) continue;
                    const idx = lx * 1024 + ly * 32 + lz;
                    const bid = arr[idx];
                    if (bid === AIR_ID) continue;
                    const tnx = nx - bx0, tny = ny - by0, tnz = nz - bz0;
                    const tcx = Math.floor(tnx / CHUNK), tcy = Math.floor(tny / CHUNK), tcz = Math.floor(tnz / CHUNK);
                    const tArr = getNewChunk(tcx, tcy, tcz);
                    const tlx = tnx - tcx * CHUNK, tly = tny - tcy * CHUNK, tlz = tnz - tcz * CHUNK;
                    tArr[tlx * 1024 + tly * 32 + tlz] = bid;
                    newTotal++;
                    if (remove) arr[idx] = AIR_ID;
                }
            }
        }
    });
    if (newTotal === 0) return null;
    return {
        name: schem.name + '_part',
        blocks: newBlocks, nonEmptyChunks: newBlocks.size, totalBlocks: newTotal,
        aabb: { minX: 0, minY: 0, minZ: 0, maxX: bx1 - bx0, maxY: by1 - by0, maxZ: bz1 - bz0 },
        size: { x: bx1 - bx0 + 1, y: by1 - by0 + 1, z: bz1 - bz0 + 1 }
    };
}

/* Recalcule la bbox réelle d'un schem (après coupe) et re-normalise les blocs
   pour que le coin min revienne à (0,0,0). Retourne l'offset {x,y,z} du décalage
   appliqué (à ajouter à inst.pos pour conserver la position monde). */
function renormalizeSchem(schem) {
    let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
    schem.blocks.forEach((arr,key)=>{
        const[cx,cy,cz]=key.split(',').map(Number);
        const bX=cx*CHUNK,bY=cy*CHUNK,bZ=cz*CHUNK;
        for(let lx=0;lx<CHUNK;lx++)for(let ly=0;ly<CHUNK;ly++)for(let lz=0;lz<CHUNK;lz++){
            if(arr[lx*1024+ly*32+lz]===AIR_ID)continue;
            const wx=bX+lx,wy=bY+ly,wz=bZ+lz;
            if(wx<minX)minX=wx;if(wy<minY)minY=wy;if(wz<minZ)minZ=wz;
            if(wx>maxX)maxX=wx;if(wy>maxY)maxY=wy;if(wz>maxZ)maxZ=wz;
        }
    });
    if(!isFinite(minX))return{x:0,y:0,z:0};
    const newBlocks=new Map();
    schem.blocks.forEach((arr,key)=>{
        const[cx,cy,cz]=key.split(',').map(Number);
        const bX=cx*CHUNK,bY=cy*CHUNK,bZ=cz*CHUNK;
        for(let lx=0;lx<CHUNK;lx++)for(let ly=0;ly<CHUNK;ly++)for(let lz=0;lz<CHUNK;lz++){
            const bid=arr[lx*1024+ly*32+lz];
            if(bid===AIR_ID)continue;
            const nx=bX+lx-minX,ny=bY+ly-minY,nz=bZ+lz-minZ;
            const ncx=Math.floor(nx/CHUNK),ncy=Math.floor(ny/CHUNK),ncz=Math.floor(nz/CHUNK);
            const nkey=ncx+','+ncy+','+ncz;
            let nArr=newBlocks.get(nkey);
            if(!nArr){nArr=new Int32Array(CHUNK_VOL);newBlocks.set(nkey,nArr);}
            nArr[(nx-ncx*CHUNK)*1024+(ny-ncy*CHUNK)*32+(nz-ncz*CHUNK)]=bid;
        }
    });
    const sizeX=maxX-minX+1,sizeY=maxY-minY+1,sizeZ=maxZ-minZ+1;
    schem.blocks=newBlocks;
    schem.size={x:sizeX,y:sizeY,z:sizeZ};
    schem.aabb={minX:0,minY:0,minZ:0,maxX:sizeX-1,maxY:sizeY-1,maxZ:sizeZ-1};
    schem.nonEmptyChunks=newBlocks.size;
    return{x:minX,y:minY,z:minZ};
}

/* =====================================================
   INSTANCE MANAGEMENT
   ===================================================== */
const PALETTE = [
    0x4aa8ff, 0xff6b6b, 0x51cf66, 0xffd43b, 0xcc5de8, 0x20c997, 0xfd7e14, 0x868e96,
    0x339af0, 0xe64980, 0x2f9e44, 0xfab005, 0xbe4bdb, 0x12b886, 0xe8590c, 0x495057,
];

function addInstance(name, schem, forcedPos) {
    const { group, totalBlocks, width, height, depth } = SchemPlacerBabylon.buildSchemMesh(schem);
    const id = state.nextId++;
    group.getChildMeshes().forEach(mesh => { mesh.metadata = { instanceId: id }; });
    group.metadata = { instanceId: id };
    let pos;
    if (forcedPos) {
        pos = { x: forcedPos.x || 0, y: forcedPos.y || 0, z: forcedPos.z || 0 };
    } else {
        pos = findFreeSpot();
    }
    group.position.set(pos.x, pos.y, pos.z);
    const inst = {
        id, name: name || schem.name,
        schem, pos, group, color: PALETTE[(id-1) % PALETTE.length],
        aabb: { minX: 0, minY: 0, minZ: 0, maxX: width-1, maxY: height-1, maxZ: depth-1 },
        size: { x: width, y: height, z: depth }, totalBlocks, locked: false
    };
    state.instances.push(inst);
    renderList();
    select(inst);
    return inst;
}

function findFreeSpot() {
    let x = 0, y = 0, z = 0;
    const step = 10;
    let tries = 0;
    while (tries < 1000) {
        let free = true;
        for (const i of state.instances) {
            const b = i.aabb;
            if (!(i.pos.x + b.maxX < x || i.pos.x > x + step ||
                  i.pos.y + b.maxY < y || i.pos.y > y + step ||
                  i.pos.z + b.maxZ < z || i.pos.z > z + step)) {
                free = false; break;
            }
        }
        if (free) return { x, y, z };
        x += step; if (x > 500) { x = 0; z += step; }
        if (z > 500) { z = 0; y += step; }
        tries++;
    }
    return { x: 0, y: 0, z: 0 };
}

function removeInstance(inst) {
    if (!inst) return;
    if (state.selected === inst) { state.selected = null; updateInspector(); }
    state.selection.delete(inst);
    SchemPlacerBabylon.removeInstanceFromScene(inst);
    const idx = state.instances.indexOf(inst);
    if (idx >= 0) state.instances.splice(idx, 1);
    SchemPlacerBabylon.updateOutline();
    SchemPlacerBabylon.updateMultiOutlines();
    renderList(); updateInspector();
}

function duplicateInstance(inst, offset) {
    if (!inst) return null;
    const o = offset || { x: inst.size.x + 2, y: 0, z: 0 };
    const newSchem = deepCloneSchem(inst.schem);
    const newInst = addInstance(inst.name + '_copy', newSchem, {
        x: inst.pos.x + o.x, y: inst.pos.y + o.y, z: inst.pos.z + o.z
    });
    newInst.color = inst.color;
    SchemPlacerBabylon.updateOutline();
    renderList(); updateInspector();
    return newInst;
}

function deepCloneSchem(schem) {
    const blocks = new Map();
    schem.blocks.forEach((arr, key) => blocks.set(key, new Int32Array(arr)));
    return { ...schem, blocks, aabb: { ...schem.aabb }, size: { ...schem.size } };
}

function select(inst) {
    state.selected = inst;
    SchemPlacerBabylon.updateOutline();
    updateInspector();
    // If in scale mode, restart cut on the new selection
    if (state.mode === 'scale' && inst && !inst.locked) startCut();
}

function clearMultiSelection() {
    state.selection.clear();
    $$('.schem-item').forEach(el => el.classList.remove('selected-multi', 'selected'));
    SchemPlacerBabylon.updateMultiOutlines();
    updateMultiCount();
}

function toggleMultiSelect(inst) {
    if (state.selection.has(inst)) state.selection.delete(inst);
    else state.selection.add(inst);
    const el = document.querySelector(`.schem-item[data-id="${inst.id}"]`);
    if (el) el.classList.toggle('selected-multi', state.selection.has(inst));
    SchemPlacerBabylon.updateMultiOutlines();
    updateMultiCount();
}

function updateMultiCount() {
    const el = document.getElementById('multi-count');
    if (el) el.textContent = state.selection.size;
}

/* =====================================================
   INSPECTOR
   ===================================================== */
function updateInspector() {
    const sel = state.selected;
    const insp = document.getElementById('inspector');
    if (!insp) return;
    if (!sel) { insp.style.display = 'none'; return; }
    insp.style.display = 'block';
    document.getElementById('sel-name').textContent = sel.name;
    document.getElementById('sel-size').textContent = `${sel.size.x}×${sel.size.y}×${sel.size.z}`;
    document.getElementById('sel-pos').textContent = `${sel.pos.x}, ${sel.pos.y}, ${sel.pos.z}`;
    document.getElementById('sel-blocks').textContent = sel.totalBlocks.toLocaleString();
    const colorInput = document.getElementById('sel-color');
    if (colorInput) colorInput.value = '#' + sel.color.toString(16).padStart(6, '0');
}

/* =====================================================
   LIST RENDER
   ===================================================== */
function renderList() {
    const list = document.getElementById('schem-list-inner');
    if (!list) return;
    const noMsg = document.getElementById('no-schem-msg');
    const countEl = document.getElementById('schem-count');
    if (countEl) countEl.textContent = state.instances.length;
    if (state.instances.length === 0) {
        if (noMsg) noMsg.style.display = '';
        list.innerHTML = '';
        list.appendChild(noMsg || createNoMsg());
        return;
    }
    if (noMsg) noMsg.style.display = 'none';
    const currentIds = new Set(state.instances.map(i => String(i.id)));
    $$('.schem-item', list).forEach(el => {
        if (!currentIds.has(el.dataset.id)) el.remove();
    });
    for (const inst of state.instances) {
        let el = list.querySelector(`.schem-item[data-id="${inst.id}"]`);
        if (!el) { el = createSchemItem(inst); list.appendChild(el); }
        updateSchemItem(el, inst);
    }
}

function createNoMsg() {
    const div = document.createElement('div');
    div.id = 'no-schem-msg'; div.className = 'muted';
    div.textContent = 'Aucun schem. Glissez-déposez ou ';
    const span = document.createElement('span');
    span.style.color = 'var(--accent)'; span.style.cursor = 'pointer';
    span.textContent = 'cliquez sur Ouvrir';
    span.addEventListener('click', () => document.getElementById('file-input').click());
    div.appendChild(span); div.appendChild(document.createTextNode('.'));
    return div;
}

function createSchemItem(inst) {
    const div = document.createElement('div');
    div.className = 'schem-item'; div.dataset.id = inst.id;
    const color = document.createElement('div'); color.className = 'schem-color';
    const info = document.createElement('div'); info.className = 'schem-info';
    const name = document.createElement('div'); name.className = 'schem-name';
    const meta = document.createElement('div'); meta.className = 'schem-meta';
    info.appendChild(name); info.appendChild(meta);
    const lock = document.createElement('button');
    lock.className = 'schem-lock'; lock.title = 'Verrouiller/Déverrouiller'; lock.textContent = '🔓';
    const del = document.createElement('button');
    del.className = 'schem-del'; del.title = 'Supprimer'; del.textContent = '✕';
    div.appendChild(color); div.appendChild(info); div.appendChild(lock); div.appendChild(del);

    div.addEventListener('click', e => {
        e.stopPropagation();
        if (state.mode === 'multi') toggleMultiSelect(inst); else select(inst);
    });

    lock.addEventListener('click', e => {
        e.stopPropagation();
        inst.locked = !inst.locked;
        if (inst.locked) {
            SchemPlacerBabylon.removeInstanceFromScene(inst);
            inst.group = SchemPlacerBabylon.buildLockedMesh(inst);
        } else {
            SchemPlacerBabylon.removeInstanceFromScene(inst);
            inst.group = SchemPlacerBabylon.buildSchemMesh(inst.schem).group;
        }
        inst.group.getChildMeshes().forEach(m => { m.metadata = { instanceId: inst.id }; });
        inst.group.position.set(inst.pos.x, inst.pos.y, inst.pos.z);
        SchemPlacerBabylon.updateOutline(); renderList();
    });

    del.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm(`Supprimer "${inst.name}" ?`)) removeInstance(inst);
    });
    return div;
}

function updateSchemItem(el, inst) {
    const color = el.querySelector('.schem-color');
    const name = el.querySelector('.schem-name');
    const meta = el.querySelector('.schem-meta');
    const lock = el.querySelector('.schem-lock');
    if (color) color.style.background = '#' + inst.color.toString(16).padStart(6, '0');
    if (name) name.textContent = inst.name;
    if (meta) meta.textContent = `${inst.size.x}×${inst.size.y}×${inst.size.z} · ${inst.totalBlocks.toLocaleString()} blocs`;
    if (lock) lock.textContent = inst.locked ? '🔒' : '🔓';
    el.classList.toggle('locked', inst.locked);
    el.classList.toggle('selected', state.selected === inst && state.mode !== 'multi');
}

/* =====================================================
   SNAP DETECTION
   ===================================================== */
function findSnap(inst) {
    let best = null, bestDist = SNAP_THRESHOLD;
    const imin = { x: inst.pos.x + inst.aabb.minX, y: inst.pos.y + inst.aabb.minY, z: inst.pos.z + inst.aabb.minZ };
    const imax = { x: inst.pos.x + inst.aabb.maxX, y: inst.pos.y + inst.aabb.maxY, z: inst.pos.z + inst.aabb.maxZ };
    const faces = [
        { axis:'x', face:'min', c1:'y', c2:'z', p: imin.x, n: -1 },
        { axis:'x', face:'max', c1:'y', c2:'z', p: imax.x, n:  1 },
        { axis:'y', face:'min', c1:'x', c2:'z', p: imin.y, n: -1 },
        { axis:'y', face:'max', c1:'x', c2:'z', p: imax.y, n:  1 },
        { axis:'z', face:'min', c1:'x', c2:'y', p: imin.z, n: -1 },
        { axis:'z', face:'max', c1:'x', c2:'y', p: imax.z, n:  1 },
    ];
    for (const f of faces) {
        for (const other of state.instances) {
            if (other === inst) continue;
            const omin = { x: other.pos.x, y: other.pos.y, z: other.pos.z };
            const omax = { x: other.pos.x+other.size.x, y: other.pos.y+other.size.y, z: other.pos.z+other.size.z };
            const oFaceP = f.n === -1 ? omax[f.axis] : omin[f.axis];
            const dist = Math.abs(f.p - oFaceP);
            if (dist >= bestDist) continue;
            const i1Min = imin[f.c1], i1Max = imax[f.c1];
            const i2Min = imin[f.c2], i2Max = imax[f.c2];
            const o1Min = omin[f.c1], o1Max = omax[f.c1];
            const o2Min = omin[f.c2], o2Max = omax[f.c2];
            const overlap1 = Math.min(i1Max, o1Max) - Math.max(i1Min, o1Min);
            const overlap2 = Math.min(i2Max, o2Max) - Math.max(i2Min, o2Min);
            if (overlap1 <= 0 || overlap2 <= 0) continue;
            bestDist = dist;
            const newInstMin = { ...inst.pos };
            if (f.face === 'min') newInstMin[f.axis] = oFaceP;
            else newInstMin[f.axis] = oFaceP - inst.size[f.axis];
            const fc1 = Math.max(i1Min, o1Min) + overlap1*0.5;
            const fc2 = Math.max(i2Min, o2Min) + overlap2*0.5;
            let cx, cy, cz, nx, ny, nz, w, h;
            if (f.axis === 'x') { cx = newInstMin.x + (f.face==='min'?0:inst.size.x); cy = fc1; cz = fc2; nx = f.n; ny = 0; nz = 0; w = overlap2; h = overlap1; }
            else if (f.axis === 'y') { cy = newInstMin.y + (f.face==='min'?0:inst.size.y); cx = fc1; cz = fc2; nx = 0; ny = f.n; nz = 0; w = overlap2; h = overlap1; }
            else { cz = newInstMin.z + (f.face==='min'?0:inst.size.z); cx = fc1; cy = fc2; nx = 0; ny = 0; nz = f.n; w = overlap1; h = overlap2; }
            best = { axis:f.axis, face:f.face, newPos:newInstMin,
                faceCenter: new BABYLON.Vector3(cx, cy, cz),
                faceNormal: new BABYLON.Vector3(nx, ny, nz), faceSize:[w,h] };
        }
    }
    return best;
}

/* =====================================================
   MODE / UI
   ===================================================== */
function setMode(mode) {
    state.mode = mode;
    $$('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    if (mode !== 'scale') cancelCut();
    else if (state.selected && !state.selected.locked) startCut();
    if (mode !== 'multi') clearMultiSelection();
    setModeHint();
    SchemPlacerBabylon.updateCutHandlesVisibility();
    updateMultiToolbar();
    SchemPlacerBabylon.updateMultiOutlines();
    // Show/hide cut toolbar
    const tb = document.getElementById('cut-toolbar');
    if (tb) tb.classList.toggle('active', mode === 'scale' && state.selected && state.cutBoxData);
    renderList();
}

function updateMultiToolbar() {
    const toolbar = document.getElementById('multi-toolbar');
    if (toolbar) toolbar.classList.toggle('active', state.mode === 'multi');
    updateMultiCount();
}

/* =====================================================
   CUT / SPLIT
   ===================================================== */
function startCut() {
    const inst = state.selected; if (!inst) return;
    if (inst.locked) { setStatus(i18n('locked_msg')); return; }
    state.cutBoxData = { inst, x0:0, y0:0, z0:0, x1:inst.size.x-1, y1:inst.size.y-1, z1:inst.size.z-1 };
    state.cutFace = 'x1';
    SchemPlacerBabylon.updateCutHandlesVisibility();
    updateCutFaceLabel();
}

function updateCutFaceLabel() {
    const el = document.getElementById('cut-face-label');
    if (!el) return;
    if (!state.cutBoxData || !state.cutFace) { el.textContent = ''; return; }
    const d = state.cutBoxData;
    const names = { x0: 'X min', x1: 'X max', y0: 'Y min', y1: 'Y max', z0: 'Z min', z1: 'Z max' };
    const plane = state.cutFace;
    const val = d[plane] !== undefined ? d[plane] : 0;
    el.textContent = `✂️ Face: ${names[plane] || plane} = ${val}  (X/Y/Z pour changer de face, ←→↑↓ pour ajuster)`;
}

function cancelCut() {
    state.cutBoxData = null;
    state.cutFace = null;
    SchemPlacerBabylon.updateCutHandlesVisibility();
    const tb = document.getElementById('cut-toolbar');
    if (tb) tb.classList.remove('active');
}

function performCut(remove) {
    const d = state.cutBoxData; if (!d) return;
    const inst = d.inst;
    if (d.x1 - d.x0 < 0 || d.y1 - d.y0 < 0 || d.z1 - d.z0 < 0) { alert('Sélection invalide.'); return; }
    const sub = extractSubSchem(inst.schem, {minX:d.x0,minY:d.y0,minZ:d.z0,maxX:d.x1,maxY:d.y1,maxZ:d.z1}, remove);
    if (!sub) { alert('Aucun bloc dans la sélection.'); return; }
    // Position monde de la partie extraite (calculée AVANT que le schem principal ne rétrécisse)
    const subPos = { x: inst.pos.x + d.x0, y: inst.pos.y + d.y0, z: inst.pos.z + d.z0 };
    if (remove) {
        let remaining = 0;
        inst.schem.blocks.forEach(a => { for(let i=0;i<a.length;i++) if (a[i]!==AIR_ID) remaining++; });
        inst.schem.totalBlocks = remaining;
        if (remaining === 0) { removeInstance(inst); }
        else {
            // Rétrécit le schem principal à sa bbox réelle (ne garde PAS la zone coupée)
            const offset = renormalizeSchem(inst.schem);
            inst.pos.x += offset.x; inst.pos.y += offset.y; inst.pos.z += offset.z;
            SchemPlacerBabylon.rebuildInstanceMesh(inst);
        }
    }
    addInstance(sub.name, sub, subPos);
    cancelCut();
    // Restart cut on the same schem so the user can keep cutting
    if (state.selected && !state.selected.locked) startCut();
}

/* =====================================================
   UNION / SPLIT / EXPORT MULTI
   ===================================================== */
function unionSelected() {
    const sel = Array.from(state.selection).filter(i => !i.locked);
    if (sel.length < 2) { setStatus(i18n('no_union')); return; }
    const insts = sel.map(i => ({ schem: i.schem, pos: { ...i.pos } }));
    let unionName = sel.map(s=>s.name).join('+');
    if (unionName.length > 80) unionName = unionName.slice(0,77) + '...';
    // PERF: fusion directe en memoire (pas d'encode/decode binaire)
    const merged = mergeSchemsInMemory(insts, unionName);
    const pos = { x: Math.min(...sel.map(i=>i.pos.x)), y: Math.min(...sel.map(i=>i.pos.y)), z: Math.min(...sel.map(i=>i.pos.z)) };
    const removed = sel.slice();
    removed.forEach(r => {
        if (state.selected === r) state.selected = null;
        state.selection.delete(r);
        SchemPlacerBabylon.removeInstanceFromScene(r);
        const idx = state.instances.indexOf(r);
        if (idx >= 0) state.instances.splice(idx, 1);
    });
    const { group, totalBlocks, width, height, depth } = SchemPlacerBabylon.buildSchemMesh(merged);
    const newId = state.nextId++, newColor = PALETTE[(newId-1) % PALETTE.length];
    group.metadata = { instanceId: newId };
    group.getChildMeshes().forEach(m => { m.metadata = { instanceId: newId }; });
    group.position.set(pos.x, pos.y, pos.z);
    const newInst = { id: newId, name: unionName, schem: merged, pos, group, color: newColor,
        aabb: { minX:0,minY:0,minZ:0, maxX:width-1,maxY:height-1,maxZ:depth-1 },
        size: { x:width, y:height, z:depth }, totalBlocks, locked: false };
    state.instances.push(newInst);
    state.unionStack.push({ added: newInst, removed });
    cancelCut(); select(newInst); clearMultiSelection();
    renderList(); SchemPlacerBabylon.updateOutline(); SchemPlacerBabylon.updateMultiOutlines(); updateInspector();
    setStatus(i18n('union_done', unionName));
}

function splitLastUnion() {
    if (state.unionStack.length === 0) { setStatus(i18n('no_split')); return; }
    const entry = state.unionStack.pop();
    const a = entry.added;
    SchemPlacerBabylon.removeInstanceFromScene(a);
    const ai = state.instances.indexOf(a);
    if (ai >= 0) state.instances.splice(ai, 1);
    if (state.selected === a) state.selected = null;
    entry.removed.forEach(r => {
        const { group } = SchemPlacerBabylon.buildSchemMesh(r.schem);
        group.metadata = { instanceId: r.id };
        group.getChildMeshes().forEach(m => { m.metadata = { instanceId: r.id }; });
        group.position.set(r.pos.x, r.pos.y, r.pos.z);
        r.group = group; state.instances.push(r);
    });
    cancelCut(); clearMultiSelection();
    renderList(); SchemPlacerBabylon.updateOutline(); SchemPlacerBabylon.updateMultiOutlines(); updateInspector();
    setStatus(i18n('split_done', state.unionStack.length));
}

function exportSelected() {
    const sel = Array.from(state.selection);
    if (sel.length === 0) { setStatus(i18n('no_export_sel')); return; }
    let name = sel.length === 1 ? sel[0].name : 'selection';
    name = (prompt(i18n('prompt_export_name'), name) || name).trim().replace(/[^\w\-]+/g,'_') || 'selection';
    const insts = sel.map(i => ({ schem: i.schem, pos: { ...i.pos } }));
    let mnx=Infinity,mny=Infinity,mnz=Infinity,mxx=-Infinity,mxy=-Infinity,mxz=-Infinity;
    for (const it of insts) {
        const b = it.schem.aabb;
        mnx=Math.min(mnx,it.pos.x); mny=Math.min(mny,it.pos.y); mnz=Math.min(mnz,it.pos.z);
        mxx=Math.max(mxx,it.pos.x+b.maxX); mxy=Math.max(mxy,it.pos.y+b.maxY); mxz=Math.max(mxz,it.pos.z+b.maxZ);
    }
    const LIM = 160;
    const nCY = Math.ceil((mxy+1)/CHUNK);
    const mt = Math.max(1, Math.floor(Math.sqrt(LIM/Math.max(1,nCY))));
    const wmx = Math.floor(mnx/CHUNK)*CHUNK, wmz = Math.floor(mnz/CHUNK)*CHUNK,
          WMx = Math.ceil((mxx+1)/CHUNK)*CHUNK, WMz = Math.ceil((mxz+1)/CHUNK)*CHUNK;
    const nCX = Math.round((WMx-wmx)/CHUNK), nCZ = Math.round((WMz-wmz)/CHUNK);
    const totalChunksEst = nCX*nCY*nCZ;
    if (totalChunksEst <= LIM) {
        const { bytes } = buildMergedSchem(insts, name);
        const fn = name + '.bloxdschem';
        download(new Blob([bytes], {type:'application/octet-stream'}), fn);
        setStatus(i18n('export_done', fn, sel.length)); return;
    }
    const parts=[]; let num=1;
    for(let stx=Math.floor(mnx/CHUNK); stx<=Math.floor(mxx/CHUNK); stx+=mt) {
        const etx=Math.min(Math.floor(mxx/CHUNK),stx+mt-1);
        for(let stz=Math.floor(mnz/CHUNK); stz<=Math.floor(mxz/CHUNK); stz+=mt){
            const etz=Math.min(Math.floor(mxz/CHUNK),stz+mt-1);
            const res=buildRegion(insts,stx*CHUNK,(etx+1)*CHUNK-1,0,mxy,stz*CHUNK,(etz+1)*CHUNK-1, name+' part'+num);
            if(!res||!res.totalChunks) continue;
            const ox=stx*CHUNK,oz=stz*CHUNK;
            parts.push({bytes:res.bytes,name:`${name}_partie_${num}_x${ox}_z${oz}.bloxdschem`,ox,oz});num++;
        }
    }
    if (parts.length===1) { download(new Blob([parts[0].bytes]), parts[0].name); setStatus(i18n('export_done', parts[0].name, sel.length)); return; }
    const zip=new JSZip(); const folder=zip.folder(name); const lines=[];
    for (const p of parts){ folder.file(p.name,p.bytes); lines.push(`  • ${p.name} → placer en (${p.ox},0,${p.oz})`); }
    folder.file('GUIDE.txt',[`Export multi-schems : ${sel.length} schem(s), ${parts.length} partie(s).`,'', ...lines].join('\n'));
    zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}}).then(blob=>{
        download(blob, name+'.zip'); setStatus(i18n('export_parts', parts.length));
    });
}

/* Export multi : 3 modes */

// Mode 1 : UN seul schem, jamais decoupe, jamais zip
function exportMergedSingle() {
    const sel = Array.from(state.selection);
    if (sel.length === 0) { setStatus(i18n('no_export_sel')); return; }
    closeMultiExportModal();
    const insts = sel.map(i => ({ schem: i.schem, pos: { ...i.pos } }));
    let name = (prompt(i18n('prompt_export_name'), sel.length === 1 ? sel[0].name : 'selection') || 'selection').trim().replace(/[^\w\-]+/g,'_') || 'selection';
    const { bytes } = buildMergedSchem(insts, name);
    const fn = name + '.bloxdschem';
    download(new Blob([bytes], {type:'application/octet-stream'}), fn);
    setStatus(i18n('export_done', fn, sel.length));
}

/* Choix d'export multi : un seul schem (fusion) ou plusieurs (séparés) */
function openMultiExportModal() {
    if (Array.from(state.selection).length === 0) { setStatus(i18n('no_export_sel')); return; }
    document.getElementById('multi-export-modal').classList.add('active');
}
function closeMultiExportModal(){ document.getElementById('multi-export-modal').classList.remove('active'); }
function exportSeparateSelected() {
    const sel = Array.from(state.selection);
    if (sel.length === 0) { setStatus(i18n('no_export_sel')); return; }
    closeMultiExportModal();
    const parts = []; const used = {};
    for (const inst of sel) {
        const { bytes } = buildMergedSchem([{schem: inst.schem, pos:{x:0,y:0,z:0}}], inst.name);
        let base = (inst.name||'schem').replace(/[^\w\-]+/g,'_') || 'schem';
        let nm = base + '.bloxdschem', k = 1;
        while (used[nm]) { nm = base + '_' + (k++) + '.bloxdschem'; }
        used[nm] = true;
        parts.push({name:nm, bytes});
    }
    if (parts.length === 1) {
        download(new Blob([parts[0].bytes], {type:'application/octet-stream'}), parts[0].name);
        setStatus(i18n('export_done', parts[0].name, 1));
        return;
    }
    const zip = new JSZip(); const folder = zip.folder('schems');
    for (const p of parts) folder.file(p.name, p.bytes);
    zip.generateAsync({type:'blob', compression:'DEFLATE', compressionOptions:{level:6}}).then(blob => {
        download(blob, 'schems.zip');
        setStatus(i18n('export_parts', parts.length));
    });
}

/* =====================================================
   BUILD MERGED SCHEM (export)
   ===================================================== */
function mergeSchemsInMemory(insts, name) {
    // Fusionne les Maps de chunks directement en memoire (sans encoder/decoder du binaire)
    let mnx=Infinity,mny=Infinity,mnz=Infinity,mxx=-Infinity,mxy=-Infinity,mxz=-Infinity;
    for (const i of insts) {
        const b = i.schem.aabb;
        mnx=Math.min(mnx,i.pos.x); mny=Math.min(mny,i.pos.y); mnz=Math.min(mnz,i.pos.z);
        mxx=Math.max(mxx,i.pos.x+b.maxX); mxy=Math.max(mxy,i.pos.y+b.maxY); mxz=Math.max(mxz,i.pos.z+b.maxZ);
    }
    const wmx=Math.floor(mnx/CHUNK)*CHUNK, wmy=0, wmz=Math.floor(mnz/CHUNK)*CHUNK;
    const WMx=Math.ceil((mxx+1)/CHUNK)*CHUNK, WMy=Math.ceil((mxy+1)/CHUNK)*CHUNK, WMz=Math.ceil((mxz+1)/CHUNK)*CHUNK;
    const chunks = new Map();
    const arrGet = (cx,cy,cz) => {
        const k = cx+','+cy+','+cz;
        let a = chunks.get(k);
        if (!a) { a = new Int32Array(CHUNK_VOL); chunks.set(k,a); }
        return a;
    };
    let totalBlocks = 0;
    for (const inst of insts) {
        const s = inst.schem, ox = inst.pos.x, oy = inst.pos.y, oz = inst.pos.z;
        s.blocks.forEach((arr, key) => {
            const [ncx, ncy, ncz] = key.split(',').map(Number);
            for (let lx = 0; lx < CHUNK; lx++) {
                for (let ly = 0; ly < CHUNK; ly++) {
                    for (let lz = 0; lz < CHUNK; lz++) {
                        const bid = arr[lx*1024+ly*32+lz];
                        if (bid === AIR_ID) continue;
                        const nx = ncx*CHUNK+lx, ny = ncy*CHUNK+ly, nz = ncz*CHUNK+lz;
                        const wx = ox+nx, wy = oy+ny, wz = oz+nz;
                        const cx = Math.floor((wx-wmx)/CHUNK);
                        const cy = Math.floor((wy-wmy)/CHUNK);
                        const cz = Math.floor((wz-wmz)/CHUNK);
                        const clx = ((wx-wmx)%CHUNK+CHUNK)%CHUNK;
                        const cly = ((wy-wmy)%CHUNK+CHUNK)%CHUNK;
                        const clz = ((wz-wmz)%CHUNK+CHUNK)%CHUNK;
                        arrGet(cx,cy,cz)[clx*1024+cly*32+clz] = bid;
                        totalBlocks++;
                    }
                }
            }
        });
    }
    const sizeX = mxx-mnx+1, sizeY = mxy-mny+1, sizeZ = mxz-mnz+1;
    return {
        name, version: 0,
        rawPos: { x:0, y:0, z:0 }, rawSize: { x:sizeX, y:sizeY, z:sizeZ },
        blocks: chunks, nonEmptyChunks: chunks.size, totalBlocks,
        aabb: { minX:0, minY:0, minZ:0, maxX:sizeX-1, maxY:sizeY-1, maxZ:sizeZ-1 },
        size: { x:sizeX, y:sizeY, z:sizeZ }
    };
}

function buildMergedSchem(insts, name) {
    let mnx=Infinity,mny=Infinity,mnz=Infinity,mxx=-Infinity,mxy=-Infinity,mxz=-Infinity;
    for (const i of insts) {
        const b = i.schem.aabb;
        mnx=Math.min(mnx,i.pos.x); mny=Math.min(mny,i.pos.y); mnz=Math.min(mnz,i.pos.z);
        mxx=Math.max(mxx,i.pos.x+b.maxX); mxy=Math.max(mxy,i.pos.y+b.maxY); mxz=Math.max(mxz,i.pos.z+b.maxZ);
    }
    return buildRegion(insts, mnx, mxx, 0, mxy, mnz, mxz, name);
}

function buildRegion(instances, mnx, mxx, mny, mxy, mnz, mxz, name) {
    const wmx=Math.floor(mnx/CHUNK)*CHUNK, wmy=0, wmz=Math.floor(mnz/CHUNK)*CHUNK;
    const WMx=Math.ceil((mxx+1)/CHUNK)*CHUNK, WMy=Math.ceil((mxy+1)/CHUNK)*CHUNK, WMz=Math.ceil((mxz+1)/CHUNK)*CHUNK;
    const sx=WMx-wmx,sy=WMy-wmy,sz=WMz-wmz;
    const chunks = new Map();
    const arrGet = (cx,cy,cz)=>{const k=cx+','+cy+','+cz;let a=chunks.get(k);if(!a){a=new Int32Array(CHUNK_VOL);chunks.set(k,a);}return a;};
    for (const inst of instances) {
        const s=inst.schem,ox=inst.pos.x,oy=inst.pos.y,oz=inst.pos.z;
        if (ox+s.size.x-1<mnx||ox>mxx||oy+s.size.y-1<mny||oy>mxy||oz+s.size.z-1<mnz||oz>mxz) continue;
        s.blocks.forEach((arr,key)=>{
            const [ncx,ncy,ncz]=key.split(',').map(Number);
            for(let lx=0;lx<CHUNK;lx++)for(let ly=0;ly<CHUNK;ly++)for(let lz=0;lz<CHUNK;lz++){
                const bid=arr[lx*1024+ly*32+lz]; if(bid===AIR_ID) continue;
                const nx=ncx*CHUNK+lx, ny=ncy*CHUNK+ly, nz=ncz*CHUNK+lz;
                const wx=ox+nx,wy=oy+ny,wz=oz+nz;
                if(wx<mnx||wx>mxx||wy<mny||wy>mxy||wz<mnz||wz>mxz) continue;
                const cx=Math.floor((wx-wmx)/CHUNK),cy=Math.floor((wy-wmy)/CHUNK),cz=Math.floor((wz-wmz)/CHUNK);
                const clx=((wx-wmx)%CHUNK+CHUNK)%CHUNK,cly=((wy-wmy)%CHUNK+CHUNK)%CHUNK,clz=((wz-wmz)%CHUNK+CHUNK)%CHUNK;
                arrGet(cx,cy,cz)[clx*1024+cly*32+clz]=bid;
            }
        });
    }
    if(!chunks.size) return null;
    const airRle = encodeChunkRLE(new Int32Array(CHUNK_VOL));
    const nCX=Math.round(sx/CHUNK),nCY=Math.round(sy/CHUNK),nCZ=Math.round(sz/CHUNK);
    const ps=[new Uint8Array([0,0,0,0]),writeAvroString(name)];
    ps.push(writeAvroInt(0)); ps.push(writeAvroInt(0)); ps.push(writeAvroInt(0));
    ps.push(writeAvroInt(sx)); ps.push(writeAvroInt(sy)); ps.push(writeAvroInt(sz));
    const totalChunks = nCX*nCY*nCZ;
    ps.push(writeAvroInt(totalChunks));
    for(let cx=0;cx<nCX;cx++)for(let cy=0;cy<nCY;cy++)for(let cz=0;cz<nCZ;cz++){
        ps.push(writeAvroInt(cx)); ps.push(writeAvroInt(cy)); ps.push(writeAvroInt(cz));
        const arr=chunks.get(cx+','+cy+','+cz);
        ps.push(writeAvroBytes(arr?encodeChunkRLE(arr):airRle));
    }
    ps.push(writeAvroInt(0));
    return {bytes:concatBytes(ps),totalChunks};
}

/* =====================================================
   EXPORT
   ===================================================== */
function instancesForBuild() {
    return state.instances.map(i => ({ schem: i.schem, pos: { ...i.pos } }));
}

function computeExtent() {
    const insts = instancesForBuild();
    if (!insts.length) return null;
    let mnx=Infinity,mny=Infinity,mnz=Infinity,mxx=-Infinity,mxy=-Infinity,mxz=-Infinity;
    for (const i of insts) {
        mnx=Math.min(mnx,i.pos.x); mny=Math.min(mny,i.pos.y); mnz=Math.min(mnz,i.pos.z);
        mxx=Math.max(mxx,i.pos.x+i.schem.aabb.maxX); mxy=Math.max(mxy,i.pos.y+i.schem.aabb.maxY); mxz=Math.max(mxz,i.pos.z+i.schem.aabb.maxZ);
    }
    function rdn(v){return Math.floor(v/CHUNK)*CHUNK;}
    function rup(v){return Math.ceil((v+1)/CHUNK)*CHUNK;}
    const wmx=rdn(mnx),wmy=0,wmz=rdn(mnz),WMx=rup(mxx),WMy=rup(mxy),WMz=rup(mxz);
    return { gMinX:wmx,gMinY:wmy,gMinZ:wmz, gMaxX:WMx-1,gMaxY:WMy-1,gMaxZ:WMz-1,
             nCX:Math.round((WMx-wmx)/CHUNK), nCY:Math.round((WMy-wmy)/CHUNK), nCZ:Math.round((WMz-wmz)/CHUNK) };
}

function openExportModal() {
    if (!state.instances.length) { alert(i18n('export_fail')); return; }
    const ext = computeExtent();
    document.getElementById('export-info').innerHTML =
        `<div>Étendue : <b>${ext.gMaxX-ext.gMinX+1}×${ext.gMaxY-ext.gMinY+1}×${ext.gMaxZ-ext.gMinZ+1}</b> blocs</div><div>Chunks : <b>${ext.nCX*ext.nCY*ext.nCZ}</b></div><div id="export-hint2" style="margin-top:6px;"></div>`;
    document.getElementById('export-modal').classList.add('active'); updateExportHint();
}

function closeExportModal(){ document.getElementById('export-modal').classList.remove('active'); }

function updateExportHint() {
    const ext = computeExtent(); if(!ext) return;
    const total=ext.nCX*ext.nCY*ext.nCZ, LIM=160;
    const forced=document.getElementById('export-single').checked;
    let txt;
    if(forced) txt = total>LIM ? `⚠️ Un seul fichier (${total} chunks) : risque de rejet par Bloxd.` : `Un seul fichier (${total} chunks) : OK.`;
    else { const mt=Math.max(1,Math.floor(Math.sqrt(LIM/Math.max(1,ext.nCY)))); const np=Math.ceil(ext.nCX/mt)*Math.ceil(ext.nCZ/mt);
        txt = np===1 ? `Détection : 1 seul fichier (${total} chunks).` : `Détection : ${np} parties dans un zip.`; }
    document.getElementById('export-mode-hint').textContent = txt;
}

function doExport() {
    const base=(document.getElementById('export-name').value||'monde').trim().replace(/[^\w\-]+/g,'_')||'monde';
    const folder=(document.getElementById('export-folder').value||'schematics').trim()||'schematics';
    const coords=document.getElementById('export-coords').checked, forced=document.getElementById('export-single').checked;
    const insts=instancesForBuild(), ext=computeExtent(), LIM=160;
    if (!ext) { alert(i18n('export_fail')); return; }
    const mt=Math.max(1,Math.floor(Math.sqrt(LIM/Math.max(1,ext.nCY))));
    const np=Math.ceil(ext.nCX/mt)*Math.ceil(ext.nCZ/mt);
    const ts=new Date().toISOString().replace(/[:.]/g,'-').slice(0,19);
    if(!forced && np<=1){
        const {bytes}=buildMergedSchem(insts,base);
        const fn=coords?`${base}_x0_z0.bloxdschem`:`${base}.bloxdschem`;
        download(new Blob([bytes],{type:'application/octet-stream'}),fn);
        setStatus(i18n('export_done', fn, state.instances.length)); closeExportModal(); return;
    }
    if(forced){
        // Forcer un seul fichier : pas de découpage, pas de zip
        const {bytes}=buildMergedSchem(insts,base);
        const fn=coords?`${base}_x0_z0.bloxdschem`:`${base}.bloxdschem`;
        download(new Blob([bytes],{type:'application/octet-stream'}),fn);
        setStatus(i18n('export_done', fn, state.instances.length)); closeExportModal(); return;
    }
    const parts=[]; let num=1;
    for(let stx=Math.floor(ext.gMinX/CHUNK); stx<=Math.floor(ext.gMaxX/CHUNK); stx+=mt){
        const etx=Math.min(Math.floor(ext.gMaxX/CHUNK),stx+mt-1);
        for(let stz=Math.floor(ext.gMinZ/CHUNK); stz<=Math.floor(ext.gMaxZ/CHUNK); stz+=mt){
            const etz=Math.min(Math.floor(ext.gMaxZ/CHUNK),stz+mt-1);
            const res=buildRegion(insts,stx*CHUNK,(etx+1)*CHUNK-1,ext.gMinY,ext.gMaxY,stz*CHUNK,(etz+1)*CHUNK-1, base+' part'+num);
            if(!res||!res.totalChunks) continue;
            const ox=stx*CHUNK, oz=stz*CHUNK;
            const fn=coords?`${base}_partie_${num}_x${ox}_z${oz}.bloxdschem`:`${base}_partie_${num}.bloxdschem`;
            parts.push({bytes:res.bytes,name:fn,ox,oz}); num++;
        }
    }
    if(parts.length===1){ download(new Blob([parts[0].bytes]), parts[0].name); setStatus(i18n('export_done', parts[0].name, state.instances.length)); closeExportModal(); return; }
    const zip=new JSZip(); const f=zip.folder(folder); const lines=[];
    for(const p of parts){ f.file(p.name,p.bytes); lines.push(`  • ${p.name} → placer en (${p.ox},0,${p.oz}) avant //schematic load`); }
    f.file('GUIDE_IMPORTATION.txt',['============================================================','📦 GUIDE D\'IMPORTATION DANS BLOXD.IO','============================================================','',parts.length+' partie(s) à charger.','','Parties :', ...lines, '','Astuce : glissez-déposez ce zip dans le Schem Placer pour recharger la disposition.'].join('\n'));
    zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}}).then(blob=>{
        download(blob,`${base}_${ts}.zip`); setStatus(i18n('export_parts', parts.length)); closeExportModal();
    });
}

function download(blob,name){
    const url=URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url; a.download=name; document.body.appendChild(a); a.click();
    document.body.removeChild(a); setTimeout(()=>URL.revokeObjectURL(url),1000);
}

/* =====================================================
   PRESETS
   ===================================================== */
const PRESET_KEY = 'schemPlacer.presets.v1';
const AUTOSAVE_KEY = 'schemPlacer.autosave.v1';

function schemToJSON(schem) {
    const blocks = {};
    schem.blocks.forEach((arr, key) => { blocks[key] = Array.from(arr); });
    return { name: schem.name, totalBlocks: schem.totalBlocks, aabb: { ...schem.aabb }, size: { ...schem.size }, blocks };
}

function schemFromJSON(j) {
    const blocks = new Map();
    for (const k of Object.keys(j.blocks)) blocks.set(k, new Int32Array(j.blocks[k]));
    return { name: j.name || 'schem', rawPos: { x:0, y:0, z:0 }, rawSize: { ...j.size }, blocks, nonEmptyChunks: blocks.size, totalBlocks: j.totalBlocks || 0, aabb: { ...j.aabb }, size: { ...j.size } };
}

function serializeToJSON() {
    return { version: 1, savedAt: new Date().toISOString(), nextId: state.nextId, step: state.step,
        instances: state.instances.map(i => ({ id: i.id, name: i.name, pos: { ...i.pos }, color: i.color, locked: !!i.locked, schem: schemToJSON(i.schem) })),
        unionStack: state.unionStack.map(u => ({ addedId: u.added.id, removedIds: u.removed.map(r => r.id) })) };
}

function deserializeFromJSON(data) {
    if (!data || data.version !== 1) throw new Error('Version de preset incompatible');
    clearScene(true);
    state.nextId = data.nextId || 1; state.step = data.step || 1;
    const sl = document.getElementById('step-slider'), sv = document.getElementById('step-val');
    if (sl) { sl.value = state.step; if (sv) sv.textContent = state.step; }
    const instById = new Map();
    for (const ij of data.instances) {
        const schem = schemFromJSON(ij.schem);
        const isLocked = !!ij.locked;
        const inst = { id: ij.id, name: ij.name, schem, pos: { x: ij.pos.x|0, y: ij.pos.y|0, z: ij.pos.z|0 }, color: ij.color || PALETTE[ij.id % PALETTE.length], aabb: { ...schem.aabb }, size: { ...schem.size }, totalBlocks: schem.totalBlocks, locked: isLocked };
        if (isLocked) inst.group = SchemPlacerBabylon.buildLockedMesh(inst);
        else { inst.group = SchemPlacerBabylon.buildSchemMesh(schem).group; }
        inst.group.metadata = { instanceId: inst.id };
        inst.group.getChildMeshes().forEach(mesh => { mesh.metadata = { instanceId: inst.id }; });
        inst.group.position.set(inst.pos.x, inst.pos.y, inst.pos.z);
        state.instances.push(inst); instById.set(inst.id, inst);
    }
    state.unionStack = (data.unionStack || []).map(u => ({ added: instById.get(u.addedId), removed: (u.removedIds || []).map(rid => instById.get(rid)).filter(Boolean) })).filter(u => u.added);
    cancelCut(); clearMultiSelection();
    if (state.instances.length > 0) select(state.instances[0]); else select(null);
    renderList(); SchemPlacerBabylon.updateOutline(); updateInspector();
    setStatus(i18n('loaded_saved', state.instances.length));
}

function savePreset(silent) {
    const name = (prompt(i18n('save_prompt'), 'mon_preset') || '').trim();
    if (!name) return false;
    const key = name.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const presets = loadPresetsMap();
    presets[key] = { name, savedAt: new Date().toISOString(), data: serializeToJSON() };
    localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
    refreshPresetMenu();
    if (!silent) setStatus(i18n('preset_saved', name));
    return true;
}

function loadPresetsMap() {
    try { return JSON.parse(localStorage.getItem(PRESET_KEY) || '{}'); }
    catch(e) { return {}; }
}

function loadPreset(key) {
    const presets = loadPresetsMap(); const entry = presets[key]; if (!entry) return false;
    try { deserializeFromJSON(entry.data); setStatus(`📂 Preset "${entry.name}" chargé.`); return true; }
    catch(e) { alert('Échec du chargement : ' + e.message); return false; }
}

function deletePreset(key) {
    const presets = loadPresetsMap(); if (!presets[key]) return;
    if (!confirm(`Supprimer le preset "${presets[key].name}" ?`)) return;
    delete presets[key]; localStorage.setItem(PRESET_KEY, JSON.stringify(presets)); refreshPresetMenu();
}

function refreshPresetMenu() {
    const menu = document.getElementById('preset-menu'); if (!menu) return;
    menu.innerHTML = '';
    const presets = loadPresetsMap();
    const keys = Object.keys(presets).sort((a,b) => (presets[b].savedAt||'').localeCompare(presets[a].savedAt||''));
    if (keys.length === 0) { const it = document.createElement('div'); it.className = 'preset-empty'; it.textContent = i18n('preset_empty'); menu.appendChild(it); return; }
    keys.forEach(k => {
        const row = document.createElement('div'); row.className = 'preset-row';
        const d = new Date(presets[k].savedAt);
        const date = d.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
        const safeName = presets[k].name.replace(/[<>&"]/g, c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
        row.innerHTML = `<span class="preset-name" title="${safeName}">${safeName}</span><span class="preset-date">${date}</span><button class="preset-del" title="${i18n('delete')}">✕</button>`;
        row.addEventListener('click', e => { if (e.target.closest('.preset-del')) return; e.stopPropagation(); menu.classList.remove('open'); loadPreset(k); });
        row.querySelector('.preset-del').addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); deletePreset(k); });
        menu.appendChild(row);
    });
}

function autosave() { try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(serializeToJSON())); } catch(e) {} }

function tryRestoreAutosave() {
    try {
        const raw = localStorage.getItem(AUTOSAVE_KEY); if (!raw) return false;
        const data = JSON.parse(raw); if (!data.instances || !data.instances.length) return false;
        deserializeFromJSON(data); return true;
    } catch(e) { console.warn('Autosave corrompu :', e); return false; }
}

function clearScene(skipConfirm) {
    if (!skipConfirm && state.instances.length) { if (!confirm(i18n('confirm_clear'))) return false; }
    [...state.instances].forEach(i => { SchemPlacerBabylon.removeInstanceFromScene(i); });
    state.instances = []; state.selected = null; state.nextId = 1; state.unionStack = [];
    cancelCut(); clearMultiSelection();
    const mo = SchemPlacerBabylon.multiOutlines; if (mo) { mo.forEach(o => { if (o && o.dispose) o.dispose(); }); mo.length = 0; }
    SchemPlacerBabylon.updateOutline(); renderList(); updateInspector();
    if (!skipConfirm) setStatus(i18n('clear_done'));
    return true;
}

/* =====================================================
   STATUS / KEYBOARD
   ===================================================== */
function setStatus(t){ document.getElementById('status-text').textContent = t; }
function updateStatusBar() {
    const cam = SchemPlacerBabylon.getCamera();
    if (cam) { const p = cam.position; document.getElementById('cam-coord').textContent = `${Math.round(p.x)},${Math.round(p.y)},${Math.round(p.z)}`; }
    document.getElementById('step-readout').textContent = state.step;
}

function onKeyDown(e) {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { state.shiftDown = true; return; }
    if (e.code === 'Escape') { cancelCut(); clearMultiSelection(); select(null); e.preventDefault(); return; }
    if (e.code === 'KeyV') { setMode('select'); e.preventDefault(); return; }
    if (e.code === 'KeyG') { setMode('move'); e.preventDefault(); return; }
    if (e.code === 'KeyT') { setMode('scale'); e.preventDefault(); return; }
    if (e.code === 'KeyM') { setMode('multi'); e.preventDefault(); return; }
    if (e.code === 'Delete' || e.code === 'Backspace') { if (state.selected && !state.selected.locked) { removeInstance(state.selected); e.preventDefault(); } return; }
    if (e.code === 'KeyD' && (e.ctrlKey||e.metaKey)) { e.preventDefault(); if (state.selected) duplicateInstance(state.selected); else setStatus(i18n('no_sel')); return; }
    if (e.code === 'KeyO' && (e.ctrlKey||e.metaKey)) { document.getElementById('file-input').click(); e.preventDefault(); return; }
    if (e.code === 'KeyE' && (e.ctrlKey||e.metaKey)) { openExportModal(); e.preventDefault(); return; }
    if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey && state.selected) { SchemPlacerBabylon.focusOnInstance(state.selected); e.preventDefault(); return; }
    if (e.code === 'KeyL' && state.selected) { e.preventDefault(); toggleLock(state.selected); return; }

    // === SCALE MODE: keyboard cut plane adjustment ===
    if (state.mode === 'scale' && state.selected && state.cutBoxData) {
        const s = state.step * (state.shiftDown ? 10 : 1);
        let moved = false;
        // Select which face to adjust
        if (e.code === 'KeyX') { state.cutFace = (state.cutFace==='x1'?'x0':'x1'); moved = true; }
        else if (e.code === 'KeyY') { state.cutFace = (state.cutFace==='y1'?'y0':'y1'); moved = true; }
        else if (e.code === 'KeyZ') { state.cutFace = (state.cutFace==='z1'?'z0':'z1'); moved = true; }
        // Adjust selected face
        else if (state.cutFace) {
            if (e.code === 'ArrowUp' || e.code === 'ArrowRight') { SchemPlacerBabylon.adjustCutPlane(state.cutFace, s); moved = true; }
            else if (e.code === 'ArrowDown' || e.code === 'ArrowLeft') { SchemPlacerBabylon.adjustCutPlane(state.cutFace, -s); moved = true; }
        }
        if (moved) { e.preventDefault(); updateCutFaceLabel(); return; }
        return;
    }

    // Flèches + R/C = déplacer le schem (mode select/move)
    if (state.selected && !state.selected.locked && !state.gizmoDragging && !(e.ctrlKey||e.metaKey)) {
        const s = state.step * (state.shiftDown ? 10 : 1); let moved = true;
        switch (e.code) {
            case 'ArrowUp':    moveSelected(0,0,-s); break;
            case 'ArrowDown':  moveSelected(0,0, s); break;
            case 'ArrowLeft':  moveSelected(-s,0,0); break;
            case 'ArrowRight': moveSelected( s,0,0); break;
            case 'KeyR': case 'PageUp':     moveSelected(0, s,0); break;
            case 'KeyC': case 'PageDown':   moveSelected(0,-s,0); break;
            default: moved = false;
        }
        if (moved) { e.preventDefault(); return; }
    }
}

function toggleLock(inst) {
    inst.locked = !inst.locked;
    if (inst.locked) {
        SchemPlacerBabylon.removeInstanceFromScene(inst);
        inst.group = SchemPlacerBabylon.buildLockedMesh(inst);
    } else {
        SchemPlacerBabylon.removeInstanceFromScene(inst);
        inst.group = SchemPlacerBabylon.buildSchemMesh(inst.schem).group;
    }
    inst.group.getChildMeshes().forEach(m => { m.metadata = { instanceId: inst.id }; });
    inst.group.position.set(inst.pos.x, inst.pos.y, inst.pos.z);
    SchemPlacerBabylon.updateOutline(); renderList();
}

function onKeyUp(e) {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { state.shiftDown = false; }
}

function moveSelected(dx,dy,dz){
    const i=state.selected; if(!i)return; if (i.locked) return;
    i.pos.x+=dx;i.pos.y+=dy;i.pos.z+=dz;
    i.group.position.set(i.pos.x,i.pos.y,i.pos.z);
    const snap = findSnap(i);
    if (snap) { i.pos.x = snap.newPos.x; i.pos.y = snap.newPos.y; i.pos.z = snap.newPos.z; i.group.position.set(i.pos.x,i.pos.y,i.pos.z); SchemPlacerBabylon.showSnapIndicator(snap); }
    else { SchemPlacerBabylon.showSnapIndicator(null); }
    SchemPlacerBabylon.updateOutline(); updateInspector(); renderList();
}

/* =====================================================
   DRAG & DROP / FILE LOADING
   ===================================================== */
function initDragDrop() {
    const vp = document.getElementById('viewport'), ov = document.getElementById('drop-overlay'); let c=0;
    vp.addEventListener('dragenter', e=>{e.preventDefault();c++;ov.classList.add('active');});
    vp.addEventListener('dragover', e=>e.preventDefault());
    vp.addEventListener('dragleave', e=>{e.preventDefault();c--;if(c<=0){c=0;ov.classList.remove('active');}});
    vp.addEventListener('drop', async e=>{ e.preventDefault(); c=0; ov.classList.remove('active');
        const files = []; if(e.dataTransfer?.files?.length) for(let i=0;i<e.dataTransfer.files.length;i++) files.push(e.dataTransfer.files[i]);
        if(files.length) await loadFiles(files);
    });
}

function parseOffsetFromName(filename) {
    const mx = filename.match(/_x(-?\d+)/i), mz = filename.match(/_z(-?\d+)/i);
    if (mx && mz) return { x: parseInt(mx[1],10), z: parseInt(mz[1],10) };
    return null;
}

/* Détecte le format d'un fichier qui ne commence PAS par le header
   00 00 00 00 du .bloxdschem binaire : 'zip' (magie PK), 'json' (texte
   commençant par { ou [ après espaces) ou 'unknown'. */
function detectForeignFormat(buf) {
    if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && (buf[2] === 0x03 || buf[2] === 0x05)) return 'zip';
    const head = new TextDecoder('utf-8').decode(buf.subarray(0, Math.min(buf.length, 512)));
    const t = head.trimStart();
    if (t.startsWith('{') || t.startsWith('[')) return 'json';
    return 'unknown';
}

/* .schem JSON texte (format Asset Placer : {size, blocks:[{x,y,z,id}]} ou
   tableau nu) → même Map de chunks normalisée que le parser binaire. */
function parseJsonSchem(buf, baseName) {
    const text = new TextDecoder('utf-8').decode(buf);
    let parsed;
    try { parsed = JSON.parse(text); }
    catch (e) { throw new Error('JSON invalide : ' + e.message); }
    let list = null;
    if (Array.isArray(parsed)) list = parsed;
    else if (parsed && Array.isArray(parsed.blocks)) list = parsed.blocks;
    else if (parsed && Array.isArray(parsed.data)) list = parsed.data;
    if (!list) {
        if (parsed && Array.isArray(parsed.instances)) throw new Error('Ceci est un export de SCÈNE Asset Placer (instances), pas un schématique.');
        throw new Error('JSON sans liste de blocs (blocks[]) — format non supporté.');
    }
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const b of list) {
        if (!b || !b.id) continue;
        if (b.x < minX) minX = b.x; if (b.y < minY) minY = b.y; if (b.z < minZ) minZ = b.z;
        if (b.x > maxX) maxX = b.x; if (b.y > maxY) maxY = b.y; if (b.z > maxZ) maxZ = b.z;
    }
    if (!isFinite(minX)) throw new Error('Schem vide (aucun bloc).');
    const normBlocks = new Map();
    let totalBlocks = 0;
    for (const b of list) {
        if (!b || !b.id) continue;
        const nx = b.x - minX, ny = b.y - minY, nz = b.z - minZ;
        const ncx = Math.floor(nx / CHUNK), ncy = Math.floor(ny / CHUNK), ncz = Math.floor(nz / CHUNK);
        const nkey = ncx + ',' + ncy + ',' + ncz;
        let nArr = normBlocks.get(nkey);
        if (!nArr) { nArr = new Int32Array(CHUNK_VOL); normBlocks.set(nkey, nArr); }
        nArr[(nx - ncx * CHUNK) * 1024 + (ny - ncy * CHUNK) * 32 + (nz - ncz * CHUNK)] = b.id;
        totalBlocks++;
        if (normBlocks.size > 100000) throw new Error('Schem anormalement volumineux (>100000 chunks) — refusé.');
    }
    const sizeX = maxX - minX + 1, sizeY = maxY - minY + 1, sizeZ = maxZ - minZ + 1;
    return {
        name: baseName, version: 0,
        rawPos: { x: 0, y: 0, z: 0 }, rawSize: { x: sizeX, y: sizeY, z: sizeZ },
        blocks: normBlocks, nonEmptyChunks: normBlocks.size, totalBlocks,
        aabb: { minX: 0, minY: 0, minZ: 0, maxX: sizeX - 1, maxY: sizeY - 1, maxZ: sizeZ - 1 },
        size: { x: sizeX, y: sizeY, z: sizeZ }
    };
}

/* Charge un fichier (toute extension) → renvoie le nombre d'instances
   chargées (0 = échec, raison détaillée dans la console). */
async function addFromBytes(buf, filename, forcedPos) {
    const base = (filename||'schem').replace(/\.(bloxdschem|schem|bin|json)$/i,'');
    const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let schem;
    const isBinary = u8.length >= 4 && u8[0] === 0 && u8[1] === 0 && u8[2] === 0 && u8[3] === 0;
    if (isBinary) {
        try { schem = await parseSchemAsync(u8, base); }
        catch(e) { console.error(e); schem = null; }
        if (!schem) console.warn('Impossible de parser le .bloxdschem : ' + filename);
    } else {
        // Ce n'est PAS un .bloxdschem binaire → détecte ce que c'est vraiment.
        const foreign = detectForeignFormat(u8);
        if (foreign === 'zip') {
            console.warn(filename + ' : archive ZIP détectée — extraction automatique.');
            return await loadZipFromBuffer(buf, filename);
        }
        if (foreign === 'json') {
            try { schem = parseJsonSchem(u8, base); }
            catch (e) { console.warn('Schem JSON non reconnu (' + filename + ') : ' + e.message); return 0; }
            console.log(i18n('json_converted', base) + ' (' + schem.totalBlocks + ' blocs).');
        } else {
            console.warn(i18n('format_bad', filename) +
                " (attendu : binaire .bloxdschem commençant par 4 octets 00, .schem JSON, ou zip)");
            return 0;
        }
    }
    if (!schem || !schem.totalBlocks) { console.warn('Schem vide : ' + filename); return 0; }
    if (!schem.name || !schem.name.length) schem.name = base;
    addInstance(base, schem, forcedPos || null);
    return 1;
}

async function loadFiles(files) {
    let ok = 0, fail = 0; const fails = [];
    for (const f of files) {
        try {
            const low = f.name.toLowerCase();
            const buf = await f.arrayBuffer();
            const u8 = new Uint8Array(buf);
            // .zip (à l'extension), ou archive avec une mauvaise extension (magie PK)
            const isZip = low.endsWith('.zip') ||
                (u8.length >= 4 && u8[0] === 0x50 && u8[1] === 0x4b && (u8[2] === 0x03 || u8[2] === 0x05));
            if (isZip) {
                const n = await loadZipFromBuffer(buf, f.name);
                if (n) ok += n; else { fail++; fails.push(f.name); }
                continue;
            }
            const off = parseOffsetFromName(f.name);
            const n = await addFromBytes(buf, f.name, off ? { x:off.x, y:0, z:off.z } : null);
            if (n) ok += n; else { fail++; fails.push(f.name); }
        } catch (e) { console.error(e); fail++; fails.push(f.name); }
    }
    if (fail) alert(i18n('del_fail', fail) + (fails.length ? ' (' + fails.join(', ') + ')' : ''));
    if (ok) setStatus(i18n('schem_loaded', ok));
}

async function loadZipFromBuffer(buf, zipName) {
    if (typeof JSZip === 'undefined') { alert('JSZip manquant'); return 0; }
    const zip = await JSZip.loadAsync(buf);
    let count = 0; const entries = [];
    zip.forEach((rel, entry) => { if (entry.dir) return; const l = rel.toLowerCase();
        if (l.endsWith('.bloxdschem')||l.endsWith('.schem')||l.endsWith('.bin')||l.endsWith('.json')) entries.push({ name: rel.split('/').pop(), entry });
    });
    for (const {name, entry} of entries) {
        try { const b = await entry.async('arraybuffer'); const off = parseOffsetFromName(name);
            count += await addFromBytes(b, name, off ? { x:off.x, y:0, z:off.z } : null); }
        catch(e) { console.warn('Échec', name, e); }
    }
    return count;
}

/* =====================================================
   BLOCK COLORS STUB
   ===================================================== */
window.BlockColors = { blockNameMap: {}, initFromNameMap: function(map) { this.blockNameMap = map; } };

/* =====================================================
   INIT UI
   ===================================================== */
function initUI() {
    document.getElementById('file-input').addEventListener('change', e => { if(e.target.files?.length){ loadFiles(e.target.files); e.target.value=''; } });
    document.getElementById('btn-open').addEventListener('click', ()=>document.getElementById('file-input').click());
    const hint = document.getElementById('open-hint'); if (hint) hint.addEventListener('click', ()=>document.getElementById('file-input').click());
    document.getElementById('btn-export').addEventListener('click', openExportModal);
    document.getElementById('btn-export-cancel').addEventListener('click', closeExportModal);
    document.getElementById('btn-export-go').addEventListener('click', doExport);
    document.getElementById('export-single').addEventListener('change', updateExportHint);
    document.getElementById('btn-clear').addEventListener('click', ()=>{ clearScene(); });
    document.getElementById('btn-save-preset').addEventListener('click', () => { if (!state.instances.length) { setStatus('—'); return; }
        const name = (prompt(i18n('save_prompt'), 'mon_preset') || '').trim(); if (!name) return;
        const key = name.replace(/[^a-zA-Z0-9_\-]/g, '_'); const presets = loadPresetsMap();
        presets[key] = { name, savedAt: new Date().toISOString(), data: serializeToJSON() };
        localStorage.setItem(PRESET_KEY, JSON.stringify(presets)); refreshPresetMenu(); setStatus(i18n('preset_saved', name));
    });
    document.getElementById('btn-load-preset').addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); refreshPresetMenu(); document.getElementById('preset-menu').classList.toggle('open'); });
    document.addEventListener('mousedown', (e) => { const menu = document.getElementById('preset-menu'); if (menu && !e.target.closest('#preset-wrap')) menu.classList.remove('open'); });
    refreshPresetMenu();
    const btnLang = document.getElementById('btn-lang');
    if (btnLang) { btnLang.addEventListener('click', () => { setLang(state.lang === 'fr' ? 'en' : 'fr'); setModeHint(); }); }
    setLang(localStorage.getItem('bloxdTools.lang') || localStorage.getItem('schemPlacer.lang') || 'en');
    $$('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
    document.getElementById('btn-duplicate').addEventListener('click',()=>{ if (!state.selected) { setStatus(i18n('no_sel')); return; } const n = duplicateInstance(state.selected); if (n) setStatus(i18n('drag_dupe') + n.name); });
    document.getElementById('btn-delete').addEventListener('click',()=>state.selected&&removeInstance(state.selected));
    document.getElementById('btn-focus').addEventListener('click',()=>state.selected&&SchemPlacerBabylon.focusOnInstance(state.selected));
    document.getElementById('btn-rename').addEventListener('click',()=>{ const i=state.selected; if(!i)return; const n=prompt(i18n('prompt_new_name'),i.name); if(n&&n.trim()){i.name=n.trim();renderList();updateInspector();} });
    document.getElementById('sel-color').addEventListener('input',e=>{ const i=state.selected; if(!i)return; i.color=parseInt(e.target.value.slice(1),16); renderList(); SchemPlacerBabylon.updateOutline(); });
    const sl=document.getElementById('step-slider'), sv=document.getElementById('step-val');
    sl.addEventListener('input',()=>{state.step=parseInt(sl.value,10);sv.textContent=state.step;updateStatusBar();});
    document.getElementById('schem-header').addEventListener('click',()=>document.getElementById('schem-panel').classList.toggle('collapsed'));
    document.getElementById('btn-cut-cancel').addEventListener('click',()=>{cancelCut(); setMode('select');});
    document.getElementById('btn-cut-extract').addEventListener('click',()=>performCut(true));
    document.getElementById('btn-cut-copy').addEventListener('click',()=>performCut(false));
    document.getElementById('btn-multi-union').addEventListener('click', unionSelected);
    document.getElementById('btn-multi-split').addEventListener('click', splitLastUnion);
    document.getElementById('btn-multi-export').addEventListener('click', openMultiExportModal);
    document.getElementById('btn-multi-cancel').addEventListener('click', () => { clearMultiSelection(); setMode('select'); });
    document.getElementById('btn-me-single').addEventListener('click', exportMergedSingle);
    document.getElementById('btn-me-autosplit').addEventListener('click', () => { closeMultiExportModal(); exportSelected(); });
    document.getElementById('btn-me-separate').addEventListener('click', exportSeparateSelected);
    document.getElementById('btn-me-cancel').addEventListener('click', closeMultiExportModal);
    document.getElementById('multi-export-modal').addEventListener('click', e => { if(e.target.id==='multi-export-modal') closeMultiExportModal(); });
    document.getElementById('export-modal').addEventListener('click', e => { if(e.target.id==='export-modal') closeExportModal(); });
}

/* =====================================================
   BOOT
   ===================================================== */
// Empêche Ctrl/Cmd+S de déclencher la sauvegarde de la page (très gênant en édition).
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&(e.key==='s'||e.key==='S'))e.preventDefault();});
document.addEventListener('DOMContentLoaded', async () => {
    try {
    SchemPlacerBabylon.init(state);
    state.i18n = i18n; state.setStatus = setStatus; state.findSnap = findSnap;
    state.updateInspector = updateInspector; state.renderList = renderList;
    state.select = select; state.duplicateInstance = duplicateInstance;
    state.toggleMultiSelect = toggleMultiSelect;
    state.updateCutFaceLabel = updateCutFaceLabel;
    initUI(); initDragDrop();
    // Charge la table nom→id des blocs pour des couleurs fidèles (best effort ; ignoré en file://)
    fetch('nameToId.json').then(r => r.ok ? r.json() : null).then(map => {
        if (map && SchemPlacerBabylon.initBlockNameMap) {
            SchemPlacerBabylon.initBlockNameMap(map);
            if (state.instances.length) SchemPlacerBabylon.rebuildAllInstances();
        }
    }).catch(() => {});
    setMode('select');
    if (!tryRestoreAutosave()) { renderList(); setStatus(i18n('ready')); }
    refreshPresetMenu(); setModeHint();
    setInterval(autosave, 5000);
    setInterval(updateStatusBar, 500);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    } catch(e) { console.error('BOOT ERROR:', e); alert('Erreur au démarrage: ' + e.message); }
});

})();
