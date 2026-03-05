import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../app";

describe("wechat source sync API", () => {
  it("syncs all registered wechat sources and imports articles", async () => {
    const collector = {
      collectBySource: vi.fn(async (source: { displayName: string; biz: string }) => {
        return [
          {
            title: `${source.displayName} 早报`,
            summary: "summary",
            content: "<p>content</p>",
            link: `https://mp.weixin.qq.com/s?__biz=${source.biz}&mid=100&idx=1&sn=abc`,
            pubDate: "2026-03-07T03:20:00+08:00"
          }
        ];
      })
    };
    const app = createApp({ wechatCollector: collector as any });

    await request(app).post("/api/sources/wechat/link").send({
      articleUrl: "https://mp.weixin.qq.com/s?__biz=MzA3OTYwNDk5Mw==&mid=1&idx=1&sn=abc",
      displayName: "Macro Desk"
    });
    await request(app).post("/api/sources/wechat/link").send({
      articleUrl: "https://mp.weixin.qq.com/s?__biz=MzB4OTYwNDk5Mw==&mid=1&idx=1&sn=def",
      displayName: "Rates Desk"
    });

    const sync = await request(app).post("/api/sources/wechat/sync").send({});
    expect(sync.status).toBe(200);
    expect(sync.body.sources).toBe(2);
    expect(sync.body.collectedArticles).toBe(2);
    expect(collector.collectBySource).toHaveBeenCalledTimes(2);

    const inst = await request(app).get("/api/institutions");
    expect(inst.status).toBe(200);
    expect(inst.body.length).toBe(2);
  });

  it("deduplicates imported articles when syncing twice", async () => {
    const collector = {
      collectBySource: vi.fn(async (source: { biz: string }) => {
        return [
          {
            title: "Fixed Income Note",
            summary: "summary",
            link: `https://mp.weixin.qq.com/s?__biz=${source.biz}&mid=200&idx=1&sn=xyz`,
            pubDate: "2026-03-07T03:30:00+08:00"
          }
        ];
      })
    };
    const app = createApp({ wechatCollector: collector as any });

    await request(app).post("/api/sources/wechat/link").send({
      articleUrl: "https://mp.weixin.qq.com/s?__biz=MzA3OTYwNDk5Mw==&mid=1&idx=1&sn=abc",
      displayName: "Macro Desk"
    });

    const first = await request(app).post("/api/sources/wechat/sync").send({});
    const second = await request(app).post("/api/sources/wechat/sync").send({});
    expect(first.body.importedArticles).toBe(1);
    expect(second.body.importedArticles).toBe(0);
  });
});
