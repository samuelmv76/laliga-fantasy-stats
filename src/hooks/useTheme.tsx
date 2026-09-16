import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(
    () =>
      (localStorage.getItem('theme') ??
        document.documentElement.getAttribute('data-theme') ??
        'dark') as Theme,
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}
