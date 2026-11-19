import { GitFork, LoaderCircle, Upload, X } from 'lucide-react'
import { useId } from 'react'

import type { Stream } from '@/entities/stream'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import { ErrorState } from '@/shared/ui/state'

import { useStreamEditor } from '../model/use-stream-editor'
import { AddStreamOffer } from './add-stream-offer'
import { StreamOffers } from './stream-offers'

const TYPE_NAMES: Record<string, string> = { regular: 'Обычный', forced: 'Перехватывающий', default: 'Замыкающий' }

export function StreamEditor({ stream, refreshing }: { stream: Stream; refreshing: boolean }) {
  const titleId = useId()
  const editor = useStreamEditor(stream, refreshing)
  const { blocked, working, offerToDetach } = editor

  return (
    <section className={cn('workspace-panel stream-panel', stream.conflicted ? 'stream-conflict' : stream.dirty && 'stream-dirty')}
      aria-labelledby={titleId} aria-busy={working}>
      <header className="stream-heading">
        <span className="stream-icon"><GitFork aria-hidden="true" /></span>
        <div className="min-w-0">
          <h3 id={titleId}>{stream.name}</h3>
          <p>#{stream.id} <span aria-hidden="true">·</span> {TYPE_NAMES[stream.type] ?? stream.type}
            {stream.editable && <> <span aria-hidden="true">·</span> Офферы: {editor.attached.length}</>}</p>
        </div>
        {stream.editable ? (
          <span className={cn('status-pill stream-state', stream.conflicted ? 'status-conflict' : stream.dirty ? 'status-draft' : 'status-active')}>
            <span aria-hidden="true" />{stream.conflicted ? 'Конфликт' : stream.dirty ? 'Черновик' : 'Опубликован'}
          </span>
        ) : <span className="status-pill stream-state">{stream.schema === 'redirect' ? 'Редирект' : 'Без редактора офферов'}</span>}
      </header>
      {stream.editable && (
        <>
          {stream.dirty && (
            <div className="draft-toolbar">
              <Button className="bg-[#176b9e] text-white hover:bg-[#125781]" disabled={blocked} onClick={editor.publish}>
                {editor.publishing
                  ? <LoaderCircle className="animate-spin" aria-hidden="true" />
                  : <Upload aria-hidden="true" />}
                Отправить в Keitaro
              </Button>
              <Button variant="outline" disabled={working} onClick={editor.cancel}>
                <X aria-hidden="true" />Отменить правки
              </Button>
              {stream.conflicted && <p>Поток изменился в Keitaro. Отмени черновик, чтобы загрузить актуальную версию.</p>}
            </div>
          )}
          {editor.error && <div className="panel-padding"><ErrorState error={editor.error} /></div>}
          {editor.notice && <p className="stream-notice" role="status">{editor.notice}</p>}
        </>
      )}
      <StreamOffers offers={editor.offers} editable={stream.editable} blocked={blocked}
        onPin={editor.togglePin} onDetach={editor.setDetachingOffer} onRestore={editor.restoreOffer} />
      {stream.editable && (
        <>
          <AddStreamOffer attached={editor.attached} disabled={blocked} onAdd={editor.addOffer} />
          <Dialog open={offerToDetach !== null} title="Открепить оффер от потока?" onDismiss={() => editor.setDetachingOffer(null)}>
            {offerToDetach && (
              <>
                <p><strong>{offerToDetach.name}</strong> (#{offerToDetach.offer_id}) будет откреплён от потока «{stream.name}».
                  Изменение вступит в силу после отправки в Keitaro.</p>
                <div className="editor-dialog-actions">
                  <Button variant="outline" onClick={() => editor.setDetachingOffer(null)}>Отмена</Button>
                  <Button variant="outline" className="stream-offer-detach" disabled={blocked} onClick={editor.confirmDetach}>
                    Открепить
                  </Button>
                </div>
              </>
            )}
          </Dialog>
        </>
      )}
    </section>
  )
}
