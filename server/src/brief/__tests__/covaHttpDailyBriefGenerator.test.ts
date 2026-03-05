import { describe, expect, it, vi } from "vitest";
import { CovaHttpDailyBriefGenerator } from "../covaHttpDailyBriefGenerator";

describe("CovaHttpDailyBriefGenerator", () => {
  it("maps cova response into daily brief", async () => {
    const post = vi.fn().mockResolvedValue({
      data: {
        result: {
          title: "COVA brief",
          answer: "Market moved lower.",
          generated_at: "2026-03-06T04:00:00.000Z"
        }
      }
    });
    const gen = new CovaHttpDailyBriefGenerator({
      post
    } as any, "cova-ficc-brief");

    const out = await gen.generateDailyBrief([], new Date("2026-03-06T04:00:00+08:00"));
    expect(post).toHaveBeenCalled();
    expect(out.title).toBe("COVA brief");
    expect(out.content).toContain("Market moved lower.");
  });
});
