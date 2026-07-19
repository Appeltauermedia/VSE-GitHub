/* ===== Auswahl, Gruppen und Objektverwaltung ===== */
function isCanvasLockedImageAsset(o){return !!(o&&o.type==='imageAsset'&&o.imageAssetLocked);}
function particlePathLocalBounds(o){
  const pts=Array.isArray(o.particlePathPoints)?o.particlePathPoints:[];
  if((o.particlePathShape||'line')==='freehand'&&pts.length){
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const p of pts){
      const x=Number(p.x)||0,y=Number(p.y)||0;
      minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
    }
    const pad=Number(o.particlePathSpread??18)+Number(o.particleSize??4)*3;
    return {minX:minX-pad,minY:minY-pad,maxX:maxX+pad,maxY:maxY+pad};
  }
  const w=Math.max(20,Number(o.particlePathWidth??360));
  const h=Math.max(20,Number(o.particlePathHeight??180));
  const pad=Number(o.particlePathSpread??18)+Number(o.particleSize??4)*3;
  return {minX:-w/2-pad,minY:-h/2-pad,maxX:w/2+pad,maxY:h/2+pad};
}
function particlePathBBoxCss(o){
  const x=objCssX(o),y=objCssY(o),b=particlePathLocalBounds(o);
  return {x:x+su(b.minX),y:y+su(b.minY),w:su(b.maxX-b.minX),h:su(b.maxY-b.minY)};
}
function hitParticlePathCss(o,mx,my){
  const dx=mx-objCssX(o),dy=my-objCssY(o),a=-Number(o.rotation||0)*Math.PI/180;
  const qx=(dx*Math.cos(a)-dy*Math.sin(a))/stageScale();
  const qy=(dx*Math.sin(a)+dy*Math.cos(a))/stageScale();
  const b=particlePathLocalBounds(o);
  return qx>=b.minX&&qx<=b.maxX&&qy>=b.minY&&qy<=b.maxY;
}
function rotatedBoxBBoxCss(cx,cy,w,h,rotationDeg){
  const a=Number(rotationDeg||0)*Math.PI/180,hw=Math.max(1,w)/2,hh=Math.max(1,h)/2;
  const pts=[[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([x,y])=>({x:cx+x*Math.cos(a)-y*Math.sin(a),y:cy+x*Math.sin(a)+y*Math.cos(a)}));
  const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  return {x:minX,y:minY,w:maxX-minX,h:maxY-minY};
}
const screenCornerHandles={nw:'TL',ne:'TR',se:'BR',sw:'BL'};
function isScreenCornerTransformObject(o){
  return !!(o&&o.type==='screen'&&o.screenCornerPerspective);
}
function screenCornerLocalPoints(o){
  const hw=Number(o.screenWidth||260)/2,hh=Number(o.screenHeight||120)/2;
  return {
    nw:{x:-hw+Number(o.screenCornerTLX||0),y:-hh+Number(o.screenCornerTLY||0)},
    ne:{x: hw+Number(o.screenCornerTRX||0),y:-hh+Number(o.screenCornerTRY||0)},
    se:{x: hw+Number(o.screenCornerBRX||0),y: hh+Number(o.screenCornerBRY||0)},
    sw:{x:-hw+Number(o.screenCornerBLX||0),y: hh+Number(o.screenCornerBLY||0)}
  };
}
function screenCornerCanvasPoints(o){
  const cx=objCssX(o),cy=objCssY(o),a=Number(o.rotation||0)*Math.PI/180,sc=stageScale();
  const local=screenCornerLocalPoints(o);
  return Object.fromEntries(Object.entries(local).map(([key,p])=>[
    key,
    {x:cx+p.x*sc*Math.cos(a)-p.y*sc*Math.sin(a),y:cy+p.x*sc*Math.sin(a)+p.y*sc*Math.cos(a)}
  ]));
}
function bboxFromPoints(points){
  const arr=Array.isArray(points)?points:Object.values(points);
  const xs=arr.map(p=>p.x),ys=arr.map(p=>p.y);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  return {x:minX,y:minY,w:maxX-minX,h:maxY-minY};
}
function pointInPolygonCss(mx,my,points){
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const pi=points[i],pj=points[j];
    if(((pi.y>my)!==(pj.y>my))&&(mx<(pj.x-pi.x)*(my-pi.y)/(pj.y-pi.y)+pi.x))inside=!inside;
  }
  return inside;
}
function hitScreenCornerCss(o,mx,my){
  if(!isScreenCornerTransformObject(o))return false;
  const pad=8*stageScale(),pts=screenCornerCanvasPoints(o);
  if(pointInPolygonCss(mx,my,[pts.nw,pts.ne,pts.se,pts.sw]))return true;
  return Object.values(pts).some(p=>Math.hypot(mx-p.x,my-p.y)<=pad);
}
function screenCornerBBoxCss(o){
  const pad=8*stageScale(),b=bboxFromPoints(screenCornerCanvasPoints(o));
  return {x:b.x-pad,y:b.y-pad,w:b.w+pad*2,h:b.h+pad*2};
}
function setScreenCornerOffsetFromCanvas(o,handle,mx,my){
  const key=screenCornerHandles[handle];
  if(!key)return;
  const dx=(mx-objCssX(o))/Math.max(.0001,stageScale());
  const dy=(my-objCssY(o))/Math.max(.0001,stageScale());
  const a=-Number(o.rotation||0)*Math.PI/180;
  const localX=dx*Math.cos(a)-dy*Math.sin(a);
  const localY=dx*Math.sin(a)+dy*Math.cos(a);
  const base=screenCornerLocalPoints({...o,screenCornerTLX:0,screenCornerTLY:0,screenCornerTRX:0,screenCornerTRY:0,screenCornerBRX:0,screenCornerBRY:0,screenCornerBLX:0,screenCornerBLY:0})[handle];
  o['screenCorner'+key+'X']=localX-base.x;
  o['screenCorner'+key+'Y']=localY-base.y;
}
function lightEmitterBBoxCss(o){
  const x=objCssX(o),y=objCssY(o),shape=o.type==='light'?(o.lightEmitterShape||'point'):'point';
  if(o.type==='lightbar'){
    const len=su(o.lightbarLength??320),th=Math.max(14*stageScale(),su(o.size||56)*.035);
    return rotatedBoxBBoxCss(x,y,th,len,typeof effectiveRotation==='function'?effectiveRotation(o):Number(o.rotation||0));
  }
  if(shape==='line'){
    const len=su(o.lightEmitterLength??240),th=Math.max(14*stageScale(),su(o.size||44)*.24);
    return rotatedBoxBBoxCss(x,y,th,len,typeof effectiveRotation==='function'?effectiveRotation(o):Number(o.rotation||0));
  }
  if(shape==='rectangle'){
    return rotatedBoxBBoxCss(x,y,su(o.lightEmitterWidth??480),su(o.lightEmitterHeight??270),typeof effectiveRotation==='function'?effectiveRotation(o):Number(o.rotation||0));
  }
  const r=Math.max(14*stageScale(),su(o.size||44)*.5);
  return {x:x-r,y:y-r,w:r*2,h:r*2};
}
function lightEmitterTransformBoxCss(o){
  const cx=objCssX(o),cy=objCssY(o),shape=o.type==='light'?(o.lightEmitterShape||'point'):'point';
  let w,h,rotation=typeof effectiveRotation==='function'?effectiveRotation(o):Number(o.rotation||0);
  if(o.type==='lightbar'){
    w=Math.max(14*stageScale(),su(o.size||56)*.035);
    h=su(o.lightbarLength??320);
  }else if(shape==='line'){
    w=Math.max(14*stageScale(),su(o.size||44)*.24);
    h=su(o.lightEmitterLength??240);
  }else if(shape==='rectangle'){
    w=su(o.lightEmitterWidth??480);
    h=su(o.lightEmitterHeight??270);
  }else{
    const r=Math.max(14*stageScale(),su(o.size||44)*.5);
    w=r*2;h=r*2;rotation=0;
  }
  w=Math.max(8,w);h=Math.max(8,h);
  return {x:cx-w/2,y:cy-h/2,w,h,cx,cy,rotation};
}
function isLinearLightTransformObject(o){
  return !!(o&&(o.type==='lightbar'||(o.type==='light'&&(o.lightEmitterShape||'point')==='line')));
}
function particleLineEmitterTransformBoxCss(o){
  const cx=objCssX(o),cy=objCssY(o);
  const w=Math.max(8,Math.max(3*stageScale(),su(o.size||72)*0.08));
  const h=Math.max(8,su(o.particleEmitterLength??120));
  return {x:cx-w/2,y:cy-h/2,w,h,cx,cy,rotation:Number(o.rotation||0)};
}
function imageParticleRenderSizeCss(o){
  const base=Math.max(1,su(o.size||140)*Number(o.ipmScale??1));
  const aspect=Math.max(0.05,Number(o.particleImageAspect||1));
  return aspect>=1?{w:base,h:base/aspect}:{w:base*aspect,h:base};
}
function isLinearEmitterTransformObject(o){
  return !!(isLinearLightTransformObject(o)||(o&&o.type==='particle'&&(o.particleEmitterShape||'point')==='line'&&(o.particleMode||'free')!=='pathFlow'));
}
function centeredTransformBoxCss(o,w,h,rotation=Number(o&&o.rotation||0)){
  const cx=objCssX(o),cy=objCssY(o);
  w=Math.max(8,Number(w)||8);h=Math.max(8,Number(h)||8);
  return {x:cx-w/2,y:cy-h/2,w,h,cx,cy,rotation:Number(rotation||0)};
}
function objectTransformBoxCss(o){
  if(o&&(o.type==='light'||o.type==='lightbar'))return lightEmitterTransformBoxCss(o);
  if(o&&o.type==='particle'&&(o.particleEmitterShape||'point')==='line'&&(o.particleMode||'free')!=='pathFlow')return particleLineEmitterTransformBoxCss(o);
  if(o&&o.type==='imageParticle'){const ps=imageParticleRenderSizeCss(o);return centeredTransformBoxCss(o,ps.w,ps.h);}
  if(o&&(o.type==='screen'||o.type==='text'))return centeredTransformBoxCss(o,su(o.screenWidth||(o.type==='text'?520:260)),su(o.screenHeight||(o.type==='text'?180:120)));
  if(o&&o.type==='imageAsset'){const ps=imageAssetRenderSize(o);return centeredTransformBoxCss(o,su(ps.w),su(ps.h));}
  if(o&&isWaterObject(o))return centeredTransformBoxCss(o,su(o.waterWidth||420),su(o.waterHeight||180));
  if(o&&o.type==='mandalaVisualizer')return centeredTransformBoxCss(o,su(o.mandalaObjWidth||420),su(o.mandalaObjHeight||420));
  if(o&&o.type==='visualizer')return centeredTransformBoxCss(o,su(o.visualizerWidth||520),su(o.visualizerHeight||180));
  if(o&&o.type==='greenscreen'){const gs=getGreenscreenRenderSize(o);return centeredTransformBoxCss(o,gs.w,gs.h);}
  if(o&&o.type==='cloud')return centeredTransformBoxCss(o,su(o.cloudWidth||360),su(o.cloudHeight||220));
  const b=objectBBoxCss(o);
  return {...b,cx:b.x+b.w/2,cy:b.y+b.h/2,rotation:0};
}
function objectBBoxCss(o){
  const x=objCssX(o),y=objCssY(o),sc=stageScale();
  if(o.type==='light'||o.type==='lightbar')return lightEmitterBBoxCss(o);
  if(o.type==='screen'&&o.screenCornerPerspective)return screenCornerBBoxCss(o);
  if(o.type==='screen'||o.type==='text')return {x:x-su(o.screenWidth||(o.type==='text'?520:260))/2,y:y-su(o.screenHeight||(o.type==='text'?180:120))/2,w:su(o.screenWidth||(o.type==='text'?520:260)),h:su(o.screenHeight||(o.type==='text'?180:120))};
  if(o.type==='imageAsset'){const ps=imageAssetRenderSize(o);return {x:x-su(ps.w)/2,y:y-su(ps.h)/2,w:su(ps.w),h:su(ps.h)};}
  if(isWaterObject(o))return {x:x-su(o.waterWidth||420)/2,y:y-su(o.waterHeight||180)/2,w:su(o.waterWidth||420),h:su(o.waterHeight||180)};
  if(o.type==='mandalaVisualizer')return {x:x-su(o.mandalaObjWidth||420)/2,y:y-su(o.mandalaObjHeight||420)/2,w:su(o.mandalaObjWidth||420),h:su(o.mandalaObjHeight||420)};
  if(o.type==='audioSource'){const r=Math.max(14*sc,su(o.size||58)*.55);return {x:x-r,y:y-r,w:r*2,h:r*2};}
  if(o.type==='cloud')return {x:x-su(o.cloudWidth||360)/2,y:y-su(o.cloudHeight||220)/2,w:su(o.cloudWidth||360),h:su(o.cloudHeight||220)};
  if(o.type==='visualizer')return {x:x-su(o.visualizerWidth||520)/2,y:y-su(o.visualizerHeight||180)/2,w:su(o.visualizerWidth||520),h:su(o.visualizerHeight||180)};
  if(o.type==='imageParticle'){const ps=imageParticleRenderSizeCss(o);return rotatedBoxBBoxCss(x,y,ps.w,ps.h,Number(o.rotation||0));}
  if(o.type==='particle' && (o.particleMode||'free')==='pathFlow')return particlePathBBoxCss(o);
  if(o.type==='particle' && (o.particleEmitterShape||'point')==='line'){
    const th=Math.max(3*stageScale(),su(o.size||72)*0.08),len=su(o.particleEmitterLength??120);
    return rotatedBoxBBoxCss(x,y,th,len,Number(o.rotation||0));
  }
  const r=Math.max(14*sc,su(o.size||40)*.5);return {x:x-r,y:y-r,w:r*2,h:r*2};
}
function rectsIntersect(a,b){return !(a.x+a.w<b.x||b.x+b.w<a.x||a.y+a.h<b.y||b.y+b.h<a.y);}
function selectRect(cssRect,additive=false){
  if(!additive){selectedIds.clear();selected=null;}
  const found=[];for(const o of objects){if(isCanvasLockedImageAsset(o))continue;if(rectsIntersect(cssRect,objectBBoxCss(o))){selectedIds.add(o.id);found.push(o);}}
  selected=found[found.length-1]||getSelectedObjects()[0]||null;
  if(selected)selectSingleCore(selected);else selectSingleCore(null);
  if(groupNameInput&&selected)groupNameInput.value=selected.groupName||'';
  updateHud();updateObjectManager();
}
function groupTransformArea(o){
  if(!o)return 1;
  const stageW=Math.max(1,Number((typeof stageState!=='undefined'&&stageState.w)||scene.stageWidth||1920));
  const stageH=Math.max(1,Number((typeof stageState!=='undefined'&&stageState.h)||scene.stageHeight||1080));
  let w=Number(o.size||44),h=Number(o.size||44);
  if(o.type==='screen'||o.type==='text'){w=Number(o.screenWidth||(o.type==='text'?520:260));h=Number(o.screenHeight||(o.type==='text'?180:120));}
  else if(o.type==='imageAsset'){
    if(typeof imageAssetRenderSize==='function'){const ps=imageAssetRenderSize(o);w=Number(ps.w||o.imageAssetWidth||240);h=Number(ps.h||o.imageAssetHeight||160);}
    else{w=Number(o.imageAssetWidth||240);h=Number(o.imageAssetHeight||160);}
  }else if(o.type==='greenscreen'){
    if(typeof getGreenscreenRenderSize==='function'){const gs=getGreenscreenRenderSize(o);const sc=Math.max(0.0001,typeof stageScale==='function'?stageScale():1);w=Number(gs.w||0)/sc||Number(o.greenscreenWidth||480);h=Number(gs.h||0)/sc||Number(o.greenscreenHeight||270);}
    else{w=Number(o.greenscreenWidth||480);h=Number(o.greenscreenHeight||270);}
  }else if(isWaterObject(o)){w=Number(o.waterWidth||420);h=Number(o.waterHeight||180);}
  else if(o.type==='mandalaVisualizer'){w=Number(o.mandalaObjWidth||420);h=Number(o.mandalaObjHeight||420);}
  else if(o.type==='visualizer'){w=Number(o.visualizerWidth||520);h=Number(o.visualizerHeight||180);}
  else if(o.type==='cloud'){w=Number(o.cloudWidth||360);h=Number(o.cloudHeight||220);}
  else if(o.type==='lightbar'){w=Number(o.lightbarLength||320);h=Math.max(12,Number(o.size||56)*0.18);}
  else if(o.type==='particle'&&(o.particleEmitterShape||'point')==='line'){w=Math.max(12,Number(o.size||72)*0.12);h=Number(o.particleEmitterLength||120);}
  else if(o.type==='light'&&(o.lightEmitterShape||'point')==='line'){w=Math.max(12,Number(o.size||44)*0.24);h=Number(o.lightEmitterLength||240);}
  const pw=Math.max(0.001,w/stageW*100),ph=Math.max(0.001,h/stageH*100);
  return pw*ph;
}
function groupCenter(arr=getSelectedObjects()){let sx=0,sy=0,sa=0;if(!arr.length)return {x:50,y:50};for(const o of arr){const a=groupTransformArea(o);sx+=Number(o.x||0)*a;sy+=Number(o.y||0)*a;sa+=a;}if(sa>0)return {x:sx/sa,y:sy/sa};for(const o of arr){sx+=Number(o.x||0);sy+=Number(o.y||0);}return {x:sx/arr.length,y:sy/arr.length};}
function createGroup(){const arr=getSelectedObjects();if(arr.length<2){alert('Bitte mindestens zwei Objekte auswählen.');return;}const gid='grp_'+Date.now().toString(36)+'_'+Math.floor(Math.random()*9999).toString(36);const name=(groupNameInput&&groupNameInput.value.trim())||'Gruppe '+(groups.length+1);groups.push({id:gid,name});arr.forEach(o=>{o.groupId=gid;o.groupName=name;});selected=arr[0];selectSingleCore(selected);updateHud();updateObjectManager();}
function selectGroup(){const gid=selected&&selected.groupId;if(!gid)return;selectedIds.clear();objects.filter(o=>o.groupId===gid).forEach(o=>selectedIds.add(o.id));selected=objects.find(o=>o.groupId===gid)||selected;selectSingleCore(selected);updateHud();updateObjectManager();}
function dissolveGroup(){const arr=getSelectedObjects();const gids=new Set(arr.map(o=>o.groupId).filter(Boolean));if(selected&&selected.groupId)gids.add(selected.groupId);objects.forEach(o=>{if(gids.has(o.groupId)){delete o.groupId;delete o.groupName;}});groups=groups.filter(g=>!gids.has(g.id));if(selected)selectSingleCore(selected);updateHud();updateObjectManager();}
function transformSelection(scale=1,rotDeg=0){let arr=getSelectedObjects();if(arr.length<2&&selected&&selected.groupId)arr=objects.filter(o=>o.groupId===selected.groupId);if(!arr.length)return;const c=groupCenter(arr),a=rotDeg*Math.PI/180;for(const o of arr){const dx=Number(o.x||0)-c.x,dy=Number(o.y||0)-c.y;const nx=(dx*scale)*Math.cos(a)-(dy*scale)*Math.sin(a);const ny=(dx*scale)*Math.sin(a)+(dy*scale)*Math.cos(a);o.x=c.x+nx;o.y=c.y+ny;o.size=Math.max(1,Number(o.size||40)*scale);if(o.type==='screen'){o.screenWidth=Math.max(1,Number(o.screenWidth||260)*scale);o.screenHeight=Math.max(1,Number(o.screenHeight||120)*scale);}if(o.type==='text'){o.screenWidth=Math.max(1,Number(o.screenWidth||520)*scale);o.screenHeight=Math.max(1,Number(o.screenHeight||180)*scale);}
    if(o.type==='imageAsset'){o.imageAssetWidth=Math.max(1,Number(o.imageAssetWidth||240)*scale);o.imageAssetHeight=Math.max(1,Number(o.imageAssetHeight||160)*scale);}if(isWaterObject(o)){o.waterWidth=Math.max(1,Number(o.waterWidth||420)*scale);o.waterHeight=Math.max(1,Number(o.waterHeight||180)*scale);}if(o.type==='mandalaVisualizer'){o.mandalaObjWidth=Math.max(1,Number(o.mandalaObjWidth||420)*scale);o.mandalaObjHeight=Math.max(1,Number(o.mandalaObjHeight||420)*scale);}if(o.type==='visualizer'){o.visualizerWidth=Math.max(1,Number(o.visualizerWidth||520)*scale);o.visualizerHeight=Math.max(1,Number(o.visualizerHeight||180)*scale);}if(o.type==='greenscreen'){o.greenscreenWidth=Math.max(1,Number(o.greenscreenWidth||480)*scale);o.greenscreenHeight=Math.max(1,Number(o.greenscreenHeight||270)*scale);}if(o.type==='cloud'){o.cloudWidth=Math.max(40,Number(o.cloudWidth||360)*scale);o.cloudHeight=Math.max(30,Number(o.cloudHeight||220)*scale);}if(o.type==='particle'){o.particleEmitterLength=Math.max(1,Number(o.particleEmitterLength||120)*scale);o.particlePathWidth=Math.max(1,Number(o.particlePathWidth||360)*scale);o.particlePathHeight=Math.max(1,Number(o.particlePathHeight||180)*scale);if(Array.isArray(o.particlePathPoints))o.particlePathPoints=o.particlePathPoints.map(p=>({x:(Number(p.x)||0)*scale,y:(Number(p.y)||0)*scale}));}o.rotation=((Number(o.rotation||0)+rotDeg)%360+360)%360;}if(selected)selectSingleCore(selected);updateHud();updateObjectManager();}
