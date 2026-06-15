import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { pages as pagesApi, publicStats, imageUrl, API_BASE } from '../api/client.js'

;(function injectAboutStyles() {
  let s = document.getElementById('about-css')
  if (!s) { s = document.createElement('style'); s.id = 'about-css'; document.head.appendChild(s) }
  s.textContent = `
    @keyframes abt-orb-a  { 0%,100%{transform:translate(0,0) scale(1)} 45%{transform:translate(38px,-30px) scale(1.07)} 72%{transform:translate(-24px,22px) scale(.95)} }
    @keyframes abt-orb-b  { 0%,100%{transform:translate(0,0) scale(1)} 38%{transform:translate(-34px,26px) scale(1.05)} 68%{transform:translate(22px,-18px) scale(.97)} }
    @keyframes abt-reveal { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:none} }
    @keyframes abt-word   { from{opacity:0;transform:translateY(110%)} to{opacity:1;transform:translateY(0)} }
    @keyframes abt-shimmer{ 0%{background-position:-200% center} 100%{background-position:200% center} }
    @keyframes abt-ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @keyframes abt-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
    @keyframes abt-badge  { from{opacity:0;transform:scale(.88) translateY(8px)} to{opacity:1;transform:none} }
    @keyframes abt-img-in { from{opacity:0;transform:scale(1.05)} to{opacity:1;transform:scale(1)} }
    @keyframes abt-count  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
    @keyframes abt-line-grow { from{scaleX:0} to{scaleX:1} }

    /* Scroll reveal */
    .abt-sr  { opacity:0; transform:translateY(32px); transition:opacity .75s cubic-bezier(.22,1,.36,1),transform .75s cubic-bezier(.22,1,.36,1); }
    .abt-srl { opacity:0; transform:translateX(-40px); transition:opacity .75s cubic-bezier(.22,1,.36,1),transform .75s cubic-bezier(.22,1,.36,1); }
    .abt-srr { opacity:0; transform:translateX(40px); transition:opacity .75s cubic-bezier(.22,1,.36,1),transform .75s cubic-bezier(.22,1,.36,1); }
    .abt-srs { opacity:0; transform:scale(.9); transition:opacity .65s cubic-bezier(.22,1,.36,1),transform .65s cubic-bezier(.22,1,.36,1); }
    .abt-sr.v,.abt-srl.v,.abt-srr.v,.abt-srs.v { opacity:1; transform:none; }
    .abt-media-item { opacity:0; transform:translateY(30px) scale(.96); transition:opacity .72s cubic-bezier(.22,1,.36,1) calc(var(--i,0) * .08s), transform .72s cubic-bezier(.22,1,.36,1) calc(var(--i,0) * .08s); }
    [data-inview] .abt-media-item { opacity:1; transform:none; }
    .abt-d1{transition-delay:.07s!important} .abt-d2{transition-delay:.14s!important}
    .abt-d3{transition-delay:.21s!important} .abt-d4{transition-delay:.28s!important}

    /* Hero text */
    .abt-eyebrow-anim { animation:abt-reveal .65s cubic-bezier(.22,1,.36,1) 0s both; }
    .abt-heading-anim { animation:abt-reveal .8s  cubic-bezier(.22,1,.36,1) .08s both; }
    .abt-lead-anim    { animation:abt-reveal .75s cubic-bezier(.22,1,.36,1) .2s  both; }
    .abt-badge-anim   { animation:abt-badge  .65s cubic-bezier(.34,1.56,.64,1) .3s both; }

    /* Shimmer gradient */
    .abt-em {
      background: linear-gradient(90deg, var(--amber) 0%, rgba(255,255,255,.55) 40%, #f97316 58%, var(--amber) 100%);
      background-size: 200% auto;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      animation: abt-shimmer 5.5s linear 1.5s infinite;
    }

    /* Banner */
    .abt-banner { border-radius:20px; overflow:hidden; position:relative; }
    .abt-banner img { width:100%; height:360px; object-fit:cover; display:block; animation:abt-img-in 1s ease .1s both; }
    .abt-banner-overlay {
      position:absolute; inset:0;
      background:linear-gradient(to right, rgba(9,8,14,.65) 0%, transparent 55%, rgba(9,8,14,.28) 100%);
      display:flex; align-items:flex-end; padding:36px 44px;
    }

    /* Stats */
    .abt-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:0; border:1px solid var(--border); border-radius:20px; overflow:hidden; background:var(--bg-2); }
    .abt-stat  { padding:40px 28px; border-right:1px solid var(--border); text-align:center; transition:background .25s; position:relative; overflow:hidden; }
    .abt-stat:last-child { border-right:none; }
    .abt-stat:hover { background:var(--bg-3); }
    .abt-stat::after { content:''; position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:32px; height:2px; background:var(--grad); border-radius:2px; opacity:0; transition:opacity .3s; }
    .abt-stat:hover::after { opacity:1; }
    .abt-stat-n { font-family:'Barlow Condensed',serif; font-size:52px; font-weight:700; $10.02em; line-height:1; background:var(--grad); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin-bottom:10px; }
    .abt-stat-l { font-family:'JetBrains Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:.22em; color:var(--text-3); }

    /* Intro */
    .abt-intro-grid { display:grid; grid-template-columns:1fr 1fr; gap:52px; align-items:start; }
    .abt-quote-card {
      padding:36px 36px; background:var(--glass); border:1px solid var(--border); border-radius:20px;
      border-left:3px solid var(--amber); position:relative; overflow:hidden;
      transition:border-color .3s, transform .4s cubic-bezier(.34,1.56,.64,1), box-shadow .3s;
    }
    .abt-quote-card:hover { border-color:var(--border-mid); transform:translateY(-5px); box-shadow:0 20px 52px rgba(0,0,0,.3); }
    .abt-quote-card::before { content:''; position:absolute; top:-40px; right:-40px; width:150px; height:150px; border-radius:50%; background:radial-gradient(circle, rgba(212,150,58,.12) 0%, transparent 70%); pointer-events:none; }

    /* Feature cards */
    .abt-feats { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
    .abt-feat {
      padding:32px 28px; border-radius:20px; background:var(--glass); border:1px solid var(--border);
      position:relative; overflow:hidden;
      transition:border-color .3s, background .3s, transform .4s cubic-bezier(.34,1.56,.64,1), box-shadow .3s;
    }
    .abt-feat:hover { border-color:var(--border-mid); background:var(--glass-hi); transform:translateY(-8px); box-shadow:0 24px 56px rgba(0,0,0,.36); }
    .abt-feat-bg-n {
      position:absolute; right:14px; top:10px;
      font-family:'Barlow Condensed',serif; font-size:76px; font-weight:700; $10.02em; line-height:1;
      background:var(--grad); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
      opacity:.1; transition:opacity .3s, transform .4s cubic-bezier(.34,1.56,.64,1);
    }
    .abt-feat:hover .abt-feat-bg-n { opacity:.24; transform:scale(1.07) translateY(-4px); }
    .abt-feat-icon {
      width:46px; height:46px; border-radius:13px;
      background:rgba(212,150,58,.1); border:1px solid rgba(212,150,58,.18);
      display:flex; align-items:center; justify-content:center;
      color:var(--amber); margin-bottom:20px;
      transition:background .3s, transform .4s cubic-bezier(.34,1.56,.64,1), box-shadow .3s;
    }
    .abt-feat:hover .abt-feat-icon { background:rgba(212,150,58,.22); transform:rotate(-8deg) scale(1.12); box-shadow:0 8px 24px rgba(212,150,58,.2); }

    /* Timeline */
    .abt-tl { position:relative; display:flex; flex-direction:column; gap:0; }
    .abt-tl::before { content:''; position:absolute; left:19px; top:26px; bottom:26px; width:1px; background:linear-gradient(to bottom, transparent, var(--border-mid) 10%, var(--border) 90%, transparent); }
    .abt-tl-row { display:flex; gap:0; padding:0 0 20px 56px; position:relative; }
    .abt-tl-dot { position:absolute; left:12px; top:18px; width:16px; height:16px; border-radius:50%; border:2px solid var(--amber); background:var(--bg); z-index:1; transition:background .25s, box-shadow .3s; }
    .abt-tl-row:hover .abt-tl-dot { background:var(--amber); box-shadow:0 0 14px rgba(212,150,58,.55); }
    .abt-tl-card { padding:22px 26px; border:1px solid var(--border); border-radius:16px; width:100%; background:var(--glass); transition:border-color .3s, transform .35s cubic-bezier(.34,1.56,.64,1); }
    .abt-tl-row:hover .abt-tl-card { border-color:var(--border-mid); transform:translateX(6px); }

    /* Ticker */
    .abt-ticker-outer { overflow:hidden; position:relative; padding:4px 0; border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
    .abt-ticker-outer::before { content:''; position:absolute; left:0; top:0; bottom:0; width:80px; background:linear-gradient(to right, var(--bg), transparent); z-index:2; pointer-events:none; }
    .abt-ticker-outer::after  { content:''; position:absolute; right:0; top:0; bottom:0; width:80px; background:linear-gradient(to left, var(--bg), transparent); z-index:2; pointer-events:none; }
    .abt-ticker { display:flex; gap:0; width:max-content; animation:abt-ticker 26s linear infinite; }
    .abt-ticker:hover { animation-play-state:paused; }
    .abt-ticker-pill { display:flex; align-items:center; gap:10px; padding:12px 22px; margin:4px 5px; font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--text-3); white-space:nowrap; border:1px solid var(--border); border-radius:20px; background:var(--glass); transition:color .2s, border-color .2s; }
    .abt-ticker-pill:hover { color:var(--amber); border-color:var(--border-mid); }
    .abt-ticker-dot { width:4px; height:4px; border-radius:50%; background:var(--amber); opacity:.45; flex-shrink:0; }

    /* Floating */
    .abt-float { animation:abt-float 3.8s ease-in-out infinite; }
    .abt-float-d1 { animation-delay:.35s; }
    .abt-float-d2 { animation-delay:.7s; }

    /* Sliding marquee */
    @keyframes abt-mrq-r { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @keyframes abt-mrq-l { from{transform:translateX(-50%)} to{transform:translateX(0)} }
    .abt-mrq-text { font-family:'Barlow Condensed',serif; font-size:clamp(50px,6.5vw,90px); font-weight:700; font-style:normal; $10.02em; line-height:1.1; white-space:nowrap; padding:0 28px; color:rgba(212,150,58,.22); -webkit-text-stroke:1px rgba(212,150,58,.45); transition:color .3s; user-select:none; }
    .abt-mrq-text:hover { color:rgba(212,150,58,.4); }
    .abt-mrq-sep { color:rgba(212,150,58,.35); font-size:22px; align-self:center; flex-shrink:0; padding:0 6px; }

    /* Word-reveal */
    @keyframes abt-wup { from{opacity:0;transform:translateY(110%)} to{opacity:1;transform:translateY(0)} }
    .abt-wclip { display:inline-block; overflow:hidden; vertical-align:bottom; }
    .abt-wup   { display:inline-block; animation:abt-wup .65s cubic-bezier(.22,1,.36,1) both; }

    /* Responsive */
    @media(max-width:1000px) {
      .abt-intro-grid { grid-template-columns:1fr; }
      .abt-feats { grid-template-columns:1fr 1fr; }
    }
    @media(max-width:900px) {
      .abt-stats { grid-template-columns:1fr 1fr; }
      .abt-stat:nth-child(2) { border-right:none; }
      .abt-stat:nth-child(3) { border-top:1px solid var(--border); border-right:none; grid-column:1/-1; }
    }
    @media(max-width:640px) {
      .abt-feats { grid-template-columns:1fr; }
      .abt-stats { grid-template-columns:1fr; }
      .abt-stat  { border-right:none!important; border-top:1px solid var(--border); }
      .abt-stat:first-child { border-top:none; }
      .abt-tl::before { left:12px; }
      .abt-tl-row { padding-left:40px; }
      .abt-tl-dot { left:5px; }
      .abt-banner img { height:220px; }
      .abt-banner-overlay { padding:20px 20px !important; }
      .abt-banner-overlay .abt-banner-text { font-size:18px !important; }
      .abt-cta-strip { padding:32px 20px !important; }
      .abt-cta-btns  { flex-shrink:1 !important; width:100%; flex-wrap:wrap; }
      .abt-cta-btns a, .abt-cta-btns a button { width:100%; justify-content:center; }
      .abt-media-grid { grid-template-columns:1fr !important; }
    }
  `
})()

