import Link from "next/link";
import { appConfig, isConvexConfigured } from "@/lib/app-config";
import { HomeHero } from "@/components/site/home-hero";
import { HomeJourney } from "@/components/site/home-journey";
import { HomeNavbar } from "@/components/site/home-navbar";
import { HomePortals } from "@/components/site/home-portals";

export default function Home() {
  const hasConvexUrl = isConvexConfigured();

  return (
    <>
      <HomeNavbar hasConvexUrl={hasConvexUrl} />

      <main className="relative isolate min-h-screen overflow-hidden px-5 py-8 md:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(130deg,#f7fff8_0%,#fef7ee_48%,#f4f9ff_100%)]" />
        <div className="pointer-events-none absolute -top-20 right-10 -z-10 h-80 w-80 rounded-full bg-emerald-100/55 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 -z-10 h-72 w-72 rounded-full bg-orange-100/55 blur-3xl" />

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <HomeHero environment={appConfig.environment} />

          <section id="status" className="rounded-4xl border border-slate-200/80 bg-white/80 p-6 md:p-8">
            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold tracking-[0.15em] uppercase text-slate-500">حالة Convex</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {hasConvexUrl ? "Configured" : "Needs Setup"}
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold tracking-[0.15em] uppercase text-slate-500">اللغة الافتراضية</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {appConfig.clinicDefaults.locale.toUpperCase()}
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold tracking-[0.15em] uppercase text-slate-500">مدة الموعد</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {appConfig.clinicDefaults.slotMinutes} min
                </p>
              </article>
            </div>

            {!hasConvexUrl ? (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                ضبط NEXT_PUBLIC_CONVEX_URL في ملف البيئة مطلوب لتشغيل التدفق الحي بالكامل.
              </p>
            ) : null}
          </section>

          <HomeJourney />
          <HomePortals />

          <section className="rounded-4xl border border-slate-200/80 bg-white/80 p-6 text-center md:p-8">
            <h2 className="font-(family-name:--font-display) text-3xl text-slate-900 md:text-4xl">
              جاهز تبدأ تجربة الحجز الجديدة؟
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              ابدأ من بوابة المريض للحجز المباشر، أو انتقل للوحة الطاقم لإدارة اليوم التشغيلي بسرعة.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/book"
                className="rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                تجربة الحجز الآن
              </Link>
              <Link
                href="/staff/dashboard"
                className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                إدارة جدول العيادة
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
