/* Detailed longitudinal I4 projection. The two valve pairs are unfolded for inspection. */
(function(root){
'use strict';
const {Renderer:Workshop,clamp,pistonGeometry,TAU,cycleState}=root.Piston;
const X=[373,517,661,805],BEARINGS=[307,445,589,733,871];
const noise=(n)=>{const v=Math.sin(n*127.1+31.7)*43758.5453;return v-Math.floor(v);};
const COLORS=['#d5a477','#a89f94','#83a8b0','#babfc5'];
class Renderer extends Workshop{
 constructor(canvas){super(canvas);this.mode='section';this.zoom=1;this.focus=1;this.makeDetailTextures();}
 metal(x,w,dark=false){const g=this.c.createLinearGradient(x,0,x+w,0);const stops=dark?[[0,'#353b3c'],[.18,'#575c5d'],[.53,'#292f31'],[.85,'#464c4e'],[1,'#697173']]:[[0,'#778184'],[.07,'#bcc4c5'],[.22,'#8d979a'],[.54,'#596568'],[.79,'#b1b9b9'],[.95,'#d7dbd9'],[1,'#869193']];stops.forEach(([p,col])=>g.addColorStop(p,col));return g;}
 makeDetailTextures(){
  this.boreTexture=document.createElement('canvas');this.boreTexture.width=102;this.boreTexture.height=184;
  const c=this.boreTexture.getContext('2d'),g=c.createLinearGradient(0,0,102,0);
  [[0,'#879292'],[.05,'#4c5b61'],[.20,'#28373b'],[.5,'#17252a'],[.80,'#34454a'],[.96,'#5a6970'],[1,'#b4bfbd']].forEach(([p,v])=>g.addColorStop(p,v));c.fillStyle=g;c.fillRect(0,0,102,184);
  c.lineWidth=.55;c.strokeStyle='rgba(178,195,195,.16)';
  for(let y=-55;y<235;y+=6){c.beginPath();c.moveTo(0,y);c.lineTo(102,y+43);c.moveTo(0,y+43);c.lineTo(102,y);c.stroke();}
  for(let i=0;i<480;i++){c.fillStyle=noise(i)>.5?'rgba(245,250,245,.08)':'rgba(0,0,0,.13)';c.fillRect(noise(i+12)*102,noise(i+48)*184,.5+noise(i+90),.5);}
  this.castTexture=document.createElement('canvas');this.castTexture.width=this.castTexture.height=128;
  const q=this.castTexture.getContext('2d');for(let i=0;i<2200;i++){q.fillStyle=noise(i)>.58?'rgba(231,238,233,.11)':'rgba(0,0,0,.18)';q.fillRect(noise(i+4)*128,noise(i+57)*128,.5+noise(i+32)*1.2,.5+noise(i+11));}
 }
 update(dt,m){super.update(dt,m);const f=this.reduced?.06:1,broken=4-m.activeCount;
  const amp=(.4+m.throttle*1.6+broken*1.1+m.mountWear*2+this.impulse)*f;
  this.pose={x:this.spring.x*f+Math.sin(m.phase*2)*amp,y:this.spring.y*f+Math.cos(m.phase*2.04)*amp*.55,a:Math.sin(m.phase)*amp*.0008};
 }
 setView(mode){if(['section','oil','thermal','damage'].includes(mode))this.mode=mode;}
 setFocus(i){this.focus=clamp(i,0,3);this.zoom=1.8;}
 engineTransform(){const c=this.c,p=this.pose;c.translate(590+p.x,540+p.y);c.rotate(p.a);c.translate(-590,-540);}
 texture(x,y,w,h,alpha=.5){const c=this.c;c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.globalAlpha=alpha;c.fillStyle=c.createPattern(this.castTexture,'repeat');c.fillRect(x,y,w,h);c.restore();}
 hatch(x,y,w,h){const c=this.c;c.save();c.beginPath();c.rect(x,y,w,h);c.clip();for(let d=-h;d<w;d+=5)this.line([[x+d,y+h],[x+d+h,y]],'rgba(14,22,25,.24)',.65);c.restore();}
 background(m){
  const c=this.c;c.fillStyle='#191d20';c.fillRect(0,0,1200,680);
  const g=c.createLinearGradient(0,0,0,604);g.addColorStop(0,'#22292d');g.addColorStop(1,'#181e21');c.fillStyle=g;c.fillRect(0,0,1200,604);
  this.line([[70,603],[1130,603]],'#465056',1);c.fillStyle='#22272a';c.fillRect(0,604,1200,76);
  this.ellipse(593,604,418,22,'rgba(0,0,0,.42)');
  const lost=4.6-m.oil,w=15+Math.min(280,lost*70);
  c.beginPath();c.moveTo(595-w,615);c.bezierCurveTo(500-w,607,594,603,602+w,612);c.bezierCurveTo(687+w,630,570,635,585-w*.7,626);c.closePath();c.fillStyle='#101416';c.fill();
  this.line([[565-w*.6,614],[610+w*.64,617]],'rgba(152,160,158,.17)',1);
  for(const p of this.stains)this.ellipse(p.x,615,p.r*1.7,p.r*.33,'#111516');
  this.text('86 × 86 mm  /  1 998 cm³',86,573,10,'#8c979b');this.text('1 · 3 · 4 · 2  /  720°',1106,573,10,'#8c979b','right');
  this.line([[99,110],[99,530]],'#3f4b50',1);for(let i=0;i<15;i++)this.line([[99,110+i*28],[i%5?105:113,110+i*28]],'#606d72',1);
 }
 stand(m){
  for(const x of[337,844]){this.rr(x-45,576,90,26,3,this.metal(x-45,90,true),'#7a858a',1.5);this.bolt(x-29,589,5);this.bolt(x+29,589,5);
   const p=this.world(x,553);this.line([[x,578],[p.x,p.y]],'#101517',24);this.line([[x-8,578],[p.x-8,p.y]],'#434b4d',3);
   const damage=x<400?m.components.leftMount:m.components.rightMount;
   if(damage>.3){this.line([[x-15,552],[x-25,579],[x+23,579],[x+14,553]],'#a2a5a0',3);this.line([[x-9,562],[x+3,569],[x-5,574]],'#050708',3);}
  }
  this.rr(259,596,664,7,1,'#525d61','#899095',1);
 }
 block(m){
  const c=this.c;
  this.poly([[276,223],[294,205],[914,205],[940,224],[940,533],[915,557],[281,549]],'#4f5a5f','#939fa1',1.2);
  this.poly([[914,223],[940,224],[940,533],[914,550]],this.metal(914,26,true),'#7b868b',1);
  this.rr(276,220,638,330,12,this.metal(276,638,true),'#aab4b7',2.3);this.texture(277,221,637,328,.65);
  this.rr(290,230,610,305,5,'#101a20','#728085',2.5);
  // Five bearing bulkheads. Their center spacing is a section projection, not four independent flywheels.
  for(const x of BEARINGS){this.poly([[x-12,397],[x+12,397],[x+20,451],[x+15,514],[x-15,514],[x-20,451]],this.metal(x-20,40,true),'#6c797d',1);}
  // Water jackets surround the liners rather than passing through the cylinders.
  for(let j=0;j<4;j++){
   const x=X[j];this.rr(x-62,233,124,181,5,this.metal(x-62,124),'#b9c3c4',1.5);
   for(const side of[-1,1]){const xx=x+side*57-3;this.rr(xx,243,6,157,2,'#12303a','#415963',.7);
    if(m.coolantLevel>.01){c.globalAlpha=(this.mode==='oil'?.8:.25)*m.coolantLevel;for(let k=0;k<4;k++){const y=253+((this.t*18+k*36)%139);this.line([[xx+3,y],[xx+3,y+5]],'#8caab5',1);}c.globalAlpha=1;}}
   c.drawImage(this.boreTexture,x-51,232);
   this.line([[x-51,231],[x+51,231]],'#d2d6d3',1.5);this.hatch(x-62,232,8,181);this.hatch(x+54,232,8,181);
   this.linerDamage(x,m.cylinders[j]);
  }
  this.rr(301,417,590,113,3,'#111c22','#6c787c',1.3);
  for(let i=0;i<19;i++){const x=294+i*32;this.line([[x,534],[x+15,544]],'#6a777d',2);if(m.damage<.7||i%5)this.bolt(x+8,541,3.6);}
  for(const x of[285,905])for(let y=246;y<520;y+=44){this.circle(x,y,6.3,'#29343a','#5c6a70',1);this.bolt(x,y,4.2);}
 }
 linerDamage(x,cy){const d=cy.contact,c=this.c,amount=Math.max(d.liner,cy.wear*.22);c.save();c.beginPath();c.rect(x-50,233,100,181);c.clip();
  const n=Math.floor(amount*24);
  for(let i=0;i<n;i++){const side=i%3===0?-1:1,sx=x+side*(31+noise(i+cy.id*39)*16),y=241+noise(i+17)*96,len=35+noise(i+8)*70;
   this.line([[sx,y],[sx+.8,y+len]],'rgba(10,14,16,.72)',1.5+noise(i)*2.4);
   this.line([[sx-.9,y+1],[sx-.1,y+len-3]],'rgba(214,218,207,.54)',.65);
   if(i%4===0)this.line([[sx+2,y+6],[sx+3,y+len-8]],'rgba(151,114,79,.3)',2);
  }
  if(d.liner>.25){c.globalAlpha=(d.liner-.25)*.5;this.rr(x+33,247,12,139,3,'#87857a');c.globalAlpha=1;}
  c.restore();
 }
 crank(m){const c=this.c;
  this.line([[274,460],[914,460]],'#435258',16);this.line([[274,454],[914,454]],'#8d9a9d',1.5);
  for(let j=0;j<4;j++){const x=X[j],a=m.phase-m.cylinders[j].offset,g=pistonGeometry(m.phase,j,x);
   c.save();c.translate(x,460);c.rotate(a);
   this.poly([[-19,5],[-37,23],[-34,43],[-16,52],[16,52],[34,43],[37,23],[19,5]],this.metal(-37,74,true),'#9aa5a5',1.4);
   this.line([[-31,25],[-27,40],[-13,46],[12,46],[28,38]],'#bbc1ba',.8);
   for(let k=-1;k<=1;k++)this.circle(k*14,35,2.2,'#313d42');c.restore();
   this.line([[x,460],[g.crankX,g.crankY]],'#242f34',26);this.line([[x,460],[g.crankX,g.crankY]],this.metal(x-14,28),20);
   this.circle(g.crankX,g.crankY,17,this.metal(g.crankX-17,34),'#bbc5c4',1.5);
   this.circle(g.crankX+3,g.crankY-3,2,'#15242b');
  }
 }
 rod(x1,y1,x2,y2,damage=0,broken=false){
  const c=this.c,len=Math.hypot(x2-x1,y2-y1);c.save();c.translate(x1,y1);c.rotate(-Math.atan2(x2-x1,y2-y1));
  this.poly([[-10,5],[-7,22],[-6,len-24],[-15,len-9],[-14,len+8],[14,len+8],[15,len-9],[6,len-24],[7,22],[10,5]],this.metal(-15,30),'#b7c1bf',1.2);
  this.poly([[-3,23],[-3,len-22],[3,len-22],[3,23]],'#46575f');this.line([[-5,23],[-5,len-22]],'#d2d6cf',.8);
  this.circle(0,len,13,this.metal(-13,26),'#9facae',1.5);this.circle(0,len,8.5,'#515e61','#b2a58b',1.4);this.circle(0,len,5,'#25343c');
  this.line([[-13,len+3],[13,len+3]],'#192932',1);this.bolt(-12,len+8,2.4);this.bolt(12,len+8,2.4);
  if(damage>.3){this.line([[-5,len-5],[-7,len+4],[1,len+9]],`rgba(105,77,54,${damage*.7})`,1.3);}
  if(broken)this.line([[-7,0],[-3,-4],[1,1],[5,-3],[7,0]],'#dde1d5',1);
  c.restore();
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
  c.restore();
 }
 head(m){
  const c=this.c;
  this.rr(277,175,643,55,5,this.metal(277,643),'#c0c7c7',1.8);this.texture(280,178,638,49,.35);
  this.line([[281,230],[917,230]],m.gasket>.15?'#1e2221':'#747f83',3);
  this.line([[281,228],[917,228]],'#d0d2c6',.7);this.hatch(281,216,637,10);
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
 drive(m){
  // Two visible cam rows are depth-unfolded; the belt front plane shows one cam sprocket.
  this.line([[234,135],[198,157],[216,459],[254,479],[276,450],[270,151],[234,135]],'#10171b',9);
  this.line([[234,135],[198,157],[216,459],[254,479],[276,450],[270,151],[234,135]],'#708087',1.3);
  for(let i=0;i<24;i++){const v=((i*13+m.phase*19)%300);this.line([[200+v*.058,157+v],[205+v*.058,157+v]],'#7c8789',1.3);}
  this.pulley(234,151,38,m.camAngle);this.pulley(246,460,19,m.phase);
  this.pulley(214,337,22,-m.phase*.86);
  this.line([[266,460],[300,460]],'#9ba7aa',16);
  this.rr(173,371,53,44,6,this.metal(173,53,true),'#7e8a91',1.3);for(let k=0;k<6;k++)this.line([[180+k*7,377],[180+k*7,409]],'#1b2c35',2.5);
  this.bolt(200,396,5);this.text('2 : 1',191,250,9,'#87979f');
 }
 exhaust(m){
  // Ports emerge at head height, not from the crankcase. Header runs behind the block.
  for(let j=0;j<4;j++){
   const x=X[j]+49;this.line([[x,192],[x+40,178],[951,192+j*14],[975,278]],'#17242b',15);
   this.line([[x,190],[x+40,176],[951,190+j*14],[975,276]],'#697275',10);
   this.line([[x,187],[x+40,173],[949,187+j*14],[972,274]],'#a0a6a0',1);
  }
  const c=this.c;c.save();c.translate(978,278);c.rotate(Math.sin(m.phase*.7)*.025*m.components.exhaust);
  this.line([[0,0],[55,0],[55,-48]],'#111d24',24);this.line([[0,-1],[55,-1],[55,-48]],this.metal(0,60),19);this.line([[0,-6],[49,-6],[49,-47]],'#c4cac5',1);
  for(let k=0;k<5;k++)this.line([[k*4+2,-10],[k*4+2,9]],'#3b4547',1.5);
  this.ellipse(55,-48,11,4.5,'#adb4b2');this.ellipse(55,-48,8,2.8,'#0c171d');c.restore();
  this.line([[1010,279],[1041,315],[1061,301]],'#697b83',1.8);
  if(this.blast>.08){this.poly([[1026,230],[1027,218-this.blast*30],[1033,219-this.blast*70],[1041,214-this.blast*25],[1040,230]],`rgba(218,170,103,${this.blast*.8})`);}
 }
 lubrication(m){
  const c=this.c,active=m.oil>.02,alpha=this.mode==='oil'?.9:.25;
  const y=528-Math.min(20,m.oil*4.1);
  if(active){c.save();c.beginPath();c.rect(302,488,588,42);c.clip();c.beginPath();c.moveTo(301,531);c.lineTo(301,y);
   for(let x=301;x<=890;x+=8)c.lineTo(x,y+Math.sin(x*.04+m.phase)*(1+m.throttle*1.5));c.lineTo(891,531);c.closePath();c.fillStyle='#262721';c.fill();c.restore();
   this.line([[310,y+1],[883,y+1]],'rgba(165,161,133,.20)',.7);}
  this.line([[345,520],[334,520],[324,498],[304,498],[304,435]],'#3f4c4e',6);
  this.rr(330,516,32,6,2,'#39433e','#75827c',.8);for(let k=0;k<8;k++)this.line([[332+k*3,517],[332+k*3,521]],'#182b31',.6);
  this.circle(304,493,11,this.metal(293,22),'#a5b4b4',1);this.bolt(304,493,4,m.phase);
  if(this.mode==='oil'){
   c.globalAlpha=alpha;this.line([[304,494],[300,432],[882,432]],'#a99465',2);this.line([[300,432],[297,174],[891,174]],'#a99465',2);
   for(const x of BEARINGS)this.line([[x,432],[x,460]],'#a99465',2);
   if(active&&m.pressure>.05)for(let k=0;k<18;k++){const x=305+((this.t*m.pressure*28+k*32)%576);this.circle(x,432,1.6,'#ddc48f');}c.globalAlpha=1;
  }
  if(active)for(let j=0;j<4;j++){
   const x=X[j],g=pistonGeometry(m.phase,j,x),strength=clamp(m.pressure/3,0,1);this.line([[x-53,480],[x-53,447],[x-44,436]],'#929c96',2);this.circle(x-44,436,2,'#b3bdb0');
   if(strength>.01){c.globalAlpha=alpha*strength;for(let k=0;k<5;k++){const t=(this.t*3+k/5)%1;this.line([[x-44+t*30,436+(g.top+60-436)*t],[x-44+t*30+1,438+(g.top+60-436)*t]],'#baa87c',1);}c.globalAlpha=1;}
  }
 }
 fracture(points,amount,width=2){
  if(amount<=0)return;const n=(points.length-1)*clamp(amount,0,1),whole=Math.floor(n),p=points.slice(0,whole+1);
  if(whole<points.length-1){const a=points[whole],b=points[whole+1],t=n-whole;p.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}if(p.length<2)return;
  this.line(p,'#0a141b',width);this.line(p.map(([x,y])=>[x-.9,y-.8]),'#c2c2af',.55);
 }
 damages(m){
  const c=this.c;
  for(let j=0;j<4;j++){
   const cy=m.cylinders[j],d=cy.contact,x=X[j],v=cy.active?d.crack:1;
   this.fracture([[x+56,234],[x+62,249],[x+54,260],[x+64,278],[x+59,295],[x+66,306]],v,1.4+v*1.8);
   this.fracture([[x+62,249],[x+71,247],[x+73,239]],Math.max(0,v-.25),1.1);
   this.fracture([[x-47,219],[x-35,224],[x-23,222],[x-14,228]],Math.max(d.crack,m.gasket*.65),1.4);
   if(!cy.active){
    this.poly([[x-41,532],[x-28,510],[x-14,518],[x+2,499],[x+17,510],[x+38,505],[x+29,542]],'#0b151c','#bbc3b2',1.3);
    this.poly([[x-41,532],[x-28,510],[x-20,537]],'#5e6c70','#b7bfb4',.7);
    this.fracture([[x+29,542],[x+44,539],[x+52,545],[x+64,540]],1,1.6);
   }
   if(this.mode==='damage'){
    for(const [xx,yy,value]of [[x+46,305,d.liner],[x,475,d.bearing]]){this.circle(xx,yy,9,null,'#d2ae80',1);this.text(Math.round(value*100)+'%',xx+13,yy+3,8,'#dec39e');}
   }
  }
  // Small casting scratches and corrosion clustered around wet fasteners, stable across frames.
  for(let k=0;k<42;k++){const x=287+noise(k+90)*613,y=k%2?222:537;
   this.line([[x,y],[x+noise(k+3)*9,y+2]],'rgba(158,117,79,.4)',.8+noise(k));}
  if(m.gasket>.15){c.globalAlpha=m.gasket*.45;this.line([[283,229],[915,229]],'#171a19',4);c.globalAlpha=1;}
  this.oilFilm(m);
 }
 oilFilm(m){
  if(m.film<.0002)return;const c=this.c,a=clamp(m.film*8,0,1);
  for(const [x,y,l]of[[286,230,160],[916,277,235],[307,508,48]]){
   const len=l*clamp(m.gasket+m.damage*.4,.08,1);c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x-3,y+len*.2,x+6,y+len*.65,x+2,y+len);
   c.strokeStyle=`rgba(12,17,18,${a*.9})`;c.lineWidth=3+a*2;c.stroke();c.lineWidth=.7;c.strokeStyle=`rgba(161,162,145,${a*.23})`;c.stroke();this.ellipse(x+2,y+len,2.5,4,`rgba(12,17,18,${a})`);
  }
 }
 thermal(m){if(this.mode!=='thermal')return;const c=this.c;
  for(let j=0;j<4;j++){const cy=m.cylinders[j],d=cy.contact,x=X[j],hot=clamp((d.wallTemp-80)/210,0,1),g=pistonGeometry(cy.active?m.phase:cy.freeze,j,x);
   c.fillStyle=`rgba(${Math.round(105+hot*130)},${Math.round(156-hot*60)},${Math.round(184-hot*135)},.32)`;c.fillRect(x-62,232,124,182);
   this.text(Math.round(d.wallTemp)+'°',x,286,12,'#eff0dd','center');this.text(Math.round(d.crownTemp)+'° crown',x,399,8,'#cfddd9','center');
   if(cy.failure!=='ejected'){c.fillStyle='rgba(220,159,81,.16)';c.fillRect(x-45,g.top,90,67);}
  }
  this.text('ГБЦ '+Math.round(m.headTemp)+'°C',594,193,11,'#e6cfac','center');
 }
 engine(m){
  const c=this.c;this.stand(m);c.save();this.engineTransform();
  this.exhaust(m);this.block(m);this.crank(m);for(let j=0;j<4;j++)this.piston(m,j);
  // Main bearing caps belong BETWEEN throws, not over the connecting rods.
  for(const x of BEARINGS){this.rr(x-16,450,32,26,4,this.metal(x-16,32,true),'#99a7a9',1.1);this.circle(x,460,9,this.metal(x-9,18),'#bcc4bd',1);this.bolt(x-12,471,3);this.bolt(x+12,471,3);}
  this.lubrication(m);this.head(m);this.drive(m);
  this.rr(325,549,531,18,3,this.metal(325,531,true),'#8d999e',1.2);this.bolt(598,563,5.5);
  for(let k=0;k<18;k++)this.line([[341+k*28,551],[355+k*28,562]],'#56666c',1.3);
  this.damages(m);this.thermal(m);
  for(let j=0;j<4;j++){const cy=m.cylinders[j],x=X[j];this.text(String(j+1).padStart(2,'0'),x,72,10,cy.active?'#b8c4c5':'#65727b','center');
   this.text(cy.active?cy.cycle.name:'ОБРЫВ',x,84,7.5,cy.active?COLORS[cy.cycle.stroke]:'#839099','center');
   this.rr(x-6,89,12,2,0,cy.active&&cy.pulse>.05?'#d6b68e':'#414f55');}
  c.restore();
 }
 render(m){this.currentModel=m;const c=this.c;c.setTransform(1,0,0,1,0,0);c.fillStyle='#181e21';c.fillRect(0,0,this.canvas.width,this.canvas.height);
  c.setTransform(this.scale,0,0,this.scale,this.offsetX,this.offsetY);c.globalAlpha=1;
  c.save();c.beginPath();c.rect(0,0,1200,680);c.clip();
  if(this.zoom>1){c.translate(600,340);c.scale(this.zoom,this.zoom);c.translate(-X[this.focus],-320);}
  this.background(m);this.drawSmoke(false);this.engine(m);this.particles();this.drawSmoke(true);
  for(const p of this.rings)this.ellipse(p.x,p.y,p.r,p.r*.3,null,`rgba(170,181,184,${(1-p.age/.8)*.36})`,2);
  c.restore();
  if(this.zoom>1){this.rr(25,25,174,25,2,'#162127','#5a6d76',1);this.text('ЦИЛИНДР '+(this.focus+1)+' / ×1.8',39,42,10,'#c2cdcf');}
 }
}
root.Piston.Renderer=Renderer;
})(window);
