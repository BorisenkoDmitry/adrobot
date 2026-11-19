import { ChevronLeft, History } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { parseRecordId } from '@/shared/lib/id'
import { TablePagination } from '@/shared/ui/data-table'
import { ErrorState, LoadingState } from '@/shared/ui/state'

import { useCampaignHistory } from '../model/use-campaign-history'
import { HistoryFiltersForm } from './history-filters-form'
import { HistoryTable } from './history-table'

function CampaignHistory({ campaignId }: { campaignId: number }) {
  const history = useCampaignHistory(campaignId)
  const { result } = history

  return (
    <section className="work-page">
      <header className="page-heading">
        <div className="min-w-0">
          <Link className="back-link" to={`/campaigns/${campaignId}`}><ChevronLeft aria-hidden="true" />К потокам</Link>
          <h1>История изменений</h1>
          <p>{result.data?.campaign_name ?? `Кампания #${campaignId}`}</p>
        </div>
      </header>
      <p className="history-purpose">
        История показывает, когда в потоках менялись офферы и доли. После каждой публикации через Adrobot здесь видно,
        что изменилось. Сопоставь время публикации с отчётами Keitaro, чтобы понять, как изменилось число кликов.
      </p>
      <div className="workspace-panel">
        <HistoryFiltersForm initialFilters={history.filters} pending={result.isFetching} onApply={history.applyFilters} />
        {result.isPending ? <LoadingState>Загружаем историю…</LoadingState> : result.isError ? (
          <div className="panel-padding"><ErrorState error={result.error} onRetry={() => { void result.refetch() }} /></div>
        ) : history.entries.length ? (
          <HistoryTable entries={history.entries} busy={result.isFetching}
            descending={history.descending} onSort={history.setDescending} />
        ) : (
          <div className="section-state"><History aria-hidden="true" />
            {history.hasFilters ? 'По этим фильтрам ничего не найдено.' : 'У кампании пока нет записей в истории.'}
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
  const { campaignId } = useParams()
  const id = parseRecordId(campaignId ?? '')
  return id === null ? (
    <section className="work-page">
      <Link className="back-link" to="/campaigns"><ChevronLeft aria-hidden="true" />Кампании</Link>
      <ErrorState error={new Error('У кампании должен быть числовой ID.')} />
    </section>
  ) : <CampaignHistory key={id} campaignId={id} />
}
