import Link from "next/link";
import { BookingFlow } from "@/components/booking/booking-flow";

export default function BookPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 md:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] uppercase text-cyan-700">Patient Portal</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">حجز موعد جديد</h1>
        </div>
        <Link
          href="/"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          العودة للرئيسية
        </Link>
      </header>

      <BookingFlow />
    </main>
  );
}
