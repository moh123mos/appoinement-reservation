const steps = [
  {
    title: "اختيار اليوم",
    description: "المريض يبدأ من تقويم بسيط وواضح يعرض الأيام المتاحة فقط.",
    number: "01",
  },
  {
    title: "اختيار الموعد",
    description: "الفتحات الزمنية تظهر بشكل مباشر مع معالجة التضارب بشكل فوري.",
    number: "02",
  },
  {
    title: "تأكيد البيانات",
    description: "نموذج مختصر يطلب البيانات الأساسية فقط لتقليل الاحتكاك.",
    number: "03",
  },
  {
    title: "إدارة التشغيل",
    description: "فريق العيادة يتابع الحالات ويلغي أو يحدّث الموعد من الداشبورد.",
    number: "04",
  },
];

export function HomeJourney() {
  return (
    <section id="journey" className="rounded-4xl border border-emerald-100/80 bg-white/80 p-6 md:p-8">
      <header>
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-700">Journey Flow</p>
        <h2 className="mt-3 font-(family-name:--font-display) text-3xl text-slate-900 md:text-4xl">
          رحلة تجربة المستخدم من البداية للنهاية
        </h2>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {steps.map((step, index) => (
          <article
            key={step.number}
            className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-emerald-300"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <p className="text-xs font-bold tracking-[0.2em] text-emerald-700">{step.number}</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">{step.title}</h3>
            <p className="mt-2 leading-7 text-slate-600">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
