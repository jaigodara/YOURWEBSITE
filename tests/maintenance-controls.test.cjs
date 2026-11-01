const { readFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const ownerHtml = readFileSync(path.join(root, 'owner-studio.html'), 'utf8');
const indexHtml = readFileSync(path.join(root, 'index.html'), 'utf8');
const portalHtml = readFileSync(path.join(root, 'exam-portal.html'), 'utf8');
const scriptJs = readFileSync(path.join(root, 'script.js'), 'utf8');
const mediaJs = readFileSync(path.join(root, 'mediaEngine.js'), 'utf8');
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
  assert.match(rules, /get\('globalMode', 'off'\) in \['off', 'web_only', 'phone_only'\]/);
  assert.match(rules, /get\('globalMode', 'off'\) == 'both'/);
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


test('Daily quiz winners are date-scoped so a previous day cannot remain on the public leaderboard', () => {
  assert.match(ownerHtml, /id="dailyWinnerDate"/);
  assert.match(ownerHtml, /winnerDate,/);
  assert.match(ownerHtml, /dailyWinnerDate'\)\?\.value/);
  assert.match(scriptJs, /const today = new Date\(\)\.toLocaleDateString\('en-CA', \{ timeZone: 'Asia\/Kolkata' \}\)/);
  assert.match(scriptJs, /const isToday = winnerDate === today/);
  assert.match(indexHtml, /id="dailyWinnerDateLabel"/);
});

test('Exam archive list exposes the actual Firestore error code instead of a misleading generic message', () => {
  const start = ownerHtml.indexOf('async function loadExamArchives()');
  const end = ownerHtml.indexOf('window.loadExamArchives = loadExamArchives;', start);
  assert.ok(start >= 0 && end > start, 'archive loader should exist');
  const loader = ownerHtml.slice(start, end);
  assert.match(loader, /error\.code \|\| 'unknown'/);
  assert.match(loader, /error\.message \|\| error/);
});

test('Exam archive copies and verifies records before deleting active records, while retaining published results', () => {
  const start = ownerHtml.indexOf('async function archiveCompletedExamWorkflow()');
  const end = ownerHtml.indexOf('window.archiveCompletedExamWorkflow = archiveCompletedExamWorkflow;', start);
  assert.ok(start >= 0 && end > start, 'archive workflow should exist');
  const workflow = ownerHtml.slice(start, end);
  assert.ok(workflow.indexOf('await batch.commit()') < workflow.indexOf('const archivedSnapshot = await archiveRef.collection(\'records\').get()'));
  assert.ok(workflow.indexOf('const archivedSnapshot = await archiveRef.collection(\'records\').get()') < workflow.indexOf('batch.delete(record.ref)'));
  assert.match(workflow, /removeSource: false/);
  assert.match(workflow, /sourceCollection: 'publishedResults', removeSource: false/);
});


test('Daily quiz result CTA reveals the existing published-results panel', () => {
  assert.match(indexHtml, /id="mainDailyQuizResultsCta"/);
  assert.match(indexHtml, /show-daily-results/);
  assert.match(scriptJs, /window\.openDailyQuizResults = async function openDailyQuizResults/);
  assert.match(scriptJs, /collection\('publishedResults'\)/);
  assert.match(scriptJs, /state\.myResults/);
});

test('Community actions use the current Firebase Auth session instead of waiting on stale observer state', () => {
  assert.match(scriptJs, /const activeUser = state\.auth \? state\.auth\.currentUser : state\.user/);
  assert.match(scriptJs, /state\.user = activeUser/);
  assert.match(scriptJs, /const signedInUser = state\.auth \? state\.auth\.currentUser : state\.user/);
});


test('Daily quiz results CTA opens the public daily-winner area, not the private exam-results identity form', () => {
  assert.match(indexHtml, /id="mainDailyQuizResultsCta"[^>]*onclick="document\.getElementById\('dailyWinnerDateLabel'\)/);
  assert.doesNotMatch(indexHtml.match(/id="mainDailyQuizResultsCta"[\s\S]{0,300}/)?.[0] || '', /openDailyQuizResults/);
  assert.match(indexHtml, /आज के विजेता अभी प्रकाशित नहीं हुए हैं।/);
});

test('Fixed bottom navigation leaves enough scroll room for the result verification form and maintenance view', () => {
  const css = readFileSync(path.join(root, 'style.css'), 'utf8');
  assert.match(css, /padding-bottom:\s*calc\(132px \+ env\(safe-area-inset-bottom/);
  assert.match(css, /#myResultsPanel[^{]*\{[^}]*scroll-margin-bottom/);
  assert.match(css, /#globalMaintenanceOverlay[^{]*\{[^}]*top:\s*100px/);
  assert.match(css, /#globalMaintenanceOverlay[^{]*\{[^}]*bottom:/);
});

test('Home maintenance replaces invalid placeholder copy with a useful update panel and uploaded bhajan list', () => {
  assert.match(scriptJs, /function cleanMaintenanceMessage\(value, fallback\)/);
  assert.match(scriptJs, /platformMaintenanceAudioList/);
  assert.match(scriptJs, /डिजिटल साहित्य में Owner द्वारा अपलोड किए गए ऑडियो/);
});

test('Home maintenance shows Owner-published YouTube and audio media cards using the shared media library', () => {
  assert.match(scriptJs, /id="platformMaintenanceMediaList"/);
  assert.match(scriptJs, /renderMaintenanceFeed\?\.\(byId\('platformMaintenanceMediaList'\)\)/);
  assert.match(mediaJs, /function renderMaintenanceFeed\(container\)/);
  assert.match(scriptJs, /platformMaintenanceMediaList/);
  assert.match(mediaJs, /openMedia\(item\)/);
});

test('Community read receipts count one first read per signed-in member without exposing reader identities', () => {
  assert.match(scriptJs, /async function markCommunityPostRead\(post\)/);
  assert.match(scriptJs, /transaction\.set\(readRef/);
  assert.match(scriptJs, /readCount: firebase\.firestore\.FieldValue\.increment\(1\)/);
  assert.match(scriptJs, /match \/reads\/\{readerUid\}/);
  assert.match(rules, /readerUid == request\.auth\.uid/);
});

test('Community includes owner-created polls with one vote per signed-in member and visible like controls', () => {
  assert.match(indexHtml, /id="communityPollFeed"/);
  assert.match(ownerHtml, /id="ownerCommunityPollManager"/);
  assert.match(scriptJs, /window\.BishnoiCommunity\.createPoll = async function/);
  assert.match(scriptJs, /window\.BishnoiCommunity\.votePoll = async function/);
  assert.match(scriptJs, /data-community-like/);
  assert.match(rules, /match \/communityPolls\/\{pollId\}/);
  assert.match(rules, /voterUid == request\.auth\.uid/);
});

test('Home maintenance notice is mounted only inside the Home tab and is excluded from the Home lock pass', () => {
  assert.match(scriptJs, /const homeSection = byId\('tab-home'\)/);
  assert.match(scriptJs, /homeSection\.prepend\(platformNotice\)/);
  assert.match(scriptJs, /let notice = key === 'home' \? platformNotice/);
  assert.doesNotMatch(scriptJs, /mainContent\.insertBefore\(platformNotice/);
});

test('Maintenance bhajan buttons use the correct host styling and render the current uploaded audio list', () => {
  assert.match(scriptJs, /const maintenanceHost = host\.id === 'platformMaintenanceAudioList'/);
  assert.match(scriptJs, /window\.renderAudioList\(state\.audioItems \|\| \[\]\)/);
});

test('Daily quiz results CTA opens the signed-in student result panel separately from winner rankings', () => {
  assert.match(indexHtml, /id="openMyDailyQuizResultsCta"/);
  assert.match(indexHtml, /onclick="window\.openDailyQuizResults\(\)"/);
  assert.match(scriptJs, /window\.openDailyQuizResults = async function/);
});

test('Community uses one unfiltered conversation instead of the removed topic picker', () => {
  assert.doesNotMatch(indexHtml, /id="chatTopicFilter"|📋 सभी विषय/);
  assert.match(indexHtml, /id="communityFeed"/);
  assert.match(indexHtml, /id="postEditor"/);
});
