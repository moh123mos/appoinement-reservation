import Link from "next/link";

type HomeNavbarProps = {
  hasConvexUrl: boolean;
};

export function HomeNavbar({ hasConvexUrl }: HomeNavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/70 backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-sm font-bold text-white">
            AR
          </span>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-emerald-800">Clinic UX</p>
            <p className="text-sm font-semibold text-slate-900">Appointment Reservations</p>
          </div>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          <a href="#journey" className="text-sm font-medium text-slate-700 transition hover:text-emerald-700">
            رحلة الحجز
          </a>
          <a href="#portals" className="text-sm font-medium text-slate-700 transition hover:text-emerald-700">
            المداخل
          </a>
          <a href="#status" className="text-sm font-medium text-slate-700 transition hover:text-emerald-700">
            حالة النظام
          </a>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/book"
            className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 md:px-4 md:text-sm"
          >
            احجز الآن
          </Link>
          <span
            className={`hidden rounded-xl px-3 py-2 text-[11px] font-semibold md:inline-flex ${
              hasConvexUrl
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {hasConvexUrl ? "Convex Ready" : "Convex Missing"}
          </span>
        </div>
      </nav>
    </header>
  );
}
