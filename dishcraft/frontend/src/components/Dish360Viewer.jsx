import { useEffect, useRef, useState, useCallback } from 'react'

;(function () {
  if (document.getElementById('v360-css')) return
  const s = document.createElement('style')
  s.id = 'v360-css'
  s.textContent = `
    @keyframes v360-spin   { to { transform:rotate(360deg) } }
    @keyframes v360-fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes v360-pulse  { 0%,100%{opacity:.2} 50%{opacity:.62} }
  `
  document.head.appendChild(s)
})()

const FW = 960, FH = 540
const HAS_VFC = typeof HTMLVideoElement !== 'undefined' &&
                'requestVideoFrameCallback' in HTMLVideoElement.prototype

async function captureVFC(video) {
  return new Promise(resolve => {
    const off = document.createElement('canvas')
    off.width = FW; off.height = FH
    const ctx = off.getContext('2d')
    const STEP = 0.10
    const frames = [], jobs = []
    let lastT = -99, realDur = 0, finished = false

    const finish = () => {
      if (finished) return
      finished = true
      video.pause()
      video.playbackRate = 1
      video.currentTime = 0
      Promise.all(jobs).then(() => resolve({ frames: frames.filter(Boolean), dur: realDur }))
    }

    video.addEventListener('ended', finish, { once: true })

    const tick = (_, { mediaTime }) => {
      if (finished) return
      realDur = Math.max(realDur, mediaTime)
      if (mediaTime - lastT >= STEP) {
        lastT = mediaTime
        ctx.drawImage(video, 0, 0, FW, FH)
        const i = frames.length
        frames.push(null)
        jobs.push(createImageBitmap(off).then(bm => { frames[i] = bm }).catch(() => {}))
      }
      video.requestVideoFrameCallback(tick)
    }

    video.currentTime = 0
    video.playbackRate = 16
    video.requestVideoFrameCallback(tick)
    video.play().catch(() => resolve({ frames: [], dur: 0 }))
  })
}

async function captureSeek(video, dur, onProgress, isCancelled) {
  const off = document.createElement('canvas')
  off.width = FW; off.height = FH
  const ctx = off.getContext('2d')
  const N = 36, frames = []
  for (let i = 0; i < N; i++) {
    if (isCancelled()) break
    const t = (i / (N - 1)) * Math.max(0, dur - 0.05)
    await new Promise(res => {
      video.addEventListener('seeked', function done() {
        video.removeEventListener('seeked', done)
        ctx.drawImage(video, 0, 0, FW, FH)
        createImageBitmap(off).then(bm => { frames[i] = bm; res() }).catch(res)
      })
      video.currentTime = t
    })
    onProgress((i + 1) / N)
  }
  return frames.filter(Boolean)
}

