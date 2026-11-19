import { Plus } from 'lucide-react'
import { useState } from 'react'

import { OfferSelect } from '@/entities/offer'
import type { Offer } from '@/entities/offer'
import type { StreamOffer } from '@/entities/stream'
import { useI18n } from '@/shared/i18n'
import { Button } from '@/shared/ui/button'

export function AddStreamOffer({ attached, disabled, onAdd }: {
  attached: StreamOffer[]
  disabled: boolean
  onAdd: (offerId: number, onSuccess: () => void) => void
}) {
  const { t } = useI18n()
  const [selected, setSelected] = useState<Offer | null>(null)
  const unavailable = new Set(attached.map((offer) => offer.offer_id))
  const canAdd = selected !== null && !unavailable.has(selected.id)

  return (
    <div className="offer-add-area">
      <OfferSelect selected={selected} onSelect={setSelected} disabled={disabled} unavailable={unavailable} />
      <Button disabled={disabled || !canAdd} onClick={() => {
        if (canAdd) onAdd(selected.id, () => setSelected(null))
      }}><Plus aria-hidden="true" />{t('common.add')}</Button>
    </div>
  )
}
