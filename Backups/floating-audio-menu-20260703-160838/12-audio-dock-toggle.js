(function(){
  const dock=document.getElementById('audioDock');
  const toggle=document.getElementById('audioDockToggle');
  const icon=document.getElementById('audioDockToggleIcon');
  if(!dock||!toggle)return;

  const storageKey='vse.audioDockCollapsed';

  function setCollapsed(collapsed){
    dock.classList.toggle('isCollapsed',collapsed);
    document.body.classList.toggle('audioDockCollapsed',collapsed);
    toggle.setAttribute('aria-expanded',collapsed?'false':'true');
    toggle.title=collapsed?'Audio ausklappen':'Audio einklappen';
    if(icon)icon.textContent=collapsed?'▴':'▾';
    try{localStorage.setItem(storageKey,collapsed?'1':'0');}catch(e){}
  }

  let collapsed=false;
  try{collapsed=localStorage.getItem(storageKey)==='1';}catch(e){}
  setCollapsed(collapsed);
  toggle.addEventListener('click',()=>setCollapsed(!dock.classList.contains('isCollapsed')));
})();
