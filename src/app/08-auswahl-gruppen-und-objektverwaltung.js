/* ===== Auswahl, Gruppen und Objektverwaltung ===== */
function objectBBoxCss(o){
  const x=objCssX(o),y=objCssY(o),sc=stageScale();
  if(o.type==='screen'||o.type==='text')return {x:x-su(o.screenWidth||(o.type==='text'?520:260))/2,y:y-su(o.screenHeight||(o.type==='text'?180:120))/2,w:su(o.screenWidth||(o.type==='text'?520:260)),h:su(o.screenHeight||(o.type==='text'?180:120))};
  if(o.type==='imageAsset'){const ps=imageAssetRenderSize(o);return {x:x-su(ps.w)/2,y:y-su(ps.h)/2,w:su(ps.w),h:su(ps.h)};}
  if(isWaterObject(o))return {x:x-su(o.waterWidth||420)/2,y:y-su(o.waterHeight||180)/2,w:su(o.waterWidth||420),h:su(o.waterHeight||180)};
  if(o.type==='mandalaVisualizer')return {x:x-su(o.mandalaObjWidth||420)/2,y:y-su(o.mandalaObjHeight||420)/2,w:su(o.mandalaObjWidth||420),h:su(o.mandalaObjHeight||420)};
  if(o.type==='audioSource'){const r=Math.max(14*sc,su(o.size||58)*.55);return {x:x-r,y:y-r,w:r*2,h:r*2};}
  if(o.type==='cloud')return {x:x-su(o.cloudWidth||360)/2,y:y-su(o.cloudHeight||220)/2,w:su(o.cloudWidth||360),h:su(o.cloudHeight||220)};
  if(o.type==='visualizer')return {x:x-su(o.visualizerWidth||520)/2,y:y-su(o.visualizerHeight||180)/2,w:su(o.visualizerWidth||520),h:su(o.visualizerHeight||180)};
  if(o.type==='imageParticle')return {x:x-su((o.size||72)*(o.ipmScale||1)),y:y-su((o.size||72)*(o.ipmScale||1)),w:su((o.size||72)*(o.ipmScale||1))*2,h:su((o.size||72)*(o.ipmScale||1))*2};
  if(o.type==='particle' && (o.particleEmitterShape||'point')==='line')return {x:x-su(o.size||72)/2,y:y-su(o.particleEmitterLength||120)/2,w:su(o.size||72),h:su(o.particleEmitterLength||120)};
  const r=Math.max(14*sc,su(o.size||40)*.5);return {x:x-r,y:y-r,w:r*2,h:r*2};
}
function rectsIntersect(a,b){return !(a.x+a.w<b.x||b.x+b.w<a.x||a.y+a.h<b.y||b.y+b.h<a.y);}
function selectRect(cssRect,additive=false){
  if(!additive){selectedIds.clear();selected=null;}
  const found=[];for(const o of objects){if(rectsIntersect(cssRect,objectBBoxCss(o))){selectedIds.add(o.id);found.push(o);}}
  selected=found[found.length-1]||getSelectedObjects()[0]||null;
  if(selected)selectSingleCore(selected);else selectSingleCore(null);
  if(groupNameInput&&selected)groupNameInput.value=selected.groupName||'';
  updateHud();updateObjectManager();
}
function groupCenter(arr=getSelectedObjects()){let sx=0,sy=0;if(!arr.length)return {x:50,y:50};for(const o of arr){sx+=Number(o.x||0);sy+=Number(o.y||0);}return {x:sx/arr.length,y:sy/arr.length};}
function createGroup(){const arr=getSelectedObjects();if(arr.length<2){alert('Bitte mindestens zwei Objekte auswählen.');return;}const gid='grp_'+Date.now().toString(36)+'_'+Math.floor(Math.random()*9999).toString(36);const name=(groupNameInput&&groupNameInput.value.trim())||'Gruppe '+(groups.length+1);groups.push({id:gid,name});arr.forEach(o=>{o.groupId=gid;o.groupName=name;});selected=arr[0];selectSingleCore(selected);updateHud();updateObjectManager();}
function selectGroup(){const gid=selected&&selected.groupId;if(!gid)return;selectedIds.clear();objects.filter(o=>o.groupId===gid).forEach(o=>selectedIds.add(o.id));selected=objects.find(o=>o.groupId===gid)||selected;selectSingleCore(selected);updateHud();updateObjectManager();}
function dissolveGroup(){const arr=getSelectedObjects();const gids=new Set(arr.map(o=>o.groupId).filter(Boolean));if(selected&&selected.groupId)gids.add(selected.groupId);objects.forEach(o=>{if(gids.has(o.groupId)){delete o.groupId;delete o.groupName;}});groups=groups.filter(g=>!gids.has(g.id));if(selected)selectSingleCore(selected);updateHud();updateObjectManager();}
function transformSelection(scale=1,rotDeg=0){let arr=getSelectedObjects();if(arr.length<2&&selected&&selected.groupId)arr=objects.filter(o=>o.groupId===selected.groupId);if(!arr.length)return;const c=groupCenter(arr),a=rotDeg*Math.PI/180;for(const o of arr){const dx=Number(o.x||0)-c.x,dy=Number(o.y||0)-c.y;const nx=(dx*scale)*Math.cos(a)-(dy*scale)*Math.sin(a);const ny=(dx*scale)*Math.sin(a)+(dy*scale)*Math.cos(a);o.x=c.x+nx;o.y=c.y+ny;o.size=Math.max(1,Number(o.size||40)*scale);if(o.type==='screen'){o.screenWidth=Math.max(1,Number(o.screenWidth||260)*scale);o.screenHeight=Math.max(1,Number(o.screenHeight||120)*scale);}if(o.type==='text'){o.screenWidth=Math.max(1,Number(o.screenWidth||520)*scale);o.screenHeight=Math.max(1,Number(o.screenHeight||180)*scale);}
    if(o.type==='imageAsset'){o.imageAssetWidth=Math.max(1,Number(o.imageAssetWidth||240)*scale);o.imageAssetHeight=Math.max(1,Number(o.imageAssetHeight||160)*scale);}if(isWaterObject(o)){o.waterWidth=Math.max(1,Number(o.waterWidth||420)*scale);o.waterHeight=Math.max(1,Number(o.waterHeight||180)*scale);}if(o.type==='mandalaVisualizer'){o.mandalaObjWidth=Math.max(1,Number(o.mandalaObjWidth||420)*scale);o.mandalaObjHeight=Math.max(1,Number(o.mandalaObjHeight||420)*scale);}if(o.type==='visualizer'){o.visualizerWidth=Math.max(1,Number(o.visualizerWidth||520)*scale);o.visualizerHeight=Math.max(1,Number(o.visualizerHeight||180)*scale);}if(o.type==='greenscreen'){o.greenscreenWidth=Math.max(1,Number(o.greenscreenWidth||480)*scale);o.greenscreenHeight=Math.max(1,Number(o.greenscreenHeight||270)*scale);}if(o.type==='cloud'){o.cloudWidth=Math.max(40,Number(o.cloudWidth||360)*scale);o.cloudHeight=Math.max(30,Number(o.cloudHeight||220)*scale);}if(o.type==='particle'){o.particleEmitterLength=Math.max(1,Number(o.particleEmitterLength||120)*scale);}o.rotation=((Number(o.rotation||0)+rotDeg)%360+360)%360;}if(selected)selectSingleCore(selected);updateHud();updateObjectManager();}
