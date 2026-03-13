import { SECCIONS } from '../data/campsBlatT1'

export default function AnalisisDetail({ analisi }) {
  function formatValue(camp, val) {
    if (val === null || val === undefined || val === '') return '—'
    if (camp.type === 'checkbox') return val ? 'Sí' : 'No'
    return val
  }

  return (
    <>
      {SECCIONS.map((seccio) => (
        <article key={seccio.titol}>
          <header><strong>{seccio.titol}</strong></header>
          <div className="grid">
            {seccio.camps.map((camp) => (
              <div key={camp.name}>
                <small><strong>{camp.label}</strong></small>
                <br />
                {formatValue(camp, analisi[camp.name])}
              </div>
            ))}
          </div>
        </article>
      ))}
    </>
  )
}
