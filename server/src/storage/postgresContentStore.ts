import type { Client, Pool, QueryResult } from "pg";
import {
  Article,
  ContentStore,
  DuplicateArticleLookupInput,
  ImportArticleInput,
  ImportArticleResult,
  Institution,
  Subscriber,
  Subscription,
  UpsertSubscriptionInput,
  UpsertSubscriptionResult
} from "./contentStore";

type Queryable = Pick<Client, "query"> | Pick<Pool, "query">;

type InstitutionRow = {
  id: string;
  name: string;
  icon_url: string | null;
};

type ArticleRow = {
  id: string;
  title: string;
  summary: string;
  content: string | null;
  pub_date: string;
  link: string;
  institution_id: string;
};

type SubscriberRow = {
  id: string;
  name: string;
  created_at: Date | string;
};

type SubscriptionRow = {
  id: string;
  subscriber_id: string;
  institution_name: string;
  created_at: Date | string;
};

const genId = () => Math.random().toString(36).slice(2);

const toInstitution = (row: InstitutionRow): Institution => ({
  id: row.id,
  name: row.name,
  iconUrl: row.icon_url || undefined
});

const toArticle = (row: ArticleRow): Article => ({
  id: row.id,
  title: row.title,
  summary: row.summary,
  content: row.content || undefined,
  pubDate: row.pub_date,
  link: row.link,
  institutionId: row.institution_id
});

const toSubscriber = (row: SubscriberRow): Subscriber => ({
  id: row.id,
  name: row.name,
  createdAt: new Date(row.created_at).toISOString()
});

const toSubscription = (row: SubscriptionRow): Subscription => ({
  id: row.id,
  subscriberId: row.subscriber_id,
  institutionName: row.institution_name,
  createdAt: new Date(row.created_at).toISOString()
});

