import Link from "next/link";
import { HomeFaq } from "@/components/site/home-faq";
import { HomeHero } from "@/components/site/home-hero";
import { HomeJourney } from "@/components/site/home-journey";
import { HomeNavbar } from "@/components/site/home-navbar";
import { HomePortals } from "@/components/site/home-portals";
import { HomeTestimonials } from "@/components/site/home-testimonials";

export default function Home() {
  return (
    <>
      <HomeNavbar />

      <main className="relative isolate min-h-screen overflow-hidden px-5 py-8 md:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(130deg,#f7fff8_0%,#fef7ee_48%,#f4f9ff_100%)]" />
        <div className="pointer-events-none absolute -top-20 right-10 -z-10 h-80 w-80 rounded-full bg-emerald-100/55 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 -z-10 h-72 w-72 rounded-full bg-orange-100/55 blur-3xl" />

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <HomeHero />

          <HomeJourney />
          <HomePortals />
          <HomeTestimonials />
          <HomeFaq />

          <section className="rounded-4xl border border-slate-200/80 bg-white/80 p-6 text-center md:p-8">
            <h2 className="font-display text-3xl text-slate-900 md:text-4xl">
              حوّل الزيارات إلى مواعيد مؤكدة من اليوم
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              إن كنت تريد صفحة تسويقية تقود المريض للحجز بسرعة مع تجربة تشغيل احترافية للطاقم، فأنت في المكان الصحيح.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/book"
                className="rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                ابدأ النسخة التجريبية
              </Link>
              <Link
                href="/staff/dashboard"
                className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                شاهد لوحة الإدارة
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
