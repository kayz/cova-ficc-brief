import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";

describe("subscriber feed APIs", () => {
  it("creates subscriber, subscribes institution, and returns subscriber scoped feeds", async () => {
    const app = createApp();

    await request(app).post("/api/articles/import").send({
      institutionName: "Macro Desk",
      title: "Macro Morning",
      summary: "Macro summary.",
      content: "<p>Macro full content.</p>",
      pubDate: "2026-03-07T09:00:00+08:00",
      link: "https://example.com/macro"
    });

    await request(app).post("/api/articles/import").send({
      institutionName: "Credit Desk",
      title: "Credit Morning",
      summary: "Credit summary.",
      content: "<p>Credit full content.</p>",
      pubDate: "2026-03-07T09:10:00+08:00",
      link: "https://example.com/credit"
    });

    const subscriber = await request(app).post("/api/subscribers").send({
      name: "Desk Reader"
    });
    expect(subscriber.status).toBe(201);

    const sub = await request(app).post("/api/subscriptions").send({
      subscriberId: subscriber.body.id,
      institutionName: "Macro Desk"
    });
    expect(sub.status).toBe(201);
    expect(sub.body.created).toBe(true);

    const raw = await request(app).get(`/feeds/subscribers/${subscriber.body.id}/raw.rss`);
    expect(raw.status).toBe(200);
    expect(raw.text).toContain("Macro Morning");
    expect(raw.text).toContain("Macro full content.");
    expect(raw.text).not.toContain("Credit Morning");

    const summary = await request(app).get(`/feeds/subscribers/${subscriber.body.id}/summary.rss`);
    expect(summary.status).toBe(200);
    expect(summary.text).toContain("Macro summary.");
    expect(summary.text).not.toContain("Credit summary.");
    expect(summary.text).not.toContain("Macro full content.");
  });

  it("returns 404 for unknown subscriber feed", async () => {
    const app = createApp();
    const raw = await request(app).get("/feeds/subscribers/not-exists/raw.rss");
    expect(raw.status).toBe(404);
    expect(raw.body.error).toBe("subscriber_not_found");
  });
});
