// =====================================================
// API client — Laravel backend at
// http://localhost/qrious360-backend/public (XAMPP)
// =====================================================
export const API_BASE = '/qrious360-backend/public'

async function request(path, { method = 'GET', body = null, formData = null } = {}) {
  const token = localStorage.getItem('auth_token')
  const controller = new AbortController()
  // File uploads get 5 minutes; regular requests get 30 seconds
  const timer = setTimeout(() => controller.abort(), formData ? 300_000 : 30_000)
  const opts = {
    method,
    credentials: 'include',
    signal: controller.signal,
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }
  if (formData) {
    opts.body = formData
  } else if (body) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(`${API_BASE}/api${path}`, opts)
  } catch (e) {
    clearTimeout(timer)
    if (e.name === 'AbortError') throw new Error(`Request timed out — ${path}`)
    throw new Error(`Network error on ${API_BASE}/api${path} — ${e.message}`)
  }
  clearTimeout(timer)

  const text = await res.text()
  let data
  try { data = text ? JSON.parse(text) : {} }
  catch { throw new Error('Server returned non-JSON response: ' + text.slice(0, 200)) }

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}

// ---------- Auth ----------
export const auth = {
  login:         (email, password) => request('/auth/login',          { method: 'POST', body: { email, password } }),
  register:      (fd)              => request('/auth/register',        { method: 'POST', formData: fd }),
  logout:        ()                => request('/auth/logout',          { method: 'POST' }),
  me:            ()                => request('/auth/me'),
  hotelInfo:     (token)           => request(`/auth/hotel-info?token=${token}`),
  hotels:        ()                => request('/auth/hotels'),
  updateBanner:       (fd) => request('/auth/update-banner',        { method: 'POST', formData: fd }),
  removeBanner:       ()  => { const fd = new FormData(); fd.append('remove', '1'); return request('/auth/update-banner',        { method: 'POST', formData: fd }) },
  updateProfile:      (fd) => request('/auth/update-profile',       { method: 'POST', formData: fd }),
  updateDroneFootage: (fd) => request('/auth/update-drone-footage', { method: 'POST', formData: fd }),
  removeDroneFootage: ()  => { const fd = new FormData(); fd.append('remove', '1'); return request('/auth/update-drone-footage', { method: 'POST', formData: fd }) },
}

// ---------- Dishes ----------
export const dishes = {
  list:            (token) => request(`/dishes${token ? `?token=${token}` : ''}`),
  get:             (id)    => request(`/dishes/${id}`),
  mine:            ()      => request('/dishes/mine'),
  create:          (fd)    => request('/dishes',                   { method: 'POST', formData: fd }),
  update:          (fd)    => request('/dishes/update',            { method: 'POST', formData: fd }),
  remove:          (id)    => request('/dishes/delete',            { method: 'POST', body: { id } }),
  topDishes:       ()      => request('/dishes/top'),
  toggleAvailable: (id)    => request('/dishes/toggle-available',  { method: 'POST', body: { id } }),
}

// ---------- Categories ----------
export const categories = {
  list:       ()      => request('/categories'),
  listPublic: (token) => request(`/categories/public?token=${token}`),
  create:     (name)  => request('/categories',        { method: 'POST', body: { name } }),
  remove:     (id)    => request('/categories/delete', { method: 'POST', body: { id } }),
}

// ---------- Social ----------
export const social = {
  favorites:      ()                        => request('/social/favorites'),
  topReviews:     ()                        => request('/social/top-reviews'),
  featuredVideos: ()                        => request('/social/featured-videos'),
  toggleFavorite: (dishId)                  => request('/social/toggle-favorite', { method: 'POST', body: { dish_id: dishId } }),
  addReview:      (dishId, rating, comment) => request('/social/review',          { method: 'POST', body: { dish_id: dishId, rating, comment } }),
  deleteReview:   (reviewId)                => request('/social/review/delete',   { method: 'POST', body: { review_id: reviewId } }),
  replyReview:    (reviewId, reply)         => request('/social/review/reply',    { method: 'POST', body: { review_id: reviewId, reply } }),
}

// ---------- Notifications ----------
export const notifications = {
  list:        ()   => request('/notifications'),
  unreadCount: ()   => request('/notifications/unread'),
  markRead:    (id) => request('/notifications/read',     { method: 'POST', body: { id } }),
  markAllRead: ()   => request('/notifications/read-all', { method: 'POST' }),
}

// ---------- Subscriptions ----------
export const subscriptions = {
  myList:        ()                         => request('/subscriptions/mine'),
  uploadSlip:    (planId, slipFile)         => { const fd = new FormData(); fd.append('plan_id', planId); fd.append('slip', slipFile); return request('/subscriptions/upload-slip', { method: 'POST', formData: fd }) },
  adminList:     (status = '')              => request(`/subscriptions/admin${status ? `?status=${status}` : ''}`),
  decide:        (subId, action, note = '') => request('/subscriptions/decide',  { method: 'POST', body: { sub_id: subId, action, note } }),
  monthlyIncome: ()                         => request('/subscriptions/income'),
}

