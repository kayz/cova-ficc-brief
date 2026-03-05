export type Institution = {
  id: string;
  name: string;
  iconUrl?: string;
};

export type Article = {
  id: string;
  title: string;
  summary: string;
  content?: string;
  pubDate: string;
  link: string;
  institutionId: string;
};

export type Subscriber = {
  id: string;
  name: string;
  createdAt: string;
};

export type Subscription = {
  id: string;
  subscriberId: string;
  institutionName: string;
  createdAt: string;
};

export type ImportArticleInput = {
  institutionName: string;
  title: string;
  summary: string;
  content?: string;
  pubDate: string;
  link: string;
};

export type ImportArticleResult = {
  created: boolean;
  institution: Institution;
  article: Article;
};

export type DuplicateArticleLookupInput = {
  institutionName: string;
  title: string;
  pubDate: string;
};

export type UpsertSubscriptionInput = {
  subscriberId: string;
  institutionName: string;
};

export type UpsertSubscriptionResult = {
  created: boolean;
  subscription: Subscription;
};

export interface ContentStore {
  findDuplicateArticle(input: DuplicateArticleLookupInput): Promise<{ institution: Institution; article: Article } | null>;
  importArticle(input: ImportArticleInput): Promise<ImportArticleResult>;
  listInstitutions(): Promise<Institution[]>;
  listArticles(): Promise<Article[]>;
  listArticlesByInstitutionId(institutionId: string): Promise<Article[]>;
  getArticleById(id: string): Promise<Article | null>;

  createSubscriber(name: string): Promise<Subscriber>;
  listSubscribers(): Promise<Subscriber[]>;
  getSubscriberById(id: string): Promise<Subscriber | null>;
  upsertSubscription(input: UpsertSubscriptionInput): Promise<UpsertSubscriptionResult>;
  listSubscriptionsBySubscriberId(subscriberId: string): Promise<Subscription[]>;
}
