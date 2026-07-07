(function(){
  const toggle=document.getElementById('rightPanelToggle');
  const panel=document.getElementById('right');
  if(!toggle||!panel)return;

  const storageKey='vse-right-panel-collapsed-v2';
  function applyState(collapsed){
    document.body.classList.toggle('rightPanelCollapsed',collapsed);
    toggle.setAttribute('aria-expanded',String(!collapsed));
    toggle.title=collapsed?'Parametermenü ausklappen':'Parametermenü einklappen';
    panel.setAttribute('aria-hidden',String(collapsed));
  }

  let collapsed=true;
  try{
    const saved=localStorage.getItem(storageKey);
    collapsed=saved===null?true:saved==='true';
  }catch(error){}
  applyState(collapsed);

  toggle.addEventListener('click',function(){
    collapsed=!document.body.classList.contains('rightPanelCollapsed');
    applyState(collapsed);
    try{localStorage.setItem(storageKey,String(collapsed));}catch(error){}
  });
})();
