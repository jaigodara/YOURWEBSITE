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


test('Daily Quiz results CTA opens the public winner leaderboard, separately from personal exam results', () => {
  assert.match(indexHtml, /<section id="dailyQuizResultsFeature" data-owner-visibility="dailyQuizResultsVisible"/);
  assert.match(indexHtml, /<section id="dailyQuizResultsPanel" class="space-y-4"/);
  const cta = indexHtml.match(/id="openMyDailyQuizResultsCta"[\s\S]{0,300}/)?.[0] || '';
  assert.match(cta, /window\.openDailyQuizResults\(\)/);
  assert.match(indexHtml, /id="dailyWinnerDateLabel"/);
  assert.match(indexHtml, /id="rank1Name"/);
  assert.match(scriptJs, /window\.openDailyQuizResults = function openDailyQuizResults\(\)[\s\S]*dailyQuizResultsPanel[\s\S]*scrollIntoView/);
  assert.match(scriptJs, /collection\('publishedResults'\)/);
  assert.match(scriptJs, /state\.myResults/);
});

test('Community actions use the current Firebase Auth session instead of waiting on stale observer state', () => {
  assert.match(scriptJs, /const activeUser = state\.auth \? state\.auth\.currentUser : state\.user/);
  assert.match(scriptJs, /state\.user = activeUser/);
  assert.match(scriptJs, /const signedInUser = state\.auth \? state\.auth\.currentUser : state\.user/);
});


