# Firebase security patch required by the latest portal code

**A consolidated starting ruleset is now available in the repository root at [firestore.rules](./firestore.rules).** This file is version-controlled, but committing it does not publish rules to the live Firebase project. Review it against your current Firebase Console rules and test it with the Firebase Emulator Suite before publishing.

**Do not blindly append these rules to existing live rules.** Firestore combines overlapping `allow` statements with OR logic; any old broad public-read or permissive-write rule can defeat a restrictive rule. Replace overlapping matches rather than adding duplicates.

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

    function sessionDeadlineReached(mode) {
      let sessionPath = /databases/$(database)/documents/examSessions/$(request.auth.uid + '_' + mode);
      return exists(sessionPath) &&
        get(sessionPath).data.get('endAt', null) != null &&
        request.time >= get(sessionPath).data.endAt;
    }

    function validScheduledSessionEnd(mode, endAt) {
      let configPath = /databases/$(database)/documents/examConfig/current;
      return exists(configPath) && (
        (mode == 'quiz' && endAt == get(configPath).data.get('quizEndAt', null)) ||
        (mode == 'mock1' && endAt == get(configPath).data.get('mock1EndAt', null)) ||
        (mode == 'mock2' && endAt == get(configPath).data.get('mock2EndAt', null)) ||
        (mode == 'main' && endAt == get(configPath).data.get('mainEndAt', null))
      );
    }

    function editorHasPermission(permission) {
      let rolePath = /databases/$(database)/documents/roles/$(request.auth.uid);
      return signedIn() &&
        exists(rolePath) &&
        get(rolePath).data.role == 'editor' &&
        ('permissions' in get(rolePath).data) &&
        get(rolePath).data.permissions.get(permission, false) == true;
    }

    function canReviewExam() {
      return examOwner() || editorHasPermission('examReview');
    }

    function canEditQuizDrafts() {
      return editorHasPermission('quizDrafts');
    }

    function canSendNotifications() {
      return examOwner() || editorHasPermission('notifications');
    }

    function canManageMedia() {
      return examOwner() || editorHasPermission('media');
    }

Owner Studio now writes Timestamp fields named quizStartAt, mock1StartAt, mock2StartAt, and mainStartAt. The matching numeric *StartAtMs fields are retained for the browser countdown.

## 2. Replace existing question-bank match blocks

Replace the existing broad public-read rules for these collections. Do not leave any matching public-read rule in place.

    match /quiz/{questionId} {
      allow read: if examOwner() || canEditQuizDrafts() ||
        (resource.data.published == true && examStarted('quizStartAt'));
      allow create: if examOwner() ||
        (canEditQuizDrafts() && request.resource.data.published == false && request.resource.data.status == 'draft');
      allow update: if examOwner() ||
        (canEditQuizDrafts() && request.resource.data.published == false && request.resource.data.status == 'draft');
      allow delete: if examOwner();
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
      allow read: if examOwner() || canReviewExam();
      allow write: if examOwner();
    }

High-stakes main/mock answer keys are stored in examAnswerKeys, not in student-readable question documents. Owner Studio migrates a legacy key out of the question document when you publish it. Review and republish old questions before scheduling the exam.

## 3. Private notifications

Add this match block inside the existing Firestore service block:

    match /userNotifications/{uid}/items/{notificationId} {
      allow read: if signedIn() && request.auth.uid == uid;
      allow create: if (
        canSendNotifications() && request.resource.data.recipientUid == uid
      ) || (
        canReviewExam() &&
        request.resource.data.type == 'exam-result' &&
        request.resource.data.recipientUid == uid
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
        function editorHasPermission(permission) {
          return signedIn() &&
            firestore.exists(/databases/(default)/documents/roles/$(request.auth.uid)) &&
            firestore.get(/databases/(default)/documents/roles/$(request.auth.uid)).data.role == 'editor' &&
            firestore.get(/databases/(default)/documents/roles/$(request.auth.uid)).data.permissions[permission] == true;
        }
        function canSendNotifications() {
          return examOwner() || editorHasPermission('notifications');
        }
        function canManageMedia() {
          return examOwner() || editorHasPermission('media');
        }
        function validAttachment() {
          return request.resource.size <= 10 * 1024 * 1024 &&
            (
              request.resource.contentType.matches('image/.*') ||
              request.resource.contentType == 'application/pdf'
            );
        }
        match /notificationUploads/broadcast/{ownerUid}/{fileName} {
          allow write: if canSendNotifications() && request.auth.uid == ownerUid && validAttachment();
          allow read: if signedIn();
        }
        match /notificationUploads/private/{recipientUid}/{ownerUid}/{fileName} {
          allow write: if canSendNotifications() && request.auth.uid == ownerUid && validAttachment();
          allow read: if signedIn() &&
            (request.auth.uid == recipientUid || examOwner());
        }
      }
    }

## Important

