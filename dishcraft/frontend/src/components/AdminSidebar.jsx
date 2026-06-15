import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const Icon = ({ d }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)

const OverviewIcon   = () => <Icon d={['M3 3h7v7H3z','M14 3h7v7h-7z','M14 14h7v7h-7z','M3 14h7v7H3z']} />
const UsersIcon      = () => <Icon d={['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75']} />
const DishesIcon     = () => <Icon d={['M18 8h1a4 4 0 0 1 0 8h-1','M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z','M6 1v3','M10 1v3','M14 1v3']} />
const CoinsIcon      = () => <Icon d={['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0','M12 8v4l3 3']} />
const MsgIcon        = () => <Icon d={['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z']} />
const FeedbackIcon   = () => <Icon d={['M4 21V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6l-2 3z','M9 12h6','M9 9h3']} />
const PagesIcon      = () => <Icon d={['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M16 13H8','M16 17H8','M10 9H8']} />
const BannersIcon    = () => <Icon d={['M2 3h20v14H2z','M8 21h8','M12 17v4']} />
const MediaIcon      = () => <Icon d={['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z','M14 2v5h5','M10 11l-2 2 2 2','M14 11l2 2-2 2']} />
const PlansIcon      = () => <Icon d={['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2','M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2','M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2','M9 12h6','M9 16h4']} />
const OffersIcon     = () => <Icon d={['M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z','M7 7h.01']} />
const AnalyticsIcon  = () => <Icon d={['M18 20V10','M12 20V4','M6 20v-6']} />
const LogsIcon       = () => <Icon d={['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M8 13h8','M8 17h5']} />
const ProfileIcon    = () => <Icon d={['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2','M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z']} />
const LogoutIcon     = () => <Icon d={['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4','M16 17l5-5-5-5','M21 12H9']} />

function TabLink({ tabKey, icon, label, badge, onClose }) {
  const [searchParams] = useSearchParams()
  const active = (searchParams.get('tab') || 'overview') === tabKey
  return (
    <Link
      to={`/admin?tab=${tabKey}`}
      onClick={onClose}
      className={`sidebar-nav-item${active ? ' active' : ''}`}
    >
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
      {badge > 0 && <span className="sidebar-notif-badge">{badge > 99 ? '99+' : badge}</span>}
    </Link>
  )
}

export default function AdminSidebar({ stats, msgUnread = 0, feedbackUnread = 0, open = false, onClose = () => {} }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = async () => { await logout(); navigate('/login') }

  const isSubAdmin    = user?.role === 'sub_admin'
  const pendingSubs   = stats?.pending_subscriptions ?? 0
  const pendingOwners = stats?.pending_owners ?? 0
  const initial       = (user?.name || 'A')[0].toUpperCase()

  return (
    <aside className={`owner-sidebar${open ? ' open' : ''}`}>

      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">QRIOUS360</div>
        <div className="sidebar-brand-tag">Admin console</div>
      </div>

      {/* Admin identity */}
      <div className="sidebar-hotel">
        <div className="sidebar-hotel-logo-placeholder" style={{
          background: 'linear-gradient(135deg,rgba(214,58,94,.2),rgba(214,58,94,.06))',
          border: '1px solid rgba(214,58,94,.24)',
          color: 'var(--rose)',
        }}>
          {initial}
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div className="sidebar-hotel-name">{user?.name || 'Admin'}</div>
          <div className="sidebar-hotel-role" style={{ color: 'var(--rose)' }}>
            {isSubAdmin ? 'Sub-administrator' : 'Administrator'}
          </div>
        </div>
      </div>

      {/* Alert banner — full admins only */}
      {!isSubAdmin && (pendingSubs > 0 || pendingOwners > 0) && (
        <div style={{
          margin: '0 10px 4px',
          padding: '10px 14px',
          borderRadius: 10,
          background: 'rgba(245,158,11,.08)',
          border: '1px solid rgba(245,158,11,.2)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9,
          letterSpacing: '.12em',
          color: 'var(--warn)',
        }}>
          {pendingOwners > 0 && <div>⚠ {pendingOwners} owner{pendingOwners > 1 ? 's' : ''} need approval</div>}
          {pendingSubs > 0 && <div>⚠ {pendingSubs} subscription{pendingSubs > 1 ? 's' : ''} pending</div>}
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {!isSubAdmin && <TabLink tabKey="overview"      icon={<OverviewIcon />}  label="Overview"      onClose={onClose} />}
        {!isSubAdmin && <TabLink tabKey="users"         icon={<UsersIcon />}     label={`Users${stats ? ` (${stats.users})` : ''}`} badge={pendingOwners} onClose={onClose} />}
        {!isSubAdmin && <TabLink tabKey="dishes"        icon={<DishesIcon />}    label={`Dishes${stats ? ` (${stats.dishes})` : ''}`} onClose={onClose} />}
        {!isSubAdmin && <TabLink tabKey="subscriptions" icon={<CoinsIcon />}     label="Subscriptions" badge={pendingSubs}   onClose={onClose} />}
        {!isSubAdmin && <TabLink tabKey="plans"         icon={<PlansIcon />}     label="Sub Plans"     onClose={onClose} />}
        <TabLink tabKey="messages"      icon={<MsgIcon />}       label="Messages"      badge={msgUnread}     onClose={onClose} />
        {!isSubAdmin && <TabLink tabKey="feedback"      icon={<FeedbackIcon />}  label="Feedback"      badge={feedbackUnread} onClose={onClose} />}
        {!isSubAdmin && <TabLink tabKey="pages"         icon={<PagesIcon />}     label="Pages"         onClose={onClose} />}
        {!isSubAdmin && <TabLink tabKey="banners"       icon={<BannersIcon />}   label="Banners"       onClose={onClose} />}
        {!isSubAdmin && <TabLink tabKey="media"         icon={<MediaIcon />}     label="Media"         onClose={onClose} />}
        {!isSubAdmin && <TabLink tabKey="analytics"     icon={<AnalyticsIcon />} label="Analytics"     onClose={onClose} />}
        {!isSubAdmin && <TabLink tabKey="logs"          icon={<LogsIcon />}      label="Activity Logs" onClose={onClose} />}
        <TabLink tabKey="profile"       icon={<ProfileIcon />}   label="My Profile"    onClose={onClose} />
      </nav>

      <div className="sidebar-divider" />

      {/* Bottom actions */}
      <div className="sidebar-bottom">
        <button className="sidebar-nav-item" onClick={handleLogout}
          style={{ color: 'var(--bad)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,.07)'}
          onMouseLeave={e => e.currentTarget.style.background = ''}>
          <LogoutIcon /><span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
