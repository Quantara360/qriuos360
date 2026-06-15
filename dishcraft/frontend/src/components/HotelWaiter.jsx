import { useEffect, useRef, useState } from 'react'

;(function injectWaiterStyles() {
  let s = document.getElementById('waiter-css')
  if (!s) { s = document.createElement('style'); s.id = 'waiter-css'; document.head.appendChild(s) }
  s.textContent = `
    @keyframes wtr-float   { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-9px)} }
    @keyframes wtr-breathe { 0%,100%{transform:scaleY(1) scaleX(1)} 50%{transform:scaleY(1.018) scaleX(.99)} }
    @keyframes wtr-blink   { 0%,87%,100%{transform:scaleY(1)} 93%{transform:scaleY(0.07)} }
    @keyframes wtr-wave    { 0%,100%{transform:rotate(0deg)} 20%{transform:rotate(-58deg)} 40%{transform:rotate(-18deg)} 60%{transform:rotate(-52deg)} 80%{transform:rotate(-12deg)} }
    @keyframes wtr-tray    { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(1.8deg)} }
    @keyframes wtr-shadow  { 0%,100%{transform:scaleX(1) scaleY(1)} 50%{transform:scaleX(.82) scaleY(.8)} }
    @keyframes wtr-bubble-in  { from{opacity:0;transform:translateX(-50%) scale(.7) translateY(8px)} to{opacity:1;transform:translateX(-50%) scale(1) translateY(0)} }
    @keyframes wtr-bubble-out { from{opacity:1;transform:translateX(-50%) scale(1)} to{opacity:0;transform:translateX(-50%) scale(.85) translateY(-4px)} }
    @keyframes wtr-hat-tip { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-10deg)} }
    @keyframes wtr-tail    { 0%,100%{transform:scaleX(1)} 100%{} }

    .wtr-root {
      position: fixed;
      bottom: 28px;
      right: 52px;
      z-index: 100;
      pointer-events: none;
      user-select: none;
      filter: drop-shadow(0 14px 32px rgba(0,0,0,.5));
      animation: wtr-float 4.8s ease-in-out infinite;
    }
    .wtr-body   { animation: wtr-breathe 3.5s ease-in-out infinite; transform-origin: 50px 175px; }
    .wtr-eye-l  { animation: wtr-blink 5.5s ease-in-out infinite;       transform-origin: 40px 49px; }
    .wtr-eye-r  { animation: wtr-blink 5.5s ease-in-out infinite .18s;  transform-origin: 61px 49px; }
    .wtr-tray   { animation: wtr-tray 2.5s ease-in-out infinite;         transform-origin: 86px 53px; }
    .wtr-shadow { animation: wtr-shadow 4.8s ease-in-out infinite;       transform-origin: 50px 197px; }
    .wtr-arm-l  { transform-origin: 33px 77px; }
    .wtr-arm-l.wave { animation: wtr-wave .65s ease-in-out 3 forwards; }
    .wtr-hat    { transform-origin: 50px 33px; }
    .wtr-hat.tip{ animation: wtr-hat-tip .5s ease-in-out 1 forwards; }
    .wtr-bubble {
      position: absolute;
      bottom: calc(100% + 10px);
      left: 50%;
      transform: translateX(-50%);
      background: rgba(14,13,22,.96);
      border: 1px solid rgba(212,150,58,.45);
      border-radius: 14px;
      padding: 9px 16px 9px 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      letter-spacing: .12em;
      color: #d4963a;
      white-space: nowrap;
      box-shadow: 0 6px 24px rgba(0,0,0,.5);
      pointer-events: none;
    }
    .wtr-bubble.enter { animation: wtr-bubble-in  .38s cubic-bezier(.34,1.56,.64,1) both; }
    .wtr-bubble.leave { animation: wtr-bubble-out .28s ease-in both; }
    .wtr-bubble-tail {
      position: absolute;
      bottom: -7px; left: 50%; transform: translateX(-50%);
      width: 0; height: 0;
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-top: 7px solid rgba(212,150,58,.45);
    }
    .wtr-bubble-tail-inner {
      position: absolute;
      bottom: -6px; left: 50%; transform: translateX(-50%);
      width: 0; height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid rgba(14,13,22,.96);
    }

  `
})()

const MESSAGES = ['Welcome!  ✦', 'Hello there!', 'Bon appétit!', 'Enjoy! ★']

