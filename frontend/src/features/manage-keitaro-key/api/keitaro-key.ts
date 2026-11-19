import { queryOptions } from '@tanstack/react-query'

import { get, post, put } from '@/shared/api/http'

type KeyStatus = { source: 'saved' | 'environment' | 'none'; storage_available: boolean }
const path = '/settings/keitaro'

export const keyStatusQuery = queryOptions({
  queryKey: ['settings', 'keitaro-key'],
  queryFn: ({ signal }) => get<KeyStatus>(path, signal),
})

export function saveKeitaroKey(key: string) {
  return put<KeyStatus>(path, { api_key: key })
}

export function testKeitaroKey(key: string) {
  return post<{ ok: boolean }>(`${path}/test`, key ? { api_key: key } : {})
}

export function revealKeitaroKey() {
  return post<{ api_key: string }>(`${path}/reveal`, {})
}
