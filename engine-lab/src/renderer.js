/* Procedural cutaway artwork. All particles have bounded pools and fixed lifetimes. */
(function(root){
'use strict';
const {clamp,pistonGeometry,TAU}=root.Piston;
const X=[373,517,661,805], FLOOR=604;
class Renderer {
  constructor(canvas){
    this.canvas=canvas;this.c=canvas.getContext('2d',{alpha:false});
    this.w=1200;this.h=680;this.smoke=[];this.drops=[];this.debris=[];this.stains=[];
    this.smokeAcc=0;this.oilAcc=0;this.sparkAcc=0;this.impulse=0;this.seed=4529;this.t=0;
    this.pose={x:0,y:0,a:0};this.quality=1;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.textures=this.makeSmoke();this.surface=this.makeMetal();this.resize();
  }
  rand(){this.seed=(1664525*this.seed+1013904223)>>>0;return this.seed/4294967296}
  resize(){
    const box=this.canvas.getBoundingClientRect(); const dpr=Math.min(devicePixelRatio||1,1.7);
    this.canvas.width=Math.round(box.width*dpr);this.canvas.height=Math.round(box.height*dpr);
    this.scale=this.canvas.width/1200;this.sy=this.canvas.height/680;
    this.quality=box.width<600?.68:1;
  }
  rr(x,y,w,h,r,fill,stroke,line=1){const c=this.c;c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.lineWidth=line;c.strokeStyle=stroke;c.stroke()}}
  poly(p,fill,stroke,w=1){const c=this.c;c.beginPath();c.moveTo(...p[0]);p.slice(1).forEach(v=>c.lineTo(...v));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke()}}
  line(p,color,w=1){const c=this.c;c.beginPath();c.moveTo(...p[0]);p.slice(1).forEach(v=>c.lineTo(...v));c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke()}
  ellipse(x,y,rx,ry,fill,stroke,w=1){const c=this.c;c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke()}}
  circle(x,y,r,fill,stroke,w=1){this.ellipse(x,y,r,r,fill,stroke,w)}
  metal(x,w,dark=false){const g=this.c.createLinearGradient(x,0,x+w,0);(dark?[[0,'#343a35'],[.13,'#5e6660'],[.31,'#303a35'],[.72,'#242c28'],[1,'#515a51']]:[[0,'#606c66'],[.09,'#a8afa5'],[.23,'#727d77'],[.49,'#454f4b'],[.76,'#8a948a'],[.94,'#b0b8ac'],[1,'#657068']]).forEach(([p,col])=>g.addColorStop(p,col));return g}
  bolt(x,y,r=5,a=0){const p=[];for(let j=0;j<6;j++)p.push([x+Math.cos(a+j*TAU/6)*r,y+Math.sin(a+j*TAU/6)*r]);this.poly(p,'#90998b','#202922',1.2);this.line([[x-r*.45,y],[x+r*.45,y]],'#3c463b',1.5)}
  text(s,x,y,size=10,color='#879382',align='left'){this.c.font=`${size}px ui-monospace,monospace`;this.c.textAlign=align;this.c.fillStyle=color;this.c.fillText(s,x,y)}
  makeMetal(){const b=document.createElement('canvas');b.width=b.height=128;const q=b.getContext('2d');for(let i=0;i<1500;i++){q.fillStyle=this.rand()>.6?'rgba(224,233,213,.07)':'rgba(3,9,5,.12)';q.fillRect(this.rand()*128,this.rand()*128,1+this.rand(),1+this.rand())}return b}
  makeSmoke(){
    const textures=[];
    // Interpolated value noise makes irregular billows rather than translucent circles.
    const grids=[8,16,32].map(n=>({n,a:Float32Array.from({length:(n+1)**2},()=>this.rand())}));
    const noise=(x,y,g)=>{const gx=x*g.n,gy=y*g.n,ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy;const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),a=g.a,N=g.n+1,k=iy*N+ix;return (a[k]*(1-sx)+a[k+1]*sx)*(1-sy)+(a[k+N]*(1-sx)+a[k+N+1]*sx)*sy};
    for(let k=0;k<9;k++){
      const b=document.createElement('canvas');b.width=b.height=128;const q=b.getContext('2d'),im=q.createImageData(128,128);
      const blobs=Array.from({length:6},()=>({x:.32+this.rand()*.36,y:.32+this.rand()*.36,r:.10+this.rand()*.16}));
      for(let y=0;y<128;y++)for(let x=0;x<128;x++){
        const u=(x+.5)/128,v=(y+.5)/128;
        let density=0;for(const p of blobs)density+=Math.exp(-((u-p.x)**2+(v-p.y)**2)/(p.r*p.r));
        const n=noise(u*.97,v*.97,grids[k%3])*.6+noise(u*.97,v*.97,grids[(k+1)%3])*.4;
        const border=Math.pow(Math.max(0,1-((u-.5)**2+(v-.5)**2)*3.5),2);
        const alpha=clamp(density*.39*(.4+n)*border,0,.8);
        const base=k<3?96:k<6?55:151; const shade=base+n*38+(1-v)*15;
        const idx=(y*128+x)*4;
        im.data[idx]=shade;im.data[idx+1]=shade+2;im.data[idx+2]=shade-3+(k<3?7:0);im.data[idx+3]=alpha*255;
      }
      q.putImageData(im,0,0);textures.push(b);
    }return textures;
  }
  world(x,y){const p=this.pose,dx=x-590,dy=y-540;return {x:590+dx*Math.cos(p.a)-dy*Math.sin(p.a)+p.x,y:540+dx*Math.sin(p.a)+dy*Math.cos(p.a)+p.y}}
  puff(x,y,kind='exhaust',power=1){
    if(this.smoke.length>=Math.round(225*this.quality))this.smoke.shift();
    const p=this.world(x,y),steam=kind==='steam',exhaust=kind==='exhaust';
    this.smoke.push({x:p.x,y:p.y,vx:exhaust?25+this.rand()*60:(this.rand()-.5)*50,
      vy:-24-this.rand()*42,age:0,life:2.8+this.rand()*2.2,r:13+this.rand()*17,
      grow:14+power*10,rot:this.rand()*TAU,spin:(this.rand()-.5)*.35,
      tex:(steam?6:kind==='oil'?3:0)+Math.floor(this.rand()*3),alpha:power,
      front:!exhaust&&this.rand()>.3});
  }
  fragment(x,y,kind='chip',force=1){
    if(this.debris.length>=76)this.debris.shift();
    const p=this.world(x,y);this.debris.push({x:p.x,y:p.y,kind,vx:(this.rand()-.5)*350*force,vy:-80-this.rand()*220*force,
      rot:this.rand()*6,spin:(this.rand()-.5)*15,size:2+this.rand()*5,age:0,rest:false,bounces:0});
  }
  event(e,m){
    this.impulse=Math.max(this.impulse,e.type==='cylinder'?18:e.type==='last'?12:6);
    if(e.type==='cylinder'){
      const x=X[e.cylinder];for(let j=0;j<12;j++)this.fragment(x,425,j%3===0?'spark':'chip',1.5);
      for(let j=0;j<8;j++)this.fragment(x+(this.rand()-.5)*110,205,'bolt',1);
      this.fragment(x,330,m.cylinders[e.cylinder].failure==='ejected'?'piston':'rod',1.1);
      for(let j=0;j<25;j++)this.puff(x,255,'oil',1.25);
    }else if(e.type==='gasket'){for(let j=0;j<16;j++)this.puff(920,220,'steam',1.25)}
    else if(e.type==='metal'){for(let j=0;j<5;j++)this.fragment(300+j*135,173,'bolt',1.05)}
  }
  update(dt,m){
    this.t+=dt;this.impulse*=Math.exp(-dt*5);
    const stressed=clamp((m.block-125)/110,0,1),broken=4-m.activeCount;
    this.smokeAcc+=dt*(5+m.throttle*22+stressed*36+m.gasket*58+broken*13)*this.quality;
    while(this.smokeAcc>=1){this.smokeAcc--;const q=this.rand();
      if(q<.37||m.gasket<.04)this.puff(1033,230,'exhaust',.65+stressed*.4);
      else if(q<.7)this.puff(this.rand()>.5?914:286,214,'steam',.8+m.gasket*.45);
      else if(q<.9)this.puff(907,481,'oil',.75+stressed*.4);
      else this.puff(340+this.rand()*510,176,'steam',.65);
    }
    this.oilAcc+=dt*(m.oil>.02?m.gasket*7+m.damage*2:0);
    while(this.oilAcc>=1){this.oilAcc--;if(this.drops.length>=65)this.drops.shift();const left=this.rand()>.5,p=this.world(left?286:916,left?405:521);
      this.drops.push({x:p.x,y:p.y,vx:(this.rand()-.5)*18,vy:20+this.rand()*35,r:1.5+this.rand()*1.9,age:0});}
    this.sparkAcc+=dt*(m.damage>.55?m.throttle*m.damage*3:0);
    while(this.sparkAcc>=1){this.sparkAcc--;const id=m.cylinders.findIndex(c=>c.active&&c.wear>.5);if(id>=0)this.fragment(X[id]+46,310,'spark',.4)}
    for(const p of this.smoke){p.age+=dt;p.x+=p.vx*dt+Math.sin(this.t*1.2+p.rot)*6*dt;p.y+=p.vy*dt;p.vy-=3*dt;p.r+=p.grow*dt;p.rot+=p.spin*dt}
    this.smoke=this.smoke.filter(p=>p.age<p.life&&p.y>-180&&p.x<1380&&p.x>-180);
    for(const p of this.drops){p.age+=dt;p.vy+=500*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.y>=FLOOR){if(this.stains.length>=40)this.stains.shift();this.stains.push({x:p.x,r:3+p.r*2});}}
    this.drops=this.drops.filter(p=>p.age<4&&p.y<FLOOR);
    for(const p of this.debris){p.age+=dt;if(p.rest)continue;p.vy+=630*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.spin*dt;
      if(p.y>=FLOOR-2&&p.kind!=='spark'){p.y=FLOOR-2;p.vy=-Math.abs(p.vy)*.25;p.vx*=.55;p.spin*=.4;p.bounces++;if(p.bounces>3||Math.abs(p.vy)<18){p.rest=true;p.rot*=.2;}}}
    this.debris=this.debris.filter(p=>p.kind==='spark'?p.age<.45:p.x>-100&&p.x<1300&&p.age<100);
  }
  background(m){const c=this.c;c.fillStyle='#1b1f1c';c.fillRect(0,0,1200,680);
    const g=c.createRadialGradient(590,235,40,590,300,660);g.addColorStop(0,'#30372f');g.addColorStop(1,'#191d1a');c.fillStyle=g;c.fillRect(0,0,1200,604);
    this.line([[110,603],[1090,603]],'#46503f',1);
    c.fillStyle='#20251e';c.fillRect(0,605,1200,75);
    this.ellipse(590,603,421,29,'rgba(0,0,0,.35)');
    const lost=4.6-m.oil,w=40+Math.min(280,lost*80);
    c.beginPath();c.moveTo(595-w,611);c.bezierCurveTo(583-w,594,670,605,600+w,609);c.bezierCurveTo(670+w,627,510+w*.6,632,596,626);c.bezierCurveTo(490,638,470-w,617,595-w,611);c.closePath();c.fillStyle='#10150f';c.fill();
    this.line([[570-w*.7,613],[610+w*.6,615]],'rgba(156,164,143,.13)',1.1);
    for(const p of this.stains)this.ellipse(p.x,614,p.r*2,p.r*.38,'#10150e');
    this.text('I4 / 1998 CC',88,572,10,'#78816e');this.text('1 · 3 · 4 · 2',1100,572,10,'#78816e','right');
  }
  drawSmoke(front){const c=this.c;for(const p of this.smoke){if(p.front!==front)continue;
    const fade=Math.min(1,p.age*5)*Math.pow(Math.max(0,1-p.age/p.life),.6);
    // Keep the cutaway readable, while plumes billow freely above and around it.
    const windowFade=p.front&&p.x>322&&p.x<860&&p.y>238&&p.y<510?.25:1;
    c.save();c.globalAlpha=clamp(fade*p.alpha*windowFade,0,1);c.translate(p.x,p.y);c.rotate(p.rot);c.drawImage(this.textures[p.tex],-p.r,-p.r,p.r*2,p.r*2);c.restore();
  }}
  pulley(x,y,r,phase){const c=this.c;this.circle(x,y,r,'#222b24','#697568',3);this.circle(x,y,r-6,this.metal(x-r,r*2),'#0d170f',2);c.save();c.translate(x,y);c.rotate(phase);
    for(let j=0;j<6;j++){c.rotate(TAU/6);this.ellipse(0,-r*.57,4,r*.22,'#29352c','#899483',1)}this.circle(0,0,10,'#344236','#b2bca7',2);this.bolt(0,0,5);c.restore();}
  engine(m){const c=this.c,a=m.phase,t=this.t,d=m.damage,broken=4-m.activeCount;
    const amp=(.5+m.throttle*2.3+broken*3+m.mountWear*4+this.impulse)*(this.reduced?.12:1);
    this.pose={x:(Math.sin(a)*.6+Math.sin(a*2.03)*.4+Math.sin(t*47)*.16)*amp,
      y:(Math.cos(a*2)*.6+Math.sin(t*39)*.13)*amp*.6,a:Math.sin(a*.5)*amp*.0006};
    // Rubber mounts connect the moving block to a stationary cradle.
    for(const x of [337,844]){this.rr(x-45,572,90,30,4,this.metal(x-45,90,true),'#7b8674',2);this.bolt(x-29,587,5);this.bolt(x+29,587,5);const p=this.world(x,556);this.line([[x,576],[p.x,p.y]],'#101b12',22);this.line([[x-7,575],[p.x-7,p.y]],'#505e4a',3);}
    this.rr(259,591,664,9,2,'#2e392d','#7b8670',1);
    c.save();c.translate(590+this.pose.x,540+this.pose.y);c.rotate(this.pose.a);c.translate(-590,-540);
    // Machined side faces, casting bevel and cutaway flange.
    this.poly([[280,225],[301,207],[910,207],[939,230],[938,530],[914,557],[285,550]],'#414d42','#65735e',2);
    this.poly([[912,221],[936,231],[935,527],[912,547]],this.metal(910,30,true),'#687762',1);
    this.rr(278,220,635,327,16,this.metal(278,635,true),'#9ba58e',3);
    this.rr(290,231,612,304,8,'#0e1911','#62745d',3);
    c.save();c.beginPath();c.roundRect(279,221,633,326,15);c.clip();c.globalAlpha=.8;c.fillStyle=c.createPattern(this.surface,'repeat');c.fillRect(278,220,635,327);c.restore();
    for(let j=0;j<4;j++){
      const x=X[j];this.rr(x-59,231,118,188,5,this.metal(x-59,118),'#b5bea9',2);
      this.rr(x-51,233,102,183,1,'#111a14');
      const g=c.createLinearGradient(x-51,0,x+51,0);g.addColorStop(0,'#516254');g.addColorStop(.13,'#26342a');g.addColorStop(.5,'#101b13');g.addColorStop(.87,'#26362b');g.addColorStop(1,'#7d8d75');c.fillStyle=g;c.fillRect(x-51,234,102,180);
      // Cylinder honing and permanent scoring are anchored to the liner.
      for(let k=0;k<12;k++){c.globalAlpha=.13;this.line([[x-48,248+k*12],[x+48,237+k*12]],'#a9baa2',.7);this.line([[x-48,237+k*12],[x+48,248+k*12]],'#a9baa2',.7);}c.globalAlpha=1;
      const wear=m.cylinders[j].wear;
      for(let k=0;k<Math.floor(wear*13);k++){const sx=x-46+(k%3)*3,yy=245+(k*19+j*5)%116;this.line([[sx,yy],[sx+1,yy+24+wear*32]],'#1b221a',2);this.line([[sx+1.7,yy],[sx+2.7,yy+22+wear*32]],'rgba(178,170,132,.42)',.7);}
    }
    // Open crankcase and oil bath, not an opaque bar across the connecting rods.
    this.rr(300,418,592,107,4,'#111d14','#697b60',2);
    for(let j=0;j<4;j++){
      const x=X[j],geo=pistonGeometry(a,j,x);c.save();c.translate(x,460);c.rotate(a-m.cylinders[j].offset);
      this.poly([[-25,8],[-38,28],[-18,45],[18,45],[38,28],[25,8]],this.metal(-38,76,true),'#818f75',2);c.restore();
      this.line([[x,460],[geo.crankX,geo.crankY]],'#7b8b74',20);this.circle(geo.crankX,geo.crankY,17,this.metal(geo.crankX-17,34),'#bdc4ae',2);
    }
    for(let j=0;j<4;j++)this.piston(m,j);
    for(const x of X){this.circle(x,460,12,this.metal(x-12,24),'#9fac94',2);this.bolt(x,460,5,a);}
    // Small internal oil splash driven by the crank, clipped to its actual chamber.
    c.save();c.beginPath();c.rect(302,420,588,106);c.clip();
    const oilH=5+m.oil*3.9;const oilY=524-oilH;
    c.beginPath();c.moveTo(300,529);c.lineTo(300,oilY);for(let x=300;x<=900;x+=10)c.lineTo(x,oilY+Math.sin(x*.055+a*1.5)*(1+m.throttle*2));c.lineTo(900,529);c.closePath();c.fillStyle='#252717';c.fill();
    this.line([[310,oilY+1],[887,oilY+1]],'rgba(165,155,100,.18)',1);
    if(m.oil>.1)for(let k=0;k<12;k++){const u=(t*(1+m.throttle*2)+k*.31)%1,x=330+k*45;this.line([[x+u*14,510-Math.sin(u*Math.PI)*28],[x+u*14-2,513-Math.sin(u*Math.PI)*28]],'rgba(105,100,58,.4)',1);}
    c.restore();
    // Cast perimeter bolts and oil pan ribs.
    for(let k=0;k<17;k++){const x=297+k*36;this.line([[x,534],[x+15,541]],'#728165',2);if(!(d>.65&&k%4===0))this.bolt(x+7,540,4.5);}
    for(const x of [289,901])for(let y=245;y<525;y+=45)this.bolt(x,y,4.5);
    this.rr(325,550,531,18,3,this.metal(325,531,true),'#88997c',2);
    this.bolt(598,563,6);this.line([[598,568],[598,576]],'#252e1c',4);
    // Head, combustion chambers, valve stems and physically phased intake/exhaust cams.
    this.rr(277,176,643,53,7,this.metal(277,643),'#afb9a2',2);
    this.line([[284,230],[914,230]],d>.3?'#19190e':'#7d8e71',d>.3?4:2);
    for(let j=0;j<4;j++){
      const x=X[j],cyl=m.cylinders[j],geo=pistonGeometry(a,j,x),cycle=geo.cycle;
      this.rr(x-53,189,106,25,4,'#33442f','#9caa8c',1);
      for(const side of [-1,1]){
        const open=cyl.active?Math.max(0,Math.sin(cycle-(side===-1?Math.PI*2:Math.PI)))**6*9:0;
        this.line([[x+side*27,183],[x+side*27,226+open]],'#b5bca5',4);
        this.line([[x+side*27-11,226+open],[x+side*27+11,226+open]],'#8f9c83',4);
        for(let k=0;k<6;k++)this.line([[x+side*27-6,189+k*(3-open*.06)],[x+side*27+6,191+k*(3-open*.06)]],'#3b4c33',1.7);
      }
      this.rr(x-5,184,10,30,2,'#c0bd9f','#383f2e',1);this.line([[x,215],[x,226]],'#b49e6e',2);
    }
    // Camshaft inspection strip.
    this.rr(288,150,618,24,3,'#182419','#86977a',2);this.line([[304,162],[891,162]],'#809176',7);
    for(let j=0;j<8;j++){c.save();c.translate(327+j*77,162);c.rotate(a*.5+j*Math.PI*.5);this.ellipse(0,-3,7,12,this.metal(-7,14),'#b4c0a5',1);c.restore();}
    this.rr(277,126,644,21,4,this.metal(277,644),'#a3b298',2);
    for(let k=0;k<12;k++){const x=295+k*55;if(!(d>.75&&k%4===0))this.bolt(x,137,4.5,a*m.mountWear*.12);}
    this.rr(455,112,286,16,2,'#333f2c','#7e9070',1);
    this.text('DOHC 16V  /  SURVIVOR SERIES',598,124,10,'#c7cfba','center');
    // Rust is localized around seams and fasteners.
    for(let k=0;k<24;k++){const x=290+(k*73)%610,y=k%2?222:537;this.line([[x,y],[x+5,y+1]],'rgba(122,83,48,.65)',2);}
    // Timing belt, tensioner, alternator and front flywheel.
    this.line([[265,167],[212,408],[245,486],[301,462],[265,167]],'#0d180e',14);
    this.line([[265,167],[212,408],[245,486],[301,462],[265,167]],'#596d4f',2);
    for(let k=0;k<18;k++){const y=192+((k*14+a*12)%235);this.line([[252-(y-192)*.18,y],[258-(y-192)*.18,y+2]],'#33472a',2)}
    this.pulley(265,166,28,a*.5);this.pulley(245,461,48,a);this.pulley(210,381,28,-a*1.6);
    this.rr(165,290,73,61,9,this.metal(165,73),'#9caa90',2);for(let k=0;k<7;k++)this.line([[174+k*9,300],[174+k*9,340]],'#344a2c',4);
    this.circle(201,328,13,'#334c2a','#9baa91',2);this.bolt(201,328,5,-a*2);
    // Exhaust side: steel acquires soot, not an impossible red glow at 200 Celsius.
    for(let j=0;j<4;j++){const y=250+j*47;this.line([[921,y],[950,y],[977,277]],'#182318',18);this.line([[921,y-1],[950,y-1],[977,276]],'#6e7868',12);this.line([[922,y-4],[950,y-4],[977,274]],'#939b82',2);}
    this.line([[976,278],[1033,278],[1033,231]],'#77826e',22);this.line([[979,273],[1028,273],[1028,233]],'#a0a58c',2);
    this.ellipse(1033,231,12,5,'#9a9f85');this.ellipse(1033,231,8,3,'#111a0f');
    if(d>.35){this.line([[980,282],[1029,282]],'#373c26',3);}
    this.oilFilm(m);
    // Fractures open at the cylinders that actually lose a rod.
    for(let j=0;j<4;j++)if(!m.cylinders[j].active){const x=X[j];
      this.poly([[x-40,533],[x-26,507],[x-15,519],[x+4,494],[x+18,512],[x+41,506],[x+29,542]],'#0b140b','#a2a78c',1.7);
      this.poly([[x-40,533],[x-26,507],[x-18,537]],'#526449','#9bab8f',1);
      this.line([[x+47,233],[x+58,242],[x+51,253],[x+62,264]],'#151e10',3);
      this.line([[x+46,233],[x+57,242],[x+50,253]],'#a3a98b',.8);
    }
    c.restore();
  }
  piston(m,j){const c=this.c,cy=m.cylinders[j],x=X[j],g=pistonGeometry(m.phase,j,x),f=pistonGeometry(cy.freeze,j,x);
    const top=cy.active?g.top:f.top,pin=cy.active?g.pinY:f.pinY;
    // Cutaway combustion takes place once per 720 degrees in firing order 1-3-4-2.
    if(cy.active){c.save();c.beginPath();c.rect(x-48,231,96,184);c.clip();const fire=Math.max(0,1-g.cycle/.65)*cy.compression;
      if(fire>.01){const z=c.createLinearGradient(0,231,0,Math.max(232,top));z.addColorStop(0,`rgba(232,194,115,${fire*.77})`);z.addColorStop(1,`rgba(146,93,36,${fire*.35})`);c.fillStyle=z;c.fillRect(x-48,231,96,Math.max(0,top-230));}
      else if(g.cycle>Math.PI*2&&g.cycle<Math.PI*3){c.fillStyle='rgba(117,150,147,.08)';c.fillRect(x-48,231,96,Math.max(0,top-231));}c.restore();}
    const rod=(x1,y1,x2,y2)=>{this.line([[x1,y1],[x2,y2]],'#192419',19);this.line([[x1,y1],[x2,y2]],this.metal(Math.min(x1,x2)-7,Math.abs(x1-x2)+16),13);this.line([[x1-3,y1],[x2-3,y2]],'#b1bda4',1.7)};
    if(cy.active){rod(x,pin,g.crankX,g.crankY);this.circle(g.crankX,g.crankY,13,this.metal(g.crankX-13,26),'#b4bea5',2);this.bolt(g.crankX,g.crankY,5);}
    else{
      const mx=x+(g.crankX-x)*.65,my=g.crankY-31;
      rod(mx,my,g.crankX,g.crankY);this.line([[mx-6,my+2],[mx-1,my-3],[mx+4,my+2]],'#c2c6ac',1.3);
      if(cy.failure!=='ejected')rod(x,pin,x-9,pin+31);
    }
    if(cy.failure==='ejected')return;
    c.save();c.beginPath();c.rect(x-50,232,100,187);c.clip();
    this.rr(x-47,top,94,68,4,this.metal(x-47,94),'#bcc5ad',1.8);
    this.line([[x-44,top+3],[x+44,top+3]],'#d1d6bc',1.8);
    for(let k=0;k<3;k++){this.line([[x-46,top+10+k*6],[x+46,top+10+k*6]],'#192619',2.4);this.line([[x-46,top+12+k*6],[x+46,top+12+k*6]],'#9ba88e',.7);}
    this.rr(x-37,top+33,74,24,5,'rgba(17,29,17,.18)');
    this.circle(x,pin,10,this.metal(x-10,20),'#bac6ab',2);this.circle(x,pin,4,'#263b24');
    for(let k=0;k<Math.floor(cy.wear*9);k++){const sx=x-37+(k*17)%75;this.line([[sx,top+32],[sx+1,top+57]],'rgba(46,40,22,.5)',1.4);}
    if(!cy.active)this.line([[x-39,top+38],[x-18,top+42],[x-10,top+57],[x+17,top+45]],'#182311',3);
    c.restore();
  }
  oilFilm(m){if(m.gasket<.02&&m.damage<.1)return;const c=this.c,amt=Math.min(1,m.gasket+m.damage*.5);
    for(const [x,y,l] of [[286,230,160],[916,277,235],[307,508,48]]){
      c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x-5,y+l*.27,x+7,y+l*.65,x+2,y+l*amt);c.strokeStyle='rgba(9,15,8,.9)';c.lineWidth=3+amt*3;c.lineCap='round';c.stroke();
      c.strokeStyle='rgba(139,147,116,.18)';c.lineWidth=.8;c.stroke();this.ellipse(x+2,y+l*amt,2+amt,3+amt*2,'#11170b');
    }
  }
  particles(){const c=this.c;for(const p of this.drops){this.line([[p.x,p.y],[p.x-p.vx*.009,p.y-p.vy*.009]],'#0a1309',p.r*1.35);this.ellipse(p.x,p.y,p.r,p.r*1.45,'#10180b');this.line([[p.x-.5,p.y-1],[p.x-.5,p.y+1]],'#6c7450',.6);}
    for(const p of this.debris){c.save();c.translate(p.x,p.y);c.rotate(p.rot);
      if(p.kind==='spark'){c.globalAlpha=Math.max(0,1-p.age/.45);this.line([[0,0],[-p.vx*.015,-p.vy*.015]],'#e4b76e',1.2);}
      else if(p.kind==='bolt'){this.bolt(0,0,5);this.line([[0,3],[0,12]],'#8d9b7e',3);}
      else if(p.kind==='piston'){this.rr(-26,-20,52,40,4,this.metal(-26,52),'#bdc4aa',2);for(let k=0;k<3;k++)this.line([[-26,-14+k*5],[26,-14+k*5]],'#1f321b',2);}
      else if(p.kind==='rod'){this.line([[-20,-23],[17,22]],'#9caa91',10);this.circle(17,22,10,'#4d6447','#a8b59b',2);}
      else this.poly([[-p.size,0],[0,-p.size*.7],[p.size,1],[0,p.size*.4]],'#86967b','#b4bda1',.5);
      c.restore();}
  }
  render(m){const c=this.c;c.setTransform(this.scale,0,0,this.sy,0,0);c.globalAlpha=1;this.background(m);this.drawSmoke(false);this.engine(m);this.particles();this.drawSmoke(true);}
}
root.Piston.Renderer=Renderer;
})(window);
