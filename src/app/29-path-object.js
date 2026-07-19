(function(){
  'use strict';

  const PATH_TYPE='path';
  const PANEL_ID='pathObjectFloatingPanel';
  const OVERLAY_ID='pathEditorOverlay';
  const LS_KEY='vse-path-panel-state';
  const PATH_ICON='<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M208 32a32 32 0 0 0-31 24.1c-35.6 2.5-54.7 25.5-71.7 46.1C88.8 122.1 74.5 139.3 48 143.5V112a8 8 0 0 0-16 0v72a8 8 0 0 0 8 8h72a8 8 0 0 0 0-16H54.4c30.7-5.8 47.6-26.1 63.2-45 16-19.3 31.2-37.6 59.4-40.7A32 32 0 1 0 208 32Zm0 48a16 16 0 1 1 16-16 16 16 0 0 1-16 16Z"/></svg>';
  let panel=null;
  let overlay=null;
  let drawing=false;
  let installed=false;
  let rafStarted=false;

  function hasGlobals(){
    return typeof objects!=='undefined'&&typeof newObj==='function'&&typeof selectSingleCore==='function';
  }

  function selectedPath(){
    if(typeof selected==='undefined'||!selected||selected.type!==PATH_TYPE)return null;
    ensurePathDefaults(selected);
    return selected;
  }

  function pathObjects(){
    if(typeof objects==='undefined')return [];
    return objects.filter(o=>o&&o.type===PATH_TYPE);
  }

  function ensurePathDefaults(o){
    if(!o||o.type!==PATH_TYPE)return o;
    if(!Array.isArray(o.pathObjectIds))o.pathObjectIds=[];
    if(!Array.isArray(o.pathPoints))o.pathPoints=[];
    if(o.pathMode!=='freehand'&&o.pathMode!=='line')o.pathMode='line';
    if(!Number.isFinite(Number(o.pathStartX)))o.pathStartX=-220;
    if(!Number.isFinite(Number(o.pathStartY)))o.pathStartY=0;
    if(!Number.isFinite(Number(o.pathEndX)))o.pathEndX=220;
    if(!Number.isFinite(Number(o.pathEndY)))o.pathEndY=0;
    if(!Number.isFinite(Number(o.pathDuration))||Number(o.pathDuration)<=0)o.pathDuration=8;
    if(typeof o.pathLoop!=='boolean')o.pathLoop=true;
    if(typeof o.pathPingPong!=='boolean')o.pathPingPong=false;
    if(typeof o.pathRotateObjects!=='boolean')o.pathRotateObjects=false;
    if(typeof o.pathResetOnComplete!=='boolean')o.pathResetOnComplete=false;
    if(typeof o.pathDampingEnabled!=='boolean')o.pathDampingEnabled=false;
    if(!Number.isFinite(Number(o.pathDamping)))o.pathDamping=0.45;
    if(typeof o.pathRunning!=='boolean')o.pathRunning=false;
    if(!o.pathStartPoses||typeof o.pathStartPoses!=='object')o.pathStartPoses={};
    if(typeof o.pathCompleted!=='boolean')o.pathCompleted=false;
    if(!o.pathMemberOffsets||typeof o.pathMemberOffsets!=='object')o.pathMemberOffsets={};
    if(o.pathMemberOffsetUnits!=='stage'){
      const size=pathStageSize();
      for(const id of Object.keys(o.pathMemberOffsets)){
        const offset=o.pathMemberOffsets[id]||{x:0,y:0};
        o.pathMemberOffsets[id]={x:Number(offset.x||0)/100*size.w,y:Number(offset.y||0)/100*size.h};
      }
      o.pathMemberOffsetUnits='stage';
    }
    if(!o.pathMemberGroupIds||typeof o.pathMemberGroupIds!=='object')o.pathMemberGroupIds={};
    if(!o.pathMemberGroupBaseAngles||typeof o.pathMemberGroupBaseAngles!=='object')o.pathMemberGroupBaseAngles={};
    const defaultGroupBaseAngle=0;
    for(const id of Object.keys(o.pathMemberGroupIds)){
      if(!Number.isFinite(Number(o.pathMemberGroupBaseAngles[id])))o.pathMemberGroupBaseAngles[id]=defaultGroupBaseAngle;
    }
    if(!o.pathRotationOffsets||typeof o.pathRotationOffsets!=='object')o.pathRotationOffsets={};
    if(!o.pathLastAngles||typeof o.pathLastAngles!=='object')o.pathLastAngles={};
    if(!o.pathLastRotations||typeof o.pathLastRotations!=='object')o.pathLastRotations={};
    if(!o.pathSmoothedMembers||typeof o.pathSmoothedMembers!=='object')o.pathSmoothedMembers={};
    if(!Number.isFinite(Number(o.pathMarkerOpacity)))o.pathMarkerOpacity=Number.isFinite(Number(o.opacity))?Number(o.opacity):0.35;
    o.opacity=Math.max(0,Math.min(1,Number(o.pathMarkerOpacity)));
    if(!Number.isFinite(Number(o.pathRuntimeStart)))o.pathRuntimeStart=performance.now()/1000;
    for(const id of o.pathObjectIds){
      if(!o.pathMemberOffsets[id])o.pathMemberOffsets[id]={x:0,y:0};
    }
    if(!o.name||/^Objekt_/.test(o.name))o.name='Pfad_'+String(o.id||'').slice(-4);
    return o;
  }

  function esc(v){
    return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function objectById(id){
    return (typeof objects!=='undefined')?objects.find(o=>o&&o.id===id):null;
  }

  function objectName(o){
    if(!o)return 'Unbekannt';
    return o.name||o.label||o.type||o.id;
  }

  function addPaletteTool(){
    const palette=document.getElementById('objectPalette');
    if(!palette||palette.querySelector('.tool[data-type="path"]'))return;
    const tool=document.createElement('div');
    tool.className='tool';
    tool.draggable=true;
    tool.dataset.type=PATH_TYPE;
    tool.title='Pfad';
    tool.innerHTML='<b><span class="ico">'+PATH_ICON+'</span><span class="txt">Pfad</span></b><small>Objekte entlang eines Pfades bewegen</small>';
    tool.addEventListener('dragstart',ev=>{
      ev.dataTransfer.effectAllowed='copy';
      ev.dataTransfer.setData('text/plain',PATH_TYPE);
    });
    tool.addEventListener('click',()=>{
      if(typeof spawnPaletteObject==='function')spawnPaletteObject(PATH_TYPE,50,50);
    });
    palette.appendChild(tool);
    if(typeof initPaletteDrag==='function')initPaletteDrag();
  }

  function addTypeOption(){
    const select=document.getElementById('pType');
    if(!select||select.querySelector('option[value="path"]'))return;
    const opt=document.createElement('option');
    opt.value=PATH_TYPE;
    opt.textContent='Pfad';
    const particle=select.querySelector('option[value="particle"]');
    select.insertBefore(opt,particle||null);
  }

  function injectStyles(){
    if(document.getElementById('pathObjectStyles'))return;
    const style=document.createElement('style');
    style.id='pathObjectStyles';
    style.textContent=`
      #${PANEL_ID}{position:fixed;right:24px;top:116px;width:330px;max-height:calc(100vh - 150px);z-index:44;background:#141820;color:#e8edf6;border:1px solid rgba(170,190,220,.24);box-shadow:0 18px 45px rgba(0,0,0,.42);border-radius:8px;overflow:hidden;font:12px/1.35 system-ui,Segoe UI,sans-serif}
      #${PANEL_ID}.isCollapsed{height:auto}
      #${PANEL_ID}.isCollapsed .pathPanelBody{display:none}
      #${PANEL_ID} .pathPanelHead{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 10px;border-bottom:1px solid rgba(170,190,220,.18);background:#1b202a;cursor:move}
      #${PANEL_ID} .pathPanelTitle{font-weight:700}
      #${PANEL_ID} .pathPanelSub{font-size:11px;color:#9ca9ba}
      #${PANEL_ID} .pathPanelActions{display:flex;gap:6px}
      #${PANEL_ID} button{border:1px solid rgba(170,190,220,.22);background:#222936;color:#e8edf6;border-radius:6px;padding:5px 8px;font:inherit;cursor:pointer}
      #${PANEL_ID} button:hover{background:#2b3444}
      #${PANEL_ID} .pathPanelBody{padding:10px;display:grid;gap:10px;overflow:auto;max-height:calc(100vh - 210px)}
      #${PANEL_ID} .pathGroup{display:grid;gap:7px;padding:8px;border:1px solid rgba(170,190,220,.16);border-radius:7px;background:#11161e}
      #${PANEL_ID} .pathGroupTitle{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#9ca9ba}
      #${PANEL_ID} label{display:grid;grid-template-columns:112px 1fr;align-items:center;gap:8px;color:#cbd5e4}
      #${PANEL_ID} input,#${PANEL_ID} select{min-width:0;background:#0c1118;color:#eef3fb;border:1px solid rgba(170,190,220,.24);border-radius:5px;padding:5px 6px;font:inherit}
      #${PANEL_ID} input[type="range"]{padding:0}
      #${PANEL_ID} input[type="checkbox"]{justify-self:start}
      #${PANEL_ID} .pathInline{display:grid;grid-template-columns:1fr 72px;gap:7px}
      #${PANEL_ID} .pathDrop{border:1px dashed rgba(130,210,255,.45);border-radius:7px;padding:10px;text-align:center;color:#9ccfe9;background:rgba(42,136,190,.08)}
      #${PANEL_ID} .pathDrop.isOver{background:rgba(42,136,190,.18);border-color:#7fd8ff}
      #${PANEL_ID} .pathItem{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 7px;border-radius:6px;background:#1a202b}
      #${PANEL_ID} .pathItem span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      #${PANEL_ID} .pathDrawActive{outline:2px solid #7fd8ff;background:#23394b}
      #${OVERLAY_ID}{position:absolute;pointer-events:none;z-index:7;overflow:visible}
    `;
    document.head.appendChild(style);
  }

  function createPanel(){
    if(panel)return panel;
    injectStyles();
    panel=document.createElement('section');
    panel.id=PANEL_ID;
    panel.hidden=true;
    panel.innerHTML=`
      <div class="pathPanelHead">
        <div><div class="pathPanelTitle">Pfad</div><div class="pathPanelSub">Kein Pfad ausgewählt</div></div>
        <div class="pathPanelActions"><button type="button" data-path-collapse>–</button><button type="button" data-path-close>×</button></div>
      </div>
      <div class="pathPanelBody">
        <div class="pathGroup">
          <div class="pathGroupTitle">Pfadinhalt</div>
          <div class="pathDrop">Objekte aus dem Objektmanager hier ablegen</div>
          <div class="pathItemList"></div>
        </div>
        <div class="pathGroup">
          <div class="pathGroupTitle">Geometrie</div>
          <label>Modus<select data-path-field="pathMode"><option value="line">Start-Ende</option><option value="freehand">Freihand</option></select></label>
          <label>Start X<div class="pathInline"><input type="range" min="-1200" max="1200" step="1" data-path-range="pathStartX"><input type="number" step="1" data-path-field="pathStartX"></div></label>
          <label>Start Y<div class="pathInline"><input type="range" min="-800" max="800" step="1" data-path-range="pathStartY"><input type="number" step="1" data-path-field="pathStartY"></div></label>
          <label>Ende X<div class="pathInline"><input type="range" min="-1200" max="1200" step="1" data-path-range="pathEndX"><input type="number" step="1" data-path-field="pathEndX"></div></label>
          <label>Ende Y<div class="pathInline"><input type="range" min="-800" max="800" step="1" data-path-range="pathEndY"><input type="number" step="1" data-path-field="pathEndY"></div></label>
          <button type="button" data-path-draw>Freihand zeichnen</button>
        </div>
        <div class="pathGroup">
          <div class="pathGroupTitle">Ablauf</div>
          <label>Dauer<div class="pathInline"><input type="range" min="0.5" max="3600" step="0.1" data-path-range="pathDuration"><input type="number" min="0.5" max="3600" step="0.1" data-path-field="pathDuration"></div></label>
          <label>Marker-Transparenz<div class="pathInline"><input type="range" min="0" max="1" step="0.01" data-path-range="pathMarkerOpacity"><input type="number" min="0" max="1" step="0.01" data-path-field="pathMarkerOpacity"></div></label>
          <label>Loop<input type="checkbox" data-path-field="pathLoop"></label>
          <label>Ping-Pong<input type="checkbox" data-path-field="pathPingPong"></label>
          <label>Objektrotation<input type="checkbox" data-path-field="pathRotateObjects"></label>
          <label>Nach Ablauf zur Startposition<input type="checkbox" data-path-field="pathResetOnComplete"></label>
          <label>Dämpfung<input type="checkbox" data-path-field="pathDampingEnabled"></label>
          <label>Dämpfungsstärke<div class="pathInline"><input type="range" min="0" max="0.95" step="0.01" data-path-range="pathDamping"><input type="number" min="0" max="0.95" step="0.01" data-path-field="pathDamping"></div></label>
          <button type="button" data-path-toggle-run>Start</button>
          <button type="button" data-path-resettime>Zeit neu starten</button>
        </div>
      </div>`;
    document.body.appendChild(panel);
    wirePanel(panel);
    restorePanelState();
    return panel;
  }

  function wirePanel(el){
    const head=el.querySelector('.pathPanelHead');
    let drag=null;
    head.addEventListener('pointerdown',ev=>{
      if(ev.target.closest('button'))return;
      drag={x:ev.clientX,y:ev.clientY,left:el.offsetLeft,top:el.offsetTop};
      head.setPointerCapture(ev.pointerId);
    });
    head.addEventListener('pointermove',ev=>{
      if(!drag)return;
      el.style.left=Math.max(8,drag.left+ev.clientX-drag.x)+'px';
      el.style.right='auto';
      el.style.top=Math.max(8,drag.top+ev.clientY-drag.y)+'px';
    });
    head.addEventListener('pointerup',()=>{drag=null;savePanelState();});
    el.querySelector('[data-path-collapse]').addEventListener('click',()=>{
      el.classList.toggle('isCollapsed');
      savePanelState();
    });
    el.querySelector('[data-path-close]').addEventListener('click',()=>{el.hidden=true;});
    el.querySelectorAll('[data-path-field]').forEach(input=>{
      input.addEventListener('input',()=>writeField(input.dataset.pathField,input));
      input.addEventListener('change',()=>writeField(input.dataset.pathField,input));
    });
    el.querySelectorAll('[data-path-range]').forEach(input=>{
      input.addEventListener('input',()=>writeRange(input.dataset.pathRange,input.value));
    });
    el.querySelector('[data-path-resettime]').addEventListener('click',()=>{
      const p=selectedPath();if(!p)return;
      p.pathRuntimeStart=performance.now()/1000;
      p.pathPausedAt=performance.now()/1000;
      p.pathCompleted=false;
      p.pathSmoothedMembers={};
      if(p.pathRunning)capturePathStartPoses(p);
    });
    el.querySelector('[data-path-toggle-run]').addEventListener('click',()=>{
      const p=selectedPath();if(!p)return;
      togglePathRunning(p);
      syncPanel();
    });
    el.querySelector('[data-path-draw]').addEventListener('click',()=>{
      const p=selectedPath();if(!p)return;
      p.pathMode='freehand';
      p.pathPoints=[];
      drawing=!drawing;
      syncPanel();
    });
    const drop=el.querySelector('.pathDrop');
    drop.addEventListener('dragover',ev=>{
      if(acceptsPathContentDrag(ev)){ev.preventDefault();ev.dataTransfer.dropEffect='copy';drop.classList.add('isOver');}
    });
    drop.addEventListener('dragleave',()=>drop.classList.remove('isOver'));
    drop.addEventListener('drop',ev=>{
      const payload=readDroppedPathContent(ev);
      if(!payload.id)return;
      ev.preventDefault();
      drop.classList.remove('isOver');
      addPathContentToSelectedPath(payload);
    });
    el.querySelector('.pathPanelBody').addEventListener('dragover',ev=>{
      if(acceptsPathContentDrag(ev)){ev.preventDefault();ev.dataTransfer.dropEffect='copy';}
    });
    el.querySelector('.pathPanelBody').addEventListener('drop',ev=>{
      const payload=readDroppedPathContent(ev);
      if(!payload.id)return;
      ev.preventDefault();
      drop.classList.remove('isOver');
      addPathContentToSelectedPath(payload);
    });
  }

  function savePanelState(){
    if(!panel)return;
    try{localStorage.setItem(LS_KEY,JSON.stringify({left:panel.style.left,top:panel.style.top,collapsed:panel.classList.contains('isCollapsed')}));}catch(_){}
  }

  function restorePanelState(){
    if(!panel)return;
    try{
      const s=JSON.parse(localStorage.getItem(LS_KEY)||'{}');
      if(s.left)panel.style.left=s.left;
      if(s.top)panel.style.top=s.top;
      if(s.left)panel.style.right='auto';
      if(s.collapsed)panel.classList.add('isCollapsed');
    }catch(_){}
  }

  function readDroppedObjectId(ev){
    const dt=ev.dataTransfer;
    if(!dt)return '';
    const direct=dt.getData('object-id');
    if(direct)return direct;
    const text=dt.getData('text/plain')||'';
    return text.startsWith('object:')?text.slice(7):'';
  }

  function readDroppedGroupId(ev){
    const dt=ev.dataTransfer;
    if(!dt)return '';
    const direct=dt.getData('group-id');
    if(direct)return direct;
    const text=dt.getData('text/plain')||'';
    return text.startsWith('group:')?text.slice(6):'';
  }

  function readDroppedPathContent(ev){
    const objectId=readDroppedObjectId(ev);
    if(objectId)return {type:'object',id:objectId};
    const groupId=readDroppedGroupId(ev);
    if(groupId)return {type:'group',id:groupId};
    return {type:'',id:''};
  }

  function acceptsPathContentDrag(ev){
    if(!selectedPath()||!ev.dataTransfer)return false;
    const types=Array.from(ev.dataTransfer.types||[]);
    return types.includes('object-id')||types.includes('group-id')||types.includes('text/plain')||types.includes('Text');
  }

  function addPathContentToSelectedPath(payload){
    if(!payload||!payload.id)return;
    if(payload.type==='group')addGroupToSelectedPath(payload.id);
    else addObjectToSelectedPath(payload.id);
  }

  function addGroupToSelectedPath(groupId){
    const p=selectedPath();
    if(!p||typeof objects==='undefined')return;
    const members=objects.filter(o=>o&&o.groupId===groupId&&o.type!==PATH_TYPE&&o.id!==p.id);
    if(!members.length)return;
    const center=groupAreaCentroid(members);
    const size=pathStageSize();
    members.forEach(o=>addObjectToSelectedPath(o.id,{silent:true,offsetX:(Number(o.x||0)-center.x)/100*size.w,offsetY:(Number(o.y||0)-center.y)/100*size.h,groupId,baseAngle:0}));
    p.pathRuntimeStart=performance.now()/1000;
    syncPanel();
    if(typeof updateObjectManager==='function')updateObjectManager();
  }

  function groupAreaCentroid(members){
    let sx=0,sy=0,total=0;
    for(const o of members){
      const area=pathObjectArea(o);
      sx+=Number(o.x||0)*area;
      sy+=Number(o.y||0)*area;
      total+=area;
    }
    if(total>0)return {x:sx/total,y:sy/total};
    const fallback=members.reduce((acc,o)=>({x:acc.x+Number(o.x||0),y:acc.y+Number(o.y||0)}),{x:0,y:0});
    return {x:fallback.x/Math.max(1,members.length),y:fallback.y/Math.max(1,members.length)};
  }

  function pathStageSize(){
    return {
      w:Math.max(1,Number((typeof stageState!=='undefined'&&stageState.w)||scene.stageWidth||1920)),
      h:Math.max(1,Number((typeof stageState!=='undefined'&&stageState.h)||scene.stageHeight||1080))
    };
  }

  function defaultPathBaseAngle(path){
    if(!path)return 0;
    if(path.pathMode==='freehand'&&Array.isArray(path.pathPoints)&&path.pathPoints.length>1){
      const a=path.pathPoints[0],b=path.pathPoints[1];
      return Math.atan2(Number(b.y||0)-Number(a.y||0),Number(b.x||0)-Number(a.x||0));
    }
    return Math.atan2(Number(path.pathEndY||0)-Number(path.pathStartY||0),Number(path.pathEndX||0)-Number(path.pathStartX||0));
  }

  function pathObjectArea(o){
    const size=pathStageSize();
    let w=Number(o.size||44),h=Number(o.size||44);
    if(o.type==='screen'||o.type==='text'){w=Number(o.screenWidth||260);h=Number(o.screenHeight||120);}
    else if(o.type==='imageAsset'){
      if(typeof imageAssetRenderSize==='function'){
        const ps=imageAssetRenderSize(o);w=Number(ps.w||o.imageAssetWidth||240);h=Number(ps.h||o.imageAssetHeight||160);
      }else{w=Number(o.imageAssetWidth||240);h=Number(o.imageAssetHeight||160);}
    }
    else if(o.type==='greenscreen'){
      if(typeof getGreenscreenRenderSize==='function'){
        const gs=getGreenscreenRenderSize(o);w=Number(gs.w||o.greenscreenWidth||480);h=Number(gs.h||o.greenscreenHeight||270);
      }else{w=Number(o.greenscreenWidth||480);h=Number(o.greenscreenHeight||270);}
    }
    else if(o.type==='waterSurface'||o.type==='waterFlowOverlay'){w=Number(o.waterWidth||420);h=Number(o.waterHeight||180);}
    else if(o.type==='mandalaVisualizer'){w=Number(o.mandalaObjWidth||420);h=Number(o.mandalaObjHeight||420);}
    else if(o.type==='visualizer'){w=Number(o.visualizerWidth||520);h=Number(o.visualizerHeight||180);}
    else if(o.type==='lightbar'){w=Number(o.lightbarLength||320);h=Math.max(12,Number(o.size||56)*0.18);}
    else if(o.type==='particle'&&(o.particleEmitterShape||'point')==='line'){w=Math.max(12,Number(o.size||72)*0.12);h=Number(o.particleEmitterLength||120);}
    else if(o.type==='light'&&(o.lightEmitterShape||'point')==='line'){w=Math.max(12,Number(o.size||44)*0.24);h=Number(o.lightEmitterLength||240);}
    const percentW=Math.max(0.001,w/size.w*100);
    const percentH=Math.max(0.001,h/size.h*100);
    return percentW*percentH;
  }

  function addObjectToSelectedPath(id){
    const options=arguments[1]||{};
    const p=selectedPath();
    const target=objectById(id);
    if(!p||!target||target.id===p.id||target.type===PATH_TYPE)return;
    ensurePathDefaults(p);
    if(!p.pathObjectIds.includes(id))p.pathObjectIds.push(id);
    p.pathMemberOffsets[id]={
      x:Number(options.offsetX)||0,
      y:Number(options.offsetY)||0
    };
    p.pathMemberOffsetUnits='stage';
    if(options.groupId)p.pathMemberGroupIds[id]=options.groupId;
    else delete p.pathMemberGroupIds[id];
    if(options.groupId)p.pathMemberGroupBaseAngles[id]=Number(options.baseAngle)||0;
    else delete p.pathMemberGroupBaseAngles[id];
    p.pathRotationOffsets[id]=Number(target.rotation||0);
    p.pathLastAngles[id]=0;
    p.pathLastRotations[id]=Number(target.rotation||0);
    p.pathRuntimeStart=performance.now()/1000;
    if(!options.silent){
      syncPanel();
      if(typeof updateObjectManager==='function')updateObjectManager();
    }
  }

  function writeRange(field,value){
    const input=panel&&panel.querySelector(`[data-path-field="${field}"]`);
    if(input)input.value=value;
    writeField(field,{type:'number',value});
  }

  function writeField(field,input){
    const p=selectedPath();if(!p)return;
    let value=input.type==='checkbox'?input.checked:input.value;
    if(['pathStartX','pathStartY','pathEndX','pathEndY','pathDuration','pathMarkerOpacity','pathDamping'].includes(field))value=Number(value);
    p[field]=value;
    if(field==='pathMarkerOpacity')p.opacity=Math.max(0,Math.min(1,Number(value)||0));
    if(field==='pathMode'&&value==='line')drawing=false;
    if(field==='pathDuration'){p.pathRuntimeStart=performance.now()/1000;p.pathCompleted=false;}
    if(field==='pathDampingEnabled'||field==='pathDamping')p.pathSmoothedMembers={};
    if(field==='pathRotateObjects'&&value)resetPathRotationTracking(p);
    syncPanel(false);
  }

  function syncPanel(refreshValues=true){
    createPanel();
    const p=selectedPath();
    panel.hidden=!p;
    drawing=drawing&&!!p&&p.pathMode==='freehand';
    if(!p)return;
    ensurePathDefaults(p);
    panel.querySelector('.pathPanelSub').textContent=objectName(p);
    if(refreshValues){
      panel.querySelectorAll('[data-path-field]').forEach(input=>{
        const v=p[input.dataset.pathField];
        if(input.type==='checkbox')input.checked=!!v;
        else input.value=v;
      });
      panel.querySelectorAll('[data-path-range]').forEach(input=>{
        input.value=p[input.dataset.pathRange];
      });
    }
    const drawBtn=panel.querySelector('[data-path-draw]');
    drawBtn.classList.toggle('pathDrawActive',drawing);
    drawBtn.textContent=drawing?'Freihand: Punkte aufnehmen':'Freihand zeichnen';
    const runBtn=panel.querySelector('[data-path-toggle-run]');
    if(runBtn)runBtn.textContent=p.pathRunning?'Stop':'Start';
    const list=panel.querySelector('.pathItemList');
    list.innerHTML='';
    const ids=p.pathObjectIds.filter(id=>objectById(id)&&id!==p.id);
    p.pathObjectIds=ids;
    if(!ids.length){
      list.innerHTML='<div class="pathItem"><span>Noch keine Objekte im Pfad</span></div>';
    }else{
      ids.forEach((id,idx)=>{
        const item=document.createElement('div');
        item.className='pathItem';
        item.innerHTML=`<span>${idx+1}. ${esc(objectName(objectById(id)))}</span><button type="button">Entfernen</button>`;
        item.querySelector('button').addEventListener('click',()=>{
          p.pathObjectIds=p.pathObjectIds.filter(x=>x!==id);
          delete p.pathMemberOffsets[id];
          delete p.pathMemberGroupIds[id];
          delete p.pathMemberGroupBaseAngles[id];
          delete p.pathRotationOffsets[id];
          delete p.pathLastAngles[id];
          delete p.pathLastRotations[id];
          if(p.pathStartPoses)delete p.pathStartPoses[id];
          if(p.pathSmoothedMembers)delete p.pathSmoothedMembers[id];
          syncPanel();
        });
        list.appendChild(item);
      });
    }
  }

  function installSelectionHook(){
    const base=selectSingleCore;
    if(base.__pathHooked)return;
    const wrapped=function(o){
      const result=base.apply(this,arguments);
      syncPanel();
      return result;
    };
    wrapped.__pathHooked=true;
    selectSingleCore=wrapped;
  }

  function installNewObjectHook(){
    const base=newObj;
    if(base.__pathHooked)return;
    const wrapped=function(type,x,y){
      const o=base.apply(this,arguments);
      if(type===PATH_TYPE)ensurePathDefaults(o);
      return o;
    };
    wrapped.__pathHooked=true;
    newObj=wrapped;
  }

  function installLabelHooks(){
    if(typeof objectTypeLabel==='function'&&!objectTypeLabel.__pathHooked){
      const base=objectTypeLabel;
      const wrapped=function(type){return type===PATH_TYPE?'Pfad':base.apply(this,arguments);};
      wrapped.__pathHooked=true;
      objectTypeLabel=wrapped;
    }
    if(typeof objectTypeIconMarkup==='function'&&!objectTypeIconMarkup.__pathHooked){
      const base=objectTypeIconMarkup;
      const wrapped=function(type){
        if(type===PATH_TYPE)return '<span class="omIcon">'+PATH_ICON+'</span>';
        return base.apply(this,arguments);
      };
      wrapped.__pathHooked=true;
      objectTypeIconMarkup=wrapped;
    }
  }

  function installObjectManagerHook(){
    if(typeof updateObjectManager!=='function'||updateObjectManager.__pathHooked)return;
    const base=updateObjectManager;
    const wrapped=function(){
      const result=base.apply(this,arguments);
      appendPathRowsToObjectManager();
      return result;
    };
    wrapped.__pathHooked=true;
    updateObjectManager=wrapped;
  }

  function appendPathRowsToObjectManager(){
    if(typeof objectManager==='undefined'||!objectManager)return;
    enableGroupDragRows();
    const paths=pathObjects();
    if(!paths.length||objectManager.querySelector('[data-path-object-section]'))return;
    const section=document.createElement('div');
    section.dataset.pathObjectSection='1';
    section.innerHTML=`<div class="omSubSection">Pfad · ${paths.length}</div>`;
    paths.forEach(o=>{
      const row=document.createElement('div');
      row.className='omRow '+((typeof selectedIds!=='undefined'&&selectedIds.has(o.id))?'isSelected':'');
      row.draggable=true;
      row.title='In die Objektspur der Timeline ziehen';
      row.innerHTML=`<div><b><span class="omIcon">${PATH_ICON}</span>${esc(objectName(o))}</b><div class="omMeta">Layer ${Number(o.layer??1)}</div></div><button type="button" data-oid="${esc(o.id)}">Auswählen</button>`;
      row.addEventListener('dragstart',ev=>{
        ev.dataTransfer.effectAllowed='copy';
        ev.dataTransfer.setData('object-id',o.id);
        ev.dataTransfer.setData('text/plain','object:'+o.id);
      });
      row.querySelector('button').addEventListener('click',()=>selectSingleCore(o));
      section.appendChild(row);
    });
    objectManager.appendChild(section);
  }

  function enableGroupDragRows(){
    if(typeof objectManager==='undefined'||!objectManager)return;
    objectManager.querySelectorAll('button[data-gid]').forEach(btn=>{
      const row=btn.closest('.omRow');
      if(!row||row.__pathGroupDragEnabled)return;
      row.__pathGroupDragEnabled=true;
      row.draggable=true;
      row.title='Gruppe in einen Pfad ziehen';
      row.addEventListener('dragstart',ev=>{
        ev.dataTransfer.effectAllowed='copy';
        ev.dataTransfer.setData('group-id',btn.dataset.gid);
        ev.dataTransfer.setData('text/plain','group:'+btn.dataset.gid);
      });
    });
  }

  function installRuntimeHook(){
    if(typeof updateVseFrame!=='function'||updateVseFrame.__pathHooked)return;
    if(updateVseFrame.__pathMotionIntegrated)return;
    const base=updateVseFrame;
    const wrapped=function(){
      updatePathObjectMotion();
      return base.apply(this,arguments);
    };
    wrapped.__pathHooked=true;
    updateVseFrame=wrapped;
  }

  function samplePath(path,phase){
    ensurePathDefaults(path);
    if(path.pathMode==='freehand'&&path.pathPoints.length>1)return samplePolyline(path.pathPoints,phase);
    const sx=Number(path.pathStartX),sy=Number(path.pathStartY),ex=Number(path.pathEndX),ey=Number(path.pathEndY);
    return {x:sx+(ex-sx)*phase,y:sy+(ey-sy)*phase,angle:Math.atan2(ey-sy,ex-sx)};
  }

  function samplePolyline(points,phase){
    const clean=points.filter(p=>Number.isFinite(Number(p.x))&&Number.isFinite(Number(p.y)));
    if(clean.length<2)return {x:0,y:0,angle:0};
    let total=0;
    const segs=[];
    for(let i=1;i<clean.length;i++){
      const a=clean[i-1],b=clean[i];
      const len=Math.hypot(b.x-a.x,b.y-a.y);
      if(len>0.1){segs.push({a,b,len});total+=len;}
    }
    if(!segs.length)return {x:clean[0].x,y:clean[0].y,angle:0};
    let dist=Math.max(0,Math.min(1,phase))*total;
    for(const s of segs){
      if(dist<=s.len){
        const t=dist/s.len;
        return {x:s.a.x+(s.b.x-s.a.x)*t,y:s.a.y+(s.b.y-s.a.y)*t,angle:Math.atan2(s.b.y-s.a.y,s.b.x-s.a.x)};
      }
      dist-=s.len;
    }
    const last=segs[segs.length-1];
    return {x:last.b.x,y:last.b.y,angle:Math.atan2(last.b.y-last.a.y,last.b.x-last.a.x)};
  }

  function togglePathRunning(path){
    ensurePathDefaults(path);
    const now=performance.now()/1000;
    if(path.pathRunning){
      path.pathRunning=false;
      path.pathPausedAt=now;
      return;
    }
    const pausedAt=Number(path.pathPausedAt);
    if(path.pathCompleted)path.pathRuntimeStart=now;
    else if(Number.isFinite(pausedAt))path.pathRuntimeStart=Number(path.pathRuntimeStart||now)+(now-pausedAt);
    else path.pathRuntimeStart=now;
    path.pathRunning=true;
    path.pathCompleted=false;
    path.pathSmoothedMembers={};
    capturePathStartPoses(path);
    resetPathRotationTracking(path);
  }

  function applyPathTimelineState(path,state){
    if(!path||path.type!==PATH_TYPE)return;
    ensurePathDefaults(path);
    const eventId=String(state&&state.eventId||'timeline');
    const now=performance.now()/1000;
    if(state&&state.active){
      const localTime=Math.max(0,Number(state.localTime)||0);
      const isNewEvent=path._pathTimelineEventId!==eventId||!path._pathTimelineActive;
      if(isNewEvent){
        capturePathStartPoses(path);
        resetPathRotationTracking(path);
        path.pathSmoothedMembers={};
      }
      path._pathTimelineActive=true;
      path._pathTimelineEventId=eventId;
      path.pathRunning=true;
      path.pathCompleted=false;
      path.pathPausedAt=Number.NaN;
      path.pathRuntimeStart=now-localTime;
      return;
    }
    if(!path._pathTimelineActive&&path._pathTimelineEventId!==eventId)return;
    if(path._pathTimelineEventId&&path._pathTimelineEventId!==eventId)return;
    path.pathRunning=false;
    path.pathPausedAt=now;
    path._pathTimelineActive=false;
    if(state&&state.completed){
      path.pathCompleted=true;
      if(path.pathResetOnComplete)restorePathStartPoses(path,path.pathObjectIds);
    }
    path.pathSmoothedMembers={};
  }

  function capturePathStartPoses(path){
    ensurePathDefaults(path);
    const poses={};
    for(const id of path.pathObjectIds||[]){
      const target=objectById(id);
      if(!target||target.type===PATH_TYPE)continue;
      poses[id]={x:Number(target.x||0),y:Number(target.y||0),rotation:Number(target.rotation||0)};
    }
    path.pathStartPoses=poses;
  }

  function restorePathStartPoses(path,ids){
    ensurePathDefaults(path);
    const poses=path.pathStartPoses||{};
    for(const id of ids||path.pathObjectIds||[]){
      const target=objectById(id),pose=poses[id];
      if(!target||!pose)continue;
      target.x=Number(pose.x||0);
      target.y=Number(pose.y||0);
      if(Number.isFinite(Number(pose.rotation))){
        target.rotation=Number(pose.rotation);
        path.pathLastRotations[id]=Number(pose.rotation);
      }
      path.pathLastAngles[id]=0;
      if(path.pathSmoothedMembers)delete path.pathSmoothedMembers[id];
    }
  }

  function resetPathRotationTracking(path){
    ensurePathDefaults(path);
    path.pathRotationOffsets=path.pathRotationOffsets||{};
    path.pathLastAngles=path.pathLastAngles||{};
    path.pathLastRotations=path.pathLastRotations||{};
    for(const id of path.pathObjectIds||[]){
      const target=objectById(id);
      if(!target)continue;
      const current=Number(target.rotation||0);
      const lastAngle=Number(path.pathLastAngles[id]||0);
      path.pathRotationOffsets[id]=current-lastAngle;
      path.pathLastRotations[id]=current;
    }
  }

  function applyPathRotation(path,target,pathAngleDeg){
    ensurePathDefaults(path);
    const id=target.id;
    const current=Number(target.rotation||0);
    const lastApplied=Number(path.pathLastRotations[id]);
    const lastAngle=Number(path.pathLastAngles[id]||0);
    if(!Number.isFinite(Number(path.pathRotationOffsets[id])))path.pathRotationOffsets[id]=current-lastAngle;
    if(Number.isFinite(lastApplied)&&Math.abs(current-lastApplied)>0.5){
      path.pathRotationOffsets[id]=current-lastAngle;
    }
    const next=Number(path.pathRotationOffsets[id]||0)+pathAngleDeg;
    target.rotation=next;
    path.pathLastAngles[id]=pathAngleDeg;
    path.pathLastRotations[id]=next;
    return next;
  }

  function smoothAngleDeg(from,to,alpha){
    const delta=(((Number(to)||0)-(Number(from)||0)+540)%360)-180;
    return Number(from||0)+delta*alpha;
  }

  function updatePathObjectMotion(){
    if(typeof objects==='undefined'||typeof canvas==='undefined'||!canvas)return;
    const stageSize=pathStageSize();
    const now=performance.now()/1000;
    pathObjects().forEach(path=>{
      ensurePathDefaults(path);
      const ids=path.pathObjectIds.filter(id=>objectById(id)&&objectById(id).type!==PATH_TYPE);
      path.pathObjectIds=ids;
      if(!ids.length)return;
      if(!path.pathRunning){
        syncPathGroupOffsetsFromCurrentObjects(path,ids);
        if(!Number.isFinite(Number(path.pathPausedAt)))path.pathPausedAt=now;
        return;
      }
      const duration=Math.max(0.05,Number(path.pathDuration)||8);
      const rawPhase=(now-Number(path.pathRuntimeStart||now))/duration;
      const completed=!path.pathLoop&&rawPhase>=1;
      ids.forEach(id=>{
        const target=objectById(id);
        if(!target)return;
        let phase=rawPhase;
        if(path.pathLoop){
          phase=phase%1;
          if(phase<0)phase+=1;
        }else{
          phase=Math.max(0,Math.min(1,phase));
        }
        if(path.pathPingPong){
          const doubled=phase*2;
          phase=doubled<=1?doubled:2-doubled;
        }
        const p=samplePath(path,phase);
        const offset=path.pathMemberOffsets&&path.pathMemberOffsets[id]||{x:0,y:0};
        const isGroupMember=!!(path.pathMemberGroupIds&&path.pathMemberGroupIds[id]);
        const baseAngle=isGroupMember?Number(path.pathMemberGroupBaseAngles&&path.pathMemberGroupBaseAngles[id]||0):0;
        const groupAngle=isGroupMember?(p.angle-baseAngle+Math.PI/2):p.angle;
        let ox=Number(offset.x||0),oy=Number(offset.y||0);
        if(isGroupMember&&path.pathRotateObjects){
          const ca=Math.cos(groupAngle),sa=Math.sin(groupAngle);
          const rx=ox*ca-oy*sa;
          const ry=ox*sa+oy*ca;
          ox=rx;oy=ry;
        }
        let nextX=Number(path.x||50)+(p.x+ox)/stageSize.w*100;
        let nextY=Number(path.y||50)+(p.y+oy)/stageSize.h*100;
        let nextRotation=null;
        if(path.pathRotateObjects){
          const currentRot=Number(target.rotation||0);
          nextRotation=applyPathRotation(path,target,groupAngle*180/Math.PI);
          target.rotation=currentRot;
        }
        if(path.pathDampingEnabled){
          const strength=Math.max(0,Math.min(0.95,Number(path.pathDamping??0.45)));
          const alpha=1-strength;
          const smooth=path.pathSmoothedMembers[id]||{x:nextX,y:nextY,rotation:nextRotation??Number(target.rotation||0)};
          smooth.x=Number(smooth.x)+(nextX-Number(smooth.x))*alpha;
          smooth.y=Number(smooth.y)+(nextY-Number(smooth.y))*alpha;
          if(nextRotation!==null)smooth.rotation=smoothAngleDeg(smooth.rotation,nextRotation,alpha);
          path.pathSmoothedMembers[id]=smooth;
          nextX=smooth.x;
          nextY=smooth.y;
          if(nextRotation!==null)nextRotation=smooth.rotation;
        }
        target.x=nextX;
        target.y=nextY;
        if(nextRotation!==null){
          target.rotation=nextRotation;
          path.pathLastRotations[id]=nextRotation;
        }
      });
      if(completed){
        path.pathRunning=false;
        path.pathPausedAt=now;
        path.pathCompleted=true;
        if(path.pathResetOnComplete)restorePathStartPoses(path,ids);
        path.pathSmoothedMembers={};
      }
    });
  }

  function syncPathGroupOffsetsFromCurrentObjects(path,ids){
    if(!path||!path.pathMemberGroupIds)return;
    const grouped=new Map();
    for(const id of ids){
      const gid=path.pathMemberGroupIds[id];
      const obj=objectById(id);
      if(!gid||!obj)continue;
      if(!grouped.has(gid))grouped.set(gid,[]);
      grouped.get(gid).push(obj);
    }
    const size=pathStageSize();
    for(const [gid,members] of grouped){
      if(members.length<2)continue;
      const center=groupAreaCentroid(members);
      for(const obj of members){
        path.pathMemberOffsets[obj.id]={
          x:(Number(obj.x||0)-center.x)/100*size.w,
          y:(Number(obj.y||0)-center.y)/100*size.h
        };
        path.pathMemberGroupIds[obj.id]=gid;
      }
    }
    path.pathMemberOffsetUnits='stage';
  }

  function ensureOverlay(){
    if(overlay)return overlay;
    if(typeof canvas==='undefined'||!canvas||!canvas.parentElement)return null;
    overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');
    overlay.id=OVERLAY_ID;
    canvas.parentElement.style.position=canvas.parentElement.style.position||'relative';
    canvas.parentElement.appendChild(overlay);
    return overlay;
  }

  function refreshOverlay(){
    const svg=ensureOverlay();
    if(!svg)return;
    const p=selectedPath();
    svg.innerHTML='';
    if(!p){requestAnimationFrame(refreshOverlay);return;}
    const rect=canvas.getBoundingClientRect();
    const parentRect=canvas.parentElement.getBoundingClientRect();
    svg.style.left=(rect.left-parentRect.left)+'px';
    svg.style.top=(rect.top-parentRect.top)+'px';
    svg.style.width=rect.width+'px';
    svg.style.height=rect.height+'px';
    svg.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
    const pts=(p.pathMode==='freehand'&&p.pathPoints.length>1)?p.pathPoints:[{x:p.pathStartX,y:p.pathStartY},{x:p.pathEndX,y:p.pathEndY}];
    const ox=(Number(p.x||50)/100)*rect.width;
    const oy=(Number(p.y||50)/100)*rect.height;
    const scale=Math.max(0.0001,typeof stageScale==='function'?stageScale():1);
    const d=pts.map((pt,i)=>`${i?'L':'M'} ${ox+Number(pt.x||0)*scale} ${oy+Number(pt.y||0)*scale}`).join(' ');
    const glow=document.createElementNS('http://www.w3.org/2000/svg','path');
    glow.setAttribute('d',d);
    glow.setAttribute('fill','none');
    glow.setAttribute('stroke','rgba(72,190,255,.28)');
    glow.setAttribute('stroke-width','8');
    glow.setAttribute('stroke-linecap','round');
    glow.setAttribute('stroke-linejoin','round');
    const line=document.createElementNS('http://www.w3.org/2000/svg','path');
    line.setAttribute('d',d);
    line.setAttribute('fill','none');
    line.setAttribute('stroke','#8ee7ff');
    line.setAttribute('stroke-width','2');
    line.setAttribute('stroke-linecap','round');
    line.setAttribute('stroke-linejoin','round');
    svg.appendChild(glow);
    svg.appendChild(line);
    pts.slice(0,2).forEach((pt,i)=>{
      const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx',ox+Number(pt.x||0)*scale);
      c.setAttribute('cy',oy+Number(pt.y||0)*scale);
      c.setAttribute('r',i?5:4);
      c.setAttribute('fill',i?'#ffffff':'#8ee7ff');
      svg.appendChild(c);
    });
    requestAnimationFrame(refreshOverlay);
  }

  function installDrawingHandlers(){
    if(typeof canvas==='undefined'||!canvas||canvas.__pathDrawHandlers)return;
    canvas.__pathDrawHandlers=true;
    canvas.addEventListener('pointerdown',ev=>{
      const p=selectedPath();
      if(!p||!drawing||p.pathMode!=='freehand')return;
      ev.preventDefault();
      ev.stopPropagation();
      canvas.setPointerCapture(ev.pointerId);
      p.pathPoints=[canvasLocalPoint(p,ev)];
      syncPanel(false);
    },true);
    canvas.addEventListener('pointermove',ev=>{
      const p=selectedPath();
      if(!p||!drawing||p.pathMode!=='freehand'||!canvas.hasPointerCapture(ev.pointerId))return;
      ev.preventDefault();
      ev.stopPropagation();
      const pt=canvasLocalPoint(p,ev);
      const last=p.pathPoints[p.pathPoints.length-1];
      if(!last||Math.hypot(pt.x-last.x,pt.y-last.y)>3)p.pathPoints.push(pt);
    },true);
    canvas.addEventListener('pointerup',ev=>{
      const p=selectedPath();
      if(!p||!drawing||p.pathMode!=='freehand')return;
      ev.preventDefault();
      ev.stopPropagation();
      try{canvas.releasePointerCapture(ev.pointerId);}catch(_){}
      drawing=false;
      syncPanel();
    },true);
  }

  function canvasLocalPoint(path,ev){
    const rect=canvas.getBoundingClientRect();
    const px=ev.clientX-rect.left;
    const py=ev.clientY-rect.top;
    const ox=(Number(path.x||50)/100)*rect.width;
    const oy=(Number(path.y||50)/100)*rect.height;
    const scale=Math.max(0.0001,typeof stageScale==='function'?stageScale():1);
    return {x:(px-ox)/scale,y:(py-oy)/scale};
  }

  function install(){
    if(installed||!hasGlobals())return false;
    installed=true;
    installNewObjectHook();
    installSelectionHook();
    installLabelHooks();
    installObjectManagerHook();
    installRuntimeHook();
    installDrawingHandlers();
    addPaletteTool();
    addTypeOption();
    createPanel();
    if(typeof updateObjectManager==='function')updateObjectManager();
    if(!rafStarted){
      rafStarted=true;
      requestAnimationFrame(refreshOverlay);
    }
    return true;
  }

  function retryInstall(){
    if(install())return;
    setTimeout(retryInstall,80);
  }

  window.updatePathObjectMotion=updatePathObjectMotion;
  window.vseApplyPathTimelineState=applyPathTimelineState;
  window.syncPathObjectPanel=syncPanel;
  retryInstall();
})();
