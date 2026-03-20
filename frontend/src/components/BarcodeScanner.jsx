import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { findByCodi } from '../api/analisis'

// Load BarcodeDetector: native if available, otherwise polyfill from CDN
async function getBarcodeDetector() {
  if ('BarcodeDetector' in window) {
    return window.BarcodeDetector
  }
  try {
    const module = await import(
      /* @vite-ignore */
      'https://cdn.jsdelivr.net/npm/barcode-detector@2/dist/es/pure.min.js'
    )
    return module.default || module.BarcodeDetector
  } catch {
    return null
  }
}

export default function BarcodeScanner({ open, onClose }) {
  const navigate = useNavigate()
  const dialogRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)

  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [manualCodi, setManualCodi] = useState('')
  const [useManual, setUseManual] = useState(false)
  const [searching, setSearching] = useState(false)

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const handleClose = useCallback(() => {
    stopCamera()
    setStatus('')
    setError('')
    setManualCodi('')
    setUseManual(false)
    setSearching(false)
    onClose()
  }, [stopCamera, onClose])

  const goToAnalisi = useCallback(async (codi) => {
    setSearching(true)
    setError('')
    setStatus(`Cercant "${codi}"...`)
    try {
      const { id, tipus } = await findByCodi(codi)
      handleClose()
      navigate(`/${tipus}/${id}`)
    } catch (err) {
      setError(err.message || 'No trobat')
      setStatus('')
      setSearching(false)
    }
  }, [navigate, handleClose])

  // Open/close dialog
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // Start camera when open
  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function startCamera() {
      setStatus('Carregant detector de codis...')
      setUseManual(false)
      setError('')

      const DetectorClass = await getBarcodeDetector()
      if (cancelled) return

      if (!DetectorClass) {
        setUseManual(true)
        setStatus('')
        setError('El navegador no suporta detecció de codis de barres. Introdueix el codi manualment.')
        return
      }

      setStatus('Iniciant càmera...')
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setStatus('Apunta al codi de barres...')

        const detector = new DetectorClass({ formats: ['qr_code', 'code_128', 'ean_13', 'ean_8'] })

        intervalRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return
          try {
            const barcodes = await detector.detect(videoRef.current)
            if (barcodes.length > 0) {
              const codi = barcodes[0].rawValue
              if (codi) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
                goToAnalisi(codi)
              }
            }
          } catch {
            // detection frame error, ignore
          }
        }, 500)
      } catch {
        if (!cancelled) {
          setUseManual(true)
          setStatus('')
          setError('No s\'ha pogut accedir a la càmera. Introdueix el codi manualment.')
        }
      }
    }

    startCamera()

    return () => {
      cancelled = true
      stopCamera()
    }
  }, [open, goToAnalisi, stopCamera])

  const handleManualSubmit = (e) => {
    e.preventDefault()
    const codi = manualCodi.trim()
    if (codi) goToAnalisi(codi)
  }

  if (!open) return null

  return (
    <dialog ref={dialogRef} className="scanner-dialog" onClick={(e) => {
      if (e.target === dialogRef.current) handleClose()
    }}>
      <article className="scanner-content">
        <header>
          <button
            aria-label="Tancar"
            className="close"
            onClick={handleClose}
          />
          Escàner de codi de barres
        </header>

        {!useManual && (
          <div className="scanner-video-container">
            <video ref={videoRef} autoPlay playsInline muted className="scanner-video" />
          </div>
        )}

        {status && <p className="scanner-status">{status}</p>}
        {error && <p className="scanner-error">{error}</p>}

        {useManual && (
          <form onSubmit={handleManualSubmit} className="scanner-manual">
            <label htmlFor="manual-codi">Codi de l'anàlisi</label>
            <input
              id="manual-codi"
              type="text"
              value={manualCodi}
              onChange={e => setManualCodi(e.target.value)}
              placeholder="Introdueix el codi..."
              autoFocus
              disabled={searching}
            />
            <button type="submit" disabled={!manualCodi.trim() || searching}>
              {searching ? 'Cercant...' : 'Cercar'}
            </button>
          </form>
        )}

        {!useManual && (
          <p className="scanner-fallback-link">
            <a href="#" onClick={(e) => { e.preventDefault(); stopCamera(); setUseManual(true); setStatus(''); }}>
              Introduir codi manualment
            </a>
          </p>
        )}

        <footer>
          <button className="secondary" onClick={handleClose}>Tancar</button>
        </footer>
      </article>
    </dialog>
  )
}
