const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const assert = require("node:assert/strict");

const script = readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
const owner = readFileSync(path.join(__dirname, "..", "owner-studio.html"), "utf8");

test("student view never displays the internal BIS identifier as a roll number", () => {
  assert.ok(script.includes("const storedRoll = String(record.rollNumber || '').trim();"));
  assert.ok(script.includes("const roll = /^JAMBH-2026-\\d{4,}$/.test(storedRoll) ? storedRoll : '';"));
});

test("admit-card download requires confirmed approval, a five-digit roll, and release", () => {
  const functionStart = script.indexOf("async function printStudentAdmitCard(record)");
  assert.notEqual(functionStart, -1, "admit-card download function should exist");
  const bodyStart = script.indexOf("{", functionStart);
  let depth = 0;
  let bodyEnd = -1;
  for (let i = bodyStart; i < script.length; i += 1) {
    if (script[i] === "{") depth += 1;
    if (script[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        bodyEnd = i + 1;
        break;
      }
    }
  }
  assert.notEqual(bodyEnd, -1, "admit-card download function should be complete");
  const body = script.slice(functionStart, bodyEnd);
  assert.match(body, /record\.verificationStatus\s*!==\s*['"]confirmed['"]/);
  assert.match(body, /JAMBH-2026-\\d\{5\}/);
  assert.match(body, /admitCardReleased\s*===\s*true/);
  assert.match(body, /अभी जारी नहीं हुआ/);
});
test("owner approval assigns unique JAMBH rolls with at least four digits", () => {
  assert.ok(owner.includes("if (/^JAMBH-2026-\\d{4,}$/.test(current)) return current;"));
  assert.ok(owner.includes("const rollNumber = 'JAMBH-2026-' + String(next).padStart(4, '0');"));
  assert.ok(owner.includes("db.runTransaction(async tx =>"));
});
