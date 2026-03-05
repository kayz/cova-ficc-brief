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

const genId = () => Math.random().toString(36).slice(2);

export class InMemoryContentStore implements ContentStore {
  private readonly institutions: Institution[] = [];
  private readonly articles: Article[] = [];
  private readonly subscribers: Subscriber[] = [];
  private readonly subscriptions: Subscription[] = [];

  async findDuplicateArticle(input: DuplicateArticleLookupInput): Promise<{ institution: Institution; article: Article } | null> {
    const institution = this.institutions.find(x => x.name === input.institutionName);
    if (!institution) return null;
    const article = this.articles.find(a =>
      a.institutionId === institution.id &&
      a.title === input.title &&
      a.pubDate === input.pubDate
    );
    if (!article) return null;
    return { institution, article };
  }

  async importArticle(input: ImportArticleInput): Promise<ImportArticleResult> {
    let institution = this.institutions.find(x => x.name === input.institutionName);
    if (!institution) {
      institution = { id: genId(), name: input.institutionName };
      this.institutions.push(institution);
    }

    const dup = this.articles.find(a =>
      a.institutionId === institution.id &&
      a.title === input.title &&
      a.pubDate === input.pubDate
    );
    if (dup) {
      return {
        created: false,
        institution,
        article: dup
      };
    }

    const article: Article = {
      id: genId(),
      title: input.title,
      summary: input.summary,
      content: input.content,
      pubDate: input.pubDate,
      link: input.link,
      institutionId: institution.id
    };
    this.articles.push(article);
    return {
      created: true,
      institution,
      article
    };
  }

  async listInstitutions(): Promise<Institution[]> {
    return [...this.institutions];
  }

  async listArticles(): Promise<Article[]> {
    return [...this.articles];
  }

  async listArticlesByInstitutionId(institutionId: string): Promise<Article[]> {
    return this.articles
      .filter(a => a.institutionId === institutionId)
      .sort((a, b) => b.pubDate.localeCompare(a.pubDate));
  }

  async getArticleById(id: string): Promise<Article | null> {
    return this.articles.find(x => x.id === id) || null;
  }

  async createSubscriber(name: string): Promise<Subscriber> {
    const subscriber: Subscriber = {
      id: genId(),
      name,
      createdAt: new Date().toISOString()
    };
    this.subscribers.push(subscriber);
    return subscriber;
  }

  async listSubscribers(): Promise<Subscriber[]> {
    return [...this.subscribers];
  }

  async getSubscriberById(id: string): Promise<Subscriber | null> {
    return this.subscribers.find(x => x.id === id) || null;
  }

  async upsertSubscription(input: UpsertSubscriptionInput): Promise<UpsertSubscriptionResult> {
    const keyInstitution = input.institutionName.toLowerCase();
    const existing = this.subscriptions.find(x =>
      x.subscriberId === input.subscriberId &&
      x.institutionName.toLowerCase() === keyInstitution
    );
    if (existing) {
      return {
        created: false,
        subscription: existing
      };
    }

    const subscription: Subscription = {
      id: genId(),
      subscriberId: input.subscriberId,
      institutionName: input.institutionName,
      createdAt: new Date().toISOString()
    };
    this.subscriptions.push(subscription);
    return {
      created: true,
      subscription
    };
  }

  async listSubscriptionsBySubscriberId(subscriberId: string): Promise<Subscription[]> {
    return this.subscriptions.filter(x => x.subscriberId === subscriberId);
  }
}
