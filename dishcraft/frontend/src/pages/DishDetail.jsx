import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useParams, Link } from 'react-router-dom'
import { dishes as dishApi, social, imageUrl } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotify } from '../context/NotificationContext.jsx'
import Dish360Viewer from '../components/Dish360Viewer.jsx'
import AnimatedDishBadge from '../components/AnimatedDishBadge.jsx'

;(function injectStyles() {
  let s = document.getElementById('dd-css')
  if (!s) { s = document.createElement('style'); s.id = 'dd-css'; document.head.appendChild(s) }
  s.textContent = `
    @keyframes dd-in      { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
    @keyframes dd-skel    { 0%{background-position:200% center} 100%{background-position:-200% center} }
    @keyframes dd-chili-glow { 0%,100%{opacity:.5} 50%{opacity:1} }
    .dd-in     { animation:dd-in .6s cubic-bezier(.22,1,.36,1) both; }
    .dd-in-1   { animation:dd-in .58s cubic-bezier(.22,1,.36,1) .06s both; }
    .dd-in-2   { animation:dd-in .58s cubic-bezier(.22,1,.36,1) .14s both; }
    .dd-in-3   { animation:dd-in .58s cubic-bezier(.22,1,.36,1) .22s both; }
    .dd-skel   {
      background:linear-gradient(90deg,var(--bg-2) 25%,var(--bg-3,rgba(255,255,255,.06)) 50%,var(--bg-2) 75%);
      background-size:200% 100%;
      animation:dd-skel 1.5s ease-in-out infinite;
      border-radius:12px;
    }
    .dd-png-stage {
      width:100%; min-height:280px;
      background:radial-gradient(ellipse at 50% 48%, rgba(212,150,58,.12) 0%, rgba(8,7,14,.98) 65%);
      display:flex; align-items:center; justify-content:center;
      border-radius:16px; overflow:hidden;
    }
  `
})();

const VEG_CONFIG = {
  veg:       { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  label: 'Vegetarian' },
  vegan:     { color: '#16a34a', bg: 'rgba(22,163,74,0.12)',  border: 'rgba(22,163,74,0.3)',  label: 'Vegan' },
  'non-veg': { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.28)', label: 'Non-Vegetarian' },
}

/* Standard food-type icon: square border + filled shape inside */
function FoodTypeIcon({ type, size = 18 }) {
  const cfg = VEG_CONFIG[type] ?? VEG_CONFIG['non-veg']
  const isVeg = type === 'veg' || type === 'vegan'
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" style={{ display:'block', flexShrink:0 }}>
      <rect x="1" y="1" width="18" height="18" rx="3" ry="3"
        fill="none" stroke={cfg.color} strokeWidth="2" />
      {isVeg
        ? <circle cx="10" cy="10" r="5" fill={cfg.color} />
        : <polygon points="10,4 17,16 3,16" fill={cfg.color} />
      }
    </svg>
  )
}

function VegBadge({ type = 'non-veg' }) {
  const cfg = VEG_CONFIG[type] ?? VEG_CONFIG['non-veg']
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:8,
      padding:'6px 14px 6px 10px', borderRadius:20,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
    }}>
      <FoodTypeIcon type={type} size={16} />
      <span style={{ fontFamily:'JetBrains Mono', fontSize:10, color: cfg.color, textTransform:'uppercase', letterSpacing:'0.14em' }}>
        {cfg.label}
      </span>
    </span>
  )
}

function SpiceBar({ level }) {
  const filled = Math.round(level / 2)   // 0–5 chillies
  const color  = level <= 2 ? '#4ade80' : level <= 4 ? '#a3e635' : level <= 6 ? '#fbbf24' : level <= 8 ? '#f97316' : '#ef4444'
  const label  = level <= 2 ? 'Very Mild' : level <= 4 ? 'Mild' : level <= 6 ? 'Medium' : level <= 8 ? 'Hot' : 'Very Hot'

  return (
    <span style={{ display:'inline-flex', flexDirection:'column', gap:10, alignItems:'flex-start' }}>
      <span style={{ display:'flex', alignItems:'center', gap:5 }}>
        {Array.from({ length: 5 }, (_, i) => {
          const active = i < filled
          return (
            <span key={i} style={{
              fontSize: 26, lineHeight: 1, userSelect:'none', display:'block',
              filter: active
                ? `drop-shadow(0 0 ${7 + i * 2}px ${color}) drop-shadow(0 0 3px ${color})`
                : 'grayscale(1) brightness(0.25)',
              opacity: active ? 1 : 0.5,
              transform: active ? 'scale(1.1)' : 'scale(0.85)',
              transition: 'filter .3s, opacity .3s, transform .3s',
              animation: active ? `dd-chili-glow 2s ${i * 200}ms ease-in-out infinite` : 'none',
            }}>🌶️</span>
          )
        })}
      </span>
      {/* progress bar */}
      <div style={{ position:'relative', width:'min(160px, 50vw)', height:8, borderRadius:5, background:'rgba(255,255,255,0.08)', overflow:'hidden', border:`1px solid ${color}22` }}>
        <div style={{
          position:'absolute', inset:0,
          width:`${level * 10}%`, height:'100%',
          background:'linear-gradient(90deg,#22c55e 0%,#eab308 40%,#f97316 72%,#dc2626 100%)',
          borderRadius:6,
          boxShadow:`0 0 10px ${color}77`,
          transition:'width .7s cubic-bezier(.22,1,.36,1)',
        }}/>
        <div style={{ position:'absolute', inset:'0 0 50% 0', background:'rgba(255,255,255,0.10)', borderRadius:'6px 6px 0 0', pointerEvents:'none' }}/>
      </div>

      <span style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontFamily:'JetBrains Mono', fontSize:11, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.15em' }}>{label}</span>
        <span style={{ fontFamily:'JetBrains Mono', fontSize:11, padding:'3px 11px', borderRadius:20, background:`${color}18`, border:`1px solid ${color}44`, color }}>{level}/10</span>
      </span>
    </span>
  )
}

