import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';
import type { Toast } from '../../stores/toastStore';

const ICONS: Record<Toast['type'], React.ReactNode> = {
  success: <CheckCircle2 size={18} color="var(--color-success)" />,
  error: <AlertCircle size={18} color="var(--color-error)" />,
  info: <Info size={18} color="var(--color-info)" />,
  warning: <AlertTriangle size={18} color="var(--color-warning)" />,
};

const BORDER_COLORS: Record<Toast['type'], string> = {
  success: 'var(--color-success)',
  error: 'var(--color-error)',
  info: 'var(--color-info)',
  warning: 'var(--color-warning)',
};

const ToastItem: React.FC<{ toast: Toast }> = ({ toast: t }) => {
  const remove = useToastStore((s) => s.remove);
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        background: 'var(--color-surface-2)',
        border: `1px solid var(--color-border)`,
        borderLeft: `3px solid ${BORDER_COLORS[t.type]}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        boxShadow: 'var(--shadow-elevated)',
        minWidth: 280,
        maxWidth: 380,
      }}
    >
      <span style={{ flexShrink: 0, marginTop: 1 }}>{ICONS[t.type]}</span>
      <span style={{ fontSize: '0.875rem', lineHeight: 1.45, flex: 1 }}>{t.message}</span>
      <button
        onClick={() => remove(t.id)}
        aria-label="Bildirimi kapat"
        style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 0, flexShrink: 0 }}
      >
        <X size={15} />
      </button>
    </div>
  );
};

export const Toaster: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
};
