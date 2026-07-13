/* ===== Globaler Undo-/Redo-Verlauf ===== */
(()=>{
  const MAX_HISTORY=50;
  const undoStack=[];
  const redoStack=[];
  let commitTimer=0;
  let deferredCommitTimer=0;
  let restoring=false;
  const heavyMediaKeys=new Set(['imageData','screenMediaData','screenTextBgImageData','particleImageData','imageAssetData','greenscreenMediaData','audioSourceData','audioData','data']);
  const mediaCache=new Map();

  function mediaHash(value){
    let h=2166136261;
    for(let i=0;i<value.length;i++){
      h^=value.charCodeAt(i);
      h=Math.imul(h,16777619);
    }
    return (h>>>0).toString(36);
  }
  function rememberMedia(value){
    const ref='media_'+value.length+'_'+mediaHash(value);
    if(!mediaCache.has(ref))mediaCache.set(ref,value);
    return ref;
  }
  function cloneCompactMedia(value,key=''){
    if(!value||typeof value!=='object')return value;
    if(Array.isArray(value))return value.map(item=>cloneCompactMedia(item));
    const copy={};
    for(const [childKey,item] of Object.entries(value)){
      if(heavyMediaKeys.has(childKey)&&typeof item==='string'&&item.length>256){
        copy[childKey]=null;
        copy[childKey+'Ref']=rememberMedia(item);
      }else{
        copy[childKey]=cloneCompactMedia(item,childKey);
      }
    }
    return copy;
  }
  function restoreMediaRefs(value){
    if(!value||typeof value!=='object')return value;
    if(Array.isArray(value)){
      value.forEach(restoreMediaRefs);
      return value;
    }
    for(const [key,item] of Object.entries(value)){
      if(key.endsWith('Ref')&&typeof item==='string'&&mediaCache.has(item)){
        const mediaKey=key.slice(0,-3);
        if(heavyMediaKeys.has(mediaKey)){
          value[mediaKey]=mediaCache.get(item);
          delete value[key];
        }
      }else if(item&&typeof item==='object'){
        restoreMediaRefs(item);
      }
    }
    return value;
  }
  function collectMediaRefs(value,refs){
    if(!value||typeof value!=='object')return;
    if(Array.isArray(value)){value.forEach(item=>collectMediaRefs(item,refs));return;}
    for(const [key,item] of Object.entries(value)){
      if(key.endsWith('Ref')&&typeof item==='string')refs.add(item);
      else if(item&&typeof item==='object')collectMediaRefs(item,refs);
    }
  }
  function pruneMediaCache(){
    const refs=new Set();
    undoStack.forEach(entry=>collectMediaRefs(entry&&entry.data,refs));
    redoStack.forEach(entry=>collectMediaRefs(entry&&entry.data,refs));
    for(const ref of mediaCache.keys())if(!refs.has(ref))mediaCache.delete(ref);
  }

  const runtimeKeys=['screenTexture','screenMediaElement','screenMediaUrl','screenCaptureStream','imageAssetTexture','imageAssetElement','imageAssetUrl','particleTexture','particleImageElement','particleImageUrl','audioSourceElement','audioSourceNode','audioSourceGain','audioSourceAnalyserTap','audioSourcePan','audioSourceMediaUrl','greenscreenTexture','greenscreenMediaElement','greenscreenMediaUrl','greenscreenStream'];
  function captureObjectRuntime(){
    const map=new Map();
    for(const object of objects||[]){
      const runtime={};let found=false;
      for(const key of runtimeKeys){if(object[key]!=null&&object[key]!==''){runtime[key]=object[key];found=true;}}
      if(found)map.set(object.id,runtime);
    }
    return map;
  }
  function cleanAudioClip(clip){return {id:clip.id,name:clip.name,start:Number(clip.start)||0,duration:Number(clip.duration)||0,audioOffset:Number(clip.audioOffset)||0,audioSourceDuration:Number(clip.audioSourceDuration)||0,active:clip.active!==false,objectId:clip.objectId||'',sendToBackbone:!!clip.sendToBackbone};}
  function captureAudioRuntime(){
    const map=new Map();
    for(const clip of timelineState.audioClips||[])map.set(clip.id,{_element:clip._element,_sourceNode:clip._sourceNode,_gainNode:clip._gainNode,_objectUrl:clip._objectUrl});
    return map;
  }

  function snapshot(){
    const data=cloneCompactMedia(projectPackage());
    const audioClips=(timelineState.audioClips||[]).map(cleanAudioClip);
    return {
      data,
      signature:JSON.stringify({data,audioClips}),
      selectedIds:Array.from(selectedIds||[]),
      selectedId:selected&&selected.id||null,
      selectedEventId:timelineState.selectedEventId||null,
      selectedAudioClipId:timelineState.selectedAudioClipId||null,
      selectedCameraMoveId:timelineState.selectedCameraMoveId||null,
      objectRuntime:captureObjectRuntime(),
      audioClips,
      audioRuntime:captureAudioRuntime()
    };
  }

  function commit(){
    clearTimeout(commitTimer);commitTimer=0;clearTimeout(deferredCommitTimer);deferredCommitTimer=0;
    if(restoring)return;
    const next=snapshot();
    const current=undoStack[undoStack.length-1];
    if(current&&current.signature===next.signature){pruneMediaCache();return;}
    undoStack.push(next);
    if(undoStack.length>MAX_HISTORY)undoStack.shift();
    redoStack.length=0;
    pruneMediaCache();
  }

  function scheduleCommit(delay=0){
    if(restoring)return;
    clearTimeout(commitTimer);
    commitTimer=setTimeout(commit,delay);
  }

  function scheduleAsyncCommit(){
    clearTimeout(deferredCommitTimer);
    deferredCommitTimer=setTimeout(()=>{
      deferredCommitTimer=0;
      commit();
    },800);
  }

  function restore(entry){
    restoring=true;
    try{
      if(typeof window.vseCloseColorControls==='function')window.vseCloseColorControls();
      importProjectData(restoreMediaRefs(JSON.parse(JSON.stringify(entry.data))),{preserveLocalColors:false,preserveRuntimeMedia:true});
      for(const object of objects||[]){const runtime=entry.objectRuntime&&entry.objectRuntime.get(object.id);if(runtime)Object.assign(object,runtime);}
      timelineState.audioClips=(entry.audioClips||[]).map(clip=>Object.assign({...clip},entry.audioRuntime&&entry.audioRuntime.get(clip.id)||{}));
      timelineState.selectedEventId=entry.selectedEventId;
      timelineState.selectedAudioClipId=entry.selectedAudioClipId;
      timelineState.selectedCameraMoveId=entry.selectedCameraMoveId;
      selectedIds.clear();
      entry.selectedIds.forEach(objectId=>{
        if(objects.some(object=>object.id===objectId))selectedIds.add(objectId);
      });
      selected=objects.find(object=>object.id===entry.selectedId)
        ||objects.find(object=>selectedIds.has(object.id))||null;
      if(selected&&!selectedIds.size)selectedIds.add(selected.id);
      selectSingleCore(selected);
      updateTimelineUI();
      updateHud();
      updateObjectManager();
      if(typeof window.vseRefreshColorControls==='function')window.vseRefreshColorControls();
    }finally{
      restoring=false;
    }
  }

  function undo(){
    if(commitTimer||deferredCommitTimer)commit();
    if(undoStack.length<2)return;
    redoStack.push(undoStack.pop());
    pruneMediaCache();
    restore(undoStack[undoStack.length-1]);
  }

  function redo(){
    clearTimeout(commitTimer);commitTimer=0;clearTimeout(deferredCommitTimer);deferredCommitTimer=0;
    const entry=redoStack.pop();
    if(!entry)return;
    undoStack.push(entry);
    pruneMediaCache();
    restore(entry);
  }

  document.addEventListener('keydown',event=>{
    if(!(event.ctrlKey||event.metaKey)||event.altKey||String(event.key).toLowerCase()!=='z')return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if(event.shiftKey)redo();else undo();
  },true);

  // UI-Aktionen laufen zuerst in ihren bestehenden Handlern; anschließend wird
  // der neue Projektzustand erfasst. Regler- und Texteingaben werden gebündelt.
  document.addEventListener('input',()=>scheduleCommit(250));
  document.addEventListener('change',()=>{scheduleCommit();scheduleAsyncCommit();});
  document.addEventListener('click',()=>scheduleCommit());
  document.addEventListener('drop',()=>{scheduleCommit(50);scheduleAsyncCommit();});
  document.addEventListener('pointerup',()=>{scheduleCommit();scheduleAsyncCommit();});
  document.addEventListener('pointercancel',()=>scheduleCommit());
  document.addEventListener('wheel',()=>scheduleCommit(150),{passive:true});

  commit();
  window.vseHistory={undo,redo,commit,canUndo:()=>undoStack.length>1,canRedo:()=>redoStack.length>0};
})();
