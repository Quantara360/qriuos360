import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { auth as authApi, imageUrl } from '../api/client.js'
import { useNotify } from '../context/NotificationContext.jsx'

;(function injectStyles() {
  if (document.getElementById('menu-css')) return
  const s = document.createElement('style')
  s.id = 'menu-css'
  s.textContent = `
    @keyframes mnu-card-in { 0%{opacity:0;transform:translateY(18px)} 100%{opacity:1;transform:translateY(0)} }
    @keyframes mnu-card-glow {
      0%,100% { box-shadow: 0 4px 20px rgba(0,0,0,.35), 0 0 0px rgba(245,166,35,0); }
      50%      { box-shadow: 0 8px 36px rgba(0,0,0,.45), 0 0 22px rgba(245,166,35,.13); }
    }
    @keyframes mnu-shimmer {
      0%   { transform: translateX(-130%) skewX(-20deg); }
      100% { transform: translateX(320%)  skewX(-20deg); }
    }

    /* ── Grid ── */
    .mnu-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }
    @media (max-width: 640px) { .mnu-grid { grid-template-columns: 1fr; gap: 18px; } }

    /* ── Card shell ── */
    .mnu-card {
      position: relative;
      border-radius: 22px;
      overflow: hidden;
      background: linear-gradient(160deg, #0d1a2e 0%, #091018 100%);
      border: 1px solid rgba(245,166,35,.22);
      display: flex;
      flex-direction: column;
      cursor: pointer;
      transition: transform .28s cubic-bezier(.34,1.56,.64,1), box-shadow .28s, border-color .28s;
      text-decoration: none;
      color: inherit;
    }
    .mnu-card::after {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 45%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(245,166,35,.15), transparent);
      transform: translateX(-130%) skewX(-20deg);
      pointer-events: none;
      z-index: 1;
    }
    .mnu-card:hover {
      transform: translateY(-10px);
      box-shadow: 0 28px 70px rgba(0,0,0,.6), 0 0 30px rgba(245,166,35,.22);
      border-color: rgba(245,166,35,.65);
    }
    .mnu-card:hover::after {
      animation: mnu-shimmer .72s ease forwards;
    }

    /* ── Cover image ── */
    .mnu-card-cover {
      width: 100%;
      height: 190px;
      overflow: hidden;
      position: relative;
      flex-shrink: 0;
    }
    .mnu-card-cover img {
      width: 100%; height: 100%;
      object-fit: cover; display: block;
      transition: transform .45s ease;
    }
    .mnu-card:hover .mnu-card-cover img { transform: scale(1.06); }
    .mnu-card-cover-placeholder {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      flex-direction: column; gap: 12px;
    }
    .mnu-card-cover-logo {
      width: 72px; height: 72px;
      border-radius: 50%;
      background: rgba(255,255,255,.12);
      border: 2px solid rgba(255,255,255,.2);
      overflow: hidden;
      display: flex; align-items: center; justify-content: center;
    }
    .mnu-card-cover-logo img { width: 100%; height: 100%; object-fit: contain; padding: 10px; display: block; }
    .mnu-card-cover-initial {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 32px; font-weight: 800;
      color: rgba(255,255,255,.9);
    }

    /* ── Body ── */
    .mnu-card-body {
      padding: 20px 22px 18px;
      text-align: center;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .mnu-card-eyebrow {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: .2em;
      font-weight: 700;
    }
    .mnu-card-name {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 26px; font-weight: 800;
      letter-spacing: 0.02em;
      color: var(--text);
      line-height: 1.1;
      transition: color .2s;
    }
    .mnu-card:hover .mnu-card-name { color: var(--amber); }
    .mnu-card-desc {
      font-size: 13px;
      color: var(--text-2);
      line-height: 1.55;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      max-width: 240px;
    }

    /* ── Stats bar ── */
    .mnu-card-stats {
      display: flex;
      align-items: stretch;
      flex-shrink: 0;
    }
    .mnu-stat {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 14px 6px;
      color: #fff;
      gap: 3px;
      text-decoration: none;
      transition: filter .2s;
    }
    .mnu-stat:hover { filter: brightness(1.15); }
    .mnu-stat-val {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 24px; font-weight: 800;
      line-height: 1; letter-spacing: 0.02em;
    }
    .mnu-stat-lbl {
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.5px; letter-spacing: .2em;
      text-transform: uppercase; opacity: .82;
    }
    .mnu-stat-div {
      width: 1px;
      background: rgba(255,255,255,.22);
      margin: 8px 0;
      flex-shrink: 0;
    }

    /* card always has a dark bg — keep text bright in light mode */
    [data-theme="light"] .mnu-card-name { color: #f3eadb; }
    [data-theme="light"] .mnu-card:hover .mnu-card-name { color: var(--amber); }
    [data-theme="light"] .mnu-card-desc { color: rgba(243,234,219,.68); }
  `
  document.head.appendChild(s)
})()

const ACCENTS = [
  { bg: '#e91e8c', grad: 'linear-gradient(135deg,#e91e8c,#c2185b)' },
  { bg: '#ff5722', grad: 'linear-gradient(135deg,#ff5722,#e64a19)' },
  { bg: '#43a047', grad: 'linear-gradient(135deg,#43a047,#2e7d32)' },
  { bg: '#7b1fa2', grad: 'linear-gradient(135deg,#7b1fa2,#6a1b9a)' },
  { bg: '#0097a7', grad: 'linear-gradient(135deg,#0097a7,#00838f)' },
  { bg: '#f57c00', grad: 'linear-gradient(135deg,#f57c00,#e65100)' },
]

