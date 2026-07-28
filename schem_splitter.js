/**
 * schem_splitter.js — Detect & separate units from a .bloxdschem
 * Bilingual (reads bloxdTools.lang), auto-reassembles split schems by coordinates.
 */
(function(){
'use strict';
const CHUNK=32, CHUNK_VOL=32768, AIR=0;

// ─── i18n ───
const LANG_KEY='bloxdTools.lang';
const T={
    en:{
        import:'Import .bloxdschem', detect:'Detect & Split', download:'Download ZIP',
        detectTitle:'Detect and separate units', downloadTitle:'Download units as ZIP',
        drop:'Drop your .bloxdschem here', unit:'unit', blocks:'blocks',
        unitsDetected:'unit(s) detected', platformRemoved:'platform blocks removed',
        merged:'schem parts merged by coordinates', imported:'imported', nothing:'Nothing loaded',
        dlPrefix:'Prefix for files:',dlStart:'Starting number:',dlZipName:'ZIP file name:',
        detecting:'Detecting...', noUnits:'No units found',
        autoMerged:'mini-blocks auto-fused by (x,z) column',
        clickHint:'Click a name — or a block in 3D — to select it',
    },
    fr:{
        import:'Importer .bloxdschem', detect:'Détecter & Séparer', download:'Télécharger ZIP',
        detectTitle:'Détecter et séparer les unités', downloadTitle:'Télécharger les unités en ZIP',
        drop:'Déposez votre .bloxdschem ici', unit:'unité', blocks:'blocs',
        unitsDetected:'unité(s) détectée(s)', platformRemoved:'blocs de plateforme supprimés',
        merged:'parties de schem fusionnées par coordonnées', imported:'importé', nothing:'Rien de chargé',
        detecting:'Détection...', noUnits:'Aucune unité trouvée',
        autoMerged:'mini-blocs auto-fusionnés par colonne (x,z)',
        clickHint:'Clique un nom — ou un bloc en 3D — pour le sélectionner',
    },
    ja:{
        import:'.bloxdschem インポート', detect:'検出&分割', download:'ZIP保存',
        detectTitle:'ユニットを検出して分離', downloadTitle:'ZIP保存',
        drop:'.bloxdschemをドロップ', unit:'ユニット', blocks:'ブロック',
        unitsDetected:'ユニット検出', platformRemoved:'プラットフォーム削除',
        merged:'座標でマージ', imported:'インポート済み', nothing:'未読込',
        detecting:'検出中...', noUnits:'ユニットなし',
        autoMerged:'(x,z)列で自動融合', clickHint:'名前または3Dブロックをクリックで選択',
    },
    ko:{
        import:'.bloxdschem 가져오기', detect:'감지&분할', download:'ZIP 저장',
        detectTitle:'유닛 감지 및 분리', downloadTitle:'ZIP 저장',
        drop:'.bloxdschem 드롭', unit:'유닛', blocks:'블록',
        unitsDetected:'유닛 감지됨', platformRemoved:'플랫폼 블록 제거됨',
        merged:'좌표로 병합', imported:'가져옴', nothing:'로드 안 됨',
        detecting:'감지 중...', noUnits:'유닛 없음',
        autoMerged:'(x,z) 열별 자동 병합', clickHint:'이름 또는 3D 블록 클릭하여 선택',
    },
    th:{
        import:'นำเข้า .bloxdschem', detect:'ตรวจจับ&แยก', download:'บันทึก ZIP',
        detectTitle:'ตรวจจับและแยกยูนิต', downloadTitle:'บันทึก ZIP',
        drop:'วาง .bloxdschem ที่นี่', unit:'ยูนิต', blocks:'บล็อก',
        unitsDetected:'ยูนิตที่ตรวจพบ', platformRemoved:'บล็อกแพลตฟอร์มถูกลบ',
        merged:'รวมด้วยพิกัด', imported:'นำเข้าแล้ว', nothing:'ยังไม่ได้โหลด',
        detecting:'กำลังตรวจจับ...', noUnits:'ไม่พบยูนิต',
        autoMerged:'รวมอัตโนมัติตามคอลัมน์ (x,z)', clickHint:'คลิกชื่อหรือบล็อก 3D เพื่อเลือก',
    }
};
function t(k){const l=(typeof localStorage!=='undefined'&&localStorage.getItem(LANG_KEY))||'en';return(T[l]||T.en)[k]||k;}

// ─── Avro decode ───
function ruv(b,o){let x=0,s=0;for(let i=0;i<10;i++){if(o.v>=b.length)break;const c=b[o.v++];if(c<128)return x|(c<<s);x|=(c&127)<<s;s+=7;}return x;}
function rai(b,o){const z=ruv(b,o);return(z>>>1)^-(z&1);}
function ras(b,o){const l=rai(b,o);if(l<0||o.v+l>b.length)return'';const s=b.subarray(o.v,o.v+l);o.v+=l;return new TextDecoder().decode(s);}
function rab(b,o){const l=rai(b,o);if(l<0||o.v+l>b.length)return new Uint8Array(0);const s=b.slice(o.v,o.v+l);o.v+=l;return s;}
function decodeRLE(rle){const a=new Int32Array(CHUNK_VOL);const o={v:0};let i=0;while(i<CHUNK_VOL&&o.v<rle.length){const c=ruv(rle,o);const id=ruv(rle,o);for(let k=0;k<c&&i<CHUNK_VOL;k++)a[i++]=id;}return a;}

function parseSchem(buf){
    const b=buf instanceof Uint8Array?buf:new Uint8Array(buf);
    const o={v:0};
    for(let i=0;i<4;i++){if(b[o.v]===0)o.v++;else break;}
    const name=ras(b,o);
    const px=rai(b,o),py=rai(b,o),pz=rai(b,o);
    const sx=rai(b,o),sy=rai(b,o),sz=rai(b,o);
    const blocks=new Map();let total=0,mnX=Infinity,mnY=Infinity,mnZ=Infinity,mxX=-Infinity,mxY=-Infinity,mxZ=-Infinity;
    while(o.v<b.length){
        let bc=rai(b,o);if(bc===0)break;
        if(bc<0){bc=-bc;rai(b,o);}
        for(let i=0;i<bc;i++){
            const cx=rai(b,o),cy=rai(b,o),cz=rai(b,o);
            const rle=rab(b,o);const arr=decodeRLE(rle);
            const bX=cx*CHUNK,bY=cy*CHUNK,bZ=cz*CHUNK;
            for(let lx=0;lx<CHUNK;lx++)for(let ly=0;ly<CHUNK;ly++)for(let lz=0;lz<CHUNK;lz++){
                const id=arr[lx*1024+ly*32+lz];if(id===AIR)continue;
                const wx=bX+lx,wy=bY+ly,wz=bZ+lz;
                if(wx<mnX)mnX=wx;if(wy<mnY)mnY=wy;if(wz<mnZ)mnZ=wz;
                if(wx>mxX)mxX=wx;if(wy>mxY)mxY=wy;if(wz>mxZ)mxZ=wz;total++;
            }
            blocks.set(cx+','+cy+','+cz,arr);
        }
    }
    if(!isFinite(mnX)){mnX=mnY=mnZ=0;mxX=mxY=mxZ=0;}
    const finalBlocks=new Map();
    blocks.forEach((arr,key)=>{
        const[cx,cy,cz]=key.split(',').map(Number);
        for(let lx=0;lx<CHUNK;lx++)for(let ly=0;ly<CHUNK;ly++)for(let lz=0;lz<CHUNK;lz++){
            const id=arr[lx*1024+ly*32+lz];if(id===AIR)continue;
            const wx=cx*CHUNK+lx-mnX,wy=cy*CHUNK+ly-mnY,wz=cz*CHUNK+lz-mnZ;
            const ncx=Math.floor(wx/CHUNK),ncy=Math.floor(wy/CHUNK),ncz=Math.floor(wz/CHUNK);
            const nk=ncx+','+ncy+','+ncz;
            let nA=finalBlocks.get(nk);if(!nA){nA=new Int32Array(CHUNK_VOL);finalBlocks.set(nk,nA);}
            nA[(wx-ncx*CHUNK)*1024+(wy-ncy*CHUNK)*32+(wz-ncz*CHUNK)]=id;
        }
    });
    const sX=mxX-mnX+1,sY=mxY-mnY+1,sZ=mxZ-mnZ+1;
    return{name,blocks:finalBlocks,totalBlocks:total,size:{x:sX,y:sY,z:sZ},
        rawMin:{x:mnX,y:mnY,z:mnZ},rawPos:{x:px,y:py,z:pz},aabb:{minX:0,minY:0,minZ:0,maxX:sX-1,maxY:sY-1,maxZ:sZ-1}};
}

// ─── Avro encode ───
function wuv(n){n=Math.floor(n);const o=[];while(n>=128){o.push((n&127)|128);n=Math.floor(n/128);}o.push(n&127);return new Uint8Array(o);}
function wai(n){n=Math.floor(n);const zz=n<0?((-n)*2-1):(n*2);return wuv(zz);}
function was(s){const e=new TextEncoder().encode(s);const l=wai(e.length);const r=new Uint8Array(l.length+e.length);r.set(l,0);r.set(e,l.length);return r;}
function wab(b){const l=wai(b.length);const r=new Uint8Array(l.length+b.length);r.set(l,0);r.set(b,l.length);return r;}
function encodeRLE(arr){const p=[];let i=0;while(i<arr.length){let c=arr[i],r=1;while(i+r<arr.length&&arr[i+r]===c&&r<0x7fffffff)r++;p.push(wuv(r),wuv(c));i+=r;}return cat(p);}
function cat(parts){let t=0;for(const p of parts)t+=p.length;const r=new Uint8Array(t);let o=0;for(const p of parts){r.set(p,o);o+=p.length;}return r;}
function encodeSchem(name,blocksMap,sX,sY,sZ){
    const airRle=encodeRLE(new Int32Array(CHUNK_VOL));
    const nCX=Math.ceil(sX/CHUNK),nCY=Math.ceil(sY/CHUNK),nCZ=Math.ceil(sZ/CHUNK);
    const total=nCX*nCY*nCZ;
    const ps=[new Uint8Array([0,0,0,0]),was(name),wai(0),wai(0),wai(0),wai(sX),wai(sY),wai(sZ),wai(total)];
    for(let cx=0;cx<nCX;cx++)for(let cy=0;cy<nCY;cy++)for(let cz=0;cz<nCZ;cz++){
        ps.push(wai(cx),wai(cy),wai(cz));const a=blocksMap.get(cx+','+cy+','+cz);
        ps.push(wab(a?encodeRLE(a):airRle));
    }
    ps.push(wai(0));return cat(ps);
}

// ─── Parse offset from filename (_x123_z456) ───
function parseOffsetFromName(filename){
    const mx=filename.match(/_x(-?\d+)/i),mz=filename.match(/_z(-?\d+)/i);
    if(mx&&mz)return{x:parseInt(mx[1],10),y:0,z:parseInt(mz[1],10)};
    const mx2=filename.match(/-x(-?\d+)/i),mz2=filename.match(/-z(-?\d+)/i);
    if(mx2&&mz2)return{x:parseInt(mx2[1],10),y:0,z:parseInt(mz2[1],10)};
    return null;
}

// ─── Merge multiple parsed schems into one (using offsets) ───
function mergeSchems(parsedList){
    if(parsedList.length===1)return parsedList[0];
    let mnX=Infinity,mnY=Infinity,mnZ=Infinity,mxX=-Infinity,mxY=-Infinity,mxZ=-Infinity;
    const allBlocks=[];
    parsedList.forEach(p=>{
        const off=p._offset||{x:0,y:0,z:0};const rmin=p.rawMin||{x:0,y:0,z:0};
        p.blocks.forEach((arr,key)=>{
            const[cx,cy,cz]=key.split(',').map(Number);
            for(let lx=0;lx<CHUNK;lx++)for(let ly=0;ly<CHUNK;ly++)for(let lz=0;lz<CHUNK;lz++){
                const id=arr[lx*1024+ly*32+lz];if(id===AIR)continue;
                const wx=cx*CHUNK+lx+off.x+rmin.x,wy=cy*CHUNK+ly+off.y+rmin.y,wz=cz*CHUNK+lz+off.z+rmin.z;
                if(wx<mnX)mnX=wx;if(wy<mnY)mnY=wy;if(wz<mnZ)mnZ=wz;
                if(wx>mxX)mxX=wx;if(wy>mxY)mxY=wy;if(wz>mxZ)mxZ=wz;
                allBlocks.push({wx,wy,wz,id});
            }
        });
    });
    if(!isFinite(mnX))return parsedList[0];
    const finalBlocks=new Map();
    let total=0;
    for(const b of allBlocks){
        const nx=b.wx-mnX,ny=b.wy-mnY,nz=b.wz-mnZ;
        const ncx=Math.floor(nx/CHUNK),ncy=Math.floor(ny/CHUNK),ncz=Math.floor(nz/CHUNK);
        const k=ncx+','+ncy+','+ncz;
        let a=finalBlocks.get(k);if(!a){a=new Int32Array(CHUNK_VOL);finalBlocks.set(k,a);}
        a[(nx-ncx*CHUNK)*1024+(ny-ncy*CHUNK)*32+(nz-ncz*CHUNK)]=b.id;total++;
    }
    return{name:parsedList[0].name,blocks:finalBlocks,totalBlocks:total,
        size:{x:mxX-mnX+1,y:mxY-mnY+1,z:mxZ-mnZ+1},
        aabb:{minX:0,minY:0,minZ:0,maxX:mxX-mnX,maxY:mxY-mnY,maxZ:mxZ-mnZ}};
}

// ─── Flatten / Platform removal / Connected components / Encode unit ───
function flattenVoxels(schem){
    const set=new Map();
    let mnX=Infinity,mnY=Infinity,mnZ=Infinity,mxX=-Infinity,mxY=-Infinity,mxZ=-Infinity;
    schem.blocks.forEach((arr,key)=>{
        const[cx,cy,cz]=key.split(',').map(Number);
        const bX=cx*CHUNK,bY=cy*CHUNK,bZ=cz*CHUNK;
        for(let lx=0;lx<CHUNK;lx++)for(let ly=0;ly<CHUNK;ly++)for(let lz=0;lz<CHUNK;lz++){
            const id=arr[lx*1024+ly*32+lz];if(id===AIR)continue;
            const wx=bX+lx,wy=bY+ly,wz=bZ+lz;set.set(wx+','+wy+','+wz,id);
            if(wx<mnX)mnX=wx;if(wy<mnY)mnY=wy;if(wz<mnZ)mnZ=wz;
            if(wx>mxX)mxX=wx;if(wy>mxY)mxY=wy;if(wz>mxZ)mxZ=wz;
        }
    });
    if(!isFinite(mnX))mnX=mnY=mnZ=0,mxX=mxY=mxZ=0;
    return{set,extent:{minX:mnX,minY:mnY,minZ:mnZ,maxX:mxX,maxY:mxY,maxZ:mxZ}};
}
function removePlatforms(voxels){
    const{set,extent}=voxels;const w=extent.maxX-extent.minX+1,d=extent.maxZ-extent.minZ+1;const area=w*d;let removed=0;
    const maxScanY = extent.minY + Math.min(3, extent.maxY - extent.minY);
    for(let y=extent.minY;y<=maxScanY;y++){
        let count=0;
        for(let x=extent.minX;x<=extent.maxX;x++)for(let z=extent.minZ;z<=extent.maxZ;z++){
            if(set.has(x+','+y+','+z))count++;}
        if(count>=area*0.50){
            for(let x=extent.minX;x<=extent.maxX;x++)for(let z=extent.minZ;z<=extent.maxZ;z++){const k=x+','+y+','+z;if(set.has(k)){set.delete(k);removed++;}}
        }
    }
    return removed;
}
function detectUnits(voxels){
    const{set}=voxels;const visited=new Set();const units=[];const dirs=[];
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++)
        if(dx||dy||dz)dirs.push([dx,dy,dz]);
    for(const key of set.keys()){
        if(visited.has(key))continue;
        const[x0,y0,z0]=key.split(',').map(Number);const queue=[[x0,y0,z0]];const component=[];
        let mnX=x0,mnY=y0,mnZ=z0,mxX=x0,mxY=y0,mxZ=z0;
        while(queue.length){
            const[x,y,z]=queue.pop();const k=x+','+y+','+z;
            if(visited.has(k)||!set.has(k))continue;visited.add(k);
            const id=set.get(k);component.push({x,y,z,id});
            if(x<mnX)mnX=x;if(y<mnY)mnY=y;if(z<mnZ)mnZ=z;if(x>mxX)mxX=x;if(y>mxY)mxY=y;if(z>mxZ)mxZ=z;
            for(const[dx,dy,dz]of dirs)queue.push([x+dx,y+dy,z+dz]);
        }
        if(component.length>0)units.push({blocks:component,count:component.length,aabb:{minX:mnX,minY:mnY,minZ:mnZ,maxX:mxX,maxY:mxY,maxZ:mxZ}});
    }
    units.sort((a,b)=>b.count-a.count);return units;
}
// Détection par ZONE XZ uniquement (la hauteur Y est IGNORÉE).
// Règle utilisateur : "quand on détecte un schem on ne prend pas en compte la hauteur,
// seulement une zone x et z" → un schem = une zone (x,z). Toutes les colonnes (x,z)
// 8-connexes forment UNE unité, et on rassemble TOUS les blocs (tous Y) de ces colonnes.
// → un tronc et son feuillage (même x,z) restent TOUJOURS ensemble, même s'il y a un
//   trou vertical ; un mini-bloc sur la même colonne qu'une structure est sa structure.
function detectUnitsByXZ(voxels){
    const{set}=voxels;
    const cols=new Map(); // "x,z" -> [{y,id}]
    for(const key of set.keys()){
        const p=key.split(',');const x=+p[0],y=+p[1],z=+p[2];
        const xz=x+','+z;let arr=cols.get(xz);if(!arr){arr=[];cols.set(xz,arr);}
        arr.push({y,id:set.get(key)});
    }
    const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]; // 8-connexité XZ
    const visited=new Set();const units=[];
    for(const xz of cols.keys()){
        if(visited.has(xz))continue;
        const queue=[xz];const blocks=[];
        let mnX=Infinity,mnY=Infinity,mnZ=Infinity,mxX=-Infinity,mxY=-Infinity,mxZ=-Infinity;
        while(queue.length){
            const k=queue.pop();
            if(visited.has(k)||!cols.has(k))continue;
            visited.add(k);
            const[cx,cz]=k.split(',').map(Number);
            if(cx<mnX)mnX=cx;if(cx>mxX)mxX=cx;if(cz<mnZ)mnZ=cz;if(cz>mxZ)mxZ=cz;
            for(const b of cols.get(k)){
                blocks.push({x:cx,y:b.y,z:cz,id:b.id});
                if(b.y<mnY)mnY=b.y;if(b.y>mxY)mxY=b.y;
            }
            for(const[dx,dz]of dirs)queue.push((cx+dx)+','+(cz+dz));
        }
        if(blocks.length)units.push({blocks,count:blocks.length,aabb:{minX:mnX,minY:mnY,minZ:mnZ,maxX:mxX,maxY:mxY,maxZ:mxZ}});
    }
    units.sort((a,b)=>b.count-a.count);
    return units;
}
function encodeUnit(unit,name){
    const{blocks,aabb}=unit;const sx=aabb.maxX-aabb.minX+1,sy=aabb.maxY-aabb.minY+1,sz=aabb.maxZ-aabb.minZ+1;
    const chunkMap=new Map();
    for(const b of blocks){
        const nx=b.x-aabb.minX,ny=b.y-aabb.minY,nz=b.z-aabb.minZ;
        const cx=Math.floor(nx/CHUNK),cy=Math.floor(ny/CHUNK),cz=Math.floor(nz/CHUNK);
        const k=cx+','+cy+','+cz;let arr=chunkMap.get(k);if(!arr){arr=new Int32Array(CHUNK_VOL);chunkMap.set(k,arr);}
        arr[(nx-cx*CHUNK)*1024+(ny-cy*CHUNK)*32+(nz-cz*CHUNK)]=b.id;
    }
    return encodeSchem(name,chunkMap,sx,sy,sz);
}

