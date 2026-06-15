import { useEffect, useRef, useState, useCallback } from 'react'
import { auth as authApi, dishes as dishApi, imageUrl } from '../api/client.js'

;(function injectStyles() {
  let s = document.getElementById('bp-css')
  if (!s) { s = document.createElement('style'); s.id = 'bp-css'; document.head.appendChild(s) }
  s.textContent = `
    @keyframes bp-in   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
    @keyframes bp-spin { to{transform:rotate(360deg)} }

    @keyframes bp-spotlight-pulse {
      0%,100%{opacity:.52;transform:translateX(-50%) scale(1)}
      50%    {opacity:.88;transform:translateX(-50%) scale(1.12)}
    }
    @keyframes bp-particle-drift {
      0%  {transform:translateY(0) translateX(0) scale(1);opacity:.82}
      100%{transform:translateY(-155px) translateX(12px) scale(0);opacity:0}
    }
    @keyframes bp-neon-border {
      0%,100%{border-color:rgba(212,150,58,.38)}
      50%    {border-color:rgba(212,150,58,.72)}
    }
    @keyframes bp-streak-drift {
      0%  {transform:translateX(0) translateY(0);opacity:0}
      20% {opacity:.5}
      100%{transform:translateX(170px) translateY(-52px);opacity:0}
    }

    /* ── Hotel picker cards ── */
    .bp-hotel-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 14px;
      margin-top: 20px;
      animation: bp-in .4s cubic-bezier(.22,1,.36,1) both;
    }
    .bp-hotel-card {
      background: rgba(5,5,14,.80);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(212,150,58,.16);
      border-radius: 18px;
      padding: 18px;
      cursor: pointer;
      display: flex; align-items: center; gap: 14px;
      transition: border-color .24s, box-shadow .24s, transform .24s;
      position: relative; overflow: hidden;
    }
    .bp-hotel-card::before {
      content:''; position:absolute; top:0; left:0; right:0; height:1px;
      background:linear-gradient(to right,transparent,rgba(212,150,58,.38),transparent);
    }
    .bp-hotel-card:hover {
      border-color:rgba(212,150,58,.50);
      box-shadow:0 0 28px rgba(212,150,58,.14), 0 8px 32px rgba(0,0,0,.5);
      transform:translateY(-3px);
    }

    /* ── 3D Carousel scene ── */
    .bp-carousel-scene {
      position:relative; padding:340px 0 380px; overflow:hidden;
      min-height:520px; display:flex; flex-direction:column; align-items:center;
    }
    .bp-carousel-spotlight {
      position:absolute; top:-60px; left:50%;
      width:720px; height:520px; transform:translateX(-50%);
      background:radial-gradient(ellipse 55% 62% at 50% 8%,
        rgba(212,150,58,.11) 0%, rgba(212,150,58,.04) 48%, transparent 70%);
      pointer-events:none;
      animation:bp-spotlight-pulse 5.5s ease-in-out infinite;
    }
    .bp-carousel-floor {
      position:absolute; bottom:68px; left:5%; right:5%; height:140px;
      background:linear-gradient(to top,rgba(212,150,58,.042) 0%,rgba(212,150,58,.010) 50%,transparent 100%);
      pointer-events:none; border-radius:50%; filter:blur(22px);
    }
    .bp-carousel-stage {
      position:relative; width:100%; height:440px;
      display:flex; align-items:center; justify-content:center;
    }

    /* Individual 3D card */
    .bp-dish-card-3d {
      position:absolute; width:268px;
      text-decoration:none; color:inherit;
      transition:
        transform .64s cubic-bezier(.23,1,.32,1),
        opacity   .56s ease,
        filter    .56s ease,
        box-shadow .42s ease;
      cursor:pointer;
    }
    .bp-dish-card-inner {
      background:rgba(5,5,14,.82);
      backdrop-filter:blur(30px);
      -webkit-backdrop-filter:blur(30px);
      border:1px solid rgba(212,150,58,.28);
      border-radius:20px; overflow:hidden; position:relative;
    }
    .bp-dish-card-inner::before {
      content:''; position:absolute; inset:0; border-radius:20px; z-index:2; pointer-events:none;
      background:linear-gradient(140deg,rgba(255,255,255,.055) 0%,transparent 46%);
    }
    .bp-dish-card-media {
      width:100%; height:205px; overflow:hidden; position:relative;
    }
    .bp-dish-card-media img, .bp-dish-card-media video {
      width:100%; height:100%; object-fit:cover; display:block;
    }
    .bp-dish-card-media::after {
      content:''; position:absolute; bottom:0; left:0; right:0; height:72px; z-index:1;
      background:linear-gradient(to bottom, transparent 0%, rgba(5,5,14,.75) 100%);
      pointer-events:none;
    }
    .bp-dish-card-body {
      padding:14px 18px 20px;
      display:flex; flex-direction:column; gap:5px; align-items:center; text-align:center;
    }
    .bp-dish-card-name {
      font-family:'Barlow Condensed',serif; font-weight:700; font-size:15.5px;
      color:#f2e8d0; line-height:1.28; $10.02em;
    }
    .bp-dish-card-price {
      font-family:'JetBrains Mono',monospace; font-size:12.5px;
      color:rgba(212,150,58,.92); letter-spacing:.04em; margin-top:1px;
    }
    .bp-dish-card-rating {
      font-family:'JetBrains Mono',monospace; font-size:10px;
      color:rgba(240,220,180,.42);
    }

    /* Qty controls inside center card */
    .bp-3d-qty-row {
      display:flex; align-items:center; gap:8px;
      margin-top:10px; width:100%;
    }
    .bp-3d-qty-btn {
      width:34px; height:34px; border-radius:10px;
      border:1px solid rgba(212,150,58,.28);
      background:rgba(212,150,58,.08); color:rgba(212,150,58,.85);
      font-size:18px; line-height:1; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition:background .2s, border-color .2s, color .2s; flex-shrink:0;
    }
    .bp-3d-qty-btn:hover { background:rgba(212,150,58,.22); border-color:rgba(212,150,58,.6); color:rgb(212,150,58); }
    .bp-3d-qty-btn.add  {
      flex:1; border-radius:12px;
      background:linear-gradient(135deg,rgba(212,150,58,.80),rgba(180,110,30,.90));
      border:none; color:#fff; font-size:11px;
      font-family:'JetBrains Mono',monospace; letter-spacing:.14em; text-transform:uppercase;
    }
    .bp-3d-qty-btn.add:hover { filter:brightness(1.14); }
    .bp-3d-qty-num {
      font-family:'JetBrains Mono',monospace; font-size:15px; font-weight:700;
      color:#f2e8d0; min-width:24px; text-align:center;
    }

    /* In-cart badge (side cards) */
    .bp-3d-cart-badge {
      position:absolute; top:8px; right:8px; z-index:4;
      background:linear-gradient(135deg,rgba(212,150,58,.90),rgba(180,110,30,.95));
      color:#fff; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:700;
      width:22px; height:22px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 2px 10px rgba(212,150,58,.5);
    }

    /* Mirror-floor reflection */
    .bp-dish-card-reflection {
      height:56px; margin-top:3px; border-radius:0 0 18px 18px;
      overflow:hidden; opacity:.28; transform:scaleY(-1);
      mask-image:linear-gradient(to bottom,rgba(0,0,0,.6) 0%,transparent 100%);
      -webkit-mask-image:linear-gradient(to bottom,rgba(0,0,0,.6) 0%,transparent 100%);
    }
    .bp-dish-card-reflection img,
    .bp-dish-card-reflection video {
      width:100%; height:100%; object-fit:cover; display:block;
    }

    /* Arrows */
    .bp-carousel-arrow {
      position:absolute; top:50%; transform:translateY(-50%);
      z-index:20; width:50px; height:50px; border-radius:50%;
      background:rgba(5,5,14,.90); backdrop-filter:blur(18px);
      border:1px solid rgba(212,150,58,.22); color:rgba(212,150,58,.75);
      cursor:pointer; display:flex; align-items:center; justify-content:center;
      transition:border-color .24s, box-shadow .24s, color .24s, background .24s;
    }
    .bp-carousel-arrow:hover {
      border-color:rgba(212,150,58,.70);
      box-shadow:0 0 28px rgba(212,150,58,.34), inset 0 0 14px rgba(212,150,58,.07);
      color:rgb(212,150,58); background:rgba(10,8,28,.94);
    }
    .bp-carousel-arrow-left  { left:clamp(6px,2.5vw,36px); }
    .bp-carousel-arrow-right { right:clamp(6px,2.5vw,36px); }

    /* Dots */
    .bp-carousel-dots {
      position:absolute; bottom:52px; left:50%; transform:translateX(-50%);
      display:flex; gap:8px; z-index:20;
    }
    .bp-carousel-dot {
      height:7px; border-radius:4px;
      background:rgba(212,150,58,.25); border:none; cursor:pointer; padding:0;
      transition:background .25s, transform .3s cubic-bezier(.34,1.56,.64,1), width .3s cubic-bezier(.34,1.56,.64,1);
    }
    .bp-carousel-dot.active { background:rgb(212,150,58); transform:scale(1.1); }

    /* Streaks & Particles */
    .bp-carousel-streak   { position:absolute; pointer-events:none; border-radius:999px; animation:bp-streak-drift linear infinite; }
    .bp-carousel-particle { position:absolute; border-radius:50%; pointer-events:none; animation:bp-particle-drift linear infinite; }

    /* Budget summary panel */
    .bp-summary {
      background: rgba(5,5,14,.82);
      backdrop-filter:blur(28px);
      -webkit-backdrop-filter:blur(28px);
      border: 1px solid rgba(212,150,58,.18);
      border-radius: 20px;
      overflow: hidden;
      position: sticky;
      top: 90px;
    }
    .bp-summary-head {
      padding: 18px 20px 16px;
      border-bottom: 1px solid rgba(212,150,58,.12);
      background: rgba(10,8,20,.5);
    }
    .bp-summary-body { padding: 16px 20px; max-height: 420px; overflow-y: auto; }
    .bp-summary-item {
      display:flex; align-items:center; justify-content:space-between;
      padding: 9px 0;
      border-bottom: 1px solid rgba(212,150,58,.10);
    }
    .bp-summary-item:last-child { border-bottom:none; }
    .bp-summary-foot {
      padding: 16px 20px;
      border-top: 1px solid rgba(212,150,58,.14);
      background: rgba(10,8,20,.6);
    }

    @media(max-width:900px) {
      .bp-layout { grid-template-columns: 1fr !important; }
      .bp-summary { position:static; top:auto; }
      .bp-carousel-stage { height:420px; }
    }
    @media(max-width:640px) {
      .bp-carousel-stage { height:470px; }
      .bp-dish-card-3d { width:230px; }
      .bp-dish-card-media { height:180px; }
      .bp-hotel-grid { grid-template-columns: 1fr; }
    }
    @media(max-width:400px) {
      .bp-dish-card-3d { width:200px; }
      .bp-dish-card-media { height:158px; }
    }
  `
})()

