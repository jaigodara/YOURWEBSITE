const { readFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const owner = readFileSync(path.join(root, 'owner-studio.html'), 'utf8');
const portal = readFileSync(path.join(root, 'exam-portal.html'), 'utf8');

test('Custom exam schedule is saved by Owner Studio and enforced by the student portal', () => {
  assert.match(owner, /ownerCustomExamStartAt/);
  assert.match(owner, /ownerCustomExamEndAt/);
  assert.match(owner, /Timestamp\.fromDate\(startDate\)/);
  assert.match(owner, /endDate <= startDate/);
  assert.match(portal, /toScheduleDate\(e\.startAt\)/);
  assert.match(portal, /toScheduleDate\(e\.endAt\)/);
  assert.match(portal, /btn\.disabled=scheduled/);
  assert.match(portal, /इस परीक्षा की निर्धारित अवधि समाप्त हो चुकी है/);
});
