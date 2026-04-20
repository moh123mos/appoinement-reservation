# Implementation Plan - Appointment Reservations SaaS

## 1) Project Status Snapshot

### Current Phase
- Phase 5 - Auth, Roles, and Security (In Progress)

### Completed Phases
- [x] Phase 0 - Bootstrap and Initial Vertical Slice
  - [x] Next.js + Tailwind scaffold completed
  - [x] Convex installed and scripts configured
  - [x] Initial Convex schema created
  - [x] Initial appointment and scheduling functions added
  - [x] Convex provider wired in layout
  - [x] Core pages implemented: /, /book, /staff/dashboard
  - [x] Lint and build passed
- [x] Phase 1 - Foundation Hardening
  - [x] Convex environment templates and env verification script added
  - [x] Convex functions switched to generated typed APIs
  - [x] Centralized app config for locale/timezone/slot defaults
  - [x] Reusable booking/date/time validation layer added
  - [x] Deterministic demo seed pipeline created and validated
  - [x] Standardized backend/frontend error handling introduced
  - [x] Loading/empty/error UI states added for book and dashboard routes
- [x] Phase 2 - Live Patient Booking Flow
  - [x] /book connected to live available slots query from Convex
  - [x] Booking submit connected to createAppointment mutation
  - [x] Conflict handling UI added when slot becomes unavailable
  - [x] Confirmation reference persisted and shown in final success state
  - [x] Booking constraints enforced for date/slot/email/phone
  - [x] Anti-duplicate booking logic enabled
  - [x] Utility tests added for time and slot validation logic
- [x] Phase 3 - Staff Dashboard Operations
  - [x] Dashboard filters added (date, status, source, doctor)
  - [x] Cancel action added with required cancellation reason
  - [x] No-show transition action added from the table
  - [x] Quick patient search added by phone/email
  - [x] Status transition controls exposed in table actions
  - [x] Optimistic updates with rollback enabled for failed actions
- [x] Phase 4 - Waitlist and Reminder Automation
  - [x] addWaitlistEntry integrated in patient and staff flows
  - [x] Waitlist prioritization implemented (date preference then FIFO)
  - [x] Cancellation now triggers waitlist candidate selection
  - [x] Notification logs created for reminder_24h and reminder_3h
  - [x] Reminder scheduler windows implemented
  - [x] Retry and failure handling added for notification dispatch
  - [x] No-show auto-mark scheduler after grace window added

### Next Phase
- Phase 6 - QA, UAT, and Pilot Launch

## 2) Objective

Build and launch an MVP for doctor appointment booking using:
- Frontend: Next.js (App Router)
- Styling: Tailwind CSS v4
- Backend: Convex

Primary MVP value:
- Fast patient booking (guest-friendly)
- Clear staff operations dashboard
- Reliable scheduling with conflict prevention
- Reminder-ready architecture (SMS/Email)

## 3) Confirmed MVP Scope

### Included in MVP
- [x] Web responsive application
- [x] Single clinic deployment with multi-tenant-ready data design
- [x] In-person appointments only
- [x] 15-minute slot scheduling design
- [x] Booking by patient, receptionist, and doctor (domain-level)
- [x] Guest booking with optional account direction
- [x] Required booking fields: name, phone, email
- [x] Automatic appointment confirmation design
- [x] No-show full automation in production flow
- [x] Waitlist full production flow
- [ ] Arabic + English full UX implementation

### Out of MVP Scope
- [x] Video consultations
- [x] Insurance integration
- [x] In-app online payments
- [x] EMR/EHR integrations
- [x] Native mobile apps

## 4) Phase-by-Phase Plan with Checkboxes

## Phase 1 - Foundation Hardening (Completed)
Goal: Make current codebase production-ready for iterative delivery.

Tasks:
- [x] Initialize Convex environments (dev/staging/prod) and verify NEXT_PUBLIC_CONVEX_URL per environment.
- [x] Run Convex dev setup and ensure generated typed APIs are used by functions.
- [x] Add centralized app config for clinic defaults, locale, slot duration, timezone.
- [x] Add reusable validation layer for booking input and date/time parsing.
- [x] Create seed pipeline for demo tenant, clinic, doctor, schedule, sample patients.
- [x] Add standardized error-handling strategy for server and client messages.
- [x] Add loading, empty, and error UI states for booking and dashboard pages.

Deliverables:
- [x] Stable development baseline
- [x] Repeatable local setup
- [x] Deterministic demo dataset

Definition of Done:
- [x] New developer can run app and seed data in less than 10 minutes.
- [x] All Phase 1 updates pass lint and build.

## Phase 2 - Live Patient Booking Flow (Completed)
Goal: Replace mock behavior with real Convex data flow.

Tasks:
- [x] Connect /book page to live available slots query from Convex.
- [x] Connect booking form submit to createAppointment mutation.
- [x] Add conflict handling UI when a slot becomes unavailable.
- [x] Persist confirmation reference and display final success state.
- [x] Add constraints: prevent past booking, validate slot bounds, validate email and phone.
- [x] Add anti-duplicate booking logic (same patient, same slot).
- [x] Add tests for time and slot utility logic.

