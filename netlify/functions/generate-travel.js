const https = require('https');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { destination, duration } = JSON.parse(event.body);
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'API 키가 설정되지 않았습니다. Netlify 환경변수에 GOOGLE_API_KEY를 추가해주세요.' }) };
    }

    const prompt = `당신은 여행 가이드입니다. 다음 여행 정보로 JSON 형식의 여행 일정을 만들어주세요.

여행지: ${destination}
기간: ${duration}

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.

{
  "destination": "여행지",
  "duration": "기간",
  "summary": "여행지 소개 2-3문장",
  "attractions": [
    {"name": "관광지명", "description": "설명", "category": "카테고리", "address": "주소", "duration": "소요시간", "price": "입장료", "tips": "팁"}
  ],
  "accommodations": [
    {"name": "숙소명", "type": "호텔", "priceRange": "₩₩", "priceEstimate": "1박 가격", "address": "주소", "description": "설명", "amenities": ["편의시설"]}
  ],
  "restaurants": [
    {"name": "식당명", "cuisine": "음식종류", "specialty": "대표메뉴", "priceRange": "₩₩", "priceEstimate": "1인 가격", "address": "주소", "description": "설명"}
  ],
  "dailyItinerary": [
    {"day": 1, "theme": "테마", "schedule": [{"time": "09:00", "activity": "활동", "location": "장소"}]}
  ],
  "budgetSummary": {"accommodation": "숙박비", "food": "식비", "attractions": "관광비", "transport": "교통비", "total": "총액"},
  "localTips": ["팁1", "팁2"],
  "packingList": ["준비물1", "준비물2"]
}

관광지 4-5개, 숙소 2개, 식당 4개, 일정은 기간에 맞게 작성해주세요.`;

    const requestBody = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
    });

    const response = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
      });
      req.on('error', reject);
      req.write(requestBody);
      req.end();
    });

    if (response.statusCode !== 200) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'AI API 오류' }) };
    }

    const aiResponse = JSON.parse(response.body);
    const content = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'AI 응답 없음' }) };
    }

    let cleanedContent = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const jsonStart = cleanedContent.indexOf('{');
    const jsonEnd = cleanedContent.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanedContent = cleanedContent.substring(jsonStart, jsonEnd + 1);
    }

    const travelPlan = JSON.parse(cleanedContent);
    return { statusCode: 200, headers, body: JSON.stringify(travelPlan) };

  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
