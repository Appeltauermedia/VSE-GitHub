/* ===== UI-Referenzen und Objektparameter ===== */
const params=document.getElementById('params'),empty=document.getElementById('empty'),hud=document.getElementById('hud'),count=document.getElementById('count'),out=document.getElementById('out'),selectionBox=document.getElementById('selectionBox'),pathSelectionOverlay=document.getElementById('pathSelectionOverlay');
const groupNameInput=document.getElementById('groupNameInput'),createGroupBtn=document.getElementById('createGroupBtn'),dissolveGroupBtn=document.getElementById('dissolveGroupBtn'),selectGroupBtn=document.getElementById('selectGroupBtn'),clearSelectionBtn=document.getElementById('clearSelectionBtn'),groupScaleDownBtn=document.getElementById('groupScaleDownBtn'),groupScaleUpBtn=document.getElementById('groupScaleUpBtn'),groupRotLeftBtn=document.getElementById('groupRotLeftBtn'),groupRotRightBtn=document.getElementById('groupRotRightBtn'),exportObjectBtn=document.getElementById('exportObjectBtn'),importObjectBtn=document.getElementById('importObjectBtn'),importObjectFile=document.getElementById('importObjectFile'),objectManager=document.getElementById('objectManager');
const fields=['Name','Type','X','Y','Layer','Size','Intensity','Rotation','WindAffected','WindInfluence','PanSpeed','PanAngle','Laser','Angle','AudioAngleMax','Range','Softness','Glow','Opacity','Color','AltColor','AltSpeed','AltAmount','LightColorMusicEnabled','LightColorMusicFreq','LightColorMusicThreshold','LightColorMusicBelow','LightColorMusicAmount','LightbarCount','LightbarLength','LightbarSpread','MovingMode','MovingPan','MovingTilt','MovingPanRange','MovingTiltRange','MovingSpeed','MovingBeamAngle','MovingBeamRange','MovingBodyVisible','MovingHeadGlow','MovingAudioMove','FogPanSpeed','FogPanAngle','FogAngle','FogLife','FogDynamics','FogGravity','FogSoftness','FogGlow','FogEmitterOpacity','FogOpacity','FogAltColor','FogAltSpeed','FogAltAmount','FogMotion','FogTurbulence','ScreenWidth','ScreenHeight','ScreenMode','ScreenTextSource','ScreenText','ScreenTextMode','ScreenTextFont','ScreenTextSize','ScreenTextColor','ScreenTextSpeed','ScreenTextBgMode','ScreenTextBgColor','ScreenTextBgOpacity','ScreenTextBgFit','ScreenFrameMode','ScreenBrightness','ScreenOpacity','ScreenScanlines','ScreenAudio','ScreenAltColor','ScreenAltSpeed','ScreenAltAmount','ScreenAmbilight','ScreenAmbilightStrength','ScreenEngineX','ScreenEngineY','ScreenEngineW','ScreenEngineH','ParticleMode','ParticleEmitterShape','ParticleEmitterLength','ParticleEmitterTransparency','ParticleAmount','ParticleSpeed','ParticleSpread','ParticleLife','ParticleEmissionDuration','ParticleUnlimited','ParticleEmissionMode','ParticleGravity','ParticleTurbulence','ParticleSize','ParticleGlow','ParticleOpacity','ParticleAltColor','ParticleAudio','ParticleBlastEnergy','ParticleShockwaveRadius','ParticleInitialVelocity','ParticleVelocitySpread','ParticleExplosionTurbulence','ParticleUpdraft','ParticleFireballDuration','ParticleSmokeAmount','ParticleSmokeLifetime','ParticleDebrisAmount','ParticleDebrisGravity','ParticleShockwaveVisible','ParticleJetPressure','ParticleJetVelocity','ParticleJetWidth','ParticleJetLength','ParticleCoreStability','ParticleEdgeTurbulence','ParticleUpdraftStrength','ParticleTipTurbulence','ParticleBrightness','ParticleGlowStrength','ParticleJetSmokeAmount','IpmDensity','IpmParticleSize','IpmScale','IpmOpacity','IpmMode','IpmReaction','IpmReturn','IpmThreshold','IpmWave','IpmJitter','IpmPixelMode','IpmEffectStrength','IpmEffectSpeed','IpmAudioEffectSpeed','IpmAudioEffectStrength','IpmAudioEffectPulse','IpmAudioMovement','IpmAudioSize','IpmAudioAlpha','IpmUseImageColors','IpmMono','IpmInvert','IpmFlipX','IpmFlipY','IpmDestructionEnabled','IpmDestructionMode','IpmDestructionReverse','IpmDestructionAudioEnabled','IpmDestructionStrength','IpmDestructionDirX','IpmDestructionDirY','IpmDestructionSpread','IpmDestructionGravity','IpmDestructionDuration','IpmDestructionReturnEnabled','IpmDestructionReturnSpeed','IpmDestructionRandomness','IpmDestructionClusterSize','IpmDestructionParticleFade','IpmDestructionFadeTime','IpmDestructionAudioThreshold','IpmDestructionRetrigger','VisualizerMode','VisualizerWidth','VisualizerHeight','VisualizerBars','VisualizerSensitivity','VisualizerGap','VisualizerOpacity','VisualizerPeakHold','MandalaObjWidth','MandalaObjHeight','MandalaObjKeepAspect','MandalaObjVisible','MandalaObjLocked','MandalaObjOpacity','MandalaObjSegments','MandalaObjRotation','MandalaObjCenterX','MandalaObjCenterY','MandalaObjZoom','MandalaObjMix','MandalaObjAutoRotate','MandalaObjMusicRotation','MandalaObjMusicZoom','MandalaObjMusicMix','ImageAssetWidth','ImageAssetHeight','ImageAssetKeepAspect','ImageAssetOpacity','ImageAssetIgnoreGlobalDimming','ImageAssetPerspectiveEnabled','ImageAssetPerspectiveStrength','ImageAssetPerspectiveMin','ImageAssetAudioEnabled','ImageAssetAudioDirX','ImageAssetAudioDirY','ImageAssetAudioStrength','ImageAssetAudioPhysicsImpulse','ImageAssetAudioImpulseCooldown','ImageAssetPhysicsEnabled','ImageAssetMass','ImageAssetGravity','ImageAssetFriction','ImageAssetBounce','ImageAssetAngularDamping','ImageAssetLinearDamping','ImageAssetCollisionEnabled','ImageAssetReverseXOnSideCollision','ImageAssetColliderType','ImageAssetImpulseX','ImageAssetImpulseY','ImageAssetImpulseStrength','ImageAssetImpulseRotation','AudioSourceVolume','AudioSourceRange','AudioSourceFalloff','AudioSourceIconOpacity','AudioSourceLoop','AudioSourceAnalyze','AudioSourceDirectional','AudioSourceDirection','GreenscreenWidth','GreenscreenHeight','GreenscreenKeepAspect','GreenscreenSwapAspect','GreenscreenKeyColor','GreenscreenTolerance','GreenscreenSoftness','GreenscreenEdgeTrim','GreenscreenSpillReduction','GreenscreenEdgeDarken','GreenscreenOpacity','GreenscreenAudioEnabled','GreenscreenAudioVolume','GreenscreenShadowEnabled','GreenscreenShadowWidth','GreenscreenShadowHeight','GreenscreenShadowOffsetX','GreenscreenShadowOffsetY','GreenscreenShadowSoftness','GreenscreenShadowOpacity','ShadowEnabled','ShadowMode','ShadowOpacity','ShadowBlur','ShadowOffsetX','ShadowOffsetY','ShadowScaleX','ShadowScaleY','ShadowRotation','ShadowColor','WaterMode','WaterWidth','WaterHeight','WaterOpacity','WaterWaveHeight','WaterWaveScale','WaterWaveSpeed','WaterFlowDirection','WaterFlowSpeed','WaterFlowScale','WaterDistortionStrength','WaterReflectionStrength','WaterHighlightStrength','WaterWaveNoise','WaterEdgeFade','WaterColorTint','WaterAudioReaction','WaterSparklesEnabled','WaterSparkleDensity','WaterSparkleSize','WaterSparkleBrightness','WaterSparkleSpeed','WaterSparkleColor','WaterFoamEnabled','WaterFoamAmount','WaterFoamSpeed','WaterFoamScale','WaterFoamOpacity','Music','ThresholdBelow','Life'].reduce((m,k)=>(m[k]=document.getElementById('p'+k),m),{});
const groupSyncShadow={enabled:document.getElementById('groupSyncShadowEnabled'),opacity:document.getElementById('groupSyncShadowOpacity'),blur:document.getElementById('groupSyncShadowBlur'),color:document.getElementById('groupSyncShadowColor'),offset:document.getElementById('groupSyncShadowOffset'),scale:document.getElementById('groupSyncShadowScale')};
const bgFile=document.getElementById('bgFile'),bgColor=document.getElementById('bgColor'),bgMode=document.getElementById('bgMode'),bgOpacity=document.getElementById('bgOpacity'),bgZoom=document.getElementById('bgZoom');
const bgToImageAssetBtn=document.getElementById('bgToImageAssetBtn'),bgToImageAssetStatus=document.getElementById('bgToImageAssetStatus'),bgCaptureShape=document.getElementById('bgCaptureShape'),bgCaptureSource=document.getElementById('bgCaptureSource'),bgCaptureRemoveFromBackground=document.getElementById('bgCaptureRemoveFromBackground'),bgCaptureCreateAssetBtn=document.getElementById('bgCaptureCreateAssetBtn'),waterShapeInput=document.getElementById('pWaterShape');
let bgCaptureMode=false,bgCaptureDrag=null,bgCaptureUndo=null,waterDrawMode=null,waterDrawDrag=null;
function getBgCaptureShape(){return (bgCaptureShape&&bgCaptureShape.value)||'rect';}
function getBgCaptureSource(){return (bgCaptureSource&&bgCaptureSource.value)||'background';}
function getBgCaptureRemoveFromBackground(){return !!(bgCaptureRemoveFromBackground&&bgCaptureRemoveFromBackground.checked);}
function setBgCaptureButtonState(active){
  const capturePanel=document.getElementById('bgCaptureParams');
  if(!active&&capturePanel)capturePanel.style.display='none';
  if(!bgToImageAssetBtn)return;
  bgToImageAssetBtn.innerHTML=active
    ? '<b>✕</b><small>Capture abbrechen: Hintergrund → Asset ist aktiv. Nochmals klicken zum Abbrechen.</small>'
    : '<b>✂️</b><small>Hintergrundbereich als Asset: Rechteck, Kreis/Ellipse oder freien Pfad direkt auf der Arbeitsfläche markieren.</small>';
}
const screenImageFile=document.getElementById('pScreenImageFile'),screenVideoFile=document.getElementById('pScreenVideoFile'),screenMediaFolder=document.getElementById('pScreenMediaFolder'),screenPlaylistHold=document.getElementById('pScreenPlaylistHold'),screenPlaylistAuto=document.getElementById('pScreenPlaylistAuto'),screenPlaylistNextBtn=document.getElementById('pScreenPlaylistNextBtn'),screenPlaylistHoldValue=document.getElementById('screenPlaylistHoldValue'),screenCaptureBtn=document.getElementById('pScreenCaptureBtn'),screenMediaFit=document.getElementById('pScreenMediaFit'),screenFlipX=document.getElementById('pScreenFlipX'),screenFlipY=document.getElementById('pScreenFlipY'),screenVideoAudio=document.getElementById('pScreenVideoAudio'),screenVideoVolume=document.getElementById('pScreenVideoVolume'),screenVideoVolumeValue=document.getElementById('screenVideoVolumeValue'),screenAmbilightStrengthValue=document.getElementById('screenAmbilightStrengthValue'),screenEngineXValue=document.getElementById('screenEngineXValue'),screenEngineYValue=document.getElementById('screenEngineYValue'),screenEngineWValue=document.getElementById('screenEngineWValue'),screenEngineHValue=document.getElementById('screenEngineHValue'),clearScreenMediaBtn=document.getElementById('clearScreenMediaBtn'),screenMediaInfo=document.getElementById('screenMediaInfo'),screenTextBgImageFile=document.getElementById('pScreenTextBgImageFile'),clearScreenTextBgImageBtn=document.getElementById('clearScreenTextBgImageBtn'),screenTextBgInfo=document.getElementById('screenTextBgInfo');
const particleImageFile=document.getElementById('pParticleImageFile'),clearParticleImageBtn=document.getElementById('clearParticleImageBtn'),particleImageInfo=document.getElementById('particleImageInfo'),ipmDestructionTestBtn=document.getElementById('pIpmDestructionTestBtn');
const greenscreenVideoFile=document.getElementById('pGreenscreenVideoFile'),greenscreenWebcamDevice=document.getElementById('pGreenscreenWebcamDevice'),greenscreenWebcamBtn=document.getElementById('pGreenscreenWebcamBtn'),greenscreenStopBtn=document.getElementById('pGreenscreenStopBtn'),greenscreenInfo=document.getElementById('greenscreenInfo');
const imageAssetFile=document.getElementById('pImageAssetFile'),imageAssetClearBtn=document.getElementById('pImageAssetClearBtn'),imageAssetExportPngBtn=document.getElementById('pImageAssetExportPngBtn'),imageAssetInfo=document.getElementById('imageAssetInfo'),imageAssetImpulseBtn=document.getElementById('pImageAssetImpulseBtn');
const audioSourceFile=document.getElementById('pAudioSourceFile'),audioSourceUrl=document.getElementById('pAudioSourceUrl'),audioSourceLoadUrlBtn=document.getElementById('pAudioSourceLoadUrlBtn'),audioSourceInfo=document.getElementById('audioSourceInfo'),audioSourcePlayBtn=document.getElementById('pAudioSourcePlayBtn'),audioSourcePauseBtn=document.getElementById('pAudioSourcePauseBtn');
const screenDim=document.getElementById('screenDim'),screenBrighten=document.getElementById('screenBrighten'),backlightPass=document.getElementById('backlightPass'),screenDimValue=document.getElementById('screenDimValue'),screenBrightenValue=document.getElementById('screenBrightenValue'),backlightPassValue=document.getElementById('backlightPassValue'),dimTargetBackground=document.getElementById('dimTargetBackground'),dimTargetImageAssets=document.getElementById('dimTargetImageAssets'),dimTargetScreens=document.getElementById('dimTargetScreens'),dimTargetGreenscreen=document.getElementById('dimTargetGreenscreen');
const micBtn=document.getElementById('micBtn'),micDeviceSelect=document.getElementById('micDeviceSelect'),sysBtn=document.getElementById('sysBtn'),stopAudioBtn=document.getElementById('stopAudioBtn'),audioFile=document.getElementById('audioFile'),audioFolder=document.getElementById('audioFolder'),audioPlaylist=document.getElementById('audioPlaylist'),audioPrevBtn=document.getElementById('audioPrevBtn'),audioNextBtn=document.getElementById('audioNextBtn'),audioPlayer=document.getElementById('audioPlayer'),audioMonitor=document.getElementById('audioMonitor'),audioSensitivity=document.getElementById('audioSensitivity'),audioFreqAnalyzer=document.getElementById('audioFreqAnalyzer'),audioStatus=document.getElementById('audioStatus'),audioShowBpm=document.getElementById('audioShowBpm'),bpmDisplay=document.getElementById('bpmDisplay'),bpmValue=document.getElementById('bpmValue');
const audioPlayPauseBtn=document.getElementById('audioPlayPauseBtn'),audioRestartBtn=document.getElementById('audioRestartBtn'),audioSeek=document.getElementById('audioSeek'),audioCurrentTime=document.getElementById('audioCurrentTime'),audioDuration=document.getElementById('audioDuration'),audioVolume=document.getElementById('audioVolume'),audioVolumeValue=document.getElementById('audioVolumeValue'),audioFileName=document.getElementById('audioFileName');
function hex(h){h=(h||'#ffffff').replace('#','');return [parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255];}
function mixColor(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
function clamp01(v){return Math.max(0,Math.min(1,v));}
const ambilightState={active:false,color:[1,1,1],strength:0,lastSample:0};
const ambilightCanvas=document.createElement('canvas');
ambilightCanvas.width=24;ambilightCanvas.height=14;
const ambilightCtx=ambilightCanvas.getContext('2d',{willReadFrequently:true});
function sampleMediaAverageColor(media){
  if(!media||!ambilightCtx)return null;
  const w=ambilightCanvas.width,h=ambilightCanvas.height;
  try{
    ambilightCtx.clearRect(0,0,w,h);
    ambilightCtx.drawImage(media,0,0,w,h);
    const d=ambilightCtx.getImageData(0,0,w,h).data;
    let r=0,g=0,b=0,n=0;
    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        const edge=(x<3||x>w-4||y<2||y>h-3);
        if(!edge)continue;
        const i=(y*w+x)*4;
        const a=d[i+3]/255;
        if(a<0.05)continue;
        r+=d[i]*a; g+=d[i+1]*a; b+=d[i+2]*a; n+=a;
      }
    }
    if(n<=0)return null;
    return [r/(255*n),g/(255*n),b/(255*n)];
  }catch(e){return null;}
}
function colorFromHexForAmbilight(h){
  const c=hex(h||'#ffffff');
  return [c[0],c[1],c[2]];
}
function getScreenGlowSampleSource(o){
  // Screen-Glow darf nicht nur klassische Bild-/Video-Screens auswerten.
  // Seit Textmodus und MP3-Cover gibt es weitere WebGL-Screenquellen.
  // Diese Funktion liefert daher die jeweils sichtbare CPU-seitige Quelle,
  // ohne den WebGL-Renderpfad oder den Audio-Pfad anzufassen.
  if(!o||o.type!=='screen')return null;
  if(o.screenMode==='mp3cover'&&audioCoverState&&audioCoverState.found&&audioCoverState.image){
    return audioCoverState.image;
  }
  if(o.screenMode==='text'){
    try{ensureScreenTextTexture(o);}catch(e){}
    if(o.screenTextCanvas)return o.screenTextCanvas;
    return colorFromHexForAmbilight(o.screenTextBgMode==='color'?o.screenTextBgColor:o.color);
  }
  const media=o.screenMediaElement;
  if(o.screenMediaType==='image'&&media&&media.complete!==false)return media;
  if(o.screenMediaType==='video'&&media&&media.readyState>=2)return media;
  if(o.screenMode==='solid')return colorFromHexForAmbilight(o.color);
  if(o.screenMode==='audio'||o.screenMode==='pulse'){
    const base=colorFromHexForAmbilight(o.color);
    const alt=colorFromHexForAmbilight(o.screenAltColor||o.color);
    const t=Math.max(0,Math.min(1,screenAltMix(o)));
    return [base[0]+(alt[0]-base[0])*t,base[1]+(alt[1]-base[1])*t,base[2]+(alt[2]-base[2])*t];
  }
  return null;
}
function updateAmbilightState(){
  let color=[0,0,0],strength=0,count=0;
  const now=performance.now();
  for(const o of objects){
    if(!o||o.type!=='screen'||!o.screenAmbilight)continue;
    const sample=getScreenGlowSampleSource(o);
    if(!sample)continue;
    if(!o._ambilightColor||now-(o._ambilightLastSample||0)>90||Array.isArray(sample)){
      let c=null;
      if(Array.isArray(sample)){
        c=sample;
      }else{
        c=sampleMediaAverageColor(sample);
      }
      if(c){o._ambilightColor=c;o._ambilightLastSample=now;}
    }
    if(o._ambilightColor){
      const s=Math.max(0,Math.min(4,Number(o.screenAmbilightStrength??1)));
      color[0]+=o._ambilightColor[0]*s;color[1]+=o._ambilightColor[1]*s;color[2]+=o._ambilightColor[2]*s;
      strength+=s;count++;
    }
  }
  if(count>0&&strength>0){
    ambilightState.active=true;
    ambilightState.strength=Math.max(0,Math.min(4,strength/count));
    ambilightState.color=[color[0]/strength,color[1]/strength,color[2]/strength];
  }else{
    ambilightState.active=false;
    ambilightState.strength=0;
    ambilightState.color=[1,1,1];
  }
}
const AUDIO_REACT_MIN=20, AUDIO_REACT_MAX=20000;
function freqToLogValue(freq){
  freq=Math.max(AUDIO_REACT_MIN,Math.min(AUDIO_REACT_MAX,Number(freq)||120));
  return Math.log(freq/AUDIO_REACT_MIN)/Math.log(AUDIO_REACT_MAX/AUDIO_REACT_MIN);
}
function logValueToFreq(v){
  v=Math.max(0,Math.min(1,Number(v)||0));
  return AUDIO_REACT_MIN*Math.pow(AUDIO_REACT_MAX/AUDIO_REACT_MIN,v);
}
function formatFreq(freq){
  freq=Number(freq)||0;
  return freq>=1000?(freq/1000).toFixed(freq>=10000?1:2).replace(/\.0$/,'')+' kHz':Math.round(freq)+' Hz';
}
function normalizedFrequencyBand(center, widthOctaves=1.0){
  if(!analyser||!audioState.enabled||!freqData||!freqData.length)return 0;
  const nyq=(audioCtx?audioCtx.sampleRate:44100)/2;
  const minF=AUDIO_REACT_MIN, maxF=Math.min(AUDIO_REACT_MAX,nyq*0.92);
  center=Math.max(minF,Math.min(maxF,Number(center)||120));
  const half=Math.pow(2,widthOctaves/2);
  const lo=Math.max(minF,center/half);
  const hi=Math.min(maxF,center*half);
  const binHz=nyq/freqData.length;
  const i1=Math.max(0,Math.floor(lo/binHz));
  const i2=Math.min(freqData.length-1,Math.max(i1+1,Math.ceil(hi/binHz)));
  let sum=0,n=0;
  for(let i=i1;i<=i2;i++){
    const raw=freqData[i]/255;
    const deNoised=clamp01((raw-0.10)/0.90);
    sum+=deNoised;
    n++;
  }
  let v=n?sum/n:0;

  // Gleiche Grund-Normalisierung wie beim Frequenzbalkenvisualizer,
  // damit der blaue Schwellenstrich auch wirklich zur Objektreaktion passt.
  const logPos=clamp01(Math.log(center/minF)/Math.log(maxF/minF));
  const lowTame=0.42 + 0.58*Math.pow(logPos,0.55);
  const highLift=1.00 + 0.18*Math.pow(logPos,1.25);
  v*=lowTame*highLift;
  v=Math.pow(clamp01(v*1.18),1.28);
  return clamp01(v);
}
function objectFrequencyEnergy(o){
  return normalizedFrequencyBand(Number(o.audioFreq??120),1.0);
}
function objectAudio(o){
  const rawBand=objectFrequencyEnergy(o);
  const threshold=clamp01(Number(o.music??0));
  const belowMode=!!(o.thresholdBelow);

  // Threshold-Gate:
  // Standard: Reaktion oberhalb des blauen Schwellenstrichs.
  // Checkbox: Reaktion unterhalb des blauen Schwellenstrichs.
  // Der Marker bleibt derselbe; nur die Auslöse-Logik wird invertiert.
  let passed=false;
  let band=0;
  if(belowMode){
    passed=rawBand<=threshold;
    band=passed ? clamp01((threshold-rawBand)/Math.max(0.0001,threshold)) : 0;
  }else{
    passed=rawBand>=threshold;
    band=passed ? clamp01((rawBand-threshold)/Math.max(0.0001,1-threshold)) : 0;
  }
  const beat=!!(audioState.beat&&passed&&band>0.02);
  const beatPulse=passed ? audioState.beatPulse*clamp01(band*3.0) : 0;
  return {level:band,bass:band,mid:band,high:band,beat,beatPulse,band,rawBand,threshold,thresholdBelow:belowMode,passed};
}
function lightColorMusicMix(o){
  if(!audioState.enabled||!o||!o.lightColorMusicEnabled)return 0;
  const threshold=clamp01(Number(o.lightColorMusicThreshold??.35));
  const raw=normalizedFrequencyBand(Number(o.lightColorMusicFreq??1000),1.0);
  let gated=0;
  if(o.lightColorMusicBelow){
    gated = raw<=threshold ? clamp01((threshold-raw)/Math.max(0.0001,threshold)) : 0;
  }else{
    gated = raw>=threshold ? clamp01((raw-threshold)/Math.max(0.0001,1-threshold)) : 0;
  }
  const amount=Math.max(0,Math.min(2,Number(o.lightColorMusicAmount??1)));
  return clamp01(gated*amount*audioState.sensitivity);
}
function activeColor(o){
  const base=hex(o.color||'#62d8ff');
  if(o.type!=='light'&&o.type!=='lightbar'&&o.type!=='movinghead')return base;

  // Screen-Glow hat Vorrang vor Audio-/Threshold-Logik.
  // Damit wird die Screen-Farbe immer auf Lichtemitter/Lightbars übertragen,
  // unabhängig davon, ob das Objekt oberhalb oder unterhalb seines Thresholds reagiert.
  if(ambilightState.active&&ambilightState.strength>0){
    const s=Math.max(0,Math.min(4,Number(ambilightState.strength||0)));
    const mixAmt=clamp01(s);
    return mixColor(base,ambilightState.color,mixAmt);
  }

  const alt=hex(o.altColor||'#ff4fd8');
  const speed=Number(o.altSpeed??0.6);
  const amount=Number(o.altAmount??1);
  const sens=audioState.sensitivity;
  const oa=objectAudio(o);
  let t=0;

  // Normaler alternierender Farbwechsel.
  if(speed>0&&amount>0){
    const phase=((performance.now()/1000)*speed*Math.PI*2)+(Number((o.id||'').replace(/\D/g,''))||0)*0.731;
    t=((Math.sin(phase)+1)*0.5)*amount;
  }

  // Separater musikgesteuerter Farbwechsel:
  // Wenn aktiv, bestimmt ausschließlich der eigene Frequenzbereich + Threshold
  // den Mix zur Alternativfarbe. Dadurch ist der Effekt klar sichtbar und nicht
  // vom normalen automatischen Farboszillator oder AltAmount abhängig.
  if(o.lightColorMusicEnabled){
    t=audioState.enabled&&sens>0 ? lightColorMusicMix(o) : 0;
  }else if(audioState.enabled&&sens>0&&amount>0){
    // Legacy-Verhalten bleibt erhalten, solange der neue Schalter nicht aktiv ist.
    const highColor=clamp01(oa.high*sens*1.35);
    const beatColor=clamp01(oa.beatPulse*sens*1.6);
    t=clamp01(t + Math.max(highColor, beatColor)*amount);
  }

  return mixColor(base,alt,t);
}
function fogColor(o){
  const base=hex(o.color||'#cfe8ff');
  const alt=hex(o.fogAltColor||'#b7f0ff');
  const speed=Number(o.fogAltSpeed??0.3);
  const amount=Number(o.fogAltAmount??0.4);
  let t=0;
  if(speed>0&&amount>0){
    const phase=((performance.now()/1000)*speed*Math.PI*2)+(Number((o.id||'').replace(/\D/g,''))||0)*0.419;
    t=((Math.sin(phase)+1)*0.5)*amount;
  }
  // Nebel-Farbe reagiert nur dann auf Musik, wenn die Objekt-Musikreaktion > 0 ist.
  // 0 ist hier wirklich 0: keine musikbedingte Farb-/Helligkeitsänderung.
  if(audioState.enabled&&amount>0&&Number(o.music??0)>0){
    const sens=audioState.sensitivity;
    const oa=objectAudio(o);
    t=clamp01(t + oa.high*sens*0.65*amount);
  }
  return mixColor(base,alt,t);
}
function lightAudio(o){
  const laserMode=!!o.laser;
  const base={
    intensity:o.intensity??1,
    angle:laserMode?Math.max(1,Math.min(Number(o.angle??6),12)):(o.angle??360),
    audioAngleMax:Math.max(Number(o.angle??360),Math.min(360,Number(o.audioAngleMax??360))),
    glow:o.glow??0.25
  };
  const sens=audioState.sensitivity;
  const oa=objectAudio(o);
  if(!audioState.enabled||sens<=0)return base;

  // gewählter Frequenzbereich → Intensität
  const intensity=base.intensity*(1 + oa.bass*sens*2.25);

  // Pegel → Abstrahlwinkel.
  // Normaler Lichtemitter: öffnet sich mit dem Pegel.
  // Laser-Modus: bleibt gebündelt, der Winkel wird NICHT durch Musik verändert.
  const angle=laserMode ? base.angle : base.angle + (base.audioAngleMax-base.angle)*clamp01(oa.level*sens*1.35);

  // Mitten → Glow. Glow bleibt weiterhin am Regler bis 0 abschaltbar;
  // die Mitten addieren nur bei aktiver Musiksensitivität etwas dazu.
  const glow=Math.max(0,Math.min(2,base.glow + oa.mid*sens*1.35));

  return {intensity,angle,glow};
}

