import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Bir sorun oluştu',
  message = 'Veriler yüklenirken hata meydana geldi. Lütfen tekrar deneyin.',
  onRetry,
}) => (
  <div
    className="card"
    role="alert"
    style={{
      textAlign: 'center',
      padding: '40px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
    }}
  >
    <AlertCircle size={36} color="var(--color-error)" />
    <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{title}</h3>
    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: 420 }}>{message}</p>
    {onRetry && (
      <button className="btn btn-outline" onClick={onRetry} style={{ marginTop: 6 }}>
        <RefreshCw size={15} /> Tekrar Dene
      </button>
    )}
  </div>
);

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
}> = ({ icon, title, message, action }) => (
  <div
    className="card"
    style={{
      textAlign: 'center',
      padding: '40px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
    }}
  >
    {icon && <div style={{ opacity: 0.7 }}>{icon}</div>}
    <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{title}</h3>
    {message && <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: 420 }}>{message}</p>}
    {action}
  </div>
);
