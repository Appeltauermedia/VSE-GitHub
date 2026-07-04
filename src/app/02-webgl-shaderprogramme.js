/* ===== WebGL-Shaderprogramme ===== */
const beamProg=program(VSE_BEAM_VERTEX_SHADER,VSE_BEAM_FRAGMENT_SHADER);
const beamLoc={pos:gl.getAttribLocation(beamProg,'aPos'),pixelRes:gl.getUniformLocation(beamProg,'uPixelRes'),cssRes:gl.getUniformLocation(beamProg,'uCssRes'),originCss:gl.getUniformLocation(beamProg,'uOriginCss'),rot:gl.getUniformLocation(beamProg,'uRot'),range:gl.getUniformLocation(beamProg,'uRange'),angle:gl.getUniformLocation(beamProg,'uAngle'),emitterShape:gl.getUniformLocation(beamProg,'uEmitterShape'),rectangleMode:gl.getUniformLocation(beamProg,'uRectangleMode'),emitterLength:gl.getUniformLocation(beamProg,'uEmitterLength'),emitterSize:gl.getUniformLocation(beamProg,'uEmitterSize'),soft:gl.getUniformLocation(beamProg,'uSoft'),intensity:gl.getUniformLocation(beamProg,'uIntensity'),color:gl.getUniformLocation(beamProg,'uColor')};
const quad=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,quad); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);

const vrPlaneProg=program(VSE_VR_PLANE_VERTEX_SHADER,VSE_VR_PLANE_FRAGMENT_SHADER);
const vrPlaneLoc={pos:gl.getAttribLocation(vrPlaneProg,'aPos'),uv:gl.getAttribLocation(vrPlaneProg,'aUv'),mvp:gl.getUniformLocation(vrPlaneProg,'uMvp'),tex:gl.getUniformLocation(vrPlaneProg,'uTex')};
const sceneViewProg=program(VSE_SCENE_VIEW_VERTEX_SHADER,VSE_SCENE_VIEW_FRAGMENT_SHADER);
const sceneViewLoc={pos:gl.getAttribLocation(sceneViewProg,'aPos'),scene:gl.getUniformLocation(sceneViewProg,'uScene'),zoom:gl.getUniformLocation(sceneViewProg,'uZoom'),pan:gl.getUniformLocation(sceneViewProg,'uPan')};
const vrPlaneBuffer=gl.createBuffer();
let vrPlaneVertexCount=0;
let vrPlaneMeshKey='';
function buildVrPlaneMesh(){
  const curvature=Math.max(0,Math.min(1,Number(scene.vrScreenCurvature??0)));
  const segments=[32,64,128,256].includes(Number(scene.vrScreenSegments))?Number(scene.vrScreenSegments):64;
  const key=curvature.toFixed(3)+'|'+segments;
  if(key===vrPlaneMeshKey&&vrPlaneVertexCount>0)return;
  const verts=[];
  const curveDepth=1.25*curvature;
  for(let i=0;i<segments;i++){
    const u0=i/segments, u1=(i+1)/segments;
    const p0=vrPlanePoint(u0,curveDepth);
    const p1=vrPlanePoint(u1,curveDepth);
    verts.push(
      p0.x,-1,p0.z, u0,0,
      p1.x,-1,p1.z, u1,0,
      p0.x, 1,p0.z, u0,1,
      p0.x, 1,p0.z, u0,1,
      p1.x,-1,p1.z, u1,0,
      p1.x, 1,p1.z, u1,1
    );
  }
  gl.bindBuffer(gl.ARRAY_BUFFER,vrPlaneBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.DYNAMIC_DRAW);
  vrPlaneVertexCount=segments*6;
  vrPlaneMeshKey=key;
}
function vrPlanePoint(u,curveDepth){
  const centered=u*2-1;
  if(curveDepth<=0.0001)return {x:centered,z:0};
  const smooth=(1-Math.cos(Math.abs(centered)*Math.PI*.5));
  return {
    x:centered,
    z:smooth*curveDepth
  };
}

