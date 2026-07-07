/* ===== Rendering: Hilfsformen und Objekttypen ===== */
function drawGrid(){
  const cw=canvas.clientWidth, ch=canvas.clientHeight;
  gl.useProgram(shapeProg);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.enableVertexAttribArray(loc.a);gl.vertexAttribPointer(loc.a,2,gl.FLOAT,false,0,0);
  gl.uniform2f(loc.res,cw,ch);gl.uniform2f(loc.pos,0,0);gl.uniform1f(loc.scale,1);gl.uniform1f(loc.rot,0);
  let lines=[];const step=cw/10;for(let x=0;x<=cw+.1;x+=step){lines.push(x,0,x,ch);}const stepy=ch/10;for(let y=0;y<=ch+.1;y+=stepy){lines.push(0,y,cw,y);}
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(lines),gl.STATIC_DRAW);gl.uniform4f(loc.color,.32,.43,.60,.16);gl.drawArrays(gl.LINES,0,lines.length/2);
}
function shapePoints(type){if(type==='pyro')return [-.16,.36,0,-.72,.16,.36];if(type==='confetti')return [-.5,-.25,.5,-.25,.5,.25,-.5,-.25,.5,.25,-.5,.25];let pts=[0,0];for(let i=0;i<=48;i++){let a=i/48*Math.PI*2;pts.push(Math.cos(a),Math.sin(a));}return pts;}
function circlePts(n=32){const pts=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;pts.push(Math.cos(a),Math.sin(a));}return pts;}
function drawPrimitive(points, mode, color, pos, rot, scale=1){
  const cw=canvas.clientWidth, ch=canvas.clientHeight;
  gl.useProgram(shapeProg);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.enableVertexAttribArray(loc.a);gl.vertexAttribPointer(loc.a,2,gl.FLOAT,false,0,0);
  gl.uniform2f(loc.res,cw,ch);gl.uniform2f(loc.pos,pos[0],pos[1]);gl.uniform1f(loc.rot,rot);gl.uniform1f(loc.scale,scale);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points),gl.STATIC_DRAW);
  gl.uniform4f(loc.color,color[0],color[1],color[2],color[3]);
  gl.drawArrays(mode,0,points.length/2);
}
function circlePoints(segments=48){let pts=[0,0];for(let i=0;i<=segments;i++){let a=i/segments*Math.PI*2;pts.push(Math.cos(a),Math.sin(a));}return pts;}
function drawPointGlow(o){
  const cw=canvas.clientWidth, ch=canvas.clientHeight;
  const c=activeColor(o);
  const la=lightAudio(o);
  gl.useProgram(pointGlowProg);
  gl.bindBuffer(gl.ARRAY_BUFFER,quad);
  gl.enableVertexAttribArray(pointGlowLoc.pos);
  gl.vertexAttribPointer(pointGlowLoc.pos,2,gl.FLOAT,false,0,0);
  gl.uniform2f(pointGlowLoc.pixelRes,canvas.width,canvas.height);
  gl.uniform2f(pointGlowLoc.cssRes,cw,ch);
  gl.uniform2f(pointGlowLoc.originCss,objCssX(o),objCssY(o));
  gl.uniform1f(pointGlowLoc.rot,effectiveRotation(o)*Math.PI/180);
  const pointEmitterShape=o.type==='light'?(o.lightEmitterShape||'point'):'point';
  gl.uniform1i(pointGlowLoc.emitterShape,pointEmitterShape==='rectangle'?2:pointEmitterShape==='line'?1:0);
  gl.uniform1i(pointGlowLoc.rectangleMode,o.lightRectangleEmission==='inward'?1:o.lightRectangleEmission==='solid'?2:0);
  gl.uniform1f(pointGlowLoc.emitterLength,pointEmitterShape==='line'?su(o.lightEmitterLength??240):0);
  gl.uniform2f(pointGlowLoc.emitterSize,su(o.lightEmitterWidth??480),su(o.lightEmitterHeight??270));
  gl.uniform1f(pointGlowLoc.radius,Math.max(4*stageScale(),Number(o.size||44)*0.34*stageScale()));
  gl.uniform1f(pointGlowLoc.glow,la.glow);
  gl.uniform1f(pointGlowLoc.opacity,o.opacity??0.85);
  const ambiPointBoost=(ambilightState.active&&ambilightState.strength>1)?(1+(ambilightState.strength-1)*0.85):1;
  gl.uniform1f(pointGlowLoc.intensity,la.intensity*(isSelected(o)?1.08:1)*ambiPointBoost);
  gl.uniform3f(pointGlowLoc.color,c[0],c[1],c[2]);
  gl.blendFunc(gl.ONE,gl.ONE);
  gl.drawArrays(gl.TRIANGLES,0,6);
}
function drawLightPoint(o){
  // Der Lichtemitter bekommt keinen separaten geometrischen Körper mehr.
  // Der Punkt selbst wird vollständig vom radialen Glow-Shader gezeichnet.
  // Dadurch entstehen keine harten Kreise um den Punkt.
}
function fogAudio(o){
  const sens=audioState.sensitivity;
  const oa=objectAudio(o);
  const musicReaction=clamp01(Number(o.music??0));
  let amount=1;
  let glow=o.fogGlow??0.15;
  let angle=o.fogAngle??80;
  let startWidth=Math.max(0,Number(o.fogStartWidth??80));
  let rot=Number(o.rotation||0);
  let driftX=0.22;
  let driftY=-0.10;
  let motionSpeed=o.fogMotion??0.9;
  let turbulence=o.fogTurbulence??0.85;
  let dynamics=o.fogDynamics??1.0;
  let gravity=o.fogGravity??0;
  let lifetime=o.fogLife??4.0;

  // Nebelbewegung reagiert NICHT mehr auf Musik.
  // Wabern, Turbulenz, Dynamik, Drift und Reichweite bleiben reine Nebelparameter.
  // Die Schwenkregler sind eine manuelle, gleichmäßige Bewegung und werden nicht vom Pegel beeinflusst.
  const speed=Number(o.fogPanSpeed||0);
  const pan=Number(o.fogPanAngle||0);
  if(speed>0&&pan>0){
    const phase=((performance.now()/1000)*speed*Math.PI*2)+(Number((o.id||'').replace(/\D/g,''))||0)*0.271;
    rot += Math.sin(phase)*pan;
  }

  // Musik beeinflusst beim Nebel nur Helligkeit/Sichtbarkeit.
  // Bei Musikreaktion 0 bleibt der Nebel vollständig unbeeinflusst: 0 ist 0.
  if(audioState.enabled&&sens>0&&musicReaction>0){
    const bright=clamp01(oa.level*sens*1.25);
    amount*=1+bright*0.95;
    glow+=bright*0.55;
  }

  const calcRange=Math.max(40, Math.min(2200, lifetime*(55+dynamics*95)*(0.75+motionSpeed*0.22)));
  return {amount,driftX,driftY,glow,angle,startWidth,rot,motionSpeed,turbulence,gravity,calcRange};
}
function drawFog(o){
  const cw=canvas.clientWidth, ch=canvas.clientHeight;
  const c=fogColor(o);
  const fa=fogAudio(o);
  const wind=windForObject(o,'fog');
  gl.useProgram(fogProg);
  gl.bindBuffer(gl.ARRAY_BUFFER,quad);
  gl.enableVertexAttribArray(fogLoc.pos);
  gl.vertexAttribPointer(fogLoc.pos,2,gl.FLOAT,false,0,0);
  gl.uniform2f(fogLoc.pixelRes,canvas.width,canvas.height);
  gl.uniform2f(fogLoc.cssRes,cw,ch);
  gl.uniform2f(fogLoc.originCss,objCssX(o),objCssY(o));
  gl.uniform1f(fogLoc.time,performance.now()/1000);
  gl.uniform1f(fogLoc.rot,fa.rot*Math.PI/180);
  gl.uniform1f(fogLoc.range,su(fa.calcRange)*(1+wind.strength*0.045));
  gl.uniform1f(fogLoc.angle,fa.angle);
  gl.uniform1f(fogLoc.startWidth,su(fa.startWidth));
  gl.uniform1f(fogLoc.amount,fa.amount*(o.intensity??1)*(1+wind.gust*0.08));
  gl.uniform1f(fogLoc.opacity,o.fogOpacity??0.35);
  gl.uniform1f(fogLoc.softness,o.fogSoftness??0.75);
  gl.uniform2f(fogLoc.drift,fa.driftX+wind.cssX*0.012,fa.driftY+wind.cssY*0.012);
  gl.uniform1f(fogLoc.motion,fa.motionSpeed+wind.strength*0.08);
  gl.uniform1f(fogLoc.turbulence,fa.turbulence+wind.turbulenceAmount*0.55+wind.strength*0.025);
  gl.uniform1f(fogLoc.gravity,fa.gravity);
  gl.uniform3f(fogLoc.color,c[0],c[1],c[2]);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.drawArrays(gl.TRIANGLES,0,6);
}
function screenModeId(mode){return mode==='audio'?1:mode==='pulse'?2:0;}
function mediaFitId(fit){return fit==='contain'?1:fit==='stretch'?2:0;}
function getScreenMediaAspect(o){
  if(!o)return 1;
  const el=o.screenMediaElement;
  let aspect=Number(o.screenMediaAspect||0);
  if(el){
    if(o.screenMediaType==='video' && el.videoWidth && el.videoHeight){
      aspect=el.videoWidth/Math.max(1,el.videoHeight);
      o.screenMediaAspect=aspect;
    }else if(o.screenMediaType==='image' && (el.naturalWidth||el.width) && (el.naturalHeight||el.height)){
      aspect=(el.naturalWidth||el.width)/Math.max(1,(el.naturalHeight||el.height));
      o.screenMediaAspect=aspect;
    }
  }
  return aspect>0?aspect:1;
}
function initTexture(){const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));return tex;}
function releaseScreenMedia(o){if(!o)return;if(o.screenCaptureStream){try{o.screenCaptureStream.getTracks().forEach(t=>t.stop());}catch(e){}}if(o.screenMediaUrl){try{URL.revokeObjectURL(o.screenMediaUrl);}catch(e){}}if(o.screenMediaElement&&o.screenMediaElement.pause)try{o.screenMediaElement.pause();}catch(e){}if(o.screenMediaElement&&o.screenMediaElement.srcObject)try{o.screenMediaElement.srcObject=null;}catch(e){}o.screenTexture=null;o.screenMediaElement=null;o.screenMediaUrl='';o.screenCaptureStream=null;o.screenMediaType='none';o.screenMediaName='';o.screenMediaData=null;o.screenMediaEmbedded=false;o.screenMediaAspect=1;o._ambilightColor=null;o._ambilightLastSample=0;}


