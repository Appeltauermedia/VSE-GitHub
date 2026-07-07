/* ===== Audio, Playlist und Analyzer ===== */
function ensureAudio(){
  if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  if(!analyser){
    analyser=audioCtx.createAnalyser();
    analyser.fftSize=2048;
    analyser.smoothingTimeConstant=.82;
    freqData=new Uint8Array(analyser.frequencyBinCount);
    timeData=new Uint8Array(analyser.fftSize);
    // Wichtig: Der Analyser wird NICHT mit audioContext.destination verbunden.
    // Dadurch bleibt Mikrofon/Systemsound reine Analyse und erzeugt keine Rückkopplung.
  }
  if(!monitorGain){
    monitorGain=audioCtx.createGain();
    monitorGain.gain.value=0;
    monitorGain.connect(audioCtx.destination);
  }
  if(!analysisSinkGain){
    // Hält analyse-only Quellen aktiv, ohne Mikrofon/Systemsound auszugeben.
    analysisSinkGain=audioCtx.createGain();
    analysisSinkGain.gain.value=0;
    analyser.connect(analysisSinkGain);
    analysisSinkGain.connect(audioCtx.destination);
  }
  if(!recordingAudioDest){
    recordingAudioDest=audioCtx.createMediaStreamDestination();
  }
  return audioCtx;
}

function rebuildAudioRouting(){
  if(!audioSource||!analyser)return;
  const mode=currentAudioMode||audioState.source||'none';
  try{audioSource.disconnect();}catch(e){}
  if(currentAudioOutputNode){try{currentAudioOutputNode.disconnect();}catch(e){} currentAudioOutputNode=null;}

  // Stabiler Audio-Pfad ohne Transponieren:
  // Quelle -> Analyzer / Recording-Ziel / optionales Monitoring.
  currentAudioOutputNode=audioSource;
  try{audioSource.connect(analyser);}catch(e){}
  if(recordingAudioDest){try{audioSource.connect(recordingAudioDest);}catch(e){}}
  if(mode==='file'&&audioMonitor.checked&&monitorGain){
    monitorGain.gain.value=1;
    try{audioSource.connect(monitorGain);}catch(e){}
    audioState.monitor=true;
  }else{
    if(monitorGain)monitorGain.gain.value=0;
    audioState.monitor=false;
  }
}

