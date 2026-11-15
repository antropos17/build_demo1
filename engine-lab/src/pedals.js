/* Two momentary analogue pedals. Pointer positions, not unreliable touch pressure.
 * Each pointer and key owns its input, so releasing one foot never releases the other.
 */
(function (root) {
  'use strict';
  class PedalInput {
    constructor(gas, brake, onEngage = () => {}) {
      this.elements = { gas, brake }; this.pointers = new Map(); this.keys = new Map();
      this.keyboard = { gas: 0, brake: 0 }; this.gas = 0; this.brake = 0;
      this.onEngage = onEngage; this.handlers = []; this.lastUI = '';
      const listen = (el, type, handler, options) => { el.addEventListener(type, handler, options); this.handlers.push(() => el.removeEventListener(type, handler, options)); };
      for (const channel of ['gas', 'brake']) {
        const el = this.elements[channel];
        listen(el, 'pointerdown', e => {
          if (e.pointerType === 'mouse' && e.button !== 0) return;
          e.preventDefault();
          const rect = el.getBoundingClientRect();
          this.pointers.set(e.pointerId, { channel, top: rect.top, height: rect.height, value: this.position(e.clientY, rect.top, rect.height) });
          try { el.setPointerCapture(e.pointerId); } catch (_) {}
          this.recompute(); this.onEngage();
        });
        listen(el, 'pointermove', e => {
          const p = this.pointers.get(e.pointerId); if (!p || p.channel !== channel) return;
          e.preventDefault(); p.value = this.position(e.clientY, p.top, p.height); this.recompute();
        });
        for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(el, name, e => this.removePointer(e.pointerId));
        listen(el, 'contextmenu', e => e.preventDefault());
      }
      listen(window, 'pointerup', e => this.removePointer(e.pointerId));
      listen(window, 'pointercancel', e => this.removePointer(e.pointerId));
      listen(window, 'blur', () => this.release());
      listen(window, 'keydown', e => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) return;
        const own = e.target === gas ? 'gas' : e.target === brake ? 'brake' : null;
        if (!own && e.target.closest?.('button,summary,[role=button]')) return;
        const channel = own && ['Space', 'Enter'].includes(e.code) ? own : ['Space', 'ArrowUp', 'KeyW'].includes(e.code) ? 'gas' : ['ArrowDown', 'KeyS', 'KeyB'].includes(e.code) ? 'brake' : null;
        if (!channel) return; e.preventDefault();
        if (!this.keys.has(e.code)) { this.keys.set(e.code, channel); this.onEngage(); }
        this.recompute();
      });
      listen(window, 'keyup', e => { if (this.keys.delete(e.code)) { this.clearReleasedKeys(); this.recompute(); } });
    }
    position(y, top, height) { return Math.max(0, Math.min(1, (top + height - 10 - y) / Math.max(1, height - 20))); }
    removePointer(id) { if (this.pointers.delete(id)) this.recompute(); }
    clearReleasedKeys() { for (const channel of ['gas', 'brake']) if (![...this.keys.values()].includes(channel)) this.keyboard[channel] = 0; }
    get held() { return this.pointers.size > 0 || this.keys.size > 0; }
    update(dt) {
      for (const channel of ['gas', 'brake']) {
        const down = [...this.keys.values()].includes(channel);
        this.keyboard[channel] = down ? Math.min(1, this.keyboard[channel] + dt * (channel === 'gas' ? 1.8 : 3.4)) : 0;
      }
      this.recompute();
    }
    recompute() {
      let gas = this.keyboard.gas, brake = this.keyboard.brake;
      for (const p of this.pointers.values()) { if (p.channel === 'gas') gas = Math.max(gas, p.value); else brake = Math.max(brake, p.value); }
      this.gas = gas; this.brake = brake;
      const signature = Math.round(gas * 100) + ':' + Math.round(brake * 100);
      if (signature === this.lastUI) return; this.lastUI = signature;
      for (const channel of ['gas', 'brake']) {
        const value = this[channel], el = this.elements[channel], percent = Math.round(value * 100);
        el.style.setProperty('--press', value.toFixed(3));
        el.classList.toggle('pressed', value > .005); el.setAttribute('aria-pressed', String(value > .005));
        el.setAttribute('aria-label', `${channel === 'gas' ? 'Газ' : 'Тормоз'} ${percent} процентов. Удерживайте; выше по педали сильнее.`);
        el.querySelector('output').textContent = percent + '%';
      }
    }
    release() {
      // Clear ownership BEFORE releasing capture; lostpointercapture can dispatch synchronously.
      const captured = [...this.pointers]; this.pointers.clear(); this.keys.clear(); this.keyboard.gas = this.keyboard.brake = 0;
      for (const [id, p] of captured) try { if (this.elements[p.channel].hasPointerCapture(id)) this.elements[p.channel].releasePointerCapture(id); } catch (_) {}
      this.recompute();
    }
    destroy() { this.release(); for (const remove of this.handlers) remove(); this.handlers = []; }
  }
  root.Piston.PedalInput = PedalInput;
})(window);
