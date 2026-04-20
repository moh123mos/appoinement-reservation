const steps = [
  {
    title: "تحويل أعلى من أول زيارة",
    description: "واجهة هادئة ومباشرة تقلل التشتت وتدفع الزائر للحجز خلال خطوات قصيرة.",
    number: "01",
  },
  {
    title: "ثقة أكبر في كل موعد",
    description: "منع التضارب وإظهار المواعيد المتاحة في الوقت الحقيقي يرفع مصداقية العيادة.",
    number: "02",
  },
  {
    title: "تشغيل أسرع للطاقم",
    description: "لوحة موحدة للبحث والتصفية وتحديث الحالة تقلل الوقت الضائع يوميًا.",
    number: "03",
  },
  {
    title: "استرجاع مواعيد مهدرة",
    description: "قائمة انتظار وتذكيرات آلية تساعدك على ملء الفتحات وتقليل الـ no-show.",
    number: "04",
  },
];

export function HomeJourney() {
  return (
    <section id="benefits" className="rounded-4xl border border-emerald-100/80 bg-white/80 p-6 md:p-8">
      <header>
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-700">Why It Converts</p>
        <h2 className="mt-3 font-(family-name:--font-display) text-3xl text-slate-900 md:text-4xl">
          لماذا هذه الصفحة التسويقية تبيع بدل أن تشرح
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
