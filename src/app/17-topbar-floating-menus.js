(function(){
  const definitions=[
    {shell:'projectMenuShell',key:'project',title:'Projekt',subtitle:'Dateien, Darstellung und Recording'},
    {shell:'sceneMenuShell',key:'scene',title:'Scene',subtitle:'Bühne, Hintergrund und globale Effekte'},
    {shell:'objectManagerMenuShell',key:'objectManager',title:'Object Manager',subtitle:'Objekte, Gruppen und Auswahl'}
  ];

  function clampPanel(panel,left,top){
    const margin=8;
    return {
      left:Math.max(margin,Math.min(left,window.innerWidth-panel.offsetWidth-margin)),
      top:Math.max(52,Math.min(top,window.innerHeight-panel.offsetHeight-margin))
    };
  }

  for(const definition of definitions){
    const shell=document.getElementById(definition.shell);
    const summary=shell&&shell.querySelector(':scope > summary');
    const content=shell&&shell.querySelector(':scope > .foldBody');
    if(!shell||!summary||!content)continue;

    const panel=document.createElement('section');
    panel.className='topbarFloatingPanel';
    panel.dataset.menu=definition.key;
    panel.id=definition.key+'FloatingPanel';
    panel.hidden=true;
    panel.setAttribute('aria-label',definition.title);
    panel.innerHTML=`<div class="topbarFloatingHeader"><div><b>${definition.title}</b><small>${definition.subtitle}</small></div><div class="topbarFloatingActions"><button class="topbarFloatingMinimize" type="button" title="${definition.title} minimieren" aria-label="${definition.title} minimieren" aria-pressed="false"><svg class="topbarMinimizeIcon" viewBox="0 0 256 256" aria-hidden="true"><line x1="48" y1="128" x2="208" y2="128"></line></svg><svg class="topbarRestoreIcon" viewBox="0 0 256 256" aria-hidden="true"><polyline points="160 48 208 48 208 96"></polyline><line x1="152" y1="104" x2="208" y2="48"></line><polyline points="96 208 48 208 48 160"></polyline><line x1="104" y1="152" x2="48" y2="208"></line></svg></button><button class="topbarFloatingClose" type="button" title="${definition.title} schließen" aria-label="${definition.title} schließen">×</button></div></div><div class="topbarFloatingBody"></div>`;
    panel.querySelector('.topbarFloatingBody').appendChild(content);
    document.body.appendChild(panel);

    const header=panel.querySelector('.topbarFloatingHeader');
    const minimize=header.querySelector('.topbarFloatingMinimize');
    const close=header.querySelector('.topbarFloatingClose');
    const storageKey='vse.topbarFloatingPosition.'+definition.key;
    const minimizedKey='vse.topbarFloatingMinimized.'+definition.key;
    summary.setAttribute('role','button');
    summary.setAttribute('aria-controls',panel.id);
    summary.setAttribute('aria-expanded','false');
    shell.open=false;

    function restorePosition(){
      try{
        const saved=JSON.parse(localStorage.getItem(storageKey)||'null');
        if(saved&&Number.isFinite(saved.left)&&Number.isFinite(saved.top)){
          const p=clampPanel(panel,saved.left,saved.top);
          panel.style.left=p.left+'px';panel.style.top=p.top+'px';panel.style.right='auto';
          return;
        }
      }catch(e){}
      const summaryRect=summary.getBoundingClientRect();
      const p=clampPanel(panel,summaryRect.left,summaryRect.bottom+8);
      panel.style.left=p.left+'px';panel.style.top=p.top+'px';panel.style.right='auto';
    }
    function setOpen(open){
      shell.open=false;
      panel.hidden=!open;
      summary.setAttribute('aria-expanded',open?'true':'false');
      shell.classList.toggle('floatingMenuOpen',open);
      if(open)restorePosition();
    }
    function setMinimized(minimized){
      panel.classList.toggle('isMinimized',minimized);
      minimize.setAttribute('aria-pressed',minimized?'true':'false');
      minimize.title=minimized?definition.title+' maximieren':definition.title+' minimieren';
      minimize.setAttribute('aria-label',minimize.title);
      try{localStorage.setItem(minimizedKey,minimized?'1':'0');}catch(e){}
      if(!panel.hidden){
        const rect=panel.getBoundingClientRect(),p=clampPanel(panel,rect.left,rect.top);
        panel.style.left=p.left+'px';panel.style.top=p.top+'px';panel.style.right='auto';
      }
    }

    let initiallyMinimized=false;
    try{initiallyMinimized=localStorage.getItem(minimizedKey)==='1';}catch(e){}
    setMinimized(initiallyMinimized);

    summary.addEventListener('click',event=>{event.preventDefault();setOpen(panel.hidden);});
    minimize.addEventListener('click',()=>setMinimized(!panel.classList.contains('isMinimized')));
    close.addEventListener('click',()=>setOpen(false));
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)setOpen(false);});

    header.addEventListener('pointerdown',event=>{
      if(event.button!==0||event.target.closest('button'))return;
      const rect=panel.getBoundingClientRect(),offsetX=event.clientX-rect.left,offsetY=event.clientY-rect.top;
      header.setPointerCapture(event.pointerId);
      const move=moveEvent=>{
        const p=clampPanel(panel,moveEvent.clientX-offsetX,moveEvent.clientY-offsetY);
        panel.style.left=p.left+'px';panel.style.top=p.top+'px';panel.style.right='auto';
      };
      const end=()=>{
        header.removeEventListener('pointermove',move);header.removeEventListener('pointerup',end);header.removeEventListener('pointercancel',end);
        try{localStorage.setItem(storageKey,JSON.stringify({left:parseFloat(panel.style.left),top:parseFloat(panel.style.top)}));}catch(e){}
      };
      header.addEventListener('pointermove',move);header.addEventListener('pointerup',end);header.addEventListener('pointercancel',end);
    });
    window.addEventListener('resize',()=>{
      if(panel.hidden)return;
      const rect=panel.getBoundingClientRect(),p=clampPanel(panel,rect.left,rect.top);
      panel.style.left=p.left+'px';panel.style.top=p.top+'px';panel.style.right='auto';
    });
  }
})();