// ─── Block colors ───
const COLORS={2:0x6b4423,4:0x4ea64e,5:0xe8d98a,9:0x7a4d2a,10:0x6a4a2f,28:0x7d7d7d,31:0x949494,38:0xd9c48a,100:0x2f6f2d,101:0x8fb35a,102:0x3f8f35,103:0x4f8a3a};
function blockColor(id){
    if(COLORS[id]!==undefined)return COLORS[id];
    let h=id;h=((h>>>16)^h)*0x45d9f3b;h=((h>>>16)^h)*0x45d9f3b;h=(h>>>16)^h;
    return 0x404040|((h&0xffffff)&0x7f7f7f);
}
// Couleur hex d'une unité = même formule HSV que renderPreview (h=i*137.5, s=0.6, v=0.9).
// Sert à afficher le carré de couleur à côté du nom dans le panneau.
function unitColorHex(i){
    let h=(i*137.5)%360;h=(h%360+360)%360;
    const s=0.6,v=0.9,c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;
    let r=0,g=0,b=0;
    if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}
    else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}
    const hx=n=>('0'+Math.round((n+m)*255).toString(16)).slice(-2);
    return '#'+hx(r)+hx(g)+hx(b);
}

// ─── 3D Preview ───
let engine,scene,camera,canvas,previewMesh,_needsRender=true;
function initPreview(){
    canvas=document.getElementById('splitter-canvas');
    engine=new BABYLON.Engine(canvas,true,{powerPreference:'high-performance'},true);
    engine.setHardwareScalingLevel(1/Math.min(window.devicePixelRatio||1,1.5));
    scene=new BABYLON.Scene(engine);scene.clearColor=new BABYLON.Color4(0.07,0.08,0.1,1);
    camera=new BABYLON.FreeCamera('cam',new BABYLON.Vector3(30,30,-30),scene);
    camera.setTarget(new BABYLON.Vector3(0,0,0));
    camera.speed=2.0;camera.inertia=0.6;
    let isLM=false,isRM=false,prevM={x:0,y:0};
    let downX=0,downY=0,maybeClick=false; // détection clic simple vs glisser
    canvas.addEventListener('pointerdown',e=>{
        if(e.button===0){isLM=true;maybeClick=true;downX=e.clientX;downY=e.clientY;}
        if(e.button===2)isRM=true;
        prevM={x:e.clientX,y:e.clientY};
    });
    canvas.addEventListener('pointerup',e=>{
        if(e.button===0){
            isLM=false;
            // Clic simple (pas un glisser) → on sélectionne le schem pointé en 3D.
            if(maybeClick&&Math.abs(e.clientX-downX)<5&&Math.abs(e.clientY-downY)<5){
                pickUnitAt(e.clientX,e.clientY);
            }
            maybeClick=false;
        }
        if(e.button===2)isRM=false;
    });
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    canvas.addEventListener('pointermove',e=>{
        const dx=e.clientX-prevM.x,dy=e.clientY-prevM.y;
        if(isLM){
            if(Math.abs(e.clientX-downX)>=5||Math.abs(e.clientY-downY)>=5)maybeClick=false;
            camera.cameraRotation.y+=dx*0.005;camera.cameraRotation.x+=dy*0.005;
        }
        else if(isRM){
            const r=camera.getDirection(BABYLON.Axis.X),u=camera.getDirection(BABYLON.Axis.Y);
            camera.position.addInPlace(r.scale(-dx*0.05));camera.position.addInPlace(u.scale(dy*0.05));
        }
        prevM={x:e.clientX,y:e.clientY};
    });
    canvas.addEventListener('wheel',e=>{
        e.preventDefault();
        const f=camera.getDirection(BABYLON.Axis.Z);
        camera.position.addInPlace(f.scale(Math.sign(e.deltaY)*-2.5));
    },{passive:false});
    const inputMap={};
    window.addEventListener('keydown',e=>{
        if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;
        const k=typeof e.key==='string'?e.key.toLowerCase():'';if(k)inputMap[k]=true;if(e.code==='Space')e.preventDefault();
    });
    window.addEventListener('keyup',e=>{const k=typeof e.key==='string'?e.key.toLowerCase():'';if(k)inputMap[k]=false;});
    window.addEventListener('blur',()=>{for(let k in inputMap)inputMap[k]=false;});
    scene.onBeforeRenderObservable.add(()=>{
        const sp=camera.speed*(inputMap['shift']?10:1);
        const kb=(localStorage.getItem('bloxdTools.keyboard')||'azerty');
        const fk=kb==='qwerty'?'w':'z',lk=kb==='qwerty'?'a':'q';
        const fw=camera.getDirection(BABYLON.Axis.Z).normalize(),rt=camera.getDirection(BABYLON.Axis.X).normalize();
        if(inputMap[fk])camera.position.addInPlace(fw.scale(sp));
        if(inputMap['s'])camera.position.addInPlace(fw.scale(-sp));
        if(inputMap[lk])camera.position.addInPlace(rt.scale(-sp));
        if(inputMap['d'])camera.position.addInPlace(rt.scale(sp));
        if(inputMap[' '])camera.position.y+=sp;if(inputMap['control'])camera.position.y-=sp;
    });
    const hemi=new BABYLON.HemisphericLight('h',new BABYLON.Vector3(0,1,0),scene);hemi.intensity=1.2;
    let _localDirty=true;
    camera.onViewMatrixChangedObservable.add(()=>{_localDirty=true;});
    engine.runRenderLoop(()=>{
        // IMPORTANT : on force le rendu si une touche de déplacement est enfoncée.
        // Sinon, quand la caméra est immobile (_localDirty=false), scene.render() ne tourne
        // plus → onBeforeRenderObservable (qui gère ZQSD/WASD + Ctrl/Space) ne s'exécute
        // jamais → le clavier semblait "freezer" tant qu'on ne bougeait pas la souris.
        const mv=inputMap['z']||inputMap['w']||inputMap['s']||inputMap['q']||inputMap['a']||inputMap['d']||inputMap[' ']||inputMap['control'];
        if(_localDirty||_needsRender||mv){_localDirty=false;_needsRender=false;scene.render();}
    });
    window.addEventListener('resize',()=>engine.resize());
}

