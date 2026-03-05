import { DailyBrief } from "./dailyBrief";
import { DailyBriefGenerator } from "./dailyBriefGenerator";

type ArticleLike = {
  title: string;
  pubDate: string;
};

type HttpClient = {
  post: (path: string, body: unknown) => Promise<{ data: any }>;
};

export class CovaHttpDailyBriefGenerator implements DailyBriefGenerator {
  constructor(
    private readonly http: HttpClient,
    private readonly expertId: string
  ) {}

  async generateDailyBrief(articles: ArticleLike[], runAt: Date): Promise<DailyBrief> {
    const response = await this.http.post("/v1/assistant/query", {
      expert_id: this.expertId,
      question: "Generate daily FICC brief based on input articles.",
      context: {
        run_at: runAt.toISOString(),
        articles
      }
    });

    const result = response?.data?.result || {};
    const title = typeof result.title === "string" && result.title ? result.title : `${runAt.toISOString().slice(0, 10)} FICC 市场简报`;
    const answer = typeof result.answer === "string" ? result.answer : "";
    const generatedAt = typeof result.generated_at === "string" ? result.generated_at : new Date().toISOString();

    return {
      id: `cova_${Math.random().toString(36).slice(2)}`,
      title,
      content: answer || "COVA returned empty brief content.",
      articleCount: articles.length,
      fromAt: new Date(runAt.getTime() - 24 * 3600_000).toISOString(),
      toAt: runAt.toISOString(),
      createdAt: generatedAt
    };
  }
}

