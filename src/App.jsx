import React, { useState } from 'react';

export default function TravelGuideApp() {
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [travelPlan, setTravelPlan] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('attractions');

  const generateTravelPlan = async () => {
    if (!destination.trim() || !duration.trim()) {
      setError('여행지와 기간을 모두 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    setTravelPlan(null);
    try {
      const response = await fetch('/.netlify/functions/generate-travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: destination.trim(), duration: duration.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '여행 일정 생성 실패');
      setTravelPlan(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openMap = (address, name) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            🌍 AI 여행 가이드
          </h1>
          <p className="text-sm text-gray-500">전 세계 어디든 맞춤 여행 플래너</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="어디로? (예: 도쿄, 파리, 뉴욕)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              onKeyPress={(e) => e.key === 'Enter' && generateTravelPlan()}
            />
            <input
              type="text"
              placeholder="며칠? (예: 2박 3일)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              onKeyPress={(e) => e.key === 'Enter' && generateTravelPlan()}
            />
          </div>
          <button
            onClick={generateTravelPlan}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold text-lg disabled:opacity-50"
          >
            {loading ? '✨ AI가 여행 일정을 만들고 있어요...' : '✨ 여행 일정 생성하기'}
          </button>
          {error && <p className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl">{error}</p>}
        </div>

        {travelPlan && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white">
              <h2 className="text-3xl font-bold">{travelPlan.destination}</h2>
              <p className="opacity-80">{travelPlan.duration}</p>
              <p className="mt-2">{travelPlan.summary}</p>
            </div>

            {travelPlan.budgetSummary && (
              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="font-bold mb-2">💰 예상 비용</h3>
                <div className="grid grid-cols-5 gap-2 text-center text-sm">
                  <div className="bg-blue-50 p-2 rounded"><p className="text-gray-500">숙박</p><p className="font-bold text-blue-600">{travelPlan.budgetSummary.accommodation}</p></div>
                  <div className="bg-orange-50 p-2 rounded"><p className="text-gray-500">식비</p><p className="font-bold text-orange-600">{travelPlan.budgetSummary.food}</p></div>
                  <div className="bg-purple-50 p-2 rounded"><p className="text-gray-500">관광</p><p className="font-bold text-purple-600">{travelPlan.budgetSummary.attractions}</p></div>
                  <div className="bg-gray-100 p-2 rounded"><p className="text-gray-500">교통</p><p className="font-bold text-gray-600">{travelPlan.budgetSummary.transport}</p></div>
                  <div className="bg-green-50 p-2 rounded"><p className="text-gray-500">총합</p><p className="font-bold text-green-600">{travelPlan.budgetSummary.total}</p></div>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-center flex-wrap">
              {['attractions', 'accommodations', 'restaurants', 'itinerary', 'tips'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium ${activeTab === tab ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}>
                  {tab === 'attractions' ? '🏛 관광지' : tab === 'accommodations' ? '🏨 숙소' : tab === 'restaurants' ? '🍽 맛집' : tab === 'itinerary' ? '📅 일정' : '💡 팁'}
                </button>
              ))}
            </div>

            {activeTab === 'attractions' && travelPlan.attractions?.map((place, i) => (
              <div key={i} className="bg-white rounded-xl shadow p-4">
                <div className="flex justify-between"><span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">{place.category}</span><span className="text-sm text-gray-500">{place.duration}</span></div>
                <h3 className="text-lg font-bold mt-1">{place.name}</h3>
                <p className="text-sm text-gray-600 my-2">{place.description}</p>
                <p className="text-xs text-gray-400">📍 {place.address}</p>
                {place.price && <p className="text-xs text-green-600">💰 {place.price}</p>}
                {place.tips && <p className="text-xs bg-yellow-50 text-yellow-700 p-2 rounded mt-2">💡 {place.tips}</p>}
                <button onClick={() => openMap(place.address, place.name)} className="mt-2 w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-sm">🗺 지도 보기</button>
              </div>
            ))}

            {activeTab === 'accommodations' && travelPlan.accommodations?.map((acc, i) => (
              <div key={i} className="bg-white rounded-xl shadow p-4">
                <div className="flex justify-between"><span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">{acc.type}</span><span className="text-green-600 font-semibold">{acc.priceRange}</span></div>
                <h3 className="text-lg font-bold mt-1">{acc.name}</h3>
                {acc.priceEstimate && <p className="text-sm text-green-600">💰 {acc.priceEstimate}/박</p>}
                <p className="text-sm text-gray-600 my-2">{acc.description}</p>
                {acc.amenities && <div className="flex flex-wrap gap-1">{acc.amenities.map((a,j) => <span key={j} className="text-xs bg-gray-100 px-2 py-1 rounded">{a}</span>)}</div>}
                <button onClick={() => openMap(acc.address, acc.name)} className="mt-2 w-full py-2 bg-purple-50 text-purple-600 rounded-lg text-sm">🗺 지도 보기</button>
              </div>
            ))}

            {activeTab === 'restaurants' && travelPlan.restaurants?.map((rest, i) => (
              <div key={i} className="bg-white rounded-xl shadow p-4">
                <div className="flex justify-between"><span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">{rest.cuisine}</span><span className="text-green-600 font-semibold">{rest.priceRange}</span></div>
                <h3 className="text-lg font-bold mt-1">{rest.name}</h3>
                <p className="text-orange-500 text-sm">🍽 {rest.specialty}</p>
                {rest.priceEstimate && <p className="text-sm text-green-600">💰 {rest.priceEstimate}/인</p>}
                <p className="text-sm text-gray-600 my-2">{rest.description}</p>
                <button onClick={() => openMap(rest.address, rest.name)} className="mt-2 w-full py-2 bg-orange-50 text-orange-600 rounded-lg text-sm">🗺 지도 보기</button>
              </div>
            ))}

            {activeTab === 'itinerary' && travelPlan.dailyItinerary?.map((day, i) => (
              <div key={i} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">D{day.day}</div>
                  <div><h3 className="font-bold">Day {day.day}</h3><p className="text-sm text-gray-500">{day.theme}</p></div>
                </div>
                {day.schedule?.map((item, j) => (
                  <div key={j} className="ml-6 border-l-2 border-gray-200 pl-4 pb-3">
                    <p className="text-blue-600 font-semibold">{item.time}</p>
                    <p className="font-medium">{item.activity}</p>
                    <p className="text-sm text-gray-500">{item.location}</p>
                  </div>
                ))}
              </div>
            ))}

            {activeTab === 'tips' && (
              <div className="grid md:grid-cols-2 gap-4">
                {travelPlan.localTips && (
                  <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="font-bold mb-2">💡 현지 팁</h3>
                    <ul className="space-y-1">{travelPlan.localTips.map((tip, i) => <li key={i} className="text-sm text-gray-600">✓ {tip}</li>)}</ul>
                  </div>
                )}
                {travelPlan.packingList && (
                  <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="font-bold mb-2">🎒 준비물</h3>
                    <ul className="space-y-1">{travelPlan.packingList.map((item, i) => <li key={i} className="text-sm text-gray-600">☐ {item}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!travelPlan && !loading && (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🌍</div>
            <h3 className="text-xl font-bold mb-2">전 세계 어디든!</h3>
            <p className="text-gray-600 mb-4">도시 이름과 기간만 입력하면<br/>AI가 완벽한 여행을 설계해드려요</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['🗼 도쿄', '🗽 뉴욕', '🗿 로마', '🏰 런던', '🎭 파리', '🏝 발리'].map(c => (
                <span key={c} className="px-3 py-1 bg-gray-100 rounded-full text-sm">{c}</span>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-gray-400 text-sm">
        Powered by Google Gemini AI
      </footer>
    </div>
  );
}
