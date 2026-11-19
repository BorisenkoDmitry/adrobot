import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router'

import { campaignsQuery } from '@/entities/campaign'
import type { Campaign } from '@/entities/campaign'
import { parseRecordId } from '@/shared/lib/id'
import { useDebounce } from '@/shared/lib/use-debounce'

import { campaignListSlice } from './campaign-list-slice'

const PAGE_SIZE = 50
const EMPTY_CAMPAIGNS: Campaign[] = []

export function useCampaignList() {
  const view = useSelector(campaignListSlice.selectSlice)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const result = useQuery(campaignsQuery(view.page * PAGE_SIZE, PAGE_SIZE))
  const campaigns = result.data ?? EMPTY_CAMPAIGNS
  const lookupId = parseRecordId(view.lookup)
  const debouncedSearch = useDebounce(view.search, 300)
  const search = debouncedSearch.trim().toLocaleLowerCase('ru-RU')
  const visible = useMemo(() => search ? campaigns.filter((campaign) => (
    [campaign.name, campaign.alias, String(campaign.id)].some((value) => value.toLocaleLowerCase('ru-RU').includes(search))
  )) : campaigns, [campaigns, search])

  return {
    view,
    result,
    visible,
    hasSearch: Boolean(search),
    hasNext: campaigns.length === PAGE_SIZE,
    canOpenById: lookupId !== null,
    setPage: (page: number) => dispatch(campaignListSlice.actions.pageChanged(page)),
    setSearch: (value: string) => dispatch(campaignListSlice.actions.searchChanged(value)),
    setLookup: (value: string) => dispatch(campaignListSlice.actions.lookupChanged(value)),
    openById() {
      if (lookupId !== null) void navigate(`/campaigns/${lookupId}`)
    },
  }
}
