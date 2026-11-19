import { ChevronDown, Search } from 'lucide-react'

import { useI18n } from '@/shared/i18n'
import { cn } from '@/shared/lib/utils'

import type { Offer } from '../api/offers'
import { useOfferSelect } from '../model/use-offer-select'

type OfferSelectProps = {
  selected: Offer | null
  onSelect: (offer: Offer | null) => void
  disabled?: boolean
  unavailable: ReadonlySet<number>
}

export function OfferSelect({ selected, onSelect, disabled, unavailable }: OfferSelectProps) {
  const { t } = useI18n()
  const select = useOfferSelect(selected, onSelect, unavailable)
  const { id, listId, open, search, catalog, matches } = select

  return (
    <div className="offer-select field-group" onBlur={select.handleBlur}>
      <label htmlFor={id}>{t('offer.label')}</label>
      <div className="offer-select-anchor">
        {open ? <Search className="offer-select-icon" aria-hidden="true" /> : null}
        <input id={id} className={cn('field offer-select-input', open && 'offer-select-search')}
          role="combobox" autoComplete="off" inputMode="numeric"
          aria-autocomplete="list" aria-expanded={open} aria-controls={open ? listId : undefined}
          aria-activedescendant={select.activeId} disabled={disabled}
          placeholder={t(open ? 'offer.search' : 'offer.select')}
          value={select.value} onClick={select.openMenu} onFocus={select.openMenu}
          onChange={(event) => select.changeSearch(event.target.value)} onKeyDown={select.handleKey} />
        <ChevronDown className="offer-select-chevron" aria-hidden="true" />
        {open && (
          <div className="offer-select-menu">
            {catalog.isPending && <p className="offer-select-feedback" role="status">{t('offer.loading')}</p>}
            {catalog.isError && <p className="offer-select-feedback" role="alert">{t('offer.loadError')}</p>}
            {catalog.isSuccess && !matches.length && <p className="offer-select-feedback" role="status">
              {t(search ? 'offer.noIdMatch' : 'offer.empty')}
            </p>}
            <ul id={listId} role="listbox" aria-label={t('offer.keitaroList')}>
              {matches.map((offer) => {
                const taken = unavailable.has(offer.id)
                const available = offer.state === 'active' && !taken
                return (
                  <li key={offer.id} id={`${listId}-${offer.id}`} role="option"
                    aria-selected={selected?.id === offer.id} aria-disabled={!available}
                    className={cn('offer-select-option', select.activeOfferId === offer.id && 'offer-option-highlighted')}
                    onMouseDown={(event) => event.preventDefault()} onClick={() => select.choose(offer)}>
                    <span className="offer-option-id">#{offer.id}</span>
                    <span className="min-w-0 wrap-break-word">{offer.name}</span>
                    {!available && <span className={cn('offer-option-note', taken && 'offer-option-assigned')}>
                      {t(taken ? 'offer.assigned' : 'offer.inactive')}
                    </span>}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
