/* ===== VSE Teleprompter Window ===== */
(function(){
  const $=id=>document.getElementById(id);
  const textEl=$('prompterText'),titleEl=$('prompterTitle'),startEl=$('prompterStart'),durationEl=$('prompterDuration');
  const startNumber=$('prompterStartNumber'),durationNumber=$('prompterDurationNumber'),startValue=$('prompterStartValue'),durationValue=$('prompterDurationValue');
  const fontFamilyEl=$('prompterFontFamily'),fontSizeEl=$('prompterFontSize'),fontSizeValue=$('prompterFontSizeValue'),textColorEl=$('prompterTextColor'),bgColorEl=$('prompterBgColor');
  const newBtn=$('prompterNewBtn'),pushBtn=$('prompterPushBtn'),deleteBtn=$('prompterDeleteBtn'),duplicateBtn=$('prompterDuplicateBtn');
  const importFile=$('prompterImportFile'),exportBtn=$('prompterExportBtn'),syncMainEl=$('prompterSyncMain'),controllerEl=$('prompterControllerEnabled');
  const listEl=$('prompterList'),clipsEl=$('prompterClips'),laneEl=$('prompterLane'),playheadEl=$('prompterPlayhead'),seekEl=$('prompterSeek');
  const playBtn=$('prompterPlayBtn'),stopBtn=$('prompterStopBtn'),prevBtn=$('prompterPrevBtn'),nextBtn=$('prompterNextBtn'),currentTimeEl=$('prompterCurrentTime'),totalTimeEl=$('prompterTotalTime'),activeNameEl=$('prompterActiveName'),syncStateEl=$('prompterSyncState');
  const propsToggle=$('prompterPropsToggle'),propsPanel=$('prompterProps');
  const storageKey='vse.teleprompter.state.v1';
  const propsCollapsedKey='vse.teleprompter.propsCollapsed.v1';
  const bLongPressMs=450;

  const state={
    duration:180,
    currentTime:0,
    playing:false,
    lastClock:performance.now(),
    selectedId:'',
    items:[],
    syncMain:false,
    syncConnected:false,
    controllerEnabled:true,
    lastController:{}
  };

  function uid(){return 'tp_'+Date.now().toString(36)+'_'+Math.floor(Math.random()*9999).toString(36);}
  function clamp(value,min,max){return Math.max(min,Math.min(max,Number(value)||0));}
  function fmt(sec){
    const total=Math.max(0,Math.round((Number(sec)||0)*100));
    const m=Math.floor(total/6000),s=Math.floor((total%6000)/100),h=total%100;
    return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+'.'+String(h).padStart(2,'0');
  }
  function selectedItem(){return state.items.find(item=>item.id===state.selectedId)||null;}
  function sortItems(){state.items.sort((a,b)=>(Number(a.start)||0)-(Number(b.start)||0));}
  function timelineDuration(){
    const end=state.items.reduce((max,item)=>Math.max(max,(Number(item.start)||0)+Math.max(.1,Number(item.duration)||0)),0);
    return Math.max(30,Math.ceil(end+5),Number(state.duration)||180);
  }
  function defaultItem(overrides={}){
    const start=state.items.length?Math.max(...state.items.map(item=>(Number(item.start)||0)+Math.max(.1,Number(item.duration)||0)))+1:0;
    return Object.assign({
      id:uid(),
      title:'Prompter Text '+(state.items.length+1),
      text:'',
      start,
      duration:10,
      fontFamily:'Arial, sans-serif',
      fontSize:64,
      textColor:'#f4f7ff',
      bgColor:'#05070c'
    },overrides);
  }
  function save(){
    try{
      localStorage.setItem(storageKey,JSON.stringify({
        duration:state.duration,
        currentTime:state.currentTime,
        selectedId:state.selectedId,
        items:state.items,
        syncMain:state.syncMain,
        controllerEnabled:state.controllerEnabled
      }));
    }catch(err){}
  }
  function load(){
    try{
      const saved=JSON.parse(localStorage.getItem(storageKey)||'null');
      if(saved&&Array.isArray(saved.items)){
        Object.assign(state,saved);
      }
    }catch(err){}
    if(!state.items.length)state.items.push(defaultItem({title:'Prompter Text 1',text:'Teleprompter-Text eingeben...'}));
    if(!state.selectedId||!selectedItem())state.selectedId=state.items[0].id;
    state.duration=timelineDuration();
  }
  function applyItemToEditor(item){
    if(!item)return;
    textEl.value=item.text||'';
    applyFormatToEditor(item);
    titleEl.value=item.title||'';
    startEl.value=String(Number(item.start)||0);
    durationEl.value=String(Math.max(.1,Number(item.duration)||10));
    startNumber.value=startEl.value;
    durationNumber.value=durationEl.value;
    fontFamilyEl.value=item.fontFamily||'Arial, sans-serif';
    fontSizeEl.value=String(Math.round(Number(item.fontSize)||64));
    textColorEl.value=item.textColor||'#f4f7ff';
    bgColorEl.value=item.bgColor||'#05070c';
    syncMainEl.checked=!!state.syncMain;
    controllerEl.checked=state.controllerEnabled!==false;
    updateValueLabels();
  }
  function applyFormatToEditor(item){
    if(!item)return;
    textEl.style.fontFamily=item.fontFamily||'Arial, sans-serif';
    textEl.style.fontSize=Math.round(Number(item.fontSize)||64)+'px';
    textEl.style.color=item.textColor||'#f4f7ff';
    textEl.style.backgroundColor=item.bgColor||'#05070c';
    document.body.style.backgroundColor=item.bgColor||'#05070c';
  }
  function updateValueLabels(){
    const item=selectedItem();
    startValue.textContent=fmt(item?item.start:0);
    durationValue.textContent=(item?Number(item.duration||0):0).toFixed(2)+' s';
    fontSizeValue.textContent=Math.round(item?Number(item.fontSize||64):64)+' px';
  }
  function updateSelectedFromControls(){
    const item=selectedItem();
    if(!item)return;
    item.title=titleEl.value.trim()||'Prompter Text';
    item.text=textEl.value;
    item.start=clamp(startEl.value,0,timelineDuration());
    item.duration=Math.max(.1,Number(durationEl.value)||10);
    item.fontFamily=fontFamilyEl.value;
    item.fontSize=Math.max(18,Number(fontSizeEl.value)||64);
    item.textColor=textColorEl.value||'#f4f7ff';
    item.bgColor=bgColorEl.value||'#05070c';
    state.duration=timelineDuration();
    applyFormatToEditor(item);
    updateValueLabels();
    render();
    save();
  }
  function selectItem(id,seekToItem=false){
    const item=state.items.find(entry=>entry.id===id);
    if(!item)return;
    state.selectedId=id;
    if(seekToItem)seek(item.start);
    applyItemToEditor(item);
    render();
    save();
  }
  function activeItem(){
    const t=Number(state.currentTime)||0;
    return state.items.find(item=>t>=Number(item.start||0)&&t<Number(item.start||0)+Math.max(.1,Number(item.duration)||0))||null;
  }
  function syncActiveSelection(){
    const item=activeItem();
    if(item&&item.id!==state.selectedId&&state.playing)selectItem(item.id,false);
  }
  function renderList(){
    listEl.innerHTML='';
    sortItems();
    state.items.forEach(item=>{
      const btn=document.createElement('button');
      btn.type='button';
      btn.className=item.id===state.selectedId?'isSelected':'';
      btn.innerHTML='<b></b><small></small>';
      btn.querySelector('b').textContent=item.title||'Prompter Text';
      btn.querySelector('small').textContent=fmt(item.start)+' · '+Number(item.duration||0).toFixed(1)+' s';
      btn.addEventListener('click',()=>selectItem(item.id,true));
      listEl.appendChild(btn);
    });
  }
  function renderTimeline(){
    state.duration=timelineDuration();
    seekEl.max=String(Math.round(state.duration*1000));
    seekEl.value=String(Math.round(clamp(state.currentTime,0,state.duration)*1000));
    currentTimeEl.textContent=fmt(state.currentTime);
    totalTimeEl.textContent=fmt(state.duration);
    const active=activeItem();
    activeNameEl.textContent=active?(active.title||'Prompter Text'):'Kein Element';
    playheadEl.style.left=(clamp(state.currentTime,0,state.duration)/state.duration*100)+'%';
    clipsEl.innerHTML='';
    state.items.forEach(item=>{
      const clip=document.createElement('div');
      clip.className='prompterClip'+(item.id===state.selectedId?' isSelected':'')+(active&&active.id===item.id?' isActive':'');
      clip.style.left=(Number(item.start||0)/state.duration*100)+'%';
      clip.style.width=(Math.max(.1,Number(item.duration)||.1)/state.duration*100)+'%';
      clip.textContent=item.title||'Prompter Text';
      clip.title=(item.title||'Prompter Text')+' · '+fmt(item.start)+' · '+Number(item.duration||0).toFixed(1)+' s';
      makeClipDraggable(clip,item);
      clipsEl.appendChild(clip);
    });
    playBtn.innerHTML=state.playing?'<svg viewBox="0 0 256 256" aria-hidden="true"><rect x="56" y="40" width="56" height="176" rx="8"></rect><rect x="144" y="40" width="56" height="176" rx="8"></rect></svg>':'<svg viewBox="0 0 256 256" aria-hidden="true"><polygon points="72 40 216 128 72 216 72 40"></polygon></svg>';
    syncStateEl.textContent=state.syncMain?(state.syncConnected?'Main-Sync':'Main-Sync nicht verbunden'):'Asynchron';
  }
  function render(){renderList();renderTimeline();}
  function applyPropsCollapsed(collapsed){
    if(!propsToggle||!propsPanel)return;
    document.body.classList.toggle('prompterPropsCollapsed',collapsed);
    propsToggle.setAttribute('aria-expanded',String(!collapsed));
    propsToggle.title=collapsed?'Eigenschaften ausklappen':'Eigenschaften einklappen';
    propsPanel.setAttribute('aria-hidden',String(collapsed));
  }
  function initPropsToggle(){
    if(!propsToggle||!propsPanel)return;
    let collapsed=false;
    try{collapsed=localStorage.getItem(propsCollapsedKey)==='true';}catch(err){}
    applyPropsCollapsed(collapsed);
    propsToggle.addEventListener('click',()=>{
      const next=!document.body.classList.contains('prompterPropsCollapsed');
      applyPropsCollapsed(next);
      try{localStorage.setItem(propsCollapsedKey,String(next));}catch(err){}
    });
  }
  function makeClipDraggable(clip,item){
    clip.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;
      event.preventDefault();
      const rect=laneEl.getBoundingClientRect(),startX=event.clientX,oldStart=Number(item.start)||0;
      let moved=false;
      const move=moveEvent=>{
        const delta=(moveEvent.clientX-startX)/Math.max(1,rect.width)*state.duration;
        if(Math.abs(moveEvent.clientX-startX)>2)moved=true;
        item.start=clamp(oldStart+delta,0,Math.max(0,state.duration-Math.max(.1,Number(item.duration)||.1)));
        if(item.id===state.selectedId){
          startEl.value=String(item.start);startNumber.value=String(item.start);updateValueLabels();
        }
        renderTimeline();
      };
      const up=()=>{
        document.removeEventListener('pointermove',move);
        document.removeEventListener('pointerup',up);
        if(moved){
          save();
          render();
        }else{
          selectItem(item.id,true);
        }
      };
      document.addEventListener('pointermove',move);
      document.addEventListener('pointerup',up,{once:true});
    });
  }
  function seek(sec){
    state.currentTime=clamp(sec,0,state.duration);
    state.lastClock=performance.now();
    syncActiveSelection();
    renderTimeline();
  }
  function playPause(){
    if(state.syncMain)return;
    state.playing=!state.playing;
    state.lastClock=performance.now();
    renderTimeline();
  }
  function stop(){
    state.playing=false;
    seek(0);
    renderTimeline();
  }
  function previousItem(){
    sortItems();
    const current=selectedItem();
    const index=Math.max(0,state.items.findIndex(item=>item.id===(current&&current.id)));
    selectItem(state.items[Math.max(0,index-1)].id,true);
  }
  function nextItem(){
    sortItems();
    const current=selectedItem();
    const index=Math.max(0,state.items.findIndex(item=>item.id===(current&&current.id)));
    selectItem(state.items[Math.min(state.items.length-1,index+1)].id,true);
  }
  function addNewItem(overrides={}){
    const item=defaultItem(overrides);
    state.items.push(item);
    selectItem(item.id,true);
  }
  function pushCurrentText(){
    const item=selectedItem();
    if(!item){addNewItem({text:textEl.value});return;}
    item.text=textEl.value;
    item.title=titleEl.value.trim()||item.title||'Prompter Text';
    item.start=Number(startEl.value)||state.currentTime||0;
    item.duration=Math.max(.1,Number(durationEl.value)||10);
    updateSelectedFromControls();
  }
  function duplicateCurrent(){
    const item=selectedItem();
    if(!item)return;
    addNewItem(Object.assign({},item,{id:uid(),title:(item.title||'Prompter Text')+' Kopie',start:(Number(item.start)||0)+Math.max(.1,Number(item.duration)||10)+1}));
  }
  function deleteCurrent(){
    if(state.items.length<=1)return;
    const index=state.items.findIndex(item=>item.id===state.selectedId);
    state.items=state.items.filter(item=>item.id!==state.selectedId);
    state.selectedId=state.items[Math.max(0,index-1)]?.id||state.items[0].id;
    applyItemToEditor(selectedItem());
    render();
    save();
  }
  function exportCurrent(){
    const item=selectedItem();
    if(!item)return;
    const blob=new Blob([item.text||''],{type:'text/plain;charset=utf-8'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=(item.title||'teleprompter-text').replace(/[\\/:*?"<>|]+/g,'_')+'.txt';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},0);
  }
  async function importTextFile(file){
    if(!file)return;
    const text=await file.text();
    addNewItem({title:file.name.replace(/\.txt$/i,'')||'Importierter Text',text});
    importFile.value='';
  }
  function mainTimelineSnapshot(){
    const opener=window.opener;
    if(!opener||opener.closed)return null;
    try{
      if(opener.vseTimelineSync&&typeof opener.vseTimelineSync.getState==='function'){
        const snap=opener.vseTimelineSync.getState();
        if(snap&&Number.isFinite(Number(snap.currentTime)))return snap;
      }
      if(typeof opener.currentTimelineTime==='function'){
        return {
          currentTime:Number(opener.currentTimelineTime())||0,
          duration:Number(opener.getTimelineMediaDuration&&opener.getTimelineMediaDuration())||0,
          playing:!!(opener.timelineState&&opener.timelineState.playing)
        };
      }
      if(opener.timelineState&&Number.isFinite(Number(opener.timelineState.currentTime))){
        return {
          currentTime:Number(opener.timelineState.currentTime)||0,
          duration:Number(opener.timelineState.duration)||0,
          playing:!!opener.timelineState.playing
        };
      }
    }catch(err){}
    return null;
  }
  function syncFromMain(){
    if(!state.syncMain)return false;
    const mainState=mainTimelineSnapshot();
    if(!mainState){
      state.syncConnected=false;
      return false;
    }
    state.syncConnected=true;
    const mainDuration=Number(mainState.duration)||0;
    if(mainDuration>0)state.duration=Math.max(timelineDuration(),Math.ceil(mainDuration));
    state.currentTime=clamp(Number(mainState.currentTime)||0,0,state.duration);
    state.playing=!!mainState.playing;
    syncActiveSelection();
    renderTimeline();
    return true;
  }
  function tick(now){
    if(state.syncMain){
      if(!syncFromMain()){
        state.playing=false;
        renderTimeline();
      }
    }else if(state.playing){
      const delta=(now-state.lastClock)/1000;
      state.currentTime=clamp(state.currentTime+delta,0,state.duration);
      if(state.currentTime>=state.duration)state.playing=false;
      syncActiveSelection();
      renderTimeline();
    }
    state.lastClock=now;
    pollGamepads();
    requestAnimationFrame(tick);
  }
  function controllerAction(action){
    if(!state.controllerEnabled)return;
    if(action==='play')playPause();
    if(action==='stop')stop();
    if(action==='prev')previousItem();
    if(action==='next')nextItem();
  }
  function edgePressed(key,pressed){
    const old=!!state.lastController[key];
    state.lastController[key]=!!pressed;
    return pressed&&!old;
  }
  function pollGamepads(){
    if(!state.controllerEnabled||!navigator.getGamepads)return;
    const pad=Array.from(navigator.getGamepads()||[]).find(Boolean);
    if(!pad)return;
    if(edgePressed('b0',pad.buttons[0]&&pad.buttons[0].pressed))controllerAction('play');
    const bPressed=!!(pad.buttons[1]&&pad.buttons[1].pressed);
    const bWasPressed=!!state.lastController.b1;
    if(bPressed&&!bWasPressed)state.lastController.b1Started=performance.now();
    if(!bPressed&&bWasPressed){
      const heldMs=performance.now()-Number(state.lastController.b1Started||performance.now());
      controllerAction(heldMs>=bLongPressMs?'prev':'next');
    }
    state.lastController.b1=bPressed;
    if(edgePressed('b4',pad.buttons[4]&&pad.buttons[4].pressed))controllerAction('prev');
    if(edgePressed('b5',pad.buttons[5]&&pad.buttons[5].pressed))controllerAction('next');
  }
  function isEditableTarget(target){
    if(!target||!target.closest)return false;
    return !!target.closest('textarea,input,select,[contenteditable="true"]');
  }
  function handleBRelease(){
    const started=Number(state.lastController.keyboardBStarted||0);
    if(!started)return;
    const heldMs=performance.now()-started;
    state.lastController.keyboardBStarted=0;
    controllerAction(heldMs>=bLongPressMs?'prev':'next');
  }

  [textEl,titleEl,fontFamilyEl,fontSizeEl,textColorEl,bgColorEl].forEach(el=>el.addEventListener('input',updateSelectedFromControls));
  startEl.addEventListener('input',()=>{startNumber.value=startEl.value;updateSelectedFromControls();});
  durationEl.addEventListener('input',()=>{durationNumber.value=durationEl.value;updateSelectedFromControls();});
  startNumber.addEventListener('input',()=>{startEl.value=startNumber.value;updateSelectedFromControls();});
  durationNumber.addEventListener('input',()=>{durationEl.value=durationNumber.value;updateSelectedFromControls();});
  newBtn.addEventListener('click',()=>addNewItem());
  pushBtn.addEventListener('click',pushCurrentText);
  deleteBtn.addEventListener('click',deleteCurrent);
  duplicateBtn.addEventListener('click',duplicateCurrent);
  importFile.addEventListener('change',event=>importTextFile(event.target.files&&event.target.files[0]));
  exportBtn.addEventListener('click',exportCurrent);
  playBtn.addEventListener('click',playPause);
  stopBtn.addEventListener('click',stop);
  prevBtn.addEventListener('click',previousItem);
  nextBtn.addEventListener('click',nextItem);
  seekEl.addEventListener('input',()=>seek(Number(seekEl.value||0)/1000));
  laneEl.addEventListener('click',event=>{
    if(event.target!==laneEl&&event.target!==clipsEl&&event.target.className!=='timelineTicks')return;
    const rect=laneEl.getBoundingClientRect();
    seek((event.clientX-rect.left)/Math.max(1,rect.width)*state.duration);
  });
  syncMainEl.addEventListener('input',()=>{
    state.syncMain=syncMainEl.checked;
    if(!state.syncMain)state.syncConnected=false;
    state.lastClock=performance.now();
    if(state.syncMain)syncFromMain();
    save();
    renderTimeline();
  });
  controllerEl.addEventListener('input',()=>{state.controllerEnabled=controllerEl.checked;save();});
  document.addEventListener('keydown',event=>{
    if(state.controllerEnabled&&!event.ctrlKey&&event.code==='KeyB'&&!event.repeat&&!isEditableTarget(event.target)){
      event.preventDefault();
      state.lastController.keyboardBStarted=performance.now();
      return;
    }
    if(!state.controllerEnabled||!event.ctrlKey)return;
    if(event.code==='Space'){event.preventDefault();controllerAction('play');}
    if(event.code==='Backspace'){event.preventDefault();controllerAction('stop');}
    if(event.code==='ArrowLeft'){event.preventDefault();controllerAction('prev');}
    if(event.code==='ArrowRight'){event.preventDefault();controllerAction('next');}
  });
  document.addEventListener('keyup',event=>{
    if(state.controllerEnabled&&!event.ctrlKey&&event.code==='KeyB'&&!isEditableTarget(event.target)){
      event.preventDefault();
      handleBRelease();
    }
  });

  load();
  initPropsToggle();
  applyItemToEditor(selectedItem());
  render();
  requestAnimationFrame(tick);
})();
