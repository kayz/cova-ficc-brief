import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

type Article = { id: string; title: string; summary: string; content?: string; link: string; pubDate: string };

export default function Article() {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      const r = await api.get(`/api/articles/${id}`);
      setArticle(r.data);
    };
    run();
  }, [id]);

  if (!article) return <div>加载中</div>;

  return (
    <div>
      <h1>{article.title}</h1>
      <div style={{ color: "#888" }}>{new Date(article.pubDate).toLocaleString()}</div>
      <div style={{ marginTop: 10 }}>{article.summary}</div>
      {article.content && (
        <div style={{ marginTop: 12 }} dangerouslySetInnerHTML={{ __html: article.content }} />
      )}
      <a href={article.link} target="_blank" rel="noreferrer" style={{ marginTop: 12, display: "inline-block" }}>原文链接</a>
    </div>
  );
}