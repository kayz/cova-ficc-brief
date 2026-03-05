import request from "supertest";
import { describe, expect, it } from "vitest";
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
    const run = await request(app)
      .post("/api/briefs/daily/run")
      .send({ runAt: "2026-03-06T04:00:00+08:00" });
    expect(run.status).toBe(200);
    expect(run.body.articleCount).toBeGreaterThanOrEqual(0);

    const latest = await request(app).get("/api/briefs/daily/latest");
    expect(latest.status).toBe(200);
    expect(latest.body.id).toBe(run.body.id);
  });
});
