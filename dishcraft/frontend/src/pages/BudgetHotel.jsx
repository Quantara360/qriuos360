import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { auth as authApi, dishes as dishApi, categories as catApi, imageUrl } from '../api/client.js'

;(function injectStyles() {
  let s = document.getElementById('bh-css')
  if (!s) { s = document.createElement('style'); s.id = 'bh-css'; document.head.appendChild(s) }
  s.textContent = `
    @keyframes bh-card-in   { 0%{opacity:0;transform:translateY(22px) scale(.95)} 65%{transform:translateY(-4px) scale(1.015)} 100%{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes bh-shimmer   { from{transform:translateX(-100%) skewX(-14deg)} to{transform:translateX(280%) skewX(-14deg)} }
    @keyframes bh-badge-pop { 0%{transform:scale(0) rotate(-18deg)} 65%{transform:scale(1.3) rotate(6deg)} 100%{transform:scale(1) rotate(0)} }
    @keyframes bh-cart-pulse{ 0%,100%{box-shadow:0 0 0 1px rgba(224,152,48,.2),0 4px 18px rgba(224,152,48,.1)} 50%{box-shadow:0 0 0 1px rgba(224,152,48,.55),0 8px 32px rgba(224,152,48,.28)} }
    @keyframes bh-bar-in    { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
    @keyframes bh-modal-bg  { from{opacity:0} to{opacity:1} }
    @keyframes bh-modal-in  { from{opacity:0;transform:scale(.9) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
    @keyframes bh-cat-in    { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:translateX(0)} }
    @keyframes bh-line-grow { from{transform:scaleX(0)} to{transform:scaleX(1)} }
    @keyframes bh-price-glow{ 0%,100%{text-shadow:none} 50%{text-shadow:0 0 14px rgba(224,152,48,.55)} }
    @keyframes bh-spin      { to{transform:rotate(360deg)} }

    /* ── Dish Carousel (5-card sliding track) ── */
    .bh-carousel-wrap {
      position: relative;
      margin-top: 18px;
    }

    .bh-carousel-outer {
      overflow: hidden;
      position: relative;
    }
    .bh-carousel-outer::before,
    .bh-carousel-outer::after {
      content:''; position:absolute; top:0; bottom:0; width:80px; z-index:10; pointer-events:none;
    }
    .bh-carousel-outer::before { left:0;  background:linear-gradient(to right, var(--bg), transparent); }
    .bh-carousel-outer::after  { right:0; background:linear-gradient(to left,  var(--bg), transparent); }

    .bh-carousel-track {
      display: flex;
      gap: 14px;
      padding: 18px 6px 28px;
      transition: transform .5s cubic-bezier(.22,1,.36,1);
      will-change: transform;
    }

    .bh-carousel-card-wrap {
      flex: 0 0 300px;
      position: relative;
      transition: transform .45s cubic-bezier(.22,1,.36,1), opacity .35s;
    }
    .bh-carousel-card-wrap.is-center { transform: scale(1.05); z-index: 3; }
    .bh-carousel-card-wrap.is-side-1 { transform: scale(0.96); opacity: .85; }
    .bh-carousel-card-wrap.is-side-2 { transform: scale(0.90); opacity: .65; }
    .bh-carousel-card-wrap.is-hidden  { opacity: 0.3; transform: scale(0.85); }

    .bh-carousel-card-wrap .bh-card-block {
      position: absolute; inset:0; z-index:10; cursor:pointer;
    }
    .bh-carousel-card-wrap.is-center .bh-card-block { display:none; }

    /* ── Dish card ── */
    .bh-dish-card {
      background: var(--bg-2);
      border: 1px solid var(--border);
      border-radius: 22px;
      overflow: hidden;
      transition: box-shadow .32s, border-color .2s;
      position: relative;
      display: flex; flex-direction: column;
    }
    .bh-dish-card::before {
      content:''; position:absolute; top:0; left:0; width:50%; height:100%;
      background:linear-gradient(105deg,transparent,rgba(255,255,255,.07),transparent);
      transform:translateX(-100%) skewX(-14deg);
      pointer-events:none; z-index:3;
    }
    .bh-carousel-item.is-center .bh-dish-card:hover::before { animation:bh-shimmer .65s ease forwards; }
    .bh-carousel-item.is-center .bh-dish-card:hover {
      box-shadow: 0 22px 64px rgba(0,0,0,.65);
      border-color: var(--border-hi);
    }
    .bh-carousel-item.is-center .bh-dish-card { box-shadow: 0 24px 72px rgba(0,0,0,.6); border-color: var(--border-hi); }
    .bh-dish-card.in-cart {
      border-color: rgba(224,152,48,.5);
      animation: bh-cart-pulse 2.4s ease-in-out infinite;
    }
    .bh-dish-card.in-cart:hover { animation-play-state:paused; }

    /* ── Arrow buttons ── */
    .bh-carousel-arrow {
      position:absolute; top:50%; transform:translateY(-50%);
      z-index:25; width:36px; height:36px; border-radius:50%;
      background:var(--bg-2); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
      border:1px solid var(--border-mid); color:var(--text-2); cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition:background .2s, border-color .2s, color .2s, transform .2s;
      box-shadow: 0 4px 18px rgba(0,0,0,.4);
    }
    .bh-carousel-arrow:hover { background:var(--bg-3); border-color:var(--amber); color:var(--amber); transform:translateY(-50%) scale(1.1); }
    .bh-carousel-arrow:disabled { opacity:.3; cursor:default; pointer-events:none; }
    .bh-carousel-arrow.left  { left:0; }
    .bh-carousel-arrow.right { right:0; }

    .bh-dish-img { aspect-ratio:4/3; overflow:hidden; background:var(--bg-3); position:relative; flex-shrink:0; }
    .bh-dish-img img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .55s cubic-bezier(.22,1,.36,1); }
    .bh-dish-card:hover .bh-dish-img img { transform:scale(1.08); }

    .bh-dish-view-cta {
      position:absolute; inset:0;
      background:rgba(7,6,14,.52);
      display:flex; align-items:center; justify-content:center;
      opacity:0; transition:opacity .28s;
      z-index:4; text-decoration:none;
    }
    .bh-dish-card:hover .bh-dish-view-cta { opacity:1; }
    .bh-dish-view-cta span {
      font-family:'JetBrains Mono',monospace; font-size:10px;
      text-transform:uppercase; letter-spacing:.22em;
      color:#fff; background:rgba(224,152,48,.9);
      padding:8px 20px; border-radius:22px;
      box-shadow:0 4px 16px rgba(224,152,48,.5);
    }

    .bh-qty-badge {
      position:absolute; top:9px; right:9px;
      background:var(--grad); color:#fff;
      font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:700;
      width:30px; height:30px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 3px 12px rgba(224,152,48,.55);
      animation:bh-badge-pop .32s cubic-bezier(.22,1,.36,1) both;
    }

    /* Food type pill in image */
    .bh-food-pill {
      position:absolute; bottom:9px; left:10px;
      font-family:'JetBrains Mono',monospace; font-size:9px;
      font-weight:600; text-transform:uppercase; letter-spacing:.14em;
      padding:4px 12px 4px 24px; border-radius:20px;
      background:rgba(7,6,14,.78);
      backdrop-filter:blur(6px);
      -webkit-backdrop-filter:blur(6px);
      border:1px solid rgba(255,255,255,.08);
      color:#fff; display:flex; align-items:center; gap:7px;
    }
    .bh-food-pill::before {
      content:''; position:absolute; left:9px; top:50%;
      transform:translateY(-50%);
      width:8px; height:8px; border-radius:50%;
      background:var(--pill-color, #ef4444);
      box-shadow:0 0 6px var(--pill-color, #ef4444);
    }

    .bh-dish-body { padding:20px 22px 20px; flex:1; display:flex; flex-direction:column; }
    .bh-dish-name {
      font-family:'Barlow Condensed',serif; font-weight:700; font-size:21px;
      color:var(--text); line-height:1.2; margin-bottom:10px; transition:color .2s;
    }
    .bh-dish-card:hover .bh-dish-name { color:var(--amber); }
    .bh-dish-desc {
      font-family:'JetBrains Mono',monospace; font-size:11px;
      color:var(--text-3); line-height:1.65; margin-bottom:14px;
      display:-webkit-box; -webkit-line-clamp:3;
      -webkit-box-orient:vertical; overflow:hidden; flex:1;
    }
    .bh-dish-foot {
      display:flex; flex-direction:column; gap:10px;
      padding-top:14px; border-top:1px solid var(--border);
      margin-top:auto;
    }
    .bh-dish-price {
      font-family:'JetBrains Mono',monospace; font-size:15px;
      color:var(--amber); font-weight:700; letter-spacing:.02em;
      white-space:nowrap;
    }
    .bh-dish-card:hover .bh-dish-price { animation:bh-price-glow 1.4s ease-in-out infinite; }

    .bh-qty-row { display:flex; align-items:center; gap:8px; }
    .bh-qty-btn {
      width:36px; height:36px; border-radius:10px;
      border:1px solid var(--border-mid);
      background:var(--glass); color:var(--text);
      font-size:18px; line-height:1; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition:border-color .16s, background .16s, color .16s, transform .14s;
      flex-shrink:0; position:relative; overflow:hidden;
    }
    .bh-qty-btn:hover { border-color:var(--amber); color:var(--amber); background:var(--glass-amber); transform:scale(1.1); }
    .bh-qty-btn:active { transform:scale(.9); }
    .bh-qty-btn.add {
      background:var(--grad); border-color:transparent; color:#fff;
      font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:.06em;
      width:100%; padding:0; height:36px; flex:1;
    }
    .bh-qty-btn.add::after {
      content:''; position:absolute; inset:0;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);
      transform:translateX(-100%);
    }
    .bh-qty-btn.add:hover::after { animation:bh-shimmer .5s ease forwards; }
    .bh-qty-btn.add:hover { filter:brightness(1.12); }
    .bh-qty-num {
      font-family:'JetBrains Mono',monospace; font-size:15px;
      font-weight:700; color:var(--text); min-width:24px; text-align:center;
    }

    /* ── Sticky cart bar ── */
    .bh-cart-bar {
      position: fixed; bottom: 0; left: 0; right: 0;
      padding: 14px 24px;
      background: var(--bg-2);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border-top: 1px solid var(--border-mid);
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      z-index: 800;
      animation: bh-bar-in .35s cubic-bezier(.22,1,.36,1) both;
    }
    .bh-cart-bar-info {
      display: flex; align-items: center; gap: 14px;
    }
    .bh-cart-count {
      background: var(--grad); color:#fff;
      font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:700;
      padding:5px 14px; border-radius:20px;
      box-shadow:0 4px 14px rgba(224,152,48,.35);
    }
    .bh-cart-total-label {
      font-family:'JetBrains Mono',monospace; font-size:10px;
      text-transform:uppercase; letter-spacing:.18em; color:var(--text-3);
    }
    .bh-cart-total-val {
      font-family:'Barlow Condensed',serif; font-weight:700; font-size:24px;
      letter-spacing:0.02em;
      background:var(--grad); -webkit-background-clip:text;
      -webkit-text-fill-color:transparent; background-clip:text;
    }
    .bh-confirm-btn {
      font-family:'JetBrains Mono',monospace; font-size:11px;
      text-transform:uppercase; letter-spacing:.2em;
      background:var(--grad); color:#fff; border:none;
      border-radius:13px; padding:12px 24px; cursor:pointer;
      box-shadow:0 6px 24px rgba(224,152,48,.4);
      transition:filter .18s, transform .18s;
      white-space: nowrap; flex-shrink: 0;
    }
    .bh-confirm-btn:hover { filter:brightness(1.12); transform:scale(1.04); }
    .bh-confirm-btn:active { transform:scale(.97); }

    /* ── Modal ── */
    .bh-modal-bg {
      position:fixed; inset:0;
      background:rgba(4,3,10,.82);
      backdrop-filter:blur(6px);
      -webkit-backdrop-filter:blur(6px);
      z-index:1000;
      display:flex; align-items:center; justify-content:center;
      padding:24px;
      animation:bh-modal-bg .22s ease both;
    }
    .bh-modal {
      background:var(--bg-2);
      border:1px solid var(--border-mid);
      border-radius:24px;
      overflow:hidden;
      width:100%; max-width:460px;
      max-height:88vh;
      display:flex; flex-direction:column;
      box-shadow:0 32px 96px rgba(0,0,0,.85);
      animation:bh-modal-in .3s cubic-bezier(.22,1,.36,1) both;
    }
    .bh-modal-head {
      padding:22px 24px 18px;
      border-bottom:1px solid var(--border);
      background:linear-gradient(160deg,var(--bg-3),var(--bg-2));
      position:relative; overflow:hidden; flex-shrink:0;
    }
    .bh-modal-head::before {
      content:''; position:absolute; top:-32px; right:-32px;
      width:110px; height:110px; border-radius:50%;
      background:radial-gradient(circle,rgba(224,152,48,.12) 0%,transparent 70%);
    }
    .bh-modal-body {
      overflow-y:auto; flex:1;
      padding:16px 24px;
    }
    .bh-modal-body::-webkit-scrollbar { width:3px; }
    .bh-modal-body::-webkit-scrollbar-thumb { background:var(--border-mid); border-radius:4px; }
    .bh-modal-row {
      display:flex; align-items:center; justify-content:space-between;
      padding:14px 0; border-bottom:1px solid var(--border);
      animation:bh-cat-in .28s cubic-bezier(.22,1,.36,1) both;
    }
    .bh-modal-row:last-child { border-bottom:none; }
    .bh-modal-foot {
      padding:18px 24px;
      border-top:1px solid var(--border-mid);
      background:linear-gradient(to bottom,var(--bg-2),var(--bg-3));
      flex-shrink:0;
    }

    @media(max-width:640px) {
      .bh-cart-bar { flex-wrap:wrap; gap:10px; padding:12px 16px; }
      .bh-carousel-card-wrap { flex: 0 0 240px; }
    }
  `
})()

