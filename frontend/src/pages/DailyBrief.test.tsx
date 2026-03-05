import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DailyBriefPage from "./DailyBrief";
import api from "../api";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

describe("DailyBriefPage", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        id: "brief_1",
        title: "2026-03-06 FICC 市场简报",
        content: "brief content"
      }
    });
    vi.mocked(api.post).mockResolvedValue({
      data: {
        id: "brief_2",
        title: "2026-03-07 FICC 市场简报",
        content: "new brief content"
      }
    });
  });

  it("loads latest daily brief", async () => {
    render(<DailyBriefPage />);
    expect(api.get).toHaveBeenCalledWith("/api/briefs/daily/latest");
    expect(await screen.findByText("2026-03-06 FICC 市场简报")).toBeInTheDocument();
    expect(await screen.findByText("brief content")).toBeInTheDocument();
  });

  it("triggers manual brief run", async () => {
    render(<DailyBriefPage />);
    await userEvent.click(screen.getByRole("button", { name: "立即生成今日日报" }));
    expect(api.post).toHaveBeenCalledWith("/api/briefs/daily/run", {});
    expect(await screen.findByText("2026-03-07 FICC 市场简报")).toBeInTheDocument();
  });
});