/* ── Veg indicator ── */
const VEG_COLOR = { veg:'#22c55e', vegan:'#16a34a', 'non-veg':'#ef4444' }

function VegDot({ type }) {
  const color = VEG_COLOR[type] ?? VEG_COLOR['non-veg']
  return <span style={{ width:10, height:10, borderRadius:'50%', background:color, border:'2px solid rgba(0,0,0,.5)', display:'inline-block', flexShrink:0 }} />
}

function SpiceDots({ level }) {
  const active = Math.ceil(level / 2)
  return (
    <div style={{ display:'flex', gap:1 }}>
      {Array.from({ length:5 }, (_, i) => (
        <span key={i} style={{ fontSize:10, lineHeight:1, display:'block', opacity: i < active ? 1 : 0.15 }}>🌶️</span>
      ))}
    </div>
  )
}

/* ── Card transform based on offset from center ── */
function resolveCardStyle(offset, hoveredCenter) {
  const abs  = Math.abs(offset)
  const sign = offset > 0 ? 1 : -1

  if (abs === 0) {
    const scale = hoveredCenter ? 1.06 : 1.0
    return {
      transform: `translateX(0px) scale(${scale}) rotateY(0deg)`,
      zIndex: 10, opacity: 1, filter: 'none',
      boxShadow: hoveredCenter
        ? '0 0 72px rgba(212,150,58,.52), 0 44px 110px rgba(0,0,0,.82)'
        : '0 0 46px rgba(212,150,58,.28), 0 32px 80px rgba(0,0,0,.72)',
    }
  }
  if (abs === 1) return {
    transform: `translateX(${sign * 308}px) scale(0.79) rotateY(${sign * -22}deg)`,
    zIndex: 5, opacity: 0.70, filter: 'blur(1.2px)',
    boxShadow: '0 14px 44px rgba(0,0,0,.55)',
  }
  if (abs === 2) return {
    transform: `translateX(${sign * 556}px) scale(0.58) rotateY(${sign * -34}deg)`,
    zIndex: 2, opacity: 0.36, filter: 'blur(3px)',
    boxShadow: '0 8px 24px rgba(0,0,0,.45)',
  }
  return {
    transform: `translateX(${sign * 720}px) scale(0.42)`,
    zIndex: 0, opacity: 0, pointerEvents: 'none', filter: 'blur(6px)',
  }
}

