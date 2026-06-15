import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const GRAIN_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='gn'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23gn)'/%3E%3C/svg%3E")`

;(function injectSharedBgStyles() {
  if (document.getElementById('vbg-css')) return
  const s = document.createElement('style')
  s.id = 'vbg-css'
  s.textContent = `
    .vbg-layer { position:fixed; inset:0; overflow:hidden; pointer-events:none; }
    @keyframes vbg-pan {
      0%   { object-position: 0% center }
      12%  { object-position: 15% center }
      25%  { object-position: 50% center }
      38%  { object-position: 85% center }
      50%  { object-position: 100% center }
      62%  { object-position: 85% center }
      75%  { object-position: 50% center }
      88%  { object-position: 15% center }
      100% { object-position: 0% center }
    }
    .vbg-layer video {
      width:100%; height:100%; object-fit:cover; display:block;
      filter:sepia(0.28) brightness(0.50) saturate(1.15) contrast(1.04);
      animation: vbg-pan 35s linear infinite;
    }
    .vbg-vignette {
      position:fixed; inset:0; pointer-events:none;
      background:
        radial-gradient(ellipse 140% 100% at 50% 45%, rgba(6,3,1,0.22) 0%, rgba(3,1,0,0.78) 100%),
        linear-gradient(180deg, rgba(6,3,1,0.58) 0%, rgba(6,3,1,0.20) 20%, rgba(6,3,1,0.20) 80%, rgba(6,3,1,0.65) 100%);
    }
    .vbg-grain {
      position:fixed; inset:-60px; pointer-events:none;
      opacity:0.28; mix-blend-mode:soft-light;
      background-size:200px 200px;
      animation:vbg-grain-shift 0.18s steps(1) infinite;
    }
    @keyframes vbg-grain-shift {
      0%  { background-position: 0px 0px }
      33% { background-position: -28px 18px }
      66% { background-position: 18px -28px }
    }
  `
  document.head.appendChild(s)
})()

const FADE_MS    = 900   // crossfade duration
const HOLD_MS    = 12000 // how long each video shows before advancing

/* ── single-video mode: cross-fade on prop change ── */
function useSingleVideo(video, playlist) {
  const [curr,   setCurr]   = useState(video)
  const [next,   setNext]   = useState(null)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (playlist) return          // playlist mode handles its own state
    if (video === curr) return
    setNext(video)
    setFading(true)
    const t = setTimeout(() => {
      setCurr(video)
      setNext(null)
      setFading(false)
    }, FADE_MS)
    return () => clearTimeout(t)
  }, [video]) // eslint-disable-line react-hooks/exhaustive-deps

  return { curr, next, fading }
}

/* ── playlist mode: auto-advance with crossfade ── */
function usePlaylist(playlist) {
  const [idx,    setIdx]    = useState(0)
  const [curr,   setCurr]   = useState(playlist?.[0] ?? null)
  const [next,   setNext]   = useState(null)
  const [fading, setFading] = useState(false)
  const timerRef = useRef(null)

  // Reset when the playlist itself changes (route switch)
  const key = playlist?.join(',')
  useEffect(() => {
    if (!playlist?.length) return
    setIdx(0)
    setCurr(playlist[0])
    setNext(null)
    setFading(false)
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance
  useEffect(() => {
    if (!playlist || playlist.length <= 1) return
    timerRef.current = setInterval(() => {
      setIdx(prev => {
        const nextIdx  = (prev + 1) % playlist.length
        const nextSrc  = playlist[nextIdx]
        setNext(nextSrc)
        setFading(true)
        setTimeout(() => {
          setCurr(nextSrc)
          setNext(null)
          setFading(false)
        }, FADE_MS)
        return nextIdx
      })
    }, HOLD_MS)
    return () => clearInterval(timerRef.current)
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  return { curr, next, fading }
}

/* ── component ── */
export default function VintageBackground({ video, playlist }) {
  const single   = useSingleVideo(video, playlist)
  const pl       = usePlaylist(playlist)
  const { curr, next, fading } = playlist ? pl : single

  useLayoutEffect(() => {
    document.body.style.backgroundColor = 'transparent'
    document.documentElement.style.backgroundColor = '#060301'
    document.body.classList.add('vbg-on')
    return () => {
      document.body.style.backgroundColor = ''
      document.documentElement.style.backgroundColor = ''
      document.body.classList.remove('vbg-on')
    }
  }, [])

  return createPortal(
    <>
      {/* Bottom layer — incoming video, preloads while curr fades out */}
      {next && (
        <div className="vbg-layer" style={{ zIndex: -3 }}>
          <video key={next} autoPlay loop muted playsInline>
            <source src={next} type="video/mp4" />
          </video>
        </div>
      )}

      {/* Top layer — current video, fades out during transition */}
      <div
        className="vbg-layer"
        style={{ zIndex: -2, opacity: fading ? 0 : 1, transition: `opacity ${FADE_MS}ms ease-in-out` }}
      >
        <video key={curr} autoPlay loop muted playsInline>
          <source src={curr} type="video/mp4" />
        </video>
      </div>

      <div className="vbg-vignette" style={{ zIndex: -1 }} />
      <div className="vbg-grain" style={{ backgroundImage: GRAIN_BG, zIndex: -1 }} />
    </>,
    document.body
  )
}
