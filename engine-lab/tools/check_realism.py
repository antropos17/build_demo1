"""Visual/input/contact checks and sample PLAYER integration.
Audio is a generated TEST FIXTURE injected in memory only, never a shipped asset.
This cannot verify the timbre or reachability of the third-party recordings.
"""
import base64,io,json,math,struct,wave,os,time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'dist/verification-12';OUT.mkdir(parents=True,exist_ok=True)
report={'version':'0.12.0','checks':[],'runtime_errors':[],'audio_recordings_downloaded':False,
 'limitations':['Container cannot download external sound files. Real recording playback/timbre not verified.',
 'Sample player tested with an in-memory generated WAV fixture, not substituted in distributed files.',
 'Browser used inline portable HTML; mobile tests are emulation, not physical devices.']}
def ok(name,value):
 assert value,name
 report['checks'].append(name)
# WAV fixture for decoder, loop routing and lifecycle assertions only.
bio=io.BytesIO()
with wave.open(bio,'wb') as w:
 w.setnchannels(1);w.setsampwidth(2);w.setframerate(22050)
 w.writeframes(b''.join(struct.pack('<h',int(5000*math.sin(2*math.pi*173*i/22050))) for i in range(11025)))
fixture=base64.b64encode(bio.getvalue()).decode()
base=(ROOT/'dist/last-piston.html').read_text().replace('<body>','<body><script>window.__PISTON_TEST__=true;</script>')
fixture_html=base.replace('window.Piston.EMBEDDED_AUDIO = {};','window.Piston.EMBEDDED_AUDIO = '+json.dumps({k:fixture for k in ['idle','load','starter','impact','rattle','click']})+';')
def load(page):
 page.set_content(fixture_html,wait_until='load');page.wait_for_function('window.__engineLab');page.evaluate('__engineLab.pause()')
