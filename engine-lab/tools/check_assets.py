"""0.13 checks use the ACTUAL bundled CC0 recordings, with all HTTP requests blocked.
Mobile input is Chromium touch emulation. Not a physical-device FPS benchmark.
"""
import json,time,hashlib,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'dist/verification-13';OUT.mkdir(parents=True,exist_ok=True)
report={'version':'0.13.0','checks':[],'runtime_errors':[],'network_requests':[],'audio_recordings_downloaded':True,'limitations':['Desktop Chromium and mobile emulation; no physical phone tested.','Real files decoded and audio signal checked. Subjective timbre is not a laboratory realism claim.','Local headless render costs are not device FPS guarantees.']}
html=(ROOT/'dist/last-piston.html').read_text().replace('<body>','<body><script>window.__PISTON_TEST__=true;</script>')
def ok(name,value):
 assert value,name
 report['checks'].append(name)
 print('OK',name,flush=True)
def load(page):
 page.on('pageerror',lambda e:report['runtime_errors'].append(str(e)))
 page.route('http://**/*',lambda r:(report['network_requests'].append(r.request.url),r.abort()))
 page.route('https://**/*',lambda r:(report['network_requests'].append(r.request.url),r.abort()))
 page.set_content(html,wait_until='load');page.wait_for_function('window.__engineLab');page.evaluate('__engineLab.pause()');page.wait_for_function('__engineLab.renderer.atlas.parts.size===8')
