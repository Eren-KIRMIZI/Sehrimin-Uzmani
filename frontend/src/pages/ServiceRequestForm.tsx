import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Upload, MapPin, Calendar, DollarSign, FileText, Eye, Send } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useCategories, useCities, useDistricts } from '../hooks/useQueries';
import { requestsApi } from '../services';
import { AIRequestAssistant } from '../components/ai/AIRequestAssistant';
import { toastApiError } from '../stores/toastStore';
import type { AIAnalysis } from '../types';

const STEPS = [
  { num: 1, title: 'Kategori' },
  { num: 2, title: 'Hizmet Türü' },
  { num: 3, title: 'Açıklama' },
  { num: 4, title: 'Konum' },
  { num: 5, title: 'Tarih & Saat' },
  { num: 6, title: 'Bütçe' },
  { num: 7, title: 'Ek Notlar' },
  { num: 8, title: 'Aciliyet' },
  { num: 9, title: 'Önizleme' },
  { num: 10, title: 'Yayınla' },
];

const ServiceRequestForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    category_id: undefined as number | undefined,
    subcategory_id: undefined as number | undefined,
    service_id: undefined as number | undefined,
    title: '',
    description: '',
    city_id: undefined as number | undefined,
    district_id: undefined as number | undefined,
    preferred_date: '',
    preferred_time: '',
    budget_min: '',
    budget_max: '',
    notes: '',
    urgency: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY',
  });

  const { data: categories } = useCategories();
  const { data: cities } = useCities();
  const { data: districts } = useDistricts(form.city_id);

  const selectedCategory = categories?.find(c => c.id === form.category_id);
  const selectedSubcategory = selectedCategory?.subcategories?.find(s => s.id === form.subcategory_id);

  const setField = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  const handleAIAnalysisComplete = (data: AIAnalysis) => {
    // 1. Kategoriyi bul
    let catId: number | undefined, subId: number | undefined;
    if (data.category_slug && categories) {
      const cat = categories.find(c => c.slug === data.category_slug);
      if (cat) {
        catId = cat.id;
        // Alt kategoriyi bul (basit string eşleşmesi ile)
        if (data.subcategory && cat.subcategories) {
          const sub = cat.subcategories.find(s => 
            s.name.toLowerCase().includes(data.subcategory!.toLowerCase()) || 
            s.slug.includes(data.subcategory!.toLowerCase())
          );
          if (sub) subId = sub.id;
        }
      }
    }

    // 2. Şehri bul
    let cityId: number | undefined, distId: number | undefined;
    if (data.location?.city && cities) {
      const city = cities.find(c => 
        c.name.toLowerCase() === data.location!.city!.toLowerCase() ||
        c.name.toLowerCase().includes(data.location!.city!.toLowerCase())
      );
      if (city) {
        cityId = city.id;
      }
    }

    setForm(prev => ({
      ...prev,
      category_id: catId || prev.category_id,
      subcategory_id: subId || prev.subcategory_id,
      city_id: cityId || prev.city_id,
      title: data.problem_description ? (data.problem_description.length > 50 ? data.problem_description.substring(0, 50) + '...' : data.problem_description) : (data.original_text || '').substring(0, 50),
      description: data.original_text || prev.description,
      urgency: data.urgency ? data.urgency.toUpperCase() as any : prev.urgency,
      preferred_date: data.preferred_time || prev.preferred_date,
      budget_min: data.budget?.min?.toString() || prev.budget_min,
      budget_max: data.budget?.max?.toString() || prev.budget_max,
    }));

    // Otomatik olarak 9. adıma (Önizleme) atla veya eksik varsa oraya git
    if (catId && cityId) {
      setStep(9);
    } else if (catId) {
      setStep(4);
    } else {
      setStep(1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!form.category_id;
      // Alt kategorisi olmayan kategorilerde adım 2 otomatik geçilir
      case 2: return !selectedCategory?.subcategories?.length || !!form.subcategory_id;
      case 3: return form.title.length >= 5 && form.description.length >= 10;
      case 4: return !!form.city_id;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await requestsApi.create({
        ...form,
        budget_min: form.budget_min ? Number(form.budget_min) : undefined,
        budget_max: form.budget_max ? Number(form.budget_max) : undefined,
      });
      setSuccess(true);
    } catch (e: any) {
      toastApiError(e, 'Talep oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <Check size={36} style={{ color: 'var(--color-success)' }} />
          </div>
          <h2 style={{ fontWeight: 800, marginBottom: 12 }}>Talebiniz Yayınlandı!</h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 400, margin: '0 auto 32px' }}>
            Uzmanlar talebinizi görecek ve kısa süre içinde teklif gönderecek.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Panelime Git</button>
            <button className="btn btn-outline" onClick={() => navigate('/search')}>Uzman Ara</button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container" style={{ padding: '40px 24px', maxWidth: 720 }}>
        <h1 style={{ fontWeight: 800, marginBottom: 8, fontSize: '1.6rem' }}>Hizmet Talebi Oluştur</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 36 }}>
          Uzmanlardan teklif almak için talebinizi oluşturun
        </p>

        {step < 9 && (
          <div className="mb-8">
            <AIRequestAssistant onAnalysisComplete={handleAIAnalysisComplete} />
          </div>
        )}


        {/* Progress steps */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 40, overflowX: 'auto', paddingBottom: 8 }}>
          {STEPS.map(s => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.8rem', border: '2px solid',
                ...(step === s.num
                  ? { background: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' }
                  : step > s.num
                  ? { background: 'var(--color-success)', color: 'white', borderColor: 'var(--color-success)' }
                  : { background: 'transparent', color: 'var(--color-text-dim)', borderColor: 'var(--color-border)' })
              }}>
                {step > s.num ? <Check size={14} /> : s.num}
              </div>
              {s.num < STEPS.length && (
                <div style={{ width: 24, height: 2, background: step > s.num ? 'var(--color-success)' : 'var(--color-border)', flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="card animate-fade-in" key={step}>
          <h2 style={{ fontWeight: 700, marginBottom: 20, fontSize: '1.2rem' }}>
            Adım {step}: {STEPS[step - 1].title}
          </h2>

          {step === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              {categories?.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setField('category_id', cat.id)}
                  style={{
                    padding: 16, borderRadius: 12, cursor: 'pointer', border: '2px solid',
                    borderColor: form.category_id === cat.id ? 'var(--color-primary)' : 'var(--color-border)',
                    background: form.category_id === cat.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--color-surface-2)',
                    textAlign: 'center', transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>
                    {cat.icon || '🔧'}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text)' }}>{cat.name}</div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && selectedCategory && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedCategory.subcategories?.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setField('subcategory_id', sub.id)}
                  style={{
                    padding: 14, borderRadius: 10, cursor: 'pointer', border: '2px solid',
                    borderColor: form.subcategory_id === sub.id ? 'var(--color-primary)' : 'var(--color-border)',
                    background: form.subcategory_id === sub.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--color-surface-2)',
                    textAlign: 'left', fontWeight: 600, color: 'var(--color-text)', fontSize: '0.9rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>
                  Talep Başlığı *
                </label>
                <input
                  className="input"
                  value={form.title}
                  onChange={e => setField('title', e.target.value)}
                  placeholder="Örn: Evimin salonunda elektrik tesisatı sorunu"
                  maxLength={200}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>
                  Detaylı Açıklama *
                </label>
                <textarea
                  className="input"
                  value={form.description}
                  onChange={e => setField('description', e.target.value)}
                  placeholder="İhtiyacınızı detaylı olarak açıklayın..."
                  rows={5}
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>Şehir *</label>
                <select className="input" value={form.city_id || ''} onChange={e => setField('city_id', e.target.value ? Number(e.target.value) : undefined)}>
                  <option value="">Şehir seçin</option>
                  {cities?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {form.city_id && (
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>İlçe</label>
                  <select className="input" value={form.district_id || ''} onChange={e => setField('district_id', e.target.value ? Number(e.target.value) : undefined)}>
                    <option value="">İlçe seçin (opsiyonel)</option>
                    {districts?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>Tercih Edilen Tarih</label>
                <input type="date" className="input" value={form.preferred_date} onChange={e => setField('preferred_date', e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>Tercih Edilen Saat</label>
                <input type="time" className="input" value={form.preferred_time} onChange={e => setField('preferred_time', e.target.value)} />
              </div>
            </div>
          )}

          {step === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Bütçenizi belirtin (opsiyonel). Uzmanlar bu bilgiye göre teklif verecek.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>Min. Bütçe (₺)</label>
                  <input type="number" className="input" value={form.budget_min} onChange={e => setField('budget_min', e.target.value)} placeholder="0" min="0" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>Maks. Bütçe (₺)</label>
                  <input type="number" className="input" value={form.budget_max} onChange={e => setField('budget_max', e.target.value)} placeholder="0" min="0" />
                </div>
              </div>
            </div>
          )}

          {step === 7 && (
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>Ek Notlar</label>
              <textarea
                className="input"
                value={form.notes}
                onChange={e => setField('notes', e.target.value)}
                placeholder="Uzmanın bilmesi gereken ek bilgiler..."
                rows={4}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
          )}

          {step === 8 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { val: 'LOW', label: 'Düşük', desc: 'Acele değil, uygun zamanda yapılabilir', color: '#10b981' },
                { val: 'MEDIUM', label: 'Orta', desc: 'Birkaç gün içinde yapılmalı', color: '#3b82f6' },
                { val: 'HIGH', label: 'Yüksek', desc: 'En kısa sürede yapılmalı', color: '#f59e0b' },
                { val: 'EMERGENCY', label: 'Acil', desc: 'Hemen yapılması gerekiyor!', color: '#ef4444' },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setField('urgency', opt.val)}
                  style={{
                    padding: 14, borderRadius: 10, cursor: 'pointer', border: '2px solid',
                    borderColor: form.urgency === opt.val ? opt.color : 'var(--color-border)',
                    background: form.urgency === opt.val ? `${opt.color}18` : 'var(--color-surface-2)',
                    textAlign: 'left', transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontWeight: 700, color: opt.color }}>{opt.label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          )}

          {step === 9 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Talep Özeti</h3>
              {[
                { label: 'Kategori', value: selectedCategory?.name },
                { label: 'Alt Kategori', value: selectedSubcategory?.name },
                { label: 'Başlık', value: form.title },
                { label: 'Şehir', value: cities?.find(c => c.id === form.city_id)?.name },
                { label: 'Tarih', value: form.preferred_date },
                { label: 'Bütçe', value: form.budget_min || form.budget_max ? `₺${form.budget_min || '?'} - ₺${form.budget_max || '?'}` : 'Belirtilmemiş' },
                { label: 'Aciliyet', value: form.urgency },
              ].map(item => item.value && (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{item.label}</span>
                  <span style={{ fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
              {form.description && (
                <div style={{ padding: 14, background: 'var(--color-surface-2)', borderRadius: 10 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 6 }}>Açıklama</div>
                  <div style={{ fontSize: '0.875rem' }}>{form.description}</div>
                </div>
              )}
            </div>
          )}

          {step === 10 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚀</div>
              <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Talebinizi Yayınlamaya Hazır mısınız?</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
                Talebiniz yayınlandığında, alandaki uzmanlar teklif göndermeye başlayacak. Teklifleri karşılaştırarak en uygununu seçebilirsiniz.
              </p>
              <button
                id="submit-request-btn"
                className="btn btn-primary btn-lg"
                onClick={handleSubmit}
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? <div className="spinner" style={{ width: 20, height: 20 }} /> : <><Send size={16} /> Talebi Yayınla</>}
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <button
            className="btn btn-ghost"
            onClick={() => {
              // Alt kategorisi olmayan kategoride adım 2'yi atla
              if (step === 3 && !selectedCategory?.subcategories?.length) setStep(1);
              else if (step > 1) setStep(s => s - 1);
              else navigate(-1);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ChevronLeft size={16} /> Geri
          </button>
          {step < 10 && (
            <button
              className="btn btn-primary"
              onClick={() => {
                // Alt kategorisi olmayan kategoride adım 2'yi otomatik geç
                if (step === 1 && form.category_id && !selectedCategory?.subcategories?.length) setStep(3);
                else setStep(s => s + 1);
              }}
              disabled={!canProceed()}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              İleri <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ServiceRequestForm;
