import Link from "next/link";

type HomeHeroProps = {
  environment: string;
};

export function HomeHero({ environment }: HomeHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-4xl border border-emerald-100/80 bg-white/85 p-6 shadow-[0_30px_100px_-35px_rgba(4,120,87,0.65)] md:p-10">
      <div className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full bg-emerald-200/55 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 -bottom-24 h-64 w-64 rounded-full bg-orange-200/45 blur-3xl" />

      <div className="relative max-w-3xl animate-rise-up">
        <p className="text-xs font-semibold tracking-[0.22em] uppercase text-emerald-700">Smarter Clinic Front Door</p>
        <h1 className="mt-4 font-(family-name:--font-display) text-4xl leading-tight text-slate-900 md:text-6xl">
          تجربة حجز أوضح، أسرع،
          <span className="block text-emerald-700">ومريحة للمريض والطاقم</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700 md:text-lg">
          واجهة جديدة بالكامل تنظّم رحلة الحجز من أول نقرة حتى تأكيد الموعد، مع مدخلين واضحين: بوابة المريض وبوابة فريق العيادة.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/book"
            className="rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800"
          >
            ابدأ الحجز كمريض
          </Link>
          <Link
            href="/staff/dashboard"
            className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-slate-50"
          >
            ادخل لوحة الطاقم
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
            بيئة التشغيل: {environment}
          </span>
          <span className="rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            Patient-first UX
          </span>
          <span className="rounded-xl bg-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-800">
            Staff-friendly workflow
          </span>
        </div>
      </div>
    </section>
  );
}
