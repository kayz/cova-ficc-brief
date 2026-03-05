type ProcessLike = {
  on: (event: string, handler: () => void | Promise<void>) => unknown;
  exit: (code?: number) => never | void;
};

type AttachGracefulShutdownInput = {
  processLike?: ProcessLike;
  closeServer: (cb: (err?: Error) => void) => void;
  closeStore?: () => Promise<void>;
};

const closeServerAsync = (closeServer: (cb: (err?: Error) => void) => void) =>
  new Promise<void>((resolve, reject) => {
    closeServer(err => {
      if (err) return reject(err);
      return resolve();
    });
  });

export const attachGracefulShutdown = (input: AttachGracefulShutdownInput) => {
  const processLike = input.processLike || process;
  let shuttingDown = false;

  const handler = async () => {
    if (shuttingDown) return;
    shuttingDown = true;

    try {
      await closeServerAsync(input.closeServer);
      if (input.closeStore) {
        await input.closeStore();
      }
      processLike.exit(0);
    } catch {
      processLike.exit(1);
    }
  };

  processLike.on("SIGINT", handler);
  processLike.on("SIGTERM", handler);
};
