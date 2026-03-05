import express from "express";
import cors from "cors";
import Parser from "rss-parser";
import { DailyBrief } from "./brief/dailyBrief";
import { DailyBriefGenerator, LocalDailyBriefGenerator } from "./brief/dailyBriefGenerator";
import { getChinaDateKey, shouldRunDailyBriefAt } from "./brief/scheduler";
import { Article, ContentStore } from "./storage/contentStore";
import { InMemoryContentStore } from "./storage/inMemoryContentStore";
import { InMemoryWechatSourceStore } from "./storage/inMemoryWechatSourceStore";
import { WechatSourceStore } from "./storage/wechatSourceStore";
import { ArticleSummarizer, LocalArticleSummarizer } from "./summary/articleSummarizer";
import { WechatCollector, WechatHtmlCollector } from "./wechat/collector";

type Overview = { id: string; title: string; content: string; createdAt: string };
type FeedInput = { institutionId?: string; institutionName: string; feedUrl: string; iconUrl?: string };
type RefreshResult = { institutionsCount: number; articlesCount: number; added: number };
type ReadinessProbeResult = { ready: boolean; reason?: string };
type AppOptions = {
  sourceStore?: WechatSourceStore;
  contentStore?: ContentStore;
  wechatCollector?: WechatCollector;
  articleSummarizer?: ArticleSummarizer;
  readinessProbe?: () => Promise<ReadinessProbeResult> | ReadinessProbeResult;
  dailyBriefGenerator?: DailyBriefGenerator;
  dailyBriefSchedulerEnabled?: boolean;
  weweBaseUrl?: string;
  weweFeedIds?: string[];
  weweFeedFormat?: "rss" | "atom" | "json";
  weweSyncIntervalMinutes?: number;
  weweSyncOnStartup?: boolean;
  wechatSourceSyncIntervalMinutes?: number;
  wechatSourceSyncOnStartup?: boolean;
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
const escapeXml = (value: string) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");
const toCdata = (value: string) => `<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
const toRssDate = (value: string) => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return new Date().toUTCString();
  return date.toUTCString();
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
  const wechatSourceSyncIntervalMinutes = Number(
    opts.wechatSourceSyncIntervalMinutes ?? process.env.WECHAT_SOURCE_SYNC_INTERVAL_MINUTES ?? "0"
  );
  const wechatSourceSyncOnStartup = opts.wechatSourceSyncOnStartup
    ?? parseBoolean(process.env.WECHAT_SOURCE_SYNC_ON_STARTUP, false);
  const weweConfigured = Boolean(weweBaseUrl && weweFeedIds.length > 0);
  const dailyBriefSchedulerEnabled = opts.dailyBriefSchedulerEnabled ?? parseBoolean(process.env.DAILY_BRIEF_ENABLE_SCHEDULER, false);

  return {
    dailyBriefSchedulerEnabled,
    weweBaseUrl,
    weweFeedIds,
    weweFeedFormat,
    weweSyncIntervalMinutes,
    weweSyncOnStartup,
    wechatSourceSyncIntervalMinutes,
    wechatSourceSyncOnStartup,
    weweConfigured
  };
};

export const createApp = (opts: AppOptions = {}) => {
  const options = loadOptions(opts);
  const app = express();
  app.use(cors());
  app.use(express.json());

  const sourceStore = opts.sourceStore || new InMemoryWechatSourceStore();
  const contentStore = opts.contentStore || new InMemoryContentStore();
  const wechatCollector = opts.wechatCollector || new WechatHtmlCollector();
  const articleSummarizer = opts.articleSummarizer || new LocalArticleSummarizer();
  const fallbackArticleSummarizer = new LocalArticleSummarizer();
  const readinessProbe = opts.readinessProbe || (async () => ({ ready: true }));
  const dailyBriefGenerator = opts.dailyBriefGenerator || new LocalDailyBriefGenerator();
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

  const importArticle = async (input: {
    institutionName: string;
    title: string;
    summary?: string;
    content?: string;
    link: string;
    pubDate?: string;
  }) => {
    const institutionName = input.institutionName.trim();
    const title = input.title.trim();
    const link = input.link.trim();
    const pubDate = (input.pubDate || "").trim() || new Date().toISOString();

    if (!institutionName || !title || !link) {
      return null;
    }

    const dup = await contentStore.findDuplicateArticle({
      institutionName,
      title,
      pubDate
    });
    if (dup) {
      return {
        created: false,
        institution: dup.institution,
        article: dup.article
      };
    }

    let summary = (input.summary || "").trim();
    if (!summary) {
      summary = (await articleSummarizer.summarize({
        institutionName,
        title,
        content: input.content,
        link,
        pubDate
      })).trim();
    }
    if (!summary) {
      summary = await fallbackArticleSummarizer.summarize({
        institutionName,
        title,
        content: input.content,
        link,
        pubDate
      });
    }

    return contentStore.importArticle({
      institutionName,
      title,
      summary: summary.trim(),
      content: input.content,
      pubDate,
      link
    });
  };

  const refreshFromFeeds = async (feeds: FeedInput[]): Promise<RefreshResult> => {
    const parser = new Parser();
    const addedArticles: Article[] = [];

    for (const f of feeds) {
      try {
        const feed = await parser.parseURL(f.feedUrl);
        for (const item of feed.items.slice(0, 50)) {
          const title = String(item.title || "");
          const link = String(item.link || "");
          const pubDate = String(item.pubDate || item.isoDate || new Date().toISOString());
          const contentSnippet = String(item.contentSnippet || "");
          const content = typeof item.content === "string" ? item.content : undefined;

          const out = await contentStore.importArticle({
            institutionName: f.institutionName,
            title,
            summary: contentSnippet.slice(0, 280),
            content,
            pubDate,
            link
          });

          if (out.created) {
            addedArticles.push(out.article);
          }
        }
      } catch {
      }
    }

    if (addedArticles.length === 0) {
      const institutions = await contentStore.listInstitutions();
      const institutionByName = new Map(institutions.map(inst => [inst.name, inst]));

      for (const f of feeds) {
        const inst = institutionByName.get(f.institutionName);
        if (!inst) continue;

        const exist = await contentStore.listArticlesByInstitutionId(inst.id);
        if (exist.length === 0) {
          const now = new Date();
          const a1 = await contentStore.importArticle({
            institutionName: inst.name,
            title: `${inst.name} 固收周报`,
            summary: "示例摘要，供开发验证使用",
            pubDate: now.toISOString(),
            link: "#"
          });
          const a2 = await contentStore.importArticle({
            institutionName: inst.name,
            title: `${inst.name} 市场快评`,
            summary: "示例摘要，供开发验证使用",
            pubDate: new Date(now.getTime() - 3600_000).toISOString(),
            link: "#"
          });
          if (a1.created) addedArticles.push(a1.article);
          if (a2.created) addedArticles.push(a2.article);
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

    const institutions = await contentStore.listInstitutions();
    const articles = await contentStore.listArticles();
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

  const buildRssFeed = (
    req: express.Request,
    feedTitle: string,
    feedDescription: string,
    mapDescription: (article: Article) => string,
    sourceArticles: Article[]
  ) => {
    const base = `${req.protocol}://${req.get("host") || "localhost"}`;
    const sorted = [...sourceArticles].sort((a, b) => b.pubDate.localeCompare(a.pubDate));
    const itemsXml = sorted.map(article => {
      const title = escapeXml(article.title);
      const link = escapeXml(article.link || `${base}/api/articles/${article.id}`);
      const guid = escapeXml(article.id);
      const pubDate = escapeXml(toRssDate(article.pubDate));
      const description = toCdata(mapDescription(article));
      return `<item><title>${title}</title><link>${link}</link><guid isPermaLink="false">${guid}</guid><pubDate>${pubDate}</pubDate><description>${description}</description></item>`;
    }).join("");

    return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(feedTitle)}</title><link>${escapeXml(base)}</link><description>${escapeXml(feedDescription)}</description>${itemsXml}</channel></rss>`;
  };

  const runWechatSourceSync = async () => {
    const sources = await sourceStore.listSources();
    let collectedArticles = 0;
    let importedArticles = 0;
    let failedSources = 0;
    const failures: Array<{ sourceId: string; biz: string; message: string }> = [];

    for (const source of sources) {
      try {
        const collected = await wechatCollector.collectBySource(source);
        collectedArticles += collected.length;

        for (const item of collected) {
          const result = await importArticle({
            institutionName: source.displayName,
            title: item.title,
            summary: item.summary,
            content: item.content,
            link: item.link,
            pubDate: item.pubDate
          });
          if (result?.created) {
            importedArticles += 1;
          }
        }
      } catch (err) {
        failedSources += 1;
        failures.push({
          sourceId: source.id,
          biz: source.biz,
          message: err instanceof Error ? err.message : "unknown_error"
        });
      }
    }

    return {
      sources: sources.length,
      collectedArticles,
      importedArticles,
      failedSources,
      failures
    };
  };

  app.get("/healthz", (req, res) => {
    return res.json({
      status: "ok",
      service: "cova-ficc-brief",
      time: new Date().toISOString()
    });
  });

  app.get("/readyz", async (req, res) => {
    try {
      const probe = await readinessProbe();
      if (probe.ready) {
        return res.json({
          status: "ready",
          service: "cova-ficc-brief",
          time: new Date().toISOString()
        });
      }
      return res.status(503).json({
        status: "not_ready",
        reason: probe.reason || "unknown_reason",
        service: "cova-ficc-brief",
        time: new Date().toISOString()
      });
    } catch (err) {
      return res.status(503).json({
        status: "not_ready",
        reason: err instanceof Error ? err.message : "probe_error",
        service: "cova-ficc-brief",
        time: new Date().toISOString()
      });
    }
  });

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

  app.post("/api/sources/wechat/sync", async (req, res) => {
    const result = await runWechatSourceSync();
    return res.json(result);
  });

  app.get("/api/institutions", async (req, res) => {
    const institutions = await contentStore.listInstitutions();
    res.json(institutions);
  });

  app.post("/api/subscribers", async (req, res) => {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!name) {
      return res.status(400).json({ error: "invalid_subscriber_payload" });
    }
    const subscriber = await contentStore.createSubscriber(name);
    return res.status(201).json(subscriber);
  });

  app.get("/api/subscribers", async (req, res) => {
    const subscribers = await contentStore.listSubscribers();
    return res.json(subscribers);
  });

  app.post("/api/subscriptions", async (req, res) => {
    const subscriberId = typeof req.body?.subscriberId === "string" ? req.body.subscriberId.trim() : "";
    const institutionName = typeof req.body?.institutionName === "string" ? req.body.institutionName.trim() : "";
    if (!subscriberId || !institutionName) {
      return res.status(400).json({ error: "invalid_subscription_payload" });
    }

    const subscriber = await contentStore.getSubscriberById(subscriberId);
    if (!subscriber) {
      return res.status(404).json({ error: "subscriber_not_found" });
    }

    const result = await contentStore.upsertSubscription({
      subscriberId,
      institutionName
    });

    return res.status(result.created ? 201 : 200).json(result);
  });

  app.get("/api/subscribers/:id/subscriptions", async (req, res) => {
    const subscriber = await contentStore.getSubscriberById(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ error: "subscriber_not_found" });
    }
    const subscriptions = await contentStore.listSubscriptionsBySubscriberId(subscriber.id);
    return res.json(subscriptions);
  });

  app.get("/api/institutions/:id/articles", async (req, res) => {
    const id = req.params.id;
    const articles = await contentStore.listArticlesByInstitutionId(id);
    res.json(articles);
  });

  app.get("/api/articles/:id", async (req, res) => {
    const article = await contentStore.getArticleById(req.params.id);
    if (!article) return res.status(404).json({ error: "not_found" });
    res.json(article);
  });

  app.get("/feeds/raw.rss", async (req, res) => {
    const articles = await contentStore.listArticles();
    const feed = buildRssFeed(
      req,
      "COVA FICC Brief - Raw Feed",
      "Raw articles collected by cova-ficc-brief.",
      article => article.content || article.summary,
      articles
    );
    return res.type("application/rss+xml").send(feed);
  });

  app.get("/feeds/summary.rss", async (req, res) => {
    const articles = await contentStore.listArticles();
    const feed = buildRssFeed(
      req,
      "COVA FICC Brief - Summary Feed",
      "Article summaries generated by cova-ficc-brief.",
      article => article.summary,
      articles
    );
    return res.type("application/rss+xml").send(feed);
  });

  app.get("/feeds/subscribers/:id/raw.rss", async (req, res) => {
    const subscriber = await contentStore.getSubscriberById(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ error: "subscriber_not_found" });
    }

    const [subscriptions, allArticles, institutions] = await Promise.all([
      contentStore.listSubscriptionsBySubscriberId(subscriber.id),
      contentStore.listArticles(),
      contentStore.listInstitutions()
    ]);
    const subscribedInstitutions = new Set(subscriptions.map(x => x.institutionName.toLowerCase()));
    const institutionNameById = new Map(institutions.map(x => [x.id, x.name.toLowerCase()]));
    const scopedArticles = allArticles.filter(article => {
      const institutionName = institutionNameById.get(article.institutionId) || "";
      return subscribedInstitutions.has(institutionName);
    });

    const feed = buildRssFeed(
      req,
      `COVA FICC Brief - ${subscriber.name} Raw Feed`,
      "Subscriber scoped raw feed.",
      article => article.content || article.summary,
      scopedArticles
    );
    return res.type("application/rss+xml").send(feed);
  });

  app.get("/feeds/subscribers/:id/summary.rss", async (req, res) => {
    const subscriber = await contentStore.getSubscriberById(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ error: "subscriber_not_found" });
    }

    const [subscriptions, allArticles, institutions] = await Promise.all([
      contentStore.listSubscriptionsBySubscriberId(subscriber.id),
      contentStore.listArticles(),
      contentStore.listInstitutions()
    ]);
    const subscribedInstitutions = new Set(subscriptions.map(x => x.institutionName.toLowerCase()));
    const institutionNameById = new Map(institutions.map(x => [x.id, x.name.toLowerCase()]));
    const scopedArticles = allArticles.filter(article => {
      const institutionName = institutionNameById.get(article.institutionId) || "";
      return subscribedInstitutions.has(institutionName);
    });

    const feed = buildRssFeed(
      req,
      `COVA FICC Brief - ${subscriber.name} Summary Feed`,
      "Subscriber scoped summary feed.",
      article => article.summary,
      scopedArticles
    );
    return res.type("application/rss+xml").send(feed);
  });

  app.post("/api/articles/import", async (req, res) => {
    const institutionName = typeof req.body?.institutionName === "string" ? req.body.institutionName.trim() : "";
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const summary = typeof req.body?.summary === "string" ? req.body.summary.trim() : "";
    const content = typeof req.body?.content === "string" ? req.body.content : undefined;
    const link = typeof req.body?.link === "string" ? req.body.link.trim() : "";
    const pubDateRaw = typeof req.body?.pubDate === "string" ? req.body.pubDate.trim() : "";
    const pubDate = pubDateRaw || new Date().toISOString();

    const result = await importArticle({
      institutionName,
      title,
      summary,
      content,
      link,
      pubDate
    });

    if (!result) {
      return res.status(400).json({ error: "invalid_article_payload" });
    }

    return res.status(result.created ? 201 : 200).json(result);
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

    const articles = await contentStore.listArticles();
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
    if (typeof (timer as any).unref === "function") {
      (timer as any).unref();
    }
  }

  if (options.weweConfigured && options.weweSyncOnStartup) {
    void runWeweSync(false).catch(() => {
    });
  }

  if (
    Number.isFinite(options.wechatSourceSyncIntervalMinutes) &&
    options.wechatSourceSyncIntervalMinutes > 0
  ) {
    const ms = Math.floor(options.wechatSourceSyncIntervalMinutes * 60_000);
    const timer = setInterval(() => {
      void runWechatSourceSync().catch(() => {
      });
    }, ms);
    if (typeof (timer as any).unref === "function") {
      (timer as any).unref();
    }
  }

  if (options.wechatSourceSyncOnStartup) {
    void runWechatSourceSync().catch(() => {
    });
  }

  if (options.dailyBriefSchedulerEnabled) {
    const timer = setInterval(() => {
      const now = new Date();
      if (shouldRunDailyBriefAt(now, dailyBriefLastRunDateKey)) {
        void (async () => {
          const articles = await contentStore.listArticles();
          const brief = await dailyBriefGenerator.generateDailyBrief(articles, now);
          dailyBriefLatest = brief;
          dailyBriefLastRunDateKey = getChinaDateKey(now);
        })().catch(() => {
        });
      }
    }, 60_000);
    if (typeof (timer as any).unref === "function") {
      (timer as any).unref();
    }
  }

  return app;
};