// ---------- Subscription Plans ----------
export const subscriptionPlans = {
  list:   ()     => request('/subscription-plans'),
  create: (data) => request('/subscription-plans',        { method: 'POST', body: data }),
  update: (data) => request('/subscription-plans/update', { method: 'POST', body: data }),
  toggle: (id)   => request('/subscription-plans/toggle', { method: 'POST', body: { id } }),
  remove: (id)   => request('/subscription-plans/delete', { method: 'POST', body: { id } }),
}

// ---------- Messages ----------
export const messages = {
  conversations: ()               => request('/messages/conversations'),
  thread:        (withId)         => request(`/messages/thread?with=${withId}`),
  send:          (receiverId, body) => request('/messages/send', { method: 'POST', body: { receiver_id: receiverId, body } }),
  unreadCount:   ()               => request('/messages/unread'),
}

// ---------- Public stats ----------
export const publicStats = () => request('/public-stats')

// ---------- Pages ----------
export const pages = {
  get:         (key)              => request(`/pages?key=${key}`),
  update:      (key, fields)      => request('/pages',              { method: 'POST', body: { key, ...fields } }),
  uploadImage: (key, field, file) => {
    const fd = new FormData()
    fd.append('image', file)
    return request(`/pages/upload-image?key=${key}&field=${field}`, { method: 'POST', formData: fd })
  },
  uploadSlideImage: (file) => {
    const fd = new FormData()
    fd.append('image', file)
    return request('/pages/upload-slide-image', { method: 'POST', formData: fd })
  },
  uploadSlideVideo: (file) => {
    const fd = new FormData()
    fd.append('video', file)
    return request('/pages/upload-slide-video', { method: 'POST', formData: fd })
  },
  uploadMedia: (key, file, caption = '') => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('caption', caption)
    return request(`/pages/upload-media?key=${key}`, { method: 'POST', formData: fd })
  },
  deleteMedia: (key, mediaId) =>
    request('/pages/delete-media', { method: 'POST', body: { key, media_id: mediaId } }),
  updateMediaCaption: (key, mediaId, caption) =>
    request('/pages/update-media-caption', { method: 'POST', body: { key, media_id: mediaId, caption } }),
}

// ---------- Offers ----------
export const offers = {
  list:        ()    => request('/offers'),
  adminList:   ()    => request('/offers/admin'),
  create:      (fd)  => request('/offers',               { method: 'POST', formData: fd }),
  update:      (fd)  => request('/offers/update',        { method: 'POST', formData: fd }),
  toggle:      (id)  => request('/offers/toggle',        { method: 'POST', body: { id } }),
  remove:      (id)  => request('/offers/delete',        { method: 'POST', body: { id } }),
  ownerList:   ()    => request('/offers/mine'),
  ownerCreate: (fd)  => request('/offers/owner',         { method: 'POST', formData: fd }),
  ownerDelete: (id)  => request('/offers/owner/delete',  { method: 'POST', body: { id } }),
}

// ---------- Logs ----------
export const logs = {
  list:  (limit = 100, offset = 0) => request(`/logs?limit=${limit}&offset=${offset}`),
  clear: ()                         => request('/logs/clear', { method: 'POST' }),
}

// ---------- Analytics ----------
export const analytics = {
  track:      (ownerId) => request('/analytics/track',       { method: 'POST', body: { owner_id: ownerId } }),
  hotelStats: ()        => request('/analytics/hotel-stats'),
}

// ---------- Admin ----------
export const admin = {
  users:              ()                      => request('/admin/users'),
  stats:              ()                      => request('/admin/stats'),
  settings:           ()                      => request('/admin/settings'),
  approve:            (userId, approved=true) => request('/admin/approve',      { method: 'POST', body: { user_id: userId, approved } }),
  setRole:            (userId, role)          => request('/admin/set-role',     { method: 'POST', body: { user_id: userId, role } }),
  deleteUser:         (userId)               => request('/admin/delete-user',  { method: 'POST', body: { user_id: userId } }),
  updatePricePerDish: (price)               => request('/admin/update-price',  { method: 'POST', body: { price } }),
}

// ---------- Customer Feedback ----------
export const feedback = {
  submit:   (data)  => request('/feedback',            { method: 'POST', body: data }),
  list:     (status = '') => request(`/feedback${status ? `?status=${status}` : ''}`),
  markRead: (id)    => request('/feedback/mark-read',  { method: 'POST', body: { id } }),
  reply:    (id, reply) => request('/feedback/reply',  { method: 'POST', body: { id, reply } }),
  remove:   (id)    => request('/feedback/delete',     { method: 'POST', body: { id } }),
}

// Helper to build a full image/video URL
export const imageUrl = (path) => path ? `${API_BASE}/uploads/${path}` : ''
