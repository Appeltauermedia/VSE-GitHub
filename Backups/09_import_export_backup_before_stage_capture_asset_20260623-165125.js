/* ===== Import, Export und Asset-Wiederherstellung ===== */
function exportProject(download=true){
  const json=JSON.stringify(projectPackage(),null,2);
  const outEl=document.getElementById('out'); if(outEl) outEl.value=json;
  if(download) downloadText('VSE_V2_Project_'+new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')+'.scene',json);
}
exportBtn.onclick=()=>exportProject(true);
if(importBtn)importBtn.onclick=()=>importFile&&importFile.click();
function applyBackgroundFromData(data){
  Object.assign(background,{layer:0,color:'#05070c',mode:'cover',opacity:1,zoom:1,imageName:null,imageData:null},data||{});
  if(bgTex){try{gl.deleteTexture(bgTex);}catch(e){}} bgTex=null; bgImageSize=[0,0]; bgImageData=null;
  if(background.imageData){
    const img=new Image();
    img.onload=()=>{makeBgTexture(img);bgImageData=background.imageData;};
    img.src=background.imageData;
  }
  bgColor.value=background.color||'#05070c'; bgMode.value=background.mode||'cover'; bgOpacity.value=Number(background.opacity??1); bgZoom.value=Number(background.zoom??1);
  bgOpacityValue.textContent=Number(background.opacity??1).toFixed(2); bgZoomValue.textContent=Number(background.zoom??1).toFixed(2);
}

function restoreScreenTextBackgroundImage(o){
  if(!o||o.type!=='screen')return;
  o.screenTextBgImageElement=null;
  o.screenTextBgImageReady=false;
  if(o.screenTextBgImageData){
    const img=new Image();
    img.onload=()=>{o.screenTextBgImageReady=true;o.screenTextDirty=true;};
    img.src=o.screenTextBgImageData;
    o.screenTextBgImageElement=img;
  }
}

function restoreScreenImage(o){
  if(!o||o.type!=='screen')return;
  o.screenTexture=null;o.screenMediaElement=null;o.screenMediaUrl='';
  if(o.screenMediaType==='image'&&o.screenMediaData){
    const tex=initTexture(); const img=new Image(); o.screenTexture=tex; o.screenMediaElement=img; o.screenMediaEmbedded=true;
    img.onload=()=>{o.screenMediaAspect=(img.naturalWidth||1)/(img.naturalHeight||1);gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);};
    img.src=o.screenMediaData;
  }else if(o.screenMediaType==='video'){
    o.screenMediaData=null; o.screenMediaEmbedded=false; o.screenTexture=null; o.screenMediaElement=null; o.screenMediaUrl='';
  }
}