function disconnectAudio(options={}){
  const keepFileElementSource=!!options.keepFileElementSource;
  if(audioSource){
    try{audioSource.disconnect();}catch(e){}
    if(!(keepFileElementSource && audioSource===audioElementSource)) audioSource=null;
  }
  if(currentAudioOutputNode){try{currentAudioOutputNode.disconnect();}catch(e){} currentAudioOutputNode=null;}
  if(audioStream){audioStream.getTracks().forEach(t=>t.stop()); audioStream=null;}
  if(monitorGain)monitorGain.gain.value=0;
}
function connectSource(mode){
  if(!audioSource||!analyser)return;
  currentAudioMode=mode||'none';
  // Gemeinsamer Audio-Ausgang: Quelle -> Analyzer/Recording/Monitoring.
  rebuildAudioRouting();
}
async function refreshMicrophoneDevices(preferredId){
  if(!micDeviceSelect||!navigator.mediaDevices||typeof navigator.mediaDevices.enumerateDevices!=='function')return;
  const previous=preferredId!==undefined?preferredId:micDeviceSelect.value;
  try{
    const devices=(await navigator.mediaDevices.enumerateDevices()).filter(device=>device.kind==='audioinput');
    micDeviceSelect.innerHTML='';
    const defaultOption=document.createElement('option');
    defaultOption.value='';defaultOption.textContent='Standard-Mikrofon';micDeviceSelect.appendChild(defaultOption);
    devices.forEach((device,index)=>{
      const option=document.createElement('option');
      option.value=device.deviceId;
      option.textContent=device.label||('Mikrofon '+(index+1));
      micDeviceSelect.appendChild(option);
    });
    if([...micDeviceSelect.options].some(option=>option.value===previous))micDeviceSelect.value=previous;
  }catch(error){console.warn('Mikrofonliste konnte nicht gelesen werden.',error);}
}
async function startMic(){
  try{
    if(!navigator.mediaDevices||typeof navigator.mediaDevices.getUserMedia!=='function')throw new Error('Dieser Browser stellt keinen Mikrofonzugriff bereit. Bitte über localhost oder HTTPS öffnen.');
    const ctx=ensureAudio();
    if(ctx.state==='suspended')await ctx.resume();
    disconnectAudio();
    audioPlayer.pause();
    audioStatus.textContent='Mikrofonzugriff wird angefordert …';
    const selectedDeviceId=micDeviceSelect&&micDeviceSelect.value;
    const audioConstraints={echoCancellation:false,noiseSuppression:false,autoGainControl:false};
    if(selectedDeviceId)audioConstraints.deviceId={exact:selectedDeviceId};
    const stream=await navigator.mediaDevices.getUserMedia({audio:audioConstraints,video:false});
    const tracks=stream.getAudioTracks();
    if(!tracks.length||tracks.every(track=>track.readyState==='ended')){
      stream.getTracks().forEach(track=>track.stop());
      throw new Error('Keine aktive Mikrofonspur verfügbar.');
    }
    audioStream=stream;
    audioSource=ctx.createMediaStreamSource(stream);
    connectSource('microphone');
    audioState.enabled=true;
    audioState.source='microphone';
    await refreshMicrophoneDevices(selectedDeviceId||tracks[0].getSettings().deviceId||'');
    tracks.forEach(track=>{track.onended=()=>{if(audioStream===stream)stopAudio();};});
    audioStatus.textContent='Audio aktiv: Mikrofon · analyse-only';
  }catch(err){
    disconnectAudio();
    audioState.enabled=false;
    audioState.source='none';
    const reason=err&&err.name==='NotAllowedError'?'Mikrofonzugriff wurde nicht erlaubt.':(err&&err.message)||String(err);
    audioStatus.textContent='Mikrofon konnte nicht gestartet werden: '+reason;
  }
}
async function startSystemAudio(){try{const ctx=ensureAudio();await ctx.resume();disconnectAudio();audioPlayer.pause();audioStream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:true});const tracks=audioStream.getAudioTracks();if(!tracks.length)throw new Error('Keine Audiospur gewählt. Beim Teilen Tab-/Systemaudio aktivieren.');audioSource=ctx.createMediaStreamSource(new MediaStream(tracks));connectSource('system');audioState.enabled=true;audioState.source='system';audioStatus.textContent='Audio aktiv: Systemsound / Tab-Audio · analyse-only, keine VSE-Ausgabe';}catch(err){audioStatus.textContent='Systemsound konnte nicht gestartet werden: '+err.message;}}
if(micBtn){
  micBtn.addEventListener('click',()=>{
    if(audioStatus)audioStatus.textContent='Mic wurde gewählt – Mikrofonzugriff wird gestartet …';
    startMic();
  });
}
function fmtTime(sec){
  if(!Number.isFinite(sec)||sec<0)sec=0;
  const m=Math.floor(sec/60),s=Math.floor(sec%60);
  return m+':'+String(s).padStart(2,'0');
}
function updateAudioPlayerUI(){
  const hasFile=!!audioPlayer.src;
  const dur=Number.isFinite(audioPlayer.duration)?audioPlayer.duration:0;
  const cur=Number.isFinite(audioPlayer.currentTime)?audioPlayer.currentTime:0;
  audioPlayPauseBtn.disabled=!hasFile;
  audioRestartBtn.disabled=!hasFile;
  audioSeek.disabled=!hasFile||dur<=0;
  audioCurrentTime.textContent=fmtTime(cur);
  audioDuration.textContent=fmtTime(dur);
  audioSeek.value=dur>0?String(Math.max(0,Math.min(1000,(cur/dur)*1000))):'0';
  audioPlayPauseBtn.textContent=audioPlayer.paused?'▶ Play':'⏸ Pause';
}

function renderAudioPlaylist(){
  if(!audioPlaylist)return;
  if(!audioState.playlist.length){
    audioPlaylist.innerHTML='<div class="mini">Kein Audio-Ordner geladen.</div>';
    if(audioPrevBtn)audioPrevBtn.disabled=true;
    if(audioNextBtn)audioNextBtn.disabled=true;
    return;
  }
  audioPlaylist.innerHTML='';
  audioState.playlist.forEach((f,i)=>{
    const div=document.createElement('div');
    div.className='audioTrack'+(i===audioState.playlistIndex?' active':'');
    div.textContent=(i+1)+'. '+(f.webkitRelativePath||f.name);
    div.title=f.webkitRelativePath||f.name;
    div.onclick=()=>loadAudioFile(f,i);
    audioPlaylist.appendChild(div);
  });
  if(audioPrevBtn)audioPrevBtn.disabled=audioState.playlist.length<2;
  if(audioNextBtn)audioNextBtn.disabled=audioState.playlist.length<2;
}

