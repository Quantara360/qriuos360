import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()
const MODES = ['dark', 'light', 'video']

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => {
      const saved = localStorage.getItem('dc-theme')
      return MODES.includes(saved) ? saved : 'video'
    }
  )

  useEffect(() => {
    // 'video' mode inherits dark CSS variables
    const cssTheme = theme === 'video' ? 'dark' : theme
    document.documentElement.setAttribute('data-theme', cssTheme)
    localStorage.setItem('dc-theme', theme)
  }, [theme])

  const cycleTheme = () =>
    setTheme(t => MODES[(MODES.indexOf(t) + 1) % MODES.length])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
