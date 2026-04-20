import { describe, expect, it } from "vitest";
import {
  requireRoleInScope,
  requireScopedUser,
  resolveOptionalScopedUser,
} from "../authz";

type AuthCtxParam = Parameters<typeof requireScopedUser>[0];
type ScopeParam = Parameters<typeof requireScopedUser>[1];

function buildCtx(options: {
  identityToken?: string;
  userDoc?: Record<string, unknown> | null;
}) {
  const userDoc = options.userDoc ?? null;

  return {
    auth: {
      getUserIdentity: async () =>
        options.identityToken
          ? ({ tokenIdentifier: options.identityToken } as const)
          : null,
    },
    db: {
      query: () => ({
        withIndex: () => ({
          unique: async () => userDoc,
        }),
      }),
    },
  } as unknown as AuthCtxParam;
}

function buildUser(overrides?: Partial<Record<string, unknown>>) {
  return {
    _id: "user_1",
    _creationTime: Date.now(),
    tenantId: "tenant_1",
    clinicId: "clinic_1",
    role: "receptionist",
    fullName: "Mona Hassan",
    tokenIdentifier: "demo|receptionist",
    isActive: true,
    ...overrides,
  };
}

const scope = {
  tenantId: "tenant_1",
  clinicId: "clinic_1",
} as unknown as ScopeParam;

describe("authz guards", () => {
  it("returns null for optional scoped user when unauthenticated", async () => {
    const ctx = buildCtx({});
    await expect(resolveOptionalScopedUser(ctx, scope)).resolves.toBeNull();
  });

  it("throws UNAUTHORIZED when scoped user is required but identity is missing", async () => {
    const ctx = buildCtx({});

    await expect(requireScopedUser(ctx, scope)).rejects.toMatchObject({
      data: {
        code: "UNAUTHORIZED",
      },
    });
  });

  it("blocks cross-tenant access with FORBIDDEN", async () => {
    const ctx = buildCtx({
      identityToken: "demo|receptionist",
      userDoc: buildUser({ tenantId: "tenant_2" }),
    });

    await expect(requireScopedUser(ctx, scope)).rejects.toMatchObject({
      data: {
        code: "FORBIDDEN",
      },
    });
  });

  it("blocks role mismatch with FORBIDDEN", async () => {
    const ctx = buildCtx({
      identityToken: "demo|doctor",
      userDoc: buildUser({ role: "doctor", tokenIdentifier: "demo|doctor" }),
    });

    await expect(
      requireRoleInScope(ctx, {
        ...scope,
        allowedRoles: ["receptionist"],
      }),
    ).rejects.toMatchObject({
      data: {
        code: "FORBIDDEN",
      },
    });
  });

  it("allows access when role and scope are valid", async () => {
    const user = buildUser({ role: "owner", tokenIdentifier: "demo|owner" });
    const ctx = buildCtx({
      identityToken: "demo|owner",
      userDoc: user,
    });

    await expect(
      requireRoleInScope(ctx, {
        ...scope,
        allowedRoles: ["owner", "doctor"],
      }),
    ).resolves.toMatchObject({
      role: "owner",
      tenantId: scope.tenantId,
      clinicId: scope.clinicId,
    });
  });
});