def touch(page,id,pointer,value,kind='pointerdown'):
 b=page.locator('#'+id).bounding_box();page.locator('#'+id).dispatch_event(kind,{'pointerId':pointer,'pointerType':'touch','button':0,'clientX':b['x']+b['width']/2,'clientY':b['y']+b['height']-10-value*(b['height']-20)})
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1280,'height':1120},device_scale_factor=1)
 page.on('pageerror',lambda e:report['runtime_errors'].append(str(e)));load(page)
 ok('v7 starts with manual ignition off',page.evaluate('__engineLab.engine.snapshot().version===7&&__engineLab.engine.ignition==="off"'))
 ok('no horizontal overflow on desktop',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
 ok('six CC0 sources are credited in the interface',page.locator('#sample-credits a').count()==6)
 page.locator('#ignition-key').click();page.wait_for_function('__engineLab.audio.ready')
 ok('recordings player replaces the old DSP',page.evaluate('__engineLab.audio.backend==="recordings" && !__engineLab.audio.dsp'))
 ok('all six test WAV fixtures decoded by browser',page.evaluate('Object.keys(__engineLab.audio.buffers).length===6'))
 page.evaluate('__engineLab.advance(4,0,true)');ok('key starts engine with new systems installed',page.evaluate('__engineLab.engine.ignition==="running"'))
 touch(page,'gas',1,.45);touch(page,'brake',2,.3);page.evaluate('__engineLab.stepInputs(2)')
 ok('independent analogue pedals remain active',page.evaluate('__engineLab.pedals.gas>.44&&__engineLab.pedals.brake>.29'))
 page.locator('#gas').dispatch_event('pointercancel',{'pointerId':1});ok('gas cancel keeps brake',page.evaluate('__engineLab.pedals.gas===0&&__engineLab.pedals.brake>.29'))
 page.locator('#brake').dispatch_event('pointerup',{'pointerId':2});ok('brake releases',not page.evaluate('__engineLab.held'))
 page.evaluate('__engineLab.advance(5,.45,true,.3)')
 ok('circuits have nonzero moving volume',page.evaluate('__engineLab.engine.oilCircuit.q>0&&__engineLab.engine.waterCircuit.q>0'))
 ok('fluid inventories match physical parent reservoirs',page.evaluate('Math.abs(__engineLab.engine.oilCircuit.total-__engineLab.engine.oil)<1e-8&&Math.abs(__engineLab.engine.waterCircuit.total-__engineLab.engine.coolantLevel*6)<1e-8'))
 page.screenshot(path=OUT/'clean.png',full_page=True)
 before=page.evaluate('JSON.stringify(__engineLab.engine.snapshot())');page.evaluate('__engineLab.renderer.render(__engineLab.engine)')
 ok('paused rendering does not modify model or RNG',before==page.evaluate('JSON.stringify(__engineLab.engine.snapshot())'))
 page.locator('#cyl0').click();ok('zoom is retained',page.evaluate('__engineLab.renderer.zoom>1'))
 for mode in ['oil','thermal','damage','section']:
  page.locator(f'[data-view={mode}]').click();ok(mode+' layer works',page.evaluate(f'__engineLab.renderer.mode==="{mode}"'))
 page.locator('#zoom-out').click()
 # Recorded-buffer decoding/mixing check, not a test of remote recording fidelity.
 page.evaluate('__engineLab.audio.update(__engineLab.engine);window.an=__engineLab.audio.ctx.createAnalyser();an.fftSize=2048;__engineLab.audio.master.connect(an)')
 page.wait_for_timeout(350)
 signal=page.evaluate('(()=>{let d=new Float32Array(an.fftSize);an.getFloatTimeDomainData(d);return {rms:Math.sqrt(d.reduce((s,x)=>s+x*x,0)/d.length),peak:Math.max(...d.map(Math.abs)),loop_nodes:Object.keys(__engineLab.audio.loops).length}})()')
 report['audio_player_fixture']=signal;ok('fixture produces finite nonzero bounded audio',signal['rms']>1e-6 and signal['peak']<1)
 ok('sample loops do not grow with updates',signal['loop_nodes']==3)
 page.evaluate('for(let i=0;i<40;i++)__engineLab.audio.event({type:"cylinder"})')
 ok('one-shot nodes are hard capped',page.evaluate('__engineLab.audio.sources.size<=10'))
 page.evaluate('__engineLab.audio.mute()');ok('mute works',page.evaluate('__engineLab.audio.muted'))
 page.evaluate('__engineLab.audio.mute()')
 page.evaluate('__engineLab.engine.setProfile("stress");__engineLab.advance(32,1,true)')
 ok('visible internal chips are emitted by wear',page.evaluate('__engineLab.engine.fragments.bodies.length>0'))
 ok('jamming is model state, not random rendering',page.evaluate('__engineLab.engine.fragments.jamCount>0'))
 page.locator('#cyl0').click();page.locator('[data-view=damage]').click();page.screenshot(path=OUT/'jam-detail.png',full_page=True)
 page.locator('#zoom-out').click();page.locator('[data-view=section]').click()
 page.evaluate('__engineLab.advance(100,1,true)')
 ok('three cylinders can fail without killing survivor',page.evaluate('__engineLab.engine.activeCount===1'))
 ok('internal fragments stay bounded',page.evaluate('__engineLab.engine.fragments.bodies.length<=64'))
 ok('case fragments remain inside sump walls',page.evaluate('__engineLab.engine.fragments.bodies.filter(p=>p.zone==="case").every(p=>p.x>=305+p.r-.01&&p.x<=890-p.r+.01&&p.y>=417+p.r-.01&&p.y<=548-p.r+.01)'))
 ok('external effects remain bounded',page.evaluate('__engineLab.renderer.smoke.length<=260 && __engineLab.renderer.debris.length<=76'))
 page.screenshot(path=OUT/'damaged.png',full_page=True)
 report['damaged']=page.evaluate('({active:__engineLab.engine.activeCount,fragments:__engineLab.engine.fragments.bodies.length,jams:__engineLab.engine.fragments.jamCount,impacts:__engineLab.engine.fragments.impacts,smoke:__engineLab.renderer.smoke.length,cache:__engineLab.renderer.cache.size})')
 page.evaluate('window.saved=JSON.parse(JSON.stringify(__engineLab.engine.snapshot()));__engineLab.restore(saved)')
 ok('reload preserves the internal wreckage',page.evaluate('__engineLab.engine.fragments.bodies.length===saved.fragments.bodies.length&&__engineLab.engine.fragments.jamCount===saved.fragments.bodies.filter(p=>p.jammed).length'))
 page.locator('#ignition-key').click();page.evaluate('__engineLab.advance(90,0,true)')
 ok('key off stops shaft and circulation',page.evaluate('__engineLab.engine.rpm===0&&__engineLab.engine.oilCircuit.q<1e-8&&__engineLab.engine.waterCircuit.q<1e-8'))
 ok('manual stop preserves the survivor and fragments',page.evaluate('__engineLab.engine.activeCount===1&&__engineLab.engine.fragments.bodies.length>0'))
 page.locator('#ignition-key').click();page.evaluate('__engineLab.advance(5,0,true)');ok('damaged engine restarts',page.evaluate('__engineLab.engine.ignition==="running"&&__engineLab.engine.activeCount===1'))
 page.locator('.settings summary').click();page.locator('#performance-mode').select_option('eco');ok('eco graphics still available',page.evaluate('__engineLab.renderer.pixelRatioLimit===1'))
 page.locator('#motion').click();ok('reduced shake retained',page.evaluate('__engineLab.renderer.reduced'))
 page.locator('#reset').click();ok('reset requires confirmation',page.evaluate('__engineLab.engine.activeCount===1'));page.locator('#reset').click();ok('reset clears internal chips',page.evaluate('__engineLab.engine.fragments.bodies.length===0&&__engineLab.engine.activeCount===4'))
 # Measure CPU submission with forced raster. Not device FPS.
 page.evaluate('__engineLab.engine.requestStart();__engineLab.advance(4,0,true);__engineLab.advance(3,.5,true)')
 report['render_cost']=page.evaluate('(()=>{let a=[];for(let i=0;i<30;i++){let t=performance.now();__engineLab.renderer.render(__engineLab.engine);__engineLab.renderer.c.getImageData(0,0,1,1);if(i>4)a.push(performance.now()-t)}a.sort((a,b)=>a-b);return {median_ms:a[12],p95_ms:a[23],samples:a.length,mode:__engineLab.renderer.performanceMode}})()')
 # Explicit failing-source test: visible error and no oscillator fallback.
 fail=browser.new_page();fail.on('pageerror',lambda e:report['runtime_errors'].append(str(e)))
 fail_html=base.replace('<body>','<body><script>window.fetch=async()=>{throw Error("offline test")};window.Audio=class {load(){setTimeout(()=>this.onerror?.(),0)}pause(){}};</script>')
 fail.set_content(fail_html);fail.wait_for_function('window.__engineLab');fail.evaluate('__engineLab.pause()');fail.locator('#ignition-key').click()
 fail.wait_for_function('document.getElementById("recording-status").textContent.includes("не загрузилось")')
 ok('failed recordings show a clear offline message',True);ok('no synthetic fallback secretly starts',fail.evaluate('!__engineLab.audio.ready&&!__engineLab.audio.dsp&&Object.keys(__engineLab.audio.loops).length===0'))
 fail.close()
 mobile=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
 mp=mobile.new_page();mp.on('pageerror',lambda e:report['runtime_errors'].append(str(e)));load(mp)
 ok('mobile has no horizontal overflow',mp.evaluate('document.documentElement.scrollWidth<=innerWidth'))
 mp.locator('#ignition-key').click();mp.evaluate('__engineLab.advance(4,0,true)');
 bb={k:mp.locator('#'+k).bounding_box() for k in ['gas','brake']}
 ok('both touch targets exceed 44px',all(b['height']>=44 for b in bb.values()))
 cdp=mobile.new_cdp_session(mp);points=[{'id':i+1,'x':bb[k]['x']+bb[k]['width']/2,'y':bb[k]['y']+bb[k]['height']*.35} for i,k in enumerate(['gas','brake'])]
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':points});ok('trusted simultaneous touch controls both pedals',mp.evaluate('__engineLab.pedals.gas>.5&&__engineLab.pedals.brake>.5'))
 mp.evaluate('__engineLab.stepInputs(1)');cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});ok('touch release clears both inputs',not mp.evaluate('__engineLab.held'))
 mp.screenshot(path=OUT/'mobile.png',full_page=True)
 for width in [320,360,768]:
  mp.set_viewport_size({'width':width,'height':844});ok(str(width)+'px no overflow',mp.evaluate('document.documentElement.scrollWidth<=innerWidth'))
 ok('no runtime JavaScript exceptions',not report['runtime_errors']);browser.close()
(OUT/'report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print(json.dumps(report,ensure_ascii=False,indent=2))
