/* ===== Objektmodell, Auswahl und Eigenschaften ===== */
const fogStartWidthInput=document.getElementById('pFogStartWidth');
const lightEmitterShapeInput=document.getElementById('pLightEmitterShape');
const lightRectangleEmissionInput=document.getElementById('pLightRectangleEmission');
const lightEmitterLengthInput=document.getElementById('pLightEmitterLength');
const lightEmitterWidthInput=document.getElementById('pLightEmitterWidth');
const lightEmitterHeightInput=document.getElementById('pLightEmitterHeight');
const objectKeepAspectInput=document.getElementById('pObjectKeepAspect');
const screenKeepAspectInput=document.getElementById('pScreenKeepAspect');
const lightEmitterKeepAspectInput=document.getElementById('pLightEmitterKeepAspect');
const screenTextBoldInput=document.getElementById('pScreenTextBold');
const screenTextItalicInput=document.getElementById('pScreenTextItalic');
const screenTextUnderlineInput=document.getElementById('pScreenTextUnderline');
const screenTextAlignInput=document.getElementById('pScreenTextAlign');
const screenTextLineHeightInput=document.getElementById('pScreenTextLineHeight');
function objectDimensionSpec(o){
  if(!o)return null;
  if(o.type==='screen'||o.type==='text')return {w:'screenWidth',h:'screenHeight',wf:fields.ScreenWidth,hf:fields.ScreenHeight,dw:o.type==='text'?520:260,dh:o.type==='text'?180:120};
  if(o.type==='visualizer')return {w:'visualizerWidth',h:'visualizerHeight',wf:fields.VisualizerWidth,hf:fields.VisualizerHeight,dw:520,dh:180};
  if(isWaterObject(o))return {w:'waterWidth',h:'waterHeight',wf:fields.WaterWidth,hf:fields.WaterHeight,dw:420,dh:180};
  if(o.type==='mandalaVisualizer')return {w:'mandalaObjWidth',h:'mandalaObjHeight',wf:fields.MandalaObjWidth,hf:fields.MandalaObjHeight,dw:420,dh:420};
  if(o.type==='imageAsset')return {w:'imageAssetWidth',h:'imageAssetHeight',wf:fields.ImageAssetWidth,hf:fields.ImageAssetHeight,dw:240,dh:160};
  if(o.type==='greenscreen')return {w:'greenscreenWidth',h:'greenscreenHeight',wf:fields.GreenscreenWidth,hf:fields.GreenscreenHeight,dw:480,dh:270};
  if(o.type==='light'&&(o.lightEmitterShape||'point')==='rectangle')return {w:'lightEmitterWidth',h:'lightEmitterHeight',wf:lightEmitterWidthInput,hf:lightEmitterHeightInput,dw:480,dh:270};
  return null;
}
function ensureObjectAspect(o){
  if(!o)return;
  if(o.objectKeepAspect===undefined)o.objectKeepAspect=true;
  const spec=objectDimensionSpec(o);
  if(spec&&!(Number(o.objectAspect)>0))o.objectAspect=Math.max(.001,Number(o[spec.w]??spec.dw)/Math.max(.001,Number(o[spec.h]??spec.dh)));
}
function applyObjectAspectLock(o,changedKey){
  const spec=objectDimensionSpec(o);
  if(!spec||o.objectKeepAspect===false||![spec.w,spec.h].includes(changedKey))return;
  const aspect=Math.max(.001,Number(o.objectAspect)||Number(o[spec.w]??spec.dw)/Math.max(.001,Number(o[spec.h]??spec.dh)));
  if(changedKey===spec.w)o[spec.h]=Math.max(1,Number(o[spec.w]??spec.dw)/aspect);
  else o[spec.w]=Math.max(1,Number(o[spec.h]??spec.dh)*aspect);
  if(spec.wf)spec.wf.value=o[spec.w];
  if(spec.hf)spec.hf.value=o[spec.h];
}
function isWaterObject(o){return !!(o&&['waterSurface','waterFlowOverlay'].includes(o.type));}
function isMandalaObject(o){return !!(o&&o.type==='mandalaVisualizer');}
function ensureMandalaDefaults(o){
  if(!isMandalaObject(o))return;
  o.mandalaObjWidth=Number(o.mandalaObjWidth??420);
  o.mandalaObjHeight=Number(o.mandalaObjHeight??420);
  o.mandalaObjAspect=Number(o.mandalaObjAspect??(o.mandalaObjWidth/Math.max(1,o.mandalaObjHeight))??1);
  o.mandalaObjKeepAspect=o.mandalaObjKeepAspect!==false;
  o.mandalaObjVisible=o.mandalaObjVisible!==false;
  o.mandalaObjLocked=!!(o.mandalaObjLocked??false);
  o.mandalaObjOpacity=Number(o.mandalaObjOpacity??1);
  o.mandalaObjSegments=Number(o.mandalaObjSegments??scene.mandalaSegments??6);
  o.mandalaObjRotation=Number(o.mandalaObjRotation??scene.mandalaRotation??0);
  o.mandalaObjCenterX=Number(o.mandalaObjCenterX??scene.mandalaCenterX??.5);
  o.mandalaObjCenterY=Number(o.mandalaObjCenterY??scene.mandalaCenterY??.5);
  o.mandalaObjZoom=Number(o.mandalaObjZoom??scene.mandalaZoom??1);
  o.mandalaObjMix=Number(o.mandalaObjMix??scene.mandalaMix??1);
  o.mandalaObjAutoRotate=!!(o.mandalaObjAutoRotate??scene.mandalaAutoRotate??false);
  o.mandalaObjMusicRotation=!!(o.mandalaObjMusicRotation??scene.mandalaMusicRotation??false);
  o.mandalaObjMusicZoom=!!(o.mandalaObjMusicZoom??scene.mandalaMusicZoom??false);
  o.mandalaObjMusicMix=!!(o.mandalaObjMusicMix??scene.mandalaMusicMix??false);
}
function ensureWaterDefaults(o){
  if(!isWaterObject(o))return;
  const isFlow=o.type==='waterFlowOverlay';
  o.waterShape=['rect','oval','freehand'].includes(o.waterShape)?o.waterShape:'rect';
  o.waterMode=o.waterMode||'fake';
  o.waterWidth=Number(o.waterWidth??(isFlow?360:420));
  o.waterHeight=Number(o.waterHeight??(isFlow?160:180));
  o.waterOpacity=Number(o.waterOpacity??(isFlow?.55:.65));
  o.waterWaveHeight=Number(o.waterWaveHeight??.35);
  o.waterWaveScale=Number(o.waterWaveScale??1.2);
  o.waterWaveSpeed=Number(o.waterWaveSpeed??.35);
  o.waterFlowDirection=Number(o.waterFlowDirection??0);
  o.waterFlowSpeed=Number(o.waterFlowSpeed??(isFlow?.55:.35));
  o.waterFlowScale=Number(o.waterFlowScale??(isFlow?1.5:1.2));
  o.waterDistortionStrength=Number(o.waterDistortionStrength??.25);
  o.waterReflectionStrength=Number(o.waterReflectionStrength??.35);
  o.waterHighlightStrength=Number(o.waterHighlightStrength??.55);
  o.waterWaveNoise=Number(o.waterWaveNoise??.55);
  o.waterEdgeFade=Number(o.waterEdgeFade??(isFlow?.35:.08));
  o.waterColorTint=o.waterColorTint||'#2fd6ff';
  o.waterAudioReaction=Number(o.waterAudioReaction??.25);
  o.waterSparklesEnabled=o.waterSparklesEnabled!==false;
  o.waterSparkleDensity=Number(o.waterSparkleDensity??.55);
  o.waterSparkleSize=Number(o.waterSparkleSize??1);
  o.waterSparkleBrightness=Number(o.waterSparkleBrightness??.8);
  o.waterSparkleSpeed=Number(o.waterSparkleSpeed??.75);
  o.waterSparkleColor=o.waterSparkleColor||'#ffffff';
  o.waterFoamEnabled=!!(o.waterFoamEnabled??false);
  o.waterFoamAmount=Number(o.waterFoamAmount??.25);
  o.waterFoamSpeed=Number(o.waterFoamSpeed??.35);
  o.waterFoamScale=Number(o.waterFoamScale??1.5);
  o.waterFoamOpacity=Number(o.waterFoamOpacity??.35);
}
function supportsShadow(o){return !!(o&&['imageAsset','screen','greenscreen'].includes(o.type));}
function defaultShadowMode(o){return o&&o.type==='screen'?'rect':(o&&o.type==='imageAsset'?'shape':'oval');}
function ensureShadowDefaults(o){
  if(!o||!supportsShadow(o))return;
  o.shadowEnabled=!!(o.shadowEnabled??false);
  o.shadowMode=o.shadowMode||defaultShadowMode(o);
  o.shadowOpacity=Number(o.shadowOpacity??.35);
  o.shadowBlur=Number(o.shadowBlur??.55);
  o.shadowOffsetX=Number(o.shadowOffsetX??0);
  o.shadowOffsetY=Number(o.shadowOffsetY??80);
  o.shadowScaleX=Number(o.shadowScaleX??1);
  o.shadowScaleY=Number(o.shadowScaleY??.35);
  o.shadowRotation=Number(o.shadowRotation??0);
  o.shadowColor=o.shadowColor||'#000000';
}
function newObj(type,x,y){
  if(type==='laser')type='light';
  if(type==='pyro'||type==='explosion'||type==='confetti')type='particle';
  const particleDefaults=(type==='particle'||type==='imageParticle')?particlePresetDefaults(type==='imageParticle'?'imageParticles':'free'):{};
  return {id:'obj_'+id++,name:type+'_'+id,type,x,y,layer:1,size:type==='fog'?52:type==='screen'?70:type==='visualizer'?80:type==='imageAsset'?120:type==='imageParticle'?140:type==='particle'?72:type==='waterSurface'?100:type==='waterFlowOverlay'?100:type==='mandalaVisualizer'?110:type==='audioSource'?58:type==='movinghead'?64:type==='lightbar'?56:44,intensity:1,rotation:(type==='light'||type==='lightbar'||type==='movinghead')?90:(type==='particle'?-90:0),panSpeed:(type==='light'||type==='lightbar')?0:0,panAngle:(type==='light'||type==='lightbar')?0:0,laser:false,angle:(type==='light'||type==='lightbar'||type==='movinghead')?10:360,audioAngleMax:(type==='light'||type==='lightbar'||type==='movinghead')?360:360,range:300,softness:.72,glow:.25,opacity:.85,color:particleDefaults.color||((type==='light'||type==='lightbar'||type==='movinghead')?'#62d8ff':type==='fog'?'#cfe8ff':type==='screen'?'#2fd6ff':type==='audioSource'?'#8bd7ff':(type==='waterSurface'||type==='waterFlowOverlay')?'#2fd6ff':type==='mandalaVisualizer'?'#ffffff':'#66ccff'),altColor:(type==='light'||type==='lightbar'||type==='movinghead')?'#ff4fd8':'#66ccff',altSpeed:(type==='light'||type==='lightbar'||type==='movinghead')?.6:0,altAmount:(type==='light'||type==='lightbar'||type==='movinghead')?1:0,lightColorMusicEnabled:false,lightColorMusicFreq:1000,lightColorMusicThreshold:.35,lightColorMusicBelow:false,lightColorMusicAmount:1,movingMode:'static',movingPan:0,movingTilt:-55,movingPanRange:90,movingTiltRange:70,movingSpeed:.8,movingBeamAngle:14,movingBeamRange:480,movingBodyVisible:true,movingHeadGlow:.35,movingAudioMove:.7,lightbarCount:type==='lightbar'?8:8,lightbarLength:type==='lightbar'?320:320,lightbarSpread:type==='lightbar'?0:0,fogPanSpeed:type==='fog'?0:0,fogPanAngle:type==='fog'?0:0,fogAngle:type==='fog'?80:360,fogLife:type==='fog'?4.0:1.0,fogDynamics:type==='fog'?1.0:0,fogGravity:type==='fog'?0:0,fogSoftness:type==='fog'?.75:.5,fogGlow:type==='fog'?.15:0,fogEmitterOpacity:type==='fog'?.44:0,fogOpacity:type==='fog'?.35:0,fogAltColor:type==='fog'?'#b7f0ff':'#66ccff',fogAltSpeed:type==='fog'?.3:0,fogAltAmount:type==='fog'?.4:0,fogMotion:type==='fog'?.9:0,fogTurbulence:type==='fog'?.85:0,screenWidth:type==='screen'?260:180,screenHeight:type==='screen'?120:80,screenMode:type==='screen'?'audio':'solid',screenFrameMode:'visible',screenBrightness:type==='screen'?1:1,screenOpacity:type==='screen'?1:1,screenScanlines:type==='screen'?.3:0,screenAudio:type==='screen'?.5:0,screenAltColor:type==='screen'?'#ff4fd8':'#66ccff',screenAltSpeed:type==='screen'?.25:0,screenAltAmount:type==='screen'?.6:0,screenMediaType:'none',screenMediaName:'',screenMediaData:null,screenMediaEmbedded:false,screenMediaFit:'cover',screenFlipX:true,screenFlipY:false,screenVideoAudio:true,screenVideoVolume:1,screenMediaAspect:1,screenPlaylist:[],screenPlaylistIndex:-1,screenPlaylistHold:5,screenPlaylistAuto:true,screenPlaylistLastSwitch:0,screenTextSource:'custom',screenText:'VSE',screenTextMode:'static',screenTextFont:'Arial',screenTextSize:48,screenTextColor:'#ffffff',screenTextSpeed:80,screenTextBgMode:'transparent',screenTextBgColor:'#000000',screenTextBgOpacity:1,screenTextBgFit:'cover',screenTextBgImageName:'',screenTextBgImageData:null,screenTextBgImageElement:null,screenTextBgImageReady:false,screenTextTexture:null,screenTextCanvas:null,screenTextDirty:true,imageAssetWidth:type==='imageAsset'?240:240,imageAssetHeight:type==='imageAsset'?160:160,imageAssetKeepAspect:true,imageAssetOpacity:1,imageAssetIgnoreGlobalDimming:false,imageAssetPerspectiveEnabled:false,imageAssetPerspectiveStrength:.90,imageAssetPerspectiveMin:.30,imageAssetAudioEnabled:false,imageAssetAudioDirX:0,imageAssetAudioDirY:-1,imageAssetAudioStrength:30,imageAssetAudioPhysicsImpulse:true,imageAssetAudioImpulseCooldown:.12,imageAssetAudioLastImpulse:0,imageAssetAudioSmoothed:0,imageAssetImageType:'none',imageAssetName:'',imageAssetData:null,imageAssetEmbedded:false,imageAssetAspect:1,imageAssetTexture:null,imageAssetElement:null,imageAssetPhysicsEnabled:false,imageAssetMass:1,imageAssetGravity:.6,imageAssetFriction:.6,imageAssetBounce:.2,imageAssetAngularDamping:.9,imageAssetLinearDamping:.9,imageAssetCollisionEnabled:true,imageAssetReverseXOnSideCollision:false,imageAssetColliderType:'box',imageAssetImpulseX:1,imageAssetImpulseY:-.25,imageAssetImpulseStrength:6,imageAssetImpulseRotation:0,imageAssetVx:0,imageAssetVy:0,imageAssetAngularVelocity:0,screenAmbilight:false,screenAmbilightStrength:1,screenEngineX:0,screenEngineY:0,screenEngineW:640,screenEngineH:360,_ambilightColor:null,_ambilightLastSample:0,visualizerMode:type==='visualizer'?'freqBars':'freqBars',visualizerWidth:type==='visualizer'?520:520,visualizerHeight:type==='visualizer'?180:180,visualizerBars:type==='visualizer'?32:32,visualizerSensitivity:type==='visualizer'?1:1,visualizerDecay:0,visualizerGap:type==='visualizer'?.25:.25,visualizerOpacity:type==='visualizer'?.95:.95,visualizerPeakHold:type==='visualizer'?30:30,greenscreenWidth:type==='greenscreen'?480:480,greenscreenHeight:type==='greenscreen'?270:270,greenscreenKeepAspect:true,greenscreenSwapAspect:false,greenscreenKeyColor:'#00ff00',greenscreenTolerance:type==='greenscreen'?.32:.32,greenscreenSoftness:type==='greenscreen'?.12:.12,greenscreenEdgeTrim:0,greenscreenSpillReduction:0,greenscreenEdgeDarken:0,greenscreenOpacity:type==='greenscreen'?1:1,greenscreenAudioEnabled:false,greenscreenAudioVolume:1,greenscreenAudioNode:null,greenscreenAudioGain:null,greenscreenShadowEnabled:false,greenscreenShadowWidth:280,greenscreenShadowHeight:80,greenscreenShadowOffsetX:0,greenscreenShadowOffsetY:130,greenscreenShadowSoftness:.65,greenscreenShadowOpacity:.45,greenscreenMediaType:'none',greenscreenMediaName:'',greenscreenMediaAspect:16/9,greenscreenTexture:null,greenscreenMediaElement:null,greenscreenMediaUrl:'',greenscreenStream:null,...particleDefaults,particleImageType:'none',particleImageName:'',particleImageData:null,particleImageEmbedded:false,particleImageAspect:1,particleEmitterShape:(type==='particle'||type==='imageParticle')?'point':'point',particleEmitterLength:(type==='particle'||type==='imageParticle')?120:120,particleEmitterTransparency:0,ipmDensity:(type==='imageParticle')?3:.78,ipmParticleSize:(type==='imageParticle')?2.4:2.4,ipmScale:(type==='imageParticle')?2:1,ipmOpacity:(type==='imageParticle')?.9:.9,ipmThreshold:145,ipmWave:12,ipmJitter:4,ipmPixelMode:'dark',ipmMode:'none',ipmReaction:.4,ipmReturn:.45,ipmEffectStrength:60,ipmEffectSpeed:80,ipmAudioEffectSpeed:120,ipmAudioEffectStrength:100,ipmAudioEffectPulse:80,ipmAudioMovement:40,ipmAudioSize:14,ipmAudioAlpha:20,ipmUseImageColors:false,ipmMono:false,ipmInvert:false,ipmFlipX:false,ipmFlipY:false,ipmDestructionEnabled:false,ipmDestructionMode:'crumble',ipmDestructionReverse:false,ipmDestructionAudioEnabled:false,ipmDestructionStrength:90,ipmDestructionDirX:0,ipmDestructionDirY:-1,ipmDestructionSpread:.8,ipmDestructionGravity:.75,ipmDestructionDuration:3,ipmDestructionReturnEnabled:true,ipmDestructionReturnSpeed:1.2,ipmDestructionRandomness:.7,ipmDestructionClusterSize:12,ipmDestructionParticleFade:.35,ipmDestructionFadeTime:1.2,ipmDestructionAudioThreshold:.65,ipmDestructionRetrigger:1.5,audioSourceVolume:1,audioSourceRange:35,audioSourceFalloff:1,audioSourceIconOpacity:.65,audioSourceLoop:false,audioSourceAnalyze:false,audioSourceDirectional:false,audioSourceDirection:0,audioSourceZ:0,audioSourceType:'none',audioSourceName:'',audioSourceUrl:'',audioSourceElement:null,audioSourceNode:null,audioSourceGain:null,audioSourceAnalyserTap:null,audioSourcePan:null,audioSourceMediaUrl:'',audioSourcePlaying:false,audioFreq:(type==='light'||type==='lightbar'||type==='movinghead')?120:type==='fog'?250:type==='screen'?1000:type==='visualizer'?1000:type==='greenscreen'?1000:(type==='particle'||type==='imageParticle')?90:(type==='waterSurface'||type==='waterFlowOverlay')?800:type==='mandalaVisualizer'?800:120,music:(type==='particle'||type==='imageParticle')?.25:.3,shadowEnabled:false,shadowMode:(type==='screen'?'rect':'oval'),shadowOpacity:.35,shadowBlur:.55,shadowOffsetX:0,shadowOffsetY:80,shadowScaleX:1,shadowScaleY:.35,shadowRotation:0,shadowColor:'#000000',waterMode:'fake',waterWidth:type==='waterFlowOverlay'?360:420,waterHeight:type==='waterFlowOverlay'?160:180,waterOpacity:type==='waterFlowOverlay'?.55:.65,waterWaveHeight:.35,waterWaveScale:1.2,waterWaveSpeed:.35,waterFlowDirection:0,waterFlowSpeed:type==='waterFlowOverlay'?.55:.35,waterFlowScale:type==='waterFlowOverlay'?1.5:1.2,waterDistortionStrength:.25,waterReflectionStrength:.35,waterHighlightStrength:.55,waterWaveNoise:.55,waterEdgeFade:type==='waterFlowOverlay'?.35:.08,waterColorTint:'#2fd6ff',waterAudioReaction:.25,waterSparklesEnabled:true,waterSparkleDensity:.55,waterSparkleSize:1,waterSparkleBrightness:.8,waterSparkleSpeed:.75,waterSparkleColor:'#ffffff',waterFoamEnabled:false,waterFoamAmount:.25,waterFoamSpeed:.35,waterFoamScale:1.5,waterFoamOpacity:.35,mandalaObjWidth:type==='mandalaVisualizer'?420:420,mandalaObjHeight:type==='mandalaVisualizer'?420:420,mandalaObjKeepAspect:true,mandalaObjVisible:true,mandalaObjLocked:false,mandalaObjOpacity:1,mandalaObjSegments:Number(scene.mandalaSegments||6),mandalaObjRotation:Number(scene.mandalaRotation||0),mandalaObjCenterX:Number(scene.mandalaCenterX??.5),mandalaObjCenterY:Number(scene.mandalaCenterY??.5),mandalaObjZoom:Number(scene.mandalaZoom??1),mandalaObjMix:Number(scene.mandalaMix??1),mandalaObjAutoRotate:!!scene.mandalaAutoRotate,mandalaObjMusicRotation:!!scene.mandalaMusicRotation,mandalaObjMusicZoom:!!scene.mandalaMusicZoom,mandalaObjMusicMix:!!scene.mandalaMusicMix,thresholdBelow:false,windAffected:true,windInfluence:1,life:1};
}
function selectSingleCore(o){
  window.vseActiveClipboardScope='objects';
  selected=o;
  empty.style.display=o?'none':'block';
  params.style.display=o?'block':'none';
  if(!o){updateParticleTriggerButton();return;}
  ensureObjectAspect(o);
  if(objectKeepAspectInput)objectKeepAspectInput.checked=o.objectKeepAspect!==false;
  if(screenKeepAspectInput)screenKeepAspectInput.checked=o.objectKeepAspect!==false;
  if(lightEmitterKeepAspectInput)lightEmitterKeepAspectInput.checked=o.objectKeepAspect!==false;
  ensureShadowDefaults(o);
  ensureWaterDefaults(o);
  ensureMandalaDefaults(o);
  fields.Name.value=o.name;
  fields.Type.value=o.type;
  fields.X.value=o.x.toFixed(1);
  fields.Y.value=o.y.toFixed(1);
  fields.Layer.value=o.layer??1;
  fields.Size.value=o.size;
  fields.Intensity.value=o.intensity;
  fields.Rotation.value=o.rotation;
  if(fields.WindAffected)fields.WindAffected.checked=o.windAffected!==false;
  if(fields.WindInfluence)fields.WindInfluence.value=o.windInfluence??1;
  fields.PanSpeed.value=o.panSpeed??0;
  fields.PanAngle.value=o.panAngle??0;
  if(fields.Laser)fields.Laser.checked=!!o.laser;
  fields.Angle.value=o.angle??360;
  if(fields.AudioAngleMax)fields.AudioAngleMax.value=o.audioAngleMax??360;
  fields.Range.value=o.range??260;
  fields.Softness.value=o.softness??.55;
  fields.Glow.value=o.glow??.25;
  fields.Opacity.value=o.opacity??.85;
  if(fields.ShadowEnabled)fields.ShadowEnabled.checked=!!o.shadowEnabled;
  if(fields.ShadowMode)fields.ShadowMode.value=o.shadowMode||defaultShadowMode(o);
  if(fields.ShadowOpacity)fields.ShadowOpacity.value=o.shadowOpacity??.35;
  if(fields.ShadowBlur)fields.ShadowBlur.value=o.shadowBlur??.55;
  if(fields.ShadowOffsetX)fields.ShadowOffsetX.value=o.shadowOffsetX??0;
  if(fields.ShadowOffsetY)fields.ShadowOffsetY.value=o.shadowOffsetY??80;
  if(fields.ShadowScaleX)fields.ShadowScaleX.value=o.shadowScaleX??1;
  if(fields.ShadowScaleY)fields.ShadowScaleY.value=o.shadowScaleY??.35;
  if(fields.ShadowRotation)fields.ShadowRotation.value=o.shadowRotation??0;
  if(fields.ShadowColor)fields.ShadowColor.value=o.shadowColor||'#000000';
  if(waterShapeInput)waterShapeInput.value=o.waterShape||'rect';
  if(fields.WaterMode)fields.WaterMode.value=o.waterMode||'fake';
  if(fields.WaterWidth)fields.WaterWidth.value=o.waterWidth??420;
  if(fields.WaterHeight)fields.WaterHeight.value=o.waterHeight??180;
  if(fields.WaterOpacity)fields.WaterOpacity.value=o.waterOpacity??.65;
  if(fields.WaterWaveHeight)fields.WaterWaveHeight.value=o.waterWaveHeight??.35;
  if(fields.WaterWaveScale)fields.WaterWaveScale.value=o.waterWaveScale??1.2;
  if(fields.WaterWaveSpeed)fields.WaterWaveSpeed.value=o.waterWaveSpeed??.35;
  if(fields.WaterFlowDirection)fields.WaterFlowDirection.value=o.waterFlowDirection??0;
  if(fields.WaterFlowSpeed)fields.WaterFlowSpeed.value=o.waterFlowSpeed??.55;
  if(fields.WaterFlowScale)fields.WaterFlowScale.value=o.waterFlowScale??1.5;
  if(fields.WaterDistortionStrength)fields.WaterDistortionStrength.value=o.waterDistortionStrength??.25;
  if(fields.WaterReflectionStrength)fields.WaterReflectionStrength.value=o.waterReflectionStrength??.35;
  if(fields.WaterHighlightStrength)fields.WaterHighlightStrength.value=o.waterHighlightStrength??.55;
  if(fields.WaterWaveNoise)fields.WaterWaveNoise.value=o.waterWaveNoise??.55;
  if(fields.WaterEdgeFade)fields.WaterEdgeFade.value=o.waterEdgeFade??.35;
  if(fields.WaterColorTint)fields.WaterColorTint.value=o.waterColorTint||'#2fd6ff';
  if(fields.WaterAudioReaction)fields.WaterAudioReaction.value=o.waterAudioReaction??.25;
  if(fields.WaterSparklesEnabled)fields.WaterSparklesEnabled.checked=o.waterSparklesEnabled!==false;
  if(fields.WaterSparkleDensity)fields.WaterSparkleDensity.value=o.waterSparkleDensity??.55;
  if(fields.WaterSparkleSize)fields.WaterSparkleSize.value=o.waterSparkleSize??1;
  if(fields.WaterSparkleBrightness)fields.WaterSparkleBrightness.value=o.waterSparkleBrightness??.8;
  if(fields.WaterSparkleSpeed)fields.WaterSparkleSpeed.value=o.waterSparkleSpeed??.75;
  if(fields.WaterSparkleColor)fields.WaterSparkleColor.value=o.waterSparkleColor||'#ffffff';
  if(fields.WaterFoamEnabled)fields.WaterFoamEnabled.checked=!!o.waterFoamEnabled;
  if(fields.WaterFoamAmount)fields.WaterFoamAmount.value=o.waterFoamAmount??.25;
  if(fields.WaterFoamSpeed)fields.WaterFoamSpeed.value=o.waterFoamSpeed??.35;
  if(fields.WaterFoamScale)fields.WaterFoamScale.value=o.waterFoamScale??1.5;
  if(fields.WaterFoamOpacity)fields.WaterFoamOpacity.value=o.waterFoamOpacity??.35;
  fields.Color.value=o.color;
  fields.AltColor.value=o.altColor||'#ff4fd8';
  fields.AltSpeed.value=o.altSpeed??0.6;
  fields.AltAmount.value=o.altAmount??1;
  if(fields.LightColorMusicEnabled)fields.LightColorMusicEnabled.checked=!!o.lightColorMusicEnabled;
  if(fields.LightColorMusicThreshold)fields.LightColorMusicThreshold.value=o.lightColorMusicThreshold??.35;
  if(fields.LightColorMusicBelow)fields.LightColorMusicBelow.checked=!!o.lightColorMusicBelow;
  if(fields.LightColorMusicAmount)fields.LightColorMusicAmount.value=o.lightColorMusicAmount??1;
  updateLightColorMusicFreqUI(o);
  if(lightEmitterShapeInput)lightEmitterShapeInput.value=o.lightEmitterShape||'point';
  if(lightRectangleEmissionInput)lightRectangleEmissionInput.value=o.lightRectangleEmission||'outward';
  if(lightEmitterLengthInput)lightEmitterLengthInput.value=o.lightEmitterLength??240;
  if(lightEmitterWidthInput)lightEmitterWidthInput.value=o.lightEmitterWidth??480;
  if(lightEmitterHeightInput)lightEmitterHeightInput.value=o.lightEmitterHeight??270;
  if(fields.LightbarCount)fields.LightbarCount.value=o.lightbarCount??8;
  if(fields.LightbarLength)fields.LightbarLength.value=o.lightbarLength??320;
  if(fields.LightbarSpread)fields.LightbarSpread.value=o.lightbarSpread??0;
  if(fields.MovingMode)fields.MovingMode.value=o.movingMode||'static';
  if(fields.MovingPan)fields.MovingPan.value=o.movingPan??0;
  if(fields.MovingTilt)fields.MovingTilt.value=o.movingTilt??-55;
  if(fields.MovingPanRange)fields.MovingPanRange.value=o.movingPanRange??90;
  if(fields.MovingTiltRange)fields.MovingTiltRange.value=o.movingTiltRange??70;
  if(fields.MovingSpeed)fields.MovingSpeed.value=o.movingSpeed??.8;
  if(fields.MovingBeamAngle)fields.MovingBeamAngle.value=o.movingBeamAngle??14;
  if(fields.MovingBeamRange)fields.MovingBeamRange.value=o.movingBeamRange??480;
  if(fields.MovingBodyVisible)fields.MovingBodyVisible.checked=o.movingBodyVisible!==false;
  if(fields.MovingHeadGlow)fields.MovingHeadGlow.value=o.movingHeadGlow??.35;
  if(fields.MovingAudioMove)fields.MovingAudioMove.value=o.movingAudioMove??.7;
  fields.FogPanSpeed.value=o.fogPanSpeed??0;
  fields.FogPanAngle.value=o.fogPanAngle??0;
  fields.FogAngle.value=o.fogAngle??80;
  if(fogStartWidthInput)fogStartWidthInput.value=o.fogStartWidth??80;
  fields.FogLife.value=o.fogLife??4.0;
  fields.FogDynamics.value=o.fogDynamics??1.0;
  if(fields.FogGravity)fields.FogGravity.value=o.fogGravity??0;
  fields.FogSoftness.value=o.fogSoftness??.75;
  fields.FogGlow.value=o.fogGlow??.15;
  if(fields.FogEmitterOpacity)fields.FogEmitterOpacity.value=o.fogEmitterOpacity??.44;
  fields.FogOpacity.value=o.fogOpacity??.35;
  fields.FogAltColor.value=o.fogAltColor||'#b7f0ff';
  fields.FogAltSpeed.value=o.fogAltSpeed??.3;
  fields.FogAltAmount.value=o.fogAltAmount??.4;
  fields.FogMotion.value=o.fogMotion??.7;
  fields.FogTurbulence.value=o.fogTurbulence??.65;
  updateScreenSizeSliderLimits();
  fields.ScreenWidth.value=Math.min(Number(fields.ScreenWidth.max||scene.stageWidth||1920),o.screenWidth??260);
  fields.ScreenHeight.value=Math.min(Number(fields.ScreenHeight.max||scene.stageHeight||1080),o.screenHeight??120);
  if(screenDepthRotationInput)screenDepthRotationInput.value=String(Number(o.screenDepthRotation)||0);
  if(screenDepthRotationValue)screenDepthRotationValue.textContent=Math.round(Number(o.screenDepthRotation)||0)+'°';
  fields.ScreenMode.value=o.screenMode||'solid';
  if(fields.ScreenTextSource)fields.ScreenTextSource.value=o.screenTextSource||'custom';
  if(fields.ScreenText)fields.ScreenText.value=o.screenText??'VSE';
  if(fields.ScreenTextMode)fields.ScreenTextMode.value=o.screenTextMode||'static';
  if(fields.ScreenTextFont)fields.ScreenTextFont.value=o.screenTextFont||'Arial';
  if(fields.ScreenTextSize)fields.ScreenTextSize.value=o.screenTextSize??48;
  if(fields.ScreenTextColor)fields.ScreenTextColor.value=o.screenTextColor||'#ffffff';
  if(screenTextBoldInput)screenTextBoldInput.checked=o.screenTextBold!==false;
  if(screenTextItalicInput)screenTextItalicInput.checked=!!o.screenTextItalic;
  if(screenTextUnderlineInput)screenTextUnderlineInput.checked=!!o.screenTextUnderline;
  if(screenTextAlignInput)screenTextAlignInput.value=o.screenTextAlign||'center';
  if(screenTextLineHeightInput)screenTextLineHeightInput.value=o.screenTextLineHeight??1.2;
  if(fields.ScreenTextSpeed)fields.ScreenTextSpeed.value=o.screenTextSpeed??80;
  if(fields.ScreenTextBgMode)fields.ScreenTextBgMode.value=o.screenTextBgMode||'transparent';
  if(fields.ScreenTextBgColor)fields.ScreenTextBgColor.value=o.screenTextBgColor||'#000000';
  if(fields.ScreenTextBgOpacity)fields.ScreenTextBgOpacity.value=o.screenTextBgOpacity??1;
  if(fields.ScreenTextBgFit)fields.ScreenTextBgFit.value=o.screenTextBgFit||'cover';
  if(screenTextBgInfo)screenTextBgInfo.textContent=o.screenTextBgImageName?('Geladen: '+o.screenTextBgImageName):'Kein Texthintergrund-Bild geladen.';
  if(fields.ScreenFrameMode)fields.ScreenFrameMode.value=o.screenFrameMode||'visible';
  fields.ScreenBrightness.value=o.screenBrightness??1;
  fields.ScreenOpacity.value=o.screenOpacity??1;
  if(screenLedSimulationInput)screenLedSimulationInput.checked=!!o.screenLedSimulation;
  fields.ScreenScanlines.value=o.screenScanlines??.3;
  fields.ScreenScanlines.disabled=!o.screenLedSimulation;
  if(screenAudioEnabledInput)screenAudioEnabledInput.checked=o.screenAudioEnabled!==false;
  fields.ScreenAudio.value=o.screenAudio??.5;
  fields.ScreenAudio.disabled=o.screenAudioEnabled===false;
  fields.ScreenAltColor.value=o.screenAltColor||'#ff4fd8';
  fields.ScreenAltSpeed.value=o.screenAltSpeed??.25;
  fields.ScreenAltAmount.value=o.screenAltAmount??.6;
  if(fields.ScreenAmbilight)fields.ScreenAmbilight.checked=!!o.screenAmbilight;
  if(fields.ScreenAmbilightStrength)fields.ScreenAmbilightStrength.value=o.screenAmbilightStrength??1;
  if(fields.ScreenEngineX)fields.ScreenEngineX.value=o.screenEngineX??0;
  if(fields.ScreenEngineY)fields.ScreenEngineY.value=o.screenEngineY??0;
  if(fields.ScreenEngineW)fields.ScreenEngineW.value=o.screenEngineW??640;
  if(fields.ScreenEngineH)fields.ScreenEngineH.value=o.screenEngineH??360;
  if(fields.VisualizerMode)fields.VisualizerMode.value=o.visualizerMode||'freqBars';
  if(fields.VisualizerWidth)fields.VisualizerWidth.value=o.visualizerWidth??520;
  if(fields.VisualizerHeight)fields.VisualizerHeight.value=o.visualizerHeight??180;
  if(fields.VisualizerBars)fields.VisualizerBars.value=o.visualizerBars??32;
  if(fields.VisualizerSensitivity)fields.VisualizerSensitivity.value=o.visualizerSensitivity??1;
  if(fields.VisualizerDecay)
  if(fields.VisualizerGap)fields.VisualizerGap.value=o.visualizerGap??.25;
  if(fields.VisualizerOpacity)fields.VisualizerOpacity.value=o.visualizerOpacity??.95;
  if(fields.VisualizerPeakHold)fields.VisualizerPeakHold.value=o.visualizerPeakHold??30;
  if(visualizerSegmentFields.Enabled)visualizerSegmentFields.Enabled.checked=!!o.visualizerSegmentsEnabled;
  if(visualizerSegmentFields.Count)visualizerSegmentFields.Count.value=o.visualizerSegmentCount??16;
  if(visualizerSegmentFields.Gap)visualizerSegmentFields.Gap.value=o.visualizerSegmentGap??.18;
  if(visualizerColorFields.BackgroundColor)visualizerColorFields.BackgroundColor.value=o.visualizerBackgroundColor||'#030503';
  if(visualizerColorFields.LowColor)visualizerColorFields.LowColor.value=o.visualizerLowColor||'#1aff2e';
  if(visualizerColorFields.MidColor)visualizerColorFields.MidColor.value=o.visualizerMidColor||'#ffed29';
  if(visualizerColorFields.HighColor)visualizerColorFields.HighColor.value=o.visualizerHighColor||'#ff290f';
  if(visualizerColorFields.AverageColor)visualizerColorFields.AverageColor.value=o.visualizerAverageColor||'#ffffff';
  if(visualizerColorFields.PeakColor)visualizerColorFields.PeakColor.value=o.visualizerPeakColor||'#ff0a05';
  if(visualizerColorFields.FrameColor)visualizerColorFields.FrameColor.value=o.visualizerFrameColor||'#61ff6b';
  if(fields.MandalaObjWidth)fields.MandalaObjWidth.value=o.mandalaObjWidth??420;
  if(fields.MandalaObjHeight)fields.MandalaObjHeight.value=o.mandalaObjHeight??420;
  if(fields.MandalaObjKeepAspect)fields.MandalaObjKeepAspect.checked=o.mandalaObjKeepAspect!==false;
  if(fields.MandalaObjVisible)fields.MandalaObjVisible.checked=o.mandalaObjVisible!==false;
  if(fields.MandalaObjLocked)fields.MandalaObjLocked.checked=!!o.mandalaObjLocked;
  if(fields.MandalaObjOpacity)fields.MandalaObjOpacity.value=o.mandalaObjOpacity??1;
  if(fields.MandalaObjSegments)fields.MandalaObjSegments.value=o.mandalaObjSegments??6;
  if(fields.MandalaObjRotation)fields.MandalaObjRotation.value=o.mandalaObjRotation??0;
  if(fields.MandalaObjCenterX)fields.MandalaObjCenterX.value=o.mandalaObjCenterX??.5;
  if(fields.MandalaObjCenterY)fields.MandalaObjCenterY.value=o.mandalaObjCenterY??.5;
  if(fields.MandalaObjZoom)fields.MandalaObjZoom.value=o.mandalaObjZoom??1;
  if(fields.MandalaObjMix)fields.MandalaObjMix.value=o.mandalaObjMix??1;
  if(fields.MandalaObjAutoRotate)fields.MandalaObjAutoRotate.checked=!!o.mandalaObjAutoRotate;
  if(fields.MandalaObjMusicRotation)fields.MandalaObjMusicRotation.checked=!!o.mandalaObjMusicRotation;
  if(fields.MandalaObjMusicZoom)fields.MandalaObjMusicZoom.checked=!!o.mandalaObjMusicZoom;
  if(fields.MandalaObjMusicMix)fields.MandalaObjMusicMix.checked=!!o.mandalaObjMusicMix;
  if(fields.ImageAssetWidth)fields.ImageAssetWidth.value=o.imageAssetWidth??240;
  if(fields.ImageAssetHeight)fields.ImageAssetHeight.value=o.imageAssetHeight??160;
  if(fields.ImageAssetKeepAspect)fields.ImageAssetKeepAspect.checked=o.imageAssetKeepAspect!==false;
  if(fields.ImageAssetOpacity)fields.ImageAssetOpacity.value=o.imageAssetOpacity??1;
  if(fields.ImageAssetIgnoreGlobalDimming)fields.ImageAssetIgnoreGlobalDimming.checked=!!o.imageAssetIgnoreGlobalDimming;
  if(fields.ImageAssetPerspectiveEnabled)fields.ImageAssetPerspectiveEnabled.checked=!!o.imageAssetPerspectiveEnabled;
  if(fields.ImageAssetPerspectiveStrength)fields.ImageAssetPerspectiveStrength.value=o.imageAssetPerspectiveStrength??.45;
  if(fields.ImageAssetPerspectiveMin)fields.ImageAssetPerspectiveMin.value=o.imageAssetPerspectiveMin??.35;
  if(fields.ImageAssetAudioEnabled)fields.ImageAssetAudioEnabled.checked=!!o.imageAssetAudioEnabled;
  if(fields.ImageAssetAudioDirX)fields.ImageAssetAudioDirX.value=o.imageAssetAudioDirX??0;
  if(fields.ImageAssetAudioDirY)fields.ImageAssetAudioDirY.value=o.imageAssetAudioDirY??-1;
  if(fields.ImageAssetAudioStrength)fields.ImageAssetAudioStrength.value=o.imageAssetAudioStrength??30;
  if(fields.ImageAssetAudioPhysicsImpulse)fields.ImageAssetAudioPhysicsImpulse.checked=o.imageAssetAudioPhysicsImpulse!==false;
  if(fields.ImageAssetAudioImpulseCooldown)fields.ImageAssetAudioImpulseCooldown.value=o.imageAssetAudioImpulseCooldown??.12;
  if(fields.ImageAssetPhysicsEnabled)fields.ImageAssetPhysicsEnabled.checked=!!o.imageAssetPhysicsEnabled;
  if(fields.ImageAssetMass)fields.ImageAssetMass.value=o.imageAssetMass??1;
  if(fields.ImageAssetGravity)fields.ImageAssetGravity.value=o.imageAssetGravity??.6;
  if(fields.ImageAssetFriction)fields.ImageAssetFriction.value=o.imageAssetFriction??.6;
  if(fields.ImageAssetBounce)fields.ImageAssetBounce.value=o.imageAssetBounce??.2;
  if(fields.ImageAssetAngularDamping)fields.ImageAssetAngularDamping.value=o.imageAssetAngularDamping??.9;
  if(fields.ImageAssetLinearDamping)fields.ImageAssetLinearDamping.value=o.imageAssetLinearDamping??.9;
  if(fields.ImageAssetCollisionEnabled)fields.ImageAssetCollisionEnabled.checked=o.imageAssetCollisionEnabled!==false;
  if(fields.ImageAssetReverseXOnSideCollision)fields.ImageAssetReverseXOnSideCollision.checked=!!o.imageAssetReverseXOnSideCollision;
  if(fields.ImageAssetColliderType)fields.ImageAssetColliderType.value=o.imageAssetColliderType||'box';
  if(fields.ImageAssetImpulseX)fields.ImageAssetImpulseX.value=o.imageAssetImpulseX??1;
  if(fields.ImageAssetImpulseY)fields.ImageAssetImpulseY.value=o.imageAssetImpulseY??-.25;
  if(fields.ImageAssetImpulseStrength)fields.ImageAssetImpulseStrength.value=o.imageAssetImpulseStrength??6;
  if(fields.ImageAssetImpulseRotation)fields.ImageAssetImpulseRotation.value=o.imageAssetImpulseRotation??0;
  if(fields.AudioSourceVolume)fields.AudioSourceVolume.value=o.audioSourceVolume??1;
  if(fields.AudioSourceRange)fields.AudioSourceRange.value=o.audioSourceRange??35;
  if(fields.AudioSourceFalloff)fields.AudioSourceFalloff.value=o.audioSourceFalloff??1;
  if(fields.AudioSourceIconOpacity)fields.AudioSourceIconOpacity.value=o.audioSourceIconOpacity??.65;
  if(fields.AudioSourceLoop)fields.AudioSourceLoop.checked=!!o.audioSourceLoop;
  if(fields.AudioSourceAnalyze)fields.AudioSourceAnalyze.checked=!!o.audioSourceAnalyze;
  if(fields.AudioSourceDirectional)fields.AudioSourceDirectional.checked=!!o.audioSourceDirectional;
  if(fields.AudioSourceDirection)fields.AudioSourceDirection.value=o.audioSourceDirection??0;
  if(audioSourceUrl)audioSourceUrl.value=o.audioSourceUrl||'';
  if(audioSourceInfo)audioSourceInfo.textContent=o.audioSourceName?('Quelle: '+o.audioSourceName+(o.audioSourceUrl?' · Stream/URL':' · lokale Datei')):'Keine Audioquelle geladen.';
  if(imageAssetInfo)imageAssetInfo.textContent=o.imageAssetName?('Geladen: '+o.imageAssetName+' · eingebettet'):'Kein Bild geladen.';

  if(fields.GreenscreenWidth)fields.GreenscreenWidth.value=o.greenscreenWidth??480;
  if(fields.GreenscreenHeight)fields.GreenscreenHeight.value=o.greenscreenHeight??270;
  if(fields.GreenscreenKeepAspect)fields.GreenscreenKeepAspect.checked=o.greenscreenKeepAspect!==false;
  if(fields.GreenscreenSwapAspect)fields.GreenscreenSwapAspect.checked=!!o.greenscreenSwapAspect;
  if(greenscreenWebcamDevice&&o.greenscreenDeviceId&&[...greenscreenWebcamDevice.options].some(option=>option.value===o.greenscreenDeviceId))greenscreenWebcamDevice.value=o.greenscreenDeviceId;
  if(fields.GreenscreenChromaKeyEnabled)fields.GreenscreenChromaKeyEnabled.checked=o.greenscreenChromaKeyEnabled!==false;
  if(fields.GreenscreenKeyColor)fields.GreenscreenKeyColor.value=o.greenscreenKeyColor||'#00ff00';
  if(fields.GreenscreenTolerance)fields.GreenscreenTolerance.value=o.greenscreenTolerance??.32;
  if(fields.GreenscreenSoftness)fields.GreenscreenSoftness.value=o.greenscreenSoftness??.12;
  if(fields.GreenscreenEdgeTrim)fields.GreenscreenEdgeTrim.value=o.greenscreenEdgeTrim??0;
  if(fields.GreenscreenSpillReduction)fields.GreenscreenSpillReduction.value=o.greenscreenSpillReduction??0;
  if(fields.GreenscreenEdgeDarken)fields.GreenscreenEdgeDarken.value=o.greenscreenEdgeDarken??0;
  if(fields.GreenscreenOpacity)fields.GreenscreenOpacity.value=o.greenscreenOpacity??1;
  if(fields.GreenscreenAudioEnabled)fields.GreenscreenAudioEnabled.checked=!!o.greenscreenAudioEnabled;
  if(fields.GreenscreenAudioVolume)fields.GreenscreenAudioVolume.value=o.greenscreenAudioVolume??1;
  if(fields.GreenscreenShadowEnabled)fields.GreenscreenShadowEnabled.checked=!!o.greenscreenShadowEnabled;
  if(fields.GreenscreenShadowWidth)fields.GreenscreenShadowWidth.value=o.greenscreenShadowWidth??280;
  if(fields.GreenscreenShadowHeight)fields.GreenscreenShadowHeight.value=o.greenscreenShadowHeight??80;
  if(fields.GreenscreenShadowOffsetX)fields.GreenscreenShadowOffsetX.value=o.greenscreenShadowOffsetX??0;
  if(fields.GreenscreenShadowOffsetY)fields.GreenscreenShadowOffsetY.value=o.greenscreenShadowOffsetY??130;
  if(fields.GreenscreenShadowSoftness)fields.GreenscreenShadowSoftness.value=o.greenscreenShadowSoftness??.65;
  if(fields.GreenscreenShadowOpacity)fields.GreenscreenShadowOpacity.value=o.greenscreenShadowOpacity??.45;
  if(greenscreenInfo)greenscreenInfo.textContent=o.greenscreenMediaName?('Quelle: '+o.greenscreenMediaName+' · '+(o.greenscreenMediaType||'Video')):'Keine Greenscreen-Quelle geladen.';
  if(fields.ParticleMode)fields.ParticleMode.value=o.particleMode||'free';
  if(fields.ParticleEmitterShape)fields.ParticleEmitterShape.value=o.particleEmitterShape||'point';
  if(fields.ParticleEmitterLength)fields.ParticleEmitterLength.value=o.particleEmitterLength??120;
  if(fields.ParticleEmitterTransparency)fields.ParticleEmitterTransparency.value=o.particleEmitterTransparency??0;
  if(fields.ParticleAmount)fields.ParticleAmount.value=o.particleAmount??.7;
  if(fields.ParticleSpeed)fields.ParticleSpeed.value=o.particleSpeed??1;
  if(fields.ParticleSpread)fields.ParticleSpread.value=o.particleSpread??70;
  if(fields.ParticleLife)fields.ParticleLife.value=o.particleLife??2.5;
  if(fields.ParticleEmissionDuration)fields.ParticleEmissionDuration.value=o.particleEmissionDuration??1.0;
  if(fields.ParticleUnlimited)fields.ParticleUnlimited.checked=!!o.particleUnlimited;
  if(fields.ParticleEmissionMode)fields.ParticleEmissionMode.value=o.particleEmissionMode||'trigger';
  if(fields.ParticleGravity)fields.ParticleGravity.value=o.particleGravity??.4;
  if(fields.ParticleTurbulence)fields.ParticleTurbulence.value=o.particleTurbulence??.4;
  if(fields.ParticleSize)fields.ParticleSize.value=o.particleSize??3;
  if(fields.ParticleGlow)fields.ParticleGlow.value=o.particleGlow??.7;
  if(fields.ParticleOpacity)fields.ParticleOpacity.value=o.particleOpacity??.8;
  if(fields.ParticleAltColor)fields.ParticleAltColor.value=o.particleAltColor||'#ffd166';
  if(fields.ParticleAudio)fields.ParticleAudio.value=o.particleAudio??.25;
  if(fields.ParticleBlastEnergy)fields.ParticleBlastEnergy.value=o.particleBlastEnergy??1;
  if(fields.ParticleShockwaveRadius)fields.ParticleShockwaveRadius.value=o.particleShockwaveRadius??1;
  if(fields.ParticleInitialVelocity)fields.ParticleInitialVelocity.value=o.particleInitialVelocity??1;
  if(fields.ParticleVelocitySpread)fields.ParticleVelocitySpread.value=o.particleVelocitySpread??1;
  if(fields.ParticleExplosionTurbulence)fields.ParticleExplosionTurbulence.value=o.particleExplosionTurbulence??1;
  if(fields.ParticleUpdraft)fields.ParticleUpdraft.value=o.particleUpdraft??1;
  if(fields.ParticleFireballDuration)fields.ParticleFireballDuration.value=o.particleFireballDuration??.42;
  if(fields.ParticleSmokeAmount)fields.ParticleSmokeAmount.value=o.particleSmokeAmount??.75;
  if(fields.ParticleSmokeLifetime)fields.ParticleSmokeLifetime.value=o.particleSmokeLifetime??1;
  if(fields.ParticleDebrisAmount)fields.ParticleDebrisAmount.value=o.particleDebrisAmount??.35;
  if(fields.ParticleDebrisGravity)fields.ParticleDebrisGravity.value=o.particleDebrisGravity??1;
  if(fields.ParticleShockwaveVisible)fields.ParticleShockwaveVisible.checked=o.particleShockwaveVisible!==false;
  if(fields.ParticleJetPressure)fields.ParticleJetPressure.value=o.particleJetPressure??1;
  if(fields.ParticleJetVelocity)fields.ParticleJetVelocity.value=o.particleJetVelocity??1;
  if(fields.ParticleJetWidth)fields.ParticleJetWidth.value=o.particleJetWidth??1;
  if(fields.ParticleJetLength)fields.ParticleJetLength.value=o.particleJetLength??1;
  if(fields.ParticleCoreStability)fields.ParticleCoreStability.value=o.particleCoreStability??.85;
  if(fields.ParticleEdgeTurbulence)fields.ParticleEdgeTurbulence.value=o.particleEdgeTurbulence??1;
  if(fields.ParticleUpdraftStrength)fields.ParticleUpdraftStrength.value=o.particleUpdraftStrength??1;
  if(fields.ParticleTipTurbulence)fields.ParticleTipTurbulence.value=o.particleTipTurbulence??1;
  if(fields.ParticleBrightness)fields.ParticleBrightness.value=o.particleBrightness??1;
  if(fields.ParticleGlowStrength)fields.ParticleGlowStrength.value=o.particleGlowStrength??1;
  if(fields.ParticleJetSmokeAmount)fields.ParticleJetSmokeAmount.value=o.particleJetSmokeAmount??.25;
  if(screenMediaFit)screenMediaFit.value=o.screenMediaFit||'cover';
  if(screenFlipX)screenFlipX.checked=!!o.screenFlipX;
  if(screenFlipY)screenFlipY.checked=!!o.screenFlipY;
  if(screenVideoAudio)screenVideoAudio.checked=o.screenVideoAudio!==false;
  if(screenVideoVolume)screenVideoVolume.value=o.screenVideoVolume??1;
  if(screenMediaInfo)screenMediaInfo.textContent=o.screenPlaylist&&o.screenPlaylist.length?('Medienordner: '+o.screenPlaylist.length+' Dateien · aktuell: '+(o.screenMediaName||'—')):(o.screenMediaName?('Geladen: '+o.screenMediaName+' · '+(o.screenCaptureStream?'Live-Aufnahme':(o.screenMediaType||'Medium'))+(o.screenMediaType==='video'&&!o.screenMediaElement&&!o.screenCaptureStream?' · Video nicht eingebettet':'')):'Kein Medium geladen.');
  if(screenPlaylistHold)screenPlaylistHold.value=o.screenPlaylistHold??5;
  if(screenPlaylistAuto)screenPlaylistAuto.checked=o.screenPlaylistAuto!==false;
  if(screenPlaylistHoldValue)screenPlaylistHoldValue.textContent=Number(o.screenPlaylistHold??5).toFixed(1)+' s';
  if(particleImageInfo)particleImageInfo.textContent=o.particleImageName?('Geladen: '+o.particleImageName+(o.particleImageData?' · eingebettet':'')):'Kein IPM-Bild geladen.';
  if(fields.IpmDensity)fields.IpmDensity.value=o.ipmDensity??3;
  if(fields.IpmParticleSize)fields.IpmParticleSize.value=o.ipmParticleSize??2.4;
  if(fields.IpmScale)fields.IpmScale.value=o.ipmScale??1;
  if(fields.IpmOpacity)fields.IpmOpacity.value=o.ipmOpacity??.9;
  if(fields.IpmMode)fields.IpmMode.value=o.ipmMode||'static';
  if(fields.IpmReaction)fields.IpmReaction.value=o.ipmReaction??.4;
  if(fields.IpmReturn)fields.IpmReturn.value=o.ipmReturn??.45;
  if(fields.IpmThreshold)fields.IpmThreshold.value=o.ipmThreshold??145;
  if(fields.IpmWave)fields.IpmWave.value=o.ipmWave??12;
  if(fields.IpmJitter)fields.IpmJitter.value=o.ipmJitter??4;
  if(fields.IpmPixelMode)fields.IpmPixelMode.value=o.ipmPixelMode||'dark';
  if(fields.IpmEffectStrength)fields.IpmEffectStrength.value=o.ipmEffectStrength??60;
  if(fields.IpmEffectSpeed)fields.IpmEffectSpeed.value=o.ipmEffectSpeed??80;
  if(fields.IpmAudioEffectSpeed)fields.IpmAudioEffectSpeed.value=o.ipmAudioEffectSpeed??120;
  if(fields.IpmAudioEffectStrength)fields.IpmAudioEffectStrength.value=o.ipmAudioEffectStrength??100;
  if(fields.IpmAudioEffectPulse)fields.IpmAudioEffectPulse.value=o.ipmAudioEffectPulse??80;
  if(fields.IpmAudioMovement)fields.IpmAudioMovement.value=o.ipmAudioMovement??40;
  if(fields.IpmAudioSize)fields.IpmAudioSize.value=o.ipmAudioSize??14;
  if(fields.IpmAudioAlpha)fields.IpmAudioAlpha.value=o.ipmAudioAlpha??20;
  if(fields.IpmUseImageColors)fields.IpmUseImageColors.checked=!!(o.ipmUseImageColors??true);
  if(fields.IpmMono)fields.IpmMono.checked=!!o.ipmMono;
  if(fields.IpmInvert)fields.IpmInvert.checked=!!o.ipmInvert;
  if(fields.IpmFlipX)fields.IpmFlipX.checked=!!o.ipmFlipX;
  if(fields.IpmFlipY)fields.IpmFlipY.checked=!!o.ipmFlipY;
  if(fields.IpmDestructionEnabled)fields.IpmDestructionEnabled.checked=!!o.ipmDestructionEnabled;
  if(fields.IpmDestructionMode)fields.IpmDestructionMode.value=o.ipmDestructionMode||'crumble';
  if(fields.IpmDestructionReverse)fields.IpmDestructionReverse.checked=!!o.ipmDestructionReverse;
  if(fields.IpmDestructionAudioEnabled)fields.IpmDestructionAudioEnabled.checked=!!o.ipmDestructionAudioEnabled;
  if(fields.IpmDestructionStrength)fields.IpmDestructionStrength.value=o.ipmDestructionStrength??90;
  if(fields.IpmDestructionDirX)fields.IpmDestructionDirX.value=o.ipmDestructionDirX??0;
  if(fields.IpmDestructionDirY)fields.IpmDestructionDirY.value=o.ipmDestructionDirY??-1;
  if(fields.IpmDestructionSpread)fields.IpmDestructionSpread.value=o.ipmDestructionSpread??.8;
  if(fields.IpmDestructionGravity)fields.IpmDestructionGravity.value=o.ipmDestructionGravity??.75;
  if(fields.IpmDestructionDuration)fields.IpmDestructionDuration.value=o.ipmDestructionDuration??3;
  if(fields.IpmDestructionReturnEnabled)fields.IpmDestructionReturnEnabled.checked=o.ipmDestructionReturnEnabled!==false;
  if(fields.IpmDestructionReturnSpeed)fields.IpmDestructionReturnSpeed.value=o.ipmDestructionReturnSpeed??1.2;
  if(fields.IpmDestructionRandomness)fields.IpmDestructionRandomness.value=o.ipmDestructionRandomness??.7;
  if(fields.IpmDestructionClusterSize)fields.IpmDestructionClusterSize.value=o.ipmDestructionClusterSize??12;
  if(fields.IpmDestructionParticleFade)fields.IpmDestructionParticleFade.value=o.ipmDestructionParticleFade??.35;
  if(fields.IpmDestructionFadeTime)fields.IpmDestructionFadeTime.value=o.ipmDestructionFadeTime??1.2;
  if(fields.IpmDestructionAudioThreshold)fields.IpmDestructionAudioThreshold.value=o.ipmDestructionAudioThreshold??.65;
  if(fields.IpmDestructionRetrigger)fields.IpmDestructionRetrigger.value=o.ipmDestructionRetrigger??1.5;
  fields.Music.value=o.music;
  if(fields.ThresholdBelow)fields.ThresholdBelow.checked=!!o.thresholdBelow;
  updateAudioFreqUI(o);
  fields.Life.value=o.life;
  syncTypeUI();
  updateParticleTriggerButton();
}
function isSelected(o){return !window.vseRecordingCleanFrame&&!!(o&&selectedIds.has(o.id));}
function getSelectedObjects(){return objects.filter(o=>selectedIds.has(o.id));}
function select(o,additive=false){
  if(timelineState){timelineState.selectedCameraMoveId='';}
  if(window.vseActiveClipboardScope==='camera')window.vseActiveClipboardScope='objects';
  deselectTimeline();
  if(!o){waterDrawMode=null;waterDrawDrag=null;selected=null;selectedIds.clear();selectSingleCore(null);if(typeof syncObjectTimelineMenuSelection==='function')syncObjectTimelineMenuSelection();updateHud();updateObjectManager();return;}
  if(additive){
    if(selectedIds.has(o.id))selectedIds.delete(o.id); else selectedIds.add(o.id);
    selected=selectedIds.has(o.id)?o:(getSelectedObjects()[0]||null);
  }else{
    selectedIds.clear();selectedIds.add(o.id);selected=o;
  }
  selectSingleCore(selected);
  if(groupNameInput&&selected)groupNameInput.value=selected.groupName||'';
  if(typeof syncObjectTimelineMenuSelection==='function')syncObjectTimelineMenuSelection();
  updateHud();updateObjectManager();
}

