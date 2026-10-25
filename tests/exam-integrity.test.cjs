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

test('Owner controls Fisher-Yates question and option shuffling', () => {
  assert.match(owner, /id="ownerRandomizeSets"/);
  assert.match(owner, /randomizeSets: !!document\.getElementById\('ownerRandomizeSets'\)\?\.checked/);
  assert.match(script, /if \(config\.randomizeSets !== false\)/);
  assert.match(script, /const shuffled = options\.map\(\(option, oldIndex\) => \(\{ option, oldIndex \}\)\)/);
  assert.match(script, /const newCorrectIndex = shuffled\.findIndex\(item => item\.oldIndex === oldCorrectIndex\)/);
});

test('Exam checking supports per-question score overrides, draft save, and final review lock', () => {
  assert.match(owner, /const setQuestionScore = value =>/);
  assert.match(owner, /\['\+1', 1\], \['0', 0\]/);
  assert.match(owner, /questionScores: d\.questionScores \|\| \{\}/);
  assert.match(owner, /reviewLocked: finalLock === true/);
  assert.match(owner, /textContent = '💾 ड्राफ्ट सहेजें'/);
  assert.match(owner, /textContent = '✓ अंतिम अनुमोदन एवं लॉक'/);
  assert.match(owner, /Owner: लॉक हटाएँ/);
});

test('Exam checking renders a responsive split-screen candidate and evaluation workspace', () => {
  assert.match(owner, /checking-workspace/);
  assert.match(owner, /candidate-queue-panel/);
  assert.match(owner, /candidate-eval-panel/);
  assert.match(owner, /grid-template-columns:minmax\(240px/);
  assert.match(owner, /@media\(max-width:900px\)/);
});

test('Owner live session queue offers confirmed force-kick for active attempts', () => {
  assert.match(owner, /⛔ परीक्षा रोकें \/ Force Kick/);
  assert.match(owner, /setExamSessionDecision\(row\.id, 'kicked'\)/);
  assert.match(owner, /reason = 'owner_force_kick'/);
});

test('Option shuffling is skipped when a private answer key is not available in the question record', () => {
  assert.match(script, /if \(!correctKeys\.length\) return/);
  assert.match(script, /Main\/mock answer keys live in a separate private collection/);
});
