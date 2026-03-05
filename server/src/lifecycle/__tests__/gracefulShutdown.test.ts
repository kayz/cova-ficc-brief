import { describe, expect, it, vi } from "vitest";
import { attachGracefulShutdown } from "../gracefulShutdown";

describe("attachGracefulShutdown", () => {
  it("closes resources and exits on SIGTERM", async () => {
    const handlers = new Map<string, () => void>();
    const closeServer = vi.fn((cb?: (err?: Error) => void) => cb?.());
    const closeStore = vi.fn().mockResolvedValue(undefined);
    const exit = vi.fn();

    attachGracefulShutdown({
      processLike: {
        on: (signal: string, handler: () => void) => {
          handlers.set(signal, handler);
          return {} as any;
        },
        exit
      } as any,
      closeServer,
      closeStore
    });

    await handlers.get("SIGTERM")?.();

    expect(closeServer).toHaveBeenCalledTimes(1);
    expect(closeStore).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(0);
  });

  it("exits with code 1 when close throws", async () => {
    const handlers = new Map<string, () => void>();
    const closeServer = vi.fn((cb?: (err?: Error) => void) => cb?.(new Error("server_close_failed")));
    const closeStore = vi.fn().mockResolvedValue(undefined);
    const exit = vi.fn();

    attachGracefulShutdown({
      processLike: {
        on: (signal: string, handler: () => void) => {
          handlers.set(signal, handler);
          return {} as any;
        },
        exit
      } as any,
      closeServer,
      closeStore
    });

    await handlers.get("SIGINT")?.();

    expect(exit).toHaveBeenCalledWith(1);
  });
});