function SlideHeading({ children, className = '', style, delay = 0 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const words = el.querySelectorAll('.abt-wup')
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        words.forEach((w, i) => { w.style.animationDelay = `${delay + i * 0.09}s`; w.style.animationPlayState = 'running' })
        obs.disconnect()
      }
    }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  const words = String(children).split(' ').filter(Boolean)
  return (
    <div ref={ref} className={className} style={{ fontFamily:'Barlow Condensed,serif', lineHeight:1.1, ...style }}>
      {words.map((w, i) => (
        <span key={i} className="abt-wclip" style={{ marginRight:'0.22em' }}>
          <span className="abt-wup" style={{ animationPlayState:'paused' }}>{w}</span>
        </span>
      ))}
    </div>
  )
}

const DEFAULT = {
  heading:        'About Dish',
  heading_em:     'Craft.',
  intro:          'We are building the future of restaurant menus — one dish at a time.',
  mission:        'Our mission is to transform the way people discover and experience food, by bringing every dish to life in full 360° view.',
  feature1_title: '360° Video',
  feature1_text:  'Every dish is recorded as a full-circle 360° video — customers drag to spin and see every angle before ordering.',
  feature2_title: 'Hotel Owners',
  feature2_text:  'Empower restaurants to showcase their entire menu in an entirely new dimension.',
  feature3_title: 'For Customers',
  feature3_text:  'Browse, favorite, and review dishes with an immersive three-dimensional experience.',
}

