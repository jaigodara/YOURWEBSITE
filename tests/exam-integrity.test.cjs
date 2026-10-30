const { readFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const script = readFileSync(path.join(root, 'script.js'), 'utf8');
const rules = readFileSync(path.join(root, 'firestore.rules'), 'utf8');
const owner = readFileSync(path.join(root, 'owner-studio.html'), 'utf8');


test('Owner Studio removes the unused photo proctoring UI and settings listener but retains live violation logs', () => {
  assert.ok(!owner.includes('examProctoringToggle'));
  assert.ok(!owner.includes('proctoringStatusBadge'));
  assert.ok(!owner.includes('proctoringEnabled'));
  assert.ok(!owner.includes('listenProctoringConfig'));
  assert.ok(!owner.includes('toggleExamProctoring'));
  assert.ok(owner.includes('ownerExamIntegrityPanel'));
  assert.ok(owner.includes('liveViolationsList'));
});

test('exam archive isolates custom exams and includes custom questions in archive', () => {
  assert.ok(owner.includes('archiveCustomExamFromRegistry()'));
  assert.ok(!owner.includes("onclick=\"changeCustomExamStatus('archived')\""));
  assert.ok(owner.includes("downloadSelectedExamArchive('xlsx')"));
  assert.ok(owner.includes("downloadSelectedExamArchive('pdf')"));
  assert.ok(owner.includes("downloadSelectedExamArchive('json')"));
  assert.ok(owner.includes('customExamQuestions'));
  assert.ok(owner.includes('examAnswerKeys'));
  assert.ok(owner.includes('!data.customExamId && !data.examId'));
});

test('exam archive refuses to clear active, kicked or pending re-entry sessions', () => {
  assert.ok(owner.includes("['active', 'late_request', 'kicked']"));
  assert.ok(owner.includes('सभी प्रयास जमा/समाप्त होने के बाद ही आर्काइव करें'));
});

test('daily quiz archive does not disable the year-round daily quiz', () => {
  const start = owner.indexOf('async function archiveCompletedExamWorkflow');
  const end = owner.indexOf('window.archiveCompletedExamWorkflow', start);
  assert.ok(owner.slice(start, end).includes("mode !== 'quiz' && config.closeField"));
});

test('Daily Quiz results button refreshes the signed-in user results from the shared publishedResults collection', () => {
  const start = script.indexOf('window.openDailyQuizResults = async function');
  const end = script.indexOf('window.renderMyResults = function', start);
  const handler = script.slice(start, end);
  assert.ok(handler.includes('state.auth?.currentUser'));
  assert.ok(handler.includes("collection('publishedResults')"));
  assert.ok(handler.includes(".where('uid', '==', state.user.uid)"));
  assert.ok(handler.includes("row.status === 'published'"));
});

test('Community posting synchronizes with the main Firebase Auth session', () => {
  const start = script.indexOf('window.BishnoiCommunity.submitPost = async function');
  const end = script.indexOf('window.upvoteCommunityPost', start);
  const submit = script.slice(start, end);
  assert.ok(submit.includes('state.auth?.currentUser'));
  assert.ok(submit.includes('state.user = activeFirebaseUser || null'));
  assert.ok(submit.includes("collection('posts').add"));
});

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