function updateGreenscreenAudioRouting(o){
  if(!o||o.type!=='greenscreen')return;
  const video=o.greenscreenMediaElement;
  const isLocalVideo=o.greenscreenMediaType==='video';
  const enabled=!!o.greenscreenAudioEnabled && isLocalVideo && !!video;
  if(!video)return;
  video.volume=Math.max(0,Math.min(1,Number(o.greenscreenAudioVolume??1)));
  video.muted=!enabled;
  if(!enabled){
    if(o.greenscreenAudioGain)try{o.greenscreenAudioGain.gain.value=0;}catch(e){}
    return;
  }
  try{
    ensureAudio();
    if(audioCtx&&audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
    if(!o.greenscreenAudioNode){
      o.greenscreenAudioNode=audioCtx.createMediaElementSource(video);
      o.greenscreenAudioGain=audioCtx.createGain();
      o.greenscreenAudioNode.connect(o.greenscreenAudioGain);
      o.greenscreenAudioGain.connect(audioCtx.destination);
      if(recordingAudioDest)o.greenscreenAudioGain.connect(recordingAudioDest);
    }
    if(o.greenscreenAudioGain)o.greenscreenAudioGain.gain.value=Math.max(0,Math.min(1,Number(o.greenscreenAudioVolume??1)));
    video.play().catch(()=>{});
  }catch(err){
    console.warn('Greenscreen-Audio konnte nicht geroutet werden:',err);
    // Fallback: direkte HTML-Video-Ausgabe, falls createMediaElementSource bereits verwendet wurde.
    video.muted=false;
    video.play().catch(()=>{});
  }
}

function releaseGreenscreenMedia(o){
  if(!o)return;
  if(o.greenscreenStream){try{o.greenscreenStream.getTracks().forEach(t=>t.stop());}catch(e){}}
  if(o.greenscreenMediaUrl){try{URL.revokeObjectURL(o.greenscreenMediaUrl);}catch(e){}}
  if(o.greenscreenMediaElement&&o.greenscreenMediaElement.pause)try{o.greenscreenMediaElement.pause();}catch(e){}
  if(o.greenscreenAudioGain){try{o.greenscreenAudioGain.disconnect();}catch(e){}}
  if(o.greenscreenAudioNode){try{o.greenscreenAudioNode.disconnect();}catch(e){}}
  if(o.greenscreenMediaElement&&o.greenscreenMediaElement.srcObject)try{o.greenscreenMediaElement.srcObject=null;}catch(e){}
  o.greenscreenTexture=null;o.greenscreenMediaElement=null;o.greenscreenMediaUrl='';o.greenscreenStream=null;o.greenscreenMediaType='none';o.greenscreenMediaName='';o.greenscreenMediaAspect=16/9;o.greenscreenAudioNode=null;o.greenscreenAudioGain=null;
}
function attachGreenscreenVideoElement(o,video,tex,type,name){
  o.greenscreenTexture=tex;o.greenscreenMediaElement=video;o.greenscreenMediaType=type;o.greenscreenMediaName=name||type;o.greenscreenOpacity=o.greenscreenOpacity??1;
  video.autoplay=true;video.loop=type==='video';video.muted=!(type==='video'&&o.greenscreenAudioEnabled);video.playsInline=true;video.volume=Math.max(0,Math.min(1,Number(o.greenscreenAudioVolume??1)));
  video.onloadedmetadata=()=>{o.greenscreenMediaAspect=(video.videoWidth||16)/Math.max(1,(video.videoHeight||9));updateGreenscreenAudioRouting(o);video.play().catch(()=>{});};
  video.play().catch(()=>{});
  updateGreenscreenAudioRouting(o);
  if(selected===o&&greenscreenInfo)greenscreenInfo.textContent='Quelle: '+o.greenscreenMediaName+' · '+type;
}
function loadGreenscreenVideo(o,file){
  if(!o||o.type!=='greenscreen'||!file)return;
  releaseGreenscreenMedia(o);
  const tex=initTexture();
  const url=URL.createObjectURL(file);
  o.greenscreenMediaUrl=url;
  const video=document.createElement('video');
  video.src=url;
  attachGreenscreenVideoElement(o,video,tex,'video',file.name);
}
async function refreshGreenscreenWebcamDevices(preferredId){
  if(!greenscreenWebcamDevice||typeof navigator==='undefined'||!navigator.mediaDevices||typeof navigator.mediaDevices.enumerateDevices!=='function')return;
  const previous=preferredId!==undefined?preferredId:greenscreenWebcamDevice.value;
  try{
    const devices=(await navigator.mediaDevices.enumerateDevices()).filter(device=>device.kind==='videoinput');
    greenscreenWebcamDevice.innerHTML='';
    const defaultOption=document.createElement('option');
    defaultOption.value='';defaultOption.textContent='Standard-Webcam';greenscreenWebcamDevice.appendChild(defaultOption);
    devices.forEach((device,index)=>{
      const option=document.createElement('option');
      option.value=device.deviceId;
      option.textContent=device.label||('Webcam '+(index+1));
      greenscreenWebcamDevice.appendChild(option);
    });
    if([...greenscreenWebcamDevice.options].some(option=>option.value===previous))greenscreenWebcamDevice.value=previous;
  }catch(error){console.warn('Webcam-Liste konnte nicht gelesen werden.',error);}
}
async function startGreenscreenWebcam(o){
  if(!o||o.type!=='greenscreen')return;
  if(typeof navigator==='undefined'||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    const msg='Webcam wird von diesem Browser oder dieser Startart nicht bereitgestellt. Bitte die VSE über http://localhost oder http://127.0.0.1 öffnen und dem Browser den Kamerazugriff erlauben.';
    if(greenscreenInfo&&selected===o)greenscreenInfo.textContent=msg;
    alert(msg);
    return;
  }
  try{
    releaseGreenscreenMedia(o);
    const selectedDeviceId=(greenscreenWebcamDevice&&greenscreenWebcamDevice.value)||o.greenscreenDeviceId||'';
    const videoConstraints=selectedDeviceId?{deviceId:{exact:selectedDeviceId}}:true;
    const stream=await navigator.mediaDevices.getUserMedia({video:videoConstraints,audio:false});
    const track=stream.getVideoTracks()[0];
    if(!track)throw new Error('Keine aktive Videospur verfügbar.');
    o.greenscreenDeviceId=track.getSettings().deviceId||selectedDeviceId;
    await refreshGreenscreenWebcamDevices(o.greenscreenDeviceId);
    const tex=initTexture();
    const video=document.createElement('video');
    video.srcObject=stream;
    o.greenscreenStream=stream;
    attachGreenscreenVideoElement(o,video,tex,'webcam',track.label||'Webcam');
    if(greenscreenInfo&&selected===o)greenscreenInfo.textContent='Webcam aktiv: '+(track.label||'ausgewählte Kamera');
  }catch(err){alert('Webcam konnte nicht gestartet werden: '+err.message);}
}
if(typeof navigator!=='undefined'&&navigator.mediaDevices){
  refreshGreenscreenWebcamDevices();
  if(typeof navigator.mediaDevices.addEventListener==='function')navigator.mediaDevices.addEventListener('devicechange',()=>refreshGreenscreenWebcamDevices(selected&&selected.type==='greenscreen'?selected.greenscreenDeviceId:undefined));
}

function clearScreenPlaylist(o){
  if(!o||o.type!=='screen')return;
  o.screenPlaylist=[];
  o.screenPlaylistIndex=-1;
  o.screenPlaylistLastSwitch=0;
}
function screenFileType(file){
  const t=(file&&file.type||'').toLowerCase();
  const n=(file&&file.name||'').toLowerCase();
  if(t.startsWith('video/')||/\.(mp4|webm|mov|m4v|ogv)$/i.test(n))return 'video';
  if(t.startsWith('image/')||/\.(png|jpe?g|webp|gif)$/i.test(n))return 'image';
  return null;
}
function loadScreenPlaylistItem(o,index,manual=false){
  if(!o||o.type!=='screen'||!o.screenPlaylist||!o.screenPlaylist.length)return;
  const len=o.screenPlaylist.length;
  o.screenPlaylistIndex=((Number(index)||0)%len+len)%len;
  const file=o.screenPlaylist[o.screenPlaylistIndex];
  const type=screenFileType(file);
  if(!type)return;
  loadScreenMedia(o,file,type,true);
  o.screenMode=type;
  o.screenPlaylistLastSwitch=performance.now();
  if(selected===o){fields.ScreenMode.value=o.screenMode;select(o);}
}
function loadScreenMediaFolder(o,files){
  if(!o||o.type!=='screen')return;
  const arr=Array.from(files||[]).filter(f=>!!screenFileType(f)).sort((a,b)=>(a.webkitRelativePath||a.name).localeCompare(b.webkitRelativePath||b.name,undefined,{numeric:true}));
  if(!arr.length){alert('Keine unterstützten Bilder oder Videos im Ordner gefunden.');return;}
  clearScreenPlaylist(o);
  o.screenPlaylist=arr;
  o.screenPlaylistIndex=0;
  o.screenPlaylistHold=Number(o.screenPlaylistHold??5);
  o.screenPlaylistAuto=o.screenPlaylistAuto!==false;
  loadScreenPlaylistItem(o,0,true);
}
function screenPlaylistNext(o){
  if(!o||!o.screenPlaylist||o.screenPlaylist.length<1)return;
  loadScreenPlaylistItem(o,(Number(o.screenPlaylistIndex)||0)+1,true);
}
function updateScreenPlaylists(){
  const now=performance.now();
  for(const o of objects){
    if(!o||o.type!=='screen'||!o.screenPlaylist||o.screenPlaylist.length<2||o.screenPlaylistAuto===false)continue;
    const cur=o.screenPlaylist[o.screenPlaylistIndex||0];
    const type=screenFileType(cur);
    let should=false;
    if(type==='video'&&o.screenMediaElement){
      if(o.screenMediaElement.ended)should=true;
    }else{
      const hold=Math.max(.5,Number(o.screenPlaylistHold??5))*1000;
      if(now-(o.screenPlaylistLastSwitch||0)>=hold)should=true;
    }
    if(should)screenPlaylistNext(o);
  }
}
function loadScreenMedia(o,file,type,fromPlaylist=false){
  if(!o||o.type!=='screen'||!file)return;
  if(!fromPlaylist)clearScreenPlaylist(o);
  releaseScreenMedia(o);
  const tex=initTexture();
  const url=URL.createObjectURL(file);
  o.screenTexture=tex;
  o.screenMediaUrl=url;
  o.screenMediaType=type;
  o.screenMediaName=file.name;
  o.screenMediaData=null;
  o.screenMediaEmbedded=false;
  if(type==='image'){
    const exportReader=new FileReader();
    exportReader.onload=()=>{o.screenMediaData=exportReader.result;o.screenMediaEmbedded=true;};
    exportReader.readAsDataURL(file);
  }
  o.screenMediaFit='cover';
  o.screenFlipX=o.screenFlipX??false;
  o.screenFlipY=o.screenFlipY??false;
  o.screenVideoAudio=o.screenVideoAudio??true;
  o.screenVideoVolume=o.screenVideoVolume??1;
  gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  if(type==='image'){
    o._ambilightColor=null; o._ambilightLastSample=0;
    const img=new Image();
    img.onload=()=>{
      o.screenMediaAspect=(img.naturalWidth||1)/(img.naturalHeight||1);
      gl.bindTexture(gl.TEXTURE_2D,tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
    };
    img.src=url;
    o.screenMediaElement=img;
    o.screenMode='image';
  }else{
    o._ambilightColor=null; o._ambilightLastSample=0;
    const v=document.createElement('video');
    v.muted=!o.screenVideoAudio;
    v.volume=Number(o.screenVideoVolume??1);
    v.loop=true;
    v.playsInline=true;
    v.autoplay=true;
    v.preload='auto';
    v.src=url;
    v.addEventListener('loadedmetadata',()=>{
      o.screenMediaAspect=(v.videoWidth||1)/(v.videoHeight||1);
      v.muted=!o.screenVideoAudio;
      v.volume=Number(o.screenVideoVolume??1);
      v.play().catch(()=>{});
    });
    v.load();
    o.screenMediaElement=v;
    o.screenMode='video';
  }
  select(o);
}
async function startScreenCaptureForScreen(o){
  if(!o||o.type!=='screen')return;
  if(!navigator.mediaDevices||!navigator.mediaDevices.getDisplayMedia){
    alert('Browser-/Tabaufnahme wird von diesem Browser nicht unterstützt.');
    return;
  }
  try{
    const stream=await navigator.mediaDevices.getDisplayMedia({
      video:{frameRate:{ideal:30,max:60}},
      audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}
    });
    releaseScreenMedia(o);
    const tex=initTexture();
    const v=document.createElement('video');
    v.autoplay=true;
    v.playsInline=true;
    v.loop=false;
    v.muted=!o.screenVideoAudio;
    v.volume=Number(o.screenVideoVolume??1);
    v.srcObject=stream;
    o.screenTexture=tex;
    o.screenCaptureStream=stream;
    o.screenMediaUrl='';
    o.screenMediaType='video';
    o.screenMediaName='Browser-/Tabaufnahme';
    o.screenMediaData=null;
    o.screenMediaEmbedded=false;
    o.screenMediaFit='cover';
    o.screenMode='video';
    o._ambilightColor=null;
    o._ambilightLastSample=0;
    o.screenMediaElement=v;
    v.addEventListener('loadedmetadata',()=>{
      o.screenMediaAspect=(v.videoWidth||1)/(v.videoHeight||1);
      v.muted=!o.screenVideoAudio;
      v.volume=Number(o.screenVideoVolume??1);
      v.play().catch(()=>{});
      syncTypeUI();
    });
    stream.getTracks().forEach(track=>{track.onended=()=>{if(o.screenCaptureStream===stream)releaseScreenMedia(o);syncTypeUI();};});
    await v.play().catch(()=>{});
    select(o);
    syncTypeUI();
  }catch(err){
    if(err&&err.name==='NotAllowedError')return;
    console.error(err);
    alert('Browser-/Tabaufnahme konnte nicht gestartet werden.');
  }
}
function screenAltMix(o){
  const speed=Number(o.screenAltSpeed??0.25), amount=Number(o.screenAltAmount??0.6);
  let t=0;
  if(speed>0&&amount>0){
    const phase=performance.now()/1000*speed*Math.PI*2+(Number((o.id||'').replace(/\D/g,''))||0)*0.327;
    t=((Math.sin(phase)+1)*0.5)*amount;
  }
  if(audioState.enabled&&amount>0){
    const oa=objectAudio(o);
    t=clamp01(t + oa.level*audioState.sensitivity*Number(o.screenAudio??0.5)*amount);
  }
  return clamp01(t);
}

function triggerParticleEffect(o,strength=1){
  if(!o||o.type!=='particle')return false;
  if((o.particleEmissionMode||'trigger')==='permanent'||o.particleUnlimited)return false;
  const now=performance.now()/1000;
  o._particleManualTriggerStart=now;
  o._particleManualTriggerStrength=Math.max(0.05,Number(strength)||1);
  o._particleStart=now;
  o._particleLastTrigger=now;
  o._particleTriggerStrength=o._particleManualTriggerStrength;
  return true;
}
function canManualTriggerParticle(o){return !!(o&&o.type==='particle'&&(o.particleEmissionMode||'trigger')!=='permanent'&&!o.particleUnlimited);}
function manualTriggerParticleTargets(){
  const multi=getSelectedObjects().filter(canManualTriggerParticle);
  if(multi.length)return multi;
  return canManualTriggerParticle(selected)?[selected]:[];
}
function updateParticleTriggerButton(){
  if(!particleTriggerBtn)return;
  const targets=manualTriggerParticleTargets();
  const ok=targets.length>0;
  particleTriggerBtn.disabled=!ok;
  particleTriggerBtn.title=ok?(targets.length>1?`${targets.length} Partikeleffekte gleichzeitig triggern`:'Ausgewählten Partikeleffekt einmalig triggern'):'Partikelobjekt mit Musik-Trigger / Einmalstoß auswählen';
}
if(particleTriggerBtn)particleTriggerBtn.addEventListener('click',()=>{
  const targets=manualTriggerParticleTargets();
  let triggered=0;
  for(const o of targets)if(triggerParticleEffect(o,1))triggered++;
  if(triggered){updateParticleTriggerButton();updateHud();}
});
function particleModeId(mode){
  return {free:0,fireFountain:1,sparkFountain:2,explosion:3,glitter:4,confetti:5,ash:6,dust:7,snow:8,shockwave:9,imageParticles:10,starflight:11,gasJet:12,rain:13}[mode||'free']??0;
}
function releaseParticleImage(o){
  if(!o)return;
  if(o.particleImageUrl){try{URL.revokeObjectURL(o.particleImageUrl);}catch(e){}}
  if(o._ipmBuffer){try{gl.deleteBuffer(o._ipmBuffer);}catch(e){}}
  o._ipmBuffer=null;o._ipmCount=0;o._ipmKey='';
  o.particleTexture=null;
  o.particleImageElement=null;
  o.particleImageUrl='';
  o.particleImageType='none';
  o.particleImageName='';
  o.particleImageData=null;
  o.particleImageEmbedded=false;
  o.particleImageAspect=1;
}
function loadParticleImage(o,file){
  if(!o||(o.type!=='particle'&&o.type!=='imageParticle')||!file)return;
  releaseParticleImage(o);
  const tex=initTexture();
  const url=URL.createObjectURL(file);
  o.particleTexture=tex;
  o.particleImageUrl=url;
  o.particleImageType='image';
  o.particleImageName=file.name;
  o.particleImageData=null;
  o.particleImageEmbedded=false;
  const exportReader=new FileReader();
  exportReader.onload=()=>{o.particleImageData=exportReader.result;o.particleImageEmbedded=true;};
  exportReader.readAsDataURL(file);
  const img=new Image();
  img.onload=()=>{
    o.particleImageAspect=(img.naturalWidth||1)/(img.naturalHeight||1);
    gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
  };
  img.src=url;
  o.particleImageElement=img;
  o.particleMode='imageParticles';
  select(o);
}
function particleAudioEnergy(o){
  if(!audioState.enabled)return 0;
  const oa=objectAudio(o);
  const mix=oa.level;
  return clamp01(mix*Number(o.particleAudio??0.25)*audioState.sensitivity*1.15);
}
function updateParticleTrigger(o,now){
  const life=Math.max(0.2,Number(o.particleLife??2.5));
  const emitDur=Math.max(0.1,Number(o.particleEmissionDuration??1.0));
  const mode=o.particleEmissionMode||'trigger';
  const unlimited=!!o.particleUnlimited;
  const offset=(Number((o.id||'').replace(/\D/g,''))||0)*0.071;

  // Dauerbetrieb: für Regen, Schnee, Asche, Staub usw.
  // Die Partikel werden kontinuierlich über ihre Lebensdauer verteilt.
  // Musik startet hier nichts und verursacht kein Gezappel.
  if(mode==='permanent'){
    const local=(now+offset)%life;
    return {local,active:true,strength:1,permanent:true,unlimited:true};
  }

  if(!o._particleStart)o._particleStart=-9999;
  if(!o._particleLastTrigger)o._particleLastTrigger=0;
  let strength=1;
  const totalRuntime=unlimited?1e9:(emitDur+life);
  const manualLocal=now-Number(o._particleManualTriggerStart||-9999);
  if(o._particleManualTriggerStart && manualLocal<=totalRuntime){
    return {local:manualLocal,active:true,strength:Number(o._particleManualTriggerStrength||1),permanent:false,unlimited:false};
  }
  if(audioState.enabled){
    const e=particleAudioEnergy(o);
    const localBeforeTrigger=now-o._particleStart;
    const isRunning=localBeforeTrigger <= totalRuntime;

    // Trigger-Sperre:
    // Ein getriggerter Partikeleffekt darf während Emission + Auslaufzeit nicht erneut starten.
    // Musik startet den Effekt nur, wenn der vorherige Durchlauf vollständig beendet ist.
    const oa=objectAudio(o);
    // Partikel-Trigger hängt jetzt vollständig am zentralen Audio-Backbone.
    // Die globale Master-Sensitivität fließt über particleAudioEnergy() ein.
    // Damit gilt: Master-Sensitivität 0 = kein Partikel-Trigger, höhere Werte = stärkere Triggerfreigabe.
    const masterDrivenParticleSignal=e;
    if(!isRunning && audioState.sensitivity>0 && oa.passed && masterDrivenParticleSignal>0.002 && (oa.beat||masterDrivenParticleSignal>0.02)){
      o._particleStart=now;
      o._particleLastTrigger=now;
      o._particleTriggerStrength=clamp01(0.45+masterDrivenParticleSignal*2.2+(oa.beat?0.25:0));
    }
    const rawLocal=now-o._particleStart;
    const local=unlimited?(rawLocal%life):rawLocal;
    const active=rawLocal <= totalRuntime;
    strength=active?Number(o._particleTriggerStrength??0):0;
    return {local,active,strength,permanent:unlimited,unlimited};
  }
  // Kein Audiosignal / keine Audioquelle:
  // Getriggerte Partikeleffekte bleiben vollständig inaktiv, außer sie wurden per Testbutton manuell gestartet.
  // Es gibt keine automatische Vorschau-Animation mehr, damit Feuerstöße,
  // Explosionen, Konfetti usw. nicht ohne Signal loslaufen.
  // Dauerbetrieb bleibt oben separat geregelt und läuft nur, wenn der Nutzer
  // den Emissionsmodus ausdrücklich auf Permanent gesetzt hat.
  return {local:0,active:false,strength:0,permanent:false,unlimited:false};
}

// IPM WebGL-Neuaufbau ab Version 084:
// Das Bild wird nicht mehr im Shader aus aIndex als virtuelles Raster rekonstruiert.
// Stattdessen erzeugt JavaScript einmalig eine echte Liste der sichtbaren Bildpixel
// und lädt diese als WebGL-Attributbuffer hoch. Dadurch kann bei hoher Dichte
// keine Bildkante mehr zeilenweise abgeschnitten werden.
const IPM_GPU_MAX=180000;
const ipmProg=program(VSE_IPM_VERTEX_SHADER,VSE_IPM_FRAGMENT_SHADER);
const ipmLoc={base:gl.getAttribLocation(ipmProg,'aBase'),uv:gl.getAttribLocation(ipmProg,'aUv'),alpha:gl.getAttribLocation(ipmProg,'aAlpha'),phase:gl.getAttribLocation(ipmProg,'aPhase'),rain:gl.getAttribLocation(ipmProg,'aRain'),pixelRes:gl.getUniformLocation(ipmProg,'uPixelRes'),cssRes:gl.getUniformLocation(ipmProg,'uCssRes'),originCss:gl.getUniformLocation(ipmProg,'uOriginCss'),rot:gl.getUniformLocation(ipmProg,'uRot'),size:gl.getUniformLocation(ipmProg,'uSize'),time:gl.getUniformLocation(ipmProg,'uTime'),ipmScale:gl.getUniformLocation(ipmProg,'uIpmScale'),pointSize:gl.getUniformLocation(ipmProg,'uPointSize'),opacity:gl.getUniformLocation(ipmProg,'uOpacity'),color:gl.getUniformLocation(ipmProg,'uColor'),audio:gl.getUniformLocation(ipmProg,'uAudio'),ipmMode:gl.getUniformLocation(ipmProg,'uIpmMode'),ipmWave:gl.getUniformLocation(ipmProg,'uIpmWave'),ipmJitter:gl.getUniformLocation(ipmProg,'uIpmJitter'),ipmEffectStrength:gl.getUniformLocation(ipmProg,'uIpmEffectStrength'),ipmEffectSpeed:gl.getUniformLocation(ipmProg,'uIpmEffectSpeed'),ipmAudioEffectSpeed:gl.getUniformLocation(ipmProg,'uIpmAudioEffectSpeed'),ipmAudioEffectStrength:gl.getUniformLocation(ipmProg,'uIpmAudioEffectStrength'),ipmAudioEffectPulse:gl.getUniformLocation(ipmProg,'uIpmAudioEffectPulse'),ipmAudioMovement:gl.getUniformLocation(ipmProg,'uIpmAudioMovement'),ipmAudioSize:gl.getUniformLocation(ipmProg,'uIpmAudioSize'),ipmAudioAlpha:gl.getUniformLocation(ipmProg,'uIpmAudioAlpha'),flipX:gl.getUniformLocation(ipmProg,'uFlipX'),flipY:gl.getUniformLocation(ipmProg,'uFlipY'),useImageColors:gl.getUniformLocation(ipmProg,'uUseImageColors'),mono:gl.getUniformLocation(ipmProg,'uMono'),invert:gl.getUniformLocation(ipmProg,'uInvert'),image:gl.getUniformLocation(ipmProg,'uImage'),destructMode:gl.getUniformLocation(ipmProg,'uDestructMode'),destructTime:gl.getUniformLocation(ipmProg,'uDestructTime'),destructDuration:gl.getUniformLocation(ipmProg,'uDestructDuration'),destructReverse:gl.getUniformLocation(ipmProg,'uDestructReverse'),destructStrength:gl.getUniformLocation(ipmProg,'uDestructStrength'),destructDirection:gl.getUniformLocation(ipmProg,'uDestructDirection'),destructSpread:gl.getUniformLocation(ipmProg,'uDestructSpread'),destructGravity:gl.getUniformLocation(ipmProg,'uDestructGravity'),destructReturn:gl.getUniformLocation(ipmProg,'uDestructReturn'),destructReturnSpeed:gl.getUniformLocation(ipmProg,'uDestructReturnSpeed'),destructRandomness:gl.getUniformLocation(ipmProg,'uDestructRandomness'),destructClusterSize:gl.getUniformLocation(ipmProg,'uDestructClusterSize'),destructParticleFade:gl.getUniformLocation(ipmProg,'uDestructParticleFade'),destructFadeTime:gl.getUniformLocation(ipmProg,'uDestructFadeTime'),destructCenter:gl.getUniformLocation(ipmProg,'uDestructCenter'),destructSeed:gl.getUniformLocation(ipmProg,'uDestructSeed')};
function ipmKey(o){
  const img=o.particleImageElement;
  const ready=img&&img.complete&&(img.naturalWidth||img.width);
  return [ready?img.naturalWidth:0,ready?img.naturalHeight:0,o.particleImageName||'',Number(o.ipmDensity??3).toFixed(3),Math.round(o.ipmThreshold??145),o.ipmPixelMode||'dark',!!o.ipmInvert].join('|');
}
function buildIpmBuffer(o){
  const img=o.particleImageElement;
  if(!img||!img.complete||!(img.naturalWidth||img.width))return false;
  const ow=img.naturalWidth||img.width, oh=img.naturalHeight||img.height;
  const maxSampleSide=900;
  const sc=Math.min(1,maxSampleSide/Math.max(ow,oh));
  const w=Math.max(1,Math.round(ow*sc)), h=Math.max(1,Math.round(oh*sc));
  const off=document.createElement('canvas'); off.width=w; off.height=h;
  const ctx=off.getContext('2d',{willReadFrequently:true});
  ctx.clearRect(0,0,w,h); ctx.drawImage(img,0,0,w,h);
  const data=ctx.getImageData(0,0,w,h).data;
  const density=Math.max(0.05,Number(o.ipmDensity??3));
  let step=Math.max(1,Math.round(20/density));
  const minStep=Math.max(1,Math.ceil(Math.sqrt((w*h)/IPM_GPU_MAX)));
  step=Math.max(step,minStep);
  const threshold=Number(o.ipmThreshold??145);
  const mode=o.ipmPixelMode||'dark';
  const invert=!!o.ipmInvert;
  const aspect=ow/Math.max(1,oh);
  const arr=[];
  for(let y=0;y<h;y+=step){
    for(let x=0;x<w;x+=step){
      const i=(y*w+x)*4;
      const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];
      if(a<40)continue;
      let br=r*0.299+g*0.587+b*0.114;
      if(invert)br=255-br;
      let keep=false;
      if(mode==='dark')keep=br<=threshold; else if(mode==='bright')keep=br>=threshold; else keep=true;
      if(!keep)continue;
      const u=(x+0.5)/w, v=(y+0.5)/h;
      const nx=(u-0.5)*(aspect>=1?1:aspect);
      const ny=(v-0.5)*(aspect>=1?1/aspect:1);
      const alpha=Math.max(0.18,Math.min(1,mode==='bright'?br/255:1-br/255));
      arr.push(nx,ny,u,1-v,alpha,Math.random()*Math.PI*2,Math.random());
      if(arr.length/7>=IPM_GPU_MAX)break;
    }
    if(arr.length/7>=IPM_GPU_MAX)break;
  }
  if(o._ipmBuffer)gl.deleteBuffer(o._ipmBuffer);
  o._ipmBuffer=gl.createBuffer();
  o._ipmCount=Math.floor(arr.length/7);
  o._ipmKey=ipmKey(o);
  gl.bindBuffer(gl.ARRAY_BUFFER,o._ipmBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.STATIC_DRAW);
  return true;
}
function ensureIpmBuffer(o){
  if(!o||o.type!=='imageParticle'||!o.particleTexture)return false;
  const key=ipmKey(o);
  if(!o._ipmBuffer||o._ipmKey!==key||!o._ipmCount)return buildIpmBuffer(o);
  return true;
}
function drawIpm(o){
  if(!ensureIpmBuffer(o))return;
  const cw=canvas.clientWidth,ch=canvas.clientHeight;
  const now=performance.now()/1000;
  const c=hex(o.color||'#ffffff');
  const ipmModeMap={none:0,static:0,pulse:1,ripple:2,swirl:3,explode:4,rain:5,scanner:6,orbit:7,noise:8};
  const oa=objectAudio(o);
  if(o.ipmDestructionEnabled&&o.ipmDestructionAudioEnabled&&oa.passed&&Number(oa.level||0)>=Number(o.ipmDestructionAudioThreshold??.65)){
    const gap=Math.max(0.1,Number(o.ipmDestructionRetrigger??1.5));
    if(!o._ipmDestructionLastAudio||now-o._ipmDestructionLastAudio>=gap){
      triggerIpmDestruction(o.id,{});
      o._ipmDestructionLastAudio=now;
    }
  }
  let destruct=o._ipmDestruction||null;
  if(destruct){
    const elapsed=now-Number(destruct.start||now);
    const dur=Math.max(0.05,Number(destruct.duration||o.ipmDestructionDuration||3));
    const reverse=!!destruct.reverse;
    const returnEnabled=destruct.returnEnabled!==false;
    const returnWindow=dur/Math.max(0.05,Number(destruct.returnSpeed||o.ipmDestructionReturnSpeed||1.2));
    if((reverse&&elapsed>dur)||(returnEnabled&&elapsed>dur+returnWindow)){o._ipmDestruction=null;destruct=null;}
  }
  gl.useProgram(ipmProg);
  gl.bindBuffer(gl.ARRAY_BUFFER,o._ipmBuffer);
  const stride=7*4;
  gl.enableVertexAttribArray(ipmLoc.base); gl.vertexAttribPointer(ipmLoc.base,2,gl.FLOAT,false,stride,0);
  gl.enableVertexAttribArray(ipmLoc.uv); gl.vertexAttribPointer(ipmLoc.uv,2,gl.FLOAT,false,stride,2*4);
  gl.enableVertexAttribArray(ipmLoc.alpha); gl.vertexAttribPointer(ipmLoc.alpha,1,gl.FLOAT,false,stride,4*4);
  gl.enableVertexAttribArray(ipmLoc.phase); gl.vertexAttribPointer(ipmLoc.phase,1,gl.FLOAT,false,stride,5*4);
  gl.enableVertexAttribArray(ipmLoc.rain); gl.vertexAttribPointer(ipmLoc.rain,1,gl.FLOAT,false,stride,6*4);
  gl.uniform2f(ipmLoc.pixelRes,canvas.width,canvas.height);
  gl.uniform2f(ipmLoc.cssRes,cw,ch);
  gl.uniform2f(ipmLoc.originCss,objCssX(o),objCssY(o));
  gl.uniform1f(ipmLoc.rot,Number(o.rotation||0)*Math.PI/180);
  gl.uniform1f(ipmLoc.size,su(o.size||72));
  gl.uniform1f(ipmLoc.time,now);
  gl.uniform1f(ipmLoc.ipmScale,Number(o.ipmScale??1));
  gl.uniform1f(ipmLoc.pointSize,su(o.ipmParticleSize??2.4));
  gl.uniform1f(ipmLoc.opacity,Number(o.ipmOpacity??.9)*Number(o.intensity??1));
  gl.uniform3f(ipmLoc.color,c[0],c[1],c[2]);
  gl.uniform4f(ipmLoc.audio,oa.level,oa.bass,oa.mid,oa.high);
  gl.uniform1i(ipmLoc.ipmMode,ipmModeMap[o.ipmMode||'none']??0);
  gl.uniform1f(ipmLoc.ipmWave,Number(o.ipmWave??12));
  gl.uniform1f(ipmLoc.ipmJitter,Number(o.ipmJitter??4));
  gl.uniform1f(ipmLoc.ipmEffectStrength,Number(o.ipmEffectStrength??60));
  gl.uniform1f(ipmLoc.ipmEffectSpeed,Number(o.ipmEffectSpeed??80));
  gl.uniform1f(ipmLoc.ipmAudioEffectSpeed,Number(o.ipmAudioEffectSpeed??120));
  gl.uniform1f(ipmLoc.ipmAudioEffectStrength,Number(o.ipmAudioEffectStrength??100));
  gl.uniform1f(ipmLoc.ipmAudioEffectPulse,Number(o.ipmAudioEffectPulse??80));
  gl.uniform1f(ipmLoc.ipmAudioMovement,Number(o.ipmAudioMovement??40));
  gl.uniform1f(ipmLoc.ipmAudioSize,Number(o.ipmAudioSize??14));
  gl.uniform1f(ipmLoc.ipmAudioAlpha,Number(o.ipmAudioAlpha??20));
  if(destruct){
    const elapsed=now-Number(destruct.start||now);
    gl.uniform1i(ipmLoc.destructMode,ipmDestructionModeId(destruct.mode));
    gl.uniform1f(ipmLoc.destructTime,elapsed);
    gl.uniform1f(ipmLoc.destructDuration,Math.max(0.05,Number(destruct.duration||3)));
    gl.uniform1f(ipmLoc.destructReverse,destruct.reverse?1:0);
    gl.uniform1f(ipmLoc.destructStrength,Number(destruct.strength||0));
    gl.uniform2f(ipmLoc.destructDirection,Number(destruct.directionX||0),Number(destruct.directionY??-1));
    gl.uniform1f(ipmLoc.destructSpread,Number(destruct.spread||0));
    gl.uniform1f(ipmLoc.destructGravity,Number(destruct.gravity||0));
    gl.uniform1f(ipmLoc.destructReturn,destruct.returnEnabled===false?0:1);
    gl.uniform1f(ipmLoc.destructReturnSpeed,Number(destruct.returnSpeed||1));
    gl.uniform1f(ipmLoc.destructRandomness,Number(destruct.randomness||0));
    gl.uniform1f(ipmLoc.destructClusterSize,Number(destruct.clusterSize||12));
    gl.uniform1f(ipmLoc.destructParticleFade,Number(destruct.particleFade||0));
    gl.uniform1f(ipmLoc.destructFadeTime,Math.max(0.01,Number(destruct.fadeTime??o.ipmDestructionFadeTime??1.2)));
    gl.uniform2f(ipmLoc.destructCenter,Number(destruct.centerX||0),Number(destruct.centerY||0));
    gl.uniform1f(ipmLoc.destructSeed,Number(destruct.seed||0));
  }else{
    gl.uniform1i(ipmLoc.destructMode,0);
    gl.uniform1f(ipmLoc.destructTime,-1);
    gl.uniform1f(ipmLoc.destructDuration,1);
    gl.uniform1f(ipmLoc.destructReverse,0);
    gl.uniform1f(ipmLoc.destructStrength,0);
    gl.uniform2f(ipmLoc.destructDirection,0,-1);
    gl.uniform1f(ipmLoc.destructSpread,0);
    gl.uniform1f(ipmLoc.destructGravity,0);
    gl.uniform1f(ipmLoc.destructReturn,1);
    gl.uniform1f(ipmLoc.destructReturnSpeed,1);
    gl.uniform1f(ipmLoc.destructRandomness,0);
    gl.uniform1f(ipmLoc.destructClusterSize,12);
    gl.uniform1f(ipmLoc.destructParticleFade,0);
    gl.uniform1f(ipmLoc.destructFadeTime,1);
    gl.uniform2f(ipmLoc.destructCenter,0,0);
    gl.uniform1f(ipmLoc.destructSeed,0);
  }
  gl.uniform1f(ipmLoc.flipX,o.ipmFlipX?1:0);
  gl.uniform1f(ipmLoc.flipY,o.ipmFlipY?1:0);
  gl.uniform1f(ipmLoc.useImageColors,(o.ipmUseImageColors??false)?1:0);
  gl.uniform1f(ipmLoc.mono,o.ipmMono?1:0);
  gl.uniform1f(ipmLoc.invert,o.ipmInvert?1:0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,o.particleTexture);
  gl.uniform1i(ipmLoc.image,0);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.drawArrays(gl.POINTS,0,o._ipmCount||0);
}

