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
  assert.match(ownerHtml, /Math\.floor\(500 \/ writesPerQuestion\)/);
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
