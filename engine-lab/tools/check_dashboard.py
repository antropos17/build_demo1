"""Browser regressions for independent analogue pedals and the instrument cluster.
Uses a real loopback origin when permitted; otherwise reports inline limitations.
"""
import functools, json, os, shutil, threading
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/verification-10';OUT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
html=(ROOT/'dist/last-piston.html').read_text().replace('<body>','<body><script>window.__PISTON_TEST__=true;</script>')
report={'version':'0.10.0','checks':[],'runtime_errors':[],'limitations':[]}
inline=False

def ok(name,value):
 assert value,name
 report['checks'].append(name)

def load(page):
 if inline: page.set_content(html,wait_until='load')
 else: page.goto(base+'/index.html?test')
 page.wait_for_function('window.__engineLab');page.evaluate('__engineLab.pause()')

def touch(page,name,pointer,value,kind='pointerdown'):
 box=page.locator('#'+name).bounding_box()
 page.locator('#'+name).dispatch_event(kind,{'pointerId':pointer,'pointerType':'touch','button':0,'clientX':box['x']+box['width']/2,'clientY':box['y']+box['height']-10-value*(box['height']-20)})

def release(page,name,pointer,kind='pointerup'):
 page.locator('#'+name).dispatch_event(kind,{'pointerId':pointer,'pointerType':'touch'})

