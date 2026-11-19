import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { ArrowRight } from 'lucide-react'

import { historyActionLabels } from '@/entities/stream'
import type { OfferHistoryState, StreamPublication } from '@/entities/stream'
import { DataTable } from '@/shared/ui/data-table'

const dateTime = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'medium' })

function OfferStatus({ state }: { state: OfferHistoryState | null }) {
  if (!state) return <span className="table-meta">Нет в потоке</span>
  return (
    <span className="history-share">
      {state.share}%
      {state.pinned && <small>Закреплена</small>}
      {state.state === 'disabled' && <small>Отключён</small>}
    </span>
  )
}

const columns: ColumnDef<StreamPublication>[] = [
  {
    accessorKey: 'published_at',
    header: 'Дата и время',
    sortDescFirst: true,
    cell: ({ row }) => <time className="history-time" dateTime={row.original.published_at}>
      {dateTime.format(new Date(row.original.published_at))}
    </time>,
  },
  {
    id: 'stream',
    header: 'Поток',
    cell: ({ row }) => <><strong>{row.original.stream_name}</strong><small className="table-meta">#{row.original.stream_id}</small></>,
  },
  {
    id: 'changes',
    header: 'Изменения офферов',
    cell: ({ row }) => (
      <ul className="history-changes" role="list">
        {row.original.changes.map((change) => (
          <li key={change.offer_id}>
            <div>
              <strong>{change.name}</strong> <span className="history-offer-id">#{change.offer_id}</span>
              <small className="table-meta">{change.actions.map((action) => historyActionLabels[action]).join(' · ')}</small>
            </div>
            <div className="history-delta" aria-label="Было и стало">
              <OfferStatus state={change.before} /><ArrowRight aria-label="Стало" /><OfferStatus state={change.after} />
            </div>
          </li>
        ))}
      </ul>
    ),
  },
]

export function HistoryTable({ entries, busy, descending, onSort }: {
  entries: StreamPublication[]
  busy: boolean
  descending: boolean
  onSort: (descending: boolean) => void
}) {
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
  return <DataTable table={table} label="История изменений кампании" className="history-table" busy={busy} />
}
