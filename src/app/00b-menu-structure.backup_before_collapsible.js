(function(){
  function el(id){return document.getElementById(id);}
  function makePanel(title, classes){
    const panel=document.createElement('div');
    panel.className=(classes?classes+' ':'')+'panel menuTier';
    panel.style.marginTop='12px';
    const h=document.createElement('h3');
    h.textContent=title;
    panel.appendChild(h);
    return panel;
  }
  function moveNode(panel,node){
    if(node&&node.parentNode!==panel)panel.appendChild(node);
  }
  function visibilityClasses(node){
    const classes=[];
    let cur=node;
    while(cur&&cur!==document.body){
      if(cur.classList){
        [...cur.classList].forEach(cls=>{
          if((cls.startsWith('type-')||cls.startsWith('screen-')||cls.startsWith('particle-'))&&!classes.includes(cls))classes.push(cls);
        });
      }
      cur=cur.parentElement;
    }
    return classes;
  }
  function markVisibility(node,source){
    if(!node||!source||!node.classList)return;
    visibilityClasses(source).forEach(cls=>node.classList.add(cls));
  }
  function moveField(panel,id){
    const input=el(id);
    if(!input)return;
    const parent=input.parentElement;
    if(parent&&parent.tagName==='LABEL'){
      markVisibility(parent,input);
      moveNode(panel,parent);
      return;
    }
    if(parent&&parent.classList.contains('range-with-number')){
      const label=parent.previousElementSibling&&parent.previousElementSibling.tagName==='LABEL'?parent.previousElementSibling:null;
      markVisibility(label,input);
      markVisibility(parent,input);
      moveNode(panel,label);
      moveNode(panel,parent);
      return;
    }
    if(parent&&parent.parentElement&&parent.parentElement.classList.contains('row')){
      markVisibility(parent.parentElement,input);
      moveNode(panel,parent.parentElement);
      return;
    }
    if(parent&&parent.classList.contains('row')){
      markVisibility(parent,input);
      moveNode(panel,parent);
      return;
    }
    const label=input.previousElementSibling&&input.previousElementSibling.tagName==='LABEL'?input.previousElementSibling:null;
    markVisibility(label,input);
    markVisibility(input,input);
    moveNode(panel,label);
    moveNode(panel,input);
  }
  function moveButton(panel,id){const node=el(id);markVisibility(node,node);moveNode(panel,node);}
  function moveText(panel,id){const node=el(id);markVisibility(node,node);moveNode(panel,node);}
  function moveBlock(panel,selector){
    const node=document.querySelector(selector);
    moveNode(panel,node);
  }
  function insertAtTop(container,panel){
    if(container&&panel.childElementCount>1)container.insertBefore(panel,container.firstChild);
  }
  function structureSceneMenu(){
    const sceneBody=document.querySelector('details.fold:nth-of-type(2) .foldBody');
    if(!sceneBody)return;

    const primary=makePanel('Grundlagen · Bühne und Hintergrund');
    ['bgFile','bgColor','bgMode','bgOpacity','bgZoom'].forEach(id=>moveField(primary,id));
    moveButton(primary,'clearBgBtn');
    moveField(primary,'stagePreset');
    const stageWidth=el('stageWidth');
    if(stageWidth&&stageWidth.parentElement&&stageWidth.parentElement.parentElement&&stageWidth.parentElement.parentElement.classList.contains('row'))moveNode(primary,stageWidth.parentElement.parentElement);
    moveButton(primary,'setScreenResBtn');
    moveField(primary,'showGrid');
    moveButton(primary,'hideMenusBtn');

    const secondary=makePanel('Sekundär · Licht und Hintergrundwirkung');
    ['screenDim','screenBrighten','dimTargetBackground','dimTargetImageAssets','dimTargetScreens','dimTargetGreenscreen','backlightPass'].forEach(id=>moveField(secondary,id));

    const tertiary=makePanel('Tertiär · VR und Experimente');
    moveButton(tertiary,'vrViewerBtn');
    ['vrSceneScale','vrSceneDistance','vrScreenCurvature','vrScreenSegments'].forEach(id=>moveField(tertiary,id));
    moveText(tertiary,'vrStatus');

    insertAtTop(sceneBody,secondary);
    insertAtTop(sceneBody,primary);
    sceneBody.appendChild(tertiary);
    removeEmptyPanels(sceneBody);
  }
  function structureObjectMenu(){
    const params=el('params');
    if(!params)return;

    const primary=makePanel('Grundlagen · Quelle und Transform');
    ['pName','pType'].forEach(id=>moveField(primary,id));
    moveObjectSources(primary);
    ['pX','pY','pLayer','pSize','pRotation','pColor'].forEach(id=>moveField(primary,id));
    moveObjectDimensions(primary);
    insertAtTop(params,primary);

    const secondary=makePanel('Sekundär · Darstellung und Reaktion');
    ['pIntensity','pOpacity','pGlow','pScreenBrightness','pScreenOpacity','pScreenScanlines','pScreenAudio','pImageAssetOpacity','pGreenscreenOpacity','pWaterOpacity','pVisualizerOpacity','pMandalaObjOpacity','pMusic','pThresholdBelow','pAudioFreqLog','pLife'].forEach(id=>moveField(secondary,id));
    moveBlock(secondary,'#audioFreqRow');
    insertAfter(primary,secondary);

    const tertiary=makePanel('Tertiär · Gruppen und Spezialfunktionen');
    const groupPanel=[...params.querySelectorAll('.panel')].find(p=>p.textContent.includes('Gruppierung'));
    moveNode(tertiary,groupPanel);
    moveButton(tertiary,'dupBtn');
    moveButton(tertiary,'delBtn');
    params.appendChild(tertiary);
    removeEmptyPanels(params);
  }
  function moveObjectSources(panel){
    [
      'pScreenImageFile','pScreenVideoFile','pScreenMediaFolder','pScreenCaptureBtn','screenMediaInfo',
      'pImageAssetFile','pImageAssetClearBtn','pImageAssetExportPngBtn','imageAssetInfo',
      'pParticleImageFile','clearParticleImageBtn','particleImageInfo',
      'pGreenscreenVideoFile','pGreenscreenWebcamBtn','pGreenscreenStopBtn','greenscreenInfo',
      'pAudioSourceFile','pAudioSourceUrl','pAudioSourceLoadUrlBtn','audioSourceInfo','pAudioSourcePlayBtn','pAudioSourcePauseBtn'
    ].forEach(id=>{
      if(id.endsWith('Info')||id==='screenMediaInfo'||id==='greenscreenInfo'||id==='audioSourceInfo'||id==='particleImageInfo'||id==='imageAssetInfo')moveText(panel,id);
      else if(id.includes('Btn')||id.startsWith('clear'))moveButton(panel,id);
      else moveField(panel,id);
    });
  }
  function moveObjectDimensions(panel){
    [
      'pScreenWidth','pScreenHeight',
      'pImageAssetWidth','pImageAssetHeight','pImageAssetKeepAspect',
      'pGreenscreenWidth','pGreenscreenHeight','pGreenscreenKeepAspect','pGreenscreenSwapAspect',
      'pWaterWidth','pWaterHeight','pWaterShape',
      'pVisualizerWidth','pVisualizerHeight',
      'pMandalaObjWidth','pMandalaObjHeight','pMandalaObjKeepAspect'
    ].forEach(id=>moveField(panel,id));
  }
  function insertAfter(ref,node){
    if(ref&&ref.parentNode&&node)ref.parentNode.insertBefore(node,ref.nextSibling);
  }
  function removeEmptyPanels(container){
    [...container.querySelectorAll(':scope > .panel:not(.menuTier)')].forEach(panel=>{
      if(!panel.querySelector('input,select,button,textarea'))panel.remove();
    });
  }
  structureSceneMenu();
  structureObjectMenu();
})();
