import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Shield, MapPin, Clock, Phone, MessageCircle, Calendar, ChevronRight, Award, Briefcase } from 'lucide-react';
import api from '../services/api';
import type { ProviderProfile, Review } from '../types';

export default function ProviderProfilePage() {
  const { id } = useParams();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/providers/${id}`).then(res => setProvider(res.data)),
      api.get(`/reviews/provider/${id}`).then(res => setReviews(res.data)),
    ]).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl p-8 border border-border-light">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-gray-200 rounded-2xl skeleton" />
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-3 skeleton" />
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2 skeleton" />
              <div className="h-3 bg-gray-200 rounded w-1/5 skeleton" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-xl font-semibold">Uzman bulunamadı</h2>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Genel' },
    { id: 'services', label: 'Hizmetler' },
    { id: 'reviews', label: 'Yorumlar' },
    { id: 'about', label: 'Hakkında' },
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-white border-b border-border-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-24 h-24 bg-accent/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-accent font-bold text-3xl">
                {provider.user?.first_name?.[0]}{provider.user?.last_name?.[0]}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-primary">
                  {provider.business_name || `${provider.user?.first_name} ${provider.user?.last_name}`}
                </h1>
                {provider.verification_status !== 'NONE' && (
                  <span className="px-2 py-1 bg-accent/10 text-accent text-xs font-medium rounded-lg flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Doğrulanmış
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-warning fill-warning" />
                  <span className="font-semibold">{provider.rating}</span>
                  <span className="text-text-muted">({provider.review_count} yorum)</span>
                </div>
                <div className="flex items-center gap-1 text-text-muted">
                  <Briefcase className="w-4 h-4" />
                  {provider.completed_jobs} tamamlanan iş
                </div>
                <div className="flex items-center gap-1 text-text-muted">
                  <Clock className="w-4 h-4" />
                  Ort. {provider.response_time_minutes} dk yanıt
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm text-text-muted">
                <MapPin className="w-4 h-4" />
                {provider.locations?.map(l => l.city).filter(Boolean).join(', ') || 'Konum belirtilmemiş'}
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-3 bg-accent text-white font-medium rounded-xl hover:bg-accent-dark transition-colors flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Mesaj Gönder
              </button>
              <button className="px-6 py-3 border border-accent text-accent font-medium rounded-xl hover:bg-accent/5 transition-colors flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Randevu Al
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mt-8 border-b border-border-light -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-muted hover:text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {provider.bio && (
                <div className="bg-white rounded-2xl p-6 border border-border-light">
                  <h3 className="font-semibold text-primary mb-3">Hakkında</h3>
                  <p className="text-text-muted leading-relaxed">{provider.bio}</p>
                </div>
              )}

              {provider.services?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-border-light">
                  <h3 className="font-semibold text-primary mb-4">Hizmetler</h3>
                  <div className="space-y-3">
                    {provider.services.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 bg-bg rounded-xl">
                        <div>
                          <span className="font-medium text-sm">{s.service_name}</span>
                          {s.description && <p className="text-xs text-text-muted mt-1">{s.description}</p>}
                        </div>
                        {s.starting_price && (
                          <span className="text-accent font-semibold text-sm">₺{s.starting_price}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reviews.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-border-light">
                  <h3 className="font-semibold text-primary mb-4">Son Yorumlar</h3>
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map(review => (
                      <div key={review.id} className="pb-4 border-b border-border-light last:border-0 last:pb-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-bg rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">{review.customer?.first_name?.[0]}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium">{review.customer?.first_name} {review.customer?.last_name}</span>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-warning fill-warning' : 'text-gray-200'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.comment && <p className="text-sm text-text-muted">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-border-light">
                <h3 className="font-semibold text-primary mb-4">İstatistikler</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Tamamlanan iş</span>
                    <span className="font-medium">{provider.completed_jobs}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Yanıt süresi</span>
                    <span className="font-medium">~{provider.response_time_minutes} dk</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Deneyim</span>
                    <span className="font-medium">{provider.experience_years} yıl</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Doğrulama</span>
                    <span className="font-medium text-accent">{provider.verification_status}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-border-light">
                <h3 className="font-semibold text-primary mb-4">Bölgeler</h3>
                <div className="space-y-2">
                  {provider.locations?.map((loc, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-text-muted">
                      <MapPin className="w-3 h-3" />
                      {loc.district ? `${loc.district}, ${loc.city}` : loc.city}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="bg-white rounded-2xl p-6 border border-border-light">
            <h3 className="font-semibold text-primary mb-4">Tüm Hizmetler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {provider.services?.map(s => (
                <div key={s.id} className="p-4 bg-bg rounded-xl">
                  <h4 className="font-medium">{s.service_name}</h4>
                  {s.description && <p className="text-sm text-text-muted mt-1">{s.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    {s.starting_price && <span className="text-accent font-semibold">₺{s.starting_price}</span>}
                    <span className="text-text-muted">{s.pricing_type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="bg-white rounded-2xl p-6 border border-border-light">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border-light">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{provider.rating}</div>
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.round(provider.rating) ? 'text-warning fill-warning' : 'text-gray-200'}`} />
                  ))}
                </div>
                <div className="text-sm text-text-muted mt-1">{provider.review_count} yorum</div>
              </div>
            </div>

            <div className="space-y-6">
              {reviews.length === 0 ? (
                <p className="text-center text-text-muted py-8">Henüz yorum yapılmamış</p>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="pb-6 border-b border-border-light last:border-0">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-accent font-semibold text-sm">{review.customer?.first_name?.[0]}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{review.customer?.first_name} {review.customer?.last_name}</span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-warning fill-warning' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        </div>
                        {review.comment && <p className="text-sm text-text-muted mt-2">{review.comment}</p>}
                        <div className="flex gap-4 mt-2 text-xs text-text-muted">
                          {review.communication_rating && <span>İletişim: {review.communication_rating}</span>}
                          {review.quality_rating && <span>Kalite: {review.quality_rating}</span>}
                          {review.punctuality_rating && <span>Zamanlama: {review.punctuality_rating}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="bg-white rounded-2xl p-6 border border-border-light">
            <h3 className="font-semibold text-primary mb-4">Hakkında</h3>
            <p className="text-text-muted leading-relaxed">
              {provider.bio || 'Henüz bilgi eklenmemiş.'}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="p-4 bg-bg rounded-xl">
                <div className="text-sm text-text-muted">Deneyim</div>
                <div className="font-semibold">{provider.experience_years} yıl</div>
              </div>
              <div className="p-4 bg-bg rounded-xl">
                <div className="text-sm text-text-muted">Doğrulama Durumu</div>
                <div className="font-semibold text-accent">{provider.verification_status}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
