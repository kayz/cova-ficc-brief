import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../app";

describe("article summary generation", () => {
  it("auto-generates summary when summary is missing", async () => {
    const summarize = vi.fn().mockResolvedValue("generated summary");
    const app = createApp({
      articleSummarizer: {
        summarize
      } as any
    });

    const res = await request(app).post("/api/articles/import").send({
      institutionName: "Macro Desk",
      title: "Rates Update",
      content: "<p>Full market content.</p>",
      pubDate: "2026-03-07T08:00:00+08:00",
      link: "https://example.com/rates-update"
    });

    expect(res.status).toBe(201);
    expect(res.body.article.summary).toBe("generated summary");
    expect(summarize).toHaveBeenCalledTimes(1);
  });

  it("does not re-generate summary when summary already provided", async () => {
    const summarize = vi.fn().mockResolvedValue("generated summary");
    const app = createApp({
      articleSummarizer: {
        summarize
      } as any
    });

    const res = await request(app).post("/api/articles/import").send({
      institutionName: "Macro Desk",
      title: "Rates Update",
      summary: "existing summary",
      content: "<p>Full market content.</p>",
      pubDate: "2026-03-07T08:00:00+08:00",
      link: "https://example.com/rates-update"
    });

    expect(res.status).toBe(201);
    expect(res.body.article.summary).toBe("existing summary");
    expect(summarize).toHaveBeenCalledTimes(0);
  });

  it("does not invoke summarizer for duplicate import", async () => {
    const summarize = vi.fn().mockResolvedValue("generated summary");
    const app = createApp({
      articleSummarizer: {
        summarize
      } as any
    });

    const payload = {
      institutionName: "Macro Desk",
      title: "Rates Update",
      content: "<p>Full market content.</p>",
      pubDate: "2026-03-07T08:00:00+08:00",
      link: "https://example.com/rates-update"
    };

    const first = await request(app).post("/api/articles/import").send(payload);
    const second = await request(app).post("/api/articles/import").send(payload);
    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(summarize).toHaveBeenCalledTimes(1);
  });
});