const FEAT_ICONS = [
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
]

const TIMELINE = [
  { year: '2024', title: 'Concept', desc: 'The idea of 360° food menus emerged from frustration with flat photographs that fail to convey texture, portion size, or plating quality.' },
  { year: '2025', title: 'Beta', desc: 'First hotel partners joined the private beta. The 360° video viewer launched, letting customers spin every dish with a finger drag.' },
  { year: '2026', title: 'Launch', desc: 'Public launch with the full 360° platform. Hotels publish immersive menus in minutes and customers explore every dish before ordering.' },
]

const TICKER_ITEMS = ['360° Video', 'MediaRecorder API', 'WebM · MP4', 'React', 'Laravel', 'Dish360Viewer', 'REST API', 'LKR Payments', 'Live Reviews', 'QR Menus', 'Hotel Dashboard', 'Category Filters']

function CountUp({ raw, visible }) {
  const [display, setDisplay] = useState(raw)
  const ran = useRef(false)

  useEffect(() => {
    // When raw resolves from placeholder to a real value, reset so it animates
    if (raw === '…') return
    ran.current = false
    setDisplay(raw)
  }, [raw])

  useEffect(() => {
    if (!visible || ran.current) return
    const m = raw.match(/^(.*?)(\d[\d,]*)(.*)$/)
    if (!m) return
    ran.current = true
    const [, pre, numStr, suf] = m
    const target = parseInt(numStr.replace(/,/g, ''), 10)
    const comma = numStr.includes(',')
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min((now - t0) / 1500, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      const cur = Math.round(target * ease)
      setDisplay(pre + (comma ? cur.toLocaleString() : cur) + suf)
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [visible, raw])
  return <>{display}</>
}

function useScrollIn(trigger) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !trigger) return
    const r = el.getBoundingClientRect()
    if (r.top < window.innerHeight * 0.95) { el.dataset.inview = '1'; return }
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.dataset.inview = '1'; obs.disconnect() } },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [trigger])
  return ref
}
function useScrollReveal(cls = 'v') {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add(cls); obs.disconnect() } },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

function useGroupReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('v')
          let idx = 0
          el.querySelectorAll('.abt-sr,.abt-srl,.abt-srr,.abt-srs').forEach(child => {
            setTimeout(() => child.classList.add('v'), idx * 90)
            idx++
          })
          obs.disconnect()
        }
      },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

function useScrollRevealState() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('v'); setVisible(true); obs.disconnect() } },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

export default function AboutUs() {
  const [c, setC]           = useState(DEFAULT)
  const [mediaItems, setMediaItems] = useState([])
  const [stats, setStats]   = useState({ hotels: null, dishes: null })

  useEffect(() => {
    pagesApi.get('about').then(d => {
      if (d?.content) setC(prev => ({ ...DEFAULT, ...d.content }))
      setMediaItems(d?.content?.media ?? [])
    }).catch(() => {})
    publicStats().then(d => setStats(d)).catch(() => {})
  }, [])

  const features = [
    { title: c.feature1_title, text: c.feature1_text },
    { title: c.feature2_title, text: c.feature2_text },
    { title: c.feature3_title, text: c.feature3_text },
  ]

  const [statsRef, statsVisible] = useScrollRevealState()
  const introRef    = useGroupReveal()
  const featsRef    = useGroupReveal()
  const tlRef       = useGroupReveal()
  const tickerRef   = useScrollReveal()
  const ctaRef      = useScrollReveal()
  const mediaRef    = useScrollIn(mediaItems.length > 0)

  const tickerItems = [...TICKER_ITEMS, ...TICKER_ITEMS]

  const headingWords = c.heading.split(' ').filter(Boolean)

  return (
    <div>
      {/* ── Background orbs ── */}
      <div aria-hidden style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'4%', right:'3%', width:620, height:620, borderRadius:'50%', background:'radial-gradient(circle, rgba(212,150,58,.13) 0%, transparent 65%)', animation:'abt-orb-a 18s ease-in-out infinite' }} />
        <div style={{ position:'absolute', bottom:'12%', left:'-8%', width:480, height:480, borderRadius:'50%', background:'radial-gradient(circle, rgba(214,58,94,.09) 0%, transparent 65%)', animation:'abt-orb-b 23s ease-in-out infinite' }} />
      </div>

      <div className="page" style={{ position:'relative', zIndex:1 }}>

        {/* ── HERO ── */}
        <div className="page-header" style={{ paddingBottom: c.banner_image ? 32 : undefined }}>
          <div>
            <div className="page-eyebrow abt-eyebrow-anim">Our story · QRIOUS360</div>

            <h1 className="page-title">
              <span style={{ display:'block' }}>
                {headingWords.map((w, i) => (
                  <span key={i} style={{ display:'inline-block', overflow:'hidden', marginRight:'0.22em', verticalAlign:'bottom' }}>
                    <span style={{ display:'inline-block', animation:`abt-word .65s cubic-bezier(.22,1,.36,1) ${0.08 + i * 0.07}s both` }}>{w}</span>
                  </span>
                ))}
              </span>
              <em className="abt-em" style={{ display:'block', animation:`abt-word .7s cubic-bezier(.22,1,.36,1) ${0.08 + headingWords.length * 0.07}s both` }}>
                {c.heading_em}
              </em>
            </h1>
          </div>

          <div className="abt-badge-anim" style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', marginTop:8 }}>
            {[
              ['Est. MMXXVI', 'var(--amber)'],
              ['Sri Lanka',   'var(--text-3)'],
              ['360° Video',  'var(--good)'],
            ].map(([label, color]) => (
              <span key={label} style={{ fontFamily:'JetBrains Mono', fontSize:9, letterSpacing:'.18em', textTransform:'uppercase', padding:'6px 14px', borderRadius:20, border:'1px solid var(--border-mid)', background:'var(--glass)', color }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── BANNER IMAGE ── */}
        {c.banner_image && (
          <div className="abt-banner" style={{ marginBottom:64 }}>
            <img src={`${API_BASE}/uploads/${c.banner_image}`} alt="About QRIOUS360" />
            <div className="abt-banner-overlay">
              <div>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:9, letterSpacing:'.22em', textTransform:'uppercase', color:'rgba(212,150,58,.85)', marginBottom:8 }}>
                  QRIOUS360 Studio
                </div>
                <div className="abt-banner-text" style={{ fontFamily:'Barlow Condensed,serif', fontStyle:'normal', fontSize:28, color:'#fff', lineHeight:1.2 }}>
                  Where every dish becomes a 360° experience.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STATS ── */}
        <div ref={statsRef} className="abt-sr abt-stats" style={{ marginTop: c.banner_image ? 0 : 0, marginBottom: 72 }}>
          {[
            { n: stats.hotels !== null ? String(stats.hotels) : '…', l: 'Hotels onboarded' },
            { n: stats.dishes !== null ? String(stats.dishes) : '…', l: 'Dishes in 360°' },
            { n: '98%', l: 'Customer satisfaction' },
          ].map((s, i) => (
            <div key={i} data-scroll="zoom-in" data-delay={i * 0.12} className={`abt-stat abt-d${i + 1}`}>
              <div className="abt-stat-n"><CountUp raw={s.n} visible={statsVisible} /></div>
              <div className="abt-stat-l">{s.l}</div>
            </div>
          ))}
        </div>

        {/* ── INTRO / MISSION ── */}
        <div ref={introRef} style={{ marginBottom: 72 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:9, textTransform:'uppercase', letterSpacing:'.26em', color:'var(--amber)' }}>Our story</div>
            <div style={{ flex:1, height:1, background:'var(--border)' }} />
          </div>
          <SlideHeading style={{ fontSize:'clamp(28px,4vw,46px)', fontWeight:700, letterSpacing:'0.02em', color:'var(--text)', marginBottom:36 }} delay={0.05}>
            Bringing every dish to life in full dimension
          </SlideHeading>

          <div className="abt-intro-grid">
            {/* Left: text */}
            <div data-scroll="fade-left" className="abt-srl">
              <p style={{ fontFamily:'Barlow Condensed,serif', fontSize:22, lineHeight:1.55, color:'var(--text)', marginBottom:20 }}>
                {c.intro}
              </p>
              <p style={{ fontFamily:'Barlow Condensed,serif', fontSize:16, lineHeight:1.7, color:'var(--text-2)', marginBottom:36 }}>
                {c.mission}
              </p>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <Link to="/menu"><button className="btn">Explore the menu</button></Link>
                <Link to="/register"><button className="btn btn-ghost">Join as owner</button></Link>
              </div>
            </div>

            {/* Right: decorative quote card */}
            <div data-scroll="fade-right" data-delay="0.1" className="abt-quote-card abt-srr abt-d1">
              <div style={{ fontFamily:'JetBrains Mono', fontSize:9, textTransform:'uppercase', letterSpacing:'.22em', color:'var(--amber)', marginBottom:18 }}>
                Our philosophy
              </div>
              <div style={{ fontFamily:'Barlow Condensed,serif', fontStyle:'normal', fontSize:20, lineHeight:1.65, color:'var(--text)', marginBottom:28 }}>
                "A menu should be an experience, not a list. Every dish deserves to be seen in full dimension — texture, volume, and form."
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {['10-sec recording', 'Instant publish', '360° drag-to-spin', 'Live reviews'].map(label => (
                  <div key={label} style={{ display:'flex', alignItems:'center', gap:8, fontFamily:'JetBrains Mono', fontSize:9, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--text-3)' }}>
                    <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--amber)', opacity:.6, flexShrink:0 }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <div ref={featsRef} style={{ marginBottom:72 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:9, textTransform:'uppercase', letterSpacing:'.26em', color:'var(--amber)' }}>What we offer</div>
            <div style={{ flex:1, height:1, background:'var(--border)' }} />
          </div>
          <SlideHeading style={{ fontSize:'clamp(26px,3.8vw,42px)', fontWeight:700, letterSpacing:'0.02em', color:'var(--text)', marginBottom:32 }} delay={0.05}>
            Three pillars of the QRIOUS360 experience
          </SlideHeading>
          <div className="abt-feats">
            {features.map((f, i) => (
              <div key={i} data-scroll="zoom-up" data-delay={i * 0.13} className="abt-feat abt-sr">
                <div className="abt-feat-bg-n">0{i + 1}</div>
                <div className="abt-feat-icon">{FEAT_ICONS[i]}</div>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:9, textTransform:'uppercase', letterSpacing:'.22em', color:'var(--amber)', marginBottom:10 }}>0{i + 1}</div>
                <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:20, fontWeight:500, color:'var(--text)', marginBottom:10, letterSpacing:'0.02em' }}>{f.title}</div>
                <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:14, color:'var(--text-2)', lineHeight:1.65 }}>{f.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TIMELINE ── */}
        <div ref={tlRef} style={{ marginBottom:72 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:9, textTransform:'uppercase', letterSpacing:'.26em', color:'var(--amber)' }}>Milestones</div>
            <div style={{ flex:1, height:1, background:'var(--border)' }} />
          </div>
          <SlideHeading style={{ fontSize:'clamp(26px,3.8vw,42px)', fontWeight:700, letterSpacing:'0.02em', color:'var(--text)', marginBottom:36 }} delay={0.05}>
            How QRIOUS360 came to be
          </SlideHeading>
          <div className="abt-tl">
            {TIMELINE.map((item, i) => (
              <div key={i} data-scroll="fade-left" data-delay={i * 0.15} className="abt-tl-row abt-sr">
                <div className="abt-tl-dot" />
                <div className="abt-tl-card">
                  <div style={{ display:'flex', alignItems:'baseline', gap:16, marginBottom:8 }}>
                    <div style={{ fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:'.22em', color:'var(--amber)', textTransform:'uppercase' }}>{item.year}</div>
                    <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:18, fontWeight:500, color:'var(--text)' }}>{item.title}</div>
                  </div>
                  <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:14, color:'var(--text-2)', lineHeight:1.65 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TECH TICKER ── */}
        <div ref={tickerRef} className="abt-sr abt-ticker-outer" style={{ marginBottom:72 }}>
          <div className="abt-ticker">
            {tickerItems.map((item, i) => (
              <div key={i} className="abt-ticker-pill">
                <span className="abt-ticker-dot" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* ── PHOTO & VIDEO GALLERY ── */}
        {mediaItems.length > 0 && (
          <div style={{ marginBottom:64 }}>
            <SlideHeading
              style={{ fontSize:'clamp(24px,3.5vw,38px)', fontWeight:700, letterSpacing:'0.02em', color:'var(--text)', marginBottom:28 }}
            >
              Behind the scenes
            </SlideHeading>
            <div ref={mediaRef} className="abt-media-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(380px,100%),1fr))', gap:20 }}>
              {mediaItems.map((item, i) => (
                <div key={item.id}
                  className="abt-media-item"
                  style={{ '--i': i, borderRadius:16, overflow:'hidden', border:'1px solid var(--border)', background:'var(--bg-2)', transition:'transform .4s cubic-bezier(.34,1.56,.64,1), box-shadow .3s, opacity .72s cubic-bezier(.22,1,.36,1) calc(var(--i,0) * .08s)', cursor:'default' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.boxShadow='0 20px 56px rgba(0,0,0,.38)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
                >
                  {item.type === 'video' ? (
                    <video
                      src={imageUrl(item.path)}
                      controls
                      style={{ width:'100%', display:'block', maxHeight:340, objectFit:'cover' }}
                    />
                  ) : (
                    <img
                      src={imageUrl(item.path)}
                      alt={item.caption || ''}
                      style={{ width:'100%', height:340, objectFit:'cover', display:'block' }}
                    />
                  )}
                  {item.caption && (
                    <div style={{ padding:'10px 14px', fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'var(--text-3)', letterSpacing:'.06em' }}>
                      {item.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CTA STRIP ── */}
        <div ref={ctaRef} data-scroll="zoom-in" className="abt-sr vbg-panel abt-cta-strip" style={{
          borderRadius:24, background:'var(--bg-2)', border:'1px solid var(--border)',
          padding:'52px 56px', display:'flex', alignItems:'center', justifyContent:'space-between',
          gap:32, flexWrap:'wrap', position:'relative', overflow:'hidden',
        }}>
          <div aria-hidden style={{ position:'absolute', right:'-5%', top:'-20%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(212,150,58,.12) 0%, transparent 65%)', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:9, textTransform:'uppercase', letterSpacing:'.26em', color:'var(--amber)', marginBottom:14 }}>
              Join QRIOUS360
            </div>
            <div style={{ fontFamily:'Barlow Condensed,serif', fontWeight:300, fontSize:34, letterSpacing:'0.02em', lineHeight:1.1, color:'var(--text)' }}>
              Ready to bring your menu{' '}
              <em style={{ background:'var(--grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                to life?
              </em>
            </div>
            <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:15, color:'var(--text-2)', lineHeight:1.65, marginTop:12, maxWidth:480 }}>
              Register as a hotel owner and publish your first 360° dish video in under ten minutes.
            </div>
          </div>
          <div className="abt-cta-btns" style={{ display:'flex', gap:12, flexShrink:0, position:'relative', zIndex:1 }}>
            <Link to="/register"><button className="btn">Get started free</button></Link>
            <Link to="/menu"><button className="btn btn-ghost">Browse menu</button></Link>
          </div>
        </div>

      </div>
    </div>
  )
}