- Publish the Firestore and Storage rules in Firebase Console; GitHub/Vercel deployment does not deploy Firebase rules.
- Main/mock submissions and private notifications require corresponding existing match blocks to enforce owner-only writes and student-own reads. Review those existing blocks before publishing.
- Once these rules are published, Firestore can reject main/mock submissions before the stored session deadline. The browser countdown itself is still client-side and can drift; a trusted backend is needed for authoritative timer display, anti-duplicate attempts, reliable proctoring evidence, and public result lookup without login.

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
      // Student results are served from publishedResults, never from answer-sheet docs.
      allow read: if canReviewExam();
      allow update: if canReviewExam();
      allow delete: if examOwner();
    }

    match /mockExamSubmissions/{attemptId} {
      allow create: if confirmedExamStudent() &&
        request.resource.data.uid == request.auth.uid &&
        (
          (request.resource.data.mode == 'mock1' && examStarted('mock1StartAt') && sessionDeadlineReached('mock1')) ||
          (request.resource.data.mode == 'mock2' && examStarted('mock2StartAt') && sessionDeadlineReached('mock2'))
        );
      // Student results are served from publishedResults, never from answer-sheet docs.
      allow read: if canReviewExam();
      allow update: if canReviewExam();
      allow delete: if examOwner();
    }

    match /mainExamSubmissions/{attemptId} {
      allow create: if confirmedExamStudent() &&
        request.resource.data.uid == request.auth.uid &&
        request.resource.data.mode == 'main' &&
        examStarted('mainStartAt') &&
        sessionDeadlineReached('main');
      // Student results are served from publishedResults, never from answer-sheet docs.
      allow read: if canReviewExam();
      allow update: if canReviewExam();
      allow delete: if examOwner();
    }

These examples must replace the corresponding existing collection rules rather than be added beside permissive rules. The code still needs backend-side duplicate-attempt enforcement if each student may submit only once.

## 8. Exam session, late-entry, and re-entry controls

Add this match block to let students create/update only their own session metadata, while only the exam owner can grant or deny re-entry. Replace any existing broader match for examSessions if one exists.

    match /examSessions/{sessionId} {
      allow create: if signedIn() &&
        request.resource.data.uid == request.auth.uid &&
        (
          request.resource.data.status == 'late_request' ||
          (
            request.resource.data.status == 'active' &&
            validScheduledSessionEnd(request.resource.data.mode, request.resource.data.endAt)
          )
        );
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
        request.resource.data.get('endAt', null) == resource.data.get('endAt', null) &&
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

## 9. Configurable trusted-editor permissions

Owner Studio now saves selected permissions in roles/{uid}.permissions. Use the helpers in section 1 in the existing rules instead of giving every editor the full owner() role:

- For media/PDF/audio collections and their Storage upload paths, replace editor-wide owner() write access with examOwner() or canManageMedia().
- The quiz collection rules above allow an editor with quizDrafts permission to read questions and create/update only unpublished Draft documents. Editors cannot publish or delete questions.
- For exam answer keys, canReviewExam() can read keys for manual checking, but only examOwner() may write answer keys.
- For main/mock/quiz submission collections, canReviewExam() may read/update reviews; students must still only read their own submissions.
- The notification collection and broadcast Storage path use canSendNotifications(). Personal notifications remain readable only by the recipient UID.
- Main exam schedule, student enrollment management, admit-card release, role management, and live-session allow/deny remain Owner-only.

Do not leave a broad existing editor rule such as allow write: if owner() on these sensitive collections. Firestore combines overlapping allows with OR logic, so the old broad rule must be replaced, not supplemented.


## 10. Keep private marking separate from student-visible results

The updated Owner Studio writes manual marks/feedback to `reviews/{sourceCollection}_{submissionId}` and writes a separate document to `publishedResults/{sourceCollection}_{submissionId}` only when the result is published. The student portal reads only `publishedResults` filtered by the signed-in UID. Do not add marks back to the original submission documents.

Add these match blocks inside the existing Firestore service block, after checking for and replacing any overlapping permissive rules:

    match /reviews/{reviewId} {
      allow read, create, update: if canReviewExam();
      allow delete: if examOwner();
    }

    match /publishedResults/{resultId} {
      allow read: if examOwner() ||
        (signedIn() && resource.data.uid == request.auth.uid);
      // Manual main/mock/owner-reviewed results are written by authorized reviewers.
      // Daily quiz results are client-calculated; this rule validates ownership/shape,
      // not the truth of the score. Use a trusted backend if quiz scores must be tamper-proof.
      allow create: if canReviewExam() || (
        signedIn() &&
        request.resource.data.uid == request.auth.uid &&
        request.resource.data.mode == 'quiz' &&
        request.resource.data.status == 'published' &&
        request.resource.data.keys().hasOnly([
          'uid', 'sourceCollection', 'sourceSubmissionId', 'mode', 'name',
          'rollNumber', 'score', 'total', 'status', 'feedback', 'publishedAt', 'publishedBy'
        ])
      );
      allow update, delete: if canReviewExam();
    }

    match /userNotificationReads/{uid}/items/{notificationId} {
      allow read, create, update, delete: if signedIn() && request.auth.uid == uid;
    }

Important migration notes:

- The three submission collections above now grant read access only to `canReviewExam()`. This matches the portal code, which no longer reads submissions to populate student results. Verify no other deployed client depends on students reading their own submission documents before publishing these rules.
- Existing legacy submission documents may already contain `score`, `finalScore`, `manualScore`, `resultPublished`, or feedback fields. Removing student read access prevents those fields being fetched by students; do not assume hiding fields in the UI is enough.
- Existing results in legacy submission documents will not automatically appear in `publishedResults`. Migrate them using a trusted owner-only script after validating each record and identity. Do not expose a public migration endpoint.
- Firestore rules are OR-combined across matching blocks. Replace old permissive rules instead of simply adding these snippets. Test with owner, authorized editor, and two student accounts in a non-production Firebase project.
- GitHub/Vercel deployment does not deploy these Firebase rules. Publish the reviewed rules separately in Firebase Console.
