import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { dishes as dishApi, categories as catApi, imageUrl } from '../api/client.js'
import Dish360Viewer from '../components/Dish360Viewer.jsx'
import { useNotify } from '../context/NotificationContext.jsx'


;(function injectStyles() {
  if (document.getElementById('scan360-css')) return
  const s = document.createElement('style')
  s.id = 'scan360-css'
  s.textContent = `
    @keyframes sc-spin   { to{transform:rotate(360deg)} }
    @keyframes sc-fadeup { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  `
  document.head.appendChild(s)
})()

const MAX_DURATION = 15  // seconds

async function getVideoDuration(file) {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    v.preload = 'metadata'; v.muted = true; v.src = url
    const done = d => { URL.revokeObjectURL(url); resolve(d) }
    v.addEventListener('loadedmetadata', () => {
      if (isFinite(v.duration) && v.duration > 0) { done(v.duration); return }
      v.currentTime = 1e9  // EOF seek for WebM Infinity-duration
    }, { once: true })
    v.addEventListener('seeked', () => {
      done(isFinite(v.currentTime) && v.currentTime > 0 ? v.currentTime : null)
    }, { once: true })
    v.addEventListener('error', () => done(null), { once: true })
    setTimeout(() => done(null), 8000)
  })
}

async function trimVideoTo15s(file, onProgress) {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.muted = true; video.playsInline = true; video.preload = 'metadata'; video.src = url

    video.addEventListener('loadedmetadata', () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 1280; canvas.height = video.videoHeight || 720
      const ctx = canvas.getContext('2d')
      const stream = canvas.captureStream(30)
      const mime = ['video/webm;codecs=vp9', 'video/webm']
        .find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm'
      const mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 })
      const chunks = []
      mr.ondataavailable = e => { if (e.data?.size > 0) chunks.push(e.data) }
      mr.onstop = () => {
        URL.revokeObjectURL(url)
        const blob = new Blob(chunks, { type: mime })
        resolve(new File([blob], file.name, { type: blob.type }))
      }
      let rafId = null
      const draw = () => { ctx.drawImage(video, 0, 0, canvas.width, canvas.height); rafId = requestAnimationFrame(draw) }
      const startMs = Date.now()
      const progIv = setInterval(() => onProgress(Math.min((Date.now() - startMs) / (MAX_DURATION * 1000), 0.98)), 120)
      const stopTimer = setTimeout(() => {
        clearInterval(progIv); cancelAnimationFrame(rafId); video.pause(); onProgress(1); mr.stop()
      }, MAX_DURATION * 1000)
      mr.start(100)
      video.currentTime = 0
      video.play().then(() => { rafId = requestAnimationFrame(draw) })
        .catch(() => { clearTimeout(stopTimer); clearInterval(progIv); mr.stop() })
    }, { once: true })

    video.addEventListener('error', () => { URL.revokeObjectURL(url); resolve(null) }, { once: true })
  })
}

function extractVideoFrame(videoUrl) {
  return new Promise(resolve => {
    const v = document.createElement('video')
    v.muted = true
    v.playsInline = true
    v.preload = 'metadata'
    v.src = videoUrl

    const done = (blob) => { clearTimeout(timeout); resolve(blob) }
    const timeout = setTimeout(() => resolve(null), 10000)

    v.addEventListener('loadedmetadata', () => {
      // Seek to 10 % through, or 1 s if duration is unknown
      v.currentTime = isFinite(v.duration) && v.duration > 0
        ? Math.min(v.duration * 0.1, 2)
        : 1
    }, { once: true })

    v.addEventListener('seeked', () => {
      const c = document.createElement('canvas')
      c.width = v.videoWidth || 1280; c.height = v.videoHeight || 720
      c.getContext('2d').drawImage(v, 0, 0, c.width, c.height)
      c.toBlob(blob => done(blob), 'image/jpeg', 0.92)
    }, { once: true })

    v.addEventListener('error', () => done(null), { once: true })
  })
}

