import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { subscriptions as subApi, dishes as dishApi, notifications as notifApi, messages as msgApi } from '../api/client.js'
import OwnerSidebar from './OwnerSidebar.jsx'

;(function injectStyles() {
  if (document.getElementById('owner-layout-css')) return
  const s = document.createElement('style')
  s.id = 'owner-layout-css'
  s.textContent = `
    @keyframes ol-police {
      0%,49%   { box-shadow: inset 0 0 0 5px #ef4444, inset 0 0 90px rgba(239,68,68,0.2); }
      50%,100% { box-shadow: inset 0 0 0 5px #3b82f6, inset 0 0 90px rgba(59,130,246,0.2); }
    }
    @keyframes ol-banner-pulse {
      0%,100% { opacity: 1; }
      50%     { opacity: 0.75; }
    }
    .ol-police-overlay {
      position: fixed; inset: 0; pointer-events: none; z-index: 8999;
      animation: ol-police 0.85s step-start infinite;
    }
    .ol-sub-banner {
      display: flex; align-items: center; gap: 12; padding: 11px 20px;
      background: rgba(239,68,68,0.15); border-bottom: 1px solid rgba(239,68,68,0.4);
      animation: ol-banner-pulse 1.2s ease-in-out infinite;
    }
  `
  document.head.appendChild(s)
})()

export default function OwnerLayout({ children }) {
  const { user } = useAuth()
  const [quota,            setQuota]            = useState(0)
  const [dishCount,        setDishCount]        = useState(0)
  const [unreadCount,      setUnreadCount]      = useState(0)
  const [msgUnread,        setMsgUnread]        = useState(0)
  const [sidebarOpen,      setSidebarOpen]      = useState(false)
  const [expiresAt,        setExpiresAt]        = useState(null)
  const [hasPending,       setHasPending]       = useState(false)

  const refreshCounts = () => {
    if (user?.role !== 'owner') return
    notifApi.unreadCount().then(r => setUnreadCount(r.unread_count ?? 0)).catch(() => {})
    msgApi.unreadCount().then(r => setMsgUnread(r.unread_count ?? 0)).catch(() => {})
    subApi.myList()
      .then(s => {
        setQuota(s.quota ?? 0)
        setExpiresAt(s.subscription_expires_at ? new Date(s.subscription_expires_at) : null)
        setHasPending((s.subscriptions ?? []).some(sub => sub.status === 'pending'))
      })
      .catch(() => {})
  }

  useEffect(() => {
    if (user?.role !== 'owner') return
    Promise.all([subApi.myList(), dishApi.mine(), notifApi.unreadCount(), msgApi.unreadCount()])
      .then(([s, d, n, m]) => {
        setQuota(s.quota ?? 0)
        setDishCount(d.dishes?.length ?? 0)
        setUnreadCount(n.unread_count ?? 0)
        setMsgUnread(m.unread_count ?? 0)
        setExpiresAt(s.subscription_expires_at ? new Date(s.subscription_expires_at) : null)
        setHasPending((s.subscriptions ?? []).some(sub => sub.status === 'pending'))
      })
      .catch(() => {})

    const interval = setInterval(refreshCounts, 30000)
    return () => clearInterval(interval)
  }, [user])

  if (user?.role !== 'owner') {
    return <>{children}</>
  }

  const isExpired  = expiresAt ? expiresAt < new Date() : false
  const hasNoSub   = !expiresAt && quota === 0
  const showAlert  = isExpired || hasNoSub || hasPending

  const close = () => setSidebarOpen(false)

  return (
    <div className="owner-shell">
      {/* Police-light overlay — shown when subscription expired or missing */}
      {showAlert && <div className="ol-police-overlay" />}

      {sidebarOpen && <div className="sidebar-backdrop" onClick={close} />}

      <OwnerSidebar
        quota={quota} dishCount={dishCount}
        unreadCount={unreadCount} msgUnread={msgUnread}
        open={sidebarOpen} onClose={close}
      />
      <main className="owner-content">
        <div className="owner-topbar">
          <button className="owner-topbar-hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle menu">
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <div className="owner-topbar-brand">QRIOUS360</div>
        </div>

        {/* Red subscription alert banner */}
        {showAlert && (
          <div className="ol-sub-banner" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', background: 'rgba(239,68,68,0.15)', borderBottom: '1px solid rgba(239,68,68,0.4)', animation: 'ol-banner-pulse 1.2s ease-in-out infinite' }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>🚨</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, color: '#ef4444', letterSpacing: '0.08em', flex: 1 }}>
              {hasPending
                ? (isExpired ? 'Subscription expired — payment pending admin approval. Dishes hidden until approved.' : 'Payment slip submitted — waiting for admin approval. Dishes hidden until approved.')
                : (isExpired ? 'Subscription expired — dishes hidden from menu.' : 'No active subscription — dishes are not visible.')
              }
            </span>
            <Link to="/owner/subscription" style={{ fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ef4444', textDecoration: 'none', padding: '6px 14px', border: '1px solid rgba(239,68,68,0.5)', borderRadius: 8, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {hasPending ? 'View →' : 'Renew →'}
            </Link>
          </div>
        )}

        {children}
      </main>
    </div>
  )
}
