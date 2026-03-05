import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WechatSourceInput from "./WechatSourceInput";
import api from "../api";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

describe("WechatSourceInput", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    vi.mocked(api.post).mockReset();
  });

  it("submits wechat article link and shows success", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        created: true,
        source: { channelId: "wechat_mza3otywndk5mw==" }
      }
    });

    render(<WechatSourceInput />);

    await userEvent.type(
      screen.getByLabelText("公众号文章链接"),
      "https://mp.weixin.qq.com/s?__biz=MzA3OTYwNDk5Mw==&mid=1&idx=1&sn=abc"
    );
    await userEvent.click(screen.getByRole("button", { name: "接入公众号" }));

    expect(api.post).toHaveBeenCalledWith("/api/sources/wechat/link", {
      articleUrl: "https://mp.weixin.qq.com/s?__biz=MzA3OTYwNDk5Mw==&mid=1&idx=1&sn=abc"
    });
    expect(await screen.findByText("接入成功：wechat_mza3otywndk5mw==")).toBeInTheDocument();
  });

  it("loads and renders source list", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        { id: "1", displayName: "WeChat-A", channelId: "wechat_a", updatedAt: "2026-03-05T10:00:00Z" },
        { id: "2", displayName: "WeChat-B", channelId: "wechat_b", updatedAt: "2026-03-05T11:00:00Z" }
      ]
    });

    render(<WechatSourceInput />);

    expect(api.get).toHaveBeenCalledWith("/api/sources");
    expect(await screen.findByText("WeChat-A")).toBeInTheDocument();
    expect(await screen.findByText("wechat_b")).toBeInTheDocument();
  });
});
