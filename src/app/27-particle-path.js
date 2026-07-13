/* ===== Partikel-Pfad ===== */
(function(){
  const MAX_PATH_PARTICLES=24000;
  const MAX_PATH_POINTS=16;
  const pathVs=`
attribute float aIdx;
uniform vec2 uPixelRes;
uniform vec2 uCssRes;
uniform vec2 uOriginCss;
uniform float uRot;
uniform float uTime;
uniform float uCount;
uniform float uWidth;
uniform float uHeight;
uniform float uArc;
uniform float uFlow;
uniform float uSpread;
uniform float uSize;
uniform float uIntensity;
uniform float uShape;
uniform float uPointCount;
uniform vec2 uPoints[16];
varying vec3 vMix;
varying float vAlpha;
float hash(float n){return fract(sin(n*127.1)*43758.5453123);}
vec2 pointByIndex(float idx){
  if(idx<.5)return uPoints[0];
  if(idx<1.5)return uPoints[1];
  if(idx<2.5)return uPoints[2];
  if(idx<3.5)return uPoints[3];
  if(idx<4.5)return uPoints[4];
  if(idx<5.5)return uPoints[5];
  if(idx<6.5)return uPoints[6];
  if(idx<7.5)return uPoints[7];
  if(idx<8.5)return uPoints[8];
  if(idx<9.5)return uPoints[9];
  if(idx<10.5)return uPoints[10];
  if(idx<11.5)return uPoints[11];
  if(idx<12.5)return uPoints[12];
  if(idx<13.5)return uPoints[13];
  if(idx<14.5)return uPoints[14];
  return uPoints[15];
}
vec2 pointAt(float t){
  float w=max(1.0,uWidth),h=max(1.0,uHeight);
  if(uShape<0.5)return vec2((t-.5)*w,0.0);
  if(uShape<1.5){
    float a=radians(mix(-uArc*.5,uArc*.5,t));
    return vec2(cos(a)*w*.5,sin(a)*h*.5);
  }
  if(uShape<2.5){
    float a=t*6.28318530718;
    return vec2(cos(a)*w*.5,sin(a)*h*.5);
  }
  if(uShape<3.5){
    float p=t*4.0;
    if(p<1.0)return vec2(mix(-w*.5,w*.5,p),-h*.5);
    if(p<2.0)return vec2(w*.5,mix(-h*.5,h*.5,p-1.0));
    if(p<3.0)return vec2(mix(w*.5,-w*.5,p-2.0),h*.5);
    return vec2(-w*.5,mix(h*.5,-h*.5,p-3.0));
  }
  float c=max(1.0,uPointCount);
  if(c<2.0)return vec2((t-.5)*w,0.0);
  float span=(c-1.0)*clamp(t,0.0,.9999);
  float i=floor(span);
  float f=fract(span);
  vec2 a=pointByIndex(i);
  vec2 b=pointByIndex(min(i+1.0,c-1.0));
  return mix(a,b,smoothstep(0.0,1.0,f));
}
void main(){
  float seed=aIdx+1.0;
  float lane=hash(seed*3.71);
  float flow=uTime*.055*uFlow;
  float t=fract(aIdx/max(1.0,uCount)+flow+hash(seed)*.035);
  vec2 p=pointAt(t);
  vec2 p2=pointAt(fract(t+.012));
  vec2 tangent=normalize(p2-p+vec2(.0001,0.0));
  vec2 normal=vec2(-tangent.y,tangent.x);
  float jitter=(hash(seed*9.17)-.5)*2.0*uSpread;
  float along=(hash(seed*5.23)-.5)*uSpread*.45;
  p+=normal*jitter+tangent*along;
  float pulse=.72+.28*sin(uTime*4.0+seed*.37);
  float s=max(1.0,uSize*(.75+lane*.75)*pulse);
  float ca=cos(uRot),sa=sin(uRot);
  vec2 rp=vec2(p.x*ca-p.y*sa,p.x*sa+p.y*ca);
  vec2 css=uOriginCss+rp;
  vec2 clip=vec2(css.x/uCssRes.x*2.0-1.0,1.0-css.y/uCssRes.y*2.0);
  gl_Position=vec4(clip,0.0,1.0);
  gl_PointSize=s*(uPixelRes.x/max(1.0,uCssRes.x));
  float band=fract(seed*.333+t*1.5);
  vMix=vec3(step(band,.38),step(.38,band)*step(band,.72),step(.72,band));
  vAlpha=clamp(uIntensity*(.55+.45*lane),0.0,2.0);
}`;
  const pathFs=`
precision mediump float;
uniform vec3 uColor;
uniform vec3 uAltColor;
uniform vec3 uAltColor2;
uniform float uOpacity;
uniform float uGlow;
varying vec3 vMix;
varying float vAlpha;
void main(){
  vec2 q=gl_PointCoord-.5;
  float d=length(q)*2.0;
  float core=smoothstep(1.0,.05,d);
  float halo=smoothstep(1.0,.0,d)*max(0.0,uGlow);
  vec3 c=uColor*vMix.x+uAltColor*vMix.y+uAltColor2*vMix.z;
  float a=(core*.75+halo*.28)*uOpacity*vAlpha;
  gl_FragColor=vec4(c*(.65+uGlow*.45),a);
}`;
  const guideVs=`
attribute vec2 aPos;
uniform vec2 uCssRes;
uniform vec2 uOriginCss;
uniform float uRot;
void main(){
  float ca=cos(uRot),sa=sin(uRot);
  vec2 p=vec2(aPos.x*ca-aPos.y*sa,aPos.x*sa+aPos.y*ca)+uOriginCss;
  gl_Position=vec4(p.x/uCssRes.x*2.0-1.0,1.0-p.y/uCssRes.y*2.0,0.0,1.0);
}`;
  const guideFs=`
precision mediump float;
uniform vec3 uColor;
uniform float uAlpha;
void main(){gl_FragColor=vec4(uColor,uAlpha);}`;

  const pathProg=program(pathVs,pathFs);
  const pathLoc={
    idx:gl.getAttribLocation(pathProg,'aIdx'),pixelRes:gl.getUniformLocation(pathProg,'uPixelRes'),cssRes:gl.getUniformLocation(pathProg,'uCssRes'),originCss:gl.getUniformLocation(pathProg,'uOriginCss'),rot:gl.getUniformLocation(pathProg,'uRot'),time:gl.getUniformLocation(pathProg,'uTime'),count:gl.getUniformLocation(pathProg,'uCount'),width:gl.getUniformLocation(pathProg,'uWidth'),height:gl.getUniformLocation(pathProg,'uHeight'),arc:gl.getUniformLocation(pathProg,'uArc'),flow:gl.getUniformLocation(pathProg,'uFlow'),spread:gl.getUniformLocation(pathProg,'uSpread'),size:gl.getUniformLocation(pathProg,'uSize'),intensity:gl.getUniformLocation(pathProg,'uIntensity'),shape:gl.getUniformLocation(pathProg,'uShape'),pointCount:gl.getUniformLocation(pathProg,'uPointCount'),points:gl.getUniformLocation(pathProg,'uPoints'),color:gl.getUniformLocation(pathProg,'uColor'),altColor:gl.getUniformLocation(pathProg,'uAltColor'),altColor2:gl.getUniformLocation(pathProg,'uAltColor2'),opacity:gl.getUniformLocation(pathProg,'uOpacity'),glow:gl.getUniformLocation(pathProg,'uGlow')
  };
  const guideProg=program(guideVs,guideFs);
  const guideLoc={pos:gl.getAttribLocation(guideProg,'aPos'),cssRes:gl.getUniformLocation(guideProg,'uCssRes'),originCss:gl.getUniformLocation(guideProg,'uOriginCss'),rot:gl.getUniformLocation(guideProg,'uRot'),color:gl.getUniformLocation(guideProg,'uColor'),alpha:gl.getUniformLocation(guideProg,'uAlpha')};
  const idxBuffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,idxBuffer);
  const indices=new Float32Array(MAX_PATH_PARTICLES);
  for(let i=0;i<indices.length;i++)indices[i]=i;
  gl.bufferData(gl.ARRAY_BUFFER,indices,gl.STATIC_DRAW);
  const guideBuffer=gl.createBuffer();

  function pathShapeIndex(o){
    return ({line:0,arc:1,circle:2,rect:3,freehand:4})[o.particlePathShape||'line']??0;
  }
  function resamplePathPoints(points,maxCount){
    const raw=Array.isArray(points)?points:[];
    const clean=raw.map(p=>({x:Number(p.x)||0,y:Number(p.y)||0})).filter((p,i,arr)=>!i||Math.hypot(p.x-arr[i-1].x,p.y-arr[i-1].y)>.001);
    if(clean.length<=maxCount)return clean;
    const dist=[0];
    for(let i=1;i<clean.length;i++)dist[i]=dist[i-1]+Math.hypot(clean[i].x-clean[i-1].x,clean[i].y-clean[i-1].y);
    const total=dist[dist.length-1];
    if(total<=.001)return [clean[0]];
    const out=[];
    let seg=1;
    for(let i=0;i<maxCount;i++){
      const target=total*i/(maxCount-1);
      while(seg<dist.length-1&&dist[seg]<target)seg++;
      const prev=Math.max(0,seg-1);
      const span=Math.max(.0001,dist[seg]-dist[prev]);
      const f=(target-dist[prev])/span;
      const a=clean[prev],b=clean[seg];
      out.push({x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f});
    }
    return out;
  }
  function pathPointsArray(o){
    const pts=resamplePathPoints(o.particlePathPoints,MAX_PATH_POINTS);
    const out=new Float32Array(MAX_PATH_POINTS*2);
    for(let i=0;i<pts.length;i++){
      out[i*2]=(Number(pts[i].x)||0)*stageScale();
      out[i*2+1]=(Number(pts[i].y)||0)*stageScale();
    }
    return {pts,out};
  }
  function samplePath(o,t){
    const w=Math.max(1,Number(o.particlePathWidth??360)),h=Math.max(1,Number(o.particlePathHeight??180));
    const shape=o.particlePathShape||'line';
    if(shape==='line')return [(t-.5)*w,0];
    if(shape==='arc'){const a=(-Number(o.particlePathArc??180)*.5+Number(o.particlePathArc??180)*t)*Math.PI/180;return [Math.cos(a)*w*.5,Math.sin(a)*h*.5];}
    if(shape==='circle'){const a=t*Math.PI*2;return [Math.cos(a)*w*.5,Math.sin(a)*h*.5];}
    if(shape==='rect'){
      const p=t*4;
      if(p<1)return [-w*.5+w*p,-h*.5];
      if(p<2)return [w*.5,-h*.5+h*(p-1)];
      if(p<3)return [w*.5-w*(p-2),h*.5];
      return [-w*.5,h*.5-h*(p-3)];
    }
    const pts=Array.isArray(o.particlePathPoints)?o.particlePathPoints:[];
    if(pts.length<2)return [(t-.5)*w,0];
    const span=(pts.length-1)*Math.min(.9999,Math.max(0,t));
    const i=Math.floor(span),f=span-i;
    const a=pts[i],b=pts[Math.min(i+1,pts.length-1)];
    return [(Number(a.x)||0)+((Number(b.x)||0)-(Number(a.x)||0))*f,(Number(a.y)||0)+((Number(b.y)||0)-(Number(a.y)||0))*f];
  }
  function drawParticlePath(o){
    const {pts,out}=pathPointsArray(o);
    const count=Math.max(80,Math.min(MAX_PATH_PARTICLES,Math.floor(220+(Math.max(0,Number(o.particleAmount??1.8))/8)*(MAX_PATH_PARTICLES-220))));
    const c=hex(o.color||'#ff6a1a'),a=hex(o.particleAltColor||'#ffd45c'),b=hex(o.particleAltColor2||'#ff4a18');
    gl.useProgram(pathProg);
    gl.bindBuffer(gl.ARRAY_BUFFER,idxBuffer);
    gl.enableVertexAttribArray(pathLoc.idx);
    gl.vertexAttribPointer(pathLoc.idx,1,gl.FLOAT,false,0,0);
    gl.uniform2f(pathLoc.pixelRes,canvas.width,canvas.height);
    gl.uniform2f(pathLoc.cssRes,canvas.clientWidth,canvas.clientHeight);
    gl.uniform2f(pathLoc.originCss,objCssX(o),objCssY(o));
    gl.uniform1f(pathLoc.rot,Number(o.rotation||0)*Math.PI/180);
    gl.uniform1f(pathLoc.time,performance.now()/1000+(Number((o.id||'').replace(/\D/g,''))||0)*.071);
    gl.uniform1f(pathLoc.count,count);
    gl.uniform1f(pathLoc.width,Number(o.particlePathWidth??360)*stageScale());
    gl.uniform1f(pathLoc.height,Number(o.particlePathHeight??180)*stageScale());
    gl.uniform1f(pathLoc.arc,Number(o.particlePathArc??180));
    gl.uniform1f(pathLoc.flow,Number(o.particlePathFlow??1)*Number(o.particleSpeed??1));
    gl.uniform1f(pathLoc.spread,Number(o.particlePathSpread??18)*stageScale());
    gl.uniform1f(pathLoc.size,Number(o.particleSize??4)*stageScale());
    gl.uniform1f(pathLoc.intensity,Number(o.intensity??1));
    gl.uniform1f(pathLoc.shape,pathShapeIndex(o));
    gl.uniform1f(pathLoc.pointCount,pts.length);
    gl.uniform2fv(pathLoc.points,out);
    gl.uniform3f(pathLoc.color,c[0],c[1],c[2]);
    gl.uniform3f(pathLoc.altColor,a[0],a[1],a[2]);
    gl.uniform3f(pathLoc.altColor2,b[0],b[1],b[2]);
    gl.uniform1f(pathLoc.opacity,Number(o.particleOpacity??.86));
    gl.uniform1f(pathLoc.glow,Number(o.particleGlow??1.1));
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
    gl.drawArrays(gl.POINTS,0,count);
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  }
  function drawParticlePathGuide(o){
    if(!(typeof isSelected==='function'?isSelected(o):selected===o))return;
    const n=(o.particlePathShape||'line')==='freehand'?(Array.isArray(o.particlePathPoints)?o.particlePathPoints.length:0):80;
    if(n<2)return;
    const closed=['circle','rect'].includes(o.particlePathShape||'line');
    const verts=[];
    const steps=(o.particlePathShape||'line')==='freehand'?n:80;
    for(let i=0;i<steps+(closed?1:0);i++){
      const p=samplePath(o,(i%steps)/Math.max(1,steps-(closed?0:1)));
      verts.push(p[0]*stageScale(),p[1]*stageScale());
    }
    const c=hex(o.color||'#ff6a1a');
    gl.useProgram(guideProg);
    gl.bindBuffer(gl.ARRAY_BUFFER,guideBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(guideLoc.pos);
    gl.vertexAttribPointer(guideLoc.pos,2,gl.FLOAT,false,0,0);
    gl.uniform2f(guideLoc.cssRes,canvas.clientWidth,canvas.clientHeight);
    gl.uniform2f(guideLoc.originCss,objCssX(o),objCssY(o));
    gl.uniform1f(guideLoc.rot,Number(o.rotation||0)*Math.PI/180);
    gl.uniform3f(guideLoc.color,c[0],c[1],c[2]);
    gl.uniform1f(guideLoc.alpha,.72);
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.LINE_STRIP,0,verts.length/2);
  }

  const baseRenderObject=renderObject;
  renderObject=function(o){
    if(o&&o.type==='particle'&&(o.particleMode||'free')==='pathFlow'){
      drawParticlePath(o);
      drawParticlePathGuide(o);
      drawBody(o);
      return;
    }
    baseRenderObject(o);
  };

  let drawArmed=false;
  let drawing=false;
  function pathPanelActive(){
    return !!(selected&&selected.type==='particle'&&(selected.particleMode||'free')==='pathFlow');
  }
  function syncParticlePathPanel(){
    const active=pathPanelActive();
    document.querySelectorAll('.particle-path-settings').forEach(el=>{el.style.display=active?'block':'none';});
    const info=document.getElementById('particlePathInfo');
    if(info)info.textContent=drawArmed?(drawing?'Maustaste gedrückt halten und den Pfad zeichnen.':'Bereit: Maustaste auf der Arbeitsfläche drücken und Pfad zeichnen.'):'Form auswählen oder Freihand direkt auf der Arbeitsfläche zeichnen.';
  }
  if(typeof syncTypeUI==='function'){
    const baseSyncTypeUI=syncTypeUI;
    syncTypeUI=function(){baseSyncTypeUI();syncParticlePathPanel();};
  }
  function ensurePathMode(){
    if(!selected||selected.type!=='particle')return false;
    selected.particleMode='pathFlow';
    selected.particlePathShape='freehand';
    if(fields.ParticleMode)fields.ParticleMode.value='pathFlow';
    if(fields.ParticlePathShape)fields.ParticlePathShape.value='freehand';
    syncTypeUI();
    return true;
  }
  function localPoint(e){
    const r=canvas.getBoundingClientRect();
    const dx=e.clientX-r.left-objCssX(selected);
    const dy=e.clientY-r.top-objCssY(selected);
    const a=-Number(selected.rotation||0)*Math.PI/180;
    return {x:(dx*Math.cos(a)-dy*Math.sin(a))/stageScale(),y:(dx*Math.sin(a)+dy*Math.cos(a))/stageScale()};
  }
  function addPoint(p){
    if(!Array.isArray(selected.particlePathPoints))selected.particlePathPoints=[];
    const last=selected.particlePathPoints[selected.particlePathPoints.length-1];
    if(last&&Math.hypot(p.x-last.x,p.y-last.y)<5)return;
    selected.particlePathPoints.push(p);
  }
  document.getElementById('pParticlePathDrawBtn')?.addEventListener('click',()=>{
    if(!ensurePathMode())return;
    selected.particlePathPoints=[];
    drawArmed=true;
    drawing=false;
    document.body.classList.add('particlePathDrawMode');
    syncParticlePathPanel();
  });
  document.getElementById('pParticlePathResetBtn')?.addEventListener('click',()=>{
    if(!selected||selected.type!=='particle')return;
    selected.particlePathPoints=[];
    selected.particlePathShape='line';
    drawArmed=false;
    drawing=false;
    document.body.classList.remove('particlePathDrawMode');
    if(fields.ParticlePathShape)fields.ParticlePathShape.value='line';
    updateHud();syncParticlePathPanel();
  });
  canvas.addEventListener('pointerdown',e=>{
    if(!drawArmed||!selected||e.button!==0)return;
    e.preventDefault();e.stopPropagation();
    drawing=true;
    addPoint(localPoint(e));
    canvas.setPointerCapture(e.pointerId);
    syncParticlePathPanel();
  },true);
  canvas.addEventListener('pointermove',e=>{
    if(!drawing||!selected||!(e.buttons&1))return;
    e.preventDefault();e.stopPropagation();
    addPoint(localPoint(e));
  },true);
  canvas.addEventListener('pointerup',e=>{
    if(!drawing)return;
    e.preventDefault();e.stopPropagation();
    drawing=false;
    drawArmed=false;
    document.body.classList.remove('particlePathDrawMode');
    if(selected&&Array.isArray(selected.particlePathPoints)&&selected.particlePathPoints.length<2)selected.particlePathPoints=[];
    updateHud();updateObjectManager();syncParticlePathPanel();
  },true);
  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&(drawArmed||drawing)){
      drawArmed=false;
      drawing=false;
      document.body.classList.remove('particlePathDrawMode');
      syncParticlePathPanel();
    }
  });
  document.addEventListener('click',e=>{
    if(!drawArmed||!e.target.closest('.vseColorControl'))return;
    drawArmed=false;
    drawing=false;
    document.body.classList.remove('particlePathDrawMode');
    syncParticlePathPanel();
  },true);
  syncParticlePathPanel();
})();
