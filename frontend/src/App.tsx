import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Institution from "./pages/Institution";
import Article from "./pages/Article";
import LogoSearchLanding from "./pages/LogoSearchLanding";
import WechatSourceInput from "./pages/WechatSourceInput";

export default function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<LogoSearchLanding />} />
        <Route path="/home" element={<Home />} />
        <Route path="/sources/wechat" element={<WechatSourceInput />} />
        <Route path="/institution/:id" element={<Institution />} />
        <Route path="/article/:id" element={<Article />} />
      </Routes>
    </div>
  );
}