def touch(page,id,pointer,value,kind='pointerdown'):
 b=page.locator('#'+id).bounding_box();page.locator('#'+id).dispatch_event(kind,{'pointerId':pointer,'pointerType':'touch','button':0,'clientX':b['x']+b['width']/2,'clientY':b['y']+b['height']-10-value*(b['height']-20)})
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':1280,'height':1120},device_scale_factor=1);load(page)
  ok('all eight original SVG parts rasterize without network',page.evaluate('__engineLab.renderer.atlas.failed.length===0&&__engineLab.renderer.atlas.parts.size===8'))
  ok('atlas has a bounded one-time memory footprint',page.evaluate('__engineLab.renderer.atlas.bytes<2500000'))
  ok('fresh engine is off with four cylinders',page.evaluate('__engineLab.engine.ignition==="off"&&__engineLab.engine.activeCount===4'))
  ok('desktop no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  page.locator('#ignition-key').click();page.wait_for_function('__engineLab.audio.ready',timeout=15000)
  ok('all SIX actual CC0 WAV recordings decode entirely offline',page.evaluate('Object.keys(__engineLab.audio.buffers).length===6&&Object.values(__engineLab.audio.stats).every(s=>s.embedded)'))
  ok('no synthesized core or media-stream fallback',page.evaluate('__engineLab.audio.backend==="recordings"&&!__engineLab.audio.dsp&&Object.keys(__engineLab.audio.media).length===0'))
  report['decoded_recordings']=page.evaluate('__engineLab.audio.stats')
  ok('all audio samples have finite bounded prepared peaks',all(0<v['peak']<=.83 for v in report['decoded_recordings'].values()))
  page.evaluate('__engineLab.engine.setProfile("normal");__engineLab.advance(4,0,true);__engineLab.advance(3,.5,true,.3)')
  ok('engine and coupled brake still run',page.evaluate('__engineLab.engine.ignition==="running"&&__engineLab.engine.absorbedKW>0'))
  page.evaluate('window.an=__engineLab.audio.ctx.createAnalyser();an.fftSize=4096;__engineLab.audio.master.connect(an)');page.wait_for_timeout(550)
  report['audio_signal']=page.evaluate('(()=>{let d=new Float32Array(an.fftSize);an.getFloatTimeDomainData(d);return {rms:Math.sqrt(d.reduce((n,v)=>n+v*v,0)/d.length),peak:Math.max(...d.map(Math.abs)),backend:__engineLab.audio.backend}})()')
  ok('actual recordings produce nonzero bounded browser audio',report['audio_signal']['rms']>.0001 and report['audio_signal']['peak']<1)
  ok('three stable loop nodes, not one source per frame',page.evaluate('Object.keys(__engineLab.audio.loops).length===3'))
  page.evaluate('Promise.all([__engineLab.audio.start(),__engineLab.audio.start(),__engineLab.audio.start()])');ok('repeated start does not duplicate loop nodes',page.evaluate('Object.keys(__engineLab.audio.loops).length===3'))
  page.screenshot(path=OUT/'desktop.png',full_page=True);page.locator('.machine').screenshot(path=OUT/'engine.png')
  before=page.evaluate('JSON.stringify(__engineLab.engine.snapshot())')
  page.evaluate('for(let i=0;i<3;i++)__engineLab.renderer.render(__engineLab.engine)')
  ok('rendering cannot advance wear, timing or RNG',before==page.evaluate('JSON.stringify(__engineLab.engine.snapshot())'))
  for part in ['radiator','pump','filter','exhaust','sump']:
   page.locator('[data-part='+part+']').click();ok(part+' component zoom uses the real live scene',page.evaluate(f'__engineLab.renderer.partFocus==="{part}"&&__engineLab.renderer.zoom>1'))
   page.locator('.machine').screenshot(path=OUT/(part+'.png'))
  page.locator('#cyl1').click();ok('cylinder zoom clears part focus',page.evaluate('__engineLab.renderer.partFocus===null&&__engineLab.renderer.focus===1'))
  page.locator('#zoom-out').click();ok('general view clears component selection',page.evaluate('__engineLab.renderer.zoom===1&&document.querySelectorAll("[data-part][aria-pressed=true]").length===0'))
  for mode in ['oil','thermal','damage','section']:
   page.locator('[data-view='+mode+']').click();ok(mode+' inspection layer retained',page.evaluate(f'__engineLab.renderer.mode==="{mode}"'))
  touch(page,'gas',1,.6);touch(page,'brake',2,.3);page.evaluate('__engineLab.stepInputs(1)')
  ok('analogue gas and brake are independent',page.evaluate('__engineLab.pedals.gas>.59&&__engineLab.pedals.brake>.29'))
  page.locator('#gas').dispatch_event('pointercancel',{'pointerId':1});ok('gas cancel preserves held brake',page.evaluate('__engineLab.pedals.gas===0&&__engineLab.pedals.brake>.29'))
  page.locator('#brake').dispatch_event('lostpointercapture',{'pointerId':2});ok('lost capture releases brake',not page.evaluate('__engineLab.held'))
  page.locator('.recording-box summary').click();page.locator('#mechanical-mix').fill('35');page.locator('#mechanical-mix').dispatch_event('input');ok('mechanical mix works independently of engine',page.evaluate('__engineLab.audio.mixSettings.mechanical===.35&&__engineLab.audio.mixSettings.engine===1'))
  page.locator('.recording-box summary').click()
  ok('pipe fluids conserve the model inventory',page.evaluate('Math.abs(__engineLab.engine.oilCircuit.total-__engineLab.engine.oil)<1e-8&&Math.abs(__engineLab.engine.waterCircuit.total-__engineLab.engine.coolantLevel*6)<1e-8'))
  page.evaluate('__engineLab.engine.setProfile("stress");__engineLab.advance(240,1,true)')
  ok('last piston survives with the new assets and contact workspaces',page.evaluate('__engineLab.engine.activeCount===1&&__engineLab.engine.rpm>=380'))
  ok('internal chips remain bounded and at least one gets trapped',page.evaluate('__engineLab.engine.fragments.bodies.length<=64&&__engineLab.engine.fragments.jamCount>0'))
  page.locator('[data-part=sump]').click();page.locator('.machine').screenshot(path=OUT/'sump-damaged.png');page.locator('#zoom-out').click()
  page.screenshot(path=OUT/'damaged.png',full_page=True);page.locator('.machine').screenshot(path=OUT/'engine-damaged.png')
  report['pools']=page.evaluate('({svg:__engineLab.renderer.atlas.parts.size,atlas_bytes:__engineLab.renderer.atlas.bytes,cache:__engineLab.renderer.cache.size,smoke:__engineLab.renderer.smoke.length,internal:__engineLab.engine.fragments.bodies.length,external:__engineLab.renderer.debris.length,loops:Object.keys(__engineLab.audio.loops).length,oneshots:__engineLab.audio.sources.size})')
  ok('memory-heavy effects stay within their budgets',report['pools']['cache']<65 and report['pools']['smoke']<=260 and report['pools']['internal']<=64 and report['pools']['oneshots']<=12)
  page.evaluate('window.saved=__engineLab.engine.snapshot();__engineLab.restore(JSON.parse(JSON.stringify(saved)))')
  ok('restoring keeps internal pieces and releases all input',page.evaluate('__engineLab.engine.fragments.bodies.length===saved.fragments.bodies.length&&__engineLab.pedals.gas===0&&__engineLab.pedals.brake===0'))
  page.locator('#ignition-key').click();page.evaluate('__engineLab.advance(40,0,true)');page.wait_for_timeout(450)
  ok('key-off reaches zero and stops engine recordings',page.evaluate('__engineLab.engine.rpm===0&&__engineLab.audio.loops.idle.gain.gain.value<.001&&__engineLab.audio.loops.load.gain.gain.value<.001'))
  page.locator('.settings summary').click();page.locator('#performance-mode').select_option('eco');ok('eco mode preserved',page.evaluate('__engineLab.renderer.pixelRatioLimit===1'))
  page.locator('#motion').click();ok('reduced motion preserved',page.evaluate('__engineLab.renderer.reduced'))
  page.locator('#reset').click();ok('reset still needs confirmation',page.evaluate('__engineLab.engine.activeCount===1'));page.locator('#reset').click();ok('reset clears debris but keeps shared SVG atlas',page.evaluate('__engineLab.engine.fragments.bodies.length===0&&__engineLab.renderer.atlas.parts.size===8'))
  page.locator('.settings summary').click()
  # Validate destruction of an actual loaded player, including queued one-shots.
  result=page.evaluate('''async()=>{const a=new Piston.MotorAudio();a.muted=true;await a.start();for(let i=0;i<40;i++)a.play('impact',.1);const peak=a.sources.size;a.destroy();await new Promise(r=>setTimeout(r,30));return {peak,closed:a.ctx.state,loops:Object.keys(a.loops).length,voices:a.sources.size,timer:a.timer,revive:await a.start()};}''')
  report['audio_cleanup']=result;ok('one-shots capped and destroy closes every live audio resource',result['peak']<=12 and result['closed']=='closed' and result['voices']==0 and result['loops']==0 and result['timer'] is None and result['revive'] is False)
  page.evaluate('__engineLab.engine.requestStart();__engineLab.advance(4,0,true);__engineLab.advance(3,.5,true)');
  report['render_cost']=page.evaluate('(()=>{const a=[];for(let i=0;i<35;i++){let t=performance.now();__engineLab.renderer.render(__engineLab.engine);__engineLab.renderer.c.getImageData(0,0,1,1);if(i>4)a.push(performance.now()-t)}a.sort((a,b)=>a-b);return {median_ms:a[15],p95_ms:a[28],samples:a.length,mode:__engineLab.renderer.performanceMode}})()')
  mobile=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
  mp=mobile.new_page();load(mp);ok('mobile no horizontal overflow',mp.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  mp.locator('#ignition-key').click();mp.wait_for_function('__engineLab.audio.ready');mp.evaluate('__engineLab.advance(4,0,true)')
  box={k:mp.locator('#'+k).bounding_box() for k in ['gas','brake']};ok('both mobile pedals remain accessible',all(b['height']>=44 and b['y']>=0 and b['y']+b['height']<=844 for b in box.values()))
  cdp=mobile.new_cdp_session(mp);points=[{'id':i+1,'x':box[k]['x']+box[k]['width']/2,'y':box[k]['y']+box[k]['height']*.35}for i,k in enumerate(['gas','brake'])]
  cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':points});ok('trusted two-finger throttle and brake',mp.evaluate('__engineLab.pedals.gas>.5&&__engineLab.pedals.brake>.5'));cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});ok('trusted touch release clears inputs',not mp.evaluate('__engineLab.held'))
  mp.locator('[data-part=exhaust]').click();mp.locator('.machine').screenshot(path=OUT/'mobile-exhaust.png');ok('mobile zoom is not stretched',mp.evaluate('__engineLab.renderer.scale===__engineLab.renderer.sy'))
  mp.locator('#zoom-out').click();mp.screenshot(path=OUT/'mobile.png',full_page=True)
  for width in [320,360,768]:
   mp.set_viewport_size({'width':width,'height':844});ok(str(width)+'px stays within viewport',mp.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  ok('no HTTP requests needed for sound OR SVG',len(report['network_requests'])==0)
  ok('no JavaScript runtime exceptions',not report['runtime_errors'])
  browser.close()
finally:
 (OUT/'report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print(json.dumps(report,indent=2,ensure_ascii=False))
