import { useEffect, useRef } from 'react'

const DARK_COLORS  = [
  [212, 150,  58],
  [245, 192, 106],
  [249, 115,  22],
  [212, 175,  80],
  [255, 220, 120],
]

const LIGHT_COLORS = [
  [ 99, 102, 241],
  [139,  92, 246],
  [ 59, 130, 246],
  [ 14, 165, 233],
  [168, 85,  247],
]

function getColors(theme) {
  return theme === 'light' ? LIGHT_COLORS : DARK_COLORS
}

function rgba(c, a) {
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`
}

export default function BackgroundAnimation({ theme = 'dark' }) {
  const canvasRef  = useRef(null)
  const themeRef   = useRef(theme)
  const colorsRef  = useRef(getColors(theme))

  useEffect(() => {
    themeRef.current  = theme
    colorsRef.current = getColors(theme)
  }, [theme])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    let animId
    let t = 0

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      t += 0.018

      if (themeRef.current !== 'video') {
        const colors  = colorsRef.current
        const spacing = 14
        const cols    = Math.ceil(canvas.width  / spacing) + 1
        const rows    = Math.ceil(canvas.height / spacing) + 1

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const x = col * spacing

            // Two overlapping sine waves propagating left → right
            const w1   = Math.sin(col * 0.28 - t * 2.2) * 7
            const w2   = Math.sin(col * 0.14 - t * 1.4 + row * 0.4) * 4
            const wave = w1 + w2
            const y    = row * spacing + wave

            // Dots at wave peaks are brighter and slightly larger
            const norm   = (wave / 11 + 1) / 2          // 0 – 1
            const opacity = 0.08 + norm * 0.32
            const radius  = 1.0  + norm * 0.9

            const color = colors[(col * 3 + row) % colors.length]

            ctx.beginPath()
            ctx.arc(x, y, radius, 0, Math.PI * 2)
            ctx.fillStyle = rgba(color, opacity)
            ctx.fill()
          }
        }
      }

      animId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
