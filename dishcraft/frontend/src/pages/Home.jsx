import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { pages as pagesApi, dishes as dishApi, auth as authApi, social as socialApi, offers as offersApi, imageUrl } from '../api/client.js'
import BannerSlider from '../components/BannerSlider.jsx'

function SunIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> }
function MoonIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> }
function VideoIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> }

const THEME_OPTS = [
  { mode: 'light', Icon: SunIcon,   label: 'Light' },
  { mode: 'dark',  Icon: MoonIcon,  label: 'Dark'  },
  { mode: 'video', Icon: VideoIcon, label: 'Video BG' },
]
function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  return (
    <div style={{ display:'flex', gap:2, background:'var(--glass)', border:'1px solid var(--border-mid)', borderRadius:22, padding:3 }}>
      {THEME_OPTS.map(({ mode, Icon, label }) => {
        const active = theme === mode
        return (
          <button key={mode} title={label} onClick={() => setTheme(mode)} style={{
            width:28, height:28, borderRadius:18, border:'none', cursor:'pointer', padding:0,
            background: active ? 'var(--grad)' : 'transparent',
            color: active ? '#fff' : 'var(--text-3)',
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'background .22s, color .22s',
          }}>
            <Icon />
          </button>
        )
      })}
    </div>
  )
}



;(function injectStyles() {
  let s = document.getElementById('home-css')
  if (!s) { s = document.createElement('style'); s.id = 'home-css'; document.head.appendChild(s) }
  s.textContent = `
    @keyframes h-float   { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-14px)} }
    @keyframes h-orbit   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes h-steam   { 0%{opacity:.55;transform:translateY(0) scaleX(1)} 60%{opacity:.25;transform:translateY(-22px) scaleX(1.8) rotate(3deg)} 100%{opacity:0;transform:translateY(-44px) scaleX(2.5)} }
    @keyframes h-shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
    @keyframes h-word    { from{opacity:0;transform:translateY(110%)} to{opacity:1;transform:translateY(0)} }
    @keyframes h-reveal  { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
    @keyframes h-flame   { 0%,100%{transform:scaleX(1) scaleY(1) rotate(0deg)} 25%{transform:scaleX(1.18) scaleY(.9) rotate(2deg)} 50%{transform:scaleX(.88) scaleY(1.1) rotate(-1.5deg)} 75%{transform:scaleX(1.1) scaleY(.94) rotate(1deg)} }
    @keyframes h-glow    { 0%,100%{opacity:.5} 50%{opacity:1} }
    @keyframes h-ticker  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @keyframes h-badge   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes h-plate-in{ from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
    @keyframes h-ping    { 0%{transform:scale(1);opacity:.7} 80%,100%{transform:scale(2.6);opacity:0} }
    @keyframes h-count   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes h-cat-in  { from{opacity:0;transform:translateY(18px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }

    .h-float      { animation: h-float 4.4s ease-in-out infinite; }
    .h-orbit-ring { animation: h-orbit 14s linear infinite; }
    .h-steam-1    { animation: h-steam 2.8s ease-out infinite; }
    .h-steam-2    { animation: h-steam 2.8s ease-out .75s infinite; }
    .h-steam-3    { animation: h-steam 2.8s ease-out 1.5s infinite; }
    .h-flame      { animation: h-flame 1.35s ease-in-out infinite; transform-box:fill-box; transform-origin:center bottom; }
    .h-glow-pulse { animation: h-glow 2.8s ease-in-out infinite; }
    .h-plate-in   { animation: h-plate-in .95s cubic-bezier(.22,1,.36,1) .15s both; }
    .h-badge-in   { animation: h-badge .85s cubic-bezier(.22,1,.36,1) .55s both; }
    .h-shimmer    {
      background: linear-gradient(90deg, var(--amber) 0%, #f5c06a 42%, #f97316 58%, var(--amber) 100%);
      background-size: 200% auto;
      -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
      animation: h-shimmer 5.2s linear 1s infinite;
    }

    /* Scroll reveal */
    .sr { opacity:0; transform:translateY(28px); transition:opacity .78s cubic-bezier(.22,1,.36,1), transform .78s cubic-bezier(.22,1,.36,1); }
    .sr.visible { opacity:1; transform:translateY(0); }
    .sr-d1{transition-delay:.07s!important} .sr-d2{transition-delay:.14s!important}
    .sr-d3{transition-delay:.21s!important} .sr-d4{transition-delay:.28s!important}
    .sr-d5{transition-delay:.35s!important} .sr-d6{transition-delay:.42s!important}

    /* Step cards */
    .h-step-card { padding:24px 20px; border-radius:16px; background:var(--glass); border:1px solid var(--border); transition:border-color .3s, background .3s, transform .35s cubic-bezier(.34,1.56,.64,1), box-shadow .3s; cursor:default; }
    .h-step-card:hover { border-color:var(--border-mid); background:var(--glass-hi); transform:translateY(-5px); box-shadow:0 16px 48px rgba(0,0,0,.35); }

    /* Category cards */
    .h-cat-card { padding:26px 22px; border-radius:20px; background:var(--glass); border:1px solid var(--border); transition:border-color .35s, background .3s, transform .4s cubic-bezier(.34,1.56,.64,1), box-shadow .35s, opacity .65s cubic-bezier(.22,1,.36,1) calc(var(--i,0) * .07s); cursor:pointer; text-decoration:none; display:block; opacity:0; }
    .h-cat-card:hover { border-color:var(--border-mid); background:var(--glass-hi); transform:translateY(-6px); box-shadow:0 20px 56px rgba(0,0,0,.38); }
    [data-inview] .h-cat-card { opacity:1; }
    .h-media-item { opacity:0; transform:translateY(30px) scale(.96); transition:opacity .72s cubic-bezier(.22,1,.36,1) calc(var(--i,0) * .08s), transform .72s cubic-bezier(.22,1,.36,1) calc(var(--i,0) * .08s); }
    [data-inview] .h-media-item { opacity:1; transform:none; }

    /* Dish cards */
    .h-dish-card { border-radius:22px; background:var(--glass); border:1px solid var(--border); overflow:hidden; transition:border-color .35s, transform .42s cubic-bezier(.34,1.56,.64,1), box-shadow .35s; cursor:pointer; }
    .h-dish-card:hover { border-color:var(--border-mid); transform:translateY(-10px) scale(1.018); box-shadow:0 28px 70px rgba(0,0,0,.44); }
    .h-dish-card:hover .h-dish-img { transform:scale(1.05); }
    .h-dish-img { transition:transform .5s cubic-bezier(.22,1,.36,1); }

    /* Feature cards */
    .h-feat-card { padding:28px 24px; border-radius:18px; background:var(--glass); border:1px solid var(--border); transition:border-color .3s, background .3s, transform .35s cubic-bezier(.34,1.56,.64,1); }
    .h-feat-card:hover { border-color:var(--border-mid); background:var(--glass-hi); transform:translateY(-4px); }

    /* Stats */
    .h-stats-row { display:grid; grid-template-columns:repeat(4,1fr); border:1px solid rgba(212,150,58,0.28); border-radius:20px; overflow:hidden; background:var(--bg-2); backdrop-filter:blur(18px); box-shadow:0 0 0 1px rgba(212,150,58,0.08), inset 0 1px 0 rgba(212,175,80,0.06); }
    .h-stat-block { padding:34px 24px; border-right:1px solid rgba(212,150,58,0.14); text-align:center; transition:background .25s; }
    .h-stat-block:last-child { border-right:none; }
    .h-stat-block:hover { background:rgba(212,150,58,0.05); }
    .h-stat-num { font-family:'Barlow Condensed',serif; font-size:46px; font-weight:700; $10.02em; line-height:1; background:var(--grad); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin-bottom:8px; }
    .h-stat-label { font-family:'JetBrains Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:.22em; color:var(--text-3); }

    /* Ticker */
    .h-ticker-outer { overflow:hidden; position:relative; border-top:1px solid rgba(212,150,58,0.18); border-bottom:1px solid rgba(212,150,58,0.18); }
    .h-ticker-outer::before { content:''; position:absolute; left:0; top:0; bottom:0; width:80px; background:linear-gradient(to right,var(--bg),transparent); z-index:2; pointer-events:none; }
    .h-ticker-outer::after  { content:''; position:absolute; right:0; top:0; bottom:0; width:80px; background:linear-gradient(to left,var(--bg),transparent); z-index:2; pointer-events:none; }
    .h-ticker { display:flex; width:max-content; animation:h-ticker 36s linear infinite; }
    .h-ticker:hover { animation-play-state:paused; }
    .h-ticker-item { display:flex; align-items:center; gap:10px; padding:14px 26px; font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--text-3); white-space:nowrap; transition:color .2s; cursor:default; }
    .h-ticker-item:hover { color:var(--amber); }
    .h-ticker-dot { width:3px; height:3px; border-radius:50%; background:var(--amber); opacity:.45; flex-shrink:0; }

    /* Testimonials */
    .h-test-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:16px; }
    .h-test-card { padding:28px 24px; border-radius:18px; background:var(--bg-2); backdrop-filter:blur(18px); border:1px solid var(--border-mid); transition:border-color .3s, transform .35s cubic-bezier(.34,1.56,.64,1); }
    .h-test-card:hover { border-color:var(--border-hi); transform:translateY(-4px); }

    /* Panel card */
    .h-panel-card { background:var(--bg-3); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border:1px solid var(--border); border-radius:14px; padding:13px 17px; }
    .h-stat-pill { display:inline-flex; align-items:center; gap:8px; padding:5px 13px; border-radius:20px; border:1px solid var(--border-mid); background:var(--glass); backdrop-filter:blur(12px); font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:var(--text-2); }
    .h-stat-pill span { color:var(--amber); font-weight:600; }

    /* Sliding marquee bands */
    @keyframes h-mrq-r { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @keyframes h-mrq-l { from{transform:translateX(-50%)} to{transform:translateX(0)} }
    .h-mrq-text { font-family:'Barlow Condensed',serif; font-size:clamp(72px,10vw,140px); font-weight:700; font-style:normal; $10.02em; line-height:1.1; white-space:nowrap; padding:0 28px; color:rgba(212,150,58,.22); -webkit-text-stroke:1px rgba(212,150,58,.45); transition:color .3s; user-select:none; }
    .h-mrq-text:hover { color:rgba(212,150,58,.4); }
    .h-mrq-sep { color:rgba(212,150,58,.35); font-size:24px; align-self:center; flex-shrink:0; padding:0 6px; }

    /* Section heading word-reveal */
    @keyframes h-wup { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
    .h-wclip { display:inline-block; overflow:hidden; vertical-align:bottom; }
    .h-wup   { display:inline-block; animation:h-wup .65s cubic-bezier(.22,1,.36,1) both; }

    /* Cat grid */
    .h-cat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
    .h-cat-card.active { border-color:var(--amber) !important; background:var(--glass-hi) !important; }

    /* Hotel cards */
    .h-hotel-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
    .h-hotel-card { padding:22px 24px; border-radius:18px; background:var(--bg-2); backdrop-filter:blur(16px); border:1px solid var(--border); transition:border-color .35s, background .3s, transform .4s cubic-bezier(.34,1.56,.64,1), box-shadow .35s; text-decoration:none; display:block; color:inherit; }
    .h-hotel-card:hover { border-color:var(--border-hi); background:var(--bg-3); transform:translateY(-5px); box-shadow:0 18px 50px rgba(0,0,0,.25); }

    @media(max-width:900px){
      .h-stats-row { grid-template-columns:repeat(2,1fr); }
      .h-stat-block:nth-child(2){border-right:none} .h-stat-block:nth-child(3){border-right:1px solid var(--border);border-top:1px solid var(--border)} .h-stat-block:nth-child(4){border-top:1px solid var(--border)}
      .h-test-grid,.h-dishes-grid,.h-cat-grid,.h-hotel-grid { grid-template-columns:1fr!important; }
      .h-feat-grid { grid-template-columns:1fr!important; }
    }
    @media(max-width:640px){
      .h-stats-row{grid-template-columns:1fr} .h-stat-block{border-right:none!important;border-top:1px solid var(--border)} .h-stat-block:first-child{border-top:none}
    }

    /* Offers section */
    .h-offers-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:20px; }
    .h-offer-card { border-radius:20px; background:var(--bg-2); backdrop-filter:blur(16px); border:1px solid var(--border); overflow:hidden; transition:border-color .35s, transform .42s cubic-bezier(.34,1.56,.64,1), box-shadow .35s; }
    .h-offer-card:hover { border-color:var(--border-hi); transform:translateY(-6px); box-shadow:0 22px 60px rgba(0,0,0,.22); }
    .h-offer-badge { display:inline-block; font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:.16em; text-transform:uppercase; background:var(--amber); color:#fff; padding:3px 10px; border-radius:20px; margin-bottom:10px; }

    /* Dish TV */
    .h-tv-body { background:linear-gradient(160deg,#2e2620 0%,#1c1410 60%,#241c16 100%); border-radius:22px; border:3px solid #3a3028; box-shadow:0 0 0 2px #100c08, 0 28px 72px rgba(0,0,0,.72), inset 0 1px 0 rgba(255,255,255,.06); }
    @keyframes h-tv-on { 0%{opacity:0;transform:scaleX(0.015) scaleY(0.015)} 40%{opacity:1;transform:scaleX(1) scaleY(0.015)} 100%{transform:scaleX(1) scaleY(1)} }
    .h-tv-screen-on { animation:h-tv-on .38s cubic-bezier(.22,1,.36,1) both; }
    .h-tv-power { transition:background .3s, box-shadow .3s; }
    .h-tv-power:hover { filter:brightness(1.2); }
    .h-tv-chan:hover { background:var(--amber)!important; }
    /* TV layout helpers */
    .h-tv-layout { display:flex; align-items:stretch; gap:0; padding:12px 14px 10px; }
    .h-tv-spk { width:44px; flex-shrink:0; display:flex; flex-direction:column; justify-content:center; gap:0; padding-right:8px; }
    .h-tv-ctrl { width:64px; flex-shrink:0; padding-left:10px; display:flex; flex-direction:column; justify-content:space-between; padding-top:4px; padding-bottom:4px; }
    .h-tv-ctrl-knobs { display:flex; flex-direction:column; gap:10px; align-items:center; }
    .h-tv-chan-row { display:flex; gap:6px; flex-wrap:wrap; justify-content:center; margin-top:10px; }
    @media (max-width:520px) {
      .h-tv-spk { display:none; }
      .h-tv-layout { padding:8px 8px 8px; }
      .h-tv-ctrl { width:48px; padding-left:6px; }
      .h-tv-ctrl-knobs { gap:7px; }
    }
    @media (max-width:380px) {
      .h-tv-ctrl { display:none; }
      .h-tv-layout { padding:8px; }
    }

    /* ── Vintage background slideshow ── */
    @keyframes h-bg-ken { from{transform:scale(1.0) translateX(0)} to{transform:scale(1.07) translateX(-1%)} }
    .h-bg-layer { position:fixed; inset:0; overflow:hidden; }
    .h-bg-layer img { width:100%; height:100%; object-fit:cover; display:block;
      filter:sepia(0.28) brightness(0.58) saturate(1.15) contrast(1.04);
      animation:h-bg-ken 9s ease-out both; }

    /* ── Vintage overlays ── */
    .h-bg-vignette {
      position:fixed; inset:0; pointer-events:none;
      background:
        radial-gradient(ellipse 140% 100% at 50% 45%, rgba(6,3,1,0.0) 15%, rgba(3,1,0,0.72) 100%),
        linear-gradient(180deg, rgba(6,3,1,0.52) 0%, rgba(6,3,1,0.08) 20%, rgba(6,3,1,0.08) 80%, rgba(6,3,1,0.62) 100%);
    }
    .h-bg-grain {
      position:fixed; inset:-60px; pointer-events:none;
      opacity:0.28; mix-blend-mode:soft-light;
      background-size:200px 200px;
      animation:h-grain-shift 0.18s steps(1) infinite;
    }
    @keyframes h-grain-shift {
      0%  { background-position: 0px 0px }
      33% { background-position: -28px 18px }
      66% { background-position: 18px -28px }
    }

    /* Vintage knob hover */
    @keyframes h-knob-pulse { 0%,100%{box-shadow:0 0 8px rgba(200,50,16,.8)} 50%{box-shadow:0 0 18px rgba(220,80,20,1),0 0 32px rgba(200,50,16,.5)} }
    .h-vintage-knob { transition:transform .35s cubic-bezier(.22,1,.36,1), box-shadow .3s; }
    .h-vintage-knob:hover { transform:rotate(28deg) scale(1.1) !important; box-shadow:0 0 0 3px rgba(200,150,50,.35), 0 0 0 1px rgba(0,0,0,.6), inset 0 2px 6px rgba(0,0,0,.6), 0 8px 24px rgba(0,0,0,.65) !important; }
    .h-vintage-knob:hover .h-knob-dot { animation:h-knob-pulse .9s ease-in-out infinite; }
    .h-knob-dot { transition:box-shadow .3s; }

    /* ── Vintage section label ── */
    .h-vsec { display:flex; align-items:center; gap:20px; }
    .h-vsec-ln-l { flex:1; height:1px; background:linear-gradient(to left, rgba(212,150,58,0.45), transparent); }
    .h-vsec-ln-r { flex:1; height:1px; background:linear-gradient(to right, rgba(212,150,58,0.45), transparent); }
    .h-vsec-lbl {
      font-family:'Barlow Condensed',serif; font-size:18px; font-style:normal; font-weight:700;
      text-transform:uppercase; letter-spacing:0.22em; color:var(--amber);
      display:flex; align-items:center; gap:12px; white-space:nowrap;
    }
    .h-vsec-gem { font-style:normal; color:rgba(212,150,58,0.5); font-size:13px; }
    .h-vsec-right { flex-shrink:0; }

    /* ── Vintage nav-link style ── */
    .h-vnav { font-family:'JetBrains Mono',monospace; font-size:9px; text-transform:uppercase;
      letter-spacing:0.18em; color:var(--text-3); text-decoration:none; transition:color .2s;
      background:none; border:none; cursor:pointer; padding:0; }
    .h-vnav:hover { color:var(--amber); }

    /* ── CTA section vintage border ── */
    .h-cta-vintage {
      background: var(--bg-2);
      backdrop-filter: blur(22px);
      box-shadow: 0 0 0 1px var(--border-mid), 0 0 60px rgba(212,150,58,0.04), inset 0 1px 0 rgba(212,175,80,0.05);
    }
    @media(max-width:640px) {
      .h-cta-vintage { padding: 32px 20px !important; }
      .h-cta-vintage .h-cta-heading { font-size: 26px !important; }
      .h-cta-vintage .h-cta-btns { flex-shrink: 1 !important; flex-wrap: wrap; width: 100%; }
      .h-cta-vintage .h-cta-btns a,
      .h-cta-vintage .h-cta-btns a button { width: 100%; justify-content: center; }
    }

    /* ── Hero panel vintage glass ── */
    .home-hero-panel {
      background: var(--bg-2) !important;
      backdrop-filter: blur(18px) !important;
      border-color: var(--border-mid) !important;
    }
  `
})()

