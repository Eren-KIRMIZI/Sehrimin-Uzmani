import React, { useState } from 'react';
import { Wallet, CheckCircle, Clock, Building, Plus, Landmark } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '../components/layout/Layout';
import SEO from '../components/SEO';
import { useEarnings, useTransactions, useEarningsHistory, useMyPayouts, useRequestPayout } from '../hooks/useQueries';
import { toast, toastApiError } from '../stores/toastStore';
import { formatTRY, formatDate } from '../utils/format';

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekliyor',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  PAID: 'Ödendi',
};

const EarningsPage: React.FC = () => {
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ amount: '', iban: '', bank_name: '' });
  const [page, setPage] = useState(1);

  const { data: earnings, isLoading } = useEarnings();
  const { data: transactions, isLoading: trxLoading } = useTransactions(page);
  const { data: history } = useEarningsHistory();
  const { data: payouts } = useMyPayouts();
  const requestPayout = useRequestPayout();

  const available = earnings?.available_for_payout ?? 0;

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestPayout.mutateAsync({
        amount: Number(payoutForm.amount),
        iban: payoutForm.iban,
        bank_name: payoutForm.bank_name,
      });
      toast.success('Ödeme talebiniz alındı. Onay sonrası hesabınıza aktarılacak.');
      setShowPayoutModal(false);
      setPayoutForm({ amount: '', iban: '', bank_name: '' });
    } catch (err) {
      toastApiError(err, 'Ödeme talebi oluşturulamadı');
    }
  };

  return (
    <Layout>
      <SEO title="Kazançlarım" description="Kazançlarınız, işlem geçmişiniz ve ödeme talepleriniz" />
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
              {formatTRY(available)}
            </div>
            <button
              className="btn btn-primary btn-sm"
              style={{ marginTop: 16, width: '100%', background: '#10b981' }}
              onClick={() => setShowPayoutModal(true)}
              disabled={!earnings || available <= 0}
            >
              <Plus size={15} /> Para Çek
            </button>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Bekleyen Kazanç (Emanet)</span>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: 6, borderRadius: 8, color: '#fbbf24' }}><Clock size={20} /></div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>
              {formatTRY(earnings?.pending_amount ?? 0)}
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Toplam Çekilen</span>
              <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: 6, borderRadius: 8, color: '#818cf8' }}><CheckCircle size={20} /></div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>
              {formatTRY(earnings?.paid_amount ?? 0)}
            </div>
          </div>
        </div>

        {/* Kazanç Grafiği */}
        {history && history.length > 0 && (
          <div className="card" style={{ padding: 24, marginBottom: 32 }}>
            <h3 style={{ fontWeight: 700, margin: '0 0 20px' }}>Günlük Kazanç (Son 30 Gün)</h3>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--color-text-dim)', fontSize: 11 }}
                    tickFormatter={(v: string) => v.slice(8)}
                    interval={4}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-dim)', fontSize: 11 }} width={50} />
                  <Tooltip
                    formatter={(value) => [formatTRY(Number(value)), 'Kazanç']}
                    labelFormatter={(label) => formatDate(String(label))}
                    contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2.5} fill="url(#earningsGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontWeight: 700, margin: 0 }}>İşlem Geçmişi</h3>
          </div>

          {trxLoading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>Yükleniyor...</div>
          ) : transactions?.items && transactions.items.length > 0 ? (
            <>
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
                        <td style={{ padding: '16px 24px' }}>{formatDate(trx.created_at)}</td>
                        <td style={{ padding: '16px 24px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>#{trx.id}</td>
                        <td style={{ padding: '16px 24px', fontWeight: 600 }}>{formatTRY(trx.amount)}</td>
                        <td style={{ padding: '16px 24px', color: 'var(--color-error)' }}>-{formatTRY(trx.commission_amount)}</td>
                        <td style={{ padding: '16px 24px', fontWeight: 700, color: '#34d399' }}>{formatTRY(trx.provider_earning)}</td>
                        <td style={{ padding: '16px 24px' }}>
                          <span className={`badge ${trx.status === 'COMPLETED' ? 'badge-success' : trx.status === 'PENDING' ? 'badge-warning' : 'badge-error'}`}>
                            {trx.status === 'COMPLETED' ? 'Tamamlandı' : trx.status === 'PENDING' ? 'Bekliyor' : trx.status === 'REFUNDED' ? 'İade' : trx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(transactions.has_next || page > 1) && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: 16 }}>
                  {page > 1 && (
                    <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p - 1)}>Önceki</button>
                  )}
                  <span style={{ alignSelf: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Sayfa {page}</span>
                  {transactions.has_next && (
                    <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p + 1)}>Sonraki</button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Henüz işlem kaydınız bulunmuyor.
            </div>
          )}
        </div>

        {/* Ödeme Talepleri */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 700, margin: 0 }}>Ödeme Taleplerim</h3>
            <button className="btn btn-outline btn-sm" onClick={() => setShowPayoutModal(true)} disabled={available <= 0}>
              <Plus size={14} /> Yeni Talep
            </button>
          </div>
          {payouts && payouts.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    <th style={{ padding: '14px 24px', fontWeight: 600 }}>Tarih</th>
                    <th style={{ padding: '14px 24px', fontWeight: 600 }}>Tutar</th>
                    <th style={{ padding: '14px 24px', fontWeight: 600 }}>Banka</th>
                    <th style={{ padding: '14px 24px', fontWeight: 600 }}>IBAN</th>
                    <th style={{ padding: '14px 24px', fontWeight: 600 }}>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '14px 24px' }}>{formatDate(p.created_at)}</td>
                      <td style={{ padding: '14px 24px', fontWeight: 700 }}>{formatTRY(p.amount)}</td>
                      <td style={{ padding: '14px 24px' }}>{p.bank_name}</td>
                      <td style={{ padding: '14px 24px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {p.iban ? `${p.iban.slice(0, 8)}...${p.iban.slice(-4)}` : '-'}
                      </td>
                      <td style={{ padding: '14px 24px' }}>
                        <span className={`badge ${p.status === 'APPROVED' || p.status === 'PAID' ? 'badge-success' : p.status === 'PENDING' ? 'badge-warning' : 'badge-error'}`}>
                          {PAYOUT_STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Henüz ödeme talebiniz yok.
            </div>
          )}
        </div>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowPayoutModal(false); }}>
          <div className="modal-content">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>Para Çekme Talebi</h3>
              <button className="btn btn-ghost" onClick={() => setShowPayoutModal(false)} style={{ padding: 4 }} aria-label="Kapat">✕</button>
            </div>

            <form onSubmit={handlePayoutSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: 16, borderRadius: 8, marginBottom: 8 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-success)' }}>Kullanılabilir Bakiye</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>{formatTRY(available)}</div>
              </div>

              <div>
                <label htmlFor="payout-amount" style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>Çekilecek Tutar (₺)</label>
                <input
                  id="payout-amount"
                  type="number"
                  className="input"
                  required
                  min={100}
                  max={available}
                  value={payoutForm.amount}
                  onChange={e => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                  placeholder="Min. 100 ₺"
                />
              </div>

              <div>
                <label htmlFor="payout-bank" style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>Banka Adı</label>
                <div style={{ position: 'relative' }}>
                  <Building size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
                  <input
                    id="payout-bank"
                    type="text"
                    className="input"
                    required
                    value={payoutForm.bank_name}
                    onChange={e => setPayoutForm({ ...payoutForm, bank_name: e.target.value })}
                    placeholder="Örn: Garanti BBVA"
                    style={{ paddingLeft: 40 }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="payout-iban" style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>IBAN</label>
                <input
                  id="payout-iban"
                  type="text"
                  className="input"
                  required
                  value={payoutForm.iban}
                  onChange={e => setPayoutForm({ ...payoutForm, iban: e.target.value.toUpperCase().replace(/\s/g, '') })}
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
                disabled={requestPayout.isPending}
              >
                {requestPayout.isPending ? 'İşleniyor...' : 'Talebi Gönder'}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EarningsPage;
