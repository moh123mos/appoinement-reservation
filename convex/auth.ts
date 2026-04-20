import { query } from "./_generated/server";
import { throwAppError } from "./lib/errors";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throwAppError("UNAUTHORIZED", "Authentication is required.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throwAppError("FORBIDDEN", "Authenticated identity is not linked to a clinic user.");
    }

    return {
      userId: user._id,
      tenantId: user.tenantId,
      clinicId: user.clinicId,
      role: user.role,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      tokenIdentifier: identity.tokenIdentifier,
    };
  },
});
