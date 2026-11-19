import { queryOptions } from '@tanstack/react-query'

import { get } from '@/shared/api/http'

export type Offer = { id: number; name: string; state: string }

export const offersQuery = queryOptions({
  queryKey: ['offers', 'catalog'],
  queryFn: ({ signal }) => get<Offer[]>('/offers', signal),
})
