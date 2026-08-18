import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronRight, Star, Shield, Zap, ArrowRight } from 'lucide-react';
import { useCategories, useCities, useProviderSearch } from '../hooks/useQueries';
import { useLocationStore } from '../stores/locationStore';

const CATEGORY_ICONS: Record<string, string> = {
  'home': '🏠', 'settings': '🔧', 'heart': '❤️', 'book': '📚',
  'users': '👶', 'paw': '🐕', 'car': '🚗', 'truck': '📦',
  'briefcase': '💼', 'building': '🏢', 'calendar': '🎉',
  'monitor': '💻', 'scissors': '💇',
};

export default function HomePage() {
  const navigate = useNavigate();
  const { selectedCity, setSelectedCity } = useLocationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();
  const { data: cities = [] } = useCities();
  const { data: searchData } = useProviderSearch({ limit: 6, sort: 'rating' });
  const featuredProviders = searchData?.items || [];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCity) params.set('city_id', String(selectedCity.id));
    navigate(`/search?${params.toString()}`);
  };

  const handleAISearch = (value: string) => {
    setSearchQuery(value);
    if (value.length > 10) {
      setAiSuggestion('İhtiyacınızı analiz ediyoruz...');
      setTimeout(() => setAiSuggestion('Kategoriniz algılandı. Uzmanları arıyoruz...'), 1000);
    } else {
      setAiSuggestion(null);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-primary/5 to-bg overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-primary leading-tight tracking-tight">
              Şehrindeki doğru
              <br />
              <span className="text-accent">uzmanı</span> bul.
            </h1>
            <p className="mt-6 text-lg text-text-muted max-w-xl mx-auto leading-relaxed">
              Evinden sağlığına, eğitimden otomotive kadar ihtiyacın olan hizmeti
              şehrindeki güvenilir uzmanlarla buluşturuyoruz.
            </p>

            {/* AI Search Box */}
            <div className="mt-10 max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl border border-border-light p-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex items-center gap-3 px-4">
                    <Search className="w-5 h-5 text-text-muted flex-shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleAISearch(e.target.value)}
                      placeholder='Ne ihtiyacın var? Örn. "Kombim çalışmıyor"'
                      className="w-full py-3 text-sm outline-none bg-transparent"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="px-6 py-3 bg-accent text-white font-medium rounded-xl hover:bg-accent-dark transition-colors flex items-center justify-center gap-2"
                  >
                    Uzman Bul <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {aiSuggestion && (
                  <div className="px-4 pb-3 fade-in">
                    <div className="flex items-center gap-2 text-sm text-accent">
                      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      {aiSuggestion}
                    </div>
                  </div>
                )}
              </div>

              {/* City Selector */}
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-text-muted">
                <MapPin className="w-4 h-4" />
                <select
                  value={selectedCity?.id || ''}
                  onChange={(e) => {
                    const city = cities.find(c => c.id === Number(e.target.value));
                    setSelectedCity(city ? { id: city.id, name: city.name } : null);
                  }}
                  className="bg-transparent outline-none cursor-pointer font-medium text-primary"
                >
                  <option value="">Konum seç</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
                {selectedCity && (
                  <span className="text-accent font-medium">
                    {selectedCity.name} aktif
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-primary mb-2">Bugün neye ihtiyacın var?</h2>
          <p className="text-text-muted mb-8">Hızlıca kategorini seç ve uzmanlarını bul</p>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="flex-shrink-0 w-40 p-5 bg-white rounded-2xl border border-border-light hover:border-accent hover:shadow-lg transition-all duration-300 group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                  {CATEGORY_ICONS[cat.icon || ''] || '📋'}
                </div>
                <h3 className="font-semibold text-sm text-primary">{cat.name}</h3>
                <div className="mt-2 text-xs text-text-muted">
                  {cat.subcategories?.length || 0} alt kategori
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Providers */}
      {featuredProviders.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-primary">En çok tercih edilen uzmanlar</h2>
                <p className="text-text-muted mt-1">{selectedCity ? `${selectedCity.name}'de` : 'Türkiye genelinde'} en yüksek puanlı uzmanlar</p>
              </div>
              <Link to="/search" className="text-accent font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all">
                Tümünü Gör <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProviders.map((provider) => (
                <Link
                  key={provider.id}
                  to={`/provider/${provider.id}`}
                  className="p-6 bg-bg rounded-2xl border border-border-light hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-accent font-bold text-lg">
                        {provider.user?.first_name?.[0]}{provider.user?.last_name?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-primary truncate">
                          {provider.business_name || `${provider.user?.first_name} ${provider.user?.last_name}`}
                        </h3>
                        {provider.verification_status !== 'NONE' && (
                          <Shield className="w-4 h-4 text-accent flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-warning fill-warning" />
                          <span className="text-sm font-medium">{provider.rating}</span>
                        </div>
                        <span className="text-text-muted text-sm">· {provider.review_count} yorum</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-sm text-text-muted">
                        <MapPin className="w-3 h-3" />
                        {provider.locations?.[0]?.city || 'Konum belirtilmemiş'}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-primary text-center mb-12">Nasıl Çalışır?</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'İhtiyacını Anlat', desc: 'Hizmet kategorisini seç veya ne istediğini yaz.', icon: '💬' },
              { step: '2', title: 'Uzmanları Keşfet', desc: 'Yakınındaki uzmanları puan ve yorumlara göre karşılaştır.', icon: '🔍' },
              { step: '3', title: 'Teklif Al', desc: 'Uygun uzmanlardan teklifler al ve karşılaştır.', icon: '📋' },
              { step: '4', title: 'Hizmeti Tamamla', desc: 'İşini yaptır, değerlendir ve güvenle öde.', icon: '⭐' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 mx-auto bg-accent/10 rounded-2xl flex items-center justify-center text-3xl mb-4">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-accent mb-2">ADIM {item.step}</div>
                <h3 className="font-semibold text-primary mb-2">{item.title}</h3>
                <p className="text-sm text-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Urgent Services */}
      <section className="py-16 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Şimdi bir uzmana mı ihtiyacın var?</h2>
          <p className="text-gray-400 mb-8">Yakınındaki müsait uzmanları saniyeler içinde bul</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Çilingir', 'Tesisatçı', 'Elektrikçi', 'Çekici', 'Camcı', 'Oto Tamir'].map((service) => (
              <Link
                key={service}
                to={`/search?q=${service}`}
                className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-accent transition-colors font-medium"
              >
                <Zap className="w-4 h-4 inline mr-2" />
                {service}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Become a Provider */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-accent/5 to-accent/10 rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-primary mb-4">
                Yeteneğini şehrindeki müşterilere dönüştür.
              </h2>
              <p className="text-text-muted mb-6 leading-relaxed">
                Hizmetlerini yayınla, yeni müşteriler bul ve işlerini tek yerden yönet.
              </p>
              <div className="flex gap-6 mb-8">
                {['Profilini oluştur', 'Hizmetlerini yayınla', 'Müşterilerden teklif al'].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="text-primary font-medium">{step}</span>
                  </div>
                ))}
              </div>
              <Link to="/register?role=PROVIDER" className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-medium rounded-xl hover:bg-accent-dark transition-colors">
                Uzman olarak başla <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="w-72 h-52 bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 bg-accent/10 rounded-lg mb-3" />
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-2 bg-gray-100 rounded w-1/2" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1 h-8 bg-accent/10 rounded-lg" />
                <div className="flex-1 h-8 bg-gray-100 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-primary text-center mb-8">Şehirlerde Hizmet Veriyoruz</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {cities.slice(0, 30).map((city) => (
              <Link
                key={city.id}
                to={`/city/${city.name.toLowerCase()}`}
                className="px-4 py-2 bg-bg rounded-lg text-sm font-medium text-primary hover:bg-accent hover:text-white transition-colors"
              >
                {city.name}
              </Link>
            ))}
            {cities.length > 30 && (
              <Link to="/cities" className="px-4 py-2 text-accent text-sm font-medium">
                +{cities.length - 30} şehir daha
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