function drawParticle(o){
  const cw=canvas.clientWidth, ch=canvas.clientHeight;
  const now=performance.now()/1000;
  let trigger=updateParticleTrigger(o,now);
  if(o.type==='imageParticle') trigger={local:now,active:true,strength:1,permanent:true,unlimited:true};
  const c=hex(o.color||'#66ccff'), alt=hex(o.particleAltColor||'#ffffff');
  const isIpm=o.type==='imageParticle';
  const amount=isIpm?Number(o.ipmDensity??.78):Number(o.particleAmount??.7);
  let drawCount=Math.max(0,Math.min(PARTICLE_GPU_MAX,Math.floor(160+(Math.max(0,amount)/20)*(PARTICLE_GPU_MAX-160))));
  let ipmGridX=2, ipmGridY=2;
  if(isIpm){
    const aspect=Math.max(0.05,Number(o.particleImageAspect||1));
    const desired=Math.max(4,drawCount);
    // Raster wird so berechnet, dass immer das komplette Bild abgedeckt wird.
    // Wenn das GPU-Maximum erreicht wird, wird die Rasterauflösung gleichmäßig
    // reduziert, statt unten oder oben Bildzeilen abzuschneiden.
    ipmGridX=Math.max(2,Math.round(Math.sqrt(desired*aspect)));
    ipmGridY=Math.max(2,Math.round(ipmGridX/aspect));
    let cells=ipmGridX*ipmGridY;
    if(cells>PARTICLE_GPU_MAX){
      const shrink=Math.sqrt(PARTICLE_GPU_MAX/cells);
      ipmGridX=Math.max(2,Math.floor(ipmGridX*shrink));
      ipmGridY=Math.max(2,Math.floor(ipmGridY*shrink));
      cells=ipmGridX*ipmGridY;
      // Falls Rundung knapp darüber liegt, in der längeren Achse reduzieren.
      while(cells>PARTICLE_GPU_MAX){
        if(ipmGridX>=ipmGridY) ipmGridX--; else ipmGridY--;
        cells=ipmGridX*ipmGridY;
      }
    }
    drawCount=Math.min(PARTICLE_GPU_MAX,ipmGridX*ipmGridY);
  }
  if(drawCount<=0)return;
  if(isIpm && !o.particleTexture)return;
  gl.useProgram(particleProg);
  gl.bindBuffer(gl.ARRAY_BUFFER,particleIndexBuffer);
  gl.enableVertexAttribArray(particleLoc.idx);
  gl.vertexAttribPointer(particleLoc.idx,1,gl.FLOAT,false,0,0);
  gl.uniform2f(particleLoc.pixelRes,canvas.width,canvas.height);
  gl.uniform2f(particleLoc.cssRes,cw,ch);
  gl.uniform2f(particleLoc.originCss,objCssX(o),objCssY(o));
  gl.uniform1f(particleLoc.rot,Number(o.rotation||0)*Math.PI/180);
  gl.uniform1f(particleLoc.time,now + (Number((o.id||'').replace(/\D/g,''))||0)*0.131);
  gl.uniform1f(particleLoc.localTime,trigger.local);
  gl.uniform1f(particleLoc.triggerActive,trigger.active?1:0);
  gl.uniform1f(particleLoc.permanent,trigger.permanent?1:0);
  gl.uniform1f(particleLoc.scale,su(o.size||72));
  gl.uniform1f(particleLoc.intensity,Number(o.intensity??1)*trigger.strength);
  gl.uniform1f(particleLoc.amount,amount);
  gl.uniform1f(particleLoc.drawCount,drawCount);
  gl.uniform1f(particleLoc.ipmGridX,ipmGridX);
  gl.uniform1f(particleLoc.ipmGridY,ipmGridY);
  gl.uniform1f(particleLoc.speed,Number(o.particleSpeed??1));
  gl.uniform1f(particleLoc.spread,Number(o.particleSpread??70));
  gl.uniform1f(particleLoc.life,Number(o.particleLife??2.5));
  gl.uniform1f(particleLoc.emissionDuration,trigger.permanent?Math.max(0.2,Number(o.particleLife??2.5)):Number(o.particleEmissionDuration??1.0));
  gl.uniform1f(particleLoc.gravity,Number(o.particleGravity??.4));
  gl.uniform1f(particleLoc.turbulence,Number(o.particleTurbulence??.4));
  gl.uniform1f(particleLoc.particleSize,isIpm?su(o.ipmParticleSize??2.4):su(o.particleSize??3));
  gl.uniform1f(particleLoc.glow,isIpm?0:Number(o.particleGlow??.7));
  gl.uniform1f(particleLoc.opacity,isIpm?Number(o.ipmOpacity??.9):Number(o.particleOpacity??.8));
  gl.uniform1f(particleLoc.blastEnergy,Number(o.particleBlastEnergy??1));
  gl.uniform1f(particleLoc.shockwaveRadius,Number(o.particleShockwaveRadius??1));
  gl.uniform1f(particleLoc.initialVelocity,Number(o.particleInitialVelocity??1));
  gl.uniform1f(particleLoc.velocitySpread,Number(o.particleVelocitySpread??1));
  gl.uniform1f(particleLoc.explosionTurbulence,Number(o.particleExplosionTurbulence??1));
  gl.uniform1f(particleLoc.updraft,Number(o.particleUpdraft??1));
  gl.uniform1f(particleLoc.fireballDuration,Number(o.particleFireballDuration??.42));
  gl.uniform1f(particleLoc.smokeAmount,Number(o.particleSmokeAmount??.75));
  gl.uniform1f(particleLoc.smokeLifetime,Number(o.particleSmokeLifetime??1));
  gl.uniform1f(particleLoc.debrisAmount,Number(o.particleDebrisAmount??.35));
  gl.uniform1f(particleLoc.debrisGravity,Number(o.particleDebrisGravity??1));
  gl.uniform1f(particleLoc.shockwaveVisible,o.particleShockwaveVisible===false?0:1);
  gl.uniform1f(particleLoc.jetPressure,Number(o.particleJetPressure??1));
  gl.uniform1f(particleLoc.jetVelocity,Number(o.particleJetVelocity??1));
  gl.uniform1f(particleLoc.jetWidth,Number(o.particleJetWidth??1));
  gl.uniform1f(particleLoc.jetLength,Number(o.particleJetLength??1));
  gl.uniform1f(particleLoc.coreStability,Number(o.particleCoreStability??.85));
  gl.uniform1f(particleLoc.edgeTurbulence,Number(o.particleEdgeTurbulence??1));
  gl.uniform1f(particleLoc.updraftStrength,Number(o.particleUpdraftStrength??1));
  gl.uniform1f(particleLoc.tipTurbulence,Number(o.particleTipTurbulence??1));
  gl.uniform1f(particleLoc.brightness,Number(o.particleBrightness??1));
  gl.uniform1f(particleLoc.glowStrength,Number(o.particleGlowStrength??1));
  gl.uniform1f(particleLoc.jetSmokeAmount,Number(o.particleJetSmokeAmount??.25));
  { const w=windForObject(o,'particle'); gl.uniform2f(particleLoc.wind,w.cssX,w.cssY); gl.uniform1f(particleLoc.windStrength,w.strength); gl.uniform1f(particleLoc.windTurbulence,w.turbCss); }
  gl.uniform3f(particleLoc.color,c[0],c[1],c[2]);
  gl.uniform3f(particleLoc.altColor,alt[0],alt[1],alt[2]);
  gl.uniform1i(particleLoc.mode,o.type==='imageParticle'?10:particleModeId(o.particleMode));
  const ipmModeMap={none:0,static:0,pulse:1,ripple:2,swirl:3,explode:4,rain:5,scanner:6,orbit:7,noise:8,scatter:2,waves:2,bassExplosion:4,highFlicker:8,decayReturn:2};
  { const oa=objectAudio(o); gl.uniform4f(particleLoc.audio,oa.level,oa.bass,oa.mid,oa.high); }
  gl.uniform1i(particleLoc.ipmMode,ipmModeMap[o.ipmMode||'static']||0);
  gl.uniform1f(particleLoc.ipmStrength,Number(o.ipmReaction??.4)*audioState.sensitivity*clamp01(objectAudio(o).level*1.8));
  gl.uniform1f(particleLoc.ipmReturn,Number(o.ipmReturn??.45));
  gl.uniform1f(particleLoc.ipmScale,Number(o.ipmScale??1));
  gl.uniform1f(particleLoc.imageAspect,Number(o.particleImageAspect||1));
  gl.uniform1f(particleLoc.ipmUseImageColors,(o.ipmUseImageColors??true)?1:0);
  gl.uniform1f(particleLoc.ipmMono,o.ipmMono?1:0);
  gl.uniform1f(particleLoc.ipmInvert,o.ipmInvert?1:0);
  gl.uniform1f(particleLoc.ipmFlipX,o.ipmFlipX?1:0);
  gl.uniform1f(particleLoc.ipmFlipY,o.ipmFlipY?1:0);
  gl.uniform1f(particleLoc.ipmWave,Number(o.ipmWave??12));
  gl.uniform1f(particleLoc.ipmJitter,Number(o.ipmJitter??4));
  gl.uniform1f(particleLoc.ipmEffectStrength,Number(o.ipmEffectStrength??60));
  gl.uniform1f(particleLoc.ipmEffectSpeed,Number(o.ipmEffectSpeed??80));
  gl.uniform1f(particleLoc.ipmAudioEffectSpeed,Number(o.ipmAudioEffectSpeed??120));
  gl.uniform1f(particleLoc.ipmAudioEffectStrength,Number(o.ipmAudioEffectStrength??100));
  gl.uniform1f(particleLoc.ipmAudioEffectPulse,Number(o.ipmAudioEffectPulse??80));
  gl.uniform1f(particleLoc.ipmAudioMovement,Number(o.ipmAudioMovement??40));
  gl.uniform1f(particleLoc.ipmAudioSize,Number(o.ipmAudioSize??14));
  gl.uniform1f(particleLoc.ipmAudioAlpha,Number(o.ipmAudioAlpha??20));
  gl.uniform1f(particleLoc.ipmThreshold,Number(o.ipmThreshold??145));
  gl.uniform1i(particleLoc.ipmPixelMode,({dark:0,bright:1,all:2}[o.ipmPixelMode||'dark']??0));
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,o.particleTexture||initTexture._fallback||(initTexture._fallback=initTexture()));
  gl.uniform1i(particleLoc.image,0);
  gl.uniform1i(particleLoc.useImage,o.particleTexture?1:0);
  gl.uniform1i(particleLoc.emitterShape,(o.particleEmitterShape||'point')==='line'?1:0);
  gl.uniform1f(particleLoc.emitterLength,su(o.particleEmitterLength??120));
  gl.uniform1f(particleLoc.selected,isSelected(o)?1:0);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
  if((o.particleMode==='ash'||o.particleMode==='dust'||o.particleMode==='snow'||o.type==='imageParticle'||o.particleMode==='imageParticles')) gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.drawArrays(gl.POINTS,0,drawCount);
}

