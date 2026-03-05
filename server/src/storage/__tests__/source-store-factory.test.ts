import { describe, expect, it, vi } from "vitest";
import { createSourceStoreFromEnv } from "../sourceStoreFactory";
import { InMemoryWechatSourceStore } from "../inMemoryWechatSourceStore";
import { PostgresWechatSourceStore } from "../postgresWechatSourceStore";

describe("createSourceStoreFromEnv", () => {
  it("returns in-memory store when DATABASE_URL is missing", async () => {
    const out = await createSourceStoreFromEnv({
      env: {}
    });
    expect(out.mode).toBe("memory");
    expect(out.store).toBeInstanceOf(InMemoryWechatSourceStore);
  });

  it("returns postgres store when DATABASE_URL is present", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const out = await createSourceStoreFromEnv({
      env: { DATABASE_URL: "postgres://user:pass@localhost:5432/test" },
      db: { query } as any
    });

    expect(out.mode).toBe("postgres");
    expect(out.store).toBeInstanceOf(PostgresWechatSourceStore);
    expect(query).toHaveBeenCalled();
  });
});