function syncRangeWrapperVisibilityClasses(){
  document.querySelectorAll('#params input[type="range"]').forEach(range=>{
    const wrap=range.closest('.range-with-number');
    const number=wrap?wrap.querySelector('.range-number'):null;
    [...range.classList].forEach(cls=>{
      if(cls.startsWith('type-')||cls.startsWith('screen-')||cls.startsWith('particle-')){
        if(wrap)wrap.classList.add(cls);
        if(number)number.classList.add(cls);
      }
    });
  });
}
function syncTypeUI(){
  syncRangeWrapperVisibilityClasses();
  const isLight=selected&&(selected.type==='light'||selected.type==='lightbar'||selected.type==='movinghead');
  const isLightEmitter=selected&&selected.type==='light';
  const isMovingHead=selected&&selected.type==='movinghead';
  const isLightbar=selected&&selected.type==='lightbar';
  const isFog=selected&&selected.type==='fog';
  const isScreen=selected&&selected.type==='screen';
  const isText=selected&&selected.type==='text';
  const isParticle=selected&&selected.type==='particle';
  const isImageParticle=selected&&selected.type==='imageParticle';
  const isImageAsset=selected&&selected.type==='imageAsset';
  const isAudioSource=selected&&selected.type==='audioSource';
  const isVisualizer=selected&&selected.type==='visualizer';
  const isMandala=selected&&selected.type==='mandalaVisualizer';
  const isGreenscreen=selected&&selected.type==='greenscreen';
  const isWaterSurface=selected&&selected.type==='waterSurface';
  const isWaterFlow=selected&&selected.type==='waterFlowOverlay';
  const isWater=isWaterSurface||isWaterFlow;
  const hasShadow=selected&&supportsShadow(selected);
  const isWindSupported=selected&&supportsWindObject(selected);
  document.querySelectorAll('.type-light-only').forEach(e=>e.style.display=isLight?'block':'none');
  document.querySelectorAll('.type-light-emitter-only').forEach(e=>e.style.display=isLightEmitter?'block':'none');
  document.querySelectorAll('.light-rectangle-settings').forEach(e=>e.style.display=(isLightEmitter&&(selected.lightEmitterShape||'point')==='rectangle')?'block':'none');
  document.querySelectorAll('.type-lightbar-only').forEach(e=>e.style.display=isLightbar?'block':'none');
  document.querySelectorAll('.type-movinghead-only').forEach(e=>e.style.display=isMovingHead?'block':'none');
  document.querySelectorAll('.type-fog-only').forEach(e=>e.style.display=isFog?'block':'none');
  document.querySelectorAll('.type-screen-only').forEach(e=>e.style.display=isScreen?'block':'none');
  document.querySelectorAll('.type-text-only').forEach(e=>e.style.display=(isText||isScreen)?'block':'none');
  document.querySelectorAll('.screen-engine-crop').forEach(e=>e.style.display=(isScreen && (selected.screenMode||'solid')==='engine')?'block':'none');
  document.querySelectorAll('.screen-text-settings').forEach(e=>e.style.display=(isText||(isScreen&&(selected.screenMode||'solid')==='text'))?'block':'none');
  document.querySelectorAll('.type-particle-only').forEach(e=>e.style.display=isParticle?'block':'none');
  document.querySelectorAll('.particle-explosion-settings').forEach(e=>e.style.display=(isParticle && (selected.particleMode||'free')==='explosion')?'block':'none');
  document.querySelectorAll('.particle-gasjet-settings').forEach(e=>e.style.display=(isParticle && (selected.particleMode||'free')==='gasJet')?'block':'none');
  updateParticleTriggerButton();
  document.querySelectorAll('.type-particle-common').forEach(e=>e.style.display=isParticle?'block':'none');
  document.querySelectorAll('.type-imageparticle-only').forEach(e=>e.style.display=isImageParticle?'block':'none');
  document.querySelectorAll('.type-imageasset-only').forEach(e=>e.style.display=isImageAsset?'block':'none');
  document.querySelectorAll('.type-audiosource-only').forEach(e=>e.style.display=isAudioSource?'block':'none');
  document.querySelectorAll('.type-visualizer-only').forEach(e=>e.style.display=isVisualizer?'block':'none');
  document.querySelectorAll('.type-mandala-only').forEach(e=>e.style.display=isMandala?'block':'none');
  document.querySelectorAll('.type-greenscreen-only').forEach(e=>e.style.display=isGreenscreen?'block':'none');
  document.querySelectorAll('.type-water-only').forEach(e=>e.style.display=isWater?'block':'none');
  document.querySelectorAll('.type-wind-only').forEach(e=>e.style.display=isWindSupported?'block':'none');
  document.querySelectorAll('.type-watersurface-only').forEach(e=>e.style.display=isWaterSurface?'block':'none');
  document.querySelectorAll('.type-waterflow-only').forEach(e=>e.style.display=isWaterFlow?'block':'none');
  document.querySelectorAll('.type-shadow-only').forEach(e=>e.style.display=hasShadow?'block':'none');
  document.querySelectorAll('[data-visible-types]').forEach(e=>{
    const types=String(e.dataset.visibleTypes||'').split(',').map(s=>s.trim()).filter(Boolean);
    e.style.display=(selected&&types.includes(selected.type))?'block':'none';
  });
  if(selected){
    panSpeedValue.textContent=Number(selected.panSpeed??0).toFixed(2);
    panAngleValue.textContent=Math.round(selected.panAngle??0)+'°';
    angleValue.textContent=(selected.angle??360)+'°';
    if(typeof audioAngleMaxValue!=='undefined')audioAngleMaxValue.textContent=Math.round(selected.audioAngleMax??360)+'°';
    rangeValue.textContent=Math.round(selected.range??260);
    softnessValue.textContent=Number(selected.softness??.55).toFixed(2);
    glowValue.textContent=Number(selected.glow??.25).toFixed(2);
    opacityValue.textContent=Number(selected.opacity??.85).toFixed(2);
    altSpeedValue.textContent=Number(selected.altSpeed??.6).toFixed(2);
    altAmountValue.textContent=Number(selected.altAmount??1).toFixed(2);
    if(typeof lightColorMusicThresholdValue!=='undefined')lightColorMusicThresholdValue.textContent=Number(selected.lightColorMusicThreshold??.35).toFixed(2);
    if(typeof lightColorMusicAmountValue!=='undefined')lightColorMusicAmountValue.textContent=Number(selected.lightColorMusicAmount??1).toFixed(2);
    updateLightColorMusicFreqUI(selected);
    if(typeof lightEmitterLengthValue!=='undefined')lightEmitterLengthValue.textContent=Math.round(selected.lightEmitterLength??240);
    if(typeof lightEmitterWidthValue!=='undefined')lightEmitterWidthValue.textContent=Math.round(selected.lightEmitterWidth??480);
    if(typeof lightEmitterHeightValue!=='undefined')lightEmitterHeightValue.textContent=Math.round(selected.lightEmitterHeight??270);
    if(typeof lightbarCountValue!=='undefined')lightbarCountValue.textContent=Math.round(selected.lightbarCount??8);
    if(typeof lightbarLengthValue!=='undefined')lightbarLengthValue.textContent=Math.round(selected.lightbarLength??320);
    if(typeof lightbarSpreadValue!=='undefined')lightbarSpreadValue.textContent=Math.round(selected.lightbarSpread??0)+'°';
    if(typeof movingPanValue!=='undefined')movingPanValue.textContent=Math.round(selected.movingPan??0)+'°';
    if(typeof movingTiltValue!=='undefined')movingTiltValue.textContent=Math.round(selected.movingTilt??-55)+'°';
    if(typeof movingPanRangeValue!=='undefined')movingPanRangeValue.textContent=Math.round(selected.movingPanRange??90)+'°';
    if(typeof movingTiltRangeValue!=='undefined')movingTiltRangeValue.textContent=Math.round(selected.movingTiltRange??70)+'°';
    if(typeof movingSpeedValue!=='undefined')movingSpeedValue.textContent=Number(selected.movingSpeed??.8).toFixed(2);
    if(typeof movingBeamAngleValue!=='undefined')movingBeamAngleValue.textContent=Math.round(selected.movingBeamAngle??14)+'°';
    if(typeof movingBeamRangeValue!=='undefined')movingBeamRangeValue.textContent=Math.round(selected.movingBeamRange??480);
    if(typeof movingHeadGlowValue!=='undefined')movingHeadGlowValue.textContent=Number(selected.movingHeadGlow??.35).toFixed(2);
    if(typeof movingAudioMoveValue!=='undefined')movingAudioMoveValue.textContent=Number(selected.movingAudioMove??.7).toFixed(2);
    fogPanSpeedValue.textContent=Number(selected.fogPanSpeed??0).toFixed(2);
    fogPanAngleValue.textContent=Math.round(selected.fogPanAngle??0)+'°';
    fogAngleValue.textContent=Math.round(selected.fogAngle??80)+'°';
    if(typeof fogStartWidthValue!=='undefined')fogStartWidthValue.textContent=Math.round(selected.fogStartWidth??80);
    fogLifeValue.textContent=Number(selected.fogLife??4.0).toFixed(1)+' s';
    fogDynamicsValue.textContent=Number(selected.fogDynamics??1.0).toFixed(2);
    if(typeof fogGravityValue!=='undefined')fogGravityValue.textContent=Number(selected.fogGravity??0).toFixed(2);
    fogSoftnessValue.textContent=Number(selected.fogSoftness??.75).toFixed(2);
    fogGlowValue.textContent=Number(selected.fogGlow??.15).toFixed(2);
    if(typeof fogEmitterOpacityValue!=='undefined')fogEmitterOpacityValue.textContent=Number(selected.fogEmitterOpacity??.44).toFixed(2);
    fogOpacityValue.textContent=Number(selected.fogOpacity??.35).toFixed(2);
    fogAltSpeedValue.textContent=Number(selected.fogAltSpeed??.3).toFixed(2);
    fogAltAmountValue.textContent=Number(selected.fogAltAmount??.4).toFixed(2);
    fogMotionValue.textContent=Number(selected.fogMotion??.7).toFixed(2);
    fogTurbulenceValue.textContent=Number(selected.fogTurbulence??.65).toFixed(2);
    screenWidthValue.textContent=Math.round(selected.screenWidth??260);
    screenHeightValue.textContent=Math.round(selected.screenHeight??120);
    screenBrightnessValue.textContent=Number(selected.screenBrightness??1).toFixed(2);
    screenOpacityValue.textContent=Number(selected.screenOpacity??1).toFixed(2);
    screenScanlinesValue.textContent=Number(selected.screenScanlines??.3).toFixed(2);
    screenAudioValue.textContent=Number(selected.screenAudio??.5).toFixed(2);
    screenAltSpeedValue.textContent=Number(selected.screenAltSpeed??.25).toFixed(2);
    screenAltAmountValue.textContent=Number(selected.screenAltAmount??.6).toFixed(2);
    if(typeof screenTextSizeValue!=='undefined')screenTextSizeValue.textContent=Math.round(Number(selected.screenTextSize??48));
    if(typeof screenTextLineHeightValue!=='undefined')screenTextLineHeightValue.textContent=Number(selected.screenTextLineHeight??1.2).toFixed(2);
    if(typeof screenTextSpeedValue!=='undefined')screenTextSpeedValue.textContent=Math.round(Number(selected.screenTextSpeed??80));
    if(typeof screenTextBgOpacityValue!=='undefined')screenTextBgOpacityValue.textContent=Number(selected.screenTextBgOpacity??1).toFixed(2);
    if(typeof screenAmbilightStrengthValue!=='undefined'&&screenAmbilightStrengthValue)screenAmbilightStrengthValue.textContent=Number(selected.screenAmbilightStrength??1).toFixed(2);
    if(typeof screenEngineXValue!=='undefined'&&screenEngineXValue)screenEngineXValue.textContent=Math.round(Number(selected.screenEngineX??0));
    if(typeof screenEngineYValue!=='undefined'&&screenEngineYValue)screenEngineYValue.textContent=Math.round(Number(selected.screenEngineY??0));
    if(typeof screenEngineWValue!=='undefined'&&screenEngineWValue)screenEngineWValue.textContent=Math.round(Number(selected.screenEngineW??640));
    if(typeof screenEngineHValue!=='undefined'&&screenEngineHValue)screenEngineHValue.textContent=Math.round(Number(selected.screenEngineH??360));
    if(typeof visualizerWidthValue!=='undefined')visualizerWidthValue.textContent=Math.round(Number(selected.visualizerWidth??520));
    if(typeof visualizerHeightValue!=='undefined')visualizerHeightValue.textContent=Math.round(Number(selected.visualizerHeight??180));
    if(typeof visualizerBarsValue!=='undefined')visualizerBarsValue.textContent=Math.round(Number(selected.visualizerBars??32));
    if(typeof visualizerSensitivityValue!=='undefined')visualizerSensitivityValue.textContent=Number(selected.visualizerSensitivity??1).toFixed(2);
    
    if(typeof visualizerGapValue!=='undefined')visualizerGapValue.textContent=Number(selected.visualizerGap??.25).toFixed(2);
    if(typeof visualizerOpacityValue!=='undefined')visualizerOpacityValue.textContent=Number(selected.visualizerOpacity??.95).toFixed(2);
    if(typeof visualizerPeakHoldValue!=='undefined')visualizerPeakHoldValue.textContent=Math.round(Number(selected.visualizerPeakHold??30));
    const visualizerSegmentCountValue=document.getElementById('visualizerSegmentCountValue');
    const visualizerSegmentGapValue=document.getElementById('visualizerSegmentGapValue');
    if(visualizerSegmentCountValue)visualizerSegmentCountValue.textContent=Math.round(Number(selected.visualizerSegmentCount??16));
    if(visualizerSegmentGapValue)visualizerSegmentGapValue.textContent=Number(selected.visualizerSegmentGap??.18).toFixed(2);
    if(typeof mandalaObjWidthValue!=='undefined')mandalaObjWidthValue.textContent=Math.round(Number(selected.mandalaObjWidth??420));
    if(typeof mandalaObjHeightValue!=='undefined')mandalaObjHeightValue.textContent=Math.round(Number(selected.mandalaObjHeight??420));
    if(typeof mandalaObjOpacityValue!=='undefined')mandalaObjOpacityValue.textContent=Number(selected.mandalaObjOpacity??1).toFixed(2);
    if(typeof mandalaObjSegmentsValue!=='undefined')mandalaObjSegmentsValue.textContent=Math.round(Number(selected.mandalaObjSegments??6));
    if(typeof mandalaObjRotationValue!=='undefined')mandalaObjRotationValue.textContent=Math.round(Number(selected.mandalaObjRotation??0));
    if(typeof mandalaObjCenterXValue!=='undefined')mandalaObjCenterXValue.textContent=Number(selected.mandalaObjCenterX??.5).toFixed(2);
    if(typeof mandalaObjCenterYValue!=='undefined')mandalaObjCenterYValue.textContent=Number(selected.mandalaObjCenterY??.5).toFixed(2);
    if(typeof mandalaObjZoomValue!=='undefined')mandalaObjZoomValue.textContent=Number(selected.mandalaObjZoom??1).toFixed(2);
    if(typeof mandalaObjMixValue!=='undefined')mandalaObjMixValue.textContent=Number(selected.mandalaObjMix??1).toFixed(2);
    if(typeof imageAssetWidthValue!=='undefined')imageAssetWidthValue.textContent=Math.round(Number(selected.imageAssetWidth??240));
    if(typeof imageAssetHeightValue!=='undefined')imageAssetHeightValue.textContent=Math.round(Number(selected.imageAssetHeight??160));
    if(typeof imageAssetOpacityValue!=='undefined')imageAssetOpacityValue.textContent=Number(selected.imageAssetOpacity??1).toFixed(2);
    if(typeof imageAssetPerspectiveStrengthValue!=='undefined')imageAssetPerspectiveStrengthValue.textContent=Number(selected.imageAssetPerspectiveStrength??.45).toFixed(2);
    if(typeof imageAssetPerspectiveMinValue!=='undefined')imageAssetPerspectiveMinValue.textContent=Number(selected.imageAssetPerspectiveMin??.35).toFixed(2);
    if(typeof imageAssetAudioDirXValue!=='undefined')imageAssetAudioDirXValue.textContent=Number(selected.imageAssetAudioDirX??0).toFixed(2);
    if(typeof imageAssetAudioDirYValue!=='undefined')imageAssetAudioDirYValue.textContent=Number(selected.imageAssetAudioDirY??-1).toFixed(2);
    if(typeof imageAssetAudioStrengthValue!=='undefined')imageAssetAudioStrengthValue.textContent=Math.round(Number(selected.imageAssetAudioStrength??30));
    if(typeof imageAssetAudioImpulseCooldownValue!=='undefined')imageAssetAudioImpulseCooldownValue.textContent=Number(selected.imageAssetAudioImpulseCooldown??.12).toFixed(2);
    if(typeof imageAssetMassValue!=='undefined')imageAssetMassValue.textContent=Number(selected.imageAssetMass??1).toFixed(2);
    if(typeof imageAssetGravityValue!=='undefined')imageAssetGravityValue.textContent=Number(selected.imageAssetGravity??.6).toFixed(2);
    if(typeof imageAssetFrictionValue!=='undefined')imageAssetFrictionValue.textContent=Number(selected.imageAssetFriction??.6).toFixed(2);
    if(typeof imageAssetBounceValue!=='undefined')imageAssetBounceValue.textContent=Number(selected.imageAssetBounce??.2).toFixed(2);
    if(typeof imageAssetAngularDampingValue!=='undefined')imageAssetAngularDampingValue.textContent=Number(selected.imageAssetAngularDamping??.9).toFixed(2);
    if(typeof imageAssetLinearDampingValue!=='undefined')imageAssetLinearDampingValue.textContent=Number(selected.imageAssetLinearDamping??.9).toFixed(2);
    if(typeof imageAssetImpulseXValue!=='undefined')imageAssetImpulseXValue.textContent=Number(selected.imageAssetImpulseX??1).toFixed(2);
    if(typeof imageAssetImpulseYValue!=='undefined')imageAssetImpulseYValue.textContent=Number(selected.imageAssetImpulseY??-.25).toFixed(2);
    if(typeof imageAssetImpulseStrengthValue!=='undefined')imageAssetImpulseStrengthValue.textContent=Number(selected.imageAssetImpulseStrength??6).toFixed(2);
    if(typeof imageAssetImpulseRotationValue!=='undefined')imageAssetImpulseRotationValue.textContent=Number(selected.imageAssetImpulseRotation??0).toFixed(2);
    if(typeof shadowOpacityValue!=='undefined')shadowOpacityValue.textContent=Number(selected.shadowOpacity??.35).toFixed(2);
    if(typeof shadowBlurValue!=='undefined')shadowBlurValue.textContent=Number(selected.shadowBlur??.55).toFixed(2);
    if(typeof shadowOffsetXValue!=='undefined')shadowOffsetXValue.textContent=Math.round(Number(selected.shadowOffsetX??0));
    if(typeof shadowOffsetYValue!=='undefined')shadowOffsetYValue.textContent=Math.round(Number(selected.shadowOffsetY??80));
    if(typeof shadowScaleXValue!=='undefined')shadowScaleXValue.textContent=Number(selected.shadowScaleX??1).toFixed(2);
    if(typeof shadowScaleYValue!=='undefined')shadowScaleYValue.textContent=Number(selected.shadowScaleY??.35).toFixed(2);
    if(typeof shadowRotationValue!=='undefined')shadowRotationValue.textContent=Math.round(Number(selected.shadowRotation??0));
    if(typeof waterWidthValue!=='undefined')waterWidthValue.textContent=Math.round(Number(selected.waterWidth??420));
    if(typeof waterHeightValue!=='undefined')waterHeightValue.textContent=Math.round(Number(selected.waterHeight??180));
    if(typeof waterOpacityValue!=='undefined')waterOpacityValue.textContent=Number(selected.waterOpacity??.65).toFixed(2);
    if(typeof waterWaveHeightValue!=='undefined')waterWaveHeightValue.textContent=Number(selected.waterWaveHeight??.35).toFixed(2);
    if(typeof waterWaveScaleValue!=='undefined')waterWaveScaleValue.textContent=Number(selected.waterWaveScale??1.2).toFixed(2);
    if(typeof waterWaveSpeedValue!=='undefined')waterWaveSpeedValue.textContent=Number(selected.waterWaveSpeed??.35).toFixed(2);
    if(typeof waterFlowDirectionValue!=='undefined')waterFlowDirectionValue.textContent=Math.round(Number(selected.waterFlowDirection??0))+'Â°';
    if(typeof waterFlowSpeedValue!=='undefined')waterFlowSpeedValue.textContent=Number(selected.waterFlowSpeed??.55).toFixed(2);
    if(typeof waterFlowScaleValue!=='undefined')waterFlowScaleValue.textContent=Number(selected.waterFlowScale??1.5).toFixed(2);
    if(typeof waterDistortionStrengthValue!=='undefined')waterDistortionStrengthValue.textContent=Number(selected.waterDistortionStrength??.25).toFixed(2);
    if(typeof waterReflectionStrengthValue!=='undefined')waterReflectionStrengthValue.textContent=Number(selected.waterReflectionStrength??.35).toFixed(2);
    if(typeof waterHighlightStrengthValue!=='undefined')waterHighlightStrengthValue.textContent=Number(selected.waterHighlightStrength??.55).toFixed(2);
    if(typeof waterWaveNoiseValue!=='undefined')waterWaveNoiseValue.textContent=Number(selected.waterWaveNoise??.55).toFixed(2);
    if(typeof waterEdgeFadeValue!=='undefined')waterEdgeFadeValue.textContent=Number(selected.waterEdgeFade??.35).toFixed(2);
    if(typeof waterAudioReactionValue!=='undefined')waterAudioReactionValue.textContent=Number(selected.waterAudioReaction??.25).toFixed(2);
    if(typeof waterSparkleDensityValue!=='undefined')waterSparkleDensityValue.textContent=Number(selected.waterSparkleDensity??.55).toFixed(2);
    if(typeof waterSparkleSizeValue!=='undefined')waterSparkleSizeValue.textContent=Number(selected.waterSparkleSize??1).toFixed(2);
    if(typeof waterSparkleBrightnessValue!=='undefined')waterSparkleBrightnessValue.textContent=Number(selected.waterSparkleBrightness??.8).toFixed(2);
    if(typeof waterSparkleSpeedValue!=='undefined')waterSparkleSpeedValue.textContent=Number(selected.waterSparkleSpeed??.75).toFixed(2);
    if(typeof waterFoamAmountValue!=='undefined')waterFoamAmountValue.textContent=Number(selected.waterFoamAmount??.25).toFixed(2);
    if(typeof waterFoamSpeedValue!=='undefined')waterFoamSpeedValue.textContent=Number(selected.waterFoamSpeed??.35).toFixed(2);
    if(typeof waterFoamScaleValue!=='undefined')waterFoamScaleValue.textContent=Number(selected.waterFoamScale??1.5).toFixed(2);
    if(typeof waterFoamOpacityValue!=='undefined')waterFoamOpacityValue.textContent=Number(selected.waterFoamOpacity??.35).toFixed(2);
    if(typeof audioSourceVolumeValue!=='undefined')audioSourceVolumeValue.textContent=Number(selected.audioSourceVolume??1).toFixed(2);
    if(typeof audioSourceRangeValue!=='undefined')audioSourceRangeValue.textContent=Math.round(Number(selected.audioSourceRange??35));
    if(typeof audioSourceFalloffValue!=='undefined')audioSourceFalloffValue.textContent=Number(selected.audioSourceFalloff??1).toFixed(2);
    if(typeof audioSourceIconOpacityValue!=='undefined')audioSourceIconOpacityValue.textContent=Number(selected.audioSourceIconOpacity??.65).toFixed(2);
    if(typeof audioSourceDirectionValue!=='undefined')audioSourceDirectionValue.textContent=Math.round(Number(selected.audioSourceDirection??0))+'°';

    if(typeof greenscreenEdgeTrimValue!=='undefined')greenscreenEdgeTrimValue.textContent=Number(selected.greenscreenEdgeTrim??0).toFixed(2);
    if(typeof greenscreenSpillReductionValue!=='undefined')greenscreenSpillReductionValue.textContent=Number(selected.greenscreenSpillReduction??0).toFixed(2);
    if(typeof greenscreenEdgeDarkenValue!=='undefined')greenscreenEdgeDarkenValue.textContent=Number(selected.greenscreenEdgeDarken??0).toFixed(2);
    if(typeof greenscreenWidthValue!=='undefined')greenscreenWidthValue.textContent=Math.round(Number(selected.greenscreenWidth??480));
    if(typeof greenscreenHeightValue!=='undefined')greenscreenHeightValue.textContent=Math.round(Number(selected.greenscreenHeight??270));
    if(typeof greenscreenToleranceValue!=='undefined')greenscreenToleranceValue.textContent=Number(selected.greenscreenTolerance??.32).toFixed(2);
    if(typeof greenscreenSoftnessValue!=='undefined')greenscreenSoftnessValue.textContent=Number(selected.greenscreenSoftness??.12).toFixed(2);
    if(typeof greenscreenEdgeTrimValue!=='undefined')greenscreenEdgeTrimValue.textContent=Number(selected.greenscreenEdgeTrim??0).toFixed(2);
    if(typeof greenscreenSpillReductionValue!=='undefined')greenscreenSpillReductionValue.textContent=Number(selected.greenscreenSpillReduction??0).toFixed(2);
    if(typeof greenscreenEdgeDarkenValue!=='undefined')greenscreenEdgeDarkenValue.textContent=Number(selected.greenscreenEdgeDarken??0).toFixed(2);
    if(typeof greenscreenOpacityValue!=='undefined')greenscreenOpacityValue.textContent=Number(selected.greenscreenOpacity??1).toFixed(2);
    if(typeof greenscreenAudioVolumeValue!=='undefined')greenscreenAudioVolumeValue.textContent=Number(selected.greenscreenAudioVolume??1).toFixed(2);
    if(typeof greenscreenShadowWidthValue!=='undefined')greenscreenShadowWidthValue.textContent=Math.round(Number(selected.greenscreenShadowWidth??280));
    if(typeof greenscreenShadowHeightValue!=='undefined')greenscreenShadowHeightValue.textContent=Math.round(Number(selected.greenscreenShadowHeight??80));
    if(typeof greenscreenShadowOffsetXValue!=='undefined')greenscreenShadowOffsetXValue.textContent=Math.round(Number(selected.greenscreenShadowOffsetX??0));
    if(typeof greenscreenShadowOffsetYValue!=='undefined')greenscreenShadowOffsetYValue.textContent=Math.round(Number(selected.greenscreenShadowOffsetY??130));
    if(typeof greenscreenShadowSoftnessValue!=='undefined')greenscreenShadowSoftnessValue.textContent=Number(selected.greenscreenShadowSoftness??.65).toFixed(2);
    if(typeof greenscreenShadowOpacityValue!=='undefined')greenscreenShadowOpacityValue.textContent=Number(selected.greenscreenShadowOpacity??.45).toFixed(2);
    if(screenVideoVolumeValue)screenVideoVolumeValue.textContent=Number(selected.screenVideoVolume??1).toFixed(2);
    if(typeof particleEmitterLengthValue!=='undefined')particleEmitterLengthValue.textContent=Math.round(Number(selected.particleEmitterLength??120));
    if(typeof particleEmitterTransparencyValue!=='undefined')particleEmitterTransparencyValue.textContent=Math.round(Number(selected.particleEmitterTransparency??0)*100)+'%';
    if(typeof particleAmountValue!=='undefined')particleAmountValue.textContent=Number(selected.particleAmount??.7).toFixed(2);
    if(typeof particleSpeedValue!=='undefined')particleSpeedValue.textContent=Number(selected.particleSpeed??1).toFixed(2);
    if(typeof particleSpreadValue!=='undefined')particleSpreadValue.textContent=Math.round(selected.particleSpread??70)+'°';
    if(typeof particleLifeValue!=='undefined')particleLifeValue.textContent=Number(selected.particleLife??2.5).toFixed(1)+' s';
    if(typeof particleEmissionDurationValue!=='undefined')particleEmissionDurationValue.textContent=(selected.particleUnlimited?'unbegrenzt':Number(selected.particleEmissionDuration??1.0).toFixed(1)+' s');
    if(fields.ParticleEmissionDuration)fields.ParticleEmissionDuration.disabled=!!selected.particleUnlimited;
    if(typeof particleGravityValue!=='undefined')particleGravityValue.textContent=Number(selected.particleGravity??.4).toFixed(2);
    if(typeof particleTurbulenceValue!=='undefined')particleTurbulenceValue.textContent=Number(selected.particleTurbulence??.4).toFixed(2);
    if(typeof particleSizeValue!=='undefined')particleSizeValue.textContent=Number(selected.particleSize??3).toFixed(1);
    if(typeof particleGlowValue!=='undefined')particleGlowValue.textContent=Number(selected.particleGlow??.7).toFixed(2);
    if(typeof particleOpacityValue!=='undefined')particleOpacityValue.textContent=Number(selected.particleOpacity??.8).toFixed(2);
    if(typeof windInfluenceValue!=='undefined')windInfluenceValue.textContent=Number(selected.windInfluence??1).toFixed(2);
    if(typeof particleAudioValue!=='undefined')particleAudioValue.textContent=Number(selected.particleAudio??.25).toFixed(2);
    if(typeof particleBlastEnergyValue!=='undefined')particleBlastEnergyValue.textContent=Number(selected.particleBlastEnergy??1).toFixed(2);
    if(typeof particleShockwaveRadiusValue!=='undefined')particleShockwaveRadiusValue.textContent=Number(selected.particleShockwaveRadius??1).toFixed(2);
    if(typeof particleInitialVelocityValue!=='undefined')particleInitialVelocityValue.textContent=Number(selected.particleInitialVelocity??1).toFixed(2);
    if(typeof particleVelocitySpreadValue!=='undefined')particleVelocitySpreadValue.textContent=Number(selected.particleVelocitySpread??1).toFixed(2);
    if(typeof particleExplosionTurbulenceValue!=='undefined')particleExplosionTurbulenceValue.textContent=Number(selected.particleExplosionTurbulence??1).toFixed(2);
    if(typeof particleUpdraftValue!=='undefined')particleUpdraftValue.textContent=Number(selected.particleUpdraft??1).toFixed(2);
    if(typeof particleFireballDurationValue!=='undefined')particleFireballDurationValue.textContent=Number(selected.particleFireballDuration??.42).toFixed(2);
    if(typeof particleSmokeAmountValue!=='undefined')particleSmokeAmountValue.textContent=Number(selected.particleSmokeAmount??.75).toFixed(2);
    if(typeof particleSmokeLifetimeValue!=='undefined')particleSmokeLifetimeValue.textContent=Number(selected.particleSmokeLifetime??1).toFixed(2);
    if(typeof particleDebrisAmountValue!=='undefined')particleDebrisAmountValue.textContent=Number(selected.particleDebrisAmount??.35).toFixed(2);
    if(typeof particleDebrisGravityValue!=='undefined')particleDebrisGravityValue.textContent=Number(selected.particleDebrisGravity??1).toFixed(2);
    if(typeof particleJetPressureValue!=='undefined')particleJetPressureValue.textContent=Number(selected.particleJetPressure??1).toFixed(2);
    if(typeof particleJetVelocityValue!=='undefined')particleJetVelocityValue.textContent=Number(selected.particleJetVelocity??1).toFixed(2);
    if(typeof particleJetWidthValue!=='undefined')particleJetWidthValue.textContent=Number(selected.particleJetWidth??1).toFixed(2);
    if(typeof particleJetLengthValue!=='undefined')particleJetLengthValue.textContent=Number(selected.particleJetLength??1).toFixed(2);
    if(typeof particleCoreStabilityValue!=='undefined')particleCoreStabilityValue.textContent=Number(selected.particleCoreStability??.85).toFixed(2);
    if(typeof particleEdgeTurbulenceValue!=='undefined')particleEdgeTurbulenceValue.textContent=Number(selected.particleEdgeTurbulence??1).toFixed(2);
    if(typeof particleUpdraftStrengthValue!=='undefined')particleUpdraftStrengthValue.textContent=Number(selected.particleUpdraftStrength??1).toFixed(2);
    if(typeof particleTipTurbulenceValue!=='undefined')particleTipTurbulenceValue.textContent=Number(selected.particleTipTurbulence??1).toFixed(2);
    if(typeof particleBrightnessValue!=='undefined')particleBrightnessValue.textContent=Number(selected.particleBrightness??1).toFixed(2);
    if(typeof particleGlowStrengthValue!=='undefined')particleGlowStrengthValue.textContent=Number(selected.particleGlowStrength??1).toFixed(2);
    if(typeof particleJetSmokeAmountValue!=='undefined')particleJetSmokeAmountValue.textContent=Number(selected.particleJetSmokeAmount??.25).toFixed(2);
    if(typeof ipmDensityValue!=='undefined')ipmDensityValue.textContent=Number(selected.ipmDensity??.78).toFixed(2);
    if(typeof ipmParticleSizeValue!=='undefined')ipmParticleSizeValue.textContent=Number(selected.ipmParticleSize??2.4).toFixed(1);
    if(typeof ipmScaleValue!=='undefined')ipmScaleValue.textContent=Number(selected.ipmScale??1).toFixed(2);
    if(typeof ipmOpacityValue!=='undefined')ipmOpacityValue.textContent=Number(selected.ipmOpacity??.9).toFixed(2);
    if(typeof ipmReactionValue!=='undefined')ipmReactionValue.textContent=Number(selected.ipmReaction??.4).toFixed(2);
    if(typeof ipmReturnValue!=='undefined')ipmReturnValue.textContent=Number(selected.ipmReturn??.45).toFixed(2);
    if(typeof ipmThresholdValue!=='undefined')ipmThresholdValue.textContent=Math.round(selected.ipmThreshold??145);
    if(typeof ipmWaveValue!=='undefined')ipmWaveValue.textContent=Math.round(selected.ipmWave??12);
    if(typeof ipmJitterValue!=='undefined')ipmJitterValue.textContent=Math.round(selected.ipmJitter??4);
    if(typeof ipmEffectStrengthValue!=='undefined')ipmEffectStrengthValue.textContent=Math.round(selected.ipmEffectStrength??60);
    if(typeof ipmEffectSpeedValue!=='undefined')ipmEffectSpeedValue.textContent=Math.round(selected.ipmEffectSpeed??80);
    if(typeof ipmAudioEffectSpeedValue!=='undefined')ipmAudioEffectSpeedValue.textContent=Math.round(selected.ipmAudioEffectSpeed??120);
    if(typeof ipmAudioEffectStrengthValue!=='undefined')ipmAudioEffectStrengthValue.textContent=Math.round(selected.ipmAudioEffectStrength??100);
    if(typeof ipmAudioEffectPulseValue!=='undefined')ipmAudioEffectPulseValue.textContent=Math.round(selected.ipmAudioEffectPulse??80);
    if(typeof ipmAudioMovementValue!=='undefined')ipmAudioMovementValue.textContent=Math.round(selected.ipmAudioMovement??40);
    if(typeof ipmAudioSizeValue!=='undefined')ipmAudioSizeValue.textContent=Math.round(selected.ipmAudioSize??14);
    if(typeof ipmAudioAlphaValue!=='undefined')ipmAudioAlphaValue.textContent=Math.round(selected.ipmAudioAlpha??20);
  }
  syncRangeNumberInputs();
  if(typeof updateAudioFreqAnalyzerOverlay==='function')updateAudioFreqAnalyzerOverlay();
  hud.textContent=selected?`Auswahl: ${selected.name} · ${selected.type} · Layer ${selected.layer??1} · Objekte: ${objects.length}`:`Keine Auswahl · Objekte: ${objects.length}`;
  count.textContent=objects.length;
}



