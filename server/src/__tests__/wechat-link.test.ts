import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";

describe("wechat article link source API", () => {
  it("creates a source from a valid wechat article link", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/sources/wechat/link")
      .send({
        articleUrl: "https://mp.weixin.qq.com/s?__biz=MzA3OTYwNDk5Mw==&mid=2651234567&idx=1&sn=abc123"
      });

    expect(res.status).toBe(201);
    expect(res.body.created).toBe(true);
    expect(res.body.source.expertId).toBe("cova-ficc-brief");
    expect(res.body.source.channelId).toBe("wechat_mza3otywndk5mw==");
  });

  it("deduplicates source by wechat biz id", async () => {
    const app = createApp();
    const body = {
      articleUrl: "https://mp.weixin.qq.com/s?__biz=MzA3OTYwNDk5Mw==&mid=2651234567&idx=1&sn=abc123"
    };

    const first = await request(app).post("/api/sources/wechat/link").send(body);
    const second = await request(app).post("/api/sources/wechat/link").send(body);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.created).toBe(false);
    expect(second.body.source.id).toBe(first.body.source.id);
  });

  it("rejects unsupported or invalid url", async () => {
    const app = createApp();
    const bad = await request(app)
      .post("/api/sources/wechat/link")
      .send({ articleUrl: "https://example.com/not-wechat" });

    expect(bad.status).toBe(400);
    expect(bad.body.error).toBe("invalid_wechat_article_url");
  });
});