let engineSceneTarget=null;
let postSceneTarget=null;
let vrSceneTarget=null;
const vrState={active:false,session:null,referenceSpace:null,referenceSpaceType:'local',baseLayer:null,wasMenuHidden:false,framePending:false};
function ensureRenderTarget(target){
  const w=Math.max(1,canvas.width), h=Math.max(1,canvas.height);
  if(!target){
    const tex=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    const fbo=gl.createFramebuffer();
    target={tex,fbo,w:0,h:0};
  }
  if(target.w!==w || target.h!==h){
    target.w=w; target.h=h;
    gl.bindTexture(gl.TEXTURE_2D,target.tex);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.bindFramebuffer(gl.FRAMEBUFFER,target.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,target.tex,0);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  }
  return target;
}
function ensurePostSceneTarget(){
  postSceneTarget=ensureRenderTarget(postSceneTarget);
  return postSceneTarget;
}
function ensureEngineSceneTarget(){
  engineSceneTarget=ensureRenderTarget(engineSceneTarget);
  return engineSceneTarget;
}
function ensureVrSceneTarget(){
  vrSceneTarget=ensureRenderTarget(vrSceneTarget);
  return vrSceneTarget;
}
function renderEngineSceneTexture(ordered){
  const target=ensureEngineSceneTarget();
  gl.bindFramebuffer(gl.FRAMEBUFFER,target.fbo);
  gl.viewport(0,0,target.w,target.h);
  gl.clearColor(.02,.028,.048,1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  const split=splitByBackgroundLayer(ordered);
  split.behind.forEach(e=>{ if(!((e.o.type==='screen' && e.o.screenMode==='engine')||e.o.type==='mandalaVisualizer')) renderObject(e.o); });
  drawBackground();
  gl.enable(gl.BLEND);
  drawBackgroundDim();
  if(scene.showGrid) drawGrid();
  split.front.forEach(e=>{
    // Engine-Ausschnitt-Screens werden in der Quelltextur bewusst ausgelassen,
    // damit kein rekursiver Spiegel-im-Spiegel-Effekt oder leerer Feedback-Frame entsteht.
    if((e.o.type==='screen' && e.o.screenMode==='engine')||e.o.type==='mandalaVisualizer') return;
    renderObject(e.o);
  });
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  gl.viewport(0,0,canvas.width,canvas.height);
}



function fitDrawImageToCanvas(ctx,img,w,h,fit){
  if(!ctx||!img)return;
  const iw=img.naturalWidth||img.width||1;
  const ih=img.naturalHeight||img.height||1;
  const srcAspect=iw/Math.max(1,ih);
  const dstAspect=w/Math.max(1,h);
  let dx=0,dy=0,dw=w,dh=h;
  if(fit==='contain'){
    if(srcAspect>dstAspect){dw=w;dh=w/srcAspect;dy=(h-dh)/2;}else{dh=h;dw=h*srcAspect;dx=(w-dw)/2;}
  }else if(fit==='cover'){
    if(srcAspect>dstAspect){dh=h;dw=h*srcAspect;dx=(w-dw)/2;}else{dw=w;dh=w/srcAspect;dy=(h-dh)/2;}
  }
  ctx.drawImage(img,dx,dy,dw,dh);
}
function ensureScreenTextBackgroundImage(o){
  if(!o||!o.screenTextBgImageData)return null;
  if(o.screenTextBgImageElement&&o.screenTextBgImageReady)return o.screenTextBgImageElement;
  const img=new Image();
  img.onload=()=>{o.screenTextBgImageReady=true;o.screenTextDirty=true;};
  img.src=o.screenTextBgImageData;
  o.screenTextBgImageElement=img;
  o.screenTextBgImageReady=false;
  return null;
}
function loadScreenTextBackgroundImage(o,file){
  if(!o||o.type!=='screen'||!file)return;
  const r=new FileReader();
  r.onload=()=>{
    o.screenTextBgImageName=file.name;
    o.screenTextBgImageData=r.result;
    o.screenTextBgMode='image';
    o.screenTextBgImageElement=null;
    o.screenTextBgImageReady=false;
    o.screenTextDirty=true;
    ensureScreenTextBackgroundImage(o);
    if(fields.ScreenTextBgMode)fields.ScreenTextBgMode.value='image';
    if(screenTextBgInfo)screenTextBgInfo.textContent='Geladen: '+file.name;
  };
  r.readAsDataURL(file);
}
function clearScreenTextBackgroundImage(o){
  if(!o||o.type!=='screen')return;
  o.screenTextBgImageName='';
  o.screenTextBgImageData=null;
  o.screenTextBgImageElement=null;
  o.screenTextBgImageReady=false;
  if(o.screenTextBgMode==='image')o.screenTextBgMode='transparent';
  o.screenTextDirty=true;
  if(screenTextBgInfo)screenTextBgInfo.textContent='Kein Texthintergrund-Bild geladen.';
}

function wrapScreenCanvasText(ctx,text,maxWidth){
  const lines=[];
  for(const paragraph of String(text??'').replace(/\r/g,'').split('\n')){
    if(paragraph===''){lines.push('');continue;}
    const words=paragraph.split(/\s+/);
    let line='';
    for(const word of words){
      const candidate=line?line+' '+word:word;
      if(!line||ctx.measureText(candidate).width<=maxWidth){line=candidate;continue;}
      lines.push(line);line='';
      if(ctx.measureText(word).width<=maxWidth){line=word;continue;}
      let part='';
      for(const char of word){
        if(part&&ctx.measureText(part+char).width>maxWidth){lines.push(part);part=char;}else part+=char;
      }
      line=part;
    }
    lines.push(line);
  }
  return lines.length?lines:[''];
}

function ensureScreenTextTexture(o){
  if(!o||!['screen','text'].includes(o.type))return null;
  if(!o.screenTextCanvas){
    o.screenTextCanvas=document.createElement('canvas');
    o.screenTextCanvas.width=1024;
    o.screenTextCanvas.height=256;
    o.screenTextDirty=true;
  }
  if(!o.screenTextTexture){
    o.screenTextTexture=initTexture();
    o.screenTextDirty=true;
  }
  const canvas2=o.screenTextCanvas;
  const screenAspect=Math.max(.1,Number(o.screenWidth||260)/Math.max(1,Number(o.screenHeight||120)));
  const desiredTextWidth=Math.max(128,Math.min(2048,Math.round(canvas2.height*screenAspect)));
  if(canvas2.width!==desiredTextWidth){
    canvas2.width=desiredTextWidth;
    o.screenTextDirty=true;
  }
  const ctx=canvas2.getContext('2d');
  const textSource=String(o.screenTextSource||'custom');
  const text=String(textSource==='songTitle'?(audioTitleState.title||titleFromFileName(audioTitleState.fileName||'')):(o.screenText??''));
  const fontSize=Math.max(8,Math.min(240,Number(o.screenTextSize??48)));
  const fontFamily=String(o.screenTextFont||'Arial');
  const color=String(o.screenTextColor||'#ffffff');
  const bold=o.screenTextBold!==false;
  const italic=!!o.screenTextItalic;
  const underline=!!o.screenTextUnderline;
  const textAlign=['left','right'].includes(o.screenTextAlign)?o.screenTextAlign:'center';
  const lineHeight=Math.max(.8,Math.min(2.5,Number(o.screenTextLineHeight??1.2)));
  const mode=String(o.screenTextMode||'static');
  const speed=Math.max(0,Number(o.screenTextSpeed??80));
  const bgMode=String(o.screenTextBgMode||'transparent');
  const bgColor=String(o.screenTextBgColor||'#000000');
  const bgOpacity=Math.max(0,Math.min(1,Number(o.screenTextBgOpacity??1)));
  const bgFit=String(o.screenTextBgFit||'cover');
  const now=performance.now()/1000;

  // Lauftext wird pro Frame aktualisiert. Festtext nur bei Änderung.
  if(mode!=='marquee' && !o.screenTextDirty)return o.screenTextTexture;

  ctx.clearRect(0,0,canvas2.width,canvas2.height);
  if(bgMode==='color'){
    ctx.save();
    ctx.globalAlpha=bgOpacity;
    ctx.fillStyle=bgColor;
    ctx.fillRect(0,0,canvas2.width,canvas2.height);
    ctx.restore();
  }else if(bgMode==='image'){
    const bgImg=ensureScreenTextBackgroundImage(o);
    if(bgImg){
      ctx.save();
      ctx.globalAlpha=bgOpacity;
      fitDrawImageToCanvas(ctx,bgImg,canvas2.width,canvas2.height,bgFit);
      ctx.restore();
    }else{
      ctx.save();
      ctx.globalAlpha=Math.min(0.25,bgOpacity);
      ctx.fillStyle=bgColor;
      ctx.fillRect(0,0,canvas2.width,canvas2.height);
      ctx.restore();
    }
  }
  ctx.font=`${italic?'italic ':''}${bold?'700':'400'} ${fontSize}px ${fontFamily}`;
  ctx.textBaseline='middle';
  ctx.fillStyle=color;
  ctx.shadowColor='rgba(0,0,0,0.55)';
  ctx.shadowBlur=Math.max(2,fontSize*0.10);
  ctx.shadowOffsetX=Math.max(1,fontSize*0.035);
  ctx.shadowOffsetY=Math.max(1,fontSize*0.035);
  const marqueeText=(text||' ').replace(/\s*\n\s*/g,'   ');
  const metrics=ctx.measureText(marqueeText);
  const tw=Math.max(1,metrics.width);
  if(mode==='marquee'){
    const cycle=canvas2.width+tw+80;
    const x=canvas2.width-((now*speed)%cycle);
    ctx.textAlign='left';
    ctx.fillText(marqueeText,x,canvas2.height/2);
    if(underline){
      const y=canvas2.height/2+fontSize*.48;
      ctx.fillRect(x,y,tw,Math.max(1,fontSize*.055));
    }
  }else{
    const padding=Math.max(24,fontSize*.65);
    const lines=wrapScreenCanvasText(ctx,text||' ',canvas2.width-padding*2);
    const lineStep=fontSize*lineHeight;
    const firstY=canvas2.height/2-(lines.length-1)*lineStep/2;
    ctx.textAlign='left';
    lines.forEach((line,index)=>{
      const y=firstY+index*lineStep;
      const renderedLine=line||' ';
      const width=Math.max(1,ctx.measureText(renderedLine).width);
      const left=textAlign==='left'
        ? padding
        : textAlign==='right'
          ? canvas2.width-padding-width
          : (canvas2.width-width)/2;
      ctx.fillText(renderedLine,left,y);
      if(underline){
        ctx.fillRect(left,y+fontSize*.48,width,Math.max(1,fontSize*.055));
      }
    });
  }

  gl.bindTexture(gl.TEXTURE_2D,o.screenTextTexture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas2);
  o.screenTextDirty=false;
  return o.screenTextTexture;
}

function drawScreen(o){
  const cw=canvas.clientWidth, ch=canvas.clientHeight;
  const c=hex(o.color||'#2fd6ff'), alt=hex(o.screenAltColor||'#ff4fd8');
  const wind=windForObject(o,'screen');
  gl.useProgram(screenProg);
  gl.bindBuffer(gl.ARRAY_BUFFER,quad);
  gl.enableVertexAttribArray(screenLoc.pos);
  gl.vertexAttribPointer(screenLoc.pos,2,gl.FLOAT,false,0,0);
  gl.uniform2f(screenLoc.pixelRes,canvas.width,canvas.height);
  gl.uniform2f(screenLoc.cssRes,cw,ch);
  gl.uniform2f(screenLoc.originCss,objCssX(o)+wind.cssX*0.18,objCssY(o)+wind.cssY*0.18);
  gl.uniform2f(screenLoc.sizeCss,su(o.screenWidth||260),su(o.screenHeight||120));
  gl.uniform1f(screenLoc.rot,Number(o.rotation||0)*Math.PI/180);
  gl.uniform1f(screenLoc.opacity,Number(o.screenOpacity??1));
  gl.uniform1f(screenLoc.dim,sceneDimmingForTarget('screen',o));
  gl.uniform1f(screenLoc.brightness,Number(o.screenBrightness??1)*(Number(o.intensity??1)));
  gl.uniform1f(screenLoc.scanlines,Number(o.screenScanlines??0.3));
  gl.uniform1f(screenLoc.audioReaction,Number(o.screenAudio??0.5)*audioState.sensitivity);
  gl.uniform1f(screenLoc.time,performance.now()/1000);
  { const oa=objectAudio(o); gl.uniform4f(screenLoc.audio,oa.level,oa.bass,oa.mid,oa.high); }
  gl.uniform3f(screenLoc.color,c[0],c[1],c[2]);
  gl.uniform3f(screenLoc.altColor,alt[0],alt[1],alt[2]);
  gl.uniform1f(screenLoc.altMix,screenAltMix(o));
  gl.uniform1i(screenLoc.mode,screenModeId(o.screenMode));
  gl.uniform1f(screenLoc.selected,isSelected(o)?1:0);
  const useEngine=(o.screenMode==='engine');
  const useText=(o.type==='text'||o.screenMode==='text');
  const useMp3Cover=(o.screenMode==='mp3cover');
  const textTex=useText?ensureScreenTextTexture(o):null;
  const coverTex=(useMp3Cover&&audioCoverState.found)?audioCoverState.texture:null;
  const hasMedia=useEngine?true:(useText?!!textTex:(useMp3Cover?!!coverTex:!!(o.screenTexture&&(o.screenMediaType==='image'||o.screenMediaType==='video'))));
  // Engine-Ausschnitt nutzt den letzten vollständig gerenderten Frame als Quelle.
  // Der Capture darf NICHT während drawScreen() aktualisiert werden, sonst ist der
  // Screen seine eigene Quelle oder bekommt nur einen unvollständigen Renderstand.
  let engineTex=useEngine?ensureEngineSceneTarget().tex:null;
  if(hasMedia&&o.screenMediaType==='video'&&o.screenMediaElement&&o.screenMediaElement.readyState>=2){
    gl.bindTexture(gl.TEXTURE_2D,o.screenTexture);
    try{gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,o.screenMediaElement);}catch(e){}
  }
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,useEngine?engineTex:(useText?textTex:(useMp3Cover?(coverTex||initTexture._fallback||(initTexture._fallback=initTexture())):(hasMedia?o.screenTexture:initTexture._fallback||(initTexture._fallback=initTexture())))));
  gl.uniform1i(screenLoc.media,0);
  gl.uniform1i(screenLoc.useMedia,hasMedia?1:0);
  gl.uniform1f(screenLoc.mediaAspect,useEngine?(Number(o.screenEngineW||640)/Math.max(1,Number(o.screenEngineH||360))):(useText?(Number(o.screenTextCanvas&&o.screenTextCanvas.width||1024)/Math.max(1,Number(o.screenTextCanvas&&o.screenTextCanvas.height||256))):(useMp3Cover?(audioCoverState.aspect||1):getScreenMediaAspect(o))));
  gl.uniform1i(screenLoc.useEngine,useEngine?1:0);
  const cropX=su(o.screenEngineX??0), cropY=su(o.screenEngineY??0), cropW=su(o.screenEngineW??640), cropH=su(o.screenEngineH??360);
  gl.uniform4f(screenLoc.engineCropCss,cropX,cropY,cropW,cropH);
  gl.uniform1i(screenLoc.mediaFit,useText?2:mediaFitId(o.screenMediaFit||'cover'));
  gl.uniform1i(screenLoc.flipX,o.screenFlipX?1:0);
  gl.uniform1i(screenLoc.flipY,o.screenFlipY?1:0);
  const frameMode=o.type==='text'?'hidden':(o.screenFrameMode||'visible');
  const frameVisible=(frameMode==='visible'||(frameMode==='editor'&&!scene.uiHidden))?1:0;
  gl.uniform1f(screenLoc.frameVisible,frameVisible);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.drawArrays(gl.TRIANGLES,0,6);
}

