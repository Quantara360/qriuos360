import { useEffect, useRef, useState } from 'react'
import { API_BASE } from '../api/client.js'

const DEFAULT_BANNERS = [
  {
    id: 1,
    eyebrow: 'New this season',
    heading: 'Taste the future',
    heading_em: 'of dining.',
    sub: 'Explore our latest dishes — each one captured in immersive 360° video so you see every angle.',
    cta_text: 'Browse menu',
    cta_url: '/menu',
    gradient: 'linear-gradient(135deg, rgba(212,150,58,.32) 0%, rgba(214,58,94,.22) 100%)',
  },
  {
    id: 2,
    eyebrow: 'For hotel owners',
    heading: 'Your menu,',
    heading_em: 'elevated.',
    sub: 'Record a 360° video and publish in minutes. Let guests explore every dish before they order.',
    cta_text: 'Get started',
    cta_url: '/register',
    gradient: 'linear-gradient(135deg, rgba(26,173,107,.24) 0%, rgba(201,168,76,.28) 100%)',
  },
  {
    id: 3,
    eyebrow: 'Immersive menus',
    heading: 'Every dish,',
    heading_em: 'in full view.',
    sub: 'Drag and spin each dish in 360°. Texture, portion size, and plating — all visible before you order.',
    cta_text: 'Explore now',
    cta_url: '/menu',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,.26) 0%, rgba(212,150,58,.24) 100%)',
  },
]

