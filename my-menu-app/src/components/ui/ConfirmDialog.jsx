import { useEffect, useId, useRef } from 'react'
import styles from './ConfirmDialog.module.css'

// 되돌릴 수 없는 동작 전에 한 번 더 묻는 대화상자.
// <dialog>.showModal() 을 써서 배경을 막고, 포커스를 안에 가두고, Esc 로 닫히게 한다.
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = '취소',
  busy = false,
  error = null,
  onConfirm,
  onCancel,
}) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Esc 로 닫을 때도 부모 상태를 맞춘다. 처리 중에는 닫지 않는다.
  const handleCancel = (event) => {
    event.preventDefault()
    if (!busy) onCancel()
  }

  return (
    <dialog ref={ref} aria-labelledby={titleId} className={styles.dialog} onCancel={handleCancel}>
      <div className={styles.text}>
        <h2 id={titleId} className={`heading2 bold ${styles.title}`}>
          {title}
        </h2>
        <p className={`body2 ${styles.description}`}>{description}</p>
      </div>

      {error && (
        <p role="alert" className={`body2 ${styles.error}`}>
          {error}
        </p>
      )}

      <div className={styles.actions}>
        <button type="button" className={`body2 bold ${styles.cancel}`} onClick={onCancel} disabled={busy} autoFocus>
          {cancelLabel}
        </button>
        <button type="button" className={`body2 bold ${styles.danger}`} onClick={onConfirm} disabled={busy}>
          {busy ? '처리 중…' : confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
