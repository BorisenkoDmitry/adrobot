import { queryOptions } from '@tanstack/react-query'

import { get, post } from '@/shared/api/http'

export type StreamOffer = {
  offer_id: number
  name: string
  share: number
  pinned: boolean
  removed: boolean
}

export type Stream = {
  id: number
  campaign_id: number
  name: string
  type: string
  schema: string
  editable: boolean
  dirty: boolean
  conflicted: boolean
  revision: number
  offers: StreamOffer[]
}

export type StreamCommand = { action: 'publish' | 'cancel' }
  | { action: 'add' | 'remove' | 'restore' | 'toggle_pin'; offer_id: number }

function streamsPath(campaignId: number) {
  return `/campaigns/${campaignId}/streams`
}

export function streamsQuery(campaignId: number) {
  return queryOptions({
    queryKey: ['campaigns', campaignId, 'streams'],
    queryFn: ({ signal }) => get<Stream[]>(streamsPath(campaignId), signal),
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function streamMutationsKey(campaignId: number) {
  return ['campaigns', campaignId, 'stream-mutation'] as const
}

export function updateStream(stream: Stream, command: StreamCommand) {
  const base = `${streamsPath(stream.campaign_id)}/${stream.id}`
  if ('offer_id' in command) return post<Stream>(`${base}/draft`, { ...command, revision: stream.revision })
  return post<Stream>(`${base}/${command.action}`, { revision: stream.revision })
}
