/* Inertial test stand with two independent analogue pedals.
 * Units: rad/s, kg m², Nm, kW, kJ/K. Parameters are gameplay assumptions.
 * Brake heat is absorbed SHAFT power, not combustion power or a fake speed value.
 */
(function (root) {
  'use strict';
  const base = typeof module !== 'undefined' && module.exports ? require('./powertrain.js') : root.Piston;
  const { Engine: ThermalEngine, clamp, approach, TAU, torqueCurve, RATING } = base;
  const pedal = value => value === true ? 1 : Number.isFinite(value) ? clamp(value, 0, 1) : 0;
  const DYNO = Object.freeze({ inertia: .52, maxBrakeNm: 300, brakeHeatCapacity: 18, coolKWPerK: .025, ambient: 24 });
  class Engine extends ThermalEngine {
    constructor(seed = 7193) {
      super(seed);
      this.gasCommand = 0; this.brakeCommand = 0; this.brake = 0;
      this.brakeTemp = 24; this.brakeWear = 0; this.brakeFade = 1;
      this.absorbedNm = 0; this.absorbedKW = 0; this.brakeEnergyKJ = 0;
      this.shaftDriveNm = 0; this.netTorqueNm = 0; this.engineLoad = 0;
      this.revCut = false; this.overrun = false; this.antiStall = false;
      this.throttlePlate = 0; this.dynoAngle = 0; this.brakeHot = false;
      this.idleIntegral = 0; this.sensor.brakeTemp = 24;
    }
    // The core calls this INSTEAD of interpolating toward a target RPM.
    integrateShaft(dt, throttle) {
      const omega = this.rpm * TAU / 60;
      this.brake = approach(this.brake, this.brakeCommand, this.brakeCommand > this.brake ? 11 : 17, dt);
      this.brakeFade = clamp(1 - Math.max(0, this.brakeTemp - 380) / 540, .28, 1);
      const friction = this.frictionNm ? Object.values(this.frictionNm).reduce((a, b) => a + b, 0) : 8;
      const pumping = (1 - throttle) * clamp(this.rpm / 1000 * 2.2, 0, 16);
      const windage = .0000002 * this.rpm * this.rpm;
      const accessories = 1.2 + this.relay.fan * 1.6;
      const losses = friction + pumping + windage + accessories;
      const healthyTorque = torqueCurve(this.rpm);
      const available = (healthyTorque + losses) * this.power * clamp(1 - this.damage * .18, .65, 1);
      const idleRPM = this.activeCount === 1 ? 610 : RATING.idle;
      const idleError = idleRPM - this.rpm;
      this.idleIntegral = clamp(this.idleIntegral + idleError * dt * .025, -3, 18);
      const idleTorque = throttle < .45 ? clamp(losses + idleError * .06 + this.idleIntegral, 0, losses + 26) * clamp((1400 - this.rpm) / 650, 0, 1) * (1 - throttle / .45) : 0;
      if (this.rpm >= RATING.limiter) this.revCut = true;
      else if (this.rpm < RATING.limiter - 180) this.revCut = false;
      this.overrun = throttle < .015 && this.rpm > 1500;
      const cut = this.revCut || this.overrun;
      const combustion = cut ? 0 : available * throttle + idleTorque;
      // A speed-sensitive safety coupling unloads the test brake near idle.
      // This is explicit last-piston gameplay assistance, not OEM behaviour.
      const coupling = clamp((this.rpm - 430) / 620, 0, 1);
      this.absorbedNm = DYNO.maxBrakeNm * this.brake ** 1.35 * this.brakeFade * coupling;
      const safety = this.rpm < 500 ? Math.max(0, losses + this.absorbedNm - combustion) + (500 - this.rpm) * .25 : 0;
      this.antiStall = safety > .1 || (this.brake > .05 && coupling < .75);
      this.shaftDriveNm = combustion - losses + safety;
      const ripple = Math.sin(this.phase) * (4 - this.activeCount) * (2 + throttle * 4);
      this.netTorqueNm = this.shaftDriveNm - this.absorbedNm + ripple;
      this.rpm = clamp((omega + this.netTorqueNm / DYNO.inertia * dt) * 60 / TAU, 380, 6600);
      this.engineLoad = clamp(combustion / Math.max(25, healthyTorque + losses), 0, 1);
      this.absorbedKW = this.absorbedNm * this.rpm * TAU / 60000;
      this.brakeEnergyKJ += this.absorbedKW * dt;
      const accel = this.profile === 'stress' ? 8 : 1;
      const cooling = (this.brakeTemp - DYNO.ambient) * (DYNO.coolKWPerK + .03 * clamp(this.rpm / 6500, 0, 1));
      this.brakeTemp = clamp(this.brakeTemp + (this.absorbedKW - cooling) * dt * accel / DYNO.brakeHeatCapacity, DYNO.ambient, 900);
      this.brakeWear = clamp(this.brakeWear + this.absorbedKW * dt * Math.max(0, this.brakeTemp - 280) * .000000015 * accel, 0, 1);
      const hot = this.brakeTemp > 400;
      if (hot && !this.brakeHot) this.emit('brakeHeat', -1, 'Тормоз стенда перегрет. Эффективность падает.');
      this.brakeHot = hot || (this.brakeHot && this.brakeTemp > 340);
    }
    step(dt, gas = false, brake = 0) {
      if (!Number.isFinite(dt) || dt <= 0) return;
      dt = Math.min(dt, .05);
      this.gasCommand = pedal(gas); this.brakeCommand = pedal(brake);
      super.step(dt, this.gasCommand);
      // Keep instruments and the thermal model tied to the same shaft solution.
      this.torqueNm = this.shaftDriveNm;
      this.brakeKW = this.torqueNm * this.rpm * TAU / 60000;
      this.fuelLh = this.revCut || this.overrun ? 0 : .68 + Math.max(0, this.brakeKW + this.frictionKW) * .29 / .745;
      this.throttlePlate = approach(this.throttlePlate, this.throttle, 14, dt);
      this.sensor.brakeTemp = approach(this.sensor.brakeTemp ?? this.brakeTemp, this.brakeTemp, 3, dt);
      this.dynoAngle = (this.dynoAngle + this.shaftSpeed * dt) % TAU;
      // A cut firing cannot flash as a successful combustion event.
      if (this.revCut || this.overrun) for (const cy of this.cylinders) { cy.lit = false; cy.pulse = 0; }
    }
    snapshot() {
      return { ...super.snapshot(), version: 5, brakeTemp: this.brakeTemp, brakeWear: this.brakeWear, brakeEnergyKJ: this.brakeEnergyKJ };
    }
    static restore(data) {
      const e = new Engine();
      if (!data || ![1, 2, 3, 4, 5].includes(data.version)) return e;
      Object.assign(e, ThermalEngine.restore({ ...data, version: Math.min(4, data.version) }));
      for (const [k, lo, hi] of [['brakeTemp', 24, 900], ['brakeWear', 0, 1], ['brakeEnergyKJ', 0, 1e12]])
        if (Number.isFinite(data[k])) e[k] = clamp(data[k], lo, hi);
      e.gasCommand = e.brakeCommand = e.brake = e.throttle = e.throttlePlate = 0;
      e.absorbedNm = e.absorbedKW = e.shaftDriveNm = e.netTorqueNm = e.idleIntegral = 0;
      e.revCut = e.overrun = e.antiStall = false; e.brakeHot = e.brakeTemp > 400;
      e.sensor.brakeTemp = e.brakeTemp;
      if (Array.isArray(data.log)) for (const event of data.log) {
        if (event && event.type === 'brakeHeat' && Number.isFinite(event.time) && event.time >= 0 && event.time <= e.time)
          e.log.push({ type: 'brakeHeat', cylinder: -1, time: event.time, message: 'Тормоз стенда перегрет. Эффективность падает.' });
      }
      e.log.sort((a, b) => b.time - a.time); e.log.length = Math.min(12, e.log.length);
      return e;
    }
  }
  const api = { ...base, Engine, DYNO, pedal };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else Object.assign(root.Piston, api);
})(typeof globalThis !== 'undefined' ? globalThis : this);
