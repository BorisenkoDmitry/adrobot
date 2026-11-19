import { createSlice } from '@reduxjs/toolkit'

type Preferences = { theme: 'light' | 'dark' }
export const themeStorageKey = 'adrobot.theme'

function getInitialState(): Preferences {
  try {
    return { theme: window.localStorage.getItem(themeStorageKey) === 'dark' ? 'dark' : 'light' }
  } catch {
    return { theme: 'light' }
  }
}

export const preferencesSlice = createSlice({
  name: 'preferences',
  initialState: getInitialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },
  },
})

export const { toggleTheme } = preferencesSlice.actions