export default function OwnerDishForm() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const isEdit   = !!id

  // ── Video upload ──
  const [phase,      setPhase]      = useState('form')
  const [videoFile,  setVideoFile]  = useState(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('')
  const [trimming,    setTrimming]    = useState(false)
  const [trimProgress, setTrimProgress] = useState(0)
  const [trimWarning, setTrimWarning] = useState(false)

  // ── Form ──
  const [form, setForm] = useState({ name:'', description:'', portion_size:'', price:'', available:1, category_id:'', food_type:'' })
  const [spiceLevel, setSpiceLevel] = useState(5)
  const [ingredients, setIngredients] = useState([])
  const [ingInput,    setIngInput]    = useState('')
  const notify = useNotify()
  const [cats,        setCats]        = useState([])
  const [editLoading, setEditLoading] = useState(isEdit)
  const [saving,      setSaving]      = useState(false)

  // ── PNG transparent image ──
  const [pngFile,       setPngFile]       = useState(null)
  const [pngPreviewUrl, setPngPreviewUrl] = useState('')
  const [removePng,     setRemovePng]     = useState(false)
  const pngInputRef = useRef()

  const videoUploadRef = useRef()

  // ── Video upload ────────────────────────────────────────────────────────────
  const handleVideoUpload = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const dur = await getVideoDuration(file)
    if (dur !== null && dur > MAX_DURATION) {
      setTrimWarning(true)
      setTrimming(true)
      setTrimProgress(0)
      const trimmed = await trimVideoTo15s(file, p => setTrimProgress(p))
      setTrimming(false)
      const final = trimmed || file
      setVideoFile(final)
      setVideoPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(final) })
    } else {
      setTrimWarning(false)
      setVideoFile(file)
      setVideoPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file) })
    }
  }, [])

  useEffect(() => { catApi.list().then(({ categories }) => setCats(categories)).catch(() => {}) }, [])

  useEffect(() => {
    if (!isEdit) return
    dishApi.get(id)
      .then(({ dish }) => {
        setForm({ name:dish.name, description:dish.description||'', portion_size:dish.portion_size||'', price:dish.price, available:parseInt(dish.available), category_id:dish.category_id||'', food_type:dish.food_type||'' })
        setSpiceLevel(dish.spice_level ? parseInt(dish.spice_level) : 5)
        setIngredients(dish.ingredients || [])
        if (dish.video_path) setVideoPreviewUrl(imageUrl(dish.video_path))
        if (dish.png_path)   setPngPreviewUrl(imageUrl(dish.png_path))
      })
      .catch(err => notify.error(err.message))
      .finally(() => setEditLoading(false))
  }, [id])   // eslint-disable-line

  // ── Form helpers ───────────────────────────────────────────────────────────
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value }))
  const addIng = () => { const v = ingInput.trim(); if (v && !ingredients.includes(v)) setIngredients(p => [...p, v]); setIngInput('') }
  const rmIng  = i => setIngredients(p => p.filter((_, j) => j !== i))

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { notify.error('Dish name is required'); return }
    if (!form.price || Number(form.price) <= 0) { notify.error('A valid price is required'); return }
    if (!form.food_type) { notify.error('Please select a food type (Veg / Non-Veg / Vegan)'); return }
    if (!isEdit && !videoFile) { notify.error('Please upload a 360° video before publishing'); return }

    const fd = new FormData()
    if (isEdit) fd.append('id', id)
    fd.append('name',         form.name)
    fd.append('description',  form.description)
    fd.append('portion_size', form.portion_size)
    fd.append('price',        form.price)
    fd.append('available',    form.available)
    fd.append('category_id',  form.category_id || '')
    fd.append('ingredients',  JSON.stringify(ingredients))
    fd.append('food_type',   form.food_type)
    fd.append('spice_level', spiceLevel)

    if (videoFile) {
      fd.append('video', videoFile, videoFile.name)
      const frameBlob = await extractVideoFrame(videoPreviewUrl)
      if (frameBlob) fd.append('image', frameBlob, 'thumbnail.jpg')
    }

    if (pngFile) fd.append('png', pngFile, pngFile.name)
    else if (removePng) fd.append('remove_png', '1')

    setSaving(true); setPhase('saving')
    try {
      if (isEdit) {
        await dishApi.update(fd)
      } else {
        await dishApi.create(fd)
      }
      navigate('/owner')
    } catch (err) {
      notify.error(err.message); setPhase('form'); setSaving(false)
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: SAVING  (uploading)
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 'saving') {
    return (
      <div className="page">
        <div style={{ maxWidth:480, margin:'60px auto 0', textAlign:'center' }}>
          <div style={{ width:36, height:36, border:'2px solid var(--border-mid)', borderTop:'2px solid rgba(0,255,159,.7)', borderRadius:'50%', animation:'sc-spin .85s linear infinite', margin:'0 auto 24px' }} />
          <h1 style={{ fontFamily:'Barlow Condensed, serif', fontWeight:700, fontSize:28, margin:'0 0 12px' }}>
            Publishing your dish…
          </h1>
          <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text-3)', letterSpacing:'.18em', textTransform:'uppercase' }}>
            Uploading 360° video — please wait
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: FORM  (dish details)
  // ════════════════════════════════════════════════════════════════════════════
  if (editLoading) return (
    <div className="page"><p style={{ fontFamily:'JetBrains Mono', fontSize:11 }}>Loading…</p></div>
  )

  return (
    <div className="page">

      {/* Trimming overlay — shown while long video is being processed */}
      {trimming && (
        <div style={{ position:'fixed', inset:0, zIndex:60, background:'rgba(5,5,5,.94)', backdropFilter:'blur(14px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:18, fontFamily:'JetBrains Mono, monospace' }}>
          <div style={{ width:36, height:36, border:'2px solid rgba(255,200,80,.15)', borderTop:'2px solid rgba(255,200,80,.85)', borderRadius:'50%', animation:'sc-spin .85s linear infinite' }} />
          <div style={{ fontSize:9, letterSpacing:'.22em', textTransform:'uppercase', color:'rgba(255,200,80,.85)' }}>
            ⚠ Video exceeds 15 s — trimming…
          </div>
          <div style={{ width:200, height:3, background:'rgba(255,255,255,.08)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${Math.round(trimProgress * 100)}%`, background:'rgba(255,200,80,.8)', transition:'width .12s linear' }} />
          </div>
          <div style={{ fontSize:9, color:'rgba(255,255,255,.28)', letterSpacing:'.14em' }}>
            {Math.round(trimProgress * 100)}% · please wait
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <div className="page-eyebrow">{isEdit ? 'Editing' : 'New entry'} · Owner workspace</div>
          <h1 className="page-title">{isEdit ? 'Edit' : 'Publish'} dish.</h1>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/owner')}>← Back</button>
      </div>

      <form onSubmit={handleSubmit} className="dish-form-grid">

        {/* ══ LEFT: video preview ══ */}
        <div>
          <div className="section-h" style={{ marginBottom:8 }}>360° Preview</div>

          {trimWarning && (
            <div style={{ display:'flex', alignItems:'flex-start', gap:10, background:'rgba(255,200,80,.1)', border:'1px solid rgba(255,200,80,.3)', borderRadius:10, padding:'10px 13px', marginBottom:12 }}>
              <span style={{ color:'rgba(255,200,80,.9)', fontSize:13, lineHeight:1 }}>⚠</span>
              <span style={{ fontFamily:'JetBrains Mono', fontSize:9, letterSpacing:'.1em', lineHeight:1.7, color:'rgba(255,200,80,.85)' }}>
                Video trimmed to 15 s — only the first 15 seconds will be shown to customers.
              </span>
            </div>
          )}

          {videoPreviewUrl ? (
            <>
              <Dish360Viewer src={videoPreviewUrl} style={{ width:'100%', borderRadius:14, marginBottom:10 }} />
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button type="button" className="btn btn-ghost btn-tiny" onClick={() => videoUploadRef.current?.click()}>Upload different</button>
                {videoFile && (
                  <button type="button" className="btn btn-ghost btn-tiny"
                    onClick={() => { setVideoFile(null); setVideoPreviewUrl(prev => { URL.revokeObjectURL(prev); return '' }) }}
                    style={{ color:'var(--bad)' }}>
                    Remove
                  </button>
                )}
              </div>
            </>
          ) : (
            <div
              style={{ width:'100%', aspectRatio:'16/9', borderRadius:14, background:'var(--bg-3)', border:'2px dashed var(--border-mid)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, marginBottom:12, cursor:'pointer' }}
              onClick={() => videoUploadRef.current?.click()}>
              <div style={{ fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--text-3)' }}>
                No video yet
              </div>
              <button type="button" className="btn btn-ghost" onClick={e => { e.stopPropagation(); videoUploadRef.current?.click() }}>
                Upload video
              </button>
            </div>
          )}

          <div style={{ padding:'10px 14px', border:'1px solid var(--border)', borderRadius:8, background:'var(--bg-3)', marginTop:12 }}>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:9, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:6 }}>
              360° viewer
            </div>
            <p style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text-2)', letterSpacing:'.1em', lineHeight:1.7, margin:0 }}>
              Customers drag left and right to spin around the dish and see every angle before they order.
            </p>
          </div>

          {/* ── Transparent PNG upload ── */}
          <div style={{ marginTop:24 }}>
            <div className="section-h" style={{ marginBottom:6 }}>
              Transparent PNG&nbsp;
              <span style={{ fontFamily:'JetBrains Mono', fontSize:9, fontWeight:400, color:'var(--text-3)', letterSpacing:'.1em', textTransform:'none' }}>optional</span>
            </div>
            <p style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text-3)', letterSpacing:'.1em', lineHeight:1.7, margin:'0 0 10px' }}>
              PNG with transparent background — shown as an animated floating circle in the menu.
            </p>

            {pngPreviewUrl ? (
              <div style={{ textAlign:'center', padding:'16px', border:'1px solid var(--border)', borderRadius:12, background:'var(--bg-3)' }}>
                <img src={pngPreviewUrl} alt="PNG preview"
                  style={{ maxHeight:130, maxWidth:'100%', objectFit:'contain', marginBottom:10, borderRadius:8 }} />
                <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                  <button type="button" className="btn btn-ghost btn-tiny" onClick={() => pngInputRef.current?.click()}>Change</button>
                  <button type="button" className="btn btn-ghost btn-tiny" style={{ color:'var(--bad)' }}
                    onClick={() => { setPngFile(null); setPngPreviewUrl(''); setRemovePng(true) }}>
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{ border:'2px dashed var(--border-mid)', borderRadius:12, padding:'20px 16px', textAlign:'center', cursor:'pointer' }}
                onClick={() => pngInputRef.current?.click()}>
                <div style={{ fontSize:28, marginBottom:8, opacity:.3 }}>🖼️</div>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text-3)', letterSpacing:'.16em', textTransform:'uppercase', marginBottom:10 }}>
                  No PNG uploaded
                </div>
                <button type="button" className="btn btn-ghost btn-tiny" onClick={e => { e.stopPropagation(); pngInputRef.current?.click() }}>
                  Upload PNG
                </button>
              </div>
            )}
            <input
              ref={pngInputRef}
              type="file"
              accept="image/png"
              style={{ display:'none' }}
              onChange={e => {
                const f = e.target.files?.[0]
                if (!f) return
                e.target.value = ''
                if (f.type !== 'image/png') { notify.error('Only PNG files are allowed'); return }
                if (f.size > 8 * 1024 * 1024) { notify.error('PNG must be under 8 MB'); return }
                setPngFile(f)
                setRemovePng(false)
                setPngPreviewUrl(URL.createObjectURL(f))
              }}
            />
          </div>
        </div>

        {/* ══ RIGHT: metadata form ══ */}
        <div>
          <div className="section-h">Dish details</div>

          <div className="field">
            <label className="field-label">Dish name *</label>
            <input className="field-input" required value={form.name} onChange={upd('name')} placeholder="e.g. Truffle Risotto" />
          </div>

          <div className="field">
            <label className="field-label">Description</label>
            <textarea className="field-textarea" rows={3} value={form.description} onChange={upd('description')} placeholder="A brief, evocative description…" />
          </div>

          {/* ── Portion Size ── */}
          <div className="field">
            <label className="field-label">
              Portion Size
              {!form.portion_size && <span style={{ opacity:0.35, marginLeft:6 }}>— optional</span>}
            </label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginTop:8 }}>
              {[1,2,3,4].map(n => {
                const selected = form.portion_size === String(n)
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, portion_size: String(n) }))}
                    style={{
                      padding:4,
                      border: selected ? '2.5px solid var(--amber)' : '2.5px solid var(--border)',
                      borderRadius:12, cursor:'pointer', overflow:'hidden',
                      background: selected ? 'rgba(212,150,58,.12)' : 'var(--bg-3)',
                      transition:'border-color 0.15s, background 0.15s',
                      boxShadow: selected ? '0 0 0 3px rgba(212,150,58,.18)' : 'none',
                    }}
                  >
                    <img src={`/${n}.png`} alt={`Portion ${n}`} style={{ width:'100%', display:'block', borderRadius:8, objectFit:'contain' }} />
                  </button>
                )
              })}
            </div>
            {form.portion_size && (
              <button type="button" onClick={() => setForm(f => ({ ...f, portion_size: '' }))}
                style={{ marginTop:8, background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontFamily:'JetBrains Mono', fontSize:9, letterSpacing:'.1em', padding:0 }}>
                ✕ Clear
              </button>
            )}
          </div>

          <div className="field">
            <label className="field-label">Price (USD) *</label>
            <input className="field-input" type="number" step="0.01" min="0" required value={form.price} onChange={upd('price')} />
          </div>

          <div className="field">
            <label className="field-label">Category</label>
            <select className="field-select" value={form.category_id} onChange={upd('category_id')}>
              <option value="">— No category —</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* ── Food Type ── */}
          <div className="field">
            <label className="field-label">Food Type <span style={{ color:'var(--amber)', marginLeft:4 }}>*</span></label>
            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              {[
                { value:'veg',     icon:'🌱', label:'Veg',     selColor:'#22c55e' },
                { value:'non-veg', icon:'🍗', label:'Non-Veg', selColor:'#ef4444' },
                { value:'vegan',   icon:'🌿', label:'Vegan',   selColor:'#16a34a' },
              ].map(opt => {
                const sel = form.food_type === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, food_type: opt.value }))}
                    style={{
                      flex:1, padding:'10px 8px', borderRadius:10, cursor:'pointer', transition:'all 0.2s',
                      border: sel ? `2px solid ${opt.selColor}` : '2px solid var(--border)',
                      background: sel ? `${opt.selColor}22` : 'var(--bg-3)',
                      color: sel ? opt.selColor : 'var(--text-3)',
                      fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:'.12em', textTransform:'uppercase',
                      display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                    }}
                  >
                    <span style={{ fontSize:20 }}>{opt.icon}</span>
                    {opt.label}
                  </button>
                )
              })}
            </div>
            {!form.food_type && (
              <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--text-3)', marginTop:6, letterSpacing:'.1em' }}>
                Tap one to select
              </div>
            )}
          </div>

          {/* ── Spice Level ── */}
          <div className="field">
            <label className="field-label" style={{ display:'flex', alignItems:'baseline', gap:6 }}>
              Spice / Intensity Level
              <span style={{ color:'var(--amber)', fontWeight:700, fontSize:13 }}>{spiceLevel}</span>
              <span style={{ opacity:0.4, fontSize:9 }}>/10</span>
              <span style={{ marginLeft:'auto', opacity:0.55, fontSize:9, letterSpacing:'.1em' }}>
                {spiceLevel <= 2 ? 'Very Mild' : spiceLevel <= 4 ? 'Mild' : spiceLevel <= 6 ? 'Medium' : spiceLevel <= 8 ? 'Hot' : 'Extremely Hot'}
              </span>
            </label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(10,1fr)', gap:4, marginTop:6 }}>
              {Array.from({ length:10 }, (_, i) => i + 1).map(n => {
                const active = n <= spiceLevel
                const col = n <= 3 ? '#4ade80' : n <= 6 ? '#fbbf24' : n <= 8 ? '#f97316' : '#ef4444'
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSpiceLevel(n)}
                    style={{
                      padding:'6px 2px', borderRadius:6, cursor:'pointer', transition:'all 0.15s',
                      border: n === spiceLevel ? `2px solid ${col}` : '2px solid transparent',
                      background: active ? `${col}22` : 'var(--bg-3)',
                      color: active ? col : 'var(--text-3)',
                      fontFamily:'JetBrains Mono', fontSize:9,
                      display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                    }}
                  >
                    <span style={{ fontSize:11 }}>{n <= 6 ? '🌶' : '🔥'}</span>
                    <span>{n}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ marginTop:22 }} className="section-h">Ingredients</div>
          <div className="ingredients-input">
            <input className="field-input" value={ingInput} onChange={e => setIngInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIng() } }}
              placeholder="Type an ingredient and press Enter" />
            <button type="button" className="btn btn-ghost" onClick={addIng}>Add</button>
          </div>
          {ingredients.length > 0 && (
            <div className="ingredient-tags">
              {ingredients.map((ing, i) => (
                <span className="ingredient-tag" key={i}>
                  {ing}<button type="button" onClick={() => rmIng(i)}>×</button>
                </span>
              ))}
            </div>
          )}

          <div style={{ marginTop:22 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, fontFamily:'JetBrains Mono', fontSize:10, letterSpacing:'.18em', textTransform:'uppercase', cursor:'pointer' }}>
              <input type="checkbox" checked={form.available == 1} onChange={upd('available')} />
              Visible to customers
            </label>
          </div>

          <div style={{ marginTop:32, display:'flex', gap:10 }}>
            <button className="btn" disabled={saving}>
              {saving ? 'Publishing…' : (isEdit ? 'Update dish' : 'Publish dish')}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/owner')}>Cancel</button>
          </div>
        </div>

      </form>

      <input ref={videoUploadRef} type="file" accept="video/mp4,video/quicktime,video/webm" style={{ display:'none' }} onChange={handleVideoUpload} />
    </div>
  )
}
