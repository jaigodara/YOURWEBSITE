const { readFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const ownerHtml = readFileSync(path.join(root, 'owner-studio.html'), 'utf8');
const indexHtml = readFileSync(path.join(root, 'index.html'), 'utf8');
const portalHtml = readFileSync(path.join(root, 'exam-portal.html'), 'utf8');
const scriptJs = readFileSync(path.join(root, 'script.js'), 'utf8');
const rules = readFileSync(path.join(root, 'firestore.rules'), 'utf8');

test('Owner Studio exposes separate maintenance status, message, and access controls for the four requested sections', () => {
  for (const id of [
    'lock_home', 'msg_home', 'allow_home',
    'lock_sahitya', 'msg_sahitya', 'allow_sahitya',
    'lock_pariksha', 'msg_pariksha', 'allow_pariksha',
    'lock_samvad', 'msg_samvad', 'allow_samvad'
  ]) {
    assert.equal((ownerHtml.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1, id + ' should exist exactly once');
  }
  assert.match(ownerHtml, /sectionMessages/);
  assert.match(ownerHtml, /sectionAllow/);
});

test('Maintenance settings preserve the existing settings/maintenance document and legacy section controls', () => {
  assert.match(ownerHtml, /collection\('settings'\)\.doc\('maintenance'\)\.set/);
  assert.match(ownerHtml, /mala: document\.getElementById\('lock_mala'\)/);
  assert.match(ownerHtml, /history: document\.getElementById\('lock_history'\)/);
  assert.match(ownerHtml, /community: selected\('lock_samvad'\) !== 'maintenance' \? 'off'/);
  assert.match(ownerHtml, /allow_samvad/);
});

test('Main website renders per-section maintenance messages and community posting remains blocked during maintenance', () => {
  assert.match(scriptJs, /const sectionMessages = m\.sectionMessages \|\| \{\}/);
  assert.match(scriptJs, /const sectionAllow = m\.sectionAllow \|\| \{\}/);
  assert.match(scriptJs, /sectionMessages\[key\]/);
  assert.match(scriptJs, /communityMode === 'posting_only' \|\| communityMode === 'both'/);
  assert.match(scriptJs, /अभी नए संदेश भेजना अस्थायी रूप से बंद है/);
});

test('Firestore validates maintenance settings and enforces community maintenance at the database boundary', () => {
  assert.match(rules, /function validMaintenanceSettings\(\)/);
  assert.match(rules, /sectionMessages/);
  assert.match(rules, /sectionAllow/);
  assert.match(rules, /get\('community', 'off'\) in \['off', 'posting_only', 'both'\]/);
  assert.match(rules, /function communityPostingAllowed\(\)/);
  assert.match(rules, /get\('sections', \{\}\)\.get\('community', 'off'\) == 'off'/);
  assert.match(rules, /communityUserNotBlocked\(request\.auth\.uid\)/);
});

test('Public leaderboard uses rank IDs and is populated from the Owner Studio dailyWinners document', () => {
  for (const id of ['rank1Name', 'rank1Score', 'rank2Name', 'rank2Score', 'rank3Name', 'rank3Score']) {
    assert.equal((indexHtml.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1, id + ' should exist exactly once');
  }
  assert.doesNotMatch(indexHtml, /id="winner[123](Name|Score)"/);
  assert.match(scriptJs, /collection\('settings'\)\.doc\('dailyWinners'\)/);
  assert.match(scriptJs, /data\.p1Name/);
  assert.match(scriptJs, /setText\(id, scoreLabel\(value\)\)/);
});

test('Separate exam portal no longer displays question-set labels and obeys the exam maintenance lock', () => {
  assert.doesNotMatch(portalHtml, /Set 1|mock1QuestionSet|mock2QuestionSet|mainQuestionSet|activeSets|mock1SetStatus|mock2SetStatus|mainSetStatus/);
  assert.match(portalHtml, /settings\"\)\.doc\(\"maintenance\"\)/);
  assert.match(portalHtml, /__bishnoismMaintenanceLocked/);
  assert.match(portalHtml, /sectionMessages[\s\S]{0,60}\.quiz/);
});

test('Firestore blocks exam and media reads during a full section maintenance lock unless access is allowed', () => {
  assert.match(rules, /function sectionMaintenanceAllows\(sectionKey\)/);
  assert.match(rules, /sectionMaintenanceAllows\('quiz'\)/);
  assert.match(rules, /sectionMaintenanceAllows\('library'\)/);
  assert.match(rules, /allow read: if sectionMaintenanceAllows\('community'\)/);
});
