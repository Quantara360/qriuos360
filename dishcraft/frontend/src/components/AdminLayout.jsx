import { useEffect, useState } from 'react'
import { admin as adminApi, messages as msgApi, feedback as feedbackApi } from '../api/client.js'
import AdminSidebar from './AdminSidebar.jsx'

export default function AdminLayout({ children }) {
  const [stats, setStats]                 = useState(null)
  const [msgUnread, setMsgUnread]         = useState(0)
  const [feedbackUnread, setFbUnread]     = useState(0)
  const [sidebarOpen, setSidebarOpen]     = useState(false)

  const refreshUnread = () => {
    msgApi.unreadCount().then(r => setMsgUnread(r.unread_count ?? 0)).catch(() => {})
    feedbackApi.list('new').then(r => setFbUnread((r.feedbacks ?? []).length)).catch(() => {})
  }

  useEffect(() => {
    adminApi.stats().then(r => setStats(r.stats)).catch(() => {})
    refreshUnread()
    const iv = setInterval(refreshUnread, 30000)
    return () => clearInterval(iv)
  }, [])

  const close = () => setSidebarOpen(false)

  return (
    <div className="owner-shell">
      {sidebarOpen && <div className="sidebar-backdrop" onClick={close} />}

      <AdminSidebar stats={stats} msgUnread={msgUnread} feedbackUnread={feedbackUnread} open={sidebarOpen} onClose={close} />
      <main className="owner-content">
        <div className="owner-topbar">
          <button className="owner-topbar-hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle menu">
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <div className="owner-topbar-brand">QRIOUS360</div>
        </div>
        {children}
      </main>
    </div>
  )
}
