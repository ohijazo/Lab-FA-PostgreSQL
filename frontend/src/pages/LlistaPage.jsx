import { useEffect, useState } from 'react'
import { llistarAnalisis } from '../api/analisis'
import AnalisisList from '../components/AnalisisList'

export default function LlistaPage() {
  const [analisis, setAnalisis] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    llistarAnalisis()
      .then(setAnalisis)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p aria-busy="true">Carregant...</p>
  if (error) return <p>Error: {error}</p>

  return (
    <>
      <h1>Anàlisis Blat T1</h1>
      <AnalisisList analisis={analisis} />
    </>
  )
}
