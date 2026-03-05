export type WechatSource = {
  id: string;
  expertId: "cova-ficc-brief";
  sourceType: "wechat_article_link";
  biz: string;
  channelId: string;
  displayName: string;
  lastArticleUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type UpsertWechatSourceInput = {
  biz: string;
  displayName: string;
  articleUrl: string;
};

export type UpsertWechatSourceResult = {
  created: boolean;
  source: WechatSource;
};

export interface WechatSourceStore {
  upsertByBiz(input: UpsertWechatSourceInput): Promise<UpsertWechatSourceResult>;
  listSources(): Promise<WechatSource[]>;
}

