import Link from "next/link";
import { appConfig, isConvexConfigured } from "@/lib/app-config";

export default function Home() {
  const hasConvexUrl = isConvexConfigured();

  return (
    <main className="flex min-h-screen w-full items-center justify-center px-6 py-14">
      <section className="w-full max-w-5xl rounded-3xl border border-slate-200/70 bg-white/90 p-8 shadow-xl shadow-slate-200/40 backdrop-blur md:p-10">
        <p className="text-sm font-semibold tracking-[0.16em] text-sky-700 uppercase">
          Appointment Reservations
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">
          Next.js + Tailwind CSS + Convex
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
          Project foundation is ready for a doctor appointment SaaS MVP with a
          web frontend, Tailwind styling system, and Convex as the backend.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/book"
            className="rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800"
          >
            ابدأ الحجز كمريض
          </Link>
          <Link
            href="/staff/dashboard"
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ادخل لوحة الطاقم
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
              Frontend
            </h2>
            <p className="mt-2 text-lg font-semibold text-slate-900">Next.js 16 (App Router)</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Production-ready React framework for server components, routing,
              and API integration.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
              Styling
            </h2>
            <p className="mt-2 text-lg font-semibold text-slate-900">Tailwind CSS v4</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Utility-first styling with design tokens and fast iteration for the
              booking flows and dashboards.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
              Backend
            </h2>
            <p className="mt-2 text-lg font-semibold text-slate-900">Convex</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Realtime database, queries, and mutations tailored for appointment
              scheduling and clinic workflows.
            </p>
          </article>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Setup status</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Convex URL is {hasConvexUrl ? "configured" : "not configured yet"}.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Active environment: <span className="font-semibold">{appConfig.environment}</span>
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Defaults: {appConfig.clinicDefaults.locale.toUpperCase()} | {appConfig.clinicDefaults.timezone} | {appConfig.clinicDefaults.slotMinutes}-minute slots
          </p>
          {!hasConvexUrl ? (
            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Add NEXT_PUBLIC_CONVEX_URL in .env.local after running Convex
              initialization.
            </p>
          ) : null}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Implementation progress</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Booking page and staff dashboard are now implemented as the first
            vertical slice. Next step is wiring these screens to live Convex
            queries and mutations.
          </p>
        </section>
      </section>
    </main>
  );
}
