(function () {
  'use strict';
  const { Engine, Renderer, MotorAudio, clamp } = window.Piston;
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
  let pointer = null, keys = new Set(), held = false, last = 0, acc = 0, hudTime = 0, saveTime = 0;
  let frameMs = 16, pausedForTest = false, resetUntil = 0, resetTimer = null, logSignature = null;
  const dom = Object.fromEntries(['rpm', 'temp', 'water', 'oil-temp', 'pressure', 'oil', 'active', 'clock', 'status', 'caption',
    'event-label', 'event-title', 'event-detail', 'survival', 'event-log', 'audio-status', 'best', 'pulse-state', 'journal',
    'journal-count', 'mute', 'motion', 'reset', 'control-info'].map(id => [id, $(id)]));
  const cylDom = Array.from({ length: 4 }, (_, i) => ({ root: $('cyl' + i), name: $('cyl' + i).querySelector('b'), bar: $('cyl' + i).querySelector('i'), detail: $('cyl-detail' + i) }));
  for (let i = 0; i < 30; i++) { const tick = document.createElement('i'); if (i > 23) tick.className = 'high'; $('rpm-ticks').appendChild(tick); }
  const ticks = [...$('rpm-ticks').children];
  const fmt = t => { const s = Math.max(0, Math.floor(t)); return (s >= 3600 ? String(Math.floor(s / 3600)).padStart(2, '0') + ':' : '') + String(Math.floor(s / 60) % 60).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  function audioStatus() {
    dom['audio-status'].textContent = sound.muted ? 'ЗВУК ВЫКЛЮЧЕН' : sound.ready ? 'ЗВУК ДВИГАТЕЛЯ АКТИВЕН' : 'ЗВУК С ПЕРВОГО НАЖАТИЯ';
    dom.mute.textContent = sound.muted ? 'Включить звук' : 'Выключить звук'; dom.mute.setAttribute('aria-pressed', String(!sound.muted));
    dom.motion.textContent = view.reduced ? 'Вернуть тряску' : 'Уменьшить тряску'; dom.motion.setAttribute('aria-pressed', String(view.reduced));
  }
  function syncInput() {
    const next = pointer !== null || keys.size > 0, changed = next !== held; held = next;
    button.classList.toggle('pressed', held); button.setAttribute('aria-pressed', String(held));
    if (held && changed) sound.start().then(ok => { audioStatus(); if (!ok) dom['audio-status'].textContent = 'ЗВУК НЕДОСТУПЕН'; });
  }
  function release() { pointer = null; keys.clear(); syncInput(); }
  button.addEventListener('pointerdown', e => {
    if (pointer !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault(); pointer = e.pointerId;
    try { button.setPointerCapture(e.pointerId); } catch (_) {}
    syncInput();
  });
  const releasePointer = e => { if (pointer === e.pointerId) { pointer = null; syncInput(); } };
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, releasePointer);
  window.addEventListener('pointerup', releasePointer); window.addEventListener('pointercancel', releasePointer);
  button.addEventListener('contextmenu', e => e.preventDefault());
  function persist() {
    if (testing) return;
    try { localStorage.setItem(storageKey, JSON.stringify(model.snapshot())); localStorage.setItem(prefsKey, JSON.stringify({ muted: sound.muted, reduced: view.reduced })); } catch (_) {}
  }
  function newEngine() {
    release(); model = new Engine(); view.reset(); sound.update(model); logSignature = null; resetUntil = 0;
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
  motionPreference.addEventListener?.('change', e => { if (e.matches) view.reduced = true; audioStatus(); });
  window.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) return;
    const otherControl = e.target.closest?.('button,summary') && e.target !== button;
    if (!otherControl && (['Space', 'ArrowUp'].includes(e.code) || (e.code === 'Enter' && e.target === button))) { e.preventDefault(); keys.add(e.code); syncInput(); }
    if (e.code === 'KeyM' && !e.repeat) { sound.mute(); audioStatus(); persist(); }
    if (e.code === 'KeyR' && !e.repeat) requestReset();
  });
  window.addEventListener('keyup', e => { if (keys.delete(e.code)) syncInput(); });
  window.addEventListener('blur', release);
  const suspend = () => { release(); last = 0; acc = 0; persist(); sound.suspend().catch(() => {}); };
  const resume = () => { last = 0; acc = 0; sound.resume().catch(() => {}); };
  document.addEventListener('visibilitychange', () => document.hidden ? suspend() : resume());
  window.addEventListener('pagehide', suspend); window.addEventListener('pageshow', resume);
  window.addEventListener('resize', () => { view.resize(); view.render(model); drawTrace(); });
  function events() {
    for (const e of model.drainEvents()) {
      view.event(e, model); sound.event(e);
      if (e.type !== 'backfire') dom['event-log'].textContent = `${fmt(e.time)} / ${e.message}`;
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
    dom.rpm.textContent = Math.round(model.rpm).toLocaleString('ru-RU'); dom.temp.textContent = Math.round(model.block);
    dom.water.textContent = Math.round(model.coolant) + '°'; dom['oil-temp'].textContent = Math.round(model.oilTemp) + '°';
    dom.pressure.textContent = model.pressure.toFixed(1); dom.oil.textContent = model.oil.toFixed(1) + ' л';
    dom.active.textContent = model.activeCount; dom.clock.textContent = fmt(model.time);
    dom.temp.classList.toggle('hot', model.block > 135); dom.pressure.classList.toggle('hot', model.pressure < 1);
    const stage = model.activeCount === 1 ? 5 : model.activeCount < 4 ? 4 : model.damage > .55 ? 3 : model.gasket > .17 ? 2 : model.block > 135 ? 1 : 0;
    const titles = ['Отступать некуда. Газуй.', 'Температура растёт.', 'Прокладка больше не держит.', 'Металл заговорил.', 'Работает на том, что осталось.', 'Один поршень. Ещё один оборот.'];
    const details = ['Держи газ. Отпусти, чтобы снять нагрузку.', 'Масло и охлаждающая жидкость нагреваются вслед за блоком.', 'Пар из стыков, масло на корпусе. Нагрев ускоряет износ.', 'Вкладыши стучат. Крепления ослабли. Повреждения останутся.', 'Обломки гремят, оставшиеся цилиндры продолжают тянуть.', 'Пропуск. Толчок. Ещё оборот. Последний цилиндр не отключается.'];
    const states = ['ХОЛОСТОЙ ХОД', 'ТЕРМИЧЕСКАЯ НАГРУЗКА', 'ПРОРЫВ ПРОКЛАДКИ', 'СТУК ВКЛАДЫШЕЙ', 'РАБОТА С ПОВРЕЖДЕНИЯМИ', '1 / 4 · ВСЁ ЕЩЁ ЖИВ'];
    dom['event-title'].textContent = titles[stage]; dom['event-detail'].textContent = details[stage];
    dom['event-label'].textContent = stage === 5 ? 'РЕЖИМ ПОСЛЕДНЕГО ПОРШНЯ' : 'ИСПЫТАНИЕ НА ВЫНОСЛИВОСТЬ';
    dom.status.lastChild.textContent = held && stage === 0 ? 'ПОЛНАЯ НАГРУЗКА' : states[stage];
    dom.caption.textContent = model.activeCount === 1 ? 'ВЫЖИВАНИЕ / ' + fmt(model.survivalTime) : 'ПОВРЕЖДЕНИЯ НЕ ЗАКАНЧИВАЮТ ИГРУ';
    dom.survival.textContent = model.activeCount === 1 ? 'НА ОДНОМ: ' + fmt(model.survivalTime) : 'ВСЕГДА ОСТАЁТСЯ ОДИН';
    dom.best.textContent = `${Math.round(model.peakRPM).toLocaleString('ru-RU')} rpm / ${Math.round(model.peakTemp)}°`;
    dom['pulse-state'].textContent = model.activeCount === 1 ? 'ОДИНОЧНЫЕ ИМПУЛЬСЫ' : model.activeCount < 4 ? 'НЕРАВНОМЕРНЫЙ ХОД' : 'ТОЛЧКИ КОЛЕНВАЛА';
    ticks.forEach((el, i) => el.classList.toggle('lit', i < Math.round(model.rpm / 7250 * 30)));
    model.cylinders.forEach((cy, i) => {
      const d = cylDom[i], isLast = cy.active && model.activeCount === 1;
      d.root.className = 'cyl' + (!cy.active ? ' off' : isLast ? ' last' : cy.wear > .35 ? ' worn' : '');
      d.name.textContent = !cy.active ? (cy.failure === 'ejected' ? 'ПОРШЕНЬ ВЫБИТ' : 'ОБРЫВ ШАТУНА') : isLast ? 'ДЕРЖИТСЯ' : cy.wear > .65 ? 'ПРОПУСКИ' : cy.wear > .35 ? 'ИЗНОС' : 'РАБОТАЕТ';
      d.bar.style.width = (cy.active ? cy.compression * 100 : 0) + '%';
      d.detail.textContent = cy.active ? `${Math.round(cy.compression * 100)}% · ${Math.round(cy.temp)}°` : 'ОТКЛЮЧЁН';
      d.root.setAttribute('aria-label', `Цилиндр ${i + 1}: ${d.name.textContent.toLowerCase()}, компрессия ${Math.round(cy.compression * 100)} процентов`);
    });
    journal();
  }
  const traceCanvas = $('shaft-trace'), trace = traceCanvas.getContext('2d');
  function drawTrace() {
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
    if (document.hidden || pausedForTest) { last = 0; return; }
    const raw = last ? (now - last) / 1000 : 1 / 60; last = now;
    const dt = Math.min(.06, Math.max(0, raw)); frameMs = frameMs * .98 + raw * 1000 * .02;
    acc += dt; let n = 0; while (acc >= 1 / 120 && n++ < 8) { model.step(1 / 120, held); acc -= 1 / 120; }
    events(); view.update(dt, model); view.render(model); drawTrace();
    hudTime += dt; saveTime += dt;
    if (hudTime > .08) { hudTime = 0; hud(); sound.update(model); }
    if (saveTime > 3) { saveTime = 0; persist(); if (frameMs > 33) view.quality = Math.max(.4, view.quality * .9); }
  }
  if (saved) { dom['event-log'].textContent = 'Мотор и история повреждений восстановлены.'; view.restoreDebris(model); }
  if (testing) window.__engineLab = {
    get engine() { return model; }, get renderer() { return view; }, get audio() { return sound; }, get held() { return held; }, get frameMs() { return frameMs; },
    pause(value = true) { pausedForTest = value; last = 0; },
    advance(seconds, gas = true, visual = false) {
      for (let n = 0; n < Math.round(seconds * 120); n++) { model.step(1 / 120, gas); events(); if (visual && n % 2 === 0) view.update(1 / 60, model); }
      hud(); sound.update(model); view.render(model); drawTrace();
    },
    restore(data) { release(); model = Engine.restore(data); view.reset(); view.restoreDebris(model); logSignature = null; hud(); view.render(model); },
    reset: newEngine
  };
  audioStatus(); hud(); view.render(model); requestAnimationFrame(frame);
})();