function objectTypeLabel(t){
  return ({light:'Lichtemitter',lightbar:'Lightbars',fog:'Nebelemitter',cloud:'Wolken',screen:'Screens',text:'Texte',waterSurface:'WaterSurface',waterFlowOverlay:'WaterFlowOverlay',mandalaVisualizer:'MandalaVisualizer',particle:'Partikeleffekte',visualizer:'Visualizer',imageParticle:'Image-to-Particle',greenscreen:'Greenscreen',imageAsset:'ImageAssets',audioSource:'AudioSources',inputManager:'Input Manager'})[t]||t||'Objekt';
}
function objectShortName(o){return (o&&o.name)||objectTypeLabel(o&&o.type)||'Objekt';}
const objectManagerTypeIcons=new Map();
function objectTypeIconMarkup(type){
  if(!objectManagerTypeIcons.has(type)){
    const tool=Array.from(document.querySelectorAll('#objectPalette .tool[data-type]')).find(el=>el.dataset.type===type);
    const icon=tool&&tool.querySelector('.ico');
    objectManagerTypeIcons.set(type,icon?icon.innerHTML:'');
  }
  const svg=objectManagerTypeIcons.get(type);
  return svg?`<span class="omTypeIcon" aria-hidden="true">${svg}</span>`:'';
}
function selectObjectFromManager(oid){
  selectedIds.clear();
  selected=objects.find(o=>o.id===oid)||null;
  if(selected)selectedIds.add(selected.id);
  selectSingleCore(selected);updateHud();updateObjectManager();
}
function selectGroupFromManager(gid){
  selectedIds.clear();
  const arr=objects.filter(o=>o.groupId===gid);
  arr.forEach(o=>selectedIds.add(o.id));
  selected=arr[0]||null;
  selectSingleCore(selected);updateHud();updateObjectManager();
}
function updateObjectManager(){
  if(!objectManager)return;
  if(!objects.length){objectManager.innerHTML='<div class="omEmpty">Noch keine Objekte.</div>';return;}
  const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const typeOrder=['light','lightbar','movinghead','fog','cloud','screen','text','waterSurface','waterFlowOverlay','mandalaVisualizer','imageAsset','audioSource','inputManager','greenscreen','particle','visualizer','imageParticle'];
  const selectedGroupId=selected&&selected.groupId?selected.groupId:null;
  const knownGroupIds=[...new Set(objects.map(o=>o.groupId).filter(Boolean))];
  let html='';

  if(knownGroupIds.length){
    html+='<div class="omSection">Gruppen</div>';
    for(const gid of knownGroupIds){
      const arr=objects.filter(o=>o.groupId===gid);
      const g=groups.find(x=>x.id===gid);
      const name=(g&&g.name)||arr[0]?.groupName||gid;
      const isSel=gid===selectedGroupId;
      html+=`<div class="omRow isGroup ${isSel?'isSelected':''}"><div><b>${esc(name)}</b><div class="omMeta">Gruppe · ${arr.length} Objekt${arr.length!==1?'e':''}</div></div><button type="button" data-gid="${esc(gid)}">Auswählen</button></div>`;
      if(isSel){
        html+='<div class="omChildren"><div class="omSubSection">Objekte in dieser Gruppe</div>';
        for(const t of typeOrder){
          const items=arr.filter(o=>o.type===t);
          if(!items.length)continue;
          html+=`<div class="omSubSection">${esc(objectTypeLabel(t))}</div>`;
          for(const o of items){
            html+=`<div class="omRow ${selectedIds.has(o.id)?'isSelected':''}"><div><b>${objectTypeIconMarkup(o.type)}${esc(objectShortName(o))}</b><div class="omMeta">Layer ${Number(o.layer??1)} · ${esc(o.id)}</div></div><button type="button" data-oid="${esc(o.id)}">Auswählen</button></div>`;
          }
        }
        html+='</div>';
      }
    }
  }

  html+='<div class="omSection">Objekte nach Typ</div>';
  let anyType=false;
  for(const t of typeOrder){
    const arr=objects.filter(o=>o.type===t);
    if(!arr.length)continue;
    anyType=true;
    html+=`<div class="omSubSection">${esc(objectTypeLabel(t))} · ${arr.length}</div>`;
    for(const o of arr){
      const gtxt=o.groupId?` · Gruppe: ${o.groupName||o.groupId}`:'';
      html+=`<div class="omRow ${selectedIds.has(o.id)?'isSelected':''}"><div><b>${objectTypeIconMarkup(o.type)}${esc(objectShortName(o))}</b><div class="omMeta">Layer ${Number(o.layer??1)}${esc(gtxt)}</div></div><button type="button" data-oid="${esc(o.id)}">Auswählen</button></div>`;
    }
  }
  if(!anyType)html+='<div class="omEmpty">Keine verwaltbaren Objekte gefunden.</div>';
  objectManager.innerHTML=html;
  objectManager.querySelectorAll('.omRow').forEach(row=>{const btn=row.querySelector('button[data-oid]');if(btn){row.draggable=true;row.title='In die Objektspur der Timeline ziehen';row.addEventListener('dragstart',ev=>{ev.dataTransfer.effectAllowed='copy';ev.dataTransfer.setData('object-id',btn.dataset.oid);ev.dataTransfer.setData('text/plain','object:'+btn.dataset.oid);});}});
  objectManager.querySelectorAll('button[data-oid]').forEach(b=>b.onclick=()=>selectObjectFromManager(b.dataset.oid));
  objectManager.querySelectorAll('button[data-gid]').forEach(b=>b.onclick=()=>selectGroupFromManager(b.dataset.gid));
}
if(groupNameInput)groupNameInput.addEventListener('change',()=>{const gid=selected&&selected.groupId;if(!gid)return;const name=groupNameInput.value.trim()||'Gruppe';const g=groups.find(x=>x.id===gid);if(g)g.name=name;objects.forEach(o=>{if(o.groupId===gid){o.groupName=name;}});updateObjectManager();updateHud();});
if(createGroupBtn)createGroupBtn.onclick=createGroup;if(dissolveGroupBtn)dissolveGroupBtn.onclick=dissolveGroup;if(selectGroupBtn)selectGroupBtn.onclick=selectGroup;if(clearSelectionBtn)clearSelectionBtn.onclick=()=>select(null);if(groupScaleDownBtn)groupScaleDownBtn.onclick=()=>transformSelection(.9,0);if(groupScaleUpBtn)groupScaleUpBtn.onclick=()=>transformSelection(1.1,0);if(groupRotLeftBtn)groupRotLeftBtn.onclick=()=>transformSelection(1,-15);if(groupRotRightBtn)groupRotRightBtn.onclick=()=>transformSelection(1,15);if(exportObjectBtn)exportObjectBtn.onclick=exportObjectFile;if(importObjectBtn)importObjectBtn.onclick=()=>importObjectFile.click();
const importObjectGlobalBtn=document.getElementById('importObjectGlobalBtn');
if(importObjectGlobalBtn)importObjectGlobalBtn.onclick=()=>importObjectFile.click();
if(importObjectFile)importObjectFile.onchange=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{importObjectData(JSON.parse(r.result));}catch(err){alert('Object-Import fehlgeschlagen: '+err.message);}};r.readAsText(f);e.target.value='';};
function isWaterPaletteType(type){return type==='waterSurface'||type==='waterFlowOverlay';}
function beginWaterDrawFromPalette(type){
  if(!isWaterPaletteType(type))return;
  const draft=newObj(type,50,50);
  draft.id='water_draft';
  draft.name=type==='waterFlowOverlay'?'WaterFlow zeichnen':'WaterSurface zeichnen';
  draft.waterShape=(waterShapeInput&&waterShapeInput.value)||'rect';
  ensureWaterDefaults(draft);
  ensureMandalaDefaults(draft);
  waterDrawMode={type,draft};
  waterDrawDrag=null;
  selected=draft;
  selectedIds.clear();
  selectSingleCore(draft);
  updateHud();
  updateObjectManager();
  if(selectionBox)selectionBox.style.display='none';
}
function spawnPaletteObject(type,x=50,y=50,particleMode='free'){
  if(!type||isWaterPaletteType(type))return null;
  const o=newObj(type,x,y);
  applyTypeDefaults(o,type);
  if(o.type==='text')o.name='Text_'+id;
  if(o.type==='particle'){
    const mode=particleMode||'free';
    Object.assign(o,particlePresetDefaults(mode));
    o.particleMode=mode;o.name=mode+'_partikel_'+id;
  }
  if(o.type==='imageAsset')o.name='ImageAsset_'+id;
  if(o.type==='mandalaVisualizer')o.name='MandalaVisualizer_'+id;
  if(o.type==='audioSource')o.name='AudioSource_'+id;
  if(o.type==='inputManager')o.name='InputManager_'+id;
  objects.push(o);
  select(o);
  if(typeof updateTimelineObjectOptions==='function')updateTimelineObjectOptions();
  return o;
}
document.querySelectorAll('.tool').forEach(t=>{
  if(isWaterPaletteType(t.dataset.type)){t.draggable=false;t.setAttribute('title','Anklicken, Form rechts wählen, dann Wasserfläche auf der Arbeitsfläche zeichnen.');}
  t.addEventListener('dragstart',e=>{draggedType=t.dataset.type;draggedParticleMode=t.dataset.particleMode||'free';if(isWaterPaletteType(draggedType)){e.preventDefault();return;}e.dataTransfer.setData('text/plain',draggedType);e.dataTransfer.setData('particle-mode',draggedParticleMode);});
  t.addEventListener('pointerdown',e=>{const type=t.dataset.type;if(isWaterPaletteType(type)){e.preventDefault();e.stopPropagation();beginWaterDrawFromPalette(type);}});
  t.addEventListener('dblclick',e=>{
    const type=t.dataset.type;
    if(!t.draggable||!type||isWaterPaletteType(type))return;
    e.preventDefault();
    spawnPaletteObject(type,50,50,t.dataset.particleMode||'free');
  });
});
canvas.addEventListener('dragover',e=>e.preventDefault());canvas.addEventListener('drop',e=>{
  e.preventDefault();
  const r=canvas.getBoundingClientRect();
  const type=e.dataTransfer.getData('text/plain')||draggedType;
  const mode=e.dataTransfer.getData('particle-mode')||draggedParticleMode||'free';
  spawnPaletteObject(type,(e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100,mode);
});
function hit(mx,my){for(let i=objects.length-1;i>=0;i--){const o=objects[i];if(isCanvasLockedImageAsset(o))continue;const sx=objCssX(o),sy=objCssY(o);if(o.type==='particle'&&(o.particleMode||'free')==='pathFlow'&&hitParticlePathCss(o,mx,my))return o;if(o.type==='cloud'){const dx=mx-sx,dy=my-sy,a=-(Number(o.rotation||0))*Math.PI/180,qx=dx*Math.cos(a)-dy*Math.sin(a),qy=dx*Math.sin(a)+dy*Math.cos(a);if(Math.abs(qx)<=su(o.size||180)*1.125&&Math.abs(qy)<=su(o.size||180)*.625)return o;}if(o.type==='screen'){if(o.screenCornerPerspective&&hitScreenCornerCss(o,mx,my))return o;const dx=mx-sx,dy=my-sy;const a=-(Number(o.rotation||0))*Math.PI/180;const qx=dx*Math.cos(a)-dy*Math.sin(a), qy=dx*Math.sin(a)+dy*Math.cos(a);if(Math.abs(qx)<=su(o.screenWidth||260)/2+8*stageScale() && Math.abs(qy)<=su(o.screenHeight||120)/2+8*stageScale())return o;}if(o.type==='imageAsset'){const dx=mx-sx,dy=my-sy;const a=-(Number(o.rotation||0))*Math.PI/180;const qx=dx*Math.cos(a)-dy*Math.sin(a), qy=dx*Math.sin(a)+dy*Math.cos(a);const ps=imageAssetRenderSize(o);if(Math.abs(qx)<=su(ps.w)/2+8*stageScale() && Math.abs(qy)<=su(ps.h)/2+8*stageScale())return o;}if(isWaterObject(o)){const dx=mx-sx,dy=my-sy;const a=-(Number(o.rotation||0))*Math.PI/180;const qx=dx*Math.cos(a)-dy*Math.sin(a), qy=dx*Math.sin(a)+dy*Math.cos(a);if(Math.abs(qx)<=su(o.waterWidth||420)/2+8*stageScale() && Math.abs(qy)<=su(o.waterHeight||180)/2+8*stageScale())return o;}if(o.type==='mandalaVisualizer'){const dx=mx-sx,dy=my-sy;const a=-(Number(o.rotation||0))*Math.PI/180;const qx=dx*Math.cos(a)-dy*Math.sin(a), qy=dx*Math.sin(a)+dy*Math.cos(a);if(Math.abs(qx)<=su(o.mandalaObjWidth||420)/2+8*stageScale() && Math.abs(qy)<=su(o.mandalaObjHeight||420)/2+8*stageScale())return o;}if(o.type==='visualizer'){const dx=mx-sx,dy=my-sy;const a=-(Number(o.rotation||0))*Math.PI/180;const qx=dx*Math.cos(a)-dy*Math.sin(a), qy=dx*Math.sin(a)+dy*Math.cos(a);if(Math.abs(qx)<=su(o.visualizerWidth||520)/2+8*stageScale() && Math.abs(qy)<=su(o.visualizerHeight||180)/2+8*stageScale())return o;}if(o.type==='greenscreen'){const dx=mx-sx,dy=my-sy;const a=-(Number(o.rotation||0))*Math.PI/180;const qx=dx*Math.cos(a)-dy*Math.sin(a), qy=dx*Math.sin(a)+dy*Math.cos(a);const gs=getGreenscreenRenderSize(o);if(Math.abs(qx)<=gs.w/2+8*stageScale() && Math.abs(qy)<=gs.h/2+8*stageScale())return o;}if(Math.hypot(mx-sx,my-sy)<Math.max(16*stageScale(),su(o.size)*.32))return o;}return null;}
const hitWithoutTextObjects=hit;
hit=function(mx,my){
  for(let i=objects.length-1;i>=0;i--){
    const o=objects[i];if(!o||o.type!=='text')continue;
    const dx=mx-objCssX(o),dy=my-objCssY(o),a=-Number(o.rotation||0)*Math.PI/180;
    const qx=dx*Math.cos(a)-dy*Math.sin(a),qy=dx*Math.sin(a)+dy*Math.cos(a);
    if(Math.abs(qx)<=su(o.screenWidth||520)/2+8*stageScale()&&Math.abs(qy)<=su(o.screenHeight||180)/2+8*stageScale())return o;
  }
  return hitWithoutTextObjects(mx,my);
};
function objectHitTestLayerAware(o,mx,my){
  if(!o)return false;
  const sx=objCssX(o),sy=objCssY(o);
  if(o.type==='screen'&&o.screenCornerPerspective)return hitScreenCornerCss(o,mx,my);
  if(o.type==='particle'&&(o.particleMode||'free')==='pathFlow')return hitParticlePathCss(o,mx,my);
  if(o.type==='particle'&&(o.particleEmitterShape||'point')==='line'){
    const dx=mx-sx,dy=my-sy,a=-Number(o.rotation||0)*Math.PI/180;
    const qx=dx*Math.cos(a)-dy*Math.sin(a),qy=dx*Math.sin(a)+dy*Math.cos(a);
    return Math.abs(qx)<=Math.max(3*stageScale(),su(o.size||72)*0.08)/2+8*stageScale()&&Math.abs(qy)<=su(o.particleEmitterLength||120)/2+8*stageScale();
  }
  if(o.type==='cloud'){
    const dx=mx-sx,dy=my-sy,a=-Number(o.rotation||0)*Math.PI/180;
    const qx=dx*Math.cos(a)-dy*Math.sin(a),qy=dx*Math.sin(a)+dy*Math.cos(a);
    return Math.abs(qx)<=su(o.size||180)*1.125&&Math.abs(qy)<=su(o.size||180)*.625;
  }
  if(o.type==='screen'||o.type==='text'){
    const dx=mx-sx,dy=my-sy,a=-Number(o.rotation||0)*Math.PI/180;
    const qx=dx*Math.cos(a)-dy*Math.sin(a),qy=dx*Math.sin(a)+dy*Math.cos(a);
    return Math.abs(qx)<=su(o.screenWidth||(o.type==='text'?520:260))/2+8*stageScale()&&Math.abs(qy)<=su(o.screenHeight||(o.type==='text'?180:120))/2+8*stageScale();
  }
  if(o.type==='imageAsset'){
    const dx=mx-sx,dy=my-sy,a=-Number(o.rotation||0)*Math.PI/180;
    const qx=dx*Math.cos(a)-dy*Math.sin(a),qy=dx*Math.sin(a)+dy*Math.cos(a);
    const ps=imageAssetRenderSize(o);
    return Math.abs(qx)<=su(ps.w)/2+8*stageScale()&&Math.abs(qy)<=su(ps.h)/2+8*stageScale();
  }
  if(o.type==='imageParticle'){
    const dx=mx-sx,dy=my-sy,a=-Number(o.rotation||0)*Math.PI/180;
    const qx=dx*Math.cos(a)-dy*Math.sin(a),qy=dx*Math.sin(a)+dy*Math.cos(a);
    const ps=imageParticleRenderSizeCss(o);
    return Math.abs(qx)<=ps.w/2+8*stageScale()&&Math.abs(qy)<=ps.h/2+8*stageScale();
  }
  if(isWaterObject(o)){
    const dx=mx-sx,dy=my-sy,a=-Number(o.rotation||0)*Math.PI/180;
    const qx=dx*Math.cos(a)-dy*Math.sin(a),qy=dx*Math.sin(a)+dy*Math.cos(a);
    return Math.abs(qx)<=su(o.waterWidth||420)/2+8*stageScale()&&Math.abs(qy)<=su(o.waterHeight||180)/2+8*stageScale();
  }
  if(o.type==='mandalaVisualizer'){
    const dx=mx-sx,dy=my-sy,a=-Number(o.rotation||0)*Math.PI/180;
    const qx=dx*Math.cos(a)-dy*Math.sin(a),qy=dx*Math.sin(a)+dy*Math.cos(a);
    return Math.abs(qx)<=su(o.mandalaObjWidth||420)/2+8*stageScale()&&Math.abs(qy)<=su(o.mandalaObjHeight||420)/2+8*stageScale();
  }
  if(o.type==='visualizer'){
    const dx=mx-sx,dy=my-sy,a=-Number(o.rotation||0)*Math.PI/180;
    const qx=dx*Math.cos(a)-dy*Math.sin(a),qy=dx*Math.sin(a)+dy*Math.cos(a);
    return Math.abs(qx)<=su(o.visualizerWidth||520)/2+8*stageScale()&&Math.abs(qy)<=su(o.visualizerHeight||180)/2+8*stageScale();
  }
  if(o.type==='greenscreen'){
    const dx=mx-sx,dy=my-sy,a=-Number(o.rotation||0)*Math.PI/180;
    const qx=dx*Math.cos(a)-dy*Math.sin(a),qy=dx*Math.sin(a)+dy*Math.cos(a);
    const gs=getGreenscreenRenderSize(o);
    return Math.abs(qx)<=gs.w/2+8*stageScale()&&Math.abs(qy)<=gs.h/2+8*stageScale();
  }
  return Math.hypot(mx-sx,my-sy)<Math.max(16*stageScale(),su(o.size)*.32);
}
hit=function(mx,my){
  let best=null,bestLayer=-Infinity,bestIndex=-1;
  for(let i=objects.length-1;i>=0;i--){
    const o=objects[i];
    if(!objectHitTestLayerAware(o,mx,my))continue;
    const rawLayer=Number(o.layer??1);
    const layer=Number.isFinite(rawLayer)?rawLayer:1;
    if(!best||layer>bestLayer||(layer===bestLayer&&i>bestIndex)){
      best=o;bestLayer=layer;bestIndex=i;
    }
  }
  return best;
};
function setSelectionBoxFromCanvasRect(x,y,w,h){
  if(!selectionBox)return;
  const rect=typeof window.workspaceCanvasRectToViewportRect==='function'
    ? window.workspaceCanvasRectToViewportRect(x,y,w,h)
    : {x,y,w,h};
  selectionBox.style.left=rect.x+'px';
  selectionBox.style.top=rect.y+'px';
  selectionBox.style.width=rect.w+'px';
  selectionBox.style.height=rect.h+'px';
  selectionBox.style.transform='none';
  selectionBox.style.transformOrigin='50% 50%';
}
function setSelectionBoxFromTransformBox(box){
  if(!selectionBox)return;
  selectionBox.querySelectorAll('.selectionHandle').forEach(handle=>{
    handle.style.left='';
    handle.style.top='';
  });
  if(!box.rotation){
    setSelectionBoxFromCanvasRect(box.x,box.y,box.w,box.h);
    return;
  }
  const center=typeof window.workspaceCanvasRectToViewportRect==='function'
    ? window.workspaceCanvasRectToViewportRect(box.cx,box.cy,0,0)
    : {x:box.cx,y:box.cy,w:0,h:0};
  const size=typeof window.workspaceCanvasRectToViewportRect==='function'
    ? window.workspaceCanvasRectToViewportRect(0,0,box.w,box.h)
    : {x:0,y:0,w:box.w,h:box.h};
  selectionBox.style.left=(center.x-size.w/2)+'px';
  selectionBox.style.top=(center.y-size.h/2)+'px';
  selectionBox.style.width=size.w+'px';
  selectionBox.style.height=size.h+'px';
  selectionBox.style.transformOrigin='50% 50%';
  selectionBox.style.transform='rotate('+Number(box.rotation||0)+'deg)';
}
function setSelectionBoxFromScreenCorners(o){
  if(!selectionBox)return;
  const pts=screenCornerCanvasPoints(o),b=bboxFromPoints(pts);
  const rect=typeof window.workspaceCanvasRectToViewportRect==='function'
    ? window.workspaceCanvasRectToViewportRect(b.x,b.y,b.w,b.h)
    : b;
  selectionBox.style.left=rect.x+'px';
  selectionBox.style.top=rect.y+'px';
  selectionBox.style.width=Math.max(1,rect.w)+'px';
  selectionBox.style.height=Math.max(1,rect.h)+'px';
  selectionBox.style.transform='none';
  selectionBox.style.transformOrigin='0 0';
  const scaleX=rect.w/Math.max(1,b.w),scaleY=rect.h/Math.max(1,b.h);
  Object.entries(pts).forEach(([handle,p])=>{
    const el=selectionBox.querySelector('.selectionHandle-'+handle);
    if(!el)return;
    el.style.left=((p.x-b.x)*scaleX)+'px';
    el.style.top=((p.y-b.y)*scaleY)+'px';
  });
}
function ensureTransformHandles(){
  if(!selectionBox||selectionBox.dataset.transformHandles==='1')return;
  selectionBox.dataset.transformHandles='1';
  ['nw','n','ne','e','se','s','sw','w'].forEach(handle=>{
    const el=document.createElement('button');
    el.type='button';
    el.className='selectionHandle selectionHandle-'+handle;
    el.dataset.handle=handle;
    el.setAttribute('aria-label','Objekt skalieren '+handle);
    selectionBox.appendChild(el);
  });
}
function showTransformFrameForSelection(){
  if(!selectionBox)return;
  ensureTransformHandles();
  const arr=getSelectedObjects();
  const blockingDrag=drag&&drag.type!=='transformResize'&&!(drag.type==='move'&&!drag.moved);
  if(arr.length!==1||!selected||!arr.includes(selected)||waterDrawMode||bgCaptureMode||selectionDrag||blockingDrag){
    selectionBox.classList.remove('isTransformFrame','isLinearTransformFrame','isScreenCornerTransformFrame');
    if(!selectionDrag&&!waterDrawDrag&&!bgCaptureDrag)selectionBox.style.display='none';
    return;
  }
  const cornerFrame=isScreenCornerTransformObject(selected);
  const linearFrame=!cornerFrame&&isLinearEmitterTransformObject(selected);
  const b=objectTransformBoxCss(selected);
  selectionBox.style.display='block';
  selectionBox.style.borderRadius='6px';
  selectionBox.classList.add('isTransformFrame');
  selectionBox.classList.toggle('isLinearTransformFrame',linearFrame);
  selectionBox.classList.toggle('isScreenCornerTransformFrame',cornerFrame);
  if(cornerFrame)setSelectionBoxFromScreenCorners(selected);
  else setSelectionBoxFromTransformBox(b);
}
function objectSizeSnapshot(o){
  return {
    x:Number(o.x||0),y:Number(o.y||0),size:Number(o.size||40),
    screenWidth:Number(o.screenWidth||260),screenHeight:Number(o.screenHeight||120),
    imageAssetWidth:Number(o.imageAssetWidth||240),imageAssetHeight:Number(o.imageAssetHeight||160),
    waterWidth:Number(o.waterWidth||420),waterHeight:Number(o.waterHeight||180),
    mandalaObjWidth:Number(o.mandalaObjWidth||420),mandalaObjHeight:Number(o.mandalaObjHeight||420),
    visualizerWidth:Number(o.visualizerWidth||520),visualizerHeight:Number(o.visualizerHeight||180),
    greenscreenWidth:Number(o.greenscreenWidth||480),greenscreenHeight:Number(o.greenscreenHeight||270),
    cloudWidth:Number(o.cloudWidth||360),cloudHeight:Number(o.cloudHeight||220),
    lightEmitterLength:Number(o.lightEmitterLength||240),lightEmitterWidth:Number(o.lightEmitterWidth||480),lightEmitterHeight:Number(o.lightEmitterHeight||270),
    lightbarLength:Number(o.lightbarLength||320),
    particleEmitterLength:Number(o.particleEmitterLength||120),particlePathWidth:Number(o.particlePathWidth||360),particlePathHeight:Number(o.particlePathHeight||180),
    particlePathPoints:Array.isArray(o.particlePathPoints)?o.particlePathPoints.map(p=>({x:Number(p.x)||0,y:Number(p.y)||0})):null,
    ipmScale:Number(o.ipmScale||1)
  };
}
function setObjectPercentPositionFromCanvasCenter(o,cx,cy){
  const r=canvas.getBoundingClientRect();
  o.x=Math.max(-999,Math.min(999,cx/Math.max(1,r.width)*100));
  o.y=Math.max(-999,Math.min(999,cy/Math.max(1,r.height)*100));
}
function applyObjectScaleFromSnapshot(o,snap,scaleX,scaleY,newBox){
  scaleX=Math.max(.05,Number(scaleX)||1);
  scaleY=Math.max(.05,Number(scaleY)||1);
  const uniform=Math.max(.05,(scaleX+scaleY)/2);
  const cx=Number.isFinite(newBox&&newBox.cx)?newBox.cx:newBox.x+newBox.w/2;
  const cy=Number.isFinite(newBox&&newBox.cy)?newBox.cy:newBox.y+newBox.h/2;
  setObjectPercentPositionFromCanvasCenter(o,cx,cy);
  if(o.type==='screen'||o.type==='text'){o.screenWidth=Math.max(1,snap.screenWidth*scaleX);o.screenHeight=Math.max(1,snap.screenHeight*scaleY);}
  else if(o.type==='imageAsset'){o.imageAssetWidth=Math.max(1,snap.imageAssetWidth*scaleX);o.imageAssetHeight=Math.max(1,snap.imageAssetHeight*scaleY);}
  else if(isWaterObject(o)){o.waterWidth=Math.max(1,snap.waterWidth*scaleX);o.waterHeight=Math.max(1,snap.waterHeight*scaleY);}
  else if(o.type==='mandalaVisualizer'){o.mandalaObjWidth=Math.max(1,snap.mandalaObjWidth*scaleX);o.mandalaObjHeight=Math.max(1,snap.mandalaObjHeight*scaleY);}
  else if(o.type==='visualizer'){o.visualizerWidth=Math.max(1,snap.visualizerWidth*scaleX);o.visualizerHeight=Math.max(1,snap.visualizerHeight*scaleY);}
  else if(o.type==='greenscreen'){o.greenscreenWidth=Math.max(1,snap.greenscreenWidth*scaleX);o.greenscreenHeight=Math.max(1,snap.greenscreenHeight*scaleY);}
  else if(o.type==='cloud'){o.cloudWidth=Math.max(40,snap.cloudWidth*scaleX);o.cloudHeight=Math.max(30,snap.cloudHeight*scaleY);o.size=Math.max(1,snap.size*uniform);}
  else if(o.type==='light'){
    const shape=o.lightEmitterShape||'point';
    if(shape==='line'){
      o.lightEmitterLength=Math.max(20,snap.lightEmitterLength*scaleY);
    }else if(shape==='rectangle'){
      o.lightEmitterWidth=Math.max(20,snap.lightEmitterWidth*scaleX);
      o.lightEmitterHeight=Math.max(20,snap.lightEmitterHeight*scaleY);
    }else{
      o.size=Math.max(1,snap.size*uniform);
    }
  }
  else if(o.type==='lightbar'){
    o.lightbarLength=Math.max(40,snap.lightbarLength*scaleY);
  }
  else if(o.type==='particle'&&(o.particleMode||'free')==='pathFlow'){
    o.particlePathWidth=Math.max(1,snap.particlePathWidth*scaleX);
    o.particlePathHeight=Math.max(1,snap.particlePathHeight*scaleY);
    if(snap.particlePathPoints)o.particlePathPoints=snap.particlePathPoints.map(p=>({x:p.x*scaleX,y:p.y*scaleY}));
    o.size=Math.max(1,snap.size*uniform);
  }else if(o.type==='particle'){
    if((o.particleEmitterShape||'point')!=='line')o.size=Math.max(1,snap.size*uniform);
    o.particleEmitterLength=Math.max(1,snap.particleEmitterLength*scaleY);
  }else if(o.type==='imageParticle'){
    o.ipmScale=Math.max(.05,snap.ipmScale*uniform);
  }else{
    o.size=Math.max(1,snap.size*uniform);
  }
}
function boxFromTransformHandle(startBox,handle,mx,my){
  const minSize=8;
  if(['nw','ne','se','sw'].includes(handle)){
    const aspect=Math.max(.001,startBox.w/Math.max(1,startBox.h));
    let anchorX=startBox.x,anchorY=startBox.y;
    if(handle==='nw'){anchorX=startBox.x+startBox.w;anchorY=startBox.y+startBox.h;}
    else if(handle==='ne'){anchorX=startBox.x;anchorY=startBox.y+startBox.h;}
    else if(handle==='se'){anchorX=startBox.x;anchorY=startBox.y;}
    else if(handle==='sw'){anchorX=startBox.x+startBox.w;anchorY=startBox.y;}
    const rawW=Math.max(minSize,Math.abs(mx-anchorX));
    const rawH=Math.max(minSize,Math.abs(my-anchorY));
    let w=rawW,h=rawW/aspect;
    if(h<rawH){h=rawH;w=h*aspect;}
    const x=handle.includes('w')?anchorX-w:anchorX;
    const y=handle.includes('n')?anchorY-h:anchorY;
    return {x,y,w,h};
  }
  let x=startBox.x,y=startBox.y,w=startBox.w,h=startBox.h;
  if(handle.includes('e'))w=Math.max(minSize,mx-startBox.x);
  if(handle.includes('s'))h=Math.max(minSize,my-startBox.y);
  if(handle.includes('w')){const right=startBox.x+startBox.w;x=Math.min(mx,right-minSize);w=right-x;}
  if(handle.includes('n')){const bottom=startBox.y+startBox.h;y=Math.min(my,bottom-minSize);h=bottom-y;}
  if(handle==='n'||handle==='s'){x=startBox.x;w=startBox.w;}
  if(handle==='e'||handle==='w'){y=startBox.y;h=startBox.h;}
  return {x,y,w,h};
}
function canvasPointToLocal(box,mx,my){
  const a=-Number(box.rotation||0)*Math.PI/180,dx=mx-box.cx,dy=my-box.cy;
  return {x:dx*Math.cos(a)-dy*Math.sin(a),y:dx*Math.sin(a)+dy*Math.cos(a)};
}
function localOffsetToCanvas(box,lx,ly){
  const a=Number(box.rotation||0)*Math.PI/180;
  return {x:box.cx+lx*Math.cos(a)-ly*Math.sin(a),y:box.cy+lx*Math.sin(a)+ly*Math.cos(a)};
}
function localBoxFromTransformHandle(startBox,handle,mx,my,options={}){
  const minSize=8,p=canvasPointToLocal(startBox,mx,my);
  const hw=startBox.w/2,hh=startBox.h/2;
  let left=-hw,right=hw,top=-hh,bottom=hh;
  if(options.lockX){
    if(handle.includes('s'))bottom=Math.max(top+minSize,p.y);
    else if(handle.includes('n'))top=Math.min(bottom-minSize,p.y);
    else return {...startBox};
    const h=Math.max(minSize,bottom-top),localCy=(top+bottom)/2;
    const center=localOffsetToCanvas(startBox,0,localCy);
    return {x:center.x-startBox.w/2,y:center.y-h/2,w:startBox.w,h,cx:center.x,cy:center.y,rotation:startBox.rotation};
  }
  if(['nw','ne','se','sw'].includes(handle)){
    const aspect=Math.max(.001,startBox.w/Math.max(1,startBox.h));
    let ax=0,ay=0;
    if(handle==='nw'){ax=hw;ay=hh;}
    else if(handle==='ne'){ax=-hw;ay=hh;}
    else if(handle==='se'){ax=-hw;ay=-hh;}
    else if(handle==='sw'){ax=hw;ay=-hh;}
    const rawW=Math.max(minSize,Math.abs(p.x-ax));
    const rawH=Math.max(minSize,Math.abs(p.y-ay));
    let w=rawW,h=rawW/aspect;
    if(h<rawH){h=rawH;w=h*aspect;}
    if(handle.includes('w')){left=ax-w;right=ax;}else{left=ax;right=ax+w;}
    if(handle.includes('n')){top=ay-h;bottom=ay;}else{top=ay;bottom=ay+h;}
  }else{
    if(handle.includes('e'))right=Math.max(left+minSize,p.x);
    if(handle.includes('w'))left=Math.min(right-minSize,p.x);
    if(handle.includes('s'))bottom=Math.max(top+minSize,p.y);
    if(handle.includes('n'))top=Math.min(bottom-minSize,p.y);
    if(handle==='n'||handle==='s'){left=-hw;right=hw;}
    if(handle==='e'||handle==='w'){top=-hh;bottom=hh;}
  }
  const w=Math.max(minSize,right-left),h=Math.max(minSize,bottom-top);
  const localCx=(left+right)/2,localCy=(top+bottom)/2;
  const center=localOffsetToCanvas(startBox,localCx,localCy);
  return {x:center.x-w/2,y:center.y-h/2,w,h,cx:center.x,cy:center.y,rotation:startBox.rotation};
}
function beginTransformResize(handle,mx,my,pointerId){
  if(!selected||!handle)return false;
  if(isScreenCornerTransformObject(selected)){
    if(!screenCornerHandles[handle])return false;
    drag={type:'screenCornerResize',handle,object:selected,pointerId};
    if(selectionBox)selectionBox.classList.add('isTransforming');
    return true;
  }
  const lockX=isLinearEmitterTransformObject(selected);
  if(lockX&&handle!=='n'&&handle!=='s')return false;
  const b=objectTransformBoxCss(selected);
  drag={type:'transformResize',handle,object:selected,startBox:{...b},snapshot:objectSizeSnapshot(selected),pointerId,oriented:!!(b&&b.rotation),lockX};
  if(selectionBox)selectionBox.classList.add('isTransforming');
  return true;
}
function installTransformHandleEvents(){
  if(!selectionBox||selectionBox.dataset.transformEvents==='1')return;
  selectionBox.dataset.transformEvents='1';
  selectionBox.addEventListener('pointerdown',event=>{
    const handle=event.target&&event.target.dataset&&event.target.dataset.handle;
    if(!handle||!selected)return;
    const r=canvas.getBoundingClientRect();
    const mx=event.clientX-r.left,my=event.clientY-r.top;
    if(!beginTransformResize(handle,mx,my,event.pointerId))return;
    try{selectionBox.setPointerCapture(event.pointerId);}catch(e){}
    event.preventDefault();event.stopPropagation();
  });
  selectionBox.addEventListener('pointermove',event=>{
    if(drag&&drag.type==='screenCornerResize'&&event.pointerId===drag.pointerId){
      const r=canvas.getBoundingClientRect();
      const mx=event.clientX-r.left,my=event.clientY-r.top;
      setScreenCornerOffsetFromCanvas(drag.object,drag.handle,mx,my);
      selectSingleCore(drag.object);
      updateHud();
      showTransformFrameForSelection();
      event.preventDefault();event.stopPropagation();
      return;
    }
    if(!drag||drag.type!=='transformResize'||event.pointerId!==drag.pointerId)return;
    const r=canvas.getBoundingClientRect();
    const mx=event.clientX-r.left,my=event.clientY-r.top;
    const nextBox=drag.oriented
      ? localBoxFromTransformHandle(drag.startBox,drag.handle,mx,my,{lockX:drag.lockX})
      : boxFromTransformHandle(drag.startBox,drag.handle,mx,my);
    const sx=nextBox.w/Math.max(1,drag.startBox.w);
    const sy=nextBox.h/Math.max(1,drag.startBox.h);
    applyObjectScaleFromSnapshot(drag.object,drag.snapshot,sx,sy,nextBox);
    selectSingleCore(drag.object);
    updateHud();
    showTransformFrameForSelection();
    event.preventDefault();event.stopPropagation();
  });
  const end=event=>{
    if(drag&&drag.type==='screenCornerResize'&&event.pointerId===drag.pointerId){
      const object=drag.object;
      drag=null;
      if(selectionBox)selectionBox.classList.remove('isTransforming');
      try{selectionBox.releasePointerCapture(event.pointerId);}catch(e){}
      if(object)selectSingleCore(object);
      updateHud();updateObjectManager();showTransformFrameForSelection();
      if(window.vseHistory)window.vseHistory.commit();
      event.preventDefault();event.stopPropagation();
      return;
    }
    if(!drag||drag.type!=='transformResize'||event.pointerId!==drag.pointerId)return;
    const object=drag.object;
    drag=null;
    if(selectionBox)selectionBox.classList.remove('isTransforming');
    try{selectionBox.releasePointerCapture(event.pointerId);}catch(e){}
    if(object)selectSingleCore(object);
    updateHud();updateObjectManager();showTransformFrameForSelection();
    if(window.vseHistory)window.vseHistory.commit();
    event.preventDefault();event.stopPropagation();
  };
  selectionBox.addEventListener('pointerup',end);
  selectionBox.addEventListener('pointercancel',end);
}
installTransformHandleEvents();
const baseSelectSingleCoreForTransform=selectSingleCore;
selectSingleCore=function(o){
  const result=baseSelectSingleCoreForTransform(o);
  requestAnimationFrame(showTransformFrameForSelection);
  return result;
};
const baseUpdateHudForTransform=updateHud;
updateHud=function(){
  const result=baseUpdateHudForTransform();
  showTransformFrameForSelection();
  return result;
};
function hidePathSelectionOverlay(){
  if(!pathSelectionOverlay)return;
  pathSelectionOverlay.style.display='none';
  pathSelectionOverlay.innerHTML='';
}
function updatePathSelectionOverlay(points,closed=false){
  if(!pathSelectionOverlay||!Array.isArray(points)||!points.length)return;
  pathSelectionOverlay.style.display='block';
  pathSelectionOverlay.style.left='0px';
  pathSelectionOverlay.style.top='0px';
  pathSelectionOverlay.style.width=canvas.clientWidth+'px';
  pathSelectionOverlay.style.height=canvas.clientHeight+'px';
  pathSelectionOverlay.setAttribute('viewBox','0 0 '+canvas.clientWidth+' '+canvas.clientHeight);
  const attr=points.map(p=>Number(p.x||0).toFixed(1)+','+Number(p.y||0).toFixed(1)).join(' ');
  const tag=closed?'polygon':'polyline';
  pathSelectionOverlay.innerHTML='<'+tag+' points="'+attr+'"></'+tag+'>';
}
function waterShapeToCaptureShape(shape){return shape==='oval'?'circle':shape==='freehand'?'path':'rect';}
function waterShapeSelectionRadius(shape){return shape==='oval'?'999px':shape==='freehand'?'12px':'6px';}
function createWaterObjectFromDraw(cut){
  if(!waterDrawMode||!cut||cut.w<4||cut.h<4)return;
  if(cut.shape==='path'&&(!cut.points||cut.points.length<3))return;
  const r={width:canvas.clientWidth,height:canvas.clientHeight};
  const draft=waterDrawMode.draft||newObj(waterDrawMode.type,50,50);
  const x=(cut.x+cut.w*0.5)/Math.max(1,r.width)*100;
  const y=(cut.y+cut.h*0.5)/Math.max(1,r.height)*100;
  const o=newObj(waterDrawMode.type,x,y);
  const keepId=o.id;
  Object.assign(o,draft);
  o.id=keepId;
  o.name=(waterDrawMode.type==='waterFlowOverlay'?'WaterFlow_':'WaterSurface_')+id;
  o.type=waterDrawMode.type;
  o.x=x;
  o.y=y;
  o.waterShape=draft.waterShape||'rect';
  o.waterWidth=Math.max(1,cut.w/Math.max(1,r.width)*Number(scene.stageWidth||stageState.w||1920));
  o.waterHeight=Math.max(1,cut.h/Math.max(1,r.height)*Number(scene.stageHeight||stageState.h||1080));
  if(cut.shape==='path'&&cut.points){
    o.waterMaskPoints=cut.points.map(p=>({x:(p.x-cut.x)/Math.max(1,cut.w),y:(p.y-cut.y)/Math.max(1,cut.h)}));
  }else{
    delete o.waterMaskPoints;
  }
  ensureWaterDefaults(o);
  ensureMandalaDefaults(o);
  objects.push(o);
  waterDrawMode=null;
  waterDrawDrag=null;
  select(o);
}
function isObjectReferencePointHit(o,mx,my){
  if(!o||!selectedIds.has(o.id))return false;
  const radius=Math.max(7*stageScale(),5);
  return Math.hypot(mx-objCssX(o),my-objCssY(o))<=radius;
}
function movableSelectionFor(o){
  let arr=getSelectedObjects();
  if(arr.length<2&&o&&o.groupId)arr=objects.filter(x=>x.groupId===o.groupId);
  return arr.filter(x=>!(x.type==='mandalaVisualizer'&&x.mandalaObjLocked)&&!(x.type==='cloud'&&x.cloudLocked)&&!isCanvasLockedImageAsset(x));
}
function beginMoveDrag(o,mx,my){
  const arr=movableSelectionFor(o);
  drag={type:'move',startMx:mx,startMy:my,moved:false,items:arr.map(x=>({o:x,x:Number(x.x||0),y:Number(x.y||0)}))};
}
function backgroundPanMetrics(){
  const cw=Math.max(1,canvas.clientWidth||canvas.width||1);
  const ch=Math.max(1,canvas.clientHeight||canvas.height||1);
  const iw=Math.max(1,Array.isArray(bgImageSize)?Number(bgImageSize[0])||0:0);
  const ih=Math.max(1,Array.isArray(bgImageSize)?Number(bgImageSize[1])||0:0);
  const zoom=Math.max(.001,Number(background&&background.zoom)||1);
  const mode=(background&&background.mode)||'cover';
  let drawW=cw,drawH=ch;
  if(mode==='stretch'){
    drawW=cw/zoom;drawH=ch/zoom;
  }else{
    const canvasRatio=cw/ch,imgRatio=iw/ih;
    const sc=(mode==='contain'?Math.min(canvasRatio/imgRatio,1):Math.max(canvasRatio/imgRatio,1))/zoom;
    drawW=(imgRatio*sc/canvasRatio)*cw;
    drawH=sc*ch;
  }
  return {maxX:Math.max(0,(drawW-cw)*.5),maxY:Math.max(0,(drawH-ch)*.5)};
}
function canDragBackgroundPan(){
  return !!(background&&background.imageData&&Array.isArray(bgImageSize)&&bgImageSize[0]&&bgImageSize[1]);
}
function beginBackgroundPanDrag(mx,my){
  drag={type:'backgroundPan',startMx:mx,startMy:my,startPanX:Number(background.panX)||0,startPanY:Number(background.panY)||0,moved:false,metrics:backgroundPanMetrics()};
}
canvas.addEventListener('pointerdown',e=>{
  const r=canvas.getBoundingClientRect();
  const mx=e.clientX-r.left,my=e.clientY-r.top;
  if(waterDrawMode){
    const shape=waterShapeToCaptureShape(waterDrawMode.draft&&waterDrawMode.draft.waterShape);
    waterDrawDrag={shape,startMx:mx,startMy:my,lastMx:mx,lastMy:my,points:shape==='path'?[{x:mx,y:my}]:[]};
    if(shape==='path'){if(selectionBox)selectionBox.style.display='none';updatePathSelectionOverlay(waterDrawDrag.points,false);}
    else if(selectionBox){hidePathSelectionOverlay();selectionBox.style.display='block';selectionBox.style.borderRadius=waterShapeSelectionRadius(waterDrawMode.draft&&waterDrawMode.draft.waterShape);setSelectionBoxFromCanvasRect(mx,my,0,0);}
    canvas.setPointerCapture(e.pointerId);return;
  }
  if(bgCaptureMode){
    const shape=getBgCaptureShape();
    bgCaptureDrag={shape,startMx:mx,startMy:my,lastMx:mx,lastMy:my,points:shape==='path'?[{x:mx,y:my}]:[]};
    if(shape==='path'){if(selectionBox)selectionBox.style.display='none';updatePathSelectionOverlay(bgCaptureDrag.points,false);}
    else if(selectionBox){hidePathSelectionOverlay();selectionBox.style.display='block';selectionBox.style.borderRadius=shape==='circle'?'999px':'6px';setSelectionBoxFromCanvasRect(mx,my,0,0);}
    canvas.setPointerCapture(e.pointerId);return;
  }
  const o=hit(mx,my);
  if(o){
    const clickedSelectedReference=!e.shiftKey&&isObjectReferencePointHit(o,mx,my);
    if(e.shiftKey)select(o,true);
    else if(!selectedIds.has(o.id))select(o,false);
    else selected=o;
    if(clickedSelectedReference){
      drag={type:'referenceDeselect',object:o,startMx:mx,startMy:my,moved:false};
    }else{
      beginMoveDrag(o,mx,my);
    }
    canvas.setPointerCapture(e.pointerId);
  }else{
    hidePathSelectionOverlay();
    selectionDrag={startMx:mx,startMy:my,lastMx:mx,lastMy:my,add:e.shiftKey};
    if(selectionBox){selectionBox.style.display='block';setSelectionBoxFromCanvasRect(mx,my,0,0);}
    canvas.setPointerCapture(e.pointerId);
  }
});
canvas.addEventListener('pointermove',e=>{
  const r=canvas.getBoundingClientRect();
  const mx=e.clientX-r.left,my=e.clientY-r.top;
  if(waterDrawDrag){
    waterDrawDrag.lastMx=mx;waterDrawDrag.lastMy=my;
    if(waterDrawDrag.shape==='path'){
      const pts=waterDrawDrag.points;const last=pts[pts.length-1];
      if(!last||Math.hypot(mx-last.x,my-last.y)>2)pts.push({x:mx,y:my});
      updatePathSelectionOverlay(pts,false);
    }else if(selectionBox){
      const pts=[{x:waterDrawDrag.startMx,y:waterDrawDrag.startMy},{x:mx,y:my}];
      const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
      const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
      setSelectionBoxFromCanvasRect(x,y,w,h);
    }
    return;
  }
  if(bgCaptureDrag){
    bgCaptureDrag.lastMx=mx;bgCaptureDrag.lastMy=my;
    if(bgCaptureDrag.shape==='path'){
      const pts=bgCaptureDrag.points;const last=pts[pts.length-1];
      if(!last||Math.hypot(mx-last.x,my-last.y)>2)pts.push({x:mx,y:my});
      updatePathSelectionOverlay(pts,false);
    }else if(selectionBox){
      const pts=[{x:bgCaptureDrag.startMx,y:bgCaptureDrag.startMy},{x:mx,y:my}];
      const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
      const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
      setSelectionBoxFromCanvasRect(x,y,w,h);
    }
    return;
  }
  if(drag&&drag.type==='referenceDeselect'){
    if(Math.hypot(mx-drag.startMx,my-drag.startMy)>3){
      const source=drag.object;
      beginMoveDrag(source,drag.startMx,drag.startMy);
    }else{
      return;
    }
  }
  if(drag&&drag.type==='move'){
    const beforeImageAssetFollow=captureGroupedImageAssetPositions();
    const dx=(mx-drag.startMx)/r.width*100,dy=(my-drag.startMy)/r.height*100;
    if(Math.hypot(mx-drag.startMx,my-drag.startMy)>2)drag.moved=true;
    for(const it of drag.items){it.o.x=it.x+dx;it.o.y=it.y+dy;}
    syncGroupedAudioSourcesWithImageAssets(beforeImageAssetFollow);
    if(selected)selectSingleCore(selected);
    updateHud();
    return;
  }
  if(drag&&drag.type==='backgroundPan'){
    const dx=mx-drag.startMx,dy=my-drag.startMy;
    if(Math.hypot(dx,dy)>2)drag.moved=true;
    if(drag.moved){
      const metrics=drag.metrics||backgroundPanMetrics();
      if(metrics.maxX>0)background.panX=Math.max(-1,Math.min(1,drag.startPanX-dx/metrics.maxX));
      if(metrics.maxY>0)background.panY=Math.max(-1,Math.min(1,drag.startPanY-dy/metrics.maxY));
      if(typeof syncBackgroundPanUi==='function')syncBackgroundPanUi();
    }
    return;
  }
  if(selectionDrag){
    selectionDrag.lastMx=mx;selectionDrag.lastMy=my;
    if(selectionBox){
      const x=Math.min(selectionDrag.startMx,mx),y=Math.min(selectionDrag.startMy,my),w=Math.abs(mx-selectionDrag.startMx),h=Math.abs(my-selectionDrag.startMy);
      setSelectionBoxFromCanvasRect(x,y,w,h);
    }
  }
});
canvas.addEventListener('pointerup',()=>{
  if(waterDrawDrag){
    const capture=waterDrawDrag;
    const pts=capture.shape==='path'?capture.points:[{x:capture.startMx,y:capture.startMy},{x:capture.lastMx,y:capture.lastMy}];
    const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
    const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
    if(selectionBox){selectionBox.style.display='none';selectionBox.style.borderRadius='6px';}
    hidePathSelectionOverlay();
    const cut={x,y,w,h,shape:capture.shape,points:capture.shape==='path'?capture.points.map(p=>({x:p.x,y:p.y})):null};
    waterDrawDrag=null;
    if(w>4&&h>4&&(cut.shape!=='path'||(cut.points&&cut.points.length>2)))createWaterObjectFromDraw(cut);
    return;
  }
  if(bgCaptureDrag){
    const capture=bgCaptureDrag;
    const pts=capture.shape==='path'?capture.points:[{x:capture.startMx,y:capture.startMy},{x:capture.lastMx,y:capture.lastMy}];
    const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
    const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
    if(selectionBox){selectionBox.style.display='none';selectionBox.style.borderRadius='6px';}
    hidePathSelectionOverlay();
    const cut={x,y,w,h,shape:capture.shape,points:capture.shape==='path'?capture.points.map(p=>({x:p.x,y:p.y})):null};
    bgCaptureDrag=null;bgCaptureMode=false;setBgCaptureButtonState(false);
    if(w>4&&h>4&&(cut.shape!=='path'||(cut.points&&cut.points.length>2)))createImageAssetFromBackgroundRect(cut).catch(err=>{console.error(err);alert('Ausschnitt konnte nicht erzeugt werden.');});
    return;
  }
  if(drag&&drag.type==='referenceDeselect'){
    select(null);
    drag=null;
    return;
  }
  if(drag&&drag.type==='backgroundPan'){
    const moved=!!drag.moved;
    drag=null;
    if(!moved)select(null);
    else if(window.vseHistory)window.vseHistory.commit();
    return;
  }
  if(selectionDrag){
    const x=Math.min(selectionDrag.startMx,selectionDrag.lastMx),y=Math.min(selectionDrag.startMy,selectionDrag.lastMy),w=Math.abs(selectionDrag.lastMx-selectionDrag.startMx),h=Math.abs(selectionDrag.lastMy-selectionDrag.startMy);
    if(selectionBox)selectionBox.style.display='none';
    hidePathSelectionOverlay();
    if(w>4&&h>4)selectRect({x,y,w,h},selectionDrag.add);
    else if(!selectionDrag.add)select(null);
    selectionDrag=null;
  }
  const finishedDrag=drag;
  drag=null;
  if(finishedDrag&&finishedDrag.type==='move')showTransformFrameForSelection();
});
function restoreBackgroundTextureIfNeeded(snapshot){
  // Objektlöschen darf niemals Layer 0 / Hintergrund anfassen.
  // Falls ein WebGL-Zustand oder eine alte Release-Funktion den Hintergrund aus dem Speicher zieht,
  // wird er aus den eingebetteten Hintergrunddaten sofort neu aufgebaut.
  if(!snapshot)return;
  Object.assign(background,snapshot.background);
  bgImageData=snapshot.bgImageData;
  bgImageSize=Array.isArray(snapshot.bgImageSize)?snapshot.bgImageSize:[0,0];
  if(background.imageData&&(!bgTex||!bgImageSize[0]||!bgImageSize[1])){
    const img=new Image();
    img.onload=()=>{makeBgTexture(img);};
    img.src=background.imageData;
  }
}
function selectedObjectsForDeletion(){
  const arr=getSelectedObjects();
  if(arr.length)return arr.slice();
  return selected?[selected]:[];
}
function deleteSelectedObject(ev){
  if(ev){ev.preventDefault();ev.stopPropagation();}
  const targets=selectedObjectsForDeletion().filter(o=>o&&o.id&&objects.some(x=>x.id===o.id));
  if(!targets.length)return;
  const bgSnapshot={background:{...background},bgImageData:bgImageData,bgImageSize:[...bgImageSize]};
  const delSet=new Set(targets.map(o=>o.id));

  // Runtime-Medien werden nur für die wirklich gelöschten Objekte freigegeben.
  // IPM/ImageParticle wird hier absichtlich NICHT über releaseParticleImage() geleitet,
  // weil genau dieser alte Sonderpfad den Hintergrund/WebGL-Zustand beschädigen konnte.
  for(const o of objects){
    if(!delSet.has(o.id))continue;
    // Solange Undo aktiv ist, bleiben lokale Blob-URLs und Medienelemente im
    // Speicher. Ein sofortiges revoke/delete würde den vorherigen Snapshot
    // irreversibel beschädigen.
    if(!window.vseHistory){
      if(o.type==='screen')releaseScreenMedia(o);
      else if(o.type==='imageAsset')releaseImageAsset(o);
      else if(o.type==='audioSource')releaseAudioSource(o);
      else if(o.type==='greenscreen')releaseGreenscreenMedia(o);
      else if(o.type==='particle')releaseParticleImage(o);
    }
  }

  objects=objects.filter(o=>!delSet.has(o.id));
  // Gruppen bleiben als Funktion erhalten, werden aber entfernt, wenn kein Objekt mehr dazugehört.
  groups=groups.filter(g=>objects.some(o=>o.groupId===g.id));
  selectedIds.clear();
  selected=null;
  selectSingleCore(null);
  restoreBackgroundTextureIfNeeded(bgSnapshot);
  syncLightUI();
  updateHud();
  updateObjectManager();
}
function duplicateSelectedObject(){
  const arr=getSelectedObjects();
  if(!arr.length&&!selected)return;
  const source=arr.length?arr:[selected];
  const runtimeKeys=new Set(['screenTexture','screenMediaElement','screenMediaUrl','screenCaptureStream','screenPlaylist','screenTextTexture','screenTextCanvas','screenTextBgImageElement','particleTexture','particleImageElement','particleImageUrl','imageAssetTexture','imageAssetElement','imageAssetUrl','audioSourceElement','audioSourceNode','audioSourceGain','audioSourceAnalyserTap','audioSourcePan','audioSourceMediaUrl','greenscreenTexture','greenscreenMediaElement','greenscreenMediaUrl','greenscreenStream','greenscreenTexture','greenscreenMediaElement','greenscreenMediaUrl','greenscreenStream']);
  selectedIds.clear();let newGroupId=null,newGroupName=null;
  if(source.length>1){newGroupId='grp_'+id++;newGroupName=((source[0].groupName||'Gruppe')+'_copy');groups.push({id:newGroupId,name:newGroupName});}
  for(const src of source){const o=Object.fromEntries(Object.entries(src).filter(([k,v])=>!k.startsWith('_')&&!runtimeKeys.has(k)&&typeof v!=='function'));o.id='obj_'+id++;o.name=(src.name||src.type)+'_copy';o.x=Number(src.x||0)+3;o.y=Number(src.y||0)+3;if(newGroupId){o.groupId=newGroupId;o.groupName=newGroupName;}else{delete o.groupId;delete o.groupName;}if(o.type==='screen'){o.screenMediaType='none';o.screenMediaName='';o.screenMediaAspect=1;o.screenMode=(o.screenMode==='video'||o.screenMode==='image')?'solid':o.screenMode;}if(o.type==='particle'||o.type==='imageParticle'){o.particleImageType='none';o.particleImageName='';o.particleImageAspect=1;}if(o.type==='imageAsset'&&o.imageAssetData){loadImageAssetFromData(o,o.imageAssetData,o.imageAssetName||'ImageAsset');}if(o.type==='audioSource'){o.audioSourceType='none';o.audioSourceName='';o.audioSourceElement=null;o.audioSourceNode=null;o.audioSourceGain=null;o.audioSourceAnalyserTap=null;o.audioSourcePan=null;o.audioSourceMediaUrl='';o.audioSourcePlaying=false;}if(o.type==='greenscreen'){o.greenscreenMediaType='none';o.greenscreenMediaName='';o.greenscreenMediaAspect=16/9;o.greenscreenTexture=null;o.greenscreenMediaElement=null;o.greenscreenMediaUrl='';o.greenscreenStream=null;}objects.push(o);selectedIds.add(o.id);selected=o;}
  selectSingleCore(selected);updateHud();updateObjectManager();
}
if(delBtn)delBtn.addEventListener('click',deleteSelectedObject);
dupBtn.onclick=duplicateSelectedObject;
clearBtn.onclick=()=>{objects.forEach(o=>{if(o.type==='screen')releaseScreenMedia(o);if(o.type==='imageAsset')releaseImageAsset(o);if(o.type==='audioSource')releaseAudioSource(o);if(o.type==='greenscreen')releaseGreenscreenMedia(o);if(o.type==='particle'||o.type==='imageParticle')releaseParticleImage(o);});if(window.vseScreenMediaFileRegistry instanceof Map)window.vseScreenMediaFileRegistry.clear();if(window.vseGreenscreenMediaFileRegistry instanceof Map)window.vseGreenscreenMediaFileRegistry.clear();objects=[];groups=[];select(null);syncLightUI();updateObjectManager();};
function cleanObjectsForExport(){
  const runtimeKeys=new Set(['screenTexture','screenMediaElement','screenMediaUrl','screenCaptureStream','screenPlaylist','screenTextTexture','screenTextCanvas','screenTextBgImageElement','particleTexture','particleImageElement','particleImageUrl','imageAssetTexture','imageAssetElement','imageAssetUrl','audioSourceElement','audioSourceNode','audioSourceGain','audioSourceAnalyserTap','audioSourcePan','audioSourceMediaUrl','greenscreenTexture','greenscreenMediaElement','greenscreenMediaUrl','greenscreenStream','greenscreenTexture','greenscreenMediaElement','greenscreenMediaUrl','greenscreenStream']);
  return objects.map(o=>Object.fromEntries(Object.entries(o).filter(([k,v])=>!k.startsWith('_')&&!runtimeKeys.has(k)&&typeof v!=='function')));
}
let recorder=null;
let recordingChunks=[];
let recordingStream=null;
let recordingStartedAt=0;
let recordingTimerId=null;
let recordingFramePumpId=null;
let recordingCaptureCanvas=null;
let recordingCaptureCtx=null;
let recordingFrameTick=0;
function setRecordingStatus(text){ if(recordStatus)recordStatus.textContent=text; }
function formatRecordTime(ms){
  const total=Math.max(0,Math.floor(ms/1000));
  const h=Math.floor(total/3600);
  const m=Math.floor((total%3600)/60);
  const sec=total%60;
  const pad=n=>String(n).padStart(2,'0');
  return h>0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}
function saveSceneScreenshot(){
  if(!canvas||typeof renderNormalFrame!=='function'||typeof updateVseFrame!=='function')return;
  const savedSelection=[...selectedIds];
  const savedGrid=scene.showGrid;
  try{
    selectedIds.clear();
    scene.showGrid=false;
    const ordered=updateVseFrame();
    renderNormalFrame(ordered);
    const shot=document.createElement('canvas');
    shot.width=canvas.width;shot.height=canvas.height;
    const ctx=shot.getContext('2d');
    ctx.drawImage(canvas,0,0);
    shot.toBlob(blob=>{
      if(!blob)return;
      const stamp=new Date().toISOString().replace(/[:.]/g,'-');
      const url=URL.createObjectURL(blob);
      const link=document.createElement('a');
      link.href=url;link.download='VSE_Scene_'+stamp+'.png';
      document.body.appendChild(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    },'image/png');
  }catch(error){
    console.error(error);
    alert('Screenshot konnte nicht gespeichert werden: '+error.message);
  }finally{
    scene.showGrid=savedGrid;
    selectedIds.clear();savedSelection.forEach(id=>selectedIds.add(id));
  }
}
function positionRecordingHud(){
  if(!recordHudOverlay||!canvas)return;
  const r=canvas.getBoundingClientRect();
  const margin=10;
  // Das Overlay sitzt in der rechten unteren Ecke der tatsächlichen Arbeitsfläche / Canvas,
  // nicht in der Ecke des Browserfensters. Es bleibt DOM-HUD und wird nicht aufgezeichnet.
  const ow=recordHudOverlay.offsetWidth||80;
  const oh=recordHudOverlay.offsetHeight||22;
  recordHudOverlay.style.left=Math.round(r.right-ow-margin)+'px';
  recordHudOverlay.style.top=Math.round(r.bottom-oh-margin)+'px';
}
function positionStageHudControls(){
  if(!sceneViewBtn||!canvas)return;
  const r=canvas.getBoundingClientRect();
  const margin=10;
  const size=sceneViewBtn.offsetWidth||16;
  sceneViewBtn.style.left=Math.round(r.right-size-margin)+'px';
  sceneViewBtn.style.top=Math.round(r.top+margin)+'px';
}
function updateRecordingHud(){
  const running=!!(recorder&&recorder.state==='recording');
  const visible=recordOverlayVisible?recordOverlayVisible.checked:true;
  if(recordHudOverlay){
    recordHudOverlay.classList.toggle('isHidden',!visible);
    recordHudOverlay.style.opacity=String(recordOverlayOpacity?recordOverlayOpacity.value:.82);
  }
  if(sceneViewBtn){
    sceneViewBtn.style.opacity=String(recordOverlayOpacity?recordOverlayOpacity.value:.82);
    sceneViewBtn.classList.toggle('isHidden',document.body.classList.contains('menuless'));
  }
  if(recordOverlayOpacityValue&&recordOverlayOpacity)recordOverlayOpacityValue.textContent=Number(recordOverlayOpacity.value).toFixed(2);
  positionRecordingHud();
  positionStageHudControls();
  if(recordHudStartBtn){
    recordHudStartBtn.classList.toggle('isRecording',running);
    recordHudStartBtn.style.display=running?'none':'block';
  }
  if(recordHudStopBtn)recordHudStopBtn.classList.toggle('isVisible',running);
  positionRecordingHud();
  if(recordHudTime){
    recordHudTime.classList.toggle('isVisible',running);
    recordHudTime.textContent=running?formatRecordTime(performance.now()-recordingStartedAt):'00:00';
  }
}
function startRecordingTimer(){
  stopRecordingTimer();
  recordingTimerId=setInterval(updateRecordingHud,250);
  updateRecordingHud();
}
function stopRecordingTimer(){
  if(recordingTimerId){clearInterval(recordingTimerId);recordingTimerId=null;}
  updateRecordingHud();
}
function stopRecordingFramePump(){
  if(recordingFramePumpId){cancelAnimationFrame(recordingFramePumpId);recordingFramePumpId=null;}
}
function releaseRecordingCaptureCanvas(){
  recordingCaptureCtx=null;
  recordingCaptureCanvas=null;
  recordingFrameTick=0;
}
function pumpRecordingFrame(){
  recordingFramePumpId=null;
  if(!(recorder&&recorder.state==='recording'))return;
  try{
    window.vseRecordingCleanFrame=true;
    if(typeof updateVseFrame==='function'&&typeof renderNormalFrame==='function'){
      const cleanOrdered=updateVseFrame();
      renderNormalFrame(cleanOrdered);
    }
    if(recordingCaptureCanvas&&recordingCaptureCtx){
      if(recordingCaptureCanvas.width!==canvas.width)recordingCaptureCanvas.width=canvas.width;
      if(recordingCaptureCanvas.height!==canvas.height)recordingCaptureCanvas.height=canvas.height;
      recordingCaptureCtx.drawImage(canvas,0,0,recordingCaptureCanvas.width,recordingCaptureCanvas.height);
      recordingCaptureCtx.fillStyle=(recordingFrameTick++%2)?'rgb(0,0,1)':'rgb(0,0,0)';
      recordingCaptureCtx.fillRect(recordingCaptureCanvas.width-1,recordingCaptureCanvas.height-1,1,1);
    }
    const videoTrack=recordingStream&&recordingStream.getVideoTracks?recordingStream.getVideoTracks()[0]:null;
    if(videoTrack&&typeof videoTrack.requestFrame==='function')videoTrack.requestFrame();
  }catch(err){
    console.warn('Recording-Frame konnte nicht aktualisiert werden:',err);
  }
  recordingFramePumpId=requestAnimationFrame(pumpRecordingFrame);
}
function startRecordingFramePump(){
  stopRecordingFramePump();
  recordingFramePumpId=requestAnimationFrame(pumpRecordingFrame);
}
function preferredRecordingMime(){
  const types=[
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp8',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp9',
    'video/webm'
  ];
  if(typeof MediaRecorder==='undefined')return '';
  return types.find(t=>MediaRecorder.isTypeSupported(t))||'';
}
function hasActiveRecordingAudio(){
  try{
    if(audioState&&audioState.enabled&&audioState.source&&audioState.source!=='none')return true;
    if(audioPlayer&&audioPlayer.src&&!audioPlayer.paused)return true;
    if(timelineState&&Array.isArray(timelineState.audioClips)&&timelineState.audioClips.some(clip=>clip&&clip.active!==false&&clip._element&&!clip._element.paused))return true;
    return objects.some(o=>{
      if(!o)return false;
      if(o.type==='audioSource'&&o.audioSourceElement&&!o.audioSourceElement.paused)return true;
      if(o.type==='greenscreen'&&o.greenscreenAudioEnabled&&o.greenscreenMediaElement&&!o.greenscreenMediaElement.paused)return true;
      return false;
    });
  }catch(err){
    return false;
  }
}
function startRecording(){
  if(recorder&&recorder.state==='recording')return;
  if(!canvas.captureStream){alert('Canvas-Aufnahme wird von diesem Browser nicht unterstützt.');return;}
  if(typeof MediaRecorder==='undefined'){alert('MediaRecorder wird von diesem Browser nicht unterstützt.');return;}
  try{
    window.vseRecordingCleanFrame=true;
    const fps=Math.max(1,Math.min(120,parseInt(recordFps&&recordFps.value?recordFps.value:'60',10)||60));

    // Vor captureStream einmal ohne Editorhilfen rendern, damit bereits der
    // allererste aufgezeichnete Frame sauber ist.
    if(typeof updateVseFrame==='function'&&typeof renderNormalFrame==='function'){
      const cleanOrdered=updateVseFrame();renderNormalFrame(cleanOrdered);
    }

    // Ein separater 2D-Capture-Canvas vermeidet browserabhaengige WebGL-captureStream-Leerframes.
    recordingCaptureCanvas=document.createElement('canvas');
    recordingCaptureCanvas.width=canvas.width;
    recordingCaptureCanvas.height=canvas.height;
    recordingCaptureCtx=recordingCaptureCanvas.getContext('2d',{alpha:false});
    if(!recordingCaptureCtx)throw new Error('Recording-Capture-Canvas konnte nicht erstellt werden.');
    recordingCaptureCtx.drawImage(canvas,0,0,recordingCaptureCanvas.width,recordingCaptureCanvas.height);
    const canvasStream=recordingCaptureCanvas.captureStream(fps);
    const tracks=[...canvasStream.getVideoTracks()];
    let audioTrackCount=0;

    const shouldMixAudio=hasActiveRecordingAudio();
    if(shouldMixAudio&&typeof ensureAudio==='function'){
      const recordingCtx=ensureAudio();
      if(recordingCtx&&recordingCtx.state==='suspended') recordingCtx.resume().catch(()=>{});
    }
    if(shouldMixAudio&&recordingAudioDest&&recordingAudioDest.stream){
      const audioTracks=recordingAudioDest.stream.getAudioTracks();
      audioTrackCount=audioTracks.length;
      tracks.push(...audioTracks);
    }

    const stream=new MediaStream(tracks);recordingStream=stream;
    const mime=preferredRecordingMime();
    recordingChunks=[];
    recorder=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:12000000,audioBitsPerSecond:192000}:{videoBitsPerSecond:12000000,audioBitsPerSecond:192000});
    const recordingMime=recorder.mimeType||mime||'video/webm';
    recordingStartedAt=performance.now();
    recorder.ondataavailable=e=>{if(e.data&&e.data.size>0)recordingChunks.push(e.data);};
    recorder.onerror=e=>{stopRecordingFramePump();releaseRecordingCaptureCanvas();window.vseRecordingCleanFrame=false;setRecordingStatus('Recording-Fehler: '+(e.error&&e.error.message?e.error.message:'unbekannt'));if(recordingStream)recordingStream.getVideoTracks().forEach(track=>track.stop());recordingStream=null;};
    recorder.onstop=()=>{
      stopRecordingFramePump();
      try{canvasStream.getTracks().forEach(t=>t.stop());}catch(e){}
      releaseRecordingCaptureCanvas();
      window.vseRecordingCleanFrame=false;
      recordingStream=null;
      const blob=new Blob(recordingChunks,{type:recordingMime});
      recordingChunks=[];
      if(blob.size===0){
        if(recordStartBtn)recordStartBtn.disabled=false;if(recordStopBtn)recordStopBtn.disabled=true;
        setRecordingStatus('Aufnahme fehlgeschlagen: Der Browser hat keine gültigen Videodaten geliefert.');recorder=null;stopRecordingTimer();return;
      }
      const stamp=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;
      a.download='VSE_Recording_'+stamp+'.webm';
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Große Blob-Downloads dürfen nicht widerrufen werden, bevor der Browser
      // die Datei vollständig in seinen Downloadspeicher übernommen hat.
      setTimeout(()=>URL.revokeObjectURL(url),300000);
      if(recordStartBtn)recordStartBtn.disabled=false;
      if(recordStopBtn)recordStopBtn.disabled=true;
      setRecordingStatus('Aufnahme gespeichert: '+Math.round(blob.size/1024/1024*10)/10+' MB · WebM'+(audioTrackCount?' · mit Audio':' · ohne aktive Audioquelle'));
      recorder=null;
      stopRecordingTimer();
    };
    // Ein-Sekunden-Cluster funktionieren auch in Browsern, die beim Recording
    // ohne Timeslice keinen finalen Datenblock ausgeben.
    recorder.start(1000);
    if(recordStartBtn)recordStartBtn.disabled=true;
    if(recordStopBtn)recordStopBtn.disabled=false;
    startRecordingTimer();
    startRecordingFramePump();
    setRecordingStatus('Recording läuft · '+fps+' FPS · WebGL-Canvas '+(audioTrackCount?'+ Audio':'ohne aktive Audioquelle')+' → WebM');
  }catch(err){
    stopRecordingFramePump();
    releaseRecordingCaptureCanvas();
    window.vseRecordingCleanFrame=false;
    if(recordingStream){try{recordingStream.getVideoTracks().forEach(track=>track.stop());}catch(error){}recordingStream=null;}
    if(recordStartBtn)recordStartBtn.disabled=false;
    if(recordStopBtn)recordStopBtn.disabled=true;
    stopRecordingTimer();
    setRecordingStatus('Recording konnte nicht gestartet werden: '+err.message);
    alert('Recording konnte nicht gestartet werden: '+err.message);
  }
}
function stopRecording(){
  if(recorder&&recorder.state==='recording'){
    const seconds=(performance.now()-recordingStartedAt)/1000;
    setRecordingStatus('Recording wird verarbeitet · '+seconds.toFixed(1)+' s');
    recorder.stop();
  }
}
if(recordStartBtn)recordStartBtn.addEventListener('click',startRecording);
if(recordStopBtn)recordStopBtn.addEventListener('click',stopRecording);
if(recordHudStartBtn)recordHudStartBtn.addEventListener('click',startRecording);
if(sceneScreenshotBtn)sceneScreenshotBtn.addEventListener('click',saveSceneScreenshot);
if(recordHudStopBtn)recordHudStopBtn.addEventListener('click',stopRecording);
if(recordOverlayVisible)recordOverlayVisible.addEventListener('change',updateRecordingHud);
if(recordOverlayOpacity)recordOverlayOpacity.addEventListener('input',updateRecordingHud);
updateRecordingHud();
