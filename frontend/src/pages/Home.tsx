import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

type Overview = { id: string; title: string; content: string; createdAt: string };
type Institution = { id: string; name: string; iconUrl?: string };

export default function Home() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      await api.post("/api/rss/refresh", {});
      const o = await api.get("/api/overview/latest");
      setOverview(o.data);
      const inst = await api.get("/api/institutions");
      setInstitutions(inst.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div>
      <section style={{ padding: "16px 0" }}>
        <h2>最新综述</h2>
        {overview ? (
          <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{overview.title}</div>
            <div style={{ marginTop: 8 }}>{overview.content}</div>
            <div style={{ marginTop: 8, color: "#666" }}>{new Date(overview.createdAt).toLocaleString()}</div>
          </div>
        ) : (
          <div>暂无综述</div>
        )}
        <button onClick={refresh} disabled={loading} style={{ marginTop: 12 }}>
          {loading ? "刷新中" : "刷新RSS"}
        </button>
      </section>
      <section style={{ padding: "16px 0" }}>
        <h2>机构</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
          {institutions.map(i => (
            <Link key={i.id} to={`/institution/${i.id}`} style={{ textDecoration: "none" }}>
              <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 20, background: "#1E3A8A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {i.name.slice(0, 1)}
                </div>
                <div style={{ fontWeight: 600 }}>{i.name}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}