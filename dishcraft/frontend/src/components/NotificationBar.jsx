import { useToasts } from '../context/NotificationContext.jsx'

const CONFIG = {
  success: {
    accent: '#22c55e',
    bg:     'rgba(15,36,24,.92)',
    border: 'rgba(34,197,94,.28)',
    label:  'Success',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
  },
  error: {
    accent: '#ef4444',
    bg:     'rgba(40,14,14,.92)',
    border: 'rgba(239,68,68,.28)',
    label:  'Error',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
  },
  warning: {
    accent: '#f59e0b',
    bg:     'rgba(40,28,8,.92)',
    border: 'rgba(245,158,11,.28)',
    label:  'Warning',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  info: {
    accent: '#60a5fa',
    bg:     'rgba(12,24,48,.92)',
    border: 'rgba(96,165,250,.28)',
    label:  'Info',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
}

export default function NotificationBar() {
  const { toasts, dismiss } = useToasts()
  if (!toasts.length) return null

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      width: 360,
      maxWidth: 'calc(100vw - 40px)',
      pointerEvents: 'none',
    }}>
      {toasts.map(t => {
        const cfg = CONFIG[t.type] ?? CONFIG.info
        return (
          <div
            key={t.id}
            style={{
              pointerEvents: 'all',
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '14px 16px 18px',
              borderRadius: 14,
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: `0 12px 40px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.05)`,
              overflow: 'hidden',
              animation: t.exiting
                ? 'notif-out .35s cubic-bezier(.4,0,1,1) forwards'
                : 'notif-in .42s cubic-bezier(.22,1,.36,1) both',
            }}
          >
            {/* Left color bar */}
            <div style={{
              position: 'absolute',
              left: 0, top: 0, bottom: 0,
              width: 3,
              background: cfg.accent,
              borderRadius: '14px 0 0 14px',
            }}/>

            {/* Icon */}
            <div style={{ color: cfg.accent, flexShrink: 0, marginTop: 1 }}>
              {cfg.icon}
            </div>

            {/* Body */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 8,
                textTransform: 'uppercase',
                letterSpacing: '.2em',
                color: cfg.accent,
                fontWeight: 700,
                marginBottom: 5,
              }}>
                {cfg.label}
              </div>
              <div style={{
                fontFamily: 'Barlow Condensed, serif',
                fontSize: 13.5,
                color: 'rgba(226,232,240,.9)',
                lineHeight: 1.55,
                wordBreak: 'break-word',
              }}>
                {t.message}
              </div>
            </div>

            {/* Close */}
            <button
              onClick={() => dismiss(t.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,.3)',
                fontSize: 18,
                lineHeight: 1,
                padding: '0 0 0 4px',
                flexShrink: 0,
                transition: 'color .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,.8)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.3)'}
            >×</button>

            {/* Progress bar */}
            {t.duration > 0 && (
              <div style={{
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                height: 3,
                background: `${cfg.accent}22`,
              }}>
                <div style={{
                  height: '100%',
                  background: `linear-gradient(to right, ${cfg.accent}99, ${cfg.accent})`,
                  animation: `notif-progress ${t.duration}ms linear forwards`,
                  transformOrigin: 'left center',
                }}/>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
