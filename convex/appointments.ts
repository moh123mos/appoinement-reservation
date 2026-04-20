import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
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

const NO_SHOW_GRACE_MINUTES = 15;
const MAX_NOTIFICATION_RETRIES = 3;

function appointmentTimeToUnixMs(appointmentDate: string, startMinute: number) {
  const [year, month, day] = appointmentDate.split("-").map(Number);
  const base = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  base.setUTCMinutes(startMinute);
  return base.getTime();
}

function reminderSchedule(template: "reminder_24h" | "reminder_3h") {
  if (template === "reminder_24h") {
    return 24 * 60;
  }

  return 3 * 60;
}

async function enqueueReminder(
  ctx: MutationCtx,
  args: {
    tenantId: Id<"tenants">;
    clinicId: Id<"clinics">;
    appointmentId: Id<"appointments">;
    startUnixMs: number;
    template: "reminder_24h" | "reminder_3h";
    channels: Array<"sms" | "email">;
  },
) {
  const minutesBefore = reminderSchedule(args.template);
  const scheduledFor = args.startUnixMs - minutesBefore * 60 * 1000;

  for (const channel of args.channels) {
    const notificationLogId = await ctx.db.insert("notificationLogs", {
      tenantId: args.tenantId,
      clinicId: args.clinicId,
      appointmentId: args.appointmentId,
      channel,
      template: args.template,
      status: "pending",
      scheduledFor,
    });

    if (scheduledFor <= Date.now()) {
      await ctx.scheduler.runAfter(
        0,
        internal.appointments.dispatchReminderNotification,
        { notificationLogId, attempt: 0 },
      );
    } else {
      await ctx.scheduler.runAt(
        scheduledFor,
        internal.appointments.dispatchReminderNotification,
        { notificationLogId, attempt: 0 },
      );
    }
  }
}

async function scheduleAppointmentAutomation(
  ctx: MutationCtx,
  args: {
    tenantId: Id<"tenants">;
    clinicId: Id<"clinics">;
    appointmentId: Id<"appointments">;
    appointmentDate: string;
    startMinute: number;
    hasEmail: boolean;
  },
) {
  const startUnixMs = appointmentTimeToUnixMs(args.appointmentDate, args.startMinute);

  await enqueueReminder(ctx, {
    tenantId: args.tenantId,
    clinicId: args.clinicId,
    appointmentId: args.appointmentId,
    startUnixMs,
    template: "reminder_24h",
    channels: args.hasEmail ? ["sms", "email"] : ["sms"],
  });

  await enqueueReminder(ctx, {
    tenantId: args.tenantId,
    clinicId: args.clinicId,
    appointmentId: args.appointmentId,
    startUnixMs,
    template: "reminder_3h",
    channels: args.hasEmail ? ["sms", "email"] : ["sms"],
  });

  const noShowAt = startUnixMs + NO_SHOW_GRACE_MINUTES * 60 * 1000;
  if (noShowAt <= Date.now()) {
    await ctx.scheduler.runAfter(0, internal.appointments.autoMarkNoShow, {
      tenantId: args.tenantId,
      clinicId: args.clinicId,
      appointmentId: args.appointmentId,
    });
  } else {
    await ctx.scheduler.runAt(noShowAt, internal.appointments.autoMarkNoShow, {
      tenantId: args.tenantId,
      clinicId: args.clinicId,
      appointmentId: args.appointmentId,
    });
  }
}

