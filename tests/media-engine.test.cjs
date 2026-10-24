const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('media URL parsers accept supported links and reject malformed input', () => {
  const window = {};
  const document = { readyState: 'loading', addEventListener() {} };
  const context = { window, document, console, URL, fetch: async () => ({ ok: false }) };
  const source = fs.readFileSync(path.join(__dirname, '..', 'mediaEngine.js'), 'utf8');
  vm.runInNewContext(source, context, { filename: 'mediaEngine.js' });
  const media = window.BishnoiMedia;

  assert.equal(media.extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(media.extractYouTubeId('https://youtu.be/dQw4w9WgXcQ?t=10'), 'dQw4w9WgXcQ');
  assert.equal(media.extractYouTubeId('https://m.youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(media.extractYouTubeId('https://youtube.com/watch?v=bad'), '');
  assert.equal(media.extractDriveId('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWx/view?usp=sharing'), '1AbCdEfGhIjKlMnOpQrStUvWx');
  assert.equal(media.drivePreviewUrl('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWx/view'), 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWx/preview');
  assert.equal(media.extractDriveId('https://example.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWx'), '');
  assert.equal(media.normalizePhone('9876543210'), '9876543210');
  assert.equal(media.normalizePhone('+91 98765 43210'), '9876543210');
  assert.equal(media.normalizePhone('1234567890'), '');
});
