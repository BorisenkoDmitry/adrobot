import { ChevronLeft, History } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { useI18n } from '@/shared/i18n'
import { parseRecordId } from '@/shared/lib/id'
import { TablePagination } from '@/shared/ui/data-table'
import { ErrorState, LoadingState } from '@/shared/ui/state'

import { useCampaignHistory } from '../model/use-campaign-history'
import { HistoryFiltersForm } from './history-filters-form'
import { HistoryTable } from './history-table'

function CampaignHistory({ campaignId }: { campaignId: number }) {
  const { t } = useI18n()
  const history = useCampaignHistory(campaignId)
  const { result } = history

  return (
    <section className="work-page">
      <header className="page-heading">
        <div className="min-w-0">
          <Link className="back-link" to={`/campaigns/${campaignId}`}><ChevronLeft aria-hidden="true" />{t('history.back')}</Link>
          <h1>{t('history.title')}</h1>
          <p>{result.data?.campaign_name ?? t('campaign.single', { id: campaignId })}</p>
        </div>
      </header>
      <p className="history-purpose">{t('history.description')}</p>
      <div className="workspace-panel">
        <HistoryFiltersForm initialFilters={history.filters} pending={result.isFetching} onApply={history.applyFilters} />
        {result.isPending ? <LoadingState>{t('history.loading')}</LoadingState> : result.isError ? (
          <div className="panel-padding"><ErrorState error={result.error} onRetry={() => { void result.refetch() }} /></div>
        ) : history.entries.length ? (
          <HistoryTable entries={history.entries} busy={result.isFetching}
            descending={history.descending} onSort={history.setDescending} />
        ) : (
          <div className="section-state"><History aria-hidden="true" />
            {t(history.hasFilters ? 'history.noMatches' : 'history.empty')}
          </div>
        )}
        {(history.page > 0 || history.hasNext) && (
          <TablePagination page={history.page} pending={result.isFetching} hasNext={history.hasNext}
            onPrevious={history.previousPage} onNext={history.nextPage} />
        )}
      </div>
    </section>
  )
}

export function CampaignHistoryPage() {
  const { t } = useI18n()
  const { campaignId } = useParams()
  const id = parseRecordId(campaignId ?? '')
  return id === null ? (
    <section className="work-page">
      <Link className="back-link" to="/campaigns"><ChevronLeft aria-hidden="true" />{t('nav.campaigns')}</Link>
      <ErrorState error={new Error(t('campaign.invalidId'))} />
    </section>
  ) : <CampaignHistory key={id} campaignId={id} />
}
