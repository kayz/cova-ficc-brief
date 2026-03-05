import { describe, expect, it } from "vitest";
import { getChinaDateKey, shouldRunDailyBriefAt } from "../scheduler";

describe("daily brief scheduler", () => {
  it("builds china date key from utc timestamp", () => {
    expect(getChinaDateKey(new Date("2026-03-05T20:10:00Z"))).toBe("2026-03-06");
  });

  it("runs only once at 04:00 china time", () => {
    const atWindow = new Date("2026-03-05T20:00:00Z"); // 2026-03-06 04:00 CST
    const notWindow = new Date("2026-03-05T19:59:00Z"); // 03:59 CST

    expect(shouldRunDailyBriefAt(notWindow, null)).toBe(false);
    expect(shouldRunDailyBriefAt(atWindow, null)).toBe(true);
    expect(shouldRunDailyBriefAt(atWindow, "2026-03-06")).toBe(false);
  });
});
