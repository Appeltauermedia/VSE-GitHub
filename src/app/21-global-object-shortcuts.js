/* ===== Globale Objektbefehle und interne Zwischenablage ===== */
(()=>{
  let clipboard=null;
  let clipboardKind='objects';
  let cameraClipboard=null;
  let pasteCount=0;

  function activeObjects(){
    const selection=getSelectedObjects();
    return selection.length?selection:(selected&&objects.includes(selected)?[selected]:[]);
  }

  function commitHistory(){
    if(window.vseHistory&&typeof window.vseHistory.commit==='function')window.vseHistory.commit();
  }

  function refreshSelection(){
    selectSingleCore(selected);
    if(groupNameInput&&selected)groupNameInput.value=selected.groupName||'';
    syncLightUI();
    updateHud();
    updateObjectManager();
    if(typeof updateTimelineObjectOptions==='function')updateTimelineObjectOptions();
  }

  function copyObjects(){
    const source=activeObjects();
    if(!source.length)return false;
    const sourceGroupIds=[...new Set(source.map(object=>object.groupId).filter(Boolean))];
    clipboard={
      objects:JSON.parse(JSON.stringify(source.map(cleanObjectForObjectExport))),
      groups:JSON.parse(JSON.stringify(groups.filter(group=>sourceGroupIds.includes(group.id))))
    };
    pasteCount=0;
    clipboardKind='objects';
    return true;
  }

  function activeCameraMove(){
    const moveId=timelineState&&timelineState.selectedCameraMoveId;
    return moveId&&(timelineState.events||[]).find(event=>event&&event.id===moveId&&event.timelineAssetKind==='camera')||null;
  }

  function copyCameraMove(){
    const move=activeCameraMove();
    if(!move)return false;
    cameraClipboard=JSON.parse(JSON.stringify(move));
    clipboardKind='camera';pasteCount=0;
    return true;
  }

  function pasteCameraMove(){
    if(!cameraClipboard)return false;
    pasteCount+=1;
    const move=JSON.parse(JSON.stringify(cameraClipboard));
    move.id='camera_'+Date.now().toString(36)+'_'+Math.floor(Math.random()*99999);
    const sourceDuration=Math.max(.1,Number(cameraClipboard.duration)||.1);
    move.time=Math.max(0,(Number(cameraClipboard.time)||0)+pasteCount*sourceDuration);
    move.enabled=true;
    timelineState.events.push(move);
    timelineState.selectedCameraMoveId=move.id;
    timelineState.duration=Math.max(Number(timelineState.duration)||0,move.time+Math.max(.1,Number(move.duration)||.1));
    updateTimelineUI();
    if(window.vseCameraTimeline&&window.vseCameraTimeline.openMove)window.vseCameraTimeline.openMove(move);
    commitHistory();
    return true;
  }

  function cutCameraMove(){
    const move=activeCameraMove();
    if(!move||!copyCameraMove())return false;
    return deleteCameraMove();
  }

  function deleteCameraMove(){
    const move=activeCameraMove();
    if(!move)return false;
    timelineState.events=timelineState.events.filter(event=>event.id!==move.id);
    timelineState.selectedCameraMoveId='';
    if(window.vseCameraTimeline&&window.vseCameraTimeline.close)window.vseCameraTimeline.close();
    updateTimelineUI();if(window.vseCameraTimeline&&window.vseCameraTimeline.afterDelete)window.vseCameraTimeline.afterDelete();commitHistory();
    return true;
  }

  function cameraScopeActive(){return window.vseActiveClipboardScope==='camera'&&!!activeCameraMove();}
  function copyActive(){return cameraScopeActive()?copyCameraMove():copyObjects();}
  function cutActive(){return cameraScopeActive()?cutCameraMove():cutObjects();}
  function pasteActive(){return clipboardKind==='camera'?pasteCameraMove():pasteObjects();}
  function duplicateActive(){
    if(cameraScopeActive())return copyCameraMove()&&pasteCameraMove();
    return copyObjects()&&pasteObjects();
  }

  function restorePastedMedia(object){
    if(object.type==='screen'){
      restoreScreenImage(object);
      restoreScreenTextBackgroundImage(object);
    }
    if(object.type==='particle'||object.type==='imageParticle')restoreParticleImage(object);
    if(object.type==='imageAsset'&&object.imageAssetData){
      loadImageAssetFromData(object,object.imageAssetData,object.imageAssetName||'ImageAsset');
    }
    if(object.type==='audioSource'){
      object.audioSourceElement=null;object.audioSourceNode=null;object.audioSourceGain=null;
      object.audioSourceAnalyserTap=null;object.audioSourcePan=null;object.audioSourceMediaUrl='';
      object.audioSourcePlaying=false;
    }
    if(object.type==='greenscreen'){
      object.greenscreenTexture=null;object.greenscreenMediaElement=null;
      object.greenscreenMediaUrl='';object.greenscreenStream=null;
    }
  }

  function pasteObjects(){
    if(!clipboard||!clipboard.objects.length)return false;
    pasteCount+=1;
    const offset=3*pasteCount;
    const groupedCounts=new Map();
    clipboard.objects.forEach(object=>{
      if(object.groupId)groupedCounts.set(object.groupId,(groupedCounts.get(object.groupId)||0)+1);
    });
    const groupMap=new Map();
    for(const sourceGroup of clipboard.groups){
      if((groupedCounts.get(sourceGroup.id)||0)<2)continue;
      const groupId='grp_'+id++;
      const name=(sourceGroup.name||'Gruppe')+'_copy';
      groupMap.set(sourceGroup.id,{id:groupId,name});
      groups.push({id:groupId,name});
    }

    selectedIds.clear();
    for(const source of clipboard.objects){
      const object=ensureTypeDefaults(JSON.parse(JSON.stringify(source)));
      object.id='obj_'+id++;
      object.name=(source.name||source.type||'Objekt')+'_copy';
      object.x=Number(source.x||0)+offset;
      object.y=Number(source.y||0)+offset;
      const mappedGroup=source.groupId&&groupMap.get(source.groupId);
      if(mappedGroup){object.groupId=mappedGroup.id;object.groupName=mappedGroup.name;}
      else{delete object.groupId;delete object.groupName;}
      restorePastedMedia(object);
      objects.push(object);
      selectedIds.add(object.id);
      selected=object;
    }
    refreshSelection();
    commitHistory();
    return true;
  }

  function cutObjects(){
    if(!copyObjects())return false;
    deleteSelectedObject();
    commitHistory();
    return true;
  }

  function selectAllObjects(){
    if(!objects.length)return false;
    selectedIds.clear();
    objects.forEach(object=>selectedIds.add(object.id));
    selected=objects[objects.length-1]||null;
    refreshSelection();
    return true;
  }

  function groupObjects(){
    if(activeObjects().length<2)return false;
    createGroup();
    groups=groups.filter(group=>objects.some(object=>object.groupId===group.id));
    updateObjectManager();
    commitHistory();
    return true;
  }

  function ungroupObjects(){
    const hasGroup=activeObjects().some(object=>object.groupId)||(selected&&selected.groupId);
    if(!hasGroup)return false;
    dissolveGroup();
    commitHistory();
    return true;
  }

  document.addEventListener('keydown',event=>{
    if((event.key!=='Delete'&&event.key!=='Del')||isTypingTarget(event.target))return;
    if(activeCameraMove()){
      event.preventDefault();event.stopImmediatePropagation();deleteCameraMove();return;
    }
    const markedTimelineElement=document.querySelector('#timelineDock .timelineAudioClip.isSelected,#timelineDock .timelineScreenClip.isSelected,#timelineDock .timelineEvent.isSelected');
    const timelineAssetSelected=timelineState&&(timelineState.selectedEventId||timelineState.selectedAudioClipId)&&(timelineState.selected===true||!!markedTimelineElement);
    if(timelineAssetSelected&&typeof window.deleteSelectedTimelineAsset==='function'){
      event.preventDefault();event.stopImmediatePropagation();window.deleteSelectedTimelineAsset();commitHistory();
    }
  },true);

  document.addEventListener('keydown',event=>{
    if(!(event.ctrlKey||event.metaKey)||event.altKey||event.shiftKey||isTypingTarget(event.target))return;
    const key=String(event.key).toLowerCase();
    const commands={g:groupObjects,u:ungroupObjects,c:copyActive,x:cutActive,v:pasteActive,d:duplicateActive,a:selectAllObjects};
    const command=commands[key];
    if(!command)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    command();
  },true);

  window.vseObjectClipboard={copy:copyActive,cut:cutActive,paste:pasteActive,selectAll:selectAllObjects,deleteCameraMove};
})();
