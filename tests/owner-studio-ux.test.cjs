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
  const end = ownerStudio.indexOf("\n    async function refreshStudioAnalytics()", start);
  assert.ok(start >= 0 && end > start, "studio pane navigation function should exist");
  const navigation = ownerStudio.slice(start, end);
  assert.match(navigation, /if \(paneId === 'pane_exam'\)[\s\S]*loadExamSessionQueue\(\)/);
  assert.doesNotMatch(navigation, /loadExamSubmissions\(\)/,
    "answer sheets should load only after an explicit owner action");
});

test("changing the selected exam clears stale answer-sheet results", () => {
  assert.match(ownerStudio, /id="reviewSubmissionCollection" onchange="resetExamSubmissionQueue\(\)"/);
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
