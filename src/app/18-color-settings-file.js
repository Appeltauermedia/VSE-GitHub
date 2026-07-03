(function(){
  const saveButton=document.getElementById('saveColorSettingsBtn');
  const status=document.getElementById('colorSettingsStatus');
  if(!saveButton)return;

  const fileName='vse-color-settings.json';
  const fallbackKey='vse.colorSettingsFile';
  const defaults={objectIconColor:'#eef6ff',gridColor:'#526e99'};
  const validColor=value=>/^#[0-9a-f]{6}$/i.test(String(value||''));
  const normalizeSettings=value=>({
    objectIconColor:validColor(value&&value.objectIconColor)?String(value.objectIconColor).toLowerCase():defaults.objectIconColor,
    gridColor:validColor(value&&value.gridColor)?String(value.gridColor).toLowerCase():defaults.gridColor
  });
  const setStatus=(message,error=false)=>{
    if(!status)return;
    status.textContent=message;
    status.style.color=error?'#ff9b9b':'';
  };
  function applySettings(settings){
    const normalized=normalizeSettings(settings);
    scene.objectIconColor=normalized.objectIconColor;
    scene.gridColor=normalized.gridColor;
    if(typeof syncObjectIconColor==='function')syncObjectIconColor();
    if(typeof syncGridColorUi==='function')syncGridColorUi(scene.gridColor);
  }
  async function opfsRoot(){
    if(!navigator.storage||typeof navigator.storage.getDirectory!=='function')return null;
    return navigator.storage.getDirectory();
  }
  async function readSettings(){
    const root=await opfsRoot();
    if(root){
      try{
        const handle=await root.getFileHandle(fileName);
        const file=await handle.getFile();
        return {settings:JSON.parse(await file.text()),source:'file'};
      }catch(error){
        if(error&&error.name!=='NotFoundError')throw error;
        return null;
      }
    }
    try{
      const saved=localStorage.getItem(fallbackKey);
      return saved?{settings:JSON.parse(saved),source:'fallback'}:null;
    }catch(error){return null;}
  }
  async function writeSettings(settings){
    const normalized=normalizeSettings(settings);
    const payload=JSON.stringify({format:'vse-color-settings',version:1,...normalized},null,2);
    const root=await opfsRoot();
    if(root){
      const handle=await root.getFileHandle(fileName,{create:true});
      const writable=await handle.createWritable();
      await writable.write(payload);
      await writable.close();
      return 'file';
    }
    localStorage.setItem(fallbackKey,payload);
    return 'fallback';
  }

  saveButton.addEventListener('click',async()=>{
    saveButton.disabled=true;
    setStatus('Farbeinstellungen werden gespeichert …');
    try{
      const source=await writeSettings({objectIconColor:scene.objectIconColor,gridColor:scene.gridColor});
      setStatus(source==='file'?fileName+' gespeichert.':'Farben im lokalen Browser-Speicher gespeichert.');
    }catch(error){
      console.error('Farbeinstellungen konnten nicht gespeichert werden',error);
      setStatus('Speichern fehlgeschlagen: '+(error&&error.message?error.message:'unbekannter Fehler'),true);
    }finally{saveButton.disabled=false;}
  });

  (async()=>{
    try{
      const stored=await readSettings();
      if(!stored){applySettings(defaults);setStatus('Keine Einstellungsdatei gefunden · Standardfarben aktiv.');return;}
      applySettings(stored.settings);
      setStatus(stored.source==='file'?fileName+' beim Start geladen.':'Gespeicherte Farben beim Start geladen.');
    }catch(error){
      console.warn('Farbeinstellungsdatei ist ungültig',error);
      applySettings(defaults);
      setStatus('Einstellungsdatei ungültig · Standardfarben aktiv.',true);
    }
  })();
})();
