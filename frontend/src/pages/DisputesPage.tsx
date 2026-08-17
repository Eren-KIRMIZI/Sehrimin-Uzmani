import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';

interface Dispute {
  id: number;
  reason: string;
  description: string;
  status: string;
  priority: string;
  reporter_name: string;
  reported_name: string;
  amount_involved: number | null;
  created_at: string;
}

interface DisputeDetail extends Dispute {
  resolution: string | null;
  messages: Array<{
    id: number;
    sender_name: string;
    message: string;
    is_admin: boolean;
    attachment_url: string | null;
    created_at: string;
  }>;
  evidence: Array<{
    id: number;
    file_url: string;
    description: string | null;
    uploader_name: string;
    created_at: string;
  }>;
}

const REASONS = [
  { value: 'service_not_received', label: 'Hizmet Alinamadi' },
  { value: 'quality_issue', label: 'Kalite Sorunu' },
  { value: 'price_disagreement', label: 'Fiyat Anlasmazligi' },
  { value: 'no_show', label: 'Gelmemesi' },
  { value: 'partial_payment', label: 'Kismi Odeme' },
  { value: 'fraud', label: 'Dolandiricilik' },
  { value: 'other', label: 'Diger' },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  open: { label: 'Acik', color: 'bg-red-100 text-red-800' },
  under_review: { label: 'Inceleniyor', color: 'bg-yellow-100 text-yellow-800' },
  resolved: { label: 'Cozuldu', color: 'bg-green-100 text-green-800' },
  closed: { label: 'Kapatildi', color: 'bg-gray-100 text-gray-600' },
  escalated: { label: 'Yukari Tasindi', color: 'bg-purple-100 text-purple-800' },
};

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selected, setSelected] = useState<DisputeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [formData, setFormData] = useState({
    reported_id: '',
    reason: 'service_not_received',
    description: '',
    amount_involved: '',
  });
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const res = await api.get('/disputes');
      setDisputes(res.data.items);
    } catch {
      toast.error('Anlasmazliklar yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id: number) => {
    try {
      const res = await api.get(`/disputes/${id}`);
      setSelected(res.data);
    } catch {
      toast.error('Detaylar yuklenemedi');
    }
  };

  const handleCreate = async () => {
    if (!formData.reported_id || !formData.description) {
      toast.error('Zorunlu alanlari doldurun');
      return;
    }
    try {
      await api.post('/disputes', null, {
        params: {
          reported_id: parseInt(formData.reported_id),
          reason: formData.reason,
          description: formData.description,
          amount_involved: formData.amount_involved ? parseFloat(formData.amount_involved) : undefined,
        },
      });
      toast.success('Anlasmazlik acildi');
      setShowForm(false);
      setFormData({ reported_id: '', reason: 'service_not_received', description: '', amount_involved: '' });
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Hata olustu');
    }
  };

  const handleSendMessage = async () => {
    if (!selected || !newMessage.trim()) return;
    try {
      await api.post(`/disputes/${selected.id}/messages`, null, { params: { message: newMessage } });
      setNewMessage('');
      fetchDetail(selected.id);
      toast.success('Mesaj gonderildi');
    } catch {
      toast.error('Mesaj gonderilemedi');
    }
  };

  const handleClose = async (id: number) => {
    try {
      await api.post(`/disputes/${id}/close`);
      toast.success('Anlasmazlik kapatildi');
      fetchDisputes();
      setSelected(null);
    } catch {
      toast.error('Kapatilamadi');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Anlasmazliklarim</h1>
            <p className="text-gray-500 mt-1">Yasadiginiz sorunlari buradan yonetebilirsiniz</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
          >
            + Yeni Anlasmazlik Ac
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yeni Anlasmazlik</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Karsi Taraf (Kullanici ID)</label>
                <input
                  type="number"
                  value={formData.reported_id}
                  onChange={(e) => setFormData({ ...formData, reported_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Kullanici ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Neden</label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                >
                  {REASONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tutarsiz Tutar (opsiyonel)</label>
                <input
                  type="number"
                  value={formData.amount_involved}
                  onChange={(e) => setFormData({ ...formData, amount_involved: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  placeholder="TL"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Aciklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 h-24 resize-none"
                  placeholder="Sorunu detayli aciklayin..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleCreate} className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">
                Gonder
              </button>
              <button onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">
                Iptal
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))
            ) : disputes.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                Henuz anlasmazlik bulunmuyor
              </div>
            ) : (
              disputes.map((d) => (
                <button
                  key={d.id}
                  onClick={() => fetchDetail(d.id)}
                  className={`w-full text-left bg-white rounded-xl p-4 border-2 transition-all hover:shadow-md ${
                    selected?.id === d.id ? 'border-primary-500 shadow-md' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_MAP[d.status]?.color || 'bg-gray-100'}`}>
                      {STATUS_MAP[d.status]?.label || d.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(d.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-2 truncate">
                    {REASONS.find((r) => r.value === d.reason)?.label || d.reason}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {d.reported_name} karsisinda
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="lg:col-span-2">
            {selected ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {REASONS.find((r) => r.value === selected.reason)?.label || selected.reason}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selected.reported_name} karsisinda • {new Date(selected.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_MAP[selected.status]?.color}`}>
                      {STATUS_MAP[selected.status]?.label}
                    </span>
                    {selected.status === 'open' && (
                      <button
                        onClick={() => handleClose(selected.id)}
                        className="text-xs px-3 py-1 border border-gray-300 rounded-full text-gray-600 hover:bg-gray-50"
                      >
                        Kapat
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-700">{selected.description}</p>
                  {selected.amount_involved && (
                    <p className="text-sm text-gray-500 mt-2">Tutar: {selected.amount_involved.toLocaleString('tr-TR')} TL</p>
                  )}
                  {selected.resolution && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-medium text-green-700">Cozum: {selected.resolution}</p>
                    </div>
                  )}
                </div>

                {selected.messages.length > 0 && (
                  <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
                    {selected.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-xl max-w-[80%] ${
                          m.sender_name === `${user?.first_name} ${user?.last_name}`
                            ? 'bg-primary-100 ml-auto'
                            : m.is_admin
                            ? 'bg-yellow-50 border border-yellow-200'
                            : 'bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-900">{m.sender_name}</span>
                          {m.is_admin && (
                            <span className="text-[10px] bg-yellow-200 text-yellow-800 px-1.5 rounded">ADMIN</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{m.message}</p>
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          {new Date(m.created_at).toLocaleString('tr-TR')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {selected.status !== 'closed' && selected.status !== 'resolved' && (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                      placeholder="Mesajinizi yazin..."
                    />
                    <button
                      onClick={handleSendMessage}
                      className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700"
                    >
                      Gonder
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
                Bir anlasmazlik secin
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
