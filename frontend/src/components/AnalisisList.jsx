import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { alertaStyle } from '../utils/alertes'
import Icon from './Icon'
import EmptyState from './ui/EmptyState'

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

export default function AnalisisList({ tipus, analisis, columnes, seccions, sortCol, sortDir, onSort, tipusConfig, canCreate = false }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  if (analisis.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="Inbox" size={40} />}
        title={t('llista.no_analisis')}
        description={t('llista.no_analisis_desc')}
        action={canCreate ? (
          <Link to={`/${tipus}/nou`} className="btn btn-primary">
            <Icon name="Plus" size={14} />
            <span>{t('llista.nou_analisi')}</span>
          </Link>
        ) : null}
      />
    )
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
    if (sortCol !== col) return <Icon name="ChevronsUpDown" size={12} className="sort-icon" />
    return sortDir === 'asc'
      ? <Icon name="ArrowUp" size={12} className="sort-icon" />
      : <Icon name="ArrowDown" size={12} className="sort-icon" />
  }

  return (
    <div className="overflow-auto">
      <table className="analisis-list-table">
        <thead>
          <tr>
            <th className="col-check" title={t('llista.col_finalitzat')}><Icon name="Check" size={14} /></th>
            <th className="col-check" title={t('llista.col_alerta')}><Icon name="AlertTriangle" size={14} /></th>
            <th className="col-check" title={t('llista.col_apte')}><Icon name="ShieldCheck" size={14} /></th>
            <th className="col-check" title={t('llista.col_adjunts')}><Icon name="Paperclip" size={14} /></th>
            {columnes.map((col) => (
              <th
                key={col}
                data-col-type={typeMap[col] || 'text'}
                aria-sort={sortCol !== col ? 'none' : sortDir === 'asc' ? 'ascending' : 'descending'}
              >
                {/* El control ha de ser un <button> i no la <th> sencera:
                    així s'hi arriba amb el tabulador i els lectors de
                    pantalla n'anuncien l'ordre via aria-sort. */}
                <button type="button" className="th-sort" onClick={() => onSort(col)}>
                  {labelMap[col] || col}{sortIndicator(col)}
                </button>
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
              tabIndex={0}
              onClick={() => navigate(`/${tipus}/${a.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  navigate(`/${tipus}/${a.id}`)
                }
              }}
              className={rowClasses.join(' ')}
            >
              <td
                className="col-check"
                title={a.finalitzat ? t('detall.finalitzat') : t('detall.pendent')}
              >
                <span className={`row-check ${a.finalitzat ? 'is-on' : 'is-off'}`}>
                  {a.finalitzat ? <Icon name="Check" size={14} /> : null}
                </span>
              </td>
              <td
                className="col-check"
                title={a.alerta ? (a.alerta_motiu || t('detall.alerta')) : ''}
              >
                {a.alerta && <span className="row-alerta-icon"><Icon name="AlertTriangle" size={14} /></span>}
              </td>
              <td
                className="col-check"
                title={a.apte === 'apte' ? t('detall.apte') : a.apte === 'no_apte' ? t('detall.no_apte') : t('detall.pendent_apte')}
              >
                {a.apte === 'apte' && <span className="row-apte-icon is-apte"><Icon name="Check" size={14} /></span>}
                {a.apte === 'no_apte' && <span className="row-apte-icon is-no-apte"><Icon name="X" size={14} /></span>}
              </td>
              <td
                className="col-check"
                title={a.n_adjunts > 0 ? t('llista.col_adjunts_n', { count: a.n_adjunts }) : ''}
              >
                {a.n_adjunts > 0 && <span className="row-adjunt-icon"><Icon name="Paperclip" size={14} /></span>}
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