function getGreenscreenRenderSize(o){
  let w=Number(o.greenscreenWidth||480);
  let h=Number(o.greenscreenHeight||270);
  if(o.greenscreenKeepAspect!==false){
    let aspect=Number(o.greenscreenMediaAspect||16/9);
    if(o.greenscreenSwapAspect&&aspect>0)aspect=1/aspect;
    if(aspect>0){
      // Breite bleibt die Mastergröße. Die sichtbare Höhe folgt dem Quellformat,
      // damit Menschen im Greenscreen-Video nicht breitgezogen werden.
      h=w/aspect;
    }
  }
  return {w:su(w),h:su(h),rawW:w,rawH:h};
}
function drawGreenscreenShadow(o){
  if(!o.greenscreenShadowEnabled||Number(o.greenscreenShadowOpacity??0)<=0)return;
  const cw=canvas.clientWidth,ch=canvas.clientHeight;
  gl.useProgram(greenscreenShadowProg);
  gl.bindBuffer(gl.ARRAY_BUFFER,quad);
  gl.enableVertexAttribArray(greenscreenShadowLoc.pos);
  gl.vertexAttribPointer(greenscreenShadowLoc.pos,2,gl.FLOAT,false,0,0);
  gl.uniform2f(greenscreenShadowLoc.pixelRes,canvas.width,canvas.height);
  gl.uniform2f(greenscreenShadowLoc.cssRes,cw,ch);
  { const wind=windForObject(o,'greenscreen'); gl.uniform2f(greenscreenShadowLoc.originCss,objCssX(o)+su(o.greenscreenShadowOffsetX??0)+wind.cssX*0.15,objCssY(o)+su(o.greenscreenShadowOffsetY??130)+wind.cssY*0.15); }
  gl.uniform2f(greenscreenShadowLoc.sizeCss,su(o.greenscreenShadowWidth??280),su(o.greenscreenShadowHeight??80));
  gl.uniform1f(greenscreenShadowLoc.rot,Number(o.rotation||0)*Math.PI/180);
  gl.uniform1f(greenscreenShadowLoc.softness,Number(o.greenscreenShadowSoftness??.65));
  gl.uniform1f(greenscreenShadowLoc.opacity,Number(o.greenscreenShadowOpacity??.45)*Number(o.intensity??1));
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.drawArrays(gl.TRIANGLES,0,6);
}
function drawGreenscreen(o){
  const cw=canvas.clientWidth,ch=canvas.clientHeight;
  const wind=windForObject(o,'greenscreen');
  if(o.greenscreenMediaType==='video'||o.greenscreenMediaType==='webcam'){
    if(o.greenscreenTexture&&o.greenscreenMediaElement&&o.greenscreenMediaElement.readyState>=2){
      gl.bindTexture(gl.TEXTURE_2D,o.greenscreenTexture);
      try{gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,o.greenscreenMediaElement);}catch(e){}
    }
  }
  gl.useProgram(greenscreenProg);
  gl.bindBuffer(gl.ARRAY_BUFFER,quad);
  gl.enableVertexAttribArray(greenscreenLoc.pos);
  gl.vertexAttribPointer(greenscreenLoc.pos,2,gl.FLOAT,false,0,0);
  gl.uniform2f(greenscreenLoc.pixelRes,canvas.width,canvas.height);
  gl.uniform2f(greenscreenLoc.cssRes,cw,ch);
  gl.uniform2f(greenscreenLoc.originCss,objCssX(o)+wind.cssX*0.18,objCssY(o)+wind.cssY*0.18);
  const gsSize=getGreenscreenRenderSize(o);
  gl.uniform2f(greenscreenLoc.sizeCss,gsSize.w,gsSize.h);
  gl.uniform1f(greenscreenLoc.rot,Number(o.rotation||0)*Math.PI/180);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,o.greenscreenTexture||initTexture._fallback||(initTexture._fallback=initTexture()));
  gl.uniform1i(greenscreenLoc.video,0);
  gl.uniform1i(greenscreenLoc.hasVideo,(o.greenscreenTexture&&o.greenscreenMediaElement&&o.greenscreenMediaElement.readyState>=2)?1:0);
  gl.uniform1i(greenscreenLoc.chromaKeyEnabled,o.greenscreenChromaKeyEnabled!==false?1:0);
  gl.uniform1f(greenscreenLoc.tolerance,Number(o.greenscreenTolerance??.32));
  gl.uniform1f(greenscreenLoc.softness,Number(o.greenscreenSoftness??.12));
  gl.uniform1f(greenscreenLoc.edgeTrim,Number(o.greenscreenEdgeTrim??0));
  gl.uniform1f(greenscreenLoc.spillReduction,Number(o.greenscreenSpillReduction??0));
  gl.uniform1f(greenscreenLoc.edgeDarken,Number(o.greenscreenEdgeDarken??0));
  const gKey=hex(o.greenscreenKeyColor||'#00ff00');
  gl.uniform3f(greenscreenLoc.keyColor,gKey[0],gKey[1],gKey[2]);
  gl.uniform1f(greenscreenLoc.opacity,Number(o.greenscreenOpacity??1)*Number(o.intensity??1));
  gl.uniform1f(greenscreenLoc.dim,sceneDimmingForTarget('greenscreen',o));
  gl.uniform1f(greenscreenLoc.selected,isSelected(o)?1:0);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.drawArrays(gl.TRIANGLES,0,6);
}
function drawBody(o){
  if(o.type==='imageParticle')return;
  if(o.type==='light'){drawLightPoint(o);return;}
  if(o.type==='screen'||o.type==='visualizer'||o.type==='greenscreen'||o.type==='mandalaVisualizer'){return;}
  const cw=canvas.clientWidth, ch=canvas.clientHeight;
  const c=hex(o.color);gl.useProgram(shapeProg);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.enableVertexAttribArray(loc.a);gl.vertexAttribPointer(loc.a,2,gl.FLOAT,false,0,0);
  gl.uniform2f(loc.res,cw,ch);gl.uniform2f(loc.pos,objCssX(o),objCssY(o));gl.uniform1f(loc.rot,effectiveRotation(o)*Math.PI/180);
  let pts=shapePoints(o.type);
  if(o.type==='particle' && (o.particleEmitterShape||'point')==='line'){const len=su(o.particleEmitterLength??120), th=Math.max(3*stageScale(),su(o.size||72)*0.08); pts=[-th/2,-len/2, th/2,-len/2, th/2,len/2, -th/2,len/2]; gl.uniform1f(loc.scale,1);}else{gl.uniform1f(loc.scale,(o.type==='light'?Math.max(12*stageScale(),su(o.size)*.24):su(o.size)));}
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pts),gl.STATIC_DRAW);
  let bodyAlpha=isSelected(o)?1:.88;
  if(o.type==='particle') bodyAlpha=Math.max(0,1-Number(o.particleEmitterTransparency??0));
  if(o.type==='fog'){
    // Nebelemitter-Transparenz muss auch den geometrischen Emitterkörper steuern.
    // Vorher wurde nur der Glow-Punkt geregelt; der normale Kreis aus drawBody()
    // blieb mit Alpha .88 sichtbar und überdeckte die Einstellung.
    bodyAlpha=Math.max(0,Math.min(1,Number(o.fogEmitterOpacity??0.44)));
    // Bei komplett ausgeblendetem Emitter nichts mehr zeichnen. Der Nebel selbst
    // bleibt davon unberührt und wird weiterhin über Nebel-Transparenz geregelt.
    if(bodyAlpha<=0.001)return;
  }
  gl.uniform4f(loc.color,c[0],c[1],c[2],bodyAlpha);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.drawArrays((o.type==='pyro'||o.type==='confetti')?gl.TRIANGLES:gl.TRIANGLE_FAN,0,pts.length/2);
}
function drawBeam(o){
  const cw=canvas.clientWidth, ch=canvas.clientHeight;
  const c=activeColor(o);
  const la=lightAudio(o);gl.useProgram(beamProg);gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.enableVertexAttribArray(beamLoc.pos);gl.vertexAttribPointer(beamLoc.pos,2,gl.FLOAT,false,0,0);
  gl.uniform2f(beamLoc.pixelRes,canvas.width,canvas.height);
  gl.uniform2f(beamLoc.cssRes,cw,ch);
  gl.uniform2f(beamLoc.originCss,objCssX(o),objCssY(o));
  gl.uniform1f(beamLoc.rot,effectiveRotation(o)*Math.PI/180);
  gl.uniform1f(beamLoc.range,su(o.range||260));
  const beamEmitterShape=o.type==='light'?(o.lightEmitterShape||'point'):'point';
  gl.uniform1i(beamLoc.emitterShape,beamEmitterShape==='rectangle'?2:beamEmitterShape==='line'?1:0);
  gl.uniform1i(beamLoc.rectangleMode,o.lightRectangleEmission==='inward'?1:o.lightRectangleEmission==='solid'?2:0);
  gl.uniform1f(beamLoc.emitterLength,beamEmitterShape==='line'?su(o.lightEmitterLength??240):0);
  gl.uniform2f(beamLoc.emitterSize,su(o.lightEmitterWidth??480),su(o.lightEmitterHeight??270));
  const ambiBoost=(ambilightState.active&&ambilightState.strength>1)?(1+(ambilightState.strength-1)*0.85):1;
  gl.uniform1f(beamLoc.angle,la.angle);gl.uniform1f(beamLoc.soft,o.softness??.55);gl.uniform1f(beamLoc.intensity,la.intensity*(isSelected(o)?1.12:1)*ambiBoost);gl.uniform3f(beamLoc.color,c[0],c[1],c[2]);gl.blendFunc(gl.ONE,gl.ONE);gl.drawArrays(gl.TRIANGLES,0,6);
}

function drawLightEmitter(o){
  drawBeam(o);
  if(!((o.lightEmitterShape||'point')==='rectangle'&&o.lightRectangleEmission==='solid'))drawPointGlow(o);
}

function drawFogSource(o){
  const oldGlow=o.glow, oldOpacity=o.opacity;
  const fa=fogAudio(o);
  o.glow=fa.glow;
  o.opacity=Math.max(0,Math.min(1,(o.fogEmitterOpacity??0.44)));
  drawPointGlow(o);
  o.glow=oldGlow;
  o.opacity=oldOpacity;
}

function drawBackgroundDim(){
  // Abdunkelung wird direkt im Background-Shader angewendet, damit Alpha-Löcher
  // im Hintergrund nicht von einer nachgelagerten schwarzen Vollbildfläche verdeckt werden.
}

function visualizerBandValue(bi,bars){
  if(!analyser||!audioState.enabled||!freqData||!freqData.length)return 0;
  const nyq=(audioCtx?audioCtx.sampleRate:44100)/2;
  const minF=20, maxF=Math.min(20000,nyq*0.92);
  const a=bi/Math.max(1,bars), b=(bi+1)/Math.max(1,bars);
  const f1=minF*Math.pow(maxF/minF,a);
  const f2=minF*Math.pow(maxF/minF,b);
  const center=Math.sqrt(f1*f2);
  const widthOctaves=Math.max(0.08,Math.log2(f2/f1));
  return normalizedFrequencyBand(center,widthOctaves);
}
function drawVisualizer(o){
  const cw=canvas.clientWidth, ch=canvas.clientHeight;
  const x=objCssX(o), y=objCssY(o);
  const w=Math.max(20*stageScale(),su(o.visualizerWidth||520));
  const h=Math.max(20*stageScale(),su(o.visualizerHeight||180));
  const rot=Number(o.rotation||0)*Math.PI/180;
  const opacity=Number(o.visualizerOpacity??.95)*Number(o.intensity??1);
  const bars=Math.max(8,Math.min(96,Math.round(Number(o.visualizerBars||32))));
  const gap=clamp01(Number(o.visualizerGap??.25));
  const sens=Number(o.visualizerSensitivity??1)*audioState.sensitivity;
  const decay=0;
  if(!o._vizLevels||o._vizLevels.length!==bars)o._vizLevels=new Array(bars).fill(0);
  if(!o._vizPeaks||o._vizPeaks.length!==bars)o._vizPeaks=new Array(bars).fill(0);
  if(!o._vizPeakTimes||o._vizPeakTimes.length!==bars)o._vizPeakTimes=new Array(bars).fill(0);
  if(!o._vizAverages||o._vizAverages.length!==bars)o._vizAverages=new Array(bars).fill(0);
  if(!o._vizAverageInit||o._vizAverageInit.length!==bars)o._vizAverageInit=new Array(bars).fill(false);
  const peakHoldMs=Math.max(0,Math.min(240,Number(o.visualizerPeakHold??30)))*1000;
  const nowMs=performance.now();

  // Nur Audiodaten / Markerzustände werden auf der CPU aktualisiert.
  // Die komplette sichtbare Darstellung erfolgt danach in einem WebGL-Fragmentshader.
  for(let i=0;i<bars;i++){
    let target=visualizerBandValue(i,bars)*sens;
    if(!audioState.enabled)target=0;
    target=clamp01(target);
    const old=o._vizLevels[i]||0;
    const v=target>old?target:(old*decay+target*(1-decay));
    o._vizLevels[i]=v;

    if(v>=(o._vizPeaks[i]||0)){
      o._vizPeaks[i]=v;
      o._vizPeakTimes[i]=nowMs;
    }else if(peakHoldMs<=0 || (nowMs-(o._vizPeakTimes[i]||0))>peakHoldMs){
      o._vizPeaks[i]=Math.max(v,(o._vizPeaks[i]||0)-0.65*(1-decay));
      if(o._vizPeaks[i]<=v+0.002)o._vizPeakTimes[i]=nowMs;
    }

    const avgAlpha=audioState.enabled?0.012:0.004;
    if(!o._vizAverageInit[i]){
      o._vizAverages[i]=v;
      o._vizAverageInit[i]=true;
    }else{
      o._vizAverages[i]=o._vizAverages[i]*(1-avgAlpha)+v*avgAlpha;
    }
  }

  // Daten-Textur: R = Live-Pegel, G = roter Peak, B = weißer Durchschnitt.
  visualizerUploadBuffer.fill(0);
  for(let i=0;i<bars;i++){
    const base=i*4;
    visualizerUploadBuffer[base]=Math.round(clamp01(o._vizLevels[i]||0)*255);
    visualizerUploadBuffer[base+1]=Math.round(clamp01(o._vizPeaks[i]||0)*255);
    visualizerUploadBuffer[base+2]=Math.round(clamp01(o._vizAverages[i]||0)*255);
    visualizerUploadBuffer[base+3]=255;
  }
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,visualizerDataTexture);
  gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,VISUALIZER_TEX_W,1,gl.RGBA,gl.UNSIGNED_BYTE,visualizerUploadBuffer);

  const overlayInfo=(selected&&selected!==o)?getFrequencyOverlayInfo():null;
  gl.useProgram(visualizerProg);
  gl.bindBuffer(gl.ARRAY_BUFFER,quad);
  gl.enableVertexAttribArray(visualizerLoc.pos);
  gl.vertexAttribPointer(visualizerLoc.pos,2,gl.FLOAT,false,0,0);
  gl.uniform2f(visualizerLoc.pixelRes,canvas.width,canvas.height);
  gl.uniform2f(visualizerLoc.cssRes,cw,ch);
  gl.uniform2f(visualizerLoc.originCss,x,y);
  gl.uniform2f(visualizerLoc.sizeCss,w,h);
  gl.uniform1f(visualizerLoc.rot,rot);
  gl.uniform1f(visualizerLoc.opacity,opacity);
  gl.uniform1f(visualizerLoc.selected,isSelected(o)?1:0);
  gl.uniform1f(visualizerLoc.bars,bars);
  gl.uniform1f(visualizerLoc.gap,gap);
  gl.uniform1i(visualizerLoc.data,0);
  gl.uniform1f(visualizerLoc.hasOverlay,overlayInfo?1:0);
  gl.uniform1f(visualizerLoc.overlayFreq,overlayInfo?overlayInfo.freq:120);
  gl.uniform1f(visualizerLoc.overlayThreshold,overlayInfo?overlayInfo.threshold:0);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.drawArrays(gl.TRIANGLES,0,6);
}


