(function(){
  const colorRe=/^#[0-9a-f]{6}$/i;
  const shortColorRe=/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
  const palette=[
    '#000000','#111111','#222222','#343a40','#4b5563','#6b7280','#9ca3af','#d1d5db','#f3f4f6','#ffffff',
    '#05070c','#0f1113','#171a1d','#202428','#526e99','#eef6ff','#f4f7ff','#75dfff','#2fd6ff','#61ff6b',
    '#7f1d1d','#991b1b','#b91c1c','#dc2626','#ef4444','#f87171','#fecaca','#ff4d5f',
    '#7c2d12','#9a3412','#c2410c','#ea580c','#f97316','#fb923c','#fed7aa','#ff8a3d',
    '#713f12','#854d0e','#a16207','#ca8a04','#eab308','#facc15','#fef08a','#fff3a0',
    '#14532d','#166534','#15803d','#16a34a','#22c55e','#4ade80','#bbf7d0','#57cb9b',
    '#134e4a','#115e59','#0f766e','#0d9488','#14b8a6','#2dd4bf','#99f6e4','#75dfff',
    '#164e63','#155e75','#0e7490','#0891b2','#06b6d4','#22d3ee','#a5f3fc','#2fd6ff',
    '#1e3a8a','#1d4ed8','#2563eb','#3b82f6','#60a5fa','#93c5fd','#bfdbfe','#526e99',
    '#312e81','#3730a3','#4338ca','#4f46e5','#6366f1','#818cf8','#c7d2fe','#aa70ff',
    '#581c87','#6b21a8','#7e22ce','#9333ea','#a855f7','#c084fc','#e9d5ff','#d946ef',
    '#831843','#9d174d','#be185d','#db2777','#ec4899','#f472b6','#fbcfe8','#ff6fb1'
  ];
  const renderers=new WeakMap();

  function clamp(value,min,max){
    return Math.min(max,Math.max(min,value));
  }

  function normalizeColor(value,fallback){
    const raw=String(value || '').trim();
    if(colorRe.test(raw)) return raw.toLowerCase();
    const short=shortColorRe.exec(raw);
    if(short) return (`#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`).toLowerCase();
    return colorRe.test(fallback || '') ? fallback.toLowerCase() : '#ffffff';
  }

  function hexToRgb(hex){
    const color=normalizeColor(hex,'#ffffff');
    return {
      r:parseInt(color.slice(1,3),16),
      g:parseInt(color.slice(3,5),16),
      b:parseInt(color.slice(5,7),16)
    };
  }

  function rgbToHex(rgb){
    return '#'+[rgb.r,rgb.g,rgb.b].map(value=>clamp(Math.round(value),0,255).toString(16).padStart(2,'0')).join('');
  }

  function rgbToHsv(rgb){
    const r=rgb.r/255;
    const g=rgb.g/255;
    const b=rgb.b/255;
    const max=Math.max(r,g,b);
    const min=Math.min(r,g,b);
    const delta=max-min;
    let h=0;
    if(delta){
      if(max===r) h=60*(((g-b)/delta)%6);
      else if(max===g) h=60*((b-r)/delta+2);
      else h=60*((r-g)/delta+4);
    }
    if(h<0) h+=360;
    return {h:Math.round(h),s:max===0 ? 0 : delta/max,v:max};
  }

  function hsvToRgb(hsv){
    const h=((Number(hsv.h) || 0)%360+360)%360;
    const s=clamp(Number(hsv.s) || 0,0,1);
    const v=clamp(Number(hsv.v) || 0,0,1);
    const c=v*s;
    const x=c*(1-Math.abs((h/60)%2-1));
    const m=v-c;
    let r=0,g=0,b=0;
    if(h<60){r=c;g=x;}
    else if(h<120){r=x;g=c;}
    else if(h<180){g=c;b=x;}
    else if(h<240){g=x;b=c;}
    else if(h<300){r=x;b=c;}
    else {r=c;b=x;}
    return {r:(r+m)*255,g:(g+m)*255,b:(b+m)*255};
  }

  function dispatchNative(input,type){
    input.dispatchEvent(new Event(type,{bubbles:true}));
  }

  function closeAll(except){
    document.querySelectorAll('.vseColorControl.isOpen').forEach(control=>{
      if(control!==except){
        control.classList.remove('isOpen');
        const panel=control.querySelector('.vseColorPalette');
        if(panel)panel.removeAttribute('style');
      }
    });
  }

  function numberInput(label,min,max){
    const wrap=document.createElement('label');
    wrap.className='vseColorNumber';
    const span=document.createElement('span');
    span.textContent=label;
    const input=document.createElement('input');
    input.type='number';
    input.min=String(min);
    input.max=String(max);
    input.step='1';
    wrap.append(span,input);
    return {wrap,input};
  }

  function installControl(input){
    if(!input || input.dataset.vseColorControl==='ready') return;
    input.dataset.vseColorControl='ready';

    const initial=normalizeColor(input.value,input.getAttribute('value'));
    let hsv=rgbToHsv(hexToRgb(initial));
    input.value=initial;
    input.classList.add('vseNativeColorInput');
    input.tabIndex=-1;
    input.setAttribute('aria-hidden','true');

    const control=document.createElement('div');
    control.className='vseColorControl';
    control.dataset.source=input.id || '';

    const toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='vseColorSwatch';
    toggle.title='Farbpalette';
    toggle.setAttribute('aria-label','Farbpalette öffnen');

    const hex=document.createElement('input');
    hex.type='text';
    hex.className='vseColorHex';
    hex.inputMode='text';
    hex.spellcheck=false;
    hex.maxLength=7;
    hex.setAttribute('aria-label','Hex-Farbe');

    const panel=document.createElement('div');
    panel.className='vseColorPalette';

    const picker=document.createElement('div');
    picker.className='vseColorPickerMap';
    const cursor=document.createElement('span');
    cursor.className='vseColorPickerCursor';
    picker.appendChild(cursor);

    const hue=document.createElement('input');
    hue.type='range';
    hue.className='vseHueSlider';
    hue.min='0';
    hue.max='360';
    hue.step='1';
    hue.setAttribute('aria-label','Farbton');

    const rgbRow=document.createElement('div');
    rgbRow.className='vseColorRgbRow';
    const red=numberInput('R',0,255);
    const green=numberInput('G',0,255);
    const blue=numberInput('B',0,255);
    rgbRow.append(red.wrap,green.wrap,blue.wrap);

    const paletteTitle=document.createElement('div');
    paletteTitle.className='vseColorPaletteTitle';
    paletteTitle.textContent='Palette';

    const grid=document.createElement('div');
    grid.className='vseColorPaletteGrid';
    grid.setAttribute('role','listbox');
    palette.forEach(color=>{
      const swatch=document.createElement('button');
      swatch.type='button';
      swatch.className='vseColorOption';
      swatch.style.backgroundColor=color;
      swatch.title=color;
      swatch.setAttribute('aria-label',color);
      swatch.addEventListener('click',()=>{
        setValue(color,true);
        hex.focus();
      });
      grid.appendChild(swatch);
    });

    panel.append(picker,hue,rgbRow,paletteTitle,grid);
    control.append(toggle,hex,panel);
    input.insertAdjacentElement('afterend',control);

    function positionPalette(){
      if(!control.classList.contains('isOpen'))return;
      const gap=6,pad=8;
      const rect=control.getBoundingClientRect();
      const width=Math.min(312,Math.max(220,window.innerWidth-pad*2));
      panel.style.position='fixed';
      panel.style.zIndex='220';
      panel.style.width=width+'px';
      panel.style.left=clamp(rect.left,pad,window.innerWidth-width-pad)+'px';
      panel.style.top=(rect.bottom+gap)+'px';
      panel.style.maxHeight='none';
      const height=panel.offsetHeight||360;
      const below=window.innerHeight-(rect.bottom+gap)-pad;
      const above=rect.top-gap-pad;
      if(height>below&&above>below){
        panel.style.top=Math.max(pad,rect.top-gap-height)+'px';
      }
      const top=panel.getBoundingClientRect().top;
      panel.style.maxHeight=Math.max(180,window.innerHeight-top-pad)+'px';
      panel.style.overflow='auto';
    }

    function render(value){
      const color=normalizeColor(value,input.value);
      const rgb=hexToRgb(color);
      hsv=rgbToHsv(rgb);
      toggle.style.backgroundColor=color;
      hex.value=color;
      red.input.value=String(rgb.r);
      green.input.value=String(rgb.g);
      blue.input.value=String(rgb.b);
      hue.value=String(hsv.h);
      picker.style.setProperty('--vse-picker-hue',`hsl(${hsv.h} 100% 50%)`);
      cursor.style.left=`${hsv.s*100}%`;
      cursor.style.top=`${(1-hsv.v)*100}%`;
      control.dataset.value=color;
      grid.querySelectorAll('.vseColorOption').forEach(option=>{
        option.classList.toggle('isSelected',option.title.toLowerCase()===color);
      });
    }
    renderers.set(input,render);

    function setValue(value,commit){
      const color=normalizeColor(value,input.value);
      if(input.value!==color){
        input.value=color;
        dispatchNative(input,'input');
      }
      render(color);
      if(commit) dispatchNative(input,'change');
    }

    function setFromHsv(nextHsv,commit){
      hsv={
        h:clamp(Math.round(nextHsv.h),0,360),
        s:clamp(nextHsv.s,0,1),
        v:clamp(nextHsv.v,0,1)
      };
      setValue(rgbToHex(hsvToRgb(hsv)),commit);
    }

    function setFromRgb(commit){
      setValue(rgbToHex({
        r:Number(red.input.value),
        g:Number(green.input.value),
        b:Number(blue.input.value)
      }),commit);
    }

    function updatePickerFromPointer(event,commit){
      const rect=picker.getBoundingClientRect();
      setFromHsv({
        h:hsv.h,
        s:rect.width ? clamp((event.clientX-rect.left)/rect.width,0,1) : hsv.s,
        v:rect.height ? 1-clamp((event.clientY-rect.top)/rect.height,0,1) : hsv.v
      },commit);
    }

    toggle.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      const nextOpen=!control.classList.contains('isOpen');
      closeAll(control);
      control.classList.toggle('isOpen',nextOpen);
      if(nextOpen)requestAnimationFrame(positionPalette);
      else panel.removeAttribute('style');
    });

    picker.addEventListener('pointerdown',event=>{
      event.preventDefault();
      picker.setPointerCapture(event.pointerId);
      updatePickerFromPointer(event,false);
    });
    picker.addEventListener('pointermove',event=>{
      if(event.buttons) updatePickerFromPointer(event,false);
    });
    picker.addEventListener('pointerup',event=>{
      updatePickerFromPointer(event,true);
    });

    hue.addEventListener('input',()=>setFromHsv({h:Number(hue.value),s:hsv.s,v:hsv.v},false));
    hue.addEventListener('change',()=>setFromHsv({h:Number(hue.value),s:hsv.s,v:hsv.v},true));

    [red.input,green.input,blue.input].forEach(rgbInput=>{
      rgbInput.addEventListener('input',()=>setFromRgb(false));
      rgbInput.addEventListener('change',()=>setFromRgb(true));
    });

    hex.addEventListener('input',()=>{
      const raw=hex.value.trim();
      if(colorRe.test(raw) || shortColorRe.test(raw)) setValue(raw,false);
    });
    hex.addEventListener('change',()=>setValue(hex.value,true));
    hex.addEventListener('keydown',event=>{
      if(event.key==='Enter'){
        event.preventDefault();
        setValue(hex.value,true);
        control.classList.remove('isOpen');
      }
      if(event.key==='Escape'){
        event.preventDefault();
        render(input.value);
        control.classList.remove('isOpen');
      }
    });

    input.addEventListener('input',()=>render(input.value));
    input.addEventListener('change',()=>render(input.value));
    window.addEventListener('resize',positionPalette);
    document.addEventListener('scroll',positionPalette,true);
    render(initial);
  }

  function installAll(){
    document.querySelectorAll('input[type="color"]').forEach(installControl);
  }

  document.addEventListener('click',event=>{
    if(!event.target.closest('.vseColorControl')) closeAll();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape') closeAll();
  });

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',installAll,{once:true});
  else installAll();

  window.vseCloseColorControls=()=>closeAll();
  window.vseRefreshColorControls=()=>{
    installAll();
    document.querySelectorAll('input[type="color"]').forEach(input=>{
      const render=renderers.get(input);
      if(render) render(input.value);
    });
  };
})();
