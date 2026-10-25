const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

test('admit card generator creates a short-lived QR token and keeps fallback behavior', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'owner-studio.html'), 'utf8');
  const start = html.indexOf('async function printAdmitCard(d)');
  const end = html.indexOf('async function assignRealEnrollmentRoll', start);
  assert.notEqual(start, -1);
  const body = html.slice(start, end);
  assert.ok(body.includes('publicAdmitCardVerifications'));
  assert.ok(body.includes('new Uint8Array(24)'));
  assert.ok(body.includes('new QRCode'));
  assert.ok(body.includes('verify-admit-card.html?token='));
  assert.ok(body.includes('QR सत्यापन उपलब्ध नहीं'));
});

test('verification page shows only roll number and exam title, never student contact fields', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'verify-admit-card.html'), 'utf8');
  assert.ok(html.includes('publicAdmitCardVerifications'));
  assert.ok(html.includes('verifyRoll'));
  assert.ok(html.includes('verifyExam'));
  assert.ok(html.includes('expiresAt'));
  assert.ok(!html.includes('verifyPhone'));
  assert.ok(!html.includes('verifyEmail'));
  assert.ok(!html.includes('verifyName'));
});
