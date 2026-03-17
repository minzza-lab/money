import React, { useState, useEffect } from 'react';
import './styles/App.css';

interface Product {
  id: number;
  name: string;
  price: string;
  image: string;
  link: string;
  category: string;
  isRocket: boolean;
  badge?: string;
  discountRate?: string;
}

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR_nOqXyVAPTZiMbxtilRQnFBZjkUGL3oz0twTEsNEskU6lxhkW7M3JDwVwHys8Ayty5-x0UlJ2YH3L/pub?gid=0&single=true&output=csv';
const ADMIN_PASSWORD = '5365';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');

  // 추출기 관련 상태
  const [coupangUrl, setCoupangUrl] = useState<string>('');
  const [extracting, setExtracting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [extractedData, setExtractedData] = useState<Partial<Product> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toUpperCase() === 'A') {
        setShowLogin(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const fetchProducts = async () => {
      try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        const rows = data.split('\n').slice(1);
        const parsedData = rows.map((row, index) => {
          const columns = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (!columns || columns.length < 5) return null;
          const clean = (val: string) => val.replace(/^"|"$/g, '').trim();
          return {
            id: index + 1,
            name: clean(columns[1]),
            price: clean(columns[2]),
            image: clean(columns[3]),
            link: clean(columns[4]),
            category: clean(columns[5] || '기타'),
            isRocket: clean(columns[6]).toUpperCase() === 'TRUE',
            badge: clean(columns[7] || ''),
            discountRate: clean(columns[8] || '')
          };
        }).filter(item => item !== null) as Product[];
        setProducts(parsedData);
        setLoading(false);
      } catch (error) {
        console.error('데이터를 불러오는데 실패했습니다:', error);
        setLoading(false);
      }
    };

    fetchProducts();
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowLogin(false);
      setPasswordInput('');
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  // 쿠팡 정보 추출 함수
  const handleExtract = async () => {
    if (!coupangUrl) return alert('쿠팡 링크를 입력해주세요!');
    setExtracting(true);
    setExtractedData(null);
    setProgress(0);

    // 가짜 진행률 애니메이션 (95%까지 서서히 상승)
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        const diff = Math.random() * 10; 
        return Math.min(prev + diff, 95);
      });
    }, 300);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: coupangUrl })
      });
      
      if (!response.ok) throw new Error('Fetch failed');
      
      const data = await response.json();
      
      // 완료 시 100%로 점프
      setProgress(100);
      
      setTimeout(() => {
        setExtractedData({
          name: data.title,
          price: data.price,
          image: data.image,
          link: coupangUrl
        });
        setExtracting(false);
      }, 500);

    } catch (error) {
      alert('정보를 가져오는데 실패했습니다. (로컬 환경에서는 작동하지 않을 수 있습니다)');
      setExtracting(false);
    } finally {
      clearInterval(timer);
    }
  };

  const categories = [
    { name: '전체', icon: '🏠' },
    { name: '무거운 생필품', icon: '📦' },
    { name: '가전디지털', icon: '💻' },
    { name: '주방용품', icon: '🍳' },
    { name: '간편식품', icon: '🍜' }
  ];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === '전체' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) return <div className="loading-screen"><div className="loader"></div><p>상품 정보를 불러오는 중입니다...</p></div>;

  return (
    <div className="app-container">
      {isAdmin && (
        <div className="admin-banner-v2">
          <div className="admin-top">
            <span>🛡️ 관리자 모드</span>
            <div className="admin-links">
              <a href="https://docs.google.com/spreadsheets/d/1wGES7Bu8zvHLaUdND-7E197f6FlUy9WmpcHVdNWWcII/edit" target="_blank" rel="noreferrer">📊 시트</a>
              <button onClick={() => setIsAdmin(false)} className="logout-btn">나가기</button>
            </div>
          </div>
          <div className="admin-extractor">
            <input 
              type="text" 
              placeholder="쿠팡 상품 링크를 입력하세요" 
              value={coupangUrl}
              onChange={(e) => setCoupangUrl(e.target.value)}
            />
            <button onClick={handleExtract} disabled={extracting}>
              {extracting ? '⏳ 분석 중...' : '⚡ 정보 추출'}
            </button>
          </div>
          
          {/* 프로그레스 바 추가 */}
          {extracting && (
            <div className="progress-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              <span className="progress-text">{Math.round(progress)}% 분석 중...</span>
            </div>
          )}

          {extractedData && (
            <div className="extracted-preview">
              <img src={extractedData.image} alt="preview" />
              <div className="ext-info">
                <p><strong>명칭:</strong> {extractedData.name}</p>
                <p><strong>가격:</strong> {extractedData.price}</p>
                <p className="hint">💡 위 정보를 복사하여 구글 시트에 붙여넣으세요!</p>
              </div>
            </div>
          )}
        </div>
      )}

      {showLogin && (
        <div className="modal-overlay">
          <div className="login-modal">
            <h3>관리자 인증</h3>
            <input type="password" placeholder="비밀번호 입력" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
            <div className="login-btns">
              <button onClick={handleLogin}>확인</button>
              <button onClick={() => setShowLogin(false)} className="cancel">취소</button>
            </div>
          </div>
        </div>
      )}

      <div className="ticker"><div className="ticker-content">🔥 실시간 급상승! 🚀 마트보다 저렴한 생필품 모음전! 🔥</div></div>

      <header className="hero-section">
        <div className="hero-content">
          <h1 className="main-title">쿠팡 큐레이터 <span>MONEY</span> 🛒</h1>
          <p className="sub-title">"가성비 끝판왕" 쇼핑 정보만 엄선했습니다.</p>
        </div>
        <div className="search-box">
          <input type="text" placeholder="찾으시는 상품이 있나요?" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <button className="search-btn">🔍</button>
        </div>
      </header>

      <nav className="category-bar">
        {categories.map(cat => (
          <button key={cat.name} className={`category-btn ${selectedCategory === cat.name ? 'active' : ''}`} onClick={() => setSelectedCategory(cat.name)}>
            <span className="cat-icon">{cat.icon}</span>
            <span className="cat-name">{cat.name}</span>
          </button>
        ))}
      </nav>

      <main className="product-grid">
        {filteredProducts.map((product: Product) => (
          <div key={product.id} className="product-card" onClick={() => setSelectedProduct(product)}>
            {product.badge && <div className="badge">{product.badge}</div>}
            <div className="image-container">
              <img src={product.image} alt={product.name} className="product-image" />
              {product.isRocket && <div className="rocket-icon">🚀</div>}
            </div>
            <div className="info-container">
              <h3 className="product-name">{product.name}</h3>
              <div className="price-info">
                {product.discountRate && <span className="discount">{product.discountRate}</span>}
                <p className="product-price">{product.price}</p>
              </div>
              <div className="card-footer">
                <span className="category-tag">{product.category}</span>
                <button className="buy-btn-small">상세보기</button>
              </div>
            </div>
          </div>
        ))}
      </main>

      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedProduct(null)}>×</button>
            <div className="modal-body">
              <img src={selectedProduct.image} alt={selectedProduct.name} className="modal-image" />
              <div className="modal-info">
                <h2>{selectedProduct.name}</h2>
                <div className="modal-price">{selectedProduct.price}</div>
                <div className="modal-desc">
                  <p>✅ 로켓배송 가능 상품</p>
                  <p>✅ 무료 반품 가능</p>
                  <p>✅ 쿠팡 최저가 보장</p>
                </div>
                <a href={selectedProduct.link} target="_blank" rel="noopener noreferrer" className="modal-buy-btn">쿠팡에서 최저가로 구매하기</a>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="footer"><div className="footer-notice"><p>쿠팡 파트너스 활동의 일환으로 수수료를 제공받을 수 있습니다.</p><p>© 2026 머니 랩 쿠팡 프로젝트. 모든 권리 보유.</p></div></footer>
    </div>
  );
};

export default App;