export default function Menu() {
  const navigate = useNavigate()
  const notify   = useNotify()
  const [searchParams, setSearchParams] = useSearchParams()
  const cuisineFilter = searchParams.get('cuisine') || ''

  const [hotels,  setHotels]  = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    authApi.hotels()
      .then(r => setHotels(r.hotels || []))
      .catch(err => notify.error(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = hotels.filter(h => {
    const ok = !search || (h.hotel_name || '').toLowerCase().includes(search.toLowerCase())
    if (!cuisineFilter) return ok
    const types = Array.isArray(h.cuisine_type) ? h.cuisine_type : (h.cuisine_type ? [h.cuisine_type] : [])
    return ok && types.includes(cuisineFilter)
  })

  const clearCuisine = () => {
    const n = new URLSearchParams(searchParams); n.delete('cuisine'); setSearchParams(n)
  }

  return (
    <div className="page">

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <div className="page-eyebrow">Browse · all restaurants</div>
          <h1 className="page-title">Our hotels.</h1>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>← Back</button>
          {!loading && (
            <div style={{ fontFamily:'JetBrains Mono', fontSize:11, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--text-3)', whiteSpace:'nowrap' }}>
              <span style={{ color:'var(--amber)', fontWeight:700 }}>{filtered.length}</span>
              <span style={{ margin:'0 4px', opacity:.4 }}>/</span>
              {hotels.length} restaurants
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom: cuisineFilter ? 14 : 32, flexWrap:'wrap' }}>
        <div style={{ position:'relative', maxWidth:400, flex:1 }}>
          <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', opacity:.35, pointerEvents:'none' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input
            className="field-input"
            placeholder="Search restaurants…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft:40, paddingRight: search ? 36 : 16 }}
          />
          {search && (
            <button type="button" onClick={() => setSearch('')}
              style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:17, lineHeight:1, padding:0 }}>
              ×
            </button>
          )}
        </div>
      </div>

      {cuisineFilter && (
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
          <span style={{ fontFamily:'JetBrains Mono', fontSize:9, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--text-3)' }}>Filtered by</span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 12px', borderRadius:20, background:'rgba(224,152,48,.1)', border:'1px solid rgba(224,152,48,.35)', fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--amber)' }}>
            {cuisineFilter}
            <button type="button" onClick={clearCuisine} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--amber)', fontSize:14, lineHeight:1, padding:0, opacity:.7 }}>×</button>
          </span>
        </div>
      )}

      {/* Hotels grid */}
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'48px 0' }}>
          <div className="spinner" />
          <span style={{ fontFamily:'JetBrains Mono', fontSize:11, letterSpacing:'.2em', textTransform:'uppercase', color:'var(--text-3)' }}>Loading restaurants…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-mark">◌</div>
          <div className="empty-title">No restaurants found</div>
          <div className="empty-sub">{hotels.length === 0 ? 'No restaurants have published menus yet' : 'Try a different search term'}</div>
          {search && <button className="btn btn-ghost btn-tiny" style={{ marginTop:20 }} onClick={() => setSearch('')}>Clear search</button>}
        </div>
      ) : (
        <div className="mnu-grid">
          {filtered.map((h, i) => {
            const types   = Array.isArray(h.cuisine_type) ? h.cuisine_type : (h.cuisine_type ? [h.cuisine_type] : [])
            const accent  = ACCENTS[i % ACCENTS.length]
            const dishes  = h.dish_count ?? 0
            const eyebrow = types[0] || 'Restaurant'
            const desc    = types.length > 1 ? types.join(' · ') : (types[0] || 'All cuisines')

            return (
              <div
                key={h.id}
                className="mnu-card"
                style={{ animation:`mnu-card-in .45s ${Math.min(i * 60, 360)}ms ease both, mnu-card-glow 3s ${Math.min(i * 60, 360) + 500}ms ease-in-out infinite` }}
                onClick={() => navigate(`/hotel/${h.qr_token}`)}
              >
                {/* Cover image */}
                <div className="mnu-card-cover">
                  {h.banner_path ? (
                    <img src={imageUrl(h.banner_path)} alt={h.hotel_name} />
                  ) : (
                    <div className="mnu-card-cover-placeholder" style={{ background: accent.grad }}>
                      <div className="mnu-card-cover-logo">
                        {h.logo_path
                          ? <img src={imageUrl(h.logo_path)} alt={h.hotel_name} />
                          : <span className="mnu-card-cover-initial">{(h.hotel_name || '?')[0].toUpperCase()}</span>
                        }
                      </div>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="mnu-card-body">
                  <div className="mnu-card-eyebrow" style={{ color: accent.bg }}>{eyebrow}</div>
                  <div className="mnu-card-name">{h.hotel_name}</div>
                  {types.length > 0 && (
                    <div className="mnu-card-desc">{desc}</div>
                  )}
                </div>

                {/* Stats bar */}
                <div className="mnu-card-stats" style={{ background: accent.bg }}>
                  <div className="mnu-stat">
                    <div className="mnu-stat-val">{dishes}</div>
                    <div className="mnu-stat-lbl">Dishes</div>
                  </div>
                  <div className="mnu-stat-div" />
                  <div className="mnu-stat">
                    <div className="mnu-stat-val">{types.length || 1}</div>
                    <div className="mnu-stat-lbl">Cuisines</div>
                  </div>
                  <div className="mnu-stat-div" />
                  <Link
                    to={`/hotel/${h.qr_token}`}
                    className="mnu-stat"
                    style={{ textDecoration:'none' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="mnu-stat-val" style={{ fontSize:28 }}>›</div>
                    <div className="mnu-stat-lbl">View Menu</div>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
