/* ===== Globaler Undo-/Redo-Verlauf ===== */
(()=>{
  const MAX_HISTORY=50;
  const undoStack=[];
  const redoStack=[];
  let commitTimer=0;
  let deferredCommitTimer=0;
  let restoring=false;

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
    const data=JSON.parse(JSON.stringify(projectPackage()));
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
    if(current&&current.signature===next.signature)return;
    undoStack.push(next);
    if(undoStack.length>MAX_HISTORY)undoStack.shift();
    redoStack.length=0;
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
      importProjectData(JSON.parse(JSON.stringify(entry.data)),{preserveLocalColors:false,preserveRuntimeMedia:true});
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
    }finally{
      restoring=false;
    }
  }

  function undo(){
    if(commitTimer||deferredCommitTimer)commit();
    if(undoStack.length<2)return;
    redoStack.push(undoStack.pop());
    restore(undoStack[undoStack.length-1]);
  }

  function redo(){
    clearTimeout(commitTimer);commitTimer=0;clearTimeout(deferredCommitTimer);deferredCommitTimer=0;
    const entry=redoStack.pop();
    if(!entry)return;
    undoStack.push(entry);
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
