// VSE beamProg shader module. Classic script loaded before the main app script.
const VSE_BEAM_VERTEX_SHADER = `
attribute vec2 aPos;
void main(){gl_Position=vec4(aPos,0.0,1.0);}
`;

const VSE_BEAM_FRAGMENT_SHADER = `
precision highp float;
uniform vec2 uPixelRes;
uniform vec2 uCssRes;
uniform vec2 uOriginCss;
uniform float uRot;
uniform float uRange;
uniform float uAngle;
uniform int uEmitterShape;
uniform int uRectangleMode;
uniform float uEmitterLength;
uniform vec2 uEmitterSize;
uniform float uSoft;
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

  // Abstand und Winkel werden zum nächsten Punkt der durchgehenden Emitterlinie
  // berechnet. Dadurch entsteht eine homogene Fläche ohne einzelne Lichtköpfe.
  float halfLength=max(0.0,uEmitterLength)*0.5;
  float sourceY=clamp(q.y,-halfLength,halfLength);
  vec2 ray=vec2(q.x,q.y-sourceY);
  float solidSurface=0.0;
  if(uEmitterShape==2){
    vec2 halfSize=max(vec2(1.0),uEmitterSize*0.5);
    vec2 outside=max(abs(q)-halfSize,vec2(0.0));
    bool inside=outside.x<=0.0&&outside.y<=0.0;
    if(uRectangleMode==0){
      if(inside){discard;}
      ray=outside;
    }else if(uRectangleMode==1){
      if(!inside){discard;}
      float insideDistance=min(halfSize.x-abs(q.x),halfSize.y-abs(q.y));
      ray=vec2(max(0.0,insideDistance),0.0);
    }else{
      if(inside){ray=vec2(0.0);solidSurface=1.0;}else ray=outside;
    }
  }
  float d=length(ray);
  float nd=d/max(uRange,1.0);
  if(nd>1.0){discard;}

  float cone=1.0;
  if(uEmitterShape!=2&&uAngle<359.5){
    float halfA=radians(clamp(uAngle,1.0,360.0))*0.5;
    float a=atan(ray.y,ray.x);
    float diff=abs(atan(sin(a),cos(a)));
    float feather=mix(0.002,0.42,uSoft);
    cone=1.0-smoothstep(max(0.0,halfA-feather),halfA,diff);
    if(cone<=0.001){discard;}
  }

  float radial=exp(-nd*(2.15+uSoft*1.55));
  radial*=1.0-smoothstep(0.82,1.0,nd);
  float sourceBloom=exp(-nd*10.0)*0.35;
  float alpha=sat((radial+sourceBloom)*cone*mix(0.58,0.82,solidSurface)*uIntensity);
  gl_FragColor=vec4(uColor*alpha,alpha);
}
`;
