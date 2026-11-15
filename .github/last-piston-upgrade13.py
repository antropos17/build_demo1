from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]/'engine-lab'
version=json.loads((root/'package.json').read_text())['version']
if version=='0.13.0':
    raise SystemExit('Integration already applied')
assert version=='0.12.0', 'Refusing to patch an unknown source version'
p=root/'index.html';s=p.read_text().replace('ENGINE LAB / 12','ENGINE LAB / 13').replace('ПУЛЬТ УПРАВЛЕНИЯ <b>/ 12','ПУЛЬТ УПРАВЛЕНИЯ <b>/ 13')
s=s.replace('<link rel="stylesheet" href="realism.css">','<link rel="stylesheet" href="realism.css">\n<link rel="stylesheet" href="assets.css">')
s=s.replace('<script defer src="src/sample-audio.js">','<script defer src="src/audio-utils.js"></script><script defer src="src/sample-audio.js">')
s=s.replace('<script defer src="src/pedals.js">','<script defer src="assets/mechanical-atlas.js"></script><script defer src="src/asset-renderer.js"></script><script defer src="src/pedals.js">')
s=s.replace('</nav>\n<section class="machine"','''</nav>
<div class="part-tools" role="group" aria-label="Осмотр отдельных узлов"><span>УЗЛЫ</span><button type="button" data-part="radiator" aria-pressed="false">Радиатор</button><button type="button" data-part="pump" aria-pressed="false">Помпа</button><button type="button" data-part="filter" aria-pressed="false">Фильтр</button><button type="button" data-part="exhaust" aria-pressed="false">Выпуск</button><button type="button" data-part="sump" aria-pressed="false">Картер</button><span class="offline-badge" title="Звуковые записи и SVG встроены в файл">АССЕТЫ ВНУТРИ</span></div>
<section class="machine"''')
s=s.replace('Записи загружаются при включении звука. Для этой сборки нужна сеть.','Шесть исходных записей встроены в этот HTML. Интернет для звука не нужен.')
s=s.replace('Записи звука и лицензии <span>CC0</span>','Записи звука и лицензии <span>CC0 · <b id="audio-loaded">0/6</b></span>')
s=s.replace('<button id="reload-audio" type="button">Повторить загрузку записей</button>','''<button id="reload-audio" type="button">Проверить / включить записи</button><div class="audio-mix"><label for="engine-mix">Двигатель <output id="engine-mix-value">100%</output></label><input type="range" id="engine-mix" min="0" max="100" value="100"><label for="mechanical-mix">Металл и дребезг <output id="mechanical-mix-value">70%</output></label><input type="range" id="mechanical-mix" min="0" max="100" value="70"></div>''')
s=s.replace('Офлайн-аудиопак: <code>npm run audio:fetch &amp;&amp; npm run build</code>. Встроенный пакет имеет приоритет над сетевыми файлами.','Встроены оригинальные WAV, без синтетического основного звука. Настоящие записи общих двигателей, не точный голос заводского I4. SVG-механика создана специально для этого проекта.')
p.write_text(s)
p=root/'src/app.js';s=p.read_text()
s=s.replace("if(Number.isFinite(prefs.volume)) sound.setVolume(prefs.volume);", "if(Number.isFinite(prefs.volume)) sound.setVolume(prefs.volume);\n  for(const channel of ['engine','mechanical']) if(Number.isFinite(prefs.mix?.[channel])) sound.setMix(channel,prefs.mix[channel]);")
s=s.replace("view.zoom=1;$('inspection-note')", "view.zoom=1;view.partFocus=null;$('inspection-note')")
s=s.replace("view.zoom>1&&view.focus===i", "view.zoom>1&&!view.partFocus&&view.focus===i")
s=s.replace("if(view.zoom>1){const cy=model.cylinders[view.focus];", "if(view.zoom>1&&!view.partFocus){const cy=model.cylinders[view.focus];")
s=s.replace("performance:view.performanceMode }", "performance:view.performanceMode, mix:sound.mixSettings }")
s=s.replace("const focus=()=>{view.setFocus(i);hud();view.render(model);};", "const focus=()=>{view.setFocus(i);syncParts();hud();view.render(model);};")
needle="  function persist() {"
new='''  function syncParts(){
    for(const b of document.querySelectorAll('[data-part]')) b.setAttribute('aria-pressed',String(view.partFocus===b.dataset.part&&view.zoom>1));
  }
  for(const b of document.querySelectorAll('[data-part]')) b.addEventListener('click',()=>{
    view.setPart(b.dataset.part);syncParts();hud();view.render(model);
  });
  $('zoom-out').addEventListener('click',syncParts);
  for(const channel of ['engine','mechanical']) {
    const slider=$(channel+'-mix'),output=$(channel+'-mix-value');slider.value=Math.round(sound.mixSettings[channel]*100);output.textContent=slider.value+'%';
    slider.addEventListener('input',()=>{sound.setMix(channel,Number(slider.value)/100);output.textContent=slider.value+'%';persist();});
  }
  sound.onStatus=()=>{audioStatus();};
'''+needle
s=s.replace(needle,new)
s=s.replace('journal(); dashboard.update(model); ignitionPanel.update(model);', '''journal(); dashboard.update(model); ignitionPanel.update(model);syncParts();
    if(view.partFocus&&view.zoom>1){
      const descriptions={radiator:`Радиатор: ${model.waterCircuit.cells[3].temp.toFixed(0)}°C · вентилятор ${Math.round(model.relay.fan*2200)} rpm`,pump:`ОЖ: ${model.waterCircuit.q.toFixed(1)} л/мин · паровая доля ${Math.round(model.waterCircuit.vapour*100)}%`,filter:`Масло: ${model.oilCircuit.q.toFixed(1)} л/мин · фильтр ${Math.round(model.oilCircuit.filterLoad*100)}% · перепуск ${Math.round(model.oilCircuit.bypass*100)}%`,exhaust:`Коллектор ${Math.round(model.exhaust.manifold)}°C · глушитель ${Math.round(model.exhaust.resonator)}°C · давление ${model.exhaust.pressure.toFixed(1)} kPa`,sump:`Осколков ${model.fragments.bodies.length} · зажато ${model.fragments.jamCount} · сопротивление ${model.fragments.resistance.toFixed(1)} Н·м`};
      $('inspection-note').textContent=descriptions[view.partFocus];
    }''')
