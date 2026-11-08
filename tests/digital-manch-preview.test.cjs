const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const assert = require("node:assert/strict");

const html = readFileSync(path.join(__dirname, "..", "digital-manch-preview.html"), "utf8");

test("digital manch preview includes the four requested destinations", () => {
  for (const id of ["tab-home", "tab-literature", "tab-exams", "tab-community"]) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  assert.match(html, /data-tab="home"/);
  assert.match(html, /data-tab="literature"/);
  assert.match(html, /data-tab="exams"/);
  assert.match(html, /data-tab="community"/);
});

test("all inline JavaScript blocks parse without syntax errors", () => {
  const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))
    .map((match) => match[1])
    .filter((source) => source.trim());
  assert.ok(scripts.length >= 2);
  scripts.forEach((source, index) => {
    assert.doesNotThrow(() => new vm.Script(source), "inline script " + index + " should parse");
  });
});

test("29 Niyam search renders a 29-item data set without inventing missing scripture", () => {
  assert.match(html, /for\(var ni=4;ni<=29;ni\+\+\)/);
  assert.match(html, /जीव दया पालणी/);
  assert.match(html, /रूंख लीलो नी घावै/);
  assert.match(html, /प्रमाणित नाम और विवरण आधिकारिक सूची से जोड़ें/);
  assert.match(html, /id="niyamSearch"/);
});

test("Regex bulk uploader default pattern parses a complete question row", () => {
  const match = html.match(/<textarea id="bulkRegex"[^>]*>([\s\S]*?)<\/textarea>/);
  assert.ok(match, "bulk uploader regex field should exist");
  const pattern = match[1].trim();
  const regex = new RegExp(pattern, "u");
  const parsed = "गुरु जम्भेश्वर भगवान का जन्म स्थान? | पीपासर | मुकाम | समराथल | जाम्भा | A".match(regex);
  assert.ok(parsed && parsed.groups);
  assert.equal(parsed.groups.answer, "A");
  assert.equal(parsed.groups.question.trim(), "गुरु जम्भेश्वर भगवान का जन्म स्थान?");
});

test("Owner Studio preview includes all four tools and labels demo-only actions", () => {
  for (const term of ["परीक्षा नियंत्रण", "Regex bulk question uploader", "Poll creator", "Broadcast"]) {
    assert.ok(html.includes(term), "missing Owner Studio feature: " + term);
  }
  assert.match(html, /यह केवल UI डेमो है/);
  assert.match(html, /कोई notification नहीं भेजी गई/);
  assert.match(html, /पाँच बार टैप/);
});