export const listDailySchedule = query({
  args: {
    tenantId: v.id("tenants"),
    clinicId: v.id("clinics"),
    appointmentDate: v.string(),
    refreshNonce: v.optional(v.number()),
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
  handler: async (ctx, args) => {
    const { db } = ctx;
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

    await scheduleAppointmentAutomation(ctx, {
      tenantId: args.tenantId,
      clinicId: args.clinicId,
      appointmentId,
      appointmentDate: args.appointmentDate,
      startMinute: candidateRange.startMinute,
      hasEmail: Boolean(args.patientEmail),
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
  handler: async (ctx, args) => {
    const { db } = ctx;
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

    await ctx.scheduler.runAfter(
      0,
      internal.appointments.processWaitlistAfterCancellation,
      {
        tenantId: args.tenantId,
        clinicId: args.clinicId,
        doctorUserId: appointment.doctorUserId,
        appointmentDate: appointment.appointmentDate,
        cancelledAppointmentId: appointment._id,
      },
    );

    return { cancelled: true };
  },
});

export const markAppointmentNoShow = mutation({
  args: {
    tenantId: v.id("tenants"),
    clinicId: v.id("clinics"),
    appointmentId: v.id("appointments"),
  },
  handler: async ({ db }, args) => {
    const appointment = await db.get(args.appointmentId);

    if (!appointment) {
      throwAppError("NOT_FOUND", "Appointment was not found.");
    }

    if (appointment.tenantId !== args.tenantId || appointment.clinicId !== args.clinicId) {
      throwAppError("FORBIDDEN", "Appointment does not belong to this clinic.");
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

export const listActiveWaitlist = query({
  args: {
    tenantId: v.id("tenants"),
    clinicId: v.id("clinics"),
    doctorUserId: v.optional(v.id("users")),
    desiredDate: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async ({ db }, args) => {
    if (args.desiredDate) {
      assertIsoDate(args.desiredDate, "desiredDate");
    }

    const limit = Math.max(1, Math.min(args.limit ?? 50, 200));

    const doctorUserId = args.doctorUserId;

    const waitlistRows = doctorUserId
      ? await db
          .query("waitlistEntries")
          .withIndex("by_tenant_clinic_doctor_status", (q) =>
            q
              .eq("tenantId", args.tenantId)
              .eq("clinicId", args.clinicId)
              .eq("doctorUserId", doctorUserId)
              .eq("status", "active"),
          )
          .take(200)
      : await db
          .query("waitlistEntries")
          .withIndex("by_tenant_clinic_status", (q) =>
            q
              .eq("tenantId", args.tenantId)
              .eq("clinicId", args.clinicId)
              .eq("status", "active"),
          )
          .take(200);

    return waitlistRows
      .filter(
        (entry) =>
          args.desiredDate === undefined ||
          entry.desiredDate === undefined ||
          entry.desiredDate === args.desiredDate,
      )
      .sort((a, b) => {
        const aRank =
          args.desiredDate && a.desiredDate === args.desiredDate ? 0 : 1;
        const bRank =
          args.desiredDate && b.desiredDate === args.desiredDate ? 0 : 1;

        if (aRank !== bRank) {
          return aRank - bRank;
        }

        return a.createdAt - b.createdAt;
      })
      .slice(0, limit);
  },
});

export const processWaitlistAfterCancellation = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    clinicId: v.id("clinics"),
    doctorUserId: v.id("users"),
    appointmentDate: v.string(),
    cancelledAppointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const activeWaitlist = await ctx.db
      .query("waitlistEntries")
      .withIndex("by_tenant_clinic_doctor_status", (q) =>
        q
          .eq("tenantId", args.tenantId)
          .eq("clinicId", args.clinicId)
          .eq("doctorUserId", args.doctorUserId)
          .eq("status", "active"),
      )
      .take(200);

    const ranked = activeWaitlist
      .filter(
        (entry) =>
          entry.desiredDate === undefined || entry.desiredDate === args.appointmentDate,
      )
      .sort((a, b) => {
        const aRank = a.desiredDate === args.appointmentDate ? 0 : 1;
        const bRank = b.desiredDate === args.appointmentDate ? 0 : 1;

        if (aRank !== bRank) {
          return aRank - bRank;
        }

        return a.createdAt - b.createdAt;
      });

    const candidate = ranked[0];
    if (!candidate) {
      return { notified: false };
    }

    await ctx.db.patch(candidate._id, {
      status: "notified",
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      tenantId: args.tenantId,
      clinicId: args.clinicId,
      actorRole: "receptionist",
      action: "waitlist_candidate_notified",
      entityType: "waitlistEntry",
      entityId: String(candidate._id),
      metadata: JSON.stringify({
        cancelledAppointmentId: args.cancelledAppointmentId,
        appointmentDate: args.appointmentDate,
      }),
      createdAt: Date.now(),
    });

    return {
      notified: true,
      waitlistEntryId: candidate._id,
    };
  },
});

export const dispatchReminderNotification = internalMutation({
  args: {
    notificationLogId: v.id("notificationLogs"),
    attempt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const attempt = args.attempt ?? 0;
    const notificationLog = await ctx.db.get(args.notificationLogId);

    if (!notificationLog || notificationLog.status !== "pending") {
      return { processed: false };
    }

    const appointment = await ctx.db.get(notificationLog.appointmentId);
    if (!appointment) {
      await ctx.db.patch(notificationLog._id, {
        status: "failed",
        error: "appointment_not_found",
      });
      return { processed: true, status: "failed" };
    }

    if (appointment.status !== "confirmed") {
      await ctx.db.patch(notificationLog._id, {
        status: "failed",
        error: "appointment_not_confirmed",
      });
      return { processed: true, status: "failed" };
    }

    if (notificationLog.channel === "email" && !appointment.patientEmail) {
      await ctx.db.patch(notificationLog._id, {
        status: "failed",
        error: "email_not_available",
      });
      return { processed: true, status: "failed" };
    }

    const transientFailure =
      attempt === 0 &&
      notificationLog.template === "reminder_3h" &&
      notificationLog.channel === "sms";

    if (transientFailure) {
      if (attempt + 1 >= MAX_NOTIFICATION_RETRIES) {
        await ctx.db.patch(notificationLog._id, {
          status: "failed",
          error: "max_retries_reached",
        });
        return { processed: true, status: "failed" };
      }

      await ctx.db.patch(notificationLog._id, {
        error: `transient_provider_error_attempt_${attempt + 1}`,
      });

      await ctx.scheduler.runAfter(
        60 * 1000,
        internal.appointments.dispatchReminderNotification,
        {
          notificationLogId: notificationLog._id,
          attempt: attempt + 1,
        },
      );

      return { processed: true, status: "retry_scheduled" };
    }

    await ctx.db.patch(notificationLog._id, {
      status: "sent",
      sentAt: Date.now(),
      providerMessageId: `sim-${notificationLog.channel}-${Date.now()}`,
      error: "",
    });

    return { processed: true, status: "sent" };
  },
});

export const autoMarkNoShow = internalMutation({
  args: {
    tenantId: v.id("tenants"),
    clinicId: v.id("clinics"),
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.appointmentId);

    if (!appointment) {
      return { updated: false, reason: "not_found" };
    }

    if (appointment.tenantId !== args.tenantId || appointment.clinicId !== args.clinicId) {
      return { updated: false, reason: "foreign_appointment" };
    }

    if (appointment.status !== "confirmed") {
      return { updated: false, reason: "status_not_confirmed" };
    }

    await ctx.db.patch(args.appointmentId, {
      status: "no_show",
      updatedAt: Date.now(),
    });

    return { updated: true };
  },
});
