import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Upload, X, MapPin, Calendar, Clock, DollarSign, FileText } from 'lucide-react';
import api from '../services/api';
import { useLocationStore } from '../stores/locationStore';
import type { Category, City, District } from '../types';

const STEPS = [
  { id: 1, title: 'Hizmet Kategorisi', icon: '📋' },
  { id: 2, title: 'Hizmet Turu', icon: '🔧' },
  { id: 3, title: 'Ihtiyacinizi Aciklayin', icon: '💬' },
  { id: 4, title: 'Fotograf / Video', icon: '📸' },
  { id: 5, title: 'Konum', icon: '📍' },
  { id: 6, title: 'Tercih Edilen Tarih', icon: '📅' },
  { id: 7, title: 'Tercih Edilen Saat', icon: '🕐' },
  { id: 8, title: 'Butce', icon: '💰' },
  { id: 9, title: 'Ek Not', icon: '📝' },
  { id: 10, title: 'Onayla', icon: '✅' },
];

export default function ServiceRequestForm() {
  const navigate = useNavigate();
  const { selectedCity, setSelectedCity } = useLocationStore();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    category_id: null as number | null,
    category_name: '',
    subcategory_id: null as number | null,
    subcategory_name: '',
    service_id: null as number | null,
    service_name: '',
    title: '',
    description: '',
    city_id: null as number | null,
    city_name: '',
    district_id: null as number | null,
    district_name: '',
    preferred_date: '',
    preferred_time: '',
    budget_min: '',
    budget_max: '',
    notes: '',
    urgency: 'NORMAL',
  });

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data)).catch(() => {});
    api.get('/locations/cities').then(res => setCities(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.city_id) {
      api.get(`/locations/cities/${form.city_id}/districts`).then(res => setDistricts(res.data)).catch(() => {});
    }
  }, [form.city_id]);

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const selectedCategory = categories.find(c => c.id === form.category_id);
  const selectedSubcategory = selectedCategory?.subcategories?.find(s => s.id === form.subcategory_id);

  const canProceed = () => {
    switch (step) {
      case 1: return !!form.category_id;
      case 2: return !!form.subcategory_id || !!form.service_id;
      case 3: return !!form.title.trim();
      case 4: return true;
      case 5: return !!form.city_id;
      case 6: return !!form.preferred_date;
      case 7: return !!form.preferred_time;
      case 8: return true;
      case 9: return true;
      case 10: return true;
      default: return true;
    }
  };

  const submit = async () => {
    setLoading(true);
    try {
      await api.post('/requests', {
        category_id: form.category_id,
        subcategory_id: form.subcategory_id,
        service_id: form.service_id,
        title: form.title,
        description: form.description,
        city_id: form.city_id,
        district_id: form.district_id,
        preferred_date: form.preferred_date || undefined,
        preferred_time: form.preferred_time || undefined,
        budget_min: form.budget_min ? Number(form.budget_min) : undefined,
        budget_max: form.budget_max ? Number(form.budget_max) : undefined,
        urgency: form.urgency,
      });
      navigate('/dashboard');
    } catch (err) {
      alert('Talep olusturulamadi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-muted">Adim {step} / 10</span>
            <span className="text-sm font-medium text-accent">{Math.round((step / 10) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${(step / 10) * 100}%` }} />
          </div>
        </div>

        {/* Step Title */}
        <div className="mb-6">
          <div className="text-3xl mb-2">{STEPS[step - 1].icon}</div>
          <h2 className="text-2xl font-bold text-primary">{STEPS[step - 1].title}</h2>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl p-6 border border-border-light min-h-[300px]">
          {step === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { update('category_id', cat.id); update('category_name', cat.name); }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    form.category_id === cat.id
                      ? 'border-accent bg-accent/5 ring-2 ring-accent/20'
                      : 'border-border-light hover:border-accent'
                  }`}
                >
                  <div className="text-2xl mb-2">{cat.icon === 'home' ? '🏠' : cat.icon === 'settings' ? '🔧' : cat.icon === 'heart' ? '❤️' : '📋'}</div>
                  <div className="font-medium text-sm">{cat.name}</div>
                  <div className="text-xs text-text-muted mt-1">{cat.subcategories?.length || 0} alt kategori</div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && selectedCategory && (
            <div className="space-y-3">
              {selectedCategory.subcategories?.map(sub => (
                <div key={sub.id}>
                  <button
                    onClick={() => { update('subcategory_id', sub.id); update('subcategory_name', sub.name); update('service_id', null); update('service_name', ''); }}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      form.subcategory_id === sub.id
                        ? 'border-accent bg-accent/5'
                        : 'border-border-light hover:border-accent'
                    }`}
                  >
                    <div className="font-medium text-sm">{sub.name}</div>
                  </button>
                  {form.subcategory_id === sub.id && sub.services && (
                    <div className="ml-4 mt-2 space-y-2">
                      {sub.services.map(svc => (
                        <button
                          key={svc.id}
                          onClick={() => { update('service_id', svc.id); update('service_name', svc.name); }}
                          className={`w-full p-2.5 rounded-lg border text-left text-sm transition-all ${
                            form.service_id === svc.id
                              ? 'border-accent bg-accent/5 font-medium'
                              : 'border-border-light hover:border-accent'
                          }`}
                        >
                          {svc.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Baslik</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="Ornegin: Banyomda su kacagi var"
                  className="w-full px-4 py-3 bg-bg rounded-xl text-sm outline-none border border-border-light focus:border-accent"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Aciklama</label>
                <textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Ihtiyacinizi detayli aciklayin..."
                  rows={4}
                  className="w-full px-4 py-3 bg-bg rounded-xl text-sm outline-none border border-border-light focus:border-accent resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Oncelik</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'LOW', label: 'Dusuk', color: 'bg-gray-100' },
                    { value: 'NORMAL', label: 'Normal', color: 'bg-blue-50 text-blue-700' },
                    { value: 'HIGH', label: 'Yuksek', color: 'bg-orange-50 text-orange-700' },
                    { value: 'URGENT', label: 'Acil', color: 'bg-red-50 text-red-700' },
                  ].map(u => (
                    <button
                      key={u.value}
                      onClick={() => update('urgency', u.value)}
                      className={`p-2 rounded-xl text-sm font-medium transition-all ${
                        form.urgency === u.value ? `${u.color} ring-2 ring-accent/20` : 'bg-bg hover:bg-gray-100'
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-text-muted" />
              </div>
              <p className="text-sm text-text-muted mb-4">Ihtiyacinizi gosteren fotograflari veya videolari yukleyin (istege bagli)</p>
              <button className="px-6 py-2.5 bg-bg rounded-xl text-sm font-medium border border-border-light hover:border-accent transition-colors">
                Dosya Sec
              </button>
              <p className="text-xs text-text-muted mt-3">JPG, PNG, MP4 - Maks. 10MB</p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Sehir</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <select
                    value={form.city_id || ''}
                    onChange={(e) => {
                      const city = cities.find(c => c.id === Number(e.target.value));
                      update('city_id', city?.id || null);
                      update('city_name', city?.name || '');
                      update('district_id', null);
                      update('district_name', '');
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-bg rounded-xl text-sm outline-none border border-border-light"
                  >
                    <option value="">Sehir secin</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              {form.city_id && districts.length > 0 && (
                <div>
                  <label className="text-sm font-medium block mb-1.5">Ilce</label>
                  <select
                    value={form.district_id || ''}
                    onChange={(e) => {
                      const dist = districts.find(d => d.id === Number(e.target.value));
                      update('district_id', dist?.id || null);
                      update('district_name', dist?.name || '');
                    }}
                    className="w-full px-4 py-3 bg-bg rounded-xl text-sm outline-none border border-border-light"
                  >
                    <option value="">Ilce secin (opsiyonel)</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <label className="text-sm font-medium block mb-1.5">Hangi tarihte hizmet istiyorsunuz?</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="date"
                  value={form.preferred_date}
                  onChange={(e) => update('preferred_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-3 bg-bg rounded-xl text-sm outline-none border border-border-light"
                />
              </div>
              <div className="flex gap-2">
                {['Bugun', 'Yarin', 'Bu Hafta'].map(label => (
                  <button
                    key={label}
                    onClick={() => {
                      const d = new Date();
                      if (label === 'Yarin') d.setDate(d.getDate() + 1);
                      if (label === 'Bu Hafta') d.setDate(d.getDate() + 3);
                      update('preferred_date', d.toISOString().split('T')[0]);
                    }}
                    className="px-4 py-2 bg-bg rounded-lg text-sm font-medium border border-border-light hover:border-accent transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <label className="text-sm font-medium block mb-1.5">Hangi saatlerde musaitsiniz?</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  '08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00', '14:00 - 16:00',
                  '16:00 - 18:00', '18:00 - 20:00', 'Esnek / Fark etmez'
                ].map(time => (
                  <button
                    key={time}
                    onClick={() => update('preferred_time', time)}
                    className={`p-3 rounded-xl border text-sm transition-all ${
                      form.preferred_time === time
                        ? 'border-accent bg-accent/5 font-medium'
                        : 'border-border-light hover:border-accent'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4">
              <label className="text-sm font-medium block mb-1.5">Butcenizi belirtin (istege bagli)</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-text-muted block mb-1">Minimum (TL)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="number"
                      value={form.budget_min}
                      onChange={(e) => update('budget_min', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-4 py-3 bg-bg rounded-xl text-sm outline-none border border-border-light"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted block mb-1">Maksimum (TL)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="number"
                      value={form.budget_max}
                      onChange={(e) => update('budget_max', e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-4 py-3 bg-bg rounded-xl text-sm outline-none border border-border-light"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-text-muted">Butce belirtmemeniz de sorun degildir. Uzmanlar zaten tekliflerini iletecektir.</p>
            </div>
          )}

          {step === 9 && (
            <div className="space-y-4">
              <label className="text-sm font-medium block mb-1.5">Eklemek istediginiz notlar</label>
              <textarea
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Ornegin: Kapida zil calmayin, kedi var dikkat edin, vb."
                rows={4}
                className="w-full px-4 py-3 bg-bg rounded-xl text-sm outline-none border border-border-light focus:border-accent resize-none"
              />
            </div>
          )}

          {step === 10 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-primary mb-4">Talep Ozeti</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-bg rounded-xl">
                  <span className="text-sm text-text-muted">Kategori</span>
                  <span className="text-sm font-medium">{form.category_name}</span>
                </div>
                {form.subcategory_name && (
                  <div className="flex justify-between p-3 bg-bg rounded-xl">
                    <span className="text-sm text-text-muted">Alt Kategori</span>
                    <span className="text-sm font-medium">{form.subcategory_name}</span>
                  </div>
                )}
                {form.service_name && (
                  <div className="flex justify-between p-3 bg-bg rounded-xl">
                    <span className="text-sm text-text-muted">Hizmet</span>
                    <span className="text-sm font-medium">{form.service_name}</span>
                  </div>
                )}
                <div className="p-3 bg-bg rounded-xl">
                  <span className="text-sm text-text-muted block mb-1">Baslik</span>
                  <span className="text-sm font-medium">{form.title}</span>
                </div>
                {form.description && (
                  <div className="p-3 bg-bg rounded-xl">
                    <span className="text-sm text-text-muted block mb-1">Aciklama</span>
                    <span className="text-sm">{form.description}</span>
                  </div>
                )}
                <div className="flex justify-between p-3 bg-bg rounded-xl">
                  <span className="text-sm text-text-muted">Konum</span>
                  <span className="text-sm font-medium">{form.city_name}{form.district_name ? `, ${form.district_name}` : ''}</span>
                </div>
                <div className="flex justify-between p-3 bg-bg rounded-xl">
                  <span className="text-sm text-text-muted">Tarih</span>
                  <span className="text-sm font-medium">{form.preferred_date || 'Belirtilmedi'}</span>
                </div>
                <div className="flex justify-between p-3 bg-bg rounded-xl">
                  <span className="text-sm text-text-muted">Saat</span>
                  <span className="text-sm font-medium">{form.preferred_time || 'Belirtilmedi'}</span>
                </div>
                {(form.budget_min || form.budget_max) && (
                  <div className="flex justify-between p-3 bg-bg rounded-xl">
                    <span className="text-sm text-text-muted">Butce</span>
                    <span className="text-sm font-medium">
                      {form.budget_min ? `₺${form.budget_min}` : '—'} - {form.budget_max ? `₺${form.budget_max}` : '—'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between p-3 bg-bg rounded-xl">
                  <span className="text-sm text-text-muted">Oncelik</span>
                  <span className="text-sm font-medium">{form.urgency}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border border-border-light hover:border-accent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Geri
          </button>

          {step < 10 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-5 py-3 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-dark transition-colors disabled:opacity-50"
            >
              Ileri <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-success text-white rounded-xl text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> {loading ? 'Gonderiliyor...' : 'Talebi Yayinla'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
