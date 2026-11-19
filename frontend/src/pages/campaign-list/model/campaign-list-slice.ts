import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export const campaignListSlice = createSlice({
  name: 'campaignList',
  initialState: { page: 0, search: 'test_borisenko_company1', lookup: '' },
  reducers: {
    pageChanged(state, action: PayloadAction<number>) {
      state.page = Math.max(0, action.payload)
    },
    searchChanged(state, action: PayloadAction<string>) {
      state.search = action.payload
    },
    lookupChanged(state, action: PayloadAction<string>) {
      state.lookup = action.payload
    },
  },
})
