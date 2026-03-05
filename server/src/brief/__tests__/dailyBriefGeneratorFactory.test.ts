import { describe, expect, it } from "vitest";
import { createDailyBriefGeneratorFromEnv } from "../dailyBriefGeneratorFactory";
import { CovaHttpDailyBriefGenerator } from "../covaHttpDailyBriefGenerator";
import { LocalDailyBriefGenerator } from "../dailyBriefGenerator";

describe("createDailyBriefGeneratorFromEnv", () => {
  it("returns local generator when COVA_BASE_URL is empty", () => {
    const g = createDailyBriefGeneratorFromEnv({} as any);
    expect(g).toBeInstanceOf(LocalDailyBriefGenerator);
  });

  it("returns cova http generator when COVA_BASE_URL is set", () => {
    const g = createDailyBriefGeneratorFromEnv({
      COVA_BASE_URL: "https://cova.example.com",
      COVA_EXPERT_ID: "cova-ficc-brief"
    } as any);
    expect(g).toBeInstanceOf(CovaHttpDailyBriefGenerator);
  });
});