test('Owner daily-results toggle controls the complete winners panel and not the Main/Mock results desk', () => {
  assert.match(indexHtml, /id="dailyQuizResultsFeature" data-owner-visibility="dailyQuizResultsVisible"/);
  assert.match(indexHtml, /id="dailyQuizResultsPanel" class="space-y-4"/);
  assert.match(indexHtml, /id="openMyDailyQuizResultsCta"[^>]*onclick="window\.openDailyQuizResults\(\)"/);
  const visibilityStart = scriptJs.indexOf('window.renderExamVisibility = function renderExamVisibility()');
  const visibilityEnd = scriptJs.indexOf('const EXAM_SCHEDULES', visibilityStart);
  const visibility = scriptJs.slice(visibilityStart, visibilityEnd);
  assert.match(visibility, /dailyQuizResultsVisible: c\.dailyQuizResultsVisible !== false/);
  assert.match(visibility, /\['myResultsPanel', c\.resultsVisible !== false\]/);
  assert.doesNotMatch(visibility, /c\.resultsVisible !== false \|\| c\.dailyQuizResultsVisible/);
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

test('Maintenance media playback does not expose the floating mini-player', () => {
  assert.match(mediaJs, /function openMedia\(item, options = \{\}\)/);
  assert.match(mediaJs, /const allowMiniPlayer = options\.allowMiniPlayer !== false/);
  assert.match(mediaJs, /openMedia\(item, \{ allowMiniPlayer: false \}\)/);
  assert.match(mediaJs, /mini\.hidden = !allowMiniPlayer/);
});

test('Home maintenance shows Owner-published YouTube and audio media cards using the shared media library', () => {
  assert.match(scriptJs, /id="platformMaintenanceMediaList"/);
  assert.match(scriptJs, /renderMaintenanceFeed\?\.\(byId\('platformMaintenanceMediaList'\)\)/);
  assert.match(mediaJs, /function renderMaintenanceFeed\(container\)/);
  assert.match(scriptJs, /platformMaintenanceMediaList/);
  assert.match(mediaJs, /openMedia\(item\)/);
});

test('Community uses private per-member like/dislike reactions with server-side validation', () => {
  assert.match(scriptJs, /window\.BishnoiCommunity\.loadReactions = async function/);
  assert.match(scriptJs, /window\.BishnoiCommunity\.toggleReaction = async function/);
  assert.match(scriptJs, /data-community-reaction="like"/);
  assert.match(scriptJs, /data-community-reaction="dislike"/);
  assert.match(rules, /match \/reactions\/\{reactorUid\}/);
  assert.match(rules, /reactorUid == request\.auth\.uid/);
  assert.match(rules, /'like', 'dislike'/);
});

test('Community read receipts count one first read per signed-in member without exposing reader identities', () => {
  assert.match(scriptJs, /async function markCommunityPostRead\(post\)/);
  assert.match(scriptJs, /transaction\.set\(readRef/);
  assert.match(scriptJs, /readCount: firebase\.firestore\.FieldValue\.increment\(1\)/);
  assert.match(rules, /match \/reads\/\{readerUid\}/);
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

test('Personal published results stay in My Results and are scoped to the signed-in UID without a second identity form', () => {
  assert.match(indexHtml, /id="myResultsPanel"/);
  assert.doesNotMatch(indexHtml, /resultLookupRoll|resultLookupName|resultLookupDob|verifyMyResultIdentity/);
  assert.match(scriptJs, /collection\('publishedResults'\)\.where\('uid', '==', state\.user\.uid\)/);
  assert.match(scriptJs, /filter\(row => row\.status === 'published'\)/);
  assert.match(scriptJs, /const resultsReleased = state\.examConfig\?\.resultsPublished === true/);
  assert.match(scriptJs, /const rows = allRows\.filter\(row => row\.mode === 'quiz' \|\| resultsReleased\)/);
});

test('Community uses one unfiltered conversation instead of the removed topic picker', () => {
  assert.doesNotMatch(indexHtml, /id="chatTopicFilter"|📋 सभी विषय/);
  assert.match(indexHtml, /id="communityFeed"/);
  assert.match(indexHtml, /id="postEditor"/);
});

test('Owner Community poll manager is grouped under Literature and Media management', () => {
  assert.equal((ownerHtml.match(/id="ownerCommunityPollManager"/g) || []).length, 1);
  assert.match(ownerHtml, /data-studio-page="media"/);
  assert.doesNotMatch(ownerHtml, /data-studio-page="polls"/);
  assert.match(ownerHtml, /media:\s*\{\s*pane: 'pane_media',[\s\S]*?panels: \['ownerCommunityPollManager'\]/);
  assert.match(ownerHtml, /const OWNER_STUDIO_ROUTE_PANELS = \[[\s\S]*?'ownerCommunityPollManager'/);
});

test('Community Poll and Event attachments show a neutral unavailable message to non-owners', () => {
  assert.match(indexHtml, /data-community-attachment="poll"/);
  assert.match(indexHtml, /data-community-attachment="event"/);
  assert.doesNotMatch(indexHtml, /सामान्य सदस्यों के लिए उपलब्ध नहीं हैं/);
  const start = scriptJs.indexOf('window.BishnoiCommunity.openAttachment = async function (type)');
  const end = scriptJs.indexOf('window.BishnoiCommunity.autoResize', start);
  const handler = scriptJs.slice(start, end);
  assert.ok(handler.includes("if (!state.isOwner) return notify('यह सुविधा अभी उपलब्ध नहीं है।'"));
  assert.ok(handler.includes("if (type === 'event') return notify('इवेंट सुविधा अभी उपलब्ध नहीं है।'"));
});

test('Community reference controls use the existing Firebase conversation and owner moderation', () => {
  assert.match(indexHtml, /id="postLinkUrl"/);
  assert.match(indexHtml, /submitFeedback\(\)/);
  assert.match(scriptJs, /window\.BishnoiCommunity\.insertEmoji/);
  assert.match(scriptJs, /window\.BishnoiCommunity\.togglePinned/);
  assert.match(scriptJs, /window\.BishnoiCommunity\.submitFeedback/);
  assert.match(scriptJs, /data-pin-community-post/);
  assert.match(rules, /match \/communityFeedback\/\{feedbackId\}/);
  assert.match(rules, /request\.resource\.data\.linkUrl\.matches\('https:\/\/\.\*'\)/);
});

test('Maintenance reference preview is live-bound to existing controls and does not fake audio playback', () => {
  assert.match(ownerHtml, /id="ownerMaintenanceLivePreview"/);
  assert.match(ownerHtml, /updateMaintenanceLivePreview/);
  assert.match(ownerHtml, /यह प्रीव्यू आपके ऊपर चुने गए मेंटेनेंस मोड/);
  assert.match(ownerHtml, /id="ownerCommunityFeedbackPanel"/);
  assert.match(ownerHtml, /function loadCommunityFeedback/);
});
test('Community feedback writes obey the same posting maintenance lock as messages', () => {
  const feedbackRule = rules.slice(rules.indexOf('match /communityFeedback/'), rules.indexOf('match /communityPolls/'));
  assert.match(feedbackRule, /communityPostingAllowed\(\)/);
});

test('Home maintenance includes a Daily Quiz action beside the existing bhajan and video content', () => {
  assert.match(scriptJs, /id="platformMaintenanceQuizCta"/);
  assert.match(scriptJs, /onclick="window\.startQuiz\(\)"/);
  assert.match(scriptJs, /state\.examConfig\?\.dailyQuizVisible === false/);
  assert.match(scriptJs, /renderMaintenanceFeed\?\.\(byId\('platformMaintenanceMediaList'\)\)/);
  assert.match(scriptJs, /renderAudioList\?\.\(state\.audioItems \|\| \[\]\)/);
});

test('Owner Studio starts with only the Dashboard route panels visible', () => {
  assert.match(ownerHtml, /function initializeOwnerStudioRouteVisibility\(\)/);
  assert.match(ownerHtml, /OWNER_STUDIO_ROUTE_PANELS\.forEach\(id => \{/);
  assert.match(ownerHtml, /OWNER_STUDIO_ROUTES\.dashboard\.panels/);
  assert.match(ownerHtml, /initializeOwnerStudioRouteVisibility\(\);/);
});
