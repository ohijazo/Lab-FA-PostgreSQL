import { useEffect, useState } from 'react'

const TOKENS = ['--lab-chart-1', '--lab-chart-2', '--lab-chart-3', '--lab-chart-4', '--lab-chart-text', '--lab-chart-grid']

function llegirTokens() {
  const cs = getComputedStyle(document.documentElement)
  const val = (n) => cs.getPropertyValue(n).trim()
  return {
    series: [val(TOKENS[0]), val(TOKENS[1]), val(TOKENS[2]), val(TOKENS[3])],
    text: val(TOKENS[4]),
    grid: val(TOKENS[5]),
  }
}

/**
 * Colors dels gràfics presos dels tokens del full, no d'una taula d'hex
 * duplicada a cada component. Es tornen a llegir quan canvia data-theme,
 * que és l'únic senyal que tenim: el tema no viu en cap context de React.
 */
export function useColorsGrafic() {
  const [colors, setColors] = useState(llegirTokens)

  useEffect(() => {
    const obs = new MutationObserver(() => setColors(llegirTokens()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  return colors
}

/** Mateix color amb transparència, per als farciments sota la línia. */
export function ambAlfa(color, alfa) {
  return `color-mix(in srgb, ${color} ${Math.round(alfa * 100)}%, transparent)`
}
