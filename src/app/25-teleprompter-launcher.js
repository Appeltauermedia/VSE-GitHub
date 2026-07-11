/* ===== Teleprompter Launcher ===== */
(function(){
  const button=document.getElementById('teleprompterOpenBtn');
  if(!button)return;
  let prompterWindow=null;

  function openTeleprompter(){
    const url=new URL('teleprompter.html',window.location.href);
    const features='popup=yes,width=1280,height=780,menubar=no,toolbar=no,location=no,status=no';
    if(prompterWindow&&!prompterWindow.closed){
      prompterWindow.focus();
      return;
    }
    prompterWindow=window.open(url.href,'vse-teleprompter',features);
    if(prompterWindow)prompterWindow.focus();
    else alert('Teleprompter-Fenster konnte nicht geöffnet werden. Bitte Popups für diese Seite erlauben.');
  }

  window.vseOpenTeleprompter=openTeleprompter;
  button.addEventListener('click',openTeleprompter);
})();
