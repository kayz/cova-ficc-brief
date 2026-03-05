import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";

type Article = { id: string; title: string; summary: string; pubDate: string };

export default function Institution() {
  const { id } = useParams();
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      const r = await api.get(`/api/institutions/${id}/articles`);
      setArticles(r.data);
    };
    run();
  }, [id]);

  return (
    <div>
      <h2>机构文章</h2>
      <div style={{ display: "grid", gap: 12 }}>
        {articles.map(a => (
          <Link key={a.id} to={`/article/${a.id}`} style={{ textDecoration: "none" }}>
            <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{a.title}</div>
              <div style={{ marginTop: 6, color: "#555" }}>{a.summary}</div>
              <div style={{ marginTop: 6, color: "#888" }}>{new Date(a.pubDate).toLocaleString()}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}