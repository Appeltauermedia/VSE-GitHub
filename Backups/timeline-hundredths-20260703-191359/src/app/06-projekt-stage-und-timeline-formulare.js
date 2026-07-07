/* ===== Projekt-, Stage- und Timeline-Formulare ===== */
function updateScreenSizeSliderLimits(){
  const maxW=Math.max(40,Math.round(Number(scene.stageWidth||stageState.w||1920)));
  const maxH=Math.max(20,Math.round(Number(scene.stageHeight||stageState.h||1080)));
  if(fields&&fields.ScreenWidth){
    fields.ScreenWidth.max=String(maxW);
    const wrap=fields.ScreenWidth.closest('.range-with-number');
    const num=wrap?wrap.querySelector('.range-number'):null;
    if(num)num.max=String(maxW);
  }
  if(fields&&fields.ScreenHeight){
    fields.ScreenHeight.max=String(maxH);
    const wrap=fields.ScreenHeight.closest('.range-with-number');
    const num=wrap?wrap.querySelector('.range-number'):null;
    if(num)num.max=String(maxH);
  }
}
function setStageResolution(w,h){
  w=Math.max(320,Math.min(7680,Math.round(Number(w)||1920)));
  h=Math.max(180,Math.min(4320,Math.round(Number(h)||1080)));
  stageState.w=w; stageState.h=h;
  scene.stageWidth=w; scene.stageHeight=h;
  if(stageWidthInput)stageWidthInput.value=w;
  if(stageHeightInput)stageHeightInput.value=h;
  if(stagePreset){
    const v=w+'x'+h;
    stagePreset.value=[...stagePreset.options].some(o=>o.value===v)?v:'custom';
  }
  updateScreenSizeSliderLimits();
  requestAnimationFrame(resize);
}
function setMenuMode(hidden){
  scene.uiHidden=!!hidden;
  document.body.classList.toggle('menuless',scene.uiHidden);
  requestAnimationFrame(resize);
}
function normalizeHexColor(value,fallback='#eef6ff'){
  const raw=String(value||'').trim();
  if(/^#[0-9a-f]{6}$/i.test(raw))return raw.toLowerCase();
  if(/^#[0-9a-f]{3}$/i.test(raw))return ('#'+raw.slice(1).split('').map(c=>c+c).join('')).toLowerCase();
  return fallback;
}
function syncObjectIconColor(){
  scene.objectIconColor=normalizeHexColor(scene.objectIconColor);
  document.documentElement.style.setProperty('--object-icon-color',scene.objectIconColor);
  if(objectIconColor)objectIconColor.value=scene.objectIconColor;
}
if(objectIconColor)objectIconColor.addEventListener('input',()=>{
  scene.objectIconColor=normalizeHexColor(objectIconColor.value);
  syncObjectIconColor();
});
if(resetObjectIconColorBtn)resetObjectIconColorBtn.addEventListener('click',()=>{
  scene.objectIconColor='#eef6ff';
  syncObjectIconColor();
});
syncObjectIconColor();
function syncVrViewerUi(){
  scene.vrSceneScale=Math.max(0.5,Math.min(2.5,Number(scene.vrSceneScale??1)));
  scene.vrSceneDistance=Math.max(1.2,Math.min(6,Number(scene.vrSceneDistance??3)));
  scene.vrScreenCurvature=Math.max(0,Math.min(1,Number(scene.vrScreenCurvature??0)));
  scene.vrScreenSegments=[32,64,128,256].includes(Number(scene.vrScreenSegments))?Number(scene.vrScreenSegments):64;
  if(vrSceneScale)vrSceneScale.value=scene.vrSceneScale;
  if(vrSceneScaleValue)vrSceneScaleValue.textContent=scene.vrSceneScale.toFixed(2);
  if(vrSceneDistance)vrSceneDistance.value=scene.vrSceneDistance;
  if(vrSceneDistanceValue)vrSceneDistanceValue.textContent=scene.vrSceneDistance.toFixed(2)+' m';
  if(vrScreenCurvature)vrScreenCurvature.value=scene.vrScreenCurvature;
  if(vrScreenCurvatureValue)vrScreenCurvatureValue.textContent=scene.vrScreenCurvature.toFixed(2);
  if(vrScreenSegments)vrScreenSegments.value=String(scene.vrScreenSegments);
  vrPlaneMeshKey='';
}
if(vrSceneScale)vrSceneScale.addEventListener('input',()=>{
  scene.vrSceneScale=Math.max(0.5,Math.min(2.5,Number(vrSceneScale.value)||1));
  syncVrViewerUi();
});
if(vrSceneDistance)vrSceneDistance.addEventListener('input',()=>{
  scene.vrSceneDistance=Math.max(1.2,Math.min(6,Number(vrSceneDistance.value)||3));
  syncVrViewerUi();
});
if(vrScreenCurvature)vrScreenCurvature.addEventListener('input',()=>{
  scene.vrScreenCurvature=Math.max(0,Math.min(1,Number(vrScreenCurvature.value)||0));
  syncVrViewerUi();
});
if(vrScreenSegments)vrScreenSegments.addEventListener('change',()=>{
  scene.vrScreenSegments=[32,64,128,256].includes(Number(vrScreenSegments.value))?Number(vrScreenSegments.value):64;
  syncVrViewerUi();
});
if(hideMenusBtn)hideMenusBtn.onclick=()=>setMenuMode(true);
if(showMenusBtn)showMenusBtn.onclick=()=>setMenuMode(false);
if(sceneViewBtn)sceneViewBtn.addEventListener('click',()=>setMenuMode(true));
function isTypingTarget(el){
  if(!el)return false;
  const tag=(el.tagName||'').toLowerCase();
  return tag==='input'||tag==='textarea'||tag==='select'||el.isContentEditable;
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
if(timelineCopyEventBtn)timelineCopyEventBtn.onclick=copyTimelineEvent;
if(timelineDeleteEventBtn)timelineDeleteEventBtn.onclick=deleteTimelineEvent;
[timelineEventTime,timelineEventDuration].forEach(el=>{if(el)el.addEventListener('input',()=>{if(timelineEventTimeValue)timelineEventTimeValue.textContent=formatTimelineTime(Number(timelineEventTime.value)||0);if(timelineEventDurationValue)timelineEventDurationValue.textContent=Number(timelineEventDuration.value||0).toFixed(1)+' s';});});
if(timelineDropZone){
  timelineDropZone.addEventListener('dragover',e=>{e.preventDefault();timelineDropZone.classList.add('isOver');});
  timelineDropZone.addEventListener('dragleave',()=>timelineDropZone.classList.remove('isOver'));
  timelineDropZone.addEventListener('drop',e=>{e.preventDefault();timelineDropZone.classList.remove('isOver');const oid=e.dataTransfer.getData('group-id')||e.dataTransfer.getData('object-id');if(oid&&timelineTargetKindFromValue(oid)){updateTimelineObjectOptions();timelineEventObject.value=oid;}});
}


// Timeline V2: echte Event-Wirkung, Startzustand, Konfigurations-Snapshots und Eventliste.
const TIMELINE_RUNTIME_SKIP_KEYS=new Set([
  'id','type','screenTexture','screenMediaElement','screenMediaUrl','screenCaptureStream','screenPlaylist','screenTextTexture','screenTextCanvas','screenTextBgImageElement',
  'particleTexture','particleImageElement','particleImageUrl','_ipmDestruction','_ipmDestructionLastAudio','imageAssetTexture','imageAssetElement','imageAssetUrl','audioSourceElement','audioSourceNode','audioSourceGain','audioSourceAnalyserTap','audioSourcePan','audioSourceMediaUrl','greenscreenTexture','greenscreenMediaElement','greenscreenMediaUrl','greenscreenStream','greenscreenAudioNode','greenscreenAudioGain'
]);
function timelineClone(obj){try{return JSON.parse(JSON.stringify(obj));}catch(e){return {...obj};}}
function timelineGroupById(gid){return groups.find(g=>g.id===gid)||null;}
function timelineGroupMembers(gid){return gid?objects.filter(o=>o&&o.groupId===gid):[];}
function timelineTargetKindFromValue(value){
  if(!value)return '';
  if(objects.some(o=>o.id===value))return 'object';
  if(timelineGroupMembers(value).length)return 'group';
  return '';
}
function timelineEventTargetKind(ev){
  if(ev&&ev.targetType==='group')return 'group';
  if(ev&&ev.groupId)return 'group';
  return timelineTargetKindFromValue(ev&&ev.objectId)||'object';
}
function timelineEventTargetId(ev){return ev?(ev.groupId||ev.objectId||''):'';}
function timelineObjectsForTarget(kind,id){
  if(kind==='group')return timelineGroupMembers(id);
  const o=objects.find(x=>x.id===id);
  return o?[o]:[];
}
function timelineObjectsForEvent(ev){return timelineObjectsForTarget(timelineEventTargetKind(ev),timelineEventTargetId(ev));}
function timelineTargetLabel(kind,id){
  if(kind==='group'){
    const g=timelineGroupById(id),arr=timelineGroupMembers(id);
    return 'Gruppe: '+((g&&g.name)||(arr[0]&&arr[0].groupName)||id)+' ('+arr.length+' Objekt'+(arr.length!==1?'e':'')+')';
  }
  const o=objects.find(x=>x.id===id);
  return o?objectShortName(o):'Objekt fehlt';
}
function timelineSnapshotTarget(kind,id){
  if(kind==='group'){
    return {type:'group',groupId:id,objects:timelineGroupMembers(id).map(o=>({id:o.id,snapshot:timelineSnapshotObject(o)}))};
  }
  const o=objects.find(x=>x.id===id);
  return o?timelineSnapshotObject(o):null;
}
function applyTimelineTargetSnapshot(kind,id,snap){
  if(!snap)return;
  if(kind==='group'||snap.type==='group'){
    const byId=new Map((snap.objects||[]).map(entry=>[entry.id,entry.snapshot]));
    for(const o of timelineGroupMembers(id||snap.groupId)){
      const os=byId.get(o.id);
      if(os)applyTimelineSnapshot(o,os);
    }
    return;
  }
  const o=objects.find(x=>x.id===id);
  if(o)applyTimelineSnapshot(o,snap);
}
function timelineAffectedObjectIds(){
  const ids=[];
  for(const ev of (timelineState.events||[])){
    if(!ev||ev.enabled===false)continue;
    timelineObjectsForEvent(ev).forEach(o=>ids.push(o.id));
  }
  return [...new Set(ids)];
}
function getTimelineStartActive(oid){
  const ev=(timelineState.events||[]).find(e=>e&&e.enabled!==false&&e.startActive!==undefined&&timelineObjectsForEvent(e).some(o=>o.id===oid));
  return ev?ev.startActive!==false:true;
}
function ensureTimelineBaseSnapshots(){
  for(const oid of timelineAffectedObjectIds()){
    const o=objects.find(x=>x.id===oid);
    if(o&&!o._timelineBaseSnapshot)o._timelineBaseSnapshot=timelineSnapshotObject(o);
  }
}
function resetTimelineBaseSnapshotFor(oid){
  const kind=timelineTargetKindFromValue(oid);
  for(const o of timelineObjectsForTarget(kind,oid)){
    o._timelineBaseSnapshot=timelineSnapshotObject(o);
  }
}
let timelineParticleTriggerLastTime=null;
function resetTimelineParticleTriggers(){
  for(const ev of (timelineState.events||[])){
    if(ev)ev._particleTimelineFired=false;
  }
}
function applyTimelineEvents(){
  if(!timelineState||!Array.isArray(timelineState.events)||!timelineState.events.length){
    objects.forEach(o=>{if(o)o._timelineHidden=false;});
    return;
  }
  ensureTimelineBaseSnapshots();
  const t=Math.max(0,currentTimelineTime());
  const timelineWentBack=timelineParticleTriggerLastTime!==null&&t<timelineParticleTriggerLastTime-0.001;
  if(timelineWentBack)resetTimelineParticleTriggers();
  if(!timelineState.playing&&t<=0.001)resetTimelineParticleTriggers();
  timelineParticleTriggerLastTime=t;
  const liveTimelineAssetIds=new Set();
  for(const event of (timelineState.events||[])){
    if(event&&(event.timelineAssetKind==='screen-media'||event.timelineAssetKind==='scene')){
      timelineObjectsForEvent(event).forEach(object=>liveTimelineAssetIds.add(object.id));
    }
  }
  const affected=timelineAffectedObjectIds();
  const timelineObjectBeingEdited=!timelineState.playing?(window.objectTimelineEditingObjectId||''):'';
  for(const oid of affected){
    const o=objects.find(x=>x.id===oid);
    if(!o)continue;
    if(timelineObjectBeingEdited===oid){o._timelineHidden=false;continue;}
    if(o._timelineBaseSnapshot&&!liveTimelineAssetIds.has(oid))applyTimelineSnapshot(o,o._timelineBaseSnapshot);
    o._timelineHidden=!getTimelineStartActive(oid);
  }
  const events=[...(timelineState.events||[])].filter(e=>e&&e.enabled!==false&&timelineObjectsForEvent(e).length).sort((a,b)=>(Number(a.time)||0)-(Number(b.time)||0));
  for(const ev of events){
    const kind=timelineEventTargetKind(ev);
    const targetId=timelineEventTargetId(ev);
    const targets=timelineObjectsForEvent(ev).filter(o=>o.id!==timelineObjectBeingEdited);
    if(!targets.length)continue;
    const start=Number(ev.time)||0;
    const dur=Number(ev.duration)||0;
    const inWindow=t>=start&&(dur<=0||t<=start+dur);
    const after=t>=start;
    if(!after){ev._particleTimelineFired=false;continue;}
    const action=ev.action||'activate';
    if(action==='deactivate'){
      for(const o of targets){
        if(dur>0){if(inWindow)o._timelineHidden=true;}
        else o._timelineHidden=true;
      }
      continue;
    }
    if(action==='activate'){
      for(const o of targets){
        if(dur>0){o._timelineHidden=!inWindow;}else{o._timelineHidden=false;}
      }
      if((dur<=0||inWindow)&&ev.snapshot&&ev.timelineAssetKind!=='screen-media'&&ev.timelineAssetKind!=='scene')applyTimelineTargetSnapshot(kind,targetId,ev.snapshot);
      const particleActivationActive=dur<=0||inWindow;
      if(particleActivationActive&&timelineState.playing&&!ev._particleTimelineFired){
        let particleTargetFound=false;
        for(const o of targets){
          if(o&&o.type==='particle'){
            particleTargetFound=true;
            triggerParticleEffect(o,1);
          }
        }
        if(particleTargetFound)ev._particleTimelineFired=true;
      }
      if(!particleActivationActive)ev._particleTimelineFired=false;
    }else if(action==='parameter'){
      if(dur<=0||inWindow){if(ev.snapshot)applyTimelineTargetSnapshot(kind,targetId,ev.snapshot);}
    }else if(action==='ipmDestruction'){
      if(!ev._ipmDestructionFired && (dur<=0?inWindow:inWindow)){
        const snap=ev.snapshot||{};
        for(const o of targets){
          if(o&&o.type==='imageParticle')triggerIpmDestruction(o.id,{
            mode:snap.ipmDestructionMode,
            reverse:snap.ipmDestructionReverse,
            strength:snap.ipmDestructionStrength,
            directionX:snap.ipmDestructionDirX,
            directionY:snap.ipmDestructionDirY,
            spread:snap.ipmDestructionSpread,
            gravity:snap.ipmDestructionGravity,
            duration:snap.ipmDestructionDuration,
            returnEnabled:snap.ipmDestructionReturnEnabled,
            returnSpeed:snap.ipmDestructionReturnSpeed,
            randomness:snap.ipmDestructionRandomness,
            clusterSize:snap.ipmDestructionClusterSize,
            particleFade:snap.ipmDestructionParticleFade,
            fadeTime:snap.ipmDestructionFadeTime
          });
        }
        ev._ipmDestructionFired=true;
      }
      if(!inWindow)ev._ipmDestructionFired=false;
    }
  }
  if(selected&&selected._timelineHidden){/* Auswahl bleibt intern erhalten, nur Rendering ist aus. */}
}
if(timelineAddEventBtn)timelineAddEventBtn.onclick=addOrUpdateTimelineEvent;
if(timelineCopyEventBtn)timelineCopyEventBtn.onclick=copyTimelineEvent;
if(timelineDeleteEventBtn)timelineDeleteEventBtn.onclick=deleteTimelineEvent;
if(timelineCaptureConfigBtn)timelineCaptureConfigBtn.onclick=captureTimelineEventConfig;
[timelineEventTime,timelineEventDuration,timelineEventEnabled,timelineEventStartActive,timelineEventAction,timelineEventObject].forEach(el=>{if(el)el.addEventListener('input',()=>{const ev=selectedTimelineEvent();if(ev){ev.time=Number(timelineEventTime?.value||0);ev.duration=Number(timelineEventDuration?.value||0);ev.enabled=timelineEventEnabled?timelineEventEnabled.checked:true;ev.startActive=timelineEventStartActive?timelineEventStartActive.checked:true;ev.action=timelineEventAction?.value||ev.action;syncTimelineEventTargetFromForm(ev);}if(timelineEventTimeValue)timelineEventTimeValue.textContent=formatTimelineTime(Number(timelineEventTime?.value)||0);if(timelineEventDurationValue)timelineEventDurationValue.textContent=Number(timelineEventDuration?.value||0).toFixed(1)+' s';updateTimelineUI();});});

window.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&vrState.active){e.preventDefault();endVrViewer();return;}
  if(e.key==='Escape'&&scene.uiHidden)setMenuMode(false);
  if((e.key==='m'||e.key==='M')&&e.ctrlKey){e.preventDefault();setMenuMode(!scene.uiHidden);}
  if(isTypingTarget(e.target))return;
  if((e.key==='z'||e.key==='Z')&&e.ctrlKey){if(restoreBgCaptureUndo()){e.preventDefault();return;}}
  if((e.key==='d'||e.key==='D')&&e.ctrlKey){e.preventDefault();duplicateSelectedObject();}
  if(e.key==='Delete'||e.key==='Del'){e.preventDefault();deleteSelectedObject();}
});
