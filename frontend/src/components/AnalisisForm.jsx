import { useState } from 'react'
import { SECCIONS } from '../data/campsBlatT1'

export default function AnalisisForm({ initialData = {}, onSubmit, submitting }) {
  const [form, setForm] = useState(() => {
    const defaults = {}
    for (const seccio of SECCIONS) {
      for (const camp of seccio.camps) {
        if (camp.type === 'checkbox') {
          defaults[camp.name] = false
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

  return (
    <form onSubmit={handleSubmit}>
      {SECCIONS.map((seccio) => (
        <fieldset key={seccio.titol}>
          <legend><strong>{seccio.titol}</strong></legend>
          <div className="grid">
            {seccio.camps.map((camp) => {
              if (camp.type === 'checkbox') {
                return (
                  <label key={camp.name}>
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
                  <label key={camp.name}>
                    {camp.label}
                    <textarea
                      name={camp.name}
                      value={form[camp.name] || ''}
                      onChange={handleChange}
                      rows={3}
                    />
                  </label>
                )
              }
              return (
                <label key={camp.name}>
                  {camp.label}
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
            })}
          </div>
        </fieldset>
      ))}
      <button type="submit" aria-busy={submitting}>
        {submitting ? 'Desant...' : 'Desar'}
      </button>
    </form>
  )
}