Deliverables:
- [x] End-to-end live booking
- [x] Conflict-safe booking UX

Definition of Done:
- [x] Booking appears immediately in dashboard data.
- [x] Conflict attempts return clear errors without duplicates.

## Phase 3 - Staff Dashboard Operations (Completed)
Goal: Make staff dashboard operational with live data and actions.

Tasks:
- [x] Replace dashboard mock data with live schedule and appointments.
- [x] Add filters for date, status, source, and doctor.
- [x] Add cancelAppointment action with cancellation reason.
- [x] Add markAppointmentNoShow action in table.
- [x] Add quick patient search by phone/email.
- [x] Add status transitions and action controls in UI.
- [x] Add optimistic updates with rollback on failure.

Deliverables:
- [x] Functional staff dashboard
- [x] Operational appointment lifecycle controls

Definition of Done:
- [x] Staff can view, cancel, and mark no-show reliably.
- [x] Actions reflect in UI and Convex without refresh issues.

## Phase 4 - Waitlist and Reminder Automation (Completed)
Goal: Implement workflow automation for cancellations and reminders.

Tasks:
- [x] Implement addWaitlistEntry in patient and staff flow.
- [x] Build waitlist prioritization rules (FIFO with optional date preference).
- [x] Trigger waitlist candidate selection on cancellation.
- [x] Add notification log entries for reminder_24h and reminder_3h.
- [x] Add scheduler functions for reminder dispatch windows.
- [x] Add retry and failure handling for notification sending.
- [x] Add no-show auto-mark scheduler after grace window.

Deliverables:
- [x] Cancellation-to-waitlist recovery flow
- [x] Reminder scheduling framework

Definition of Done:
- [x] Cancelled slot can be offered to waitlist candidate.
- [x] Reminder records are scheduled and auditable.

## Phase 5 - Auth, Roles, and Security
Goal: Enforce role-based access and data isolation.

Tasks:
- [x] Implement auth strategy for patient and staff.
- [x] Add role guards for patient/receptionist/doctor/owner actions.
- [x] Enforce tenant scoping on core Convex booking/waitlist/scheduling flows.
- [x] Add audit logs for create/cancel/no-show/waitlist/reminder actions.
- [x] Add rate limiting policy for booking and waitlist actions.
- [x] Add privacy-safe logging conventions.
- [ ] Complete security checklist before staging release (draft/security-checklist.md created; staging auth vars pending).

Deliverables:
- [x] Role-aware and tenant-safe workflows
- [x] Action traceability

Definition of Done:
- [x] Unauthorized roles cannot execute restricted actions.
- [x] Cross-tenant access is blocked in tested paths.

## Phase 6 - QA, UAT, and Pilot Launch
Goal: Validate reliability and launch pilot.

Tasks:
- [ ] Build end-to-end test matrix for booking lifecycle scenarios.
- [ ] Add regression checklist for Arabic/English and RTL/LTR rendering.
- [ ] Validate performance of daily schedule queries under realistic load.
- [ ] Run staging UAT with pilot clinic workflow.
- [ ] Collect pilot feedback and prioritize bug fixes.
- [ ] Prepare release notes and rollback plan.
- [ ] Launch production pilot with monitoring dashboard.

Deliverables:
- [ ] Staging sign-off
- [ ] Production pilot release

Definition of Done:
- [ ] Core booking lifecycle passes UAT.
- [ ] Pilot clinic can operate daily scheduling without blockers.

## 5) Sprint Timeline (Suggested)

- [x] Sprint 1: Phase 1
- [x] Sprint 2: Phase 2
- [x] Sprint 3: Phase 3
- [x] Sprint 4: Phase 4
- [ ] Sprint 5: Phase 5
- [ ] Sprint 6: Phase 6 and pilot launch

## 6) Ownership Model

- [ ] Frontend owner: pages, components, forms, UX states, i18n behavior
- [ ] Backend owner: Convex schema/functions/schedulers, data rules, audit, roles
- [ ] QA owner: scenario coverage, regression, UAT support, release gate checks

## 7) Immediate Execution Queue (Actionable)

- [x] Configure Convex environments and generated types.
- [x] Add seed data flow for tenant, clinic, doctor, and schedule.
- [x] Wire /book to live slots query.
- [x] Wire booking submit to createAppointment mutation.
- [x] Replace /staff/dashboard mock table with live appointment query.
- [x] Add cancel and no-show actions in dashboard.
- [ ] Add happy-path test: book -> appears in dashboard -> cancel.

## 8) MVP Success Metrics

- [ ] Booking completion rate from /book
- [ ] Conflict error rate during peak booking
- [ ] No-show visibility and trend in dashboard
- [ ] Mean time to schedule and cancel by staff
- [ ] Reminder delivery success rate
- [ ] Weekly pilot clinic satisfaction feedback
