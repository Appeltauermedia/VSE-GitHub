(function(){
  const viewport=document.getElementById('workspaceViewport');
  const status=document.getElementById('workspaceZoomStatus');
  if(!viewport||!canvas)return;

  scene.cameraZoom=Math.max(.2,Math.min(10,Number(scene.cameraZoom)||1));
  scene.cameraPanX=Math.max(-2,Math.min(2,Number(scene.cameraPanX)||0));
  scene.cameraPanY=Math.max(-2,Math.min(2,Number(scene.cameraPanY)||0));
  const state={zoom:scene.cameraZoom,panX:scene.cameraPanX,panY:scene.cameraPanY};
  window.workspaceViewState=state;

  function syncStateFromScene(){
    state.zoom=Math.max(.2,Math.min(10,Number(scene.cameraZoom)||1));
    state.panX=Math.max(-2,Math.min(2,Number(scene.cameraPanX)||0));
    state.panY=Math.max(-2,Math.min(2,Number(scene.cameraPanY)||0));
  }
  function applyView(){
    syncStateFromScene();
    const w=Math.max(1,viewport.clientWidth),h=Math.max(1,viewport.clientHeight);
    const overlayX=(1-state.zoom)*w*.5+state.panX*w;
    const overlayY=(1-state.zoom)*h*.5+state.panY*h;
    viewport.style.setProperty('--workspace-zoom',String(state.zoom));
    viewport.style.setProperty('--workspace-pan-x',overlayX+'px');
    viewport.style.setProperty('--workspace-pan-y',overlayY+'px');
    if(status)status.textContent=Math.round(state.zoom*100)+'%';
    if(typeof positionRecordingHud==='function')positionRecordingHud();
    if(typeof positionStageHudControls==='function')positionStageHudControls();
    if(typeof showTransformFrameForSelection==='function')showTransformFrameForSelection();
  }
  function setView(zoom,panX,panY){
    scene.cameraZoom=Math.max(.2,Math.min(10,Number(zoom)||1));
    scene.cameraPanX=Math.max(-2,Math.min(2,Number(panX)||0));
    scene.cameraPanY=Math.max(-2,Math.min(2,Number(panY)||0));
    applyView();
  }
  function resetView(){setView(1,0,0);}
  window.resetWorkspaceZoom=resetView;
  window.syncWorkspaceView=applyView;
  if(status)status.addEventListener('click',resetView);

  let ctrlNavigation=false;
  function syncNavigationCursor(){
    const cutting=typeof bgCaptureMode!=='undefined'&&bgCaptureMode;
    stageWrap.classList.toggle('workspaceCtrlNavigation',ctrlNavigation&&!cutting);
  }
  window.syncWorkspaceNavigationCursor=syncNavigationCursor;
  window.addEventListener('keydown',event=>{
    if(event.key!=='Control')return;
    ctrlNavigation=true;syncNavigationCursor();
  });
  window.addEventListener('keyup',event=>{
    if(event.key!=='Control')return;
    ctrlNavigation=false;syncNavigationCursor();
  });
  window.addEventListener('blur',()=>{ctrlNavigation=false;syncNavigationCursor();});

  function viewportPoint(event){
    const rect=viewport.getBoundingClientRect();
    return {x:(event.clientX-rect.left)/Math.max(1,rect.width)-.5,y:(event.clientY-rect.top)/Math.max(1,rect.height)-.5,rect};
  }
  function scenePoint(event){
    const p=viewportPoint(event);
    return {
      x:((p.x-state.panX)/state.zoom+.5)*canvas.clientWidth,
      y:((p.y-state.panY)/state.zoom+.5)*canvas.clientHeight
    };
  }
  function canvasRectToViewportRect(x,y,w,h){
    syncStateFromScene();
    const vw=Math.max(1,viewport.clientWidth),vh=Math.max(1,viewport.clientHeight);
    return {
      x:(1-state.zoom)*vw*.5+state.panX*vw+Number(x||0)*state.zoom,
      y:(1-state.zoom)*vh*.5+state.panY*vh+Number(y||0)*state.zoom,
      w:Math.max(0,Number(w||0)*state.zoom),
      h:Math.max(0,Number(h||0)*state.zoom)
    };
  }
  window.workspaceCanvasRectToViewportRect=canvasRectToViewportRect;
  viewport.addEventListener('wheel',event=>{
    if(!event.ctrlKey)return;
    event.preventDefault();
    syncStateFromScene();
    const direction=event.deltaY<0?1:-1;
    const nextZoom=Math.max(.2,Math.min(10,Math.round((state.zoom+direction*.1)*10)/10));
    if(nextZoom===state.zoom)return;
    const p=viewportPoint(event);
    const sourceX=(p.x-state.panX)/state.zoom;
    const sourceY=(p.y-state.panY)/state.zoom;
    setView(nextZoom,p.x-sourceX*nextZoom,p.y-sourceY*nextZoom);
  },{passive:false});

  let grab=null;
  function endGrab(event,cancelled=false){
    if(!grab)return;
    const finished=grab;grab=null;
    stageWrap.classList.remove('workspaceGrabbing');
    try{if(stageWrap.hasPointerCapture(event.pointerId))stageWrap.releasePointerCapture(event.pointerId);}catch(error){}
    if(!cancelled&&!finished.moved&&typeof select==='function')select(null);
    event.preventDefault();event.stopImmediatePropagation();
  }
  stageWrap.addEventListener('pointerdown',event=>{
    if(event.button!==0||!event.ctrlKey)return;
    if(event.target!==stageWrap&&!viewport.contains(event.target))return;
    if(event.shiftKey||(typeof waterDrawMode!=='undefined'&&waterDrawMode)||(typeof bgCaptureMode!=='undefined'&&bgCaptureMode))return;
    syncStateFromScene();
    grab={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,panX:state.panX,panY:state.panY,moved:false};
    stageWrap.classList.add('workspaceGrabbing');stageWrap.setPointerCapture(event.pointerId);
    event.preventDefault();event.stopImmediatePropagation();
  },{capture:true});
  stageWrap.addEventListener('pointermove',event=>{
    if(!grab||event.pointerId!==grab.pointerId)return;
    const rect=viewport.getBoundingClientRect();
    const dx=event.clientX-grab.startX,dy=event.clientY-grab.startY;
    if(Math.hypot(dx,dy)>2)grab.moved=true;
    setView(state.zoom,grab.panX+dx/Math.max(1,rect.width),grab.panY+dy/Math.max(1,rect.height));
    event.preventDefault();event.stopImmediatePropagation();
  },{capture:true});
  stageWrap.addEventListener('pointerup',event=>{if(grab&&event.pointerId===grab.pointerId)endGrab(event);},{capture:true});
  stageWrap.addEventListener('pointercancel',event=>{if(grab&&event.pointerId===grab.pointerId)endGrab(event,true);},{capture:true});

  function normalizeCanvasEvent(event){
    syncStateFromScene();
    if(state.zoom===1&&state.panX===0&&state.panY===0)return;
    const actual=canvas.getBoundingClientRect();
    const point=scenePoint(event);
    try{
      Object.defineProperty(event,'clientX',{configurable:true,value:actual.left+point.x});
      Object.defineProperty(event,'clientY',{configurable:true,value:actual.top+point.y});
    }catch(error){}
  }
  ['pointerdown','pointermove','drop'].forEach(type=>canvas.addEventListener(type,normalizeCanvasEvent,{capture:true}));
  window.addEventListener('resize',()=>requestAnimationFrame(applyView));
  syncNavigationCursor();
  applyView();
})();
