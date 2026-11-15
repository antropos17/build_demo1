/* Source files have explicit redistribution licenses; no arbitrary search-result audio.
 * Embedded copies override network URLs when tools/fetch-audio.cjs has been run.
 */
(function(root){
const bank={
 idle:{url:'https://opengameart.org/sites/default/files/loop_0.wav',title:'racing car engine sound loops / loop_0',author:'domasx2',license:'CC0-1.0',source:'https://opengameart.org/content/racing-car-engine-sound-loops',loop:true,rpm:1100},
 load:{url:'https://raw.githubusercontent.com/esensar/bugged-racing/de0f97c7e0148968bbe65eda513c1dfc7060292e/assets/engine.wav',title:'ENGINE.WAV',author:'MarlonHJ',license:'CC0-1.0',source:'https://freesound.org/people/MarlonHJ/sounds/242740/',mirror:'Bugged Racing / esensar; original author retained',loop:true,rpm:3200},
 starter:{url:'https://opengameart.org/sites/default/files/generic_car_startengine.wav',title:'Car engine start 01',author:'looneybits',license:'CC0-1.0',source:'https://opengameart.org/content/car-engine-start-01'},
 impact:{url:'https://opengameart.org/sites/default/files/clank1.wav',title:'Mechanical Sounds / clank1',author:'Brian MacIntosh (BMacZero)',license:'CC0-1.0',source:'https://opengameart.org/content/mechanical-sounds'},
 rattle:{url:'https://opengameart.org/sites/default/files/rattle1.wav',title:'Mechanical Sounds / rattle1',author:'Brian MacIntosh (BMacZero)',license:'CC0-1.0',source:'https://opengameart.org/content/mechanical-sounds',loop:true},
 click:{url:'https://opengameart.org/sites/default/files/clink1_0.wav',title:'Metal Impact Sounds / clink1',author:'Brian MacIntosh (BMacZero)',license:'CC0-1.0',source:'https://opengameart.org/content/metal-impact-sounds'}
};
if(typeof module!=='undefined'&&module.exports)module.exports=bank;else root.Piston.SAMPLES=bank;
})(typeof window!=='undefined'?window:globalThis);
