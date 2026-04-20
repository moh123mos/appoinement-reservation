"use client";

import { useEffect } from "react";

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

export default function StaffDashboardError({
  error,
  reset,
  unstable_retry,
}: ErrorBoundaryProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const retry = unstable_retry ?? reset;
  const isUnauthorized =
    error.message.includes("UNAUTHORIZED") ||
    error.message.includes("Authentication is required") ||
    error.message.includes("Not authenticated");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-10 text-center">
      <div className="w-full rounded-3xl border border-amber-200 bg-amber-50 p-8">
        <h1 className="text-2xl font-semibold text-amber-900">تعذر تحميل لوحة الطاقم</h1>
        <p className="mt-3 text-sm text-amber-800">
          {isUnauthorized
            ? "لوحة الطاقم تتطلب تسجيل دخول بحساب staff بعد إعداد موفر المصادقة."
            : "تعذر جلب بيانات التشغيل الحالية. أعد المحاولة بعد ثوان."}
        </p>
        <button
          type="button"
          onClick={() => retry?.()}
          className="mt-5 rounded-xl bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-800"
        >
          إعادة المحاولة
        </button>
      </div>
    </main>
  );
}
