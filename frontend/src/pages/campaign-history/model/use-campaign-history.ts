import { useQuery } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { streamHistoryQuery } from '@/entities/stream'
import type { HistoryFilters, StreamPublication } from '@/entities/stream'

import { campaignHistorySlice } from './campaign-history-slice'

const EMPTY_ENTRIES: StreamPublication[] = []
type HistoryRootState = Parameters<typeof campaignHistorySlice.selectors.selectView>[0]

export function useCampaignHistory(campaignId: number) {
  const dispatch = useDispatch()
  const { filters, cursors, descending } = useSelector((state: HistoryRootState) => (
    campaignHistorySlice.selectors.selectView(state, campaignId)
  ))
  const page = cursors.length - 1
  const result = useQuery(streamHistoryQuery(campaignId, filters, cursors[page], descending))
  const nextCursor = result.data?.next_cursor ?? null
  const actions = campaignHistorySlice.actions

  return {
    filters,
    page,
    descending,
    result,
    entries: result.data?.entries ?? EMPTY_ENTRIES,
    hasFilters: Object.values(filters).some(Boolean),
    hasNext: nextCursor !== null,
    applyFilters: (filters: HistoryFilters) => dispatch(actions.filtersApplied({ campaignId, filters })),
    setDescending: (descending: boolean) => dispatch(actions.sortChanged({ campaignId, descending })),
    previousPage: () => dispatch(actions.previousPageOpened(campaignId)),
    nextPage() {
      if (nextCursor !== null && !result.isPlaceholderData) {
        dispatch(actions.nextPageOpened({ campaignId, cursor: nextCursor }))
      }
    },
  }
}
