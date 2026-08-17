/**
 * Retorna els [min, max] efectius per un camp donat el context de valors i la
 * config del tipus. Si el camp té `rangs_condicionals` i s'ha triat un
 * controlador amb valor:
 *   - si hi ha rang definit per aquest valor → l'aplica
 *   - si no → retorna [null, null] (sense alerta)
 * Altrament aplica els `alerta_min`/`alerta_max` estàtics.
 */
function getRangEfectiu(camp, allValues, tipusConfig) {
  const rc = camp.rangs_condicionals
  const controlador = tipusConfig && tipusConfig.camp_controlador
  const teCondicionals = rc && typeof rc === 'object' && Object.keys(rc).length > 0
  if (teCondicionals && controlador) {
    const valor = allValues ? allValues[controlador] : undefined
    if (valor === undefined || valor === null || valor === '') {
      return [null, null]
    }
    const rang = rc[String(valor)]
    if (!rang) return [null, null]
    const min = rang.min !== undefined && rang.min !== null && rang.min !== '' ? parseFloat(rang.min) : null
    const max = rang.max !== undefined && rang.max !== null && rang.max !== '' ? parseFloat(rang.max) : null
    return [isNaN(min) ? null : min, isNaN(max) ? null : max]
  }
  return [camp.alerta_min, camp.alerta_max]
}

export function getAlertaColor(camp, value, allValues, tipusConfig) {
  if (camp.type !== 'number') return null
  const n = parseFloat(value)
  if (isNaN(n)) return null
  const [min, max] = getRangEfectiu(camp, allValues, tipusConfig)
  if (min != null && n < min) return camp.alerta_color_min || '#3b82f6'
  if (max != null && n > max) return camp.alerta_color_max || '#e53e3e'
  return null
}

export function alertaStyle(camp, value, allValues, tipusConfig) {
  const color = getAlertaColor(camp, value, allValues, tipusConfig)
  if (!color) return undefined
  return { color, fontWeight: 700 }
}
