import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotify } from '../context/NotificationContext.jsx'

const MAX_ATTEMPTS = 3
const LOCKOUT_SECS = 30

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const notify    = useNotify()
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [loading,    setLoading]    = useState(false)
  const [failCount,  setFailCount]  = useState(0)
  const [countdown,  setCountdown]  = useState(0)
  const lockTimer = useRef(null)

  // Tick the countdown down every second while locked
  useEffect(() => {
    if (countdown <= 0) return
    lockTimer.current = setInterval(() => {
      setCountdown(s => {
        if (s <= 1) { clearInterval(lockTimer.current); setFailCount(0); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(lockTimer.current)
  }, [countdown])

  const locked = countdown > 0

  const submit = async (e) => {
    e.preventDefault()
    if (locked) return
    setLoading(true)
    try {
      const user = await login(email, password)
      setFailCount(0)
      const dest = location.state?.from?.pathname
        ?? (user.role === 'admin' ? '/admin' : user.role === 'owner' ? '/owner' : '/menu')
      navigate(dest, { replace: true })
    } catch (err) {
      const next = failCount + 1
      setFailCount(next)
      if (next >= MAX_ATTEMPTS) {
        setCountdown(LOCKOUT_SECS)
        notify.error(`Too many failed attempts. Try again in ${LOCKOUT_SECS} seconds.`)
      } else {
        notify.error(`${err.message} (${next}/${MAX_ATTEMPTS} attempts)`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">

      {/* ── Decorative left panel ── */}
      <div className="auth-side">
        <div>
          <div className="auth-eyebrow">Welcome back</div>
          <div className="auth-headline">
            Sign in<br/>to your<br/>kitchen.
          </div>
        </div>

        {/* Feature pills */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: '🍽️', label: '360° dish scanning' },
            { icon: '⭐', label: 'Real-time reviews' },
            { icon: '📱', label: 'QR menu sharing' },
          ].map(f => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 16px',
              borderRadius: 12,
              background: 'var(--bg-3)',
              border: '1px solid var(--border)',
              backdropFilter: 'blur(12px)',
            }}>
              <span style={{ fontSize: 18 }}>{f.icon}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--text-2)' }}>
                {f.label}
              </span>
            </div>
          ))}
        </div>

        <div className="auth-foot">↳ Three roles · admin · owner · customer</div>
      </div>

      {/* ── Form panel ── */}
      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>

          <div style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--amber)', marginBottom: 10 }}>
              QRIOUS360
            </div>
            <h2 style={{ fontFamily: 'Barlow Condensed, serif', fontWeight: 700, fontSize: 38, letterSpacing: '0.02em', marginBottom: 8 }}>
              Sign in
            </h2>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '.12em', color: 'var(--text-3)', textTransform: 'uppercase' }}>
              Authenticate to continue
            </p>
          </div>


          <div className="field">
            <label className="field-label">Email address</label>
            <input
              className="field-input"
              type="email" required
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <div className="field">
            <label className="field-label">Password</label>
            <input
              className="field-input"
              type="password" required
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          {locked && (
            <div style={{
              marginTop: 8, marginBottom: 4,
              padding: '12px 16px', borderRadius: 10,
              background: 'rgba(239,68,68,.08)',
              border: '1px solid rgba(239,68,68,.28)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, letterSpacing: '.12em',
              color: 'rgba(239,68,68,.85)',
              textAlign: 'center',
            }}>
              Too many attempts — try again in{' '}
              <span style={{ fontWeight: 700 }}>{countdown}s</span>
            </div>
          )}

          <button
            className="btn"
            disabled={loading || locked}
            style={{ width: '100%', marginTop: 8, padding: '15px 28px', fontSize: 13, opacity: locked ? 0.45 : 1, cursor: locked ? 'not-allowed' : 'pointer' }}
          >
            {loading
              ? <><span style={{ width: 16, height: 16, border: '2px solid var(--border-mid)', borderTop: '2px solid var(--amber)', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Signing in…</>
              : locked ? `Locked — ${countdown}s` : 'Sign in →'
            }
          </button>

          <div className="auth-switch" style={{ marginTop: 24 }}>
            New here? <Link to="/register">Create an account</Link>
          </div>

          {/* Demo credentials */}
          <div style={{
            marginTop: 36,
            padding: '16px 18px',
            background: 'var(--bg-3)',
            border: '1px solid var(--border-mid)',
            borderRadius: 12,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            lineHeight: 1.9,
            letterSpacing: '0.1em',
            color: 'var(--text-2)',
          }}>
            <div style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 6, fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase' }}>Demo accounts</div>
            <div>admin@QRIOUS360.local &nbsp;/&nbsp; admin123</div>
            <div>owner@QRIOUS360.local &nbsp;/&nbsp; admin123</div>
            <div>customer@QRIOUS360.local &nbsp;/&nbsp; admin123</div>
          </div>
        </form>
      </div>
    </div>
  )
}
