import { describe, expect, it, vi } from "vitest";
import { createApp } from "../app";

describe("wechat source sync scheduler", () => {
  it("runs sync on startup when enabled", async () => {
    const collector = {
      collectBySource: vi.fn(async () => [
        {
          title: "startup article",
          summary: "summary",
          link: "https://example.com/startup",
          pubDate: "2026-03-07T08:00:00+08:00"
        }
      ])
    };
    const sourceStore = {
      upsertByBiz: vi.fn(),
      listSources: vi.fn(async () => [
        {
          id: "src_1",
          expertId: "cova-ficc-brief",
          sourceType: "wechat_article_link",
          biz: "MzA3OTYwNDk5Mw==",
          channelId: "wechat_mza3",
          displayName: "Macro Desk",
          lastArticleUrl: "https://mp.weixin.qq.com/s?__biz=MzA3OTYwNDk5Mw==&mid=1&idx=1&sn=abc",
          createdAt: "2026-03-07T00:00:00.000Z",
          updatedAt: "2026-03-07T00:00:00.000Z"
        }
      ])
    };

    createApp({
      sourceStore: sourceStore as any,
      wechatCollector: collector as any,
      wechatSourceSyncOnStartup: true
    });

    await vi.waitFor(() => {
      expect(collector.collectBySource).toHaveBeenCalledTimes(1);
    });
  });

  it("runs sync by interval when scheduler is enabled", async () => {
    vi.useFakeTimers();
    const collector = {
      collectBySource: vi.fn(async () => [])
    };
    const sourceStore = {
      upsertByBiz: vi.fn(),
      listSources: vi.fn(async () => [
        {
          id: "src_1",
          expertId: "cova-ficc-brief",
          sourceType: "wechat_article_link",
          biz: "MzA3OTYwNDk5Mw==",
          channelId: "wechat_mza3",
          displayName: "Macro Desk",
          lastArticleUrl: "https://mp.weixin.qq.com/s?__biz=MzA3OTYwNDk5Mw==&mid=1&idx=1&sn=abc",
          createdAt: "2026-03-07T00:00:00.000Z",
          updatedAt: "2026-03-07T00:00:00.000Z"
        }
      ])
    };

    createApp({
      sourceStore: sourceStore as any,
      wechatCollector: collector as any,
      wechatSourceSyncIntervalMinutes: 0.001
    });

    await vi.advanceTimersByTimeAsync(130);
    expect(collector.collectBySource).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
