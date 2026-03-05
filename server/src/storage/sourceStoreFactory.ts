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
      store: new InMemoryWechatSourceStore()
    };
  }

  const db = input.db ?? new Pool({ connectionString: databaseUrl });
  await initWechatSourceSchema(db as never);

  if (input.db) {
    return {
      mode: "postgres",
      store: new PostgresWechatSourceStore(db as never)
    };
  }

  const pool = db as Pool;
  return {
    mode: "postgres",
    store: new PostgresWechatSourceStore(pool),
    close: async () => {
      await pool.end();
    }
  };
};

