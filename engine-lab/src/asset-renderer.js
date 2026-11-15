/* Original SVG hardware, rasterized once. Analogue flow belongs to the model.
 * Engine parts move in engine space; radiator and hoses stay on the test stand.
 */
(function(root){
'use strict';
const {Renderer:Base,clamp,TAU}=root.Piston;
function measurePath(points){
 const lengths=new Float64Array(points.length);let total=0;
 for(let i=1;i<points.length;i++){total+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);lengths[i]=total;}
 return {points,lengths,total};
}
function samplePath(route,u,out=[0,0,0]){
 const d=clamp(u,0,1)*route.total,ps=route.points,ls=route.lengths;
 for(let i=1;i<ps.length;i++)if(d<=ls[i]||i===ps.length-1){const len=ls[i]-ls[i-1],t=(d-ls[i-1])/Math.max(len,1e-9);out[0]=ps[i-1][0]+(ps[i][0]-ps[i-1][0])*t;out[1]=ps[i-1][1]+(ps[i][1]-ps[i-1][1])*t;out[2]=Math.atan2(ps[i][1]-ps[i-1][1],ps[i][0]-ps[i-1][0]);return out;}
 out[0]=ps[0]?.[0]||0;out[1]=ps[0]?.[1]||0;out[2]=0;return out;
}
class Atlas{
 constructor(){this.parts=new Map();this.failed=[];this.bytes=0;this.promise=Promise.all(Object.entries(root.Piston.MECHANICAL_SVG||{}).map(async([id,svg])=>{
  const img=new Image();await new Promise(resolve=>{img.onload=resolve;img.onerror=()=>{this.failed.push(id);resolve();};img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);});
  if(!img.naturalWidth)return;
  const canvas=document.createElement('canvas');canvas.width=img.naturalWidth*2;canvas.height=img.naturalHeight*2;
  canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);this.bytes+=canvas.width*canvas.height*4;this.parts.set(id,canvas);
 }));}
 draw(c,id,x,y,w,h){const cv=this.parts.get(id);if(!cv)return false;c.drawImage(cv,x,y,w,h);return true;}
}
let atlas;
const PARTS={radiator:{x:145,y:345,z:2.1,label:'РАДИАТОР / ВЕНТИЛЯТОР'},filter:{x:274,y:499,z:2.5,label:'ФИЛЬТР / МАСЛЯНАЯ МАГИСТРАЛЬ'},pump:{x:251,y:315,z:2.3,label:'ПОМПА / ТЕРМОСТАТ'},exhaust:{x:1011,y:302,z:2.4,label:'ВЫПУСК / РАЗРЕЗ ГЛУШИТЕЛЯ'},sump:{x:595,y:473,z:2.1,label:'КАРТЕР / КОНТАКТЫ ОСКОЛКОВ'}};
class Renderer extends Base{
 constructor(canvas){super(canvas);this.atlas=atlas||(atlas=new Atlas());this.partFocus=null;this.flowPoint=[0,0,0];this.flowEnd=[0,0,0];this.inspectLabels=true;this.atlas.promise.then(()=>{if(this.currentModel)this.render(this.currentModel);});}
 setFocus(i){this.partFocus=null;super.setFocus(i);}
 setPart(id){if(!PARTS[id])return;this.partFocus=id;this.zoom=PARTS[id].z;}
 pipe(path,cell,color,width=10){
  const c=this.c,fill=clamp(cell.litres/cell.capacity,0,1),water=color!=='#877455'&&color!=='#8b7652',route=measurePath(path);
  this.line(path,'#0c171d',width+4);this.line(path,'#83969a',width+1.5);this.line(path,'#172c34',width);
  c.save();c.globalAlpha=fill*.88;this.line(path,water?'#355b66':'#443924',Math.max(1,width-1.7));c.globalAlpha=1;
  if(fill>.005){
   this.line(path,water?'rgba(123,175,186,.44)':'rgba(170,139,82,.35)',Math.max(.7,width*.33));
   const count=this.quality<.6?5:Math.min(19,Math.max(6,Math.ceil(route.total/25)));
   for(let j=0;j<count;j++){
    const u=(cell.phase+j/count)%1;if(u>fill)continue;
    const a=samplePath(route,u,this.flowPoint),b=samplePath(route,Math.min(1,u+(water?.017:.01)),this.flowEnd);
    if(cell.flow>.003)this.line([[a[0],a[1]],[b[0],b[1]]],water?'rgba(180,222,226,.75)':'rgba(194,164,108,.7)',Math.max(.65,width*.20));
    if(cell.bubbles>.04&&j%2===0){c.save();c.translate(a[0],a[1]);c.rotate(a[2]);this.ellipse(0,0,1.7+cell.bubbles*2.7,width*.22,'rgba(13,29,35,.68)','rgba(202,224,220,.58)',.65);c.restore();}
   }
  }
  // The highlight stays on the transparent hose, not on the travelling liquid.
  this.line(path,'rgba(211,231,228,.18)',.6);
  if(width>5)for(const u of [.045,.955]){const p=samplePath(route,u,this.flowPoint);c.save();c.translate(p[0],p[1]);c.rotate(p[2]);this.rr(-2,-width*.65,4,width*1.3,.5,'#789093','#c0ccc5',.6);this.line([[-.5,-width*.65],[-.5,width*.65]],'#324a56',.8);c.restore();}
  c.restore();
 }
 relay(m){
  super.relay(m);
  if(!this.atlas.parts.size)return;
  const c=this.c;
  this.atlas.draw(c,'radiator-core',36,291,117,172);
  this.circle(93,365,43,'rgba(12,25,32,.5)','#627c86',1.1);
  c.save();c.translate(93,365);c.rotate(m.fanAngle||0);this.atlas.draw(c,'fan-rotor',-43,-43,86,86);c.restore();
  this.text(Math.round(m.relay.fan*2200)+' rpm',94,438,8,'#c1cdd0','center');
  this.line([[53,447],[133,447]],'#98aaad',.6);
  this.text('R1 / '+Math.round(m.waterCircuit.cells[3].temp)+' °C',94,457,7,'#adbdc3','center');
 }
 externalFluids(m){
  super.externalFluids(m);const c=this.c;
  // Keep transparent runs visible at actual inventory, including empty dry tubing.
  this.atlas.draw(c,'filter-cutaway',235,528,45,55);
  const dirt=m.oilCircuit.filterLoad;c.save();c.globalAlpha=clamp(dirt*.65,0,.65);c.fillStyle='#30291b';c.fillRect(246,544,22,24);c.restore();
  this.rr(246,574,22,2,0,m.oilCircuit.bypass>.01?'#d2ae79':'#61727b');
  if(this.partFocus==='filter')this.text('ПЕРЕПУСК '+Math.round(m.oilCircuit.bypass*100)+'%',255,597,6,'#c3b08c','center');
  // Replace the old generic flange with a cut-open volute and a driven impeller.
  this.atlas.draw(c,'pump-cutaway',247,379,49,49);
  c.save();c.translate(271.5,403.5);c.rotate(m.phase*.62);this.atlas.draw(c,'pump-impeller',-16,-16,32,32);c.restore();
  this.atlas.draw(c,'thermostat-cutaway',237,233,48,48);
  const open=clamp((m.coolant-82)/13,0,1);this.line([[254,253-open*6],[270,253-open*6]],'#ceb887',2.3);
  this.text('T1',259,229,7,'#aebec3','center');
  // Clear inspection window: liquid meniscus, gas headspace, dry-level scale.
  const level=m.coolantLevel,y=213-level*42;
  this.rr(178,168,41,48,4,'#12272f','#afc2c1',.9);
  c.save();c.beginPath();c.rect(180,170,37,44);c.clip();c.fillStyle='rgba(71,116,126,.72)';c.fillRect(180,y,37,46);
  const slosh=m.rpm>0?Math.sin(m.phase*.4)*.5:0;
  this.line([[180,y+slosh],[198,y-.6],[217,y-slosh]],'#b5d6d7',.9);
  if(level>.05&&m.waterCircuit.vapour>.04)for(let i=0;i<6;i++){const phase=(m.waterCircuit.cells[0].phase+i*.173)%1;this.ellipse(184+(i%4)*8,212-phase*42*level,1.1,1.8,null,'rgba(198,220,219,.6)',.6);}
  c.restore();this.line([[182,173],[182,207]],'rgba(220,239,234,.28)',1.8);
  for(let j=0;j<5;j++)this.line([[213,175+j*8],[218,175+j*8]],'#b7cbcb',.6);
 }
 exhaust(m){
  super.exhaust(m);const c=this.c,e=m.exhaust;
  if(!this.atlas.parts.size)return;
  this.atlas.draw(c,'muffler-cutaway',990,290,116,70);
  const route=measurePath([[1001,319],[1022,319],[1022,334],[1051,334],[1051,320],[1092,320]]);
  if(m.ignition==='running')for(let i=0;i<10;i++){const u=(m.phase/(TAU*2)+i/10)%1,p=samplePath(route,u);this.ellipse(p[0],p[1],2.1,.85,`rgba(205,195,172,${.14+e.pulse*.4})`);}
  const soot=clamp(e.soot+e.oil*.3,0,1);this.ellipse(1131,359,3.3,6.2,'#070f14');
  if(soot>.02){c.save();c.globalAlpha=soot*.7;this.ellipse(1126,354,5,4,'#15191a');c.restore();}
  this.line([[984,273],[984,288]],'#c1bba9',.8);
  // Heat discoloration is localized to stainless joints and deposits, not emissive metal.
  const heat=clamp((e.manifold-320)/350,0,1);if(heat>.01){c.save();c.globalAlpha=heat*.38;this.line([[965,271],[975,280],[975,300]],'#91694b',6);this.line([[967,270],[978,282]],'#6c718b',1.5);c.restore();}
 }
 drawInternal(m){
  super.drawInternal(m);
  if(this.mode!=='damage'&&this.partFocus!=='sump')return;
  const c=this.c;c.save();this.engineTransform();
  for(const p of m.fragments.bodies){if(!p.jammed)continue;const a=clamp(p.heat/390,.15,1);this.line([[p.x-p.r-2,p.y+p.r+2],[p.x+p.r+2,p.y+p.r+2]],`rgba(197,160,108,${a})`,.8);}
  c.restore();
 }
 render(m){
  if(!this.partFocus||this.zoom<=1)return super.render(m);
  const focus=PARTS[this.partFocus],c=this.c;this.currentModel=m;
  c.setTransform(1,0,0,1,0,0);c.fillStyle='#181e21';c.fillRect(0,0,this.canvas.width,this.canvas.height);
  c.setTransform(this.scale,0,0,this.scale,this.offsetX,this.offsetY);c.globalAlpha=1;c.save();c.beginPath();c.rect(0,0,1200,680);c.clip();
  c.translate(600,340);c.scale(focus.z,focus.z);c.translate(-focus.x,-focus.y);
  this.background(m);this.drawSmoke(false);this.engine(m);this.particles();this.drawSmoke(true);c.restore();
  this.rr(24,27,350,27,2,'#17252d','#647983',1);this.text(focus.label+' / ×'+focus.z,37,45,10,'#c7d3d6');
 }
 reset(){super.reset();this.partFocus=null;}
}
Object.assign(root.Piston,{Renderer,measurePath,samplePath,PARTS});
})(window);