let _hlMesh=null,_hlVUnit=null,_hlBaseC=null,_blockUnit=null;
function renderPreview(voxels,units,highlightIdx){
    if(previewMesh){previewMesh.dispose();previewMesh=null;}
    _hlMesh=null;_hlVUnit=null;_hlBaseC=null;_blockUnit=null;
    const{set}=voxels;if(!set.size){_needsRender=true;return;}
    const hasHl=highlightIdx!==null&&highlightIdx!==undefined&&highlightIdx>=0;
    const blockCount=set.size;
    const allP=new Float32Array(blockCount*72);
    const allI=new Uint32Array(blockCount*36);
    const allN=new Float32Array(blockCount*72);
    const allC=new Float32Array(blockCount*96);
    const vUnit=new Int32Array(blockCount*24);
    const cube=BABYLON.VertexData.CreateBox({size:0.95});
    const bp=cube.positions,bi=cube.indices,bn=cube.normals;
    let pi=0,ii=0,ni=0,ci=0,vo=0;
    const uColors=units&&units.length?units.map((_,i)=>{const h=(i*137.5)%360;return BABYLON.Color3.FromHSV(h,0.6,0.9);}):null;
    const bUnit=new Map();
    if(units)units.forEach((u,i)=>u.blocks.forEach(b=>bUnit.set(b.x+','+b.y+','+b.z,i)));
    _blockUnit=units?bUnit:null; // sert au picking 3D : "x,y,z" -> index d'unité
    for(const[key,id]of set){
        const[x,y,z]=key.split(',').map(Number);
        const ui=(units&&bUnit.has(key))?bUnit.get(key):-1;
        const vivid=(ui>=0)?uColors[ui%uColors.length]:new BABYLON.Color3(((blockColor(id)>>16)&255)/255,((blockColor(id)>>8)&255)/255,(blockColor(id)&255)/255);
        const col=hasHl?(ui===highlightIdx?vivid:vivid.scale(0.14)):vivid;
        for(let i=0;i<bp.length;i+=3){allP[pi++]=bp[i]+x;allP[pi++]=bp[i+1]+y;allP[pi++]=bp[i+2]+z;}
        for(let i=0;i<bn.length;i++)allN[ni++]=bn[i];
        for(let i=0;i<bi.length;i++)allI[ii++]=bi[i]+vo;
        const nv=bp.length/3;
        for(let v=0;v<nv;v++){allC[ci++]=vivid.r;allC[ci++]=vivid.g;allC[ci++]=vivid.b;allC[ci++]=1;vUnit[vo+v]=ui;}
        vo+=nv;
    }
    if(pi===0){_needsRender=true;return;}
    // allC = couleurs VIVES (base servant de cache). Si highlight → version grisée.
    let finalC=allC;
    if(hasHl){
        finalC=new Float32Array(allC.length);
        for(let j=0;j<vUnit.length;j++){
            if(vUnit[j]===highlightIdx){finalC[j*4]=allC[j*4];finalC[j*4+1]=allC[j*4+1];finalC[j*4+2]=allC[j*4+2];finalC[j*4+3]=1;}
            else{finalC[j*4]=allC[j*4]*0.14;finalC[j*4+1]=allC[j*4+1]*0.14;finalC[j*4+2]=allC[j*4+2]*0.14;finalC[j*4+3]=1;}
        }
    }
    previewMesh=new BABYLON.Mesh('blk',scene);
    const vd=new BABYLON.VertexData();vd.positions=allP.subarray(0,pi);vd.indices=allI.subarray(0,ii);
    vd.normals=allN.subarray(0,ni);vd.colors=finalC.subarray(0,ci);vd.applyToMesh(previewMesh);
    const mat=new BABYLON.StandardMaterial('blkmat'+Date.now(),scene);
    mat.specularColor=new BABYLON.Color3(0.05,0.05,0.05);mat.backFaceCulling=true;mat.useVertexColors=true;
    previewMesh.material=mat;
    _hlMesh=previewMesh;_hlVUnit=vUnit;_hlBaseC=allC.subarray(0,ci);
    const e=voxels.extent;const cx=(e.minX+e.maxX)/2,cy=(e.minY+e.maxY)/2,cz=(e.minZ+e.maxZ)/2;
    const sz=Math.max(e.maxX-e.minX,e.maxY-e.minY,e.maxZ-e.minZ)+5;
    camera.position.set(cx+sz,cy+sz*0.6,cz-sz);
    camera.setTarget(new BABYLON.Vector3(cx,cy,cz));
    _needsRender=true;
}
// Recolore rapidement (sans reconstruire la géométrie) pour mettre en valeur une unité.
function applyHighlight(highlightIdx){
    if(!_hlMesh||!_hlBaseC||!_hlVUnit){renderPreview(currentVoxels,currentUnits,highlightIdx);return;}
    const hasHl=highlightIdx!==null&&highlightIdx!==undefined&&highlightIdx>=0;
    const c=new Float32Array(_hlBaseC.length);
    if(!hasHl){c.set(_hlBaseC);}
    else{for(let j=0;j<_hlVUnit.length;j++){
        if(_hlVUnit[j]===highlightIdx){c[j*4]=_hlBaseC[j*4];c[j*4+1]=_hlBaseC[j*4+1];c[j*4+2]=_hlBaseC[j*4+2];c[j*4+3]=1;}
        else{c[j*4]=_hlBaseC[j*4]*0.14;c[j*4+1]=_hlBaseC[j*4+1]*0.14;c[j*4+2]=_hlBaseC[j*4+2]*0.14;c[j*4+3]=1;}
    }}
    _hlMesh.setVerticesData(BABYLON.VertexBuffer.ColorKind,c);
    _needsRender=true;
}

