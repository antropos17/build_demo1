'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {Engine,cycleState,chamberVolume,gasPressure,SPEC,TAU,pistonGeometry}=require('../src/mechanics.js');
const {Engine:V2}=require('../src/dynamics.js');
const run=(e,seconds,gas=true)=>{for(let i=0;i<seconds*120;i++)e.step(1/120,gas);return e;};
const approx=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
test('Four strokes occupy exactly 180 degrees each in a 720 degree cycle',()=>{
 for(let i=0;i<4;i++){for(let deg=1;deg<180;deg+=17){const s=cycleState((180*i+deg)*Math.PI/180,0);assert.equal(s.stroke,i);}}
 assert.equal(cycleState(TAU*2,0).stroke,0);assert.equal(cycleState(-.01,0).stroke,3);
});
test('Ignition order is 1-3-4-2 with the paired pistons sharing position',()=>{
 const order=[];for(let i=0;i<4;i++){const phase=i*Math.PI;order.push([0,1,2,3].find(j=>Math.abs(cycleState(phase,j).angle)<1e-8)+1);}
 assert.deepEqual(order,[1,3,4,2]);
 for(let a=0;a<TAU;a+=.09){approx(pistonGeometry(a,0).top,pistonGeometry(a,3).top);approx(pistonGeometry(a,1).top,pistonGeometry(a,2).top);}
});
test('Valve events are bounded, closed on power/compression, driven even on failed cylinders',()=>{
 for(let a=0;a<TAU*2;a+=.013){const s=cycleState(a,0);assert.ok(s.intake>=0&&s.intake<=1&&s.exhaust>=0&&s.exhaust<=1);if(s.stroke===0||s.stroke===3){approx(s.intake,0);approx(s.exhaust,0);}}
 approx(cycleState(Math.PI*2.5,0).intake,1);approx(cycleState(Math.PI*1.5,0).exhaust,1);
 const e=run(new Engine(),90);const dead=e.cylinders.find(c=>!c.active);e.phase=dead.offset+Math.PI*2.5;e.refreshCycle();approx(dead.cycle.intake,1);
});
test('Camshaft half speed and slider-crank length/stroke are invariant',()=>{
 for(let a=0;a<TAU*2;a+=.04){approx(cycleState(a,0).camAngle,a/2);const g=pistonGeometry(a,0);approx(Math.hypot(g.crankX-g.x,g.crankY-g.pinY),142);}
 approx(pistonGeometry(Math.PI,0).top-pistonGeometry(0,0).top,SPEC.stroke);
});
test('Analytic chamber has the chosen compression ratio, finite pressure and signed torque',()=>{
 approx(chamberVolume(0).ratio,1);approx(chamberVolume(Math.PI).ratio,9.8);assert.ok(SPEC.displacement>1998&&SPEC.displacement<1999);
 for(let a=0;a<TAU*2;a+=.015)assert.ok(Number.isFinite(gasPressure(a,1,.9,true)));
 assert.ok(gasPressure(.1,1,1,true)>gasPressure(.1,1,1,false));
 const e=new Engine();e.throttle=1;e.phase=.5;e.refreshCycle();assert.ok(e.cylinders[0].gasTorqueNm>0);
 e.phase=3.8*Math.PI;e.refreshCycle();assert.ok(e.cylinders[0].gasTorqueNm<0);
});
test('Contact wear increases under load, affects power and never heals on cooling',()=>{
 const e=run(new Engine(),100);assert.equal(e.activeCount,1);
 const c=e.cylinders.find(c=>c.active);assert.ok(c.contact.skirt>.2);assert.ok(e.frictionNm.skirts>1.3);
 const snapshot={...c.contact};const before=e.block;run(e,130,false);assert.ok(e.block<before);
 for(const k of['skirt','liner','rings','bearing','crack','crown'])assert.ok(c.contact[k]>=snapshot[k]);
});
test('New model survives one virtual hour with bounded temperatures, noise states and fluid inventory',()=>{
 const e=run(new Engine(),3600);assert.equal(e.activeCount,1);assert.ok(e.rpm>=320);assert.equal(e.oil,0);assert.equal(e.coolantLevel,0);
 const c=e.cylinders.find(c=>c.active);assert.ok(c.fired>500);assert.ok(c.missed>50);assert.ok(c.streak<=3);
 assert.ok(e.frictionKW>=0&&e.frictionKW<150);assert.ok(e.log.length<=12);
 for(const c of e.cylinders)for(const n of Object.values(c.contact))assert.ok(Number.isFinite(n));
 for(const c of e.cylinders)assert.ok(c.contact.wallTemp<=310&&c.contact.crownTemp<=390&&c.contact.bearingTemp<=290);
});
test('V2 state migrates and V3 contact maps round-trip without resurrecting cylinders',()=>{
 const old=run(new V2(),100);const e=Engine.restore(old.snapshot());assert.equal(e.activeCount,old.activeCount);
 run(e,30);const data=JSON.parse(JSON.stringify(e.snapshot()));const r=Engine.restore(data);
 assert.equal(r.snapshot().version,3);assert.deepEqual(r.cylinders.map(c=>c.contact),e.cylinders.map(c=>c.contact));assert.deepEqual(r.log,e.log);assert.equal(r.throttle,0);assert.equal(r.events.length,0);
 run(r,60);assert.equal(r.activeCount,1);
});
test('Malformed contact data is sanitized and invalid timestep cannot change state',()=>{
 const data=run(new Engine(),90).snapshot();for(const c of data.cylinders){c.contact={liner:Infinity,skirt:-12,rings:NaN,wallTemp:1e8,crownTemp:-1};}
 const e=Engine.restore(data);run(e,1);for(const c of e.cylinders){assert.ok(c.contact.wallTemp<=310);assert.ok(c.contact.skirt>=0);assert.ok(Number.isFinite(c.contact.rings));}
 const s=e.snapshot();for(const dt of [NaN,Infinity,-1,0])e.step(dt,true);assert.deepEqual(e.snapshot(),s);
});
test('New model deterministic without renderer or audio affecting random state',()=>{
 const a=run(new Engine(12),130),b=run(new Engine(12),130);assert.deepEqual(a.snapshot(),b.snapshot());
});
