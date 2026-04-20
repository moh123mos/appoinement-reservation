import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const userRole = v.union(
  v.literal("owner"),
  v.literal("doctor"),
  v.literal("receptionist"),
  v.literal("patient"),
  v.literal("system"),
);

const appointmentStatus = v.union(
  v.literal("confirmed"),
  v.literal("cancelled"),
  v.literal("completed"),
  v.literal("no_show"),
);

const appointmentSource = v.union(
  v.literal("guest"),
  v.literal("patient"),
  v.literal("receptionist"),
  v.literal("doctor"),
);

const language = v.union(v.literal("ar"), v.literal("en"));

export default defineSchema({
  tenants: defineTable({
    name: v.string(),
    slug: v.string(),
    locale: language,
    timezone: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  clinics: defineTable({
    tenantId: v.id("tenants"),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_tenant", ["tenantId"]),

  users: defineTable({
    tenantId: v.id("tenants"),
    clinicId: v.id("clinics"),
    role: userRole,
    tokenIdentifier: v.optional(v.string()),
    fullName: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_role", ["tenantId", "role"])
    .index("by_token_identifier", ["tokenIdentifier"]),

  patients: defineTable({
    tenantId: v.id("tenants"),
    clinicId: v.id("clinics"),
    fullName: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    preferredLanguage: language,
    createdAt: v.number(),
    lastSeenAt: v.optional(v.number()),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_phone", ["tenantId", "phone"]),

  doctorSchedules: defineTable({
    tenantId: v.id("tenants"),
    clinicId: v.id("clinics"),
    doctorUserId: v.id("users"),
    dayOfWeek: v.number(),
    startMinute: v.number(),
    endMinute: v.number(),
    slotMinutes: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_tenant_clinic_doctor_day", [
    "tenantId",
    "clinicId",
    "doctorUserId",
    "dayOfWeek",
  ]),

  appointments: defineTable({
    tenantId: v.id("tenants"),
    clinicId: v.id("clinics"),
    doctorUserId: v.id("users"),
    patientId: v.optional(v.id("patients")),
    patientName: v.string(),
    patientPhone: v.string(),
    patientEmail: v.optional(v.string()),
    appointmentDate: v.string(),
    startMinute: v.number(),
    endMinute: v.number(),
    status: appointmentStatus,
    source: appointmentSource,
    notes: v.optional(v.string()),
    cancellationReason: v.optional(v.string()),
    cancelledAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant_clinic_date_start", [
      "tenantId",
      "clinicId",
      "appointmentDate",
      "startMinute",
    ])
    .index("by_tenant_clinic_doctor_date_start", [
      "tenantId",
      "clinicId",
      "doctorUserId",
      "appointmentDate",
      "startMinute",
    ])
    .index("by_tenant_clinic_status", ["tenantId", "clinicId", "status"]),

  waitlistEntries: defineTable({
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
    status: v.union(
      v.literal("active"),
      v.literal("notified"),
      v.literal("booked"),
      v.literal("removed"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant_clinic_doctor_status", [
      "tenantId",
      "clinicId",
      "doctorUserId",
      "status",
    ])
    .index("by_tenant_clinic_status", ["tenantId", "clinicId", "status"]),

  notificationLogs: defineTable({
    tenantId: v.id("tenants"),
    clinicId: v.id("clinics"),
    appointmentId: v.id("appointments"),
    channel: v.union(v.literal("sms"), v.literal("email")),
    template: v.union(v.literal("reminder_24h"), v.literal("reminder_3h")),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed"),
    ),
    scheduledFor: v.number(),
    sentAt: v.optional(v.number()),
    providerMessageId: v.optional(v.string()),
    error: v.optional(v.string()),
  })
    .index("by_appointment", ["appointmentId"])
    .index("by_status_scheduled", ["status", "scheduledFor"]),

  bookingRateLimits: defineTable({
    tenantId: v.id("tenants"),
    clinicId: v.id("clinics"),
    action: v.union(v.literal("create_appointment"), v.literal("add_waitlist")),
    key: v.string(),
    attempts: v.number(),
    windowStartedAt: v.number(),
    blockedUntil: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_tenant_clinic_key", ["tenantId", "clinicId", "key"])
    .index("by_tenant_clinic_action", ["tenantId", "clinicId", "action"]),

  auditLogs: defineTable({
    tenantId: v.id("tenants"),
    clinicId: v.id("clinics"),
    actorRole: userRole,
    actorUserId: v.optional(v.id("users")),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    metadata: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_tenant_created", ["tenantId", "createdAt"]),
});