function effectiveRotation(o){
  if(o._fixedEffectiveRotation!==undefined)return ((Number(o._fixedEffectiveRotation)%360)+360)%360;
  let r=Number(o.rotation||0);
  if(o.type==='light'||o.type==='lightbar'){
    const speed=Number(o.panSpeed||0);
    const angle=Number(o.panAngle||0);
    const sens=audioState.sensitivity;
    const oa=objectAudio(o);

    // Musikabhängiges Schwenken:
    // Der Lichtemitter läuft nicht mehr als gleichförmiger Sinus.
    // Audiopegel erzeugt Bewegung, Beats/Frequenzverteilung beeinflussen die Richtung.
    // Ohne Musik bleibt die Richtung/Position stehen.
    const now=performance.now();
    if(o._panPos===undefined)o._panPos=0;
    if(o._panDir===undefined)o._panDir=((Number((o.id||'').replace(/\D/g,''))||0)%2)?1:-1;
    if(o._panLast===undefined)o._panLast=now;
    if(o._lastBeatSwitch===undefined)o._lastBeatSwitch=0;

    const dt=Math.min(0.08,Math.max(0,(now-o._panLast)/1000));
    o._panLast=now;

    if(speed>0&&angle>0&&audioState.enabled&&sens>0){
      const motion=clamp01(oa.level*sens*2.45);

      if(motion>0.012){
        // Basslastige Beats kippen häufiger die Richtung, höhenreiche Signale geben kurze Gegenimpulse.
        // Dadurch entsteht ein lebendiger Suchscheinwerfer statt einer starren Pendelbewegung.
        const spectrumLean=(oa.bass-oa.high);
        if(oa.beat && now-o._lastBeatSwitch>120){
          const idSeed=(Number((o.id||'').replace(/\D/g,''))||1)*0.173;
          const decision=Math.sin(now*0.006 + idSeed + spectrumLean*3.2 + oa.mid*1.7);
          if(decision>-.18)o._panDir*=-1;
          o._lastBeatSwitch=now;
        }
        if(oa.high>0.22 && now-o._lastBeatSwitch>190){
          o._panDir*=-1;
          o._lastBeatSwitch=now;
        }

        const drift=o._panDir * speed * 56 * dt * motion;
        o._panPos += drift;

        // Grenzen weich abfangen; die Schwenkwinkel-Einstellung bleibt der maximale Arbeitsbereich.
        if(o._panPos>angle){o._panPos=angle; o._panDir=-1;}
        if(o._panPos<-angle){o._panPos=-angle; o._panDir=1;}

        // Kleine musikabhängige Mikrobewegung, aber nur bei Audio.
        const flutter=(oa.high-oa.mid)*angle*0.055*sens;
        r += o._panPos + flutter;
      }else{
        r += o._panPos;
      }
    }else{
      r += o._panPos;
    }
  }
  return ((r%360)+360)%360;
}

