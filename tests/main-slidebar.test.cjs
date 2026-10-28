const { readFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const html = readFileSync(path.join(root, 'index.html'), 'utf8');
const js = readFileSync(path.join(root, 'main-slidebar.js'), 'utf8');
const css = readFileSync(path.join(root, 'slidebar.css'), 'utf8');
const script = readFileSync(path.join(root, 'script.js'), 'utf8');
const ownerHtml = readFileSync(path.join(root, 'owner-studio.html'), 'utf8');

test('Main slidebar is wired without replacing the five core bottom tabs', () => {
  for (const id of ['bnav-home', 'bnav-library', 'bnav-quiz', 'bnav-community', 'bnav-profile']) {
    assert.ok(html.includes('id="' + id + '"'), 'core bottom tab must remain: ' + id);
  }
  assert.match(html, /href="slidebar\.css"/);
  assert.match(html, /<script src="main-slidebar\.js(?:\?[^"]*)?"><\/script>/);
  assert.match(js, /id = 'mainSlidebarTrigger'/);
  assert.match(js, /window\.toggleMainSlidebar = function \(open\)/);
  assert.doesNotMatch(html, /id="ownerStudioPortalBtn"/);
  assert.doesNotMatch(html, /data-language-toggle/);
});

test('Slidebar actions point to existing site controls and support keyboard close', () => {
  for (const action of ['mala', 'amavasya', 'language', 'owner-studio', 'literature', 'map', 'notifications']) {
    assert.ok(js.includes('data-drawer-action="' + action + '"'), 'missing drawer action: ' + action);
  }
  assert.match(js, /event\.key === 'Escape'/);
  assert.match(js, /aria-hidden/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(js, /window\.BishnoismLanguage\?\.set/);
  assert.match(readFileSync(path.join(root, 'style.css'), 'utf8'), /#mainDailyQuizCta/);
  assert.match(ownerHtml, /owner-studio-mobile-ux/);
});

test('Digital Jap Mala persists an offline daily goal and updates progress', () => {
  assert.ok(html.includes('id="malaDailyGoalInput"'));
  assert.ok(html.includes('id="malaDailyGoalProgress"'));
  assert.match(script, /dailyCount/);
  assert.match(script, /dailyGoal/);
  assert.match(script, /window\.BishnoiApp\.setMalaDailyGoal = window\.setMalaDailyGoal = function/);
  assert.match(script, /localStorage\.setItem\('bishnoi_mala_v2'/);
  assert.match(script, /navigator\.vibrate/);
});

test('Literature search filters PDF, media, and Niyam cards from one search field', () => {
  assert.ok(html.includes('id="literatureSearchInput"'));
  assert.ok(html.includes('id="literatureSearchStatus"'));
  assert.match(script, /app\.searchLiterature = function/);
  assert.match(script, /id: 'pdfGrid'/);
  assert.match(script, /id: 'platformMediaFeed'/);
  assert.match(script, /id: 'niyamGrid'/);
});

test('Literature bookmarks persist locally and render in the profile panel', () => {
  assert.ok(html.includes('id="savedLiteratureBookmarks"'));
  assert.match(script, /bishnoi_literature_bookmarks_v1/);
  assert.match(script, /data-literature-bookmark-toggle/);
  assert.match(script, /data-remove-literature-bookmark/);
  assert.match(script, /function renderLiteratureBookmarks/);
});

test('Owner Studio shortcut is visible and exam settings save to the live config document', () => {
  assert.match(js, /id="drawerOwnerStudioLink"[^>]*data-drawer-action="owner-studio"/);
  assert.match(js, /<strong>Owner Studio<\/strong><small>Dharmveer Godara/);
  assert.doesNotMatch(js, /id="drawerOwnerStudioLink"[^>]*\shidden(?:\s|>)/);
  assert.match(ownerHtml, /window\.saveExamVisibilitySettings = saveExamVisibilitySettings/);
  assert.match(ownerHtml, /await configRef\.set\(config, \{ merge: true \}\)/);
  assert.match(ownerHtml, /randomizeSets: !!document\.getElementById\('ownerRandomizeSets'\)\?\.checked/);
  assert.match(ownerHtml, /ownerExamVisibilitySaveStatus/);
});
