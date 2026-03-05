import { createApp } from "./app";
import { createDailyBriefGeneratorFromEnv } from "./brief/dailyBriefGeneratorFactory";
import { createContentStoreFromEnv } from "./storage/contentStoreFactory";
import { createSourceStoreFromEnv } from "./storage/sourceStoreFactory";
import { createArticleSummarizerFromEnv } from "./summary/articleSummarizerFactory";
import { validateRuntimeEnv } from "./config/runtimeConfig";
import { attachGracefulShutdown } from "./lifecycle/gracefulShutdown";

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const start = async () => {
  validateRuntimeEnv(process.env);

  const sourceStore = await createSourceStoreFromEnv();
  const contentStore = await createContentStoreFromEnv();
  const dailyBriefGenerator = createDailyBriefGeneratorFromEnv();
  const articleSummarizer = createArticleSummarizerFromEnv();
  const app = createApp({
    sourceStore: sourceStore.store,
    contentStore: contentStore.store,
    dailyBriefGenerator,
    articleSummarizer,
    readinessProbe: async () => {
      const sourceReady = await sourceStore.readinessProbe();
      if (!sourceReady.ready) return sourceReady;
      const contentReady = await contentStore.readinessProbe();
      if (!contentReady.ready) return contentReady;
      return { ready: true };
    }
  });

  const server = app.listen(port, () => {
    console.log("server started", port, {
      sourceStoreMode: sourceStore.mode,
      contentStoreMode: contentStore.mode
    });
  });

  attachGracefulShutdown({
    closeServer: cb => server.close(cb),
    closeStore: async () => {
      if (sourceStore.close) await sourceStore.close();
      if (contentStore.close) await contentStore.close();
    }
  });
};

void start();
