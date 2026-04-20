import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { throwAppError } from "./errors";

type AuthCtx = QueryCtx | MutationCtx;

type AppUserRole = "owner" | "doctor" | "receptionist" | "patient";

type Scope = {
  tenantId: Id<"tenants">;
  clinicId: Id<"clinics">;
};

async function findUserByTokenIdentifier(ctx: AuthCtx, tokenIdentifier: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .unique();

  if (!user) {
    throwAppError("FORBIDDEN", "Authenticated identity is not linked to a clinic user.");
  }

  if (!user.isActive) {
    throwAppError("FORBIDDEN", "User is inactive.");
  }

  return user;
}

function ensureScopedUser(user: Doc<"users">, scope: Scope) {
  if (user.tenantId !== scope.tenantId || user.clinicId !== scope.clinicId) {
    throwAppError("FORBIDDEN", "Authenticated user does not belong to the current clinic scope.");
  }
}

export async function resolveOptionalScopedUser(ctx: AuthCtx, scope: Scope) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await findUserByTokenIdentifier(ctx, identity.tokenIdentifier);
  ensureScopedUser(user, scope);
  return user;
}

export async function requireScopedUser(ctx: AuthCtx, scope: Scope) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throwAppError("UNAUTHORIZED", "Authentication is required.");
  }

  const user = await findUserByTokenIdentifier(ctx, identity.tokenIdentifier);
  ensureScopedUser(user, scope);
  return user;
}

export async function requireRoleInScope(
  ctx: AuthCtx,
  args: Scope & {
    allowedRoles: AppUserRole[];
  },
) {
  const user = await requireScopedUser(ctx, {
    tenantId: args.tenantId,
    clinicId: args.clinicId,
  });

  if (!args.allowedRoles.includes(user.role as AppUserRole)) {
    throwAppError("FORBIDDEN", "You do not have permission for this action.");
  }

  return user;
}
