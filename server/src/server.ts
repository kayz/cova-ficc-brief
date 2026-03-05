import { createApp } from "./app";
import { createDailyBriefGeneratorFromEnv } from "./brief/dailyBriefGeneratorFactory";
import { createSourceStoreFromEnv } from "./storage/sourceStoreFactory";
import { createArticleSummarizerFromEnv } from "./summary/articleSummarizerFactory";
import { validateRuntimeEnv } from "./config/runtimeConfig";
import { attachGracefulShutdown } from "./lifecycle/gracefulShutdown";

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const start = async () => {
  validateRuntimeEnv(process.env);

  const sourceStore = await createSourceStoreFromEnv();
  const dailyBriefGenerator = createDailyBriefGeneratorFromEnv();
  const articleSummarizer = createArticleSummarizerFromEnv();
  const app = createApp({
    sourceStore: sourceStore.store,
    dailyBriefGenerator,
    articleSummarizer,
    readinessProbe: sourceStore.readinessProbe
  });

  const server = app.listen(port, () => {
    console.log("server started", port, {
      sourceStoreMode: sourceStore.mode
    });
  });

  attachGracefulShutdown({
    closeServer: cb => server.close(cb),
    closeStore: sourceStore.close
  });
};

void start();
