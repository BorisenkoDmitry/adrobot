import { createContext, useContext } from 'react'

import { translator } from './messages'
import type { Locale, Translate } from './messages'

export const I18nContext = createContext<{ locale: Locale; t: Translate }>({ locale: 'ru', t: translator('ru') })

export function useI18n() {
  return useContext(I18nContext)
}
