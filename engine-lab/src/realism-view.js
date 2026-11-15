/* Mechanical cutaway: finite-flow inspection windows and model-owned debris.
 * Geometry is never integrated here. Rendering the paused engine is pure.
 */
(function(root){
'use strict';
const {Renderer:Prior,clamp,TAU}=root.Piston,XS=[373,517,661,805];
function point(path,u){let lengths=[],total=0;for(let i=1;i<path.length;i++){const d=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]);lengths.push(d);total+=d;}let s=clamp(u,0,1)*total;for(let i=0;i<lengths.length;i++){if(s<=lengths[i]||i===lengths.length-1){const t=s/Math.max(.001,lengths[i]);return [path[i][0]+(path[i+1][0]-path[i][0])*t,path[i][1]+(path[i+1][1]-path[i][1])*t];}s-=lengths[i];}return path[0];}
class Renderer extends Prior{
 constructor(canvas){super(canvas);this.internalGlow=0;this.leakAcc=0;}

 event(e,m){
  if(['impact','jam'].includes(e.type)){this.impulse=Math.max(this.impulse,e.type==='jam'?6:1+(e.level||0)*2);return;}
  if(e.type==='cylinder'){this.impulse=18;for(let i=0;i<12;i++)this.puff(XS[e.cylinder],218,'oil',.9);return;}
  super.event(e,m);
 }
 fragment(x,y,kind='chip',force=1){
  // Internal metal belongs to the model, not the old external firework emitter.
  if(x>290&&x<915&&y>230&&y<552)return;
  super.fragment(x,y,kind,force);
 }
 restoreDebris(m){this.debris=[];}
 puff(x,y,kind='exhaust',power=1){
  const m=this.currentModel;if(!m)return;
  if(kind==='exhaust'&&m.ignition!=='running')return;
  if(kind==='steam'&&(m.coolantLevel<.001||m.steam<.01))return;
  if(kind==='oil'&&(m.oilSmoke<.001||m.film<.0001&&m.oil<.001))return;
  const max=Math.round((this.performanceMode==='eco'?150:260)*this.quality);if(this.smoke.length>=max)return;
  const ex=kind==='exhaust',leak=kind==='exhaust-leak',e=m.exhaust||{};
  if(ex){x=1130;y=360;power=.03+(e.oil||0)*1.2+(e.steam||0)*1.5+(e.carbon||0)*.55;}
  if(leak){power=(e.leak||0)*.8;}
  const p=this.world(x,y),steam=kind==='steam'||ex&&(e.steam||0)>(e.oil||0),oil=kind==='oil'||ex&&(e.oil||0)>.07;
  this.smoke.push({x:p.x,y:p.y,vx:ex?5+(e.pulse||0)*12:leak?20:(this.rand()-.5)*30,vy:ex?-28-this.rand()*14:-25-this.rand()*35,age:0,life:3.2+this.rand()*1.6,r:ex?5+this.rand()*7:9+this.rand()*12,grow:ex?25+power*14:17+power*18,rot:this.rand()*TAU,spin:(this.rand()-.5)*.35,tex:(steam?6:oil?3:0)+Math.floor(this.rand()*3),alpha:clamp(power,.02,1.65),front:!ex&&this.rand()>.45});
 }
 update(dt,m){super.update(dt,m);this.leakAcc+=dt*(m.ignition==='running'?m.exhaust.leak*28:0)*this.quality;
  while(this.leakAcc>1){this.leakAcc--;this.puff(986,270,'exhaust-leak',1);}
 }
 pipe(path,cell,color,width=10){
  const c=this.c,fill=clamp(cell.litres/cell.capacity,0,1);
  this.line(path,'#0c151b',width+5);this.line(path,'#71848a',width+2);this.line(path,'#182a31',width);
  c.save();c.globalAlpha=.8*fill;this.line(path,color,width-2);c.globalAlpha=1;
  if(fill>0&&cell.flow>.005){const n=this.quality<.6?6:11;
   for(let j=0;j<n;j++){const u=(cell.phase+j/n)%1;if(u>fill)continue;const a=point(path,u),b=point(path,Math.min(1,u+.016));this.line([a,b],color==='#669ba4'?'#bad4d4':'#c1a57c',width*.32);}
  }
  if(cell.bubbles>.03&&fill>0)for(let j=0;j<6;j++){const p=point(path,(cell.phase+j*.164)%1);this.ellipse(p[0],p[1],1.2+cell.bubbles*1.7,1.4,null,'rgba(223,233,225,.6)',.7);}
  this.line(path,'rgba(206,224,224,.12)',.8);c.restore();
  for(const t of[.06,.94]){const p=point(path,t);this.circle(p[0],p[1],width*.7,null,'#a4b2b3',1.1);}
 }
 externalFluids(m){
  const w=m.waterCircuit.cells,o=m.oilCircuit.cells;
  const hot=this.world(285,251),cold=this.world(288,397);
  this.pipe([[hot.x,hot.y],[253,251],[241,280],[166,280],[151,312]],w[2],'#669ba4',11);
  this.pipe([[151,431],[163,470],[268,470],[cold.x,cold.y]],w[4],'#669ba4',11);
  this.pipe([[246,278],[259,303],[259,386],[cold.x,cold.y]],w[5],'#63878c',6);
  // Expansion tank: glass inspection window, fluid surface, cap and a return hose.
  this.rr(170,160,57,67,7,'#233139','#819195',1.2);this.rr(178,169,41,47,4,'#142228','#485b63',.8);
  const h=42*m.coolantLevel;this.rr(180,213-h,37,h,2,'rgba(101,151,158,.65)');
  this.line([[180,213-h],[217,213-h]],'#9cbdc0',1);
  for(let j=0;j<5;j++)this.line([[213,175+j*8],[219,175+j*8]],'#a4b2b5',.7);
  this.rr(184,151,29,10,2,'#566065','#b2bcb7',1);this.line([[197,227],[197,251],[251,251]],'#586d75',4);
  this.text('ОЖ',198,142,9,'#a6c4cb','center');this.text(m.waterCircuit.q.toFixed(1)+' л/мин',200,242,8,'#9abdc5','center');
  const p=this.world(316,510),q=this.world(302,414);
  this.pipe([[p.x,p.y],[276,520],[258,540],[258,563],[283,563],[q.x,q.y]],o[2],'#877455',7);
  this.rr(243,535,28,30,5,'#78848a','#c1c9c5',1);this.rr(247,541,20,13,2,'#17272d','#52666d',.7);
  this.text('F1',257,551,7,'#c2b393','center');
 }
 lubrication(m){
  const c=this.c,f=m.oilCircuit,water=m.waterCircuit;
  // Galleries are behind the visible rods, not a solid slab over them.
  if(this.mode==='oil'||this.mode==='section'){
   c.save();c.globalAlpha=this.mode==='oil'?.95:.55;
   const path=[[347,539],[318,539],[318,485],[302,485],[302,422],[888,422]];
   this.pipe(path,f.cells[3],'#877455',5);
   for(let i=0;i<4;i++){const x=XS[i];this.pipe([[x,422],[x,454]],f.cells[4],'#8b7652',3);
    if(m.pressure>.4&&m.ignition==='running'){const p=m.cylinders[i];if(p.active){const a=clamp(m.pressure/5,0,1);this.line([[x-44,419],[x-34,394],[x-22,384]],`rgba(168,141,97,${a*.45})`,1);}}
   }
   c.restore();
  }
  const fill=clamp(f.cells[0].litres/f.cells[0].capacity,0,1),y=546-fill*20;
  this.rr(324,y,544,546-y,1,'rgba(56,44,27,.52)');this.line([[324,y],[450,y+.6*Math.sin(m.phase)],[698,y-1],[868,y]],'#776b53',.8);
  // Water sleeves use transported flow phase, not wall-clock decorative particles.
  for(const x of XS)for(const side of[-1,1]){
   const cell=water.cells[1];if(cell.litres<.001)continue;
   for(let j=0;j<(this.mode==='oil'?5:3);j++){const y=246+((cell.phase+j*.23)%1)*151;this.line([[x+side*57,y],[x+side*57,y+5]],'rgba(147,189,195,.65)',1.2);}
  }
 }
 exhaust(m){
  const c=this.c,e=m.exhaust,heat=clamp((e.manifold-260)/450,0,1),metal=heat>.35?'#81766b':'#7d898d';
  // Four primary runners join one collector. Geometry behind the casting is occluded normally.
  for(let i=0;i<4;i++){
   const path=[[XS[i]+47,194],[XS[i]+68,181],[925+i*13,202+i*11],[969,271]];
   this.line(path,'#131c22',16);this.line(path,metal,11);this.line(path,'rgba(202,209,199,.3)',1);
  }
  this.bake('exhaust-body12',Math.floor(heat*8),[954,244,188,154],()=>{
   this.rr(958,248,29,35,6,this.metal(958,29),'#a7b0aa',1);this.line([[973,282],[973,315],[1005,315]],'#182229',23);this.line([[973,282],[973,315],[1005,315]],this.metal(963,24),17);
   this.rr(991,293,112,66,22,this.metal(991,112),'#c2c7ba',1.2);
   this.rr(1000,304,93,43,10,'#19292f','#718690',1);
   for(const x of[1021,1053,1079]){this.line([[x,306],[x,346]],'#66777b',3);this.line([[x+2,307],[x+2,346]],'#adb3a7',.7);}
   this.line([[1000,316],[1021,316],[1021,337],[1053,337],[1053,317],[1089,317]],'#6d7d7d',6);
   for(let j=0;j<12;j++)this.circle(1005+j*7,316,1.1,'#18232a');
   this.line([[1098,330],[1110,330],[1128,359]],'#1a262d',20);this.line([[1098,328],[1110,328],[1128,357]],'#859196',14);
   this.ellipse(1130,359,5,8,'#8b9391','#bcc1b5',1);this.ellipse(1131,359,3,5.8,'#070f14');
   for(const y of[255,278,294]){this.line([[963,y],[983,y]],'#404f55',2);for(let j=0;j<6;j++)this.line([[964+j*3,y],[965+j*3,y+2]],'#c1bab0',.6);}
   this.line([[1041,360],[1041,379],[1070,379]],'#6b797f',3);
  });
  // Pressure packets traverse baffles. They use the model pulse and flow, not arbitrary glow.
  if(m.ignition==='running')for(let i=0;i<8;i++){const u=(m.phase/(TAU*2)+i/8)%1;const p=point([[998,317],[1025,317],[1025,338],[1056,338],[1056,319],[1091,319]],u);this.ellipse(p[0],p[1],3,1.6,`rgba(168,157,139,${.10+e.pulse*.22})`);}
  if(e.leak>.15){this.fracture([[962,270],[968,272],[974,268],[984,273]],e.leak,2);}
  if(e.manifold>600){c.globalAlpha=clamp((e.manifold-600)/400,0,.18);this.line([[973,266],[973,304]],'#bf7952',11);c.globalAlpha=1;}
  this.text('КОЛЛЕКТОР / '+Math.round(e.manifold)+'°',1034,396,8,'#b4b2a5','center');
  this.text('ПРОТИВОДАВЛЕНИЕ '+e.pressure.toFixed(1)+' kPa',1034,410,7,'#98a8ac','center');
 }
 drawInternal(m){
  const c=this.c;c.save();this.engineTransform();
  // Only model particles are drawn. Their positions survive reload and zoom.
  for(const p of m.fragments.bodies){
   c.save();c.translate(p.x,p.y);c.rotate(p.a);
   if(p.kind==='ring'){c.beginPath();c.arc(0,0,p.r,.25,5.4);c.strokeStyle='#b6c3bc';c.lineWidth=1.6;c.stroke();}
   else if(p.kind==='rod'){this.poly([[-p.r,-p.r*.5],[-p.r*.5,-p.r],[-1,-p.r*.4],[p.r,-p.r*.7],[p.r*.7,p.r],[-p.r,p.r*.5]],'#788c95','#c5cec7',.7);this.circle(1,1,2,'#17262d');}
   else this.poly([[-p.r,0],[-p.r*.4,-p.r*.7],[p.r*.6,-p.r*.9],[p.r,p.r*.25],[0,p.r*.65]],p.jammed?'#a19a86':'#889aa2','#c7cfbf',.6);
   if(p.jammed){this.line([[-p.r-2,-p.r-3],[p.r+2,-p.r-3]],'#d1b07c',1.1);if(this.mode==='damage')this.circle(0,0,p.r+4,null,'#cea96c',.6);}
   c.restore();
  }
  c.restore();
 }
 engine(m){super.engine(m);this.externalFluids(m);this.drawInternal(m);}
 reset(){super.reset();this.leakAcc=0;}
}
root.Piston.Renderer=Renderer;
})(window);
