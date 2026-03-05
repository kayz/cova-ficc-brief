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
    const ready = await out.readinessProbe();
    expect(ready.ready).toBe(true);
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
    const ready = await out.readinessProbe();
    expect(ready.ready).toBe(true);
  });

  it("returns not-ready when postgres probe fails", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [] }) // schema init
      .mockRejectedValueOnce(new Error("connection_lost")); // probe
    const out = await createSourceStoreFromEnv({
      env: { DATABASE_URL: "postgres://user:pass@localhost:5432/test" },
      db: { query } as any
    });

    const ready = await out.readinessProbe();
    expect(ready.ready).toBe(false);
    expect(ready.reason).toBe("connection_lost");
  });
});
