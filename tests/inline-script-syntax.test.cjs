const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function read(name) {
  return fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
}

test('Owner Studio and main-page inline JavaScript remain syntactically valid', () => {
  for (const file of ['owner-studio.html', 'index.html']) {
    const html = read(file);
    const scripts = [];
    const pattern = /<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script\s*>/gi;
    let match;
    while ((match = pattern.exec(html))) {
      if (match[1].trim()) scripts.push(match[1]);
    }
    assert.ok(scripts.length > 0, file + ' should contain inline scripts');
    scripts.forEach((source, index) => {
      assert.doesNotThrow(() => new vm.Script(source, { filename: file + ':inline-' + (index + 1) }),
        file + ' inline script ' + (index + 1) + ' must parse');
    });
  }
  assert.doesNotThrow(() => new vm.Script(read('script.js'), { filename: 'script.js' }));
  assert.doesNotThrow(() => new vm.Script(read('mediaEngine.js'), { filename: 'mediaEngine.js' }));
});
