/* Calibrated display envelope, coupled thermal masses and a 12 V fan relay.
   Rating anchor: Toyota 1AZ-FE (2000 UK), 1998 cc / 110 kW @ 6000 / 192 Nm @ 4000.
   All non-rated curves and component parameters below are explicit model assumptions. */
(function(root){
'use strict';
const base=typeof module!=='undefined'&&module.exports?require('./mechanics.js'):root.Piston;
const {Engine:MechanicalEngine,clamp,approach,TAU}=base;
const RATING=Object.freeze({cc:1998,bore:86,stroke:86,compression:9.8,powerKW:110,powerRPM:6000,torqueNm:192,torqueRPM:4000,idle:750,limiter:6500});
const CURVE=[[500,65],[750,85],[1500,140],[2500,175],[4000,192],[5000,187],[6000,175.07],[6500,155]];
function torqueCurve(rpm){for(let i=1;i<CURVE.length;i++){if(rpm<=CURVE[i][0]){const a=CURVE[i-1],b=CURVE[i],f=clamp((rpm-a[0])/(b[0]-a[0]),0,1);return a[1]+(b[1]-a[1])*f;}}return 155;}
class FanRelay {
 constructor(){this.coilTemp=38;this.contactTemp=38;this.wear=0;this.command=false;this.closed=false;this.fan=0;this.current=0;this.coilCurrent=0;this.voltage=14;this.contactOhm=.006;this.contactW=0;this.coilW=0;this.heatTrip=false;this.switches=0;this.switchAge=20;this.arc=0;this.warned=false;}
 step(dt,coolant,ambient,voltage,stress=false){
  this.voltage=clamp(voltage,8,15);this.switchAge+=dt;this.arc*=Math.exp(-dt*35);
  if(coolant>=98)this.command=true;else if(coolant<=93)this.command=false;
  if(this.contactTemp>145)this.heatTrip=true;else if(this.contactTemp<105)this.heatTrip=false;
  const desired=this.command&&!this.heatTrip;
  if(desired!==this.closed&&this.switchAge>1){this.closed=desired;this.switchAge=0;this.switches++;this.arc=1;this.wear=clamp(this.wear+(stress?.007:.00001),0,1);}
  const coilR=70*(1+.00393*(this.coilTemp-20));this.coilCurrent=this.command?this.voltage/coilR:0;this.coilW=this.coilCurrent*this.coilCurrent*coilR;
  this.contactOhm=(.006+this.wear*.14)*(1+.003*(this.contactTemp-25));
  // A simplified DC fan: high starting current relaxes to the running impedance.
  const motorR=.22+.47*clamp(this.fan,0,1);
  this.current=this.closed?this.voltage/(motorR+this.contactOhm):0;
  this.contactW=this.current*this.current*this.contactOhm;
  const fanTarget=this.closed?clamp((this.voltage-this.current*this.contactOhm)/14,0,1):0;
  this.fan=approach(this.fan,fanTarget,2.8,dt);
  const thermalRate=stress?8:1;
  this.coilTemp=clamp(this.coilTemp+(this.coilW+(this.contactTemp-this.coilTemp)*.08-(this.coilTemp-ambient)*.12)*dt*thermalRate/9,ambient,220);
  this.contactTemp=clamp(this.contactTemp+(this.contactW-(this.contactTemp-this.coilTemp)*.08-(this.contactTemp-ambient)*.2)*dt*thermalRate/15,ambient,240);
  // Accelerated aging belongs only to stress-test mode; healthy real-time contacts do not burn in seconds.
  if(stress&&this.closed)this.wear=clamp(this.wear+dt*.0028*Math.max(.2,(this.contactTemp-45)/45),0,1);
 }
 static restore(d){const r=new FanRelay();if(!d||typeof d!=='object')return r;for(const [k,lo,hi]of[['coilTemp',20,220],['contactTemp',20,240],['wear',0,1],['fan',0,1],['switches',0,1e9]])if(Number.isFinite(d[k]))r[k]=clamp(d[k],lo,hi);r.heatTrip=d.heatTrip===true;return r;}
}
class Engine extends MechanicalEngine{
 constructor(seed=7193){super(seed);this.profile='stress';this.ambient=24;this.rpm=750;this.peakRPM=750;this.block=98;this.coolant=90;this.oilTemp=96;this.headTemp=115;this.peakTemp=98;this.pressure=1.2;this.relay=new FanRelay();this.agingScale=8;this.egt=310;this.headerTemp=165;this.manifoldBar=.34;this.lambda=1;this.torqueNm=0;this.brakeKW=0;this.fuelLh=.85;this.flowGps=3;this.exhaustSmoke=.04;this.oilSmoke=0;this.steam=0;this.burnedOil=0;this.relaySwitches=0;this.fanAngle=0;this.sensor={rpm:750,coolant:90,oil:96,pressure:1.2,egt:310,head:115};}
 setProfile(name){if(name==='normal'||name==='stress'){this.profile=name;this.agingScale=name==='stress'?8:.002;}}
 targetRPM(t){return RATING.idle+t*(RATING.limiter-RATING.idle)*(.22+.78*this.power);}
 oilPressureTarget(){const viscosity=clamp(Math.exp((100-this.oilTemp)/85),.12,2.4),supply=clamp(this.oil/1.8,0,1);return Math.min(5.2,(.48+this.rpm/1000)*viscosity)*supply*(1-this.damage*.35);}
 advanceThermal(dt,t,active){
  const speed=clamp(this.rpm/6500,.1,1),power=this.power;
  const qCombustion=5+70*t*speed*(.35+.65*power),qFriction=(this.frictionKW||1)*.6;
  const wet=Math.max(.06,this.coolantLevel),oilWet=Math.max(.05,this.oil/4.6);
  const toWater=Math.max(-12,(this.block-this.coolant)*2.3*wet);
  const toOil=(this.block-this.oilTemp)*.18*oilWet;
  const thermostat=clamp((this.coolant-82)/13,0,1);
  const cooling=(this.coolant-this.ambient)*(.018+thermostat*(.11+this.relay.fan*1.12))*wet;
  const accel=this.profile==='stress'?8:1;
  this.block=clamp(this.block+(qCombustion+qFriction-toWater-toOil-(this.block-this.ambient)*.028)*dt*accel/35,45,265);
  this.coolant=clamp(this.coolant+(toWater-cooling)*dt*accel/24,35,170);
  this.oilTemp=clamp(this.oilTemp+(toOil+qFriction*.4-(this.oilTemp-this.ambient)*.022)*dt*accel/(8+8*oilWet),35,245);
  // Under pressure liquid approaches a boiling plateau, excess heat expels finite coolant.
  const boiling=108+12*(1-this.gasket);
  if(this.coolant>boiling&&this.coolantLevel>.001){const excess=this.coolant-boiling;this.coolantLevel=clamp(this.coolantLevel-excess*.00022*dt*accel,0,1);this.coolant=approach(this.coolant,boiling,.6,dt);}
 }
 step(dt,gas=false){
  if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.05);this.agingScale=this.profile==='stress'?8:.002;
  // Electrical and thermal models run before the fixed-step mechanical integration.
  const voltage=clamp(12.3+(this.rpm-450)/800,12.3,14.2);
  this.relay.step(dt,this.coolant,32+Math.max(0,this.block-95)*.14,voltage,this.profile==='stress');
  if(this.relay.switches!==this.relaySwitches){this.relaySwitches=this.relay.switches;this.events.push({type:'relay',time:this.time,cylinder:-1,message:this.relay.closed?'Вентилятор включён':'Вентилятор отключён'});if(this.events.length>32)this.events.shift();}
  if(this.relay.contactTemp>120&&!this.relay.warned){this.relay.warned=true;this.emit('relayHeat',-1,'Контакты реле перегреваются. Вентилятор теряет питание.');}
  super.step(dt,gas);
  this.rpm=clamp(this.rpm,320,6510);this.fanAngle=(this.fanAngle+this.relay.fan*dt*22)%TAU;
  this.manifoldBar=approach(this.manifoldBar,.31+.67*this.throttle,5,dt);
  this.lambda=approach(this.lambda,this.throttle>.78?.88:1,3,dt);
  const fullTorque=torqueCurve(this.rpm),wearDerate=clamp(1-this.damage*.18,.65,1);
  this.torqueNm=Math.max(0,fullTorque*this.throttle*this.power*wearDerate-(this.frictionKW||0)*1000/Math.max(33,this.rpm*TAU/60)*.22);
  this.brakeKW=this.torqueNm*this.rpm*TAU/60000;
  this.fuelLh=.75+(this.brakeKW*.29/.745)+(1-this.power)*this.throttle*2;
  this.flowGps=this.rpm/120*.002*1.18*1000*(.25+.7*this.throttle)*(.4+.6*this.power);
  this.egt=approach(this.egt,260+530*this.throttle+this.damage*this.throttle*65,.15,dt);
  this.headerTemp=approach(this.headerTemp,80+(this.egt-80)*.73,.07,dt);
  this.oilSmoke=this.oil>.001?clamp(this.damage*.5+this.gasket*.3,0,1):clamp(this.film*5,0,1);
  this.exhaustSmoke=clamp(.025+this.throttle*.03+this.oilSmoke*.65+this.gasket*this.coolantLevel*.5,.02,1);
  this.steam=this.coolantLevel>.001?clamp(this.gasket*1.5+Math.max(0,this.coolant-108)*.045,0,1):0;
  const burn=Math.min(this.oil,this.oilSmoke*this.throttle*.0006*dt*this.agingScale);this.oil-=burn;this.burnedOil+=burn;
  for(const [k,target,rate]of[['rpm',this.rpm,10],['coolant',this.coolant,1.4],['oil',this.oilTemp,.8],['pressure',this.pressure,4],['egt',this.egt,1],['head',this.headTemp,1]])this.sensor[k]=approach(this.sensor[k],target,rate,dt);
 }
 snapshot(){return {...super.snapshot(),version:4,profile:this.profile,relay:{...this.relay},egt:this.egt,headerTemp:this.headerTemp,burnedOil:this.burnedOil};}
 static restore(data){const e=new Engine();if(!data||![1,2,3,4].includes(data.version))return e;const prior=MechanicalEngine.restore({...data,version:Math.min(3,data.version)});Object.assign(e,prior);e.setProfile(data.profile==='normal'?'normal':'stress');e.relay=FanRelay.restore(data.relay);e.relaySwitches=e.relay.switches;for(const [k,lo,hi]of[['egt',80,950],['headerTemp',30,850],['burnedOil',0,4.6]])if(Number.isFinite(data[k]))e[k]=clamp(data[k],lo,hi);e.sensor={rpm:e.rpm,coolant:e.coolant,oil:e.oilTemp,pressure:e.pressure,egt:e.egt,head:e.headTemp};e.throttle=0;e.events=[];return e;}
}
const api={...base,Engine,FanRelay,RATING,torqueCurve};if(typeof module!=='undefined'&&module.exports)module.exports=api;else Object.assign(root.Piston,api);
})(typeof globalThis!=='undefined'?globalThis:this);
