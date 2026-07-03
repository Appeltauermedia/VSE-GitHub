/* ===== Timeline: Mediensteuerung und Auswahl ===== */
function formatTimelineTime(sec){
  const totalHundredths=Math.max(0,Math.round((Number(sec)||0)*100));
  const h=Math.floor(totalHundredths/360000);
  const m=Math.floor((totalHundredths%360000)/6000);
  const s=Math.floor((totalHundredths%6000)/100);
  const hundredths=totalHundredths%100;
  const seconds=String(s).padStart(2,'0')+'.'+String(hundredths).padStart(2,'0');
  return h>0 ? h+':'+String(m).padStart(2,'0')+':'+seconds : String(m).padStart(2,'0')+':'+seconds;
}
function currentTimelineTime(){
  if(audioPlayer&&Number.isFinite(audioPlayer.currentTime)&&audioPlayer.currentTime>0)return audioPlayer.currentTime;
  const videos=objects.filter(o=>o&&o.type==='screen'&&o.screenMediaType==='video'&&o.screenMediaElement&&Number.isFinite(o.screenMediaElement.currentTime));
  if(videos.length)return videos[0].screenMediaElement.currentTime||0;
  return 0;
}
function getTimelineMediaDuration(){
  if(audioPlayer&&Number.isFinite(audioPlayer.duration)&&audioPlayer.duration>0)return audioPlayer.duration;
  const videos=objects.filter(o=>o&&o.type==='screen'&&o.screenMediaType==='video'&&o.screenMediaElement&&Number.isFinite(o.screenMediaElement.duration)&&o.screenMediaElement.duration>0);
  if(videos.length)return videos[0].screenMediaElement.duration;
  return 0;
}
function getTimelineControlledMedia(){
  // Priorität: aktuelle Audiodatei, dann ausgewähltes Screen-Video, dann erstes Screen-Video.
  if(audioPlayer&&audioPlayer.src&&Number.isFinite(audioPlayer.duration)&&audioPlayer.duration>0){
    return {el:audioPlayer,type:'audio',name:(audioTitleState&&audioTitleState.title)||audioFileName?.textContent||'Audio'};
  }
  if(selected&&selected.type==='screen'&&selected.screenMediaType==='video'&&selected.screenMediaElement){
    return {el:selected.screenMediaElement,type:'video',name:selected.screenMediaName||selected.name||'Video'};
  }
  const videoObj=objects.find(o=>o&&o.type==='screen'&&o.screenMediaType==='video'&&o.screenMediaElement);
  if(videoObj)return {el:videoObj.screenMediaElement,type:'video',name:videoObj.screenMediaName||videoObj.name||'Video'};
  return null;
}
function seekTimelineMedia(sec){
  const media=getTimelineControlledMedia();
  if(!media||!media.el)return;
  const dur=Number(media.el.duration)||timelineState.duration||0;
  if(!dur)return;
  media.el.currentTime=Math.max(0,Math.min(dur,Number(sec)||0));
  updateTimelinePlayhead();
}
function updateTimelineMediaControls(){
  const media=getTimelineControlledMedia();
  const el=media&&media.el;
  const dur=el&&Number.isFinite(el.duration)?Number(el.duration):0;
  const cur=el&&Number.isFinite(el.currentTime)?Number(el.currentTime):0;
  const has=!!(el&&dur>0);
  [timelineMediaPlayBtn,timelineMediaStopBtn,timelineMediaBackBtn,timelineMediaForwardBtn,timelineMediaSeek].forEach(x=>{if(x)x.disabled=!has;});
  if(timelineMediaSeek){
    timelineMediaSeek.max=has?Math.round(dur*1000):1000;
    timelineMediaSeek.value=has?Math.round(cur*1000):0;
  }
  if(timelineMediaPlayBtn)timelineMediaPlayBtn.textContent=has&&!el.paused?'⏸':'▶';
  if(timelineMediaName)timelineMediaName.textContent=has?String(media.name||media.type||'Medium'):'Kein Medium';
  if(has&&!timelineState.manualDuration&&Math.abs((timelineState.duration||0)-Math.ceil(dur))>0.5){
    timelineState.duration=Math.max(5,Math.ceil(dur));
    updateTimelineUI();
  }
}
function deselectTimeline(){
  timelineState.selected=false;
  if(timelineDock)timelineDock.classList.remove('isSelected');
  const floatingPanel=document.getElementById('objectTimelineFloatingPanel');
  if(timelineParams&&(!floatingPanel||floatingPanel.hidden))timelineParams.style.display='none';
}
function selectTimeline(){
  const activeEvent=selectedTimelineEvent();
  const eventObject=activeEvent&&timelineObjectsForEvent(activeEvent)[0];
  if(eventObject&&selected!==eventObject)select(eventObject);
  timelineState.selected=true;
  if(timelineDock)timelineDock.classList.add('isSelected');
  if(empty)empty.style.display=selected?'none':'block';
  if(params)params.style.display=selected?'block':'none';
  if(timelineParams)timelineParams.style.display='block';
  if(typeof openObjectTimelineMenu==='function')openObjectTimelineMenu();
  updateTimelineUI();
  setTimelineEventForm(selectedTimelineEvent());
  updateHud();
  updateObjectManager();
}
function useTimelineMediaDurationIfAvailable(force=false){
  const d=getTimelineMediaDuration();
  if(d>0&&(force||!timelineState.manualDuration)){
    timelineState.duration=Math.max(5,Math.ceil(d));
    updateTimelineUI();
    setTimelineEventForm(selectedTimelineEvent());
  }else{
    updateTimelineUI();
  }
}
