# Phase 7 Manual Guide (RENTEASE)

This guide is for manual execution of Phase 7 only.  
Goal: finalize the project package for submission/demo and prepare a clean defense runbook.

## Phase 7 Scope

Phase 7 focuses on the final packaging requirements from `roadmap.md`.

Core tasks:
- Seed demo-ready data
- Write/complete `README.md`
- Export final SQL dump
- Prepare defense walkthrough sequence

Primary finalization areas:
- Demo data coverage across all role workflows
- Complete and accurate technical documentation
- Reproducible database backup for evaluator setup
- Structured defense flow with fallback plans

## Before You Start

1. Confirm Phase 6 status is stable:
   - Reports, logs viewer, and feedback features are working
   - No critical frontend/backend security issues remain
2. Start required services:
   - XAMPP `Apache`
   - XAMPP `MySQL`
   - Frontend server if demo rehearsal is browser-based
3. Confirm all required role accounts exist and are login-ready:
   - `seeker`
   - `parent`
   - `owner`
   - `admin`
4. Create a temporary backup before final edits/seed:
   - Current SQL export
   - Current frontend/backend source snapshot

## Step 1: Lock Phase 7 Delivery Targets

Define what "complete" means before preparing artifacts.

Minimum target outputs:
1. Demo database supports full end-to-end scenario
2. `README.md` is complete enough for clean local setup and evaluator use
3. Final SQL dump is exported and validated
4. Defense walkthrough sequence is documented and rehearsal-ready

Manual rule:
- Do not finalize SQL dump before demo data and README are complete.

## Step 2: Seed Demo-Ready Data

Prepare realistic records that support an uninterrupted walkthrough.

Required demo data coverage:
1. User roles:
   - At least one active account per role
2. Room and occupancy coverage:
   - Multiple rooms with mixed statuses (`available`, `occupied`, `unavailable`)
3. Reservation states:
   - `pending`, `approved`, and `rejected` examples
4. Payment states:
   - `paid` and `unpaid` records across at least two billing periods
5. Logs and feedback:
   - Activity log entries from multiple modules
   - Error log samples (safe, non-sensitive)
   - Feedback entries with varied ratings/status

Seed quality checks:
- Data relationships are valid (no orphan foreign keys).
- Dashboard totals/reports match seeded records.
- No placeholder garbage data appears in visible UI.

## Step 3: Complete `README.md`

Finalize documentation for setup, usage, and evaluation.

Minimum README sections:
1. Project overview and objective
2. Tech stack (frontend/backend/database)
3. Local setup prerequisites
4. Installation and run steps:
   - backend under XAMPP
   - frontend `npm install` + `npm run dev`
   - environment variables/config expectations
5. Database setup:
   - import final SQL dump
   - required DB user/credentials
6. Role accounts for demo/testing
7. API/feature summary by module
8. Known limitations and assumptions
9. Suggested demo flow summary

Documentation quality rule:
- Instructions must be executable by a reviewer without verbal clarification.

## Step 4: Export Final SQL Dump

Produce the official database artifact for submission.

Final SQL export requirements:
1. Includes schema and demo data
2. Restorable on a clean MySQL instance
3. Uses stable naming convention (example: `rentease_final_phase7.sql`)
4. Stored in project location referenced by README

Validation steps:
1. Create a fresh test database
2. Import final SQL dump
3. Verify key tables and sample records load successfully
4. Run smoke checks for auth and dashboard data visibility

Manual rule:
- A dump is not final unless restore testing succeeds.

## Step 5: Prepare Defense Walkthrough Sequence

Document a clear demo script from setup to feature proof.

Recommended defense flow:
1. Project overview and architecture (short)
2. Login and RBAC demonstration across roles
3. Core business flow:
   - seeker/parent reservation
   - owner decision/payment
   - admin monitoring/reports
4. Phase 6 completion highlights:
   - reports
   - logs viewer
   - feedback
   - security handling (`401/403`)
5. Finalization artifacts:
   - README
   - SQL dump
   - demo data readiness

Defense prep checklist:
- Prepare backup account credentials.
- Prepare fallback path if one flow fails live.
- Time-box full demo to target duration.

## Step 6: Run Phase 7 Verification Matrix

Execute final verification before packaging.

1. Start from clean session and login per role.
2. Confirm seeded data appears correctly on each dashboard.
3. Confirm reports/logs/feedback screens are populated with demo data.
4. Validate README setup steps on a clean environment path.
5. Import final SQL dump into a fresh database and retest basic flows.
6. Rehearse defense walkthrough end-to-end once without edits.
7. Confirm final artifact filenames/paths are consistent in docs.

## Phase 7 Completion Checklist

- [ ] Demo-ready data seeded and validated
- [ ] Role-based demo accounts verified
- [ ] `README.md` completed and reviewed
- [ ] Setup/run steps in README tested
- [ ] Final SQL dump exported
- [ ] Final SQL dump restore-tested on clean database
- [ ] Defense walkthrough sequence documented
- [ ] Full rehearsal run completed
- [ ] Submission package artifacts organized
- [ ] Phase 7 status stable

## Footprint Log Template (For Documentation/Defense)

Fill this while doing Phase 7 manually:

- Confirmed Phase 6 stable baseline (`yes/no`)
- Seeded demo users/rooms/reservations/payments/logs/feedback (`yes/no`)
- Verified dashboard/report totals against demo data (`yes/no`)
- Completed `README.md` (`yes/no`)
- Validated README setup steps on clean path (`yes/no`)
- Exported final SQL dump (`yes/no`)
- Restore-tested final SQL dump (`yes/no`)
- Prepared defense walkthrough script (`yes/no`)
- Rehearsed full defense flow (`yes/no`)
- Final Phase 7 status: `complete/incomplete`

## Common Phase 7 Issues

- Demo fails due to missing records:
  - Seed set does not cover all required status combinations.

- README is complete but not executable:
  - Steps are descriptive but missing exact commands/paths.

- Final SQL dump imports with errors:
  - Export omitted dependent tables or includes mismatched constraints.

- Defense run exceeds allotted time:
  - Flow lacks sequence discipline or contains unnecessary detours.

- Live demo blocks on one account/session:
  - No backup credentials or fallback route prepared.