/* ── CountUp ── */
function CountUp({ raw, visible }) {
  const [display, setDisplay] = useState(raw)
  const ran = useRef(false)
  useEffect(() => {
    if (!visible || ran.current) return
    ran.current = true
    const m = raw.match(/^(.*?)(\d[\d,]*)(.*)$/)
    if (!m) return
    const [, pre, numStr, suf] = m
    const target = parseInt(numStr.replace(/,/g,''), 10)
    const comma  = numStr.includes(',')
    const t0 = performance.now()
    const tick = now => {
      const p = Math.min((now - t0) / 1600, 1)
      const v = Math.round(target * (1 - Math.pow(1 - p, 3)))
      setDisplay(pre + (comma ? v.toLocaleString() : v) + suf)
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [visible])
  return <>{display}</>
}

/* ── Scroll reveal ── */
function useScrollReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('visible'); obs.disconnect() } }, { threshold: 0.1 }
    )
    obs.observe(el); return () => obs.disconnect()
  }, [])
  return ref
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
function useScrollRevealState() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('visible'); setVisible(true); obs.disconnect() } }, { threshold: 0.1 }
    )
    obs.observe(el); return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

/* ── Vintage section label ── */
function VintageSectionLabel({ children, right, mb = 28 }) {
  return (
    <div className="h-vsec" style={{ marginBottom: mb }}>
      <div className="h-vsec-ln-l" />
      <div className="h-vsec-lbl">
        <span className="h-vsec-gem">◆</span>
        {children}
        <span className="h-vsec-gem">◆</span>
      </div>
      <div className="h-vsec-ln-r" />
      {right && <div className="h-vsec-right">{right}</div>}
    </div>
  )
}

/* ══ Offer Countdown ══ */
function OfferCountdown({ endsAt }) {
  const calc = () => {
    const diff = new Date(endsAt) - Date.now()
    if (diff <= 0) return null
    const d = Math.floor(diff / 86400000)
    const h = Math.floor((diff % 86400000) / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    return { d, h, m, s }
  }
  const [t, setT] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => { const v = calc(); setT(v); if (!v) clearInterval(id) }, 1000)
    return () => clearInterval(id)
  }, [endsAt])
  if (!t) return null
  const Cell = ({ v, label }) => (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:44 }}>
      <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:22, fontWeight:700, color:'#fff', lineHeight:1, textShadow:'0 0 14px rgba(212,150,58,.6)' }}>
        {String(v).padStart(2,'0')}
      </div>
      <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:8, letterSpacing:'.18em', textTransform:'uppercase', color:'rgba(212,150,58,.7)', marginTop:3 }}>{label}</div>
    </div>
  )
  const Sep = () => <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:18, color:'rgba(212,150,58,.5)', alignSelf:'flex-start', marginTop:2, paddingBottom:14 }}>:</div>
  return (
    <div style={{ display:'inline-flex', alignItems:'flex-end', gap:6, background:'rgba(0,0,0,.55)', backdropFilter:'blur(12px)', borderRadius:12, padding:'10px 18px', border:'1px solid rgba(212,150,58,.25)' }}>
      {t.d > 0 && <><Cell v={t.d} label="days" /><Sep /></>}
      <Cell v={t.h} label="hrs" /><Sep />
      <Cell v={t.m} label="min" /><Sep />
      <Cell v={t.s} label="sec" />
    </div>
  )
}

