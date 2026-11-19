import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import { get } from '@/shared/api/http'

export type Campaign = {
  id: number
  name: string
  alias: string
  state: string
  domain_id: number | null
  group_id: number | null
  traffic_source_id: number | null
  url: string | null
  admin_url?: string | null
}

export function campaignsQuery(offset: number, limit: number) {
  return queryOptions({
    queryKey: ['campaigns', 'list', offset, limit],
    queryFn: ({ signal }) => get<Campaign[]>(`/campaigns?limit=${limit}&offset=${offset}`, signal),
    placeholderData: keepPreviousData,
  })
}

export function campaignQuery(id: number) {
  return queryOptions({
    queryKey: ['campaigns', 'detail', id],
    queryFn: ({ signal }) => get<Campaign>(`/campaigns/${id}`, signal),
  })
}
