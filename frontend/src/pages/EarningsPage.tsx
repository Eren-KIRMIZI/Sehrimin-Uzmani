import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

interface EarningData {
  total_earned: number;
  total_commission_paid: number;
  pending_amount: number;
  paid_amount: number;
  transaction_count: number;
}

interface Transaction {
  id: number;
  amount: number;
  commission_rate: number;
  commission_amount: number;
  provider_earning: number;
  status: string;
  description: string;
  created_at: string;
}

interface PayoutRequest {
  id: number;
  amount: number;
  bank_name: string;
  status: string;
  created_at: string;
}

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<EarningData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'transactions' | 'payouts'>('overview');
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ amount: '', bank_name: '', iban: '', account_holder: '' });
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [earnRes, txRes, payoutRes] = await Promise.all([
        api.get('/commissions/earnings'),
        api.get('/commissions/transactions'),
        api.get('/commissions/payout/my'),
      ]);
      setEarnings(earnRes.data);
      setTransactions(txRes.data.items || []);
      setPayouts(payoutRes.data || []);
    } catch {
      toast.error('Veriler yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handlePayout = async () => {
    if (!payoutForm.amount || parseFloat(payoutForm.amount) <= 0) {
      toast.error('Gecerli bir tutar girin');
      return;
    }
    try {
      await api.post('/commissions/payout/request', null, {
        params: {
          amount: parseFloat(payoutForm.amount),
          bank_name: payoutForm.bank_name || undefined,
          iban: payoutForm.iban || undefined,
          account_holder: payoutForm.account_holder || undefined,
        },
      });
      toast.success('Odeme talebi gonderildi');
      setShowPayoutForm(false);
      setPayoutForm({ amount: '', bank_name: '', iban: '', account_holder: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Hata olustu');
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Kazanc Takibi</h1>
            <p className="text-gray-500 mt-1">Gelirlerinizi ve komisyon odemelerinizi goruntuleyin</p>
          </div>
          <button
            onClick={() => setShowPayoutForm(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all"
          >
            Odeme Talep Et
          </button>
        </div>

        {earnings && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Toplam Kazanc', value: `${earnings.total_earned.toLocaleString('tr-TR')} TL`, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Komisyon Odemesi', value: `${earnings.total_commission_paid.toLocaleString('tr-TR')} TL`, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Bekleyen Tutar', value: `${earnings.pending_amount.toLocaleString('tr-TR')} TL`, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Odenen Tutar', value: `${earnings.paid_amount.toLocaleString('tr-TR')} TL`, color: 'text-blue-600', bg: 'bg-blue-50' },
            ].map((item, i) => (
              <div key={i} className={`${item.bg} rounded-2xl p-5`}>
                <p className="text-sm text-gray-600 mb-1">{item.label}</p>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-1 bg-gray-200 rounded-xl p-1 mb-6 w-fit">
          {(['overview', 'transactions', 'payouts'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t === 'overview' ? 'Genel Bakis' : t === 'transactions' ? 'Islemler' : 'Odeme Talepleri'}
            </button>
          ))}
        </div>

        {tab === 'transactions' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tarih</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Aciklama</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tutar</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Komisyon</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Net</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(tx.created_at).toLocaleDateString('tr-TR')}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{tx.description || '-'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{tx.amount.toLocaleString('tr-TR')} TL</td>
                    <td className="px-6 py-4 text-sm text-red-600">-{tx.commission_amount.toLocaleString('tr-TR')} TL</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">{tx.provider_earning.toLocaleString('tr-TR')} TL</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                        tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {tx.status === 'completed' ? 'Tamamlandi' : tx.status === 'pending' ? 'Beklemede' : tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Henuz islem bulunmuyor</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'payouts' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tarih</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Banka</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tutar</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(p.created_at).toLocaleDateString('tr-TR')}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{p.bank_name || '-'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.amount.toLocaleString('tr-TR')} TL</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        p.status === 'approved' ? 'bg-green-100 text-green-800' :
                        p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {p.status === 'approved' ? 'Onaylandi' : p.status === 'pending' ? 'Beklemede' : 'Reddedildi'}
                      </span>
                    </td>
                  </tr>
                ))}
                {payouts.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Henuz odeme talebi yok</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {showPayoutForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Odeme Talebi</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (TL)</label>
                  <input
                    type="number"
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banka Adi</label>
                  <input
                    type="text"
                    value={payoutForm.bank_name}
                    onChange={(e) => setPayoutForm({ ...payoutForm, bank_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    placeholder="Ziraat Bankasi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                  <input
                    type="text"
                    value={payoutForm.iban}
                    onChange={(e) => setPayoutForm({ ...payoutForm, iban: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hesap Sahibi</label>
                  <input
                    type="text"
                    value={payoutForm.account_holder}
                    onChange={(e) => setPayoutForm({ ...payoutForm, account_holder: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    placeholder="Ad Soyad"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handlePayout} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700">
                  Talep Gonder
                </button>
                <button onClick={() => setShowPayoutForm(false)} className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">
                  Iptal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
