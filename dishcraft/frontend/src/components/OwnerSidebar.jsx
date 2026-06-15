import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { imageUrl } from '../api/client.js'

const Icon = ({ d, viewBox = '0 0 24 24' }) => (
  <svg width="15" height="15" viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)

const GridIcon   = () => <Icon d={['M3 3h7v7H3z','M14 3h7v7h-7z','M14 14h7v7h-7z','M3 14h7v7H3z']} />
const PlusIcon   = () => <Icon d={['M12 5v14','M5 12h14']} />
const UserIcon   = () => <Icon d={['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2','M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z']} />
const CoinsIcon  = () => <Icon d={['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0','M12 8v4l3 3']} />
const BellIcon   = () => <Icon d={['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 0 1-3.46 0']} />
const MsgIcon    = () => <Icon d={['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z']} />
const LinkIcon   = () => <Icon d={['M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6','M15 3h6v6','M10 14L21 3']} />
const OffersIcon = () => <Icon d={['M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z','M7 7h.01']} />
const LogoutIcon = () => <Icon d={['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4','M16 17l5-5-5-5','M21 12H9']} />

function SidebarLink({ to, icon, label, badge, end = false, onClose }) {
  return (
    <NavLink to={to} end={end} onClick={onClose} className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
      {badge > 0 && <span className="sidebar-notif-badge">{badge > 99 ? '99+' : badge}</span>}
    </NavLink>
  )
}

export default function OwnerSidebar({ quota = 0, dishCount = 0, unreadCount = 0, msgUnread = 0, open = false, onClose = () => {} }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const menuPath = user?.qr_token ? `/hotel/${user.qr_token}` : null
  const handleLogout = async () => { await logout(); navigate('/login') }

  const quotaPct    = quota > 0 ? Math.min(100, Math.round((dishCount / quota) * 100)) : 0
  const quotaColour = dishCount >= quota && quota > 0 ? 'var(--bad)' : quotaPct >= 70 ? 'var(--warn)' : 'var(--good)'

  return (
    <aside className={`owner-sidebar${open ? ' open' : ''}`}>

      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">QRIOUS360</div>
        <div className="sidebar-brand-tag">Owner workspace</div>
      </div>

      {/* Hotel identity */}
      <div className="sidebar-hotel">
        {user?.logo_path ? (
          <div className="sidebar-hotel-logo-wrap">
            <img src={imageUrl(user.logo_path)} alt={user.hotel_name} className="sidebar-hotel-logo" />
          </div>
        ) : (
          <div className="sidebar-hotel-logo-placeholder">
            {(user?.hotel_name || '?')[0].toUpperCase()}
          </div>
        )}
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div className="sidebar-hotel-name">{user?.hotel_name || 'My Hotel'}</div>
          <div className="sidebar-hotel-role">Hotel owner</div>
        </div>
      </div>

      {/* Quota bar */}
      {quota > 0 && (
        <div className="sidebar-quota">
          <div className="sidebar-quota-label">
            <span>Dish quota</span>
            <span style={{ color: quotaColour, fontWeight: 600 }}>{dishCount} / {quota}</span>
          </div>
          <div className="sidebar-quota-track">
            <div className="sidebar-quota-fill" style={{ width: `${quotaPct}%`, background: quotaColour }} />
          </div>
          {quotaPct >= 90 && (
            <div style={{ marginTop: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '.12em', color: 'var(--warn)' }}>
              ⚠ Almost at limit — buy more quota
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        <SidebarLink to="/owner"               end icon={<GridIcon />}  label="Dashboard"      onClose={onClose} />
        <SidebarLink to="/owner/new"               icon={<PlusIcon />}  label="Add Dish"       onClose={onClose} />
        <SidebarLink to="/owner/notifications"     icon={<BellIcon />}  label="Notifications"  badge={unreadCount} onClose={onClose} />
        <SidebarLink to="/owner/messages"          icon={<MsgIcon />}   label="Messages"       badge={msgUnread}   onClose={onClose} />
        {user?.role === 'owner' && <SidebarLink to="/owner/offers" icon={<OffersIcon />} label="Offers" onClose={onClose} />}
        <SidebarLink to="/owner/subscription"      icon={<CoinsIcon />} label="Buy Quota"      onClose={onClose} />
        <SidebarLink to="/owner/profile"           icon={<UserIcon />}  label="Edit Profile"   onClose={onClose} />
      </nav>

      <div className="sidebar-divider" />

      {/* Bottom actions */}
      <div className="sidebar-bottom">
        {menuPath && (
          <Link to={menuPath} className="sidebar-nav-item" onClick={onClose}>
            <LinkIcon /><span>Preview menu</span>
          </Link>
        )}
        <button className="sidebar-nav-item" onClick={handleLogout}
          style={{ color: 'var(--bad)', '--hover-bg': 'rgba(239,68,68,.07)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,.07)'}
          onMouseLeave={e => e.currentTarget.style.background = ''}>
          <LogoutIcon /><span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
