import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary yakaladi:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-primary mb-2">Bir hata olustu</h2>
            <p className="text-text-muted text-sm mb-4">
              Sayfa yuklenirken beklenmeyen bir hata olustu. Lutfen tekrar deneyin.
            </p>
            {this.state.error && (
              <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg mb-4 font-mono">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Tekrar Dene
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
