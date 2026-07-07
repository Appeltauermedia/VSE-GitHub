(function(){
  function el(id){return document.getElementById(id);}
  function panelBody(panel){return panel&&panel.classList&&panel.classList.contains('menuTier')?panel.querySelector('.menuTierBody'):panel;}
  function makePanel(title, classes, open){
    const panel=document.createElement('details');
    panel.className=(classes?classes+' ':'')+'menuTier';
    panel.open=open!==false;
    const summary=document.createElement('summary');
    summary.textContent=title;
    const body=document.createElement('div');
    body.className='menuTierBody panel';
    panel.appendChild(summary);
    panel.appendChild(body);
    return panel;
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
  function moveNode(panel,node){
    const body=panelBody(panel);
    if(node&&body&&node.parentNode!==body)body.appendChild(node);
  }
  function moveField(panel,id){
    const input=el(id);
    if(!input)return;
    const parent=input.parentElement;
    if(parent&&parent.tagName==='LABEL'){markVisibility(parent,input);moveNode(panel,parent);return;}
    if(parent&&parent.classList.contains('range-with-number')){
      const label=parent.previousElementSibling&&parent.previousElementSibling.tagName==='LABEL'?parent.previousElementSibling:null;
      markVisibility(label,input);markVisibility(parent,input);moveNode(panel,label);moveNode(panel,parent);return;
    }
    if(parent&&parent.parentElement&&parent.parentElement.classList.contains('row')){markVisibility(parent.parentElement,input);moveNode(panel,parent.parentElement);return;}
    if(parent&&parent.classList.contains('row')){markVisibility(parent,input);moveNode(panel,parent);return;}
    const label=input.previousElementSibling&&input.previousElementSibling.tagName==='LABEL'?input.previousElementSibling:null;
    markVisibility(label,input);markVisibility(input,input);moveNode(panel,label);moveNode(panel,input);
  }
  function moveButton(panel,id){const node=el(id);markVisibility(node,node);moveNode(panel,node);}
  function moveText(panel,id){const node=el(id);markVisibility(node,node);moveNode(panel,node);}
  function moveBlock(panel,selector){moveNode(panel,document.querySelector(selector));}
  function insertAtTop(container,panel){
    const body=panelBody(panel);
    if(container&&body&&body.childElementCount)container.insertBefore(panel,container.firstChild);
  }
  function setVisibleTypes(panel,types){
    panel.dataset.visibleTypes=types.join(',');
  }

  function structureSceneMenu(){
    const sceneBody=document.querySelector('details.fold:nth-of-type(2) .foldBody');
    if(!sceneBody)return;

    const primary=makePanel('Grundlagen - Bühne und Hintergrund','menuTierPrimary',true);
    ['bgFile','bgColor','bgMode','bgOpacity','bgZoom','bgPanX','bgPanY'].forEach(id=>moveField(primary,id));
    moveButton(primary,'clearBgBtn');
    moveField(primary,'stagePreset');
    const stageWidth=el('stageWidth');
    if(stageWidth&&stageWidth.parentElement&&stageWidth.parentElement.parentElement&&stageWidth.parentElement.parentElement.classList.contains('row'))moveNode(primary,stageWidth.parentElement.parentElement);
    moveField(primary,'backgroundSetsStageSize');
    moveButton(primary,'setScreenResBtn');
    moveField(primary,'showGrid');
    moveButton(primary,'hideMenusBtn');

    const secondary=makePanel('Sekundär - Licht und Hintergrundwirkung','',false);
    ['screenDim','screenBrighten','dimTargetBackground','dimTargetImageAssets','dimTargetScreens','dimTargetGreenscreen','backlightPass'].forEach(id=>moveField(secondary,id));

    const vr=makePanel('Tertiär - VR und Experimente','',false);
    moveButton(vr,'vrViewerBtn');
    ['vrSceneScale','vrSceneDistance','vrScreenCurvature','vrScreenSegments'].forEach(id=>moveField(vr,id));
    moveText(vr,'vrStatus');

    insertAtTop(sceneBody,secondary);
    insertAtTop(sceneBody,primary);
    sceneBody.appendChild(vr);
    removeEmptyPanels(sceneBody);
  }

  function structureObjectMenu(){
    const params=el('params');
    if(!params)return;

    const primary=makePanel('Grundlagen - Transform','menuTierPrimary',true);
    ['pName','pType','pX','pY','pLayer','pSize','pRotation','pColor'].forEach(id=>moveField(primary,id));
    moveObjectDimensions(primary);
    insertAtTop(params,primary);

    const source=makePanel('Datei / Quelle laden','menuTierSource',false);
    setVisibleTypes(source,['screen','imageAsset','imageParticle','greenscreen','audioSource']);
    moveObjectSources(source);
    params.insertBefore(source,primary.nextSibling);

    const appearance=makePanel('Sekundär - Darstellung','',false);
    ['pIntensity','pOpacity','pGlow','pScreenBrightness','pScreenOpacity','pScreenLedSimulation','pScreenScanlines','pImageAssetOpacity','pGreenscreenOpacity','pWaterOpacity','pVisualizerOpacity','pMandalaObjOpacity','pLife'].forEach(id=>moveField(appearance,id));
    insertAfter(source,appearance);

    const reaction=makePanel('Musikreaktion - Frequenz und Threshold','',true);
    moveField(reaction,'pScreenAudioEnabled');
    moveField(reaction,'pScreenAudio');
    moveField(reaction,'pMusic');
    const thresholdBelow=el('pThresholdBelow');
    const thresholdLabel=thresholdBelow&&thresholdBelow.parentElement;
    const thresholdHint=thresholdLabel&&thresholdLabel.nextElementSibling;
    moveField(reaction,'pThresholdBelow');
    if(thresholdHint&&thresholdHint.classList.contains('mini'))moveNode(reaction,thresholdHint);
    const audioFreqRow=el('audioFreqRow');
    const audioFreqHint=audioFreqRow&&audioFreqRow.nextElementSibling;
    moveField(reaction,'pAudioFreqLog');
    if(audioFreqHint&&audioFreqHint.classList.contains('mini'))moveNode(reaction,audioFreqHint);
    insertAfter(appearance,reaction);

    const tertiary=makePanel('Tertiär - Gruppen und Spezialfunktionen','',false);
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
      'pGreenscreenVideoFile','pGreenscreenWebcamDevice','pGreenscreenWebcamBtn','pGreenscreenStopBtn','greenscreenInfo',
      'pAudioSourceFile','pAudioSourceUrl','pAudioSourceLoadUrlBtn','audioSourceInfo','pAudioSourcePlayBtn','pAudioSourcePauseBtn'
    ].forEach(id=>{
      if(id.endsWith('Info')||id==='screenMediaInfo'||id==='greenscreenInfo'||id==='audioSourceInfo'||id==='particleImageInfo'||id==='imageAssetInfo')moveText(panel,id);
      else if(id.includes('Btn')||id.startsWith('clear'))moveButton(panel,id);
      else moveField(panel,id);
    });
  }

  function moveObjectDimensions(panel){
    [
      'pScreenWidth','pScreenHeight','pScreenKeepAspect','pScreenDepthRotation',
      'pLightEmitterShape','pLightRectangleEmission','pLightEmitterLength','pLightEmitterWidth','pLightEmitterHeight','pLightEmitterKeepAspect',
      'pImageAssetWidth','pImageAssetHeight','pImageAssetKeepAspect',
      'pGreenscreenWidth','pGreenscreenHeight','pGreenscreenKeepAspect','pGreenscreenSwapAspect',
      'pWaterWidth','pWaterHeight','pWaterShape',
      'pVisualizerWidth','pVisualizerHeight',
      'pMandalaObjWidth','pMandalaObjHeight','pMandalaObjKeepAspect'
    ].forEach(id=>moveField(panel,id));
  }
  function insertAfter(ref,node){if(ref&&ref.parentNode&&node)ref.parentNode.insertBefore(node,ref.nextSibling);}
  function removeEmptyPanels(container){
    [...container.querySelectorAll(':scope > .panel:not(.menuTierBody)')].forEach(panel=>{
      if(!panel.querySelector('input,select,button,textarea'))panel.remove();
    });
  }
  structureSceneMenu();
  structureObjectMenu();
})();
