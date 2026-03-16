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
}

const App: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const categories = ['전체', ...new Set(productsData.map(p => p.category))];

  const filteredProducts = selectedCategory === '전체' 
    ? productsData 
    : productsData.filter(p => p.category === selectedCategory);

  return (
    <div className="app-container">
      <div className="ticker">
        <div className="ticker-content">
          📢 마트에서 무겁게 들고 가지 마세요! 🚀 지금 주문하면 내일 아침 문 앞 로켓배송! 🔥
        </div>
      </div>

      <header>
        <h1 className="main-title">로켓배송 스마트 쇼핑 🛒</h1>
        <p className="sub-title">무거운 짐은 쿠팡에게, 쇼핑은 즐겁게!</p>
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
            <img src={product.image} alt={product.name} className="product-image" />
            <h3 className="product-name">{product.name}</h3>
            <p className="product-price">{product.price}</p>
            {product.isRocket && (
              <div className="rocket-badge">🚀 로켓배송 </div>
            )}
            <a href={product.link} target="_blank" rel="noopener noreferrer" className="buy-btn">
              최저가 확인하기
            </a>
          </div>
        ))}
      </main>

      <footer>
        <p>쿠팡 파트너스 활동의 일환으로 수수료를 제공받을 수 있습니다.</p>
        <p>© 2026 Coupang Partners Curation Project</p>
      </footer>
    </div>
  );
};

export default App;
