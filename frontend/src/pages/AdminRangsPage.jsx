import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { obtenirTipusAdmin, editarCamp, llistarTipusAdmin } from '../api/admin'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import LoadingBlock from '../components/ui/LoadingBlock'
import Modal from '../components/ui/Modal'
import Icon from '../components/Icon'

// --- Cel·la editable amb autosave al blur ---
function RangCell({ initialValue, cellState, onCommit, ariaLabel }) {
  const [value, setValue] = useState(initialValue ?? '')
  const originalRef = useRef(initialValue ?? '')

  useEffect(() => {
    setValue(initialValue ?? '')
    originalRef.current = initialValue ?? ''
  }, [initialValue])

  function handleBlur() {
    const trimmed = value === '' ? '' : String(value).trim()
    if (trimmed === originalRef.current) return
    if (trimmed !== '' && isNaN(parseFloat(trimmed))) {
      setValue(originalRef.current)
      return
    }
    originalRef.current = trimmed
    onCommit(trimmed === '' ? null : parseFloat(trimmed))
  }

  return (
    <div className={`rang-input-wrap is-${cellState || 'idle'}`}>
      <input
        type="number"
        step="any"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
        className="rang-input"
        aria-label={ariaLabel}
      />
      {cellState === 'saving' && <Icon name="Loader2" size={12} className="rang-cell-state rang-spin" />}
      {cellState === 'saved' && <Icon name="Check" size={12} className="rang-cell-state rang-check" />}
      {cellState === 'error' && <Icon name="AlertCircle" size={12} className="rang-cell-state rang-err" />}
    </div>
  )
}

