const { readFileSync } = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { test } = require("node:test");

const root = path.join(__dirname, "..");
const script = readFileSync(path.join(root, "script.js"), "utf8");
const rules = readFileSync(path.join(root, "firestore.rules"), "utf8");

const sessionFunctionStart = script.indexOf("function updateExamSession(status, extra = {})");
const sessionFunctionEnd = script.indexOf("\n  function attachExamSessionListener()", sessionFunctionStart);
const sessionFunction = script.slice(sessionFunctionStart, sessionFunctionEnd);
const rulesStart = rules.indexOf("match /examSessions/{sessionId} {");
const rulesEnd = rules.indexOf("match /admitCards/{cardId}", rulesStart);
const sessionRules = rules.slice(rulesStart, rulesEnd);

test("exam progress updates do not rewrite the immutable scheduled endAt", () => {
  assert.ok(sessionFunctionStart >= 0, "updateExamSession must exist");
  assert.match(sessionFunction, /return ref\.get\(\)\.then\(snapshot =>/);
  assert.match(sessionFunction, /if \(!snapshot\.exists\) \{/);
  assert.match(sessionFunction, /delete payload\.endAt/);
  assert.match(sessionFunction, /status !== 'active' && status !== 'late_request'/);
  assert.doesNotMatch(sessionFunction, /endAt:\s*Number\(exam\.endAt\)/,
    "endAt must not be included in every progress update");
});

test("student session access is limited to their own supported session IDs", () => {
  assert.match(sessionRules, /sessionId\.matches\([\s\S]*quiz\|mock1\|mock2\|main/);
  assert.match(sessionRules, /allow read: if examOwner\(\)[\s\S]*isOwnSession\(\)/);
  assert.match(sessionRules, /request\.resource\.data\.get\('uid', ''\) == request\.auth\.uid/);
  assert.match(sessionRules, /request\.resource\.data\.get\('mode', ''\) == resource\.data\.get\('mode', ''\)/);
  assert.match(sessionRules, /request\.resource\.data\.get\('endAt', null\) == resource\.data\.get\('endAt', null\)/);
});

test("student updates cannot self-unlock a kicked exam session", () => {
  assert.match(sessionRules, /request\.resource\.data\.get\('status', ''\) == 'active'[\s\S]*resource\.data\.get\('status', ''\) == 'active'/);
  assert.match(sessionRules, /allow delete: if examOwner\(\)/);
});
