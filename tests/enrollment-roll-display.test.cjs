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

test("approved students can download their admit card as soon as a valid roll is assigned", () => {
  assert.ok(script.includes("if (status === 'confirmed' && roll) {"));
  assert.ok(script.includes("if (record.verificationStatus !== 'confirmed' ||"));
  assert.ok(script.includes("!/^JAMBH-2026-\\d{5}$/.test(String(record.rollNumber || ''))"));
  assert.ok(script.includes("if (hasValidRoll) {\n      const button = document.createElement('button');\n      button.id = 'downloadAdmitCardButton';"));
  assert.ok(!script.includes("notify('प्रवेश-पत्र अभी जारी नहीं हुआ है।', 'error');"));
});

test("owner approval assigns unique JAMBH rolls with at least four digits", () => {
  assert.ok(owner.includes("if (/^JAMBH-2026-\\d{4,}$/.test(current)) return current;"));
  assert.ok(owner.includes("const rollNumber = 'JAMBH-2026-' + String(next).padStart(4, '0');"));
  assert.ok(owner.includes("db.runTransaction(async tx =>"));
});
