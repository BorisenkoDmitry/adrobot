import { ChevronDown, Search } from 'lucide-react'

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
  const select = useOfferSelect(selected, onSelect, unavailable)
  const { id, listId, open, search, catalog, matches } = select

  return (
    <div className="offer-select field-group" onBlur={select.handleBlur}>
      <label htmlFor={id}>Оффер</label>
      <div className="offer-select-anchor">
        {open ? <Search className="offer-select-icon" aria-hidden="true" /> : null}
        <input id={id} className={cn('field offer-select-input', open && 'offer-select-search')}
          role="combobox" autoComplete="off" inputMode="numeric"
          aria-autocomplete="list" aria-expanded={open} aria-controls={open ? listId : undefined}
          aria-activedescendant={select.activeId} disabled={disabled}
          placeholder={open ? 'Поиск по ID оффера' : 'Выбрать оффер'}
          value={select.value} onClick={select.openMenu} onFocus={select.openMenu}
          onChange={(event) => select.changeSearch(event.target.value)} onKeyDown={select.handleKey} />
        <ChevronDown className="offer-select-chevron" aria-hidden="true" />
        {open && (
          <div className="offer-select-menu">
            {catalog.isPending && <p className="offer-select-feedback" role="status">Загружаем офферы…</p>}
            {catalog.isError && <p className="offer-select-feedback" role="alert">Не удалось загрузить офферы. Открой список ещё раз.</p>}
            {catalog.isSuccess && !matches.length && <p className="offer-select-feedback" role="status">
              {search ? 'Офферы с таким ID не найдены.' : 'Доступных офферов нет.'}
            </p>}
            <ul id={listId} role="listbox" aria-label="Офферы Keitaro">
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
                      {taken ? 'Назначен' : 'Неактивен'}
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
