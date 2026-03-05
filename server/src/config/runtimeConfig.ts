type EnvLike = {
  [key: string]: string | undefined;
  PORT?: string;
  DATABASE_URL?: string;
  COVA_BASE_URL?: string;
  WEWE_RSS_BASE_URL?: string;
  WEWE_RSS_FEED_FORMAT?: string;
  WEWE_SYNC_INTERVAL_MINUTES?: string;
  WECHAT_SOURCE_SYNC_INTERVAL_MINUTES?: string;
};

const isHttpUrl = (raw: string) => {
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const validateNonNegativeNumber = (value: string, errorCode: string) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(errorCode);
  }
};

export const validateRuntimeEnv = (env: EnvLike = process.env) => {
  const databaseUrl = (env.DATABASE_URL || "").trim();
  if (databaseUrl && !/^postgres(ql)?:\/\//i.test(databaseUrl)) {
    throw new Error("invalid_DATABASE_URL");
  }

  const covaBaseUrl = (env.COVA_BASE_URL || "").trim();
  if (covaBaseUrl && !isHttpUrl(covaBaseUrl)) {
    throw new Error("invalid_COVA_BASE_URL");
  }

  const weweBaseUrl = (env.WEWE_RSS_BASE_URL || "").trim();
  if (weweBaseUrl && !isHttpUrl(weweBaseUrl)) {
    throw new Error("invalid_WEWE_RSS_BASE_URL");
  }

  const weweFeedFormat = (env.WEWE_RSS_FEED_FORMAT || "").trim().toLowerCase();
  if (weweFeedFormat && !new Set(["rss", "atom", "json"]).has(weweFeedFormat)) {
    throw new Error("invalid_WEWE_RSS_FEED_FORMAT");
  }

  const weweSyncInterval = (env.WEWE_SYNC_INTERVAL_MINUTES || "").trim();
  if (weweSyncInterval) {
    validateNonNegativeNumber(weweSyncInterval, "invalid_WEWE_SYNC_INTERVAL_MINUTES");
  }

  const wechatSourceSyncInterval = (env.WECHAT_SOURCE_SYNC_INTERVAL_MINUTES || "").trim();
  if (wechatSourceSyncInterval) {
    validateNonNegativeNumber(wechatSourceSyncInterval, "invalid_WECHAT_SOURCE_SYNC_INTERVAL_MINUTES");
  }

  const port = (env.PORT || "").trim();
  if (port) {
    const n = Number(port);
    if (!Number.isInteger(n) || n <= 0 || n > 65535) {
      throw new Error("invalid_PORT");
    }
  }
};
