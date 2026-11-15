"""Reproducible v0.8 Chromium integration verification on a real loopback origin."""
import functools,json,os,shutil,threading,time
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'dist/verification-08';OUT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
html=(ROOT/'dist/last-piston.html').read_text().replace('<body>','<body><script>window.__PISTON_TEST__=true;</script>')
inline=False
def load(page):
 if inline:page.set_content(html,wait_until='load')
 else:page.goto(base+'/index.html?test')
report={'checks':[],'runtime_errors':[],'limitations':[]}
def ok(name,condition):
 assert condition,name
 report['checks'].append(name)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
  page=b.new_page(viewport={'width':1440,'height':1200})
  page.on('pageerror',lambda e:report['runtime_errors'].append(str(e)))
  try:page.goto(base+'/index.html?test')
  except Exception as e:
   if 'ERR_BLOCKED_BY_ADMINISTRATOR' not in str(e):raise
   inline=True;report['limitations'].append('URL navigation blocked by environment policy. Used inline standalone HTML. Native storage across navigation and browser AudioWorklet hosting are not verified.');page.set_content(html,wait_until='load')
  page.wait_for_function('window.__engineLab');page.evaluate('__engineLab.pause()')
  ok('desktop no overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  ok('new mechanics loaded',page.evaluate('__engineLab.engine.snapshot().version===3'))
  ok('new cutaway loaded',page.evaluate('!!__engineLab.renderer.boreTexture'))
  page.evaluate('__engineLab.advance(.14,false,true)');page.screenshot(path=OUT/'clean.png',full_page=True)
  image=page.evaluate('engine.toDataURL()');page.evaluate('__engineLab.renderer.render(__engineLab.engine)')
  ok('render does not move geometry or randomize wear',image==page.evaluate('engine.toDataURL()'))
  page.keyboard.down('Space');page.keyboard.down('ArrowUp');page.keyboard.up('Space')
  ok('overlapping keyboard input works',page.evaluate('__engineLab.held'))
  page.keyboard.up('ArrowUp');ok('release works',not page.evaluate('__engineLab.held'))
  page.locator('#gas').dispatch_event('pointerdown',{'pointerId':7,'pointerType':'touch','button':0})
  ok('touch gas engages',page.evaluate('__engineLab.held'))
  page.locator('#gas').dispatch_event('pointercancel',{'pointerId':7,'pointerType':'touch'})
  ok('touch cancellation works',not page.evaluate('__engineLab.held'))
  page.locator('#cyl1').click();ok('individual cylinder zoom',page.evaluate('__engineLab.renderer.zoom===1.8 && __engineLab.renderer.focus===1'))
  page.screenshot(path=OUT/'detail.png',full_page=True)
  page.locator('#zoom-out').click();ok('return to full view',page.evaluate('__engineLab.renderer.zoom===1'))
  page.locator('#cyl2').focus();page.keyboard.press('Enter');ok('zoom keyboard accessible',page.evaluate('__engineLab.renderer.focus===2 && !__engineLab.held'))
  page.locator('#zoom-out').click();states=[]
  for mode in ['section','oil','thermal','damage']:
   page.locator(f'[data-view={mode}]').click();states.append(page.evaluate('engine.toDataURL()'))
   ok(f'{mode} mode activates',page.evaluate(f'__engineLab.renderer.mode==="{mode}"'))
  ok('layers render distinct pixels',len(set(states))==4)
  page.locator('[data-view=section]').click()
  page.evaluate('__engineLab.pause(false)');page.locator('#inspect-pause').click();t=page.evaluate('__engineLab.engine.time');page.wait_for_timeout(250)
  ok('inspection pauses simulation',page.evaluate('__engineLab.engine.time')==t)
  page.locator('#gas').dispatch_event('pointerdown',{'pointerId':8,'pointerType':'touch','button':0});page.wait_for_timeout(100)
  ok('gas resumes inspection',page.evaluate('!__engineLab.inspecting && __engineLab.held'))
  page.locator('#gas').dispatch_event('pointercancel',{'pointerId':8,'pointerType':'touch'})
  page.evaluate('__engineLab.pause();__engineLab.advance(90,true,true)')
  ok('last cylinder survives',page.evaluate('__engineLab.engine.activeCount===1 && __engineLab.engine.rpm>320'))
  ok('contacts show persistent damage',page.evaluate('__engineLab.engine.cylinders.some(c=>c.contact.skirt>.2)'))
  page.screenshot(path=OUT/'damaged.png',full_page=True)
  page.locator('#cyl0').click();page.locator('[data-view=damage]').click();page.screenshot(path=OUT/'wear-detail.png',full_page=True)
  page.locator('#zoom-out').click();page.locator('[data-view=section]').click()
  page.evaluate('__engineLab.advance(90,true,true)')
  report['pools']=page.evaluate('({smoke:__engineLab.renderer.smoke.length,drops:__engineLab.renderer.drops.length,debris:__engineLab.renderer.debris.length})')
  ok('effect pools bounded',report['pools']['smoke']<=225 and report['pools']['drops']<=65 and report['pools']['debris']<=76)
  page.evaluate('window.snap=__engineLab.engine.snapshot();__engineLab.restore(JSON.parse(JSON.stringify(snap)))')
  ok('restore keeps wear and history',page.evaluate('__engineLab.engine.cylinders[0].contact.skirt===snap.cylinders[0].contact.skirt && __engineLab.engine.log.length===snap.log.length'))
  # Audio host: use actual browser analyser, not a ready flag. Worklet support reported, not assumed.
  page.evaluate('__engineLab.audio.update(__engineLab.engine);window.an=__engineLab.audio.ctx.createAnalyser();an.fftSize=2048;__engineLab.audio.master.connect(an)')
  page.wait_for_timeout(300)
  report['audio']=page.evaluate('(()=>{let d=new Float32Array(an.fftSize);an.getFloatTimeDomainData(d);return {state:__engineLab.audio.ctx.state,backend:__engineLab.audio.node?"worklet":"scheduled-buffer",rms:Math.sqrt(d.reduce((n,x)=>n+x*x,0)/d.length),peak:Math.max(...d.map(Math.abs))}})()')
  ok('browser audio finite, audible, bounded',report['audio']['rms']>.00001 and report['audio']['peak']<1)
  page.locator('.settings summary').click();page.locator('#mute').click();ok('mute retained',page.evaluate('__engineLab.audio.muted'))
  page.locator('#motion').click();ok('reduced motion control',page.evaluate('__engineLab.renderer.reduced'))
  page.locator('#reset').click();ok('reset needs confirmation',page.evaluate('__engineLab.engine.activeCount===1'))
  page.locator('#reset').click();ok('reset clears contact wear',page.evaluate('__engineLab.engine.activeCount===4 && __engineLab.engine.cylinders.every(c=>c.contact.liner===0)'))
  # Native navigation tests are skipped only when the environment blocks URL navigation.
  if not inline:
   data=page.evaluate('snap');page.evaluate('(s)=>localStorage.setItem("last-piston:survivor:v1",JSON.stringify(s))',data)
   page.goto(base+'/index.html');page.wait_for_function('document.getElementById("active").textContent==="1"')
   ok('real page navigation restores one-cylinder save',page.locator('#active').inner_text()=='1')
  offline=b.new_page(viewport={'width':1280,'height':1000});offline.on('pageerror',lambda e:report['runtime_errors'].append(str(e)))
  if inline:offline.set_content(html,wait_until='load')
  else:offline.goto((ROOT/'dist/last-piston.html').as_uri()+'?test')
  offline.wait_for_function('window.__engineLab');offline.evaluate('__engineLab.pause()')
  ok('standalone HTML initializes without runtime assets',offline.evaluate('__engineLab.engine.snapshot().version===3'))
  # Touch layout at two viewport widths.
  mobile=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
  mp=mobile.new_page();mp.on('pageerror',lambda e:report['runtime_errors'].append(str(e)))
  load(mp);mp.wait_for_function('window.__engineLab');mp.evaluate('__engineLab.pause();__engineLab.advance(80,true,true)')
  ok('mobile no overflow',mp.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  ok('mobile aspect ratio preserved',mp.evaluate('Math.abs(__engineLab.renderer.scale-__engineLab.renderer.sy)<1e-8'))
  mp.screenshot(path=OUT/'mobile.png',full_page=True)
  mp.locator('#cyl0').tap();ok('mobile cylinder zoom',mp.evaluate('__engineLab.renderer.zoom===1.8'))
  mp.screenshot(path=OUT/'mobile-detail.png',full_page=True)
  mp.locator('#gas').dispatch_event('pointerdown',{'pointerId':99,'pointerType':'touch','button':0});mp.locator('#gas').dispatch_event('lostpointercapture',{'pointerId':99,'pointerType':'touch'})
  ok('mobile pointer capture release',not mp.evaluate('__engineLab.held'))
  mp.set_viewport_size({'width':320,'height':740});ok('320px no overflow',mp.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  ok('canvas remains rendered after resize',mp.evaluate('(()=>{let r=__engineLab.renderer,p=r.c.getImageData(r.canvas.width/2,r.canvas.height/2,1,1).data;return p[0]+p[1]+p[2]>25})()'))
  # Rough renderer cost under this headless environment; not a physical-device FPS promise.
  report['transport']='inline' if inline else 'loopback';report['mean_render_ms']=offline.evaluate('(()=>{let t=performance.now();for(let i=0;i<80;i++)__engineLab.renderer.render(__engineLab.engine);return (performance.now()-t)/80})()')
  ok('no JavaScript runtime errors',not report['runtime_errors'])
  b.close()
finally:server.shutdown()
(OUT/'report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print(json.dumps(report,indent=2,ensure_ascii=False))
