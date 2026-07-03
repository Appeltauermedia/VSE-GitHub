(function(){
  const panel=document.getElementById('audioFloatingPanel');
  const opener=document.getElementById('audioMenuBtn');
  const header=document.getElementById('audioFloatingHeader');
  const close=document.getElementById('audioFloatingClose');
  if(!panel||!opener||!header||!close)return;

  const positionKey='vse.audioFloatingPosition';
  function clampPosition(left,top){
    const margin=8;
    return {
      left:Math.max(margin,Math.min(left,window.innerWidth-panel.offsetWidth-margin)),
      top:Math.max(52,Math.min(top,window.innerHeight-panel.offsetHeight-margin))
    };
  }
  function restorePosition(){
    try{
      const saved=JSON.parse(localStorage.getItem(positionKey)||'null');
      if(saved&&Number.isFinite(saved.left)&&Number.isFinite(saved.top)){
        const p=clampPosition(saved.left,saved.top);
        panel.style.left=p.left+'px';panel.style.top=p.top+'px';panel.style.right='auto';
      }
    }catch(e){}
  }
  function setOpen(open){
    panel.hidden=!open;
    opener.setAttribute('aria-expanded',open?'true':'false');
    if(open)restorePosition();
  }
  opener.addEventListener('click',()=>setOpen(panel.hidden));
  close.addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)setOpen(false);});

  header.addEventListener('pointerdown',event=>{
    if(event.button!==0||event.target.closest('button'))return;
    const rect=panel.getBoundingClientRect();
    const offsetX=event.clientX-rect.left,offsetY=event.clientY-rect.top;
    header.setPointerCapture(event.pointerId);
    const move=moveEvent=>{
      const p=clampPosition(moveEvent.clientX-offsetX,moveEvent.clientY-offsetY);
      panel.style.left=p.left+'px';panel.style.top=p.top+'px';panel.style.right='auto';
    };
    const end=()=>{
      header.removeEventListener('pointermove',move);
      header.removeEventListener('pointerup',end);
      header.removeEventListener('pointercancel',end);
      try{localStorage.setItem(positionKey,JSON.stringify({left:parseFloat(panel.style.left),top:parseFloat(panel.style.top)}));}catch(e){}
    };
    header.addEventListener('pointermove',move);
    header.addEventListener('pointerup',end);
    header.addEventListener('pointercancel',end);
  });
  window.addEventListener('resize',()=>{
    if(panel.hidden||!panel.style.left)return;
    const p=clampPosition(parseFloat(panel.style.left)||0,parseFloat(panel.style.top)||52);
    panel.style.left=p.left+'px';panel.style.top=p.top+'px';
  });
})();
