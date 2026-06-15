import { useCallback, useEffect, useRef, useState } from 'react'

const MESSAGES = ['Welcome! ✦', '5-star service!', 'Your table awaits!', 'Right this way! ✧']

function injectStyles() {
  const css = `
    @keyframes blh-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
    @keyframes blh-breathe { 0%,100%{transform:scaleX(1) scaleY(1)} 50%{transform:scaleX(1.016) scaleY(0.984)} }
    @keyframes blh-blink   { 0%,89%,100%{transform:scaleY(1)} 93%{transform:scaleY(0.08)} }
    @keyframes blh-shadow  { 0%,100%{transform:scaleX(1);opacity:.20} 50%{transform:scaleX(.82);opacity:.10} }
    @keyframes blh-wave    { 0%{transform:rotate(0deg)} 25%{transform:rotate(-28deg)} 75%{transform:rotate(14deg)} 100%{transform:rotate(0deg)} }
    @keyframes blh-key     { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(10deg)} }
    @keyframes blh-hat-tip { 0%{transform:rotate(0deg)} 40%{transform:rotate(-10deg) translateX(-3px)} 100%{transform:rotate(0deg)} }
    @keyframes blh-bubble-in  { from{opacity:0;transform:translateX(-50%) scale(.7) translateY(8px)} to{opacity:1;transform:translateX(-50%) scale(1) translateY(0)} }
    @keyframes blh-bubble-out { from{opacity:1;transform:translateX(-50%) scale(1) translateY(0)} to{opacity:0;transform:translateX(-50%) scale(.7) translateY(8px)} }
    .blh-eye-l  { animation: blh-blink 6.2s ease-in-out infinite;      transform-origin: 38px 49px; }
    .blh-eye-r  { animation: blh-blink 6.2s ease-in-out infinite .18s; transform-origin: 62px 49px; }
    .blh-body   { animation: blh-breathe 3.4s ease-in-out infinite;    transform-origin: 50px 105px; }
    .blh-shadow { animation: blh-shadow  4.4s ease-in-out infinite;    transform-origin: 50px 192px; }
    .blh-arm-l  { transform-origin: 26px 79px; }
    .blh-arm-l.wave { animation: blh-wave .62s ease-in-out 3; }
    .blh-key-grp { transform-origin: 74px 115px; animation: blh-key 2.8s ease-in-out infinite; }
    .blh-hat    { transform-origin: 50px 28px; }
    .blh-hat.tip { animation: blh-hat-tip .8s ease-in-out 1; }
    .blh-bub-enter { animation: blh-bubble-in  .35s cubic-bezier(.22,1,.36,1) both; }
    .blh-bub-leave { animation: blh-bubble-out .28s ease-in both; }
  `
  let el = document.getElementById('bellhop-css')
  if (!el) { el = document.createElement('style'); el.id = 'bellhop-css'; document.head.appendChild(el) }
  el.textContent = css
}

