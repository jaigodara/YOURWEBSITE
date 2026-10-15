# Implementation status — requested final audit

This file deliberately distinguishes implemented code from items that still need work. A draft PR is not a production deployment.

## Checklist

| Area | Status | Notes |
|---|---|---|
| A1 enrollment payload / preserve approval and roll | Done (code patch) | Students no longer submit a roll number; create pending record, update editable fields only; rules restrict fields. Emulator test added. |
| A2 JAMBH-2026 counter / migrate legacy BIS rolls | Partly | Counter reads are owner-only now; unique transactional assignment and migration UI are not implemented yet. Do not deploy expecting roll assignment to work automatically. |
| A3 profile mobile/village and admit-card button | Partly | Not changed in this patch; profile schema needs a separate UI/data mapping pass. |
| A4 resubmission regression | Done (test added) | Test asserts assigned roll and approval cannot be changed by a student. CI result is pending. |
| B1-B6 notification schema, real-time combined feed, unread/pin/pagination, event notifications and composer | Partly | Existing site uses legacy public `notifications` and nested `userNotifications/{uid}/items`; the proposed flat `userNotifications/{id}` schema is not wired end-to-end. Do not migrate collection schema until a compatibility adapter and rules tests are ready. |
| C1-C4 browser-generated admit card and release workflow | Partly | Existing print flow remains. Batch release, PDF generation with embedded Hindi-capable rendering, progress/failure summary and roll-number send flow are not implemented here. |
| D1-D4 mobile/password + Google linking and recovery | Not done | Requires auth UI, provider configuration and careful account-linking migration; not safe to implement as a hidden-email-only change without a complete account recovery design. |
| E1-E5 readable Excel/CSV/PDF, filters, complete backup inventory, owner checks | Not done | Existing export functions remain. No claim is made that exports are fixed. |
| F question bank pagination/search/duplicate/bulk controls | Not done | Existing question-bank UI remains. |
| G manual review and answers field compatibility | Partly | Early submission rule is fixed and a rules regression test is added. Submission payloads, legacy answer mapping, review UI, deduplication and query pagination are not changed. |
| H late student creation by mobile/email | Not done | Existing manual enrollment workflow remains. |
| I1 private daily quiz answer key | Partly | Existing private `examAnswerKeys` rule remains; publishing-time migration of daily quiz keys and server-side grading are not implemented. A student-read denial test is added for the existing private path. |
| I2 enrollment, early submit, notification marker, delete and answer-key rules tests | Partly | Emulator tests added for these cases; results have not yet run in this environment. Rules are proposed only and are not deployed. |
| I3 old audio/PDF records and playback loading/errors | Not done | Existing media behavior remains. |
| I4 camera proctoring truthfulness | Not done | Must be relabelled unavailable or implemented in a separate, consent-based feature patch. |
| I5 service-worker cleanup / no offline claim | Not changed | Existing cleanup is retained. No offline-support claim is made. |
| J lint/build/emulator tests/CI | Partly | Added ESLint configuration, npm scripts, Firebase Emulator configuration, regression tests and GitHub Actions workflow. The workflow must run on the PR; no passing result is claimed yet. |
| CHANGELOG | Done | Added `CHANGELOG.md` with changes and manual regression steps. |

## Notification rendering root-cause finding

The current source does not use the single flat collection proposed in the request. It listens to the public `notifications` collection and, separately, the legacy nested path `userNotifications/{uid}/items`. The rules also target those different paths. Code that writes `userNotifications/{id}` or `notificationReads/{uid_id}` will not appear in the current renderer without a migration/compatibility layer. This schema mismatch is a concrete integration risk; it is not evidence that every notification failure has the same cause. Index errors and live listener failures still require checking the browser console and deployed rules.

## Required verification before production

1. Review this branch and run the GitHub Actions workflow to completion.
2. Test with one test owner and one test student in the Firebase Emulator.
3. Inspect deployed Firestore rules and indexes before deployment.
4. Do not merge or deploy until the remaining checklist items are implemented and tested.
