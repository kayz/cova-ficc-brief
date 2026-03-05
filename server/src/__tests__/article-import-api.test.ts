import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";

describe("article import API", () => {
  it("imports an article and creates institution if missing", async () => {
    const app = createApp();
    const res = await request(app).post("/api/articles/import").send({
      institutionName: "Test Research",
      title: "Rates Update",
      summary: "Bond yields moved lower.",
      pubDate: "2026-03-06T03:30:00+08:00",
      link: "https://example.com/rates-update"
    });

    expect(res.status).toBe(201);
    expect(res.body.created).toBe(true);
    expect(res.body.article.title).toBe("Rates Update");
    expect(res.body.institution.name).toBe("Test Research");
  });

  it("deduplicates by institution + title + pubDate", async () => {
    const app = createApp();
    const body = {
      institutionName: "Test Research",
      title: "Rates Update",
      summary: "Bond yields moved lower.",
      pubDate: "2026-03-06T03:30:00+08:00",
      link: "https://example.com/rates-update"
    };
    const first = await request(app).post("/api/articles/import").send(body);
    const second = await request(app).post("/api/articles/import").send(body);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.created).toBe(false);
    expect(second.body.article.id).toBe(first.body.article.id);
  });
});
