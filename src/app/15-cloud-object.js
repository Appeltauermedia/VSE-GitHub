/* ===== Procedural Cloud object ===== */
(function(){
  const cloudProg=program(VSE_CLOUD_VERTEX_SHADER,VSE_CLOUD_FRAGMENT_SHADER);
  const U=name=>gl.getUniformLocation(cloudProg,name);
  const cloudLoc={index:gl.getAttribLocation(cloudProg,'aIndex'),pixelRes:U('uPixelRes'),cssRes:U('uCssRes'),origin:U('uOriginCss'),size:U('uSize'),rot:U('uRot'),time:U('uTime'),density:U('uDensity'),softness:U('uSoftness'),brightness:U('uBrightness'),seed:U('uSeed'),motion:U('uMotion'),speed:U('uSpeed'),detail:U('uDetail'),opacity:U('uOpacity'),color:U('uColor'),wind:U('uWind'),audio:U('uAudio'),lifecycle:U('uLifecycle'),preset:U('uPreset')};
  const CLOUD_PARTICLE_MAX=512,cloudParticleBuffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,cloudParticleBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(Array.from({length:CLOUD_PARTICLE_MAX},(_,i)=>i)),gl.STATIC_DRAW);
  const presets={
    cumulus:{cloudPreset:'cumulus',cloudDensity:.82,cloudSoftness:.72,cloudColor:'#f4f7ff',cloudBrightness:1.08,cloudMotion:.35,cloudSpeed:.24,cloudDetail:.68},
    stratus:{cloudPreset:'stratus',cloudDensity:.62,cloudSoftness:.88,cloudColor:'#dfe6ee',cloudBrightness:.88,cloudMotion:.22,cloudSpeed:.16,cloudDetail:.38},
    fog:{cloudPreset:'fog',cloudDensity:.42,cloudSoftness:.96,cloudColor:'#d8e2e5',cloudBrightness:.82,cloudMotion:.55,cloudSpeed:.18,cloudDetail:.28},
    storm:{cloudPreset:'storm',cloudDensity:1.0,cloudSoftness:.58,cloudColor:'#667080',cloudBrightness:.62,cloudMotion:.55,cloudSpeed:.34,cloudDetail:.86},
    smoke:{cloudPreset:'smoke',cloudDensity:.78,cloudSoftness:.70,cloudColor:'#6e6965',cloudBrightness:.72,cloudMotion:.95,cloudSpeed:.48,cloudDetail:.78}
  };
  function cloudDefaults(o){
    const d=presets.cumulus;
    Object.assign(o,{cloudPreset:o.cloudPreset||d.cloudPreset,cloudDensity:Number(o.cloudDensity??d.cloudDensity),cloudSoftness:Number(o.cloudSoftness??d.cloudSoftness),cloudColor:o.cloudColor||d.cloudColor,cloudBrightness:Number(o.cloudBrightness??d.cloudBrightness),cloudSeed:Number(o.cloudSeed??Math.random()*1000),cloudMotion:Number(o.cloudMotion??d.cloudMotion),cloudSpeed:Number(o.cloudSpeed??d.cloudSpeed),cloudDetail:Number(o.cloudDetail??d.cloudDetail),cloudWidth:Number(o.cloudWidth??Math.max(40,Number(o.size||180)*2)),cloudHeight:Number(o.cloudHeight??Math.max(30,Number(o.size||180)*1.22)),cloudEvolutionMode:o.cloudEvolutionMode||'wobble',cloudEvolutionDuration:Number(o.cloudEvolutionDuration??8),cloudOpacity:Number(o.cloudOpacity??.78),cloudVisible:o.cloudVisible!==false,cloudLocked:!!o.cloudLocked,cloudAudioMode:o.cloudAudioMode||'off',cloudAudioAmount:Number(o.cloudAudioAmount??.45),cloudAudioFrequency:Number(o.cloudAudioFrequency??o.audioFreq??250),cloudAudioThreshold:Number(o.cloudAudioThreshold??o.music??.30),cloudWindInfluence:Number(o.cloudWindInfluence??.55),windAffected:o.windAffected!==false,windInfluence:Number(o.windInfluence??.55)});
    o.audioFreq=o.cloudAudioFrequency;o.music=o.cloudAudioThreshold;
    o.size=Number(o.size||180);o.color=o.cloudColor;o.opacity=o.cloudOpacity;return o;
  }
  const baseNewObj=newObj;
  newObj=function(type,x,y){const o=baseNewObj(type,x,y);if(type==='cloud'){o.name='Wolke_'+o.id.replace('obj_','');o.size=180;o.rotation=0;cloudDefaults(o);}return o;};
  const baseEnsure=ensureTypeDefaults;
  ensureTypeDefaults=function(o){o=baseEnsure(o);if(o&&o.type==='cloud')cloudDefaults(o);return o;};
  window.ensureCloudDefaults=cloudDefaults;
  window.applyCloudPreset=function(o,key){const p=presets[key];if(!o||o.type!=='cloud'||!p)return;Object.assign(o,p);o.color=o.cloudColor;syncCloudUI(o);};
  function presetIndex(v){return ({cumulus:0,stratus:1,fog:2,storm:3,smoke:4})[v]??0;}
  function cloudLifecycle(o,now){
    const mode=o.cloudEvolutionMode||'wobble';if(mode==='wobble')return 1;
    const duration=Math.max(1,Number(o.cloudEvolutionDuration||8));
    if(!Number.isFinite(o._cloudEvolutionStartedAt))o._cloudEvolutionStartedAt=now;
    const p=((now-o._cloudEvolutionStartedAt)/duration)%1;
    if(mode==='build')return p;if(mode==='dissolve')return 1-p;
    return 1-Math.abs(p*2-1);
  }
  function updateCloudWindDrift(o,wind,now){
    const last=Number(o._cloudWindUpdatedAt||now);const dt=Math.max(0,Math.min(.05,now-last));o._cloudWindUpdatedAt=now;
    if(!wind||!wind.enabled||dt<=0)return;
    o.x=Number(o.x||0)+Number(wind.percentX||0)*dt*6;
    if(o.x>115)o.x=-15;else if(o.x<-15)o.x=115;
  }
  function drawCloud(o){
    if(!o||o.cloudVisible===false)return;cloudDefaults(o);
    const cw=canvas.clientWidth,ch=canvas.clientHeight;
    const audio=typeof objectAudio==='function'?objectAudio(o):{level:0};const av=clamp01(Number(audio.level||0)*Number(o.cloudAudioAmount||0));
    let density=o.cloudDensity,brightness=o.cloudBrightness,opacity=o.cloudOpacity;
    if(o.cloudAudioMode==='density')density*=1+av;if(o.cloudAudioMode==='brightness')brightness*=1+av;if(o.cloudAudioMode==='opacity')opacity*=1+av*.75;
    const now=performance.now()/1000;const wind=typeof windForObject==='function'?windForObject(o,'cloud'):{cssX:0,cssY:0};updateCloudWindDrift(o,wind,now);
    gl.useProgram(cloudProg);gl.bindBuffer(gl.ARRAY_BUFFER,cloudParticleBuffer);gl.enableVertexAttribArray(cloudLoc.index);gl.vertexAttribPointer(cloudLoc.index,1,gl.FLOAT,false,0,0);
    gl.uniform2f(cloudLoc.pixelRes,canvas.width,canvas.height);gl.uniform2f(cloudLoc.cssRes,cw,ch);gl.uniform2f(cloudLoc.origin,objCssX(o),objCssY(o));
    gl.uniform2f(cloudLoc.size,su(o.cloudWidth||360),su(o.cloudHeight||220));gl.uniform1f(cloudLoc.rot,Number(o.rotation||0)*Math.PI/180);gl.uniform1f(cloudLoc.time,now);
    gl.uniform1f(cloudLoc.density,density);gl.uniform1f(cloudLoc.softness,o.cloudSoftness);gl.uniform1f(cloudLoc.brightness,brightness);gl.uniform1f(cloudLoc.seed,o.cloudSeed);gl.uniform1f(cloudLoc.motion,o.cloudMotion);gl.uniform1f(cloudLoc.speed,o.cloudSpeed);gl.uniform1f(cloudLoc.detail,o.cloudDetail);gl.uniform1f(cloudLoc.opacity,opacity*Number(o.intensity??1));
    const col=hex(o.cloudColor);gl.uniform3f(cloudLoc.color,col[0],col[1],col[2]);gl.uniform2f(cloudLoc.wind,Number(wind.cssX||0),Number(wind.cssY||0));gl.uniform1f(cloudLoc.audio,av);gl.uniform1f(cloudLoc.lifecycle,cloudLifecycle(o,now));gl.uniform1i(cloudLoc.preset,presetIndex(o.cloudPreset));
    const particleCount=Math.max(112,Math.min(CLOUD_PARTICLE_MAX,Math.round(144+Number(o.cloudDetail||0)*288+Number(density||0)*48)));
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.drawArrays(gl.POINTS,0,particleCount);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  }
  window.drawCloud=drawCloud;
  const controls=['Preset','Density','Softness','Color','Brightness','Seed','Motion','Speed','WindInfluence','Detail','Width','Height','EvolutionMode','EvolutionDuration','Opacity','Visible','Locked','AudioMode','AudioAmount','AudioFrequency','AudioThreshold'];
  const prop={Preset:'cloudPreset',Density:'cloudDensity',Softness:'cloudSoftness',Color:'cloudColor',Brightness:'cloudBrightness',Seed:'cloudSeed',Motion:'cloudMotion',Speed:'cloudSpeed',WindInfluence:'cloudWindInfluence',Detail:'cloudDetail',Width:'cloudWidth',Height:'cloudHeight',EvolutionMode:'cloudEvolutionMode',EvolutionDuration:'cloudEvolutionDuration',Opacity:'cloudOpacity',Visible:'cloudVisible',Locked:'cloudLocked',AudioMode:'cloudAudioMode',AudioAmount:'cloudAudioAmount',AudioFrequency:'cloudAudioFrequency',AudioThreshold:'cloudAudioThreshold'};
  function syncCloudUI(o){
    if(!o||o.type!=='cloud')return;cloudDefaults(o);
    o._cloudUiSize=Number(o.size||180);
    controls.forEach(k=>{const el=document.getElementById('pCloud'+k);if(!el)return;const v=o[prop[k]];if(el.type==='checkbox')el.checked=!!v;else el.value=v;});
    document.querySelectorAll('[data-cloud-value]').forEach(el=>{const k=el.dataset.cloudValue;const v=o[prop[k]];el.textContent=typeof v==='number'?v.toFixed(k==='Seed'?0:2):v;});
  }
  controls.forEach(k=>{const el=document.getElementById('pCloud'+k);if(!el)return;el.addEventListener('input',()=>{if(!selected||selected.type!=='cloud')return;let v=el.type==='checkbox'?el.checked:el.value;if(el.type==='range'||el.type==='number')v=Number(v);selected[prop[k]]=v;if(k==='Color')selected.color=v;if(k==='Opacity')selected.opacity=v;if(k==='WindInfluence'){selected.windInfluence=v;selected.windAffected=v>0;}if(k==='AudioFrequency')selected.audioFreq=v;if(k==='AudioThreshold')selected.music=v;if(k==='EvolutionMode')selected._cloudEvolutionStartedAt=performance.now()/1000;propagateSelectedProperty(prop[k],selected);syncCloudUI(selected);});});
  const presetEl=document.getElementById('pCloudPreset');if(presetEl)presetEl.addEventListener('change',()=>{if(selected&&selected.type==='cloud')applyCloudPreset(selected,presetEl.value);});
  const sizeEl=document.getElementById('pSize');if(sizeEl)sizeEl.addEventListener('input',()=>{if(!selected||selected.type!=='cloud')return;const next=Number(selected.size||sizeEl.value||180),prev=Math.max(1,Number(selected._cloudUiSize||180)),ratio=next/prev;selected.cloudWidth=Math.max(40,Number(selected.cloudWidth||360)*ratio);selected.cloudHeight=Math.max(30,Number(selected.cloudHeight||220)*ratio);selected._cloudUiSize=next;syncCloudUI(selected);});
  const panel=document.getElementById('cloudExpertPanel');
  const baseSelect=selectSingleCore;selectSingleCore=function(o){baseSelect(o);const active=!!(o&&o.type==='cloud');params.classList.toggle('cloudObjectSelected',active);document.querySelectorAll('.type-cloud-only').forEach(el=>el.style.display=active?'block':'none');if(active){document.querySelectorAll('.type-wind-only').forEach(el=>el.style.display='none');if(panel)panel.hidden=false;syncCloudUI(o);}};
  const typeEl=document.getElementById('pType');if(typeEl)typeEl.addEventListener('change',()=>{if(selected&&selected.type==='cloud'){cloudDefaults(selected);syncCloudUI(selected);}});
})();
