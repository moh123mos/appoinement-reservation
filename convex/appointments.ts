import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  assertEmail,
  assertIsoDate,
  assertMinuteRange,
  assertNotPastDate,
  assertPhone,
  assertSlotDuration,
  overlaps,
} from "./lib/bookingValidation";
import { throwAppError } from "./lib/errors";

export const listDailySchedule = query({
  args: {
    tenantId: v.id("tenants"),
    clinicId: v.id("clinics"),
    appointmentDate: v.string(),
  },
  handler: async ({ db }, args) => {
    assertIsoDate(args.appointmentDate);

    return await db
      .query("appointments")
      .withIndex("by_tenant_clinic_date_start", (q) =>
        q
          .eq("tenantId", args.tenantId)
          .eq("clinicId", args.clinicId)
          .eq("appointmentDate", args.appointmentDate),
      )
      .collect();
  },
});

export const createAppointment = mutation({
  args: {
    tenantId: v.id("tenants"),
    clinicId: v.id("clinics"),
    doctorUserId: v.id("users"),
    patientId: v.optional(v.id("patients")),
    patientName: v.string(),
    patientPhone: v.string(),
    patientEmail: v.optional(v.string()),
    appointmentDate: v.string(),
    startMinute: v.number(),
    slotMinutes: v.optional(v.number()),
    source: v.union(
      v.literal("guest"),
      v.literal("patient"),
      v.literal("receptionist"),
      v.literal("doctor"),
    ),
    notes: v.optional(v.string()),
  },
  handler: async ({ db }, args) => {
    assertIsoDate(args.appointmentDate);
    assertNotPastDate(args.appointmentDate);
    assertPhone(args.patientPhone);
    assertEmail(args.patientEmail);

    if (!args.patientName.trim()) {
      throwAppError("BAD_REQUEST", "patientName is required.");
    }

    const slotMinutes = args.slotMinutes ?? 15;
    assertSlotDuration(slotMinutes);

    const candidateRange = {
      startMinute: args.startMinute,
      endMinute: args.startMinute + slotMinutes,
    };

    assertMinuteRange(candidateRange);

    const existingAppointments = await db
      .query("appointments")
      .withIndex("by_tenant_clinic_doctor_date_start", (q) =>
        q
          .eq("tenantId", args.tenantId)
          .eq("clinicId", args.clinicId)
          .eq("doctorUserId", args.doctorUserId)
          .eq("appointmentDate", args.appointmentDate),
      )
      .collect();

    const hasConflict = existingAppointments.some(
      (appointment) =>
        appointment.status === "confirmed" &&
        overlaps(candidateRange, {
          startMinute: appointment.startMinute,
          endMinute: appointment.endMinute,
        }),
    );

    if (hasConflict) {
      throwAppError(
        "SLOT_CONFLICT",
        "Appointment time conflicts with another booking.",
      );
    }

    const hasDuplicate = existingAppointments.some(
      (appointment) =>
        appointment.status === "confirmed" &&
        appointment.startMinute === candidateRange.startMinute &&
        appointment.patientPhone === args.patientPhone,
    );

    if (hasDuplicate) {
      throwAppError(
        "DUPLICATE_BOOKING",
        "A confirmed booking already exists for this patient and slot.",
      );
    }

    const now = Date.now();
    const appointmentId = await db.insert("appointments", {
      tenantId: args.tenantId,
      clinicId: args.clinicId,
      doctorUserId: args.doctorUserId,
      patientId: args.patientId,
      patientName: args.patientName,
      patientPhone: args.patientPhone,
      patientEmail: args.patientEmail,
      appointmentDate: args.appointmentDate,
      startMinute: candidateRange.startMinute,
      endMinute: candidateRange.endMinute,
      status: "confirmed",
      source: args.source,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    return { appointmentId };
  },
});

export const cancelAppointment = mutation({
  args: {
    tenantId: v.id("tenants"),
    clinicId: v.id("clinics"),
    appointmentId: v.id("appointments"),
    reason: v.optional(v.string()),
  },
  handler: async ({ db }, args) => {
    const appointment = await db.get(args.appointmentId);

    if (!appointment) {
      throwAppError("NOT_FOUND", "Appointment was not found.");
    }

    if (appointment.tenantId !== args.tenantId || appointment.clinicId !== args.clinicId) {
      throwAppError("FORBIDDEN", "Appointment does not belong to this clinic.");
    }

    if (appointment.status === "cancelled") {
      return { cancelled: false, reason: "already_cancelled" };
    }

    await db.patch(args.appointmentId, {
      status: "cancelled",
      cancellationReason: args.reason ?? "cancelled_by_user",
      cancelledAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { cancelled: true };
  },
});

export const markAppointmentNoShow = mutation({
  args: {
    appointmentId: v.id("appointments"),
  },
  handler: async ({ db }, args) => {
    const appointment = await db.get(args.appointmentId);

    if (!appointment) {
      throwAppError("NOT_FOUND", "Appointment was not found.");
    }

    if (appointment.status !== "confirmed") {
      return { updated: false, reason: "status_not_confirmed" };
    }

    await db.patch(args.appointmentId, {
      status: "no_show",
      updatedAt: Date.now(),
    });

    return { updated: true };
  },
});

export const addWaitlistEntry = mutation({
  args: {
    tenantId: v.id("tenants"),
    clinicId: v.id("clinics"),
    doctorUserId: v.id("users"),
    patientId: v.optional(v.id("patients")),
    patientName: v.string(),
    patientPhone: v.string(),
    patientEmail: v.optional(v.string()),
    desiredDate: v.optional(v.string()),
    preferredStartMinute: v.optional(v.number()),
    preferredEndMinute: v.optional(v.number()),
  },
  handler: async ({ db }, args) => {
    assertEmail(args.patientEmail);
    assertPhone(args.patientPhone);

    if (args.desiredDate) {
      assertIsoDate(args.desiredDate, "desiredDate");
    }

    if (
      (args.preferredStartMinute === undefined) !==
      (args.preferredEndMinute === undefined)
    ) {
      throwAppError(
        "BAD_REQUEST",
        "preferredStartMinute and preferredEndMinute must be provided together.",
      );
    }

    if (
      args.preferredStartMinute !== undefined &&
      args.preferredEndMinute !== undefined
    ) {
      assertMinuteRange({
        startMinute: args.preferredStartMinute,
        endMinute: args.preferredEndMinute,
      });
    }

    const now = Date.now();
    const waitlistEntryId = await db.insert("waitlistEntries", {
      tenantId: args.tenantId,
      clinicId: args.clinicId,
      doctorUserId: args.doctorUserId,
      patientId: args.patientId,
      patientName: args.patientName,
      patientPhone: args.patientPhone,
      patientEmail: args.patientEmail,
      desiredDate: args.desiredDate,
      preferredStartMinute: args.preferredStartMinute,
      preferredEndMinute: args.preferredEndMinute,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return { waitlistEntryId };
  },
});