function enhanceObjectRangeNumberInputs(){
  document.querySelectorAll('#params input[type="range"]').forEach(range=>{
    if(range.dataset.numberEnhanced==='1')return;
    range.dataset.numberEnhanced='1';
    const number=document.createElement('input');
    number.type='number';
    number.className='range-number';
    number.min=range.min||'';
    number.max=range.max||'';
    number.step=range.step||'any';
    number.value=range.value;
    number.title='Wert händisch eingeben';
    number.dataset.forRange=range.id||'';
    const wrap=document.createElement('div');
    wrap.className='range-with-number';
    [...range.classList].forEach(cls=>{
      if(cls.startsWith('type-')||cls.startsWith('screen-')||cls.startsWith('particle-')){
        wrap.classList.add(cls);
        number.classList.add(cls);
      }
    });
    range.parentNode.insertBefore(wrap,range);
    wrap.appendChild(range);
    wrap.appendChild(number);
    const clamp=(v)=>{
      let n=Number(v);
      if(!Number.isFinite(n))return null;
      if(range.min!==''&&range.min!=null)n=Math.max(Number(range.min),n);
      if(range.max!==''&&range.max!=null)n=Math.min(Number(range.max),n);
      return n;
    };
    const syncFromRange=()=>{
      number.value=range.value;
      number.disabled=range.disabled;
    };
    range.addEventListener('input',syncFromRange);
    number.addEventListener('input',()=>{
      if(number.value==='')return;
      const n=clamp(number.value);
      if(n===null)return;
      range.value=String(n);
      range.dispatchEvent(new Event('input',{bubbles:true}));
    });
    number.addEventListener('change',()=>{
      const n=clamp(number.value);
      if(n===null){number.value=range.value;return;}
      range.value=String(n);
      number.value=range.value;
      range.dispatchEvent(new Event('input',{bubbles:true}));
    });
  });
  syncRangeWrapperVisibilityClasses();
}
function syncRangeNumberInputs(){
  document.querySelectorAll('#params input[type="range"]').forEach(range=>{
    const wrap=range.closest('.range-with-number');
    const number=wrap?wrap.querySelector('.range-number'):null;
    if(number){number.value=range.value;number.disabled=range.disabled;}
  });
}
enhanceObjectRangeNumberInputs();

