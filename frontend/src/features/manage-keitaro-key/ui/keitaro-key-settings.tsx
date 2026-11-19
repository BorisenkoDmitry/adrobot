import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useId } from 'react'

import { useI18n } from '@/shared/i18n'
import { Button } from '@/shared/ui/button'
import { ErrorState } from '@/shared/ui/state'

import { useKeitaroKey } from '../model/use-keitaro-key'

export function KeitaroKeySettings() {
  const { t } = useI18n()
  const id = useId()
  const key = useKeitaroKey()
  const { form, status } = key
  const sourceMessage = key.source === 'saved'
    ? 'key.saved'
    : key.source === 'environment' ? 'key.environment' : 'key.notConfigured'
  const busy = form.pending !== null

  return (
    <section className="workspace-panel status-panel key-panel" aria-labelledby={`${id}-title`} aria-busy={busy}>
      <h2 id={`${id}-title`}>{t('key.title')}</h2>
      <p className="key-description">{t('key.description')}</p>
      <form onSubmit={(event) => {
        event.preventDefault()
        key.save()
      }}>
        <div className="field-group">
          <label htmlFor={id}>{t('key.label')}</label>
          <div className="key-input-row">
            <input id={id} className="field" type={form.visible ? 'text' : 'password'}
              autoComplete="off" spellCheck={false} autoCapitalize="none" maxLength={4096}
              value={form.revealedKey ?? form.draft} disabled={busy}
              placeholder={t(key.source === 'saved' ? 'key.savedPlaceholder' : 'key.placeholder')}
              onChange={(event) => key.edit(event.target.value)} />
            <Button size="icon" variant="outline" disabled={busy || !key.canReveal}
              aria-label={t(form.visible ? 'key.hide' : 'key.show')}
              title={t(form.visible ? 'key.hide' : 'key.show')} onClick={key.toggleVisibility}>
              {form.pending === 'reveal' ? <LoaderCircle className="animate-spin" aria-hidden="true" />
                : form.visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </Button>
          </div>
        </div>
        {status.data && <p className="key-description" role="status">{t(sourceMessage)}</p>}
        {status.data && !status.data.storage_available && <p className="key-description">{t('key.storageUnavailable')}</p>}
        {status.isError && <ErrorState error={status.error} onRetry={() => { void status.refetch() }} />}
        <div className="key-actions">
          <Button type="submit" disabled={busy || !key.canSave}>
            {form.pending === 'save' && <LoaderCircle className="animate-spin" aria-hidden="true" />}{t('key.save')}
          </Button>
          <Button variant="outline" onClick={key.test} disabled={busy || !key.canTest}>
            {form.pending === 'test' && <LoaderCircle className="animate-spin" aria-hidden="true" />}{t('key.test')}
          </Button>
        </div>
        {form.error != null && <ErrorState error={form.error} />}
        {form.notice && <p className="key-notice" role="status">{t(form.notice)}</p>}
      </form>
    </section>
  )
}