const VEG_COLOR = { veg:'#22c55e', vegan:'#16a34a', 'non-veg':'#ef4444' }

function buildGroups(dishes, cats, search) {
  const q = search.toLowerCase()
  const visible = q
    ? dishes.filter(d => d.name.toLowerCase().includes(q) || (d.description||'').toLowerCase().includes(q))
    : dishes

  if (cats.length === 0) return visible.length ? [{ id:'all', name:'All Dishes', dishes:visible }] : []

  const map = new Map()
  cats.forEach(c => map.set(String(c.id), { ...c, dishes:[] }))
  const other = []
  visible.forEach(d => {
    const k = String(d.category_id)
    if (d.category_id && map.has(k)) map.get(k).dishes.push(d)
    else other.push(d)
  })
  const groups = cats.map(c => map.get(String(c.id))).filter(g => g.dishes.length > 0)
  if (other.length) groups.push({ id:'other', name:'Other', dishes:other })
  return groups
}

export default function BudgetHotel() {
  const { token }  = useParams()
  const navigate   = useNavigate()

  const [hotel,         setHotel]         = useState(null)
  const [dishes,        setDishes]        = useState([])
  const [cats,          setCats]          = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [dishSearch,    setDishSearch]    = useState('')
  const [cart,          setCart]          = useState({})
  const [showModal,     setShowModal]     = useState(false)
  const [activeByGroup, setActiveByGroup] = useState({})

  const getActive    = (gid) => activeByGroup[gid] ?? 0
  const setActive    = (gid, idx) => setActiveByGroup(p => ({ ...p, [gid]: idx }))

  useEffect(() => {
    Promise.all([
      authApi.hotelInfo(token),
      dishApi.list(token),
      catApi.listPublic(token),
    ])
      .then(([h, d, c]) => {
        setHotel(h.hotel)
        setDishes((d.dishes || []).filter(x => x.available))
        setCats(c.categories || [])
      })
      .catch(err => setError(err.message || 'Failed to load menu'))
      .finally(() => setLoading(false))
  }, [token])

  const setQty = useCallback((dish, qty) => {
    setCart(prev => {
      if (qty <= 0) { const n = { ...prev }; delete n[dish.id]; return n }
      return { ...prev, [dish.id]: { dish, qty } }
    })
  }, [])

  const cartItems  = Object.values(cart)
  const totalItems = cartItems.reduce((s, { qty }) => s + qty, 0)
  const total      = cartItems.reduce((s, { dish, qty }) => s + Number(dish.price) * qty, 0)
  const groups     = buildGroups(dishes, cats, dishSearch)

  /* Close modal on backdrop click */
  const onBackdropClick = (e) => { if (e.target === e.currentTarget) setShowModal(false) }

  if (loading) return (
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14 }}>
      <div style={{ width:32, height:32, border:'2px solid var(--border-mid)', borderTop:'2px solid rgba(224,152,48,.85)', borderRadius:'50%', animation:'bh-spin .8s linear infinite' }} />
      <span style={{ fontFamily:'JetBrains Mono', fontSize:9, letterSpacing:'.22em', textTransform:'uppercase', color:'var(--text-3)' }}>Loading menu…</span>
    </div>
  )

  if (error) return (
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:40, opacity:.4 }}>✕</div>
      <p style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--bad)', textTransform:'uppercase', letterSpacing:'.2em' }}>{error}</p>
      <button className="btn btn-ghost" onClick={() => navigate('/menu')}>← Back to restaurants</button>
    </div>
  )

  return (
    <div className="page" style={{ paddingBottom: totalItems > 0 ? 100 : 32 }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:32, flexWrap:'wrap' }}>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/menu')}>← Restaurants</button>

        {hotel?.logo_path ? (
          <div style={{ width:42, height:42, borderRadius:10, overflow:'hidden', border:'1px solid var(--border-mid)', flexShrink:0 }}>
            <img src={imageUrl(hotel.logo_path)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          </div>
        ) : (
          <div style={{ width:42, height:42, borderRadius:10, background:'var(--bg-3)', border:'1px solid var(--border-mid)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Barlow Condensed,serif', fontWeight:700, fontSize:18, color:'var(--amber)', flexShrink:0 }}>
            {hotel?.hotel_name?.[0]}
          </div>
        )}

        <div style={{ flex:1, minWidth:0 }}>
          <div className="page-eyebrow">Budget planner</div>
          <h1 style={{ fontFamily:'Barlow Condensed,serif', fontWeight:700, fontSize:'clamp(20px,3vw,30px)', color:'var(--text)', margin:0, lineHeight:1.15, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {hotel?.hotel_name}
          </h1>
        </div>

        <div style={{ fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--text-3)', flexShrink:0 }}>
          <span style={{ color:'var(--amber)', fontWeight:700 }}>{dishes.length}</span> dishes
          {cats.length > 0 && <> · <span style={{ color:'var(--amber)', fontWeight:700 }}>{cats.length}</span> categories</>}
        </div>
      </div>

      {/* ── Dish search ── */}
      <div style={{ position:'relative', maxWidth:360, marginBottom:32 }}>
        <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', opacity:.35, pointerEvents:'none' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input
          className="field-input"
          placeholder="Search dishes…"
          value={dishSearch}
          onChange={e => setDishSearch(e.target.value)}
          style={{ paddingLeft:40, paddingRight: dishSearch ? 36 : 16 }}
        />
        {dishSearch && (
          <button type="button" onClick={() => setDishSearch('')}
            style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:17, lineHeight:1, padding:0 }}>
            ×
          </button>
        )}
      </div>

      {/* ── Category sections ── */}
      {groups.length === 0 ? (
        <div style={{ padding:'64px 0', textAlign:'center' }}>
          <div style={{ fontSize:38, marginBottom:16, opacity:.2 }}>🍽️</div>
          <div style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.2em' }}>
            {dishSearch ? 'No dishes match your search' : 'No dishes available'}
          </div>
        </div>
      ) : (
        groups.map((group, gi) => {
          const activeIdx = getActive(group.id)
          const totalCards = group.dishes.length
          return (
          <div key={group.id} style={{ marginTop: gi === 0 ? 0 : 44 }}>

            {/* Category heading */}
            <div style={{ animation:`bh-cat-in .4s cubic-bezier(.22,1,.36,1) ${gi * 80}ms both` }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:12, paddingBottom:11 }}>
                <h2 style={{ fontFamily:'Barlow Condensed,serif', fontWeight:700, fontSize:'clamp(18px,2.5vw,24px)', color:'var(--text)', margin:0, letterSpacing:'0.02em' }}>
                  {group.name}
                </h2>
                <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, textTransform:'uppercase', letterSpacing:'.18em', color:'var(--text-3)' }}>
                  {group.dishes.length} item{group.dishes.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ height:1, background:'linear-gradient(to right,var(--amber),rgba(214,58,94,.6),transparent)', transformOrigin:'left', animation:`bh-line-grow .55s cubic-bezier(.22,1,.36,1) ${gi * 80 + 60}ms both` }} />
            </div>

            {/* ── Sliding 5-card carousel ── */}
            {(() => {
              const CARD = 314 // card width (300) + gap (14)
              // slide track so activeIdx is at position 2 (center of 5-card window)
              const startIdx = Math.max(0, Math.min(activeIdx - 2, Math.max(0, totalCards - 5)))
              const trackX   = -startIdx * CARD

              return (
                <div className="bh-carousel-wrap">
                  <div className="bh-carousel-outer">
                    <div
                      className="bh-carousel-track"
                      style={{ transform: `translateX(${trackX}px)` }}
                    >
                      {group.dishes.map((d, i) => {
                        const off     = i - activeIdx
                        const absOff  = Math.abs(off)
                        const isCenter = off === 0
                        const cls = isCenter ? 'is-center'
                          : absOff === 1 ? 'is-side-1'
                          : absOff === 2 ? 'is-side-2'
                          : 'is-hidden'
                        const qty = cart[d.id]?.qty ?? 0
                        return (
                          <div
                            key={d.id}
                            className={`bh-carousel-card-wrap ${cls}`}
                            onClick={() => !isCenter && setActive(group.id, i)}
                          >
                            {!isCenter && <div className="bh-card-block" />}
                            <div className={`bh-dish-card${qty > 0 ? ' in-cart' : ''}`}>
                              <div className="bh-dish-img">
                                {d.image_path
                                  ? <img src={imageUrl(d.image_path)} alt={d.name} loading="lazy" />
                                  : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, opacity:.15 }}>🍽️</div>
                                }
                                {qty > 0 && <div className="bh-qty-badge">{qty}</div>}
                                <div className="bh-food-pill" style={{ '--pill-color': VEG_COLOR[d.food_type] ?? VEG_COLOR['non-veg'] }}>
                                  {d.food_type === 'veg' ? 'Veg' : d.food_type === 'vegan' ? 'Vegan' : 'Non-Veg'}
                                </div>
                                <Link to={`/dish/${d.id}`} className="bh-dish-view-cta"><span>View dish →</span></Link>
                              </div>
                              <div className="bh-dish-body">
                                <div className="bh-dish-name">{d.name}</div>
                                {d.description && <div className="bh-dish-desc">{d.description}</div>}
                                <div className="bh-dish-foot">
                                  <div className="bh-dish-price">LKR {Number(d.price).toLocaleString()}</div>
                                  <div className="bh-qty-row">
                                    {qty === 0 ? (
                                      <button type="button" className="bh-qty-btn add" onClick={() => setQty(d, 1)}>+ Add</button>
                                    ) : (
                                      <>
                                        <button type="button" className="bh-qty-btn" onClick={() => setQty(d, qty - 1)}>−</button>
                                        <span className="bh-qty-num">{qty}</span>
                                        <button type="button" className="bh-qty-btn add" onClick={() => setQty(d, qty + 1)}>+</button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {totalCards > 1 && (
                      <>
                        <button type="button" className="bh-carousel-arrow left"
                          onClick={() => setActive(group.id, Math.max(0, activeIdx - 1))}
                          disabled={activeIdx === 0}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <button type="button" className="bh-carousel-arrow right"
                          onClick={() => setActive(group.id, Math.min(totalCards - 1, activeIdx + 1))}
                          disabled={activeIdx === totalCards - 1}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Dot indicators */}
                  {totalCards > 1 && (
                    <div style={{ display:'flex', justifyContent:'center', gap:7, marginTop:12 }}>
                      {group.dishes.map((d, i) => (
                        <button key={d.id} type="button" onClick={() => setActive(group.id, i)}
                          style={{
                            width: i === activeIdx ? 22 : 7, height: 7, borderRadius: 4,
                            background: i === activeIdx ? 'var(--amber)' : 'var(--border-mid)',
                            border:'none', cursor:'pointer', padding:0,
                            transition:'width .3s cubic-bezier(.22,1,.36,1), background .2s', flexShrink:0,
                          }} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
          )
        })
      )}

      {/* ── Sticky cart bar ── */}
      {totalItems > 0 && (
        <div className="bh-cart-bar">
          <div className="bh-cart-bar-info">
            <div className="bh-cart-count">{totalItems} item{totalItems !== 1 ? 's' : ''}</div>
            <div>
              <div style={{ fontFamily:'JetBrains Mono', fontSize:10, textTransform:'uppercase', letterSpacing:'.2em', color:'var(--text-3)', marginBottom:2 }}>Estimated total</div>
              <div className="bh-cart-total-val">LKR {total.toLocaleString()}</div>
            </div>
          </div>
          <button type="button" className="bh-confirm-btn" onClick={() => setShowModal(true)}>
            See Total →
          </button>
        </div>
      )}

      {/* ── Total popup modal ── */}
      {showModal && (
        <div className="bh-modal-bg" onClick={onBackdropClick}>
          <div className="bh-modal">

            {/* Modal header */}
            <div className="bh-modal-head">
              <div style={{ display:'flex', alignItems:'center', gap:12, position:'relative', zIndex:1 }}>
                {hotel?.logo_path ? (
                  <div style={{ width:36, height:36, borderRadius:9, overflow:'hidden', border:'1px solid var(--border-mid)', flexShrink:0 }}>
                    <img src={imageUrl(hotel.logo_path)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                  </div>
                ) : (
                  <div style={{ width:36, height:36, borderRadius:9, background:'var(--bg-4)', border:'1px solid var(--border-mid)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Barlow Condensed,serif', fontWeight:700, fontSize:16, color:'var(--amber)', flexShrink:0 }}>
                    {hotel?.hotel_name?.[0]}
                  </div>
                )}
                <div>
                  <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:8.5, textTransform:'uppercase', letterSpacing:'.24em', color:'var(--text-3)', marginBottom:3 }}>
                    Budget summary
                  </div>
                  <div style={{ fontFamily:'Barlow Condensed,serif', fontWeight:700, fontSize:18, color:'var(--text)' }}>
                    {hotel?.hotel_name}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ marginLeft:'auto', background:'none', border:'1px solid var(--border-mid)', borderRadius:8, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-3)', fontSize:18, lineHeight:1, flexShrink:0, transition:'border-color .18s, color .18s' }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Items list */}
            <div className="bh-modal-body">
              {cartItems.map(({ dish, qty }, idx) => (
                <div key={dish.id} className="bh-modal-row" style={{ animationDelay:`${idx * 40}ms` }}>
                  <div style={{ flex:1, minWidth:0, marginRight:14 }}>
                    <div style={{ fontFamily:'Barlow Condensed,serif', fontWeight:700, fontSize:17, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {dish.name}
                    </div>
                    <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'var(--text-3)', marginTop:3 }}>
                      {qty} × LKR {Number(dish.price).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:14, fontWeight:700, color:'var(--amber)', flexShrink:0 }}>
                    LKR {(Number(dish.price) * qty).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal footer */}
            <div className="bh-modal-foot">
              {/* Total */}
              <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:18 }}>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, textTransform:'uppercase', letterSpacing:'.22em', color:'var(--text-3)' }}>
                  Estimated total
                </div>
                <div style={{ fontFamily:'Barlow Condensed,serif', fontWeight:700, fontSize:30, letterSpacing:'0.02em', background:'var(--grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                  LKR {total.toLocaleString()}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:10 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ flex:1, fontFamily:'JetBrains Mono,monospace', fontSize:11, textTransform:'uppercase', letterSpacing:'.18em', background:'var(--grad)', color:'#fff', border:'none', borderRadius:12, padding:'14px', cursor:'pointer', transition:'filter .18s, transform .18s', boxShadow:'0 6px 22px rgba(224,152,48,.35)' }}
                >
                  ← Continue adding
                </button>
                <button
                  type="button"
                  onClick={() => { setCart({}); setShowModal(false) }}
                  style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, textTransform:'uppercase', letterSpacing:'.18em', background:'none', color:'var(--text-3)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 20px', cursor:'pointer', transition:'border-color .18s, color .18s' }}
                >
                  Clear
                </button>
              </div>

              <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.13em', lineHeight:1.8, opacity:.6, marginTop:14 }}>
                Prices are indicative only. Final amounts may vary at the restaurant.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
