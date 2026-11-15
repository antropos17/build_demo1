/* Cached mechanical surfaces + half-resolution atmospheric pass.
   Static material details are baked once; moving assemblies keep their geometry. */
(function(root){
'use strict';
const {Renderer:Cutaway,clamp,TAU,pistonGeometry,cycleState,gasPressure}=root.Piston;
const X=[373,517,661,805],BEARINGS=[307,445,589,733,871];
const noise=n=>{const v=Math.sin(n*127.1+31.7)*43758.5453;return v-Math.floor(v);};
const COLORS=['#d5a477','#a89f94','#83a8b0','#babfc5'];
class Renderer extends Cutaway{
 constructor(canvas){super(canvas);this.cache=new Map();this.cacheHits=0;this.cacheMisses=0;this.patterns=new WeakMap();this.performanceMode='auto';this.pixelRatioLimit=1.5;this.renderCost=0;this.smokeLayer=document.createElement('canvas');this.smokeLayer.width=600;this.smokeLayer.height=340;this.smokeContext=this.smokeLayer.getContext('2d');this.extraSmoke=0;this.effectsClock=0;this.resize();}
 resize(){const box=this.canvas.getBoundingClientRect(),limit=this.pixelRatioLimit||1.5;const dpr=Math.min(devicePixelRatio||1,limit);this.canvas.width=Math.max(1,Math.round(box.width*dpr));this.canvas.height=Math.max(1,Math.round(box.height*dpr));this.scale=Math.min(this.canvas.width/1200,this.canvas.height/680);this.sy=this.scale;this.offsetX=(this.canvas.width-this.scale*1200)/2;this.offsetY=(this.canvas.height-this.scale*680)/2;this.quality=this.performanceMode==='eco'?.5:box.width<600?.7:1;}
 setPerformance(mode){this.performanceMode=['auto','high','eco'].includes(mode)?mode:'auto';this.pixelRatioLimit=mode==='high'?2:mode==='eco'?1:1.5;this.resize();}
 bake(slot,key,bounds,draw){
  key+=':'+Math.ceil(this.zoom||1);let entry=this.cache.get(slot);
  if(!entry||entry.key!==key){const [x,y,w,h]=bounds,scale=this.performanceMode==='high'||this.zoom>1?1.5:1;const cv=entry?.canvas||document.createElement('canvas');cv.width=Math.ceil(w*scale);cv.height=Math.ceil(h*scale);const cc=cv.getContext('2d');cc.setTransform(scale,0,0,scale,-x*scale,-y*scale);const saved=this.c;this.c=cc;try{draw();}finally{this.c=saved;}entry={canvas:cv,key,bounds};this.cache.set(slot,entry);this.cacheMisses++;}else this.cacheHits++;
  const [x,y,w,h]=bounds;this.c.drawImage(entry.canvas,x,y,w,h);
 }
 texture(x,y,w,h,alpha=.5){const c=this.c;let pattern=this.patterns?.get(c);if(!pattern){pattern=c.createPattern(this.castTexture,'repeat');this.patterns?.set(c,pattern);}c.save();c.globalAlpha=alpha;c.fillStyle=pattern;c.fillRect(x,y,w,h);c.restore();}
 background(m){const key=Math.floor(m.oil*12)+':'+this.stains.length;this.bake('background',key,[0,0,1200,680],()=>super.background(m));}
 block(m){const key=this.mode+':'+Math.floor(m.damage*14)+':'+Math.floor(m.coolantLevel*5)+':'+m.cylinders.map(c=>Math.floor(Math.max(c.contact.liner,c.wear*.22)*24)).join(',');this.bake('block',key,[270,200,675,359],()=>super.block(m));
  if(this.mode==='oil'&&m.coolantLevel>.01)for(const x of X)for(const side of[-1,1])for(let k=0;k<4;k++){const y=249+((this.t*26+k*37)%145);this.line([[x+side*57,y],[x+side*57,y+5]],'rgba(146,188,201,.75)',1.3);}
 }
 headCasting(m){this.bake('head-casting',Math.floor(m.gasket*12),[275,173,648,60],()=>this.uncachedHeadCasting(m));}
 pulley(x,y,r,phase){const c=this.c;c.save();c.translate(x,y);this.bake('pulley-base'+r,'fixed',[-r-2,-r-2,r*2+4,r*2+4],()=>{this.circle(0,0,r,'#263138','#8b9a9d',2);this.circle(0,0,r-5,this.metal(-r,r*2),'#18262d',1.5);});c.rotate(phase);this.bake('pulley-face'+r,'fixed',[-r,-r,r*2,r*2],()=>{for(let j=0;j<6;j++){this.c.save();this.c.rotate(j*TAU/6);this.ellipse(0,-r*.57,3.4,r*.22,'#26373e','#7d9095',.8);this.c.restore();}this.circle(0,0,r*.26,'#41535a','#b6c2c0',1);this.bolt(0,0,Math.max(2,r*.13));});c.restore();}
 pistonSurface(x,top,pin,cy){const key=Math.floor(cy.contact.skirt*22)+':'+Math.floor(cy.wear*7)+':'+Math.floor(cy.contact.crown*10)+':'+cy.active;const c=this.c;c.save();c.translate(x,top);this.bake('piston'+cy.id,key,[-50,-2,100,73],()=>this.uncachedPistonSurface(0,0,36,cy));c.restore();}
 rod(x1,y1,x2,y2,damage=0,broken=false){const c=this.c,len=Math.hypot(x2-x1,y2-y1);if(len<45){super.rod(x1,y1,x2,y2,damage,broken);return;}c.save();c.translate(x1,y1);c.rotate(-Math.atan2(x2-x1,y2-y1));this.bake('rod'+Math.floor(damage*6),Math.round(len)+':'+Math.floor(damage*6),[-19,-5,38,Math.ceil(len)+24],()=>super.rod(0,0,0,len,damage,broken));c.restore();}
 damages(m){const key=this.mode+':'+Math.floor(m.gasket*16)+':'+Math.floor(m.film*50)+':'+m.cylinders.map(c=>c.active+':'+Math.floor(c.contact.crack*20)+':'+Math.floor(c.contact.bearing*10)+':'+Math.floor(c.contact.liner*10)).join('|');this.bake('damage',key,[270,208,680,364],()=>super.damages(m));}
 drawSmoke(front){
  const q=this.smokeContext;q.setTransform(.5,0,0,.5,0,0);q.clearRect(0,0,1200,680);
  for(const p of this.smoke){if(p.front!==front||p.x+p.r<0||p.x-p.r>1200||p.y+p.r<0||p.y-p.r>680)continue;
   const fade=Math.min(1,p.age*7)*Math.max(0,1-p.age/p.life),windowFade=p.front&&p.x>322&&p.x<860&&p.y>238&&p.y<510?.22:1;
   q.globalAlpha=clamp(fade*p.alpha*windowFade*1.25,0,.95);const stretch=1+.12*Math.sin(p.rot);q.drawImage(this.textures[p.tex],p.x-p.r*stretch,p.y-p.r,p.r*2*stretch,p.r*2);
  }q.globalAlpha=1;this.c.drawImage(this.smokeLayer,0,0,1200,680);
 }
 puff(x,y,kind='exhaust',power=1){
  const m=this.currentModel;if(m){if(kind==='steam'&&m.coolantLevel<.001)return;if(kind==='oil'&&m.oilSmoke<.001)return;}
  const max=Math.round((this.performanceMode==='eco'?150:260)*this.quality);if(this.smoke.length>=max)return;
  if(kind==='exhaust'){x=1102;y=347;power=m?.exhaustSmoke??.04;}
  const p=this.world(x,y),steam=kind==='steam',ex=kind==='exhaust',pulse=m?.exhaustPulse||0;
  this.smoke.push({x:p.x,y:p.y,vx:ex?38+pulse*48:(this.rand()-.5)*24,vy:ex?-12-this.rand()*22:-34-this.rand()*25,age:0,life:3+this.rand()*1.8,r:ex?8+this.rand()*9:14+this.rand()*15,grow:ex?18+power*17:21+power*10,rot:this.rand()*TAU,spin:(this.rand()-.5)*.3,tex:(steam?6:kind==='oil'?3:0)+Math.floor(this.rand()*3),alpha:ex?.07+power*1.7:power,front:!ex&&this.rand()>.35});
 }
 update(dt,m){this.currentModel=m;super.update(dt,m);this.effectsClock+=dt;
  this.extraSmoke+=dt*((m.exhaustSmoke||0)*38+(m.steam||0)*45+(m.relay?.contactTemp>125?3:0))*this.quality;
  for(let n=0;n<10&&this.extraSmoke>=1;n++,this.extraSmoke--){if(m.relay.contactTemp>130&&this.rand()<.13)this.puff(59,181,'electrical',.55);else if(m.steam>.1&&this.rand()<.48)this.puff(this.rand()>.5?915:282,221,'steam',1.1);else this.puff(1102,347,'exhaust',1);}
  // Hot exhaust loses jet speed and rises into a broad buoyant plume.
  for(const p of this.smoke){if(!p.front&&p.x>970){p.vx*=Math.exp(-dt*.6);p.vy-=dt*6;}}
  const max=Math.round((this.performanceMode==='eco'?150:260)*this.quality);if(this.smoke.length>max)this.smoke.length=max;
 }
 piston(m,j){
  const c=this.c,cy=m.cylinders[j],x=X[j],g=pistonGeometry(m.phase,j,x),f=pistonGeometry(cy.freeze,j,x),d=cy.contact;
  const top=cy.active?g.top:f.top,pin=cy.active?g.pinY:f.pinY;
  if(cy.active){
   const s=cy.cycle,fill=COLORS[s.stroke],alpha=s.stroke===0&&cy.lit?.08+cy.pulse*.28:s.stroke===2?.07:.035;
   c.save();c.beginPath();c.rect(x-49,231,98,184);c.clip();c.globalAlpha=alpha;c.fillStyle=fill;c.fillRect(x-49,231,98,Math.max(0,top-231));c.globalAlpha=1;
   if(s.stroke===0&&cy.lit&&s.angle<.6){const fire=1-s.angle/.6;c.fillStyle=`rgba(249,210,138,${fire*.7})`;c.fillRect(x-44,232,88,Math.max(0,top-232));}
   if(s.intake>.02||s.exhaust>.02){const direction=s.intake>.02?1:-1,side=direction===1?-1:1;c.globalAlpha=.35;for(let k=0;k<3;k++){const t=(this.t*2+k/3)%1;const xx=x+side*(26-t*8),yy=234+t*Math.max(3,top-239);this.line([[xx,yy],[xx-2,yy+5*direction]],direction===1?'#92bac3':'#bd9c79',1.1);}c.globalAlpha=1;}
   c.restore();this.rod(x,pin,g.crankX,g.crankY,d.bearing);
  }else{
   this.rod(g.crankX+Math.sin(m.phase+j)*10,g.crankY-28,g.crankX,g.crankY,1,true);
   if(cy.failure!=='ejected')this.rod(x,pin,x-5,pin+27,1,true);
  }
  if(cy.failure==='ejected')return;
  c.save();c.beginPath();c.rect(x-50,232,100,184);c.clip();
  this.pistonSurface(x,top,pin,cy);
  c.restore();
 }
 uncachedPistonSurface(x,top,pin,cy){const c=this.c,d=cy.contact,j=cy.id;
  this.rr(x-46,top,92,67,3.5,this.metal(x-46,92),'#c7cfcc',1.3);
  this.rr(x-39,top+34,78,25,8,'rgba(26,38,41,.28)');
  this.poly([[x-42,top+63],[x-34,top+67],[x-23,top+67],[x-18,top+59],[x+18,top+59],[x+23,top+67],[x+34,top+67],[x+42,top+63]],'#47555b','#9da9a8',.5);
  // Crown, two compression rings and a two-rail oil-control ring.
  this.line([[x-43,top+2],[x-24,top+2],[x-18,top+5],[x+18,top+5],[x+24,top+2],[x+43,top+2]],'#d7dcd3',1.7);
  for(const y of[9,16]){this.line([[x-45,top+y],[x+45,top+y]],'#16252d',3.5);this.line([[x-44,top+y-1],[x+44,top+y-1]],'#bbc2bb',.9);}
  this.rr(x-45,top+22,90,7,0,'#253138');for(let k=0;k<22;k++)this.line([[x-43+k*4,top+23],[x-41+k*4,top+27]],'#879692',.7);
  this.line([[x-45,top+22],[x+45,top+22]],'#c0c6bc',.9);this.line([[x-45,top+29],[x+45,top+29]],'#b2bbb4',.9);
  for(let k=0;k<32;k++){const yy=top+31+k*.9;this.line([[x-43,yy],[x+43,yy]],'rgba(221,229,225,.065)',.4);}
  this.circle(x,pin,11.5,'#55656a','#bbc6c3',1.4);this.circle(x,pin,7.6,this.metal(x-8,16),'#32434a',1.1);this.circle(x,pin,4.5,'#27363f');
  const scuff=Math.max(d.skirt,cy.wear*.22),n=Math.floor(scuff*30);
  for(let k=0;k<n;k++){const sx=x+(k%3===0?-1:1)*(27+noise(j*31+k)*14),yy=top+32+noise(k+12)*12;
   this.line([[sx,yy],[sx+.4,top+62]],'rgba(38,38,34,.56)',1+noise(k)*2);
   this.line([[sx-.8,yy],[sx-.4,top+60]],'rgba(222,222,205,.52)',.6);}
  if(d.crown>.03){c.globalAlpha=d.crown*.55;this.rr(x-41,top+2,82,6,2,'#302a25');c.globalAlpha=1;}
  if(!cy.active)this.fracture([[x-38,top+37],[x-17,top+43],[x-8,top+58],[x+10,top+48],[x+26,top+52]],1,1.5);
 }
 uncachedHeadCasting(m){const c=this.c;
  this.rr(277,175,643,55,5,this.metal(277,643),'#c0c7c7',1.8);this.texture(280,178,638,49,.35);
  this.line([[281,230],[917,230]],m.gasket>.15?'#1e2221':'#747f83',3);
  this.line([[281,228],[917,228]],'#d0d2c6',.7);this.hatch(281,216,637,10);
 }
 head(m){
  const c=this.c;
  this.headCasting(m);
  for(let j=0;j<4;j++){
   const x=X[j],cy=m.cylinders[j],s=cy.cycle;
   this.poly([[x-49,225],[x-45,211],[x-18,200],[x+18,200],[x+45,211],[x+49,225]],'#1b2930','#8b9799',1);
   this.rr(x-55,181,35,20,4,'#293d45','#728389',1);this.rr(x+20,181,35,20,4,'#3e3b35','#8d8b82',1);
   for(const side of[-1,1]){
    const lift=(side<0?s.intake:s.exhaust)*9,xx=x+side*27,retainer=186+lift;
    // The stem and valve head move DOWN into the cylinder on opening. Cam stays driven even after rod failure.
    this.line([[xx,retainer-13],[xx,226+lift]],'#c7ccca',3.5);
    this.rr(xx-8,retainer-9,16,7,1,this.metal(xx-8,16),'#a4afae',.7);
    for(let k=0;k<6;k++){const y=retainer+k*(209-retainer)/6;this.line([[xx-6,y],[xx+6,y+2]],'#101e25',2.4);this.line([[xx-6,y-.6],[xx+6,y+1.4]],'#9ca8a8',.7);}
    this.line([[xx-8,211],[xx+8,211]],'#bcc3ba',1);
    this.poly([[xx-3,219+lift],[xx-10,225+lift],[xx-11,228+lift],[xx+11,228+lift],[xx+10,225+lift],[xx+3,219+lift]],side<0?'#afbab8':'#9b998d','#dee1d4',.8);
    if(this.mode==='oil'&&(side<0?s.intake:s.exhaust)>.1)this.line([[xx-12,226+lift],[xx+12,226+lift]],side<0?'#8ab1bf':'#d0a67a',1.5);
   }
   this.rr(x-4,187,8,22,1,'#d7d5c5','#56656a',1);this.rr(x-5,186,10,5,1,'#99a5a6');this.line([[x,210],[x,219]],'#ad9b72',2);this.line([[x+3,216],[x+3,221],[x,221]],'#9aa7a8',1);
   if(cy.active&&cy.lit&&cy.cycle.angle<.13)this.line([[x,218],[x+2,220],[x,222]],'#eee6c9',1.1);
  }
  // Parallel camshaft projections. Each rotates once per 720 crank degrees.
  this.rr(286,132,619,42,3,'#131e24','#69787d',1.4);
  for(let row=0;row<2;row++){
   const y=row?161:143;this.line([[302,y],[891,y]],'#66767a',5);this.line([[302,y-2],[891,y-2]],'#b4beba',.8);
   for(let j=0;j<4;j++){
    const x=X[j]+(row?27:-27),s=m.cylinders[j].cycle,center=row?Math.PI*1.5:Math.PI*2.5;
    const a=(s.angle-center)/2;
    c.save();c.translate(x,y);c.rotate(a);
    const pts=[];for(let k=0;k<=36;k++){const p=k/36*TAU,r=6+5*Math.max(0,Math.cos(p-Math.PI/2))**3;pts.push([Math.cos(p)*r,Math.sin(p)*r]);}
    this.poly(pts,this.metal(-8,16),'#c5ceca',.8);this.circle(0,0,2,'#24373f');c.restore();
   }
   for(const x of BEARINGS){this.rr(x-6,y-5,12,10,2,'#68777b','#abb6b5',.8);this.bolt(x,y,2.2);}
  }
  // One tethered cover, never duplicate geometry when it loosens.
  c.save();c.translate(289,122);c.rotate((Math.sin(m.phase*2)*.009+m.recoil*.012)*m.components.cover);
  this.rr(-12,-15,644,22,4,this.metal(-12,644),'#b1bdbd',1.5);this.texture(-10,-14,640,18,.2);
  for(let k=0;k<12;k++)if(m.components.cover<1||k<2)this.bolt(6+k*55,-4,3.5,this.t*m.components.cover);
  c.restore();
  this.rr(465,91,262,15,2,'#344147','#76858b',1);this.text('I4 · DOHC · LONGITUDINAL SECTION',596,101,8,'#b9c6c6','center');
 }
 exhaust(m){
  const heat=clamp(((m.headerTemp||165)-230)/450,0,1),metal=heat>.35?'#786f64':'#748085';
  for(let j=0;j<4;j++){const x=X[j]+49;this.line([[x,192],[x+40,178],[950,192+j*14],[974,277]],'#151e23',16);this.line([[x,190],[x+40,176],[950,190+j*14],[974,276]],metal,11);this.line([[x,187],[x+40,173],[948,187+j*14],[972,273]],'#aab0ab',1);}
  const c=this.c,swing=Math.sin(m.phase*.7)*.013*m.components.exhaust;c.save();c.translate(975,277);c.rotate(swing);
  this.line([[0,0],[0,39],[16,62],[32,62]],'#11181d',25);this.line([[0,0],[0,39],[16,62],[32,62]],this.metal(-10,40),20);
  // Silencer body, rolled seams, weld bead and soot at the open tailpipe.
  this.rr(22,39,89,45,19,this.metal(22,89),'#8c9697',1.2);this.texture(29,46,75,30,.15);
  for(const xx of[30,99])this.line([[xx,43],[xx,80]],'#4e5a60',2.3);
  this.line([[104,62],[126,69]],'#1b2429',20);this.line([[104,60],[126,67]],'#859195',15);
  this.ellipse(127,68,5,9,'#596465','#b9bdb7',1.2);this.ellipse(128,68,3,6.3,'#11191d');
  for(let k=0;k<10;k++)this.line([[-10,7+k*2],[-6,9+k*2]],'#596568',1);
  if(heat>.03){c.globalAlpha=heat*.38;this.line([[0,0],[0,30],[12,51]],'#8d634b',12);c.globalAlpha=1;}
  if((m.headerTemp||0)>560){c.globalAlpha=clamp((m.headerTemp-560)/350,0,.14);this.line([[0,0],[0,29]],'#c16e4e',13);c.globalAlpha=1;}
  if(this.blast>.1){this.poly([[129,63],[148+this.blast*27,72],[132,75]],`rgba(219,166,95,${this.blast*.65})`);}
  this.line([[59,85],[58,105],[83,105]],'#7b8789',2);c.restore();
  this.text('ВЫПУСК '+Math.round(m.egt||300)+' °C',1025,411,9,'#b3aaa0','center');
 }
 relay(m){const c=this.c,r=m.relay;if(!r)return;c.save();c.translate(-75,0);
  // Mounted off-engine: relay and fan do not inherit block vibration.
  this.bake('electrical-panel','static',[112,120,111,140],()=>{this.rr(113,122,108,134,5,'#1a242a','#6e7d84',1.2);this.rr(121,145,92,82,2,'#111b21','#465760',1);this.rr(126,157,32,51,3,'#4a4540','#938473',1);for(let k=0;k<14;k++)this.line([[128,160+k*3],[155,160+k*3]],k%2?'#9a7151':'#664932',1.3);this.text('K1 / FAN · 12 V',124,138,8,'#aebac0');this.text('30',126,240,7,'#839299');this.text('87',197,240,7,'#839299');});
  const angle=r.closed?0:-.19;c.save();c.translate(166,170);c.rotate(angle);this.line([[0,0],[29,20]],'#bdc4be',3.7);this.circle(29,20,3.3,r.contactTemp>110?'#8f6d48':'#c6c4a7');c.restore();this.line([[194,196],[204,206],[204,227]],'#8a9495',3);this.circle(195,195,3,'#b3a888');
  if(r.arc>.1){this.line([[193,188],[190,192],[195,195]],`rgba(243,211,153,${r.arc})`,1.7);}
  this.rr(183,129,7,3,1,r.closed?'#b9c5b2':'#43535b');this.text(Math.round(r.contactTemp)+'°C',204,240,9,r.contactTemp>110?'#dbad79':'#b0bec3','right');
  this.line([[128,256],[128,282],[137,295]],'#675a43',2.1);this.line([[201,256],[201,277],[184,295]],'#263b46',2.1);
  this.bake('radiator','static',[111,292,114,166],()=>{this.rr(114,295,109,158,4,'#273139','#657780',1.1);for(let k=0;k<27;k++)this.line([[121,302+k*5.3],[215,302+k*5.3]],'#4a575c',.8);this.circle(168,365,44,'#162126','#809095',1.2);this.circle(168,365,36,'#26343b');this.text('ЭЛ. ВЕНТИЛЯТОР',169,441,7,'#a5b1b4','center');});
  c.save();c.translate(168,365);c.rotate(m.fanAngle||0);for(let k=0;k<7;k++){c.rotate(TAU/7);this.poly([[-3,-7],[3,-34],[12,-30],[10,-9]],'#8d9898','#526269',.6);}this.circle(0,0,8,'#40515a','#a0aeac',1);c.restore();
  this.text(Math.round(r.fan*2200)+' rpm',169,423,9,'#b6c2c5','center');c.restore();
 }
 event(e,m){if(e.type==='relay'||e.type==='relayHeat')return;super.event(e,m);}
  particles(){const c=this.c;for(const p of this.drops){this.line([[p.x,p.y],[p.x-p.vx*.009,p.y-p.vy*.009]],'#0b0e10',p.r*1.35);this.ellipse(p.x,p.y,p.r,p.r*1.45,'#111718');this.line([[p.x-.5,p.y-1],[p.x-.5,p.y+1]],'#727974',.6);}
    for(const p of this.debris){c.save();c.translate(p.x,p.y);c.rotate(p.rot);
      if(p.kind==='spark'){c.globalAlpha=Math.max(0,1-p.age/.45);this.line([[0,0],[-p.vx*.015,-p.vy*.015]],'#e4b76e',1.2);}
      else if(p.kind==='bolt'){this.bolt(0,0,5);this.line([[0,3],[0,12]],'#8d9ca2',3);}
      else if(p.kind==='piston'){this.rr(-26,-20,52,40,4,this.metal(-26,52),'#bfc7c7',2);for(let k=0;k<3;k++)this.line([[-26,-14+k*5],[26,-14+k*5]],'#28383f',2);}
      else if(p.kind==='rod'){this.line([[-20,-23],[17,22]],'#99a8ad',10);this.circle(17,22,10,'#50666f','#a9b9bc',2);}
      else this.poly([[-p.size,0],[0,-p.size*.7],[p.size,1],[0,p.size*.4]],'#84959c','#b6c2c3',.5);
      c.restore();}
  }
 engine(m){this.relay(m);super.engine(m);}
 reset(){super.reset();this.cache?.clear();this.extraSmoke=0;this.effectsClock=0;}
}
root.Piston.Renderer=Renderer;
})(window);
