import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error in ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || String(this.state.error) || 'An unexpected rendering error occurred';

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          padding: '20px',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: '#1e293b',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            border: '1px solid #334155',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'inline-flex',
              padding: '16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '50%',
              color: '#ef4444',
              marginBottom: '16px'
            }}>
              <AlertTriangle size={36} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '20px', lineHeight: '1.5' }}>
              {errorMsg}
            </p>
            <button
              onClick={this.handleReload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: '#6366f1',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
            >
              <RefreshCw size={16} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
