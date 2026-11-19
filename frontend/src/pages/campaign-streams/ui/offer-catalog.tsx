import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { offersQuery } from '@/entities/offer'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import { ErrorState, LoadingState } from '@/shared/ui/state'

function OfferCatalog({ onClose }: { onClose: () => void }) {
  const offers = useQuery(offersQuery)

  return (
    <>
      {offers.isPending && <LoadingState>Загружаем офферы из Keitaro…</LoadingState>}
      {offers.isError && <ErrorState error={offers.error} onRetry={() => { void offers.refetch() }} />}
      {offers.data && (offers.data.length ? (
        <ul className="offer-catalog-list" role="list">
          {offers.data.map((offer) => (
            <li key={offer.id}><span>{offer.name}</span><small>#{offer.id}</small></li>
          ))}
        </ul>
      ) : <p>В каталоге Keitaro пока нет офферов.</p>)}
      <div className="editor-dialog-actions">
        <Button variant="outline" onClick={onClose}>Закрыть</Button>
      </div>
    </>
  )
}

export function OfferCatalogButton() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <>
      <Button variant="outline" aria-haspopup="dialog" onClick={() => setOpen(true)}>Все офферы</Button>
      <Dialog open={open} title="Все офферы Keitaro" onDismiss={close}>
        {open && <OfferCatalog onClose={close} />}
      </Dialog>
    </>
  )
}