function particlePresetDefaults(mode){
  const m=mode||'free';
  const base={particleMode:m,particleEmitterShape:'point',particleEmitterLength:120,particleEmitterTransparency:0,particleAmount:.70,particleSpeed:1.0,particleSpread:70,particleLife:2.5,particleEmissionDuration:1.0,particleUnlimited:false,particleEmissionMode:'trigger',particleGravity:.4,particleTurbulence:.4,particleSize:3.0,particleGlow:.7,particleOpacity:.8,particleAltColor:'#ffd166',particleAudio:.25,particleBlastEnergy:1,particleShockwaveRadius:1,particleInitialVelocity:1,particleVelocitySpread:1,particleExplosionTurbulence:1,particleUpdraft:1,particleFireballDuration:.42,particleSmokeAmount:.75,particleSmokeLifetime:1,particleDebrisAmount:.35,particleDebrisGravity:1,particleShockwaveVisible:true,particleJetPressure:1,particleJetVelocity:1,particleJetWidth:1,particleJetLength:1,particleCoreStability:.85,particleEdgeTurbulence:1,particleUpdraftStrength:1,particleTipTurbulence:1,particleBrightness:1,particleGlowStrength:1,particleJetSmokeAmount:.25};
  const map={
    free:{color:'#66ccff',particleAltColor:'#ffffff',particleSpread:120,particleGravity:.2,particleTurbulence:.6},
    fireFountain:{color:'#ff6a1a',particleAltColor:'#ffd45c',particleAmount:1.65,particleSpeed:2.4,particleSpread:34,particleLife:2.6,particleGravity:-.18,particleTurbulence:.72,particleSize:4.2,particleGlow:1.35,particleOpacity:.9},
    gasJet:{color:'#fff4bf',particleAltColor:'#ff4a18',particleAmount:1.9,particleSpeed:2.8,particleSpread:18,particleLife:1.65,particleEmissionDuration:.55,particleGravity:-.04,particleTurbulence:.45,particleSize:4.6,particleGlow:1.55,particleOpacity:.96,particleAudio:.35,particleJetPressure:1.35,particleJetVelocity:1.55,particleJetWidth:.55,particleJetLength:1.45,particleCoreStability:.88,particleEdgeTurbulence:1.25,particleUpdraftStrength:.75,particleTipTurbulence:1.35,particleBrightness:1.25,particleGlowStrength:1.25,particleJetSmokeAmount:.22},
    sparkFountain:{color:'#ffd15c',particleAltColor:'#ffffff',particleAmount:1.35,particleSpeed:2.6,particleSpread:52,particleLife:1.8,particleGravity:.65,particleTurbulence:.25,particleSize:2.2,particleGlow:1.65,particleOpacity:.95},
    explosion:{color:'#ff7a20',particleAltColor:'#fff0aa',particleAmount:2.35,particleSpeed:3.0,particleSpread:360,particleLife:3.8,particleEmissionDuration:.12,particleGravity:.15,particleTurbulence:.55,particleSize:4.8,particleGlow:1.6,particleOpacity:.95,particleBlastEnergy:1.25,particleShockwaveRadius:1.35,particleInitialVelocity:1.35,particleVelocitySpread:1.65,particleExplosionTurbulence:1.35,particleUpdraft:1.25,particleFireballDuration:.34,particleSmokeAmount:.95,particleSmokeLifetime:1.45,particleDebrisAmount:.42,particleDebrisGravity:1.15,particleShockwaveVisible:true},
    glitter:{color:'#f4e7a1',particleAltColor:'#ffffff',particleAmount:.62,particleSpeed:.55,particleSpread:130,particleLife:5.8,particleGravity:.38,particleTurbulence:.85,particleSize:2.6,particleGlow:.85,particleOpacity:.68},
    confetti:{color:'#ff4fd8',particleAltColor:'#38d9ff',particleAmount:.82,particleSpeed:.68,particleSpread:165,particleLife:5.8,particleGravity:.55,particleTurbulence:.95,particleSize:5.0,particleGlow:.05,particleOpacity:.86},
    ash:{particleEmissionMode:'permanent',particleUnlimited:true,color:'#67635e',particleAltColor:'#252525',particleAmount:.56,particleSpeed:.38,particleSpread:180,particleLife:8.5,particleGravity:.12,particleTurbulence:1.45,particleSize:3.1,particleGlow:0,particleOpacity:.32},
    dust:{particleEmissionMode:'permanent',particleUnlimited:true,color:'#b7aa8c',particleAltColor:'#807467',particleAmount:.46,particleSpeed:.22,particleSpread:240,particleLife:9.5,particleGravity:.015,particleTurbulence:1.25,particleSize:2.2,particleGlow:.03,particleOpacity:.24},
    snow:{particleEmissionMode:'permanent',particleUnlimited:true,color:'#e8f7ff',particleAltColor:'#ffffff',particleAmount:.8,particleSpeed:.45,particleSpread:180,particleLife:7.0,particleGravity:.22,particleTurbulence:.65,particleSize:3.2,particleGlow:.12,particleOpacity:.72},
    rain:{particleEmissionMode:'permanent',particleUnlimited:true,color:'#9fd7ff',particleAltColor:'#d8f3ff',particleAmount:1.65,particleSpeed:3.2,particleSpread:34,particleLife:1.55,particleGravity:.9,particleTurbulence:.12,particleSize:2.1,particleGlow:.05,particleOpacity:.62},
    shockwave:{color:'#75dfff',particleAltColor:'#ffffff',particleAmount:.75,particleSpeed:1.25,particleSpread:360,particleLife:1.8,particleGravity:0,particleTurbulence:0,particleSize:3.5,particleGlow:1.2,particleOpacity:.75,particleAudio:.45},
    imageParticles:{color:'#ffffff',particleAltColor:'#75dfff',particleAmount:3,particleSpeed:.5,particleSpread:360,particleLife:4.5,particleGravity:0,particleTurbulence:.45,particleSize:2.4,particleGlow:.25,particleOpacity:.9,particleAudio:.35},
    starflight:{color:'#9fe8ff',particleAltColor:'#ffffff',particleAmount:.85,particleSpeed:1.4,particleSpread:360,particleLife:3.0,particleGravity:0,particleTurbulence:.2,particleSize:2.0,particleGlow:1.05,particleOpacity:.85,particleAudio:.35}
  };
  return {...base,...(map[m]||{})};
}
