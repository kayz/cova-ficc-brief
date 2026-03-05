import {
  UpsertWechatSourceInput,
  UpsertWechatSourceResult,
  WechatSource,
  WechatSourceStore
} from "./wechatSourceStore";

const genId = () => Math.random().toString(36).slice(2);

export class InMemoryWechatSourceStore implements WechatSourceStore {
  private readonly byBiz = new Map<string, WechatSource>();

  async upsertByBiz(input: UpsertWechatSourceInput): Promise<UpsertWechatSourceResult> {
    const bizKey = input.biz.toLowerCase();
    const now = new Date().toISOString();
    const existing = this.byBiz.get(bizKey);
    if (existing) {
      existing.displayName = input.displayName;
      existing.lastArticleUrl = input.articleUrl;
      existing.updatedAt = now;
      return { created: false, source: existing };
    }

    const source: WechatSource = {
      id: genId(),
      expertId: "cova-ficc-brief",
      sourceType: "wechat_article_link",
      biz: input.biz,
      channelId: `wechat_${bizKey}`,
      displayName: input.displayName,
      lastArticleUrl: input.articleUrl,
      createdAt: now,
      updatedAt: now
    };
    this.byBiz.set(bizKey, source);
    return { created: true, source };
  }

  async listSources(): Promise<WechatSource[]> {
    return Array.from(this.byBiz.values())
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

