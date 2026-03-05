import { DailyBrief, createDailyBrief } from "./dailyBrief";

type ArticleLike = {
  title: string;
  pubDate: string;
};

export interface DailyBriefGenerator {
  generateDailyBrief(articles: ArticleLike[], runAt: Date): DailyBrief;
}

export class LocalDailyBriefGenerator implements DailyBriefGenerator {
  generateDailyBrief(articles: ArticleLike[], runAt: Date): DailyBrief {
    return createDailyBrief(articles, runAt);
  }
}

