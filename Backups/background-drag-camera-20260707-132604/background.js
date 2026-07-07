// VSE bgProg shader module. Classic script loaded before the main app script.
const VSE_BACKGROUND_VERTEX_SHADER = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){vUv=(aPos+1.0)*0.5;gl_Position=vec4(aPos,0.0,1.0);}
`;
const VSE_BACKGROUND_FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uImg;
uniform vec2 uCanvas;
uniform float uOpacity;
uniform int uMode;
uniform float uZoom;
uniform vec2 uPan;
uniform vec3 uBgColor;
uniform float uBgAlpha;
uniform float uDim;
varying vec2 vUv;
void main(){
  vec2 uv=vUv;
  uv.y=1.0-uv.y;
  vec3 base=uBgColor;
  if(uImg.x<1.0||uImg.y<1.0){gl_FragColor=vec4(mix(base,vec3(0.0),uDim),uBgAlpha);return;}
  vec2 cu=uCanvas/max(uCanvas.y,1.0);
  vec2 iu=uImg/max(uImg.y,1.0);
  vec2 p=uv;
  if(uMode==0){
    float sc=max(cu.x/iu.x,cu.y/iu.y)/max(uZoom,0.001);
    vec2 draw=iu*sc/cu;
    vec2 visible=1.0/draw;
    vec2 maxShift=max(vec2(0.0),(vec2(1.0)-visible)*0.5);
    p=(uv-0.5)/draw+0.5+uPan*maxShift;
  }else if(uMode==1){
    float sc=min(cu.x/iu.x,cu.y/iu.y)/max(uZoom,0.001);
    vec2 draw=iu*sc/cu;
    vec2 visible=1.0/draw;
    vec2 maxShift=max(vec2(0.0),(vec2(1.0)-visible)*0.5);
    p=(uv-0.5)/draw+0.5+uPan*maxShift;
  }else{
    float zoom=max(uZoom,0.001);
    float maxShift=max(0.0,(1.0-(1.0/zoom))*0.5);
    p=(uv-0.5)/zoom+0.5+uPan*maxShift;
  }
  if(p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0){gl_FragColor=vec4(base,uBgAlpha);return;}
  vec4 img=texture2D(uTex,p);
  vec3 col=mix(base,img.rgb,img.a*uOpacity);
  col=mix(col,vec3(0.0),uDim);
  gl_FragColor=vec4(col,img.a*uBgAlpha);
}`;