/* ══ Offer Slider ══ */
function OfferSlider({ offers }) {
  const [idx, setIdx] = useState(0)
  const total = offers.length
  const prev = () => setIdx(i => (i - 1 + total) % total)
  const next = () => setIdx(i => (i + 1) % total)

  const touchX = useRef(null)
  const onTouchStart = e => { touchX.current = e.touches[0].clientX }
  const onTouchEnd   = e => {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    touchX.current = null
    if (Math.abs(dx) < 40) return
    dx < 0 ? next() : prev()
  }

  useEffect(() => {
    if (total <= 1) return
    const id = setInterval(() => setIdx(i => (i + 1) % total), 5000)
    return () => clearInterval(id)
  }, [total])

  if (!total) return null
  const safeIdx = Math.min(idx, total - 1)

  return (
    <div
      style={{ position:'relative', borderRadius:24, overflow:'hidden', height:'clamp(220px,32vw,400px)', background:'#0e0a04', border:'1px solid rgba(212,150,58,0.18)', boxShadow:'0 8px 32px rgba(0,0,0,.45)' }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      {offers.map((offer, i) => (
        <div key={offer.id} style={{
          position:'absolute', inset:0,
          opacity: i === safeIdx ? 1 : 0,
          transition:'opacity .6s ease',
          pointerEvents: i === safeIdx ? 'auto' : 'none',
        }}>
          {offer.image_path
            ? <img src={imageUrl(offer.image_path)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center', display:'block' }} />
            : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,rgba(212,150,58,.18) 0%,rgba(180,80,40,.14) 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:64 }}>🍽️</div>
          }
          {offer.ends_at && (
            <div style={{ position:'absolute', bottom:20, right:20, zIndex:2 }}>
              <OfferCountdown endsAt={offer.ends_at} />
            </div>
          )}
        </div>
      ))}

      {/* Arrows — only if more than 1 */}
      {total > 1 && (
        <>
          <button onClick={prev} aria-label="Previous offer" className="banner-arrow" style={{
            position:'absolute', left:16, top:'50%', transform:'translateY(-50%)',
            zIndex:10, width:44, height:44, borderRadius:'50%',
            background:'rgba(14,10,4,.72)', border:'1px solid rgba(212,150,58,.35)',
            color:'#f0b429', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            transition:'background .2s, transform .2s',
          }}
            onMouseEnter={e=>{ e.currentTarget.style.background='rgba(212,150,58,.18)'; e.currentTarget.style.transform='translateY(-50%) scale(1.08)' }}
            onMouseLeave={e=>{ e.currentTarget.style.background='rgba(14,10,4,.72)'; e.currentTarget.style.transform='translateY(-50%)' }}
          >‹</button>
          <button onClick={next} aria-label="Next offer" className="banner-arrow" style={{
            position:'absolute', right:16, top:'50%', transform:'translateY(-50%)',
            zIndex:10, width:44, height:44, borderRadius:'50%',
            background:'rgba(14,10,4,.72)', border:'1px solid rgba(212,150,58,.35)',
            color:'#f0b429', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            transition:'background .2s, transform .2s',
          }}
            onMouseEnter={e=>{ e.currentTarget.style.background='rgba(212,150,58,.18)'; e.currentTarget.style.transform='translateY(-50%) scale(1.08)' }}
            onMouseLeave={e=>{ e.currentTarget.style.background='rgba(14,10,4,.72)'; e.currentTarget.style.transform='translateY(-50%)' }}
          >›</button>

          {/* Dots */}
          <div style={{ position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)', zIndex:10, display:'flex', gap:8 }}>
            {offers.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} aria-label={`Offer ${i + 1}`} style={{
                width: i === safeIdx ? 28 : 8, height:8, borderRadius:4,
                background: i === safeIdx ? '#f0b429' : 'rgba(255,255,255,.3)',
                border:'none', cursor:'pointer', padding:0,
                boxShadow: i === safeIdx ? '0 0 8px rgba(240,180,41,.7)' : 'none',
                transition:'width .3s, background .3s, box-shadow .3s',
              }} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ══ Dish Video Reel ══ */
function DishVideoReel({ videos }) {
  const [idx, setIdx]   = useState(0)
  const videoRef        = useRef(null)
  const timerRef        = useRef(null)

  const goTo = (i) => {
    setIdx(i)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setIdx(n => (n + 1) % videos.length), 5000)
  }

  useEffect(() => {
    if (videos.length <= 1) return
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % videos.length), 5000)
    return () => clearInterval(timerRef.current)
  }, [videos.length])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.load()
    v.play().catch(() => {})
  }, [idx])

  if (!videos.length) return (
    <div style={{ width:'100%', flex:1, minHeight:0, background:'var(--bg-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.2em' }}>
        No videos yet
      </div>
    </div>
  )

  const d = videos[idx]

  return (
    <div style={{ position:'relative', width:'100%', flex:1, minHeight:0, overflow:'hidden', background:'var(--bg-3)' }}>
      {d.video_path ? (
        <video
          ref={videoRef}
          key={d.id}
          src={imageUrl(d.video_path)}
          autoPlay muted loop playsInline
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
        />
      ) : (
        <img
          key={d.id}
          src={imageUrl(d.image_path)}
          alt={d.name}
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
        />
      )}

      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(6,3,1,.82) 0%, rgba(6,3,1,.06) 52%, transparent 100%)', pointerEvents:'none' }} />

      <div style={{ position:'absolute', bottom:72, left:22, right:22 }}>
        <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:8, textTransform:'uppercase', letterSpacing:'0.22em', color:'rgba(212,150,58,.85)', marginBottom:5 }}>
          {d.hotel_name}
        </div>
        <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:22, fontWeight:700, fontStyle:'normal', color:'#fff', lineHeight:1.15 }}>
          {d.name}
        </div>
      </div>

      {videos.length > 1 && (
        <div style={{ position:'absolute', bottom:18, left:0, right:0, display:'flex', justifyContent:'center', gap:5 }}>
          {videos.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === idx ? 20 : 5, height:5, borderRadius:3,
                background: i === idx ? 'var(--amber)' : 'rgba(255,255,255,.28)',
                border:'none', padding:0, cursor:'pointer',
                transition:'width .35s ease, background .25s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}


/* ══ Dish TV ══ */
function DishTV({ videos }) {
  const [idx, setIdx]         = useState(0)
  const [isOn, setIsOn]       = useState(true)
  const [turning, setTurning] = useState(false)
  const videoRef              = useRef(null)
  const timerRef              = useRef(null)

  const goTo = (i) => {
    setIdx(i)
    clearInterval(timerRef.current)
    if (videos.length > 1)
      timerRef.current = setInterval(() => setIdx(n => (n + 1) % videos.length), 5000)
  }

  useEffect(() => {
    if (videos.length <= 1) return
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % videos.length), 5000)
    return () => clearInterval(timerRef.current)
  }, [videos.length])

  useEffect(() => {
    const v = videoRef.current; if (!v) return
    if (isOn) { v.load(); v.play().catch(() => {}) }
    else v.pause()
  }, [idx, isOn])

  const togglePower = () => {
    if (isOn) { setIsOn(false); setTurning(false) }
    else { setTurning(true); setTimeout(() => { setIsOn(true); setTurning(false) }, 500) }
  }

  const d = videos.length > 0 ? videos[idx] : null

  /* Rotary knob helper */
  const Knob = ({ size = 36, label, onClick, active }) => (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <button onClick={onClick} style={{
        width:size, height:size, borderRadius:'50%', border:'none', padding:0, cursor: onClick ? 'pointer' : 'default',
        background:'radial-gradient(circle at 38% 28%, #5c4a38, #1e1408)',
        boxShadow:`0 0 0 2px #3a2a18, 0 0 0 3px #261a0e, inset 0 3px 8px rgba(0,0,0,.7), 0 4px 12px rgba(0,0,0,.6)${active ? ', 0 0 14px rgba(212,150,58,.35)' : ''}`,
        position:'relative', display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        {/* Knob grip ring */}
        <div style={{ position:'absolute', inset:3, borderRadius:'50%', border:'1px solid rgba(255,255,255,.06)', background:'repeating-conic-gradient(rgba(255,255,255,.03) 0deg,rgba(255,255,255,.03) 6deg,transparent 6deg,transparent 12deg)' }} />
        {/* Indicator line */}
        <div style={{ position:'absolute', top:4, left:'50%', transform:'translateX(-50%)', width:2, height:8, background: active ? 'rgba(212,150,58,.9)' : 'rgba(255,255,255,.3)', borderRadius:1 }} />
      </button>
      {label && <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:6, textTransform:'uppercase', letterSpacing:'.18em', color:'rgba(180,140,80,.5)' }}>{label}</div>}
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', userSelect:'none' }}>

      {/* ── Rabbit ear antennas ── */}
      <div style={{ position:'relative', width:'min(640px,92vw)', height:80, pointerEvents:'none' }}>
        {/* Base hinge */}
        <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:28, height:12, borderRadius:'4px 4px 0 0', background:'linear-gradient(to bottom,#4a3a2a,#2e2218)', border:'1px solid #3a2a18', borderBottom:'none' }} />
        {/* Left arm */}
        <div style={{ position:'absolute', bottom:10, left:'50%', marginLeft:-14, width:3, height:72, background:'linear-gradient(to top,#6a5a48,#c0b0a0)', borderRadius:2, transform:'rotate(-22deg)', transformOrigin:'bottom center', boxShadow:'0 0 6px rgba(0,0,0,.4)' }}>
          <div style={{ position:'absolute', top:-9, left:'50%', transform:'translateX(-50%)', width:14, height:14, borderRadius:'50%', background:'radial-gradient(circle at 38% 32%, #d0c0b0, #8a7a6a)', border:'1px solid #9a8a7a', boxShadow:'0 0 8px rgba(212,175,80,.2), inset 0 1px 3px rgba(255,255,255,.15)' }} />
        </div>
        {/* Right arm */}
        <div style={{ position:'absolute', bottom:10, left:'50%', marginLeft:11, width:3, height:72, background:'linear-gradient(to top,#6a5a48,#c0b0a0)', borderRadius:2, transform:'rotate(22deg)', transformOrigin:'bottom center', boxShadow:'0 0 6px rgba(0,0,0,.4)' }}>
          <div style={{ position:'absolute', top:-9, left:'50%', transform:'translateX(-50%)', width:14, height:14, borderRadius:'50%', background:'radial-gradient(circle at 38% 32%, #d0c0b0, #8a7a6a)', border:'1px solid #9a8a7a', boxShadow:'0 0 8px rgba(212,175,80,.2), inset 0 1px 3px rgba(255,255,255,.15)' }} />
        </div>
      </div>

      {/* ── TV Body ── */}
      <div style={{
        width:'min(640px,92vw)',
        background:'linear-gradient(160deg,#2e2416 0%,#1e1608 50%,#2a1e10 100%)',
        borderRadius:24,
        border:'3px solid #3e2e1a',
        position:'relative',
        boxShadow:'0 0 0 1px #120e08, inset 0 2px 0 rgba(255,255,255,.04), inset 0 -2px 0 rgba(0,0,0,.4), 0 28px 80px rgba(0,0,0,.8)',
        overflow:'hidden',
      }}>

        {/* Woodgrain texture overlay */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none', opacity:0.12,
          backgroundImage:`repeating-linear-gradient(92deg, transparent 0px, transparent 3px, rgba(255,220,140,.15) 3px, rgba(255,220,140,.15) 4px, transparent 4px, transparent 9px, rgba(200,160,80,.1) 9px, rgba(200,160,80,.1) 10px)`,
          backgroundSize:'100% 100%',
        }} />

        {/* Aging vignette on body */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 120% 100% at 50% 50%, transparent 40%, rgba(0,0,0,.45) 100%)' }} />

        {/* ── Top strip with brand ── */}
        <div style={{ padding:'10px 20px 0', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ height:1, width:40, background:'linear-gradient(to right,transparent,rgba(180,140,60,.4))' }} />
            <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:9, letterSpacing:'.55em', textTransform:'uppercase', color:'rgba(190,145,60,.6)', fontWeight:700 }}>QRIOUS · 360</div>
            <div style={{ height:1, width:40, background:'linear-gradient(to left,transparent,rgba(180,140,60,.4))' }} />
          </div>
        </div>

        {/* ── Main layout: speaker | screen | controls ── */}
        <div className="h-tv-layout">

          {/* Left speaker grille */}
          <div className="h-tv-spk">
            <div style={{ borderRadius:8, border:'1px solid rgba(255,255,255,.05)', background:'rgba(0,0,0,.35)', padding:'10px 6px', display:'flex', flexDirection:'column', gap:3, height:'100%', justifyContent:'center' }}>
              {Array.from({length:14}).map((_,i) => (
                <div key={i} style={{ height:2, borderRadius:1, background:'rgba(255,255,255,.07)', boxShadow:'0 1px 0 rgba(0,0,0,.5)' }} />
              ))}
              {/* Speaker label */}
              <div style={{ marginTop:6, textAlign:'center', fontFamily:'JetBrains Mono,monospace', fontSize:5, letterSpacing:'.2em', color:'rgba(180,140,60,.3)', textTransform:'uppercase' }}>SPK</div>
            </div>
          </div>

          {/* CRT Screen area */}
          <div style={{ flex:1 }}>
            {/* Deep bezel */}
            <div style={{
              background:'#060402',
              borderRadius:14,
              padding:10,
              boxShadow:'inset 0 0 40px rgba(0,0,0,.98), inset 0 2px 0 rgba(255,255,255,.03)',
              border:'2px solid #1a1208',
            }}>
              {/* Screen glass */}
              <div style={{ position:'relative', borderRadius:8, overflow:'hidden', aspectRatio:'4/3', background:'#000', boxShadow:'inset 0 0 60px rgba(0,0,0,.9)' }}>

                {(isOn || turning) && d?.video_path ? (
                  <video ref={videoRef} key={d.id} src={imageUrl(d.video_path)}
                    autoPlay muted loop playsInline
                    className={turning ? 'h-tv-screen-on' : ''}
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', filter:'sepia(0.18) contrast(1.08) brightness(0.88)' }}
                  />
                ) : (isOn || turning) && d?.image_path ? (
                  <img src={imageUrl(d.image_path)} alt={d?.name}
                    className={turning ? 'h-tv-screen-on' : ''}
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', filter:'sepia(0.18) contrast(1.08) brightness(0.88)' }}
                  />
                ) : isOn ? (
                  <div style={{ width:'100%', height:'100%', background:'#050806', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10 }}>
                    <div style={{ width:3, height:3, borderRadius:'50%', background:'#4aff88', boxShadow:'0 0 16px #4aff88, 0 0 40px rgba(74,255,136,.4)' }} />
                    <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:8, color:'rgba(74,255,136,.7)', textTransform:'uppercase', letterSpacing:'.22em' }}>No Signal</div>
                  </div>
                ) : (
                  <div style={{ width:'100%', height:'100%', background:'#020202' }} />
                )}

                {/* CRT scanlines */}
                {(isOn || turning) && (
                  <div style={{ position:'absolute', inset:0, zIndex:2, pointerEvents:'none',
                    background:'repeating-linear-gradient(0deg, rgba(0,0,0,.12) 0px, rgba(0,0,0,.12) 1px, transparent 1px, transparent 4px)' }} />
                )}

                {/* Phosphor green tint overlay */}
                {(isOn || turning) && (
                  <div style={{ position:'absolute', inset:0, zIndex:3, pointerEvents:'none',
                    background:'rgba(20,40,10,.08)', mixBlendMode:'multiply' }} />
                )}

                {/* CRT barrel/convex glass glare */}
                <div style={{ position:'absolute', inset:0, zIndex:4, pointerEvents:'none',
                  background:'radial-gradient(ellipse 85% 80% at 38% 28%, rgba(255,255,255,.06) 0%, transparent 55%), radial-gradient(ellipse 100% 100% at 50% 50%, transparent 65%, rgba(0,0,0,.55) 100%)' }} />

                {/* CRT edge burn */}
                <div style={{ position:'absolute', inset:0, zIndex:5, pointerEvents:'none',
                  boxShadow:'inset 0 0 30px rgba(0,0,0,.7), inset 0 0 8px rgba(0,0,0,.9)' }} />

                {/* Dish / hotel name overlay */}
                {isOn && d && (
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:6, padding:'28px 12px 10px',
                    background:'linear-gradient(to top, rgba(0,0,0,.9) 0%, transparent 100%)' }}>
                    <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:7, textTransform:'uppercase', letterSpacing:'.22em', color:'rgba(212,150,58,.85)', marginBottom:3 }}>{d.hotel_name}</div>
                    <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:15, fontWeight:700, color:'#f0e8d8', lineHeight:1.2 }}>{d.name}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right control panel */}
          <div className="h-tv-ctrl">

            {/* Channel number display */}
            <div style={{
              background:'#0a0804', border:'1px solid #2a2010', borderRadius:6,
              padding:'4px 6px', textAlign:'center', marginBottom:10,
              boxShadow:'inset 0 0 10px rgba(0,0,0,.8)',
            }}>
              <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:16, fontWeight:700, color: isOn ? '#d4a020' : '#1a1206', letterSpacing:'.05em', textShadow: isOn ? '0 0 10px rgba(212,160,32,.7)' : 'none', transition:'color .4s, text-shadow .4s' }}>
                {String(idx + 1).padStart(2,'0')}
              </div>
              <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:5, color:'rgba(180,130,40,.4)', textTransform:'uppercase', letterSpacing:'.15em' }}>CH</div>
            </div>

            {/* Knobs column */}
            <div className="h-tv-ctrl-knobs">
              <Knob size={32} label="VOL" />
              <Knob size={32} label="BRT" />
              <Knob size={32} label="CNT" />
            </div>

            {/* Power button */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, marginTop:10 }}>
              <button onClick={togglePower} style={{
                width:32, height:32, borderRadius:'50%', border:'none', cursor:'pointer', padding:0,
                background: isOn
                  ? 'radial-gradient(circle at 38% 32%, #ff6030, #991400)'
                  : 'radial-gradient(circle at 38% 32%, #3a2820, #1a0e08)',
                boxShadow: isOn
                  ? '0 0 14px rgba(220,72,28,.7), 0 0 28px rgba(220,72,28,.25), inset 0 2px 4px rgba(255,180,140,.2), 0 3px 8px rgba(0,0,0,.6)'
                  : 'inset 0 2px 6px rgba(0,0,0,.7), 0 3px 8px rgba(0,0,0,.5)',
                transition:'all .3s',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isOn ? 'rgba(255,200,180,.8)' : 'rgba(255,255,255,.2)'} strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
                </svg>
              </button>
              <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:5, color:'rgba(180,130,40,.4)', textTransform:'uppercase', letterSpacing:'.15em' }}>PWR</div>
            </div>
          </div>
        </div>

        {/* ── Bottom strip: brand plate ── */}
        <div style={{ padding:'0 14px 12px', display:'flex', alignItems:'center', justifyContent:'flex-end' }}>

          {/* Brand plate */}
          <div style={{
            background:'linear-gradient(135deg,#4a3a20,#2e2210)',
            border:'1px solid #5a4828',
            borderRadius:4, padding:'3px 10px',
            boxShadow:'inset 0 1px 0 rgba(255,255,255,.06), 0 2px 6px rgba(0,0,0,.5)',
          }}>
            <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:7, letterSpacing:'.35em', color:'rgba(200,160,70,.7)', textTransform:'uppercase', fontWeight:700 }}>QRIOUS360</div>
          </div>
        </div>

      </div>

      {/* ── Stand ── */}
      <div style={{ width:'min(120px,22vw)', height:18, background:'linear-gradient(160deg,#302418,#1c1408)', border:'2px solid #3a2a16', borderTop:'none', borderRadius:'0 0 6px 6px', boxShadow:'0 4px 12px rgba(0,0,0,.5)' }} />
      <div style={{ width:'min(200px,36vw)', height:8, background:'linear-gradient(to bottom,#2a1e0e,#160e06)', border:'2px solid #3a2a14', borderTop:'none', borderRadius:'0 0 4px 4px' }} />
      {/* Feet */}
      <div style={{ display:'flex', gap:'min(140px,26vw)', marginTop:2 }}>
        {[0,1].map(i => (
          <div key={i} style={{ width:18, height:6, borderRadius:'0 0 5px 5px', background:'linear-gradient(to bottom,#2a1e0e,#0e0a06)', border:'1px solid #3a2a14', borderTop:'none' }} />
        ))}
      </div>
    </div>
  )
}


