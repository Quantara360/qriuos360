import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotify } from '../context/NotificationContext.jsx'
import { imageUrl } from '../api/client.js'

const CUISINE_TYPES = [
  { value: 'Chinese',          emoji: '🥢' },
  { value: 'Italian',          emoji: '🍝' },
  { value: 'Indian',           emoji: '🍛' },
  { value: 'Japanese',         emoji: '🍱' },
  { value: 'Bar & Restaurant', emoji: '🍻' },
  { value: 'Bakery & Café',    emoji: '🥐' },
  { value: 'Fast Food',        emoji: '🍔' },
  { value: 'Mexican',          emoji: '🌮' },
  { value: 'Mediterranean',    emoji: '🫒' },
  { value: 'Seafood',          emoji: '🦞' },
  { value: 'Steakhouse',       emoji: '🥩' },
  { value: 'Vegetarian/Vegan', emoji: '🥗' },
  { value: 'American',         emoji: '🍟' },
  { value: 'Thai',             emoji: '🍜' },
  { value: 'Pizza',            emoji: '🍕' },
  { value: 'Other',            emoji: '🍽️' },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const notify = useNotify()
  const [role, setRole] = useState('customer')
  const [form, setForm] = useState({ name: '', email: '', password: '', hotel_name: '' })
  const [cuisineTypes, setCuisineTypes] = useState([])
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const logoRef = useRef()

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const onLogo = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { notify.error('Please pick an image file'); return }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('name',     form.name)
      fd.append('email',    form.email)
      fd.append('password', form.password)
      fd.append('role',     role)
      if (role === 'owner') {
        fd.append('hotel_name', form.hotel_name)
        if (cuisineTypes.length > 0) fd.append('cuisine_type', JSON.stringify(cuisineTypes))
        if (logoFile) fd.append('logo', logoFile)
      }
      const res = await register(fd)
      notify.success(res.message || 'Account created')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      notify.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-side">
        <div>
          <div className="auth-eyebrow">Join QRIOUS360</div>
          <div className="auth-headline">
            Bring your<br/>menu to<br/>life.
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: '🏨', label: 'Hotel owner', desc: 'Publish dishes, get QR code' },
            { icon: '🍽️', label: 'Customer', desc: 'Browse menus & leave reviews' },
          ].map(r => (
            <div key={r.label} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '13px 16px', borderRadius: 12,
              background: 'var(--bg-3)',
              border: '1px solid var(--border)',
              backdropFilter: 'blur(12px)',
            }}>
              <span style={{ fontSize: 20 }}>{r.icon}</span>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 2 }}>{r.label}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '.1em', color: 'var(--text-3)' }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="auth-foot">↳ Hotel owners receive a unique QR code for their menu</div>
      </div>

      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--amber)', marginBottom: 10 }}>
              QRIOUS360
            </div>
            <h2 style={{ fontFamily: 'Barlow Condensed, serif', fontWeight: 700, fontSize: 38, letterSpacing: '0.02em', marginBottom: 8 }}>
              Create account
            </h2>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '.12em', color: 'var(--text-3)', textTransform: 'uppercase' }}>
              Pick your role to get started
            </p>
          </div>

          <div className="role-toggle">
            <button type="button" className={role === 'customer' ? 'active' : ''} onClick={() => setRole('customer')}>
              Customer
            </button>
            <button type="button" className={role === 'owner' ? 'active' : ''} onClick={() => setRole('owner')}>
              Hotel owner
            </button>
          </div>

          <div className="field">
            <label className="field-label">Full name</label>
            <input className="field-input" required value={form.name} onChange={update('name')} />
          </div>

          {role === 'owner' && (
            <>
              <div className="field">
                <label className="field-label">Hotel / restaurant name</label>
                <input className="field-input" required value={form.hotel_name} onChange={update('hotel_name')} />
              </div>

              <div className="field">
                <label className="field-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>
                    Cuisine types
                    <span style={{ opacity: 0.5, fontStyle: 'normal', marginLeft: 6 }}>(optional · pick all that apply)</span>
                  </span>
                  {cuisineTypes.length > 0 && (
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '.14em', color: 'var(--amber)', fontWeight: 600 }}>
                      {cuisineTypes.length} selected
                    </span>
                  )}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {CUISINE_TYPES.map(ct => {
                    const active = cuisineTypes.includes(ct.value)
                    return (
                      <button
                        key={ct.value}
                        type="button"
                        onClick={() => setCuisineTypes(prev =>
                          prev.includes(ct.value) ? prev.filter(v => v !== ct.value) : [...prev, ct.value]
                        )}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          padding: '10px 6px', borderRadius: 10, border: '1px solid',
                          borderColor: active ? 'var(--amber)' : 'var(--border)',
                          background: active ? 'rgba(224,152,48,.12)' : 'var(--bg-3)',
                          cursor: 'pointer', transition: 'all 0.2s',
                          boxShadow: active ? '0 0 0 1px var(--amber)' : 'none',
                          position: 'relative',
                        }}
                      >
                        {active && (
                          <span style={{
                            position: 'absolute', top: 4, right: 4,
                            width: 12, height: 12, borderRadius: '50%',
                            background: 'var(--amber)', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 8, color: '#000', fontWeight: 700,
                            lineHeight: 1,
                          }}>✓</span>
                        )}
                        <span style={{ fontSize: 18, lineHeight: 1 }}>{ct.emoji}</span>
                        <span style={{
                          fontFamily: 'JetBrains Mono, monospace', fontSize: 8,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          color: active ? 'var(--amber)' : 'var(--text-3)',
                          textAlign: 'center', lineHeight: 1.3,
                        }}>{ct.value}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="field">
                <label className="field-label">Hotel logo <span style={{ opacity: 0.5, fontStyle: 'normal' }}>(optional)</span></label>
                <div
                  onClick={() => logoRef.current?.click()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                    padding: '10px 14px', border: '1px dashed var(--border-mid)',
                    borderRadius: 8, background: 'var(--bg-3)', transition: 'all 0.2s',
                  }}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="logo"
                      style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 8, background: 'var(--bg-3)', padding: 4 }} />
                  ) : (
                    <div style={{
                      width: 52, height: 52, borderRadius: 8,
                      background: 'var(--bg-4)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 22, color: 'var(--text-3)',
                    }}>⊕</div>
                  )}
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--text-2)' }}>
                      {logoPreview ? 'Change logo' : 'Upload logo'}
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: '0.12em', color: 'var(--text-3)', marginTop: 3 }}>
                      JPG · PNG · WebP · max 4 MB
                    </div>
                  </div>
                </div>
                <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/webp"
                  onChange={onLogo} style={{ display: 'none' }} />
              </div>
            </>
          )}

          <div className="field">
            <label className="field-label">Email</label>
            <input className="field-input" type="email" required value={form.email} onChange={update('email')} />
          </div>

          <div className="field">
            <label className="field-label">Password (min. 6 characters)</label>
            <input className="field-input" type="password" required minLength={6} value={form.password} onChange={update('password')} />
          </div>

          <button className="btn" disabled={loading} style={{ width: '100%', marginTop: 8, padding: '15px 28px', fontSize: 13 }}>
            {loading
              ? <><span style={{ width: 16, height: 16, border: '2px solid var(--border-mid)', borderTop: '2px solid var(--amber)', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Creating…</>
              : 'Create account →'
            }
          </button>

          <div className="auth-switch" style={{ marginTop: 24 }}>
            Have an account? <Link to="/login">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