const audioFreqLog=document.getElementById('pAudioFreqLog'),audioFreqHz=document.getElementById('pAudioFreqHz'),audioFreqValue=document.getElementById('audioFreqValue');
const lightColorMusicFreqLog=document.getElementById('pLightColorMusicFreqLog'),lightColorMusicFreqHz=document.getElementById('pLightColorMusicFreqHz'),lightColorMusicFreqValue=document.getElementById('lightColorMusicFreqValue');
function updateAudioFreqUI(o){
  if(!audioFreqLog||!audioFreqHz||!audioFreqValue)return;
  const f=Math.max(AUDIO_REACT_MIN,Math.min(AUDIO_REACT_MAX,Number(o&&o.audioFreq!==undefined?o.audioFreq:120)));
  audioFreqLog.value=String(freqToLogValue(f));
  audioFreqHz.value=String(Math.round(f));
  audioFreqValue.textContent=formatFreq(f);
}
function setSelectedAudioFreq(freq){
  if(!selected)return;
  selected.audioFreq=Math.max(AUDIO_REACT_MIN,Math.min(AUDIO_REACT_MAX,Number(freq)||120));
  updateAudioFreqUI(selected);
  if(typeof updateAudioFreqAnalyzerOverlay==='function')updateAudioFreqAnalyzerOverlay();
}
if(audioFreqLog)audioFreqLog.addEventListener('input',()=>setSelectedAudioFreq(logValueToFreq(audioFreqLog.value)));
if(audioFreqHz)audioFreqHz.addEventListener('input',()=>{if(audioFreqHz.value!=='')setSelectedAudioFreq(audioFreqHz.value);});
if(audioFreqHz)audioFreqHz.addEventListener('change',()=>{setSelectedAudioFreq(audioFreqHz.value);});
function updateLightColorMusicFreqUI(o){
  if(!lightColorMusicFreqLog||!lightColorMusicFreqHz||!lightColorMusicFreqValue)return;
  const f=Math.max(AUDIO_REACT_MIN,Math.min(AUDIO_REACT_MAX,Number(o&&o.lightColorMusicFreq!==undefined?o.lightColorMusicFreq:1000)));
  lightColorMusicFreqLog.value=String(freqToLogValue(f));
  lightColorMusicFreqHz.value=String(Math.round(f));
  lightColorMusicFreqValue.textContent=formatFreq(f);
}
function setSelectedLightColorMusicFreq(freq){
  if(!selected)return;
  selected.lightColorMusicFreq=Math.max(AUDIO_REACT_MIN,Math.min(AUDIO_REACT_MAX,Number(freq)||1000));
  propagateSelectedProperty('lightColorMusicFreq',selected);
  updateLightColorMusicFreqUI(selected);
  if(typeof updateAudioFreqAnalyzerOverlay==='function')updateAudioFreqAnalyzerOverlay();
}
if(lightColorMusicFreqLog)lightColorMusicFreqLog.addEventListener('input',()=>setSelectedLightColorMusicFreq(logValueToFreq(lightColorMusicFreqLog.value)));
if(lightColorMusicFreqHz)lightColorMusicFreqHz.addEventListener('input',()=>{if(lightColorMusicFreqHz.value!=='')setSelectedLightColorMusicFreq(lightColorMusicFreqHz.value);});
if(lightColorMusicFreqHz)lightColorMusicFreqHz.addEventListener('change',()=>{setSelectedLightColorMusicFreq(lightColorMusicFreqHz.value);});

