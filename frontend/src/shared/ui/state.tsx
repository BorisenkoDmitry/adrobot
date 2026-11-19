import { AlertCircle, LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from './button'

export function LoadingState({ children }: { children: ReactNode }) {
  return <div className="section-state" role="status"><LoaderCircle className="size-5 animate-spin" aria-hidden="true" />{children}</div>
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <span>{error instanceof Error ? error.message : 'Не удалось выполнить запрос.'}</span>
      {onRetry && <Button className="ml-auto" onClick={onRetry} variant="outline">Повторить</Button>}
    </div>
  )
}
