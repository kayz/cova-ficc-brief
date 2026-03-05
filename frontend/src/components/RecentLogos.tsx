import React from 'react';

interface RecentLogo {
  id: string;
  name: string;
  color: string;
  viewedAt: string;
}

const RecentLogos: React.FC = () => {
  // 模拟最近浏览的logo数据
  const recentLogos: RecentLogo[] = [
    { id: '1', name: 'Apple', color: 'bg-gray-800', viewedAt: '2分钟前' },
    { id: '2', name: 'Google', color: 'bg-blue-500', viewedAt: '5分钟前' },
    { id: '3', name: 'Microsoft', color: 'bg-blue-600', viewedAt: '8分钟前' },
    { id: '4', name: 'Amazon', color: 'bg-orange-500', viewedAt: '12分钟前' },
    { id: '5', name: 'Netflix', color: 'bg-red-600', viewedAt: '15分钟前' },
    { id: '6', name: 'Spotify', color: 'bg-green-500', viewedAt: '18分钟前' },
    { id: '7', name: 'Nike', color: 'bg-black', viewedAt: '22分钟前' },
    { id: '8', name: 'Adidas', color: 'bg-gray-700', viewedAt: '25分钟前' },
    { id: '9', name: 'Starbucks', color: 'bg-green-600', viewedAt: '30分钟前' },
    { id: '10', name: 'McDonald\'s', color: 'bg-yellow-500', viewedAt: '35分钟前' },
    { id: '11', name: 'Coca-Cola', color: 'bg-red-500', viewedAt: '40分钟前' },
    { id: '12', name: 'Pepsi', color: 'bg-blue-700', viewedAt: '45分钟前' },
  ];

  // 复制数组以实现无缝滚动
  const duplicatedLogos = [...recentLogos, ...recentLogos];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            最近浏览的图标
          </h2>
          <p className="text-gray-600">
            继续探索您感兴趣的图标和品牌
          </p>
        </div>

        {/* 滚动容器 */}
        <div className="relative overflow-hidden">
          <div className="flex animate-scroll-slow hover:[animation-play-state:paused] gap-4">
            {duplicatedLogos.map((logo, index) => (
              <div
                key={`${logo.id}-${index}`}
                className="flex-shrink-0 w-32 cursor-pointer group"
              >
                <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 border border-gray-100 group-hover:scale-105">
                  {/* Logo图标 */}
                  <div className={`w-16 h-16 ${logo.color} rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                    </svg>
                  </div>
                  
                  {/* Logo名称 */}
                  <h3 className="text-sm font-semibold text-gray-900 text-center mb-1 group-hover:text-primary-600 transition-colors">
                    {logo.name}
                  </h3>
                  
                  {/* 浏览时间 */}
                  <p className="text-xs text-gray-500 text-center">{logo.viewedAt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 渐变遮罩 */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
      </div>
    </section>
  );
};

export default RecentLogos;