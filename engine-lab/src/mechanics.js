/* 720-degree kinematics and persistent contact wear. Illustrative I4, not a validated solver. */
(function(root){
'use strict';
const base=typeof module!=='undefined'&&module.exports?require('./dynamics.js'):root.Piston;
const {Engine:EnduranceEngine,TAU,FIRE,clamp,approach,pistonGeometry}=base;
const CYCLE=2*TAU;
const wrap=a=>((a%CYCLE)+CYCLE)%CYCLE;
const SPEC=Object.freeze({bore:86,stroke:86,rod:142,compression:10.5,displacement:Math.PI/4*86*86*86*4/1000});
const STROKES=['РАБОЧИЙ ХОД','ВЫПУСК','ВПУСК','СЖАТИЕ'];
function valveLift(phase,start){const d=wrap(phase-start);return d<Math.PI?Math.sin(d)**2:0;}
function cycleState(phase,index){
 const angle=wrap(phase-FIRE[index]);
 return {angle,stroke:Math.min(3,Math.floor(angle/Math.PI)),name:STROKES[Math.min(3,Math.floor(angle/Math.PI))],
  intake:valveLift(angle,TAU),exhaust:valveLift(angle,Math.PI),camAngle:wrap(phase)/2};
}
function chamberVolume(angle){
 const r=SPEC.stroke/2,L=SPEC.rod;
 const travel=r*(1-Math.cos(angle))+L-Math.sqrt(L*L-r*r*Math.sin(angle)**2);
 return {travel,ratio:1+(SPEC.compression-1)*travel/SPEC.stroke};
}
function gasPressure(angle,load,seal,lit){
 const {ratio}=chamberVolume(angle),manifold=.35+.65*load;
 if(angle>=TAU&&angle<3*Math.PI)return manifold;
 if(angle>=3*Math.PI)return manifold*(SPEC.compression/ratio)**1.28*(.25+.75*seal);
 if(angle<Math.PI){const compression=manifold*SPEC.compression**1.28*(.25+.75*seal);
  return Math.max(.4,compression*(lit?2.3:1)/ratio**1.26);}
 return 1.04+load*.16;
}
const LOCAL={liner:[0,1],skirt:[0,1],rings:[0,1],bearing:[0,1],crack:[0,1],crown:[0,1],wallTemp:[35,310],crownTemp:[35,390],bearingTemp:[35,290],filmMicron:[0,8]};
function makeContact(c){return {liner:c.wear*.16,skirt:c.wear*.13,rings:c.wear*.10,bearing:c.wear*.15,crack:c.active?0:.65,crown:0,wallTemp:c.temp,crownTemp:c.temp+35,bearingTemp:92,filmMicron:3.5};}
class Engine extends EnduranceEngine{
 constructor(seed=7193){super(seed);this.headTemp=112;this.frictionNm={rings:2.2,skirts:1.3,bearings:2.6,valves:1.5};this.frictionKW=0;this.camAngle=0;this.coolantPressure=1;this.initContact();this.refreshCycle();}
 initContact(){this.cylinders.forEach(c=>{c.contact=makeContact(c);});}
 refreshCycle(){
  this.camAngle=wrap(this.phase)/2;
  for(const c of this.cylinders){const s=cycleState(this.phase,c.id);c.cycle=s;
   c.chamberBar=c.active?gasPressure(s.angle,this.throttle,c.compression,c.lit):1;
   const a=s.angle,r=SPEC.stroke/2/1000,L=SPEC.rod/1000,area=Math.PI*(SPEC.bore/1000)**2/4;
   const slope=r*Math.sin(a)+r*r*Math.sin(a)*Math.cos(a)/Math.sqrt(L*L-r*r*Math.sin(a)**2);
   c.gasTorqueNm=c.active?(c.chamberBar-1)*1e5*area*slope:0;
  }
 }
 step(dt,gas=false){
  if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.05);
  super.step(dt,gas);
  const starving=clamp((1.2-this.pressure)/1.2,0,1),hot=clamp((this.oilTemp-135)/95,0,1),speed=this.rpm/7000;
  const contacts=this.cylinders.map(c=>c.contact),mean=k=>contacts.reduce((n,d)=>n+d[k],0)/4;
  for(const c of this.cylinders){const d=c.contact,sus=c.susceptibility;
   const filmTarget=c.active?clamp(this.pressure*1.5/(1+speed*.7+hot*2),0,6):0;
   d.filmMicron=approach(d.filmMicron,filmTarget,2.5,dt);
   d.wallTemp=approach(d.wallTemp,this.block+(c.active?7+this.throttle*15:-12),.17,dt);
   d.crownTemp=approach(d.crownTemp,c.active?this.block+30+this.throttle*75:this.block-8,.13,dt);
   d.bearingTemp=approach(d.bearingTemp,this.oilTemp+speed*(9+starving*50),.23,dt);
   if(!c.active)continue;
   const contact=clamp((1.35-d.filmMicron)/1.35,0,1),thermal=clamp((d.crownTemp-240)/120,0,1);
   const duty=(.15+this.throttle*.85)*speed;
   d.liner=clamp(d.liner+dt*duty*sus*(contact*.018+thermal*.004),0,1);
   d.skirt=clamp(d.skirt+dt*duty*sus*(contact*.023+thermal*.007),0,1);
   d.rings=clamp(d.rings+dt*duty*(contact*.012+thermal*.005),0,1);
   d.bearing=clamp(d.bearing+dt*duty*sus*(starving*.024+Math.max(0,speed-.86)*.004),0,1);
   d.crown=clamp(d.crown+dt*duty*Math.max(0,d.crownTemp-295)*.00015,0,1);
   d.crack=clamp(d.crack+dt*duty*Math.max(0,c.wear-.55)*(.018+thermal*.035),0,1);
   // Contact degradation feeds back into power, sound and subsequent core wear.
   c.compression=clamp(c.compression*(1-d.rings*.22-d.crown*.10),c.last?.22:.1,1);
   c.misfire=clamp(c.misfire+d.rings*.07,c.last?.0:0,c.last?.50:.80);
  }
  this.frictionNm={rings:2.2+speed*2.0+mean('rings')*6,skirts:1.3+speed*1.2+mean('skirt')*11,bearings:2.6+speed*2.8+mean('bearing')*9,valves:1.5+speed*2+hot*.8};
  this.frictionKW=Object.values(this.frictionNm).reduce((a,b)=>a+b,0)*this.rpm*TAU/60/1000;
  const extra=mean('skirt')*.18+mean('bearing')*.14;
  this.friction=clamp(this.friction+extra,.06,2.8);
  this.oilTemp=clamp(this.oilTemp+this.frictionKW*.004*dt,35,245);
  this.block=clamp(this.block+extra*.5*dt,45,265);
  this.headTemp=approach(this.headTemp,this.block+9+this.throttle*16,.18,dt);
  this.coolantPressure=this.coolantLevel>.001?clamp((this.coolant-65)*.016,0,1.4)*(1-this.gasket*.7):0;
  this.refreshCycle();
 }
 snapshot(){return {...super.snapshot(),version:3,headTemp:this.headTemp,cylinders:this.cylinders.map(c=>({...c,contact:{...c.contact}}))};}
 static restore(data){
  const e=new Engine();if(!data||![1,2,3].includes(data.version)||!Array.isArray(data.cylinders)||data.cylinders.length!==4)return e;
  const prior=EnduranceEngine.restore({...data,version:data.version===3?2:data.version});Object.assign(e,prior);e.initContact();
  e.headTemp=Number.isFinite(data.headTemp)?clamp(data.headTemp,35,310):e.block+10;
  e.cylinders.forEach((c,i)=>{const d=data.cylinders[i]?.contact;if(d&&typeof d==='object')for(const [k,[a,b]]of Object.entries(LOCAL))if(Number.isFinite(d[k]))c.contact[k]=clamp(d[k],a,b);});
  e.throttle=0;e.events=[];e.refreshCycle();return e;
 }
}
const api={...base,Engine,cycleState,chamberVolume,gasPressure,SPEC,STROKES};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else Object.assign(root.Piston,api);
})(typeof globalThis!=='undefined'?globalThis:this);