export default function BannerSlider({ banners: propBanners }) {
  const banners = (propBanners && propBanners.length > 0) ? propBanners : DEFAULT_BANNERS
  const [idx, setIdx]       = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)

  const go = (next) => { setIdx(next); setAnimKey(k => k + 1) }
  const prev = () => go((idx - 1 + banners.length) % banners.length)
  const next = () => go((idx + 1) % banners.length)

  useEffect(() => {
    if (paused || banners.length < 2) return
    timerRef.current = setInterval(() => go(i => (i + 1) % banners.length), 5500)
    return () => clearInterval(timerRef.current)
  }, [paused, banners.length])

  const touchX = useRef(null)
  const onTouchStart = e => { touchX.current = e.touches[0].clientX }
  const onTouchEnd   = e => {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    touchX.current = null
    if (Math.abs(dx) < 40) return
    dx < 0 ? next() : prev()
  }

  const b = banners[idx]
  const imgSrc = b.image_path
    ? (b.image_path.startsWith('http') ? b.image_path : `${API_BASE}/uploads/${b.image_path}`)
    : null
  const vidSrc = b.video_path
    ? (b.video_path.startsWith('http') ? b.video_path : `${API_BASE}/uploads/${b.video_path}`)
    : null

  return (
    <div
      style={{ position:'relative', borderRadius:28, marginBottom:60, userSelect:'none', overflow:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,.55)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Slide ── */}
      <div
        key={animKey}
        style={{
          minHeight: 'clamp(320px, 44vw, 520px)',
          borderRadius: 28,
          background: '#0e0a04',
          position: 'relative',
          overflow: 'hidden',
          animation: 'banner-in .6s cubic-bezier(.22,1,.36,1) both',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Background media — full visibility */}
        {vidSrc ? (
          <video key={vidSrc} src={vidSrc} autoPlay muted loop playsInline
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.65, pointerEvents:'none' }}
          />
        ) : imgSrc ? (
          <img src={imgSrc} alt=""
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.55, pointerEvents:'none' }}
          />
        ) : (
          /* Fallback gradient when no image */
          <div style={{ position:'absolute', inset:0, background: b.gradient || 'linear-gradient(135deg,rgba(212,150,58,.28) 0%,rgba(180,80,40,.2) 100%)', pointerEvents:'none' }} />
        )}

        {/* Directional overlay: dark on left for text, fades to show image on right */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(100deg, rgba(8,5,2,.94) 0%, rgba(8,5,2,.82) 38%, rgba(8,5,2,.45) 65%, rgba(8,5,2,.1) 100%)', pointerEvents:'none' }} />
        {/* Bottom fade for dots */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(8,5,2,.6) 0%, transparent 30%)', pointerEvents:'none' }} />

        {/* Accent colour wash from banner gradient */}
        <div style={{ position:'absolute', inset:0, background: b.gradient, opacity:0.35, mixBlendMode:'screen', pointerEvents:'none' }} />

        {/* Text content */}
        <div style={{ position:'relative', zIndex:2, padding:'clamp(36px,6vw,72px) clamp(68px,9vw,96px) clamp(56px,6vw,72px)', maxWidth:640 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8, marginBottom:20,
            animation:'banner-up .5s cubic-bezier(.22,1,.36,1) .05s both',
          }}>
            <span style={{ display:'inline-block', width:28, height:2, background:'#f0b429', borderRadius:2 }} />
            <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:13, textTransform:'uppercase', letterSpacing:'0.24em', color:'#f0b429' }}>
              {b.eyebrow}
            </span>
          </div>

          <div style={{
            fontFamily:'Barlow Condensed,serif', fontWeight:800,
            fontSize:'clamp(42px,6.5vw,80px)', letterSpacing:'0.02em', lineHeight:1.04,
            color:'#ffffff',
            animation:'banner-up .55s cubic-bezier(.22,1,.36,1) .12s both',
          }}>
            {b.heading}{' '}
            <em style={{ fontStyle:'normal', background:'var(--grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              {b.heading_em}
            </em>
          </div>

          {b.sub && (
            <div style={{
              fontFamily:'Barlow Condensed,serif', fontSize:'clamp(17px,2.2vw,24px)', fontWeight:500,
              color:'rgba(255,255,255,0.78)', lineHeight:1.55, marginTop:20, maxWidth:480,
              animation:'banner-up .55s cubic-bezier(.22,1,.36,1) .2s both',
            }}>
              {b.sub}
            </div>
          )}

        </div>
      </div>

      {/* ── Arrows ── */}
      {banners.length > 1 && (
        <>
          {[{ dir:'prev', pos:{ left:16 }, fn:prev, path:'M15 18l-6-6 6-6' },
            { dir:'next', pos:{ right:16 }, fn:next, path:'M9 18l6-6-6-6' }].map(({ dir, pos, fn, path }) => (
            <button key={dir} onClick={fn} aria-label={dir} className="banner-arrow"
              style={{
                position:'absolute', ...pos, top:'50%', transform:'translateY(-50%)',
                zIndex:5, width:44, height:44, borderRadius:'50%',
                background:'rgba(14,10,4,.72)', backdropFilter:'blur(16px)',
                border:'1px solid rgba(212,150,58,.35)', color:'rgba(255,255,255,.85)',
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                transition:'background .2s, border-color .2s, transform .2s',
                boxShadow:'0 4px 16px rgba(0,0,0,.4)',
              }}
              onMouseEnter={e=>{ e.currentTarget.style.background='rgba(212,150,58,.25)'; e.currentTarget.style.borderColor='rgba(212,150,58,.7)'; e.currentTarget.style.transform='translateY(-50%) scale(1.1)' }}
              onMouseLeave={e=>{ e.currentTarget.style.background='rgba(14,10,4,.72)'; e.currentTarget.style.borderColor='rgba(212,150,58,.35)'; e.currentTarget.style.transform='translateY(-50%)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d={path}/>
              </svg>
            </button>
          ))}
        </>
      )}

      {/* ── Dots + progress ── */}
      {banners.length > 1 && (
        <div style={{ position:'absolute', bottom:20, left:'50%', transform:'translateX(-50%)', display:'flex', gap:8, zIndex:5, alignItems:'center' }}>
          {banners.map((_, i) => (
            <button key={i} onClick={() => go(i)} aria-label={`Slide ${i+1}`}
              style={{
                width: i === idx ? 28 : 8, height:8, borderRadius:4, border:'none', cursor:'pointer', padding:0,
                background: i === idx ? '#f0b429' : 'rgba(255,255,255,.3)',
                boxShadow: i === idx ? '0 0 10px rgba(240,180,41,.6)' : 'none',
                transition:'width .35s cubic-bezier(.34,1.56,.64,1), background .2s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
