/* ===== Kamera-Timeline: animierte Ausschnitte ===== */
(()=>{
  const byId=id=>document.getElementById(id);
  const addButton=byId('timelineAddCameraBtn');
  const lane=byId('timelineCameraBar');
  const clips=byId('timelineCameraClips');
  const playhead=byId('timelineCameraPlayhead');
  if(!addButton||!lane||!clips||!playhead)return;

  const wholeView=()=>({zoom:1,panX:0,panY:0});
  const currentView=()=>({
    zoom:Math.max(.2,Math.min(10,Number(scene.cameraZoom)||1)),
    panX:Math.max(-2,Math.min(2,Number(scene.cameraPanX)||0)),
    panY:Math.max(-2,Math.min(2,Number(scene.cameraPanY)||0))
  });
  const cloneView=view=>({zoom:Number(view.zoom)||1,panX:Number(view.panX)||0,panY:Number(view.panY)||0});
  const cameraMoves=()=>timelineState.events.filter(event=>event&&event.timelineAssetKind==='camera').sort((a,b)=>(Number(a.time)||0)-(Number(b.time)||0));
  const timelineDuration=()=>Math.max(5,Number(timelineState.duration)||180);
  const clampTime=value=>Math.max(0,Math.min(timelineDuration(),Number(value)||0));

  const panel=document.createElement('section');
  panel.id='cameraTimelinePanel';panel.hidden=true;
  panel.innerHTML=`
    <div class="cameraTimelineHeader"><div><b>Kamerafahrt</b><small>Start- und Endausschnitt</small></div><button id="cameraTimelineClose" type="button" aria-label="Kameramenü schließen">×</button></div>
    <div class="cameraTimelineBody">
      <p class="mini">Ansicht mit Strg+Mausrad und Strg+Ziehen einstellen und anschließend als Ausschnitt übernehmen.</p>
      <button id="cameraChoosePath" class="cameraChoosePath" type="button">Mehrpunkt-Pfad erstellen</button>
      <div class="row"><div><label>Startzeit (s)</label><input id="cameraTimelineStartTime" type="number" min="0" step="0.01"></div><div><label>Dauer (s)</label><input id="cameraTimelineDuration" type="number" min="0.1" step="0.1" value="5"></div></div>
      <div class="cameraViewBlock"><b>Startausschnitt</b><span id="cameraStartInfo"></span><div class="cameraButtonRow"><button id="cameraCaptureStart" type="button">Aktuelle Ansicht</button><button id="cameraWholeStart" type="button">Gesamte Fläche</button><button id="cameraPreviewStart" type="button">Anzeigen</button></div></div>
      <div class="cameraViewBlock"><b>Endausschnitt</b><span id="cameraEndInfo"></span><div class="cameraButtonRow"><button id="cameraCaptureEnd" type="button">Aktuelle Ansicht</button><button id="cameraWholeEnd" type="button">Gesamte Fläche</button><button id="cameraPreviewEnd" type="button">Anzeigen</button></div></div>
      <div class="cameraViewBlock cameraCurveBlock"><b>Pfadkurve</b><span>Kurve als Pixel-Offset auf die Kamerafahrt legen.</span>
        <label>Kurvenform</label><select id="cameraPathType"><option value="linear">Gerade</option><option value="sine">Sinuskurve</option><option value="circle">Kreisförmiger Kamerazoom</option><option value="path">Pfad</option></select>
        <div id="cameraCircleSettings" hidden>
          <p class="mini">Geschlossene Kreisfahrt: Bei ½ wird der Endausschnitt als maximales Zoom erreicht, danach fährt die Kamera zum Startausschnitt zurück.</p>
          <div class="row"><div><label>Kreisradius (px)</label><input id="cameraCircleRadius" type="number" min="0" step="1" value="200"></div><div><label>Startrichtung</label><select id="cameraCircleDirection"><option value="left">Zuerst nach links</option><option value="right">Zuerst nach rechts</option></select></div></div>
        </div>
        <div id="cameraWaveSettings">
          <div class="row"><div><label>Amplitude horizontal (px)</label><input id="cameraAmplitudeX" type="number" min="0" step="1" value="0"></div><div><label>Wellenlänge horizontal (px)</label><input id="cameraWavelengthX" type="number" min="1" step="1" value="200"></div></div>
          <div class="row"><div><label>Amplitude vertikal (px)</label><input id="cameraAmplitudeY" type="number" min="0" step="1" value="0"></div><div><label>Wellenlänge vertikal (px)</label><input id="cameraWavelengthY" type="number" min="1" step="1" value="200"></div></div>
        </div>
        <div id="cameraPathSettings" hidden>
          <p class="mini">Mehrere Positionen und Ausschnitte in ihrer Fahrreihenfolge speichern.</p>
          <div id="cameraPathPointList" class="cameraPathPointList"></div>
          <div class="cameraButtonRow"><button id="cameraAddPathPoint" type="button">Aktuelle Ansicht hinzufügen</button><button id="cameraRemovePathPoint" type="button">Letzten Punkt entfernen</button></div>
          <label class="checkrow"><input id="cameraPathLoop" type="checkbox"><span>Loop: zum Ursprung zurückkehren</span></label>
          <label class="checkrow"><input id="cameraPathRepeat" type="checkbox"><span>Pfad danach erneut starten</span></label>
        </div>
      </div>
      <div class="cameraButtonRow cameraPrimaryRow"><button id="cameraSaveMove" class="green" type="button">Kamerafahrt hinzufügen</button><button id="cameraDeleteMove" class="red" type="button">Löschen</button></div>
    </div>`;
  document.body.appendChild(panel);

  const startTime=byId('cameraTimelineStartTime'),durationInput=byId('cameraTimelineDuration');
  const pathType=byId('cameraPathType'),amplitudeX=byId('cameraAmplitudeX'),wavelengthX=byId('cameraWavelengthX');
  const amplitudeY=byId('cameraAmplitudeY'),wavelengthY=byId('cameraWavelengthY');
  const waveSettings=byId('cameraWaveSettings'),circleSettings=byId('cameraCircleSettings'),pathSettings=byId('cameraPathSettings');
  const circleRadius=byId('cameraCircleRadius'),circleDirection=byId('cameraCircleDirection');
  const pathPointList=byId('cameraPathPointList'),pathLoop=byId('cameraPathLoop'),pathRepeat=byId('cameraPathRepeat');
  const startInfo=byId('cameraStartInfo'),endInfo=byId('cameraEndInfo'),saveButton=byId('cameraSaveMove'),deleteButton=byId('cameraDeleteMove');
  let editingId='',startView=wholeView(),endView=wholeView(),pathPoints=[];

  function viewLabel(view){
    return Math.round(view.zoom*100)+'% · X '+view.panX.toFixed(2)+' · Y '+view.panY.toFixed(2);
  }
  function refreshPanel(){
    startInfo.textContent=viewLabel(startView);endInfo.textContent=viewLabel(endView);
    waveSettings.hidden=pathType.value!=='sine';circleSettings.hidden=pathType.value!=='circle';pathSettings.hidden=pathType.value!=='path';
    if(pathPointList){
      pathPointList.innerHTML='';
      pathPoints.forEach((view,index)=>{const row=document.createElement('div');row.className='cameraPathPoint';row.innerHTML='<b>Punkt '+(index+1)+'</b><span>'+viewLabel(view)+'</span><button type="button">Anzeigen</button>';row.querySelector('button').onclick=()=>applyView(view);pathPointList.appendChild(row);});
    }
    if(pathRepeat)pathRepeat.disabled=!pathLoop.checked;
    byId('cameraChoosePath').classList.toggle('green',pathType.value==='path');
    byId('cameraChoosePath').textContent=pathType.value==='path'?'Mehrpunkt-Pfad aktiv':'Mehrpunkt-Pfad erstellen';
    saveButton.textContent=editingId?'Kamerafahrt aktualisieren':'Kamerafahrt hinzufügen';
    deleteButton.disabled=!editingId;
  }
  function applyView(view){
    scene.cameraZoom=Math.max(.2,Math.min(10,Number(view.zoom)||1));
    scene.cameraPanX=Math.max(-2,Math.min(2,Number(view.panX)||0));
    scene.cameraPanY=Math.max(-2,Math.min(2,Number(view.panY)||0));
    if(typeof syncWorkspaceView==='function')syncWorkspaceView();
  }
  function openPanel(move=null){
    window.vseActiveClipboardScope='camera';
    timelineState.selectedEventId=null;timelineState.selectedAudioClipId=null;
    editingId=move&&move.id||'';
    startView=cloneView(move&&move.cameraStart||currentView());
    endView=cloneView(move&&move.cameraEnd||currentView());
    startTime.value=String(move?Number(move.time)||0:currentTimelineTime());
    durationInput.value=String(move?Math.max(.1,Number(move.duration)||5):5);
    pathType.value=move&&['sine','circle','path'].includes(move.cameraPathType)?move.cameraPathType:'linear';
    pathPoints=(move&&Array.isArray(move.cameraPathPoints)&&move.cameraPathPoints.length>=2?move.cameraPathPoints:[startView,endView]).map(cloneView);
    pathLoop.checked=!!(move&&move.cameraPathLoop);pathRepeat.checked=!!(move&&move.cameraPathRepeat&&move.cameraPathLoop);
    amplitudeX.value=String(Math.max(0,Number(move&&move.cameraAmplitudeX)||0));
    wavelengthX.value=String(Math.max(1,Number(move&&move.cameraWavelengthX)||200));
    amplitudeY.value=String(Math.max(0,Number(move&&move.cameraAmplitudeY)||0));
    wavelengthY.value=String(Math.max(1,Number(move&&move.cameraWavelengthY)||200));
    circleRadius.value=String(Math.max(0,Number((move&&move.cameraCircleRadius)??200)));
    circleDirection.value=move&&move.cameraCircleDirection==='right'?'right':'left';
    panel.hidden=false;refreshPanel();
  }
  function closePanel(){panel.hidden=true;}

  byId('cameraTimelineClose').onclick=closePanel;
  byId('cameraCaptureStart').onclick=()=>{startView=currentView();if(pathPoints.length)pathPoints[0]=cloneView(startView);refreshPanel();};
  byId('cameraCaptureEnd').onclick=()=>{endView=currentView();if(pathPoints.length)pathPoints[pathPoints.length-1]=cloneView(endView);refreshPanel();};
  byId('cameraWholeStart').onclick=()=>{startView=wholeView();if(pathPoints.length)pathPoints[0]=cloneView(startView);refreshPanel();};
  byId('cameraWholeEnd').onclick=()=>{endView=wholeView();if(pathPoints.length)pathPoints[pathPoints.length-1]=cloneView(endView);refreshPanel();};
  byId('cameraPreviewStart').onclick=()=>applyView(startView);
  byId('cameraPreviewEnd').onclick=()=>applyView(endView);
  pathType.onchange=refreshPanel;
  byId('cameraChoosePath').onclick=()=>{pathType.value='path';refreshPanel();pathSettings.scrollIntoView({block:'nearest'});};
  byId('cameraAddPathPoint').onclick=()=>{const view=cloneView(currentView());const duplicateEndpoints=pathPoints.length===2&&viewLabel(pathPoints[0])===viewLabel(pathPoints[1]);if(duplicateEndpoints)pathPoints[1]=view;else pathPoints.push(view);endView=cloneView(pathPoints[pathPoints.length-1]);refreshPanel();};
  byId('cameraRemovePathPoint').onclick=()=>{if(pathPoints.length<=2)return;pathPoints.pop();endView=cloneView(pathPoints[pathPoints.length-1]);refreshPanel();};
  pathLoop.onchange=()=>{if(!pathLoop.checked)pathRepeat.checked=false;refreshPanel();};
  addButton.onclick=event=>{event.stopPropagation();openPanel();};

  saveButton.onclick=()=>{
    const start=clampTime(startTime.value),moveDuration=Math.max(.1,Number(durationInput.value)||5);
    let move=editingId?timelineState.events.find(event=>event.id===editingId):null;
    if(!move){
      move={id:'camera_'+Date.now().toString(36)+'_'+Math.floor(Math.random()*99999),timelineAssetKind:'camera',action:'camera',enabled:true};
      timelineState.events.push(move);editingId=move.id;
    }
    move.time=start;move.duration=moveDuration;move.cameraStart=cloneView(startView);move.cameraEnd=cloneView(endView);
    move.cameraPathType=['sine','circle','path'].includes(pathType.value)?pathType.value:'linear';
    if(move.cameraPathType==='path'){
      if(pathPoints.length<2)pathPoints=[cloneView(startView),cloneView(endView)];
      pathPoints[0]=cloneView(startView);pathPoints[pathPoints.length-1]=cloneView(endView);
      move.cameraPathPoints=pathPoints.map(cloneView);move.cameraPathLoop=!!pathLoop.checked;move.cameraPathRepeat=!!(pathLoop.checked&&pathRepeat.checked);
    }else{
      delete move.cameraPathPoints;move.cameraPathLoop=false;move.cameraPathRepeat=false;
    }
    move.cameraAmplitudeX=Math.max(0,Number(amplitudeX.value)||0);move.cameraWavelengthX=Math.max(1,Number(wavelengthX.value)||200);
    move.cameraAmplitudeY=Math.max(0,Number(amplitudeY.value)||0);move.cameraWavelengthY=Math.max(1,Number(wavelengthY.value)||200);
    move.cameraCircleRadius=Math.max(0,Number(circleRadius.value)||0);move.cameraCircleDirection=circleDirection.value==='right'?'right':'left';
    if(start+moveDuration>timelineDuration())timelineState.duration=Math.ceil(start+moveDuration);
    timelineState.selectedCameraMoveId=move.id;
    updateTimelineUI();renderCameraTrack();refreshPanel();
    if(window.vseHistory)window.vseHistory.commit();
  };
  deleteButton.onclick=()=>{
    if(!editingId)return;
    timelineState.events=timelineState.events.filter(event=>event.id!==editingId);
    timelineState.selectedCameraMoveId='';editingId='';closePanel();updateTimelineUI();renderCameraTrack();
    if(cameraMoves().length)applyCameraTime(currentTimelineTime());else applyView(wholeView());
    if(window.vseHistory)window.vseHistory.commit();
  };

  function makeDraggable(element,move){
    element.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;
      event.preventDefault();event.stopPropagation();
      const rect=lane.getBoundingClientRect(),originX=event.clientX,originTime=Number(move.time)||0;
      let moved=false;
      const onMove=moveEvent=>{
        if(Math.abs(moveEvent.clientX-originX)>2)moved=true;
        const proposed=originTime+(moveEvent.clientX-originX)/Math.max(1,rect.width)*timelineDuration();
        move.time=typeof window.vseSnapTimelineClipStart==='function'?window.vseSnapTimelineClipStart(proposed,move.duration,move.id,lane):clampTime(proposed);
        element.style.left=(move.time/timelineDuration()*100)+'%';
      };
      const onUp=()=>{
        document.removeEventListener('pointermove',onMove);document.removeEventListener('pointerup',onUp);
        if(moved){element.dataset.dragged='1';updateTimelineUI();if(window.vseHistory)window.vseHistory.commit();}
      };
      document.addEventListener('pointermove',onMove);document.addEventListener('pointerup',onUp,{once:true});
    });
  }
  function renderCameraTrack(){
    clips.innerHTML='';
    const total=timelineDuration();
    cameraMoves().forEach((move,index)=>{
      const element=document.createElement('div');
      element.className='timelineClip timelineCameraClip '+(move.id===timelineState.selectedCameraMoveId?'isSelected':'');
      element.style.left=Math.max(0,Math.min(100,(Number(move.time)||0)/total*100))+'%';
      element.style.width=Math.max(1.2,Math.min(100-(Number(move.time)||0)/total*100,Math.max(.1,Number(move.duration)||.1)/total*100))+'%';
      element.textContent='Kamera '+(index+1);element.title=formatTimelineTime(move.time||0)+' · '+formatTimelineTime(move.duration||0);
      element.onclick=event=>{
        event.stopPropagation();
        if(element.dataset.dragged){delete element.dataset.dragged;return;}
        timelineState.selectedEventId=null;timelineState.selectedAudioClipId=null;timelineState.selectedCameraMoveId=move.id;window.vseActiveClipboardScope='camera';renderCameraTrack();openPanel(move);
      };
      makeDraggable(element,move);clips.appendChild(element);
    });
  }

  function interpolatedView(time){
    const moves=cameraMoves();if(!moves.length)return null;
    let active=null;
    for(const move of moves){
      if(time<(Number(move.time)||0))break;
      active=move;
    }
    if(!active)return cloneView(moves[0].cameraStart||wholeView());
    const start=Number(active.time)||0,duration=Math.max(.001,Number(active.duration)||.001);
    const a=active.cameraStart||wholeView(),b=active.cameraEnd||wholeView();
    const elapsed=Math.max(0,time-start);
    const type=['sine','circle','path'].includes(active.cameraPathType)?active.cameraPathType:'linear';
    const repeats=type==='path'&&active.cameraPathLoop&&active.cameraPathRepeat;
    const rawT=repeats?(elapsed%duration)/duration:Math.max(0,Math.min(1,elapsed/duration));
    if(type==='path'){
      const points=(Array.isArray(active.cameraPathPoints)&&active.cameraPathPoints.length>=2?active.cameraPathPoints:[a,b]).map(cloneView);
      const loop=!!active.cameraPathLoop,segmentCount=loop?points.length:points.length-1;
      const position=Math.min(segmentCount,rawT*segmentCount);
      const segment=Math.min(segmentCount-1,Math.floor(position));
      const localRaw=position-segment,local=localRaw*localRaw*(3-2*localRaw);
      const from=points[segment],to=(segment===points.length-1)?points[0]:points[segment+1];
      return {zoom:from.zoom+(to.zoom-from.zoom)*local,panX:from.panX+(to.panX-from.panX)*local,panY:from.panY+(to.panY-from.panY)*local};
    }
    const t=type==='circle'?(1-Math.cos(rawT*Math.PI*2))*.5:rawT*rawT*(3-2*rawT);
    const view={zoom:a.zoom+(b.zoom-a.zoom)*t,panX:a.panX+(b.panX-a.panX)*t,panY:a.panY+(b.panY-a.panY)*t};
    if(type==='circle'&&rawT>0&&rawT<1){
      const stageW=Math.max(1,Number(scene.stageWidth||stageState.w)||1920);
      const radius=Math.max(0,Number(active.cameraCircleRadius??200));
      const direction=active.cameraCircleDirection==='right'?1:-1;
      view.panX+=Math.sin(rawT*Math.PI*2)*direction*radius/stageW;
      return view;
    }
    if(type!=='sine'||rawT<=0||rawT>=1)return view;
    const stageW=Math.max(1,Number(scene.stageWidth||stageState.w)||1920);
    const stageH=Math.max(1,Number(scene.stageHeight||stageState.h)||1080);
    const distance=Math.hypot((Number(b.panX)-Number(a.panX))*stageW,(Number(b.panY)-Number(a.panY))*stageH)*t;
    const wave=phase=>Math.sin(phase*Math.PI*2);
    const ampX=Math.max(0,Number(active.cameraAmplitudeX)||0),ampY=Math.max(0,Number(active.cameraAmplitudeY)||0);
    const lengthX=Math.max(1,Number(active.cameraWavelengthX)||200),lengthY=Math.max(1,Number(active.cameraWavelengthY)||200);
    view.panX+=wave(distance/lengthX)*ampX/stageW;
    view.panY+=wave(distance/lengthY)*ampY/stageH;
    return view;
  }
  function applyCameraTime(time){const view=interpolatedView(time);if(view)applyView(view);}

  let forcedSeek=false,cameraPlaybackActive=false;
  const previousSeek=seekTimelineMedia;
  seekTimelineMedia=function(seconds){forcedSeek=true;try{return previousSeek(seconds);}finally{forcedSeek=false;}};
  const previousPlayheadUpdate=updateTimelinePlayhead;
  updateTimelinePlayhead=function(){
    if(timelineState.playing)cameraPlaybackActive=true;
    if(timelineState.playing||forcedSeek||cameraPlaybackActive)applyCameraTime(currentTimelineTime());
    if(!timelineState.playing)cameraPlaybackActive=false;
    previousPlayheadUpdate();
    playhead.style.left=(currentTimelineTime()/timelineDuration()*100)+'%';
  };
  const previousTimelineUpdate=updateTimelineUI;
  updateTimelineUI=function(){const result=previousTimelineUpdate();renderCameraTrack();return result;};

  lane.onclick=event=>{
    event.stopPropagation();
    const rect=lane.getBoundingClientRect();seekTimelineMedia((event.clientX-rect.left)/Math.max(1,rect.width)*timelineDuration());
  };
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)closePanel();});

  window.vseCameraTimeline={openMove:move=>openPanel(move),close:closePanel,afterDelete:()=>{if(cameraMoves().length)applyCameraTime(currentTimelineTime());else applyView(wholeView());}};

  const header=panel.querySelector('.cameraTimelineHeader');
  header.addEventListener('pointerdown',event=>{
    if(event.button!==0||event.target.closest('button'))return;
    const rect=panel.getBoundingClientRect(),dx=event.clientX-rect.left,dy=event.clientY-rect.top;
    const move=moveEvent=>{panel.style.left=Math.max(8,Math.min(window.innerWidth-panel.offsetWidth-8,moveEvent.clientX-dx))+'px';panel.style.top=Math.max(52,Math.min(window.innerHeight-panel.offsetHeight-8,moveEvent.clientY-dy))+'px';panel.style.right='auto';};
    const up=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);};
    document.addEventListener('pointermove',move);document.addEventListener('pointerup',up,{once:true});
  });

  renderCameraTrack();
})();
