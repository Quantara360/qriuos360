import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { dishes as dishApi, categories as catApi, subscriptions as subApi, auth as authApi, offers as offersApi, imageUrl } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotify } from '../context/NotificationContext.jsx'

/* ── compact dish card for top/hated lists ── */
function MiniDishCard({ dish, accent }) {
  const stars = Math.round(Number(dish.avg_rating))
  return (
    <Link to={`/dish/${dish.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        width: 180, flexShrink: 0,
        borderRadius: 12, overflow: 'hidden',
        border: '1px solid var(--border)',
        background: 'var(--bg-2)',
        transition: 'transform 0.18s, box-shadow 0.18s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
      >
        <div style={{ aspectRatio: '4/3', overflow: 'hidden', position: 'relative' }}>
          <img src={imageUrl(dish.image_path)} alt={dish.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {dish.available == 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#fff', background: 'rgba(220,38,38,0.85)', padding: '3px 8px', borderRadius: 4 }}>
                Suspended
              </span>
            </div>
          )}
        </div>
        <div style={{ padding: '10px 12px' }}>
          <div style={{ fontFamily: 'Barlow Condensed, serif', fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 4, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {dish.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 1 }}>
              {[1,2,3,4,5].map(i => (
                <span key={i} style={{ fontSize: 11, color: i <= stars ? accent : 'var(--border-mid)' }}>★</span>
              ))}
            </div>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.12em' }}>
              {dish.avg_rating} · {dish.review_count}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ── horizontal scrollable ranked list ── */
function RankedRow({ title, dishes, accent, emptyMsg }) {
  const trackRef = useRef()
  const scroll = dir => trackRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' })

  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="section-h" style={{ marginBottom: 0 }}>{title}</div>
        {dishes.length > 0 && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="carousel-nav-btn" onClick={() => scroll(-1)}>&#8592;</button>
            <button className="carousel-nav-btn" onClick={() => scroll(1)}>&#8594;</button>
          </div>
        )}
      </div>
      {dishes.length === 0 ? (
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
          {emptyMsg}
        </p>
      ) : (
        <div ref={trackRef} style={{
          display: 'flex', gap: 12,
          overflowX: 'auto', paddingBottom: 8,
          scrollbarWidth: 'none',
        }}>
          {dishes.map((d, i) => (
            <div key={d.id} style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', top: 8, left: 8, zIndex: 2,
                width: 22, height: 22, borderRadius: '50%',
                background: accent === '#4ade80' ? 'rgba(74,222,128,0.9)' : 'rgba(248,113,113,0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, color: '#000',
              }}>
                {i + 1}
              </div>
              <MiniDishCard dish={d} accent={accent} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function OwnerDashboard() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const notify = useNotify()

  const [dishes, setDishes]     = useState([])
  const [cats, setCats]         = useState([])
  const [quota, setQuota]       = useState(0)
  const [quotaExpiresAt, setQuotaExpiresAt] = useState(null)
  const [subs, setSubs]         = useState([])
  const [topData, setTopData]   = useState({ best: [], worst: [] })
  const [newCat, setNewCat]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)

  // Banner state
  const [bannerPreview, setBannerPreview] = useState(user?.banner_path ? imageUrl(user.banner_path) : '')
  const [bannerFile, setBannerFile]       = useState(null)
  const [bannerSaving, setBannerSaving]   = useState(false)
  const bannerRef = useRef()

  // Drone footage state
  const [dronePreview, setDronePreview] = useState(user?.drone_footage_path ? imageUrl(user.drone_footage_path) : '')
  const [droneFile, setDroneFile]       = useState(null)
  const [droneSaving, setDroneSaving]   = useState(false)
  const droneRef = useRef()

  const isOwner = user?.role === 'owner'

  const publicOrigin = import.meta.env.VITE_PUBLIC_URL || window.location.origin
  const menuUrl = user?.qr_token
    ? `${publicOrigin}/hotel/${user.qr_token}`
    : null
  const qrOnLocalhost = menuUrl && /localhost|127\.0\.0\.1/.test(publicOrigin)

  const reload = () => {
    const _isOwner = user?.role === 'owner'
    setLoading(true)
    const promises = [
      dishApi.mine(),
      _isOwner ? catApi.list() : Promise.resolve({ categories: [] }),
      _isOwner ? subApi.myList() : Promise.resolve(null),
      _isOwner ? dishApi.topDishes() : Promise.resolve(null),
    ]
    Promise.all(promises)
      .then(([d, c, s, t]) => {
        setDishes(d.dishes)
        setCats(c.categories)
        if (s) { setQuota(s.quota ?? 0); setQuotaExpiresAt(s.subscription_expires_at ?? null); setSubs(s.subscriptions ?? []) }
        if (t) setTopData(t)
        setDataLoaded(true)
      })
      .catch(err => notify.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (user?.id && user?.role) reload() }, [user?.id, user?.role])

  // ── dish actions ──────────────────────────────────────────
  const remove = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try { await dishApi.remove(id); reload() }
    catch (err) { notify.error(err.message) }
  }

  const toggleAvail = async (id) => {
    try {
      const res = await dishApi.toggleAvailable(id)
      setDishes(prev => prev.map(d => d.id === id ? { ...d, available: res.available } : d))
    } catch (err) { notify.error(err.message) }
  }

  // ── category actions ──────────────────────────────────────
  const addCat = async (e) => {
    e.preventDefault()
    const name = newCat.trim()
    if (!name) return
    try {
      const { category } = await catApi.create(name)
      setCats(prev => [...prev, category])
      setNewCat('')
    } catch (err) { notify.error(err.message) }
  }

  const deleteCat = async (id) => {
    if (!confirm('Delete this category? Dishes will become uncategorised.')) return
    try { await catApi.remove(id); setCats(prev => prev.filter(c => c.id !== id)) }
    catch (err) { notify.error(err.message) }
  }

  // ── banner actions ────────────────────────────────────────
  const onBannerPick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { notify.error('Please pick an image file'); return }
    setBannerFile(file)
    setBannerPreview(prev => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  const saveBanner = async () => {
    if (!bannerFile) return
    setBannerSaving(true)
    const fd = new FormData()
    fd.append('banner', bannerFile)
    try {
      const res = await authApi.updateBanner(fd)
      setBannerFile(null)
      if (setUser) setUser(u => ({ ...u, banner_path: res.banner_path }))
    } catch (err) { notify.error(err.message) }
    finally { setBannerSaving(false) }
  }

  const removeBanner = async () => {
    if (!confirm('Remove the hotel banner?')) return
    setBannerSaving(true)
    try {
      await authApi.removeBanner()
      setBannerPreview('')
      setBannerFile(null)
      if (setUser) setUser(u => ({ ...u, banner_path: null }))
    } catch (err) { notify.error(err.message) }
    finally { setBannerSaving(false) }
  }

  const onDronePick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDroneFile(file)
    setDronePreview(URL.createObjectURL(file))
  }

  const saveDroneFootage = async () => {
    if (!droneFile) return
    setDroneSaving(true)
    const fd = new FormData()
    fd.append('drone_footage', droneFile)
    try {
      const res = await authApi.updateDroneFootage(fd)
      setDroneFile(null)
      if (setUser) setUser(u => ({ ...u, drone_footage_path: res.drone_footage_path }))
    } catch (err) { notify.error(err.message) }
    finally { setDroneSaving(false) }
  }

  const removeDroneFootage = async () => {
    if (!confirm('Remove drone footage?')) return
    setDroneSaving(true)
    try {
      await authApi.removeDroneFootage()
      setDronePreview('')
      setDroneFile(null)
      if (setUser) setUser(u => ({ ...u, drone_footage_path: null }))
    } catch (err) { notify.error(err.message) }
    finally { setDroneSaving(false) }
  }

  // ── QR download ───────────────────────────────────────────
  const downloadQR = () => {
    const svg = document.getElementById('hotel-qr-svg')
    if (!svg) return
    const scale = 4
    const size  = 176 * scale
    const svgData = new XMLSerializer().serializeToString(svg)
    const blob    = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url     = URL.createObjectURL(blob)
    const img     = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      URL.revokeObjectURL(url)
      const a = document.createElement('a')
      a.download = `${user?.hotel_name || 'menu'}-qr.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    img.src = url
  }

  // ── derived values ────────────────────────────────────────
  const liveDishes   = dishes.filter(d => d.available == 1).length
  const hiddenDishes = dishes.filter(d => d.available == 0).length
  const quotaPct      = quota > 0 ? Math.min(100, Math.round((dishes.length / quota) * 100)) : 0
  const quotaExpired  = quotaExpiresAt && new Date(quotaExpiresAt) < new Date()
  const hasPendingSub = subs.some(s => s.status === 'pending')
  const quotaColour   = hasPendingSub ? 'var(--amber)'
                      : (quotaExpired || quota === 0 || dishes.length >= quota) ? 'var(--bad)'
                      : quotaPct >= 70 ? 'var(--amber)'
                      : 'var(--good)'

  return (
    <div className="page">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">{user?.hotel_name || 'Hotel owner'} · Workspace</div>
          <h1 className="page-title">My dashboard.</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={() => navigate('/owner/new')}>+ New dish</button>
        </div>
      </div>

      {/* ── Subscription warning banner ── */}
      {isOwner && dataLoaded && (hasPendingSub || quotaExpired || quota === 0) && (
        <div onClick={() => navigate('/owner/subscription')} style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '16px 22px', borderRadius: 14, marginBottom: 24,
          cursor: 'pointer',
          border: `1px solid ${hasPendingSub ? 'rgba(245,166,35,0.45)' : 'rgba(239,68,68,0.45)'}`,
          background: hasPendingSub ? 'rgba(245,166,35,0.08)' : 'rgba(239,68,68,0.08)',
        }}>
          <span style={{ fontSize: 26, flexShrink: 0 }}>{hasPendingSub ? '⏳' : '🚨'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: hasPendingSub ? 'var(--amber)' : 'var(--bad)', marginBottom: 3 }}>
              {hasPendingSub ? 'Payment under review' : quotaExpired ? 'Subscription expired' : 'No active subscription'}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.1em' }}>
              {hasPendingSub
                ? 'Your payment slip is awaiting admin approval — tap to view'
                : quotaExpired
                  ? 'Your dishes are hidden from customers — renew to restore visibility'
                  : 'Purchase a quota to start listing dishes'}
            </div>
          </div>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: hasPendingSub ? 'var(--amber)' : 'var(--bad)', letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0 }}>
            {hasPendingSub ? 'View →' : 'Fix now →'}
          </span>
        </div>
      )}

      {/* ── Stats row ── */}
      {isOwner && (
        <div className="stat-grid" style={{ marginBottom: 36 }}>
          <div className="stat-card">
            <div className="stat-label">Dish quota</div>
            <div className="stat-value" style={{ color: quotaColour, fontSize: 42 }}>
              {dishes.length}
              <span style={{ fontSize: 18, color: 'var(--text-3)', fontWeight: 400 }}> / {quota}</span>
            </div>
            <div style={{ marginTop: 10, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${quotaPct}%`, background: quotaColour, transition: 'width 0.6s ease', borderRadius: 3 }} />
            </div>
            <button
              onClick={() => navigate('/owner/subscription')}
              style={{ marginTop: 10, background: 'none', border: 'none', fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.16em', color: !hasPendingSub && quotaExpired ? 'var(--bad)' : 'var(--amber)', cursor: 'pointer', padding: 0, opacity: 0.85 }}
            >
              {hasPendingSub ? 'View payment →' : quota === 0 ? 'Buy quota →' : quotaExpired ? 'Renew now →' : 'Upgrade →'}
            </button>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total dishes</div>
            <div className="stat-value">{dishes.length}</div>
            <div style={{ marginTop: 8, fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-3)', letterSpacing: '.14em', textTransform: 'uppercase' }}>
              in your menu
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Live</div>
            <div className="stat-value" style={{ color: 'var(--good)' }}>{liveDishes}</div>
            <div style={{ marginTop: 8, fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--good)', letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.75 }}>
              visible to customers
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Suspended</div>
            <div className="stat-value" style={{ color: hiddenDishes > 0 ? 'var(--bad)' : 'var(--text-3)' }}>{hiddenDishes}</div>
            <div style={{ marginTop: 8, fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-3)', letterSpacing: '.14em', textTransform: 'uppercase' }}>
              hidden from menu
            </div>
          </div>
        </div>
      )}

      {/* ── Banner upload ── */}
      {isOwner && (
        <div style={{ marginBottom: 36, border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', background: 'var(--bg-2)' }}>
          <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="section-h" style={{ marginBottom: 3 }}>Hotel banner</div>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.13em', textTransform: 'uppercase', margin: 0 }}>
                Displayed prominently on your public menu page · Recommended 1600 × 500 px
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-tiny" onClick={() => bannerRef.current?.click()}>
                {bannerPreview ? 'Change' : 'Upload banner'}
              </button>
              {bannerFile && (
                <button className="btn btn-tiny" onClick={saveBanner} disabled={bannerSaving}>
                  {bannerSaving ? 'Saving…' : 'Save banner'}
                </button>
              )}
              {bannerPreview && !bannerFile && (
                <button className="btn btn-tiny btn-danger" onClick={removeBanner} disabled={bannerSaving}>Remove</button>
              )}
            </div>
          </div>

          <input ref={bannerRef} type="file" accept="image/jpeg,image/png,image/webp"
            onChange={onBannerPick} style={{ display: 'none' }} />

          {bannerPreview ? (
            <img src={bannerPreview} alt="banner"
              style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
          ) : (
            <div
              onClick={() => bannerRef.current?.click()}
              style={{
                height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-3)',
                fontFamily: 'JetBrains Mono', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em',
              }}
            >
              Click to upload a wide banner image
            </div>
          )}
        </div>
      )}

      {/* ── Drone footage panel ── */}
      {isOwner && (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="section-h" style={{ marginBottom: 3 }}>Drone footage</div>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.13em', textTransform: 'uppercase', margin: 0 }}>
                Aerial video shown at the top of your public menu · MP4 / MOV / WebM · Max 300 MB
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-tiny" onClick={() => droneRef.current?.click()}>
                {dronePreview ? 'Change' : 'Upload video'}
              </button>
              {droneFile && (
                <button className="btn btn-tiny" onClick={saveDroneFootage} disabled={droneSaving}>
                  {droneSaving ? 'Uploading…' : 'Save video'}
                </button>
              )}
              {dronePreview && !droneFile && (
                <button className="btn btn-tiny btn-danger" onClick={removeDroneFootage} disabled={droneSaving}>Remove</button>
              )}
            </div>
          </div>

          <input ref={droneRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
            onChange={onDronePick} style={{ display: 'none' }} />

          {dronePreview ? (
            <video
              src={dronePreview}
              controls
              muted
              playsInline
              style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block', background: '#000' }}
            />
          ) : (
            <div
              onClick={() => droneRef.current?.click()}
              style={{
                height: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
                cursor: 'pointer', color: 'var(--text-3)',
                fontFamily: 'JetBrains Mono', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: .4 }}>
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
              Click to upload drone footage
            </div>
          )}
        </div>
      )}

      {/* ── QR Code panel ── */}
      {menuUrl && (
        <div className="qr-panel">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            <div style={{ padding: 18, background: '#fff', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.45)' }}>
              <QRCodeSVG id="hotel-qr-svg" value={menuUrl} size={176} level="M" includeMargin={false} />
            </div>
            <button className="btn btn-ghost btn-tiny" onClick={downloadQR}>↓ Download QR</button>
          </div>
          <div style={{ flex: 1 }}>
            <div className="page-eyebrow" style={{ marginBottom: 10 }}>Your menu QR code</div>
            <div style={{ fontFamily: 'Barlow Condensed, serif', fontSize: 22, fontWeight: 700, marginBottom: 16, color: 'var(--text)', lineHeight: 1.3 }}>
              Customers scan this<br/>to see your <em style={{ fontStyle: 'normal', background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>live menu</em>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.14em', wordBreak: 'break-all', background: 'var(--bg-3)', padding: '10px 14px', borderRadius: 8, marginBottom: 16, border: '1px solid var(--border)' }}>
              {menuUrl}
            </div>
            {qrOnLocalhost && (
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: '0.12em', lineHeight: 1.7, background: 'rgba(245,166,35,.08)', border: '1px solid rgba(245,166,35,.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: 'var(--text-2)' }}>
                ⚠ QR points to <b>localhost</b> — phones can't reach it.<br/>
                Set <code style={{ background: 'rgba(255,255,255,.08)', padding: '1px 5px', borderRadius: 4 }}>VITE_PUBLIC_URL</code> in <code style={{ background: 'rgba(255,255,255,.08)', padding: '1px 5px', borderRadius: 4 }}>.env</code> to your network IP or production domain, then restart the dev server.
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link to={`/hotel/${user?.qr_token}`}>
                <button className="btn btn-tiny">Preview menu →</button>
              </Link>
              <button className="btn btn-ghost btn-tiny" onClick={downloadQR}>Download QR</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top 10 loved ── */}
      {isOwner && !loading && (
        <RankedRow
          title="Top 10 loved dishes"
          dishes={topData.best}
          accent="#4ade80"
          emptyMsg="No reviews yet — start collecting customer feedback"
        />
      )}

      {/* ── Top 10 hated ── */}
      {isOwner && !loading && (
        <RankedRow
          title="Top 10 hated dishes"
          dishes={topData.worst}
          accent="#f87171"
          emptyMsg="No reviews yet"
        />
      )}

      {/* ── Food categories ── */}
      <div style={{ marginBottom: 36 }}>
        <div className="section-h">Food categories</div>
        <form onSubmit={addCat} style={{ display: 'flex', gap: 8, marginBottom: 14, maxWidth: 420 }}>
          <input
            className="field-input"
            placeholder="e.g. Starters, Mains, Desserts…"
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn" type="submit">Add</button>
        </form>
        {cats.length === 0 ? (
          <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
            No categories yet — dishes will show without grouping
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {cats.map(c => (
              <span key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px', borderRadius: 20,
                border: '1px solid var(--border-mid)', background: 'var(--bg-3)',
                fontFamily: 'JetBrains Mono', fontSize: 10, textTransform: 'uppercase',
                letterSpacing: '0.14em', color: 'var(--text-2)',
              }}>
                {c.name}
                <button onClick={() => deleteCat(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bad)', fontSize: 13, lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Dishes management table ── */}
      <div className="section-h" style={{ marginBottom: 16 }}>All dishes</div>
      {loading ? (
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>Loading…</p>
      ) : dishes.length === 0 ? (
        <div className="empty">
          <div className="empty-mark">⊙</div>
          <div className="empty-title">No dishes yet</div>
          <div className="empty-sub">Add your first dish to begin</div>
          <div style={{ marginTop: 24 }}>
            <Link to="/owner/new"><button className="btn">+ Create dish</button></Link>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Type</th>
              <th>Category</th>
              <th>Price</th>
              <th>Spice</th>
              <th>Status</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dishes.map(d => {
              const ftIcon = d.food_type === 'veg' ? '🌱' : d.food_type === 'vegan' ? '🌿' : '🍗'
              const ftColor = d.food_type === 'veg' ? '#4ade80' : d.food_type === 'vegan' ? '#86efac' : '#f97316'
              const spice = Number(d.spice_level) || 0
              return (
              <tr key={d.id} style={{ opacity: d.available == 0 ? 0.65 : 1, transition: 'opacity 0.2s' }}>
                <td data-label="Photo">
                  <img className="thumb-mini" src={imageUrl(d.image_path)} alt={d.name} />
                </td>
                <td data-label="Name">
                  <div style={{ fontFamily: 'Barlow Condensed, serif', fontSize: 17, fontWeight: 500 }}>{d.name}</div>
                  {user?.role === 'admin' && d.hotel_name && (
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 2 }}>
                      {d.hotel_name}
                    </div>
                  )}
                </td>
                <td data-label="Type">
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:20, border:`1px solid ${ftColor}44`, background:`${ftColor}11`, fontFamily:'JetBrains Mono', fontSize:9, textTransform:'uppercase', letterSpacing:'0.12em', color:ftColor }}>
                    {ftIcon} {d.food_type || 'non-veg'}
                  </span>
                </td>
                <td data-label="Category">
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: d.category_name ? 'var(--amber)' : 'var(--text-3)' }}>
                    {d.category_name || '—'}
                  </span>
                </td>
                <td data-label="Price" style={{ color: 'var(--amber)', fontWeight: 500 }}>${Number(d.price).toFixed(2)}</td>
                <td data-label="Spice">
                  {spice > 0 ? (
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <div style={{ width:48, height:4, borderRadius:3, background:'var(--bg-4)', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${spice * 10}%`, background: spice <= 3 ? '#4ade80' : spice <= 6 ? '#fbbf24' : spice <= 8 ? '#f97316' : '#ef4444', borderRadius:3 }} />
                      </div>
                      <span style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text-3)' }}>{spice}</span>
                    </div>
                  ) : <span style={{ color:'var(--text-3)', fontFamily:'JetBrains Mono', fontSize:9 }}>—</span>}
                </td>
                <td data-label="Status">
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 20,
                    fontFamily: 'JetBrains Mono', fontSize: 9,
                    textTransform: 'uppercase', letterSpacing: '.13em',
                    ...(d.available == 1
                      ? { color: 'var(--good)', background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.28)' }
                      : { color: 'var(--bad)',  background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.22)' })
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                    {d.available == 1 ? 'Live' : 'Suspended'}
                  </span>
                </td>
                <td data-label="Rating" style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text-2)' }}>
                  {d.avg_rating
                    ? <span>★ {d.avg_rating} <span style={{ color: 'var(--text-3)' }}>· {d.review_count}</span></span>
                    : <span style={{ color: 'var(--text-3)' }}>—</span>}
                </td>
                <td data-label="Actions">
                  <div className="actions">
                    <Link to={`/dish/${d.id}`} style={{ textDecoration: 'none' }}>
                      <span className="tbl-btn tbl-btn-view">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        View
                      </span>
                    </Link>
                    <Link to={`/owner/edit/${d.id}`} style={{ textDecoration: 'none' }}>
                      <span className="tbl-btn tbl-btn-edit">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit
                      </span>
                    </Link>
                    <button
                      className={`tbl-btn ${d.available == 1 ? 'tbl-btn-suspend' : 'tbl-btn-approve'}`}
                      onClick={() => toggleAvail(d.id)}
                    >
                      {d.available == 1 ? (
                        <>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                          Suspend
                        </>
                      ) : (
                        <>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                          Activate
                        </>
                      )}
                    </button>
                    <span className="tbl-btn-sep"/>
                    <button className="tbl-btn tbl-btn-danger" onClick={() => remove(d.id, d.name)}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
        </div>
      )}

    </div>
  )
}

