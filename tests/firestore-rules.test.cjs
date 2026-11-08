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
  doc, setDoc, updateDoc, getDoc, getDocs, deleteDoc, collection, collectionGroup, query, where, serverTimestamp, Timestamp, writeBatch,
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
    // The account's primary Firebase email is the hidden mobile-login email.
    email: "919876543210@jambh-login.app",
    email_verified: false,
    firebase: {
      sign_in_provider: "google.com",
      identities: { "google.com": ["student-test@example.com"] },
    },
  });
  const googleOwnerContext = () => env.authenticatedContext(OWNER, {
    email: "owner-hidden@jambh-login.app",
    email_verified: false,
    firebase: {
      sign_in_provider: "google.com",
      identities: { "google.com": ["owner-test@example.com"] },
    },
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

    await t.test("verified Google sign-in can establish gmailVerified but cannot downgrade it", async () => {
      await reset();
      await env.withSecurityRulesDisabled(async (ctx) => {
        await updateDoc(doc(ctx.firestore(), "users", STUDENT), { gmailVerified: false });
      });
      const db = googleStudentContext(STUDENT).firestore();
      await assertSucceeds(updateDoc(doc(db, "users", STUDENT), {
        gmailVerified: true, email: "919876543210@jambh-login.app",
      }));
      await assertFails(updateDoc(doc(db, "users", STUDENT), { gmailVerified: false }));
    });

    await t.test("non-Google sessions cannot establish Gmail verification", async () => {
      await reset();
      await env.withSecurityRulesDisabled(async (ctx) => {
        await updateDoc(doc(ctx.firestore(), "users", "new-student"), { gmailVerified: false });
      });
      const db = env.authenticatedContext("new-student").firestore();
      await assertFails(updateDoc(doc(db, "users", "new-student"), {
        gmailVerified: true, email: "919876543210@jambh-login.app",
      }));
    });

    await t.test("विद्यार्थी बिना रोल नंबर के pending enrollment बना सकता है", async () => {
      await reset();
      const db = googleStudentContext("new-student").firestore();
      await assertSucceeds(setDoc(doc(db, "examEnrolledStudents/new-student"), {
        uid: "new-student", fullName: "नया विद्यार्थी",
        verificationStatus: "pending", createdAt: serverTimestamp(),
      }));
    });

    await t.test("Owner registration बंद करे तो विद्यार्थी नया enrollment या अपना आवेदन edit नहीं कर सकता", async () => {
      await reset();
      await env.withSecurityRulesDisabled(async (ctx) => {
        await updateDoc(doc(ctx.firestore(), "examConfig/current"), { registrationOpen: false });
      });
      const newStudentDb = googleStudentContext("new-student").firestore();
      await assertFails(setDoc(doc(newStudentDb, "examEnrolledStudents/new-student"), {
        uid: "new-student", fullName: "नया विद्यार्थी",
        verificationStatus: "pending", createdAt: serverTimestamp(),
      }));
      const existingStudentDb = googleStudentContext(STUDENT).firestore();
      await assertFails(updateDoc(doc(existingStudentDb, "examEnrolledStudents", STUDENT), {
        fullName: "बंद अवधि में बदलाव", updatedAt: serverTimestamp(),
      }));
      const ownerDb = googleOwnerContext().firestore();
      await assertSucceeds(setDoc(doc(ownerDb, "examEnrolledStudents/new-student"), {
        uid: "new-student", fullName: "Owner द्वारा जोड़ा गया",
        verificationStatus: "pending",
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
      const db = googleOwnerContext().firestore();
      await assertSucceeds(updateDoc(doc(db, "examEnrolledStudents", STUDENT), {
        admitCardReleased: true, admitCardReleasedAt: serverTimestamp(),
      }));
    });

    await t.test("Owner पिन की गई निजी प्रवेश-पत्र सूचना बना सकता है", async () => {
      await reset();
      const db = googleOwnerContext().firestore();
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
      const reviewerDb = env.authenticatedContext("reviewer-test", {
        email: "reviewer-test@example.com",
        email_verified: true,
        firebase: {
          sign_in_provider: "google.com",
          identities: { "google.com": ["reviewer-test@example.com"] },
        },
      }).firestore();
      await assertSucceeds(getDoc(doc(reviewerDb, "mainExamQuestions/q1")));
      await assertSucceeds(getDoc(doc(reviewerDb, "examAnswerKeys/main/items/q1")));
      const studentDb = env.authenticatedContext(STUDENT).firestore();
      await assertFails(getDoc(doc(studentDb, "mainExamQuestions/q1")));
    });

    await t.test("मुख्य/मॉक परिणाम Owner release से पहले निजी रहते हैं", async () => {
      await reset();
      await env.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore();
        await setDoc(doc(db, "publishedResults/main-result"), {
          uid: STUDENT, mode: "main", status: "evaluated", score: 8, total: 10,
        });
      });
      const studentDb = googleStudentContext(STUDENT).firestore();
      await assertFails(getDoc(doc(studentDb, "publishedResults/main-result")));
      await env.withSecurityRulesDisabled(async (ctx) => {
        await updateDoc(doc(ctx.firestore(), "examConfig/current"), { resultsPublished: true });
      });
      await assertSucceeds(getDoc(doc(studentDb, "publishedResults/main-result")));
    });

    await t.test("दैनिक क्विज़ का वास्तविक result payload उसी batch में बने quiz attempt के साथ स्वीकार होता है", async () => {
      await reset();
      const db = googleStudentContext(STUDENT).firestore();
      const attemptId = "daily-quiz-attempt";
      const batch = writeBatch(db);
      batch.set(doc(db, "quizAttempts", attemptId), {
        uid: STUDENT,
        mode: "quiz",
        answers: { q1: "A" },
        submittedAt: serverTimestamp(),
      });
      batch.set(doc(db, "publishedResults", "quizAttempts_" + attemptId), {
        uid: STUDENT,
        studentPhone: "",
        studentIdentityKey: "uid:" + STUDENT,
        sourceCollection: "quizAttempts",
        sourceSubmissionId: attemptId,
        mode: "quiz",
        name: "परीक्षण विद्यार्थी",
        rollNumber: "JAMBH-2026-00001",
        score: 1,
        total: 1,
        maxMarks: 1,
        totalQuestions: 1,
        attempted: 1,
        correct: 1,
        incorrect: 0,
        status: "published",
        feedback: "",
        publishedAt: serverTimestamp(),
        publishedBy: "system",
      });
      await assertSucceeds(batch.commit());
    });

    await t.test("दैनिक क्विज़ का result किसी अलग attempt के बिना या अतिरिक्त fields के साथ नहीं बनाया जा सकता", async () => {
      await reset();
      const db = googleStudentContext(STUDENT).firestore();
      await assertFails(setDoc(doc(db, "publishedResults", "detached-result"), {
        uid: STUDENT,
        sourceCollection: "quizAttempts",
        sourceSubmissionId: "missing-attempt",
        mode: "quiz",
        score: 10,
        total: 10,
        maxMarks: 10,
        totalQuestions: 10,
        attempted: 10,
        correct: 10,
        incorrect: 0,
        status: "published",
        publishedAt: serverTimestamp(),
        publishedBy: "system",
      }));
      const attemptId = "daily-quiz-extra-field";
      const batch = writeBatch(db);
      batch.set(doc(db, "quizAttempts", attemptId), {
        uid: STUDENT, mode: "quiz", answers: {}, submittedAt: serverTimestamp(),
      });
      batch.set(doc(db, "publishedResults", "quizAttempts_" + attemptId), {
        uid: STUDENT,
        sourceCollection: "quizAttempts",
        sourceSubmissionId: attemptId,
        mode: "quiz",
        score: 1,
        total: 1,
        maxMarks: 1,
        totalQuestions: 1,
        attempted: 1,
        correct: 1,
        incorrect: 0,
        status: "published",
        publishedAt: serverTimestamp(),
        publishedBy: "system",
        isOwner: true,
      });
      await assertFails(batch.commit());
    });

    await t.test("प्रवेश-पत्र रिलीज़ से पहले निजी रहता है और per-card release के बाद खुलता है", async () => {
      await reset();
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), "admitCards/student-card"), {
          uid: STUDENT, admitCardExamType: "main", admitCardReleased: false,
        });
      });
      const studentDb = googleStudentContext(STUDENT).firestore();
      await assertFails(getDoc(doc(studentDb, "admitCards/student-card")));
      await env.withSecurityRulesDisabled(async (ctx) => {
        await updateDoc(doc(ctx.firestore(), "admitCards/student-card"), { admitCardReleased: true });
      });
      await assertSucceeds(getDoc(doc(studentDb, "admitCards/student-card")));
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

    await t.test("स्थायी global सूचना केवल Owner बना, बदल और हटा सकता है", async () => {
      await reset();
      const ownerDb = googleOwnerContext().firestore();
      const permanentRef = doc(ownerDb, "notifications", "permanent-global");
      await assertSucceeds(setDoc(permanentRef, {
        title: "महत्वपूर्ण स्थायी सूचना", message: "Owner द्वारा प्रकाशित",
        audience: "all", active: true, lifetime: "permanent", createdBy: OWNER,
        createdAt: serverTimestamp(),
      }));
      await env.withSecurityRulesDisabled(async ctx => {
        await setDoc(doc(ctx.firestore(), "roles/notification-editor"), {
          role: "editor", permissions: { notifications: true },
        });
      });
      const editorDb = env.authenticatedContext("notification-editor").firestore();
      await assertFails(setDoc(doc(editorDb, "notifications/editor-permanent"), {
        title: "अनधिकृत स्थायी सूचना", message: "नहीं",
        audience: "all", active: true, lifetime: "permanent", createdBy: "notification-editor",
      }));
      await assertFails(updateDoc(doc(editorDb, "notifications", "permanent-global"), { title: "बदला" }));
      await assertFails(deleteDoc(doc(editorDb, "notifications", "permanent-global")));
      const studentDb = env.authenticatedContext(STUDENT).firestore();
      await assertFails(deleteDoc(doc(studentDb, "notifications", "permanent-global")));
      await assertSucceeds(updateDoc(permanentRef, { title: "Owner ने बदला" }));
      await assertSucceeds(deleteDoc(permanentRef));
    });

    await t.test("स्थायी निजी सूचना केवल Owner प्रकाशित और हटा सकता है; विद्यार्थी केवल अपना read marker लिख सकता है", async () => {
      await reset();
      const ownerDb = googleOwnerContext().firestore();
      const privateRef = doc(ownerDb, "userNotifications", STUDENT, "items", "private-permanent");
      await assertSucceeds(setDoc(privateRef, {
        recipientUid: STUDENT, title: "निजी स्थायी सूचना", message: "महत्वपूर्ण",
        type: "announcement", audience: "private", active: true, lifetime: "permanent",
        createdBy: OWNER, createdAt: serverTimestamp(),
      }));
      const ownerPermanentQuery = query(collectionGroup(ownerDb, "items"), where("lifetime", "==", "permanent"));
      const ownerPermanentSnapshot = await assertSucceeds(getDocs(ownerPermanentQuery));
      assert.ok(ownerPermanentSnapshot.docs.some(item => item.ref.path === "userNotifications/" + STUDENT + "/items/private-permanent"));
      const studentDb = env.authenticatedContext(STUDENT).firestore();
      await assertSucceeds(getDoc(doc(studentDb, "userNotifications", STUDENT, "items", "private-permanent")));
      await assertFails(deleteDoc(doc(studentDb, "userNotifications", STUDENT, "items", "private-permanent")));
      await assertSucceeds(setDoc(doc(studentDb, "userNotificationReads", STUDENT, "items", "private-permanent"), {
        key: "private:private-permanent", readAt: serverTimestamp(),
      }));
      await assertFails(setDoc(doc(studentDb, "userNotifications", STUDENT, "items", "student-forged-permanent"), {
        recipientUid: STUDENT, title: "नकली स्थायी सूचना", message: "नहीं",
        type: "quiz-result", audience: "private", active: true, lifetime: "permanent",
      }));
      await assertFails(updateDoc(doc(studentDb, "userNotifications", STUDENT, "items", "private-permanent"), {
        lifetime: "temporary",
      }));
      await assertSucceeds(deleteDoc(privateRef));
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
      const ownerDb = googleOwnerContext().firestore();
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
      const db = googleOwnerContext().firestore();
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
      const ownerDb = googleOwnerContext().firestore();
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

    await t.test("editor permission audit logs are immutable and owner-only", async () => {
      await reset();
      const ownerDb = googleOwnerContext().firestore();
      const auditRef = doc(ownerDb, "roleAuditLogs", "audit-event-1");
      await assertSucceeds(setDoc(auditRef, {
        action: "invitation_created",
        targetName: "Test Editor",
        targetPhoneLast4: "1234",
        targetRole: "editor",
        permissions: { media: true, quizDrafts: false, examReview: true, notifications: false },
        changedByName: "व्यवस्थापक",
        changedAt: serverTimestamp(),
      }));
      await assertSucceeds(getDoc(auditRef));
      const studentDb = env.authenticatedContext(STUDENT).firestore();
      await assertFails(getDoc(doc(studentDb, "roleAuditLogs", "audit-event-1")));
      await assertFails(updateDoc(auditRef, { targetName: "Tampered" }));
      await assertFails(deleteDoc(auditRef));
      await assertFails(setDoc(doc(studentDb, "roleAuditLogs", "student-audit"), {
        action: "invitation_created",
        targetName: "Fake Editor",
        targetPhoneLast4: "1234",
        targetRole: "editor",
        permissions: {},
        changedByName: "Student",
        changedAt: serverTimestamp(),
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
    await t.test("Community members can publish messages when posting is enabled, while impersonation and maintenance writes are blocked", async () => {
      await reset();
      const db = googleStudentContext(STUDENT).firestore();
      const validPost = {
        uid: STUDENT,
        body: "नमस्कार, यह समुदाय संदेश है।",
        topic: "सामान्य चर्चा",
        displayName: "परीक्षण सदस्य",
        createdAt: serverTimestamp(),
      };
      await assertSucceeds(setDoc(doc(db, "posts/community-create-test"), validPost));
      await assertFails(setDoc(doc(db, "posts/community-impersonation-test"), {
        ...validPost, uid: "another-member",
      }));

      await env.withSecurityRulesDisabled(async ctx => {
        await setDoc(doc(ctx.firestore(), "settings/maintenance"), {
          globalMode: "off",
          sections: { community: "posting_only" },
          sectionMessages: {},
          sectionAllow: {},
          vipBypass: true,
        });
      });
      await assertFails(setDoc(doc(db, "posts/community-maintenance-test"), {
        ...validPost, body: "मेंटेनेंस के दौरान संदेश नहीं जाना चाहिए।",
      }));
    });

    await t.test("Owner-only Community polls allow one valid vote per member and reject closed or invalid votes", async () => {
      await reset();
      const ownerDb = googleOwnerContext().firestore();
      const pollRef = doc(ownerDb, "communityPolls", "owner-poll-1");
      await assertSucceeds(setDoc(pollRef, {
        title: "समुदाय के लिए अगला कार्यक्रम?",
        options: [{ id: "option_1", text: "सामूहिक बैठक" }, { id: "option_2", text: "ऑनलाइन चर्चा" }],
        optionIds: ["option_1", "option_2"],
        active: true,
        createdBy: OWNER,
        createdAt: serverTimestamp(),
      }));
      const studentDb = googleStudentContext(STUDENT).firestore();
      await assertFails(setDoc(doc(studentDb, "communityPolls/student-poll"), {
        title: "अनधिकृत मतदान",
        options: [{ id: "option_1", text: "हाँ" }, { id: "option_2", text: "नहीं" }],
        optionIds: ["option_1", "option_2"],
        active: true,
        createdBy: STUDENT,
        createdAt: serverTimestamp(),
      }));
      const voteRef = doc(studentDb, "communityPolls/owner-poll-1/votes", STUDENT);
      await assertSucceeds(setDoc(voteRef, {
        uid: STUDENT, optionId: "option_1", createdAt: serverTimestamp(),
      }));
      await assertFails(setDoc(voteRef, {
        uid: STUDENT, optionId: "option_2", createdAt: serverTimestamp(),
      }));
      await assertFails(setDoc(doc(studentDb, "communityPolls/owner-poll-1/votes/another-user"), {
        uid: "another-user", optionId: "option_1", createdAt: serverTimestamp(),
      }));
      await assertFails(setDoc(doc(studentDb, "communityPolls/owner-poll-1/votes/invalid-option"), {
        uid: "invalid-option", optionId: "option_99", createdAt: serverTimestamp(),
      }));
      await assertSucceeds(updateDoc(pollRef, { active: false, closedAt: serverTimestamp() }));
      await assertFails(setDoc(doc(studentDb, "communityPolls/owner-poll-1/votes/late-voter"), {
        uid: "late-voter", optionId: "option_1", createdAt: serverTimestamp(),
      }));
    });

    await t.test("Community read receipts increment once per reader and hide individual reader records", async () => {
      await reset();
      const studentDb = googleStudentContext(STUDENT).firestore();
      const postRef = doc(studentDb, "posts", "read-receipt-post");
      await env.withSecurityRulesDisabled(async ctx => {
        await setDoc(doc(ctx.firestore(), "posts/read-receipt-post"), {
          uid: "another-member", body: "पढ़ने की पुष्टि", upvotes: 0, readCount: 0,
        });
      });
      const batch = writeBatch(studentDb);
      batch.set(doc(studentDb, "posts/read-receipt-post/reads", STUDENT), {
        uid: STUDENT, readAt: serverTimestamp(),
      });
      batch.update(postRef, { readCount: 1 });
      await assertSucceeds(batch.commit());
      await assertFails(getDoc(doc(googleStudentContext("another-student").firestore(), "posts/read-receipt-post/reads", STUDENT)));
      const duplicate = writeBatch(studentDb);
      duplicate.set(doc(studentDb, "posts/read-receipt-post/reads", STUDENT), {
        uid: STUDENT, readAt: serverTimestamp(),
      });
      duplicate.update(postRef, { readCount: 2 });
      await assertFails(duplicate.commit());
    });

    await t.test("Community like/dislike reactions are limited to one per signed-in member", async () => {
      await reset();
      const db = googleStudentContext(STUDENT).firestore();
      await env.withSecurityRulesDisabled(async ctx => {
        await setDoc(doc(ctx.firestore(), "posts/reaction-post"), {
          uid: "another-member", body: "प्रतिक्रिया परीक्षण", upvotes: 0, readCount: 0,
        });
      });
      const ownReaction = doc(db, "posts/reaction-post/reactions", STUDENT);
      await assertSucceeds(setDoc(ownReaction, {
        uid: STUDENT, reaction: "like", createdAt: serverTimestamp(),
      }));
      await assertSucceeds(updateDoc(ownReaction, {
        reaction: "dislike", updatedAt: serverTimestamp(),
      }));
      await assertSucceeds(deleteDoc(ownReaction));
      await assertFails(setDoc(doc(db, "posts/reaction-post/reactions", "another-user"), {
        uid: "another-user", reaction: "like", createdAt: serverTimestamp(),
      }));
      await assertFails(setDoc(doc(db, "posts/reaction-post/reactions", "invalid-reaction"), {
        uid: "invalid-reaction", reaction: "love", createdAt: serverTimestamp(),
      }));
      await assertFails(setDoc(doc(db, "posts/reaction-post/reactions", "legacy-emoji"), {
        uid: "legacy-emoji", emoji: "🙏", createdAt: serverTimestamp(),
      }));
    });

    await t.test("Community members can cast only one atomic vote and cannot edit vote counts directly", async () => {
      await reset();
      const db = googleStudentContext(STUDENT).firestore();
      const postRef = doc(db, "posts", "community-post-1");
      await env.withSecurityRulesDisabled(async ctx => {
        await setDoc(doc(ctx.firestore(), "posts/community-post-1"), {
          uid: "another-member", body: "समुदाय संदेश", upvotes: 0,
        });
      });

      const batch = writeBatch(db);
      batch.set(doc(db, "posts/community-post-1/votes", STUDENT), {
        uid: STUDENT, createdAt: serverTimestamp(),
      });
      batch.update(postRef, { upvotes: 1 });
      await assertSucceeds(batch.commit());

      await assertFails(updateDoc(postRef, { upvotes: 50 }));
      await assertFails(setDoc(doc(db, "posts/community-post-1/votes", "another-user"), {
        uid: "another-user", createdAt: serverTimestamp(),
      }));

      const duplicate = writeBatch(db);
      duplicate.set(doc(db, "posts/community-post-1/votes", STUDENT), {
        uid: STUDENT, createdAt: serverTimestamp(),
      });
      duplicate.update(postRef, { upvotes: 2 });
      await assertFails(duplicate.commit());
    });

  } finally {
    await env.cleanup();
  }
});
