import React, { useState } from 'react';

interface HeroSectionProps {
  onSearch?: (query: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <section className="bg-gradient-to-br from-primary-50 to-blue-50 py-20">
      <div className="container mx-auto px-4 text-center">
        {/* 主标题 */}
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          发现完美的
          <span className="text-primary-600"> Logo图标</span>
        </h1>
        
        {/* 副标题 */}
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          LogoSearch 提供海量高质量的软件图标资源，帮助设计师和开发者快速找到理想的logo设计灵感
        </p>

        {/* 搜索框 */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索图标、品牌或关键词..."
              className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-6 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>搜索</span>
            </button>
          </div>
        </form>

        {/* 热门标签 */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <span className="text-sm text-gray-500">热门搜索：</span>
          {['科技', '金融', '教育', '医疗', '餐饮', '电商'].map((tag) => (
            <button
              key={tag}
              onClick={() => setSearchQuery(tag)}
              className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-full hover:bg-primary-50 hover:border-primary-300 transition-colors duration-200"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">50,000+</div>
            <div className="text-gray-600">图标资源</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">1,200+</div>
            <div className="text-gray-600">品牌分类</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">100,000+</div>
            <div className="text-gray-600">设计师使用</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;