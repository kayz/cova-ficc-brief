import React from 'react';

interface Icon {
  id: string;
  name: string;
  category: string;
  color: string;
}

const IconGrid: React.FC = () => {
  // 示例图标数据
  const sampleIcons: Icon[] = [
    { id: '1', name: 'Apple', category: '科技', color: 'bg-gray-800' },
    { id: '2', name: 'Google', category: '科技', color: 'bg-blue-500' },
    { id: '3', name: 'Microsoft', category: '科技', color: 'bg-blue-600' },
    { id: '4', name: 'Amazon', category: '电商', color: 'bg-orange-500' },
    { id: '5', name: 'Netflix', category: '娱乐', color: 'bg-red-600' },
    { id: '6', name: 'Spotify', category: '音乐', color: 'bg-green-500' },
    { id: '7', name: 'Nike', category: '运动', color: 'bg-black' },
    { id: '8', name: 'Adidas', category: '运动', color: 'bg-gray-700' },
    { id: '9', name: 'Starbucks', category: '餐饮', color: 'bg-green-600' },
    { id: '10', name: 'McDonald\'s', category: '餐饮', color: 'bg-yellow-500' },
    { id: '11', name: 'Coca-Cola', category: '饮料', color: 'bg-red-500' },
    { id: '12', name: 'Pepsi', category: '饮料', color: 'bg-blue-700' },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            精选图标展示
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            浏览我们精心挑选的优质图标，涵盖各个行业和品牌，为您的设计项目提供灵感
          </p>
        </div>

        {/* 图标网格 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-12">
          {sampleIcons.map((icon) => (
            <div
              key={icon.id}
              className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
            >
              <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100">
                {/* 图标预览 */}
                <div className={`w-16 h-16 ${icon.color} rounded-lg mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                  </svg>
                </div>
                
                {/* 图标信息 */}
                <h3 className="text-sm font-semibold text-gray-900 text-center mb-1 group-hover:text-primary-600 transition-colors">
                  {icon.name}
                </h3>
                <p className="text-xs text-gray-500 text-center">{icon.category}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 查看更多按钮 */}
        <div className="text-center">
          <button className="bg-primary-600 text-white px-8 py-3 rounded-full hover:bg-primary-700 transition-colors duration-200 font-medium">
            浏览更多图标
          </button>
        </div>
      </div>
    </section>
  );
};

export default IconGrid;