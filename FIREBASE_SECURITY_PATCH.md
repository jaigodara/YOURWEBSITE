# Firebase security patch required by the latest portal code

**This file is a patch guide, not a replacement for the live Firebase Console rules.** The live rules are not stored in this repository, so committing this document does not deploy them. Merge the relevant match-block changes into Firebase Console → Firestore Database → Rules, and publish. Do not add a second permissive match block: Firestore allow rules are ORed together, so an older public-read rule would override these restrictions.

## 1. Add these helper functions inside your existing service cloud.firestore block

Keep the existing signedIn() and owner() helpers. This helper intentionally excludes trusted editors from high-stakes exam answer keys.

    function examOwner() {
      return signedIn() && (
        request.auth.uid == '8YRBWWMKG2OUW6cmzZkGbFgOqyp2' ||
        request.auth.uid == 'rdP0ZXzSP9fGzmJshEVvbOfb31g2' ||
        (
          exists(/databases/$(database)/documents/roles/$(request.auth.uid)) &&
          get(/databases/$(database)/documents/roles/$(request.auth.uid)).data.role == 'owner'
        )
      );
    }

    function examStarted(fieldName) {
      let configPath = /databases/$(database)/documents/examConfig/current;
      return exists(configPath) &&
        get(configPath).data.get(fieldName, null) != null &&
        request.time >= get(configPath).data.get(fieldName, timestamp.date(1970, 1, 1));
    }

Owner Studio now writes Timestamp fields named quizStartAt, mock1StartAt, mock2StartAt, and mainStartAt. The matching numeric *StartAtMs fields are retained for the browser countdown.

## 2. Replace existing question-bank match blocks

Replace the existing broad public-read rules for these collections. Do not leave any matching public-read rule in place.

    match /quiz/{questionId} {
      allow read: if examOwner() ||
        (resource.data.published == true && examStarted('quizStartAt'));
      allow create, update, delete: if examOwner();
    }

    match /mockExam_1/{questionId} {
      allow read: if examOwner() ||
        (resource.data.published == true && examStarted('mock1StartAt'));
      allow create, update, delete: if examOwner();
    }

    match /mockExam_2/{questionId} {
      allow read: if examOwner() ||
        (resource.data.published == true && examStarted('mock2StartAt'));
      allow create, update, delete: if examOwner();
    }

    match /mainExamQuestions/{questionId} {
      allow read: if examOwner() ||
        (resource.data.published == true && examStarted('mainStartAt'));
      allow create, update, delete: if examOwner();
    }

    match /examAnswerKeys/{examCollection}/items/{questionId} {
      allow read, write: if examOwner();
    }

High-stakes main/mock answer keys are stored in examAnswerKeys, not in student-readable question documents. Owner Studio migrates a legacy key out of the question document when you publish it. Review and republish old questions before scheduling the exam.

## 3. Private notifications

Add this match block inside the existing Firestore service block:

    match /userNotifications/{uid}/items/{notificationId} {
      allow read: if signedIn() && request.auth.uid == uid;
      allow create: if (
        examOwner() && request.resource.data.recipientUid == uid
      ) || (
        signedIn() &&
        request.auth.uid == uid &&
        request.resource.data.recipientUid == uid &&
        request.resource.data.type == 'quiz-result' &&
        request.resource.data.active == true
      );
      allow update, delete: if examOwner();
    }

Keep the existing notifications rule for broadcasts, but the browser UI hides those announcements from signed-out visitors.

## 4. Manual enrollment creation

Inside the existing match /examEnrolledStudents/{uid} block, add owner creation permission while retaining the student-self-enrollment checks:

    allow create: if examOwner() || (
      signedIn() &&
      request.auth.uid == uid &&
      request.resource.data.uid == request.auth.uid &&
      request.resource.data.rollNumber == 'BIS-' + request.auth.uid &&
      request.resource.data.verificationStatus == 'pending'
    );

Make sure this replaces the old create expression rather than leaving a conflicting duplicate. The existing update rules must also allow the student DOB field dateOfBirth in the intended personal-field whitelist.

## 5. Tree pledge counter

Inside the existing match /treePledges/{uid} block, allow public reads of the aggregate's underlying unique-account records, while keeping writes restricted to the account owner and any existing owner moderation rules:

    allow read: if true;

The homepage counter now starts at zero and displays the number of actual treePledges documents. Each document represents one unique account, not the cumulative number of trees planted.

## 6. Firebase Storage rules for notification attachments

