import { QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router/dom'

import { store } from '../model/store'
import { queryClient } from '../providers/query-client'
import { router } from '../providers/router'
import '../styles/index.css'

export function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </Provider>
  )
}
