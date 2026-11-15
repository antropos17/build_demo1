/* Workshop renderer: attached failures, finite-fluid plumes, and readable slow-cycle motion. */
(function (root) {
  'use strict';
  const { Renderer: CoreRenderer, clamp, pistonGeometry, TAU } = root.Piston;
  const X = [373, 517, 661, 805];
  class Renderer extends CoreRenderer {
    constructor(canvas) {
      super(canvas);
      this.blast = 0; this.rings = []; this.trace = []; this.traceClock = 0;
      this.spring = { x: 0, y: 0, vx: 0, vy: 0 }; this.currentModel = null;
    }
    resize() {
      super.resize();
      // Preserve mechanical proportions on narrow screens instead of stretching the pistons.
      this.scale = Math.min(this.canvas.width / 1200, this.canvas.height / 680);
      this.sy = this.scale; this.offsetX = (this.canvas.width - 1200 * this.scale) / 2; this.offsetY = (this.canvas.height - 680 * this.scale) / 2;
    }
    metal(x, w, dark = false) {
      const g = this.c.createLinearGradient(x, 0, x + w, 0);
      (dark ? [[0, '#3f4743'], [.15, '#707773'], [.36, '#39433e'], [.75, '#252f2b'], [1, '#69736a']]
        : [[0, '#66756f'], [.09, '#c3c8bd'], [.22, '#8a9790'], [.49, '#59665f'], [.76, '#9ca89c'], [.94, '#d6dacb'], [1, '#7b897e']])
        .forEach(([p, color]) => g.addColorStop(p, color));
      return g;
    }
    event(e, m) {
      if (e.type === 'backfire') {
        this.blast = 1; this.impulse = Math.max(this.impulse, 7);
        const p = this.world(1033, 230);
        this.rings.push({ x: p.x, y: p.y, r: 5, age: 0 });
        if (this.rings.length > 6) this.rings.shift();
        for (let i = 0; i < 12; i++) this.puff(1033, 230, 'exhaust', 1.4);
        return;
      }
      super.event(e, m);
      if (e.type === 'cover') {
        for (let i = 0; i < 4; i++) this.fragment(330 + i * 170, 137, 'bolt', 1.2);
      }
      if (e.type === 'leftMount' || e.type === 'rightMount') {
        const x = e.type === 'leftMount' ? 337 : 844;
        for (let i = 0; i < 7; i++) this.fragment(x, 567, 'chip', .7);
        this.impulse = 15;
      }
    }
    puff(x, y, kind, power) {
      const m = this.currentModel;
      if (m) {
        if (kind === 'steam' && m.coolantLevel < .002) return;
        if (kind === 'oil' && m.film < .0005) return;
        if (kind === 'exhaust') power *= .65 + (m.exhaustPulse || 0) * .9;
      }
      super.puff(x, y, kind, power);
      const p = this.smoke[this.smoke.length - 1];
      if (p && kind === 'exhaust') { p.vy -= (m?.exhaustPulse || 0) * 55; p.grow *= 1.15; }
    }
    update(dt, m) {
      this.currentModel = m;
      for (const p of this.debris) if (p.rest && p.kind !== 'spark') p.age = Math.min(p.age, 80);
      super.update(dt, m);
      this.blast *= Math.exp(-dt * 12);
      for (const p of this.rings) { p.age += dt; p.y -= dt * 70; p.x += dt * 24; p.r += dt * 33; }
      this.rings = this.rings.filter(p => p.age < .8);
      this.traceClock += dt;
      if (this.traceClock >= .05) {
        this.traceClock %= .05; this.trace.push({ speed: m.shaftSpeed, active: m.activeCount });
        if (this.trace.length > 140) this.trace.shift();
      }
      // Damped body motion reacts to load and combustion. Do not shake the HUD or floor.
      const s = this.spring, broken = (4 - m.activeCount) / 3;
      const compliance = 1 + m.components.leftMount + m.components.rightMount;
      const force = (m.recoil * Math.sin(m.phase) * 260 + Math.sin(m.phase * 2) * m.throttle * 70) * (1 + broken);
      const n = Math.max(1, Math.ceil(dt / .012)), h = dt / n;
      for (let i = 0; i < n; i++) {
        s.vx += (force - s.x * 80 / compliance - s.vx * 10) * h;
        s.vy += (m.recoil * 100 - s.y * 105 / compliance - s.vy * 13) * h;
        s.x = clamp(s.x + s.vx * h, -12, 12); s.y = clamp(s.y + s.vy * h, -7, 7);
      }
    }
    engine(m) {
      const c = this.c, s = this.spring, factor = this.reduced ? .05 : 1;
      c.save(); c.translate(s.x * factor, s.y * factor);
      super.engine(m);
      // Details follow the same moving engine coordinate system as every oil source.
      c.save(); c.translate(590 + this.pose.x, 540 + this.pose.y); c.rotate(this.pose.a); c.translate(-590, -540);
      this.attachments(m); this.diagnostics(m); c.restore(); c.restore();
      const a = factor * s.x, b = factor * s.y;
      this.pose.x += a; this.pose.y += b;
    }
    attachments(m) {
      const c = this.c, p = m.components, t = this.t;
      // A tethered, rattling cover stays attached instead of respawning as a duplicate part.
      if (p.cover > .14) {
        this.rr(277, 125, 644, 24, 3, '#202c21', '#586955', 1);
        c.save(); c.translate(289, 133);
        c.rotate((Math.sin(m.phase * 2) * .012 + m.recoil * .013) * p.cover);
        this.rr(-12, -9, 644, 21, 4, this.metal(-12, 644), '#b2bdab', 2);
        for (let i = 0; i < 12; i++) if (p.cover < 1 || i < 2) this.bolt(6 + i * 55, 2, 4.5, t * p.cover);
        c.restore();
      }
      if (p.exhaust > .15) {
        // A flexible sleeve and safety hanger reinforce the vibrating outer pipe.
        const swing = Math.sin(m.phase * .7) * .035 * p.exhaust;
        c.save(); c.translate(978, 279); c.rotate(swing);
        this.line([[0, 0], [54, 0], [54, -47]], '#8e9982', 21);
        this.line([[0, -5], [48, -5], [48, -45]], '#c0c4a8', 1.5);
        for (let i = 0; i < 5; i++) this.line([[3 + i * 4, -10], [3 + i * 4, 10]], '#35412d', 2);
        this.ellipse(54, -47, 12, 5, '#9caa8d'); this.ellipse(54, -47, 8, 3, '#101b10');
        c.restore(); this.line([[1013, 280], [1041, 320], [1064, 307]], '#73846b', 2);
      }
      // Split rubber mounts still have a metal safety strap. The survivor has a reason to stay on the stand.
      for (const [x, health] of [[337, p.leftMount], [844, p.rightMount]]) {
        if (health < .3) continue;
        this.line([[x - 15, 555], [x - 21, 579], [x + 20, 579], [x + 14, 555]], '#8d977c', 3);
        this.line([[x - 9, 561], [x + 1, 567], [x - 4, 573], [x + 8, 576]], '#070f08', 3 + health * 2);
      }
      // Ragged skirt edges and wobbling remnants, attached only to failed cylinders.
      for (let j = 0; j < 4; j++) {
        const cy = m.cylinders[j], x = X[j];
        if (cy.active) continue;
        const g = pistonGeometry(m.phase, j, x), wobble = Math.sin(m.phase * 1.9 + j) * 13;
        this.line([[g.crankX, g.crankY], [g.crankX + wobble, g.crankY - 32]], '#8b9a80', 7);
        this.poly([[g.crankX + wobble - 5, g.crankY - 32], [g.crankX + wobble, g.crankY - 38], [g.crankX + wobble + 4, g.crankY - 29]], '#bcc3a9');
      }
      // Backfire is a short pressure jet, not a glowing block or a persistent flame.
      if (this.blast > .09) {
        const h = this.blast * 70;
        this.poly([[1026, 229], [1027, 217 - h * .4], [1033, 217 - h], [1041, 216 - h * .33], [1040, 229]], `rgba(215,162,86,${this.blast * .65})`);
      }
    }
    piston(m, j) {
      const cy = m.cylinders[j];
      // A missed firing cycle must not flash as a successful combustion stroke.
      if (cy.active && !cy.lit) {
        const compression = cy.compression; cy.compression = 0;
        try { super.piston(m, j); } finally { cy.compression = compression; }
      } else super.piston(m, j);
    }
    diagnostics(m) {
      for (let j = 0; j < 4; j++) {
        const x = X[j], cy = m.cylinders[j];
        const light = cy.active && cy.pulse > .03;
        this.rr(x - 7, 98, 14, 3, 1, !cy.active ? '#414e3b' : light ? '#d9bb80' : '#768d69');
        this.text(String(j + 1).padStart(2, '0'), x, 89, 10, cy.active ? '#b1c29f' : '#64715a', 'center');
      }
    }
    oilFilm(m) {
      if (m.film < .0002 && m.oil < .01) return;
      super.oilFilm(m);
    }
    background(m) {
      super.background(m);
      // A neutral cast-steel test plate and sparse scale markings, not a decorative grid.
      this.line([[99, 111], [99, 527]], '#475140', 1);
      for (let i = 0; i < 14; i++) this.line([[99, 113 + i * 31], [i % 3 ? 105 : 112, 113 + i * 31]], '#59644d', 1);
    }
    render(m) {
      this.currentModel = m;
      const c = this.c;
      c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#1b1f1c'; c.fillRect(0, 0, this.canvas.width, this.canvas.height);
      c.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY); c.globalAlpha = 1;
      this.background(m); this.drawSmoke(false); this.engine(m); this.particles(); this.drawSmoke(true);
      for (const p of this.rings) this.ellipse(p.x, p.y, p.r, p.r * .3, null, `rgba(169,174,159,${(1 - p.age / .8) * .38})`, 3);
    }
    reset() {
      this.smoke = []; this.drops = []; this.debris = []; this.stains = []; this.trace = []; this.rings = [];
      this.smokeAcc = this.oilAcc = this.sparkAcc = this.impulse = this.blast = this.traceClock = 0;
      this.spring = { x: 0, y: 0, vx: 0, vy: 0 }; this.pose = { x: 0, y: 0, a: 0 }; this.t = 0; this.currentModel = null;
    }
    restoreDebris(m) {
      // Restore a bounded, stable floor scene without replaying explosions or sounds.
      for (const cy of m.cylinders) if (!cy.active) {
        this.fragment(X[cy.id], 604, cy.failure === 'ejected' ? 'piston' : 'rod', 0);
        const p = this.debris[this.debris.length - 1];
        p.x += (cy.id % 2 ? 1 : -1) * 95; p.y = 602; p.rest = true; p.rot = .18 + cy.id * .35;
      }
    }
  }
  root.Piston.Renderer = Renderer;
})(window);
