import { useState } from 'react'
import type { FormEvent } from 'react'

import { historyActions } from '@/entities/stream'
import type { HistoryFilters } from '@/entities/stream'
import { useI18n } from '@/shared/i18n'
import { Button } from '@/shared/ui/button'

import { EMPTY_HISTORY_FILTERS } from '../model/campaign-history-slice'

export function HistoryFiltersForm({ initialFilters, pending, onApply }: {
  initialFilters: HistoryFilters
  pending: boolean
  onApply: (filters: HistoryFilters) => void
}) {
  const { t } = useI18n()
  const [fields, setFields] = useState(initialFilters)

  const canReset = Object.values(fields).some(Boolean) || Object.values(initialFilters).some(Boolean)

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onApply({ ...fields, stream: fields.stream.trim(), offer: fields.offer.trim() })
  }

  return (
    <form className="history-filters" onSubmit={apply}>
      <label>
        {t('history.streamFilter')}
        <input className="field" type="search" maxLength={160} value={fields.stream}
          onChange={(event) => setFields({ ...fields, stream: event.target.value })} />
      </label>
      <label>
        {t('history.offerFilter')}
        <input className="field" type="search" maxLength={160} value={fields.offer}
          onChange={(event) => setFields({ ...fields, offer: event.target.value })} />
      </label>
      <label>
        {t('history.typeFilter')}
        <select className="field" value={fields.action}
          onChange={(event) => setFields({ ...fields, action: event.target.value as HistoryFilters['action'] })}>
          <option value="">{t('history.allActions')}</option>
          {historyActions.map((action) => <option key={action} value={action}>{t(`history.action.${action}`)}</option>)}
        </select>
      </label>
      <label>
        {t('history.from')}
        <input className="field" type="date" max={fields.until || '9999-12-30'} value={fields.from}
          onChange={(event) => setFields({ ...fields, from: event.target.value })} />
      </label>
      <label>
        {t('history.until')}
        <input className="field" type="date" min={fields.from || undefined} max="9999-12-30" value={fields.until}
          onChange={(event) => setFields({ ...fields, until: event.target.value })} />
      </label>
      <div className="history-filter-actions">
        <Button type="submit" disabled={pending}>{t('common.apply')}</Button>
        <Button variant="outline" disabled={pending || !canReset} onClick={() => {
          setFields(EMPTY_HISTORY_FILTERS)
          onApply(EMPTY_HISTORY_FILTERS)
        }}>{t('common.reset')}</Button>
      </div>
    </form>
  )
}
