import { useState, useEffect } from 'react'

const STORAGE_KEY = 'dc-cookie-consent'

const CATEGORIES = [
  {
    id: 'essential',
    label: 'Essential',
    desc: 'Login session, security, and core functionality. Cannot be disabled.',
    locked: true,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    desc: 'Remember your theme choice, language, and display settings.',
    locked: false,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    desc: 'Understand which dishes and pages are popular so we can improve the experience.',
    locked: false,
  },
]

export default function CookieConsent() {
  const [visible, setVisible]     = useState(false)
  const [expanded, setExpanded]   = useState(false)
  const [leaving, setLeaving]     = useState(false)
  const [prefs, setPrefs]         = useState({ preferences: true, analytics: true })

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      // Small delay so page loads first
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  const dismiss = (consent) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
    setLeaving(true)
    setTimeout(() => setVisible(false), 420)
  }

  const acceptAll  = () => dismiss({ essential: true, preferences: true, analytics: true })
  const savePrefs  = () => dismiss({ essential: true, ...prefs })
  const essentialOnly = () => dismiss({ essential: true, preferences: false, analytics: false })

  if (!visible) return null

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-label="Cookie preferences"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99998,
        width: 'min(560px, calc(100vw - 32px))',
        animation: leaving
          ? 'cookie-out .4s cubic-bezier(.4,0,1,1) forwards'
          : 'cookie-in .5s cubic-bezier(.22,1,.36,1) both',
      }}
    >
      <style>{`
        @keyframes cookie-in  { from { opacity:0; transform:translateX(-50%) translateY(24px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }
        @keyframes cookie-out { from { opacity:1; transform:translateX(-50%) translateY(0) } to { opacity:0; transform:translateX(-50%) translateY(24px) } }
        .cc-manage-btn:hover { opacity:.75 !important; }
        .cc-toggle { position:relative; display:inline-flex; align-items:center; cursor:pointer; }
        .cc-toggle input { opacity:0; width:0; height:0; position:absolute; }
        .cc-track {
          width:40px; height:22px; border-radius:11px;
          background: rgba(255,255,255,.12);
          border: 1px solid rgba(255,255,255,.15);
          transition: background .2s, border-color .2s;
          position:relative;
          flex-shrink:0;
        }
        .cc-track.on { background: var(--amber); border-color: var(--amber); }
        .cc-thumb {
          position:absolute; top:2px; left:2px;
          width:16px; height:16px; border-radius:50%;
          background:#fff; transition: transform .2s cubic-bezier(.34,1.56,.64,1);
          box-shadow: 0 1px 4px rgba(0,0,0,.3);
        }
        .cc-track.on .cc-thumb { transform:translateX(18px); }
      `}</style>

      <div style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--border-hi)',
        borderRadius: 18,
        boxShadow: '0 24px 80px rgba(0,0,0,.65), 0 0 0 1px rgba(255,255,255,.04)',
        overflow: 'hidden',
      }}>
        {/* Header bar */}
        <div style={{
          background: 'linear-gradient(90deg, var(--glass-amber), transparent)',
          borderBottom: '1px solid var(--border-mid)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>🍪</span>
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700, fontSize: 18,
            color: 'var(--text)',
            letterSpacing: '0.01em',
          }}>
            We use cookies
          </span>
        </div>

        <div style={{ padding: '18px 20px 20px' }}>
          {/* Description */}
          <p style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: 14, lineHeight: 1.65,
            color: 'var(--text-2)',
            margin: '0 0 16px',
          }}>
            We use cookies to keep you signed in, remember your preferences, and understand
            how visitors use QRIOUS360 so we can make it better.
          </p>

          {/* Expanded manage panel */}
          {expanded && (
            <div style={{
              marginBottom: 16,
              borderRadius: 10,
              border: '1px solid var(--border-mid)',
              overflow: 'hidden',
            }}>
              {CATEGORIES.map((cat, i) => (
                <div key={cat.id} style={{
                  padding: '13px 16px',
                  borderBottom: i < CATEGORIES.length - 1 ? '1px solid var(--border-mid)' : 'none',
                  background: 'var(--glass)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontWeight: 700, fontSize: 14,
                      color: 'var(--text)',
                      marginBottom: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                      {cat.label}
                      {cat.locked && (
                        <span style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 10, letterSpacing: '0.08em',
                          background: 'var(--glass-amber)',
                          border: '1px solid var(--border-hi)',
                          color: 'var(--amber)',
                          borderRadius: 4,
                          padding: '1px 6px',
                        }}>Always on</span>
                      )}
                    </div>
                    <div style={{
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5,
                    }}>
                      {cat.desc}
                    </div>
                  </div>
                  {/* Toggle */}
                  <label className="cc-toggle" style={{ marginTop: 2 }}>
                    <input
                      type="checkbox"
                      checked={cat.locked || !!prefs[cat.id]}
                      disabled={cat.locked}
                      onChange={e => !cat.locked && setPrefs(p => ({ ...p, [cat.id]: e.target.checked }))}
                    />
                    <span className={`cc-track ${(cat.locked || !!prefs[cat.id]) ? 'on' : ''}`}
                      style={cat.locked ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
                      <span className="cc-thumb" />
                    </span>
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Accept All */}
            <button
              onClick={acceptAll}
              style={{
                flex: '1 1 140px',
                padding: '11px 0',
                background: 'linear-gradient(135deg, var(--amber), #f0b429)',
                border: 'none', borderRadius: 10,
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700, fontSize: 15,
                color: '#0e0a04', cursor: 'pointer',
                transition: 'opacity .2s, transform .15s',
                boxShadow: '0 4px 16px rgba(224,152,48,.3)',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity='.88'; e.currentTarget.style.transform='translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='translateY(0)' }}
            >
              Accept all
            </button>

            {/* Essential Only or Save Preferences */}
            {expanded ? (
              <button
                onClick={savePrefs}
                style={{
                  flex: '1 1 140px',
                  padding: '11px 0',
                  background: 'var(--glass)',
                  border: '1px solid var(--border-hi)',
                  borderRadius: 10,
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 600, fontSize: 15,
                  color: 'var(--text)', cursor: 'pointer',
                  transition: 'background .2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background='var(--glass-hi)'}
                onMouseLeave={e => e.currentTarget.style.background='var(--glass)'}
              >
                Save preferences
              </button>
            ) : (
              <button
                onClick={essentialOnly}
                style={{
                  flex: '1 1 140px',
                  padding: '11px 0',
                  background: 'var(--glass)',
                  border: '1px solid var(--border-hi)',
                  borderRadius: 10,
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 600, fontSize: 15,
                  color: 'var(--text)', cursor: 'pointer',
                  transition: 'background .2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background='var(--glass-hi)'}
                onMouseLeave={e => e.currentTarget.style.background='var(--glass)'}
              >
                Essential only
              </button>
            )}

            {/* Manage link */}
            <button
              className="cc-manage-btn"
              onClick={() => setExpanded(x => !x)}
              style={{
                background: 'none', border: 'none', padding: '11px 4px',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: 14, color: 'var(--text-3)',
                cursor: 'pointer', textDecoration: 'underline',
                textUnderlineOffset: 3, opacity: 1,
                transition: 'opacity .2s',
                flexShrink: 0,
              }}
            >
              {expanded ? 'Hide options' : 'Manage'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
