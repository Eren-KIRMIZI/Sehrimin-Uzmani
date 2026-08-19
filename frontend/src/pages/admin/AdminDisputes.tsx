import React from 'react';
import { useAdminDisputes } from '../../hooks/useQueries';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export const AdminDisputes: React.FC = () => {
  const { data, isLoading } = useAdminDisputes(1);

  if (isLoading) return <div>Yükleniyor...</div>;

  return (
    <div className="card">
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <th style={{ padding: 12 }}>ID</th>
            <th>Şikayet Eden</th>
            <th>Edilen</th>
            <th>Sebep</th>
            <th>Durum</th>
            <th>Tarih</th>
          </tr>
        </thead>
        <tbody>
          {data?.items?.map((dispute: any) => (
            <tr key={dispute.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: 12 }}>#{dispute.id}</td>
              <td>{dispute.reporter?.first_name} {dispute.reporter?.last_name}</td>
              <td>{dispute.reported?.first_name} {dispute.reported?.last_name}</td>
              <td>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{dispute.reason}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }} className="line-clamp-1">{dispute.description}</div>
              </td>
              <td>
                {dispute.status === 'OPEN' || dispute.status === 'IN_REVIEW' ? (
                  <span className="badge badge-warning"><AlertTriangle size={12}/> {dispute.status}</span>
                ) : (
                  <span className="badge badge-success"><CheckCircle size={12}/> {dispute.status}</span>
                )}
              </td>
              <td>{new Date(dispute.created_at).toLocaleDateString('tr-TR')}</td>
            </tr>
          ))}
          {data?.items?.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>Açık anlaşmazlık bulunmuyor.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
