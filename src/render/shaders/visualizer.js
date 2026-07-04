// VSE visualizerProg shader module. Classic script loaded before the main app script.
const VSE_VISUALIZER_VERTEX_SHADER=`
attribute vec2 aPos;
void main(){gl_Position=vec4(aPos,0.0,1.0);}
`;
const VSE_VISUALIZER_FRAGMENT_SHADER=`
precision highp float;
uniform vec2 uPixelRes,uCssRes,uOriginCss,uSizeCss;
uniform float uRot,uOpacity,uSelected,uBars,uGap,uSegmentsEnabled,uSegmentCount,uSegmentGap;
uniform vec3 uBackgroundColor,uLowColor,uMidColor,uHighColor,uAverageColor,uPeakColor,uFrameColor;
uniform sampler2D uData;
uniform float uHasOverlay,uOverlayFreq,uOverlayThreshold;
const float TEX_W=128.0;
float sat(float x){return clamp(x,0.0,1.0);}
float box(vec2 p,vec2 b){vec2 d=abs(p)-b;return length(max(d,0.0))+min(max(d.x,d.y),0.0);}
float logPos(float f){return clamp(log(max(f,20.0)/20.0)/log(20000.0/20.0),0.0,1.0);}
vec3 over(vec3 base,vec3 col,float a){return mix(base,col,sat(a));}
void main(){
  vec2 fragCss=vec2(gl_FragCoord.x/max(uPixelRes.x,1.0)*uCssRes.x,(1.0-gl_FragCoord.y/max(uPixelRes.y,1.0))*uCssRes.y);
  vec2 p=fragCss-uOriginCss;
  float ca=cos(-uRot),sa=sin(-uRot);
  vec2 q=vec2(p.x*ca-p.y*sa,p.x*sa+p.y*ca);
  vec2 halfSize=max(uSizeCss*.5,vec2(1.0));
  float d=box(q,halfSize);
  if(d>8.0)discard;
  float edge=1.0-smoothstep(-1.0,7.0,d);
  vec3 col=uBackgroundColor;
  float alpha=.46*uOpacity*edge;
  float pad=max(4.0,min(uSizeCss.x,uSizeCss.y)*.045);
  vec2 inner=max(uSizeCss-vec2(pad*2.0),vec2(1.0));
  vec2 iq=q;
  bool insideInner=abs(iq.x)<=inner.x*.5&&abs(iq.y)<=inner.y*.5;
  if(insideInner){
    if(uHasOverlay>.5){
      float cFreq=clamp(uOverlayFreq,20.0,20000.0);
      float lo=clamp(cFreq/1.41421356,20.0,20000.0),hi=clamp(cFreq*1.41421356,20.0,20000.0);
      float lx=-inner.x*.5+logPos(lo)*inner.x,hx=-inner.x*.5+logPos(hi)*inner.x;
      float inBand=step(min(lx,hx),iq.x)*step(iq.x,max(lx,hx));
      col=over(col,vec3(.05,.48,1.0),inBand*.28*uOpacity);alpha=max(alpha,inBand*.18*uOpacity);
      float cx=-inner.x*.5+logPos(cFreq)*inner.x;
      float centerLine=1.0-smoothstep(1.0,2.6,abs(iq.x-cx));
      col=over(col,vec3(.18,.72,1.0),centerLine*.62*uOpacity);alpha=max(alpha,centerLine*.55*uOpacity);
    }
    float stepW=inner.x/max(uBars,1.0),barFloat=(iq.x+inner.x*.5)/stepW;
    float idx=floor(barFloat),frac=fract(barFloat),gapHalf=uGap*.5;
    float inBar=step(gapHalf,frac)*step(frac,1.0-gapHalf)*step(0.0,idx)*step(idx,uBars-.001);
    vec4 data=texture2D(uData,vec2((idx+.5)/TEX_W,.5));
    float level=data.r,peak=data.g,avg=data.b;
    float fromBottom=inner.y*.5-iq.y,normY=sat(fromBottom/max(inner.y,1.0));
    float segmentCell=fract(normY*max(uSegmentCount,1.0));
    float segmentMask=step(uSegmentGap*.5,segmentCell)*step(segmentCell,1.0-uSegmentGap*.5);
    float filled=inBar*step(normY,level)*mix(1.0,segmentMask,step(.5,uSegmentsEnabled));
    vec3 barCol=mix(uLowColor,uMidColor,smoothstep(.58,.68,normY));
    barCol=mix(barCol,uHighColor,smoothstep(.82,.90,normY));
    col=over(col,barCol,filled*.95*uOpacity);alpha=max(alpha,filled*.95*uOpacity);
    float liveLine=inBar*(1.0-smoothstep(1.0,2.8,abs(fromBottom-level*inner.y)))*step(.025,level);
    col=over(col,mix(uMidColor,vec3(1.0),.55),liveLine*.30*uOpacity);alpha=max(alpha,liveLine*.22*uOpacity);
    float avgLine=inBar*(1.0-smoothstep(1.0,2.6,abs(fromBottom-avg*inner.y)));
    col=over(col,uAverageColor,avgLine*.95*uOpacity);alpha=max(alpha,avgLine*.92*uOpacity);
    float peakLine=inBar*(1.0-smoothstep(1.0,3.2,abs(fromBottom-peak*inner.y)))*step(.012,peak);
    col=over(col,uPeakColor,peakLine*.98*uOpacity);alpha=max(alpha,peakLine*.95*uOpacity);
    if(uHasOverlay>.5){
      float thresholdLine=1.0-smoothstep(1.2,3.2,abs(fromBottom-sat(uOverlayThreshold)*inner.y));
      col=over(col,vec3(.12,.62,1.0),thresholdLine*.90*uOpacity);alpha=max(alpha,thresholdLine*.88*uOpacity);
    }
  }
  float bx=halfSize.x,by=halfSize.y;
  float frame=max(1.0-smoothstep(1.2,3.2,abs(abs(q.x)-bx)),1.0-smoothstep(1.2,3.2,abs(abs(q.y)-by)));
  frame*=step(abs(q.x),bx+2.5)*step(abs(q.y),by+2.5);
  float frameA=frame*(.28+uSelected*.44)*uOpacity;
  col=over(col,uFrameColor,frameA);alpha=max(alpha,frameA);
  if(alpha<.003)discard;
  gl_FragColor=vec4(col*alpha,alpha);
}`;
