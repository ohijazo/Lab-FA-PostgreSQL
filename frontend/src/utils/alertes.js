export function getAlertaColor(camp, value) {
  if (camp.type !== 'number') return null
  const n = parseFloat(value)
  if (isNaN(n)) return null
  if (camp.alerta_min != null && n < camp.alerta_min) return camp.alerta_color_min || '#3b82f6'
  if (camp.alerta_max != null && n > camp.alerta_max) return camp.alerta_color_max || '#e53e3e'
  return null
}

export function alertaStyle(camp, value) {
  const color = getAlertaColor(camp, value)
  if (!color) return undefined
  return { color, fontWeight: 700 }
}