In Firebase Console → Storage → Rules, merge the following path rules into your current policy. These rules support images/PDFs up to 10 MB, allow authenticated users to read broadcast files, and restrict personal attachments to the intended recipient or an exam owner.

    rules_version = '2';
    service firebase.storage {
      match /b/{bucket}/o {
        function signedIn() {
          return request.auth != null;
        }
        function examOwner() {
          return signedIn() && (
            request.auth.uid == '8YRBWWMKG2OUW6cmzZkGbFgOqyp2' ||
            request.auth.uid == 'rdP0ZXzSP9fGzmJshEVvbOfb31g2' ||
            (
              firestore.exists(/databases/(default)/documents/roles/$(request.auth.uid)) &&
              firestore.get(/databases/(default)/documents/roles/$(request.auth.uid)).data.role == 'owner'
            )
          );
        }
        function validAttachment() {
          return request.resource.size <= 10 * 1024 * 1024 &&
            (
              request.resource.contentType.matches('image/.*') ||
              request.resource.contentType == 'application/pdf'
            );
        }
        match /notificationUploads/broadcast/{ownerUid}/{fileName} {
          allow write: if examOwner() && request.auth.uid == ownerUid && validAttachment();
          allow read: if signedIn();
        }
        match /notificationUploads/private/{recipientUid}/{ownerUid}/{fileName} {
          allow write: if examOwner() && request.auth.uid == ownerUid && validAttachment();
          allow read: if signedIn() &&
            (request.auth.uid == recipientUid || examOwner());
        }
      }
    }

## Important

- Publish the Firestore and Storage rules in Firebase Console; GitHub/Vercel deployment does not deploy Firebase rules.
- Main/mock submissions and private notifications require corresponding existing match blocks to enforce owner-only writes and student-own reads. Review those existing blocks before publishing.
- A browser-only exam cannot provide tamper-proof timing or proctoring. Rules can enforce scheduled start and question-read permissions; a trusted backend is needed for fully authoritative deadlines, anti-duplicate submissions, and secure result lookup by roll number/name/DOB.

## 7. Enforce enrollment and scheduled start on submission writes

Add this helper inside the Firestore service block:

    function confirmedExamStudent() {
      let enrollmentPath = /databases/$(database)/documents/examEnrolledStudents/$(request.auth.uid);
      return signedIn() &&
        exists(enrollmentPath) &&
        get(enrollmentPath).data.verificationStatus == 'confirmed';
    }

Replace the existing create rules for the three submission collections with the matching checks below. Keep reads limited to the student who owns the record and the exam owner; do not leave any broader signed-in create/read rule for these collections.

    match /quizAttempts/{attemptId} {
      allow create: if confirmedExamStudent() &&
        request.resource.data.uid == request.auth.uid &&
        request.resource.data.mode == 'quiz' &&
        examStarted('quizStartAt');
      allow read: if examOwner() ||
        (signedIn() && resource.data.uid == request.auth.uid);
      allow update, delete: if examOwner();
    }

    match /mockExamSubmissions/{attemptId} {
      allow create: if confirmedExamStudent() &&
        request.resource.data.uid == request.auth.uid &&
        (
          (request.resource.data.mode == 'mock1' && examStarted('mock1StartAt')) ||
          (request.resource.data.mode == 'mock2' && examStarted('mock2StartAt'))
        );
      allow read: if examOwner() ||
        (signedIn() && resource.data.uid == request.auth.uid);
      allow update, delete: if examOwner();
    }

    match /mainExamSubmissions/{attemptId} {
      allow create: if confirmedExamStudent() &&
        request.resource.data.uid == request.auth.uid &&
        request.resource.data.mode == 'main' &&
        examStarted('mainStartAt');
      allow read: if examOwner() ||
        (signedIn() && resource.data.uid == request.auth.uid);
      allow update, delete: if examOwner();
    }

These examples must replace the corresponding existing collection rules rather than be added beside permissive rules. The code still needs backend-side duplicate-attempt enforcement if each student may submit only once.

## 8. Exam session, late-entry, and re-entry controls

Add this match block to let students create/update only their own session metadata, while only the exam owner can grant or deny re-entry. Replace any existing broader match for examSessions if one exists.

    match /examSessions/{sessionId} {
      allow create: if signedIn() &&
        request.resource.data.uid == request.auth.uid &&
        request.resource.data.status in ['active', 'late_request'];
      allow read: if examOwner() ||
        (signedIn() && resource.data.uid == request.auth.uid);
      allow update: if examOwner() || (
        signedIn() &&
        resource.data.uid == request.auth.uid &&
        request.resource.data.uid == request.auth.uid &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'uid', 'name', 'mode', 'status', 'currentQuestion', 'totalQuestions',
          'tabSwitches', 'endAtMs', 'updatedAt', 'startedAt',
          'lateEntryRequested', 'requestedAt', 'reentryGrantConsumedAt'
        ]) &&
        (
          request.resource.data.status == resource.data.status ||
          (resource.data.status == 'active' && request.resource.data.status == 'kicked') ||
          ((resource.data.status == 'active' || resource.data.status == 'kicked') && request.resource.data.status == 'submitted') ||
          (request.resource.data.status == 'late_request' && request.resource.data.lateEntryRequested == true)
        )
      );
      allow delete: if examOwner();
    }

Owner Studio changes a session to active and adds reentryGrantedAt/reentryGrantedBy when granting access. Students cannot write those grant fields. The live monitor reads the latest 100 sessions; use the refresh control to load new requests.
