const { readFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const script = readFileSync(path.join(root, 'script.js'), 'utf8');
const index = readFileSync(path.join(root, 'index.html'), 'utf8');
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

test('Community renders like/dislike controls and expandable response counts inside one conversation stream', () => {
  assert.match(script, /data-community-reaction="like"/);
  assert.match(script, /data-community-reaction="dislike"/);
  assert.match(script, /data-focus-reply/);
  assert.match(script, /data-reply-count>0/);
  assert.doesNotMatch(script, /👍 Like <span data-reaction-count>|👎 Dislike <span data-reaction-count>/);
  assert.match(script, /data-community-replies-toggle/);
  assert.match(script, /data-reply-count/);
  assert.match(script, /host\.dataset\.expanded = 'true'/);
  assert.match(script, /window\.renderCommunityPolls\?\.\(window\.__communityPollsCache/);
  assert.match(index, /id="communityPollFeed"/);
  assert.doesNotMatch(index, /id="communityPollSection"/);
});


test('Community feedback uses an accessible modern composer and reports submission state', () => {
  assert.match(index, /id="communityFeedbackComposer"/);
  assert.match(index, /id="communityFeedbackCount"/);
  assert.match(index, /id="communityFeedbackStatus"[^>]*role="status"/);
  assert.match(index, /प्रतिक्रिया भेजें/);
  assert.match(script, /window\.BishnoiCommunity\.submitFeedback = async function/);
  assert.match(script, /धन्यवाद! आपका सुझाव मंच प्रबंधन टीम तक पहुँच गया है।/);
  assert.match(script, /communityFeedbackCount/);
});

test('Community polls are rendered inside the shared chat feed as conversation messages, without an empty standalone poll section', () => {
  assert.match(script, /const pollMount = '<div id="communityPollFeed"/);
  assert.match(script, /bx-chat-message bx-chat-message-other w-full rounded-xl border/);
  assert.match(script, /const activePolls = .*filter\(poll => poll\.active !== false\)/);
  assert.doesNotMatch(script, /अभी कोई मतदान उपलब्ध नहीं है/);
});
