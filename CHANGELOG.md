# CHANGELOG

## 2026-10-15 — Enrollment safety patch

- `script.js`: student enrollment no longer creates a `BIS-<uid>` roll number. New records start as `verificationStatus: pending`; edits update only student-editable fields and preserve existing approval/roll data. The pending roll label now reads “जारी होना बाकी”. Enrollment failures show the Firebase error code/message to aid diagnosis.
- `firestore.rules`: own enrollment creation requires pending status and forbids a client-supplied `rollNumber`; student updates are restricted to profile/enrollment fields and cannot change the approval state or roll number.
- Backward compatibility: existing enrollment field names (`verificationStatus`, `phone`, `dateOfBirth`, `examName`, `location`) are retained; no collections or existing functions were renamed or removed.

## Validation / rollout

- Not deployed to Firebase production. Review and test the rules in the Firebase Emulator before deployment.
- Regression test manually: with a test student, create enrollment; approve and assign a roll as owner; edit enrollment; verify the roll and approval state remain unchanged.
- The broader requested login, notification migration, admit-card release, export redesign, question-bank/review redesign, and full automated end-to-end flow are not completed by this patch. See the pull request checklist.


## 2026-10-15 — Roll allocation and truthful camera status

- Owner approval allocates five-digit `JAMBH-2026-XXXXX` rolls in a Firestore transaction using owner-protected `settings/rollCounter`; valid existing rolls are preserved. Legacy records still need a dedicated confirmed migration workflow and full test coverage.
- Owner Studio labels camera monitoring as unavailable and disables its toggle because real capture is not implemented.
- The emulator test suite now uses a parent Node test with explicit setup/reset/cleanup, fixing the CI error where the top-level `before` hook was undefined.


## 2026-10-15 — Notification history rendering

- Student notification listeners no longer require `createdAt` ordering or fixed query limits; records are sorted in the browser so older records without timestamps can still appear.
- Important and owner-pinned notifications sort above ordinary notifications; the previous render-time 100-item truncation and local read-marker truncation were removed.
- The underlying composer still uses the legacy public `notifications` and nested `userNotifications/{uid}/items` paths. Flat-schema notifications, event hooks, pagination controls and cross-device marker migration remain outstanding.


## 2026-10-15 — Admit-card release and notification hooks

