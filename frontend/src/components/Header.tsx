import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-gray-900 hover:text-primary-600 transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
            </div>
            <span className="text-xl font-bold">LogoSearch</span>
          </Link>

          {/* 导航菜单 */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/icons" 
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              图标库
            </Link>
            <Link 
              to="/categories" 
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              分类
            </Link>
            <Link 
              to="/about" 
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              关于本站
            </Link>
          </nav>

          {/* 移动端菜单按钮 */}
          <div className="md:hidden">
            <button className="text-gray-700 hover:text-primary-600 p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;