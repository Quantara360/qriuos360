import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6"  x2="6"  y2="18"/>
      <line x1="6"  y1="6"  x2="18" y2="18"/>
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2"  x2="12" y2="5"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/>
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
      <line x1="2"  y1="12" x2="5"  y2="12"/>
      <line x1="19" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>
      <line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function VideoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
  )
}

const THEME_OPTS = [
  { mode: 'light', Icon: SunIcon,   label: 'Light' },
  { mode: 'dark',  Icon: MoonIcon,  label: 'Dark'  },
  { mode: 'video', Icon: VideoIcon, label: 'Video BG' },
]

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  return (
    <div style={{
      display: 'flex', gap: 2,
      background: 'var(--glass)', border: '1px solid var(--border-mid)',
      borderRadius: 22, padding: 3,
    }}>
      {THEME_OPTS.map(({ mode, Icon, label }) => {
        const active = theme === mode
        return (
          <button
            key={mode}
            title={label}
            onClick={() => setTheme(mode)}
            style={{
              width: 28, height: 28, borderRadius: 18, border: 'none',
              cursor: 'pointer', padding: 0,
              background: active ? 'var(--grad)' : 'transparent',
              color: active ? '#fff' : 'var(--text-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .22s, color .22s, transform .18s',
              transform: active ? 'scale(1.08)' : 'scale(1)',
            }}
          >
            <Icon />
          </button>
        )
      })}
    </div>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [open,     setOpen]     = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    setOpen(false)
  }

  const close = () => setOpen(false)
  const linkCls   = ({ isActive }) => 'nav-link'        + (isActive ? ' active' : '')
  const drawerCls = ({ isActive }) => 'nav-drawer-link' + (isActive ? ' active' : '')

  return (
    <>
      <nav className={`nav${scrolled ? ' nav-scrolled' : ''}`}>

        {/* ── Brand ── */}
        <Link to="/" className="nav-brand" onClick={close}>
          <img
            src="/logo.jpeg"
            alt="QRIOUS360"
            style={{ height: 36, width: 'auto', borderRadius: 8, objectFit: 'contain', display: 'block' }}
          />
          <div className="nav-tag">Volumetric Menus · v1.0</div>
        </Link>

        {/* ── Desktop links ── */}
        <div className="nav-links-desktop">
          <NavLink to="/budget"   className={linkCls}>Budget Planner</NavLink>
          <NavLink to="/about"    className={linkCls}>About</NavLink>
          <NavLink to="/feedback" className={linkCls}>Feedback</NavLink>
          {user?.role === 'customer' && <>
            <NavLink to="/favorites" className={linkCls}>Favorites</NavLink>
            <NavLink to="/profile"   className={linkCls}>Profile</NavLink>
          </>}
          {user?.role === 'owner' && (
            <NavLink to="/owner" className={linkCls}>Dashboard</NavLink>
          )}
          {(user?.role === 'admin' || user?.role === 'sub_admin') && (
            <NavLink to="/admin" className={linkCls}>Admin</NavLink>
          )}
        </div>

        {/* ── Desktop user ── */}
        <div className="nav-user-desktop">
          {user ? (
            <>
              <span className={`role-pill ${user.role}`}>{user.role}</span>
              <span className="nav-username">{user.name}</span>
              <button className="nav-link" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkCls}>Login</NavLink>
              <NavLink to="/register" className="btn btn-tiny" style={{ marginLeft: 6 }}>
                Get started
              </NavLink>
            </>
          )}
        </div>

        {/* ── Mobile right ── */}
        <div className="nav-mobile-right">
          <button className="nav-hamburger" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer (outside nav to avoid backdrop-filter stacking context) ── */}
      {open && (
        <div className="nav-drawer" onClick={close}>
          <div className="nav-drawer-inner" onClick={e => e.stopPropagation()}>

            {/* Drawer brand */}
            <div style={{ marginBottom: 28, paddingBottom: 22, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/logo.jpeg" alt="QRIOUS360" style={{ height: 38, width: 'auto', borderRadius: 8, objectFit: 'contain', display: 'block', flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: 'Barlow Condensed, serif', fontSize: 18, fontStyle: 'normal', fontWeight: 700, background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  QRIOUS360
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 3 }}>
                  Volumetric Menus
                </div>
              </div>
            </div>

            <NavLink to="/budget"   className={drawerCls} onClick={close}>Budget Planner</NavLink>
            <NavLink to="/about"    className={drawerCls} onClick={close}>About</NavLink>
            <NavLink to="/feedback" className={drawerCls} onClick={close}>Feedback</NavLink>
            {user?.role === 'customer' && <>
              <NavLink to="/favorites" className={drawerCls} onClick={close}>Favorites</NavLink>
              <NavLink to="/profile"   className={drawerCls} onClick={close}>Profile</NavLink>
            </>}
            {user?.role === 'owner' && (
              <NavLink to="/owner" className={drawerCls} onClick={close}>Dashboard</NavLink>
            )}
            {(user?.role === 'admin' || user?.role === 'sub_admin') && (
              <NavLink to="/admin" className={drawerCls} onClick={close}>Admin</NavLink>
            )}


            <div className="nav-drawer-divider" />

            {user ? (
              <>
                <div className="nav-drawer-user">
                  <span className={`role-pill ${user.role}`}>{user.role}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-2)' }}>
                    {user.name}
                  </span>
                </div>
                <button className="nav-drawer-link" onClick={handleLogout} style={{ color: 'var(--bad)', marginTop: 4 }}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login"    className={drawerCls} onClick={close}>Login</NavLink>
                <NavLink to="/register" className={drawerCls} onClick={close}>Create account</NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
