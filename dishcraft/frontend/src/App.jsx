import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { useTheme } from './context/ThemeContext.jsx'
import Navbar from './components/Navbar.jsx'
import OwnerLayout from './components/OwnerLayout.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import NotificationBar from './components/NotificationBar.jsx'
import CustomCursor from './components/CustomCursor.jsx'
import ScrollAnimator from './components/ScrollAnimator.jsx'
import BackgroundAnimation from './components/BackgroundAnimation.jsx'
import VintageBackground from './components/VintageBackground.jsx'
import CookieConsent from './components/CookieConsent.jsx'
import Footer from './components/Footer.jsx'

import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Menu from './pages/Menu.jsx'
import DishDetail from './pages/DishDetail.jsx'
import Favorites from './pages/Favorites.jsx'
import OwnerDashboard from './pages/OwnerDashboard.jsx'
import OwnerDishForm from './pages/OwnerDishForm.jsx'
import OwnerSubscription from './pages/OwnerSubscription.jsx'
import OwnerNotifications from './pages/OwnerNotifications.jsx'
import EditProfile from './pages/EditProfile.jsx'
import OwnerMessages from './pages/OwnerMessages.jsx'
import OwnerOffersPage from './pages/OwnerOffersPage.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import HotelMenu from './pages/HotelMenu.jsx'
import AboutUs from './pages/AboutUs.jsx'
import CustomerFeedback from './pages/CustomerFeedback.jsx'
import BudgetHotel from './pages/BudgetHotel.jsx'

function BudgetTokenRedirect() {
  const { token } = useParams()
  return <Navigate to={`/hotel/${token}`} replace />
}

function Protected({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="page"><p style={{fontFamily:'JetBrains Mono',fontSize:11}}>Loading…</p></div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

const VIDEOS = {
  colombo:   '/Loop%20Colombo.mov',
  galle:     '/Loop%20Galle2.mov',
  arugambay: '/Loop%20Arugambay%202.mov',
  nuwara:    '/NUWARA%20ELIYA.mov',
  yala:      '/YALA2.mov',
}

function bgVideo(pathname) {
  if (pathname === '/')                          return VIDEOS.colombo
  if (pathname === '/login')                     return VIDEOS.nuwara
  if (pathname === '/register')                  return VIDEOS.yala
  if (pathname === '/menu')                      return VIDEOS.galle
  if (pathname.startsWith('/hotel'))             return VIDEOS.arugambay
  if (pathname.startsWith('/dish'))              return VIDEOS.colombo
  if (pathname.startsWith('/about'))             return VIDEOS.nuwara
  if (pathname.startsWith('/feedback'))          return VIDEOS.yala
  if (pathname.startsWith('/favorites'))         return VIDEOS.galle
  if (pathname === '/profile')                   return VIDEOS.arugambay
  return VIDEOS.colombo
}

export default function App() {
  const { pathname } = useLocation()
  const { theme }    = useTheme()
  const hideNavbar   = pathname.startsWith('/owner') || pathname.startsWith('/admin')

  return (
    <>
      <CustomCursor />
      <ScrollAnimator />
      {!hideNavbar && <BackgroundAnimation theme={theme} />}
      {/* Vintage video background — only in 'video' mode on customer-facing pages */}
      {!hideNavbar && theme === 'video' && (
        pathname.startsWith('/hotel')
          ? <VintageBackground playlist={Object.values(VIDEOS)} />
          : <VintageBackground video={bgVideo(pathname)} />
      )}
      <NotificationBar />
      {!hideNavbar && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/"         element={<Home />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/menu"     element={<Menu />} />
        <Route path="/dish/:id" element={<DishDetail />} />
        <Route path="/hotel/:token" element={<HotelMenu />} />
        <Route path="/about"        element={<AboutUs />} />
        <Route path="/feedback"     element={<CustomerFeedback />} />
        <Route path="/budget/:token" element={<BudgetTokenRedirect />} />
        <Route path="/budget"       element={<Navigate to="/menu" replace />} />

        {/* Customer */}
        <Route path="/favorites" element={
          <Protected roles={['customer']}><Favorites /></Protected>
        } />

        {/* Owner — all wrapped in sidebar layout */}
        <Route path="/owner" element={
          <Protected roles={['owner','admin']}>
            <OwnerLayout><OwnerDashboard /></OwnerLayout>
          </Protected>
        } />
        <Route path="/owner/new" element={
          <Protected roles={['owner','admin']}>
            <OwnerLayout><OwnerDishForm /></OwnerLayout>
          </Protected>
        } />
        <Route path="/owner/edit/:id" element={
          <Protected roles={['owner','admin']}>
            <OwnerLayout><OwnerDishForm /></OwnerLayout>
          </Protected>
        } />
        <Route path="/owner/subscription" element={
          <Protected roles={['owner']}>
            <OwnerLayout><OwnerSubscription /></OwnerLayout>
          </Protected>
        } />
        <Route path="/owner/notifications" element={
          <Protected roles={['owner']}>
            <OwnerLayout><OwnerNotifications /></OwnerLayout>
          </Protected>
        } />
        <Route path="/owner/profile" element={
          <Protected roles={['owner']}>
            <OwnerLayout><EditProfile /></OwnerLayout>
          </Protected>
        } />

        {/* Customer profile */}
        <Route path="/profile" element={
          <Protected roles={['customer']}>
            <EditProfile />
          </Protected>
        } />
        <Route path="/owner/messages" element={
          <Protected roles={['owner']}>
            <OwnerLayout><OwnerMessages /></OwnerLayout>
          </Protected>
        } />
        <Route path="/owner/offers" element={
          <Protected roles={['owner']}>
            <OwnerLayout><OwnerOffersPage /></OwnerLayout>
          </Protected>
        } />

        {/* Admin — sidebar layout */}
        <Route path="/admin" element={
          <Protected roles={['admin', 'sub_admin']}>
            <AdminLayout><AdminDashboard /></AdminLayout>
          </Protected>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
      <CookieConsent />
    </>
  )
}
