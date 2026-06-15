import { useState } from 'react'
import { Link } from 'react-router-dom'
import { feedback as feedbackApi } from '../api/client.js'
import { useNotify } from '../context/NotificationContext.jsx'

;(function injectStyles() {
  let s = document.getElementById('fb-css')
  if (!s) { s = document.createElement('style'); s.id = 'fb-css'; document.head.appendChild(s) }
  s.textContent = `
    @keyframes fb-in  { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fb-pop { from{opacity:0;transform:scale(.92)}        to{opacity:1;transform:scale(1)}     }
    .fb-wrap   { animation: fb-in  .65s cubic-bezier(.22,1,.36,1) both; }
    .fb-success{ animation: fb-pop .55s cubic-bezier(.22,1,.36,1) both; }

    .fb-star-btn { background:none; border:none; cursor:pointer; padding:4px; line-height:1; transition:transform .15s; }
    .fb-star-btn:hover { transform:scale(1.22); }

    .fb-subject-pill {
      font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:.14em; text-transform:uppercase;
      padding:7px 14px; border-radius:20px; border:1px solid var(--border); background:var(--bg-2);
      color:var(--text-3); cursor:pointer; transition:border-color .2s, background .2s, color .2s;
      white-space:nowrap;
    }
    .fb-subject-pill:hover  { border-color:var(--border-mid); color:var(--text-2); }
    .fb-subject-pill.active { border-color:var(--amber); background:rgba(212,150,58,.08); color:var(--amber); }

    .fb-info-item { display:flex; gap:16px; padding:20px 0; border-bottom:1px solid var(--border); }
    .fb-info-item:last-child { border-bottom:none; padding-bottom:0; }

    @media(max-width:780px){
      .fb-layout { grid-template-columns:1fr !important; }
      .fb-sidebar { position:static !important; }
    }
  `
})()

const SUBJECTS = ['General Inquiry','Menu Feedback','Food Quality','Service Experience','App Issue','Partnership','Other']

const RATING_LABELS = ['','Poor','Fair','Good','Very Good','Excellent']

