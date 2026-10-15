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