function releaseImageAsset(o){
  if(!o)return;
  o.imageAssetTexture=null;
  o.imageAssetElement=null;
  o.imageAssetImageType='none';
  o.imageAssetName='';
  o.imageAssetData=null;
  o.imageAssetEmbedded=false;
  o.imageAssetAspect=1;
}
function loadImageAssetFromData(o,data,name='ImageAsset'){
  if(!o||o.type!=='imageAsset'||!data)return;
  const tex=initTexture();
  const img=new Image();
  o.imageAssetTexture=tex;
  o.imageAssetElement=img;
  o.imageAssetData=data;
  o.imageAssetEmbedded=true;
  o.imageAssetImageType='image';
  o.imageAssetName=name;
  img.onload=()=>{
    const aspect=(img.naturalWidth||1)/Math.max(1,(img.naturalHeight||1));
    o.imageAssetAspect=aspect;
    if(!o._imageAssetSized){o.imageAssetWidth=o.imageAssetWidth||240;o.imageAssetHeight=o.imageAssetWidth/aspect;o._imageAssetSized=true;}
    gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
    if(selected===o)selectSingleCore(o);
  };
  img.src=data;
}
function loadImageAssetFile(o,file){
  if(!o||o.type!=='imageAsset'||!file)return;
  const r=new FileReader();
  r.onload=()=>loadImageAssetFromData(o,r.result,file.name);
  r.readAsDataURL(file);
}
function safeFileBaseName(name){
  return String(name||'ImageAsset').replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_\-äöüÄÖÜß]+/g,'_').replace(/^_+|_+$/g,'')||'ImageAsset';
}
function downloadBlob(filename,blob){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1200);
}
async function exportImageAssetPng(o){
  if(!o||o.type!=='imageAsset'){alert('Bitte zuerst ein ImageAsset auswählen.');return;}
  if(!o.imageAssetData&&!o.imageAssetElement){alert('Dieses ImageAsset enthält kein exportierbares Bild.');return;}
  try{
    let img=o.imageAssetElement;
    if(!img||!(img.naturalWidth||img.width)){
      img=await loadHtmlImage(o.imageAssetData);
    }
    const w=Math.max(1,img.naturalWidth||img.width||Math.round(o.imageAssetWidth||240));
    const h=Math.max(1,img.naturalHeight||img.height||Math.round(o.imageAssetHeight||160));
    const c=document.createElement('canvas');
    c.width=w;
    c.height=h;
    const ctx=c.getContext('2d');
    ctx.clearRect(0,0,w,h);
    ctx.drawImage(img,0,0,w,h);
    c.toBlob(blob=>{
      if(!blob){alert('PNG-Export fehlgeschlagen.');return;}
      downloadBlob(safeFileBaseName(o.name||o.imageAssetName||'ImageAsset')+'.png',blob);
    },'image/png');
  }catch(err){
    alert('PNG-Export fehlgeschlagen: '+(err&&err.message?err.message:err));
  }
}

