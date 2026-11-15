/* Continuous combustion DSP. Identical engine in AudioWorklet and buffered fallback.
   No samples fetched, no oscillator per firing, no allocations in the sample loop. */
(function(root){
'use strict';
class EngineDSP{
 constructor(sr=48000){
  this.sr=sr;this.seed=352353;this.rpm=750;this.phase=0;this.nextFire=0;this.counter=0;this.fires=0;this.misses=0;
  this.env=new Float64Array(4);this.streak=new Uint8Array(4);this.age=new Float64Array(4);
  this.order=[0,2,3,1];this.delay=new Float32Array(Math.ceil(sr*.045));this.di=0;this.lp=0;this.air=0;this.last=0;this.dc=0;this.body1=0;this.body2=0;this.mech=0;this.pop=0;this.click=0;this.fanPhase=0;this.shaftPhase=0;
  this.s={rpm:750,load:0,damage:0,friction:.06,fan:0,cyl:[1,1,1,1],miss:[0,0,0,0]};
  this.decay=Math.exp(-1/(sr*.012));this.metalDecay=Math.exp(-1/(sr*.025));this.popDecay=Math.exp(-1/(sr*.035));this.smooth=1-Math.exp(-1/(sr*.045));
  this.r1=2*.977*Math.cos(2*Math.PI*1470/sr);this.r2=.977*.977;this.mi1=0;this.mi2=0;this.set(this.s);
 }
 noise(){this.seed=(1664525*this.seed+1013904223)>>>0;return this.seed/2147483648-1;}
 set(s){if(!s||!Number.isFinite(s.rpm))return;this.s={...this.s,...s};this.s.rpm=Math.max(0,Math.min(7200,s.rpm));this.s.load=Math.max(0,Math.min(1,s.load||0));this.lowA=1-Math.exp(-2*Math.PI*(260+this.s.load*1500)/this.sr);this.d1=Math.round(this.sr*.0053);this.d2=Math.round(this.sr*.0097);}
 hit(level=1){this.mech=Math.max(this.mech,Math.min(1,level));}
 backfire(){this.pop=.9;}
 relay(){this.click=.3;}
 render(out){
  const s=this.s,sr=this.sr,N=this.delay.length,live=s.cyl.reduce((n,x)=>n+(x>.001),0),TAU=Math.PI*2;
  for(let i=0;i<out.length;i++){
   this.rpm+=(s.rpm-this.rpm)*this.smooth;
   this.phase+=this.rpm/(30*sr);
   if(this.phase>=1){this.phase-=1;const j=this.order[this.counter++%4],a=s.cyl[j]||0;
    if(a>.001&&!s.cut&&s.running!==false){const successful=this.noise()*.5+.5>Math.min(.85,s.miss[j]||0)||(live===1&&this.streak[j]>=3);
     if(successful){this.env[j]=a*(.22+s.load*.70)*(1+this.noise()*.045);this.age[j]=0;this.streak[j]=0;this.fires++;}
     else{this.streak[j]++;this.misses++;}
    }
    if(s.running!==false&&s.damage>.25)this.mech=Math.max(this.mech,(s.damage-.25)*(.08+s.load*.12));
   }
   let impulse=0;const noise=this.noise();
   for(let j=0;j<4;j++){this.age[j]++;const age=this.age[j]/sr;this.env[j]*=this.decay;
    // A fast pressure edge and exponentially decaying, bipolar exhaust pulse.
    impulse+=this.env[j]*(1-age*240)*Math.exp(-age*40)+this.env[j]*noise*.09;
   }
   const echo1=this.delay[(this.di-this.d1+N)%N],echo2=this.delay[(this.di-this.d2+N)%N];
   const pipe=impulse+echo1*.27+echo2*.16;
   this.delay[this.di]=Math.max(-2,Math.min(2,impulse+echo1*.20+echo2*.13));this.di=(this.di+1)%N;
   this.air+=(noise-this.air)*.09;
   this.fanPhase=(this.fanPhase+(40+65*(s.fan||0))/sr)%1;
   const fan=(this.air*.04+Math.sin(this.fanPhase*TAU)*.004)*(s.fan||0);
   this.mech*=this.metalDecay;this.pop*=this.popDecay;this.click*=.98;
   const metalInput=noise*(this.mech*.09+this.click*.12);
   const metal=metalInput+this.r1*this.mi1-this.r2*this.mi2;this.mi2=this.mi1;this.mi1=metal;
   this.shaftPhase=(this.shaftPhase+this.rpm/(60*sr))%1;
   const pop=this.pop*(this.air*.32+Math.sin(this.shaftPhase*TAU)*.45);
   const rasp=(noise-this.air)*Math.min(.025,(s.friction||0)*.009)*(.15+s.load*.85);
   const brakeNoise=(noise-this.air)*Math.min(.018,(s.brake||0)*.018)*Math.min(1,this.rpm/1800);
   const spinning=Math.min(1,this.rpm/500),running=s.running!==false?1:0;
   const crank=s.starter?(.038*Math.sin(TAU*this.shaftPhase*11)+this.air*.08)*( .65+.35*Math.cos(TAU*this.shaftPhase*2)):0;
   const input=pipe+this.air*(.012+s.load*.055)*running+fan+rasp*spinning+metal*.07+pop+brakeNoise+crank;
   this.lp+=(input-this.lp)*this.lowA;
   const highPass=this.lp-this.last+.9965*this.dc;this.last=this.lp;this.dc=highPass;
   const v=highPass*2.1;out[i]=v/(1+Math.abs(v))*.82;
  }
 }
}
const WORKLET=`const EngineDSP=${EngineDSP.toString()};class PistonVoice extends AudioWorkletProcessor{constructor(){super();this.dsp=new EngineDSP(sampleRate);this.port.onmessage=e=>{const d=e.data;if(d.type==='hit')this.dsp.hit(d.level);else if(d.type==='backfire')this.dsp.backfire();else if(d.type==='relay')this.dsp.relay();else this.dsp.set(d);};}process(i,o){const a=o[0];if(!a||!a[0])return true;this.dsp.render(a[0]);for(let c=1;c<a.length;c++)a[c].set(a[0]);return true;}}registerProcessor('piston-voice',PistonVoice);`;
class MotorAudio{
 constructor(){this.ctx=null;this.node=null;this.master=null;this.ready=false;this.pending=null;this.muted=false;this.volume=.65;this.timer=null;this.next=0;this.lastState=null;this.suspended=false;this.sources=new Set();this.backend='not-started';this.underruns=0;this.dsp=null;}
 start(){if(this.ready)return this.ctx.resume().then(()=>true).catch(()=>false);if(!this.pending)this.pending=this.initialize();return this.pending;}
 async initialize(){try{
  const AC=root.AudioContext||root.webkitAudioContext;if(!AC)return false;
  this.ctx=new AC({latencyHint:'interactive'});await this.ctx.resume();
  this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:this.volume;
  const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-9;limiter.knee.value=8;limiter.ratio.value=8;limiter.attack.value=.003;limiter.release.value=.12;
  this.master.connect(limiter).connect(this.ctx.destination);
  if(this.ctx.audioWorklet){const url=URL.createObjectURL(new Blob([WORKLET],{type:'application/javascript'}));try{await this.ctx.audioWorklet.addModule(url);this.node=new AudioWorkletNode(this.ctx,'piston-voice',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[1]});this.node.connect(this.master);this.backend='audio-worklet';}catch(_){this.node=null;}finally{URL.revokeObjectURL(url);}}
  if(!this.node){this.dsp=new EngineDSP(this.ctx.sampleRate);this.backend='buffered-dsp';this.next=this.ctx.currentTime+.025;this.timer=setInterval(()=>this.schedule(),35);}
  this.ready=true;if(this.lastState)this.send(this.lastState);this.schedule();return true;
 }catch(_){if(this.ctx)await this.ctx.close().catch(()=>{});this.ctx=null;return false;}finally{this.pending=null;}}
 schedule(){if(!this.dsp||!this.ctx||this.ctx.state!=='running')return;const now=this.ctx.currentTime;
  if(this.next<now){this.next=now+.015;this.underruns++;}
  let guard=0;while(this.next<now+.22&&guard++<4){const n=Math.round(this.ctx.sampleRate*.08),buffer=this.ctx.createBuffer(1,n,this.ctx.sampleRate);this.dsp.render(buffer.getChannelData(0));const src=this.ctx.createBufferSource();src.buffer=buffer;src.connect(this.master);this.sources.add(src);src.onended=()=>{this.sources.delete(src);src.disconnect();};src.start(this.next);this.next+=n/this.ctx.sampleRate;}
 }
 send(s){this.lastState=s;if(this.node)this.node.port.postMessage(s);if(this.dsp)this.dsp.set(s);}
 update(m){this.send({rpm:m.rpm,load:m.throttle,running:m.ignition?m.ignition==='running':true,starter:m.ignition==='cranking',cut:!!(m.revCut||m.overrun||m.ignition&&m.ignition!=='running'),brake:m.brake||0,damage:m.damage,friction:m.friction,fan:m.relay?.fan||0,cyl:m.cylinders.map(c=>c.active?c.compression:0),miss:m.cylinders.map(c=>c.misfire)});}
 hit(level=1){if(this.node)this.node.port.postMessage({type:'hit',level});if(this.dsp)this.dsp.hit(level);}
 event(e){if(!this.ready)return;if(e.type==='starter'||e.type==='keyOff'){if(this.node)this.node.port.postMessage({type:'relay'});if(this.dsp)this.dsp.relay();return;}if(e.type==='backfire'||e.type==='relay'){if(this.node)this.node.port.postMessage({type:e.type});if(this.dsp)this.dsp[e.type==='relay'?'relay':'backfire']();}else if(['cylinder','cover','exhaust','leftMount','rightMount','metal','gasket'].includes(e.type))this.hit(e.type==='cylinder'?1:.35);}
 setVolume(value){this.volume=Math.max(0,Math.min(1,Number(value)||0));if(this.master)this.master.gain.setTargetAtTime(this.muted?0:this.volume,this.ctx.currentTime,.03);}
 mute(){this.muted=!this.muted;this.setVolume(this.volume);return this.muted;}
 async suspend(){if(this.ctx?.state==='running'){this.suspended=true;await this.ctx.suspend();}}
 async resume(){if(this.suspended&&this.ctx){this.suspended=false;await this.ctx.resume();}}
 destroy(){if(this.timer)clearInterval(this.timer);for(const s of this.sources){try{s.stop();}catch(_){}s.disconnect();}this.sources.clear();if(this.ctx)this.ctx.close().catch(()=>{});this.ready=false;}
}
const api={MotorAudio,EngineDSP,WORKLET};if(typeof module!=='undefined'&&module.exports)module.exports=api;else Object.assign(root.Piston,api);
})(typeof window!=='undefined'?window:globalThis);
