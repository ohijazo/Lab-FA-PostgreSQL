import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchDashboard } from '../api/dashboard'
import KpiCards from '../components/dashboard/KpiCards'
import GraficLinia from '../components/dashboard/GraficLinia'
import GraficBarres from '../components/dashboard/GraficBarres'
import GraficRendiment from '../components/dashboard/GraficRendiment'
import TaulaResum from '../components/dashboard/TaulaResum'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { tipus } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dataInici, setDataInici] = useState('')
  const [dataFi, setDataFi] = useState('')
  const [filtres, setFiltres] = useState({})  // { fieldName: value }
  const [filtersInfo, setFiltersInfo] = useState([])  // [{ field, label, options }]

  const carrega = (inici, fi, flts) => {
    setLoading(true)
    setError(null)
    fetchDashboard(tipus, { data_inici: inici, data_fi: fi, filtres: flts })
      .then((d) => {
        setData(d)
        if (d.filters) setFiltersInfo(d.filters)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setFiltres({})
    setFiltersInfo([])
    carrega('', '', {})
  }, [tipus])

  // Reload automatically when any filter or date changes
  const handleFilterChange = (field, value) => {
    const newFiltres = { ...filtres, [field]: value }
    setFiltres(newFiltres)
    carrega(dataInici, dataFi, newFiltres)
  }

  const handleDataIniciChange = (value) => {
    setDataInici(value)
    carrega(value, dataFi, filtres)
  }

  const handleDataFiChange = (value) => {
    setDataFi(value)
    carrega(dataInici, value, filtres)
  }

  const groupEntries = data?.groups ? Object.entries(data.groups) : []

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>{t('dashboard_page.dashboard', { nom: data?.nom || tipus })}</h2>
        <Link to={`/${tipus}`} role="button" className="outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85em' }}>
          {t('dashboard_page.tornar_llista')}
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'end', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <label style={{ margin: 0 }}>
          <small>{t('dashboard_page.data_inici')}</small>
          <input type="date" value={dataInici} onChange={(e) => handleDataIniciChange(e.target.value)} style={{ marginBottom: 0 }} />
        </label>
        <label style={{ margin: 0 }}>
          <small>{t('dashboard_page.data_fi')}</small>
          <input type="date" value={dataFi} onChange={(e) => handleDataFiChange(e.target.value)} style={{ marginBottom: 0 }} />
        </label>
        {filtersInfo.filter(f => f.options.length > 0).map((fi) => (
          <label key={fi.field} style={{ margin: 0 }}>
            <small>{fi.label}</small>
            <select
              value={filtres[fi.field] || ''}
              onChange={(e) => handleFilterChange(fi.field, e.target.value)}
              style={{ marginBottom: 0 }}
            >
              <option value="">{t('common.totes')}</option>
              {fi.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {loading && <p aria-busy="true">{t('dashboard_page.carregant')}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {data && !loading && (
        <>
          <p>
            <strong>{data.total_registres}</strong> {t('dashboard_page.registres')}
            {data.rang_dates?.min && (
              <> — del {data.rang_dates.min} al {data.rang_dates.max}</>
            )}
          </p>

          <KpiCards kpis={data.kpis} kpiOrder={data.kpi_order} fieldSeccio={data.field_seccio} />

          <div className="dashboard-charts">
            <GraficLinia
              serieTemporal={data.serie_temporal}
              metricKeys={data.metric_keys}
              metricLabels={data.metric_labels}
            />
            {groupEntries.map(([gf, gInfo]) => (
              <GraficBarres
                key={gf}
                groupData={gInfo.data}
                groupLabel={gInfo.label}
                metricKeys={data.metric_keys}
                metricLabels={data.metric_labels}
              />
            ))}
            {groupEntries.length > 0 && data.metric_keys?.length >= 3 && (
              <GraficRendiment
                groupData={groupEntries[0][1].data}
                groupLabel={groupEntries[0][1].label}
                metricKey={data.metric_keys[2]}
                metricLabel={data.metric_labels?.[data.metric_keys[2]]}
              />
            )}
          </div>

          {groupEntries.map(([gf, gInfo]) => (
            <TaulaResum
              key={gf}
              titol={t('dashboard_page.resum_per', { label: gInfo.label })}
              dades={gInfo.data}
              metricKeys={data.metric_keys}
              metricLabels={data.metric_labels}
            />
          ))}
        </>
      )}
    </>
  )
}
