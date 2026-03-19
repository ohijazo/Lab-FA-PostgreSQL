import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDashboardGlobal } from '../api/dashboard'

export default function HomePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cerca, setCerca] = useState('')
  const dialogRef = useRef(null)
  const [exportSlugs, setExportSlugs] = useState([])
  const [exportFrom, setExportFrom] = useState('')
  const [exportTo, setExportTo] = useState('')

  useEffect(() => {
    fetchDashboardGlobal()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p aria-busy="true">Carregant...</p>
  if (!data) return <p>Error carregant dades.</p>

  const filtrats = data.per_tipus.filter((t) => {
    const q = cerca.toLowerCase()
    return t.nom.toLowerCase().includes(q) || (t.descripcio || '').toLowerCase().includes(q)
  })

  const formatDate = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatDateTime = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ marginBottom: 0 }}>Lab FA</h1>
          <p>Gestió d'anàlisis de laboratori</p>
        </div>
        <button className="outline" onClick={() => {
          setExportSlugs([])
          setExportFrom('')
          setExportTo('')
          dialogRef.current?.showModal()
        }}>
          Exportar Excel
        </button>
      </div>

      {/* KPIs globals */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total anàlisis</div>
          <div className="kpi-avg">{data.total_analisis}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Aquest any</div>
          <div className="kpi-avg">{data.analisis_any_actual}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Aquest mes</div>
          <div className="kpi-avg">{data.analisis_mes_actual}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Últim anàlisi</div>
          <div className="kpi-avg" style={{ fontSize: '1rem' }}>{formatDate(data.ultima_analisi)}</div>
        </div>
      </div>

      {/* Filtre */}
      <input
        type="search"
        placeholder="Cercar tipus d'anàlisi..."
        value={cerca}
        onChange={(e) => setCerca(e.target.value)}
        style={{ marginBottom: '0.75rem' }}
      />

      {/* Taula de tipus */}
      <h3 style={{ marginBottom: '0.5rem' }}>Tipus d'anàlisi</h3>
      <div className="overflow-auto" style={{ marginBottom: '2rem' }}>
        <table className="tipus-table">
          <thead>
            <tr>
              <th>Tipus</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th style={{ textAlign: 'right' }}>Mes</th>
              <th>Última</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrats.map((t) => (
              <tr key={t.slug}>
                <td>
                  <Link to={`/${t.slug}`} style={{ fontWeight: 700, fontSize: '1rem' }}>{t.nom}</Link>
                  {t.descripcio && <small style={{ display: 'block', color: '#64748b' }}>{t.descripcio}</small>}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: 'var(--lab-primary)' }}>{t.total}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: 'var(--lab-primary)' }}>{t.mes_actual}</td>
                <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{formatDate(t.ultima)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                    <Link to={`/${t.slug}/nou`} role="button" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8em', margin: 0 }}>Nou</Link>
                    <Link to={`/${t.slug}`} role="button" className="outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8em', margin: 0 }}>Llista</Link>
                    <Link to={`/dashboard/${t.slug}`} role="button" className="secondary outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8em', margin: 0 }}>Dashboard</Link>
                  </div>
                </td>
              </tr>
            ))}
            {filtrats.length === 0 && (
              <tr><td colSpan={5}>Cap resultat trobat.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Activitat recent */}
      {data.activitat_recent.length > 0 && (
        <details open style={{ marginBottom: '1rem' }}>
          <summary style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>Activitat recent</summary>
          <table style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Tipus</th>
                <th>Resum</th>
                <th>Data</th>
                <th>Usuari</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.activitat_recent.map((a) => (
                <tr key={a.id}>
                  <td>{a.tipus_nom}</td>
                  <td>{a.resum || '—'}</td>
                  <td>{formatDateTime(a.created_at)}</td>
                  <td>{a.created_by || '—'}</td>
                  <td>
                    <Link to={`/${a.tipus_slug}/${a.id}`} style={{ fontSize: '0.85em' }}>Veure</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}

      {/* Dialog exportar */}
      <dialog ref={dialogRef}>
        <article>
          <header>
            <button aria-label="Tancar" rel="prev" onClick={() => dialogRef.current?.close()}></button>
            <h3>Exportar Excel</h3>
          </header>

          <label>De
            <input type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} />
          </label>
          <label>A
            <input type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)} />
          </label>

          <fieldset>
            <legend>Tipus d'anàlisi</legend>
            <label style={{ marginBottom: '0.25rem' }}>
              <input
                type="checkbox"
                checked={exportSlugs.length === data.per_tipus.length}
                onChange={(e) => setExportSlugs(e.target.checked ? data.per_tipus.map(t => t.slug) : [])}
              />
              Seleccionar tots
            </label>
            {data.per_tipus.map((t) => (
              <label key={t.slug} style={{ marginBottom: '0.25rem' }}>
                <input
                  type="checkbox"
                  checked={exportSlugs.includes(t.slug)}
                  onChange={(e) => {
                    setExportSlugs(prev =>
                      e.target.checked ? [...prev, t.slug] : prev.filter(s => s !== t.slug)
                    )
                  }}
                />
                {t.nom}
              </label>
            ))}
          </fieldset>

          <footer>
            <button className="secondary" onClick={() => dialogRef.current?.close()}>Cancel·lar</button>
            <button
              disabled={exportSlugs.length === 0}
              onClick={() => {
                const params = new URLSearchParams()
                exportSlugs.forEach(s => params.append('tipus', s))
                if (exportFrom) params.set('date_from', exportFrom)
                if (exportTo) params.set('date_to', exportTo)
                window.location.href = `/api/analisis/export-multi?${params.toString()}`
                dialogRef.current?.close()
              }}
            >
              Exportar
            </button>
          </footer>
        </article>
      </dialog>
    </>
  )
}
