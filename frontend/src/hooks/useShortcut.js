import { useEffect, useRef } from 'react'

/**
 * Escolta una tecla i executa el handler quan es prem.
 * Ignora quan l'usuari està escrivint en un input / textarea / select / contenteditable
 * (excepte 'Escape', que sempre s'executa).
 *
 * @param {string|string[]} keys  Tecla o llista de tecles (ex: '/', 'n', 'Escape', ['n', 'N'])
 * @param {(e: KeyboardEvent) => void} handler
 * @param {object} [options]
 * @param {boolean} [options.enabled=true]  Si false, no escolta
 * @param {boolean} [options.allowInInputs=false]  Si true, també s'executa dins inputs
 */
export default function useShortcut(keys, handler, options = {}) {
  const { enabled = true, allowInInputs = false } = options
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!enabled) return
    const keyList = Array.isArray(keys) ? keys : [keys]

    function onKeyDown(e) {
      if (!keyList.includes(e.key)) return
      if (e.ctrlKey || e.metaKey || e.altKey) return  // ignora combinacions
      const target = e.target
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable
      if (isInput && !allowInInputs && e.key !== 'Escape') return
      e.preventDefault()
      handlerRef.current(e)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, allowInInputs, Array.isArray(keys) ? keys.join(',') : keys])
}
