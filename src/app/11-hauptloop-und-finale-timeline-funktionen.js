/* ===== Hauptloop und finale Timeline-Funktionen ===== */
function loop(){
  if(vrState.active)return;
  const ordered=updateVseFrame();
  renderNormalFrame(ordered);
  if(!vrState.active)requestAnimationFrame(loop);
}
bgOpacityValue.textContent=background.opacity.toFixed(2);bgZoomValue.textContent=background.zoom.toFixed(2);screenDimValue.textContent=scene.screenDim.toFixed(2);screenBrightenValue.textContent=scene.screenBrighten.toFixed(2);if(backlightPassValue)backlightPassValue.textContent=Number(scene.backlightPass||0).toFixed(2);syncVrViewerUi();syncMandalaUi();audioSensValue.textContent=audioState.sensitivity.toFixed(2);updateBpmDisplayVisibility();updateTimelineUI();loop();syncLightUI();updateObjectManager();


// --- VSE 196: Timeline - mehrere Events zuverlässig anlegen ---
// In 195 blieb das zuletzt ausgewählte Event aktiv; der Button "Event hinzufügen"
// aktualisierte dadurch immer wieder dasselbe Event. Ab 196 erzeugt dieser Button
// immer ein neues Event. Bereits vorhandene Events werden weiterhin über die
// Eventliste ausgewählt und durch die Formularfelder direkt bearbeitet.
if(timelineAddEventBtn){
  timelineAddEventBtn.onclick=addOrUpdateTimelineEvent;
  timelineAddEventBtn.title='Legt immer ein neues Timeline-Event an. Vorhandene Events über die Eventliste auswählen und bearbeiten.';
}