export default function AdminRangsPage() {
  const { t } = useTranslation()
  const { tipusId } = useParams()
  const { addToast } = useToast()
  const confirm = useConfirm()
  const [tipus, setTipus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rangs, setRangs] = useState({})
  const [activeValor, setActiveValor] = useState('')
  const [cellStates, setCellStates] = useState({})
  // Modals
  const [compareOpen, setCompareOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  // Bulk state
  const [bulkTargets, setBulkTargets] = useState(new Set())
  // Import state
  const [otherTipus, setOtherTipus] = useState([])
  const [importFromId, setImportFromId] = useState('')
  const [importPreview, setImportPreview] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const tipusData = await obtenirTipusAdmin(tipusId)
      setTipus(tipusData)
      const inicial = {}
      for (const s of tipusData.seccions || []) {
        for (const c of s.camps || []) {
          if (c.type === 'number' && c.name !== tipusData.camp_controlador) {
            inicial[c.id] = c.rangs_condicionals || {}
          }
        }
      }
      setRangs(inicial)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tipusId])

  useEffect(() => { fetchData() }, [fetchData])

  const controladorCamp = useMemo(() => {
    if (!tipus?.camp_controlador) return null
    for (const s of tipus.seccions || []) {
      for (const c of s.camps || []) {
        if (c.name === tipus.camp_controlador) return c
      }
    }
    return null
  }, [tipus])

  const opcions = controladorCamp?.opcions || []

  useEffect(() => {
    if (opcions.length > 0 && !activeValor) setActiveValor(opcions[0])
  }, [opcions, activeValor])

  const seccionsAmbCamps = useMemo(() => {
    if (!tipus) return []
    const result = []
    for (const s of tipus.seccions || []) {
      const camps = (s.camps || []).filter(c => c.type === 'number' && c.name !== tipus.camp_controlador)
      if (camps.length > 0) result.push({ titol: s.titol, id: s.id, camps })
    }
    return result
  }, [tipus])

  const totalCamps = useMemo(() => seccionsAmbCamps.reduce((n, s) => n + s.camps.length, 0), [seccionsAmbCamps])
  const allCamps = useMemo(() => seccionsAmbCamps.flatMap(s => s.camps), [seccionsAmbCamps])

  function countConfigured(valor) {
    if (!valor) return 0
    let n = 0
    for (const c of allCamps) {
      const r = rangs[c.id]?.[valor]
      if (r && (r.min != null || r.max != null)) n++
    }
    return n
  }

  async function updateAndSave(campId, valor, minMax, newVal) {
    let nextForCamp
    setRangs(prev => {
      const perCamp = { ...(prev[campId] || {}) }
      const actual = { ...(perCamp[valor] || {}) }
      if (newVal === null) delete actual[minMax]
      else actual[minMax] = newVal
      if (Object.keys(actual).length === 0) delete perCamp[valor]
      else perCamp[valor] = actual
      nextForCamp = perCamp
      return { ...prev, [campId]: perCamp }
    })
    const cellKey = `${campId}:${minMax}`
    setCellStates(prev => ({ ...prev, [cellKey]: 'saving' }))
    try {
      const netRc = Object.keys(nextForCamp).length > 0 ? nextForCamp : null
      await editarCamp(campId, { rangs_condicionals: netRc })
      setCellStates(prev => ({ ...prev, [cellKey]: 'saved' }))
      setTimeout(() => {
        setCellStates(prev => {
          if (prev[cellKey] !== 'saved') return prev
          const next = { ...prev }
          delete next[cellKey]
          return next
        })
      }, 1500)
    } catch (err) {
      setCellStates(prev => ({ ...prev, [cellKey]: 'error' }))
      addToast(err.message || 'Error desant', 'error')
    }
  }

  async function handleCopyFrom(fromValor) {
    if (!fromValor || fromValor === activeValor) return
    const ok = await confirm({
      title: t('admin_rangs.copiar', 'Copiar rangs'),
      message: t('admin_rangs.confirm_copiar', 'Els rangs del valor «{{destVal}}» seran sobreescrits amb els de «{{fromVal}}». Continuar?', { destVal: activeValor, fromVal: fromValor }),
      confirmLabel: t('admin_rangs.copiar', 'Copiar'),
      cancelLabel: t('common.cancellar'),
    })
    if (!ok) return

    for (const c of allCamps) {
      const fromRang = rangs[c.id]?.[fromValor]
      if (!fromRang) continue
      const perCamp = { ...(rangs[c.id] || {}) }
      perCamp[activeValor] = { ...fromRang }
      setRangs(prev => ({ ...prev, [c.id]: perCamp }))
      try {
        await editarCamp(c.id, { rangs_condicionals: perCamp })
      } catch (err) {
        addToast(err.message, 'error')
        return
      }
    }
    addToast(t('admin_rangs.copiat', 'Rangs copiats'))
    await fetchData()
  }

  async function handleNetejar() {
    if (!activeValor) return
    const ok = await confirm({
      title: t('admin_rangs.netejar', 'Netejar rangs'),
      message: t('admin_rangs.confirm_netejar', 'Esborrar tots els rangs del valor «{{valor}}»?', { valor: activeValor }),
      confirmLabel: t('admin_rangs.netejar', 'Netejar'),
      cancelLabel: t('common.cancellar'),
      variant: 'danger',
    })
    if (!ok) return
    for (const c of allCamps) {
      if (!rangs[c.id]?.[activeValor]) continue
      const perCamp = { ...rangs[c.id] }
      delete perCamp[activeValor]
      setRangs(prev => ({ ...prev, [c.id]: perCamp }))
      try {
        await editarCamp(c.id, { rangs_condicionals: Object.keys(perCamp).length > 0 ? perCamp : null })
      } catch (err) {
        addToast(err.message, 'error')
        return
      }
    }
    addToast(t('admin_rangs.netejats', 'Rangs esborrats'))
    await fetchData()
  }

  // --- Bulk apply: aplicar tots els rangs del valor actiu a altres valors ---
  function openBulk() {
    setBulkTargets(new Set())
    setBulkOpen(true)
  }
  function toggleBulkTarget(valor) {
    setBulkTargets(prev => {
      const next = new Set(prev)
      if (next.has(valor)) next.delete(valor)
      else next.add(valor)
      return next
    })
  }
  async function handleBulkApply() {
    if (bulkTargets.size === 0) return
    const targetList = Array.from(bulkTargets)
    const ok = await confirm({
      title: t('admin_rangs.bulk_titol', 'Aplicar a diversos valors'),
      message: t('admin_rangs.bulk_confirm', 'Els rangs de «{{src}}» seran copiats a: {{list}}. Els valors existents seran sobreescrits. Continuar?', { src: activeValor, list: targetList.join(', ') }),
      confirmLabel: t('common.aplicar', 'Aplicar'),
      cancelLabel: t('common.cancellar'),
    })
    if (!ok) return
    setBulkOpen(false)
    for (const c of allCamps) {
      const srcRang = rangs[c.id]?.[activeValor]
      if (!srcRang) continue
      const perCamp = { ...(rangs[c.id] || {}) }
      for (const tgt of targetList) {
        perCamp[tgt] = { ...srcRang }
      }
      setRangs(prev => ({ ...prev, [c.id]: perCamp }))
      try {
        await editarCamp(c.id, { rangs_condicionals: perCamp })
      } catch (err) {
        addToast(err.message, 'error')
        return
      }
    }
    addToast(t('admin_rangs.bulk_aplicat', 'Rangs aplicats a {{n}} valors', { n: targetList.size || targetList.length }))
    await fetchData()
  }

  // --- Import from other tipus ---
  async function openImport() {
    setImportFromId('')
    setImportPreview(null)
    try {
      const list = await llistarTipusAdmin()
      const withRangs = []
      for (const tp of list) {
        if (tp.id === parseInt(tipusId)) continue
        // Necessitem els seus rangs — recuperem el detall complet
        try {
          const detail = await obtenirTipusAdmin(tp.id)
          const hasSomeRangs = (detail.seccions || []).some(s =>
            (s.camps || []).some(c => c.type === 'number' && c.rangs_condicionals && Object.keys(c.rangs_condicionals).length > 0)
          )
          if (hasSomeRangs) withRangs.push(detail)
        } catch { /* skip */ }
      }
      setOtherTipus(withRangs)
    } catch (err) {
      addToast(err.message, 'error')
      return
    }
    setImportOpen(true)
  }

  function computeImportPreview(sourceTipus) {
    if (!sourceTipus) return null
    const sourceCamps = (sourceTipus.seccions || []).flatMap(s => s.camps || [])
    const destCampsByName = {}
    for (const c of allCamps) destCampsByName[c.name] = c

    // Valors del controlador del destí (aquest tipus)
    const destValues = new Set(opcions)

    const matched = []  // { destCamp, sourceCamp, rangsCoberts, rangsFiltrats }
    for (const sc of sourceCamps) {
      if (sc.type !== 'number') continue
      if (!sc.rangs_condicionals || Object.keys(sc.rangs_condicionals).length === 0) continue
      const dc = destCampsByName[sc.name]
      if (!dc || dc.type !== 'number') continue
      // Filtrar rangs per valors que existeixen al destí
      const filtered = {}
      for (const [k, v] of Object.entries(sc.rangs_condicionals)) {
        if (destValues.has(k)) filtered[k] = v
      }
      if (Object.keys(filtered).length > 0) {
        matched.push({ destCamp: dc, sourceCamp: sc, rangsFiltrats: filtered })
      }
    }
    // Valors font i quins existeixen al destí
    const sourceValues = new Set()
    for (const sc of sourceCamps) {
      if (sc.rangs_condicionals) Object.keys(sc.rangs_condicionals).forEach(v => sourceValues.add(v))
    }
    const matchingValues = Array.from(sourceValues).filter(v => destValues.has(v))
    return { matched, sourceValues: Array.from(sourceValues), matchingValues }
  }

  useEffect(() => {
    if (!importOpen || !importFromId) { setImportPreview(null); return }
    const src = otherTipus.find(tp => String(tp.id) === String(importFromId))
    setImportPreview(computeImportPreview(src))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importFromId, importOpen])

  async function handleImportApply() {
    if (!importPreview || importPreview.matched.length === 0) return
    const ok = await confirm({
      title: t('admin_rangs.import_titol', 'Importar rangs'),
      message: t('admin_rangs.import_confirm', 'Es sobreescriuran els rangs de {{n}} camps. Continuar?', { n: importPreview.matched.length }),
      confirmLabel: t('admin_rangs.importar', 'Importar'),
      cancelLabel: t('common.cancellar'),
    })
    if (!ok) return
    setImportOpen(false)
    for (const m of importPreview.matched) {
      const perCamp = { ...(rangs[m.destCamp.id] || {}) }
      for (const [k, v] of Object.entries(m.rangsFiltrats)) {
        perCamp[k] = v
      }
      setRangs(prev => ({ ...prev, [m.destCamp.id]: perCamp }))
      try {
        await editarCamp(m.destCamp.id, { rangs_condicionals: perCamp })
      } catch (err) {
        addToast(err.message, 'error')
        return
      }
    }
    addToast(t('admin_rangs.import_ok', 'Rangs importats a {{n}} camps', { n: importPreview.matched.length }))
    await fetchData()
  }

  // --- Rendering ---
  if (loading) return <LoadingBlock label={t('common.carregant')} />
  if (!tipus) return <p>{t('common.tipus_no_trobat')}</p>

  if (!controladorCamp) {
    return (
      <>
        <Breadcrumbs items={[
          { label: t('admin_seccions.breadcrumb_tipus'), to: '/admin/tipus' },
          { label: tipus.nom, to: `/admin/tipus/${tipusId}/seccions` },
          { label: t('nav.rangs') },
        ]} />
        <h1>{t('admin_rangs.titol', 'Rangs')}</h1>
        <EmptyState
          icon={<Icon name="SlidersHorizontal" size={40} />}
          title={t('admin_rangs.no_controlador', 'Aquest tipus no té camp controlador configurat.')}
          description={t('admin_rangs.no_controlador_desc')}
          action={
            <Link to={`/admin/tipus/${tipusId}/seccions`} className="btn btn-primary">
              <Icon name="Layers" size={14} />
              <span>{t('admin_rangs.anar_a_seccions', 'Configurar seccions')}</span>
            </Link>
          }
        />
      </>
    )
  }

  if (totalCamps === 0) {
    return (
      <>
        <Breadcrumbs items={[
          { label: t('admin_seccions.breadcrumb_tipus'), to: '/admin/tipus' },
          { label: tipus.nom, to: `/admin/tipus/${tipusId}/seccions` },
          { label: t('nav.rangs') },
        ]} />
        <h1>{t('admin_rangs.titol', 'Rangs')}</h1>
        <EmptyState
          icon={<Icon name="Ruler" size={40} />}
          title={t('admin_rangs.no_camps_numerics')}
          description={t('admin_rangs.no_camps_numerics_desc')}
          action={
            <Link to={`/admin/tipus/${tipusId}/seccions`} className="btn btn-primary">
              <Icon name="Layers" size={14} />
              <span>{t('admin_rangs.anar_a_seccions', 'Configurar seccions')}</span>
            </Link>
          }
        />
      </>
    )
  }

  const activeConfigured = countConfigured(activeValor)
  const otherValorsWithRangs = opcions.filter(op => op !== activeValor && countConfigured(op) > 0)

  return (
    <>
      <Breadcrumbs items={[
        { label: t('admin_seccions.breadcrumb_tipus'), to: '/admin/tipus' },
        { label: tipus.nom, to: `/admin/tipus/${tipusId}/seccions` },
        { label: t('nav.rangs') },
      ]} />

      <div className="admin-header">
        <hgroup>
          <h1>{t('admin_rangs.titol', 'Rangs')} — {tipus.nom}</h1>
          <p>{t('admin_rangs.subtitol_wizard', 'Selecciona un valor de «{{camp}}» i configura els rangs mín/màx per aquest valor. Els canvis es desen automàticament.', { camp: controladorCamp.label })}</p>
        </hgroup>
        <div className="admin-header-actions">
          <Button variant="outline" size="sm" icon={<Icon name="Table2" size={14} />} onClick={() => setCompareOpen(true)}>
            {t('admin_rangs.veure_comparativa', 'Vista comparativa')}
          </Button>
          <Button variant="outline" size="sm" icon={<Icon name="Download" size={14} />} onClick={openImport}>
            {t('admin_rangs.importar_de', 'Importar d\'un altre tipus')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <Icon name="AlertCircle" size={14} />
          <span>{error}</span>
        </div>
      )}

      <div className="rangs-wizard-tabs" role="tablist">
        {opcions.map(op => {
          const n = countConfigured(op)
          const isFull = n === totalCamps && totalCamps > 0
          const isActive = op === activeValor
          return (
            <button
              key={op}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`rangs-wizard-tab${isActive ? ' is-active' : ''}${isFull ? ' is-full' : ''}${n === 0 ? ' is-empty' : ''}`}
              onClick={() => setActiveValor(op)}
            >
              <span className="rangs-wizard-tab-label">{op}</span>
              <span className="rangs-wizard-tab-count">
                {isFull && <Icon name="Check" size={12} />}
                {!isFull && `${n}/${totalCamps}`}
              </span>
            </button>
          )
        })}
      </div>

      <div className="rangs-wizard-toolbar">
        <div className="rangs-wizard-toolbar-info">
          <strong>{activeValor}</strong>
          <span className="rangs-wizard-toolbar-count">
            {t('admin_rangs.progres', '{{n}} de {{total}} camps configurats', { n: activeConfigured, total: totalCamps })}
          </span>
        </div>
        <div className="rangs-wizard-toolbar-actions">
          {otherValorsWithRangs.length > 0 && (
            <select
              value=""
              onChange={(e) => { if (e.target.value) handleCopyFrom(e.target.value) }}
              className="rangs-copy-select"
              aria-label={t('admin_rangs.copiar_de', 'Copiar de...')}
            >
              <option value="">{t('admin_rangs.copiar_de', 'Copiar de…')}</option>
              {otherValorsWithRangs.map(op => (
                <option key={op} value={op}>{op} ({countConfigured(op)})</option>
              ))}
            </select>
          )}
          {activeConfigured > 0 && opcions.length > 1 && (
            <Button variant="outline" size="sm" icon={<Icon name="Copy" size={12} />} onClick={openBulk}>
              {t('admin_rangs.aplicar_a', 'Aplicar a...')}
            </Button>
          )}
          {activeConfigured > 0 && (
            <Button variant="ghost" size="sm" icon={<Icon name="Trash2" size={12} />} onClick={handleNetejar}>
              {t('admin_rangs.netejar', 'Netejar')}
            </Button>
          )}
        </div>
      </div>

      <div className="rangs-wizard-fields">
        {seccionsAmbCamps.map(s => (
          <div key={s.id} className="rangs-wizard-section">
            <h3 className="rangs-wizard-section-title">{s.titol}</h3>
            <div className="rangs-wizard-camp-list">
              <div className="rangs-wizard-camp-header">
                <span></span>
                <span className="rangs-wizard-camp-header-label">{t('admin_camps.minim')}</span>
                <span className="rangs-wizard-camp-header-label">{t('admin_camps.maxim')}</span>
                <span></span>
              </div>
              {s.camps.map(c => {
                const rang = rangs[c.id]?.[activeValor] || {}
                const minState = cellStates[`${c.id}:min`]
                const maxState = cellStates[`${c.id}:max`]
                const isConfigured = rang.min != null || rang.max != null
                return (
                  <div key={c.id} className={`rangs-wizard-camp-row${isConfigured ? ' is-configured' : ''}`}>
                    <label className="rangs-wizard-camp-label">{c.label}</label>
                    <RangCell initialValue={rang.min} cellState={minState} onCommit={(v) => updateAndSave(c.id, activeValor, 'min', v)} ariaLabel={`${c.label} min`} />
                    <RangCell initialValue={rang.max} cellState={maxState} onCommit={(v) => updateAndSave(c.id, activeValor, 'max', v)} ariaLabel={`${c.label} max`} />
                    <span className="rangs-wizard-camp-fallback">
                      {(c.alerta_min != null || c.alerta_max != null) && !isConfigured && (
                        <small title={t('admin_rangs.fallback_hint')}>
                          <Icon name="AlertCircle" size={11} /> {t('admin_rangs.fallback', 'usa estàtic')}
                        </small>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ===== Modal: Vista comparativa (matriu read-only) ===== */}
      <Modal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        title={t('admin_rangs.vista_comparativa', 'Vista comparativa de tots els rangs')}
        size="xl"
        footer={<Button variant="primary" onClick={() => setCompareOpen(false)}>{t('common.tancar', 'Tancar')}</Button>}
      >
        <p><small>{t('admin_rangs.vista_comparativa_desc', 'Matriu de només lectura amb tots els valors × camps. Verd = configurat, groc = usa estàtic, gris = sense rang.')}</small></p>
        <div className="rangs-compare-wrap">
          <table className="rangs-compare-table">
            <thead>
              <tr>
                <th className="rangs-compare-th-controller">{controladorCamp.label}</th>
                {allCamps.map(c => (
                  <th key={c.id} className="rangs-compare-th-camp">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {opcions.map(op => (
                <tr key={op}>
                  <td className="rangs-compare-td-val"><strong>{op}</strong></td>
                  {allCamps.map(c => {
                    const r = rangs[c.id]?.[op]
                    const hasR = r && (r.min != null || r.max != null)
                    const hasStatic = c.alerta_min != null || c.alerta_max != null
                    const cls = hasR ? 'is-configured' : (hasStatic ? 'is-fallback' : 'is-empty')
                    let label = '—'
                    if (hasR) {
                      const mn = r.min != null ? r.min : '−∞'
                      const mx = r.max != null ? r.max : '+∞'
                      label = `${mn} / ${mx}`
                    } else if (hasStatic) {
                      const mn = c.alerta_min != null ? c.alerta_min : '−∞'
                      const mx = c.alerta_max != null ? c.alerta_max : '+∞'
                      label = `${mn} / ${mx}`
                    }
                    return (
                      <td key={c.id} className={`rangs-compare-td ${cls}`} title={label}>
                        {label}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* ===== Modal: Bulk apply ===== */}
      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title={t('admin_rangs.bulk_titol', 'Aplicar els rangs de «{{valor}}» a altres valors', { valor: activeValor })}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setBulkOpen(false)}>{t('common.cancellar')}</Button>
            <Button variant="primary" disabled={bulkTargets.size === 0} onClick={handleBulkApply}>
              {t('admin_rangs.aplicar_a_n', 'Aplicar a {{n}} valors', { n: bulkTargets.size })}
            </Button>
          </>
        }
      >
        <p><small>{t('admin_rangs.bulk_desc', 'Selecciona a quins altres valors del controlador vols copiar els rangs actualment configurats a «{{valor}}». Els valors existents als destins seran sobreescrits.', { valor: activeValor })}</small></p>
        <div className="rangs-bulk-list">
          {opcions.filter(op => op !== activeValor).map(op => (
            <label key={op} className="rangs-bulk-item">
              <input
                type="checkbox"
                checked={bulkTargets.has(op)}
                onChange={() => toggleBulkTarget(op)}
              />
              <span>{op}</span>
              <span className="rangs-bulk-item-count">
                {countConfigured(op) > 0 ? t('admin_rangs.te_n_configurats', '{{n}} configurats', { n: countConfigured(op) }) : t('admin_rangs.buit', 'buit')}
              </span>
            </label>
          ))}
        </div>
        <div className="rangs-bulk-actions">
          <Button variant="ghost" size="sm" onClick={() => setBulkTargets(new Set(opcions.filter(op => op !== activeValor)))}>
            {t('common.seleccionar_tots', 'Seleccionar tots')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setBulkTargets(new Set())}>
            {t('common.desseleccionar', 'Desseleccionar')}
          </Button>
        </div>
      </Modal>

      {/* ===== Modal: Import from other tipus ===== */}
      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title={t('admin_rangs.importar_titol', 'Importar rangs d\'un altre tipus')}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setImportOpen(false)}>{t('common.cancellar')}</Button>
            <Button
              variant="primary"
              disabled={!importPreview || importPreview.matched.length === 0}
              onClick={handleImportApply}
            >
              {t('admin_rangs.importar', 'Importar')}
            </Button>
          </>
        }
      >
        {otherTipus.length === 0 ? (
          <p><small>{t('admin_rangs.import_cap_tipus', 'Cap altre tipus té rangs condicionals configurats.')}</small></p>
        ) : (
          <>
            <label>
              {t('admin_rangs.import_source', 'Tipus font')}
              <select value={importFromId} onChange={(e) => setImportFromId(e.target.value)}>
                <option value="">{t('common.selecciona', '— Selecciona —')}</option>
                {otherTipus.map(tp => (
                  <option key={tp.id} value={tp.id}>{tp.nom}</option>
                ))}
              </select>
            </label>

            {importPreview && (
              <div className="rangs-import-preview">
                <h4>{t('admin_rangs.import_previa', 'Previsualització')}</h4>
                {importPreview.matched.length === 0 ? (
                  <div className="alert alert-warning">
                    <Icon name="AlertCircle" size={14} />
                    <span>{t('admin_rangs.import_no_match', 'No hi ha camps coincidents amb rangs (per nom intern i valors del controlador).')}</span>
                  </div>
                ) : (
                  <>
                    <p><small>
                      {t('admin_rangs.import_summary', 'Es copiaran rangs a {{n}} camps ({{v}} valors del controlador coincidents).', {
                        n: importPreview.matched.length,
                        v: importPreview.matchingValues.length,
                      })}
                    </small></p>
                    <ul className="rangs-import-list">
                      {importPreview.matched.map(m => (
                        <li key={m.destCamp.id}>
                          <code>{m.destCamp.name}</code> — {m.destCamp.label}
                          <span className="rangs-import-badge">{Object.keys(m.rangsFiltrats).length} {t('admin_rangs.valors', 'valors')}</span>
                        </li>
                      ))}
                    </ul>
                    <p><small className="rangs-import-warn">
                      <Icon name="AlertCircle" size={12} /> {t('admin_rangs.import_warn', 'Els valors existents als camps destí seran sobreescrits pels del tipus font.')}
                    </small></p>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  )
}