const bgProg=program(VSE_BACKGROUND_VERTEX_SHADER,VSE_BACKGROUND_FRAGMENT_SHADER);
const bgLoc={pos:gl.getAttribLocation(bgProg,'aPos'),tex:gl.getUniformLocation(bgProg,'uTex'),img:gl.getUniformLocation(bgProg,'uImg'),canvas:gl.getUniformLocation(bgProg,'uCanvas'),opacity:gl.getUniformLocation(bgProg,'uOpacity'),mode:gl.getUniformLocation(bgProg,'uMode'),zoom:gl.getUniformLocation(bgProg,'uZoom'),bgColor:gl.getUniformLocation(bgProg,'uBgColor'),bgAlpha:gl.getUniformLocation(bgProg,'uBgAlpha'),dim:gl.getUniformLocation(bgProg,'uDim')};
let bgTex=null,bgImageData=null,bgImageSize=[0,0];
const background={layer:0,color:'#05070c',mode:'cover',opacity:1,zoom:1,imageName:null,imageData:null};
const scene={showGrid:true,screenDim:0,screenBrighten:0,dimTargetBackground:true,dimTargetImageAssets:true,dimTargetScreens:false,dimTargetGreenscreen:false,backlightPass:0,uiHidden:false,stageWidth:1920,stageHeight:1080,objectIconColor:'#eef6ff',cameraZoom:1,cameraPanX:0,cameraPanY:0,vrSceneScale:1,vrSceneDistance:3,vrScreenCurvature:0,vrScreenSegments:64,mandalaEnabled:false,mandalaSegments:6,mandalaRotation:0,mandalaCenterX:.5,mandalaCenterY:.5,mandalaZoom:1,mandalaMix:1,mandalaAutoRotate:false,mandalaMusicRotation:false,mandalaMusicZoom:false,mandalaMusicMix:false,windEnabled:false,windStrength:0,windDirection:0,windVariationSpeed:.35,windGustsEnabled:false,gustStrength:.6,gustFrequency:.45,gustSmoothness:.65,turbulenceAmount:.35,turbulenceScale:1,turbulenceSpeed:.55,windApplyToFog:true,windApplyToParticles:true,windApplyToPhysicsAssets:true,windApplyToScreens:false,windApplyToGreenscreen:false,windApplyToWater:true,windApplyToSmokeDust:true,windApplyToWeatherParticles:true};
scene.gridSpacing=100;
scene.gridColor='#526e99';

const mandalaProg=program(VSE_MANDALA_VERTEX_SHADER,VSE_MANDALA_FRAGMENT_SHADER);
const mandalaLoc={pos:gl.getAttribLocation(mandalaProg,'aPos'),scene:gl.getUniformLocation(mandalaProg,'uScene'),center:gl.getUniformLocation(mandalaProg,'uCenter'),segments:gl.getUniformLocation(mandalaProg,'uSegments'),rotation:gl.getUniformLocation(mandalaProg,'uRotation'),zoom:gl.getUniformLocation(mandalaProg,'uZoom'),mix:gl.getUniformLocation(mandalaProg,'uMix'),objectMode:gl.getUniformLocation(mandalaProg,'uObjectMode'),pixelRes:gl.getUniformLocation(mandalaProg,'uPixelRes'),cssRes:gl.getUniformLocation(mandalaProg,'uCssRes'),originCss:gl.getUniformLocation(mandalaProg,'uOriginCss'),sizeCss:gl.getUniformLocation(mandalaProg,'uSizeCss'),objectRot:gl.getUniformLocation(mandalaProg,'uObjectRot'),opacity:gl.getUniformLocation(mandalaProg,'uOpacity')};
function backgroundDimAlpha(){
  const dim=Number(scene.screenDim||0);
  if(dim<=0.001)return 0;
  const brighten=Number(scene.screenBrighten||0);
  const rawEnergy=audioState.enabled ? (audioState.level*1.65 + audioState.bass*0.70 + audioState.mid*0.25 + audioState.high*0.35) : 0;
  const gatedEnergy=clamp01((rawEnergy-0.075)/0.925);
  const shapedLift=Math.pow(gatedEnergy,1.65);
  const audioLift=clamp01(shapedLift*brighten);
  return clamp01(dim*(1-audioLift));
}
function sceneDimmingForTarget(target,o=null){
  if(target==='background'&&scene.dimTargetBackground===false)return 0;
  if(target==='imageAsset'&&(scene.dimTargetImageAssets===false||(o&&o.imageAssetIgnoreGlobalDimming)))return 0;
  if(target==='screen'&&scene.dimTargetScreens!==true)return 0;
  if(target==='greenscreen'&&scene.dimTargetGreenscreen!==true)return 0;
  return backgroundDimAlpha();
}
function makeBgTexture(img){
  if(!bgTex)bgTex=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,bgTex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
  bgImageSize=[img.naturalWidth||img.width,img.naturalHeight||img.height];
}
function drawBackground(){
  const c=hex(background.color||'#05070c');
  const bgAlpha=1-Math.max(0,Math.min(1,Number(scene.backlightPass||0)));
  const backgroundSource=bgTex||(initTexture._backgroundFallback||(initTexture._backgroundFallback=initTexture()));
  if(bgTex||bgAlpha<0.999){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);}else{gl.disable(gl.BLEND);}
  gl.useProgram(bgProg);
  gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.enableVertexAttribArray(bgLoc.pos);gl.vertexAttribPointer(bgLoc.pos,2,gl.FLOAT,false,0,0);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,backgroundSource);gl.uniform1i(bgLoc.tex,0);
  gl.uniform2f(bgLoc.img,bgTex?bgImageSize[0]:0,bgTex?bgImageSize[1]:0);
  gl.uniform2f(bgLoc.canvas,canvas.clientWidth,canvas.clientHeight);
  gl.uniform1f(bgLoc.opacity,background.opacity);
  gl.uniform1i(bgLoc.mode,background.mode==='contain'?1:background.mode==='stretch'?2:0);
  gl.uniform1f(bgLoc.zoom,background.zoom);
  gl.uniform3f(bgLoc.bgColor,c[0],c[1],c[2]);
  gl.uniform1f(bgLoc.bgAlpha,bgAlpha);
  gl.uniform1f(bgLoc.dim,sceneDimmingForTarget('background'));
  gl.drawArrays(gl.TRIANGLES,0,6);
  gl.enable(gl.BLEND);
}

