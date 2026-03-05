import { ArticleSummarizer, LocalArticleSummarizer } from "./articleSummarizer";
import { CovaHttpArticleSummarizer } from "./covaHttpArticleSummarizer";

type EnvLike = {
  [key: string]: string | undefined;
  COVA_BASE_URL?: string;
  COVA_EXPERT_ID?: string;
  COVA_AUTH_BEARER?: string;
};

const normalizeBase = (s: string) => s.trim().replace(/\/+$/, "");

export const createArticleSummarizerFromEnv = (
  env: EnvLike = process.env
): ArticleSummarizer => {
  const covaBaseUrl = normalizeBase(env.COVA_BASE_URL || "");
  if (!covaBaseUrl) {
    return new LocalArticleSummarizer();
  }

  const expertId = (env.COVA_EXPERT_ID || "cova-ficc-brief").trim();
  const authBearer = (env.COVA_AUTH_BEARER || "").trim();
  const http = {
    post: async (path: string, body: unknown) => {
      const res = await fetch(`${covaBaseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authBearer ? { Authorization: `Bearer ${authBearer}` } : {})
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(`cova_http_error_${res.status}`);
      }
      return { data };
    }
  };

  return new CovaHttpArticleSummarizer(http, expertId);
};
