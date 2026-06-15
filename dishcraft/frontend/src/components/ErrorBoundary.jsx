import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0e0a04',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          <div style={{
            maxWidth: 600, width: '100%',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: 14,
            padding: '32px 36px',
          }}>
            <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
              Something went wrong
            </div>
            <pre style={{
              color: 'rgba(255,255,255,0.7)', fontSize: 12,
              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              background: 'rgba(0,0,0,0.3)', borderRadius: 8,
              padding: 16, margin: '0 0 20px',
            }}>
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack?.split('\n').slice(0,8).join('\n')}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.4)',
                color: '#ef4444', borderRadius: 8, padding: '8px 20px',
                fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
