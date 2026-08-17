import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { groupCamps } from '../utils/groupCamps'
import { getAlertaColor } from '../utils/alertes'
import { recomputeFormulas } from '../utils/formula'
import Icon from './Icon'
import Button from './ui/Button'

const WIDE_THRESHOLD = 4

export default function AnalisisForm({ seccions, initialData = {}, onSubmit, onCancel, submitting, tipusConfig }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(() => {
    const today = new Date().toISOString().slice(0, 10)
    const defaults = {}
    for (const seccio of seccions) {
      for (const camp of seccio.camps) {
        if (camp.type === 'checkbox') {
          defaults[camp.name] = false
        } else if (camp.type === 'date') {
          defaults[camp.name] = today
        } else {
          defaults[camp.name] = ''
        }
      }
    }
    return { ...defaults, ...initialData }
  })

  // Recalcula tots els camps amb fórmula a partir dels valors actuals.
  // Així si l'usuari canvia un input, els calculats s'actualitzen.
  const computed = useMemo(() => recomputeFormulas(seccions, form), [seccions, form])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    // Envia els valors amb els camps calculats actualitzats
    onSubmit(computed)
  }

  function renderCamp(camp) {
    if (camp.type === 'checkbox') {
      return (
        <label key={camp.name} className="form-camp-check">
          <input
            type="checkbox"
            name={camp.name}
            checked={form[camp.name] || false}
            onChange={handleChange}
            role="switch"
          />
          {camp.label}
        </label>
      )
    }
    if (camp.type === 'select') {
      return (
        <label key={camp.name} className={`form-camp${camp.label.length > 30 ? ' form-camp-wide' : ''}`}>
          <span className="form-camp-label">
            {camp.label}
            {camp.required && <span className="required-mark" aria-label="required">*</span>}
          </span>
          <select
            name={camp.name}
            value={form[camp.name] || ''}
            onChange={handleChange}
            required={camp.required}
          >
            <option value="">{t('common.selecciona')}</option>
            {(camp.opcions || []).map((op) => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        </label>
      )
    }
    if (camp.type === 'textarea') {
      return (
        <label key={camp.name} className="form-camp form-camp-wide">
          <span className="form-camp-label">
            {camp.label}
            {camp.required && <span className="required-mark" aria-label="required">*</span>}
          </span>
          <textarea
            name={camp.name}
            value={form[camp.name] || ''}
            onChange={handleChange}
            rows={4}
          />
        </label>
      )
    }
    const isCalc = !!(camp.formula && camp.formula.trim())
    const displayValue = isCalc ? (computed[camp.name] ?? '') : (form[camp.name] || '')
    const alertColor = getAlertaColor(camp, displayValue, computed, tipusConfig)
    return (
      <label key={camp.name} className={`form-camp${camp.label.length > 30 ? ' form-camp-wide' : ''}${isCalc ? ' form-camp-calc' : ''}`}>
        <span className="form-camp-label">
          {camp.label}
          {!isCalc && camp.required && <span className="required-mark" aria-label="required">*</span>}
          {isCalc && <span className="formula-badge" title={camp.formula}><Icon name="Sigma" size={11} /></span>}
        </span>
        <input
          type={isCalc ? 'text' : camp.type}
          name={camp.name}
          value={displayValue === null || displayValue === undefined ? '' : displayValue}
          onChange={isCalc ? undefined : handleChange}
          readOnly={isCalc}
          tabIndex={isCalc ? -1 : undefined}
          required={!isCalc && camp.required}
          step={camp.type === 'number' && !isCalc ? 'any' : undefined}
          style={alertColor ? { color: alertColor, borderColor: alertColor, fontWeight: 700 } : undefined}
        />
      </label>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="form-compact">
      {seccions.map((seccio) => {
        const isWide = seccio.camps.length > WIDE_THRESHOLD
        const isNarrow = seccio.camps.every((c) => c.type === 'number' && c.label.length <= 25)
        const gridClass = isNarrow ? 'form-camps-grid form-camps-grid-narrow' : 'form-camps-grid'
        const groups = groupCamps(seccio.camps)
        const hasGroups = groups.some((g) => g.grup)

        return (
          <fieldset
            key={seccio.titol}
            className={`form-seccio${isWide ? ' form-seccio-wide' : ''}`}
          >
            <legend className="form-seccio-legend">{seccio.titol}</legend>
            {hasGroups ? (
              groups.map((g, i) =>
                g.grup ? (
                  <div key={g.grup} className="form-subgrup">
                    <div className="form-subgrup-titol">{g.grup}</div>
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
          </fieldset>
        )
      })}
      <div className="form-submit-row">
        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          icon={<Icon name="Save" size={14} />}
        >
          {submitting ? t('common.desant') : t('common.desar')}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            {t('common.cancellar')}
          </Button>
        )}
      </div>
    </form>
  )
}