const pointGlowProg=program(VSE_POINT_GLOW_VERTEX_SHADER,VSE_POINT_GLOW_FRAGMENT_SHADER);
const pointGlowLoc={pos:gl.getAttribLocation(pointGlowProg,'aPos'),pixelRes:gl.getUniformLocation(pointGlowProg,'uPixelRes'),cssRes:gl.getUniformLocation(pointGlowProg,'uCssRes'),originCss:gl.getUniformLocation(pointGlowProg,'uOriginCss'),rot:gl.getUniformLocation(pointGlowProg,'uRot'),emitterShape:gl.getUniformLocation(pointGlowProg,'uEmitterShape'),rectangleMode:gl.getUniformLocation(pointGlowProg,'uRectangleMode'),emitterLength:gl.getUniformLocation(pointGlowProg,'uEmitterLength'),emitterSize:gl.getUniformLocation(pointGlowProg,'uEmitterSize'),radius:gl.getUniformLocation(pointGlowProg,'uRadius'),glow:gl.getUniformLocation(pointGlowProg,'uGlow'),opacity:gl.getUniformLocation(pointGlowProg,'uOpacity'),intensity:gl.getUniformLocation(pointGlowProg,'uIntensity'),color:gl.getUniformLocation(pointGlowProg,'uColor')};

const fogProg=program(VSE_FOG_VERTEX_SHADER,VSE_FOG_FRAGMENT_SHADER);
const fogLoc={pos:gl.getAttribLocation(fogProg,'aPos'),pixelRes:gl.getUniformLocation(fogProg,'uPixelRes'),cssRes:gl.getUniformLocation(fogProg,'uCssRes'),originCss:gl.getUniformLocation(fogProg,'uOriginCss'),time:gl.getUniformLocation(fogProg,'uTime'),rot:gl.getUniformLocation(fogProg,'uRot'),range:gl.getUniformLocation(fogProg,'uRange'),angle:gl.getUniformLocation(fogProg,'uAngle'),startWidth:gl.getUniformLocation(fogProg,'uStartWidth'),amount:gl.getUniformLocation(fogProg,'uAmount'),opacity:gl.getUniformLocation(fogProg,'uOpacity'),softness:gl.getUniformLocation(fogProg,'uSoftness'),drift:gl.getUniformLocation(fogProg,'uDrift'),motion:gl.getUniformLocation(fogProg,'uMotion'),turbulence:gl.getUniformLocation(fogProg,'uTurbulence'),gravity:gl.getUniformLocation(fogProg,'uGravity'),color:gl.getUniformLocation(fogProg,'uColor')};

