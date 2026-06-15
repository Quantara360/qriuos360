import { useRef, useState } from 'react'
import { auth as authApi, imageUrl } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotify } from '../context/NotificationContext.jsx'

export default function EditProfile() {
  const { user, setUser } = useAuth()
  const notify = useNotify()
  const isOwner = user?.role === 'owner'

  const [form, setForm] = useState({
    name:         user?.name         || '',
    hotel_name:   user?.hotel_name   || '',
    opening_time: user?.opening_time ? user.opening_time.slice(0, 5) : '',
    closing_time: user?.closing_time ? user.closing_time.slice(0, 5) : '',
  })
  const [logoFile,    setLogoFile]    = useState(null)
  const [logoPreview, setLogoPreview] = useState(user?.logo_path ? imageUrl(user.logo_path) : '')
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [saving,   setSaving]   = useState(false)
  const logoRef = useRef()

  const update   = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const updatePw = k => e => setPwForm(f => ({ ...f, [k]: e.target.value }))

  const onLogoPick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { notify.error('Please pick an image file'); return }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const save = async (e) => {
    e.preventDefault()

    if (!form.name.trim()) { notify.error('Name is required'); return }
    if (isOwner && !form.hotel_name.trim()) { notify.error('Hotel name is required'); return }

    if (pwForm.new_password) {
      if (!pwForm.old_password)                   { notify.error('Enter your current password'); return }
      if (pwForm.new_password !== pwForm.confirm)  { notify.error('New passwords do not match'); return }
      if (pwForm.new_password.length < 6)          { notify.error('New password must be at least 6 characters'); return }
    }

    const fd = new FormData()
    fd.append('name', form.name.trim())
    if (isOwner) {
      fd.append('hotel_name', form.hotel_name.trim())
      fd.append('opening_time', form.opening_time)
      fd.append('closing_time', form.closing_time)
    }
    if (logoFile) fd.append('logo', logoFile)
    if (pwForm.new_password) {
      fd.append('old_password', pwForm.old_password)
      fd.append('new_password', pwForm.new_password)
    }

    setSaving(true)
    try {
      const res = await authApi.updateProfile(fd)
      setUser(res.user)
      setLogoFile(null)
      setPwForm({ old_password: '', new_password: '', confirm: '' })
      notify.success('Profile updated successfully.')
    } catch (err) {
      notify.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const avatarLabel = isOwner ? 'Hotel logo' : 'Profile picture'
  const avatarBtn   = logoPreview ? `Change ${isOwner ? 'logo' : 'photo'}` : `Upload ${isOwner ? 'logo' : 'photo'}`

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Settings</div>
          <h1 className="page-title">Edit profile.</h1>
        </div>
      </div>

      <form onSubmit={save} style={{ maxWidth: 600 }}>

        {/* ── Profile info ── */}
        <div style={{ padding: 28, border: '1px solid var(--border)', borderRadius: 16, background: 'var(--bg-2)', marginBottom: 24 }}>
          <div className="section-h" style={{ marginBottom: 20 }}>
            {isOwner ? 'Hotel information' : 'Account information'}
          </div>

          {isOwner && (
            <div className="field">
              <label className="field-label">Hotel / restaurant name</label>
              <input className="field-input" value={form.hotel_name} onChange={update('hotel_name')} required />
            </div>
          )}

          <div className="field">
            <label className="field-label">Your name</label>
            <input className="field-input" value={form.name} onChange={update('name')} required />
          </div>

          {isOwner && (
            <div className="field">
              <label className="field-label">Opening hours</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-3)', marginBottom: 6 }}>
                    Opens
                  </div>
                  <input
                    className="field-input"
                    type="time"
                    value={form.opening_time}
                    onChange={update('opening_time')}
                  />
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-3)', paddingTop: 22 }}>—</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-3)', marginBottom: 6 }}>
                    Closes
                  </div>
                  <input
                    className="field-input"
                    type="time"
                    value={form.closing_time}
                    onChange={update('closing_time')}
                  />
                </div>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.13em', marginTop: 8 }}>
                Leave blank to hide hours from menu
              </div>
            </div>
          )}

          {/* Avatar / Logo */}
          <div className="field">
            <label className="field-label">{avatarLabel}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                onClick={() => logoRef.current?.click()}
                style={{
                  width: 80, height: 80, borderRadius: isOwner ? 14 : '50%', overflow: 'hidden',
                  border: '1.5px dashed var(--border-mid)', cursor: 'pointer',
                  background: 'var(--bg-3)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-3)', textAlign: 'center', padding: 8 }}>
                    Click to upload
                  </span>
                )}
              </div>
              <div>
                <button type="button" className="btn btn-ghost btn-tiny" onClick={() => logoRef.current?.click()}>
                  {avatarBtn}
                </button>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.14em', marginTop: 6 }}>
                  JPG · PNG · WebP · max 4 MB
                </div>
              </div>
            </div>
            <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onLogoPick} style={{ display: 'none' }} />
          </div>
        </div>

        {/* ── Change password ── */}
        <div style={{ padding: 28, border: '1px solid var(--border)', borderRadius: 16, background: 'var(--bg-2)', marginBottom: 28 }}>
          <div className="section-h" style={{ marginBottom: 6 }}>Change password</div>
          <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.13em', marginBottom: 20 }}>
            Leave blank to keep your current password
          </p>

          <div className="field">
            <label className="field-label">Current password</label>
            <input className="field-input" type="password" value={pwForm.old_password} onChange={updatePw('old_password')} autoComplete="current-password" />
          </div>
          <div className="field">
            <label className="field-label">New password</label>
            <input className="field-input" type="password" value={pwForm.new_password} onChange={updatePw('new_password')} autoComplete="new-password" />
          </div>
          <div className="field">
            <label className="field-label">Confirm new password</label>
            <input className="field-input" type="password" value={pwForm.confirm} onChange={updatePw('confirm')} autoComplete="new-password" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
