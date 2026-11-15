'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {Engine,Circuit,Fragments,FRAGMENT_CAP,pistonGeometry}=require('../src/internals.js');
const {Engine:Legacy}=require('../src/ignition.js');
const run=(e,t,g=0,b=0)=>{for(let i=0;i<Math.round(t*120);i++)e.step(1/120,g,b);return e;};
const start=()=>{const e=new Engine();e.setProfile('normal');e.requestStart();return run(e,4);};
test('Oil and coolant circuits conserve the model inventories during recirculation',()=>{
 const e=start();run(e,18,.5,.3);
 assert.ok(Math.abs(e.oilCircuit.total-e.oil)<1e-9);assert.ok(Math.abs(e.waterCircuit.total-e.coolantLevel*6)<1e-9);
 assert.ok(e.oilCircuit.q>0&&e.waterCircuit.q>0);
 for(const f of[e.oilCircuit,e.waterCircuit])for(const c of f.cells){assert.ok(c.litres>=0&&c.litres<=c.capacity+1e-12);assert.ok(Number.isFinite(c.temp));}
});
test('Dry circuits cannot generate fluid, flow or pressure',()=>{
 const e=start();e.oil=0;e.coolantLevel=0;run(e,8,.3);
 assert.equal(e.oilCircuit.total,0);assert.equal(e.waterCircuit.total,0);assert.ok(e.oilCircuit.q<1e-8);assert.ok(e.waterCircuit.q<1e-8);
});
test('The thermostat uses a bypass cold and routes coolant to the radiator warm',()=>{
 const e=new Engine();e.rpm=2000;e.coolant=70;const cold=new Circuit('water');cold.step(.01,e,0);
 e.coolant=98;const hot=new Circuit('water');hot.step(.01,e,0);
 assert.ok(cold.bypass>.99);assert.equal(cold.cells[3].flow,0);assert.ok(hot.cells[3].flow>0);assert.equal(hot.bypass,0);
});
test('Metal contamination restricts oil flow and opens the filter bypass',()=>{
 const e=new Engine();e.rpm=3000;const clean=new Circuit('oil'),dirty=new Circuit('oil');
 for(let i=0;i<600;i++){clean.step(1/120,e,0);dirty.step(1/120,e,1);}
 assert.ok(dirty.filterLoad>.7);assert.ok(dirty.bypass>0);assert.ok(dirty.q<clean.q);
});
test('Manual stop lets circulation decay instead of continuing wall-clock animation',()=>{
 const e=start();run(e,5,.5);e.requestStop();run(e,80);assert.equal(e.rpm,0);assert.ok(e.oilCircuit.q<1e-6);assert.ok(e.waterCircuit.q<1e-6);
});
test('Fragments collide with the pan and remain inside crankcase bounds',()=>{
 const e=new Engine(),w=new Fragments(19);e.rpm=0;e.shaftSpeed=0;
 for(let i=0;i<20;i++){const p=w.add(i%4,'metal','case',330+i*24,520);p.vy=700;}
 for(let i=0;i<600;i++)w.step(1/120,e);
 assert.ok(w.impacts>0);assert.equal(w.bodies.length,20);
 for(const p of w.bodies){assert.ok(p.x>=305+p.r-.01&&p.x<=890-p.r+.01);assert.ok(p.y>=417+p.r-.01&&p.y<=548-p.r+.01);}
});
test('Moving crank imparts velocity to an internal fragment',()=>{
 const e=start(),w=new Fragments(23),g=pistonGeometry(e.phase,0,373),p=w.add(0,'metal','case',g.crankX+17,g.crankY);
 p.vx=p.vy=0;const before={x:p.x,y:p.y};w.step(1/120,e);
 assert.ok(Math.hypot(p.vx,p.vy)>1);assert.ok(p.x!==before.x||p.y!==before.y);
});
test('Ring pinching produces persistent jamming, friction and secondary liner damage',()=>{
 const e=start();const p=e.fragments.add(0,'ring','chamber',417,237);p.vx=p.vy=0;
 const before=e.cylinders[0].contact.liner;run(e,8,.4,.2);
 assert.ok(e.fragments.jamCount>0||e.fragments.bodies.some(x=>x.releaseCount>0));
 assert.ok(e.fragments.resistance>0);assert.ok(e.cylinders[0].contact.liner>before);assert.ok(e.fragments.dust>0);
});
test('Fragments collide with each other without disappearing',()=>{
 const w=new Fragments();const a=w.add(0,'metal','case',360,535),b=w.add(1,'metal','case',362,535);a.vx=50;b.vx=-50;
 w.step(1/120,new Engine());assert.equal(w.bodies.length,2);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=a.r+b.r-.2);
});
test('Fragment pool has a hard cap and overflow becomes bounded contamination',()=>{
 const w=new Fragments();for(let i=0;i<500;i++)w.add(i%4);assert.equal(w.bodies.length,FRAGMENT_CAP);assert.ok(w.dust>0&&w.dust<=1);
});
test('Failure emits internal pieces instead of requiring the renderer to invent them',()=>{
 const e=start();e.emit('cylinder',2,'test');assert.equal(e.fragments.bodies.length,12);assert.ok(e.fragments.bodies.some(p=>p.zone==='chamber'));assert.ok(e.fragments.bodies.some(p=>p.kind==='rod'));
});
test('Saved fragments retain location and jam state with safe validated numeric values',()=>{
 const e=start();const p=e.fragments.add(2,'ring','chamber',705,240);p.jammed=true;e.fragments.dust=.4;const d=e.snapshot();const r=Engine.restore(JSON.parse(JSON.stringify(d)));
 assert.equal(r.snapshot().version,7);assert.equal(r.fragments.bodies[0].jammed,true);assert.equal(r.fragments.bodies[0].x,p.x);assert.equal(r.fragments.dust,.4);
 assert.equal(r.gasCommand,0);assert.equal(r.brakeCommand,0);assert.equal(r.events.length,0);
});
test('Malformed fragment and fluid saves are sanitized, never NaN or unbounded arrays',()=>{
 const d=start().snapshot();d.fragments={bodies:Array.from({length:100},()=>({x:Infinity,y:-1e30,r:99,mass:NaN,jammed:true})),dust:Infinity};d.oilCircuit={cells:Array(6).fill({litres:1e9,temp:NaN,phase:Infinity})};
 const e=Engine.restore(d);run(e,1,.2);assert.ok(e.fragments.bodies.length<=64);assert.ok(Math.abs(e.oilCircuit.total-e.oil)<1e-8);
 for(const p of e.fragments.bodies)for(const k of ['x','y','vx','vy','r','mass'])assert.ok(Number.isFinite(p[k]));
});
test('Version 6 saves retain electrical state and damage without fabricating fragment history',()=>{
 const old=new Legacy();old.cylinders[2].active=false;old.cylinders[2].failure='rod';const e=Engine.restore(old.snapshot());assert.equal(e.activeCount,3);assert.equal(e.ignition,'off');assert.equal(e.fragments.bodies.length,0);
});
test('Realism model remains deterministic and invalid timesteps do nothing',()=>{
 const a=start(),b=start();run(a,24,.7);run(b,24,.7);assert.deepEqual(a.snapshot(),b.snapshot());const before=JSON.stringify(a.snapshot());a.step(NaN,1);a.step(-1);assert.equal(JSON.stringify(a.snapshot()),before);
});
test('An hour of loaded one-cylinder survival keeps contacts, fluids and events bounded',()=>{
 const e=start();e.setProfile('stress');run(e,240,1);assert.equal(e.activeCount,1);run(e,3600,1,1);
 assert.equal(e.activeCount,1);assert.equal(e.ignition,'running');assert.ok(e.rpm>=380);assert.ok(e.fragments.bodies.length<=64);assert.ok(e.events.length<=32);
 assert.ok(Math.abs(e.oilCircuit.total-e.oil)<1e-8);assert.ok(Math.abs(e.waterCircuit.total-e.coolantLevel*6)<1e-8);
 for(const x of[e.fragments.resistance,e.fragments.dust,e.exhaust.pressure,e.block,e.rpm])assert.ok(Number.isFinite(x));
});
