import { useEffect, useRef, useState } from 'react'
import { messages as msgApi } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotify } from '../context/NotificationContext.jsx'

export default function OwnerMessages() {
  const { user } = useAuth()
  const notify    = useNotify()
  const [admin, setAdmin]       = useState(null)
  const [thread, setThread]     = useState([])
  const [body, setBody]         = useState('')
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(false)
  const bottomRef               = useRef()

  const scrollBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)

  const loadThread = async (adminId) => {
    try {
      const data = await msgApi.thread(adminId)
      setThread(data.messages)
      scrollBottom()
    } catch (err) {
      notify.error(err.message)
    }
  }

  useEffect(() => {
    msgApi.conversations()
      .then(data => {
        const a = data.conversations[0] ?? null
        setAdmin(a)
        if (a) loadThread(a.id)
      })
      .catch(err => notify.error(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Poll every 10 s
  useEffect(() => {
    if (!admin) return
    const iv = setInterval(() => loadThread(admin.id), 10000)
    return () => clearInterval(iv)
  }, [admin])

  const send = async (e) => {
    e.preventDefault()
    if (!body.trim() || !admin) return
    setSending(true)
    try {
      await msgApi.send(admin.id, body.trim())
      setBody('')
      await loadThread(admin.id)
    } catch (err) {
      notify.error(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Owner workspace · Support</div>
          <h1 className="page-title">Messages</h1>
        </div>
      </div>

      {loading ? (
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>Loading…</p>
      ) : !admin ? (
        <div className="empty">
          <div className="empty-mark">◌</div>
          <div className="empty-title">No admin found</div>
          <div className="empty-sub">No admin account exists yet</div>
        </div>
      ) : (
        <div className="chat-shell">
          {/* Header */}
          <div className="chat-header">
            <div className="sidebar-hotel-logo-placeholder" style={{ width: 34, height: 34, fontSize: 14, flexShrink: 0 }}>
              {(admin.name || 'A')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: 'Barlow Condensed, serif', fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{admin.name}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--text-3)' }}>Administrator</div>
            </div>
          </div>

          {/* Thread */}
          <div className="chat-thread">
            {thread.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, fontFamily: 'Barlow Condensed, serif', fontStyle: 'normal', color: 'var(--text-3)' }}>
                No messages yet — send the first one below.
              </div>
            ) : (
              thread.map(m => {
                const mine = m.sender_id == user?.id
                return (
                  <div key={m.id} className={`chat-bubble-wrap ${mine ? 'mine' : 'theirs'}`}>
                    <div className={`chat-bubble ${mine ? 'mine' : 'theirs'}`}>{m.body}</div>
                    <div className="chat-ts">{new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={send} className="chat-input-row">
            <textarea
              className="field-textarea chat-input"
              placeholder="Type a message…"
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e) } }}
              rows={2}
            />
            <button className="btn" disabled={sending || !body.trim()} style={{ alignSelf: 'flex-end', minWidth: 80 }}>
              {sending ? '…' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