const syncLightUI=syncTypeUI;
function applyTypeDefaults(o,type){
  if(o.audioFreq===undefined)o.audioFreq=type==='light'?120:type==='fog'?250:type==='screen'?1000:type==='visualizer'?1000:type==='greenscreen'?1000:(type==='particle'||type==='imageParticle')?90:(type==='waterSurface'||type==='waterFlowOverlay')?800:type==='mandalaVisualizer'?800:120;
  if(o.thresholdBelow===undefined)o.thresholdBelow=false;
  if(type==='movinghead'){
    o.color=o.color||'#62d8ff'; o.altColor=o.altColor||'#ff4fd8'; o.altSpeed=o.altSpeed??0.6; o.altAmount=o.altAmount??1; o.angle=o.angle??10; o.audioAngleMax=o.audioAngleMax??360; o.movingMode=o.movingMode||'static'; o.movingPan=o.movingPan??0; o.movingTilt=o.movingTilt??-55; o.movingPanRange=o.movingPanRange??90; o.movingTiltRange=o.movingTiltRange??70; o.movingSpeed=o.movingSpeed??.8; o.movingBeamAngle=o.movingBeamAngle??14; o.movingBeamRange=o.movingBeamRange??480; o.movingBodyVisible=o.movingBodyVisible??true; o.movingHeadGlow=o.movingHeadGlow??.35; o.movingAudioMove=o.movingAudioMove??.7; o.size=o.size||64;
  }
  if(type==='light'){
    o.altColor=o.altColor||'#ff4fd8'; o.altSpeed=o.altSpeed??0.6; o.altAmount=o.altAmount??1; o.lightColorMusicEnabled=!!(o.lightColorMusicEnabled??false); o.lightColorMusicFreq=Math.max(20,Math.min(20000,Number(o.lightColorMusicFreq??1000))); o.lightColorMusicThreshold=Math.max(0,Math.min(1,Number(o.lightColorMusicThreshold??.35))); o.lightColorMusicBelow=!!(o.lightColorMusicBelow??false); o.lightColorMusicAmount=Math.max(0,Math.min(2,Number(o.lightColorMusicAmount??1))); o.lightEmitterShape=o.lightEmitterShape||'point'; o.lightRectangleEmission=o.lightRectangleEmission||'outward'; o.lightEmitterLength=o.lightEmitterLength??240; o.lightEmitterWidth=o.lightEmitterWidth??480; o.lightEmitterHeight=o.lightEmitterHeight??270; o.panSpeed=o.panSpeed??0; o.panAngle=o.panAngle??0; o.laser=o.laser??false; o.angle=o.angle??6; o.audioAngleMax=o.audioAngleMax??360; o.color=o.color||'#62d8ff';
  }
  if(type==='fog'){
    o.color=o.color||'#cfe8ff'; o.fogPanSpeed=o.fogPanSpeed??0; o.fogPanAngle=o.fogPanAngle??0; o.fogAngle=o.fogAngle??80; o.fogStartWidth=o.fogStartWidth??80; o.fogLife=o.fogLife??4.0; o.fogDynamics=o.fogDynamics??1.0; o.fogGravity=o.fogGravity??0; o.fogSoftness=o.fogSoftness??.75; o.fogGlow=o.fogGlow??.15; o.fogEmitterOpacity=o.fogEmitterOpacity??.44; o.fogOpacity=o.fogOpacity??.35; o.fogAltColor=o.fogAltColor||'#b7f0ff'; o.fogAltSpeed=o.fogAltSpeed??.3; o.fogAltAmount=o.fogAltAmount??.4; o.fogMotion=o.fogMotion??.9; o.fogTurbulence=o.fogTurbulence??.85; o.size=o.size||52;
  }
  if(type==='screen'){
    o.screenAudioEnabled=o.screenAudioEnabled!==false;
    o.color=o.color||'#2fd6ff'; o.screenWidth=o.screenWidth??260; o.screenHeight=o.screenHeight??120; o.screenMode=o.screenMode||'audio'; o.screenFrameMode=o.screenFrameMode||'visible'; o.screenBrightness=o.screenBrightness??1; o.screenOpacity=o.screenOpacity??1; o.screenScanlines=o.screenScanlines??.3; o.screenAudio=o.screenAudio??.5; o.screenAltColor=o.screenAltColor||'#ff4fd8'; o.screenAltSpeed=o.screenAltSpeed??.25; o.screenAltAmount=o.screenAltAmount??.6; o.screenMediaType=o.screenMediaType||'none'; o.screenMediaName=o.screenMediaName||''; o.screenMediaData=o.screenMediaData||null; o.screenMediaEmbedded=!!o.screenMediaData; o.screenMediaFit=o.screenMediaFit||'cover'; o.screenFlipX=o.screenFlipX??true; o.screenFlipY=o.screenFlipY??false; o.screenVideoAudio=o.screenVideoAudio??true; o.screenVideoVolume=o.screenVideoVolume??1; o.screenMediaAspect=o.screenMediaAspect||1; o.screenTextSource=o.screenTextSource||'custom'; o.screenText=o.screenText??'VSE'; o.screenTextMode=o.screenTextMode||'static'; o.screenTextFont=o.screenTextFont||'Arial'; o.screenTextSize=o.screenTextSize??48; o.screenTextColor=o.screenTextColor||'#ffffff'; o.screenTextSpeed=o.screenTextSpeed??80; o.screenTextBgMode=o.screenTextBgMode||'transparent'; o.screenTextBgColor=o.screenTextBgColor||'#000000'; o.screenTextBgOpacity=o.screenTextBgOpacity??1; o.screenTextBgFit=o.screenTextBgFit||'cover'; o.screenTextBgImageName=o.screenTextBgImageName||''; o.screenTextBgImageData=o.screenTextBgImageData||null; o.screenTextBgImageElement=o.screenTextBgImageElement||null; o.screenTextBgImageReady=!!o.screenTextBgImageElement; o.screenTextDirty=true; o.screenAmbilight=!!o.screenAmbilight; o.screenAmbilightStrength=o.screenAmbilightStrength??1; o.screenEngineX=o.screenEngineX??0; o.screenEngineY=o.screenEngineY??0; o.screenEngineW=o.screenEngineW??640; o.screenEngineH=o.screenEngineH??360; o._ambilightColor=o._ambilightColor||null; o._ambilightLastSample=o._ambilightLastSample||0; o.size=o.size||70;
    o.screenTextBold=o.screenTextBold!==false; o.screenTextItalic=!!o.screenTextItalic; o.screenTextUnderline=!!o.screenTextUnderline; o.screenTextAlign=o.screenTextAlign||'center'; o.screenTextLineHeight=Math.max(.8,Math.min(2.5,Number(o.screenTextLineHeight??1.2)));
  }
  if(type==='text'){
    o.screenAudioEnabled=false;
    o.screenWidth=o.screenWidth??520; o.screenHeight=o.screenHeight??180; o.screenMode='text'; o.screenFrameMode='hidden'; o.screenOpacity=o.screenOpacity??1; o.screenBrightness=o.screenBrightness??1; o.screenScanlines=0; o.screenAudio=0; o.screenFlipX=false; o.screenFlipY=false;
    o.screenTextSource=o.screenTextSource||'custom'; o.screenText=o.screenText??'Text'; o.screenTextMode=o.screenTextMode||'static'; o.screenTextFont=o.screenTextFont||'Arial'; o.screenTextSize=o.screenTextSize??48; o.screenTextColor=o.screenTextColor||'#ffffff'; o.screenTextBold=o.screenTextBold!==false; o.screenTextItalic=!!o.screenTextItalic; o.screenTextUnderline=!!o.screenTextUnderline; o.screenTextAlign=o.screenTextAlign||'center'; o.screenTextLineHeight=o.screenTextLineHeight??1.2;
    o.screenTextBgMode=o.screenTextBgMode||'transparent'; o.screenTextBgColor=o.screenTextBgColor||'#000000'; o.screenTextBgOpacity=o.screenTextBgOpacity??1; o.screenTextBgFit=o.screenTextBgFit||'cover'; o.screenTextDirty=true; o.size=o.size||70;
  }
  if(type==='visualizer'){
    o.color=o.color||'#39ff57'; o.visualizerMode=o.visualizerMode||'freqBars'; o.visualizerWidth=o.visualizerWidth??520; o.visualizerHeight=o.visualizerHeight??180; o.visualizerBars=o.visualizerBars??32; o.visualizerSensitivity=o.visualizerSensitivity??1; o.visualizerDecay=0; o.visualizerGap=o.visualizerGap??.25; o.visualizerOpacity=o.visualizerOpacity??.95; o.visualizerPeakHold=o.visualizerPeakHold??30; o.visualizerSegmentsEnabled=!!o.visualizerSegmentsEnabled; o.visualizerSegmentCount=o.visualizerSegmentCount??16; o.visualizerSegmentGap=o.visualizerSegmentGap??.18; o.visualizerBackgroundColor=o.visualizerBackgroundColor||'#030503'; o.visualizerLowColor=o.visualizerLowColor||'#1aff2e'; o.visualizerMidColor=o.visualizerMidColor||'#ffed29'; o.visualizerHighColor=o.visualizerHighColor||'#ff290f'; o.visualizerAverageColor=o.visualizerAverageColor||'#ffffff'; o.visualizerPeakColor=o.visualizerPeakColor||'#ff0a05'; o.visualizerFrameColor=o.visualizerFrameColor||'#61ff6b'; o.size=o.size||80; o.music=o.music??1;
  }
  if(type==='mandalaVisualizer'){
    o.color=o.color||'#ffffff'; o.size=o.size||110; o.music=o.music??.3;
    ensureMandalaDefaults(o);
  }
  if(type==='particle'){
    if(o.particleMode==='imageParticles')o.particleMode='free';
    const d=particlePresetDefaults(o.particleMode||'free');
    for(const [k,v] of Object.entries(d)){ if(o[k]===undefined || o[k]===null || k==='color') o[k]=v; }
    o.particleImageType=o.particleImageType||'none'; o.particleImageName=o.particleImageName||''; o.particleImageData=o.particleImageData||null; o.particleImageEmbedded=!!o.particleImageData; o.particleImageAspect=o.particleImageAspect||1; o.size=o.size||72; o.music=o.music??.25;
  }
  if(type==='audioSource'){
    o.color=o.color||'#8bd7ff'; o.size=o.size||58; o.audioSourceVolume=o.audioSourceVolume??1; o.audioSourceRange=o.audioSourceRange??35; o.audioSourceFalloff=o.audioSourceFalloff??1; o.audioSourceLoop=!!(o.audioSourceLoop??false); o.audioSourceAnalyze=!!(o.audioSourceAnalyze??false); o.audioSourceDirectional=!!(o.audioSourceDirectional??false); o.audioSourceDirection=o.audioSourceDirection??0; o.audioSourceZ=o.audioSourceZ??0; o.audioSourceType=o.audioSourceType||'none'; o.audioSourceName=o.audioSourceName||''; o.audioSourceUrl=o.audioSourceUrl||''; o.audioSourcePlaying=!!o.audioSourcePlaying; o.music=o.music??0;
  }
  if(type==='greenscreen'){
    o.color=o.color||'#ffffff'; o.size=o.size||120; o.greenscreenWidth=o.greenscreenWidth??480; o.greenscreenHeight=o.greenscreenHeight??270; o.greenscreenKeepAspect=o.greenscreenKeepAspect!==false; o.greenscreenSwapAspect=!!o.greenscreenSwapAspect; o.greenscreenKeyColor=o.greenscreenKeyColor||'#00ff00'; o.greenscreenTolerance=o.greenscreenTolerance??.32; o.greenscreenSoftness=o.greenscreenSoftness??.12; o.greenscreenEdgeTrim=o.greenscreenEdgeTrim??0; o.greenscreenSpillReduction=o.greenscreenSpillReduction??0; o.greenscreenEdgeDarken=o.greenscreenEdgeDarken??0; o.greenscreenOpacity=o.greenscreenOpacity??1; o.greenscreenAudioEnabled=!!(o.greenscreenAudioEnabled??false); o.greenscreenAudioVolume=o.greenscreenAudioVolume??1; o.greenscreenShadowEnabled=!!o.greenscreenShadowEnabled; o.greenscreenShadowWidth=o.greenscreenShadowWidth??280; o.greenscreenShadowHeight=o.greenscreenShadowHeight??80; o.greenscreenShadowOffsetX=o.greenscreenShadowOffsetX??0; o.greenscreenShadowOffsetY=o.greenscreenShadowOffsetY??130; o.greenscreenShadowSoftness=o.greenscreenShadowSoftness??.65; o.greenscreenShadowOpacity=o.greenscreenShadowOpacity??.45; o.greenscreenMediaType=o.greenscreenMediaType||'none'; o.greenscreenMediaName=o.greenscreenMediaName||''; o.greenscreenMediaAspect=o.greenscreenMediaAspect||16/9; o.music=o.music??0;
  }
  if(type==='waterSurface'||type==='waterFlowOverlay'){
    o.color=o.color||'#2fd6ff'; o.size=o.size||100; o.music=o.music??.3;
    ensureWaterDefaults(o);
    ensureMandalaDefaults(o);
  }
  if(type==='imageParticle'){
    o.particleMode='imageParticles';
    const d=particlePresetDefaults('imageParticles');
    for(const [k,v] of Object.entries(d)){ if(o[k]===undefined || o[k]===null || k==='color') o[k]=v; }
    o.particleImageType=o.particleImageType||'none'; o.particleImageName=o.particleImageName||''; o.particleImageData=o.particleImageData||null; o.particleImageEmbedded=!!o.particleImageData; o.particleImageAspect=o.particleImageAspect||1; o.size=o.size||140; o.music=o.music??.25; o.ipmDensity=o.ipmDensity??3; o.ipmParticleSize=o.ipmParticleSize??2.4; o.ipmScale=o.ipmScale??2; o.ipmOpacity=o.ipmOpacity??.9; o.ipmThreshold=o.ipmThreshold??145; o.ipmWave=o.ipmWave??12; o.ipmJitter=o.ipmJitter??4; o.ipmPixelMode=o.ipmPixelMode||'dark'; o.ipmMode=o.ipmMode||'none'; o.ipmReaction=o.ipmReaction??.4; o.ipmReturn=o.ipmReturn??.45; o.ipmEffectStrength=o.ipmEffectStrength??60; o.ipmEffectSpeed=o.ipmEffectSpeed??80; o.ipmAudioEffectSpeed=o.ipmAudioEffectSpeed??120; o.ipmAudioEffectStrength=o.ipmAudioEffectStrength??100; o.ipmAudioEffectPulse=o.ipmAudioEffectPulse??80; o.ipmAudioMovement=o.ipmAudioMovement??40; o.ipmAudioSize=o.ipmAudioSize??14; o.ipmAudioAlpha=o.ipmAudioAlpha??20; o.ipmUseImageColors=o.ipmUseImageColors??false; o.ipmMono=o.ipmMono??false; o.ipmInvert=o.ipmInvert??false; o.ipmFlipX=o.ipmFlipX??false; o.ipmFlipY=o.ipmFlipY??false;
  }
}