const shapeProg=program(VSE_SHAPE_VERTEX_SHADER,VSE_SHAPE_FRAGMENT_SHADER);
const loc={a:gl.getAttribLocation(shapeProg,'a'),res:gl.getUniformLocation(shapeProg,'uRes'),pos:gl.getUniformLocation(shapeProg,'uPos'),scale:gl.getUniformLocation(shapeProg,'uScale'),rot:gl.getUniformLocation(shapeProg,'uRot'),color:gl.getUniformLocation(shapeProg,'uColor')};
const buf=gl.createBuffer();

const screenProg=program(VSE_SCREEN_VERTEX_SHADER,VSE_SCREEN_FRAGMENT_SHADER);
const screenLoc={pos:gl.getAttribLocation(screenProg,'aPos'),pixelRes:gl.getUniformLocation(screenProg,'uPixelRes'),cssRes:gl.getUniformLocation(screenProg,'uCssRes'),originCss:gl.getUniformLocation(screenProg,'uOriginCss'),sizeCss:gl.getUniformLocation(screenProg,'uSizeCss'),rot:gl.getUniformLocation(screenProg,'uRot'),opacity:gl.getUniformLocation(screenProg,'uOpacity'),brightness:gl.getUniformLocation(screenProg,'uBrightness'),scanlines:gl.getUniformLocation(screenProg,'uScanlines'),audioReaction:gl.getUniformLocation(screenProg,'uAudioReaction'),time:gl.getUniformLocation(screenProg,'uTime'),audio:gl.getUniformLocation(screenProg,'uAudio'),color:gl.getUniformLocation(screenProg,'uColor'),altColor:gl.getUniformLocation(screenProg,'uAltColor'),altMix:gl.getUniformLocation(screenProg,'uAltMix'),mode:gl.getUniformLocation(screenProg,'uMode'),selected:gl.getUniformLocation(screenProg,'uSelected'),media:gl.getUniformLocation(screenProg,'uMedia'),useMedia:gl.getUniformLocation(screenProg,'uUseMedia'),mediaAspect:gl.getUniformLocation(screenProg,'uMediaAspect'),mediaFit:gl.getUniformLocation(screenProg,'uMediaFit'),flipX:gl.getUniformLocation(screenProg,'uFlipX'),flipY:gl.getUniformLocation(screenProg,'uFlipY'),frameVisible:gl.getUniformLocation(screenProg,'uFrameVisible'),useEngine:gl.getUniformLocation(screenProg,'uUseEngine'),engineCropCss:gl.getUniformLocation(screenProg,'uEngineCropCss'),dim:gl.getUniformLocation(screenProg,'uDim')};

const greenscreenProg=program(VSE_GREENSCREEN_VERTEX_SHADER,VSE_GREENSCREEN_FRAGMENT_SHADER);
const greenscreenLoc={pos:gl.getAttribLocation(greenscreenProg,'aPos'),pixelRes:gl.getUniformLocation(greenscreenProg,'uPixelRes'),cssRes:gl.getUniformLocation(greenscreenProg,'uCssRes'),originCss:gl.getUniformLocation(greenscreenProg,'uOriginCss'),sizeCss:gl.getUniformLocation(greenscreenProg,'uSizeCss'),rot:gl.getUniformLocation(greenscreenProg,'uRot'),video:gl.getUniformLocation(greenscreenProg,'uVideo'),hasVideo:gl.getUniformLocation(greenscreenProg,'uHasVideo'),chromaKeyEnabled:gl.getUniformLocation(greenscreenProg,'uChromaKeyEnabled'),tolerance:gl.getUniformLocation(greenscreenProg,'uTolerance'),softness:gl.getUniformLocation(greenscreenProg,'uSoftness'),edgeTrim:gl.getUniformLocation(greenscreenProg,'uEdgeTrim'),spillReduction:gl.getUniformLocation(greenscreenProg,'uSpillReduction'),edgeDarken:gl.getUniformLocation(greenscreenProg,'uEdgeDarken'),opacity:gl.getUniformLocation(greenscreenProg,'uOpacity'),keyColor:gl.getUniformLocation(greenscreenProg,'uKeyColor'),selected:gl.getUniformLocation(greenscreenProg,'uSelected'),dim:gl.getUniformLocation(greenscreenProg,'uDim')};

