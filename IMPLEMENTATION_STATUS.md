# Implementation status — requested final audit

This file deliberately distinguishes implemented code from items that still need work. A draft PR is not a production deployment.

## Checklist

| Area | Status | Notes |
|---|---|---|
| A1 enrollment payload / preserve approval and roll | Done (code patch) | Students no longer submit a roll number; create pending record, update editable fields only; rules restrict fields. Emulator test added. |
| A2 JAMBH-2026 counter / migrate legacy BIS rolls | Partly | Owner approval allocates unique `JAMBH-2026-0001`-style rolls transactionally through `settings/rollCounter`, preserves valid existing rolls, and treats four digits as a minimum width. Legacy migration is still not a separate paginated/confirmed tool; allocation scans existing enrollments and needs live verification. |
| A3 profile mobile/village and admit-card button | Partly | Internal `BIS-...` values are no longer displayed as student roll numbers. After owner approval assigns a valid `JAMBH-2026-####` roll, the student can download a browser-generated PDF from profile or enrollment status without waiting for a separate bulk notification release. Mobile/village persistence and live PDF rendering still need browser verification. |
| A4 resubmission regression | Done (test added) | Test asserts assigned roll and approval cannot be changed by a student; CI run #28 passed. |
| B1-B6 notification schema, real-time combined feed, unread/pin/pagination, event notifications and composer | Partly | Fixed a confirmed JavaScript comment/newline bug that commented out `renderNotificationCards`, which could leave the notification panel empty even when Firestore data arrived. Added a regression test for this exact failure. Existing “और दिखाएँ”, pinned ordering and event hooks remain. Flat schema/read-marker migration and live browser verification remain incomplete; do not mark fully Done until the new CI run passes. |
| C1-C4 browser-generated admit card and release workflow | Partly | Added an explicit exam-type selector, cursor-paginated release (400 student page; write batches capped at 400 operations), per-student release fields and pinned notification, progress/failure counts, single-roll release, and browser PDF via html2canvas + jsPDF. Student profile, enrollment status and notification cards link to download. The notification renderer had a source-level newline bug that could suppress card rendering; a regression fix/test is now in this follow-up branch. Actual Hindi PDF rendering/download and live Firebase behavior still need a browser test. Storage is no longer required by the new flow. |
| D1-D4 mobile/password + Google linking and recovery | Not done | Requires auth UI, provider configuration and careful account-linking migration; not safe to implement as a hidden-email-only change without a complete account recovery design. |
| E1-E5 readable Excel/CSV/PDF, filters, complete backup inventory, owner checks | Not done | Existing export functions remain. No claim is made that exports are fixed. |
| F question bank pagination/search/duplicate/bulk controls | Not done | Existing question-bank UI remains. |
| G manual review and answers field compatibility | Partly | Early submission rule is fixed and a rules regression test is added. Submission payloads, legacy answer mapping, review UI, deduplication and query pagination are not changed. |
| H late student creation by mobile/email | Not done | Existing manual enrollment workflow remains. |
| I1 private daily quiz answer key | Partly | Existing private `examAnswerKeys` rule remains; publishing-time migration of daily quiz keys and server-side grading are not implemented. A student-read denial test is added for the existing private path. |
| I2 enrollment, early submit, notification marker, delete and answer-key rules tests | Partly | Added tests for owner admit-card release and student denial, plus a regression assertion that resubmission cannot change roll/approval. Existing enrollment, early-submit, read-marker, delete-denial and private-answer-key tests remain. CI run #28 passed all 10 test assertions; rules are not deployed. |
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
- Latest-head CI run #33 passed: JavaScript syntax check, Tailwind build, ESLint, and Firestore Emulator tests (10 passed, 0 failed). The feature remains Partly until live browser PDF rendering and the end-to-end Firebase workflow are verified.

## Notification rendering root-cause finding

The existing source was listening to `notifications` and `userNotifications/{uid}/items` with `orderBy('createdAt')` and fixed limits. A missing `createdAt` field can exclude older records, and a missing composite/single-field index or denied query can stop a listener; the previous error callback cleared the visible list, making the section look empty. This patch removes those `orderBy` and fixed query limits and sorts in memory, so it avoids that index dependency and renders records without a 100-card cut-off. The composer and rules still use the legacy two-collection schema; the requested flat `userNotifications/{id}` plus `notificationReads/{uid_notificationId}` migration remains incomplete. Event hooks are present for the scoped events listed in B1-B6, but future timed-start alerts still need a trusted scheduled backend.

## Required verification before production

1. Review the passing [Quality checks run #28](https://github.com/jaigodara/YOURWEBSITE/actions/runs/38756988530); rerun CI after any application-code changes.
2. Test with one test owner and one test student in the live browser flow, especially the Hindi PDF download and notification actions.
3. Inspect deployed Firestore rules and indexes before deployment; no rules have been deployed by this work.
4. Do not merge or deploy until the remaining checklist items are implemented and tested.


## CI evidence

- Workflow: [Quality checks run #33](https://github.com/jaigodara/YOURWEBSITE/actions/runs/38757357055)
- Tested branch head: `3fab2299757577df966b215be428e1da920ef6d9`.
- Result: success — `node --check script.js`, `npm run build`, `npm run lint`, and `npx firebase emulators:exec --only firestore "npm test"`.
- Emulator test output: `# tests 10`, `# pass 10`, `# fail 0`, `# skipped 0`.
- Build output: `Done in 108ms`. ESLint exited successfully. Real-browser PDF rendering and live Firebase flow remain unverified.


## 2026-10-16 — Notification render-load regression fix

- Found a literal escaped newline in the notification render comment. It placed the `renderNotificationCards(...)` call inside a `//` comment, so Firestore listeners could receive data while the list remained blank.
- Fixed the source to put the render call on a real new line and added a source regression test. The item remains Partly until CI passes and real-browser rendering is verified.


## 2026-10-16 — Student roll display and admit-card access follow-up

- Student-facing enrollment status now displays only a valid `JAMBH-2026-` roll; legacy `BIS-...` internal identifiers are shown as “जारी होना बाकी”.
- Owner approval creates a transactionally sequenced roll with a minimum four-digit suffix (for example, `JAMBH-2026-0001`); existing valid rolls are preserved.
- Once enrollment is confirmed and a valid roll exists, the student can download the browser-generated admit-card PDF from the profile/enrollment area. Notification release remains responsible for notifying students, not for hiding the download control.
- Added source regression tests. Live Firestore approval, Hindi PDF rendering, and actual student-browser download still require manual verification after deployment.
