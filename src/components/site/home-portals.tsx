import Link from "next/link";

const portals = [
  {
    title: "للعيادات التي تريد نموًا أسرع",
    subtitle: "Patient Acquisition",
    description:
      "تجربة حجز بسيطة تزيد معدل التحويل وتمنح المرضى انطباعًا احترافيًا من أول زيارة.",
    cta: "تجربة مسار المريض",
    href: "/book",
    tone: "emerald",
    points: ["واجهة سريعة", "تأكيد مباشر", "رسائل ثقة واضحة"],
  },
  {
    title: "لفرق التشغيل التي تدير ضغط المواعيد",
    subtitle: "Operations Control",
    description:
      "لوحة واحدة لفريق الاستقبال والطبيب لمتابعة الجدول، إدارة الحالات، وتقليل الفاقد التشغيلي.",
    cta: "استكشف لوحة الطاقم",
    href: "/staff/dashboard",
    tone: "orange",
    points: ["بحث ذكي", "إدارة حالة الموعد", "متابعة قائمة الانتظار"],
  },
] as const;

export function HomePortals() {
  return (
    <section id="solutions" className="grid gap-4 md:grid-cols-2">
      {portals.map((portal) => {
        const themeClass =
          portal.tone === "emerald"
            ? "border-emerald-200 bg-emerald-50/65"
            : "border-orange-200 bg-orange-50/65";
        const buttonClass =
          portal.tone === "emerald"
            ? "bg-emerald-700 hover:bg-emerald-800"
            : "bg-orange-700 hover:bg-orange-800";

        return (
          <article key={portal.href} className={`rounded-[1.75rem] border p-6 ${themeClass}`}>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-600">{portal.subtitle}</p>
            <h3 className="mt-2 font-(family-name:--font-display) text-3xl text-slate-900">
              {portal.title}
            </h3>
            <p className="mt-3 leading-7 text-slate-700">{portal.description}</p>

            <ul className="mt-4 grid gap-2">
              {portal.points.map((point) => (
                <li key={point} className="rounded-lg bg-white/80 px-3 py-2 text-sm font-medium text-slate-700">
                  {point}
                </li>
              ))}
            </ul>

            <Link
              href={portal.href}
              className={`mt-5 inline-flex rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition ${buttonClass}`}
            >
              {portal.cta}
            </Link>
          </article>
        );
      })}
    </section>
  );
}
