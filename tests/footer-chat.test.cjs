
const { readFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const html = readFileSync(path.join(root, 'index.html'), 'utf8');
const script = readFileSync(path.join(root, 'script.js'), 'utf8');
const rules = readFileSync(path.join(root, 'firestore.rules'), 'utf8');

test('Professional site footer includes feedback, contact, community chat and 2026 copyright', () => {
  assert.match(html, /class="bx-site-footer/);
  assert.match(html, /openFeedback\(\)/);
  assert.match(html, /openContact\(\)/);
  assert.match(html, /openCommunityChat\(\)/);
  assert.match(html, /© 2026 Bishnoism Digital Platform/);
});

test('Contact form submits to the existing owner-reviewed feedback workflow', () => {
  assert.match(html, /id="bxContactForm"/);
  assert.match(script, /window\.BishnoiCommunity\.submitContact = async function/);
  assert.match(script, /collection\('communityFeedback'\)\.add\(/);
  assert.match(script, /\[संपर्क: /);
  assert.match(rules, /match \/communityFeedback\/[\s\S]*allow read: if owner\(\)/);
});

test('Community chat retains reactions, replies and moderation with the new chat styling', () => {
  assert.match(html, /bishnoism-footer-chat-polish/);
  assert.match(script, /bx-chat-message-mine/);
  assert.match(script, /bx-chat-message-other/);
  for (const action of ['data-community-reaction', 'data-focus-reply', 'data-community-replies-toggle', 'data-delete-community-post', 'data-block-community-user']) {
    assert.ok(script.includes(action), 'chat action retained: ' + action);
  }
});

test('Feedback and contact shortcuts use the existing website session and community chat route', () => {
  assert.match(script, /if \(!state\.user\) \{ window\.BishnoiAuth\?\.openAuthModal/);
  assert.match(script, /window\.switchTab\?\.\('community'\)/);
  assert.match(script, /window\.BishnoismSite\.closeContact/);
});
