(function(){
  const panel=document.getElementById('objectTimelineFloatingPanel');
  const opener=document.getElementById('objectTimelineMenuBtn');
  const header=document.getElementById('objectTimelineFloatingHeader');
  const minimize=document.getElementById('objectTimelineFloatingMinimize');
  const close=document.getElementById('objectTimelineFloatingClose');
  const body=document.getElementById('objectTimelineFloatingBody');
  const subtitle=document.getElementById('objectTimelineFloatingSubtitle');
  if(!panel||!opener||!header||!minimize||!close||!body||!timelineParams)return;

  body.appendChild(timelineParams);
  const positionKey='vse.objectTimelineFloatingPosition';
  const minimizedKey='vse.objectTimelineFloatingMinimized';

  function currentObject(){return selected&&objects.includes(selected)?selected:null;}
  function eventForObject(object){
    if(!object)return null;
    return (timelineState.events||[]).find(ev=>ev&&timelineObjectsForEvent(ev).some(item=>item.id===object.id))||null;
  }
  function clampPosition(left,top){
    const margin=8;
    return {left:Math.max(margin,Math.min(left,window.innerWidth-panel.offsetWidth-margin)),top:Math.max(52,Math.min(top,window.innerHeight-panel.offsetHeight-margin))};
  }
  function restorePosition(){
    try{
      const saved=JSON.parse(localStorage.getItem(positionKey)||'null');
      if(saved&&Number.isFinite(saved.left)&&Number.isFinite(saved.top)){
        const p=clampPosition(saved.left,saved.top);
        panel.style.left=p.left+'px';panel.style.top=p.top+'px';panel.style.right='auto';
      }
    }catch(e){}
  }
  window.syncObjectTimelineMenuSelection=function(){
    const object=currentObject();
    window.objectTimelineMenuObjectId=object?object.id:'';
    if(!panel.hidden)window.objectTimelineEditingObjectId=object?object.id:'';
    if(subtitle)subtitle.textContent=object?(object.name||objectShortName(object)):'Kein Objekt ausgewählt';
    if(!object){
      timelineState.selectedEventId=null;
      setTimelineEventForm(null);updateTimelineEventList();
      return;
    }
    updateTimelineObjectOptions();
    if(timelineEventObject)timelineEventObject.value=object.id;
    let event=selectedTimelineEvent();
    if(!event||!timelineObjectsForEvent(event).some(item=>item.id===object.id))event=eventForObject(object);
    timelineState.selectedEventId=event?event.id:null;
    setTimelineEventForm(event);
    if(!event&&timelineEventObject)timelineEventObject.value=object.id;
    updateTimelineEventList();renderTimelineEvents();
  };
  window.openObjectTimelineMenu=function(){
    if(!currentObject())return;
    window.objectTimelineEditingObjectId=currentObject().id;
    panel.hidden=false;
    opener.setAttribute('aria-expanded','true');
    timelineParams.style.display='block';
    restorePosition();syncObjectTimelineMenuSelection();
  };
  function setOpen(open){
    if(open&&!currentObject())return;
    panel.hidden=!open;
    opener.setAttribute('aria-expanded',open?'true':'false');
    if(open)openObjectTimelineMenu();
    else window.objectTimelineEditingObjectId='';
  }
  function setMinimized(minimized){
    panel.classList.toggle('isMinimized',minimized);
    minimize.setAttribute('aria-pressed',minimized?'true':'false');
    minimize.title=minimized?'Timelineeinstellungen wiederherstellen':'Timelineeinstellungen minimieren';
    minimize.setAttribute('aria-label',minimize.title);
    try{localStorage.setItem(minimizedKey,minimized?'1':'0');}catch(e){}
    if(!panel.hidden&&panel.style.left){
      const rect=panel.getBoundingClientRect(),p=clampPosition(rect.left,rect.top);
      panel.style.left=p.left+'px';panel.style.top=p.top+'px';panel.style.right='auto';
    }
  }
  let initiallyMinimized=false;
  try{initiallyMinimized=localStorage.getItem(minimizedKey)==='1';}catch(e){}
  setMinimized(initiallyMinimized);
  opener.addEventListener('click',()=>setOpen(panel.hidden));
  minimize.addEventListener('click',()=>setMinimized(!panel.classList.contains('isMinimized')));
  close.addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)setOpen(false);});

  header.addEventListener('pointerdown',event=>{
    if(event.button!==0||event.target.closest('button'))return;
    const rect=panel.getBoundingClientRect(),offsetX=event.clientX-rect.left,offsetY=event.clientY-rect.top;
    header.setPointerCapture(event.pointerId);
    const move=moveEvent=>{
      const p=clampPosition(moveEvent.clientX-offsetX,moveEvent.clientY-offsetY);
      panel.style.left=p.left+'px';panel.style.top=p.top+'px';panel.style.right='auto';
    };
    const end=()=>{
      header.removeEventListener('pointermove',move);header.removeEventListener('pointerup',end);header.removeEventListener('pointercancel',end);
      try{localStorage.setItem(positionKey,JSON.stringify({left:parseFloat(panel.style.left),top:parseFloat(panel.style.top)}));}catch(e){}
    };
    header.addEventListener('pointermove',move);header.addEventListener('pointerup',end);header.addEventListener('pointercancel',end);
  });
  window.addEventListener('resize',()=>{
    if(panel.hidden||!panel.style.left)return;
    const p=clampPosition(parseFloat(panel.style.left)||0,parseFloat(panel.style.top)||52);
    panel.style.left=p.left+'px';panel.style.top=p.top+'px';
  });
})();
