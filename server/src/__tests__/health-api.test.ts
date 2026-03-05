import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";

describe("health and readiness APIs", () => {
  it("returns healthy status from /healthz", async () => {
    const app = createApp();
    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("cova-ficc-brief");
    expect(typeof res.body.time).toBe("string");
  });

  it("returns ready status when readiness probe passes", async () => {
    const app = createApp({
      readinessProbe: async () => ({ ready: true })
    });

    const res = await request(app).get("/readyz");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ready");
  });

  it("returns 503 when readiness probe fails", async () => {
    const app = createApp({
      readinessProbe: async () => ({ ready: false, reason: "db_unreachable" })
    });

    const res = await request(app).get("/readyz");
    expect(res.status).toBe(503);
    expect(res.body.status).toBe("not_ready");
    expect(res.body.reason).toBe("db_unreachable");
  });
});
