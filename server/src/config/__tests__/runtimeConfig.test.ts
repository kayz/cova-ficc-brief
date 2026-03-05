import { describe, expect, it } from "vitest";
import { validateRuntimeEnv } from "../runtimeConfig";

describe("validateRuntimeEnv", () => {
  it("accepts empty env", () => {
    expect(() => validateRuntimeEnv({} as any)).not.toThrow();
  });

  it("throws on invalid DATABASE_URL", () => {
    expect(() => validateRuntimeEnv({ DATABASE_URL: "mysql://localhost/db" } as any))
      .toThrow("invalid_DATABASE_URL");
  });

  it("throws on invalid WEWE_RSS_FEED_FORMAT", () => {
    expect(() => validateRuntimeEnv({ WEWE_RSS_FEED_FORMAT: "xml" } as any))
      .toThrow("invalid_WEWE_RSS_FEED_FORMAT");
  });

  it("throws on non-positive sync interval", () => {
    expect(() => validateRuntimeEnv({ WECHAT_SOURCE_SYNC_INTERVAL_MINUTES: "-1" } as any))
      .toThrow("invalid_WECHAT_SOURCE_SYNC_INTERVAL_MINUTES");
  });

  it("throws on invalid COVA_BASE_URL", () => {
    expect(() => validateRuntimeEnv({ COVA_BASE_URL: "ftp://cova.example.com" } as any))
      .toThrow("invalid_COVA_BASE_URL");
  });
});