/* ── Single 3D dish card ── */
function BpDishCard({ dish, offset, qty, onBringToCenter, onAdd, onInc, onDec }) {
  const [hovered, setHovered] = useState(false)
  const isCenter = offset === 0
  const hasVideo = !!dish.video_path
  const hasPng   = !!dish.png_path
  const hasImg   = !!dish.image_path

  const posStyle = resolveCardStyle(offset, hovered && isCenter)
  const mediaSrc = hasPng  ? imageUrl(dish.png_path)
                 : hasVideo ? imageUrl(dish.video_path)
                 : hasImg   ? imageUrl(dish.image_path)
                 : null

  return (
    <div
      className="bp-dish-card-3d"
      style={posStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={isCenter ? undefined : onBringToCenter}
    >
      <div
        className="bp-dish-card-inner"
        style={{
          borderColor: isCenter
            ? (hovered ? 'rgba(212,150,58,.72)' : 'rgba(212,150,58,.44)')
            : 'rgba(212,150,58,.16)',
          animation: isCenter ? 'bp-neon-border 3.2s ease-in-out infinite' : 'none',
        }}
      >
        {/* Media */}
        <div className="bp-dish-card-media">
          {hasPng ? (
            <img src={imageUrl(dish.png_path)} alt={dish.name} loading="lazy" />
          ) : hasVideo ? (
            <video src={imageUrl(dish.video_path)} autoPlay muted loop playsInline />
          ) : hasImg ? (
            <img src={imageUrl(dish.image_path)} alt={dish.name} loading="lazy" />
          ) : (
            <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(14,10,34,.6)' }}>
              <span style={{ fontSize:58, opacity:.14 }}>🍽️</span>
            </div>
          )}
          {/* Veg dot */}
          <div style={{ position:'absolute', bottom:10, left:10, zIndex:3 }}>
            <VegDot type={dish.food_type} />
          </div>
          {/* Spice overlay */}
          {dish.spice_level > 0 && (
            <div style={{ position:'absolute', top:10, right:10, zIndex:3 }}>
              <SpiceDots level={dish.spice_level} />
            </div>
          )}
          {/* In-cart badge on side cards */}
          {!isCenter && qty > 0 && (
            <div className="bp-3d-cart-badge">{qty}</div>
          )}
        </div>

        {/* Info + controls */}
        <div className="bp-dish-card-body">
          <div className="bp-dish-card-name">{dish.name}</div>
          <div className="bp-dish-card-price">LKR {Number(dish.price).toLocaleString()}</div>
          {dish.avg_rating ? (
            <div className="bp-dish-card-rating">★ {dish.avg_rating} · {dish.review_count} reviews</div>
          ) : null}

          {isCenter && (
            <div className="bp-3d-qty-row">
              {qty === 0 ? (
                <button type="button" className="bp-3d-qty-btn add" onClick={onAdd}>
                  + Add to plan
                </button>
              ) : (
                <>
                  <button type="button" className="bp-3d-qty-btn" onClick={onDec}>−</button>
                  <span className="bp-3d-qty-num">{qty}</span>
                  <button type="button" className="bp-3d-qty-btn add" style={{ flex:1 }} onClick={onInc}>+</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mirror-floor reflection (center card only) */}
      {isCenter && mediaSrc && (
        <div className="bp-dish-card-reflection">
          {hasPng || hasImg ? (
            <img src={mediaSrc} alt="" aria-hidden />
          ) : hasVideo ? (
            <video src={mediaSrc} autoPlay muted loop playsInline aria-hidden />
          ) : null}
        </div>
      )}
    </div>
  )
}

/* ── 3D dish carousel for budget planner ── */
function BpDishCarousel({ dishes, cart, setQty }) {
  const len = dishes.length
  const [activeIdx, setActiveIdx] = useState(0)
  const [paused, setPaused]       = useState(false)
  const touchX = useRef(null)

  /* Reset to 0 when dish list changes (search filter) */
  useEffect(() => { setActiveIdx(0) }, [dishes])

  useEffect(() => {
    if (paused || len < 2) return
    const t = setInterval(() => setActiveIdx(i => (i + 1) % len), 4200)
    return () => clearInterval(t)
  }, [paused, len])

  const prev = () => setActiveIdx(i => (i - 1 + len) % len)
  const next = () => setActiveIdx(i => (i + 1) % len)

  const onTouchStart = e => { touchX.current = e.touches[0].clientX }
  const onTouchEnd   = e => {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    touchX.current = null
    if (Math.abs(dx) < 38) return
    dx < 0 ? next() : prev()
  }

  const slots = []
  for (let offset = -2; offset <= 2; offset++) {
    if (len === 1 && offset !== 0) continue
    const realIdx = ((activeIdx + offset) % len + len) % len
    slots.push({ dish: dishes[realIdx], offset, realIdx })
  }

  const PARTICLES = [
    { left:'28%', bottom:'76px', size:3, color:'rgba(212,150,58,.65)', dur:'4.2s', delay:'0s'   },
    { left:'63%', bottom:'72px', size:2, color:'rgba(212,150,58,.45)', dur:'5.8s', delay:'1.4s' },
    { left:'45%', bottom:'80px', size:4, color:'rgba(180,120,42,.55)', dur:'3.6s', delay:'2.7s' },
    { left:'78%', bottom:'68px', size:2, color:'rgba(212,150,58,.35)', dur:'6.2s', delay:'0.7s' },
    { left:'16%', bottom:'74px', size:3, color:'rgba(220,160,60,.50)', dur:'4.8s', delay:'3.3s' },
  ]
  const STREAKS = [
    { left:'15%', top:'38%', width:80, delay:'0s',   dur:'7s'   },
    { left:'58%', top:'22%', width:55, delay:'2.5s', dur:'9s'   },
    { left:'72%', top:'55%', width:40, delay:'5s',   dur:'6.5s' },
  ]

  const showDots = len > 1 && len <= 14

  return (
    <div
      className="bp-carousel-scene"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="bp-carousel-spotlight" />
      <div className="bp-carousel-floor" />

      {STREAKS.map((s, i) => (
        <div key={i} className="bp-carousel-streak" style={{
          left:s.left, top:s.top, width:s.width, height:1,
          background:'linear-gradient(to right, transparent, rgba(212,150,58,.28), transparent)',
          animationDelay:s.delay, animationDuration:s.dur,
        }} />
      ))}
      {PARTICLES.map((p, i) => (
        <div key={i} className="bp-carousel-particle" style={{
          left:p.left, bottom:p.bottom,
          width:p.size, height:p.size,
          background:p.color,
          animationDelay:p.delay, animationDuration:p.dur,
        }} />
      ))}

      {/* 3D stage */}
      <div className="bp-carousel-stage" style={{ perspective:'1300px', perspectiveOrigin:'50% 48%' }}>
        {slots.map(({ dish, offset, realIdx }) => {
          const qty = cart[dish.id]?.qty ?? 0
          return (
            <BpDishCard
              key={offset}
              dish={dish}
              offset={offset}
              qty={qty}
              onBringToCenter={() => setActiveIdx(realIdx)}
              onAdd={() => setQty(dish, 1)}
              onInc={() => setQty(dish, qty + 1)}
              onDec={() => setQty(dish, qty - 1)}
            />
          )
        })}
      </div>

      {len > 1 && (
        <>
          <button className="bp-carousel-arrow bp-carousel-arrow-left" onClick={prev} aria-label="Previous">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <button className="bp-carousel-arrow bp-carousel-arrow-right" onClick={next} aria-label="Next">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </>
      )}

      {showDots && (
        <div className="bp-carousel-dots" aria-hidden>
          {dishes.map((_, i) => (
            <button
              key={i}
              className={`bp-carousel-dot ${i === activeIdx ? 'active' : ''}`}
              style={{ width: i === activeIdx ? 22 : 7 }}
              onClick={() => setActiveIdx(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Main page ── */
export default function BudgetPlanner() {
  const [hotels,        setHotels]        = useState([])
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [dishList,      setDishList]      = useState([])
  const [cart,          setCart]          = useState({})
  const [hotelsLoading, setHotelsLoading] = useState(true)
  const [dishesLoading, setDishesLoading] = useState(false)
  const [dishSearch,    setDishSearch]    = useState('')
  const [hotelSearch,   setHotelSearch]   = useState('')

  useEffect(() => {
    authApi.hotels()
      .then(r => setHotels(r.hotels || []))
      .catch(() => {})
      .finally(() => setHotelsLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedHotel) { setDishList([]); return }
    setDishesLoading(true)
    dishApi.list(selectedHotel.qr_token)
      .then(r => setDishList((r.dishes || []).filter(d => d.available)))
      .catch(() => setDishList([]))
      .finally(() => setDishesLoading(false))
  }, [selectedHotel])

  const setQty = useCallback((dish, qty) => {
    setCart(prev => {
      if (qty <= 0) { const next = { ...prev }; delete next[dish.id]; return next }
      return { ...prev, [dish.id]: { dish, qty } }
    })
  }, [])

  const pickHotel  = hotel => { setSelectedHotel(hotel); setCart({}); setDishSearch('') }
  const changeShop = () => { setSelectedHotel(null); setCart({}); setDishSearch(''); setHotelSearch('') }
  const clearCart  = () => setCart({})

  const cartItems  = Object.values(cart)
  const totalItems = cartItems.reduce((s, { qty }) => s + qty, 0)
  const total      = cartItems.reduce((s, { dish, qty }) => s + Number(dish.price) * qty, 0)

  const filteredHotels = hotels.filter(h =>
    !hotelSearch || h.hotel_name.toLowerCase().includes(hotelSearch.toLowerCase())
  )
  const filteredDishes = dishList.filter(d =>
    !dishSearch || d.name.toLowerCase().includes(dishSearch.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(dishSearch.toLowerCase())
  )

  return (
    <div className="page">
      {/* ── Header ── */}
      <div style={{ marginBottom:40 }}>
        <div className="page-eyebrow">Plan ahead</div>
        <h1 className="page-title">Budget Planner</h1>
        <p style={{ fontFamily:'Barlow Condensed,serif', fontSize:16, color:'var(--text-2)', lineHeight:1.7, marginTop:10, maxWidth:560 }}>
          Pick a restaurant, add dishes with quantities, and see your estimated total — no account needed, nothing is saved.
        </p>
      </div>

      <div className="bp-layout" style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:28, alignItems:'start' }}>

        {/* ── Left panel ── */}
        <div>
          {!selectedHotel ? (

            /* ─ Step 1: Pick a restaurant ─ */
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'.26em', color:'var(--text-3)' }}>Step 1 of 2</div>
                <div style={{ flex:1, height:1, background:'var(--border)' }} />
              </div>
              <div style={{ fontFamily:'Barlow Condensed,serif', fontWeight:700, fontSize:22, color:'var(--text)', marginBottom:18 }}>
                Choose a restaurant
              </div>

              <input
                className="field-input"
                placeholder="Search restaurants…"
                value={hotelSearch}
                onChange={e => setHotelSearch(e.target.value)}
                style={{ maxWidth:380, marginBottom:0 }}
              />

              {hotelsLoading ? (
                <div style={{ padding:'48px 0', textAlign:'center', fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.2em' }}>
                  Loading restaurants…
                </div>
              ) : filteredHotels.length === 0 ? (
                <div style={{ padding:'48px 0', textAlign:'center', fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.2em' }}>
                  No restaurants found
                </div>
              ) : (
                <div className="bp-hotel-grid">
                  {filteredHotels.map(h => (
                    <div key={h.id} className="bp-hotel-card" onClick={() => pickHotel(h)}>
                      {/* Logo */}
                      <div style={{ width:44, height:44, borderRadius:10, overflow:'hidden', flexShrink:0, background:'rgba(212,150,58,.08)', border:'1px solid rgba(212,150,58,.18)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {h.logo_path
                          ? <img src={imageUrl(h.logo_path)} alt={h.hotel_name} style={{ width:'100%', height:'100%', objectFit:'contain', display:'block', padding:'3px' }} />
                          : <span style={{ fontFamily:'Barlow Condensed,serif', fontSize:20, fontWeight:700, color:'rgba(212,150,58,.8)' }}>{h.hotel_name?.[0]}</span>
                        }
                      </div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontFamily:'Barlow Condensed,serif', fontWeight:700, fontSize:15, color:'#f2e8d0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {h.hotel_name}
                        </div>
                        <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:8.5, textTransform:'uppercase', letterSpacing:'.18em', color:'rgba(212,150,58,.55)', marginTop:3 }}>
                          Tap to browse menu
                        </div>
                      </div>
                      <svg style={{ marginLeft:'auto', flexShrink:0, color:'rgba(212,150,58,.4)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                  ))}
                </div>
              )}
            </div>

          ) : (

            /* ─ Step 2: Browse dishes as 3D carousel ─ */
            <div>
              {/* Shop header */}
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:22, flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0 }}>
                  <div style={{ width:36, height:36, borderRadius:8, overflow:'hidden', flexShrink:0, background:'rgba(212,150,58,.08)', border:'1px solid rgba(212,150,58,.18)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {selectedHotel.logo_path
                      ? <img src={imageUrl(selectedHotel.logo_path)} alt="" style={{ width:'100%', height:'100%', objectFit:'contain', display:'block', padding:'2px' }} />
                      : <span style={{ fontFamily:'Barlow Condensed,serif', fontSize:16, fontWeight:700, color:'rgba(212,150,58,.8)' }}>{selectedHotel.hotel_name?.[0]}</span>
                    }
                  </div>
                  <div>
                    <div style={{ fontFamily:'Barlow Condensed,serif', fontWeight:700, fontSize:18, color:'#f2e8d0' }}>{selectedHotel.hotel_name}</div>
                    <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:8.5, textTransform:'uppercase', letterSpacing:'.18em', color:'rgba(212,150,58,.55)' }}>
                      {dishList.length} dish{dishList.length !== 1 ? 'es' : ''} available
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={changeShop}
                  style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, textTransform:'uppercase', letterSpacing:'.16em', color:'rgba(212,150,58,.7)', background:'rgba(212,150,58,.06)', border:'1px solid rgba(212,150,58,.22)', borderRadius:10, padding:'8px 16px', cursor:'pointer', flexShrink:0, transition:'border-color .2s, color .2s' }}
                >
                  ← Change shop
                </button>
              </div>

              {/* Search */}
              <input
                className="field-input"
                placeholder="Search dishes…"
                value={dishSearch}
                onChange={e => setDishSearch(e.target.value)}
              />

              {dishesLoading ? (
                <div style={{ padding:'80px 0', textAlign:'center' }}>
                  <div style={{ width:32, height:32, border:'2px solid rgba(255,255,255,.06)', borderTop:'2px solid rgba(224,152,48,.85)', borderRadius:'50%', animation:'bp-spin .85s linear infinite', margin:'0 auto 14px' }} />
                  <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, letterSpacing:'.22em', textTransform:'uppercase', color:'var(--text-3)' }}>Loading dishes…</div>
                </div>
              ) : filteredDishes.length === 0 ? (
                <div style={{ padding:'80px 0', textAlign:'center' }}>
                  <div style={{ fontSize:40, marginBottom:16, opacity:.3 }}>🍽️</div>
                  <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.2em' }}>
                    {dishSearch ? 'No dishes match your search' : 'No dishes available'}
                  </div>
                </div>
              ) : (
                <BpDishCarousel dishes={filteredDishes} cart={cart} setQty={setQty} />
              )}
            </div>
          )}
        </div>

        {/* ── Right: Budget Summary ── */}
        <div className="bp-summary">
          <div className="bp-summary-head">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'.24em', color:'rgba(212,150,58,.55)', marginBottom:4 }}>
                  Your budget
                </div>
                <div style={{ fontFamily:'Barlow Condensed,serif', fontWeight:700, fontSize:18, color:'#f2e8d0' }}>
                  Summary
                </div>
              </div>
              {totalItems > 0 && (
                <div style={{ background:'linear-gradient(135deg,rgba(212,150,58,.80),rgba(180,110,30,.90))', color:'#fff', fontFamily:'JetBrains Mono,monospace', fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>
                  {totalItems} item{totalItems !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            {selectedHotel && (
              <div style={{ marginTop:10, fontFamily:'JetBrains Mono,monospace', fontSize:8.5, textTransform:'uppercase', letterSpacing:'.18em', color:'rgba(212,150,58,.7)', display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'rgba(212,150,58,.8)', display:'inline-block', flexShrink:0 }} />
                {selectedHotel.hotel_name}
              </div>
            )}
          </div>

          <div className="bp-summary-body">
            {cartItems.length === 0 ? (
              <div style={{ padding:'28px 0', textAlign:'center' }}>
                <div style={{ fontSize:32, marginBottom:12, opacity:.2 }}>🛒</div>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.18em', lineHeight:1.8 }}>
                  {!selectedHotel ? 'Pick a restaurant\nto get started' : 'Add dishes\nto see your total'}
                </div>
              </div>
            ) : (
              cartItems.map(({ dish, qty }) => (
                <div key={dish.id} className="bp-summary-item">
                  <div style={{ flex:1, minWidth:0, marginRight:10 }}>
                    <div style={{ fontFamily:'Barlow Condensed,serif', fontWeight:700, fontSize:13, color:'#f2e8d0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {dish.name}
                    </div>
                    <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'rgba(240,220,180,.45)', marginTop:2 }}>
                      {qty} × LKR {Number(dish.price).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, fontWeight:700, color:'rgba(212,150,58,.92)', flexShrink:0 }}>
                    LKR {(Number(dish.price) * qty).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bp-summary-foot">
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, textTransform:'uppercase', letterSpacing:'.2em', color:'rgba(212,150,58,.55)' }}>
                Estimated total
              </div>
              <div style={{ fontFamily:'Barlow Condensed,serif', fontWeight:700, fontSize:26, letterSpacing:'0.02em', background:'linear-gradient(135deg,#d4963a,#e8c56a)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                LKR {total.toLocaleString()}
              </div>
            </div>
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                style={{ width:'100%', fontFamily:'JetBrains Mono,monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'.18em', color:'rgba(212,150,58,.6)', background:'rgba(212,150,58,.06)', border:'1px solid rgba(212,150,58,.18)', borderRadius:10, padding:'9px', cursor:'pointer', transition:'border-color .2s, color .2s', marginBottom:12 }}
              >
                Clear all
              </button>
            )}
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:8, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.14em', lineHeight:1.7, opacity:.7 }}>
              Prices are indicative only. Final amounts may vary at the restaurant.
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
