import { useIsMutating, useQuery } from '@tanstack/react-query'

import { streamMutationsKey, streamsQuery } from '@/entities/stream'

export function useCampaignStreams(campaignId: number) {
  const result = useQuery(streamsQuery(campaignId))
  const pendingEdits = useIsMutating({ mutationKey: streamMutationsKey(campaignId) })

  return {
    result,
    offerStreams: result.data?.filter((stream) => stream.editable) ?? [],
    reloadBlocked: result.isFetching || pendingEdits > 0,
    reload: () => { void result.refetch() },
  }
}
