import React, { useState } from 'react';
import './styles/App.css';
import productsData from './data/products.json';

interface Product {
  id: number;
  name: string;
  price: string;
  image: string;
  link: string;
  category: string;
  isRocket: boolean;
  badge?: string;
  originalPrice?: string;
  discountRate?: string;
}

const App: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const categories = ['전체', ...new Set(productsData.map(p => p.category))];

  const filteredProducts = selectedCategory === '전체' 
    ? productsData 
    : productsData.filter(p => p.category === selectedCategory);

  return (
    <div className="app-container">
      {/* 긴급 공지 티커 */}
      <div className="ticker">
        <div className="ticker-content">
          🔥 실시간 급상승! 🚀 마트보다 저렴한 생필품 모음전! 🔥 지금 주문하면 내일 아침 도착! 🚚💨
        </div>
      </div>

      <header className="hero-section">
        <div className="hero-content">
          <h1 className="main-title">쿠팡 큐레이터 <span>MINZZA</span> 🛒</h1>
          <p className="sub-title">"인생을 건" 최저가 쇼핑 정보만 모았습니다.</p>
        </div>
        <div className="search-dummy">
          <input type="text" placeholder="검색어를 입력하세요..." readOnly />
          <button>🔍</button>
        </div>
      </header>

      <nav className="category-bar">
        {categories.map(cat => (
          <button 
            key={cat} 
            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </nav>

      <main className="product-grid">
        {filteredProducts.map((product: Product) => (
          <div key={product.id} className="product-card">
            {product.badge && <div className="badge">{product.badge}</div>}
            <div className="image-container">
              <img src={product.image} alt={product.name} className="product-image" />
              {product.isRocket && (
                <div className="rocket-icon">🚀</div>
              )}
            </div>
            <div className="info-container">
              <h3 className="product-name">{product.name}</h3>
              <div className="price-info">
                {product.discountRate && <span className="discount">{product.discountRate}</span>}
                <p className="product-price">{product.price}</p>
              </div>
              <a href={product.link} target="_blank" rel="noopener noreferrer" className="buy-btn">
                최저가 보러가기
              </a>
            </div>
          </div>
        ))}
      </main>

      <footer className="footer">
        <div className="footer-notice">
          <p>쿠팡 파트너스 활동의 일환으로 수수료를 제공받을 수 있습니다.</p>
          <p>© 2026 Minzza Lab Coupang Project. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
