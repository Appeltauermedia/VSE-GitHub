// VSE Wind module. Classic script loaded before the main inline app script.
// Keep declarations global during the gradual migration so existing render paths can call them unchanged.
function windDefaults(){return {windEnabled:false,windStrength:0,windDirection:0,windVariationSpeed:.35,windGustsEnabled:false,gustStrength:.6,gustFrequency:.45,gustSmoothness:.65,turbulenceAmount:.35,turbulenceScale:1,turbulenceSpeed:.55,windApplyToFog:true,windApplyToParticles:true,windApplyToPhysicsAssets:true,windApplyToScreens:false,windApplyToGreenscreen:false,windApplyToWater:true,windApplyToSmokeDust:true,windApplyToWeatherParticles:true};}
function ensureWindDefaults(){for(const [k,v] of Object.entries(windDefaults()))if(scene[k]===undefined||scene[k]===null)scene[k]=v;}
let windFrameCache={frame:-1,value:null};
function smoothWindNoise(x){return (Math.sin(x)+0.55*Math.sin(x*0.47+1.9)+0.28*Math.sin(x*1.71+4.1))/1.83;}
function globalWindState(){
  ensureWindDefaults();
  const frame=Math.floor(performance.now()/16);
  if(windFrameCache.frame===frame&&windFrameCache.value)return windFrameCache.value;
  const t=performance.now()/1000;
  const enabled=!!scene.windEnabled;
  const base=enabled?Math.max(0,Math.min(6,Number(scene.windStrength||0))):0;
  const dirRad=(Number(scene.windDirection||0))*Math.PI/180;
  const gustEnabled=!!scene.windGustsEnabled;
  const freq=Math.max(0,Number(scene.gustFrequency??.45));
  const smooth=Math.max(.05,Math.min(1,Number(scene.gustSmoothness??.65)));
  const gustRaw=(smoothWindNoise(t*(0.25+freq*1.35))+1)*0.5;
  const gust=Math.pow(Math.max(0,Math.min(1,gustRaw)),1.0+smooth*2.2)*(gustEnabled?Number(scene.gustStrength??.6):0);
  const variation=Math.sin(t*Math.max(0,Number(scene.windVariationSpeed??.35))*0.9)*0.08*base;
  const eff=enabled?Math.max(0,base+gust+variation):0;
  const tx=smoothWindNoise(t*(0.20+Number(scene.turbulenceSpeed??.55))*1.17+2.4)*Number(scene.turbulenceAmount??.35);
  const ty=smoothWindNoise(t*(0.23+Number(scene.turbulenceSpeed??.55))*0.91+6.8)*Number(scene.turbulenceAmount??.35);
  const unit={x:Math.cos(dirRad),y:Math.sin(dirRad)};
  const scale=stageScale();
  const v={enabled,baseStrength:base,strength:eff,unit,cssX:(unit.x*eff*58+tx*24)*scale,cssY:(unit.y*eff*58+ty*24)*scale,percentX:(unit.x*eff*.055+tx*.018),percentY:(unit.y*eff*.055+ty*.018),turbCss:Math.max(0,Number(scene.turbulenceAmount??.35))*Math.max(1,eff)*18*scale,turbulenceAmount:Math.max(0,Number(scene.turbulenceAmount??.35)),gust};
  windFrameCache={frame,value:v};
  return v;
}
function particleWindFactor(o){
  const m=o&&o.particleMode||'free';
  if(['explosion','fireFountain','sparkFountain','gasJet','shockwave'].includes(m))return 0.18;
  if(['ash','dust'].includes(m))return scene.windApplyToSmokeDust!==false?1.25:0;
  if(['snow','rain','confetti','glitter'].includes(m))return scene.windApplyToWeatherParticles!==false?1.15:0;
  return 0.75;
}
function supportsWindObject(o){return !!(o&&(['fog','particle','imageAsset','waterSurface','waterFlowOverlay','screen','greenscreen'].includes(o.type)));}
function windForObject(o,kind){
  const z={cssX:0,cssY:0,percentX:0,percentY:0,strength:0,turbCss:0,turbulenceAmount:0,gust:0,enabled:false};
  if(!o||o.windAffected===false)return z;
  const w=globalWindState();
  if(!w.enabled||w.strength<=0)return z;
  let allowed=false, factor=1;
  if(kind==='fog'||o.type==='fog'){allowed=scene.windApplyToFog!==false; factor=1.15;}
  else if(kind==='particle'||o.type==='particle'){allowed=scene.windApplyToParticles!==false; factor=particleWindFactor(o);}
  else if(kind==='physicsAsset'||o.type==='imageAsset'){allowed=scene.windApplyToPhysicsAssets!==false&&!!o.imageAssetPhysicsEnabled; factor=1/Math.sqrt(Math.max(.1,Number(o.imageAssetMass||1)));}
  else if(kind==='water'||isWaterObject(o)){allowed=scene.windApplyToWater!==false; factor=.9;}
  else if(kind==='screen'||o.type==='screen'){allowed=scene.windApplyToScreens===true; factor=.25;}
  else if(kind==='greenscreen'||o.type==='greenscreen'){allowed=scene.windApplyToGreenscreen===true; factor=.25;}
  if(!allowed||factor<=0)return z;
  const inf=Math.max(0,Math.min(1,Number(o.windInfluence??1)));
  factor*=inf;
  return {...w,cssX:w.cssX*factor,cssY:w.cssY*factor,percentX:w.percentX*factor,percentY:w.percentY*factor,strength:w.strength*factor,turbCss:w.turbCss*factor,turbulenceAmount:w.turbulenceAmount*factor,gust:w.gust*factor,enabled:true};
}

