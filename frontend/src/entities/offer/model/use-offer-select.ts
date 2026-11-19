import { useQuery } from '@tanstack/react-query'
import { useEffect, useId, useState } from 'react'
import type { FocusEvent, KeyboardEvent } from 'react'

import { offersQuery } from '../api/offers'
import type { Offer } from '../api/offers'

type SelectState = { open: boolean; search: string; highlighted: number | null }
const closedState: SelectState = { open: false, search: '', highlighted: null }

export function useOfferSelect(selected: Offer | null, onSelect: (offer: Offer | null) => void, unavailable: ReadonlySet<number>) {
  const id = useId()
  const listId = `${id}-offers`
  const [{ open, search, highlighted }, setState] = useState(closedState)
  const catalog = useQuery({ ...offersQuery, enabled: open })
  const matches = (catalog.data ?? []).filter((offer) => String(offer.id).includes(search))
  const selectable = matches.filter((offer) => offer.state === 'active' && !unavailable.has(offer.id))
  const activeOffer = selectable.find((offer) => offer.id === highlighted) ?? selectable[0]
  const activeId = open && activeOffer ? `${listId}-${activeOffer.id}` : undefined

  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' })
  }, [activeId])

  function openMenu() {
    setState((current) => current.open ? current : { ...current, open: true })
  }

  function choose(offer: Offer) {
    if (offer.state === 'active' && !unavailable.has(offer.id)) {
      onSelect(offer)
      setState(closedState)
    }
  }

  function changeSearch(value: string) {
    setState({ open: true, search: value.replace(/[^0-9]/g, ''), highlighted: null })
    if (selected) onSelect(null)
  }

  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'Escape':
        if (open) {
          event.preventDefault()
          setState(closedState)
        }
        break
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault()
        if (!open) {
          openMenu()
        } else if (selectable.length) {
          const index = selectable.findIndex((offer) => offer.id === activeOffer?.id)
          const direction = event.key === 'ArrowDown' ? 1 : -1
          const next = selectable[(index + direction + selectable.length) % selectable.length]
          setState((current) => ({ ...current, highlighted: next.id }))
        }
        break
      }
      case 'Enter':
        event.preventDefault()
        if (!open) openMenu()
        else if (activeOffer) choose(activeOffer)
        break
    }
  }

  return {
    id, listId, activeId, open, search, catalog, matches,
    activeOfferId: activeOffer?.id,
    value: open ? search : selected ? `#${selected.id} · ${selected.name}` : '',
    openMenu, choose, changeSearch, handleKey,
    handleBlur(event: FocusEvent<HTMLDivElement>) {
      if (!event.currentTarget.contains(event.relatedTarget)) setState(closedState)
    },
  }
}
