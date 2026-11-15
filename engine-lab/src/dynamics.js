/* Endurance dynamics. Visual-cycle impulses are intentionally slower than audible RPM. */
(function (root) {
  'use strict';
  const base = typeof module !== 'undefined' && module.exports ? require('./simulation.js') : root.Piston;
  const { Engine: CoreEngine, TAU, clamp, approach } = base;
  const cycle = a => ((a % (TAU * 2)) + TAU * 2) % (TAU * 2);
  const componentLabels = {
    leftMount: 'Левая опора надорвана. Мотор держится на страховочной скобе.',
    rightMount: 'Правая опора разбита. Стенд принимает удары.',
    cover: 'Крышка разболталась. Крепёж больше не держит.',
    exhaust: 'Выпуск разошёлся по стыку. Труба висит на подвесе.'
  };
  class Engine extends CoreEngine {
    constructor(seed = 7193) {
      super(seed);
      this.shaftSpeed = 12; this.kick = 0; this.recoil = 0; this.exhaustPulse = 0;
      this.film = 0; this.leakRate = 0; this.unburnt = 0; this.lastPop = -100;
      this.components = { leftMount: 0, rightMount: 0, cover: 0, exhaust: 0 };
      this.pops = 0; this.peakRPM = this.rpm; this.peakTemp = this.block;
      this.cylinders.forEach(c => Object.assign(c, { lit: true, pulse: 0, missed: 0, fired: 0, streak: 0 }));
    }
    emit(type, cylinder, message) {
      const e = { type, cylinder, message, time: this.time };
      this.events.push(e); if (this.events.length > 32) this.events.shift();
      if (type !== 'backfire') { this.log.unshift(e); this.log.length = Math.min(12, this.log.length); }
    }
    pop() {
      if (this.time - this.lastPop < .8) return;
      this.lastPop = this.time; this.unburnt *= .18; this.pops++;
      this.exhaustPulse = 1; this.recoil = Math.max(this.recoil, .6);
      this.emit('backfire', -1, 'Хлопок в выпуске');
    }
    step(dt, gas = false) {
      if (!Number.isFinite(dt) || dt <= 0) return;
      dt = Math.min(dt, .05);
      const oldPhase = this.phase, oldOil = this.oil, oldThrottle = this.throttle;
      super.step(dt, gas);
      this.leakRate = Math.max(0, (oldOil - this.oil) / dt);
      // Leaked oil forms a finite surface film. No new oil appears after the sump is dry.
      this.film = clamp(this.film + this.leakRate * dt * .7 - this.film * Math.max(0, this.block - 100) * .00025 * dt, 0, .32);
      this.kick *= Math.exp(-dt * 4.8); this.recoil *= Math.exp(-dt * 11);
      this.exhaustPulse *= Math.exp(-dt * 8);
      const imbalance = (4 - this.activeCount) / 3;
      let compressionBrake = 0;
      for (const c of this.cylinders) {
        c.pulse *= Math.exp(-dt * 9);
        if (!c.active) { c.lit = false; c.pulse = 0; continue; }
        const a = cycle(oldPhase - c.offset);
        if (a > Math.PI * 3) compressionBrake += Math.sin(a - Math.PI * 3) * c.compression;
      }
      const nominal = 3.6 + Math.sqrt(this.rpm / 7000) * 22;
      const target = nominal * (1 - imbalance * .32) + this.kick - compressionBrake * (1 + imbalance * 4);
      this.shaftSpeed = clamp(approach(this.shaftSpeed, target, 9, dt), 2.6, 40);
      const step = this.shaftSpeed * dt;
      this.phase = cycle(oldPhase + step);
      for (const c of this.cylinders) {
        if (!c.active) continue;
        const a = cycle(oldPhase - c.offset);
        if (a + step >= TAU * 2) {
          // The last piston may miss, but never goes indefinitely without ignition.
          c.lit = this.random() >= c.misfire || (c.last && c.streak >= 3);
          if (c.lit) {
            c.fired++; c.streak = 0; c.pulse = c.compression;
            this.kick = Math.min(15, this.kick + (2.2 + this.throttle * 5.5) * (1 + imbalance * .8));
            this.recoil = Math.min(1.5, this.recoil + .2 + imbalance * .6);
          } else {
            c.missed++; c.streak++; this.unburnt = Math.min(1, this.unburnt + .12 * this.throttle);
          }
        }
        if (a < Math.PI && a + step >= Math.PI && c.lit) {
          this.exhaustPulse = Math.max(this.exhaustPulse, .25 + c.compression * .75);
        }
      }
      this.unburnt = Math.max(0, this.unburnt - dt * .01);
      if (!gas && oldThrottle > .08 && this.throttle < .45 && this.damage > .18 && this.unburnt > .065) this.pop();
      if (gas && this.unburnt > .48 && this.time - this.lastPop > 2) this.pop();
      const stress = this.throttle * this.damage * (.5 + this.mountWear);
      for (const [name, rate] of Object.entries({ leftMount: .021, rightMount: .012, cover: .025, exhaust: .019 })) {
        const before = this.components[name];
        this.components[name] = clamp(before + stress * rate * dt, 0, 1);
        if (before < 1 && this.components[name] >= 1) this.emit(name, -1, componentLabels[name]);
      }
      this.peakRPM = Math.max(this.peakRPM, this.rpm); this.peakTemp = Math.max(this.peakTemp, this.block);
    }
    snapshot() { return { ...super.snapshot(), version: 2, log: this.log.slice(0, 12) }; }
    static restore(data) {
      const e = new Engine();
      if (!data || ![1, 2].includes(data.version) || !Array.isArray(data.cylinders) || data.cylinders.length !== 4) return e;
      const core = CoreEngine.restore({ ...data, version: 1 });
      Object.assign(e, core);
      const ranges = { shaftSpeed: [2.6, 40], film: [0, .32], unburnt: [0, 1], lastPop: [-100, 1e9],
        pops: [0, 1e9], peakRPM: [320, 7250], peakTemp: [45, 265] };
      for (const [k, [lo, hi]] of Object.entries(ranges)) if (Number.isFinite(data[k])) e[k] = clamp(data[k], lo, hi);
      const components = data.components || {};
      e.components = { leftMount: 0, rightMount: 0, cover: 0, exhaust: 0 };
      for (const k of Object.keys(e.components)) if (Number.isFinite(components[k])) e.components[k] = clamp(components[k], 0, 1);
      e.cylinders.forEach((c, i) => {
        const s = data.cylinders[i] || {};
        Object.assign(c, { lit: c.active, pulse: 0, missed: 0, fired: 0, streak: 0 });
        for (const k of ['missed', 'fired']) if (Number.isFinite(s[k])) c[k] = Math.floor(clamp(s[k], 0, 1e12));
        if (!c.active) { c.wear = 1; c.compression = 0; c.misfire = 0; }
      });
      const allowed = new Set(['heat', 'gasket', 'metal', 'cylinder', 'last', ...Object.keys(componentLabels)]);
      e.log = Array.isArray(data.log) ? data.log.filter(x => x && allowed.has(x.type) && Number.isFinite(x.time) && x.time >= 0 && x.time <= e.time && typeof x.message === 'string')
        .slice(0, 12).map(x => ({ type: x.type, cylinder: Number.isInteger(x.cylinder) ? clamp(x.cylinder, -1, 3) : -1, time: x.time, message: x.message.slice(0, 180) })) : [];
      e.kick = 0; e.recoil = 0; e.exhaustPulse = 0; e.leakRate = 0; e.throttle = 0; e.events = [];
      return e;
    }
  }
  const api = { ...base, Engine };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign(root.Piston, api);
})(typeof globalThis !== 'undefined' ? globalThis : this);