// Sélectionne une unité : surlignage 3D + mise en valeur de la ligne dans le panneau
// (avec scroll automatique). Toggle : re-sélectionner la même unité désélectionne.
function selectUnit(idx){
    if(!currentUnits||idx<0||idx>=currentUnits.length)return;
    highlightedUnit=(highlightedUnit===idx)?null:idx;
    applyHighlight(highlightedUnit);
    const el=document.getElementById('info-panel');
    if(!el)return;
    const hl=highlightedUnit;
    el.querySelectorAll('.unit-row').forEach(r=>{
        const on=hl!==null&&hl===parseInt(r.dataset.unit,10);
        r.style.boxShadow=on?'inset 0 0 0 2px #4aa8ff':'';
        r.style.background=on?'rgba(74,168,255,0.12)':'';
        if(on&&r.scrollIntoView)r.scrollIntoView({block:'nearest',behavior:'smooth'});
    });
}

// Picking 3D : un clic (sans glisser) sur un bloc sélectionne l'unité de ce bloc.
function pickUnitAt(clientX,clientY){
    if(!previewMesh||!_blockUnit)return;
    const rect=canvas.getBoundingClientRect();
    const pi=scene.pick(clientX-rect.left,clientY-rect.top);
    if(!pi||!pi.hit||!pi.pickedPoint)return;
    const bx=Math.round(pi.pickedPoint.x),by=Math.round(pi.pickedPoint.y),bz=Math.round(pi.pickedPoint.z);
    const idx=_blockUnit.get(bx+','+by+','+bz);
    if(idx===undefined)return;
    selectUnit(idx);
}

