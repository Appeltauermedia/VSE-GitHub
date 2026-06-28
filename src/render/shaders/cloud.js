// GPU particle cloud: soft procedural point sprites, no images and no Canvas 2D.
const VSE_CLOUD_VERTEX_SHADER=`
precision highp float;
precision mediump int;
attribute float aIndex;
uniform vec2 uPixelRes,uCssRes,uOriginCss,uWind,uSize;
uniform float uRot,uTime,uSeed,uMotion,uSpeed,uDensity,uDetail,uAudio,uLifecycle;
uniform int uPreset;
varying float vShade;
varying float vAlpha;
float hash(float n){return fract(sin(n)*43758.5453123);}
void main(){
  float i=aIndex+uSeed*13.17;
  float r1=hash(i*17.31+1.7),r2=hash(i*41.73+9.2),r3=hash(i*73.11+4.8);
  float lobe=mod(aIndex,7.0);
  vec2 center=vec2(0.0);vec2 radius=vec2(.30,.22);
  if(lobe<1.0){center=vec2(-.30,.05);radius=vec2(.28,.20);}
  else if(lobe<2.0){center=vec2(-.13,-.11);radius=vec2(.31,.27);}
  else if(lobe<3.0){center=vec2(.08,-.18);radius=vec2(.30,.32);}
  else if(lobe<4.0){center=vec2(.27,-.06);radius=vec2(.28,.23);}
  else if(lobe<5.0){center=vec2(.40,.08);radius=vec2(.20,.17);}
  else if(lobe<6.0){center=vec2(-.42,.10);radius=vec2(.19,.15);}
  else {center=vec2(.03,.10);radius=vec2(.42,.18);}
  if(uPreset==1){center.y*=.28;radius.y*=.48;radius.x*=1.18;}
  if(uPreset==2){center*=vec2(1.20,.55);radius*=vec2(1.32,1.05);}
  if(uPreset==3){center.y*=1.22;radius*=vec2(.95,1.18);}
  if(uPreset==4){center=vec2(center.x*.62,center.y*.72-.18+lobe*.035);radius*=vec2(.72,1.08);}
  float angle=6.2831853*r1;float rr=sqrt(r2);
  vec2 local=center+vec2(cos(angle),sin(angle))*radius*rr;
  float t=uTime*uSpeed;
  local+=vec2(sin(t*.83+i*.013),cos(t*.67+i*.017))*(.012+.025*r3)*uMotion;
  local+=uWind*.00035*uMotion*sin(t*.22+r3*6.2831);
  float ca=cos(uRot),sa=sin(uRot);local=vec2(local.x*ca-local.y*sa,local.x*sa+local.y*ca);
  vec2 css=uOriginCss+local*uSize;
  vec2 clip=vec2(css.x/max(uCssRes.x,1.0)*2.0-1.0,1.0-css.y/max(uCssRes.y,1.0)*2.0);
  gl_Position=vec4(clip,0.0,1.0);
  float pixelRatio=(uPixelRes.x/max(uCssRes.x,1.0)+uPixelRes.y/max(uCssRes.y,1.0))*.5;
  float detailSize=mix(1.20,.72,clamp(uDetail,0.0,1.0));
  float alive=smoothstep(r1-.10,r1+.06,uLifecycle);
  gl_PointSize=max(2.0,min(uSize.x,uSize.y)*(.105+.115*r3)*detailSize*pixelRatio*(1.0+uAudio*.18)*mix(.45,1.0,alive));
  vShade=.68+.42*r1-.18*local.y;
  vAlpha=clamp((.055+.055*r2)*uDensity*(1.0+uAudio*.45),.01,.22)*alive;
}`;
const VSE_CLOUD_FRAGMENT_SHADER=`
precision mediump float;
precision mediump int;
uniform vec3 uColor;
uniform float uSoftness,uBrightness,uOpacity;
uniform int uPreset;
varying float vShade;
varying float vAlpha;
void main(){
  vec2 p=gl_PointCoord*2.0-1.0;float d=dot(p,p);
  if(d>1.0)discard;
  float edge=mix(.18,.78,clamp(uSoftness,0.0,1.0));
  float a=(1.0-smoothstep(edge,1.0,d))*vAlpha*uOpacity;
  vec3 col=uColor*clamp(vShade*uBrightness,.18,1.65);
  if(uPreset==3)col*=mix(vec3(.58,.62,.70),vec3(1.0),vShade*.65);
  if(uPreset==4)col*=vec3(.76,.72,.69);
  if(a<.002)discard;gl_FragColor=vec4(col*a,a);
}`;
