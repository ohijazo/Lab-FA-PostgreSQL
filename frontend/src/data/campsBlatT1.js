/**
 * Definició de seccions i camps per al formulari Blat T1.
 * Cada secció té un títol i una llista de camps amb:
 *   - name:  nom del camp (coincideix amb el model backend)
 *   - label: etiqueta visible (en català)
 *   - type:  "text" | "number" | "date" | "checkbox" | "textarea"
 *   - required: true/false
 */
export const SECCIONS = [
  {
    titol: 'Identificació',
    camps: [
      { name: 'data', label: 'Data', type: 'date', required: true },
      { name: 'codi', label: 'Codi', type: 'text', required: true },
      { name: 'analista', label: 'Analista', type: 'text' },
      { name: 'farina', label: 'Farina', type: 'text' },
      { name: 'lot', label: 'Lot', type: 'text' },
      { name: 'data_produccio', label: 'Data producció', type: 'date' },
    ],
  },
  {
    titol: 'Resultats farina',
    camps: [
      { name: 'rebuig_percentatge', label: 'Rebuig (%)', type: 'number' },
      { name: 'rebuig_g', label: 'Rebuig (g)', type: 'number' },
      { name: 'farina_w', label: 'W', type: 'number' },
      { name: 'farina_pl', label: 'P/L', type: 'number' },
      { name: 'farina_p', label: 'P', type: 'number' },
      { name: 'farina_l', label: 'L', type: 'number' },
      { name: 'farina_ie', label: 'Ie', type: 'number' },
      { name: 'farina_g', label: 'G', type: 'number' },
      { name: 'humitat', label: 'Humitat', type: 'number' },
      { name: 'proteina', label: 'Proteïna', type: 'number' },
      { name: 'gindex', label: 'Gluten Index', type: 'number' },
      { name: 'ghumit', label: 'Gluten humit', type: 'number' },
      { name: 'gsec', label: 'Gluten sec', type: 'number' },
      { name: 'pes_gluten_tamisat', label: 'Pes gluten tamisat', type: 'number' },
      { name: 'pes_gluten_total', label: 'Pes gluten total', type: 'number' },
      { name: 'pes_gluten_sec', label: 'Pes gluten sec', type: 'number' },
    ],
  },
  {
    titol: 'Alveo 2h',
    camps: [
      { name: 'alveo2_w', label: 'W', type: 'number' },
      { name: 'alveo2_pl', label: 'P/L', type: 'number' },
      { name: 'alveo2_p', label: 'P', type: 'number' },
      { name: 'alveo2_l', label: 'L', type: 'number' },
      { name: 'alveo2_idp', label: 'IDP', type: 'number' },
      { name: 'alveo2_g', label: 'G', type: 'number' },
    ],
  },
  {
    titol: 'NIR',
    camps: [
      { name: 'nir_cendres', label: 'Cendres', type: 'number' },
      { name: 'nir_ghumit', label: 'Gluten humit', type: 'number' },
      { name: 'nir_absorcio', label: 'Absorció', type: 'number' },
    ],
  },
  {
    titol: 'Especificacions',
    camps: [
      { name: 'espec_w', label: 'W', type: 'number' },
      { name: 'espec_pl', label: 'P/L', type: 'number' },
      { name: 'espec_proteina_min', label: 'Proteïna mín.', type: 'number' },
      { name: 'espec_gluten_min', label: 'Gluten mín.', type: 'number' },
      { name: 'espec_p', label: 'P', type: 'number' },
      { name: 'espec_l', label: 'L', type: 'number' },
    ],
  },
  {
    titol: 'Qualitat',
    camps: [
      { name: 'observacions', label: 'Observacions', type: 'textarea' },
      { name: 'verificacio', label: 'Verificació', type: 'checkbox' },
      { name: 'persona_verificacio', label: 'Persona verificació', type: 'text' },
    ],
  },
]
