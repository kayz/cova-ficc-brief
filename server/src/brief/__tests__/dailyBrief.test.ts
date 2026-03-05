import { describe, expect, it } from "vitest";
import { createDailyBrief } from "../dailyBrief";

describe("createDailyBrief", () => {
  it("summarizes articles in the last 24 hours", () => {
    const now = new Date("2026-03-06T04:00:00+08:00");
    const articles = [
      { title: "A", pubDate: "2026-03-06T03:00:00+08:00" },
      { title: "B", pubDate: "2026-03-05T05:00:00+08:00" },
      { title: "C", pubDate: "2026-03-04T23:00:00+08:00" }
    ];

    const brief = createDailyBrief(articles as any, now);
    expect(brief.articleCount).toBe(2);
    expect(brief.content).toContain("A");
    expect(brief.content).toContain("B");
    expect(brief.content).not.toContain("C");
  });
});
