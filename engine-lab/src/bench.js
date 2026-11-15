/* Fixed test-stand hardware. The absorber is coupled to the shaft but mounted to
 * the floor, so its caliper and battery must not inherit engine-block shake. */
(function(root){
'use strict';
const {Renderer:Previous,TAU,clamp}=root.Piston;
class Renderer extends Previous {
 puff(x,y,kind='exhaust',power=1){
  const m=this.currentModel;
  if(m&&m.ignition&&m.ignition!=='running'&&kind==='exhaust')return;
  if(m&&m.ignition==='off'&&m.headerTemp<130&&kind==='oil')return;
  super.puff(x,y,kind,power);
 }
 update(dt,m){
  // Cancel only new pump-fed droplets when stopped; existing drops still fall.
  if(m.ignition!=='running')this.oilAcc=-dt*(m.oil>.02?m.gasket*7+m.damage*2:0);
  super.update(dt,m);
  if(m.ignition!=='running'){
   const speed=clamp(m.rpm/750,0,1);this.pose.x*=speed;this.pose.y*=speed;this.pose.a*=speed;this.spring.x*=speed;this.spring.y*=speed;
  }
  this.brakeSmokeAcc=(this.brakeSmokeAcc||0)+dt*clamp((m.brakeTemp-380)/150,0,3)*m.brake;
  if(this.brakeSmokeAcc>=1){this.brakeSmokeAcc%=1;if(this.smoke.length<Math.round(260*this.quality))this.smoke.push({x:1076,y:444,vx:8,vy:-24,age:0,life:1.6,r:9,grow:17,rot:0,spin:.2,tex:1,alpha:.42,front:true});}
 }
 background(m){super.background(m);this.c.fillStyle='#181e21';this.c.fillRect(66,562,190,29);this.c.fillRect(963,560,165,34);}
 engine(m){super.engine(m);this.battery(m);this.absorber(m);this.starter(m);}
 drive(m){const c=this.c;c.save();c.translate(246,460);c.rotate(m.phase);
  this.bake('flywheel','fixed',[-51,-51,102,102],()=>{const points=[];for(let i=0;i<144;i++){const a=i*TAU/144,r=i%2?47:50;points.push([Math.cos(a)*r,Math.sin(a)*r]);}this.poly(points,'#65757c','#a5b1af',.7);this.circle(0,0,42,'#29383f','#9aa9aa',1);for(let i=0;i<6;i++){const a=i*TAU/6;this.circle(Math.cos(a)*32,Math.sin(a)*32,5,'#142028','#7b9098',.7);}});
  c.restore();super.drive(m);this.rr(175,374,48,39,4,'#233138','#8c9d9f',1);
  for(const xx of[181,216])for(let k=0;k<6;k++)this.line([[xx,379+k*4],[xx+4,379+k*4]],k%2?'#9d7757':'#635344',1.4);
  this.circle(200,393,14,'#45545a','#9eaaa8',1);c.save();c.translate(200,393);c.rotate(m.electrical.altAngle);
  for(let j=0;j<6;j++){c.rotate(TAU/6);this.line([[0,3],[3,11]],'#adb6ac',2);}c.restore();this.bolt(200,393,3);
  this.text('G1 / '+Math.round(m.electrical.alternatorA)+' A',198,429,8,'#9caaad','center');
 }
 starter(m){
  const c=this.c,e=m.electrical;c.save();c.translate(202,514);
  this.bake('starter-body','fixed',[-36,-24,81,56],()=>{
   this.rr(-30,-18,57,34,6,this.metal(-30,57,true),'#95a4aa',1.2);
   this.rr(-17,-29,34,13,3,'#525e63','#a1aaa5',1);
   this.line([[-29,-11],[-29,11]],'#29373d',3);this.line([[22,-11],[22,11]],'#29373d',3);
   this.bolt(-22,0,3);this.bolt(19,0,3);this.rr(27,-9,13,18,1,'#77868a','#adb6b3',1);
  });
  if(m.ignition==='cranking'){this.circle(40,0,8,'#35444c','#9daaa9',1);c.save();c.translate(40,0);c.rotate(m.phase*3);for(let i=0;i<8;i++){c.rotate(TAU/8);this.line([[0,-5],[0,-9]],'#c7ccbe',2);}c.restore();}
  this.text('M1 / '+Math.round(e.starterA)+' A',0,39,8,'#a6b4b8','center');c.restore();
  this.line([[118,527],[142,527],[151,492],[188,492]],'#69503f',3);this.line([[118,529],[141,529],[150,494],[187,494]],'#a4805b',.6);
 }
 battery(m){const e=m.electrical;
  this.bake('battery-body','fixed',[39,487,91,84],()=>{this.rr(43,499,82,57,4,'#1c272e','#60747e',1.3);this.rr(41,494,86,11,2,'#46555c','#9aa8a8',1);for(let i=0;i<6;i++)this.line([[50+i*12,512],[50+i*12,546]],'#2a3b43',2);this.rr(52,488,12,6,1,'#887966','#c3b9a1',1);this.rr(105,488,12,6,1,'#6a777d','#b4c0c0',1);this.text('+',58,482,10,'#baa683','center');this.text('−',111,482,10,'#9aaab1','center');});
  this.rr(51,515,66,21,2,'#172129');this.text(e.voltage.toFixed(1)+' V',84,529,11,'#d0dad9','center');
  this.text('АКБ '+Math.round(e.soc*100)+'%',84,571,8,'#a4b2b6','center');
 }
 absorber(m){const c=this.c,x=1045,y=467,hot=clamp((m.brakeTemp-250)/500,0,1);
  // Flexible shaft coupling accounts for the cutaway's unfolded front projection.
  this.line([[918,460],[985,460],[1009,467]],'#121b20',14);this.line([[918,457],[985,457],[1009,464]],'#809397',8);
  for(const xx of[943,961,985]){this.rr(xx,451,7,19,1,'#60737a','#c0c6bb',.8);}
  this.bake('dyno-base','fixed',[985,509,130,59],()=>{this.rr(1004,510,82,33,3,'#28363e','#71838c',1);this.rr(988,542,126,15,3,'#46545b','#879a9f',1);for(const xx of[1001,1100])this.bolt(xx,548,4);this.line([[1010,510],[1010,540]],'#8b9b9f',2);this.line([[1080,510],[1080,540]],'#8b9b9f',2);});
  this.circle(x,y,50,'#17232a','#697c86',1.2);
  c.save();c.translate(x,y);c.rotate(m.dynoAngle);
  this.bake('rotor',Math.floor(hot*8),[-46,-46,92,92],()=>{
   this.circle(0,0,44,hot>.3?'#817367':'#7c8a8c','#c1c7bf',1.2);
   for(let r=22;r<43;r+=3)this.circle(0,0,r,null,'rgba(37,51,57,.4)',.7);
   for(let i=0;i<12;i++){const a=i*TAU/12;this.line([[Math.cos(a)*29,Math.sin(a)*29],[Math.cos(a+.22)*39,Math.sin(a+.22)*39]],'#38484d',1.7);}
   this.circle(0,0,18,'#34464f','#bdc5bd',1.3);for(let i=0;i<5;i++)this.bolt(Math.cos(i*TAU/5)*12,Math.sin(i*TAU/5)*12,2);
  });c.restore();
  this.circle(x,y,6,'#8a9da0','#d3d7ca',1);this.rr(x+30,y-23,22,47,4,m.brake>.05?'#988064':'#52656f','#b8bcb1',1.3);
  this.rr(x+29-m.brake*2,y-16,5,34,1,'#2c3538','#a19c85',.8);this.line([[x+46,y-21],[x+51,y-33],[x+70,y-33],[x+70,y+53]],'#586b75',2.5);
  this.text('B1 / '+Math.round(m.brakeTemp)+' °C',x,578,9,m.brakeTemp>400?'#d8ad7d':'#b0bec2','center');
  this.text(Math.round(m.absorbedNm)+' Н·м',x,593,8,'#8e9fa7','center');
 }
 reset(){super.reset();this.brakeSmokeAcc=0;}
}
root.Piston.Renderer=Renderer;
})(window);
