import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { ArrowRight } from 'lucide-react'
import { useMemo } from 'react'

import type { OfferHistoryState, StreamPublication } from '@/entities/stream'
import { useI18n } from '@/shared/i18n'
import type { Locale, Translate } from '@/shared/i18n'
import { DataTable } from '@/shared/ui/data-table'

function OfferStatus({ state }: { state: OfferHistoryState | null }) {
  const { t } = useI18n()
  if (!state) return <span className="table-meta">{t('history.noOffer')}</span>
  return (
    <span className="history-share">
      {state.share}%
      {state.pinned && <small>{t('history.locked')}</small>}
      {state.state === 'disabled' && <small>{t('history.disabled')}</small>}
    </span>
  )
}

function createColumns(locale: Locale, t: Translate): ColumnDef<StreamPublication>[] {
  const dateTime = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-GB', {
    dateStyle: 'short', timeStyle: 'medium',
  })

  return [
  {
    accessorKey: 'published_at',
    header: t('history.dateTime'),
    sortDescFirst: true,
    cell: ({ row }) => <time className="history-time" dateTime={row.original.published_at}>
      {dateTime.format(new Date(row.original.published_at))}
    </time>,
  },
  {
    id: 'stream',
    header: t('history.stream'),
    cell: ({ row }) => <><strong>{row.original.stream_name}</strong><small className="table-meta">#{row.original.stream_id}</small></>,
  },
  {
    id: 'changes',
    header: t('history.changes'),
    cell: ({ row }) => (
      <ul className="history-changes" role="list">
        {row.original.changes.map((change) => (
          <li key={change.offer_id}>
            <div>
              <strong>{change.name}</strong> <span className="history-offer-id">#{change.offer_id}</span>
              <small className="table-meta">{change.actions.map((action) => t(`history.action.${action}`)).join(' · ')}</small>
            </div>
            <div className="history-delta" aria-label={t('history.beforeAfter')}>
              <OfferStatus state={change.before} /><ArrowRight aria-label={t('history.after')} /><OfferStatus state={change.after} />
            </div>
          </li>
        ))}
      </ul>
    ),
  },
  ]
}

export function HistoryTable({ entries, busy, descending, onSort }: {
  entries: StreamPublication[]
  busy: boolean
  descending: boolean
  onSort: (descending: boolean) => void
}) {
  const { locale, t } = useI18n()
  const columns = useMemo(() => createColumns(locale, t), [locale, t])
  const sorting: SortingState = [{ id: 'published_at', desc: descending }]
  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (entry) => String(entry.id),
    state: { sorting },
    manualSorting: true,
    enableSortingRemoval: false,
    enableMultiSort: false,
    onSortingChange: (update) => {
      const next = typeof update === 'function' ? update(sorting) : update
      onSort(next[0]?.desc ?? true)
    },
  })
  return <DataTable table={table} label={t('history.table')} className="history-table" busy={busy} />
}