export default function CustomerFeedback() {
  const notify = useNotify()
  const [form, setForm]         = useState({ name:'', email:'', subject:'General Inquiry', message:'', rating:0 })
  const [hoverRating, setHover] = useState(0)
  const [sending, setSending]   = useState(false)
  const [success, setSuccess]   = useState(false)

  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const displayRating = hoverRating || form.rating

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim())    { notify.error('Please enter your name.');    return }
    if (!form.message.trim()) { notify.error('Please write your message.'); return }
    setSending(true)
    try {
      await feedbackApi.submit({ name: form.name, email: form.email, subject: form.subject, message: form.message, rating: form.rating || null })
      setSuccess(true)
      notify.success('Feedback sent — thank you!')
    } catch (err) {
      notify.error(err.message)
    } finally {
      setSending(false)
    }
  }

  const resetForm = () => {
    setSuccess(false)
    setForm({ name:'', email:'', subject:'General Inquiry', message:'', rating:0 })
  }

  /* ── Success state ── */
  if (success) return (
    <div className="page" style={{ maxWidth:680, textAlign:'center' }}>
      <div className="fb-success" style={{ padding:'80px 24px' }}>
        <div style={{ fontSize:64, marginBottom:24, lineHeight:1 }}>🙏</div>
        <h2 style={{ fontFamily:'Barlow Condensed,serif', fontWeight:700, fontSize:clamp(28,36), letterSpacing:'0.02em', marginBottom:14 }}>
          Thank you, <em style={{ background:'var(--grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{form.name}!</em>
        </h2>
        <p style={{ fontFamily:'Barlow Condensed,serif', fontStyle:'normal', fontSize:15, color:'var(--text-2)', lineHeight:1.72, maxWidth:400, margin:'0 auto 36px' }}>
          Your feedback has been received and will be reviewed by our team. We appreciate you taking the time to help us improve.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/"><button className="btn">Go home</button></Link>
          <button className="btn btn-ghost" onClick={resetForm}>Send another</button>
        </div>
      </div>
    </div>
  )

  /* ── Main form ── */
  return (
    <div className="page" style={{ maxWidth:1040 }}>

      {/* Header */}
      <div className="page-header" style={{ marginBottom:56 }}>
        <div>
          <div className="page-eyebrow">QRIOUS360 · Guest voice</div>
          <h1 className="page-title">Share your feedback.</h1>
          <p style={{ fontFamily:'Barlow Condensed,serif', fontStyle:'normal', fontSize:15, color:'var(--text-2)', marginTop:10, maxWidth:480 }}>
            Every message is read by our team. Your experience shapes the platform.
          </p>
        </div>
        <Link to="/"><button className="btn btn-ghost" style={{ flexShrink:0 }}>← Back home</button></Link>
      </div>

      <div className="fb-wrap fb-layout" style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:56, alignItems:'start' }}>

        {/* ── Sidebar ── */}
        <aside className="fb-sidebar" style={{ position:'sticky', top:100 }}>

          <div style={{ fontFamily:'JetBrains Mono', fontSize:9, textTransform:'uppercase', letterSpacing:'.26em', color:'var(--amber)', marginBottom:24 }}>
            Why your voice matters
          </div>

          <div className="vbg-panel" style={{ border:'1px solid var(--border)', borderRadius:20, background:'var(--bg-2)', padding:'8px 24px 20px' }}>
            {[
              { icon:'🍽️', t:'Shape the menu',       d:'Your feedback directly influences what hotels feature and improve.' },
              { icon:'⭐', t:'Rate your experience',  d:'Help other diners make confident ordering decisions.' },
              { icon:'💬', t:'Reach our team',        d:'We read every message and respond within 24 hours.' },
            ].map((item, i) => (
              <div key={i} className="fb-info-item">
                <div style={{ fontSize:24, flexShrink:0, lineHeight:1.3 }}>{item.icon}</div>
                <div>
                  <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:15.5, fontWeight:500, color:'var(--text)', marginBottom:6 }}>{item.t}</div>
                  <div style={{ fontFamily:'JetBrains Mono', fontSize:9.5, color:'var(--text-3)', letterSpacing:'.1em', lineHeight:1.75 }}>{item.d}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:20, padding:'16px 20px', border:'1px solid var(--border)', borderRadius:14, background:'var(--glass)', fontFamily:'JetBrains Mono', fontSize:9, letterSpacing:'.1em', color:'var(--text-3)', lineHeight:1.9 }}>
            <div style={{ color:'var(--text-2)', marginBottom:4, fontWeight:600 }}>Privacy note</div>
            Your name and email are only used to respond to your message and are never shared with third parties.
          </div>
        </aside>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit}>

          {/* Name + Email */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:28 }}>
            <div className="field" style={{ margin:0 }}>
              <label className="field-label">Your name *</label>
              <input className="field-input" required value={form.name} onChange={upd('name')} placeholder="e.g. Sarah Johnson" />
            </div>
            <div className="field" style={{ margin:0 }}>
              <label className="field-label">Email <span style={{ color:'var(--text-3)', fontWeight:400 }}>(optional)</span></label>
              <input className="field-input" type="email" value={form.email} onChange={upd('email')} placeholder="for a reply from us" />
            </div>
          </div>

          {/* Subject pills */}
          <div style={{ marginBottom:32 }}>
            <div className="field-label" style={{ marginBottom:12 }}>Subject</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {SUBJECTS.map(s => (
                <button
                  key={s} type="button"
                  className={`fb-subject-pill${form.subject === s ? ' active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, subject: s }))}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Star rating */}
          <div className="vbg-panel" style={{ marginBottom:32, padding:'24px 28px', border:'1px solid var(--border)', borderRadius:18, background:'var(--bg-2)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div className="field-label" style={{ margin:0 }}>Overall rating</div>
              {form.rating > 0 && (
                <button type="button" onClick={() => setForm(f => ({ ...f, rating:0 }))}
                  style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text-3)', letterSpacing:'.12em' }}>
                  clear
                </button>
              )}
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" className="fb-star-btn"
                  onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
                  onClick={() => setForm(f => ({ ...f, rating: f.rating === n ? 0 : n }))}
                  aria-label={`${n} star${n !== 1 ? 's' : ''}`}
                >
                  <svg width="34" height="34" viewBox="0 0 24 24"
                    fill={n <= displayRating ? 'var(--amber)' : 'none'}
                    stroke={n <= displayRating ? 'var(--amber)' : 'var(--border-hi)'}
                    strokeWidth="1.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
              {displayRating > 0 && (
                <span style={{ fontFamily:'Barlow Condensed,serif', fontStyle:'normal', fontSize:16, color:'var(--amber)', marginLeft:8 }}>
                  {RATING_LABELS[displayRating]}
                </span>
              )}
            </div>
          </div>

          {/* Message */}
          <div style={{ marginBottom:32 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
              <label className="field-label" style={{ margin:0 }}>Your message *</label>
              <span style={{ fontFamily:'JetBrains Mono', fontSize:8.5, color:'var(--text-3)', letterSpacing:'.1em' }}>
                {form.message.length} chars
              </span>
            </div>
            <textarea
              className="field-textarea"
              rows={7}
              required
              value={form.message}
              onChange={upd('message')}
              placeholder="Tell us about your experience, suggestions, or anything you'd like us to know…"
              style={{ resize:'vertical' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:14, alignItems:'center' }}>
            <button className="btn" disabled={sending} style={{ minWidth:160 }}>
              {sending ? 'Sending…' : 'Send feedback'}
            </button>
            <Link to="/"><button type="button" className="btn btn-ghost">Cancel</button></Link>
          </div>

        </form>
      </div>
    </div>
  )
}
