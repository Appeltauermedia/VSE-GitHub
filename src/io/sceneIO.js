// VSE IO helpers. Classic script during gradual migration.
function cleanObjectForObjectExport(o){const runtimeKeys=new Set(['screenTexture','screenMediaElement','screenMediaUrl','screenCaptureStream','screenPlaylist','screenTextTexture','screenTextCanvas','screenTextBgImageElement','particleTexture','particleImageElement','particleImageUrl','imageAssetTexture','imageAssetElement','imageAssetUrl','audioSourceElement','audioSourceNode','audioSourceGain','audioSourceAnalyserTap','audioSourcePan','audioSourceMediaUrl','greenscreenTexture','greenscreenMediaElement','greenscreenMediaUrl','greenscreenStream','greenscreenTexture','greenscreenMediaElement','greenscreenMediaUrl','greenscreenStream']);return Object.fromEntries(Object.entries(o).filter(([k,v])=>!k.startsWith('_')&&!runtimeKeys.has(k)&&typeof v!=='function'));}

function exportObjectFile(){let arr=getSelectedObjects();if(arr.length<1&&selected)arr=[selected];if(arr.length<1){alert('Keine Auswahl für .object-Export.');return;}const gids=[...new Set(arr.map(o=>o.groupId).filter(Boolean))];const pack={vse:'2.0',format:'vse-object',version:'119',groups:groups.filter(g=>gids.includes(g.id)),objects:arr.map(cleanObjectForObjectExport)};downloadText(((arr[0].groupName||arr[0].name||'VSE_Object').replace(/[^a-z0-9_-]+/gi,'_'))+'.object',JSON.stringify(pack,null,2));}

function importObjectData(data){const arr=Array.isArray(data.objects)?data.objects:(data.object?[data.object]:[]);if(!arr.length)throw new Error('Keine Objekte in .object-Datei gefunden.');const groupMap=new Map();if(Array.isArray(data.groups)){for(const g of data.groups){const ng='grp_'+id++;groupMap.set(g.id,ng);groups.push({id:ng,name:g.name||'Importierte Gruppe'});}}selectedIds.clear();let avg={x:0,y:0};arr.forEach(o=>{avg.x+=Number(o.x||0);avg.y+=Number(o.y||0);});avg.x/=arr.length;avg.y/=arr.length;for(const src of arr){const o=JSON.parse(JSON.stringify(src));ensureTypeDefaults(o);o.id='obj_'+id++;o.name=(o.name||o.type)+'_import';o.x=Number(o.x||0)-avg.x+50;o.y=Number(o.y||0)-avg.y+50;if(o.groupId){o.groupId=groupMap.get(o.groupId)||('grp_'+id++);if(!groups.find(g=>g.id===o.groupId))groups.push({id:o.groupId,name:o.groupName||'Importierte Gruppe'});}objects.push(o);selectedIds.add(o.id);if(o.screenMediaData&&o.screenMediaType==='image')loadScreenImageFromData(o,o.screenMediaData,o.screenMediaName||'importiertes Bild');if(o.particleImageData)loadParticleImageFromData(o,o.particleImageData,o.particleImageName||'importiertes Bild');if(o.imageAssetData)loadImageAssetFromData(o,o.imageAssetData,o.imageAssetName||'importiertes Bild');if(o.type==='audioSource'){o.audioSourceType='none';o.audioSourceName='';o.audioSourceElement=null;o.audioSourceNode=null;o.audioSourceGain=null;o.audioSourceAnalyserTap=null;o.audioSourcePan=null;o.audioSourceMediaUrl='';o.audioSourcePlaying=false;}if(o.type==='audioSource'){o.audioSourceType='none';o.audioSourceName='';o.audioSourceUrl=o.audioSourceUrl||'';}if(o.type==='greenscreen'){o.greenscreenMediaType='none';o.greenscreenMediaName='';}}selected=objects.find(o=>selectedIds.has(o.id))||null;selectSingleCore(selected);updateHud();updateObjectManager();}

