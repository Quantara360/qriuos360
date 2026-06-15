import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const NAV_LINKS = [
  { label: 'Home',           to: '/' },
  { label: 'Browse Menu',    to: '/menu' },
  { label: 'Budget Planner', to: '/menu' },
  { label: 'About Us',       to: '/about' },
  { label: 'Feedback',       to: '/feedback' },
]

const ACCOUNT_LINKS = [
  { label: 'Sign In',    to: '/login',    auth: false },
  { label: 'Register',   to: '/register', auth: false },
  { label: 'Favourites', to: '/favorites',auth: true,  role: 'customer' },
  { label: 'Profile',    to: '/profile',  auth: true,  role: 'customer' },
  { label: 'Dashboard',  to: '/owner',    auth: true,  role: 'owner' },
]

function IconInstagram() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4.5"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  )
}
function IconTwitter() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
    </svg>
  )
}
function IconFacebook() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

export default function Footer() {
  const { pathname } = useLocation()
  const { user }     = useAuth()

  // Hide on auth pages, owner/admin dashboards, and public hotel menu
  const hide = ['/login', '/register'].includes(pathname)
    || pathname.startsWith('/owner')
    || pathname.startsWith('/admin')
    || pathname.startsWith('/hotel')

  if (hide) return null

  const year = new Date().getFullYear()

  const visibleAccountLinks = ACCOUNT_LINKS.filter(l => {
    if (l.auth && !user) return false
    if (l.auth && l.role && user?.role !== l.role) return false
    if (!l.auth && user) return false
    return true
  })

  return (
    <footer style={{
      position: 'relative',
      borderTop: '1px solid rgba(255,255,255,.08)',
      background: '#000',
      marginTop: 80,
      paddingTop: 64,
      paddingBottom: 36,
      overflow: 'hidden',
    }}>

      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 1,
        background: 'linear-gradient(to right, transparent, rgba(224,152,48,.35), transparent)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
        width: 480, height: 120,
        background: 'radial-gradient(ellipse, rgba(224,152,48,.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 40px' }}>

        {/* ── Top row ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: 48,
          marginBottom: 56,
        }}
          className="footer-grid"
        >

          {/* Brand column */}
          <div>
            <div style={{
              fontFamily: 'Barlow Condensed, serif',
              fontWeight: 900, fontSize: 28,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              marginBottom: 14,
              background: 'var(--grad-gold)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block',
            }}>
              QRIOUS360
            </div>
            <p style={{
              fontFamily: 'Barlow Condensed, serif',
              fontSize: 15, color: 'var(--text-3)',
              lineHeight: 1.7, maxWidth: 300, margin: '0 0 24px',
            }}>
              Transforming every hotel dish into an immersive 360° experience — scan, explore, and order with complete confidence.
            </p>

            {/* Social icons */}
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { icon: <IconInstagram />, label: 'Instagram', href: '#' },
                { icon: <IconTwitter />,   label: 'X / Twitter', href: '#' },
                { icon: <IconFacebook />,  label: 'Facebook', href: '#' },
              ].map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  style={{
                    width: 38, height: 38, borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--glass)',
                    border: '1px solid var(--border-mid)',
                    color: 'var(--text-3)',
                    transition: 'background .2s, border-color .2s, color .2s',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(224,152,48,.12)'
                    e.currentTarget.style.borderColor = 'rgba(224,152,48,.4)'
                    e.currentTarget.style.color = 'var(--amber)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--glass)'
                    e.currentTarget.style.borderColor = 'var(--border-mid)'
                    e.currentTarget.style.color = 'var(--text-3)'
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Explore column */}
          <div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 9, letterSpacing: '.26em', textTransform: 'uppercase',
              color: 'var(--amber)', marginBottom: 18,
            }}>
              Explore
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {NAV_LINKS.map(l => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    style={{
                      fontFamily: 'Barlow Condensed, serif',
                      fontSize: 16, fontWeight: 600,
                      color: 'var(--text-2)', textDecoration: 'none',
                      transition: 'color .18s',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account column */}
          <div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 9, letterSpacing: '.26em', textTransform: 'uppercase',
              color: 'var(--amber)', marginBottom: 18,
            }}>
              Account
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {visibleAccountLinks.map(l => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    style={{
                      fontFamily: 'Barlow Condensed, serif',
                      fontSize: 16, fontWeight: 600,
                      color: 'var(--text-2)', textDecoration: 'none',
                      transition: 'color .18s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: 'var(--border)', marginBottom: 28 }} />

        {/* ── Bottom row ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10, letterSpacing: '.14em',
            color: 'var(--text-3)',
          }}>
            © {year} QRIOUS360. All rights reserved.
          </div>

          {/* Developed by Quantara360° */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase',
              color: 'var(--text-3)',
            }}>
              Developed by Quantara360°
            </span>
            <img
              src="/Quantara%20Logo%20Black.jpg.jpeg"
              alt="Quantara 360"
              style={{
                height: 44, width: 'auto', objectFit: 'contain', display: 'block',
                borderRadius: 12,
                opacity: 0.85, transition: 'opacity .2s, filter .2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(224,152,48,.9)) drop-shadow(0 0 20px rgba(224,152,48,.5))'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = '0.85'
                e.currentTarget.style.filter = 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy Policy', 'Terms of Service'].map(label => (
              <a
                key={label}
                href="#"
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10, letterSpacing: '.12em',
                  color: 'var(--text-3)', textDecoration: 'none',
                  transition: 'color .18s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .footer-grid > div:first-child {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  )
}
