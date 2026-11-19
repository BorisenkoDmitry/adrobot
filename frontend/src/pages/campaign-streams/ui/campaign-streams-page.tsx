import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Download, ExternalLink, GitFork, History, LoaderCircle } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { campaignQuery } from '@/entities/campaign'
import type { Campaign } from '@/entities/campaign'
import { StreamEditor } from '@/features/edit-stream-offers'
import { parseRecordId } from '@/shared/lib/id'
import { Button } from '@/shared/ui/button'
import { ErrorState, LoadingState } from '@/shared/ui/state'

import { useCampaignStreams } from '../model/use-campaign-streams'
import { CampaignLink } from './campaign-link'
import { OfferCatalogButton } from './offer-catalog'

function webUrl(value?: string | null) {
  try {
    if (!value) return null
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

function CampaignEditor({ campaign }: { campaign: Campaign }) {
  const { result: streams, reloadBlocked, reload } = useCampaignStreams(campaign.id)
  const url = webUrl(campaign.url)
  const adminUrl = webUrl(campaign.admin_url)

  return (
    <section className="work-page">
      <header className="page-heading">
        <div className="min-w-0">
          <Link className="back-link" to="/campaigns"><ChevronLeft aria-hidden="true" />Кампании</Link>
          <h1 className="wrap-break-word">{campaign.name}</h1>
          <p>Кампания #{campaign.id}</p>
        </div>
      </header>
      {url && <CampaignLink url={url} />}
      <div className="streams-title">
        <div><h2>Потоки</h2><p>Офферы и доли меняются в черновике до отправки в Keitaro.</p></div>
        <div className="streams-tools">
          <div className="streams-tools-group">
            <Button variant="outline" disabled={reloadBlocked} onClick={reload}>
              {streams.isFetching ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <Download aria-hidden="true" />}
              Загрузить из Keitaro
            </Button>
            {adminUrl && (
              <Button asChild variant="outline"><a href={adminUrl} target="_blank" rel="noreferrer">
                Открыть в Keitaro<ExternalLink aria-hidden="true" />
              </a></Button>
            )}
          </div>
          <div className="streams-tools-group">
            <OfferCatalogButton />
            <Button asChild variant="outline">
              <Link to="history"><History aria-hidden="true" />История</Link>
            </Button>
          </div>
        </div>
      </div>
      {streams.isPending && <LoadingState>Загружаем потоки…</LoadingState>}
      {streams.isError && <ErrorState error={streams.error} />}
      {streams.data && (
        streams.data.length ? (
          <div className="stream-list">{streams.data.map((stream) => (
            <StreamEditor key={stream.id} stream={stream} refreshing={streams.isFetching} />
          ))}</div>
        ) : <div className="workspace-panel section-state"><GitFork aria-hidden="true" />В кампании пока нет потоков.</div>
      )}
    </section>
  )
}

function CampaignDetails({ campaignId }: { campaignId: number }) {
  const campaign = useQuery(campaignQuery(campaignId))

  if (campaign.isPending) return <LoadingState>Загружаем кампанию…</LoadingState>
  if (campaign.isError) return (
    <section className="work-page">
      <Link className="back-link" to="/campaigns"><ChevronLeft aria-hidden="true" />Кампании</Link>
      <ErrorState error={campaign.error} onRetry={() => { void campaign.refetch() }} />
    </section>
  )
  return <CampaignEditor key={campaign.data.id} campaign={campaign.data} />
}

export function CampaignStreamsPage() {
  const { campaignId } = useParams()
  const id = parseRecordId(campaignId ?? '')
  return id === null ? (
    <section className="work-page">
      <Link className="back-link" to="/campaigns"><ChevronLeft aria-hidden="true" />Кампании</Link>
      <ErrorState error={new Error('У кампании должен быть числовой ID.')} />
    </section>
  ) : <CampaignDetails campaignId={id} />
}
