const { readFileSync } = require("node:fs");
const assert = require("node:assert/strict");
const { test } = require("node:test");
const path = require("node:path");
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require("@firebase/rules-unit-testing");
const {
  doc, setDoc, updateDoc, getDoc, deleteDoc, serverTimestamp, Timestamp,
} = require("firebase/firestore");

const PROJECT_ID = "bishnoi-platform-rules-test";
const STUDENT = "student-test-uid";
const OWNER = "8YRBWWMKG2OUW6cmzZkGbFgOqyp2";

test("Firestore security rules regression suite", async (t) => {
  const env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8") },
  });

  async function reset() {
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
        uid: STUDENT, fullName: "परीक्षण विद्यार्थी",
        verificationStatus: "confirmed", rollNumber: "JAMBH-2026-00001",
      });
      await setDoc(doc(db, "examAnswerKeys/main/items/q1"), { correctAnswer: "A" });
      await setDoc(doc(db, "userNotifications", STUDENT, "items", "notice-1"), {
        recipientUid: STUDENT, title: "परीक्षण सूचना",
        message: "यह सूचना हटनी नहीं चाहिए।", type: "general", active: true,
      });
    });
  }

  try {
    await t.test("सूचना सूची का render call JavaScript comment में नहीं दबा है", async () => {
      const source = readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
      const lines = source.split(/\r?\n/);
      const commentIndex = lines.findIndex(line => line.includes("Keep read notifications as history"));
      assert.ok(commentIndex >= 0, "notification render comment should exist");
      assert.doesNotMatch(lines[commentIndex], /renderNotificationCards/);
      const nextCodeLine = lines.slice(commentIndex + 1).find(line => line.trim() && !line.trim().startsWith("//")) || "";
      assert.match(nextCodeLine, /^\s*renderNotificationCards\(/);
    });

    await t.test("विद्यार्थी बिना रोल नंबर के pending enrollment बना सकता है", async () => {
      await reset();
      const db = env.authenticatedContext("new-student").firestore();
      await assertSucceeds(setDoc(doc(db, "examEnrolledStudents/new-student"), {
        uid: "new-student", fullName: "नया विद्यार्थी",
        verificationStatus: "pending", createdAt: serverTimestamp(),
      }));
    });

    await t.test("विद्यार्थी enrollment बनाते समय roll number नहीं दे सकता", async () => {
      await reset();
      const db = env.authenticatedContext("spoof-student").firestore();
      await assertFails(setDoc(doc(db, "examEnrolledStudents/spoof-student"), {
        uid: "spoof-student", fullName: "गलत रोल",
        verificationStatus: "pending", rollNumber: "JAMBH-2026-99999",
      }));
    });

    await t.test("विद्यार्थी edit में owner का roll और approval नहीं बदल सकता", async () => {
      await reset();
      const db = env.authenticatedContext(STUDENT).firestore();
      await assertSucceeds(updateDoc(doc(db, "examEnrolledStudents", STUDENT), {
        fullName: "बदला हुआ नाम", updatedAt: serverTimestamp(),
      }));
      await assertFails(updateDoc(doc(db, "examEnrolledStudents", STUDENT), { rollNumber: "JAMBH-2026-00002" }));
      await assertFails(updateDoc(doc(db, "examEnrolledStudents", STUDENT), { verificationStatus: "pending" }));
      const afterResubmit = await getDoc(doc(db, "examEnrolledStudents", STUDENT));
      if (afterResubmit.data().rollNumber !== "JAMBH-2026-00001" || afterResubmit.data().verificationStatus !== "confirmed") {
        throw new Error("Enrollment resubmission changed owner-assigned roll/approval.");
      }
    });

    await t.test("विद्यार्थी स्वयं प्रवेश-पत्र रिलीज़ स्थिति नहीं बदल सकता", async () => {
      await reset();
      const db = env.authenticatedContext(STUDENT).firestore();
      await assertFails(updateDoc(doc(db, "examEnrolledStudents", STUDENT), {
        admitCardReleased: true, admitCardReleasedAt: serverTimestamp(),
      }));
    });

    await t.test("Owner विद्यार्थी के लिए प्रवेश-पत्र रिलीज़ स्थिति सहेज सकता है", async () => {
      await reset();
      const db = env.authenticatedContext(OWNER).firestore();
      await assertSucceeds(updateDoc(doc(db, "examEnrolledStudents", STUDENT), {
        admitCardReleased: true, admitCardReleasedAt: serverTimestamp(),
      }));
    });

    await t.test("Owner पिन की गई निजी प्रवेश-पत्र सूचना बना सकता है", async () => {
      await reset();
      const db = env.authenticatedContext(OWNER).firestore();
      await assertSucceeds(setDoc(doc(db, "userNotifications", STUDENT, "items", "admit-card-main"), {
        recipientUid: STUDENT, title: "🎟️ प्रवेश-पत्र जारी हो गया",
        message: "JAMBH-2026-00001 का प्रवेश-पत्र उपलब्ध है।",
        type: "admit-card", important: true, pinnedByOwner: true,
        active: true, audience: "private", createdBy: OWNER, createdAt: serverTimestamp(),
      }));
    });

    await t.test("परीक्षा शुरू होने के बाद deadline से पहले main submission स्वीकार होता है", async () => {
      await reset();
      const db = env.authenticatedContext(STUDENT).firestore();
      await assertSucceeds(setDoc(doc(db, "mainExamSubmissions/attempt-early"), {
        uid: STUDENT, mode: "main", answers: { q1: "A" }, submittedAt: serverTimestamp(),
      }));
    });

    await t.test("विद्यार्थी private answer key नहीं पढ़ सकता", async () => {
      await reset();
      const db = env.authenticatedContext(STUDENT).firestore();
      await assertFails(getDoc(doc(db, "examAnswerKeys/main/items/q1")));
    });

    await t.test("विद्यार्थी notification पढ़ सकता है लेकिन उसे मिटा नहीं सकता", async () => {
      await reset();
      const db = env.authenticatedContext(STUDENT).firestore();
      await assertSucceeds(getDoc(doc(db, "userNotifications", STUDENT, "items", "notice-1")));
      await assertFails(deleteDoc(doc(db, "userNotifications", STUDENT, "items", "notice-1")));
    });

    await t.test("विद्यार्थी अपने खाते में परीक्षा शुरू सूचना लिख सकता है", async () => {
      await reset();
      const db = env.authenticatedContext(STUDENT).firestore();
      await assertSucceeds(setDoc(doc(db, "userNotifications", STUDENT, "items", "exam-start-1"), {
        recipientUid: STUDENT, title: "परीक्षा शुरू हुई", message: "मुख्य परीक्षा शुरू की गई।",
        type: "exam-start", active: true, audience: "private", createdAt: serverTimestamp(),
      }));
    });

    await t.test("flat notification read marker uses the exact schema", async () => {
      await reset();
      const db = env.authenticatedContext(STUDENT).firestore();
      await assertSucceeds(setDoc(doc(db, "notificationReads", STUDENT + "_flat-1"), {
        uid: STUDENT, notificationId: "flat-1", read: true, readAt: serverTimestamp(),
      }));
      await assertFails(setDoc(doc(db, "notificationReads", STUDENT + "_bad"), {
        uid: STUDENT, notificationId: "bad", read: true, readAt: serverTimestamp(), key: "legacy-extra",
      }));
      await assertFails(deleteDoc(doc(db, "notificationReads", STUDENT + "_flat-1")));
    });

    await t.test("flat ALL notification is readable but student cannot delete it", async () => {
      await reset();
      const ownerDb = env.authenticatedContext(OWNER).firestore();
      await assertSucceeds(setDoc(doc(ownerDb, "userNotifications/flat-all"), {
        uid: "ALL", type: "announcement", title: "सार्वजनिक सूचना", body: "सभी के लिए",
        important: true, pinnedByOwner: true, fileUrl: "", createdAt: serverTimestamp(),
      }));
      const studentDb = env.authenticatedContext(STUDENT).firestore();
      await assertSucceeds(getDoc(doc(studentDb, "userNotifications/flat-all")));
      await assertFails(deleteDoc(doc(studentDb, "userNotifications/flat-all")));
    });

    await t.test("विद्यार्थी अपने notification read marker को लिख सकता है", async () => {
      await reset();
      const db = env.authenticatedContext(STUDENT).firestore();
      await assertSucceeds(setDoc(doc(db, "userNotificationReads", STUDENT, "items", "notice-1"), {
        read: true, readAt: serverTimestamp(),
      }));
    });

    await t.test("Owner प्रवेश-पत्र रिलीज़ flag और pinned per-student notification लिख सकता है", async () => {
      await reset();
      const db = env.authenticatedContext(OWNER).firestore();
      await assertSucceeds(updateDoc(doc(db, "examEnrolledStudents", STUDENT), {
        admitCardReleased: true,
        admitCardReleasedAt: serverTimestamp(),
        admitCardExamType: "मुख्य परीक्षा",
      }));
      await assertSucceeds(setDoc(doc(db, "userNotifications", STUDENT, "items", "admit-card-test"), {
        recipientUid: STUDENT,
        title: "🎟️ प्रवेश-पत्र जारी",
        message: "हिंदी नाम वाला विद्यार्थी",
        type: "admit-card",
        important: true,
        pinnedByOwner: true,
        active: true,
        audience: "private",
        createdAt: serverTimestamp(),
      }));
    });

    await t.test("विद्यार्थी स्वयं प्रवेश-पत्र जारी नहीं कर सकता", async () => {
      await reset();
      const db = env.authenticatedContext(STUDENT).firestore();
      await assertFails(updateDoc(doc(db, "examEnrolledStudents", STUDENT), {
        admitCardReleased: true,
        admitCardReleasedAt: serverTimestamp(),
      }));
    });
  } finally {
    await env.cleanup();
  }
});
