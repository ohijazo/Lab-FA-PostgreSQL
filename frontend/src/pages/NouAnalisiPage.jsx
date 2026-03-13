import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { crearAnalisi } from '../api/analisis'
import AnalisisForm from '../components/AnalisisForm'

export default function NouAnalisiPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(data) {
    setSubmitting(true)
    setError(null)
    try {
      const result = await crearAnalisi(data)
      navigate(`/analisis/${result.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1>Nova anàlisi Blat T1</h1>
      {error && <p style={{ color: 'var(--pico-del-color)' }}>{error}</p>}
      <AnalisisForm onSubmit={handleSubmit} submitting={submitting} />
    </>
  )
}