// ─── State ───
let currentSchem=null,currentVoxels=null,currentUnits=null,highlightedUnit=null;

async function handleImport(files){
    const parsed=[];
    for(const file of files){
        try{
            const buf=await file.arrayBuffer();
            const s=parseSchem(buf);
            const off=parseOffsetFromName(file.name);
            if(off)s._offset=off;
            parsed.push(s);
        }catch(e){console.error(e);}
    }
    if(!parsed.length)return;
    const schem=parsed.length>1?mergeSchems(parsed):parsed[0];
    currentSchem=schem;
    currentVoxels=flattenVoxels(schem);
    currentUnits=null;highlightedUnit=null;
    renderPreview(currentVoxels,null);
    updateInfo(schem,currentVoxels,null,parsed.length>1?parsed.length:0);
}

const SMALL_THRESHOLD=100;

// Empreinte XZ d'une unité = ensemble des colonnes "x,z" qu'elle occupe.
// RÈGLE CLÉ : deux schems distincts ne peuvent JAMAIS partager la même colonne (x,z).
// Donc toute colonne (x,z) appartient à une seule unité : si un mini-bloc partage
// une colonne (x,z) avec une grande unité, il FAUT le fusionner dedans.
// (Justification : "ce qui est en haut est aussi en dessous" → un schem = une colonne verticale.)
function unitFootprint(unit){
    const fp=new Set();
    for(const b of unit.blocks) fp.add(b.x+','+b.z);
    return fp;
}