function getBulkEditTargets(){
  if(!selected)return [];
  const selectedArr=getSelectedObjects();
  if(selected.groupId){
    const groupArr=objects.filter(o=>o.groupId===selected.groupId);
    const wholeGroupSelected=groupArr.length>1 && groupArr.every(o=>selectedIds.has(o.id));
    if(wholeGroupSelected)return groupArr;
  }
  if(selectedArr.length>1)return selectedArr;
  return [selected];
}
function shadowGroupSyncAllows(prop){
  const map={shadowEnabled:'enabled',shadowOpacity:'opacity',shadowBlur:'blur',shadowColor:'color',shadowOffsetX:'offset',shadowOffsetY:'offset',shadowScaleX:'scale',shadowScaleY:'scale'};
  const key=map[prop];
  if(!key)return true;
  const el=groupSyncShadow&&groupSyncShadow[key];
  return !el||el.checked!==false;
}
function propagateSelectedProperty(prop, source){
  if(!source||!prop)return;
  const targets=getBulkEditTargets();
  if(targets.length<=1)return;
  const value=source[prop];
  for(const target of targets){
    if(!target||target===source)continue;
    if(prop&&prop.startsWith('shadow')&&!supportsShadow(target))continue;
    if(!shadowGroupSyncAllows(prop))continue;
    target[prop]=value;
    if(prop==='type')applyTypeDefaults(target,value);
    if(prop==='laser'&&value===true){target.angle=Math.min(Number(target.angle||6),6);}
    if(prop==='angle')target.audioAngleMax=Math.max(Number(target.audioAngleMax??360),Number(target.angle??1));
    if(prop==='audioAngleMax')target.audioAngleMax=Math.max(Number(target.angle??1),Math.min(360,Number(target.audioAngleMax??360)));
    if(prop==='color'&&target.type==='imageParticle')target.ipmUseImageColors=false;
    if(target.type==='screen'&&['screenAmbilight','screenAmbilightStrength','screenEngineX','screenEngineY','screenEngineW','screenEngineH'].includes(prop)){target._ambilightColor=null;target._ambilightLastSample=0;}
    if(target.type==='imageParticle')target._ipmKey='';
  }
}
function applyParticlePresetToBulk(mode, source){
  const targets=getBulkEditTargets().filter(o=>o&&o.type==='particle');
  for(const target of targets){
    const keepImage={particleImageType:target.particleImageType,particleImageName:target.particleImageName,particleImageData:target.particleImageData,particleImageEmbedded:target.particleImageEmbedded,particleImageAspect:target.particleImageAspect,particleTexture:target.particleTexture,particleImageElement:target.particleImageElement,particleImageUrl:target.particleImageUrl,particleEmitterShape:target.particleEmitterShape,particleEmitterLength:target.particleEmitterLength,particleEmitterTransparency:target.particleEmitterTransparency,particleEmissionDuration:target.particleEmissionDuration,particleUnlimited:target.particleUnlimited,particleEmissionMode:target.particleEmissionMode};
    Object.assign(target,particlePresetDefaults(mode),keepImage);
  }
}
function getBulkTypeTargets(type){return getBulkEditTargets().filter(o=>o&&o.type===type);}
if(screenLedSimulationInput)screenLedSimulationInput.addEventListener('input',()=>{
  if(!selected)return;
  selected.screenLedSimulation=screenLedSimulationInput.checked;
  if(fields.ScreenScanlines)fields.ScreenScanlines.disabled=!selected.screenLedSimulation;
  propagateSelectedProperty('screenLedSimulation',selected);
});
if(screenAudioEnabledInput)screenAudioEnabledInput.addEventListener('input',()=>{
  if(!selected||selected.type!=='screen')return;
  selected.screenAudioEnabled=screenAudioEnabledInput.checked;
  if(fields.ScreenAudio)fields.ScreenAudio.disabled=!selected.screenAudioEnabled;
  propagateSelectedProperty('screenAudioEnabled',selected);
});
if(screenDepthRotationInput)screenDepthRotationInput.addEventListener('input',()=>{
  if(!selected||selected.type!=='screen')return;
  selected.screenDepthRotation=Math.max(-75,Math.min(75,Number(screenDepthRotationInput.value)||0));
  if(screenDepthRotationValue)screenDepthRotationValue.textContent=Math.round(selected.screenDepthRotation)+'°';
  propagateSelectedProperty('screenDepthRotation',selected);
});
Object.entries(fields).forEach(([k,el])=>el&&el.addEventListener('input',()=>{
  if(!selected)return;
  if(k==='GreenscreenChromaKeyEnabled'){
    selected.greenscreenChromaKeyEnabled=el.checked;
    propagateSelectedProperty('greenscreenChromaKeyEnabled',selected);
    return;
  }
  const map={Name:'name',Type:'type',X:'x',Y:'y',Layer:'layer',Size:'size',Intensity:'intensity',Rotation:'rotation',WindAffected:'windAffected',WindInfluence:'windInfluence',PanSpeed:'panSpeed',PanAngle:'panAngle',Laser:'laser',Angle:'angle',AudioAngleMax:'audioAngleMax',Range:'range',Softness:'softness',Glow:'glow',Opacity:'opacity',Color:'color',AltColor:'altColor',AltSpeed:'altSpeed',AltAmount:'altAmount',LightColorMusicEnabled:'lightColorMusicEnabled',LightColorMusicFreq:'lightColorMusicFreq',LightColorMusicThreshold:'lightColorMusicThreshold',LightColorMusicBelow:'lightColorMusicBelow',LightColorMusicAmount:'lightColorMusicAmount',LightbarCount:'lightbarCount',LightbarLength:'lightbarLength',LightbarSpread:'lightbarSpread',MovingMode:'movingMode',MovingPan:'movingPan',MovingTilt:'movingTilt',MovingPanRange:'movingPanRange',MovingTiltRange:'movingTiltRange',MovingSpeed:'movingSpeed',MovingBeamAngle:'movingBeamAngle',MovingBeamRange:'movingBeamRange',MovingBodyVisible:'movingBodyVisible',MovingHeadGlow:'movingHeadGlow',MovingAudioMove:'movingAudioMove',FogPanSpeed:'fogPanSpeed',FogPanAngle:'fogPanAngle',FogAngle:'fogAngle',FogLife:'fogLife',FogDynamics:'fogDynamics',FogGravity:'fogGravity',FogSoftness:'fogSoftness',FogGlow:'fogGlow',FogEmitterOpacity:'fogEmitterOpacity',FogOpacity:'fogOpacity',FogAltColor:'fogAltColor',FogAltSpeed:'fogAltSpeed',FogAltAmount:'fogAltAmount',FogMotion:'fogMotion',FogTurbulence:'fogTurbulence',ScreenWidth:'screenWidth',ScreenHeight:'screenHeight',ScreenMode:'screenMode',ScreenTextSource:'screenTextSource',ScreenText:'screenText',ScreenTextMode:'screenTextMode',ScreenTextFont:'screenTextFont',ScreenTextSize:'screenTextSize',ScreenTextColor:'screenTextColor',ScreenTextSpeed:'screenTextSpeed',ScreenTextBgMode:'screenTextBgMode',ScreenTextBgColor:'screenTextBgColor',ScreenTextBgOpacity:'screenTextBgOpacity',ScreenTextBgFit:'screenTextBgFit',ScreenFrameMode:'screenFrameMode',ScreenBrightness:'screenBrightness',ScreenOpacity:'screenOpacity',ScreenScanlines:'screenScanlines',ScreenAudio:'screenAudio',ScreenAltColor:'screenAltColor',ScreenAltSpeed:'screenAltSpeed',ScreenAltAmount:'screenAltAmount',ScreenAmbilight:'screenAmbilight',ScreenAmbilightStrength:'screenAmbilightStrength',ScreenEngineX:'screenEngineX',ScreenEngineY:'screenEngineY',ScreenEngineW:'screenEngineW',ScreenEngineH:'screenEngineH',ParticleMode:'particleMode',ParticleEmitterShape:'particleEmitterShape',ParticleEmitterLength:'particleEmitterLength',ParticleEmitterTransparency:'particleEmitterTransparency',ParticleAmount:'particleAmount',ParticleSpeed:'particleSpeed',ParticleSpread:'particleSpread',ParticleLife:'particleLife',ParticleEmissionDuration:'particleEmissionDuration',ParticleUnlimited:'particleUnlimited',ParticleEmissionMode:'particleEmissionMode',ParticleGravity:'particleGravity',ParticleTurbulence:'particleTurbulence',ParticleSize:'particleSize',ParticleGlow:'particleGlow',ParticleOpacity:'particleOpacity',ParticleAltColor:'particleAltColor',ParticleAudio:'particleAudio',ParticleBlastEnergy:'particleBlastEnergy',ParticleShockwaveRadius:'particleShockwaveRadius',ParticleInitialVelocity:'particleInitialVelocity',ParticleVelocitySpread:'particleVelocitySpread',ParticleExplosionTurbulence:'particleExplosionTurbulence',ParticleUpdraft:'particleUpdraft',ParticleFireballDuration:'particleFireballDuration',ParticleSmokeAmount:'particleSmokeAmount',ParticleSmokeLifetime:'particleSmokeLifetime',ParticleDebrisAmount:'particleDebrisAmount',ParticleDebrisGravity:'particleDebrisGravity',ParticleShockwaveVisible:'particleShockwaveVisible',ParticleJetPressure:'particleJetPressure',ParticleJetVelocity:'particleJetVelocity',ParticleJetWidth:'particleJetWidth',ParticleJetLength:'particleJetLength',ParticleCoreStability:'particleCoreStability',ParticleEdgeTurbulence:'particleEdgeTurbulence',ParticleUpdraftStrength:'particleUpdraftStrength',ParticleTipTurbulence:'particleTipTurbulence',ParticleBrightness:'particleBrightness',ParticleGlowStrength:'particleGlowStrength',ParticleJetSmokeAmount:'particleJetSmokeAmount',IpmDensity:'ipmDensity',IpmParticleSize:'ipmParticleSize',IpmScale:'ipmScale',IpmOpacity:'ipmOpacity',IpmMode:'ipmMode',IpmReaction:'ipmReaction',IpmReturn:'ipmReturn',IpmThreshold:'ipmThreshold',IpmWave:'ipmWave',IpmJitter:'ipmJitter',IpmPixelMode:'ipmPixelMode',IpmEffectStrength:'ipmEffectStrength',IpmEffectSpeed:'ipmEffectSpeed',IpmAudioEffectSpeed:'ipmAudioEffectSpeed',IpmAudioEffectStrength:'ipmAudioEffectStrength',IpmAudioEffectPulse:'ipmAudioEffectPulse',IpmAudioMovement:'ipmAudioMovement',IpmAudioSize:'ipmAudioSize',IpmAudioAlpha:'ipmAudioAlpha',IpmUseImageColors:'ipmUseImageColors',IpmMono:'ipmMono',IpmInvert:'ipmInvert',IpmFlipX:'ipmFlipX',IpmFlipY:'ipmFlipY',IpmDestructionEnabled:'ipmDestructionEnabled',IpmDestructionMode:'ipmDestructionMode',IpmDestructionReverse:'ipmDestructionReverse',IpmDestructionAudioEnabled:'ipmDestructionAudioEnabled',IpmDestructionStrength:'ipmDestructionStrength',IpmDestructionDirX:'ipmDestructionDirX',IpmDestructionDirY:'ipmDestructionDirY',IpmDestructionSpread:'ipmDestructionSpread',IpmDestructionGravity:'ipmDestructionGravity',IpmDestructionDuration:'ipmDestructionDuration',IpmDestructionReturnEnabled:'ipmDestructionReturnEnabled',IpmDestructionReturnSpeed:'ipmDestructionReturnSpeed',IpmDestructionRandomness:'ipmDestructionRandomness',IpmDestructionClusterSize:'ipmDestructionClusterSize',IpmDestructionParticleFade:'ipmDestructionParticleFade',IpmDestructionFadeTime:'ipmDestructionFadeTime',IpmDestructionAudioThreshold:'ipmDestructionAudioThreshold',IpmDestructionRetrigger:'ipmDestructionRetrigger',VisualizerMode:'visualizerMode',VisualizerWidth:'visualizerWidth',VisualizerHeight:'visualizerHeight',VisualizerBars:'visualizerBars',VisualizerSensitivity:'visualizerSensitivity',VisualizerGap:'visualizerGap',VisualizerOpacity:'visualizerOpacity',VisualizerPeakHold:'visualizerPeakHold',MandalaObjWidth:'mandalaObjWidth',MandalaObjHeight:'mandalaObjHeight',MandalaObjKeepAspect:'mandalaObjKeepAspect',MandalaObjVisible:'mandalaObjVisible',MandalaObjLocked:'mandalaObjLocked',MandalaObjOpacity:'mandalaObjOpacity',MandalaObjSegments:'mandalaObjSegments',MandalaObjRotation:'mandalaObjRotation',MandalaObjCenterX:'mandalaObjCenterX',MandalaObjCenterY:'mandalaObjCenterY',MandalaObjZoom:'mandalaObjZoom',MandalaObjMix:'mandalaObjMix',MandalaObjAutoRotate:'mandalaObjAutoRotate',MandalaObjMusicRotation:'mandalaObjMusicRotation',MandalaObjMusicZoom:'mandalaObjMusicZoom',MandalaObjMusicMix:'mandalaObjMusicMix',ImageAssetWidth:'imageAssetWidth',ImageAssetHeight:'imageAssetHeight',ImageAssetKeepAspect:'imageAssetKeepAspect',ImageAssetOpacity:'imageAssetOpacity',ImageAssetIgnoreGlobalDimming:'imageAssetIgnoreGlobalDimming',ImageAssetPerspectiveEnabled:'imageAssetPerspectiveEnabled',ImageAssetPerspectiveStrength:'imageAssetPerspectiveStrength',ImageAssetPerspectiveMin:'imageAssetPerspectiveMin',ImageAssetAudioEnabled:'imageAssetAudioEnabled',ImageAssetAudioDirX:'imageAssetAudioDirX',ImageAssetAudioDirY:'imageAssetAudioDirY',ImageAssetAudioStrength:'imageAssetAudioStrength',ImageAssetAudioPhysicsImpulse:'imageAssetAudioPhysicsImpulse',ImageAssetAudioImpulseCooldown:'imageAssetAudioImpulseCooldown',ImageAssetPhysicsEnabled:'imageAssetPhysicsEnabled',ImageAssetMass:'imageAssetMass',ImageAssetGravity:'imageAssetGravity',ImageAssetFriction:'imageAssetFriction',ImageAssetBounce:'imageAssetBounce',ImageAssetAngularDamping:'imageAssetAngularDamping',ImageAssetLinearDamping:'imageAssetLinearDamping',ImageAssetCollisionEnabled:'imageAssetCollisionEnabled',ImageAssetReverseXOnSideCollision:'imageAssetReverseXOnSideCollision',ImageAssetColliderType:'imageAssetColliderType',ImageAssetImpulseX:'imageAssetImpulseX',ImageAssetImpulseY:'imageAssetImpulseY',ImageAssetImpulseStrength:'imageAssetImpulseStrength',ImageAssetImpulseRotation:'imageAssetImpulseRotation',AudioSourceVolume:'audioSourceVolume',AudioSourceRange:'audioSourceRange',AudioSourceFalloff:'audioSourceFalloff',AudioSourceIconOpacity:'audioSourceIconOpacity',AudioSourceLoop:'audioSourceLoop',AudioSourceAnalyze:'audioSourceAnalyze',AudioSourceDirectional:'audioSourceDirectional',AudioSourceDirection:'audioSourceDirection',GreenscreenWidth:'greenscreenWidth',GreenscreenHeight:'greenscreenHeight',GreenscreenKeepAspect:'greenscreenKeepAspect',GreenscreenSwapAspect:'greenscreenSwapAspect',GreenscreenKeyColor:'greenscreenKeyColor',GreenscreenTolerance:'greenscreenTolerance',GreenscreenSoftness:'greenscreenSoftness',GreenscreenEdgeTrim:'greenscreenEdgeTrim',GreenscreenSpillReduction:'greenscreenSpillReduction',GreenscreenEdgeDarken:'greenscreenEdgeDarken',GreenscreenOpacity:'greenscreenOpacity',GreenscreenAudioEnabled:'greenscreenAudioEnabled',GreenscreenAudioVolume:'greenscreenAudioVolume',GreenscreenShadowEnabled:'greenscreenShadowEnabled',GreenscreenShadowWidth:'greenscreenShadowWidth',GreenscreenShadowHeight:'greenscreenShadowHeight',GreenscreenShadowOffsetX:'greenscreenShadowOffsetX',GreenscreenShadowOffsetY:'greenscreenShadowOffsetY',GreenscreenShadowSoftness:'greenscreenShadowSoftness',GreenscreenShadowOpacity:'greenscreenShadowOpacity',ShadowEnabled:'shadowEnabled',ShadowMode:'shadowMode',ShadowOpacity:'shadowOpacity',ShadowBlur:'shadowBlur',ShadowOffsetX:'shadowOffsetX',ShadowOffsetY:'shadowOffsetY',ShadowScaleX:'shadowScaleX',ShadowScaleY:'shadowScaleY',ShadowRotation:'shadowRotation',ShadowColor:'shadowColor',WaterMode:'waterMode',WaterWidth:'waterWidth',WaterHeight:'waterHeight',WaterOpacity:'waterOpacity',WaterWaveHeight:'waterWaveHeight',WaterWaveScale:'waterWaveScale',WaterWaveSpeed:'waterWaveSpeed',WaterFlowDirection:'waterFlowDirection',WaterFlowSpeed:'waterFlowSpeed',WaterFlowScale:'waterFlowScale',WaterDistortionStrength:'waterDistortionStrength',WaterReflectionStrength:'waterReflectionStrength',WaterHighlightStrength:'waterHighlightStrength',WaterWaveNoise:'waterWaveNoise',WaterEdgeFade:'waterEdgeFade',WaterColorTint:'waterColorTint',WaterAudioReaction:'waterAudioReaction',WaterSparklesEnabled:'waterSparklesEnabled',WaterSparkleDensity:'waterSparkleDensity',WaterSparkleSize:'waterSparkleSize',WaterSparkleBrightness:'waterSparkleBrightness',WaterSparkleSpeed:'waterSparkleSpeed',WaterSparkleColor:'waterSparkleColor',WaterFoamEnabled:'waterFoamEnabled',WaterFoamAmount:'waterFoamAmount',WaterFoamSpeed:'waterFoamSpeed',WaterFoamScale:'waterFoamScale',WaterFoamOpacity:'waterFoamOpacity',Music:'music',ThresholdBelow:'thresholdBelow',Life:'life'};
  let v=(el.type==='checkbox')?el.checked:el.value;
  if(map[k]==='type'&&v==='laser')v='light';
  if(['x','y','layer','size','intensity','rotation','windInfluence','panSpeed','panAngle','angle','audioAngleMax','range','softness','glow','opacity','altSpeed','altAmount','lightColorMusicFreq','lightColorMusicThreshold','lightColorMusicAmount','lightbarCount','lightbarLength','lightbarSpread','movingPan','movingTilt','movingPanRange','movingTiltRange','movingSpeed','movingBeamAngle','movingBeamRange','movingHeadGlow','movingAudioMove','fogPanSpeed','fogPanAngle','fogAngle','fogLife','fogDynamics','fogGravity','fogSoftness','fogGlow','fogEmitterOpacity','fogOpacity','fogAltSpeed','fogAltAmount','fogMotion','fogTurbulence','screenWidth','screenHeight','screenTextSize','screenTextSpeed','screenTextBgOpacity','screenBrightness','screenOpacity','screenScanlines','screenAudio','screenAltSpeed','screenAltAmount','screenAmbilightStrength','screenEngineX','screenEngineY','screenEngineW','screenEngineH','particleEmitterLength','particleEmitterTransparency','particleAmount','particleSpeed','particleSpread','particleLife','particleEmissionDuration','particleGravity','particleTurbulence','particleSize','particleGlow','particleOpacity','particleAudio','particleBlastEnergy','particleShockwaveRadius','particleInitialVelocity','particleVelocitySpread','particleExplosionTurbulence','particleUpdraft','particleFireballDuration','particleSmokeAmount','particleSmokeLifetime','particleDebrisAmount','particleDebrisGravity','particleJetPressure','particleJetVelocity','particleJetWidth','particleJetLength','particleCoreStability','particleEdgeTurbulence','particleUpdraftStrength','particleTipTurbulence','particleBrightness','particleGlowStrength','particleJetSmokeAmount','ipmDensity','ipmParticleSize','ipmScale','ipmOpacity','ipmReaction','ipmReturn','ipmThreshold','ipmWave','ipmJitter','ipmEffectStrength','ipmEffectSpeed','ipmAudioEffectSpeed','ipmAudioEffectStrength','ipmAudioEffectPulse','ipmAudioMovement','ipmAudioSize','ipmAudioAlpha','ipmDestructionStrength','ipmDestructionDirX','ipmDestructionDirY','ipmDestructionSpread','ipmDestructionGravity','ipmDestructionDuration','ipmDestructionReturnSpeed','ipmDestructionRandomness','ipmDestructionClusterSize','ipmDestructionParticleFade','ipmDestructionFadeTime','ipmDestructionAudioThreshold','ipmDestructionRetrigger','visualizerWidth','visualizerHeight','visualizerBars','visualizerSensitivity','visualizerGap','visualizerOpacity','visualizerPeakHold','mandalaObjWidth','mandalaObjHeight','mandalaObjOpacity','mandalaObjSegments','mandalaObjRotation','mandalaObjCenterX','mandalaObjCenterY','mandalaObjZoom','mandalaObjMix','imageAssetWidth','imageAssetHeight','imageAssetOpacity','imageAssetPerspectiveStrength','imageAssetPerspectiveMin','imageAssetAudioDirX','imageAssetAudioDirY','imageAssetAudioStrength','imageAssetAudioImpulseCooldown','imageAssetMass','imageAssetGravity','imageAssetFriction','imageAssetBounce','imageAssetAngularDamping','imageAssetLinearDamping','imageAssetImpulseX','imageAssetImpulseY','imageAssetImpulseStrength','imageAssetImpulseRotation','audioSourceVolume','audioSourceRange','audioSourceFalloff','audioSourceIconOpacity','audioSourceDirection','greenscreenWidth','greenscreenHeight','greenscreenTolerance','greenscreenSoftness','greenscreenEdgeTrim','greenscreenSpillReduction','greenscreenEdgeDarken','greenscreenOpacity','greenscreenAudioVolume','greenscreenShadowWidth','greenscreenShadowHeight','greenscreenShadowOffsetX','greenscreenShadowOffsetY','greenscreenShadowSoftness','greenscreenShadowOpacity','waterWidth','waterHeight','waterOpacity','waterWaveHeight','waterWaveScale','waterWaveSpeed','waterFlowDirection','waterFlowSpeed','waterFlowScale','waterDistortionStrength','waterReflectionStrength','waterHighlightStrength','waterWaveNoise','waterEdgeFade','waterAudioReaction','waterSparkleDensity','waterSparkleSize','waterSparkleBrightness','waterSparkleSpeed','waterFoamAmount','waterFoamSpeed','waterFoamScale','waterFoamOpacity','music','life'].includes(map[k]))v=parseFloat(v);
  if(map[k]==='layer')v=Math.max(-99,Math.min(99,Math.round(Number.isFinite(Number(v))?Number(v):1))); // negative Layer für Backlight-Objekte zulassen
  if(map[k]==='screenWidth')v=Math.max(1,Math.min(Number(scene.stageWidth||stageState.w||1920),Number(v)||1));
  if(map[k]==='screenHeight')v=Math.max(1,Math.min(Number(scene.stageHeight||stageState.h||1080),Number(v)||1));
  const oldType=selected.type;
  selected[map[k]]=v;
  if(['mandalaObjKeepAspect','imageAssetKeepAspect','greenscreenKeepAspect'].includes(map[k])){
    selected.objectKeepAspect=v!==false;
    if(objectKeepAspectInput)objectKeepAspectInput.checked=selected.objectKeepAspect;
    if(selected.objectKeepAspect){delete selected.objectAspect;ensureObjectAspect(selected);}
  }
  applyObjectAspectLock(selected,map[k]);
  const lockedSpec=objectDimensionSpec(selected);
  if(lockedSpec&&selected.objectKeepAspect!==false&&[lockedSpec.w,lockedSpec.h].includes(map[k])){
    propagateSelectedProperty(map[k]===lockedSpec.w?lockedSpec.h:lockedSpec.w,selected);
  }
  if(selected.objectKeepAspect===undefined&&selected.type==='mandalaVisualizer' && selected.mandalaObjKeepAspect!==false && (map[k]==='mandalaObjWidth' || map[k]==='mandalaObjHeight')){
    const asp=Math.max(0.01,Number(selected.mandalaObjAspect||1));
    if(map[k]==='mandalaObjWidth')selected.mandalaObjHeight=Math.max(1,Number(selected.mandalaObjWidth||420)/asp);
    if(map[k]==='mandalaObjHeight')selected.mandalaObjWidth=Math.max(1,Number(selected.mandalaObjHeight||420)*asp);
    if(fields.MandalaObjWidth)fields.MandalaObjWidth.value=selected.mandalaObjWidth;
    if(fields.MandalaObjHeight)fields.MandalaObjHeight.value=selected.mandalaObjHeight;
  }
  if(selected.objectKeepAspect===undefined&&selected.type==='imageAsset' && selected.imageAssetKeepAspect!==false && (map[k]==='imageAssetWidth' || map[k]==='imageAssetHeight')){
    const asp=Math.max(0.01,Number(selected.imageAssetAspect||1));
    if(map[k]==='imageAssetWidth')selected.imageAssetHeight=Math.max(1,Number(selected.imageAssetWidth||240)/asp);
    if(map[k]==='imageAssetHeight')selected.imageAssetWidth=Math.max(1,Number(selected.imageAssetHeight||160)*asp);
    if(fields.ImageAssetWidth)fields.ImageAssetWidth.value=selected.imageAssetWidth;
    if(fields.ImageAssetHeight)fields.ImageAssetHeight.value=selected.imageAssetHeight;
  }
  if((selected.type==='screen'||selected.type==='text') && ['screenTextSource','screenText','screenTextMode','screenTextFont','screenTextSize','screenTextColor','screenTextSpeed','screenTextBgMode','screenTextBgColor','screenTextBgOpacity','screenTextBgFit'].includes(map[k])) selected.screenTextDirty=true;
  if(selected.type==='screen' && ['screenAmbilight','screenAmbilightStrength','screenEngineX','screenEngineY','screenEngineW','screenEngineH'].includes(map[k])){ selected._ambilightColor=null; selected._ambilightLastSample=0; }
  // IPM-Farbkorrektur: Bei händischer Farbwahl wird der monochrome IPM-Farbmodus aktiviert,
  // damit der Farbwähler sofort sichtbar wirkt und nicht von Bildfarben überdeckt wird.
  if(map[k]==='color' && selected.type==='imageParticle'){
    selected.ipmUseImageColors=false;
    if(fields.IpmUseImageColors)fields.IpmUseImageColors.checked=false;
  }
  if(map[k]==='laser'&&v===true){
    selected.angle=Math.min(Number(selected.angle||6),6);
    if(fields.Angle)fields.Angle.value=selected.angle;
  }
  if(map[k]==='angle'){
    selected.audioAngleMax=Math.max(Number(selected.audioAngleMax??360),Number(selected.angle??1));
    if(fields.AudioAngleMax)fields.AudioAngleMax.value=selected.audioAngleMax;
  }
  if(map[k]==='audioAngleMax'){
    selected.audioAngleMax=Math.max(Number(selected.angle??1),Math.min(360,Number(selected.audioAngleMax??360)));
    if(fields.AudioAngleMax)fields.AudioAngleMax.value=selected.audioAngleMax;
  }
  if(selected.type==='audioSource' && ['audioSourceVolume','audioSourceRange','audioSourceFalloff','audioSourceIconOpacity','audioSourceLoop','audioSourceAnalyze','audioSourceDirectional','audioSourceDirection'].includes(map[k])){
    if(selected.audioSourceElement)selected.audioSourceElement.loop=!!selected.audioSourceLoop;
    if(map[k]==='audioSourceAnalyze')rebuildAudioSourceRouting(selected);
  }
  if(selected.type==='greenscreen' && ['greenscreenAudioEnabled','greenscreenAudioVolume'].includes(map[k])){
    updateGreenscreenAudioRouting(selected);
  }
  if(map[k]==='type') applyTypeDefaults(selected,v);
  if(map[k]==='particleMode'){
    applyParticlePresetToBulk(v,selected);
    const keepImage={particleImageType:selected.particleImageType,particleImageName:selected.particleImageName,particleImageData:selected.particleImageData,particleImageEmbedded:selected.particleImageEmbedded,particleImageAspect:selected.particleImageAspect,particleTexture:selected.particleTexture,particleImageElement:selected.particleImageElement,particleImageUrl:selected.particleImageUrl,particleEmitterShape:selected.particleEmitterShape,particleEmitterLength:selected.particleEmitterLength,particleEmitterTransparency:selected.particleEmitterTransparency,particleEmissionDuration:selected.particleEmissionDuration,particleUnlimited:selected.particleUnlimited,particleEmissionMode:selected.particleEmissionMode};
    Object.assign(selected,particlePresetDefaults(v),keepImage);
    select(selected);
    return;
  }
  propagateSelectedProperty(map[k],selected);
  syncTypeUI();
}));
Object.entries(visualizerColorFields).forEach(([name,input])=>{
  if(!input)return;
  input.addEventListener('input',()=>{
    if(!selected||selected.type!=='visualizer')return;
    const property='visualizer'+name;
    selected[property]=input.value;
    propagateSelectedProperty(property,selected);
  });
});
Object.entries(visualizerSegmentFields).forEach(([name,input])=>{
  if(!input)return;
  input.addEventListener('input',()=>{
    if(!selected||selected.type!=='visualizer')return;
    const property=name==='Enabled'?'visualizerSegmentsEnabled':name==='Count'?'visualizerSegmentCount':'visualizerSegmentGap';
    const value=name==='Enabled'?input.checked:name==='Count'?Math.round(Number(input.value)):Number(input.value);
    selected[property]=value;
    propagateSelectedProperty(property,selected);
    const valueLabel=document.getElementById(name==='Count'?'visualizerSegmentCountValue':name==='Gap'?'visualizerSegmentGapValue':'');
    if(valueLabel)valueLabel.textContent=name==='Gap'?value.toFixed(2):String(value);
  });
});
if(objectKeepAspectInput)objectKeepAspectInput.addEventListener('change',()=>{
  if(!selected)return;
  const enabled=objectKeepAspectInput.checked;
  const targets=getBulkEditTargets().length?getBulkEditTargets():[selected];
  targets.forEach(o=>{
    o.objectKeepAspect=enabled;
    o.mandalaObjKeepAspect=enabled;
    o.imageAssetKeepAspect=enabled;
    o.greenscreenKeepAspect=enabled;
    if(enabled){delete o.objectAspect;ensureObjectAspect(o);}
  });
  if(fields.MandalaObjKeepAspect)fields.MandalaObjKeepAspect.checked=enabled;
  if(fields.ImageAssetKeepAspect)fields.ImageAssetKeepAspect.checked=enabled;
  if(fields.GreenscreenKeepAspect)fields.GreenscreenKeepAspect.checked=enabled;
  if(screenKeepAspectInput)screenKeepAspectInput.checked=enabled;
  if(lightEmitterKeepAspectInput)lightEmitterKeepAspectInput.checked=enabled;
});
if(screenKeepAspectInput)screenKeepAspectInput.addEventListener('change',()=>{
  if(!selected||!['screen','text'].includes(selected.type))return;
  const enabled=screenKeepAspectInput.checked;
  getBulkTypeTargets(selected.type).forEach(o=>{
    o.objectKeepAspect=enabled;
    if(enabled){delete o.objectAspect;ensureObjectAspect(o);}
  });
  if(objectKeepAspectInput)objectKeepAspectInput.checked=enabled;
});
function setScreenRichTextProperty(key,value){
  if(!selected||!['screen','text'].includes(selected.type))return;
  getBulkTypeTargets(selected.type).forEach(o=>{o[key]=value;o.screenTextDirty=true;});
}
if(screenTextBoldInput)screenTextBoldInput.addEventListener('change',()=>setScreenRichTextProperty('screenTextBold',screenTextBoldInput.checked));
if(screenTextItalicInput)screenTextItalicInput.addEventListener('change',()=>setScreenRichTextProperty('screenTextItalic',screenTextItalicInput.checked));
if(screenTextUnderlineInput)screenTextUnderlineInput.addEventListener('change',()=>setScreenRichTextProperty('screenTextUnderline',screenTextUnderlineInput.checked));
if(screenTextAlignInput)screenTextAlignInput.addEventListener('change',()=>setScreenRichTextProperty('screenTextAlign',screenTextAlignInput.value));
if(screenTextLineHeightInput)screenTextLineHeightInput.addEventListener('input',()=>{
  const value=Math.max(.8,Math.min(2.5,Number(screenTextLineHeightInput.value)||1.2));
  setScreenRichTextProperty('screenTextLineHeight',value);
  if(typeof screenTextLineHeightValue!=='undefined')screenTextLineHeightValue.textContent=value.toFixed(2);
});
if(lightEmitterKeepAspectInput)lightEmitterKeepAspectInput.addEventListener('change',()=>{
  if(!selected||selected.type!=='light')return;
  const enabled=lightEmitterKeepAspectInput.checked;
  getBulkTypeTargets('light').forEach(o=>{
    o.objectKeepAspect=enabled;
    if(enabled){delete o.objectAspect;ensureObjectAspect(o);}
  });
  if(objectKeepAspectInput)objectKeepAspectInput.checked=enabled;
});
if(fogStartWidthInput)fogStartWidthInput.addEventListener('input',()=>{
  if(!selected||selected.type!=='fog')return;
  const value=Math.max(0,Number(fogStartWidthInput.value)||0);
  getBulkTypeTargets('fog').forEach(o=>o.fogStartWidth=value);
  if(typeof fogStartWidthValue!=='undefined')fogStartWidthValue.textContent=Math.round(value);
});
if(lightEmitterShapeInput)lightEmitterShapeInput.addEventListener('input',()=>{
  if(!selected||selected.type!=='light')return;
  const shape=['line','rectangle'].includes(lightEmitterShapeInput.value)?lightEmitterShapeInput.value:'point';
  getBulkTypeTargets('light').forEach(o=>{o.lightEmitterShape=shape;delete o.objectAspect;ensureObjectAspect(o);});
  syncTypeUI();
});
if(lightRectangleEmissionInput)lightRectangleEmissionInput.addEventListener('change',()=>{
  if(!selected||selected.type!=='light')return;
  const mode=['inward','solid'].includes(lightRectangleEmissionInput.value)?lightRectangleEmissionInput.value:'outward';
  getBulkTypeTargets('light').forEach(o=>o.lightRectangleEmission=mode);
});
if(lightEmitterLengthInput)lightEmitterLengthInput.addEventListener('input',()=>{
  if(!selected||selected.type!=='light')return;
  const value=Math.max(20,Number(lightEmitterLengthInput.value)||240);
  getBulkTypeTargets('light').forEach(o=>o.lightEmitterLength=value);
  if(typeof lightEmitterLengthValue!=='undefined')lightEmitterLengthValue.textContent=Math.round(value);
});
if(lightEmitterWidthInput)lightEmitterWidthInput.addEventListener('input',()=>{
  if(!selected||selected.type!=='light')return;
  const value=Math.max(20,Number(lightEmitterWidthInput.value)||480);
  getBulkTypeTargets('light').forEach(o=>{o.lightEmitterWidth=value;applyObjectAspectLock(o,'lightEmitterWidth');});
  if(selected){lightEmitterHeightInput.value=selected.lightEmitterHeight??270;if(typeof lightEmitterHeightValue!=='undefined')lightEmitterHeightValue.textContent=Math.round(selected.lightEmitterHeight??270);}
  if(typeof lightEmitterWidthValue!=='undefined')lightEmitterWidthValue.textContent=Math.round(value);
});
if(lightEmitterHeightInput)lightEmitterHeightInput.addEventListener('input',()=>{
  if(!selected||selected.type!=='light')return;
  const value=Math.max(20,Number(lightEmitterHeightInput.value)||270);
  getBulkTypeTargets('light').forEach(o=>{o.lightEmitterHeight=value;applyObjectAspectLock(o,'lightEmitterHeight');});
  if(selected){lightEmitterWidthInput.value=selected.lightEmitterWidth??480;if(typeof lightEmitterWidthValue!=='undefined')lightEmitterWidthValue.textContent=Math.round(selected.lightEmitterWidth??480);}
  if(typeof lightEmitterHeightValue!=='undefined')lightEmitterHeightValue.textContent=Math.round(value);
});
if(screenImageFile)screenImageFile.addEventListener('change',()=>{if(selected&&selected.type==='screen'&&screenImageFile.files[0])loadScreenMedia(selected,screenImageFile.files[0],'image');screenImageFile.value='';});
if(screenVideoFile)screenVideoFile.addEventListener('change',()=>{if(selected&&selected.type==='screen'&&screenVideoFile.files[0])loadScreenMedia(selected,screenVideoFile.files[0],'video');screenVideoFile.value='';});
if(screenMediaFolder)screenMediaFolder.addEventListener('change',()=>{if(selected&&selected.type==='screen'&&screenMediaFolder.files&&screenMediaFolder.files.length)loadScreenMediaFolder(selected,screenMediaFolder.files);screenMediaFolder.value='';});
if(screenPlaylistHold)screenPlaylistHold.addEventListener('input',()=>{if(!selected||selected.type!=='screen')return;getBulkTypeTargets('screen').forEach(o=>o.screenPlaylistHold=Number(screenPlaylistHold.value));syncTypeUI();});
if(screenPlaylistAuto)screenPlaylistAuto.addEventListener('change',()=>{if(!selected||selected.type!=='screen')return;getBulkTypeTargets('screen').forEach(o=>o.screenPlaylistAuto=screenPlaylistAuto.checked);syncTypeUI();});
if(screenPlaylistNextBtn)screenPlaylistNextBtn.addEventListener('click',()=>{if(selected&&selected.type==='screen')screenPlaylistNext(selected);});
if(screenCaptureBtn)screenCaptureBtn.addEventListener('click',()=>{if(selected&&selected.type==='screen')startScreenCaptureForScreen(selected);});
if(screenMediaFit)screenMediaFit.addEventListener('input',()=>{if(!selected||selected.type!=='screen')return;getBulkTypeTargets('screen').forEach(o=>o.screenMediaFit=screenMediaFit.value);syncTypeUI();});
if(screenFlipX)screenFlipX.addEventListener('change',()=>{if(!selected||selected.type!=='screen')return;getBulkTypeTargets('screen').forEach(o=>o.screenFlipX=screenFlipX.checked);syncTypeUI();});
if(screenFlipY)screenFlipY.addEventListener('change',()=>{if(!selected||selected.type!=='screen')return;getBulkTypeTargets('screen').forEach(o=>o.screenFlipY=screenFlipY.checked);syncTypeUI();});
if(screenVideoAudio)screenVideoAudio.addEventListener('change',()=>{if(!selected||selected.type!=='screen')return;getBulkTypeTargets('screen').forEach(o=>{o.screenVideoAudio=screenVideoAudio.checked;if(o.screenMediaType==='video'&&o.screenMediaElement){o.screenMediaElement.muted=!o.screenVideoAudio;o.screenMediaElement.volume=Number(o.screenVideoVolume??1);o.screenMediaElement.play().catch(()=>{});}});syncTypeUI();});
if(screenVideoVolume)screenVideoVolume.addEventListener('input',()=>{if(!selected||selected.type!=='screen')return;const vol=parseFloat(screenVideoVolume.value);getBulkTypeTargets('screen').forEach(o=>{o.screenVideoVolume=vol;if(o.screenMediaType==='video'&&o.screenMediaElement){o.screenMediaElement.volume=Number(o.screenVideoVolume??1);}});syncTypeUI();});
if(clearScreenMediaBtn)clearScreenMediaBtn.onclick=()=>{if(!selected||selected.type!=='screen')return;releaseScreenMedia(selected);selected.screenMode='solid';fields.ScreenMode.value='solid';select(selected);};
if(screenTextBgImageFile)screenTextBgImageFile.addEventListener('change',()=>{if(selected&&['screen','text'].includes(selected.type)&&screenTextBgImageFile.files[0])loadScreenTextBackgroundImage(selected,screenTextBgImageFile.files[0]);screenTextBgImageFile.value='';});
if(clearScreenTextBgImageBtn)clearScreenTextBgImageBtn.onclick=()=>{if(!selected||!['screen','text'].includes(selected.type))return;clearScreenTextBackgroundImage(selected);select(selected);};

