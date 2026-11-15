'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), cp = require('node:child_process');
test('Portable HTML embeds all styles and scripts without remote dependencies', () => {
  const root = path.resolve(__dirname, '..'); cp.execFileSync(process.execPath, ['tools/build.cjs'], { cwd: root });
  const html = fs.readFileSync(path.join(root, 'dist/last-piston.html'), 'utf8');
  assert.ok(!/<script[^>]+src=/.test(html)); assert.ok(!/<link[^>]+rel="stylesheet"/.test(html));
  assert.ok(!/https?:\/\//.test(html.replace(/http:\/\/www\.w3\.org\/2000\/svg/g, '')));
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]; assert.equal(scripts.length, 14);
  for (const match of scripts) new vm.Script(match[1]);
  assert.ok(html.indexOf('src/dynamics.js') < 0); assert.ok(html.includes('class Engine extends CoreEngine')); assert.ok(html.length < 240000);
});
