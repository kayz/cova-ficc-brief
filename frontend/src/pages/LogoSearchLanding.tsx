import React from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import IconGrid from '../components/IconGrid';
import RecentLogos from '../components/RecentLogos';
import Footer from '../components/Footer';

const LogoSearchLanding: React.FC = () => {
  const handleSearch = (query: string) => {
    console.log('搜索:', query);
    // 这里可以添加搜索逻辑
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航 */}
      <Header />
      
      {/* 主视觉区域 */}
      <HeroSection onSearch={handleSearch} />
      
      {/* 示例图标展示 */}
      <IconGrid />
      
      {/* 最近浏览的Logo */}
      <RecentLogos />
      
      {/* 页脚 */}
      <Footer />
    </div>
  );
};

export default LogoSearchLanding;