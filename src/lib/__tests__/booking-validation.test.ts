import { describe, expect, it } from "vitest";
import {
  isPastIsoDate,
  isValidEmail,
  isValidIsoDate,
  isValidPhone,
  validateSlotRange,
} from "../booking-validation";

describe("booking validation", () => {
  it("accepts valid ISO dates", () => {
    expect(isValidIsoDate("2026-05-20")).toBe(true);
  });

  it("rejects invalid ISO dates", () => {
    expect(isValidIsoDate("20-05-2026")).toBe(false);
    expect(isValidIsoDate("2026-15-99")).toBe(false);
  });

  it("detects past dates", () => {
    expect(isPastIsoDate("2000-01-01")).toBe(true);
  });

  it("validates phone and email", () => {
    expect(isValidPhone("+201012345678")).toBe(true);
    expect(isValidPhone("abc")).toBe(false);
    expect(isValidEmail("demo@example.com")).toBe(true);
    expect(isValidEmail("demo@@example")).toBe(false);
  });

  it("validates slot range", () => {
    expect(validateSlotRange(600, 615)).toBeNull();
    expect(validateSlotRange(700, 650)).not.toBeNull();
    expect(validateSlotRange(-1, 10)).not.toBeNull();
  });
});
