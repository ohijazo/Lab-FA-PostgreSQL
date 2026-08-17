import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { alertaStyle } from '../utils/alertes'

function formatCell(col, value, type) {
  if (value === null || value === undefined || value === '') return '—'
  if (type === 'date' && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.split('-')
    return `${d}-${m}-${y}`
  }
  const str = String(value).replace(',', '.')
  const n = typeof value === 'number' ? value : parseFloat(str)
  if (!isNaN(n) && str.match(/^\d+\.\d{5,}$/)) {
    return parseFloat(n.toFixed(4))
  }
  return value
}

export default function AnalisisList({ tipus, analisis, columnes, seccions, sortCol, sortDir, onSort, tipusConfig }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  if (analisis.length === 0) {
    return <p>{t('llista.no_analisis')}</p>
  }

  const labelMap = {}
  const typeMap = {}
  const campMap = {}
  for (const sec of seccions) {
    for (const camp of sec.camps) {
      labelMap[camp.name] = camp.label
      typeMap[camp.name] = camp.type
      campMap[camp.name] = camp
    }
  }

  function sortIndicator(col) {
    if (sortCol !== col) return ' ↕'
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <div className="overflow-auto">
      <table className="analisis-list-table">
        <thead>
          <tr>
            <th className="col-check" title={t('llista.col_finalitzat')}>✓</th>
            <th className="col-check" title={t('llista.col_alerta')}>⚠</th>
            {columnes.map((col) => (
              <th
                key={col}
                onClick={() => onSort(col)}
                data-col-type={typeMap[col] || 'text'}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                {labelMap[col] || col}{sortIndicator(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {analisis.map((a) => {
            const rowClasses = []
            if (a.finalitzat) rowClasses.push('row-finalitzat')
            if (a.alerta) rowClasses.push('row-alerta')
            return (
            <tr
              key={a.id}
              onClick={() => navigate(`/${tipus}/${a.id}`)}
              className={rowClasses.join(' ')}
            >
              <td
                className="col-check"
                title={a.finalitzat ? t('detall.finalitzat') : t('detall.pendent')}
              >
                <span className={`row-check ${a.finalitzat ? 'is-on' : 'is-off'}`}>
                  {a.finalitzat ? '✓' : ''}
                </span>
              </td>
              <td
                className="col-check"
                title={a.alerta ? (a.alerta_motiu || t('detall.alerta')) : ''}
              >
                {a.alerta && <span className="row-alerta-icon">⚠</span>}
              </td>
              {columnes.map((col) => {
                const camp = campMap[col]
                const rawVal = a[col]
                const titleAttr = rawVal !== null && rawVal !== undefined && rawVal !== '' ? String(rawVal) : undefined
                return (
                  <td
                    key={col}
                    data-col-type={typeMap[col] || 'text'}
                    style={camp ? alertaStyle(camp, a[col], a, tipusConfig) : undefined}
                    title={titleAttr}
                  >
                    {formatCell(col, a[col], typeMap[col])}
                  </td>
                )
              })}
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
