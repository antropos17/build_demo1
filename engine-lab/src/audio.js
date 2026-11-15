/* Combustion-pulse audio. Sample-accurate worklet, scheduled-buffer fallback. */
(function(root){
'use strict';
const WORKLET = `
class PistonVoice extends AudioWorkletProcessor {
 constructor(){super();this.state={rpm:880,load:0,damage:0,friction:.06,cyl:[1,1,1,1],miss:[0,0,0,0]};this.rpm=880;this.phase=0;this.seed=121;this.env=[0,0,0,0];this.age=[0,0,0,0];this.knock=0;this.low=0;this.air=0;this.time=0;this.lastQuarter=0;
 this.port.onmessage=e=>{if(e.data.type==='hit')this.knock=Math.max(this.knock,e.data.level);else this.state=e.data;};}
 noise(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/2147483648-1;}
 process(inputs,outputs){const out=outputs[0],a=out[0];if(!a)return true;const s=this.state,offs=[0,.75,.25,.5],dt=1/sampleRate;
 for(let n=0;n<a.length;n++){
 this.rpm+=(s.rpm-this.rpm)*.0008;const step=this.rpm/(120*sampleRate);this.phase=(this.phase+step)%1;this.time+=dt;
 let value=0;for(let j=0;j<4;j++){
 const d=(this.phase-offs[j]+1)%1;
 if(d<step&&s.cyl[j]>.01&&this.noise()*.5+.5>s.miss[j]){this.env[j]=s.cyl[j]*(.36+s.load*.7);this.age[j]=0;}
 this.age[j]+=dt;this.env[j]*=Math.exp(-dt*(48+s.load*10));
 const pulse=Math.sin(this.age[j]*Math.PI*2*(62+s.load*39))*this.env[j];
 value+=pulse+.19*this.noise()*this.env[j];
 }
 const quarter=Math.floor(this.phase*8);if(quarter!==this.lastQuarter){this.lastQuarter=quarter;if(s.damage>.4)this.knock=Math.max(this.knock,(s.damage-.4)*(.1+s.load*.25));}
 this.knock*=Math.exp(-dt*40);
 value+=this.knock*(this.noise()*.6+Math.sin(this.time*TAU*1137)*.2+Math.sin(this.time*TAU*719)*.22);
 this.air+=.035*(this.noise()-this.air);
 value+=this.air*(.01+s.load*.035+s.friction*.025);
 this.low+=(value-this.low)*(1-Math.exp(-TAU*(250+s.load*650)*dt));
 a[n]=Math.tanh((this.low*.8+value*.2)*1.1)*.62;
 }for(let ch=1;ch<out.length;ch++)out[ch].set(a);return true;
 }
}
const TAU=Math.PI*2;registerProcessor('piston-voice',PistonVoice);
`;
class MotorAudio {
  constructor(){this.ctx=null;this.node=null;this.master=null;this.ready=false;this.muted=false;this.pending=null;this.lastState=null;this.next=0;this.sequence=0;this.timer=null;this.suspended=false;}
  async start(){
    if(this.ready){if(this.ctx.state==='suspended')await this.ctx.resume();return true;}
    if(this.pending)return this.pending;
    this.pending=this.initialize();return this.pending;
  }
  async initialize(){
    try{
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
      this.ctx=new AC();await this.ctx.resume();this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:.28;
      const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-15;limiter.knee.value=10;limiter.ratio.value=7;limiter.attack.value=.003;limiter.release.value=.12;
      this.master.connect(limiter).connect(this.ctx.destination);
      let worklet=false;
      if(this.ctx.audioWorklet){
        const url=URL.createObjectURL(new Blob([WORKLET],{type:'application/javascript'}));
        try{await this.ctx.audioWorklet.addModule(url);this.node=new AudioWorkletNode(this.ctx,'piston-voice',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[1]});this.node.connect(this.master);worklet=true;}catch(_){/* file:// and restricted embeds use the buffer scheduler below. */}finally{URL.revokeObjectURL(url);}
      }
      if(!worklet){this.makeBuffers();this.next=this.ctx.currentTime+.03;this.timer=setInterval(()=>this.schedule(),25);}
      this.ready=true;if(this.lastState)this.send(this.lastState);return true;
    }catch(_){if(this.ctx)await this.ctx.close().catch(()=>{});this.ctx=null;return false;}
    finally{this.pending=null;}
  }
  makeBuffers(){const sr=this.ctx.sampleRate;this.pulse=this.ctx.createBuffer(1,Math.round(sr*.12),sr);const d=this.pulse.getChannelData(0);for(let n=0;n<d.length;n++){const t=n/sr;d[n]=(Math.sin(t*TAU*83)*.7+(Math.random()*2-1)*.12)*Math.exp(-t*46);}
    this.clack=this.ctx.createBuffer(1,Math.round(sr*.2),sr);const k=this.clack.getChannelData(0);for(let n=0;n<k.length;n++){const t=n/sr;k[n]=((Math.random()*2-1)*.55+Math.sin(t*TAU*713)*.25+Math.sin(t*TAU*1121)*.2)*Math.exp(-t*38);}}
  play(buffer,at,volume,rate=1){if(!this.ctx||!buffer)return;const src=this.ctx.createBufferSource(),g=this.ctx.createGain();src.buffer=buffer;src.playbackRate.value=rate;g.gain.value=volume;src.connect(g).connect(this.master);src.start(at);src.onended=()=>{src.disconnect();g.disconnect()};}
  schedule(){if(!this.ctx||this.ctx.state!=='running'||!this.lastState)return;const s=this.lastState,now=this.ctx.currentTime;
    if(this.next<now)this.next=now+.01;
    let guard=0;while(this.next<now+.09&&guard++<40){const j=[0,2,3,1][this.sequence++%4];if(s.cyl[j]>.01&&Math.random()>s.miss[j])this.play(this.pulse,this.next,s.cyl[j]*(.4+s.load*.65));if(s.damage>.55&&Math.random()<.22)this.play(this.clack,this.next,s.damage*.18);this.next+=30/Math.max(320,s.rpm);}}
  send(data){this.lastState=data;if(this.node)this.node.port.postMessage(data);}
  update(m){this.send({rpm:m.rpm,load:m.throttle,damage:m.damage,friction:m.friction,cyl:m.cylinders.map(c=>c.active?c.compression:0),miss:m.cylinders.map(c=>c.misfire)});}
  hit(level=1){if(!this.ready)return;if(this.node)this.node.port.postMessage({type:'hit',level:Math.min(1.5,level)});else this.play(this.clack,this.ctx.currentTime,Math.min(.8,level*.4));}
  mute(){this.muted=!this.muted;if(this.master)this.master.gain.setTargetAtTime(this.muted?0:.28,this.ctx.currentTime,.03);return this.muted;}
  async suspend(){if(this.ctx?.state==='running'){this.suspended=true;await this.ctx.suspend();}}
  async resume(){if(this.suspended&&this.ctx){this.suspended=false;await this.ctx.resume();this.next=this.ctx.currentTime+.02;}}
  destroy(){if(this.timer)clearInterval(this.timer);if(this.ctx)this.ctx.close().catch(()=>{});}
}
const TAU=Math.PI*2;root.Piston.MotorAudio=MotorAudio;
})(window);
