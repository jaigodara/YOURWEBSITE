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

- Latest-head GitHub Actions is pending. Real-browser PDF rendering is not covered by the Firestore Emulator; no claim is made that it has been tested live.