/* ══ Gallery TV ══ */
function GalleryTV({ items }) {
  const [idx, setIdx]         = useState(0)
  const [isOn, setIsOn]       = useState(true)
  const [turning, setTurning] = useState(false)
  const videoRef              = useRef(null)
  const timerRef              = useRef(null)

  const goTo = (i) => {
    setIdx(i)
    clearInterval(timerRef.current)
    if (items.length > 1)
      timerRef.current = setInterval(() => setIdx(n => (n + 1) % items.length), 6000)
  }

  useEffect(() => {
    if (items.length <= 1) return
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % items.length), 6000)
    return () => clearInterval(timerRef.current)
  }, [items.length])

  useEffect(() => {
    const v = videoRef.current; if (!v) return
    if (isOn) { v.load(); v.play().catch(() => {}) } else v.pause()
  }, [idx, isOn])

  const togglePower = () => {
    if (isOn) { setIsOn(false); setTurning(false) }
    else { setTurning(true); setTimeout(() => { setIsOn(true); setTurning(false) }, 500) }
  }

  const d = items.length > 0 ? items[idx] : null

  const Knob = ({ size = 36, label }) => (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <button style={{
        width:size, height:size, borderRadius:'50%', border:'none', padding:0, cursor:'default',
        background:'radial-gradient(circle at 38% 28%, #5c4a38, #1e1408)',
        boxShadow:`0 0 0 2px #3a2a18, 0 0 0 3px #261a0e, inset 0 3px 8px rgba(0,0,0,.7), 0 4px 12px rgba(0,0,0,.6)`,
        position:'relative', display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <div style={{ position:'absolute', inset:3, borderRadius:'50%', border:'1px solid rgba(255,255,255,.06)', background:'repeating-conic-gradient(rgba(255,255,255,.03) 0deg,rgba(255,255,255,.03) 6deg,transparent 6deg,transparent 12deg)' }} />
        <div style={{ position:'absolute', top:4, left:'50%', transform:'translateX(-50%)', width:2, height:8, background:'rgba(255,255,255,.3)', borderRadius:1 }} />
      </button>
      {label && <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:6, textTransform:'uppercase', letterSpacing:'.18em', color:'rgba(180,140,80,.5)' }}>{label}</div>}
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', userSelect:'none' }}>

      {/* Antennas */}
      <div style={{ position:'relative', width:'min(720px,96vw)', height:80, pointerEvents:'none' }}>
        <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:28, height:12, borderRadius:'4px 4px 0 0', background:'linear-gradient(to bottom,#4a3a2a,#2e2218)', border:'1px solid #3a2a18', borderBottom:'none' }} />
        <div style={{ position:'absolute', bottom:10, left:'50%', marginLeft:-14, width:3, height:72, background:'linear-gradient(to top,#6a5a48,#c0b0a0)', borderRadius:2, transform:'rotate(-22deg)', transformOrigin:'bottom center', boxShadow:'0 0 6px rgba(0,0,0,.4)' }}>
          <div style={{ position:'absolute', top:-9, left:'50%', transform:'translateX(-50%)', width:14, height:14, borderRadius:'50%', background:'radial-gradient(circle at 38% 32%, #d0c0b0, #8a7a6a)', border:'1px solid #9a8a7a', boxShadow:'0 0 8px rgba(212,175,80,.2), inset 0 1px 3px rgba(255,255,255,.15)' }} />
        </div>
        <div style={{ position:'absolute', bottom:10, left:'50%', marginLeft:11, width:3, height:72, background:'linear-gradient(to top,#6a5a48,#c0b0a0)', borderRadius:2, transform:'rotate(22deg)', transformOrigin:'bottom center', boxShadow:'0 0 6px rgba(0,0,0,.4)' }}>
          <div style={{ position:'absolute', top:-9, left:'50%', transform:'translateX(-50%)', width:14, height:14, borderRadius:'50%', background:'radial-gradient(circle at 38% 32%, #d0c0b0, #8a7a6a)', border:'1px solid #9a8a7a', boxShadow:'0 0 8px rgba(212,175,80,.2), inset 0 1px 3px rgba(255,255,255,.15)' }} />
        </div>
      </div>

      {/* TV Body */}
      <div style={{
        width:'min(720px,96vw)',
        background:'linear-gradient(160deg,#2e2416 0%,#1e1608 50%,#2a1e10 100%)',
        borderRadius:24, border:'3px solid #3e2e1a', position:'relative',
        boxShadow:'0 0 0 1px #120e08, inset 0 2px 0 rgba(255,255,255,.04), inset 0 -2px 0 rgba(0,0,0,.4), 0 28px 80px rgba(0,0,0,.8)',
        overflow:'hidden',
      }}>
        {/* Wood grain */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:0.12, backgroundImage:`repeating-linear-gradient(92deg, transparent 0px, transparent 3px, rgba(255,220,140,.15) 3px, rgba(255,220,140,.15) 4px, transparent 4px, transparent 9px, rgba(200,160,80,.1) 9px, rgba(200,160,80,.1) 10px)` }} />
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 120% 100% at 50% 50%, transparent 40%, rgba(0,0,0,.45) 100%)' }} />

        {/* Top brand strip */}
        <div style={{ padding:'10px 20px 0', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ height:1, width:40, background:'linear-gradient(to right,transparent,rgba(180,140,60,.4))' }} />
            <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:9, letterSpacing:'.55em', textTransform:'uppercase', color:'rgba(190,145,60,.6)', fontWeight:700 }}>GALLERY · 360</div>
            <div style={{ height:1, width:40, background:'linear-gradient(to left,transparent,rgba(180,140,60,.4))' }} />
          </div>
        </div>

        {/* Main layout */}
        <div className="h-tv-layout">

          {/* Left speaker */}
          <div className="h-tv-spk">
            <div style={{ borderRadius:8, border:'1px solid rgba(255,255,255,.05)', background:'rgba(0,0,0,.35)', padding:'10px 6px', display:'flex', flexDirection:'column', gap:3, height:'100%', justifyContent:'center' }}>
              {Array.from({length:14}).map((_,i) => (
                <div key={i} style={{ height:2, borderRadius:1, background:'rgba(255,255,255,.07)', boxShadow:'0 1px 0 rgba(0,0,0,.5)' }} />
              ))}
              <div style={{ marginTop:6, textAlign:'center', fontFamily:'JetBrains Mono,monospace', fontSize:5, letterSpacing:'.2em', color:'rgba(180,140,60,.3)', textTransform:'uppercase' }}>SPK</div>
            </div>
          </div>

          {/* CRT Screen */}
          <div style={{ flex:1 }}>
            <div style={{ background:'#060402', borderRadius:14, padding:10, boxShadow:'inset 0 0 40px rgba(0,0,0,.98), inset 0 2px 0 rgba(255,255,255,.03)', border:'2px solid #1a1208' }}>
              <div style={{ position:'relative', borderRadius:8, overflow:'hidden', aspectRatio:'16/10', background:'#000', boxShadow:'inset 0 0 60px rgba(0,0,0,.9)' }}>

                {isOn && d?.type === 'video' ? (
                  <video ref={videoRef} key={d.id} src={imageUrl(d.path)}
                    autoPlay muted loop playsInline
                    className={turning ? 'h-tv-screen-on' : ''}
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', filter:'sepia(0.18) contrast(1.08) brightness(0.88)' }}
                  />
                ) : isOn && d?.path ? (
                  <img src={imageUrl(d.path)} alt={d.caption||''}
                    className={turning ? 'h-tv-screen-on' : ''}
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', filter:'sepia(0.18) contrast(1.08) brightness(0.88)' }}
                  />
                ) : !isOn ? (
                  <div style={{ width:'100%', height:'100%', background:'#020202' }} />
                ) : null}

                {/* Scanlines */}
                {isOn && <div style={{ position:'absolute', inset:0, zIndex:2, pointerEvents:'none', background:'repeating-linear-gradient(0deg, rgba(0,0,0,.12) 0px, rgba(0,0,0,.12) 1px, transparent 1px, transparent 4px)' }} />}
                {/* Glass glare */}
                <div style={{ position:'absolute', inset:0, zIndex:4, pointerEvents:'none', background:'radial-gradient(ellipse 85% 80% at 38% 28%, rgba(255,255,255,.06) 0%, transparent 55%), radial-gradient(ellipse 100% 100% at 50% 50%, transparent 65%, rgba(0,0,0,.55) 100%)' }} />
                {/* Edge burn */}
                <div style={{ position:'absolute', inset:0, zIndex:5, pointerEvents:'none', boxShadow:'inset 0 0 30px rgba(0,0,0,.7), inset 0 0 8px rgba(0,0,0,.9)' }} />

                {/* Caption overlay */}
                {isOn && d?.caption && (
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:6, padding:'28px 12px 10px', background:'linear-gradient(to top, rgba(0,0,0,.9) 0%, transparent 100%)' }}>
                    <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:15, fontWeight:700, color:'#f0e8d8', lineHeight:1.2 }}>{d.caption}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right controls */}
          <div className="h-tv-ctrl">
            {/* Channel display */}
            <div style={{ background:'#0a0804', border:'1px solid #2a2010', borderRadius:6, padding:'4px 6px', textAlign:'center', marginBottom:10, boxShadow:'inset 0 0 10px rgba(0,0,0,.8)' }}>
              <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:16, fontWeight:700, color: isOn ? '#d4a020' : '#1a1206', letterSpacing:'.05em', textShadow: isOn ? '0 0 10px rgba(212,160,32,.7)' : 'none', transition:'color .4s, text-shadow .4s' }}>
                {String(idx + 1).padStart(2,'0')}
              </div>
              <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:5, color:'rgba(180,130,40,.4)', textTransform:'uppercase', letterSpacing:'.15em' }}>CH</div>
            </div>
            <div className="h-tv-ctrl-knobs">
              <Knob size={32} label="BRT" />
              <Knob size={32} label="CNT" />
            </div>
            {/* Power */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, marginTop:10 }}>
              <button onClick={togglePower} style={{
                width:32, height:32, borderRadius:'50%', border:'none', cursor:'pointer', padding:0,
                background: isOn ? 'radial-gradient(circle at 38% 32%, #ff6030, #991400)' : 'radial-gradient(circle at 38% 32%, #3a2820, #1a0e08)',
                boxShadow: isOn ? '0 0 14px rgba(220,72,28,.7), 0 0 28px rgba(220,72,28,.25), inset 0 2px 4px rgba(255,180,140,.2), 0 3px 8px rgba(0,0,0,.6)' : 'inset 0 2px 6px rgba(0,0,0,.7), 0 3px 8px rgba(0,0,0,.5)',
                transition:'all .3s',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isOn ? 'rgba(255,200,180,.8)' : 'rgba(255,255,255,.2)'} strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
                </svg>
              </button>
              <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:5, color:'rgba(180,130,40,.4)', textTransform:'uppercase', letterSpacing:'.15em' }}>PWR</div>
            </div>
          </div>
        </div>

        {/* Bottom: channel dots */}
        {items.length > 1 && (
          <div style={{ padding:'8px 20px 14px', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {items.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} style={{
                width: i === idx ? 22 : 7, height:7, borderRadius:4, border:'none', cursor:'pointer', padding:0,
                background: i === idx ? '#d4a020' : 'rgba(180,140,60,.25)',
                boxShadow: i === idx ? '0 0 8px rgba(212,160,32,.6)' : 'none',
                transition:'width .25s, background .25s',
              }} />
            ))}
          </div>
        )}

        {/* Brand plate */}
        <div style={{ padding:'0 14px 12px', display:'flex', alignItems:'center', justifyContent:'flex-end' }}>
          <div style={{ background:'linear-gradient(135deg,#4a3a20,#2e2210)', border:'1px solid #5a4828', borderRadius:4, padding:'3px 10px', boxShadow:'inset 0 1px 0 rgba(255,255,255,.06), 0 2px 6px rgba(0,0,0,.5)' }}>
            <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:7, letterSpacing:'.35em', color:'rgba(200,160,70,.7)', textTransform:'uppercase', fontWeight:700 }}>QRIOUS360</div>
          </div>
        </div>
      </div>

      {/* Stand */}
      <div style={{ width:'min(140px,26vw)', height:18, background:'linear-gradient(160deg,#302418,#1c1408)', border:'2px solid #3a2a16', borderTop:'none', borderRadius:'0 0 6px 6px', boxShadow:'0 4px 12px rgba(0,0,0,.5)' }} />
      <div style={{ width:'min(220px,40vw)', height:8, background:'linear-gradient(to bottom,#2a1e0e,#160e06)', border:'2px solid #3a2a14', borderTop:'none', borderRadius:'0 0 4px 4px' }} />
      <div style={{ display:'flex', gap:'min(160px,30vw)', marginTop:2 }}>
        {[0,1].map(i => <div key={i} style={{ width:18, height:6, borderRadius:'0 0 5px 5px', background:'linear-gradient(to bottom,#2a1e0e,#0e0a06)', border:'1px solid #3a2a14', borderTop:'none' }} />)}
      </div>
    </div>
  )
}


