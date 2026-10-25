const { readFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const script = readFileSync(path.join(root, 'script.js'), 'utf8');
const rules = readFileSync(path.join(root, 'firestore.rules'), 'utf8');
const owner = readFileSync(path.join(root, 'owner-studio.html'), 'utf8');

test('Exam integrity guards locally block clipboard actions and log tab/fullscreen violations', () => {
  assert.match(script, /function installExamIntegrityGuards\(\)/);
  assert.match(script, /\['copy', 'cut', 'paste', 'contextmenu', 'selectstart'\]/);
  assert.match(script, /recordLiveExamViolation\('fullscreen_exit'/);
  assert.match(script, /recordLiveExamViolation\('tab_switch'/);
  assert.match(script, /collection\('live_violations'\)\.add\(record\)/);
  assert.match(script, /local.*backup|स्थानीय बैकअप/i);
});

test('Live violation rules restrict student writes to their own bounded exam events', () => {
  const start = rules.indexOf('match /live_violations/{violationId}');
  const end = rules.indexOf('match /{document=**}', start);
  assert.ok(start >= 0 && end > start, 'live violation rules should exist before the deny-all rule');
  const block = rules.slice(start, end);
  assert.match(block, /request\.resource\.data\.get\('uid', ''\) == request\.auth\.uid/);
  assert.match(block, /request\.resource\.data\.keys\(\)\.hasOnly/);
  assert.match(block, /allow read: if examOwner\(\)/);
  assert.match(block, /allow update, delete: if owner\(\)/);
});

test('Owner Studio exposes a live violation monitoring table', () => {
  assert.match(owner, /id="liveViolationsList"/);
  assert.match(owner, /onclick="loadLiveExamViolations\(\)"/);
  assert.match(owner, /window\.loadLiveExamViolations = loadLiveExamViolations/);
});

test('Main and mock results remain hidden until the Owner releases the result gate', () => {
  assert.match(script, /const resultsReleased = state\.examConfig\?\.resultsPublished === true/);
  assert.match(script, /allRows\.filter\(row => row\.mode === 'quiz' \|\| resultsReleased\)/);
  assert.match(owner, /id="ownerResultsReleaseButton"[^>]*onclick="toggleExamResultsRelease\(\)"/);
  assert.match(owner, /resultsPublished: releasing/);
  assert.match(owner, /function toggleExamResultsRelease\(\)/);
});
