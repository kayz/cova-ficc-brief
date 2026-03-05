import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../app";

describe("daily brief API", () => {
  it("returns 404 for latest before any run", async () => {
    const app = createApp();
    const res = await request(app).get("/api/briefs/daily/latest");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("no_daily_brief");
  });

  it("can trigger and read latest daily brief", async () => {
    const app = createApp();
    await request(app).post("/api/articles/import").send({
      institutionName: "Test Research",
      title: "Rates Update",
      summary: "Bond yields moved lower.",
      pubDate: "2026-03-06T03:30:00+08:00",
      link: "https://example.com/rates-update"
    });
    const run = await request(app)
      .post("/api/briefs/daily/run")
      .send({ runAt: "2026-03-06T04:00:00+08:00" });
    expect(run.status).toBe(200);
    expect(run.body.articleCount).toBe(1);

    const latest = await request(app).get("/api/briefs/daily/latest");
    expect(latest.status).toBe(200);
    expect(latest.body.id).toBe(run.body.id);
  });

  it("uses injected brief generator for run", async () => {
    const generateDailyBrief = vi.fn().mockResolvedValue({
      id: "brief_from_adapter",
      title: "adapter brief",
      content: "adapter content",
      articleCount: 0,
      fromAt: "2026-03-05T20:00:00.000Z",
      toAt: "2026-03-06T20:00:00.000Z",
      createdAt: "2026-03-06T20:00:01.000Z"
    });
    const app = createApp({
      dailyBriefGenerator: {
        generateDailyBrief
      } as any
    });

    const run = await request(app).post("/api/briefs/daily/run").send({});
    expect(run.status).toBe(200);
    expect(generateDailyBrief).toHaveBeenCalled();
    expect(run.body.id).toBe("brief_from_adapter");
  });
});