function objectTypeLabel(t){
  return ({light:'Lichtemitter',lightbar:'Lightbars',fog:'Nebelemitter',cloud:'Wolken',screen:'Screens',text:'Texte',waterSurface:'WaterSurface',waterFlowOverlay:'WaterFlowOverlay',mandalaVisualizer:'MandalaVisualizer',particle:'Partikeleffekte',visualizer:'Visualizer',imageParticle:'Image-to-Particle',greenscreen:'Greenscreen',imageAsset:'ImageAssets',audioSource:'AudioSources'})[t]||t||'Objekt';
}
function objectShortName(o){return (o&&o.name)||objectTypeLabel(o&&o.type)||'Objekt';}
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
  const typeOrder=['light','lightbar','movinghead','fog','cloud','screen','waterSurface','waterFlowOverlay','mandalaVisualizer','imageAsset','audioSource','greenscreen','particle','visualizer','imageParticle'];
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
            html+=`<div class="omRow ${selectedIds.has(o.id)?'isSelected':''}"><div><b>${esc(objectShortName(o))}</b><div class="omMeta">Layer ${Number(o.layer??1)} · ${esc(o.id)}</div></div><button type="button" data-oid="${esc(o.id)}">Auswählen</button></div>`;
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
      html+=`<div class="omRow ${selectedIds.has(o.id)?'isSelected':''}"><div><b>${esc(objectShortName(o))}</b><div class="omMeta">Layer ${Number(o.layer??1)}${esc(gtxt)}</div></div><button type="button" data-oid="${esc(o.id)}">Auswählen</button></div>`;
    }
  }
  if(!anyType)html+='<div class="omEmpty">Keine verwaltbaren Objekte gefunden.</div>';
  objectManager.innerHTML=html;
  objectManager.querySelectorAll('.omRow').forEach(row=>{const btn=row.querySelector('button[data-oid]');if(btn){row.draggable=true;row.addEventListener('dragstart',ev=>{ev.dataTransfer.setData('object-id',btn.dataset.oid);ev.dataTransfer.setData('text/plain','object:'+btn.dataset.oid);});}});
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
document.querySelectorAll('.tool').forEach(t=>{
  if(isWaterPaletteType(t.dataset.type)){t.draggable=false;t.setAttribute('title','Anklicken, Form rechts wählen, dann Wasserfläche auf der Arbeitsfläche zeichnen.');}
  t.addEventListener('dragstart',e=>{draggedType=t.dataset.type;draggedParticleMode=t.dataset.particleMode||'free';if(isWaterPaletteType(draggedType)){e.preventDefault();return;}e.dataTransfer.setData('text/plain',draggedType);e.dataTransfer.setData('particle-mode',draggedParticleMode);});
  t.addEventListener('pointerdown',e=>{const type=t.dataset.type;if(isWaterPaletteType(type)){e.preventDefault();e.stopPropagation();beginWaterDrawFromPalette(type);}});
  t.addEventListener('dblclick',()=>{if(t.dataset.type!=='cloud')return;const o=newObj('cloud',50,50);objects.push(o);select(o);if(typeof updateTimelineObjectOptions==='function')updateTimelineObjectOptions();});
});
canvas.addEventListener('dragover',e=>e.preventDefault());canvas.addEventListener('drop',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();let type=e.dataTransfer.getData('text/plain')||draggedType;if(isWaterPaletteType(type))return;const o=newObj(type,(e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100);if(o.type==='text'){applyTypeDefaults(o,'text');o.name='Text_'+id;}if(o.type==='particle'){const mode=e.dataTransfer.getData('particle-mode')||draggedParticleMode||'free';Object.assign(o,particlePresetDefaults(mode));o.particleMode=mode;o.name=mode+'_partikel_'+id;}
if(o.type==='imageAsset'){o.name='ImageAsset_'+id;}
if(o.type==='waterSurface'){o.name='WaterSurface_'+id;}
if(o.type==='waterFlowOverlay'){o.name='WaterFlow_'+id;}
if(o.type==='mandalaVisualizer'){o.name='MandalaVisualizer_'+id;}
  if(o.type==='audioSource'){o.name='AudioSource_'+id;}
objects.push(o);select(o);});
function hit(mx,my){for(let i=objects.length-1;i>=0;i--){const o=objects[i];const sx=objCssX(o),sy=objCssY(o);if(o.type==='cloud'){const dx=mx-sx,dy=my-sy,a=-(Number(o.rotation||0))*Math.PI/180,qx=dx*Math.cos(a)-dy*Math.sin(a),qy=dx*Math.sin(a)+dy*Math.cos(a);if(Math.abs(qx)<=su(o.size||180)*1.125&&Math.abs(qy)<=su(o.size||180)*.625)return o;}if(o.type==='screen'){const dx=mx-sx,dy=my-sy;const a=-(Number(o.rotation||0))*Math.PI/180;const qx=dx*Math.cos(a)-dy*Math.sin(a), qy=dx*Math.sin(a)+dy*Math.cos(a);if(Math.abs(qx)<=su(o.screenWidth||260)/2+8*stageScale() && Math.abs(qy)<=su(o.screenHeight||120)/2+8*stageScale())return o;}if(o.type==='imageAsset'){const dx=mx-sx,dy=my-sy;const a=-(Number(o.rotation||0))*Math.PI/180;const qx=dx*Math.cos(a)-dy*Math.sin(a), qy=dx*Math.sin(a)+dy*Math.cos(a);const ps=imageAssetRenderSize(o);if(Math.abs(qx)<=su(ps.w)/2+8*stageScale() && Math.abs(qy)<=su(ps.h)/2+8*stageScale())return o;}if(isWaterObject(o)){const dx=mx-sx,dy=my-sy;const a=-(Number(o.rotation||0))*Math.PI/180;const qx=dx*Math.cos(a)-dy*Math.sin(a), qy=dx*Math.sin(a)+dy*Math.cos(a);if(Math.abs(qx)<=su(o.waterWidth||420)/2+8*stageScale() && Math.abs(qy)<=su(o.waterHeight||180)/2+8*stageScale())return o;}if(o.type==='mandalaVisualizer'){const dx=mx-sx,dy=my-sy;const a=-(Number(o.rotation||0))*Math.PI/180;const qx=dx*Math.cos(a)-dy*Math.sin(a), qy=dx*Math.sin(a)+dy*Math.cos(a);if(Math.abs(qx)<=su(o.mandalaObjWidth||420)/2+8*stageScale() && Math.abs(qy)<=su(o.mandalaObjHeight||420)/2+8*stageScale())return o;}if(o.type==='visualizer'){const dx=mx-sx,dy=my-sy;const a=-(Number(o.rotation||0))*Math.PI/180;const qx=dx*Math.cos(a)-dy*Math.sin(a), qy=dx*Math.sin(a)+dy*Math.cos(a);if(Math.abs(qx)<=su(o.visualizerWidth||520)/2+8*stageScale() && Math.abs(qy)<=su(o.visualizerHeight||180)/2+8*stageScale())return o;}if(o.type==='greenscreen'){const dx=mx-sx,dy=my-sy;const a=-(Number(o.rotation||0))*Math.PI/180;const qx=dx*Math.cos(a)-dy*Math.sin(a), qy=dx*Math.sin(a)+dy*Math.cos(a);const gs=getGreenscreenRenderSize(o);if(Math.abs(qx)<=gs.w/2+8*stageScale() && Math.abs(qy)<=gs.h/2+8*stageScale())return o;}if(Math.hypot(mx-sx,my-sy)<Math.max(16*stageScale(),su(o.size)*.32))return o;}return null;}
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
function setSelectionBoxFromCanvasRect(x,y,w,h){
  if(!selectionBox)return;
  const cr=canvas.getBoundingClientRect();
  const wr=stageWrap.getBoundingClientRect();
  selectionBox.style.left=(cr.left-wr.left+x)+'px';
  selectionBox.style.top=(cr.top-wr.top+y)+'px';
  selectionBox.style.width=w+'px';
  selectionBox.style.height=h+'px';
}
function hidePathSelectionOverlay(){
  if(!pathSelectionOverlay)return;
  pathSelectionOverlay.style.display='none';
  pathSelectionOverlay.innerHTML='';
}
function updatePathSelectionOverlay(points,closed=false){
  if(!pathSelectionOverlay||!Array.isArray(points)||!points.length)return;
  const cr=canvas.getBoundingClientRect();
  const wr=stageWrap.getBoundingClientRect();
  pathSelectionOverlay.style.display='block';
  pathSelectionOverlay.style.left=(cr.left-wr.left)+'px';
  pathSelectionOverlay.style.top=(cr.top-wr.top)+'px';
  pathSelectionOverlay.style.width=cr.width+'px';
  pathSelectionOverlay.style.height=cr.height+'px';
  pathSelectionOverlay.setAttribute('viewBox','0 0 '+cr.width+' '+cr.height);
  const attr=points.map(p=>Number(p.x||0).toFixed(1)+','+Number(p.y||0).toFixed(1)).join(' ');
  const tag=closed?'polygon':'polyline';
  pathSelectionOverlay.innerHTML='<'+tag+' points="'+attr+'"></'+tag+'>';
}
function waterShapeToCaptureShape(shape){return shape==='oval'?'circle':shape==='freehand'?'path':'rect';}
function waterShapeSelectionRadius(shape){return shape==='oval'?'999px':shape==='freehand'?'12px':'6px';}
function createWaterObjectFromDraw(cut){
  if(!waterDrawMode||!cut||cut.w<4||cut.h<4)return;
  if(cut.shape==='path'&&(!cut.points||cut.points.length<3))return;
  const r=canvas.getBoundingClientRect();
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
canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;if(waterDrawMode){const shape=waterShapeToCaptureShape(waterDrawMode.draft&&waterDrawMode.draft.waterShape);waterDrawDrag={shape,startMx:mx,startMy:my,lastMx:mx,lastMy:my,points:shape==='path'?[{x:mx,y:my}]:[]};if(shape==='path'){if(selectionBox)selectionBox.style.display='none';updatePathSelectionOverlay(waterDrawDrag.points,false);}else if(selectionBox){hidePathSelectionOverlay();selectionBox.style.display='block';selectionBox.style.borderRadius=waterShapeSelectionRadius(waterDrawMode.draft&&waterDrawMode.draft.waterShape);setSelectionBoxFromCanvasRect(mx,my,0,0);}canvas.setPointerCapture(e.pointerId);return;}if(bgCaptureMode){const shape=getBgCaptureShape();bgCaptureDrag={shape,startMx:mx,startMy:my,lastMx:mx,lastMy:my,points:shape==='path'?[{x:mx,y:my}]:[]};if(shape==='path'){if(selectionBox)selectionBox.style.display='none';updatePathSelectionOverlay(bgCaptureDrag.points,false);}else if(selectionBox){hidePathSelectionOverlay();selectionBox.style.display='block';selectionBox.style.borderRadius=shape==='circle'?'999px':'6px';setSelectionBoxFromCanvasRect(mx,my,0,0);}canvas.setPointerCapture(e.pointerId);return;}const o=hit(mx,my);if(o){if(e.shiftKey)select(o,true);else if(!selectedIds.has(o.id))select(o,false);else selected=o;let arr=getSelectedObjects();if(arr.length<2&&o.groupId)arr=objects.filter(x=>x.groupId===o.groupId);arr=arr.filter(x=>!(x.type==='mandalaVisualizer'&&x.mandalaObjLocked)&&!(x.type==='cloud'&&x.cloudLocked));drag={type:'move',startMx:mx,startMy:my,items:arr.map(x=>({o:x,x:Number(x.x||0),y:Number(x.y||0)}))};canvas.setPointerCapture(e.pointerId);}else{hidePathSelectionOverlay();selectionDrag={startMx:mx,startMy:my,lastMx:mx,lastMy:my,add:e.shiftKey};if(selectionBox){selectionBox.style.display='block';setSelectionBoxFromCanvasRect(mx,my,0,0);}canvas.setPointerCapture(e.pointerId);}});
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;if(waterDrawDrag){waterDrawDrag.lastMx=mx;waterDrawDrag.lastMy=my;if(waterDrawDrag.shape==='path'){const pts=waterDrawDrag.points;const last=pts[pts.length-1];if(!last||Math.hypot(mx-last.x,my-last.y)>2)pts.push({x:mx,y:my});updatePathSelectionOverlay(pts,false);}else if(selectionBox){const pts=[{x:waterDrawDrag.startMx,y:waterDrawDrag.startMy},{x:mx,y:my}];const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;setSelectionBoxFromCanvasRect(x,y,w,h);}return;}if(bgCaptureDrag){bgCaptureDrag.lastMx=mx;bgCaptureDrag.lastMy=my;if(bgCaptureDrag.shape==='path'){const pts=bgCaptureDrag.points;const last=pts[pts.length-1];if(!last||Math.hypot(mx-last.x,my-last.y)>2)pts.push({x:mx,y:my});updatePathSelectionOverlay(pts,false);}else if(selectionBox){const pts=[{x:bgCaptureDrag.startMx,y:bgCaptureDrag.startMy},{x:mx,y:my}];const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;setSelectionBoxFromCanvasRect(x,y,w,h);}return;}if(drag&&drag.type==='move'){const beforeImageAssetFollow=captureGroupedImageAssetPositions();const dx=(mx-drag.startMx)/r.width*100,dy=(my-drag.startMy)/r.height*100;for(const it of drag.items){it.o.x=it.x+dx;it.o.y=it.y+dy;}syncGroupedAudioSourcesWithImageAssets(beforeImageAssetFollow);if(selected)selectSingleCore(selected);updateHud();return;}if(selectionDrag){selectionDrag.lastMx=mx;selectionDrag.lastMy=my;if(selectionBox){const x=Math.min(selectionDrag.startMx,mx),y=Math.min(selectionDrag.startMy,my),w=Math.abs(mx-selectionDrag.startMx),h=Math.abs(my-selectionDrag.startMy);setSelectionBoxFromCanvasRect(x,y,w,h);}}});
canvas.addEventListener('pointerup',()=>{if(waterDrawDrag){const capture=waterDrawDrag;const pts=capture.shape==='path'?capture.points:[{x:capture.startMx,y:capture.startMy},{x:capture.lastMx,y:capture.lastMy}];const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;if(selectionBox){selectionBox.style.display='none';selectionBox.style.borderRadius='6px';}hidePathSelectionOverlay();const cut={x,y,w,h,shape:capture.shape,points:capture.shape==='path'?capture.points.map(p=>({x:p.x,y:p.y})):null};waterDrawDrag=null;if(w>4&&h>4&&(cut.shape!=='path'||(cut.points&&cut.points.length>2)))createWaterObjectFromDraw(cut);return;}if(bgCaptureDrag){const capture=bgCaptureDrag;const pts=capture.shape==='path'?capture.points:[{x:capture.startMx,y:capture.startMy},{x:capture.lastMx,y:capture.lastMy}];const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;if(selectionBox){selectionBox.style.display='none';selectionBox.style.borderRadius='6px';}hidePathSelectionOverlay();const cut={x,y,w,h,shape:capture.shape,points:capture.shape==='path'?capture.points.map(p=>({x:p.x,y:p.y})):null};bgCaptureDrag=null;bgCaptureMode=false;setBgCaptureButtonState(false);if(w>4&&h>4&&(cut.shape!=='path'||(cut.points&&cut.points.length>2)))createImageAssetFromBackgroundRect(cut).catch(err=>{console.error(err);alert('Ausschnitt konnte nicht erzeugt werden.');});return;}if(selectionDrag){const x=Math.min(selectionDrag.startMx,selectionDrag.lastMx),y=Math.min(selectionDrag.startMy,selectionDrag.lastMy),w=Math.abs(selectionDrag.lastMx-selectionDrag.startMx),h=Math.abs(selectionDrag.lastMy-selectionDrag.startMy);if(selectionBox)selectionBox.style.display='none';hidePathSelectionOverlay();if(w>4&&h>4)selectRect({x,y,w,h},selectionDrag.add);else if(!selectionDrag.add)select(null);selectionDrag=null;}drag=null;});
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
    if(o.type==='screen')releaseScreenMedia(o);
    else if(o.type==='imageAsset')releaseImageAsset(o);
    else if(o.type==='audioSource')releaseAudioSource(o);
    else if(o.type==='greenscreen')releaseGreenscreenMedia(o);
    else if(o.type==='particle')releaseParticleImage(o);
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
clearBtn.onclick=()=>{objects.forEach(o=>{if(o.type==='screen')releaseScreenMedia(o);if(o.type==='imageAsset')releaseImageAsset(o);if(o.type==='audioSource')releaseAudioSource(o);if(o.type==='greenscreen')releaseGreenscreenMedia(o);if(o.type==='particle'||o.type==='imageParticle')releaseParticleImage(o);});objects=[];groups=[];select(null);syncLightUI();updateObjectManager();};
function cleanObjectsForExport(){
  const runtimeKeys=new Set(['screenTexture','screenMediaElement','screenMediaUrl','screenCaptureStream','screenPlaylist','screenTextTexture','screenTextCanvas','screenTextBgImageElement','particleTexture','particleImageElement','particleImageUrl','imageAssetTexture','imageAssetElement','imageAssetUrl','audioSourceElement','audioSourceNode','audioSourceGain','audioSourceAnalyserTap','audioSourcePan','audioSourceMediaUrl','greenscreenTexture','greenscreenMediaElement','greenscreenMediaUrl','greenscreenStream','greenscreenTexture','greenscreenMediaElement','greenscreenMediaUrl','greenscreenStream']);
  return objects.map(o=>Object.fromEntries(Object.entries(o).filter(([k,v])=>!k.startsWith('_')&&!runtimeKeys.has(k)&&typeof v!=='function')));
}
let recorder=null;
let recordingChunks=[];
let recordingStartedAt=0;
let recordingTimerId=null;
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
function preferredRecordingMime(){
  const types=[
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ];
  if(typeof MediaRecorder==='undefined')return '';
  return types.find(t=>MediaRecorder.isTypeSupported(t))||'';
}
function startRecording(){
  if(recorder&&recorder.state==='recording')return;
  if(!canvas.captureStream){alert('Canvas-Aufnahme wird von diesem Browser nicht unterstützt.');return;}
  if(typeof MediaRecorder==='undefined'){alert('MediaRecorder wird von diesem Browser nicht unterstützt.');return;}
  try{
    const fps=Math.max(1,Math.min(120,parseInt(recordFps&&recordFps.value?recordFps.value:'60',10)||60));

    // Canvas liefert das WebGL-Bild. Audio wird separat aus dem VSE-Audio-Backbone zugemischt.
    const canvasStream=canvas.captureStream(fps);
    const tracks=[...canvasStream.getVideoTracks()];
    let audioTrackCount=0;

    if(audioState.enabled&&audioCtx){
      ensureAudio();
      if(audioCtx.state==='suspended') audioCtx.resume().catch(()=>{});
      if(recordingAudioDest&&recordingAudioDest.stream){
        const audioTracks=recordingAudioDest.stream.getAudioTracks();
        audioTrackCount=audioTracks.length;
        tracks.push(...audioTracks);
      }
    }

    const stream=new MediaStream(tracks);
    const mime=preferredRecordingMime();
    recordingChunks=[];
    recorder=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:12000000,audioBitsPerSecond:192000}:{videoBitsPerSecond:12000000,audioBitsPerSecond:192000});
    recordingStartedAt=performance.now();
    recorder.ondataavailable=e=>{if(e.data&&e.data.size>0)recordingChunks.push(e.data);};
    recorder.onerror=e=>{setRecordingStatus('Recording-Fehler: '+(e.error&&e.error.message?e.error.message:'unbekannt'));};
    recorder.onstop=()=>{
      try{canvasStream.getTracks().forEach(t=>t.stop());}catch(e){}
      const blob=new Blob(recordingChunks,{type:mime||'video/webm'});
      recordingChunks=[];
      const stamp=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;
      a.download='VSE_Recording_'+stamp+'.webm';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1500);
      if(recordStartBtn)recordStartBtn.disabled=false;
      if(recordStopBtn)recordStopBtn.disabled=true;
      setRecordingStatus('Aufnahme gespeichert: '+Math.round(blob.size/1024/1024*10)/10+' MB · WebM'+(audioTrackCount?' · mit Audio':' · ohne aktive Audioquelle'));
      recorder=null;
      stopRecordingTimer();
    };
    recorder.start(250);
    if(recordStartBtn)recordStartBtn.disabled=true;
    if(recordStopBtn)recordStopBtn.disabled=false;
    startRecordingTimer();
    setRecordingStatus('Recording läuft · '+fps+' FPS · WebGL-Canvas '+(audioTrackCount?'+ Audio':'ohne aktive Audioquelle')+' → WebM');
  }catch(err){
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