export default function Dish360Viewer({ src, poster, style = {}, className = '' }) {
  const containerRef = useRef()
  const videoRef     = useRef()
  const canvasRef    = useRef()
  const ctxRef       = useRef(null)

  const durRef       = useRef(0)
  const blobUrlRef   = useRef(null)
  const hintTimer    = useRef()

  const framesRef    = useRef([])
  const frameModeRef = useRef(false)

  // Scrub state — all refs, zero React overhead
  const targetRef    = useRef(null)   // null = not hovering
  const currentRef   = useRef(0)      // 0–1 scrub position
  const velRef       = useRef(0)
  const rafRef       = useRef(null)
  const hoveringRef  = useRef(false)

  // DOM refs for imperative updates (no state re-renders for these)
  const progressRef  = useRef()
  const degreeRef    = useRef()
  const lineRef      = useRef()

  const [videoSrc,  setVideoSrc]  = useState('')
  const [status,    setStatus]    = useState('loading')
  const [capProg,   setCapProg]   = useState(0)
  const [showHint,  setShowHint]  = useState(false)
  const [isActive,  setIsActive]  = useState(false)   // drives UI only (hint, arrows)

  // ── Imperative canvas visibility (bypasses React render cycle) ────────────
  const showCanvas = useCallback(() => {
    if (canvasRef.current) canvasRef.current.style.opacity = '1'
  }, [])
  const hideCanvas = useCallback(() => {
    if (canvasRef.current) canvasRef.current.style.opacity = '0'
  }, [])

  // ── Source setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!src) return
    setStatus('loading'); setShowHint(false); setIsActive(false)
    setCapProg(0)
    durRef.current = 0; targetRef.current = null
    currentRef.current = 0; velRef.current = 0
    frameModeRef.current = false
    framesRef.current.forEach(bm => bm?.close?.())
    framesRef.current = []
    setVideoSrc('')
    hideCanvas()
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }

    if (HAS_VFC) {
      setVideoSrc(src)
    } else {
      let dead = false
      fetch(src)
        .then(r => { if (!r.ok) throw new Error(r.status); return r.blob() })
        .then(blob => {
          if (dead) return
          const url = URL.createObjectURL(blob)
          blobUrlRef.current = url
          setVideoSrc(url)
        })
        .catch(() => { if (!dead) setVideoSrc(src) })
      return () => {
        dead = true
        if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
      }
    }
  }, [src])

  // ── Frame extraction ──────────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current
    if (!v || !videoSrc) return
    let dead = false

    if (HAS_VFC) {
      setStatus('extracting')
      const run = async () => {
        if (v.readyState < 1) {
          await new Promise(res => {
            const h = () => { v.removeEventListener('loadedmetadata', h); clearTimeout(fb); res() }
            const fb = setTimeout(res, 5000)
            v.addEventListener('loadedmetadata', h)
          })
        }
        if (dead) return
        const { frames, dur } = await captureVFC(v)
        if (dead) return
        durRef.current = dur
        if (frames.length > 0) {
          framesRef.current = frames
          frameModeRef.current = true
          // Draw frame 0 to canvas immediately
          if (frames[0] && ctxRef.current) ctxRef.current.drawImage(frames[0], 0, 0, FW, FH)
          // Resume video at normal speed for idle playback
          v.loop = true; v.playbackRate = 1; v.currentTime = 0
          v.play().catch(() => {})
        }
        setStatus('ready')
        clearTimeout(hintTimer.current)
        hintTimer.current = setTimeout(() => setShowHint(true), 700)
      }
      run()
    } else {
      const guard = () => { if (!durRef.current) v.pause() }
      const extract = async (dur) => {
        if (dead) return
        setStatus('extracting')
        let frames = []
        try {
          frames = await captureSeek(v, dur, p => { if (!dead) setCapProg(p) }, () => dead)
        } catch { /* fall through */ }
        if (dead) return
        if (frames.length > 0) {
          framesRef.current = frames
          frameModeRef.current = true
          if (frames[0] && ctxRef.current) ctxRef.current.drawImage(frames[0], 0, 0, FW, FH)
          v.loop = true; v.playbackRate = 1; v.currentTime = 0
          v.play().catch(() => {})
        } else {
          v.currentTime = 0
        }
        setStatus('ready')
        clearTimeout(hintTimer.current)
        hintTimer.current = setTimeout(() => setShowHint(true), 700)
      }
      const markReady = (dur) => {
        if (durRef.current || dead) return
        durRef.current = dur; v.currentTime = 0
        v.removeEventListener('play', guard)
        extract(dur)
      }
      const onMeta = () => {
        if (isFinite(v.duration) && v.duration > 0) markReady(v.duration)
        else { setStatus('fixing'); v.currentTime = 1e9 }
      }
      const onSeeked = () => {
        if (durRef.current) return
        let dur = 0
        if      (isFinite(v.duration)    && v.duration    > 0) dur = v.duration
        else if (isFinite(v.currentTime) && v.currentTime > 0) dur = v.currentTime
        else if (v.seekable.length > 0) {
          const e = v.seekable.end(v.seekable.length - 1)
          if (isFinite(e) && e > 0) dur = e
        }
        markReady(dur || 10)
      }
      const onDurChange = () => {
        if (!durRef.current && isFinite(v.duration) && v.duration > 0) markReady(v.duration)
      }
      v.addEventListener('loadedmetadata', onMeta)
      v.addEventListener('durationchange',  onDurChange)
      v.addEventListener('seeked',          onSeeked)
      v.addEventListener('play',            guard)
      if (v.readyState >= 1) onMeta()
      const fb = setTimeout(() => { if (!durRef.current) markReady(10) }, 5000)
      return () => {
        dead = true; clearTimeout(fb)
        v.removeEventListener('loadedmetadata', onMeta)
        v.removeEventListener('durationchange',  onDurChange)
        v.removeEventListener('seeked',          onSeeked)
        v.removeEventListener('play',            guard)
      }
    }
    return () => { dead = true }
  }, [videoSrc])

  // ── RAF scrub loop ────────────────────────────────────────────────────────
  const startLoop = useCallback(() => {
    if (rafRef.current) return
    const tick = () => {
      const tgt = targetRef.current
      const cur = currentRef.current
      let nxt = cur

      if (tgt !== null) {
        const diff   = tgt - cur
        const factor = Math.min(0.25, 0.18 + Math.abs(diff) * 0.45)
        nxt = cur + diff * factor
        velRef.current = nxt - cur
      } else {
        if (Math.abs(velRef.current) < 0.00005) {
          velRef.current = 0; rafRef.current = null; return
        }
        nxt = Math.max(0, Math.min(1, cur + velRef.current))
        velRef.current *= 0.82
      }
      currentRef.current = nxt

      // Draw frame
      const frames = framesRef.current
      if (frames.length > 0 && ctxRef.current) {
        const ctx = ctxRef.current
        const raw = nxt * (frames.length - 1)
        const velocity = Math.abs(nxt - cur)

        if (velocity < 0.0012) {
          // Settled → snap to nearest frame (sharp, no ghost)
          const idx = Math.min(frames.length - 1, Math.round(raw))
          if (frames[idx]) ctx.drawImage(frames[idx], 0, 0, FW, FH)
        } else {
          // Moving → blend adjacent frames (smooth)
          const lo = Math.min(frames.length - 1, Math.floor(raw))
          const hi = Math.min(frames.length - 1, lo + 1)
          const t  = raw - lo
          if (frames[lo]) ctx.drawImage(frames[lo], 0, 0, FW, FH)
          if (hi !== lo && frames[hi] && t > 0.01) {
            ctx.globalAlpha = t
            ctx.drawImage(frames[hi], 0, 0, FW, FH)
            ctx.globalAlpha = 1
          }
        }
      } else {
        // No frames — seek video directly
        const v = videoRef.current, dur = durRef.current
        if (v && dur && !v.seeking) {
          const t = nxt * dur
          if (Math.abs(t - v.currentTime) > 0.01) v.currentTime = t
        }
      }

      if (progressRef.current) progressRef.current.style.width = `${nxt * 100}%`
      if (degreeRef.current)   degreeRef.current.textContent  = `${Math.round(nxt * 360)}°`
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const stopLoop = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
  }, [])

  useEffect(() => () => { stopLoop(); clearTimeout(hintTimer.current) }, [stopLoop])

  // ── Pointer helpers ───────────────────────────────────────────────────────
  const pctFromX = useCallback(clientX => {
    const r = containerRef.current?.getBoundingClientRect()
    return r ? Math.max(0, Math.min(1, (clientX - r.left) / r.width)) : 0
  }, [])

  const moveLine = useCallback(pct => {
    if (lineRef.current) { lineRef.current.style.left = `${pct * 100}%`; lineRef.current.style.opacity = '1' }
  }, [])
  const hideLine = useCallback(() => {
    if (lineRef.current) lineRef.current.style.opacity = '0'
  }, [])

  const scheduleHint = useCallback(() => {
    clearTimeout(hintTimer.current); setShowHint(false)
    hintTimer.current = setTimeout(() => setShowHint(true), 3500)
  }, [])

  // ── Mouse / touch handlers ────────────────────────────────────────────────
  const onMouseEnter = useCallback(() => {
    hoveringRef.current = true
    setIsActive(true)
    clearTimeout(hintTimer.current); setShowHint(false)
    // Pause the idle video, show canvas
    if (frameModeRef.current) {
      videoRef.current?.pause()
      showCanvas()
    }
    startLoop()
  }, [startLoop, showCanvas])

  const onMouseMove = useCallback(e => {
    const p = pctFromX(e.clientX)
    targetRef.current = p
    if (!rafRef.current) startLoop()
    moveLine(p)
    scheduleHint()
  }, [pctFromX, startLoop, moveLine, scheduleHint])

  const onMouseLeave = useCallback(() => {
    hoveringRef.current = false
    targetRef.current = null
    setIsActive(false); setShowHint(false)
    hideLine()
    // Fade out canvas, sync video to scrub position and resume
    if (frameModeRef.current) {
      hideCanvas()
      const v = videoRef.current, dur = durRef.current
      if (v && dur) {
        v.currentTime = currentRef.current * dur
        v.play().catch(() => {})
      }
    }
  }, [hideLine, hideCanvas])

  const onTouchStart = useCallback(e => {
    hoveringRef.current = true
    setIsActive(true)
    const p = pctFromX(e.touches[0].clientX)
    targetRef.current = p; moveLine(p)
    if (frameModeRef.current) { videoRef.current?.pause(); showCanvas() }
    startLoop()
  }, [pctFromX, moveLine, startLoop, showCanvas])

  const onTouchMove = useCallback(e => {
    e.preventDefault()
    const p = pctFromX(e.touches[0].clientX)
    targetRef.current = p; moveLine(p); scheduleHint()
  }, [pctFromX, moveLine, scheduleHint])

  const onTouchEnd = useCallback(() => {
    hoveringRef.current = false
    targetRef.current = null; setIsActive(false); hideLine()
    if (frameModeRef.current) {
      hideCanvas()
      const v = videoRef.current, dur = durRef.current
      if (v && dur) { v.currentTime = currentRef.current * dur; v.play().catch(() => {}) }
    }
  }, [hideLine, hideCanvas])

  const isReady = status === 'ready'

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative', overflow: 'hidden',
        background: '#080808', borderRadius: 18, aspectRatio: '16/9',
        cursor: isReady ? 'ew-resize' : 'default',
        userSelect: 'none', touchAction: 'none',
        ...style,
      }}
      onMouseEnter={onMouseEnter} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
    >
      {/* Video — always plays; shows idle loop when not scrubbing */}
      <video
        ref={videoRef} src={videoSrc} poster={poster} preload="auto" muted playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
      />

      {/* Canvas — always in DOM; shown imperatively on hover (no React render gap) */}
      {/* height:100% + width:auto mirrors objectFit:cover — same crop/zoom as the video */}
      <canvas
        ref={el => {
          canvasRef.current = el
          if (el) {
            const c = el.getContext('2d', { alpha: false })
            c.imageSmoothingEnabled = true
            c.imageSmoothingQuality = 'high'
            ctxRef.current = c
          }
        }}
        width={FW} height={FH}
        style={{
          position: 'absolute', top: 0, left: '50%',
          transform: 'translateX(-50%)',
          height: '100%', width: 'auto',
          opacity: 0, transition: 'opacity 0.12s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 55%, transparent 42%, rgba(0,0,0,0.5) 100%)' }} />

      {/* Bottom gradient */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '48%', pointerEvents: 'none', background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 60%, transparent 100%)' }} />

      {/* Scrub cursor line */}
      <div ref={lineRef} style={{ position: 'absolute', top: 0, bottom: '3px', width: 1, background: 'linear-gradient(to bottom, transparent 0%, rgba(255,200,80,0.6) 35%, rgba(255,200,80,0.6) 65%, transparent 100%)', transform: 'translateX(-50%)', pointerEvents: 'none', opacity: 0, transition: 'opacity 0.25s', left: '50%', willChange: 'left' }} />

      {/* 360° badge */}
      {isReady && (
        <div style={{ position: 'absolute', top: 14, right: 14, pointerEvents: 'none', background: 'rgba(6,6,6,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 50, padding: '5px 13px', display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,200,80,0.9)" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21.5 2v6h-6"/><path d="M2.5 22v-6h6"/>
            <path d="M2 11.5a10 10 0 0 1 18.8-4.3"/><path d="M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>360°</span>
        </div>
      )}

      {/* Degree counter */}
      {isReady && (
        <div style={{ position: 'absolute', top: 16, left: 16, pointerEvents: 'none', opacity: isActive ? 1 : 0, transition: 'opacity 0.3s' }}>
          <span ref={degreeRef} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.04em' }}>0°</span>
        </div>
      )}

      {/* ◄ ► hint arrows */}
      {isReady && (
        <>
          <div style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.18)', fontSize: 16, pointerEvents: 'none', fontFamily: 'monospace', animation: 'v360-pulse 2.8s ease-in-out infinite', opacity: isActive ? 0 : 1, transition: 'opacity 0.35s' }}>◄</div>
          <div style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.18)', fontSize: 16, pointerEvents: 'none', fontFamily: 'monospace', animation: 'v360-pulse 2.8s ease-in-out infinite', animationDelay: '1.4s', opacity: isActive ? 0 : 1, transition: 'opacity 0.35s' }}>►</div>
        </>
      )}

      {/* Progress track */}
      {isReady && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }}>
          <div ref={progressRef} style={{ height: '100%', width: '0%', background: 'linear-gradient(90deg, rgba(255,185,50,0.55), rgba(255,215,100,0.95))', borderRadius: '0 2px 2px 0', boxShadow: '0 0 8px rgba(255,200,80,0.4)', willChange: 'width' }} />
        </div>
      )}

      {/* Loading overlay */}
      {!isReady && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'rgba(0,0,0,0.45)' }}>
          <div style={{ width: 40, height: 40, border: '2px solid rgba(255,255,255,0.06)', borderTop: '2px solid rgba(255,200,80,0.85)', borderRadius: '50%', animation: 'v360-spin 0.85s linear infinite' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
            {status === 'extracting'
              ? (HAS_VFC ? 'Building 360°…' : `Building 360°… ${Math.round(capProg * 100)}%`)
              : 'Loading…'}
          </span>
          {status === 'extracting' && !HAS_VFC && (
            <div style={{ width: 120, height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${capProg * 100}%`, background: 'rgba(255,200,80,0.7)', transition: 'width 0.15s ease' }} />
            </div>
          )}
        </div>
      )}

      {/* "Move Mouse to Rotate" hint */}
      {isReady && showHint && !isActive && (
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(6,6,6,0.78)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 50, padding: '10px 22px', display: 'flex', alignItems: 'center', gap: 11, pointerEvents: 'none', whiteSpace: 'nowrap', animation: 'v360-fadein 0.4s ease' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,200,80,0.9)" strokeWidth="2" strokeLinecap="round">
            <path d="M21.5 2v6h-6"/><path d="M2.5 22v-6h6"/>
            <path d="M2 11.5a10 10 0 0 1 18.8-4.3"/><path d="M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.82)' }}>Move Mouse to Rotate</span>
        </div>
      )}

      {/* Active label */}
      {isReady && isActive && (
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', whiteSpace: 'nowrap', animation: 'v360-fadein 0.3s ease' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>◄ · drag to rotate · ►</span>
        </div>
      )}
    </div>
  )
}
