import { createContext, useContext, useState, useCallback } from 'react'
import Icon from '../components/Icon'

const ToastContext = createContext(null)

let toastId = 0

const ICONS = {
  success: 'CheckCircle2',
  error:   'AlertCircle',
  warning: 'AlertTriangle',
  info:    'Info',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((t) => {
            const iconName = ICONS[t.type] || ICONS.info
            return (
              <div key={t.id} className={`toast toast-${t.type}`} role="status">
                <span className="toast-icon"><Icon name={iconName} size={16} /></span>
                <span className="toast-msg">{t.message}</span>
                <button
                  type="button"
                  className="toast-close"
                  onClick={() => removeToast(t.id)}
                  aria-label="Tancar"
                >
                  <Icon name="X" size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