function projectPackage(){
  return {vse:'2.0',module:'workbench',version:'197',format:'scene-project',notes:{images:'embedded_as_data_url',videos:'not_embedded',music:'not_embedded',graphics:'all_visual_objects_webgl'},layers:{backlight:'-99--1',background:0,objects:'1-99'},groups:groups,scene:{...scene},background:{...background},timeline:{duration:timelineState.duration,widthPercent:timelineState.widthPercent,events:timelineState.events},audio:{source:audioState.source,sensitivity:audioState.sensitivity,monitor:audioState.monitor,showBpm:audioState.showBpm,mediaName:audioFileName?audioFileName.textContent:'',musicEmbedded:false,systemAudio:'analysis-only',microphone:'analysis-only',lightbarMapping:{module:'multiHeadLightEmitter',rendering:'webgl_beams_and_glow_per_head',audio:'uses_same_lightAudioBackbone_asLightEmitter'},lightMapping:{bass:'intensity',high:'color',level:'angle_toMaxAudioAngle_unlessLaserMode',beat:'alternateColor',mid:'glow',separateColorChange:'optionalOwnFrequencyAndThreshold_lightColorMusicEnabled',laserMode:'locksBeamAngleAndKeepsBeamBundled'},lightMotion:{panSpeed:'audioGatedPanSpeed_highRange0to30',panAngle:'audioGatedPanAngle',source:'audioLevelAndBands',direction:'beatAndSpectrumDependent'},sceneDimming:{screenDim:'backgroundOnly',screenBrighten:'sensitiveAudioLiftToOriginalBrightness',backlightPass:'allowsNegativeLayerObjectsToShineThroughBackground'},fogMapping:{bass:'density',high:'color',level:'emissionAngleAndMotion',mid:'sourceGlowAndTurbulence'},fogMotion:{lifetime:'visibleDistanceFromLifetime',dynamics:'emissionEnergy',gravity:'downwardSagInWebGLShader_0IsNoGravity',motion:'waberndeNoiseFlow',turbulence:'animatedCurlWarp'},screenMapping:{mode:'solidAudioPulseImageVideoTextMp3CoverSongTitle',widthHeight:'freeTransform',scanlines:'ledRaster',audio:'brightnessColorAndBars',media:'imageEmbedded_videoReferenceOnly',orientation:'flipXFlipYControls',videoAudio:'perScreenMuteAndVolume',screenGlow:'enabledScreenSamplesImageOrLocalVideoEdgeColorsAndDrivesAllLightEmitterColors_highStrengthBoostsLightIntensity',frameModes:'visible_hidden_editorOnly'},particleMapping:{module:'universalParticleCore',modes:['free','fireFountain','sparkFountain','explosion','glitter','confetti','ash','dust','snow','shockwave','starflight'],audio:'centralAudioBackbone_masterSensitivityControlled_triggerOnly_noContinuousJitter',emissionMode:'triggerOrPermanent',emissionDuration:'particleEmissionDurationControlsHowLongNewParticlesAreSpawned_inTriggerMode_orUnlimitedContinuousStream',unlimitedEmission:'unlimitedKeepsEmitterSpawningParticlesContinuously',triggerLock:'effectCannotRetriggerWhileEmissionOrParticlesAreStillActive',noAudioPreview:'triggeredParticleEffectsStayInactiveWithoutAudioSignal_permanentModeUnaffected',fireJetModel:'highInitialEnergy_laminarCore_thenTerminalTurbulence_noHardCutoff'},ipmMapping:{module:'imageParticleModule',source:'adaptedFromUploadedStandaloneIPM',rendering:'webglGpuPointSprites',effects:['none','pulse','ripple','swirl','explode','rain','scanner','orbit','noise'],media:'imageEmbedded_videoNotApplicable'},visualizerMapping:{module:'visualizerObjects',firstMode:'freqBarsVintageGreenYellowRed',frequencyScale:'logarithmic',levelNormalization:'lowFrequencyCompensation_dbShaped_noPermanentFullScale',selectedObjectOverlay:'blueFrequencyBandAndBlueThresholdLine',peakMarker:'redPeakMarkerPerBar_holdTimeUpTo240Seconds',decayHold:'removed_visualizerDecayFixedTo0',averageMarker:'whiteAverageLevelLinePerFrequencyBar',rendering:'trueWebGLShader_quad_dataTexture_noPerBarCpuGeometry',objectAudioReaction:'thresholdModeAboveOrBelow_blueLineRemainsThresholdMarker'},wysiwyg:{coordinateSystem:'objectsUseVirtualStagePercentPositionAndStageUnitSizes',relativeTo:'backgroundLayer0_virtualStageSurface',fullscreen:'sameStageSurfaceScaledUniformly_noReinterpretation'},imageAssetMapping:{module:'imageAssetObjects',formats:'png_jpg_jpeg_webp',rendering:'webgl_textured_quads_pngAlpha_perspectiveScalingOptional',physics:'optional_simple2D_boxOrCircle_dynamicObjectsCollideWithStaticOrDynamicImageAssets_testImpulse',actorInterface:'applyImpulseFromActor(actorId,contactPoint,force)'},audioSourceMapping:{module:'audioSourceObjects',source:'localFileOrStreamUrl',spatial:'xYPositionPreparedForXYZ',falloff:'rangeAndDistanceBasedGainPlusStereoPan',backbone:'optionalConnectToCentralAnalyzer'},groupEditing:{selectedGroup:'parameterChangesApplyToAllObjectsInsideSelectedGroup',multiSelection:'parameterChangesApplyToAllSelectedObjects'}},objects:cleanObjectsForExport()};
}

