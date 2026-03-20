import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { crearAnalisi, obtenirConfig } from '../api/analisis'
import AnalisisForm from '../components/AnalisisForm'
import { useToast } from '../context/ToastContext'

export default function NouAnalisiPage() {
  const { tipus } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { addToast } = useToast()
  const duplicatDe = location.state?.duplicatDe || null
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    obtenirConfig(tipus)
      .then(setConfig)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [tipus])

  async function handleSubmit(data) {
    setSubmitting(true)
    setError(null)
    try {
      const result = await crearAnalisi(tipus, data)
      addToast('Anàlisi creada correctament')
      navigate(`/${tipus}/${result.id}`)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p aria-busy="true">Carregant...</p>
  if (error && !config) return <p>Error: {error}</p>

  return (
    <>
      <h2 style={{ marginBottom: '0.5rem' }}>
        {duplicatDe ? 'Duplicar Anàlisi' : 'Nou Anàlisi'} — {config.nom}
      </h2>
      {duplicatDe && (
        <p style={{ color: 'var(--pico-muted-color)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          S'han copiat les dades de l'anàlisi original. Modifica el que calgui i desa.
        </p>
      )}
      <AnalisisForm seccions={config.seccions} initialData={duplicatDe} onSubmit={handleSubmit} onCancel={() => navigate(`/${tipus}`)} submitting={submitting} />
    </>
  )
}
