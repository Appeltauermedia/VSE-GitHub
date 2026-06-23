// VSE stage coordinate helpers. Classic script during gradual migration.
function stageScale(){
  const baseW=Math.max(1,Number(stageState.w||1920));
  const baseH=Math.max(1,Number(stageState.h||1080));
  return Math.max(0.0001,Math.min(canvas.clientWidth/baseW,canvas.clientHeight/baseH));
}
function su(v){return Number(v||0)*stageScale();}
function objCssX(o){return Number(o.x||0)/100*canvas.clientWidth;}
function objCssY(o){return Number(o.y||0)/100*canvas.clientHeight;}