// Fusionne la géométrie de `small` dans `parent` (blocs + AABB + empreinte XZ en cache).
function absorbUnit(parent,small){
    for(const b of small.blocks) parent.blocks.push(b);
    parent.count+=small.count;
    parent.aabb.minX=Math.min(parent.aabb.minX,small.aabb.minX);
    parent.aabb.minY=Math.min(parent.aabb.minY,small.aabb.minY);
    parent.aabb.minZ=Math.min(parent.aabb.minZ,small.aabb.minZ);
    parent.aabb.maxX=Math.max(parent.aabb.maxX,small.aabb.maxX);
    parent.aabb.maxY=Math.max(parent.aabb.maxY,small.aabb.maxY);
    parent.aabb.maxZ=Math.max(parent.aabb.maxZ,small.aabb.maxZ);
    // Maintient l'empreinte XZ en cache (union) si les deux existent, sinon invalide.
    if(parent._footprint&&small._footprint){for(const k of small._footprint)parent._footprint.add(k);}
    else parent._footprint=null;
}

// Parent par CHEVAUCHEMENT de colonnes (x,z) : retourne l'index de la grande unité
// partageant le + de colonnes XZ avec `idx`, ou -1 si aucune ne chevauche.
function parentByOverlap(units,idx){
    const small=units[idx];
    if(!small._footprint)small._footprint=unitFootprint(small);
    const fp=small._footprint;
    let best=-1,bestOverlap=0;
    for(let i=0;i<units.length;i++){
        if(i===idx||units[i].count<SMALL_THRESHOLD)continue;
        const u=units[i];
        if(!u._footprint)u._footprint=unitFootprint(u);
        let overlap=0;
        for(const k of fp)if(u._footprint.has(k))overlap++;
        if(overlap>bestOverlap){bestOverlap=overlap;best=i;}
    }
    return best;
}

// Parent suggéré pour fusion MANUELLE : d'abord par chevauchement XZ (signal fort,
// cf. règle "2 schems ≠ même x,z"), sinon par distance des centres (fallback orphelin).
function findParentUnit(units,idx){
    const ov=parentByOverlap(units,idx);
    if(ov>=0)return ov;
    const small=units[idx];if(small.count>=SMALL_THRESHOLD)return -1;
    const sx=(small.aabb.minX+small.aabb.maxX)/2,sy=(small.aabb.minY+small.aabb.maxY)/2,sz=(small.aabb.minZ+small.aabb.maxZ)/2;
    let best=-1,bestDist=Infinity;
    for(let i=0;i<units.length;i++){
        if(i===idx||units[i].count<SMALL_THRESHOLD)continue;
        const u=units[i];
        const cx=(u.aabb.minX+u.aabb.maxX)/2,cy=(u.aabb.minY+u.aabb.maxY)/2,cz=(u.aabb.minZ+u.aabb.maxZ)/2;
        const d=(sx-cx)**2+(sy-cy)**2+(sz-cz)**2;
        if(d<bestDist){bestDist=d;best=i;}
    }
    return best;
}

