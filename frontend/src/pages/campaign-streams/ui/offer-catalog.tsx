import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { offersQuery } from '@/entities/offer'
import { useI18n } from '@/shared/i18n'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import { ErrorState, LoadingState } from '@/shared/ui/state'

function OfferCatalog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const offers = useQuery(offersQuery)

  return (
    <>
      {offers.isPending && <LoadingState>{t('offer.loading')}</LoadingState>}
      {offers.isError && <ErrorState error={offers.error} onRetry={() => { void offers.refetch() }} />}
      {offers.data && (offers.data.length ? (
        <ul className="offer-catalog-list" role="list">
          {offers.data.map((offer) => (
            <li key={offer.id}><span>{offer.name}</span><small>#{offer.id}</small></li>
          ))}
        </ul>
      ) : <p>{t('offer.catalogEmpty')}</p>)}
      <div className="editor-dialog-actions">
        <Button variant="outline" onClick={onClose}>{t('common.close')}</Button>
      </div>
    </>
  )
}

export function OfferCatalogButton() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <>
      <Button variant="outline" aria-haspopup="dialog" onClick={() => setOpen(true)}>{t('offer.catalog')}</Button>
      <Dialog open={open} title={t('offer.keitaroCatalog')} onDismiss={close}>
        {open && <OfferCatalog onClose={close} />}
      </Dialog>
    </>
  )
}
