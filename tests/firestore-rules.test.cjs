const { readFileSync } = require("node:fs");
const path = require("node:path");
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require("@firebase/rules-unit-testing");
const {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} = require("firebase/firestore");

const PROJECT_ID = "bishnoi-platform-rules-test";
const STUDENT = "student-test-uid";
const OWNER = "8YRBWWMKG2OUW6cmzZkGbFgOqyp2";
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8") },
  });
});

after(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "examConfig/current"), {
      mainStartAt: Timestamp.fromMillis(Date.now() - 60_000),
      mock1StartAt: Timestamp.fromMillis(Date.now() - 60_000),
      mock2StartAt: Timestamp.fromMillis(Date.now() - 60_000),
      quizStartAt: Timestamp.fromMillis(Date.now() - 60_000),
    });
    await setDoc(doc(db, "examEnrolledStudents", STUDENT), {
      uid: STUDENT,
      fullName: "परीक्षण विद्यार्थी",
      verificationStatus: "confirmed",
      rollNumber: "JAMBH-2026-00001",
    });
    await setDoc(doc(db, "examAnswerKeys/main/items/q1"), { correctAnswer: "A" });
    await setDoc(doc(db, "userNotifications", STUDENT, "items", "notice-1"), {
      recipientUid: STUDENT,
      title: "परीक्षण सूचना",
      message: "यह सूचना हटनी नहीं चाहिए।",
      type: "general",
      active: true,
    });
  });
});

test("student can create pending enrollment without roll number", async () => {
  const db = env.authenticatedContext("new-student").firestore();
  await assertSucceeds(setDoc(doc(db, "examEnrolledStudents/new-student"), {
    uid: "new-student",
    fullName: "नया विद्यार्थी",
    verificationStatus: "pending",
    createdAt: serverTimestamp(),
  }));
});

test("student cannot assign a roll number during enrollment creation", async () => {
  const db = env.authenticatedContext("spoof-student").firestore();
  await assertFails(setDoc(doc(db, "examEnrolledStudents/spoof-student"), {
    uid: "spoof-student",
    fullName: "गलत रोल",
    verificationStatus: "pending",
    rollNumber: "JAMBH-2026-99999",
  }));
});

test("editing enrollment preserves owner-assigned roll and approval", async () => {
  const db = env.authenticatedContext(STUDENT).firestore();
  await assertSucceeds(updateDoc(doc(db, "examEnrolledStudents", STUDENT), {
    fullName: "बदला हुआ नाम",
    updatedAt: serverTimestamp(),
  }));
  await assertFails(updateDoc(doc(db, "examEnrolledStudents", STUDENT), {
    rollNumber: "JAMBH-2026-00002",
  }));
  await assertFails(updateDoc(doc(db, "examEnrolledStudents", STUDENT), {
    verificationStatus: "pending",
  }));
});

test("student can submit a main exam before its deadline once it has started", async () => {
  const db = env.authenticatedContext(STUDENT).firestore();
  await assertSucceeds(setDoc(doc(db, "mainExamSubmissions", "attempt-early"), {
    uid: STUDENT,
    mode: "main",
    answers: { q1: "A" },
    submittedAt: serverTimestamp(),
  }));
});

test("student cannot read private answer keys", async () => {
  const db = env.authenticatedContext(STUDENT).firestore();
  await assertFails(getDoc(doc(db, "examAnswerKeys/main/items/q1")));
});

test("student can read but cannot delete their notification", async () => {
  const db = env.authenticatedContext(STUDENT).firestore();
  await assertSucceeds(getDoc(doc(db, "userNotifications", STUDENT, "items", "notice-1")));
  await assertFails(deleteDoc(doc(db, "userNotifications", STUDENT, "items", "notice-1")));
});

test("student can write their own notification read marker", async () => {
  const db = env.authenticatedContext(STUDENT).firestore();
  await assertSucceeds(setDoc(doc(db, "userNotificationReads", STUDENT, "items", "notice-1"), {
    read: true,
    readAt: serverTimestamp(),
  }));
});
