import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { auth as authApi } from '../api/client.js'

const IDLE_MS  = 30 * 60 * 1000       // 30 minutes of inactivity → logout
const WARN_MS  = IDLE_MS - 2 * 60 * 1000  // show warning 2 minutes before
const TICK_MS  = 5_000                 // check every 5 seconds

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [warning, setWarning] = useState(false)
  const [secsLeft, setSecsLeft] = useState(120)
  const lastActivity = useRef(Date.now())

  const refresh = useCallback(async () => {
    try {
      const { user } = await authApi.me()
      setUser(user || null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const login = async (email, password) => {
    const res = await authApi.login(email, password)
    if (res.token) localStorage.setItem('auth_token', res.token)
    lastActivity.current = Date.now()
    setUser(res.user)
    return res.user
  }

  const register = async (data) => authApi.register(data)

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch {}
    localStorage.removeItem('auth_token')
    setUser(null)
    setWarning(false)
  }, [])

  const stayLoggedIn = useCallback(() => {
    lastActivity.current = Date.now()
    setWarning(false)
  }, [])

  // Idle timeout — active only while a user is logged in
  useEffect(() => {
    if (!user) return

    const resetActivity = () => { lastActivity.current = Date.now() }
    ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, resetActivity, { passive: true }))

    const tick = setInterval(() => {
      const idle = Date.now() - lastActivity.current
      if (idle >= IDLE_MS) {
        logout()
      } else if (idle >= WARN_MS) {
        setSecsLeft(Math.ceil((IDLE_MS - idle) / 1000))
        setWarning(true)
      } else {
        setWarning(false)
      }
    }, TICK_MS)

    return () => {
      ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, resetActivity))
      clearInterval(tick)
      setWarning(false)
    }
  }, [user, logout])

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refresh }}>
      {children}
      {warning && user && (
        <IdleWarningModal secsLeft={secsLeft} onStay={stayLoggedIn} onLogout={logout} />
      )}
    </AuthContext.Provider>
  )
}

function IdleWarningModal({ secsLeft, onStay, onLogout }) {
  const mins = Math.floor(secsLeft / 60)
  const secs = secsLeft % 60
  const timeStr = mins > 0
    ? `${mins}:${String(secs).padStart(2, '0')}`
    : `${secs}s`

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: 'linear-gradient(145deg,#1a1208,#0e0a04)',
        border: '1px solid rgba(212,150,58,0.4)',
        borderRadius: 20,
        padding: '40px 48px',
        maxWidth: 420,
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,150,58,0.1)',
      }}>
        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(212,150,58,0.12)',
          border: '1px solid rgba(212,150,58,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="rgba(212,150,58,0.9)" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>

        <div style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700, fontSize: 22,
          color: '#f5f0e8', marginBottom: 10,
        }}>
          Still there?
        </div>

        <div style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontSize: 15, color: 'rgba(245,240,232,0.6)',
          lineHeight: 1.6, marginBottom: 28,
        }}>
          You've been inactive for a while. You'll be logged out automatically in
        </div>

        {/* Countdown */}
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 42, fontWeight: 700,
          color: '#f0b429',
          letterSpacing: '0.05em',
          marginBottom: 32,
          textShadow: '0 0 24px rgba(240,180,41,0.4)',
        }}>
          {timeStr}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onStay}
            style={{
              flex: 1, padding: '12px 0',
              background: 'linear-gradient(135deg,#d4963a,#f0b429)',
              border: 'none', borderRadius: 10,
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700, fontSize: 16,
              color: '#0e0a04', cursor: 'pointer',
              transition: 'opacity .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Stay logged in
          </button>
          <button
            onClick={onLogout}
            style={{
              flex: 1, padding: '12px 0',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 600, fontSize: 16,
              color: 'rgba(245,240,232,0.55)', cursor: 'pointer',
              transition: 'background .2s, color .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(245,240,232,0.85)' }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='rgba(245,240,232,0.55)' }}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}

export const useAuth = () => useContext(AuthContext)
