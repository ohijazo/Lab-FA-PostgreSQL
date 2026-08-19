/**
 * Retorna els [min, max] efectius per un camp donat el context de valors i la
 * config del tipus. Si el camp té `rangs_condicionals` i s'ha triat un
 * controlador amb valor:
 *   - si hi ha rang definit per aquest valor → l'aplica
 *   - si no → retorna [null, null] (sense alerta)
 * Altrament aplica els `alerta_min`/`alerta_max` estàtics.
 */
export function getRangEfectiu(camp, allValues, tipusConfig) {
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

// Formata un número traient decimals innecessaris (12.0 → "12", 12.34 → "12.34")
function formatNum(n) {
  if (n === null || n === undefined || isNaN(n)) return ''
  const s = String(n)
  if (s.includes('.')) return String(parseFloat(n))
  return s
}

/**
 * Retorna informació del rang esperat per mostrar al formulari/detall.
 * Retorn possible:
 *   { kind: 'range', label: '12–14', min, max, status: 'ok' | 'below' | 'above' }
 *   { kind: 'min',   label: '≥ 12', min, status }
 *   { kind: 'max',   label: '≤ 14', max, status }
 *   { kind: 'needs_ctrl', controladorLabel } — té condicionals però controlador buit
 *   null — no aplica (sense rangs)
 *
 * `status` és relativa a `value` si aquest és numèric.
 * `controladorLabel` es passa des del component (necessita saber el label real).
 */
export function getRangInfo(camp, value, allValues, tipusConfig, controladorLabel) {
  if (camp.type !== 'number') return null
  const [min, max] = getRangEfectiu(camp, allValues, tipusConfig)

  // Cas 1: no hi ha rang aplicable
  if (min == null && max == null) {
    // Si té condicionals però el controlador està buit, informar
    const rc = camp.rangs_condicionals
    const teCondicionals = rc && typeof rc === 'object' && Object.keys(rc).length > 0
    const controlador = tipusConfig && tipusConfig.camp_controlador
    if (teCondicionals && controlador) {
      const valorCtrl = allValues ? allValues[controlador] : undefined
      if (valorCtrl === undefined || valorCtrl === null || valorCtrl === '') {
        return { kind: 'needs_ctrl', controladorLabel: controladorLabel || controlador }
      }
    }
    return null
  }

  // Determinar status segons value actual
  let status = 'ok'
  const n = parseFloat(value)
  if (!isNaN(n)) {
    if (min != null && n < min) status = 'below'
    else if (max != null && n > max) status = 'above'
  }

  if (min != null && max != null) {
    return { kind: 'range', label: `${formatNum(min)}–${formatNum(max)}`, min, max, status }
  }
  if (min != null) {
    return { kind: 'min', label: `≥ ${formatNum(min)}`, min, status }
  }
  return { kind: 'max', label: `≤ ${formatNum(max)}`, max, status }
}
