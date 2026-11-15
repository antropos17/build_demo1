from pathlib import Path
import math,json,hashlib
root=Path(__file__).resolve().parents[1]; out=root/'assets/svg';out.mkdir(parents=True,exist_ok=True)
def svg(name,w,h,title,body,defs=''):
    text=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-labelledby="title"><title id="title">{title}</title><defs>
    <linearGradient id="steel"><stop stop-color="#53636a"/><stop offset=".12" stop-color="#c8ceca"/><stop offset=".26" stop-color="#829198"/><stop offset=".54" stop-color="#4b5d65"/><stop offset=".79" stop-color="#aab7b9"/><stop offset="1" stop-color="#d7dcd5"/></linearGradient>
    <linearGradient id="dark"><stop stop-color="#26383f"/><stop offset=".5" stop-color="#566a71"/><stop offset="1" stop-color="#1c2e36"/></linearGradient>
    <linearGradient id="brass"><stop stop-color="#6d593a"/><stop offset=".3" stop-color="#d0bb8b"/><stop offset=".58" stop-color="#9a855a"/><stop offset="1" stop-color="#c4b99a"/></linearGradient>
    <pattern id="turned" width="2" height="2" patternUnits="userSpaceOnUse"><path d="M0 .5h2" stroke="#dde6e1" opacity=".12" stroke-width=".4"/></pattern>
    <g id="bolt"><circle r="3.8" fill="#17282f"/><path d="M-2.8-1.6V1.6L0 3.2l2.8-1.6v-3.2L0-3.2Z" fill="#aab9b8" stroke="#d1d8d1" stroke-width=".45"/><path d="M-1.3 0h2.6" stroke="#3d535c" stroke-width=".7"/></g>{defs}</defs>{body}</svg>'''
    (out/(name+'.svg')).write_text(text)
    return text
assets={}
body='<path d="M6 13h108v154H6Z" fill="#17262e" stroke="#8d9c9d" stroke-width="1.5"/>'
body+='<rect x="13" y="23" width="94" height="133" rx="2" fill="#23363e"/>'
body+='<defs><pattern id="louvers" width="6" height="4" patternUnits="userSpaceOnUse"><path d="M0 .5h6" stroke="#70848a" stroke-width=".65"/><path d="M0 1.9h6" stroke="#0c1c24" stroke-width=".8"/><path d="M0 1l2 1.1 2-1.1" fill="none" stroke="#9aa8a8" stroke-width=".4" opacity=".6"/></pattern></defs><rect x="14" y="25" width="92" height="130" fill="url(#louvers)"/>'
for x in [20,43,66,89]:body+=f'<path d="M{x} 23v132" stroke="#4c626c" stroke-width="3"/><path d="M{x-1} 23v132" stroke="#a0b0ae" stroke-width=".5"/>'
body+='<rect x="2" y="13" width="11" height="151" rx="3" fill="url(#dark)" stroke="#889e9f" stroke-width=".8"/><rect x="107" y="13" width="11" height="151" rx="3" fill="url(#dark)" stroke="#889e9f" stroke-width=".8"/><rect x="5" y="12" width="110" height="11" rx="2" fill="url(#steel)" stroke="#bec8c2" stroke-width=".7"/><rect x="5" y="155" width="110" height="10" rx="2" fill="url(#steel)"/><path d="M13 156h94" stroke="#d1d7d0" stroke-width=".8"/>'
for x in [8,112]:
    for y in [17,160]:body+=f'<use href="#bolt" x="{x}" y="{y}"/>'
body+='<rect x="7" y="6" width="13" height="7" rx="1" fill="#5f747d" stroke="#a6b6b5"/><rect x="98" y="6" width="13" height="7" rx="1" fill="#5f747d" stroke="#a6b6b5"/>'
assets['radiator-core']=svg('radiator-core',120,176,'Ламельный радиатор: соты, плоские трубки, боковые бачки и крепёж',body)
body='<circle cx="50" cy="50" r="46" fill="#15232a" fill-opacity=".18" stroke="#acb8b8" stroke-width="1.2"/><circle cx="50" cy="50" r="42" fill="none" stroke="#405962" stroke-width=".8"/>'
for i in range(7):
    body+=f'<g transform="rotate({i*360/7} 50 50)"><path d="M47 41C46 28 55 6 66 12C74 16 68 34 58 46Z" fill="url(#steel)" stroke="#a9b8b7" stroke-width=".7"/><path d="M52 39C54 28 57 18 65 14" fill="none" stroke="#d5ded6" stroke-width=".7"/><path d="M58 45C65 32 72 19 66 12" fill="none" stroke="#293c44" stroke-width="1.1"/></g>'
body+='<circle cx="50" cy="50" r="11" fill="url(#steel)" stroke="#c6ceca" stroke-width="1.1"/><circle cx="50" cy="50" r="7" fill="#3c535d"/><use href="#bolt" x="50" y="50"/>'
assets['fan-rotor']=svg('fan-rotor',100,100,'Семилопастной вентилятор с профилированными лопастями',body)
body='<path d="M13 13H59L65 19V76L56 84H16L7 76V19Z" fill="url(#steel)" stroke="#c4ccc5" stroke-width="1.2"/><rect x="14" y="20" width="44" height="52" rx="4" fill="#14272e" stroke="#758b90"/>'
for i in range(14):
    x=17+i*2.8
    body+=f'<path d="M{x} 24v43l1.3 2 .8-2V24Z" fill="#a18d62" stroke="#574d37" stroke-width=".4"/>'
body+='<rect x="30" y="21" width="12" height="49" rx="1" fill="url(#steel)" stroke="#c3cdc4" stroke-width=".5"/>'
for y in range(25,66,5):
 for x in [33,39]:body+=f'<circle cx="{x}" cy="{y}" r="1" fill="#22343b"/>'
body+='<path d="M19 17h34M16 73h40" stroke="#293c44" stroke-width="3"/><path d="M18 74h37" stroke="#c4c3aa"/><path d="M32 72l8 2-8 2 8 2-8 2" fill="none" stroke="#5f7174" stroke-width="1"/><rect x="25" y="5" width="22" height="10" rx="2" fill="url(#dark)" stroke="#acbcba"/><path d="M29 6v8m4-8v8m4-8v8m4-8v8" stroke="#a4b6b6" stroke-width=".7"/><rect x="13" y="20" width="46" height="52" rx="4" fill="none" stroke="#bdcec9" stroke-width="1"/><path d="M17 23v44" stroke="#d9e5df" stroke-opacity=".3" stroke-width="2"/>'
assets['filter-cutaway']=svg('filter-cutaway',72,88,'Разрез масляного фильтра: складчатый элемент, перфорированный канал, пружина и уплотнения',body)
body='<path d="M8 24L22 7h27l22 18v29L53 72H24L8 56Z" fill="url(#steel)" stroke="#cbd2ca" stroke-width="1.2"/><circle cx="40" cy="40" r="27" fill="#182e36" stroke="#96a9ab" stroke-width="1.2"/><circle cx="40" cy="40" r="23" fill="#25424c" stroke="#4a6971" stroke-width=".8"/><path d="M14 26H3v13h11M65 40h12v17H61" fill="url(#dark)" stroke="#a8b8b8" stroke-width="1"/><path d="M16 51a25 25 0 0 0 42 8" fill="none" stroke="#adbaa8" stroke-width="1"/>'
for x,y in [(21,18),(60,23),(60,62),(20,61)]:body+=f'<use href="#bolt" x="{x}" y="{y}"/>'
assets['pump-cutaway']=svg('pump-cutaway',80,80,'Корпус центробежной помпы с разрезом улитки и видимым рабочим колесом',body)
body='<circle cx="35" cy="35" r="27" fill="url(#brass)" stroke="#baac85" stroke-width="1"/><circle cx="35" cy="35" r="22" fill="#374947"/>'
for i in range(6):body+=f'<path transform="rotate({i*60} 35 35)" d="M32 31C23 25 28 12 37 10L41 15C32 18 32 24 39 29Z" fill="url(#brass)" stroke="#d0c3a3" stroke-width=".6"/>'
body+='<circle cx="35" cy="35" r="9" fill="url(#steel)" stroke="#d7dccf"/><circle cx="35" cy="35" r="4" fill="#263d47"/>'
assets['pump-impeller']=svg('pump-impeller',70,70,'Шестилопастное рабочее колесо насоса',body)
body='<path d="M4 23L19 7h30l15 16v22L48 62H20L4 45Z" fill="url(#steel)" stroke="#bac6be"/><circle cx="34" cy="34" r="23" fill="#1b333b" stroke="#9ab0b2"/><path d="M12 30h44v8H12Z" fill="#5c757b" stroke="#b2c3bc"/><rect x="27" y="19" width="14" height="30" rx="5" fill="url(#brass)" stroke="#c6b98f"/><path d="M26 21l16 4-16 4 16 4-16 4 16 4-16 4" fill="none" stroke="#d5d8c6" stroke-width="1.2"/>'
for x,y in [(16,18),(51,18),(16,50),(51,50)]:body+=f'<use href="#bolt" x="{x}" y="{y}"/>'
assets['thermostat-cutaway']=svg('thermostat-cutaway',68,68,'Восковой термостат в разрезе: капсула, пружина, седло и обходной канал',body)
defs='<pattern id="packing" width="7" height="6" patternUnits="userSpaceOnUse"><path d="M0 0l7 6M0 6L7 0" stroke="#6d746c" stroke-width=".55" opacity=".7"/></pattern>'
body='<path d="M16 10h137q20 0 23 22v40q-3 23-23 23H16Q3 89 3 72V32Q3 17 16 10Z" fill="url(#steel)" stroke="#c2c9c1" stroke-width="1.4"/><path d="M14 20h146v64H14Z" fill="#172a33" stroke="#72868a" stroke-width="1"/><path d="M15 21h144v12H15Zm0 50h144v12H15Z" fill="url(#packing)"/><path d="M15 33h144M15 71h144" stroke="#9da99e" stroke-width=".7"/>'
for x in [48,92,135]:body+=f'<path d="M{x} 22h4v60h-4Z" fill="url(#steel)" stroke="#bdc4b7" stroke-width=".6"/><circle cx="{x+2}" cy="40" r="4" fill="#1b303a"/><circle cx="{x+2}" cy="64" r="4" fill="#1b303a"/>'
body+='<path d="M15 43h34v21h45V44h65" fill="none" stroke="#8b9897" stroke-width="7"/><path d="M15 41h34v21h45V42h65" fill="none" stroke="#d0d0bd" stroke-width="1"/>'
for x in range(17,158,6):body+=f'<circle cx="{x}" cy="43" r=".9" fill="#152831"/>'
for x in [8,168]:
 for y in range(25,82,4):body+=f'<path d="M{x} {y}l3 1.7 2-1.7" fill="none" stroke="#aab4aa" stroke-width=".7"/>'
body+='<path d="M20 13h131M21 91h130" stroke="#e1e1d2" stroke-width=".7"/><rect x="32" y="88" width="115" height="2" fill="#354952"/><path d="M158 24v55M15 24v55" stroke="#d9e3d8" stroke-opacity=".25" stroke-width="2"/>'
assets['muffler-cutaway']=svg('muffler-cutaway',180,104,'Разрез глушителя: три перегородки, перфорированная труба и волокнистая набивка',body,defs)
body='<circle cx="30" cy="30" r="25" fill="url(#steel)" stroke="#cad3cb" stroke-width="1"/><circle cx="30" cy="30" r="20" fill="none" stroke="#455d67" stroke-width="2"/><circle cx="30" cy="30" r="15" fill="#172a33" stroke="#9dafb0" stroke-width="1.2"/><path d="M9 29h42" stroke="#d2d9d0" stroke-opacity=".18"/>'
for i in range(4):
 a=i*math.pi/2+math.pi/4; x=30+21*math.cos(a);y=30+21*math.sin(a);body+=f'<use href="#bolt" x="{x:.3f}" y="{y:.3f}"/>'
assets['flange']=svg('flange',60,60,'Стальной четырёхболтовый фланец, прокладка и расточка',body)
manifest=[{'id':k,'path':f'assets/svg/{k}.svg','bytes':len(v.encode()),'sha256':hashlib.sha256(v.encode()).hexdigest(),'provenance':'Original procedural SVG authored for Last Piston 0.13; no external images'} for k,v in assets.items()]
(root/'assets/svg-manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False))
(root/'assets/mechanical-atlas.js').write_text('/* Original vector parts; embedded by the single-file packager. */\nwindow.Piston.MECHANICAL_SVG='+json.dumps(assets,ensure_ascii=False)+';\n')
print('SVG assets:',len(assets),'source bytes:',sum(len(s) for s in assets.values()))
