import { Copy } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/shared/ui/button'

export function CampaignLink({ url }: { url: string }) {
  const [message, setMessage] = useState('')

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setMessage('Скопировано')
    } catch {
      setMessage('Выдели адрес и скопируй его вручную.')
    }
  }

  return (
    <div className="campaign-link">
      <span className="campaign-link-label">Ссылка кампании</span>
      <span className="campaign-url">{url}</span>
      <Button size="icon" variant="outline" aria-label="Скопировать ссылку кампании" onClick={() => { void copy() }}>
        <Copy aria-hidden="true" />
      </Button>
      <span role="status" className="copy-result">{message}</span>
    </div>
  )
}