function readSynchsafe32(bytes,offset){
  return ((bytes[offset]&0x7f)<<21)|((bytes[offset+1]&0x7f)<<14)|((bytes[offset+2]&0x7f)<<7)|(bytes[offset+3]&0x7f);
}
function readUint32BE(bytes,offset){return ((bytes[offset]<<24)>>>0)|(bytes[offset+1]<<16)|(bytes[offset+2]<<8)|bytes[offset+3];}
function decodeLatin1(bytes){let s='';for(let i=0;i<bytes.length;i++)s+=String.fromCharCode(bytes[i]);return s;}
function bytesToAscii(bytes,offset,len){let s='';for(let i=0;i<len;i++)s+=String.fromCharCode(bytes[offset+i]||0);return s;}
function clearAudioCoverTexture(){
  if(audioCoverState.objectUrl){try{URL.revokeObjectURL(audioCoverState.objectUrl);}catch(e){} audioCoverState.objectUrl=null;}
  if(audioCoverState.texture){try{gl.deleteTexture(audioCoverState.texture);}catch(e){} audioCoverState.texture=null;}
  audioCoverState.aspect=1; audioCoverState.name=''; audioCoverState.found=false; audioCoverState.image=null;
}
function uploadAudioCoverImage(img,name){
  if(!audioCoverState.texture)audioCoverState.texture=initTexture();
  gl.bindTexture(gl.TEXTURE_2D,audioCoverState.texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
  audioCoverState.aspect=(img.naturalWidth||img.width||1)/Math.max(1,(img.naturalHeight||img.height||1));
  audioCoverState.name=name||'MP3-Cover';
  audioCoverState.found=true;
  audioCoverState.image=img;
}

function titleFromFileName(name){
  name=String(name||'').split('/').pop().split('\\').pop();
  return name.replace(/\.[^.]+$/,'').trim()||'Unbekannter Titel';
}
function markSongTitleScreensDirty(){
  for(const o of objects){
    if(o&&o.type==='screen'&&o.screenMode==='text'&&o.screenTextSource==='songTitle')o.screenTextDirty=true;
  }
}
function setCurrentAudioTitle(title,source,fileName){
  audioTitleState.title=String(title||'').trim()||titleFromFileName(fileName||audioTitleState.fileName||'');
  audioTitleState.source=source||'fallback';
  audioTitleState.fileName=fileName||audioTitleState.fileName||'';
  markSongTitleScreensDirty();
}
function decodeID3TextFrame(data){
  if(!data||!data.length)return '';
  const enc=data[0];
  const body=data.slice(1);
  try{
    if(enc===0)return new TextDecoder('iso-8859-1').decode(body).replace(/\0/g,'').trim();
    if(enc===3)return new TextDecoder('utf-8').decode(body).replace(/\0/g,'').trim();
    if(enc===1)return new TextDecoder('utf-16').decode(body).replace(/\0/g,'').trim();
    if(enc===2)return new TextDecoder('utf-16be').decode(body).replace(/\0/g,'').trim();
  }catch(e){
    try{return decodeLatin1(body).replace(/\0/g,'').trim();}catch(_){return '';}
  }
  return decodeLatin1(body).replace(/\0/g,'').trim();
}
async function extractAudioTitleFromFile(file){
  if(!file||!(/\.(mp3|mpeg)$/i.test(file.name||'')))return titleFromFileName(file&&file.name);
  let head;
  try{head=new Uint8Array(await file.slice(0,10).arrayBuffer());}catch(e){return titleFromFileName(file.name);}
  if(head.length<10||bytesToAscii(head,0,3)!=='ID3')return titleFromFileName(file.name);
  const major=head[3];
  const tagSize=readSynchsafe32(head,6);
  if(!tagSize||tagSize<10)return titleFromFileName(file.name);
  const readLen=Math.min(file.size,10+tagSize);
  let bytes;
  try{bytes=new Uint8Array(await file.slice(0,readLen).arrayBuffer());}catch(e){return titleFromFileName(file.name);}
  let pos=10;
  const end=Math.min(bytes.length,10+tagSize);
  try{
    if(bytes[5]&0x40){
      if(major===4){pos+=readSynchsafe32(bytes,pos)+4;}
      else if(major===3){pos+=readUint32BE(bytes,pos)+4;}
      else if(major===2){pos+=6;}
    }
  }catch(e){return titleFromFileName(file.name);}
  while(pos+6<=end){
    let id='',size=0,header=10;
    if(major===2){
      if(pos+6>end)break;
      id=bytesToAscii(bytes,pos,3);
      if(!id.trim()||/^\x00+$/.test(id))break;
      size=(bytes[pos+3]<<16)|(bytes[pos+4]<<8)|bytes[pos+5];
      header=6;
    }else{
      if(pos+10>end)break;
      id=bytesToAscii(bytes,pos,4);
      if(!id.trim()||/^\x00+$/.test(id))break;
      size=(major===4)?readSynchsafe32(bytes,pos+4):readUint32BE(bytes,pos+4);
      header=10;
    }
    const dataStart=pos+header;
    const dataEnd=dataStart+size;
    if(size<=0||dataEnd>end)break;
    if(id==='TIT2'||id==='TT2'){
      const title=decodeID3TextFrame(bytes.slice(dataStart,dataEnd));
      if(title)return title;
    }
    pos=dataEnd;
  }
  return titleFromFileName(file.name);
}

async function extractAudioCoverFromFile(file){
  clearAudioCoverTexture();
  if(!file||!/\.(mp3|mpeg)$/i.test(file.name||''))return false;

  let head;
  try{head=new Uint8Array(await file.slice(0,10).arrayBuffer());}catch(e){return false;}
  if(head.length<10||bytesToAscii(head,0,3)!=='ID3')return false;
  const major=head[3];
  const tagSize=readSynchsafe32(head,6);
  if(!tagSize||tagSize<10)return false;

  // Nur den ID3-Block lesen, nicht die komplette Audiodatei. Das hält große MP3s schnell
  // und verhindert, dass die Audio-Wiedergabe/Analyse durch Metadatenlesen ausgebremst wird.
  const readLen=Math.min(file.size,10+tagSize);
  let bytes;
  try{bytes=new Uint8Array(await file.slice(0,readLen).arrayBuffer());}catch(e){return false;}
  let pos=10;
  const end=Math.min(bytes.length,10+tagSize);

  // Extended Header überspringen, falls vorhanden.
  try{
    if(bytes[5]&0x40){
      if(major===4){pos+=readSynchsafe32(bytes,pos)+4;}
      else if(major===3){pos+=readUint32BE(bytes,pos)+4;}
      else if(major===2){pos+=6;}
    }
  }catch(e){return false;}

  function createCoverFromBytes(imageBytes,mime){
    if(!imageBytes||imageBytes.length<16)return Promise.resolve(false);
    mime=(mime||'image/jpeg').trim()||'image/jpeg';
    const blob=new Blob([imageBytes],{type:mime});
    const url=URL.createObjectURL(blob);
    audioCoverState.objectUrl=url;
    const img=new Image();
    return new Promise(resolve=>{
      img.onload=()=>{uploadAudioCoverImage(img,file.name);resolve(true);};
      img.onerror=()=>{clearAudioCoverTexture();resolve(false);};
      img.src=url;
    });
  }

  while(pos+6<=end){
    let id='',size=0,header=10;
    if(major===2){
      if(pos+6>end)break;
      id=bytesToAscii(bytes,pos,3);
      if(!id.trim()||/^\x00+$/.test(id))break;
      size=(bytes[pos+3]<<16)|(bytes[pos+4]<<8)|bytes[pos+5];
      header=6;
    }else{
      if(pos+10>end)break;
      id=bytesToAscii(bytes,pos,4);
      if(!id.trim()||/^\x00+$/.test(id))break;
      size=(major===4)?readSynchsafe32(bytes,pos+4):readUint32BE(bytes,pos+4);
      header=10;
    }
    const dataStart=pos+header;
    const dataEnd=dataStart+size;
    if(size<=0||dataEnd>end)break;

    if(id==='APIC'){
      const data=bytes.slice(dataStart,dataEnd);
      let p=1; // Text-Encoding
      let mimeEnd=p;
      while(mimeEnd<data.length&&data[mimeEnd]!==0)mimeEnd++;
      let mime=decodeLatin1(data.slice(p,mimeEnd)).trim()||'image/jpeg';
      p=mimeEnd+1;
      p+=1; // Picture-Type
      const enc=data[0];
      if(enc===1||enc===2){
        while(p+1<data.length && !(data[p]===0&&data[p+1]===0))p+=2;
        p+=2;
      }else{
        while(p<data.length && data[p]!==0)p++;
        p+=1;
      }
      if(p<data.length-16)return await createCoverFromBytes(data.slice(p),mime);
    }

    // ID3v2.2: PIC statt APIC, MIME/Farbformat 3 Zeichen, danach Picture-Type und Beschreibung.
    if(id==='PIC'){
      const data=bytes.slice(dataStart,dataEnd);
      let p=1;
      const fmt=decodeLatin1(data.slice(p,p+3)).toUpperCase();
      p+=3;
      let mime=fmt==='PNG'?'image/png':fmt==='GIF'?'image/gif':'image/jpeg';
      p+=1; // Picture-Type
      const enc=data[0];
      if(enc===1||enc===2){
        while(p+1<data.length && !(data[p]===0&&data[p+1]===0))p+=2;
        p+=2;
      }else{
        while(p<data.length && data[p]!==0)p++;
        p+=1;
      }
      if(p<data.length-16)return await createCoverFromBytes(data.slice(p),mime);
    }

    pos=dataEnd;
  }
  return false;
}


async function loadAudioFile(f,playlistIndex=-1){
  if(!f)return;
  const ctx=ensureAudio();
  await ctx.resume();

  // Audio-Pfad zuerst stabil aufbauen. Cover-Metadaten werden danach getrennt gelesen,
  // damit ein defektes/ungewöhnliches ID3-Tag niemals Player, Analyzer oder Engine blockiert.
  disconnectAudio({keepFileElementSource:true});
  audioPlayer.pause();
  audioPlayer.currentTime=0;
  clearAudioCoverTexture();

  if(audioObjectUrl){try{URL.revokeObjectURL(audioObjectUrl);}catch(e){} audioObjectUrl=null;}
  audioObjectUrl=URL.createObjectURL(f);
  audioPlayer.src=audioObjectUrl;
  audioPlayer.playbackRate=1;
  audioPlayer.defaultPlaybackRate=1;
  audioPlayer.volume=parseFloat(audioVolume.value);
  audioFileName.textContent=f.webkitRelativePath||f.name;
  setCurrentAudioTitle(titleFromFileName(f.name),'filename',f.name);
  audioPlayer.load();
  updateAudioPlayerUI();

  if(!audioElementSource) audioElementSource=ctx.createMediaElementSource(audioPlayer);
  audioSource=audioElementSource;
  connectSource('file');
  audioState.enabled=true;
  audioState.source='file';
  audioState.playlistIndex=playlistIndex;
  renderAudioPlaylist();
  audioStatus.textContent='Audio aktiv: Datei · '+(f.webkitRelativePath||f.name)+(audioMonitor.checked?' · Monitoring EIN':' · analyse-only');

  try{await audioPlayer.play();}
  catch(err){audioStatus.textContent='Datei geladen · Wiedergabe wartet auf Play-Klick: '+(f.webkitRelativePath||f.name);}
  updateAudioPlayerUI();

  // Nachgelagert: Cover auslesen. Kein await, kein Einfluss auf Audio/Analyzer.
  setTimeout(()=>{
    extractAudioCoverFromFile(f).then(found=>{
      if(!found){
        // Kein Cover ist kein Fehler. Screens im Modus MP3-Cover bleiben dann einfach leer/dunkel.
      }
    }).catch(()=>clearAudioCoverTexture());
    extractAudioTitleFromFile(f).then(title=>setCurrentAudioTitle(title,'metadata',f.name)).catch(()=>setCurrentAudioTitle(titleFromFileName(f.name),'filename',f.name));
  },0);
}
function playPlaylistOffset(delta){
  if(!audioState.playlist.length)return;
  const len=audioState.playlist.length;
  const base=audioState.playlistIndex>=0?audioState.playlistIndex:0;
  const next=(base+delta+len)%len;
  loadAudioFile(audioState.playlist[next],next);
}
function getFrequencyOverlayInfo(){
  if(!selected)return null;
  // Für Lichtemitter/Lightbars mit aktivem musikgesteuertem Farbwechsel
  // zeigt der Analyzer den separaten Farbwechsel-Frequenzbereich und dessen Threshold.
  if((selected.type==='light'||selected.type==='lightbar')&&selected.lightColorMusicEnabled){
    const freq=Math.max(AUDIO_REACT_MIN,Math.min(AUDIO_REACT_MAX,Number(selected.lightColorMusicFreq??1000)));
    const threshold=clamp01(Number(selected.lightColorMusicThreshold??.35));
    return {freq,threshold};
  }
  // Sonst bleibt das bisherige Overlay für die normale Objektreaktion aktiv.
  if(selected.audioFreq!==undefined){
    const freq=Math.max(AUDIO_REACT_MIN,Math.min(AUDIO_REACT_MAX,Number(selected.audioFreq)||120));
    const threshold=clamp01(Number(selected.music??0));
    return {freq,threshold};
  }
  return null;
}

function updateAudioFreqAnalyzerOverlay(){
  if(!audioFreqAnalyzer)return;
  const band=audioFreqAnalyzer.querySelector('.audioFreqOverlayBand');
  const line=audioFreqAnalyzer.querySelector('.audioFreqThresholdLine');
  if(!band||!line)return;
  const info=getFrequencyOverlayInfo();
  if(!info){band.style.display='none';line.style.display='none';return;}
  const center=info.freq;
  const lo=Math.max(AUDIO_REACT_MIN,center/Math.SQRT2);
  const hi=Math.min(AUDIO_REACT_MAX,center*Math.SQRT2);
  const l=freqToLogValue(lo)*100;
  const r=freqToLogValue(hi)*100;
  band.style.display='block';
  band.style.left=Math.max(0,Math.min(100,l)).toFixed(2)+'%';
  band.style.width=Math.max(0.7,Math.min(100,Math.max(l,r)-Math.min(l,r))).toFixed(2)+'%';
  line.style.display='block';
  line.style.bottom=(clamp01(info.threshold)*100).toFixed(2)+'%';
}

function setupAudioFreqAnalyzerBars(){
  if(!audioFreqAnalyzer||audioFreqAnalyzer.dataset.ready==='1')return;
  audioFreqAnalyzer.dataset.ready='1';
  audioFreqAnalyzer.innerHTML='';
  for(let i=0;i<40;i++){
    const b=document.createElement('span');
    b.style.height='0%';
    audioFreqAnalyzer.appendChild(b);
  }
  const overlayBand=document.createElement('div');
  overlayBand.className='audioFreqOverlayBand';
  const thresholdLine=document.createElement('div');
  thresholdLine.className='audioFreqThresholdLine';
  audioFreqAnalyzer.appendChild(overlayBand);
  audioFreqAnalyzer.appendChild(thresholdLine);
}
function updateAudioFreqAnalyzer(){
  setupAudioFreqAnalyzerBars();
  if(!audioFreqAnalyzer)return;
  const bars=audioFreqAnalyzer.querySelectorAll('span');
  if(!bars.length)return;
  updateAudioFreqAnalyzerOverlay();
  if(!analyser||!audioState.enabled||!freqData){bars.forEach(b=>{b.style.height='0%';b.style.opacity='.42';});return;}

  // Der Analyzer im Audio-Menü nutzt exakt dieselbe Pegelberechnung wie das
  // Frequenzbalkenvisualizer-Objekt: logarithmische Bandverteilung 20 Hz–20 kHz
  // und normalisierte Bandwerte über visualizerBandValue().
  // Die Anzeige selbst bleibt halbhoch; nur die Pegel werden nicht mehr halbiert.
  const sens=audioState.sensitivity;
  for(let i=0;i<bars.length;i++){
    const v=clamp01(visualizerBandValue(i,bars.length)*sens);
    // Kein Grundsockel mehr: sehr niedrige Werte bleiben wirklich aus.
    // Damit entsteht links am Analyzer keine helle Restkante durch die erste Säule.
    bars[i].style.height=(v<=0.006 ? 0 : Math.round(v*100))+'%';
    bars[i].style.opacity=String(v<=0.006 ? 0 : (0.42+v*0.58));
  }
  updateAudioFreqAnalyzerOverlay();
}

function stopAudio(){disconnectAudio();audioPlayer.pause();audioPlayer.currentTime=0;audioState.enabled=false;audioState.source='none';audioState.monitor=false;audioState.level=audioState.bass=audioState.mid=audioState.high=0;audioStatus.textContent='Audio aus.';updateAudioPlayerUI();}
sysBtn.onclick=startSystemAudio;stopAudioBtn.onclick=stopAudio;
if(micDeviceSelect)micDeviceSelect.addEventListener('change',()=>{if(audioState.source==='microphone')startMic();});
if(navigator.mediaDevices){
  refreshMicrophoneDevices();
  if(typeof navigator.mediaDevices.addEventListener==='function')navigator.mediaDevices.addEventListener('devicechange',()=>refreshMicrophoneDevices());
}
audioSensitivity.addEventListener('input',()=>{audioState.sensitivity=parseFloat(audioSensitivity.value);audioSensValue.textContent=audioState.sensitivity.toFixed(2);});
if(audioShowBpm)audioShowBpm.addEventListener('change',()=>{audioState.showBpm=audioShowBpm.checked;updateBpmDisplayVisibility();});
audioVolume.addEventListener('input',()=>{
  audioPlayer.volume=parseFloat(audioVolume.value);
  audioVolumeValue.textContent=Math.round(audioPlayer.volume*100)+'%';
});
audioSeek.addEventListener('input',()=>{
  const dur=Number.isFinite(audioPlayer.duration)?audioPlayer.duration:0;
  if(dur>0)audioPlayer.currentTime=(parseFloat(audioSeek.value)/1000)*dur;
  updateAudioPlayerUI();
});
audioPlayPauseBtn.addEventListener('click',async()=>{
  if(!audioPlayer.src)return;
  const ctx=ensureAudio();
  await ctx.resume();
  if(audioPlayer.paused){
    try{await audioPlayer.play();}
    catch(err){audioStatus.textContent='Wiedergabe konnte nicht gestartet werden: '+err.message;}
  }else{
    audioPlayer.pause();
  }
  updateAudioPlayerUI();
});
audioRestartBtn.addEventListener('click',async()=>{
  if(!audioPlayer.src)return;
  audioPlayer.currentTime=0;
  updateAudioPlayerUI();
});

audioMonitor.addEventListener('change',()=>{
  audioState.monitor=audioMonitor.checked&&audioState.source==='file';
  if(audioState.source==='file'&&audioSource&&monitorGain){
    rebuildAudioRouting();
    audioStatus.textContent='Audio aktiv: Datei · '+(audioMonitor.checked?'Monitoring EIN':'analyse-only');
  }else if(audioState.source==='system'){
    audioMonitor.checked=false;
    audioState.monitor=false;
    audioStatus.textContent='Systemsound bleibt analyse-only.';
  }
});
audioFile.addEventListener('change',async()=>{
  const f=audioFile.files&&audioFile.files[0];
  if(!f)return;
  await loadAudioFile(f,-1);
});
if(audioFolder)audioFolder.addEventListener('change',async()=>{
  const files=Array.from(audioFolder.files||[]).filter(f=>/^audio\//.test(f.type)||/\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(f.name));
  files.sort((a,b)=>(a.webkitRelativePath||a.name).localeCompare(b.webkitRelativePath||b.name,undefined,{numeric:true,sensitivity:'base'}));
  audioState.playlist=files;
  audioState.playlistIndex=files.length?0:-1;
  renderAudioPlaylist();
  if(files.length){
    audioStatus.textContent='Audio-Ordner geladen: '+files.length+' Audiodateien.';
    await loadAudioFile(files[0],0);
  }else{
    audioStatus.textContent='Der ausgewählte Ordner enthält keine unterstützten Audiodateien.';
  }
});
if(audioPrevBtn)audioPrevBtn.addEventListener('click',()=>playPlaylistOffset(-1));
if(audioNextBtn)audioNextBtn.addEventListener('click',()=>playPlaylistOffset(1));
setupAudioFreqAnalyzerBars();

audioPlayer.addEventListener('ended',()=>{
  updateAudioPlayerUI();
  if(audioState.source==='file'&&audioState.playlist.length>1&&audioState.playlistIndex>=0){playPlaylistOffset(1);return;}
  if(audioState.source==='file') audioStatus.textContent='Audiodatei beendet. Neue Datei kann direkt geladen oder dieselbe erneut gestartet werden.';
});

audioPlayer.addEventListener('loadedmetadata',()=>{updateAudioPlayerUI();useTimelineMediaDurationIfAvailable(true);});
audioPlayer.addEventListener('timeupdate',()=>{updateAudioPlayerUI();updateTimelinePlayhead();});
audioPlayer.addEventListener('pause',updateAudioPlayerUI);
audioPlayer.addEventListener('play',async()=>{
  if(audioState.source==='file'&&audioCtx&&audioCtx.state==='suspended') await audioCtx.resume();
  updateAudioPlayerUI();
});
updateAudioPlayerUI();

function resetBpmEstimator(){
  audioState.bpm=null;
  audioState.bpmBeats=[];
  if(bpmValue)bpmValue.textContent='--';
}
function registerBpmBeat(now){
  if(!audioState.showBpm)return;
  audioState.bpmBeats.push(now);
  audioState.bpmBeats=audioState.bpmBeats.filter(t=>now-t<=12000);
  if(audioState.bpmBeats.length<4){
    if(bpmValue)bpmValue.textContent='...';
    return;
  }
  const intervals=[];
  for(let i=1;i<audioState.bpmBeats.length;i++){
    const d=audioState.bpmBeats[i]-audioState.bpmBeats[i-1];
    if(d>=260&&d<=2000)intervals.push(d);
  }
  if(intervals.length<3){
    if(bpmValue)bpmValue.textContent='...';
    return;
  }
  intervals.sort((a,b)=>a-b);
  const mid=Math.floor(intervals.length/2);
  const median=intervals.length%2?intervals[mid]:(intervals[mid-1]+intervals[mid])*0.5;
  let bpm=60000/median;
  while(bpm<70)bpm*=2;
  while(bpm>190)bpm/=2;
  audioState.bpm=audioState.bpm ? (audioState.bpm*0.72+bpm*0.28) : bpm;
  if(bpmValue)bpmValue.textContent=Math.round(audioState.bpm).toString();
}
function updateBpmDisplayVisibility(){
  if(bpmDisplay)bpmDisplay.style.display=audioState.showBpm?'block':'none';
  if(!audioState.showBpm)resetBpmEstimator();
}

function updateAudio(){
  const now=performance.now();
  const dt=Math.min(0.08,(now-audioState.lastFrame)/1000||0.016);
  audioState.lastFrame=now;
  audioState.beat=false;
  audioState.beatPulse=Math.max(0,audioState.beatPulse-dt*3.6);

  if(!analyser||!audioState.enabled){
    audioState.level=audioState.bass=audioState.mid=audioState.high=0;
    audioState.beatPulse=0;
    if(audioState.showBpm && bpmValue)bpmValue.textContent='--';
    mLevel.style.width='0%';updateAudioFreqAnalyzer();
    return;
  }
  analyser.getByteFrequencyData(freqData);analyser.getByteTimeDomainData(timeData);
  let sum=0;for(let i=0;i<timeData.length;i++){let v=(timeData[i]-128)/128;sum+=v*v;}audioState.level=Math.min(1,Math.sqrt(sum/timeData.length)*2.4);
  const nyq=(audioCtx?audioCtx.sampleRate:44100)/2, bin=nyq/freqData.length;
  function band(lo,hi){let a=Math.max(0,Math.floor(lo/bin)),b=Math.min(freqData.length-1,Math.ceil(hi/bin));let s=0,n=0;for(let i=a;i<=b;i++){s+=freqData[i];n++;}return n?Math.min(1,(s/n)/255):0;}
  audioState.bass=band(20,160);audioState.mid=band(160,2200);audioState.high=band(2200,12000);

  // Einfache Beat-Erkennung über Bass-Transienten.
  audioState.bassAvg=audioState.bassAvg*.92 + audioState.bass*.08;
  const beatThreshold=Math.max(.22,audioState.bassAvg*1.45);
  if(audioState.bass>beatThreshold && now-audioState.lastBeat>240){
    audioState.beat=true;
    audioState.beatPulse=1;
    audioState.lastBeat=now;
    registerBpmBeat(now);
  }

  mLevel.style.width=Math.round(audioState.level*100)+'%';updateAudioFreqAnalyzer();
}

function audioBoost(o){
  if(!audioState.enabled)return 1;
  const oa=objectAudio(o);
  const mix=oa.level;
  return 1+mix*audioState.sensitivity*2.2;
}


function updateHud(){
  if(!hud)return;
  if(waterDrawMode&&waterDrawMode.draft){
    hud.textContent=`Wasser-Werkzeug aktiv: ${waterDrawMode.type} · Form ${waterDrawMode.draft.waterShape||'rect'} · auf der Arbeitsfläche zeichnen · Objekte: ${objects.length}`;
    return;
  }
  const arr=getSelectedObjects();
  const groupInfo=arr.length&&arr[0].groupId?` · Gruppe: ${arr[0].groupName||arr[0].groupId}`:'';
  hud.textContent=(arr.length>1?`${arr.length} Objekte ausgewählt`:selected?`Auswahl: ${selected.name} · ${selected.type} · Layer ${selected.layer??1}`:'Keine Auswahl')+groupInfo+` · Objekte: ${objects.length}`;
}
