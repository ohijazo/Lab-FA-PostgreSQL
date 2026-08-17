import { createContext, useContext, useState, useCallback, useRef } from 'react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

const ConfirmContext = createContext(null)

const DEFAULTS = {
  title: 'Confirmar',
  message: 'Estàs segur?',
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancel·lar',
  variant: 'primary',
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, opts: DEFAULTS })
  const resolverRef = useRef(null)

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setState({ open: true, opts: { ...DEFAULTS, ...opts } })
    })
  }, [])

  function handleClose(result) {
    setState((s) => ({ ...s, open: false }))
    if (resolverRef.current) {
      resolverRef.current(result)
      resolverRef.current = null
    }
  }

  const { open, opts } = state

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
