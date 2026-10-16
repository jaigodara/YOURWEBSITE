const { readFileSync } = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { test } = require("node:test");

const root = path.join(__dirname, "..");
const script = readFileSync(path.join(root, "script.js"), "utf8");

test("script.js assigns window.switchTab exactly once", () => {
  assert.equal((script.match(/window\\.switchTab\\s*=/g) || []).length, 1);
});

test("inline auth/profile handlers are preserved in both HTML files", () => {
  const html = ["index.html", "owner-studio.html"].map(file => readFileSync(path.join(root, file), "utf8")).join("\\n");
  const onclicks = [...html.matchAll(/onclick\\s*=\\s*["']([^"']+)["']/gi)].map(match => match[1]);
  assert.ok(onclicks.some(value => value.includes("BishnoiAuth.openAuthModal")));
  assert.ok(onclicks.some(value => value.includes("BishnoiApp.openProfileOrAuth")));
  assert.ok(script.indexOf("window.BishnoiAuth = window.BishnoiAuth || {};") < script.indexOf("(function exposeEarlyNavigation"));
  assert.ok(script.indexOf("window.BishnoiApp = window.BishnoiApp || {};") < script.indexOf("(function exposeEarlyNavigation"));
  assert.match(script, /window\\.BishnoiAuth\\.openAuthModal = function/);
  assert.match(script, /window\\.BishnoiApp\\.openProfileOrAuth = function/);
});
