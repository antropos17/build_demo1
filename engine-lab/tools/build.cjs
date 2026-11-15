'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="style.css">',()=>'<style>\n'+fs.readFileSync(path.join(root,'style.css'),'utf8')+'\n</style>');
html=html.replace(/<script defer src="([^"]+)"><\/script>/g,(_,file)=>'<script defer>\n'+fs.readFileSync(path.join(root,file),'utf8').replace(/<\/script/gi,'<\\/script')+'\n</script>');
// Inline classic scripts cannot defer. Move them after the DOM to preserve initialization order.
const scripts=[];html=html.replace(/<script defer>([\s\S]*?)<\/script>/g,(_,code)=>{scripts.push('<script>'+code+'</script>');return '';});
html=html.replace('</body>',scripts.join('\n')+'\n</body>');
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
fs.writeFileSync(path.join(root,'dist','last-piston.html'),html);
console.log('Built dist/last-piston.html ('+Buffer.byteLength(html)+' bytes)');
