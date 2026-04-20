import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { assertSlotDuration } from "./lib/bookingValidation";
import { throwAppError } from "./lib/errors";

const DEMO_TENANT_SLUG = "demo-clinic";
const DEMO_TENANT_NAME = "Demo Clinic";
const DEMO_CLINIC_NAME = "Main Branch";
const DEMO_DOCTOR_NAME = "Dr. Ahmed Khaled";
const DEMO_RECEPTIONIST_NAME = "Mona Hassan";

const SAMPLE_PATIENTS = [
  {
    fullName: "Sara Mahmoud",
    phone: "+201012345678",
    email: "sara@example.com",
    preferredLanguage: "ar" as const,
  },
  {
    fullName: "Mohamed Tamer",
    phone: "+201098765432",
    email: "mohamed@example.com",
    preferredLanguage: "ar" as const,
  },
  {
    fullName: "Nour Samir",
    phone: "+201112223334",
    email: "nour@example.com",
    preferredLanguage: "en" as const,
  },
];

async function ensureTenant(ctx: MutationCtx) {
  const existing = await ctx.db
    .query("tenants")
    .withIndex("by_slug", (q) => q.eq("slug", DEMO_TENANT_SLUG))
    .unique();

  if (existing) {
    return existing;
  }

  const now = Date.now();
  const tenantId = await ctx.db.insert("tenants", {
    name: DEMO_TENANT_NAME,
    slug: DEMO_TENANT_SLUG,
    locale: "ar",
    timezone: "Africa/Cairo",
    isActive: true,
    createdAt: now,
  });

  return await ctx.db.get(tenantId);
}

export const seedDemoData = mutation({
  args: {
    locale: v.optional(v.union(v.literal("ar"), v.literal("en"))),
    timezone: v.optional(v.string()),
    slotMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const slotMinutes = args.slotMinutes ?? 15;
    assertSlotDuration(slotMinutes);

    const tenant = await ensureTenant(ctx);
    if (!tenant) {
      throwAppError("NOT_FOUND", "Failed to create or load demo tenant.");
    }

    if (args.locale || args.timezone) {
      await ctx.db.patch(tenant._id, {
        locale: args.locale ?? tenant.locale,
        timezone: args.timezone ?? tenant.timezone,
      });
    }

    const tenantId = tenant._id;

    const clinics = await ctx.db
      .query("clinics")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .collect();

    let clinic = clinics.find((item) => item.name === DEMO_CLINIC_NAME) ?? null;
    if (!clinic) {
      const clinicId = await ctx.db.insert("clinics", {
        tenantId,
        name: DEMO_CLINIC_NAME,
        phone: "+201000000000",
        email: "clinic@example.com",
        address: "Nasr City, Cairo",
        isActive: true,
        createdAt: now,
      });
      clinic = await ctx.db.get(clinicId);
    }

    if (!clinic) {
      throwAppError("NOT_FOUND", "Failed to create or load demo clinic.");
    }

    const users = await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .collect();

    let doctor =
      users.find(
      (user) =>
        user.role === "doctor" &&
        user.fullName === DEMO_DOCTOR_NAME &&
        user.clinicId === clinic._id,
    ) ?? null;

    if (!doctor) {
      const doctorId = await ctx.db.insert("users", {
        tenantId,
        clinicId: clinic._id,
        role: "doctor",
        fullName: DEMO_DOCTOR_NAME,
        email: "doctor@example.com",
        phone: "+201055555555",
        isActive: true,
        createdAt: now,
      });
      doctor = await ctx.db.get(doctorId);
    }

    let receptionist =
      users.find(
      (user) =>
        user.role === "receptionist" &&
        user.fullName === DEMO_RECEPTIONIST_NAME &&
        user.clinicId === clinic._id,
    ) ?? null;

    if (!receptionist) {
      const receptionistId = await ctx.db.insert("users", {
        tenantId,
        clinicId: clinic._id,
        role: "receptionist",
        fullName: DEMO_RECEPTIONIST_NAME,
        email: "reception@example.com",
        phone: "+201066666666",
        isActive: true,
        createdAt: now,
      });
      receptionist = await ctx.db.get(receptionistId);
    }

    if (!doctor || !receptionist) {
      throwAppError("NOT_FOUND", "Failed to create or load demo users.");
    }

    let patientCount = 0;
    for (const patient of SAMPLE_PATIENTS) {
      const existingPatient = (
        await ctx.db
          .query("patients")
          .withIndex("by_tenant_phone", (q) =>
            q.eq("tenantId", tenantId).eq("phone", patient.phone),
          )
          .collect()
      )[0];

      if (existingPatient) {
        patientCount += 1;
        continue;
      }

      const patientId = await ctx.db.insert("patients", {
        tenantId,
        clinicId: clinic._id,
        fullName: patient.fullName,
        phone: patient.phone,
        email: patient.email,
        preferredLanguage: patient.preferredLanguage,
        createdAt: now,
      });

      if (patientId) {
        patientCount += 1;
      }
    }

    for (const dayOfWeek of [0, 1, 2, 3, 4]) {
      const existingSchedule = (
        await ctx.db
          .query("doctorSchedules")
          .withIndex("by_tenant_clinic_doctor_day", (q) =>
            q
              .eq("tenantId", tenantId)
              .eq("clinicId", clinic._id)
              .eq("doctorUserId", doctor._id)
              .eq("dayOfWeek", dayOfWeek),
          )
          .collect()
      )[0];

      if (!existingSchedule) {
        await ctx.db.insert("doctorSchedules", {
          tenantId,
          clinicId: clinic._id,
          doctorUserId: doctor._id,
          dayOfWeek,
          startMinute: 10 * 60,
          endMinute: 16 * 60,
          slotMinutes,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        await ctx.db.patch(existingSchedule._id, {
          slotMinutes,
          isActive: true,
          updatedAt: now,
        });
      }
    }

    return {
      seeded: true,
      tenantId,
      clinicId: clinic._id,
      doctorUserId: doctor._id,
      receptionistUserId: receptionist._id,
      patientCount,
      slotMinutes,
    };
  },
});

export const getDemoContext = query({
  args: {},
  handler: async (ctx) => {
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", DEMO_TENANT_SLUG))
      .unique();

    if (!tenant) {
      return {
        ready: false,
      } as const;
    }

    const clinic = (
      await ctx.db
        .query("clinics")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenant._id))
        .collect()
    )[0];

    if (!clinic) {
      return {
        ready: false,
      } as const;
    }

    const doctor = (
      await ctx.db
        .query("users")
        .withIndex("by_tenant_role", (q) =>
          q.eq("tenantId", tenant._id).eq("role", "doctor"),
        )
        .collect()
    ).find((user) => user.clinicId === clinic._id);

    if (!doctor) {
      return {
        ready: false,
      } as const;
    }

    const mondaySchedule = (
      await ctx.db
        .query("doctorSchedules")
        .withIndex("by_tenant_clinic_doctor_day", (q) =>
          q
            .eq("tenantId", tenant._id)
            .eq("clinicId", clinic._id)
            .eq("doctorUserId", doctor._id)
            .eq("dayOfWeek", 1),
        )
        .collect()
    )[0];

    return {
      ready: true,
      tenantId: tenant._id,
      clinicId: clinic._id,
      doctorUserId: doctor._id,
      timezone: tenant.timezone,
      locale: tenant.locale,
      slotMinutes: mondaySchedule?.slotMinutes ?? 15,
      tenantName: tenant.name,
      clinicName: clinic.name,
      doctorName: doctor.fullName,
    } as const;
  },
});
