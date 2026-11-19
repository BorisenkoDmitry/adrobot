import { queryOptions } from '@tanstack/react-query'

type Readiness =
  | { status: 'ready'; database: 'up' }
  | { status: 'unavailable'; database: 'down' }

async function getReadiness(signal: AbortSignal): Promise<Readiness> {
  const response = await fetch('/api/v1/health/ready', { signal })
  if (!response.ok && response.status !== 503) {
    throw new Error(`API returned HTTP ${response.status}`)
  }

  const data: unknown = await response.json()
  if (typeof data === 'object' && data !== null && 'status' in data && 'database' in data) {
    if (response.ok && data.status === 'ready' && data.database === 'up') {
      return { status: 'ready', database: 'up' }
    }
    if (response.status === 503 && data.status === 'unavailable' && data.database === 'down') {
      return { status: 'unavailable', database: 'down' }
    }
  }
  throw new Error('Unexpected readiness response')
}

export const readinessQuery = queryOptions({
  queryKey: ['health', 'readiness'],
  queryFn: ({ signal }) => getReadiness(signal),
  retry: false,
})
