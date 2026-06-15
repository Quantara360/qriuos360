import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { subscriptions as subApi, imageUrl } from '../api/client.js'
import { useNotify } from '../context/NotificationContext.jsx'

;(function injectStyles() {
  if (document.getElementById('sub-css')) return
  const s = document.createElement('style')
  s.id = 'sub-css'
  s.textContent = `
    @keyframes sub-police {
      0%,49%   { box-shadow: inset 0 0 0 5px #ef4444, inset 0 0 90px rgba(239,68,68,0.22); }
      50%,100% { box-shadow: inset 0 0 0 5px #3b82f6, inset 0 0 90px rgba(59,130,246,0.22); }
    }
    @keyframes sub-banner-pulse {
      0%,100% { background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.38); }
      50%     { background: rgba(239,68,68,0.20); border-color: rgba(239,68,68,0.60); }
    }
    @keyframes sub-pending-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    .sub-police-overlay {
      position: fixed; inset: 0; pointer-events: none; z-index: 9000;
      animation: sub-police 0.85s step-start infinite;
    }
    .sub-expired-banner {
      display: flex; align-items: center; gap: 16px;
      padding: 18px 24px; border-radius: 14px;
      border: 1px solid rgba(239,68,68,0.38);
      background: rgba(239,68,68,0.12);
      margin-bottom: 28px;
      animation: sub-banner-pulse 1.1s ease-in-out infinite;
    }
    .sub-section {
      padding: 26px 28px; border: 1px solid var(--border);
      border-radius: 16px; background: var(--bg-2); margin-bottom: 28px;
    }
    .sub-section-title {
      font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
      font-size: 20px; letter-spacing: 0.04em; color: var(--text);
      margin-bottom: 4px;
    }
    .sub-section-sub {
      font-family: 'JetBrains Mono', monospace; font-size: 9px;
      text-transform: uppercase; letter-spacing: 0.18em; color: var(--text-3);
      margin-bottom: 20px;
    }
    .sub-pending-card {
      display: flex; align-items: flex-start; gap: 16px;
      padding: 18px 20px; border-radius: 12px;
      border: 1px solid rgba(245,166,35,0.45);
      background: rgba(245,166,35,0.07);
      margin-bottom: 12px;
      animation: sub-pending-in .35s cubic-bezier(.22,1,.36,1) both;
    }
    .sub-pending-slip {
      width: 64px; height: 50px; border-radius: 8px;
      object-fit: cover; border: 1px solid var(--border-mid);
      flex-shrink: 0; display: block;
    }
    .sub-history-row {
      display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
      gap: 0; padding: 13px 0; border-bottom: 1px solid var(--border);
      align-items: center;
    }
    .sub-history-row:last-child { border-bottom: none; }
    .sub-history-head {
      display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
      gap: 0; padding: 0 0 10px; border-bottom: 2px solid var(--border-mid);
      margin-bottom: 4px;
    }
    .sub-history-lbl {
      font-family: 'JetBrains Mono', monospace; font-size: 9px;
      text-transform: uppercase; letter-spacing: 0.16em; color: var(--text-3);
    }
    .sub-drop-zone {
      border: 2px dashed var(--border-mid); border-radius: 14px;
      padding: 36px 24px; text-align: center; cursor: pointer;
      transition: border-color .2s, background .2s; position: relative;
    }
    .sub-drop-zone:hover, .sub-drop-zone.drag-active {
      border-color: var(--amber); background: rgba(245,166,35,0.06);
    }
    .sub-drop-zone input[type=file] {
      position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%;
    }
    .sub-slip-preview {
      width: 100%; max-height: 240px; object-fit: contain;
      border-radius: 10px; margin-top: 14px; display: block; border: 1px solid var(--border);
    }
    .plan-card {
      padding: 22px 20px; border-radius: 14px;
      border: 1px solid var(--border); background: var(--bg-3);
      cursor: pointer; transition: border-color .18s, background .18s, transform .12s;
      position: relative; user-select: none;
    }
    .plan-card:hover { border-color: rgba(245,166,35,0.5); background: rgba(245,166,35,0.04); transform: translateY(-1px); }
    .plan-card.selected { border: 2px solid var(--amber); background: rgba(245,166,35,0.07); }
    .plan-card.current-plan { border-color: rgba(34,197,94,0.5); background: rgba(34,197,94,0.04); cursor: default; }
    .plan-card.current-plan:hover { transform: none; }
    @media (max-width: 600px) {
      .sub-history-row, .sub-history-head { grid-template-columns: 1fr 1fr; }
      .plan-grid {
        grid-template-columns: unset !important;
        grid-auto-flow: column;
        grid-auto-columns: 72vw;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 8px;
        scrollbar-width: none;
      }
      .plan-grid::-webkit-scrollbar { display: none; }
      .plan-card { scroll-snap-align: start; padding: 14px 12px; }
    }
  `
  document.head.appendChild(s)
})()

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString(undefined, { day:'numeric', month:'short', year:'numeric' })
}

