import { useState } from 'react'

const WIDE_THRESHOLD = 4

function groupCamps(camps) {
  const groups = []
  let currentGrup = null
  let currentCamps = []

  for (const camp of camps) {
    const grup = camp.grup || ''
    if (grup !== currentGrup) {
      if (currentCamps.length > 0) {
        groups.push({ grup: currentGrup, camps: currentCamps })
      }
      currentGrup = grup
      currentCamps = [camp]
    } else {
      currentCamps.push(camp)
    }
  }
  if (currentCamps.length > 0) {
    groups.push({ grup: currentGrup, camps: currentCamps })
  }
  return groups
}

export default function AnalisisForm({ seccions, initialData = {}, onSubmit, submitting }) {
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

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(form)
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
    if (camp.type === 'textarea') {
      return (
        <label key={camp.name} className="form-camp form-camp-wide">
          <span className="form-camp-label">{camp.label}</span>
          <textarea
            name={camp.name}
            value={form[camp.name] || ''}
            onChange={handleChange}
            rows={4}
          />
        </label>
      )
    }
    return (
      <label key={camp.name} className={`form-camp${camp.label.length > 30 ? ' form-camp-wide' : ''}`}>
        <span className="form-camp-label">{camp.label}</span>
        <input
          type={camp.type}
          name={camp.name}
          value={form[camp.name] || ''}
          onChange={handleChange}
          required={camp.required}
          step={camp.type === 'number' ? 'any' : undefined}
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
      <button type="submit" aria-busy={submitting}>
        {submitting ? 'Desant...' : 'Desar'}
      </button>
    </form>
  )
}
