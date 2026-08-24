import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const { t } = useTranslation()
  const [state, setState] = useState({ open: false, opts: {} })
  const resolverRef = useRef(null)

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setState({ open: true, opts })
    })
  }, [])

  function handleClose(result) {
    setState((s) => ({ ...s, open: false }))
    if (resolverRef.current) {
      resolverRef.current(result)
      resolverRef.current = null
    }
  }

  // Els valors per defecte es resolen al renderitzat perquè segueixin l'idioma actiu.
  const { open } = state
  const opts = {
    title: t('common.confirmar'),
    message: t('common.estas_segur'),
    confirmLabel: t('common.confirmar'),
    cancelLabel: t('common.cancellar'),
    variant: 'primary',
    ...state.opts,
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={open}
        onClose={() => handleClose(false)}
        title={opts.title}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => handleClose(false)}>
              {opts.cancelLabel}
            </Button>
            <Button variant={opts.variant === 'danger' ? 'danger' : 'primary'} onClick={() => handleClose(true)}>
              {opts.confirmLabel}
            </Button>
          </>
        }
      >
        {typeof opts.message === 'string' ? <p style={{ margin: 0 }}>{opts.message}</p> : opts.message}
      </Modal>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm ha d\'estar dins de <ConfirmProvider>')
  return ctx
}
