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

  viewport.addEventListener('wheel',event=>{
    event.preventDefault();
    const oldZoom=state.zoom;
    let nextZoom=Math.max(.25,Math.min(4,oldZoom*Math.exp(-event.deltaY*.0015)));
    if(Math.abs(nextZoom-1)<.015)nextZoom=1;
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
