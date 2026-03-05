import express from "express";
import cors from "cors";
import Parser from "rss-parser";
import { DailyBrief } from "./brief/dailyBrief";
import { DailyBriefGenerator, LocalDailyBriefGenerator } from "./brief/dailyBriefGenerator";
import { getChinaDateKey, shouldRunDailyBriefAt } from "./brief/scheduler";
import { InMemoryWechatSourceStore } from "./storage/inMemoryWechatSourceStore";
import { WechatSourceStore } from "./storage/wechatSourceStore";

type Institution = { id: string; name: string; iconUrl?: string };
type Article = {
  id: string;
  title: string;
  summary: string;
  content?: string;
  pubDate: string;
  link: string;
  institutionId: string;
};
type Overview = { id: string; title: string; content: string; createdAt: string };
type FeedInput = { institutionId?: string; institutionName: string; feedUrl: string; iconUrl?: string };
type RefreshResult = { institutionsCount: number; articlesCount: number; added: number };
type AppOptions = {
  sourceStore?: WechatSourceStore;
  dailyBriefGenerator?: DailyBriefGenerator;
  dailyBriefSchedulerEnabled?: boolean;
  weweBaseUrl?: string;
  weweFeedIds?: string[];
  weweFeedFormat?: "rss" | "atom" | "json";
  weweSyncIntervalMinutes?: number;
  weweSyncOnStartup?: boolean;
};

const defaultManualFeeds: FeedInput[] = [
  { institutionName: "示例机构A", feedUrl: "https://rsshub.app/36kr/newsflashes" },
  { institutionName: "示例机构B", feedUrl: "https://rsshub.app/zhihu/daily" }
];

const genId = () => Math.random().toString(36).slice(2);
const normalizeBaseUrl = (s: string) => s.trim().replace(/\/+$/, "");
const parseBoolean = (value: string | undefined, fallback = false) => {
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
};

const parseWeChatArticleUrl = (raw: string) => {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.hostname !== "mp.weixin.qq.com") return null;
    if (!url.pathname.startsWith("/s")) return null;
    const biz = (url.searchParams.get("__biz") || "").trim();
    if (!biz) return null;
    return {
      biz,
      normalizedUrl: url.toString()
    };
  } catch {
    return null;
  }
};

const appendQueryParam = (url: string, key: string, value: string) => {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
};

const loadOptions = (opts: AppOptions = {}) => {
  const allowedFeedFormats = new Set(["rss", "atom", "json"]);
  const weweBaseUrl = normalizeBaseUrl(opts.weweBaseUrl ?? process.env.WEWE_RSS_BASE_URL ?? "");
  const weweFeedIds = opts.weweFeedIds ?? (process.env.WEWE_RSS_FEED_IDS || "")
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);
  const weweFeedFormatRaw = (opts.weweFeedFormat ?? process.env.WEWE_RSS_FEED_FORMAT ?? "rss").trim().toLowerCase();
  const weweFeedFormat = (allowedFeedFormats.has(weweFeedFormatRaw) ? weweFeedFormatRaw : "rss") as "rss" | "atom" | "json";
  const weweSyncIntervalMinutes = Number(opts.weweSyncIntervalMinutes ?? process.env.WEWE_SYNC_INTERVAL_MINUTES ?? "0");
  const weweSyncOnStartup = opts.weweSyncOnStartup ?? parseBoolean(process.env.WEWE_SYNC_ON_STARTUP, false);
  const weweConfigured = Boolean(weweBaseUrl && weweFeedIds.length > 0);
  const dailyBriefSchedulerEnabled = opts.dailyBriefSchedulerEnabled ?? parseBoolean(process.env.DAILY_BRIEF_ENABLE_SCHEDULER, false);

  return {
    dailyBriefSchedulerEnabled,
    weweBaseUrl,
    weweFeedIds,
    weweFeedFormat,
    weweSyncIntervalMinutes,
    weweSyncOnStartup,
    weweConfigured
  };
};