function drawLightbar(o){
  const count=Math.max(2,Math.min(32,Math.round(Number(o.lightbarCount??8))));
  const length=su(o.lightbarLength??320);
  const baseRot=effectiveRotation(o);
  const barAxis=(baseRot+90)*Math.PI/180;
  const spread=Number(o.lightbarSpread??0);
  for(let i=0;i<count;i++){
    const t=count===1?0:(i/(count-1)-0.5);
    const off=t*length;
    const ox=Math.cos(barAxis)*off;
    const oy=Math.sin(barAxis)*off;
    const tmp={...o,id:(o.id||'lightbar')+'_head_'+i,x:Number(o.x||0)+ox/Math.max(1,canvas.clientWidth)*100,y:Number(o.y||0)+oy/Math.max(1,canvas.clientHeight)*100,_fixedEffectiveRotation:baseRot+(count>1?t*spread:0),size:(Number(o.size||56)*0.75)};
    drawBeam(tmp);
    drawPointGlow(tmp);
  }
}
function drawLightbarBody(o){
  // Neutrale Lightbar-Traverse: nicht mehr in der Lichtfarbe zeichnen.
  // Der blaue Mittelstrich entstand dadurch, dass der Bar-Körper mit o.color
  // und relativ hoher Alpha über den Lichtköpfen gerendert wurde.
  const selected=isSelected(o);
  if(!selected && document.body.classList.contains('menuless')) return;
  const len=su(o.lightbarLength??320), th=Math.max(2*stageScale(),su(o.size||56)*0.035);
  const pts=[-th/2,-len/2, th/2,-len/2, th/2,len/2, -th/2,len/2];
  gl.useProgram(shapeProg);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.enableVertexAttribArray(loc.a);gl.vertexAttribPointer(loc.a,2,gl.FLOAT,false,0,0);
  gl.uniform2f(loc.res,canvas.clientWidth,canvas.clientHeight);gl.uniform2f(loc.pos,objCssX(o),objCssY(o));gl.uniform1f(loc.rot,(Number(o.rotation||0)+90)*Math.PI/180);gl.uniform1f(loc.scale,1);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pts),gl.STATIC_DRAW);
  const a=selected?0.34:0.10;
  gl.uniform4f(loc.color,0.18,0.22,0.28,a);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.drawArrays(gl.TRIANGLE_FAN,0,4);
}

function movingHeadRotation(o){
  const base=Number(o.rotation||0);
  const mode=o.movingMode||'static';
  const pan=Number(o.movingPan??0);
  const tilt=Number(o.movingTilt??-55);
  const panRange=Number(o.movingPanRange??90);
  const tiltRange=Number(o.movingTiltRange??70);
  const speed=Number(o.movingSpeed??.8);
  const moveAmt=Number(o.movingAudioMove??.7);
  const t=performance.now()/1000;
  let panOffset=0, tiltOffset=0;
  const oa=objectAudio(o);
  if(mode==='auto'){
    panOffset=Math.sin(t*speed)*panRange*0.5;
    tiltOffset=Math.sin(t*speed*0.73+1.4)*tiltRange*0.5;
  }else if(mode==='music'){
    const e=audioState.enabled?clamp01(oa.level*moveAmt*2.2):0;
    panOffset=Math.sin(t*(0.7+speed)*2.2+oa.rawBand*4.0)*panRange*0.5*e;
    tiltOffset=Math.cos(t*(0.45+speed)*1.7+oa.rawBand*3.1)*tiltRange*0.5*e;
  }else if(mode==='beat'){
    if(o._mhBeatPan===undefined){o._mhBeatPan=0;o._mhBeatTilt=0;o._mhLastBeat=0;}
    if(audioState.enabled&&oa.beat&&performance.now()-o._mhLastBeat>120){
      const seed=(Number((o.id||'').replace(/\D/g,''))||1)*0.37+performance.now()*0.001;
      o._mhBeatPan=Math.sin(seed*7.1)*panRange*0.5;
      o._mhBeatTilt=Math.cos(seed*5.3)*tiltRange*0.5;
      o._mhLastBeat=performance.now();
    }
    panOffset=o._mhBeatPan||0;
    tiltOffset=o._mhBeatTilt||0;
  }
  return base + pan + panOffset + tilt + tiltOffset;
}
function drawMovingHead(o){
  const rot=movingHeadRotation(o);
  const tmp={...o,type:'light',rotation:rot,angle:Number(o.movingBeamAngle??14),range:Number(o.movingBeamRange??480),glow:Number(o.movingHeadGlow??.35),opacity:o.opacity??.85,_fixedEffectiveRotation:rot};
  drawBeam(tmp);
  drawPointGlow(tmp);
  if(o.movingBodyVisible===false && !isSelected(o))return;
  const x=objCssX(o), y=objCssY(o);
  const baseSize=Number(o.size||64);
  const baseW=Math.max(1,su(baseSize*1.25));
  const yBase=y+su(baseSize*0.34);
  const rect=[-0.5,-0.5,0.5,-0.5,0.5,0.5,-0.5,0.5];
  drawPrimitive(rect,gl.TRIANGLE_FAN,[0.10,0.12,0.16,isSelected(o)?0.90:0.68],{x:x,y:yBase},0,baseW);
  const armH=Math.max(1,su(baseSize*0.72));
  const gap=su(baseSize*0.42);
  drawPrimitive(rect,gl.TRIANGLE_FAN,[0.15,0.18,0.23,isSelected(o)?0.90:0.60],{x:x-gap,y:y},0,armH);
  drawPrimitive(rect,gl.TRIANGLE_FAN,[0.15,0.18,0.23,isSelected(o)?0.90:0.60],{x:x+gap,y:y},0,armH);
  const headW=Math.max(1,su(baseSize*0.88));
  const headPts=[-0.55,-0.32,0.55,-0.32,0.55,0.32,-0.55,0.32];
  drawPrimitive(headPts,gl.TRIANGLE_FAN,[0.20,0.24,0.30,isSelected(o)?0.95:0.72],{x:x,y:y-su(baseSize*0.10)},rot*Math.PI/180,headW);
  const c=activeColor(o);
  drawPrimitive(circlePts(24),gl.TRIANGLE_FAN,[c[0],c[1],c[2],isSelected(o)?0.95:0.65],{x:x+Math.cos(rot*Math.PI/180)*headW*0.33,y:y-su(baseSize*0.10)+Math.sin(rot*Math.PI/180)*headW*0.33},0,Math.max(su(baseSize*0.18),1));
}


function releaseAudioSource(o){
  if(!o)return;
  try{ if(o.audioSourceElement){o.audioSourceElement.pause(); o.audioSourceElement.src=''; if(o.audioSourceElement.load)o.audioSourceElement.load();} }catch(e){}
  try{ if(o.audioSourceNode)o.audioSourceNode.disconnect(); }catch(e){}
  try{ if(o.audioSourceGain)o.audioSourceGain.disconnect(); }catch(e){}
  try{ if(o.audioSourceAnalyserTap)o.audioSourceAnalyserTap.disconnect(); }catch(e){}
  try{ if(o.audioSourcePan)o.audioSourcePan.disconnect(); }catch(e){}
  if(o.audioSourceMediaUrl){try{URL.revokeObjectURL(o.audioSourceMediaUrl);}catch(e){}}
  o.audioSourceElement=null; o.audioSourceNode=null; o.audioSourceGain=null; o.audioSourceAnalyserTap=null; o.audioSourcePan=null; o.audioSourceMediaUrl=''; o.audioSourcePlaying=false;
}
function ensureAudioSourceElement(o){
  if(!o)return null;
  if(!o.audioSourceElement){
    const el=document.createElement('audio');
    el.preload='metadata'; el.crossOrigin='anonymous'; el.loop=!!o.audioSourceLoop;
    el.addEventListener('play',()=>{o.audioSourcePlaying=true;});
    el.addEventListener('pause',()=>{o.audioSourcePlaying=false;});
    el.addEventListener('ended',()=>{o.audioSourcePlaying=false;});
    o.audioSourceElement=el;
  }
  return o.audioSourceElement;
}
function rebuildAudioSourceRouting(o){
  if(!o||!o.audioSourceElement)return;
  const ctx=ensureAudio();
  if(!ctx)return;
  try{ if(o.audioSourceNode)o.audioSourceNode.disconnect(); }catch(e){}
  try{ if(o.audioSourceGain)o.audioSourceGain.disconnect(); }catch(e){}
  try{ if(o.audioSourceAnalyserTap)o.audioSourceAnalyserTap.disconnect(); }catch(e){}
  try{ if(o.audioSourcePan)o.audioSourcePan.disconnect(); }catch(e){}
  try{ if(!o.audioSourceNode)o.audioSourceNode=ctx.createMediaElementSource(o.audioSourceElement); }
  catch(err){ if(audioSourceInfo&&selected===o)audioSourceInfo.textContent='AudioSource Routing konnte nicht erstellt werden: '+err.message; return; }
  o.audioSourceGain=ctx.createGain();
  o.audioSourceNode.connect(o.audioSourceGain);
  let outputNode=o.audioSourceGain;
  if(ctx.createStereoPanner){
    try{o.audioSourcePan=ctx.createStereoPanner();o.audioSourceGain.connect(o.audioSourcePan);outputNode=o.audioSourcePan;}catch(e){o.audioSourcePan=null;}
  }
  outputNode.connect(ctx.destination);
  if(o.audioSourceAnalyze&&analyser){
    o.audioSourceAnalyserTap=ctx.createGain();
    o.audioSourceGain.connect(o.audioSourceAnalyserTap);
    o.audioSourceAnalyserTap.connect(analyser);
    audioState.enabled=true;
    audioState.source='audioSource';
  }
  updateAudioSourceSpatial(o);
}
function loadAudioSourceFile(o,file){
  if(!o||o.type!=='audioSource'||!file)return;
  releaseAudioSource(o);
  const el=ensureAudioSourceElement(o);
  const url=URL.createObjectURL(file);
  o.audioSourceMediaUrl=url; o.audioSourceType='file'; o.audioSourceName=file.name; o.audioSourceUrl='';
  el.src=url; el.loop=!!o.audioSourceLoop; el.volume=1;
  rebuildAudioSourceRouting(o);
  if(audioSourceInfo&&selected===o)audioSourceInfo.textContent='Quelle: '+file.name+' · lokale Datei';
}
function loadAudioSourceUrl(o,url){
  if(!o||o.type!=='audioSource'||!url)return;
  releaseAudioSource(o);
  const el=ensureAudioSourceElement(o);
  o.audioSourceType='url'; o.audioSourceName=url.split('/').pop()||'Stream/URL'; o.audioSourceUrl=url;
  el.src=url; el.loop=!!o.audioSourceLoop; el.volume=1;
  rebuildAudioSourceRouting(o);
  if(audioSourceInfo&&selected===o)audioSourceInfo.textContent='Quelle: '+o.audioSourceName+' · Stream/URL';
}
async function playAudioSource(o){
  if(!o||o.type!=='audioSource')return;
  const el=ensureAudioSourceElement(o);
  if(!el.src&&o.audioSourceUrl)loadAudioSourceUrl(o,o.audioSourceUrl);
  if(!el.src){if(audioSourceInfo&&selected===o)audioSourceInfo.textContent='Keine AudioSource-Datei oder Stream-URL zugewiesen.';return;}
  const ctx=ensureAudio(); if(ctx&&ctx.state==='suspended')await ctx.resume();
  if(!o.audioSourceGain)rebuildAudioSourceRouting(o);
  try{await el.play();o.audioSourcePlaying=true;}catch(err){if(audioSourceInfo&&selected===o)audioSourceInfo.textContent='AudioSource konnte nicht gestartet werden: '+err.message;}
}
function pauseAudioSource(o){if(!o||!o.audioSourceElement)return;o.audioSourceElement.pause();o.audioSourcePlaying=false;}
function updateAudioSourceSpatial(o){
  if(!o||!o.audioSourceGain)return;
  const vol=Math.max(0,Number(o.audioSourceVolume??1));
  const range=Math.max(1,Number(o.audioSourceRange??35));
  const fall=Math.max(0.1,Number(o.audioSourceFalloff??1));
  const dx=Number(o.x||50)-50, dy=Number(o.y||50)-50, dz=Number(o.audioSourceZ||0);
  const dist=Math.sqrt(dx*dx+dy*dy+dz*dz);
  const gain=vol*Math.pow(Math.max(0,1-dist/range),fall);
  o.audioSourceGain.gain.value=Number.isFinite(gain)?gain:0;
  if(o.audioSourcePan)o.audioSourcePan.pan.value=Math.max(-1,Math.min(1,dx/50));
}
function updateAudioSources(){for(const o of objects){if(o.type==='audioSource')updateAudioSourceSpatial(o);}}
function drawAudioSource(o){
  const x=objCssX(o), y=objCssY(o);
  const r=Math.max(8,su(o.size||58)*0.5);
  const c=hex(o.color||'#8bd7ff');
  const active=o.audioSourceElement&&!o.audioSourceElement.paused;
  const iconOpacity=Math.max(0,Math.min(1,Number(o.audioSourceIconOpacity??.65)));

  // AudioSource-Symbol V156:
  // Der Drawcall setzt jetzt explizit normales Alpha-Blending. Vorher konnte der
  // Kreis nach einem additiven Licht-/Glow-Renderpfad trotz Alpha-Regler weiter
  // voll sichtbar bleiben. Der Regler steuert nun Füllung, Ringe und Reichweite.
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  if(iconOpacity>0.001){
    const fillAlpha=(active?0.62:0.42)*iconOpacity;
    const ringAlpha=(isSelected(o)?1.0:0.72)*iconOpacity;
    drawPrimitive(circlePoints(56),gl.TRIANGLE_FAN,[c[0],c[1],c[2],fillAlpha],[x,y],0,r*0.72);
    drawPrimitive(circlePts(56),gl.LINE_LOOP,[1.0,1.0,1.0,0.22*iconOpacity],[x,y],0,r*0.82);
    drawPrimitive(circlePts(56),gl.LINE_LOOP,[c[0],c[1],c[2],ringAlpha],[x,y],0,r*1.00);
    if(active){
      drawPrimitive(circlePts(72),gl.LINE_LOOP,[c[0],c[1],c[2],0.30*iconOpacity],[x,y],0,r*1.30);
    }
  }

  const range=Math.max(1,Number(o.audioSourceRange??35));
  const rangeCss=su((range/100)*Math.max(stageState.w,stageState.h));
  if(isSelected(o)&&iconOpacity>0.001)drawPrimitive(circlePts(72),gl.LINE_LOOP,[c[0],c[1],c[2],0.22*iconOpacity],[x,y],0,rangeCss);
}


function imageAssetAudioEnergy(o){
  if(!o||o.type!=='imageAsset'||!o.imageAssetAudioEnabled||!audioState.enabled)return 0;
  const oa=objectAudio(o);
  return clamp01((oa.level||0)*Math.max(0,Number(audioState.sensitivity||1)));
}
function updateImageAssetAudioReaction(o,dt){
  if(!o||o.type!=='imageAsset')return;
  const target=imageAssetAudioEnergy(o);
  const smooth=Math.pow(0.08,Math.max(0.001,dt)*10);
  o.imageAssetAudioSmoothed=Number(o.imageAssetAudioSmoothed||0)*smooth + target*(1-smooth);
  const dirX=Number(o.imageAssetAudioDirX??0);
  const dirY=Number(o.imageAssetAudioDirY??-1);
  const strength=Number(o.imageAssetAudioStrength??30);
  const mag=Math.hypot(dirX,dirY)||1;
  const nx=dirX/mag, ny=dirY/mag;
  const e=Number(o.imageAssetAudioSmoothed||0);
  o._imageAssetAudioOffsetX=nx*e*strength;
  o._imageAssetAudioOffsetY=ny*e*strength;
  if(o.imageAssetPhysicsEnabled && o.imageAssetAudioPhysicsImpulse!==false && target>0.025){
    const now=performance.now();
    const cooldown=Math.max(.02,Number(o.imageAssetAudioImpulseCooldown??.12))*1000;
    if(now-(o.imageAssetAudioLastImpulse||0)>=cooldown){
      const m=Math.max(.1,Number(o.imageAssetMass||1));
      const impulse=target*strength*.085/Math.sqrt(m);
      o.imageAssetVx=Number(o.imageAssetVx||0)+nx*impulse;
      o.imageAssetVy=Number(o.imageAssetVy||0)+ny*impulse;
      // Musikimpulse erzeugen ab Version 164 keine automatische Rotation mehr.
      // Physics-Objekte können dadurch hüpfen/stoßen, ohne unkontrolliert zu drehen.
      clampImageAssetAngularVelocity(o);
      o.imageAssetAudioLastImpulse=now;
    }
  }
}

function imageAssetPerspectiveScale(o){
  if(!o || o.type!=='imageAsset' || !o.imageAssetPerspectiveEnabled) return 1;
  const y=Math.max(0,Math.min(100,Number(o.y||0)))/100;
  const strength=Math.max(0,Math.min(3,Number(o.imageAssetPerspectiveStrength??.90)));
  const minScale=Math.max(0.05,Math.min(1,Number(o.imageAssetPerspectiveMin??.30)));
  // Oben deutlich kleiner, unten Basisgröße. Stärke 0 = linear, höhere Werte ziehen die obere Tiefe kräftiger zusammen.
  const curve=1.0 + strength*2.65;
  const raw=minScale + (1-minScale)*Math.pow(y, curve);
  return Math.max(minScale,Math.min(1,raw));
}
function imageAssetRenderSize(o){
  const ps=imageAssetPerspectiveScale(o);
  return {w:Number(o.imageAssetWidth||240)*ps,h:Number(o.imageAssetHeight||160)*ps,scale:ps};
}

