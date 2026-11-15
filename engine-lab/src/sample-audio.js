/* Recorded engines and mechanical samples. The old DSP is NOT used as a fallback.
 * Stable loop nodes + gain/pitch crossfades; bounded one-shots. Graceful media fallback
 * for hosts without CORS; network errors are visible, never replaced with fake audio.
 */
(function(root){
'use strict';
const {clamp,SAMPLES}=root.Piston;
class MotorAudio{
 constructor(){this.ctx=null;this.master=null;this.ready=false;this.pending=null;this.muted=false;this.volume=.65;this.backend='recordings';this.buffers={};this.loops={};this.media={};this.sources=new Set();this.failures=[];this.status='Записи CC0: загрузка при запуске';this.lastState=null;this.lastHit=-10;this.oldIgnition='off';this.counter=0;this.suspended=false;this.timer=null;this.envelopePhase=0;this.underruns=0;}
 async start(){if(this.ready){if(this.ctx?.state==='suspended')await this.ctx.resume();this.suspended=false;return true;}if(this.pending)return this.pending;
  this.pending=this.init().finally(()=>{this.pending=null;});return this.pending;
 }
 async init(){
  try{
   this.status='Загружаются записи CC0…';this.notify();
   const AC=root.AudioContext||root.webkitAudioContext;if(!AC){this.status='Web Audio недоступен';return false;}
   if(!this.ctx){this.ctx=new AC({latencyHint:'interactive'});this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:this.volume;const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=10;limiter.ratio.value=6;limiter.attack.value=.005;limiter.release.value=.15;this.master.connect(limiter).connect(this.ctx.destination);}
   await this.ctx.resume();this.failures=[];
   await Promise.all(Object.entries(SAMPLES).map(async([name,s])=>{if(this.buffers[name]||this.media[name])return;
    try{
     let data;const embedded=root.Piston.EMBEDDED_AUDIO?.[name];
     if(embedded){const raw=atob(embedded);data=Uint8Array.from(raw,c=>c.charCodeAt(0)).buffer;}
     else {const response=await fetch(s.url,{signal:AbortSignal.timeout(9000),credentials:'omit'});if(!response.ok)throw new Error('HTTP '+response.status);data=await response.arrayBuffer();if(data.byteLength>8e6)throw new Error('Sample too large');}
     const buffer=await this.ctx.decodeAudioData(data);if(!buffer.length||buffer.duration>30)throw new Error('Invalid sample duration');
     this.buffers[name]=this.prepare(buffer,!!s.loop);if(s.loop)this.loop(name);
    }catch(_){
     // HTMLMediaElement can play an ordinary cross-origin WAV without routing it
     // through a CORS-restricted MediaElementAudioSourceNode.
     if(!root.Piston.EMBEDDED_AUDIO?.[name]){
      try{const a=new Audio(s.url);a.preload='auto';a.loop=!!s.loop;a.volume=0;
       await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Sample timeout')),4500);a.oncanplay=()=>{clearTimeout(timer);resolve();};a.onerror=()=>{clearTimeout(timer);reject(new Error('Sample unreachable'));};a.load();});
       a.oncanplay=a.onerror=null;this.media[name]=a;
       if(s.loop)await a.play().catch(()=>{});
      }catch(_){this.failures.push(name);}
     }else this.failures.push(name);
    }
   }));
   this.ready=!!(this.buffers.idle||this.buffers.load||this.media.idle||this.media.load);
   this.status=this.ready?(this.failures.length?'Записи загружены частично: '+this.failures.join(', '):'Реальные записи · 6 источников CC0'):'Аудио не загрузилось. Нужна сеть или встроенный аудиопак.';
   if(this.ready&&!this.timer)this.timer=setInterval(()=>this.mix(),40);if(this.lastState)this.update(this.lastState);this.notify();return this.ready;
  }catch(_){this.status='Не удалось включить аудио';this.notify();return false;}
 }
 notify(){const el=document.getElementById('recording-status');if(el)el.textContent=this.status;}
 prepare(input,loop){
  const n=input.length,b=this.ctx.createBuffer(1,n,input.sampleRate),d=b.getChannelData(0);let sum=0,peak=0;
  for(let i=0;i<n;i++){let v=0;for(let j=0;j<input.numberOfChannels;j++)v+=input.getChannelData(j)[i]/input.numberOfChannels;d[i]=v;sum+=v*v;peak=Math.max(peak,Math.abs(v));}
  const gain=Math.min(3,.16/Math.max(.0001,Math.sqrt(sum/n)),.85/Math.max(.001,peak));for(let i=0;i<n;i++)d[i]*=gain;
  if(loop){const fade=Math.min(Math.floor(n*.12),Math.round(input.sampleRate*.035));
   // A cyclic overlap, not a fade to silence, prevents boundary clicks.
   for(let i=0;i<fade;i++){const t=i/fade;d[n-fade+i]=d[n-fade+i]*(1-t)+d[i]*t;}
   const out=this.ctx.createBuffer(1,n-fade,input.sampleRate);out.getChannelData(0).set(d.subarray(fade));return out;
  }return b;
 }
 loop(name){if(this.loops[name]||!this.buffers[name])return;const src=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();src.buffer=this.buffers[name];src.loop=true;gain.gain.value=0;filter.type='lowpass';filter.frequency.value=3600;src.connect(filter).connect(gain).connect(this.master);src.start();this.loops[name]={src,gain,filter};}
 setLoop(name,gain,rate=1,cutoff=3600){const l=this.loops[name],t=this.ctx.currentTime;if(l){l.gain.gain.setTargetAtTime(gain,t,.045);l.src.playbackRate.setTargetAtTime(clamp(rate,.6,2.4),t,.09);l.filter.frequency.setTargetAtTime(cutoff,t,.07);}const a=this.media[name];if(a){a.volume=clamp(gain*this.volume*(this.muted||this.suspended?0:1),0,1);a.playbackRate=clamp(rate,.6,2.4);if(gain>.002&&a.paused&&!this.suspended)a.play().catch(()=>{});}}
 play(name,volume=.3,rate=1){if(!this.ready||this.suspended)return;const b=this.buffers[name];if(b&&this.sources.size<10){const s=this.ctx.createBufferSource(),g=this.ctx.createGain();s.buffer=b;s.playbackRate.value=clamp(rate,.65,1.6);g.gain.value=clamp(volume,0,.8);s.connect(g).connect(this.master);s.start();this.sources.add(s);s.onended=()=>{s.disconnect();g.disconnect();this.sources.delete(s);};}else if(this.media[name]&&!SAMPLES[name].loop){const a=this.media[name];a.currentTime=0;a.volume=clamp(volume*this.volume*(this.muted?0:1),0,.8);a.playbackRate=rate;a.play().catch(()=>{});}}
 mix(){if(!this.ready||this.suspended||!this.lastState||this.ctx.state!=='running')return;const m=this.lastState,run=m.ignition==='running',cut=m.revCut||m.overrun,rpm=m.rpm,t=m.throttle;
  const blend=clamp((rpm-1150)/2300,0,1),rough=clamp(m.fragments?.scrape||0,0,1),on=run?(cut?.08:1):0;
  // Remove artificial sawtooth exhaust. Recorded layers supply the full engine body.
  let idle=Math.cos(blend*Math.PI/2)*(.28+t*.13)*on,load=Math.sin(blend*Math.PI/2)*(.28+t*.32)*on;
  if(!this.buffers.idle&&!this.media.idle){load+=idle;idle=0;}if(!this.buffers.load&&!this.media.load){idle+=load;load=0;}
  const missing=(4-m.activeCount)/3,flutter=1-missing*.28*(.5+.5*Math.sin(this.ctx.currentTime*rpm/120*Math.PI*2));
  this.setLoop('idle',idle*flutter,clamp(rpm/1100,.65,1.75),1300+t*2200);
  this.setLoop('load',load*flutter,clamp(rpm/3200,.65,1.85),1700+t*4800);
  this.setLoop('rattle',(rough*.2+m.damage*.06)*(run?1:0),.8+clamp(rpm/6500,0,1)*.6,2200);
  if(run&&m.fragments?.jamCount&&this.ctx.currentTime-this.lastHit>.25){this.lastHit=this.ctx.currentTime;this.play('impact',.09+rough*.1,.75+(this.counter++%4)*.07);}
 }
 update(m){this.lastState=m;if(this.ready){if(m.ignition==='cranking'&&this.oldIgnition!=='cranking')this.play('starter',.6);this.oldIgnition=m.ignition;this.mix();}}
 event(e){if(['relay','starter','keyOff'].includes(e.type))this.play('click',.18);else if(['cylinder','jam','metal','cover','backfire'].includes(e.type))this.play('impact',e.type==='cylinder'?.55:.25,.8+(this.counter++%3)*.1);else if(e.type==='impact'&&this.ctx&&this.ctx.currentTime-this.lastHit>.09){this.lastHit=this.ctx.currentTime;this.play('click',clamp(e.level||.15,.06,.4),.8+(this.counter++%5)*.12);}}
 hit(level=1){this.play('impact',level*.4);}
 setVolume(v){this.volume=clamp(Number(v)||0,0,1);if(this.master)this.master.gain.setTargetAtTime(this.muted?0:this.volume,this.ctx.currentTime,.04);this.mix();}
 mute(){this.muted=!this.muted;this.setVolume(this.volume);return this.muted;}
 async suspend(){this.suspended=true;for(const a of Object.values(this.media))a.pause();if(this.ctx?.state==='running')await this.ctx.suspend();}
 async resume(){this.suspended=false;if(this.ctx?.state==='suspended')await this.ctx.resume();this.mix();}
 destroy(){clearInterval(this.timer);for(const l of Object.values(this.loops))try{l.src.stop();}catch(_){}for(const s of this.sources)try{s.stop();}catch(_){}for(const a of Object.values(this.media)){a.pause();a.removeAttribute('src');a.load();}this.sources.clear();this.ctx?.close().catch(()=>{});this.ready=false;}
}
root.Piston.MotorAudio=MotorAudio;
})(window);
