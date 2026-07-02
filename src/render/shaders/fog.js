// VSE fogProg shader module. Classic script loaded before the main app script.
const VSE_FOG_VERTEX_SHADER = `
attribute vec2 aPos;
void main(){gl_Position=vec4(aPos,0.0,1.0);}
`;

const VSE_FOG_FRAGMENT_SHADER = `
precision highp float;
uniform vec2 uPixelRes;
uniform vec2 uCssRes;
uniform vec2 uOriginCss;
uniform float uTime;
uniform float uRot;
uniform float uRange;
uniform float uAngle;
uniform float uStartWidth;
uniform float uAmount;
uniform float uOpacity;
uniform float uSoftness;
uniform vec2 uDrift;
uniform float uMotion;
uniform float uTurbulence;
uniform float uGravity;
uniform vec3 uColor;

float sat(float x){return clamp(x,0.0,1.0);}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  float a=hash(i),b=hash(i+vec2(1.0,0.0));
  float c=hash(i+vec2(0.0,1.0)),d=hash(i+vec2(1.0,1.0));
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
float fbm(vec2 p){
  float v=0.0,a=0.52;
  for(int i=0;i<5;i++){
    v+=noise(p)*a;
    p=p*2.03+vec2(13.7,9.2);
    a*=0.5;
  }
  return v;
}

void main(){
  vec2 fragCss=vec2(
    gl_FragCoord.x/max(uPixelRes.x,1.0)*uCssRes.x,
    (1.0-gl_FragCoord.y/max(uPixelRes.y,1.0))*uCssRes.y
  );
  vec2 p=fragCss-uOriginCss;
  float ca=cos(-uRot),sa=sin(-uRot);
  // Der Hauptstrom bleibt gerade. Gravitation verändert nur den unteren Rand.
  vec2 q=vec2(p.x*ca-p.y*sa,p.x*sa+p.y*ca);

  float forward=q.x/max(uRange,1.0);
  if(forward<0.0||forward>1.0){discard;}

  // Keine punktförmige Lichtkegel-Maske: Startbreite plus winkelabhängige Öffnung.
  float halfAngle=radians(clamp(uAngle,0.0,170.0))*0.5;
  float halfWidth=max(1.0,uStartWidth*0.5)+tan(halfAngle)*q.x;
  float edgeFeather=max(2.0,mix(5.0,halfWidth*0.34,uSoftness));
  float plumeMask=1.0-smoothstep(max(0.0,halfWidth-edgeFeather),halfWidth,abs(q.y));

  vec2 np=q/max(uRange,1.0);
  float lateral=q.y/max(halfWidth,1.0);
  float motion=max(uMotion,0.0);
  float turb=max(uTurbulence,0.0);
  float t=uTime*(0.12+motion*0.55);
  vec2 flow=vec2(t*(0.18+uDrift.x*0.55),t*(0.10+uDrift.y*0.45));
  vec2 curl=vec2(
    fbm(np*(2.6+turb*2.8)+flow*0.80+vec2(sin(t*0.7),cos(t*0.41))*0.18)-0.5,
    fbm(np*(3.1+turb*2.4)-flow*0.70+vec2(7.1,2.8)+vec2(cos(t*0.52),sin(t*0.63))*0.20)-0.5
  );
  float wave=sin(forward*8.0+t*2.2+fbm(np*5.0+flow)*2.4)*0.030*motion;
  vec2 warped=np+curl*(0.045+turb*0.14)+vec2(0.0,wave);
  warped.y+=sin(t*1.15+forward*11.0)*0.018*motion;
  float n1=fbm(warped*(3.5+turb*1.8)+flow);
  float n2=fbm(warped*(8.0+turb*4.7)-flow*1.75+vec2(4.2,1.9));
  float n3=fbm(warped*(17.0+turb*6.0)+vec2(sin(t*.9),cos(t*.7))*0.28);
  float n=mix(mix(n1,n2,0.46),n3,0.28*turb);
  // Unterhalb der normalen Kante entstehen unregelmäßige, sich auflösende
  // Nebelfahnen. Der Kern und seine Richtung werden dabei nicht gebogen.
  // Die Gravitationsfahnen beginnen bereits innerhalb der weichen Plume-Kante.
  // Dadurch bleiben Hauptnebel und absinkende Partikel ohne transparente Naht verbunden.
  float gravityOverlap=max(3.0,edgeFeather*0.72);
  float below=max(0.0,q.y-halfWidth+gravityOverlap);
  float gravityReach=max(uGravity,0.0)*uRange*(0.055+forward*0.30);
  float raggedReach=gravityReach*(0.38+n*0.82+0.12*sin(t*1.7+forward*15.0+n*5.0));
  float falloff=1.0-smoothstep(0.0,max(1.0,raggedReach),below);
  float dissolve=smoothstep(0.24+0.34*below/max(1.0,gravityReach),0.78,n);
  float gravityBlend=smoothstep(halfWidth-gravityOverlap,halfWidth+gravityOverlap*0.35,q.y);
  float gravityWisps=step(0.001,uGravity)*gravityBlend*falloff*dissolve;
  float fogShape=max(plumeMask,gravityWisps*0.72);
  float breathing=0.84+0.16*sin(uTime*(0.65+motion*0.50)+n*4.1+forward*2.0);
  float ageFade=1.0-smoothstep(0.62,1.0,forward);
  float birthFade=smoothstep(0.0,0.055+uSoftness*0.035,forward);
  float body=pow(max(0.0,1.0-abs(lateral)),0.42+uSoftness*0.32);
  float wispBody=max(body,gravityWisps*0.72);
  float alpha=ageFade*birthFade*fogShape*wispBody*(0.18+n*0.82)*uAmount*uOpacity*breathing;
  alpha=sat(alpha*(0.76+0.25*turb));
  if(alpha<0.003){discard;}
  vec3 col=uColor*(0.56+n*0.44);
  gl_FragColor=vec4(col,alpha);
}
`;