export default function HotelWaiter() {
  const rootRef   = useRef(null)
  const [pupils,  setPupils]  = useState({ lx: 0, ly: 0, rx: 0, ry: 0 })
  const [headRot, setHeadRot] = useState(0)
  const [wave,    setWave]    = useState(false)
  const [hatTip,  setHatTip]  = useState(false)
  const [bubbleState, setBubbleState] = useState('hidden') // hidden | enter | leave
  const [bubbleMsg,   setBubbleMsg]   = useState(MESSAGES[0])
  const msgIdx    = useRef(0)
  const prevNear  = useRef(false)
  const waveTimer = useRef(null)
  const hideTimer = useRef(null)
  const leaveTimer= useRef(null)

  useEffect(() => {
    const onMove = (e) => {
      if (!rootRef.current) return
      const rect  = rootRef.current.getBoundingClientRect()
      const scale = rect.width / 100
      // Head center in screen coords (SVG head at cx=50, cy=49)
      const hx = rect.left + 50 * scale
      const hy = rect.top  + 49 * scale

      const dx   = e.clientX - hx
      const dy   = e.clientY - hy
      const dist = Math.hypot(dx, dy)
      const MAX  = 2.8
      const nx   = (dx / Math.max(dist, 1)) * MAX
      const ny   = (dy / Math.max(dist, 1)) * MAX

      setPupils({ lx: nx, ly: ny, rx: nx, ry: ny })
      setHeadRot(Math.max(-12, Math.min(12, dx / 22)))

      const near = dist < 240
      if (near && !prevNear.current) {
        // New approach — pick next greeting
        msgIdx.current = (msgIdx.current + 1) % MESSAGES.length
        setBubbleMsg(MESSAGES[msgIdx.current])

        clearTimeout(waveTimer.current)
        clearTimeout(hideTimer.current)
        clearTimeout(leaveTimer.current)

        setWave(true)
        setHatTip(true)
        setBubbleState('enter')

        waveTimer.current = setTimeout(() => setWave(false), 2100)
        hideTimer.current = setTimeout(() => {
          setBubbleState('leave')
          leaveTimer.current = setTimeout(() => setBubbleState('hidden'), 320)
        }, 3800)
        setTimeout(() => setHatTip(false), 700)
      }
      prevNear.current = near
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const lx = pupils.lx, ly = pupils.ly
  const rx = pupils.rx, ry = pupils.ry
  const hr = headRot.toFixed(2)

  return (
    <div ref={rootRef} className="wtr-root" style={{ display: 'block', width: 108, height: 216 }}>

      {bubbleState !== 'hidden' && (
        <div className={`wtr-bubble ${bubbleState}`}>
          {bubbleMsg}
          <div className="wtr-bubble-tail" />
          <div className="wtr-bubble-tail-inner" />
        </div>
      )}

      <svg viewBox="0 0 100 200" width="108" height="216" xmlns="http://www.w3.org/2000/svg" overflow="visible">

        {/* ── Ground shadow ── */}
        <ellipse className="wtr-shadow" cx="50" cy="197" rx="27" ry="4.5" fill="rgba(0,0,0,.28)" />

        <g className="wtr-body">

          {/* ════ LEGS ════ */}
          <rect x="35" y="129" width="13" height="54" rx="5.5" fill="#191930" />
          <rect x="52" y="129" width="13" height="54" rx="5.5" fill="#191930" />
          {/* Trouser crease */}
          <line x1="41.5" y1="129" x2="41.5" y2="183" stroke="#101025" strokeWidth=".9" />
          <line x1="58.5" y1="129" x2="58.5" y2="183" stroke="#101025" strokeWidth=".9" />
          {/* Shoes */}
          <ellipse cx="38"  cy="184" rx="13" ry="5.5" fill="#0c0c1c" />
          <ellipse cx="59"  cy="184" rx="13" ry="5.5" fill="#0c0c1c" />
          {/* Shoe shine highlight */}
          <ellipse cx="35"  cy="181" rx="5"  ry="2"   fill="rgba(255,255,255,.07)" />
          <ellipse cx="56"  cy="181" rx="5"  ry="2"   fill="rgba(255,255,255,.07)" />

          {/* ════ JACKET / TORSO ════ */}
          {/* Main jacket */}
          <rect x="26" y="68" width="48" height="65" rx="8" fill="#1d2248" />
          {/* White shirt strip */}
          <rect x="44" y="68" width="12" height="55" fill="#f2eeea" rx="1.5" />
          {/* Left lapel */}
          <polygon points="44,68 26,68 35,97" fill="#242758" />
          {/* Right lapel */}
          <polygon points="56,68 74,68 65,97" fill="#242758" />
          {/* Lapel stitch lines */}
          <line x1="44" y1="68" x2="35" y2="97" stroke="#1d2248" strokeWidth=".6" />
          <line x1="56" y1="68" x2="65" y2="97" stroke="#1d2248" strokeWidth=".6" />
          {/* Pocket square */}
          <rect x="28" y="78" width="8" height="7" rx="1.5" fill="#d4963a" opacity=".9" />
          <polygon points="28,78 36,78 34,73" fill="#e8aa54" opacity=".85" />
          {/* Bow tie */}
          <g transform="translate(50,75)">
            <polygon points="-9,-5 -2,0 -9,5" fill="#d4963a" />
            <polygon points="9,-5 2,0 9,5" fill="#d4963a" />
            <circle r="3.2" fill="#b8791e" />
            <circle r="1.3" fill="#d4963a" />
          </g>
          {/* Shirt buttons */}
          <circle cx="50" cy="93"  r="1.8" fill="#d4963a" />
          <circle cx="50" cy="103" r="1.8" fill="#d4963a" />
          <circle cx="50" cy="113" r="1.8" fill="#d4963a" />
          {/* Hem band */}
          <rect x="26" y="129" width="48" height="4" rx="2" fill="#242758" />
          {/* Medal / badge */}
          <circle cx="66" cy="83" r="4.5" fill="#c0a050" />
          <circle cx="66" cy="83" r="3.2" fill="#d4b468" />
          <text x="66" y="84.5" textAnchor="middle" fontSize="4" fill="#1a1a30" fontWeight="bold" fontFamily="serif">★</text>

          {/* ════ LEFT ARM (waving) ════ */}
          <g className={`wtr-arm-l${wave ? ' wave' : ''}`}>
            {/* Upper arm — jacket */}
            <rect x="26" y="76" width="13" height="40" rx="6.5" fill="#1d2248" />
            {/* Forearm — skin */}
            <rect x="26" y="112" width="13" height="24" rx="6.5" fill="#c8855a" />
            {/* Hand */}
            <ellipse cx="32.5" cy="136" rx="7" ry="5" fill="#be7848" />
            {/* Knuckle hint */}
            <ellipse cx="29" cy="134" rx="1.8" ry="1.2" fill="#a86840" />
            <ellipse cx="33" cy="135" rx="1.8" ry="1.2" fill="#a86840" />
            <ellipse cx="37" cy="134" rx="1.8" ry="1.2" fill="#a86840" />
          </g>

          {/* ════ RIGHT ARM (tray) ════ */}
          <g>
            {/* Upper arm — jacket */}
            <rect x="61" y="74" width="13" height="32" rx="6.5" fill="#1d2248" transform="rotate(-28 61 74)" />
            {/* Forearm — skin */}
            <rect x="71" y="60" width="13" height="28" rx="6.5" fill="#c8855a" transform="rotate(-6 71 60)" />
            {/* Hand / palm */}
            <ellipse cx="81" cy="57" rx="8" ry="5.5" fill="#be7848" />
          </g>

          {/* ════ TRAY + FOOD ════ */}
          <g className="wtr-tray">
            {/* Tray outer */}
            <ellipse cx="86" cy="53" rx="19" ry="4.8" fill="#a88840" />
            {/* Tray top surface */}
            <ellipse cx="86" cy="51.5" rx="18" ry="4" fill="#c4a056" />
            <ellipse cx="86" cy="50.5" rx="16" ry="3.2" fill="#d8b468" />
            {/* Plate */}
            <ellipse cx="86" cy="49.5" rx="10" ry="2.8" fill="#f5f0ea" />
            <ellipse cx="86" cy="49"   rx="8.5" ry="2.2" fill="#faf7f3" />
            {/* Food */}
            <ellipse cx="86" cy="48"   rx="6.5" ry="1.8" fill="#e09060" />
            <ellipse cx="86" cy="47.2" rx="4"   ry="1.3" fill="#c87040" />
            <circle  cx="84.5" cy="46.5" r="1.2" fill="#4a8c5c" />
            <circle  cx="87"   cy="46.3" r=".9"  fill="#6aac7c" />
            <circle  cx="85.5" cy="45.8" r=".6"  fill="#3a7c4c" />
            {/* Cloche dome */}
            <path d="M76,49.5 Q86,33 96,49.5" fill="rgba(200,210,230,.12)" stroke="rgba(220,230,250,.45)" strokeWidth=".9" />
            {/* Dome knob */}
            <circle cx="86" cy="33.5" r="2" fill="rgba(220,230,250,.55)" />
            {/* Tray rim edge */}
            <ellipse cx="86" cy="54" rx="19" ry="2" fill="rgba(0,0,0,.15)" />
          </g>

          {/* ════ NECK ════ */}
          <rect x="43" y="62" width="14" height="11" rx="5" fill="#c8855a" />
          {/* Collar points */}
          <polygon points="43,70 50,74 57,70 50,68" fill="#f2eeea" />

          {/* ════ HEAD ════ */}
          <g transform={`rotate(${hr}, 50, 49)`}>

            {/* Face base */}
            <circle cx="50" cy="49" r="27" fill="#d4956a" />

            {/* ── Hair ── */}
            <path d="M23,45 Q24,20 50,18 Q76,20 77,45 Q73,30 50,27 Q27,30 23,45Z" fill="#2d1f0e" />
            {/* Side hair */}
            <path d="M23,45 Q21,52 24,55 Q23,46 26,42Z" fill="#2d1f0e" />
            <path d="M77,45 Q79,52 76,55 Q77,46 74,42Z" fill="#2d1f0e" />

            {/* ── Concierge hat ── */}
            <g className={`wtr-hat${hatTip ? ' tip' : ''}`}>
              {/* Hat brim */}
              <rect x="22" y="31" width="56" height="5.5" rx="2.8" fill="#191930" />
              {/* Hat cylinder */}
              <rect x="26" y="14" width="48" height="20" rx="2.5" fill="#1d2248" />
              {/* Hat seam top */}
              <rect x="26" y="14" width="48" height="2" rx="1" fill="#242760" />
              {/* Hat band */}
              <rect x="26" y="27" width="48" height="6" fill="#d4963a" />
              {/* Hat badge */}
              <circle cx="50" cy="30" r="4.2" fill="#c0a050" />
              <circle cx="50" cy="30" r="2.8" fill="#d4b468" />
              <text x="50" y="31.6" textAnchor="middle" fontSize="4.5" fill="#1a1a30" fontWeight="bold" fontFamily="serif">★</text>
              {/* Hat highlight */}
              <rect x="28" y="15" width="20" height="3" rx="1.5" fill="rgba(255,255,255,.06)" />
            </g>

            {/* Ears */}
            <ellipse cx="23" cy="51" rx="5"   ry="6.5" fill="#c8805e" />
            <ellipse cx="77" cy="51" rx="5"   ry="6.5" fill="#c8805e" />
            <ellipse cx="23" cy="51" rx="2.8" ry="4.2" fill="#b87050" />
            <ellipse cx="77" cy="51" rx="2.8" ry="4.2" fill="#b87050" />

            {/* ── Eyebrows ── */}
            <path d="M33,41 Q40,37.5 47,40" stroke="#2d1f0e" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path d="M53,40 Q60,37.5 67,41" stroke="#2d1f0e" strokeWidth="2.2" fill="none" strokeLinecap="round" />

            {/* ── Left eye ── */}
            <g className="wtr-eye-l">
              <circle cx="40" cy="49" r="6"   fill="white" />
              <circle cx="40" cy="49" r="5.5" fill="white" />
              {/* Iris */}
              <circle cx={40 + lx} cy={49 + ly} r="3.5" fill="#1c120a" />
              {/* Pupil shine */}
              <circle cx={40 + lx + 1.2} cy={49 + ly - 1.2} r="1.2" fill="rgba(255,255,255,.75)" />
              <circle cx={40 + lx - 0.8} cy={49 + ly + 0.8} r=".5"  fill="rgba(255,255,255,.3)" />
              {/* Eyelid crease */}
              <path d={`M34.5,46 Q40,43.5 45.5,46`} stroke="rgba(0,0,0,.12)" strokeWidth=".8" fill="none" />
            </g>

            {/* ── Right eye ── */}
            <g className="wtr-eye-r">
              <circle cx="61" cy="49" r="6"   fill="white" />
              <circle cx="61" cy="49" r="5.5" fill="white" />
              <circle cx={61 + rx} cy={49 + ry} r="3.5" fill="#1c120a" />
              <circle cx={61 + rx + 1.2} cy={49 + ry - 1.2} r="1.2" fill="rgba(255,255,255,.75)" />
              <circle cx={61 + rx - 0.8} cy={49 + ry + 0.8} r=".5"  fill="rgba(255,255,255,.3)" />
              <path d={`M55.5,46 Q61,43.5 66.5,46`} stroke="rgba(0,0,0,.12)" strokeWidth=".8" fill="none" />
            </g>

            {/* ── Nose ── */}
            <ellipse cx="50" cy="57" rx="3.2" ry="2.5" fill="#b87050" />
            <circle  cx="48.2" cy="57.8" r="1.2" fill="#a06040" />
            <circle  cx="51.8" cy="57.8" r="1.2" fill="#a06040" />

            {/* ── Smile ── */}
            <path d="M39,64 Q50,75 61,64" stroke="#7a3e2a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            {/* Teeth */}
            <path d="M42,64 Q50,71 58,64" fill="rgba(255,255,255,.38)" />
            {/* Dimples */}
            <circle cx="36" cy="61" r="2.5" fill="rgba(190,80,60,.15)" />
            <circle cx="64" cy="61" r="2.5" fill="rgba(190,80,60,.15)" />
            {/* Cheek blush */}
            <ellipse cx="31" cy="58" rx="7" ry="4.5" fill="rgba(220,100,80,.16)" />
            <ellipse cx="69" cy="58" rx="7" ry="4.5" fill="rgba(220,100,80,.16)" />

          </g>{/* end head */}
        </g>{/* end body */}
      </svg>
    </div>
  )
}
