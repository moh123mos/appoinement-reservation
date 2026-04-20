import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { throwAppError } from "./errors";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_BLOCK_MS = 30 * 60 * 1000;

type BookingAction = "create_appointment" | "add_waitlist";

type AuditRole = "owner" | "doctor" | "receptionist" | "patient" | "system";

export function normalizePhoneKey(phone: string) {
  const normalized = phone.replace(/\D/g, "");
  return normalized || phone.trim();
}

export function maskPhone(phone: string) {
  const normalized = normalizePhoneKey(phone);
  if (normalized.length <= 4) {
    return "****";
  }

  const suffix = normalized.slice(-4);
  return `${"*".repeat(Math.max(4, normalized.length - 4))}${suffix}`;
}

export function maskEmail(email?: string) {
  if (!email) {
    return undefined;
  }

  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at <= 0) {
    return "***";
  }

  const namePart = trimmed.slice(0, at);
  const domainPart = trimmed.slice(at + 1);
  if (!domainPart) {
    return "***";
  }

  const lead = namePart[0] ?? "*";
  return `${lead}***@${domainPart}`;
}

export function buildPrivacySafeMetadata(metadata: Record<string, unknown>) {
  const output: Record<string, unknown> = { ...metadata };

  if (typeof output.patientPhone === "string") {
    output.patientPhoneMasked = maskPhone(output.patientPhone);
    delete output.patientPhone;
  }

  if (typeof output.patientEmail === "string") {
    output.patientEmailMasked = maskEmail(output.patientEmail);
    delete output.patientEmail;
  }

  if (typeof output.phone === "string") {
    output.phoneMasked = maskPhone(output.phone);
    delete output.phone;
  }

  if (typeof output.email === "string") {
    output.emailMasked = maskEmail(output.email);
    delete output.email;
  }

  return output;
}

export async function insertAuditLog(
  ctx: MutationCtx,
  args: {
    tenantId: Id<"tenants">;
    clinicId: Id<"clinics">;
    actorRole: AuditRole;
    actorUserId?: Id<"users">;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  },
) {
  const metadata = args.metadata
    ? JSON.stringify(buildPrivacySafeMetadata(args.metadata))
    : undefined;

  await ctx.db.insert("auditLogs", {
    tenantId: args.tenantId,
    clinicId: args.clinicId,
    actorRole: args.actorRole,
    actorUserId: args.actorUserId,
    action: args.action,
    entityType: args.entityType,
    entityId: args.entityId,
    metadata,
    createdAt: Date.now(),
  });
}

export async function enforceBookingRateLimit(
  ctx: MutationCtx,
  args: {
    tenantId: Id<"tenants">;
    clinicId: Id<"clinics">;
    action: BookingAction;
    phone: string;
  },
) {
  const now = Date.now();
  const key = `${args.action}:${normalizePhoneKey(args.phone)}`;

  const existing = await ctx.db
    .query("bookingRateLimits")
    .withIndex("by_tenant_clinic_key", (q) =>
      q.eq("tenantId", args.tenantId).eq("clinicId", args.clinicId).eq("key", key),
    )
    .unique();

  if (!existing) {
    await ctx.db.insert("bookingRateLimits", {
      tenantId: args.tenantId,
      clinicId: args.clinicId,
      action: args.action,
      key,
      attempts: 1,
      windowStartedAt: now,
      updatedAt: now,
    });
    return;
  }

  if (existing.blockedUntil && existing.blockedUntil > now) {
    throwAppError("RATE_LIMITED", "Too many booking attempts, try again later.");
  }

  const sameWindow = now - existing.windowStartedAt < RATE_LIMIT_WINDOW_MS;
  const nextAttempts = sameWindow ? existing.attempts + 1 : 1;

  const blockedUntil =
    sameWindow && nextAttempts > RATE_LIMIT_MAX_ATTEMPTS
      ? now + RATE_LIMIT_BLOCK_MS
      : undefined;

  const patchPayload: {
    attempts: number;
    windowStartedAt: number;
    updatedAt: number;
    blockedUntil?: number;
  } = {
    attempts: nextAttempts,
    windowStartedAt: sameWindow ? existing.windowStartedAt : now,
    updatedAt: now,
  };

  if (blockedUntil !== undefined) {
    patchPayload.blockedUntil = blockedUntil;
  }

  await ctx.db.patch(existing._id, patchPayload);

  if (blockedUntil) {
    throwAppError("RATE_LIMITED", "Too many booking attempts, try again later.");
  }
}
