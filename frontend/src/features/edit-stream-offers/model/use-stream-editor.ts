import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { streamHistoryKey, streamMutationsKey, streamsQuery, updateStream } from '@/entities/stream'
import type { Stream, StreamCommand } from '@/entities/stream'
import { ApiError } from '@/shared/api/http'

type EditorUiState = {
  notice: 'stream.publishSuccess' | 'stream.discardSuccess' | null
  detachingOfferId: number | null
}
const initialUi: EditorUiState = { notice: null, detachingOfferId: null }

export function useStreamEditor(stream: Stream, refreshing: boolean) {
  const [ui, setUi] = useState(initialUi)
  const queryClient = useQueryClient()
  const { queryKey } = streamsQuery(stream.campaign_id)
  const mutation = useMutation({
    mutationKey: streamMutationsKey(stream.campaign_id),
    mutationFn: (command: StreamCommand) => updateStream(stream, command),
    onMutate: async () => {
      setUi((current) => ({ ...current, notice: null }))
      await queryClient.cancelQueries({ queryKey })
    },
    onSuccess: (next, command) => {
      queryClient.setQueryData<Stream[]>(queryKey, (current) => current?.map((row) => row.id === next.id ? next : row))
      if (command.action === 'publish') {
        setUi((current) => ({ ...current, notice: 'stream.publishSuccess' }))
        void queryClient.invalidateQueries({ queryKey: streamHistoryKey(stream.campaign_id) })
      }
      if (command.action === 'cancel') setUi((current) => ({ ...current, notice: 'stream.discardSuccess' }))
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 409) {
        await queryClient.invalidateQueries({ queryKey })
      }
    },
  })

  const working = mutation.isPending || refreshing
  const blocked = working || stream.conflicted
  const attached = stream.offers.filter((offer) => !offer.removed)
  const detached = stream.offers.filter((offer) => offer.removed)
  const offerToDetach = attached.find((offer) => offer.offer_id === ui.detachingOfferId) ?? null

  function run(command: StreamCommand, onSuccess?: () => void) {
    if (!working && (!stream.conflicted || command.action === 'cancel')) {
      mutation.mutate(command, { onSuccess })
    }
  }

  function setDetachingOffer(offerId: number | null) {
    setUi((current) => ({ ...current, detachingOfferId: offerId }))
  }

  return {
    attached,
    offers: [...attached, ...detached],
    offerToDetach,
    working,
    blocked,
    notice: ui.notice,
    error: mutation.error,
    publishing: mutation.isPending && mutation.variables?.action === 'publish',
    setDetachingOffer,
    confirmDetach() {
      if (offerToDetach && !blocked) {
        setDetachingOffer(null)
        run({ action: 'remove', offer_id: offerToDetach.offer_id })
      }
    },
    addOffer(offerId: number, onSuccess: () => void) {
      const action = detached.some((offer) => offer.offer_id === offerId) ? 'restore' : 'add'
      run({ action, offer_id: offerId }, onSuccess)
    },
    restoreOffer: (offerId: number) => run({ action: 'restore', offer_id: offerId }),
    togglePin: (offerId: number) => run({ action: 'toggle_pin', offer_id: offerId }),
    publish: () => run({ action: 'publish' }),
    cancel: () => run({ action: 'cancel' }),
  }
}
