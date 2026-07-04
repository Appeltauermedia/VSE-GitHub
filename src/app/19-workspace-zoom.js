(function(){
  const viewport=document.getElementById('workspaceViewport');
  const status=document.getElementById('workspaceZoomStatus');
  if(!viewport||!canvas)return;

  const state={zoom:1,panX:0,panY:0};
  window.workspaceViewState=state;
  const nativeCanvasRect=canvas.getBoundingClientRect.bind(canvas);

  function applyView(){
    viewport.style.setProperty('--workspace-zoom',String(state.zoom));
    viewport.style.setProperty('--workspace-pan-x',state.panX+'px');
    viewport.style.setProperty('--workspace-pan-y',state.panY+'px');
    if(status)status.textContent=Math.round(state.zoom*100)+'%';
    if(typeof positionRecordingHud==='function')positionRecordingHud();
    if(typeof positionStageHudControls==='function')positionStageHudControls();
  }
  function resetView(){state.zoom=1;state.panX=0;state.panY=0;applyView();}
  window.resetWorkspaceZoom=resetView;
  if(status)status.addEventListener('click',resetView);

  viewport.addEventListener('wheel',event=>{
    event.preventDefault();
    const oldZoom=state.zoom;
    const direction=event.deltaY<0?1:-1;
    const nextZoom=Math.max(.2,Math.min(4,Math.round((oldZoom+direction*.1)*10)/10));
    if(nextZoom===oldZoom)return;
    const rect=viewport.getBoundingClientRect();
    const baseLeft=rect.left-state.panX;
    const baseTop=rect.top-state.panY;
    const contentX=(event.clientX-rect.left)/oldZoom;
    const contentY=(event.clientY-rect.top)/oldZoom;
    state.panX=event.clientX-baseLeft-contentX*nextZoom;
    state.panY=event.clientY-baseTop-contentY*nextZoom;
    state.zoom=nextZoom;
    if(nextZoom===1){state.panX=0;state.panY=0;}
    applyView();
  },{passive:false});

  let grab=null;
  function endGrab(event,cancelled=false){
    if(!grab)return;
    const finished=grab;
    grab=null;
    stageWrap.classList.remove('workspaceGrabbing');
    try{if(stageWrap.hasPointerCapture(event.pointerId))stageWrap.releasePointerCapture(event.pointerId);}catch(error){}
    if(!cancelled&&finished.button===0&&!finished.moved&&typeof select==='function')select(null);
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  stageWrap.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    if(event.target!==stageWrap&&!viewport.contains(event.target))return;
    if(event.shiftKey||(typeof waterDrawMode!=='undefined'&&waterDrawMode)||(typeof bgCaptureMode!=='undefined'&&bgCaptureMode))return;
    const rect=viewport.getBoundingClientRect();
    const mx=(event.clientX-rect.left)/Math.max(.001,state.zoom);
    const my=(event.clientY-rect.top)/Math.max(.001,state.zoom);
    const overCanvas=mx>=0&&my>=0&&mx<=canvas.clientWidth&&my<=canvas.clientHeight;
    const object=overCanvas&&typeof hit==='function'?hit(mx,my):null;
    if(object)return;
    grab={pointerId:event.pointerId,button:event.button,startX:event.clientX,startY:event.clientY,panX:state.panX,panY:state.panY,moved:false};
    stageWrap.classList.add('workspaceGrabbing');
    stageWrap.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopImmediatePropagation();
  },{capture:true});
  stageWrap.addEventListener('pointermove',event=>{
    if(!grab||event.pointerId!==grab.pointerId)return;
    const dx=event.clientX-grab.startX,dy=event.clientY-grab.startY;
    if(Math.hypot(dx,dy)>2)grab.moved=true;
    state.panX=grab.panX+dx;
    state.panY=grab.panY+dy;
    applyView();
    event.preventDefault();
    event.stopImmediatePropagation();
  },{capture:true});
  stageWrap.addEventListener('pointerup',event=>{if(grab&&event.pointerId===grab.pointerId)endGrab(event);},{capture:true});
  stageWrap.addEventListener('pointercancel',event=>{if(grab&&event.pointerId===grab.pointerId)endGrab(event,true);},{capture:true});

  // Die bestehenden Objektwerkzeuge erwarten unvergrößerte Canvas-Koordinaten.
  // Während eines Canvas-Pointerevents werden deshalb Clientposition und Rect
  // nur für dessen synchrone Verarbeitung auf die logische Arbeitsfläche abgebildet.
  function normalizeCanvasEvent(event){
    if(state.zoom===1)return;
    const actual=nativeCanvasRect();
    const logicalX=actual.left+(event.clientX-actual.left)/state.zoom;
    const logicalY=actual.top+(event.clientY-actual.top)/state.zoom;
    try{
      Object.defineProperty(event,'clientX',{configurable:true,value:logicalX});
      Object.defineProperty(event,'clientY',{configurable:true,value:logicalY});
    }catch(error){return;}
    const logicalRect=new DOMRect(actual.left,actual.top,canvas.clientWidth,canvas.clientHeight);
    canvas.getBoundingClientRect=()=>logicalRect;
    queueMicrotask(()=>{canvas.getBoundingClientRect=nativeCanvasRect;});
  }
  ['pointerdown','pointermove','drop'].forEach(type=>canvas.addEventListener(type,normalizeCanvasEvent,{capture:true}));
  window.addEventListener('resize',()=>{if(state.zoom===1)return;requestAnimationFrame(applyView);});
  applyView();
})();