try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':1280,'height':1120},device_scale_factor=1)
  page.on('pageerror',lambda e:report['runtime_errors'].append(str(e)))
  try: load(page)
  except Exception as e:
   if 'ERR_BLOCKED_BY_ADMINISTRATOR' not in str(e): raise
   inline=True;report['limitations'].append('URL navigation blocked: inline document used. Browser AudioWorklet hosting and storage across navigation not verified.');load(page)
  ok('standalone boots with v5 model and dashboard',page.evaluate('__engineLab.engine.snapshot().version===5 && !!__engineLab.dashboard'))
  ok('desktop has no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  ok('tachometer has static scale and dynamic needle',page.locator('#tach-face line').count()==71)
  touch(page,'gas',1,.25);ok('pointer position produces quarter gas',page.evaluate('Math.abs(__engineLab.pedals.gas-.25)<.01'))
  page.evaluate('__engineLab.stepInputs(1)');ok('model throttle actually remains partial',page.evaluate('__engineLab.engine.throttle>.24&&__engineLab.engine.throttle<.26'))
  touch(page,'gas',1,.72,'pointermove');ok('dragging smoothly changes gas command',page.evaluate('Math.abs(__engineLab.pedals.gas-.72)<.01'))
  touch(page,'brake',2,.55);ok('simultaneous pointers retain separate values',page.evaluate('__engineLab.pedals.gas>.7 && Math.abs(__engineLab.pedals.brake-.55)<.01'))
  page.evaluate('__engineLab.stepInputs(1)');ok('brake absorbs shaft power',page.evaluate('__engineLab.engine.absorbedKW>0&&__engineLab.engine.brakeTemp>24'))
  release(page,'gas',1);ok('gas release does not release held brake',page.evaluate('__engineLab.pedals.gas===0&&__engineLab.pedals.brake>.54'))
  release(page,'brake',2,'pointercancel');ok('cancel releases brake',page.evaluate('__engineLab.pedals.brake===0&&!__engineLab.held'))
  page.locator('h1').click();page.keyboard.down('KeyW');page.evaluate('__engineLab.stepInputs(.2)');ok('keyboard throttle has progressive travel',page.evaluate('__engineLab.pedals.gas>.2&&__engineLab.pedals.gas<.5'))
  page.keyboard.down('KeyS');page.evaluate('__engineLab.stepInputs(.5)');ok('keyboard gas and brake work together',page.evaluate('__engineLab.pedals.gas>.95&&__engineLab.pedals.brake>.95'))
  page.keyboard.up('KeyW');ok('releasing W preserves S',page.evaluate('__engineLab.pedals.gas===0&&__engineLab.pedals.brake>.9'))
  page.keyboard.up('KeyS');page.keyboard.down('Space');page.keyboard.down('ArrowUp');page.keyboard.up('Space');page.evaluate('__engineLab.stepInputs(.2)');ok('releasing one throttle key preserves the other',page.evaluate('__engineLab.pedals.gas>0'))
  page.keyboard.up('ArrowUp');page.locator('#brake').focus();page.keyboard.down('Space');page.evaluate('__engineLab.stepInputs(.4)');ok('focused brake works with Space',page.evaluate('__engineLab.pedals.brake>.9&&__engineLab.pedals.gas===0'));page.keyboard.up('Space')
  touch(page,'gas',3,.7);touch(page,'brake',4,.7);page.evaluate('window.dispatchEvent(new Event("blur"))');ok('blur releases both pedals',page.evaluate('__engineLab.pedals.gas===0&&__engineLab.pedals.brake===0&&!__engineLab.held'))
  touch(page,'gas',5,.5);release(page,'gas',5,'lostpointercapture');ok('lost capture releases gas',not page.evaluate('__engineLab.held'))
  page.locator('#inspect-pause').click();touch(page,'brake',6,.4);ok('brake resumes inspection without losing input',page.evaluate('!__engineLab.inspecting&&__engineLab.pedals.brake>.39'));release(page,'brake',6)
  page.evaluate('__engineLab.reset();__engineLab.engine.setProfile("normal");__engineLab.advance(2,.55,true);__engineLab.advance(.5,.55,true,.35)')
  ok('dashboard reports actual absorbed power',page.evaluate('document.getElementById("dash-load").textContent===__engineLab.engine.absorbedKW.toFixed(1)'))
  ok('needle moved away from idle',page.locator('#tach-needle').get_attribute('transform')!='rotate(-135 150 126)')
  page.evaluate('document.activeElement.blur()');page.screenshot(path=OUT/'desktop.png',full_page=True)
  page.locator('.dashboard').screenshot(path=OUT/'dashboard.png')
  page.locator('.pedal-console').screenshot(path=OUT/'pedals.png')
  # A pause and rerender must not consume wear, RNG or time.
  before=page.evaluate('JSON.stringify(__engineLab.engine.snapshot())');page.evaluate('__engineLab.renderer.render(__engineLab.engine);__engineLab.dashboard.update(__engineLab.engine)')
  ok('rendering instruments does not mutate model',before==page.evaluate('JSON.stringify(__engineLab.engine.snapshot())'))
  page.locator('#cyl2').click();ok('cylinder zoom retained',page.evaluate('__engineLab.renderer.zoom>1&&__engineLab.renderer.focus===2'));page.locator('#zoom-out').click()
  for mode in ['oil','thermal','damage','section']:
   page.locator(f'[data-view={mode}]').click();ok(mode+' view retained',page.evaluate(f'__engineLab.renderer.mode==="{mode}"'))
  page.locator('.diagnostic-fold summary').click();ok('expanded diagnostic trace draws at nonzero width',page.evaluate('document.getElementById("shaft-trace").width>0'));page.locator('.diagnostic-fold summary').click()
  page.locator('.settings summary').click();page.locator('#performance-mode').select_option('eco');ok('eco rendering preserved',page.evaluate('__engineLab.renderer.pixelRatioLimit===1'))
  page.locator('#performance-mode').select_option('auto');page.locator('#motion').click();ok('reduced motion preserved',page.evaluate('__engineLab.renderer.reduced'))
  page.locator('#volume').fill('40');page.locator('#volume').dispatch_event('input');ok('volume controls work',page.evaluate('Math.abs(__engineLab.audio.volume-.4)<.01'))
  page.locator('.settings summary').click()
  # Inspect the real produced browser audio, not merely an initialization flag.
  page.evaluate('__engineLab.audio.update(__engineLab.engine);window.an=__engineLab.audio.ctx.createAnalyser();an.fftSize=2048;__engineLab.audio.master.connect(an)');page.wait_for_timeout(400)
  report['audio']=page.evaluate('(()=>{const a=new Float32Array(an.fftSize);an.getFloatTimeDomainData(a);return {backend:__engineLab.audio.backend,rms:Math.sqrt(a.reduce((n,v)=>n+v*v,0)/a.length),peak:Math.max(...a.map(Math.abs))}})()')
  ok('browser audio is nonzero and bounded',report['audio']['rms']>1e-6 and report['audio']['peak']<1)
  page.evaluate('__engineLab.engine.setProfile("stress");__engineLab.advance(240,1,true)')
  ok('last cylinder still survives new physics',page.evaluate('__engineLab.engine.activeCount===1&&__engineLab.engine.rpm>=380'))
  page.evaluate('__engineLab.advance(60,1,true,1)');ok('last cylinder also survives full braking',page.evaluate('__engineLab.engine.activeCount===1&&__engineLab.engine.rpm>=380'))
  page.screenshot(path=OUT/'damaged.png',full_page=True)
  report['pools']=page.evaluate('({smoke:__engineLab.renderer.smoke.length,debris:__engineLab.renderer.debris.length,cache:__engineLab.renderer.cache.size})')
  ok('effects remain bounded',report['pools']['smoke']<=260 and report['pools']['debris']<=76 and report['pools']['cache']<50)
  page.evaluate('window.snap=__engineLab.engine.snapshot();__engineLab.restore(snap)')
  ok('restore preserves brake heat but releases inputs',page.evaluate('__engineLab.engine.brakeTemp===snap.brakeTemp&&__engineLab.engine.brake===0&&__engineLab.engine.gasCommand===0'))
  page.locator('.settings summary').click();page.locator('#reset').click();ok('reset still requires confirmation',page.evaluate('__engineLab.engine.activeCount===1'));page.locator('#reset').click();ok('confirmed reset resets brake heat',page.evaluate('__engineLab.engine.activeCount===4&&__engineLab.engine.brakeTemp===24'))
  # Reproducible cost distribution; measures CPU submission and forced raster, not hardware FPS.
  page.evaluate('__engineLab.advance(2,.5,true)')
  report['render_cost']=page.evaluate('(()=>{const a=[];for(let i=0;i<35;i++){let t=performance.now();__engineLab.renderer.render(__engineLab.engine);__engineLab.dashboard.update(__engineLab.engine);__engineLab.renderer.c.getImageData(0,0,1,1);if(i>4)a.push(performance.now()-t)}a.sort((a,b)=>a-b);return {median_ms:a[15],p95_ms:a[28],samples:a.length,viewport:innerWidth}})()')
  mobile=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
  mp=mobile.new_page();mp.on('pageerror',lambda e:report['runtime_errors'].append(str(e)));load(mp)
  ok('mobile has no horizontal overflow',mp.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  boxes={s:mp.locator('#'+s).bounding_box() for s in ['gas','brake']}
  ok('both mobile pedals are visible and at least 44px',all(x['height']>=44 and x['y']>=0 and x['y']+x['height']<=844 for x in boxes.values()))
  # Trusted simultaneous touch via Chromium input, not only synthetic dispatch.
  cdp=mobile.new_cdp_session(mp)
  a=boxes['gas'];bb=boxes['brake'];points=[{'id':21,'x':a['x']+a['width']/2,'y':a['y']+a['height']*.3},{'id':22,'x':bb['x']+bb['width']/2,'y':bb['y']+bb['height']*.55}]
  cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':points})
  ok('trusted two-finger touch controls both pedals',mp.evaluate('__engineLab.pedals.gas>.5&&__engineLab.pedals.brake>.3'))
  mp.evaluate('__engineLab.stepInputs(1)');cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
  ok('trusted touch release releases both pedals',mp.evaluate('__engineLab.pedals.gas===0&&__engineLab.pedals.brake===0'))
  mp.locator('.dashboard').scroll_into_view_if_needed();mp.screenshot(path=OUT/'mobile.png',full_page=True);mp.screenshot(path=OUT/'mobile-viewport.png')
  for width in [320,360,768]:
   mp.set_viewport_size({'width':width,'height':844});ok(f'{width}px layout stays in viewport',mp.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  mp.set_viewport_size({'width':390,'height':844});touch(mp,'gas',77,.6);mp.evaluate('window.dispatchEvent(new PageTransitionEvent("pagehide"))');ok('navigation releases mobile pedals',not mp.evaluate('__engineLab.held'))
  ok('no JavaScript runtime exceptions',not report['runtime_errors'])
  report['transport']='inline' if inline else 'loopback'
  browser.close()
finally:
 server.shutdown()
 (OUT/'report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print(json.dumps(report,indent=2,ensure_ascii=False))
