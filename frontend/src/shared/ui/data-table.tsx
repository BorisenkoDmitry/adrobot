import { flexRender } from '@tanstack/react-table'
import type { Table } from '@tanstack/react-table'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

import { Button } from './button'

export function DataTable<T>({ table, label, busy, className }: {
  table: Table<T>
  label: string
  busy: boolean
  className?: string
}) {
  return (
    <div className="table-scroll">
      <table className={cn('data-table', className)} aria-label={label} aria-busy={busy}>
        <thead>{table.getHeaderGroups().map((group) => (
          <tr key={group.id}>{group.headers.map((header) => {
            const sorted = header.column.getIsSorted()
            const SortIcon = sorted === 'asc' ? ChevronUp : sorted === 'desc' ? ChevronDown : ChevronsUpDown
            const title = flexRender(header.column.columnDef.header, header.getContext())
            return (
              <th key={header.id} colSpan={header.colSpan} scope="col"
                aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}>
                {!header.isPlaceholder && (header.column.getCanSort() ? (
                  <button className="table-sort" type="button" onClick={header.column.getToggleSortingHandler()}>
                    {title}<SortIcon aria-hidden="true" />
                  </button>
                ) : title)}
              </th>
            )
          })}</tr>
        ))}</thead>
        <tbody>{table.getRowModel().rows.map((row) => (
          <tr key={row.id}>{row.getVisibleCells().map((cell) => (
            <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
          ))}</tr>
        ))}</tbody>
      </table>
    </div>
  )
}

export function TablePagination({ page, pending, hasNext, onPrevious, onNext }: {
  page: number
  pending: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <nav className="panel-footer" aria-label="Страницы таблицы">
      <span aria-live="polite">{pending ? 'Загружаем…' : `Страница ${page + 1}`}</span>
      <div className="flex gap-2">
        <Button variant="outline" size="icon" aria-label="Предыдущая страница" disabled={page === 0 || pending} onClick={onPrevious}>
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Следующая страница" disabled={!hasNext || pending} onClick={onNext}>
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
