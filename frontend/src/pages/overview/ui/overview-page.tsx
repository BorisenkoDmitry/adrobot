import { useQuery } from '@tanstack/react-query'

import { readinessQuery } from '@/shared/api/health'
import { Button } from '@/shared/ui/button'

export function OverviewPage() {
  const readiness = useQuery(readinessQuery)
  let apiStatus = 'Проверяем…'
  let databaseStatus = 'Проверяем…'

  if (readiness.isSuccess) {
    apiStatus = 'Доступен'
    databaseStatus = readiness.data.database === 'up' ? 'Подключён' : 'Недоступен'
  } else if (readiness.isError) {
    apiStatus = 'Нет ответа'
    databaseStatus = 'Неизвестно'
  }

  return (
    <section className="work-page">
      <header className="page-heading"><h1>Состояние сервиса</h1></header>
      <div className="workspace-panel max-w-lg p-5">
        <dl aria-live="polite" className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm">
          <dt className="text-muted-foreground">API</dt>
          <dd>{apiStatus}</dd>
          <dt className="text-muted-foreground">PostgreSQL</dt>
          <dd>{databaseStatus}</dd>
        </dl>
        <Button
          className="mt-5"
          variant="outline"
          disabled={readiness.isFetching}
          onClick={() => { void readiness.refetch() }}
        >
          Проверить снова
        </Button>
      </div>
    </section>
  )
}
