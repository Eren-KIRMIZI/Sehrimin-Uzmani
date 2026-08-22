import React from 'react';
import { BadgeCheck, Check, X, ExternalLink } from 'lucide-react';
import { usePendingVerifications, useVerificationDecision } from '../../hooks/useQueries';
import { toast, toastApiError } from '../../stores/toastStore';
import { formatDateTime } from '../../utils/format';

const TYPE_LABELS: Record<string, string> = {
  IDENTITY: 'Kimlik Doğrulama',
  PROFESSIONAL: 'Mesleki Belge',
  BUSINESS: 'İşletme Belgesi',
};

export const AdminVerifications: React.FC = () => {
  const { data: pending, isLoading, refetch } = usePendingVerifications();
  const decision = useVerificationDecision();
  const [notes, setNotes] = React.useState<Record<number, string>>({});

  const decide = async (id: number, approve: boolean) => {
    try {
      await decision.mutateAsync({ id, approve, note: notes[id] });
      toast.success(approve ? 'Doğrulama onaylandı.' : 'Doğrulama reddedildi.');
    } catch (err) {
      toastApiError(err, 'İşlem başarısız');
    }
  };

  if (isLoading) return <div className="bg-white rounded-2xl p-8 text-center text-gray-500">Yükleniyor...</div>;

  if (!pending || pending.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100" style={{ padding: 60, textAlign: 'center' }}>
        <BadgeCheck size={40} color="#10b981" style={{ margin: '0 auto 12px' }} />
        <h3 className="font-bold text-lg text-gray-800">Bekleyen doğrulama yok</h3>
        <p className="text-sm text-gray-500 mt-1">Tüm başvurular sonuçlandırılmış.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {pending.map(v => (
        <div key={v.id} className="bg-white rounded-2xl shadow-sm border border-gray-100" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <strong>{v.provider_name}</strong>
                <span className="badge badge-primary">{TYPE_LABELS[v.verification_type] ?? v.verification_type}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 6 }}>
                Başvuru: {formatDateTime(v.created_at)}
              </div>
              {v.document_url && (
                <a
                  href={v.document_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: '0.85rem', color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}
                >
                  <ExternalLink size={14} /> Belgeyi Görüntüle
                </a>
              )}
              <input
                placeholder="Red gerekmesi (opsiyonel)"
                value={notes[v.id] ?? ''}
                onChange={e => setNotes(n => ({ ...n, [v.id]: e.target.value }))}
                style={{
                  marginTop: 12, width: '100%', maxWidth: 360,
                  background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8,
                  padding: '8px 12px', fontFamily: 'inherit', fontSize: '0.85rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="btn btn-primary"
                onClick={() => decide(v.id, true)}
                disabled={decision.isPending}
                style={{ background: '#10b981' }}
              >
                <Check size={15} /> Onayla
              </button>
              <button
                className="btn btn-outline"
                onClick={() => decide(v.id, false)}
                disabled={decision.isPending}
                style={{ color: '#ef4444', borderColor: '#ef4444' }}
              >
                <X size={15} /> Reddet
              </button>
            </div>
          </div>
        </div>
      ))}
      <button className="btn btn-outline" style={{ justifySelf: 'start' }} onClick={() => refetch()}>
        Listeyi Yenile
      </button>
    </div>
  );
};