// Fusionne AUTO toutes les petites unités (< SMALL_THRESHOLD) qui partagent ≥1 colonne
// (x,z) avec une grande unité. Itère jusqu'à stabilisation. Retourne le nb fusionné.
function autoMergeSmallUnits(units){
    let changed=true,guard=0,merged=0;
    while(changed&&guard++<100000){
        changed=false;
        for(let i=units.length-1;i>=0;i--){
            if(units[i].count>=SMALL_THRESHOLD)continue;
            const p=parentByOverlap(units,i);
            if(p>=0){absorbUnit(units[p],units[i]);units.splice(i,1);merged++;changed=true;break;}
        }
    }
    units.sort((a,b)=>b.count-a.count);
    return merged;
}

function mergeUnitInto(smallIdx,parentIdx){
    if(!currentUnits)return;
    const small=currentUnits[smallIdx],parent=currentUnits[parentIdx];
    if(!small||!parent)return;
    highlightedUnit=null;
    absorbUnit(parent,small);
    currentUnits.splice(smallIdx,1);
    currentUnits.sort((a,b)=>b.count-a.count);
    renderPreview(currentVoxels,currentUnits,null);
    updateInfo(currentSchem,currentVoxels,currentUnits,0,0);
}

async function handleDetect(){
    if(!currentVoxels)return;
    highlightedUnit=null;
    const btnDet=document.getElementById('btn-detect');
    if(btnDet){btnDet.disabled=true;btnDet.style.opacity=0.5;}
    await new Promise(r=>setTimeout(r,20));
    // Clone voxels
    const vc={set:new Map(currentVoxels.set),extent:{...currentVoxels.extent}};
    // Step 1: Remove floor patches (bottom 3 layers, detection PAR RECTANGLE)
    // Pour chaque couche Y, on trouve des régions 2D connectées (connexes en XZ)
    // et on teste si chaque région est un rectangle plein (plateforme).
    let totalRemoved=0;
    const maxScanY=vc.extent.minY+Math.min(3,vc.extent.maxY-vc.extent.minY);
    for(let y=vc.extent.minY;y<=maxScanY;y++){
        // Collecte tous les blocs de cette couche Y (clés "x,z")
        const layerBlocks=new Map(); // "x,z" -> fullKey
        for(const key of vc.set.keys()){
            const parts=key.split(',');
            if(parseInt(parts[1])===y) layerBlocks.set(parts[0]+','+parts[2],key);
        }
        if(layerBlocks.size<9) continue; // trop petit pour être un sol
        // Trouve les composantes connexes 2D (8-connectivité XZ)
        const visited2D=new Set();
        const dirs2D=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
        for(const xzKey of layerBlocks.keys()){
            if(visited2D.has(xzKey))continue;
            // BFS pour cette composante
            const component=[];
            const queue=[xzKey];
            let cMinX=Infinity,cMaxX=-Infinity,cMinZ=Infinity,cMaxZ=-Infinity;
            while(queue.length){
                const k=queue.pop();
                if(visited2D.has(k))continue;
                if(!layerBlocks.has(k))continue;
                visited2D.add(k);
                component.push(k);
                const[cx,cz]=k.split(',').map(Number);
                if(cx<cMinX)cMinX=cx;if(cx>cMaxX)cMaxX=cx;
                if(cz<cMinZ)cMinZ=cz;if(cz>cMaxZ)cMaxZ=cz;
                for(const[dx,dz]of dirs2D){
                    queue.push((cx+dx)+','+(cz+dz));
                }
            }
            // Test si c'est une plateforme : couvre >=60% de SA PROPRE bbox
            const compW=cMaxX-cMinX+1,compD=cMaxZ-cMinZ+1;
            const compArea=compW*compD;
            if(component.length>=compArea*0.60 && compW>=3 && compD>=3){
                // Supprime cette composante
                for(const xz of component){
                    const fullKey=layerBlocks.get(xz);
                    if(fullKey){vc.set.delete(fullKey);totalRemoved++;}
                }
            }
        }
    }
    await new Promise(r=>setTimeout(r,0));
    // Step 2: Détection par ZONE XZ (la hauteur Y est ignorée) : un schem = une zone (x,z).
    // Toutes les colonnes 8-connexes forment une unité ; on rassemble tous les blocs
    // (tous Y) → tronc + feuillage + mini-blocs sur la même colonne restent ensemble.
    // (autoMergeSmallUnits reste en filet de sécurité, généralement no-op avec la détection XZ.)
    const units=detectUnitsByXZ(vc);
    const autoMerged=autoMergeSmallUnits(units);
    currentUnits=units;currentVoxels=vc;
    await new Promise(r=>setTimeout(r,0));
    // Step 3: Render
    renderPreview(vc,units,null);
    updateInfo(currentSchem,vc,units,0,totalRemoved,autoMerged);
    if(btnDet){btnDet.disabled=false;btnDet.style.opacity=1;}
}