export const initContentSchema = async (db: Queryable) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS institutions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      icon_url TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NULL,
      pub_date TEXT NOT NULL,
      link TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(institution_id, title, pub_date)
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      subscriber_id TEXT NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
      institution_name TEXT NOT NULL,
      institution_key TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(subscriber_id, institution_key)
    );
  `);
};

export class PostgresContentStore implements ContentStore {
  constructor(private readonly db: Queryable) {}

  async findDuplicateArticle(input: DuplicateArticleLookupInput): Promise<{ institution: Institution; article: Article } | null> {
    const foundInstitution = await this.db.query(
      "SELECT id, name, icon_url FROM institutions WHERE name = $1 LIMIT 1",
      [input.institutionName]
    ) as QueryResult<InstitutionRow>;
    if (foundInstitution.rows.length === 0) return null;
    const institution = toInstitution(foundInstitution.rows[0]);

    const foundArticle = await this.db.query(
      `
      SELECT id, title, summary, content, pub_date, link, institution_id
      FROM articles
      WHERE institution_id = $1 AND title = $2 AND pub_date = $3
      LIMIT 1
      `,
      [institution.id, input.title, input.pubDate]
    ) as QueryResult<ArticleRow>;
    if (foundArticle.rows.length === 0) return null;

    return {
      institution,
      article: toArticle(foundArticle.rows[0])
    };
  }

  async importArticle(input: ImportArticleInput): Promise<ImportArticleResult> {
    const foundInstitution = await this.db.query(
      "SELECT id, name, icon_url FROM institutions WHERE name = $1 LIMIT 1",
      [input.institutionName]
    ) as QueryResult<InstitutionRow>;

    let institution: Institution;
    if (foundInstitution.rows.length > 0) {
      institution = toInstitution(foundInstitution.rows[0]);
    } else {
      const insertedInstitution = await this.db.query(
        "INSERT INTO institutions (id, name) VALUES ($1, $2) RETURNING id, name, icon_url",
        [genId(), input.institutionName]
      ) as QueryResult<InstitutionRow>;
      institution = toInstitution(insertedInstitution.rows[0]);
    }

    const foundArticle = await this.db.query(
      `
      SELECT id, title, summary, content, pub_date, link, institution_id
      FROM articles
      WHERE institution_id = $1 AND title = $2 AND pub_date = $3
      LIMIT 1
      `,
      [institution.id, input.title, input.pubDate]
    ) as QueryResult<ArticleRow>;

    if (foundArticle.rows.length > 0) {
      return {
        created: false,
        institution,
        article: toArticle(foundArticle.rows[0])
      };
    }

    const insertedArticle = await this.db.query(
      `
      INSERT INTO articles (id, institution_id, title, summary, content, pub_date, link)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, title, summary, content, pub_date, link, institution_id
      `,
      [genId(), institution.id, input.title, input.summary, input.content || null, input.pubDate, input.link]
    ) as QueryResult<ArticleRow>;

    return {
      created: true,
      institution,
      article: toArticle(insertedArticle.rows[0])
    };
  }

  async listInstitutions(): Promise<Institution[]> {
    const out = await this.db.query(
      "SELECT id, name, icon_url FROM institutions ORDER BY name ASC"
    ) as QueryResult<InstitutionRow>;
    return out.rows.map(toInstitution);
  }

  async listArticles(): Promise<Article[]> {
    const out = await this.db.query(
      "SELECT id, title, summary, content, pub_date, link, institution_id FROM articles ORDER BY pub_date DESC"
    ) as QueryResult<ArticleRow>;
    return out.rows.map(toArticle);
  }

  async listArticlesByInstitutionId(institutionId: string): Promise<Article[]> {
    const out = await this.db.query(
      `
      SELECT id, title, summary, content, pub_date, link, institution_id
      FROM articles
      WHERE institution_id = $1
      ORDER BY pub_date DESC
      `,
      [institutionId]
    ) as QueryResult<ArticleRow>;
    return out.rows.map(toArticle);
  }

  async getArticleById(id: string): Promise<Article | null> {
    const out = await this.db.query(
      `
      SELECT id, title, summary, content, pub_date, link, institution_id
      FROM articles
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    ) as QueryResult<ArticleRow>;
    if (out.rows.length === 0) return null;
    return toArticle(out.rows[0]);
  }

  async createSubscriber(name: string): Promise<Subscriber> {
    const out = await this.db.query(
      "INSERT INTO subscribers (id, name) VALUES ($1, $2) RETURNING id, name, created_at",
      [genId(), name]
    ) as QueryResult<SubscriberRow>;
    return toSubscriber(out.rows[0]);
  }

  async listSubscribers(): Promise<Subscriber[]> {
    const out = await this.db.query(
      "SELECT id, name, created_at FROM subscribers ORDER BY created_at DESC"
    ) as QueryResult<SubscriberRow>;
    return out.rows.map(toSubscriber);
  }

  async getSubscriberById(id: string): Promise<Subscriber | null> {
    const out = await this.db.query(
      "SELECT id, name, created_at FROM subscribers WHERE id = $1 LIMIT 1",
      [id]
    ) as QueryResult<SubscriberRow>;
    if (out.rows.length === 0) return null;
    return toSubscriber(out.rows[0]);
  }

  async upsertSubscription(input: UpsertSubscriptionInput): Promise<UpsertSubscriptionResult> {
    const institutionKey = input.institutionName.toLowerCase();
    const found = await this.db.query(
      `
      SELECT id, subscriber_id, institution_name, created_at
      FROM subscriptions
      WHERE subscriber_id = $1 AND institution_key = $2
      LIMIT 1
      `,
      [input.subscriberId, institutionKey]
    ) as QueryResult<SubscriptionRow>;

    if (found.rows.length > 0) {
      return {
        created: false,
        subscription: toSubscription(found.rows[0])
      };
    }

    const inserted = await this.db.query(
      `
      INSERT INTO subscriptions (id, subscriber_id, institution_name, institution_key)
      VALUES ($1, $2, $3, $4)
      RETURNING id, subscriber_id, institution_name, created_at
      `,
      [genId(), input.subscriberId, input.institutionName, institutionKey]
    ) as QueryResult<SubscriptionRow>;

    return {
      created: true,
      subscription: toSubscription(inserted.rows[0])
    };
  }

  async listSubscriptionsBySubscriberId(subscriberId: string): Promise<Subscription[]> {
    const out = await this.db.query(
      `
      SELECT id, subscriber_id, institution_name, created_at
      FROM subscriptions
      WHERE subscriber_id = $1
      ORDER BY created_at DESC
      `,
      [subscriberId]
    ) as QueryResult<SubscriptionRow>;
    return out.rows.map(toSubscription);
  }
}
