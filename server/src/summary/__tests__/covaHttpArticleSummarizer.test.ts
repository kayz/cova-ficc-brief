import { describe, expect, it, vi } from "vitest";
import { CovaHttpArticleSummarizer } from "../covaHttpArticleSummarizer";

describe("CovaHttpArticleSummarizer", () => {
  it("calls cova endpoint and returns answer", async () => {
    const http = {
      post: vi.fn().mockResolvedValue({
        data: {
          result: {
            answer: "summary from cova"
          }
        }
      })
    };
    const summarizer = new CovaHttpArticleSummarizer(http as any, "cova-ficc-brief");

    const summary = await summarizer.summarize({
      institutionName: "Macro Desk",
      title: "Rates Update",
      content: "full content",
      link: "https://example.com/rates",
      pubDate: "2026-03-07T08:00:00+08:00"
    });

    expect(summary).toBe("summary from cova");
    expect(http.post).toHaveBeenCalledTimes(1);
    const payload = http.post.mock.calls[0][1];
    expect(payload.expert_id).toBe("cova-ficc-brief");
  });
});
