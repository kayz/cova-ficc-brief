import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";

describe("rss feed endpoints", () => {
  it("returns raw and summary RSS feeds", async () => {
    const app = createApp();

    const imported = await request(app).post("/api/articles/import").send({
      institutionName: "Macro Desk",
      title: "Rates Daily",
      summary: "Yield curve steepened.",
      content: "<p>Full market content.</p>",
      pubDate: "2026-03-07T08:00:00+08:00",
      link: "https://example.com/rates-daily"
    });
    expect(imported.status).toBe(201);

    const raw = await request(app).get("/feeds/raw.rss");
    expect(raw.status).toBe(200);
    expect(raw.headers["content-type"]).toContain("application/rss+xml");
    expect(raw.text).toContain("<title>COVA FICC Brief - Raw Feed</title>");
    expect(raw.text).toContain("Rates Daily");
    expect(raw.text).toContain("Full market content.");

    const summary = await request(app).get("/feeds/summary.rss");
    expect(summary.status).toBe(200);
    expect(summary.headers["content-type"]).toContain("application/rss+xml");
    expect(summary.text).toContain("<title>COVA FICC Brief - Summary Feed</title>");
    expect(summary.text).toContain("Yield curve steepened.");
    expect(summary.text).not.toContain("Full market content.");
  });

  it("returns valid empty feed when there are no articles", async () => {
    const app = createApp();

    const raw = await request(app).get("/feeds/raw.rss");
    expect(raw.status).toBe(200);
    expect(raw.text).toContain("<channel>");
    expect(raw.text).toContain("</channel>");
  });
});
