'use strict';
// Reuse verified originals offline. Download only missing/damaged files; publish a bank atomically.
const fs=require('node:fs'),path=require('node:path'),https=require('node:https'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),bank=require('../src/sample-bank.js');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function validate(b,id){if(b.length<44||b.length>8e6||b.subarray(0,4).toString()!=='RIFF'||b.subarray(8,12).toString()!=='WAVE')throw new Error(id+': invalid bounded WAV');}
function get(url,depth=0){return new Promise((resolve,reject)=>{if(depth>5)return reject(new Error('redirect limit'));if(!url.startsWith('https://'))return reject(new Error('HTTPS required'));https.get(url,{headers:{'User-Agent':'Last-Piston-Audio-Pack/0.13'}},r=>{if(r.statusCode>=300&&r.statusCode<400){r.resume();return get(new URL(r.headers.location,url).href,depth+1).then(resolve,reject);}if(r.statusCode!==200){r.resume();return reject(new Error('HTTP '+r.statusCode));}const parts=[];let n=0;r.on('data',b=>{n+=b.length;if(n>8e6)r.destroy(new Error('too large'));else parts.push(b);});r.on('end',()=>resolve(Buffer.concat(parts)));r.on('error',reject);}).on('error',reject).setTimeout(20000,function(){this.destroy(new Error('timeout'));});});}
async function main(){
 const manifestPath=path.join(root,'assets/audio-manifest.json');
 const previous=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')):[];
 const expected=new Map(previous.map(row=>[row.id,row]));
 const pending=[],data={},manifest=[],errors=[];
 for(const [id,s] of Object.entries(bank)){
  const filename=path.join(root,'assets/audio',id+'.wav'),old=expected.get(id);let b=null;
  try{
   if(fs.existsSync(filename)){const local=fs.readFileSync(filename);validate(local,id);if(old?.sha256&&sha(local)===old.sha256)b=local;}
   const cached=!!b;
   if(!b){b=await get(s.url);validate(b,id);if(old?.sha256&&sha(b)!==old.sha256)throw new Error(id+': source changed, review provenance before replacement');}
   data[id]=b.toString('base64');pending.push([filename,b]);
   manifest.push(old||{id,...s,bytes:b.length,sha256:sha(b),file:'assets/audio/'+id+'.wav',status:'downloaded',downloaded:true});
   console.log(id+': '+b.length+' bytes ('+(cached?'verified local file':'downloaded')+')');
  }catch(error){errors.push(id+': '+error.message);}
 }
 if(errors.length)throw new Error(errors.join('\n')+'\nExisting soundbank left unchanged.');
 const header='/* Verified CC0 source recordings. SHA-256 and attribution: audio-manifest.json. */\n';
 const payload=header+'window.Piston.EMBEDDED_AUDIO='+JSON.stringify(data)+';\n';
 fs.mkdirSync(path.join(root,'assets/audio'),{recursive:true});
 for(const [filename,b] of pending){const tmp=filename+'.tmp';fs.writeFileSync(tmp,b);fs.renameSync(tmp,filename);}
 const destination=path.join(root,'assets/soundbank.js');fs.writeFileSync(destination+'.tmp',payload);fs.renameSync(destination+'.tmp',destination);
 if(!previous.length)fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
 console.log('All six originals verified. Offline soundbank ready. Run npm run build.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
