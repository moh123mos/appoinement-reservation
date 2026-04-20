# Security Checklist - Staging Gate

## Auth And Identity
- [x] Convex auth config scaffold exists in convex/auth.config.ts.
- [x] Backend identity resolution uses ctx.auth.getUserIdentity().
- [x] Identity is mapped via users.tokenIdentifier.
- [ ] Staging JWT provider values set: CONVEX_AUTH_ISSUER_URL and CONVEX_AUTH_APPLICATION_ID.

## Authorization
- [x] Role guards applied to staff schedule/waitlist/operations.
- [x] Source-to-role validation applied in createAppointment and addWaitlistEntry.
- [x] Tenant and clinic scope checks applied before sensitive writes.

## Data Safety
- [x] Audit logs created for booking lifecycle and reminders.
- [x] Audit metadata is privacy-safe (masked phone/email).
- [x] Rate limiting exists for booking and waitlist actions.

## Verification
- [x] Unit tests cover unauthorized access rejection.
- [x] Unit tests cover cross-tenant access rejection.
- [x] Build/lint/test/codegen run successfully after security changes.

## Release Note
- Keep staff dashboard behind authenticated staff sessions in staging and production.
- Do not enable staff production rollout before provider variables are configured.
