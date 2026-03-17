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
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzbpON0RYiDePaSBgQ_29DWztcDV1xJ2U1hbETM1uNDFAT1lMh34wOcmRG3m3U-AII/exec';
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

  // 추출 및 추가 관련 상태
  const [coupangUrl, setCoupangUrl] = useState<string>('');
  const [extracting, setExtracting] = useState<boolean>(false);
  const [adding, setAdding] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [extractedData, setExtractedData] = useState<Partial<Product> | null>(null);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toUpperCase() === 'A') {
        setShowLogin(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
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

  // 정보 추출 및 파싱 함수
  const handleExtract = async () => {
    if (!coupangUrl) return alert('링크 또는 코드를 입력해주세요!');
    
    setExtracting(true);
    setExtractedData(null);
    setProgress(0);

    let finalLink = coupangUrl;
    let initialTitle = '';
    let initialImage = '';

    // 1. HTML 코드인 경우 1차 파싱 (링크/이미지/상품명 추출)
    if (coupangUrl.includes('<')) {
      setProgress(30);
      const hrefMatch = coupangUrl.match(/href="(.*?)"/);
      const srcMatch = coupangUrl.match(/src="(.*?)"/);
      const altMatch = coupangUrl.match(/alt="(.*?)"/);
      const iframeSrcMatch = coupangUrl.match(/src="(.*?)"/);

      if (hrefMatch) finalLink = hrefMatch[1];
      else if (iframeSrcMatch) finalLink = iframeSrcMatch[1];
      
      if (srcMatch) initialImage = srcMatch[1];
      if (altMatch) initialTitle = altMatch[1];
    }

    // 2. 서버를 통해 상세 정보(특히 가격) 한 번 더 조회
    const timer = setInterval(() => {
      setProgress(prev => (prev >= 90 ? prev : prev + Math.random() * 5));
    }, 300);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: finalLink })
      });
      const data = await response.json();
      
      setProgress(100);
      setTimeout(() => {
        setExtractedData({
          name: data.title !== '상품명을 찾을 수 없습니다' ? data.title : (initialTitle || '쿠팡 상품'),
          price: data.price || '가격 확인 필요',
          image: data.image || initialImage || 'https://via.placeholder.com/150',
          link: finalLink,
          category: '전체'
        });
        setExtracting(false);
      }, 500);
    } catch (error) {
      // 서버 추출 실패 시 1차 파싱 정보라도 보여줌
      setExtractedData({
        name: initialTitle || '쿠팡 상품',
        price: '가격 확인 필요',
        image: initialImage || 'https://via.placeholder.com/150',
        link: finalLink,
        category: '전체'
      });
      setExtracting(false);
    } finally {
      clearInterval(timer);
    }
  };

  // 구글 시트에 자동 추가 함수 (즉시 갱신 로직 추가)
  const handleAddToSheet = async () => {
    if (!extractedData) return;
    setAdding(true);

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extractedData)
      });
      
      alert('✅ 시트에 등록되었습니다! 잠시 후 화면이 갱신됩니다.');
      setExtractedData(null);
      setCoupangUrl('');
      
      // 즉시 데이터 새로고침 (여러 번 시도하여 시트 반영 대기)
      setTimeout(fetchProducts, 3000);
      setTimeout(fetchProducts, 6000);
    } catch (error) {
      alert('시트 추가 중 오류 발생');
    } finally {
      setAdding(false);
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
              <a href="https://docs.google.com/spreadsheets/d/1wGES7Bu8zvHLaUdND-7E197f6FlUy9WmpcHVdNWWcII/edit" target="_blank" rel="noreferrer">📊 시트 열기</a>
              <button onClick={() => setIsAdmin(false)} className="logout-btn">나가기</button>
            </div>
          </div>
          <div className="admin-extractor">
            <textarea 
              placeholder="쿠팡 링크 또는 HTML 코드를 붙여넣으세요" 
              value={coupangUrl} 
              onChange={(e) => setCoupangUrl(e.target.value)}
              rows={3}
            />
            <button onClick={handleExtract} disabled={extracting}>{extracting ? '⏳ 분석 중...' : '⚡ 분석 및 추출'}</button>
          </div>
          
          {extracting && (
            <div className="progress-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              <span className="progress-text">{Math.round(progress)}% 진행 중...</span>
            </div>
          )}

          {extractedData && (
            <div className="extracted-preview">
              <img src={extractedData.image} alt="preview" />
              <div className="ext-info">
                <p><strong>명칭:</strong> {extractedData.name}</p>
                <p><strong>가격:</strong> {extractedData.price}</p>
                <button className="add-to-sheet-btn" onClick={handleAddToSheet} disabled={adding}>
                  {adding ? '🔄 등록 중...' : '✅ 구글 시트에 즉시 등록'}
                </button>
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

      <footer className="footer"><div className="footer-notice"><p>이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p><p>© 2026 머니 랩 쿠팡 프로젝트. 모든 권리 보유.</p></div></footer>
    </div>
  );
};

export default App;