function syncWindUi(){
  ensureWindDefaults();
  const pairs=[
    ['windEnabled','windEnabled','checkbox'],['windStrength','windStrength','number'],['windDirection','windDirection','int'],['windVariationSpeed','windVariationSpeed','number'],
    ['windGustsEnabled','windGustsEnabled','checkbox'],['gustStrength','gustStrength','number'],['gustFrequency','gustFrequency','number'],['gustSmoothness','gustSmoothness','number'],
    ['turbulenceAmount','turbulenceAmount','number'],['turbulenceScale','turbulenceScale','number'],['turbulenceSpeed','turbulenceSpeed','number'],
    ['windApplyToFog','windApplyToFog','checkbox'],['windApplyToParticles','windApplyToParticles','checkbox'],['windApplyToPhysicsAssets','windApplyToPhysicsAssets','checkbox'],
    ['windApplyToScreens','windApplyToScreens','checkbox'],['windApplyToGreenscreen','windApplyToGreenscreen','checkbox'],['windApplyToWater','windApplyToWater','checkbox'],
    ['windApplyToSmokeDust','windApplyToSmokeDust','checkbox'],['windApplyToWeatherParticles','windApplyToWeatherParticles','checkbox']
  ];
  for(const [id,key,type] of pairs){const el=document.getElementById(id); if(!el)continue; if(type==='checkbox')el.checked=!!scene[key]; else el.value=Number(scene[key]??0);}
  const labels={windStrengthValue:Number(scene.windStrength??0).toFixed(2),windDirectionValue:Math.round(Number(scene.windDirection??0))+'°',windVariationSpeedValue:Number(scene.windVariationSpeed??.35).toFixed(2),gustStrengthValue:Number(scene.gustStrength??.6).toFixed(2),gustFrequencyValue:Number(scene.gustFrequency??.45).toFixed(2),gustSmoothnessValue:Number(scene.gustSmoothness??.65).toFixed(2),turbulenceAmountValue:Number(scene.turbulenceAmount??.35).toFixed(2),turbulenceScaleValue:Number(scene.turbulenceScale??1).toFixed(2),turbulenceSpeedValue:Number(scene.turbulenceSpeed??.55).toFixed(2)};
  for(const [id,text] of Object.entries(labels)){const el=document.getElementById(id); if(el)el.textContent=text;}
  windFrameCache.frame=-1;
}
function bindWindInput(id,key,type='number'){
  const el=document.getElementById(id); if(!el)return;
  el.addEventListener(type==='checkbox'?'change':'input',()=>{scene[key]=type==='checkbox'?!!el.checked:(type==='int'?parseInt(el.value,10):parseFloat(el.value));syncWindUi();});
}
function initWindUi(){
  ['windEnabled','windGustsEnabled','windApplyToFog','windApplyToParticles','windApplyToPhysicsAssets','windApplyToScreens','windApplyToGreenscreen','windApplyToWater','windApplyToSmokeDust','windApplyToWeatherParticles'].forEach(id=>bindWindInput(id,id,'checkbox'));
  bindWindInput('windStrength','windStrength');bindWindInput('windDirection','windDirection','int');bindWindInput('windVariationSpeed','windVariationSpeed');bindWindInput('gustStrength','gustStrength');bindWindInput('gustFrequency','gustFrequency');bindWindInput('gustSmoothness','gustSmoothness');bindWindInput('turbulenceAmount','turbulenceAmount');bindWindInput('turbulenceScale','turbulenceScale');bindWindInput('turbulenceSpeed','turbulenceSpeed');
  syncWindUi();
}
