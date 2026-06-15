import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { admin, dishes as dishApi, subscriptions as subApi, subscriptionPlans as plansApi, messages as msgApi, pages as pagesApi, logs as logsApi, analytics, auth as authApi, feedback as feedbackApi, imageUrl, API_BASE } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotify } from '../context/NotificationContext.jsx'

function IncomeChart({ data, formatVal = v => `LKR ${v.toLocaleString()}` }) {
  const [tip, setTip] = useState(null)

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'Barlow Condensed, serif', fontStyle: 'normal', color: 'var(--text-3)', fontSize: 15 }}>
        No approved income yet
      </div>
    )
  }

  const W = 760, H = 220
  const PL = 68, PR = 20, PT = 18, PB = 40
  const pw = W - PL - PR
  const ph = H - PT - PB

  const vals = data.map(d => Number(d.total))
  const maxV = Math.max(...vals)
  const niceMax = maxV === 0 ? 1000 : Math.ceil(maxV / 500) * 500

  const xOf = i => PL + (data.length === 1 ? pw / 2 : (i / (data.length - 1)) * pw)
  const yOf = v => PT + (1 - v / niceMax) * ph

  const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(Number(d.total)), val: Number(d.total), label: d.label }))
  const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaD = lineD + ` L${pts[pts.length - 1].x.toFixed(1)},${(PT + ph).toFixed(1)} L${pts[0].x.toFixed(1)},${(PT + ph).toFixed(1)} Z`
  const gridSteps = [0, 0.25, 0.5, 0.75, 1]
  const colW = data.length > 1 ? pw / (data.length - 1) : pw

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="inc-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines + Y labels */}
      {gridSteps.map(f => {
        const gy = PT + (1 - f) * ph
        const gv = Math.round(f * niceMax)
        return (
          <g key={f}>
            <line x1={PL} y1={gy} x2={W - PR} y2={gy} stroke="var(--border)" strokeWidth="1" />
            <text x={PL - 8} y={gy + 4} textAnchor="end"
              style={{ fill: 'var(--text-3)', fontFamily: 'JetBrains Mono,monospace', fontSize: '10px' }}>
              {gv >= 1000 ? `${(gv / 1000).toFixed(gv % 1000 === 0 ? 0 : 1)}k` : gv}
            </text>
          </g>
        )
      })}

      {/* Area fill */}
      {pts.length > 1 && <path d={areaD} fill="url(#inc-grad)" />}

      {/* Line */}
      {pts.length > 1 && (
        <path d={lineD} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      )}

      {/* Dots + X labels */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill="#f97316" stroke="var(--bg-2)" strokeWidth="2" />
          <text x={p.x} y={H - 4} textAnchor="middle"
            style={{ fill: 'var(--text-3)', fontFamily: 'JetBrains Mono,monospace', fontSize: '9px' }}>
            {p.label}
          </text>
        </g>
      ))}

      {/* Invisible hover zones */}
      {pts.map((p, i) => (
        <rect key={`hz${i}`}
          x={p.x - colW / 2} y={PT} width={colW} height={ph}
          fill="transparent" style={{ cursor: 'crosshair' }}
          onMouseEnter={() => setTip(p)}
          onMouseLeave={() => setTip(null)}
        />
      ))}

      {/* Tooltip */}
      {tip && (() => {
        const tx = Math.max(70, Math.min(tip.x, W - 70))
        return (
          <g>
            <line x1={tip.x} y1={PT} x2={tip.x} y2={PT + ph}
              stroke="#f97316" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
            <rect x={tx - 60} y={tip.y - 46} width={120} height={32} rx={6}
              fill="var(--bg-3)" stroke="#f97316" strokeWidth="1" />
            <text x={tx} y={tip.y - 27} textAnchor="middle"
              style={{ fill: '#f97316', fontFamily: 'JetBrains Mono,monospace', fontSize: '12px', fontWeight: '700' }}>
              {formatVal(tip.val)}
            </text>
            <text x={tx} y={tip.y - 13} textAnchor="middle"
              style={{ fill: 'var(--text-3)', fontFamily: 'JetBrains Mono,monospace', fontSize: '9px' }}>
              {tip.label}
            </text>
          </g>
        )
      })()}
    </svg>
  )
}