/* ── Owner Offers Panel ── */
export function OwnerOffers({ notify }) {
  const [offers, setOffers]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [endsAt, setEndsAt]     = useState('')
  const fileRef = useRef()

  const minDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const load = () => {
    setLoading(true)
    offersApi.ownerList()
      .then(d => setOffers(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const pickImage = e => {
    const f = e.target.files[0]; if (!f) return
    setImageFile(f)
    setImagePreview(URL.createObjectURL(f))
  }

  const submit = async e => {
    e.preventDefault()
    if (!imageFile) return notify.error('Please select an image')
    if (!endsAt)   return notify.error('Please set an end date')
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('image', imageFile)
      fd.append('ends_at', endsAt)
      await offersApi.ownerCreate(fd)
      notify.success('Offer added!')
      setImageFile(null); setImagePreview(null); setEndsAt('')
      load()
    } catch (err) {
      notify.error(err.message)
    } finally { setSaving(false) }
  }

  const remove = async id => {
    if (!window.confirm('Remove this offer?')) return
    try { await offersApi.ownerDelete(id); load() }
    catch (err) { notify.error(err.message) }
  }

  return (
    <div style={{ marginTop: 40, marginBottom: 36 }}>
      <div className="section-h">My Offers</div>

      {/* Add form */}
      <div style={{ border:'1px solid var(--border)', borderRadius:16, padding:'24px', background:'var(--bg-2)', marginBottom:28 }}>
        <div style={{ fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:16 }}>New offer</div>
        <form onSubmit={submit}>
          {/* Image picker */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width:'100%', height: imagePreview ? 'auto' : 140,
              border:'2px dashed var(--border)', borderRadius:12,
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', marginBottom:16, overflow:'hidden',
              background:'var(--bg-3)', transition:'border-color .2s',
            }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--amber)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
          >
            {imagePreview
              ? <img src={imagePreview} alt="" style={{ width:'100%', maxHeight:280, objectFit:'cover', display:'block' }} />
              : <div style={{ textAlign:'center', color:'var(--text-3)' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🖼️</div>
                  <div style={{ fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:'.14em', textTransform:'uppercase' }}>Click to upload image</div>
                </div>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display:'none' }} onChange={pickImage} />

          {/* End date */}
          <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:160 }}>
              <label style={{ display:'block', fontFamily:'JetBrains Mono', fontSize:9, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:6 }}>
                Offer ends on
              </label>
              <input
                type="date" min={minDate} value={endsAt}
                onChange={e => setEndsAt(e.target.value)}
                className="field-input"
                style={{ width:'100%' }}
              />
            </div>
            <button className="btn" type="submit" disabled={saving} style={{ flexShrink:0 }}>
              {saving ? 'Saving…' : 'Add offer'}
            </button>
          </div>
        </form>
      </div>

      {/* Offer list */}
      {loading ? (
        <p style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text-3)' }}>Loading…</p>
      ) : offers.length === 0 ? (
        <div className="empty">
          <div className="empty-mark">◌</div>
          <div className="empty-title">No offers yet</div>
          <div className="empty-sub">Add an offer image and end date above</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
          {offers.map(o => {
            const expired = o.ends_at && new Date(o.ends_at) < new Date()
            return (
              <div key={o.id} style={{ borderRadius:14, overflow:'hidden', border:'1px solid var(--border)', background:'var(--bg-2)', position:'relative' }}>
                {o.image_path
                  ? <img src={imageUrl(o.image_path)} alt="" style={{ width:'100%', height:160, objectFit:'cover', display:'block', opacity: expired ? 0.4 : 1 }} />
                  : <div style={{ height:160, background:'var(--bg-3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>🍽️</div>
                }
                <div style={{ padding:'10px 14px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                  <div>
                    <div style={{ fontFamily:'JetBrains Mono', fontSize:9, letterSpacing:'.14em', textTransform:'uppercase', color: expired ? 'var(--bad)' : 'var(--amber)' }}>
                      {expired ? 'Expired' : `Ends ${o.ends_at}`}
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-tiny" onClick={() => remove(o.id)}
                    style={{ color:'var(--bad)', borderColor:'var(--bad)', flexShrink:0 }}>
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
