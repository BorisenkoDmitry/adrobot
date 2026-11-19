import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowRight, GitFork } from 'lucide-react'
import { Link } from 'react-router'

import type { Campaign } from '@/entities/campaign'
import { Button } from '@/shared/ui/button'
import { DataTable } from '@/shared/ui/data-table'

const CAMPAIGN_STATES: Record<string, string> = { active: 'Активна', disabled: 'Отключена', deleted: 'Удалена' }

const columns: ColumnDef<Campaign>[] = [
  {
    accessorKey: 'name', header: 'Название',
    cell: ({ row: { original: campaign } }) => <>
      <Link className="table-title" to={`/campaigns/${campaign.id}`}>{campaign.name}</Link>
      {campaign.alias && <span className="table-meta">/{campaign.alias}</span>}
    </>,
  },
  {
    accessorKey: 'id', header: 'ID',
    cell: ({ row }) => <span className="table-id">{row.original.id}</span>,
  },
  {
    accessorKey: 'state', header: 'Состояние',
    cell: ({ row: { original: { state } } }) => <span className={`status-pill ${state === 'active' ? 'status-active' : ''}`}>
      <span aria-hidden="true" />{CAMPAIGN_STATES[state] ?? state}
    </span>,
  },
  {
    id: 'settings', header: 'Настройки Keitaro',
    cell: ({ row: { original: campaign } }) => {
      const related = [
        ['Домен', campaign.domain_id], ['Группа', campaign.group_id], ['Источник', campaign.traffic_source_id],
      ].filter(([, id]) => Boolean(id))
      return related.length ? <span className="campaign-settings">{related.map(([label, id]) => (
        <span key={label}>{label} #{id}</span>
      ))}</span> : '—'
    },
  },
  {
    id: 'streams', header: () => <span className="sr-only">Потоки</span>,
    cell: ({ row: { original: campaign } }) => <div className="table-link">
      <Button asChild variant="outline">
        <Link to={`/campaigns/${campaign.id}`} aria-label={`Потоки кампании ${campaign.name}`}>
          <GitFork aria-hidden="true" />Потоки<ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </div>,
  },
]

export function CampaignTable({ campaigns, busy }: { campaigns: Campaign[]; busy: boolean }) {
  const hasSettings = campaigns.some((campaign) => campaign.domain_id || campaign.group_id || campaign.traffic_source_id)
  const table = useReactTable({
    data: campaigns,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (campaign) => String(campaign.id),
    enableSorting: false,
    state: { columnVisibility: { settings: hasSettings } },
  })

  return <DataTable table={table} label="Список кампаний" className="campaign-table" busy={busy} />
}