/* ── SVG horizontal bar chart for hotel analytics ── */
function HotelViewsChart({ data }) {
  if (!data || data.length === 0) {
    return <div style={{ padding: '32px 0', textAlign: 'center', fontFamily: 'Barlow Condensed, serif', fontStyle: 'normal', color: 'var(--text-3)' }}>No views recorded yet — hotel pages populate this chart as they are visited.</div>
  }
  const top = data.slice(0, 10)
  const maxV = Math.max(...top.map(h => Number(h.view_count)), 1)
  const ROW = 44, PL = 170, PR = 70, PT = 8, W = 760
  const H = PT + top.length * ROW + 8
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
      {top.map((h, i) => {
        const y    = PT + i * ROW
        const barW = Math.max(6, (Number(h.view_count) / maxV) * (W - PL - PR))
        return (
          <g key={h.owner_id}>
            <text x={PL - 10} y={y + ROW / 2 + 5} textAnchor="end"
              style={{ fill: 'var(--text-2)', fontFamily: 'Barlow Condensed,serif', fontSize: '13px' }}>
              {(h.hotel_name || h.owner_name || '—').slice(0, 22)}
            </text>
            <rect x={PL} y={y + 10} width={W - PL - PR} height={ROW - 20} rx={4} fill="var(--bg-3)" />
            <rect x={PL} y={y + 10} width={barW} height={ROW - 20} rx={4}
              fill="#f97316" opacity={Math.max(0.35, 1 - i * 0.08)} />
            <text x={PL + barW + 8} y={y + ROW / 2 + 5}
              style={{ fill: 'var(--text-3)', fontFamily: 'JetBrains Mono,monospace', fontSize: '11px' }}>
              {h.view_count}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function AdminDashboard() {
  const { user: currentAdmin, setUser } = useAuth()
  const notify = useNotify()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') || 'overview')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [dishes, setDishes] = useState([])
  const [subs, setSubs]             = useState([])
  const [incomeData, setIncomeData] = useState([])
  const [loading, setLoading]       = useState(true)

  // Slip preview modal
  const [slipModal, setSlipModal] = useState(null) // null | { url, isPdf }

  // Messages state
  const [convos, setConvos]           = useState([])
  const [activeOwner, setActiveOwner] = useState(null)
  const [thread, setThread]           = useState([])
  const [msgBody, setMsgBody]         = useState('')
  const [sendingMsg, setSendingMsg]   = useState(false)
  const chatBottomRef                 = useRef()

  const isSubAdmin = currentAdmin?.role === 'sub_admin'

  const reload = async () => {
    if (isSubAdmin) { setLoading(false); return }
    setLoading(true)
    try {
      const [s, u, d, sb, inc, cfg] = await Promise.all([
        admin.stats(),
        admin.users(),
        dishApi.mine(),
        subApi.adminList(),
        subApi.monthlyIncome(),
        admin.settings(),
      ])
      setStats(s.stats)
      setUsers(u.users)
      setDishes(d.dishes)
      setSubs(sb.subscriptions)
      setIncomeData(inc.months ?? [])
      setPricePerDish(cfg.price_per_dish ?? 50)
      setPriceInput(String(cfg.price_per_dish ?? 50))
    } catch (err) {
      notify.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [])
  useEffect(() => { setTab(searchParams.get('tab') || 'overview') }, [searchParams])

  // Sub-admins may only access messages and profile
  useEffect(() => {
    if (isSubAdmin && tab !== 'messages' && tab !== 'profile') setTab('messages')
  }, [isSubAdmin])

  // Load message conversations when tab is active
  useEffect(() => {
    if (tab === 'messages') {
      msgApi.conversations().then(d => setConvos(d.conversations)).catch(() => {})
    }
  }, [tab])

  const loadThread = async (owner) => {
    setActiveOwner(owner)
    try {
      const data = await msgApi.thread(owner.id)
      setThread(data.messages)
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)
      // refresh conversations to clear unread
      msgApi.conversations().then(d => setConvos(d.conversations)).catch(() => {})
    } catch (err) { notify.error(err.message) }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!msgBody.trim() || !activeOwner) return
    setSendingMsg(true)
    try {
      await msgApi.send(activeOwner.id, msgBody.trim())
      setMsgBody('')
      const data = await msgApi.thread(activeOwner.id)
      setThread(data.messages)
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)
    } catch (err) { notify.error(err.message) }
    finally { setSendingMsg(false) }
  }

  const approveOwner = async (userId, approved) => {
    try { await admin.approve(userId, approved); reload() }
    catch (err) { notify.error(err.message) }
  }

  const setRole = async (userId, role) => {
    const labels = { admin: 'Super Admin', sub_admin: 'Sub Admin', owner: 'Owner', customer: 'Customer' }
    if (!confirm(`Change this user's role to ${labels[role] ?? role}?`)) return
    try { await admin.setRole(userId, role); reload() }
    catch (err) { notify.error(err.message) }
  }

  const deleteUser = async (userId, name) => {
    if (!confirm(`Delete user "${name}"? This removes all their dishes and reviews.`)) return
    try { await admin.deleteUser(userId); reload() }
    catch (err) { notify.error(err.message) }
  }

  const deleteDish = async (id, name) => {
    if (!confirm(`Delete dish "${name}"?`)) return
    try { await dishApi.remove(id); reload() }
    catch (err) { notify.error(err.message) }
  }

  const decideSub = async (subId, action) => {
    const note = action === 'reject' ? (prompt('Reason for rejection (optional):') ?? '') : ''
    try { await subApi.decide(subId, action, note); reload() }
    catch (err) { notify.error(err.message) }
  }

  const savePricePerDish = async (e) => {
    e.preventDefault()
    const val = parseInt(priceInput, 10)
    if (!val || val < 1) { setPriceErr('Enter a valid price (minimum LKR 1)'); return }
    setPriceSaving(true); setPriceMsg(''); setPriceErr('')
    try {
      const res = await admin.updatePricePerDish(val)
      setPricePerDish(val)
      setPriceMsg(res.message)
      subApi.adminList().then(sb => setSubs(sb.subscriptions)).catch(() => {})
    } catch (err) {
      setPriceErr(err.message)
    } finally {
      setPriceSaving(false)
    }
  }

  const pendingSubs = subs.filter(s => s.status === 'pending')

  // Pricing settings state
  const [pricePerDish, setPricePerDish] = useState(50)
  const [priceInput,   setPriceInput]   = useState('50')
  const [priceSaving,  setPriceSaving]  = useState(false)
  const [priceMsg,     setPriceMsg]     = useState('')
  const [priceErr,     setPriceErr]     = useState('')

  // Plans state
  const [plans,        setPlans]        = useState([])
  const [planForm,     setPlanForm]     = useState({ name: '', dishes: '', price_lkr: '' })
  const [planSaving,   setPlanSaving]   = useState(false)
  const [planMsg,      setPlanMsg]      = useState('')
  const [planErr,      setPlanErr]      = useState('')
  const [planEditId,   setPlanEditId]   = useState(null)
  const [planEditForm, setPlanEditForm] = useState({ name: '', dishes: '', price_lkr: '' })

  // Analytics state
  const [hotelStats,   setHotelStats]   = useState([])
  const [dailyStats,   setDailyStats]   = useState([])
  const [statsLoading, setStatsLoading] = useState(false)

  // Logs state
  const [logsList,    setLogsList]    = useState([])
  const [logsTotal,   setLogsTotal]   = useState(0)
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsOffset,  setLogsOffset]  = useState(0)
  const LOGS_LIMIT = 50

  // Feedback state
  const [feedbacks,     setFeedbacks]     = useState([])
  const [fbFilter,      setFbFilter]      = useState('')
  const [fbLoading,     setFbLoading]     = useState(false)
  const [fbReplyId,     setFbReplyId]     = useState(null)
  const [fbReplyText,   setFbReplyText]   = useState('')
  const [fbReplying,    setFbReplying]    = useState(false)

  const loadFeedbacks = (status = fbFilter) => {
    setFbLoading(true)
    feedbackApi.list(status)
      .then(r => setFeedbacks(r.feedbacks ?? []))
      .catch(() => {})
      .finally(() => setFbLoading(false))
  }

  const submitReply = async (id) => {
    if (!fbReplyText.trim()) return
    setFbReplying(true)
    try {
      await feedbackApi.reply(id, fbReplyText.trim())
      setFbReplyId(null); setFbReplyText('')
      loadFeedbacks()
    } catch (err) { notify.error(err.message) }
    finally { setFbReplying(false) }
  }

  const deleteFeedback = async (id) => {
    if (!confirm('Delete this feedback?')) return
    try { await feedbackApi.remove(id); loadFeedbacks() }
    catch (err) { notify.error(err.message) }
  }

  const markFbRead = async (id) => {
    try { await feedbackApi.markRead(id); loadFeedbacks() }
    catch (err) { notify.error(err.message) }
  }

  // Profile state
  const [profForm,    setProfForm]    = useState({ name: currentAdmin?.name || '', old_password: '', new_password: '', confirm: '' })
  const [profSaving,  setProfSaving]  = useState(false)
  const [profMsg,     setProfMsg]     = useState('')
  const [profErr,     setProfErr]     = useState('')
  const [profAvatar,  setProfAvatar]  = useState(null)
  const [profPreview, setProfPreview] = useState(currentAdmin?.logo_path ? imageUrl(currentAdmin.logo_path) : '')
  const profAvatarRef = useRef()

  // Pages editor state
  const PAGE_IMAGES = {
    home:  [{ field: 'hero_image',   label: 'Hero image (right panel)' }],
    about: [{ field: 'banner_image', label: 'Banner image' }],
  }
  const PAGE_FIELDS = {
    home: [
      { key: 'eyebrow',    label: 'Eyebrow text',    type: 'input' },
      { key: 'heading',    label: 'Heading',          type: 'input' },
      { key: 'heading_em', label: 'Heading (italic)', type: 'input' },
      { key: 'lead',       label: 'Lead paragraph',   type: 'textarea' },
      { key: 'step1_num',  label: 'Step 1 — number',  type: 'input' },
      { key: 'step1_title',label: 'Step 1 — title',   type: 'input' },
      { key: 'step1_desc', label: 'Step 1 — text',    type: 'textarea' },
      { key: 'step2_num',  label: 'Step 2 — number',  type: 'input' },
      { key: 'step2_title',label: 'Step 2 — title',   type: 'input' },
      { key: 'step2_desc', label: 'Step 2 — text',    type: 'textarea' },
      { key: 'step3_num',  label: 'Step 3 — number',  type: 'input' },
      { key: 'step3_title',label: 'Step 3 — title',   type: 'input' },
      { key: 'step3_desc', label: 'Step 3 — text',    type: 'textarea' },
    ],
    about: [
      { key: 'heading',        label: 'Heading',              type: 'input' },
      { key: 'heading_em',     label: 'Heading (italic)',     type: 'input' },
      { key: 'intro',          label: 'Intro paragraph',      type: 'textarea' },
      { key: 'mission',        label: 'Mission paragraph',    type: 'textarea' },
      { key: 'feature1_title', label: 'Feature 1 — title',   type: 'input' },
      { key: 'feature1_text',  label: 'Feature 1 — text',    type: 'textarea' },
      { key: 'feature2_title', label: 'Feature 2 — title',   type: 'input' },
      { key: 'feature2_text',  label: 'Feature 2 — text',    type: 'textarea' },
      { key: 'feature3_title', label: 'Feature 3 — title',   type: 'input' },
      { key: 'feature3_text',  label: 'Feature 3 — text',    type: 'textarea' },
    ],
  }
  // Banners state
  const EMPTY_SLIDE = { eyebrow: '', heading: '', heading_em: '', sub: '', cta_text: '', cta_url: '', gradient: 'linear-gradient(135deg, rgba(212,150,58,.18) 0%, rgba(214,58,94,.12) 100%)', image_path: '', video_path: '' }
  const [bannerSlides,        setBannerSlides]        = useState([{ ...EMPTY_SLIDE }])
  const [bannerSaving,        setBannerSaving]        = useState(false)
  const [bannerMsg,           setBannerMsg]           = useState('')
  const [bannerErr,           setBannerErr]           = useState('')
  const [bannerLoading,       setBannerLoading]       = useState(false)
  const [slideImgUploading,   setSlideImgUploading]   = useState({})  // { idx: bool }
  const [slideImgPreviews,    setSlideImgPreviews]    = useState({})  // { idx: objectURL }
  const [slideVidUploading,   setSlideVidUploading]   = useState({})  // { idx: bool }
  const [slideVidPreviews,    setSlideVidPreviews]    = useState({})  // { idx: objectURL }

  const loadBanners = () => {
    setBannerLoading(true)
    pagesApi.get('banners')
      .then(d => { if (Array.isArray(d.content?.slides) && d.content.slides.length) setBannerSlides(d.content.slides) })
      .catch(() => {})
      .finally(() => setBannerLoading(false))
  }

  const saveBanners = async () => {
    setBannerSaving(true)
    setBannerMsg('')
    setBannerErr('')
    try {
      const res = await pagesApi.update('banners', { slides: bannerSlides })
      setBannerMsg(res.message ?? 'Banners saved.')
    } catch (err) {
      setBannerErr(err.message)
    } finally {
      setBannerSaving(false)
    }
  }

  const updateSlide = (i, field, val) => setBannerSlides(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  const addSlide    = () => setBannerSlides(prev => [...prev, { ...EMPTY_SLIDE }])
  const removeSlide = (i) => {
    setBannerSlides(prev => prev.filter((_, idx) => idx !== i))
    setSlideImgPreviews(prev => { const n = { ...prev }; delete n[i]; return n })
    setSlideVidPreviews(prev => { const n = { ...prev }; delete n[i]; return n })
  }
  const moveSlide = (i, dir) => setBannerSlides(prev => {
    const next = [...prev]
    const j = i + dir
    if (j < 0 || j >= next.length) return prev;
    [next[i], next[j]] = [next[j], next[i]]
    return next
  })

  const uploadSlideImage = async (i, file) => {
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setSlideImgPreviews(prev => ({ ...prev, [i]: previewUrl }))
    setSlideImgUploading(prev => ({ ...prev, [i]: true }))
    setBannerErr('')
    try {
      const res = await pagesApi.uploadSlideImage(file)
      updateSlide(i, 'image_path', res.path)
    } catch (err) {
      setBannerErr(`Slide ${i + 1} image: ${err.message}`)
    } finally {
      setSlideImgUploading(prev => ({ ...prev, [i]: false }))
    }
  }

  const removeSlideImage = (i) => {
    updateSlide(i, 'image_path', '')
    setSlideImgPreviews(prev => { const n = { ...prev }; delete n[i]; return n })
  }

  const uploadSlideVideo = async (i, file) => {
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setSlideVidPreviews(prev => ({ ...prev, [i]: previewUrl }))
    setSlideVidUploading(prev => ({ ...prev, [i]: true }))
    setBannerErr('')
    try {
      const res = await pagesApi.uploadSlideVideo(file)
      updateSlide(i, 'video_path', res.path)
    } catch (err) {
      setBannerErr(`Slide ${i + 1} video: ${err.message}`)
    } finally {
      setSlideVidUploading(prev => ({ ...prev, [i]: false }))
    }
  }

  const removeSlideVideo = (i) => {
    updateSlide(i, 'video_path', '')
    setSlideVidPreviews(prev => { const n = { ...prev }; delete n[i]; return n })
  }

  useEffect(() => { if (tab === 'banners') loadBanners() }, [tab])

  const [pageKey,     setPageKey]     = useState('home')
  const [pageContent, setPageContent] = useState({})
  const [pageLoading, setPageLoading] = useState(false)
  const [pageSaving,  setPageSaving]  = useState(false)
  const [pageMsg,        setPageMsg]        = useState('')
  const [pageErr,        setPageErr]        = useState('')
  const [imgFiles,       setImgFiles]       = useState({})   // { field: File }
  const [imgUploading,   setImgUploading]   = useState({})   // { field: bool }
  const [imgPreviews,    setImgPreviews]    = useState({})   // { field: objectURL }

  const loadPage = (key) => {
    setPageKey(key)
    setPageMsg('')
    setPageErr('')
    setImgFiles({})
    setImgPreviews({})
    setPageLoading(true)
    pagesApi.get(key)
      .then(d => setPageContent(d.content))
      .catch(err => setPageErr(err.message))
      .finally(() => setPageLoading(false))
  }

  const pickImage = (field, file) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setImgFiles(prev => ({ ...prev, [field]: file }))
    setImgPreviews(prev => ({ ...prev, [field]: url }))
  }

  const uploadImage = async (field) => {
    const file = imgFiles[field]
    if (!file) return
    setImgUploading(prev => ({ ...prev, [field]: true }))
    setPageMsg('')
    setPageErr('')
    try {
      const res = await pagesApi.uploadImage(pageKey, field, file)
      setPageContent(prev => ({ ...prev, [field]: res.path }))
      setImgFiles(prev => ({ ...prev, [field]: null }))
      setImgPreviews(prev => ({ ...prev, [field]: null }))
      setPageMsg(res.message)
    } catch (err) {
      setPageErr(err.message)
    } finally {
      setImgUploading(prev => ({ ...prev, [field]: false }))
    }
  }

  useEffect(() => {
    if (tab === 'pages') loadPage(pageKey)
  }, [tab])

  useEffect(() => {
    if (tab !== 'analytics') return
    setStatsLoading(true)
    analytics.hotelStats()
      .then(d => { setHotelStats(d.hotels ?? []); setDailyStats(d.daily ?? []) })
      .catch(() => {})
      .finally(() => setStatsLoading(false))
  }, [tab])

  useEffect(() => {
    if (tab !== 'logs') return
    setLogsLoading(true)
    logsApi.list(LOGS_LIMIT, logsOffset)
      .then(d => { setLogsList(d.logs ?? []); setLogsTotal(d.total ?? 0) })
      .catch(() => {})
      .finally(() => setLogsLoading(false))
  }, [tab, logsOffset])

  useEffect(() => {
    if (tab !== 'profile') return
    setProfForm(prev => ({ ...prev, name: currentAdmin?.name ?? '' }))
  }, [tab, currentAdmin])

  useEffect(() => {
    if (tab === 'feedback') loadFeedbacks(fbFilter)
  }, [tab, fbFilter])   // eslint-disable-line

  // Plans tab
  const loadPlans = () => {
    plansApi.list().then(r => setPlans(r.plans ?? [])).catch(() => {})
  }
  useEffect(() => { if (tab === 'plans') loadPlans() }, [tab])

  const createPlan = async (e) => {
    e.preventDefault()
    setPlanSaving(true); setPlanMsg(''); setPlanErr('')
    try {
      const res = await plansApi.create({
        name:      planForm.name,
        dishes:    parseInt(planForm.dishes, 10),
        price_lkr: parseFloat(planForm.price_lkr),
      })
      setPlanMsg(res.message)
      setPlanForm({ name: '', dishes: '', price_lkr: '' })
      loadPlans()
    } catch (err) { setPlanErr(err.message) }
    finally { setPlanSaving(false) }
  }

  const savePlanEdit = async (e) => {
    e.preventDefault()
    try {
      await plansApi.update({
        id:        planEditId,
        name:      planEditForm.name,
        dishes:    parseInt(planEditForm.dishes, 10),
        price_lkr: parseFloat(planEditForm.price_lkr),
      })
      setPlanEditId(null)
      loadPlans()
    } catch (err) { notify.error(err.message) }
  }

  const togglePlan = async (id) => {
    try { await plansApi.toggle(id); loadPlans() }
    catch (err) { notify.error(err.message) }
  }

  const deletePlan = async (id, name) => {
    if (!confirm(`Delete plan "${name}"? This cannot be undone.`)) return
    try { await plansApi.remove(id); loadPlans() }
    catch (err) { notify.error(err.message) }
  }

  // ── Media tab state ──────────────────────────────────────────────────────
  const [mediaKey,       setMediaKey]       = useState('home')
  const [mediaItems,     setMediaItems]     = useState([])
  const [mediaLoading,   setMediaLoading]   = useState(false)
  const [mediaUploading, setMediaUploading] = useState(false)
  const [mediaCaption,   setMediaCaption]   = useState('')
  const [mediaFile,      setMediaFile]      = useState(null)
  const [mediaPreview,   setMediaPreview]   = useState('')
  const [mediaMsg,       setMediaMsg]       = useState('')
  const [mediaErr,       setMediaErr]       = useState('')
  const mediaFileRef = useRef()

  const loadMedia = (key = mediaKey) => {
    setMediaLoading(true)
    setMediaMsg(''); setMediaErr('')
    pagesApi.get(key)
      .then(d => setMediaItems(d.content?.media ?? []))
      .catch(err => setMediaErr(err.message))
      .finally(() => setMediaLoading(false))
  }

  const uploadMedia = async () => {
    if (!mediaFile) return
    setMediaUploading(true); setMediaMsg(''); setMediaErr('')
    try {
      const res = await pagesApi.uploadMedia(mediaKey, mediaFile, mediaCaption)
      setMediaItems(prev => [...prev, res.item])
      setMediaFile(null); setMediaCaption(''); setMediaPreview('')
      if (mediaFileRef.current) mediaFileRef.current.value = ''
      setMediaMsg('Uploaded successfully.')
    } catch (err) { setMediaErr(err.message) }
    finally { setMediaUploading(false) }
  }

  const deleteMedia = async (id) => {
    if (!confirm('Delete this media item?')) return
    try {
      await pagesApi.deleteMedia(mediaKey, id)
      setMediaItems(prev => prev.filter(m => m.id !== id))
    } catch (err) { notify.error(err.message) }
  }

  const saveMediaCaption = async (id, caption) => {
    try {
      await pagesApi.updateMediaCaption(mediaKey, id, caption)
      setMediaItems(prev => prev.map(m => m.id === id ? { ...m, caption } : m))
    } catch (err) { notify.error(err.message) }
  }

  useEffect(() => { if (tab === 'media') loadMedia(mediaKey) }, [tab, mediaKey])


  const saveProfile = async (e) => {
    e.preventDefault()
    setProfMsg('')
    setProfErr('')
    if (profForm.new_password && profForm.new_password !== profForm.confirm) {
      setProfErr('New passwords do not match.')
      return
    }
    setProfSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', profForm.name)
      if (profForm.old_password) fd.append('old_password', profForm.old_password)
      if (profForm.new_password) fd.append('new_password', profForm.new_password)
      if (profAvatar) fd.append('logo', profAvatar)
      const res = await authApi.updateProfile(fd)
      setProfMsg(res.message ?? 'Profile updated.')
      if (setUser) setUser(res.user)
      setProfAvatar(null)
      setProfForm(prev => ({ ...prev, old_password: '', new_password: '', confirm: '' }))
    } catch (err) {
      setProfErr(err.message)
    } finally {
      setProfSaving(false)
    }
  }

  const clearLogs = async () => {
    if (!confirm('Clear all activity logs? This cannot be undone.')) return
    try {
      await logsApi.clear()
      setLogsList([])
      setLogsTotal(0)
      setLogsOffset(0)
    } catch (err) {
      notify.error(err.message)
    }
  }

  const savePage = async (e) => {
    e.preventDefault()
    setPageSaving(true)
    setPageMsg('')
    setPageErr('')
    try {
      const res = await pagesApi.update(pageKey, pageContent)
      setPageMsg(res.message)
    } catch (err) {
      setPageErr(err.message)
    } finally {
      setPageSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Administration · System console</div>
          <h1 className="page-title">Admin console.</h1>
        </div>
        <div className="page-sub">
          Logged in as <strong>{currentAdmin?.name}</strong>
        </div>
      </div>

      {loading && <p style={{fontFamily: 'JetBrains Mono', fontSize: 11}}>Loading…</p>}

      {/* OVERVIEW TAB */}
      {!loading && tab === 'overview' && stats && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Total users</div>
              <div className="stat-value">{stats.users}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Hotel owners</div>
              <div className="stat-value">{stats.owners}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Customers</div>
              <div className="stat-value">{stats.customers}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Dishes published</div>
              <div className="stat-value">{stats.dishes}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Reviews left</div>
              <div className="stat-value">{stats.reviews}</div>
            </div>
            <div className="stat-card accent">
              <div className="stat-label">Pending approvals</div>
              <div className="stat-value">{stats.pending_owners}</div>
            </div>
            <div className={`stat-card${stats.pending_subscriptions > 0 ? ' accent' : ''}`}>
              <div className="stat-label">Pending subscriptions</div>
              <div className="stat-value">{stats.pending_subscriptions}</div>
            </div>
          </div>

          {(stats.pending_owners > 0 || stats.pending_subscriptions > 0) && (
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:24 }}>
              {stats.pending_owners > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px', borderRadius:14, border:'1px solid rgba(212,150,58,0.35)', background:'rgba(212,150,58,0.08)', backdropFilter:'blur(8px)' }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'rgba(212,150,58,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🏨</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'JetBrains Mono', fontSize:11, fontWeight:700, color:'var(--amber)', letterSpacing:'0.08em' }}>
                      {stats.pending_owners} hotel owner{stats.pending_owners === 1 ? '' : 's'} awaiting approval
                    </div>
                    <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text-3)', letterSpacing:'0.12em', marginTop:3 }}>
                      Review and approve new hotel registrations
                    </div>
                  </div>
                  <a href="?tab=users" style={{ fontFamily:'JetBrains Mono', fontSize:9, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--amber)', textDecoration:'none', padding:'7px 14px', border:'1px solid rgba(212,150,58,0.4)', borderRadius:8, whiteSpace:'nowrap' }}>
                    Review →
                  </a>
                </div>
              )}
              {stats.pending_subscriptions > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px', borderRadius:14, border:'1px solid rgba(212,150,58,0.35)', background:'rgba(212,150,58,0.08)', backdropFilter:'blur(8px)' }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'rgba(212,150,58,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>💳</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'JetBrains Mono', fontSize:11, fontWeight:700, color:'var(--amber)', letterSpacing:'0.08em' }}>
                      {stats.pending_subscriptions} subscription request{stats.pending_subscriptions === 1 ? '' : 's'} awaiting approval
                    </div>
                    <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text-3)', letterSpacing:'0.12em', marginTop:3 }}>
                      Review payment details and approve or reject
                    </div>
                  </div>
                  <a href="?tab=subscriptions" style={{ fontFamily:'JetBrains Mono', fontSize:9, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--amber)', textDecoration:'none', padding:'7px 14px', border:'1px solid rgba(212,150,58,0.4)', borderRadius:8, whiteSpace:'nowrap' }}>
                    Review →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Monthly income graph */}
          <div style={{ marginTop: 32, padding: 28, border: '1px solid var(--border)', borderRadius: 16, background: 'var(--bg-2)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
              <div className="section-h">Monthly income</div>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--text-3)' }}>
                Approved subscriptions · LKR
              </span>
            </div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <IncomeChart data={incomeData} />
            </div>
          </div>
        </>
      )}

      {/* USERS TAB */}
      {!loading && tab === 'users' && (
        <div className="table-wrap"><table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Dishes</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td data-label="Name">
                  <div style={{fontFamily: 'Barlow Condensed, serif', fontWeight: 500}}>{u.name}</div>
                  {u.hotel_name && (
                    <div style={{fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-2)', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 2}}>
                      {u.hotel_name}
                    </div>
                  )}
                </td>
                <td data-label="Email" style={{fontFamily: 'JetBrains Mono, monospace', fontSize: 12}}>{u.email}</td>
                <td data-label="Role"><span className={`role-pill ${u.role}`}>{u.role}</span></td>
                <td data-label="Dishes">{u.dish_count}</td>
                <td data-label="Status">
                  {u.approved == 1
                    ? <span style={{color: 'var(--good)', fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase'}}>Active</span>
                    : <span style={{color: 'var(--bad)', fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase'}}>Pending</span>
                  }
                </td>
                <td data-label="Joined" style={{fontFamily: 'JetBrains Mono, monospace', fontSize: 11}}>
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td data-label="Actions">
                  <div className="actions">
                    {/* Approve / Suspend — owner rows only */}
                    {u.role === 'owner' && u.approved == 0 && (
                      <button className="tbl-btn tbl-btn-approve" onClick={() => approveOwner(u.id, true)}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Approve
                      </button>
                    )}
                    {u.role === 'owner' && u.approved == 1 && (
                      <button className="tbl-btn tbl-btn-suspend" onClick={() => approveOwner(u.id, false)}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                        Suspend
                      </button>
                    )}

                    {/* Role-change buttons — customers → sub_admin only; sub_admins can be revoked */}
                    {currentAdmin?.role === 'admin' && u.role === 'customer' && (
                      <button className="tbl-btn tbl-btn-role" onClick={() => setRole(u.id, 'sub_admin')}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
                        Sub Admin
                      </button>
                    )}
                    {currentAdmin?.role === 'admin' && u.role === 'sub_admin' && (
                      <button className="tbl-btn tbl-btn-suspend" onClick={() => setRole(u.id, 'customer')}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Revoke
                      </button>
                    )}

                    {/* Delete — never self; separator only when something else precedes it */}
                    {currentAdmin?.role === 'admin' && u.id != currentAdmin?.id && (
                      <>
                        {u.role !== 'admin' && <span className="tbl-btn-sep"/>}
                        <button className="tbl-btn tbl-btn-danger" onClick={() => deleteUser(u.id, u.name)}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      {/* DISHES TAB */}
      {!loading && tab === 'dishes' && (
        <div className="table-wrap"><table className="data-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Dish</th>
              <th>Hotel</th>
              <th>Price</th>
              <th>Visible</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dishes.map(d => (
              <tr key={d.id}>
                <td data-label="Photo"><img className="thumb-mini" src={imageUrl(d.image_path)} alt="" /></td>
                <td data-label="Dish" style={{fontFamily: 'Barlow Condensed, serif', fontSize: 16, fontWeight: 500}}>{d.name}</td>
                <td data-label="Hotel" style={{fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text-2)', letterSpacing: '0.14em', textTransform: 'uppercase'}}>
                  {d.hotel_name || d.owner_name}
                </td>
                <td data-label="Price" style={{color: 'var(--amber)', fontWeight: 500}}>${Number(d.price).toFixed(2)}</td>
                <td data-label="Visible">
                  <span className={`role-pill ${d.available == 1 ? 'owner' : 'customer'}`}>
                    {d.available == 1 ? 'Live' : 'Hidden'}
                  </span>
                </td>
                <td data-label="Actions">
                  <div className="actions">
                    <Link to={`/dish/${d.id}`} style={{ textDecoration: 'none' }}>
                      <span className="tbl-btn tbl-btn-view">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        View
                      </span>
                    </Link>
                    <Link to={`/owner/edit/${d.id}`} style={{ textDecoration: 'none' }}>
                      <span className="tbl-btn tbl-btn-edit">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit
                      </span>
                    </Link>
                    <span className="tbl-btn-sep"/>
                    <button className="tbl-btn tbl-btn-danger" onClick={() => deleteDish(d.id, d.name)}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      {/* MESSAGES TAB */}
      {tab === 'messages' && (
        <div className="admin-messages-grid" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 0, border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', minHeight: 520, background: 'var(--bg-2)', minWidth: 0 }}>
          {/* Owner list */}
          <div className="admin-convo-list" style={{ borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-3)' }}>
              Hotel owners
            </div>
            {convos.length === 0 ? (
              <div style={{ padding: 24, fontFamily: 'Barlow Condensed, serif', fontStyle: 'normal', color: 'var(--text-3)', fontSize: 14 }}>No owners yet</div>
            ) : convos.map(c => (
              <div
                key={c.id}
                onClick={() => loadThread(c)}
                style={{
                  padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                  background: activeOwner?.id === c.id ? 'var(--bg-3)' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontFamily: 'Barlow Condensed, serif', fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </div>
                  {c.unread > 0 && <span className="sidebar-notif-badge">{c.unread}</span>}
                </div>
                {c.hotel_name && (
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--text-3)', marginTop: 2 }}>{c.hotel_name}</div>
                )}
                {c.last_message && (
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-3)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.last_message}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Thread panel */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {!activeOwner ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Barlow Condensed, serif', fontStyle: 'normal', color: 'var(--text-3)' }}>
                Select an owner to start a conversation
              </div>
            ) : (
              <>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="sidebar-hotel-logo-placeholder" style={{ width: 30, height: 30, fontSize: 13, flexShrink: 0 }}>
                    {(activeOwner.name || 'O')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Barlow Condensed, serif', fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{activeOwner.name}</div>
                    {activeOwner.hotel_name && (
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--text-3)' }}>{activeOwner.hotel_name}</div>
                    )}
                  </div>
                </div>
                <div className="chat-thread" style={{ flex: 1 }}>
                  {thread.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, fontFamily: 'Barlow Condensed, serif', fontStyle: 'normal', color: 'var(--text-3)' }}>No messages yet</div>
                  ) : thread.map(m => {
                    const mine = m.sender_role === 'admin'
                    return (
                      <div key={m.id} className={`chat-bubble-wrap ${mine ? 'mine' : 'theirs'}`}>
                        <div className={`chat-bubble ${mine ? 'mine' : 'theirs'}`}>{m.body}</div>
                        <div className="chat-ts">{new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    )
                  })}
                  <div ref={chatBottomRef} />
                </div>
                <form onSubmit={sendMessage} className="chat-input-row">
                  <textarea
                    className="field-textarea chat-input"
                    placeholder={`Message ${activeOwner.name}…`}
                    value={msgBody}
                    onChange={e => setMsgBody(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e) } }}
                    rows={2}
                  />
                  <button className="btn" disabled={sendingMsg || !msgBody.trim()} style={{ alignSelf: 'flex-end', minWidth: 80 }}>
                    {sendingMsg ? '…' : 'Send'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* SUBSCRIPTIONS TAB */}
      {!loading && tab === 'subscriptions' && (() => {
        const pendingList = subs.filter(s => s.status === 'pending')
        const historyList = subs.filter(s => s.status !== 'pending')
        const fmtDate = (d) => d ? new Date(d).toLocaleDateString(undefined, { day:'numeric', month:'short', year:'numeric' }) : '—'

        const SlipCell = ({ s }) => {
          if (!s.slip_path) return <span style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text-3)' }}>—</span>
          const url   = imageUrl(s.slip_path)
          const isPdf = s.slip_path.endsWith('.pdf')
          return (
            <button
              onClick={() => setSlipModal({ url, isPdf })}
              style={{ background:'none', border:'none', padding:0, cursor:'pointer', display:'inline-block' }}
              title="View payment slip"
            >
              {isPdf ? (
                <span style={{ fontFamily:'JetBrains Mono', fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--amber)', textDecoration:'underline' }}>View PDF</span>
              ) : (
                <img src={url} alt="slip" style={{ width:60, height:46, objectFit:'cover', borderRadius:7, border:'2px solid transparent', display:'block', transition:'border-color 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.borderColor='var(--amber)'}
                  onMouseOut={e => e.currentTarget.style.borderColor='transparent'}
                />
              )}
            </button>
          )
        }

        return (
          <>
            {/* ── Section 1: Pending Approvals ── */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:22, letterSpacing:'0.04em', color:'var(--amber)' }}>
                  Pending Approvals
                </div>
                {pendingList.length > 0 && (
                  <span style={{ fontFamily:'JetBrains Mono', fontSize:9, padding:'3px 10px', borderRadius:20, background:'rgba(245,166,35,0.15)', border:'1px solid rgba(245,166,35,0.4)', color:'var(--amber)', letterSpacing:'0.12em' }}>
                    {pendingList.length} awaiting
                  </span>
                )}
                <div style={{ flex:1, height:1, background:'var(--border)' }} />
                <span style={{ fontFamily:'JetBrains Mono', fontSize:9, textTransform:'uppercase', letterSpacing:'0.16em', color:'var(--text-3)' }}>
                  Verify slip and approve or reject
                </span>
              </div>

              {pendingList.length === 0 ? (
                <div style={{ padding:'28px 24px', borderRadius:14, border:'1px dashed var(--border)', background:'var(--bg-2)', textAlign:'center' }}>
                  <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text-3)', letterSpacing:'0.12em' }}>No pending approvals</div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  {pendingList.map(s => (
                    <div key={s.id} style={{ display:'flex', gap:20, padding:'20px 22px', borderRadius:14, border:'1px solid rgba(245,166,35,0.45)', background:'rgba(245,166,35,0.06)', alignItems:'flex-start', flexWrap:'wrap' }}>
                      {/* Slip */}
                      <div style={{ flexShrink:0 }}>
                        <div style={{ fontFamily:'JetBrains Mono', fontSize:8, textTransform:'uppercase', letterSpacing:'0.18em', color:'var(--text-3)', marginBottom:6 }}>Payment slip</div>
                        <SlipCell s={s} />
                      </div>

                      {/* Owner + details grid */}
                      <div style={{ flex:1, minWidth:220 }}>
                        <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:12 }}>
                          <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:19, color:'var(--text)' }}>{s.owner_name}</div>
                          {s.hotel_name && (
                            <div style={{ fontFamily:'JetBrains Mono', fontSize:9, textTransform:'uppercase', letterSpacing:'0.16em', color:'var(--text-3)' }}>{s.hotel_name}</div>
                          )}
                        </div>
                        <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text-3)', letterSpacing:'0.12em', marginBottom:14 }}>{s.owner_email}</div>

                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(110px,1fr))', gap:'8px 20px' }}>
                          {[
                            ['Plan',        s.plan_name ?? `${s.dishes_requested} dishes`],
                            ['Dishes',      `+${s.dishes_requested}`],
                            ['Amount',      `LKR ${Number(s.amount_lkr).toLocaleString()}`],
                            ['Submitted',   fmtDate(s.created_at)],
                            ['Est. expiry', fmtDate(new Date(Date.now() + 30*24*60*60*1000))],
                          ].map(([k, v]) => (
                            <div key={k}>
                              <div style={{ fontFamily:'JetBrains Mono', fontSize:8, textTransform:'uppercase', letterSpacing:'0.18em', color:'var(--text-3)', marginBottom:2 }}>{k}</div>
                              <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:16, fontWeight:700, color: k === 'Amount' ? 'var(--amber)' : k === 'Dishes' ? 'var(--good)' : 'var(--text)' }}>{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display:'flex', flexDirection:'column', gap:10, flexShrink:0 }}>
                        <button className="tbl-btn tbl-btn-approve" style={{ padding:'10px 20px', fontSize:12 }} onClick={() => decideSub(s.id, 'approve')}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Approve
                        </button>
                        <button className="tbl-btn tbl-btn-danger" style={{ padding:'10px 20px', fontSize:12 }} onClick={() => decideSub(s.id, 'reject')}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Section 2: Quota History ── */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:22, letterSpacing:'0.04em', color:'var(--text)' }}>
                  Quota History
                </div>
                <div style={{ flex:1, height:1, background:'var(--border)' }} />
                <span style={{ fontFamily:'JetBrains Mono', fontSize:9, textTransform:'uppercase', letterSpacing:'0.16em', color:'var(--text-3)' }}>
                  All approved & rejected requests
                </span>
              </div>

              {historyList.length === 0 ? (
                <div style={{ padding:'28px 24px', borderRadius:14, border:'1px dashed var(--border)', background:'var(--bg-2)', textAlign:'center' }}>
                  <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text-3)', letterSpacing:'0.12em' }}>No history yet</div>
                </div>
              ) : (
                <div className="table-wrap"><table className="data-table">
                  <thead>
                    <tr>
                      <th>Owner</th>
                      <th>Hotel</th>
                      <th>Dishes</th>
                      <th>Amount (LKR)</th>
                      <th>Slip</th>
                      <th>Purchased</th>
                      <th>Expires</th>
                      <th>Status</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.map(s => {
                      const expired = s.status === 'approved' && s.expires_at && new Date(s.expires_at) < new Date()
                      const active  = s.status === 'approved' && s.expires_at && new Date(s.expires_at) >= new Date()
                      return (
                        <tr key={s.id} style={expired ? { background:'rgba(239,68,68,0.04)' } : {}}>
                          <td data-label="Owner">
                            <div style={{ fontFamily:'Barlow Condensed, serif', fontWeight:500 }}>{s.owner_name}</div>
                            <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text-3)', letterSpacing:'0.12em' }}>{s.owner_email}</div>
                          </td>
                          <td data-label="Hotel" style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                            {s.hotel_name || '—'}
                          </td>
                          <td data-label="Dishes">
                            <div style={{ color:'var(--good)', fontWeight:600, fontFamily:'Barlow Condensed, serif', fontSize:16 }}>+{s.dishes_requested}</div>
                            {s.plan_name && <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text-3)' }}>{s.plan_name}</div>}
                          </td>
                          <td data-label="Amount (LKR)" style={{ color:'var(--amber)', fontWeight:600 }}>{Number(s.amount_lkr).toLocaleString()}</td>
                          <td data-label="Slip"><SlipCell s={s} /></td>
                          <td data-label="Purchased" style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text-2)' }}>{fmtDate(s.created_at)}</td>
                          <td data-label="Expires" style={{ fontFamily:'JetBrains Mono', fontSize:11, color: expired ? 'var(--bad)' : active ? 'var(--good)' : 'var(--text-3)' }}>
                            {s.expires_at ? fmtDate(s.expires_at) : '—'}
                          </td>
                          <td data-label="Status">
                            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                              <span className={`role-pill ${s.status === 'approved' ? 'owner' : s.status === 'rejected' ? 'customer' : ''}`}>
                                {s.status}
                              </span>
                              {expired && (
                                <span style={{ display:'inline-block', fontFamily:'JetBrains Mono', fontSize:8, textTransform:'uppercase', letterSpacing:'0.14em', padding:'2px 7px', borderRadius:20, background:'rgba(239,68,68,0.14)', border:'1px solid rgba(239,68,68,0.4)', color:'var(--bad)', whiteSpace:'nowrap' }}>
                                  expired
                                </span>
                              )}
                              {active && (
                                <span style={{ display:'inline-block', fontFamily:'JetBrains Mono', fontSize:8, textTransform:'uppercase', letterSpacing:'0.14em', padding:'2px 7px', borderRadius:20, background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.35)', color:'var(--good)', whiteSpace:'nowrap' }}>
                                  active
                                </span>
                              )}
                            </div>
                          </td>
                          <td data-label="Note" style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text-3)', maxWidth:140 }}>
                            {s.note || '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table></div>
              )}
            </div>
          </>
        )
      })()}
      {/* PLANS TAB */}
      {!loading && tab === 'plans' && (
        <>
          {/* Create plan form */}
          <div style={{ marginBottom:32, padding:'22px 26px', borderRadius:14, border:'1px solid var(--border)', background:'var(--bg-2)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
              <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:20, letterSpacing:'0.04em', color:'var(--text)' }}>
                Create Subscription Plan
              </div>
              <div style={{ flex:1, height:1, background:'var(--border)' }} />
            </div>

            {planMsg && (
              <div style={{ border:'1px solid var(--good)', background:'rgba(74,222,128,0.1)', color:'var(--good)', padding:'10px 14px', borderRadius:8, marginBottom:14, fontFamily:'JetBrains Mono', fontSize:11, letterSpacing:'0.1em' }}>
                {planMsg}
              </div>
            )}
            {planErr && <div className="error" style={{ marginBottom:14 }}>{planErr}</div>}

            <form onSubmit={createPlan} style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
              <div style={{ flex:'1 1 160px' }}>
                <label style={{ fontFamily:'JetBrains Mono', fontSize:8, textTransform:'uppercase', letterSpacing:'0.18em', color:'var(--text-3)', display:'block', marginBottom:6 }}>Plan Name</label>
                <input className="field-input" value={planForm.name} onChange={e => { setPlanForm(p => ({ ...p, name: e.target.value })); setPlanMsg(''); setPlanErr('') }} placeholder="e.g. Basic" required style={{ width:'100%' }} />
              </div>
              <div style={{ flex:'0 1 130px' }}>
                <label style={{ fontFamily:'JetBrains Mono', fontSize:8, textTransform:'uppercase', letterSpacing:'0.18em', color:'var(--text-3)', display:'block', marginBottom:6 }}>Dishes allowed</label>
                <input className="field-input" type="number" min="1" value={planForm.dishes} onChange={e => { setPlanForm(p => ({ ...p, dishes: e.target.value })); setPlanMsg(''); setPlanErr('') }} placeholder="e.g. 25" required style={{ width:'100%' }} />
              </div>
              <div style={{ flex:'0 1 160px' }}>
                <label style={{ fontFamily:'JetBrains Mono', fontSize:8, textTransform:'uppercase', letterSpacing:'0.18em', color:'var(--text-3)', display:'block', marginBottom:6 }}>Price (LKR / month)</label>
                <input className="field-input" type="number" min="1" step="0.01" value={planForm.price_lkr} onChange={e => { setPlanForm(p => ({ ...p, price_lkr: e.target.value })); setPlanMsg(''); setPlanErr('') }} placeholder="e.g. 5000" required style={{ width:'100%' }} />
              </div>
              <button className="btn" type="submit" disabled={planSaving} style={{ flexShrink:0 }}>
                {planSaving ? 'Creating…' : 'Create Plan'}
              </button>
            </form>
          </div>

          {/* Plans list */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:22, letterSpacing:'0.04em', color:'var(--text)' }}>
                Subscription Plans
              </div>
              <span style={{ fontFamily:'JetBrains Mono', fontSize:9, padding:'3px 10px', borderRadius:20, background:'var(--bg-3)', border:'1px solid var(--border)', color:'var(--text-3)', letterSpacing:'0.12em' }}>
                {plans.length} total
              </span>
              <div style={{ flex:1, height:1, background:'var(--border)' }} />
              <span style={{ fontFamily:'JetBrains Mono', fontSize:9, textTransform:'uppercase', letterSpacing:'0.16em', color:'var(--text-3)' }}>
                Owners see only active plans
              </span>
            </div>

            {plans.length === 0 ? (
              <div style={{ padding:'28px 24px', borderRadius:14, border:'1px dashed var(--border)', background:'var(--bg-2)', textAlign:'center' }}>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text-3)', letterSpacing:'0.12em' }}>No plans yet — create one above</div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {plans.map(plan => (
                  <div key={plan.id} style={{ display:'flex', gap:16, alignItems:'center', padding:'18px 22px', borderRadius:12, border:`1px solid ${plan.is_active ? 'var(--border)' : 'rgba(239,68,68,0.25)'}`, background: plan.is_active ? 'var(--bg-2)' : 'rgba(239,68,68,0.03)', flexWrap:'wrap' }}>
                    {planEditId === plan.id ? (
                      <form onSubmit={savePlanEdit} style={{ flex:1, display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
                        <input className="field-input" value={planEditForm.name} onChange={e => setPlanEditForm(p => ({ ...p, name: e.target.value }))} placeholder="Plan name" required style={{ flex:'1 1 140px' }} />
                        <input className="field-input" type="number" min="1" value={planEditForm.dishes} onChange={e => setPlanEditForm(p => ({ ...p, dishes: e.target.value }))} placeholder="Dishes" required style={{ flex:'0 1 100px' }} />
                        <input className="field-input" type="number" min="1" value={planEditForm.price_lkr} onChange={e => setPlanEditForm(p => ({ ...p, price_lkr: e.target.value }))} placeholder="Price LKR" required style={{ flex:'0 1 130px' }} />
                        <button className="btn" type="submit" style={{ flexShrink:0 }}>Save</button>
                        <button type="button" className="btn btn-ghost" onClick={() => setPlanEditId(null)} style={{ flexShrink:0 }}>Cancel</button>
                      </form>
                    ) : (
                      <>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:20, color: plan.is_active ? 'var(--text)' : 'var(--text-3)', marginBottom:2 }}>
                            {plan.name}
                          </div>
                          <div style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--text-3)', letterSpacing:'0.1em' }}>
                            {plan.dishes} dishes · LKR {Number(plan.price_lkr).toLocaleString()} / month
                          </div>
                        </div>
                        <span style={{ fontFamily:'JetBrains Mono', fontSize:9, padding:'3px 10px', borderRadius:20, background: plan.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)', border:`1px solid ${plan.is_active ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.25)'}`, color: plan.is_active ? 'var(--good)' : 'var(--bad)', flexShrink:0 }}>
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button className="tbl-btn" onClick={() => { setPlanEditId(plan.id); setPlanEditForm({ name: plan.name, dishes: String(plan.dishes), price_lkr: String(plan.price_lkr) }) }} style={{ flexShrink:0 }}>
                          Edit
                        </button>
                        <button className={`tbl-btn ${plan.is_active ? 'tbl-btn-danger' : 'tbl-btn-approve'}`} onClick={() => togglePlan(plan.id)} style={{ flexShrink:0 }}>
                          {plan.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="tbl-btn tbl-btn-danger" onClick={() => deletePlan(plan.id, plan.name)} style={{ flexShrink:0 }}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      {/* PAGES TAB */}
      {tab === 'pages' && (
        <div>
          {/* Page selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 32, borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
            {[['home', 'Home page'], ['about', 'About Us']].map(([k, label]) => (
              <button
                key={k}
                onClick={() => loadPage(k)}
                style={{
                  padding: '10px 22px',
                  border: pageKey === k ? '2px solid var(--amber)' : '1px solid var(--border-mid)',
                  borderRadius: 8,
                  background: pageKey === k ? 'rgba(212,150,58,0.12)' : 'var(--bg-3)',
                  color: pageKey === k ? 'var(--amber)' : 'var(--text-2)',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.12em',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {pageErr && <div className="error" style={{ marginBottom: 16 }}>{pageErr}</div>}
          {pageMsg && (
            <div style={{ border: '1px solid var(--good)', background: 'rgba(74,222,128,0.1)', color: 'var(--good)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: '0.12em' }}>
              {pageMsg}
            </div>
          )}

          {pageLoading ? (
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>Loading…</p>
          ) : (
            <form onSubmit={savePage}>

              {/* ── TEXT CONTENT ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.24em', color: 'var(--text-3)' }}>Text content</div>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              {pageKey === 'home' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* Hero text */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label className="field-label" style={{ display: 'block', marginBottom: 6 }}>Eyebrow text</label>
                      <input className="field-input" type="text" value={pageContent.eyebrow ?? ''} onChange={e => setPageContent(p => ({ ...p, eyebrow: e.target.value }))} />
                    </div>
                    <div>
                      <label className="field-label" style={{ display: 'block', marginBottom: 6 }}>Heading</label>
                      <input className="field-input" type="text" value={pageContent.heading ?? ''} onChange={e => setPageContent(p => ({ ...p, heading: e.target.value }))} />
                    </div>
                    <div>
                      <label className="field-label" style={{ display: 'block', marginBottom: 6 }}>Heading (italic / gradient)</label>
                      <input className="field-input" type="text" value={pageContent.heading_em ?? ''} onChange={e => setPageContent(p => ({ ...p, heading_em: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: 6 }}>Lead paragraph</label>
                    <textarea className="field-textarea" rows={3} value={pageContent.lead ?? ''} onChange={e => setPageContent(p => ({ ...p, lead: e.target.value }))} style={{ width: '100%' }} />
                  </div>

                  {/* Steps — 3-column */}
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--amber)', marginBottom: 12 }}>How it works — 3 steps</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                      {[1,2,3].map(n => (
                        <div key={n} style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-3)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'var(--text-3)', marginBottom: 4 }}>Step {n}</div>
                          <div>
                            <label className="field-label" style={{ display: 'block', marginBottom: 4 }}>Number</label>
                            <input className="field-input" type="text" value={pageContent[`step${n}_num`] ?? ''} onChange={e => setPageContent(p => ({ ...p, [`step${n}_num`]: e.target.value }))} style={{ padding: '8px 12px', fontSize: 13 }} />
                          </div>
                          <div>
                            <label className="field-label" style={{ display: 'block', marginBottom: 4 }}>Title</label>
                            <input className="field-input" type="text" value={pageContent[`step${n}_title`] ?? ''} onChange={e => setPageContent(p => ({ ...p, [`step${n}_title`]: e.target.value }))} style={{ padding: '8px 12px', fontSize: 13 }} />
                          </div>
                          <div>
                            <label className="field-label" style={{ display: 'block', marginBottom: 4 }}>Description</label>
                            <textarea className="field-textarea" rows={2} value={pageContent[`step${n}_desc`] ?? ''} onChange={e => setPageContent(p => ({ ...p, [`step${n}_desc`]: e.target.value }))} style={{ minHeight: 60 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {pageKey === 'about' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label className="field-label" style={{ display: 'block', marginBottom: 6 }}>Heading</label>
                      <input className="field-input" type="text" value={pageContent.heading ?? ''} onChange={e => setPageContent(p => ({ ...p, heading: e.target.value }))} />
                    </div>
                    <div>
                      <label className="field-label" style={{ display: 'block', marginBottom: 6 }}>Heading (italic / gradient)</label>
                      <input className="field-input" type="text" value={pageContent.heading_em ?? ''} onChange={e => setPageContent(p => ({ ...p, heading_em: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: 6 }}>Intro paragraph</label>
                    <textarea className="field-textarea" rows={3} value={pageContent.intro ?? ''} onChange={e => setPageContent(p => ({ ...p, intro: e.target.value }))} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label className="field-label" style={{ display: 'block', marginBottom: 6 }}>Mission paragraph</label>
                    <textarea className="field-textarea" rows={3} value={pageContent.mission ?? ''} onChange={e => setPageContent(p => ({ ...p, mission: e.target.value }))} style={{ width: '100%' }} />
                  </div>

                  {/* Features — 3-column */}
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--amber)', marginBottom: 12 }}>Feature highlights</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                      {[1,2,3].map(n => (
                        <div key={n} style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-3)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'var(--text-3)', marginBottom: 4 }}>Feature {n}</div>
                          <div>
                            <label className="field-label" style={{ display: 'block', marginBottom: 4 }}>Title</label>
                            <input className="field-input" type="text" value={pageContent[`feature${n}_title`] ?? ''} onChange={e => setPageContent(p => ({ ...p, [`feature${n}_title`]: e.target.value }))} style={{ padding: '8px 12px', fontSize: 13 }} />
                          </div>
                          <div>
                            <label className="field-label" style={{ display: 'block', marginBottom: 4 }}>Description</label>
                            <textarea className="field-textarea" rows={3} value={pageContent[`feature${n}_text`] ?? ''} onChange={e => setPageContent(p => ({ ...p, [`feature${n}_text`]: e.target.value }))} style={{ minHeight: 80 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── IMAGES ── */}
              {(PAGE_IMAGES[pageKey] || []).length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '32px 0 20px' }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.24em', color: 'var(--text-3)' }}>Images</div>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {(PAGE_IMAGES[pageKey] || []).map(img => {
                      const currentPath = pageContent[img.field]
                      const preview     = imgPreviews[img.field]
                      const uploading   = imgUploading[img.field]
                      const hasFile     = !!imgFiles[img.field]
                      return (
                        <div key={img.field} style={{ padding: 18, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-3)' }}>
                          <label className="field-label" style={{ display: 'block', marginBottom: 12 }}>{img.label}</label>
                          {(preview || currentPath) ? (
                            <img
                              src={preview || `${API_BASE}/uploads/${currentPath}`}
                              alt="page visual"
                              style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, marginBottom: 12, display: 'block' }}
                            />
                          ) : (
                            <div style={{ height: 160, borderRadius: 8, border: '1px dashed var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.14em' }}>
                              No image set
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={e => pickImage(img.field, e.target.files[0])}
                              style={{ fontFamily: 'JetBrains Mono', fontSize: 11, flex: 1, minWidth: 0 }}
                            />
                            <button type="button" className="btn btn-tiny" disabled={!hasFile || uploading} onClick={() => uploadImage(img.field)} style={{ flexShrink: 0 }}>
                              {uploading ? 'Uploading…' : 'Upload'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              <div style={{ marginTop: 28 }}>
                <button className="btn" disabled={pageSaving} style={{ minWidth: 140 }}>
                  {pageSaving ? 'Saving…' : `Save ${pageKey === 'home' ? 'home page' : 'about page'}`}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
      {/* BANNERS TAB */}
      {tab === 'banners' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="section-h" style={{ marginBottom: 4 }}>Sliding banners</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                Shown at the top of the home page — drag to reorder
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-tiny btn-ghost" onClick={addSlide}>+ Add slide</button>
              <button className="btn btn-tiny" onClick={saveBanners} disabled={bannerSaving}>
                {bannerSaving ? 'Saving…' : 'Save banners'}
              </button>
            </div>
          </div>

          {bannerErr && <div className="error" style={{ marginBottom: 16 }}>{bannerErr}</div>}
          {bannerMsg && (
            <div style={{ border: '1px solid var(--good)', background: 'rgba(74,222,128,0.1)', color: 'var(--good)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: '0.12em' }}>
              {bannerMsg}
            </div>
          )}

          {bannerLoading ? (
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>Loading…</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {bannerSlides.map((slide, i) => (
                <div key={i} style={{ padding: 24, border: '1px solid var(--border)', borderRadius: 16, background: 'var(--bg-2)', position: 'relative' }}>
                  {/* Slide header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'var(--amber)' }}>
                      Slide {i + 1}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-tiny btn-ghost"
                        disabled={i === 0}
                        onClick={() => moveSlide(i, -1)}
                        title="Move up"
                        style={{ padding: '4px 8px', fontSize: 12 }}
                      >↑</button>
                      <button
                        className="btn btn-tiny btn-ghost"
                        disabled={i === bannerSlides.length - 1}
                        onClick={() => moveSlide(i, 1)}
                        title="Move down"
                        style={{ padding: '4px 8px', fontSize: 12 }}
                      >↓</button>
                      {bannerSlides.length > 1 && (
                        <button className="btn btn-tiny btn-danger" onClick={() => removeSlide(i)}>Remove</button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label className="field-label" style={{ display: 'block', marginBottom: 5 }}>Eyebrow text</label>
                      <input className="field-input" value={slide.eyebrow} onChange={e => updateSlide(i, 'eyebrow', e.target.value)} style={{ width: '100%' }} placeholder="e.g. New this season" />
                    </div>
                    <div>
                      <label className="field-label" style={{ display: 'block', marginBottom: 5 }}>Heading</label>
                      <input className="field-input" value={slide.heading} onChange={e => updateSlide(i, 'heading', e.target.value)} style={{ width: '100%' }} placeholder="e.g. Taste the future" />
                    </div>
                    <div>
                      <label className="field-label" style={{ display: 'block', marginBottom: 5 }}>Heading (italic / gradient)</label>
                      <input className="field-input" value={slide.heading_em} onChange={e => updateSlide(i, 'heading_em', e.target.value)} style={{ width: '100%' }} placeholder="e.g. of dining." />
                    </div>
                    <div>
                      <label className="field-label" style={{ display: 'block', marginBottom: 5 }}>Background gradient CSS</label>
                      <input className="field-input" value={slide.gradient} onChange={e => updateSlide(i, 'gradient', e.target.value)} style={{ width: '100%' }} placeholder="linear-gradient(…)" />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label className="field-label" style={{ display: 'block', marginBottom: 5 }}>Subtext</label>
                      <textarea className="field-textarea" rows={2} value={slide.sub} onChange={e => updateSlide(i, 'sub', e.target.value)} style={{ width: '100%' }} placeholder="Short description shown under the heading" />
                    </div>
                    <div>
                      <label className="field-label" style={{ display: 'block', marginBottom: 5 }}>CTA button text</label>
                      <input className="field-input" value={slide.cta_text} onChange={e => updateSlide(i, 'cta_text', e.target.value)} style={{ width: '100%' }} placeholder="e.g. Browse menu" />
                    </div>
                    <div>
                      <label className="field-label" style={{ display: 'block', marginBottom: 5 }}>CTA button URL (relative path)</label>
                      <input className="field-input" value={slide.cta_url} onChange={e => updateSlide(i, 'cta_url', e.target.value)} style={{ width: '100%' }} placeholder="e.g. /menu" />
                    </div>
                  </div>

                  {/* Preview swatch */}
                  {slide.gradient && (
                    <div style={{ marginTop: 14, height: 6, borderRadius: 4, background: slide.gradient, opacity: 0.7 }} />
                  )}

                  {/* Background image upload */}
                  <div style={{ marginTop: 16, padding: 16, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-3)' }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-3)', marginBottom: 12 }}>
                      Background image <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional — overlays gradient at low opacity)</span>
                    </div>
                    {(slideImgPreviews[i] || slide.image_path) ? (
                      <img
                        src={slideImgPreviews[i] || `${API_BASE}/uploads/${slide.image_path}`}
                        alt="slide background"
                        style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 12, display: 'block' }}
                      />
                    ) : (
                      <div style={{ height: 90, borderRadius: 8, border: '1px dashed var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.14em' }}>
                        No image — gradient only
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadSlideImage(i, f); e.target.value = '' }}
                        style={{ fontFamily: 'JetBrains Mono', fontSize: 11, flex: 1, minWidth: 0 }}
                        disabled={slideImgUploading[i]}
                      />
                      {slideImgUploading[i] && (
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--amber)', letterSpacing: '0.12em', flexShrink: 0 }}>
                          Uploading…
                        </span>
                      )}
                      {(slide.image_path || slideImgPreviews[i]) && !slideImgUploading[i] && (
                        <button
                          type="button"
                          className="btn btn-tiny btn-danger"
                          onClick={() => removeSlideImage(i)}
                          style={{ flexShrink: 0 }}
                        >
                          Remove image
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Background video upload */}
                  <div style={{ marginTop: 12, padding: 16, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-3)' }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-3)', marginBottom: 12 }}>
                      Background video <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional — plays fullscreen behind slide content)</span>
                    </div>
                    {(slideVidPreviews[i] || slide.video_path) ? (
                      <video
                        src={slideVidPreviews[i] || `${API_BASE}/uploads/${slide.video_path}`}
                        muted loop playsInline autoPlay
                        style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 12, display: 'block' }}
                      />
                    ) : (
                      <div style={{ height: 90, borderRadius: 8, border: '1px dashed var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.14em' }}>
                        No video
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadSlideVideo(i, f); e.target.value = '' }}
                        style={{ fontFamily: 'JetBrains Mono', fontSize: 11, flex: 1, minWidth: 0 }}
                        disabled={slideVidUploading[i]}
                      />
                      {slideVidUploading[i] && (
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--amber)', letterSpacing: '0.12em', flexShrink: 0 }}>
                          Uploading…
                        </span>
                      )}
                      {(slide.video_path || slideVidPreviews[i]) && !slideVidUploading[i] && (
                        <button
                          type="button"
                          className="btn btn-tiny btn-danger"
                          onClick={() => removeSlideVideo(i)}
                          style={{ flexShrink: 0 }}
                        >
                          Remove video
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {tab === 'analytics' && (
        <div>
          <div style={{ marginBottom: 28 }}>
            <div className="section-h" style={{ marginBottom: 4 }}>Most viewed hotels</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
              Based on public menu page visits
            </div>
          </div>
          {statsLoading ? (
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>Loading analytics…</p>
          ) : (
            <>
              <div style={{ padding: '24px 28px', border: '1px solid var(--border)', borderRadius: 16, background: 'var(--bg-2)', marginBottom: 24 }}>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <HotelViewsChart data={hotelStats} />
                </div>
              </div>
              {dailyStats.length > 0 && (
                <div style={{ padding: '24px 28px', border: '1px solid var(--border)', borderRadius: 16, background: 'var(--bg-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div className="section-h">Daily views — last 30 days</div>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--text-3)' }}>
                      All hotels combined
                    </span>
                  </div>
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <IncomeChart data={dailyStats.map(d => ({ label: d.day.slice(5), total: Number(d.total) }))} formatVal={v => `${v.toLocaleString()} users`} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* LOGS TAB */}
      {tab === 'logs' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div className="section-h" style={{ marginBottom: 2 }}>Activity logs</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                {logsTotal} total entries
              </div>
            </div>
            {currentAdmin?.role === 'admin' && (
              <button className="btn btn-tiny btn-danger" onClick={clearLogs}>Clear all</button>
            )}
          </div>

          {logsLoading ? (
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>Loading logs…</p>
          ) : logsList.length === 0 ? (
            <div className="empty">
              <div className="empty-mark">◌</div>
              <div className="empty-title">No logs yet</div>
              <div className="empty-sub">Actions taken in the system will appear here</div>
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>User</th>
                      <th>Role</th>
                      <th>Action</th>
                      <th>Target</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logsList.map(l => (
                      <tr key={l.id}>
                        <td data-label="Time" style={{ fontFamily: 'JetBrains Mono', fontSize: 10, whiteSpace: 'nowrap' }}>
                          {new Date(l.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td data-label="User">
                          <div style={{ fontFamily: 'Barlow Condensed, serif', fontSize: 14, fontWeight: 500 }}>{l.user_name}</div>
                          {l.ip && <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-3)' }}>{l.ip}</div>}
                        </td>
                        <td data-label="Role">
                          {l.user_role && <span className={`role-pill ${l.user_role}`}>{l.user_role}</span>}
                        </td>
                        <td data-label="Action" style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>{l.action}</td>
                        <td data-label="Target" style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-3)' }}>
                          {l.target_type}{l.target_id ? ` #${l.target_id}` : ''}
                        </td>
                        <td data-label="Details" style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-3)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {l.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 20, fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text-3)' }}>
                <button className="btn btn-tiny btn-ghost" disabled={logsOffset === 0} onClick={() => setLogsOffset(Math.max(0, logsOffset - LOGS_LIMIT))}>← Prev</button>
                <span>{logsOffset + 1}–{Math.min(logsOffset + LOGS_LIMIT, logsTotal)} of {logsTotal}</span>
                <button className="btn btn-tiny btn-ghost" disabled={logsOffset + LOGS_LIMIT >= logsTotal} onClick={() => setLogsOffset(logsOffset + LOGS_LIMIT)}>Next →</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* PROFILE TAB */}
      {tab === 'profile' && (
        <div style={{ maxWidth: 520 }}>
          <div className="section-h" style={{ marginBottom: 24 }}>My profile</div>
          {profMsg && (
            <div style={{ border: '1px solid var(--good)', background: 'rgba(74,222,128,0.1)', color: 'var(--good)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: '0.12em' }}>
              {profMsg}
            </div>
          )}
          {profErr && <div className="error" style={{ marginBottom: 16 }}>{profErr}</div>}
          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Avatar */}
            <div>
              <label className="field-label" style={{ display: 'block', marginBottom: 8 }}>Profile picture</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  onClick={() => profAvatarRef.current?.click()}
                  style={{
                    width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
                    border: '1.5px dashed var(--border-mid)', cursor: 'pointer',
                    background: 'var(--bg-3)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {profPreview ? (
                    <img src={profPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-3)', textAlign: 'center', padding: 8 }}>Click to upload</span>
                  )}
                </div>
                <div>
                  <button type="button" className="btn btn-ghost btn-tiny" onClick={() => profAvatarRef.current?.click()}>
                    {profPreview ? 'Change photo' : 'Upload photo'}
                  </button>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 6 }}>
                    JPG · PNG · WebP · max 4 MB
                  </div>
                </div>
              </div>
              <input
                ref={profAvatarRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  if (!f.type.startsWith('image/')) { setProfErr('Please pick an image file'); return }
                  setProfAvatar(f)
                  setProfPreview(URL.createObjectURL(f))
                  setProfErr('')
                }}
              />
            </div>
            <div>
              <label className="field-label" style={{ display: 'block', marginBottom: 6 }}>Display name</label>
              <input
                className="field-input"
                type="text"
                required
                value={profForm.name}
                onChange={e => setProfForm(p => ({ ...p, name: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-3)', marginBottom: 14 }}>
                Change password — leave blank to keep current
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="field-label" style={{ display: 'block', marginBottom: 6 }}>Current password</label>
                  <input
                    className="field-input"
                    type="password"
                    value={profForm.old_password}
                    onChange={e => setProfForm(p => ({ ...p, old_password: e.target.value }))}
                    style={{ width: '100%' }}
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label className="field-label" style={{ display: 'block', marginBottom: 6 }}>New password</label>
                  <input
                    className="field-input"
                    type="password"
                    value={profForm.new_password}
                    onChange={e => setProfForm(p => ({ ...p, new_password: e.target.value }))}
                    style={{ width: '100%' }}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="field-label" style={{ display: 'block', marginBottom: 6 }}>Confirm new password</label>
                  <input
                    className="field-input"
                    type="password"
                    value={profForm.confirm}
                    onChange={e => setProfForm(p => ({ ...p, confirm: e.target.value }))}
                    style={{ width: '100%' }}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>
            <div>
              <button className="btn" disabled={profSaving} style={{ minWidth: 140 }}>
                {profSaving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FEEDBACK TAB */}
      {tab === 'feedback' && (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24, flexWrap:'wrap' }}>
            <div className="section-h" style={{ marginBottom:0 }}>Customer Feedback</div>
            <div style={{ display:'flex', gap:6, marginLeft:'auto' }}>
              {['', 'new', 'read', 'replied'].map(s => (
                <button
                  key={s}
                  onClick={() => setFbFilter(s)}
                  className={`btn btn-tiny ${fbFilter === s ? '' : 'btn-ghost'}`}
                >
                  {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
              <button className="btn btn-tiny btn-ghost" onClick={() => loadFeedbacks()}>↻</button>
            </div>
          </div>

          {fbLoading ? (
            <p style={{ fontFamily:'JetBrains Mono', fontSize:11 }}>Loading…</p>
          ) : feedbacks.length === 0 ? (
            <div className="empty">
              <div className="empty-mark">◌</div>
              <div className="empty-title">No feedback yet</div>
              <div className="empty-sub">Customer submissions will appear here</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {feedbacks.map(fb => {
                const statusColor = fb.status === 'new' ? 'var(--amber)' : fb.status === 'replied' ? 'var(--good)' : 'var(--text-3)'
                return (
                  <div key={fb.id} style={{ border:'1px solid var(--border)', borderRadius:16, background:'var(--bg-2)', overflow:'hidden' }}>
                    <div style={{ padding:'18px 22px', display:'flex', alignItems:'flex-start', gap:14 }}>
                      <div style={{ width:40, height:40, borderRadius:12, background:'var(--bg-3)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Barlow Condensed,serif', fontSize:18, fontWeight:500, flexShrink:0, color:'var(--amber)' }}>
                        {fb.name[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
                          <span style={{ fontFamily:'Barlow Condensed,serif', fontSize:16, fontWeight:500 }}>{fb.name}</span>
                          {fb.email && <span style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text-3)', letterSpacing:'0.12em' }}>{fb.email}</span>}
                          <span style={{ marginLeft:'auto', fontFamily:'JetBrains Mono', fontSize:8, textTransform:'uppercase', letterSpacing:'0.16em', padding:'3px 8px', borderRadius:20, border:`1px solid ${statusColor}44`, color:statusColor, background:`${statusColor}11` }}>
                            {fb.status}
                          </span>
                        </div>
                        {fb.subject && (
                          <div style={{ fontFamily:'JetBrains Mono', fontSize:9, textTransform:'uppercase', letterSpacing:'0.16em', color:'var(--amber)', marginBottom:6 }}>{fb.subject}</div>
                        )}
                        {fb.rating && (
                          <div style={{ display:'flex', gap:2, marginBottom:8 }}>
                            {[1,2,3,4,5].map(n => (
                              <span key={n} style={{ color: n <= fb.rating ? 'var(--amber)' : 'var(--border-hi)', fontSize:14 }}>★</span>
                            ))}
                          </div>
                        )}
                        <p style={{ fontFamily:'Barlow Condensed,serif', fontStyle: 'normal', fontSize:14.5, color:'var(--text-2)', lineHeight:1.7, margin:'0 0 10px' }}>
                          "{fb.message}"
                        </p>
                        <div style={{ fontFamily:'JetBrains Mono', fontSize:8.5, color:'var(--text-3)', letterSpacing:'0.12em' }}>
                          {new Date(fb.created_at).toLocaleDateString('en-US', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                        </div>
                        {fb.admin_reply && (
                          <div style={{ marginTop:12, padding:'12px 14px', borderRadius:10, background:'rgba(26,173,107,0.07)', border:'1px solid rgba(26,173,107,0.2)' }}>
                            <div style={{ fontFamily:'JetBrains Mono', fontSize:8, textTransform:'uppercase', letterSpacing:'0.16em', color:'var(--good)', marginBottom:6 }}>Admin reply</div>
                            <p style={{ fontFamily:'Barlow Condensed,serif', fontSize:14, color:'var(--text-2)', lineHeight:1.65, margin:0 }}>{fb.admin_reply}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ padding:'10px 22px 14px', borderTop:'1px solid var(--border)', display:'flex', gap:8, flexWrap:'wrap', alignItems:'flex-end' }}>
                      {fb.status === 'new' && (
                        <button className="btn btn-tiny btn-ghost" onClick={() => markFbRead(fb.id)}>Mark read</button>
                      )}
                      {fbReplyId === fb.id ? (
                        <div style={{ flex:1, display:'flex', gap:8, alignItems:'flex-end' }}>
                          <textarea
                            className="field-textarea"
                            rows={2}
                            value={fbReplyText}
                            onChange={e => setFbReplyText(e.target.value)}
                            placeholder="Type your reply…"
                            style={{ flex:1, minHeight:60 }}
                          />
                          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                            <button className="btn btn-tiny" disabled={fbReplying} onClick={() => submitReply(fb.id)}>
                              {fbReplying ? '…' : 'Send'}
                            </button>
                            <button className="btn btn-tiny btn-ghost" onClick={() => { setFbReplyId(null); setFbReplyText('') }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn btn-tiny" onClick={() => { setFbReplyId(fb.id); setFbReplyText('') }}>
                          {fb.admin_reply ? 'Edit reply' : '↩ Reply'}
                        </button>
                      )}
                      <button className="btn btn-tiny btn-danger" style={{ marginLeft:'auto' }} onClick={() => deleteFeedback(fb.id)}>Delete</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Media Tab ────────────────────────────────────────────────── */}
      {tab === 'media' && (
        <div>
          <h2 className="section-title" style={{ marginBottom: 20 }}>Page Media</h2>

          {/* Page selector */}
          <div style={{ display:'flex', gap:8, marginBottom:20 }}>
            {['home','about'].map(k => (
              <button key={k} className={`btn${mediaKey===k?'':' btn-ghost'}`}
                onClick={() => { setMediaKey(k); setMediaItems([]) }}>
                {k.charAt(0).toUpperCase()+k.slice(1)}
              </button>
            ))}
          </div>

          {/* Upload area */}
          <div className="card" style={{ padding:20, marginBottom:20 }}>
            <div className="field-label">Upload image or video</div>
            <input ref={mediaFileRef} type="file" accept="image/*,video/*"
              className="field-input" style={{ marginBottom:10 }}
              onChange={e => {
                const f = e.target.files?.[0]
                if (!f) return
                setMediaFile(f)
                setMediaPreview(URL.createObjectURL(f))
              }} />
            {mediaPreview && (
              <div style={{ marginBottom:10 }}>
                {mediaFile?.type?.startsWith('video') ? (
                  <video src={mediaPreview} controls style={{ maxHeight:160, borderRadius:8, maxWidth:'100%' }} />
                ) : (
                  <img src={mediaPreview} alt="" style={{ maxHeight:160, borderRadius:8, objectFit:'cover' }} />
                )}
              </div>
            )}
            <input className="field-input" placeholder="Caption (optional)" style={{ marginBottom:10 }}
              value={mediaCaption} onChange={e => setMediaCaption(e.target.value)} />
            <button className="btn" disabled={!mediaFile || mediaUploading} onClick={uploadMedia}>
              {mediaUploading ? 'Uploading…' : 'Upload'}
            </button>
            {mediaMsg && <p style={{ color:'var(--ok)', marginTop:8, fontSize:13 }}>{mediaMsg}</p>}
            {mediaErr && <p style={{ color:'var(--bad)', marginTop:8, fontSize:13 }}>{mediaErr}</p>}
          </div>

          {/* Media grid */}
          {mediaLoading ? (
            <p style={{ color:'var(--text-3)', fontFamily:'JetBrains Mono', fontSize:11 }}>Loading…</p>
          ) : mediaItems.length === 0 ? (
            <p style={{ color:'var(--text-3)', fontStyle: 'normal' }}>No media uploaded for this page yet.</p>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:16 }}>
              {mediaItems.map(item => (
                <div key={item.id} className="card" style={{ padding:12 }}>
                  {item.type === 'video' ? (
                    <video src={imageUrl(item.path)} controls style={{ width:'100%', borderRadius:6, maxHeight:140 }} />
                  ) : (
                    <img src={imageUrl(item.path)} alt={item.caption} style={{ width:'100%', height:140, objectFit:'cover', borderRadius:6 }} />
                  )}
                  <input className="field-input" style={{ marginTop:8, fontSize:12 }}
                    defaultValue={item.caption}
                    placeholder="Caption"
                    onBlur={e => { if (e.target.value !== item.caption) saveMediaCaption(item.id, e.target.value) }} />
                  <div style={{ marginTop:8, textAlign:'right' }}>
                    <span style={{ fontSize:10, fontFamily:'JetBrains Mono', color:'var(--text-3)', marginRight:'auto' }}>
                      {item.type}
                    </span>
                    <button className="btn btn-tiny btn-danger" onClick={() => deleteMedia(item.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {/* ── Slip preview modal ── */}
      {slipModal && (
        <div
          onClick={() => setSlipModal(null)}
          style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.78)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, backdropFilter:'blur(6px)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ position:'relative', maxWidth:'90vw', maxHeight:'90vh', borderRadius:16, overflow:'hidden', background:'var(--bg-2)', boxShadow:'0 32px 80px rgba(0,0,0,0.6)', display:'flex', flexDirection:'column' }}
          >
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <span style={{ fontFamily:'JetBrains Mono', fontSize:10, textTransform:'uppercase', letterSpacing:'0.18em', color:'var(--text-3)' }}>Payment Slip</span>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <a
                  href={slipModal.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontFamily:'JetBrains Mono', fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--amber)', textDecoration:'none', padding:'5px 12px', border:'1px solid rgba(245,166,35,0.4)', borderRadius:8 }}
                >
                  Open original ↗
                </a>
                <button
                  onClick={() => setSlipModal(null)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:24, lineHeight:1, padding:'0 4px' }}
                >×</button>
              </div>
            </div>

            {/* Content */}
            <div style={{ overflow:'auto', padding:20, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {slipModal.isPdf ? (
                <iframe src={slipModal.url} title="Payment slip" style={{ width:'75vw', height:'80vh', border:'none', borderRadius:8 }} />
              ) : (
                <img src={slipModal.url} alt="Payment slip" style={{ maxWidth:'80vw', maxHeight:'78vh', objectFit:'contain', borderRadius:8, display:'block' }} />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
