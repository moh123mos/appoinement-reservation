import { v } from "convex/values";
import { query } from "./_generated/server";
import {
  assertIsoDate,
  assertSlotDuration,
  overlaps,
} from "./lib/bookingValidation";
import { throwAppError } from "./lib/errors";

function getDayOfWeekFromIso(isoDate: string) {
  const day = new Date(`${isoDate}T00:00:00`).getDay();
  return Number.isNaN(day) ? null : day;
}

export const getAvailableSlotsForDate = query({
  args: {
    tenantId: v.id("tenants"),
    clinicId: v.id("clinics"),
    doctorUserId: v.id("users"),
    appointmentDate: v.string(),
    slotMinutes: v.optional(v.number()),
    refreshNonce: v.optional(v.number()),
  },
  handler: async ({ db }, args) => {
    assertIsoDate(args.appointmentDate);

    const clinic = await db.get(args.clinicId);
    if (!clinic || clinic.tenantId !== args.tenantId) {
      throwAppError("FORBIDDEN", "Clinic does not belong to this tenant.");
    }

    const doctor = await db.get(args.doctorUserId);
    if (
      !doctor ||
      doctor.tenantId !== args.tenantId ||
      doctor.clinicId !== args.clinicId ||
      doctor.role !== "doctor"
    ) {
      throwAppError("FORBIDDEN", "Doctor does not belong to this clinic.");
    }

    const dayOfWeek = getDayOfWeekFromIso(args.appointmentDate);
    if (dayOfWeek === null) {
      return [];
    }

    const schedules = await db
      .query("doctorSchedules")
      .withIndex("by_tenant_clinic_doctor_day", (q) =>
        q
          .eq("tenantId", args.tenantId)
          .eq("clinicId", args.clinicId)
          .eq("doctorUserId", args.doctorUserId)
          .eq("dayOfWeek", dayOfWeek),
      )
      .collect();

    const activeSchedules = schedules;

    if (!activeSchedules.length) {
      return [];
    }

    const schedule = activeSchedules.find((item) => item.isActive) ?? activeSchedules[0];
    const slotMinutes = args.slotMinutes ?? schedule.slotMinutes;
    assertSlotDuration(slotMinutes);

    const appointments = await db
      .query("appointments")
      .withIndex("by_tenant_clinic_doctor_date_start", (q) =>
        q
          .eq("tenantId", args.tenantId)
          .eq("clinicId", args.clinicId)
          .eq("doctorUserId", args.doctorUserId)
          .eq("appointmentDate", args.appointmentDate),
      )
      .collect();

    const blockedRanges = appointments
      .filter((appointment) => appointment.status === "confirmed")
      .map((appointment) => ({
        startMinute: appointment.startMinute,
        endMinute: appointment.endMinute,
      }));

    const slots: Array<{ startMinute: number; endMinute: number; isAvailable: boolean }> = [];

    for (
      let minute = schedule.startMinute;
      minute + slotMinutes <= schedule.endMinute;
      minute += slotMinutes
    ) {
      const slotStart = minute;
      const slotEnd = minute + slotMinutes;
      const isBlocked = blockedRanges.some((blocked) =>
        overlaps(
          {
            startMinute: slotStart,
            endMinute: slotEnd,
          },
          blocked,
        ),
      );

      slots.push({
        startMinute: slotStart,
        endMinute: slotEnd,
        isAvailable: !isBlocked,
      });
    }

    return slots;
  },
});
