import React, { useState } from 'react';
import { AlertTriangle, MessageSquare, Plus, Lock } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useMyDisputes, useDispute } from '../hooks/useQueries';
import { disputesApi } from '../services';
import { useAuthStore } from '../stores/authStore';

const DisputesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ reported_id: '', reason: '', description: '' });
  const [message, setMessage] = useState('');

  const { data: disputes, refetch } = useMyDisputes(1);
  const { data: activeDispute, refetch: refetchActive } = useDispute(activeId || undefined);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await disputesApi.create({
        reported_id: Number(form.reported_id),
        reason: form.reason,
        description: form.description
      });
      setShowCreate(false);
      setForm({ reported_id: '', reason: '', description: '' });
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Hata oluştu');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeId) return;
    try {
      await disputesApi.addMessage(activeId, message);
      setMessage('');
      refetchActive();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Mesaj gönderilemedi');
    }
  };

  const handleClose = async () => {
    if (!activeId || !confirm('Bu anlaşmazlığı kapatmak istediğinize emin misiniz?')) return;
    try {
      await disputesApi.close(activeId);
      refetchActive();
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Kapatılamadı');
    }
  };

  return (
    <Layout>
      <div className="container" style={{ padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '1.8rem', marginBottom: 4 }}>Anlaşmazlık Yönetimi</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>Sorun yaşadığınız hizmetler için destek talebi açın.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Yeni Anlaşmazlık
          </button>
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* List */}
          <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {disputes?.items.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Kayıtlı anlaşmazlığınız bulunmuyor.
              </div>
            ) : (
              disputes?.items.map(disp => (
                <div 
                  key={disp.id} 
                  className="card"
                  onClick={() => setActiveId(disp.id)}
                  style={{ 
                    cursor: 'pointer',
                    borderColor: activeId === disp.id ? 'var(--color-primary)' : 'var(--color-border)',
                    background: activeId === disp.id ? 'var(--color-surface-2)' : 'var(--color-surface)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700 }}>#{disp.id}</span>
                    <span className={`badge ${disp.status === 'OPEN' ? 'badge-error' : disp.status === 'IN_REVIEW' ? 'badge-warning' : 'badge-success'}`}>
                      {disp.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 4 }}>{disp.reason}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Şikayet edilen: {disp.reported?.first_name} {disp.reported?.last_name}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detail */}
          <div className="card" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', minHeight: 600 }}>
            {activeId && activeDispute ? (
              <>
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 700 }}>#{activeDispute.id} - {activeDispute.reason}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                      Açılış: {new Date(activeDispute.created_at).toLocaleString('tr-TR')}
                    </div>
                  </div>
                  {activeDispute.status !== 'RESOLVED' && activeDispute.status !== 'CLOSED' && (
                    <button className="btn btn-outline btn-sm" onClick={handleClose}>
                      <Lock size={14} /> Kapat
                    </button>
                  )}
                </div>

                {/* Messages */}
                <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Original complaint */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                      {activeDispute.reporter?.first_name} (Şikayetçi)
                    </div>
                    <div className="chat-bubble-received">
                      {activeDispute.description}
                    </div>
                  </div>

                  {/* Replies */}
                  {activeDispute.messages?.map((msg: any) => {
                    const isMe = msg.sender_id === user?.id;
                    const isAdmin = msg.is_admin;
                    return (
                      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{ fontSize: '0.75rem', color: isAdmin ? 'var(--color-primary-light)' : 'var(--color-text-muted)', marginBottom: 4 }}>
                          {isAdmin ? 'Admin' : msg.sender?.first_name}
                        </div>
                        <div className={isAdmin ? 'chat-bubble-sent' : isMe ? 'chat-bubble-sent' : 'chat-bubble-received'} 
                             style={isAdmin ? { background: 'linear-gradient(135deg, #10b981, #059669)' } : {}}>
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                  
                  {activeDispute.resolution && (
                    <div style={{ 
                      margin: '20px 0', padding: 16, borderRadius: 12, textAlign: 'center',
                      background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      <div style={{ fontWeight: 700, color: '#10b981', marginBottom: 8 }}>Çözüm / Karar</div>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>{activeDispute.resolution}</p>
                    </div>
                  )}
                </div>

                {/* Input */}
                {(activeDispute.status === 'OPEN' || activeDispute.status === 'IN_REVIEW') && (
                  <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                    <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 12 }}>
                      <input 
                        className="input" 
                        value={message} 
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Mesaj yazın..." 
                        style={{ height: 44 }}
                      />
                      <button type="submit" className="btn btn-primary" style={{ height: 44, padding: '0 24px' }} disabled={!message.trim()}>
                        Gönder
                      </button>
                    </form>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)' }}>
                <AlertTriangle size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
                <h3>Anlaşmazlık Seçin</h3>
                <p>Detayları görüntülemek için sol taraftan bir anlaşmazlık seçin.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>Yeni Anlaşmazlık Oluştur</h3>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)} style={{ padding: 4 }}>✕</button>
            </div>
            
            <form onSubmit={handleCreate} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>Şikayet Edilen Kişi ID *</label>
                <input className="input" type="number" required value={form.reported_id} onChange={e => setForm({...form, reported_id: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>Neden *</label>
                <select className="input" required value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}>
                  <option value="">Seçiniz</option>
                  <option value="Hizmet Alınamadı">Hizmet Alınamadı</option>
                  <option value="Kalite Sorunu">Kalite Sorunu</option>
                  <option value="Fiyat Anlaşmazlığı">Fiyat Anlaşmazlığı</option>
                  <option value="Gelmemesi">Randevuya Gelmedi</option>
                  <option value="Kısmi Ödeme">Eksik/Fazla Ödeme</option>
                  <option value="Dolandırıcılık">Şüpheli İşlem / Suistimal</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem' }}>Detaylı Açıklama *</label>
                <textarea className="input" required rows={4} style={{ resize: 'vertical' }} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 8, padding: 14, justifyContent: 'center' }}>
                Gönder ve İnceleme Başlat
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DisputesPage;
