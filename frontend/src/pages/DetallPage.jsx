import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { obtenirAnalisi, eliminarAnalisi } from '../api/analisis'
import AnalisisDetail from '../components/AnalisisDetail'

export default function DetallPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [analisi, setAnalisi] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    obtenirAnalisi(id)
      .then(setAnalisi)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!confirm('Segur que vols eliminar aquesta anàlisi?')) return
    try {
      await eliminarAnalisi(id)
      navigate('/analisis')
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <p aria-busy="true">Carregant...</p>
  if (error) return <p>Error: {error}</p>
  if (!analisi) return <p>No trobat.</p>

  return (
    <>
      <hgroup>
        <h1>Anàlisi {analisi.codi}</h1>
        <p>{analisi.data} — {analisi.farina}</p>
      </hgroup>
      <div className="grid">
        <Link to={`/analisis/${id}/editar`} role="button">Editar</Link>
        <button className="outline secondary" onClick={handleDelete}>Eliminar</button>
      </div>
      <AnalisisDetail analisi={analisi} />
    </>
  )
}
