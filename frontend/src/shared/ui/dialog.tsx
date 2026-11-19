import { useEffect, useId, useRef, type ReactNode } from 'react'

export function Dialog({ open, title, onDismiss, children }: {
  open: boolean
  title: string
  onDismiss: () => void
  children: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) element.showModal()
    if (!open && element.open) element.close()
  }, [open])

  return (
    <dialog ref={dialog} className="editor-dialog" aria-labelledby={titleId} onCancel={(event) => {
      event.preventDefault()
      onDismiss()
    }}>
      <h2 id={titleId}>{title}</h2>
      {children}
    </dialog>
  )
}
