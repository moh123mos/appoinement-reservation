const testimonials = [
  {
    quote:
      "بعد إطلاق الصفحة الجديدة، أصبح المرضى يحجزون مباشرة بدون مكالمات طويلة، وفريق الاستقبال وفّر وقتًا كبيرًا يوميًا.",
    author: "د. نورا عادل",
    role: "مديرة مركز CarePlus",
  },
  {
    quote:
      "أكثر شيء أحببناه هو وضوح المسار: المريض يفهم أين يضغط، والموعد يتسجل بدون تعقيد.",
    author: "أحمد صبحي",
    role: "Operations Lead - Nova Clinic",
  },
  {
    quote:
      "تحسن معدل الحضور لأن التذكيرات وقائمة الانتظار أصبحت جزءًا طبيعيًا من تجربة الحجز.",
    author: "منى سامح",
    role: "استقبال - Vita Medical",
  },
] as const;

export function HomeTestimonials() {
  return (
    <section id="testimonials" className="rounded-4xl border border-slate-200/80 bg-white/85 p-6 md:p-8">
      <header>
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-700">Social Proof</p>
        <h2 className="mt-3 font-display text-3xl text-slate-900 md:text-4xl">
          نتائج ملموسة من عيادات فعلًا تستخدم المنصة
        </h2>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {testimonials.map((item) => (
          <article key={item.author} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm leading-7 text-slate-700">&ldquo;{item.quote}&rdquo;</p>
            <p className="mt-4 text-sm font-semibold text-slate-900">{item.author}</p>
            <p className="text-xs text-slate-500">{item.role}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
