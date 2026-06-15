import { createContext, useCallback, useContext, useState } from 'react'

const Ctx = createContext(null)

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 380)
  }, [])

  const push = useCallback((type, message, duration = 4500) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev.slice(-4), { id, type, message, duration }])
    if (duration > 0) setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  const notify = {
    success: (msg, dur)  => push('success', msg, dur),
    error:   (msg, dur)  => push('error',   msg, dur ?? 6000),
    warning: (msg, dur)  => push('warning', msg, dur),
    info:    (msg, dur)  => push('info',    msg, dur),
  }

  return (
    <Ctx.Provider value={{ toasts, dismiss, notify }}>
      {children}
    </Ctx.Provider>
  )
}

export const useNotify = () => useContext(Ctx).notify
export const useToasts = () => { const c = useContext(Ctx); return { toasts: c.toasts, dismiss: c.dismiss } }
