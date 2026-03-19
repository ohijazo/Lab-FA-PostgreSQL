import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { obtenirAnalisi, eliminarAnalisi, obtenirConfig } from '../api/analisis'
import AnalisisDetail from '../components/AnalisisDetail'

function formatDate(val) {
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    const [y, m, d] = val.split('-')
    return `${d}-${m}-${y}`
  }
  return val || ''
}

export default function DetallPage() {
  const { tipus, id } = useParams()
  const navigate = useNavigate()
  const [config, setConfig] = useState(null)
  const [analisi, setAnalisi] = useState(null)
  const [loading, setLoading] = useState(true)
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

  async function handleDelete() {
    if (!confirm('Segur que vols eliminar aquesta anàlisi?')) return
    try {
      await eliminarAnalisi(tipus, id)
      navigate(`/${tipus}`)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <p aria-busy="true">Carregant...</p>
  if (error) return <p>Error: {error}</p>
  if (!analisi) return <p>No trobat.</p>

  return (
    <>
      <div className="print-header">
        <div className="print-header-top">
          <h1>{config.nom}</h1>
          <span className="print-header-date">{formatDate(analisi.data)}</span>
        </div>
        <div className="print-header-meta">
          <span><strong>Codi:</strong> {analisi.codi}</span>
          <span><strong>Farina:</strong> {analisi.farina}</span>
        </div>
      </div>
      <div className="detall-toolbar no-print">
        <div className="detall-toolbar-info">
          <h2>Anàlisi {analisi.codi}</h2>
          <span className="detall-toolbar-meta">{formatDate(analisi.data)} &mdash; {analisi.farina}</span>
          {(analisi.created_by || analisi.updated_by) && (
            <div style={{ fontSize: '0.85em', marginTop: '0.25rem', color: 'var(--pico-muted-color)' }}>
              {analisi.created_by && <span>Creat per: {analisi.created_by}</span>}
              {analisi.created_by && analisi.updated_by && analisi.updated_by !== analisi.created_by && ' | '}
              {analisi.updated_by && analisi.updated_by !== analisi.created_by && (
                <span>Modificat per: {analisi.updated_by}</span>
              )}
            </div>
          )}
        </div>
        <div className="detall-toolbar-actions">
          <Link to={`/${tipus}/${id}/editar`} role="button" className="outline">Editar</Link>
          <button className="outline secondary" onClick={handleDelete}>Eliminar</button>
          <button className="outline contrast" onClick={() => window.print()}>Imprimir</button>
        </div>
      </div>
      <AnalisisDetail seccions={config.seccions} analisi={analisi} />
    </>
  )
}
