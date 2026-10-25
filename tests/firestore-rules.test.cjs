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
  doc, setDoc, updateDoc, getDoc, getDocs, deleteDoc, collection, query, where, serverTimestamp, Timestamp,
} = require("firebase/firestore");

const PROJECT_ID = "bishnoi-platform-rules-test";
const STUDENT = "student-test-uid";
const OWNER = "8YRBWWMKG2OUW6cmzZkGbFgOqyp2";
test("Firestore security rules regression suite", async (t) => {
  const env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8") },
  });

  const googleStudentContext = (uid) => env.authenticatedContext(uid, {
    firebase: { identities: { "google.com": ["student-test@example.com"] } },
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
      await setDoc(doc(db, "users", STUDENT), {
        uid: STUDENT, fullName: "परीक्षण विद्यार्थी", gmailVerified: true,
      });
      await setDoc(doc(db, "users", "new-student"), {
        uid: "new-student", fullName: "नया विद्यार्थी", gmailVerified: true,
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
    await t.test("सूचना केंद्र pinned/important सूचनाएँ पहले दिखाता है और render करता है", async () => {
      const source = readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
      const functionStart = source.indexOf("function renderNotificationCenter()");
      assert.notEqual(functionStart, -1, "notification center function should exist");
      const bodyStart = source.indexOf("{", functionStart);
      let depth = 0;
      let bodyEnd = -1;
      for (let i = bodyStart; i < source.length; i += 1) {
        if (source[i] === "{") depth += 1;
        if (source[i] === "}") {
          depth -= 1;
          if (depth === 0) {
            bodyEnd = i + 1;
            break;
          }
        }
      }
      assert.notEqual(bodyEnd, -1, "notification center function should be complete");
      const body = source.slice(functionStart, bodyEnd);
      assert.match(body, /renderNotificationCards\s*\(/);
      assert.match(body, /sort\s*\(\s*\(a, b\)\s*=>\s*Number\(!!\(b\.pinnedByOwner\s*\|\|\s*b\.important\)\)\s*-\s*Number\(!!\(a\.pinnedByOwner\s*\|\|\s*a\.important\)\)/);
      assert.doesNotMatch(body, /deleteDoc\s*\(/);
    });

    await t.test("विद्यार्थी बिना रोल नंबर के pending enrollment बना सकता है", async () => {
      await reset();
      const db = googleStudentContext("new-student").firestore();
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
      const db = googleStudentContext(STUDENT).firestore();
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
      const db = googleStudentContext(STUDENT).firestore();
      await assertSucceeds(setDoc(doc(db, "mainExamSubmissions/attempt-early"), {
        uid: STUDENT, mode: "main", answers: { q1: "A" }, submittedAt: serverTimestamp(),
      }));
    });

    await t.test("owner exam toggles block student reads when the portal or daily quiz is off", async () => {
      await reset();
      await env.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore();
        await setDoc(doc(db, "examConfig/current"), {
          examPortalVisible: false,
          dailyQuizVisible: false,
          quizStartAt: Timestamp.fromMillis(Date.now() - 60_000),
        }, { merge: true });
        await setDoc(doc(db, "quiz/q-disabled"), {
          q: "बंद क्विज़ प्रश्न", published: true,
        });
        await setDoc(doc(db, "mainExamQuestions/q-disabled"), {
          q: "बंद मुख्य परीक्षा प्रश्न", published: true,
        });
      });
      const studentDb = env.authenticatedContext(STUDENT).firestore();
      await assertFails(getDoc(doc(studentDb, "quiz/q-disabled")));
      await assertFails(getDoc(doc(studentDb, "mainExamQuestions/q-disabled")));
    });

    await t.test("examReview editor can load main-exam question text and private answer keys without opening them to students", async () => {
      await reset();
      await env.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore();
        await setDoc(doc(db, "roles/reviewer-test"), {
          role: "editor", permissions: { examReview: true },
        });
        await setDoc(doc(db, "mainExamQuestions/q1"), {
          q: "समीक्षा प्रश्न", published: false,
        });
      });
      const reviewerDb = env.authenticatedContext("reviewer-test").firestore();
      await assertSucceeds(getDoc(doc(reviewerDb, "mainExamQuestions/q1")));
      await assertSucceeds(getDoc(doc(reviewerDb, "examAnswerKeys/main/items/q1")));
      const studentDb = env.authenticatedContext(STUDENT).firestore();
      await assertFails(getDoc(doc(studentDb, "mainExamQuestions/q1")));
    });

    await t.test("विद्यार्थी अपना मोबाइल और गाँव/स्थान प्रोफ़ाइल में सहेज सकता है, पर verified status नहीं बदल सकता", async () => {
      await reset();
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), "users/" + STUDENT), {
          displayName: "परीक्षण विद्यार्थी", phone: "", location: "", village: "",
          phoneVerified: false,
        });
      });
      const db = env.authenticatedContext(STUDENT).firestore();
      await assertSucceeds(updateDoc(doc(db, "users", STUDENT), {
        phone: "9999999999", location: "हरियाणा", village: "आदमपुर",
      }));
      await assertFails(updateDoc(doc(db, "users", STUDENT), { phoneVerified: true }));
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

    await t.test("app's exact flat-notification queries obey rules for students and signed-out visitors", async () => {
      await reset();
      await env.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore();
        await setDoc(doc(db, "userNotifications/flat-private"), {
          uid: STUDENT, type: "admit-card", title: "निजी सूचना", body: "केवल विद्यार्थी के लिए",
        });
        await setDoc(doc(db, "userNotifications/flat-all-query"), {
          uid: "ALL", type: "announcement", title: "सार्वजनिक सूचना", body: "सभी के लिए",
        });
      });

      const source = readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
      assert.match(source, /collection\('userNotifications'\)\s*\.where\('uid', '==', uid\)/);
      assert.match(source, /collection\('userNotifications'\)\s*\.where\('uid', '==', 'ALL'\)/);
      assert.match(source, /collection\('notificationReads'\)\.where\('uid', '==', uid\)/);
      const studentDb = env.authenticatedContext(STUDENT).firestore();
      // Mirror script.js's separate owner-scoped and broadcast listeners.
      const ownNotificationsQuery = query(
        collection(studentDb, "userNotifications"),
        where("uid", "==", STUDENT),
      );
      const broadcastNotificationsQuery = query(
        collection(studentDb, "userNotifications"),
        where("uid", "==", "ALL"),
      );
      const flatReadMarkersQuery = query(
        collection(studentDb, "notificationReads"),
        where("uid", "==", STUDENT),
      );
      const ownNotices = await assertSucceeds(getDocs(ownNotificationsQuery));
      assert.ok(ownNotices.docs.every((item) => item.data().uid === STUDENT));
      const broadcastNotices = await assertSucceeds(getDocs(broadcastNotificationsQuery));
      assert.ok(broadcastNotices.docs.every((item) => item.data().uid === "ALL"));

      await assertSucceeds(setDoc(doc(studentDb, "notificationReads", STUDENT + "_flat-query"), {
        uid: STUDENT, notificationId: "flat-private", read: true, readAt: serverTimestamp(),
      }));
      const markers = await assertSucceeds(getDocs(flatReadMarkersQuery));
      assert.ok(markers.docs.some((item) => item.data().notificationId === "flat-private"));
      await assertFails(deleteDoc(doc(studentDb, "userNotifications/flat-private")));

      const signedOutDb = env.unauthenticatedContext().firestore();
      await assertFails(getDocs(query(
        collection(signedOutDb, "userNotifications"),
        where("uid", "==", "ALL"),
      )));
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

    await t.test("admit-card QR verification is public get-only and exposes minimal fields", async () => {
      await reset();
      const token = "a".repeat(48);
      const ownerDb = env.authenticatedContext(OWNER).firestore();
      await assertSucceeds(setDoc(doc(ownerDb, "publicAdmitCardVerifications", token), {
        rollNumber: "JAMBH-2026-0001",
        examTitle: "मुख्य परीक्षा",
        status: "valid",
        issuedAt: serverTimestamp(),
        expiresAt: Timestamp.fromMillis(Date.now() + 86_400_000),
      }));
      const publicDb = env.unauthenticatedContext().firestore();
      const verification = await assertSucceeds(getDoc(doc(publicDb, "publicAdmitCardVerifications", token)));
      assert.equal(verification.data().rollNumber, "JAMBH-2026-0001");
      assert.equal(verification.data().examTitle, "मुख्य परीक्षा");
      assert.deepEqual(Object.keys(verification.data()).sort(), ['examTitle', 'expiresAt', 'issuedAt', 'rollNumber', 'status'].sort());
      await assertFails(getDocs(collection(publicDb, "publicAdmitCardVerifications")));
      await assertFails(setDoc(doc(publicDb, "publicAdmitCardVerifications", "b".repeat(48)), {
        rollNumber: "JAMBH-2026-0002",
        examTitle: "मुख्य परीक्षा",
        status: "valid",
        issuedAt: serverTimestamp(),
        expiresAt: Timestamp.fromMillis(Date.now() + 86_400_000),
      }));
      await assertFails(setDoc(doc(env.authenticatedContext(STUDENT).firestore(), "publicAdmitCardVerifications", "c".repeat(48)), {
        rollNumber: "JAMBH-2026-0003",
        examTitle: "मुख्य परीक्षा",
        status: "valid",
        issuedAt: serverTimestamp(),
        expiresAt: Timestamp.fromMillis(Date.now() + 86_400_000),
      }));
    });

    await t.test("expired admit-card QR verification cannot be read publicly", async () => {
      await reset();
      const token = "d".repeat(48);
      await env.withSecurityRulesDisabled(async ctx => {
        await setDoc(doc(ctx.firestore(), "publicAdmitCardVerifications", token), {
          rollNumber: "JAMBH-2026-0001",
          examTitle: "मुख्य परीक्षा",
          status: "valid",
          issuedAt: Timestamp.fromMillis(Date.now() - 172_800_000),
          expiresAt: Timestamp.fromMillis(Date.now() - 86_400_000),
        });
      });
      const publicDb = env.unauthenticatedContext().firestore();
      await assertFails(getDoc(doc(publicDb, "publicAdmitCardVerifications", token)));
    });
  } finally {
    await env.cleanup();
  }
});
