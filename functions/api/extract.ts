export async function onRequestPost(context) {
  try {
    const { url } = await context.request.json();
    if (!url) return new Response('URL missing', { status: 400 });

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    const html = await response.text();

    // 메타데이터(OG Tag) 추출
    const titleMatch = html.match(/<meta property="og:title" content="(.*?)"/);
    const imageMatch = html.match(/<meta property="og:image" content="(.*?)"/);
    
    // 가격 추출 (쿠팡은 가격이 복잡하므로 간단한 패턴 매칭 시도)
    const priceMatch = html.match(/<span class="price-value">(.*?)<\/span>/) || html.match(/"priceValue":"(.*?)"/);

    return new Response(JSON.stringify({
      title: titleMatch ? titleMatch[1].replace('쿠팡! | ', '') : '상품명을 찾을 수 없습니다',
      image: imageMatch ? imageMatch[1] : '',
      price: priceMatch ? priceMatch[1] + '원' : '가격 정보 없음'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