p.write_text(s)
p=root/'tests/build.test.cjs';s=p.read_text().replace('assert.equal(scripts.length, 22);', '''assert.equal(scripts.length, [...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script defer src=/g)].length);''').replace('300000 + fs.statSync','550000 + fs.statSync');p.write_text(s)
p=root/'package.json';d=json.loads(p.read_text());d['version']='0.13.0';d['scripts']['assets:svg']='python3 tools/make-svg-assets.py';d['scripts']['assets:verify']='node tools/verify-assets.cjs';p.write_text(json.dumps(d,indent=2)+'\n')
p=root/'src/internals.js';s=p.read_text()
s=s.replace("class Fragments{",'''function writeGeometry(phase,i,x,d){
 const r=43,length=142,a=phase-base.FIRE[i];d.x=x;d.crankX=x+Math.sin(a)*r;d.crankY=460-Math.cos(a)*r;
 d.pinY=d.crankY-Math.sqrt(length*length-(d.crankX-x)**2);d.top=d.pinY-36;d.cycle=((a%(TAU*2))+TAU*2)%(TAU*2);return d;
}
class Fragments{''')
s=s.replace('this.events=[];}\n random()', 'this.events=[];this._moving=XS.map(()=>({}));this._previous=XS.map(()=>({}));this._frozen=XS.map(()=>({}));this._geo=Array(4);}\n random()')
s=s.replace('const moving=XS.map((x,i)=>pistonGeometry(a,i,x)),previous=XS.map((x,i)=>pistonGeometry(a-m.shaftSpeed*h,i,x));\n   const geo=moving.map((g,i)=>m.cylinders[i].active?g:pistonGeometry(m.cylinders[i].freeze,i,XS[i]));', '''const moving=this._moving,previous=this._previous,geo=this._geo;
   for(let i=0;i<4;i++){writeGeometry(a,i,XS[i],moving[i]);writeGeometry(a-m.shaftSpeed*h,i,XS[i],previous[i]);geo[i]=m.cylinders[i].active?moving[i]:writeGeometry(m.cylinders[i].freeze,i,XS[i],this._frozen[i]);}''')
s=s.replace('p.jamAge+=h;jamTorque+=', 'if(m.rpm>1)p.jamAge+=h;jamTorque+=')
s=s.replace('FRAGMENT_CAP:CAP}', 'FRAGMENT_CAP:CAP,writeGeometry}')
p.write_text(s)
