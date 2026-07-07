/* ===== Timeline V3: interne Master-Zeit und drei getrennte Spuren ===== */
(function(){
  const byId=id=>document.getElementById(id);
  const duration=()=>Math.max(5,Number(timelineState.duration)||180);
  const clampTime=value=>Math.max(0,Math.min(duration(),Number(value)||0));
  const mediaElements=()=>{
    const list=[];
    if(audioPlayer&&audioPlayer.src)list.push(audioPlayer);
    objects.filter(o=>o&&o.type==='screen'&&o.screenMediaType==='video'&&o.screenMediaElement).forEach(o=>list.push(o.screenMediaElement));
    return [...new Set(list)];
  };

  timelineState.manualDuration=timelineState.manualDuration!==false;
  timelineState.currentTime=clampTime(timelineState.currentTime);
  timelineState.playing=false;
  timelineState.lastClockTime=performance.now();

  currentTimelineTime=function(){return clampTime(timelineState.currentTime);};
  getTimelineMediaDuration=function(){
    const lengths=[];
    if(audioPlayer&&Number.isFinite(audioPlayer.duration)&&audioPlayer.duration>0)lengths.push(audioPlayer.duration);
    objects.filter(o=>o&&o.type==='screen'&&o.screenMediaType==='video'&&o.screenMediaElement&&Number.isFinite(o.screenMediaElement.duration)&&o.screenMediaElement.duration>0).forEach(o=>lengths.push(o.screenMediaElement.duration));
    return lengths.length?Math.max(...lengths):0;
  };

  function syncMediaTime(time,play){
    for(const el of mediaElements()){
      const mediaDuration=Number(el.duration)||0;
      if(mediaDuration>0&&Math.abs((Number(el.currentTime)||0)-Math.min(time,mediaDuration))>.2){
        try{el.currentTime=Math.min(time,mediaDuration);}catch(error){}
      }
      if(play&&time<mediaDuration){
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
    const snaps=ev.snapshot.type==='group'?(ev.snapshot.objects||[]).map(x=>x&&x.snapshot):[ev.snapshot];
    return snaps.some(s=>s&&s.type==='screen'&&(s.screenMediaType==='image'||s.screenMediaType==='video'));
  }
  function eventLabel(ev){
    return timelineTargetLabel(timelineEventTargetKind(ev),timelineEventTargetId(ev));
  }
  function addClip(container,classes,left,width,label,title){
    if(!container)return null;
    const clip=document.createElement('div');
    clip.className='timelineClip '+classes;
    clip.style.left=left+'%';clip.style.width=width+'%';clip.textContent=label;clip.title=title||label;
    container.appendChild(clip);
    return clip;
  }

  let lastAudioSignature='';
  let lastMediaSignature='';
  function renderAudioTrack(){
    const clips=byId('timelineAudioClips'),name=byId('timelineAudioName');
    if(!clips)return;
    const has=audioPlayer&&audioPlayer.src&&Number.isFinite(audioPlayer.duration)&&audioPlayer.duration>0;
    const label=has?((audioTitleState&&audioTitleState.title)||audioFileName?.textContent||'Audio'):'Kein Audio';
    const signature=[has,label,has?audioPlayer.duration:0,duration()].join('|');
    if(signature===lastAudioSignature)return;
    lastAudioSignature=signature;
    clips.innerHTML='';
    if(name)name.textContent=label;
    if(has)addClip(clips,'timelineAudioClip',0,Math.min(100,audioPlayer.duration/duration()*100),label,formatTimelineTime(audioPlayer.duration));
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
      const width=Math.max(1.2,Math.min(100-left,(Number(ev.duration)||0)>0?Number(ev.duration)/dur*100:4));
      const clip=addClip(clips,'timelineScreenClip',left,width,eventLabel(ev),formatTimelineTime(ev.time||0));
      if(clip)clip.onclick=e=>{e.stopPropagation();timelineState.selectedEventId=ev.id;selectTimeline();setTimelineEventForm(ev);renderTimelineEvents();};
    });
    if(mediaEvents.length)return;
    screens.forEach(o=>{
      const mediaDuration=o.screenMediaType==='video'&&o.screenMediaElement?Number(o.screenMediaElement.duration)||dur:dur;
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
      if(el)el.onclick=e=>{e.stopPropagation();timelineState.selectedEventId=ev.id;selectTimeline();setTimelineEventForm(ev);renderTimelineEvents();};
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
    timelineState.duration=duration();
    timelineState.currentTime=clampTime(timelineState.currentTime);
    oldUpdateTimelineUI();
    renderTimelineEvents();
    updateTimelinePlayhead();
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
      updateTimelinePlayhead();
    }
    requestAnimationFrame(clockFrame);
  }
  requestAnimationFrame(clockFrame);
  updateTimelineUI();
})();
