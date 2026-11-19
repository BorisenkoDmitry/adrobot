import { Copy } from 'lucide-react'
import { useState } from 'react'

import { useI18n } from '@/shared/i18n'
import { Button } from '@/shared/ui/button'

export function CampaignLink({ url }: { url: string }) {
  const { t } = useI18n()
  const [message, setMessage] = useState<'campaign.copied' | 'campaign.copyFailed' | null>(null)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setMessage('campaign.copied')
    } catch {
      setMessage('campaign.copyFailed')
    }
  }

  return (
    <div className="campaign-link">
      <span className="campaign-link-label">{t('campaign.link')}</span>
      <span className="campaign-url">{url}</span>
      <Button size="icon" variant="outline" aria-label={t('campaign.copyLink')} onClick={() => { void copy() }}>
        <Copy aria-hidden="true" />
      </Button>
      <span role="status" className="copy-result">{message && t(message)}</span>
    </div>
  )
}
