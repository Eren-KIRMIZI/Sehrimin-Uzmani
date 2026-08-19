import React from 'react';
import { useAdminPayouts } from '../../hooks/useQueries';
import { Check, X, Clock } from 'lucide-react';

export const AdminPayouts: React.FC = () => {
  const { data, isLoading } = useAdminPayouts(1);

  if (isLoading) return <div>Yükleniyor...</div>;

  return (
    <div className="card">
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <th style={{ padding: 12 }}>Talep ID</th>
            <th>Uzman ID</th>
            <th>Tutar</th>
            <th>Banka Bilgisi</th>
            <th>Durum</th>
            <th>Tarih</th>
          </tr>
        </thead>
        <tbody>
          {data?.items?.map((payout: any) => (
            <tr key={payout.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: 12 }}>#{payout.id}</td>
              <td>#{payout.provider_id}</td>
              <td style={{ fontWeight: 700 }}>₺{payout.amount}</td>
              <td>{payout.bank_name}</td>
              <td>
                {payout.status === 'PENDING' && <span className="badge badge-warning"><Clock size={12}/> Bekliyor</span>}
                {payout.status === 'APPROVED' && <span className="badge badge-success"><Check size={12}/> Onaylandı</span>}
                {payout.status === 'REJECTED' && <span className="badge badge-error"><X size={12}/> Reddedildi</span>}
              </td>
              <td>{new Date(payout.created_at).toLocaleDateString('tr-TR')}</td>
            </tr>
          ))}
          {data?.items?.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>Ödeme talebi bulunmuyor.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