const greenscreenShadowProg=program(VSE_GREENSCREEN_SHADOW_VERTEX_SHADER,VSE_GREENSCREEN_SHADOW_FRAGMENT_SHADER);
const greenscreenShadowLoc={pos:gl.getAttribLocation(greenscreenShadowProg,'aPos'),pixelRes:gl.getUniformLocation(greenscreenShadowProg,'uPixelRes'),cssRes:gl.getUniformLocation(greenscreenShadowProg,'uCssRes'),originCss:gl.getUniformLocation(greenscreenShadowProg,'uOriginCss'),sizeCss:gl.getUniformLocation(greenscreenShadowProg,'uSizeCss'),rot:gl.getUniformLocation(greenscreenShadowProg,'uRot'),softness:gl.getUniformLocation(greenscreenShadowProg,'uSoftness'),opacity:gl.getUniformLocation(greenscreenShadowProg,'uOpacity')};

const shadowProg=program(VSE_SHADOW_VERTEX_SHADER,VSE_SHADOW_FRAGMENT_SHADER);
const shadowLoc={pos:gl.getAttribLocation(shadowProg,'aPos'),pixelRes:gl.getUniformLocation(shadowProg,'uPixelRes'),cssRes:gl.getUniformLocation(shadowProg,'uCssRes'),originCss:gl.getUniformLocation(shadowProg,'uOriginCss'),sizeCss:gl.getUniformLocation(shadowProg,'uSizeCss'),rot:gl.getUniformLocation(shadowProg,'uRot'),blur:gl.getUniformLocation(shadowProg,'uBlur'),opacity:gl.getUniformLocation(shadowProg,'uOpacity'),color:gl.getUniformLocation(shadowProg,'uColor'),mode:gl.getUniformLocation(shadowProg,'uMode'),tex:gl.getUniformLocation(shadowProg,'uTex'),useTex:gl.getUniformLocation(shadowProg,'uUseTex')};

const imageAssetProg=program(VSE_IMAGE_ASSET_VERTEX_SHADER,VSE_IMAGE_ASSET_FRAGMENT_SHADER);
const imageAssetLoc={pos:gl.getAttribLocation(imageAssetProg,'aPos'),pixelRes:gl.getUniformLocation(imageAssetProg,'uPixelRes'),cssRes:gl.getUniformLocation(imageAssetProg,'uCssRes'),originCss:gl.getUniformLocation(imageAssetProg,'uOriginCss'),sizeCss:gl.getUniformLocation(imageAssetProg,'uSizeCss'),rot:gl.getUniformLocation(imageAssetProg,'uRot'),tex:gl.getUniformLocation(imageAssetProg,'uTex'),hasImage:gl.getUniformLocation(imageAssetProg,'uHasImage'),opacity:gl.getUniformLocation(imageAssetProg,'uOpacity'),selected:gl.getUniformLocation(imageAssetProg,'uSelected'),dim:gl.getUniformLocation(imageAssetProg,'uDim')};

