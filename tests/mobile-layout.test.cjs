const { readFileSync } = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { test } = require("node:test");

const root = path.join(__dirname, "..");
const html = readFileSync(path.join(root, "index.html"), "utf8");
const css = readFileSync(path.join(root, "style.css"), "utf8");

test("main website loads the shared stylesheet containing results and mobile layout fixes", () => {
  assert.match(html, /<link rel="stylesheet" href="\/style\.css"/);
  assert.match(css, /\.results-panel/);
  assert.match(css, /@media \(max-width: 640px\)/);
});

test("mobile layout constrains viewport overflow and flexible children", () => {
  assert.match(css, /overflow-x:\s*clip/);
  assert.match(css, /min-width:\s*0/);
  assert.match(css, /max-width:\s*100%/);
  assert.match(css, /safe-area-inset-bottom/);
});

test("five-tab bottom navigation keeps touch targets readable on narrow screens", () => {
  assert.match(css, /\.bnav-mobile/);
  assert.match(css, /grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/);
});