const ctrlBtn = (disabled) => ({
  display:'flex', alignItems:'center', justifyContent:'center',
  width:34, height:34, borderRadius:'50%', cursor: disabled ? 'default' : 'pointer',
  background:'rgba(0,0,0,0.55)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
  border:'1px solid rgba(255,255,255,0.12)', color: disabled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.85)',
  transition:'background 0.15s, border-color 0.15s',
})

export default function DishDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const notify = useNotify()
  const [dish, setDish] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [favorited, setFavorited] = useState(false)
  const [activeImg, setActiveImg] = useState(0)

  // 360° viewer — zoom (inline) + pop-screen modal
  const [viewerEl, setViewerEl] = useState(null)
  const [zoom, setZoom]         = useState(1)
  const [popOpen, setPopOpen]   = useState(false)

  const setViewerElCb = useCallback(el => setViewerEl(el), [])

  // Non-passive wheel listener so we can preventDefault (stop page scroll)
  useEffect(() => {
    if (!viewerEl) return
    const onWheel = e => {
      e.preventDefault()
      setZoom(z => Math.max(1, Math.min(4, z * (e.deltaY < 0 ? 1.1 : 0.92))))
    }
    viewerEl.addEventListener('wheel', onWheel, { passive: false })
    return () => viewerEl.removeEventListener('wheel', onWheel)
  }, [viewerEl])

  // Close pop-screen on Escape
  useEffect(() => {
    if (!popOpen) return
    const onKey = e => { if (e.key === 'Escape') setPopOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [popOpen])

  // review form
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [hoverStar, setHoverStar] = useState(0)

  const reload = () => {
    setLoading(true)
    dishApi.get(id)
      .then(({ dish }) => {
        setDish(dish)
        // pre-fill if customer already reviewed
        if (user) {
          const own = dish.reviews?.find(r => r.user_id == user.id)
          if (own) {
            setRating(own.rating)
            setComment(own.comment || '')
          }
        }
      })
      .catch(err => setLoadError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [id, user?.id])

  // Check if this dish is in the customer's favorites
  useEffect(() => {
    if (user?.role === 'customer' && dish) {
      social.favorites()
        .then(({ favorites }) => {
          setFavorited(favorites.some(f => f.id == dish.id))
        })
        .catch(() => {})
    }
  }, [user?.id, dish?.id])

  const toggleFav = async () => {
    if (!user) return
    try {
      const { favorited } = await social.toggleFavorite(dish.id)
      setFavorited(favorited)
    } catch (err) { notify.error(err.message) }
  }

  const submitReview = async (e) => {
    e.preventDefault()
    if (!user) return
    if (rating < 1) { notify.warning('Pick a rating first'); return }
    try {
      await social.addReview(dish.id, rating, comment)
      reload()
      notify.success('Review saved')
    } catch (err) { notify.error(err.message) }
  }

  if (loading) return (
    <div className="page dd-in">
      <div style={{ marginBottom:22 }}>
        <div className="dd-skel" style={{ width:120, height:12 }} />
      </div>
      <div className="detail-grid">
        <div className="dd-skel" style={{ width:'100%', aspectRatio:'16/9', borderRadius:16 }} />
        <div>
          <div className="dd-skel" style={{ width:'38%', height:12, marginBottom:14 }} />
          <div className="dd-skel" style={{ width:'78%', height:38, marginBottom:18 }} />
          <div className="dd-skel" style={{ width:'60%', height:24, marginBottom:22 }} />
          <div className="dd-skel" style={{ width:'100%', height:72, marginBottom:18 }} />
          <div className="dd-skel" style={{ width:'42%', height:40 }} />
        </div>
      </div>
    </div>
  )
  if (loadError) return <div className="page"><div className="empty"><div className="empty-mark">✕</div><div className="empty-title">{loadError}</div></div></div>
  if (!dish)   return null

  const ownReview = user ? dish.reviews?.find(r => r.user_id == user.id) : null

  return (
    <div className="page dd-in">
      <div className="dd-in-1" style={{ marginBottom:22 }}>
        <Link to="/menu" style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--text-2)' }}>← Back to menu</Link>
      </div>

      <div className="detail-grid">

        {/* ── Viewer ── */}
        <div className="detail-viewer dd-in-1">
          {(dish.hotel_name || dish.owner_name) && (
            <div style={{ position:'absolute', top:14, left:'50%', transform:'translateX(-50%)', zIndex:20, whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:8, padding:'7px 18px', background:'rgba(0,0,0,0.55)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)', border:'1px solid rgba(245,166,35,0.35)', borderRadius:50, fontFamily:'JetBrains Mono, monospace', fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(245,166,35,0.9)' }}>
              {dish.hotel_name || dish.owner_name}
            </div>
          )}

          {dish.video_path ? (
            <div ref={setViewerElCb} style={{ position:'absolute', inset:0, borderRadius:18, overflow:'hidden', background:'#080808' }}>
              <div style={{ position:'relative', width:'100%', height:'100%', transform: zoom !== 1 ? `scale(${zoom})` : undefined, transformOrigin:'center center', willChange: zoom !== 1 ? 'transform' : 'auto' }}>
                <Dish360Viewer
                  src={imageUrl(dish.video_path)}
                  poster={dish.png_path ? imageUrl(dish.png_path) : dish.image_path ? imageUrl(dish.image_path) : undefined}
                  style={{ position:'absolute', inset:0, aspectRatio:'unset', borderRadius:0 }}
                />
              </div>
              {zoom > 1.01 && (
                <div style={{ position:'absolute', top:14, left:14, zIndex:10, display:'flex', alignItems:'center', gap:8, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:50, padding:'5px 12px' }}>
                  <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'rgba(255,200,80,0.9)', letterSpacing:'0.1em' }}>{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom(1)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.5)', fontSize:11, padding:0, lineHeight:1 }}>reset</button>
                </div>
              )}
              <div style={{ position:'absolute', bottom:14, right:14, zIndex:10, display:'flex', alignItems:'center', gap:6 }}>
                <button onClick={() => setZoom(z => Math.max(1, +(z - 0.25).toFixed(2)))} disabled={zoom <= 1} style={ctrlBtn(zoom <= 1)} title="Zoom out">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                </button>
                <button onClick={() => setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))} disabled={zoom >= 4} style={ctrlBtn(zoom >= 4)} title="Zoom in">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                </button>
                <button onClick={() => setPopOpen(true)} style={ctrlBtn(false)} title="Pop out">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                </button>
              </div>
              {popOpen && createPortal(
                <div onClick={() => setPopOpen(false)} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(4,3,8,0.88)', backdropFilter:'blur(22px)', WebkitBackdropFilter:'blur(22px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 24px' }}>
                  <div onClick={e => e.stopPropagation()} style={{ position:'relative', width:'min(94vw, 150vh)', aspectRatio:'16/9' }}>
                    <Dish360Viewer
                      src={imageUrl(dish.video_path)}
                      poster={dish.png_path ? imageUrl(dish.png_path) : dish.image_path ? imageUrl(dish.image_path) : undefined}
                      style={{ width:'100%', height:'100%', aspectRatio:'unset', borderRadius:14 }}
                    />
                    <button onClick={() => setPopOpen(false)} style={{ position:'absolute', top:-16, right:-16, width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.18)', cursor:'pointer', color:'#fff', fontSize:17, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)' }}>✕</button>
                  </div>
                </div>,
                document.body
              )}
            </div>
          ) : dish.png_path ? (
            <div className="dd-png-stage">
              <AnimatedDishBadge src={imageUrl(dish.png_path)} name={dish.name} size={260} />
            </div>
          ) : (
            <>
              <img src={imageUrl(dish.images?.[activeImg] ?? dish.image_path)} alt={dish.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              {dish.images?.length > 1 && (
                <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
                  {dish.images.map((img, i) => (
                    <div key={i} onClick={() => setActiveImg(i)} style={{ width:64, height:48, borderRadius:6, overflow:'hidden', cursor:'pointer', flexShrink:0, outline: activeImg === i ? '2px solid var(--amber)' : '2px solid transparent' }}>
                      <img src={imageUrl(img)} alt={`view ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Info ── */}
        <div className="detail-info dd-in-2">
          <div>
            <div style={{ width:36, height:3, borderRadius:2, background:'var(--grad)', marginBottom:10 }} />
            <h1 className="detail-name">{dish.name}</h1>
            <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', marginTop:14 }}>
              <VegBadge type={dish.food_type} />
              <span style={{ width:1, height:32, background:'var(--border)', flexShrink:0 }} />
              <SpiceBar level={dish.spice_level ?? 5} />
            </div>
          </div>

          {dish.description && <p className="detail-description">{dish.description}</p>}

          <div style={{ display:'flex', alignItems:'baseline', gap:4, borderTop:'1px solid rgba(245,166,35,0.18)', paddingTop:18 }}>
            <span className="detail-price-currency">LKR</span>
            <span className="detail-price">{Number(dish.price).toLocaleString()}</span>
          </div>

          <div className="detail-rows-box">
            {dish.portion_size && /^[1-4]$/.test(dish.portion_size) && (
              <div className="detail-row" style={{ alignItems:'center' }}>
                <span style={{ fontFamily:'Barlow Condensed, serif', fontSize:22, fontWeight:800, letterSpacing:'0.04em' }}>Portion</span>
                <img
                  src={`/${dish.portion_size}.png`}
                  alt={`Portion size ${dish.portion_size}`}
                  style={{ height:72, objectFit:'contain', display:'block' }}
                />
              </div>
            )}
            <div className="detail-row">
              <span>Rating</span>
              <span>{dish.avg_rating ? `★ ${dish.avg_rating} · ${dish.review_count} review${dish.review_count===1?'':'s'}` : 'No reviews'}</span>
            </div>
            <div className="detail-row">
              <span>Availability</span>
              <span style={{ display:'flex', alignItems:'center', gap:6, color: dish.available ? '#22c55e' : '#ef4444' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'currentColor', flexShrink:0, display:'inline-block' }} />
                {dish.available ? 'Available now' : 'Currently unavailable'}
              </span>
            </div>
          </div>

          {dish.ingredients?.length > 0 && (
            <div>
              <div className="section-h">Ingredients</div>
              <div className="ingredient-list">
                {dish.ingredients.map((ing, i) => <span className="ingredient-chip" key={i}>{ing}</span>)}
              </div>
            </div>
          )}

          {user?.role === 'customer' && (
            <button className={`fav-btn ${favorited ? 'active' : ''}`} onClick={toggleFav}>
              <span>{favorited ? '♥' : '♡'}</span>
              <span>{favorited ? 'Saved to favorites' : 'Save to favorites'}</span>
            </button>
          )}
          {!user && (
            <Link to="/login">
              <button className="btn btn-ghost" style={{ width:'100%' }}>Sign in to favorite & review</button>
            </Link>
          )}
        </div>
      </div>

      {/* ── Reviews ── */}
      <div className="dd-in-3" style={{ marginTop:56 }}>
        <div className="section-h">Reviews · {dish.review_count}</div>

        {user?.role === 'customer' && (
          <form className="review-form" onSubmit={submitReview}>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--text-2)', marginBottom:6 }}>
              {ownReview ? 'Update your review' : 'Leave a review'}
            </div>
            <div className="star-row">
              {[1,2,3,4,5].map(n => (
                <span key={n} className={`star ${(hoverStar || rating) >= n ? 'filled' : ''}`} onClick={() => setRating(n)} onMouseEnter={() => setHoverStar(n)} onMouseLeave={() => setHoverStar(0)}>★</span>
              ))}
              <span style={{ marginLeft:12, fontFamily:'JetBrains Mono, monospace', fontSize:11, color:'var(--text-2)', alignSelf:'center' }}>
                {rating ? `${rating} / 5` : 'pick a rating'}
              </span>
            </div>
            <textarea className="field-textarea" placeholder="Share your impressions…" value={comment} onChange={e => setComment(e.target.value)} style={{ width:'100%', marginBottom:12 }} />
            <button className="btn">{ownReview ? 'Update review' : 'Submit review'}</button>
          </form>
        )}

        {dish.reviews?.length > 0 ? (
          <div className="review-list">
            {dish.reviews.map(r => (
              <div className="review-item" key={r.id}>
                <div className="review-head">
                  <span className="review-author">{r.user_name}</span>
                  <span className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                {r.comment && <p className="review-comment">{r.comment}</p>}
                <div className="review-meta">{new Date(r.created_at).toLocaleDateString()}</div>
                {r.owner_reply && (
                  <div className="review-owner-reply">
                    <div className="review-owner-reply-label">Owner reply</div>
                    <p className="review-owner-reply-body">{r.owner_reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontFamily:'Barlow Condensed, sans-serif', color:'var(--text-2)', padding:20, textAlign:'center' }}>
            No reviews yet — be the first to share your thoughts.
          </p>
        )}
      </div>
    </div>
  )
}