// --- VSE 197: Timeline Screen-Event-Fix ---
// Screen-Events müssen wirklich die komplette Screen-Konfiguration anwenden.
// In 196 wurden zwar Events ausgelöst, aber Screen-spezifische Zustände konnten
// durch ältere Timeline-Funktionen bzw. ausgelassene Screen-Daten unvollständig bleiben.
const TIMELINE_SCREEN_KEYS=[
  'x','y','layer','size','intensity','rotation','color','music','thresholdBelow','life','audioFreq',
  'screenWidth','screenHeight','screenMode','screenFrameMode','screenBrightness','screenOpacity','screenScanlines','screenAudio','screenAltColor','screenAltSpeed','screenAltAmount',
  'screenMediaType','screenMediaName','screenMediaData','screenMediaEmbedded','screenMediaFit','screenFlipX','screenFlipY','screenVideoAudio','screenVideoVolume','screenMediaAspect',
  'screenTextSource','screenText','screenTextMode','screenTextFont','screenTextSize','screenTextColor','screenTextBold','screenTextItalic','screenTextUnderline','screenTextAlign','screenTextLineHeight','screenTextSpeed','screenTextBgMode','screenTextBgColor','screenTextBgOpacity','screenTextBgFit','screenTextBgImageName','screenTextBgImageData',
  'screenAmbilight','screenAmbilightStrength','screenEngineX','screenEngineY','screenEngineW','screenEngineH'
];
function timelineCloneSafe(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return v;}}
function timelineSnapshotObject(o){
  if(!o)return null;
  const snap={type:o.type,id:o.id};
  if(o.type==='screen'){
    for(const k of TIMELINE_SCREEN_KEYS){
      if(Object.prototype.hasOwnProperty.call(o,k))snap[k]=timelineCloneSafe(o[k]);
    }
    return snap;
  }
  const raw=(typeof cleanObjectForObjectExport==='function')?cleanObjectForObjectExport(o):o;
  for(const [k,v] of Object.entries(raw)){
    if(k==='id'||k==='type'||k==='name'||k==='groupId'||k==='groupName'||k.startsWith('_')||typeof v==='function')continue;
    if(k.endsWith('Element')||k.endsWith('Texture')||k.endsWith('Url')||k.endsWith('Stream')||k.endsWith('Node')||k.endsWith('Gain')||k.endsWith('Pan'))continue;
    snap[k]=timelineCloneSafe(v);
  }
  return snap;
}
function timelineLoadScreenImageData(o,data,name){
  if(!o||o.type!=='screen'||!data)return;
  try{
    if(typeof releaseScreenMedia==='function')releaseScreenMedia(o);
    const tex=typeof initTexture==='function'?initTexture():gl.createTexture();
    o.screenTexture=tex;
    o.screenMediaData=data;
    o.screenMediaEmbedded=true;
    o.screenMediaType='image';
    o.screenMediaName=name||o.screenMediaName||'Timeline-Bild';
    o.screenMode='image';
    const img=new Image();
    img.onload=()=>{
      o.screenMediaAspect=(img.naturalWidth||1)/Math.max(1,(img.naturalHeight||1));
      gl.bindTexture(gl.TEXTURE_2D,tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
      o._ambilightColor=null;o._ambilightLastSample=0;
    };
    img.src=data;
    o.screenMediaElement=img;
    o.screenMediaUrl='';
  }catch(err){console.warn('Timeline Screen-Bild konnte nicht geladen werden',err);}
}
function timelineLoadScreenTextBgData(o,data,name){
  if(!o||o.type!=='screen'||!data)return;
  try{
    const img=new Image();
    img.onload=()=>{o.screenTextBgImageElement=img;o.screenTextBgImageReady=true;o.screenTextDirty=true;};
    img.src=data;
    o.screenTextBgImageData=data;
    o.screenTextBgImageName=name||o.screenTextBgImageName||'Timeline-Texthintergrund';
  }catch(err){console.warn('Timeline Texthintergrund konnte nicht geladen werden',err);}
}
function applyTimelineSnapshot(o,snap){
  if(!o||!snap)return;
  if(o.type==='screen'||snap.type==='screen'){
    const oldMediaData=o.screenMediaData;
    const oldTextBgData=o.screenTextBgImageData;
    for(const k of TIMELINE_SCREEN_KEYS){
      if(Object.prototype.hasOwnProperty.call(snap,k))o[k]=timelineCloneSafe(snap[k]);
    }
    o.screenTextDirty=true;
    o._ambilightColor=null;o._ambilightLastSample=0;
    if(o.screenMode==='image'&&snap.screenMediaData&&snap.screenMediaData!==oldMediaData){
      timelineLoadScreenImageData(o,snap.screenMediaData,snap.screenMediaName);
    }
    if(o.screenTextBgMode==='image'&&snap.screenTextBgImageData&&snap.screenTextBgImageData!==oldTextBgData){
      timelineLoadScreenTextBgData(o,snap.screenTextBgImageData,snap.screenTextBgImageName);
    }
    return;
  }
  for(const [k,v] of Object.entries(snap)){
    if(k==='id'||k==='type'||k==='name'||k==='groupId'||k==='groupName')continue;
    if(k.startsWith('_')||k.endsWith('Element')||k.endsWith('Texture')||k.endsWith('Url')||k.endsWith('Stream')||k.endsWith('Node')||k.endsWith('Gain')||k.endsWith('Pan'))continue;
    o[k]=timelineCloneSafe(v);
  }
}
function updateTimelineEventList(){
  if(!timelineEventList)return;
  const objectScopeId=window.objectTimelineMenuObjectId||'';
  const evs=[...(timelineState.events||[])]
    .filter(ev=>ev.timelineAssetKind!=='camera'&&(!objectScopeId||timelineObjectsForEvent(ev).some(o=>o.id===objectScopeId)))
    .sort((a,b)=>(Number(a.time)||0)-(Number(b.time)||0));
  if(!evs.length){timelineEventList.innerHTML='<div class="mini">Für dieses Objekt sind noch keine Events vorhanden.</div>';return;}
  timelineEventList.innerHTML='';
  const esc=s=>String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  for(const ev of evs){
    const kind=timelineEventTargetKind(ev);
    const targetId=timelineEventTargetId(ev);
    const label=timelineTargetLabel(kind,targetId);
    const row=document.createElement('div');
    row.className='tlRow '+(ev.id===timelineState.selectedEventId?'isSelected':'');
    const actionLabel=ev.action==='deactivate'?'Aus':ev.action==='parameter'?'Parameter':ev.action==='ipmDestruction'?'IPM Destruction':'An';
    const cfg=ev.snapshot?(kind==='group'?'Gruppen-Konfig':'Konfig'):'keine Konfig';
    row.innerHTML=`<div class="tlMeta">${formatTimelineTime(ev.time||0)}</div><div>${esc(label)}<div class="tlMeta">${ev.startActive===false?'Start: aus':'Start: an'} · ${cfg}</div></div><div class="tlAction">${actionLabel}</div>`;
    row.onclick=()=>{timelineState.selectedEventId=ev.id;selectTimeline();setTimelineEventForm(ev);renderTimelineEvents();updateTimelineEventList();};
    timelineEventList.appendChild(row);
  }
}
function setTimelineEventForm(ev){
  updateTimelineObjectOptions();
  if(!ev){
    if(timelineEventTime){timelineEventTime.max=timelineState.duration;timelineEventTime.value=timelineState.lastClickTime||0;}
    if(timelineEventTimeValue)timelineEventTimeValue.textContent=formatTimelineTime(timelineState.lastClickTime||0);
    if(timelineEventDurationValue)timelineEventDurationValue.textContent=Number(timelineEventDuration?.value||0).toFixed(2)+' s';
    if(timelineEventEnabled)timelineEventEnabled.checked=true;
    if(timelineEventStartActive)timelineEventStartActive.checked=true;
    if(timelineEventInfo)timelineEventInfo.textContent='Noch kein Timeline-Event ausgewählt.';
    return;
  }
  if(timelineEventObject)timelineEventObject.value=timelineEventTargetId(ev)||'';
  if(timelineEventTime){timelineEventTime.max=timelineState.duration;timelineEventTime.value=ev.time||0;}
  if(timelineEventAction)timelineEventAction.value=ev.action||'activate';
  if(timelineEventDuration){timelineEventDuration.max=Math.max(300,timelineState.duration);timelineEventDuration.value=ev.duration||0;}
  if(timelineEventEnabled)timelineEventEnabled.checked=ev.enabled!==false;
  if(timelineEventStartActive)timelineEventStartActive.checked=ev.startActive!==false;
  if(timelineEventTimeValue)timelineEventTimeValue.textContent=formatTimelineTime(ev.time||0);
  if(timelineEventDurationValue)timelineEventDurationValue.textContent=Number(ev.duration||0).toFixed(2)+' s';
  const kind=timelineEventTargetKind(ev);
  const targetId=timelineEventTargetId(ev);
  const targets=timelineObjectsForTarget(kind,targetId);
  if(timelineEventInfo)timelineEventInfo.textContent=targets.length?('Event: '+timelineTargetLabel(kind,targetId)+' · '+formatTimelineTime(ev.time||0)+' · '+(ev.snapshot?'Konfiguration gespeichert':'keine Konfiguration gespeichert')):'Event ohne gültiges Ziel.';
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
function updateTimelineUI(){
  timelineState.widthPercent=100;
  if(timelineDock)timelineDock.style.width='';
  if(timelineWidthInput){timelineWidthInput.value=100;timelineWidthInput.disabled=true;}
  if(timelineWidthValue)timelineWidthValue.textContent='100%';
  if(timelineDurationInput)timelineDurationInput.value=timelineState.duration;
  if(timelineDurationValue)timelineDurationValue.textContent=formatTimelineTime(timelineState.duration);
  if(timelineTotalTimeEl)timelineTotalTimeEl.textContent=formatTimelineTime(timelineState.duration);
  if(timelineEventTime)timelineEventTime.max=timelineState.duration;
  if(timelineEventDuration)timelineEventDuration.max=Math.max(300,timelineState.duration);
  updateTimelineObjectOptions();renderTimelineEvents();updateTimelineEventList();
}
if(timelineAddEventBtn){timelineAddEventBtn.onclick=addOrUpdateTimelineEvent;timelineAddEventBtn.title='Legt ein neues Timeline-Event mit aktueller Objekt-Konfiguration an.';}
if(timelineCopyEventBtn){timelineCopyEventBtn.onclick=copyTimelineEvent;timelineCopyEventBtn.title='Kopiert das ausgewählte Timeline-Event mit Ziel, Aktion, Dauer und gespeicherter Konfiguration.';}
if(timelineCaptureConfigBtn){timelineCaptureConfigBtn.onclick=captureTimelineEventConfig;}
[timelineEventTime,timelineEventDuration,timelineEventEnabled,timelineEventStartActive,timelineEventAction,timelineEventObject].forEach(el=>{if(el)el.addEventListener('change',()=>{const ev=selectedTimelineEvent();if(ev){ev.time=Number(timelineEventTime?.value||0);ev.duration=Number(timelineEventDuration?.value||0);ev.enabled=timelineEventEnabled?timelineEventEnabled.checked:true;ev.startActive=timelineEventStartActive?timelineEventStartActive.checked:true;ev.action=timelineEventAction?.value||ev.action;syncTimelineEventTargetFromForm(ev);}if(timelineEventTimeValue)timelineEventTimeValue.textContent=formatTimelineTime(Number(timelineEventTime?.value)||0);if(timelineEventDurationValue)timelineEventDurationValue.textContent=Number(timelineEventDuration?.value||0).toFixed(2)+' s';updateTimelineUI();});});
if(typeof updateTimelineUI==='function')updateTimelineUI();
