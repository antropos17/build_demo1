/* Last Piston. Deterministic gameplay simulation; no browser dependencies. */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const approach = (a, b, rate, dt) => a + (b - a) * (1 - Math.exp(-rate * dt));
  const FIRE = [0, Math.PI * 3, Math.PI, Math.PI * 2]; // 1-3-4-2 over 720 degrees
  const severity = [.77, 1.30, 1.08, .93];
  class Engine {
    constructor(seed = 7193) {
      this.seed = seed >>> 0;
      this.time = 0; this.throttle = 0; this.rpm = 880; this.phase = 0;
      this.block = 96; this.coolant = 86; this.oilTemp = 91;
      this.oil = 4.6; this.coolantLevel = 1; this.pressure = 1.8;
      this.friction = .06; this.gasket = 0; this.mountWear = 0;
      this.survivalTime = 0; this.totalRevs = 0; this.stage = 0;
      this.lastFailure = -100; this.events = []; this.log = [];
      this.cylinders = severity.map((s, id) => ({ id, wear: 0, temp: 104,
        active: true, compression: 1, misfire: 0, offset: FIRE[id],
        freeze: 0, failure: null, susceptibility: s, last: false }));
    }
    random() { this.seed = (1664525 * this.seed + 1013904223) >>> 0; return this.seed / 4294967296; }
    get activeCount() { return this.cylinders.reduce((n, c) => n + Number(c.active), 0); }
    get damage() { return this.cylinders.reduce((sum, c) => sum + c.wear, 0) / 4; }
    get power() { return this.cylinders.reduce((sum, c) => sum + (c.active ? c.compression : 0), 0) / 4; }
    emit(type, cylinder, message) {
      const e = { type, cylinder, message, time: this.time };
      this.events.push(e); if (this.events.length > 32) this.events.shift();
      this.log.unshift(e); this.log.length = Math.min(5, this.log.length);
    }
    drainEvents() { const e = this.events; this.events = []; return e; }
    step(dt, gas = false) {
      // A fixed 120 Hz caller supplies small timesteps. Reject invalid external input.
      if (!Number.isFinite(dt) || dt <= 0) return;
      dt = Math.min(dt, .05); this.time += dt;
      this.throttle = approach(this.throttle, gas ? 1 : 0, gas ? 2.8 : 1.65, dt);
      const t = this.throttle, active = this.activeCount;
      const viscosity = clamp(Math.exp(-(this.oilTemp - 95) / 65), .12, 1.3);
      const oilSupply = clamp(this.oil / 1.8, .025, 1);
      const pump = .65 + Math.min(4.5, this.rpm / 1450);
      this.pressure = approach(this.pressure, pump * viscosity * oilSupply * (1 - this.gasket * .3), 3, dt);
      const starvation = clamp((1.05 - this.pressure) / 1.05, 0, 1);
      this.friction = .06 + starvation * .75 + this.damage * .34 + Math.max(0, this.block - 155) / 330;
      // Three coupled thermal masses, thermostat, radiator, and declining fluid inventory.
      const heat = 6.8 + 55 * t * t * (.50 + .50 * active / 4) + this.friction * t * 13;
      const waterTransfer = (this.block - this.coolant) * .45 * Math.max(.13, this.coolantLevel);
      const oilTransfer = (this.block - this.oilTemp) * .22 * Math.max(.1, this.oil / 4.6);
      this.block = clamp(this.block + (heat - waterTransfer - oilTransfer - (this.block - 24) * .027) * dt / 3.2, 45, 265);
      const thermostat = clamp((this.coolant - 82) / 12, 0, 1);
      const radiator = (this.coolant - 24) * .095 * (.12 + thermostat) * Math.max(.18, this.coolantLevel);
      this.coolant = clamp(this.coolant + (waterTransfer - radiator) * dt / 3.8, 35, 170);
      this.oilTemp = clamp(this.oilTemp + (oilTransfer - (this.oilTemp - 24) * .014) * dt / 4.8, 35, 245);
      const thermalStress = Math.max(0, this.block - 148) / 85;
      if (this.block > 155) this.gasket = clamp(this.gasket + (this.block - 155) * .00017 * dt, 0, 1);
      this.coolantLevel = clamp(this.coolantLevel - this.gasket * .0028 * dt, 0, 1);
      const leak = .00005 + this.gasket * (.012 + .018 * t) + this.damage * .009 * t;
      this.oil = clamp(this.oil - leak * dt, 0, 4.6);
      this.mountWear = clamp(this.mountWear + t * (this.damage * .006 + .0003) * dt, 0, 1);
      for (const c of this.cylinders) {
        c.temp = approach(c.temp, this.block + (c.active ? 10 + t * 24 : -18), .22, dt);
        if (!c.active) continue;
        const stress = thermalStress * .7 + starvation * .9 + Math.max(0, this.rpm - 5800) / 4500;
        c.wear = Math.min(.999, c.wear + stress * .026 * c.susceptibility * (.16 + .84 * t) * dt);
        c.last = this.activeCount === 1;
        if (c.last) c.wear = Math.min(c.wear, .955); // Explicit arcade survival rule, not physical protection.
        c.compression = Math.max(c.last ? .28 : .14, 1 - c.wear * .76);
        c.misfire = clamp((c.wear - .35) * .72 + starvation * .12, 0, c.last ? .48 : .74);
        if (c.wear >= .985 && this.activeCount > 1 && this.time - this.lastFailure > 4) {
          c.active = false; c.wear = 1; c.compression = 0;
          c.freeze = this.phase; c.failure = this.activeCount === 2 ? 'ejected' : 'rod';
          this.lastFailure = this.time;
          this.emit('cylinder', c.id, `Цилиндр ${c.id + 1}: ${c.failure === 'ejected' ? 'поршень выбит' : 'обрыв шатуна'}`);
          if (this.activeCount === 1) this.emit('last', this.cylinders.find(x => x.active).id, 'Один поршень. Всё ещё работает.');
        }
      }
      const count = this.activeCount;
      if (count === 1) this.survivalTime += dt;
      const nominal = 690 + t * (6100 * (.23 + .77 * this.power));
      const imbalance = (4 - count) / 3;
      const ripple = (Math.sin(this.phase) * .7 + Math.sin(this.phase * 2.1) * .3) * (45 + imbalance * 220) * (.25 + t);
      // An intentional low-RPM torque assist prevents a terminal stall.
      this.rpm = clamp(approach(this.rpm, Math.max(count === 1 ? 380 : 650, nominal + ripple), 1.8, dt), 320, 7250);
      this.totalRevs += this.rpm / 60 * dt;
      // Slow visual crank speed keeps the four strokes readable; sound uses actual RPM.
      this.phase = (this.phase + (3.6 + Math.sqrt(this.rpm / 7000) * 22) * dt) % (TAU * 2);
      const stage = count === 1 ? 5 : count < 4 ? 4 : this.damage > .55 ? 3 : this.gasket > .17 ? 2 : this.block > 135 ? 1 : 0;
      if (stage > this.stage) {
        this.stage = stage;
        if (stage < 4) this.emit(['idle','heat','gasket','metal'][stage], -1,
          ['', 'Температура блока растёт', 'Прорыв газов через прокладку', 'Вкладыши стучат. Крепления ослабли.'][stage]);
      }
    }
    snapshot() {
      const { events, log, ...data } = this;
      return { version: 1, ...data, log: this.log.slice(0, 5) };
    }
    static restore(data) {
      const e = new Engine();
      if (!data || data.version !== 1 || !Array.isArray(data.cylinders) || data.cylinders.length !== 4) return e;
      const ranges = { time:[0,1e9], throttle:[0,1], rpm:[320,7250], phase:[0,TAU*2], block:[45,265],
        coolant:[35,170], oilTemp:[35,245], oil:[0,4.6], coolantLevel:[0,1], pressure:[0,8], friction:[0,3],
        gasket:[0,1], mountWear:[0,1], survivalTime:[0,1e9], totalRevs:[0,1e12], stage:[0,5], lastFailure:[-100,1e9] };
      for (const [k, [lo,hi]] of Object.entries(ranges)) if (Number.isFinite(data[k])) e[k] = clamp(data[k],lo,hi);
      if (Number.isFinite(data.seed)) e.seed = data.seed >>> 0;
      data.cylinders.forEach((s,i) => {
        if (!s || typeof s !== 'object') return;
        const c = e.cylinders[i];
        c.active = s.active !== false;
        for (const [k,lo,hi] of [['wear',0,1],['temp',35,300],['compression',0,1],['misfire',0,.8],['freeze',0,TAU*2]]) {
          if (Number.isFinite(s[k])) c[k] = clamp(s[k],lo,hi);
        }
        c.failure = s.failure === 'ejected' ? 'ejected' : s.failure === 'rod' ? 'rod' : null;
      });
      if (!e.activeCount) { e.cylinders[0].active = true; e.cylinders[0].failure = null; }
      for (const c of e.cylinders) {
        c.last = c.active && e.activeCount === 1;
        if (c.last) { c.wear = Math.min(.955,c.wear); c.compression = Math.max(.28,c.compression); }
      }
      e.throttle = 0; // A held input must never survive navigation.
      return e;
    }
  }
  function pistonGeometry(phase, index, x = 0) {
    const r = 43, length = 142, a = phase - FIRE[index];
    const crankX = x + Math.sin(a) * r, crankY = 460 - Math.cos(a) * r;
    const pinY = crankY - Math.sqrt(length * length - (crankX - x) ** 2);
    const cycle = ((a % (TAU*2)) + TAU*2) % (TAU*2);
    return { x, crankX, crankY, pinY, top: pinY - 36, cycle };
  }
  const api = { Engine, pistonGeometry, clamp, approach, FIRE, TAU };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Piston = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
