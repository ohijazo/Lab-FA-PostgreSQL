import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchDashboard } from '../api/dashboard'
import KpiCards from '../components/dashboard/KpiCards'
import GraficLinia from '../components/dashboard/GraficLinia'
import GraficBarres from '../components/dashboard/GraficBarres'
import GraficRendiment from '../components/dashboard/GraficRendiment'
import TaulaResum from '../components/dashboard/TaulaResum'

export default function DashboardPage() {
  const { tipus } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dataInici, setDataInici] = useState('')
  const [dataFi, setDataFi] = useState('')
  const [filtre, setFiltre] = useState('')
  const [filterOptions, setFilterOptions] = useState([])
  const [filterLabel, setFilterLabel] = useState('')

  const carrega = (inici, fi, flt) => {
    setLoading(true)
    setError(null)
    fetchDashboard(tipus, { data_inici: inici, data_fi: fi, filtre: flt })
      .then((d) => {
        setData(d)
        if (d.filter_options) setFilterOptions(d.filter_options)
        if (d.filter_label) setFilterLabel(d.filter_label)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setFiltre('')
    setFilterOptions([])
    carrega('', '', '')
  }, [tipus])

  const handleFiltrar = (e) => {
    e.preventDefault()
    carrega(dataInici, dataFi, filtre)
  }

  const groupEntries = data?.groups ? Object.entries(data.groups) : []

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Dashboard: {data?.nom || tipus}</h2>
        <Link to={`/${tipus}`} role="button" className="outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85em' }}>
          ← Tornar a llista
        </Link>
      </div>

      <form onSubmit={handleFiltrar} style={{ display: 'flex', gap: '0.75rem', alignItems: 'end', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <label style={{ margin: 0 }}>
          <small>Data inici</small>
          <input type="date" value={dataInici} onChange={(e) => setDataInici(e.target.value)} style={{ marginBottom: 0 }} />
        </label>
        <label style={{ margin: 0 }}>
          <small>Data fi</small>
          <input type="date" value={dataFi} onChange={(e) => setDataFi(e.target.value)} style={{ marginBottom: 0 }} />
        </label>
        {filterLabel && filterOptions.length > 0 && (
          <label style={{ margin: 0 }}>
            <small>{filterLabel}</small>
            <select value={filtre} onChange={(e) => setFiltre(e.target.value)} style={{ marginBottom: 0 }}>
              <option value="">Totes</option>
              {filterOptions.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
        )}
        <button type="submit" style={{ marginBottom: 0, padding: '0.4rem 1rem' }}>Filtrar</button>
      </form>

      {loading && <p aria-busy="true">Carregant dashboard...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {data && !loading && (
        <>
          <p>
            <strong>{data.total_registres}</strong> registres
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
              titol={`Resum per ${gInfo.label}`}
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
