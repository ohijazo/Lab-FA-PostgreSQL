import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { groupCamps } from '../utils/groupCamps'
import { alertaStyle } from '../utils/alertes'
import { recomputeFormulas } from '../utils/formula'

const WIDE_THRESHOLD = 4

export default function AnalisisDetail({ seccions, analisi }) {
  const { t } = useTranslation()
  // Recalcula els camps amb fórmula a partir dels valors desats
  // (sempre actualitzat segons les fórmules actuals)
  const data = useMemo(() => recomputeFormulas(seccions, analisi || {}), [seccions, analisi])
  function formatValue(camp, val) {
    if (val === null || val === undefined || val === '') return '—'
    if (camp.type === 'checkbox') return val ? t('common.si') : t('common.no')
    if (camp.type === 'date' && typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
      const [y, m, d] = val.split('-')
      return `${d}-${m}-${y}`
    }
    const str = String(val).replace(',', '.')
    const n = typeof val === 'number' ? val : parseFloat(str)
    if (!isNaN(n) && str.match(/^\d+\.\d{5,}$/)) {
      return parseFloat(n.toFixed(4))
    }
    return val
  }

  function renderCamp(camp) {
    const isWideItem = camp.label.length > 30 || camp.type === 'textarea'
    const isCalc = !!(camp.formula && camp.formula.trim())
    const val = data[camp.name]
    return (
      <div key={camp.name} className={`camp-item${isWideItem ? ' camp-item-wide' : ''}${camp.type === 'textarea' ? ' camp-item-textarea' : ''}`}>
        <span className="camp-label">
          {camp.label}:
          {isCalc && <span className="formula-badge" title={camp.formula}>ƒ</span>}
        </span>
        <span className="camp-value" style={alertaStyle(camp, val)}>
          {formatValue(camp, val)}
        </span>
      </div>
    )
  }

  return (
    <div className="analisis-seccions">
      {seccions.map((seccio) => {
        const isWide = seccio.camps.length > WIDE_THRESHOLD
        const isNarrow = seccio.camps.every((c) => c.type === 'number' && c.label.length <= 25)
        const gridClass = isNarrow ? 'camps-grid camps-grid-narrow' : 'camps-grid'
        const groups = groupCamps(seccio.camps)
        const hasGroups = groups.some((g) => g.grup)

        return (
          <section
            key={seccio.titol}
            className={`analisis-seccio${isWide ? ' seccio-wide' : ''}`}
          >
            <h3 className="seccio-titol">{seccio.titol}</h3>
            {hasGroups ? (
              groups.map((g, i) =>
                g.grup ? (
                  <div key={g.grup} className="detail-subgrup">
                    <div className="detail-subgrup-titol">{g.grup}</div>
                    <div className={gridClass}>
                      {g.camps.map(renderCamp)}
                    </div>
                  </div>
                ) : (
                  <div key={i} className={gridClass}>
                    {g.camps.map(renderCamp)}
                  </div>
                )
              )
            ) : (
              <div className={gridClass}>
                {seccio.camps.map(renderCamp)}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
