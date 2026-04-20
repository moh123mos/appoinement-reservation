"use client";

import { useMutation, useQuery } from "convex/react";
import { FormEvent, useMemo, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { clinicMeta, upcomingDates } from "@/lib/booking-data";
import {
  isPastIsoDate,
  isValidIsoDate,
  validateBookingForm,
  validateSlotRange,
} from "@/lib/booking-validation";
import { getConvexErrorCode, toUserErrorMessage } from "@/lib/errors";
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

type ConfirmationState = {
  appointmentId: string;
  date: string;
  startMinute: number;
  patientName: string;
  createdAt: number;
};

const LAST_CONFIRMATION_STORAGE_KEY = "appointment:lastConfirmation";

export function BookingFlow() {
  const [selectedDate, setSelectedDate] = useState<string | null>(upcomingDates[0] ?? null);
  const [selectedStartMinute, setSelectedStartMinute] = useState<number | null>(null);
  const [form, setForm] = useState<BookingFormState>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [waitlistReference, setWaitlistReference] = useState<string | null>(null);

  const demoContext = useQuery(api.seed.getDemoContext);
  const createAppointment = useMutation(api.appointments.createAppointment);
  const addWaitlistEntry = useMutation(api.appointments.addWaitlistEntry);
  const seedDemoData = useMutation(api.seed.seedDemoData);

  const hasDates = upcomingDates.length > 0;

  const slots = useQuery(
    api.scheduling.getAvailableSlotsForDate,
    demoContext?.ready && selectedDate
      ? {
          tenantId: demoContext.tenantId,
          clinicId: demoContext.clinicId,
          doctorUserId: demoContext.doctorUserId,
          appointmentDate: selectedDate,
          slotMinutes: demoContext.slotMinutes,
          refreshNonce,
        }
      : "skip",
  );

  const loadStoredConfirmation = () => {
    try {
      const raw = localStorage.getItem(LAST_CONFIRMATION_STORAGE_KEY);
      if (!raw) {
        return false;
      }

      const parsed = JSON.parse(raw) as ConfirmationState;
      if (parsed?.appointmentId) {
        setConfirmation(parsed);
        return true;
      }
    } catch {
      localStorage.removeItem(LAST_CONFIRMATION_STORAGE_KEY);
    }

    return false;
  };

  const availableSlots = useMemo(
    () =>
      (slots ?? [])
        .filter((slot) => slot.isAvailable)
        .map((slot) => ({
          ...slot,
          label: minuteToTimeLabel(slot.startMinute),
        })),
    [slots],
  );

  const selectedSlot = useMemo(
    () =>
      availableSlots.find((slot) => slot.startMinute === selectedStartMinute) ?? null,
    [availableSlots, selectedStartMinute],
  );

  const setupDemoData = async () => {
    try {
      setError(null);
      setIsSeeding(true);
      await seedDemoData({});
    } catch (unknownError) {
      setError(toUserErrorMessage(unknownError, "تعذر تجهيز بيانات البداية."));
    } finally {
      setIsSeeding(false);
    }
  };

  const submitBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (!demoContext?.ready) {
        setError("بيئة الحجز غير جاهزة حاليا. جهز بيانات البداية أولا.");
        return;
      }

      if (!selectedDate || !isValidIsoDate(selectedDate)) {
        setError("التاريخ المحدد غير صالح.");
        return;
      }

      if (isPastIsoDate(selectedDate)) {
        setError("لا يمكن الحجز في تاريخ سابق.");
        return;
      }

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
      setWaitlistReference(null);
      setIsSubmitting(true);

      const result = await createAppointment({
        tenantId: demoContext.tenantId,
        clinicId: demoContext.clinicId,
        doctorUserId: demoContext.doctorUserId,
        appointmentDate: selectedDate,
        startMinute: selectedSlot.startMinute,
        slotMinutes: demoContext.slotMinutes,
        patientName: form.patientName.trim(),
        patientPhone: form.patientPhone.trim(),
        patientEmail: form.patientEmail.trim(),
        source: "guest",
      });

      const nextConfirmation: ConfirmationState = {
        appointmentId: result.appointmentId,
        date: selectedDate,
        startMinute: selectedSlot.startMinute,
        patientName: form.patientName.trim(),
        createdAt: Date.now(),
      };

      localStorage.setItem(
        LAST_CONFIRMATION_STORAGE_KEY,
        JSON.stringify(nextConfirmation),
      );

      setConfirmation(nextConfirmation);
    } catch (unknownError) {
      const errorCode = getConvexErrorCode(unknownError);
      if (errorCode === "SLOT_CONFLICT" || errorCode === "DUPLICATE_BOOKING") {
        setSelectedStartMinute(null);
        setRefreshNonce((prev) => prev + 1);
      }

      setError(toUserErrorMessage(unknownError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const joinWaitlist = async () => {
    try {
      if (!demoContext?.ready) {
        setError("بيئة الحجز غير جاهزة حاليا. جهز بيانات البداية أولا.");
        return;
      }

      if (!selectedDate || !isValidIsoDate(selectedDate)) {
        setError("اختر تاريخا صالحا للانضمام لقائمة الانتظار.");
        return;
      }

      if (isPastIsoDate(selectedDate)) {
        setError("لا يمكن الانضمام لقائمة انتظار في تاريخ سابق.");
        return;
      }

      const formError = validateBookingForm(form);
      if (formError) {
        setError(formError);
        return;
      }

      setError(null);
      setConfirmation(null);
      setIsJoiningWaitlist(true);

      const result = await addWaitlistEntry({
        tenantId: demoContext.tenantId,
        clinicId: demoContext.clinicId,
        doctorUserId: demoContext.doctorUserId,
        patientName: form.patientName.trim(),
        patientPhone: form.patientPhone.trim(),
        patientEmail: form.patientEmail.trim(),
        desiredDate: selectedDate,
        preferredStartMinute: selectedSlot?.startMinute,
        preferredEndMinute: selectedSlot?.endMinute,
        source: "guest",
      });

      setWaitlistReference(result.waitlistEntryId);
    } catch (unknownError) {
      setError(toUserErrorMessage(unknownError, "تعذر إضافة الطلب إلى قائمة الانتظار."));
    } finally {
      setIsJoiningWaitlist(false);
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

  if (demoContext === undefined) {
    return (
      <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-lg shadow-slate-300/30 md:p-8">
        <p className="text-sm font-semibold tracking-[0.12em] uppercase text-slate-500">Patient Booking</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">جاري تهيئة بيانات الحجز</h2>
        <p className="mt-2 text-sm text-slate-600">يتم الآن تحميل إعدادات العيادة والمواعيد المتاحة من النظام.</p>
      </section>
    );
  }

  if (!demoContext.ready) {
    return (
      <section className="rounded-3xl border border-amber-200/90 bg-amber-50 p-6 shadow-lg shadow-amber-100/70 md:p-8">
        <p className="text-sm font-semibold tracking-[0.12em] uppercase text-amber-700">Patient Booking</p>
        <h2 className="mt-3 text-2xl font-semibold text-amber-900">البيانات الأولية غير جاهزة</h2>
        <p className="mt-2 text-sm text-amber-800">
          يلزم تشغيل إعداد بيانات الديمو مرة واحدة قبل بدء الحجز الحي.
        </p>
        <button
          type="button"
          onClick={setupDemoData}
          disabled={isSeeding}
          className="mt-4 rounded-xl bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:opacity-60"
        >
          {isSeeding ? "جاري تجهيز البيانات..." : "تجهيز بيانات البداية"}
        </button>
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
                    setConfirmation(null);
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
          {slots === undefined ? (
            <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
              جاري تحميل المواعيد المتاحة...
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {availableSlots.map((slot) => {
                const isActive = selectedStartMinute === slot.startMinute;
                return (
                  <button
                    key={slot.startMinute}
                    type="button"
                    onClick={() => {
                      setSelectedStartMinute(slot.startMinute);
                      setConfirmation(null);
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
          )}
          {slots !== undefined && availableSlots.length === 0 ? (
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
            disabled={isSubmitting || isJoiningWaitlist}
            className="rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800"
          >
            {isSubmitting ? "جاري التأكيد..." : "تأكيد الحجز"}
          </button>
          <button
            type="button"
            onClick={joinWaitlist}
            disabled={isSubmitting || isJoiningWaitlist}
            className="rounded-xl border border-blue-300 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
          >
            {isJoiningWaitlist ? "جاري الإضافة..." : "الانضمام لقائمة الانتظار"}
          </button>
          <button
            type="button"
            disabled={isSubmitting || isJoiningWaitlist}
            onClick={() => {
              setForm(initialForm);
              setSelectedStartMinute(null);
              setConfirmation(null);
              setWaitlistReference(null);
              setError(null);
            }}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            إعادة تعيين
          </button>
        </div>

        {waitlistReference ? (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-800">تمت إضافتك إلى قائمة الانتظار</p>
            <p className="mt-1 text-sm text-blue-700">مرجع قائمة الانتظار: {waitlistReference}</p>
            <p className="mt-1 text-xs text-blue-700">سيتم التواصل معك تلقائيا عند توفر موعد مناسب.</p>
          </div>
        ) : null}

        {confirmation ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">تم تأكيد الحجز بنجاح</p>
            <p className="mt-1 text-sm text-emerald-700">مرجع الحجز: {confirmation.appointmentId}</p>
            <p className="mt-1 text-xs text-emerald-700">
              {formatDateArabic(confirmation.date)} - {minuteToTimeLabel(confirmation.startMinute)}
            </p>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-700">لا يوجد مرجع حجز ظاهر حاليا.</p>
            <button
              type="button"
              onClick={() => {
                const loaded = loadStoredConfirmation();
                if (!loaded) {
                  setError("لا يوجد مرجع محفوظ حاليا.");
                } else {
                  setError(null);
                }
              }}
              className="mt-3 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              استرجاع آخر مرجع محفوظ
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
