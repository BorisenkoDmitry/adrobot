import { useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'

import { translator } from './messages'
import type { Locale } from './messages'
import { I18nContext } from './use-i18n'

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const context = useMemo(() => ({ locale, t: translator(locale) }), [locale])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return <I18nContext.Provider value={context}>{children}</I18nContext.Provider>
}
