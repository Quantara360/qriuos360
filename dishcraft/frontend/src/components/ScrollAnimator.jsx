import { useEffect } from 'react'

export default function ScrollAnimator() {
  useEffect(() => {
    // ── Scroll progress bar ──
    let bar = document.getElementById('scroll-prog-bar')
    if (!bar) {
      bar = document.createElement('div')
      bar.id = 'scroll-prog-bar'
      document.body.appendChild(bar)
    }
    bar.className = 'scroll-prog-bar'

    const onScroll = () => {
      const pct = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      bar.style.transform = `scaleX(${Math.min(pct, 1)})`
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // ── IntersectionObserver for off-screen [data-scroll] elements ──
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return
        const el = e.target
        const delay = parseFloat(el.dataset.delay || 0) * 1000
        setTimeout(() => el.classList.add('in-view'), delay)
        io.unobserve(el)
      })
    }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' })

    const reveal = (el) => {
      const delay = parseFloat(el.dataset.delay || 0) * 1000
      setTimeout(() => el.classList.add('in-view'), delay)
    }

    const sweep = () => {
      document.querySelectorAll('[data-scroll]:not(.sa-observed)').forEach(el => {
        el.classList.add('sa-observed')
        const r = el.getBoundingClientRect()
        // Already visible in viewport → reveal immediately
        if (r.top < window.innerHeight && r.bottom > 0) {
          reveal(el)
        } else {
          io.observe(el)
        }
      })
    }

    // MutationObserver catches elements added after first paint (async data loads)
    const mo = new MutationObserver(sweep)
    mo.observe(document.body, { childList: true, subtree: true })

    // Run on next frame so the DOM has fully painted
    requestAnimationFrame(sweep)

    // Safety net: any element still hidden after 2.5s gets revealed
    const safetyTimer = setTimeout(() => {
      document.querySelectorAll('[data-scroll]:not(.in-view)').forEach(el => el.classList.add('in-view'))
    }, 2500)

    return () => {
      window.removeEventListener('scroll', onScroll)
      io.disconnect()
      mo.disconnect()
      clearTimeout(safetyTimer)
      bar.remove()
    }
  }, [])

  return null
}
