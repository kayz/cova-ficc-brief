import { describe, expect, it, vi } from "vitest";
import { createContentStoreFromEnv } from "../contentStoreFactory";
import { InMemoryContentStore } from "../inMemoryContentStore";
import { PostgresContentStore } from "../postgresContentStore";

describe("createContentStoreFromEnv", () => {
  it("returns in-memory store when DATABASE_URL is missing", async () => {
    const out = await createContentStoreFromEnv({ env: {} });
    expect(out.mode).toBe("memory");
    expect(out.store).toBeInstanceOf(InMemoryContentStore);
  });

  it("returns postgres store when DATABASE_URL is present", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const out = await createContentStoreFromEnv({
      env: { DATABASE_URL: "postgres://user:pass@localhost:5432/test" },
      db: { query } as any
    });

    expect(out.mode).toBe("postgres");
    expect(out.store).toBeInstanceOf(PostgresContentStore);
    expect(query).toHaveBeenCalled();
  });
});
