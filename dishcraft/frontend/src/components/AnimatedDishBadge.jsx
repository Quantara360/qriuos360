;(function injectStyles() {
  let s = document.getElementById('adb-css')
  if (!s) { s = document.createElement('style'); s.id = 'adb-css'; document.head.appendChild(s) }
  s.textContent = `
    @keyframes adb-float { 0%,100%{transform:translateY(0px) rotate(0deg)} 38%{transform:translateY(-14px) rotate(3.5deg)} 70%{transform:translateY(-7px) rotate(-2.5deg)} }
    @keyframes adb-orb-r { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes adb-orb-l { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
    @keyframes adb-glow  { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:.9;transform:scale(1.12)} }
    @keyframes adb-dot   { 0%,100%{box-shadow:0 0 8px var(--amber),0 0 18px rgba(212,150,58,.4)} 50%{box-shadow:0 0 16px var(--amber),0 0 32px rgba(212,150,58,.7)} }
  `
})()

export default function AnimatedDishBadge({ src, name = '', size = 200, style = {} }) {
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0, ...style }}>

      {/* Outer orbit ring with glowing dot */}
      <div style={{
        position:'absolute', inset:-20, borderRadius:'50%',
        border:'1px solid rgba(212,150,58,.18)',
        animation:'adb-orb-r 18s linear infinite',
        pointerEvents:'none',
      }}>
        <div style={{
          position:'absolute', top:-5, left:'50%', transform:'translateX(-50%)',
          width:10, height:10, borderRadius:'50%',
          background:'var(--amber)',
          animation:'adb-dot 2.8s ease-in-out infinite',
        }} />
      </div>

      {/* Inner dashed counter-orbit ring */}
      <div style={{
        position:'absolute', inset:-8, borderRadius:'50%',
        border:'1px dashed rgba(212,150,58,.2)',
        animation:'adb-orb-l 10s linear infinite',
        pointerEvents:'none',
      }} />

      {/* Ambient glow behind the image */}
      <div style={{
        position:'absolute', inset:0, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(212,150,58,.28) 0%, transparent 65%)',
        animation:'adb-glow 3.4s ease-in-out infinite',
        pointerEvents:'none',
      }} />

      {/* Circular frame with floating image */}
      <div style={{
        width:'100%', height:'100%', borderRadius:'50%',
        overflow:'hidden',
        border:'2px solid rgba(212,150,58,.38)',
        boxShadow:'0 0 28px rgba(212,150,58,.22), 0 24px 48px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.07)',
        animation:'adb-float 5.2s ease-in-out infinite',
        background:'rgba(0,0,0,.08)',
      }}>
        <img
          src={src}
          alt={name}
          loading="lazy"
          style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }}
        />
      </div>
    </div>
  )
}