export const createApp = (opts: AppOptions = {}) => {
  const options = loadOptions(opts);
  const app = express();
  app.use(cors());
  app.use(express.json());

  const sourceStore = opts.sourceStore || new InMemoryWechatSourceStore();
  const dailyBriefGenerator = opts.dailyBriefGenerator || new LocalDailyBriefGenerator();
  const institutions: Institution[] = [];
  const articles: Article[] = [];
  let overviewLatest: Overview | null = null;
  let dailyBriefLatest: DailyBrief | null = null;
  let dailyBriefLastRunDateKey: string | null = null;
  let weweSyncRunning = false;
  let weweLastSyncAt = "";
  let weweLastSyncError = "";
  let weweLastSyncAdded = 0;

  const buildWeweFeeds = (forceUpdate = false): FeedInput[] => {
    if (!options.weweConfigured) return [];
    return options.weweFeedIds.map(feedId => {
      const normalizedFeedId = feedId.toLowerCase();
      const path = normalizedFeedId === "all"
        ? `/feeds/all.${options.weweFeedFormat}`
        : `/feeds/${encodeURIComponent(feedId)}.${options.weweFeedFormat}`;
      const url = `${options.weweBaseUrl}${path}`;
      return {
        institutionName: normalizedFeedId === "all" ? "WeWe-ALL" : `WeWe-${feedId}`,
        feedUrl: forceUpdate ? appendQueryParam(url, "update", "true") : url
      };
    });
  };

  const refreshFromFeeds = async (feeds: FeedInput[]): Promise<RefreshResult> => {
    const parser = new Parser();
    const addedArticles: Article[] = [];

    for (const f of feeds) {
      let inst = institutions.find(x => x.name === f.institutionName);
      if (!inst) {
        inst = { id: f.institutionId || genId(), name: f.institutionName, iconUrl: f.iconUrl };
        institutions.push(inst);
      }
      try {
        const feed = await parser.parseURL(f.feedUrl);
        for (const item of feed.items.slice(0, 50)) {
          const title = String(item.title || "");
          const link = String(item.link || "");
          const pubDate = String(item.pubDate || item.isoDate || new Date().toISOString());
          const contentSnippet = String(item.contentSnippet || "");
          const content = typeof item.content === "string" ? item.content : undefined;
          const key = `${inst.id}|${title}|${pubDate}`;
          if (articles.some(a => `${a.institutionId}|${a.title}|${a.pubDate}` === key)) continue;
          const art: Article = {
            id: genId(),
            title,
            summary: contentSnippet.slice(0, 280),
            content,
            pubDate,
            link,
            institutionId: inst.id
          };
          articles.push(art);
          addedArticles.push(art);
        }
      } catch {
      }
    }

    if (addedArticles.length === 0) {
      for (const f of feeds) {
        const inst = institutions.find(x => x.name === f.institutionName);
        if (!inst) continue;
        const existCount = articles.filter(a => a.institutionId === inst.id).length;
        if (existCount === 0) {
          const now = new Date();
          const a1: Article = {
            id: genId(),
            title: `${inst.name} 固收周报`,
            summary: "示例摘要，供开发验证使用",
            pubDate: now.toISOString(),
            link: "#",
            institutionId: inst.id
          };
          const a2: Article = {
            id: genId(),
            title: `${inst.name} 市场快评`,
            summary: "示例摘要，供开发验证使用",
            pubDate: new Date(now.getTime() - 3600_000).toISOString(),
            link: "#",
            institutionId: inst.id
          };
          articles.push(a1, a2);
          addedArticles.push(a1, a2);
        }
      }
    }

    if (addedArticles.length > 0) {
      const latest = addedArticles.sort((a, b) => b.pubDate.localeCompare(a.pubDate))[0];
      overviewLatest = {
        id: genId(),
        title: "固收市场综述",
        content: `${new Date().toLocaleString()} 收录${addedArticles.length}篇，最新：${latest.title}`,
        createdAt: new Date().toISOString()
      };
    }

    return {
      institutionsCount: institutions.length,
      articlesCount: articles.length,
      added: addedArticles.length
    };
  };

  const runWeweSync = async (forceUpdate = false): Promise<RefreshResult> => {
    if (!options.weweConfigured) {
      throw new Error("wewe_not_configured");
    }
    if (weweSyncRunning) {
      throw new Error("wewe_sync_in_progress");
    }
    weweSyncRunning = true;
    try {
      const result = await refreshFromFeeds(buildWeweFeeds(forceUpdate));
      weweLastSyncAt = new Date().toISOString();
      weweLastSyncAdded = result.added;
      weweLastSyncError = "";
      return result;
    } catch (err) {
      weweLastSyncError = err instanceof Error ? err.message : "unknown_error";
      throw err;
    } finally {
      weweSyncRunning = false;
    }
  };

  app.post("/api/sources/wechat/link", async (req, res) => {
    const articleUrl = typeof req.body?.articleUrl === "string" ? req.body.articleUrl.trim() : "";
    const displayNameInput = typeof req.body?.displayName === "string" ? req.body.displayName.trim() : "";
    const parsed = parseWeChatArticleUrl(articleUrl);
    if (!parsed) {
      return res.status(400).json({ error: "invalid_wechat_article_url" });
    }

    const result = await sourceStore.upsertByBiz({
      biz: parsed.biz,
      displayName: displayNameInput || `WeChat-${parsed.biz}`,
      articleUrl: parsed.normalizedUrl
    });
    return res.status(result.created ? 201 : 200).json(result);
  });

  app.get("/api/sources", async (req, res) => {
    const sources = await sourceStore.listSources();
    res.json(sources);
  });

  app.get("/api/institutions", (req, res) => {
    res.json(institutions);
  });

  app.get("/api/institutions/:id/articles", (req, res) => {
    const id = req.params.id;
    res.json(articles.filter(a => a.institutionId === id).sort((a, b) => b.pubDate.localeCompare(a.pubDate)));
  });

  app.get("/api/articles/:id", (req, res) => {
    const a = articles.find(x => x.id === req.params.id);
    if (!a) return res.status(404).json({ error: "not_found" });
    res.json(a);
  });

  app.get("/api/overview/latest", (req, res) => {
    if (!overviewLatest) return res.status(404).json({ error: "no_overview" });
    res.json(overviewLatest);
  });

  app.post("/api/rss/refresh", async (req, res) => {
    const feeds: FeedInput[] = Array.isArray(req.body?.feeds) ? req.body.feeds : defaultManualFeeds;
    const result = await refreshFromFeeds(feeds);
    res.json(result);
  });

  app.post("/api/briefs/daily/run", async (req, res) => {
    const runAtRaw = typeof req.body?.runAt === "string" ? req.body.runAt.trim() : "";
    const runAt = runAtRaw ? new Date(runAtRaw) : new Date();
    if (!Number.isFinite(runAt.getTime())) {
      return res.status(400).json({ error: "invalid_run_at" });
    }

    dailyBriefLatest = await dailyBriefGenerator.generateDailyBrief(articles, runAt);
    dailyBriefLastRunDateKey = getChinaDateKey(runAt);
    return res.json(dailyBriefLatest);
  });

  app.get("/api/briefs/daily/latest", (req, res) => {
    if (!dailyBriefLatest) return res.status(404).json({ error: "no_daily_brief" });
    return res.json(dailyBriefLatest);
  });

  app.get("/api/wewe/status", (req, res) => {
    res.json({
      configured: options.weweConfigured,
      running: weweSyncRunning,
      baseUrl: options.weweBaseUrl || null,
      feedIds: options.weweFeedIds,
      feedFormat: options.weweFeedFormat,
      syncIntervalMinutes: options.weweSyncIntervalMinutes,
      lastSyncAt: weweLastSyncAt || null,
      lastSyncAdded: weweLastSyncAdded,
      lastSyncError: weweLastSyncError || null
    });
  });

  app.post("/api/wewe/sync", async (req, res) => {
    if (!options.weweConfigured) return res.status(400).json({ error: "wewe_not_configured" });
    const forceUpdate = Boolean(req.body?.forceUpdate);
    try {
      const result = await runWeweSync(forceUpdate);
      res.json({ source: "wewe", forceUpdate, ...result });
    } catch (err) {
      if (err instanceof Error && err.message === "wewe_sync_in_progress") {
        return res.status(409).json({ error: "wewe_sync_in_progress" });
      }
      return res.status(500).json({ error: "wewe_sync_failed" });
    }
  });

  if (options.weweConfigured && Number.isFinite(options.weweSyncIntervalMinutes) && options.weweSyncIntervalMinutes > 0) {
    const ms = Math.floor(options.weweSyncIntervalMinutes * 60_000);
    const timer = setInterval(() => {
      void runWeweSync(false).catch(() => {
      });
    }, ms);
    timer.unref();
  }

  if (options.weweConfigured && options.weweSyncOnStartup) {
    void runWeweSync(false).catch(() => {
    });
  }

  if (options.dailyBriefSchedulerEnabled) {
    const timer = setInterval(() => {
      const now = new Date();
      if (shouldRunDailyBriefAt(now, dailyBriefLastRunDateKey)) {
        void dailyBriefGenerator.generateDailyBrief(articles, now)
          .then(brief => {
            dailyBriefLatest = brief;
            dailyBriefLastRunDateKey = getChinaDateKey(now);
          })
          .catch(() => {
          });
      }
    }, 60_000);
    timer.unref();
  }

  return app;
};
