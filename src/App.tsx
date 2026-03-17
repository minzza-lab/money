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
      const cacheBuster = `&t=${new Date().getTime()}`;
      const response = await fetch(SHEET_URL + cacheBuster);
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
      console.error('데이터 로딩 실패:', error);
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

  const handleExtract = async () => {
    if (!coupangUrl) return alert('링크 또는 코드를 입력해주세요!');
    setExtracting(true);
    setExtractedData(null);
    setProgress(0);

    let finalLink = coupangUrl;
    let initialTitle = '';
    let initialImage = '';

    if (coupangUrl.includes('<')) {
      setProgress(30);
      const hrefMatch = coupangUrl.match(/href="(.*?)"/);
      const srcMatch = coupangUrl.match(/src="(.*?)"/);
      const altMatch = coupangUrl.match(/alt="(.*?)"/);
      if (hrefMatch) finalLink = hrefMatch[1];
      if (srcMatch) initialImage = srcMatch[1];
      if (altMatch) initialTitle = altMatch[1];
    }

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
          name: data.title !== '상품명을 찾을 수 없습니다' ? data.title : initialTitle,
          price: data.price,
          image: data.image || initialImage,
          link: finalLink,
          category: '기타'
        });
        setExtracting(false);
      }, 500);
    } catch (error) {
      alert('추출 실패');
      setExtracting(false);
    } finally {
      clearInterval(timer);
    }
  };

  const handleAddToSheet = async () => {
    if (!extractedData) return;
    setAdding(true);
    try {
      const safeData = {
        ...extractedData,
        name: extractedData.name?.replace(/,/g, ' '),
        image: extractedData.image?.trim(),
        link: extractedData.link?.trim()
      };
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safeData)
      });
      alert('✅ 시트에 등록되었습니다!');
      setExtractedData(null);
      setCoupangUrl('');
      setTimeout(fetchProducts, 3000);
    } catch (error) {
      alert('등록 오류');
    } finally {
      setAdding(false);
    }
  };

  const categories = [
    { name: '전체', icon: '🏠' },
    { name: '생수', icon: '💧' },
    { name: '콜라/음료', icon: '🥤' },
    { name: '식품', icon: ' Ramen' },
    { name: '전자제품', icon: '💻' },
    { name: '기타', icon: '📦' }
  ];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === '전체' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) return <div className="loading-screen"><div className="loader"></div><p>데이터 로딩 중...</p></div>;

  return (
    <div className="app-container">
      {isAdmin && (
        <div className="admin-banner-v2">
          <div className="admin-top">
            <span>🛡️ 관리자</span>
            <div className="admin-links">
              <a href="https://docs.google.com/spreadsheets/d/1wGES7Bu8zvHLaUdND-7E197f6FlUy9WmpcHVdNWWcII/edit" target="_blank" rel="noreferrer">📊 시트</a>
              <button onClick={() => setIsAdmin(false)} className="logout-btn">나가기</button>
            </div>
          </div>
          <div className="admin-extractor">
            <textarea placeholder="쿠팡 링크 또는 코드 붙여넣기" value={coupangUrl} onChange={(e) => setCoupangUrl(e.target.value)} rows={2} />
            <button onClick={handleExtract} disabled={extracting}>{extracting ? '⏳ 추출 중...' : '⚡ 정보 추출'}</button>
          </div>
          {extracting && <div className="progress-container"><div className="progress-bar" style={{ width: `${progress}%` }}></div><span className="progress-text">{Math.round(progress)}%</span></div>}
          {extractedData && (
            <div className="extracted-preview-v2">
              <div className="ext-top"><img src={extractedData.image} alt="p" /><span>정보 수정 후 등록</span></div>
              <div className="ext-form">
                <div className="input-group"><label>상품명</label><input type="text" value={extractedData.name} onChange={(e) => setExtractedData({...extractedData, name: e.target.value})} /></div>
                <div className="input-group"><label>가격</label><input type="text" value={extractedData.price} onChange={(e) => setExtractedData({...extractedData, price: e.target.value})} /></div>
                <div className="input-group"><label>카테고리</label><select value={extractedData.category} onChange={(e) => setExtractedData({...extractedData, category: e.target.value})}>{categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></div>
                <button className="add-to-sheet-btn" onClick={handleAddToSheet} disabled={adding}>{adding ? '등록 중...' : '🚀 구글 시트 등록'}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {showLogin && (
        <div className="modal-overlay">
          <div className="login-modal">
            <h3>관리자 인증</h3>
            <input type="password" placeholder="비밀번호" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
            <div className="login-btns"><button onClick={handleLogin}>확인</button><button onClick={() => setShowLogin(false)} className="cancel">취소</button></div>
          </div>
        </div>
      )}

      <div className="ticker"><div className="ticker-content">🔥 실시간 급상승! 🚀 마트보다 저렴한 생필품 모음전! 🔥</div></div>

      <header className="hero-section">
        <h1 className="main-title">MONEY <span>큐레이션</span> 🛒</h1>
        <div className="search-box"><input type="text" placeholder="상품 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
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
            <div className="image-container"><img src={product.image} alt={product.name} className="product-image" />{product.isRocket && <div className="rocket-icon">🚀</div>}</div>
            <div className="info-container">
              <h3 className="product-name">{product.name}</h3>
              <p className="product-price">{product.price}</p>
              <div className="category-tag">{product.category}</div>
            </div>
          </div>
        ))}
      </main>

      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <img src={selectedProduct.image} alt="p" className="modal-image" />
            <div className="modal-info">
              <h2>{selectedProduct.name}</h2>
              <div className="modal-price">{selectedProduct.price}</div>
              <a href={selectedProduct.link} target="_blank" rel="noopener noreferrer" className="modal-buy-btn">쿠팡에서 구매하기</a>
            </div>
          </div>
        </div>
      )}

      <footer className="footer"><p>이 포스팅은 쿠팡 파트너스 활동의 일환으로, 일정액의 수수료를 제공받습니다.</p><p>© 2026 MONEY LAB. All Rights Reserved.</p></footer>
      {!isAdmin && <button className="admin-floating-btn" onClick={() => setShowLogin(true)}>⚙️</button>}
    </div>
  );
};

export default App;
