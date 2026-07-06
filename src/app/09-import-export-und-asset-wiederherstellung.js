/* ===== Import, Export und Asset-Wiederherstellung ===== */
function serializeScenePackage(data){
  const seen=new WeakSet();
  return JSON.stringify(data,(key,value)=>{
    if(typeof value==='function')return undefined;
    if(value&&typeof value==='object'){
      const ctor=value.constructor&&value.constructor.name||'';
      if(/^(HTML|WebGL|Audio|MediaStream|CanvasRendering|ImageBitmap|VideoFrame)/.test(ctor))return undefined;
      if(seen.has(value))return undefined;
      seen.add(value);
    }
    return value;
  },2);
}
function sceneBlobToDataUrl(blob){
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error||new Error('Medium konnte nicht gelesen werden.'));reader.readAsDataURL(blob);});
}
async function sceneMediaToDataUrl(url){
  if(!url)return null;
  if(String(url).startsWith('data:'))return url;
  const response=await fetch(url);
  if(!response.ok)throw new Error('Medium konnte nicht für den Export gelesen werden.');
  return sceneBlobToDataUrl(await response.blob());
}
function cleanTimelineAudioClipForExport(clip){
  return Object.fromEntries(Object.entries(clip||{}).filter(([key,value])=>!key.startsWith('_')&&typeof value!=='function'));
}
function sceneEventSnapshots(event){
  if(!event||!event.snapshot)return [];
  if(event.snapshot.type==='group')return (event.snapshot.objects||[]).map(entry=>entry&&entry.snapshot).filter(Boolean);
  return [event.snapshot];
}
function copyEmbeddedScreenVideoToTimeline(data,exportedObjects){
  for(const event of (data.timeline&&data.timeline.events)||[]){
    for(const snapshot of sceneEventSnapshots(event)){
      if(snapshot.type!=='screen')continue;
      const source=exportedObjects.get(snapshot.id)||exportedObjects.get(event.objectId)||exportedObjects.get(event.groupId);
      if(source&&source.screenMediaType==='video'&&source.screenMediaData){snapshot.screenMediaType='video';snapshot.screenMode='video';snapshot.screenMediaName=source.screenMediaName||snapshot.screenMediaName;snapshot.screenMediaData=source.screenMediaData;snapshot.screenMediaEmbedded=true;}
    }
  }
}
async function buildSceneExportPackage(includeMedia){
  const data=projectPackage();
  data.timeline=data.timeline||{};
  data.timeline.events=JSON.parse(JSON.stringify(data.timeline.events||[]));
  data.timeline.audioClips=(timelineState.audioClips||[]).filter(Boolean).map(cleanTimelineAudioClipForExport);
  data.mediaAssets=[];
  data.exportOptions={mediaEmbedded:!!includeMedia};
  data.notes={...(data.notes||{}),videos:includeMedia?'embedded_when_local':'not_embedded',music:includeMedia?'embedded_when_local':'not_embedded'};
  if(!includeMedia)return data;
  const exportedObjects=new Map((data.objects||[]).map(object=>[object.id,object]));
  const screenFileRegistry=window.vseScreenMediaFileRegistry instanceof Map?window.vseScreenMediaFileRegistry:new Map();
  const greenscreenFileRegistry=window.vseGreenscreenMediaFileRegistry instanceof Map?window.vseGreenscreenMediaFileRegistry:new Map();
  const videoCandidates=(objects||[]).filter(object=>{
    if(object.type==='screen'&&object.screenMediaType==='video')return !!(screenFileRegistry.get(object.id)||object._screenMediaSourceFile||object.screenMediaData||object.screenMediaUrl||(object.screenMediaElement&&object.screenMediaElement.src));
    if(object.type==='greenscreen'&&object.greenscreenMediaType==='video')return !!(greenscreenFileRegistry.get(object.id)||object._greenscreenMediaSourceFile||object.greenscreenMediaData||object.greenscreenMediaUrl||(object.greenscreenMediaElement&&object.greenscreenMediaElement.src));
    return false;
  });
  const embeddedVideoIds=new Set();
  for(const object of objects||[]){
    let target=exportedObjects.get(object.id);
    if(!target){
      target=typeof cleanObjectForObjectExport==='function'?cleanObjectForObjectExport(object):Object.fromEntries(Object.entries(object).filter(([key,value])=>!key.startsWith('_')&&typeof value!=='function'));
      data.objects.push(target);exportedObjects.set(object.id,target);
    }
    if(object.type==='screen'&&object.screenMediaType==='video'){
      const sourceFile=screenFileRegistry.get(object.id)||object._screenMediaSourceFile;
      const preloadedMedia=object.screenMediaData||(object._screenMediaExportPromise&&await object._screenMediaExportPromise);
      const media=sourceFile?await sceneBlobToDataUrl(sourceFile):await sceneMediaToDataUrl(preloadedMedia||object.screenMediaUrl||(object.screenMediaElement&&object.screenMediaElement.src));
      if(media){const assetId='video_'+String(object.id||embeddedVideoIds.size);target.type='screen';target.id=object.id;target.screenMediaType='video';target.screenMode='video';target.screenMediaName=(sourceFile&&sourceFile.name)||object.screenMediaName||target.screenMediaName;target.screenMediaData=media;target.screenMediaAssetId=assetId;target.screenMediaEmbedded=true;data.mediaAssets.push({id:assetId,kind:'screen-video',objectId:object.id,name:target.screenMediaName,mimeType:(sourceFile&&sourceFile.type)||'',data:media});embeddedVideoIds.add(object.id);}
    }
    if(object.type==='greenscreen'&&object.greenscreenMediaType==='video'){
      const sourceFile=greenscreenFileRegistry.get(object.id)||object._greenscreenMediaSourceFile;
      const media=sourceFile?await sceneBlobToDataUrl(sourceFile):await sceneMediaToDataUrl(object.greenscreenMediaData||object.greenscreenMediaUrl||(object.greenscreenMediaElement&&object.greenscreenMediaElement.src));
      if(media){const assetId='greenscreen_video_'+String(object.id||embeddedVideoIds.size);target.type='greenscreen';target.id=object.id;target.greenscreenMediaType='video';target.greenscreenMediaName=(sourceFile&&sourceFile.name)||object.greenscreenMediaName||target.greenscreenMediaName;target.greenscreenMediaData=media;target.greenscreenMediaAssetId=assetId;target.greenscreenMediaEmbedded=true;data.mediaAssets.push({id:assetId,kind:'greenscreen-video',objectId:object.id,name:target.greenscreenMediaName,mimeType:(sourceFile&&sourceFile.type)||'',data:media});embeddedVideoIds.add(object.id);}
    }
    if(object.type==='audioSource'&&object.audioSourceType==='file'){
      const media=await sceneMediaToDataUrl(object.audioSourceData||object.audioSourceMediaUrl||(object.audioSourceElement&&object.audioSourceElement.src));
      if(media){target.audioSourceData=media;target.audioSourceEmbedded=true;}
    }
  }
  for(let i=0;i<data.timeline.audioClips.length;i++){
    const clip=timelineState.audioClips[i],target=data.timeline.audioClips[i];
    const objectData=clip&&clip.objectId&&exportedObjects.get(clip.objectId);
    const media=objectData&&objectData.audioSourceData||await sceneMediaToDataUrl(clip&&(clip.audioData||clip._objectUrl||(clip._element&&clip._element.src)));
    if(media){target.audioData=media;target.audioEmbedded=true;}
  }
  copyEmbeddedScreenVideoToTimeline(data,exportedObjects);
  for(const event of data.timeline.events||[]){for(const snapshot of sceneEventSnapshots(event)){const source=snapshot&&exportedObjects.get(snapshot.id);if(source&&source.screenMediaAssetId)snapshot.screenMediaAssetId=source.screenMediaAssetId;}}
  data.exportOptions.embeddedVideoCount=embeddedVideoIds.size;
  return data;
}
async function exportProject(download=true){
  try{
    const previousText=exportBtn.textContent;exportBtn.disabled=true;exportBtn.textContent='Projektordner wird erstellt …';
    if(download&&typeof window.showDirectoryPicker==='function'){
      await exportSceneProjectFolder();
      return;
    }
    const json=serializeScenePackage(await buildSceneExportPackage(true));
    if(!json)throw new Error('Das Scene-Paket konnte nicht serialisiert werden.');
    const outEl=document.getElementById('out'); if(outEl)outEl.value=json;
    if(download)downloadText('VSE_V2_Project_'+new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')+'.scene',json);
  }catch(error){
    console.error('Scene-Export fehlgeschlagen',error);
    alert('Scene-Export fehlgeschlagen: '+((error&&error.message)||error));
  }finally{
    exportBtn.disabled=false;exportBtn.textContent='Scene als Projektordner exportieren';
  }
}
exportBtn.onclick=()=>exportProject(true);
if(importBtn)importBtn.onclick=()=>importSceneProjectFolderFromPicker();
const importLegacyBtn=document.getElementById('importLegacyBtn');
if(importLegacyBtn)importLegacyBtn.onclick=()=>importFile&&importFile.click();
const saveProjectBtn=document.getElementById('saveProjectBtn');
let currentSceneProjectDirHandle=null;
let currentSceneProjectName='';
function updateSaveProjectButton(){
  if(!saveProjectBtn)return;
  saveProjectBtn.disabled=!currentSceneProjectDirHandle;
  saveProjectBtn.title=currentSceneProjectDirHandle?('Aktuelle Scene in '+(currentSceneProjectName||'den geladenen Projektordner')+' speichern'):'Erst einen Scene-Projektordner importieren oder exportieren.';
}
updateSaveProjectButton();

function safeSceneFilePart(value,fallback='medium'){
  const clean=String(value||fallback).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9._-]+/gi,'_').replace(/^[_\.]+|[_\.]+$/g,'');
  return (clean||fallback).slice(0,100);
}
function dataUrlInfo(value){
  const match=/^data:([^;,]+)?(?:;[^,]*)?;base64,(.*)$/s.exec(String(value||''));
  if(!match)return null;
  const binary=atob(match[2]),bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return {blob:new Blob([bytes],{type:match[1]||'application/octet-stream'}),mimeType:match[1]||'application/octet-stream'};
}
function sceneExtension(name,mimeType){
  const existing=/\.([a-z0-9]{1,8})$/i.exec(String(name||''));
  if(existing)return '.'+existing[1].toLowerCase();
  const known={'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp','image/gif':'.gif','video/mp4':'.mp4','video/webm':'.webm','audio/mpeg':'.mp3','audio/wav':'.wav','audio/ogg':'.ogg','audio/mp4':'.m4a'};
  return known[mimeType]||'.bin';
}
function sceneFileStem(name,fallback='medium'){
  return safeSceneFilePart(String(name||fallback).replace(/\.[a-z0-9]{1,8}$/i,'')||fallback,fallback);
}
function externalizeSceneMedia(data,initialFiles=[]){
  const files=[...initialFiles];let serial=files.filter(entry=>entry&&entry.blob).length;
  const mediaKey=/^(imageData|screenMediaData|screenTextBgImageData|particleImageData|imageAssetData|greenscreenMediaData|audioSourceData|audioData|data)$/;
  function walk(value,path=[]){
    if(!value||typeof value!=='object')return;
    for(const [key,current] of Object.entries(value)){
      const next=path.concat(key);
      if(typeof current==='string'&&current.startsWith('data:')&&mediaKey.test(key)){
        const info=dataUrlInfo(current);if(!info)continue;
        const owner=value,base=owner.screenMediaName||owner.greenscreenMediaName||owner.audioSourceName||owner.imageAssetName||owner.particleImageName||owner.imageName||owner.name||key;
        const filename=String(++serial).padStart(3,'0')+'_'+sceneFileStem(base)+sceneExtension(base,info.mimeType);
        files.push({path:'media/'+filename,targetPath:next,name:base,mimeType:info.mimeType,blob:info.blob});
        value[key]=null;
      }else walk(current,next);
    }
  }
  walk(data);
  data.format='scene-project-folder';
  data.version='198';
  data.mediaFiles=files.map(({blob,...entry})=>entry);
  data.exportOptions={...(data.exportOptions||{}),mediaEmbedded:false,mediaFolder:'media',mediaFileCount:files.filter(entry=>entry&&entry.blob).length,mediaReferenceCount:files.length};
  return files;
}
function liveSceneMediaFileForObject(object,kind){
  if(!object)return null;
  if(kind==='screen'){
    const registry=window.vseScreenMediaFileRegistry instanceof Map?window.vseScreenMediaFileRegistry:null;
    return (registry&&registry.get(object.id))||object._screenMediaSourceFile||null;
  }
  if(kind==='greenscreen'){
    const registry=window.vseGreenscreenMediaFileRegistry instanceof Map?window.vseGreenscreenMediaFileRegistry:null;
    return (registry&&registry.get(object.id))||object._greenscreenMediaSourceFile||null;
  }
  return null;
}
function collectDirectSceneMediaFiles(data){
  const files=[];
  const objectTargets=new Map((data.objects||[]).map((object,index)=>[object&&object.id,{object,index}]));
  function addFile(file,base,targetPath,applyTarget){
    if(!file||!targetPath)return;
    const mimeType=file.type||'application/octet-stream';
    const filename=String(files.filter(entry=>entry.blob).length+1).padStart(3,'0')+'_'+sceneFileStem(base||file.name||'medium')+sceneExtension(file.name||base,mimeType);
    const entry={path:'media/'+filename,targetPath,name:file.name||base||filename,mimeType,blob:file};
    files.push(entry);
    if(typeof applyTarget==='function')applyTarget();
    return entry;
  }
  function addFileReference(source,targetPath){
    if(!source||!targetPath)return;
    files.push({path:source.path,targetPath,name:source.name,mimeType:source.mimeType,blob:null});
  }
  function addTimelineScreenSnapshotReferences(source,object){
    for(const [eventIndex,event] of Object.entries((data.timeline&&data.timeline.events)||[])){
      const roots=event&&event.snapshot?[{snapshot:event.snapshot,path:['timeline','events',eventIndex,'snapshot']}]:[];
      while(roots.length){
        const current=roots.shift();
        const snapshot=current.snapshot;
        if(!snapshot||typeof snapshot!=='object')continue;
        if(snapshot.type==='screen'&&(snapshot.id===object.id||event.objectId===object.id)){
          snapshot.screenMediaType='video';
          snapshot.screenMode='video';
          snapshot.screenMediaName=source.name||object.screenMediaName||snapshot.screenMediaName;
          snapshot.screenMediaData=null;
          snapshot.screenMediaEmbedded=false;
          addFileReference(source,current.path.concat('screenMediaData'));
        }
        if(snapshot.type==='group'&&Array.isArray(snapshot.objects)){
          snapshot.objects.forEach((entry,index)=>{
            if(entry&&entry.snapshot)roots.push({snapshot:entry.snapshot,path:current.path.concat('objects',String(index),'snapshot')});
          });
        }
      }
    }
  }
  for(const object of objects||[]){
    if(!object||object.type!=='screen'||object.screenMediaType!=='video')continue;
    const target=objectTargets.get(object.id);
    const file=liveSceneMediaFileForObject(object,'screen');
    if(!target||!file)continue;
    const source=addFile(file,object.screenMediaName||file.name,['objects',target.index,'screenMediaData'],()=>{
      target.object.screenMediaType='video';
      target.object.screenMode='video';
      target.object.screenMediaName=file.name||object.screenMediaName||target.object.screenMediaName;
      target.object.screenMediaData=null;
      target.object.screenMediaEmbedded=false;
    });
    addTimelineScreenSnapshotReferences(source,object);
  }
  for(const object of objects||[]){
    if(!object||object.type!=='greenscreen'||object.greenscreenMediaType!=='video')continue;
    const target=objectTargets.get(object.id);
    const file=liveSceneMediaFileForObject(object,'greenscreen');
    if(!target||!file)continue;
    addFile(file,object.greenscreenMediaName||file.name,['objects',target.index,'greenscreenMediaData'],()=>{
      target.object.greenscreenMediaType='video';
      target.object.greenscreenMediaName=file.name||object.greenscreenMediaName||target.object.greenscreenMediaName;
      target.object.greenscreenMediaData=null;
      target.object.greenscreenMediaEmbedded=false;
    });
  }
  return files;
}
async function writeSceneFile(directory,name,content){
  const handle=await directory.getFileHandle(name,{create:true}),writer=await handle.createWritable();
  await writer.write(content);await writer.close();
}
async function writeSceneProjectToDirectory(projectDir){
  const mediaDir=await projectDir.getDirectoryHandle('media',{create:true});
  const data=await buildSceneExportPackage(false);
  const directFiles=collectDirectSceneMediaFiles(data);
  const files=externalizeSceneMedia(data,directFiles);
  const written=new Set();
  for(const entry of files){
    if(!entry.blob||written.has(entry.path))continue;
    await writeSceneFile(mediaDir,entry.path.slice(6),entry.blob);
    written.add(entry.path);
  }
  const json=serializeScenePackage(data);
  await writeSceneFile(projectDir,'scene.scene',json);
  const outEl=document.getElementById('out');if(outEl)outEl.value=json;
  return {files,mediaFileCount:files.filter(entry=>entry&&entry.blob).length};
}
async function exportSceneProjectFolder(){
  const root=await window.showDirectoryPicker({mode:'readwrite'});
  const stamp=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  const projectName='VSE_Project_'+stamp;
  const projectDir=await root.getDirectoryHandle(projectName,{create:true});
  const result=await writeSceneProjectToDirectory(projectDir);
  currentSceneProjectDirHandle=projectDir;
  currentSceneProjectName=projectName;
  updateSaveProjectButton();
  alert('Scene-Projekt „'+projectName+'“ wurde mit '+result.mediaFileCount+' Mediendatei(en) gespeichert.');
}
async function saveSceneProject(){
  if(!currentSceneProjectDirHandle){
    alert('Kein geladener Projektordner zum Speichern vorhanden. Bitte zuerst einen Scene-Projektordner importieren oder einmal exportieren.');
    return;
  }
  if(currentSceneProjectDirHandle.queryPermission&&currentSceneProjectDirHandle.requestPermission){
    let permission=await currentSceneProjectDirHandle.queryPermission({mode:'readwrite'});
    if(permission!=='granted')permission=await currentSceneProjectDirHandle.requestPermission({mode:'readwrite'});
    if(permission!=='granted')throw new Error('Keine Schreibberechtigung für den Projektordner.');
  }
  const previousText=saveProjectBtn&&saveProjectBtn.textContent;
  if(saveProjectBtn){saveProjectBtn.disabled=true;saveProjectBtn.textContent='Speichert …';}
  try{
    const result=await writeSceneProjectToDirectory(currentSceneProjectDirHandle);
    alert('Scene-Projekt „'+(currentSceneProjectName||'Projektordner')+'“ wurde gespeichert ('+result.mediaFileCount+' Mediendatei(en)).');
  }finally{
    if(saveProjectBtn){saveProjectBtn.disabled=false;saveProjectBtn.textContent=previousText||'Speichern';updateSaveProjectButton();}
  }
}
if(saveProjectBtn)saveProjectBtn.onclick=()=>saveSceneProject().catch(error=>{console.error('Speichern fehlgeschlagen',error);alert('Speichern fehlgeschlagen: '+((error&&error.message)||error));});
function setSceneValueAtPath(root,path,value){
  let target=root;
  for(let i=0;i<path.length-1;i++){if(target==null)return;target=target[path[i]];}
  if(target)target[path[path.length-1]]=value;
}
function sceneMediaEntryIsVideo(entry){
  return /^video\//i.test(String(entry&&entry.mimeType||''))||/\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(String(entry&&entry.name||entry&&entry.path||''));
}
function sceneMediaEntryTargetsScreen(entry){
  const path=entry&&entry.targetPath;
  return Array.isArray(path)&&path.length>=3&&path[0]==='objects'&&path[path.length-1]==='screenMediaData';
}
function scenePrepareExternalVideoTarget(data,entry){
  const path=entry&&entry.targetPath;
  if(!Array.isArray(path))return null;
  let target=data;
  for(let i=0;i<path.length-1;i++){if(target==null)return null;target=target[path[i]];}
  if(!target)return null;
  if(path[path.length-1]==='screenMediaData'){
    target.screenMediaType='video';
    target.screenMode='video';
    target.screenMediaName=entry.name||target.screenMediaName||'Video';
    target.screenMediaData=null;
    target.screenMediaEmbedded=false;
  }
  return target&&target.id;
}
function hydrateExternalizedScreenVideoSnapshots(data){
  const objectMedia=new Map((data.objects||[]).filter(object=>object&&object.type==='screen'&&object.screenMediaType==='video'&&object.screenMediaData).map(object=>[object.id,object]));
  for(const event of (data.timeline&&data.timeline.events)||[]){
    const roots=event&&event.snapshot?[event.snapshot]:[];
    while(roots.length){
      const snapshot=roots.shift();
      if(!snapshot||typeof snapshot!=='object')continue;
      const source=objectMedia.get(snapshot.id)||objectMedia.get(event.objectId);
      if(snapshot.type==='screen'&&source&&!snapshot.screenMediaData){
        snapshot.screenMediaType='video';
        snapshot.screenMode='video';
        snapshot.screenMediaName=source.screenMediaName||snapshot.screenMediaName;
        snapshot.screenMediaData=source.screenMediaData;
        snapshot.screenMediaEmbedded=true;
      }
      if(snapshot.type==='group'&&Array.isArray(snapshot.objects)){
        snapshot.objects.forEach(entry=>{if(entry&&entry.snapshot)roots.push(entry.snapshot);});
      }
    }
  }
}
function fileToSceneDataUrl(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error||new Error('Mediendatei konnte nicht gelesen werden.'));reader.readAsDataURL(file);});}
async function fileFromSceneDirectory(directory,relPath){
  const parts=String(relPath||'').replace(/^\.\//,'').split('/').filter(Boolean);
  if(!parts.length)throw new Error('Ungültiger Medienpfad.');
  let dir=directory;
  for(let i=0;i<parts.length-1;i++)dir=await dir.getDirectoryHandle(parts[i]);
  const handle=await dir.getFileHandle(parts[parts.length-1]);
  return handle.getFile();
}
async function importSceneProjectDirectoryHandle(directory){
  const sceneFile=await (await directory.getFileHandle('scene.scene')).getFile();
  const data=JSON.parse(await sceneFile.text());
  const mediaDataCache=new Map();
  const externalVideoRestores=[];
  for(const entry of Array.isArray(data.mediaFiles)?data.mediaFiles:[]){
    const relPath=String(entry.path||'').replace(/^\.\//,'');
    const file=await fileFromSceneDirectory(directory,relPath).catch(()=>null);
    if(!file)throw new Error('Mediendatei fehlt: '+entry.path);
    if(sceneMediaEntryIsVideo(entry)){
      const objectId=scenePrepareExternalVideoTarget(data,entry);
      if(sceneMediaEntryTargetsScreen(entry)&&objectId&&!externalVideoRestores.some(item=>item.objectId===objectId&&item.relPath===relPath))externalVideoRestores.push({objectId,relPath,file});
      continue;
    }
    if(!mediaDataCache.has(relPath))mediaDataCache.set(relPath,await fileToSceneDataUrl(file));
    setSceneValueAtPath(data,entry.targetPath,mediaDataCache.get(relPath));
  }
  importProjectData(data);
  for(const item of externalVideoRestores){
    const screen=objects.find(object=>object&&object.id===item.objectId&&object.type==='screen');
    if(screen&&typeof loadScreenMedia==='function')loadScreenMedia(screen,item.file,'video');
  }
  currentSceneProjectDirHandle=directory;
  currentSceneProjectName=directory.name||'Projektordner';
  updateSaveProjectButton();
  if(typeof syncObjectIconColor==='function')syncObjectIconColor();
}
async function importSceneProjectFolderFromPicker(){
  if(typeof window.showDirectoryPicker!=='function'){
    if(importProjectFolder)importProjectFolder.click();
    return;
  }
  try{
    const directory=await window.showDirectoryPicker({mode:'readwrite'});
    await importSceneProjectDirectoryHandle(directory);
  }catch(error){
    if(error&&error.name==='AbortError')return;
    console.error(error);
    alert('Projektordner-Import fehlgeschlagen: '+((error&&error.message)||error));
  }
}
async function importSceneProjectFiles(fileList){
  const files=Array.from(fileList||[]),sceneFile=files.find(file=>/(^|\/)scene\.scene$/i.test(file.webkitRelativePath||file.name))||files.find(file=>/\.scene$/i.test(file.name));
  if(!sceneFile)throw new Error('Im Projektordner wurde keine scene.scene gefunden.');
  const data=JSON.parse(await sceneFile.text());
  const byRelativePath=new Map(files.map(file=>{const rel=String(file.webkitRelativePath||file.name).replace(/\\/g,'/');return [rel.replace(/^[^/]+\//,''),file];}));
  const mediaDataCache=new Map();
  const externalVideoRestores=[];
  for(const entry of Array.isArray(data.mediaFiles)?data.mediaFiles:[]){
    const relPath=String(entry.path||'').replace(/^\.\//,'');
    const file=byRelativePath.get(relPath);
    if(!file)throw new Error('Mediendatei fehlt: '+entry.path);
    if(sceneMediaEntryIsVideo(entry)){
      const objectId=scenePrepareExternalVideoTarget(data,entry);
      if(sceneMediaEntryTargetsScreen(entry)&&objectId&&!externalVideoRestores.some(item=>item.objectId===objectId&&item.relPath===relPath))externalVideoRestores.push({objectId,relPath,file});
      continue;
    }
    if(!mediaDataCache.has(relPath))mediaDataCache.set(relPath,await fileToSceneDataUrl(file));
    setSceneValueAtPath(data,entry.targetPath,mediaDataCache.get(relPath));
  }
  importProjectData(data);
  for(const item of externalVideoRestores){
    const screen=objects.find(object=>object&&object.id===item.objectId&&object.type==='screen');
    if(screen&&typeof loadScreenMedia==='function')loadScreenMedia(screen,item.file,'video');
  }
  currentSceneProjectDirHandle=null;
  currentSceneProjectName='';
  updateSaveProjectButton();
  if(typeof syncObjectIconColor==='function')syncObjectIconColor();
}
function applyBackgroundFromData(data){
  Object.assign(background,{layer:0,color:'#05070c',mode:'cover',opacity:1,zoom:1,imageName:null,imageData:null},data||{});
  if(!['cover','contain','stretch'].includes(background.mode))background.mode='cover';
  if(bgTex){try{gl.deleteTexture(bgTex);}catch(e){}} bgTex=null; bgImageSize=[0,0]; bgImageData=null;
  if(background.imageData){
    const img=new Image();
    img.onload=()=>{makeBgTexture(img);bgImageData=background.imageData;if(typeof applyBackgroundSizeToStage==='function')applyBackgroundSizeToStage(img);};
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
  }else if(o.screenMediaType==='video'&&o.screenMediaData){
    const tex=initTexture(),video=document.createElement('video');o.screenTexture=tex;o.screenMediaElement=video;o.screenMediaEmbedded=true;
    video.preload='auto';video.autoplay=true;video.loop=true;video.muted=!!o.screenVideoMuted;video.playsInline=true;video.src=o.screenMediaData;
    video.onloadedmetadata=()=>{o.screenMediaAspect=(video.videoWidth||16)/Math.max(1,video.videoHeight||9);video.play().catch(()=>{});};video.load();
  }else if(o.screenMediaType==='video'){
    o.screenMediaData=null; o.screenMediaEmbedded=false; o.screenTexture=null; o.screenMediaElement=null; o.screenMediaUrl='';
  }
}

async function sceneDataUrlToFile(data,name){
  const response=await fetch(data),blob=await response.blob();
  return new File([blob],name||'eingebettetes-medium',{type:blob.type||'application/octet-stream'});
}
async function restoreEmbeddedProjectMedia(data){
  try{
    const mediaAssets=new Map((Array.isArray(data&&data.mediaAssets)?data.mediaAssets:[]).filter(asset=>asset&&asset.id&&asset.data).map(asset=>[asset.id,asset]));
    for(const object of objects||[]){
      const screenAsset=mediaAssets.get(object.screenMediaAssetId)||[...mediaAssets.values()].find(asset=>asset.kind==='screen-video'&&asset.objectId===object.id);
      if(object.type==='screen'&&screenAsset){object.screenMediaType='video';object.screenMode='video';object.screenMediaName=screenAsset.name||object.screenMediaName;object.screenMediaData=screenAsset.data;object.screenMediaEmbedded=true;restoreScreenImage(object);}
      const greenscreenAsset=mediaAssets.get(object.greenscreenMediaAssetId)||[...mediaAssets.values()].find(asset=>asset.kind==='greenscreen-video'&&asset.objectId===object.id);
      if(object.type==='greenscreen'&&greenscreenAsset){object.greenscreenMediaType='video';object.greenscreenMediaName=greenscreenAsset.name||object.greenscreenMediaName;object.greenscreenMediaData=greenscreenAsset.data;object.greenscreenMediaEmbedded=true;}
      if(object.type==='audioSource'&&object.audioSourceData)loadAudioSourceFile(object,await sceneDataUrlToFile(object.audioSourceData,object.audioSourceName||'Audio'));
      if(object.type==='greenscreen'&&object.greenscreenMediaData)loadGreenscreenVideo(object,await sceneDataUrlToFile(object.greenscreenMediaData,object.greenscreenMediaName||'Video'));
    }
    for(const clip of timelineState.audioClips||[]){
      if(!clip||!clip.audioData)continue;
      const audioObject=clip.objectId&&objects.find(object=>object.id===clip.objectId&&object.type==='audioSource');
      if(audioObject&&audioObject.audioSourceElement){clip._element=audioObject.audioSourceElement;clip._objectUrl='';}
      else if(typeof window.vseCreateTimelineAudioRuntime==='function'){
        const savedDuration=Number(clip.duration)||0;
        await window.vseCreateTimelineAudioRuntime(await sceneDataUrlToFile(clip.audioData,clip.name||'Timeline-Audio'),clip);
        if(savedDuration>0)clip.duration=savedDuration;
      }
    }
    updateTimelineUI();
  }catch(error){console.error('Eingebettete Medien konnten nicht vollständig wiederhergestellt werden.',error);}
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
  if(!['cover','contain','stretch'].includes(background.mode))background.mode='cover';
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
function drawCurrentStageCaptureToCanvas(target,rectCss){
  const r={width:canvas.clientWidth,height:canvas.clientHeight};
  const px=Math.max(0,rectCss.x/r.width*canvas.width);
  const py=Math.max(0,rectCss.y/r.height*canvas.height);
  const pw=Math.max(1,rectCss.w/r.width*canvas.width);
  const ph=Math.max(1,rectCss.h/r.height*canvas.height);
  target.width=Math.max(1,Math.round(pw));
  target.height=Math.max(1,Math.round(ph));
  const ctx=target.getContext('2d');
  ctx.clearRect(0,0,target.width,target.height);
  if(typeof updateVseFrame==='function'&&typeof renderNormalFrame==='function'){
    const wasGrid=scene.showGrid;
    scene.showGrid=false;
    try{
      const ordered=updateVseFrame();
      renderNormalFrame(ordered);
    }finally{
      scene.showGrid=wasGrid;
    }
  }
  ctx.drawImage(canvas,px,py,pw,ph,0,0,target.width,target.height);
}
function maskCaptureCanvas(target,shape,rectCss){
  const assetPts=(rectCss.points||[]).map(p=>({x:(p.x-rectCss.x)/Math.max(1,rectCss.w)*target.width,y:(p.y-rectCss.y)/Math.max(1,rectCss.h)*target.height}));
  const ctx=target.getContext('2d');
  if(shape==='path'){
    applyFreehandAlphaMask(target,assetPts,false);
  }else{
    ctx.globalCompositeOperation='destination-in';
    traceBgCaptureMaskPath(ctx,shape,0,0,target.width,target.height,assetPts);
    ctx.fill();
    ctx.globalCompositeOperation='source-over';
  }
}
async function createImageAssetFromBackgroundRect(rectCss){
  if(!rectCss||rectCss.w<4||rectCss.h<4)return;
  const data=background.imageData||bgImageData;
  const shape=rectCss.shape||'rect';
  const source=getBgCaptureSource();
  const removeFromBackground=getBgCaptureRemoveFromBackground();
  if(source==='background'&&!data){alert('Es ist kein Hintergrundbild geladen.');return;}
  if(removeFromBackground&&!data){alert('Zum Entfernen aus dem Hintergrund muss ein Hintergrundbild geladen sein.');return;}
  const previousBg={background:{...background},bgImageData:bgImageData,bgImageSize:[...bgImageSize]};
  const r={width:canvas.clientWidth,height:canvas.clientHeight};
  const sx=rectCss.x/r.width*stageState.w;
  const sy=rectCss.y/r.height*stageState.h;
  const sw=rectCss.w/r.width*stageState.w;
  const sh=rectCss.h/r.height*stageState.h;
  const displayScale=Math.max(0.0001,stageScale());
  const assetStageW=rectCss.w/displayScale;
  const assetStageH=rectCss.h/displayScale;
  const off=document.createElement('canvas');
  let img=null,d=null;
  if(source==='stage'){
    drawCurrentStageCaptureToCanvas(off,rectCss);
  }else{
    img=await loadHtmlImage(data);
    off.width=Math.max(1,Math.round(sw));
    off.height=Math.max(1,Math.round(sh));
    const ctx=off.getContext('2d');
    ctx.clearRect(0,0,off.width,off.height);
    d=getBackgroundDrawRectStage(img.naturalWidth||img.width,img.naturalHeight||img.height);
    ctx.drawImage(img,d.dx-sx,d.dy-sy,d.dw,d.dh);
  }
  maskCaptureCanvas(off,shape,rectCss);
  const outData=off.toDataURL('image/png');
  const o=newObj('imageAsset',(rectCss.x+rectCss.w*0.5)/r.width*100,(rectCss.y+rectCss.h*0.5)/r.height*100);
  const suffix=shape==='circle'?'Kreis':shape==='path'?'Pfad':'Ausschnitt';
  o.name=(source==='stage'?'Buehne_':'Hintergrund_')+suffix+'_'+id;
  o.imageAssetWidth=assetStageW;
  o.imageAssetHeight=assetStageH;
  o.imageAssetKeepAspect=true;
  o.imageAssetOpacity=1;
  o.layer=1;
  o._imageAssetSized=true;
  objects.push(o);
  loadImageAssetFromData(o,outData,(source==='stage'?'Buehne_':'Hintergrund_')+suffix+'.png');
  if(removeFromBackground){
    if(!img)img=await loadHtmlImage(data);
    if(!d)d=getBackgroundDrawRectStage(img.naturalWidth||img.width,img.naturalHeight||img.height);
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
    const sourceLabel=source==='stage'?'Bühnenausschnitt mit Objekten':'Hintergrund-Ausschnitt';
    bgToImageAssetStatus.textContent=sourceLabel+' als ImageAsset erzeugt'+action+'.';
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
  r.onload=()=>{try{importProjectData(JSON.parse(r.result));currentSceneProjectDirHandle=null;currentSceneProjectName='';updateSaveProjectButton();if(typeof syncObjectIconColor==='function')syncObjectIconColor();}catch(err){alert('Import fehlgeschlagen: '+err.message);}};
  r.readAsText(f); importFile.value='';
});
const importProjectFolder=document.getElementById('importProjectFolder');
if(importProjectFolder)importProjectFolder.addEventListener('change',async()=>{
  try{await importSceneProjectFiles(importProjectFolder.files);}catch(err){console.error(err);alert('Projektordner-Import fehlgeschlagen: '+err.message);}finally{importProjectFolder.value='';}
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
if(timelineDurationInput)timelineDurationInput.addEventListener('input',()=>{timelineState.manualDuration=true;timelineState.duration=Math.max(1,Number(timelineDurationInput.value)||180);updateTimelineUI();setTimelineEventForm(selectedTimelineEvent());});
if(timelineUseMediaDurationBtn)timelineUseMediaDurationBtn.onclick=()=>{const d=getTimelineMediaDuration();timelineState.manualDuration=false;timelineState.duration=Math.max(180,Math.ceil(d||0));updateTimelineUI();setTimelineEventForm(selectedTimelineEvent());};
if(timelineUseSelectedObjectBtn)timelineUseSelectedObjectBtn.onclick=()=>{const value=timelineCurrentSelectionValue();if(value&&timelineEventObject){updateTimelineObjectOptions();timelineEventObject.value=value;}};
if(timelineAddEventBtn)timelineAddEventBtn.onclick=addOrUpdateTimelineEvent;
if(timelineDeleteEventBtn)timelineDeleteEventBtn.onclick=deleteTimelineEvent;
[timelineEventTime,timelineEventDuration].forEach(el=>{if(el)el.addEventListener('input',()=>{if(timelineEventTimeValue)timelineEventTimeValue.textContent=formatTimelineTime(Number(timelineEventTime.value)||0);if(timelineEventDurationValue)timelineEventDurationValue.textContent=Number(timelineEventDuration.value||0).toFixed(2)+' s';});});
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
