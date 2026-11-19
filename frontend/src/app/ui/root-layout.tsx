import { Activity, GitFork, Layers3, Moon, Sun } from 'lucide-react'
import { useEffect } from 'react'
import { Link, NavLink, Outlet } from 'react-router'

import { useI18n } from '@/shared/i18n'
import { Button } from '@/shared/ui/button'

import { localeStorageKey, themeStorageKey, toggleTheme } from '../model/preferences'
import { useAppDispatch, useAppSelector } from '../model/store'
import { LanguageSelect } from './language-select'

export function RootLayout() {
  const theme = useAppSelector((state) => state.preferences.theme)
  const dispatch = useAppDispatch()
  const { locale, t } = useI18n()
  const isDark = theme === 'dark'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    try {
      window.localStorage.setItem(themeStorageKey, theme)
      window.localStorage.setItem(localeStorageKey, locale)
    } catch {
      // Preferences still apply for the current session.
    }
  }, [isDark, locale, theme])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">{t('nav.skip')}</a>
      <aside className="app-sidebar">
        <Link to="/campaigns" className="brand-link" aria-label={t('nav.brand')}>
          <span className="brand-icon"><GitFork aria-hidden="true" /></span>
          <span className="brand-name"><strong>Adrobot</strong><small>Keitaro</small></span>
        </Link>
        <nav className="app-nav" aria-label={t('nav.main')}>
          <NavLink to="/campaigns"><Layers3 aria-hidden="true" />{t('nav.campaigns')}</NavLink>
          <NavLink to="/status"><Activity aria-hidden="true" />{t('nav.status')}</NavLink>
        </nav>
        <div className="sidebar-utilities">
          <Button
            variant="outline"
            className="theme-button w-full justify-start"
            aria-label={t(isDark ? 'nav.switchLight' : 'nav.switchDark')}
            onClick={() => dispatch(toggleTheme())}
          >
            {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            <span className="theme-label">{t(isDark ? 'nav.light' : 'nav.dark')}</span>
          </Button>
          <LanguageSelect />
        </div>
      </aside>
      <main id="main-content" tabIndex={-1} className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
