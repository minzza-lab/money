export async function onRequestPost(context) {
  try {
    const { url } = await context.request.json();
    if (!url) return new Response('URL missing', { status: 400 });

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    const html = await response.text();

    // 제목 추출 우선순위 조정 (진짜 상품명 태그 위주)
    const title = 
      html.match(/<h2 class="prod-buy-header__title">(.*?)<\/h2>/)?.[1] ||
      html.match(/<meta property="og:title" content="(.*?)"/)?.[1]?.replace('쿠팡! | ', '') ||
      html.match(/<title>(.*?)<\/title>/)?.[1]?.replace('쿠팡! | ', '') ||
      '상품명을 찾을 수 없습니다';

    // 이미지 및 가격 추출
    const image = html.match(/<meta property="og:image" content="(.*?)"/)?.[1] || '';
    
    let price = '가격 확인 필요';
    const priceMatch = html.match(/<span class="total-price">.*?<strong>(.*?)<\/strong>/) || html.match(/<span class="price-value">(.*?)<\/span>/);
    if (priceMatch) {
      price = priceMatch[1].replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '원';
    }

    return new Response(JSON.stringify({
      title: title.trim(),
      image: image.startsWith('//') ? 'https:' + image : image,
      price: price
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
