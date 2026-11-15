(function(root){
'use strict';
class IgnitionPanel {
 constructor(action){this.action=action;this.cache=new Map();this.last=new Map();document.getElementById('ignition-key').addEventListener('click',()=>action('key'));document.getElementById('battery-boost').addEventListener('click',()=>action('boost'));}
 text(id,value){if(this.last.get(id)===value)return;let el=this.cache.get(id);if(!el){el=document.getElementById(id);this.cache.set(id,el);}el.textContent=value;this.last.set(id,value);}
 update(m){const e=m.electrical,state=m.ignition,running=state==='running',cranking=state==='cranking',coasting=!running&&!cranking&&m.rpm>5;
  const b=document.getElementById('ignition-key');b.dataset.state=state;b.setAttribute('aria-label',running?'Выключить зажигание':cranking?'Прервать запуск':'Запустить двигатель');
  this.text('key-action',running?'ЗАГЛУШИТЬ':cranking?'ОТМЕНА':'ЗАПУСК');this.text('key-state',running?'ЗАЖИГАНИЕ ВКЛЮЧЕНО':cranking?'ПРОКРУТКА СТАРТЕРА':coasting?'ВАЛ ОСТАНАВЛИВАЕТСЯ':'ЗАЖИГАНИЕ ВЫКЛЮЧЕНО');
  this.text('start-message',m.startMessage);this.text('battery-charge',Math.round(e.soc*100)+'%');this.text('battery-current',(e.current>0?'+':'')+e.current.toFixed(1));this.text('alternator-current',e.alternatorA.toFixed(1));this.text('starter-current',Math.round(e.starterA));this.text('starter-heat',Math.round(e.starterTemp)+' °C');
  this.text('charge-status',e.current>.5?'АКБ ЗАРЯЖАЕТСЯ':e.current<-.5?'ПИТАНИЕ ОТ АКБ':'РЕЖИМ ОЖИДАНИЯ');
  document.getElementById('battery-boost').disabled=state!=='off';
  document.getElementById('lamp-charge').classList.toggle('on',!running||e.current<-1);
  document.getElementById('battery-meter').style.transform=`scaleX(${e.soc.toFixed(3)})`;

 }
}
root.Piston.IgnitionPanel=IgnitionPanel;
})(window);
