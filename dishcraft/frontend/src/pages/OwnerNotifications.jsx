import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { notifications as notifApi, social } from '../api/client.js'
import { useNotify } from '../context/NotificationContext.jsx'

function Stars({ rating }) {
  return <span className="notif-stars">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
}

export default function OwnerNotifications() {
  const notify = useNotify()
  const [list, setList]       = useState([])
  const [unread, setUnread]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [replyingId, setReplyingId] = useState(null)
  const [replyText, setReplyText]   = useState('')
  const [replying, setReplying]     = useState(false)

  const load = () => {
    setLoading(true)
    notifApi.list()
      .then(r => { setList(r.notifications); setUnread(r.unread_count) })
      .catch(err => notify.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    await notifApi.markRead(id).catch(() => {})
    setList(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  const markAll = async () => {
    await notifApi.markAllRead().catch(() => {})
    setList(prev => prev.map(n => ({ ...n, is_read: 1 })))
    setUnread(0)
  }

  const submitReply = async (reviewId, notifId) => {
    if (!replyText.trim()) return
    setReplying(true)
    try {
      await social.replyReview(reviewId, replyText.trim())
      setList(prev => prev.map(n => n.id === notifId ? { ...n, owner_replied: 1 } : n))
      setReplyingId(null)
      setReplyText('')
      notify.success('Reply posted')
    } catch (err) {
      notify.error(err.message)
    } finally {
      setReplying(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Owner workspace · Activity</div>
          <h1 className="page-title">
            Notifications
            {unread > 0 && (
              <span style={{ marginLeft: 16, fontSize: 18, fontFamily: 'JetBrains Mono', background: 'var(--bad)', color: '#fff', borderRadius: 12, padding: '2px 10px', verticalAlign: 'middle', fontStyle: 'normal' }}>
                {unread} new
              </span>
            )}
          </h1>
        </div>
        {unread > 0 && <button className="btn btn-ghost" onClick={markAll}>Mark all as read</button>}
      </div>

      {loading ? (
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>Loading…</p>
      ) : list.length === 0 ? (
        <div className="empty">
          <div className="empty-mark">◌</div>
          <div className="empty-title">No notifications</div>
          <div className="empty-sub">Customer reviews will appear here</div>
        </div>
      ) : (
        <div className="notif-list">
          {list.map(n => (
            <div key={n.id}>
              <div
                className={`notif-item${n.is_read == 0 ? ' unread' : ''}`}
                onClick={() => n.is_read == 0 && markRead(n.id)}
              >
                {n.is_read == 0 && <div className="notif-dot" />}

                {n.dish_id ? (
                  <Link to={`/dish/${n.dish_id}`} onClick={e => e.stopPropagation()}>
                    <div className="notif-dish-img-placeholder">🍽</div>
                  </Link>
                ) : (
                  <div className="notif-dish-img-placeholder">🍽</div>
                )}

                <div className="notif-body" style={{ flex: 1 }}>
                  <div className="notif-title">
                    {n.dish_id
                      ? <Link to={`/dish/${n.dish_id}`} onClick={e => e.stopPropagation()} style={{ color: 'inherit' }}>{n.dish_name}</Link>
                      : n.dish_name
                    }
                  </div>
                  <div className="notif-reviewer">{n.reviewer_name} left a review</div>
                  {n.comment && <div className="notif-comment">"{n.comment}"</div>}
                  <div className="notif-meta">
                    <Stars rating={Number(n.rating)} />
                    <span>{n.rating}/5</span>
                    <span>·</span>
                    <span>{new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Reply button — only if we have a review_id and haven't replied yet */}
                {n.review_id && !n.owner_replied && (
                  <button
                    className="btn btn-ghost btn-tiny"
                    style={{ alignSelf: 'flex-start', flexShrink: 0 }}
                    onClick={e => {
                      e.stopPropagation()
                      setReplyingId(replyingId === n.id ? null : n.id)
                      setReplyText('')
                    }}
                  >
                    {replyingId === n.id ? 'Cancel' : 'Reply'}
                  </button>
                )}
                {n.owner_replied && (
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--good)', alignSelf: 'flex-start', flexShrink: 0 }}>
                    Replied ✓
                  </span>
                )}
              </div>

              {/* Inline reply form */}
              {replyingId === n.id && (
                <div className="notif-reply-form">
                  <textarea
                    className="field-textarea"
                    placeholder={`Reply to ${n.reviewer_name}…`}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    rows={3}
                    style={{ width: '100%', marginBottom: 10 }}
                  />
                  <button
                    className="btn btn-tiny"
                    disabled={replying || !replyText.trim()}
                    onClick={() => submitReply(n.review_id, n.id)}
                  >
                    {replying ? 'Saving…' : 'Post reply'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
