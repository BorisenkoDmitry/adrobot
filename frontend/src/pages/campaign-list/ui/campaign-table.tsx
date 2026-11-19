import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowRight, GitFork } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'

import type { Campaign } from '@/entities/campaign'
import { useI18n } from '@/shared/i18n'
import type { MessageKey, Translate } from '@/shared/i18n'
import { Button } from '@/shared/ui/button'
import { DataTable } from '@/shared/ui/data-table'

const CAMPAIGN_STATES: Record<string, MessageKey | undefined> = {
  active: 'campaign.active', disabled: 'campaign.disabled', deleted: 'campaign.deleted',
}

const createColumns = (t: Translate): ColumnDef<Campaign>[] => [
  {
    accessorKey: 'name', header: t('table.name'),
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
    accessorKey: 'state', header: t('table.status'),
    cell: ({ row: { original: { state } } }) => {
      const status = CAMPAIGN_STATES[state]
      return <span className={`status-pill ${state === 'active' ? 'status-active' : ''}`}>
        <span aria-hidden="true" />{status ? t(status) : state}
      </span>
    },
  },
  {
    id: 'settings', header: t('campaign.settings'),
    cell: ({ row: { original: campaign } }) => {
      const related = [
        [t('campaign.domain'), campaign.domain_id], [t('campaign.group'), campaign.group_id],
        [t('campaign.source'), campaign.traffic_source_id],
      ].filter(([, id]) => Boolean(id))
      return related.length ? <span className="campaign-settings">{related.map(([label, id]) => (
        <span key={label}>{label} #{id}</span>
      ))}</span> : '—'
    },
  },
  {
    id: 'streams', header: () => <span className="sr-only">{t('streams.title')}</span>,
    cell: ({ row: { original: campaign } }) => <div className="table-link">
      <Button asChild variant="outline">
        <Link to={`/campaigns/${campaign.id}`} aria-label={t('campaign.streamsFor', { name: campaign.name })}>
          <GitFork aria-hidden="true" />{t('streams.title')}<ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </div>,
  },
]

export function CampaignTable({ campaigns, busy }: { campaigns: Campaign[]; busy: boolean }) {
  const { t } = useI18n()
  const columns = useMemo(() => createColumns(t), [t])
  const hasSettings = campaigns.some((campaign) => campaign.domain_id || campaign.group_id || campaign.traffic_source_id)
  const table = useReactTable({
    data: campaigns,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (campaign) => String(campaign.id),
    enableSorting: false,
    state: { columnVisibility: { settings: hasSettings } },
  })

  return <DataTable table={table} label={t('campaign.list')} className="campaign-table" busy={busy} />
}
