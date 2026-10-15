# Implementation status — requested final audit

This file deliberately distinguishes implemented code from items that still need work. A draft PR is not a production deployment.

## Checklist

| Area | Status | Notes |
|---|---|---|
| A1 enrollment payload / preserve approval and roll | Done (code patch) | Students no longer submit a roll number; create pending record, update editable fields only; rules restrict fields. Emulator test added. |
| A2 JAMBH-2026 counter / migrate legacy BIS rolls | Partly | Owner approval now allocates `JAMBH-2026-00001`-style five-digit rolls transactionally through `settings/rollCounter`, preserves valid existing rolls, and limits counter access to exam owners. Legacy migration is still not a separate paginated/confirmed tool; allocation scans existing enrollments and has not been emulator/live verified. |
| A3 profile mobile/village and admit-card button | Partly | Added an admit-card status/download panel to the profile and enrollment status, using the existing enrollment field names. Mobile/village persistence remains unverified and is not changed here. |
| A4 resubmission regression | Done (test added) | Test asserts assigned roll and approval cannot be changed by a student. CI result is pending. |
| B1-B6 notification schema, real-time combined feed, unread/pin/pagination, event notifications and composer | Partly | Added visible “और दिखाएँ” paging, 📌 for pinned/important items, and a `pushNotification(uid, data, batch)` helper wired to admit-card release, first enrollment approval, result publication, quiz publication, registration open/close, and exam schedule changes. An “exam-start” notification is emitted when an owner saves a start time that is already reached; future timed starts still need a trusted scheduled backend. The helper intentionally preserves existing public `notifications` and nested `userNotifications/{uid}/items` paths for backward compatibility. Flat schema, `notificationReads/{uid_notificationId}` migration, actual timed-start notifications and end-to-end validation remain incomplete. |
| C1-C4 browser-generated admit card and release workflow | Partly | Added an explicit exam-type selector, cursor-paginated release (400 student page; write batches capped at 400 operations), per-student release fields and pinned notification, progress/failure counts, single-roll release, and browser PDF via html2canvas + jsPDF. Student profile, enrollment status and notification cards link to download. Firestore Emulator release-permission tests pass and exam-type filtering is in code; actual Hindi PDF rendering/download and live Firebase behavior still need a browser test. Storage is no longer required by the new flow. |
| D1-D4 mobile/password + Google linking and recovery | Not done | Requires auth UI, provider configuration and careful account-linking migration; not safe to implement as a hidden-email-only change without a complete account recovery design. |
| E1-E5 readable Excel/CSV/PDF, filters, complete backup inventory, owner checks | Not done | Existing export functions remain. No claim is made that exports are fixed. |
| F question bank pagination/search/duplicate/bulk controls | Not done | Existing question-bank UI remains. |
| G manual review and answers field compatibility | Partly | Early submission rule is fixed and a rules regression test is added. Submission payloads, legacy answer mapping, review UI, deduplication and query pagination are not changed. |
| H late student creation by mobile/email | Not done | Existing manual enrollment workflow remains. |
| I1 private daily quiz answer key | Partly | Existing private `examAnswerKeys` rule remains; publishing-time migration of daily quiz keys and server-side grading are not implemented. A student-read denial test is added for the existing private path. |
| I2 enrollment, early submit, notification marker, delete and answer-key rules tests | Partly | Added tests for owner admit-card release and student denial, plus a regression assertion that resubmission cannot change roll/approval. Existing enrollment, early-submit, read-marker, delete-denial and private-answer-key tests remain. Emulator results are pending; rules are not deployed. |
| I3 old audio/PDF records and playback loading/errors | Not done | Existing media behavior remains. |
| I4 camera proctoring truthfulness | Done (label only) | Owner UI now says “कैमरा निगरानी: उपलब्ध नहीं” and disables the misleading toggle; no camera capture is claimed. |
| I5 service-worker cleanup / no offline claim | Not changed | Existing cleanup is retained. No offline-support claim is made. |
| J lint/build/emulator tests/CI | Partly | GitHub Actions Quality checks passed on code commit `6bda28e`: `node --check script.js`, Tailwind build, ESLint, and Firestore Emulator tests (10 passed, 0 failed). Full live end-to-end flow and browser PDF test remain unverified. |
| CHANGELOG | Done | Added `CHANGELOG.md` with changes and manual regression steps. |

## Latest incremental changes

- Owner roll allocation now uses `settings/rollCounter`, generates five digits, requires confirmed enrollment, and never replaces a valid existing roll. The old `counters/rollNumbers` path is no longer used by this allocator.
- Camera toggle is disabled and clearly marked unavailable because the site does not implement real capture.
- The initial CI failure was caused by unavailable top-level `before`/`after` hooks in the test runtime. Tests were moved into a parent test suite with explicit setup/reset/cleanup.

## Latest scoped admit-card and notification work (branch: `fix/admit-card-notifications-v2`)

- `script.js`: added browser PDF generation with html2canvas/jsPDF, profile/enrollment download controls, notification-card download action, pinned badge, “और दिखाएँ” pagination, and removed local read-marker truncation.
- `index.html`: loads html2canvas and jsPDF for browser-side PDF rendering.
- `owner-studio.html`: replaces the individual file-upload UI with roll-number release; bulk release paginates through enrollment documents in pages of 400 and commits at most 400 writes per batch; release fields and a pinned notification are written per eligible student. A batch failure is counted without falsely counting its students as released. Added `pushNotification` calls for admit-card release, enrollment approval, published result, quiz publication, and schedule/registration changes.
- `tests/firestore-rules.test.cjs`: added regression checks for preserving approval/roll on resubmission and owner-only admit-card release.
- Latest-head CI is running. Do not mark these scoped changes Done until the branch CI syntax check, build, lint, and Firestore Emulator tests pass. Browser PDF rendering is not exercised by the Firestore Emulator.

## Notification rendering root-cause finding

The existing source was listening to `notifications` and `userNotifications/{uid}/items` with `orderBy('createdAt')` and fixed limits. A missing `createdAt` field can exclude older records, and a missing composite/single-field index or denied query can stop a listener; the previous error callback cleared the visible list, making the section look empty. This patch removes those `orderBy` and fixed query limits and sorts in memory, so it avoids that index dependency and renders records without a 100-card cut-off. The composer and rules still use the legacy two-collection schema; the requested flat `userNotifications/{id}` plus `notificationReads/{uid_notificationId}` schema and event hooks are not complete.

## Required verification before production

1. Review this branch and run the GitHub Actions workflow to completion.
2. Test with one test owner and one test student in the Firebase Emulator.
3. Inspect deployed Firestore rules and indexes before deployment.
4. Do not merge or deploy until the remaining checklist items are implemented and tested.


## CI evidence

- Workflow: [Quality checks run #28](https://github.com/jaigodara/YOURWEBSITE/actions/runs/38756988530)
- Tested code commit: `6bda28e856a4de56ff004a006ed91f91a43e4d7c`.
- Result: success — `node --check script.js`, `npm run build`, `npm run lint`, and `npx firebase emulators:exec --only firestore "npm test"`.
- Emulator test output: `# tests 10`, `# pass 10`, `# fail 0`.
- The status/changelog documentation commits after this tested code commit do not change application code. Real-browser PDF rendering and live Firebase flow remain unverified.
