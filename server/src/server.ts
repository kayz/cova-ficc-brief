import { createApp } from "./app";
import { createDailyBriefGeneratorFromEnv } from "./brief/dailyBriefGeneratorFactory";
import { createSourceStoreFromEnv } from "./storage/sourceStoreFactory";
import { createArticleSummarizerFromEnv } from "./summary/articleSummarizerFactory";

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const start = async () => {
  const sourceStore = await createSourceStoreFromEnv();
  const dailyBriefGenerator = createDailyBriefGeneratorFromEnv();
  const articleSummarizer = createArticleSummarizerFromEnv();
  const app = createApp({
    sourceStore: sourceStore.store,
    dailyBriefGenerator,
    articleSummarizer
  });

  const server = app.listen(port, () => {
    console.log("server started", port, {
      sourceStoreMode: sourceStore.mode
    });
  });

  process.on("SIGINT", async () => {
    server.close();
    if (sourceStore.close) await sourceStore.close();
    process.exit(0);
  });
};

void start();
