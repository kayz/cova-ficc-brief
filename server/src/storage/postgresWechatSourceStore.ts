import type { Client, Pool, QueryResult } from "pg";
import {
  UpsertWechatSourceInput,
  UpsertWechatSourceResult,
  WechatSource,
  WechatSourceStore
} from "./wechatSourceStore";

type Queryable = Pick<Client, "query"> | Pick<Pool, "query">;

type WechatSourceRow = {
  id: string;
  expert_id: string;
  source_type: string;
  biz: string;
  channel_id: string;
  display_name: string;
  last_article_url: string;
  created_at: Date | string;
  updated_at: Date | string;
};

const genId = () => Math.random().toString(36).slice(2);

const rowToModel = (row: WechatSourceRow): WechatSource => ({
  id: row.id,
  expertId: "cova-ficc-brief",
  sourceType: "wechat_article_link",
  biz: row.biz,
  channelId: row.channel_id,
  displayName: row.display_name,
  lastArticleUrl: row.last_article_url,
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString()
});

export const initWechatSourceSchema = async (db: Queryable) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS wechat_sources (
      id TEXT PRIMARY KEY,
      expert_id TEXT NOT NULL,
      source_type TEXT NOT NULL,
      biz TEXT NOT NULL,
      biz_key TEXT NOT NULL UNIQUE,
      channel_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      last_article_url TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
  `);
};

export class PostgresWechatSourceStore implements WechatSourceStore {
  constructor(private readonly db: Queryable) {}

  async upsertByBiz(input: UpsertWechatSourceInput): Promise<UpsertWechatSourceResult> {
    const bizKey = input.biz.toLowerCase();
    const found = await this.db.query(
      "SELECT * FROM wechat_sources WHERE biz_key = $1 LIMIT 1",
      [bizKey]
    ) as QueryResult<WechatSourceRow>;

    if (found.rows.length > 0) {
      const updated = await this.db.query(
        `
          UPDATE wechat_sources
          SET display_name = $2, last_article_url = $3, updated_at = NOW()
          WHERE biz_key = $1
          RETURNING *
        `,
        [bizKey, input.displayName, input.articleUrl]
      ) as QueryResult<WechatSourceRow>;
      return { created: false, source: rowToModel(updated.rows[0]) };
    }

    const inserted = await this.db.query(
      `
        INSERT INTO wechat_sources (
          id, expert_id, source_type, biz, biz_key, channel_id, display_name, last_article_url, created_at, updated_at
        )
        VALUES ($1, 'cova-ficc-brief', 'wechat_article_link', $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `,
      [genId(), input.biz, bizKey, `wechat_${bizKey}`, input.displayName, input.articleUrl]
    ) as QueryResult<WechatSourceRow>;
    return { created: true, source: rowToModel(inserted.rows[0]) };
  }

  async listSources(): Promise<WechatSource[]> {
    const out = await this.db.query(
      "SELECT * FROM wechat_sources ORDER BY updated_at DESC"
    ) as QueryResult<WechatSourceRow>;
    return out.rows.map(rowToModel);
  }
}

