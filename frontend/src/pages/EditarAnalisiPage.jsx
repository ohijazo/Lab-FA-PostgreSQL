import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { obtenirAnalisi, editarAnalisi, obtenirConfig, acquireLock, releaseLock } from '../api/analisis'
import AnalisisForm from '../components/AnalisisForm'
import { useToast } from '../context/ToastContext'

const HEARTBEAT_INTERVAL = 15 * 1000 // 15 seg

export default function EditarAnalisiPage() {
  const { t } = useTranslation()
  const { tipus, id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [config, setConfig] = useState(null)
  const [analisi, setAnalisi] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [conflict, setConflict] = useState(null)
  const [otherUser, setOtherUser] = useState(null)
  const updatedAtRef = useRef(null)
  const heartbeatRef = useRef(null)

  // Release lock on unmount
  const cleanup = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
    releaseLock(tipus, id)
  }, [tipus, id])

  useEffect(() => {
    Promise.all([obtenirConfig(tipus), obtenirAnalisi(tipus, id)])
      .then(([cfg, data]) => {
        setConfig(cfg)
        setAnalisi(data)
        updatedAtRef.current = data.updated_at
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))

    // Acquire lock + start heartbeat
    function handleLockResponse(res) {
      if (!res) return
      if (res.other_user) {
        setOtherUser(res.other_user.user_email)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setOtherUser(null)
      }
      // Detect if record was saved by someone else
      if (res.updated_at && updatedAtRef.current && res.updated_at !== updatedAtRef.current) {
        setConflict({
          updated_by: res.updated_by,
          updated_at: res.updated_at,
        })
        setError(t('form.registre_modificat', { user: res.updated_by || 'un altre usuari' }))
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    acquireLock(tipus, id).then(handleLockResponse)

    heartbeatRef.current = setInterval(() => {
      acquireLock(tipus, id).then(handleLockResponse)
    }, HEARTBEAT_INTERVAL)

    return cleanup
  }, [tipus, id, cleanup])

  async function handleSubmit(data) {
    setSubmitting(true)
    setError(null)
    setConflict(null)
    try {
      await editarAnalisi(tipus, id, data, updatedAtRef.current)
      cleanup()
      addToast(t('form.canvis_desats'))
      navigate(`/${tipus}/${id}`)
    } catch (err) {
      if (err.conflict) {
        setConflict(err.conflict)
        setError(err.message)
      } else {
        addToast(err.message, 'error')
      }
    } finally {
      setSubmitting(false)
    }
  }

  function handleReload() {
    setConflict(null)
    setError(null)
    setLoading(true)
    obtenirAnalisi(tipus, id)
      .then((data) => {
        setAnalisi(data)
        updatedAtRef.current = data.updated_at
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  if (loading) return <p aria-busy="true">{t('common.carregant')}</p>
  if (error && !config) return <p>Error: {error}</p>
  if (!analisi) return <p>{t('common.no_trobat')}</p>

  return (
    <>
      <h2 style={{ marginBottom: '0.5rem' }}>
        {t('form.editar_titol', {
          nom: config.nom,
          ref: config.columnes_llista?.[0] && analisi[config.columnes_llista[0]]
            ? `(${analisi[config.columnes_llista[0]]})`
            : `#${analisi.id}`
        })}
      </h2>

      {otherUser && (
        <article style={{ background: 'var(--pico-mark-background-color, #fff3cd)', padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: '4px' }}>
          <strong>{t('form.conflicte')}:</strong> {t('form.atencio_altre_usuari', { user: otherUser })}
        </article>
      )}

      {conflict && (
        <article style={{ background: '#f8d7da', padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: '4px' }}>
          <p style={{ margin: 0 }}>
            <strong>{t('form.conflicte')}:</strong> {error}
          </p>
          <button
            onClick={handleReload}
            style={{ marginTop: '0.5rem' }}
            className="outline"
          >
            {t('form.recarregar_dades')}
          </button>
        </article>
      )}

      {error && !conflict && <p style={{ color: 'var(--pico-del-color)' }}>{error}</p>}

      <AnalisisForm
        seccions={config.seccions}
        initialData={analisi}
        onSubmit={handleSubmit}
        onCancel={() => { cleanup(); navigate(`/${tipus}/${id}`) }}
        submitting={submitting}
      />
    </>
  )
}
