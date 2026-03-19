import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { crearAnalisi, obtenirConfig } from '../api/analisis'
import AnalisisForm from '../components/AnalisisForm'

export default function NouAnalisiPage() {
  const { tipus } = useParams()
  const navigate = useNavigate()
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
      navigate(`/${tipus}/${result.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p aria-busy="true">Carregant...</p>
  if (error && !config) return <p>Error: {error}</p>

  return (
    <>
      <h2 style={{ marginBottom: '0.5rem' }}>Nova anàlisi — {config.nom}</h2>
      {error && <p style={{ color: 'var(--pico-del-color)' }}>{error}</p>}
      <AnalisisForm seccions={config.seccions} onSubmit={handleSubmit} submitting={submitting} />
    </>
  )
}
