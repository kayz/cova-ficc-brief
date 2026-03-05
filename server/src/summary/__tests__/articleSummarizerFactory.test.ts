import { describe, expect, it } from "vitest";
import { CovaHttpArticleSummarizer } from "../covaHttpArticleSummarizer";
import { LocalArticleSummarizer } from "../articleSummarizer";
import { createArticleSummarizerFromEnv } from "../articleSummarizerFactory";

describe("createArticleSummarizerFromEnv", () => {
  it("returns local summarizer when COVA_BASE_URL is empty", () => {
    const summarizer = createArticleSummarizerFromEnv({} as any);
    expect(summarizer).toBeInstanceOf(LocalArticleSummarizer);
  });

  it("returns cova summarizer when COVA_BASE_URL is set", () => {
    const summarizer = createArticleSummarizerFromEnv({
      COVA_BASE_URL: "https://cova.example.com",
      COVA_EXPERT_ID: "cova-ficc-brief"
    } as any);
    expect(summarizer).toBeInstanceOf(CovaHttpArticleSummarizer);
  });
});