async function handleDownload(){
    if(!currentUnits||!currentUnits.length)return;
    const pEl=document.getElementById('dl-prefix'),sEl=document.getElementById('dl-start'),zEl=document.getElementById('dl-zip');
    const prefix=(pEl&&pEl.value||'unit').trim().replace(/[^\w\-]+/g,'_')||'unit';
    const startNum=parseInt(sEl&&sEl.value||'1',10)||1;
    const padLen=Math.max(3,String(startNum+currentUnits.length-1).length);
    const zipName=(zEl&&zEl.value||'export').trim().replace(/[^\w\-]+/g,'_')||'export';
    const zip=new JSZip();
    currentUnits.forEach((u,i)=>{
        const name=prefix+String(startNum+i).padStart(padLen,'0');
        zip.file(name+'.bloxdschem',encodeUnit(u,name));
    });
    const manifest={schematics:currentUnits.map((u,i)=>{
        const name=prefix+String(startNum+i).padStart(padLen,'0');
        return{file:name+'.bloxdschem',name,type:'auto',biome:'classic'};
    })};
    zip.file('manifest.json',JSON.stringify(manifest,null,2));
    const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=zipName+'.zip';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function updateInfo(schem,voxels,units,mergedCount,platformRemoved,autoMerged){
    const el=document.getElementById('info-panel');if(!el)return;
    const e=voxels.extent;const vc=voxels.set.size;
    let html=`<div><b>${schem.name}</b></div>`;
    if(mergedCount>1)html+=`<div style="color:var(--accent-2,#3dd48a)">🔗 ${mergedCount} ${t('merged')}</div>`;
    html+=`<div>${vc} ${t('blocks')} · ${e.maxX-e.minX+1}×${e.maxY-e.minY+1}×${e.maxZ-e.minZ+1}</div>`;
    if(platformRemoved>0)html+=`<div style="color:var(--warn,#ffb020)">🏢 ${platformRemoved} ${t('platformRemoved')}</div>`;
    if(autoMerged>0)html+=`<div style="color:var(--accent,#4aa8ff)">🔗 ${autoMerged} ${t('autoMerged')}</div>`;
    if(units){
        const smalls=units.filter(u=>u.count<SMALL_THRESHOLD);
        html+=`<hr><div style="display:flex;gap:4px;margin-bottom:6px;">`;
        html+=`<input id="dl-prefix" value="tree" placeholder="prefix" style="flex:2;background:#101218;border:1px solid #3b435b;color:#eef2f8;border-radius:4px;padding:4px 6px;font-size:11px;">`;
        html+=`<input id="dl-start" type="number" value="1" style="flex:1;background:#101218;border:1px solid #3b435b;color:#eef2f8;border-radius:4px;padding:4px 6px;font-size:11px;">`;
        html+=`<input id="dl-zip" value="export" placeholder="zip" style="flex:2;background:#101218;border:1px solid #3b435b;color:#eef2f8;border-radius:4px;padding:4px 6px;font-size:11px;">`;
        html+=`</div>`;
        html+=`<div><b>${units.length} ${t('unitsDetected')}</b>${smalls.length>0?` <span style="color:#ffb020">(${smalls.length} < 100)</span>`:''}</div>`;
        html+=`<div class="click-hint">💡 ${t('clickHint')}</div>`;
        units.forEach((u,i)=>{
            const b=u.aabb;const num=String(i+1).padStart(3,'0');
            const sw=unitColorHex(i);
            const active=(highlightedUnit!==null&&highlightedUnit===i);
            const hl=active?'box-shadow:inset 0 0 0 2px #4aa8ff;background:rgba(74,168,255,0.12);':'';
            let row=`<div class="unit-row" data-unit="${i}" style="${hl}">`;
            row+=`<span class="uswatch" style="background:${sw}"></span>`;
            if(u.count<SMALL_THRESHOLD){
                const parent=findParentUnit(units,i);
                row+=`<span style="color:#ffb020">${t('unit')}${num}: ${u.count} ${t('blocks')}</span>`;
                if(parent>=0){
                    const pNum=String(parent+1).padStart(3,'0');
                    row+=` <button class="merge-btn" data-merge="${i}" data-parent="${parent}" title="${t('unit')}${pNum}">🔗 ${t('unit')}${pNum}</button>`;
                } else { row+=` <span style="color:#ffb020">⚠️</span>`; }
            } else {
                row+=`${t('unit')}${num}: ${u.count} ${t('blocks')} <span style="color:var(--muted,#8c95ac)">(${b.maxX-b.minX+1}×${b.maxY-b.minY+1}×${b.maxZ-b.minZ+1})</span>`;
            }
            row+=`</div>`;
            html+=row;
        });
    }
    el.innerHTML=html;
    // Clic sur un nom → sélectionne l'unité (surlignage 3D + ligne active), comme un clic 3D.
    el.querySelectorAll('[data-unit]').forEach(row=>{
        row.addEventListener('click',()=>selectUnit(parseInt(row.dataset.unit,10)));
    });
    // Bouton 🔗 → fusion manuelle d'une petite unité orpheline dans son parent suggéré.
    el.querySelectorAll('[data-merge]').forEach(btn=>{
        btn.addEventListener('click',e=>{
            e.stopPropagation();
            highlightedUnit=null;
            mergeUnitInto(parseInt(btn.dataset.merge,10),parseInt(btn.dataset.parent,10));
        });
    });
}

function applyI18n(){
    const btnImp=document.getElementById('btn-import');
    const btnDet=document.getElementById('btn-detect');
    const btnDl=document.getElementById('btn-download');
    const dropMsg=document.querySelector('.drop-msg');
    if(btnImp)btnImp.innerHTML='<span>📂</span> '+t('import');
    if(btnDet)btnDet.innerHTML='<span>✂️</span> '+t('detect');
    if(btnDl)btnDl.innerHTML='<span>📦</span> '+t('download');
    if(btnDet)btnDet.title=t('detectTitle');
    if(btnDl)btnDl.title=t('downloadTitle');
    if(dropMsg)dropMsg.textContent=t('drop');
}

// ─── Init ───
// Empêche Ctrl/Cmd+S de déclencher la sauvegarde de la page (très gênant en édition).
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&(e.key==='s'||e.key==='S'))e.preventDefault();});
document.addEventListener('DOMContentLoaded',()=>{
    initPreview();applyI18n();
    document.getElementById('btn-import').addEventListener('click',()=>document.getElementById('file-input').click());
    document.getElementById('file-input').addEventListener('change',async e=>{
        if(e.target.files.length)await handleImport(Array.from(e.target.files));
        e.target.value='';
    });
    document.getElementById('btn-detect').addEventListener('click',handleDetect);
    document.getElementById('btn-download').addEventListener('click',handleDownload);
    // F = recentrer sur le schem
    window.addEventListener('keydown',e=>{
        if(e.key==='f'||e.key==='F'){
            if(e.ctrlKey||e.metaKey||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;
            if(currentVoxels){renderPreview(currentVoxels,currentUnits,highlightedUnit);e.preventDefault();}
        }
    });
    const ov=document.getElementById('drop-overlay');
    canvas.addEventListener('dragover',e=>{e.preventDefault();ov.classList.add('active');});
    canvas.addEventListener('dragleave',()=>ov.classList.remove('active'));
    canvas.addEventListener('drop',async e=>{e.preventDefault();ov.classList.remove('active');
        if(e.dataTransfer.files.length)await handleImport(Array.from(e.dataTransfer.files));});
});
})();
