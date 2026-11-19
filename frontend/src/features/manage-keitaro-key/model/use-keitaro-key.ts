import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'

import { keyStatusQuery, revealKeitaroKey, saveKeitaroKey, testKeitaroKey } from '../api/keitaro-key'

type Operation = 'save' | 'test' | 'reveal'
type KeyForm = {
  draft: string
  revealedKey: string | null
  visible: boolean
  pending: Operation | null
  notice: 'key.saveSuccess' | 'key.testSuccess' | null
  error: unknown
}

const initialForm: KeyForm = {
  draft: '', revealedKey: null, visible: false, pending: null, notice: null, error: null,
}

export function useKeitaroKey() {
  const status = useQuery(keyStatusQuery)
  const queryClient = useQueryClient()
  const [form, setForm] = useState(initialForm)
  const inFlight = useRef(false)
  const draft = form.draft.trim()
  const source = status.data?.source

  async function run(operation: Operation, task: () => Promise<void>) {
    if (inFlight.current) return
    inFlight.current = true
    setForm((current) => ({ ...current, pending: operation, notice: null, error: null }))
    try {
      await task()
    } catch (error) {
      setForm((current) => ({ ...current, error }))
    } finally {
      inFlight.current = false
      setForm((current) => ({ ...current, pending: null }))
    }
  }

  function toggleVisibility() {
    if (!form.visible && !form.draft && source === 'saved') {
      void run('reveal', async () => {
        const response = await revealKeitaroKey()
        setForm((current) => ({ ...current, visible: true, revealedKey: response.api_key }))
      })
      return
    }
    setForm((current) => ({ ...current, visible: !current.visible, revealedKey: null }))
  }

  return {
    status, source, form,
    canReveal: Boolean(form.draft) || source === 'saved',
    canSave: Boolean(draft && status.data?.storage_available),
    canTest: Boolean(draft) || (source !== undefined && source !== 'none'),
    edit(value: string) {
      setForm((current) => ({ ...current, draft: value, revealedKey: null, notice: null, error: null }))
    },
    toggleVisibility,
    save() {
      if (!draft || !status.data?.storage_available) return
      void run('save', async () => {
        const saved = await saveKeitaroKey(draft)
        queryClient.setQueryData(keyStatusQuery.queryKey, saved)
        const trackerQueries = {
          predicate: ({ queryKey }: { queryKey: readonly unknown[] }) => (
            queryKey[0] === 'campaigns' || queryKey[0] === 'offers'
          ),
        }
        await queryClient.cancelQueries(trackerQueries)
        queryClient.removeQueries(trackerQueries)
        setForm({ ...initialForm, notice: 'key.saveSuccess' })
      })
    },
    test() {
      void run('test', async () => {
        await testKeitaroKey(draft)
        setForm((current) => ({ ...current, notice: 'key.testSuccess' }))
      })
    },
  }
}
