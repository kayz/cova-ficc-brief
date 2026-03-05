import { Pool } from "pg";
import { InMemoryWechatSourceStore } from "./inMemoryWechatSourceStore";
import { PostgresWechatSourceStore, initWechatSourceSchema } from "./postgresWechatSourceStore";
import { WechatSourceStore } from "./wechatSourceStore";

type Queryable = { query: (sql: string, params?: unknown[]) => Promise<unknown> };

type EnvLike = {
  DATABASE_URL?: string;
};

export type SourceStoreFactoryResult = {
  mode: "memory" | "postgres";
  store: WechatSourceStore;
  readinessProbe: () => Promise<{ ready: boolean; reason?: string }>;
  close?: () => Promise<void>;
};

type SourceStoreFactoryInput = {
  env?: EnvLike;
  db?: Queryable;
};

export const createSourceStoreFromEnv = async (
  input: SourceStoreFactoryInput = {}
): Promise<SourceStoreFactoryResult> => {
  const env = input.env || process.env;
  const databaseUrl = (env.DATABASE_URL || "").trim();
  if (!databaseUrl) {
    return {
      mode: "memory",
      store: new InMemoryWechatSourceStore(),
      readinessProbe: async () => ({ ready: true })
    };
  }

  const db = input.db ?? new Pool({ connectionString: databaseUrl });
  await initWechatSourceSchema(db as never);

  if (input.db) {
    return {
      mode: "postgres",
      store: new PostgresWechatSourceStore(db as never),
      readinessProbe: async () => {
        try {
          await db.query("SELECT 1");
          return { ready: true };
        } catch (err) {
          return {
            ready: false,
            reason: err instanceof Error ? err.message : "db_probe_failed"
          };
        }
      }
    };
  }

  const pool = db as Pool;
  return {
    mode: "postgres",
    store: new PostgresWechatSourceStore(pool),
    readinessProbe: async () => {
      try {
        await pool.query("SELECT 1");
        return { ready: true };
      } catch (err) {
        return {
          ready: false,
          reason: err instanceof Error ? err.message : "db_probe_failed"
        };
      }
    },
    close: async () => {
      await pool.end();
    }
  };
};
