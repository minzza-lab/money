export async function onRequestPost(context) {
  try {
    const { url } = await context.request.json();
    if (!url) return new Response('URL missing', { status: 400 });

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      }
    });

    const html = await response.text();

    // 1. 상품명 추출 (다양한 패턴 시도)
    const title = 
      html.match(/<meta property="og:title" content="(.*?)"/)?.[1]?.replace('쿠팡! | ', '') ||
      html.match(/<h2 class="prod-buy-header__title">(.*?)<\/h2>/)?.[1] ||
      html.match(/"title":"(.*?)"/)?.[1] ||
      '상품명을 찾을 수 없습니다';

    // 2. 이미지 추출
    const image = 
      html.match(/<meta property="og:image" content="(.*?)"/)?.[1] ||
      html.match(/<img class="prod-image__detail" src="(.*?)"/)?.[1] ||
      html.match(/"image":"(.*?)"/)?.[1] ||
      '';

    // 3. 가격 추출 (숫자만 뽑아내기 위해 여러 패턴 사용)
    let price = '가격 정보 없음';
    const pricePatterns = [
      /<span class="total-price">.*?<strong>(.*?)<\/strong>/,
      /<span class="price-value">(.*?)<\/span>/,
      /<strong class="price-value">(.*?)<\/strong>/,
      /"priceValue":"(.*?)"/,
      /"price":(.*?),/
    ];

    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match) {
        price = match[1].replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '원';
        break;
      }
    }

    return new Response(JSON.stringify({
      title: title.trim(),
      image: image.startsWith('//') ? 'https:' + image : image,
      price: price
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
