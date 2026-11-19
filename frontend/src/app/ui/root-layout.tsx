import { Activity, GitFork, Layers3, Moon, Sun } from 'lucide-react'
import { useEffect } from 'react'
import { Link, NavLink, Outlet } from 'react-router'

import { Button } from '@/shared/ui/button'

import { themeStorageKey, toggleTheme } from '../model/preferences'
import { useAppDispatch, useAppSelector } from '../model/store'

export function RootLayout() {
  const theme = useAppSelector((state) => state.preferences.theme)
  const dispatch = useAppDispatch()
  const isDark = theme === 'dark'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    try {
      window.localStorage.setItem(themeStorageKey, theme)
    } catch {
      // The theme can still be switched for this session.
    }
  }, [isDark, theme])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">К содержимому</a>
      <aside className="app-sidebar">
        <Link to="/campaigns" className="brand-link" aria-label="Adrobot: кампании">
          <span className="brand-icon"><GitFork aria-hidden="true" /></span>
          <span className="brand-name"><strong>Adrobot</strong><small>Keitaro</small></span>
        </Link>
        <nav className="app-nav" aria-label="Основное меню">
          <NavLink to="/campaigns"><Layers3 aria-hidden="true" />Кампании</NavLink>
          <NavLink to="/status"><Activity aria-hidden="true" />Состояние сервиса</NavLink>
        </nav>
        <div className="sidebar-utilities">
          <Button
            variant="outline"
            className="theme-button w-full justify-start"
            aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
            onClick={() => dispatch(toggleTheme())}
          >
            {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            <span className="theme-label">{isDark ? 'Светлая тема' : 'Тёмная тема'}</span>
          </Button>
        </div>
      </aside>
      <main id="main-content" tabIndex={-1} className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