function downloadText(filename,text){
  const blob=new Blob([text],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),800);
}

function importProjectData(data,options={}){
  const preserveLocalColors=options.preserveLocalColors!==false;
  const preservedObjectIconColor=/^#[0-9a-f]{6}$/i.test(String(scene.objectIconColor||''))?String(scene.objectIconColor).toLowerCase():'#eef6ff';
  const preservedGridColor=/^#[0-9a-f]{6}$/i.test(String(scene.gridColor||''))?String(scene.gridColor).toLowerCase():'#526e99';
  if(!data||!Array.isArray(data.objects))throw new Error('Keine gültige VSE-Projektdatei.');
  if(!options.preserveRuntimeMedia){objects.forEach(o=>{if(o.type==='screen')releaseScreenMedia(o);if(o.type==='imageAsset')releaseImageAsset(o);if(o.type==='audioSource')releaseAudioSource(o);if(o.type==='greenscreen')releaseGreenscreenMedia(o);if(o.type==='particle'||o.type==='imageParticle')releaseParticleImage(o);});if(window.vseScreenMediaFileRegistry instanceof Map)window.vseScreenMediaFileRegistry.clear();if(window.vseGreenscreenMediaFileRegistry instanceof Map)window.vseGreenscreenMediaFileRegistry.clear();}
  objects=[]; selected=null;
  scene.gridSpacing=100;
  scene.gridColor='#526e99';
  Object.assign(scene,{showGrid:true,screenDim:0,screenBrighten:0,dimTargetBackground:true,dimTargetImageAssets:true,dimTargetScreens:false,dimTargetGreenscreen:false,backlightPass:0,uiHidden:false,stageWidth:1920,stageHeight:1080,cameraZoom:1,cameraPanX:0,cameraPanY:0,vrSceneScale:1,vrSceneDistance:3,vrScreenCurvature:0,vrScreenSegments:64,mandalaEnabled:false,mandalaSegments:6,mandalaRotation:0,mandalaCenterX:.5,mandalaCenterY:.5,mandalaZoom:1,mandalaMix:1,mandalaAutoRotate:false,mandalaMusicRotation:false,mandalaMusicZoom:false,mandalaMusicMix:false,...windDefaults()},data.scene||{});ensureWindDefaults();
  if(typeof syncWorkspaceView==='function')syncWorkspaceView();
  if(preserveLocalColors){
    scene.objectIconColor=preservedObjectIconColor;
    scene.gridColor=preservedGridColor;
  }
  scene.gridSpacing=Math.max(10,Math.min(500,Math.round(Number(scene.gridSpacing)||100)));
  scene.gridColor=/^#[0-9a-f]{6}$/i.test(String(scene.gridColor||''))?String(scene.gridColor).toLowerCase():'#526e99';
  scene.backgroundSetsStageSize=!!scene.backgroundSetsStageSize;
  setStageResolution(scene.stageWidth||1920,scene.stageHeight||1080);
  if(backgroundSetsStageSize)backgroundSetsStageSize.checked=scene.backgroundSetsStageSize;
  if(showGrid)showGrid.checked=!!scene.showGrid;
  if(typeof syncObjectIconColor==='function')syncObjectIconColor();
  if(typeof syncGridSpacingUi==='function')syncGridSpacingUi(scene.gridSpacing);
  if(typeof syncGridColorUi==='function')syncGridColorUi(scene.gridColor);
  if(screenDim){screenDim.value=Number(scene.screenDim??0);screenDimValue.textContent=Number(scene.screenDim??0).toFixed(2);}
  if(screenBrighten){screenBrighten.value=Number(scene.screenBrighten??0);screenBrightenValue.textContent=Number(scene.screenBrighten??0).toFixed(2);} if(backlightPass){backlightPass.value=Number(scene.backlightPass??0);backlightPassValue.textContent=Number(scene.backlightPass??0).toFixed(2);}
  if(dimTargetBackground)dimTargetBackground.checked=scene.dimTargetBackground!==false;
  if(dimTargetImageAssets)dimTargetImageAssets.checked=scene.dimTargetImageAssets!==false;
  if(dimTargetScreens)dimTargetScreens.checked=scene.dimTargetScreens===true;
  if(dimTargetGreenscreen)dimTargetGreenscreen.checked=scene.dimTargetGreenscreen===true;
  syncVrViewerUi();
  syncWindUi();
  syncMandalaUi();
  applyBackgroundFromData(data.background||{});
  Object.assign(timelineState,{duration:180,widthPercent:100,events:[],selectedEventId:null,manualDuration:true,currentTime:0,playing:false,lastClockTime:0},data.timeline||{});
  updateTimelineUI();
  if(data.audio){
    audioState.sensitivity=Number(data.audio.sensitivity??audioState.sensitivity);
    audioState.monitor=!!data.audio.monitor;
    audioState.showBpm=!!data.audio.showBpm;
    if(audioSensitivity)audioSensitivity.value=audioState.sensitivity;
    if(audioSensValue)audioSensValue.textContent=audioState.sensitivity.toFixed(2);
    if(audioMonitor)audioMonitor.checked=audioState.monitor;
    if(audioShowBpm)audioShowBpm.checked=audioState.showBpm;
    updateBpmDisplayVisibility();
  }
  groups=Array.isArray(data.groups)?data.groups.filter(Boolean).map(group=>({...group})):[];
  objects=(data.objects||[]).filter(raw=>raw).map(raw=>ensureTypeDefaults({...raw}));
  const maxId=objects.reduce((m,o)=>Math.max(m,Number(String(o.id||'').replace(/\D/g,''))||0),0); if(maxId>=id)id=maxId+1;
  if(!options.preserveRuntimeMedia){
    objects.forEach(o=>{restoreScreenImage(o);restoreScreenTextBackgroundImage(o);restoreParticleImage(o);if(o.type==='imageAsset')loadImageAssetFromData(o,o.imageAssetData,o.imageAssetName||'importiertes Bild');if(o.type==='greenscreen'&&!o.greenscreenMediaData){o.greenscreenTexture=null;o.greenscreenMediaElement=null;o.greenscreenMediaUrl='';o.greenscreenStream=null;o.greenscreenMediaType='none';o.greenscreenMediaName='';}});
  }
  if(typeof restoreEmbeddedProjectMedia==='function')restoreEmbeddedProjectMedia(data);
  select(objects[0]||null); syncLightUI(); updateHud(); updateObjectManager(); const outEl=document.getElementById('out'); if(outEl) outEl.value=JSON.stringify(projectPackage(),null,2);
}
