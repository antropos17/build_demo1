/* Model-owned 2D contact physics and finite-volume transport. No renderer RNG.
 * Contact shapes are conservative discs/capsules, not deformable 3D solids.
 * World lengths are cutaway mm; dt is seconds. Fluid inventories remain in litres.
 */
(function(root){
'use strict';
const base=typeof module!=='undefined'&&module.exports?require('./ignition.js'):root.Piston;
const {Engine:Prior,clamp,approach,pistonGeometry,TAU,DYNO}=base;
const XS=[373,517,661,805],CAP=64;
const finite=(v,lo,hi,f=lo)=>Number.isFinite(v)?clamp(v,lo,hi):f;
class Circuit{
 constructor(kind){
  this.kind=kind;this.cap=kind==='oil'?[3.35,.10,.25,.32,.18,.40]:[1.6,1.6,.4,1.6,.3,.5];
  this.cells=this.cap.map((capacity,i)=>({capacity,litres:capacity,temp:kind==='oil'?96:90,phase:0,flow:0,bubbles:0}));
  this._delta=new Float64Array(6);this._energy=new Float64Array(6);this._flows=new Float64Array(6);
  this.q=0;this.pressure=0;this.filterLoad=0;this.bypass=0;this.vapour=0;this.transferred=0;
 }
 get total(){return this.cells.reduce((a,c)=>a+c.litres,0);}
 setInventory(total){
  total=clamp(total,0,this.cap.reduce((a,b)=>a+b,0));let delta=total-this.total;
  // Only change inventory to match the parent model. Recirculation cannot create oil.
  for(const i of [0,5,1,4,2,3]){const c=this.cells[i];if(delta<0){const v=Math.min(c.litres,-delta);c.litres-=v;delta+=v;}else{const v=Math.min(c.capacity-c.litres,delta);c.litres+=v;delta-=v;}}
 }
 step(dt,m,dust){
  const oil=this.kind==='oil',running=m.rpm>0,inventory=oil?m.oil:m.coolantLevel*6;
  this.setInventory(inventory);
  const wet=clamp(inventory/(oil?1.8:2),0,1),temp=oil?m.oilTemp:m.coolant;
  const thermostat=clamp((m.coolant-82)/13,0,1);
  this.vapour=approach(this.vapour,oil?clamp((m.oilTemp-145)/80+(1-wet)*.4,0,.7):clamp((temp-(108+12*(1-m.gasket)))/10+m.gasket*.35,0,.85)*wet,2,dt);
  this.filterLoad=oil?clamp(dust*.8,0,.86):0;
  this.bypass=oil?clamp((this.filterLoad-.55)*3,0,.65):1-thermostat;
  const efficiency=wet*(1-this.vapour*.7)*(oil?1-this.filterLoad*.65+this.bypass*.38:1);
  const demand=running?(oil?clamp(m.rpm*.0045,0,27):clamp(m.rpm*.015,0,90))*efficiency:0;
  this.q=approach(this.q,demand,7,dt);
  this.pressure=oil?m.pressure:running?(.05+m.rpm*.00009)*wet*(1-this.vapour*.7):0;
  // Simultaneous finite-volume advection around a closed ring with thermostat bypass.
  const n=6,delta=this._delta,energy=this._energy,flows=this._flows;delta.fill(0);energy.fill(0);flows.fill(0);
  const edge=(a,b,q)=>{const ca=this.cells[a],cb=this.cells[b];const v=Math.min(q*dt/60,ca.litres*.48,Math.max(0,cb.capacity-cb.litres)+q*dt/60);if(v<=0)return;delta[a]-=v;delta[b]+=v;energy[a]-=v*ca.temp;energy[b]+=v*ca.temp;flows[a]+=q;this.transferred+=v;};
  if(oil){for(let i=0;i<n;i++)edge(i,(i+1)%n,this.q);}
  else {edge(0,1,this.q);edge(1,2,this.q);edge(2,3,this.q*thermostat);edge(3,4,this.q*thermostat);edge(2,4,this.q*(1-thermostat));edge(4,5,this.q);edge(5,0,this.q);}
  for(let i=0;i<n;i++){
   const c=this.cells[i],before=c.litres;c.litres=clamp(before+delta[i],0,c.capacity);
   if(c.litres>1e-8)c.temp=clamp((before*c.temp+energy[i])/c.litres,24,260);
   const target=oil?temp+(i===4?8:0):i===3?temp-m.relay.fan*12:i===1?temp+7:temp;
   c.temp=approach(c.temp,target,.12,dt);c.flow=flows[i];c.phase=(c.phase+flows[i]*dt/(60*c.capacity))%1;
   c.bubbles=approach(c.bubbles,this.vapour+clamp(1-c.litres/c.capacity,0,1)*.5,2,dt);
  }
  this.setInventory(inventory); // remove floating-point drift and overflow only, never add beyond inventory.
 }
 snapshot(){return {cells:this.cells.map(c=>({...c})),q:this.q,pressure:this.pressure,filterLoad:this.filterLoad,vapour:this.vapour,bypass:this.bypass};}
 restore(s,total){if(s&&Array.isArray(s.cells)&&s.cells.length===6)this.cells.forEach((c,i)=>{const d=s.cells[i]||{};c.litres=finite(d.litres,0,c.capacity,c.capacity);c.temp=finite(d.temp,24,260,90);c.phase=finite(d.phase,0,1);c.bubbles=finite(d.bubbles,0,1);});this.setInventory(total);}
}
class Fragments{
 constructor(seed=417){this.seed=seed>>>0;this.bodies=[];this.jamByCylinder=new Uint8Array(4);this.nextId=1;this.impacts=0;this.jamCount=0;this.resistance=0;this.impactEnergy=0;this.dust=0;this.scrape=0;this.cooldown=0;this.events=[];}
 random(){this.seed=(1664525*this.seed+1013904223)>>>0;return this.seed/4294967296;}
 add(cylinder,kind='metal',zone='case',x=null,y=null){
  if(this.bodies.length>=CAP){this.dust=Math.min(1,this.dust+.0005);return null;}
  const r=kind==='rod'?8:kind==='ring'?2.6:2+this.random()*4;
  const p={id:this.nextId++,cylinder:clamp(cylinder,0,3),kind,zone,x:x??XS[cylinder]+(this.random()-.5)*40,y:y??(zone==='chamber'?244:440),vx:(this.random()-.5)*150,vy:-20-this.random()*130,r,mass:(kind==='rod'?.055:.006)*(r/4),a:this.random()*TAU,w:(this.random()-.5)*9,heat:180,contacts:0,pinch:0,jammed:false,jamAge:0,releaseCount:0};
  this.bodies.push(p);return p;
 }
 breakCylinder(i,m){for(let j=0;j<11;j++)this.add(i,j===0?'rod':j<4?'ring':'metal','case');this.add(i,'ring','chamber',XS[i]+42,242);}
 contact(p,nx,ny,depth,vx=0,vy=0){
  if(depth<=0)return;
  p.x+=nx*(depth+.002);p.y+=ny*(depth+.002);
  const rvx=p.vx-vx,rvy=p.vy-vy,vn=rvx*nx+rvy*ny;
  if(vn<0){const impulse=-1.18*vn*p.mass;p.vx+=nx*impulse/p.mass;p.vy+=ny*impulse/p.mass;
   const tx=-ny,ty=nx,vt=rvx*tx+rvy*ty,friction=clamp(-vt*p.mass,-impulse*.38,impulse*.38);
   p.vx+=tx*friction/p.mass;p.vy+=ty*friction/p.mass;p.w+=friction/(p.mass*p.r)*.14;
   const energy=.5*p.mass*(vn*.001)**2;this.impactEnergy+=energy;
   if(-vn>40){this.impacts++;if(this.cooldown<=0){this.events.push({type:'impact',cylinder:p.cylinder,level:clamp(-vn/500,.08,1),x:p.x});this.cooldown=.07;}}
   this.scrape=Math.max(this.scrape,Math.min(1,Math.abs(vt)/400));
  }
  p.contacts++;
 }
 circle(p,x,y,r,vx,vy){const dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy),pen=p.r+r-d;if(pen>0)this.contact(p,dx/(d||1),dy/(d||1),pen,vx,vy);}
 box(p,x0,y0,x1,y1){
  const xx=clamp(p.x,x0,x1),yy=clamp(p.y,y0,y1),dx=p.x-xx,dy=p.y-yy,d=Math.hypot(dx,dy);
  if(d>0){if(d<p.r)this.contact(p,dx/d,dy/d,p.r-d);}
  else{const ds=[p.x-x0,x1-p.x,p.y-y0,y1-p.y],i=ds.indexOf(Math.min(...ds));this.contact(p,[-1,1,0,0][i],[0,0,-1,1][i],p.r+ds[i]);}
 }
 step(dt,m){
  this.cooldown=Math.max(0,this.cooldown-dt);this.scrape*=Math.exp(-dt*9);this.impactEnergy=0;let jamTorque=0;
  const count=Math.max(1,Math.ceil(dt*240)),h=dt/count,phase=m.phase;
  for(let n=0;n<count;n++){
   const a=phase-m.shaftSpeed*dt+(n+1)*h*m.shaftSpeed;
   const moving=XS.map((x,i)=>pistonGeometry(a,i,x)),previous=XS.map((x,i)=>pistonGeometry(a-m.shaftSpeed*h,i,x));
   const geo=moving.map((g,i)=>m.cylinders[i].active?g:pistonGeometry(m.cylinders[i].freeze,i,XS[i]));
   for(const p of this.bodies){
    p.contacts=0;p.heat=approach(p.heat,m.block,.2,h);
    if(p.jammed){
     p.jamAge+=h;jamTorque+=(p.kind==='rod'?3.5:1.2)/count;
     p.heat=Math.min(390,p.heat+h*m.rpm*.002);this.scrape=Math.max(this.scrape,m.rpm>0?.45:0);
     // A pinched chip is sheared or freed by repeated crank contacts, not a permanent magical anchor.
     if(m.rpm>900&&p.jamAge>3.5+p.r*.3&&p.releaseCount<2){p.jammed=false;p.jamAge=0;p.r=Math.max(1.4,p.r*.72);p.releaseCount++;p.vx=-35;p.vy=80;p.y+=p.zone==='chamber'?0:8;this.dust=clamp(this.dust+.006,0,1);}
     else continue;
    }
    p.vy+=620*h;p.vx*=Math.exp(-h*.2);p.vy=clamp(p.vy,-850,850);p.vx=clamp(p.vx,-850,850);p.x+=p.vx*h;p.y+=p.vy*h;p.a=(p.a+p.w*h)%TAU;p.w*=Math.exp(-h*.5);
    if(p.zone==='chamber'){
     const x=XS[p.cylinder],g=geo[p.cylinder],left=x-48,right=x+48,top=232;
     const cy=m.cylinders[p.cylinder];
     const bottom=cy.failure==='ejected'?415:Math.max(top+2*p.r+.05,g.top);
     if(p.x-p.r<left)this.contact(p,1,0,left-(p.x-p.r));if(p.x+p.r>right)this.contact(p,-1,0,p.x+p.r-right);
     if(p.y-p.r<top)this.contact(p,0,1,top-p.y+p.r);
     if(p.y+p.r>bottom){const before=cy.active?previous[p.cylinder]:g;const v=(g.top-before.top)/h;this.contact(p,0,-1,p.y+p.r-bottom,0,v);}
     if(cy.failure==='ejected'&&p.y+p.r>=414){p.zone='case';p.y=421+p.r;}
     else if(bottom-top<2*p.r+1||Math.abs(p.x-x)>40&&m.rpm>0&&g.top<p.y+p.r+8){p.pinch+=h;if(p.pinch>.045){p.jammed=true;p.jamAge=0;p.vx=p.vy=0;this.events.push({type:'jam',cylinder:p.cylinder,level:.65});}}
     else p.pinch=Math.max(0,p.pinch-h*.3);
    }else{
     // Oil-pan flange, cylinder-bank underside and internal bearing bulkheads.
     if(p.x-p.r<305)this.contact(p,1,0,305-p.x+p.r);if(p.x+p.r>890)this.contact(p,-1,0,p.x+p.r-890);
     if(p.y-p.r<417)this.contact(p,0,1,417-p.y+p.r);if(p.y+p.r>548)this.contact(p,0,-1,p.y+p.r-548);
     for(const xx of[307,445,589,733,871])this.box(p,xx-10,442,xx+10,478);
     for(let i=0;i<4;i++){
      const g=moving[i],v1=previous[i];
      this.circle(p,g.crankX,g.crankY,18,(g.crankX-v1.crankX)/h,(g.crankY-v1.crankY)/h);
      const xx=XS[i]-(g.crankX-XS[i])*.75,yy=460-(g.crankY-460)*.75;
      this.circle(p,xx,yy,22,-(g.crankX-v1.crankX)*.75/h,-(g.crankY-v1.crankY)*.75/h);
     }
     // Contact against a rotating web and a fixed web/pan pinches a fragment.
     if(p.contacts>=2){p.pinch+=h;if(p.pinch>.06){p.jammed=true;p.jamAge=0;p.vx=p.vy=0;this.events.push({type:'jam',cylinder:p.cylinder,level:.8});}}
     else p.pinch=Math.max(0,p.pinch-h*.3);
     // Final projection prevents fast rotors pushing a fragment through the shell.
     p.x=clamp(p.x,305+p.r,890-p.r);p.y=clamp(p.y,417+p.r,548-p.r);
    }
   }
   // Finite pair contacts: broad phase by distance; 64 bodies means at most 2016 pairs.
   this.bodies.sort((a,b)=>a.x-b.x);
   for(let i=0;i<this.bodies.length;i++)for(let j=i+1;j<this.bodies.length;j++){
    const p=this.bodies[i],q=this.bodies[j];if(q.x-p.x>18)break;if(p.zone!==q.zone||p.zone==='chamber'&&p.cylinder!==q.cylinder)continue;
    const dx=p.x-q.x,dy=p.y-q.y,rr=p.r+q.r;if(Math.abs(dx)>rr||Math.abs(dy)>rr)continue;
    const d=Math.hypot(dx,dy);if(d>=rr||d<.001)continue;
    const nx=dx/d,ny=dy/d,penetration=rr-d,w1=p.jammed?0:1/p.mass,w2=q.jammed?0:1/q.mass,den=w1+w2;if(!den)continue;
    p.x+=nx*penetration*w1/den;q.x-=nx*penetration*w2/den;p.y+=ny*penetration*w1/den;q.y-=ny*penetration*w2/den;
    const vn=(p.vx-q.vx)*nx+(p.vy-q.vy)*ny;if(vn<0){const k=-vn*1.1/den;p.vx+=nx*k*w1;p.vy+=ny*k*w1;q.vx-=nx*k*w2;q.vy-=ny*k*w2;}
   }
  }
  for(const p of this.bodies){if(p.zone==='case'){p.x=clamp(p.x,305+p.r,890-p.r);p.y=clamp(p.y,417+p.r,548-p.r);}}
  this.jamCount=0;this.jamByCylinder.fill(0);for(const p of this.bodies)if(p.jammed){this.jamCount++;this.jamByCylinder[p.cylinder]++;}
  this.resistance=approach(this.resistance,Math.min(28,jamTorque+this.impactEnergy/Math.max(.001,dt)*.06),8,dt);
  if(m.rpm>0)this.dust=clamp(this.dust+this.jamCount*dt*.00025,0,1);
  if(this.events.length>12)this.events.length=12;
 }
 snapshot(){return {seed:this.seed,nextId:this.nextId,impacts:this.impacts,dust:this.dust,bodies:this.bodies.map(b=>({...b}))};}
 static restore(s){const w=new Fragments();if(!s||typeof s!=='object')return w;w.seed=finite(s.seed,0,4294967295,417)>>>0;w.impacts=finite(s.impacts,0,1e12);w.dust=finite(s.dust,0,1);
  for(const d of Array.isArray(s.bodies)?s.bodies.slice(0,CAP):[]){if(!d||typeof d!=='object')continue;const i=Math.floor(finite(d.cylinder,0,3)),zone=d.zone==='chamber'?'chamber':'case',p=w.add(i,['metal','ring','rod'].includes(d.kind)?d.kind:'metal',zone);if(!p)break;
   for(const [k,lo,hi]of[['r',1.4,9],['mass',.002,.2],['a',0,TAU],['w',-15,15],['heat',24,390],['releaseCount',0,2]])p[k]=finite(d[k],lo,hi,p[k]);
   p.x=finite(d.x,zone==='case'?305+p.r:XS[i]-48+p.r,zone==='case'?890-p.r:XS[i]+48-p.r,XS[i]);p.y=finite(d.y,zone==='case'?417+p.r:232+p.r,zone==='case'?548-p.r:414-p.r,zone==='case'?520:240);
   p.vx=finite(d.vx,-850,850);p.vy=finite(d.vy,-850,850);p.jammed=d.jammed===true;p.jamAge=finite(d.jamAge,0,1e9);
  }w.seed=finite(s.seed,0,4294967295,417)>>>0;w.jamCount=w.bodies.filter(b=>b.jammed).length;return w;
 }
}
class Engine extends Prior{
 constructor(seed=7193){super(seed);this.oilCircuit=new Circuit('oil');this.waterCircuit=new Circuit('water');this.fragments=new Fragments(seed^1234);this.exhaust={pressure:0,leak:0,soot:0,manifold:165,resonator:70,tail:35,oil:0,steam:0,carbon:0,pulse:0};this.ringShed=[false,false,false,false];this.collisionCooldown=0;}
 emit(type,cylinder,message){super.emit(type,cylinder,message);if(type==='cylinder'&&this.fragments)this.fragments.breakCylinder(cylinder,this);}
 oilPressureTarget(){const p=super.oilPressureTarget();return p*(this.oilCircuit?1-this.oilCircuit.filterLoad*.42+this.oilCircuit.bypass*.22:1);}
 integrateShaft(dt,t){super.integrateShaft(dt,t);const loss=Math.min(this.activeCount===1?3.2:28,(this.fragments?.resistance||0)+(this.exhaust?.pressure||0)*.13);this.rpm=Math.max(380,this.rpm-loss/DYNO.inertia*dt*60/TAU);this.shaftDriveNm-=loss;this.netTorqueNm-=loss;}
 advanceThermal(dt,t,active){super.advanceThermal(dt,t,active);if(this.waterCircuit){const gaslock=this.waterCircuit.vapour*.85;const s=this.profile==='stress'?8:1;this.block=clamp(this.block+gaslock*t*dt*s*.6,45,265);this.oilTemp=clamp(this.oilTemp+(this.fragments.resistance||0)*this.rpm/9550*dt*s/80,35,245);}}
 step(dt,g=0,b=0){if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.05);super.step(dt,g,b);
  this.fragments.step(dt,this);this.oilCircuit.step(dt,this,this.fragments.dust);this.waterCircuit.step(dt,this,0);this.collisionCooldown=Math.max(0,this.collisionCooldown-dt);
  if(this.fragments.events.length){const ev=this.fragments.events.splice(0);if(this.collisionCooldown<=0){const e=ev.find(x=>x.type==='jam')||ev[0];this.events.push({...e,time:this.time,message:e.type==='jam'?'Осколок зажат между деталями':'Удар осколка внутри блока'});if(this.events.length>32)this.events.shift();this.collisionCooldown=.09;}}
  for(const cy of this.cylinders){if(!this.ringShed[cy.id]&&cy.active&&cy.wear>.46){this.ringShed[cy.id]=true;const g=pistonGeometry(this.phase,cy.id,XS[cy.id]);this.fragments.add(cy.id,'ring','chamber',XS[cy.id]+44,Math.max(235,g.top-6));}
   if(cy.active){const jam=this.fragments.jamByCylinder[cy.id];if(jam&&this.rpm>0){cy.contact.liner=clamp(cy.contact.liner+jam*dt*.0008,0,1);cy.contact.rings=clamp(cy.contact.rings+jam*dt*.0004,0,1);cy.compression=Math.max(cy.last?.22:.1,cy.compression*(1-jam*.015));}}
  }
  const e=this.exhaust,on=this.ignition==='running';e.leak=clamp(this.components.exhaust*.55+this.gasket*.10,0,.75);e.pulse=approach(e.pulse,on?this.exhaustPulse:0,14,dt);
  e.pressure=approach(e.pressure,on?(this.flowGps*.052+e.pulse*2.3)*(1-e.leak*.7):0,9,dt);
  e.manifold=approach(e.manifold,this.headerTemp,.12,dt);e.resonator=approach(e.resonator,this.ambient+(e.manifold-this.ambient)*.57,.05,dt);e.tail=approach(e.tail,this.ambient+(e.resonator-this.ambient)*.6,.06,dt);
  e.oil=on&&this.oil>.001?this.oilSmoke:0;e.steam=on&&this.coolantLevel>.001?this.gasket*this.coolantLevel:0;e.carbon=on?clamp((.95-this.lambda)*3*this.throttle,0,.3):0;e.soot=clamp(e.soot+e.carbon*dt*.001,0,1);
 }
 snapshot(){return {...super.snapshot(),version:7,fragments:this.fragments.snapshot(),oilCircuit:this.oilCircuit.snapshot(),waterCircuit:this.waterCircuit.snapshot(),exhaust:{...this.exhaust},ringShed:this.ringShed.slice()};}
 static restore(d){const e=new Engine();if(!d||![1,2,3,4,5,6,7].includes(d.version)||!Array.isArray(d.cylinders)||d.cylinders.length!==4)return e;Object.assign(e,Prior.restore({...d,version:Math.min(d.version,6)}));
  e.fragments=Fragments.restore(d.fragments);e.oilCircuit=new Circuit('oil');e.waterCircuit=new Circuit('water');e.oilCircuit.restore(d.oilCircuit,e.oil);e.waterCircuit.restore(d.waterCircuit,e.coolantLevel*6);
  for(const k of ['manifold','resonator','tail'])e.exhaust[k]=finite(d.exhaust?.[k],24,900,e.exhaust[k]);e.exhaust.soot=finite(d.exhaust?.soot,0,1);e.ringShed=e.cylinders.map((c,i)=>d.ringShed?.[i]===true||!c.active);e.events=[];return e;
 }
}
const api={...base,Engine,Circuit,Fragments,FRAGMENT_CAP:CAP};if(typeof module!=='undefined'&&module.exports)module.exports=api;else Object.assign(root.Piston,api);
})(typeof globalThis!=='undefined'?globalThis:this);
