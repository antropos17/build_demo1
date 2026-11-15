/* SVG dial markings are created once. Updating only needles/text avoids another raster pass. */
(function (root) {
  'use strict';
  const { clamp } = root.Piston, NS = 'http://www.w3.org/2000/svg';
  const node = (name, attrs = {}) => { const el = document.createElementNS(NS, name); for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v); return el; };
  const point = (a, r) => [150 + Math.sin(a * Math.PI / 180) * r, 126 - Math.cos(a * Math.PI / 180) * r];
  function arc(start, end, r) { const a = point(start, r), b = point(end, r); return `M ${a[0]} ${a[1]} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${b[0]} ${b[1]}`; }
  class Dashboard {
    constructor() {
      this.nodes = new Map(); this.last = new Map(); this.lastNeedle = -1;
      const svg = document.getElementById('tach-face');
      svg.append(node('path', { d: arc(-135, 135, 105), stroke: '#334149', 'stroke-width': 2, fill: 'none' }));
      svg.append(node('path', { d: arc(-135 + 270 * 6 / 7, 135, 105), stroke: '#cc9c68', 'stroke-width': 4, fill: 'none' }));
      for (let i = 0; i <= 70; i++) {
        const angle = -135 + i / 70 * 270, a = point(angle, i % 10 === 0 ? 86 : i % 5 === 0 ? 91 : 96), b = point(angle, 101);
        svg.append(node('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: i >= 60 ? '#cc9c68' : i % 10 ? '#62717a' : '#d9e0df', 'stroke-width': i % 10 ? 1 : 2 }));
        if (i % 10 === 0) { const p = point(angle, 72), text = node('text', { x: p[0], y: p[1] + 5, 'text-anchor': 'middle', fill: '#dce2df', 'font-size': 15 }); text.textContent = String(i / 10); svg.append(text); }
      }
      this.needle = node('g', { id: 'tach-needle', transform: 'rotate(-135 150 126)' });
      this.needle.append(node('path', { d: 'M 148 141 L 148.8 38 L 151.2 38 L 153 141 Z', fill: '#e5c08b' })); svg.append(this.needle);
      svg.append(node('circle', { cx: 150, cy: 126, r: 9, fill: '#a7b5b9', stroke: '#17232a', 'stroke-width': 4 }));
    }
    el(id) { if (!this.nodes.has(id)) this.nodes.set(id, document.getElementById(id)); return this.nodes.get(id); }
    text(id, value) { if (this.last.get(id) !== value) { this.el(id).textContent = value; this.last.set(id, value); } }
    lamp(id, active) { this.el(id).classList.toggle('on', active); }
    bar(id, fraction) { this.el(id).style.transform = `scaleX(${clamp(fraction, 0, 1).toFixed(3)})`; }
    update(m) {
      const rpm = m.sensor.rpm;
      const angle = Math.round((-135 + clamp(rpm / 7000, 0, 1) * 270) * 10) / 10;
      if (angle !== this.lastNeedle) { this.needle.setAttribute('transform', `rotate(${angle} 150 126)`); this.needle.style.transform = `rotate(${angle}deg)`; this.lastNeedle = angle; }
      this.text('dash-rpm', String(Math.round(rpm / 10) * 10));
      this.text('dash-water', m.coolantLevel > .01 ? Math.round(m.sensor.coolant) + '°' : 'СУХО');
      this.text('dash-oil', m.sensor.pressure.toFixed(1)); this.text('dash-volts', m.relay.voltage.toFixed(1));
      this.text('dash-brake-temp', Math.round(m.sensor.brakeTemp) + '°');
      this.text('dash-load', m.absorbedKW.toFixed(1)); this.text('dash-torque', Math.round(m.absorbedNm));
      this.text('dash-fade', Math.round(m.brakeFade * 100) + '%');
      this.text('dash-cylinder', m.activeCount + ' / 4');
      this.text('dash-energy', Math.round(m.brakeEnergyKJ).toLocaleString('ru-RU'));
      this.text('dash-mode', m.profile === 'stress' ? 'СТРЕСС ×8' : 'ОБЫЧНЫЙ РЕЖИМ');
      this.bar('load-fill', m.absorbedKW / 140); this.bar('brake-heat-fill', (m.brakeTemp - 24) / 576);
      this.bar('coolant-fill', (m.sensor.coolant - 50) / 80); this.bar('oil-pressure-fill', m.sensor.pressure / 5.2);
      this.lamp('lamp-oil', m.pressure < .7); this.lamp('lamp-coolant', m.coolant > 110 || m.coolantLevel < .01);
      this.lamp('lamp-brake', m.brakeTemp > 400); this.lamp('lamp-limit', m.revCut);
      this.lamp('lamp-assist', m.antiStall); this.lamp('lamp-fan', m.relay.closed);
      const condition = m.brakeTemp > 400 ? 'ТОРМОЗ ПЕРЕГРЕТ' : m.antiStall ? 'ЗАЩИТА ОТ ОСТАНОВКИ' : m.revCut ? 'ОТСЕЧКА ТОПЛИВА' : m.brake > .04 ? 'ТОРМОЖЕНИЕ ВАЛА' : m.overrun ? 'СБРОС ГАЗА' : m.throttle > .08 ? 'СВОБОДНЫЙ РАЗГОН' : 'ХОЛОСТОЙ ХОД';
      this.text('dash-condition', condition);
      this.text('pedal-feedback', m.brake > .03 ? `${Math.round(m.absorbedNm)} Н·м · ${m.absorbedKW.toFixed(1)} кВт в тормоз` : 'Тормоз разгружен');
      // Compact continuously driven rotor preview, with a stationary caliper.
      this.el('dyno-rotor').setAttribute('transform', `rotate(${(m.dynoAngle * 180 / Math.PI).toFixed(1)} 48 48)`);
      this.el('dyno-caliper').classList.toggle('engaged', m.brake > .02);
      this.el('brake-thermal').classList.toggle('hot-brake', m.brakeTemp > 400);
    }
  }
  root.Piston.Dashboard = Dashboard;
})(window);
