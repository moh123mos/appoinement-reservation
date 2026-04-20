import Link from "next/link";
import { dashboardAppointments, dashboardSeed } from "@/lib/booking-data";

const statusPalette: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
  no_show: "bg-amber-100 text-amber-800",
};

const hasAppointments = dashboardAppointments.length > 0;

export default function StaffDashboardPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 md:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] uppercase text-sky-700">Clinic Ops</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">لوحة إدارة المواعيد</h1>
        </div>
        <Link
          href="/"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          العودة للرئيسية
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">مواعيد اليوم</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{dashboardSeed.todayTotal}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">مؤكدة</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">{dashboardSeed.confirmed}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">ملغاة</p>
          <p className="mt-1 text-2xl font-semibold text-rose-700">{dashboardSeed.cancelled}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">No-show</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">{dashboardSeed.noShow}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">قائمة الانتظار</p>
          <p className="mt-1 text-2xl font-semibold text-sky-700">{dashboardSeed.waitingList}</p>
        </article>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
        <h2 className="text-lg font-semibold text-slate-900">جدول اليوم</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-140 border-collapse text-right text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-3 py-2 font-semibold">رقم الموعد</th>
                <th className="px-3 py-2 font-semibold">المريض</th>
                <th className="px-3 py-2 font-semibold">الوقت</th>
                <th className="px-3 py-2 font-semibold">الحالة</th>
                <th className="px-3 py-2 font-semibold">مصدر الحجز</th>
              </tr>
            </thead>
            <tbody>
              {hasAppointments ? (
                dashboardAppointments.map((appointment) => (
                  <tr key={appointment.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-3 py-2 font-medium text-slate-700">{appointment.id}</td>
                    <td className="px-3 py-2 text-slate-900">{appointment.patientName}</td>
                    <td className="px-3 py-2 text-slate-700">{appointment.time}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          statusPalette[appointment.status] ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{appointment.source}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">
                    لا توجد مواعيد حاليا. ستظهر المواعيد هنا بمجرد بدء الحجوزات.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
