import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import WechatSourceInput from "./WechatSourceInput";
import api from "../api";

vi.mock("../api", () => ({
  default: {
    post: vi.fn()
  }
}));

describe("WechatSourceInput", () => {
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
});
