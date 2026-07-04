/* ===== AudioSource-Parameter direkt aus der Timeline ===== */
(()=>{
  if(!timelineEventsEl)return;
  const panel=document.createElement('section');
  panel.id='audioSourceTimelinePanel';panel.hidden=true;
  panel.innerHTML=`
    <div class="audioSourceTimelineHeader"><div><b>Audio-Objekt</b><small id="audioSourceTimelineSubtitle">Timeline-Parameter</small></div><button id="audioSourceTimelineClose" type="button" aria-label="Audio-Objektmenü schließen">×</button></div>
    <div class="audioSourceTimelineBody">
      <p id="audioSourceTimelineStatus" class="mini">Keine Audioquelle geladen.</p>
      <label>Lokale Audiodatei</label><input id="audioSourceTimelineFile" type="file" accept="audio/*">
      <label>Stream-/Audio-URL</label><input id="audioSourceTimelineUrl" type="text" placeholder="https://... oder lokaler Stream">
      <button id="audioSourceTimelineLoadUrl" type="button">Stream/URL zuweisen</button>
      <div class="row"><button id="audioSourceTimelinePlay" type="button">Play</button><button id="audioSourceTimelinePause" type="button">Pause</button></div>
      <label><input id="audioSourceTimelineLoop" type="checkbox"> Loop</label>
      <label><input id="audioSourceTimelineAnalyze" type="checkbox"> Timeline-Audio an den Audio-Backbone senden</label>
      <p id="audioSourceTimelineBackboneStatus" class="mini"></p>
      <label>Lautstärke: <span id="audioSourceTimelineVolumeValue">1.00</span></label><input id="audioSourceTimelineVolume" type="range" min="0" max="2" step="0.01">
      <label>Reichweite: <span id="audioSourceTimelineRangeValue">35</span></label><input id="audioSourceTimelineRange" type="range" min="1" max="150" step="1">
      <label>Falloff: <span id="audioSourceTimelineFalloffValue">1.00</span></label><input id="audioSourceTimelineFalloff" type="range" min="0.1" max="4" step="0.01">
      <label>Symbol-Transparenz: <span id="audioSourceTimelineOpacityValue">0.65</span></label><input id="audioSourceTimelineOpacity" type="range" min="0" max="1" step="0.01">
      <label><input id="audioSourceTimelineDirectional" type="checkbox"> Richtung verwenden</label>
      <label>Richtung: <span id="audioSourceTimelineDirectionValue">0°</span></label><input id="audioSourceTimelineDirection" type="range" min="0" max="360" step="1">
    </div>`;
  document.body.appendChild(panel);

  const byId=id=>document.getElementById(id);
  const controls={
    loop:byId('audioSourceTimelineLoop'),analyze:byId('audioSourceTimelineAnalyze'),volume:byId('audioSourceTimelineVolume'),
    range:byId('audioSourceTimelineRange'),falloff:byId('audioSourceTimelineFalloff'),opacity:byId('audioSourceTimelineOpacity'),
    directional:byId('audioSourceTimelineDirectional'),direction:byId('audioSourceTimelineDirection')
  };
  const labels={volume:byId('audioSourceTimelineVolumeValue'),range:byId('audioSourceTimelineRangeValue'),falloff:byId('audioSourceTimelineFalloffValue'),opacity:byId('audioSourceTimelineOpacityValue'),direction:byId('audioSourceTimelineDirectionValue')};
  let activeObject=null,activeEvent=null,activeClip=null;

  function updateStatus(){
    const status=byId('audioSourceTimelineStatus');if(!status||!activeObject)return;
    status.textContent=activeObject.audioSourceName?'Quelle: '+activeObject.audioSourceName:(activeObject.audioSourceUrl?'Quelle: '+activeObject.audioSourceUrl:'Keine Audioquelle geladen.');
  }
  function updateBackboneStatus(){
    const status=byId('audioSourceTimelineBackboneStatus');if(!status||!activeObject)return;
    status.textContent=activeObject.audioSourceAnalyze?'Aktiv: Dieses Timeline-Audio steuert Analyzer und Musikreaktionen.':'Inaktiv: Das Audio bleibt hörbar, steuert aber keine Musikreaktionen.';
  }
  function syncSnapshot(){
    if(!activeObject||!activeEvent)return;
    const kind=timelineEventTargetKind(activeEvent),targetId=timelineEventTargetId(activeEvent);
    activeEvent.snapshot=timelineSnapshotTarget(kind,targetId);
    resetTimelineBaseSnapshotFor(targetId);
  }
  function syncPanel(){
    if(!activeObject)return;
    byId('audioSourceTimelineSubtitle').textContent=activeObject.name||'AudioSource';
    controls.loop.checked=!!activeObject.audioSourceLoop;controls.analyze.checked=!!activeObject.audioSourceAnalyze;
    controls.volume.value=activeObject.audioSourceVolume??1;controls.range.value=activeObject.audioSourceRange??35;
    controls.falloff.value=activeObject.audioSourceFalloff??1;controls.opacity.value=activeObject.audioSourceIconOpacity??.65;
    controls.directional.checked=!!activeObject.audioSourceDirectional;controls.direction.value=activeObject.audioSourceDirection??0;
    labels.volume.textContent=Number(controls.volume.value).toFixed(2);labels.range.textContent=Math.round(Number(controls.range.value));
    labels.falloff.textContent=Number(controls.falloff.value).toFixed(2);labels.opacity.textContent=Number(controls.opacity.value).toFixed(2);
    labels.direction.textContent=Math.round(Number(controls.direction.value))+'°';
    byId('audioSourceTimelineUrl').value=activeObject.audioSourceUrl||'';updateStatus();updateBackboneStatus();
  }
  function openFor(object,event=null,clip=null){
    activeObject=object;activeEvent=event;activeClip=clip;
    selectedIds.clear();selectedIds.add(object.id);selected=object;selectSingleCore(object);updateHud();updateObjectManager();
    panel.hidden=false;syncPanel();
  }
  function close(){panel.hidden=true;activeObject=null;activeEvent=null;activeClip=null;}
  byId('audioSourceTimelineClose').onclick=close;

  const bindings={loop:'audioSourceLoop',analyze:'audioSourceAnalyze',volume:'audioSourceVolume',range:'audioSourceRange',falloff:'audioSourceFalloff',opacity:'audioSourceIconOpacity',directional:'audioSourceDirectional',direction:'audioSourceDirection'};
  Object.entries(controls).forEach(([key,input])=>input.addEventListener('input',()=>{
    if(!activeObject)return;
    const value=input.type==='checkbox'?input.checked:Number(input.value);
    activeObject[bindings[key]]=value;
    if(key==='loop'&&activeObject.audioSourceElement)activeObject.audioSourceElement.loop=value;
    if(key==='analyze'){
      if(activeClip)activeClip.sendToBackbone=value;
      rebuildAudioSourceRouting(activeObject);
      const anyTimelineBackbone=(timelineState.audioClips||[]).some(clip=>{
        if(!clip||clip.active===false)return false;
        if(!clip.objectId)return true;
        const object=objects.find(item=>item.id===clip.objectId);
        return !!(object&&object.audioSourceAnalyze);
      });
      if(!value&&!anyTimelineBackbone&&(audioState.source==='audioSource'||audioState.source==='timeline')){audioState.enabled=false;audioState.source='none';}
      updateBackboneStatus();
    }
    if(labels[key])labels[key].textContent=key==='direction'?Math.round(value)+'°':key==='range'?String(Math.round(value)):Number(value).toFixed(2);
    syncSnapshot();
  }));
  byId('audioSourceTimelineFile').onchange=event=>{
    const file=event.target.files&&event.target.files[0];event.target.value='';
    if(activeObject&&file){loadAudioSourceFile(activeObject,file);if(activeClip)activeClip._element=activeObject.audioSourceElement;syncSnapshot();updateStatus();}
  };
  byId('audioSourceTimelineLoadUrl').onclick=()=>{
    const url=byId('audioSourceTimelineUrl').value.trim();if(activeObject&&url){loadAudioSourceUrl(activeObject,url);if(activeClip)activeClip._element=activeObject.audioSourceElement;syncSnapshot();updateStatus();}
  };
  byId('audioSourceTimelinePlay').onclick=()=>{if(activeObject)playAudioSource(activeObject);};
  byId('audioSourceTimelinePause').onclick=()=>{if(activeObject)pauseAudioSource(activeObject);};

  timelineEventsEl.addEventListener('click',event=>{
    const clip=event.target.closest('.timelineClip[data-event-id]');if(!clip||clip.dataset.dragged==='true')return;
    const timelineEvent=timelineState.events.find(item=>item.id===clip.dataset.eventId);if(!timelineEvent)return;
    const audioObject=timelineObjectsForEvent(timelineEvent).find(object=>object&&object.type==='audioSource');
    if(!audioObject)return;
    setTimeout(()=>openFor(audioObject,timelineEvent),0);
  },true);
  const audioClipsElement=document.getElementById('timelineAudioClips');
  if(audioClipsElement)audioClipsElement.addEventListener('click',event=>{
    const element=event.target.closest('.timelineClip[data-audio-clip-id]');if(!element||element.dataset.dragged==='true')return;
    const clip=timelineState.audioClips.find(item=>item.id===element.dataset.audioClipId);if(!clip||!clip.objectId)return;
    const audioObject=objects.find(object=>object.id===clip.objectId&&object.type==='audioSource');if(!audioObject)return;
    setTimeout(()=>openFor(audioObject,null,clip),0);
  },true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)close();});

  const header=panel.querySelector('.audioSourceTimelineHeader');
  header.addEventListener('pointerdown',event=>{
    if(event.button!==0||event.target.closest('button'))return;
    const rect=panel.getBoundingClientRect(),dx=event.clientX-rect.left,dy=event.clientY-rect.top;
    const move=moveEvent=>{panel.style.left=Math.max(8,Math.min(window.innerWidth-panel.offsetWidth-8,moveEvent.clientX-dx))+'px';panel.style.top=Math.max(52,Math.min(window.innerHeight-panel.offsetHeight-8,moveEvent.clientY-dy))+'px';panel.style.right='auto';};
    const up=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);};
    document.addEventListener('pointermove',move);document.addEventListener('pointerup',up,{once:true});
  });
})();
