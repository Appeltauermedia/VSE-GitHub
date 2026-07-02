/* ===== Stage-Groesse und WebGL-Grundsetup ===== */
function getStageAvailableSize(){
  const wrap=document.getElementById('stageWrap');
  if(document.body.classList.contains('menuless')) return {w:window.innerWidth,h:window.innerHeight};
  const r=wrap.getBoundingClientRect();
  const palette=document.getElementById('objectPalette');
  const timeline=document.getElementById('timelineDock');
  const paletteIsRail=palette&&getComputedStyle(palette).position==='fixed';
  const paletteH=palette&&palette.offsetParent!==null&&!paletteIsRail?palette.getBoundingClientRect().height:0;
  const timelineH=timeline&&timeline.offsetParent!==null?timeline.getBoundingClientRect().height:0;
  const rowGaps=(paletteH>0?10:0)+(timelineH>0?10:0);
  return {w:Math.max(100,r.width-40),h:Math.max(100,r.height-20-paletteH-timelineH-rowGaps)};
}
function applyStageViewSize(){
  const avail=getStageAvailableSize();
  const baseW=Math.max(320,stageState.w||1920);
  const baseH=Math.max(180,stageState.h||1080);
  const scale=Math.min(avail.w/baseW,avail.h/baseH);
  document.documentElement.style.setProperty('--stage-view-w',Math.max(1,Math.round(baseW*scale))+'px');
  document.documentElement.style.setProperty('--stage-view-h',Math.max(1,Math.round(baseH*scale))+'px');
}
function resize(){
  applyStageViewSize();
  // Die CSS-Größe ist nur die Vorschau. Gerendert wird mindestens in der
  // gewählten Projektauflösung, damit Screens, Medien und Text beim Skalieren
  // sowie bei Screenshots nicht an die kleine Editoransicht gebunden sind.
  const maxSize=gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)||4096;
  let renderW=Math.max(Math.floor(canvas.clientWidth*DPR),Math.round(Number(stageState.w)||1920));
  let renderH=Math.max(Math.floor(canvas.clientHeight*DPR),Math.round(Number(stageState.h)||1080));
  const limit=Math.min(1,maxSize/Math.max(renderW,renderH));
  renderW=Math.max(1,Math.floor(renderW*limit));
  renderH=Math.max(1,Math.floor(renderH*limit));
  if(canvas.width!==renderW)canvas.width=renderW;
  if(canvas.height!==renderH)canvas.height=renderH;
  gl.viewport(0,0,canvas.width,canvas.height);
  if(typeof positionRecordingHud==='function')positionRecordingHud();
  if(typeof positionStageHudControls==='function')positionStageHudControls();
}
window.addEventListener('resize',resize); requestAnimationFrame(resize);
