import { WechatSource } from "../storage/wechatSourceStore";

export type CollectedArticle = {
  title: string;
  summary?: string;
  content?: string;
  link: string;
  pubDate: string;
};

export interface WechatCollector {
  collectBySource(source: WechatSource): Promise<CollectedArticle[]>;
}

const extractMeta = (html: string, name: string) => {
  const re = new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, "i");
  const m = html.match(re);
  return m?.[1]?.trim() || "";
};

const extractTitle = (html: string) => {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return (m?.[1] || "").trim();
};

const extractPublishTime = (html: string) => {
  const m = html.match(/publish_time\s*=\s*["']?(\d{10})["']?/i);
  if (!m) return "";
  const ts = Number(m[1]) * 1000;
  return Number.isFinite(ts) ? new Date(ts).toISOString() : "";
};

export class WechatHtmlCollector implements WechatCollector {
  async collectBySource(source: WechatSource): Promise<CollectedArticle[]> {
    const res = await fetch(source.lastArticleUrl, {
      method: "GET",
      headers: {
        "User-Agent": "cova-ficc-brief/0.1 (+wechat-source)"
      }
    });
    if (!res.ok) return [];
    const html = await res.text();

    const title = extractMeta(html, "og:title") || extractTitle(html) || `${source.displayName} 文章`;
    const summary = extractMeta(html, "og:description") || "";
    const pubDate = extractPublishTime(html) || new Date().toISOString();

    return [{
      title,
      summary,
      content: html,
      link: source.lastArticleUrl,
      pubDate
    }];
  }
}

