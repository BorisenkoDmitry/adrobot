import { ArrowDownRight, FolderOpen, Search } from 'lucide-react'

import { useI18n } from '@/shared/i18n'
import { Button } from '@/shared/ui/button'
import { TablePagination } from '@/shared/ui/data-table'
import { ErrorState, LoadingState } from '@/shared/ui/state'

import { useCampaignList } from '../model/use-campaign-list'
import { CampaignTable } from './campaign-table'

export function CampaignListPage() {
  const { t } = useI18n()
  const list = useCampaignList()
  const { result } = list

  return (
    <section className="work-page">
      <header className="page-heading">
        <div><h1>{t('nav.campaigns')}</h1><p>{t('campaign.description')}</p></div>
      </header>
      <div className="workspace-panel">
        <div className="panel-toolbar">
          <div className="filter-input">
            <Search aria-hidden="true" />
            <input type="search" className="field" aria-label={t('campaign.filter')} placeholder={t('campaign.search')}
              value={list.view.search} onChange={(event) => list.setSearch(event.target.value)} />
          </div>
          <form className="id-lookup" onSubmit={(event) => {
            event.preventDefault()
            list.openById()
          }}>
            <input className="field tabular-nums" aria-label={t('campaign.id')} placeholder={t('campaign.id')} inputMode="numeric"
              value={list.view.lookup} onChange={(event) => list.setLookup(event.target.value)} />
            <Button type="submit" variant="outline" disabled={!list.canOpenById}>{t('campaign.openById')}<ArrowDownRight aria-hidden="true" /></Button>
          </form>
        </div>
        {result.isPending ? <LoadingState>{t('campaign.loading')}</LoadingState> : result.isError ? (
          <div className="panel-padding"><ErrorState error={result.error} onRetry={() => { void result.refetch() }} /></div>
        ) : !list.visible.length ? (
          <div className="section-state"><FolderOpen aria-hidden="true" />
            {t(list.hasSearch ? 'campaign.noMatches' : 'campaign.empty')}
          </div>
        ) : (
          <CampaignTable campaigns={list.visible} busy={result.isFetching} />
        )}
        {(!result.isPending && !result.isError) && (
          <TablePagination page={list.view.page} pending={result.isFetching} hasNext={list.hasNext}
            onPrevious={() => list.setPage(list.view.page - 1)} onNext={() => list.setPage(list.view.page + 1)} />
        )}
      </div>
    </section>
  )
}