function loadHtmlImage(src){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>reject(new Error('Bild konnte nicht geladen werden.'));
    img.src=src;
  });
}
function getBackgroundDrawRectStage(imgW,imgH){
  const sw=Math.max(1,Number(stageState.w||scene.stageWidth||1920));
  const sh=Math.max(1,Number(stageState.h||scene.stageHeight||1080));
  const zoom=Math.max(0.001,Number(background.zoom??1));
  const mode=background.mode||'cover';
  let dw=sw,dh=sh,dx=0,dy=0;
  if(mode==='stretch'){
    dw=sw*zoom; dh=sh*zoom; dx=(sw-dw)/2; dy=(sh-dh)/2;
  }else{
    const scale0=(mode==='contain')?Math.min(sw/imgW,sh/imgH):Math.max(sw/imgW,sh/imgH);
    const scale=scale0*zoom;
    dw=imgW*scale; dh=imgH*scale; dx=(sw-dw)/2; dy=(sh-dh)/2;
  }
  return {dx,dy,dw,dh,sw,sh};
}
function traceBgCaptureMaskPath(ctx,shape,x,y,w,h,points){
  ctx.beginPath();
  if(shape==='circle'){
    ctx.ellipse(x+w/2,y+h/2,Math.abs(w)/2,Math.abs(h)/2,0,0,Math.PI*2);
  }else if(shape==='path'){
    const pts=Array.isArray(points)?points:[];
    if(pts.length>2){
      ctx.moveTo(pts[0].x,pts[0].y);
      for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);
      ctx.closePath();
    }else{
      ctx.rect(x,y,w,h);
    }
  }else{
    ctx.rect(x,y,w,h);
  }
}
function traceClosedCanvasPath(ctx,points){
  const pts=Array.isArray(points)?points:[];
  if(pts.length<3)return false;
  ctx.beginPath();
  ctx.moveTo(pts[0].x,pts[0].y);
  for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);
  ctx.closePath();
  return true;
}
function applyAlphaMaskCanvas(target,drawMask){
  const mask=document.createElement('canvas');
  mask.width=target.width;
  mask.height=target.height;
  const maskCtx=mask.getContext('2d');
  maskCtx.clearRect(0,0,mask.width,mask.height);
  maskCtx.fillStyle='#fff';
  drawMask(maskCtx,mask.width,mask.height);
  const ctx=target.getContext('2d');
  ctx.globalCompositeOperation='destination-in';
  ctx.drawImage(mask,0,0);
  ctx.globalCompositeOperation='source-over';
}
function pointInClosedPath(x,y,points){
  const pts=Array.isArray(points)?points:[];
  if(pts.length<3)return false;
  let inside=false;
  for(let i=0,j=pts.length-1;i<pts.length;j=i++){
    const xi=pts[i].x, yi=pts[i].y, xj=pts[j].x, yj=pts[j].y;
    const dy=yj-yi;
    if(((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/(Math.abs(dy)<0.000001?0.000001:dy)+xi))inside=!inside;
  }
  return inside;
}
function applyFreehandAlphaMask(target,points,removeInside=false){
  const pts=Array.isArray(points)?points:[];
  if(pts.length<3)return;
  const ctx=target.getContext('2d');
  const img=ctx.getImageData(0,0,target.width,target.height);
  const data=img.data;
  for(let y=0;y<target.height;y++){
    for(let x=0;x<target.width;x++){
      const inside=pointInClosedPath(x+0.5,y+0.5,pts);
      if(removeInside?inside:!inside)data[(y*target.width+x)*4+3]=0;
    }
  }
  ctx.putImageData(img,0,0);
}
function refreshBackgroundImageData(data,name){
  background.imageData=data;
  background.imageName=name||background.imageName||'Hintergrund_mit_Ausschnitt.png';
  bgImageData=data;
  const img=new Image();
  img.onload=()=>{makeBgTexture(img);};
  img.src=data;
}
function restoreBgCaptureUndo(){
  const undo=bgCaptureUndo;
  if(!undo)return false;
  const asset=objects.find(o=>o.id===undo.assetId);
  if(asset&&asset.type==='imageAsset')releaseImageAsset(asset);
  objects=objects.filter(o=>o.id!==undo.assetId);
  selectedIds.delete(undo.assetId);
  if(selected&&selected.id===undo.assetId)selected=null;
  Object.assign(background,undo.background||{});
  bgImageData=undo.bgImageData||null;
  bgImageSize=Array.isArray(undo.bgImageSize)?undo.bgImageSize.slice():[0,0];
  if(bgTex){try{gl.deleteTexture(bgTex);}catch(e){}} bgTex=null;
  if(background.imageData){
    const img=new Image();
    img.onload=()=>{makeBgTexture(img);};
    img.src=background.imageData;
  }
  bgColor.value=background.color||'#05070c'; bgMode.value=background.mode||'cover'; bgOpacity.value=Number(background.opacity??1); bgZoom.value=Number(background.zoom??1);
  bgOpacityValue.textContent=Number(background.opacity??1).toFixed(2); bgZoomValue.textContent=Number(background.zoom??1).toFixed(2);
  select(objects[0]||null);
  syncLightUI();
  updateHud();
  updateObjectManager();
  if(bgToImageAssetStatus)bgToImageAssetStatus.textContent='Letzter Hintergrund-Ausschnitt rückgängig gemacht.';
  bgCaptureUndo=null;
  return true;
}
async function createImageAssetFromBackgroundRect(rectCss){
  if(!rectCss||rectCss.w<4||rectCss.h<4)return;
  const data=background.imageData||bgImageData;
  if(!data){alert('Es ist kein Hintergrundbild geladen.');return;}
  const shape=rectCss.shape||'rect';
  const removeFromBackground=getBgCaptureRemoveFromBackground();
  const previousBg={background:{...background},bgImageData:bgImageData,bgImageSize:[...bgImageSize]};
  const r=canvas.getBoundingClientRect();
  const sx=rectCss.x/r.width*stageState.w;
  const sy=rectCss.y/r.height*stageState.h;
  const sw=rectCss.w/r.width*stageState.w;
  const sh=rectCss.h/r.height*stageState.h;
  const displayScale=Math.max(0.0001,stageScale());
  const assetStageW=rectCss.w/displayScale;
  const assetStageH=rectCss.h/displayScale;
  const img=await loadHtmlImage(data);
  const off=document.createElement('canvas');
  off.width=Math.max(1,Math.round(sw));
  off.height=Math.max(1,Math.round(sh));
  const ctx=off.getContext('2d');
  ctx.clearRect(0,0,off.width,off.height);
  const d=getBackgroundDrawRectStage(img.naturalWidth||img.width,img.naturalHeight||img.height);
  ctx.drawImage(img,d.dx-sx,d.dy-sy,d.dw,d.dh);
  const assetPts=(rectCss.points||[]).map(p=>({x:(p.x-rectCss.x)/Math.max(1,rectCss.w)*off.width,y:(p.y-rectCss.y)/Math.max(1,rectCss.h)*off.height}));
  if(shape==='path'){
    applyFreehandAlphaMask(off,assetPts,false);
  }else{
    ctx.globalCompositeOperation='destination-in';
    traceBgCaptureMaskPath(ctx,shape,0,0,off.width,off.height,assetPts);
    ctx.fill();
    ctx.globalCompositeOperation='source-over';
  }
  const outData=off.toDataURL('image/png');
  const o=newObj('imageAsset',(rectCss.x+rectCss.w*0.5)/r.width*100,(rectCss.y+rectCss.h*0.5)/r.height*100);
  const suffix=shape==='circle'?'Kreis':shape==='path'?'Pfad':'Ausschnitt';
  o.name='Hintergrund_'+suffix+'_'+id;
  o.imageAssetWidth=assetStageW;
  o.imageAssetHeight=assetStageH;
  o.imageAssetKeepAspect=true;
  o.imageAssetOpacity=1;
  o.layer=1;
  o._imageAssetSized=true;
  objects.push(o);
  loadImageAssetFromData(o,outData,'Hintergrund_'+suffix+'.png');
  if(removeFromBackground){
    const bgCanvas=document.createElement('canvas');
    bgCanvas.width=Math.max(1,Math.round(d.sw));
    bgCanvas.height=Math.max(1,Math.round(d.sh));
    const bgCtx=bgCanvas.getContext('2d');
    bgCtx.clearRect(0,0,bgCanvas.width,bgCanvas.height);
    bgCtx.drawImage(img,d.dx,d.dy,d.dw,d.dh);
    const stagePts=(rectCss.points||[]).map(p=>({x:p.x/r.width*d.sw,y:p.y/r.height*d.sh}));
    if(shape==='path'){
      applyFreehandAlphaMask(bgCanvas,stagePts,true);
    }else{
      bgCtx.globalCompositeOperation='destination-out';
      traceBgCaptureMaskPath(bgCtx,shape,sx,sy,sw,sh,stagePts);
      bgCtx.fill();
      bgCtx.globalCompositeOperation='source-over';
    }
    background.mode='stretch';
    background.zoom=1;
    if(bgMode)bgMode.value='stretch';
    if(bgZoom){bgZoom.value=1;bgZoomValue.textContent='1.00';}
    refreshBackgroundImageData(bgCanvas.toDataURL('image/png'),'Hintergrund_mit_Ausschnitt.png');
    bgCaptureUndo={assetId:o.id,...previousBg};
  }else{
    bgCaptureUndo={assetId:o.id,background:{...background},bgImageData:bgImageData,bgImageSize:[...bgImageSize]};
  }
  select(o);
  syncLightUI();
  updateObjectManager();
  if(bgToImageAssetStatus){
    const action=removeFromBackground?' und im Hintergrund transparent entfernt':'';
    bgToImageAssetStatus.textContent=(shape==='circle'?'Kreis-/Ellipsen-Ausschnitt':shape==='path'?'Freier Pfad':'Ausschnitt')+' als ImageAsset erzeugt'+action+'.';
  }
}
function clampImageAssetAngularVelocity(o){
  if(!o||o.type!=='imageAsset')return;
  const maxAv=2.8;
  o.imageAssetAngularVelocity=Math.max(-maxAv,Math.min(maxAv,Number(o.imageAssetAngularVelocity||0)));
}
function calmImageAssetOnContact(o,dt,contactFriction=1){
  if(!o||o.type!=='imageAsset')return;
  const damp=Math.pow(0.18,Math.max(0.001,dt)*Math.max(1,contactFriction)*12);
  o.imageAssetAngularVelocity=Number(o.imageAssetAngularVelocity||0)*damp;
  if(Math.abs(o.imageAssetAngularVelocity)<0.025)o.imageAssetAngularVelocity=0;
  clampImageAssetAngularVelocity(o);
}
function applyImageAssetImpulse(o,ix,iy,strength,rotationImpulse=0){
  if(!o||o.type!=='imageAsset')return;
  o.imageAssetPhysicsEnabled=true;
  const m=Math.max(.1,Number(o.imageAssetMass||1));
  const sx=Number(ix||0), sy=Number(iy||0), st=Number(strength||0);
  const rot=Number(rotationImpulse||0);
  o.imageAssetVx=(Number(o.imageAssetVx||0)+sx*st/m);
  o.imageAssetVy=(Number(o.imageAssetVy||0)+sy*st/m);

  // Drehimpuls separat steuerbar:
  // Ab Version 164 gibt es KEINE automatische Rotation mehr durch linearen Impuls.
  // Seitliche Stöße verschieben das Asset nur. Rotation entsteht ausschließlich
  // über den Regler „Impulse Rotation“ oder später über gezielte Actor-/Trigger-Drehimpulse.
  const manualTorque=rot*0.42/Math.sqrt(m);
  o.imageAssetAngularVelocity=(Number(o.imageAssetAngularVelocity||0)+manualTorque);
  clampImageAssetAngularVelocity(o);
}
function applyImpulseFromActor(actorId,contactPoint,force){
  const actor=objects.find(o=>o.id===actorId);
  const cp=contactPoint||{x:50,y:50};
  for(const o of objects){
    if(o.type!=='imageAsset'||!o.imageAssetPhysicsEnabled)continue;
    const dx=Number(o.x||0)-Number(cp.x||0), dy=Number(o.y||0)-Number(cp.y||0);
    const d=Math.max(0.001,Math.hypot(dx,dy));
    if(d<12){applyImageAssetImpulse(o,dx/d,dy/d,Number(force||1),0);}
  }
}
function restoreParticleImage(o){
  if(!o||(o.type!=='particle'&&o.type!=='imageParticle'))return;
  o.particleTexture=null;o.particleImageElement=null;o.particleImageUrl='';
  if(o.particleImageType==='image'&&o.particleImageData){
    const tex=initTexture(); const img=new Image(); o.particleTexture=tex; o.particleImageElement=img; o.particleImageEmbedded=true;
    img.onload=()=>{o.particleImageAspect=(img.naturalWidth||1)/(img.naturalHeight||1);o._ipmKey='';gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);};
    img.src=o.particleImageData;
  }
}