export default function OwnerSubscription() {
  const navigate  = useNavigate()
  const notify    = useNotify()

  const [data,         setData]         = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [selectedPlan, setSelectedPlan] = useState(null)

  const [slip,         setSlip]         = useState(null)
  const [slipPreview,  setSlipPreview]  = useState(null)
  const [dragging,     setDragging]     = useState(false)
  const [submitting,   setSubmitting]   = useState(false)

  const load = () => {
    setLoading(true)
    subApi.myList()
      .then(d => {
        setData(d)
        setSelectedPlan(null)
      })
      .catch(err => notify.error(err.message))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleFile = (file) => {
    if (!file) return
    setSlip(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => setSlipPreview(e.target.result)
      reader.readAsDataURL(file)
    } else {
      setSlipPreview(null)
    }
  }

  const resetSlip = () => { setSlip(null); setSlipPreview(null) }

  const submitSlip = async (e) => {
    e.preventDefault()
    if (!selectedPlan) { notify.error('Please select a plan first'); return }
    if (!slip)         { notify.error('Please upload your payment slip'); return }
    setSubmitting(true)
    try {
      const res = await subApi.uploadSlip(selectedPlan.id, slip)
      notify.success(res.message)
      resetSlip()
      load()
    } catch (err) {
      notify.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const used      = data?.used  ?? 0
  const quota     = data?.quota ?? 0
  const pct       = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0
  const remaining = Math.max(0, quota - used)

  const expiresAt  = data?.subscription_expires_at ? new Date(data.subscription_expires_at) : null
  const isExpired  = expiresAt ? expiresAt < new Date() : false
  const isActive   = expiresAt ? expiresAt >= new Date() : false
  const daysLeft   = isActive ? Math.ceil((expiresAt - new Date()) / 86400000) : 0

  const pendingSubs = data?.subscriptions?.filter(s => s.status === 'pending') ?? []
  const historySubs = data?.subscriptions?.filter(s => s.status !== 'pending') ?? []
  const hasPending  = pendingSubs.length > 0

  const plans        = data?.plans ?? []
  const currentPlan  = data?.current_plan ?? null
  const upcomingPlan = data?.upcoming_plan ?? null

  const needsAction = !loading && (isExpired || (!isActive && quota === 0))
  const showAlert   = needsAction
  const showPolice  = needsAction && !hasPending

  return (
    <div className="page">
      {showPolice && <div className="sub-police-overlay" />}

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Owner workspace · Subscription</div>
          <h1 className="page-title">Subscription plans.</h1>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/owner')}>← Dashboard</button>
      </div>

      {/* Alert banner */}
      {showAlert && (
        <div className="sub-expired-banner" style={hasPending ? {
          background: 'rgba(245,166,35,0.10)',
          borderColor: 'rgba(245,166,35,0.40)',
          animation: 'none',
        } : {}}>
          <div style={{ fontSize: 32, flexShrink: 0 }}>{hasPending ? '⏳' : '🚨'}</div>
          <div>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:13, fontWeight:700, color: hasPending ? 'var(--amber)' : '#ef4444', letterSpacing:'0.08em', marginBottom:5 }}>
              {hasPending ? 'PAYMENT UNDER REVIEW' : isExpired ? 'SUBSCRIPTION EXPIRED' : 'NO ACTIVE SUBSCRIPTION'}
            </div>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text-2)', letterSpacing:'0.06em', lineHeight:1.6 }}>
              {hasPending
                ? 'Payment slip submitted — waiting for admin approval. Your quota will be restored once approved.'
                : isExpired
                  ? `Expired on ${expiresAt?.toLocaleDateString()}. Dishes are hidden from public menu until renewed.`
                  : 'Select a plan below and upload your payment slip to get started.'}
            </div>
          </div>
        </div>
      )}

      {/* Active subscription status bar */}
      {isActive && !loading && (
        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 22px', borderRadius:12, border:'1px solid rgba(34,197,94,0.35)', background:'rgba(34,197,94,0.07)', marginBottom:28 }}>
          <span style={{ fontSize:22, flexShrink:0 }}>✅</span>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:11, fontWeight:700, color:'#22c55e', letterSpacing:'0.08em', marginBottom:2 }}>
              {currentPlan?.name ? `${currentPlan.name} Plan — Active` : 'Subscription Active'}
            </div>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text-3)', letterSpacing:'0.08em' }}>
              {currentPlan?.dishes ?? quota} dishes · Expires {expiresAt?.toLocaleDateString(undefined, { day:'numeric', month:'long', year:'numeric' })} · {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
            </div>
          </div>
          {daysLeft <= 7 && (
            <span style={{ fontFamily:'JetBrains Mono', fontSize:9, padding:'4px 10px', borderRadius:20, background:'rgba(245,166,35,0.14)', border:'1px solid rgba(245,166,35,0.4)', color:'var(--amber)', letterSpacing:'0.1em', textTransform:'uppercase', flexShrink:0 }}>
              Renew soon
            </span>
          )}
        </div>
      )}

      {/* Upcoming plan banner */}
      {upcomingPlan && !loading && (
        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 22px', borderRadius:12, border:'1px solid rgba(59,130,246,0.35)', background:'rgba(59,130,246,0.07)', marginBottom:28 }}>
          <span style={{ fontSize:22, flexShrink:0 }}>🔄</span>
          <div>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:11, fontWeight:700, color:'#3b82f6', letterSpacing:'0.08em', marginBottom:2 }}>
              Plan Change Scheduled
            </div>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text-3)', letterSpacing:'0.08em' }}>
              Switching to <strong style={{ color:'var(--text-2)' }}>{upcomingPlan.name}</strong> ({upcomingPlan.dishes} dishes) after current plan expires on {fmt(expiresAt?.toISOString())}
            </div>
          </div>
        </div>
      )}

      {/* ── 1. CURRENT QUOTA ── */}
      <div className="sub-section">
        <div className="sub-section-title">Current Quota</div>
        <div className="sub-section-sub">Your dish creation allowance this period</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:20 }}>
          {[['Dishes used', used], ['Total quota', quota], ['Remaining', remaining]].map(([label, val]) => (
            <div key={label} className="stat-card">
              <div className="stat-label">{label}</div>
              <div className="stat-value">{val}</div>
            </div>
          ))}
        </div>
        {quota > 0 && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--text-3)' }}>Usage</span>
              <span style={{ fontFamily:'JetBrains Mono', fontSize:10, color: pct >= 90 ? 'var(--bad)' : 'var(--text-2)' }}>{pct}%</span>
            </div>
            <div style={{ height:8, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background: pct >= 90 ? 'var(--bad)' : pct >= 60 ? 'var(--amber)' : 'var(--good)', borderRadius:4, transition:'width 0.4s ease' }} />
            </div>
          </>
        )}
        {quota === 0 && !loading && (
          <p style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--bad)', letterSpacing:'0.12em', marginTop:8 }}>
            No active subscription — select a plan below.
          </p>
        )}
      </div>

      {/* ── 2. PENDING PAYMENTS ── */}
      {!loading && pendingSubs.length > 0 && (
        <div className="sub-section" style={{ borderColor:'rgba(245,166,35,0.4)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <div className="sub-section-title" style={{ color:'var(--amber)' }}>Pending Payments</div>
            <span style={{ fontFamily:'JetBrains Mono', fontSize:9, padding:'3px 10px', borderRadius:20, background:'rgba(245,166,35,0.15)', border:'1px solid rgba(245,166,35,0.4)', color:'var(--amber)', letterSpacing:'0.12em' }}>
              {pendingSubs.length} awaiting approval
            </span>
          </div>
          <div className="sub-section-sub">Submitted slips — waiting for admin to verify and approve</div>

          {pendingSubs.map((s, idx) => (
            <div key={s.id} className="sub-pending-card" style={{ animationDelay:`${idx * 60}ms` }}>
              <div style={{ flexShrink:0 }}>
                {s.slip_path ? (
                  s.slip_path.endsWith('.pdf') ? (
                    <a href={imageUrl(s.slip_path)} target="_blank" rel="noreferrer"
                      style={{ display:'flex', alignItems:'center', justifyContent:'center', width:64, height:50, borderRadius:8, background:'var(--bg-3)', border:'1px solid var(--border-mid)', fontFamily:'JetBrains Mono', fontSize:9, color:'var(--amber)', textDecoration:'none', letterSpacing:'0.08em', textTransform:'uppercase' }}>
                      PDF
                    </a>
                  ) : (
                    <a href={imageUrl(s.slip_path)} target="_blank" rel="noreferrer">
                      <img src={imageUrl(s.slip_path)} className="sub-pending-slip" alt="slip" />
                    </a>
                  )
                ) : (
                  <div style={{ width:64, height:50, borderRadius:8, background:'var(--bg-3)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, opacity:0.3 }}>📄</div>
                )}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px,1fr))', gap:'8px 20px', marginBottom:10 }}>
                  {[
                    ['Plan',      s.plan_name ?? `${s.dishes_requested} dishes`],
                    ['Dishes',    `${s.dishes_requested}`],
                    ['Amount',    `LKR ${Number(s.amount_lkr).toLocaleString()}`],
                    ['Submitted', fmt(s.created_at)],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontFamily:'JetBrains Mono', fontSize:9, textTransform:'uppercase', letterSpacing:'0.16em', color:'var(--text-3)', marginBottom:2 }}>{k}</div>
                      <div style={{ fontFamily:'Barlow Condensed', fontSize:17, fontWeight:700, color: k === 'Amount' ? 'var(--amber)' : 'var(--text)' }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:20, background:'rgba(245,166,35,0.12)', border:'1px solid rgba(245,166,35,0.4)' }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--amber)', display:'inline-block', flexShrink:0 }} />
                  <span style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--amber)', letterSpacing:'0.14em', textTransform:'uppercase' }}>Awaiting admin approval</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 3. PLAN SELECTION ── */}
      {!loading && (
        <div className="sub-section">
          <div className="sub-section-title">
            {isActive ? (upcomingPlan ? 'Your Plans' : 'Renew or Change Plan') : 'Select a Subscription Plan'}
          </div>
          <div className="sub-section-sub">
            {isActive
              ? `Selecting a different plan takes effect after your current plan expires on ${fmt(expiresAt?.toISOString())}`
              : 'Choose a plan, upload your payment slip — admin will activate it after approval'}
          </div>

          {plans.length === 0 ? (
            <div style={{ padding:'24px', borderRadius:12, border:'1px dashed var(--border)', textAlign:'center' }}>
              <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text-3)' }}>No subscription plans available — contact admin.</div>
            </div>
          ) : (
            <>
              {/* Plan cards grid */}
              <div className="plan-grid" style={{ display:'grid', gridTemplateColumns:`repeat(${plans.length}, 1fr)`, gap:10, marginBottom:24 }}>
                {plans.map(plan => {
                  const isCurrent  = currentPlan?.id === plan.id && isActive
                  const isUpcoming = upcomingPlan?.id === plan.id
                  const isSelected = selectedPlan?.id === plan.id
                  const isDisabled = hasPending || (isCurrent && !isExpired)
                  return (
                    <div
                      key={plan.id}
                      className={`plan-card${isSelected ? ' selected' : ''}${isCurrent ? ' current-plan' : ''}`}
                      onClick={() => {
                        if (isDisabled) return
                        setSelectedPlan(isSelected ? null : plan)
                        resetSlip()
                      }}
                      style={{ opacity: hasPending ? 0.7 : 1 }}
                    >
                      {isCurrent && (
                        <div style={{ position:'absolute', top:10, right:12, fontFamily:'JetBrains Mono', fontSize:8, textTransform:'uppercase', letterSpacing:'0.12em', color:'#22c55e', background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.3)', padding:'2px 8px', borderRadius:20 }}>
                          Current
                        </div>
                      )}
                      {isUpcoming && (
                        <div style={{ position:'absolute', top:10, right:12, fontFamily:'JetBrains Mono', fontSize:8, textTransform:'uppercase', letterSpacing:'0.12em', color:'#3b82f6', background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.3)', padding:'2px 8px', borderRadius:20 }}>
                          Next
                        </div>
                      )}
                      {isSelected && !isCurrent && (
                        <div style={{ position:'absolute', top:10, right:12, fontSize:16, color:'var(--amber)' }}>✓</div>
                      )}
                      <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:22, color:'var(--text)', marginBottom:8 }}>
                        {plan.name}
                      </div>
                      <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:42, color:'var(--amber)', lineHeight:1, marginBottom:4 }}>
                        {plan.dishes}
                        <span style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text-3)', marginLeft:6, fontWeight:400 }}>dishes</span>
                      </div>
                      <div style={{ fontFamily:'JetBrains Mono', fontSize:12, color:'var(--text-2)', fontWeight:600 }}>
                        LKR {Number(plan.price_lkr).toLocaleString()}
                        <span style={{ color:'var(--text-3)', fontWeight:400 }}> / month</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Slip upload form — shown only after plan is selected and no pending */}
              {!hasPending && selectedPlan && (
                <div style={{ padding:'22px 24px', borderRadius:14, border:'1px solid rgba(245,166,35,0.35)', background:'rgba(245,166,35,0.04)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, flexWrap:'wrap' }}>
                    <div>
                      <div style={{ fontFamily:'JetBrains Mono', fontSize:9, textTransform:'uppercase', letterSpacing:'0.16em', color:'var(--text-3)', marginBottom:4 }}>Selected plan</div>
                      <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:20, fontWeight:700, color:'var(--text)' }}>
                        {selectedPlan.name} · {selectedPlan.dishes} dishes
                      </div>
                    </div>
                    <div style={{ flex:1 }} />
                    <div style={{ textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                      <div>
                        <div style={{ fontFamily:'JetBrains Mono', fontSize:9, textTransform:'uppercase', letterSpacing:'0.16em', color:'var(--text-3)', marginBottom:4 }}>Amount due</div>
                        <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:28, fontWeight:700, color:'var(--amber)' }}>
                          LKR {Number(selectedPlan.price_lkr).toLocaleString()}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedPlan(null); resetSlip() }}
                        style={{ fontFamily:'JetBrains Mono', fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-3)', background:'none', border:'1px solid var(--border)', borderRadius:6, padding:'4px 10px', cursor:'pointer' }}
                      >
                        Change plan
                      </button>
                    </div>
                  </div>

                  {isActive && (
                    <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.25)', fontFamily:'JetBrains Mono', fontSize:10, color:'#60a5fa', letterSpacing:'0.08em', marginBottom:16, lineHeight:1.6 }}>
                      ℹ This plan activates after your current plan expires on <strong>{fmt(expiresAt?.toISOString())}</strong>. Pay now and admin will approve it for the next cycle.
                    </div>
                  )}

                  <form onSubmit={submitSlip} style={{ display:'flex', flexDirection:'column', gap:14, maxWidth:460 }}>
                    <div
                      className={`sub-drop-zone${dragging ? ' drag-active' : ''}`}
                      onDragOver={e => { e.preventDefault(); setDragging(true) }}
                      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false) }}
                      onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
                    >
                      <input type="file" accept="image/*,application/pdf" onChange={e => { handleFile(e.target.files[0]); e.target.value = '' }} />
                      {slipPreview ? (
                        <img src={slipPreview} className="sub-slip-preview" alt="Slip preview" />
                      ) : (
                        <>
                          <div style={{ fontSize:40, marginBottom:10, opacity:0.45 }}>📄</div>
                          <div style={{ fontFamily:'JetBrains Mono', fontSize:12, color:'var(--text-2)', marginBottom:6 }}>
                            {slip ? slip.name : 'Click or drag your payment slip here'}
                          </div>
                          <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text-3)', letterSpacing:'0.12em', textTransform:'uppercase' }}>
                            JPG · PNG · WEBP · PDF · max 8 MB
                          </div>
                        </>
                      )}
                    </div>

                    {slip && (
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderRadius:10, background:'var(--bg-3)', border:'1px solid var(--border)' }}>
                        <span style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text-2)', letterSpacing:'0.08em' }}>
                          {slip.name} · {(slip.size / 1024).toFixed(0)} KB
                        </span>
                        <button type="button" onClick={resetSlip} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:18, padding:0, lineHeight:1 }}>×</button>
                      </div>
                    )}

                    <button className="btn" disabled={submitting || !slip}>
                      {submitting ? 'Submitting…' : `Submit payment for ${selectedPlan.name} Plan · LKR ${Number(selectedPlan.price_lkr).toLocaleString()}`}
                    </button>
                  </form>
                </div>
              )}

              {/* Pending state message */}
              {hasPending && (
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px', borderRadius:12, background:'rgba(245,166,35,0.08)', border:'1px solid rgba(245,166,35,0.3)' }}>
                  <span style={{ fontSize:26 }}>⏳</span>
                  <div>
                    <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:17, color:'var(--amber)' }}>Payment Slip Submitted</div>
                    <div style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text-3)', letterSpacing:'0.08em', marginTop:3 }}>
                      Waiting for admin approval. You cannot submit another request until the current one is resolved.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── 4. HISTORY ── */}
      {historySubs.length > 0 && (
        <div className="sub-section">
          <div className="sub-section-title">Subscription History</div>
          <div className="sub-section-sub">All approved and rejected plan requests</div>

          <div className="sub-history-head">
            {['Purchased', 'Plan', 'Amount (LKR)', 'Expires', 'Status'].map(h => (
              <div key={h} className="sub-history-lbl">{h}</div>
            ))}
          </div>

          {historySubs.map(s => {
            const expired = s.expires_at && new Date(s.expires_at) < new Date()
            return (
              <div key={s.id} className="sub-history-row" style={{ background: expired ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text-2)' }}>{fmt(s.created_at)}</div>
                <div>
                  <div style={{ fontFamily:'Barlow Condensed', fontSize:16, fontWeight:700, color:'var(--good)' }}>{s.plan_name ?? `${s.dishes_requested} dishes`}</div>
                  {s.plan_name && <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text-3)' }}>{s.dishes_requested} dishes</div>}
                </div>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--amber)', fontWeight:600 }}>{Number(s.amount_lkr).toLocaleString()}</div>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color: expired ? 'var(--bad)' : s.expires_at ? '#22c55e' : 'var(--text-3)' }}>
                  {s.expires_at
                    ? <>{fmt(s.expires_at)}{expired && <span style={{ marginLeft:6, fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--bad)' }}>(expired)</span>}</>
                    : '—'}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'flex-start' }}>
                  <span className={`role-pill ${s.status === 'approved' ? 'owner' : s.status === 'rejected' ? 'customer' : ''}`}>
                    {s.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
