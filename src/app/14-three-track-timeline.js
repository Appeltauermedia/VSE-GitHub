/* ===== Timeline V3: interne Master-Zeit und drei getrennte Spuren ===== */
(function(){
  const byId=id=>document.getElementById(id);
  const createObjectWithDefaults=newObj;
  newObj=function(type,x,y){const object=createObjectWithDefaults(type,x,y);if(object&&object.type==='screen')object.screenFlipX=false;return object;};
  const finiteDuration=(value,fallback=0)=>{const n=Number(value);return Number.isFinite(n)&&n>0?n:fallback;};
  const duration=()=>Math.max(1,finiteDuration(timelineState.duration,180));
  const clampTime=value=>Math.max(0,Math.min(duration(),Number(value)||0));
  function snapTimelineTime(value,excludeId,lane){
    const points=[0,duration()];
    for(const ev of timelineState.events||[]){if(!ev||ev.id===excludeId)continue;const start=Number(ev.time)||0;points.push(start,start+Math.max(0,Number(ev.duration)||0));}
    for(const clip of timelineState.audioClips||[]){if(!clip||clip.id===excludeId)continue;const start=Number(clip.start)||0;points.push(start,start+Math.max(0,Number(clip.duration)||0));}
    const laneWidth=Math.max(1,lane&&lane.getBoundingClientRect().width||1),threshold=duration()*9/laneWidth;
    let result=clampTime(value),distance=Infinity;
    for(const point of points){const delta=Math.abs(point-result);if(delta<=threshold&&delta<distance){result=point;distance=delta;}}
    return clampTime(result);
  }
  function snapTimelineClipStart(value,clipDuration,excludeId,lane){
    const raw=clampTime(value),byStart=snapTimelineTime(raw,excludeId,lane),byEnd=snapTimelineTime(raw+Math.max(0,Number(clipDuration)||0),excludeId,lane)-Math.max(0,Number(clipDuration)||0);
    return clampTime(Math.abs(byEnd-raw)<Math.abs(byStart-raw)?byEnd:byStart);
  }
  window.vseSnapTimelineTime=snapTimelineTime;
  window.vseSnapTimelineClipStart=snapTimelineClipStart;
  timelineState.audioClips=Array.isArray(timelineState.audioClips)?timelineState.audioClips:[];
  function releaseTimelineAudioClip(clip){
    if(!clip)return;
    try{if(clip._element)clip._element.pause();}catch(error){}
    try{if(clip._sourceNode)clip._sourceNode.disconnect();}catch(error){}
    try{if(clip._gainNode)clip._gainNode.disconnect();}catch(error){}
    if(clip._objectUrl)try{URL.revokeObjectURL(clip._objectUrl);}catch(error){}
    clip._element=null;clip._sourceNode=null;clip._gainNode=null;clip._objectUrl='';
  }
  async function createTimelineAudioRuntime(file,clip){
    const ctx=ensureAudio();
    const element=document.createElement('audio');
    const objectUrl=URL.createObjectURL(file);
    const requestedDuration=finiteDuration(clip&&clip.duration,0);
    element.preload='auto';element.src=objectUrl;element.volume=audioVolume?Number(audioVolume.value||1):1;
    clip._element=element;clip._objectUrl=objectUrl;
    await new Promise((resolve,reject)=>{
      const done=()=>{cleanup();resolve();};
      const fail=()=>{cleanup();reject(new Error('Audiodatei konnte nicht gelesen werden.'));};
      const cleanup=()=>{element.removeEventListener('loadedmetadata',done);element.removeEventListener('error',fail);};
      element.addEventListener('loadedmetadata',done);element.addEventListener('error',fail);element.load();
    });
    clip.audioOffset=Math.max(0,Number(clip.audioOffset)||0);
    clip.audioSourceDuration=Math.max(.1,Number(element.duration)||finiteDuration(clip.audioSourceDuration,5));
    clip.duration=requestedDuration?Math.max(.1,Math.min(requestedDuration,clip.audioSourceDuration-clip.audioOffset)):clip.audioSourceDuration;
    clip._sourceNode=ctx.createMediaElementSource(element);
    clip._gainNode=ctx.createGain();clip._gainNode.gain.value=1;
    clip._sourceNode.connect(clip._gainNode);
    clip._gainNode.connect(ctx.destination);
    clip._gainNode.connect(analyser);
    if(recordingAudioDest)clip._gainNode.connect(recordingAudioDest);
    return clip;
  }
  window.vseCreateTimelineAudioRuntime=createTimelineAudioRuntime;
  const mediaElements=()=>{
    const list=[];
    timelineState.audioClips.filter(clip=>clip&&clip.active!==false&&clip._element).forEach(clip=>{
      ensureAudioEditState(clip);
      list.push({el:clip._element,start:Number(clip.start)||0,duration:Number(clip.duration)||Number(clip._element.duration)||0,offset:Number(clip.audioOffset)||0,sourceDuration:Number(clip.audioSourceDuration)||Number(clip._element.duration)||0,clip});
    });
    return list;
  };

  timelineState.manualDuration=timelineState.manualDuration!==false;
  timelineState.currentTime=clampTime(timelineState.currentTime);
  timelineState.playing=false;
  timelineState.lastClockTime=performance.now();

  currentTimelineTime=function(){return clampTime(timelineState.currentTime);};
  getTimelineMediaDuration=function(){
    const lengths=[];
    (timelineState.audioClips||[]).filter(Boolean).forEach(clip=>lengths.push((Number(clip.start)||0)+finiteDuration(clip.duration,finiteDuration(clip._element&&clip._element.duration,0))));
    (timelineState.events||[]).filter(Boolean).forEach(ev=>lengths.push((Number(ev.time)||0)+finiteDuration(ev.duration,0)));
    const longest=lengths.length?Math.max(...lengths):0;return Number.isFinite(longest)?longest:0;
  };

  function syncMediaTime(time,play){
    const timelineMedia=mediaElements();
    for(const item of timelineMedia){
      const el=item.el,mediaDuration=Number(item.duration)||Number(el.duration)||0;
      const localTime=time-Number(item.start||0);
      const inRange=localTime>=0&&(!mediaDuration||localTime<mediaDuration);
      const target=Math.max(0,Math.min(localTime+Number(item.offset||0),Number(item.sourceDuration)||mediaDuration||localTime));
      if(inRange&&Math.abs((Number(el.currentTime)||0)-target)>.2){
        try{el.currentTime=target;}catch(error){}
      }
      if(item.clip){
        const elementHasActiveClip=timelineMedia.some(other=>{
          if(!other||other.el!==el)return false;
          const otherDuration=Number(other.duration)||Number(other.el.duration)||0;
          const otherLocal=time-Number(other.start||0);
          return otherLocal>=0&&(!otherDuration||otherLocal<otherDuration);
        });
        if(item.clip.objectId)el.muted=!(play&&elementHasActiveClip);
        else if(item.clip._gainNode)item.clip._gainNode.gain.value=play&&elementHasActiveClip?1:0;
        if(play&&elementHasActiveClip){if(el.paused)Promise.resolve(el.play()).catch(()=>{});}
        else if(!el.paused)el.pause();
      }else if(play&&inRange){
        if(el.paused)Promise.resolve(el.play()).catch(()=>{});
      }else if(!el.paused){el.pause();}
    }
    for(const o of objects.filter(item=>item&&item.type==='screen'&&item.screenMediaType==='video'&&item.screenMediaElement)){
      const segments=(timelineState.events||[]).filter(ev=>ev&&ev.timelineAssetKind==='screen-media'&&timelineEventTargetId(ev)===o.id).map(ensureMediaEditState).sort((a,b)=>(Number(a.time)||0)-(Number(b.time)||0));
      const active=[...segments].reverse().find(ev=>time>=Number(ev.time||0)&&time<Number(ev.time||0)+Math.max(.1,Number(ev.duration)||.1));
      const el=o.screenMediaElement;
      if(active){
        const target=Math.max(0,Math.min((time-Number(active.time||0))+Number(active.mediaOffset||0),Number(el.duration)||Infinity));
        if(Math.abs((Number(el.currentTime)||0)-target)>.2)try{el.currentTime=target;}catch(error){}
        if(play){if(el.paused)Promise.resolve(el.play()).catch(()=>{});}else if(!el.paused)el.pause();
      }else if(!el.paused)el.pause();
    }
  }

  seekTimelineMedia=function(sec){
    timelineState.currentTime=clampTime(sec);
    timelineState.lastClockTime=performance.now();
    syncMediaTime(timelineState.currentTime,timelineState.playing);
    updateTimelinePlayhead();
  };

  function isScreenMediaEvent(ev){
    if(!ev||!ev.snapshot)return false;
    if(ev.timelineAssetKind==='scene')return true;
    const snaps=ev.snapshot.type==='group'?(ev.snapshot.objects||[]).map(x=>x&&x.snapshot):[ev.snapshot];
    return snaps.some(s=>s&&s.type==='screen'&&(s.screenMediaType==='image'||s.screenMediaType==='video'));
  }
  function eventLabel(ev){
    return timelineTargetLabel(timelineEventTargetKind(ev),timelineEventTargetId(ev));
  }
  function reconcileSceneDurations(){
    (timelineState.events||[]).filter(event=>event&&event.timelineAssetKind==='scene').forEach(event=>{if(!(Number(event.duration)>0))event.duration=5;});
  }
  const screenTimelineDurationRow=byId('screenTimelineDurationRow');
  const screenTimelineDurationInput=byId('pScreenTimelineDuration');
  function screenTimelineEventFor(object){
    if(!object)return null;
    return (timelineState.events||[]).find(event=>event&&((event.timelineAssetKind==='screen-media'&&object.type==='screen'&&timelineEventTargetId(event)===object.id)||(event.timelineAssetKind==='scene'&&object.groupId&&timelineEventTargetId(event)===object.groupId)))||null;
  }
  function syncScreenTimelineDurationControl(object=selected){
    const event=screenTimelineEventFor(object);
    if(screenTimelineDurationRow)screenTimelineDurationRow.style.display=event?'block':'none';
    if(screenTimelineDurationInput&&event)screenTimelineDurationInput.value=Math.max(.1,Number(event.duration)||5);
  }
  if(screenTimelineDurationInput)screenTimelineDurationInput.addEventListener('input',()=>{
    const event=screenTimelineEventFor(selected);if(!event)return;
    event.duration=Math.max(.1,Number(screenTimelineDurationInput.value)||5);
    lastMediaSignature='';updateTimelineUI();
  });
  function addClip(container,classes,left,width,label,title){
    if(!container)return null;
    const clip=document.createElement('div');
    clip.className='timelineClip '+classes;
    clip.style.left=left+'%';clip.style.width=width+'%';clip.textContent=label;clip.title=title||label;
    container.appendChild(clip);
    return clip;
  }
  function nextFreeStart(track,preferred,clipDuration){
    const ranges=[];
    if(track==='audio')timelineState.audioClips.forEach(clip=>ranges.push([Number(clip.start)||0,(Number(clip.start)||0)+(Number(clip.duration)||0)]));
    else (timelineState.events||[]).filter(ev=>track==='media'?isScreenMediaEvent(ev):!isScreenMediaEvent(ev)).forEach(ev=>ranges.push([Number(ev.time)||0,(Number(ev.time)||0)+Math.max(.1,Number(ev.duration)||.1)]));
    let start=clampTime(preferred);
    ranges.sort((a,b)=>a[0]-b[0]).forEach(range=>{if(start<range[1]&&start+clipDuration>range[0])start=range[1];});
    return Math.min(Math.max(0,duration()-Math.max(.1,clipDuration)),start);
  }
  function makeTimelineClipDraggable(clip,lane,getStart,setStart,assetId='',getDuration=()=>0){
    if(!clip||!lane)return;
    clip.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;
      event.preventDefault();event.stopPropagation();
      const rect=lane.getBoundingClientRect(),originX=event.clientX,originTime=Number(getStart())||0;
      let moved=false;
      clip.classList.add('isDragging');
      const move=moveEvent=>{
        const delta=(moveEvent.clientX-originX)/Math.max(1,rect.width)*duration();
        if(Math.abs(moveEvent.clientX-originX)>2)moved=true;
        setStart(snapTimelineClipStart(originTime+delta,getDuration(),assetId,lane));
        clip.style.left=(Number(getStart())/duration()*100)+'%';
        if(timelineEventTime&&timelineState.selectedEventId){timelineEventTime.value=getStart();if(timelineEventTimeValue)timelineEventTimeValue.textContent=formatTimelineTime(getStart());}
      };
      const up=()=>{
        clip.classList.remove('isDragging');
        document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);
        if(moved)clip.dataset.dragged='true';
        updateTimelineUI();
      };
      document.addEventListener('pointermove',move);document.addEventListener('pointerup',up,{once:true});
    });
    clip.addEventListener('click',event=>{if(clip.dataset.dragged==='true'){event.preventDefault();event.stopImmediatePropagation();delete clip.dataset.dragged;}},true);
  }

  function ensureMediaEditState(ev){
    if(!ev||ev.timelineAssetKind!=='screen-media')return ev;
    ev.mediaOffset=Math.max(0,Number(ev.mediaOffset)||0);
    ev.duration=finiteDuration(ev.duration,5);
    ev.mediaSourceDuration=Math.max(.1,finiteDuration(ev.mediaSourceDuration,ev.mediaOffset+ev.duration));
    ev.fadeInEnabled=!!ev.fadeInEnabled;ev.fadeOutEnabled=!!ev.fadeOutEnabled;
    ev.fadeInDuration=Math.max(0,Number(ev.fadeInDuration??1));ev.fadeOutDuration=Math.max(0,Number(ev.fadeOutDuration??1));
    return ev;
  }
  function ensureAudioEditState(clip){
    if(!clip)return clip;
    clip.audioOffset=Math.max(0,Number(clip.audioOffset)||0);
    clip.duration=finiteDuration(clip.duration,finiteDuration(clip._element&&clip._element.duration,5));
    clip.audioSourceDuration=Math.max(.1,finiteDuration(clip.audioSourceDuration,finiteDuration(clip._element&&clip._element.duration,clip.audioOffset+clip.duration)));
    if(clip.audioOffset+clip.duration>clip.audioSourceDuration)clip.duration=Math.max(.1,clip.audioSourceDuration-clip.audioOffset);
    return clip;
  }
  function selectedMediaEvent(){return ensureMediaEditState((timelineState.events||[]).find(ev=>ev&&ev.id===timelineState.selectedEventId&&ev.timelineAssetKind==='screen-media'));}
  function selectedAudioClip(){return ensureAudioEditState((timelineState.audioClips||[]).find(clip=>clip&&clip.id===timelineState.selectedAudioClipId));}
  function addTimelineTrimHandles(clip,lane,item,options){
    if(!clip||!lane||!item)return;
    const startKey=options.startKey,offsetKey=options.offsetKey,sourceDurationKey=options.sourceDurationKey,signatureKey=options.signatureKey,render=options.render;
    options.ensure(item);
    const attach=(side)=>{
      const handle=document.createElement('span');handle.className='timelineTrimHandle '+side;handle.title=side==='start'?'Clip-Anfang trimmen':'Clip-Ende trimmen';clip.appendChild(handle);
      handle.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();});
      handle.addEventListener('pointerdown',event=>{
        if(event.button!==0)return;event.preventDefault();event.stopPropagation();
        const rect=lane.getBoundingClientRect(),originX=event.clientX,oldStart=Number(item[startKey])||0,oldDuration=Math.max(.1,Number(item.duration)||.1),oldEnd=oldStart+oldDuration;
        const sourceStart=oldStart-Number(item[offsetKey]||0),maxEnd=oldStart+(Number(item[sourceDurationKey]||oldDuration)-Number(item[offsetKey]||0));
        const move=moveEvent=>{
          const delta=(moveEvent.clientX-originX)/Math.max(1,rect.width)*duration();
          if(side==='start'){
            const next=Math.max(sourceStart,Math.min(oldEnd-.1,snapTimelineTime(oldStart+delta,item.id,lane)));
            item[startKey]=next;item[offsetKey]=next-sourceStart;item.duration=oldEnd-next;
          }else{
            const next=Math.max(oldStart+.1,Math.min(maxEnd,snapTimelineTime(oldEnd+delta,item.id,lane)));item.duration=next-oldStart;
          }
          if(signatureKey==='audio')lastAudioSignature='';else lastMediaSignature='';
          render();
        };
        const up=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);updateTimelineUI();if(window.vseHistory)window.vseHistory.commit();};
        document.addEventListener('pointermove',move);document.addEventListener('pointerup',up,{once:true});
      });
    };
    attach('start');attach('end');
  }
  function addTrimHandles(clip,lane,ev){
    if(!ev||ev.timelineAssetKind!=='screen-media')return;
    addTimelineTrimHandles(clip,lane,ev,{startKey:'time',offsetKey:'mediaOffset',sourceDurationKey:'mediaSourceDuration',signatureKey:'media',ensure:ensureMediaEditState,render:renderScreenMediaTrack});
  }
  function addAudioTrimHandles(clip,lane,audioClip){
    addTimelineTrimHandles(clip,lane,audioClip,{startKey:'start',offsetKey:'audioOffset',sourceDurationKey:'audioSourceDuration',signatureKey:'audio',ensure:ensureAudioEditState,render:renderAudioTrack});
  }

  const mediaEditPanel=byId('timelineMediaEditPanel'),splitMediaButton=byId('timelineSplitMediaBtn'),splitMediaControlButton=byId('timelineMediaSplitControlBtn');
  const fadeInEnabled=byId('timelineFadeInEnabled'),fadeInDuration=byId('timelineFadeInDuration'),fadeInDurationValue=byId('timelineFadeInDurationValue');
  const fadeOutEnabled=byId('timelineFadeOutEnabled'),fadeOutDuration=byId('timelineFadeOutDuration'),fadeOutDurationValue=byId('timelineFadeOutDurationValue');
  function syncMediaEditPanel(){
    const ev=selectedMediaEvent(),audioClip=selectedAudioClip(),activeClip=ev||audioClip;
    if(mediaEditPanel)mediaEditPanel.style.display=activeClip?'block':'none';
    if(!activeClip){if(splitMediaButton)splitMediaButton.disabled=true;if(splitMediaControlButton)splitMediaControlButton.disabled=true;return;}
    const panelTitle=mediaEditPanel&&mediaEditPanel.querySelector('h3');
    if(panelTitle)panelTitle.textContent=audioClip&&!ev?'Ausgewähltes Audio':'Ausgewähltes Medium';
    if(splitMediaButton)splitMediaButton.textContent=audioClip&&!ev?'Audio an Markerposition teilen':'An Markerposition teilen';
    const fadeControls=[fadeInEnabled,fadeInDuration,fadeOutEnabled,fadeOutDuration].filter(Boolean);
    fadeControls.forEach(input=>{const label=input.closest&&input.closest('label');if(label)label.style.display=ev?'block':'none';else input.style.display=ev?'':'none';});
    if(fadeInDurationValue&&fadeInDurationValue.parentElement)fadeInDurationValue.parentElement.style.display=ev?'':'none';
    if(fadeOutDurationValue&&fadeOutDurationValue.parentElement)fadeOutDurationValue.parentElement.style.display=ev?'':'none';
    if(ev){
      fadeInEnabled.checked=ev.fadeInEnabled;fadeOutEnabled.checked=ev.fadeOutEnabled;fadeInDuration.value=ev.fadeInDuration;fadeOutDuration.value=ev.fadeOutDuration;
      fadeInDuration.disabled=!ev.fadeInEnabled;fadeOutDuration.disabled=!ev.fadeOutEnabled;
      fadeInDurationValue.textContent=ev.fadeInDuration.toFixed(2)+' s';fadeOutDurationValue.textContent=ev.fadeOutDuration.toFixed(2)+' s';
    }
    const marker=currentTimelineTime(),clipStart=Number(ev?ev.time:audioClip.start)||0,clipDuration=Number(activeClip.duration)||0,disabled=marker<=clipStart+.001||marker>=clipStart+clipDuration-.001;
    if(splitMediaButton)splitMediaButton.disabled=disabled;if(splitMediaControlButton)splitMediaControlButton.disabled=disabled;
  }
  function splitSelectedMedia(){
    const ev=selectedMediaEvent(),marker=currentTimelineTime();if(!ev)return;
    const local=marker-(Number(ev.time)||0),oldDuration=Math.max(.1,Number(ev.duration)||.1);if(local<=.001||local>=oldDuration-.001)return;
    const second={...ev,snapshot:ev.snapshot};second.id='tl_'+Date.now().toString(36)+'_'+Math.floor(Math.random()*999999);second.time=marker;second.duration=oldDuration-local;second.mediaOffset=ev.mediaOffset+local;
    ev.duration=local;timelineState.events.push(second);timelineState.selectedEventId=second.id;lastMediaSignature='';updateTimelineUI();if(window.vseHistory)window.vseHistory.commit();
  }
  function splitSelectedAudio(){
    const clip=selectedAudioClip(),marker=currentTimelineTime();if(!clip)return;
    const local=marker-(Number(clip.start)||0),oldDuration=Math.max(.1,Number(clip.duration)||.1);if(local<=.001||local>=oldDuration-.001)return;
    const second={...clip};second.id='audio_'+Date.now().toString(36)+'_'+Math.floor(Math.random()*999999);second.start=marker;second.duration=oldDuration-local;second.audioOffset=Number(clip.audioOffset||0)+local;
    clip.duration=local;timelineState.audioClips.push(second);timelineState.selectedAudioClipId=second.id;timelineState.selectedEventId=null;lastAudioSignature='';updateTimelineUI();syncMediaTime(currentTimelineTime(),timelineState.playing);if(window.vseHistory)window.vseHistory.commit();
  }
  function splitSelectedTimelineClip(){
    if(selectedAudioClip())splitSelectedAudio();
    else splitSelectedMedia();
  }
  if(splitMediaButton)splitMediaButton.onclick=splitSelectedTimelineClip;
  if(splitMediaControlButton){splitMediaControlButton.disabled=true;splitMediaControlButton.onclick=e=>{e.stopPropagation();splitSelectedTimelineClip();};}
  [[fadeInEnabled,'fadeInEnabled'],[fadeOutEnabled,'fadeOutEnabled']].forEach(([input,key])=>input&&input.addEventListener('input',()=>{const ev=selectedMediaEvent();if(!ev)return;ev[key]=input.checked;syncMediaEditPanel();}));
  [[fadeInDuration,'fadeInDuration'],[fadeOutDuration,'fadeOutDuration']].forEach(([input,key])=>input&&input.addEventListener('input',()=>{const ev=selectedMediaEvent();if(!ev)return;ev[key]=Math.max(0,Number(input.value)||0);syncMediaEditPanel();}));

  let lastAudioSignature='';
  let lastMediaSignature='';
  function renderAudioTrack(){
    const clips=byId('timelineAudioClips'),name=byId('timelineAudioName');
    if(!clips)return;
    const audioClips=timelineState.audioClips||[];
    const active=audioClips.filter(item=>item&&item.active!==false);
    const has=active.length>0;
    const label=has?(active.length===1?active[0].name:(active.length+' Audiodateien')):'Kein Audio';
    const signature=JSON.stringify({duration:duration(),selected:timelineState.selectedAudioClipId,clips:audioClips.map(item=>[item.id,item.name,item.start,item.duration,item.audioOffset,item.audioSourceDuration,item.active,item.objectId])});
    if(signature===lastAudioSignature)return;
    lastAudioSignature=signature;
    clips.innerHTML='';
    if(name)name.textContent=label;
    audioClips.forEach(item=>{
      ensureAudioEditState(item);
      const left=Math.max(0,Math.min(100,(Number(item.start)||0)/duration()*100));
      const width=Math.max(1.2,Math.min(100-left,(Number(item.duration)||5)/duration()*100));
      const clip=addClip(clips,'timelineAudioClip '+(item.id===timelineState.selectedAudioClipId?'isSelected':''),left,width,item.name,formatTimelineTime(item.start)+' · '+formatTimelineTime(item.duration));
      if(clip)clip.dataset.audioClipId=item.id;
      makeTimelineClipDraggable(clip,byId('timelineAudioBar'),()=>item.start,value=>{item.start=value;lastAudioSignature='';syncMediaTime(currentTimelineTime(),timelineState.playing);},item.id,()=>item.duration);
      addAudioTrimHandles(clip,byId('timelineAudioBar'),item);
      if(clip)clip.onclick=event=>{event.stopPropagation();timelineState.selectedCameraMoveId='';window.vseActiveClipboardScope='timeline';timelineState.selectedAudioClipId=item.id;timelineState.selectedEventId=null;lastAudioSignature='';selectTimeline();syncMediaEditPanel();};
    });
  }
  function renderScreenMediaTrack(){
    const clips=byId('timelineScreenMediaClips');
    if(!clips)return;
    const dur=duration();
    const mediaEvents=(timelineState.events||[]).filter(isScreenMediaEvent);
    const screens=objects.filter(o=>o&&o.type==='screen'&&(o.screenMediaType==='image'||o.screenMediaType==='video'));
    const signature=JSON.stringify({dur,selected:timelineState.selectedEventId,events:mediaEvents.map(ev=>[ev.id,ev.time,ev.duration,ev.mediaOffset,ev.mediaSourceDuration,ev.fadeInEnabled,ev.fadeInDuration,ev.fadeOutEnabled,ev.fadeOutDuration,ev.action]),screens:screens.map(o=>[o.id,o.name,o.screenMediaType,o.screenMediaName,finiteDuration(o.screenMediaElement&&o.screenMediaElement.duration,0)])});
    if(signature===lastMediaSignature)return;
    lastMediaSignature=signature;
    clips.innerHTML='';
    mediaEvents.forEach(ev=>{
      ensureMediaEditState(ev);
      const left=Math.max(0,Math.min(100,(Number(ev.time)||0)/dur*100));
      const eventDuration=(Number(ev.duration)||0)>0?Number(ev.duration):5;
      const width=Math.max(1.2,Math.min(100-left,eventDuration>0?eventDuration/dur*100:4));
      const clip=addClip(clips,'timelineScreenClip '+(ev.id===timelineState.selectedEventId?'isSelected':''),left,width,eventLabel(ev),formatTimelineTime(ev.time||0));
      makeTimelineClipDraggable(clip,byId('timelineScreenMediaBar'),()=>ev.time,value=>{ev.time=value;if(ev.timelineAssetKind==='scene')reconcileSceneDurations();lastMediaSignature='';},ev.id,()=>ev.duration);
      addTrimHandles(clip,byId('timelineScreenMediaBar'),ev);
      if(clip)clip.onclick=e=>{e.stopPropagation();timelineState.selectedCameraMoveId='';window.vseActiveClipboardScope='timeline';timelineState.selectedAudioClipId=null;timelineState.selectedEventId=ev.id;selectTimeline();setTimelineEventForm(ev);renderTimelineEvents();syncMediaEditPanel();};
    });
    screens.filter(o=>!(timelineState.events||[]).some(ev=>ev&&ev.timelineAssetKind==='screen-media'&&timelineEventTargetId(ev)===o.id)).forEach(o=>{
      const mediaDuration=o.screenMediaType==='video'&&o.screenMediaElement?finiteDuration(o.screenMediaElement.duration,5):5;
      const clip=addClip(clips,'timelineScreenClip timelineScreenClipPending',0,Math.min(100,mediaDuration/dur*100),(o.name||'Screen')+' · '+(o.screenMediaType==='image'?'Bild':'Video'),(o.screenMediaName||o.name||'Screen-Medium')+' · anklicken zum Bearbeiten');
      if(clip)clip.onclick=event=>{
        event.stopPropagation();
        const ev=createActivationEvent(o,0,Math.max(.1,mediaDuration),'screen-media');
        timelineState.manualDuration=false;
        ev.mediaOffset=0;ev.mediaSourceDuration=Math.max(.1,mediaDuration);ev.fadeInEnabled=false;ev.fadeOutEnabled=false;ev.fadeInDuration=1;ev.fadeOutDuration=1;
        timelineState.selectedCameraMoveId='';window.vseActiveClipboardScope='timeline';timelineState.selectedAudioClipId=null;timelineState.selectedEventId=ev.id;lastMediaSignature='';selectTimeline();setTimelineEventForm(ev);updateTimelineUI();syncMediaEditPanel();
      };
    });
  }

  renderTimelineEvents=function(){
    if(!timelineEventsEl)return;
    const dur=duration();
    timelineEventsEl.innerHTML='';
    (timelineState.events||[]).filter(ev=>!isScreenMediaEvent(ev)&&ev.timelineAssetKind!=='camera').forEach(ev=>{
      const left=Math.max(0,Math.min(100,(Number(ev.time)||0)/dur*100));
      const width=Math.max(1.2,Math.min(100-left,(Number(ev.duration)||0)/dur*100));
      const label=eventLabel(ev);
      const el=addClip(timelineEventsEl,'timelineEvent '+(ev.enabled===false?'off ':'')+(ev.id===timelineState.selectedEventId?'isSelected':''),left,width,label+' · '+(ev.action||'activate'),label+' · '+formatTimelineTime(ev.time||0));
      if(el)el.dataset.eventId=ev.id;
      makeTimelineClipDraggable(el,timelineBar,()=>ev.time,value=>{ev.time=value;timelineState.selectedEventId=ev.id;},ev.id,()=>ev.duration);
      if(el)el.onclick=e=>{e.stopPropagation();timelineState.selectedCameraMoveId='';window.vseActiveClipboardScope='timeline';timelineState.selectedAudioClipId=null;timelineState.selectedEventId=ev.id;selectTimeline();setTimelineEventForm(ev);renderTimelineEvents();};
    });
    renderAudioTrack();
    renderScreenMediaTrack();
  };

  updateTimelineMediaControls=function(){
    const play=byId('timelineMediaPlayBtn'),seek=byId('timelineMediaSeek'),name=byId('timelineMediaName');
    ['timelineMediaPlayBtn','timelineMediaStopBtn','timelineMediaBackBtn','timelineMediaForwardBtn','timelineMediaSeek'].forEach(id=>{const control=byId(id);if(control)control.disabled=false;});
    if(play){
      const iconState=timelineState.playing?'pause':'play';
      if(play.dataset.timelineIcon!==iconState){
        play.innerHTML=iconState==='pause'?'<svg class="timelinePhosphorIcon" data-phosphor-icon="pause" viewBox="0 0 256 256" aria-hidden="true"><rect x="56" y="40" width="56" height="176" rx="8"></rect><rect x="144" y="40" width="56" height="176" rx="8"></rect></svg>':'<svg class="timelinePhosphorIcon" data-phosphor-icon="play" viewBox="0 0 256 256" aria-hidden="true"><polygon points="72 40 216 128 72 216 72 40"></polygon></svg>';
        play.dataset.timelineIcon=iconState;
      }
    }
    if(seek){seek.disabled=false;seek.max=Math.round(duration()*1000);seek.value=Math.round(currentTimelineTime()*1000);}
    if(name)name.textContent=timelineState.playing?'Timeline läuft':'Master-Zeit';
    renderAudioTrack();
    renderScreenMediaTrack();
  };
  updateTimelinePlayhead=function(){
    const t=currentTimelineTime(),left=t/duration()*100+'%';
    if(timelineCurrentTimeEl)timelineCurrentTimeEl.textContent=formatTimelineTime(t);
    [timelinePlayhead,byId('timelineAudioPlayhead'),byId('timelineScreenMediaPlayhead')].forEach(el=>{if(el)el.style.left=left;});
    updateTimelineMediaControls();
    syncMediaEditPanel();
  };

  const oldUpdateTimelineUI=updateTimelineUI;
  updateTimelineUI=function(){
    reconcileSceneDurations();
    const mediaDuration=getTimelineMediaDuration();
    timelineState.duration=!timelineState.manualDuration?(mediaDuration>0?mediaDuration:180):duration();
    timelineState.currentTime=clampTime(timelineState.currentTime);
    oldUpdateTimelineUI();
    renderTimelineEvents();
    updateTimelinePlayhead();
    syncScreenTimelineDurationControl();
    syncMediaEditPanel();
  };

  const previousSelectSingleCore=selectSingleCore;
  selectSingleCore=function(object){const result=previousSelectSingleCore(object);syncScreenTimelineDurationControl(object);return result;};

  function createActivationEvent(target,start,eventDuration,assetKind,targetKind='object'){
    const targetId=typeof target==='string'?target:target.id;
    const ev={
      id:'tl_'+Date.now().toString(36)+'_'+Math.floor(Math.random()*999999),
      objectId:targetId,
      time:start,
      duration:Math.max(0,Number(eventDuration)||0),
      action:'activate',
      enabled:true,
      startActive:false,
      timelineAssetKind:assetKind,
      snapshot:timelineSnapshotTarget(targetKind,targetId)
    };
    if(targetKind==='group'){ev.targetType='group';ev.groupId=targetId;}
    timelineState.events.push(ev);
    resetTimelineBaseSnapshotFor(targetId);
    return ev;
  }
  function installObjectManagerTimelineDrop(){
    if(!timelineBar||timelineBar.dataset.objectManagerDrop==='1')return;
    timelineBar.dataset.objectManagerDrop='1';
    const carriesObject=event=>Array.from(event.dataTransfer&&event.dataTransfer.types||[]).includes('object-id');
    timelineBar.addEventListener('dragover',event=>{
      if(!carriesObject(event))return;
      event.preventDefault();event.stopPropagation();event.dataTransfer.dropEffect='copy';
      timelineBar.classList.add('objectDropTarget');
    });
    timelineBar.addEventListener('dragleave',event=>{
      if(event.relatedTarget&&timelineBar.contains(event.relatedTarget))return;
      timelineBar.classList.remove('objectDropTarget');
    });
    timelineBar.addEventListener('drop',event=>{
      if(!carriesObject(event))return;
      event.preventDefault();event.stopPropagation();timelineBar.classList.remove('objectDropTarget');
      const objectId=event.dataTransfer.getData('object-id');
      const object=objects.find(item=>item&&item.id===objectId);
      if(!object)return;
      const rect=timelineBar.getBoundingClientRect();
      const start=clampTime((event.clientX-rect.left)/Math.max(1,rect.width)*duration());
      const timelineEvent=createActivationEvent(object,start,0,'object','object');
      timelineState.selectedAudioClipId=null;
      timelineState.selectedEventId=timelineEvent.id;
      timelineState.lastClickTime=start;
      selectTimeline();setTimelineEventForm(timelineEvent);updateTimelineUI();
    });
  }
  installObjectManagerTimelineDrop();
  async function addAudioFileToTimeline(file){
    if(!file)return;
    const provisionalDuration=5;
    const start=nextFreeStart('audio',currentTimelineTime(),provisionalDuration);
    const audioObject=newObj('audioSource',50,50);
    applyTypeDefaults(audioObject,'audioSource');
    audioObject.name=(file.name||'Audio').replace(/\.[^.]+$/,'');
    objects.push(audioObject);
    const clip={id:'audio_'+Date.now().toString(36),name:file.name,start,duration:provisionalDuration,audioOffset:0,audioSourceDuration:provisionalDuration,active:true,objectId:audioObject.id,sendToBackbone:false};
    timelineState.audioClips.push(clip);
    try{
      loadAudioSourceFile(audioObject,file);
      clip._element=audioObject.audioSourceElement;
      await new Promise((resolve,reject)=>{
        if(Number.isFinite(clip._element.duration)&&clip._element.duration>0){resolve();return;}
        const done=()=>{cleanup();resolve();},fail=()=>{cleanup();reject(new Error('Audiodatei konnte nicht gelesen werden.'));};
        const cleanup=()=>{clip._element.removeEventListener('loadedmetadata',done);clip._element.removeEventListener('error',fail);};
        clip._element.addEventListener('loadedmetadata',done);clip._element.addEventListener('error',fail);clip._element.load();
      });
      clip.duration=Math.max(.1,Number(clip._element.duration)||provisionalDuration);
      clip.audioSourceDuration=clip.duration;
    }catch(error){
      timelineState.audioClips=timelineState.audioClips.filter(item=>item!==clip);
      releaseAudioSource(audioObject);objects=objects.filter(item=>item!==audioObject);throw error;
    }
    const mediaDuration=clip.duration;
    timelineState.manualDuration=false;
    if(start+mediaDuration>duration())timelineState.duration=Math.ceil(start+mediaDuration);
    lastAudioSignature='';
    select(audioObject);
    seekTimelineMedia(start);
    updateTimelineUI();
  }
  function waitForVideoDuration(video){
    return new Promise(resolve=>{
      const read=()=>finiteDuration(video&&video.duration,0);
      const immediate=read();if(immediate){resolve(immediate);return;}
      let settled=false;
      const finish=value=>{if(settled)return;settled=true;cleanup();resolve(value);};
      const check=()=>{const value=read();if(value)finish(value);};
      const fallback=()=>finish(5);
      const timer=setTimeout(fallback,15000);
      const cleanup=()=>{clearTimeout(timer);video.removeEventListener('loadedmetadata',check);video.removeEventListener('durationchange',check);video.removeEventListener('canplay',check);video.removeEventListener('error',fallback);};
      video.addEventListener('loadedmetadata',check);video.addEventListener('durationchange',check);video.addEventListener('canplay',check);video.addEventListener('error',fallback,{once:true});
      try{video.load();}catch(error){fallback();}
    });
  }
  async function addScreenFileToTimeline(file,type){
    const screen=newObj('screen',50,50);
    screen.name=(type==='image'?'Bildschirm_Bild_':'Bildschirm_Video_')+id;
    objects.push(screen);
    loadScreenMedia(screen,file,type);
    const initialDuration=type==='image'?5:await waitForVideoDuration(screen.screenMediaElement);
    const start=nextFreeStart('media',currentTimelineTime(),initialDuration);
    const ev=createActivationEvent(screen,start,initialDuration,'screen-media');
    timelineState.manualDuration=false;
    ev.mediaOffset=0;ev.mediaSourceDuration=initialDuration;ev.fadeInEnabled=false;ev.fadeOutEnabled=false;ev.fadeInDuration=1;ev.fadeOutDuration=1;
    if(start+initialDuration>duration())timelineState.duration=Math.ceil(start+initialDuration);
    if(type==='image'){
      const reader=new FileReader();
      reader.onload=()=>{
        screen.screenMediaData=reader.result;screen.screenMediaEmbedded=true;
        ev.snapshot=timelineSnapshotTarget('object',screen.id);
        screen._timelineBaseSnapshot=timelineSnapshotObject(screen);
        lastMediaSignature='';updateTimelineUI();
      };
      reader.readAsDataURL(file);
    }
    if(type==='video'&&screen.screenMediaElement){
      screen.screenMediaElement.pause();
      const syncVideoDuration=()=>{
        const actual=finiteDuration(screen.screenMediaElement.duration,0);if(!actual)return;
        const wasUntrimmed=Number(ev.mediaOffset||0)===0&&Math.abs(Number(ev.duration||0)-Number(ev.mediaSourceDuration||0))<.01;
        ev.mediaSourceDuration=Math.max(.1,actual);
        if(wasUntrimmed)ev.duration=ev.mediaSourceDuration;
        if(ev.time+ev.duration>duration())timelineState.duration=Math.ceil(ev.time+ev.duration);
        lastMediaSignature='';updateTimelineUI();syncMediaTime(currentTimelineTime(),timelineState.playing);
      };
      screen.screenMediaElement.addEventListener('durationchange',syncVideoDuration);
    }
    timelineState.selectedEventId=ev.id;
    timelineState.selectedAudioClipId=null;
    lastMediaSignature='';
    select(screen);setTimelineEventForm(ev);updateTimelineUI();
  }
  async function addSceneFileToTimeline(file){
    const text=await file.text();
    const data=JSON.parse(text);
    if(!data||(!Array.isArray(data.objects)&&!data.object&&!(data.background&&data.background.imageData)))throw new Error('Die Datei enthält keine importierbaren Scene-Objekte.');
    const before=new Set(objects.map(object=>object.id));
    if((Array.isArray(data.objects)&&data.objects.length)||data.object)importObjectData(data);
    const imported=objects.filter(object=>!before.has(object.id));
    const sourceObjects=Array.isArray(data.objects)?data.objects:(data.object?[data.object]:[]);
    imported.forEach((object,index)=>{
      const source=sourceObjects[index];
      if(!source)return;
      object.x=Number(source.x||0);
      object.y=Number(source.y||0);
    });
    if(data.background&&data.background.imageData){
      const backgroundAsset=newObj('imageAsset',50,50);
      backgroundAsset.name=((file.name||'Scene').replace(/\.(scene|json|object)$/i,''))+'_Hintergrund';
      backgroundAsset.layer=1;
      backgroundAsset.imageAssetWidth=Number(data.scene&&data.scene.stageWidth)||Number(scene.stageWidth)||1920;
      backgroundAsset.imageAssetHeight=Number(data.scene&&data.scene.stageHeight)||Number(scene.stageHeight)||1080;
      backgroundAsset.imageAssetKeepAspect=false;
      backgroundAsset.imageAssetIgnoreGlobalDimming=true;
      backgroundAsset.imageAssetName=data.background.imageName||backgroundAsset.name;
      backgroundAsset.imageAssetData=data.background.imageData;
      backgroundAsset.imageAssetEmbedded=true;
      const firstImportedIndex=objects.findIndex(object=>imported.includes(object));
      objects.splice(firstImportedIndex>=0?firstImportedIndex:objects.length,0,backgroundAsset);imported.unshift(backgroundAsset);
      loadImageAssetFromData(backgroundAsset,backgroundAsset.imageAssetData,backgroundAsset.imageAssetName);
    }
    if(!imported.length)throw new Error('Die Scene enthält keine Objekte.');
    const sceneDuration=5;
    const start=nextFreeStart('media',currentTimelineTime(),sceneDuration);
    const sceneGroupId='grp_scene_'+id++;
    const sceneGroupName=(file.name||'Scene').replace(/\.(scene|json|object)$/i,'');
    groups.push({id:sceneGroupId,name:sceneGroupName});
    imported.forEach(object=>{object.groupId=sceneGroupId;object.groupName=sceneGroupName;});
    const sceneEvent=createActivationEvent(sceneGroupId,start,sceneDuration,'scene','group');
    timelineState.manualDuration=false;
    if(start+sceneDuration>duration())timelineState.duration=Math.ceil(start+sceneDuration);
    reconcileSceneDurations();
    timelineState.selectedEventId=sceneEvent.id;
    timelineState.selectedAudioClipId=null;
    updateTimelineUI();updateObjectManager();
  }

  function releaseTimelineAssetObject(object){
    if(!object)return;
    if(window.vseHistory)return;
    if(object.type==='screen'&&typeof releaseScreenMedia==='function')releaseScreenMedia(object);
    if(object.type==='imageAsset'&&typeof releaseImageAsset==='function')releaseImageAsset(object);
    if(object.type==='audioSource'&&typeof releaseAudioSource==='function')releaseAudioSource(object);
    if(object.type==='greenscreen'&&typeof releaseGreenscreenMedia==='function')releaseGreenscreenMedia(object);
  }
  function deleteSelectedTimelineAsset(){
    const event=(timelineState.events||[]).find(item=>item.id===timelineState.selectedEventId);
    if(!event&&timelineState.selectedAudioClipId){
      const clip=timelineState.audioClips.find(item=>item.id===timelineState.selectedAudioClipId);
      timelineState.audioClips=timelineState.audioClips.filter(item=>item.id!==timelineState.selectedAudioClipId);
      timelineState.selectedAudioClipId=null;
      if(clip&&clip.objectId){
        const audioObject=objects.find(item=>item.id===clip.objectId);
        const stillUsed=(timelineState.audioClips||[]).some(item=>item&&item.objectId===clip.objectId);
        if(!stillUsed){
          if(audioObject)releaseAudioSource(audioObject);
          objects=objects.filter(item=>item.id!==clip.objectId);selectedIds.delete(clip.objectId);if(selected&&selected.id===clip.objectId)selected=null;
        }
        clip._element=null;
      }else if(clip){
        const runtimeStillUsed=(timelineState.audioClips||[]).some(item=>item&&(item._element&&item._element===clip._element||item._objectUrl&&item._objectUrl===clip._objectUrl));
        if(!runtimeStillUsed)releaseTimelineAudioClip(clip);
      }
      lastAudioSignature='';updateTimelineUI();updateObjectManager();updateHud();return;
    }
    if(!event)return;
    if(event.timelineAssetKind==='screen-media'){
      const targetId=timelineEventTargetId(event),object=objects.find(item=>item.id===targetId);
      const otherSegments=(timelineState.events||[]).some(item=>item!==event&&item.timelineAssetKind==='screen-media'&&timelineEventTargetId(item)===targetId);
      if(!otherSegments){releaseTimelineAssetObject(object);objects=objects.filter(item=>item.id!==targetId);selectedIds.delete(targetId);if(selected&&selected.id===targetId)selected=null;}
    }else if(event.timelineAssetKind==='scene'){
      const groupId=timelineEventTargetId(event),members=objects.filter(item=>item.groupId===groupId);
      members.forEach(releaseTimelineAssetObject);objects=objects.filter(item=>item.groupId!==groupId);groups=groups.filter(group=>group.id!==groupId);members.forEach(item=>selectedIds.delete(item.id));if(selected&&selected.groupId===groupId)selected=null;
    }
    timelineState.events=timelineState.events.filter(item=>item.id!==event.id);
    reconcileSceneDurations();
    timelineState.selectedEventId=null;lastMediaSignature='';
    updateTimelineUI();setTimelineEventForm(null);updateObjectManager();updateHud();
  }
  deleteTimelineEvent=deleteSelectedTimelineAsset;
  window.deleteSelectedTimelineAsset=deleteSelectedTimelineAsset;
  if(timelineDeleteEventBtn){
    timelineDeleteEventBtn.onclick=null;
    timelineDeleteEventBtn.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();deleteSelectedTimelineAsset();},true);
  }

  const audioAddButton=byId('timelineAddAudioBtn');
  const mediaAddButton=byId('timelineAddMediaBtn');
  const objectAddButton=byId('timelineAddObjectBtn');
  const audioFileInput=byId('timelineAudioFileInput');
  const mediaFileInput=byId('timelineMediaFileInput');
  if(audioAddButton&&audioFileInput)audioAddButton.onclick=event=>{event.stopPropagation();audioFileInput.click();};
  if(mediaAddButton&&mediaFileInput)mediaAddButton.onclick=event=>{event.stopPropagation();mediaFileInput.click();};
  if(objectAddButton)objectAddButton.onclick=event=>{
    event.stopPropagation();selectTimeline();timelineState.selectedEventId=null;timelineState.lastClickTime=currentTimelineTime();setTimelineEventForm(null);
    if(timelineEventTime){timelineEventTime.value=timelineState.lastClickTime;if(timelineEventTimeValue)timelineEventTimeValue.textContent=formatTimelineTime(timelineState.lastClickTime);}
  };
  if(audioFileInput)audioFileInput.onchange=async()=>{
    const file=audioFileInput.files&&audioFileInput.files[0];audioFileInput.value='';
    try{await addAudioFileToTimeline(file);}catch(error){console.error(error);alert('Audio konnte nicht zur Timeline hinzugefügt werden: '+error.message);}
  };
  if(mediaFileInput)mediaFileInput.onchange=async()=>{
    const file=mediaFileInput.files&&mediaFileInput.files[0];mediaFileInput.value='';if(!file)return;
    try{
      if(file.type.startsWith('image/'))await addScreenFileToTimeline(file,'image');
      else if(file.type.startsWith('video/'))await addScreenFileToTimeline(file,'video');
      else await addSceneFileToTimeline(file);
    }catch(error){console.error(error);alert('Medium oder Scene konnte nicht hinzugefügt werden: '+error.message);}
  };

  function replaceControl(id){
    const old=byId(id);if(!old)return null;
    const fresh=old.cloneNode(true);old.replaceWith(fresh);return fresh;
  }
  const play=replaceControl('timelineMediaPlayBtn');
  const stop=replaceControl('timelineMediaStopBtn');
  const back=replaceControl('timelineMediaBackBtn');
  const forward=replaceControl('timelineMediaForwardBtn');
  const seek=replaceControl('timelineMediaSeek');
  if(play)play.onclick=()=>{
    if(currentTimelineTime()>=duration())timelineState.currentTime=0;
    timelineState.playing=!timelineState.playing;
    timelineState.lastClockTime=performance.now();
    if(timelineState.playing){
      const ctx=ensureAudio();if(ctx.state==='suspended')ctx.resume().catch(()=>{});
      for(const clip of timelineState.audioClips){
        if(!clip||clip.active===false||!clip._element)continue;
        const audioObject=clip.objectId?objects.find(item=>item.id===clip.objectId):null;
        clip._element.loop=audioObject?!!audioObject.audioSourceLoop:true;
        if(clip.objectId)clip._element.muted=true;
        else if(clip._gainNode)clip._gainNode.gain.value=0;
        if(clip._element.paused)Promise.resolve(clip._element.play()).catch(()=>{});
      }
      const sendsToBackbone=timelineState.audioClips.some(clip=>{
        if(!clip||clip.active===false)return false;
        if(!clip.objectId)return true;
        const object=objects.find(item=>item.id===clip.objectId);
        return !!(object&&object.audioSourceAnalyze);
      });
      if(sendsToBackbone){audioState.enabled=true;audioState.source='timeline';}
      else if(audioState.source==='timeline'){audioState.enabled=false;audioState.source='none';}
    }
    syncMediaTime(currentTimelineTime(),timelineState.playing);
    updateTimelinePlayhead();
  };
  if(stop)stop.onclick=()=>{timelineState.playing=false;seekTimelineMedia(0);syncMediaTime(0,false);};
  if(back)back.onclick=()=>seekTimelineMedia(currentTimelineTime()-5);
  if(forward)forward.onclick=()=>seekTimelineMedia(currentTimelineTime()+5);
  if(seek)seek.oninput=()=>seekTimelineMedia(Number(seek.value||0)/1000);

  [byId('timelineAudioBar'),byId('timelineScreenMediaBar')].forEach(bar=>{
    if(!bar)return;
    bar.onclick=e=>{
      e.stopPropagation();selectTimeline();
      const rect=bar.getBoundingClientRect();
      seekTimelineMedia((e.clientX-rect.left)/Math.max(1,rect.width)*duration());
    };
  });
  if(timelineBar)timelineBar.addEventListener('click',e=>{
    const rect=timelineBar.getBoundingClientRect();
    seekTimelineMedia((e.clientX-rect.left)/Math.max(1,rect.width)*duration());
  });

  function clockFrame(now){
    const delta=Math.min(.25,Math.max(0,(now-(timelineState.lastClockTime||now))/1000));
    timelineState.lastClockTime=now;
    if(timelineState.playing){
      timelineState.currentTime+=delta;
      if(timelineState.currentTime>=duration()){
        timelineState.currentTime=duration();timelineState.playing=false;syncMediaTime(timelineState.currentTime,false);
      }
      if(timelineState.playing)syncMediaTime(timelineState.currentTime,true);
      updateTimelinePlayhead();
    }
    requestAnimationFrame(clockFrame);
  }
  requestAnimationFrame(clockFrame);
  updateTimelineUI();
})();
