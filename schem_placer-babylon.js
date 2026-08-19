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
