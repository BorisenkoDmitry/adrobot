import { Pin, RotateCcw, Trash2 } from 'lucide-react'

import type { StreamOffer } from '@/entities/stream'
import { useI18n } from '@/shared/i18n'
import { Button } from '@/shared/ui/button'

export function StreamOffers({ offers, editable, blocked, onPin, onDetach, onRestore }: {
  offers: StreamOffer[]
  editable: boolean
  blocked: boolean
  onPin: (offerId: number) => void
  onDetach: (offerId: number) => void
  onRestore: (offerId: number) => void
}) {
  const { t } = useI18n()
  if (!offers.length) return null
  return (
    <div className="stream-offers">
      <h4>{t('offer.streamList')}</h4>
      <ul role="list">
        {offers.map((offer) => (
          <li key={offer.offer_id} className={offer.removed ? 'stream-offer-detached' : undefined}>
            <div>
              <span>{offer.name}</span>
              <small>#{offer.offer_id}{offer.removed && ` · ${t('offer.detached')}`}</small>
            </div>
            <div className="stream-offer-actions">
              <span className="stream-offer-share">{offer.share}%</span>
              {editable && (offer.removed ? (
                <Button variant="outline" disabled={blocked} aria-label={t('offer.restoreNamed', { name: offer.name })}
                  onClick={() => onRestore(offer.offer_id)}>
                  <RotateCcw aria-hidden="true" />{t('offer.restore')}
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="icon" className="stream-offer-pin" disabled={blocked}
                    aria-pressed={offer.pinned} aria-label={t('offer.pinNamed', { name: offer.name })}
                    title={t(offer.pinned ? 'offer.unpin' : 'offer.pin')}
                    onClick={() => onPin(offer.offer_id)}>
                    <Pin aria-hidden="true" />
                  </Button>
                  <Button variant="outline" className="stream-offer-detach" disabled={blocked}
                    aria-haspopup="dialog" onClick={() => onDetach(offer.offer_id)}>
                    <Trash2 aria-hidden="true" />{t('offer.detach')}
                  </Button>
                </>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
