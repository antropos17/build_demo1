'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
function voice() {
  const source = fs.readFileSync(path.join(__dirname, '../src/audio.js'), 'utf8').replace('root.Piston.MotorAudio=MotorAudio;', 'root.Piston.MotorAudio=MotorAudio;root.__worklet=WORKLET;');
  const window = { Piston: {} }; vm.runInNewContext(source, { window }); let Voice;
  class Processor { constructor() { this.port = {}; } }
  vm.runInNewContext(window.__worklet, { AudioWorkletProcessor: Processor, sampleRate: 48000, registerProcessor: (_, ctor) => { Voice = ctor; }, Float32Array, Math });
  return new Voice();
}
function measure(v, seconds = 1) {
  let sum = 0, max = 0, samples = 0;
  for (let i = 0; i < Math.ceil(seconds * 48000 / 128); i++) {
    const out = new Float32Array(128); assert.equal(v.process([], [[out]]), true);
    for (const x of out) { assert.ok(Number.isFinite(x)); sum += x * x; max = Math.max(max, Math.abs(x)); samples++; }
  }
  return { rms: Math.sqrt(sum / samples), max };
}
test('AudioWorklet DSP generates finite bounded engine audio without a browser', () => {
  const v = voice(), result = measure(v); assert.ok(result.rms > .001); assert.ok(result.max < 1);
});
test('One-cylinder DSP remains audible with frequent misfires and impacts', () => {
  const v = voice(); v.port.onmessage({ data: { rpm: 1800, load: 1, damage: .95, friction: 1.3, cyl: [.28, 0, 0, 0], miss: [.48, 0, 0, 0] } });
  v.port.onmessage({ data: { type: 'hit', level: 1.5 } }); const result = measure(v, 3);
  assert.ok(result.rms > .001); assert.ok(result.max < 1);
});