const waterProg=program(VSE_WATER_VERTEX_SHADER,VSE_WATER_FRAGMENT_SHADER);
const waterLoc={pos:gl.getAttribLocation(waterProg,'aPos'),pixelRes:gl.getUniformLocation(waterProg,'uPixelRes'),cssRes:gl.getUniformLocation(waterProg,'uCssRes'),originCss:gl.getUniformLocation(waterProg,'uOriginCss'),sizeCss:gl.getUniformLocation(waterProg,'uSizeCss'),rot:gl.getUniformLocation(waterProg,'uRot'),time:gl.getUniformLocation(waterProg,'uTime'),opacity:gl.getUniformLocation(waterProg,'uOpacity'),waveHeight:gl.getUniformLocation(waterProg,'uWaveHeight'),waveScale:gl.getUniformLocation(waterProg,'uWaveScale'),waveSpeed:gl.getUniformLocation(waterProg,'uWaveSpeed'),flowDirection:gl.getUniformLocation(waterProg,'uFlowDirection'),flowSpeed:gl.getUniformLocation(waterProg,'uFlowSpeed'),flowScale:gl.getUniformLocation(waterProg,'uFlowScale'),distortion:gl.getUniformLocation(waterProg,'uDistortion'),reflection:gl.getUniformLocation(waterProg,'uReflection'),highlight:gl.getUniformLocation(waterProg,'uHighlight'),audioReaction:gl.getUniformLocation(waterProg,'uAudioReaction'),waveNoise:gl.getUniformLocation(waterProg,'uWaveNoise'),edgeFade:gl.getUniformLocation(waterProg,'uEdgeFade'),tint:gl.getUniformLocation(waterProg,'uTint'),sparkleEnabled:gl.getUniformLocation(waterProg,'uSparkleEnabled'),sparkleDensity:gl.getUniformLocation(waterProg,'uSparkleDensity'),sparkleSize:gl.getUniformLocation(waterProg,'uSparkleSize'),sparkleBrightness:gl.getUniformLocation(waterProg,'uSparkleBrightness'),sparkleSpeed:gl.getUniformLocation(waterProg,'uSparkleSpeed'),sparkleColor:gl.getUniformLocation(waterProg,'uSparkleColor'),foamEnabled:gl.getUniformLocation(waterProg,'uFoamEnabled'),foamAmount:gl.getUniformLocation(waterProg,'uFoamAmount'),foamSpeed:gl.getUniformLocation(waterProg,'uFoamSpeed'),foamScale:gl.getUniformLocation(waterProg,'uFoamScale'),foamOpacity:gl.getUniformLocation(waterProg,'uFoamOpacity'),type:gl.getUniformLocation(waterProg,'uType'),audio:gl.getUniformLocation(waterProg,'uAudio'),selected:gl.getUniformLocation(waterProg,'uSelected'),shape:gl.getUniformLocation(waterProg,'uShape'),mask:gl.getUniformLocation(waterProg,'uMask'),useMask:gl.getUniformLocation(waterProg,'uUseMask')};



