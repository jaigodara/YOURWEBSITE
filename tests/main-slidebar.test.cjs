const { readFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const html = readFileSync(path.join(root, 'index.html'), 'utf8');
const js = readFileSync(path.join(root, 'main-slidebar.js'), 'utf8');
const css = readFileSync(path.join(root, 'slidebar.css'), 'utf8');
const script = readFileSync(path.join(root, 'script.js'), 'utf8');

test('Main slidebar is wired without replacing the five core bottom tabs', () => {
  for (const id of ['bnav-home', 'bnav-library', 'bnav-quiz', 'bnav-community', 'bnav-profile']) {
    assert.ok(html.includes('id="' + id + '"'), 'core bottom tab must remain: ' + id);
  }
  assert.match(html, /href="slidebar\.css"/);
  assert.match(html, /<script src="main-slidebar\.js"><\/script>/);
  assert.match(js, /id = 'mainSlidebarTrigger'/);
  assert.match(js, /window\.toggleMainSlidebar = function \(open\)/);
});

test('Slidebar actions point to existing site controls and support keyboard close', () => {
  for (const action of ['mala', 'amavasya', 'language', 'literature', 'map', 'notifications']) {
    assert.ok(js.includes('data-drawer-action="' + action + '"'), 'missing drawer action: ' + action);
  }
  assert.match(js, /event\.key === 'Escape'/);
  assert.match(js, /aria-hidden/);
  assert.match(css, /prefers-reduced-motion/);
});

test('Digital Jap Mala persists an offline daily goal and updates progress', () => {
  assert.ok(html.includes('id="malaDailyGoalInput"'));
  assert.ok(html.includes('id="malaDailyGoalProgress"'));
  assert.match(script, /dailyCount/);
  assert.match(script, /dailyGoal/);
  assert.match(script, /window\.setMalaDailyGoal = function/);
  assert.match(script, /localStorage\.setItem\('bishnoi_mala_v2'/);
  assert.match(script, /navigator\.vibrate/);
});
