import { DailyBrief, createDailyBrief } from "./dailyBrief";

type ArticleLike = {
  title: string;
  pubDate: string;
};

export interface DailyBriefGenerator {
  generateDailyBrief(articles: ArticleLike[], runAt: Date): Promise<DailyBrief>;
}

export class LocalDailyBriefGenerator implements DailyBriefGenerator {
  async generateDailyBrief(articles: ArticleLike[], runAt: Date): Promise<DailyBrief> {
    return createDailyBrief(articles, runAt);
  }
}
