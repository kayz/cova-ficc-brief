import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { newDb } from "pg-mem";
import type { Client } from "pg";
import request from "supertest";
import { createApp } from "../app";
import { PostgresContentStore, initContentSchema } from "../storage/postgresContentStore";

describe("postgres content persistence API", () => {
  let client: Client;
  let contentStore: PostgresContentStore;

  beforeAll(async () => {
    const db = newDb();
    const pg = db.adapters.createPg();
    const TestClient = pg.Client;
    client = new TestClient();
    await client.connect();
    await initContentSchema(client);
    contentStore = new PostgresContentStore(client);
  });

  afterAll(async () => {
    await client.end();
  });

  it("keeps articles and subscriptions after app re-created", async () => {
    const app1 = createApp({ contentStore });

    const imported = await request(app1).post("/api/articles/import").send({
      institutionName: "Macro Desk",
      title: "Rates Update",
      summary: "rates summary",
      link: "https://example.com/a",
      pubDate: "2026-03-07T08:00:00+08:00"
    });
    expect(imported.status).toBe(201);

    const subscriber = await request(app1).post("/api/subscribers").send({ name: "Desk Reader" });
    expect(subscriber.status).toBe(201);

    const sub = await request(app1).post("/api/subscriptions").send({
      subscriberId: subscriber.body.id,
      institutionName: "Macro Desk"
    });
    expect(sub.status).toBe(201);

    const app2 = createApp({ contentStore });
    const institutions = await request(app2).get("/api/institutions");
    expect(institutions.status).toBe(200);
    expect(institutions.body.length).toBe(1);

    const feed = await request(app2).get(`/feeds/subscribers/${subscriber.body.id}/summary.rss`);
    expect(feed.status).toBe(200);
    expect(feed.text).toContain("rates summary");
  });
});
