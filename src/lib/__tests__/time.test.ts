import { describe, expect, it } from "vitest";
import { minuteToTimeLabel, nextDaysIso, pad2 } from "../time";

describe("time helpers", () => {
  it("pads values to two digits", () => {
    expect(pad2(3)).toBe("03");
    expect(pad2(12)).toBe("12");
  });

  it("converts minutes to HH:mm labels", () => {
    expect(minuteToTimeLabel(0)).toBe("00:00");
    expect(minuteToTimeLabel(615)).toBe("10:15");
    expect(minuteToTimeLabel(1439)).toBe("23:59");
  });

  it("generates a fixed number of upcoming dates", () => {
    const days = nextDaysIso(4);
    expect(days).toHaveLength(4);

    for (const value of days) {
      expect(/^\d{4}-\d{2}-\d{2}$/.test(value)).toBe(true);
    }
  });
});
