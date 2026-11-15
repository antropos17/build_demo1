/* Pure PCM preparation; changes recordings, never synthesizes replacement engine audio. */
(function(root){
'use strict';
function preparePCM(channels,sampleRate,loop=false){
 if(!Array.isArray(channels)||!channels.length||!channels[0]?.length||!Number.isFinite(sampleRate)||sampleRate<8000)throw new TypeError('Invalid PCM');
 const n=channels[0].length;if(channels.some(c=>c.length!==n))throw new RangeError('Unequal channel lengths');
 const mono=new Float32Array(n);let mean=0;
 for(let i=0;i<n;i++){let v=0;for(const c of channels){if(!Number.isFinite(c[i]))throw new TypeError('Non-finite PCM');v+=c[i]/channels.length;}mono[i]=v;mean+=v;}
 mean/=n;for(let i=0;i<n;i++)mono[i]-=mean;
 const overlap=loop?Math.min(Math.floor(n*.10),Math.round(sampleRate*.035)):0;
 if(loop&&overlap>0)for(let i=0;i<overlap;i++){const t=(i+1)/overlap*Math.PI/2;mono[n-overlap+i]=mono[n-overlap+i]*Math.cos(t)+mono[i]*Math.sin(t);}
 const result=loop&&overlap?mono.slice(overlap):mono;
 if(!loop){const attack=Math.min(Math.floor(n*.03),Math.round(sampleRate*.002)),release=Math.min(Math.floor(n*.1),Math.round(sampleRate*.015));for(let i=0;i<attack;i++)result[i]*=i/attack;for(let i=0;i<release;i++)result[n-1-i]*=i/release;}
 let sum=0,peak=0;for(const v of result){sum+=v*v;peak=Math.max(peak,Math.abs(v));}
 const rms=Math.sqrt(sum/result.length),gain=Math.min(4,.135/Math.max(1e-8,rms),.82/Math.max(1e-8,peak));
 for(let i=0;i<result.length;i++)result[i]*=gain;
 return {samples:result,overlap,gain,rms:rms*gain,peak:peak*gain};
}
const api={preparePCM};if(typeof module!=='undefined'&&module.exports)module.exports=api;else Object.assign(root.Piston,api);
})(typeof window!=='undefined'?window:globalThis);
