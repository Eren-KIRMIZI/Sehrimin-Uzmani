import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', gap: 20, padding: 40, textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={32} style={{ color: 'var(--color-error)' }} />
          </div>
          <div>
            <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Beklenmedik Bir Hata Oluştu</h2>
            <p style={{ color: 'var(--color-text-muted)', maxWidth: 400 }}>
              {this.state.error?.message || 'Bir şeyler yanlış gitti.'}
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
            style={{ gap: 8 }}
          >
            <RefreshCw size={16} /> Sayfayı Yenile
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
