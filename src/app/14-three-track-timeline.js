/* ===== Timeline V3: interne Master-Zeit und drei getrennte Spuren ===== */
(function(){
  const byId=id=>document.getElementById(id);
  const createObjectWithDefaults=newObj;
  newObj=function(type,x,y){const object=createObjectWithDefaults(type,x,y);if(object&&object.type==='screen')object.screenFlipX=false;return object;};
  const duration=()=>Math.max(5,Number(timelineState.duration)||180);
  const clampTime=value=>Math.max(0,Math.min(duration(),Number(value)||0));
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
    element.preload='auto';element.src=objectUrl;element.volume=audioVolume?Number(audioVolume.value||1):1;
    clip._element=element;clip._objectUrl=objectUrl;
    await new Promise((resolve,reject)=>{
      const done=()=>{cleanup();resolve();};
      const fail=()=>{cleanup();reject(new Error('Audiodatei konnte nicht gelesen werden.'));};
      const cleanup=()=>{element.removeEventListener('loadedmetadata',done);element.removeEventListener('error',fail);};
      element.addEventListener('loadedmetadata',done);element.addEventListener('error',fail);element.load();
    });
    clip.duration=Math.max(.1,Number(element.duration)||5);
    clip._sourceNode=ctx.createMediaElementSource(element);
    clip._gainNode=ctx.createGain();clip._gainNode.gain.value=1;
    clip._sourceNode.connect(clip._gainNode);
    clip._gainNode.connect(ctx.destination);
    clip._gainNode.connect(analyser);
    if(recordingAudioDest)clip._gainNode.connect(recordingAudioDest);
    return clip;
  }
  const mediaElements=()=>{
    const list=[];
    timelineState.audioClips.filter(clip=>clip&&clip.active!==false&&clip._element).forEach(clip=>list.push({el:clip._element,start:Number(clip.start)||0,duration:Number(clip.duration)||Number(clip._element.duration)||0,clip}));
    objects.filter(o=>o&&o.type==='screen'&&o.screenMediaType==='video'&&o.screenMediaElement).forEach(o=>{
      const ev=(timelineState.events||[]).find(item=>item&&timelineEventTargetId(item)===o.id&&isScreenMediaEvent(item));
      list.push({el:o.screenMediaElement,start:Number(ev&&ev.time)||0,duration:Number(o.screenMediaElement.duration)||Number(ev&&ev.duration)||0});
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
    if(audioPlayer&&Number.isFinite(audioPlayer.duration)&&audioPlayer.duration>0){const clip=timelineState.audioClips[0];lengths.push((Number(clip&&clip.start)||0)+audioPlayer.duration);}
    objects.filter(o=>o&&o.type==='screen'&&o.screenMediaType==='video'&&o.screenMediaElement&&Number.isFinite(o.screenMediaElement.duration)&&o.screenMediaElement.duration>0).forEach(o=>{const ev=(timelineState.events||[]).find(item=>item&&timelineEventTargetId(item)===o.id&&isScreenMediaEvent(item));lengths.push((Number(ev&&ev.time)||0)+o.screenMediaElement.duration);});
    return lengths.length?Math.max(...lengths):0;
  };

  function syncMediaTime(time,play){
    for(const item of mediaElements()){
      const el=item.el,mediaDuration=Number(item.duration)||Number(el.duration)||0;
      const localTime=time-Number(item.start||0);
      const inRange=localTime>=0&&(!mediaDuration||localTime<mediaDuration);
      const target=Math.max(0,Math.min(localTime,mediaDuration||localTime));
      if(inRange&&Math.abs((Number(el.currentTime)||0)-target)>.2){
        try{el.currentTime=target;}catch(error){}
      }
      if(item.clip){
        if(item.clip._gainNode)item.clip._gainNode.gain.value=play&&inRange?1:0;
        if(play){if(el.paused)Promise.resolve(el.play()).catch(()=>{});}
        else if(!el.paused)el.pause();
      }else if(play&&inRange){
        if(el.paused)Promise.resolve(el.play()).catch(()=>{});
      }else if(!el.paused){el.pause();}
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
  function makeTimelineClipDraggable(clip,lane,getStart,setStart){
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
        setStart(clampTime(originTime+delta));
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

  let lastAudioSignature='';
  let lastMediaSignature='';
  function renderAudioTrack(){
    const clips=byId('timelineAudioClips'),name=byId('timelineAudioName');
    if(!clips)return;
    const audioClips=timelineState.audioClips||[];
    const active=audioClips.filter(item=>item&&item.active!==false);
    const has=active.length>0;
    const label=has?(active.length===1?active[0].name:(active.length+' Audiodateien')):'Kein Audio';
    const signature=JSON.stringify({duration:duration(),clips:audioClips.map(item=>[item.id,item.name,item.start,item.duration,item.active])});
    if(signature===lastAudioSignature)return;
    lastAudioSignature=signature;
    clips.innerHTML='';
    if(name)name.textContent=label;
    audioClips.forEach(item=>{
      const left=Math.max(0,Math.min(100,(Number(item.start)||0)/duration()*100));
      const width=Math.max(1.2,Math.min(100-left,(Number(item.duration)||5)/duration()*100));
      const clip=addClip(clips,'timelineAudioClip',left,width,item.name,formatTimelineTime(item.start)+' · '+formatTimelineTime(item.duration));
      makeTimelineClipDraggable(clip,byId('timelineAudioBar'),()=>item.start,value=>{item.start=value;lastAudioSignature='';syncMediaTime(currentTimelineTime(),timelineState.playing);});
      if(clip)clip.onclick=event=>{event.stopPropagation();timelineState.selectedAudioClipId=item.id;timelineState.selectedEventId=null;selectTimeline();};
    });
  }
  function renderScreenMediaTrack(){
    const clips=byId('timelineScreenMediaClips');
    if(!clips)return;
    const dur=duration();
    const mediaEvents=(timelineState.events||[]).filter(isScreenMediaEvent);
    const screens=objects.filter(o=>o&&o.type==='screen'&&(o.screenMediaType==='image'||o.screenMediaType==='video'));
    const signature=JSON.stringify({dur,events:mediaEvents.map(ev=>[ev.id,ev.time,ev.duration,ev.action]),screens:screens.map(o=>[o.id,o.name,o.screenMediaType,o.screenMediaName,Number(o.screenMediaElement&&o.screenMediaElement.duration)||0])});
    if(signature===lastMediaSignature)return;
    lastMediaSignature=signature;
    clips.innerHTML='';
    mediaEvents.forEach(ev=>{
      const left=Math.max(0,Math.min(100,(Number(ev.time)||0)/dur*100));
      const eventDuration=(Number(ev.duration)||0)>0?Number(ev.duration):5;
      const width=Math.max(1.2,Math.min(100-left,eventDuration>0?eventDuration/dur*100:4));
      const clip=addClip(clips,'timelineScreenClip',left,width,eventLabel(ev),formatTimelineTime(ev.time||0));
      makeTimelineClipDraggable(clip,byId('timelineScreenMediaBar'),()=>ev.time,value=>{ev.time=value;if(ev.timelineAssetKind==='scene')reconcileSceneDurations();lastMediaSignature='';});
      if(clip)clip.onclick=e=>{e.stopPropagation();timelineState.selectedAudioClipId=null;timelineState.selectedEventId=ev.id;selectTimeline();setTimelineEventForm(ev);renderTimelineEvents();};
    });
    if(mediaEvents.length)return;
    screens.forEach(o=>{
      const mediaDuration=o.screenMediaType==='video'&&o.screenMediaElement?Number(o.screenMediaElement.duration)||dur:5;
      addClip(clips,'timelineScreenClip',0,Math.min(100,mediaDuration/dur*100),(o.name||'Screen')+' · '+(o.screenMediaType==='image'?'Bild':'Video'),o.screenMediaName||o.name||'Screen-Medium');
    });
  }

  renderTimelineEvents=function(){
    if(!timelineEventsEl)return;
    const dur=duration();
    timelineEventsEl.innerHTML='';
    (timelineState.events||[]).filter(ev=>!isScreenMediaEvent(ev)).forEach(ev=>{
      const left=Math.max(0,Math.min(100,(Number(ev.time)||0)/dur*100));
      const width=Math.max(1.2,Math.min(100-left,(Number(ev.duration)||0)/dur*100));
      const label=eventLabel(ev);
      const el=addClip(timelineEventsEl,'timelineEvent '+(ev.enabled===false?'off ':'')+(ev.id===timelineState.selectedEventId?'isSelected':''),left,width,label+' · '+(ev.action||'activate'),label+' · '+formatTimelineTime(ev.time||0));
      makeTimelineClipDraggable(el,timelineBar,()=>ev.time,value=>{ev.time=value;timelineState.selectedEventId=ev.id;});
      if(el)el.onclick=e=>{e.stopPropagation();timelineState.selectedAudioClipId=null;timelineState.selectedEventId=ev.id;selectTimeline();setTimelineEventForm(ev);renderTimelineEvents();};
    });
    renderAudioTrack();
    renderScreenMediaTrack();
  };

  updateTimelineMediaControls=function(){
    const play=byId('timelineMediaPlayBtn'),seek=byId('timelineMediaSeek'),name=byId('timelineMediaName');
    ['timelineMediaPlayBtn','timelineMediaStopBtn','timelineMediaBackBtn','timelineMediaForwardBtn','timelineMediaSeek'].forEach(id=>{const control=byId(id);if(control)control.disabled=false;});
    if(play)play.textContent=timelineState.playing?'⏸':'▶';
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
  };

  const oldUpdateTimelineUI=updateTimelineUI;
  updateTimelineUI=function(){
    reconcileSceneDurations();
    timelineState.duration=duration();
    timelineState.currentTime=clampTime(timelineState.currentTime);
    oldUpdateTimelineUI();
    renderTimelineEvents();
    updateTimelinePlayhead();
    syncScreenTimelineDurationControl();
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
  async function addAudioFileToTimeline(file){
    if(!file)return;
    const provisionalDuration=5;
    const start=nextFreeStart('audio',currentTimelineTime(),provisionalDuration);
    const clip={id:'audio_'+Date.now().toString(36),name:file.name,start,duration:provisionalDuration,active:true};
    timelineState.audioClips.push(clip);
    try{await createTimelineAudioRuntime(file,clip);}catch(error){timelineState.audioClips=timelineState.audioClips.filter(item=>item!==clip);releaseTimelineAudioClip(clip);throw error;}
    const mediaDuration=clip.duration;
    timelineState.manualDuration=true;
    if(start+mediaDuration>duration())timelineState.duration=Math.ceil(start+mediaDuration);
    lastAudioSignature='';
    seekTimelineMedia(start);
    updateTimelineUI();
  }
  function addScreenFileToTimeline(file,type){
    const screen=newObj('screen',50,50);
    screen.name=(type==='image'?'Bildschirm_Bild_':'Bildschirm_Video_')+id;
    objects.push(screen);
    loadScreenMedia(screen,file,type);
    const initialDuration=type==='image'?5:Math.max(5,Number(screen.screenMediaElement&&screen.screenMediaElement.duration)||5);
    const start=nextFreeStart('media',currentTimelineTime(),initialDuration);
    const ev=createActivationEvent(screen,start,initialDuration,'screen-media');
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
      screen.screenMediaElement.addEventListener('loadedmetadata',()=>{
        ev.duration=Math.max(.1,Number(screen.screenMediaElement.duration)||initialDuration);
        if(ev.time+ev.duration>duration())timelineState.duration=Math.ceil(ev.time+ev.duration);
        lastMediaSignature='';updateTimelineUI();syncMediaTime(currentTimelineTime(),timelineState.playing);
      },{once:true});
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
    if(start+sceneDuration>duration())timelineState.duration=Math.ceil(start+sceneDuration);
    reconcileSceneDurations();
    timelineState.selectedEventId=sceneEvent.id;
    timelineState.selectedAudioClipId=null;
    updateTimelineUI();updateObjectManager();
  }

  function releaseTimelineAssetObject(object){
    if(!object)return;
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
      if(clip)releaseTimelineAudioClip(clip);
      lastAudioSignature='';updateTimelineUI();return;
    }
    if(!event)return;
    if(event.timelineAssetKind==='screen-media'){
      const targetId=timelineEventTargetId(event),object=objects.find(item=>item.id===targetId);
      releaseTimelineAssetObject(object);objects=objects.filter(item=>item.id!==targetId);selectedIds.delete(targetId);if(selected&&selected.id===targetId)selected=null;
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
      if(file.type.startsWith('image/'))addScreenFileToTimeline(file,'image');
      else if(file.type.startsWith('video/'))addScreenFileToTimeline(file,'video');
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
        clip._element.loop=true;
        if(clip._gainNode)clip._gainNode.gain.value=0;
        if(clip._element.paused)Promise.resolve(clip._element.play()).catch(()=>{});
      }
      audioState.enabled=true;audioState.source='timeline';
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
