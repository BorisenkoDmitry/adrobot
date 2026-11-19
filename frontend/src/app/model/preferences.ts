import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import type { Locale } from '@/shared/i18n'

type Preferences = { theme: 'light' | 'dark'; locale: Locale }
export const themeStorageKey = 'adrobot.theme'
export const localeStorageKey = 'adrobot.locale'

function getInitialState(): Preferences {
  try {
    return {
      theme: window.localStorage.getItem(themeStorageKey) === 'dark' ? 'dark' : 'light',
      locale: window.localStorage.getItem(localeStorageKey) === 'en' ? 'en' : 'ru',
    }
  } catch {
    return { theme: 'light', locale: 'ru' }
  }
}

export const preferencesSlice = createSlice({
  name: 'preferences',
  initialState: getInitialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },
    localeChanged(state, { payload }: PayloadAction<Locale>) {
      state.locale = payload
    },
  },
})

export const { localeChanged, toggleTheme } = preferencesSlice.actions