function shadowRenderInfo(o){
  if(!supportsShadow(o))return null;
  ensureShadowDefaults(o);
  let w=Number(o.size||80),h=Number(o.size||80),tex=null,useTex=false,mode=o.shadowMode||defaultShadowMode(o);
  if(o.type==='imageAsset'){const ps=imageAssetRenderSize(o);w=ps.w;h=ps.h;tex=o.imageAssetTexture;useTex=mode==='shape'&&!!tex;}
  else if(o.type==='screen'){w=Number(o.screenWidth||260);h=Number(o.screenHeight||120);mode=mode==='shape'?'rect':mode;}
  else if(o.type==='greenscreen'){const gs=getGreenscreenRenderSize(o);w=gs.w/Math.max(stageScale(),0.0001);h=gs.h/Math.max(stageScale(),0.0001);tex=o.greenscreenTexture;useTex=false;if(mode==='shape')mode='oval';}
  const modeId=mode==='shape'&&useTex?1:(mode==='rect'?2:0);
  return {w,h,tex,useTex,modeId};
}
function drawObjectShadow(o){
  if(!o||!supportsShadow(o))return;
  ensureShadowDefaults(o);
  if(!o.shadowEnabled||Number(o.shadowOpacity??0)<=0)return;
  const info=shadowRenderInfo(o);
  if(!info)return;
  const c=hex(o.shadowColor||'#000000');
  const sc=stageScale();
  gl.useProgram(shadowProg);
  gl.bindBuffer(gl.ARRAY_BUFFER,quad);
  gl.enableVertexAttribArray(shadowLoc.pos);
  gl.vertexAttribPointer(shadowLoc.pos,2,gl.FLOAT,false,0,0);
  gl.uniform2f(shadowLoc.pixelRes,canvas.width,canvas.height);
  gl.uniform2f(shadowLoc.cssRes,canvas.clientWidth,canvas.clientHeight);
  gl.uniform2f(shadowLoc.originCss,objCssX(o)+su(o.shadowOffsetX||0),objCssY(o)+su(o.shadowOffsetY||0));
  gl.uniform2f(shadowLoc.sizeCss,Math.max(1,su(info.w)*Number(o.shadowScaleX??1)),Math.max(1,su(info.h)*Number(o.shadowScaleY??.35)));
  gl.uniform1f(shadowLoc.rot,(Number(o.rotation||0)+Number(o.shadowRotation||0))*Math.PI/180);
  gl.uniform1f(shadowLoc.blur,Math.max(0,Math.min(1,Number(o.shadowBlur??.55))));
  gl.uniform1f(shadowLoc.opacity,Math.max(0,Math.min(1,Number(o.shadowOpacity??.35))));
  gl.uniform3f(shadowLoc.color,c[0],c[1],c[2]);
  gl.uniform1i(shadowLoc.mode,info.modeId);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,(info.useTex&&info.tex)?info.tex:emptyTexture());
  gl.uniform1i(shadowLoc.tex,0);
  gl.uniform1i(shadowLoc.useTex,info.useTex?1:0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.drawArrays(gl.TRIANGLES,0,6);
}
function drawImageAsset(o){
  if(!o||o.type!=='imageAsset')return;
  const x=objCssX(o), y=objCssY(o), sc=stageScale();
  const ps=imageAssetRenderSize(o);
  gl.useProgram(imageAssetProg);
  // ImageAssets sind normale Textur-Objekte und müssen unabhängig vom zuvor
  // gerenderten Objekttyp immer mit Standard-Alpha-Blending laufen. Ohne diesen
  // Reset kann ein vorheriger Licht-/Partikelpass den Blendmodus vererben.
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.enableVertexAttribArray(imageAssetLoc.pos);gl.vertexAttribPointer(imageAssetLoc.pos,2,gl.FLOAT,false,0,0);
  gl.uniform2f(imageAssetLoc.pixelRes,canvas.width,canvas.height);
  gl.uniform2f(imageAssetLoc.cssRes,canvas.clientWidth,canvas.clientHeight);
  gl.uniform2f(imageAssetLoc.originCss,x+su(o._imageAssetAudioOffsetX||0),y+su(o._imageAssetAudioOffsetY||0));
  gl.uniform2f(imageAssetLoc.sizeCss,su(ps.w),su(ps.h));
  gl.uniform1f(imageAssetLoc.rot,(Number(o.rotation||0))*Math.PI/180);
  gl.uniform1f(imageAssetLoc.opacity,Math.max(0,Math.min(1,Number(o.imageAssetOpacity??1))));
  gl.uniform1f(imageAssetLoc.dim,sceneDimmingForTarget('imageAsset',o));
  gl.uniform1f(imageAssetLoc.selected,isSelected(o)?1:0);
  gl.activeTexture(gl.TEXTURE0);
  if(o.imageAssetTexture){gl.bindTexture(gl.TEXTURE_2D,o.imageAssetTexture);gl.uniform1i(imageAssetLoc.hasImage,1);}else{gl.bindTexture(gl.TEXTURE_2D,emptyTexture());gl.uniform1i(imageAssetLoc.hasImage,0);} 
  gl.uniform1i(imageAssetLoc.tex,0);
  gl.drawArrays(gl.TRIANGLES,0,6);
}
let _emptyTexture=null;
function emptyTexture(){if(_emptyTexture)return _emptyTexture;_emptyTexture=initTexture();return _emptyTexture;}
function ensureWaterMaskTexture(o){
  if(!o||!Array.isArray(o.waterMaskPoints)||o.waterMaskPoints.length<3)return null;
  const key=JSON.stringify(o.waterMaskPoints);
  if(o.waterMaskTexture&&o._waterMaskKey===key)return o.waterMaskTexture;
  const c=document.createElement('canvas');
  c.width=256;c.height=256;
  const ctx=c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height);
  ctx.fillStyle='#fff';
  ctx.beginPath();
  o.waterMaskPoints.forEach((p,i)=>{
    const x=Math.max(0,Math.min(1,Number(p.x||0)))*c.width;
    const y=Math.max(0,Math.min(1,Number(p.y||0)))*c.height;
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  });
  ctx.closePath();
  ctx.fill();
  const tex=o.waterMaskTexture||initTexture();
  gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
  o.waterMaskTexture=tex;
  o._waterMaskKey=key;
  return tex;
}

function drawWaterObject(o){
  if(!isWaterObject(o))return;
  ensureWaterDefaults(o);
  const tint=hex(o.waterColorTint||'#2fd6ff');
  const sparkle=hex(o.waterSparkleColor||'#ffffff');
  const oa=objectAudio(o);
  const wind=windForObject(o,'water');
  const maskTex=o.waterShape==='freehand'?ensureWaterMaskTexture(o):null;
  gl.useProgram(waterProg);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.bindBuffer(gl.ARRAY_BUFFER,quad);
  gl.enableVertexAttribArray(waterLoc.pos);
  gl.vertexAttribPointer(waterLoc.pos,2,gl.FLOAT,false,0,0);
  gl.uniform2f(waterLoc.pixelRes,canvas.width,canvas.height);
  gl.uniform2f(waterLoc.cssRes,canvas.clientWidth,canvas.clientHeight);
  gl.uniform2f(waterLoc.originCss,objCssX(o),objCssY(o));
  gl.uniform2f(waterLoc.sizeCss,Math.max(1,su(o.waterWidth||420)),Math.max(1,su(o.waterHeight||180)));
  gl.uniform1f(waterLoc.rot,(Number(o.rotation||0))*Math.PI/180);
  gl.uniform1f(waterLoc.time,performance.now()/1000);
  gl.uniform1f(waterLoc.opacity,Math.max(0,Math.min(1,Number(o.waterOpacity??.65))));
  gl.uniform1f(waterLoc.waveHeight,Math.max(0,Number(o.waterWaveHeight??.35))*(1+wind.strength*0.08));
  gl.uniform1f(waterLoc.waveScale,Math.max(.05,Number(o.waterWaveScale??1.2))*(1+wind.turbulenceAmount*0.08));
  gl.uniform1f(waterLoc.waveSpeed,Math.max(0,Number(o.waterWaveSpeed??.35))+wind.strength*0.045);
  gl.uniform1f(waterLoc.flowDirection,wind.enabled?(Math.atan2(wind.unit.y,wind.unit.x)*180/Math.PI):Number(o.waterFlowDirection??0));
  gl.uniform1f(waterLoc.flowSpeed,Math.max(0,Number(o.waterFlowSpeed??.55))+wind.strength*0.055);
  gl.uniform1f(waterLoc.flowScale,Math.max(.05,Number(o.waterFlowScale??1.5)));
  gl.uniform1f(waterLoc.distortion,Math.max(0,Number(o.waterDistortionStrength??.25))*(1+wind.strength*0.10+wind.turbulenceAmount*0.18));
  gl.uniform1f(waterLoc.reflection,Math.max(0,Math.min(1,Number(o.waterReflectionStrength??.35))));
  gl.uniform1f(waterLoc.highlight,Math.max(0,Number(o.waterHighlightStrength??.55)));
  gl.uniform1f(waterLoc.audioReaction,Math.max(0,Number(o.waterAudioReaction??.25)));
  gl.uniform1f(waterLoc.waveNoise,Math.max(0,Number(o.waterWaveNoise??.55)));
  gl.uniform1f(waterLoc.edgeFade,Math.max(0,Math.min(1,Number(o.waterEdgeFade??.35))));
  gl.uniform3f(waterLoc.tint,tint[0],tint[1],tint[2]);
  gl.uniform1f(waterLoc.sparkleEnabled,o.waterSparklesEnabled!==false?1:0);
  gl.uniform1f(waterLoc.sparkleDensity,Math.max(0,Number(o.waterSparkleDensity??.55)));
  gl.uniform1f(waterLoc.sparkleSize,Math.max(.1,Number(o.waterSparkleSize??1)));
  gl.uniform1f(waterLoc.sparkleBrightness,Math.max(0,Number(o.waterSparkleBrightness??.8)));
  gl.uniform1f(waterLoc.sparkleSpeed,Math.max(0,Number(o.waterSparkleSpeed??.75))+wind.strength*0.05);
  gl.uniform3f(waterLoc.sparkleColor,sparkle[0],sparkle[1],sparkle[2]);
  gl.uniform1f(waterLoc.foamEnabled,o.waterFoamEnabled?1:0);
  gl.uniform1f(waterLoc.foamAmount,Math.max(0,Number(o.waterFoamAmount??.25)));
  gl.uniform1f(waterLoc.foamSpeed,Math.max(0,Number(o.waterFoamSpeed??.35)));
  gl.uniform1f(waterLoc.foamScale,Math.max(.1,Number(o.waterFoamScale??1.5)));
  gl.uniform1f(waterLoc.foamOpacity,Math.max(0,Math.min(1,Number(o.waterFoamOpacity??.35))));
  gl.uniform1f(waterLoc.type,o.type==='waterSurface'?0:1);
  gl.uniform4f(waterLoc.audio,oa.level,oa.bass,oa.mid,oa.high);
  gl.uniform1f(waterLoc.selected,isSelected(o)?1:0);
  gl.uniform1f(waterLoc.shape,o.waterShape==='oval'?1:(o.waterShape==='freehand'?2:0));
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D,maskTex||emptyTexture());
  gl.uniform1i(waterLoc.mask,3);
  gl.uniform1f(waterLoc.useMask,maskTex?1:0);
  gl.drawArrays(gl.TRIANGLES,0,6);
}

function captureGroupedImageAssetPositions(){
  const m=new Map();
  for(const o of objects){
    if(o && o.type==='imageAsset' && o.groupId){
      m.set(o.id,{id:o.id,groupId:o.groupId,x:Number(o.x||0),y:Number(o.y||0)});
    }
  }
  return m;
}
function syncGroupedAudioSourcesWithImageAssets(before){
  if(!before || !(before instanceof Map))return;
  const groupDelta=new Map();
  for(const o of objects){
    if(!o || o.type!=='imageAsset' || !o.groupId)continue;
    const prev=before.get(o.id);
    if(!prev)continue;
    const dx=Number(o.x||0)-prev.x;
    const dy=Number(o.y||0)-prev.y;
    if(Math.abs(dx)<0.00001 && Math.abs(dy)<0.00001)continue;
    const g=groupDelta.get(o.groupId)||{dx:0,dy:0,n:0};
    g.dx+=dx; g.dy+=dy; g.n++;
    groupDelta.set(o.groupId,g);
  }
  if(!groupDelta.size)return;
  for(const o of objects){
    if(!o || o.type!=='audioSource' || !o.groupId)continue;
    const g=groupDelta.get(o.groupId);
    if(!g || !g.n)continue;
    o.x=Number(o.x||0)+g.dx/g.n;
    o.y=Number(o.y||0)+g.dy/g.n;
  }
}


function handleImageAssetSideCollisionDirection(o){
  if(!o || !o.imageAssetReverseXOnSideCollision || !o.imageAssetPhysicsEnabled)return;
  const vx=Number(o.imageAssetVx||0);
  const drive=Number(o.imageAssetAudioDirX||0);
  if(Math.abs(vx)>0.001)o.imageAssetVx=-vx;
  if(Math.abs(drive)>0.001)o.imageAssetAudioDirX=-drive;
  o._imageAssetSideCollisionFlipTime=performance.now();
  if(selected===o){
    if(fields.ImageAssetAudioDirX)fields.ImageAssetAudioDirX.value=o.imageAssetAudioDirX;
    if(typeof imageAssetAudioDirXValue!=='undefined')imageAssetAudioDirXValue.textContent=Number(o.imageAssetAudioDirX||0).toFixed(2);
  }
}

function updateImageAssetPhysics(){
  const beforeImageAssetFollow=captureGroupedImageAssetPositions();
  const now=performance.now();
  const dt=Math.min(0.033,Math.max(0.001,((updateImageAssetPhysics._last||now)-now)/-1000));
  updateImageAssetPhysics._last=now;

  // Physics Enabled = bewegt sich aktiv durch Schwerkraft/Impulse.
  // Collision Enabled = wirkt als Kollisionskörper, auch wenn Physics Disabled ist.
  // Damit können statische ImageAssets als feste Hindernisse/Boden/Stapelflächen dienen.
  const imageAssets=objects.filter(o=>o.type==='imageAsset');
  for(const o of imageAssets)updateImageAssetAudioReaction(o,dt);
  const dynamics=imageAssets.filter(o=>o.imageAssetPhysicsEnabled);
  const colliders=imageAssets.filter(o=>o.imageAssetCollisionEnabled!==false);
  const floorY=100;

  for(const o of dynamics){
    const ld=Math.max(0,Math.min(1,Number(o.imageAssetLinearDamping??.9)));
    const ad=Math.max(0,Math.min(1,Number(o.imageAssetAngularDamping??.9)));
    o.imageAssetVy=Number(o.imageAssetVy||0)+Number(o.imageAssetGravity||0)*dt*45;
    { const wind=windForObject(o,'physicsAsset'); if(wind.enabled){ const mass=Math.max(.1,Number(o.imageAssetMass||1)); o.imageAssetVx=Number(o.imageAssetVx||0)+wind.percentX*dt*820/mass; o.imageAssetVy=Number(o.imageAssetVy||0)+wind.percentY*dt*420/mass; o.imageAssetAngularVelocity=Number(o.imageAssetAngularVelocity||0)+wind.percentX*dt*120/mass; } }
    o.x=Number(o.x||0)+Number(o.imageAssetVx||0)*dt;
    o.y=Number(o.y||0)+Number(o.imageAssetVy||0)*dt;
    clampImageAssetAngularVelocity(o);
    o.rotation=(Number(o.rotation||0)+Number(o.imageAssetAngularVelocity||0)*dt*60)%360;
    o.imageAssetVx*=Math.pow(ld,dt*8);
    o.imageAssetVy*=Math.pow(ld,dt*8);
    o.imageAssetAngularVelocity*=Math.pow(ad,dt*18);
    clampImageAssetAngularVelocity(o);

    // Bühnenboden bleibt als globale Begrenzung bestehen.
    const halfH=(Number(o.imageAssetHeight||160)/Math.max(1,Number(scene.stageHeight||stageState.h||1080)))*50;
    if(o.y+halfH>floorY){
      o.y=floorY-halfH;
      if(o.imageAssetVy>0)o.imageAssetVy=-o.imageAssetVy*Math.min(0.35,Number(o.imageAssetBounce??.2));
      o.imageAssetVx*=Math.max(0,1-Number(o.imageAssetFriction??.6)*dt*8);
      calmImageAssetOnContact(o,dt,1+Number(o.imageAssetFriction??.6)*2);
      if(Math.abs(o.imageAssetVy)<.18)o.imageAssetVy=0;
    }
  }

  function dims(o){
    return {
      w:(Number(o.imageAssetWidth||240)/Math.max(1,Number(scene.stageWidth||stageState.w||1920)))*100,
      h:(Number(o.imageAssetHeight||160)/Math.max(1,Number(scene.stageHeight||stageState.h||1080)))*100
    };
  }
  function invMass(o){
    if(!o.imageAssetPhysicsEnabled)return 0; // statischer Collider: unbeweglich
    return 1/Math.max(0.1,Number(o.imageAssetMass||1));
  }

  // Einfache V1-Kollision: Box-AABB in Bühnenprozent.
  // Rotation wird visuell gerendert, die erste Physikversion bleibt bewusst simpel und stabil.
  for(let i=0;i<colliders.length;i++)for(let j=i+1;j<colliders.length;j++){
    const a=colliders[i],b=colliders[j];
    const invA=invMass(a), invB=invMass(b);
    if(invA<=0 && invB<=0)continue; // zwei statische Collider müssen nicht aufgelöst werden
    const ad=dims(a), bd=dims(b);
    const dx=Number(b.x||0)-Number(a.x||0), dy=Number(b.y||0)-Number(a.y||0);
    const ox=(ad.w+bd.w)/2-Math.abs(dx), oy=(ad.h+bd.h)/2-Math.abs(dy);
    if(ox>0&&oy>0){
      const totalInv=invA+invB || 1;
      if(ox<oy){
        const sgn=dx>=0?1:-1;
        const moveA=invA/totalInv*ox, moveB=invB/totalInv*ox;
        if(invA>0)a.x-=sgn*moveA;
        if(invB>0)b.x+=sgn*moveB;
        const av=Number(a.imageAssetVx||0), bv=Number(b.imageAssetVx||0);
        if(invA>0)a.imageAssetVx=(invB>0?bv: -av)*Number(a.imageAssetBounce??.2);
        if(invB>0)b.imageAssetVx=(invA>0?av: -bv)*Number(b.imageAssetBounce??.2);
        if(invA>0)handleImageAssetSideCollisionDirection(a);
        if(invB>0)handleImageAssetSideCollisionDirection(b);
        if(invA>0)a.imageAssetVy*=Math.max(0,1-Number(a.imageAssetFriction??.6)*dt*4);
        if(invB>0)b.imageAssetVy*=Math.max(0,1-Number(b.imageAssetFriction??.6)*dt*4);
      }else{
        const sgn=dy>=0?1:-1;
        const moveA=invA/totalInv*oy, moveB=invB/totalInv*oy;
        if(invA>0)a.y-=sgn*moveA;
        if(invB>0)b.y+=sgn*moveB;
        const av=Number(a.imageAssetVy||0), bv=Number(b.imageAssetVy||0);
        if(invA>0)a.imageAssetVy=(invB>0?bv: -av)*Number(a.imageAssetBounce??.2);
        if(invB>0)b.imageAssetVy=(invA>0?av: -bv)*Number(b.imageAssetBounce??.2);
        if(invA>0)a.imageAssetVx*=Math.max(0,1-Number(a.imageAssetFriction??.6)*dt*6);
        if(invB>0)b.imageAssetVx*=Math.max(0,1-Number(b.imageAssetFriction??.6)*dt*6);
        if(invA>0&&Math.abs(a.imageAssetVy)<.18)a.imageAssetVy=0;
        if(invB>0&&Math.abs(b.imageAssetVy)<.18)b.imageAssetVy=0;
      }
      // Kollisionen stabilisieren nur noch vorhandene Drehung.
      // Kein automatischer Kontakt-Spin mehr: gestapelte Assets bleiben ruhig,
      // solange nicht gezielt Drehimpuls über „Impulse Rotation“ gegeben wird.
      if(invA>0){calmImageAssetOnContact(a,dt,1+Number(a.imageAssetFriction??.6)*2);}
      if(invB>0){calmImageAssetOnContact(b,dt,1+Number(b.imageAssetFriction??.6)*2);}
    }
  }
  syncGroupedAudioSourcesWithImageAssets(beforeImageAssetFollow);
}

