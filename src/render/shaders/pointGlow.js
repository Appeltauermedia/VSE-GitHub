// VSE pointGlowProg shader module. Supports point and continuous line emitters.
const VSE_POINT_GLOW_VERTEX_SHADER = `
attribute vec2 aPos;
void main(){gl_Position=vec4(aPos,0.0,1.0);}
`;

const VSE_POINT_GLOW_FRAGMENT_SHADER = `
precision highp float;
uniform vec2 uPixelRes;
uniform vec2 uCssRes;
uniform vec2 uOriginCss;
uniform float uRot;
uniform int uEmitterShape;
uniform int uRectangleMode;
uniform float uEmitterLength;
uniform vec2 uEmitterSize;
uniform float uRadius;
uniform float uGlow;
uniform float uOpacity;
uniform float uIntensity;
uniform vec3 uColor;
float sat(float x){return clamp(x,0.0,1.0);}

void main(){
  vec2 fragCss=vec2(
    gl_FragCoord.x/max(uPixelRes.x,1.0)*uCssRes.x,
    (1.0-gl_FragCoord.y/max(uPixelRes.y,1.0))*uCssRes.y
  );
  vec2 p=fragCss-uOriginCss;
  float ca=cos(-uRot),sa=sin(-uRot);
  vec2 q=vec2(p.x*ca-p.y*sa,p.x*sa+p.y*ca);
  float halfLength=max(0.0,uEmitterLength)*0.5;
  float d=length(vec2(q.x,max(0.0,abs(q.y)-halfLength)));
  if(uEmitterShape==2){
    vec2 halfSize=max(vec2(1.0),uEmitterSize*0.5);
    vec2 outside=max(abs(q)-halfSize,vec2(0.0));
    bool inside=outside.x<=0.0&&outside.y<=0.0;
    if(uRectangleMode==0){if(inside){discard;}d=length(outside);}
    else if(uRectangleMode==1){if(!inside){discard;}d=min(halfSize.x-abs(q.x),halfSize.y-abs(q.y));}
    else{if(inside)d=0.0;else d=length(outside);}
  }
  float r=max(uRadius,1.0);
  float glowAmount=clamp(uGlow,0.0,2.0);
  float normalizedGlow=glowAmount/2.0;
  float disc=1.0-smoothstep(r*0.34,r*0.54,d);
  float core=exp(-pow(d/max(r*0.28,1.0),2.0)*2.2);
  float glowRadius=r*(1.15+normalizedGlow*7.5);
  float halo=exp(-pow(d/max(glowRadius,1.0),2.0)*(2.8-normalizedGlow*0.9))*normalizedGlow;
  float alpha=sat((disc*0.86+core*0.44+halo*(0.95+normalizedGlow*0.65))*uOpacity*uIntensity);
  if(alpha<0.002){discard;}
  vec3 hot=vec3(1.0)*core*(0.08+0.30*normalizedGlow);
  vec3 col=uColor*(disc*0.85+core*0.38+halo*(0.70+0.35*normalizedGlow))+hot;
  gl_FragColor=vec4(col*alpha,alpha);
}
`;
