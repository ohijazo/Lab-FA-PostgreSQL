import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { obtenirTipusAdmin, editarCamp } from '../api/admin'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import Breadcrumbs from '../components/ui/Breadcrumbs'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import LoadingBlock from '../components/ui/LoadingBlock'
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
    // Validar num (o buit)
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
  // rangs: { campId: { valor: {min, max} } }
  const [rangs, setRangs] = useState({})
  const [activeValor, setActiveValor] = useState('')
  // Cell state: { "campId:min" | "campId:max" : 'saving'|'saved'|'error' }
  const [cellStates, setCellStates] = useState({})

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

  // Set valor actiu inicial (primer valor)
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

  // Nombre de camps amb rang (min OR max) configurat per un valor concret
  function countConfigured(valor) {
    if (!valor) return 0
    let n = 0
    for (const s of seccionsAmbCamps) {
      for (const c of s.camps) {
        const r = rangs[c.id]?.[valor]
        if (r && (r.min != null || r.max != null)) n++
      }
    }
    return n
  }

  // Actualitza estat local + autosave al backend per un camp concret
  async function updateAndSave(campId, valor, minMax, newVal) {
    // Update local
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
      // Flash "✓" per 1.5s
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

    // Per cada camp, si té rang a fromValor, copia-ho a activeValor i persisteix
    for (const s of seccionsAmbCamps) {
      for (const c of s.camps) {
        const fromRang = rangs[c.id]?.[fromValor]
        if (!fromRang) continue
        // Actualitzar local + backend
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

    for (const s of seccionsAmbCamps) {
      for (const c of s.camps) {
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
    }
    addToast(t('admin_rangs.netejats', 'Rangs esborrats'))
    await fetchData()
  }

  if (loading) return <LoadingBlock label={t('common.carregant')} />
  if (!tipus) return <p>{t('common.tipus_no_trobat')}</p>

  // Empty state: sense controlador
  if (!controladorCamp) {
    return (
      <>
        <Breadcrumbs
          items={[
            { label: t('admin_seccions.breadcrumb_tipus'), to: '/admin/tipus' },
            { label: tipus.nom, to: `/admin/tipus/${tipusId}/seccions` },
            { label: t('nav.rangs') },
          ]}
        />
        <h1>{t('admin_rangs.titol', 'Taula de rangs')}</h1>
        <EmptyState
          icon={<Icon name="SlidersHorizontal" size={40} />}
          title={t('admin_rangs.no_controlador', 'Aquest tipus no té camp controlador configurat.')}
          description={t('admin_rangs.no_controlador_desc', "El camp controlador (de tipus 'select') determina els rangs vàlids segons el valor triat. Configura'l des de la pàgina de seccions.")}
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

  // Empty state: sense camps numèrics
  if (totalCamps === 0) {
    return (
      <>
        <Breadcrumbs
          items={[
            { label: t('admin_seccions.breadcrumb_tipus'), to: '/admin/tipus' },
            { label: tipus.nom, to: `/admin/tipus/${tipusId}/seccions` },
            { label: t('nav.rangs') },
          ]}
        />
        <h1>{t('admin_rangs.titol', 'Taula de rangs')}</h1>
        <EmptyState
          icon={<Icon name="Ruler" size={40} />}
          title={t('admin_rangs.no_camps_numerics', 'No hi ha camps numèrics per configurar.')}
          description={t('admin_rangs.no_camps_numerics_desc', "Afegeix camps de tipus 'número' a alguna secció per poder-los configurar aquí.")}
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

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t('admin_seccions.breadcrumb_tipus'), to: '/admin/tipus' },
          { label: tipus.nom, to: `/admin/tipus/${tipusId}/seccions` },
          { label: t('nav.rangs') },
        ]}
      />

      <div className="admin-header">
        <hgroup>
          <h1>{t('admin_rangs.titol', 'Rangs')} — {tipus.nom}</h1>
          <p>{t('admin_rangs.subtitol_wizard', 'Selecciona un valor de «{{camp}}» i configura els rangs mín/màx per aquest valor. Els canvis es desen automàticament.', { camp: controladorCamp.label })}</p>
        </hgroup>
      </div>

      {error && (
        <div className="alert alert-danger">
          <Icon name="AlertCircle" size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs sticky: un per cada valor del controlador amb comptador */}
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

      {/* Sub-toolbar del valor actiu */}
      <div className="rangs-wizard-toolbar">
        <div className="rangs-wizard-toolbar-info">
          <strong>{activeValor}</strong>
          <span className="rangs-wizard-toolbar-count">
            {t('admin_rangs.progres', '{{n}} de {{total}} camps configurats', { n: activeConfigured, total: totalCamps })}
          </span>
        </div>
        <div className="rangs-wizard-toolbar-actions">
          {opcions.length > 1 && (
            <select
              value=""
              onChange={(e) => { if (e.target.value) handleCopyFrom(e.target.value) }}
              className="rangs-copy-select"
              aria-label={t('admin_rangs.copiar_de', 'Copiar de...')}
            >
              <option value="">{t('admin_rangs.copiar_de', 'Copiar de…')}</option>
              {opcions.filter(op => op !== activeValor && countConfigured(op) > 0).map(op => (
                <option key={op} value={op}>{op} ({countConfigured(op)})</option>
              ))}
            </select>
          )}
          {activeConfigured > 0 && (
            <Button variant="ghost" size="sm" icon={<Icon name="Trash2" size={12} />} onClick={handleNetejar}>
              {t('admin_rangs.netejar', 'Netejar')}
            </Button>
          )}
        </div>
      </div>

      {/* Camps agrupats per secció */}
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
                    <label className="rangs-wizard-camp-label">
                      {c.label}
                    </label>
                    <RangCell
                      initialValue={rang.min}
                      cellState={minState}
                      onCommit={(v) => updateAndSave(c.id, activeValor, 'min', v)}
                      ariaLabel={`${c.label} min`}
                    />
                    <RangCell
                      initialValue={rang.max}
                      cellState={maxState}
                      onCommit={(v) => updateAndSave(c.id, activeValor, 'max', v)}
                      ariaLabel={`${c.label} max`}
                    />
                    <span className="rangs-wizard-camp-fallback">
                      {(c.alerta_min != null || c.alerta_max != null) && !isConfigured && (
                        <small title={t('admin_rangs.fallback_hint', 'Usarà els rangs estàtics del camp si no es configura aquí')}>
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
    </>
  )
}
