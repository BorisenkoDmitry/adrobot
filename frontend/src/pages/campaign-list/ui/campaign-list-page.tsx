import { ArrowDownRight, FolderOpen, Search } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { TablePagination } from '@/shared/ui/data-table'
import { ErrorState, LoadingState } from '@/shared/ui/state'

import { useCampaignList } from '../model/use-campaign-list'
import { CampaignTable } from './campaign-table'

export function CampaignListPage() {
  const list = useCampaignList()
  const { result } = list

  return (
    <section className="work-page">
      <header className="page-heading">
        <div><h1>Кампании</h1><p>Чтобы увидеть потоки, выбери кампанию и нажми «Потоки» в её строке.</p></div>
      </header>
      <div className="workspace-panel">
        <div className="panel-toolbar">
          <div className="filter-input">
            <Search aria-hidden="true" />
            <input type="search" className="field" aria-label="Фильтр по кампаниям на странице" placeholder="Поиск на странице"
              value={list.view.search} onChange={(event) => list.setSearch(event.target.value)} />
          </div>
          <form className="id-lookup" onSubmit={(event) => {
            event.preventDefault()
            list.openById()
          }}>
            <input className="field tabular-nums" aria-label="ID кампании" placeholder="ID кампании" inputMode="numeric"
              value={list.view.lookup} onChange={(event) => list.setLookup(event.target.value)} />
            <Button type="submit" variant="outline" disabled={!list.canOpenById}>Потоки по ID<ArrowDownRight aria-hidden="true" /></Button>
          </form>
        </div>
        {result.isPending ? <LoadingState>Загружаем кампании…</LoadingState> : result.isError ? (
          <div className="panel-padding"><ErrorState error={result.error} onRetry={() => { void result.refetch() }} /></div>
        ) : !list.visible.length ? (
          <div className="section-state"><FolderOpen aria-hidden="true" />
            {list.hasSearch ? 'На этой странице ничего не найдено.' : 'На этой странице нет кампаний.'}
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
