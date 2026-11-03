const { readFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const root = path.join(__dirname, '..');
const index = readFileSync(path.join(root, 'index.html'), 'utf8');
const script = readFileSync(path.join(root, 'script.js'), 'utf8');

test('Personal published results are queried for the signed-in UID and need no second identity form', () => {
  assert.match(script, /publishedResults'\)\.where\('uid', '==', state\.user\.uid\)/);
  assert.match(script, /const scoreVisible = true;/);
  assert.doesNotMatch(index, /resultLookupRoll|resultLookupName|resultLookupDob|verifyMyResultIdentity/);
  assert.doesNotMatch(script, /verifyMyResultIdentity|resultsIdentityVerified/);
});

test('Firebase Auth requests local persistence before Google/email sign-in', () => {
  assert.match(script, /setPersistence\(firebase\.auth\.Auth\.Persistence\.LOCAL\)/);
  assert.match(script, /async function signInWithGoogleCredential\(\)\s*\{\s*await window\.__bishnoiAuthPersistenceReady/);
  assert.match(script, /await window\.__bishnoiAuthPersistenceReady;\s*await state\.auth\.signInWithEmailAndPassword/);
});
