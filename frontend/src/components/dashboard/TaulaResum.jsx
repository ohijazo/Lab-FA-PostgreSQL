export default function TaulaResum({ titol, dades, metricKeys, metricLabels }) {
  if (!dades || Object.keys(dades).length === 0) {
    return null
  }

  const entries = Object.entries(dades).sort((a, b) => b[1].count - a[1].count)
  const keys = metricKeys || []

  return (
    <div>
      <h3>{titol}</h3>
      <div className="overflow-auto">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Reg.</th>
              {keys.map((mk) => (
                <th key={mk}>{metricLabels?.[mk] || mk}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(([nom, info]) => (
              <tr key={nom}>
                <td><strong>{nom}</strong></td>
                <td>{info.count}</td>
                {keys.map((mk) => (
                  <td key={mk}>{info[mk] ?? '-'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
