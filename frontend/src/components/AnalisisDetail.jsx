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

export default function AnalisisDetail({ seccions, analisi }) {
  function formatValue(camp, val) {
    if (val === null || val === undefined || val === '') return '—'
    if (camp.type === 'checkbox') return val ? 'Sí' : 'No'
    if (camp.type === 'date' && typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
      const [y, m, d] = val.split('-')
      return `${d}-${m}-${y}`
    }
    return val
  }

  function renderCamp(camp) {
    const isWideItem = camp.label.length > 30 || camp.type === 'textarea'
    return (
      <div key={camp.name} className={`camp-item${isWideItem ? ' camp-item-wide' : ''}${camp.type === 'textarea' ? ' camp-item-textarea' : ''}`}>
        <span className="camp-label">{camp.label}:</span>
        <span className="camp-value">{formatValue(camp, analisi[camp.name])}</span>
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
