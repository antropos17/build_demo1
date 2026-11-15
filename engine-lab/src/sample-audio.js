/* Six credited CC0 recordings. Offline bytes are bundled with the project.
 * No synthesized engine fallback. Loops are persistent, one-shots are bounded,
 * asynchronous loading cannot resurrect a destroyed player or duplicate sources.
 */
(function(root){
'use strict';
const {clamp,SAMPLES,preparePCM}=root.Piston;
class MotorAudio{
 constructor(){
  this.ctx=null;this.master=null;this.engineBus=null;this.metalBus=null;this.ready=false;this.pending=null;this.muted=false;this.volume=.65;this.backend='recordings';
  this.buffers={};this.loops={};this.media={};this.sources=new Set();this.failures=[];this.status='6 записей встроены · звук с первого запуска';
  this.lastState=null;this.lastHit=-10;this.oldIgnition='off';this.counter=0;this.suspended=false;this.timer=null;this.underruns=0;
  this.mixSettings={engine:1,mechanical:.7};this.controllers=new Set();this.generation=0;this.destroyed=false;this.loaded=0;this.stats={};this.starterVoice=null;
 }
 start(){
  if(this.destroyed)return Promise.resolve(false);
  if(this.ready){this.suspended=false;return this.ctx.resume().then(()=>true).catch(()=>false);}
  if(!this.pending)this.pending=this.init().finally(()=>{this.pending=null;});return this.pending;
 }
 async init(){
  const generation=this.generation;
  try{
   const AC=root.AudioContext||root.webkitAudioContext;if(!AC){this.status='Web Audio недоступен';this.notify();return false;}
   if(!this.ctx){
    this.ctx=new AC({latencyHint:'interactive'});this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:this.volume;
    const compressor=this.ctx.createDynamicsCompressor();compressor.threshold.value=-10;compressor.knee.value=9;compressor.ratio.value=5;compressor.attack.value=.004;compressor.release.value=.14;
    const dc=this.ctx.createBiquadFilter();dc.type='highpass';dc.frequency.value=24;dc.Q.value=.5;
    this.master.connect(dc).connect(compressor).connect(this.ctx.destination);
    this.engineBus=this.ctx.createGain();this.metalBus=this.ctx.createGain();this.engineBus.connect(this.master);this.metalBus.connect(this.master);this.applyMix();
   }
   await this.ctx.resume();this.failures=[];this.status='Подготовка встроенных записей…';this.notify();
   await Promise.all(Object.entries(SAMPLES).map(async([name,s])=>{
    if(this.buffers[name])return;
    try{
     const encoded=root.Piston.EMBEDDED_AUDIO?.[name];let data;
     if(encoded){const raw=atob(encoded);data=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)data[i]=raw.charCodeAt(i);data=data.buffer;}
     else{
      const controller=new AbortController();this.controllers.add(controller);const timeout=setTimeout(()=>controller.abort(),7000);
      try{const response=await fetch(s.url,{signal:controller.signal,credentials:'omit'});if(!response.ok)throw Error('HTTP '+response.status);data=await response.arrayBuffer();if(data.byteLength>8e6)throw Error('Sample too large');}
      finally{clearTimeout(timeout);this.controllers.delete(controller);}
     }
     if(this.destroyed||generation!==this.generation)return;
     const decoded=await this.ctx.decodeAudioData(data);if(decoded.duration>30||!decoded.length)throw Error('Invalid duration');
     if(this.destroyed||generation!==this.generation)return;
     const channels=Array.from({length:decoded.numberOfChannels},(_,i)=>decoded.getChannelData(i));
     const prepared=preparePCM(channels,decoded.sampleRate,!!s.loop);
     const buffer=this.ctx.createBuffer(1,prepared.samples.length,decoded.sampleRate);buffer.copyToChannel(prepared.samples,0);this.buffers[name]=buffer;
     this.stats[name]={duration:buffer.duration,rms:prepared.rms,peak:prepared.peak,overlap:prepared.overlap,embedded:!!encoded};
     if(s.loop)this.loop(name);this.loaded=Object.keys(this.buffers).length;this.notify();
    }catch(error){if(!this.destroyed)this.failures.push(name);}
   }));
   if(this.destroyed||generation!==this.generation)return false;
   this.ready=!!(this.buffers.idle||this.buffers.load);
   this.status=this.ready?(this.failures.length?'Загружено '+this.loaded+'/6 · недоступно: '+this.failures.join(', '):'6/6 записей · офлайн · без синтеза'):'Аудио не загрузилось. Проверь файлы записей.';
   if(this.ready&&!this.timer)this.timer=setInterval(()=>this.mix(),40);
   // Loading is not an ignition event. Never replay an old starter after it caught.
   if(this.ready&&this.lastState?.ignition==='cranking')this.starterVoice=this.play('starter',.65,1);
   this.oldIgnition=this.lastState?.ignition||'off';this.mix();this.notify();return this.ready;
  }catch(error){if(!this.destroyed){this.status='Не удалось включить аудио';this.notify();}return false;}
 }
 notify(){
  const el=document.getElementById('recording-status');if(el)el.textContent=this.status;
  const count=document.getElementById('audio-loaded');if(count)count.textContent=this.loaded+'/6';
  if(this.onStatus)this.onStatus(this.status);
 }
 loop(name){
  if(this.loops[name]||!this.buffers[name]||this.destroyed)return;
  const src=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();
  src.buffer=this.buffers[name];src.loop=true;gain.gain.value=0;filter.type='lowpass';filter.frequency.value=2600;filter.Q.value=.5;
  src.connect(filter).connect(gain).connect(name==='rattle'?this.metalBus:this.engineBus);src.start();this.loops[name]={src,gain,filter};
 }
 setLoop(name,level,rate=1,cutoff=3600){
  const l=this.loops[name];if(!l||this.destroyed)return;const t=this.ctx.currentTime;
  l.gain.gain.setTargetAtTime(clamp(level,0,.9),t,.045);l.src.playbackRate.setTargetAtTime(clamp(rate,.62,1.9),t,.09);l.filter.frequency.setTargetAtTime(cutoff,t,.08);
 }
 stopVoice(voice){if(!voice)return;const now=this.ctx.currentTime;try{voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setTargetAtTime(0,now,.02);voice.source.stop(now+.12);}catch(_){} }
 play(name,volume=.3,rate=1){
  if(!this.ready||this.suspended||this.destroyed||this.sources.size>=12||!this.buffers[name])return null;
  const source=this.ctx.createBufferSource(),gain=this.ctx.createGain(),pan=this.ctx.createStereoPanner();source.buffer=this.buffers[name];source.playbackRate.value=clamp(rate,.7,1.4);gain.gain.value=clamp(volume,0,.8);pan.pan.value=name==='starter'?-.22:(this.counter++%5-2)*.13;
  source.connect(gain).connect(pan).connect(name==='starter'?this.engineBus:this.metalBus);
  const voice={source,gain,name};this.sources.add(voice);source.onended=()=>{source.disconnect();gain.disconnect();pan.disconnect();this.sources.delete(voice);if(this.starterVoice===voice)this.starterVoice=null;};source.start();return voice;
 }
 mix(){
  if(!this.ready||this.suspended||this.destroyed||!this.lastState||this.ctx.state!=='running')return;
  const m=this.lastState,run=m.ignition==='running',cut=m.revCut||m.overrun,rpm=m.rpm,t=m.throttle,load=clamp(m.engineLoad||t*.55,0,1);
  const blend=clamp((rpm-1100)/2600,0,1),rough=clamp(m.fragments?.scrape||0,0,1),on=run?(cut?.07:1):0;
  let idle=Math.cos(blend*Math.PI/2)*(.42+load*.16)*on,loaded=Math.sin(blend*Math.PI/2)*(.40+load*.33)*on;
  if(!this.buffers.idle){loaded+=idle;idle=0;}if(!this.buffers.load){idle+=loaded;loaded=0;}
  const missing=(4-m.activeCount)/3,flutter=1-missing*.23*(.5+.5*Math.sin(this.ctx.currentTime*rpm/120*TAU()));
  this.setLoop('idle',idle*flutter,clamp(rpm/1200,.65,1.65),1600+t*2300+load*400);
  this.setLoop('load',loaded*flutter,clamp(rpm/3500,.65,1.85),2300+t*4100+load*500);
  this.setLoop('rattle',(rough*.14+m.damage*.035)*(run?1:0),.85+clamp(rpm/6500,0,1)*.45,1800+rough*1300);
  if(run&&m.fragments?.jamCount&&this.ctx.currentTime-this.lastHit>.3){this.lastHit=this.ctx.currentTime;this.play('impact',.07+rough*.1,.79+(this.counter%4)*.055);}
 }
 update(m){
  this.lastState=m;
  if(this.ready){
   if(m.ignition==='cranking'&&this.oldIgnition!=='cranking')this.starterVoice=this.play('starter',.65);
   if(m.ignition!=='cranking'&&this.starterVoice){this.stopVoice(this.starterVoice);this.starterVoice=null;}
   this.oldIgnition=m.ignition;this.mix();
  }
 }
 event(e){
  if(['relay','starter','keyOff'].includes(e.type))this.play('click',.18);
  else if(['cylinder','jam','metal','cover','backfire'].includes(e.type))this.play('impact',e.type==='cylinder'?.52:.22,.8+(this.counter%3)*.1);
  else if(e.type==='impact'&&this.ctx&&this.ctx.currentTime-this.lastHit>.11){this.lastHit=this.ctx.currentTime;this.play('click',clamp(e.level||.15,.06,.32),.85+(this.counter%5)*.08);}
 }
 hit(level=1){this.play('impact',level*.4);}
 applyMix(){if(!this.ctx)return;const at=this.ctx.currentTime;this.engineBus?.gain.setTargetAtTime(this.mixSettings.engine,at,.05);this.metalBus?.gain.setTargetAtTime(this.mixSettings.mechanical,at,.05);}
 setMix(channel,value){if(!['engine','mechanical'].includes(channel))return;this.mixSettings[channel]=clamp(Number(value)||0,0,1);this.applyMix();}
 setVolume(v){this.volume=clamp(Number(v)||0,0,1);if(this.master)this.master.gain.setTargetAtTime(this.muted?0:this.volume,this.ctx.currentTime,.04);}
 mute(){this.muted=!this.muted;this.setVolume(this.volume);return this.muted;}
 async suspend(){this.suspended=true;if(this.ctx?.state==='running')await this.ctx.suspend();}
 async resume(){if(this.destroyed)return;this.suspended=false;if(this.ctx?.state==='suspended')await this.ctx.resume();this.mix();}
 destroy(){
  this.destroyed=true;this.generation++;clearInterval(this.timer);this.timer=null;for(const c of this.controllers)c.abort();this.controllers.clear();
  for(const l of Object.values(this.loops)){try{l.src.stop();}catch(_){}l.src.disconnect();l.gain.disconnect();l.filter.disconnect();}
  for(const v of this.sources){try{v.source.stop();}catch(_){}v.source.disconnect();v.gain.disconnect();}this.sources.clear();this.loops={};this.starterVoice=null;
  if(this.ctx&&this.ctx.state!=='closed')this.ctx.close().catch(()=>{});this.ready=false;
 }
}
function TAU(){return Math.PI*2;}
root.Piston.MotorAudio=MotorAudio;
})(window);
