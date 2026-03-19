import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { obtenirAnalisi, editarAnalisi, obtenirConfig } from '../api/analisis'
import AnalisisForm from '../components/AnalisisForm'

export default function EditarAnalisiPage() {
  const { tipus, id } = useParams()
  const navigate = useNavigate()
  const [config, setConfig] = useState(null)
  const [analisi, setAnalisi] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([obtenirConfig(tipus), obtenirAnalisi(tipus, id)])
      .then(([cfg, data]) => {
        setConfig(cfg)
        setAnalisi(data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [tipus, id])

  async function handleSubmit(data) {
    setSubmitting(true)
    setError(null)
    try {
      await editarAnalisi(tipus, id, data)
      navigate(`/${tipus}/${id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p aria-busy="true">Carregant...</p>
  if (error && !config) return <p>Error: {error}</p>
  if (!analisi) return <p>No trobat.</p>

  return (
    <>
      <h2 style={{ marginBottom: '0.5rem' }}>Editar anàlisi {analisi.codi}</h2>
      {error && <p style={{ color: 'var(--pico-del-color)' }}>{error}</p>}
      <AnalisisForm
        seccions={config.seccions}
        initialData={analisi}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </>
  )
}
