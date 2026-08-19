import React from 'react';
import { useAdminUsers } from '../../hooks/useQueries';
import { adminApi } from '../../services';
import { Shield, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const FraudRiskBadge: React.FC<{ userId: number }> = ({ userId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['fraudRisk', userId],
    queryFn: () => adminApi.getFraudRisk(userId)
  });

  if (isLoading) return <span className="badge badge-outline">Hesaplanıyor...</span>;
  if (!data) return null;

  const getStyle = () => {
    if (data.risk_level === 'HIGH') return 'badge-error';
    if (data.risk_level === 'MEDIUM') return 'badge-warning';
    return 'badge-success';
  };

  return (
    <span className={`badge ${getStyle()}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {data.risk_level === 'HIGH' && <AlertTriangle size={12} />}
      {data.risk_level === 'MEDIUM' && <AlertTriangle size={12} />}
      {data.risk_level === 'LOW' && <Shield size={12} />}
      Risk: {data.risk_level} ({data.risk_score}%)
    </span>
  );
};

export const AdminUsers: React.FC = () => {
  const { data, isLoading } = useAdminUsers(1);

  if (isLoading) return <div>Yükleniyor...</div>;

  return (
    <div className="card">
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <th style={{ padding: 12 }}>ID</th>
            <th>İsim</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Durum</th>
            <th>Risk (AI)</th>
          </tr>
        </thead>
        <tbody>
          {data?.items?.map((user: any) => (
            <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: 12 }}>{user.id}</td>
              <td>{user.first_name} {user.last_name}</td>
              <td>{user.email}</td>
              <td><span className="badge badge-primary">{user.role}</span></td>
              <td>{user.is_active ? 'Aktif' : 'Pasif'}</td>
              <td><FraudRiskBadge userId={user.id} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
