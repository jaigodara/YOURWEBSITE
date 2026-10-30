const { readFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const script = readFileSync(path.join(root, 'script.js'), 'utf8');
const rules = readFileSync(path.join(root, 'firestore.rules'), 'utf8');

test('Community supports authenticated replies with owner-or-author deletion', () => {
  assert.match(script, /BishnoiCommunity\.submitReply/);
  assert.match(script, /BishnoiCommunity\.deleteReply/);
  assert.match(script, /data-community-reply-form/);
  assert.match(script, /data-community-replies/);
  assert.match(rules, /match \/replies\/\{replyId\}/);
  assert.match(rules, /communityUserNotBlocked\(request\.auth\.uid\)/);
  assert.match(rules, /resource\.data\.get\('uid', ''\) == request\.auth\.uid/);
  assert.match(rules, /request\.resource\.data\.body\.size\(\) <= 500/);
});

test('Community replies obey global and section maintenance locks', () => {
  const replyStart = script.indexOf('window.BishnoiCommunity.submitReply = async function');
  const replyEnd = script.indexOf('window.BishnoiCommunity.deleteReply = async function', replyStart);
  const replyHandler = script.slice(replyStart, replyEnd);
  assert.ok(replyStart >= 0 && replyEnd > replyStart);
  assert.match(replyHandler, /globalMode/);
  assert.match(replyHandler, /globalBlocked/);
  assert.match(replyHandler, /mode === 'posting_only' \|\| mode === 'both'/);
});
