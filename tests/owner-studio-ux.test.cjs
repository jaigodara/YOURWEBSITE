const { readFileSync } = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { test } = require("node:test");

const ownerStudio = readFileSync(path.join(__dirname, "..", "owner-studio.html"), "utf8");

test("Owner Studio provides real Excel, CSV, and JSON export actions", () => {
  assert.match(ownerStudio, /data-export-format="xlsx"[^>]*onclick="exportOwnerData\('xlsx'\)"/);
  assert.match(ownerStudio, /data-export-format="csv"[^>]*onclick="exportOwnerData\('csv'\)"/);
  assert.match(ownerStudio, /data-export-format="json"[^>]*onclick="exportOwnerData\('json'\)"/);
  assert.match(ownerStudio, /XLSX\.utils\.json_to_sheet/);
  assert.match(ownerStudio, /XLSX\.utils\.book_append_sheet/);
  assert.match(ownerStudio, /bishnoism-.*\.xlsx/);
});

test("opening the exam pane does not automatically reload student answer sheets", () => {
  const start = ownerStudio.indexOf("function switchStudioPane(paneId)");
  const end = ownerStudio.indexOf("async function refreshStudioAnalytics()", start);
  assert.ok(start >= 0 && end > start, "studio pane navigation function should exist");
  const navigation = ownerStudio.slice(start, end);
  assert.match(navigation, /if \(paneId === 'pane_exam'\)[\s\S]*loadExamSessionQueue\(\)/);
  assert.doesNotMatch(navigation, /loadExamSubmissions\(\)/,
    "answer sheets should load only after an explicit owner action");
});

test("changing the selected exam clears stale answer-sheet results", () => {
  assert.match(ownerStudio, /id="reviewSubmissionCollection"[\s\S]*?onchange="resetExamSubmissionQueue\(\)"/);
  assert.match(ownerStudio, /window\.resetExamSubmissionQueue = resetExamSubmissionQueue/);
  assert.match(ownerStudio, /चुने गए उत्तर-पत्र लाएँ/);
});


test("repeated submissions are distinguishable in the answer-sheet selector", () => {
  assert.match(ownerStudio, /row\.submittedAt \|\| row\.createdAt/);
  assert.match(ownerStudio, /toLocaleString\('hi-IN', \{ dateStyle: 'short', timeStyle: 'short' \}\)/);
  assert.match(ownerStudio, /ID ' \+ String\(row\.id\)\.slice\(0, 6\)/);
  assert.match(ownerStudio, /रिकॉर्ड ID: ' \+ String\(d\.id\)\.slice\(0, 10\)/);
});

test("Owner Studio has mobile touch targets and overflow safeguards", () => {
  assert.match(ownerStudio, /Owner Studio: readable, touch-friendly layout/);
  assert.match(ownerStudio, /@media \(max-width: 640px\)/);
  assert.match(ownerStudio, /#examSubmissionsList pre \{ white-space: pre-wrap; overflow-wrap: anywhere; \}/);
});


test("manual exam review can print a complete batch report with identity and review reason", () => {
  assert.match(ownerStudio, /onclick="printAllExamReviewSheets\(\)"/);
  assert.match(ownerStudio, /window\.printAllExamReviewSheets = printAllExamReviewSheets/);
  assert.match(ownerStudio, /विद्यार्थी का नाम|नाम:/);
  assert.match(ownerStudio, /जन्म तिथि/);
  assert.match(ownerStudio, /रोल नंबर/);
  assert.match(ownerStudio, /जाँच का कारण/);
  assert.match(ownerStudio, /window\.print\(\)/);
});

test("Owner Studio groups poll management with Literature and Media and removes its separate route", () => {
  assert.match(ownerStudio, /साहित्य \/ मीडिया एवं मतदान प्रबंधन/);
  assert.doesNotMatch(ownerStudio, /data-studio-page="polls"/);
  assert.match(ownerStudio, /media:\s*\{[\s\S]*?panels: \['ownerCommunityPollManager'\]/);
});

test("Re-entry decisions are one-time, persisted, and removed from the pending-request queue", () => {
  assert.match(ownerStudio, /lateEntryRequested: false/);
  assert.match(ownerStudio, /reentryDecision: status === 'active' \? 'approved' : status === 'denied' \? 'denied'/);
  assert.match(ownerStudio, /filter\(row => \['active', 'kicked', 'late_request'\]\.includes\(row\.status\)\)/);
  assert.match(ownerStudio, /if \(row\.status === 'late_request'\)/);
  assert.doesNotMatch(ownerStudio, /\['active', 'kicked', 'denied', 'late_request'\]/);
});


test("custom-exam answer sheets bypass fixed main/mock mode filters and display the selected custom exam name", () => {
  const start = ownerStudio.indexOf("async function loadExamSubmissions()");
  const end = ownerStudio.indexOf("async function printAdmitCard", start);
  assert.ok(start >= 0 && end > start, "answer-sheet loader should exist");
  const loader = ownerStudio.slice(start, end);
  assert.match(loader, /const selectedCustomExamId = document\.getElementById\('reviewCustomExamFilter'\)/);
  assert.match(loader, /const reviewLabel = selectedCustomExamId[\s\S]*?customExamLabel/);
  assert.match(loader, /if \(!selectedCustomExamId\) \{[\s\S]*?d\.mode !== 'main'/);
  assert.match(loader, /if \(queueStatus\) queueStatus\.textContent = reviewLabel/);
});

test("archive controls refresh their exam-specific label when the selected exam or configured display name changes", () => {
  assert.match(ownerStudio, /function handleArchiveExamModeChange\(\)/);
  assert.match(ownerStudio, /window\.handleArchiveExamModeChange\(\);/);
  assert.match(ownerStudio, /\['ownerMainDisplayName', 'ownerMock1DisplayName', 'ownerMock2DisplayName'\]/);
  assert.match(ownerStudio, /addEventListener\('input', \(\) => window\.handleArchiveExamModeChange\(\)\)/);
  assert.match(ownerStudio, /'🗄️ ' \+ label \+ ' का रिकॉर्ड सुरक्षित करें और सक्रिय सूची साफ करें'/);
});

test("successful exam archive refreshes saved visibility, selected queue, session monitor and analytics", () => {
  const start = ownerStudio.indexOf("async function archiveCompletedExamWorkflow()");
  const end = ownerStudio.indexOf("window.archiveCompletedExamWorkflow = archiveCompletedExamWorkflow;", start);
  assert.ok(start >= 0 && end > start);
  const workflow = ownerStudio.slice(start, end);
  assert.match(workflow, /loadExamVisibilitySettings\(\)/);
  assert.match(workflow, /loadExamSessionQueue\(\)/);
  assert.match(workflow, /refreshStudioAnalytics\(\)/);
  assert.match(workflow, /reviewExamModeFilter/);
  assert.match(workflow, /reviewCustomExamFilter/);
  assert.match(workflow, /सक्रिय उत्तर-पत्र सूची खाली करके रिफ्रेश की गई है/);
});

test('Saved exam display names update the archive action after Firestore settings load', () => {
  const start = ownerStudio.indexOf('function loadExamVisibilitySettings');
  const end = ownerStudio.indexOf('async function createManualEnrollment', start);
  assert.ok(start >= 0 && end > start);
  const loader = ownerStudio.slice(start, end);
  assert.match(loader, /ownerMainStartLabel/);
  assert.match(loader, /window\.handleArchiveExamModeChange\?\.\(\)/);
});
