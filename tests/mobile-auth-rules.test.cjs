const { readFileSync } = require("node:fs");
const path = require("node:path");
const { before, after, beforeEach, test } = require("node:test");
const assert = require("node:assert/strict");
const { initializeTestEnvironment, assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { doc, getDoc, setDoc, updateDoc } = require("firebase/firestore");

const rules = readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8");
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "bishnoi-mobile-auth-rules-test",
    firestore: { rules }
  });
});

after(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

function googleContext(uid) {
  return env.authenticatedContext(uid, {
    firebase: { identities: { "google.com": ["google-test-id"] }, sign_in_provider: "google.com" }
  });
}

test("duplicate mobileIndex creation is denied and only the indexed owner can read it", async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "mobileIndex/9876543210"), { uid: "first-student" });
  });
  const second = googleContext("second-student").firestore();
  await assertFails(setDoc(doc(second, "mobileIndex/9876543210"), { uid: "second-student" }));
  await assertFails(getDoc(doc(second, "mobileIndex/9876543210")));
  await assertSucceeds(getDoc(doc(googleContext("first-student").firestore(), "mobileIndex/9876543210")));
});

test("an unverified student cannot create an exam enrollment", async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "users/unverified-student"), {
      uid: "unverified-student",
      mobile: "9876543210",
      gmailVerified: false
    });
  });
  const db = googleContext("unverified-student").firestore();
  await assertFails(setDoc(doc(db, "examEnrolledStudents/unverified-student"), {
    uid: "unverified-student",
    fullName: "Test Student",
    mobile: "9876543210",
    verificationStatus: "pending"
  }));
});

test("students cannot change an existing mobile or gmailVerified value", async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "users/student-one"), {
      uid: "student-one",
      mobile: "9876543210",
      gmailVerified: true,
      fullName: "Student One"
    });
  });
  const db = googleContext("student-one").firestore();
  await assertFails(updateDoc(doc(db, "users/student-one"), { mobile: "9123456789" }));
  await assertFails(updateDoc(doc(db, "users/student-one"), { gmailVerified: false }));
});

test("a student cannot read another student's user document or mobile index", async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "users/other-student"), {
      uid: "other-student",
      mobile: "9876543210",
      gmailVerified: true
    });
    await setDoc(doc(context.firestore(), "mobileIndex/9876543210"), { uid: "other-student" });
  });
  const db = googleContext("requesting-student").firestore();
  await assertFails(getDoc(doc(db, "users/other-student")));
  await assertFails(getDoc(doc(db, "mobileIndex/9876543210")));
});