function ensureTypeDefaults(o){
  if(!o || typeof o !== 'object') return o;
  const requestedType = (o.type || 'light');
  const safeType = requestedType === 'laser' ? 'light' : ((requestedType === 'pyro' || requestedType === 'explosion' || requestedType === 'confetti') ? 'particle' : requestedType);
  o.type = safeType;

  // Legacy imports / old field names
  if(o.audioSense !== undefined && o.music === undefined) o.music = Number(o.audioSense);
  if(o.audioSens !== undefined && o.music === undefined) o.music = Number(o.audioSens);
  if(o.audioSensitivity !== undefined && o.music === undefined) o.music = Number(o.audioSensitivity);
  if(o.frequency !== undefined && o.audioFreq === undefined) o.audioFreq = Number(o.frequency);

  // Fill missing properties with the current object defaults.
  // newObj() increments the internal id counter, but importProjectData recalculates id from imported objects afterwards.
  const defaults = newObj(safeType, Number(o.x ?? 50), Number(o.y ?? 50));
  for(const [k,v] of Object.entries(defaults)){
    if(o[k] === undefined || o[k] === null) o[k] = v;
  }
  o.id = o.id || defaults.id;
  o.name = o.name || defaults.name;
  o.x = Number(o.x ?? defaults.x);
  o.y = Number(o.y ?? defaults.y);
  o.layer = Math.max(-99, Math.min(99, Math.round(Number(o.layer ?? defaults.layer ?? 1))));
  o.size = Number(o.size ?? defaults.size ?? 44);
  o.rotation = Number(o.rotation ?? defaults.rotation ?? 0);
  o.music = Math.max(0, Math.min(1, Number(o.music ?? defaults.music ?? .3)));
  o.thresholdBelow = !!(o.thresholdBelow ?? defaults.thresholdBelow ?? false);
  o.windAffected = o.windAffected !== false;
  o.windInfluence = Math.max(0, Math.min(1, Number(o.windInfluence ?? defaults.windInfluence ?? 1)));
  o.audioFreq = Math.max(20, Math.min(20000, Number(o.audioFreq ?? defaults.audioFreq ?? 120)));
  if(o.type === 'light' || o.type === 'lightbar'){
    o.lightColorMusicEnabled = !!(o.lightColorMusicEnabled ?? defaults.lightColorMusicEnabled ?? false);
    o.lightColorMusicFreq = Math.max(20, Math.min(20000, Number(o.lightColorMusicFreq ?? defaults.lightColorMusicFreq ?? 1000)));
    o.lightColorMusicThreshold = Math.max(0, Math.min(1, Number(o.lightColorMusicThreshold ?? defaults.lightColorMusicThreshold ?? .35)));
    o.lightColorMusicBelow = !!(o.lightColorMusicBelow ?? defaults.lightColorMusicBelow ?? false);
    o.lightColorMusicAmount = Math.max(0, Math.min(2, Number(o.lightColorMusicAmount ?? defaults.lightColorMusicAmount ?? 1)));
  }

  if(o.type === 'particle'){
    const d = particlePresetDefaults(o.particleMode || 'free');
    for(const [k,v] of Object.entries(d)) if(o[k] === undefined || o[k] === null) o[k] = v;
  }
  if(o.type === 'imageParticle'){
    const d = particlePresetDefaults('imageParticles');
    for(const [k,v] of Object.entries(d)) if(o[k] === undefined || o[k] === null) o[k] = v;
  }
  ensureShadowDefaults(o);
  ensureWaterDefaults(o);
  ensureMandalaDefaults(o);
  return o;
}


