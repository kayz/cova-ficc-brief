import { Pool } from "pg";
import { ContentStore } from "./contentStore";
import { InMemoryContentStore } from "./inMemoryContentStore";
import { PostgresContentStore, initContentSchema } from "./postgresContentStore";

type Queryable = { query: (sql: string, params?: unknown[]) => Promise<unknown> };

type EnvLike = {
  DATABASE_URL?: string;
};

export type ContentStoreFactoryResult = {
  mode: "memory" | "postgres";
  store: ContentStore;
  readinessProbe: () => Promise<{ ready: boolean; reason?: string }>;
  close?: () => Promise<void>;
};

type ContentStoreFactoryInput = {
  env?: EnvLike;
  db?: Queryable;
};

export const createContentStoreFromEnv = async (
  input: ContentStoreFactoryInput = {}
): Promise<ContentStoreFactoryResult> => {
  const env = input.env || process.env;
  const databaseUrl = (env.DATABASE_URL || "").trim();
  if (!databaseUrl) {
    return {
      mode: "memory",
      store: new InMemoryContentStore(),
      readinessProbe: async () => ({ ready: true })
    };
  }

  const db = input.db ?? new Pool({ connectionString: databaseUrl });
  await initContentSchema(db as never);

  if (input.db) {
    return {
      mode: "postgres",
      store: new PostgresContentStore(db as never),
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
    store: new PostgresContentStore(pool),
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
