export default function KpiCards({ kpis }) {
  if (!kpis || Object.keys(kpis).length === 0) {
    return <p>No hi ha dades per mostrar KPIs.</p>
  }

  return (
    <div className="kpi-grid">
      {Object.entries(kpis).map(([key, k]) => (
        <div key={key} className="kpi-card">
          <div className="kpi-label">{k.label || key}</div>
          <div className="kpi-avg">{k.avg}</div>
          <div className="kpi-range">
            <span>Min: {k.min}</span>
            <span>Max: {k.max}</span>
          </div>
          <div className="kpi-count">{k.count} reg.</div>
        </div>
      ))}
    </div>
  )
}
