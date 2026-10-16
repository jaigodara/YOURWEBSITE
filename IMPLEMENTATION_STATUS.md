# Implementation status — requested final audit

This file deliberately distinguishes implemented code from items that still need work. A draft PR is not a production deployment.

## Checklist

| Area | Status | Notes |
|---|---|---|
| A1 enrollment payload / preserve approval and roll | Done (code patch) | Students no longer submit a roll number; create pending record, update editable fields only; rules restrict fields. Emulator test added. |
| A2 JAMBH-2026 counter / migrate legacy BIS rolls | Partly | Owner approval now allocates `JAMBH-2026-00001`-style five-digit rolls transactionally through `settings/rollCounter`, preserves valid existing rolls, and limits counter access to exam owners. Legacy migration is still not a separate paginated/confirmed tool; allocation scans existing enrollments and has not been emulator/live verified. |
| A3 profile mobile/village and admit-card button | Partly | Not changed in this patch; profile schema needs a separate UI/data mapping pass. |
| A4 resubmission regression | Done (test added) | Test asserts assigned roll and approval cannot be changed by a student. CI result is pending. |
| B1-B6 notification schema, real-time combined feed, unread/pin/pagination, event notifications and composer | Partly | `pushNotification` is wired for student exam start, quiz publication, first enrollment approval (stable notification ID), result publication and admit-card release; “और दिखाएँ” pagination is present. The owner helper now writes to Firestore batches synchronously, avoiding unawaited async permission failures. Existing legacy collections remain for compatibility; flat schema/read-marker migration and live validation remain incomplete. Latest-head CI is pending. |
| C1-C4 browser-generated admit card and release workflow | Done (code + emulator tests) | Implemented exam-type selector, 400-record cursor pages with safe 200-student Firestore write batches, per-student release fields and pinned notifications, single-roll release, browser html2canvas/jsPDF Hindi PDF, and download buttons in notification, profile and enrollment status. Emulator tests verify owner release permission, student release denial and owner pinned-notification creation. Build, lint and all 12 emulator tests passed on code commit `2c9abd5a`; live-browser/PDF rendering remains unverified. |
| D1-D4 mobile/password + Google linking and recovery | Not done | Requires auth UI, provider configuration and careful account-linking migration; not safe to implement as a hidden-email-only change without a complete account recovery design. |
| E1-E5 readable Excel/CSV/PDF, filters, complete backup inventory, owner checks | Not done | Existing export functions remain. No claim is made that exports are fixed. |
| F question bank pagination/search/duplicate/bulk controls | Not done | Existing question-bank UI remains. |
| G manual review and answers field compatibility | Partly | Early submission rule is fixed and a rules regression test is added. Submission payloads, legacy answer mapping, review UI, deduplication and query pagination are not changed. |
| H late student creation by mobile/email | Not done | Existing manual enrollment workflow remains. |
| I1 private daily quiz answer key | Partly | Existing private `examAnswerKeys` rule remains; publishing-time migration of daily quiz keys and server-side grading are not implemented. A student-read denial test is added for the existing private path. |
| I2 enrollment, early submit, notification marker, delete, answer-key and admit-card release rules tests | Partly | Added a regression test that students cannot set their own `admitCardReleased` field. Latest branch workflow still needs to complete successfully. Rules are proposed only and are not deployed. |
| I3 old audio/PDF records and playback loading/errors | Not done | Existing media behavior remains. |
| I4 camera proctoring truthfulness | Done (label only) | Owner UI now says “कैमरा निगरानी: उपलब्ध नहीं” and disables the misleading toggle; no camera capture is claimed. |
| I5 service-worker cleanup / no offline claim | Not changed | Existing cleanup is retained. No offline-support claim is made. |
| J lint/build/emulator tests/CI | Partly | Fixed the Node test lifecycle issue by running hooks within a parent `node:test` suite. Workflow must still complete successfully; no passing result is claimed yet. |
| CHANGELOG | Done | Added `CHANGELOG.md` with changes and manual regression steps. |

## Latest incremental changes

- Admit-card release is selectable by exam type and paginates through the full enrollment collection in 400-record cursor pages. Since each student requires two writes (enrollment release state + notification), writes are committed in groups of 200 students to stay under Firestore's 500-write batch limit.
- The browser generates a Hindi admit-card PDF using html2canvas and jsPDF; notification, profile and enrollment surfaces expose download actions only when that student's release flag is set.
- Added a single-student release action by roll number, preserving the existing PDF-upload option. Individual and batch releases now use the same ASCII exam key/date notification ID pattern, avoiding collisions caused by sanitizing Hindi exam titles.
- Added `pushNotification` calls for exam start, quiz publication, first enrollment approval, result publication and admit-card release. Batch writes are queued synchronously into Firestore batches; enrollment approval notices use stable IDs. Notification list initially shows 20 items and offers “और दिखाएँ”.
- These changes remain marked Partly until the latest workflow completes; no live-site test is claimed.


- Owner roll allocation now uses `settings/rollCounter`, generates five digits, requires confirmed enrollment, and never replaces a valid existing roll. The old `counters/rollNumbers` path is no longer used by this allocator.
- Camera toggle is disabled and clearly marked unavailable because the site does not implement real capture.
- The initial CI failure was caused by unavailable top-level `before`/`after` hooks in the test runtime. Tests were moved into a parent test suite with explicit setup/reset/cleanup.

## Notification rendering root-cause finding

The existing source was listening to `notifications` and `userNotifications/{uid}/items` with `orderBy('createdAt')` and fixed limits. A missing `createdAt` field can exclude older records, and a missing composite/single-field index or denied query can stop a listener; the previous error callback cleared the visible list, making the section look empty. This patch removes those `orderBy` and fixed query limits and sorts in memory, so it avoids that index dependency and renders records without a 100-card cut-off. The composer and rules still use the legacy two-collection schema; the requested flat `userNotifications/{id}` plus `notificationReads/{uid_notificationId}` schema and event hooks are not complete.

## Required verification before production

1. Review this branch and run the GitHub Actions workflow to completion.
2. Test with one test owner and one test student in the Firebase Emulator.
3. Inspect deployed Firestore rules and indexes before deployment.
4. Do not merge or deploy until the remaining checklist items are implemented and tested.


## 2026-10-16 follow-up status
- G1: Partly — fixed the render call and added flat-schema listeners, owner helper dual writes, strict read-marker rules, and emulator tests. Composer migration, all event hooks, roll migration UI, cursor-backed pagination, and latest CI/live verification remain incomplete.
- G2: Partly — browser PDF/release flows exist, but live PDF rendering and latest test verification are not confirmed.
- G3–G7: Partly / Not done — full submission/review redesign, private quiz-key migration, mobileIndex/profile security, exports/backup, question-bank redesign, late-student workflow, media fallbacks, and hidden-email mobile/password + Google linking are not verified complete.
