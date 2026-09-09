import { useEffect, useState } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || document.documentElement.getAttribute('data-theme') || 'dark',
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}
