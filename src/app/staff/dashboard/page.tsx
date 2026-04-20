"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { toUserErrorMessage } from "@/lib/errors";
import { formatDateArabic, minuteToTimeLabel, nextDaysIso } from "@/lib/time";

const statusPalette: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
  no_show: "bg-amber-100 text-amber-800",
  completed: "bg-sky-100 text-sky-800",
};

const upcomingDates = nextDaysIso(7);

const sourceLabel: Record<string, string> = {
  guest: "ضيف",
  patient: "مريض",
  receptionist: "استقبال",
  doctor: "طبيب",
};

type AppointmentStatus = "confirmed" | "cancelled" | "no_show" | "completed";
type AppointmentSource = "guest" | "patient" | "receptionist" | "doctor";

type OptimisticPatch = {
  status?: AppointmentStatus;
  cancellationReason?: string;
};

export default function StaffDashboardPage() {
  const [selectedDate, setSelectedDate] = useState<string>(upcomingDates[0] ?? "");
  const [selectedStatus, setSelectedStatus] = useState<"all" | AppointmentStatus>("all");
  const [selectedSource, setSelectedSource] = useState<"all" | AppointmentSource>("all");
  const [selectedDoctorId, setSelectedDoctorId] = useState<"all" | string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({});
  const [optimisticById, setOptimisticById] = useState<Record<string, OptimisticPatch>>({});

  const demoContext = useQuery(api.seed.getDemoContext);
  const cancelAppointment = useMutation(api.appointments.cancelAppointment);
  const markAppointmentNoShow = useMutation(api.appointments.markAppointmentNoShow);

  const appointments = useQuery(
    api.appointments.listDailySchedule,
    demoContext?.ready && selectedDate
      ? {
          tenantId: demoContext.tenantId,
          clinicId: demoContext.clinicId,
          appointmentDate: selectedDate,
          refreshNonce,
        }
      : "skip",
  );

  const dashboardRows = useMemo(() => {
    const rows = appointments ?? [];
    return rows.map((appointment) => {
      const patch = optimisticById[appointment._id];
      if (!patch) {
        return appointment;
      }

      return {
        ...appointment,
        status: patch.status ?? appointment.status,
        cancellationReason: patch.cancellationReason ?? appointment.cancellationReason,
      };
    });
  }, [appointments, optimisticById]);

  const doctorOptions = useMemo(() => {
    const options = new Map<string, string>();

    if (demoContext?.ready) {
      options.set(demoContext.doctorUserId, demoContext.doctorName);
    }

    for (const row of dashboardRows) {
      if (!options.has(row.doctorUserId)) {
        options.set(row.doctorUserId, `طبيب ${String(row.doctorUserId).slice(0, 6)}`);
      }
    }

    return Array.from(options.entries()).map(([id, label]) => ({ id, label }));
  }, [dashboardRows, demoContext]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return dashboardRows.filter((row) => {
      if (selectedStatus !== "all" && row.status !== selectedStatus) {
        return false;
      }

      if (selectedSource !== "all" && row.source !== selectedSource) {
        return false;
      }

      if (selectedDoctorId !== "all" && row.doctorUserId !== selectedDoctorId) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const phone = row.patientPhone.toLowerCase();
      const email = (row.patientEmail ?? "").toLowerCase();
      return phone.includes(normalizedSearch) || email.includes(normalizedSearch);
    });
  }, [dashboardRows, searchTerm, selectedDoctorId, selectedSource, selectedStatus]);

  const setRowPending = (appointmentId: string, isPending: boolean) => {
    setPendingIds((prev) => {
      if (!isPending) {
        const next = { ...prev };
        delete next[appointmentId];
        return next;
      }

      return {
        ...prev,
        [appointmentId]: true,
      };
    });
  };

  const applyOptimisticPatch = (appointmentId: string, patch: OptimisticPatch) => {
    setOptimisticById((prev) => ({
      ...prev,
      [appointmentId]: {
        ...prev[appointmentId],
        ...patch,
      },
    }));
  };

  const rollbackOptimisticPatch = (appointmentId: string) => {
    setOptimisticById((prev) => {
      const next = { ...prev };
      delete next[appointmentId];
      return next;
    });
  };

  const handleCancelAppointment = async (appointmentId: Id<"appointments">) => {
    if (!demoContext?.ready) {
      return;
    }

    const appointmentKey = String(appointmentId);

    const reason = window.prompt("اكتب سبب الإلغاء", "cancelled_by_staff");
    if (reason === null) {
      return;
    }

    const normalizedReason = reason.trim() || "cancelled_by_staff";

    setActionError(null);
    setRowPending(appointmentKey, true);
    applyOptimisticPatch(appointmentKey, {
      status: "cancelled",
      cancellationReason: normalizedReason,
    });

    try {
      await cancelAppointment({
        tenantId: demoContext.tenantId,
        clinicId: demoContext.clinicId,
        appointmentId,
        reason: normalizedReason,
      });

      setRefreshNonce((prev) => prev + 1);
    } catch (unknownError) {
      rollbackOptimisticPatch(appointmentKey);
      setActionError(toUserErrorMessage(unknownError, "تعذر إلغاء الموعد."));
    } finally {
      setRowPending(appointmentKey, false);
    }
  };

  const handleMarkNoShow = async (appointmentId: Id<"appointments">) => {
    if (!demoContext?.ready) {
      return;
    }

    const appointmentKey = String(appointmentId);

    setActionError(null);
    setRowPending(appointmentKey, true);
    applyOptimisticPatch(appointmentKey, {
      status: "no_show",
    });

    try {
      await markAppointmentNoShow({
        tenantId: demoContext.tenantId,
        clinicId: demoContext.clinicId,
        appointmentId,
      });

      setRefreshNonce((prev) => prev + 1);
    } catch (unknownError) {
      rollbackOptimisticPatch(appointmentKey);
      setActionError(toUserErrorMessage(unknownError, "تعذر تحديث الموعد إلى no-show."));
    } finally {
      setRowPending(appointmentKey, false);
    }
  };

  const dashboardSeed = useMemo(() => {
    const rows = dashboardRows;

    return {
      todayTotal: rows.length,
      confirmed: rows.filter((item) => item.status === "confirmed").length,
      cancelled: rows.filter((item) => item.status === "cancelled").length,
      noShow: rows.filter((item) => item.status === "no_show").length,
      waitingList: 0,
    };
  }, [dashboardRows]);

  const hasAppointments = filteredRows.length > 0;

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

      {demoContext === undefined ? (
        <p className="mb-4 rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
          جاري تحميل بيانات العيادة...
        </p>
      ) : null}

      {demoContext && !demoContext.ready ? (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
          بيانات الديمو غير جاهزة. شغل seed ثم أعد تحميل الصفحة.
        </p>
      ) : null}

      {actionError ? (
        <p className="mb-4 rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-800">{actionError}</p>
      ) : null}

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold tracking-[0.12em] uppercase text-slate-500">تاريخ الجدول</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {upcomingDates.map((date) => {
            const isActive = selectedDate === date;

            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`rounded-xl border px-3 py-2 text-right transition ${
                  isActive
                    ? "border-cyan-500 bg-cyan-50 text-cyan-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300"
                }`}
              >
                <p className="text-sm font-semibold">{formatDateArabic(date)}</p>
                <p className="text-xs text-slate-500">{date}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold tracking-[0.12em] uppercase text-slate-500">الفلاتر والبحث</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <label className="text-xs text-slate-500">
            الحالة
            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value as "all" | AppointmentStatus)
              }
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
            >
              <option value="all">كل الحالات</option>
              <option value="confirmed">confirmed</option>
              <option value="cancelled">cancelled</option>
              <option value="no_show">no_show</option>
              <option value="completed">completed</option>
            </select>
          </label>

          <label className="text-xs text-slate-500">
            المصدر
            <select
              value={selectedSource}
              onChange={(event) =>
                setSelectedSource(event.target.value as "all" | AppointmentSource)
              }
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
            >
              <option value="all">كل المصادر</option>
              <option value="guest">ضيف</option>
              <option value="patient">مريض</option>
              <option value="receptionist">استقبال</option>
              <option value="doctor">طبيب</option>
            </select>
          </label>

          <label className="text-xs text-slate-500">
            الطبيب
            <select
              value={selectedDoctorId}
              onChange={(event) => setSelectedDoctorId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
            >
              <option value="all">كل الأطباء</option>
              {doctorOptions.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-slate-500">
            بحث (هاتف/بريد)
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="ابحث برقم الهاتف أو البريد"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
            />
          </label>
        </div>
      </section>

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
                <th className="px-3 py-2 font-semibold">التواصل</th>
                <th className="px-3 py-2 font-semibold">الوقت</th>
                <th className="px-3 py-2 font-semibold">الحالة</th>
                <th className="px-3 py-2 font-semibold">مصدر الحجز</th>
                <th className="px-3 py-2 font-semibold">الطبيب</th>
                <th className="px-3 py-2 font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {hasAppointments ? (
                filteredRows.map((appointment) => (
                  <tr key={appointment._id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-3 py-2 font-medium text-slate-700">{appointment._id}</td>
                    <td className="px-3 py-2 text-slate-900">{appointment.patientName}</td>
                    <td className="px-3 py-2 text-slate-700">
                      <p>{appointment.patientPhone}</p>
                      <p className="text-xs text-slate-500">{appointment.patientEmail ?? "-"}</p>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{minuteToTimeLabel(appointment.startMinute)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          statusPalette[appointment.status] ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {appointment.status}
                      </span>
                      {appointment.status === "cancelled" && appointment.cancellationReason ? (
                        <p className="mt-1 text-xs text-rose-700">{appointment.cancellationReason}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{sourceLabel[appointment.source] ?? appointment.source}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {doctorOptions.find((doctor) => doctor.id === appointment.doctorUserId)?.label ??
                        String(appointment.doctorUserId).slice(0, 10)}
                    </td>
                    <td className="px-3 py-2">
                      {appointment.status === "confirmed" ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleCancelAppointment(appointment._id)}
                            disabled={Boolean(pendingIds[appointment._id])}
                            className="rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                          >
                            إلغاء
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkNoShow(appointment._id)}
                            disabled={Boolean(pendingIds[appointment._id])}
                            className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                          >
                            no-show
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">لا إجراء</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-sm text-slate-500">
                    {dashboardRows.length === 0
                      ? "جاري تحميل جدول المواعيد..."
                      : "لا توجد نتائج مطابقة للفلاتر الحالية."}
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
