import React, { useState } from 'react';
import { Megaphone, Plus, Pause, Play, XSquare, MousePointer, Eye, Activity } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useMyPromotions, useCategories } from '../hooks/useQueries';
import { promotionsApi } from '../services';

const PromotionsPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ category_id: '', budget: '', daily_budget: '', bid_amount: '' });

  const { data: promotions, refetch } = useMyPromotions();
  const { data: categories } = useCategories();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await promotionsApi.create({
        category_id: Number(form.category_id) || undefined,
        budget: Number(form.budget),
        daily_budget: form.daily_budget ? Number(form.daily_budget) : undefined,
        bid_amount: Number(form.bid_amount),
      });
      setShowModal(false);
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: number, action: 'pause' | 'resume' | 'cancel') => {
    try {
      await promotionsApi[action](id);
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Hata oluştu');
    }
  };

  return (
    <Layout>
      <div className="container" style={{ padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '1.8rem', marginBottom: 4 }}>Tanıtım Kampanyaları</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>Profilinizi öne çıkarın, daha fazla müşteriye ulaşın.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Yeni Kampanya
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {promotions?.length === 0 ? (
            <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--color-text-muted)' }}>
              <Megaphone size={48} style={{ opacity: 0.5, margin: '0 auto 16px' }} />
              <h3>Aktif Kampanyanız Yok</h3>
              <p>Hemen yeni bir kampanya oluşturarak şehrinizdeki müşterilerin sizi üst sıralarda görmesini sağlayın.</p>
            </div>
          ) : (
            promotions?.map(promo => {
              const spentPercent = (promo.budget_spent / promo.budget) * 100;
              const catName = categories?.find(c => c.id === promo.category_id)?.name || 'Tüm Kategoriler';
              
              return (
                <div key={promo.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <div className={`badge ${promo.status === 'ACTIVE' ? 'badge-success' : promo.status === 'PAUSED' ? 'badge-warning' : 'badge-error'}`}>
                        {promo.status === 'ACTIVE' ? 'Aktif' : promo.status === 'PAUSED' ? 'Duraklatıldı' : promo.status === 'CANCELLED' ? 'İptal' : 'Süresi Doldu'}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: 8 }}>{catName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Teklif (Tık)</div>
                      <div style={{ fontWeight: 800, color: 'var(--color-primary-light)' }}>₺{promo.bid_amount}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <div style={{ background: 'var(--color-surface-2)', padding: 12, borderRadius: 12 }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><Eye size={12} /> Görüntülenme</div>
                      <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{promo.impressions.toLocaleString()}</div>
                    </div>
                    <div style={{ background: 'var(--color-surface-2)', padding: 12, borderRadius: 12 }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><MousePointer size={12} /> Tıklanma</div>
                      <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{promo.clicks.toLocaleString()}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Bütçe Kullanımı: ₺{promo.budget_spent} / ₺{promo.budget}</span>
                      <span style={{ fontWeight: 600 }}>{spentPercent.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--color-surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))', 
                        width: `${Math.min(spentPercent, 100)}%` 
                      }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                    {promo.status === 'ACTIVE' && (
                      <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center', color: '#f59e0b', borderColor: '#f59e0b' }} onClick={() => handleAction(promo.id, 'pause')}>
                        <Pause size={14} /> Duraklat
                      </button>
                    )}
                    {promo.status === 'PAUSED' && (
                      <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center', color: '#10b981', borderColor: '#10b981' }} onClick={() => handleAction(promo.id, 'resume')}>
                        <Play size={14} /> Devam Et
                      </button>
                    )}
                    {(promo.status === 'ACTIVE' || promo.status === 'PAUSED') && (
                      <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center', color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleAction(promo.id, 'cancel')}>
                        <XSquare size={14} /> İptal Et
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>Yeni Kampanya Oluştur</h3>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)} style={{ padding: 4 }}>✕</button>
            </div>
            
            <form onSubmit={handleCreate} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>Hedef Kategori</label>
                <select className="input" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
                  <option value="">Tüm Kategoriler</option>
                  {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Tüm kategoriler veya spesifik bir kategori seçin.</div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>Toplam Bütçe (₺)</label>
                  <input type="number" className="input" required min={100} value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} placeholder="Örn: 1000" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>Günlük Limit (₺)</label>
                  <input type="number" className="input" min={10} value={form.daily_budget} onChange={e => setForm({...form, daily_budget: e.target.value})} placeholder="Opsiyonel" />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>Tıklama Başına Teklif (₺)</label>
                <input type="number" className="input" required min={1} step={0.5} value={form.bid_amount} onChange={e => setForm({...form, bid_amount: e.target.value})} placeholder="Örn: 2.5" />
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Teklifiniz ne kadar yüksek olursa, sıralamada o kadar üstte çıkarsınız (priority_boost = 1 + bid * 0.1).
                </div>
              </div>
              
              <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: 12, borderRadius: 8, fontSize: '0.85rem', color: 'var(--color-primary-light)', display: 'flex', gap: 8 }}>
                <Activity size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                Kampanya başlatıldığında bütçeniz kadar tutar kullanılabilir bakiyenizden bloke edilecektir. Kampanya bitiminde harcanmayan kısım iade edilir.
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ marginTop: 8, padding: 14, justifyContent: 'center' }} disabled={loading}>
                {loading ? 'Oluşturuluyor...' : 'Kampanyayı Başlat'}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PromotionsPage;
