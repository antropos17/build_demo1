'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function sha(bytes){return crypto.createHash('sha256').update(bytes).digest('hex');}
const context={window:{Piston:{}}};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/soundbank.js'),'utf8'),context);vm.runInNewContext(fs.readFileSync(path.join(root,'assets/mechanical-atlas.js'),'utf8'),context);
const sounds=JSON.parse(fs.readFileSync(path.join(root,'assets/audio-manifest.json'))),svg=JSON.parse(fs.readFileSync(path.join(root,'assets/svg-manifest.json')));
if(sounds.length!==6||svg.length!==8)throw Error('Incomplete asset pack');
for(const m of sounds){const original=fs.readFileSync(path.join(root,m.file));const embedded=Buffer.from(context.window.Piston.EMBEDDED_AUDIO[m.id],'base64');if(sha(original)!==m.sha256||!original.equals(embedded))throw Error('Audio differs: '+m.id);if(original.subarray(0,4).toString()!=='RIFF'||original.subarray(8,12).toString()!=='WAVE')throw Error('Invalid WAV');if(m.license!=='CC0-1.0'||!m.author||!m.source)throw Error('Missing provenance');}
for(const m of svg){const original=fs.readFileSync(path.join(root,m.path));if(sha(original)!==m.sha256||original.toString()!==context.window.Piston.MECHANICAL_SVG[m.id])throw Error('SVG differs: '+m.id);if(/<script|<foreignObject|href="https?:|<image/i.test(original.toString()))throw Error('External or active SVG content');}
console.log('Verified 6 original CC0 WAV files + 8 embedded original SVG parts; all SHA-256 checks passed.');