if(greenscreenVideoFile)greenscreenVideoFile.addEventListener('change',()=>{if(selected&&selected.type==='greenscreen'&&greenscreenVideoFile.files[0])loadGreenscreenVideo(selected,greenscreenVideoFile.files[0]);greenscreenVideoFile.value='';});
if(fields.GreenscreenAudioEnabled)fields.GreenscreenAudioEnabled.addEventListener('change',()=>{if(selected&&selected.type==='greenscreen')updateGreenscreenAudioRouting(selected);});
if(fields.GreenscreenAudioVolume)fields.GreenscreenAudioVolume.addEventListener('input',()=>{if(selected&&selected.type==='greenscreen')updateGreenscreenAudioRouting(selected);});
if(greenscreenWebcamBtn)greenscreenWebcamBtn.addEventListener('click',()=>{if(selected&&selected.type==='greenscreen')startGreenscreenWebcam(selected);});
if(greenscreenWebcamDevice)greenscreenWebcamDevice.addEventListener('change',()=>{
  if(!selected||selected.type!=='greenscreen')return;
  selected.greenscreenDeviceId=greenscreenWebcamDevice.value;
  if(selected.greenscreenMediaType==='webcam')startGreenscreenWebcam(selected);
});
if(greenscreenStopBtn)greenscreenStopBtn.addEventListener('click',()=>{if(selected&&selected.type==='greenscreen'){releaseGreenscreenMedia(selected);select(selected);}});

