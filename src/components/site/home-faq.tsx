const faqItems = [
  {
    question: "هل يمكن استخدام النظام بدون حساب للمريض؟",
    answer:
      "نعم، مسار الحجز يدعم الضيوف بالكامل مع حفظ المرجع وتأكيد الموعد مباشرة.",
  },
  {
    question: "هل لوحة الطاقم مناسبة للاستقبال والطبيب معًا؟",
    answer:
      "نعم، نفس اللوحة تدعم التصفية والبحث وتحديث الحالة بما يناسب أدوار التشغيل اليومية.",
  },
  {
    question: "كيف يتم التعامل مع المواعيد الملغاة؟",
    answer:
      "النظام يدعم قائمة الانتظار وتحديد مرشح تلقائي لتقليل الفتحات الضائعة.",
  },
  {
    question: "هل يمكن تفعيل النظام تدريجيًا؟",
    answer:
      "بالتأكيد، يمكن البدء ببوابة الحجز ثم تفعيل بقية التدفقات التشغيلية خطوة بخطوة.",
  },
] as const;

export function HomeFaq() {
  return (
    <section id="faq" className="rounded-4xl border border-slate-200/80 bg-white/80 p-6 md:p-8">
      <header>
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-700">FAQ</p>
        <h2 className="mt-3 font-display text-3xl text-slate-900 md:text-4xl">
          أسئلة شائعة قبل الإطلاق
        </h2>
      </header>

      <div className="mt-6 grid gap-3">
        {faqItems.map((item) => (
          <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white px-4 py-3 open:border-emerald-300 open:bg-emerald-50/50">
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
              {item.question}
            </summary>
            <p className="mt-3 text-sm leading-7 text-slate-700">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