function purgeImageParticleObjects(){
  objects=objects.filter(o=>o&&o.type!=='imageParticle');
  if(selected&&selected.type==='imageParticle')selected=null;
  for(const idv of Array.from(selectedIds||[])){
    const obj=objects.find(o=>o.id===idv);
    if(!obj)selectedIds.delete(idv);
  }
}

if(importFile)importFile.addEventListener('change',()=>{
  const f=importFile.files&&importFile.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=()=>{try{importProjectData(JSON.parse(r.result));}catch(err){alert('Import fehlgeschlagen: '+err.message);}};
  r.readAsText(f); importFile.value='';
});



function updateTimelineObjectOptions(){
  if(!timelineEventObject)return;
  const cur=timelineEventObject.value;
  const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const knownGroupIds=[...new Set(objects.map(o=>o.groupId).filter(Boolean))];
  const groupOptions=knownGroupIds.map(gid=>{
    const arr=timelineGroupMembers(gid);
    const g=timelineGroupById(gid);
    const name=(g&&g.name)||(arr[0]&&arr[0].groupName)||gid;
    return `<option value="${esc(gid)}">Gruppe: ${esc(name)} (${arr.length} Objekt${arr.length!==1?'e':''})</option>`;
  }).join('');
  const objectOptions=objects.map(o=>`<option value="${esc(o.id)}">${objectTypeLabel(o.type)} · ${esc(o.name||o.id)}</option>`).join('');
  timelineEventObject.innerHTML=(groupOptions?`<optgroup label="Gruppen">${groupOptions}</optgroup>`:'')+`<optgroup label="Objekte">${objectOptions}</optgroup>`;
  if(timelineTargetKindFromValue(cur))timelineEventObject.value=cur;
}
function timelineCurrentSelectionValue(){
  const selectedObjects=getSelectedObjects();
  const groupIds=[...new Set(selectedObjects.map(o=>o.groupId).filter(Boolean))];
  if(selectedObjects.length>1&&groupIds.length===1&&selectedObjects.every(o=>o.groupId===groupIds[0]))return groupIds[0];
  if(selected&&selected.groupId&&selectedObjects.length>1&&selectedObjects.every(o=>o.groupId===selected.groupId))return selected.groupId;
  return selected?selected.id:'';
}
function syncTimelineEventTargetFromForm(ev){
  if(!ev||!timelineEventObject)return;
  const id=timelineEventObject.value;
  const kind=timelineTargetKindFromValue(id);
  ev.objectId=id;
  if(kind==='group'){ev.targetType='group';ev.groupId=id;}
  else{delete ev.targetType;delete ev.groupId;}
}
function selectedTimelineEvent(){return timelineState.events.find(e=>e.id===timelineState.selectedEventId)||null;}
function renderTimelineEvents(){
  if(!timelineEventsEl)return;
  const dur=Math.max(0.001,Number(timelineState.duration)||180);
  timelineEventsEl.innerHTML='';
  timelineState.events.forEach(ev=>{
    const kind=timelineEventTargetKind(ev);
    const targetId=timelineEventTargetId(ev);
    const label=timelineTargetLabel(kind,targetId);
    const el=document.createElement('div');
    el.className='timelineEvent '+(ev.enabled===false?'off ':'')+(ev.id===timelineState.selectedEventId?'isSelected':'');
    const left=Math.max(0,Math.min(100,(Number(ev.time)||0)/dur*100));
    const width=Math.max(1.2,Math.min(100-left,(Number(ev.duration)||0)/dur*100));
    el.style.left=left+'%';el.style.width=width+'%';
    el.textContent=label+' · '+(ev.action||'activate');
    el.title=label+' · '+formatTimelineTime(ev.time||0);
    el.onclick=(e)=>{e.stopPropagation();timelineState.selectedEventId=ev.id;selectTimeline();setTimelineEventForm(ev);renderTimelineEvents();};
    timelineEventsEl.appendChild(el);
  });
}
function updateTimelinePlayhead(){
  const t=Math.min(Math.max(0,currentTimelineTime()),Math.max(0.001,timelineState.duration));
  if(timelineCurrentTimeEl)timelineCurrentTimeEl.textContent=formatTimelineTime(t);
  if(timelinePlayhead)timelinePlayhead.style.left=(t/Math.max(0.001,timelineState.duration)*100)+'%';
  updateTimelineMediaControls();
}
function deleteTimelineEvent(){
  if(!timelineState.selectedEventId)return;
  timelineState.events=timelineState.events.filter(e=>e.id!==timelineState.selectedEventId);
  timelineState.selectedEventId=null;updateTimelineUI();setTimelineEventForm(null);
}
if(timelineDock)timelineDock.addEventListener('click',e=>{
  selectTimeline();
  if(timelineBar&&timelineBar.contains(e.target)){
    const r=timelineBar.getBoundingClientRect();
    timelineState.lastClickTime=Math.max(0,Math.min(timelineState.duration,(e.clientX-r.left)/Math.max(1,r.width)*timelineState.duration));
    if(timelineEventTime){timelineEventTime.value=timelineState.lastClickTime;timelineEventTimeValue.textContent=formatTimelineTime(timelineState.lastClickTime);}
  }
});
if(timelineWidthInput)timelineWidthInput.addEventListener('input',()=>{timelineState.widthPercent=Number(timelineWidthInput.value)||100;updateTimelineUI();});
if(timelineDurationInput)timelineDurationInput.addEventListener('input',()=>{timelineState.manualDuration=true;timelineState.duration=Number(timelineDurationInput.value)||180;updateTimelineUI();setTimelineEventForm(selectedTimelineEvent());});
if(timelineUseMediaDurationBtn)timelineUseMediaDurationBtn.onclick=()=>{const d=getTimelineMediaDuration();if(d>0){timelineState.manualDuration=false;timelineState.duration=Math.ceil(d);updateTimelineUI();setTimelineEventForm(selectedTimelineEvent());}else alert('Keine aktuelle Audio-/Videodauer gefunden.');};
if(timelineUseSelectedObjectBtn)timelineUseSelectedObjectBtn.onclick=()=>{const value=timelineCurrentSelectionValue();if(value&&timelineEventObject){updateTimelineObjectOptions();timelineEventObject.value=value;}};
if(timelineAddEventBtn)timelineAddEventBtn.onclick=addOrUpdateTimelineEvent;
if(timelineDeleteEventBtn)timelineDeleteEventBtn.onclick=deleteTimelineEvent;
[timelineEventTime,timelineEventDuration].forEach(el=>{if(el)el.addEventListener('input',()=>{if(timelineEventTimeValue)timelineEventTimeValue.textContent=formatTimelineTime(Number(timelineEventTime.value)||0);if(timelineEventDurationValue)timelineEventDurationValue.textContent=Number(timelineEventDuration.value||0).toFixed(1)+' s';});});
if(timelineDropZone){
  timelineDropZone.addEventListener('dragover',e=>{e.preventDefault();timelineDropZone.classList.add('isOver');});
  timelineDropZone.addEventListener('dragleave',()=>timelineDropZone.classList.remove('isOver'));
  timelineDropZone.addEventListener('drop',e=>{e.preventDefault();timelineDropZone.classList.remove('isOver');const oid=e.dataTransfer.getData('group-id')||e.dataTransfer.getData('object-id');if(oid&&timelineTargetKindFromValue(oid)){updateTimelineObjectOptions();timelineEventObject.value=oid;}});
}

