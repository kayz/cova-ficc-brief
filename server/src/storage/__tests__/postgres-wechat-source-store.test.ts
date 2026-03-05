import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { newDb } from "pg-mem";
import type { Client } from "pg";
import {
  PostgresWechatSourceStore,
  initWechatSourceSchema
} from "../postgresWechatSourceStore";

describe("PostgresWechatSourceStore", () => {
  let client: Client;
  let store: PostgresWechatSourceStore;

  beforeAll(async () => {
    const db = newDb();
    const pgAdapter = db.adapters.createPg();
    const TestClient = pgAdapter.Client;
    client = new TestClient();
    await client.connect();
    await initWechatSourceSchema(client);
    store = new PostgresWechatSourceStore(client);
  });

  afterAll(async () => {
    await client.end();
  });

  it("inserts a new source on first biz", async () => {
    const out = await store.upsertByBiz({
      biz: "MzA3OTYwNDk5Mw==",
      displayName: "WeChat-A",
      articleUrl: "https://mp.weixin.qq.com/s?__biz=MzA3OTYwNDk5Mw==&mid=1&idx=1&sn=abc"
    });

    expect(out.created).toBe(true);
    expect(out.source.channelId).toBe("wechat_mza3otywndk5mw==");
    expect(out.source.expertId).toBe("cova-ficc-brief");
  });

  it("updates existing source when same biz inserted again", async () => {
    const first = await store.upsertByBiz({
      biz: "MzB4OTYwNDk5Mw==",
      displayName: "WeChat-B",
      articleUrl: "https://mp.weixin.qq.com/s?__biz=MzB4OTYwNDk5Mw==&mid=1&idx=1&sn=def"
    });
    const second = await store.upsertByBiz({
      biz: "MzB4OTYwNDk5Mw==",
      displayName: "WeChat-B2",
      articleUrl: "https://mp.weixin.qq.com/s?__biz=MzB4OTYwNDk5Mw==&mid=2&idx=1&sn=xyz"
    });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.source.id).toBe(first.source.id);
    expect(second.source.lastArticleUrl).toContain("mid=2");
  });

  it("lists sources ordered by updated_at desc", async () => {
    const list = await store.listSources();
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list[0].biz).toBe("MzB4OTYwNDk5Mw==");
  });
});
