/* ===== Partikeleffekt: Blitz ===== */
(function(){
  const defaults={
    lightningMode:'branched',lightningStartX:0,lightningStartY:-120,lightningEndX:0,lightningEndY:180,
    lightningLength:300,lightningDirection:90,lightningWidth:1,lightningSegments:18,lightningChaos:42,
    lightningBranchStrength:.75,lightningBranchCount:7,lightningBranchLength:95,lightningBranchAngle:42,
    lightningSeed:1,lightningNewShape:true,lightningCoreColor:'#f8fbff',lightningGlowColor:'#7888ff',
    lightningCoreWidth:1.4,lightningGlowWidth:10,lightningGlowIntensity:1.35,lightningBrightness:1.4,
    lightningOpacity:1,lightningMarkerOpacity:1,particleEmitterTransparency:0,lightningSoftness:.55,lightningAdditive:true,lightningDuration:.18,
    lightningFlickers:3,lightningFlickerGap:.045,lightningAfterBrightness:.45,lightningRandomDuration:.18,
    lightningRandomDelay:0,lightningRepeatRate:0,lightningEndpointMotion:false,lightningEndpointJitter:18,
    lightningMorphDuringFlicker:true,lightningDrift:.08,lightningMorphSpeed:1.2,lightningAudioBrightness:true,
    lightningAudioWidth:true,lightningAudioBranches:true,lightningAudioChaos:true,lightningAudioAfterglow:true,
    lightningImpactEnabled:true,lightningImpactSize:42,lightningImpactBrightness:1.2,lightningSparkCount:12,
    lightningSparkLife:.28,lightningSmokeAmount:0,lightningShockwaveStrength:.55
  };
  const numericKeys=new Set(Object.keys(defaults).filter(k=>typeof defaults[k]==='number'));
  const boolKeys=new Set(Object.keys(defaults).filter(k=>typeof defaults[k]==='boolean'));
  const panelSpec=[
    ['mode','Blitz-Modus','select','lightningMode',[['single','Einzelblitz'],['branched','Verzweigter Blitz'],['weather','Wetterblitz'],['area','Flächenblitz'],['arc','Elektrischer Lichtbogen']]],
    ['startX','Startpunkt X','number','lightningStartX'],['startY','Startpunkt Y','number','lightningStartY'],['endX','Endpunkt X','number','lightningEndX'],['endY','Endpunkt Y','number','lightningEndY'],
    ['length','Länge','number','lightningLength'],['direction','Richtung','number','lightningDirection'],['width','Breite','number','lightningWidth'],['segments','Segmentanzahl','number','lightningSegments'],
    ['chaos','Unregelmäßigkeit','number','lightningChaos'],['branchStrength','Verzweigungsstärke','number','lightningBranchStrength'],['branchCount','Anzahl Nebenäste','number','lightningBranchCount'],['branchLength','Max. Astlänge','number','lightningBranchLength'],['branchAngle','Astwinkel','number','lightningBranchAngle'],
    ['seed','Seed','number','lightningSeed'],['newShape','Neue Form bei jedem Trigger','checkbox','lightningNewShape'],
    ['coreColor','Kernfarbe','color','lightningCoreColor'],['glowColor','Glow-Farbe','color','lightningGlowColor'],['coreWidth','Kernbreite','number','lightningCoreWidth'],['glowWidth','Glow-Breite','number','lightningGlowWidth'],['glowIntensity','Glow-Intensität','number','lightningGlowIntensity'],['brightness','Helligkeit','number','lightningBrightness'],['markerOpacity','Marker-Deckkraft','number','lightningMarkerOpacity'],['softness','Weichheit','number','lightningSoftness'],['additive','Additiv','checkbox','lightningAdditive'],
    ['duration','Blitzdauer','number','lightningDuration'],['flickers','Flackerimpulse','number','lightningFlickers'],['gap','Impulsabstand','number','lightningFlickerGap'],['after','Nachblitz-Helligkeit','number','lightningAfterBrightness'],['randDur','Zufällige Dauer','number','lightningRandomDuration'],['randDelay','Zufällige Verzögerung','number','lightningRandomDelay'],['repeat','Wiederholungsrate','number','lightningRepeatRate'],
    ['endpointMotion','Endpunktbewegung','checkbox','lightningEndpointMotion'],['endpointJitter','Endpunkt-Zufall','number','lightningEndpointJitter'],['morph','Formänderung beim Flackern','checkbox','lightningMorphDuringFlicker'],['drift','Seitliche Drift','number','lightningDrift'],['morphSpeed','Formänderungs-Speed','number','lightningMorphSpeed'],
    ['audBright','Audio: Pegel steuert Helligkeit','checkbox','lightningAudioBrightness'],['audWidth','Audio: Bass steuert Breite','checkbox','lightningAudioWidth'],['audBranch','Audio: Mitten steuern Äste','checkbox','lightningAudioBranches'],['audChaos','Audio: Höhen steuern Unruhe','checkbox','lightningAudioChaos'],['audAfter','Audio: Intensität steuert Nachblitze','checkbox','lightningAudioAfterglow'],
    ['impact','Einschlag aktiv','checkbox','lightningImpactEnabled'],['impactSize','Einschlaggröße','number','lightningImpactSize'],['impactBrightness','Einschlaghelligkeit','number','lightningImpactBrightness'],['sparkCount','Funkenanzahl','number','lightningSparkCount'],['sparkLife','Funkenlebensdauer','number','lightningSparkLife'],['smoke','Rauchstärke','number','lightningSmokeAmount'],['shock','Schockwelle','number','lightningShockwaveStrength']
  ];
  const sliderSpec={
    lightningStartX:[-1200,1200,1],lightningStartY:[-1200,1200,1],lightningEndX:[-1200,1200,1],lightningEndY:[-1200,1200,1],
    lightningLength:[10,2000,1],lightningDirection:[0,360,1],lightningWidth:[0,8,.01],lightningSegments:[2,96,1],
    lightningChaos:[0,220,1],lightningBranchStrength:[0,3,.01],lightningBranchCount:[0,32,1],lightningBranchLength:[0,700,1],lightningBranchAngle:[0,180,1],
    lightningSeed:[1,9999,1],lightningCoreWidth:[.2,12,.1],lightningGlowWidth:[0,80,.1],lightningGlowIntensity:[0,4,.01],lightningBrightness:[0,5,.01],
    lightningMarkerOpacity:[0,1,.01],lightningSoftness:[0,1,.01],lightningDuration:[.03,.5,.01],
    lightningFlickers:[1,8,1],lightningFlickerGap:[.01,.2,.005],lightningAfterBrightness:[0,1,.01],lightningRandomDuration:[0,.5,.01],lightningRandomDelay:[0,2,.01],lightningRepeatRate:[0,20,.1],
    lightningEndpointJitter:[0,300,1],lightningDrift:[0,1,.01],lightningMorphSpeed:[0,5,.01],
    lightningImpactSize:[0,300,1],lightningImpactBrightness:[0,5,.01],lightningSparkCount:[0,80,1],lightningSparkLife:[0,2,.01],lightningSmokeAmount:[0,3,.01],lightningShockwaveStrength:[0,3,.01]
  };
  function formatValue(key,value){
    const n=Number(value)||0;
    if(key==='lightningMarkerOpacity')return Math.round(n*100)+'%';
    if(key==='lightningDirection'||key==='lightningBranchAngle')return Math.round(n)+'°';
    if(key==='lightningDuration'||key==='lightningFlickerGap'||key==='lightningRandomDuration'||key==='lightningRandomDelay'||key==='lightningSparkLife')return n.toFixed(2)+' s';
    if(['lightningSegments','lightningBranchCount','lightningSeed','lightningSparkCount'].includes(key))return String(Math.round(n));
    if(Math.abs(n)>=10)return String(Math.round(n));
    return n.toFixed(2);
  }
  function updateValueLabel(input){
    const value=input&&input.closest('label')&&input.closest('label').querySelector('[data-value-for]');
    if(value)value.textContent=formatValue(input.dataset.key,input.value);
  }
  function setNativeParticleRowsHidden(active){
    if(!selected||selected.type!=='particle')return;
    ['pParticleEmitterTransparency','pParticleOpacity'].forEach(id=>{
      const input=document.getElementById(id);
      const row=input&&(input.closest('.type-particle-common')||input.closest('label'));
      if(row)row.style.display=active?'none':'';
    });
  }
  function ensureLightningDefaults(o){
    if(!o||o.type!=='particle')return o;
    normalizeLightningMarkerOpacity(o);
    Object.entries(defaults).forEach(([k,v])=>{if(o[k]===undefined)o[k]=v;});
    if((o.particleMode||'free')==='lightning'){
      o.color=o.color||defaults.lightningCoreColor;o.particleAltColor=o.particleAltColor||defaults.lightningGlowColor;
      o.particleEmissionMode=o.particleEmissionMode||'trigger';o.particleUnlimited=false;
      o.particleLife=Math.max(.08,Number(o.lightningDuration||defaults.lightningDuration));
    }
    return o;
  }
  function normalizeLightningMarkerOpacity(o,snap=null){
    if(!o||o.type!=='particle'||(o.particleMode||'free')!=='lightning')return o;
    if(snap&&Object.prototype.hasOwnProperty.call(snap,'lightningMarkerOpacity')){
      o.lightningMarkerOpacity=Math.max(0,Math.min(1,Number(snap.lightningMarkerOpacity)));
      o.particleEmitterTransparency=Math.max(0,Math.min(1,1-o.lightningMarkerOpacity));
    }else if(snap&&Object.prototype.hasOwnProperty.call(snap,'particleEmitterTransparency')){
      o.particleEmitterTransparency=Math.max(0,Math.min(1,Number(snap.particleEmitterTransparency)));
      o.lightningMarkerOpacity=Math.max(0,Math.min(1,1-o.particleEmitterTransparency));
    }else if(o.lightningMarkerOpacity===undefined){
      o.lightningMarkerOpacity=o.particleEmitterTransparency===undefined?defaults.lightningMarkerOpacity:Math.max(0,Math.min(1,1-Number(o.particleEmitterTransparency||0)));
    }else{
      o.lightningMarkerOpacity=Math.max(0,Math.min(1,Number(o.lightningMarkerOpacity)));
      o.particleEmitterTransparency=Math.max(0,Math.min(1,1-o.lightningMarkerOpacity));
    }
    return o;
  }
  function lcg(seed){let s=(Math.floor(seed)||1)>>>0;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
  function pointAlong(a,b,t){return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}
  function buildLightning(o,seed,boost={level:0,bass:0,mid:0,high:0}){
    ensureLightningDefaults(o);
    const rnd=lcg(seed),mode=o.lightningMode||'branched';
    let start={x:Number(o.lightningStartX||0),y:Number(o.lightningStartY??-120)};
    let end={x:Number(o.lightningEndX||0),y:Number(o.lightningEndY??180)};
    const len=Number(o.lightningLength||300),dir=(Number(o.lightningDirection||90)-90)*Math.PI/180;
    if(mode==='weather'){start.y=-Math.abs(len)*.55;end.y=Math.abs(len)*.55;start.x+=((rnd()-.5)*len*.35);}
    if(mode==='area'){start={x:(rnd()-.5)*len,y:(rnd()-.5)*len*.65};end={x:(rnd()-.5)*len,y:(rnd()-.5)*len*.65};}
    if(mode==='arc'||(Math.abs(end.x-start.x)+Math.abs(end.y-start.y)<1)){end={x:start.x+Math.cos(dir)*len,y:start.y+Math.sin(dir)*len};}
    if(o.lightningEndpointMotion){end.x+=(rnd()-.5)*Number(o.lightningEndpointJitter||0);end.y+=(rnd()-.5)*Number(o.lightningEndpointJitter||0);}
    const seg=Math.max(2,Math.min(96,Math.round(Number(o.lightningSegments||18))));
    const chaos=Number(o.lightningChaos||42)*(1+(o.lightningAudioChaos?boost.high*.8:0));
    const dx=end.x-start.x,dy=end.y-start.y,d=Math.max(1,Math.hypot(dx,dy)),nx=-dy/d,ny=dx/d;
    const main=[];
    for(let i=0;i<=seg;i++){
      const t=i/seg,fade=Math.pow(1-t,.45);
      const off=(rnd()-.5)*chaos*fade*(i===0||i===seg?0:1);
      main.push({x:start.x+dx*t+nx*off,y:start.y+dy*t+ny*off});
    }
    const lines=[];
    for(let i=0;i<main.length-1;i++)lines.push({a:main[i],b:main[i+1],w:1,alpha:1,kind:'main'});
    const bCount=mode==='single'?0:Math.round(Number(o.lightningBranchCount||7)*(1+Number(o.lightningBranchStrength||.75))*(1+(o.lightningAudioBranches?boost.mid:0)));
    for(let b=0;b<bCount;b++){
      const idx=1+Math.floor(rnd()*Math.max(1,main.length-3)),base=main[idx],t=idx/(main.length-1);
      const sign=rnd()<.5?-1:1,ang=(Math.atan2(dy,dx)+sign*(Number(o.lightningBranchAngle||42)*Math.PI/180)*(0.55+rnd()));
      const bl=Number(o.lightningBranchLength||95)*(1-t)*(0.35+rnd()*.8);
      const steps=2+Math.floor(rnd()*4);let prev=base;
      for(let j=1;j<=steps;j++){
        const p=j/steps,side=(rnd()-.5)*chaos*.28*(1-p);
        const cur={x:base.x+Math.cos(ang)*bl*p+nx*side,y:base.y+Math.sin(ang)*bl*p+ny*side};
        lines.push({a:prev,b:cur,w:(1-p*.65)*.62,alpha:(1-p)*.72,kind:'branch'});
        prev=cur;
      }
    }
    return {lines,start,end,seed};
  }
  function lightningPulse(o,local,oa){
    const dur=Math.max(.03,Number(o.lightningDuration||.18))*(1+(Number(o.lightningRandomDuration||0))*0.5);
    const gap=Math.max(.01,Number(o.lightningFlickerGap||.045));
    const count=Math.max(1,Math.min(8,Math.round(Number(o.lightningFlickers||3)+(o.lightningAudioAfterglow?oa.level*2:0))));
    let amp=0;
    for(let i=0;i<count;i++){
      const start=i*gap,age=local-start;
      if(age<0||age>dur)continue;
      const main=i===0?1:Number(o.lightningAfterBrightness||.45);
      amp=Math.max(amp,main*(age<dur*.2?1:Math.pow(1-age/dur,2.4)));
    }
    return amp;
  }
  function linePass(lines,color,width,alpha){
    const arr=[];
    for(const l of lines){
      const dx=l.b.x-l.a.x,dy=l.b.y-l.a.y,len=Math.max(0.001,Math.hypot(dx,dy));
      const half=Math.max(0.35,width*(l.w||1))*0.5,nx=-dy/len*half,ny=dx/len*half;
      const ax=l.a.x+nx,ay=l.a.y+ny,bx=l.b.x+nx,by=l.b.y+ny,cx=l.b.x-nx,cy=l.b.y-ny,dx2=l.a.x-nx,dy2=l.a.y-ny;
      arr.push(ax,ay,bx,by,cx,cy, ax,ay,cx,cy,dx2,dy2);
    }
    if(!arr.length)return;
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(loc.a,2,gl.FLOAT,false,0,0);
    gl.uniform1f(loc.scale,1);gl.uniform1f(loc.rot,0);
    gl.uniform4f(loc.color,color[0],color[1],color[2],alpha);
    gl.drawArrays(gl.TRIANGLES,0,arr.length/2);
  }
  function drawLightning(o){
    ensureLightningDefaults(o);
    const now=performance.now()/1000,trigger=updateParticleTrigger(o,now);
    const repeat=Number(o.lightningRepeatRate||0);
    if(repeat>0&&(o.particleEmissionMode==='permanent'||o.particleUnlimited)&&(!o._lightningRepeatLast||now-o._lightningRepeatLast>=1/repeat)){triggerParticleEffect(o,1);o._lightningRepeatLast=now;}
    if(!trigger.active||trigger.strength<=0)return;
    const oa=objectAudio(o),amp=lightningPulse(o,trigger.local,oa)*trigger.strength;
    if(amp<=.005)return;
    const flicker=Math.floor(trigger.local/Math.max(.01,Number(o.lightningFlickerGap||.045)));
    const seedBase=Number(o.lightningSeed||1)+(Number((o.id||'').replace(/\D/g,''))||0)*97;
    const seed=(o.lightningNewShape!==false?Math.floor((o._particleStart||now)*1000):0)+seedBase+(o.lightningMorphDuringFlicker?flicker*31:0);
    if(!o._lightningShape||o._lightningShape.seed!==seed)o._lightningShape=buildLightning(o,seed,oa);
    const shape=o._lightningShape,core=hex(o.lightningCoreColor||o.color||'#f8fbff'),glow=hex(o.lightningGlowColor||o.particleAltColor||'#7888ff');
    const bright=Number(o.lightningBrightness||1.4)*(1+(o.lightningAudioBrightness?oa.level*1.4:0))*amp*Number(o.intensity??1);
    const widthBoost=1+(o.lightningAudioWidth?oa.bass*1.2:0);
    gl.useProgram(shapeProg);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.enableVertexAttribArray(loc.a);
    gl.uniform2f(loc.res,canvas.clientWidth,canvas.clientHeight);
    gl.uniform2f(loc.pos,objCssX(o),objCssY(o));
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,o.lightningAdditive!==false?gl.ONE:gl.ONE_MINUS_SRC_ALPHA);
    linePass(shape.lines,glow,Number(o.lightningGlowWidth||10)*widthBoost,Math.min(1,Number(o.lightningOpacity||1)*Number(o.lightningGlowIntensity||1.35)*bright*.18));
    linePass(shape.lines,glow,Number(o.lightningGlowWidth||10)*.45*widthBoost,Math.min(1,Number(o.lightningOpacity||1)*bright*.38));
    linePass(shape.lines,core,Number(o.lightningCoreWidth||1.4)*widthBoost,Math.min(1,Number(o.lightningOpacity||1)*bright));
    if(o.lightningImpactEnabled!==false){
      const p=shape.end,s=Number(o.lightningImpactSize||42)*stageScale(),c=glow;
      drawPrimitive(circlePoints(32),gl.TRIANGLE_FAN,[c[0],c[1],c[2],Math.min(.9,bright*.16*Number(o.lightningImpactBrightness||1.2))],[objCssX(o)+p.x*stageScale(),objCssY(o)+p.y*stageScale()],0,s);
    }
  }
  function drawLightningEmitterMarker(o){
    const alpha=Math.max(0,Math.min(1,Number(o.lightningMarkerOpacity??1)));
    if(alpha<=0.001)return;
    const cw=canvas.clientWidth,ch=canvas.clientHeight,c=hex(o.color||'#f8fbff');
    gl.useProgram(shapeProg);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.enableVertexAttribArray(loc.a);gl.vertexAttribPointer(loc.a,2,gl.FLOAT,false,0,0);
    gl.uniform2f(loc.res,cw,ch);gl.uniform2f(loc.pos,objCssX(o),objCssY(o));gl.uniform1f(loc.rot,effectiveRotation(o)*Math.PI/180);
    let pts=shapePoints(o.type);
    if((o.particleEmitterShape||'point')==='line'){
      const len=su(o.particleEmitterLength??120),th=Math.max(3*stageScale(),su(o.size||72)*0.08);
      pts=[-th/2,-len/2, th/2,-len/2, th/2,len/2, -th/2,len/2];
      gl.uniform1f(loc.scale,1);
    }else{
      gl.uniform1f(loc.scale,su(o.size));
    }
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pts),gl.STATIC_DRAW);
    gl.uniform4f(loc.color,c[0],c[1],c[2],alpha);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLE_FAN,0,pts.length/2);
  }
  function menuBody(panel){return panel&&panel.classList&&panel.classList.contains('menuTier')?panel.querySelector('.menuTierBody'):panel;}
  function findObjectParamTarget(){
    const root=document.getElementById('objectParamFloatingBody')||document.getElementById('params');
    if(!root)return null;
    const misc=[...root.querySelectorAll('details.menuTier')].find(d=>{
      const summary=d.querySelector(':scope > summary');
      return summary&&summary.textContent.includes('Weitere');
    });
    return menuBody(misc)||root;
  }
  function placePanel(panel){
    const target=findObjectParamTarget()||document.getElementById('params');
    if(target&&panel.parentElement!==target)target.appendChild(panel);
  }
  function installPanel(){
    const params=document.getElementById('params');if(!params)return null;
    let panel=document.getElementById('lightningParticlePanel');
    if(panel){placePanel(panel);return panel;}
    panel=document.createElement('details');panel.id='lightningParticlePanel';panel.className='type-particle-only menuTier lightningParticlePanel';panel.style.display='none';panel.open=true;
    const summary=document.createElement('summary');summary.textContent='Blitz';
    const body=document.createElement('div');body.className='menuTierBody panel';
    body.innerHTML='<p class="mini">Kurzer, gezackter Lichtkanal mit optionalen Nebenästen, Flackern und Einschlag.</p>';
    panel.appendChild(summary);panel.appendChild(body);
    const groups=[['Position und Geometrie',0,14],['Aussehen',14,23],['Zeitverhalten',23,30],['Bewegung und Audio',30,39],['Einschlag',39,panelSpec.length]];
    for(const [title,a,b] of groups){
      const block=document.createElement('div');block.className='panel lightningSubPanel';block.innerHTML='<h3>'+title+'</h3>';
      for(const spec of panelSpec.slice(a,b)){
        const [id,label,type,key,opts]=spec;
        const wrap=document.createElement('label');
        let input;
        if(type==='select'){input=document.createElement('select');for(const [v,t] of opts){const option=document.createElement('option');option.value=v;option.textContent=t;input.appendChild(option);}}
        else{input=document.createElement('input');input.type=type==='number'?'range':type; if(type==='number'){const spec=sliderSpec[key]||[0,1,.01];input.min=spec[0];input.max=spec[1];input.step=spec[2];}}
        if(type==='number')wrap.innerHTML=label+': <span data-value-for="'+key+'"></span>';
        else if(type==='checkbox'){wrap.className='checkrow';wrap.appendChild(input);const span=document.createElement('span');span.textContent=label;wrap.appendChild(span);}
        else wrap.textContent=label;
        input.id='pLightning_'+id;input.dataset.key=key;if(input.parentElement!==wrap)wrap.appendChild(input);block.appendChild(wrap);
        input.addEventListener('input',()=>{if(!selected||selected.type!=='particle')return;let v=input.type==='checkbox'?input.checked:input.value;if(numericKeys.has(key))v=Number(v);selected[key]=v;if(key==='lightningMarkerOpacity')selected.particleEmitterTransparency=Math.max(0,Math.min(1,1-Number(v||0)));if(key==='lightningCoreColor')selected.color=v;if(key==='lightningGlowColor')selected.particleAltColor=v;if(key==='lightningDuration')selected.particleLife=Math.max(.08,Number(v)||.08);selected._lightningShape=null;updateValueLabel(input);});
      }
      body.appendChild(block);
    }
    placePanel(panel);
    if(typeof window.vseRefreshColorControls==='function')requestAnimationFrame(window.vseRefreshColorControls);
    return panel;
  }
  function syncPanel(){
    const panel=installPanel();if(!panel)return;
    placePanel(panel);
    const active=!!(selected&&selected.type==='particle'&&(selected.particleMode||'free')==='lightning');
    panel.style.display=active?'block':'none';
    setNativeParticleRowsHidden(active);
    if(!active)return;
    ensureLightningDefaults(selected);
    panel.querySelectorAll('[data-key]').forEach(input=>{
      const key=input.dataset.key;
      if(input.type==='checkbox')input.checked=!!selected[key];else input.value=selected[key]??defaults[key];
      updateValueLabel(input);
    });
    if(typeof window.vseRefreshColorControls==='function')requestAnimationFrame(window.vseRefreshColorControls);
  }
  const basePreset=particlePresetDefaults;
  particlePresetDefaults=function(mode){
    const d=basePreset(mode);
    return mode==='lightning'?{...d,...defaults,particleMode:'lightning',color:'#f8fbff',particleAltColor:'#7888ff',particleAmount:.18,particleLife:.18,particleEmissionDuration:.08,particleEmissionMode:'trigger',particleUnlimited:false,particleAudio:.35,music:.35,audioFreq:4200,thresholdBelow:false}:d;
  };
  const baseDraw=drawParticle;
  drawParticle=function(o){if(o&&o.type==='particle'&&(o.particleMode||'free')==='lightning')return drawLightning(o);return baseDraw(o);};
  const baseDrawBody=drawBody;
  drawBody=function(o){if(o&&o.type==='particle'&&(o.particleMode||'free')==='lightning')return drawLightningEmitterMarker(o);return baseDrawBody(o);};
  if(typeof applyTimelineSnapshot==='function'){
    const baseApplyTimelineSnapshot=applyTimelineSnapshot;
    applyTimelineSnapshot=function(o,snap){
      baseApplyTimelineSnapshot(o,snap);
      normalizeLightningMarkerOpacity(o,snap);
    };
  }
  const baseSelect=selectSingleCore;
  selectSingleCore=function(o){baseSelect(o);if(o)ensureLightningDefaults(o);syncPanel();};
  const baseSync=syncTypeUI;
  syncTypeUI=function(){baseSync();syncPanel();};
  document.addEventListener('DOMContentLoaded',syncPanel);
  installPanel();syncPanel();
})();
