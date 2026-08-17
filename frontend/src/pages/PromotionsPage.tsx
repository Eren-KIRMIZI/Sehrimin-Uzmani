import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Promotion {
  id: number;
  category_id: number;
  category_name: string;
  budget: number;
  spent: number;
  daily_budget: number;
  bid_amount: number;
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
  priority_boost: number;
  is_featured: boolean;
  badge_text: string | null;
  start_date: string;
  end_date: string;
  ctr: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category_id: '',
    budget: '',
    daily_budget: '',
    bid_amount: '1.0',
    duration_days: '7',
    is_featured: false,
    badge_text: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [promoRes, catRes] = await Promise.all([
        api.get('/promotions/my'),
        api.get('/categories'),
      ]);
      setPromotions(promoRes.data);
      setCategories(catRes.data);
    } catch {
      toast.error('Veriler yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.category_id || !form.budget) {
      toast.error('Zorunlu alanlari doldurun');
      return;
    }
    try {
      await api.post('/promotions', null, {
        params: {
          category_id: parseInt(form.category_id),
          budget: parseFloat(form.budget),
          daily_budget: form.daily_budget ? parseFloat(form.daily_budget) : undefined,
          bid_amount: parseFloat(form.bid_amount),
          duration_days: parseInt(form.duration_days),
          is_featured: form.is_featured,
          badge_text: form.badge_text || undefined,
        },
      });
      toast.success('Tanitim baslatildi!');
      setShowForm(false);
      setForm({ category_id: '', budget: '', daily_budget: '', bid_amount: '1.0', duration_days: '7', is_featured: false, badge_text: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Hata olustu');
    }
  };

  const handlePause = async (id: number) => {
    try {
      await api.post(`/promotions/${id}/pause`);
      toast.success('Duraklatildi');
      fetchData();
    } catch { toast.error('Hata'); }
  };

  const handleResume = async (id: number) => {
    try {
      await api.post(`/promotions/${id}/resume`);
      toast.success('Devam ettirildi');
      fetchData();
    } catch { toast.error('Hata'); }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Tanitimi iptal etmek istediginize emin misiniz?')) return;
    try {
      await api.post(`/promotions/${id}/cancel`);
      toast.success('Iptal edildi');
      fetchData();
    } catch { toast.error('Hata'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tanitim Kampanyalari</h1>
            <p className="text-gray-500 mt-1">Gorunurlugunuzu artirarak daha fazla musteri kazanin</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all"
          >
            + Yeni Kampanya
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yeni Tanitim Kampanyasi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Kategori Secin</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Butce (TL)</label>
                <input
                  type="number"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  placeholder="1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gunluk Butce (TL, opsiyonel)</label>
                <input
                  type="number"
                  value={form.daily_budget}
                  onChange={(e) => setForm({ ...form, daily_budget: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  placeholder="Otomatik hesaplanir"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teklif Tutarı (TL)</label>
                <input
                  type="number"
                  value={form.bid_amount}
                  onChange={(e) => setForm({ ...form, bid_amount: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  step="0.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sure (gun)</label>
                <select
                  value={form.duration_days}
                  onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                >
                  <option value="3">3 Gun</option>
                  <option value="7">1 Hafta</option>
                  <option value="14">2 Hafta</option>
                  <option value="30">1 Ay</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">One Cikarilmis Uzman</span>
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rozet Yazisi (opsiyonel)</label>
                <input
                  type="text"
                  value={form.badge_text}
                  onChange={(e) => setForm({ ...form, badge_text: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  placeholder="Premium Uzman, En Iyi Fiyat, vb."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleCreate} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700">
                Kampanya Baslat
              </button>
              <button onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">
                Iptal
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Aktif Kampanya', value: promotions.filter((p) => p.status === 'active').length, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Toplam Goruntulenme', value: promotions.reduce((s, p) => s + p.impressions, 0).toLocaleString('tr-TR'), color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Toplam Tiklama', value: promotions.reduce((s, p) => s + p.clicks, 0).toLocaleString('tr-TR'), color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((item, i) => (
            <div key={i} className={`${item.bg} rounded-2xl p-5`}>
              <p className="text-sm text-gray-600 mb-1">{item.label}</p>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {promotions.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{p.category_name}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      p.status === 'active' ? 'bg-green-100 text-green-800' :
                      p.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {p.status === 'active' ? 'Aktif' : p.status === 'paused' ? 'Duraklatildi' : 'Iptal'}
                    </span>
                    {p.is_featured && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                        ONE CIKARILMIS
                      </span>
                    )}
                    {p.badge_text && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        {p.badge_text}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500">Butce</p>
                      <p className="text-sm font-semibold text-gray-900">{p.budget.toLocaleString('tr-TR')} TL</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Harcanan</p>
                      <p className="text-sm font-semibold text-red-600">{p.spent.toLocaleString('tr-TR')} TL</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Goruntulenme</p>
                      <p className="text-sm font-semibold text-blue-600">{p.impressions.toLocaleString('tr-TR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tiklama</p>
                      <p className="text-sm font-semibold text-purple-600">{p.clicks.toLocaleString('tr-TR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">CTR</p>
                      <p className="text-sm font-semibold text-green-600">{p.ctr.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((p.spent / p.budget) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Kalan: {(p.budget - p.spent).toLocaleString('tr-TR')} TL
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {p.status === 'active' ? (
                    <button onClick={() => handlePause(p.id)} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                      Duraklat
                    </button>
                  ) : p.status === 'paused' ? (
                    <button onClick={() => handleResume(p.id)} className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">
                      Devam
                    </button>
                  ) : null}
                  {p.status !== 'cancelled' && (
                    <button onClick={() => handleCancel(p.id)} className="px-3 py-1.5 text-xs border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                      Iptal
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {promotions.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200">
              Henuz tanitim kampanyaniz yok. Baslamak icin yeni bir kampanya olusturun.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