function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )
}

/* ── Hotel logo ticker ── */
function HotelLogoTicker({ hotels, style, reverse, label }) {
  if (!hotels || hotels.length === 0) return null
  const minReps = Math.max(2, Math.ceil(10 / hotels.length))
  const half    = Array.from({ length: minReps }, () => hotels).flat()
  const items   = [...half, ...half]
  const anim    = reverse ? 'h-mrq-l 44s linear infinite' : 'h-mrq-r 44s linear infinite'

  return (
    <div style={{
      background: 'var(--bg-2)',
      border: '1px solid var(--border)',
      borderRadius: 22,
      padding: '24px 0 20px',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 4px 32px rgba(0,0,0,.28)',
      ...style,
    }}>
      {/* Card header */}
      {label && (
        <div style={{ padding: '0 28px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{label}</span>
          <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
        </div>
      )}

      {/* Scrolling band */}
      <div style={{ position: 'relative' }}>
        {/* Edge fades match card bg */}
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:100, background:'linear-gradient(to right,var(--bg-2),transparent)', zIndex:2, pointerEvents:'none' }} />
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:100, background:'linear-gradient(to left,var(--bg-2),transparent)', zIndex:2, pointerEvents:'none' }} />

        <div style={{ display:'flex', width:'max-content', animation:anim, alignItems:'center' }}>
          {items.map((h, i) => (
            <div key={i} style={{ display:'inline-flex', alignItems:'center', gap:14, padding:'8px 44px', flexShrink:0 }}>
              <div style={{ width:88, height:88, borderRadius:18, overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {h.logo_path
                  ? <img src={imageUrl(h.logo_path)} alt={h.hotel_name} style={{ width:'100%', height:'100%', objectFit:'contain', display:'block', padding:'8px' }} />
                  : <span style={{ fontFamily:'Barlow Condensed,serif', fontWeight:700, fontSize:38, color:'rgba(212,150,58,.9)', lineHeight:1 }}>{(h.hotel_name||'?')[0].toUpperCase()}</span>
                }
              </div>
              <span style={{ fontFamily:'Barlow Condensed,serif', fontWeight:700, fontSize:22, color:'var(--text)', whiteSpace:'nowrap', letterSpacing:'0.02em' }}>{h.hotel_name}</span>
              <span style={{ marginLeft:24, color:'rgba(212,150,58,.3)', fontSize:28, lineHeight:1 }}>·</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Section heading with word-by-word reveal ── */
function SlideHeading({ children, style, delay = 0 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const words = el.querySelectorAll('.h-wup')
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        words.forEach((w, i) => { w.style.animationDelay = `${delay + i * 0.08}s`; w.style.animationPlayState = 'running' })
        obs.disconnect()
      }
    }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  const words = String(children).split(' ').filter(Boolean)
  return (
    <div ref={ref} style={{ fontFamily:'Barlow Condensed,serif', lineHeight:1.1, ...style }}>
      {words.map((w, i) => (
        <span key={i} className="h-wclip" style={{ marginRight:'0.22em' }}>
          <span className="h-wup" style={{ animationPlayState:'paused', opacity:1, transform:'translateY(0)' }}>{w}</span>
        </span>
      ))}
    </div>
  )
}

/* ── Cuisine metadata ── */
const CUISINE_META = {
  'Chinese':          { emoji: '🥢', color: '#e8622a', tagline: 'Wok-fired classics' },
  'Italian':          { emoji: '🍝', color: '#d4961e', tagline: 'Pasta & wood-fired pizza' },
  'Indian':           { emoji: '🍛', color: '#f97316', tagline: 'Aromatic spice blends' },
  'Japanese':         { emoji: '🍱', color: '#e84393', tagline: 'Sushi & refined bento' },
  'Bar & Restaurant': { emoji: '🍻', color: '#9b59b6', tagline: 'Drinks & dining combined' },
  'Bakery & Café':    { emoji: '🥐', color: '#d4961e', tagline: 'Freshly baked every day' },
  'Fast Food':        { emoji: '🍔', color: '#e8622a', tagline: 'Quick & satisfying bites' },
  'Mexican':          { emoji: '🌮', color: '#f97316', tagline: 'Bold flavours & tacos' },
  'Mediterranean':    { emoji: '🫒', color: '#2ec4b6', tagline: 'Fresh & light plates' },
  'Seafood':          { emoji: '🦞', color: '#2ec4b6', tagline: 'Ocean-fresh catches' },
  'Steakhouse':       { emoji: '🥩', color: '#e8622a', tagline: 'Prime cuts & grills' },
  'Vegetarian/Vegan': { emoji: '🥗', color: '#4ade80', tagline: 'Plant-based & vibrant' },
  'American':         { emoji: '🍟', color: '#f97316', tagline: 'Burgers, ribs & more' },
  'Thai':             { emoji: '🍜', color: '#e8622a', tagline: 'Sweet, sour & spicy' },
  'Pizza':            { emoji: '🍕', color: '#e8622a', tagline: 'Hand-tossed perfection' },
  'Other':            { emoji: '🍽️', color: '#9ca3af', tagline: 'Unique culinary style' },
}

/* ── Data ── */
const DEFAULT = {
  eyebrow:    'Fine dining, reimagined digitally · est. MMXXVI',
  heading:    'Your hotel menu,',
  heading_em: 'elevated in 360°.',
  lead:       'QRIOUS360 transforms every hotel dish into an immersive 360° experience — guests spin, inspect, and choose with complete confidence before they order.',
  step1_num:'01', step1_title:'Scan',    step1_desc:'Guests scan the table QR code to open the hotel\'s live digital menu instantly.',
  step2_num:'02', step2_title:'Explore', step2_desc:'Spin any dish in full 360° — see plating, portions, and garnish from every angle.',
  step3_num:'03', step3_title:'Order',   step3_desc:'Choose with confidence and order directly from the digital menu. No surprises.',
}

const FEATURES = [
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/><path d="M3.6 9h16.8M3.6 15h16.8"/><path d="M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18"/></svg>,
    label: '360° Dish Viewer',
    desc:  'Guests drag to spin every hotel dish — plating, portions, and garnish from every angle before ordering.',
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
    label: 'Live Hotel Menu',
    desc:  'Owners update dishes from the dashboard in real time — menu changes appear instantly for every guest.',
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    label: 'Verified Guest Reviews',
    desc:  'Authentic diner ratings with photo reviews and chef responses — trust built on every plate served.',
  },
]

const TESTIMONIALS = [
  { quote:'Our guests scan the table QR and immediately spin the dish in 360°. Order accuracy improved and table-turn time dropped noticeably.', name:'Amara Perera', role:'Restaurant Manager · Colombo', stars:5 },
  { quote:'The 360° view is genuinely impressive. Seeing plating, portion size, and garnish before ordering has become a talking point at every meal.', name:'Hiroshi Tanaka', role:'General Manager · Kandy', stars:5 },
  { quote:'Publishing took fifteen minutes. Walk around the dish, upload, done. Our hotel menu now stands out from every competitor in the city.', name:'Priya Wickramasinghe', role:'Head Chef · Galle', stars:5 },
]


/* ══ HOME ══ */
export default function Home() {
  const { user } = useAuth()
  const [c, setC]                       = useState(DEFAULT)
  const [banners, setBanners]           = useState([])
  const [featuredDishes, setFeatured]   = useState([])
  const [liveReviews, setLiveReviews]   = useState([])
  const [featuredVideos, setFeaturedVideos] = useState([])
  const [cuisineGroups, setCuisineGroups] = useState([])
  const [allHotels, setAllHotels]         = useState([])
  const [selectedCuisine, setSelectedCuisine] = useState(null)
  const [activeOffers, setActiveOffers] = useState([])
  const [pageMedia,    setPageMedia]    = useState([])
  const [dishesLoading, setDishLoading] = useState(true)
  const [stats, setStats] = useState([
    { num: '—',    label: 'Hotels onboarded'   },
    { num: '—',    label: 'Dishes in 360°'     },
    { num: '—',    label: 'Guest satisfaction' },
    { num: '360°', label: 'Every single dish'  },
  ])


  useEffect(() => {
    offersApi.list().then(d => setActiveOffers(Array.isArray(d) ? d : [])).catch(() => {})
    pagesApi.get('home').then(d => { setC(d.content); setPageMedia(d.content?.media ?? []) }).catch(() => {})
    pagesApi.get('banners').then(d => {
      const list = d.content?.slides
      if (Array.isArray(list) && list.length > 0) setBanners(list)
    }).catch(() => {})

    socialApi.topReviews().then(d => {
      if (Array.isArray(d.reviews)) setLiveReviews(d.reviews)
    }).catch(() => {})

    socialApi.featuredVideos().then(d => {
      if (Array.isArray(d.videos)) setFeaturedVideos(d.videos)
    }).catch(() => {})

    Promise.all([
      authApi.hotels().catch(() => ({ hotels: [] })),
      dishApi.list().catch(() => []),
    ]).then(([hotelData, dishData]) => {
      const allHotels = hotelData.hotels ?? []
      const allDishes = dishData.dishes ?? dishData ?? []

      const groups = {}
      allHotels.forEach(h => {
        const raw = h.cuisine_type
        const types = Array.isArray(raw) ? raw : (raw ? [raw] : [])
        types.forEach(t => { groups[t] = (groups[t] || 0) + 1 })
      })
      setCuisineGroups(
        Object.entries(groups)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count)
      )
      setAllHotels(allHotels)

      const withVideo = allDishes.filter(d => d.video_path)
      const pool = withVideo.length >= 3 ? withVideo : allDishes
      const shuffled = [...pool].sort(() => Math.random() - 0.5)
      setFeatured(shuffled.slice(0, 3))

      const rated = allDishes.filter(d => Number(d.avg_rating) > 0)
      const avgRating = rated.length > 0
        ? rated.reduce((s, d) => s + Number(d.avg_rating), 0) / rated.length
        : 0
      const satisfaction = avgRating > 0 ? Math.round((avgRating / 5) * 100) : 0

      setStats([
        { num: allHotels.length > 0 ? `${allHotels.length}` : '0',     label: 'Hotels onboarded'   },
        { num: allDishes.length > 0 ? `${allDishes.length}` : '0',     label: 'Dishes in 360°'     },
        { num: satisfaction > 0     ? `${satisfaction}%`    : 'N/A',   label: 'Guest satisfaction' },
        { num: '360°',                                                   label: 'Every single dish'  },
      ])
    }).finally(() => setDishLoading(false))
  }, [])

  const steps = [
    { n: c.step1_num, t: c.step1_title, d: c.step1_desc },
    { n: c.step2_num, t: c.step2_title, d: c.step2_desc },
    { n: c.step3_num, t: c.step3_title, d: c.step3_desc },
  ]

  const [statsRef, statsVisible] = useScrollRevealState()
  const catRef          = useScrollReveal()
  const dishesRef       = useScrollReveal()
  const featuresRef     = useScrollReveal()
  const testimonialsRef = useScrollReveal()
  const ctaRef          = useScrollReveal()
  const cuisineRef      = useScrollIn(cuisineGroups.length > 0)
  const mediaGalleryRef = useScrollIn(pageMedia.length > 0)

  /* Shared link style for section headers */
  const secLinkStyle = { fontFamily:'JetBrains Mono,monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'0.18em', color:'var(--text-3)', textDecoration:'none', transition:'color .2s' }
  const secBtnStyle  = { ...secLinkStyle, background:'none', border:'none', cursor:'pointer', padding:0 }

  /* ── shared dish-card hover helpers ── */
  const dishCardEnter = e => {
    e.currentTarget.style.borderColor = 'rgba(212,150,58,0.5)'
    e.currentTarget.style.transform   = 'translateY(-4px)'
    e.currentTarget.style.boxShadow   = '0 20px 56px rgba(0,0,0,.55)'
    const img = e.currentTarget.querySelector('img')
    if (img) img.style.transform = 'scale(1.05)'
  }
  const dishCardLeave = e => {
    e.currentTarget.style.borderColor = 'rgba(212,150,58,0.2)'
    e.currentTarget.style.transform   = ''
    e.currentTarget.style.boxShadow   = ''
    const img = e.currentTarget.querySelector('img')
    if (img) img.style.transform = 'scale(1)'
  }

  const featuredReview = liveReviews.length > 0
    ? { quote: liveReviews[0].comment, name: liveReviews[0].reviewer_name, role: `On ${liveReviews[0].dish_name}`, stars: liveReviews[0].rating, live: true }
    : TESTIMONIALS[0]

  return (
    <>
      <div className="page" style={{ position:'relative', background:'transparent' }}>

        {/* ══ TOP ACTION BAR ══ */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'center',
          gap:10, flexWrap:'wrap',
          marginBottom:140,
          padding:'10px 18px',
          background:'var(--bg-2)',
          backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
          border:'1px solid var(--border)',
          borderRadius:16,
        }}>
          <ThemeSwitcher />
          <div style={{ width:1, height:20, background:'var(--border)', flexShrink:0 }} />
          <Link to="/menu">
            <button className="btn" style={{ fontSize:14, padding:'11px 24px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              Browse Menu
            </button>
          </Link>
          {!user && <>
            <button
              className="btn btn-ghost"
              style={{ fontSize:14, padding:'11px 22px' }}
              onClick={() => document.getElementById('offers-section')?.scrollIntoView({ behavior:'smooth' })}
            >Offers</button>
            <Link to="/register">
              <button className="btn btn-ghost" style={{ fontSize:14, padding:'11px 22px', background:'var(--glass-amber)', borderColor:'var(--border-hi)', color:'var(--amber)' }}>Sign Up</button>
            </Link>
          </>}
          {user?.role === 'owner' && (
            <Link to="/owner">
              <button className="btn btn-ghost" style={{ fontSize:14, padding:'11px 22px' }}>My Dashboard</button>
            </Link>
          )}
          {(user?.role === 'admin' || user?.role === 'sub_admin') && (
            <Link to="/admin">
              <button className="btn btn-ghost" style={{ fontSize:14, padding:'11px 22px' }}>Admin</button>
            </Link>
          )}
          {user?.role === 'customer' && (
            <Link to="/favorites">
              <button className="btn btn-ghost" style={{ fontSize:14, padding:'11px 22px' }}>Favorites</button>
            </Link>
          )}
        </div>

        {/* ══ BANNER ══ */}
        <BannerSlider banners={banners} />

        {/* ══ DINING BY CUISINE — Vintage Steampunk Panel ══ */}
        {cuisineGroups.length > 0 && (
          <div style={{ marginTop:28, marginBottom:520, position:'relative' }}>
            {/* Outer metal panel */}
            <div style={{
              background:'linear-gradient(160deg,#1e1508 0%,#140e06 55%,#1c1409 100%)',
              border:'3px solid #3c2c16',
              borderRadius:22,
              padding:'36px 24px 24px',
              position:'relative',
              boxShadow:'0 0 0 1px #0c0804, 0 0 0 6px rgba(48,36,16,.5), inset 0 1px 0 rgba(255,255,255,.03), inset 0 -1px 0 rgba(0,0,0,.4), 0 28px 80px rgba(0,0,0,.75)',
            }}>

              {/* Corner star-bolts */}
              {[[12,null,null,12],[12,12,null,null],[null,null,12,12],[null,12,12,null]].map(([t,r,b,l],ci) => (
                <div key={ci} style={{
                  position:'absolute',
                  ...(t!=null?{top:t}:{}), ...(r!=null?{right:r}:{}),
                  ...(b!=null?{bottom:b}:{}), ...(l!=null?{left:l}:{}),
                  width:20, height:20, borderRadius:'50%',
                  background:'radial-gradient(circle at 38% 28%, #6a5438, #1e1208)',
                  border:'2px solid rgba(80,58,28,.9)',
                  boxShadow:'inset 0 2px 5px rgba(0,0,0,.7), 0 1px 0 rgba(200,160,80,.1)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <line x1="5" y1="1" x2="5" y2="9" stroke="rgba(160,120,60,.4)" strokeWidth="1"/>
                    <line x1="1" y1="5" x2="9" y2="5" stroke="rgba(160,120,60,.4)" strokeWidth="1"/>
                    <line x1="2" y1="2" x2="8" y2="8" stroke="rgba(160,120,60,.25)" strokeWidth="1"/>
                    <line x1="8" y1="2" x2="2" y2="8" stroke="rgba(160,120,60,.25)" strokeWidth="1"/>
                  </svg>
                </div>
              ))}

              {/* Panel title */}
              <div style={{ textAlign:'center', marginBottom:28 }}>
                <div style={{ display:'flex', alignItems:'center', gap:16, justifyContent:'center' }}>
                  <div style={{ flex:1, height:1, background:'linear-gradient(to right,transparent,rgba(180,130,50,.5))' }} />
                  <span style={{ fontFamily:'Barlow Condensed,serif', fontSize:22, fontWeight:700, fontStyle:'normal', letterSpacing:'.28em', textTransform:'uppercase', color:'rgba(200,155,70,.75)', whiteSpace:'nowrap' }}>
                    ◆ Dining by Cuisine ◆
                  </span>
                  <div style={{ flex:1, height:1, background:'linear-gradient(to left,transparent,rgba(180,130,50,.5))' }} />
                </div>
              </div>

              {/* Cards grid — padded top for badge overflow */}
              <div style={{
                display:'grid',
                gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',
                gap:18,
                paddingTop:22,
              }}>
                {cuisineGroups.map((g, i) => {
                  const meta = CUISINE_META[g.type] ?? CUISINE_META['Other']
                  return (
                    <Link key={g.type} to={`/menu?cuisine=${encodeURIComponent(g.type)}`}
                      style={{ textDecoration:'none', position:'relative', display:'block' }}>

                      {/* Number badge — floats above card */}
                      <div style={{
                        position:'absolute', top:-20, left:'50%', transform:'translateX(-50%)',
                        zIndex:2,
                        width:38, height:38, borderRadius:'50%',
                        background:'radial-gradient(circle at 38% 28%, #5a3e22, #1e0e04)',
                        border:'2.5px solid #6a4820',
                        boxShadow:'0 4px 14px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.08)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontFamily:'Barlow Condensed,serif', fontWeight:700, fontSize:15,
                        color:'#c8a050', letterSpacing:'0.02em',
                      }}>{i + 1}</div>

                      {/* Card */}
                      <div style={{
                        background:'linear-gradient(160deg,#c8a050 0%,#b88838 30%,#c4a048 60%,#b07830 100%)',
                        border:'2px solid #8a6028',
                        borderRadius:13,
                        padding:'28px 12px 14px',
                        textAlign:'center',
                        position:'relative',
                        overflow:'hidden',
                        boxShadow:'inset 0 2px 0 rgba(255,255,255,.18), inset 0 -2px 6px rgba(0,0,0,.25), 0 6px 20px rgba(0,0,0,.5)',
                        transition:'transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s',
                        cursor:'pointer',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.boxShadow='inset 0 2px 0 rgba(255,255,255,.22), inset 0 -2px 6px rgba(0,0,0,.25), 0 14px 36px rgba(0,0,0,.6)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='inset 0 2px 0 rgba(255,255,255,.18), inset 0 -2px 6px rgba(0,0,0,.25), 0 6px 20px rgba(0,0,0,.5)' }}
                      >
                        {/* Parchment aging spots */}
                        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse 40% 25% at 20% 20%, rgba(100,60,10,.18) 0%,transparent 100%),radial-gradient(ellipse 35% 20% at 80% 75%, rgba(80,40,8,.14) 0%,transparent 100%)', pointerEvents:'none' }} />

                        {/* Tiny corner studs */}
                        {[[5,5],[5,'auto'],[null,5],['auto','auto']].map(([ct,cr],si) => (
                          <div key={si} style={{
                            position:'absolute',
                            top:si<2?5:'auto', bottom:si>=2?5:'auto',
                            left:si%2===0?5:'auto', right:si%2===1?5:'auto',
                            width:7, height:7, borderRadius:'50%',
                            background:'radial-gradient(circle at 35% 28%, #8a6830, #3a2010)',
                            border:'1px solid rgba(80,50,16,.6)',
                            boxShadow:'inset 0 1px 2px rgba(0,0,0,.5)',
                          }} />
                        ))}

                        {/* Emoji illustration */}
                        <div style={{ fontSize:56, lineHeight:1, marginBottom:12, filter:'drop-shadow(0 3px 6px rgba(0,0,0,.35))' }}>
                          {meta.emoji}
                        </div>

                        {/* Name */}
                        <div style={{ fontFamily:'Barlow Condensed,serif', fontWeight:700, fontSize:22, color:'#2a1608', lineHeight:1.2, marginBottom:4 }}>
                          {g.type}
                        </div>
                        <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:16, fontStyle:'normal', color:'rgba(42,22,8,.65)', marginBottom:8 }}>
                          {g.count} {g.count===1?'Restaurant':'Restaurants'}
                        </div>

                        {/* Decorative flourish */}
                        <div style={{ fontSize:12, color:'rgba(100,60,16,.5)', letterSpacing:'.1em' }}>〜❧〜</div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* ── Browse All bar ── */}
              <Link to="/menu" style={{ textDecoration:'none', display:'block', marginTop:26 }}>
                <div style={{
                  background:'linear-gradient(160deg,#2a1e0c,#1a1006,#261c0e)',
                  border:'2px solid #4a3418',
                  borderRadius:14,
                  padding:'14px 24px',
                  display:'flex', alignItems:'center', gap:20,
                  boxShadow:'inset 0 1px 0 rgba(255,255,255,.04), 0 4px 18px rgba(0,0,0,.5)',
                  transition:'background .2s',
                }}
                  onMouseEnter={e=>e.currentTarget.style.background='linear-gradient(160deg,#362812,#221408,#32220e)'}
                  onMouseLeave={e=>e.currentTarget.style.background='linear-gradient(160deg,#2a1e0c,#1a1006,#261c0e)'}
                >
                  {/* Knob */}
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:7, color:'rgba(160,120,60,.6)', textTransform:'uppercase', letterSpacing:'.2em', textAlign:'center', marginBottom:3 }}>ON</div>
                    <div className="h-vintage-knob" style={{
                      width:44, height:44, borderRadius:'50%',
                      background:'radial-gradient(circle at 38% 28%, #504030, #1a1008)',
                      border:'3px solid #3a2c18',
                      boxShadow:'0 0 0 1px rgba(0,0,0,.6), inset 0 2px 6px rgba(0,0,0,.6), 0 4px 12px rgba(0,0,0,.5)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      position:'relative', cursor:'pointer',
                    }}>
                      <div className="h-knob-dot" style={{ width:8, height:8, borderRadius:'50%', background:'#cc3010', boxShadow:'0 0 8px rgba(200,50,16,.8)' }} />
                      <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'repeating-conic-gradient(rgba(255,255,255,.03) 0deg, rgba(255,255,255,.03) 5deg, transparent 5deg, transparent 10deg)' }} />
                    </div>
                    <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:7, color:'rgba(160,120,60,.6)', textTransform:'uppercase', letterSpacing:'.2em', textAlign:'center', marginTop:3 }}>OFF</div>
                  </div>

                  {/* Divider */}
                  <div style={{ width:1, height:44, background:'rgba(100,70,28,.4)', flexShrink:0 }} />

                  {/* Label */}
                  <div style={{ fontFamily:'Barlow Condensed,serif', fontWeight:700, fontSize:'clamp(16px,2.2vw,24px)', letterSpacing:'.18em', color:'rgba(190,145,55,.85)', textTransform:'uppercase', flex:1, textAlign:'center', textShadow:'0 1px 8px rgba(200,150,50,.2)' }}>
                    Browse All Restaurants
                  </div>
                </div>
              </Link>

            </div>
          </div>
        )}

        {/* ══ HOTEL LOGO TICKER ══ */}
        <HotelLogoTicker hotels={allHotels} label="Our restaurants" style={{ marginTop:52 }} />

        {/* ══ DISH TV ══ */}
        <div style={{ marginTop:80 }}>
          <VintageSectionLabel mb={16}>Now Playing</VintageSectionLabel>
          <SlideHeading style={{ fontSize:'clamp(40px,5.5vw,72px)', fontWeight:700, letterSpacing:'0.02em', color:'var(--text)', marginBottom:52 }}>
            Watch dishes come alive.
          </SlideHeading>
          <DishTV videos={featuredVideos} />
        </div>

        {/* ══ CONTENT BENTO (featured dishes + testimonial) ══
            3 columns: [big dish (col 1, rows 1-2)] [dish 2] [review (col 3, rows 1-2)]
                                                    [dish 3]
        */}
        {!dishesLoading && featuredDishes.length > 0 && (
          <div style={{ marginTop:64 }}>
            <VintageSectionLabel mb={20}>Featured Dishes</VintageSectionLabel>

            <div className="h-bento-dishes" style={{ display:'grid', gridTemplateColumns:'1.55fr 1fr 1fr', gridTemplateRows:'270px 270px', gap:14 }}>

              {/* Big dish — col 1, rows 1-2 */}
              {featuredDishes[0] && (
                <Link to={`/dish/${featuredDishes[0].id}`}
                  style={{ gridRow:'1/3', textDecoration:'none', color:'inherit', borderRadius:22, overflow:'hidden', display:'block', border:'1px solid var(--border)', background:'var(--bg-2)', position:'relative', transition:'border-color .3s, transform .35s cubic-bezier(.34,1.56,.64,1), box-shadow .3s' }}
                  onMouseEnter={dishCardEnter} onMouseLeave={dishCardLeave}
                >
                  {featuredDishes[0].video_path
                    ? <video src={imageUrl(featuredDishes[0].video_path)} autoPlay muted loop playsInline style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                    : featuredDishes[0].image_path
                      ? <img src={imageUrl(featuredDishes[0].image_path)} alt={featuredDishes[0].name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform .5s cubic-bezier(.22,1,.36,1)' }} />
                      : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-3)', fontFamily:'JetBrains Mono,monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'.18em' }}>No image</div>
                  }
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,.8) 0%, transparent 55%)' }} />
                  {featuredDishes[0].video_path && (
                    <div style={{ position:'absolute', top:14, left:14, background:'rgba(6,3,1,.78)', backdropFilter:'blur(8px)', border:'1px solid rgba(212,175,80,.35)', borderRadius:20, padding:'3px 10px', fontFamily:'JetBrains Mono,monospace', fontSize:8, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--amber)' }}>360°</div>
                  )}
                  {featuredDishes[0].avg_rating > 0 && (
                    <div style={{ position:'absolute', top:14, right:14, background:'rgba(6,3,1,.78)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,.1)', borderRadius:20, padding:'3px 10px', fontFamily:'JetBrains Mono,monospace', fontSize:8, color:'var(--amber)' }}>
                      ★ {Number(featuredDishes[0].avg_rating).toFixed(1)}
                    </div>
                  )}
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'20px 24px 22px' }}>
                    <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:8, textTransform:'uppercase', letterSpacing:'.22em', color:'rgba(212,150,58,.8)', marginBottom:6 }}>Featured dish</div>
                    <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:24, fontWeight:700, color:'#fff', lineHeight:1.15, marginBottom:8 }}>{featuredDishes[0].name}</div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:8.5, letterSpacing:'.12em', color:'rgba(200,168,126,.7)', textTransform:'uppercase' }}>
                        {featuredDishes[0].hotel_name || ''}
                      </div>
                      <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:17, color:'var(--amber)' }}>LKR {Number(featuredDishes[0].price).toLocaleString()}</div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Dish 2 — col 2, row 1 */}
              {featuredDishes[1] ? (
                <Link to={`/dish/${featuredDishes[1].id}`}
                  style={{ textDecoration:'none', color:'inherit', borderRadius:20, overflow:'hidden', display:'block', border:'1px solid var(--border)', background:'var(--bg-2)', position:'relative', transition:'border-color .3s, transform .35s cubic-bezier(.34,1.56,.64,1), box-shadow .3s' }}
                  onMouseEnter={dishCardEnter} onMouseLeave={dishCardLeave}
                >
                  {featuredDishes[1].video_path
                    ? <video src={imageUrl(featuredDishes[1].video_path)} autoPlay muted loop playsInline style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                    : featuredDishes[1].image_path
                      ? <img src={imageUrl(featuredDishes[1].image_path)} alt={featuredDishes[1].name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform .5s cubic-bezier(.22,1,.36,1)' }} />
                      : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-3)', fontFamily:'JetBrains Mono,monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'.18em' }}>No image</div>
                  }
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,.75) 0%, transparent 60%)' }} />
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'14px 18px 16px' }}>
                    <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:18, fontWeight:700, color:'#fff', lineHeight:1.2, marginBottom:4 }}>{featuredDishes[1].name}</div>
                    <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:14, color:'var(--amber)' }}>LKR {Number(featuredDishes[1].price).toLocaleString()}</div>
                  </div>
                  {featuredDishes[1].video_path && (
                    <div style={{ position:'absolute', top:12, left:12, background:'rgba(6,3,1,.78)', backdropFilter:'blur(8px)', border:'1px solid rgba(212,175,80,.35)', borderRadius:20, padding:'3px 8px', fontFamily:'JetBrains Mono,monospace', fontSize:8, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--amber)' }}>360°</div>
                  )}
                </Link>
              ) : (
                <div style={{ borderRadius:20, background:'var(--glass)', border:'1px solid var(--border)' }} />
              )}

              {/* Testimonial — col 3, rows 1-2 */}
              <div style={{
                gridRow:'1/3',
                borderRadius:20,
                background:'var(--bg-2)', backdropFilter:'blur(18px)',
                border:'1px solid var(--border-mid)',
                padding:'28px 26px',
                display:'flex', flexDirection:'column', justifyContent:'space-between',
              }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                    <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'.26em', color:'var(--amber)' }}>Guest voice</div>
                    <div style={{ display:'flex', gap:2 }}>
                      {Array.from({length:5}).map((_,j) => (
                        <span key={j} style={{ color:j<(featuredReview.stars||5)?'var(--amber)':'rgba(212,150,58,0.2)', fontSize:12 }}>★</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontFamily:'Barlow Condensed,serif', fontStyle:'normal', fontSize:16, color:'var(--text-2)', lineHeight:1.8, marginBottom:24 }}>
                    "{featuredReview.quote}"
                  </div>
                </div>
                <div>
                  <div style={{ width:32, height:1, background:'rgba(212,150,58,0.4)', marginBottom:16 }} />
                  <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:14, fontWeight:500, color:'var(--text)', marginBottom:3 }}>{featuredReview.name}</div>
                  <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:8.5, textTransform:'uppercase', letterSpacing:'.18em', color:'var(--text-3)', marginBottom:20 }}>{featuredReview.role}</div>
                  {liveReviews.length > 1 && (
                    <div style={{ paddingTop:18, borderTop:'1px solid rgba(212,150,58,0.1)', display:'flex', flexDirection:'column', gap:14 }}>
                      {liveReviews.slice(1,3).map((r,i) => (
                        <div key={i}>
                          <div style={{ fontFamily:'Barlow Condensed,serif', fontStyle:'normal', fontSize:12.5, color:'var(--text-3)', lineHeight:1.6, marginBottom:3 }}>
                            "{r.comment.length>80?r.comment.slice(0,80)+'…':r.comment}"
                          </div>
                          <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:8, textTransform:'uppercase', letterSpacing:'.14em', color:'var(--text-3)', opacity:.65 }}>{r.reviewer_name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {liveReviews.length === 0 && TESTIMONIALS.slice(1).map((t,i) => (
                    <div key={i} style={{ paddingTop:i===0?18:14, borderTop:i===0?'1px solid rgba(212,150,58,0.1)':'none' }}>
                      <div style={{ fontFamily:'Barlow Condensed,serif', fontStyle:'normal', fontSize:12.5, color:'var(--text-3)', lineHeight:1.6, marginBottom:3 }}>
                        "{t.quote.length>80?t.quote.slice(0,80)+'…':t.quote}"
                      </div>
                      <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:8, textTransform:'uppercase', letterSpacing:'.14em', color:'var(--text-3)', opacity:.65 }}>{t.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dish 3 — col 2, row 2 */}
              {featuredDishes[2] ? (
                <Link to={`/dish/${featuredDishes[2].id}`}
                  style={{ textDecoration:'none', color:'inherit', borderRadius:20, overflow:'hidden', display:'block', border:'1px solid var(--border)', background:'var(--bg-2)', position:'relative', transition:'border-color .3s, transform .35s cubic-bezier(.34,1.56,.64,1), box-shadow .3s' }}
                  onMouseEnter={dishCardEnter} onMouseLeave={dishCardLeave}
                >
                  {featuredDishes[2].video_path
                    ? <video src={imageUrl(featuredDishes[2].video_path)} autoPlay muted loop playsInline style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                    : featuredDishes[2].image_path
                      ? <img src={imageUrl(featuredDishes[2].image_path)} alt={featuredDishes[2].name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform .5s cubic-bezier(.22,1,.36,1)' }} />
                      : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-3)', fontFamily:'JetBrains Mono,monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'.18em' }}>No image</div>
                  }
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,.75) 0%, transparent 60%)' }} />
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'14px 18px 16px' }}>
                    <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:18, fontWeight:700, color:'#fff', lineHeight:1.2, marginBottom:4 }}>{featuredDishes[2].name}</div>
                    <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:14, color:'var(--amber)' }}>LKR {Number(featuredDishes[2].price).toLocaleString()}</div>
                  </div>
                </Link>
              ) : (
                <Link to="/menu" style={{
                  textDecoration:'none', borderRadius:20,
                  background:'var(--bg-2)', backdropFilter:'blur(16px)',
                  border:'1px solid var(--border)',
                  padding:'28px 24px', display:'flex', flexDirection:'column', justifyContent:'center', gap:10,
                }}>
                  <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'.26em', color:'var(--amber)' }}>All Dishes</div>
                  <div style={{ fontFamily:'Barlow Condensed,serif', fontSize:20, fontWeight:700, color:'var(--text)', lineHeight:1.2 }}>
                    Explore the<br/>full menu →
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ══ HOTEL LOGO TICKER 2 ══ */}
        <HotelLogoTicker hotels={allHotels} label="Featured partners" style={{ marginTop:72 }} reverse />

        {/* ══ PAGE MEDIA GALLERY ══ */}
        {pageMedia.length > 0 && (
          <div style={{ marginTop:72 }} ref={mediaGalleryRef}>
            <VintageSectionLabel mb={16}>Gallery</VintageSectionLabel>
            <SlideHeading style={{ fontSize:'clamp(40px,5.5vw,72px)', fontWeight:700, letterSpacing:'0.02em', color:'var(--text)', marginBottom:52 }}>
              Behind the scenes.
            </SlideHeading>
            <GalleryTV items={pageMedia} />
          </div>
        )}


        {/* ══ OFFERS & SALES ══ */}
        {activeOffers.filter(o => !o.ends_at || new Date(o.ends_at) > new Date()).length > 0 && (
          <div id="offers-section" style={{ marginTop:72 }}>
            <VintageSectionLabel mb={20}>Offers &amp; Deals</VintageSectionLabel>
            <OfferSlider offers={activeOffers.filter(o => !o.ends_at || new Date(o.ends_at) > new Date())} />
          </div>
        )}

        {/* ══ CTA ══ */}
        <div ref={ctaRef} className="sr h-cta-vintage" style={{
          marginTop:72, borderRadius:24,
          border:'1px solid var(--border-hi)',
          padding:'52px 56px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          gap:32, flexWrap:'wrap', position:'relative', overflow:'hidden',
        }}>
          <span style={{ position:'absolute', top:16, left:20, fontFamily:'Barlow Condensed,serif', fontSize:11, color:'rgba(212,150,58,0.3)' }}>◆</span>
          <span style={{ position:'absolute', top:16, right:20, fontFamily:'Barlow Condensed,serif', fontSize:11, color:'rgba(212,150,58,0.3)' }}>◆</span>
          <span style={{ position:'absolute', bottom:16, left:20, fontFamily:'Barlow Condensed,serif', fontSize:11, color:'rgba(212,150,58,0.3)' }}>◆</span>
          <span style={{ position:'absolute', bottom:16, right:20, fontFamily:'Barlow Condensed,serif', fontSize:11, color:'rgba(212,150,58,0.3)' }}>◆</span>
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, textTransform:'uppercase', letterSpacing:'0.26em', color:'var(--amber)', marginBottom:12 }}>For hotel owners</div>
            <div className="h-cta-heading" style={{ fontFamily:'Barlow Condensed, serif', fontWeight:700, fontSize:34, letterSpacing:'0.02em', lineHeight:1.1, color:'var(--text)' }}>
              Put your menu in every{' '}
              <em style={{ fontStyle:'normal', background:'var(--grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>guest's hands.</em>
            </div>
          </div>
          <div className="h-cta-btns" style={{ display:'flex', gap:12, flexShrink:0, position:'relative', zIndex:1 }}>
            <Link to="/register"><button className="btn">List your hotel</button></Link>
            <Link to="/menu"><button className="btn btn-ghost">See live demo</button></Link>
          </div>
        </div>

      </div>
    </>
  )
}
