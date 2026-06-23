// Functions needed before their original app sections load.
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

function addOrUpdateTimelineEvent(){
  const oid=timelineEventObject&&timelineEventObject.value;
  const kind=timelineTargetKindFromValue(oid);
  if(!oid||!kind){alert('Bitte ein Objekt oder eine Gruppe für das Timeline-Event auswählen.');return;}
  const ev={
    id:'tl_'+Date.now().toString(36)+'_'+Math.floor(Math.random()*999999),
    objectId:oid,
    targetType:kind==='group'?'group':undefined,
    groupId:kind==='group'?oid:undefined,
    time:Number(timelineEventTime?.value||timelineState.lastClickTime||0),
    action:timelineEventAction?.value||'activate',
    duration:Number(timelineEventDuration?.value||0),
    enabled:timelineEventEnabled?timelineEventEnabled.checked:true,
    startActive:timelineEventStartActive?timelineEventStartActive.checked:true,
    snapshot:timelineSnapshotTarget(kind,oid)
  };
  if(kind!=='group'){delete ev.targetType;delete ev.groupId;}
  timelineState.events.push(ev);
  timelineState.selectedEventId=ev.id;
  resetTimelineBaseSnapshotFor(oid);
  timelineState.events.sort((a,b)=>(Number(a.time)||0)-(Number(b.time)||0));
  updateTimelineUI();setTimelineEventForm(ev);updateTimelineEventList();
}


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


function copyTimelineEvent(){
  const source=selectedTimelineEvent();
  if(!source){alert('Bitte zuerst ein Timeline-Event aus der Eventliste auswählen.');return;}
  const targetId=timelineEventTargetId(source);
  const kind=timelineEventTargetKind(source);
  if(!timelineObjectsForTarget(kind,targetId).length){alert('Das Ziel des ausgewählten Events ist nicht mehr vorhanden.');return;}
  const copy=timelineCloneSafe(source);
  copy.id='tl_'+Date.now().toString(36)+'_'+Math.floor(Math.random()*999999);
  const time=Number(copy.time)||0;
  copy.time=Math.min(Math.max(0.001,Number(timelineState.duration)||180),time+1);
  timelineState.events.push(copy);
  timelineState.selectedEventId=copy.id;
  resetTimelineBaseSnapshotFor(targetId);
  timelineState.events.sort((a,b)=>(Number(a.time)||0)-(Number(b.time)||0));
  updateTimelineUI();setTimelineEventForm(copy);updateTimelineEventList();
}


function deleteTimelineEvent(){
  if(!timelineState.selectedEventId)return;
  timelineState.events=timelineState.events.filter(e=>e.id!==timelineState.selectedEventId);
  timelineState.selectedEventId=null;updateTimelineUI();setTimelineEventForm(null);
}


function captureTimelineEventConfig(){
  const ev=selectedTimelineEvent();
  const oid=(timelineEventObject&&timelineEventObject.value)||(ev&&ev.objectId);
  const kind=timelineTargetKindFromValue(oid);
  if(!kind){alert('Kein gültiges Objekt oder keine gültige Gruppe für dieses Event.');return;}
  const target=ev||{id:'tl_'+Date.now().toString(36)+'_'+Math.floor(Math.random()*999999),objectId:oid,time:Number(timelineEventTime?.value||timelineState.lastClickTime||0),action:timelineEventAction?.value||'parameter',duration:Number(timelineEventDuration?.value||0),enabled:true,startActive:timelineEventStartActive?timelineEventStartActive.checked:true};
  target.objectId=oid;
  if(kind==='group'){target.targetType='group';target.groupId=oid;}else{delete target.targetType;delete target.groupId;}
  target.time=Number(timelineEventTime?.value||target.time||0);
  target.action=timelineEventAction?.value||target.action||'parameter';
  target.duration=Number(timelineEventDuration?.value||target.duration||0);
  target.enabled=timelineEventEnabled?timelineEventEnabled.checked:true;
  target.startActive=timelineEventStartActive?timelineEventStartActive.checked:true;
  target.snapshot=timelineSnapshotTarget(kind,oid);
  if(!timelineState.events.includes(target)){timelineState.events.push(target);timelineState.selectedEventId=target.id;}
  resetTimelineBaseSnapshotFor(oid);
  updateTimelineUI();setTimelineEventForm(target);updateTimelineEventList();
}
