import { ArticleSummarizer } from "./articleSummarizer";

type SummarizeInput = Parameters<ArticleSummarizer["summarize"]>[0];

type HttpClient = {
  post: (path: string, body: unknown) => Promise<{ data: any }>;
};

export class CovaHttpArticleSummarizer implements ArticleSummarizer {
  constructor(
    private readonly http: HttpClient,
    private readonly expertId: string
  ) {}

  async summarize(input: SummarizeInput): Promise<string> {
    const response = await this.http.post("/v1/assistant/query", {
      expert_id: this.expertId,
      question: "Summarize this FICC article into a concise research brief.",
      context: {
        article: input
      }
    });

    const result = response?.data?.result || {};
    const answer = typeof result.answer === "string" ? result.answer.trim() : "";
    return answer;
  }
}
