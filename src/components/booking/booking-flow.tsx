"use client";

import { FormEvent, useMemo, useState } from "react";
import { clinicMeta, getSlotsForDate, upcomingDates } from "@/lib/booking-data";
import { validateBookingForm, validateSlotRange } from "@/lib/booking-validation";
import { toUserErrorMessage } from "@/lib/errors";
import { formatDateArabic, formatDateEnglish, minuteToTimeLabel } from "@/lib/time";

type BookingFormState = {
  patientName: string;
  patientPhone: string;
  patientEmail: string;
};

const initialForm: BookingFormState = {
  patientName: "",
  patientPhone: "",
  patientEmail: "",
};

export function BookingFlow() {
  const [selectedDate, setSelectedDate] = useState<string | null>(upcomingDates[0] ?? null);
  const [selectedStartMinute, setSelectedStartMinute] = useState<number | null>(null);
  const [form, setForm] = useState<BookingFormState>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasDates = upcomingDates.length > 0;

  const availableSlots = useMemo(
    () =>
      selectedDate ? getSlotsForDate(selectedDate).filter((slot) => slot.isAvailable) : [],
    [selectedDate],
  );

  const selectedSlot = useMemo(
    () =>
      availableSlots.find((slot) => slot.startMinute === selectedStartMinute) ?? null,
    [availableSlots, selectedStartMinute],
  );

  const submitBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (!selectedSlot) {
        setError("اختر موعدا متاحا قبل التأكيد.");
        return;
      }

      const formError = validateBookingForm(form);
      if (formError) {
        setError(formError);
        return;
      }

      const slotError = validateSlotRange(
        selectedSlot.startMinute,
        selectedSlot.endMinute,
      );
      if (slotError) {
        setError(slotError);
        return;
      }

      setError(null);
      setIsSubmitting(true);

      setConfirmationCode(
        `APT-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now()
          .toString()
          .slice(-4)}`,
      );
    } catch (unknownError) {
      setError(toUserErrorMessage(unknownError));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasDates) {
    return (
      <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-lg shadow-slate-300/30 md:p-8">
        <p className="text-sm font-semibold tracking-[0.12em] uppercase text-slate-500">Patient Booking</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">لا توجد تواريخ متاحة حاليا</h2>
        <p className="mt-2 text-sm text-slate-600">
          راجع إعدادات التقويم والجدول الزمني في بيانات العيادة ثم أعد المحاولة.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-lg shadow-slate-300/30 md:p-8">
      <header className="rounded-2xl bg-linear-to-r from-cyan-700 to-blue-600 p-5 text-white">
        <p className="text-xs font-semibold tracking-[0.16em] uppercase text-cyan-100">Patient Booking</p>
        <h2 className="mt-2 text-2xl font-semibold md:text-3xl">احجز موعدك في أقل من دقيقة</h2>
        <p className="mt-2 text-sm text-cyan-50">
          {clinicMeta.name} | {clinicMeta.specialty} | {clinicMeta.branch}
        </p>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold tracking-[0.12em] uppercase text-slate-500">1. التاريخ</h3>
          <div className="mt-3 grid gap-2">
            {upcomingDates.map((date) => {
              const isActive = selectedDate === date;
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedStartMinute(null);
                    setConfirmationCode(null);
                    setError(null);
                  }}
                  className={`rounded-xl border px-3 py-2 text-right transition ${
                    isActive
                      ? "border-cyan-500 bg-cyan-50 text-cyan-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300"
                  }`}
                >
                  <p className="text-sm font-semibold">{formatDateArabic(date)}</p>
                  <p className="text-xs text-slate-500">{formatDateEnglish(date)}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold tracking-[0.12em] uppercase text-slate-500">2. الوقت</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {availableSlots.map((slot) => {
              const isActive = selectedStartMinute === slot.startMinute;
              return (
                <button
                  key={slot.startMinute}
                  type="button"
                  onClick={() => {
                    setSelectedStartMinute(slot.startMinute);
                    setConfirmationCode(null);
                  }}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
                  }`}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
          {availableSlots.length === 0 ? (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              لا توجد مواعيد متاحة في هذا اليوم.
            </p>
          ) : null}
        </section>
      </div>

      <form onSubmit={submitBooking} className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
        <h3 className="text-sm font-semibold tracking-[0.12em] uppercase text-slate-500">3. بيانات المريض</h3>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm text-slate-700">
            الاسم
            <input
              type="text"
              value={form.patientName}
              onChange={(event) => setForm((prev) => ({ ...prev, patientName: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500"
              placeholder="مثال: سارة أحمد"
            />
          </label>

          <label className="text-sm text-slate-700">
            رقم الموبايل
            <input
              type="tel"
              value={form.patientPhone}
              onChange={(event) => setForm((prev) => ({ ...prev, patientPhone: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500"
              placeholder="01XXXXXXXXX"
            />
          </label>

          <label className="text-sm text-slate-700">
            البريد الإلكتروني
            <input
              type="email"
              value={form.patientEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, patientEmail: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500"
              placeholder="name@example.com"
            />
          </label>
        </div>

        {selectedSlot ? (
          <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
            الموعد المختار: {selectedDate ? formatDateArabic(selectedDate) : "-"} - {minuteToTimeLabel(selectedSlot.startMinute)}
          </p>
        ) : (
          <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
            لم يتم اختيار موعد بعد.
          </p>
        )}

        {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800"
          >
            {isSubmitting ? "جاري التأكيد..." : "تأكيد الحجز"}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setForm(initialForm);
              setSelectedStartMinute(null);
              setConfirmationCode(null);
              setError(null);
            }}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            إعادة تعيين
          </button>
        </div>

        {confirmationCode ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">تم إنشاء حجز مبدئي بنجاح</p>
            <p className="mt-1 text-sm text-emerald-700">كود التأكيد: {confirmationCode}</p>
            <p className="mt-1 text-xs text-emerald-700">
              في المرحلة القادمة سنربطه مباشرة بـ Convex Mutation لإدخال الموعد الفعلي.
            </p>
          </div>
        ) : null}
      </form>
    </section>
  );
}
