type ArticleLike = {
  title: string;
  pubDate: string;
};

export type DailyBrief = {
  id: string;
  title: string;
  content: string;
  articleCount: number;
  fromAt: string;
  toAt: string;
  createdAt: string;
};

const genId = () => Math.random().toString(36).slice(2);

export const createDailyBrief = (
  articles: ArticleLike[],
  runAt: Date = new Date()
): DailyBrief => {
  const toAt = runAt;
  const fromAt = new Date(toAt.getTime() - 24 * 3600_000);
  const inRange = articles
    .filter(a => {
      const t = new Date(a.pubDate).getTime();
      return Number.isFinite(t) && t >= fromAt.getTime() && t <= toAt.getTime();
    })
    .sort((a, b) => b.pubDate.localeCompare(a.pubDate));

  const lines = inRange.slice(0, 20).map((a, idx) => `${idx + 1}. ${a.title}`);
  const content = lines.length > 0
    ? lines.join("\n")
    : "过去24小时没有采集到新文章。";

  return {
    id: genId(),
    title: `${toAt.toISOString().slice(0, 10)} FICC 市场简报`,
    content,
    articleCount: inRange.length,
    fromAt: fromAt.toISOString(),
    toAt: toAt.toISOString(),
    createdAt: new Date().toISOString()
  };
};

