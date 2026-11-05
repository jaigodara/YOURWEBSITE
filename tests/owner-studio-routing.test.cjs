const { readFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const ownerHtml = readFileSync(path.join(root, 'owner-studio.html'), 'utf8');
const portalHtml = readFileSync(path.join(root, 'exam-portal.html'), 'utf8');
const scriptJs = readFileSync(path.join(root, 'script.js'), 'utf8');

test('Owner Studio navigation points to real panels and supports Admit Cards and Settings', () => {
  const routesStart = ownerHtml.indexOf('const OWNER_STUDIO_ROUTES = {');
  const routesEnd = ownerHtml.indexOf('const OWNER_STUDIO_ROUTE_PANELS', routesStart);
  assert.ok(routesStart >= 0 && routesEnd > routesStart, 'route map should exist');
  const routeMap = ownerHtml.slice(routesStart, routesEnd);
  for (const page of ['dashboard', 'questions', 'checking', 'admit', 'notifications', 'settings', 'exports', 'media']) {
    assert.match(routeMap, new RegExp('\\b' + page + '\\s*:'));
    assert.ok(ownerHtml.includes('data-studio-page="' + page + '"'), 'navigation button should exist for ' + page);
  }
  for (const panel of [
    'ownerDailyWinnersPanel', 'ownerQuestionBankPanel', 'ownerExamSessionMonitorPanel',
    'manualExamReviewSection', 'ownerRegistrationReviewPanel', 'ownerAdmitCardSettingsPanel',
    'ownerNotificationCard', 'ownerExamVisibilitySettingsPanel', 'ownerMaintenanceSettingsPanel',
    'ownerTrustedEditorsPanel', 'ownerDataExportPanel', 'ownerExportPanel'
  ]) {
    assert.ok(ownerHtml.includes('id="' + panel + '"'), 'route target should exist: ' + panel);
  }
});

test('Owner Studio controls the full candidate journey without replacing existing exam workflows', () => {
  assert.match(ownerHtml, /id="ownerExamLifecycleDashboard"/);
  assert.match(ownerHtml, /id="ownerRegistrationOpen" type="checkbox"/);
  assert.match(ownerHtml, /registrationOpen:\s*document\.getElementById\('ownerRegistrationOpen'\)\?\.checked !== false/);
  assert.match(ownerHtml, /\['ownerRegistrationOpen', data\.registrationOpen !== false\]/);
  assert.match(ownerHtml, /renderOwnerExamLifecycleDashboard/);
  assert.match(ownerHtml, /releaseAdmitCards\(\)/);
  assert.match(ownerHtml, /toggleExamResultsRelease\(\)/);
  assert.match(scriptJs, /state\.examConfig\?\.registrationOpen === false/);
  assert.match(scriptJs, /enrollmentGateStatus/);
  assert.match(scriptJs, /enrollmentForm\.hidden = !enrollmentOpen/);
  const rules = readFileSync(path.join(root, 'firestore.rules'), 'utf8');
  assert.match(rules, /function enrollmentRegistrationOpen\(\)/);
  assert.match(rules, /allow create: if examOwner\(\) \|\| \(\s*enrollmentRegistrationOpen\(\)/);
  assert.match(rules, /allow update: if examOwner\(\) \|\| \(\s*enrollmentRegistrationOpen\(\)/);
});

test('Exam visibility settings do not read a missing mock master toggle or write twice', () => {
  assert.doesNotMatch(ownerHtml, /getElementById\(['"]ownerShowMock['"]\)/);
  assert.match(ownerHtml, /mockVisible:\s*!!document\.getElementById\('ownerShowMock1'\)\?\.checked\s*\|\|\s*!!document\.getElementById\('ownerShowMock2'\)\?\.checked/);
  assert.equal((ownerHtml.match(/onclick="(?:window\.)?saveExamVisibilitySettings\(\)"/g) || []).length, 1,
    'one full-settings save action should remain');
  assert.doesNotMatch(scriptJs, /saveVisibilityButton\.addEventListener\('click'/,
    'script.js must not attach a second partial save to the same button');
});

test('Exam portal shows each four-stage action once and removes the duplicate legacy cards', () => {
  const portalMarkup = portalHtml.split('<script')[0];
  for (const id of ['journeyRegistration', 'journeyAdmit', 'journeyLiveExam', 'journeyResults']) {
    assert.equal((portalMarkup.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1, id + ' should appear once');
  }
  for (const id of ['mainExamCard', 'enrollmentCard', 'resultsCard']) {
    assert.doesNotMatch(portalMarkup, new RegExp('id="' + id + '"'),
      id + ' duplicates a journey-stage action and must not be rendered');
  }
  for (const mode of ['main', 'results']) {
    assert.equal((portalMarkup.match(new RegExp('data-launch-exam="' + mode + '"', 'g')) || []).length, 1,
      mode + ' should have exactly one portal action');
  }
  assert.equal((portalMarkup.match(/data-launch-exam="enrollment"/g) || []).length, 2,
    'registration and the later admit-card stage both use the existing enrollment workflow');
  for (const mode of ['mock1', 'mock2']) {
    assert.equal((portalMarkup.match(new RegExp('data-launch-exam="' + mode + '"', 'g')) || []).length, 1,
      mode + ' should remain available as its own mock card');
  }
});

test('Owner Studio controls visibility of all four exam-portal journey stages independently of Daily Quiz', () => {
  const controls = [
    ['ownerPortalShowRegistrationStep', 'portalRegistrationStepVisible'],
    ['ownerPortalShowAdmitStep', 'portalAdmitStepVisible'],
    ['ownerPortalShowLiveExamStep', 'portalLiveExamStepVisible'],
    ['ownerPortalShowResultsStep', 'portalResultsStepVisible']
  ];
  for (const [id, key] of controls) {
    assert.ok(ownerHtml.includes('id="' + id + '"'), 'Owner toggle exists: ' + id);
    assert.ok(ownerHtml.includes(key + ': !!document.getElementById(\'' + id + '\')?.checked'), 'Owner saves ' + key);
    assert.ok(ownerHtml.includes("['" + id + "', data." + key + " !== false]"), 'Owner reloads ' + key);
    assert.ok(portalHtml.includes('config.' + key + ' !== false'), 'Portal applies ' + key);
  }
  assert.match(portalHtml, /setJourneyStep\("journeyAdmit"[^;]*admitReleased/);
  assert.match(portalHtml, /journey-icon/);
  assert.match(portalHtml, /@keyframes journey-float/);
  assert.doesNotMatch(portalHtml, /दैनिक क्विज़.*candidate-journey/);
});

test('Question importer allows native JSON import when SheetJS is unavailable', () => {
  const start = ownerHtml.indexOf('function importQuestionExcel(event)');
  const end = ownerHtml.indexOf('function ', start + 20);
  assert.ok(start >= 0 && end > start, 'question importer should exist');
  const importer = ownerHtml.slice(start, end);
  const jsonCheck = importer.indexOf("const isJson = extension === 'json'");
  const xlsxGuard = importer.indexOf('if (!isJson && !window.XLSX)');
  const jsonParser = importer.indexOf('JSON.parse(String(reader.result || \'\'))');
  assert.ok(jsonCheck >= 0 && xlsxGuard > jsonCheck, 'JSON should be distinguished before checking SheetJS');
  assert.ok(jsonParser > xlsxGuard, 'JSON should use the native parser');
  assert.match(importer, /XLSX\.read\(reader\.result, \{ type: 'array' \}\)/);
});

test('Question uploader validates answer choices and Firestore batch write limits', () => {
  assert.match(ownerHtml, /function importBulkQuestions\(\)/);
  assert.match(ownerHtml, /duplicateQuestionIndexes\(parsed\)/);
  assert.match(ownerHtml, /const writesPerQuestion = target === 'quiz' \? 1 : 2/);
  assert.match(ownerHtml, /Math\.floor\(400 \/ writesPerQuestion\)/);
  assert.match(ownerHtml, /function saveBulkQuestionDrafts\(\)/);
});

test('Exam portal retains the existing website session and opens requested sections in its embedded workspace', () => {
  assert.match(portalHtml, /auth\.onAuthStateChanged/);
  assert.match(portalHtml, /examFrame\.src = "\.\/index\.html\?examEmbed="/);
  for (const mode of ['main', 'mock1', 'mock2', 'enrollment', 'results']) {
    assert.ok(portalHtml.includes('data-launch-exam="' + mode + '"'), 'portal option should exist: ' + mode);
  }
  assert.match(scriptJs, /function claimPendingEditorInvitation/);
  assert.match(scriptJs, /examSessions/);
});

test('Owner Studio sidebar buttons are bound after the route handler is defined', () => {
  const binderStart = ownerHtml.indexOf('function bindOwnerStudioNavigation()');
  const binderEnd = ownerHtml.indexOf('function switchStudioPane(paneId)', binderStart);
  assert.ok(binderStart >= 0 && binderEnd > binderStart, 'navigation binder and next function should exist');
  const binder = ownerHtml.slice(binderStart, binderEnd);
  assert.match(binder, /sidebar\.addEventListener\('click'/, 'sidebar must delegate navigation clicks');
  assert.match(ownerHtml.slice(binderEnd - 180, binderEnd), /bindOwnerStudioNavigation\(\);/,
    'navigation binder must be called before the pane functions are used');
});

test('Admit-card release uses one roll-number input and no legacy file upload controls', () => {
  assert.equal((ownerHtml.match(/id="individualAdmitCardUid"/g) || []).length, 1,
    'there must be exactly one roll-number input');
  assert.doesNotMatch(ownerHtml, /id="individualAdmitCardPdf"/,
    'manual PDF upload is removed in favor of browser-generated cards');
  assert.doesNotMatch(ownerHtml, /id="uploadIndividualAdmitCardButton"/,
    'the obsolete upload action must not remain');
  assert.match(ownerHtml, /id="releaseIndividualAdmitCardButton"[^>]*onclick="releaseAdmitCardForRollNumber\(\)"/);
});

test('Question uploader compares against existing Firestore records and offers duplicate handling', () => {
  assert.match(ownerHtml, /orderBy\(firebase\.firestore\.FieldPath\.documentId\(\)\)/);
  assert.match(ownerHtml, /question\.existingDuplicate/);
  assert.match(ownerHtml, /OK = डुप्लिकेट सहित अपलोड करें/);
  assert.match(ownerHtml, /डुप्लिकेट छोड़कर बाकी अपलोड करें/);
  assert.match(ownerHtml, /const questionsPerBatch = Math\.max\(1, Math\.floor\(400 \/ writesPerQuestion\)\)/);
  assert.match(ownerHtml, /await batch\.commit\(\);[\s\S]*committedCount \+= chunk\.length/);
});

test('Exam question workflow has no per-student Set selector and resolves answer keys by exam collection', () => {
  assert.doesNotMatch(ownerHtml, /bulkQuestionSet|ownerQuizQuestionSet|ownerMock1QuestionSet|ownerMock2QuestionSet|ownerMainQuestionSet/);
  assert.match(ownerHtml, /function examQuestionCollectionForRecord\(row/);
  assert.match(ownerHtml, /questionCollection: item\.questionCollection/);
  assert.doesNotMatch(scriptJs, /data-question-set|VALID_QUESTION_SETS/);
  assert.match(scriptJs, /questionCollection: CONFIG\.examCollections\[mode\]/);
});


test('Legacy question uploader routes custom questions to the selected custom exam and its private key collection', () => {
  assert.match(ownerHtml, /option value="customExamQuestions">कस्टम परीक्षा/);
  assert.match(ownerHtml, /id="bulkCustomExamId"/);
  assert.match(ownerHtml, /where\('examId', '==', customExamId\)/);
  assert.match(ownerHtml, /examId: customExamId/);
  assert.match(ownerHtml, /collection\('examAnswerKeys'\)\.doc\(target\)/);
  assert.match(ownerHtml, /function handleBulkQuestionTargetChange/);
});

test('Question deletion also removes its private answer key in bounded batches', () => {
  assert.match(ownerHtml, /questionCollections\.has\(col\)/);
  assert.match(ownerHtml, /collection\('examAnswerKeys'\)\.doc\(col\)/);
  assert.match(ownerHtml, /offset \+= \(target === 'quiz' \? 400 : 200\)/);
});

test('Exam completion is owner-only, closes new entry after archive verification, and preserves published results', () => {
  const start = ownerHtml.indexOf('async function archiveCompletedExamWorkflow()');
  const end = ownerHtml.indexOf('window.archiveCompletedExamWorkflow = archiveCompletedExamWorkflow;', start);
  assert.ok(start >= 0 && end > start);
  const workflow = ownerHtml.slice(start, end);
  const verify = workflow.indexOf('const archivedSnapshot = await archiveRef.collection(\'records\').get()');
  const close = workflow.indexOf('await configRef.set(closePatch, { merge: true })');
  const remove = workflow.indexOf('batch.delete(record.ref)');
  assert.ok(verify >= 0 && close > verify && remove > close);
  assert.match(workflow, /publishedResults/);
  assert.match(workflow, /removeSource: false/);
});

test('Archive downloads are placed in Reports & Exports and support CSV and JSON', () => {
  const panelStart = ownerHtml.indexOf('id="ownerExamArchivePanel"');
  const panelEnd = ownerHtml.indexOf('</section>', panelStart);
  const actionPanel = ownerHtml.slice(panelStart, panelEnd);
  assert.doesNotMatch(actionPanel, /examArchiveSelect|downloadSelectedExamArchive/);
  const reportPanel = ownerHtml.indexOf('id="ownerExportPanel"');
  const archiveDownloads = ownerHtml.indexOf('id="examArchiveDownloads"');
  assert.ok(reportPanel >= 0 && archiveDownloads > reportPanel);
  assert.match(ownerHtml, /downloadSelectedExamArchive\('csv'\)/);
  assert.match(ownerHtml, /downloadSelectedExamArchive\('json'\)/);
});


test('Student, login and exam report dashboard is routed to Reports & Exports, not Dashboard', () => {
  const routeStart = ownerHtml.indexOf('exports: {');
  const routeEnd = ownerHtml.indexOf('\n  }\n};', routeStart);
  assert.ok(routeStart >= 0 && routeEnd > routeStart);
  assert.match(ownerHtml.slice(routeStart, routeEnd), /'ownerDataDashboard'/);
  assert.match(ownerHtml, /'ownerDataDashboard',\s*'ownerDataExportPanel'/);
});

test('Exam portal labels and launch buttons follow Owner-configured display names', () => {
  assert.match(portalHtml, /config\.mock1DisplayName/);
  assert.match(portalHtml, /config\.mock2DisplayName/);
  assert.match(portalHtml, /config\.mainDisplayName/);
  assert.match(portalHtml, /button\.textContent = title \+ ' खोलें'/);
});

test('Active exam workspace opens as a full-screen experience instead of rendering below the launch card', () => {
  assert.match(readFileSync(path.join(root, 'index.html'), 'utf8'), /body:has\(#portalExamWorkspace:not\(\.hidden\):not\(\[hidden\]\)\)/);
  assert.match(readFileSync(path.join(root, 'index.html'), 'utf8'), /#tab-quiz:has\(#portalExamWorkspace:not\(\.hidden\):not\(\[hidden\]\)\) > :not\(#portalExamWorkspace\)/);
  assert.match(readFileSync(path.join(root, 'index.html'), 'utf8'), /#portalExamWorkspace:not\(\.hidden\):not\(\[hidden\]\)\s*\{[\s\S]*?position:\s*fixed/);
});

test('Result verification uses the same complete results-and-scorecard title as the student journey', () => {
  assert.match(portalHtml, /id="resultVerificationHeading"[^>]*>🏆 परिणाम और स्कोरकार्ड<\/h2>/);
  assert.match(portalHtml, /#resultVerificationHeading\s*\{[\s\S]*?font-size:\s*clamp\(25px,\s*4vw,\s*34px\)/);
  assert.match(portalHtml, /id="journeyResults"[\s\S]*?परिणाम और स्कोरकार्ड/);
});