if(imageAssetFile)imageAssetFile.addEventListener('change',()=>{if(selected&&selected.type==='imageAsset'&&imageAssetFile.files[0])loadImageAssetFile(selected,imageAssetFile.files[0]);imageAssetFile.value='';});
if(imageAssetExportPngBtn)imageAssetExportPngBtn.addEventListener('click',()=>{if(selected&&selected.type==='imageAsset')exportImageAssetPng(selected);});
if(imageAssetClearBtn)imageAssetClearBtn.addEventListener('click',()=>{if(selected&&selected.type==='imageAsset'){releaseImageAsset(selected);select(selected);}});
if(imageAssetImpulseBtn)imageAssetImpulseBtn.addEventListener('click',()=>{if(selected&&selected.type==='imageAsset'){applyImageAssetImpulse(selected,selected.imageAssetImpulseX??1,selected.imageAssetImpulseY??-.25,selected.imageAssetImpulseStrength??6,selected.imageAssetImpulseRotation??0);selectSingleCore(selected);}});
if(audioSourceFile)audioSourceFile.addEventListener('change',()=>{if(selected&&selected.type==='audioSource'&&audioSourceFile.files[0])loadAudioSourceFile(selected,audioSourceFile.files[0]);audioSourceFile.value='';});
if(audioSourceLoadUrlBtn)audioSourceLoadUrlBtn.addEventListener('click',()=>{if(selected&&selected.type==='audioSource'&&audioSourceUrl)loadAudioSourceUrl(selected,audioSourceUrl.value.trim());});
if(audioSourcePlayBtn)audioSourcePlayBtn.addEventListener('click',()=>{if(selected&&selected.type==='audioSource')playAudioSource(selected);});
if(audioSourcePauseBtn)audioSourcePauseBtn.addEventListener('click',()=>{if(selected&&selected.type==='audioSource')pauseAudioSource(selected);});


if(particleImageFile)particleImageFile.addEventListener('change',()=>{
  if(selected&&(selected.type==='particle'||selected.type==='imageParticle')&&particleImageFile.files[0]){
    loadParticleImage(selected,particleImageFile.files[0]);
  }
  particleImageFile.value='';
});
if(clearParticleImageBtn)clearParticleImageBtn.onclick=()=>{
  if(!selected||(selected.type!=='particle'&&selected.type!=='imageParticle'))return;
  releaseParticleImage(selected);
  select(selected);
};
function ipmDestructionModeId(mode){
  return ({none:0,crumble:1,shatter:2,dust:3,explosion:4,dissolve:5})[mode||'none']??0;
}
function ipmDestructionOptionsFromObject(o,options={}){
  return {
    mode:options.mode||o.ipmDestructionMode||'crumble',
    reverse:options.reverse??options.build??o.ipmDestructionReverse??false,
    strength:Number(options.strength??o.ipmDestructionStrength??90),
    directionX:Number(options.directionX??o.ipmDestructionDirX??0),
    directionY:Number(options.directionY??o.ipmDestructionDirY??-1),
    spread:Number(options.spread??o.ipmDestructionSpread??.8),
    gravity:Number(options.gravity??o.ipmDestructionGravity??.75),
    duration:Number(options.duration??o.ipmDestructionDuration??3),
    returnEnabled:options.returnEnabled??(o.ipmDestructionReturnEnabled!==false),
    returnSpeed:Number(options.returnSpeed??o.ipmDestructionReturnSpeed??1.2),
    randomness:Number(options.randomness??o.ipmDestructionRandomness??.7),
    clusterSize:Number(options.clusterSize??o.ipmDestructionClusterSize??12),
    particleFade:Number(options.particleFade??o.ipmDestructionParticleFade??.35),
    fadeTime:Number(options.fadeTime??o.ipmDestructionFadeTime??1.2),
    centerX:Number(options.centerX??0),
    centerY:Number(options.centerY??0)
  };
}
function triggerIpmDestruction(objectId,options={}){
  const o=objects.find(x=>x&&x.id===objectId);
  if(!o||o.type!=='imageParticle')return false;
  const cfg=ipmDestructionOptionsFromObject(o,options);
  if((cfg.mode||'none')==='none')return false;
  o._ipmDestruction={...cfg,start:performance.now()/1000,seed:Math.random()*10000};
  return true;
}
window.triggerIpmDestruction=triggerIpmDestruction;
globalThis.triggerIpmDestruction=triggerIpmDestruction;
if(ipmDestructionTestBtn)ipmDestructionTestBtn.addEventListener('click',()=>{
  if(selected&&selected.type==='imageParticle')triggerIpmDestruction(selected.id,{});
});



if(stagePreset)stagePreset.addEventListener('change',()=>{
  if(stagePreset.value==='custom')return;
  const [w,h]=stagePreset.value.split('x').map(Number);
  setStageResolution(w,h);
});
if(stageWidthInput)stageWidthInput.addEventListener('change',()=>setStageResolution(stageWidthInput.value,stageHeightInput.value));
if(stageHeightInput)stageHeightInput.addEventListener('change',()=>setStageResolution(stageWidthInput.value,stageHeightInput.value));
function applyBackgroundSizeToStage(img){
  if(!scene.backgroundSetsStageSize||!img)return false;
  const w=Math.round(Number(img.naturalWidth||img.width)||0),h=Math.round(Number(img.naturalHeight||img.height)||0);
  if(w<1||h<1)return false;
  setStageResolution(w,h);
  return true;
}
if(backgroundSetsStageSize)backgroundSetsStageSize.addEventListener('change',()=>{
  scene.backgroundSetsStageSize=backgroundSetsStageSize.checked;
  if(scene.backgroundSetsStageSize&&bgImageSize&&bgImageSize[0]&&bgImageSize[1])applyBackgroundSizeToStage({width:bgImageSize[0],height:bgImageSize[1]});
});
if(setScreenResBtn)setScreenResBtn.addEventListener('click',()=>{
  const w=Math.round((window.screen&&window.screen.width?window.screen.width:window.innerWidth)*(window.devicePixelRatio||1));
  const h=Math.round((window.screen&&window.screen.height?window.screen.height:window.innerHeight)*(window.devicePixelRatio||1));
  setStageResolution(w,h);
});
setStageResolution(1920,1080);
showGrid.addEventListener('change',()=>scene.showGrid=showGrid.checked);
function syncGridSpacingUi(value=scene.gridSpacing){
  scene.gridSpacing=Math.max(10,Math.min(500,Math.round(Number(value)||100)));
  if(gridSpacingInput)gridSpacingInput.value=String(scene.gridSpacing);
  if(gridSpacingNumber)gridSpacingNumber.value=String(scene.gridSpacing);
  if(gridSpacingValue)gridSpacingValue.textContent=scene.gridSpacing+' px';
}
if(gridSpacingInput)gridSpacingInput.addEventListener('input',()=>syncGridSpacingUi(gridSpacingInput.value));
if(gridSpacingNumber)gridSpacingNumber.addEventListener('input',()=>syncGridSpacingUi(gridSpacingNumber.value));
syncGridSpacingUi();
function syncGridColorUi(value=scene.gridColor){
  const color=String(value||'').trim();
  scene.gridColor=/^#[0-9a-f]{6}$/i.test(color)?color.toLowerCase():'#526e99';
  if(gridColorInput)gridColorInput.value=scene.gridColor;
}
if(gridColorInput)gridColorInput.addEventListener('input',()=>syncGridColorUi(gridColorInput.value));
syncGridColorUi();
screenDim.addEventListener('input',()=>{scene.screenDim=parseFloat(screenDim.value);screenDimValue.textContent=scene.screenDim.toFixed(2);});
screenBrighten.addEventListener('input',()=>{scene.screenBrighten=parseFloat(screenBrighten.value);screenBrightenValue.textContent=scene.screenBrighten.toFixed(2);});
if(dimTargetBackground)dimTargetBackground.addEventListener('change',()=>scene.dimTargetBackground=dimTargetBackground.checked);
if(dimTargetImageAssets)dimTargetImageAssets.addEventListener('change',()=>scene.dimTargetImageAssets=dimTargetImageAssets.checked);
if(dimTargetScreens)dimTargetScreens.addEventListener('change',()=>scene.dimTargetScreens=dimTargetScreens.checked);
if(dimTargetGreenscreen)dimTargetGreenscreen.addEventListener('change',()=>scene.dimTargetGreenscreen=dimTargetGreenscreen.checked);
if(backlightPass)backlightPass.addEventListener('input',()=>{
  scene.backlightPass=Math.max(0,Math.min(1,parseFloat(backlightPass.value)||0));
  if(backlightPassValue)backlightPassValue.textContent=scene.backlightPass.toFixed(2);
});

if(typeof initWindUi==='function')initWindUi();
function syncMandalaUi(){
  if(mandalaEnabled)mandalaEnabled.checked=!!scene.mandalaEnabled;
  if(mandalaSegments)mandalaSegments.value=String(scene.mandalaSegments||6);
  if(mandalaRotation){mandalaRotation.value=Number(scene.mandalaRotation||0);if(mandalaRotationValue)mandalaRotationValue.textContent=String(Math.round(Number(scene.mandalaRotation||0)));}
  if(mandalaCenterX){mandalaCenterX.value=Number(scene.mandalaCenterX??.5);if(mandalaCenterXValue)mandalaCenterXValue.textContent=Number(scene.mandalaCenterX??.5).toFixed(2);}
  if(mandalaCenterY){mandalaCenterY.value=Number(scene.mandalaCenterY??.5);if(mandalaCenterYValue)mandalaCenterYValue.textContent=Number(scene.mandalaCenterY??.5).toFixed(2);}
  if(mandalaZoom){mandalaZoom.value=Number(scene.mandalaZoom??1);if(mandalaZoomValue)mandalaZoomValue.textContent=Number(scene.mandalaZoom??1).toFixed(2);}
  if(mandalaMix){mandalaMix.value=Number(scene.mandalaMix??1);if(mandalaMixValue)mandalaMixValue.textContent=Number(scene.mandalaMix??1).toFixed(2);}
  if(mandalaAutoRotate)mandalaAutoRotate.checked=!!scene.mandalaAutoRotate;
  if(mandalaMusicRotation)mandalaMusicRotation.checked=!!scene.mandalaMusicRotation;
  if(mandalaMusicZoom)mandalaMusicZoom.checked=!!scene.mandalaMusicZoom;
  if(mandalaMusicMix)mandalaMusicMix.checked=!!scene.mandalaMusicMix;
}
function bindMandalaInput(el,key,kind='number'){
  if(!el)return;
  el.addEventListener(kind==='checkbox'?'change':'input',()=>{
    scene[key]=kind==='checkbox'?!!el.checked:(kind==='int'?parseInt(el.value,10):parseFloat(el.value));
    syncMandalaUi();
  });
}
bindMandalaInput(mandalaEnabled,'mandalaEnabled','checkbox');
bindMandalaInput(mandalaSegments,'mandalaSegments','int');
bindMandalaInput(mandalaRotation,'mandalaRotation');
bindMandalaInput(mandalaCenterX,'mandalaCenterX');
bindMandalaInput(mandalaCenterY,'mandalaCenterY');
bindMandalaInput(mandalaZoom,'mandalaZoom');
bindMandalaInput(mandalaMix,'mandalaMix');
bindMandalaInput(mandalaAutoRotate,'mandalaAutoRotate','checkbox');
bindMandalaInput(mandalaMusicRotation,'mandalaMusicRotation','checkbox');
bindMandalaInput(mandalaMusicZoom,'mandalaMusicZoom','checkbox');
bindMandalaInput(mandalaMusicMix,'mandalaMusicMix','checkbox');
bgColor.addEventListener('input',()=>background.color=bgColor.value);
bgMode.addEventListener('input',()=>background.mode=bgMode.value);
bgOpacity.addEventListener('input',()=>{background.opacity=parseFloat(bgOpacity.value);bgOpacityValue.textContent=background.opacity.toFixed(2);});
bgZoom.addEventListener('input',()=>{background.zoom=parseFloat(bgZoom.value);bgZoomValue.textContent=background.zoom.toFixed(2);});
bgFile.addEventListener('change',()=>{const f=bgFile.files&&bgFile.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{background.imageName=f.name;background.imageData=r.result;bgImageData=r.result;makeBgTexture(img);applyBackgroundSizeToStage(img);};img.src=r.result;};r.readAsDataURL(f);});
clearBgBtn.onclick=()=>{background.imageName=null;background.imageData=null;bgImageData=null;if(bgTex){gl.deleteTexture(bgTex);bgTex=null;}bgImageSize=[0,0];bgFile.value='';};
function bgCaptureShapeLabel(){const s=getBgCaptureShape();return s==='circle'?'Kreis / Ellipse':s==='path'?'Freier Pfad':'Rechteck';}
if(bgCaptureShape)bgCaptureShape.addEventListener('change',()=>{if(bgToImageAssetStatus)bgToImageAssetStatus.textContent='Ausschnittform: '+bgCaptureShapeLabel()+'.';});
if(bgCaptureSource)bgCaptureSource.addEventListener('change',()=>{if(bgToImageAssetStatus)bgToImageAssetStatus.textContent=getBgCaptureSource()==='stage'?'Ausschnittquelle: Bühne mit Objekten.':'Ausschnittquelle: Nur Hintergrund.';});
function toggleBgCaptureMode(){
  bgCaptureMode=!bgCaptureMode;
  bgCaptureDrag=null;
  const capturePanel=document.getElementById('bgCaptureParams');
  if(capturePanel)capturePanel.style.display=bgCaptureMode?'block':'none';
  if(bgCaptureMode){
    document.body.classList.remove('rightPanelCollapsed');
    const panelToggle=document.getElementById('rightPanelToggle');
    if(panelToggle)panelToggle.setAttribute('aria-expanded','true');
    if(empty)empty.style.display='none';
    if(params)params.style.display='none';
    if(timelineParams)timelineParams.style.display='none';
    if(capturePanel)requestAnimationFrame(()=>capturePanel.scrollIntoView({block:'nearest'}));
  }else if(timelineState&&timelineState.selected){
    selectTimeline();
  }else{
    selectSingleCore(selected||null);
  }
  if(bgToImageAssetStatus){
    const mode=getBgCaptureRemoveFromBackground()?'Ausschneiden mit transparentem Loch':'Kopieren ohne Hintergrundänderung';
    const source=getBgCaptureSource()==='stage'?'Bühne mit Objekten':'Nur Hintergrund';
    bgToImageAssetStatus.textContent=bgCaptureMode?('Capture aktiv: '+bgCaptureShapeLabel()+' markieren. '+source+'. '+mode+'.'):'Capture deaktiviert.';
  }
  setBgCaptureButtonState(bgCaptureMode);
  if(selectionBox)selectionBox.style.display='none';
}
if(bgCaptureRemoveFromBackground)bgCaptureRemoveFromBackground.addEventListener('change',()=>{if(bgToImageAssetStatus)bgToImageAssetStatus.textContent=getBgCaptureRemoveFromBackground()?'Ausschnitt wird als Asset erstellt und im Hintergrund transparent gemacht.':'Ausschnitt wird als Asset kopiert, Hintergrund bleibt unverändert.';});
if(bgToImageAssetBtn)bgToImageAssetBtn.addEventListener('click',toggleBgCaptureMode);
if(bgCaptureCreateAssetBtn)bgCaptureCreateAssetBtn.addEventListener('click',toggleBgCaptureMode);
if(waterShapeInput)waterShapeInput.addEventListener('change',()=>{
  const shape=waterShapeInput.value||'rect';
  if(waterDrawMode&&waterDrawMode.draft){waterDrawMode.draft.waterShape=shape;selected=waterDrawMode.draft;updateHud();return;}
  if(selected&&isWaterObject(selected)){selected.waterShape=shape;delete selected.waterMaskTexture;delete selected._waterMaskKey;updateHud();}
});
