import Link from "next/link";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden rounded-4xl border border-emerald-100/80 bg-white/85 p-6 shadow-[0_30px_100px_-35px_rgba(4,120,87,0.65)] md:p-10">
      <div className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full bg-emerald-200/55 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 -bottom-24 h-64 w-64 rounded-full bg-orange-200/45 blur-3xl" />

      <div className="relative max-w-3xl animate-rise-up">
        <p className="text-xs font-semibold tracking-[0.22em] uppercase text-emerald-700">Marketing Landing</p>
        <h1 className="mt-4 font-(family-name:--font-display) text-4xl leading-tight text-slate-900 md:text-6xl">
          حوّل موقع عيادتك إلى
          <span className="block text-emerald-700">آلة حجز تعمل 24/7</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700 md:text-lg">
          صفحة تسويقية مدروسة تقود الزائر من الاهتمام إلى الحجز خلال أقل من دقيقة، مع تجربة واضحة للمريض ولوحة تشغيل سريعة للطاقم.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/book"
            className="rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800"
          >
            ابدأ الحجز فورًا
          </Link>
          <Link
            href="/staff/dashboard"
            className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-slate-50"
          >
            استكشف لوحة الطاقم
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <span className="rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            +32% زيادة في إكمال الحجز
          </span>
          <span className="rounded-xl bg-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-800">
            -40% مكالمات تأكيد يدوية
          </span>
          <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
            تجربة عربية/إنجليزية سلسة
          </span>
        </div>
      </div>
    </section>
  );
}
