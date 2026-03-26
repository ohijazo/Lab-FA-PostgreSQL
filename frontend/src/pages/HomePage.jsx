import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchDashboardGlobal } from '../api/dashboard'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n/index.js'

export default function HomePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isViewer = user?.role === 'viewer'
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

  // Listen for navbar export button
  useEffect(() => {
    function handleOpenExport() {
      setExportSlugs([])
      setExportFrom('')
      setExportTo('')
      dialogRef.current?.showModal()
    }
    window.addEventListener('open-export-dialog', handleOpenExport)
    return () => window.removeEventListener('open-export-dialog', handleOpenExport)
  }, [])

  if (loading) return <p aria-busy="true">{t('common.carregant')}</p>
  if (!data) return <p>{t('common.error_carregant')}</p>

  const filtrats = data.per_tipus.filter((tip) => {
    const query = cerca.toLowerCase()
    return tip.nom.toLowerCase().includes(query) || (tip.descripcio || '').toLowerCase().includes(query)
  })

  const dateLang = i18n.language === 'es' ? 'es-ES' : 'ca-ES'

  const formatDate = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString(dateLang, { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatDateTime = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString(dateLang, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      {/* KPIs globals */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: '1rem' }}>
        <div className="kpi-card">
          <div className="kpi-label">{t('home.total_analisis')}</div>
          <div className="kpi-avg">{data.total_analisis}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('home.aquest_any')}</div>
          <div className="kpi-avg">{data.analisis_any_actual}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('home.aquest_mes')}</div>
          <div className="kpi-avg">{data.analisis_mes_actual}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('home.ultim_analisi')}</div>
          <div className="kpi-avg" style={{ fontSize: '1rem' }}>{formatDate(data.ultima_analisi)}</div>
        </div>
      </div>

      {/* Toolbar: cerca */}
      <div className="home-toolbar">
        <input
          type="search"
          placeholder={t('home.cercar_tipus')}
          value={cerca}
          onChange={(e) => setCerca(e.target.value)}
          style={{ marginBottom: 0, maxWidth: 220 }}
        />
      </div>
      <div className="overflow-auto tipus-table-wrapper" style={{ marginBottom: '2rem' }}>
        <table className="tipus-table">
          <thead>
            <tr>
              <th>{t('home.tipus')}</th>
              <th style={{ textAlign: 'right' }}>{t('home.total')}</th>
              <th style={{ textAlign: 'right' }}>{t('home.mes')}</th>
              <th>{t('home.ultima')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrats.map((tip) => (
              <tr key={tip.slug}>
                <td>
                  <Link to={`/${tip.slug}`} style={{ fontWeight: 700, fontSize: '1rem' }}>{tip.nom}</Link>
                  {tip.descripcio && <small style={{ display: 'block', color: '#64748b' }}>{tip.descripcio}</small>}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: 'var(--lab-primary)' }}>{tip.total}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: 'var(--lab-primary)' }}>{tip.mes_actual}</td>
                <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{formatDate(tip.ultima)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                    {!isViewer && <Link to={`/${tip.slug}/nou`} role="button" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8em', margin: 0 }}>{t('home.nou')}</Link>}
                    <Link to={`/${tip.slug}`} role="button" className="outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8em', margin: 0 }}>{t('home.llista')}</Link>
                    <Link to={`/dashboard/${tip.slug}`} role="button" className="secondary outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8em', margin: 0 }}>{t('home.dashboard')}</Link>
                  </div>
                </td>
              </tr>
            ))}
            {filtrats.length === 0 && (
              <tr><td colSpan={5}>{t('common.cap_resultat')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Activitat recent */}
      {data.activitat_recent.length > 0 && (
        <details open style={{ marginBottom: '1rem' }}>
          <summary style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>{t('home.activitat_recent')}</summary>
          <div className="overflow-auto">
            <table style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>{t('home.tipus')}</th>
                  <th>{t('home.codi')}</th>
                  <th>{t('home.analista')}</th>
                  <th>{t('home.modificat')}</th>
                  <th>{t('home.per')}</th>
                </tr>
              </thead>
              <tbody>
                {data.activitat_recent.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => navigate(`/${a.tipus_slug}/${a.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{a.tipus_nom}</td>
                    <td>{a.codi || '—'}</td>
                    <td>{a.analista || '—'}</td>
                    <td>{formatDateTime(a.updated_at)}</td>
                    <td>{a.updated_by || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {/* Dialog exportar */}
      <dialog ref={dialogRef}>
        <article>
          <header>
            <button aria-label={t('common.tancar')} rel="prev" onClick={() => dialogRef.current?.close()}></button>
            <h3>{t('home.exportar_excel')}</h3>
          </header>

          <label>{t('common.de')}
            <input type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} />
          </label>
          <label>{t('common.a')}
            <input type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)} />
          </label>

          <fieldset>
            <legend>{t('home.tipus_analisi')}</legend>
            <label style={{ marginBottom: '0.25rem' }}>
              <input
                type="checkbox"
                checked={exportSlugs.length === data.per_tipus.length}
                onChange={(e) => setExportSlugs(e.target.checked ? data.per_tipus.map(tip => tip.slug) : [])}
              />
              {t('home.seleccionar_tots')}
            </label>
            {data.per_tipus.map((tip) => (
              <label key={tip.slug} style={{ marginBottom: '0.25rem' }}>
                <input
                  type="checkbox"
                  checked={exportSlugs.includes(tip.slug)}
                  onChange={(e) => {
                    setExportSlugs(prev =>
                      e.target.checked ? [...prev, tip.slug] : prev.filter(s => s !== tip.slug)
                    )
                  }}
                />
                {tip.nom}
              </label>
            ))}
          </fieldset>

          <footer>
            <button className="secondary" onClick={() => dialogRef.current?.close()}>{t('common.cancellar')}</button>
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
              {t('common.exportar')}
            </button>
          </footer>
        </article>
      </dialog>
    </>
  )
}