const particleProg=program(VSE_PARTICLE_VERTEX_SHADER,VSE_PARTICLE_FRAGMENT_SHADER);
const particleLoc={idx:gl.getAttribLocation(particleProg,'aIndex'),pixelRes:gl.getUniformLocation(particleProg,'uPixelRes'),cssRes:gl.getUniformLocation(particleProg,'uCssRes'),originCss:gl.getUniformLocation(particleProg,'uOriginCss'),rot:gl.getUniformLocation(particleProg,'uRot'),time:gl.getUniformLocation(particleProg,'uTime'),scale:gl.getUniformLocation(particleProg,'uScale'),intensity:gl.getUniformLocation(particleProg,'uIntensity'),amount:gl.getUniformLocation(particleProg,'uAmount'),drawCount:gl.getUniformLocation(particleProg,'uDrawCount'),ipmGridX:gl.getUniformLocation(particleProg,'uIpmGridX'),ipmGridY:gl.getUniformLocation(particleProg,'uIpmGridY'),speed:gl.getUniformLocation(particleProg,'uSpeed'),spread:gl.getUniformLocation(particleProg,'uSpread'),life:gl.getUniformLocation(particleProg,'uLife'),emissionDuration:gl.getUniformLocation(particleProg,'uEmissionDuration'),localTime:gl.getUniformLocation(particleProg,'uLocalTime'),triggerActive:gl.getUniformLocation(particleProg,'uTriggerActive'),permanent:gl.getUniformLocation(particleProg,'uPermanent'),gravity:gl.getUniformLocation(particleProg,'uGravity'),turbulence:gl.getUniformLocation(particleProg,'uTurbulence'),particleSize:gl.getUniformLocation(particleProg,'uParticleSize'),glow:gl.getUniformLocation(particleProg,'uGlow'),opacity:gl.getUniformLocation(particleProg,'uOpacity'),blastEnergy:gl.getUniformLocation(particleProg,'uBlastEnergy'),shockwaveRadius:gl.getUniformLocation(particleProg,'uShockwaveRadius'),initialVelocity:gl.getUniformLocation(particleProg,'uInitialVelocity'),velocitySpread:gl.getUniformLocation(particleProg,'uVelocitySpread'),explosionTurbulence:gl.getUniformLocation(particleProg,'uExplosionTurbulence'),updraft:gl.getUniformLocation(particleProg,'uUpdraft'),fireballDuration:gl.getUniformLocation(particleProg,'uFireballDuration'),smokeAmount:gl.getUniformLocation(particleProg,'uSmokeAmount'),smokeLifetime:gl.getUniformLocation(particleProg,'uSmokeLifetime'),debrisAmount:gl.getUniformLocation(particleProg,'uDebrisAmount'),debrisGravity:gl.getUniformLocation(particleProg,'uDebrisGravity'),shockwaveVisible:gl.getUniformLocation(particleProg,'uShockwaveVisible'),jetPressure:gl.getUniformLocation(particleProg,'uJetPressure'),jetVelocity:gl.getUniformLocation(particleProg,'uJetVelocity'),jetWidth:gl.getUniformLocation(particleProg,'uJetWidth'),jetLength:gl.getUniformLocation(particleProg,'uJetLength'),coreStability:gl.getUniformLocation(particleProg,'uCoreStability'),edgeTurbulence:gl.getUniformLocation(particleProg,'uEdgeTurbulence'),updraftStrength:gl.getUniformLocation(particleProg,'uUpdraftStrength'),tipTurbulence:gl.getUniformLocation(particleProg,'uTipTurbulence'),brightness:gl.getUniformLocation(particleProg,'uBrightness'),glowStrength:gl.getUniformLocation(particleProg,'uGlowStrength'),jetSmokeAmount:gl.getUniformLocation(particleProg,'uJetSmokeAmount'),wind:gl.getUniformLocation(particleProg,'uWind'),windStrength:gl.getUniformLocation(particleProg,'uWindStrength'),windTurbulence:gl.getUniformLocation(particleProg,'uWindTurbulence'),color:gl.getUniformLocation(particleProg,'uColor'),altColor:gl.getUniformLocation(particleProg,'uAltColor'),mode:gl.getUniformLocation(particleProg,'uMode'),image:gl.getUniformLocation(particleProg,'uImage'),useImage:gl.getUniformLocation(particleProg,'uUseImage'),emitterShape:gl.getUniformLocation(particleProg,'uEmitterShape'),emitterLength:gl.getUniformLocation(particleProg,'uEmitterLength'),audio:gl.getUniformLocation(particleProg,'uAudio'),ipmMode:gl.getUniformLocation(particleProg,'uIpmMode'),ipmStrength:gl.getUniformLocation(particleProg,'uIpmStrength'),ipmReturn:gl.getUniformLocation(particleProg,'uIpmReturn'),ipmScale:gl.getUniformLocation(particleProg,'uIpmScale'),imageAspect:gl.getUniformLocation(particleProg,'uImageAspect'),ipmUseImageColors:gl.getUniformLocation(particleProg,'uIpmUseImageColors'),ipmMono:gl.getUniformLocation(particleProg,'uIpmMono'),ipmInvert:gl.getUniformLocation(particleProg,'uIpmInvert'),ipmFlipX:gl.getUniformLocation(particleProg,'uIpmFlipX'),ipmFlipY:gl.getUniformLocation(particleProg,'uIpmFlipY'),ipmWave:gl.getUniformLocation(particleProg,'uIpmWave'),ipmJitter:gl.getUniformLocation(particleProg,'uIpmJitter'),ipmEffectStrength:gl.getUniformLocation(particleProg,'uIpmEffectStrength'),ipmEffectSpeed:gl.getUniformLocation(particleProg,'uIpmEffectSpeed'),ipmAudioEffectSpeed:gl.getUniformLocation(particleProg,'uIpmAudioEffectSpeed'),ipmAudioEffectStrength:gl.getUniformLocation(particleProg,'uIpmAudioEffectStrength'),ipmAudioEffectPulse:gl.getUniformLocation(particleProg,'uIpmAudioEffectPulse'),ipmAudioMovement:gl.getUniformLocation(particleProg,'uIpmAudioMovement'),ipmAudioSize:gl.getUniformLocation(particleProg,'uIpmAudioSize'),ipmAudioAlpha:gl.getUniformLocation(particleProg,'uIpmAudioAlpha'),ipmThreshold:gl.getUniformLocation(particleProg,'uIpmThreshold'),ipmPixelMode:gl.getUniformLocation(particleProg,'uIpmPixelMode'),selected:gl.getUniformLocation(particleProg,'uSelected')};
const PARTICLE_GPU_MAX=120000;
const particleIndexBuffer=gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,particleIndexBuffer);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(Array.from({length:PARTICLE_GPU_MAX},(_,i)=>i)),gl.STATIC_DRAW);


