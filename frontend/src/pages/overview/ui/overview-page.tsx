import { useQuery } from '@tanstack/react-query'

import { KeitaroKeySettings } from '@/features/manage-keitaro-key'
import { readinessQuery } from '@/shared/api/health'
import { useI18n } from '@/shared/i18n'
import { Button } from '@/shared/ui/button'

export function OverviewPage() {
  const { t } = useI18n()
  const readiness = useQuery(readinessQuery)
  let apiStatus = t('status.checking')
  let databaseStatus = t('status.checking')

  if (readiness.isSuccess) {
    apiStatus = t('status.available')
    databaseStatus = t(readiness.data.database === 'up' ? 'status.connected' : 'status.unavailable')
  } else if (readiness.isError) {
    apiStatus = t('status.noResponse')
    databaseStatus = t('status.unknown')
  }

  return (
    <section className="work-page">
      <header className="page-heading"><h1>{t('nav.status')}</h1></header>
      <div className="workspace-panel status-panel">
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
          {t('status.checkAgain')}
        </Button>
      </div>
      <KeitaroKeySettings />
    </section>
  )
}
