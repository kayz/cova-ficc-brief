import { useEffect, useState } from "react";
import api from "../api";

type DailyBrief = {
  id: string;
  title: string;
  content: string;
};

export default function DailyBriefPage() {
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadLatest = async () => {
    try {
      const r = await api.get<DailyBrief>("/api/briefs/daily/latest");
      setBrief(r.data);
      setErrorMsg("");
    } catch {
      setBrief(null);
      setErrorMsg("暂无今日日报");
    }
  };

  useEffect(() => {
    void loadLatest();
  }, []);

  const runNow = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const r = await api.post<DailyBrief>("/api/briefs/daily/run", {});
      setBrief(r.data);
    } catch {
      setErrorMsg("生成失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 820, margin: "24px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>FICC 每日简报</h1>
      <button
        onClick={runNow}
        disabled={loading}
        style={{
          marginBottom: 16,
          background: "#0f172a",
          color: "#fff",
          padding: "10px 14px",
          borderRadius: 8,
          border: "none",
          cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        {loading ? "生成中" : "立即生成今日日报"}
      </button>
      {errorMsg && <p style={{ color: "#b91c1c" }}>{errorMsg}</p>}
      {brief && (
        <article style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
          <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>{brief.title}</h2>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{brief.content}</pre>
        </article>
      )}
    </div>
  );
}

