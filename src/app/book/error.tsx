"use client";

import { useEffect } from "react";

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

export default function BookError({
  error,
  reset,
  unstable_retry,
}: ErrorBoundaryProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const retry = unstable_retry ?? reset;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-10 text-center">
      <div className="w-full rounded-3xl border border-rose-200 bg-rose-50 p-8">
        <h1 className="text-2xl font-semibold text-rose-800">تعذر تحميل صفحة الحجز</h1>
        <p className="mt-3 text-sm text-rose-700">
          حدث خطأ غير متوقع أثناء تحميل بيانات الحجز. حاول مرة أخرى.
        </p>
        <button
          type="button"
          onClick={() => retry?.()}
          className="mt-5 rounded-xl bg-rose-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-800"
        >
          إعادة المحاولة
        </button>
      </div>
    </main>
  );
}
