/* ===== Input Manager ===== */
(function(){
  const deviceSelect=document.getElementById('inputManagerDeviceSelect');
  const refreshBtn=document.getElementById('inputManagerRefreshBtn');
  const clearBtn=document.getElementById('inputManagerClearBtn');
  const keyboardToggle=document.getElementById('inputManagerListenKeyboard');
  const pointerToggle=document.getElementById('inputManagerListenPointer');
  const statusEl=document.getElementById('inputManagerStatus');
  const outputEl=document.getElementById('inputManagerOutput');
  if(!deviceSelect||!statusEl||!outputEl)return;

  const state={
    devices:[],
    selectedDeviceId:'',
    selectedDevice:null,
    lastInput:null,
    gamepadSnapshot:[],
    capabilities:{}
  };
  window.vseInputManagerState=state;

  function currentInputManagerObject(){
    return (typeof selected!=='undefined'&&selected&&selected.type==='inputManager')?selected:null;
  }
  function escapeText(value){
    return String(value??'').replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  }
  function stableId(prefix,value){
    return prefix+':'+String(value||'default').replace(/\s+/g,'_').replace(/[^\w:.-]/g,'').slice(0,80);
  }
  function setStatus(text){
    statusEl.textContent=text;
  }
  function renderPayload(payload){
    const lines=[];
    lines.push('Gerät: '+(state.selectedDevice?state.selectedDevice.label:'Keine Auswahl'));
    lines.push('Typ: '+(state.selectedDevice?state.selectedDevice.kind:'-'));
    lines.push('Zeit: '+new Date().toLocaleTimeString());
    lines.push('');
    lines.push(JSON.stringify(payload||state.lastInput||{},null,2));
    outputEl.textContent=lines.join('\n');
  }
  function rememberInput(payload){
    state.lastInput=payload;
    const o=currentInputManagerObject();
    if(o){
      o.inputManagerLastInput=payload;
      o.inputManagerDeviceId=state.selectedDeviceId;
      if(state.selectedDevice){
        o.inputManagerDeviceKind=state.selectedDevice.kind;
        o.inputManagerDeviceLabel=state.selectedDevice.label;
      }
    }
    renderPayload(payload);
  }
  function deviceLabel(device){
    if(!device)return 'Unbekanntes Gerät';
    return device.label||device.name||device.id||device.kind||'Unbekanntes Gerät';
  }
  function addDevice(list,device){
    if(!device||!device.id)return;
    if(list.some(existing=>existing.id===device.id))return;
    list.push(device);
  }
  function scanGamepads(list){
    if(!navigator.getGamepads)return;
    const pads=Array.from(navigator.getGamepads()||[]).filter(Boolean);
    pads.forEach((pad,index)=>{
      addDevice(list,{
        id:stableId('gamepad',pad.index),
        kind:'gamepad',
        label:pad.id||('Gamepad '+(index+1)),
        index:pad.index,
        axes:pad.axes?pad.axes.length:0,
        buttons:pad.buttons?pad.buttons.length:0
      });
    });
  }
  async function scanMediaDevices(list){
    if(!navigator.mediaDevices||!navigator.mediaDevices.enumerateDevices)return;
    try{
      const devices=await navigator.mediaDevices.enumerateDevices();
      devices.forEach((device,index)=>{
        addDevice(list,{
          id:stableId(device.kind,device.deviceId||index),
          kind:device.kind,
          label:device.label||device.kind+' '+(index+1),
          groupId:device.groupId||'',
          deviceId:device.deviceId||''
        });
      });
    }catch(err){
      state.capabilities.mediaDevicesError=err.message;
    }
  }
  async function scanHidDevices(list){
    if(!navigator.hid||!navigator.hid.getDevices)return;
    state.capabilities.webHid=true;
    try{
      const devices=await navigator.hid.getDevices();
      devices.forEach((device,index)=>{
        addDevice(list,{
          id:stableId('hid',device.productName||index),
          kind:'hid',
          label:device.productName||('HID-Gerät '+(index+1)),
          vendorId:device.vendorId,
          productId:device.productId
        });
      });
    }catch(err){
      state.capabilities.webHidError=err.message;
    }
  }
  function addBrowserCapabilities(list){
    addDevice(list,{id:'keyboard',kind:'keyboard',label:'Tastatur'});
    addDevice(list,{id:'pointer',kind:'pointer',label:'Maus / Pointer / Wheel'});
    if(navigator.xr){
      state.capabilities.webXr=true;
      addDevice(list,{id:'webxr',kind:'xr',label:'WebXR Controller / Hands'});
    }
    if(navigator.usb){
      state.capabilities.webUsb=true;
      addDevice(list,{id:'webusb',kind:'usb',label:'WebUSB Geräte'});
    }
    if(navigator.requestMIDIAccess){
      state.capabilities.webMidi=true;
      addDevice(list,{id:'webmidi',kind:'midi',label:'WebMIDI Eingänge'});
    }
    if(navigator.serial){
      state.capabilities.webSerial=true;
      addDevice(list,{id:'webserial',kind:'serial',label:'Serielle Eingabegeräte'});
    }
  }
  async function refreshDevices(){
    const list=[];
    state.capabilities={};
    addBrowserCapabilities(list);
    scanGamepads(list);
    await scanMediaDevices(list);
    await scanHidDevices(list);
    state.devices=list;
    renderDeviceOptions();
    setStatus(list.length+' Eingabequelle'+(list.length!==1?'n':'')+' verfügbar.');
    renderSelectedDevice();
  }
  function renderDeviceOptions(){
    const old=deviceSelect.value||state.selectedDeviceId;
    deviceSelect.innerHTML='';
    state.devices.forEach(device=>{
      const option=document.createElement('option');
      option.value=device.id;
      option.textContent=deviceLabel(device)+' · '+device.kind;
      deviceSelect.appendChild(option);
    });
    const o=currentInputManagerObject();
    const wanted=(o&&o.inputManagerDeviceId)||old||'keyboard';
    deviceSelect.value=state.devices.some(device=>device.id===wanted)?wanted:(state.devices[0]&&state.devices[0].id)||'';
    setSelectedDevice(deviceSelect.value,false);
  }
  function setSelectedDevice(id,store=true){
    state.selectedDeviceId=id;
    state.selectedDevice=state.devices.find(device=>device.id===id)||null;
    if(store){
      const o=currentInputManagerObject();
      if(o&&state.selectedDevice){
        o.inputManagerDeviceId=state.selectedDevice.id;
        o.inputManagerDeviceKind=state.selectedDevice.kind;
        o.inputManagerDeviceLabel=state.selectedDevice.label;
      }
    }
    renderSelectedDevice();
  }
  function renderSelectedDevice(){
    const device=state.selectedDevice;
    if(!device){
      outputEl.textContent='Keine Eingabe.';
      return;
    }
    const payload={
      device,
      capabilities:state.capabilities,
      lastInput:state.lastInput
    };
    renderPayload(payload);
  }
  function selectedKindIs(kind){
    return state.selectedDevice&&state.selectedDevice.kind===kind;
  }
  function handleKeyboard(event,type){
    const o=currentInputManagerObject();
    const enabled=o?o.inputManagerListenKeyboard!==false:(!keyboardToggle||keyboardToggle.checked);
    if(!enabled||!selectedKindIs('keyboard'))return;
    rememberInput({
      source:'keyboard',
      type,
      key:event.key,
      code:event.code,
      repeat:event.repeat,
      altKey:event.altKey,
      ctrlKey:event.ctrlKey,
      shiftKey:event.shiftKey,
      metaKey:event.metaKey
    });
  }
  function handlePointer(event,type){
    const o=currentInputManagerObject();
    const enabled=o?o.inputManagerListenPointer!==false:(!pointerToggle||pointerToggle.checked);
    if(!enabled||!selectedKindIs('pointer'))return;
    rememberInput({
      source:'pointer',
      type,
      x:event.clientX,
      y:event.clientY,
      button:event.button,
      buttons:event.buttons,
      pointerType:event.pointerType||'mouse',
      deltaX:event.deltaX||0,
      deltaY:event.deltaY||0
    });
  }
  function pollGamepad(){
    if(!navigator.getGamepads)return;
    const device=state.selectedDevice;
    if(!device||device.kind!=='gamepad')return;
    const pad=Array.from(navigator.getGamepads()||[]).find(item=>item&&stableId('gamepad',item.index)===device.id);
    if(!pad)return;
    const payload={
      source:'gamepad',
      id:pad.id,
      index:pad.index,
      connected:pad.connected,
      axes:Array.from(pad.axes||[]).map(v=>Number(v.toFixed(4))),
      buttons:Array.from(pad.buttons||[]).map((button,index)=>({index,pressed:button.pressed,touched:button.touched,value:Number(button.value.toFixed(4))}))
    };
    const key=JSON.stringify(payload);
    if(state._lastGamepadKey!==key){
      state._lastGamepadKey=key;
      rememberInput(payload);
    }
  }
  function syncFromSelection(){
    const o=currentInputManagerObject();
    if(!o)return;
    if(keyboardToggle)keyboardToggle.checked=o.inputManagerListenKeyboard!==false;
    if(pointerToggle)pointerToggle.checked=o.inputManagerListenPointer!==false;
    if(o.inputManagerDeviceId&&deviceSelect.value!==o.inputManagerDeviceId){
      deviceSelect.value=o.inputManagerDeviceId;
      setSelectedDevice(deviceSelect.value,false);
    }
  }

  deviceSelect.addEventListener('input',()=>setSelectedDevice(deviceSelect.value,true));
  if(refreshBtn)refreshBtn.addEventListener('click',()=>refreshDevices());
  if(clearBtn)clearBtn.addEventListener('click',()=>{
    state.lastInput=null;
    const o=currentInputManagerObject();
    if(o)o.inputManagerLastInput=null;
    renderSelectedDevice();
  });
  if(keyboardToggle)keyboardToggle.addEventListener('input',()=>{
    const o=currentInputManagerObject();
    if(o)o.inputManagerListenKeyboard=keyboardToggle.checked;
  });
  if(pointerToggle)pointerToggle.addEventListener('input',()=>{
    const o=currentInputManagerObject();
    if(o)o.inputManagerListenPointer=pointerToggle.checked;
  });
  window.addEventListener('keydown',event=>handleKeyboard(event,'keydown'),true);
  window.addEventListener('keyup',event=>handleKeyboard(event,'keyup'),true);
  window.addEventListener('pointerdown',event=>handlePointer(event,'pointerdown'),true);
  window.addEventListener('pointermove',event=>handlePointer(event,'pointermove'),true);
  window.addEventListener('pointerup',event=>handlePointer(event,'pointerup'),true);
  window.addEventListener('wheel',event=>handlePointer(event,'wheel'),{capture:true,passive:true});
  window.addEventListener('gamepadconnected',()=>refreshDevices());
  window.addEventListener('gamepaddisconnected',()=>refreshDevices());
  window.syncInputManagerPanel=syncFromSelection;

  const prevSelect=window.select;
  if(typeof prevSelect==='function'){
    window.select=function(){
      const result=prevSelect.apply(this,arguments);
      syncFromSelection();
      return result;
    };
  }
  refreshDevices();
  setInterval(pollGamepad,80);
})();
