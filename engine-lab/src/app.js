(function(){
'use strict';
const {Engine,Renderer,MotorAudio}=window.Piston;
const $=id=>document.getElementById(id),canvas=$('engine'),button=$('gas');
const storageKey='last-piston:survivor:v1';const testing=new URLSearchParams(location.search).has('test');
let model=new Engine(),saved=false;
try{if(!testing){const raw=localStorage.getItem(storageKey);if(raw){model=Engine.restore(JSON.parse(raw));saved=true;}}}catch(_){}
const view=new Renderer(canvas),sound=new MotorAudio();
let held=false,pointer=null,last=0,acc=0,hudTime=0,saveTime=0,frameMs=16,alive=true;
const dom={rpm:$('rpm'),temp:$('temp'),water:$('water'),oilTemp:$('oil-temp'),pressure:$('pressure'),oil:$('oil'),active:$('active'),clock:$('clock'),status:$('status'),caption:$('caption'),label:$('event-label'),title:$('event-title'),detail:$('event-detail'),survival:$('survival'),log:$('event-log'),audio:$('audio-status')};
const cylDom=Array.from({length:4},(_,i)=>({root:$('cyl'+i),name:$('cyl'+i).querySelector('b'),bar:$('cyl'+i).querySelector('i')}));
for(let i=0;i<30;i++){const tick=document.createElement('i');if(i>23)tick.className='high';$('rpm-ticks').appendChild(tick)}
const ticks=[...$('rpm-ticks').children];
const fmt=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
function setHeld(v){held=Boolean(v);button.classList.toggle('pressed',held);button.setAttribute('aria-pressed',String(held));if(held){sound.start().then(ok=>{dom.audio.textContent=ok?'ЗВУК ДВИГАТЕЛЯ АКТИВЕН · M ВЫКЛЮЧИТЬ':'ЗВУК НЕДОСТУПЕН В ЭТОМ БРАУЗЕРЕ';});}}
function release(){pointer=null;setHeld(false);}
button.addEventListener('pointerdown',e=>{if(pointer!==null)return;e.preventDefault();pointer=e.pointerId;try{button.setPointerCapture(e.pointerId)}catch(_){}setHeld(true)});
for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,e=>{if(pointer===e.pointerId)release()});
window.addEventListener('pointerup',e=>{if(pointer===e.pointerId)release()});
button.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('keydown',e=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||e.target.isContentEditable)return;
  if(['Space','ArrowUp'].includes(e.code)||(e.code==='Enter'&&e.target===button)){e.preventDefault();if(!e.repeat)setHeld(true);}
  if(e.code==='KeyM'&&!e.repeat){const muted=sound.mute();dom.audio.textContent=muted?'ЗВУК ВЫКЛЮЧЕН · M ВКЛЮЧИТЬ':'ЗВУК ВКЛЮЧЕН';}
  if(e.code==='KeyR'&&!e.repeat){release();model=new Engine();view.smoke=[];view.drops=[];view.debris=[];view.stains=[];view.impulse=0;dom.log.textContent='Новый мотор. Тест начат заново.';persist();hud();}
});
window.addEventListener('keyup',e=>{if(['Space','ArrowUp','Enter'].includes(e.code))release()});
window.addEventListener('blur',release);
document.addEventListener('visibilitychange',()=>{last=0;acc=0;if(document.hidden){release();persist();sound.suspend().catch(()=>{});}else sound.resume().catch(()=>{});});
window.addEventListener('pagehide',()=>{release();persist();sound.suspend().catch(()=>{});});
window.addEventListener('pageshow',()=>{last=0;acc=0;sound.resume().catch(()=>{});});
window.addEventListener('resize',()=>view.resize());
function persist(){if(testing)return;try{localStorage.setItem(storageKey,JSON.stringify(model.snapshot()));}catch(_){} }
function events(){for(const e of model.drainEvents()){view.event(e,model);if(['cylinder','last','metal','gasket'].includes(e.type))sound.hit(e.type==='cylinder'?1.5:.5);dom.log.textContent=`${fmt(e.time)} / ${e.message}`;}}
function hud(){
  dom.rpm.textContent=Math.round(model.rpm).toLocaleString('ru-RU');dom.temp.textContent=Math.round(model.block);dom.water.textContent=Math.round(model.coolant)+'°';dom.oilTemp.textContent=Math.round(model.oilTemp)+'°';
  dom.pressure.textContent=model.pressure.toFixed(1);dom.oil.textContent=model.oil.toFixed(1)+' л';dom.active.textContent=model.activeCount;dom.clock.textContent=fmt(model.time);
  dom.temp.classList.toggle('hot',model.block>135);dom.pressure.classList.toggle('hot',model.pressure<1);
  const stage=model.activeCount===1?5:model.activeCount<4?4:model.damage>.55?3:model.gasket>.17?2:model.block>135?1:0;
  const titles=['Отступать некуда. Газуй.','Температура растёт.','Прокладка больше не держит.','Металл заговорил.','Меньше поршней. Больше характера.','Последний поршень. Не последний вздох.'];
  const details=['Держи газ. Отпусти, чтобы снизить нагрузку и охладить мотор.','Нагрев блока опережает температуру масла и охлаждающей жидкости.','Уходит масло, вырывается пар. Отпусти газ, чтобы снять нагрузку.','Задиры, стук вкладышей, ослабшие болты. Износ уже не отменить.','Оборванные шатуны не мешают оставшимся цилиндрам вращать коленвал.','Он троит, дымит и теряет компрессию. Но продолжает крутить вал.'];
  const states=['РОВНЫЙ ХОЛОСТОЙ ХОД','ТЕРМИЧЕСКАЯ НАГРУЗКА','ПРОРЫВ ПРОКЛАДКИ','СТУК ВКЛАДЫШЕЙ','РАБОТА С ПОВРЕЖДЕНИЯМИ','ОДИН ЦИЛИНДР. ВСЁ ЕЩЁ ЖИВ.'];
  dom.title.textContent=titles[stage];dom.detail.textContent=details[stage];dom.label.textContent=stage===5?'РЕЖИМ ПОСЛЕДНЕГО ПОРШНЯ':'ИСПЫТАНИЕ НА ВЫНОСЛИВОСТЬ';
  dom.status.lastChild.textContent=held&&stage===0?'ПОЛНАЯ НАГРУЗКА':states[stage];dom.caption.textContent=stage===5?'НЕ ОСТАНАВЛИВАЕТСЯ. НЕ ВОССТАНАВЛИВАЕТСЯ.':stage>2?'ПОВРЕЖДЕНИЯ НЕ ЗАКАНЧИВАЮТ ИГРУ.':'ЧЕТЫРЕ ЦИЛИНДРА. ОДНА КНОПКА.';
  dom.survival.textContent=model.activeCount===1?'НА ОДНОМ: '+fmt(model.survivalTime):model.activeCount+' ЦИЛИНДРА В РАБОТЕ';
  ticks.forEach((el,i)=>el.classList.toggle('lit',i<Math.round(model.rpm/7250*30)));
  model.cylinders.forEach((cy,i)=>{const d=cylDom[i],isLast=cy.active&&model.activeCount===1;d.root.className='cyl'+(!cy.active?' off':isLast?' last':cy.wear>.35?' worn':'');d.name.textContent=!cy.active?(cy.failure==='ejected'?'ПОРШЕНЬ ВЫБИТ':'ОБРЫВ ШАТУНА'):isLast?'ДЕРЖИТСЯ':cy.wear>.65?'ПРОПУСКИ':cy.wear>.35?'ИЗНОС':'РАБОТАЕТ';d.bar.style.width=(cy.active?cy.compression*100:0)+'%';d.root.setAttribute('aria-label',`Цилиндр ${i+1}: ${d.name.textContent.toLowerCase()}, компрессия ${Math.round(cy.compression*100)} процентов`);});
}
function frame(now){if(!alive)return;requestAnimationFrame(frame);if(document.hidden)return;
  const raw=last?(now-last)/1000:1/60;last=now;const dt=Math.min(.06,Math.max(0,raw));frameMs=frameMs*.98+raw*1000*.02;
  acc+=dt;let n=0;while(acc>=1/120&&n++<8){model.step(1/120,held);acc-=1/120;}
  events();view.update(dt,model);view.render(model);
  hudTime+=dt;saveTime+=dt;if(hudTime>.1){hudTime=0;hud();sound.update(model);}if(saveTime>3){saveTime=0;persist();if(frameMs>33)view.quality=Math.max(.4,view.quality*.9);}
}
if(saved)dom.log.textContent='Сохранённый мотор вернулся. Повреждения на месте.';
if(testing)window.__engineLab={get engine(){return model},get renderer(){return view},get audio(){return sound},get held(){return held},get frameMs(){return frameMs},advance(seconds,gas=true){for(let n=0;n<Math.round(seconds*120);n++){model.step(1/120,gas);events();}hud();sound.update(model);view.render(model);},reset(){release();model=new Engine();view.smoke=[];view.debris=[];view.drops=[];view.stains=[];hud();}};
hud();view.render(model);requestAnimationFrame(frame);
})();
