import { Link } from 'react-router-dom'

function formatCell(col, value, type) {
  if (value === null || value === undefined || value === '') return '—'
  if (type === 'date' && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.split('-')
    return `${d}-${m}-${y}`
  }
  return value
}

export default function AnalisisList({ tipus, analisis, columnes, seccions, sortCol, sortDir, onSort }) {
  if (analisis.length === 0) {
    return <p>No hi ha anàlisis registrades.</p>
  }

  const labelMap = {}
  const typeMap = {}
  for (const sec of seccions) {
    for (const camp of sec.camps) {
      labelMap[camp.name] = camp.label
      typeMap[camp.name] = camp.type
    }
  }

  function sortIndicator(col) {
    if (sortCol !== col) return ' ↕'
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <div className="overflow-auto">
      <table>
        <thead>
          <tr>
            {columnes.map((col) => (
              <th
                key={col}
                onClick={() => onSort(col)}
                style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
              >
                {labelMap[col] || col}{sortIndicator(col)}
              </th>
            ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {analisis.map((a) => (
            <tr key={a.id}>
              {columnes.map((col) => (
                <td key={col}>{formatCell(col, a[col], typeMap[col])}</td>
              ))}
              <td><Link to={`/${tipus}/${a.id}`}>Veure</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
