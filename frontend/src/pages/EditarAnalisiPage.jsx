import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { obtenirAnalisi, editarAnalisi } from '../api/analisis'
import AnalisisForm from '../components/AnalisisForm'

export default function EditarAnalisiPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [analisi, setAnalisi] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    obtenirAnalisi(id)
      .then(setAnalisi)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(data) {
    setSubmitting(true)
    setError(null)
    try {
      await editarAnalisi(id, data)
      navigate(`/analisis/${id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p aria-busy="true">Carregant...</p>
  if (error) return <p>Error: {error}</p>
  if (!analisi) return <p>No trobat.</p>

  return (
    <>
      <h1>Editar anàlisi {analisi.codi}</h1>
      <AnalisisForm initialData={analisi} onSubmit={handleSubmit} submitting={submitting} />
    </>
  )
}
