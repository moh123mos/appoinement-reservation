# Appointment Reservations SaaS Starter

Project stack:
- Frontend: Next.js (App Router)
- Styling: Tailwind CSS v4
- Backend: Convex

## Architecture

This starter is set up for a doctor appointment booking MVP with:
- Multi-tenant-ready data model in Convex (tenant, clinic, users, patients, appointments, waitlist, notifications, audit logs).
- Convex client provider already wired in the Next.js layout.
- Base dashboard-style home page showing setup status.
- First implementation slice for patient booking and staff dashboard.

## Project Structure

```text
src/
	app/
		layout.tsx
		page.tsx
		book/page.tsx
		staff/dashboard/page.tsx
		globals.css
	components/
		booking/
			booking-flow.tsx
		providers/
			convex-client-provider.tsx
	lib/
		app-config.ts
		booking-data.ts
		booking-validation.ts
		errors.ts
		time.ts
convex/
	schema.ts
	appointments.ts
	scheduling.ts
	seed.ts
scripts/
	verify-env.mjs
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start Convex in one terminal:

```bash
npm run convex:dev
```

3. Create environment file (choose one profile and copy to `.env.local`):

```bash
copy .env.development.example .env.local
```

4. Add your Convex URL to `.env.local`:

```bash
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
```

5. Verify environment settings:

```bash
npm run check:env
```

6. Seed deterministic demo data:

```bash
npm run seed:demo
```

7. Start Next.js in another terminal:

```bash
npm run dev
```

8. Open http://localhost:3000

## Implemented Routes

- `/` Home architecture and status page
- `/book` Patient booking flow (date, slot, contact details, confirmation)
- `/staff/dashboard` Staff operations dashboard (daily metrics and appointments table)

## Useful Scripts

```bash
npm run dev
npm run dev:next
npm run convex:dev
npm run convex:deploy
npm run lint
npm run check:env
npm run seed:demo
npm run seed:status
```

## Notes

- Convex authentication and patient/staff role flows are not fully implemented yet.
- Payment and insurance are intentionally outside the initial MVP scope.
- Convex functions use generated typed APIs from `convex/_generated/server`.
- Shared configuration and validation are centralized under `src/lib`.
