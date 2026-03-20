import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { obtenirAnalisi, eliminarAnalisi, obtenirConfig } from '../api/analisis'
import AnalisisDetail from '../components/AnalisisDetail'
import QRCode from '../components/QRCode'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import logoApp from '../logos/logoApp.png'

function formatDate(val) {
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    const [y, m, d] = val.split('-')
    return `${d}-${m}-${y}`
  }
  return val || ''
}

function buildFieldMap(seccions) {
  const map = {}
  for (const s of seccions) {
    for (const c of s.camps) {
      map[c.name] = c
    }
  }
  return map
}

function formatSummaryValue(camp, val) {
  if (val === null || val === undefined || val === '') return '—'
  if (camp?.type === 'date') return formatDate(val)
  return String(val)
}

export default function DetallPage() {
  const { tipus, id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { user } = useAuth()
  const isViewer = user?.role === 'viewer'
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

  const { titleField, metaFields, fieldMap } = useMemo(() => {
    if (!config) return { titleField: null, metaFields: [], fieldMap: {} }
    const fm = buildFieldMap(config.seccions)
    const cols = config.columnes_llista || []
    return {
      titleField: cols[0] || null,
      metaFields: cols.slice(1),
      fieldMap: fm,
    }
  }, [config])

  async function handleDelete() {
    if (!confirm('Segur que vols eliminar aquesta anàlisi?')) return
    try {
      await eliminarAnalisi(tipus, id)
      addToast('Anàlisi eliminada')
      navigate(`/${tipus}`)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <p aria-busy="true">Carregant...</p>
  if (error) return <p>Error: {error}</p>
  if (!analisi) return <p>No trobat.</p>

  const titleValue = titleField ? (analisi[titleField] || `#${analisi.id}`) : `#${analisi.id}`
  const metaItems = metaFields
    .map((name) => formatSummaryValue(fieldMap[name], analisi[name]))
    .filter((v) => v !== '—')

  return (
    <>
      <div className="print-header">
        <div className="print-header-brand">
          <img src={logoApp} alt="Lab FC" className="print-logo" />
          <div>
            <h1 className="print-title">{config.nom}</h1>
            <p className="print-subtitle">Informe d'anàlisi</p>
          </div>
        </div>
        <div className="print-meta-grid">
          {[titleField, ...metaFields].filter(Boolean).map((name) => (
            <div key={name} className="print-meta-item">
              <span className="print-meta-label">{fieldMap[name]?.label || name}</span>
              <span className="print-meta-value">{formatSummaryValue(fieldMap[name], analisi[name])}</span>
            </div>
          ))}
        </div>
        {analisi.codi && (
          <div className="print-qr">
            <QRCode value={String(analisi.codi)} size={100} />
          </div>
        )}
      </div>
      <div className="detall-toolbar no-print">
        <div className="detall-toolbar-info">
          <h2>Anàlisi {titleValue}</h2>
          {metaItems.length > 0 && (
            <span className="detall-toolbar-meta">{metaItems.join(' — ')}</span>
          )}
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
          <button className="outline contrast" onClick={() => navigate(`/${tipus}`)}>Tornar a llista</button>
          {!isViewer && (
            <>
              <Link to={`/${tipus}/${id}/editar`} role="button" className="outline">Editar</Link>
              <button className="outline" onClick={() => {
                const { id: _id, created_at, updated_at, created_by, updated_by, tipus: _t, ...dades } = analisi
                navigate(`/${tipus}/nou`, { state: { duplicatDe: dades } })
              }}>Duplicar</button>
              <button className="outline secondary" onClick={handleDelete}>Eliminar</button>
            </>
          )}
          <button className="outline contrast" onClick={() => window.print()}>Imprimir</button>
        </div>
      </div>
      <AnalisisDetail seccions={config.seccions} analisi={analisi} />
    </>
  )
}
