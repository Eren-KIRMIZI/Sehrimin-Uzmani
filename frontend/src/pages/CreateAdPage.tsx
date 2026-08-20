import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ImagePlus, Plus, Trash2, X } from 'lucide-react';
import Layout from '../components/layout/Layout';
import SEO from '../components/SEO';
import { useAdCategories, useCities, useDistricts, useCreateAd, usePublishAd } from '../hooks/useAds';
import type { AdCondition, AdPriceType } from '../types/ads';

const STEPS = ['Kategori', 'İlan Detayı', 'Fotoğraflar', 'Fiyat & Konum', 'Önizleme'];

const CONDITION_OPTIONS: { value: AdCondition; label: string }[] = [
  { value: 'NEW', label: 'Sıfır' },
  { value: 'LIKE_NEW', label: 'Sıfır Ayarında' },
  { value: 'GOOD', label: 'İyi' },
  { value: 'USED', label: 'Kullanılmış' },
];

const CreateAdPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: categories } = useAdCategories();
  const { data: cities } = useCities();
  const createAd = useCreateAd();
  const publishAd = usePublishAd();

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [createdAdId, setCreatedAdId] = useState<number | null>(null);

  // Form state
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState<AdCondition | ''>('');
  const [priceType, setPriceType] = useState<AdPriceType>('FIXED');
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [cityId, setCityId] = useState<number | null>(null);
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [phone, setPhone] = useState('');
  const [showPhone, setShowPhone] = useState(true);
  const [images, setImages] = useState<{ url: string; is_cover: boolean }[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [attributes, setAttributes] = useState<{ attribute_key: string; attribute_value: string }[]>([]);
  const [attrKey, setAttrKey] = useState('');
  const [attrValue, setAttrValue] = useState('');

  const rootCategories = (categories || []).filter(c => !c.parent_id);
  const childrenOf = (parentId: number) => (categories || []).filter(c => c.parent_id === parentId);
  const selectedCategory = categories?.find(c => c.id === categoryId);

  const { data: districts } = useDistricts(cityId ?? undefined);

  const validateStep = (): boolean => {
    setError(null);
    if (step === 0 && !categoryId) {
      setError('Lütfen bir kategori seçin');
      return false;
    }
    if (step === 1) {
      if (title.trim().length < 5) {
        setError('Başlık en az 5 karakter olmalı');
        return false;
      }
    }
    if (step === 3) {
      if (!cityId) {
        setError('Lütfen il seçin');
        return false;
      }
      if (priceType !== 'FREE' && (!price || Number(price) < 0)) {
        setError('Geçerli bir fiyat girin');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const addImage = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (images.length >= 20) {
      setError('En fazla 20 fotoğraf ekleyebilirsiniz');
      return;
    }
    setImages(prev => [...prev, { url, is_cover: prev.length === 0 }]);
    setImageUrlInput('');
    setError(null);
  };

  const addAttribute = () => {
    if (!attrKey.trim() || !attrValue.trim()) return;
    setAttributes(prev => [...prev, { attribute_key: attrKey.trim().toLowerCase().replace(/\s+/g, '_'), attribute_value: attrValue.trim() }]);
    setAttrKey('');
    setAttrValue('');
  };

  const handleSubmit = () => {
    setError(null);
    if (!categoryId || !cityId) {
      setError('Kategori ve şehir zorunludur');
      return;
    }
    createAd.mutate(
      {
        category_id: categoryId,
        title: title.trim(),
        description: description.trim() || undefined,
        price: priceType === 'FREE' ? undefined : Number(price),
        price_type: priceType,
        condition: condition || undefined,
        city_id: cityId,
        district_id: districtId ?? undefined,
        is_negotiable: isNegotiable,
        show_phone: showPhone,
        phone: phone.trim() || undefined,
        images: images.map((img, i) => ({ ...img, sort_order: i })),
        attributes,
      },
      {
        onSuccess: ad => {
          setCreatedAdId(ad.id);
          publishAd.mutate(ad.id, {
            onSuccess: () => navigate(`/ads/${ad.id}`),
            onError: () => navigate(`/ads/${ad.id}`),
          });
        },
        onError: (err: any) =>
          setError(err?.response?.data?.detail || 'İlan oluşturulamadı'),
      }
    );
  };

  return (
    <Layout>
      <SEO title="İlan Ver" description="Ürün veya hizmetinizi ilan vererek satın." />
      <div className="container" style={{ padding: '32px 24px', maxWidth: 860 }}>
        <Link to="/ads" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: '0.85rem', textDecoration: 'none', marginBottom: 16 }}>
          <ArrowLeft size={15} /> İlanlara Dön
        </Link>

        <h1 style={{ fontWeight: 900, fontSize: '1.7rem', margin: 0 }}>İlan Ver</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>Birkaç adımda ilanını yayınla</p>

        {/* Stepper */}
        <div style={{ display: 'flex', gap: 4, margin: '24px 0 28px', flexWrap: 'wrap' }}>
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: '0.78rem',
                  fontWeight: i === step ? 700 : 500,
                  background:
                    i < step
                      ? 'rgba(16, 185, 129, 0.12)'
                      : i === step
                        ? 'rgba(99, 102, 241, 0.15)'
                        : 'var(--color-surface-2)',
                  color: i <= step ? (i < step ? '#10b981' : 'var(--color-primary-light)') : 'var(--color-text-dim)',
                }}
              >
                {i < step ? <Check size={13} /> : <span>{i + 1}.</span>} {label}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, minWidth: 10, height: 1, background: 'var(--color-border)', alignSelf: 'center' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        <div className="card" style={{ padding: 26 }}>
          {/* ── Adım 1: Kategori ── */}
          {step === 0 && (
            <div>
              <h2 style={{ fontWeight: 700, marginBottom: 16 }}>Kategori Seç</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                {rootCategories.map(cat => (
                  <div key={cat.id}>
                    <div
                      onClick={() => {
                        const kids = childrenOf(cat.id);
                        if (kids.length === 0) setCategoryId(cat.id);
                      }}
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        cursor: 'pointer',
                        textAlign: 'center',
                        border: `2px solid ${childrenOf(cat.id).length === 0 && categoryId === cat.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: categoryId === cat.id ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                      }}
                    >
                      <div style={{ fontSize: '1.6rem' }}>{cat.icon}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: 6 }}>{cat.name}</div>
                    </div>
                    {childrenOf(cat.id).length > 0 && (
                      <select
                        className="input"
                        style={{ marginTop: 6, fontSize: '0.82rem' }}
                        value={childrenOf(cat.id).some(c => c.id === categoryId) ? categoryId! : ''}
                        onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">Alt kategori seç...</option>
                        {childrenOf(cat.id).map(sub => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Adım 2: Detay ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 style={{ fontWeight: 700, margin: 0 }}>İlan Detayı</h2>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Başlık *
                </label>
                <input
                  className="input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Örn: Temiz Honda Civic 2022, 85.000 km"
                  maxLength={200}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Açıklama
                </label>
                <textarea
                  className="input"
                  rows={6}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ürünün/hizmetin durumunu, kullanım süresini ve detaylarını yazın..."
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Durumu
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CONDITION_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`btn btn-sm ${condition === opt.value ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setCondition(condition === opt.value ? '' : opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Özellikler */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Özellikler (marka, model, yıl vb.)
                </label>
                {attributes.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {attributes.map((a, i) => (
                      <span key={i} className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        {a.attribute_key.replace(/_/g, ' ')}: {a.attribute_value}
                        <X size={11} style={{ cursor: 'pointer' }} onClick={() => setAttributes(prev => prev.filter((_, j) => j !== i))} />
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input"
                    style={{ width: 160 }}
                    value={attrKey}
                    onChange={e => setAttrKey(e.target.value)}
                    placeholder="Özellik (örn: marka)"
                  />
                  <input
                    className="input"
                    style={{ flex: 1 }}
                    value={attrValue}
                    onChange={e => setAttrValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAttribute())}
                    placeholder="Değer (örn: Honda)"
                  />
                  <button type="button" className="btn btn-outline" onClick={addAttribute}>
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Adım 3: Fotoğraflar ── */}
          {step === 2 && (
            <div>
              <h2 style={{ fontWeight: 700, marginBottom: 4 }}>Fotoğraflar</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
                En fazla 20 fotoğraf ekleyebilirsiniz. İlk fotoğraf kapak fotoğrafı olur.
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                  className="input"
                  style={{ flex: 1 }}
                  value={imageUrlInput}
                  onChange={e => setImageUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())}
                  placeholder="Fotoğraf URL'si yapıştırın (https://...)"
                />
                <button type="button" className="btn btn-primary" onClick={addImage}>
                  <ImagePlus size={16} /> Ekle
                </button>
              </div>
              {images.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
                  {images.map((img, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: 'var(--color-surface-2)' }}>
                      <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {img.is_cover && (
                        <span style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(99,102,241,0.9)', color: 'white', fontSize: '0.62rem', padding: '2px 6px', borderRadius: 4 }}>
                          Kapak
                        </span>
                      )}
                      <button
                        onClick={() =>
                          setImages(prev => prev.filter((_, j) => j !== i).map((p, j) => ({ ...p, is_cover: j === 0 })))
                        }
                        style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: 6, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ border: '2px dashed var(--color-border)', borderRadius: 12, padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-dim)' }}>
                  <ImagePlus size={32} style={{ margin: '0 auto 10px' }} />
                  Henüz fotoğraf eklenmedi
                </div>
              )}
            </div>
          )}

          {/* ── Adım 4: Fiyat & Konum ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 style={{ fontWeight: 700, margin: 0 }}>Fiyat & Konum</h2>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Fiyat Tipi</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {([
                    { v: 'FIXED', l: 'Sabit Fiyat' },
                    { v: 'NEGOTIABLE', l: 'Pazarlıklı' },
                    { v: 'FREE', l: 'Ücretsiz' },
                  ] as const).map(opt => (
                    <button
                      key={opt.v}
                      type="button"
                      className={`btn btn-sm ${priceType === opt.v ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setPriceType(opt.v)}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              {priceType !== 'FREE' && (
                <>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Fiyat (₺) *</label>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="Örn: 48500"
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                    <input type="checkbox" checked={isNegotiable} onChange={e => setIsNegotiable(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
                    Pazarlığa açık
                  </label>
                </>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>İl *</label>
                  <select
                    className="input"
                    value={cityId || ''}
                    onChange={e => {
                      setCityId(e.target.value ? Number(e.target.value) : null);
                      setDistrictId(null);
                    }}
                  >
                    <option value="">Seçiniz</option>
                    {cities?.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>İlçe</label>
                  <select
                    className="input"
                    value={districtId || ''}
                    onChange={e => setDistrictId(e.target.value ? Number(e.target.value) : null)}
                    disabled={!cityId}
                  >
                    <option value="">Seçiniz</option>
                    {districts?.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Telefon</label>
                <input
                  className="input"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="05XX XXX XX XX"
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 8 }}>
                  <input type="checkbox" checked={showPhone} onChange={e => setShowPhone(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
                  Telefonumu ilan detayında göster
                </label>
              </div>
            </div>
          )}

          {/* ── Adım 5: Önizleme ── */}
          {step === 4 && (
            <div>
              <h2 style={{ fontWeight: 700, marginBottom: 16 }}>Önizleme</h2>
              <div className="card" style={{ padding: 20, background: 'var(--color-surface-2)' }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ width: 120, height: 90, borderRadius: 10, overflow: 'hidden', background: 'var(--color-surface)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {images[0] ? (
                      <img src={images[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem' }}>Foto yok</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary-light)' }}>
                      {priceType === 'FREE'
                        ? 'Ücretsiz'
                        : price
                          ? `${new Intl.NumberFormat('tr-TR').format(Number(price))} ₺`
                          : 'Fiyat sorunuz'}
                    </div>
                    <div style={{ fontWeight: 600, marginTop: 4 }}>{title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                      {selectedCategory?.name} • {cities?.find(c => c.id === cityId)?.name}
                      {districts?.find(d => d.id === districtId) ? ` / ${districts.find(d => d.id === districtId)?.name}` : ''}
                    </div>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '0.83rem', color: 'var(--color-text-muted)', marginTop: 14 }}>
                Yayınla'ya tıkladığınızda ilanınız 30 gün boyunca aktif kalır.
              </p>
            </div>
          )}

          {/* Navigasyon */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 26, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
            <button
              className="btn btn-ghost"
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
            >
              <ArrowLeft size={15} /> Geri
            </button>
            {step < STEPS.length - 1 ? (
              <button className="btn btn-primary" onClick={nextStep}>
                İleri <ArrowRight size={15} />
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={createAd.isPending || publishAd.isPending}
              >
                {(createAd.isPending || publishAd.isPending) ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Check size={16} />}
                Yayınla
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateAdPage;