export default function HotelBellhop() {
  useEffect(() => { injectStyles() }, [])

  const rootRef   = useRef()
  const msgIdx    = useRef(0)
  const nearTimer = useRef(null)
  const hatRef    = useRef()
  const armRef    = useRef()

  const [pupils,      setPupils]      = useState({ lx: 0, ly: 0, rx: 0, ry: 0 })
  const [wave,        setWave]        = useState(false)
  const [bubbleState, setBubbleState] = useState('hidden')
  const [bubbleMsg,   setBubbleMsg]   = useState(MESSAGES[0])

  const showBubble = useCallback(() => {
    setBubbleMsg(MESSAGES[msgIdx.current % MESSAGES.length])
    msgIdx.current++
    setBubbleState('enter')
    setTimeout(() => setBubbleState('leave'),  3400)
    setTimeout(() => setBubbleState('hidden'), 3750)
  }, [])

  useEffect(() => {
    const onMove = e => {
      const el = rootRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + 50
      const cy = rect.top  + 52
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const MAX = 2.6
      setPupils({
        lx: Math.max(-MAX, Math.min(MAX, dx / 55)),
        ly: Math.max(-MAX, Math.min(MAX, dy / 55)),
        rx: Math.max(-MAX, Math.min(MAX, dx / 55)),
        ry: Math.max(-MAX, Math.min(MAX, dy / 55)),
      })

      if (Math.hypot(dx, dy) < 230 && !nearTimer.current) {
        // wave left arm
        setWave(false)
        requestAnimationFrame(() => setWave(true))
        setTimeout(() => setWave(false), 2000)
        // hat tip
        const hat = hatRef.current
        if (hat) {
          hat.classList.remove('tip')
          void hat.offsetWidth
          hat.classList.add('tip')
          setTimeout(() => hat.classList.remove('tip'), 850)
        }
        showBubble()
        nearTimer.current = setTimeout(() => { nearTimer.current = null }, 2800)
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [showBubble])

  const { lx, ly, rx, ry } = pupils

  return (
    <div ref={rootRef} className="blh-root" style={{
      display: 'block', position: 'fixed', right: 44, bottom: 24, zIndex: 999,
      userSelect: 'none', pointerEvents: 'none',
    }}>
      {/* Speech bubble */}
      {bubbleState !== 'hidden' && (
        <div
          className={bubbleState === 'enter' ? 'blh-bub-enter' : 'blh-bub-leave'}
          style={{
            position: 'absolute', bottom: 'calc(100% + 10px)', left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-3,#12141c)',
            border: '1.5px solid #f59e0b',
            borderRadius: 10, padding: '7px 14px', whiteSpace: 'nowrap',
            fontFamily: 'JetBrains Mono,monospace', fontSize: 11,
            color: 'var(--text,#f5f0eb)', letterSpacing: '0.08em',
          }}
        >
          {bubbleMsg}
          <div style={{
            position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
            borderTop: '7px solid #f59e0b',
          }} />
        </div>
      )}

      {/* Float wrapper */}
      <div style={{ animation: 'blh-float 4.6s ease-in-out infinite' }}>
        <svg viewBox="0 0 100 200" width={104} height={208} overflow="visible">

          {/* Ground shadow */}
          <ellipse className="blh-shadow" cx={50} cy={193} rx={23} ry={5} fill="rgba(0,0,0,.25)" />

          {/* Legs — dark navy */}
          <rect x={36} y={128} width={12} height={54} rx={4} fill="#1a2040" />
          <rect x={52} y={128} width={12} height={54} rx={4} fill="#1a2040" />
          {/* Trouser seam highlight */}
          <rect x={39} y={132} width={2} height={46} rx={1} fill="rgba(255,255,255,.06)" />
          <rect x={55} y={132} width={2} height={46} rx={1} fill="rgba(255,255,255,.06)" />
          {/* Trouser piping (gold stripe) */}
          <rect x={47} y={128} width={2}  height={54} rx={1} fill="#b8960c" opacity={.45} />
          <rect x={51} y={128} width={2}  height={54} rx={1} fill="#b8960c" opacity={.45} />
          {/* Shoes */}
          <ellipse cx={42} cy={183} rx={10} ry={5}  fill="#1a1a2a" />
          <ellipse cx={58} cy={183} rx={10} ry={5}  fill="#1a1a2a" />
          <ellipse cx={39} cy={180} rx={3.5} ry={2} fill="rgba(255,255,255,.12)" />
          <ellipse cx={55} cy={180} rx={3.5} ry={2} fill="rgba(255,255,255,.12)" />

          {/* Body — red uniform jacket (breathe) */}
          <g className="blh-body">
            {/* Jacket base */}
            <rect x={26} y={74} width={48} height={58} rx={8} fill="#c0291e" />
            {/* Center panel (darker red) */}
            <rect x={44} y={76} width={12} height={54} rx={2} fill="#a82215" />
            {/* White shirt visible at collar */}
            <rect x={46} y={72} width={8}  height={8}  rx={2} fill="#f0f0ee" />
            {/* Gold center buttons */}
            <circle cx={50} cy={ 92} r={2.4} fill="#d4a017" />
            <circle cx={50} cy={103} r={2.4} fill="#d4a017" />
            <circle cx={50} cy={114} r={2.4} fill="#d4a017" />
            <circle cx={50} cy={125} r={2.4} fill="#d4a017" />
            {/* Gold shoulder epaulettes */}
            <rect x={26} y={74} width={14} height={5}  rx={2} fill="#d4a017" />
            <rect x={60} y={74} width={14} height={5}  rx={2} fill="#d4a017" />
            {/* Epaulette fringe lines */}
            <line x1={27} y1={79} x2={27} y2={84} stroke="#d4a017" strokeWidth={1.2} />
            <line x1={30} y1={79} x2={30} y2={85} stroke="#d4a017" strokeWidth={1.2} />
            <line x1={33} y1={79} x2={33} y2={84} stroke="#d4a017" strokeWidth={1.2} />
            <line x1={36} y1={79} x2={36} y2={83} stroke="#d4a017" strokeWidth={1.2} />
            <line x1={64} y1={79} x2={64} y2={83} stroke="#d4a017" strokeWidth={1.2} />
            <line x1={67} y1={79} x2={67} y2={85} stroke="#d4a017" strokeWidth={1.2} />
            <line x1={70} y1={79} x2={70} y2={84} stroke="#d4a017" strokeWidth={1.2} />
            <line x1={73} y1={79} x2={73} y2={83} stroke="#d4a017" strokeWidth={1.2} />
            {/* Gold chest braiding */}
            <path d="M44 88 Q39 90 38 96" stroke="#d4a017" strokeWidth={1.2} fill="none" strokeLinecap="round" />
            <path d="M44 93 Q40 95 39 101" stroke="#d4a017" strokeWidth={1.2} fill="none" strokeLinecap="round" />
            <path d="M56 88 Q61 90 62 96" stroke="#d4a017" strokeWidth={1.2} fill="none" strokeLinecap="round" />
            <path d="M56 93 Q60 95 61 101" stroke="#d4a017" strokeWidth={1.2} fill="none" strokeLinecap="round" />
            {/* Hem cuff */}
            <rect x={26} y={128} width={48} height={5} rx={3} fill="#a82215" />
            <rect x={26} y={128} width={48} height={3} rx={2} fill="#d4a017" opacity={.55} />
          </g>

          {/* Left arm — waves */}
          <g ref={armRef} className={`blh-arm-l${wave ? ' wave' : ''}`}>
            {/* Upper sleeve */}
            <rect x={14} y={79}  width={12} height={35} rx={5} fill="#c0291e" />
            {/* Gold cuff */}
            <rect x={14} y={111} width={12} height={5}  rx={2} fill="#d4a017" />
            {/* Forearm skin */}
            <rect x={15} y={116} width={10} height={15} rx={4} fill="#dba882" />
            {/* Hand — open wave */}
            <ellipse cx={20} cy={133} rx={6}   ry={4.5} fill="#dba882" />
            <line x1={17} y1={130} x2={15} y2={125} stroke="#dba882" strokeWidth={3} strokeLinecap="round" />
            <line x1={20} y1={129} x2={19} y2={124} stroke="#dba882" strokeWidth={3} strokeLinecap="round" />
            <line x1={23} y1={130} x2={23} y2={125} stroke="#dba882" strokeWidth={3} strokeLinecap="round" />
          </g>

          {/* Right arm — holding hotel key (idle sway) */}
          <g>
            {/* Upper sleeve */}
            <rect x={74} y={79}  width={12} height={35} rx={5} fill="#c0291e" />
            {/* Gold cuff */}
            <rect x={74} y={111} width={12} height={5}  rx={2} fill="#d4a017" />
            {/* Forearm skin */}
            <rect x={75} y={116} width={10} height={15} rx={4} fill="#dba882" />
            {/* Hand */}
            <ellipse cx={80} cy={133} rx={5.5} ry={4} fill="#dba882" />
            {/* Hotel key — large ornate key */}
            <g className="blh-key-grp">
              {/* Key bow (circular bow) */}
              <circle cx={80} cy={110} r={8}   fill="none" stroke="#d4a017" strokeWidth={3} />
              <circle cx={80} cy={110} r={4.5} fill="none" stroke="#d4a017" strokeWidth={2} />
              <circle cx={80} cy={110} r={2}   fill="#d4a017" />
              {/* Key shaft */}
              <rect x={78.5} y={118} width={3}  height={22} rx={1} fill="#d4a017" />
              {/* Key teeth */}
              <rect x={81.5} y={128} width={4}  height={3}  rx={1} fill="#d4a017" />
              <rect x={81.5} y={134} width={3}  height={2.5} rx={.8} fill="#d4a017" />
              <rect x={81.5} y={139} width={4.5} height={2}  rx={.8} fill="#d4a017" />
              {/* Shine on key */}
              <line x1={76} y1={105} x2={74} y2={103} stroke="rgba(255,255,255,.35)" strokeWidth={1.5} strokeLinecap="round" />
            </g>
          </g>

          {/* Neck */}
          <rect x={44} y={66} width={12} height={12} rx={3} fill="#dba882" />

          {/* Head */}
          <circle cx={50} cy={52} r={17} fill="#dba882" />
          <circle cx={50} cy={56} r={14} fill="#ca9070" opacity={.22} />
          {/* Ears */}
          <ellipse cx={33} cy={52} rx={4}   ry={5}   fill="#dba882" />
          <ellipse cx={67} cy={52} rx={4}   ry={5}   fill="#dba882" />
          <ellipse cx={33} cy={52} rx={2.5} ry={3.5} fill="#b87858" opacity={.38} />
          <ellipse cx={67} cy={52} rx={2.5} ry={3.5} fill="#b87858" opacity={.38} />

          {/* Eyebrows */}
          <path d="M33 43 Q38 40 43 43" stroke="#5c3a1e" strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d="M57 43 Q62 40 67 43" stroke="#5c3a1e" strokeWidth={2} fill="none" strokeLinecap="round" />

          {/* Left eye */}
          <g className="blh-eye-l">
            <circle cx={38} cy={49} r={5.5} fill="white" />
            <circle cx={38 + lx} cy={49 + ly} r={3.2} fill="#2a1808" />
            <circle cx={39 + lx} cy={48 + ly} r={1.2} fill="white" />
          </g>
          {/* Right eye */}
          <g className="blh-eye-r">
            <circle cx={62} cy={49} r={5.5} fill="white" />
            <circle cx={62 + rx} cy={49 + ry} r={3.2} fill="#2a1808" />
            <circle cx={63 + rx} cy={48 + ry} r={1.2} fill="white" />
          </g>

          {/* Nose */}
          <ellipse cx={50} cy={55} rx={3}   ry={2}   fill="#b87858" />
          <circle  cx={48.5} cy={56.5} r={1} fill="#a06848" />
          <circle  cx={51.5} cy={56.5} r={1} fill="#a06848" />

          {/* Warm smile */}
          <path d="M42 61 Q50 68 58 61" stroke="#5c3a1e" strokeWidth={1.8} fill="rgba(255,255,255,.65)" strokeLinecap="round" />
          {/* Cheek blush */}
          <ellipse cx={34} cy={58} rx={5} ry={3} fill="#e08070" opacity={.20} />
          <ellipse cx={66} cy={58} rx={5} ry={3} fill="#e08070" opacity={.20} />

          {/* ── Pillbox hat ── */}
          <g ref={hatRef} className="blh-hat">
            {/* Hat brim / base */}
            <ellipse cx={50} cy={36} rx={20} ry={3.5} fill="#a82215" />
            {/* Flat cylinder */}
            <rect x={31} y={16} width={38} height={20} rx={2} fill="#c0291e" />
            {/* Hat top */}
            <ellipse cx={50} cy={16} rx={19} ry={3.5} fill="#a82215" />
            {/* Gold hat band */}
            <rect x={31} y={32} width={38} height={5} rx={1} fill="#d4a017" />
            {/* Hat band detail lines */}
            <line x1={35} y1={32} x2={35} y2={37} stroke="#b8960c" strokeWidth={.8} />
            <line x1={42} y1={32} x2={42} y2={37} stroke="#b8960c" strokeWidth={.8} />
            <line x1={50} y1={32} x2={50} y2={37} stroke="#b8960c" strokeWidth={.8} />
            <line x1={58} y1={32} x2={58} y2={37} stroke="#b8960c" strokeWidth={.8} />
            <line x1={65} y1={32} x2={65} y2={37} stroke="#b8960c" strokeWidth={.8} />
            {/* Gold star badge on front */}
            <text x={50} y={28} textAnchor="middle"
              style={{ fontFamily: 'serif', fontSize: 10, fill: '#d4a017', fontWeight: 700 }}>
              ★
            </text>
            {/* Chin strap line (subtle) */}
            <path d="M31 37 Q32 44 33 52" stroke="#d4a017" strokeWidth={.8} fill="none" opacity={.5} />
            <path d="M69 37 Q68 44 67 52" stroke="#d4a017" strokeWidth={.8} fill="none" opacity={.5} />
          </g>

        </svg>
      </div>
    </div>
  )
}
