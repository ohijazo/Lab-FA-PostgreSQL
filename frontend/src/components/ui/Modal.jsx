import { useEffect, useRef } from 'react'
import Icon from '../Icon'

export default function Modal({
  open,
  onClose,
  title,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  showClose = true,
  children,
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dlg = dialogRef.current
    if (!dlg) return
    if (open && !dlg.open) {
      try { dlg.showModal() } catch { /* already open */ }
    } else if (!open && dlg.open) {
      dlg.close()
    }
  }, [open])

  useEffect(() => {
    const dlg = dialogRef.current
    if (!dlg) return
    function handleCancel(e) {
      e.preventDefault()
      if (onClose) onClose()
    }
    function handleClose() {
      if (open && onClose) onClose()
    }
    dlg.addEventListener('cancel', handleCancel)
    dlg.addEventListener('close', handleClose)
    return () => {
      dlg.removeEventListener('cancel', handleCancel)
      dlg.removeEventListener('close', handleClose)
    }
  }, [open, onClose])

  function handleBackdropClick(e) {
    if (!closeOnBackdrop) return
    if (e.target === dialogRef.current && onClose) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className={`lab-modal lab-modal-${size}`}
      onClick={handleBackdropClick}
    >
      {(title || showClose) && (
        <header className="lab-modal-header">
          {title && <h3 className="lab-modal-title">{title}</h3>}
          {showClose && onClose && (
            <button
              type="button"
              className="lab-modal-close"
              onClick={onClose}
              aria-label="Tancar"
            >
              <Icon name="X" size={18} />
            </button>
          )}
        </header>
      )}
      <div className="lab-modal-body">{children}</div>
      {footer && <footer className="lab-modal-footer">{footer}</footer>}
    </dialog>
  )
}
