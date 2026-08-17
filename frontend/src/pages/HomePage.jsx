import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchDashboardGlobal } from '../api/dashboard'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n/index.js'
import Icon from '../components/Icon'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Skeleton from '../components/ui/Skeleton'

export default function HomePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isViewer = user?.role === 'viewer'
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cerca, setCerca] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
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
      setExportOpen(true)
    }
    window.addEventListener('open-export-dialog', handleOpenExport)
    return () => window.removeEventListener('open-export-dialog', handleOpenExport)
  }, [])

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

  if (loading) {
    return (
      <>
        <div className="home-kpi-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="kpi-card">
              <Skeleton width="60%" height="0.75rem" />
              <Skeleton width="40%" height="1.75rem" style={{ marginTop: '0.75rem' }} />
            </div>
          ))}
        </div>
        <div className="tipus-table-wrapper" style={{ marginTop: '1rem' }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--lab-border)' }}>
              <Skeleton width="30%" height="1rem" />
            </div>
          ))}
        </div>
      </>
    )
  }
  if (!data) return <p>{t('common.error_carregant')}</p>

  const filtrats = data.per_tipus.filter((tip) => {
    const query = cerca.toLowerCase()
    return tip.nom.toLowerCase().includes(query) || (tip.descripcio || '').toLowerCase().includes(query)
  })

  const kpis = [
    { label: t('home.total_analisis'), value: data.total_analisis, icon: 'FlaskConical' },
    { label: t('home.aquest_any'),     value: data.analisis_any_actual, icon: 'CalendarDays' },
    { label: t('home.aquest_mes'),     value: data.analisis_mes_actual, icon: 'CalendarClock' },
    { label: t('home.ultim_analisi'),  value: formatDate(data.ultima_analisi), icon: 'Clock', small: true },
  ]

  return (
    <>
      {/* KPIs globals */}
      <div className="home-kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="kpi-card kpi-card-lab">
            <div className="kpi-card-header">
              <span className="kpi-label">{k.label}</span>
              <span className="kpi-icon"><Icon name={k.icon} size={18} /></span>
            </div>
            <div className={`kpi-value-lg${k.small ? ' kpi-value-sm' : ''}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar: cerca */}
      <div className="home-toolbar">
        <div className="search-input-wrap">
          <Icon name="Search" size={14} className="search-input-icon" />
          <input
            type="search"
            placeholder={t('home.cercar_tipus')}
            value={cerca}
            onChange={(e) => setCerca(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-auto tipus-table-wrapper tipus-table-wrapper-mb">
        <table className="tipus-table">
          <thead>
            <tr>
              <th>{t('home.tipus')}</th>
              <th className="cell-right">{t('home.total')}</th>
              <th className="cell-right">{t('home.mes')}</th>
              <th>{t('home.ultima')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrats.map((tip) => (
              <tr key={tip.slug}>
                <td>
                  <Link to={`/${tip.slug}`} className="tipus-name-link">{tip.nom}</Link>
                  {tip.descripcio && <small className="tipus-desc">{tip.descripcio}</small>}
                </td>
                <td className="cell-right cell-num">{tip.total}</td>
                <td className="cell-right cell-num">{tip.mes_actual}</td>
                <td className="cell-muted">{formatDate(tip.ultima)}</td>
                <td>
                  <div className="tipus-row-actions">
                    {!isViewer && (
                      <Link to={`/${tip.slug}/nou`} className="btn btn-primary btn-sm">
                        <Icon name="Plus" size={12} />
                        <span>{t('home.nou')}</span>
                      </Link>
                    )}
                    <Link to={`/${tip.slug}`} className="btn btn-outline btn-sm">
                      <Icon name="List" size={12} />
                      <span>{t('home.llista')}</span>
                    </Link>
                    <Link to={`/dashboard/${tip.slug}`} className="btn btn-ghost btn-sm">
                      <Icon name="BarChart3" size={12} />
                      <span>{t('home.dashboard')}</span>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {filtrats.length === 0 && (
              <tr><td colSpan={5} className="cell-muted" style={{ textAlign: 'center' }}>{t('common.cap_resultat')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Activitat recent */}
      {data.activitat_recent.length > 0 && (
        <details className="home-activitat">
          <summary>{t('home.activitat_recent')}</summary>
          <div className="overflow-auto">
            <table className="home-activitat-table">
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
                    className="clickable-row"
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

      {/* Modal exportar */}
      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title={t('home.exportar_excel')}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setExportOpen(false)}>{t('common.cancellar')}</Button>
            <Button
              variant="primary"
              icon={<Icon name="Download" size={14} />}
              disabled={exportSlugs.length === 0}
              onClick={() => {
                const params = new URLSearchParams()
                exportSlugs.forEach(s => params.append('tipus', s))
                if (exportFrom) params.set('date_from', exportFrom)
                if (exportTo) params.set('date_to', exportTo)
                window.location.href = `/api/analisis/export-multi?${params.toString()}`
                setExportOpen(false)
              }}
            >
              {t('common.exportar')}
            </Button>
          </>
        }
      >
        <div className="export-date-row">
          <label>{t('common.de')}
            <input type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} />
          </label>
          <label>{t('common.a')}
            <input type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)} />
          </label>
        </div>

        <fieldset className="export-tipus-list">
          <legend>{t('home.tipus_analisi')}</legend>
          <label className="export-tipus-item">
            <input
              type="checkbox"
              checked={exportSlugs.length === data.per_tipus.length}
              onChange={(e) => setExportSlugs(e.target.checked ? data.per_tipus.map(tip => tip.slug) : [])}
            />
            <strong>{t('home.seleccionar_tots')}</strong>
          </label>
          {data.per_tipus.map((tip) => (
            <label key={tip.slug} className="export-tipus-item">
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
      </Modal>
    </>
  )
}
