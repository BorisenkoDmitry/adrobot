import { combineSlices, configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'

import { campaignHistorySlice } from '@/pages/campaign-history'
import { campaignListSlice } from '@/pages/campaign-list'

import { preferencesSlice } from './preferences'

export const store = configureStore({
  reducer: combineSlices(preferencesSlice, campaignListSlice, campaignHistorySlice),
})

export const useAppDispatch = useDispatch.withTypes<typeof store.dispatch>()
export const useAppSelector = useSelector.withTypes<ReturnType<typeof store.getState>>()
