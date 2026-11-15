'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {Engine,pedal,DYNO}=require('../src/dyno.js');
const {Engine:V4}=require('../src/powertrain.js');
function run(e,seconds,g=0,b=0){for(let i=0;i<Math.round(seconds*120);i++)e.step(1/120,g,b);return e;}
function normal(){const e=new Engine();e.setProfile('normal');return e;}
test('Analogue throttle accepts the full 0..1 range, clamps invalid inputs',()=>{
 assert.equal(pedal(true),1);for(const bad of[NaN,Infinity,null,{},'1'])assert.equal(pedal(bad),0);
 assert.equal(pedal(-4),0);assert.equal(pedal(3),1);
 const e=run(normal(),3,.37);assert.ok(Math.abs(e.throttle-.37)<.001);assert.equal(e.gasCommand,.37);
});
test('Pedal travel changes acceleration, rather than interpolating target RPM',()=>{
 const low=run(normal(),2,.25),mid=run(normal(),2,.5),full=run(normal(),2,1);
 assert.ok(low.rpm>800);assert.ok(mid.rpm>low.rpm+300);assert.ok(full.rpm>mid.rpm+400);
 const e=normal();run(e,.1,1);assert.ok(e.rpm<1300); // Inertia forbids instant redline.
});
test('Healthy zero-pedal idle is stable; a little gas does not kill idle',()=>{
 const e=run(normal(),120);assert.ok(e.rpm>700&&e.rpm<800);assert.equal(e.activeCount,4);
 const slight=run(normal(),6,.1);assert.ok(slight.rpm>=740);
});
test('Throttle release coasts down; brake decelerates faster',()=>{
 const a=run(normal(),3,1),b=Engine.restore(a.snapshot());
 run(a,1,0,0);run(b,1,0,1);assert.ok(b.rpm<a.rpm-600);assert.ok(b.rpm>=380);
});
test('Gas and brake operate simultaneously with positive absorbed power',()=>{
 const free=run(normal(),4,1),loaded=run(normal(),4,1,.85);
 assert.ok(loaded.rpm<free.rpm-500);assert.ok(loaded.absorbedNm>0);assert.ok(loaded.absorbedKW>0);
 assert.ok(loaded.brakeTemp>24);assert.ok(Math.abs(loaded.absorbedKW-loaded.absorbedNm*loaded.rpm*Math.PI/30000)<1e-8);
});
test('Brake temperature follows absorbed power; released brake cools',()=>{
 const e=run(run(normal(),3,1),30,1,.5),hot=e.brakeTemp;assert.ok(hot>50);const wear=e.brakeWear;
 run(e,90,0,0);assert.ok(e.brakeTemp<hot);assert.ok(e.brakeWear>=wear);assert.ok(e.absorbedKW<1e-5);
});
test('Overheated absorber fades without resetting or hiding temperature',()=>{
 const cold=normal(),hot=normal();cold.rpm=hot.rpm=4000;hot.brakeTemp=650;
 run(cold,.3,.5,.5);run(hot,.3,.5,.5);
 assert.ok(hot.brakeFade<cold.brakeFade);assert.ok(hot.absorbedNm<cold.absorbedNm);assert.ok(hot.brakeTemp>600);
});
test('Limiter bounds free-rev speed with fuel cut, not a hard visual reset',()=>{
 const e=normal();let cuts=0,max=0;for(let i=0;i<30*120;i++){e.step(1/120,1,0);cuts+=Number(e.revCut);max=Math.max(max,e.rpm);}
 assert.ok(cuts>0);assert.ok(max<=6510);assert.ok(e.rpm>6000);
});
test('Near idle, safety coupling preserves the last piston under both pedals',()=>{
 const e=run(new Engine(),240,1);assert.equal(e.activeCount,1);
 run(e,3600,1,1);assert.equal(e.activeCount,1);assert.ok(e.rpm>=380);assert.ok(e.antiStall);
 for(const k of['rpm','brakeTemp','brakeFade','brakeEnergyKJ','absorbedKW','shaftDriveNm'])assert.ok(Number.isFinite(e[k]),k);
 assert.ok(e.events.length<=32&&e.log.length<=12);assert.ok(e.brakeTemp<=900);
});
test('v4 migration keeps damage while releasing both pedals',()=>{
 const old=run(new V4(),300,1);const e=Engine.restore(old.snapshot());assert.equal(e.activeCount,old.activeCount);
 assert.equal(e.throttle,0);assert.equal(e.brake,0);assert.equal(e.brakeTemp,24);run(e,1,.25,.2);assert.ok(Number.isFinite(e.rpm));
});
test('v5 persists only safe physical state; malicious save cannot latch pedals',()=>{
 const e=run(normal(),8,1,.75);const d=JSON.parse(JSON.stringify(e.snapshot()));d.gasCommand=1;d.brake=1;d.brakeCommand=1;
 const r=Engine.restore(d);assert.equal(r.brakeTemp,e.brakeTemp);assert.equal(r.brakeEnergyKJ,e.brakeEnergyKJ);
 assert.equal(r.gasCommand,0);assert.equal(r.brakeCommand,0);assert.equal(r.brake,0);assert.equal(r.throttle,0);
 d.brakeTemp=Infinity;d.brakeWear=-22;const bad=Engine.restore(d);assert.equal(bad.brakeTemp,24);assert.equal(bad.brakeWear,0);
});
test('Determinism, snapshot isolation and invalid dt rejection',()=>{
 const a=run(normal(),12,.6,.4),b=run(normal(),12,.6,.4);assert.deepEqual(a.snapshot(),b.snapshot());
 const snap=JSON.stringify(a.snapshot());a.step(NaN,1,1);a.step(-1,1,1);assert.equal(JSON.stringify(a.snapshot()),snap);
 assert.equal(DYNO.inertia,.52);
});