if(audioPlayer){
  audioPlayer.addEventListener('loadedmetadata',()=>{useTimelineMediaDurationIfAvailable(false);updateTimelineMediaControls();});
  audioPlayer.addEventListener('durationchange',()=>{useTimelineMediaDurationIfAvailable(false);updateTimelineMediaControls();});
  audioPlayer.addEventListener('timeupdate',()=>updateTimelinePlayhead());
  audioPlayer.addEventListener('play',()=>updateTimelineMediaControls());
  audioPlayer.addEventListener('pause',()=>updateTimelineMediaControls());
}

[timelineMediaControls,timelineMediaSeek].forEach(el=>{if(el)el.addEventListener('click',e=>e.stopPropagation());});
if(timelineMediaPlayBtn)timelineMediaPlayBtn.addEventListener('click',async e=>{
  e.stopPropagation();
  const media=getTimelineControlledMedia();
  if(!media||!media.el)return;
  try{
    if(media.el.paused){await media.el.play();}
    else media.el.pause();
  }catch(err){console.warn('Timeline Media Play/Pause fehlgeschlagen',err);}
  updateTimelineMediaControls();
});
if(timelineMediaStopBtn)timelineMediaStopBtn.addEventListener('click',e=>{
  e.stopPropagation();
  const media=getTimelineControlledMedia();
  if(!media||!media.el)return;
  media.el.pause();media.el.currentTime=0;
  updateTimelineMediaControls();updateTimelinePlayhead();
});
if(timelineMediaBackBtn)timelineMediaBackBtn.addEventListener('click',e=>{e.stopPropagation();const media=getTimelineControlledMedia();if(media&&media.el)seekTimelineMedia((media.el.currentTime||0)-5);});
if(timelineMediaForwardBtn)timelineMediaForwardBtn.addEventListener('click',e=>{e.stopPropagation();const media=getTimelineControlledMedia();if(media&&media.el)seekTimelineMedia((media.el.currentTime||0)+5);});
if(timelineMediaSeek)timelineMediaSeek.addEventListener('input',e=>{
  e.stopPropagation();
  seekTimelineMedia(Number(timelineMediaSeek.value||0)/1000);
});

window.addEventListener('keydown',e=>{
  const tag=(e.target&&e.target.tagName||'').toLowerCase();
  if(tag==='input'||tag==='textarea'||tag==='select')return;
  if(e.key==='ArrowRight'&&selected&&selected.type==='screen'&&selected.screenPlaylist&&selected.screenPlaylist.length){
    e.preventDefault();
    screenPlaylistNext(selected);
  }
});
