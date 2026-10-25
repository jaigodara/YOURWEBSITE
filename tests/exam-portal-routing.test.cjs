const { readFileSync } = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { test } = require("node:test");

const root = path.join(__dirname, "..");
const indexHtml = readFileSync(path.join(root, "index.html"), "utf8");
const portalHtml = readFileSync(path.join(root, "exam-portal.html"), "utf8");
const ownerHtml = readFileSync(path.join(root, "owner-studio.html"), "utf8");

test("exam portal embed mode is set before page styles and selects the requested section", () => {
  const routeScript = indexHtml.indexOf("new URLSearchParams(window.location.search).get('examEmbed')");
  const firstStyles = indexHtml.indexOf("<style>");
  assert.ok(routeScript > 0 && routeScript < firstStyles, "embed mode must be set before CSS evaluates");
  for (const mode of ["main", "mock1", "mock2", "enrollment", "results"]) {
    assert.ok(indexHtml.includes(`data-exam-embed="${mode}"`) || indexHtml.includes("setAttribute('data-exam-embed', mode)"),
      `embed routing should support ${mode}`);
    assert.ok(portalHtml.includes(`data-launch-exam="${mode}"`), `portal should expose ${mode}`);
  }
});

test("portal navigation opens the selected section even before login; exam start remains guarded in the app", () => {
  const launchHandler = portalHtml.slice(portalHtml.indexOf('document.querySelectorAll("[data-launch-exam]")'));
 assert.ok(
  launchHandler.includes('examFrame.src = "./index.html?examEmbed=" + encodeURIComponent(mode)'),
  "portal should load the requested exam section"
);
  assert.ok(launchHandler.includes("Always open the requested section"));
  assert.ok(launchHandler.includes('examFrame.src = "./index.html?examEmbed="'));
  assert.ok(!launchHandler.includes("if (!auth.currentUser"));
  // Invalid modes and future scheduled exams intentionally return early;
  // authentication must not block opening the selected portal section.
  assert.ok(launchHandler.includes("if (!examTitles[mode]) return;"));
  assert.ok(launchHandler.includes("toScheduleDate(value)"));
  assert.ok(launchHandler.includes("date.getTime()>Date.now()){setPortalStatus"));
  assert.ok(!/if\s*\(!auth\.currentUser[^\n]*return;/.test(launchHandler));
});

test("exam schedule changes only publish notifications after explicit owner opt-in", () => {
  assert.match(ownerHtml, /id="ownerPublishExamNotifications" type="checkbox"/);
  assert.match(ownerHtml, /const publishNotifications = document\.getElementById\('ownerPublishExamNotifications'\)\?\.checked === true/);
  assert.match(ownerHtml, /if \(publishNotifications\) for \(const \[title, message\] of notices\)/);
  assert.match(ownerHtml, /if \(publishNotifications\) for \(const \[mode, startAt, oldStartAt, title, body\] of startEvents\)/);
  assert.match(ownerHtml, /publishControl\.checked = false/);
});
