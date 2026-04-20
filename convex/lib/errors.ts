import { ConvexError } from "convex/values";

export type AppErrorCode =
  | "BAD_REQUEST"
  | "INVALID_DATE"
  | "INVALID_TIME_RANGE"
  | "INVALID_EMAIL"
  | "INVALID_PHONE"
  | "SLOT_CONFLICT"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "DUPLICATE_BOOKING";

type AppErrorPayload = {
  code: AppErrorCode;
  message: string;
  details?: string;
};

export function throwAppError(
  code: AppErrorCode,
  message: string,
  details?: Record<string, unknown>,
): never {
  const payload: AppErrorPayload = {
    code,
    message,
    details: details ? JSON.stringify(details) : undefined,
  };

  throw new ConvexError(payload);
}
