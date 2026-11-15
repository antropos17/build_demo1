/* Manual ignition and a bounded 12 V electrical model.
 * Charging current is positive into the battery; capacities and thermal constants
 * are illustrative. A manual key-off is not a mechanical game-over.
 */
(function (root) {
'use strict';
const base=typeof module!=='undefined'&&module.exports?require('./dyno.js'):root.Piston;
const {Engine:Dyno,clamp,approach,TAU,DYNO,pedal}=base;
class ElectricalSystem {
 constructor(){this.soc=.82;this.capacityAh=60;this.voltage=12.58;this.current=0;this.alternatorA=0;this.starterA=0;this.loadA=0;this.altTemp=32;this.starterTemp=30;this.batteryTemp=24;this.altTorque=0;this.altAngle=0;this.starts=0;this.minStartVoltage=12.58;}
 step(dt,m){
  const running=m.ignition==='running',cranking=m.ignition==='cranking';
  const ocv=11.65+1.13*this.soc,r=.011+(1-this.soc)*.025;
  const starter=cranking&&this.starterTemp<135?clamp((ocv-m.rpm*.035)/(.045+r),0,260):0;
  this.starterA=starter;this.loadA=(m.ignition==='off'?.06:7.5)+(m.relay.current||0)+starter;
  const capacity=running?90*clamp((m.rpm-500)/1200,0,1)*clamp(1-(this.altTemp-120)/150,.35,1):0;
  const desiredCharge=clamp((1-this.soc)*75,0,24);
  this.alternatorA=Math.min(capacity,this.loadA+desiredCharge);
  this.current=this.alternatorA-this.loadA;
  const target=this.current>=0&&capacity>this.loadA?14.2:clamp(ocv+this.current*r,5,14.2);
  this.voltage=approach(this.voltage,target,cranking?22:5,dt);
  this.soc=clamp(this.soc+this.current*dt/(this.capacityAh*3600)*(this.current>0?.88:1),0,1);
  const altW=this.alternatorA*this.voltage;
  this.altTemp=clamp(this.altTemp+(altW*.35-(this.altTemp-m.ambient)*(3+m.rpm*.001))*dt/1000, m.ambient,190);
  this.starterTemp=clamp(this.starterTemp+(starter*starter*.026-(this.starterTemp-m.ambient)*4)*dt/520,m.ambient,180);
  this.batteryTemp=clamp(this.batteryTemp+(this.current*this.current*r*.16-(this.batteryTemp-m.ambient)*3)*dt/12000,m.ambient,65);
  this.altTorque=running?altW/(Math.max(35,m.rpm*TAU/60)*.62):0;
  this.altAngle=(this.altAngle+Math.max(0,m.shaftSpeed)*2.4*dt)%TAU;
  if(cranking)this.minStartVoltage=Math.min(this.minStartVoltage,this.voltage);
 }
 static restore(d){const e=new ElectricalSystem();if(!d||typeof d!=='object')return e;for(const [k,lo,hi]of[['soc',0,1],['altTemp',24,190],['starterTemp',24,180],['batteryTemp',24,65],['starts',0,1e9],['minStartVoltage',5,15]])if(Number.isFinite(d[k]))e[k]=clamp(d[k],lo,hi);e.voltage=11.65+1.13*e.soc;return e;}
}
class PoweredRelay extends base.FanRelay {
 step(dt,coolant,ambient,voltage,stress){
  const supply=Number.isFinite(this.supply)?this.supply:voltage;
  super.step(dt,supply<9?0:coolant,ambient,supply,stress);
 }
}
class Engine extends Dyno {
 constructor(seed=7193){super(seed);this.electrical=new ElectricalSystem();this.relay=Object.assign(new PoweredRelay(),this.relay);this.ignition='off';this.crankTime=0;this.afterRun=0;this.startMessage='Поверни ключ для запуска';this.rpm=0;this.shaftSpeed=0;this.pressure=0;this.fuelLh=0;this.flowGps=0;this.exhaustSmoke=0;this.sensor.rpm=0;this.sensor.pressure=0;this.cylinders.forEach(c=>{c.lit=false;c.pulse=0;});}
 requestStart(){
  if(this.ignition==='running'||this.ignition==='cranking')return false;
  if(this.rpm>60){this.startMessage='Дождись остановки вала';return false;}
  if(this.electrical.soc<.03){this.startMessage='АКБ разряжена. Подключи пусковое питание';return false;}
  if(this.electrical.starterTemp>=125){this.startMessage='Стартер остывает';return false;}
  this.ignition='cranking';this.crankTime=0;this.startMessage='Стартер прокручивает коленвал';this.electrical.minStartVoltage=this.electrical.voltage;this.emit('starter',-1,'Стартер включён');return true;
 }
 requestStop(){if(this.ignition==='off')return;this.ignition='off';this.afterRun=this.coolant>96?45:0;this.crankTime=0;this.throttle=0;this.gasCommand=0;this.idleIntegral=0;this.startMessage='Зажигание выключено';this.emit('keyOff',-1,'Зажигание выключено. Повреждения сохранены.');}
 chargeBattery(){if(this.ignition!=='off')return false;this.electrical.soc=.9;this.electrical.voltage=12.67;this.startMessage='Пусковое питание подключено';this.emit('battery',-1,'Аккумулятор заряжен от внешнего питания стенда');return true;}
 integrateShaft(dt,t){super.integrateShaft(dt,t);this.rpm=clamp(this.rpm-this.electrical.altTorque/DYNO.inertia*dt*60/TAU,380,6600);this.shaftDriveNm-=this.electrical.altTorque;this.netTorqueNm-=this.electrical.altTorque;this.absorbedKW=this.absorbedNm*this.rpm*TAU/60000;}
 step(dt,gas=0,brake=0){
  if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.05);
  this.electrical.step(dt,this);this.relay.supply=this.electrical.voltage;
  if(this.ignition==='running'){super.step(dt,gas,brake);return;}
  // With fuel cut there is no core wear or combustion. Retained heat continues to move.
  this.time+=dt;this.gasCommand=0;this.throttle=approach(this.throttle,0,10,dt);this.brakeCommand=pedal(brake);this.brake=approach(this.brake,this.brakeCommand,12,dt);
  this.revCut=false;this.overrun=this.rpm>0;this.antiStall=false;this.idleIntegral=0;
  const starter=this.ignition==='cranking';this.crankTime=starter?this.crankTime+dt:0;
  const starterTorque=starter?this.electrical.starterA*.18:0;
  const resisting=8+this.rpm*.006+Math.max(0,this.damage)*4;
  this.brakeFade=clamp(1-Math.max(0,this.brakeTemp-380)/540,.28,1);
  this.absorbedNm=DYNO.maxBrakeNm*this.brake**1.35*this.brakeFade*clamp(this.rpm/100,0,1);
  this.netTorqueNm=starterTorque-resisting-this.absorbedNm;
  const previousRPM=this.rpm;
  this.rpm=Math.max(0,this.rpm+this.netTorqueNm/DYNO.inertia*dt*60/TAU);
  if(this.rpm<.5)this.rpm=0;
  this.shaftDriveNm=starterTorque-resisting;this.torqueNm=0;this.brakeKW=0;this.engineLoad=0;this.fuelLh=0;this.flowGps=0;
  this.absorbedKW=this.absorbedNm*(previousRPM+this.rpm)*.5*TAU/60000;this.brakeEnergyKJ+=this.absorbedKW*dt;
  this.brakeTemp=clamp(this.brakeTemp+(this.absorbedKW-(this.brakeTemp-24)*.04)*dt/18,24,900);
  this.shaftSpeed=this.rpm>0?Math.min(20,Math.sqrt(this.rpm/7000)*22):0;
  this.phase=(this.phase+this.shaftSpeed*dt)%(TAU*2);this.dynoAngle=(this.dynoAngle+this.shaftSpeed*dt)%TAU;this.totalRevs+=this.rpm/60*dt;
  this.pressure=approach(this.pressure,this.rpm/1000*.6*clamp(this.oil/1.8,0,1),4,dt);
  this.afterRun=Math.max(0,this.afterRun-dt);
  this.relay.step(dt,(starter||this.afterRun>0)?this.coolant:0,32+Math.max(0,this.block-95)*.14,this.electrical.voltage,false);
  this.fanAngle=(this.fanAngle+this.relay.fan*dt*22)%TAU;
  const toWater=(this.block-this.coolant)*.22*Math.max(.05,this.coolantLevel),toOil=(this.block-this.oilTemp)*.08;
  this.block=clamp(this.block-(toWater+toOil+(this.block-this.ambient)*.03)*dt/35,24,265);
  this.coolant=clamp(this.coolant+(toWater-(this.coolant-this.ambient)*(.08+this.relay.fan*.8))*dt/24,24,170);
  this.oilTemp=clamp(this.oilTemp+(toOil-(this.oilTemp-this.ambient)*.03)*dt/16,24,245);
  this.headTemp=approach(this.headTemp,this.block,.004,dt);this.egt=approach(this.egt,this.ambient,.025,dt);this.headerTemp=approach(this.headerTemp,this.ambient,.009,dt);
  this.film=Math.max(0,this.film-this.film*Math.max(0,this.headerTemp-100)*.0004*dt);
  this.exhaustSmoke=0;this.oilSmoke=this.headerTemp>160?clamp(this.film*5,0,1):0;this.steam=this.coolantLevel>.001?clamp((this.coolant-108)*.03*this.gasket,0,.6):0;
  this.leakRate=0;this.frictionKW=0;this.kick*=Math.exp(-dt*7);this.recoil*=Math.exp(-dt*7);this.exhaustPulse*=Math.exp(-dt*8);
  this.cylinders.forEach(c=>{c.pulse=0;c.lit=false;c.contact.wallTemp=approach(c.contact.wallTemp,this.block,.01,dt);});
  this.refreshCycle();
  for(const [k,target] of [['rpm',this.rpm],['coolant',this.coolant],['oil',this.oilTemp],['pressure',this.pressure],['egt',this.egt],['brakeTemp',this.brakeTemp]])this.sensor[k]=approach(this.sensor[k],target,k==='rpm'?10:2,dt);
  if(starter){
   const catches=this.crankTime>1.05+this.damage*.9&&this.rpm>160&&this.electrical.voltage>9.2&&this.brake<.15;
   if(catches){this.ignition='running';this.rpm=Math.max(580,this.rpm);this.electrical.starts++;this.startMessage='Двигатель запущен';this.emit('ignition',-1,'Двигатель схватил. Генератор питает бортсеть.');}
   else if(this.crankTime>6||this.electrical.starterTemp>135){this.ignition='off';this.startMessage=this.brake>.15?'Отпусти тормоз перед запуском':'Не схватил. Проверь заряд АКБ';this.emit('startFailed',-1,this.startMessage);}
  }
 }
 snapshot(){return {...super.snapshot(),version:6,ignition:this.ignition==='running'?'running':'off',electrical:{soc:this.electrical.soc,altTemp:this.electrical.altTemp,starterTemp:this.electrical.starterTemp,batteryTemp:this.electrical.batteryTemp,starts:this.electrical.starts,minStartVoltage:this.electrical.minStartVoltage}};}
 static restore(data){
  const e=new Engine();if(!data||![1,2,3,4,5,6].includes(data.version)||!Array.isArray(data.cylinders)||data.cylinders.length!==4)return e;
  Object.assign(e,Dyno.restore({...data,version:Math.min(5,data.version)}));e.electrical=ElectricalSystem.restore(data.electrical);e.relay=Object.assign(new PoweredRelay(),e.relay);e.relay.supply=e.electrical.voltage;
  e.ignition=data.version<6||data.ignition==='running'?'running':'off';
  if(e.ignition==='off'){e.rpm=0;e.pressure=0;e.shaftSpeed=0;e.sensor.rpm=0;e.sensor.pressure=0;e.cylinders.forEach(c=>{c.pulse=0;c.lit=false;});}
  for(const [k,hi]of [['block',265],['coolant',170],['oilTemp',245],['headTemp',310]])if(Number.isFinite(data[k]))e[k]=clamp(data[k],24,hi);
  e.sensor.coolant=e.coolant;e.sensor.oil=e.oilTemp;
  e.gasCommand=e.brakeCommand=e.brake=e.throttle=0;e.crankTime=0;e.afterRun=0;e.events=[];
  const types=['starter','keyOff','ignition','battery','startFailed'];
  if(Array.isArray(data.log))for(const x of data.log){if(x&&types.includes(x.type)&&Number.isFinite(x.time)&&x.time>=0&&x.time<=e.time&&typeof x.message==='string')e.log.push({type:x.type,time:x.time,cylinder:-1,message:x.message.slice(0,160)});}
  e.log.sort((a,b)=>b.time-a.time);e.log.length=Math.min(12,e.log.length);e.startMessage=e.ignition==='running'?'Состояние двигателя восстановлено':'Ключ выключен. Повреждения сохранены';return e;
 }
}
const api={...base,Engine,ElectricalSystem};if(typeof module!=='undefined'&&module.exports)module.exports=api;else Object.assign(root.Piston,api);
})(typeof globalThis!=='undefined'?globalThis:this);
