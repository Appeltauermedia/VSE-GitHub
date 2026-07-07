// Lightweight procedural WebGL cloud. Analytic lobes keep many clouds affordable.
const VSE_CLOUD_VERTEX_SHADER=`
attribute vec2 aPos;
void main(){gl_Position=vec4(aPos,0.0,1.0);}
`;
const VSE_CLOUD_FRAGMENT_SHADER=`
precision mediump float;
uniform vec2 uPixelRes,uCssRes,uOriginCss,uSizeCss,uWind;
uniform float uRot,uTime,uDensity,uSoftness,uBrightness,uSeed,uMotion,uSpeed,uDetail,uOpacity,uAudio,uSelected;
uniform vec3 uColor;
uniform int uPreset;
float ell(vec2 p,vec2 c,vec2 r){return 1.0-length((p-c)/r);}
void main(){
  vec2 frag=vec2(gl_FragCoord.x/max(uPixelRes.x,1.0)*uCssRes.x,(1.0-gl_FragCoord.y/max(uPixelRes.y,1.0))*uCssRes.y);
  vec2 p=frag-uOriginCss;float c=cos(-uRot),s=sin(-uRot);p=vec2(p.x*c-p.y*s,p.x*s+p.y*c)/max(uSizeCss,vec2(1.0));
  if(abs(p.x)>.58||abs(p.y)>.58)discard;
  float t=uTime*uSpeed;float phase=uSeed*.071;
  vec2 drift=uWind*t*.00012*uMotion;
  vec2 q=p+drift;
  float wob=.018*uMotion;
  vec2 w1=vec2(sin(t+phase),cos(t*.73+phase))*wob;
  vec2 w2=vec2(cos(t*.61+phase*1.7),sin(t*.82+phase))*wob;
  float shape=ell(q,vec2(0.0,.08),vec2(.48,.22));
  shape=max(shape,ell(q,w1+vec2(-.27,-.02),vec2(.25,.22)));
  shape=max(shape,ell(q,w2+vec2(-.06,-.11),vec2(.29,.33)));
  shape=max(shape,ell(q,-w1+vec2(.20,-.06),vec2(.27,.26)));
  shape=max(shape,ell(q,w2+vec2(.36,.02),vec2(.19,.18)));
  float detailShape=max(ell(q,vec2(-.38,.04),vec2(.14,.13)),ell(q,vec2(.05,-.25),vec2(.20,.14)));
  shape=max(shape,detailShape*uDetail-.18*(1.0-uDetail));
  if(uPreset==1)shape=max(ell(q,vec2(0),vec2(.56,.13)),ell(q,vec2(-.28,-.04),vec2(.27,.15)));
  if(uPreset==2)shape=ell(q,vec2(0),vec2(.57,.30))*.78;
  if(uPreset==3)shape=max(shape,ell(q,vec2(0,-.04),vec2(.43,.35)));
  if(uPreset==4)shape=max(ell(q,vec2(0),vec2(.49,.22)),ell(q,w1+vec2(-.20,-.13),vec2(.31,.28)));
  float ripple=sin((q.x*7.0+q.y*5.0+phase)*6.0+t)*sin((q.y*8.0-q.x*3.0-phase)*4.0-t*.7);
  shape+=ripple*.018*uDetail*uMotion;
  float edge=mix(.035,.16,clamp(uSoftness,0.0,1.0));
  float alpha=smoothstep(-edge,edge,shape)*clamp(uDensity*(.82+uAudio*.45),0.0,1.5);
  alpha*=1.0-smoothstep(.47,.58,max(abs(p.x),abs(p.y)));
  float shade=clamp(.86-p.y*.35+ripple*.05*uDetail,0.45,1.25)*uBrightness*(1.0+uAudio*.45);
  vec3 col=uColor*shade;
  if(uPreset==3)col*=mix(vec3(.58,.62,.70),vec3(1.0),clamp(shape*2.0+.35,0.0,1.0));
  if(uPreset==4)col*=vec3(.74,.70,.67);
  float boxEdge=max(abs(p.x),abs(p.y));
  float frame=smoothstep(.47,.50,boxEdge)*(1.0-smoothstep(.50,.54,boxEdge))*uSelected*.30;
  col=mix(col,vec3(.35,.78,1.0),frame);alpha=clamp(max(alpha,frame)*uOpacity,0.0,1.0);
  if(alpha<.003)discard;gl_FragColor=vec4(col*alpha,alpha);
}`;
