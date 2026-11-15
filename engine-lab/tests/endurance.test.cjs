'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { Engine } = require('../src/dynamics.js');
const { Engine: Legacy } = require('../src/simulation.js');
const run = (e, seconds, gas) => { for (let i = 0; i < Math.round(seconds * 120); i++) e.step(1 / 120, gas); return e; };
test('Endurance engine reaches one cylinder without a terminal state', () => {
  const e = run(new Engine(), 240, true); assert.equal(e.activeCount, 1); assert.ok(e.shaftSpeed >= 2.6); assert.ok(e.rpm >= 320);
});
test('Last cylinder survives an hour with successful and missed ignition cycles', () => {
  const e = run(new Engine(), 3600, true), c = e.cylinders.find(c => c.active);
  assert.equal(e.activeCount, 1); assert.ok(c.fired > 500); assert.ok(c.missed > 50); assert.ok(c.streak <= 3);
  assert.equal(e.oil, 0); assert.ok(e.film < .001); assert.equal(e.coolantLevel, 0);
  for (const k of ['shaftSpeed', 'rpm', 'phase', 'kick', 'recoil', 'unburnt', 'peakRPM', 'peakTemp']) assert.ok(Number.isFinite(e[k]), k);
  assert.ok(e.log.length <= 12); assert.ok(e.events.length <= 32);
});
test('Components fail independently and emit their failure once', () => {
  const e = new Engine(), counts = {};
  for (let n = 0; n < 600 * 120; n++) { e.step(1 / 120, true); for (const x of e.drainEvents()) counts[x.type] = (counts[x.type] || 0) + 1; }
  for (const k of Object.keys(e.components)) { assert.equal(e.components[k], 1, k); assert.equal(counts[k], 1, k); }
  assert.equal(counts.cylinder, 3);
});
test('Releasing throttle after fuel accumulation produces a bounded backfire', () => {
  const e = run(new Engine(), 65, true); e.unburnt = .5; e.lastPop = -100;
  const before = e.pops; run(e, 3, false); assert.ok(e.pops > before); assert.ok(e.pops - before <= 2); assert.ok(e.activeCount >= 1);
});
test('Cooling never repairs components, restores fluids or resurrects a cylinder', () => {
  const e = run(new Engine(), 150, true), before = { temp: e.block, count: e.activeCount, components: { ...e.components }, oil: e.oil };
  run(e, 180, false); assert.ok(e.block < before.temp); assert.equal(e.activeCount, before.count); assert.ok(e.oil <= before.oil);
  for (const k of Object.keys(e.components)) assert.ok(e.components[k] >= before.components[k]);
});
test('Version 1 saves migrate without losing old mechanical damage', () => {
  const old = run(new Legacy(), 65, true), e = Engine.restore(old.snapshot());
  assert.equal(e.activeCount, old.activeCount); assert.equal(e.oil, old.oil); assert.equal(e.throttle, 0);
  run(e, 60, true); assert.equal(e.activeCount, 1); assert.equal(e.snapshot().version, 2);
});
test('Version 2 saves preserve the damage journal and component state', () => {
  const e = run(new Engine(), 145, true), snapshot = JSON.parse(JSON.stringify(e.snapshot())), restored = Engine.restore(snapshot);
  assert.deepEqual(restored.log, snapshot.log); assert.deepEqual(restored.components, snapshot.components);
  assert.equal(restored.cylinders[0].missed, snapshot.cylinders[0].missed); assert.equal(restored.film, snapshot.film);
  assert.equal(restored.throttle, 0); assert.equal(restored.events.length, 0); assert.equal(restored.recoil, 0);
});
test('Malicious or malformed additional fields cannot propagate NaN or kill the survivor', () => {
  const data = run(new Engine(), 80, true).snapshot(); data.components = { cover: Infinity, exhaust: -88 }; data.shaftSpeed = NaN;
  data.log = [null, { type: 'bad', message: '<script>', time: 0 }, { type: 'last', message: 'test', time: -1 }];
  data.cylinders.forEach(c => { c.active = false; c.fired = Infinity; c.compression = NaN; });
  const e = Engine.restore(data); run(e, 30, true);
  assert.equal(e.activeCount, 1); assert.ok(Number.isFinite(e.shaftSpeed)); assert.ok(e.components.exhaust >= 0); assert.equal(e.log.length, 0);
});
test('New mechanics remain deterministic and reject invalid timesteps', () => {
  const a = run(new Engine(15), 90, true), b = run(new Engine(15), 90, true); assert.deepEqual(a.snapshot(), b.snapshot());
  const before = a.snapshot(); a.step(NaN, true); a.step(-.3, true); assert.deepEqual(a.snapshot(), before);
});
test('Ignition pulse state is zero for every detached piston', () => {
  const e = run(new Engine(), 120, true); for (const c of e.cylinders) if (!c.active) { assert.equal(c.pulse, 0); assert.equal(c.lit, false); }
});