function renderOrderedObjects(list){
  list.forEach(e=>renderObject(e.o));
}
function splitByBackgroundLayer(ordered){
  return {
    behind: ordered.filter(e=>Number(e.o.layer??1)<0),
    front: ordered.filter(e=>Number(e.o.layer??1)>=1)
  };
}
function renderObject(o){if(o&&o._timelineHidden)return;if(o&&supportsShadow(o))drawObjectShadow(o);if(o.type==='audioSource'){drawAudioSource(o);}if(o.type==='screen'||o.type==='text'){drawScreen(o);}if(o.type==='imageAsset'){drawImageAsset(o);}if(o.type==='waterSurface'||o.type==='waterFlowOverlay'){drawWaterObject(o);}if(o.type==='mandalaVisualizer'){drawMandalaVisualizer(o);}if(o.type==='visualizer'){drawVisualizer(o);}if(o.type==='light'){drawLightEmitter(o);}if(o.type==='lightbar'){drawLightbar(o);}if(o.type==='movinghead'){drawMovingHead(o);}if(o.type==='fog'){drawFog(o);drawFogSource(o);}if(o.type==='particle'){drawParticle(o);}if(o.type==='imageParticle'){drawIpm(o);}if(o.type==='greenscreen'){drawGreenscreenShadow(o);drawGreenscreen(o);}if(o.type!=='text'&&o.type!=='lightbar'&&o.type!=='visualizer'&&o.type!=='movinghead'&&o.type!=='imageAsset'&&o.type!=='audioSource'&&o.type!=='waterSurface'&&o.type!=='waterFlowOverlay'&&o.type!=='mandalaVisualizer')drawBody(o);}
function renderFinalSceneBase(ordered){
  gl.clearColor(.02,.028,.048,1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  const split=splitByBackgroundLayer(ordered);
  renderOrderedObjects(split.behind); // Negative Layer: atmosphärische Objekte hinter dem Hintergrund.
  drawBackground();
  gl.enable(gl.BLEND);
  drawBackgroundDim(); // Scene-Abdunkelung nutzt die aktivierten Ziele.
  if(scene.showGrid) drawGrid(); // Arbeitsgitter liegt visuell auf Layer 0, wird aber nicht exportiert. Hintergrundbild ist konzeptionell Layer 0.
  renderOrderedObjects(split.front);
}

function drawSelectedReferenceMarkers(){
  if(document.body.classList.contains('menuless'))return;
  const markerPoints=circlePoints(28);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  for(const o of objects){
    if(!o||!isSelected(o))continue;
    const pos=[objCssX(o),objCssY(o)];
    // Dunkle Außenkante und heller Mittelpunkt bleiben auf jedem Hintergrund
    // sowie bei vollständig transparenten Objekten eindeutig sichtbar.
    drawPrimitive(markerPoints,gl.TRIANGLE_FAN,[0.015,0.025,0.045,0.96],pos,0,7);
    drawPrimitive(markerPoints,gl.TRIANGLE_FAN,[0.20,0.72,1.00,1.00],pos,0,4.5);
    drawPrimitive(markerPoints,gl.TRIANGLE_FAN,[0.96,0.99,1.00,1.00],pos,0,1.65);
  }
}
function mandalaAudioEnergy(){
  if(!audioState.enabled)return 0;
  return Math.max(0,Math.min(1,(Number(audioState.level||0)*1.25+Number(audioState.bass||0)*0.55+Number(audioState.mid||0)*0.25+Number(audioState.high||0)*0.18)*Number(audioState.sensitivity||1)));
}
function mandalaObjectAudioEnergy(o){
  if(!audioState.enabled)return 0;
  const oa=objectAudio(o);
  return Math.max(0,Math.min(1,(Number(oa.rawBand??oa.level??0)*1.25+Number(audioState.bass||0)*0.25+Number(audioState.mid||0)*0.18)*Number(audioState.sensitivity||1)));
}
function drawMandalaVisualizer(o){
  if(!o||o.type!=='mandalaVisualizer')return;
  ensureMandalaDefaults(o);
  if(o.mandalaObjVisible===false)return;
  const source=engineSceneTarget&&engineSceneTarget.tex?engineSceneTarget.tex:emptyTexture();
  const energy=mandalaObjectAudioEnergy(o);
  const now=performance.now()/1000;
  const rot=(Number(o.mandalaObjRotation||0)+(o.mandalaObjAutoRotate?now*18:0)+(o.mandalaObjMusicRotation?energy*180:0))*Math.PI/180;
  const zoom=Math.max(0.05,Number(o.mandalaObjZoom??1)+(o.mandalaObjMusicZoom?energy*.65:0));
  const mix=Math.max(0,Math.min(1,Number(o.mandalaObjMix??1)+(o.mandalaObjMusicMix?energy*(1-Number(o.mandalaObjMix??1)):0)));
  gl.useProgram(mandalaProg);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.bindBuffer(gl.ARRAY_BUFFER,quad);
  gl.enableVertexAttribArray(mandalaLoc.pos);
  gl.vertexAttribPointer(mandalaLoc.pos,2,gl.FLOAT,false,0,0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,source);
  gl.uniform1i(mandalaLoc.scene,0);
  gl.uniform2f(mandalaLoc.center,Number(o.mandalaObjCenterX??.5),1-Number(o.mandalaObjCenterY??.5));
  gl.uniform1f(mandalaLoc.segments,Number(o.mandalaObjSegments||6));
  gl.uniform1f(mandalaLoc.rotation,rot);
  gl.uniform1f(mandalaLoc.zoom,zoom);
  gl.uniform1f(mandalaLoc.mix,mix);
  gl.uniform1f(mandalaLoc.objectMode,1);
  gl.uniform2f(mandalaLoc.pixelRes,canvas.width,canvas.height);
  gl.uniform2f(mandalaLoc.cssRes,canvas.clientWidth,canvas.clientHeight);
  gl.uniform2f(mandalaLoc.originCss,objCssX(o),objCssY(o));
  gl.uniform2f(mandalaLoc.sizeCss,Math.max(1,su(o.mandalaObjWidth||420)),Math.max(1,su(o.mandalaObjHeight||420)));
  gl.uniform1f(mandalaLoc.objectRot,Number(o.rotation||0)*Math.PI/180);
  gl.uniform1f(mandalaLoc.opacity,Math.max(0,Math.min(1,Number(o.mandalaObjOpacity??1))));
  gl.drawArrays(gl.TRIANGLES,0,6);
}
function drawMandalaPass(sourceTex,target){
  const energy=mandalaAudioEnergy();
  const now=performance.now()/1000;
  const rot=(Number(scene.mandalaRotation||0)+(scene.mandalaAutoRotate?now*18:0)+(scene.mandalaMusicRotation?energy*180:0))*Math.PI/180;
  const zoom=Math.max(0.05,Number(scene.mandalaZoom??1)+(scene.mandalaMusicZoom?energy*.65:0));
  const mix=Math.max(0,Math.min(1,Number(scene.mandalaMix??1)+(scene.mandalaMusicMix?energy*(1-Number(scene.mandalaMix??1)):0)));
  gl.bindFramebuffer(gl.FRAMEBUFFER,target?target.fbo:null);
  gl.viewport(0,0,target?target.w:canvas.width,target?target.h:canvas.height);
  gl.disable(gl.BLEND);
  gl.useProgram(mandalaProg);
  gl.bindBuffer(gl.ARRAY_BUFFER,quad);
  gl.enableVertexAttribArray(mandalaLoc.pos);
  gl.vertexAttribPointer(mandalaLoc.pos,2,gl.FLOAT,false,0,0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,sourceTex);
  gl.uniform1i(mandalaLoc.scene,0);
  gl.uniform2f(mandalaLoc.center,Number(scene.mandalaCenterX??.5),1-Number(scene.mandalaCenterY??.5));
  gl.uniform1f(mandalaLoc.segments,Number(scene.mandalaSegments||6));
  gl.uniform1f(mandalaLoc.rotation,rot);
  gl.uniform1f(mandalaLoc.zoom,zoom);
  gl.uniform1f(mandalaLoc.mix,mix);
  gl.uniform1f(mandalaLoc.objectMode,0);
  gl.uniform1f(mandalaLoc.opacity,1);
  gl.drawArrays(gl.TRIANGLES,0,6);
  gl.enable(gl.BLEND);
}

function setVrStatus(text,isError){
  if(!vrStatus)return;
  vrStatus.textContent=text||'';
  vrStatus.style.color=isError?'#ffb8c0':'#93a6c0';
}
function vrErrorLabel(err){
  if(!err)return 'Unbekannter Fehler';
  return [err.name,err.message].filter(Boolean).join(': ')||String(err);
}
function vrOriginInfo(){
  const loc=window.location;
  const host=(loc.hostname||'').toLowerCase();
  const isLocal=host==='localhost'||host==='127.0.0.1'||host==='[::1]'||host==='::1';
  return {
    href:loc.href,
    protocol:loc.protocol,
    host,
    isLocal,
    secure:!!window.isSecureContext
  };
}
function vrUnsupportedMessage(reason,detail){
  const info=vrOriginInfo();
  if(reason==='insecure'){
    return 'WebXR / VR blockiert: Die Seite läuft nicht in einem sicheren Kontext. Nutze HTTPS oder localhost. Wichtig: In der Pico-Brille ist http://PC-IP:Port nicht sicher.';
  }
  if(reason==='no-api'){
    return 'WebXR / VR wird von diesem Browser nicht bereitgestellt. Pico Connect / Virtual Desktop zeigt oft nur den Desktop; der Browser braucht zusätzlich einen WebXR-fähigen XR-Runtime-Zugriff.';
  }
  if(reason==='unsupported-session'){
    return 'WebXR ist vorhanden, aber immersive-vr ist nicht verfügbar. Prüfe, ob die Pico 4 als OpenXR/SteamVR-Runtime aktiv ist oder öffne die Seite im Pico Browser über HTTPS.';
  }
  if(reason==='request-failed'){
    return 'VR-Session konnte nicht gestartet werden: '+(detail||'WebXR-Request wurde vom Browser abgelehnt.');
  }
  return 'WebXR / VR wird von diesem Browser oder Gerät nicht unterstützt.';
}
async function getVrAvailability(){
  if(!vrOriginInfo().secure)return {ok:false,reason:'insecure'};
  if(!navigator.xr)return {ok:false,reason:'no-api'};
  try{
    const supported=await navigator.xr.isSessionSupported('immersive-vr');
    return supported?{ok:true}:{ok:false,reason:'unsupported-session'};
  }catch(err){
    return {ok:false,reason:'request-failed',detail:vrErrorLabel(err)};
  }
}
function mat4Mul(a,b){
  const out=new Float32Array(16);
  for(let c=0;c<4;c++){
    for(let r=0;r<4;r++){
      out[c*4+r]=a[0*4+r]*b[c*4+0]+a[1*4+r]*b[c*4+1]+a[2*4+r]*b[c*4+2]+a[3*4+r]*b[c*4+3];
    }
  }
  return out;
}
function vrStageModelMatrix(){
  const aspect=Math.max(0.2,Number(stageState.w||1920)/Math.max(1,Number(stageState.h||1080)));
  const scale=Math.max(0.5,Math.min(2.5,Number(scene.vrSceneScale??1)));
  const distance=Math.max(1.2,Math.min(6,Number(scene.vrSceneDistance??3)));
  const width=3.6*scale;
  const height=width/aspect;
  const centerY=vrState.referenceSpaceType==='local-floor'?1.6:0;
  return new Float32Array([
    width*.5,0,0,0,
    0,height*.5,0,0,
    0,0,width*.5,0,
    0,centerY,-distance,1
  ]);
}
function updateVrButton(){
  if(vrViewerBtn)vrViewerBtn.textContent=vrState.active?'VR Viewer beenden':'VR Viewer starten';
}
async function refreshVrAvailability(){
  const availability=await getVrAvailability();
  if(!availability.ok)setVrStatus(vrUnsupportedMessage(availability.reason,availability.detail),true);
  else setVrStatus('WebXR / VR verfügbar. VR Viewer ist experimentell.',false);
  return availability.ok;
}
function renderCompleteSceneTexture(ordered){
  const target=ensureVrSceneTarget();
  if(scene.mandalaEnabled){
    const post=ensurePostSceneTarget();
    gl.bindFramebuffer(gl.FRAMEBUFFER,post.fbo);
    gl.viewport(0,0,post.w,post.h);
    renderFinalSceneBase(ordered);
    drawMandalaPass(post.tex,target);
  }else{
    gl.bindFramebuffer(gl.FRAMEBUFFER,target.fbo);
    gl.viewport(0,0,target.w,target.h);
    renderFinalSceneBase(ordered);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  return target;
}
function drawVrPlaneForView(view,textureTarget){
  const viewport=vrState.baseLayer.getViewport(view);
  gl.viewport(viewport.x,viewport.y,viewport.width,viewport.height);
  gl.scissor(viewport.x,viewport.y,viewport.width,viewport.height);
  gl.clearColor(0,0,0,1);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const viewMatrix=view.transform.inverse.matrix;
  const mvp=mat4Mul(view.projectionMatrix,mat4Mul(viewMatrix,vrStageModelMatrix()));
  gl.useProgram(vrPlaneProg);
  gl.disable(gl.BLEND);
  buildVrPlaneMesh();
  gl.bindBuffer(gl.ARRAY_BUFFER,vrPlaneBuffer);
  gl.enableVertexAttribArray(vrPlaneLoc.pos);
  gl.vertexAttribPointer(vrPlaneLoc.pos,3,gl.FLOAT,false,20,0);
  gl.enableVertexAttribArray(vrPlaneLoc.uv);
  gl.vertexAttribPointer(vrPlaneLoc.uv,2,gl.FLOAT,false,20,12);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,textureTarget.tex);
  gl.uniform1i(vrPlaneLoc.tex,0);
  gl.uniformMatrix4fv(vrPlaneLoc.mvp,false,mvp);
  gl.drawArrays(gl.TRIANGLES,0,vrPlaneVertexCount);
  gl.enable(gl.BLEND);
}
function updateVseFrame(){
  updateAudio();
  updateImageAssetPhysics();
  updateAudioSources();
  updateScreenPlaylists();
  updateTimelinePlayhead();
  if(typeof applyTimelineEvents==='function')applyTimelineEvents();
  updateAmbilightState();
  const ordered=objects.map((o,i)=>({o,i})).sort((a,b)=>((a.o.layer??1)-(b.o.layer??1))||(a.i-b.i));
  renderEngineSceneTexture(ordered);
  return ordered;
}
function renderNormalFrame(ordered){
  if(scene.mandalaEnabled){
    const post=ensurePostSceneTarget();
    gl.bindFramebuffer(gl.FRAMEBUFFER,post.fbo);
    gl.viewport(0,0,post.w,post.h);
    renderFinalSceneBase(ordered);
    drawMandalaPass(post.tex);
  }else{
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.viewport(0,0,canvas.width,canvas.height);
    renderFinalSceneBase(ordered);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  gl.viewport(0,0,canvas.width,canvas.height);
  drawSelectedReferenceMarkers();
}
function vrFrame(time,frame){
  if(!vrState.active||!vrState.session)return;
  vrState.session.requestAnimationFrame(vrFrame);
  const pose=frame.getViewerPose(vrState.referenceSpace);
  const ordered=updateVseFrame();
  const textureTarget=renderCompleteSceneTexture(ordered);
  gl.bindFramebuffer(gl.FRAMEBUFFER,vrState.baseLayer.framebuffer);
  gl.enable(gl.SCISSOR_TEST);
  gl.disable(gl.DEPTH_TEST);
  if(pose){
    pose.views.forEach(view=>drawVrPlaneForView(view,textureTarget));
  }
  gl.disable(gl.SCISSOR_TEST);
}
async function endVrViewer(){
  if(!vrState.session)return;
  try{await vrState.session.end();}catch(err){}
}
function finishVrViewer(){
  vrState.active=false;
  vrState.session=null;
  vrState.referenceSpace=null;
  vrState.baseLayer=null;
  document.body.classList.remove('vr-viewer');
  document.body.classList.toggle('menuless',vrState.wasMenuHidden);
  scene.uiHidden=vrState.wasMenuHidden;
  updateVrButton();
  setVrStatus('VR Viewer beendet.');
  resize();
  requestAnimationFrame(loop);
}
async function startVrViewer(){
  if(vrState.active){endVrViewer();return;}
  const availability=await getVrAvailability();
  if(!availability.ok){
    setVrStatus(vrUnsupportedMessage(availability.reason,availability.detail),true);
    return;
  }
  try{
    setVrStatus('VR Viewer wird gestartet ...');
    if(gl.makeXRCompatible)await gl.makeXRCompatible();
    const session=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor']});
    const baseLayer=new XRWebGLLayer(session,gl);
    session.updateRenderState({baseLayer});
    let referenceSpace=null;
    let referenceSpaceType='local-floor';
    try{referenceSpace=await session.requestReferenceSpace('local-floor');}
    catch(err){referenceSpaceType='local';referenceSpace=await session.requestReferenceSpace('local');}
    vrState.wasMenuHidden=!!scene.uiHidden;
    vrState.active=true;
    vrState.session=session;
    vrState.referenceSpace=referenceSpace;
    vrState.referenceSpaceType=referenceSpaceType;
    vrState.baseLayer=baseLayer;
    session.addEventListener('end',finishVrViewer,{once:true});
    document.body.classList.add('menuless','vr-viewer');
    scene.uiHidden=true;
    updateVrButton();
    setVrStatus('VR Viewer aktiv. ESC oder Button beendet den Modus.');
    session.requestAnimationFrame(vrFrame);
  }catch(err){
    console.warn('VR Viewer konnte nicht gestartet werden:',err);
    setVrStatus(vrUnsupportedMessage('request-failed',vrErrorLabel(err)),true);
    vrState.active=false;
    updateVrButton();
    resize();
  }
}
if(vrViewerBtn)vrViewerBtn.addEventListener('click',startVrViewer);
updateVrButton();
refreshVrAvailability();
