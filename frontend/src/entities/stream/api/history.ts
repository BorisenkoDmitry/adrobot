import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import { get } from '@/shared/api/http'

export const historyActions = ['added', 'removed', 'restored', 'share', 'pinned', 'unpinned', 'state'] as const

export type HistoryAction = (typeof historyActions)[number]

export type HistoryFilters = {
  stream: string
  offer: string
  action: HistoryAction | ''
  from: string
  until: string
}

export type OfferHistoryState = { share: number; pinned: boolean; state: 'active' | 'disabled' }

export type StreamPublication = {
  id: number
  stream_id: number
  stream_name: string
  published_at: string
  changes: {
    offer_id: number
    name: string
    actions: HistoryAction[]
    before: OfferHistoryState | null
    after: OfferHistoryState | null
  }[]
}

type HistoryPage = { campaign_name: string; entries: StreamPublication[]; next_cursor: number | null }

export function streamHistoryKey(campaignId: number) {
  return ['campaigns', campaignId, 'history'] as const
}

export function streamHistoryQuery(campaignId: number, filters: HistoryFilters, cursor: number | null, descending: boolean) {
  const params = new URLSearchParams({ descending: String(descending) })
  if (cursor !== null) params.set('cursor', String(cursor))
  if (filters.stream) params.set('stream', filters.stream)
  if (filters.offer) params.set('offer', filters.offer)
  if (filters.action) params.set('action', filters.action)
  if (filters.from) params.set('from_date', new Date(`${filters.from}T00:00:00`).toISOString())
  if (filters.until) {
    const end = new Date(`${filters.until}T00:00:00`)
    end.setDate(end.getDate() + 1)
    params.set('until_date', end.toISOString())
  }

  return queryOptions({
    queryKey: [...streamHistoryKey(campaignId), params.toString()],
    queryFn: ({ signal }) => get<HistoryPage>(`/campaigns/${campaignId}/history?${params}`, signal),
    placeholderData: keepPreviousData,
  })
}
