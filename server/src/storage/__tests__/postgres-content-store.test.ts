import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { newDb } from "pg-mem";
import type { Client } from "pg";
import { PostgresContentStore, initContentSchema } from "../postgresContentStore";

describe("PostgresContentStore", () => {
  let client: Client;
  let store: PostgresContentStore;

  beforeAll(async () => {
    const db = newDb();
    const pg = db.adapters.createPg();
    const TestClient = pg.Client;
    client = new TestClient();
    await client.connect();
    await initContentSchema(client);
    store = new PostgresContentStore(client);
  });

  afterAll(async () => {
    await client.end();
  });

  it("imports article with institution and deduplicates", async () => {
    const first = await store.importArticle({
      institutionName: "Macro Desk",
      title: "Rates Update",
      summary: "summary",
      content: "full",
      pubDate: "2026-03-07T08:00:00+08:00",
      link: "https://example.com/a"
    });
    const second = await store.importArticle({
      institutionName: "Macro Desk",
      title: "Rates Update",
      summary: "summary",
      content: "full",
      pubDate: "2026-03-07T08:00:00+08:00",
      link: "https://example.com/a"
    });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.article.id).toBe(first.article.id);
  });

  it("creates subscriber and deduplicates subscription", async () => {
    const subscriber = await store.createSubscriber("Desk Reader");
    const first = await store.upsertSubscription({
      subscriberId: subscriber.id,
      institutionName: "Macro Desk"
    });
    const second = await store.upsertSubscription({
      subscriberId: subscriber.id,
      institutionName: "macro desk"
    });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
  });
});
