import { useState } from "react";
import api from "../api";

type LinkSourceResponse = {
  created: boolean;
  source: {
    channelId: string;
  };
};

export default function WechatSourceInput() {
  const [articleUrl, setArticleUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = articleUrl.trim();
    if (!normalized) {
      setErrorMsg("请输入公众号文章链接");
      setSuccessMsg("");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const r = await api.post<LinkSourceResponse>("/api/sources/wechat/link", { articleUrl: normalized });
      setSuccessMsg(`接入成功：${r.data.source.channelId}`);
    } catch {
      setErrorMsg("接入失败，请检查链接格式");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "24px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>接入公众号</h1>
      <p style={{ color: "#64748b", marginBottom: 16 }}>
        输入任意公众号文章链接，系统会识别并接入该公众号作为采集源。
      </p>
      <form onSubmit={onSubmit}>
        <label htmlFor="wechat-article-url" style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
          公众号文章链接
        </label>
        <input
          id="wechat-article-url"
          type="url"
          value={articleUrl}
          onChange={e => setArticleUrl(e.target.value)}
          placeholder="https://mp.weixin.qq.com/s?__biz=..."
          style={{
            width: "100%",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            padding: "10px 12px"
          }}
        />
        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: 12,
            background: "#0f172a",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 8,
            border: "none",
            cursor: submitting ? "not-allowed" : "pointer"
          }}
        >
          {submitting ? "接入中" : "接入公众号"}
        </button>
      </form>
      {successMsg && <p style={{ marginTop: 12, color: "#166534" }}>{successMsg}</p>}
      {errorMsg && <p style={{ marginTop: 12, color: "#b91c1c" }}>{errorMsg}</p>}
    </div>
  );
}
