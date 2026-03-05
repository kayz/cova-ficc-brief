type SummarizeInput = {
  institutionName: string;
  title: string;
  content?: string;
  link: string;
  pubDate: string;
};

export interface ArticleSummarizer {
  summarize(input: SummarizeInput): Promise<string>;
}

const stripHtml = (html: string) => html
  .replace(/<[^>]*>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

export class LocalArticleSummarizer implements ArticleSummarizer {
  async summarize(input: SummarizeInput): Promise<string> {
    const plain = stripHtml(input.content || "");
    const source = plain || input.title;
    if (source.length <= 180) return source;
    return `${source.slice(0, 177)}...`;
  }
}