- Added exam-type selection and cursor-paginated admit-card release. The owner UI reads up to 400 enrollment records per page; write batches process up to 200 students because each student needs an enrollment update plus a notification (within Firestore's 500-write batch limit).
- Each released enrollment stores `admitCardReleased`, `admitCardReleasedAt`, and a settings snapshot. A single student can be released by roll number; the older uploaded-PDF option remains.
- Student admit cards are rendered in the browser to a canvas and saved with jsPDF. A download action is available from the notification card, profile and enrollment status when release is active for that student.
- Added `pushNotification` helper calls for exam announcements/start scheduling, quiz publication, enrollment approval, result publication and admit-card release. Student notification history now initially displays 20 items with an “और दिखाएँ” button.
- Added an emulator rule test preventing students from self-setting the admit-card release flag. Final status depends on the current GitHub Actions workflow; these changes are not deployed.


## 2026-10-16 — Notification rendering and flat-schema compatibility
- Fixed the literal escaped newline that had joined the notification-card render call to a line comment. The render call was therefore commented out; the realtime listener could receive records without displaying them.
- Added flat `userNotifications/{notificationId}` documents with `uid` set to `ALL` or a recipient UID and fields `uid, type, title, body, important, pinnedByOwner, fileUrl, createdAt`.
- Added `notificationReads/{uid_notificationId}` markers with exactly `uid, notificationId, read, readAt`; students cannot delete them. Existing nested notification/read collections remain supported.
- Student UI listens to flat personal + ALL notices and read markers in real time; owner pushNotification writes both flat and legacy records.
- Root cause confirmed: the literal `\\n` in the source comment swallowed the render call. Live/emulator verification is still required.
- Real SMS OTP is not used by the mobile/password identity flow; Firebase Phone Auth SMS requires the Blaze plan.


## 2026-10-16 — Admit-card PDF and roll allocation follow-up
- Root cause: the owner-created enrollment path explicitly fell back to `BIS-<uid>` instead of calling the transactional `JAMBH-2026-XXXXX` allocator. It now saves the confirmed enrollment and allocates a counter-backed roll through `assignRealEnrollmentRoll`; existing valid JAMBH rolls are preserved.
- Added the owner-only `रोल नंबर नया बनाएँ (पुराने / खाली रोल)` tool. It scans enrollment records in cursor pages, confirms before changes, processes only confirmed records with missing/BIS rolls, reports progress and surfaces actual Firebase/error causes.
- Admit-card PDF generation now waits for browser fonts, validates the canvas/PDF blob, and triggers a direct Blob download through an anchor rather than relying on jsPDF's internal save path. Failures name the actual error code/message.
- These code changes are committed to `fix/enrollment-notifications-owner-workflows`. They are not live until that branch is deployed; Vercel status for the latest commit is still pending. No browser/emulator run has been completed in this environment.
## 2026-10-15 — Admit-card PDF and notification event hooks (follow-up branch)

- `script.js`
  - Added browser-generated Hindi-friendly admit-card PDF using html2canvas + jsPDF (image-based rendering).
  - Added profile and enrollment-status download controls plus a download action from the admit-card notification.
  - Added notification list “और दिखाएँ” display pagination, 📌 markers for important/pinned notices, and removed local read-marker truncation.
- `index.html`
  - Loaded html2canvas and jsPDF for client-side PDF generation; the new admit-card flow does not upload the PDF to Firebase Storage.
- `owner-studio.html`
  - Added an exam-type selector and made roll-number-based release the default; preserved the old Storage PDF upload under “उन्नत विकल्प”.
  - Bulk release uses cursor pagination over enrollment documents, pages of up to 400 students, and write batches of at most 400 operations (200 students per batch because each student needs two writes).
  - Writes per-student release flags and pinned notifications; shows progress, successes, and failed-batch counts.
  - Added `pushNotification(uid, data, batch)` and connected it to admit-card release, first enrollment approval, result publication, quiz publication, registration open/close, and exam-start events when the configured start time is already reached. Future timed-start alerts still require a trusted scheduled backend.
- `tests/firestore-rules.test.cjs`
  - Added tests for preserving an approved roll/status during student resubmission, owner-only admit-card release, and student denial of release flags.
- `IMPLEMENTATION_STATUS.md`
  - Updated the checklist to keep items Partly until CI and browser validation are complete.

### How to test

1. Run `npm run build` and `npm run lint`.
2. Run `npx firebase emulators:exec --only firestore "npm test"`.
3. In a test owner account, release to a test roll number and then release a test batch; verify per-student pinned notifications and progress counts.
4. In a test student account, open the notification, profile, and enrollment status; download a PDF with a Hindi name and confirm the name/roll/DOB/mobile/exam/date/instructions render correctly.
5. Confirm a student cannot set `admitCardReleased` or delete another notification.

### Verification status

- GitHub Actions Quality checks run #28 passed on application-code commit `6bda28e`: syntax check, CSS build, lint, and 10/10 emulator tests passed. The status/changelog documentation commits came afterward without changing application code. Real-browser PDF rendering is not covered by the Firestore Emulator and remains unverified live.


## 2026-10-16 — Notification rendering regression fix

- Fixed a literal escaped newline that caused the `renderNotificationCards(...)` call to be swallowed by the preceding JavaScript comment. The notification listeners could receive data without rendering cards.
- Added a regression test to ensure the render call remains a separate executable line. Admit-card PDF and Firebase live behavior still require real-browser verification.


## 2026-10-16 — Student roll number and admit-card access

- Hide legacy `BIS-...` internal IDs from student-facing roll-number text.
- Generate unique `JAMBH-2026-0001`-style rolls on owner approval with a minimum four-digit suffix and preserve existing valid rolls.
- Show the student's admit-card PDF download after approval and valid roll assignment; notification release remains a separate notification action.
- Add regression tests for roll display, approval gating, and roll-counter behavior.
- Live Firebase and browser PDF checks remain required; this is not a claim that every website feature is complete.


## 2026-10-17 — Startup reference error hotfix

- Root cause on `main`: `script.js:38` declared `portalSwitchTabImplementation` inside `exposeEarlyNavigation()`, but `script.js:347` assigned it from the separate main-portal IIFE. That assignment raised a `ReferenceError` and stopped startup before Firebase initialization and the real auth API assignments.
- Fix: the single top-level dispatcher now owns the shared implementation slot; the main portal assigns its full implementation through that slot. Tab hooks are isolated with `try/catch`.
- Early auth/profile/Google handlers now use a Firebase-readiness guard and safely fall back to the auth modal or Hindi loading toast.
- Startup initializes Firebase before feature modules, attaches real API methods before calling `initPortal`, isolates each feature setup with `safeStep`, and publishes `window.__bishnoiReady`.
- Removed duplicate `html2canvas` and `jsPDF` script loads from `index.html`; enabled ESLint `no-undef` as an error with explicit browser SDK globals.
- Added jsdom regression tests for no-app placeholders, one-time initialization, real auth/profile API attachment, runtime errors, and the single `window.switchTab` assignment. CI verification is pending.


- Follow-up CI fixes: removed two unmatched closing braces in `owner-studio.html` around the individual admit-card release handler and removed a duplicate `wasConfirmed` declaration in the enrollment-status save handler. The inline owner script now parses.
- Tightened the pre-initialization regression assertion to verify the auth modal's hidden class is actually removed.
