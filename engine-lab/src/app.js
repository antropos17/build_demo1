(function () {
  'use strict';
  const { Engine, Renderer, MotorAudio, PedalInput, Dashboard, IgnitionPanel, clamp } = window.Piston;
  const $ = id => document.getElementById(id), canvas = $('engine'), button = $('gas');
  const storageKey = 'last-piston:survivor:v1', prefsKey = 'last-piston:settings:v1';
  const testing = new URLSearchParams(location.search).has('test') || window.__PISTON_TEST__ === true;
  let model = new Engine(), saved = false, prefs = {};
  try {
    if (!testing) {
      const raw = localStorage.getItem(storageKey);
      if (raw) { const data = JSON.parse(raw); model = Engine.restore(data); saved = model.time > 0; }
      prefs = JSON.parse(localStorage.getItem(prefsKey) || '{}') || {};
    }
  } catch (_) { /* Blocked storage is an offline mode, not a fatal error. */ }
  const view = new Renderer(canvas), sound = new MotorAudio();
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  sound.muted = prefs.muted === true; view.reduced = prefs.reduced === true || motionPreference.matches;
  let held = false, last = 0, acc = 0, hudTime = 0, saveTime = 0;
  let inspecting = false, audioTime=0, perfTime=0, renderCost=0, slowFrames=0;
  let targetFps=60, skippedTime=0;
  let frameMs = 16, pausedForTest = false, resetUntil = 0, resetTimer = null, logSignature = null;
  if(Number.isFinite(prefs.volume)) sound.setVolume(prefs.volume);
  for(const channel of ['engine','mechanical']) if(Number.isFinite(prefs.mix?.[channel])) sound.setMix(channel,prefs.mix[channel]);
  view.setPerformance(prefs.performance || 'auto');
  targetFps=view.performanceMode==='eco'?30:60; $('profile').value=model.profile; $('performance-mode').value=view.performanceMode; $('volume').value=Math.round(sound.volume*100);
  const dom = Object.fromEntries(['rpm', 'temp', 'water', 'oil-temp', 'pressure', 'oil', 'active', 'clock', 'status', 'caption',
    'event-label', 'event-title', 'event-detail', 'survival', 'event-log', 'audio-status', 'best', 'pulse-state', 'journal',
    'journal-count', 'mute', 'motion', 'reset', 'control-info'].map(id => [id, $(id)]));
  const cylDom = Array.from({ length: 4 }, (_, i) => ({ root: $('cyl' + i), name: $('cyl' + i).querySelector('b'), bar: $('cyl' + i).querySelector('i'), detail: $('cyl-detail' + i) }));
  for (let i = 0; i < 30; i++) { const tick = document.createElement('i'); if (i > 23) tick.className = 'high'; $('rpm-ticks').appendChild(tick); }
  const ticks = [...$('rpm-ticks').children];
  const fmt = t => { const s = Math.max(0, Math.floor(t)); return (s >= 3600 ? String(Math.floor(s / 3600)).padStart(2, '0') + ':' : '') + String(Math.floor(s / 60) % 60).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  function audioStatus() {
    dom['audio-status'].textContent = sound.muted ? 'ЗВУК ВЫКЛЮЧЕН' : sound.ready ? 'ЗАПИСИ ДВИГАТЕЛЯ · CC0' : sound.status.includes('не загрузилось') ? 'ЗАПИСИ НЕДОСТУПНЫ: ПРОВЕРЬ СЕТЬ' : 'ЗАПИСИ ЗАГРУЖАЮТСЯ ПРИ ЗАПУСКЕ';
    dom.mute.textContent = sound.muted ? 'Включить звук' : 'Выключить звук'; dom.mute.setAttribute('aria-pressed', String(!sound.muted));
    dom.motion.textContent = view.reduced ? 'Вернуть тряску' : 'Уменьшить тряску'; dom.motion.setAttribute('aria-pressed', String(view.reduced));
  }
  const dashboard = new Dashboard();
  const ignitionPanel = new IgnitionPanel(action => {
    release();
    if (action === 'boost') model.chargeBattery();
    else {
      if (model.ignition === 'off') model.requestStart(); else model.requestStop();
      if (inspecting) setInspection(false);
      sound.start().then(audioStatus);
    }
    events(); sound.update(model); hud(); view.render(model); persist();
  });
  const pedals = new PedalInput(button, $('brake'), () => {
    if (inspecting) setInspection(false);
    sound.start().then(ok => { audioStatus(); if (!ok) dom['audio-status'].textContent = 'ЗВУК НЕДОСТУПЕН'; });
  });
  function release() { pedals.release(); held = false; }
  function setInspection(value){
    inspecting=value;last=0;acc=0;
    $('inspect-pause').textContent=value?'Продолжить':'Пауза осмотра';$('inspect-pause').setAttribute('aria-pressed',String(value));
    if(value){release();sound.suspend().catch(()=>{});}else sound.resume().catch(()=>{});
    view.render(model);
  }
  $('inspect-pause').addEventListener('click',()=>setInspection(!inspecting));
  for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>{
    view.setView(b.dataset.view);document.querySelectorAll('[data-view]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));view.render(model);
  });
  $('zoom-out').addEventListener('click',()=>{view.zoom=1;view.partFocus=null;$('inspection-note').textContent='Нажми на карточку цилиндра, чтобы увеличить разрез.';hud();view.render(model);});
  cylDom.forEach((d,i)=>{
    d.root.setAttribute('role','button');d.root.setAttribute('tabindex','0');d.root.title='Увеличить цилиндр '+(i+1);
    const focus=()=>{view.setFocus(i);syncParts();hud();view.render(model);};d.root.addEventListener('click',focus);
    d.root.addEventListener('keydown',e=>{if(e.code==='Enter'||e.code==='Space'){e.preventDefault();e.stopPropagation();focus();}});
  });
  function syncParts(){
    for(const b of document.querySelectorAll('[data-part]')) b.setAttribute('aria-pressed',String(view.partFocus===b.dataset.part&&view.zoom>1));
  }
  for(const b of document.querySelectorAll('[data-part]')) b.addEventListener('click',()=>{
    view.setPart(b.dataset.part);syncParts();hud();view.render(model);
  });
  $('zoom-out').addEventListener('click',syncParts);
  for(const channel of ['engine','mechanical']) {
    const slider=$(channel+'-mix'),output=$(channel+'-mix-value');slider.value=Math.round(sound.mixSettings[channel]*100);output.textContent=slider.value+'%';
    slider.addEventListener('input',()=>{sound.setMix(channel,Number(slider.value)/100);output.textContent=slider.value+'%';persist();});
  }
  sound.onStatus=()=>{audioStatus();};
  function persist() {
    if (testing) return;
    try { localStorage.setItem(storageKey, JSON.stringify(model.snapshot())); localStorage.setItem(prefsKey, JSON.stringify({ muted: sound.muted, reduced: view.reduced, volume:sound.volume, performance:view.performanceMode, mix:sound.mixSettings })); } catch (_) {}
  }
  function newEngine() {
    release(); sound.resume().catch(()=>{}); inspecting=false; view.zoom=1; $('inspect-pause').textContent='Пауза осмотра'; $('inspect-pause').setAttribute('aria-pressed','false'); const profile=model.profile; model = new Engine(); model.setProfile(profile); view.reset(); sound.update(model); logSignature = null; resetUntil = 0;
    clearTimeout(resetTimer); dom.reset.textContent = 'Новый мотор'; dom['control-info'].textContent = 'Новый мотор. Начинаем с четырёх цилиндров.';
    dom['event-log'].textContent = ''; persist(); hud(); view.render(model); drawTrace();
  }
  function requestReset() {
    release();
    if (performance.now() < resetUntil) { newEngine(); return; }
    resetUntil = performance.now() + 4000; dom.reset.textContent = 'Подтвердить сброс';
    dom['control-info'].textContent = 'Повторное нажатие в течение 4 секунд сбросит мотор.';
    clearTimeout(resetTimer); resetTimer = setTimeout(() => { resetUntil = 0; dom.reset.textContent = 'Новый мотор'; dom['control-info'].textContent = ''; }, 4000);
  }
  dom.mute.addEventListener('click', () => { sound.mute(); if (!sound.muted) sound.start().then(audioStatus); audioStatus(); persist(); });
  dom.motion.addEventListener('click', () => { view.reduced = !view.reduced; audioStatus(); persist(); });
  dom.reset.addEventListener('click', requestReset);
  $('profile').addEventListener('change',e=>{model.setProfile(e.target.value);hud();persist();});
  $('performance-mode').addEventListener('change',e=>{view.setPerformance(e.target.value);view.cache.clear();targetFps=e.target.value==='eco'?30:60;view.render(model);persist();});
  $('volume').addEventListener('input',e=>{sound.setVolume(Number(e.target.value)/100);$('volume-value').textContent=e.target.value+'%';persist();});
  $('volume-value').textContent=Math.round(sound.volume*100)+'%';
  motionPreference.addEventListener?.('change', e => { if (e.matches) view.reduced = true; audioStatus(); });
  window.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) return;
    if (e.code === 'KeyM' && !e.repeat) { sound.mute(); audioStatus(); persist(); }
    if (e.code === 'KeyR' && !e.repeat) requestReset();
  });
  const suspend = () => { release(); last = 0; acc = 0; persist(); sound.suspend().catch(() => {}); };
  const resume = () => { last = 0; acc = 0; if(!inspecting) sound.resume().catch(() => {}); };
  document.addEventListener('visibilitychange', () => document.hidden ? suspend() : resume());
  window.addEventListener('pagehide', suspend); window.addEventListener('pageshow', resume);
  window.addEventListener('resize', () => { view.resize(); view.render(model); drawTrace(); });
  function events() {
    for (const e of model.drainEvents()) {
      if (e.type !== 'brakeHeat') { if (!['starter','keyOff','ignition','battery','startFailed'].includes(e.type)) view.event(e, model); sound.event(e); }
      if (e.type !== 'backfire' && e.type !== 'relay' && e.type !== 'impact') dom['event-log'].textContent = `${fmt(e.time)} / ${e.message}`;
    }
  }
  function journal() {
    const signature = model.log.map(e => `${e.time}:${e.type}`).join('|');
    if (signature === logSignature) return;
    logSignature = signature; dom.journal.replaceChildren();
    dom['journal-count'].textContent = String(model.log.length);
    for (const e of model.log) {
      const li = document.createElement('li'), time = document.createElement('time'), text = document.createElement('span');
      time.textContent = fmt(e.time); text.textContent = e.message; li.append(time, text); dom.journal.append(li);
    }
  }
  function hud() {
    dom.rpm.textContent = (Math.round(model.sensor.rpm/10)*10).toLocaleString('ru-RU'); dom.temp.textContent = model.coolantLevel>.01?Math.round(model.sensor.coolant):'СУХО';
    dom.water.textContent = Math.round(model.block) + '°'; dom['oil-temp'].textContent = model.oil>.01?Math.round(model.sensor.oil)+'°':'СУХО';
    dom.pressure.textContent = model.sensor.pressure.toFixed(1); dom.oil.textContent = model.oil.toFixed(2) + ' л';
    dom.active.textContent = model.activeCount; dom.clock.textContent = fmt(model.time);
    dom.temp.classList.toggle('hot', model.coolant > 110 || model.coolantLevel<.01); dom.pressure.classList.toggle('hot', model.pressure < 1);
    const stage = model.activeCount === 1 ? 5 : model.activeCount < 4 ? 4 : model.damage > .55 ? 3 : model.gasket > .17 ? 2 : model.block > 135 ? 1 : 0;
    const titles = ['Отступать некуда. Газуй.', 'Температура растёт.', 'Прокладка больше не держит.', 'Металл заговорил.', 'Работает на том, что осталось.', 'Один поршень. Ещё один оборот.'];
    const details = ['Газ разгоняет вал. Тормоз добавляет нагрузку и нагрев.', 'Масло и охлаждающая жидкость нагреваются вслед за блоком.', 'Пар из стыков, масло на корпусе. Нагрев ускоряет износ.', 'Вкладыши стучат. Крепления ослабли. Повреждения останутся.', 'Обломки гремят, оставшиеся цилиндры продолжают тянуть.', 'Пропуск. Толчок. Ещё оборот. Последний цилиндр не отключается.'];
    const states = ['ХОЛОСТОЙ ХОД', 'ТЕРМИЧЕСКАЯ НАГРУЗКА', 'ПРОРЫВ ПРОКЛАДКИ', 'СТУК ВКЛАДЫШЕЙ', 'РАБОТА С ПОВРЕЖДЕНИЯМИ', '1 / 4 · ВСЁ ЕЩЁ ЖИВ'];
    dom['event-title'].textContent = titles[stage]; dom['event-detail'].textContent = details[stage];
    dom['event-label'].textContent = stage === 5 ? 'РЕЖИМ ПОСЛЕДНЕГО ПОРШНЯ' : model.profile==='stress'?'СТРЕСС-ТЕСТ · ТЕПЛО И СТАРЕНИЕ ×8':'ОБЫЧНАЯ ЭКСПЛУАТАЦИЯ';
    dom.status.lastChild.textContent = model.brake > .04 ? 'ТОРМОЖЕНИЕ ВАЛА' : model.throttle > .05 && stage === 0 ? `ГАЗ ${Math.round(model.throttle * 100)}%` : states[stage];
    dom.caption.textContent = model.activeCount === 1 ? 'ВЫЖИВАНИЕ / ' + fmt(model.survivalTime) : 'ПОВРЕЖДЕНИЯ НЕ ЗАКАНЧИВАЮТ ИГРУ';
    dom.survival.textContent = model.activeCount === 1 ? 'НА ОДНОМ: ' + fmt(model.survivalTime) : 'ВСЕГДА ОСТАЁТСЯ ОДИН';
    dom.best.textContent = `${Math.round(model.peakRPM).toLocaleString('ru-RU')} rpm / ${Math.round(model.peakTemp)}°`;
    dom['pulse-state'].textContent = model.activeCount === 1 ? 'ОДИНОЧНЫЕ ИМПУЛЬСЫ' : model.activeCount < 4 ? 'НЕРАВНОМЕРНЫЙ ХОД' : 'ТОЛЧКИ КОЛЕНВАЛА';
    ticks.forEach((el, i) => el.classList.toggle('lit', i < Math.round(model.sensor.rpm / 6500 * 30)));
    model.cylinders.forEach((cy, i) => {
      const d = cylDom[i], isLast = cy.active && model.activeCount === 1;
      d.root.className = 'cyl' + (!cy.active ? ' off' : isLast ? ' last' : cy.wear > .35 ? ' worn' : '');
      d.name.textContent = !cy.active ? (cy.failure === 'ejected' ? 'ПОРШЕНЬ ВЫБИТ' : 'ОБРЫВ ШАТУНА') : isLast ? 'ДЕРЖИТСЯ' : cy.wear > .65 ? 'ПРОПУСКИ' : cy.wear > .35 ? 'ИЗНОС' : 'РАБОТАЕТ';
      d.bar.style.width = (cy.active ? cy.compression * 100 : 0) + '%';
      d.detail.textContent = cy.active ? `${Math.round(cy.compression * 100)}% · ${Math.round(cy.contact.wallTemp)}°` : 'ОТКЛЮЧЁН';
      d.root.setAttribute('aria-pressed',String(view.zoom>1&&!view.partFocus&&view.focus===i));
      d.root.setAttribute('aria-label', `Цилиндр ${i + 1}: ${d.name.textContent.toLowerCase()}, компрессия ${Math.round(cy.compression * 100)} процентов`);
    });
    const f=model.frictionNm; $('contact-telemetry').textContent=`ТРЕНИЕ (МОДЕЛЬ) · КОЛЬЦА ${f.rings.toFixed(1)} · ЮБКИ ${f.skirts.toFixed(1)} · ВКЛАДЫШИ ${f.bearings.toFixed(1)} · ГРМ ${f.valves.toFixed(1)} Н·м  /  ГБЦ ${Math.round(model.headTemp)}°C`;
    if(view.zoom>1&&!view.partFocus){const cy=model.cylinders[view.focus];$('inspection-note').textContent=`Цилиндр ${cy.id+1}: ${cy.cycle.name.toLowerCase()} · плёнка ${cy.contact.filmMicron.toFixed(1)} мкм · задиры ${Math.round(cy.contact.liner*100)}%`;}
    $('brake-power').textContent=model.brakeKW.toFixed(1); $('brake-torque').textContent=Math.round(model.torqueNm);
    $('exhaust-temp').textContent=Math.round(model.sensor.egt); $('manifold').textContent=model.manifoldBar.toFixed(2); $('fuel-rate').textContent=model.fuelLh.toFixed(1);
    const r=model.relay; $('relay-reading').textContent=`K1 · ${r.heatTrip?'ТЕРМОЗАЩИТА':r.closed?'ЗАМКНУТО':'РАЗОМКНУТО'} · ${r.voltage.toFixed(1)} V · ${r.current.toFixed(1)} A · контакты ${Math.round(r.contactTemp)}°C · катушка ${Math.round(r.coilTemp)}°C`;
    $('model-note').textContent=(model.profile==='stress'?'СТРЕСС ×8: НАГРЕВ И ИЗНОС УСКОРЕНЫ. ':'ОБЫЧНЫЙ ТЕМП НАГРЕВА. ')+'I4, РЕЙТИНГ 110 кВт / 192 Н·м. РАСЧЁТНЫЕ ДАННЫЕ. ПОСЛЕДНИЙ ЦИЛИНДР НЕ ОСТАНАВЛИВАЕТСЯ.';
    $('oil-flow').textContent=model.oilCircuit.q.toFixed(1);$('water-flow').textContent=model.waterCircuit.q.toFixed(1);
    $('inside-fragments').textContent=model.fragments.bodies.length;$('debris-torque').textContent=model.fragments.resistance.toFixed(1);
    $('oil-filter').textContent='Загрязнение '+Math.round(model.oilCircuit.filterLoad*100)+'%'+(model.oilCircuit.bypass>.02?' · байпас':'');
    $('vapour-state').textContent=model.waterCircuit.vapour>.08?'Газовая фаза '+Math.round(model.waterCircuit.vapour*100)+'%':'Без паровых пробок';
    $('jam-state').textContent=model.fragments.jamCount?'Зажато '+model.fragments.jamCount+' · трёт металл':'Зажатых нет';
    $('impact-count').textContent=model.fragments.impacts.toLocaleString('ru-RU')+' столкновений';
    journal(); dashboard.update(model); ignitionPanel.update(model);syncParts();
    if(view.partFocus&&view.zoom>1){
      const descriptions={radiator:`Радиатор: ${model.waterCircuit.cells[3].temp.toFixed(0)}°C · вентилятор ${Math.round(model.relay.fan*2200)} rpm`,pump:`ОЖ: ${model.waterCircuit.q.toFixed(1)} л/мин · паровая доля ${Math.round(model.waterCircuit.vapour*100)}%`,filter:`Масло: ${model.oilCircuit.q.toFixed(1)} л/мин · фильтр ${Math.round(model.oilCircuit.filterLoad*100)}% · перепуск ${Math.round(model.oilCircuit.bypass*100)}%`,exhaust:`Коллектор ${Math.round(model.exhaust.manifold)}°C · глушитель ${Math.round(model.exhaust.resonator)}°C · давление ${model.exhaust.pressure.toFixed(1)} kPa`,sump:`Осколков ${model.fragments.bodies.length} · зажато ${model.fragments.jamCount} · сопротивление ${model.fragments.resistance.toFixed(1)} Н·м`};
      $('inspection-note').textContent=descriptions[view.partFocus];
    }
    if (model.ignition !== 'running') {
      dom['event-title'].textContent = model.ignition === 'cranking' ? 'Стартер крутит. Ждём вспышку.' : model.rpm > 5 ? 'Вал останавливается.' : 'Ключ выключен. Мотор сохранён.';
      dom['event-detail'].textContent = model.startMessage;
      dom.status.lastChild.textContent = model.ignition === 'cranking' ? 'ПУСК СТАРТЕРОМ' : 'ЗАЖИГАНИЕ ВЫКЛЮЧЕНО';
    }
  }
  const traceCanvas = $('shaft-trace'), trace = traceCanvas.getContext('2d');
  document.querySelector('.diagnostic-fold').addEventListener('toggle', () => { hud(); drawTrace(); });
  function drawTrace() {
    if (!traceCanvas.clientWidth) return;
    const width = Math.round(traceCanvas.clientWidth * Math.min(devicePixelRatio || 1, 2)), height = 64;
    if (traceCanvas.width !== width) traceCanvas.width = width;
    if (traceCanvas.height !== height) traceCanvas.height = height;
    trace.clearRect(0, 0, width, height); trace.lineWidth = 1; trace.strokeStyle = '#343e31';
    trace.beginPath(); trace.moveTo(0, 52); trace.lineTo(width, 52); trace.stroke();
    trace.strokeStyle = model.activeCount === 1 ? '#d1af76' : '#a6b397'; trace.lineWidth = 1.7;
    trace.beginPath(); view.trace.forEach((v, i) => { const x = width - (view.trace.length - 1 - i) / 139 * width, y = 54 - clamp(v.speed / 40, 0, 1) * 48; if (!i) trace.moveTo(x, y); else trace.lineTo(x, y); }); trace.stroke();
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if(document.hidden || pausedForTest || inspecting){last=0;return;}
    if(last && now-last<1000/targetFps-.6)return;
    const raw=last?(now-last)/1000:1/60;last=now;
    const dt=Math.min(.05,Math.max(0,raw));skippedTime+=Math.max(0,raw-dt);
    frameMs=frameMs*.96+raw*1000*.04;
    const begin=performance.now();
    acc+=dt;let n=0;while(acc>=1/120&&n++<6){pedals.update(1/120); held=pedals.gas>.001; model.step(1/120,pedals.gas,pedals.brake);acc-=1/120;}if(acc>.05)acc=0;
    events();view.update(dt,model);view.render(model);
    const cost=performance.now()-begin;renderCost=renderCost*.95+cost*.05;
    hudTime+=dt;audioTime+=dt;saveTime+=dt;perfTime+=dt;
    if(audioTime>.045){audioTime=0;sound.update(model);}
    if(hudTime>.1){hudTime=0;hud();drawTrace();}
    if(saveTime>8){saveTime=0;persist();}
    if(perfTime>2){perfTime=0;
      if(view.performanceMode==='auto'){
        slowFrames=(renderCost>16||(targetFps===60&&frameMs>24))?slowFrames+1:Math.max(0,slowFrames-1);
        if(slowFrames>=2){if(view.pixelRatioLimit>1){view.pixelRatioLimit=1;view.resize();}view.quality=Math.max(.48,view.quality*.8);targetFps=30;slowFrames=0;}
      }
      $('performance-reading').textContent=`${Math.min(targetFps,Math.round(1000/Math.max(1,frameMs)))} FPS · ${renderCost.toFixed(1)} ms · ${view.performanceMode==='eco'?'ЭКО':view.performanceMode==='high'?'ДЕТАЛЬНО':'АВТО'}`;
    }
  }

  if (saved) { dom['event-log'].textContent = 'Мотор и история повреждений восстановлены.'; view.restoreDebris(model); }
  if (testing) window.__engineLab = {
    get ignitionPanel() { return ignitionPanel; }, get inspecting() { return inspecting; }, get engine() { return model; }, get renderer() { return view; }, get audio() { return sound; }, get held() { return pedals.held; }, get pedals() { return pedals; }, get dashboard() { return dashboard; }, get frameMs() { return frameMs; }, get renderCost(){return renderCost;}, get skippedTime(){return skippedTime;},
    pause(value = true) { pausedForTest = value; last = 0; },
    advance(seconds, gas = true, visual = false, brake = 0) {
      for (let n = 0; n < Math.round(seconds * 120); n++) { model.step(1 / 120, gas, brake); events(); if (visual && n % 2 === 0) view.update(1 / 60, model); }
      hud(); sound.update(model); view.render(model); drawTrace();
    },
    restore(data) { release(); model = Engine.restore(data); view.reset(); view.restoreDebris(model); logSignature = null; hud(); view.render(model); },
    stepInputs(seconds = 1) { for (let i=0; i<Math.round(seconds*120); i++) { pedals.update(1/120); model.step(1/120,pedals.gas,pedals.brake); } events(); hud(); view.render(model); },
    reset: newEngine
  };
  for(const item of Object.values(window.Piston.SAMPLES)){const a=document.createElement('a');a.href=item.source;a.target='_blank';a.rel='noopener';a.textContent=item.title+' / '+item.author+' / '+item.license;$('sample-credits').append(a);}
  $('reload-audio').addEventListener('click',()=>sound.start().then(()=>{audioStatus();sound.notify();}));
  audioStatus(); hud(); view.render(model); requestAnimationFrame(frame);
})();
