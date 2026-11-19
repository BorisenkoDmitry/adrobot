import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import type { HistoryFilters } from '@/entities/stream'

type HistoryView = { filters: HistoryFilters; cursors: (number | null)[]; descending: boolean }
type CampaignHistoryState = Record<number, HistoryView | undefined>

export const EMPTY_HISTORY_FILTERS: HistoryFilters = { stream: '', offer: '', action: '', from: '', until: '' }
const DEFAULT_VIEW: HistoryView = { filters: EMPTY_HISTORY_FILTERS, cursors: [null], descending: true }
const initialState: CampaignHistoryState = {}

function getOrCreateView(state: CampaignHistoryState, campaignId: number) {
  return state[campaignId] ??= {
    filters: { ...EMPTY_HISTORY_FILTERS }, cursors: [null], descending: true,
  }
}

export const campaignHistorySlice = createSlice({
  name: 'campaignHistory',
  initialState,
  reducers: {
    filtersApplied(state, { payload }: PayloadAction<{ campaignId: number; filters: HistoryFilters }>) {
      const view = getOrCreateView(state, payload.campaignId)
      view.filters = payload.filters
      view.cursors = [null]
    },
    sortChanged(state, { payload }: PayloadAction<{ campaignId: number; descending: boolean }>) {
      const view = getOrCreateView(state, payload.campaignId)
      if (view.descending !== payload.descending) {
        view.descending = payload.descending
        view.cursors = [null]
      }
    },
    nextPageOpened(state, { payload }: PayloadAction<{ campaignId: number; cursor: number }>) {
      const view = getOrCreateView(state, payload.campaignId)
      if (view.cursors.at(-1) !== payload.cursor) view.cursors.push(payload.cursor)
    },
    previousPageOpened(state, { payload }: PayloadAction<number>) {
      const view = getOrCreateView(state, payload)
      if (view.cursors.length > 1) view.cursors.pop()
    },
  },
  selectors: {
    selectView: (state, campaignId: number) => state[campaignId] ?? DEFAULT_VIEW,
  },
})
