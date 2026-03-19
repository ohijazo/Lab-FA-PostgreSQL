export default function KpiCards({ kpis, kpiOrder, fieldSeccio }) {
  if (!kpis || Object.keys(kpis).length === 0) {
    return <p>No hi ha dades per mostrar KPIs.</p>
  }

  const orderedKeys = kpiOrder || Object.keys(kpis)

  // Group KPI keys by section, preserving config order
  const seccions = []
  const seen = new Set()
  for (const key of orderedKeys) {
    if (!kpis[key]) continue
    const seccio = fieldSeccio?.[key] || 'Altres'
    if (!seen.has(seccio)) {
      seen.add(seccio)
      seccions.push({ titol: seccio, camps: [] })
    }
    seccions.find((s) => s.titol === seccio).camps.push(key)
  }

  return (
    <>
      {seccions.map((s) => (
        <div key={s.titol} style={{ marginBottom: '0.75rem' }}>
          <h4 style={{ marginBottom: '0.3rem', fontSize: '0.95rem' }}>{s.titol}</h4>
          <div className="kpi-grid">
            {s.camps.map((key) => {
              const k = kpis[key]
              return (
                <div key={key} className="kpi-card">
                  <div className="kpi-label">{k.label || key}</div>
                  <div className="kpi-avg">{k.avg}</div>
                  <div className="kpi-range">
                    <span>Min: {k.min}</span>
                    <span>Max: {k.max}</span>
                  </div>
                  <div className="kpi-count">{k.count} reg.</div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
}
