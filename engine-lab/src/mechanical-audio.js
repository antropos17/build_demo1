/* Filtered friction bed and short resonant impacts, mixed through the existing limiter. */
(function (root) {
  'use strict';
  const { MotorAudio: CoreAudio, TAU, clamp } = root.Piston;
  class MotorAudio extends CoreAudio {
    constructor() { super(); this.fx = null; this.lastClack = -10; }
    async start() {
      const ok = await super.start();
      if (ok && !this.fx) this.createFX();
      return ok;
    }
    createFX() {
      const a = this.ctx, b = a.createBuffer(1, Math.round(a.sampleRate * 1.7), a.sampleRate), data = b.getChannelData(0);
      let low = 0;
      for (let i = 0; i < data.length; i++) { const noise = Math.random() * 2 - 1; low += .09 * (noise - low); data[i] = noise * .45 + low * .55; }
      const source = a.createBufferSource(), filter = a.createBiquadFilter(), gain = a.createGain();
      source.buffer = b; source.loop = true; filter.type = 'bandpass'; filter.frequency.value = 880; filter.Q.value = 1.3; gain.gain.value = 0;
      source.connect(filter).connect(gain).connect(this.master); source.start();
      this.fx = { source, filter, gain };
      this.impact = a.createBuffer(1, Math.round(a.sampleRate * .25), a.sampleRate);
      const samples = this.impact.getChannelData(0);
      for (let i = 0; i < samples.length; i++) {
        const t = i / a.sampleRate;
        samples[i] = (Math.random() * 2 - 1) * Math.exp(-t * 85) * .32;
        for (const [hz, decay, amp] of [[317, 28, .23], [883, 42, .15], [1397, 65, .08]]) samples[i] += Math.sin(TAU * hz * t) * Math.exp(-t * decay) * amp;
      }
      this.popBuffer = a.createBuffer(1, Math.round(a.sampleRate * .32), a.sampleRate);
      const pop = this.popBuffer.getChannelData(0);
      for (let i = 0; i < pop.length; i++) {
        const t = i / a.sampleRate;
        pop[i] = Math.sin(TAU * (75 * t - 50 * t * t)) * Math.exp(-t * 23) * .8 + (Math.random() * 2 - 1) * Math.exp(-t * 65) * .2;
      }
    }
    update(m) {
      super.update(m);
      if (!this.ready || !this.fx || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;
      const scrape = clamp((m.friction - .18) * .07, 0, .10) * (.3 + m.throttle);
      this.fx.gain.gain.setTargetAtTime(scrape, now, .06);
      this.fx.filter.frequency.setTargetAtTime(650 + m.rpm * .13 + m.damage * 350, now, .08);
      if (m.damage > .45 && now - this.lastClack > .21 + (1 - m.throttle) * .3) {
        this.lastClack = now;
        this.play(this.impact, now, .06 + m.damage * .12, .8 + m.throttle * .3);
      }
    }
    event(e) {
      if (!this.ready) return;
      if (e.type === 'backfire') { this.play(this.popBuffer, this.ctx.currentTime, .85); return; }
      if (['cylinder', 'leftMount', 'rightMount', 'cover', 'exhaust', 'metal'].includes(e.type)) {
        this.hit(e.type === 'cylinder' ? 1.3 : .55);
        this.play(this.impact, this.ctx.currentTime, e.type === 'cylinder' ? .7 : .35, e.type === 'cover' ? 1.3 : .82);
      } else if (e.type === 'gasket' || e.type === 'last') this.hit(.4);
    }
    destroy() {
      if (this.fx) { try { this.fx.source.stop(); } catch (_) {} this.fx.source.disconnect(); this.fx.filter.disconnect(); this.fx.gain.disconnect(); this.fx = null; }
      super.destroy();
    }
  }
  root.Piston.MotorAudio = MotorAudio;
})(window);