// Echter WebGL-Visualizer:
// Die Balken, Farbsegmente, Peakmarker, Durchschnittslinien, Frequenzband-Overlay
// und Schwelle werden in einem Fragmentshader gerendert. JavaScript liefert nur
// die Audiodaten als kleine Daten-Textur; es werden keine Balken mehr einzeln als
// CPU-Geometrie gezeichnet.
const VISUALIZER_TEX_W=128;
const visualizerDataTexture=gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D,visualizerDataTexture);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,VISUALIZER_TEX_W,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(VISUALIZER_TEX_W*4));
const visualizerUploadBuffer=new Uint8Array(VISUALIZER_TEX_W*4);

const visualizerProg=program(VSE_VISUALIZER_VERTEX_SHADER,VSE_VISUALIZER_FRAGMENT_SHADER);
const visualizerLoc={pos:gl.getAttribLocation(visualizerProg,'aPos'),pixelRes:gl.getUniformLocation(visualizerProg,'uPixelRes'),cssRes:gl.getUniformLocation(visualizerProg,'uCssRes'),originCss:gl.getUniformLocation(visualizerProg,'uOriginCss'),sizeCss:gl.getUniformLocation(visualizerProg,'uSizeCss'),rot:gl.getUniformLocation(visualizerProg,'uRot'),opacity:gl.getUniformLocation(visualizerProg,'uOpacity'),selected:gl.getUniformLocation(visualizerProg,'uSelected'),bars:gl.getUniformLocation(visualizerProg,'uBars'),gap:gl.getUniformLocation(visualizerProg,'uGap'),data:gl.getUniformLocation(visualizerProg,'uData'),hasOverlay:gl.getUniformLocation(visualizerProg,'uHasOverlay'),overlayFreq:gl.getUniformLocation(visualizerProg,'uOverlayFreq'),overlayThreshold:gl.getUniformLocation(visualizerProg,'uOverlayThreshold'),backgroundColor:gl.getUniformLocation(visualizerProg,'uBackgroundColor'),lowColor:gl.getUniformLocation(visualizerProg,'uLowColor'),midColor:gl.getUniformLocation(visualizerProg,'uMidColor'),highColor:gl.getUniformLocation(visualizerProg,'uHighColor'),averageColor:gl.getUniformLocation(visualizerProg,'uAverageColor'),peakColor:gl.getUniformLocation(visualizerProg,'uPeakColor'),frameColor:gl.getUniformLocation(visualizerProg,'uFrameColor'),segmentsEnabled:gl.getUniformLocation(visualizerProg,'uSegmentsEnabled'),segmentCount:gl.getUniformLocation(visualizerProg,'uSegmentCount'),segmentGap:gl.getUniformLocation(visualizerProg,'uSegmentGap')};


let objects=[],selected=null,drag=null,id=1,draggedType='light',draggedParticleMode='free';
let groups=[],selectedIds=new Set(),selectionDrag=null;
let audioCtx=null,analyser=null,audioSource=null,audioStream=null,monitorGain=null,analysisSinkGain=null,recordingAudioDest=null,freqData=null,timeData=null;
let audioElementSource=null,audioObjectUrl=null; // MediaElementSource darf pro <audio>-Element nur einmal erzeugt werden.
let currentAudioOutputNode=null,currentAudioMode='none';
const audioState={enabled:false,source:'none',level:0,bass:0,mid:0,high:0,sensitivity:1,playlist:[],playlistIndex:-1,monitor:false,showBpm:false,bpm:null,bpmBeats:[],beat:false,beatPulse:0,bassAvg:0,lastBeat:0,lastFrame:performance.now()};
const audioCoverState={texture:null,aspect:1,name:'',found:false,objectUrl:null,image:null};
const audioTitleState={title:'',fileName:'',source:'none'};
const timelineState={duration:180,widthPercent:100,events:[],selectedEventId:null,lastClickTime:0,selected:false,manualDuration:true,currentTime:0,playing:false,lastClockTime:0};
