import { QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router/dom'

import { I18nProvider } from '@/shared/i18n'

import { store, useAppSelector } from '../model/store'
import { queryClient } from '../providers/query-client'
import { router } from '../providers/router'
import '../styles/index.css'

function LocalizedRouter() {
  const locale = useAppSelector((state) => state.preferences.locale)

  return <I18nProvider locale={locale}><RouterProvider router={router} /></I18nProvider>
}

export function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <LocalizedRouter />
      </QueryClientProvider>
    </Provider>
  )
}
