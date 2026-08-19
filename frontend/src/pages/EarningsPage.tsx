import React, { useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, CheckCircle, Clock, Building, Plus } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useEarnings, useTransactions } from '../hooks/useQueries';
import { commissionsApi } from '../services';

const EarningsPage: React.FC = () => {
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ amount: '', iban: '', bank_name: '' });
  const [submitting, setSubmitting] = useState(false);

  const { data: earnings, refetch: refetchEarnings } = useEarnings();
  const { data: transactions } = useTransactions(1);

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await commissionsApi.requestPayout({
        amount: Number(payoutForm.amount),
        iban: payoutForm.iban,
        bank_name: payoutForm.bank_name
      });
      setShowPayoutModal(false);
      refetchEarnings();
      alert('Ödeme talebiniz başarıyla alındı.');
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container" style={{ padding: '32px 24px' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.8rem', marginBottom: 24 }}>Kazançlarım</h1>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--color-surface), rgba(16, 185, 129, 0.05))', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Kullanılabilir Bakiye</span>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: 6, borderRadius: 8, color: '#34d399' }}><Wallet size={20} /></div>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#34d399' }}>
              ₺{earnings?.available_for_payout.toLocaleString() || '0'}
            </div>
            <button 
              className="btn btn-primary btn-sm" 
              style={{ marginTop: 16, width: '100%', background: '#10b981' }}
              onClick={() => setShowPayoutModal(true)}
              disabled={!earnings || earnings.available_for_payout <= 0}
            >
              Para Çek
            </button>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Bekleyen Kazanç (Emanet)</span>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: 6, borderRadius: 8, color: '#fbbf24' }}><Clock size={20} /></div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>
              ₺{earnings?.pending_amount.toLocaleString() || '0'}
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Toplam Çekilen</span>
              <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: 6, borderRadius: 8, color: '#818cf8' }}><CheckCircle size={20} /></div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>
              ₺{earnings?.paid_amount.toLocaleString() || '0'}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 700, margin: 0 }}>İşlem Geçmişi</h3>
          </div>
          
          {transactions?.items && transactions.items.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Tarih</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>İşlem ID</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Tutar</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Komisyon</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Net Kazanç</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.items.map(trx => (
                    <tr key={trx.id} style={{ borderBottom: '1px solid var(--color-border)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '16px 24px' }}>{new Date(trx.created_at).toLocaleDateString('tr-TR')}</td>
                      <td style={{ padding: '16px 24px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>#{trx.id}</td>
                      <td style={{ padding: '16px 24px', fontWeight: 600 }}>₺{trx.amount}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--color-error)' }}>-₺{trx.commission_amount}</td>
                      <td style={{ padding: '16px 24px', fontWeight: 700, color: '#34d399' }}>₺{trx.provider_earning}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span className={`badge ${trx.status === 'COMPLETED' ? 'badge-success' : trx.status === 'PENDING' ? 'badge-warning' : 'badge-error'}`}>
                          {trx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Henüz işlem kaydınız bulunmuyor.
            </div>
          )}
        </div>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>Para Çekme Talebi</h3>
              <button className="btn btn-ghost" onClick={() => setShowPayoutModal(false)} style={{ padding: 4 }}>✕</button>
            </div>
            
            <form onSubmit={handlePayoutSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: 16, borderRadius: 8, marginBottom: 8 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-success)' }}>Kullanılabilir Bakiye</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>₺{earnings?.available_for_payout.toLocaleString()}</div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>Çekilecek Tutar (₺)</label>
                <input 
                  type="number" 
                  className="input" 
                  required 
                  min={100}
                  max={earnings?.available_for_payout}
                  value={payoutForm.amount}
                  onChange={e => setPayoutForm({...payoutForm, amount: e.target.value})}
                  placeholder="Min. 100 ₺"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>Banka Adı</label>
                <div style={{ position: 'relative' }}>
                  <Building size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
                  <input 
                    type="text" 
                    className="input" 
                    required 
                    value={payoutForm.bank_name}
                    onChange={e => setPayoutForm({...payoutForm, bank_name: e.target.value})}
                    placeholder="Örn: Garanti BBVA"
                    style={{ paddingLeft: 40 }}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>IBAN</label>
                <input 
                  type="text" 
                  className="input" 
                  required 
                  value={payoutForm.iban}
                  onChange={e => setPayoutForm({...payoutForm, iban: e.target.value})}
                  placeholder="TR"
                  pattern="^TR\d{24}$"
                  title="26 haneli geçerli bir TR IBAN giriniz"
                  style={{ fontFamily: 'monospace' }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Boşluk bırakmadan yazınız.</div>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ marginTop: 8, padding: 14, justifyContent: 'center' }}
                disabled={submitting}
              >
                {submitting ? 'İşleniyor...' : 'Talebi Gönder'}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EarningsPage;
