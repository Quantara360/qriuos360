import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const dotRef  = useRef()
  const ringRef = useRef()

  useEffect(() => {
    // Skip on touch-only devices — no mouse to show
    if (!window.matchMedia('(pointer: fine)').matches) return

    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    // Hide the native cursor globally
    document.documentElement.classList.add('custom-cursor')

    const DOT_R  = 5   // half of 10px dot
    const RING_R = 20  // half of 40px ring

    let mx = -200, my = -200   // mouse position
    let rx = -200, ry = -200   // ring lerp position
    let hovering = false
    let raf

    const onMove = (e) => { mx = e.clientX; my = e.clientY }

    const SELECTORS = 'a, button, [role="button"], input, textarea, select, label, [tabindex]'

    const onOver = (e) => {
      if (e.target.closest(SELECTORS)) hovering = true
    }
    const onOut = (e) => {
      if (e.target.closest(SELECTORS)) hovering = false
    }

    const tick = () => {
      // Dot follows cursor exactly
      dot.style.transform = `translate(${mx - DOT_R}px, ${my - DOT_R}px)`

      // Ring lerps behind with a soft delay
      rx += (mx - rx) * 0.1
      ry += (my - ry) * 0.1

      const scale = hovering ? 1.6 : 1
      ring.style.transform = `translate(${rx - RING_R}px, ${ry - RING_R}px) scale(${scale})`
      ring.style.opacity    = hovering ? '0.35' : '0.55'
      ring.style.borderColor = hovering ? 'var(--rose)' : 'var(--amber)'
      dot.style.background   = hovering ? 'var(--rose)' : 'var(--amber)'

      raf = requestAnimationFrame(tick)
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover',  onOver, { passive: true })
    document.addEventListener('mouseout',   onOut,  { passive: true })
    raf = requestAnimationFrame(tick)

    return () => {
      document.documentElement.classList.remove('custom-cursor')
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover',  onOver)
      document.removeEventListener('mouseout',   onOut)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div ref={dotRef}  className="cursor-dot"  aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  )
}
