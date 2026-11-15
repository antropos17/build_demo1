'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), cp = require('node:child_process');
test('Portable HTML embeds all styles and scripts without remote scripts or styles; recorded audio manifest is explicit', () => {
  const root = path.resolve(__dirname, '..'); cp.execFileSync(process.execPath, ['tools/build.cjs'], { cwd: root });
  const html = fs.readFileSync(path.join(root, 'dist/last-piston.html'), 'utf8');
  assert.ok(!/<script[^>]+src=/.test(html)); assert.ok(!/<link[^>]+rel="stylesheet"/.test(html));
  assert.ok(html.includes('opengameart.org')); assert.ok(html.includes('EMBEDDED_AUDIO'));
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]; assert.equal(scripts.length, [...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script defer src=/g)].length);
  for (const match of scripts) new vm.Script(match[1]);
  assert.ok(html.indexOf('src/dynamics.js') < 0); assert.ok(html.includes('class Engine extends CoreEngine')); assert.ok(html.length < 550000 + fs.statSync(path.join(root,"assets/soundbank.js")).size);
});
